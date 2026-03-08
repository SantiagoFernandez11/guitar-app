const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Score = require('../models/Score');

// Get current user's profile + history
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const scores = await Score.find({ user: req.user.id })
      .populate('song', 'title artist difficulty')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ user, scores });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;