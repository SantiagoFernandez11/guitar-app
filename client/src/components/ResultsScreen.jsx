import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../api';

export default function ResultsScreen({ hits, misses, song, onRetry }) {
  const total = hits + misses;
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);
  const xpEarned = Math.round(accuracy * 0.5 * (
    song.difficulty === 'beginner' ? 1 : song.difficulty === 'intermediate' ? 1.5 : 2
  ));
  const { token } = useAuth();
  const [saved, setSaved] = useState(false);
  const scoreSavedRef = useRef(false);

  useEffect(() => {
    if (scoreSavedRef.current) return;
    scoreSavedRef.current = true;
    axios.post(`${API_URL}/api/scores`, {
      songId: song._id, hits, misses, accuracy, xpEarned
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setSaved(true))
      .catch(err => console.error('Could not save score:', err));
  }, []);

  const accuracyColor = accuracy >= 80 ? 'var(--accent)' : accuracy >= 50 ? 'var(--text-secondary)' : 'var(--red)';
  const grade = accuracy >= 90 ? 'S' : accuracy >= 80 ? 'A' : accuracy >= 65 ? 'B' : accuracy >= 50 ? 'C' : 'D';

  return (
    <div style={{
      minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px', fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
            Results
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {song.title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{song.artist}</p>
        </div>

        {/* Grade + accuracy */}
        <div style={{
          textAlign: 'center', marginBottom: '28px', padding: '32px 20px',
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border-mid)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '72px', fontWeight: '800',
            color: accuracyColor, lineHeight: 1, marginBottom: '8px',
            opacity: 0.9,
          }}>
            {grade}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: '400',
            color: accuracyColor, marginBottom: '4px',
          }}>
            {accuracy}%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>accuracy</p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1px', marginBottom: '24px',
          background: 'var(--border)', borderRadius: 'var(--radius)',
          overflow: 'hidden', border: '1px solid var(--border-mid)',
        }}>
          {[
            { label: 'Hits', value: hits },
            { label: 'Misses', value: misses },
            { label: 'XP Earned', value: `+${xpEarned}` },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '16px', textAlign: 'center',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Saved indicator */}
        {saved && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Score saved ·{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>+{xpEarned} xp</span>
          </p>
        )}

        {/* Actions */}
        <button onClick={onRetry} style={{
          width: '100%', padding: '11px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-accent)',
          background: 'var(--accent-glow)',
          color: 'var(--accent)',
          fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700',
          cursor: 'pointer', letterSpacing: '0.03em',
          transition: 'all var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-glow)'}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}