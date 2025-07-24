const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Activity = require('../models/Activity');
const Baby = require('../models/Baby');
const { auth, familyAccess } = require('../middleware/auth');

const router = express.Router();

// Create new activity
router.post('/', auth, [
  body('babyId').isMongoId(),
  body('type').isIn(['feeding', 'diaper', 'sleep', 'mood', 'health', 'milestone', 'medication', 'other']),
  body('timestamp').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { babyId, type, timestamp, ...activityData } = req.body;

    // Check if baby exists and user has access
    const baby = await Baby.findById(babyId).populate('family');
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to add activities for this baby' });
    }

    // Create activity
    const activity = new Activity({
      baby: babyId,
      recordedBy: req.user._id,
      type,
      timestamp: timestamp || new Date(),
      ...activityData
    });

    await activity.save();
    await activity.populate(['baby', 'recordedBy'], 'name firstName lastName');

    res.status(201).json({
      message: 'Activity recorded successfully',
      activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activities for a baby
router.get('/baby/:babyId', auth, [
  param('babyId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { babyId } = req.params;
    const { type, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Check baby access
    const baby = await Baby.findById(babyId).populate('family');
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    if (!baby.family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view activities for this baby' });
    }

    // Build query
    const query = { baby: babyId };
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .populate('recordedBy', 'firstName lastName')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity by ID
router.get('/:id', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const activity = await Activity.findById(req.params.id)
      .populate('baby', 'name family')
      .populate('recordedBy', 'firstName lastName');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check access through baby's family
    const baby = await Baby.findById(activity.baby._id).populate('family');
    if (!baby.family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view this activity' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update activity
router.put('/:id', auth, [
  param('id').isMongoId(),
  body('type').optional().isIn(['feeding', 'diaper', 'sleep', 'mood', 'health', 'milestone', 'medication', 'other']),
  body('timestamp').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const activity = await Activity.findById(req.params.id).populate('baby');
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check access
    const baby = await Baby.findById(activity.baby._id).populate('family');
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit this activity' });
    }

    // Update activity
    Object.assign(activity, req.body);
    await activity.save();
    await activity.populate(['baby', 'recordedBy'], 'name firstName lastName');

    res.json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete activity
router.delete('/:id', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const activity = await Activity.findById(req.params.id).populate('baby');
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check access
    const baby = await Baby.findById(activity.baby._id).populate('family');
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to delete this activity' });
    }

    await Activity.findByIdAndDelete(req.params.id);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity summary/analytics
router.get('/baby/:babyId/summary', auth, [
  param('babyId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    // Check baby access
    const baby = await Baby.findById(babyId).populate('family');
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    if (!baby.family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view activities for this baby' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get activity summary
    const summary = await Activity.getActivitySummary(babyId, start, end);

    // Get latest activities
    const latestActivities = await Activity.find({
      baby: babyId,
      timestamp: { $gte: start, $lte: end }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('recordedBy', 'firstName lastName');

    // Calculate specific metrics
    const sleepActivities = await Activity.find({
      baby: babyId,
      type: 'sleep',
      timestamp: { $gte: start, $lte: end }
    });

    const totalSleepTime = sleepActivities.reduce((total, activity) => {
      return total + (activity.sleep.duration || 0);
    }, 0);

    const feedingCount = await Activity.countDocuments({
      baby: babyId,
      type: 'feeding',
      timestamp: { $gte: start, $lte: end }
    });

    const diaperChanges = await Activity.countDocuments({
      baby: babyId,
      type: 'diaper',
      timestamp: { $gte: start, $lte: end }
    });

    res.json({
      summary: summary.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          lastActivity: item.lastActivity
        };
        return acc;
      }, {}),
      metrics: {
        totalSleepTime: Math.round(totalSleepTime / 60 * 100) / 100, // hours
        feedingCount,
        diaperChanges,
        averageSleepPerDay: Math.round(totalSleepTime / (7 * 60) * 100) / 100 // hours per day
      },
      latestActivities,
      period: {
        start,
        end
      }
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's activities
router.get('/baby/:babyId/today', auth, [
  param('babyId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { babyId } = req.params;

    // Check baby access
    const baby = await Baby.findById(babyId).populate('family');
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    if (!baby.family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view activities for this baby' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const activities = await Activity.find({
      baby: babyId,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('recordedBy', 'firstName lastName')
    .sort({ timestamp: -1 });

    // Get last activities of each type for quick status
    const lastFeeding = await Activity.findOne({
      baby: babyId,
      type: 'feeding'
    }).sort({ timestamp: -1 });

    const lastDiaper = await Activity.findOne({
      baby: babyId,
      type: 'diaper'
    }).sort({ timestamp: -1 });

    const lastSleep = await Activity.findOne({
      baby: babyId,
      type: 'sleep'
    }).sort({ timestamp: -1 });

    res.json({
      todaysActivities: activities,
      lastActivities: {
        feeding: lastFeeding,
        diaper: lastDiaper,
        sleep: lastSleep
      }
    });
  } catch (error) {
    console.error('Get today activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;