interface Props {
  xp: number;
  xpToNext: number;
  level: number;
  compact?: boolean;
}

export function XPBar({ xp, xpToNext, level, compact }: Props) {
  const pct = xpToNext > 0 ? Math.min(100, (xp / xpToNext) * 100) : 0;
  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-1"}>
      <div className="flex items-center gap-2">
        <span
          className={
            "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-primary/50 bg-primary/15 px-1.5 font-display text-[11px] font-black text-primary"
          }
        >
          {level}
        </span>
        {!compact && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {xp} / {xpToNext} XP
          </span>
        )}
      </div>
      <div className={"h-1.5 overflow-hidden rounded-full bg-white/10 " + (compact ? "w-24" : "w-full")}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}