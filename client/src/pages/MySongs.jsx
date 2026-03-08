import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function MySongs() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5001/api/songs/my', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSongs(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/songs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSongs(prev => prev.filter(s => s._id !== id));
    } catch { alert('Could not delete'); }
  };

  const handlePublish = async (id) => {
    try {
      await axios.post(`http://localhost:5001/api/songs/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSongs(prev => prev.map(s => s._id === id ? { ...s, published: true } : s));
    } catch { alert('Could not publish'); }
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            My Songs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Your drafts and published tabs</p>
        </div>
        <button onClick={() => navigate('/create-song')} style={accentBtn}>
          + New Song
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</p>
      ) : songs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', borderRadius: 'var(--radius)', border: '1px dashed var(--border-mid)' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px', color: 'var(--text-muted)' }}>♩</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>No songs yet</p>
          <button onClick={() => navigate('/create-song')} style={accentBtn}>
            Create your first song
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 70px 70px 180px', gap: '16px', padding: '8px 16px', marginBottom: '4px' }}>
            {['Title', 'Artist', 'BPM', 'Likes', ''].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {songs.map(song => (
            <div key={song._id} style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 70px 70px 180px',
              gap: '16px', padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid transparent',
              transition: 'all var(--transition)',
              alignItems: 'center',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              {/* Title + status */}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <button onClick={() => navigate(`/songs/${song._id}`)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)',
                    textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '200px',
                  }}>{song.title}</button>
                  <span style={{
                    fontSize: '10px', padding: '1px 5px', borderRadius: '2px',
                    background: song.published ? 'rgba(200,169,110,0.08)' : 'rgba(240,235,224,0.04)',
                    color: song.published ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${song.published ? 'var(--border-accent)' : 'var(--border)'}`,
                    flexShrink: 0,
                  }}>
                    {song.published ? 'published' : 'draft'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{song.difficulty}</div>
              </div>

              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {song.artist}
              </span>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {song.bpm}
              </span>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ♥ {song.likes?.length || 0}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate(`/songs/${song._id}`)} style={ghostBtn}>Play</button>
                {!song.published && (
                  <>
                    <button onClick={() => navigate(`/edit-song/${song._id}`)} style={ghostBtn}>Edit</button>
                    <button onClick={() => handlePublish(song._id)} style={accentGhostBtn}>Publish</button>
                  </>
                )}
                <button onClick={() => handleDelete(song._id)} style={dangerBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ghostBtn = {
  padding: '4px 10px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', transition: 'all 0.15s',
};

const accentGhostBtn = {
  padding: '4px 10px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-accent)', background: 'transparent',
  color: 'var(--accent)', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', transition: 'all 0.15s',
};

const accentBtn = {
  padding: '7px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-accent)', background: 'transparent',
  color: 'var(--accent)', cursor: 'pointer', fontSize: '13px',
  fontWeight: '500', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
};

const dangerBtn = {
  padding: '4px 10px', borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(168, 80, 80, 0.25)', background: 'transparent',
  color: 'var(--red)', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', transition: 'all 0.15s',
};