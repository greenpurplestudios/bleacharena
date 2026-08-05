// Lightweight Web Audio SFX system with persistent user preferences.
// No audio assets — tones are synthesized in-browser so the PWA stays tiny.

export type SfxKind =
  | "tap"
  | "press"
  | "sword"
  | "whoosh"
  | "reveal"
  | "pick"
  | "skip"
  | "success"
  | "error"
  | "rare"
  | "flip";

const PREFS_KEY = "ba:sound-prefs";

export interface SoundPrefs {
  sfx: boolean;
  music: boolean;
  volume: number; // 0..1
  ambient?: boolean;
  /** Cards start face-down and flip to reveal. */
  flipReveal?: boolean;
  /** Vibration feedback on supported devices. */
  haptics?: boolean;
}

const defaults: SoundPrefs = {
  sfx: true, music: false, volume: 0.6, ambient: true,
  flipReveal: true, haptics: true,
};

export function loadPrefs(): SoundPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function savePrefs(p: SoundPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
  window.dispatchEvent(new CustomEvent("ba:sound-prefs", { detail: p }));
}

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** A tone that glides between two pitches — used for swells and risers. */
function sweep(from: number, to: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + Math.min(0.08, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Filtered white noise — paper/air textures for flips and impacts. */
function noise(dur: number, gain: number, freq: number, q: number, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.setValueAtTime(freq, t0);
  filt.Q.setValueAtTime(q, t0);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export function play(kind: SfxKind) {
  const prefs = loadPrefs();
  if (!prefs.sfx) return;
  const v = prefs.volume;
  switch (kind) {
    case "tap":
      tone(660, 0.06, "triangle", 0.08 * v); break;
    case "press":
      tone(300, 0.05, "triangle", 0.09 * v);
      tone(900, 0.07, "sine", 0.05 * v, 0.02);
      break;
    case "sword":
      // Quick metallic slash: bright high partials decaying fast.
      tone(2200, 0.09, "sawtooth", 0.035 * v);
      tone(3300, 0.07, "square", 0.02 * v, 0.01);
      tone(1400, 0.14, "triangle", 0.03 * v, 0.02);
      break;
    case "whoosh":
      // Spiritual-pressure swell.
      tone(180, 0.4, "sine", 0.05 * v);
      tone(240, 0.5, "sine", 0.04 * v, 0.05);
      break;
    case "reveal":
      tone(520, 0.12, "sine", 0.1 * v);
      tone(780, 0.15, "sine", 0.09 * v, 0.06);
      break;
    case "pick":
      tone(440, 0.09, "square", 0.06 * v);
      tone(660, 0.11, "square", 0.06 * v, 0.05);
      tone(880, 0.14, "square", 0.05 * v, 0.1);
      break;
    case "skip":
      tone(330, 0.08, "sawtooth", 0.05 * v); break;
    case "success":
      [523, 659, 784, 1046].forEach((f, i) =>
        tone(f, 0.18, "sine", 0.09 * v, i * 0.08),
      );
      break;
    case "error":
      tone(160, 0.2, "sawtooth", 0.09 * v); break;
    case "rare":
      // Long shimmering flourish for mythic/legendary pulls.
      [392, 523, 659, 784, 987, 1174].forEach((f, i) =>
        tone(f, 0.35, "sine", 0.08 * v, i * 0.06),
      );
      break;
    case "flip":
      // Card leaving the hand: a short paper swish with a soft landing.
      noise(0.16, 0.05 * v, 2600, 1.1);
      noise(0.1, 0.035 * v, 900, 1.4, 0.16);
      tone(220, 0.08, "triangle", 0.05 * v, 0.24);
      break;
  }
}

/* ---------- Rarity reveal stings ---------- */

export type RarityKey = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

/**
 * Premium reveal sting per rarity. Each tier adds layers — Mythic is the most
 * cinematic (riser, choir-like stack, impact and a long shimmering tail).
 */
export function playReveal(rarity: RarityKey) {
  const prefs = loadPrefs();
  if (!prefs.sfx) return;
  const v = prefs.volume;
  switch (rarity) {
    case "common":
      tone(440, 0.14, "sine", 0.07 * v);
      tone(660, 0.16, "sine", 0.05 * v, 0.06);
      break;
    case "uncommon":
      [523, 659, 784].forEach((f, i) => tone(f, 0.2, "sine", 0.07 * v, i * 0.06));
      noise(0.18, 0.02 * v, 4200, 1.2, 0.1);
      break;
    case "rare":
      sweep(260, 620, 0.28, "triangle", 0.05 * v);
      [587, 740, 880].forEach((f, i) => tone(f, 0.3, "sine", 0.08 * v, 0.16 + i * 0.07));
      noise(0.25, 0.025 * v, 5200, 1.1, 0.18);
      break;
    case "epic":
      sweep(200, 900, 0.42, "sawtooth", 0.035 * v);
      tone(110, 0.5, "sine", 0.09 * v, 0.34);
      [622, 784, 932, 1245].forEach((f, i) => tone(f, 0.45, "sine", 0.075 * v, 0.36 + i * 0.07));
      noise(0.4, 0.03 * v, 6000, 0.9, 0.34);
      break;
    case "legendary":
      sweep(160, 1200, 0.7, "sawtooth", 0.04 * v);
      noise(0.5, 0.045 * v, 3000, 0.7, 0.62);
      tone(82, 0.9, "sine", 0.11 * v, 0.62);
      [523, 659, 784, 988, 1319].forEach((f, i) =>
        tone(f, 0.8, "sine", 0.075 * v, 0.66 + i * 0.08),
      );
      [1568, 2093].forEach((f, i) => tone(f, 0.6, "triangle", 0.03 * v, 1.1 + i * 0.12));
      break;
    case "mythic":
      // Cinematic: long riser, sub impact, choir stack, bell tail.
      sweep(120, 1600, 1.1, "sawtooth", 0.045 * v);
      sweep(90, 1400, 1.1, "square", 0.018 * v, 0.05);
      noise(0.9, 0.05 * v, 2200, 0.6, 1.0);
      tone(55, 1.6, "sine", 0.13 * v, 1.02);
      tone(110, 1.2, "sine", 0.08 * v, 1.02);
      [392, 523, 659, 784, 988, 1175, 1568].forEach((f, i) =>
        tone(f, 1.2, "sine", 0.07 * v, 1.06 + i * 0.07),
      );
      [2093, 2637, 3136].forEach((f, i) => tone(f, 1.0, "triangle", 0.028 * v, 1.6 + i * 0.14));
      break;
  }
}

/* ---------- Ambient bed (no music autoplay; user opt-in) ---------- */

let ambientNodes: { osc: OscillatorNode[]; gain: GainNode } | null = null;

export function stopAmbient() {
  if (!ambientNodes) return;
  const c = getCtx();
  const { osc, gain } = ambientNodes;
  ambientNodes = null;
  if (!c) return;
  gain.gain.cancelScheduledValues(c.currentTime);
  gain.gain.setTargetAtTime(0, c.currentTime, 0.4);
  setTimeout(() => osc.forEach((o) => { try { o.stop(); } catch {} }), 2000);
}

/**
 * Very soft reiatsu hum. Only starts on an explicit user gesture and only
 * when the user's prefs allow it. Never called automatically at page load.
 */
export function startAmbient() {
  const prefs = loadPrefs();
  if (!prefs.sfx && !prefs.music) return;
  if (prefs.ambient === false) return;
  if (ambientNodes) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.018 * prefs.volume, c.currentTime + 2.5);
  gain.connect(c.destination);
  const osc = [110, 164.81, 220].map((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, c.currentTime);
    const g = c.createGain();
    g.gain.setValueAtTime(i === 0 ? 1 : 0.35, c.currentTime);
    o.connect(g).connect(gain);
    o.start();
    return o;
  });
  ambientNodes = { osc, gain };
}

export function syncAmbientToPrefs() {
  const prefs = loadPrefs();
  if (prefs.music && prefs.ambient !== false) startAmbient();
  else stopAmbient();
}
/* ---------- Soul Duel ---------- */

/** Signature battlefield reveal: gate riser, stone impact and a bell shimmer. */
export function playBattlefieldReveal() {
  const prefs = loadPrefs();
  if (!prefs.sfx) return;
  const v = prefs.volume;
  sweep(90, 900, 0.85, "sawtooth", 0.035 * v);
  noise(0.45, 0.05 * v, 1800, 0.7, 0.72);
  tone(62, 1.3, "sine", 0.12 * v, 0.74);
  [392, 587, 784, 1175].forEach((f, i) => tone(f, 0.9, "sine", 0.06 * v, 0.8 + i * 0.07));
  [1568, 2093].forEach((f, i) => tone(f, 0.8, "triangle", 0.025 * v, 1.25 + i * 0.13));
}

/** Card landing on a battlefield. */
export function playDuelPlace() {
  const prefs = loadPrefs();
  if (!prefs.sfx) return;
  const v = prefs.volume;
  noise(0.12, 0.045 * v, 2400, 1.1);
  tone(180, 0.16, "triangle", 0.07 * v, 0.05);
}

/** Round resolution stinger. */
export function playDuelClash() {
  const prefs = loadPrefs();
  if (!prefs.sfx) return;
  const v = prefs.volume;
  tone(2400, 0.08, "sawtooth", 0.03 * v);
  tone(1500, 0.14, "triangle", 0.035 * v, 0.03);
  tone(140, 0.3, "sine", 0.08 * v, 0.06);
}
