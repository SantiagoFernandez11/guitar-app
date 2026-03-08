import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Discover() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5001/api/songs', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const sorted = res.data.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      setSongs(sorted);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
          Discover
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Community tabs, sorted by popularity
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.2 }}>♪</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No songs published yet</p>
          <button onClick={() => navigate('/create-song')} style={{
            padding: '10px 20px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border-accent)', background: 'transparent',
            color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px'
          }}>Be the first to publish</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {songs.map((song, i) => (
            <button key={song._id} onClick={() => navigate(`/songs/${song._id}`)}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px',
                cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)',
                fontFamily: 'var(--font-body)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            >
              <div style={{
                width: '100%', aspectRatio: '1', background: 'var(--bg-active)',
                borderRadius: 'var(--radius-sm)', marginBottom: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'
              }}>
                {i === 0 ? '♩' : i === 1 ? '♪' : i === 2 ? '♫' : '♬'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {song.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {song.artist}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {song.bpm} bpm
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-active)' }}>
                    {song.difficulty}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ♥ {song.likes?.length || 0}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}