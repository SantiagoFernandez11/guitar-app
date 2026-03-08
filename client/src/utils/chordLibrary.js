// Common guitar chord shapes.
// string: 1 = high e, 6 = low E. fret: 0 = open string, >0 = fingered fret (absolute).
// startFret: which fret the diagram window starts at (default 1 = open position).
// Muted strings are omitted (no x marker support in ChordDiagram yet).

export const CHORD_LIBRARY = {
  'A':     { startFret: 1, fingers: [{string:5,fret:0},{string:4,fret:2},{string:3,fret:2},{string:2,fret:2},{string:1,fret:0}] },
  'A7':    { startFret: 1, fingers: [{string:5,fret:0},{string:4,fret:2},{string:3,fret:0},{string:2,fret:2},{string:1,fret:0}] },
  'Am':    { startFret: 1, fingers: [{string:5,fret:0},{string:4,fret:2},{string:3,fret:2},{string:2,fret:1},{string:1,fret:0}] },
  'Am7':   { startFret: 1, fingers: [{string:5,fret:0},{string:4,fret:2},{string:3,fret:0},{string:2,fret:1},{string:1,fret:0}] },
  'B7':    { startFret: 1, fingers: [{string:5,fret:2},{string:4,fret:1},{string:3,fret:2},{string:2,fret:0},{string:1,fret:2}] },
  'Bm':    { startFret: 2, fingers: [{string:5,fret:2},{string:4,fret:4},{string:3,fret:4},{string:2,fret:3},{string:1,fret:2}] },
  'C':     { startFret: 1, fingers: [{string:5,fret:3},{string:4,fret:2},{string:3,fret:0},{string:2,fret:1},{string:1,fret:0}] },
  'Cadd9': { startFret: 1, fingers: [{string:5,fret:3},{string:4,fret:2},{string:3,fret:0},{string:2,fret:3},{string:1,fret:3}] },
  'C7':    { startFret: 1, fingers: [{string:5,fret:3},{string:4,fret:2},{string:3,fret:3},{string:2,fret:1},{string:1,fret:0}] },
  'D':     { startFret: 1, fingers: [{string:4,fret:0},{string:3,fret:2},{string:2,fret:3},{string:1,fret:2}] },
  'D7':    { startFret: 1, fingers: [{string:4,fret:0},{string:3,fret:2},{string:2,fret:1},{string:1,fret:2}] },
  'Dm':    { startFret: 1, fingers: [{string:4,fret:0},{string:3,fret:2},{string:2,fret:3},{string:1,fret:1}] },
  'Dsus2': { startFret: 1, fingers: [{string:4,fret:0},{string:3,fret:2},{string:2,fret:3},{string:1,fret:0}] },
  'Dsus4': { startFret: 1, fingers: [{string:4,fret:0},{string:3,fret:2},{string:2,fret:3},{string:1,fret:3}] },
  'E':     { startFret: 1, fingers: [{string:6,fret:0},{string:5,fret:2},{string:4,fret:2},{string:3,fret:1},{string:2,fret:0},{string:1,fret:0}] },
  'E7':    { startFret: 1, fingers: [{string:6,fret:0},{string:5,fret:2},{string:4,fret:0},{string:3,fret:1},{string:2,fret:0},{string:1,fret:0}] },
  'Em':    { startFret: 1, fingers: [{string:6,fret:0},{string:5,fret:2},{string:4,fret:2},{string:3,fret:0},{string:2,fret:0},{string:1,fret:0}] },
  'Em7':   { startFret: 1, fingers: [{string:6,fret:0},{string:5,fret:2},{string:4,fret:0},{string:3,fret:0},{string:2,fret:0},{string:1,fret:0}] },
  'F':     { startFret: 1, fingers: [{string:6,fret:1},{string:5,fret:1},{string:4,fret:3},{string:3,fret:3},{string:2,fret:2},{string:1,fret:1}] },
  'Fmaj7': { startFret: 1, fingers: [{string:4,fret:3},{string:3,fret:2},{string:2,fret:1},{string:1,fret:0}] },
  'G':     { startFret: 1, fingers: [{string:6,fret:3},{string:5,fret:2},{string:4,fret:0},{string:3,fret:0},{string:2,fret:0},{string:1,fret:3}] },
  'G7':    { startFret: 1, fingers: [{string:6,fret:3},{string:5,fret:2},{string:4,fret:0},{string:3,fret:0},{string:2,fret:1},{string:1,fret:1}] },
  'Gmaj7': { startFret: 1, fingers: [{string:6,fret:3},{string:5,fret:2},{string:4,fret:0},{string:3,fret:0},{string:2,fret:0},{string:1,fret:2}] },
};

export function lookupChord(name) {
  if (!name) return null;
  // Exact match first, then case-insensitive
  if (CHORD_LIBRARY[name]) return CHORD_LIBRARY[name];
  const lower = name.toLowerCase();
  const key = Object.keys(CHORD_LIBRARY).find(k => k.toLowerCase() === lower);
  return key ? CHORD_LIBRARY[key] : null;
}
