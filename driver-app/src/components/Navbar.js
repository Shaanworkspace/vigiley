import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const o = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', o, { passive: true });
    return () => window.removeEventListener('scroll', o);
  }, []);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 20px 0' }}>
      <nav style={{
        maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderRadius: 16,
        background: scrolled ? 'rgba(2,6,23,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59,130,246,0.15)"/>
            <circle cx="11" cy="14" r="2.5" fill="#3b82f6"/><circle cx="21" cy="14" r="2.5" fill="#3b82f6"/>
            <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{fontSize:18,fontWeight:800,letterSpacing:'-0.3px',background:'linear-gradient(135deg,#fff 60%,#94a3b8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VigilEye</span>
          <span style={{fontSize:10,fontWeight:600,color:'#93c5fd',background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.2)',padding:'2px 10px',borderRadius:20,letterSpacing:'0.5px',textTransform:'uppercase'}}>Driver</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(59,130,246,0.2)',color:'#93c5fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>
              {user?.name?.charAt(0)||'D'}
            </div>
            <span style={{fontSize:13,fontWeight:600,color:'#cbd5e1'}}>{user?.name}</span>
          </div>
          <button onClick={()=>{logout();navigate('/login')}} style={{width:34,height:34,borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#64748b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} title="Sign out">
            <LogOut size={15}/>
          </button>
        </div>
      </nav>
    </div>
  );
}
