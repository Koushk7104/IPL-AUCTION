const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    required: true
  },
  iplTeam: {
    type: String,
    default: 'Uncapped'
  },
  role: {
    type: String,
    required: true,
    enum: ['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper']
  },
  battingStyle: {
    type: String,
    default: 'Right-hand bat'
  },
  bowlingStyle: {
    type: String,
    default: 'N/A'
  },
  // Statistics
  matches: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  strikeRate: { type: Number, default: 0 },
  average: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  economy: { type: Number, default: 0 },
  dismissals: { type: Number, default: 0 }, // For Wicket Keeper
  // Ratings and Prices
  performanceRating: {
    type: Number,
    default: 0
  },
  basePrice: {
    type: Number,
    default: 0 // In Rupees, e.g., 20000000 (2Cr)
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'sold', 'unsold'],
    default: 'pending'
  },
  // Auction details
  currentBid: {
    type: Number,
    default: 0
  },
  leadingTeam: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  soldPrice: {
    type: Number,
    default: null
  },
  buyerTeam: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', PlayerSchema);
