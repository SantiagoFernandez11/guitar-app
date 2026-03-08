import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Songs from './pages/Songs';
import SongDetail from './pages/SongDetail';
import Profile from './pages/Profile';
import CreateSong from './pages/CreateSong';
import EditSong from './pages/EditSong';
import MySongs from './pages/MySongs';
import Discover from './pages/Discover';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppLayout({ children }) {
  return (
    <Layout>
      {children}
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><AppLayout><Discover /></AppLayout></ProtectedRoute>} />
        <Route path="/songs" element={<ProtectedRoute><AppLayout><Songs /></AppLayout></ProtectedRoute>} />
        <Route path="/songs/:id" element={<ProtectedRoute><AppLayout><SongDetail /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
        <Route path="/create-song" element={<ProtectedRoute><AppLayout><CreateSong /></AppLayout></ProtectedRoute>} />
        <Route path="/edit-song/:id" element={<ProtectedRoute><AppLayout><EditSong /></AppLayout></ProtectedRoute>} />
        <Route path="/my-songs" element={<ProtectedRoute><AppLayout><MySongs /></AppLayout></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/discover" />} />
      </Routes>
    </BrowserRouter>
  );
}