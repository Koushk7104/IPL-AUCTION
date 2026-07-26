const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const AuctionState = require('../models/AuctionState');
const { protect } = require('../middleware/auth');
const { getDemoPlayers, getDemoCurrentState } = require('../lib/demoData');

// @desc    Get all players
// @route   GET /api/players
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      const { role, status } = req.query;
      return res.json(getDemoPlayers({ role, status }));
    }

    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const players = await Player.find(filter).populate('buyerTeam', 'teamName logo');
    res.json(players);
  } catch (error) {
    console.error('Fetch players error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current player in auction
// @route   GET /api/players/current
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      const state = await getDemoCurrentState();
      return res.json(state);
    }

    const state = await AuctionState.findOne().populate({
      path: 'currentPlayer',
      populate: { path: 'leadingTeam', select: 'teamName logo' }
    });
    
    if (!state || !state.currentPlayer) {
      return res.json({ currentPlayer: null, status: 'idle' });
    }
    
    res.json(state);
  } catch (error) {
    console.error('Fetch current player error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get player details by ID
// @route   GET /api/players/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    if (req.app.locals.demoMode) {
      const player = getDemoPlayers({}).find((item) => item._id === req.params.id);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      return res.json(player);
    }

    const player = await Player.findById(req.params.id)
      .populate('buyerTeam', 'teamName logo')
      .populate('leadingTeam', 'teamName logo');

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    console.error('Fetch player by ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
