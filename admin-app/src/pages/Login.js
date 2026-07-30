import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) navigate('/admin/dashboard', { replace: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/admin/dashboard'); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#020617',padding:20,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-20%',right:'-10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-20%',left:'-10%',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,padding:'44px 36px 36px',width:'100%',maxWidth:400,backdropFilter:'blur(8px)',position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:24}}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139,92,246,0.15)"/>
            <circle cx="11" cy="14" r="2.5" fill="#8b5cf6"/><circle cx="21" cy="14" r="2.5" fill="#8b5cf6"/>
            <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{fontSize:20,fontWeight:800,letterSpacing:'-0.5px',background:'linear-gradient(135deg,#fff 60%,#94a3b8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VigilEye</span>
          <span style={{fontSize:9,fontWeight:600,color:'#a78bfa',background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.2)',padding:'2px 10px',borderRadius:20,letterSpacing:'0.5px',textTransform:'uppercase'}}>Admin</span>
        </div>
        <h1 style={{fontSize:22,fontWeight:700,textAlign:'center',marginBottom:4}}>Admin sign in</h1>
        <p style={{fontSize:14,color:'#64748b',textAlign:'center',marginBottom:28}}>Access fleet management dashboard</p>
        {error && <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(239,68,68,0.1)',color:'#fca5a5',padding:'10px 14px',borderRadius:10,marginBottom:16,fontSize:13,border:'1px solid rgba(239,68,68,0.2)'}}>{error}</div>}
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div><label style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:6,display:'block'}}>Email</label><div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <Mail size={16} color="#64748b" style={{position:'absolute',left:12,pointerEvents:'none'}}/>
            <input style={{width:'100%',padding:'11px 12px 11px 38px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div></div>
          <div><label style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:6,display:'block'}}>Password</label><div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <Lock size={16} color="#64748b" style={{position:'absolute',left:12,pointerEvents:'none'}}/>
            <input style={{width:'100%',padding:'11px 12px 11px 38px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14}} type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" required />
            <button type="button" style={{position:'absolute',right:10,background:'none',border:'none',color:'#64748b',cursor:'pointer',padding:4,display:'flex'}} onClick={()=>setShowPwd(!showPwd)}>{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button>
          </div></div>
          <button style={{width:'100%',padding:'13px',border:'none',borderRadius:10,background:'linear-gradient(135deg,#8b5cf6,#6366f1)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4,boxShadow:'0 4px 20px rgba(139,92,246,0.25)'}} type="submit" disabled={loading}>{loading?'Signing in…':'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
