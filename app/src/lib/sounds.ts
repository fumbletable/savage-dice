// Tiny Web Audio synth for dice feedback — no asset files needed

let ctx: AudioContext | null = null;
function audio(): AudioContext {
  if (!ctx) {
    const C = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, gain = 0.15, type: OscillatorType = 'sine') {
  const c = audio();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

function noise(start: number, duration: number, gain = 0.1) {
  const c = audio();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(c.currentTime + start);
}

export const sounds = {
  shake() {
    noise(0, 0.3, 0.08);
  },
  ace() {
    // bright bell: two high tones
    tone(880, 0, 0.25, 0.12, 'triangle');
    tone(1320, 0.05, 0.3, 0.08, 'triangle');
  },
  success() {
    // C → E (happy upward)
    tone(523, 0, 0.12, 0.1, 'sine');
    tone(659, 0.1, 0.2, 0.1, 'sine');
  },
  raise() {
    // C → E → G (triumphant)
    tone(523, 0, 0.1, 0.1, 'triangle');
    tone(659, 0.08, 0.1, 0.1, 'triangle');
    tone(784, 0.16, 0.25, 0.12, 'triangle');
  },
  fail() {
    // minor descending
    tone(392, 0, 0.15, 0.08, 'sine');
    tone(330, 0.12, 0.25, 0.08, 'sine');
  },
  crit() {
    // dissonant low rumble
    tone(110, 0, 0.4, 0.15, 'sawtooth');
    tone(116, 0, 0.4, 0.12, 'sawtooth');
    noise(0.05, 0.35, 0.06);
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
