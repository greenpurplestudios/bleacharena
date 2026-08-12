import konArt from "@/assets/brand/kon_kiosk.png.asset.json";
import { useI18n } from "@/lib/i18n";

const L = {
  role: { en: "Kiosk keeper", ar: "حارس الكشك" },
  title: { en: "Kon's Kiosk", ar: "كشك كون" },
  greeting: {
    en: "\u201cHey hey! Fresh packs, still warm — don't just stand there, tear one open already!\u201d",
    ar: "\u201cهاي هاي! حزم طازجة، لا تقف هكذا، افتح واحدة بسرعة!\u201d",
  },
  name: { en: "— Kon", ar: "— كون" },
};

export function KonHero({ children }: { children?: React.ReactNode }) {
  const { locale } = useI18n();
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12100e] via-card/80 to-[#1b1512] p-5 shadow-2xl backdrop-blur-md sm:p-7"
      style={{ animation: "card-in 0.45s ease-out both" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_80%_at_80%_0%,color-mix(in_oklab,var(--color-primary)_25%,transparent),transparent_70%)]" />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:gap-6">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{L.role[locale]}</p>
          <h1 className="mt-1 font-display text-3xl font-black text-glow-orange sm:text-5xl">{L.title[locale]}</h1>
          <p className="mt-3 max-w-md rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {L.greeting[locale]}
            <span className="mt-1 block text-[10px] uppercase tracking-[0.3em] text-primary/80">{L.name[locale]}</span>
          </p>
          {children}
        </div>
        <img
          src={konArt.url}
          alt={L.title[locale]}
          loading="lazy"
          className="h-40 w-24 shrink-0 self-end object-contain object-bottom drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] sm:h-64 sm:w-40"
        />
      </div>
    </section>
  );
}
