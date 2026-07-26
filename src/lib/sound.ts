// Lightweight Web Audio SFX system with persistent user preferences.
// No audio assets — tones are synthesized in-browser so the PWA stays tiny.

export type SfxKind =
  | "tap"
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
}

const defaults: SoundPrefs = { sfx: true, music: false, volume: 0.6 };

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