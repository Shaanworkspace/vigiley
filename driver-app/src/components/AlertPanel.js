import React, { useState, useEffect } from 'react';
import { alertAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCircle, Clock } from 'lucide-react';

const SV = {critical:{bg:'rgba(239,68,68,0.1)',dot:'#ef4444'},high:{bg:'rgba(234,88,12,0.1)',dot:'#ea580c'},medium:{bg:'rgba(245,158,11,0.1)',dot:'#f59e0b'},low:{bg:'rgba(59,130,246,0.08)',dot:'#3b82f6'}};

export default function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const { warnings } = useSocket();

  useEffect(()=>{load()},[]);
  useEffect(()=>{if(warnings.length>0)load()},[warnings]);

  const load = async () => {
    try{const r=await alertAPI.getAlerts();setAlerts(r.data.alerts?.slice(0,15)||[])}catch(_){}
  };
  const ack = async (id) => {
    try{await alertAPI.acknowledgeAlert(id);load()}catch(_){}
  };

  const p = alerts.filter(a=>!a.isAcknowledged);

  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,backdropFilter:'blur(4px)',display:'flex',flexDirection:'column',minHeight:400}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><Bell size={15} color="#64748b"/><span style={{fontSize:14,fontWeight:600}}>Alerts</span></div>
        {p.length>0&&<span style={{background:'rgba(239,68,68,0.15)',color:'#fca5a5',fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:10}}>{p.length}</span>}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:8,display:'flex',flexDirection:'column',gap:6}}>
        {alerts.length===0&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'40px 20px'}}><CheckCircle size={22} color="#334155"/><p style={{fontSize:13,color:'#475569'}}>All clear — no alerts</p></div>}
        {alerts.map(a=>{
          const v=SV[a.severity]||SV.low;
          return <div key={a._id} style={{borderRadius:10,padding:'10px 12px',display:'flex',gap:10,background:a.isAcknowledged?'rgba(255,255,255,0.02)':v.bg,opacity:a.isAcknowledged?0.5:1,transition:'opacity 0.2s'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:v.dot,marginTop:5,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                <span style={{fontSize:13,fontWeight:600,textTransform:'capitalize'}}>{a.type.replace('_',' ')}</span>
                <span style={{fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',color:v.dot}}>{a.severity}</span>
              </div>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:6,lineHeight:1.4}}>{a.message}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'#475569',display:'flex',alignItems:'center',gap:4}}><Clock size={10}/>{new Date(a.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                {!a.isAcknowledged&&<button style={{fontSize:11,fontWeight:600,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',padding:'2px 0'}} onClick={()=>ack(a._id)}>Dismiss</button>}
              </div>
            </div>
          </div>
        })}
      </div>
    </div>
  );
}
