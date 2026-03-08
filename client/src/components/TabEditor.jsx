import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const TECHNIQUES = [
  { value: 'normal', label: 'Normal', symbol: '' },
  { value: 'slideUp', label: 'Slide Up', symbol: '/' },
  { value: 'slideDown', label: 'Slide Down', symbol: '\\\\' },
  { value: 'hammerOn', label: 'Hammer-On', symbol: 'h' },
  { value: 'pullOff', label: 'Pull-Off', symbol: 'p' },
  { value: 'bend', label: 'Bend', symbol: '^' },
  { value: 'release', label: 'Release', symbol: 'r' },
  { value: 'vibrato', label: 'Vibrato', symbol: '~' },
  { value: 'mute', label: 'Mute', symbol: 'x' },
  { value: 'harmonic', label: 'Harmonic', symbol: '<>' },
];

const FRETS = Array.from({ length: 13 }, (_, i) => i);
const COL_WIDTH = 36; // fixed px width per position

export default function TabEditor({ tabData, onChange }) {
  const [tab, setTab] = useState(tabData || {
    chords: [],
    lines: [
      { string: 'e', notes: [] },
      { string: 'B', notes: [] },
      { string: 'G', notes: [] },
      { string: 'D', notes: [] },
      { string: 'A', notes: [] },
      { string: 'E', notes: [] },
    ]
  });
  const [position, setPosition] = useState(0);
  const [tabLength, setTabLength] = useState(32);
  const [technique, setTechnique] = useState('normal');
  const [pendingTechnique, setPendingTechnique] = useState(null);

  const updateTab = (newTab) => {
    setTab(newTab);
    onChange?.(newTab);
  };

  const addNote = (stringIndex, fret) => {
    const newTab = JSON.parse(JSON.stringify(tab));
    const line = newTab.lines[stringIndex];

    while (line.notes.length <= position) line.notes.push('-');
    while (newTab.chords.length <= position) newTab.chords.push('');

    if (pendingTechnique) {
      const { stringIndex: fromString, position: fromPos, fret: fromFret, symbol } = pendingTechnique;
      if (fromString !== stringIndex) { setPendingTechnique(null); return; }
      while (line.notes.length <= fromPos) line.notes.push('-');
      line.notes[fromPos] = `${fromFret}${symbol}${fret}`;
      setPendingTechnique(null);
      updateTab(newTab);
      return;
    }

    let noteText = '';
    if (technique === 'mute') {
      noteText = 'x';
    } else if (technique === 'harmonic') {
      noteText = `<${fret}>`;
    } else if (technique === 'normal') {
      noteText = String(fret);
    } else if (technique === 'bend') {
      noteText = `${fret}^`;
    } else if (technique === 'release') {
      noteText = `${fret}^r`;
    } else if (technique === 'vibrato') {
      noteText = `${fret}~`;
    } else {
      const t = TECHNIQUES.find(t => t.value === technique);
      setPendingTechnique({ stringIndex, position, fret, symbol: t.symbol });
      noteText = String(fret);
    }

    line.notes[position] = noteText;
    // No auto-advance — position stays where it is
    updateTab(newTab);
  };

  const removeNote = (stringIndex, pos) => {
    const newTab = JSON.parse(JSON.stringify(tab));
    if (newTab.lines[stringIndex].notes[pos] !== undefined) {
      newTab.lines[stringIndex].notes[pos] = '-';
    }
    updateTab(newTab);
  };

  const setChord = (value) => {
    const newTab = JSON.parse(JSON.stringify(tab));
    while (newTab.chords.length <= position) newTab.chords.push('');
    newTab.chords[position] = value;
    updateTab(newTab);
  };

  const clearPosition = () => {
    const newTab = JSON.parse(JSON.stringify(tab));
    newTab.lines.forEach(line => {
      if (line.notes[position] !== undefined) line.notes[position] = '-';
    });
    if (newTab.chords[position] !== undefined) newTab.chords[position] = '';
    updateTab(newTab);
    setPendingTechnique(null);
  };

  const movePosition = (dir) => {
    setPendingTechnique(null);
    setPosition(p => Math.max(0, Math.min(tabLength - 1, p + dir)));
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>

      {/* Position Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button onClick={() => movePosition(-1)} disabled={position === 0}
          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', opacity: position === 0 ? 0.4 : 1 }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '0.9rem', color: '#374151' }}>Position</span>
        <input type="number" value={position + 1} min={1} max={tabLength}
          onChange={e => {
            const val = parseInt(e.target.value) - 1;
            if (!isNaN(val)) setPosition(Math.max(0, Math.min(tabLength - 1, val)));
          }}
          style={{ width: '60px', padding: '0.35rem', border: '1px solid #d1d5db', borderRadius: '6px', textAlign: 'center', fontSize: '0.9rem' }} />
        <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>/ {tabLength}</span>
        <button onClick={() => movePosition(1)} disabled={position === tabLength - 1}
          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', opacity: position === tabLength - 1 ? 0.4 : 1 }}>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setTabLength(l => l + 16)} title="Extend tab"
          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', marginLeft: '0.5rem' }}>
          <Plus size={16} />
        </button>
        <button onClick={clearPosition} title="Clear position"
          style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Technique + Chord */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Technique</label>
          <select value={technique} onChange={e => { setTechnique(e.target.value); setPendingTechnique(null); }}
            style={inputStyle}>
            {TECHNIQUES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}{t.symbol ? ` (${t.symbol})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Chord at position</label>
          <input type="text" value={tab.chords[position] || ''} onChange={e => setChord(e.target.value)}
            placeholder="e.g. Am, C, G7"
            style={inputStyle} />
        </div>
      </div>

      {pendingTechnique && (
        <div style={{ padding: '0.6rem 1rem', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e', display: 'flex', justifyContent: 'space-between' }}>
          <span>Click the destination fret on the same string to complete the technique</span>
          <button onClick={() => setPendingTechnique(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#92400e' }}>Cancel</button>
        </div>
      )}

      {/* Fretboard */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Fretboard</span>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Click a fret to add note</span>
        </div>
        <div style={{ minWidth: 'max-content' }}>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <div style={{ width: '28px' }} />
            {FRETS.map(f => (
              <div key={f} style={{ width: '36px', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>{f}</div>
            ))}
          </div>
          {tab.lines.map((line, si) => (
            <div key={line.string} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '28px', fontWeight: '700', fontSize: '0.9rem', textAlign: 'center', color: '#374151' }}>{line.string}</div>
              {FRETS.map(f => (
                <button key={f} onClick={() => addNote(si, f)}
                  style={{ width: '36px', height: '32px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#374151'; }}>
                  {f}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Preview */}
      <div style={{ background: '#111827', borderRadius: '10px', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '0.9rem' }}>Tab Preview</span>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Click notes to remove · Current position highlighted</span>
        </div>

        {/* Scrollable tab content */}
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content', fontFamily: 'monospace', fontSize: '0.85rem' }}>

            {/* Chord row */}
            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '24px', flexShrink: 0 }} />
              {Array.from({ length: tabLength }).map((_, i) => (
                <div key={i} style={{
                  width: `${COL_WIDTH}px`,
                  flexShrink: 0,
                  textAlign: 'center',
                  background: i === position ? '#374151' : 'transparent',
                  color: '#e5e7eb',
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {tab.chords[i] || ''}
                </div>
              ))}
            </div>

            {/* String rows */}
            {tab.lines.map((line, si) => (
              <div key={line.string} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ width: '24px', flexShrink: 0, color: '#e5e7eb', fontWeight: '700', fontSize: '0.85rem' }}>
                  {line.string}|
                </div>
                {Array.from({ length: tabLength }).map((_, i) => {
                  const note = line.notes[i] || '-';
                  const isActive = i === position;
                  const hasNote = note !== '-';
                  return (
                    <button key={i} onClick={() => removeNote(si, i)}
                      style={{
                        width: `${COL_WIDTH}px`,
                        flexShrink: 0,
                        height: '22px',
                        background: isActive ? '#374151' : 'transparent',
                        color: hasNote ? '#f9fafb' : '#4b5563',
                        border: 'none',
                        cursor: hasNote ? 'pointer' : 'default',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        padding: 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                      {note}
                    </button>
                  );
                })}
                <div style={{ color: '#e5e7eb', fontWeight: '700' }}>|</div>
              </div>
            ))}
          </div>
        </div>

        {/* Technique legend */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #374151' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' }}>Techniques</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {TECHNIQUES.filter(t => t.value !== 'normal').map(t => (
              <div key={t.value} style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                <span style={{ fontFamily: 'monospace', color: '#e5e7eb', fontWeight: '700' }}>{t.symbol}</span> {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px', color: '#374151' };
const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', background: 'white', color: '#111827' };