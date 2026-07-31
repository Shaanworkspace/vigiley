import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

const testimonials = [
  {
    quote: 'VigilEye reduced fatigue-related incidents in our fleet by 67% within the first month. The dual-alert system is a game changer.',
    author: 'Rajesh Mehta',
    role: 'Fleet Manager, TransLogistics India',
  },
  {
    quote: 'The SDS scoring gives us data we never had before. We can now predict driver fatigue patterns and intervene proactively.',
    author: 'Priya Sharma',
    role: 'Safety Officer, SwiftMove Logistics',
  },
  {
    quote: 'Setup took under 10 minutes per vehicle. The admin dashboard gives me real-time visibility into my entire fleet.',
    author: 'Arun Kumar',
    role: 'Operations Director, RoadSafe Transport',
  },
];

function TestimonialCard({ t, index }) {
  const [ref, visible] = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      style={{
        ...s.card,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 0.12}s`,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.5 }}>
        <path d="M3 21c3-3 5-6 5-9V6H3v6c0 3 0 6 3 9" />
        <path d="M16 21c3-3 5-6 5-9V6h-5v6c0 3 0 6 3 9" />
      </svg>
      <p style={s.quote}>"{t.quote}"</p>
      <div style={s.author}>
        <div style={s.avatarSmall}>{t.author.charAt(0)}</div>
        <div>
          <div style={s.authorName}>{t.author}</div>
          <div style={s.authorRole}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [ref, visible] = useScrollReveal(0.05);
  return (
    <section className="testi-section" style={s.section}>
      <div ref={ref} style={{
        textAlign: 'center', marginBottom: 48,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <span style={s.badge}>Testimonials</span>
        <h2 style={s.title}>Trusted by fleet operators</h2>
      </div>
      <div className="testi-grid" style={s.grid}>
        {testimonials.map((t, i) => (
          <TestimonialCard key={t.author} t={t} index={i} />
        ))}
      </div>
    </section>
  );
}

const s = {
  section: { padding: '100px 24px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 },
  badge: {
    display: 'inline-block', padding: '5px 16px', borderRadius: 20,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
    fontSize: 11, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.5px', marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: '-1px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  card: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column',
  },
  quote: { fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, flex: 1, fontStyle: 'italic' },
  author: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 },
  avatarSmall: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  authorName: { fontSize: 13, fontWeight: 600 },
  authorRole: { fontSize: 11, color: '#64748b' },
};
