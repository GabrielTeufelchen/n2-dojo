// 打印生成某天教材需要的上下文：周主题、当天轮换的题型、最近用过的单词/文化、上一集大人の会話
// 用法：node tools/context.js 2026-10-25
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0];
const THEMES = new Function(js.slice(js.indexOf("const THEMES"), js.indexOf("const dayKey")) + "; return THEMES;")();
const id = process.argv[2]; if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) { console.error("用法：node tools/context.js YYYY-MM-DD"); process.exit(1); }
const [y, m, d] = id.split("-").map(Number), day = new Date(y, m - 1, d), START = new Date(2026, 9, 19);
const n = Math.round((day - START) / 864e5), week = Math.max(1, Math.floor(n / 7) + 1);
const theme = THEMES[Math.min(week, THEMES.length) - 1];
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, "packs/index.json"), "utf8")).filter(x => x < id);
const packs = ids.map(x => JSON.parse(fs.readFileSync(path.join(ROOT, "packs", x + ".json"), "utf8")));
const plain = s => String(s).replace(/\{([^|{}]+)\|[^{}]+\}/g, "$1");
const last = packs[packs.length - 1];
console.log(JSON.stringify({
  id, weekday: "日月火水木金土"[day.getDay()], week, theme: `W${week} ${theme}`, weekend: [0, 6].includes(day.getDay()),
  rotation: {
    arena: n % 2 === 0 ? ["問題3 語形成", "問題5 言い換え類義"] : ["問題6 用法", "問題9 文章の文法"],
    listeningExam: ["問題3 概要理解", "問題5 統合理解", "問題1 課題理解"][((n % 3) + 3) % 3],
    reading: ["問題10 内容理解（短文）", "問題11 内容理解（中文）", "問題12 統合理解", "問題13 主張理解（長文）", "問題14 情報検索", "問題10 内容理解（短文・メール）"][((n % 6) + 6) % 6]
  },
  avoidVocab: packs.slice(-14).flatMap(p => p.vocab.map(v => v.w)),
  usedGrammar: packs.slice(-14).flatMap(p => p.grammar.map(g => g.pt)),
  usedCulture: packs.map(p => plain(p.culture.title)),
  lastAdult: last && { date: last.id, title: plain(last.adult.title), setting: last.adult.setting, lastLines: last.adult.lines.slice(-5).map(l => `${l.sp}：${plain(l.ja)}`) }
}, null, 1));
