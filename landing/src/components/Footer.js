import React from 'react';

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        <div style={s.top}>
          <div style={s.brand}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59,130,246,0.15)" />
              <circle cx="11" cy="14" r="2" fill="#3b82f6" />
              <circle cx="21" cy="14" r="2" fill="#3b82f6" />
              <path d="M10 21c2 2.5 10 2.5 12 0" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={s.brandText}>VigilEye</span>
          </div>
          <p style={s.desc}>Multi-modal driver drowsiness detection and fleet safety intelligence platform.</p>
        </div>
        <div style={s.links}>
          <div style={s.col}>
            <h4 style={s.colTitle}>Product</h4>
            <a href="#features" style={s.link}>Features</a>
            <a href="#how-it-works" style={s.link}>How It Works</a>
            <a href="#technology" style={s.link}>Technology</a>
          </div>
          <div style={s.col}>
            <h4 style={s.colTitle}>Access</h4>
            <a href="http://localhost:3000/login" style={s.link}>Driver Login</a>
            <a href="http://localhost:3001/admin/login" style={s.link}>Admin Login</a>
            <a href="http://localhost:3000/register" style={s.link}>Register</a>
          </div>
          <div style={s.col}>
            <h4 style={s.colTitle}>Research</h4>
            <a href="https://github.com/Shaanworkspace/vigiley/blob/main/RESEARCH.md" style={s.link} target="_blank" rel="noopener noreferrer">Research Paper</a>
            <a href="https://github.com/Shaanworkspace/vigiley/blob/main/PATENT.md" style={s.link} target="_blank" rel="noopener noreferrer">Patent</a>
            <a href="https://github.com/Shaanworkspace/vigiley" style={s.link} target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </div>
      <div style={s.divider} />
      <p style={s.copy}>&copy; {new Date().getFullYear()} VigilEye. Patent pending. All rights reserved.</p>
    </footer>
  );
}

const s = {
  footer: { padding: '60px 24px 32px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 },
  inner: { display: 'flex', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' },
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  brandText: { fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' },
  desc: { fontSize: 13, color: '#64748b', maxWidth: 280, lineHeight: 1.7 },
  links: { display: 'flex', gap: 48, flexWrap: 'wrap' },
  col: { display: 'flex', flexDirection: 'column', gap: 8 },
  colTitle: { fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  link: { fontSize: 13, color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' },
  divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '32px 0 20px' },
  copy: { fontSize: 12, color: '#475569', textAlign: 'center' },
};
