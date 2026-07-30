import React from 'react';

export default function StatCard({ label, value, color = '#3b82f6', icon: Icon }) {
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'18px 16px',backdropFilter:'blur(4px)',borderTop:`3px solid ${color}`,display:'flex',flexDirection:'column',gap:4}}>
      {Icon && <div style={{width:34,height:34,borderRadius:10,background:`${color}15`,color,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:2}}><Icon size={16}/></div>}
      <span style={{fontSize:24,fontWeight:700}}>{value}</span>
      <span style={{fontSize:12,color:'#64748b',fontWeight:500}}>{label}</span>
    </div>
  );
}
