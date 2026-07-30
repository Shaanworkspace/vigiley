import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { adminAPI } from '../services/api';
import { ArrowLeft, Activity, Bell, Clock } from 'lucide-react';

const RC = {low:'#22c55e',medium:'#f59e0b',high:'#ef4444',critical:'#dc2626'};

export default function DriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{adminAPI.getDriverDetail(id).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false))},[id]);

  if(loading) return <div style={{minHeight:'100vh',background:'#020617'}}><Navbar/><div style={{textAlign:'center',padding:60,color:'#64748b'}}>Loading…</div></div>;
  if(!data?.driver) return <div style={{minHeight:'100vh',background:'#020617'}}><Navbar/><div style={{textAlign:'center',padding:60,color:'#64748b'}}>Driver not found</div></div>;

  const dr = data.driver;
  const sess = data.activeSession;
  const sc = {};
  (data.stats||[]).forEach(s=>{sc[s._id]=s.count});

  return (
    <div style={{minHeight:'100vh',background:'#020617'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(59,130,246,0.1),transparent)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'relative',zIndex:1}}><Navbar />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 40px'}}>
        <button style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontSize:13,fontWeight:500,cursor:'pointer',marginBottom:16}} onClick={()=>navigate('/admin/drivers')}><ArrowLeft size={14}/>Back</button>

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:24,display:'flex',alignItems:'center',gap:20,marginBottom:20,backdropFilter:'blur(4px)'}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(59,130,246,0.15)',color:'#93c5fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700}}>{dr.name?.charAt(0)||'D'}</div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:2}}>
              <h2 style={{fontSize:20,fontWeight:700}}>{dr.name}</h2>
              {sess&&<span style={{padding:'2px 10px',borderRadius:20,fontSize:9,fontWeight:600,color:'#fff',textTransform:'uppercase',letterSpacing:'0.5px',background:RC[sess.riskLevel]||'#f59e0b'}}>{sess.riskLevel}</span>}
            </div>
            <p style={{color:'#64748b',fontSize:13,marginBottom:6}}>{dr.email}</p>
            <div style={{display:'flex',gap:16,fontSize:12,color:'#475569'}}><span>{dr.phone||'No phone'}</span><span>{dr.vehicleNumber||'No vehicle'}</span><span>{dr.licenseNumber||'No license'}</span></div>
          </div>
          {sess&&<div style={{textAlign:'center',padding:'10px 20px',background:'rgba(255,255,255,0.03)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{fontSize:30,fontWeight:700}}>{sess.drowsinessScore?.toFixed(0)}</div>
            <div style={{fontSize:9,color:'#475569',textTransform:'uppercase',letterSpacing:'1px'}}>SDS</div>
          </div>}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
          <StatCard label="Normal" value={sc.normal||0} color="#22c55e" icon={Activity}/>
          <StatCard label="Yawning" value={sc.yawning||0} color="#f59e0b"/>
          <StatCard label="Eyes Closed" value={sc.eyes_closed||0} color="#ef4444"/>
          <StatCard label="Drowsy" value={sc.drowsy||0} color="#dc2626"/>
        </div>

        {sess&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
            <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>Session</h3>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748b'}}>Started</span><span>{new Date(sess.startTime).toLocaleString()}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748b'}}>Duration</span><span>{Math.floor((Date.now()-new Date(sess.startTime))/60000)} min</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748b'}}>Detections</span><span>{sess.detectionCount||0}</span></div>
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
            <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>Alerts</h3>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748b'}}>Total</span><span style={{fontWeight:700}}>{sess.totalAlerts||0}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748b'}}>Critical</span><span style={{color:'#dc2626',fontWeight:700}}>{sess.criticalAlerts||0}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'#64748b'}}>High</span><span style={{color:'#ef4444',fontWeight:700}}>{sess.highAlerts||0}</span></div>
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
            <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>SDS</h3>
            <div style={{width:'100%',height:12,background:'rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:6,width:`${sess.drowsinessScore||0}%`,background:(sess.drowsinessScore||0)>70?'#dc2626':(sess.drowsinessScore||0)>40?'#f59e0b':'#22c55e',transition:'width 0.5s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#64748b'}}>
              <span>Peak: {sess.peakDrowsinessScore?.toFixed(0)}%</span>
              <span style={{fontWeight:700,color:'#fff'}}>{sess.drowsinessScore?.toFixed(1)}%</span>
            </div>
          </div>
        </div>}

        {data?.sdsTrend?.length>0&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)',marginBottom:20}}>
          <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>SDS Trend</h3>
          <div style={{display:'flex',gap:2,height:90,alignItems:'flex-end'}}>
            {data.sdsTrend.map((p,i)=>{const mx=Math.max(...data.sdsTrend.map(x=>x.score),1);return <div key={i} style={{flex:1,borderRadius:'2px 2px 0 0',transition:'height 0.3s',minHeight:2,height:`${(p.score/mx)*100}%`,background:p.score>70?'#dc2626':p.score>40?'#f59e0b':'#22c55e',opacity:0.6+0.4*(i/data.sdsTrend.length)}}/>})}
          </div>
        </div>}

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Bell size={14} color="#64748b"/><h3 style={{fontSize:12,color:'#64748b',fontWeight:600,margin:0}}>Recent Alerts</h3></div>
          {(!data?.recentAlerts||data.recentAlerts.length===0)?<p style={{color:'#475569',fontSize:13,textAlign:'center',padding:16}}>No alerts</p>:<div style={{display:'flex',flexDirection:'column',gap:6}}>
            {data.recentAlerts.slice(0,10).map(a=><div key={a._id} style={{display:'flex',alignItems:'center',gap:10,fontSize:12,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{padding:'1px 8px',borderRadius:10,fontSize:9,fontWeight:600,color:'#fff',textTransform:'capitalize',background:RC[a.severity]||'#f59e0b'}}>{a.severity}</span>
              <span style={{textTransform:'capitalize',fontWeight:600,minWidth:60,fontSize:11}}>{a.type.replace('_',' ')}</span>
              <span style={{color:'#94a3b8',flex:1,fontSize:11}}>{a.message}</span>
              <span style={{color:'#475569',fontSize:10}}>{new Date(a.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
            </div>)}
          </div>}
        </div>

        {data?.sessionHistory?.length>0&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Clock size={14} color="#64748b"/><h3 style={{fontSize:12,color:'#64748b',fontWeight:600,margin:0}}>Session History</h3></div>
          <div style={{fontSize:12}}>
            <div style={{display:'flex',gap:16,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.06)',color:'#475569',fontWeight:600,fontSize:10,textTransform:'uppercase'}}><span style={{flex:1}}>Date</span><span style={{flex:1}}>Duration</span><span style={{flex:1}}>SDS</span><span style={{flex:1}}>Risk</span><span style={{flex:0.6,textAlign:'right'}}>Alerts</span></div>
            {data.sessionHistory.slice(0,10).map(s=><div key={s._id} style={{display:'flex',gap:16,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',alignItems:'center'}}>
              <span style={{flex:1,fontSize:11}}>{new Date(s.startTime).toLocaleDateString()}</span>
              <span style={{flex:1}}>{s.duration?`${Math.floor(s.duration/60)}m`:'—'}</span>
              <span style={{flex:1}}>{s.drowsinessScore?.toFixed(0)}%</span>
              <span style={{flex:1}}><span style={{padding:'1px 8px',borderRadius:10,fontSize:9,fontWeight:600,color:'#fff',textTransform:'capitalize',background:RC[s.riskLevel]||'#22c55e'}}>{s.riskLevel||'low'}</span></span>
              <span style={{flex:0.6,textAlign:'right',fontWeight:600}}>{s.totalAlerts||0}</span>
            </div>)}
          </div>
        </div>}
      </div></div>
    </div>
  );
}
