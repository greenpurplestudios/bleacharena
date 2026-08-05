import { memo, type ReactElement } from "react";
import { useI18n } from "@/lib/i18n";
import { STATUS_DEFS, type StatusInstance, type StatusKind } from "@/lib/soul-duel/status";

const PATHS: Record<StatusKind, ReactElement> = {
  burn: (
    <path d="M12 2c1.5 3.4.4 5.2-1 6.8-1.7 2-3.6 3.6-3.6 6.6A4.6 4.6 0 0 0 12 20a4.6 4.6 0 0 0 4.6-4.6c0-2.3-1.1-3.7-2.2-5.3-.5.9-1.2 1.5-2 1.8.6-3.4 1-6.3-.4-9.9Z" />
  ),
  freeze: (
    <path d="M12 2v20M4.2 6.5l15.6 9M19.8 6.5l-15.6 9M12 6.6l-2.2-2M12 6.6l2.2-2M12 17.4l-2.2 2M12 17.4l2.2 2" />
  ),
  shield: (
    <path d="M12 2.5 4.5 5.6v6c0 4.5 3.1 8.4 7.5 9.9 4.4-1.5 7.5-5.4 7.5-9.9v-6L12 2.5Z" />
  ),
};

const ANIMATION: Record<StatusKind, string> = {
  burn: "status-flicker 1.4s ease-in-out infinite",
  freeze: "status-shimmer 2.2s ease-in-out infinite",
  shield: "status-pulse 2s ease-in-out infinite",
};

/** One premium status icon with its remaining-duration ring. */
export const StatusIcon = memo(function StatusIcon({
  status,
  size = 14,
  showDuration = true,
}: {
  status: StatusInstance;
  size?: number;
  showDuration?: boolean;
}) {
  const { locale, t } = useI18n();
  const def = STATUS_DEFS[status.kind];
  const filled = status.kind !== "freeze";

  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full border"
      title={`${def.name[locale]} — ${def.description[locale]} (${status.remaining} ${t("sdRounds")})`}
      aria-label={def.name[locale]}
      style={{
        width: size + 6,
        height: size + 6,
        borderColor: def.color,
        background: "rgba(0,0,0,0.72)",
        boxShadow: `0 0 8px -2px ${def.color}`,
        animation: ANIMATION[status.kind],
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={filled ? def.color : "none"}
        stroke={def.color}
        strokeWidth={filled ? 0 : 1.6}
        strokeLinecap="round"
        aria-hidden
      >
        {PATHS[status.kind]}
      </svg>
      {showDuration ? (
        <span
          className="absolute -bottom-1 -end-1 flex h-3 min-w-3 items-center justify-center rounded-full px-[2px] font-display text-[7px] font-black leading-none text-black"
          style={{ background: def.color }}
        >
          {status.remaining}
        </span>
      ) : null}
    </span>
  );
});

/** Stack of every active status on a card. */
export function StatusBadges({
  statuses,
  size = 14,
  className = "",
}: {
  statuses: StatusInstance[];
  size?: number;
  className?: string;
}) {
  if (!statuses.length) return null;
  return (
    <span className={`flex flex-wrap items-center gap-1 ${className}`}>
      {statuses.map((s) => (
        <StatusIcon key={s.kind} status={s} size={size} />
      ))}
    </span>
  );
}
