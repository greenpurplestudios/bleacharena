import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/follow")({
  head: () => ({
    meta: [
      { title: "Follow Us — Bleach Draft" },
      {
        name: "description",
        content:
          "Follow GreenPurpleStudios on Instagram and reach out by email for more Bleach fan projects.",
      },
      { property: "og:title", content: "Follow GreenPurpleStudios" },
      {
        property: "og:description",
        content: "Instagram + email for GreenPurpleStudios, creators of Bleach Draft.",
      },
    ],
  }),
  component: FollowPage,
});

const LINKS = [
  {
    kind: "instagram" as const,
    labelKey: "studioAccount" as const,
    handle: "@greenpurplestudios",
    href: "https://www.instagram.com/greenpurplestudios?igsh=Z3RzeGZ4MjhxY3Fz",
    accent: "oklch(0.7 0.2 300)",
  },
  {
    kind: "instagram" as const,
    labelKey: "personalAccount" as const,
    handle: "@bleach_revived",
    href: "https://www.instagram.com/bleach_revived?igsh=MjBldWY3eGJtcTNr",
    accent: "oklch(0.75 0.19 40)",
  },
  {
    kind: "email" as const,
    labelKey: "emailUs" as const,
    handle: "greenpurplestudios@gmail.com",
    href: "mailto:greenpurplestudios@gmail.com",
    accent: "oklch(0.78 0.16 160)",
  },
];

function FollowPage() {
  const { t } = useI18n();
  return (
    <>
      <ReiatsuBackground count={24} />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-14">
        <div style={{ animation: "card-in 0.6s ease-out both" }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            GreenPurpleStudios
          </span>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">
            {t("followUs")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("followTagline")}
          </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href} style={{ animation: "card-in 0.6s ease-out both" }}>
              <a
                href={l.href}
                target={l.kind === "email" ? undefined : "_blank"}
                rel={l.kind === "email" ? undefined : "noopener noreferrer"}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-md transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: `0 20px 60px -30px ${l.accent}, 0 0 0 1px ${l.accent.replace(")", " / 0.35)")} inset` }}
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-xl font-black"
                  style={{
                    color: l.accent,
                    background: l.accent.replace(")", " / 0.12)"),
                    border: `1px solid ${l.accent.replace(")", " / 0.4)")}`,
                  }}
                >
                  {l.kind === "email" ? "@" : "IG"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t(l.labelKey)}
                  </span>
                  <span className="block truncate font-semibold text-foreground">
                    {l.handle}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="text-muted-foreground transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                >
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}