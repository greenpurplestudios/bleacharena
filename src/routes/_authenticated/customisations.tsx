import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SceneBackground } from "@/components/SceneBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";
import { getMyProfileFull } from "@/lib/progression";
import { equipItem, fetchMyInventory, type EquipKind, type InventoryItem } from "@/lib/store";
import { NameFrame, NameEffect, ALL_NAME_FRAMES } from "@/components/NameFrame";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import {
  LEADERBOARD_STYLES, NAME_EFFECTS, PROFILE_BADGES, PROFILE_FRAMES,
  RARITY_COLOR, RARITY_LABEL, type Rarity,
} from "@/lib/cosmetics";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/customisations")({
  head: () => ({
    meta: [
      { title: "Customisations — Bleach Arena" },
      { name: "description", content: "Equip your titles, name colors, effects, frames, badges and leaderboard styles in one place." },
      { property: "og:title", content: "Bleach Arena — Customisations" },
      { property: "og:description", content: "All your cosmetics: titles, name colors, effects, frames, badges and leaderboard styles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomisationsPage,
});

const L = {
  title: { en: "Customisations", ar: "التخصيصات" },
  kicker: { en: "Make it yours", ar: "اجعلها لك" },
  desc: {
    en: "Every cosmetic you own lives here — titles, colors, effects, name boxes, profile frames, badges and leaderboard styles.",
    ar: "كل ما تملكه من تجميليات هنا — الألقاب والألوان والتأثيرات وصناديق الاسم وإطارات الملف والشارات وأنماط المتصدرين.",
  },
  preview: { en: "Preview", ar: "معاينة" },
  nameEffects: { en: "Name Effects", ar: "تأثيرات الاسم" },
  nameBoxes: { en: "Name Boxes", ar: "صناديق الاسم" },
  profileFrames: { en: "Profile Frames", ar: "إطارات الملف" },
  badges: { en: "Profile Badges", ar: "شارات الملف" },
  lbStyles: { en: "Leaderboard Styles", ar: "أنماط المتصدرين" },
} as const;

type Profile = {
  username: string | null;
  title?: string | null;
  username_color?: string | null;
  name_frame?: string | null;
  name_effect?: string | null;
  profile_frame?: string | null;
  profile_badge?: string | null;
  leaderboard_style?: string | null;
  avatar_character_id?: string | null;
};

function CustomisationsPage() {
  const { t, locale } = useI18n();
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const loadProfile = async () => setP(((await getMyProfileFull()) ?? null) as Profile | null);
  const loadInventory = async () => setInventory(await fetchMyInventory());

  useEffect(() => {
    loadProfile();
    loadInventory();
  }, []);

  const doEquip = async (kind: EquipKind, itemId: string | null) => {
    if (busy) return;
    setBusy(true);
    const res = await equipItem(kind, itemId);
    setBusy(false);
    if (res.ok) {
      play("pick");
      await loadProfile();
    } else {
      play("skip");
    }
  };

  const inv = inventory ?? [];
  const titles = inv.filter((i) => i.kind === "title");
  const colors = inv.filter((i) => i.kind === "username_color");
  const frames = inv.filter((i) => i.kind === "name_frame" && ALL_NAME_FRAMES[i.itemId]);
  const effects = inv.filter((i) => i.kind === "name_effect" && NAME_EFFECTS[i.itemId]);
  const pFrames = inv.filter((i) => i.kind === "frame" && PROFILE_FRAMES[i.itemId]);
  const badges = inv.filter((i) => i.kind === "profile_badge" && PROFILE_BADGES[i.itemId]);
  const lbStyles = inv.filter((i) => i.kind === "leaderboard_style" && LEADERBOARD_STYLES[i.itemId]);

  const name = p?.username ?? "—";
  const rarityOf = (it: InventoryItem) => (it.meta as { rarity?: Rarity }).rarity;

  const storeLink = (
    <Link
      to="/shop"
      className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/20"
    >
      {t("goToStore")}
    </Link>
  );

  return (
    <>
      <SceneBackground scene="profile" />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div style={{ animation: "card-in 0.5s ease-out both" }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {L.kicker[locale]}
          </span>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
            {L.title[locale]}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{L.desc[locale]}</p>
        </div>

        {/* Live preview */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {L.preview[locale]}
          </p>
          <div className="mb-4 flex justify-center">
            <PlayerAvatar
              characterId={p?.avatar_character_id ?? null}
              frame={p?.profile_frame ?? null}
              badge={p?.profile_badge ?? null}
              size={72}
              fallback={(name[0] ?? "?").toUpperCase()}
            />
          </div>
          <NameFrame frame={p?.name_frame ?? null}>
            <NameEffect
              effect={p?.name_effect ?? null}
              className="font-display text-2xl font-black"
              style={p?.username_color ? { color: p.username_color } : undefined}
            >
              {name}
            </NameEffect>
          </NameFrame>
          {p?.title ? (
            <div className="mt-2 text-xs uppercase tracking-widest text-accent">{p.title}</div>
          ) : null}
          <div
            className={`mt-4 flex items-center gap-3 rounded-xl border px-3 py-2 text-start ${
              LEADERBOARD_STYLES[p?.leaderboard_style ?? ""]?.className ?? "border-white/10"
            }`}
            style={LEADERBOARD_STYLES[p?.leaderboard_style ?? ""]?.style}
          >
            <span className="font-display text-sm font-black text-primary">#1</span>
            <span className="truncate text-sm font-bold">{name}</span>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {/* Titles */}
          <Card heading={t("titles")} action={storeLink}>
            {titles.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="flex flex-wrap gap-2">
                <Chip active={!p?.title} disabled={busy || !p?.title} onClick={() => doEquip("title", null)}>
                  {t("none")}
                </Chip>
                {titles.map((it) => {
                  const eq = p?.title === it.itemId;
                  return (
                    <Chip key={it.itemId} active={eq} disabled={busy} onClick={() => doEquip("title", eq ? null : it.itemId)}>
                      {it.name[locale]} {eq && `· ${t("equipped")}`}
                    </Chip>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Username colors */}
          <Card heading={t("usernameColors")}>
            {colors.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="flex flex-wrap gap-2">
                <Chip active={!p?.username_color} disabled={busy || !p?.username_color} onClick={() => doEquip("username_color", null)}>
                  {t("none")}
                </Chip>
                {colors.map((it) => {
                  const hex = (it.meta as { hex?: string }).hex ?? "#ffffff";
                  const eq = p?.username_color === hex || p?.username_color === it.itemId;
                  return (
                    <Chip key={it.itemId} active={eq} disabled={busy} onClick={() => doEquip("username_color", eq ? null : it.itemId)}>
                      <span aria-hidden className="h-3 w-3 rounded-full border border-white/20" style={{ background: hex }} />
                      <span style={{ color: hex }}>{it.name[locale]}</span>
                      {eq && <span className="text-primary">· {t("equipped")}</span>}
                    </Chip>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Name effects */}
          <Card heading={L.nameEffects[locale]}>
            {effects.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {effects.map((it) => {
                  const active = p?.name_effect === it.itemId;
                  return (
                    <Tile
                      key={it.itemId}
                      active={active}
                      disabled={busy}
                      onClick={() => doEquip("name_effect", active ? null : it.itemId)}
                      label={active ? t("unequip") : t("equip")}
                      rarity={rarityOf(it)}
                      locale={locale}
                    >
                      <NameEffect effect={it.itemId} className="font-display text-base font-black">
                        {name}
                      </NameEffect>
                    </Tile>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Name boxes */}
          <Card heading={L.nameBoxes[locale]}>
            {frames.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {frames.map((f) => {
                  const active = p?.name_frame === f.itemId;
                  return (
                    <Tile
                      key={f.itemId}
                      active={active}
                      disabled={busy}
                      onClick={() => doEquip("name_frame", active ? null : f.itemId)}
                      label={active ? t("unequip") : t("equip")}
                      rarity={rarityOf(f)}
                      locale={locale}
                    >
                      <NameFrame frame={f.itemId}>
                        <span className="font-display text-sm font-bold">{name}</span>
                      </NameFrame>
                    </Tile>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Profile frames */}
          <Card heading={L.profileFrames[locale]}>
            {pFrames.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {pFrames.map((f) => {
                  const active = p?.profile_frame === f.itemId;
                  return (
                    <Tile
                      key={f.itemId}
                      active={active}
                      disabled={busy}
                      onClick={() => doEquip("frame", active ? null : f.itemId)}
                      label={active ? t("unequip") : t("equip")}
                      rarity={rarityOf(f)}
                      locale={locale}
                    >
                      <span className="flex justify-center">
                        <PlayerAvatar
                          characterId={p?.avatar_character_id ?? null}
                          frame={f.itemId}
                          size={46}
                          fallback={(name[0] ?? "?").toUpperCase()}
                        />
                      </span>
                    </Tile>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Badges */}
          <Card heading={L.badges[locale]}>
            {badges.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {badges.map((b) => {
                  const active = p?.profile_badge === b.itemId;
                  const def = PROFILE_BADGES[b.itemId];
                  return (
                    <Tile
                      key={b.itemId}
                      active={active}
                      disabled={busy}
                      onClick={() => doEquip("profile_badge", active ? null : b.itemId)}
                      label={active ? t("unequip") : t("equip")}
                      rarity={rarityOf(b)}
                      locale={locale}
                    >
                      <span
                        className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 font-display text-sm font-black"
                        style={{ color: def.color, boxShadow: `0 0 12px -2px ${def.color}` }}
                      >
                        {def.glyph}
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                        {b.name[locale]}
                      </span>
                    </Tile>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Leaderboard styles */}
          <Card heading={L.lbStyles[locale]}>
            {lbStyles.length === 0 ? (
              <Empty label={t("noCosmetics")} />
            ) : (
              <div className="space-y-2">
                {lbStyles.map((s) => {
                  const active = p?.leaderboard_style === s.itemId;
                  const def = LEADERBOARD_STYLES[s.itemId];
                  return (
                    <button
                      key={s.itemId}
                      disabled={busy}
                      onClick={() => doEquip("leaderboard_style", active ? null : s.itemId)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-start transition-colors disabled:opacity-50 ${def.className} ${
                        active ? "ring-2 ring-primary/60" : ""
                      }`}
                      style={def.style}
                    >
                      <span className="font-display text-sm font-black text-primary">#1</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{name}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {active ? t("unequip") : t("equip")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-xs text-muted-foreground">{label}</p>;
}

function Tile({
  active,
  disabled,
  onClick,
  label,
  rarity,
  locale,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  rarity?: Rarity;
  locale: "en" | "ar";
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border p-2 text-center transition-colors disabled:opacity-50 ${
        active ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      {children}
      <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {rarity ? (
        <div className="text-[9px] uppercase tracking-widest" style={{ color: RARITY_COLOR[rarity] }}>
          {RARITY_LABEL[rarity][locale]}
        </div>
      ) : null}
    </button>
  );
}

function Card({
  heading,
  action,
  children,
}: {
  heading: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 className="text-start font-display text-lg font-bold">{heading}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
        active
          ? "border-primary/60 bg-primary/20 text-primary"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
