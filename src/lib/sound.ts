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
  | "rare";

const PREFS_KEY = "ba:sound-prefs";

export interface SoundPrefs {
  sfx: boolean;
  music: boolean;
  volume: number; // 0..1
  ambient?: boolean;
}

const defaults: SoundPrefs = { sfx: true, music: false, volume: 0.6, ambient: true };

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