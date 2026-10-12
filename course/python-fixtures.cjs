/* Export independent JavaScript reference results for validate_python_examples.py. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = {};
const context = vm.createContext({window});
const extensionFiles = fs.existsSync(path.join(__dirname, 'extensions')) ? fs.readdirSync(path.join(__dirname, 'extensions')).filter(f => /^lesson-\d+\.js$/.test(f)).sort().map(f => 'extensions/' + f) : [];
for (const file of ['lesson-guides.js', 'lesson-tutor.js', 'extensions.js', ...extensionFiles]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context);
}
const fixtures = Object.entries(window.CV_GUIDES).map(([key, guide]) => {
  const id = Number(key);
  const configs = guide.controls.reduce((rows, control) => {
    const middle = control.min + Math.round((control.max - control.min) / (2 * control.step)) * control.step;
    const values = [...new Set([control.min, control.value, middle, control.max])];
    return rows.flatMap(params => values.map(value => [...params, value]));
  }, [[]]);
  return {
    id,
    cases: configs.map(params => ({params, values: window.CV_TUTOR.calculate(id, params).values})),
  };
});
process.stdout.write(JSON.stringify(fixtures));
