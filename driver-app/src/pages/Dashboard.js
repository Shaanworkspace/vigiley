import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import VideoFeed from '../components/VideoFeed';
import AlertPanel from '../components/AlertPanel';
import { driverAPI } from '../services/api';
import { Activity, AlertTriangle, ScanLine, Shield } from 'lucide-react';

const RC = {low:'#22c55e',medium:'#f59e0b',high:'#ef4444',critical:'#dc2626'};

export default function Dashboard() {
  const [st, setSt] = useState({todayLogs:0,todayDrowsyEvents:0,recentAlerts:[],activeSession:null,hourlyBreakdown:[]});
  const [ld, setLd] = useState(true);
  const [vis, setVis] = useState({});

  useEffect(()=>{
    load();
    const i=setInterval(load,10000);
    return ()=>clearInterval(i);
  },[]);

  useEffect(()=>{
    if(!ld){
      const t=setTimeout(()=>setVis({a:true,b:true,c:true,d:true}),50);
      return ()=>clearTimeout(t);
    }
  },[ld]);

  const load = async () => {
    try{const r=await driverAPI.getDashboard();setSt(r.data)}catch(_){}finally{setLd(false)}
  };

  const s = st.activeSession;
  const rc = RC[s?.riskLevel]||'#22c55e';

  const cards = [
    {l:'Scans Today',v:st.todayLogs,Icon:ScanLine,c:'#3b82f6',k:'a'},
    {l:'Drowsy Events',v:st.todayDrowsyEvents,Icon:AlertTriangle,c:'#f59e0b',k:'b'},
    {l:'Session',v:s?'Active':'Inactive',Icon:Activity,c:s?'#22c55e':'#475569',k:'c'},
    {l:'SDS Score',v:s?`${s.drowsinessScore?.toFixed(0)||'0'}`:'—',Icon:Shield,c:'#8b5cf6',k:'d'},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#020617'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(59,130,246,0.12),transparent),radial-gradient(ellipse 50% 40% at 80% 30%,rgba(99,102,241,0.06),transparent)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'relative',zIndex:1}}>
        <Navbar />
        <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 40px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
            {cards.map((c,i)=>{
              const I=c.Icon;
              return <div key={c.l} style={{
                background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'18px 16px',backdropFilter:'blur(4px)',
                borderTop:`3px solid ${c.c}`,
                opacity:vis[c.k]?1:0,transform:vis[c.k]?'translateY(0)':'translateY(16px)',
                transition:`all 0.6s cubic-bezier(0.16,1,0.3,1) ${i*0.08}s`,
              }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{width:34,height:34,borderRadius:10,background:`${c.c}15`,color:c.c,display:'flex',alignItems:'center',justifyContent:'center'}}><I size={16}/></div>
                  {c.l==='SDS Score'&&s&&<span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',padding:'2px 10px',borderRadius:20,background:rc+'20',color:rc}}>{s.riskLevel}</span>}
                </div>
                <span style={{fontSize:24,fontWeight:700}}>{c.v}</span>
                <span style={{fontSize:12,color:'#64748b',fontWeight:500,display:'block',marginTop:2}}>{c.l}</span>
              </div>
            })}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:20,alignItems:'start'}}>
            <VideoFeed />
            <AlertPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
