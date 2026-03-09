import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../api';
import { useAudioScoring } from '../hooks/useAudioScoring';
import ResultsScreen from '../components/ResultsScreen';
import ChordDiagram from '../components/ChordDiagram';
import NoteHighway from '../components/NoteHighway';

export default function SongDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);
  const currentTimeRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/songs/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const s = res.data;
      setSong(s);
      setLikeCount(s.likes?.length || 0);
      setLiked(s.likes?.includes(user?.id) || false);
    });
  }, [id, token]);

  const handleLike = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/songs/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch (err) {
      console.error('Could not like song:', err);
    }
  };

  const { hits, misses, detectedNote, hitResults, startListening, stopListening, reset } =
    useAudioScoring(song?.noteMap ?? []);

  const songDuration = song ? Math.max(...song.noteMap.map(n => n.timestamp)) + 2000 : 0;

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
      if (elapsed >= songDuration) { stopPlaying(true); return; }
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

  if (!song) return <p style={{ padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>;
  if (finished) return <ResultsScreen hits={hits} misses={misses} song={song} onRetry={handleRetry} />;

  const activeChord = song.noteMap.find(n =>
    currentTime >= n.timestamp && currentTime < n.timestamp + 800
  )?.chord;

  const total = hits + misses;
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);

  return (
    <div style={{ padding: '32px', maxWidth: '720px', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {song.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{song.artist}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>·</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{song.difficulty}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{song.bpm} bpm</span>
              {song.tuning && song.tuning !== 'standard' && (
                <>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>·</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{song.tuning}</span>
                </>
              )}
              {song.capo > 0 && (
                <>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>·</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>capo {song.capo}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {song.published && (
              <button onClick={handleLike} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${liked ? 'rgba(200,169,110,0.4)' : 'var(--border)'}`,
                background: liked ? 'rgba(200,169,110,0.08)' : 'transparent',
                color: liked ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)',
                transition: 'all var(--transition)',
              }}>
                <span>♥</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{likeCount}</span>
              </button>
            )}
            {song.author?.username && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                by {song.author.username}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chord diagrams */}
      {song.chords?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Chords
          </p>
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {song.chords.map(chord => (
              <ChordDiagram key={chord.name} chord={chord} isActive={activeChord === chord.name} />
            ))}
          </div>
        </div>
      )}

      {/* Note highway */}
      <div style={{ marginBottom: '20px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <NoteHighway
          noteMap={song.noteMap}
          currentTimeRef={currentTimeRef}
          speed={speed}
          hitResults={hitResults}
        />
      </div>

      {/* Live stats */}
      {playing && (
        <div style={{
          display: 'flex', gap: '24px', marginBottom: '16px',
          padding: '10px 16px',
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          {[
            { label: 'Note', value: detectedNote || '—' },
            { label: 'Hits', value: hits },
            { label: 'Misses', value: misses },
            { label: 'Accuracy', value: `${accuracy}%` },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{stat.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-primary)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={playing ? () => stopPlaying(false) : startPlaying} style={{
          padding: '9px 28px', borderRadius: 'var(--radius-sm)', border: '1px solid',
          borderColor: playing ? 'rgba(168,80,80,0.4)' : 'var(--border-accent)',
          background: playing ? 'rgba(168,80,80,0.1)' : 'var(--accent-glow)',
          color: playing ? 'var(--red)' : 'var(--accent)',
          fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700',
          cursor: 'pointer', transition: 'all var(--transition)',
          letterSpacing: '0.03em',
        }}>
          {playing ? 'Stop' : 'Play'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {Math.round(speed * 100)}%
          </span>
          <input type="range" min="0.25" max="2" step="0.05" value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            disabled={playing}
            style={{ flex: 1, accentColor: 'var(--accent)', opacity: playing ? 0.4 : 1 }}
          />
          <button onClick={() => setSpeed(1)} disabled={speed === 1 || playing} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px',
            fontFamily: 'var(--font-body)', opacity: speed === 1 || playing ? 0.3 : 1,
            whiteSpace: 'nowrap',
          }}>Reset</button>
        </div>
      </div>

      <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
        Speed can only be adjusted while stopped.
      </p>
    </div>
  );
}