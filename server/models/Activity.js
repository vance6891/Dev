const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  baby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby',
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['feeding', 'diaper', 'sleep', 'mood', 'health', 'milestone', 'medication', 'other'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Feeding specific data
  feeding: {
    method: {
      type: String,
      enum: ['breastfeeding', 'bottle', 'solid_food', 'mixed']
    },
    duration: Number, // in minutes
    amount: {
      value: Number,
      unit: {
        type: String,
        enum: ['ml', 'oz', 'cups']
      }
    },
    side: {
      type: String,
      enum: ['left', 'right', 'both'] // for breastfeeding
    },
    foodType: String, // for solid foods
    notes: String
  },
  // Diaper change data
  diaper: {
    type: {
      type: String,
      enum: ['wet', 'soiled', 'mixed', 'dry']
    },
    brand: String,
    size: String,
    rash: {
      present: Boolean,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      location: String,
      treatment: String
    },
    notes: String
  },
  // Sleep data
  sleep: {
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'restless']
    },
    location: {
      type: String,
      enum: ['crib', 'bassinet', 'parent_bed', 'stroller', 'car_seat', 'other']
    },
    notes: String
  },
  // Mood data
  mood: {
    state: {
      type: String,
      enum: ['happy', 'content', 'fussy', 'crying', 'sleeping', 'alert', 'cranky', 'sick'],
      required: true
    },
    intensity: {
      type: Number,
      min: 1,
      max: 5 // 1 = mild, 5 = intense
    },
    triggers: [String],
    duration: Number, // in minutes
    notes: String
  },
  // Health data
  health: {
    condition: {
      type: String,
      enum: ['fever', 'colic', 'reflux', 'constipation', 'diarrhea', 'rash', 'cold', 'cough', 'vomiting', 'other']
    },
    symptoms: [String],
    temperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    treatment: String,
    doctorVisit: {
      scheduled: Boolean,
      date: Date,
      notes: String
    },
    resolved: {
      type: Boolean,
      default: false
    },
    notes: String
  },
  // General notes and attachments
  notes: String,
  attachments: [{
    type: String, // URL to photo/video
    description: String
  }],
  // Calendar sync
  calendarEventId: String,
  syncedToCalendar: {
    type: Boolean,
    default: false
  },
  // Tags for categorization
  tags: [String]
}, {
  timestamps: true
});

// Index for better performance
ActivitySchema.index({ baby: 1, timestamp: -1 });
ActivitySchema.index({ type: 1, timestamp: -1 });
ActivitySchema.index({ recordedBy: 1, timestamp: -1 });

// Virtual for duration calculation (for sleep activities)
ActivitySchema.virtual('calculatedDuration').get(function() {
  if (this.type === 'sleep' && this.sleep.startTime && this.sleep.endTime) {
    const start = new Date(this.sleep.startTime);
    const end = new Date(this.sleep.endTime);
    return Math.round((end - start) / (1000 * 60)); // duration in minutes
  }
  return null;
});

// Pre-save middleware to calculate sleep duration
ActivitySchema.pre('save', function(next) {
  if (this.type === 'sleep' && this.sleep.startTime && this.sleep.endTime) {
    const start = new Date(this.sleep.startTime);
    const end = new Date(this.sleep.endTime);
    this.sleep.duration = Math.round((end - start) / (1000 * 60));
  }
  next();
});

// Static methods for analytics
ActivitySchema.statics.getActivitySummary = function(babyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        baby: babyId,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    }
  ]);
};

module.exports = mongoose.model('Activity', ActivitySchema);