const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const auth = require('../middleware/auth');

// Get all songs
router.get('/', auth, async (req, res) => {
  try {
    const songs = await Song.find({}, 'title artist difficulty bpm');
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single song with full note map
router.get('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;