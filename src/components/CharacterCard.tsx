import type { Character } from "@/types/character";
import { RARITY_COLOR, RARITY_LABEL } from "@/lib/rarity";
import { useI18n } from "@/lib/i18n";

export function CharacterCard({ character }: { character: Character }) {
  const { locale, t } = useI18n();
  const c = character;
  const color = RARITY_COLOR[c.rarity];
  const initials = c.name.en
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <div
      className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-card p-5 backdrop-blur-xl"
      style={{
        animation: "card-in 0.5s ease-out both",
        boxShadow: `0 30px 80px -30px ${color}, 0 0 0 1px ${color} inset`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            color,
            background: color.replace(")", " / 0.12)"),
            border: `1px solid ${color.replace(")", " / 0.4)")}`,
          }}
        >
          {RARITY_LABEL[c.rarity][locale]}
        </span>
        <span className="text-xs text-muted-foreground">#{c.id}</span>
      </div>

      <div
        className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10"
        style={{
          background:
            `radial-gradient(circle at 30% 20%, ${color.replace(")", " / 0.35)")}, transparent 60%),` +
            "linear-gradient(160deg, oklch(0.2 0.02 260), oklch(0.12 0.02 260))",
        }}
      >
        {c.image ? (
          <img
            src={c.image}
            alt={c.name[locale]}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            <span
              className="font-display text-6xl font-black"
              style={{ color, textShadow: `0 0 24px ${color}` }}
            >
              {initials}
            </span>
            <span className="max-w-[80%] text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("reiatsu")}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,transparent_40%,oklch(0.1_0.01_260/0.9)_100%)]" />
      </div>

      <div className="mt-4">
        <h3 className="font-display text-2xl font-bold leading-tight">{c.name[locale]}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {c.race ?? "—"} · {c.faction ?? "—"}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {c.division && <MetaRow k={t("division")} v={c.division} />}
        {c.rank && <MetaRow k={t("rankLabel")} v={c.rank} />}
        {c.arc && <MetaRow k={t("arc")} v={c.arc} />}
        {c.shikai && <MetaRow k={t("shikai")} v={c.shikai} />}
        {c.bankai && <MetaRow k={t("bankai")} v={c.bankai} />}
        <MetaRow k={t("overall")} v={String(c.overall)} highlight />
      </dl>
    </div>
  );
}

function MetaRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5">
      <dt className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd
        className={
          "truncate text-right text-xs font-semibold " +
          (highlight ? "text-primary" : "text-foreground")
        }
      >
        {v}
      </dd>
    </div>
  );
}