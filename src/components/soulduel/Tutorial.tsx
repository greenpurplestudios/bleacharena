import { useMemo, useState } from "react";
import type { Locale } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { DUEL_ROSTER } from "@/data/soul-duel-roster";
import { DuelBoard } from "./DuelBoard";
import rukiaArt from "@/assets/tutorial/rukia_tutorial.jpeg.asset.json";

const DONE_KEY = "bd:sd:tutorialDone";

export function tutorialDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone() {
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch {}
}

interface Step {
  text: Record<Locale, string>;
}

const STEPS: Step[] = [
  {
    text: {
      en: "Hi, I'm Rukia. Each card costs Reiatsu to play — check the number on its badge before deploying.",
      ar: "أهلاً، أنا روكيا. كل بطاقة تكلّف رياتسو للعبها — تحقق من الرقم على شارتها قبل نشرها.",
    },
  },
  {
    text: {
      en: "A duel lasts six rounds. Your Reiatsu pool grows each round, so save strong cards for later.",
      ar: "يستمر النزال ست جولات. تنمو طاقة رياتسوك كل جولة، فادّخر بطاقاتك القوية للمراحل اللاحقة.",
    },
  },
  {
    text: {
      en: "There are three battlefields. Whoever has the highest total Rating on a battlefield wins it.",
      ar: "توجد ثلاث ساحات معركة. من يملك أعلى مجموع تقييم في ساحة يفوز بها.",
    },
  },
  {
    text: {
      en: "Battlefields stay hidden until revealed before rounds 1, 2 and 3 — plan around the mystery.",
      ar: "تبقى الساحات مخفية حتى تُكشف قبل الجولات ١ و٢ و٣ — خطط بحسب هذا الغموض.",
    },
  },
  {
    text: {
      en: "Many characters carry unique abilities that trigger when played — watch the announcement banner.",
      ar: "تحمل شخصيات كثيرة قدرات فريدة تُفعَّل عند لعبها — راقب لافتة الإعلان.",
    },
  },
  {
    text: {
      en: "Elements matter: a card with an elemental advantage deals more, one with a disadvantage deals less.",
      ar: "العناصر مهمة: البطاقة ذات الأفضلية العنصرية تُلحق ضرراً أكبر، وذات الضعف تُلحق أقل.",
    },
  },
  {
    text: {
      en: "Watch for buffs, debuffs and statuses — Burn chips away Rating, Freeze silences abilities, Shield blocks the next hit.",
      ar: "انتبه للتعزيزات والإضعافات والحالات — الحرق يقلّل التقييم، والتجميد يكتم القدرات، والدرع يصد الضربة القادمة.",
    },
  },
  {
    text: {
      en: "The Soul Pressure gauge fills as you play cards. Once full, you can unleash your Ultimate Weapon.",
      ar: "يمتلئ مقياس الضغط الروحي كلما لعبت بطاقات. وحين يمتلئ، يمكنك إطلاق سلاحك النهائي.",
    },
  },
  {
    text: {
      en: "Ultimate Weapons are devastating one-time effects — equip one in the Forge before you duel.",
      ar: "الأسلحة النهائية تأثيرات مدمّرة تُستخدم مرة واحدة — جهّز واحداً في المطرقة قبل النزال.",
    },
  },
  {
    text: {
      en: "When round six ends, the result screen shows who won each battlefield and the overall winner. Good luck!",
      ar: "عند انتهاء الجولة السادسة، تعرض شاشة النتيجة الفائز بكل ساحة والفائز الكلي. حظاً موفقاً!",
    },
  },
];

export function Tutorial({ onExit }: { onExit: () => void }) {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(0);
  const pool = useMemo(() => DUEL_ROSTER.slice(0, 16), []);
  const last = step === STEPS.length - 1;

  const finish = () => {
    markDone();
    play("reveal");
    haptic("reward");
    onExit();
  };

  const next = () => {
    play("tap");
    haptic("tap");
    if (last) { finish(); return; }
    setStep((s) => s + 1);
  };

  return (
    <div className="relative">
      <DuelBoard pool={pool} difficulty="practice" onExit={onExit} />

      <div
        className="pointer-events-none fixed inset-x-3 bottom-24 z-[70] flex items-end gap-2 sm:inset-x-auto sm:end-4 sm:w-80"
        style={{ animation: "card-in 0.35s ease-out both" }}
      >
        <img
          src={rukiaArt.url}
          alt="Rukia"
          className="pointer-events-none h-16 w-16 shrink-0 rounded-full border-2 border-accent/60 object-cover"
          style={{ objectPosition: "50% 20%", boxShadow: "0 0 22px -6px oklch(0.75 0.16 260)" }}
        />
        <div className="pointer-events-auto min-w-0 flex-1 rounded-2xl border border-accent/30 bg-card/95 p-3 shadow-2xl backdrop-blur-md">
          <p className="font-display text-[9px] font-black uppercase tracking-[0.25em] text-accent rtl:tracking-normal">
            {t("sdTutorialCoach")} · {step + 1}/{STEPS.length}
          </p>
          <p className="mt-1 text-xs leading-snug">{STEPS[step].text[locale]}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => { play("skip"); onExit(); }}
              className="tactile rounded-lg border border-white/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground rtl:tracking-normal"
            >
              {t("sdTutorialSkip")}
            </button>
            <button
              type="button"
              onClick={next}
              className="tactile rounded-lg bg-primary px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary-foreground rtl:tracking-normal"
            >
              {last ? t("sdTutorialFinish") : t("sdTutorialNext")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
