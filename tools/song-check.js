const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),songs=JSON.parse(fs.readFileSync(path.join(root,'songs/index.json'),'utf8'));
const ids=new Set(),dates=new Set();
for(const s of songs){
 assert.ok(!ids.has(s.id),'Song IDs must be unique');ids.add(s.id);
 assert.match(s.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(!dates.has(s.date),'Only one song per date');dates.add(s.date);
 assert.ok(s.goals.length>=3);assert.match(s.media.youtube,/^[\w-]{11}$/);
 assert.ok(s.lesson.lines.length>=6);assert.ok(s.lesson.quiz.length>=6);
 if(s.lesson.kind==='transfer'){
  assert.ok(s.listeningTasks.length>=3);assert.match(s.lesson.source,/原创.*不是歌词/);
 }
 for(const line of s.lesson.lines){
  for(const k of ['jp','zh','chunks','grammar','practice'])assert.ok(typeof line[k]==='string'&&line[k].trim());
  assert.ok(!/[一-鿿々]/.test(line.jp.replace(/\{[^{}]+\}/g,'')),`Missing reading: ${line.jp}`);
 }
 for(const q of s.lesson.quiz){
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length&&q.explain);
  if(s.lesson.kind==='transfer'){assert.equal(q.why.length,q.options.length);assert.ok(q.why[q.answer].startsWith('✓'));assert.ok(q.point);}
 }
}
const script=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const helper=script.slice(script.indexOf('function chooseDailySong('),script.indexOf('function vSongs('));
const context=vm.createContext({songs});vm.runInContext(helper,context);
assert.equal(vm.runInContext("chooseDailySong(songs,'2026-10-25').id",context),'sekai-ni-hitotsu');
assert.equal(vm.runInContext("chooseDailySong(songs,'2026-10-26').id",context),'lemon');
assert.equal(vm.runInContext("chooseDailySong(songs,'2026-10-27').id",context),'hatsukoi');
assert.equal(vm.runInContext("chooseDailySong(songs,'2026-10-24')",context),null);
assert.ok(vm.runInContext("chooseDailySong(songs,'2099-01-01').date <= '2099-01-01'",context));
console.log(`${songs.length} dated song courses validated; date selection and missing-date fallback passed.`);
