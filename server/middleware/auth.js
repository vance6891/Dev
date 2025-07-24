const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

const familyAccess = (permission = 'view') => {
  return async (req, res, next) => {
    try {
      const Family = require('../models/Family');
      const familyId = req.params.familyId || req.body.familyId;
      
      if (!familyId) {
        return res.status(400).json({ message: 'Family ID is required' });
      }

      const family = await Family.findById(familyId);
      
      if (!family) {
        return res.status(404).json({ message: 'Family not found' });
      }

      if (!family.canUserPerform(req.user._id, permission)) {
        return res.status(403).json({ 
          message: `You don't have permission to ${permission} in this family` 
        });
      }

      req.family = family;
      next();
    } catch (error) {
      console.error('Family access middleware error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  familyAccess
};