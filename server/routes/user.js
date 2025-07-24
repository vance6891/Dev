const express = require('express');
const { body, validationResult, param } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Family = require('../models/Family');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's families
router.get('/families', auth, async (req, res) => {
  try {
    const families = await Family.find({
      'members.user': req.user._id,
      'members.isActive': true,
      isActive: true
    }).populate([
      {
        path: 'members.user',
        select: 'firstName lastName email profilePicture'
      },
      {
        path: 'babies',
        select: 'name dateOfBirth profilePicture'
      }
    ]);

    res.json({ families });
  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new family
router.post('/families', auth, [
  body('name').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const family = new Family({
      name,
      members: [{
        user: req.user._id,
        role: 'mother', // Can be changed later
        permissions: {
          canView: true,
          canEdit: true,
          canInvite: true,
          canManageFamily: true
        }
      }]
    });

    await family.save();

    // Add family to user
    const user = await User.findById(req.user._id);
    user.families.push(family._id);
    await user.save();

    await family.populate([
      {
        path: 'members.user',
        select: 'firstName lastName email profilePicture'
      }
    ]);

    res.status(201).json({
      message: 'Family created successfully',
      family
    });
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite user to family
router.post('/families/:familyId/invite', auth, [
  param('familyId').isMongoId(),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId } = req.params;
    const { email, role } = req.body;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Check permission
    if (!family.canUserPerform(req.user._id, 'invite')) {
      return res.status(403).json({ message: 'You do not have permission to invite members to this family' });
    }

    // Check if user already exists in family
    const existingMember = family.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this family' });
    }

    // Check if invitation already exists
    const existingInvitation = family.invitations.find(invitation => 
      invitation.email === email && invitation.status === 'pending'
    );

    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const invitation = {
      email,
      role,
      invitedBy: req.user._id,
      token,
      status: 'pending'
    };

    family.invitations.push(invitation);
    await family.save();

    // TODO: Send email invitation here
    // For now, we'll just return the token for testing

    res.json({
      message: 'Invitation sent successfully',
      invitationToken: token // Remove this in production
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept family invitation
router.post('/families/accept-invitation', auth, [
  body('token').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    // Find family with invitation
    const family = await Family.findOne({
      'invitations.token': token,
      'invitations.status': 'pending',
      'invitations.expiresAt': { $gt: new Date() }
    });

    if (!family) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    const invitation = family.invitations.find(inv => 
      inv.token === token && inv.status === 'pending'
    );

    // Check if user email matches invitation
    if (invitation.email !== req.user.email) {
      return res.status(400).json({ message: 'Invitation email does not match your account' });
    }

    // Check if user is already a member
    const existingMember = family.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({ message: 'You are already a member of this family' });
    }

    // Add user to family
    family.members.push({
      user: req.user._id,
      role: invitation.role,
      permissions: {
        canView: true,
        canEdit: true,
        canInvite: false,
        canManageFamily: false
      }
    });

    // Update invitation status
    invitation.status = 'accepted';

    await family.save();

    // Add family to user
    const user = await User.findById(req.user._id);
    user.families.push(family._id);
    await user.save();

    res.json({
      message: 'Invitation accepted successfully',
      family: {
        id: family._id,
        name: family.name
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get family details
router.get('/families/:familyId', auth, [
  param('familyId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId } = req.params;

    const family = await Family.findById(familyId).populate([
      {
        path: 'members.user',
        select: 'firstName lastName email profilePicture lastLogin'
      },
      {
        path: 'babies',
        select: 'name dateOfBirth profilePicture'
      },
      {
        path: 'invitations.invitedBy',
        select: 'firstName lastName'
      }
    ]);

    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Check access
    if (!family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view this family' });
    }

    res.json({ family });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update family member permissions
router.put('/families/:familyId/members/:memberId', auth, [
  param('familyId').isMongoId(),
  param('memberId').isMongoId(),
  body('permissions').optional().isObject(),
  body('role').optional().isIn(['mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId, memberId } = req.params;
    const { permissions, role } = req.body;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Check permission
    if (!family.canUserPerform(req.user._id, 'manage')) {
      return res.status(403).json({ message: 'You do not have permission to manage family members' });
    }

    // Find member
    const member = family.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Update member
    if (permissions) {
      Object.assign(member.permissions, permissions);
    }
    if (role) {
      member.role = role;
    }

    await family.save();
    await family.populate('members.user', 'firstName lastName email profilePicture');

    res.json({
      message: 'Family member updated successfully',
      family
    });
  } catch (error) {
    console.error('Update family member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove family member
router.delete('/families/:familyId/members/:memberId', auth, [
  param('familyId').isMongoId(),
  param('memberId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId, memberId } = req.params;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Check permission
    if (!family.canUserPerform(req.user._id, 'manage')) {
      return res.status(403).json({ message: 'You do not have permission to remove family members' });
    }

    // Find member
    const memberIndex = family.members.findIndex(m => m.user.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Don't allow removing the last admin
    const remainingAdmins = family.members.filter((m, index) => 
      index !== memberIndex && m.permissions.canManageFamily && m.isActive
    );

    if (remainingAdmins.length === 0) {
      return res.status(400).json({ message: 'Cannot remove the last family administrator' });
    }

    // Remove member (soft delete)
    family.members[memberIndex].isActive = false;
    await family.save();

    // Remove family from user
    await User.findByIdAndUpdate(memberId, {
      $pull: { families: familyId }
    });

    res.json({ message: 'Family member removed successfully' });
  } catch (error) {
    console.error('Remove family member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave family
router.post('/families/:familyId/leave', auth, [
  param('familyId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId } = req.params;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Find user's membership
    const memberIndex = family.members.findIndex(m => 
      m.user.toString() === req.user._id.toString() && m.isActive
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'You are not a member of this family' });
    }

    // Check if user is the last admin
    const userMember = family.members[memberIndex];
    if (userMember.permissions.canManageFamily) {
      const otherAdmins = family.members.filter((m, index) => 
        index !== memberIndex && m.permissions.canManageFamily && m.isActive
      );

      if (otherAdmins.length === 0) {
        return res.status(400).json({ 
          message: 'You cannot leave the family as you are the only administrator. Please transfer admin rights first.' 
        });
      }
    }

    // Remove user from family (soft delete)
    family.members[memberIndex].isActive = false;
    await family.save();

    // Remove family from user
    const user = await User.findById(req.user._id);
    user.families = user.families.filter(fId => fId.toString() !== familyId);
    await user.save();

    res.json({ message: 'Left family successfully' });
  } catch (error) {
    console.error('Leave family error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update family settings
router.put('/families/:familyId/settings', auth, [
  param('familyId').isMongoId(),
  body('settings').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId } = req.params;
    const { settings } = req.body;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Check permission
    if (!family.canUserPerform(req.user._id, 'manage')) {
      return res.status(403).json({ message: 'You do not have permission to update family settings' });
    }

    // Update settings
    Object.assign(family.settings, settings);
    await family.save();

    res.json({
      message: 'Family settings updated successfully',
      settings: family.settings
    });
  } catch (error) {
    console.error('Update family settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;