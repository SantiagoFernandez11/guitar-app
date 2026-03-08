import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { lookupChord } from '../utils/chordLibrary';

// Strings displayed left→right matching guitar orientation (low E to high e)
const STRING_ORDER = [6, 5, 4, 3, 2, 1];
const STRING_LABELS = { 6: 'E', 5: 'A', 4: 'D', 3: 'G', 2: 'B', 1: 'e' };
const FRET_COUNT = 5;

function emptyDraft() {
  return { name: '', fingers: [], startFret: 1 };
}

export default function ChordEditor({ chords = [], onChange }) {
  const [draft, setDraft] = useState(emptyDraft());
  const [editingIndex, setEditingIndex] = useState(null);

  const activeChord = editingIndex !== null ? chords[editingIndex] : draft;
  const activeStartFret = activeChord.startFret || 1;

  // Fret rows shown in the grid
  const fretRows = activeStartFret === 1
    ? [0, ...Array.from({ length: FRET_COUNT }, (_, i) => i + 1)]  // open + frets 1–5
    : Array.from({ length: FRET_COUNT }, (_, i) => i + activeStartFret); // frets N–N+4

  const preset = editingIndex === null ? lookupChord(draft.name) : null;

  const toggleFinger = (string, fret) => {
    const existing = activeChord.fingers.findIndex(f => f.string === string);
    let newFingers;
    if (existing !== -1 && activeChord.fingers[existing].fret === fret) {
      newFingers = activeChord.fingers.filter((_, i) => i !== existing);
    } else if (existing !== -1) {
      newFingers = activeChord.fingers.map((f, i) => i === existing ? { string, fret } : f);
    } else {
      newFingers = [...activeChord.fingers, { string, fret }];
    }

    if (editingIndex !== null) {
      onChange(chords.map((c, i) => i === editingIndex ? { ...c, fingers: newFingers } : c));
    } else {
      setDraft(prev => ({ ...prev, fingers: newFingers }));
    }
  };

  const updateStartFret = (newStartFret) => {
    const sf = Math.max(1, Math.min(12, newStartFret));
    // Clear fingers when repositioning — they're no longer meaningful
    if (editingIndex !== null) {
      onChange(chords.map((c, i) => i === editingIndex ? { ...c, startFret: sf, fingers: [] } : c));
    } else {
      setDraft(prev => ({ ...prev, startFret: sf, fingers: [] }));
    }
  };

  const applyPreset = () => {
    if (!preset) return;
    setDraft(prev => ({ ...prev, fingers: preset.fingers, startFret: preset.startFret }));
  };

  const addChord = () => {
    if (!draft.name.trim()) return;
    onChange([...chords, { name: draft.name.trim(), fingers: draft.fingers, startFret: draft.startFret }]);
    setDraft(emptyDraft());
  };

  const removeChord = (index) => {
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && index < editingIndex) setEditingIndex(editingIndex - 1);
    onChange(chords.filter((_, i) => i !== index));
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* Existing chords */}
      {chords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {chords.map((chord, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${editingIndex === i ? 'var(--border-accent)' : 'var(--border)'}`,
              background: editingIndex === i ? 'rgba(200,169,110,0.06)' : 'var(--bg-active)',
            }}>
              <button onClick={() => setEditingIndex(editingIndex === i ? null : i)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: 'var(--font-mono)', fontSize: '13px',
                color: editingIndex === i ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {chord.name}
              </button>
              <button onClick={() => removeChord(i)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div style={{
        background: 'var(--bg-active)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '12px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
          {editingIndex !== null ? `Editing: ${chords[editingIndex]?.name}` : 'New Chord'}
        </div>

        {/* Name + starting fret (new chord only) */}
        {editingIndex === null && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '140px' }}>
              <label style={labelStyle}>Chord name</label>
              <input
                value={draft.name}
                onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Am, C, G7"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={labelStyle}>Starting fret</label>
              <input
                type="number" min={1} max={12} value={activeStartFret}
                onChange={e => updateStartFret(parseInt(e.target.value) || 1)}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Starting fret for existing chord */}
        {editingIndex !== null && (
          <div style={{ marginBottom: '12px', maxWidth: '140px' }}>
            <label style={labelStyle}>Starting fret</label>
            <input
              type="number" min={1} max={12} value={activeStartFret}
              onChange={e => updateStartFret(parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </div>
        )}

        {/* Library preset suggestion */}
        {preset && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', marginBottom: '12px',
            background: 'rgba(200,169,110,0.05)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-sm)', gap: '12px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Preset found for <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{draft.name}</span>
            </span>
            <button onClick={applyPreset} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap',
              border: '1px solid var(--border-accent)', background: 'transparent',
              color: 'var(--accent)', cursor: 'pointer', fontSize: '12px',
              fontFamily: 'var(--font-body)', fontWeight: '500',
            }}>
              Use preset
            </button>
          </div>
        )}

        {/* Fretboard grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
            {/* String labels */}
            <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: '48px' }}>
              {STRING_ORDER.map(s => (
                <div key={s} style={{ width: '36px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {STRING_LABELS[s]}
                </div>
              ))}
            </div>

            {fretRows.map(fret => {
              const isOpen = fret === 0;
              return (
                <div key={fret} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ width: '48px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '8px', fontFamily: 'var(--font-mono)' }}>
                    {isOpen ? 'Open' : fret}
                  </div>
                  {STRING_ORDER.map(s => {
                    const isSet = activeChord.fingers.some(f => f.string === s && f.fret === fret);
                    return (
                      <button key={s} onClick={() => toggleFinger(s, fret)} style={{
                        width: '36px', height: '28px',
                        border: `1px solid ${isSet ? 'var(--border-accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        fontSize: isOpen ? '13px' : '11px',
                        fontFamily: 'var(--font-mono)',
                        background: isSet ? 'rgba(200,169,110,0.15)' : 'var(--bg-elevated)',
                        color: isSet ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: isSet ? '600' : '400',
                        transition: 'all var(--transition)',
                      }}>
                        {isOpen ? 'o' : fret}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Click a cell to place or clear a finger. Click a chord name above to edit it.
          Changing the starting fret clears placed fingers.
        </p>
      </div>

      {editingIndex === null ? (
        <button onClick={addChord} disabled={!draft.name.trim()} style={{
          padding: '7px 16px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-accent)', background: 'transparent',
          color: 'var(--accent)', cursor: draft.name.trim() ? 'pointer' : 'not-allowed',
          fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: '500',
          opacity: draft.name.trim() ? 1 : 0.4,
        }}>
          + Add Chord
        </button>
      ) : (
        <button onClick={() => setEditingIndex(null)} style={{
          padding: '7px 16px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-secondary)', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'var(--font-body)',
        }}>
          Done Editing
        </button>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '500',
  marginBottom: '5px', color: 'var(--text-secondary)',
};
const inputStyle = {
  width: '100%', padding: '8px 10px',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
};
