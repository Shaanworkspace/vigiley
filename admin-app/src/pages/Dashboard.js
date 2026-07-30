import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import AlertBadge from '../components/AlertBadge';
import { adminAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Users, Activity, Bell, Shield, AlertTriangle } from 'lucide-react';

const RC = {low:'#22c55e',medium:'#f59e0b',high:'#ef4444',critical:'#dc2626'};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vis, setVis] = useState(false);
  const { liveAlerts } = useSocket();

  useEffect(()=>{load()},[]);
  useEffect(()=>{if(liveAlerts.length>0&&stats)setStats(p=>({...p,totalAlerts:p.totalAlerts+liveAlerts.length,unacknowledgedAlerts:p.unacknowledgedAlerts+liveAlerts.length}))},[liveAlerts]);

  const load = async () => {
    try{const r=await adminAPI.getDashboard();setStats(r.data);setTimeout(()=>setVis(true),100)}catch(_){}finally{setLoading(false)}
  };

  return (
    <div style={{minHeight:'100vh',background:'#020617'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(139,92,246,0.12),transparent),radial-gradient(ellipse 50% 40% at 80% 30%,rgba(59,130,246,0.06),transparent)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'relative',zIndex:1}}>
        <Navbar />
        <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 40px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
            <div><h1 style={{fontSize:22,fontWeight:700}}>Dashboard</h1><p style={{fontSize:13,color:'#64748b',marginTop:2}}>Real-time fleet safety overview</p></div>
            <AlertBadge />
          </div>
          {loading ? <div style={{textAlign:'center',padding:60,color:'#64748b'}}>Loading…</div> : (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
                <StatCard label="Total Drivers" value={stats?.totalDrivers||0} color="#3b82f6" icon={Users} />
                <StatCard label="Active Now" value={stats?.activeSessions||0} color="#22c55e" icon={Activity} />
                <StatCard label="Total Alerts" value={stats?.totalAlerts||0} color="#ef4444" icon={Bell} />
                <StatCard label="Avg SDS" value={stats?.avgSessionSDS?.avgSDS?.toFixed(1)||'0'} color="#8b5cf6" icon={Shield} />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
                {[
                  {t:'Unacknowledged',v:stats?.unacknowledgedAlerts||0},
                  {t:"Today's Alerts",v:stats?.todayAlerts||0},
                  {t:'Completed Sessions',v:stats?.avgSessionSDS?.total||0},
                ].map((c,i)=><div key={c.t} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)',opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(16px)',transition:`all 0.5s cubic-bezier(0.16,1,0.3,1) ${i*0.08}s`}}>
                  <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:8}}>{c.t}</h3>
                  <div style={{fontSize:34,fontWeight:700}}>{c.v}</div>
                </div>)}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
                  <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>Alert Severity</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>{(stats?.alertsBySeverity||[]).map(s=><div key={s._id} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{textTransform:'capitalize',fontSize:13}}>{s._id}</span><span style={{fontWeight:700,fontSize:16}}>{s.count}</span></div>)}</div>
                </div>
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
                  <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>Active Risk Levels</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>{(stats?.riskDistribution||[]).map(r=><div key={r._id} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{color:RC[r._id]||'#fff',textTransform:'capitalize',fontSize:13,fontWeight:600}}>{r._id}</span><span style={{fontWeight:700,fontSize:16}}>{r.count}</span></div>)}
                  {(!stats?.riskDistribution||stats.riskDistribution.length===0)&&<span style={{color:'#475569',fontSize:13}}>No active sessions</span>}</div>
                </div>
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
                  <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>Hourly Trend</h3>
                  <div style={{display:'flex',gap:3,height:100,alignItems:'flex-end',paddingBottom:18}}>
                    {(stats?.hourlyAlertTrend||[]).map(h=>{const mx=Math.max(...(stats?.hourlyAlertTrend||[]).map(x=>x.count),1);return <div key={h._id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end'}}>
                      <div style={{width:'70%',borderRadius:'4px 4px 0 0',transition:'height 0.4s',minHeight:3,height:`${(h.count/mx)*100}%`,background:h.count>3?'#ef4444':h.count>1?'#f59e0b':'#22c55e'}}/>
                      <span style={{fontSize:8,color:'#475569',marginTop:3}}>{h._id}</span>
                    </div>})}
                  </div>
                </div>
              </div>

              {stats?.highRiskDrivers?.length>0&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)',marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><AlertTriangle size={15} color="#ef4444"/><h3 style={{fontSize:12,color:'#64748b',fontWeight:600,margin:0}}>High-Risk Drivers</h3></div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {stats.highRiskDrivers.map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:12,fontSize:13,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{color:'#475569',fontWeight:700,width:22,fontSize:12}}>#{i+1}</span>
                    <div style={{minWidth:130}}><span style={{fontWeight:600,display:'block',fontSize:12}}>{s.driver?.name||'Unknown'}</span><span style={{color:'#64748b',fontSize:10}}>{s.driver?.vehicleNumber||'—'}</span></div>
                    <div style={{flex:1,height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',borderRadius:3,width:`${s.drowsinessScore||0}%`,background:s.riskLevel==='critical'?'#dc2626':'#ef4444'}}/></div>
                    <span style={{minWidth:35,fontWeight:600,fontSize:12,textAlign:'right'}}>{s.drowsinessScore?.toFixed(0)}%</span>
                    <span style={{padding:'2px 8px',borderRadius:12,fontSize:9,fontWeight:600,color:'#fff',textTransform:'capitalize',background:RC[s.riskLevel]}}>{s.riskLevel}</span>
                  </div>)}
                </div>
              </div>}

              {liveAlerts.length>0&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Bell size={15} color="#ef4444"/><h3 style={{fontSize:12,color:'#64748b',fontWeight:600,margin:0}}>Live Alerts</h3><AlertBadge/></div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>{liveAlerts.slice(0,6).map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:RC[a.severity]||'#f59e0b'}}/>
                  <span style={{fontWeight:600,minWidth:90,fontSize:12}}>{a.driver?.name||'Driver'}</span>
                  <span style={{color:'#64748b',textTransform:'capitalize',minWidth:60,fontSize:11}}>{a.type}</span>
                  {a.sds&&<span style={{color:'#475569',fontSize:10}}>SDS {a.sds}%</span>}
                  <span style={{marginLeft:'auto',color:'#475569',fontSize:10}}>{new Date(a.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>)}</div>
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
