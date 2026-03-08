import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Songs() {
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5001/api/songs', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSongs(res.data)).catch(() => setError('Could not load songs'));
  }, [token]);

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist.toLowerCase().includes(search.toLowerCase())
  );

  const difficultyColor = (d) => {
    if (d === 'beginner') return 'var(--accent)';
    if (d === 'intermediate') return 'var(--text-secondary)';
    return 'var(--text-primary)';
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Browse
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>All published community tabs</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '360px' }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', pointerEvents: 'none' }}>⌕</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or artist..."
          style={{
            width: '100%', padding: '8px 12px 8px 28px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
            transition: 'border-color var(--transition)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', borderRadius: 'var(--radius)', border: '1px dashed var(--border-mid)' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px', color: 'var(--text-muted)' }}>♪</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {search ? 'No songs match your search' : 'No published songs yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 70px 70px 60px', gap: '16px', padding: '6px 12px', marginBottom: '2px' }}>
            {['Title', 'Artist', 'BPM', 'Difficulty', 'Likes'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {filtered.map((song, i) => (
            <div key={song._id}
              onClick={() => navigate(`/songs/${song._id}`)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 70px 70px 60px',
                gap: '16px', padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid transparent',
                cursor: 'pointer', alignItems: 'center',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-active)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                }}>
                  {i % 4 === 0 ? '♩' : i % 4 === 1 ? '♪' : i % 4 === 2 ? '♫' : '♬'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.title}
                  </div>
                  {song.author?.username && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {song.author.username}</div>
                  )}
                </div>
              </div>

              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {song.artist}
              </span>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {song.bpm}
              </span>

              <span style={{ fontSize: '11px', color: difficultyColor(song.difficulty) }}>
                {song.difficulty}
              </span>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                ♥ {song.likes?.length || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}