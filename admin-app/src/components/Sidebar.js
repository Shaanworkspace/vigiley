import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/drivers', label: 'Drivers', icon: '👥' },
  { path: '/admin/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/admin/reports', label: 'Reports', icon: '📈' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.brandIcon}>👁️</span>
        <span style={styles.brandText}>VigilEye</span>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              background: isActive ? 'rgba(0,212,255,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #00d4ff' : '3px solid transparent',
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
          <div>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>Admin</div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240,
    background: '#1a1a2e',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
  },
  brand: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: '1px solid #2a2a4a',
  },
  brandIcon: { fontSize: 24 },
  brandText: { fontSize: 18, fontWeight: 700, color: '#fff' },
  nav: { flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    color: '#8899aa',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  footer: {
    borderTop: '1px solid #2a2a4a',
    padding: '16px 20px',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff, #0080ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    color: '#fff',
  },
  userName: { fontSize: 13, fontWeight: 600, color: '#fff' },
  userRole: { fontSize: 11, color: '#8899aa' },
  logoutBtn: {
    width: '100%',
    padding: '8px',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    background: 'transparent',
    color: '#8899aa',
    cursor: 'pointer',
    fontSize: 13,
  },
};
