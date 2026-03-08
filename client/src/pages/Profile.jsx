import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getXpProgress } from '../utils/levels';

export default function Profile() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5001/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setProfile(res.data)).catch(() => setError('Could not load profile'));
  }, [token]);

  if (!profile) return <p style={{ padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>;
  if (error) return <p style={{ padding: '32px', color: 'var(--red)', fontFamily: 'var(--font-body)' }}>{error}</p>;

  const { user, scores } = profile;
  const xpProgress = getXpProgress(user.xp);

  return (
    <div style={{ padding: '32px', maxWidth: '640px', fontFamily: 'var(--font-body)' }}>

      {/* Page title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Your stats and activity</p>
      </div>

      {/* User card */}
      <div style={{
        padding: '24px', borderRadius: 'var(--radius)',
        border: '1px solid var(--border-mid)',
        background: 'var(--bg-elevated)',
        marginBottom: '24px',
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--bg-active)', border: '1px solid var(--border-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              {user.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total XP</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--accent)', fontWeight: '500' }}>
              {user.xp}
            </div>
          </div>
        </div>

        {/* Level + XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)', fontWeight: '500' }}>
              {xpProgress.level}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Level {xpProgress.level}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {xpProgress.currentXp} / {xpProgress.requiredXp} xp
              </span>
            </div>
            <div style={{ background: 'var(--bg-active)', borderRadius: '999px', height: '4px' }}>
              <div style={{
                background: 'var(--accent)',
                width: `${xpProgress.percentage}%`,
                height: '4px',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '1px',
          marginTop: '20px', paddingTop: '20px',
          borderTop: '1px solid var(--border)',
        }}>
          {[
            { label: 'Songs Played', value: scores.length },
            { label: 'Level', value: xpProgress.level },
            { label: 'Total XP', value: user.xp },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--text-primary)', fontWeight: '400', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Recent Activity
        </h2>

        {scores.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius)', border: '1px dashed var(--border-mid)' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--text-muted)' }}>♩</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>No songs played yet</p>
            <button onClick={() => navigate('/songs')} style={ghostBtn}>Browse songs</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: '16px', padding: '6px 12px', marginBottom: '2px' }}>
              {['Song', 'Accuracy', 'XP'].map(h => (
                <span key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {scores.map(score => {
              const accuracy = score.accuracy;
              const accuracyColor = accuracy >= 80 ? 'var(--accent)' : accuracy >= 50 ? 'var(--text-secondary)' : 'var(--red)';
              return (
                <div key={score._id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 80px',
                  gap: '16px', padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid transparent',
                  transition: 'all var(--transition)',
                  alignItems: 'center',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {score.song?.title || 'Unknown Song'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {score.song?.artist} · {score.song?.difficulty}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: accuracyColor, fontWeight: '500' }}>
                    {accuracy}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    +{score.xpEarned}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const ghostBtn = {
  padding: '6px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-mid)', background: 'transparent',
  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)',
};