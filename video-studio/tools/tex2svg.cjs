// Reads a JSON list of TeX strings on stdin and writes the MathJax SVG of each as a JSON list.
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {
  InputJax: new TeX({packages: AllPackages.filter(p => p !== 'bussproofs')}),
  OutputJax: new SVG({fontCache: 'none'}),
});
let input = '';
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  const out = JSON.parse(input).map(tex => {
    const node = doc.convert(tex, {display: true, em: 16, ex: 8, containerWidth: 8000});
    const svg = adaptor.innerHTML(node);
    if (svg.includes('merror') || svg.includes('data-mjx-error')) throw new Error('MathJax rejected: ' + tex);
    return svg;
  });
  process.stdout.write(JSON.stringify(out));
});
