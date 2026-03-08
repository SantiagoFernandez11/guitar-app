import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const TECHNIQUES = [
  { value: 'normal', label: 'Normal', symbol: '' },
  { value: 'slideUp', label: 'Slide Up', symbol: '/' },
  { value: 'slideDown', label: 'Slide Down', symbol: '\\' },
  { value: 'hammerOn', label: 'Hammer-On', symbol: 'h' },
  { value: 'pullOff', label: 'Pull-Off', symbol: 'p' },
  { value: 'bend', label: 'Bend', symbol: '^' },
  { value: 'release', label: 'Release', symbol: 'r' },
  { value: 'vibrato', label: 'Vibrato', symbol: '~' },
  { value: 'mute', label: 'Mute', symbol: 'x' },
  { value: 'harmonic', label: 'Harmonic', symbol: '<>' },
];

const FRETS = Array.from({ length: 13 }, (_, i) => i);
const COL_WIDTH = 36;

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
  const initialSyncDone = useRef(false);

  // Sync when tabData is loaded asynchronously (e.g. in EditSong)
  useEffect(() => {
    if (tabData && !initialSyncDone.current) {
      initialSyncDone.current = true;
      setTab(tabData);
    }
  }, [tabData]);

  const [tabLength, setTabLength] = useState(32);
  const [technique, setTechnique] = useState('normal');
  const [pendingTechnique, setPendingTechnique] = useState(null);

  const updateTab = (newTab) => { setTab(newTab); onChange?.(newTab); };

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
    if (technique === 'mute') noteText = 'x';
    else if (technique === 'harmonic') noteText = `<${fret}>`;
    else if (technique === 'normal') noteText = String(fret);
    else if (technique === 'bend') noteText = `${fret}^`;
    else if (technique === 'release') noteText = `${fret}^r`;
    else if (technique === 'vibrato') noteText = `${fret}~`;
    else {
      const t = TECHNIQUES.find(t => t.value === technique);
      setPendingTechnique({ stringIndex, position, fret, symbol: t.symbol });
      noteText = String(fret);
    }

    line.notes[position] = noteText;
    updateTab(newTab);
  };

  const removeNote = (stringIndex, pos) => {
    const newTab = JSON.parse(JSON.stringify(tab));
    if (newTab.lines[stringIndex].notes[pos] !== undefined) newTab.lines[stringIndex].notes[pos] = '-';
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
    newTab.lines.forEach(line => { if (line.notes[position] !== undefined) line.notes[position] = '-'; });
    if (newTab.chords[position] !== undefined) newTab.chords[position] = '';
    updateTab(newTab);
    setPendingTechnique(null);
  };

  const movePosition = (dir) => {
    setPendingTechnique(null);
    setPosition(p => Math.max(0, Math.min(tabLength - 1, p + dir)));
  };

  const iconBtnStyle = {
    padding: '5px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'transparent',
    cursor: 'pointer', color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all var(--transition)',
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* Position Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => movePosition(-1)} disabled={position === 0}
          style={{ ...iconBtnStyle, opacity: position === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Position</span>
        <input type="number" value={position + 1} min={1} max={tabLength}
          onChange={e => { const val = parseInt(e.target.value) - 1; if (!isNaN(val)) setPosition(Math.max(0, Math.min(tabLength - 1, val))); }}
          style={{ width: '52px', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '12px', background: 'var(--bg-active)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ {tabLength}</span>
        <button onClick={() => movePosition(1)} disabled={position === tabLength - 1}
          style={{ ...iconBtnStyle, opacity: position === tabLength - 1 ? 0.3 : 1 }}>
          <ChevronRight size={15} />
        </button>
        <button onClick={() => setTabLength(l => l + 16)} title="Extend tab" style={{ ...iconBtnStyle, marginLeft: '4px' }}>
          <Plus size={15} />
        </button>
        <button onClick={clearPosition} title="Clear position" style={iconBtnStyle}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Technique + Chord */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={labelStyle}>Technique</label>
          <select value={technique} onChange={e => { setTechnique(e.target.value); setPendingTechnique(null); }} style={inputStyle}>
            {TECHNIQUES.map(t => (
              <option key={t.value} value={t.value}>{t.label}{t.symbol ? ` (${t.symbol})` : ''}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={labelStyle}>Chord at position</label>
          <input type="text" value={tab.chords[position] || ''} onChange={e => setChord(e.target.value)}
            placeholder="e.g. Am, C, G7" style={inputStyle} />
        </div>
      </div>

      {pendingTechnique && (
        <div style={{ padding: '8px 12px', background: 'rgba(200,169,110,0.06)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '12px', color: 'var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Click the destination fret on the same string to complete the technique</span>
          <button onClick={() => setPendingTechnique(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: '600', fontSize: '12px' }}>Cancel</button>
        </div>
      )}

      {/* Fretboard */}
      <div style={{ background: 'var(--bg-active)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fretboard</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click a fret to add note</span>
        </div>
        <div style={{ minWidth: 'max-content' }}>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <div style={{ width: '28px' }} />
            {FRETS.map(f => (
              <div key={f} style={{ width: '36px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{f}</div>
            ))}
          </div>
          {tab.lines.map((line, si) => (
            <div key={line.string} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '28px', fontWeight: '600', fontSize: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{line.string}</div>
              {FRETS.map(f => (
                <button key={f} onClick={() => addNote(si, f)}
                  style={{ width: '36px', height: '28px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', cursor: 'pointer', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', transition: 'all var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {f}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Preview */}
      <div style={{ background: '#0d0d0d', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tab Preview</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Click notes to remove · Current position highlighted</span>
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            {/* Chord row */}
            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <div style={{ width: '24px', flexShrink: 0 }} />
              {Array.from({ length: tabLength }).map((_, i) => (
                <div key={i} style={{ width: `${COL_WIDTH}px`, flexShrink: 0, textAlign: 'center', background: i === position ? 'rgba(200,169,110,0.08)' : 'transparent', color: i === position ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '11px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {tab.chords[i] || ''}
                </div>
              ))}
            </div>
            {/* String rows */}
            {tab.lines.map((line, si) => (
              <div key={line.string} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ width: '24px', flexShrink: 0, color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px' }}>
                  {line.string}|
                </div>
                {Array.from({ length: tabLength }).map((_, i) => {
                  const note = line.notes[i] || '-';
                  const isActive = i === position;
                  const hasNote = note !== '-';
                  return (
                    <button key={i} onClick={() => removeNote(si, i)}
                      style={{ width: `${COL_WIDTH}px`, flexShrink: 0, height: '20px', background: isActive ? 'rgba(200,169,110,0.08)' : 'transparent', color: hasNote ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', cursor: hasNote ? 'pointer' : 'default', fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'center', padding: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {note}
                    </button>
                  );
                })}
                <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>|</div>
              </div>
            ))}
          </div>
        </div>
        {/* Technique legend */}
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Techniques</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {TECHNIQUES.filter(t => t.value !== 'normal').map(t => (
              <div key={t.value} style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: '600' }}>{t.symbol}</span> {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '5px', color: 'var(--text-secondary)' };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '12px', background: 'var(--bg-active)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' };