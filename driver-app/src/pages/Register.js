import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, FileText, Truck } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({name:'',email:'',password:'',phone:'',licenseNumber:'',vehicleNumber:''});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) navigate('/dashboard', { replace: true });

  const h = (e) => setForm({...form,[e.target.name]:e.target.value});
  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register({...form,role:'driver'}); navigate('/dashboard'); }
    catch(err){setError(err.response?.data?.message||'Registration failed')}
    finally{setLoading(false)}
  };

  const fields = [
    {n:'name',l:'Full Name',Icon:User,p:'John Doe'},
    {n:'email',l:'Email',Icon:Mail,p:'driver@example.com'},
    {n:'password',l:'Password',Icon:Lock,p:'Min 6 characters',t:'password'},
    {n:'phone',l:'Phone',Icon:Phone,p:'+91 9876543210'},
    {n:'licenseNumber',l:'License Number',Icon:FileText,p:'DL-2024-001'},
    {n:'vehicleNumber',l:'Vehicle Number',Icon:Truck,p:'UP 32 AB 1234'},
  ];

  return (
    <div style={s.page}>
      <div style={s.g1}/><div style={s.g2}/>
      <div style={s.card}>
        <div style={s.head}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59,130,246,0.15)"/>
            <circle cx="11" cy="14" r="2.5" fill="#3b82f6"/><circle cx="21" cy="14" r="2.5" fill="#3b82f6"/>
            <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={s.logo}>VigilEye</span>
        </div>
        <h1 style={s.title}>Create account</h1>
        <p style={s.sub}>Register as a new driver</p>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12}}>
          {fields.map(f=>{
            const I=f.Icon;
            return <div key={f.n}>
              <label style={s.lbl}>{f.l}</label>
              <div style={s.wrap}>
                <I size={15} color="#64748b" style={{position:'absolute',left:11,pointerEvents:'none'}}/>
                <input style={s.inp} type={f.t||'text'} name={f.n} value={form[f.n]} onChange={h} placeholder={f.p} required={['name','email','password'].includes(f.n)}/>
              </div>
            </div>
          })}
          <button style={s.btn} type="submit" disabled={loading}>{loading?'Creating…':'Create account'}</button>
        </form>
        <div style={s.ftr}><span style={{color:'#64748b',fontSize:13}}>Already have an account?</span><Link to="/login" style={s.link}>Sign in</Link></div>
      </div>
    </div>
  );
}

const s={
  page:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#020617',padding:20,position:'relative',overflow:'hidden'},
  g1:{position:'absolute',top:'-15%',right:'-8%',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)',pointerEvents:'none'},
  g2:{position:'absolute',bottom:'-15%',left:'-8%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)',pointerEvents:'none'},
  card:{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,padding:'36px 32px 32px',width:'100%',maxWidth:440,backdropFilter:'blur(8px)',position:'relative'},
  head:{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:20},
  logo:{fontSize:18,fontWeight:800,letterSpacing:'-0.5px',background:'linear-gradient(135deg,#fff 60%,#94a3b8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  title:{fontSize:20,fontWeight:700,textAlign:'center',marginBottom:2},
  sub:{fontSize:13,color:'#64748b',textAlign:'center',marginBottom:24},
  err:{display:'flex',alignItems:'center',gap:8,background:'rgba(239,68,68,0.1)',color:'#fca5a5',padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13,border:'1px solid rgba(239,68,68,0.2)'},
  lbl:{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:4,display:'block'},
  wrap:{position:'relative',display:'flex',alignItems:'center'},
  inp:{width:'100%',padding:'10px 12px 10px 36px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:13},
  btn:{width:'100%',padding:'12px',border:'none',borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4,boxShadow:'0 4px 20px rgba(59,130,246,0.25)'},
  ftr:{display:'flex',justifyContent:'center',gap:6,marginTop:20},
  link:{color:'#60a5fa',textDecoration:'none',fontWeight:600,fontSize:13},
};
