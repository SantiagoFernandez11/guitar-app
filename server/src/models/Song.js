const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  note: String,       // e.g. "E4"
  fret: Number,
  string: Number,
  timestamp: Number   // milliseconds into the song
});

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  bpm: Number,
  noteMap: [noteSchema]
});

module.exports = mongoose.model('Song', songSchema);