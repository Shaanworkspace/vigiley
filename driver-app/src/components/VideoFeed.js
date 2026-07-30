import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { driverAPI } from '../services/api';
import { Play, Square, Activity, Camera } from 'lucide-react';

const DI = 3000;

export default function VideoFeed() {
  const wc = useRef(null);
  const iv = useRef(null);
  const [on, setOn] = useState(false);
  const [se, setSe] = useState(false);
  const [st, setSt] = useState('normal');
  const [cf, setCf] = useState(0);

  useEffect(() => () => iv.current && clearInterval(iv.current), []);

  const sim = useCallback(() => {
    const ss = ['normal','normal','normal','yawning','eyes_closed','drowsy'];
    const s = ss[Math.floor(Math.random()*ss.length)];
    const c = s==='normal'?Math.floor(Math.random()*25)+5:Math.floor(Math.random()*35)+60;
    setSt(s); setCf(c);
    driverAPI.sendDetection({status:s,confidence:c,eyeAspectRatio:Math.random()*0.5,mouthAspectRatio:Math.random()*0.8,headPitch:(Math.random()-0.5)*30,headYaw:(Math.random()-0.5)*40}).catch(()=>{});
  }, []);

  const start = async () => {
    try { await driverAPI.startSession(); setSe(true); setOn(true); iv.current = setInterval(sim, DI); }
    catch(_){}
  };
  const stop = async () => {
    if(iv.current){clearInterval(iv.current);iv.current=null}
    setOn(false); try{await driverAPI.endSession()}catch(_){}
  };

  const c = (s) => ({normal:'#22c55e',yawning:'#f59e0b',eyes_closed:'#ef4444',drowsy:'#dc2626',distracted:'#ea580c'}[s]||'#22c55e');
  const cc = cf>70?'#ef4444':cf>40?'#f59e0b':'#22c55e';

  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,overflow:'hidden',backdropFilter:'blur(4px)'}}>
      <div style={{position:'relative',background:'#0f172a',aspectRatio:'4/3',overflow:'hidden'}}>
        <Webcam ref={wc} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} screenshotFormat="image/jpeg" mirrored videoConstraints={{facingMode:'user',width:640,height:480}} />
        {!on && (
          <div style={{position:'absolute',inset:0,background:'rgba(2,6,23,0.7)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
            <Camera size={36} color="#475569"/>
            <p style={{fontSize:14,color:'#64748b',fontWeight:500}}>{se?'Detection paused':'Press start to begin'}</p>
          </div>
        )}
        {on && <div style={{position:'absolute',top:12,left:12,background:'rgba(239,68,68,0.85)',color:'#fff',fontSize:10,fontWeight:700,letterSpacing:'1px',padding:'4px 10px',borderRadius:6,display:'flex',alignItems:'center',gap:6}}><span style={{width:6,height:6,borderRadius:'50%',background:'#fff',animation:'pulse 1.5s ease-in-out infinite'}}/>LIVE</div>}
      </div>
      <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',gap:10}}>
        <div>
          <span style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4,display:'block'}}>Status</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Activity size={14} color={c(st)}/>
            <span style={{fontWeight:700,fontSize:14,textTransform:'capitalize',color:st==='normal'?'#22c55e':st==='yawning'?'#f59e0b':'#ef4444'}}>{st.replace('_',' ')}</span>
          </div>
        </div>
        <div>
          <span style={{fontSize:10,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4,display:'block'}}>Confidence</span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,height:6,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',borderRadius:3,background:cc,width:`${cf}%`,transition:'all 0.3s'}}/></div>
            <span style={{fontSize:13,fontWeight:600,color:cc,minWidth:36,textAlign:'right'}}>{cf}%</span>
          </div>
        </div>
      </div>
      <button onClick={on?stop:start} style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:12,margin:16,borderRadius:10,
        border:'1.5px solid',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all 0.2s',
        background:on?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)',
        color:on?'#fca5a5':'#86efac',
        borderColor:on?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)',
      }}>
        {on?<Square size={15}/>:<Play size={15}/>}
        {on?'Stop Monitoring':'Start Monitoring'}
      </button>
    </div>
  );
}
