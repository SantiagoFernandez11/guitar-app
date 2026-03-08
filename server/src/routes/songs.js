const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const Score = require('../models/Score');
const auth = require('../middleware/auth');
const { convertTabToNoteMap } = require('../utils/tabConverter');

// Get all published songs
router.get('/', auth, async (req, res) => {
  try {
    const songs = await Song.find({ published: true })
      .populate('author', 'username')
      .select('title artist difficulty bpm author likes createdAt')
      .sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's songs (drafts + published)
router.get('/my', auth, async (req, res) => {
  try {
    const songs = await Song.find({ author: req.user.id })
      .select('title artist difficulty bpm published likes createdAt')
      .sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single song
router.get('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('author', 'username');
    if (!song) return res.status(404).json({ message: 'Song not found' });

    // Only author can see unpublished songs
    if (!song.published && song.author._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(song);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new song (draft)
router.post('/create', auth, async (req, res) => {
  try {
    const { title, artist, bpm, difficulty, tabData, chords, tuning, capo } = req.body;

    const noteMap = tabData ? convertTabToNoteMap(tabData, bpm, tuning, capo) : [];

    const song = new Song({
      title,
      artist,
      bpm,
      difficulty,
      author: req.user.id,
      tabData,
      noteMap,
      chords: chords || [],
      tuning: tuning || 'standard',
      capo: capo || 0,
      published: false
    });

    await song.save();
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a draft song
router.put('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    if (song.author.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (song.published) return res.status(400).json({ message: 'Published songs cannot be edited' });

    const { title, artist, bpm, difficulty, tabData, chords, tuning, capo } = req.body;

    song.title = title ?? song.title;
    song.artist = artist ?? song.artist;
    song.difficulty = difficulty ?? song.difficulty;
    song.chords = chords ?? song.chords;

    // Use updated values for note map generation so BPM/tuning/capo changes are reflected
    const newBpm = bpm ?? song.bpm;
    const newTuning = tuning ?? song.tuning;
    const newCapo = capo !== undefined ? capo : song.capo;
    song.bpm = newBpm;
    song.tuning = newTuning;
    song.capo = newCapo;
    song.tabData = tabData ?? song.tabData;
    song.noteMap = tabData ? convertTabToNoteMap(tabData, newBpm, newTuning, newCapo) : song.noteMap;

    await song.save();
    res.json(song);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Publish a song
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    if (song.author.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (song.published) return res.status(400).json({ message: 'Already published' });

    song.published = true;
    await song.save();
    res.json(song);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like / unlike a song
router.post('/:id/like', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    if (!song.published) return res.status(400).json({ message: 'Cannot like an unpublished song' });

    const alreadyLiked = song.likes.includes(req.user.id);
    if (alreadyLiked) {
      song.likes = song.likes.filter(id => id.toString() !== req.user.id);
    } else {
      song.likes.push(req.user.id);
    }

    await song.save();
    res.json({ likes: song.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a song — cascades to scores
router.delete('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    if (song.author.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await Score.deleteMany({ song: song._id });
    await song.deleteOne();
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
