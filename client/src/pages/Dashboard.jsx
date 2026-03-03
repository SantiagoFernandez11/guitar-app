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
    <div>
      <h2>Welcome, {user?.username}!</h2>
      <p>Your guitar journey starts here.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}