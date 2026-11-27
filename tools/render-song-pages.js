const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'songs');
const songs = JSON.parse(fs.readFileSync(path.join(out, 'index.json'), 'utf8'))
  .sort((a, b) => b.date.localeCompare(a.date));
function text(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replace(/\{([^|{}]+)\|([^{}]+)\}/g, '$1（$2）');
}
function list(items, tag = 'ul') {
  return items?.length ? '<' + tag + '>' + items.map(x => '<li>' + text(x) + '</li>').join('') + '</' + tag + '>' : '';
}
function player(s) {
  if (!s.media.youtube) return '';
  const url = 'https://www.youtube.com/embed/' + encodeURIComponent(s.media.youtube) + '?playsinline=1';
  return '<iframe title="' + text(s.title + ' · ' + s.media.label) + '" src="' + url
    + '" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen'
    + ' referrerpolicy="strict-origin-when-cross-origin" style="display:block;width:100%;aspect-ratio:16/9;min-height:200px;border:0"></iframe>';
}
function lesson(s) {
  return '<h2>' + text(s.title) + '</h2><p>' + text(s.artist) + ' · ' + text(s.date) + '</p>' + player(s) + '<p>' + text(s.media.label) + '</p><p>' + text(s.about) + '</p><h3>学习目标</h3>' + list(s.goals)
    + (s.listeningTasks?.length ? '<h3>听辨</h3>' + list(s.listeningTasks) : '')
    + s.sections.map(part => '<h3>' + text(part.h) + '</h3><p>' + text(part.sum) + '</p>' + list(part.words?.map(w => w.w + '　' + w.zh))).join('')
    + '<h3>语法</h3>' + list(s.grammar) + '<h3>逐句学习</h3><p>' + text(s.lesson.source) + '</p>'
    + s.lesson.lines.map(l => '<section><h4 lang="ja">' + text(l.jp) + '</h4>' + [l.zh,l.chunks,l.grammar,l.practice].filter(Boolean).map(x => '<p>' + text(x) + '</p>').join('') + '</section>').join('')
    + '<h3>检测题</h3>' + s.lesson.quiz.map((q,i) => '<h4>' + (i+1) + '. ' + text(q.q) + '</h4>' + list(q.options,'ol') + '<p>答案 ' + (q.answer+1) + '　' + text(q.explain) + '</p>' + list(q.why) + '<p>' + text(q.point) + '</p>').join('');
}
function page(title, body) {
  return '<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + text(title) + ' · N2 道場</title><style>body{max-width:48rem;margin:auto;padding:1rem;font:1rem/1.65 system-ui}h3{margin-top:2rem}</style><main>' + body + '</main></html>\n';
}
const links = songs.map(s => '<li><a href="' + encodeURIComponent(s.id) + '.html">' + text(s.date + ' · ' + s.title + ' · ' + s.artist) + '</a></li>').join('\n');
for (const s of songs) {
  if (!/^[a-z0-9-]+$/.test(s.id)) throw Error('Invalid song ID: ' + s.id);
  fs.writeFileSync(path.join(out,s.id+'.html'),page(s.title,'<a href="./">全部歌曲</a> · <a href="../#songs">互动课程</a>' + lesson(s)));
}
fs.writeFileSync(path.join(out,'index.html'),page('歌曲课文本版','<h1>歌曲课文本版</h1><ul>' + links + '</ul>'));
const index = path.join(root,'index.html');
const html = fs.readFileSync(index,'utf8');
const catalog = links.replaceAll('href="', 'href="songs/');
const fallback = '<article id="songs"><h1>N2 道場 · 日本の歌</h1><p>共 ' + songs.length
  + ' 首歌。每课约 15～20 分钟，可听官方音源、逐句学习、做选择题。</p>'
  + '<h2>歌单</h2><ul>' + catalog + '</ul>' + lesson(songs[0]) + '</article>';
const marker = /<article id="songs">[\s\S]*?<\/article>/;
if (!marker.test(html)) throw Error('Missing static song section');
fs.writeFileSync(index, html.replace(marker, () => fallback));
