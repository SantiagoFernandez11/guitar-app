const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Score = require('../models/Score');
const User = require('../models/User');

function getLevelFromXp(xp) {
  let level = 1;
  let remaining = xp;
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level++;
  }
  return level;
}

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

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { xp: xpEarned } },
      { new: true }
    );

    const newLevel = getLevelFromXp(updatedUser.xp);
    if (newLevel !== updatedUser.level) {
      await User.findByIdAndUpdate(req.user.id, { level: newLevel });
    }

    res.status(201).json(score);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
