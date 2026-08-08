const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');
const { getDemoTeamByUsername, getDemoMe } = require('../lib/demoData');

// Generate JWT token helper
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'ipl_mega_auction_secret_2026_key_9876', {
    expiresIn: '7d'
  });
};

// @desc    Auth user (admin or team) & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username and password' });
  }

  // 1. Check if user is Admin
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username.toLowerCase() === adminUsername.toLowerCase() && password === adminPassword) {
    const token = generateToken({
      id: 'admin',
      username: adminUsername,
      role: 'admin'
    });
    return res.json({
      token,
      user: {
        id: 'admin',
        username: adminUsername,
        role: 'admin',
        teamName: 'Administrator'
      }
    });
  }

  // 2. Check if user is a Franchise Team
  try {
    if (req.app.locals.demoMode) {
      const demoTeam = await getDemoTeamByUsername(username);

      if (!demoTeam) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const isMatch = await bcrypt.compare(password, demoTeam.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const token = generateToken({
        id: demoTeam._id,
        username: demoTeam.username,
        role: 'team',
        teamName: demoTeam.teamName
      });

      return res.json({
        token,
        user: {
          id: demoTeam._id,
          username: demoTeam.username,
          role: 'team',
          teamName: demoTeam.teamName,
          logo: demoTeam.logo
        }
      });
    }

    const team = await Team.findOne({ username: username.toLowerCase() });
    if (!team) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = generateToken({
      id: team._id,
      username: team.username,
      role: 'team',
      teamName: team.teamName
    });

    return res.json({
      token,
      user: {
        id: team._id,
        username: team.username,
        role: 'team',
        teamName: team.teamName,
        logo: team.logo
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      const me = await getDemoMe(req.user);
      if (!me) {
        return res.status(404).json({ message: 'Team not found' });
      }

      return res.json(me);
    }

    if (req.user.role === 'admin') {
      return res.json({
        id: 'admin',
        username: req.user.username,
        role: 'admin',
        teamName: 'Administrator'
      });
    }

    const team = await Team.findById(req.user.id).select('-password').populate('squad');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      id: team._id,
      username: team.username,
      role: 'team',
      teamName: team.teamName,
      logo: team.logo,
      initialPurse: team.initialPurse,
      remainingPurse: team.remainingPurse,
      squad: team.squad,
      squadStrength: team.squadStrength,
      roleCounts: team.roleCounts,
      avgRating: team.avgRating,
      highestPurchase: team.highestPurchase,
      cheapestPurchase: team.cheapestPurchase
    });
  } catch (error) {
    console.error('Fetch me error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
