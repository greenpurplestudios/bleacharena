import type { Character, Locale, Rarity } from "@/types/character";
import antArt from "@/assets/soulduel/black_ant.jpeg.asset.json";
import type { DuelState, Placement, Side } from "./types";
import type { StatusKind } from "./status";
import {
  addBonus, applyStatus, clearNegatives, enemiesIn, alliesIn, highestOf, lowestOf,
  makeToken, setOverride, grantImmunity, baseRatingOf, laneBuff, laneLimit, stealRating,
  protectRating, sealCard, armBounce,
} from "./effects";

export interface AbilityCtx {
  self: Placement;
  state: DuelState;
  /** Every placement currently resolved on the board. */
  board: Placement[];
}

export interface AbilityDef {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  /** Status effects this ability applies — surfaced on the card. */
  applies?: StatusKind[];
  /** Rating this character adds to itself. */
  selfRating?: (ctx: AbilityCtx) => number;
  /** Rating this character adds to another card on the board. */
  aura?: (ctx: AbilityCtx, other: Placement) => number;
  /** Forces this card's final Rating (Renji). Return undefined to skip. */
  overrideRating?: (ctx: AbilityCtx) => number | undefined;
  /** Fires the moment the card is deployed. */
  onPlay?: (state: DuelState, self: Placement) => DuelState;
  /** Fires at the end of every round while the card is on the board. */
  onRoundEnd?: (state: DuelState, self: Placement) => DuelState;
}

export interface DuelCharacterDef {
  slug: string;
  /** Reiatsu cost. Falls back to the rarity curve when omitted. */
  cost?: number;
  faction?: Record<Locale, string>;
  /** Buffs and debuffs never touch this card. */
  immuneToModifiers?: boolean;
  /** How many times this card may relocate during a match. */
  moves?: number;
  /** Some characters are intentionally rating-only. */
  ability?: AbilityDef;
}

const other = (s: Side): Side => (s === "player" ? "opponent" : "player");

/* ------------------------------------------------------------------ tokens */

/** Ichibe's Black Ant. Permanently locked at 1 Rating — nothing touches it. */
export const ANT_SLUG = "black-ant";

export const ANT_CHARACTER: Character = {
  id: "token-ant",
  slug: ANT_SLUG,
  name: { en: "Black Ant", ar: "النملة السوداء" },
  faction: "Royal Guard",
  rarity: "common" as Rarity,
  overall: 1,
  image: antArt.url,
};

/* ------------------------------------------------------------- definitions */

export const DUEL_CHARACTERS: DuelCharacterDef[] = [
  /* ------------------------------------------------------------- mythic */
  {
    slug: "tite-kubo",
    cost: 7,
    faction: { en: "Creator", ar: "الخالق" },
    ability: {
      slug: "plot-armor",
      name: { en: "Plot Armor", ar: "درع الحبكة" },
      description: {
        en: "All cards on every battlefield gain +15 Rating.",
        ar: "كل البطاقات في جميع الساحات تكسب +15 تقييم.",
      },
      selfRating: () => 15,
      aura: () => 15,
    },
  },
  {
    slug: "soul-king",
    cost: 6,
    faction: { en: "Soul King", ar: "ملك الأرواح" },
    ability: {
      slug: "soul-kings-burden",
      name: { en: "Soul King's Burden", ar: "عبء ملك الأرواح" },
      description: {
        en: "All enemy cards lose 5 Rating.",
        ar: "كل بطاقات الخصم تفقد 5 من التقييم.",
      },
      aura: ({ self }, o) => (o.side !== self.side ? -5 : 0),
    },
  },
  {
    slug: "yhwach",
    cost: 5,
    faction: { en: "Quincy", ar: "كوينسي" },
    ability: {
      slug: "the-emperors-revenge",
      name: { en: "The Emperor's Revenge", ar: "انتقام الإمبراطور" },
      description: {
        en: "Once per match, Yhwach steals the base Rating of the strongest enemy card on this battlefield.",
        ar: "مرة واحدة في المباراة، يسلب يهواخ التقييم الأساسي لأقوى بطاقة معادية في هذه الساحة.",
      },
      onRoundEnd: (state, self) => {
        // Strictly once per match: the moment anything has been stolen, done.
        if ((self.stolen ?? []).length) return state;
        const victim = highestOf(enemiesIn(state, self));
        return victim ? stealRating(state, self.uid, victim.uid) : state;
      },
    },
  },
  {
    slug: "ichigo-kurosaki",
    cost: 5,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "to-protect",
      name: { en: "To Protect", ar: "لكي أحمي" },
      description: {
        en: "Allies here gain +5 Rating, lose all debuffs and become immune for one round.",
        ar: "الحلفاء هنا يكسبون +5 تقييم، ويتخلصون من التأثيرات السلبية ويصبحون محصنين لجولة.",
      },
      applies: ["shield"],
      onPlay: (state, self) => {
        let next = state;
        for (const ally of alliesIn(state, self, true)) {
          next = addBonus(next, ally.uid, 5);
          next = clearNegatives(next, ally.uid);
          next = grantImmunity(next, ally.uid);
          next = applyStatus(next, ally.uid, "shield");
        }
        return next;
      },
    },
  },
  {
    slug: "aizen-sosuke",
    cost: 5,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "hogyokus-will",
      name: { en: "Hōgyoku's Will", ar: "إرادة الهوغيوكو" },
      description: {
        en: "End of round: +15 Rating alone, +10 with one ally, +5 with two.",
        ar: "نهاية الجولة: +15 تقييم منفرداً، +10 مع حليف، +5 مع حليفين.",
      },
      onRoundEnd: (state, self) => {
        const allies = alliesIn(state, self, false).length;
        const gain = allies === 0 ? 15 : allies === 1 ? 10 : allies === 2 ? 5 : 0;
        return gain ? addBonus(state, self.uid, gain) : state;
      },
    },
  },
  {
    slug: "genryusai-yamamoto",
    cost: 5,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "the-sun",
      name: { en: "The Sun", ar: "الشمس" },
      description: {
        en: "Inflicts Burn on every enemy card on this battlefield.",
        ar: "يصيب كل بطاقات الخصم في هذه الساحة بالاحتراق.",
      },
      applies: ["burn"],
      onPlay: (state, self) =>
        enemiesIn(state, self).reduce((s, e) => applyStatus(s, e.uid, "burn"), state),
    },
  },
  {
    slug: "ichibei-hyosube",
    cost: 5,
    faction: { en: "Royal Guard", ar: "الحرس الملكي" },
    ability: {
      slug: "black-ant",
      name: { en: "Black Ant", ar: "النملة السوداء" },
      description: {
        en: "Summons a 1 Rating Ant onto the opponent's side of this battlefield.",
        ar: "يستدعي نملة بتقييم 1 في جانب الخصم من هذه الساحة.",
      },
      onPlay: (state, self) => makeToken(state, ANT_CHARACTER, other(self.side), self.lane),
    },
  },

  /* ---------------------------------------------------------- legendary */
  {
    slug: "tokinada-tsunayashiro",
    cost: 4,
    ability: {
      slug: "stolen-crest",
      name: { en: "Stolen Crest", ar: "الشعار المسروق" },
      description: {
        en: "Copies the abilities of up to 3 enemy cards on this battlefield.",
        ar: "ينسخ قدرات حتى ٣ بطاقات معادية في هذه الساحة.",
      },
      selfRating: (ctx) => {
        const copied = enemiesIn(ctx.state, ctx.self)
          .map((e) => abilityOf(e.card.character.slug))
          .filter((a): a is AbilityDef => !!a?.selfRating)
          .slice(0, 3);
        return copied.reduce((n, a) => n + (a.selfRating?.(ctx) ?? 0), 0);
      },
    },
  },
  {
    slug: "shunsui-kyoraku",
    cost: 4,
    ability: {
      slug: "the-playground",
      name: { en: "The Playground", ar: "الملعب" },
      description: {
        en: "The next allied card played here gains +10 Rating.",
        ar: "البطاقة الحليفة التالية هنا تكسب +10 تقييم.",
      },
      onPlay: (state, self) => laneBuff(state, self.lane, self.side, 10),
    },
  },
  {
    slug: "kisuke-urahara",
    cost: 4,
    moves: 2,
    ability: {
      slug: "shopkeepers-exit",
      name: { en: "Shopkeeper's Exit", ar: "مخرج صاحب المتجر" },
      description: {
        en: "May relocate to another battlefield twice per match.",
        ar: "يمكنه الانتقال إلى ساحة أخرى مرتين في المباراة.",
      },
    },
  },
  {
    slug: "kenpachi-zaraki",
    cost: 4,
    immuneToModifiers: true,
    ability: {
      slug: "only-the-sword",
      name: { en: "Only the Sword", ar: "السيف فقط" },
      description: {
        en: "Cannot receive buffs or debuffs.",
        ar: "لا يتأثر بأي تعزيز أو إضعاف.",
      },
    },
  },
  {
    slug: "byakuya-kuchiki",
    cost: 4,
    ability: {
      slug: "senbonzakura-kageyoshi",
      name: { en: "Senbonzakura Kageyoshi", ar: "سينبونزاكورا كاغيوشي" },
      description: {
        en: "Every enemy card on this battlefield loses 5 Rating.",
        ar: "كل بطاقة معادية في هذه الساحة تفقد ٥ من التقييم.",
      },
      onPlay: (state, self) =>
        enemiesIn(state, self).reduce((st, e) => addBonus(st, e.uid, -5), state),
    },
  },
  {
    slug: "jugram-haschwalth",
    cost: 5,
    ability: {
      slug: "the-balance",
      name: { en: "The Balance", ar: "الميزان" },
      description: {
        en: "The lowest allied card here matches the highest enemy card's Rating.",
        ar: "أضعف بطاقة حليفة هنا تصبح مساوية لأقوى بطاقة معادية.",
      },
      onRoundEnd: (state, self) => {
        const top = highestOf(enemiesIn(state, self));
        const weak = lowestOf(alliesIn(state, self, true));
        if (!top || !weak) return state;
        return setOverride(state, weak.uid, baseRatingOf(top));
      },
    },
  },
  {
    slug: "lille-barro",
    cost: 5,
    ability: {
      slug: "x-axis",
      name: { en: "X-Axis", ar: "المحور السيني" },
      description: {
        en: "Pierces every battlefield: the strongest enemy card on the board loses 15 Rating.",
        ar: "يخترق كل الساحات: أقوى بطاقة معادية على اللوح تفقد ١٥ من التقييم.",
      },
      onPlay: (state, self) => {
        const target = highestOf(state.placements.filter((p) => p.side !== self.side));
        return target ? addBonus(state, target.uid, -15) : state;
      },
    },
  },
  {
    slug: "askin-nakk-le-vaar",
    cost: 4,
    ability: {
      slug: "gift-ball",
      name: { en: "Gift Ball", ar: "كرة الهدية" },
      description: {
        en: "Burns every enemy card on this battlefield.",
        ar: "يحرق كل بطاقة معادية في هذه الساحة.",
      },
      applies: ["burn"],
      onPlay: (state, self) =>
        enemiesIn(state, self).reduce((st, e) => applyStatus(st, e.uid, "burn"), state),
    },
  },
  {
    slug: "mayuri-kurotsuchi",
    cost: 4,
    ability: {
      slug: "ashisogi-jizo",
      name: { en: "Ashisogi Jizō", ar: "أشيسوغي جيزو" },
      description: {
        en: "Freezes the weakest enemy card here and gains +8 Rating.",
        ar: "يجمّد أضعف بطاقة معادية هنا ويكسب +٨ من التقييم.",
      },
      applies: ["freeze"],
      selfRating: () => 8,
      onPlay: (state, self) => {
        const target = lowestOf(enemiesIn(state, self));
        return target ? applyStatus(state, target.uid, "freeze") : state;
      },
    },
  },
  {
    slug: "orihime-inoue",
    cost: 3,
    ability: {
      slug: "santen-kesshun",
      name: { en: "Santen Kesshun", ar: "سانتن كيشون" },
      description: {
        en: "Shields one allied card here and removes all its negative effects.",
        ar: "يمنح درعاً لبطاقة حليفة هنا ويزيل كل تأثيراتها السلبية.",
      },
      applies: ["shield"],
      onPlay: (state, self) => {
        const target = highestOf(alliesIn(state, self, false)) ?? self;
        return applyStatus(clearNegatives(state, target.uid), target.uid, "shield");
      },
    },
  },
  {
    slug: "coyote-starrk",
    cost: 3,
    ability: {
      slug: "lonely-realm",
      name: { en: "Lonely Realm", ar: "عالم الوحدة" },
      description: {
        en: "This battlefield is limited to one card per player — for both sides.",
        ar: "تصبح هذه الساحة محدودة ببطاقة واحدة لكل لاعب — للطرفين معاً.",
      },
      onPlay: (state, self) =>
        laneLimit(laneLimit(state, self.lane, self.side, 1), self.lane, other(self.side), 1),
    },
  },
  {
    slug: "yoruichi-shihoin",
    cost: 4,
    moves: 1,
    ability: {
      slug: "flash-step",
      name: { en: "Flash Step", ar: "خطوة البرق" },
      description: {
        en: "May relocate to another battlefield once per match.",
        ar: "يمكنها الانتقال إلى ساحة أخرى مرة واحدة في المباراة.",
      },
    },
  },

  /* --------------------------------------------------------------- epic */
  {
    slug: "ulquiorra-cifer",
    cost: 4,
    ability: {
      slug: "segunda-etapa",
      name: { en: "Segunda Etapa", ar: "الطور الثاني" },
      description: {
        en: "Gains +12 Rating while losing this battlefield.",
        ar: "يكسب +١٢ من التقييم عندما تكون هذه الساحة خاسرة.",
      },
      selfRating: ({ self, board }) => {
        const sum = (side: Side) =>
          board.filter((p) => p.lane === self.lane && p.side === side)
            .reduce((n, p) => n + baseRatingOf(p), 0);
        return sum(other(self.side)) > sum(self.side) ? 12 : 0;
      },
    },
  },
  {
    slug: "uryu-ishida",
    cost: 3,
    ability: {
      slug: "antithesis",
      name: { en: "Antithesis", ar: "النقيض" },
      description: {
        en: "Swaps Rating with the highest enemy card on this battlefield.",
        ar: "يبادل تقييمه مع أقوى بطاقة معادية في هذه الساحة.",
      },
      onPlay: (state, self) => {
        const top = highestOf(enemiesIn(state, self));
        if (!top) return state;
        const mine = baseRatingOf(self);
        return setOverride(setOverride(state, self.uid, baseRatingOf(top)), top.uid, mine);
      },
    },
  },
  {
    slug: "shinji-hirako",
    cost: 4,
    ability: {
      slug: "sakanade",
      name: { en: "Sakanade", ar: "ساكانادي" },
      description: {
        en: "Swaps every enemy card on the left battlefield with those on the right.",
        ar: "يبدّل كل بطاقات الخصم في الساحة اليسرى مع اليمنى.",
      },
      onPlay: (state, self) => {
        const foe = other(self.side);
        const left = 0;
        const right = state.lanes.length - 1;
        if (left === right) return state;
        return {
          ...state,
          placements: state.placements.map((p) =>
            p.side !== foe ? p
            : p.lane === left ? { ...p, lane: right }
            : p.lane === right ? { ...p, lane: left }
            : p,
          ),
        };
      },
    },
  },
  {
    slug: "gin-ichimaru",
    cost: 3,
    ability: {
      slug: "kamishini-no-yari",
      name: { en: "Kamishini no Yari", ar: "كاميشيني نو ياري" },
      description: {
        en: "The strongest enemy card here loses 10 Rating.",
        ar: "أقوى بطاقة معادية هنا تفقد ١٠ من التقييم.",
      },
      onPlay: (state, self) => {
        const target = highestOf(enemiesIn(state, self));
        return target ? addBonus(state, target.uid, -10) : state;
      },
    },
  },
  {
    slug: "toshiro-hitsugaya",
    cost: 4,
    ability: {
      slug: "hyorinmaru",
      name: { en: "Hyōrinmaru", ar: "هيورينمارو" },
      description: {
        en: "Freezes one enemy card on this battlefield.",
        ar: "يجمّد بطاقة معادية في هذه الساحة.",
      },
      applies: ["freeze"],
      onPlay: (state, self) => {
        const target = highestOf(enemiesIn(state, self));
        return target ? applyStatus(state, target.uid, "freeze") : state;
      },
    },
  },
  {
    slug: "bazz-b",
    cost: 3,
    ability: {
      slug: "burner-finger",
      name: { en: "Burner Finger", ar: "إصبع اللهب" },
      description: {
        en: "Inflicts Burn on one enemy card on this battlefield.",
        ar: "يصيب بطاقة معادية في هذه الساحة بالاحتراق.",
      },
      applies: ["burn"],
      onPlay: (state, self) => {
        const target = highestOf(enemiesIn(state, self));
        return target ? applyStatus(state, target.uid, "burn") : state;
      },
    },
  },
  {
    slug: "soi-fon",
    cost: 2,
    ability: {
      slug: "nigeki-kessatsu",
      name: { en: "Nigeki Kessatsu", ar: "الضربتان القاتلتان" },
      description: {
        en: "The strongest enemy card here loses 10 Rating — 20 if it is already affected.",
        ar: "أقوى بطاقة معادية هنا تفقد ١٠، أو ٢٠ إذا كانت متأثرة بالفعل.",
      },
      onPlay: (state, self) => {
        const target = highestOf(enemiesIn(state, self));
        if (!target) return state;
        return addBonus(state, target.uid, target.statuses.length ? -20 : -10);
      },
    },
  },
  {
    slug: "grimmjow-jaegerjaquez",
    cost: 3,
    ability: {
      slug: "desgarron",
      name: { en: "Desgarrón", ar: "ديسغارون" },
      description: {
        en: "Gains +4 Rating for every enemy card on this battlefield.",
        ar: "يكسب +٤ من التقييم عن كل بطاقة معادية في هذه الساحة.",
      },
      selfRating: ({ self, board }) =>
        4 * board.filter((p) => p.lane === self.lane && p.side !== self.side).length,
    },
  },
  {
    slug: "rukia-kuchiki",
    cost: 3,
    ability: {
      slug: "sode-no-shirayuki",
      name: { en: "Sode no Shirayuki", ar: "سودي نو شيرايوكي" },
      description: {
        en: "Freezes the strongest enemy card on this battlefield.",
        ar: "تجمّد أقوى بطاقة معادية في هذه الساحة.",
      },
      applies: ["freeze"],
      onPlay: (state, self) => {
        const target = highestOf(enemiesIn(state, self));
        return target ? applyStatus(state, target.uid, "freeze") : state;
      },
    },
  },
  {
    slug: "shukuro-tsukishima",
    cost: 4,
    ability: {
      slug: "book-of-the-end",
      name: { en: "Book of the End", ar: "كتاب النهاية" },
      description: {
        en: "Inserts himself into the past — copies the Rating of the strongest card on this battlefield.",
        ar: "يدخل نفسه في الماضي — ينسخ تقييم أقوى بطاقة في هذه الساحة.",
      },
      onPlay: (state, self) => {
        const here = state.placements.filter((p) => p.lane === self.lane && p.uid !== self.uid);
        const top = highestOf(here);
        if (!top || baseRatingOf(top) <= baseRatingOf(self)) return state;
        return setOverride(state, self.uid, baseRatingOf(top));
      },
    },
  },
  {
    slug: "kaname-tosen",
    cost: 3,
    ability: {
      slug: "suzumushi",
      name: { en: "Suzumushi Hyakushiki", ar: "سوزوموشي هياكوشيكي" },
      description: {
        en: "Robs the senses: freezes the two strongest enemy cards on this battlefield.",
        ar: "يسلب الحواس: يجمّد أقوى بطاقتين معاديتين في هذه الساحة.",
      },
      applies: ["freeze"],
      onPlay: (state, self) => {
        const targets = [...enemiesIn(state, self)]
          .sort((a, b) => baseRatingOf(b) - baseRatingOf(a))
          .slice(0, 2);
        return targets.reduce((st, e) => applyStatus(st, e.uid, "freeze"), state);
      },
    },
  },

  /* ------------------------------------------------- expansion (7 souls) */
  {
    slug: "retsu-unohana",
    cost: 5,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "blood-field",
      name: { en: "Blood Field", ar: "حقل الدماء" },
      description: {
        en: "Allies on this battlefield gain +5 Rating; enemies here lose 5.",
        ar: "الحلفاء في هذه الساحة يكسبون +٥ تقييم، والأعداء هنا يفقدون ٥.",
      },
      selfRating: () => 5,
      aura: ({ self }, o) =>
        o.lane !== self.lane ? 0 : o.side === self.side ? 5 : -5,
    },
  },
  {
    slug: "jushiro-ukitake",
    cost: 4,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "sogyo-no-kotowari",
      name: { en: "Sōgyo no Kotowari", ar: "سوغيو نو كوتوواري" },
      description: {
        en: "Once per round, reflects the next negative effect on an ally here back at the enemy.",
        ar: "مرة كل جولة، يعكس التأثير السلبي التالي على حليف هنا نحو الخصم.",
      },
    },
  },
  {
    slug: "sajin-komamura",
    cost: 3,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "unbreakable-loyalty",
      name: { en: "Unbreakable Loyalty", ar: "ولاء لا يُكسر" },
      description: {
        en: "The strongest ally on this battlefield can never lose Rating again.",
        ar: "أقوى حليف في هذه الساحة لا يمكن أن يفقد التقييم أبداً.",
      },
      onPlay: (state, self) => {
        const top = highestOf(alliesIn(state, self, true));
        return top ? protectRating(state, top.uid) : state;
      },
    },
  },
  {
    slug: "nelliel-tu-odelschwanck",
    cost: 3,
    faction: { en: "Arrancar", ar: "أرانكار" },
    ability: {
      slug: "compassion",
      name: { en: "Compassion", ar: "الرحمة" },
      description: {
        en: "The weakest ally on this battlefield gains +10 Rating.",
        ar: "أضعف حليف في هذه الساحة يكسب +١٠ تقييم.",
      },
      onPlay: (state, self) => {
        const weak = lowestOf(alliesIn(state, self, true));
        return weak ? addBonus(state, weak.uid, 10) : state;
      },
    },
  },
  {
    slug: "nnoitra-gilga",
    cost: 3,
    faction: { en: "Arrancar", ar: "أرانكار" },
    ability: {
      slug: "hierro",
      name: { en: "Hierro", ar: "هييرو" },
      description: {
        en: "Allies on this battlefield take 50% less from debuffs.",
        ar: "الحلفاء في هذه الساحة يتلقون نصف تأثير الإضعافات.",
      },
    },
  },
  {
    slug: "renji-abarai",
    cost: 3,
    faction: { en: "Shinigami", ar: "شينيغامي" },
    ability: {
      slug: "cant-imagine-losing",
      name: { en: "I Can't Imagine Losing", ar: "لا أتخيل الخسارة" },
      description: {
        en: "Renji's Rating is always 1 above the weakest enemy on this battlefield.",
        ar: "تقييم رينجي دائماً أعلى بنقطة من أضعف عدو في هذه الساحة.",
      },
      overrideRating: ({ self, state }) => {
        const foes = enemiesIn(state, self);
        if (!foes.length) return undefined;
        return Math.min(...foes.map(baseRatingOf)) + 1;
      },
    },
  },
  {
    slug: "zangetsu",
    cost: 5,
    faction: { en: "Zanpakutō Spirit", ar: "روح زانباكوتو" },
    ability: {
      slug: "the-blade-is-me",
      name: { en: "The Blade Is Me", ar: "النصل هو أنا" },
      description: {
        en: "Buffs and debuffs on allies of this battlefield count double.",
        ar: "التعزيزات والإضعافات على حلفاء هذه الساحة تُحتسب مضاعفة.",
      },
    },
  },
  /* -------------------------------------------------------- fullbringers */
  {
    slug: "riruka-dokugamine",
    cost: 2,
    faction: { en: "Fullbringer", ar: "فولبرينغر" },
    ability: {
      slug: "dollhouse",
      name: { en: "Dollhouse", ar: "بيت الدمى" },
      description: {
        en: "Seals the strongest enemy on this battlefield for 2 rounds: no ability, no buffs or debuffs.",
        ar: "تحبس أقوى عدو في هذه الساحة لجولتين: بلا قدرة ولا تعزيزات أو إضعافات.",
      },
      onPlay: (state, self) => {
        const victim = highestOf(enemiesIn(state, self));
        return victim ? sealCard(state, victim.uid, 2) : state;
      },
    },
  },
  {
    slug: "yukio-vorarlberna",
    cost: 3,
    faction: { en: "Fullbringer", ar: "فولبرينغر" },
    ability: {
      slug: "invaders-must-die",
      name: { en: "Invaders Must Die", ar: "الغزاة يجب أن يموتوا" },
      description: {
        en: "The next enemy card played on this battlefield returns to its owner's hand.",
        ar: "البطاقة المعادية التالية التي تُلعب في هذه الساحة تعود إلى يد صاحبها.",
      },
      onPlay: (state, self) => armBounce(state, self.lane, other(self.side)),
    },
  },
];

const BY_SLUG = new Map(DUEL_CHARACTERS.map((d) => [d.slug, d]));

export function duelDefOf(slug: string): DuelCharacterDef | undefined {
  return BY_SLUG.get(slug);
}

export function abilityOf(slug: string): AbilityDef | undefined {
  return BY_SLUG.get(slug)?.ability;
}

/** Everything the UI needs about a character, resolved in one call. */
export const ABILITIES: AbilityDef[] = DUEL_CHARACTERS.map((d) => d.ability).filter(
  (a): a is AbilityDef => !!a,
);
