const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');
const { getDemoTeams, getDemoLeaderboard, getDemoTeamById } = require('../lib/demoData');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      return res.json(await getDemoTeams());
    }

    const teams = await Team.find().populate('squad').select('-password');
    res.json(teams);
  } catch (error) {
    console.error('Fetch teams error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get team leaderboard (ordered by squad strength, average rating, remaining purse)
// @route   GET /api/teams/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      return res.json(await getDemoLeaderboard());
    }

    const teams = await Team.find().populate('squad').select('-password');
    
    // Sort by squad strength descending. If there is a tie, sort by average rating descending, then remaining purse descending
    const rankedTeams = teams.sort((a, b) => {
      if (b.squadStrength !== a.squadStrength) {
        return b.squadStrength - a.squadStrength;
      }
      if (b.avgRating !== a.avgRating) {
        return b.avgRating - a.avgRating;
      }
      return b.remainingPurse - a.remainingPurse;
    });

    res.json(rankedTeams);
  } catch (error) {
    console.error('Leaderboard calculation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      const team = await getDemoTeamById(req.params.id);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      return res.json({
        ...team,
        squad: team.squad.map((player) => player).filter(Boolean)
      });
    }

    const team = await Team.findById(req.params.id).populate('squad').select('-password');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    console.error('Fetch team ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
