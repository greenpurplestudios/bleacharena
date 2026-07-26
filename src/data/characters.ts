import type { Character } from "@/types/character";
import ichigoImg from "@/assets/characters/ichigo.jpeg.asset.json";
import uraharaImg from "@/assets/characters/urahara.jpeg.asset.json";
import kyorakuImg from "@/assets/characters/kyoraku.jpeg.asset.json";
import ulquiorraImg from "@/assets/characters/ulquiorra.jpeg.asset.json";
import yamadaImg from "@/assets/characters/yamada.jpeg.asset.json";
import ikkakuImg from "@/assets/characters/ikkaku.jpeg.asset.json";
import orihimeImg from "@/assets/characters/orihime.jpeg.asset.json";
import sadoImg from "@/assets/characters/sado.jpeg.asset.json";
import yhwachImg from "@/assets/characters/yhwach.jpeg.asset.json";
import aizenImg from "@/assets/characters/aizen.jpeg.asset.json";
import zarakiImg from "@/assets/characters/zaraki.jpeg.asset.json";
import ishidaImg from "@/assets/characters/ishida.jpeg.asset.json";
import grimjowImg from "@/assets/characters/grimjow.jpeg.asset.json";
import byakuyaImg from "@/assets/characters/byakuya.jpeg.asset.json";
import toshiroImg from "@/assets/characters/toshiro.jpeg.asset.json";
import yoruichiImg from "@/assets/characters/yoruichi.jpeg.asset.json";
import rukiaImg from "@/assets/characters/rukia.jpeg.asset.json";
import renjiImg from "@/assets/characters/renji.jpeg.asset.json";
import askinImg from "@/assets/characters/askin.jpeg.asset.json";
import ichibeiImg from "@/assets/characters/ichebei.jpeg.asset.json";
import lilleImg from "@/assets/characters/lille_baro.jpeg.asset.json";
import shinjiImg from "@/assets/characters/shinji.jpeg.asset.json";
import starkImg from "@/assets/characters/stark.jpeg.asset.json";
import mayuriImg from "@/assets/characters/mayuri.jpeg.asset.json";
import konImg from "@/assets/characters/kon.jpeg.asset.json";
import jugramImg from "@/assets/characters/jugram.jpeg.asset.json";
import hisagiImg from "@/assets/characters/hisagi.jpeg.asset.json";
import nimayaImg from "@/assets/characters/nimaya.jpeg.asset.json";
import yamamotoImg from "@/assets/characters/yamamoto.jpeg.asset.json";
import ganjuImg from "@/assets/characters/ganju_shiba.jpeg.asset.json";
import baraganImg from "@/assets/characters/baragan.jpeg.asset.json";
import donKanojiImg from "@/assets/characters/don_kanoji.jpeg.asset.json";
import senjmaruImg from "@/assets/characters/senjmaru.jpeg.asset.json";
import yumechikaImg from "@/assets/characters/yumechika.jpeg.asset.json";
import soiFonImg from "@/assets/characters/soi_fon.jpeg.asset.json";
import rangikuImg from "@/assets/characters/rangiku.jpeg.asset.json";
import tatsukiImg from "@/assets/characters/tatsuki_arisawa.jpeg.asset.json";
import gintaImg from "@/assets/characters/ginta.jpeg.asset.json";
import keigoImg from "@/assets/characters/keigo.jpeg.asset.json";
import mizuiroImg from "@/assets/characters/mizuiro_kojima.jpeg.asset.json";
import ururuImg from "@/assets/characters/ururu.jpeg.asset.json";
import kuboImg from "@/assets/characters/tite_kubo.jpeg.asset.json";
import gerardImg from "@/assets/characters/gerard.jpeg.asset.json";
import pernidaImg from "@/assets/characters/pernida.jpeg.asset.json";
import tokinadaImg from "@/assets/characters/tokinada.jpeg.asset.json";
import harribelImg from "@/assets/characters/harribel.jpeg.asset.json";
import komamuraImg from "@/assets/characters/komamura.jpeg.asset.json";
import kiraImg from "@/assets/characters/kira.jpeg.asset.json";
import soulKingImg from "@/assets/characters/soul_king.jpeg.asset.json";
import unohanaImg from "@/assets/characters/unohana.jpeg.asset.json";
import ginjoImg from "@/assets/characters/ginjo.jpeg.asset.json";
import tsukishimaImg from "@/assets/characters/tsukishima.jpeg.asset.json";
import kirioImg from "@/assets/characters/kirio.jpeg.asset.json";
import kirinjiImg from "@/assets/characters/kirinji.jpeg.asset.json";
import auraImg from "@/assets/characters/aura.jpeg.asset.json";
import nellielImg from "@/assets/characters/nelliel.jpeg.asset.json";
import ginImg from "@/assets/characters/gin.jpeg.asset.json";
import { rarityFromOverall } from "@/lib/rarity";

// Data-driven roster. New characters can be added freely — game logic
// reads from this list only. Rarity is derived from `overall` at load
// time (see rarityFromOverall). Images may be null until official art is
// wired up (cards render a stylized fallback).
const raw: Omit<Character, "rarity">[] = [
  {
    id: "c-001", slug: "ichigo-kurosaki",
    name: { en: "Ichigo Kurosaki", ar: "إتشيغو كوروساكي" },
    race: "Human / Substitute Shinigami", faction: "Allies", division: null, rank: "Substitute",
    arc: "Thousand-Year Blood War", shikai: "Zangetsu", bankai: "Tensa Zangetsu",
    image: ichigoImg.url,
    overall: 96, tags: ["hero", "hybrid"],
  },
  {
    id: "c-002", slug: "rukia-kuchiki",
    name: { en: "Rukia Kuchiki", ar: "روكيا كوتشيكي" },
    race: "Shinigami", faction: "Gotei 13", division: "13th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Sode no Shirayuki", bankai: "Hakka no Togame",
    image: rukiaImg.url,
    overall: 88,
  },
  {
    id: "c-003", slug: "byakuya-kuchiki",
    name: { en: "Byakuya Kuchiki", ar: "بياكويا كوتشيكي" },
    race: "Shinigami", faction: "Gotei 13", division: "6th", rank: "Captain",
    arc: "Soul Society", shikai: "Senbonzakura", bankai: "Senbonzakura Kageyoshi",
    image: byakuyaImg.url,
    overall: 92,
  },
  {
    id: "c-004", slug: "kenpachi-zaraki",
    name: { en: "Kenpachi Zaraki", ar: "كينباتشي زاراكي" },
    race: "Shinigami", faction: "Gotei 13", division: "11th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Nozarashi", bankai: "Unnamed",
    image: zarakiImg.url,
    overall: 93,
  },
  {
    id: "c-005", slug: "toshiro-hitsugaya",
    name: { en: "Tōshirō Hitsugaya", ar: "توشيرو هيتسوغايا" },
    race: "Shinigami", faction: "Gotei 13", division: "10th", rank: "Captain",
    arc: "Arrancar", shikai: "Hyōrinmaru", bankai: "Daiguren Hyōrinmaru",
    image: toshiroImg.url,
    overall: 89,
  },
  {
    id: "c-006", slug: "renji-abarai",
    name: { en: "Renji Abarai", ar: "رينجي أباراي" },
    race: "Shinigami", faction: "Gotei 13", division: "6th", rank: "Lieutenant",
    arc: "Thousand-Year Blood War", shikai: "Zabimaru", bankai: "Sōō Zabimaru",
    image: renjiImg.url,
    overall: 84,
  },
  {
    id: "c-007", slug: "uryu-ishida",
    name: { en: "Uryū Ishida", ar: "أوريو إيشيدا" },
    race: "Quincy", faction: "Allies / Wandenreich", division: null, rank: "Sternritter A",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: ishidaImg.url,
    overall: 87,
  },
  {
    id: "c-008", slug: "yoruichi-shihoin",
    name: { en: "Yoruichi Shihōin", ar: "يوروئتشي شيهوئين" },
    race: "Shinigami", faction: "Allies", division: null, rank: "Former Captain",
    arc: "Soul Society", shikai: null, bankai: null,
    image: yoruichiImg.url,
    overall: 90,
  },
  {
    id: "c-009", slug: "kisuke-urahara",
    name: { en: "Kisuke Urahara", ar: "كيسوكي أوراهارا" },
    race: "Shinigami", faction: "Allies", division: null, rank: "Former Captain",
    arc: "Thousand-Year Blood War", shikai: "Benihime", bankai: "Kannonbiraki Benihime Aratame",
    image: uraharaImg.url,
    overall: 91,
  },
  {
    id: "c-010", slug: "shunsui-kyoraku",
    name: { en: "Shunsui Kyōraku", ar: "شونسوي كيوراكو" },
    race: "Shinigami", faction: "Gotei 13", division: "1st", rank: "Captain-Commander",
    arc: "Thousand-Year Blood War", shikai: "Katen Kyōkotsu", bankai: "Katen Kyōkotsu: Karamatsu Shinjū",
    image: kyorakuImg.url,
    overall: 94,
  },
  {
    id: "c-011", slug: "grimmjow-jaegerjaquez",
    name: { en: "Grimmjow Jaegerjaquez", ar: "غريمجو ياغرياكيز" },
    race: "Arrancar", faction: "Espada", division: "6", rank: "Sexta Espada",
    arc: "Arrancar", shikai: "Pantera", bankai: null,
    image: grimjowImg.url,
    overall: 88,
  },
  {
    id: "c-012", slug: "ulquiorra-cifer",
    name: { en: "Ulquiorra Cifer", ar: "أولكيورا سيفر" },
    race: "Arrancar", faction: "Espada", division: "4", rank: "Cuarta Espada",
    arc: "Arrancar", shikai: "Murciélago", bankai: null,
    image: ulquiorraImg.url,
    overall: 92,
  },
  {
    id: "c-013", slug: "hanataro-yamada",
    name: { en: "Hanatarō Yamada", ar: "هاناتارو يامادا" },
    race: "Shinigami", faction: "Gotei 13", division: "4th", rank: "7th Seat",
    arc: "Soul Society", shikai: "Hisagomaru", bankai: null,
    image: yamadaImg.url,
    overall: 62,
  },
  {
    id: "c-014", slug: "ikkaku-madarame",
    name: { en: "Ikkaku Madarame", ar: "إكاكو مادارامي" },
    race: "Shinigami", faction: "Gotei 13", division: "11th", rank: "3rd Seat",
    arc: "Soul Society", shikai: "Hōzukimaru", bankai: "Ryūmon Hōzukimaru",
    image: ikkakuImg.url,
    overall: 76,
  },
  {
    id: "c-015", slug: "orihime-inoue",
    name: { en: "Orihime Inoue", ar: "أوريهيمي إينوي" },
    race: "Human / Fullbringer", faction: "Allies", division: null, rank: null,
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: orihimeImg.url,
    overall: 90,
  },
  {
    id: "c-016", slug: "chad-yasutora",
    name: { en: "Yasutora Sado", ar: "ياسوترا سادو" },
    race: "Human / Fullbringer", faction: "Allies", division: null, rank: null,
    arc: "Hueco Mundo", shikai: null, bankai: null,
    image: sadoImg.url,
    overall: 74,
  },
  {
    id: "c-017", slug: "yhwach",
    name: { en: "Yhwach", ar: "يوهاباخ" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Emperor",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: yhwachImg.url,
    overall: 98,
  },
  {
    id: "c-018", slug: "aizen-sosuke",
    name: { en: "Sōsuke Aizen", ar: "سوسكي آيزن" },
    race: "Shinigami / Hōgyoku", faction: "Antagonist", division: "5th", rank: "Former Captain",
    arc: "Fake Karakura", shikai: "Kyōka Suigetsu", bankai: "Unnamed",
    image: aizenImg.url,
    overall: 97,
  },
  {
    id: "c-019", slug: "genryusai-yamamoto",
    name: { en: "Genryūsai Yamamoto", ar: "غينريوساي ياماموتو" },
    race: "Shinigami", faction: "Gotei 13", division: "1st", rank: "Captain-Commander",
    arc: "Thousand-Year Blood War", shikai: "Ryūjin Jakka", bankai: "Zanka no Tachi",
    image: yamamotoImg.url,
    overall: 95,
  },
  {
    id: "c-020", slug: "gin-ichimaru",
    name: { en: "Gin Ichimaru", ar: "غين إيتشيمارو" },
    race: "Shinigami", faction: "Antagonist", division: "3rd", rank: "Former Captain",
    arc: "Fake Karakura", shikai: "Shinsō", bankai: "Kamishini no Yari",
    image: ginImg.url,
    overall: 89,
  },
  {
    id: "c-021", slug: "coyote-starrk",
    name: { en: "Coyote Starrk", ar: "كويوتي ستارك" },
    race: "Arrancar", faction: "Espada", division: "1", rank: "Primera Espada",
    arc: "Fake Karakura", shikai: "Los Lobos", bankai: null,
    image: starkImg.url,
    overall: 87,
  },
  {
    id: "c-022", slug: "shinji-hirako",
    name: { en: "Shinji Hirako", ar: "شينجي هيراكو" },
    race: "Shinigami / Visored", faction: "Gotei 13", division: "5th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Sakanade", bankai: "Sakashima Yokoshima Happōfusagari",
    image: shinjiImg.url,
    overall: 85,
  },
  {
    id: "c-023", slug: "lille-barro",
    name: { en: "Lille Barro", ar: "ليلي بارو" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter X",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: lilleImg.url,
    overall: 93,
  },
  {
    id: "c-024", slug: "askin-nakk-le-vaar",
    name: { en: "Askin Nakk Le Vaar", ar: "أسكين ناك لي فار" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter D",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: askinImg.url,
    overall: 91,
  },
  {
    id: "c-025", slug: "jugram-haschwalth",
    name: { en: "Jugram Haschwalth", ar: "يوغرام هاشفالت" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter B / Grandmaster",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: jugramImg.url,
    overall: 94,
  },
  {
    id: "c-026", slug: "shuhei-hisagi",
    name: { en: "Shūhei Hisagi", ar: "شوهي هيساغي" },
    race: "Shinigami", faction: "Gotei 13", division: "9th", rank: "Lieutenant",
    arc: "Thousand-Year Blood War", shikai: "Kazeshini", bankai: "Fushi no Kōjō",
    image: hisagiImg.url,
    overall: 83,
  },
  {
    id: "c-027", slug: "oetsu-nimaiya",
    name: { en: "Ōetsu Nimaiya", ar: "أويتسو نيمايا" },
    race: "Shinigami / Royal Guard", faction: "Zero Division", division: null, rank: "Zero Division",
    arc: "Thousand-Year Blood War", shikai: "Sayafushi", bankai: null,
    image: nimayaImg.url,
    overall: 92,
  },
  {
    id: "c-028", slug: "ichibei-hyosube",
    name: { en: "Ichibē Hyōsube", ar: "إيتشيبي هيوسوبي" },
    race: "Shinigami / Royal Guard", faction: "Zero Division", division: null, rank: "Monk of the Zero Division",
    arc: "Thousand-Year Blood War", shikai: "Ichimonji", bankai: "Shirafude Ichimonji",
    image: ichibeiImg.url,
    overall: 95,
  },
  {
    id: "c-029", slug: "kon",
    name: { en: "Kon", ar: "كون" },
    race: "Modified Soul", faction: "Allies", division: null, rank: null,
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: konImg.url,
    overall: 18,
  },
  {
    id: "c-030", slug: "mayuri-kurotsuchi",
    name: { en: "Mayuri Kurotsuchi", ar: "مايوري كوروتسوتشي" },
    race: "Shinigami", faction: "Gotei 13", division: "12th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Ashisogi Jizō", bankai: "Konjiki Ashisogi Jizō",
    image: mayuriImg.url,
    overall: 92,
  },
  {
    id: "c-031", slug: "rangiku-matsumoto",
    name: { en: "Rangiku Matsumoto", ar: "رانغيكو ماتسوموتو" },
    race: "Shinigami", faction: "Gotei 13", division: "10th", rank: "Lieutenant",
    arc: "Arrancar", shikai: "Haineko", bankai: null,
    image: rangikuImg.url,
    overall: 78,
  },
  {
    id: "c-032", slug: "yumichika-ayasegawa",
    name: { en: "Yumichika Ayasegawa", ar: "يوميتشيكا أياسيغاوا" },
    race: "Shinigami", faction: "Gotei 13", division: "11th", rank: "5th Seat",
    arc: "Soul Society", shikai: "Ruri'iro Kujaku", bankai: null,
    image: yumechikaImg.url,
    overall: 75,
  },
  {
    id: "c-033", slug: "tite-kubo",
    name: { en: "Tite Kubo — The Writer", ar: "تايتي كوبو — الكاتب" },
    race: "Mangaka / Writer", faction: "Beyond the Story", division: null, rank: "The Author",
    arc: "All Arcs", shikai: "Pen of Creation", bankai: "Final Chapter",
    image: kuboImg.url,
    overall: 100,
    tags: ["creator", "secret"],
  },
  {
    id: "c-034", slug: "ganju-shiba",
    name: { en: "Ganju Shiba", ar: "غانجو شيبا" },
    race: "Human / Shiba", faction: "Allies", division: null, rank: null,
    arc: "Soul Society", shikai: null, bankai: null,
    image: ganjuImg.url,
    overall: 42,
  },
  {
    id: "c-035", slug: "jinta-hanakari",
    name: { en: "Jinta Hanakari", ar: "جينتا هاناكاري" },
    race: "Human", faction: "Urahara Shop", division: null, rank: null,
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: gintaImg.url,
    overall: 32,
  },
  {
    id: "c-036", slug: "ururu-tsumugiya",
    name: { en: "Ururu Tsumugiya", ar: "أوروارو تسوموغيا" },
    race: "Human", faction: "Urahara Shop", division: null, rank: null,
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: ururuImg.url,
    overall: 52,
  },
  {
    id: "c-037", slug: "keigo-asano",
    name: { en: "Keigo Asano", ar: "كيغو أسانو" },
    race: "Human", faction: "Karakura Friends", division: null, rank: null,
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: keigoImg.url,
    overall: 20,
  },
  {
    id: "c-038", slug: "mizuiro-kojima",
    name: { en: "Mizuiro Kojima", ar: "ميزويرو كوجيما" },
    race: "Human", faction: "Karakura Friends", division: null, rank: null,
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: mizuiroImg.url,
    overall: 24,
  },
  {
    id: "c-039", slug: "tatsuki-arisawa",
    name: { en: "Tatsuki Arisawa", ar: "تاتسوكي أريساوا" },
    race: "Human", faction: "Karakura Friends", division: null, rank: null,
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: tatsukiImg.url,
    overall: 50,
  },
  {
    id: "c-040", slug: "don-kanonji",
    name: { en: "Don Kanonji", ar: "دون كانونجي" },
    race: "Human / Spiritualist", faction: "Comedic Relief", division: null, rank: "Karakura Superhero",
    arc: "Agent of the Shinigami", shikai: null, bankai: null,
    image: donKanojiImg.url,
    overall: 33,
  },
  {
    id: "c-041", slug: "senjumaru-shutara",
    name: { en: "Senjumaru Shutara", ar: "سنجومارو شوتارا" },
    race: "Shinigami / Royal Guard", faction: "Zero Division", division: null, rank: "Zero Division",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: senjmaruImg.url,
    overall: 93,
  },
  {
    id: "c-042", slug: "soi-fon",
    name: { en: "Soi Fon", ar: "سوي فون" },
    race: "Shinigami", faction: "Gotei 13", division: "2nd", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Suzumebachi", bankai: "Jakuhō Raikōben",
    image: soiFonImg.url,
    overall: 86,
  },
  {
    id: "c-043", slug: "baraggan-louisenbairn",
    name: { en: "Baraggan Louisenbairn", ar: "براغان لويزنباين" },
    race: "Arrancar", faction: "Espada", division: "2", rank: "Segunda Espada",
    arc: "Fake Karakura", shikai: "Arrogante", bankai: null,
    image: baraganImg.url,
    overall: 87,
  },
  {
    id: "c-044", slug: "gerard-valkyrie",
    name: { en: "Gerard Valkyrie", ar: "غيرارد فالكيري" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter M",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: gerardImg.url,
    overall: 92,
  },
  {
    id: "c-045", slug: "pernida-parnkgjas",
    name: { en: "Pernida Parnkgjas", ar: "برنيدا بارنكياس" },
    race: "Quincy / Soul King's Left Hand", faction: "Wandenreich", division: null, rank: "Sternritter C",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: pernidaImg.url,
    overall: 90,
  },
  {
    id: "c-046", slug: "tokinada-tsunayashiro",
    name: { en: "Tokinada Tsunayashiro", ar: "توكينادا تسوناياشيرو" },
    race: "Shinigami / Noble", faction: "Antagonist", division: null, rank: "Noble Head",
    arc: "Can't Fear Your Own World", shikai: "Nejibana", bankai: null,
    image: tokinadaImg.url,
    overall: 90,
  },
  {
    id: "c-047", slug: "tier-harribel",
    name: { en: "Tier Harribel", ar: "تير هاريبل" },
    race: "Arrancar", faction: "Espada", division: "3", rank: "Tres Espada",
    arc: "Fake Karakura", shikai: "Tiburón", bankai: null,
    image: harribelImg.url,
    overall: 86,
  },
  {
    id: "c-048", slug: "sajin-komamura",
    name: { en: "Sajin Komamura", ar: "ساجين كوماموارا" },
    race: "Werewolf / Shinigami", faction: "Gotei 13", division: "7th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Tenken", bankai: "Kokujō Tengen Myō'ō",
    image: komamuraImg.url,
    overall: 87,
  },
  {
    id: "c-049", slug: "izuru-kira",
    name: { en: "Izuru Kira", ar: "إيزورو كيرا" },
    race: "Shinigami", faction: "Gotei 13", division: "3rd", rank: "Lieutenant",
    arc: "Thousand-Year Blood War", shikai: "Wabisuke", bankai: null,
    image: kiraImg.url,
    overall: 82,
  },
];