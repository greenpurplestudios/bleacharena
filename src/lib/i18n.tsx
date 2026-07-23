import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/types/character";

export const dict = {
  brand: { en: "Bleach Arena", ar: "بليتش أرينا" },
  brandDraft: { en: "Bleach Draft", ar: "بليتش درافت" },
  tagline: {
    en: "Forge your Gotei. Answer the call of Reiatsu.",
    ar: "اصنع فرقتك. لبِّ نداء الرياتسو.",
  },
  startDraft: { en: "Start Draft", ar: "ابدأ الاختيار" },
  howItWorks: { en: "How it works", ar: "كيف يعمل" },
  step1: { en: "One character appears at a time.", ar: "تظهر شخصية واحدة في كل مرة." },
  step2: { en: "Add to team or skip — you get 5 skips.", ar: "أضف إلى الفريق أو تخطَّ — لديك ٥ تخطيات." },
  step3: { en: "Fill 5 slots to reveal your team score.", ar: "املأ ٥ خانات لتكشف عن تقييم فريقك." },
  home: { en: "Home", ar: "الرئيسية" },
  draft: { en: "Draft", ar: "الاختيار" },
  quotes: { en: "Who Said That", ar: "من قال ذلك" },
  leaderboard: { en: "Leaderboard", ar: "المتصدرون" },
  menu: { en: "Menu", ar: "القائمة" },
  close: { en: "Close", ar: "إغلاق" },
  gameModes: { en: "Game Modes", ar: "أوضاع اللعب" },
  chooseYourGame: { en: "Choose Your Battle", ar: "اختر معركتك" },
  bleachDraftDesc: { en: "Draft a 5-slot dream team.", ar: "اختر فريق أحلامك من ٥ خانات." },
  whoSaidThatDesc: { en: "Guess who said the quote.", ar: "خمّن قائل الاقتباس." },
  leaderboardDesc: { en: "See the top players this week.", ar: "شاهد أفضل اللاعبين هذا الأسبوع." },
  followUsDesc: { en: "Follow GreenPurpleStudios.", ar: "تابع GreenPurpleStudios." },
  play: { en: "Play", ar: "العب" },
  view: { en: "View", ar: "عرض" },
  weeklyLeaderboard: { en: "Weekly Leaderboard", ar: "المتصدرون الأسبوعيون" },
  weekOf: { en: "Week of", ar: "أسبوع" },
  resetsWeekly: { en: "Resets every week", ar: "يُعاد كل أسبوع" },
  emptyBoard: { en: "Be the first to claim the top spot.", ar: "كن أول من يعتلي القمة." },
  loadingBoard: { en: "Loading leaderboard…", ar: "جاري التحميل…" },
  you: { en: "You", ar: "أنت" },
  score: { en: "Score", ar: "النتيجة" },
  username: { en: "Username", ar: "اسم المستخدم" },
  changeUsername: { en: "Change Username", ar: "غيّر الاسم" },
  saveUsername: { en: "Save", ar: "حفظ" },
  chooseUsername: { en: "Choose Your Warrior Name", ar: "اختر اسم محاربك" },
  chooseUsernameDesc: {
    en: "Your name will appear on the leaderboard. 2-20 letters, numbers, - or _.",
    ar: "سيظهر اسمك في قائمة المتصدرين. ٢-٢٠ حرف/رقم/شرطة.",
  },
  usernamePlaceholder: { en: "e.g. IchigoFan99", ar: "مثال: IchigoFan99" },
  usernameTaken: { en: "That name is taken.", ar: "هذا الاسم مأخوذ." },
  usernameInvalidChars: { en: "Only letters, numbers, - and _.", ar: "أحرف وأرقام و - و _ فقط." },
  usernameInvalidLength: { en: "2 to 20 characters.", ar: "من ٢ إلى ٢٠ حرفاً." },
  usernameSaved: { en: "Saved!", ar: "تم الحفظ!" },
  scoreSubmitted: { en: "New personal best submitted!", ar: "تم إرسال أفضل نتيجة لك!" },
  scoreNotImproved: { en: "You already have a better score this week.", ar: "لديك نتيجة أفضل هذا الأسبوع." },
  viewLeaderboard: { en: "View Leaderboard", ar: "عرض المتصدرين" },
  website: { en: "Our Website", ar: "موقعنا" },
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
  followUs: { en: "Follow Us", ar: "تابعنا" },
  madeBy: { en: "Made by GreenPurpleStudios", ar: "من صنع GreenPurpleStudios" },
  studioAccount: { en: "Studio Instagram", ar: "إنستغرام الاستوديو" },
  personalAccount: { en: "Personal Instagram", ar: "إنستغرام شخصي" },
  emailUs: { en: "Email Us", ar: "راسلنا" },
  followTagline: {
    en: "Follow GreenPurpleStudios for more Bleach and anime projects.",
    ar: "تابع GreenPurpleStudios لمزيد من مشاريع بليتش والأنمي.",
  },
  quotesTitle: { en: "Who Said That?", ar: "من قال ذلك؟" },
  quotesTagline: {
    en: "Three quotes. Five choices each. Prove you know Bleach.",
    ar: "ثلاث اقتباسات. خمسة خيارات لكل واحد. أثبت أنك تعرف بليتش.",
  },
  startQuiz: { en: "Start Quiz", ar: "ابدأ اللعبة" },
  question: { en: "Question", ar: "سؤال" },
  correct: { en: "Correct!", ar: "صحيح!" },
  wrong: { en: "Wrong", ar: "خطأ" },
  answerWas: { en: "Answer:", ar: "الإجابة:" },
  next: { en: "Next", ar: "التالي" },
  finish: { en: "See Result", ar: "شاهد النتيجة" },
  yourScore: { en: "Your Score", ar: "نتيجتك" },
  tryAgain: { en: "Try Again", ar: "حاول مجدداً" },
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