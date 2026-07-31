let ctx = null;
let masterGain = null;
let intervalId = null;
let sirenTimer = null;

const ensureCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const beep = (freq, dur) => {
  const c = ensureCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.7, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g);
  g.connect(masterGain);
  o.start();
  o.stop(c.currentTime + dur);
};

export const startAlarm = () => {
  if (intervalId) return;
  if (!ensureCtx()) return;
  const loop = () => {
    beep(880, 0.18);
    sirenTimer = setTimeout(() => beep(620, 0.18), 180);
  };
  loop();
  intervalId = setInterval(loop, 550);
};

export const stopAlarm = () => {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  if (sirenTimer) { clearTimeout(sirenTimer); sirenTimer = null; }
};
