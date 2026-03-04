export const getAudioCtx = () => {
  if (!(window as any).audioCtx) {
    (window as any).audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).audioCtx as AudioContext;
};

export const playScreamer = (volume: number) => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 1.5; // Loud
    gain.connect(ctx.destination);

    // White noise burst
    const bufferSize = ctx.sampleRate * 1; // 1 second
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Bandpass filter for harshness
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    
    noise.connect(filter);
    filter.connect(gain);
    noise.start();
    
    // Dissonant oscillators
    [600, 1100, 2300].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + 0.8);
      osc.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    });

    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playSuccess = (volume: number) => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 0.8;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.5);
    
    osc.connect(gain);
    osc.start();
    
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playClick = (volume: number) => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = (volume / 100) * 0.3;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    osc.start();
    
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio error", e);
  }
};
