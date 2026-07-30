import React, { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={s.wrapper}>
      <nav style={{
        ...s.nav,
        background: scrolled ? 'rgba(2,6,23,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}>
        <div style={s.left}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59,130,246,0.15)" />
            <circle cx="11" cy="14" r="2.5" fill="#3b82f6" />
            <circle cx="21" cy="14" r="2.5" fill="#3b82f6" />
            <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={s.brand}>VigilEye</span>
        </div>
        <div style={s.links}>
          {['Features', 'How It Works', 'Technology', 'Contact'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} style={s.link}>{item}</a>
          ))}
        </div>
        <div style={s.right}>
          <a href="http://localhost:3000/login" style={s.btnOutline}>Driver Login</a>
          <a href="http://localhost:3001/admin/login" style={s.btnFill}>Admin Login</a>
        </div>
      </nav>
    </div>
  );
}

const s = {
  wrapper: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 24px 0' },
  nav: {
    maxWidth: 1200, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', borderRadius: 16,
    transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  brand: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #fff 60%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  links: { display: 'flex', gap: 2, display: 'none', '@media (min-width: 768px)': { display: 'flex' } },
  link: { padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#94a3b8', textDecoration: 'none', borderRadius: 8, transition: 'color 0.2s' },
  right: { display: 'flex', gap: 8 },
  btnOutline: {
    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    border: '1.5px solid rgba(255,255,255,0.15)', color: '#f1f5f9',
    textDecoration: 'none', transition: 'all 0.2s',
  },
  btnFill: {
    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
    textDecoration: 'none', transition: 'all 0.2s',
  },
};
