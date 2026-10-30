/* Validate authored lab routes, embedded readings and progress-key contracts. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = __dirname;
const source = fs.readFileSync(path.join(base, 'practical-data.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
vm.runInNewContext(fs.readFileSync(path.join(base, 'practical.js'), 'utf8'), context);
const labs = context.window.CV_PRACTICAL_DATA;
assert.equal(labs.length, 12);
assert.equal(new Set(labs.map(l => l.slug)).size, labs.length);
const main = {innerHTML: ''};
const state = {sessions: [], notes: {}};
const notes = (key) => `<textarea data-note="${key}"></textarea>`;
context.window.CV_PRACTICAL.render(main, undefined, state, notes);
assert.equal((main.innerHTML.match(/class="panel practical-card"/g)||[]).length, 12);
for (const lab of labs) {
  assert(fs.existsSync(path.join(base,'practical',lab.file)), lab.file);
  assert(lab.requires.length && [...lab.requires, ...lab.related].every(n => Number.isInteger(n) && n >= 1 && n <= 68));
  assert(lab.html.includes('<h2>') && lab.html.includes('<pre'), lab.slug);
  assert(!/<script\b/i.test(lab.html));
  context.window.CV_PRACTICAL.render(main, lab.slug, state, notes);
  assert.equal((main.innerHTML.match(/<h1>/g)||[]).length, 1);
  assert.equal((main.innerHTML.match(/type="checkbox"/g)||[]).length, 3);
  assert(main.innerHTML.includes(`data-note="practical-${lab.id}"`));
  for (let i = 0; i < lab.checks.length; i++) state.sessions.push(`practical-${lab.id}-${i}`);
}
context.window.CV_PRACTICAL.render(main, undefined, state, notes);
assert(main.innerHTML.includes('12 / 12 labs evidenced'));
context.window.CV_PRACTICAL.render(main, 'invalid-route', state, notes);
assert(main.innerHTML.includes('From equations'));
console.log('Practical CV: 12 routes, 36 evidence keys, offline content and prerequisite links passed.');
