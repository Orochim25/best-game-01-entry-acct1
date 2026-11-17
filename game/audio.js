// LUMENFALL — sound. Every effect and the music loop are synthesized with
// WebAudio in code; no audio files exist. Safe to call before any user gesture:
// the context is created lazily and stays silent until it can run.
let ctx = null;
let master = null;
let musicTimer = null;
let musicOn = false;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, slideTo = null, delay = 0) {
  if (muted) return;
  const c = ensureCtx();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol, filterFreq, delay = 0) {
  if (muted) return;
  const c = ensureCtx();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export const sfx = {
  shoot() { tone(720 + Math.random() * 160, 0.07, 'square', 0.05, 420); },
  storm() { tone(1200, 0.09, 'sawtooth', 0.06, 240); noise(0.08, 0.05, 3200); },
  mortar() { tone(180, 0.16, 'sine', 0.12, 60); noise(0.12, 0.08, 900); },
  frost() { tone(980, 0.18, 'sine', 0.05, 1400); },
  hit() { tone(220, 0.05, 'triangle', 0.04, 160); },
  die() { tone(320, 0.16, 'triangle', 0.08, 70); noise(0.1, 0.04, 1400); },
  coin() { tone(1180, 0.07, 'sine', 0.07); tone(1560, 0.12, 'sine', 0.06, null, 0.06); },
  build() { tone(420, 0.1, 'triangle', 0.1, 640); tone(640, 0.14, 'triangle', 0.08, null, 0.08); },
  upgrade() { tone(520, 0.1, 'triangle', 0.09, 780); tone(780, 0.1, 'triangle', 0.09, null, 0.09); tone(1040, 0.16, 'triangle', 0.09, null, 0.18); },
  sell() { tone(660, 0.1, 'sine', 0.07, 440); },
  leak() { tone(200, 0.4, 'sawtooth', 0.14, 60); noise(0.3, 0.1, 500); },
  waveStart() { tone(392, 0.14, 'triangle', 0.1); tone(523, 0.2, 'triangle', 0.1, null, 0.12); },
  waveClear() { tone(523, 0.12, 'triangle', 0.09); tone(659, 0.12, 'triangle', 0.09, null, 0.1); tone(784, 0.22, 'triangle', 0.1, null, 0.2); },
  ability() { tone(880, 0.2, 'sine', 0.1, 1760); noise(0.25, 0.05, 5000); },
  boss() { tone(110, 0.6, 'sawtooth', 0.16, 55); tone(165, 0.6, 'sawtooth', 0.1, 82, 0.1); },
  victory() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, null, i * 0.14)); },
  defeat() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'triangle', 0.1, null, i * 0.16)); },
  click() { tone(900, 0.04, 'sine', 0.05); },
  error() { tone(180, 0.12, 'square', 0.06, 140); },
};

// A slow minor-key lullaby for the lighthouse: a bass note, a fifth, and a
// wandering arpeggio, looped on a quiet timer. Starts on first user gesture.
const BASS = [110, 87.31, 98, 110, 130.81, 98, 87.31, 110];
const ARP = [
  [220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63],
  [196, 246.94, 293.66, 392], [220, 261.63, 329.63, 440],
  [261.63, 329.63, 392, 493.88], [196, 246.94, 293.66, 392],
  [174.61, 220, 261.63, 329.63], [220, 277.18, 329.63, 440],
];

export function startMusic() {
  if (musicOn) return;
  const c = ensureCtx();
  if (!c) return;
  musicOn = true;
  let bar = 0;
  const step = () => {
    if (!musicOn) return;
    if (!muted && c.state === 'running') {
      const b = BASS[bar % BASS.length];
      tone(b, 1.9, 'sine', 0.055);
      tone(b * 1.5, 1.9, 'sine', 0.03);
      const arp = ARP[bar % ARP.length];
      arp.forEach((f, i) => tone(f, 0.5, 'triangle', 0.028, null, i * 0.22));
    }
    bar++;
    musicTimer = setTimeout(step, 950);
  };
  step();
}

export function stopMusic() {
  musicOn = false;
  if (musicTimer) clearTimeout(musicTimer);
  musicTimer = null;
}
