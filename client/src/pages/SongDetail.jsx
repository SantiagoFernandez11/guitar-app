import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useAudioScoring } from '../hooks/useAudioScoring';
import ResultsScreen from '../components/ResultsScreen';
import ChordDiagram from '../components/ChordDiagram';
import NoteHighway from '../components/NoteHighway';

export default function SongDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);
  const currentTimeRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const fetchSong = async () => {
      const res = await axios.get(`http://localhost:5001/api/songs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSong(res.data);
    };
    fetchSong();
  }, [id, token]);

  const { hits, misses, detectedNote, hitResults, startListening, stopListening, reset } =
    useAudioScoring(song?.noteMap ?? []);

  const songDuration = song
    ? Math.max(...song.noteMap.map(n => n.timestamp)) + 2000
    : 0;

  const startPlaying = async () => {
    reset();
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setFinished(false);
    setPlaying(true);
    await startListening(() => currentTimeRef.current);

    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) * speed;
      currentTimeRef.current = elapsed;
      setCurrentTime(elapsed);

      if (elapsed >= songDuration) {
        stopPlaying(true);
        return;
      }
      intervalRef.current = requestAnimationFrame(tick);
    };

    intervalRef.current = requestAnimationFrame(tick);
  };

  const stopPlaying = (completed = false) => {
    cancelAnimationFrame(intervalRef.current);
    stopListening();
    setPlaying(false);
    if (completed) setFinished(true);
  };

  const handleRetry = () => {
    setFinished(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
  };

  if (!song) return <p style={{ padding: '2rem' }}>Loading...</p>;

  if (finished) {
    return <ResultsScreen hits={hits} misses={misses} song={song} onRetry={handleRetry} />;
  }

  const activeChord = song.noteMap.find(n =>
    currentTime >= n.timestamp && currentTime < n.timestamp + 800
  )?.chord;

  const total = hits + misses;
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{song.title}</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>{song.artist} · {song.difficulty} · {song.bpm} BPM</p>
        </div>
        <button onClick={() => navigate('/songs')}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer' }}>
          Back
        </button>
      </div>

      {/* Chord Diagrams */}
      {song.chords?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Chords</h4>
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.5rem', overflowX: 'auto' }}>
            {song.chords.map(chord => (
              <ChordDiagram key={chord.name} chord={chord} isActive={activeChord === chord.name} />
            ))}
          </div>
        </div>
      )}

      {/* Note Highway */}
      <div style={{ marginBottom: '1.5rem' }}>
        <NoteHighway
          noteMap={song.noteMap}
          currentTimeRef={currentTimeRef}
          speed={speed}
          hitResults={hitResults}
        />
      </div>

      {/* Live Stats */}
      {playing && (
        <div style={{
          display: 'flex', gap: '1rem', marginBottom: '1rem',
          padding: '0.75rem 1rem', background: '#f9fafb',
          borderRadius: '10px', border: '1px solid #e5e7eb'
        }}>
          <span>Note: <strong>{detectedNote || '—'}</strong></span>
          <span>Hits: {hits}</span>
          <span>Misses: {misses}</span>
          <span>Accuracy: {accuracy}%</span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={playing ? () => stopPlaying(false) : startPlaying}
          style={{
            padding: '0.75rem 2rem', borderRadius: '10px', border: 'none',
            backgroundColor: playing ? '#ef4444' : '#22c55e',
            color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
          }}>
          {playing ? 'Stop' : 'Play'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <label style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Speed: {Math.round(speed * 100)}%
          </label>
          <input
            type="range" min="0.25" max="2" step="0.05"
            value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            style={{ flex: 1 }}
            disabled={playing}
          />
          <button
            onClick={() => setSpeed(1)}
            disabled={speed === 1 || playing}
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '6px',
              border: '1px solid #d1d5db', cursor: 'pointer',
              fontSize: '0.8rem', whiteSpace: 'nowrap',
              opacity: speed === 1 || playing ? 0.4 : 1
            }}>
            Reset
          </button>
        </div>
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
        Speed can only be adjusted while stopped.
      </p>
    </div>
  );
}