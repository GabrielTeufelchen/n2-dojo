// Verify the actual inline progress helpers without adding browser dependencies.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Catch syntax errors in the complete application.
const helpers = script.split('/* ================= Progress helpers (also exercised by tools/ui-check.js) ================= */')[1]
  .split('/* ================= End progress helpers ================= */')[0];
const context = vm.createContext({});
vm.runInContext(helpers, context);
const result = code => JSON.parse(JSON.stringify(vm.runInContext(code, context)));

assert.deepEqual(result(`(()=>{
 const p=mergeProgress({});
 materialProgress(p,'2026-10-25').qs['R-0']=false;
 materialProgress(p,'2026-10-24').qs['R-0']=true;
 materialProgress(p,'2026-10-25').choices['R-0']=2;
 return [p.materials['2026-10-25'].qs['R-0'],p.materials['2026-10-24'].qs['R-0'],p.materials['2026-10-25'].choices['R-0']];
})()`), [false, true, 2], 'Different packs must not share answer state');

assert.deepEqual(result(`(()=>{
 const old={days:{'2026-10-25':{qs:{'R-0':false},listenSec:70,vocab:[2]}},wrong:[]};
 const p=mergeProgress(old);
 p.materials['2026-10-25'].listenSec=90;
 return [p.version,p.days['2026-10-25'].listenSec,mergeProgress(p).materials['2026-10-25'].listenSec];
})()`), [2, 70, 90], 'Legacy migration must preserve records and not alias day/pack state');

assert.deepEqual(result(`(()=>{
 const q={q:'a',options:['x','y'],answer:0};
 const p=mergeProgress({version:2,days:{d:{listenSec:50}},materials:{m:{vocab:[0],qs:{q:false},choices:{q:1},arena:{0:1}}},wrong:[q]},
 {version:2,days:{d:{listenSec:40}},materials:{m:{vocab:[1],qs:{r:true},arena:{0:3}}},wrong:[q,{...q,q:'b'}]});
 return [p.days.d.listenSec,p.materials.m.vocab,p.materials.m.qs,p.materials.m.choices,p.materials.m.arena,p.wrong.length];
})()`), [50,[0,1],{r:true,q:false},{q:1},{0:3},2], 'Import must union progress and wrong questions, not double-count time');

console.log('UI syntax + 3 progress regression checks passed.');

const songs=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'..','songs/index.json'),'utf8'));
const course=songs[0].lesson;
assert.equal(course.lines.length,32);
assert.equal(course.quiz.length,8);
for (const line of course.lines){
 for (const k of ['jp','zh','chunks','grammar','practice'])assert.ok(line[k]);
 assert.equal(/[一-鿿々]/.test(line.jp.replace(/\{[^{}]+\}/g,'')),false,'Every lyric kanji needs a reading');
 assert.equal((line.jp.match(/{/g)||[]).length,(line.jp.match(/}/g)||[]).length);
}
for(const q of course.quiz)assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length&&q.explain);
for(const song of songs)assert.match(song.media.youtube,/^[A-Za-z0-9_-]{11}$/);
assert.deepEqual(result(`(()=>{
 const a={songs:{flower:{learned:[0,1],qs:{0:true},choices:{0:0}}}};
 const b={songs:{flower:{learned:[1,2],qs:{1:false},choices:{1:2}}}};
 const p=mergeProgress(a,b);
 return [p.songs.flower.learned,p.songs.flower.qs,p.songs.flower.choices,mergeProgress(JSON.parse(JSON.stringify(p))).songs.flower.learned];
})()`),[[0,1,2],{1:false,0:true},{1:2,0:0},[0,1,2]],'Song progress must survive backup/import merging independently of daily materials');
console.log('32 lyric annotations, 8 quiz items, official media IDs and song backup regression passed.');
