/**
 * Soul Links puzzle bank. Each puzzle is 4 canon groups of exactly 4
 * characters, ordered easiest (0) to hardest (3). Slugs must exist in
 * `src/data/characters.ts` — `validatePuzzles()` in `src/lib/soul-links.ts`
 * drops any group referencing an unknown slug so the mode can never crash.
 *
 * Every group carries three progressive hints that explain WHY the four are
 * linked, from a general nudge to a near-explicit clue. Hints must never name
 * the four members.
 */
export interface LinkGroup {
  id: string;
  label: { en: string; ar: string };
  slugs: string[];
  /** Exactly three progressive hints, general → specific. */
  hints: { en: string; ar: string }[];
}

export interface LinkPuzzle {
  id: string;
  /** Easiest first — index doubles as the difficulty colour. */
  groups: [LinkGroup, LinkGroup, LinkGroup, LinkGroup];
}

const g = (
  id: string,
  en: string,
  ar: string,
  slugs: string[],
  hints: [string, string][],
): LinkGroup => ({
  id,
  label: { en, ar },
  slugs,
  hints: hints.map(([e, a]) => ({ en: e, ar: a })),
});

// ---- reusable groups (same link can appear in more than one puzzle) ----

const XCUTION = () => g("xcution", "Fullbringers of Xcution", "أعضاء إكسكيوشن",
  ["kugo-ginjo", "shukuro-tsukishima", "riruka-dokugamine", "yukio-vorarlberna"],
  [
    ["Their powers come from objects, not from a Zanpakutō.", "قدراتهم تأتي من الأشياء لا من الزانباكوتو."],
    ["They were all born with a trace of Hollow reiatsu from a parent.", "وُلدوا جميعاً بأثر من ريّاتسو الهولو من أحد الوالدين."],
    ["One organisation used Ichigo to steal a Substitute badge's power.", "منظمة واحدة استغلت إيتشيغو لسرقة قوة شارة الشينيغامي البديل."],
  ]);

const SQUAD_ZERO = () => g("zero", "The Royal Guard", "الحرس الملكي",
  ["oetsu-nimaiya", "tenjiro-kirinji", "kirio-hikifune", "senjumaru-shutara"],
  [
    ["They live far above Soul Society and answer to no captain.", "يعيشون فوق السوسايتي ولا يتبعون أي قائد."],
    ["Each of them invented something the Gotei 13 still depends on.", "كل منهم ابتكر شيئاً ما زال الغوتي ١٣ يعتمد عليه."],
    ["Promoted out of the Gotei 13 to guard the palace itself.", "تمت ترقيتهم من الغوتي ١٣ لحراسة القصر نفسه."],
  ]);

const LIEUTENANTS = () => g("lieut", "Lieutenants of the Gotei 13", "ملازمو الغوتي ١٣",
  ["renji-abarai", "rangiku-matsumoto", "izuru-kira", "shuhei-hisagi"],
  [
    ["Second in command, never first.", "الثاني في القيادة، لا الأول."],
    ["They all carry a badge on the left arm.", "جميعهم يحملون شارة على الذراع اليسرى."],
    ["Same rank across four different squads.", "نفس الرتبة في أربع فرق مختلفة."],
  ]);

export const SOUL_LINK_PUZZLES: LinkPuzzle[] = [
  {
    id: "sl-01",
    groups: [
      XCUTION(),
      g("stolen-bankai", "Had their Bankai stolen by the Sternritter", "سُرق بانكايهم على يد الشترنريتر",
        ["byakuya-kuchiki", "toshiro-hitsugaya", "sajin-komamura", "ikkaku-madarame"],
        [
          ["They each lost something during the first Wandenreich invasion.", "فقد كل منهم شيئاً في الغزو الأول للفاندنرايش."],
          ["A medallion took the one thing they had trained hardest for.", "ميدالية سلبتهم أكثر ما تدربوا عليه."],
          ["Their final release was ripped away and used against them.", "انتُزع إطلاقهم النهائي واستُخدم ضدهم."],
        ]),
      g("vs-askin", "Fought Askin Nakk Le Vaar", "قاتلوا آسكين ناك لي فار",
        ["ichigo-kurosaki", "kisuke-urahara", "yoruichi-shihoin", "grimmjow-jaegerjaquez"],
        [
          ["Four fighters, one shared opponent in the palace.", "أربعة مقاتلين، وخصم واحد مشترك في القصر."],
          ["Their enemy's power was lethal doses — poison, not force.", "قوة خصمهم كانت الجرعات القاتلة — سُمّ لا قوة."],
          ["A Shinigami, a shopkeeper, a cat and an Espada teamed up against The Deathdealing.", "شينيغامي وصاحب متجر وقطة وإسبادا تحالفوا ضد صاحب الجرعة القاتلة."],
        ]),
      g("not-quite", "Neither Shinigami, Hollow nor Quincy", "ليسوا شينيغامي ولا هولو ولا كوينسي",
        ["kon", "zangetsu", "ikomikidomoe", "qais"],
        [
          ["None of them fit any of the three races.", "لا ينتمي أي منهم لأي من الأجناس الثلاثة."],
          ["Some were made, one was never meant to exist at all.", "بعضهم صُنع، وواحد لم يكن يُفترض وجوده أصلاً."],
          ["A mod soul, a sword's spirit, a beast and an outsider.", "روح معدّلة، وروح سيف، ووحش، ودخيل."],
        ]),
    ],
  },
  {
    id: "sl-02",
    groups: [
      SQUAD_ZERO(),
      g("beaten-kenpachi", "Beaten by Kenpachi Zaraki", "هُزموا على يد كينباتشي زاراكي",
        ["nnoitra-gilga", "gremmy-thoumeaux", "retsu-unohana", "ikkaku-madarame"],
        [
          ["One man is the common thread — and he enjoyed every fight.", "رجل واحد هو الرابط — واستمتع بكل نزال."],
          ["Two of these fights happened long before the Blood War.", "نزالان منهما وقعا قبل حرب الدم بزمن."],
          ["They all lost to the man who cannot hear his sword's name.", "خسروا جميعاً أمام من لا يسمع اسم سيفه."],
        ]),
      g("quincy", "Quincy", "الكوينسي",
        ["masaki-kurosaki", "bazz-b", "as-nodt", "yhwach"],
        [
          ["Their power comes from absorbing reishi, not cutting souls.", "قوتهم من امتصاص الرَيشي لا من قطع الأرواح."],
          ["A bow, not a blade.", "قوس لا نصل."],
          ["All four share the same blood the Shinigami once hunted.", "يشتركون في الدم الذي طارده الشينيغامي يوماً."],
        ]),
      g("karakura", "Karakura High classmates", "زملاء ثانوية كاراكورا",
        ["ichigo-kurosaki", "orihime-inoue", "chad-yasutora", "uryu-ishida"],
        [
          ["They sat in the same room long before any of them fought.", "جلسوا في الغرفة نفسها قبل أن يقاتل أي منهم."],
          ["Ordinary teenagers on paper.", "مراهقون عاديون على الورق."],
          ["One classroom in the World of the Living started all of it.", "فصل دراسي واحد في عالم الأحياء بدأ كل شيء."],
        ]),
    ],
  },
  {
    id: "sl-03",
    groups: [
      g("espada", "Espada", "الإسبادا",
        ["ulquiorra-cifer", "grimmjow-jaegerjaquez", "nnoitra-gilga", "szayelaporro-granz"],
        [
          ["Numbered, and proud of the number.", "مرقّمون، وفخورون بالرقم."],
          ["Each carries a tattoo of their rank somewhere on the body.", "كل منهم يحمل وشم رتبته في مكان ما من جسده."],
          ["The top ten Arrancar under Aizen.", "أفضل عشرة أراكار تحت إمرة آيزن."],
        ]),
      g("turned", "Turned on the Gotei 13", "انقلبوا على الغوتي ١٣",
        ["aizen-sosuke", "gin-ichimaru", "kaname-tosen", "azashiro-soya"],
        [
          ["They wore the captain's haori before they wore the enemy's name.", "ارتدوا رداء القيادة قبل أن يحملوا اسم العدو."],
          ["Betrayal, not defeat, ended their service.", "الخيانة لا الهزيمة أنهت خدمتهم."],
          ["Each one left Soul Society by choice — one from a cell.", "غادر كل منهم السوسايتي باختياره — وأحدهم من زنزانة."],
        ]),
      g("kurosaki", "The Kurosaki household", "بيت كوروساكي",
        ["ichigo-kurosaki", "isshin-kurosaki", "masaki-kurosaki", "kon"],
        [
          ["Same roof, same clinic.", "سقف واحد، وعيادة واحدة."],
          ["One of them is not human and still lives there.", "أحدهم ليس بشرياً ومع ذلك يعيش هناك."],
          ["A family — plus the thing hiding in the closet.", "عائلة — بالإضافة إلى ما يختبئ في الخزانة."],
        ]),
      g("rescue-rukia", "Broke into Soul Society to save Rukia", "اقتحموا السوسايتي لإنقاذ روكيا",
        ["orihime-inoue", "chad-yasutora", "ganju-shiba", "hanataro-yamada"],
        [
          ["They entered — or helped others enter — where they did not belong.", "دخلوا — أو ساعدوا غيرهم على الدخول — حيث لا ينتمون."],
          ["Two came through the cannon, two joined from the inside.", "اثنان جاءا عبر المدفع، واثنان انضما من الداخل."],
          ["A rescue mission for one prisoner in the White Tower.", "مهمة إنقاذ لسجينة واحدة في البرج الأبيض."],
        ]),
    ],
  },
  {
    id: "sl-04",
    groups: [
      g("sternritter", "Sternritter", "الشترنريتر",
        ["lille-barro", "jugram-haschwalth", "bambietta-basterbine", "askin-nakk-le-vaar"],
        [
          ["Each of them was given a single letter.", "أُعطي كل منهم حرفاً واحداً."],
          ["Their power was granted, not trained.", "قوتهم مُنحت لهم ولم يتدربوا عليها."],
          ["Yhwach's lettered knights.", "فرسان يهفاخ الحاملون للحروف."],
        ]),
      g("mend", "Keep others alive rather than kill", "يبقون الآخرين أحياءً بدل القتل",
        ["orihime-inoue", "hanataro-yamada", "retsu-unohana", "kirio-hikifune"],
        [
          ["Their gift is restoration, even when they can fight.", "موهبتهم الشفاء حتى لو أجادوا القتال."],
          ["One rejects injury outright, one heals through food.", "واحدة ترفض الإصابة تماماً، وأخرى تشفي بالطعام."],
          ["Four healers from four very different worlds.", "أربعة معالجين من أربعة عوالم مختلفة."],
        ]),
      g("noble", "Born into noble houses", "من العائلات النبيلة",
        ["byakuya-kuchiki", "tokinada-tsunayashiro", "nanao-ise", "ganju-shiba"],
        [
          ["Their surnames opened doors long before their swords did.", "أسماء عائلاتهم فتحت الأبواب قبل سيوفهم."],
          ["Two great houses, one fallen, one cursed.", "بيتان عظيمان، أحدهما ساقط والآخر ملعون."],
          ["Bloodline, not rank, links these four.", "النسب لا الرتبة هو ما يربط هؤلاء الأربعة."],
        ]),
      g("forged-ichigo", "Shaped Ichigo's power", "شكّلوا قوة إيتشيغو",
        ["kisuke-urahara", "zangetsu", "oetsu-nimaiya", "isshin-kurosaki"],
        [
          ["Without them there is no Zangetsu as we know it.", "بدونهم لا وجود لزانغيتسو كما نعرفه."],
          ["One made the tool, one reforged it, one was inside it, one passed it down.", "واحد صنع الأداة، وواحد أعاد صياغتها، وواحد كان بداخلها، وواحد ورّثها."],
          ["Everything about that sword traces back to these four.", "كل ما يتعلق بذلك السيف يعود إلى هؤلاء الأربعة."],
        ]),
    ],
  },
  {
    id: "sl-05",
    groups: [
      g("espada-top", "Espada who held the highest ranks", "إسبادا في أعلى الرتب",
        ["coyote-starrk", "baraggan-louisenbairn", "tier-harribel", "nelliel-tu-odelschwanck"],
        [
          ["Single-digit numbers, all of them low.", "أرقام أحادية، وكلها منخفضة."],
          ["One of them lost the rank and the memories with it.", "واحدة منهم فقدت الرتبة والذاكرة معها."],
          ["The strongest tier of Aizen's army.", "أقوى طبقة في جيش آيزن."],
        ]),
      LIEUTENANTS(),
      g("made-things", "Made, not born", "صُنعوا ولم يولدوا",
        ["nemu-kurotsuchi", "kon", "zangetsu", "pernida-parnkgjas"],
        [
          ["None of them chose to exist.", "لم يختر أي منهم أن يوجد."],
          ["Each is a creation or a piece of someone else.", "كل منهم مخلوق أو جزء من كائن آخر."],
          ["A lab creation, a mod soul, a sword's soul and a severed limb.", "خَلْق مختبري، وروح معدّلة، وروح سيف، وطرف مبتور."],
        ]),
      g("battle-lust", "Live only for the fight", "يعيشون للقتال فقط",
        ["kenpachi-zaraki", "ikkaku-madarame", "yumichika-ayasegawa", "nnoitra-gilga"],
        [
          ["Victory matters less to them than the fight itself.", "النصر أقل أهمية عندهم من النزال نفسه."],
          ["Two of them hide their real strength on purpose.", "اثنان منهم يخفيان قوتهما الحقيقية عمداً."],
          ["They want to die swinging, not ruling.", "يريدون الموت وهم يقاتلون لا وهم يحكمون."],
        ]),
    ],
  },
  {
    id: "sl-06",
    groups: [
      SQUAD_ZERO(),
      g("schutzstaffel", "Yhwach's Schutzstaffel", "حرس يهفاخ الخاص",
        ["gerard-valkyrie", "lille-barro", "pernida-parnkgjas", "askin-nakk-le-vaar"],
        [
          ["A guard within a guard.", "حرس داخل الحرس."],
          ["Three of them are pieces of a far greater being.", "ثلاثة منهم أجزاء من كائن أعظم بكثير."],
          ["The elite chosen to defend the throne itself.", "النخبة المختارة للدفاع عن العرش نفسه."],
        ]),
      XCUTION(),
      g("hueco", "Arrancar of Hueco Mundo", "أراكار هويكو موندو",
        ["nelliel-tu-odelschwanck", "szayelaporro-granz", "grimmjow-jaegerjaquez", "baraggan-louisenbairn"],
        [
          ["Sand, night and a broken mask.", "رمال وليل وقناع مكسور."],
          ["They tore off their own masks to gain a blade.", "نزعوا أقنعتهم لينالوا نصلاً."],
          ["Hollows who became something closer to Shinigami.", "هولو أصبحوا أقرب إلى الشينيغامي."],
        ]),
    ],
  },
  {
    id: "sl-07",
    groups: [
      g("vs-ichigo", "Fought Ichigo one on one", "قاتلوا إيتشيغو وجهاً لوجه",
        ["grimmjow-jaegerjaquez", "ulquiorra-cifer", "byakuya-kuchiki", "kenpachi-zaraki"],
        [
          ["One orange-haired opponent connects all four.", "خصم واحد ذو شعر برتقالي يجمع الأربعة."],
          ["Two of these duels happened in Hueco Mundo.", "نزالان منها وقعا في هويكو موندو."],
          ["Every one of them crossed blades with Ichigo alone.", "كل منهم تبادل الضربات مع إيتشيغو منفرداً."],
        ]),
      g("stern-b", "Sternritter", "الشترنريتر",
        ["as-nodt", "bazz-b", "gremmy-thoumeaux", "bambietta-basterbine"],
        [
          ["Letters, again.", "حروف، مرة أخرى."],
          ["Fear, fire, imagination and explosions.", "خوف ونار وخيال وانفجارات."],
          ["Yhwach's lettered knights.", "فرسان يهفاخ الحاملون للحروف."],
        ]),
      g("captains-war", "Captains during the Blood War", "قادة خلال حرب الدم",
        ["soi-fon", "mayuri-kurotsuchi", "toshiro-hitsugaya", "shunsui-kyoraku"],
        [
          ["Four haori, four squads.", "أربعة أردية، وأربع فرق."],
          ["One of them was promoted during the war itself.", "أحدهم تمت ترقيته أثناء الحرب نفسها."],
          ["All held captaincy when the Wandenreich attacked.", "جميعهم كانوا قادة عند هجوم الفاندنرايش."],
        ]),
      g("nonfighters", "Never meant to be fighters", "لم يُخلقوا للقتال",
        ["tite-kubo", "qais", "don-kanonji", "kon"],
        [
          ["They don't belong on a battlefield at all.", "لا مكان لهم في ساحة المعركة أصلاً."],
          ["One is on television, one is behind the pen.", "واحد على التلفاز، وآخر خلف القلم."],
          ["The joke entries, not the warriors.", "المدخلات الطريفة لا المحاربون."],
        ]),
    ],
  },
  {
    id: "sl-08",
    groups: [
      LIEUTENANTS(),
      g("exiled", "Left Soul Society behind", "غادروا السوسايتي",
        ["shinji-hirako", "kisuke-urahara", "yoruichi-shihoin", "isshin-kurosaki"],
        [
          ["They all ended up living in the World of the Living.", "انتهى بهم الأمر يعيشون في عالم الأحياء."],
          ["One incident a century ago pushed most of them out.", "حادثة واحدة قبل قرن دفعت معظمهم للخروج."],
          ["Former captains and a noble who never came back.", "قادة سابقون ونبيلة لم تعد أبداً."],
        ]),
      g("authority", "Held the highest authority in their world", "امتلكوا أعلى سلطة في عالمهم",
        ["soul-king", "yhwach", "ichibei-hyosube", "genryusai-yamamoto"],
        [
          ["No one above them, only beneath.", "لا أحد فوقهم، الجميع تحتهم."],
          ["Two of them founded what the others defend.", "اثنان منهم أسسا ما يدافع عنه الآخران."],
          ["A throne, a father, a first name and a first captain.", "عرش، وأب، وأول اسم، وأول قائد."],
        ]),
      g("traitors-b", "Betrayed the people closest to them", "خانوا أقرب الناس إليهم",
        ["aizen-sosuke", "gin-ichimaru", "kaname-tosen", "tokinada-tsunayashiro"],
        [
          ["The betrayal was personal, not just political.", "الخيانة كانت شخصية لا سياسية فقط."],
          ["One of them betrayed even his own conspirators.", "أحدهم خان حتى شركاءه في المؤامرة."],
          ["Friends, squads and spouses — all sacrificed.", "أصدقاء وفرق وزوجات — جميعهم ضُحّي بهم."],
        ]),
    ],
  },
];
