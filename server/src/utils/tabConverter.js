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

// Two-note technique symbols → technique name
const TWO_NOTE_TECHNIQUES = { h: 'hammerOn', p: 'pullOff', '/': 'slideUp', '\\': 'slideDown' };

function getNoteAtFret(openNote, openOctave, fret) {
  const openIndex = CHROMATIC.indexOf(openNote);
  const totalSemitones = openIndex + fret;
  const noteIndex = totalSemitones % 12;
  const octaveShift = Math.floor(totalSemitones / 12);
  return `${CHROMATIC[noteIndex]}${openOctave + octaveShift}`;
}

function parseNoteValue(noteText) {
  if (!noteText || noteText === '-') return null;
  if (noteText === 'x') return { fret: 0, type: 'muted', technique: null, destFret: null };

  // Harmonic <5>
  if (noteText.startsWith('<') && noteText.endsWith('>')) {
    const fret = parseInt(noteText.slice(1, -1));
    if (!isNaN(fret)) return { fret, type: 'fingered', technique: 'harmonic', destFret: null };
  }

  // Extract leading number
  let i = 0;
  while (i < noteText.length && noteText[i] >= '0' && noteText[i] <= '9') i++;
  if (i === 0) return null;

  const fret = parseInt(noteText.slice(0, i));
  const rest = noteText.slice(i);

  // Two-note techniques: h, p, /, \
  const twoNote = rest.match(/^([hp/\\])(\d+)/);
  if (twoNote) {
    return {
      fret,
      type: fret === 0 ? 'open' : 'fingered',
      technique: TWO_NOTE_TECHNIQUES[twoNote[1]] || null,
      destFret: parseInt(twoNote[2]),
    };
  }

  // Single-note modifiers
  if (rest.startsWith('^r')) return { fret, type: 'fingered', technique: 'bendRelease', destFret: null };
  if (rest.startsWith('^'))  return { fret, type: 'fingered', technique: 'bend',        destFret: null };
  if (rest.startsWith('~'))  return { fret, type: 'fingered', technique: 'vibrato',     destFret: null };

  return { fret, type: fret === 0 ? 'open' : 'fingered', technique: null, destFret: null };
}

function pushNotes(noteMap, parsed, openNote, openOctave, string, timestamp, chord, capo, techOffsetMs) {
  const noteName = parsed.type === 'muted'
    ? 'X'
    : getNoteAtFret(openNote, openOctave, parsed.fret + capo);

  noteMap.push({
    note: noteName,
    fret: parsed.fret,
    string,
    timestamp,
    chord,
    type: parsed.type,
    technique: parsed.technique || null,
  });

  // Second note for two-note techniques
  if (parsed.destFret !== null && parsed.destFret !== undefined && parsed.technique) {
    const destName = getNoteAtFret(openNote, openOctave, parsed.destFret + capo);
    noteMap.push({
      note: destName,
      fret: parsed.destFret,
      string,
      timestamp: timestamp + techOffsetMs,
      chord: '',
      type: 'fingered',
      technique: parsed.technique + 'Dest',
    });
  }
}

function convertFromEvents(tabData, bpm, tuning = 'standard', capo = 0) {
  const tuningConfig = TUNING_CONFIGS[tuning] || TUNING_CONFIGS.standard;
  const ticksPerBeat = tabData.ticksPerBeat || 12;
  const msPerTick = (60 / bpm * 1000) / ticksPerBeat;
  const BUFFER = 3000;
  const noteMap = [];

  tabData.events.forEach(event => {
    const timestamp = Math.round(event.tick * msPerTick) + BUFFER;
    const eventDurationMs = Math.round((event.duration || ticksPerBeat) * msPerTick);
    const techOffsetMs = Math.max(50, Math.round(eventDurationMs / 2));

    (event.notes || []).forEach(note => {
      const stringName = STRING_BY_NUMBER[note.string];
      if (!stringName) return;
      const tuningEntry = tuningConfig[stringName];
      if (!tuningEntry) return;
      const { n: openNote, o: openOctave } = tuningEntry;
      const parsed = parseNoteValue(note.fret);
      if (!parsed) return;
      pushNotes(noteMap, parsed, openNote, openOctave, note.string, timestamp, event.chord || '', capo, techOffsetMs);
    });
  });

  noteMap.sort((a, b) => a.timestamp - b.timestamp || a.string - b.string);
  return noteMap;
}

function convertFromLines(tabData, bpm, tuning = 'standard', capo = 0) {
  if (!tabData || !tabData.lines) return [];

  const tuningConfig = TUNING_CONFIGS[tuning] || TUNING_CONFIGS.standard;
  const msPerBeat = (60 / bpm) * 1000;
  const techOffsetMs = Math.max(50, Math.round(msPerBeat / 4));
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
      const chord = tabData.chords?.[position] || '';
      pushNotes(noteMap, parsed, openNote, openOctave, stringNumber, timestamp, chord, capo, techOffsetMs);
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
