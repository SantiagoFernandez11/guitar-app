const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  hits: Number,
  misses: Number,
  accuracy: Number,
  xpEarned: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Score', scoreSchema);