import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Songs() {
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/songs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSongs(res.data);
      } catch (err) {
        setError('Could not load songs');
      }
    };
    fetchSongs();
  }, [token]);

  return (
    <div>
      <h2>Song Catalog</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        {songs.map(song => (
          <div key={song._id} onClick={() => navigate(`/songs/${song._id}`)}
            style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem', cursor: 'pointer' }}>
            <h3>{song.title}</h3>
            <p>{song.artist}</p>
            <p>Difficulty: {song.difficulty} | BPM: {song.bpm}</p>
          </div>
        ))}
      </div>
    </div>
  );
}