const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),plan=JSON.parse(fs.readFileSync(path.join(root,'grammar-path.json'),'utf8'));
const ids=new Set(),dates=new Set(),titles=new Set();
for(const l of plan.lessons){
 assert.match(l.date,/^\d{4}-\d{2}-\d{2}$/);assert(!ids.has(l.id));ids.add(l.id);assert(!dates.has(l.date));dates.add(l.date);
 if(l.kind==='review'){assert(l.reviewIds.length);continue;}
 assert.equal(l.kind,'new');assert(!titles.has(l.title),'New topics must not disguise repeats');titles.add(l.title);
 for(const k of ['meaning','form','note'])assert(l[k]);assert(l.examples.length>=2);assert(l.quiz.length>=2);
 for(const e of l.examples){assert(e.zh);assert(!/[一-鿿々]/.test(e.ja.replace(/\{[^{}]+\}/g,'')),'Missing reading: '+e.ja);}
 for(const q of l.quiz){assert.equal(q.options.length,4);assert(q.answer>=0&&q.answer<4);assert.equal(q.why.length,4);assert(q.why[q.answer].startsWith('✓'));assert(q.explain&&q.point);}
}
for(let i=1;i<plan.lessons.length;i++)assert.equal(Date.parse(plan.lessons[i].date)-Date.parse(plan.lessons[i-1].date),864e5,'No gaps or reordered dates');
for(const l of plan.lessons.filter(l=>l.kind==='review'))for(const id of l.reviewIds){const target=plan.lessons.find(x=>x.id===id);assert(target?.kind==='new'&&target.date<l.date,'Review must reference an earlier new lesson');}
const script=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const helpers=script.split('/* ================= Progress helpers (also exercised by tools/ui-check.js) ================= */')[1].split('/* ================= End progress helpers ================= */')[0];
const context=vm.createContext({plan});vm.runInContext(helpers,context);
vm.runInContext(script.slice(script.indexOf('function grammarReviewIds('),script.indexOf('function grammarPathProgress(')),context);
assert.equal(vm.runInContext("grammarReviewIds(plan,'2026-11-03').join(',')",context),'gx-2026-10-31,gx-2026-10-27');
const merged=JSON.parse(vm.runInContext(`JSON.stringify(mergeProgress({version:2,grammarPath:{one:{qs:{a:false},choices:{a:1}}},materials:{old:{qs:{a:true}}}},{version:2,grammarPath:{one:{qs:{b:true},choices:{b:0}},two:{qs:{a:true}}}}))`,context));
assert.deepEqual(merged.grammarPath.one.qs,{b:true,a:false});assert.deepEqual(merged.grammarPath.one.choices,{b:0,a:1});assert.equal(merged.materials.old.qs.a,true);assert.equal(merged.grammarPath.two.qs.a,true);
console.log(`${plan.lessons.length} consecutive days; ${titles.size} new topics; review scheduling and isolated backup merge passed.`);
