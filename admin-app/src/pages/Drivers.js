import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { Users, Search } from 'lucide-react';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { adminAPI.getDrivers().then(r=>setDrivers(r.data.drivers)).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const f = drivers.filter(d=>d.name?.toLowerCase().includes(search.toLowerCase())||d.email?.toLowerCase().includes(search.toLowerCase())||d.vehicleNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{minHeight:'100vh',background:'#020617'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(59,130,246,0.1),transparent)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'relative',zIndex:1}}>
        <Navbar />
        <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 40px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:16,flexWrap:'wrap'}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>Drivers</h1><p style={{fontSize:13,color:'#64748b',marginTop:2}}>{drivers.length} registered</p></div>
            <div style={{position:'relative',maxWidth:260,width:'100%'}}>
              <Search size={15} color="#475569" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input style={{width:'100%',padding:'8px 12px 8px 36px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:13}} placeholder="Search drivers…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          {loading ? <div style={{textAlign:'center',padding:60,color:'#64748b'}}>Loading…</div> : f.length===0 ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:60,color:'#475569'}}><Users size={28} color="#334155"/><p>{search?'No drivers match your search':'No drivers registered yet'}</p></div> : (
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,overflow:'hidden',backdropFilter:'blur(4px)'}}>
              <div style={{display:'flex',padding:'10px 20px',background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.06)',fontSize:10,fontWeight:600,color:'#475569',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                <span style={{flex:2}}>Name</span><span style={{flex:2}}>Email</span><span style={{flex:1.5}}>Phone</span><span style={{flex:1.5}}>Vehicle</span><span style={{flex:1}}>Status</span><span style={{flex:0.8}}>SDS</span><span style={{flex:0.6,textAlign:'right'}}></span>
              </div>
              {f.map(d=><div key={d._id} style={{display:'flex',padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:13,alignItems:'center'}}>
                <span style={{flex:2,fontWeight:600}}>{d.name}</span>
                <span style={{flex:2,color:'#64748b',fontSize:12}}>{d.email}</span>
                <span style={{flex:1.5,color:'#64748b',fontSize:12}}>{d.phone||'—'}</span>
                <span style={{flex:1.5,color:'#64748b',fontSize:12}}>{d.vehicleNumber||'—'}</span>
                <span style={{flex:1}}>
                  <span style={{padding:'2px 10px',borderRadius:20,fontSize:10,fontWeight:600,background:d.activeSession?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.04)',color:d.activeSession?'#22c55e':'#475569'}}>{d.activeSession?'Active':'Offline'}</span>
                </span>
                <span style={{flex:0.8,fontSize:12,fontWeight:600,color:d.riskLevel==='critical'?'#dc2626':d.riskLevel==='high'?'#ea580c':'#64748b'}}>{d.currentSDS?.toFixed(0)||'—'}%</span>
                <span style={{flex:0.6,textAlign:'right'}}><button style={{padding:'4px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontSize:11,fontWeight:600,cursor:'pointer'}} onClick={()=>navigate(`/admin/drivers/${d._id}`)}>View</button></span>
              </div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
