import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) navigate('/dashboard', { replace: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>👁️</div>
        <h1 style={styles.title}>VigilEye</h1>
        <p style={styles.subtitle}>Driver Login — Multi-Modal Drowsiness Detection</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@example.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.link}>
          Don't have an account? <Link to="/register" style={styles.linkText}>Register</Link>
        </p>
        <p style={styles.adminLink}>
          <Link to="/admin/login" style={{ ...styles.linkText, opacity: 0.5 }}>
            Admin Login →
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f23, #1a1a3e)',
    padding: 20,
  },
  card: {
    background: '#1a1a2e',
    borderRadius: 16,
    padding: '40px 32px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    color: '#fff',
  },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#8899aa', fontSize: 14, marginBottom: 24 },
  error: {
    background: 'rgba(244,67,54,0.15)',
    color: '#f44336',
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, color: '#8899aa', fontWeight: 500 },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #2a2a4a',
    background: '#16213e',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  btn: {
    padding: '14px',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #00d4ff, #0080ff)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  link: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#8899aa' },
  linkText: { color: '#00d4ff', textDecoration: 'none', fontWeight: 600 },
  adminLink: { textAlign: 'center', marginTop: 8 },
};
