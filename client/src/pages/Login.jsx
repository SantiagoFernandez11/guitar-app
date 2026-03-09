import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, form);
      login(res.data.user, res.data.token);
      navigate('/discover');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', fontFamily: 'var(--font-body)'
    }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '800', color: 'var(--accent)', marginBottom: '8px' }}>
            fretboard
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(200, 92, 92, 0.1)', border: '1px solid rgba(200, 92, 92, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <input name="email" type="email" placeholder="Email" onChange={handleChange}
            style={authInputStyle} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange}
            style={authInputStyle} />
        </div>

        <button onClick={handleSubmit} style={authButtonStyle}>Sign In</button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const authInputStyle = {
  width: '100%', padding: '12px 14px',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none',
};

const authButtonStyle = {
  width: '100%', padding: '12px',
  background: 'var(--accent)', border: 'none',
  borderRadius: 'var(--radius-sm)', color: '#0a0a0a',
  fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700',
  cursor: 'pointer', letterSpacing: '0.02em'
};