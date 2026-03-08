import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Welcome, {user?.username}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button onClick={() => navigate('/songs')}
          style={{ padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          Browse Songs
        </button>
        <button onClick={() => navigate('/my-songs')}
          style={{ padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#7c3aed', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          My Songs
        </button>
        <button onClick={() => navigate('/profile')}
          style={{ padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#1d4ed8', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          My Profile
        </button>
        <button onClick={handleLogout}
          style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </div>
  );
}