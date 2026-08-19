import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SceneBackground } from "@/components/SceneBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";
import { getMyProfileFull } from "@/lib/progression";
import { equipItem, fetchMyInventory, type InventoryItem } from "@/lib/store";
import { NameFrame, NAME_FRAMES } from "@/components/NameFrame";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/customisations")({
  head: () => ({
    meta: [
      { title: "Customisations — Bleach Arena" },
      { name: "description", content: "Equip your titles, username colors and name frames in one place." },
      { property: "og:title", content: "Bleach Arena — Customisations" },
      { property: "og:description", content: "All your cosmetics: titles, name colors and frames." },
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
    en: "Every cosmetic you own lives here — titles, username colors and name frames.",
    ar: "كل ما تملكه من تجميليات هنا — الألقاب وألوان الاسم وإطارات الاسم.",
  },
  preview: { en: "Preview", ar: "معاينة" },
} as const;

type Profile = {
  username: string | null;
  title?: string | null;
  username_color?: string | null;
  name_frame?: string | null;
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

  const doEquip = async (
    kind: "title" | "username_color" | "name_frame",
    itemId: string | null,
  ) => {
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

  const titles = (inventory ?? []).filter((i) => i.kind === "title");
  const colors = (inventory ?? []).filter((i) => i.kind === "username_color");
  const frames = (inventory ?? []).filter((i) => i.kind === "name_frame" && NAME_FRAMES[i.itemId]);

  const name = p?.username ?? "—";

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
          <NameFrame frame={p?.name_frame ?? null}>
            <span
              className="font-display text-2xl font-black"
              style={p?.username_color ? { color: p.username_color } : undefined}
            >
              {name}
            </span>
          </NameFrame>
          {p?.title ? (
            <div className="mt-2 text-xs uppercase tracking-widest text-accent">{p.title}</div>
          ) : null}
        </section>

        <div className="mt-6 space-y-6">
          {/* Titles */}
          <Card
            heading={t("titles")}
            action={
              <Link
                to="/store"
                className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/20"
              >
                {t("goToStore")}
              </Link>
            }
          >
            {titles.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noCosmetics")}</p>
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
              <p className="text-xs text-muted-foreground">{t("noCosmetics")}</p>
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

          {/* Name frames */}
          <Card heading={t("nameFrame")}>
            {frames.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noCosmetics")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {frames.map((f) => {
                  const active = p?.name_frame === f.itemId;
                  return (
                    <button
                      key={f.itemId}
                      disabled={busy}
                      onClick={() => doEquip("name_frame", active ? null : f.itemId)}
                      className={`rounded-xl border p-2 transition-colors disabled:opacity-50 ${
                        active ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <NameFrame frame={f.itemId}>
                        <span className="font-display text-sm font-bold">{name}</span>
                      </NameFrame>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {active ? t("unequip") : t("equip")}
                      </div>
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
