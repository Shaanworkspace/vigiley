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
  section { animation: fadeInUp 0.8s ease-out both; }
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
