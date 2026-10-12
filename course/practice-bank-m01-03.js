/* Auto-checked question generators for Modules 01-03 (Lessons 01-12). See practice-engine.js for the format. */
(() => {
  'use strict';
  const P = window.CV_PRACTICE, Q = String.raw;
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.join('&')).join(Q`\\`)}\end{bmatrix}`;

  P.add(1, [
    {key: 'mean-pixels', skill: 'Mean of a small grayscale image', make(r) {
      const v = Array.from({length: 4}, () => 10 * r.int(0, 25));
      const mean = v.reduce((s, x) => s + x, 0) / 4;
      return {prompt: Q`A grayscale image is \(I=${mat([v.slice(0, 2), v.slice(2)])}\). What is its mean pixel value?`,
        answers: [{label: 'Mean', value: mean}],
        hint: 'Add all four entries, then divide by the number of pixels.',
        solution: Q`The sum is \(${v.join('+')}=${4 * mean}\). Dividing by 4 pixels gives \(${mean}\).`};
    }},
    {key: 'zero-index', skill: 'Read an entry with zero-based indexing', make(r) {
      const rows = r.int(2, 3), cols = 3, v = r.distinct(rows * cols, 1, 99).map(x => x * 2);
      const grid = Array.from({length: rows}, (_, i) => v.slice(i * cols, i * cols + cols));
      const i = r.int(0, rows - 1), j = r.int(0, cols - 1);
      return {prompt: Q`Using zero-based (row, column) indexing, what is \(I[${i},${j}]\) for \(I=${mat(grid)}\)?`,
        answers: [{label: Q`\(I[${i},${j}]\)`, value: grid[i][j], tol: 0}],
        hint: 'Row 0 is the top row and column 0 is the left column. Count rows first.',
        solution: Q`Row ${i} is \((${grid[i].join(', ')})\). Its column ${j} entry is \(${grid[i][j]}\).`};
    }},
    {key: 'affine-clip', skill: 'Scale, shift and clip pixel values', make(r) {
      const v = Array.from({length: 4}, () => 20 * r.int(1, 12)), a = r.pick([1.5, 2, 2.5]), b = r.pick([-40, -20, 10, 20]);
      const raw = v.map(x => a * x + b), clipped = raw.map(x => Math.min(255, Math.max(0, x)));
      const mean = clipped.reduce((s, x) => s + x, 0) / 4;
      return {prompt: Q`Compute \(J=${a}I${b < 0 ? b : '+' + b}\) for pixel values \(I=(${v.join(', ')})\), clip every entry to \([0,255]\), then give the mean of the clipped values.`,
        answers: [{label: 'Mean after clipping', value: mean}],
        hint: 'Transform each value first. Only entries outside 0-255 change when you clip.',
        solution: Q`Before clipping \(J=(${raw.join(', ')})\). After clipping \((${clipped.join(', ')})\), whose mean is \(${mean}\).`};
    }},
    {key: 'tensor-size', skill: 'Count the values in an image batch', make(r) {
      const n = r.pick([4, 8, 16, 32]), h = r.pick([28, 32, 64]), c = r.pick([1, 3]);
      return {prompt: Q`A batch has shape \((${n}, ${h}, ${h}, ${c})\): batch, height, width, channels. How many numbers does it store?`,
        answers: [{label: 'Values', value: n * h * h * c, tol: 0}],
        hint: 'Multiply the sizes of all four axes.',
        solution: Q`\(${n}\times${h}\times${h}\times${c}=${n * h * h * c}\). Each axis multiplies the count.`};
    }},
  ]);

  /* ---------- Helpers for Lessons 02-12 ---------- */
  const fx = (x, d = 3) => { const v = Number(x.toFixed(d)); return v === 0 ? 0 : v; };  // tidy a float for display (no -0)
  const ap = (x, d = 3) => (Math.abs(x - fx(x, d)) < 1e-9 ? '=' : Q`\approx `) + fx(x, d);  // "=v" when exact, else "≈v"
  const col = v => mat(v.map(x => [x]));
  const tup = v => `(${v.join(', ')})`;
  const pm = x => (x < 0 ? '-' : '+') + Math.abs(x);  // signed term: +3 or -3
  const par = x => (x < 0 ? `(${x})` : String(x));    // bracket negatives inside products
  const sum = v => v.reduce((s, x) => s + x, 0);
  const adds = v => v.map((x, i) => (i ? pm(x) : String(x))).join('');
  const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
  const mv = (A, x) => A.map(row => dot(row, x));
  const det2 = M => M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const frac = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q) || 1; p /= g; q /= g; return q === 1 ? String(p) : Q`${p < 0 ? '-' : ''}\frac{${Math.abs(p)}}{${q}}`; };
  const fracv = (p, q) => (Number.isInteger(p / q) ? String(p / q) : frac(p, q) + ap(p / q));  // fraction and its value, no "3=3"
  // A linear expression such as 2x-y+3 from coefficients and names; zero terms are skipped and unit coefficients are hidden.
  const lin = (coeffs, names, constant = 0) => {
    let out = '';
    coeffs.forEach((c, i) => { if (c !== 0) out += (c < 0 ? '-' : out ? '+' : '') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + names[i]; });
    if (constant !== 0 || !out) out += (constant < 0 ? '-' : out ? '+' : '') + Math.abs(constant);
    return out;
  };
  const eq = (coeffs, rhs) => `${lin(coeffs, ['x', 'y'])}=${rhs}`;
  const ivec = (r, n, lo, hi) => { const v = Array.from({length: n}, () => r.int(lo, hi)); if (v.every(x => x === 0)) v[r.int(0, n - 1)] = r.nonzero(lo, hi); return v; };
  const points = (t, y) => t.map((v, i) => Q`\((${v}, ${y[i]})\)`).join(', ');
  const choice = (r, options, correctIndex) => { const order = r.shuffle(options.map((_, i) => i)); return {choices: order.map(i => options[i]), correct: order.indexOf(correctIndex)}; };

  P.add(2, [
    {key: 'compose-order', skill: 'Compose two functions in both orders', make(r) {
      const a = r.pick([2, 3, 4, 5]), c = r.nonzero(-9, 9), x = r.int(-5, 12);
      const f = a * x, gf = f + c, g = x + c, fg = a * g;
      return {prompt: Q`Let \(f(x)=${a}x\) and \(g(x)=x${pm(c)}\). Evaluate \(g(f(${x}))\) and \(f(g(${x}))\).`,
        answers: [{label: Q`\(g(f(${x}))\)`, value: gf, tol: 0}, {label: Q`\(f(g(${x}))\)`, value: fg, tol: 0}],
        hint: 'Work from the inside out: the function written next to the input acts first.',
        solution: Q`\(f(${x})=${a}\cdot${par(x)}=${f}\), so \(g(f(${x}))=${f}${pm(c)}=${gf}\). \(g(${x})=${x}${pm(c)}=${g}\), so \(f(g(${x}))=${a}\cdot${par(g)}=${fg}\). The second order also scales the shift: \(f(g(${x}))-g(f(${x}))=(${a}-1)\cdot${par(c)}=${fg - gf}\).`};
    }},
    {key: 'slope-offset', skill: 'Read the slope and offset of a line', make(r) {
      const a = r.pick([-3, -2, 0.5, 1.5, 2, 3, 4]), b = r.nonzero(-10, 20), x0 = 2 * r.int(-3, 8), d = r.int(2, 6);
      const y0 = a * x0 + b, change = a * d;
      return {prompt: Q`For \(f(x)=${lin([a], ['x'], b)}\), what is \(f(${x0})\)? By how much does the output change when the input increases by ${d} (negative for a decrease)?`,
        answers: [{label: Q`\(f(${x0})\)`, value: y0, tol: 0}, {label: 'Change in output', value: change, tol: 0}],
        hint: 'Substitute the input for x. For the change, use the slope: the output change for each unit increase of the input.',
        solution: Q`\(f(${x0})=${a}\cdot${par(x0)}${pm(b)}=${y0}\). The slope is \(${a}\), so an input increase of ${d} changes the output by \(${a}\times${d}=${change}\). The offset \(${b}=f(0)\) shifts every output equally, so it does not affect changes.`};
    }},
    {key: 'invert-affine', skill: 'Reverse a scale-then-shift pipeline', make(r) {
      const a = r.pick([0.5, 1.5, 2, 3, 4]), b = r.pick([-20, -10, 5, 10, 15, 20]), x = 2 * r.int(5, 60), J = a * x + b;
      return {prompt: Q`A pipeline multiplies an intensity by \(${a}\) and then ${b < 0 ? 'subtracts' : 'adds'} \(${Math.abs(b)}\), with no clipping. Its output is \(J=${J}\). What was the input \(x\)?`,
        answers: [{label: Q`\(x\)`, value: x, tol: 0}],
        hint: 'Undo the stages in reverse order: remove the offset first, then undo the scaling.',
        solution: Q`From \(J=${a}x${pm(b)}\), first undo the offset: \(${J}${pm(-b)}=${J - b}\). Then undo the scale: \(x=${J - b}/${a}=${x}\). Check: \(${a}\cdot${x}${pm(b)}=${J}\).`};
    }},
    {key: 'many-to-one', skill: 'Spot a function that loses information', make(r) {
      const kind = r.pick(['clip', 'relu', 'square', 'round']);
      let u, v, out, bad, name;
      if (kind === 'clip') { u = r.int(256, 400); v = u + r.int(10, 150); out = 255; bad = 'f(x) = clip(x, 0, 255)'; name = 'Clipping to [0, 255]'; }
      else if (kind === 'relu') { u = -r.int(1, 9); v = u - r.int(1, 9); out = 0; bad = 'f(x) = max(0, x)'; name = 'ReLU'; }
      else if (kind === 'square') { u = r.int(2, 9); v = -u; out = u * u; bad = 'f(x) = x²'; name = 'Squaring'; }
      else { const n = r.int(1, 20); u = fx(n - r.int(1, 4) / 10, 1); v = fx(n + r.int(1, 4) / 10, 1); out = n; bad = 'f(x) = round(x) to the nearest integer'; name = 'Rounding'; }
      const k = r.pick([2, 3, 4, -2, 0.5]), c = r.nonzero(-9, 9), k2 = r.pick([-3, 2, 3, 5]), c2 = r.nonzero(-9, 9);
      const sgn = t => (t < 0 ? ` - ${-t}` : ` + ${t}`);
      const {choices, correct} = choice(r, [bad, `f(x) = ${k}x`, `f(x) = x${sgn(c)}`, `f(x) = ${k2}x${sgn(c2)}`], 0);
      return {prompt: Q`Which of these functions on the real numbers gives the same output for the two different inputs \(x=${u}\) and \(x=${v}\)? Such a function cannot be inverted.`,
        answers: [{label: 'Function', choices, correct}],
        hint: 'Substitute both inputs into each function. Scaling by a nonzero number and adding a constant can always be undone.',
        solution: Q`${name} sends both \(${u}\) and \(${v}\) to \(${out}\), so the input cannot be recovered from that output. The other three only scale by a nonzero number and shift, which can be undone exactly.`};
    }},
  ]);

  P.add(3, [
    {key: 'mse-rmse', skill: 'Mean squared error and its root', make(r) {
      const n = r.pick([3, 4]), y = Array.from({length: n}, () => r.int(0, 10)), e = Array.from({length: n}, () => r.int(-4, 4));
      e[r.int(0, n - 1)] = r.nonzero(-4, 4);
      const p = y.map((t, i) => t + e[i]), sq = e.map(x => x * x), sse = sum(sq), mse = sse / n, rmse = Math.sqrt(mse);
      return {prompt: Q`Predictions are \(\hat y=${tup(p)}\) and targets are \(y=${tup(y)}\). Find the mean squared error and the root mean squared error (2 decimals).`,
        answers: [{label: 'MSE', value: mse}, {label: 'RMSE', value: rmse}],
        hint: 'Subtract target from prediction in each position, square each residual, then average over all observations.',
        solution: Q`Residuals \(\hat y-y=${tup(e)}\), squares \(${tup(sq)}\), sum \(${sse}\). \(\operatorname{MSE}=${sse}/${n}${ap(mse)}\) and \(\operatorname{RMSE}=\sqrt{${fx(mse)}}${ap(rmse)}\), in the same units as the targets.`};
    }},
    {key: 'sum-vs-mean', skill: 'Sum versus mean when a dataset grows', make(r) {
      const n = r.pick([2, 3]), e = Array.from({length: n}, () => r.nonzero(-5, 5)), k = r.int(2, 4);
      const sse = sum(e.map(x => x * x)), mse = sse / n;
      return {prompt: Q`A model has residuals \(${tup(e)}\) on ${n} examples. The dataset is duplicated so that every example appears ${k} times. What are the new sum of squared errors and the new MSE?`,
        answers: [{label: 'Sum of squared errors', value: k * sse, tol: 0}, {label: 'MSE', value: mse}],
        hint: 'Each copy contributes the same squared errors. The MSE divides by the new number of examples.',
        solution: Q`Originally the squared errors \(${tup(e.map(x => x * x))}\) sum to \(${sse}\). With ${k} copies the sum is \(${k}\times${sse}=${k * sse}\) over \(${k * n}\) examples, so \(\operatorname{MSE}=${k * sse}/${k * n}${ap(mse)}\), the same as before. A sum grows with the dataset; a mean does not.`};
    }},
    {key: 'unit-change', skill: 'How a change of units scales MSE', make(r) {
      const n = r.pick([2, 3]), e = Array.from({length: n}, () => r.nonzero(-4, 4)), s = r.pick([0.5, 2, 3, 10]);
      const mse = sum(e.map(x => x * x)) / n, mse2 = s * s * mse, se = e.map(x => fx(s * x));
      return {prompt: Q`A localization model has residuals \(${tup(e)}\) pixels. Both predictions and targets are then multiplied by \(${s}\) to change units. Find the MSE before and after the change.`,
        answers: [{label: 'MSE before', value: mse}, {label: 'MSE after', value: mse2}],
        hint: 'Scaling both predictions and targets scales every residual by the same factor. Squaring then scales each squared error by that factor squared.',
        solution: Q`Before: \(\operatorname{MSE}=(${e.map(x => x * x).join('+')})/${n}${ap(mse)}\). The residuals become \(${tup(se)}\), so \(\operatorname{MSE}=${s}^2\times${fx(mse)}${ap(mse2)}\), while RMSE changes by the factor \(${s}\). The model did not get better or worse; only the unit changed.`};
    }},
    {key: 'sigma-notation', skill: 'Read summation notation with one-based indices', make(r) {
      const n = r.pick([5, 6]), x = Array.from({length: n}, () => r.int(-4, 12)), lo = r.int(1, n - 2), hi = r.int(lo + 1, n);
      const part = sum(x.slice(lo - 1, hi)), mean = sum(x) / n;
      return {prompt: Q`With one-based indexing, \(x=(x_1,\ldots,x_${n})=${tup(x)}\). Compute \(\sum_{i=${lo}}^{${hi}}x_i\) and the mean \(\bar x=\frac1{${n}}\sum_{i=1}^{${n}}x_i\).`,
        answers: [{label: Q`\(\sum_{i=${lo}}^{${hi}}x_i\)`, value: part, tol: 0}, {label: Q`\(\bar x\)`, value: mean}],
        hint: Q`The index runs over \(i=${lo},\ldots,${hi}\), and \(x_1\) is the first entry. Add each selected entry once.`,
        solution: Q`The sum uses \(x_${lo}\) through \(x_${hi}\): \(${adds(x.slice(lo - 1, hi))}=${part}\); in zero-based Python this is x[${lo - 1}:${hi}]. All ${n} entries sum to \(${sum(x)}\), so \(\bar x=${sum(x)}/${n}${ap(mean)}\).`};
    }},
  ]);

  P.add(4, [
    {key: 'sigmoid-log', skill: 'Sigmoid of a log-odds score', make(r) {
      const k = r.pick([2, 3, 4, 5, 9, 19]), s = r.sign(), p = s > 0 ? k / (k + 1) : 1 / (k + 1);
      const z = s > 0 ? Q`\ln(${k})` : Q`-\ln(${k})`, emz = s > 0 ? `1/${k}` : String(k);
      return {prompt: Q`A binary classifier gives the score \(z=${z}\). Find the class-1 probability \(p=\sigma(z)=1/(1+e^{-z})\) and the class-0 probability \(1-p\).`,
        answers: [{label: Q`\(p\)`, value: p}, {label: Q`\(1-p\)`, value: 1 - p}],
        hint: Q`Find \(e^{-z}\) first, using \(e^{\ln a}=a\) and \(e^{-\ln a}=1/a\).`,
        solution: Q`\(e^{-z}=${emz}\), so \(p=\frac{1}{1+${emz}}=${s > 0 ? Q`\frac{${k}}{${k + 1}}` : Q`\frac{1}{${k + 1}}`}${ap(p)}\) and \(1-p${ap(1 - p)}\). ${s > 0 ? 'A positive score' : 'A negative score'} puts \(p\) ${s > 0 ? 'above' : 'below'} one half.`};
    }},
    {key: 'odds-logit', skill: 'Odds and log-odds from a probability', make(r) {
      const p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8, 0.9]), q = fx(1 - p, 2), odds = p / q, z = Math.log(odds);
      return {prompt: Q`A sigmoid classifier outputs class-1 probability \(p=${p}\). Find the odds \(p/(1-p)\) of class 1 and the logit \(z=\ln\bigl(p/(1-p)\bigr)\), using the natural log (2 decimals).`,
        answers: [{label: 'Odds', value: odds}, {label: Q`Logit \(z\)`, value: z}],
        hint: 'The odds compare the class-1 probability with the class-0 probability. The logit is the natural log of the odds.',
        solution: Q`\(1-p=${q}\), so the odds are \(${p}/${q}${ap(odds)}\) and \(z=\ln(${fx(odds)})${ap(z)}\). ${p > 0.5 ? 'Since p is above one half, the odds exceed 1 and the logit is positive.' : 'Since p is below one half, the odds are below 1 and the logit is negative.'}`};
    }},
    {key: 'bce-loss', skill: 'True-class probability and binary cross-entropy', make(r) {
      const p = r.pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9]), y = r.int(0, 1), py = y ? p : fx(1 - p, 2), L = -Math.log(py);
      return {prompt: Q`A model assigns class-1 probability \(p=${p}\) to an image whose observed label is \(y=${y}\). Find the true-class probability \(p_y\) and the binary cross-entropy loss \(L=-\ln(p_y)\) (2 decimals).`,
        answers: [{label: Q`\(p_y\)`, value: py}, {label: 'Loss', value: L}],
        hint: Q`Select the probability of the class that occurred: \(p_y=p\) when \(y=1\) and \(p_y=1-p\) when \(y=0\).`,
        solution: Q`With \(y=${y}\), \(p_y=${y ? 'p' : '1-p'}=${py}\) and \(L=-\ln(${py})${ap(L)}\). ${py < 0.5 ? 'The model leaned toward the wrong class, so the loss is large.' : py > 0.5 ? 'The model leaned toward the observed class, so the loss is small.' : Q`An undecided prediction gives \(\ln 2\) for either label.`}`};
    }},
    {key: 'label-flip', skill: 'How the loss responds when the label changes', make(r) {
      const z = r.bool(0.2) ? 0 : r.nonzero(-3, 3), y0 = r.int(0, 1), y1 = 1 - y0, p = 1 / (1 + Math.exp(-z));
      const pOf = y => (y ? p : 1 - p), L0 = -Math.log(pOf(y0)), L1 = -Math.log(pOf(y1));
      const truth = Math.abs(L1 - L0) < 1e-12 ? 2 : L1 > L0 ? 0 : 1;
      const {choices, correct} = choice(r, ['The loss increases', 'The loss decreases', 'The loss stays the same'], truth);
      const why = ['The new label is the class the model considered less likely, so it is more surprising.', 'The new label is the class the model considered more likely, so it is less surprising.', 'At score 0 both classes have probability one half.'][truth];
      return {prompt: Q`A cat classifier gives score \(z=${z}\) for an image. The label is corrected from \(y=${y0}\) to \(y=${y1}\) while the score stays fixed. What happens to the loss \(-\ln(p_y)\)?`,
        answers: [{label: 'Effect on the loss', choices, correct}],
        hint: Q`The class-1 probability \(p=\sigma(z)\) does not change. Work out which probability the loss selects before and after the correction.`,
        solution: Q`\(p=\sigma(${z})${ap(p)}\). With \(y=${y0}\) the loss is \(-\ln(${fx(pOf(y0))})${ap(L0)}\); with \(y=${y1}\) it is \(-\ln(${fx(pOf(y1))})${ap(L1)}\). ${why} The prediction is unchanged; only its evaluation changes.`};
    }},
  ]);

  P.add(5, [
    {key: 'displacement', skill: 'Displacement and distance between positions', make(r) {
      const p = [r.int(-5, 5), r.int(-5, 5)], d = ivec(r, 2, -6, 6), q = p.map((x, i) => x + d[i]), len = Math.hypot(...d);
      return {prompt: Q`In one coordinate system a point moves from \(p=${tup(p)}\) to \(q=${tup(q)}\). Enter the displacement \(q-p\), then its Euclidean length (2 decimals).`,
        answers: [{label: Q`\(q-p\)`, vector: d, tol: 0}, {label: 'Length', value: len}],
        hint: 'Subtract the start from the end, coordinate by coordinate. The length is the square root of the sum of squared changes.',
        solution: Q`\(q-p=(${q[0]}-${par(p[0])},\ ${q[1]}-${par(p[1])})=${tup(d)}\) and \(\|q-p\|_2=\sqrt{${d[0] ** 2}+${d[1] ** 2}}${ap(len)}\). Moving the origin would change \(p\) and \(q\) but not this displacement.`};
    }},
    {key: 'linear-combination', skill: 'Scale and add vectors', make(r) {
      const dim = r.pick([2, 3]), u = ivec(r, dim, -4, 4), v = ivec(r, dim, -4, 4), a = r.nonzero(-3, 3), b = r.nonzero(-3, 3);
      const au = u.map(x => a * x), bv = v.map(x => b * x), w = au.map((x, i) => x + bv[i]), expr = lin([a, b], ['u', 'v']);
      return {prompt: Q`For \(u=${tup(u)}\) and \(v=${tup(v)}\), compute \(${expr}\).`,
        answers: [{label: Q`\(${expr}\)`, vector: w, tol: 0}],
        hint: 'Scale each vector first by multiplying every coordinate, then add matching coordinates.',
        solution: Q`\(${lin([a], ['u'])}=${tup(au)}\) and \(${lin([b], ['v'])}=${tup(bv)}\). Adding coordinate by coordinate gives \(${tup(w)}\), with the same dimension ${dim} as \(u\) and \(v\).`};
    }},
    {key: 'flatten-row-order', skill: 'Flatten an image in row order', make(r) {
      const [h, w] = r.pick([[2, 2], [2, 3], [3, 2], [2, 4], [3, 3]]), v = r.distinct(h * w, 1, 99);
      const grid = Array.from({length: h}, (_, i) => v.slice(i * w, i * w + w)), i = r.int(0, h - 1), j = r.int(0, w - 1), k = i * w + j;
      return {prompt: Q`Flatten \(I=${mat(grid)}\) in row order (top row first). Enter the resulting vector, then the zero-based position in it of the entry \(I[${i},${j}]=${grid[i][j]}\) (zero-based row, column).`,
        answers: [{label: 'Flattened vector', vector: v, tol: 0}, {label: 'Position', value: k, tol: 0}],
        hint: 'Read each row from left to right, starting at the top. An entry in row i comes after i complete rows.',
        solution: Q`\(x=${tup(v)}\), a vector of dimension \(${h}\times${w}=${h * w}\). Entry \(I[${i},${j}]\) follows ${i} full row${i === 1 ? '' : 's'} of ${w} entries, so its position is \(${i}\cdot${w}+${j}=${k}\).`};
    }},
    {key: 'feature-scale-distance', skill: 'How feature scale dominates a distance', make(r) {
      const sb = r.pick([20, 25, 40, 50]), sw = r.pick([2, 4, 5]), k1 = r.pick([1, 2]) * r.sign(), k2 = r.int(3, 4) * r.sign();
      const a = [r.int(110, 150), r.int(20, 40)], db = sb * k1, dw = sw * k2, b = [a[0] + db, a[1] + dw];
      const raw = Math.hypot(db, dw), std = Math.hypot(k1, k2);
      return {prompt: Q`Two images have features [mean brightness, width in mm] \(a=${tup(a)}\) and \(b=${tup(b)}\); the training standard deviations of these features are ${sb} and ${sw}. Find the Euclidean distance between \(a\) and \(b\), then the distance after dividing each feature by its training standard deviation (2 decimals).`,
        answers: [{label: 'Raw distance', value: raw}, {label: 'Standardized distance', value: std}],
        hint: 'Work with the coordinate differences. Standardizing divides each difference by that feature\'s standard deviation; the training mean cancels in a difference.',
        solution: Q`Differences \(b-a=${tup([db, dw])}\) give raw distance \(\sqrt{${db * db}+${dw * dw}}${ap(raw)}\), almost entirely from brightness. Standardized differences \(${tup([k1, k2])}\) give \(\sqrt{${k1 * k1}+${k2 * k2}}${ap(std)}\), and now width dominates. The representation's scales decide which feature the distance notices.`};
    }},
  ]);

  P.add(6, [
    {key: 'norms-unit', skill: 'L1 norm, L2 norm and unit vector', make(r) {
      const base = r.pick([[3, 4], [6, 8], [5, 12], [1, 2, 2], [2, 3, 6], [2, 6, 9], [4, 4, 7], [1, 4, 8]]);
      const x = r.shuffle(base).map(v => v * r.sign()), l1 = sum(x.map(v => Math.abs(v))), l2 = Math.round(Math.hypot(...x)), unit = x.map(v => v / l2);
      return {prompt: Q`For \(x=${tup(x)}\), find \(\|x\|_1\), \(\|x\|_2\) and the unit vector \(x/\|x\|_2\) (2 decimals).`,
        answers: [{label: Q`\(\|x\|_1\)`, value: l1, tol: 0}, {label: Q`\(\|x\|_2\)`, value: l2, tol: 0}, {label: 'Unit vector', vector: unit}],
        hint: 'L1 adds absolute values; L2 is the square root of the sum of squares. Divide every coordinate by the L2 norm.',
        solution: Q`\(\|x\|_1=${x.map(v => Math.abs(v)).join('+')}=${l1}\) and \(\|x\|_2=\sqrt{${x.map(v => v * v).join('+')}}=\sqrt{${l2 * l2}}=${l2}\). Dividing by ${l2} gives \(${tup(unit.map(v => fx(v)))}\), which has length 1 and the same direction.`};
    }},
    {key: 'cosine-similarity', skill: 'Dot product and cosine similarity', make(r) {
      const dim = r.pick([2, 3]), u = ivec(r, dim, -4, 4), v = ivec(r, dim, -4, 4);
      const d = dot(u, v), nu = dot(u, u), nv = dot(v, v), cos = d / Math.sqrt(nu * nv);
      const angle = d > 0 ? 'positive, so the angle is acute' : d < 0 ? 'negative, so the angle is obtuse' : 'zero, so the vectors are perpendicular';
      return {prompt: Q`Find the dot product \(u^Tv\) and the cosine similarity of \(u=${tup(u)}\) and \(v=${tup(v)}\) (2 decimals).`,
        answers: [{label: Q`\(u^Tv\)`, value: d, tol: 0}, {label: 'Cosine similarity', value: cos}],
        hint: Q`Multiply matching coordinates and add. Then divide by \(\|u\|_2\|v\|_2\).`,
        solution: Q`\(u^Tv=${u.map((x, i) => Q`${par(x)}\cdot${par(v[i])}`).join('+')}=${d}\). The lengths are \(\sqrt{${nu}}\) and \(\sqrt{${nv}}\), so \(\cos\theta=\frac{${d}}{\sqrt{${nu * nv}}}${ap(cos)}\). The dot product is ${angle}.`};
    }},
    {key: 'projection', skill: 'Orthogonal projection onto a direction', make(r) {
      const u = r.pick([[1, 1], [1, -1], [1, 2], [2, 1], [1, -2], [2, -1], [1, 3], [3, 1], [3, -1], [2, 2]]);
      let x; do { x = [r.int(-5, 6), r.int(-5, 6)]; } while (x[0] * u[1] === x[1] * u[0]);  // not on the line, so the residual is nonzero
      const uu = dot(u, u), ux = dot(u, x), c = ux / uu, p = u.map(v => c * v), res = x.map((v, i) => v - p[i]);
      return {prompt: Q`Project \(x=${tup(x)}\) onto the direction \(u=${tup(u)}\). Find the coefficient \(c\) for which \(cu\) is the projection, and the residual \(x-cu\).`,
        answers: [{label: Q`\(c\)`, value: c}, {label: Q`Residual \(x-cu\)`, vector: res}],
        hint: Q`Use \(c=u^Tx/u^Tu\). Here \(u\) is not a unit vector, so the denominator matters.`,
        solution: Q`\(u^Tx=${ux}\) and \(u^Tu=${uu}\), so \(c=${fracv(ux, uu)}\). The projection is \(cu=${tup(p.map(v => fx(v)))}\) and the residual is \(x-cu=${tup(res.map(v => fx(v)))}\). Check: \(u^T(x-cu)=0\), so the residual is perpendicular to \(u\).`};
    }},
    {key: 'scale-invariance', skill: 'What scaling a feature vector leaves unchanged', make(r) {
      const k = r.pick([2, 3, 4, 0.5]), l2 = (a, b) => Math.hypot(...a.map((v, i) => v - b[i])), l1 = (a, b) => sum(a.map((v, i) => Math.abs(v - b[i])));
      let x, y, kx;
      do { x = ivec(r, 2, -3, 4); y = ivec(r, 2, -3, 4); kx = x.map(v => k * v); }
      while (dot(x, y) === 0 || Math.abs(l2(kx, y) - l2(x, y)) < 1e-9 || Math.abs(l1(kx, y) - l1(x, y)) < 1e-9);
      const cos = dot(x, y) / Math.hypot(...x) / Math.hypot(...y);
      const {choices, correct} = choice(r, ['The cosine similarity between x and y', 'The dot product of x and y', 'The Euclidean distance between x and y', 'The L1 distance between x and y'], 0);
      return {prompt: Q`A feature vector \(x=${tup(x)}\) is replaced by \(${k}x\) after a brightness change. Which of these quantities, computed against \(y=${tup(y)}\), stays the same?`,
        answers: [{label: 'Unchanged quantity', choices, correct}],
        hint: 'Compute each quantity for x and for the scaled vector, or ask which one divides out the length of x.',
        solution: Q`Cosine similarity stays \(${fx(cos)}\) because a positive factor cancels between \(x^Ty\) and \(\|x\|_2\). The dot product changes from \(${dot(x, y)}\) to \(${fx(k * dot(x, y))}\), and the Euclidean distance from \(${fx(l2(x, y))}\) to \(${fx(l2(kx, y))}\). Ignoring magnitude helps when brightness is a nuisance, but discards it when it matters.`};
    }},
  ]);

  P.add(7, [
    {key: 'matrix-vector', skill: 'Multiply a matrix by a column vector', make(r) {
      const [h, w] = r.pick([[2, 2], [2, 2], [3, 2], [2, 3]]);
      const A = Array.from({length: h}, () => ivec(r, w, -3, 4)), x = Array.from({length: w}, () => r.nonzero(-3, 3)), y = mv(A, x);
      return {prompt: Q`Compute \(Ax\) for \(A=${mat(A)}\) and the column vector \(x=${col(x)}\).`,
        answers: [{label: Q`\(Ax\)`, vector: y, tol: 0}],
        hint: 'Each output entry is one row of A dotted with x. Equivalently, add the columns of A weighted by the entries of x.',
        solution: Q`Weighting the columns by the entries of \(x\): \(Ax=${x.map((xi, j) => `${par(xi)}${col(A.map(row => row[j]))}`).join('+')}=${col(y)}\). The output has ${h} entries because \(A\) has ${h} rows.`};
    }},
    {key: 'compose-maps', skill: 'Compose two linear maps in both orders', make(r) {
      const Bs = [[[0, -1], [1, 0]], [[0, 1], [-1, 0]], [[0, 1], [1, 0]], [[1, 1], [0, 1]], [[1, 0], [1, 1]], [[-1, 0], [0, 1]]];
      let A, B, x, Ax, Bx, BAx, ABx;
      do {
        A = [[r.int(-2, 3), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 3)]]; B = r.pick(Bs); x = [r.nonzero(-3, 3), r.nonzero(-3, 3)];
        Ax = mv(A, x); Bx = mv(B, x); BAx = mv(B, Ax); ABx = mv(A, Bx);
      } while (det2(A) === 0 || (BAx[0] === ABx[0] && BAx[1] === ABx[1]));
      return {prompt: Q`A column vector \(x=${col(x)}\) is mapped first by \(A=${mat(A)}\) and then by \(B=${mat(B)}\). Enter the result \(BAx\), then \(ABx\) for the opposite order.`,
        answers: [{label: Q`\(BAx\)`, vector: BAx, tol: 0}, {label: Q`\(ABx\)`, vector: ABx, tol: 0}],
        hint: 'Apply the first map to x, then apply the second map to that result. The matrix written next to x acts first.',
        solution: Q`\(Ax=${col(Ax)}\), so \(B(Ax)=${col(BAx)}\). In the other order \(Bx=${col(Bx)}\), so \(A(Bx)=${col(ABx)}\). The outputs differ, so \(BA\ne AB\) here: the order of composition matters.`};
    }},
    {key: 'layer-shapes', skill: 'Shapes and parameter count in a batch affine layer', make(r) {
      const n = r.pick([8, 16, 32, 64]), d = r.pick([3, 4, 10, 64, 128]), h = r.pick([2, 5, 10, 16, 32]);
      return {prompt: Q`A batch \(X\) of shape \((${n}, ${d})\), one sample per row, passes through \(Z=XW+b\) with ${h} output features. Give the shape of \(Z\), the length of \(b\), and the total number of trainable values in \(W\) and \(b\).`,
        answers: [{label: Q`shape of \(Z\)`, vector: [n, h], tol: 0}, {label: Q`length of \(b\)`, value: h, tol: 0}, {label: 'Trainable values', value: d * h + h, tol: 0}],
        hint: Q`For \(XW\) to be defined, \(W\) needs ${d} rows; its columns are the output features.`,
        solution: Q`\(W\) has shape \((${d}, ${h})\), so \(Z=XW+b\) has shape \((${n}, ${h})\). The bias has length ${h} and is broadcast across the ${n} rows. Trainable values: \(${d}\times${h}+${h}=${d * h + h}\); the batch size does not change this count.`};
    }},
    {key: 'linear-or-affine', skill: 'Decide whether a map is linear, affine or neither', make(r) {
      const kind = r.int(0, 2), names = ['x_1', 'x_2'];  // 0 linear, 1 affine, 2 neither
      const a = [r.nonzero(-3, 3), r.int(-2, 2)], c = [r.int(-2, 2), r.nonzero(-3, 3)], t = [r.nonzero(-5, 5), r.int(-5, 5)], m = r.int(1, 3);
      const nl = r.pick(['sq', 'prod', 'abs']), mc = m === 1 ? '' : m;
      const f1 = kind === 2 ? {sq: Q`${mc}x_1^2`, prod: Q`${mc}x_1x_2`, abs: Q`${mc}|x_1|`}[nl] : lin(a, names, kind === 1 ? t[0] : 0);
      const f2 = lin(c, names, kind === 1 ? t[1] : 0);
      const {choices, correct} = choice(r, ['Linear', 'Affine but not linear', 'Neither linear nor affine'], kind);
      const why = [
        Q`\(f(0,0)=(0,0)\) and each output is a weighted sum of the inputs with no constant, so \(f(x)=Ax\) with \(A=${mat([a, c])}\). It is linear (and therefore also affine).`,
        Q`\(f(0,0)=${tup(t)}\ne(0,0)\), so \(f\) is not linear. It equals \(Ax+t\) with \(A=${mat([a, c])}\) and \(t=${tup(t)}\), so it is affine.`,
        Q`\(f(0,0)=(0,0)\), yet \(f(-1,-1)=${tup([m, -c[0] - c[1]])}\) while \(-f(1,1)=${tup([-m, -c[0] - c[1]])}\), so scaling is not preserved. The first output is not a weighted sum of the inputs plus a constant, so \(f\) is neither linear nor affine.`][kind];
      return {prompt: Q`Is \(f(x_1,x_2)=\bigl(${f1},\ ${f2}\bigr)\) linear, affine but not linear, or neither?`,
        answers: [{label: 'Classification', choices, correct}],
        hint: Q`Evaluate \(f(0,0)\) first. Then ask whether each output is a weighted sum of \(x_1,x_2\), possibly plus a constant.`,
        solution: why};
    }},
  ]);

  P.add(8, [
    {key: 'basis-coordinates', skill: 'Coordinates in a non-standard basis', make(r) {
      const opts = [[1, 1], [1, -1], [1, 0], [0, 1], [2, 1], [1, 2], [1, 3], [-1, 2], [2, -1]], std = v => (v[0] === 0 || v[1] === 0);
      let u, v, D;
      do { u = r.pick(opts); v = r.pick(opts); D = det2([[u[0], v[0]], [u[1], v[1]]]); } while (D === 0 || Math.abs(D) > 2 || (std(u) && std(v)));
      const w = ivec(r, 2, -5, 6), a = (w[0] * v[1] - w[1] * v[0]) / D, b = (u[0] * w[1] - u[1] * w[0]) / D;
      return {prompt: Q`Write \(w=${tup(w)}\) in the basis \(u=${tup(u)}\), \(v=${tup(v)}\): find the coordinates \((a,b)\) with \(w=au+bv\).`,
        answers: [{label: Q`\((a,b)\)`, vector: [a, b], tol: 0}],
        hint: 'Write one equation per coordinate of a·u + b·v = w, then solve the two equations together.',
        solution: Q`Matching coordinates gives \(${lin([u[0], v[0]], ['a', 'b'])}=${w[0]}\) and \(${lin([u[1], v[1]], ['a', 'b'])}=${w[1]}\), so \(a=${a}\) and \(b=${b}\). Check: \(${lin([a, b], ['u', 'v'])}=${tup(w)}\). The vector is the same; only its coordinates depend on the basis.`};
    }},
    {key: 'rank-nullity', skill: 'Rank-nullity and recoverability', make(r) {
      const h = r.int(2, 6), d = r.int(2, 6), m = Math.min(h, d), rank = r.bool() ? m : r.int(1, m), nullity = d - rank;
      const {choices, correct} = choice(r, ['Yes: only the zero input maps to zero', 'No: different inputs can share an output'], nullity === 0 ? 0 : 1);
      return {prompt: Q`A matrix \(A\) of shape \((${h}, ${d})\) maps \(\mathbb R^{${d}}\) to \(\mathbb R^{${h}}\) and has rank ${rank}. What is the dimension of its null space, and the largest rank any \(${h}\times${d}\) matrix can have? Can every input be recovered from its output?`,
        answers: [{label: Q`\(\dim\ker A\)`, value: nullity, tol: 0}, {label: 'Largest possible rank', value: m, tol: 0}, {label: 'Every input recoverable?', choices, correct}],
        hint: 'Rank-nullity counts input directions: the rank plus the dimension of the null space equals the number of columns.',
        solution: Q`\(\dim\ker A=${d}-${rank}=${nullity}\). The rank counts independent columns and also independent rows, so it is at most \(\min(${h},${d})=${m}\). ${nullity ? Q`A nonzero null space means \(x\) and \(x+n\) with \(An=0\) give the same output, so inputs cannot all be recovered.` : 'Only the zero vector lies in the null space, so distinct inputs give distinct outputs and every input can be recovered.'}`};
    }},
    {key: 'dependence-value', skill: 'Make two vectors linearly dependent', make(r) {
      const a = r.nonzero(-3, 3), b = r.nonzero(-4, 4), k = r.pick([-3, -2, -1, 2, 3, 4]);
      return {prompt: Q`For which value of \(t\) are \(u=${tup([a, b])}\) and \(v=${tup([k * a, 't'])}\) linearly dependent? Give \(t\) and the scalar \(k\) with \(v=ku\).`,
        answers: [{label: Q`\(t\)`, value: k * b, tol: 0}, {label: Q`\(k\)`, value: k, tol: 0}],
        hint: 'Two nonzero vectors are dependent exactly when one is a multiple of the other. The first coordinates fix the multiple.',
        solution: Q`Dependence needs \(v=ku\). The first coordinates give \(${k * a}=k\cdot${par(a)}\), so \(k=${k}\); then \(t=${k}\cdot${par(b)}=${k * b}\), and \(${lin([k], ['u'])}-v=0\) is a nontrivial relation. For any other \(t\) the vectors are independent and span the plane.`};
    }},
    {key: 'null-space-shift', skill: 'Two inputs with the same output under a rank-1 map', make(r) {
      const a = r.nonzero(-3, 3), m = r.nonzero(-3, 3), k = r.pick([-2, -1, 2, 3]), A = [[a, a * m], [k * a, k * a * m]], n = [-m, 1];
      const x = [r.int(-3, 4), r.int(-3, 4)], x2 = [x[0] + n[0], x[1] + n[1]], y = mv(A, x);
      return {prompt: Q`\(A=${mat(A)}\) has rank 1. Find the vector \(n\ne0\) with \(An=0\) whose second entry is 1. Then give the input \(x'=x+n\), which \(A\) maps to the same output as \(x=${tup(x)}\).`,
        answers: [{label: Q`\(n\)`, vector: n, tol: 0}, {label: Q`\(x'\)`, vector: x2, tol: 0}],
        hint: Q`Write \(n=(s,1)\) and solve the first row's equation \(${lin([a], ['s'], a * m)}=0\) for \(s\).`,
        solution: Q`The first row gives \(${lin([a], ['s'], a * m)}=0\), so \(s=${-m}\) and \(n=${tup(n)}\); the second row is ${k} times the first, so it adds no condition. Then \(x'=${tup(x)}+${tup(n)}=${tup(x2)}\), and \(Ax=Ax'=${tup(y)}\) because \(An=0\): the output cannot tell these inputs apart.`};
    }},
  ]);

  P.add(9, [
    {key: 'solve-2x2', skill: 'Solve two simultaneous equations', make(r) {
      let A, D;
      do { A = [[r.nonzero(-3, 3), r.nonzero(-3, 3)], [r.nonzero(-3, 3), r.nonzero(-3, 3)]]; D = det2(A); } while (D === 0);
      const s = [r.int(-4, 5), r.int(-4, 5)], b = mv(A, s), [[p, q], [u, v]] = A;
      return {prompt: Q`Solve the system \(${eq(A[0], b[0])}\), \(${eq(A[1], b[1])}\) for \((x,y)\).`,
        answers: [{label: Q`\((x,y)\)`, vector: s, tol: 0}],
        hint: 'Eliminate one unknown: scale the equations so that the y coefficients match, then subtract.',
        solution: Q`Multiply the first equation by \(${v}\) and the second by \(${q}\), then subtract: \(${D}x=${v * b[0] - q * b[1]}\), so \(x=${s[0]}\). The first equation then gives \(${lin([q], ['y'])}=${b[0]}-${par(p)}\cdot${par(s[0])}=${b[0] - p * s[0]}\), so \(y=${s[1]}\). Check the second: \(${u}\cdot${par(s[0])}${pm(v)}\cdot${par(s[1])}=${b[1]}\).`};
    }},
    {key: 'solution-count', skill: 'Zero, one or infinitely many solutions', make(r) {
      const kind = r.int(0, 2), row = [r.nonzero(-3, 3), r.nonzero(-3, 3)], c1 = r.int(-6, 9), k = r.pick([-2, -1, 2, 3]);  // 0 one, 1 none, 2 many
      let row2, c2;
      if (kind === 0) { do { row2 = [r.nonzero(-3, 3), r.nonzero(-3, 3)]; } while (row2[0] * row[1] === row2[1] * row[0]); c2 = r.int(-6, 9); }
      else { row2 = row.map(v => k * v); c2 = k * c1 + (kind === 1 ? r.nonzero(-3, 3) : 0); }
      const D = row[0] * row2[1] - row[1] * row2[0];
      const {choices, correct} = choice(r, ['Exactly one', 'None: the system is inconsistent', 'Infinitely many'], kind);
      const why = [
        Q`The coefficient rows \(${tup(row)}\) and \(${tup(row2)}\) are not multiples of each other: \(${row[0]}\cdot${par(row2[1])}-${par(row[1])}\cdot${par(row2[0])}=${D}\ne0\). The columns are independent, so there is exactly one solution.`,
        Q`The second left-hand side is ${k} times the first, but \(${k}\times${par(c1)}=${k * c1}\ne${c2}\). Elimination leaves \(0=${c2 - k * c1}\), so there is no solution.`,
        Q`The second equation is ${k} times the first, including the right-hand side \(${k}\times${par(c1)}=${c2}\). Only one constraint remains, so one unknown is free and there are infinitely many solutions.`][kind];
      return {prompt: Q`How many solutions \((x,y)\) does the system \(${eq(row, c1)}\), \(${eq(row2, c2)}\) have?`,
        answers: [{label: 'Number of solutions', choices, correct}],
        hint: 'Check whether one left-hand side is a multiple of the other. If it is, compare the right-hand sides in the same way.',
        solution: why};
    }},
    {key: 'free-parameter', skill: 'Describe all solutions of one equation', make(r) {
      const m = r.nonzero(-4, 4), c = r.int(-6, 9);
      return {prompt: Q`Describe all solutions of \(${eq([1, m], c)}\) by letting \(y=t\) be free, so that \(x=p+qt\). Enter \((p,q)\).`,
        answers: [{label: Q`\((p,q)\)`, vector: [c, -m], tol: 0}],
        hint: 'Move the y term to the right-hand side, then replace y by t.',
        solution: Q`\(x=${lin([-m], ['y'], c)}\), so the solutions are \((x,y)=(${lin([-m], ['t'], c)},\ t)\) for every real \(t\): \(p=${c}\), \(q=${-m}\). One equation in two unknowns leaves one free parameter; for example \(t=1\) gives \((${c - m}, 1)\).`};
    }},
    {key: 'line-through-two', skill: 'Fit a line exactly through two observations', make(r) {
      const [t1, t2] = r.distinct(2, -2, 5).sort((p, q) => p - q), a = r.nonzero(-3, 4), c = r.int(-5, 6), y1 = a * t1 + c, y2 = a * t2 + c;
      return {prompt: Q`Find the line \(y=at+c\) through the observations \((t,y)=(${t1}, ${y1})\) and \((${t2}, ${y2})\) by writing \(A\theta=b\) with rows \([t,1]\). Enter \(\theta=(a,c)\).`,
        answers: [{label: Q`\((a,c)\)`, vector: [a, c], tol: 0}],
        hint: 'Subtract the two equations to remove c, which gives a. Then substitute back to find c.',
        solution: Q`\(${mat([[t1, 1], [t2, 1]])}${col(['a', 'c'])}=${col([y1, y2])}\). Subtracting the rows gives \(${t2 - t1}a=${y2 - y1}\), so \(a=${a}\); then \(c=${y1}-${par(a)}\cdot${par(t1)}=${c}\). Two distinct \(t\) values make the rows independent, so this line is unique.`};
    }},
  ]);

  P.add(10, [
    {key: 'fit-constant', skill: 'Least-squares constant and residual sum of squares', make(r) {
      const n = r.pick([3, 4]), c = r.int(3, 9), d = [r.nonzero(-3, 3), ...Array.from({length: n - 2}, () => r.int(-3, 3))];
      d.push(-sum(d));
      const y = d.map(v => c + v), ssr = sum(d.map(v => v * v));
      return {prompt: Q`Fit a constant model \(\hat y_i=c\) to the observations \(y=${tup(y)}\) by least squares. Enter the fitted \(c\) and the sum of squared residuals.`,
        answers: [{label: Q`fitted \(c\)`, value: c, tol: 0}, {label: 'Sum of squared residuals', value: ssr, tol: 0}],
        hint: Q`Minimizing \(\sum_i(c-y_i)^2\) gives the mean of the observations. Then square the residuals and add them.`,
        solution: Q`\(c=(${adds(y)})/${n}=${c}\). The residuals \(c-y=${tup(d.map(v => -v))}\) sum to zero, so they are orthogonal to the all-ones column, and their squares add to \(${ssr}\).`};
    }},
    {key: 'normal-equations', skill: 'Form the normal equations for a line fit', make(r) {
      const n = r.pick([3, 4]), t = r.distinct(n, -1, 4).sort((p, q) => p - q), b = Array.from({length: n}, () => r.int(0, 8));
      const A = t.map(v => [v, 1]), st2 = sum(t.map(v => v * v)), st = sum(t), stb = dot(t, b), sb = sum(b);
      return {prompt: Q`To fit \(y=at+c\) to the points ${points(t, b)}, use the matrix \(A\) with rows \([t_i,1]\) and \(b=${tup(b)}\). Enter \(A^TA\) in row order (4 numbers), then \(A^Tb\).`,
        answers: [{label: Q`\(A^TA\)`, vector: [st2, st, st, n], tol: 0}, {label: Q`\(A^Tb\)`, vector: [stb, sb], tol: 0}],
        hint: Q`Entry \((i,j)\) of \(A^TA\) is the dot product of columns \(i\) and \(j\) of \(A\): here the \(t\) column and the ones column.`,
        solution: Q`\(A=${mat(A)}\). \(A^TA=${mat([[st2, st], [st, n]])}\) from \(\sum t_i^2=${st2}\), \(\sum t_i=${st}\) and \(n=${n}\); \(A^Tb=${col([stb, sb])}\) from \(\sum t_ib_i=${stb}\) and \(\sum b_i=${sb}\). The normal equations are \(A^TA\theta=A^Tb\).`};
    }},
    {key: 'line-fit', skill: 'Least-squares line through noisy points', make(r) {
      const t = r.pick([[0, 1, 2], [-1, 0, 1], [1, 2, 3], [0, 1, 2, 3]]), n = t.length, b = Array.from({length: n}, () => r.int(0, 8));
      const st2 = sum(t.map(v => v * v)), st = sum(t), stb = dot(t, b), sb = sum(b), D = st2 * n - st * st;
      const a = (n * stb - st * sb) / D, c = (st2 * sb - st * stb) / D;
      return {prompt: Q`Fit \(y=at+c\) by least squares to the points ${points(t, b)}. Enter \(a\) and \(c\) (2 decimals).`,
        answers: [{label: Q`\(a\)`, value: a}, {label: Q`\(c\)`, value: c}],
        hint: Q`Use rows \([t_i,1]\): form \(A^TA\) and \(A^Tb\), then solve the \(2\times2\) normal equations \(A^TA\theta=A^Tb\).`,
        solution: Q`\(A^TA=${mat([[st2, st], [st, n]])}\) and \(A^Tb=${col([stb, sb])}\). Solving gives \(a=${fracv(n * stb - st * sb, D)}\) and \(c=${fracv(st2 * sb - st * stb, D)}\). The residuals sum to zero because the ones column is in \(A\).`};
    }},
    {key: 'orthogonality-check', skill: 'Test a fit with residual orthogonality', make(r) {
      const t = r.pick([[0, 1, 2], [-1, 0, 1], [1, 2, 3]]), a = r.int(-2, 3), c = r.int(-2, 4), k = r.nonzero(-2, 2);
      const b = t.map((v, i) => a * v + c - k * [1, -2, 1][i]);  // the residual of (a, c) is k(1,-2,1), orthogonal to both columns
      const optimal = r.bool(), delta = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), th = optimal ? [a, c] : [a + delta[0], c + delta[1]];
      const pred = t.map(v => th[0] * v + th[1]), res = pred.map((p, i) => p - b[i]), g = [dot(t, res), sum(res)];
      const {choices, correct} = choice(r, ['Yes: it satisfies the normal equations', 'No: it does not satisfy the normal equations'], optimal ? 0 : 1);
      return {prompt: Q`The points ${points(t, b)} are fit by \(y=at+c\), with rows \([t_i,1]\) in \(A\). For the candidate \(\theta=(${th[0]}, ${th[1]})\), compute \(A^Tr\) where \(r=A\theta-b\). Is this \(\theta\) the least-squares fit?`,
        answers: [{label: Q`\(A^Tr\)`, vector: g, tol: 0}, {label: 'Least-squares fit?', choices, correct}],
        hint: Q`Compute the predictions \(at_i+c\) and subtract the observations. Then dot the residual with the \(t\) column and with the ones column.`,
        solution: Q`Predictions \(${tup(pred)}\) give \(r=${tup(res)}\), so \(A^Tr=${tup(g)}\). ${optimal ? Q`Both entries are zero: \(r\) is orthogonal to every column of \(A\), so the normal equations hold and \(\theta\) is the least-squares fit.` : Q`Because \(A^Tr\ne0\), part of the residual lies in the column space and could still be removed. The least-squares fit is \(\theta=(${a}, ${c})\).`}`};
    }},
  ]);

  P.add(11, [
    {key: 'back-substitution', skill: 'Solve an upper-triangular system', make(r) {
      const n = r.pick([2, 3]), R = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => (j < i ? 0 : j === i ? r.int(1, 4) : r.int(-3, 3))));
      const th = Array.from({length: n}, () => r.int(-4, 4)), y = mv(R, th);
      const steps = [];
      for (let i = n - 1; i >= 0; i--) {
        const known = R[i].map((v, j) => (j > i && v !== 0 ? Q`-${par(v)}\cdot${par(th[j])}` : '')).join('');
        steps.push(Q`\(\theta_${i + 1}=\frac{${y[i]}${known}}{${R[i][i]}}=${th[i]}\)`);
      }
      return {prompt: Q`Solve \(R\theta=${col(y)}\) by back substitution, where \(R=${mat(R)}\).`,
        answers: [{label: Q`\(\theta\)`, vector: th, tol: 0}],
        hint: 'Start with the last row, which has a single unknown, then substitute upward one row at a time.',
        solution: Q`Working upward: ${steps.join('; ')}. So \(\theta=${tup(th)}\), found without forming any inverse.`};
    }},
    {key: 'condition-number', skill: 'Condition number of a diagonal matrix', make(r) {
      const n = r.pick([2, 3]), mags = r.shuffle([0.1, 0.2, 0.25, 0.5, 1, 2, 4, 5, 10, 20]).slice(0, n), dvals = mags.map(v => v * r.sign());
      const hi = Math.max(...mags), lo = Math.min(...mags), kappa = fx(hi / lo, 6);
      return {prompt: Q`Find the 2-norm condition number \(\kappa_2(A)\) of \(A=\operatorname{diag}(${dvals.join(', ')})\), and \(\kappa_2(A^TA)\).`,
        answers: [{label: Q`\(\kappa_2(A)\)`, value: kappa}, {label: Q`\(\kappa_2(A^TA)\)`, value: kappa * kappa}],
        hint: 'For a diagonal matrix the singular values are the absolute values of the diagonal entries. Divide the largest by the smallest.',
        solution: Q`The singular values are \(${mags.slice().sort((p, q) => q - p).join(', ')}\), so \(\kappa_2(A)=${hi}/${lo}=${kappa}\). \(A^TA=\operatorname{diag}(${mags.map(v => fx(v * v, 4)).join(', ')})\) squares every singular value, so \(\kappa_2(A^TA)=${kappa}^2=${fx(kappa * kappa)}\). This is why solving through \(A^TA\) can lose accuracy.`};
    }},
    {key: 'minimum-norm', skill: 'Minimum-norm solution of one equation', make(r) {
      const a = r.pick([[1, 1], [1, 2], [2, 1], [1, -1], [1, 3], [3, 1], [2, -1], [1, 1, 1], [1, 2, 2], [1, -1, 2]]);
      const k = r.nonzero(-3, 3), aa = dot(a, a), c = k * aa, x = a.map(v => k * v), names = a.map((_, i) => `x_${i + 1}`);
      return {prompt: Q`Among all solutions of \(${lin(a, names)}=${c}\), find the one with the smallest Euclidean norm, and give its squared norm.`,
        answers: [{label: 'Minimum-norm solution', vector: x, tol: 0}, {label: 'Squared norm', value: k * k * aa, tol: 0}],
        hint: Q`The minimum-norm solution has no component in the null space, so it is a multiple \(s\,a\) of the coefficient vector \(a=${tup(a)}\).`,
        solution: Q`Write \(x=s\,a\). Then \(s\,a^Ta=${c}\) with \(a^Ta=${aa}\), so \(s=${k}\), \(x=${tup(x)}\) and \(\|x\|_2^2=${k * k * aa}\). Every other solution adds a vector orthogonal to \(a\), which only increases the norm; this is the solution a pseudoinverse returns.`};
    }},
    {key: 'gram-schmidt-step', skill: 'First Gram-Schmidt step of a QR factorization', make(r) {
      const base = r.pick([[1, 2, 2], [2, 1, 2], [2, 2, 1], [3, 4, 0], [0, 3, 4], [4, 0, 3], [2, 3, 6], [6, 2, 3]]);
      const a1 = base.map(v => (v === 0 ? 0 : v * r.sign()));
      const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
      let a2; do { a2 = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; } while (cross(a1, a2).every(v => v === 0));
      const r11 = Math.round(Math.hypot(...a1)), q1 = a1.map(v => v / r11), r12 = dot(a1, a2) / r11;
      return {prompt: Q`Begin a thin QR factorization of \(A=${mat(a1.map((v, i) => [v, a2[i]]))}\) by Gram-Schmidt, with columns \(a_1,a_2\). Find \(r_{11}=\|a_1\|_2\), the unit vector \(q_1=a_1/r_{11}\), and \(r_{12}=q_1^Ta_2\) (2 decimals).`,
        answers: [{label: Q`\(r_{11}\)`, value: r11, tol: 0}, {label: Q`\(q_1\)`, vector: q1}, {label: Q`\(r_{12}\)`, value: r12}],
        hint: Q`Normalize the first column. Then \(r_{12}\) is the component of \(a_2\) along \(q_1\).`,
        solution: Q`\(r_{11}=\sqrt{${a1.map(v => v * v).join('+')}}=${r11}\), so \(q_1=\frac{1}{${r11}}${tup(a1)}\approx${tup(q1.map(v => fx(v)))}\). Then \(r_{12}=q_1^Ta_2=\frac{${dot(a1, a2)}}{${r11}}${ap(r12)}\). The next step normalizes \(a_2-r_{12}q_1\), which is orthogonal to \(q_1\).`};
    }},
  ]);

  P.add(12, [
    {key: 'scalar-ridge', skill: 'One-parameter ridge regression', make(r) {
      const [a, lam] = r.pick([[1, 1], [1, 3], [1, 4], [1, 0.25], [2, 1], [2, 4], [1, 9], [2, 6]]), b = r.nonzero(-6, 8);
      const th = a * b / (a * a + lam), data = (a * th - b) ** 2, pen = lam * th * th;
      const lt = lam === 1 ? '' : lam, at = a === 1 ? Q`\theta` : Q`${a}\theta`, ah = a === 1 ? Q`\hat\theta` : Q`${a}\hat\theta`;
      return {prompt: Q`Minimize \(L(\theta)=(${at}${pm(-b)})^2+${lt}\theta^2\). Find \(\hat\theta\), then the data term \((${ah}${pm(-b)})^2\) and the penalty \(${lt}\hat\theta^2\) separately (2 decimals).`,
        answers: [{label: Q`\(\hat\theta\)`, value: th}, {label: 'Data term', value: data}, {label: 'Penalty', value: pen}],
        hint: Q`Set the derivative to zero: \(${a === 1 ? '2' : Q`2\cdot${a}`}(${at}${pm(-b)})+${lam === 1 ? '2' : Q`2\cdot${lam}`}\theta=0\), then collect the \(\theta\) terms.`,
        solution: Q`Solving gives \(\hat\theta=\frac{${a}\cdot${par(b)}}{${a * a}+${lam}}${ap(th)}\). The data term is \((${fx(a * th)}${pm(-b)})^2${ap(data)}\) and the penalty is \(${lam}\cdot${par(fx(th))}^2${ap(pen)}\). Without the penalty \(\theta=${fx(b / a)}\) fits exactly; the penalty shrinks \(\theta\) toward 0 at the cost of a larger residual.`};
    }},
    {key: 'ridge-normal-equations', skill: 'Solve the ridge normal equations', make(r) {
      let A, G;
      do { A = Array.from({length: 3}, () => [r.int(0, 2), r.int(-1, 2)]); G = [[dot(A.map(x => x[0]), A.map(x => x[0])), dot(A.map(x => x[0]), A.map(x => x[1]))], [0, dot(A.map(x => x[1]), A.map(x => x[1]))]]; G[1][0] = G[0][1]; } while (G[0][0] === 0 || G[1][1] === 0);
      const lam = r.int(1, 3), M = [[G[0][0] + lam, G[0][1]], [G[1][0], G[1][1] + lam]], th = ivec(r, 2, -3, 3), h = mv(M, th);
      return {prompt: Q`In ridge regression \(A^TA=${mat(G)}\), \(A^Tb=${col(h)}\) and \(\lambda=${lam}\). Solve \((A^TA+\lambda I)\theta=A^Tb\) for \(\theta\).`,
        answers: [{label: Q`\(\theta\)`, vector: th, tol: 0}],
        hint: Q`Add \(\lambda\) to each diagonal entry of \(A^TA\) first, then solve the resulting \(2\times2\) system.`,
        solution: Q`\(A^TA+${lam === 1 ? '' : lam}I=${mat(M)}\) has determinant \(${det2(M)}\). Solving \(${mat(M)}\theta=${col(h)}\) gives \(\theta=${tup(th)}\); check the first row: \(${M[0][0]}\cdot${par(th[0])}${pm(M[0][1])}\cdot${par(th[1])}=${h[0]}\). ${det2(G) === 0 ? Q`Here \(A^TA\) alone is singular, yet adding \(\lambda I\) makes the system solvable.` : 'The penalty adds to the diagonal, which also improves conditioning.'}`};
    }},
    {key: 'feature-rescale', skill: 'Why a ridge penalty depends on feature scale', make(r) {
      const s = r.pick([2, 4, 5, 10]), k = r.nonzero(-3, 3), w = s * k, lam = r.pick([0.1, 0.5, 1, 2]);
      const before = fx(lam * w * w, 4), after = fx(lam * k * k, 4);
      return {prompt: Q`A ridge model uses coefficient \(w=${w}\) on feature \(x_j\), with penalty term \(\lambda w^2\) where \(\lambda=${lam}\). If \(x_j\) is re-expressed in units that multiply every value by ${s}, which coefficient keeps every prediction unchanged? Give it, then the penalty term before and after.`,
        answers: [{label: 'New coefficient', value: k, tol: 0}, {label: 'Penalty before', value: before}, {label: 'Penalty after', value: after}],
        hint: Q`Predictions depend on the product \(w\,x_j\). If \(x_j\) is multiplied by ${s}, how must \(w\) change to keep the product fixed?`,
        solution: Q`\(w'=${w}/${s}=${k}\) keeps \(w'(${s}x_j)=w\,x_j\). The penalty falls from \(${lam}\cdot${par(w)}^2=${before}\) to \(${lam}\cdot${par(k)}^2=${after}\), a factor of \(${s * s}\). Identical predictions now pay a different penalty, so ridge depends on feature scale; standardize with training statistics before comparing penalties.`};
    }},
    {key: 'choose-lambda', skill: 'Select the penalty strength with validation data', make(r) {
      const lams = r.pick([[0, 0.1, 1, 10], [0, 0.01, 0.1, 1], [0.1, 1, 10, 100]]), m = r.int(0, 3), train = [], val = [], test = [];
      let t = r.int(20, 60) / 100;
      for (let i = 0; i < 4; i++) { train.push(fx(t, 2)); t += r.int(15, 35) / 100; }
      for (let i = 0; i < 4; i++) val.push(fx(train[m] + 0.3 + 0.25 * Math.abs(i - m) + r.int(0, 5) / 100, 2));
      for (let i = 0; i < 4; i++) test.push(fx(val[i] + r.int(-12, 12) / 100, 2));
      // Choices stay in increasing order of lambda; the correct position varies with m.
      return {prompt: Q`Ridge models were fit with \(\lambda=${lams.join(', ')}\). Their training MSEs are ${train.join(', ')}; validation MSEs ${val.join(', ')}; test MSEs ${test.join(', ')}. Which \(\lambda\) should be selected?`,
        answers: [{label: 'Selected penalty', choices: lams.map(l => `λ = ${l}`), correct: m}],
        hint: 'Choose with data that was not used to fit the coefficients, and keep the test set untouched until the procedure is fixed.',
        solution: Q`Select by validation error: its minimum, ${val[m]}, occurs at \(\lambda=${lams[m]}\). Training error always favours the weakest penalty, and the test set is reserved for one final report of the chosen model (test MSE ${test[m]}), not for choosing \(\lambda\).`};
    }},
  ]);
})();
