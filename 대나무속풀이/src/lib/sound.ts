// Synthesized sound effects (Web Audio API), inherited from 찻잔 타로. Browser-only; call from handlers/effects.
const KEY = "forest-sound-off";
let ctx: AudioContext | null = null;

export function isSoundOn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) !== "1";
}
export function setSoundOn(on: boolean) {
  localStorage.setItem(KEY, on ? "0" : "1");
}

function ac() {
  if (!isSoundOn()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, vol = 0.06, type: OscillatorType = "sine") {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.05, cutoff = 2500) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const sfx = {
  tap() {
    tone(1320, 0, 0.12, 0.025);
    haptic(8);
  },
  // Gentle paper crackle followed by wind, without screen-shake vibration.
  burn() {
    for (let i = 0; i < 20; i++) noise(0.7 + i * 0.18, 0.09, 0.025, 4000);
    noise(3.8, 1.8, 0.04, 900);
  },
  // Soft wind chime when the reply arrives
  chime() {
    [784, 988, 1175].forEach((f, i) => tone(f, i * 0.12, 1.1, 0.03));
  },
  stamp() {
    noise(0, 0.08, 0.08, 600);
    tone(90, 0, 0.2, 0.08, "triangle");
    haptic(30);
  },
};
