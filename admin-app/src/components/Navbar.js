import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, BarChart3, LogOut } from 'lucide-react';

const items = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/drivers', label: 'Drivers', icon: Users },
  { path: '/admin/alerts', label: 'Alerts', icon: Bell },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [sc, setSc] = useState(false);
  useEffect(() => { const o = () => setSc(window.scrollY > 10); window.addEventListener('scroll', o, { passive: true }); return () => window.removeEventListener('scroll', o); }, []);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 20px 0' }}>
      <nav style={{
        maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', borderRadius: 16,
        background: sc ? 'rgba(2,6,23,0.72)' : 'transparent',
        backdropFilter: sc ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: sc ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59,130,246,0.15)"/>
            <circle cx="11" cy="14" r="2.5" fill="#3b82f6"/><circle cx="21" cy="14" r="2.5" fill="#3b82f6"/>
            <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{fontSize:17,fontWeight:800,letterSpacing:'-0.3px',background:'linear-gradient(135deg,#fff 60%,#94a3b8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VigilEye</span>
          <span style={{fontSize:9,fontWeight:600,color:'#a78bfa',background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.2)',padding:'2px 10px',borderRadius:20,letterSpacing:'0.5px',textTransform:'uppercase'}}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {items.map((item) => {
            const I = item.icon;
            const active = loc.pathname === item.path || loc.pathname.startsWith(item.path + '/');
            return (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent', color: active ? '#fff' : '#64748b',
              }}>
                <I size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(139,92,246,0.2)',color:'#c4b5fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{user?.name?.charAt(0)||'A'}</div>
            <span style={{fontSize:12,fontWeight:600,color:'#cbd5e1'}}>{user?.name}</span>
          </div>
          <button onClick={() => { logout(); navigate('/admin/login'); }} style={{width:32,height:32,borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#64748b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><LogOut size={14}/></button>
        </div>
      </nav>
    </div>
  );
}
