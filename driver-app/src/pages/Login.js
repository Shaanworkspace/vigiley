import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) navigate('/dashboard', { replace: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.g1} /><div style={s.g2} />
      <div style={s.card}>
        <div style={s.head}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59,130,246,0.15)"/>
            <circle cx="11" cy="14" r="2.5" fill="#3b82f6"/>
            <circle cx="21" cy="14" r="2.5" fill="#3b82f6"/>
            <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={s.logo}>VigilEye</span>
          <span style={s.badge}>Driver</span>
        </div>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to your driver account</p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={s.lbl}>Email</label>
            <div style={s.wrap}>
              <Mail size={16} color="#64748b" style={{position:'absolute',left:12,pointerEvents:'none'}} />
              <input style={s.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="driver@example.com" required />
            </div>
          </div>
          <div>
            <label style={s.lbl}>Password</label>
            <div style={s.wrap}>
              <Lock size={16} color="#64748b" style={{position:'absolute',left:12,pointerEvents:'none'}} />
              <input style={s.inp} type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" required />
              <button type="button" style={s.eye} onClick={()=>setShowPwd(!showPwd)}>{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading?'Signing in…':'Sign in'}</button>
        </form>

        <div style={s.ftr}>
          <span style={{color:'#64748b',fontSize:13}}>Don't have an account?</span>
          <Link to="/register" style={s.link}>Create account</Link>
        </div>
      </div>
    </div>
  );
}

const s={
  page:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#020617',padding:20,position:'relative',overflow:'hidden'},
  g1:{position:'absolute',top:'-20%',right:'-10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)',pointerEvents:'none'},
  g2:{position:'absolute',bottom:'-20%',left:'-10%',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)',pointerEvents:'none'},
  card:{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,padding:'44px 36px 36px',width:'100%',maxWidth:400,backdropFilter:'blur(8px)',position:'relative'},
  head:{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:24},
  logo:{fontSize:20,fontWeight:800,letterSpacing:'-0.5px',background:'linear-gradient(135deg,#fff 60%,#94a3b8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  badge:{fontSize:10,fontWeight:600,color:'#93c5fd',background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.2)',padding:'2px 10px',borderRadius:20,letterSpacing:'0.5px',textTransform:'uppercase'},
  title:{fontSize:22,fontWeight:700,textAlign:'center',marginBottom:4},
  sub:{fontSize:14,color:'#64748b',textAlign:'center',marginBottom:28},
  err:{display:'flex',alignItems:'center',gap:8,background:'rgba(239,68,68,0.1)',color:'#fca5a5',padding:'10px 14px',borderRadius:10,marginBottom:16,fontSize:13,border:'1px solid rgba(239,68,68,0.2)'},
  lbl:{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:6,display:'block'},
  wrap:{position:'relative',display:'flex',alignItems:'center'},
  inp:{width:'100%',padding:'11px 12px 11px 38px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14},
  eye:{position:'absolute',right:10,background:'none',border:'none',color:'#64748b',cursor:'pointer',padding:4,display:'flex'},
  btn:{width:'100%',padding:'13px',border:'none',borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4,boxShadow:'0 4px 20px rgba(59,130,246,0.25)'},
  ftr:{display:'flex',justifyContent:'center',gap:6,marginTop:24},
  link:{color:'#60a5fa',textDecoration:'none',fontWeight:600,fontSize:13},
};
