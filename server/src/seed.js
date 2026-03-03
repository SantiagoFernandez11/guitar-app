const mongoose = require('mongoose');
const Song = require('./models/Song');
require('dotenv').config();

const songs = [
  {
    title: 'Smoke on the Water',
    artist: 'Deep Purple',
    difficulty: 'beginner',
    bpm: 112,
    noteMap: [
      { note: 'G3', fret: 5, string: 4, timestamp: 0 },
      { note: 'Bb3', fret: 8, string: 4, timestamp: 500 },
      { note: 'C4', fret: 10, string: 4, timestamp: 750 },
      { note: 'G3', fret: 5, string: 4, timestamp: 1500 },
      { note: 'Bb3', fret: 8, string: 4, timestamp: 2000 },
      { note: 'Db4', fret: 11, string: 4, timestamp: 2250 },
      { note: 'C4', fret: 10, string: 4, timestamp: 2750 },
    ]
  },
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    difficulty: 'beginner',
    bpm: 87,
    noteMap: [
      { note: 'B3', fret: 4, string: 3, timestamp: 0 },
      { note: 'D4', fret: 7, string: 3, timestamp: 500 },
      { note: 'E4', fret: 9, string: 3, timestamp: 1000 },
      { note: 'B3', fret: 4, string: 3, timestamp: 1500 },
      { note: 'D4', fret: 7, string: 3, timestamp: 2000 },
    ]
  },
  {
    title: 'Sweet Child O Mine',
    artist: 'Guns N Roses',
    difficulty: 'intermediate',
    bpm: 125,
    noteMap: [
      { note: 'D4', fret: 7, string: 3, timestamp: 0 },
      { note: 'D5', fret: 7, string: 1, timestamp: 400 },
      { note: 'A4', fret: 5, string: 2, timestamp: 800 },
      { note: 'G4', fret: 5, string: 3, timestamp: 1200 },
      { note: 'G5', fret: 8, string: 1, timestamp: 1600 },
      { note: 'A4', fret: 5, string: 2, timestamp: 2000 },
      { note: 'B4', fret: 7, string: 2, timestamp: 2400 },
      { note: 'D5', fret: 7, string: 1, timestamp: 2800 },
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