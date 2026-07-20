import { useEffect, useState } from "react";

export function StatBar({
  label,
  value,
  delay = 0,
  accent = "primary",
}: {
  label: string;
  value: number;
  delay?: number;
  accent?: "primary" | "accent";
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setShown(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  const color =
    accent === "accent" ? "oklch(0.82 0.12 220)" : "oklch(0.75 0.18 55)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {shown}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-[1400ms] ease-out"
          style={{
            width: `${shown}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color.replace(")", " / 0.6)")} 100%)`,
            boxShadow: `0 0 18px -2px ${color}`,
          }}
        />
      </div>
    </div>
  );
}