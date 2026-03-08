const NOTE_MAP = {
  e: { openNote: 'E', octave: 4 },
  B: { openNote: 'B', octave: 3 },
  G: { openNote: 'G', octave: 3 },
  D: { openNote: 'D', octave: 3 },
  A: { openNote: 'A', octave: 2 },
  E: { openNote: 'E', octave: 2 }
};

const STRING_NUMBER = { e: 1, B: 2, G: 3, D: 4, A: 5, E: 6 };

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteAtFret(stringName, fret) {
  const { openNote, octave } = NOTE_MAP[stringName];
  const openIndex = CHROMATIC.indexOf(openNote);
  const noteIndex = (openIndex + fret) % 12;
  const octaveOffset = Math.floor((openIndex + fret) / 12);
  return `${CHROMATIC[noteIndex]}${octave + octaveOffset}`;
}

function parseNoteValue(noteText) {
  if (!noteText || noteText === '-') return null;
  if (noteText === 'x') return { fret: 0, type: 'muted' };

  // Harmonic <5>
  if (noteText.startsWith('<') && noteText.endsWith('>')) {
    const fret = parseInt(noteText.slice(1, -1));
    if (!isNaN(fret)) return { fret, type: 'fingered' };
  }

  // Extract leading number
  let numStr = '';
  for (let i = 0; i < noteText.length; i++) {
    if (noteText[i] >= '0' && noteText[i] <= '9') {
      numStr += noteText[i];
    } else {
      break;
    }
  }

  if (numStr.length > 0) {
    const fret = parseInt(numStr);
    return { fret, type: fret === 0 ? 'open' : 'fingered' };
  }

  return null;
}

function convertTabToNoteMap(tabData, bpm) {
  if (!tabData || !tabData.lines) return [];

  const msPerBeat = (60 / bpm) * 1000;
  const noteMap = [];

  tabData.lines.forEach(line => {
    const stringName = line.string;
    const stringNumber = STRING_NUMBER[stringName];

    if (!stringNumber) return;

    line.notes.forEach((noteText, position) => {
      const parsed = parseNoteValue(noteText);
      if (!parsed) return;

      const BUFFER = 3000;

      const timestamp = Math.round(position * msPerBeat) + BUFFER;
      const noteName = parsed.type === 'muted' ? 'X' : getNoteAtFret(stringName, parsed.fret);
      const chordAtPosition = tabData.chords?.[position] || '';

      noteMap.push({
        note: noteName,
        fret: parsed.fret,
        string: stringNumber,
        timestamp,
        chord: chordAtPosition,
        type: parsed.type
      });
    });
  });

  noteMap.sort((a, b) => a.timestamp - b.timestamp || a.string - b.string);

  return noteMap;
}

module.exports = { convertTabToNoteMap };