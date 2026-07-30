import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

const stats = [
  { value: '94.7%', label: 'Detection accuracy', suffix: '' },
  { value: '187', label: 'Average latency', suffix: 'ms' },
  { value: '2.3', label: 'False positive rate', suffix: '%' },
  { value: '4', label: 'Detection modalities', suffix: '' },
  { value: '500+', label: 'Fleet vehicles supported', suffix: '' },
  { value: '99.9', label: 'System uptime', suffix: '%' },
];

function StatItem({ stat, index }) {
  const [ref, visible] = useScrollReveal(0.15);
  return (
    <div
      ref={ref}
      style={{
        ...s.item, textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s`,
      }}
    >
      <div style={s.value}>
        {stat.value}
        <span style={s.suffix}>{stat.suffix}</span>
      </div>
      <div style={s.label}>{stat.label}</div>
    </div>
  );
}

export default function Stats() {
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section style={s.section}>
      <div ref={ref} style={{
        ...s.grid,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {stats.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} index={i} />
        ))}
      </div>
    </section>
  );
}

const s = {
  section: {
    padding: '60px 24px 80px', maxWidth: 1000, margin: '0 auto',
    position: 'relative', zIndex: 1,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px 24px',
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20, padding: '48px 40px',
    backdropFilter: 'blur(8px)',
  },
  item: {},
  value: {
    fontSize: 36, fontWeight: 800, letterSpacing: '-1px',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  suffix: { fontSize: 18, fontWeight: 600, opacity: 0.7 },
  label: { fontSize: 13, color: '#64748b', marginTop: 4 },
};
