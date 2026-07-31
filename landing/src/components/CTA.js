import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  const [ref, visible] = useScrollReveal(0.1);
  return (
    <section style={s.section}>
      <div ref={ref} style={{
        ...s.box,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={s.glow} />
        <span style={s.badge}>Get Started</span>
        <h2 style={s.title}>Ready to make your fleet safer?</h2>
        <p style={s.subtitle}>
          Deploy VigilEye across your fleet in minutes. No hardware investment required.
        </p>
        <div style={s.actions}>
          <a href="https://vigileye-driver.vercel.app/register" style={s.btnPrimary}>Try Driver Dashboard</a>
          <a href="https://vigileye-admin.vercel.app/admin/login" style={s.btnSecondary}>Admin Access <ArrowRight size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></a>
        </div>
      </div>
    </section>
  );
}

const s = {
  section: { padding: '60px 24px 100px', maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 },
  box: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05))',
    border: '1px solid rgba(59,130,246,0.15)',
    borderRadius: 24, padding: '60px 40px',
    textAlign: 'center', backdropFilter: 'blur(8px)',
  },
  glow: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  badge: {
    display: 'inline-block', padding: '5px 16px', borderRadius: 20,
    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
    fontSize: 11, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.5px', marginBottom: 20, position: 'relative',
  },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14, position: 'relative' },
  subtitle: { fontSize: 15, color: '#94a3b8', maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.7, position: 'relative' },
  actions: { display: 'flex', gap: 12, justifyContent: 'center', position: 'relative', flexWrap: 'wrap' },
  btnPrimary: {
    padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
    textDecoration: 'none', boxShadow: '0 4px 24px rgba(59,130,246,0.25)',
    display: 'inline-block',
  },
  btnSecondary: {
    padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
    border: '1.5px solid rgba(255,255,255,0.15)', color: '#f1f5f9',
    textDecoration: 'none', display: 'inline-block',
  },
};
