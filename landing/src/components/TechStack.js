import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import { Monitor, Settings, Database, Brain } from 'lucide-react';

const techs = [
  { name: 'React', color: '#61dafb' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Express', color: '#fff' },
  { name: 'MongoDB', color: '#47A248' },
  { name: 'Socket.io', color: '#fff' },
  { name: 'WebSocket', color: '#fff' },
  { name: 'JWT', color: '#fff' },
  { name: 'REST API', color: '#fff' },
];

export default function TechStack() {
  const [ref, visible] = useScrollReveal(0.1);
  const [ref2, visible2] = useScrollReveal(0.1);

  return (
    <section id="technology" className="tech-section" style={s.section}>
      <div ref={ref} style={{
        textAlign: 'center', marginBottom: 48,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <span style={s.badge}>Technology</span>
        <h2 style={s.title}>Built on modern infrastructure</h2>
        <p style={s.subtitle}>A full-stack architecture designed for real-time performance at fleet scale.</p>
      </div>

      <div ref={ref2} style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 600, margin: '0 auto 48px',
        opacity: visible2 ? 1 : 0, transform: visible2 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s',
      }}>
        {techs.map((t) => (
          <span key={t.name} style={{ ...s.chip, borderColor: `${t.color}30`, color: t.color === '#fff' ? '#e2e8f0' : t.color }}>
            {t.name}
          </span>
        ))}
      </div>

      <div className="arch-grid" style={s.archGrid}>
        {[
          { layer: 'Frontend', items: 'React 18, React Router, WebSocket client, Recharts', icon: Monitor, color: '#60a5fa' },
          { layer: 'Backend', items: 'Node.js, Express, Socket.io, JWT, Multer', icon: Settings, color: '#34d399' },
          { layer: 'Database', items: 'MongoDB, Mongoose ODM, Aggregation Pipeline', icon: Database, color: '#a78bfa' },
          { layer: 'Detection', items: 'Multi-modal fusion, Temporal attention, SDS algorithm', icon: Brain, color: '#fbbf24' },
        ].map((item) => (
          <ArchCard key={item.layer} item={item} />
        ))}
      </div>
    </section>
  );
}

function ArchCard({ item }) {
  const [ref, visible] = useScrollReveal(0.1);
  const Icon = item.icon;
  return (
    <div ref={ref} style={{
      ...s.archCard,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 12,
        background: `${item.color}15`, color: item.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} />
      </div>
      <h4 style={s.archTitle}>{item.layer}</h4>
      <p style={s.archDesc}>{item.items}</p>
    </div>
  );
}

const s = {
  section: { padding: '100px 24px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 },
  badge: {
    display: 'inline-block', padding: '5px 16px', borderRadius: 20,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
    fontSize: 11, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.5px', marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 },
  subtitle: { fontSize: 16, color: '#94a3b8', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 },
  chip: {
    padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: '1px solid', background: 'rgba(255,255,255,0.03)',
  },
  archGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  archCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: '24px',
  },
  archTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  archDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7 },
};
