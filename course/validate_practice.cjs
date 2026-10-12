/* Run with node course/validate_practice.cjs. Exercises every practice generator across many seeds. No packages or server required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const katex = require('./vendor/katex/katex.min.js');
const SEEDS = Number(process.env.PRACTICE_SEEDS || 300);
const window = {};
const context = vm.createContext({window, Math, Number, String, Array, Object, JSON, Set, Map, Error});
const banks = fs.readdirSync(__dirname).filter(f => /^practice-bank-.*\.js$/.test(f)).sort();
const extensionFiles = fs.existsSync(path.join(__dirname, 'extensions')) ? fs.readdirSync(path.join(__dirname, 'extensions')).filter(f => /^lesson-\d+\.js$/.test(f)).sort().map(f => 'extensions/' + f) : [];
for (const file of ['course-data.js', 'practice-engine.js', ...banks, 'extensions.js', ...extensionFiles]) vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, {filename: file});
const {CV_COURSE: course, CV_PRACTICE: P} = window;
const report = {banks, seedsPerGenerator: SEEDS, lessons: 0, generators: 0, instances: 0, texSegments: 0, issues: [], warnings: [], thinLessons: [], perLesson: {}};
const issue = (where, message) => { if (report.issues.length < 400) report.issues.push({where, message}); };
const tex = (where, text) => {
  for (const m of String(text).matchAll(/\\\(([\s\S]*?)\\\)/g)) {
    report.texSegments++;
    try { katex.renderToString(m[1], {throwOnError: true, strict: 'ignore'}); } catch (e) { issue(where, 'TeX: ' + e.message.slice(0, 160)); }
  }
  if ((String(text).match(/\\\(/g) || []).length !== (String(text).match(/\\\)/g) || []).length) issue(where, 'Unbalanced \\( \\) delimiters');
};
const typedForm = (v, spec) => {
  if (Number.isInteger(v)) return String(v);
  const dp = spec.tol !== undefined && spec.tol < .005 && spec.tol !== 0 ? 4 : 2;
  return String(Number(v.toFixed(dp)));
};
for (const lesson of course.lessons) {
  const gens = P.bank[lesson.id] || [];
  report.perLesson[lesson.id] = gens.length;
  if (gens.length < 3) report.thinLessons.push(lesson.id);
  if (!gens.length) continue;
  report.lessons++;
  const keys = new Set();
  for (const g of gens) {
    report.generators++;
    const where = `Lesson ${lesson.id} ${g.key}`;
    if (!/^[\w-]+$/.test(g.key || '')) issue(where, 'Key must use letters, digits, - or _');
    if (keys.has(g.key)) issue(where, 'Duplicate key'); keys.add(g.key);
    if (!g.skill) issue(where, 'Missing skill');
    const prompts = new Set();
    for (let seed = 1; seed <= SEEDS; seed++) {
      let q;
      try { q = P.instance(g, seed * 2654435761 >>> 0); } catch (e) { issue(where, `seed ${seed}: make() threw ${e.message}`); break; }
      report.instances++;
      const again = P.instance(g, seed * 2654435761 >>> 0);
      if (again.prompt !== q.prompt) { issue(where, 'Not deterministic for a fixed seed'); break; }
      prompts.add(q.prompt);
      for (const field of ['prompt', 'hint', 'solution']) {
        if (typeof q[field] !== 'string' || !q[field].trim()) { issue(where, `Missing ${field}`); continue; }
        // Flag values that leaked from broken arithmetic, not the words themselves ("the loss becomes NaN" is fine).
        if (/undefined|\[object|[\d.=(,\-]\s*(?:NaN|Infinity)|(?:NaN|Infinity)\s*[\d.)]|\bnull\b(?! ?(?:spaces?|hypothes))/.test(q[field])) issue(where, `${field} contains NaN/undefined/Infinity/null: ${q[field].slice(0, 120)}`);
        if (seed <= 40) tex(`${where} ${field}`, q[field]);
      }
      if (!Array.isArray(q.answers) || !q.answers.length) { issue(where, 'No answers'); continue; }
      q.answers.forEach((a, i) => {
        const at = `${where} answer ${i}`;
        if (a.label && seed <= 40) tex(at + ' label', a.label);
        if (a.choices) {
          if (!Array.isArray(a.choices) || a.choices.length < 2 || !Number.isInteger(a.correct) || a.correct < 0 || a.correct >= a.choices.length) issue(at, 'Bad choices/correct');
          if (new Set(a.choices).size !== a.choices.length) issue(at, 'Duplicate choices');
          if (!P.checkAnswer(a, String(a.correct)).ok) issue(at, 'Correct choice rejected');
          if (seed <= 40) a.choices.forEach((c, j) => tex(`${at} choice ${j}`, c));
          return;
        }
        const values = a.vector ?? [a.value];
        if (!values.every(Number.isFinite)) { issue(at, `Non-finite expected value ${JSON.stringify(values)} (seed ${seed})`); return; }
        const typed = a.vector ? values.map(v => typedForm(v, a)).join(', ') : typedForm(a.value, a);
        if (!P.checkAnswer(a, typed).ok) issue(at, `Rounded answer ${typed} rejected (seed ${seed}); loosen tol or ask for a rounded value`);
        const wrong = a.vector ? values.map((v, k) => k === 0 ? v + Math.max(1, Math.abs(v) * .5) : v).join(', ') : String(a.value + Math.max(1, Math.abs(a.value) * .5));
        if (P.checkAnswer(a, wrong).ok) issue(at, `Clearly wrong answer ${wrong} accepted; tolerance too loose`);
        const zero = a.vector ? values.map(() => 0).join(', ') : '0';
        if (values.some(v => Math.abs(v) > 1e-9) && P.checkAnswer(a, zero).ok && !report.warnings.some(x => x.where === at)) report.warnings.push({where: at, message: `Typing 0 is accepted for ${JSON.stringify(values.map(v => Number(v.toPrecision(3))))} (seed ${seed}); consider an explicit tol`});
      });
    }
    if (prompts.size < Math.min(5, SEEDS)) issue(where, `Only ${prompts.size} distinct prompts across ${SEEDS} seeds`);
  }
}
// The answer parser itself.
const parse = [['2/3', 2 / 3], ['ln(3)', Math.log(3)], ['ln3', Math.log(3)], ['sqrt(2)/2', Math.SQRT1_2], ['2pi', 2 * Math.PI], ['-2^2', -4], ['2^-1', .5], ['1e-3', .001], ['3,072', 3072], ['e^2', Math.E ** 2], ['50%', .5], ['−0.25', -.25], ['3 × 4', 12]];
for (const [text, expected] of parse) { const v = P.parseExpression(text); if (Math.abs(v - expected) > 1e-12) issue('parser', `${text} gave ${v}`); }
for (const [text, expected] of [['(8, 3)', [8, 3]], ['8x3', [8, 3]], ['[0.2,-0.3,0.1]', [.2, -.3, .1]], ['1 2 3', [1, 2, 3]]]) { const v = P.parseList(text); if (JSON.stringify(v) !== JSON.stringify(expected)) issue('parser', `${text} gave ${JSON.stringify(v)}`); }
for (const bad of ['alert(1)', '2+', 'x+1', '()']) { try { P.parseExpression(bad); issue('parser', `${bad} should be rejected`); } catch {} }
fs.writeFileSync(path.join(__dirname, 'practice-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.generators} generators in ${report.lessons} lessons, ${report.instances} instances, ${report.texSegments} TeX segments, ${report.issues.length} issues, ${report.warnings.length} warnings. Lessons with fewer than 3 generators: ${report.thinLessons.length ? report.thinLessons.join(', ') : 'none'}.`);
if (report.issues.length) { console.log(report.issues.slice(0, 30)); process.exitCode = 1; }
