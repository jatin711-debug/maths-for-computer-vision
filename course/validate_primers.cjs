// Checks every primer file: schema, unique term ids, links between lessons, TeX that KaTeX can render, and plots that draw.
// Run from the workspace root or the course folder: node course/validate_primers.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = __dirname;
const katex = require(path.join(dir, 'vendor/katex/katex.min.js'));

const window = {};
const context = vm.createContext({window, console, Math, CSS: {escape: s => s}});
const run = file => vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
run(path.join(dir, 'course-data.js'));
run(path.join(dir, 'primers.js'));
const files = fs.readdirSync(path.join(dir, 'primers')).filter(f => f.endsWith('.js')).sort();
files.forEach(f => run(path.join(dir, 'primers', f)));

const course = window.CV_COURSE, P = window.CV_PRIMER;
const lessonIds = new Set(course.lessons.map(l => l.id));
const studyPosition = id => course.path.order.indexOf(id);
const issues = [];
const fail = (where, msg) => issues.push(`${where}: ${msg}`);
const firstLesson = new Map();
const tex = (where, text) => {
  const re = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
  let m, count = 0;
  while ((m = re.exec(text))) {
    count++;
    try { katex.renderToString(m[1] ?? m[2], {throwOnError: true, strict: 'ignore'}); } catch (e) { fail(where, `TeX error in "${(m[1] ?? m[2]).slice(0, 60)}": ${e.message.split('\n')[0]}`); }
  }
  const stripped = text.replace(re, '');
  if (/\\[a-zA-Z]+|\^|_\{/.test(stripped)) fail(where, `TeX outside \\( \\): "${stripped.match(/.{0,20}(\\[a-zA-Z]+|\^|_\{).{0,20}/)[0]}"`);
  return count;
};
const rawTex = (where, s) => { try { katex.renderToString(s, {throwOnError: true, strict: 'ignore'}); } catch (e) { fail(where, `TeX error: ${e.message.split('\n')[0]}`); } };

let termCount = 0;
const lessonsWithPrimers = Object.keys(P.lessons).map(Number).sort((a, b) => a - b);
for (const id of lessonsWithPrimers) {
  const spec = P.lessons[id], at = `Lesson ${id}`;
  if (!lessonIds.has(id)) fail(at, 'no such lesson');
  if (!Array.isArray(spec.terms) || !spec.terms.length) { fail(at, 'no terms'); continue; }
  if (spec.terms.length > 6) fail(at, `${spec.terms.length} terms (keep it to the 2-6 genuinely new ideas)`);
  for (const t of spec.terms) {
    const w = `${at} term ${t.id}`;
    termCount++;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id || '')) fail(w, 'id must be kebab-case');
    if (firstLesson.has(t.id)) fail(w, `duplicate id (also Lesson ${firstLesson.get(t.id)})`); else firstLesson.set(t.id, id);
    for (const k of ['term', 'plain']) if (!t[k] || typeof t[k] !== 'string') fail(w, `missing ${k}`);
    if ((t.plain || '').length > 520) fail(w, `plain is ${t.plain.length} characters; keep it under 520`);
    if (!t.steps?.length && !t.examples?.length) fail(w, 'needs steps or examples (how to calculate it)');
    if ((t.steps || []).length > 6) fail(w, 'more than 6 steps');
    if ((t.examples || []).length > 6) fail(w, 'more than 6 examples');
    if (t.symbol) rawTex(`${w} symbol`, t.symbol);
    if (t.formula) rawTex(`${w} formula`, t.formula);
    tex(`${w} plain`, t.plain || '');
    (t.steps || []).forEach((s, i) => tex(`${w} step ${i + 1}`, s));
    (t.examples || []).forEach((e, i) => { if (!Array.isArray(e) || e.length !== 2) fail(w, `example ${i + 1} must be [input, result]`); else e.forEach(x => tex(`${w} example ${i + 1}`, x)); });
    if (t.pitfall) tex(`${w} pitfall`, t.pitfall);
    (t.seeAlso || []).forEach(n => { if (!lessonIds.has(n)) fail(w, `seeAlso lesson ${n} does not exist`); else if (studyPosition(n) <= studyPosition(id)) fail(w, `seeAlso lesson ${n} is not later than ${id} in study order`); });
    if (t.plot) {
      try {
        const f = new Function(`return (${t.plot.fn})`)();
        const [a, b] = t.plot.x, [c, d] = t.plot.y;
        if (!(a < b && c < d)) fail(w, 'plot ranges must increase');
        const ys = Array.from({length: 101}, (_, i) => f(a + (b - a) * i / 100));
        const finite = ys.filter(Number.isFinite);
        if (finite.length < 90) fail(w, 'plot function is not finite over most of its range');
        if (!finite.some(y => y >= c && y <= d)) fail(w, 'plot curve never enters the y range');
        (t.plot.marks || []).forEach(x => { const y = f(x); if (!(x >= a && x <= b && y >= c && y <= d)) fail(w, `plot mark x=${x} (y=${y}) is outside the plot`); });
        P.plot(t.plot, t.id);
      } catch (e) { fail(w, `plot error: ${e.message}`); }
    }
  }
  (spec.builds || []).forEach(b => { if (!lessonIds.has(b.lesson) || studyPosition(b.lesson) >= studyPosition(id)) fail(at, `builds lesson ${b.lesson} must come earlier in study order`); if (!b.why) fail(at, `builds lesson ${b.lesson} needs why`); });
  (spec.symbols || []).forEach(([s, m, term]) => { if (!s || !m) fail(at, 'symbol rows need [symbol, meaning]'); if (term && !spec.terms.some(t => t.id === term)) fail(at, `symbol ${s} points to term ${term}, which is not in this lesson`); if ((m || '').length > 90) fail(at, `symbol ${s} meaning is ${m.length} characters; keep it under 90`); });
  P.panel(id);
}
for (const id of lessonsWithPrimers) {
  (P.lessons[id].recall || []).forEach(r => {
    if (!firstLesson.has(r)) fail(`Lesson ${id}`, `recall "${r}" is not a term id`);
    else if (studyPosition(firstLesson.get(r)) >= studyPosition(id)) fail(`Lesson ${id}`, `recall "${r}" is introduced in Lesson ${firstLesson.get(r)}, not earlier in study order`);
  });
}
const missing = course.lessons.map(l => l.id).filter(id => !P.lessons[id]);
const report = {checkedAt: new Date().toISOString(), files, lessons: lessonsWithPrimers.length, terms: termCount, lessonsWithoutPrimers: missing, issues};
fs.writeFileSync(path.join(dir, 'primer-validation.json'), JSON.stringify(report, null, 2));
console.log(`${files.length} files, ${lessonsWithPrimers.length} lessons, ${termCount} terms, ${issues.length} issues${missing.length ? `; lessons without primers: ${missing.join(', ')}` : ''}`);
issues.slice(0, 60).forEach(i => console.log('  - ' + i));
process.exit(issues.length ? 1 : 0);
