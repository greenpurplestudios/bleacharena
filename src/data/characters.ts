import type { Character, Rarity } from "@/types/character";
import founderIchigoImg from "@/assets/characters/founder_ichigo_horn_of_salvation.jpeg.asset.json";
import founderToshiroImg from "@/assets/characters/founder_adult_toshiro.jpeg.asset.json";
import founderZarakiImg from "@/assets/characters/founder_bankai_zaraki.jpeg.asset.json";
import founderAizenImg from "@/assets/characters/founder_muken_aizen.jpeg.asset.json";
import founderGerardImg from "@/assets/characters/founder_gerard_ultimate_miracle.jpeg.asset.json";
import isshinImg from "@/assets/characters/isshin.jpeg.asset.json";
import masakiImg from "@/assets/characters/masaki.jpeg.asset.json";
import zangetsuImg from "@/assets/characters/zangetsu.jpeg.asset.json";
import asNodtImg from "@/assets/characters/as_nodt.jpeg.asset.json";
import gremmyImg from "@/assets/characters/gremmy.jpeg.asset.json";
import nnoitraImg from "@/assets/characters/nnoitra.jpeg.asset.json";
import rirukaImg from "@/assets/characters/riruka.jpeg.asset.json";
import yukioImg from "@/assets/characters/yukio.jpeg.asset.json";
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
import ukitakeImg from "@/assets/characters/ukitake.jpeg.asset.json";
import nanaoImg from "@/assets/characters/nanao.jpeg.asset.json";
import azashiroImg from "@/assets/characters/azashiro.jpeg.asset.json";
import nemuImg from "@/assets/characters/nemu.jpeg.asset.json";
import bambiettaImg from "@/assets/characters/bambietta.jpeg.asset.json";
import bazzardImg from "@/assets/characters/bazzard_black.jpeg.asset.json";
import ikomekidomoeImg from "@/assets/characters/ikomekidomoe.jpeg.asset.json";
import tosenImg from "@/assets/characters/tosen.jpeg.asset.json";
import szayelImg from "@/assets/characters/szayel_apporo.jpeg.asset.json";
import qaisImg from "@/assets/characters/qais.jpeg.asset.json";
import { rarityFromOverall } from "@/lib/rarity";

// Data-driven roster. New characters can be added freely — game logic
// reads from this list only. Rarity is derived from `overall` at load
// time (see rarityFromOverall). Images may be null until official art is
// wired up (cards render a stylized fallback).
const raw: (Omit<Character, "rarity"> & { rarity?: Rarity })[] = [
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
    overall: 91,
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
    overall: 93,
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
    overall: 88,
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
    overall: 90,
  },
  {
    id: "c-022", slug: "shinji-hirako",
    name: { en: "Shinji Hirako", ar: "شينجي هيراكو" },
    race: "Shinigami / Visored", faction: "Gotei 13", division: "5th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Sakanade", bankai: "Sakashima Yokoshima Happōfusagari",
    image: shinjiImg.url,
    overall: 87,
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
    overall: 91,
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
    overall: 89,
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
  {
    id: "c-050", slug: "soul-king",
    name: { en: "The Soul King", ar: "ملك الأرواح" },
    race: "Soul King", faction: "Royal Palace", division: null, rank: "Sovereign",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: soulKingImg.url,
    overall: 99, tags: ["cosmic"],
  },
  {
    id: "c-051", slug: "retsu-unohana",
    name: { en: "Retsu Unohana", ar: "ريتسو أونوهانا" },
    race: "Shinigami", faction: "Gotei 13", division: "4th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Minazuki", bankai: "Minazuki",
    image: unohanaImg.url,
    overall: 92,
  },
  {
    id: "c-052", slug: "kugo-ginjo",
    name: { en: "Kūgo Ginjō", ar: "كوغو غينجو" },
    race: "Human / Fullbringer", faction: "Xcution", division: null, rank: "Leader",
    arc: "Lost Substitute Shinigami", shikai: "Cross of Scaffold", bankai: null,
    image: ginjoImg.url,
    overall: 87,
  },
  {
    id: "c-053", slug: "shukuro-tsukishima",
    name: { en: "Shūkurō Tsukishima", ar: "شوكورو تسوكيشيما" },
    race: "Human / Fullbringer", faction: "Xcution", division: null, rank: null,
    arc: "Lost Substitute Shinigami", shikai: "Book of the End", bankai: null,
    image: tsukishimaImg.url,
    overall: 85,
  },
  {
    id: "c-054", slug: "kirio-hikifune",
    name: { en: "Kirio Hikifune", ar: "كيريو هيكيفوني" },
    race: "Shinigami / Royal Guard", faction: "Zero Division", division: null, rank: "Zero Division",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: kirioImg.url,
    overall: 92,
  },
  {
    id: "c-055", slug: "tenjiro-kirinji",
    name: { en: "Tenjirō Kirinji", ar: "تنجيرو كيرينجي" },
    race: "Shinigami / Royal Guard", faction: "Zero Division", division: null, rank: "Zero Division",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: kirinjiImg.url,
    overall: 92,
  },
  {
    id: "c-056", slug: "aura-michibane",
    name: { en: "Aura Michibane", ar: "أورا ميتشيباني" },
    race: "Shinigami / Reikon Kyuuban", faction: "Antagonist", division: null, rank: null,
    arc: "Hell Verse", shikai: null, bankai: null,
    image: auraImg.url,
    overall: 90,
  },
  {
    id: "c-057", slug: "nelliel-tu-odelschwanck",
    name: { en: "Nelliel Tu Odelschwanck", ar: "نيليل تو أوديلشوانك" },
    race: "Arrancar", faction: "Espada", division: "3", rank: "Former Tres Espada",
    arc: "Hueco Mundo", shikai: "Gamuza", bankai: null,
    image: nellielImg.url,
    overall: 88,
  },
  {
    id: "c-058", slug: "jushiro-ukitake",
    name: { en: "Jūshirō Ukitake", ar: "جوشيرو أوكيتاكي" },
    race: "Shinigami", faction: "Gotei 13", division: "13th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Sōgyo no Kotowari", bankai: null,
    image: ukitakeImg.url,
    overall: 92,
  },
  {
    id: "c-059", slug: "nanao-ise",
    name: { en: "Nanao Ise", ar: "ناناو إيسي" },
    race: "Shinigami", faction: "Gotei 13", division: "1st", rank: "Lieutenant",
    arc: "Thousand-Year Blood War", shikai: "Shinken Hakkyōken", bankai: null,
    image: nanaoImg.url,
    overall: 81,
  },
  {
    id: "c-060", slug: "azashiro-soya",
    name: { en: "Azashiro Sōya", ar: "أزاشيرو سويا" },
    race: "Shinigami", faction: "Antagonist", division: null, rank: "Former Captain",
    arc: "Bount", shikai: null, bankai: null,
    image: azashiroImg.url,
    overall: 90,
  },
  {
    id: "c-061", slug: "nemu-kurotsuchi",
    name: { en: "Nemu Kurotsuchi", ar: "نيمو كوروتسوتشي" },
    race: "Shinigami / Modified", faction: "Gotei 13", division: "12th", rank: "Lieutenant",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: nemuImg.url,
    overall: 87,
  },
  {
    id: "c-062", slug: "bambietta-basterbine",
    name: { en: "Bambietta Basterbine", ar: "بامبييتا باستربين" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter E",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: bambiettaImg.url,
    overall: 87,
  },
  {
    id: "c-063", slug: "bazz-b",
    name: { en: "Bazz-B", ar: "باز-ب" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter H",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: bazzardImg.url,
    overall: 88,
  },
  {
    id: "c-064", slug: "ikomikidomoe",
    name: { en: "Ikomikidomoe", ar: "إيكوميكيدومي" },
    race: "Zanpakutō Spirit", faction: "Zero Division", division: null, rank: "Sword Guardian",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: ikomekidomoeImg.url,
    overall: 91,
  },
  {
    id: "c-065", slug: "kaname-tosen",
    name: { en: "Kaname Tōsen", ar: "كانامي توسِن" },
    race: "Shinigami / Visored", faction: "Antagonist", division: "9th", rank: "Former Captain",
    arc: "Fake Karakura", shikai: "Suzumushi", bankai: "Suzumushi Tsuishiki: Enma Kōrogi",
    image: tosenImg.url,
    overall: 86,
  },
  {
    id: "c-066", slug: "szayelaporro-granz",
    name: { en: "Szayelaporro Granz", ar: "سزايلابورو غرانز" },
    race: "Arrancar", faction: "Espada", division: "8", rank: "Octava Espada",
    arc: "Hueco Mundo", shikai: "Fornicarás", bankai: null,
    image: szayelImg.url,
    overall: 88,
  },
  {
    id: "c-067", slug: "qais",
    name: { en: "Qais", ar: "قيس" },
    race: "Developer", faction: "Developer", division: null, rank: "Developer",
    arc: "Behind the Scenes", shikai: null, bankai: null,
    image: qaisImg.url,
    overall: 1,
    tags: ["developer", "secret"],
  },
  {
    id: "c-068", slug: "isshin-kurosaki",
    name: { en: "Isshin Kurosaki", ar: "إيسشين كوروساكي" },
    race: "Shinigami", faction: "Soul Society", division: "10th", rank: "Former Captain",
    arc: "Fake Karakura", shikai: "Engetsu", bankai: null,
    image: isshinImg.url,
    overall: 92,
  },
  {
    id: "c-069", slug: "masaki-kurosaki",
    name: { en: "Masaki Kurosaki", ar: "ماساكي كوروساكي" },
    race: "Quincy", faction: "Quincy", division: null, rank: "Echt Quincy",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: masakiImg.url,
    overall: 92, gender: "female",
  },
  {
    id: "c-070", slug: "zangetsu",
    name: { en: "Zangetsu", ar: "زانغيتسو" },
    race: "Zanpakutō Spirit", faction: "Allies", division: null, rank: "Inner Spirit",
    arc: "Thousand-Year Blood War", shikai: "Zangetsu", bankai: "Tensa Zangetsu",
    image: zangetsuImg.url,
    overall: 95, gender: "other",
  },
  {
    id: "c-071", slug: "as-nodt",
    name: { en: "Äs Nödt", ar: "آس نودت" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter F",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: asNodtImg.url,
    overall: 88,
  },
  {
    id: "c-072", slug: "gremmy-thoumeaux",
    name: { en: "Gremmy Thoumeaux", ar: "غريمي ثومو" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter V",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: gremmyImg.url,
    overall: 90,
  },
  {
    id: "c-073", slug: "nnoitra-gilga",
    name: { en: "Nnoitra Gilga", ar: "نويترا غيلغا" },
    race: "Arrancar", faction: "Espada", division: null, rank: "Quinta Espada",
    arc: "Arrancar", shikai: "Santa Teresa", bankai: null,
    image: nnoitraImg.url,
    overall: 86,
  },
  {
    id: "c-074", slug: "riruka-dokugamine",
    name: { en: "Riruka Dokugamine", ar: "ريروكا دوكوغامين" },
    race: "Human / Fullbringer", faction: "Xcution", division: null, rank: null,
    arc: "Lost Agent", shikai: null, bankai: null,
    image: rirukaImg.url,
    overall: 78,
  },
  {
    id: "c-075", slug: "yukio-vorarlberna",
    name: { en: "Yukio Hans Vorarlberna", ar: "يوكيو هانز فورارلبيرنا" },
    race: "Human / Fullbringer", faction: "Xcution", division: null, rank: null,
    arc: "Lost Agent", shikai: null, bankai: null,
    image: yukioImg.url,
    overall: 76,
  },
  /* ------------------------------------------------------------ founders */
  /* Limited Founder editions. Separate cards — the base characters above are
     untouched (art, rating, rarity, faction, element, abilities). */
  {
    id: "c-f01", slug: "founder-ichigo-horn",
    name: { en: "Horn of Salvation Ichigo", ar: "إتشيغو قرن الخلاص" },
    race: "Human / Substitute Shinigami", faction: "Allies", division: null, rank: "Substitute",
    arc: "Thousand-Year Blood War", shikai: "Zangetsu", bankai: "Tensa Zangetsu",
    image: founderIchigoImg.url,
    rarity: "founder", overall: 99, tags: ["founder"],
  },
  {
    id: "c-f02", slug: "founder-toshiro-adult",
    name: { en: "Adult Tōshirō", ar: "توشيرو البالغ" },
    race: "Shinigami", faction: "Gotei 13", division: "10th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Hyōrinmaru", bankai: "Daiguren Hyōrinmaru",
    image: founderToshiroImg.url,
    rarity: "founder", overall: 95, tags: ["founder"],
  },
  {
    id: "c-f03", slug: "founder-zaraki-bankai",
    name: { en: "Bankai Zaraki", ar: "زاراكي البانكاي" },
    race: "Shinigami", faction: "Gotei 13", division: "11th", rank: "Captain",
    arc: "Thousand-Year Blood War", shikai: "Nozarashi", bankai: "Unnamed",
    image: founderZarakiImg.url,
    rarity: "founder", overall: 97, tags: ["founder"],
  },
  {
    id: "c-f04", slug: "founder-aizen-muken",
    name: { en: "Muken Aizen", ar: "آيزن الموكين" },
    race: "Shinigami / Hōgyoku", faction: "Antagonist", division: "5th", rank: "Former Captain",
    arc: "Thousand-Year Blood War", shikai: "Kyōka Suigetsu", bankai: "Unnamed",
    image: founderAizenImg.url,
    rarity: "founder", overall: 98, tags: ["founder"],
  },
  {
    id: "c-f05", slug: "founder-gerard-miracle",
    name: { en: "Gerard — The Miracle", ar: "غيرارد — المعجزة" },
    race: "Quincy", faction: "Wandenreich", division: null, rank: "Sternritter M",
    arc: "Thousand-Year Blood War", shikai: null, bankai: null,
    image: founderGerardImg.url,
    rarity: "founder", overall: 97, tags: ["founder"],
  },
  {
    id: "c-f06", slug: "founder-orihime-awakened",
    name: { en: "Awakened Orihime", ar: "أوريهيمي الإطلاق الكامل" },
    race: "Human / Fullbring", faction: "Allies", division: null, rank: null,
    arc: "Thousand-Year Blood War", shikai: "Shun Shun Rikka", bankai: null,
    image: founderOrihimeImg.url,
    gender: "female",
    rarity: "founder", overall: 99, tags: ["founder"],
  },
];

export const characters: Character[] = raw.map((c) => ({
  ...c,
  rarity: c.rarity ?? rarityFromOverall(c.overall),
  gender: c.gender ?? inferGender(c.id),
}));

/** Founder editions are excluded from the daily puzzle modes. */
export const isFounder = (c: Character): boolean => c.rarity === "founder";

/** Roster used by Bleachdle / Soul Links — no Founder editions. */
export const puzzleCharacters: Character[] = characters.filter((c) => !isFounder(c));

function inferGender(id: string): "male" | "female" | "other" {
  const female = new Set([
    "c-002", "c-008", "c-015", "c-031", "c-041", "c-042", "c-047",
    "c-051", "c-054", "c-056", "c-057", "c-059", "c-061", "c-062",
    "c-074",
  ]);
  const other = new Set(["c-050", "c-064"]);
  if (female.has(id)) return "female";
  if (other.has(id)) return "other";
  return "male";
}