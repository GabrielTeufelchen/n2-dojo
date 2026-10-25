// 检查一套教材是否完整：结构、数量、answer 范围、why 数量、读音标记、当天轮换题型
// 用法：node tools/check.js packs/base/2026-10-25.json
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const f = process.argv[2], p = JSON.parse(fs.readFileSync(f, "utf8")), errs = [];
const ctx = JSON.parse(execFileSync("node", [path.join(__dirname, "context.js"), p.id], { encoding: "utf8" }));
const need = (c, m) => { if (!c) errs.push(m); };
const kanjiBare = s => /[一-鿿々]/.test(String(s).replace(/\{[^{}]+\}/g, ""));
const Q = (q, w, n) => { need(Array.isArray(q.options) && q.options.length === n, `${w} 选项数应为 ${n}`); need(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.options || []).length, `${w} answer 越界`);
  need(q.explain, `${w} 缺 explain`); need(q.point, `${w} 缺 point`); if (!/組み立て/.test(w)) need(Array.isArray(q.why) && q.why.length === (q.options || []).length, `${w} why 数量不对`); };
const ja = (s, w) => { if (kanjiBare(s)) errs.push(`${w} 有没标读音的汉字：${String(s).replace(/\{[^{}]+\}/g, "").match(/[一-鿿々]+/g).join("、")}`); };
need(p.listening.length === 4, "listening 要 4 段（3 段故事 + 1 段試験形式）");
p.listening.forEach((s, si) => { need(s.tip, `L${si} 缺 tip`); s.lines.forEach((l, i) => ja(l.ja, `L${si}-${i}`)); s.questions.forEach((q, qi) => Q(q, `L${si} 题${qi}`, 4)); });
need(p.listening[3] && p.listening[3].task === ctx.rotation.listeningExam, `第 4 段 task 应为 ${ctx.rotation.listeningExam}`);
need(p.reading && p.reading.type && p.reading.type.startsWith(ctx.rotation.reading.split("（")[0]), `reading.type 应为 ${ctx.rotation.reading}`);
(p.reading?.text || []).forEach((t, i) => ja(t, `読解 段${i}`)); (p.reading?.questions || []).forEach((q, i) => Q(q, `読解 题${i}`, 4));
need(p.vocab.length === 10 && p.vocab.every(v => v.note), "vocab 要 10 个且都有 note");
p.vocab.forEach((v, i) => { ja(v.ex, `V${i} 例句`); need(!ctx.avoidVocab.includes(v.w), `V${i} ${v.w} 最近用过`); });
need(p.grammar.length === 2, "grammar 要 2 个"); p.grammar.forEach((g, gi) => { need((g.teach || []).length >= 4, `G${gi} teach 少于 4 条`); g.examples.forEach((e, i) => ja(e.ja, `G${gi} 例${i}`)); g.quiz.forEach((q, qi) => Q(q, `G${gi} 题${qi}`, 4)); });
need(p.shadow.length === 6, "shadow 要 6 句"); p.shadow.forEach((s, i) => ja(s.ja, `S${i}`));
ja(p.roleplay.partner, "roleplay.partner"); ja(p.roleplay.model, "roleplay.model");
const names = ["問題1", "問題2", ...ctx.rotation.arena.map(x => x.split(" ")[0]), "問題4", "問題7", "問題8"].sort((a, b) => +a.slice(2) - +b.slice(2));
const got = p.arena.map(a => a.reply ? "聴解" : a.name.split(" ")[0]);
need(JSON.stringify(got) === JSON.stringify([...names, "聴解"]), `闘技場顺序应为 ${[...names, "聴解"].join(" ")}，实际 ${got.join(" ")}`);
p.arena.forEach(a => { need(a.items.length === 5, `${a.name} 要 5 题`); a.items.forEach((q, qi) => Q(q, `${a.name} 题${qi}`, a.reply ? 3 : 4)); if (/問題9/.test(a.name)) need((a.passage || []).length, "問題9 缺 passage"); });
need(p.adult.lines.length >= 16 && p.adult.notes.length >= 8, "adult 要 ≥16 句、notes ≥8 条"); p.adult.lines.forEach((l, i) => ja(l.ja, `X${i}`));
const dist = p.arena.flatMap(a => a.items.map(q => q.answer)); need(new Set(dist).size >= 3, "答案位置太集中");
if (errs.length) { console.log("✗ " + errs.length + " 个问题：\n- " + errs.join("\n- ")); process.exit(1); } else console.log("✓ 检查通过", p.id);
