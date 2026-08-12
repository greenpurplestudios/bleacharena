/** Shared keyframes for the Kon's Kiosk pack objects (scoped here so we don't touch global styles.css). */
export function PackKeyframes() {
  return (
    <style>{`
      @keyframes pack-float {
        0%, 100% { transform: translateY(0) rotate(-1.2deg); }
        50% { transform: translateY(-8px) rotate(1.2deg); }
      }
      @keyframes pack-shine {
        0% { transform: translateX(-40%) rotate(12deg); opacity: 0; }
        10% { opacity: 0.9; }
        45% { transform: translateX(220%) rotate(12deg); opacity: 0; }
        100% { transform: translateX(220%) rotate(12deg); opacity: 0; }
      }
      @keyframes pack-burst {
        0% { opacity: 0; transform: scale(0.4); }
        35% { opacity: 1; transform: scale(1.4); }
        100% { opacity: 0; transform: scale(2.2); }
      }
    `}</style>
  );
}
