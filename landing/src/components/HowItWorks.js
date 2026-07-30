import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';

const steps = [
  {
    num: '01',
    title: 'Connect a camera',
    desc: 'Any standard webcam or dashcam works. No special hardware, no calibration needed.',
    color: '#3b82f6',
  },
  {
    num: '02',
    title: 'AI analyzes in real time',
    desc: 'VigilEye tracks eye closure, yawning frequency, and head position simultaneously.',
    color: '#22c55e',
  },
  {
    num: '03',
    title: 'Severity scored instantly',
    desc: 'Each detection is scored and mapped to a 5-level severity scale for appropriate response.',
    color: '#f59e0b',
  },
  {
    num: '04',
    title: 'Alerts dispatched simultaneously',
    desc: 'Driver gets an in-cab warning while fleet admin sees a live alert on their dashboard.',
    color: '#8b5cf6',
  },
  {
    num: '05',
    title: 'Patterns analyzed over time',
    desc: 'SDS history builds per session, enabling trend analysis and predictive intervention.',
    color: '#ec4899',
  },
];

export default function HowItWorks() {
  const [ref, visible] = useScrollReveal(0.05);

  return (
    <section id="how-it-works" style={s.section}>
      <div ref={ref} style={{
        ...s.inner,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <span style={s.badge}>How It Works</span>
        <h2 style={s.title}>Five steps to safer roads</h2>
        <p style={s.subtitle}>From camera feed to actionable intelligence in milliseconds.</p>
      </div>
      <div style={s.timeline}>
        {steps.map((step, i) => (
          <StepItem key={step.num} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

function StepItem({ step, index }) {
  const [ref, visible] = useScrollReveal(0.1);
  const isEven = index % 2 === 0;
  return (
    <div
      ref={ref}
      style={{
        ...s.step,
        flexDirection: isEven ? 'row' : 'row-reverse',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : `translateX(${isEven ? '-40px' : '40px'})`,
        transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s`,
      }}
    >
      <div style={s.stepContent}>
        <span style={{ ...s.stepNum, color: step.color }}>{step.num}</span>
        <h3 style={s.stepTitle}>{step.title}</h3>
        <p style={s.stepDesc}>{step.desc}</p>
      </div>
      <div style={s.stepLine}>
        <div style={{ ...s.stepDot, borderColor: step.color }} />
        {index < steps.length - 1 && <div style={{ ...s.line, background: `linear-gradient(to bottom, ${step.color}, ${steps[index + 1]?.color || step.color})` }} />}
      </div>
      <div style={s.stepSpacer} />
    </div>
  );
}

const s = {
  section: { padding: '100px 24px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 },
  inner: { textAlign: 'center', marginBottom: 56 },
  badge: {
    display: 'inline-block', padding: '5px 16px', borderRadius: 20,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
    fontSize: 11, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.5px', marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 },
  subtitle: { fontSize: 16, color: '#94a3b8', lineHeight: 1.7 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  step: { display: 'flex', alignItems: 'flex-start', gap: 24 },
  stepContent: { flex: 1, padding: '20px 0' },
  stepNum: { fontSize: 48, fontWeight: 900, lineHeight: 1, opacity: 0.5, letterSpacing: '-2px', marginBottom: 8, display: 'block' },
  stepTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' },
  stepDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 1.7 },
  stepLine: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, paddingTop: 24 },
  stepDot: { width: 16, height: 16, borderRadius: '50%', border: '3px solid', background: '#020617', flexShrink: 0 },
  line: { width: 2, flex: 1, minHeight: 60 },
  stepSpacer: { flex: 1, display: 'none' },
};
