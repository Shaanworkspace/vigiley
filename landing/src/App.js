import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Stats from './components/Stats';
import TechStack from './components/TechStack';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

const s = {
  bgGradient: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.15), transparent),
      radial-gradient(ellipse 50% 40% at 80% 30%, rgba(99,102,241,0.08), transparent),
      radial-gradient(ellipse 40% 30% at 20% 70%, rgba(139,92,246,0.06), transparent)
    `,
    pointerEvents: 'none', zIndex: 0,
  },
};

const styleTag = `
  @keyframes scrollDot {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(8px); opacity: 0.3; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.2); }
    50% { box-shadow: 0 0 40px rgba(59,130,246,0.4); }
  }
  @keyframes bounceDown {
    0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
    50% { transform: translateX(-50%) translateY(10px); opacity: 0.4; }
  }
  @keyframes heroTag {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes tagGlow {
    0%, 100% { border-color: rgba(255,255,255,0.06); }
    50% { border-color: rgba(99,102,241,0.3); }
  }
  section { animation: fadeInUp 0.8s ease-out both; }

  .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px 24px; }
  .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20; }
  .arch-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16; }

  .hero-stat-tag:hover {
    border-color: rgba(99,102,241,0.35) !important;
    transform: translateY(-4px) !important;
    box-shadow: 0 8px 32px rgba(99,102,241,0.12) !important;
    background: rgba(255,255,255,0.05) !important;
  }
  .feature-grid > div, .testi-grid > div, .arch-grid > div { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s !important; }
  .feature-grid > div:hover, .testi-grid > div:hover, .arch-grid > div:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important; }

  @media (max-width: 900px) {
    .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .testi-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 640px) {
    .feature-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px 16px !important; }
    .testi-grid { grid-template-columns: 1fr !important; }
    .arch-grid { grid-template-columns: 1fr !important; }
    section { padding-left: 16px !important; padding-right: 16px !important; }
    .feature-section, .testi-section, .tech-section, .stats-section, .how-section, .footer-section { padding-top: 60px !important; padding-bottom: 60px !important; }
    .how-step { flex-direction: column !important; text-align: center !important; align-items: center !important; }
    .how-line { display: none !important; }
    .how-spacer { display: none !important; }
    .how-dot { margin: 0 auto 8px !important; }
    section h1, .hero-title { font-size: 38px !important; }
    section h2 { font-size: 26px !important; }
    section p { font-size: 15px !important; }
  }
  @media (max-width: 400px) {
    .stats-grid { grid-template-columns: 1fr !important; }
  }
`;

export default function App() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{styleTag}</style>
      <div style={s.bgGradient} />
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <HowItWorks />
      <TechStack />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
