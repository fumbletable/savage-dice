// Procedural dice-clack synth — multiple short percussive impacts to simulate
// dice hitting a surface. No asset files needed.

let ctx: AudioContext | null = null;
function audio(): AudioContext {
  if (!ctx) {
    const C = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One short percussive clack: bandpass-filtered noise burst + short inharmonic
// resonance. Sounds roughly like wood/plastic hitting a hard surface.
function clack(startOffset: number, pitch: number, gain: number) {
  const c = audio();
  const now = c.currentTime + startOffset;

  // Noise burst — the "tick" transient
  const dur = 0.06;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = pitch * 1.5;
  bp.Q.value = 2;
  const g1 = c.createGain();
  g1.gain.setValueAtTime(gain * 0.8, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(bp).connect(g1).connect(c.destination);
  src.start(now);

  // Short resonant tone — the "clack" body
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.04);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(gain * 0.5, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(g2).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

export const sounds = {
  shake() {
    // 3-5 clacks with random timing and pitch — simulates dice bouncing
    const count = 3 + Math.floor(Math.random() * 3);
    let t = 0;
    for (let i = 0; i < count; i++) {
      const pitch = 400 + Math.random() * 500; // 400–900 Hz, random per clack
      const gain = 0.12 + Math.random() * 0.08;
      clack(t, pitch, gain);
      t += 0.04 + Math.random() * 0.08;
    }
  },
};

export type SoundName = keyof typeof sounds;

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  try {
    sounds[name]();
  } catch {
    // audio context failures are non-critical
  }
}
