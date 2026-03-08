import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TabEditor from '../components/TabEditor';
import ChordEditor from '../components/ChordEditor';
import { lookupChord } from '../utils/chordLibrary';

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
  const [chords, setChords] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const tapTimes = useRef([]);
  const tapTimeout = useRef(null);

  useEffect(() => {
    axios.get(`http://localhost:5001/api/songs/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const song = res.data;
      setMeta({ title: song.title, artist: song.artist, bpm: song.bpm, difficulty: song.difficulty, tuning: song.tuning || 'standard', customTuning: '', capo: song.capo || 0 });
      setTabData(song.tabData || null);
      setChords(song.chords || []);
    }).catch(() => setError('Could not load song'));
  }, [id, token]);

  const handleTap = () => {
    const now = Date.now();
    tapTimes.current.push(now);
    if (tapTimes.current.length > 1) {
      const gaps = [];
      for (let i = 1; i < tapTimes.current.length; i++) gaps.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      const bpm = Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
      setMeta(prev => ({ ...prev, bpm: Math.min(300, Math.max(20, bpm)) }));
    }
    clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => { tapTimes.current = []; }, 2000);
  };

  const handleMetaChange = (field, value) => setMeta(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!meta.title.trim()) return setError('Title is required');
    if (!meta.artist.trim()) return setError('Artist is required');
    setSaving(true);
    setError('');
    try {
      // Auto-add library presets for any chord names in the tab not already manually defined
      const tabChordNames = [...new Set((tabData?.chords || []).filter(Boolean))];
      const autoChords = tabChordNames
        .filter(name => !chords.some(c => c.name === name))
        .map(name => { const p = lookupChord(name); return p ? { name, ...p } : null; })
        .filter(Boolean);
      const finalChords = [...chords, ...autoChords];

      await axios.put(`http://localhost:5001/api/songs/${id}`, {
        ...meta,
        tuning: meta.tuning === 'other' ? meta.customTuning : meta.tuning,
        tabData,
        chords: finalChords,
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/my-songs');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return <p style={{ padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>;

  return (
    <div style={{ padding: '32px', maxWidth: '800px', fontFamily: 'var(--font-body)' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Edit Song
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Changes regenerate the note map on save</p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(168,80,80,0.08)', border: '1px solid rgba(168,80,80,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '13px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={sectionStyle}>
        <p style={sectionLabel}>Song Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input value={meta.title} onChange={e => handleMetaChange('title', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Artist</label>
            <input value={meta.artist} onChange={e => handleMetaChange('artist', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>BPM</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" value={meta.bpm} min={20} max={300}
                onChange={e => handleMetaChange('bpm', parseInt(e.target.value) || 120)}
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleTap} style={tapBtnStyle}>Tap</button>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: meta.tuning === 'other' ? '14px' : 0 }}>
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

      <div style={sectionStyle}>
        <p style={sectionLabel}>Tab Editor</p>
        <TabEditor tabData={tabData} onChange={setTabData} />
      </div>

      <div style={sectionStyle}>
        <p style={sectionLabel}>Chord Diagrams</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Define finger positions for the chords used in your tab. These display during playback.
        </p>
        <ChordEditor chords={chords} onChange={setChords} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={saving} style={accentActionBtn}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const sectionStyle = {
  border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)',
  padding: '20px', marginBottom: '20px', background: 'var(--bg-elevated)',
};
const sectionLabel = {
  fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px',
};
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '500',
  marginBottom: '5px', color: 'var(--text-secondary)',
};
const inputStyle = {
  width: '100%', padding: '8px 10px',
  background: 'var(--bg-active)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color var(--transition)',
};
const tapBtnStyle = {
  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', fontWeight: '500', whiteSpace: 'nowrap',
};
const accentActionBtn = {
  padding: '9px 20px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-accent)', background: 'var(--accent-glow)',
  color: 'var(--accent)', cursor: 'pointer', fontSize: '13px',
  fontFamily: 'var(--font-display)', fontWeight: '700',
};