import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    vehicleNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) navigate('/dashboard', { replace: true });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role: 'driver' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'driver@example.com' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 9876543210' },
    { name: 'licenseNumber', label: 'License Number', type: 'text', placeholder: 'DL-123456' },
    { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text', placeholder: 'UP 32 AB 1234' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>VigilEye</h1>
        <p style={styles.subtitle}>Driver Registration — Create your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {fields.map((f) => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input
                style={styles.input}
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                required={['name', 'email', 'password'].includes(f.name)}
              />
            </div>
          ))}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login" style={styles.linkText}>Sign In</Link>
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
    padding: '32px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    color: '#fff',
  },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#8899aa', fontSize: 14, marginBottom: 20 },
  error: {
    background: 'rgba(244,67,54,0.15)',
    color: '#f44336',
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, color: '#8899aa', fontWeight: 500 },
  input: {
    padding: '11px 14px',
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
};
