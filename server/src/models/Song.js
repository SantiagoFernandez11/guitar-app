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
  chord: String,
  type: { type: String, enum: ['fingered', 'open', 'muted'], default: 'fingered' }
});

// Tab editor format
const tabLineSchema = new mongoose.Schema({
  string: String,
  notes: [String]
});

const tabDataSchema = new mongoose.Schema({
  chords: [String],
  lines: [tabLineSchema]
});

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  bpm: { type: Number, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chords: [chordSchema],
  tabData: tabDataSchema,
  noteMap: [noteSchema],
  tuning: { type: String, default: 'standard' },
  capo: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Song', songSchema);