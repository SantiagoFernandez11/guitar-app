import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function ResultsScreen({ hits, misses, song, onRetry }) {
  const total = hits + misses;
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);
  const xpEarned = Math.round(accuracy * 0.5 * (song.difficulty === 'beginner' ? 1 : song.difficulty === 'intermediate' ? 1.5 : 2));
  const { token } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saveScore = async () => {
      try {
        await axios.post('http://localhost:5001/api/scores', {
          songId: song._id,
          hits,
          misses,
          accuracy,
          xpEarned
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSaved(true);
      } catch (err) {
        console.error('Could not save score:', err);
      }
    };
    saveScore();
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Results</h2>
      <h3>{song.title}</h3>
      <div style={{ fontSize: '4rem', fontWeight: 'bold', color: accuracy >= 70 ? 'green' : 'orange' }}>
        {accuracy}%
      </div>
      <p>Hits: {hits} | Misses: {misses}</p>
      <p>XP Earned: +{xpEarned}</p>
      {saved && <p style={{ color: 'green' }}>Score saved!</p>}
      <button onClick={onRetry}>Try Again</button>
    </div>
  );
}