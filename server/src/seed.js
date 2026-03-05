const mongoose = require('mongoose');
const Song = require('./models/Song');
require('dotenv').config();

const BUFFER = 3000; // 3 second buffer before first note

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
          { string: 1, fret: 3 }
        ]
      },
      {
        name: 'Em',
        fingers: [
          { string: 5, fret: 2 },
          { string: 4, fret: 2 }
        ]
      },
      {
        name: 'C',
        fingers: [
          { string: 5, fret: 3 },
          { string: 4, fret: 2 },
          { string: 2, fret: 1 }
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
      // G chord
      { note: 'G2',  fret: 3,  string: 6, timestamp: BUFFER + 0,     chord: 'G'  },
      { note: 'B3',  fret: 0,  string: 2, timestamp: BUFFER + 800,   chord: 'G'  },
      { note: 'D4',  fret: 0,  string: 1, timestamp: BUFFER + 1600,  chord: 'G'  },
      { note: 'G3',  fret: 0,  string: 3, timestamp: BUFFER + 2400,  chord: 'G'  },
      // Em chord
      { note: 'E2',  fret: 0,  string: 6, timestamp: BUFFER + 3200,  chord: 'Em' },
      { note: 'B3',  fret: 0,  string: 2, timestamp: BUFFER + 4000,  chord: 'Em' },
      { note: 'E3',  fret: 2,  string: 4, timestamp: BUFFER + 4800,  chord: 'Em' },
      { note: 'G3',  fret: 0,  string: 3, timestamp: BUFFER + 5600,  chord: 'Em' },
      // C chord
      { note: 'C2',  fret: 3,  string: 5, timestamp: BUFFER + 6400,  chord: 'C'  },
      { note: 'E3',  fret: 2,  string: 4, timestamp: BUFFER + 7200,  chord: 'C'  },
      { note: 'C4',  fret: 1,  string: 2, timestamp: BUFFER + 8000,  chord: 'C'  },
      { note: 'G3',  fret: 0,  string: 3, timestamp: BUFFER + 8800,  chord: 'C'  },
      // D chord
      { note: 'D3',  fret: 0,  string: 4, timestamp: BUFFER + 9600,  chord: 'D'  },
      { note: 'A3',  fret: 2,  string: 3, timestamp: BUFFER + 10400, chord: 'D'  },
      { note: 'D4',  fret: 3,  string: 2, timestamp: BUFFER + 11200, chord: 'D'  },
      { note: 'F#4', fret: 2,  string: 1, timestamp: BUFFER + 12000, chord: 'D'  },
    ]
  },
  {
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    difficulty: 'beginner',
    bpm: 112,
    chords: [],
    noteMap: [
      { note: 'G3',  fret: 5,  string: 4, timestamp: BUFFER + 0,    chord: '' },
      { note: 'Bb3', fret: 8,  string: 4, timestamp: BUFFER + 1000, chord: '' },
      { note: 'C4',  fret: 10, string: 4, timestamp: BUFFER + 1500, chord: '' },
      { note: 'G3',  fret: 5,  string: 4, timestamp: BUFFER + 3000, chord: '' },
      { note: 'Bb3', fret: 8,  string: 4, timestamp: BUFFER + 4000, chord: '' },
      { note: 'Db4', fret: 11, string: 4, timestamp: BUFFER + 4500, chord: '' },
      { note: 'C4',  fret: 10, string: 4, timestamp: BUFFER + 5500, chord: '' },
    ]
  },
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    difficulty: 'beginner',
    bpm: 87,
    chords: [],
    noteMap: [
      { note: 'B3', fret: 4, string: 3, timestamp: BUFFER + 0,    chord: '' },
      { note: 'D4', fret: 7, string: 3, timestamp: BUFFER + 1000, chord: '' },
      { note: 'E4', fret: 9, string: 3, timestamp: BUFFER + 2000, chord: '' },
      { note: 'B3', fret: 4, string: 3, timestamp: BUFFER + 3000, chord: '' },
      { note: 'D4', fret: 7, string: 3, timestamp: BUFFER + 4000, chord: '' },
    ]
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await Song.deleteMany({});
    await Song.insertMany(songs);
    console.log('Database seeded with songs');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });