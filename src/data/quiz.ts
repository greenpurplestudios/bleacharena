import type { TraitKey } from "@/types/character";

export interface QuizAnswer {
  text: { en: string; ar: string };
  traits: Partial<Record<TraitKey, number>>;
}
export interface QuizQuestion {
  id: string;
  q: { en: string; ar: string };
  answers: QuizAnswer[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    q: { en: "A friend is in danger. What do you do?", ar: "صديق في خطر. ماذا تفعل؟" },
    answers: [
      { text: { en: "Charge in without thinking.", ar: "أهجم دون تفكير." }, traits: { courage: 3, chaos: 2, loyalty: 2 } },
      { text: { en: "Plan a careful rescue.", ar: "أخطط لإنقاذ محكم." }, traits: { intellect: 3, discipline: 2, loyalty: 2 } },
      { text: { en: "Comfort them and stay by their side.", ar: "أواسيه وأبقى بجانبه." }, traits: { compassion: 3, loyalty: 3 } },
      { text: { en: "Use it as leverage.", ar: "أستغل الموقف لصالحي." }, traits: { ambition: 3, chaos: 2 } },
    ],
  },
  {
    id: "q2",
    q: { en: "Pick your ideal weapon.", ar: "اختر سلاحك المفضل." },
    answers: [
      { text: { en: "A massive sword.", ar: "سيف ضخم." }, traits: { courage: 3, chaos: 1 } },
      { text: { en: "Elegant twin blades.", ar: "سيفان أنيقان." }, traits: { discipline: 3, intellect: 1 } },
      { text: { en: "A precision bow.", ar: "قوس دقيق." }, traits: { intellect: 3, discipline: 2 } },
      { text: { en: "Your bare hands.", ar: "قبضتاي." }, traits: { courage: 2, discipline: 2, ambition: 1 } },
      { text: { en: "Words and illusions.", ar: "الكلمات والأوهام." }, traits: { intellect: 3, ambition: 2 } },
    ],
  },
  {
    id: "q3",
    q: { en: "How do you handle authority?", ar: "كيف تتعامل مع السلطة؟" },
    answers: [
      { text: { en: "Respect and uphold it.", ar: "أحترمها وأدعمها." }, traits: { discipline: 3, loyalty: 2 } },
      { text: { en: "Question every rule.", ar: "أشكك بكل قاعدة." }, traits: { chaos: 3, courage: 1 } },
      { text: { en: "Manipulate it quietly.", ar: "أتلاعب بها بهدوء." }, traits: { ambition: 3, intellect: 2 } },
      { text: { en: "Ignore it and do your own thing.", ar: "أتجاهلها وأتصرف كما أريد." }, traits: { chaos: 2, humor: 2 } },
    ],
  },
  {
    id: "q4",
    q: { en: "Your greatest strength is…", ar: "أعظم نقاط قوتك…" },
    answers: [
      { text: { en: "Raw power.", ar: "القوة الخام." }, traits: { courage: 3, chaos: 1 } },
      { text: { en: "Sharp mind.", ar: "العقل الحاد." }, traits: { intellect: 3 } },
      { text: { en: "Iron will.", ar: "الإرادة الحديدية." }, traits: { discipline: 3, loyalty: 1 } },
      { text: { en: "Kind heart.", ar: "القلب الطيب." }, traits: { compassion: 3 } },
      { text: { en: "Endless ambition.", ar: "طموح لا ينتهي." }, traits: { ambition: 3 } },
    ],
  },
  {
    id: "q5",
    q: { en: "In a fight, you…", ar: "في المعركة، أنت…" },
    answers: [
      { text: { en: "Overwhelm them head-on.", ar: "أسحق الخصم مباشرة." }, traits: { courage: 3, chaos: 1 } },
      { text: { en: "Read every move.", ar: "أقرأ كل حركة." }, traits: { intellect: 3, discipline: 1 } },
      { text: { en: "Protect the wounded.", ar: "أحمي الجرحى." }, traits: { compassion: 3, loyalty: 2 } },
      { text: { en: "Crack a joke first.", ar: "أطلق دعابة أولاً." }, traits: { humor: 3, chaos: 1 } },
    ],
  },
  {
    id: "q6",
    q: { en: "You would rule…", ar: "تفضل أن تحكم…" },
    answers: [
      { text: { en: "A disciplined army.", ar: "جيشاً منضبطاً." }, traits: { discipline: 3, ambition: 2 } },
      { text: { en: "The entire world.", ar: "العالم بأسره." }, traits: { ambition: 3, intellect: 2 } },
      { text: { en: "A small circle of friends.", ar: "دائرة صغيرة من الأصدقاء." }, traits: { loyalty: 3, compassion: 2 } },
      { text: { en: "Nothing. Freedom over all.", ar: "لا شيء. الحرية فوق كل شيء." }, traits: { chaos: 3, humor: 1 } },
    ],
  },
  {
    id: "q7",
    q: { en: "Pick a vibe.", ar: "اختر جواً يمثلك." },
    answers: [
      { text: { en: "Stormy and untamed.", ar: "عاصف وجامح." }, traits: { chaos: 3, courage: 1 } },
      { text: { en: "Cold moonlight.", ar: "ضوء قمر بارد." }, traits: { discipline: 3, intellect: 1 } },
      { text: { en: "Warm sunrise.", ar: "شروق دافئ." }, traits: { compassion: 3 } },
      { text: { en: "Silent shadow.", ar: "ظل صامت." }, traits: { ambition: 2, intellect: 2 } },
    ],
  },
  {
    id: "q8",
    q: { en: "Your motto:", ar: "شعارك:" },
    answers: [
      { text: { en: "Protect what matters.", ar: "احمِ ما يهم." }, traits: { loyalty: 3, compassion: 2 } },
      { text: { en: "Know everything.", ar: "اعرف كل شيء." }, traits: { intellect: 3 } },
      { text: { en: "Never kneel.", ar: "لا تركع أبداً." }, traits: { courage: 3, ambition: 1 } },
      { text: { en: "Break the rules with style.", ar: "اكسر القواعد بأناقة." }, traits: { chaos: 2, humor: 3 } },
    ],
  },
];

// Character trait profiles used for personality matching.
// Only characters listed here are candidates for quiz results.
export const characterTraits: Record<string, Partial<Record<TraitKey, number>>> = {
  "ichigo-kurosaki": { courage: 5, loyalty: 4, chaos: 2, compassion: 3 },
  "rukia-kuchiki": { discipline: 4, loyalty: 4, compassion: 3, courage: 3 },
  "byakuya-kuchiki": { discipline: 5, ambition: 2, intellect: 3, loyalty: 3 },
  "kenpachi-zaraki": { courage: 5, chaos: 5, ambition: 2 },
  "toshiro-hitsugaya": { discipline: 4, intellect: 3, loyalty: 3, courage: 3 },
  "renji-abarai": { courage: 4, loyalty: 4, chaos: 2 },
  "uryu-ishida": { intellect: 5, discipline: 4, loyalty: 2 },
  "yoruichi-shihoin": { chaos: 3, intellect: 3, humor: 2, courage: 3 },
  "kisuke-urahara": { intellect: 5, chaos: 3, humor: 3, ambition: 2 },
  "shunsui-kyoraku": { intellect: 4, humor: 4, compassion: 3, discipline: 2 },
  "grimmjow-jaegerjaquez": { courage: 4, chaos: 5, ambition: 3 },
  "ulquiorra-cifer": { discipline: 5, intellect: 4, ambition: 2 },
  "orihime-inoue": { compassion: 5, loyalty: 4, courage: 2 },
  "chad-yasutora": { loyalty: 5, compassion: 3, courage: 3, discipline: 2 },
  "yhwach": { ambition: 5, intellect: 4, discipline: 3 },
  "aizen-sosuke": { ambition: 5, intellect: 5, chaos: 2 },
  "genryusai-yamamoto": { discipline: 5, loyalty: 3, courage: 4 },
  "gin-ichimaru": { intellect: 4, humor: 3, chaos: 3, ambition: 3 },
  "shinji-hirako": { humor: 4, intellect: 3, chaos: 2 },
  "mayuri-kurotsuchi": { intellect: 5, chaos: 4, ambition: 3 },
  "soi-fon": { discipline: 5, loyalty: 4, ambition: 2 },
  "rangiku-matsumoto": { humor: 4, loyalty: 3, compassion: 3 },
  "tier-harribel": { discipline: 4, loyalty: 4, compassion: 3 },
  "sajin-komamura": { loyalty: 5, compassion: 3, discipline: 3, courage: 3 },
  "izuru-kira": { discipline: 3, loyalty: 4, compassion: 2 },
  "kon": { chaos: 4, humor: 5 },
  "don-kanonji": { humor: 5, chaos: 3 },
  "ikkaku-madarame": { courage: 4, chaos: 3, loyalty: 2 },
  "yumichika-ayasegawa": { discipline: 2, humor: 3, ambition: 2 },
};