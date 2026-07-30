import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bell, Check } from 'lucide-react';

const SC = {low:'#3b82f6',medium:'#f59e0b',high:'#ef4444',critical:'#dc2626'};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { liveAlerts } = useSocket();

  useEffect(()=>{load()},[filter]);
  useEffect(()=>{if(liveAlerts.length>0)setAlerts(p=>[...liveAlerts,...p].slice(0,50))},[liveAlerts]);

  const load = async () => {
    try{const p={};if(filter==='acknowledged')p.status='acknowledged';else if(filter==='unacknowledged')p.status='unacknowledged';const r=await adminAPI.getAlerts(p);setAlerts(r.data.alerts)}catch(_){}finally{setLoading(false)}
  };
  const ack = async (id) => {try{await adminAPI.acknowledgeAlert(id);load()}catch(_){}};

  const filters = ['all','unacknowledged','acknowledged'];

  return (
    <div style={{minHeight:'100vh',background:'#020617'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(239,68,68,0.08),transparent)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'relative',zIndex:1}}><Navbar />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 40px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:16,flexWrap:'wrap'}}>
          <div><h1 style={{fontSize:22,fontWeight:700}}>Alerts</h1><p style={{fontSize:13,color:'#64748b',marginTop:2}}>{alerts.length} total</p></div>
          <div style={{display:'flex',gap:6}}>{filters.map(f=><button key={f} style={{padding:'6px 14px',borderRadius:8,border:'1px solid',fontSize:12,fontWeight:500,cursor:'pointer',background:filter===f?'rgba(255,255,255,0.1)':'transparent',color:filter===f?'#fff':'#64748b',borderColor:filter===f?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.08)'}} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}</div>
        </div>
        {loading?<div style={{textAlign:'center',padding:60,color:'#64748b'}}>Loading…</div>:alerts.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:60,color:'#475569'}}><Bell size={28} color="#334155"/><p>No alerts found</p></div>:<div style={{display:'flex',flexDirection:'column',gap:8}}>
          {alerts.map(a=>{
            const sev=a.severity||'medium';
            return <div key={a._id} style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:14,border:'1px solid rgba(255,255,255,0.06)',borderLeft:`3px solid ${SC[sev]||'#f59e0b'}`,opacity:a.isAcknowledged?0.5:1,transition:'opacity 0.2s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,gap:12}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontWeight:700,fontSize:13}}>{a.driver?.name||'Unknown'}</span>
                  <span style={{color:'#64748b',fontSize:12,textTransform:'capitalize'}}>{a.type?.replace('_',' ')}</span>
                  <span style={{padding:'1px 7px',borderRadius:10,fontSize:9,fontWeight:600,color:'#fff',textTransform:'uppercase',background:SC[sev]}}>{sev}</span>
                </div>
                <span style={{color:'#475569',fontSize:11,whiteSpace:'nowrap'}}>{new Date(a.timestamp).toLocaleString()}</span>
              </div>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:8}}>{a.message}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'#475569'}}>{a.driver?.vehicleNumber||'—'}</span>
                {!a.isAcknowledged?<button style={{display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:8,border:'none',background:'rgba(59,130,246,0.15)',color:'#93c5fd',fontSize:11,fontWeight:600,cursor:'pointer'}} onClick={()=>ack(a._id)}><Check size={12}/>Acknowledge</button>:<span style={{fontSize:11,color:'#22c55e',fontWeight:600}}>Acknowledged</span>}
              </div>
            </div>
          })}
        </div>}
      </div></div>
    </div>
  );
}
