import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function SongDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [song, setSong] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchSong = async () => {
      const res = await axios.get(`http://localhost:5001/api/songs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSong(res.data);
    };
    fetchSong();
  }, [id, token]);

  const startPlaying = () => {
    setPlaying(true);
    setCurrentTime(0);
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => prev + 100);
    }, 100);
  };

  const stopPlaying = () => {
    setPlaying(false);
    clearInterval(intervalRef.current);
    setCurrentTime(0);
  };

  if (!song) return <p>Loading...</p>;

  const activeNote = song.noteMap.find(n =>
    currentTime >= n.timestamp && currentTime < n.timestamp + 400
  );

  return (
    <div>
      <h2>{song.title} — {song.artist}</h2>
      <p>BPM: {song.bpm} | Difficulty: {song.difficulty}</p>

      <button onClick={playing ? stopPlaying : startPlaying}>
        {playing ? 'Stop' : 'Play'}
      </button>

      <div style={{ marginTop: '2rem' }}>
        <h3>Notes</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {song.noteMap.map((n, i) => (
            <div key={i} style={{
              padding: '1rem',
              border: '2px solid',
              borderColor: activeNote === n ? 'green' : '#ccc',
              backgroundColor: activeNote === n ? '#e0ffe0' : 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{n.note}</div>
              <div>String {n.string} | Fret {n.fret}</div>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>{n.timestamp}ms</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}