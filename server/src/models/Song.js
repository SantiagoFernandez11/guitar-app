const mongoose = require('mongoose');

const fingerSchema = new mongoose.Schema({
  string: Number,
  fret: Number
});

const chordSchema = new mongoose.Schema({
  name: String,
  fingers: [fingerSchema],
  startFret: { type: Number, default: 1 }
});

const noteSchema = new mongoose.Schema({
  note: String,
  fret: Number,
  string: Number,
  timestamp: Number,
  chord: String,
  type: { type: String, enum: ['fingered', 'open', 'muted'], default: 'fingered' },
  technique: String,  // 'hammerOn', 'hammerOnDest', 'pullOff', 'pullOffDest', 'slideUp', 'slideUpDest', 'slideDown', 'slideDownDest', 'bend', 'vibrato', etc.
});

// Tab editor format
const tabLineSchema = new mongoose.Schema({
  string: String,
  notes: [String]
});

const tabNoteSchema = new mongoose.Schema({
  string: Number,  // 1-6, string 1 = high e, string 6 = low E
  fret: String,    // '0', '5', '7h9', 'x', '<5>', etc.
});

const tabEventSchema = new mongoose.Schema({
  tick: Number,       // absolute tick from start
  chord: String,      // optional chord label
  notes: [tabNoteSchema],
  duration: Number,   // duration in ticks (for editor)
});

const tabDataSchema = new mongoose.Schema({
  ticksPerBeat: { type: Number, default: 12 },
  events: [tabEventSchema],
  // Legacy fields kept for backward compatibility:
  chords: [String],
  lines: [tabLineSchema],
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