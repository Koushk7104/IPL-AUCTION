const mongoose = require('mongoose');

const AuctionStateSchema = new mongoose.Schema({
  currentPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  status: {
    type: String,
    enum: ['idle', 'active', 'paused', 'ended'],
    default: 'idle'
  },
  currentBid: {
    type: Number,
    default: 0
  },
  leadingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  timerRemaining: {
    type: Number,
    default: 30
  },
  timerDuration: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuctionState', AuctionStateSchema);
