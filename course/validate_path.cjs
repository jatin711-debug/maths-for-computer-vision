// Checks the study path: order, module blocks, dependencies, lab placement, workload and the documents built from them.
// Run from the workspace root or the course folder: node course/validate_path.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = __dirname;
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');

const window = {};
const context = vm.createContext({window, console, Math, CSS: {escape: s => s}});
const run = file => vm.runInContext(read(file), context, {filename: file});
run('course-data.js');
run('practical-data.js');
run('primers.js');
fs.readdirSync(path.join(dir, 'primers')).filter(f => f.endsWith('.js')).sort().forEach(f => run(`primers/${f}`));

const course = window.CV_COURSE, labs = window.CV_PRACTICAL_DATA, primers = window.CV_PRIMER;
const issues = [];
const fail = (where, message) => issues.push(`${where}: ${message}`);
const {order, weeks, coreWeeks} = course.path;
const position = id => order.indexOf(id);
const lessonById = id => course.lessons.find(l => l.id === id);
const moduleById = id => course.modules.find(m => m.n === id);

// The order is a permutation, and every module is one unbroken block.
const ids = course.lessons.map(l => l.id).sort((a, b) => a - b);
if (JSON.stringify([...order].sort((a, b) => a - b)) !== JSON.stringify(ids)) fail('Study path', 'order must list every lesson exactly once');
for (const module of course.modules) {
  const blocks = weeks.map(w => w.module).filter((n, i, all) => n === module.n && all[i - 1] !== n);
  if (blocks.length !== 1) fail(`Module ${module.n}`, `split into ${blocks.length} blocks`);
  const expected = course.lessons.filter(l => l.module === module.n).map(l => l.id).sort((a, b) => a - b);
  if (JSON.stringify([...module.lessonIds].sort((a, b) => a - b)) !== JSON.stringify(expected)) fail(`Module ${module.n}`, 'lessonIds disagree with the lessons’ own module field');
  const listed = module.lessons.map(line => parseInt(line, 10)).sort((a, b) => a - b);
  if (JSON.stringify(listed) !== JSON.stringify(expected)) fail(`Module ${module.n}`, 'the course map lists different lessons');
  if (!course.notebooks.some(nb => nb.modules.includes(module.n))) fail(`Module ${module.n}`, 'has no notebook');
}
for (const notebook of course.notebooks) if (!fs.existsSync(path.join(dir, notebook.href))) fail(notebook.href, 'file is missing');

// Every declared dependency points backwards in study order.
const taughtIn = new Map();
for (const [id, spec] of Object.entries(primers.lessons)) (spec.terms || []).forEach(t => taughtIn.set(t.id, Number(id)));
const needs = new Map();
for (const lesson of course.lessons) {
  const id = lesson.id, spec = primers.lessons[id] || {};
  const before = new Set((spec.builds || []).map(b => b.lesson));
  const header = /^\*\*Before you begin:\*\*(.*)$/m.exec(read(lesson.file));
  if (!header && id > 4) fail(`Lesson ${id}`, 'has no Before you begin line');
  else if (header) for (const group of header[1].match(/Lessons? (?:\d{2}(?:, | and )?)+/g) || []) (group.match(/\d{2}/g) || []).forEach(n => { if (Number(n) !== id) before.add(Number(n)); });
  needs.set(id, before);
  for (const n of before) if (position(n) >= position(id)) fail(`Lesson ${id}`, `needs Lesson ${n}, which comes later in study order`);
  for (const term of spec.recall || []) if (taughtIn.has(term) && position(taughtIn.get(term)) >= position(id)) fail(`Lesson ${id}`, `recalls ${term}, taught later in Lesson ${taughtIn.get(term)}`);
  const stated = /^\*\*Module:\*\* (\d+)/m.exec(read(lesson.file));
  if (stated && Number(stated[1]) !== lesson.module) fail(`Lesson ${id}`, `page says Module ${stated[1]}, data says ${lesson.module}`);
}

// An optional lesson's stated opening point covers everything it transitively needs.
const closure = (id, seen = new Set()) => { for (const n of needs.get(id) || []) if (!seen.has(n)) { seen.add(n); closure(n, seen); } return seen; };
for (const lesson of course.lessons.filter(l => moduleById(l.module).extension)) {
  if (!lesson.opensAfter) { fail(`Lesson ${lesson.id}`, 'has no opensAfter'); continue; }
  for (const n of closure(lesson.id)) if (position(n) > position(lesson.opensAfter)) fail(`Lesson ${lesson.id}`, `opens after ${lesson.opensAfter} but needs Lesson ${n}`);
  if (!moduleById(lesson.module).after.includes(`Lesson ${lesson.id} after Lesson ${lesson.opensAfter}`)) fail(`Lesson ${lesson.id}`, 'its module note disagrees with opensAfter');
}

// The plan matches the path, and no week goes over the promised hours.
if (course.plan.length !== weeks.length) fail('Plan', `${course.plan.length} weeks against ${weeks.length} in the path`);
course.plan.forEach((sessions, i) => {
  const minutes = sessions.reduce((sum, s) => sum + s.minutes, 0), week = i + 1;
  if (minutes < 480 || minutes > 600) fail(`Week ${week}`, `${minutes} minutes is outside 8-10 hours`);
  if (i > 1) for (const id of weeks[i].lessons) if (!sessions.some(s => s.lesson === id)) fail(`Week ${week}`, `no session for Lesson ${id}`);
});

// Each lab comes after what it needs, and its sessions match its stated time.
const firstWeek = slug => course.plan.findIndex(sessions => sessions.some(s => s.lab === slug));
for (const lab of labs) {
  const start = firstWeek(lab.slug);
  if (start < 0) { fail(`Lab ${lab.id}`, 'is not in the weekly plan'); continue; }
  for (const n of lab.requires) if (lessonById(n).week > start + 1) fail(`Lab ${lab.id}`, `week ${start + 1} is before required Lesson ${n} (week ${lessonById(n).week})`);
  for (const n of lab.requires) if (lab.related.includes(n)) fail(`Lab ${lab.id}`, `Lesson ${n} is both required and related`);
  const minutes = course.plan.flat().filter(s => s.lab === lab.slug).reduce((sum, s) => sum + s.minutes, 0);
  const [low, high] = lab.time.match(/\d+/g).map(Number);
  if (minutes < low * 60 || minutes > high * 60) fail(`Lab ${lab.id}`, `${minutes} planned minutes is outside its ${lab.time}`);
  if (!lab.file || !fs.existsSync(path.join(dir, 'practical', lab.file))) fail(`Lab ${lab.id}`, 'guide file is missing');
}

// The assessment routes to real lessons.
const questions = course.assessmentGuide.map(item => item.question);
if (JSON.stringify(questions) !== JSON.stringify(course.assessment.map((_, i) => i + 1))) fail('Assessment', 'guide does not cover every question');
for (const item of course.assessmentGuide) if (!lessonById(item.lesson)) fail('Assessment', `question ${item.question} points at a missing lesson`);

// Every lesson has a video, and every video's files exist.
['concept-video-data.js', 'lesson-video-data.js', 'explainer-video-data.js'].forEach(run);
const videos = [...window.CV_CONCEPT_VIDEO_DATA, ...window.CV_LESSON_VIDEO_DATA, ...window.CV_EXPLAINER_VIDEO_DATA];
for (const lesson of course.lessons) if (!videos.some(v => v.lesson === lesson.id)) fail(`Lesson ${lesson.id}`, 'has no video');
for (const video of videos) {
  for (const key of ['src', 'poster', 'captions']) if (!fs.existsSync(path.join(dir, video[key].split('?')[0]))) fail(video.id, `${key} file is missing`);
  if (!video.chapters.length) fail(video.id, 'has no chapters');
}

// Documents agree with the path, and nothing still points at what was retired.
const syllabus = read('syllabus.md'), root = fs.readFileSync(path.join(dir, '..', 'README.md'), 'utf8');
const extensionWeeks = weeks.length - coreWeeks;
if (!syllabus.includes(`${coreWeeks}-week core with a ${extensionWeeks}-week extension`)) fail('syllabus.md', 'title disagrees with the path; run build_syllabus.py');
for (const module of course.modules) {
  if (!new RegExp(`Module ${String(module.n).padStart(2, '0')} - .*Weeks? ${module.weeks}\\b`).test(syllabus)) fail('syllabus.md', `Module ${module.n} weeks disagree with the path`);
  if (!root.includes(`| ${String(module.n).padStart(2, '0')} | ${module.title} |`)) fail('README.md', `Module ${module.n} is missing from the table or has an old title`);
}
if (!root.includes(`${coreWeeks}-week core`)) fail('README.md', 'core length disagrees with the path');
const retired = /linear-algebra-and-pca|calculus-and-probability|learning-and-backprop|vision-and-metrics|report-template|build_continuation_notebooks|Copy answers|our chat/;
for (const file of ['README.md', 'syllabus.md', 'first-two-weeks.md', 'starting-assessment.md', 'app.js', 'practical.js', 'course-data.js', 'practical-data.js', 'practical/README.md']) {
  if (retired.test(read(file))) fail(file, `still mentions something retired: ${retired.exec(read(file))[0]}`);
}

console.log(`Study path: ${order.length} lessons, ${weeks.length} weeks (${coreWeeks} core), ${labs.length} labs, ${course.notebooks.length} notebooks, ${videos.length} lesson videos, ${issues.length} issues`);
issues.forEach(issue => console.log('  - ' + issue));
process.exitCode = issues.length ? 1 : 0;
