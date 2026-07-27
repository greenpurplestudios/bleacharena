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
  pwaUpdateMessage: { en: "A new version is available.", ar: "يتوفر إصدار جديد." },
  pwaUpdateAction: { en: "Restart to update", ar: "أعد التشغيل للتحديث" },
  iosInstallTitle: { en: "Install Bleach Arena", ar: "تثبيت بليتش أرينا" },
  iosInstallStep1: { en: "Tap the Share button in Safari.", ar: "اضغط زر المشاركة في سفاري." },
  iosInstallStep2: { en: "Choose 'Add to Home Screen'.", ar: "اختر 'إضافة إلى الشاشة الرئيسية'." },
  installApp: { en: "Install App", ar: "ثبّت التطبيق" },
  dismiss: { en: "Not now", ar: "ليس الآن" },
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
  quiz: { en: "Which Bleach Character Are You?", ar: "أي شخصية بليتش أنت؟" },
  quizShort: { en: "Personality Quiz", ar: "اختبار الشخصية" },
  quizDesc: {
    en: "Answer a few questions and discover your closest Bleach match.",
    ar: "أجب على أسئلة قليلة واكتشف أقرب شخصية بليتش لك.",
  },
  startQuizBtn: { en: "Start", ar: "ابدأ" },
  yourMatch: { en: "Your Match", ar: "شخصيتك" },
  topMatches: { en: "Top Matches", ar: "أقرب المطابقات" },
  matchScore: { en: "Match", ar: "التطابق" },
  retakeQuiz: { en: "Retake Quiz", ar: "أعد الاختبار" },
  ofN: { en: "of", ar: "من" },
  // Rarity system
  mythic: { en: "Mythic", ar: "أسطوري خارق" },
  uncommon: { en: "Uncommon", ar: "غير مألوف" },
  // Settings
  settings: { en: "Settings", ar: "الإعدادات" },
  settingsDesc: { en: "Audio, profile, and preferences.", ar: "الصوت والملف والتفضيلات." },
  audio: { en: "Audio", ar: "الصوت" },
  soundEffects: { en: "Sound Effects", ar: "المؤثرات الصوتية" },
  music: { en: "Music", ar: "الموسيقى" },
  volume: { en: "Volume", ar: "الصوت" },
  profile: { en: "Profile", ar: "الملف الشخصي" },
  on: { en: "On", ar: "تشغيل" },
  off: { en: "Off", ar: "إيقاف" },
  // Draft
  resetDraft: { en: "Reset Draft", ar: "إعادة تعيين" },
  resetDraftConfirm: {
    en: "Reset your current draft and start over?",
    ar: "هل تريد إعادة الاختيار من البداية؟",
  },
  confirm: { en: "Confirm", ar: "تأكيد" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  // Characters gallery
  characters: { en: "Characters", ar: "الشخصيات" },
  charactersDesc: { en: "Browse every fighter in the roster.", ar: "تصفح كل مقاتل في القائمة." },
  searchPlaceholder: { en: "Search by name…", ar: "ابحث بالاسم…" },
  all: { en: "All", ar: "الكل" },
  sortBy: { en: "Sort by", ar: "ترتيب حسب" },
  sortRating: { en: "Rating", ar: "التقييم" },
  sortName: { en: "Name", ar: "الاسم" },
  noResults: { en: "No characters match your filters.", ar: "لا نتائج مطابقة." },
  totalCount: { en: "Total", ar: "الإجمالي" },
  // Leaderboard team
  draftedTeam: { en: "Drafted Team", ar: "الفريق" },
  // Auth
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  or: { en: "or", ar: "أو" },
  authSignIn: { en: "Sign in", ar: "تسجيل الدخول" },
  authSignInDesc: { en: "Welcome back, Shinigami.", ar: "مرحباً بعودتك أيها الشينيغامي." },
  authCreateAccount: { en: "Create account", ar: "إنشاء حساب" },
  authSignUpDesc: { en: "Save your collection, souls and rivals rank forever.", ar: "احفظ مجموعتك وأرواحك ومرتبتك للأبد." },
  authResetPassword: { en: "Reset password", ar: "استعادة كلمة المرور" },
  authResetDesc: { en: "We'll email you a secure reset link.", ar: "سنرسل لك رابط استعادة آمن." },
  authContinueGoogle: { en: "Continue with Google", ar: "المتابعة بجوجل" },
  authRememberMe: { en: "Remember me", ar: "تذكرني" },
  authForgot: { en: "Forgot password?", ar: "نسيت كلمة المرور؟" },
  authHaveAccount: { en: "Already have an account?", ar: "لديك حساب؟" },
  authNewHere: { en: "New here? Create an account", ar: "جديد؟ أنشئ حساباً" },
  authBackToSignIn: { en: "Back to sign in", ar: "العودة لتسجيل الدخول" },
  authSendResetLink: { en: "Send reset link", ar: "أرسل رابط الاستعادة" },
  authCheckEmail: { en: "Check your email to verify your account.", ar: "تحقق من بريدك لتأكيد الحساب." },
  authResetSent: { en: "Check your email for the reset link.", ar: "تحقق من بريدك للحصول على الرابط." },
  authChooseNewPassword: { en: "Choose a new password.", ar: "اختر كلمة مرور جديدة." },
  authOpenFromEmail: { en: "Open this page from the reset link in your email.", ar: "افتح هذه الصفحة من رابط الاستعادة في بريدك." },
  authUpdatePassword: { en: "Update password", ar: "تحديث كلمة المرور" },
  authPasswordUpdated: { en: "Password updated. Redirecting…", ar: "تم التحديث. جاري التحويل…" },
  signOut: { en: "Sign out", ar: "تسجيل الخروج" },
  account: { en: "Account", ar: "الحساب" },
  signIn: { en: "Sign in", ar: "تسجيل الدخول" },
  // Progression: packs, collection, souls
  souls: { en: "Souls", ar: "أرواح" },
  packs: { en: "Packs", ar: "الحزم" },
  packsTitle: { en: "Your Packs", ar: "حزمك" },
  packsDesc: { en: "Open packs from drafts to grow your roster.", ar: "افتح الحزم لتوسيع تشكيلتك." },
  packsEmpty: { en: "No packs yet. Finish a draft with 75+ to earn one.", ar: "لا حزم بعد. أنهِ درافت بـ ٧٥+ لتحصل على واحدة." },
  packsAvailable: { en: "pack(s) ready to open", ar: "حزمة جاهزة للفتح" },
  tapToOpen: { en: "Tap to open", ar: "اضغط للفتح" },
  noPacks: { en: "None yet", ar: "لا يوجد بعد" },
  packOpenError: { en: "Something went wrong opening this pack.", ar: "حدث خطأ أثناء الفتح." },
  newCharacter: { en: "New character unlocked!", ar: "تم فتح شخصية جديدة!" },
  duplicate: { en: "Duplicate", ar: "مكرر" },
  keepOpening: { en: "Continue", ar: "متابعة" },
  packEarned: { en: "You earned a pack", ar: "لقد حصلت على حزمة" },
  openPack: { en: "Open in Packs", ar: "افتح الحزم" },
  collection: { en: "Collection", ar: "المجموعة" },
  collectionTitle: { en: "Your Collection", ar: "مجموعتك" },
  collectionDesc: { en: "Every character you have ever pulled.", ar: "كل شخصية سحبتها من قبل." },
  owned: { en: "Owned", ar: "مملوكة" },
  missing: { en: "Missing", ar: "ناقصة" },
  loading: { en: "Loading…", ar: "جاري التحميل…" },
  // Store & cosmetics
  store: { en: "Store", ar: "المتجر" },
  storeTitle: { en: "Soul Store", ar: "متجر الأرواح" },
  storeDesc: { en: "Spend Souls on titles, colors, and extra packs.", ar: "أنفق الأرواح على الألقاب والألوان والحزم." },
  titles: { en: "Titles", ar: "الألقاب" },
  usernameColors: { en: "Username Colors", ar: "ألوان الاسم" },
  buy: { en: "Buy", ar: "شراء" },
  purchased: { en: "Purchased!", ar: "تم الشراء!" },
  insufficientSouls: { en: "Not enough Souls", ar: "أرواح غير كافية" },
  alreadyOwned: { en: "Already owned", ar: "مملوك بالفعل" },
  notFound: { en: "Item not found", ar: "غير موجود" },
  openable: { en: "Openable pack", ar: "حزمة قابلة للفتح" },
  cosmeticTitle: { en: "Profile title", ar: "لقب الملف" },
  cosmeticColor: { en: "Name color", ar: "لون الاسم" },
  cosmetics: { en: "Cosmetics", ar: "التجميليات" },
  cosmeticsDesc: { en: "Equip titles and colors you own.", ar: "جهّز ما تملكه من الألقاب والألوان." },
  equipped: { en: "Equipped", ar: "مُجهّز" },
  equip: { en: "Equip", ar: "تجهيز" },
  unequip: { en: "Unequip", ar: "إزالة" },
  none: { en: "None", ar: "لا شيء" },
  noCosmetics: { en: "Buy titles or colors in the Store to equip them.", ar: "اشترِ من المتجر لتجهيز التجميليات." },
  goToStore: { en: "Go to Store", ar: "اذهب إلى المتجر" },
  // Rivals (Phase 3)
  rivals: { en: "Rivals", ar: "المنافسون" },
  rivalsSub: { en: "Ranked duels", ar: "مبارزات مصنّفة" },
  rivalsDesc: { en: "Save a 5-character rival team, then battle other players for rating and Souls.", ar: "احفظ فريقاً من ٥ شخصيات ثم قاتل لاعبين آخرين على التصنيف والأرواح." },
  rivalsShort: { en: "Rivals", ar: "المنافسون" },
  rivalRating: { en: "Rating", ar: "التقييم" },
  rivalWins: { en: "Wins", ar: "الانتصارات" },
  rivalLosses: { en: "Losses", ar: "الخسائر" },
  rivalBattlesLeft: { en: "Battles Today", ar: "المعارك اليوم" },
  rivalTeamTitle: { en: "Your Rival Team", ar: "فريقك للمبارزة" },
  rivalTeamDesc: { en: "Pick 5 characters from your collection.", ar: "اختر ٥ شخصيات من مجموعتك." },
  rivalPickFromCollection: { en: "From your collection", ar: "من مجموعتك" },
  rivalEmptyCollection: { en: "You don't own any characters yet. Open a", ar: "لا تملك شخصيات بعد. افتح" },
  rivalBattle: { en: "Battle", ar: "المعركة" },
  rivalSaveFirst: { en: "Save a 5-character team to unlock battles.", ar: "احفظ فريقاً من ٥ شخصيات لفتح المعارك." },
  rivalNeedTeam: { en: "Save a team of 5 first.", ar: "احفظ فريقاً من ٥ أولاً." },
  rivalNoOpponent: { en: "No opponent available right now.", ar: "لا يوجد منافس متاح الآن." },
  rivalDailyReached: { en: "Daily battle limit reached (10).", ar: "بلغت الحد اليومي للمعارك (١٠)." },
  rivalNeedFive: { en: "Team must have exactly 5 characters.", ar: "يجب أن يحوي الفريق ٥ شخصيات بالضبط." },
  rivalDuplicates: { en: "No duplicate characters.", ar: "لا تكرار للشخصيات." },
  rivalNotOwned: { en: "You don't own one of these characters.", ar: "لا تملك إحدى هذه الشخصيات." },
  rivalRecent: { en: "Recent Battles", ar: "المعارك الأخيرة" },
  rivalTopFighters: { en: "Top Rivals", ar: "أعلى المنافسين" },
  rivalEmptyBoard: { en: "Be the first to climb the ranks.", ar: "كن أول من يعتلي التصنيف." },
  save: { en: "Save", ar: "حفظ" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  picked: { en: "Picked", ar: "مُختار" },
  opponent: { en: "Opponent", ar: "المنافس" },
  findOpponent: { en: "Find Opponent", ar: "ابحث عن منافس" },
  searching: { en: "Searching…", ar: "جاري البحث…" },
  beginBattle: { en: "Begin Battle", ar: "ابدأ المعركة" },
  battling: { en: "Battling…", ar: "جاري القتال…" },
  victory: { en: "Victory", ar: "انتصار" },
  defeat: { en: "Defeat", ar: "هزيمة" },
  draw: { en: "Draw", ar: "تعادل" },
  // Missions (Phase 4)
  missions: { en: "Missions", ar: "المهام" },
  missionsSub: { en: "Daily objectives", ar: "أهداف يومية" },
  missionsDesc: { en: "Complete daily objectives to earn Souls. Resets every 24h (UTC).", ar: "أكمل الأهداف اليومية لكسب الأرواح. يعاد ضبطها كل ٢٤ ساعة." },
  dailyMissions: { en: "Daily Missions", ar: "المهام اليومية" },
  claim: { en: "Claim", ar: "استلام" },
  claimed: { en: "Claimed", ar: "تم الاستلام" },
  reward: { en: "Reward", ar: "المكافأة" },
  progress: { en: "Progress", ar: "التقدم" },
  resetsIn: { en: "Resets in", ar: "يُعاد الضبط خلال" },
  hours: { en: "h", ar: "س" },
  minutes: { en: "m", ar: "د" },
  // Weekly Rewards (Phase 5)
  weeklyRewards: { en: "Weekly Rewards", ar: "المكافآت الأسبوعية" },
  weeklyRewardsSub: { en: "Last week's spoils", ar: "غنائم الأسبوع الماضي" },
  weeklyRewardsDesc: {
    en: "Claim rewards based on your final leaderboard rank from last week.",
    ar: "استلم مكافآت بناءً على ترتيبك النهائي في متصدرين الأسبوع الماضي.",
  },
  yourRank: { en: "Your Rank", ar: "ترتيبك" },
  noEntry: {
    en: "You didn't submit a draft last week. Play this week to qualify!",
    ar: "لم تسجّل نتيجة الأسبوع الماضي. العب هذا الأسبوع للتأهل!",
  },
  claimReward: { en: "Claim Reward", ar: "استلم المكافأة" },
  rewardTiers: { en: "Reward Tiers", ar: "مستويات المكافآت" },
  bonusPack: { en: "bonus pack", ar: "حزمة إضافية" },
  rewardClaimed: { en: "Reward claimed", ar: "تم استلام المكافأة" },
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