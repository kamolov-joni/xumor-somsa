let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Gentle chime for standard reminders
export const playUpcomingSound = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Play a pleasant two-tone chime
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.2);
    gain.gain.linearRampToValueAtTime(0.3, now + i * 0.2 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.5);
    osc.start(now + i * 0.2);
    osc.stop(now + i * 0.2 + 0.5);
  });
};

// Warning sound for 30 min before
export const playWarningSound = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0, now + i * 0.3);
    gain.gain.linearRampToValueAtTime(0.4, now + i * 0.3 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.25);
    osc.start(now + i * 0.3);
    osc.stop(now + i * 0.3 + 0.3);
  }
};

// Urgent alarm for 10 min before
export const playCriticalSound = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now + i * 0.15);
    osc.frequency.linearRampToValueAtTime(1200, now + i * 0.15 + 0.1);
    gain.gain.setValueAtTime(0.3, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.14);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.15);
  }
};

// Overdue alarm - urgent repeating
export const playOverdueSound = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  for (let i = 0; i < 6; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = i % 2 === 0 ? 440 : 880;
    gain.gain.setValueAtTime(0, now + i * 0.2);
    gain.gain.linearRampToValueAtTime(0.25, now + i * 0.2 + 0.02);
    gain.gain.setValueAtTime(0.25, now + i * 0.2 + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.19);
    osc.start(now + i * 0.2);
    osc.stop(now + i * 0.2 + 0.2);
  }
};
