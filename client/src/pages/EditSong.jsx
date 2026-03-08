import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TabEditor from '../components/TabEditor';

const TUNINGS = [
  { value: 'standard', label: 'Standard (E-A-D-G-B-E)' },
  { value: 'dropD', label: 'Drop D (D-A-D-G-B-E)' },
  { value: 'halfStepDown', label: 'Half Step Down (Eb-Ab-Db-Gb-Bb-Eb)' },
  { value: 'openG', label: 'Open G (D-G-D-G-B-D)' },
  { value: 'openD', label: 'Open D (D-A-D-F#-A-D)' },
  { value: 'dadgad', label: 'DADGAD (D-A-D-G-A-D)' },
  { value: 'other', label: 'Other' },
];

export default function EditSong() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [meta, setMeta] = useState(null);
  const [tabData, setTabData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tapTimes = useRef([]);
  const tapTimeout = useRef(null);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/songs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const song = res.data;
        setMeta({
          title: song.title,
          artist: song.artist,
          bpm: song.bpm,
          difficulty: song.difficulty,
          tuning: song.tuning || 'standard',
          customTuning: '',
          capo: song.capo || 0,
        });
        setTabData(song.tabData || null);
      } catch (err) {
        setError('Could not load song');
      }
    };
    fetchSong();
  }, [id, token]);

  const handleTap = () => {
    const now = Date.now();
    tapTimes.current.push(now);
    if (tapTimes.current.length > 1) {
      const gaps = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        gaps.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpm = Math.round(60000 / avgGap);
      setMeta(prev => ({ ...prev, bpm: Math.min(300, Math.max(20, bpm)) }));
    }
    clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => { tapTimes.current = []; }, 2000);
  };

  const handleMetaChange = (field, value) => {
    setMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!meta.title.trim()) return setError('Title is required');
    if (!meta.artist.trim()) return setError('Artist is required');

    setSaving(true);
    setError('');

    try {
      await axios.put(`http://localhost:5001/api/songs/${id}`, {
        title: meta.title,
        artist: meta.artist,
        bpm: meta.bpm,
        difficulty: meta.difficulty,
        tuning: meta.tuning === 'other' ? meta.customTuning : meta.tuning,
        capo: meta.capo,
        tabData,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/my-songs');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return <p style={{ padding: '2rem' }}>Loading...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Edit Song</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Changes are saved as a new draft version</p>
        </div>
        <button onClick={() => navigate('/my-songs')}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'white' }}>
          ← Back
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', background: 'white' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Song Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={meta.title} onChange={e => handleMetaChange('title', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Artist</label>
            <input value={meta.artist} onChange={e => handleMetaChange('artist', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>BPM</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" value={meta.bpm} min={20} max={300}
                onChange={e => handleMetaChange('bpm', parseInt(e.target.value) || 120)}
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleTap}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                Tap
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Difficulty</label>
            <select value={meta.difficulty} onChange={e => handleMetaChange('difficulty', e.target.value)} style={inputStyle}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: meta.tuning === 'other' ? '1rem' : 0 }}>
          <div>
            <label style={labelStyle}>Tuning</label>
            <select value={meta.tuning} onChange={e => handleMetaChange('tuning', e.target.value)} style={inputStyle}>
              {TUNINGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Capo Position</label>
            <input type="number" value={meta.capo} min={0} max={12}
              onChange={e => handleMetaChange('capo', Math.min(12, Math.max(0, parseInt(e.target.value) || 0)))}
              style={inputStyle} />
          </div>
        </div>
        {meta.tuning === 'other' && (
          <div>
            <label style={labelStyle}>Custom Tuning</label>
            <input value={meta.customTuning} onChange={e => handleMetaChange('customTuning', e.target.value)}
              placeholder="e.g. Eb-Ab-Db-Gb-Bb-Eb" style={inputStyle} />
          </div>
        )}
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', background: 'white' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Tab Editor</h4>
        <TabEditor tabData={tabData} onChange={setTabData} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', background: '#1d4ed8', color: 'white', fontWeight: '600', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px', color: '#374151' };
const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', background: 'white', color: '#111827' };