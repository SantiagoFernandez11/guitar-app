const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRING_NUMBER = { e: 1, B: 2, G: 3, D: 4, A: 5, E: 6 };
const STRING_BY_NUMBER = { 1: 'e', 2: 'B', 3: 'G', 4: 'D', 5: 'A', 6: 'E' };

// Open string notes for each tuning (strings keyed by tab notation: e, B, G, D, A, E)
const TUNING_CONFIGS = {
  standard:     { e:{n:'E',o:4}, B:{n:'B',o:3}, G:{n:'G',o:3}, D:{n:'D',o:3}, A:{n:'A',o:2}, E:{n:'E',o:2} },
  dropD:        { e:{n:'E',o:4}, B:{n:'B',o:3}, G:{n:'G',o:3}, D:{n:'D',o:3}, A:{n:'A',o:2}, E:{n:'D',o:2} },
  halfStepDown: { e:{n:'D#',o:4}, B:{n:'A#',o:3}, G:{n:'F#',o:3}, D:{n:'C#',o:3}, A:{n:'G#',o:2}, E:{n:'D#',o:2} },
  openG:        { e:{n:'D',o:4}, B:{n:'B',o:3}, G:{n:'G',o:3}, D:{n:'D',o:3}, A:{n:'G',o:2}, E:{n:'D',o:2} },
  openD:        { e:{n:'D',o:4}, B:{n:'A',o:3}, G:{n:'F#',o:3}, D:{n:'D',o:3}, A:{n:'A',o:2}, E:{n:'D',o:2} },
  dadgad:       { e:{n:'D',o:4}, B:{n:'A',o:3}, G:{n:'G',o:3}, D:{n:'D',o:3}, A:{n:'A',o:2}, E:{n:'D',o:2} },
};

function getNoteAtFret(openNote, openOctave, fret) {
  const openIndex = CHROMATIC.indexOf(openNote);
  const totalSemitones = openIndex + fret;
  const noteIndex = totalSemitones % 12;
  const octaveShift = Math.floor(totalSemitones / 12);
  return `${CHROMATIC[noteIndex]}${openOctave + octaveShift}`;
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

function convertFromEvents(tabData, bpm, tuning = 'standard', capo = 0) {
  const tuningConfig = TUNING_CONFIGS[tuning] || TUNING_CONFIGS.standard;
  const ticksPerBeat = tabData.ticksPerBeat || 12;
  const msPerTick = (60 / bpm * 1000) / ticksPerBeat;
  const BUFFER = 3000;
  const noteMap = [];

  tabData.events.forEach(event => {
    const timestamp = Math.round(event.tick * msPerTick) + BUFFER;
    (event.notes || []).forEach(note => {
      const stringName = STRING_BY_NUMBER[note.string];
      if (!stringName) return;
      const tuningEntry = tuningConfig[stringName];
      if (!tuningEntry) return;
      const { n: openNote, o: openOctave } = tuningEntry;
      const parsed = parseNoteValue(note.fret);
      if (!parsed) return;
      const noteName = parsed.type === 'muted'
        ? 'X'
        : getNoteAtFret(openNote, openOctave, parsed.fret + capo);
      noteMap.push({
        note: noteName,
        fret: parsed.fret,
        string: note.string,
        timestamp,
        chord: event.chord || '',
        type: parsed.type,
      });
    });
  });

  noteMap.sort((a, b) => a.timestamp - b.timestamp || a.string - b.string);
  return noteMap;
}

function convertFromLines(tabData, bpm, tuning = 'standard', capo = 0) {
  if (!tabData || !tabData.lines) return [];

  const tuningConfig = TUNING_CONFIGS[tuning] || TUNING_CONFIGS.standard;
  const msPerBeat = (60 / bpm) * 1000;
  const noteMap = [];
  const BUFFER = 3000;

  tabData.lines.forEach(line => {
    const stringName = line.string;
    const stringNumber = STRING_NUMBER[stringName];
    if (!stringNumber) return;

    const { n: openNote, o: openOctave } = tuningConfig[stringName];

    line.notes.forEach((noteText, position) => {
      const parsed = parseNoteValue(noteText);
      if (!parsed) return;

      const timestamp = Math.round(position * msPerBeat) + BUFFER;
      // Tab is written relative to capo, so sounding pitch = fret + capo semitones above open string
      const noteName = parsed.type === 'muted'
        ? 'X'
        : getNoteAtFret(openNote, openOctave, parsed.fret + capo);
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

function convertTabToNoteMap(tabData, bpm, tuning = 'standard', capo = 0) {
  if (!tabData) return [];
  if (tabData.events && tabData.events.length > 0) {
    return convertFromEvents(tabData, bpm, tuning, capo);
  }
  if (tabData.lines && tabData.lines.length > 0) {
    return convertFromLines(tabData, bpm, tuning, capo);  // legacy
  }
  return [];
}

module.exports = { convertTabToNoteMap };
