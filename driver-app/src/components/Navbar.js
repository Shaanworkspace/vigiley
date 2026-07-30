import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>VigilEye<span style={{fontSize:12,fontWeight:400,opacity:0.6,marginLeft:6}}>Driver</span></div>
      <div style={styles.right}>
        <span style={styles.userName}>{user?.name}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  brand: { fontSize: 20, fontWeight: 700, letterSpacing: 1 },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  userName: { opacity: 0.8 },
  logoutBtn: {
    padding: '8px 20px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
};
