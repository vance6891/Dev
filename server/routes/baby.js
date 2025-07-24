const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Baby = require('../models/Baby');
const Family = require('../models/Family');
const Activity = require('../models/Activity');
const { auth, familyAccess } = require('../middleware/auth');

const router = express.Router();

// Create new baby
router.post('/', auth, [
  body('name').trim().isLength({ min: 1 }),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('familyId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { familyId, ...babyData } = req.body;

    // Check family access
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    if (!family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to add babies to this family' });
    }

    // Create baby
    const baby = new Baby({
      ...babyData,
      family: familyId
    });

    await baby.save();

    // Add baby to family
    family.babies.push(baby._id);
    await family.save();

    res.status(201).json({
      message: 'Baby created successfully',
      baby
    });
  } catch (error) {
    console.error('Create baby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get babies for user's families
router.get('/', auth, async (req, res) => {
  try {
    // Get all families where user is a member
    const families = await Family.find({
      'members.user': req.user._id,
      'members.isActive': true,
      isActive: true
    }).populate({
      path: 'babies',
      match: { isActive: true },
      populate: {
        path: 'family',
        select: 'name'
      }
    });

    // Extract babies from all families
    const babies = families.reduce((acc, family) => {
      return acc.concat(family.babies);
    }, []);

    res.json({ babies });
  } catch (error) {
    console.error('Get babies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get baby by ID
router.get('/:id', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view this baby' });
    }

    res.json({ baby });
  } catch (error) {
    console.error('Get baby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update baby
router.put('/:id', auth, [
  param('id').isMongoId(),
  body('name').optional().trim().isLength({ min: 1 }),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit this baby' });
    }

    // Update baby
    Object.assign(baby, req.body);
    await baby.save();

    res.json({
      message: 'Baby updated successfully',
      baby
    });
  } catch (error) {
    console.error('Update baby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update baby weight
router.put('/:id/weight', auth, [
  param('id').isMongoId(),
  body('value').isFloat({ min: 0 }),
  body('unit').isIn(['kg', 'lbs'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { value, unit } = req.body;

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit this baby' });
    }

    // Update weight
    baby.weight.current = {
      value,
      unit,
      lastUpdated: new Date()
    };

    await baby.save();

    res.json({
      message: 'Baby weight updated successfully',
      baby
    });
  } catch (error) {
    console.error('Update baby weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update baby length
router.put('/:id/length', auth, [
  param('id').isMongoId(),
  body('value').isFloat({ min: 0 }),
  body('unit').isIn(['cm', 'inches'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { value, unit } = req.body;

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit this baby' });
    }

    // Update length
    baby.length.current = {
      value,
      unit,
      lastUpdated: new Date()
    };

    await baby.save();

    res.json({
      message: 'Baby length updated successfully',
      baby
    });
  } catch (error) {
    console.error('Update baby length error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add milestone
router.post('/:id/milestones', auth, [
  param('id').isMongoId(),
  body('title').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('date').isISO8601(),
  body('category').isIn(['physical', 'cognitive', 'social', 'language', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to add milestones for this baby' });
    }

    // Add milestone
    baby.milestones.push(req.body);
    await baby.save();

    res.json({
      message: 'Milestone added successfully',
      baby
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medical info
router.put('/:id/medical', auth, [
  param('id').isMongoId(),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']),
  body('allergies').optional().isArray(),
  body('conditions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to edit medical info for this baby' });
    }

    // Update medical info
    Object.assign(baby.medicalInfo, req.body);
    await baby.save();

    res.json({
      message: 'Medical information updated successfully',
      baby
    });
  } catch (error) {
    console.error('Update medical info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add medication
router.post('/:id/medications', auth, [
  param('id').isMongoId(),
  body('name').trim().isLength({ min: 1 }),
  body('dosage').trim().isLength({ min: 1 }),
  body('frequency').trim().isLength({ min: 1 }),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to add medications for this baby' });
    }

    // Add medication
    baby.medicalInfo.medications.push(req.body);
    await baby.save();

    res.json({
      message: 'Medication added successfully',
      baby
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add note
router.post('/:id/notes', auth, [
  param('id').isMongoId(),
  body('content').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'edit')) {
      return res.status(403).json({ message: 'You do not have permission to add notes for this baby' });
    }

    // Add note
    baby.notes.push({
      content: req.body.content,
      createdBy: req.user._id
    });

    await baby.save();
    await baby.populate('notes.createdBy', 'firstName lastName');

    res.json({
      message: 'Note added successfully',
      baby
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get baby statistics
router.get('/:id/stats', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access
    if (!baby.family.canUserPerform(req.user._id, 'view')) {
      return res.status(403).json({ message: 'You do not have permission to view statistics for this baby' });
    }

    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get activity counts
    const activityStats = await Activity.aggregate([
      {
        $match: {
          baby: baby._id,
          timestamp: { $gte: startDate }
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

    // Get sleep statistics
    const sleepStats = await Activity.aggregate([
      {
        $match: {
          baby: baby._id,
          type: 'sleep',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSleep: { $sum: '$sleep.duration' },
          averageSleep: { $avg: '$sleep.duration' },
          sleepSessions: { $sum: 1 }
        }
      }
    ]);

    // Get feeding statistics
    const feedingStats = await Activity.aggregate([
      {
        $match: {
          baby: baby._id,
          type: 'feeding',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$feeding.method',
          count: { $sum: 1 },
          averageDuration: { $avg: '$feeding.duration' }
        }
      }
    ]);

    res.json({
      baby: {
        name: baby.name,
        age: baby.age,
        dateOfBirth: baby.dateOfBirth
      },
      period: {
        days: parseInt(days),
        startDate
      },
      activities: activityStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          lastActivity: stat.lastActivity
        };
        return acc;
      }, {}),
      sleep: sleepStats[0] || {
        totalSleep: 0,
        averageSleep: 0,
        sleepSessions: 0
      },
      feeding: feedingStats
    });
  } catch (error) {
    console.error('Get baby stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete baby (soft delete)
router.delete('/:id', auth, [
  param('id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const baby = await Baby.findById(req.params.id).populate('family');
    
    if (!baby) {
      return res.status(404).json({ message: 'Baby not found' });
    }

    // Check access (only family admins can delete)
    if (!baby.family.canUserPerform(req.user._id, 'manage')) {
      return res.status(403).json({ message: 'You do not have permission to delete this baby' });
    }

    // Soft delete
    baby.isActive = false;
    await baby.save();

    res.json({ message: 'Baby deleted successfully' });
  } catch (error) {
    console.error('Delete baby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;