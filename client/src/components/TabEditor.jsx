import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { lookupChord } from '../utils/chordLibrary';

const TICKS_PER_BEAT = 12;
const PX_PER_TICK = 6;
const LANE_HEIGHT = 24;

const DURATIONS = [
  { label: '1/1',   value: 'whole',      ticks: 48 },
  { label: '1/2',   value: 'half',       ticks: 24 },
  { label: '1/2.',  value: 'half.',      ticks: 36 },
  { label: '1/4',   value: 'quarter',    ticks: 12 },
  { label: '1/4.',  value: 'quarter.',   ticks: 18 },
  { label: '1/8',   value: 'eighth',     ticks: 6  },
  { label: '1/8.',  value: 'eighth.',    ticks: 9  },
  { label: '1/16',  value: 'sixteenth',  ticks: 3  },
  { label: '1/4T',  value: 'quarter3',   ticks: 8  },
  { label: '1/8T',  value: 'eighth3',    ticks: 4  },
  { label: '1/16T', value: 'sixteenth3', ticks: 2  },
];

const TECHNIQUES = [
  { value: 'normal',    label: 'Normal',     symbol: '' },
  { value: 'slideUp',   label: 'Slide Up',   symbol: '/' },
  { value: 'slideDown', label: 'Slide Down', symbol: '\\' },
  { value: 'hammerOn',  label: 'Hammer-On',  symbol: 'h' },
  { value: 'pullOff',   label: 'Pull-Off',   symbol: 'p' },
  { value: 'bend',      label: 'Bend',       symbol: '^' },
  { value: 'release',   label: 'Release',    symbol: 'r' },
  { value: 'vibrato',   label: 'Vibrato',    symbol: '~' },
  { value: 'mute',      label: 'Mute',       symbol: 'x' },
  { value: 'harmonic',  label: 'Harmonic',   symbol: '<>' },
];

const FRETS = Array.from({ length: 13 }, (_, i) => i);
const STRINGS = [1, 2, 3, 4, 5, 6]; // high e → low E
const STRING_NAMES = { 1: 'e', 2: 'B', 3: 'G', 4: 'D', 5: 'A', 6: 'E' };

// Open string MIDI note numbers (string 1–6) per tuning
const TUNING_MIDI = {
  standard:     [64, 59, 55, 50, 45, 40],
  dropD:        [64, 59, 55, 50, 45, 38],
  halfStepDown: [63, 58, 54, 49, 44, 39],
  openG:        [62, 59, 55, 50, 43, 38],
  openD:        [62, 57, 54, 50, 45, 38],
  dadgad:       [62, 57, 55, 50, 45, 38],
};

function parseFretForPlayback(fretStr) {
  if (!fretStr || fretStr === '-' || fretStr === 'x') return null;
  if (fretStr.startsWith('<') && fretStr.endsWith('>')) return parseInt(fretStr.slice(1, -1));
  const num = parseInt(fretStr);
  return isNaN(num) ? null : num;
}

function schedulePluck(audioCtx, midiNote, startTime) {
  const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, startTime);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4000, startTime);
  filter.frequency.exponentialRampToValueAtTime(600, startTime + 0.25);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.35, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + 1.8);
}

const defaultTabData = () => ({ ticksPerBeat: TICKS_PER_BEAT, events: [] });

export default function TabEditor({ tabData: initialTabData, onChange, bpm = 120, tuning = 'standard', capo = 0 }) {
  const [tabData, setTabData] = useState(() => {
    if (initialTabData?.events) return initialTabData;
    return defaultTabData();
  });
  const [currentTick, setCurrentTick] = useState(0);
  const [duration, setDuration] = useState('quarter');
  const [technique, setTechnique] = useState('normal');
  const [pendingTechnique, setPendingTechnique] = useState(null);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const initialSyncDone = useRef(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (initialTabData && !initialSyncDone.current) {
      initialSyncDone.current = true;
      if (initialTabData.events) {
        setTabData(initialTabData);
      }
    }
  }, [initialTabData]);

  useEffect(() => {
    if (!previewRef.current) return;
    const x = currentTick * PX_PER_TICK - previewRef.current.clientWidth / 2;
    previewRef.current.scrollLeft = Math.max(0, x);
  }, [currentTick]);

  const currentDurationTicks = DURATIONS.find(d => d.value === duration)?.ticks ?? 12;
  const ticksPerBeat = tabData.ticksPerBeat || TICKS_PER_BEAT;
  const ticksPerBar = ticksPerBeat * 4;

  const bar = Math.floor(currentTick / ticksPerBar) + 1;
  const beatInBar = Math.floor((currentTick % ticksPerBar) / ticksPerBeat) + 1;
  const tickInBeat = currentTick % ticksPerBeat;

  const currentEvent = tabData.events.find(e => e.tick === currentTick);
  const currentChord = currentEvent?.chord || '';

  const updateTabData = (newTabData) => {
    setTabData(newTabData);
    onChange?.(newTabData);
  };

  const addNote = (string, fret) => {
    const newTabData = JSON.parse(JSON.stringify(tabData));

    if (pendingTechnique) {
      const { string: fromString, tick: fromTick, fret: fromFret, symbol } = pendingTechnique;
      if (fromString !== string) { setPendingTechnique(null); return; }
      const fromEvent = newTabData.events.find(e => e.tick === fromTick);
      if (fromEvent) {
        const note = fromEvent.notes.find(n => n.string === fromString);
        if (note) note.fret = `${fromFret}${symbol}${fret}`;
      }
      setPendingTechnique(null);
      updateTabData(newTabData);
      return;
    }

    let event = newTabData.events.find(e => e.tick === currentTick);
    if (!event) {
      event = { tick: currentTick, chord: currentChord, notes: [], duration: currentDurationTicks };
      newTabData.events.push(event);
      newTabData.events.sort((a, b) => a.tick - b.tick);
    }
    event.duration = currentDurationTicks;

    let noteText = '';
    if (technique === 'mute') noteText = 'x';
    else if (technique === 'harmonic') noteText = `<${fret}>`;
    else if (technique === 'normal') noteText = String(fret);
    else if (technique === 'bend') noteText = `${fret}^`;
    else if (technique === 'release') noteText = `${fret}^r`;
    else if (technique === 'vibrato') noteText = `${fret}~`;
    else {
      const t = TECHNIQUES.find(t => t.value === technique);
      setPendingTechnique({ string, tick: currentTick, fret, symbol: t.symbol });
      noteText = String(fret);
    }

    event.notes = event.notes.filter(n => n.string !== string);
    event.notes.push({ string, fret: noteText });
    updateTabData(newTabData);

    if (autoAdvance) setCurrentTick(prev => prev + currentDurationTicks);
  };

  const removeNote = (tick, string) => {
    const newTabData = JSON.parse(JSON.stringify(tabData));
    const event = newTabData.events.find(e => e.tick === tick);
    if (!event) return;
    event.notes = event.notes.filter(n => n.string !== string);
    if (event.notes.length === 0 && !event.chord) {
      newTabData.events = newTabData.events.filter(e => e.tick !== tick);
    }
    updateTabData(newTabData);
  };

  const setChordAtTick = (chord) => {
    const newTabData = JSON.parse(JSON.stringify(tabData));
    let event = newTabData.events.find(e => e.tick === currentTick);
    if (event) {
      event.chord = chord;
      if (!chord && event.notes.length === 0) {
        newTabData.events = newTabData.events.filter(e => e.tick !== currentTick);
      }
    } else if (chord) {
      newTabData.events.push({ tick: currentTick, chord, notes: [], duration: currentDurationTicks });
      newTabData.events.sort((a, b) => a.tick - b.tick);
    }
    updateTabData(newTabData);
  };

  const clearCurrentTick = () => {
    const newTabData = JSON.parse(JSON.stringify(tabData));
    newTabData.events = newTabData.events.filter(e => e.tick !== currentTick);
    updateTabData(newTabData);
    setPendingTechnique(null);
  };

  const fillChordPreset = () => {
    const preset = lookupChord(currentChord);
    if (!preset) return;
    const newTabData = JSON.parse(JSON.stringify(tabData));
    let event = newTabData.events.find(e => e.tick === currentTick);
    if (!event) {
      event = { tick: currentTick, chord: currentChord, notes: [], duration: currentDurationTicks };
      newTabData.events.push(event);
      newTabData.events.sort((a, b) => a.tick - b.tick);
    }
    event.notes = preset.fingers.map(f => ({ string: f.string, fret: String(f.fret) }));
    updateTabData(newTabData);
  };

  const handleListen = () => {
    if (tabData.events.length === 0) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const openMidi = TUNING_MIDI[tuning] || TUNING_MIDI.standard;
    const ticksPerBeat = tabData.ticksPerBeat || TICKS_PER_BEAT;
    const msPerTick = (60 / bpm * 1000) / ticksPerBeat;
    const lastTick = Math.max(...tabData.events.map(e => e.tick));
    const durationMs = lastTick * msPerTick + 2500;

    tabData.events.forEach(event => {
      const startSec = (event.tick * msPerTick) / 1000;
      const eventDurationSec = ((event.duration || ticksPerBeat) * msPerTick) / 1000;

      event.notes.forEach(note => {
        const fretStr = note.fret;
        if (!fretStr || fretStr === 'x' || fretStr === '-') return;

        let srcFret, destFret = null;

        if (fretStr.startsWith('<') && fretStr.endsWith('>')) {
          srcFret = parseInt(fretStr.slice(1, -1));
        } else {
          const m = fretStr.match(/^(\d+)([hp/\\])(\d+)/);
          if (m) {
            srcFret = parseInt(m[1]);
            destFret = parseInt(m[3]);
          } else {
            srcFret = parseInt(fretStr);
          }
        }

        if (isNaN(srcFret)) return;
        const srcMidi = openMidi[note.string - 1] + srcFret + capo;
        schedulePluck(ctx, srcMidi, ctx.currentTime + startSec);

        if (destFret !== null && !isNaN(destFret)) {
          const destMidi = openMidi[note.string - 1] + destFret + capo;
          const offset = Math.max(0.05, eventDurationSec / 2);
          schedulePluck(ctx, destMidi, ctx.currentTime + startSec + offset);
        }
      });
    });

    setIsPlaying(true);
    setTimeout(() => {
      ctx.close();
      audioCtxRef.current = null;
      setIsPlaying(false);
    }, durationMs);
  };

  const handleStop = () => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
  };

  const advance = () => setCurrentTick(prev => prev + currentDurationTicks);
  const retreat = () => setCurrentTick(prev => Math.max(0, prev - currentDurationTicks));

  // Timeline dimensions
  const maxTick = tabData.events.length > 0
    ? Math.max(...tabData.events.map(e => e.tick)) + ticksPerBar
    : ticksPerBar * 4;
  const totalTicks = maxTick + ticksPerBar;
  const previewWidth = totalTicks * PX_PER_TICK;

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const clickedTick = Math.round(x / PX_PER_TICK);
    const nearestBeat = Math.round(clickedTick / ticksPerBeat) * ticksPerBeat;
    // Snap to nearest event within 6px, else nearest beat
    let snapTick = nearestBeat;
    let minDist = Math.abs(clickedTick - nearestBeat);
    for (const ev of tabData.events) {
      const d = Math.abs(ev.tick - clickedTick);
      if (d < minDist && d * PX_PER_TICK < 10) { minDist = d; snapTick = ev.tick; }
    }
    setCurrentTick(Math.max(0, snapTick));
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

      {/* Duration picker */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Note Duration</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {DURATIONS.map(d => (
            <button key={d.value} onClick={() => setDuration(d.value)} style={{
              padding: '5px 10px', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${duration === d.value ? 'var(--border-accent)' : 'var(--border)'}`,
              background: duration === d.value ? 'rgba(200,169,110,0.1)' : 'var(--bg-elevated)',
              color: duration === d.value ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)',
              transition: 'all var(--transition)',
            }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Position + navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{
          padding: '6px 12px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', background: 'var(--bg-active)',
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}>
          Bar {bar} · Beat {beatInBar} · {tickInBeat}/{ticksPerBeat}
        </div>
        <button onClick={retreat} disabled={currentTick === 0} style={{ ...iconBtnStyle, opacity: currentTick === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={15} />
        </button>
        <button onClick={advance} style={iconBtnStyle}>
          <ChevronRight size={15} />
        </button>
        <button onClick={clearCurrentTick} title="Clear position" style={iconBtnStyle}>
          <Trash2 size={15} />
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', userSelect: 'none' }}>
          <input type="checkbox" checked={autoAdvance} onChange={e => setAutoAdvance(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }} />
          Auto-advance
        </label>

        <div style={{ marginLeft: 'auto' }}>
          {isPlaying ? (
            <button onClick={handleStop} style={{
              padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(168,80,80,0.4)', background: 'rgba(168,80,80,0.08)',
              color: 'var(--red)', cursor: 'pointer', fontSize: '12px',
              fontFamily: 'var(--font-body)', fontWeight: '500',
            }}>
              ■ Stop
            </button>
          ) : (
            <button onClick={handleListen} disabled={tabData.events.length === 0} style={{
              padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-accent)', background: 'var(--accent-glow)',
              color: 'var(--accent)', cursor: tabData.events.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: '500',
              opacity: tabData.events.length === 0 ? 0.4 : 1,
            }}>
              ▶ Listen
            </button>
          )}
        </div>
      </div>

      {/* Technique + Chord */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: lookupChord(currentChord) ? '8px' : '14px', flexWrap: 'wrap' }}>
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
          <input type="text" value={currentChord} onChange={e => setChordAtTick(e.target.value)}
            placeholder="e.g. Am, C, G7" style={inputStyle} />
        </div>
      </div>

      {/* Chord preset */}
      {lookupChord(currentChord) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', marginBottom: '14px',
          background: 'rgba(200,169,110,0.05)', border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-sm)', gap: '12px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Preset for <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{currentChord}</span>
          </span>
          <button onClick={fillChordPreset} style={{
            padding: '4px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-accent)', background: 'transparent',
            color: 'var(--accent)', cursor: 'pointer', fontSize: '12px',
            fontFamily: 'var(--font-body)', fontWeight: '500', whiteSpace: 'nowrap',
          }}>Fill tab</button>
        </div>
      )}

      {/* Pending technique banner */}
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
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click fret · Auto-advance for runs</span>
        </div>
        <div style={{ minWidth: 'max-content' }}>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <div style={{ width: '28px' }} />
            {FRETS.map(f => (
              <div key={f} style={{ width: '36px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{f}</div>
            ))}
          </div>
          {STRINGS.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: '28px', fontWeight: '600', fontSize: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {STRING_NAMES[s]}
              </div>
              {FRETS.map(f => (
                <button key={f} onClick={() => addNote(s, f)} style={{
                  width: '36px', height: '28px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                  color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                  transition: 'all var(--transition)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {f}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: '#0d0d0d', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Timeline</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Click to navigate · click note to remove</span>
        </div>

        <div ref={previewRef} style={{ overflowX: 'auto', overflowY: 'hidden' }}
          onClick={handleTimelineClick}>
          <div style={{
            position: 'relative',
            width: `${previewWidth}px`,
            height: `${20 + LANE_HEIGHT * STRINGS.length + 10}px`,
            cursor: 'crosshair',
          }}>

            {/* Bar lines */}
            {Array.from({ length: Math.ceil(totalTicks / ticksPerBar) + 1 }, (_, i) => i * ticksPerBar).map(t => (
              <div key={`bar-${t}`} style={{
                position: 'absolute', left: `${t * PX_PER_TICK}px`, top: 0, bottom: 0,
                width: '1px', background: 'rgba(240,235,224,0.15)', pointerEvents: 'none',
              }} />
            ))}

            {/* Beat lines */}
            {Array.from({ length: Math.ceil(totalTicks / ticksPerBeat) + 1 }, (_, i) => i * ticksPerBeat)
              .filter(t => t % ticksPerBar !== 0)
              .map(t => (
                <div key={`beat-${t}`} style={{
                  position: 'absolute', left: `${t * PX_PER_TICK}px`, top: 0, bottom: 0,
                  width: '1px', background: 'rgba(240,235,224,0.05)', pointerEvents: 'none',
                }} />
              ))}

            {/* Bar numbers */}
            {Array.from({ length: Math.ceil(totalTicks / ticksPerBar) + 1 }, (_, i) => i).map(i => (
              <div key={`barnum-${i}`} style={{
                position: 'absolute', left: `${i * ticksPerBar * PX_PER_TICK + 3}px`, top: '2px',
                fontSize: '9px', color: 'rgba(240,235,224,0.25)', fontFamily: 'var(--font-mono)',
                pointerEvents: 'none',
              }}>
                {i + 1}
              </div>
            ))}

            {/* String lanes */}
            {STRINGS.map((s, i) => (
              <div key={`lane-${s}`} style={{
                position: 'absolute', left: 0, right: 0,
                top: `${20 + i * LANE_HEIGHT}px`, height: `${LANE_HEIGHT}px`,
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                borderTop: '1px solid rgba(240,235,224,0.03)',
                pointerEvents: 'none',
              }} />
            ))}

            {/* Current tick indicator */}
            <div style={{
              position: 'absolute', left: `${currentTick * PX_PER_TICK}px`, top: 0, bottom: 0,
              width: '1px', background: 'rgba(200,169,110,0.5)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              left: `${currentTick * PX_PER_TICK - 4}px`,
              top: '13px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'rgba(200,169,110,0.8)', pointerEvents: 'none',
            }} />

            {/* Events + technique destination markers */}
            {tabData.events.flatMap((event, ei) => {
              const x = event.tick * PX_PER_TICK;
              const isActive = event.tick === currentTick;
              const destOffsetTicks = Math.max(1, Math.floor((event.duration || ticksPerBeat) / 2));
              const destX = (event.tick + destOffsetTicks) * PX_PER_TICK;

              const sourceDiv = (
                <div key={`ev-${ei}`} style={{ position: 'absolute', left: `${x}px`, top: 0 }}>
                  {event.chord && (
                    <div style={{
                      position: 'absolute', top: '2px',
                      fontSize: '9px', fontFamily: 'var(--font-mono)',
                      color: isActive ? 'rgba(200,169,110,0.9)' : 'rgba(200,169,110,0.45)',
                      whiteSpace: 'nowrap', transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                    }}>
                      {event.chord}
                    </div>
                  )}
                  {STRINGS.map((s, si) => {
                    const note = event.notes.find(n => n.string === s);
                    // For two-note techniques show e.g. "2h", for others show the raw fret
                    const m = note?.fret?.match(/^(\d+)([hp/\\])(\d+)/);
                    const display = m ? `${m[1]}${m[2]}` : (note?.fret ?? '');
                    return (
                      <div
                        key={s}
                        onClick={note ? (e) => { e.stopPropagation(); setCurrentTick(event.tick); removeNote(event.tick, s); } : undefined}
                        style={{
                          position: 'absolute',
                          top: `${20 + si * LANE_HEIGHT}px`,
                          width: '22px', height: `${LANE_HEIGHT}px`,
                          transform: 'translateX(-50%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontFamily: 'var(--font-mono)',
                          color: note ? (isActive ? 'var(--accent)' : 'rgba(240,235,224,0.85)') : 'transparent',
                          cursor: note ? 'pointer' : 'default',
                          background: note && isActive ? 'rgba(200,169,110,0.08)' : 'transparent',
                          borderRadius: '3px',
                        }}
                      >
                        {display}
                      </div>
                    );
                  })}
                </div>
              );

              // Destination markers for two-note techniques
              const destDivs = event.notes
                .map((note, ni) => {
                  const m = note.fret?.match(/^(\d+)([hp/\\])(\d+)/);
                  if (!m) return null;
                  const si = STRINGS.indexOf(note.string);
                  return (
                    <div
                      key={`dest-${ei}-${ni}`}
                      style={{
                        position: 'absolute',
                        left: `${destX}px`,
                        top: `${20 + si * LANE_HEIGHT}px`,
                        width: '22px', height: `${LANE_HEIGHT}px`,
                        transform: 'translateX(-50%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontFamily: 'var(--font-mono)',
                        color: 'rgba(200,169,110,0.65)',
                        pointerEvents: 'none',
                      }}
                    >
                      {m[3]}
                    </div>
                  );
                })
                .filter(Boolean);

              return [sourceDiv, ...destDivs];
            })}
          </div>
        </div>

        {/* String labels legend */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Strings (top→bottom):</div>
          {STRINGS.map(s => (
            <span key={s} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent)' }}>{STRING_NAMES[s]}</span>={s}
            </span>
          ))}
        </div>

        {/* Technique legend */}
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Techniques</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
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
