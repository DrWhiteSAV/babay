let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let oscillators: OscillatorNode[] = [];
let lfos: OscillatorNode[] = [];
let isPlaying = false;

export function startBackgroundMusic(volume: number) {
  if (isPlaying) return;
  
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    setMusicVolume(volume);

    // Create a spooky, dissonant drone
    const baseFreqs = [45, 55, 61.74]; // F1, A1, B1 (dissonant, low)
    
    baseFreqs.forEach((freq, index) => {
      const osc = audioCtx!.createOscillator();
      const lfo = audioCtx!.createOscillator();
      const lfoGain = audioCtx!.createGain();
      
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      
      // Slow modulation for eerie effect
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + Math.random() * 0.1; 
      
      lfoGain.gain.value = 2 + Math.random() * 3; // Pitch variation amount
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(masterGain!);
      
      osc.start();
      lfo.start();
      
      oscillators.push(osc);
      lfos.push(lfo);
    });
    
    isPlaying = true;
  } catch (e) {
    console.error("Audio API error:", e);
  }
}

export function stopBackgroundMusic() {
  if (!isPlaying) return;
  
  oscillators.forEach(osc => {
    try { osc.stop(); osc.disconnect(); } catch (e) {}
  });
  lfos.forEach(lfo => {
    try { lfo.stop(); lfo.disconnect(); } catch (e) {}
  });
  
  oscillators = [];
  lfos = [];
  isPlaying = false;
}

export function setMusicVolume(volume: number) {
  if (masterGain) {
    // Max volume for ambient drone should be low (e.g. 0.2)
    masterGain.gain.value = (volume / 100) * 0.2;
  }
}
