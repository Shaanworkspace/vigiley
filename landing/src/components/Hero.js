import React from 'react';
import { Sparkles, ChevronDown, Gauge, Timer, ShieldCheck, Activity, Zap } from 'lucide-react';

const DRIVER_URL = 'https://vigileye-driver.vercel.app/login';

const stats = [
  { val: '94.7%', label: 'Detection accuracy', icon: Activity, color: '#60a5fa' },
  { val: '<200ms', label: 'Alert latency', icon: Zap, color: '#34d399' },
  { val: '2.3%', label: 'False positive rate', icon: ShieldCheck, color: '#a78bfa' },
  { val: '24/7', label: 'Real-time monitoring', icon: Timer, color: '#fbbf24' },
];

export default function Hero() {
  return (
    <section style={s.section}>
      <div style={s.glow1} />
      <div style={s.glow2} />
      <div style={s.inner}>
        <div style={s.badge}>
          <Sparkles size={12} style={{ marginRight: 6, verticalAlign: 'middle', color: '#93c5fd' }} />
          Multi-Modal Drowsiness Detection
        </div>
        <h1 style={s.title}>
          Never let fatigue<br />
          <span style={s.gradient}>go unnoticed</span>
        </h1>
        <p style={s.subtitle}>
          VigilEye fuses eye tracking, yawn detection, and head pose analysis through
          real-time AI to keep every driver alert and every fleet safe.
        </p>
        <div style={s.actions}>
          <a href="#features" style={s.btnPrimary}>Explore features</a>
          <a href={DRIVER_URL} style={s.btnSecondary}>Driver dashboard <Gauge size={15} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></a>
        </div>

        <div style={s.statsRow}>
          {stats.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="hero-stat-tag" style={{ ...s.statItem, animation: `heroTag 0.6s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.15}s both` }}>
                <div style={s.statIconWrap}>
                  <Icon size={16} color={item.color} />
                </div>
                <span style={s.statVal}>{item.val}</span>
                <span style={s.statLabel}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.scrollHint}>
        <ChevronDown size={20} style={s.scrollIcon} />
      </div>
    </section>
  );
}

const s = {
  section: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    padding: '120px 24px 60px',
  },
  glow1: {
    position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', bottom: '10%', right: '10%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  inner: { maxWidth: 800, textAlign: 'center', position: 'relative', zIndex: 1 },
  badge: {
    display: 'inline-block',
    padding: '6px 18px', borderRadius: 20,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
    fontSize: 12, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.5px',
    marginBottom: 28,
  },
  title: { fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 },
  gradient: { background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 36px' },
  actions: { display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60, flexWrap: 'wrap' },
  btnPrimary: {
    padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
    textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 24px rgba(59,130,246,0.25)',
  },
  btnSecondary: {
    padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
    border: '1.5px solid rgba(255,255,255,0.15)', color: '#f1f5f9',
    textDecoration: 'none', transition: 'all 0.2s',
  },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  statItem: {
    textAlign: 'center', minWidth: 170,
    padding: '16px 12px', borderRadius: 14,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(4px)', transition: 'all 0.25s',
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 9, margin: '0 auto 8px',
    background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statVal: { display: 'block', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  scrollHint: {
    position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    width: 40, height: 40, borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'bounceDown 2s ease-in-out infinite',
    cursor: 'pointer',
  },
  scrollIcon: { color: '#94a3b8' },
};
