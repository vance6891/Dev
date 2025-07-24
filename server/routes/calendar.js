const express = require('express');
const { google } = require('googleapis');
const { body, validationResult, param } = require('express-validator');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Baby = require('../models/Baby');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper function to get OAuth2 client for user
const getUserOAuth2Client = (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (user.googleTokens) {
    oauth2Client.setCredentials({
      access_token: user.googleTokens.access_token,
      refresh_token: user.googleTokens.refresh_token,
      expiry_date: user.googleTokens.expiry_date
    });
  }

  return oauth2Client;
};

// Helper function to refresh tokens if needed
const refreshTokensIfNeeded = async (user, oauth2Client) => {
  try {
    if (user.googleTokens.expiry_date && new Date() >= user.googleTokens.expiry_date) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      user.googleTokens = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || user.googleTokens.refresh_token,
        expiry_date: new Date(credentials.expiry_date)
      };
      
      await user.save();
      oauth2Client.setCredentials(credentials);
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh Google tokens');
  }
};

// Get calendar authorization status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const hasGoogleAuth = !!(user.googleTokens && user.googleTokens.access_token);
    
    if (hasGoogleAuth) {
      const oauth2Client = getUserOAuth2Client(user);
      
      try {
        await refreshTokensIfNeeded(user, oauth2Client);
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Test calendar access
        const calendarList = await calendar.calendarList.list({
          maxResults: 1
        });
        
        res.json({
          connected: true,
          calendarsCount: calendarList.data.items ? calendarList.data.items.length : 0
        });
      } catch (error) {
        res.json({
          connected: false,
          error: 'Calendar access denied or tokens expired'
        });
      }
    } else {
      res.json({
        connected: false,
        error: 'No Google authentication found'
      });
    }
  } catch (error) {
    console.error('Calendar status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's calendars
router.get('/calendars', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.googleTokens || !user.googleTokens.access_token) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    const oauth2Client = getUserOAuth2Client(user);
    await refreshTokensIfNeeded(user, oauth2Client);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const calendarList = await calendar.calendarList.list();
    
    const calendars = calendarList.data.items.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
      accessRole: cal.accessRole
    }));
    
    res.json({ calendars });
  } catch (error) {
    console.error('Get calendars error:', error);
    res.status(500).json({ message: 'Failed to fetch calendars' });
  }
});

// Sync activity to calendar
router.post('/sync-activity', auth, [
  body('activityId').isMongoId(),
  body('calendarId').isString().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activityId, calendarId = 'primary' } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user.googleTokens || !user.googleTokens.access_token) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    const activity = await Activity.findById(activityId)
      .populate('baby', 'name')
      .populate('recordedBy', 'firstName lastName');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Check if activity already synced
    if (activity.syncedToCalendar && activity.calendarEventId) {
      return res.status(400).json({ message: 'Activity already synced to calendar' });
    }
    
    const oauth2Client = getUserOAuth2Client(user);
    await refreshTokensIfNeeded(user, oauth2Client);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Create event based on activity type
    const event = createCalendarEvent(activity);
    
    const response = await calendar.events.insert({
      calendarId,
      resource: event
    });
    
    // Update activity with calendar event ID
    activity.calendarEventId = response.data.id;
    activity.syncedToCalendar = true;
    await activity.save();
    
    res.json({
      message: 'Activity synced to calendar successfully',
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    });
  } catch (error) {
    console.error('Sync activity error:', error);
    res.status(500).json({ message: 'Failed to sync activity to calendar' });
  }
});

// Helper function to create calendar event from activity
const createCalendarEvent = (activity) => {
  const baby = activity.baby;
  const recordedBy = activity.recordedBy;
  
  let summary, description;
  
  switch (activity.type) {
    case 'feeding':
      summary = `${baby.name} - Feeding`;
      description = `Feeding session for ${baby.name}\n`;
      if (activity.feeding.method) {
        description += `Method: ${activity.feeding.method}\n`;
      }
      if (activity.feeding.duration) {
        description += `Duration: ${activity.feeding.duration} minutes\n`;
      }
      if (activity.feeding.amount) {
        description += `Amount: ${activity.feeding.amount.value} ${activity.feeding.amount.unit}\n`;
      }
      break;
      
    case 'sleep':
      summary = `${baby.name} - Sleep`;
      description = `Sleep session for ${baby.name}\n`;
      if (activity.sleep.duration) {
        description += `Duration: ${Math.floor(activity.sleep.duration / 60)}h ${activity.sleep.duration % 60}m\n`;
      }
      if (activity.sleep.quality) {
        description += `Quality: ${activity.sleep.quality}\n`;
      }
      break;
      
    case 'diaper':
      summary = `${baby.name} - Diaper Change`;
      description = `Diaper change for ${baby.name}\n`;
      if (activity.diaper.type) {
        description += `Type: ${activity.diaper.type}\n`;
      }
      break;
      
    case 'mood':
      summary = `${baby.name} - Mood: ${activity.mood.state}`;
      description = `Mood tracking for ${baby.name}\n`;
      description += `State: ${activity.mood.state}\n`;
      if (activity.mood.intensity) {
        description += `Intensity: ${activity.mood.intensity}/5\n`;
      }
      break;
      
    case 'health':
      summary = `${baby.name} - Health: ${activity.health.condition}`;
      description = `Health update for ${baby.name}\n`;
      description += `Condition: ${activity.health.condition}\n`;
      if (activity.health.severity) {
        description += `Severity: ${activity.health.severity}\n`;
      }
      break;
      
    default:
      summary = `${baby.name} - ${activity.type}`;
      description = `${activity.type} activity for ${baby.name}\n`;
  }
  
  description += `\nRecorded by: ${recordedBy.firstName} ${recordedBy.lastName}`;
  
  if (activity.notes) {
    description += `\nNotes: ${activity.notes}`;
  }
  
  const startTime = new Date(activity.timestamp);
  let endTime = new Date(startTime);
  
  // Set duration based on activity type
  if (activity.type === 'sleep' && activity.sleep.duration) {
    endTime = new Date(startTime.getTime() + activity.sleep.duration * 60000);
  } else if (activity.type === 'feeding' && activity.feeding.duration) {
    endTime = new Date(startTime.getTime() + activity.feeding.duration * 60000);
  } else {
    // Default 15 minute duration for other activities
    endTime = new Date(startTime.getTime() + 15 * 60000);
  }
  
  return {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC'
    },
    colorId: getColorIdForActivityType(activity.type)
  };
};

// Helper function to get color for activity type
const getColorIdForActivityType = (type) => {
  const colors = {
    feeding: '2', // green
    sleep: '9',   // blue
    diaper: '6',  // orange
    mood: '5',    // yellow
    health: '11', // red
    milestone: '10' // purple
  };
  return colors[type] || '1'; // default blue
};

// Bulk sync activities
router.post('/sync-activities', auth, [
  body('babyId').isMongoId(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('activityTypes').isArray().optional(),
  body('calendarId').isString().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { babyId, startDate, endDate, activityTypes, calendarId = 'primary' } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user.googleTokens || !user.googleTokens.access_token) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    // Build query for activities
    const query = {
      baby: babyId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      syncedToCalendar: false
    };
    
    if (activityTypes && activityTypes.length > 0) {
      query.type = { $in: activityTypes };
    }
    
    const activities = await Activity.find(query)
      .populate('baby', 'name')
      .populate('recordedBy', 'firstName lastName')
      .limit(50); // Limit to prevent rate limiting
    
    if (activities.length === 0) {
      return res.json({ 
        message: 'No activities to sync',
        synced: 0 
      });
    }
    
    const oauth2Client = getUserOAuth2Client(user);
    await refreshTokensIfNeeded(user, oauth2Client);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    let syncedCount = 0;
    const errors = [];
    
    for (const activity of activities) {
      try {
        const event = createCalendarEvent(activity);
        
        const response = await calendar.events.insert({
          calendarId,
          resource: event
        });
        
        activity.calendarEventId = response.data.id;
        activity.syncedToCalendar = true;
        await activity.save();
        
        syncedCount++;
        
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push({
          activityId: activity._id,
          error: error.message
        });
      }
    }
    
    res.json({
      message: `Synced ${syncedCount} activities to calendar`,
      synced: syncedCount,
      total: activities.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({ message: 'Failed to sync activities to calendar' });
  }
});

// Remove activity from calendar
router.delete('/sync-activity/:activityId', auth, [
  param('activityId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activityId } = req.params;
    const { calendarId = 'primary' } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user.googleTokens || !user.googleTokens.access_token) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    if (!activity.syncedToCalendar || !activity.calendarEventId) {
      return res.status(400).json({ message: 'Activity not synced to calendar' });
    }
    
    const oauth2Client = getUserOAuth2Client(user);
    await refreshTokensIfNeeded(user, oauth2Client);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
      await calendar.events.delete({
        calendarId,
        eventId: activity.calendarEventId
      });
    } catch (error) {
      // Event might already be deleted or not found
      console.warn('Calendar event deletion warning:', error.message);
    }
    
    // Update activity
    activity.calendarEventId = null;
    activity.syncedToCalendar = false;
    await activity.save();
    
    res.json({ message: 'Activity removed from calendar successfully' });
  } catch (error) {
    console.error('Remove sync error:', error);
    res.status(500).json({ message: 'Failed to remove activity from calendar' });
  }
});

module.exports = router;