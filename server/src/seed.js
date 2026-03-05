const mongoose = require('mongoose');
const Song = require('./models/Song');
require('dotenv').config();

const BUFFER = 3000;

const songs = [
  {
    title: 'Banana Pancakes',
    artist: 'Jack Johnson',
    difficulty: 'beginner',
    bpm: 75,
    chords: [
      {
        name: 'G',
        fingers: [
          { string: 6, fret: 3 },
          { string: 5, fret: 2 },
          { string: 4, fret: 0 },
          { string: 3, fret: 0 },
          { string: 2, fret: 0 },
          { string: 1, fret: 3 }
        ]
      },
      {
        name: 'Em',
        fingers: [
          { string: 6, fret: 0 },
          { string: 5, fret: 2 },
          { string: 4, fret: 2 },
          { string: 3, fret: 0 },
          { string: 2, fret: 0 },
          { string: 1, fret: 0 }
        ]
      },
      {
        name: 'C',
        fingers: [
          { string: 5, fret: 3 },
          { string: 4, fret: 2 },
          { string: 3, fret: 0 },
          { string: 2, fret: 1 },
          { string: 1, fret: 0 }
        ]
      },
      {
        name: 'D',
        fingers: [
          { string: 4, fret: 0 },
          { string: 3, fret: 2 },
          { string: 2, fret: 3 },
          { string: 1, fret: 2 }
        ]
      }
    ],
    noteMap: [
      // G chord - Low E (fingered), A (fingered), D (open), G (open), B (open), High E (fingered)
      { note: 'G2',  fret: 3, string: 6, timestamp: BUFFER + 0,    chord: 'G',  type: 'fingered' },
      { note: 'D3',  fret: 2, string: 5, timestamp: BUFFER + 0,    chord: 'G',  type: 'fingered' },
      { note: 'G3',  fret: 0, string: 4, timestamp: BUFFER + 0,    chord: 'G',  type: 'open' },
      { note: 'B3',  fret: 0, string: 3, timestamp: BUFFER + 0,    chord: 'G',  type: 'open' },
      { note: 'D4',  fret: 0, string: 2, timestamp: BUFFER + 0,    chord: 'G',  type: 'open' },
      { note: 'G4',  fret: 3, string: 1, timestamp: BUFFER + 0,    chord: 'G',  type: 'fingered' },
      // Em chord - all strings, Low E open, A fingered, D fingered, G open, B open, High E open
      { note: 'E2',  fret: 0, string: 6, timestamp: BUFFER + 3200, chord: 'Em', type: 'open' },
      { note: 'B2',  fret: 2, string: 5, timestamp: BUFFER + 3200, chord: 'Em', type: 'fingered' },
      { note: 'E3',  fret: 2, string: 4, timestamp: BUFFER + 3200, chord: 'Em', type: 'fingered' },
      { note: 'G3',  fret: 0, string: 3, timestamp: BUFFER + 3200, chord: 'Em', type: 'open' },
      { note: 'B3',  fret: 0, string: 2, timestamp: BUFFER + 3200, chord: 'Em', type: 'open' },
      { note: 'E4',  fret: 0, string: 1, timestamp: BUFFER + 3200, chord: 'Em', type: 'open' },
      // C chord - Low E muted, A fingered, D fingered, G open, B fingered, High E open
      { note: 'X',   fret: 0, string: 6, timestamp: BUFFER + 6400, chord: 'C',  type: 'muted' },
      { note: 'C2',  fret: 3, string: 5, timestamp: BUFFER + 6400, chord: 'C',  type: 'fingered' },
      { note: 'E3',  fret: 2, string: 4, timestamp: BUFFER + 6400, chord: 'C',  type: 'fingered' },
      { note: 'G3',  fret: 0, string: 3, timestamp: BUFFER + 6400, chord: 'C',  type: 'open' },
      { note: 'C4',  fret: 1, string: 2, timestamp: BUFFER + 6400, chord: 'C',  type: 'fingered' },
      { note: 'E4',  fret: 0, string: 1, timestamp: BUFFER + 6400, chord: 'C',  type: 'open' },
      // D chord - Low E muted, A muted, D open, G fingered, B fingered, High E fingered
      { note: 'X',   fret: 0, string: 6, timestamp: BUFFER + 9600, chord: 'D',  type: 'muted' },
      { note: 'X',   fret: 0, string: 5, timestamp: BUFFER + 9600, chord: 'D',  type: 'muted' },
      { note: 'D3',  fret: 0, string: 4, timestamp: BUFFER + 9600, chord: 'D',  type: 'open' },
      { note: 'A3',  fret: 2, string: 3, timestamp: BUFFER + 9600, chord: 'D',  type: 'fingered' },
      { note: 'D4',  fret: 3, string: 2, timestamp: BUFFER + 9600, chord: 'D',  type: 'fingered' },
      { note: 'F#4', fret: 2, string: 1, timestamp: BUFFER + 9600, chord: 'D',  type: 'fingered' },
    ]
  },
  {
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    difficulty: 'beginner',
    bpm: 112,
    chords: [],
    noteMap: [
      { note: 'G3',  fret: 5,  string: 4, timestamp: BUFFER + 0,    chord: '', type: 'fingered' },
      { note: 'Bb3', fret: 8,  string: 4, timestamp: BUFFER + 1000, chord: '', type: 'fingered' },
      { note: 'C4',  fret: 10, string: 4, timestamp: BUFFER + 1500, chord: '', type: 'fingered' },
      { note: 'G3',  fret: 5,  string: 4, timestamp: BUFFER + 3000, chord: '', type: 'fingered' },
      { note: 'Bb3', fret: 8,  string: 4, timestamp: BUFFER + 4000, chord: '', type: 'fingered' },
      { note: 'Db4', fret: 11, string: 4, timestamp: BUFFER + 4500, chord: '', type: 'fingered' },
      { note: 'C4',  fret: 10, string: 4, timestamp: BUFFER + 5500, chord: '', type: 'fingered' },
    ]
  },
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    difficulty: 'beginner',
    bpm: 87,
    chords: [],
    noteMap: [
      { note: 'B3', fret: 4, string: 3, timestamp: BUFFER + 0,    chord: '', type: 'fingered' },
      { note: 'D4', fret: 7, string: 3, timestamp: BUFFER + 1000, chord: '', type: 'fingered' },
      { note: 'E4', fret: 9, string: 3, timestamp: BUFFER + 2000, chord: '', type: 'fingered' },
      { note: 'B3', fret: 4, string: 3, timestamp: BUFFER + 3000, chord: '', type: 'fingered' },
      { note: 'D4', fret: 7, string: 3, timestamp: BUFFER + 4000, chord: '', type: 'fingered' },
    ]
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await Song.deleteMany({});
    await Song.insertMany(songs);
    console.log('Database seeded');
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });