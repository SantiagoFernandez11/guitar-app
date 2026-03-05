const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Score = require('../models/Score');
const User = require('../models/User');

router.post('/', auth, async (req, res) => {
  try {
    const { songId, hits, misses, accuracy, xpEarned } = req.body;

    const score = new Score({
      user: req.user.id,
      song: songId,
      hits,
      misses,
      accuracy,
      xpEarned
    });
    await score.save();

    // Add XP to user
    await User.findByIdAndUpdate(req.user.id, { $inc: { xp: xpEarned } });

    res.status(201).json(score);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;