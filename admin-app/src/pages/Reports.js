import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { BarChart3 } from 'lucide-react';

const SC = {normal:'#22c55e',yawning:'#f59e0b',eyes_closed:'#ef4444',drowsy:'#dc2625',distracted:'#ea580c'};

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({startDate:new Date(Date.now()-7*86400000).toISOString().split('T')[0],endDate:new Date().toISOString().split('T')[0]});

  useEffect(()=>{load()},[]);
  const load = async () => {setLoading(true);try{const r=await adminAPI.getReportSummary(dates);setReport(r.data)}catch(_){}finally{setLoading(false)}};

  return (
    <div style={{minHeight:'100vh',background:'#020617'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(245,158,11,0.08),transparent)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'relative',zIndex:1}}><Navbar />
      <div className="adm-container">
        <div style={{marginBottom:24}}><h1 style={{fontSize:22,fontWeight:700}}>Reports</h1><p style={{fontSize:13,color:'#64748b',marginTop:2}}>Driver drowsiness analytics</p></div>
        <div style={{display:'flex',gap:12,alignItems:'flex-end',marginBottom:24,flexWrap:'wrap'}}>
          <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,fontWeight:600,color:'#64748b'}}>Start</label><input type="date" value={dates.startDate} onChange={e=>setDates({...dates,startDate:e.target.value})} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:13}}/></div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,fontWeight:600,color:'#64748b'}}>End</label><input type="date" value={dates.endDate} onChange={e=>setDates({...dates,endDate:e.target.value})} style={{padding:'7px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:13}}/></div>
          <button style={{padding:'7px 18px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#3b82f6,#6366f1)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}} onClick={load}>Apply</button>
        </div>
        {loading?<div style={{textAlign:'center',padding:60,color:'#64748b'}}>Loading…</div>:!report?<div style={{textAlign:'center',padding:60,color:'#64748b'}}>No data available</div>:<>
          <div className="adm-grid-2" style={{marginBottom:20}}>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
              <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:14}}>Status Distribution</h3>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>{(report.statusDistribution||[]).map(item=>{const total=report.statusDistribution.reduce((a,s)=>a+s.count,0);const pct=total>0?((item.count/total)*100).toFixed(1):0;
                return <div key={item._id} style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{minWidth:90,fontSize:13,fontWeight:500,textTransform:'capitalize'}}>{item._id.replace('_',' ')}</span>
                  <div style={{flex:1,height:16,background:'rgba(255,255,255,0.06)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',borderRadius:4,width:`${pct}%`,background:SC[item._id]||'#3b82f6',transition:'width 0.5s',minWidth:4}}/></div>
                  <span style={{minWidth:28,fontSize:13,fontWeight:600,textAlign:'right'}}>{item.count}</span>
                </div>})}
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
              <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:14}}>Hourly Drowsiness</h3>
              <div style={{display:'flex',gap:4,height:130,alignItems:'flex-end',paddingBottom:18}}>{(report.hourlyTrend||[]).map(h=><div key={h._id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end'}}>
                <div style={{width:'70%',borderRadius:'4px 4px 0 0',transition:'height 0.4s',minHeight:3,height:`${Math.min((h.drowsy/(h.total||1))*100,100)}%`,background:h.drowsy>0?'#ef4444':'rgba(255,255,255,0.06)'}}/>
                <span style={{fontSize:8,color:'#475569',marginTop:4}}>{h._id}:00</span>
              </div>)}</div>
            </div>
          </div>
          <div className="adm-grid-2">
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
              <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:14}}>Alert Severity</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>{(report.alertsBySeverity||[]).map(s=><div key={s._id} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'12px',textAlign:'center',border:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontSize:11,color:'#64748b',textTransform:'capitalize',display:'block',marginBottom:4}}>{s._id}</span>
                <span style={{fontSize:22,fontWeight:700}}>{s.count}</span>
              </div>)}</div>
            </div>
            {report.topDrivers?.length>0&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,backdropFilter:'blur(4px)'}}>
              <h3 style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:14}}>Top Drivers by Drowsy Events</h3>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>{report.topDrivers.map((d,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:13}}>
                <span style={{color:'#475569',fontWeight:700,width:26,fontSize:12}}>#{i+1}</span>
                <div><span style={{fontWeight:600,display:'block',fontSize:12}}>{d.name}</span><span style={{fontSize:10,color:'#475569'}}>{d.email}</span></div>
                <span style={{marginLeft:'auto',color:'#ef4444',fontWeight:600,fontSize:11}}>{d.drowsyEvents} events</span>
              </div>)}</div>
            </div>}
          </div>
        </>}
      </div></div>
    </div>
  );
}
