const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other'],
      required: true
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true
      },
      canEdit: {
        type: Boolean,
        default: true
      },
      canInvite: {
        type: Boolean,
        default: false
      },
      canManageFamily: {
        type: Boolean,
        default: false
      }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  babies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Baby'
  }],
  invitations: [{
    email: String,
    role: String,
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
    },
    token: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    }
  }],
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    units: {
      weight: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      },
      length: {
        type: String,
        enum: ['cm', 'inches'],
        default: 'cm'
      },
      temperature: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      },
      volume: {
        type: String,
        enum: ['ml', 'oz'],
        default: 'ml'
      }
    },
    privacy: {
      shareData: {
        type: Boolean,
        default: false
      },
      allowInvitations: {
        type: Boolean,
        default: true
      }
    },
    notifications: {
      emailUpdates: {
        type: Boolean,
        default: true
      },
      activityReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
FamilySchema.index({ 'members.user': 1 });
FamilySchema.index({ 'invitations.email': 1 });

// Virtual for family admin
FamilySchema.virtual('admins').get(function() {
  return this.members.filter(member => 
    member.permissions.canManageFamily && member.isActive
  );
});

// Method to check if user is family member
FamilySchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
};

// Method to get user's permissions in family
FamilySchema.methods.getUserPermissions = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
  return member ? member.permissions : null;
};

// Method to check if user can perform action
FamilySchema.methods.canUserPerform = function(userId, action) {
  const permissions = this.getUserPermissions(userId);
  if (!permissions) return false;
  
  switch (action) {
    case 'view':
      return permissions.canView;
    case 'edit':
      return permissions.canEdit;
    case 'invite':
      return permissions.canInvite;
    case 'manage':
      return permissions.canManageFamily;
    default:
      return false;
  }
};

module.exports = mongoose.model('Family', FamilySchema);