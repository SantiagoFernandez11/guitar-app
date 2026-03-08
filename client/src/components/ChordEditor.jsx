import { useState } from 'react';
import { Trash2 } from 'lucide-react';

// String labels left→right matching guitar orientation (low E to high e)
const STRING_ORDER = [6, 5, 4, 3, 2, 1];
const STRING_LABELS = { 6: 'E', 5: 'A', 4: 'D', 3: 'G', 2: 'B', 1: 'e' };
const FRET_COUNT = 5;

function emptyDraft() {
  return { name: '', fingers: [] };
}

export default function ChordEditor({ chords = [], onChange }) {
  const [draft, setDraft] = useState(emptyDraft());
  const [editingIndex, setEditingIndex] = useState(null);

  const toggleFinger = (string, fret) => {
    const target = editingIndex !== null ? chords[editingIndex] : draft;
    const existing = target.fingers.findIndex(f => f.string === string);

    let newFingers;
    if (existing !== -1 && target.fingers[existing].fret === fret) {
      // Same cell — clear it
      newFingers = target.fingers.filter((_, i) => i !== existing);
    } else if (existing !== -1) {
      // Different fret on same string — replace
      newFingers = target.fingers.map((f, i) => i === existing ? { string, fret } : f);
    } else {
      newFingers = [...target.fingers, { string, fret }];
    }

    if (editingIndex !== null) {
      const updated = chords.map((c, i) => i === editingIndex ? { ...c, fingers: newFingers } : c);
      onChange(updated);
    } else {
      setDraft(prev => ({ ...prev, fingers: newFingers }));
    }
  };

  const addChord = () => {
    if (!draft.name.trim()) return;
    onChange([...chords, { name: draft.name.trim(), fingers: draft.fingers }]);
    setDraft(emptyDraft());
  };

  const removeChord = (index) => {
    if (editingIndex === index) setEditingIndex(null);
    onChange(chords.filter((_, i) => i !== index));
  };

  const activeChord = editingIndex !== null ? chords[editingIndex] : draft;

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* Existing chords list */}
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

      {/* Editor grid */}
      <div style={{
        background: 'var(--bg-active)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '12px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
          {editingIndex !== null ? `Editing: ${chords[editingIndex]?.name}` : 'New Chord'}
        </div>

        {/* Name input (only for new chord) */}
        {editingIndex === null && (
          <div style={{ marginBottom: '12px' }}>
            <input
              value={draft.name}
              onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Chord name (e.g. Am, C, G7)"
              style={inputStyle}
            />
          </div>
        )}

        {/* Fretboard grid */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
            {/* String labels */}
            <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: '40px' }}>
              {STRING_ORDER.map(s => (
                <div key={s} style={{ width: '36px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {STRING_LABELS[s]}
                </div>
              ))}
            </div>

            {/* Open row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <div style={{ width: '40px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '8px', fontFamily: 'var(--font-mono)' }}>Open</div>
              {STRING_ORDER.map(s => {
                const isSet = activeChord.fingers.some(f => f.string === s && f.fret === 0);
                return (
                  <button key={s} onClick={() => toggleFinger(s, 0)} style={{
                    width: '36px', height: '28px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px',
                    background: isSet ? 'rgba(200,169,110,0.15)' : 'var(--bg-elevated)',
                    color: isSet ? 'var(--accent)' : 'var(--text-muted)',
                    borderColor: isSet ? 'var(--border-accent)' : 'var(--border)',
                    transition: 'all var(--transition)',
                  }}>
                    o
                  </button>
                );
              })}
            </div>

            {/* Fret rows 1–5 */}
            {Array.from({ length: FRET_COUNT }, (_, fi) => fi + 1).map(fret => (
              <div key={fret} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ width: '40px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '8px', fontFamily: 'var(--font-mono)' }}>
                  {fret}
                </div>
                {STRING_ORDER.map(s => {
                  const isSet = activeChord.fingers.some(f => f.string === s && f.fret === fret);
                  return (
                    <button key={s} onClick={() => toggleFinger(s, fret)} style={{
                      width: '36px', height: '28px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      background: isSet ? 'rgba(200,169,110,0.15)' : 'var(--bg-elevated)',
                      color: isSet ? 'var(--accent)' : 'var(--text-secondary)',
                      borderColor: isSet ? 'var(--border-accent)' : 'var(--border)',
                      fontWeight: isSet ? '600' : '400',
                      transition: 'all var(--transition)',
                    }}>
                      {fret}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Click a cell to place or clear a finger. Click a chord name above to edit it.
        </p>
      </div>

      {/* Add button (only when creating new chord) */}
      {editingIndex === null && (
        <button onClick={addChord} disabled={!draft.name.trim()} style={{
          padding: '7px 16px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-accent)', background: 'transparent',
          color: 'var(--accent)', cursor: draft.name.trim() ? 'pointer' : 'not-allowed',
          fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: '500',
          opacity: draft.name.trim() ? 1 : 0.4,
        }}>
          + Add Chord
        </button>
      )}

      {editingIndex !== null && (
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

const inputStyle = {
  width: '100%', padding: '8px 10px',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
};
