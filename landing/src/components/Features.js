import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
    title: 'Multi-Modal Fusion',
    desc: 'Combines eye aspect ratio, mouth aspect ratio, and head pose in a single temporal attention network for superior accuracy.',
    color: '#3b82f6',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Real-Time Alerts',
    desc: 'Severity-aware adaptive alerting with simultaneous driver and admin notification in under 200 milliseconds.',
    color: '#22c55e',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Fleet Dashboard',
    desc: 'Centralized admin console with live driver monitoring, alert acknowledgment workflow, and risk heatmaps.',
    color: '#8b5cf6',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-6" />
      </svg>
    ),
    title: 'Predictive Analytics',
    desc: 'Session-Aware Drowsiness Score (SDS) with temporal decay and fleet-wide trend analysis for predictive safety insights.',
    color: '#f59e0b',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10h-10V2z" />
        <path d="M12 12 8 8" />
        <path d="M16 4v4h4" />
      </svg>
    ),
    title: 'Instant Setup',
    desc: 'Works with any standard webcam. No special hardware required. Deploy across your fleet in minutes.',
    color: '#06b6d4',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Enterprise Security',
    desc: 'JWT-based authentication, role-based access control, and encrypted WebSocket connections for data security.',
    color: '#ec4899',
  },
];

function FeatureCard({ feature, index }) {
  const [ref, visible] = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      style={{
        ...s.card,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s`,
      }}
    >
      <div style={{ ...s.iconWrap, background: `${feature.color}15`, color: feature.color }}>
        {feature.icon}
      </div>
      <h3 style={s.cardTitle}>{feature.title}</h3>
      <p style={s.cardDesc}>{feature.desc}</p>
    </div>
  );
}

export default function Features() {
  const [ref, visible] = useScrollReveal(0.05);

  return (
    <section id="features" style={s.section}>
      <div ref={ref} style={{
        ...s.inner,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <span style={s.badge}>Features</span>
        <h2 style={s.title}>Everything you need for driver safety</h2>
        <p style={s.subtitle}>
          From real-time detection to fleet-wide analytics — VigilEye gives you complete
          visibility into driver alertness.
        </p>
      </div>
      <div style={s.grid}>
        {features.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}

const s = {
  section: { padding: '100px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 },
  inner: { textAlign: 'center', marginBottom: 56 },
  badge: {
    display: 'inline-block', padding: '5px 16px', borderRadius: 20,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
    fontSize: 11, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.5px', marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 },
  subtitle: { fontSize: 16, color: '#94a3b8', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  card: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, padding: '28px 24px',
    backdropFilter: 'blur(4px)',
  },
  iconWrap: { width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' },
  cardDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7 },
};
