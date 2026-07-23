import { useEffect, useState } from "react";

const EVENT = "bleach-arena:easter-egg";
let count = 0;

export function notifyLogoClick() {
  count += 1;
  if (count >= 21) {
    count = 0;
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function EasterEggHeart() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onFire = () => {
      setVisible(true);
      window.setTimeout(() => setVisible(false), 10000);
    };
    window.addEventListener(EVENT, onFire);
    return () => window.removeEventListener(EVENT, onFire);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at center, rgba(0,0,0,0.6), rgba(0,0,0,0.9))",
        animation: "egg-fade 10s ease-in-out both",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-[70vmin] w-[70vmin]"
        style={{ animation: "egg-beat 1.1s ease-in-out infinite" }}
      >
        <defs>
          <linearGradient id="gp-heart" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="gp-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M50 88 C 20 66, 8 46, 18 30 C 26 18, 42 20, 50 34 C 58 20, 74 18, 82 30 C 92 46, 80 66, 50 88 Z"
          fill="url(#gp-heart)"
          filter="url(#gp-glow)"
        />
      </svg>
      <style>{`
        @keyframes egg-fade {
          0% { opacity: 0; }
          8% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes egg-beat {
          0%,100% { transform: scale(1); }
          25% { transform: scale(1.12); }
          50% { transform: scale(0.96); }
          75% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}