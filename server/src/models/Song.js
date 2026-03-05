const mongoose = require('mongoose');

const fingerSchema = new mongoose.Schema({
  string: Number,
  fret: Number
});

const chordSchema = new mongoose.Schema({
  name: String,
  fingers: [fingerSchema]
});

const noteSchema = new mongoose.Schema({
  note: String,
  fret: Number,
  string: Number,
  timestamp: Number,
  chord: String
});

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  bpm: Number,
  chords: [chordSchema],
  noteMap: [noteSchema]
});

module.exports = mongoose.model('Song', songSchema);