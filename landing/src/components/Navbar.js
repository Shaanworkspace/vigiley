import React, { useState, useEffect } from 'react';
import { Menu, X, Monitor, ShieldCheck } from 'lucide-react';

const DRIVER_URL = 'https://vigileye-driver.vercel.app/login';
const ADMIN_URL = 'https://vigileye-admin.vercel.app/admin/login';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  const links = ['Features', 'How It Works', 'Technology'];

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

        {!isMobile && (
          <div style={s.links}>
            {links.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} style={s.link}>{item}</a>
            ))}
          </div>
        )}

        {!isMobile ? (
          <div style={s.right}>
            <a href={DRIVER_URL} style={s.btnOutline}><Monitor size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Driver Login</a>
            <a href={ADMIN_URL} style={s.btnFill}><ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Admin Login</a>
          </div>
        ) : (
          <button onClick={() => setOpen(!open)} style={s.burger}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </nav>

      {isMobile && open && (
        <div style={s.mobileMenu}>
          {links.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} style={s.mobileLink} onClick={() => setOpen(false)}>{item}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 20px' }}>
            <a href={DRIVER_URL} style={{ ...s.btnOutline, textAlign: 'center' }}>Driver Login</a>
            <a href={ADMIN_URL} style={{ ...s.btnFill, textAlign: 'center' }}>Admin Login</a>
          </div>
        </div>
      )}
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
  links: { display: 'flex', gap: 2 },
  link: { padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#94a3b8', textDecoration: 'none', borderRadius: 8, transition: 'color 0.2s' },
  right: { display: 'flex', gap: 8 },
  btnOutline: {
    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    border: '1.5px solid rgba(255,255,255,0.15)', color: '#f1f5f9',
    textDecoration: 'none', transition: 'all 0.2s',
  },
  btnFill: {
    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
    textDecoration: 'none', transition: 'all 0.2s',
  },
  burger: {
    background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 8,
  },
  mobileMenu: {
    maxWidth: 1200, margin: '8px auto 0',
    background: 'rgba(2,6,23,0.92)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, backdropFilter: 'blur(16px)',
    padding: '8px 0', display: 'flex', flexDirection: 'column',
    animation: 'fadeInUp 0.25s ease-out',
  },
  mobileLink: {
    padding: '12px 20px', fontSize: 14, fontWeight: 500, color: '#cbd5e1',
    textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
};
