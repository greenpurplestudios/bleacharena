import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/types/character";

export const dict = {
  brand: { en: "Bleach Draft", ar: "بليتش درافت" },
  tagline: {
    en: "Forge your Gotei. Answer the call of Reiatsu.",
    ar: "اصنع فرقتك. لبِّ نداء الرياتسو.",
  },
  startDraft: { en: "Start Draft", ar: "ابدأ الاختيار" },
  howItWorks: { en: "How it works", ar: "كيف يعمل" },
  step1: { en: "One character appears at a time.", ar: "تظهر شخصية واحدة في كل مرة." },
  step2: { en: "Add to team or skip — you get 3 skips.", ar: "أضف إلى الفريق أو تخطَّ — لديك ٣ تخطيات." },
  step3: { en: "Fill 5 slots to reveal your team score.", ar: "املأ ٥ خانات لتكشف عن تقييم فريقك." },
  home: { en: "Home", ar: "الرئيسية" },
  draft: { en: "Draft", ar: "الاختيار" },
  team: { en: "Team", ar: "الفريق" },
  slot: { en: "Slot", ar: "خانة" },
  empty: { en: "Empty", ar: "فارغة" },
  add: { en: "Add to Team", ar: "أضف للفريق" },
  skip: { en: "Skip", ar: "تخطَّ" },
  skipsLeft: { en: "Skips left", ar: "التخطيات المتبقية" },
  outOfSkips: { en: "No skips left", ar: "لا تخطيات متبقية" },
  noMore: { en: "No more characters available.", ar: "لا مزيد من الشخصيات." },
  result: { en: "Draft Complete", ar: "اكتمل الاختيار" },
  yourTeam: { en: "Your Team", ar: "فريقك" },
  teamScore: { en: "Team Score", ar: "تقييم الفريق" },
  rank: { en: "Rank", ar: "الرتبة" },
  playAgain: { en: "Play Again", ar: "العب مجدداً" },
  share: { en: "Share Result", ar: "شارك النتيجة" },
  shared: { en: "Copied to clipboard", ar: "تم النسخ" },
  attack: { en: "Attack", ar: "الهجوم" },
  defense: { en: "Defense", ar: "الدفاع" },
  speed: { en: "Speed", ar: "السرعة" },
  reiatsu: { en: "Reiatsu", ar: "الرياتسو" },
  intelligence: { en: "Intelligence", ar: "الذكاء" },
  technique: { en: "Technique", ar: "التقنية" },
  potential: { en: "Potential", ar: "الإمكانات" },
  overall: { en: "Overall", ar: "الإجمالي" },
  race: { en: "Race", ar: "العرق" },
  faction: { en: "Faction", ar: "الانتماء" },
  division: { en: "Division", ar: "الفرقة" },
  rankLabel: { en: "Rank", ar: "المرتبة" },
  arc: { en: "Arc", ar: "القوس" },
  shikai: { en: "Shikai", ar: "الشيكاي" },
  bankai: { en: "Bankai", ar: "البانكاي" },
  language: { en: "Language", ar: "اللغة" },
};

export type TKey = keyof typeof dict;

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: TKey) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "bd:locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "ar") setLocaleState(saved);
    } catch {}
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value = useMemo<I18nCtx>(() => ({
    locale,
    setLocale: (l) => {
      setLocaleState(l);
      try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    },
    t: (k) => dict[k][locale],
    dir,
  }), [locale, dir]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside provider");
  return v;
}