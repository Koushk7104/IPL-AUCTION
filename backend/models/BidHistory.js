const mongoose = require('mongoose');

const BidHistorySchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  bidAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BidHistory', BidHistorySchema);
