const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  initialPurse: {
    type: Number,
    default: 1250000000 // 125 Crore in Rupees
  },
  remainingPurse: {
    type: Number,
    default: 1250000000
  },
  squad: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  squadStrength: {
    type: Number,
    default: 0
  },
  avgRating: {
    type: Number,
    default: 0
  },
  roleCounts: {
    batters: { type: Number, default: 0 },
    bowlers: { type: Number, default: 0 },
    allRounders: { type: Number, default: 0 },
    wicketKeepers: { type: Number, default: 0 }
  },
  highestPurchase: {
    type: Number,
    default: 0
  },
  cheapestPurchase: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', TeamSchema);
