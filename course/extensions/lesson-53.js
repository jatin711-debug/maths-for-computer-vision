/* Lesson 53: matrix calculus for layers and losses. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const col = v => mat(v.map(x => [x]));
  const step = (title, tex, detail) => ({title, tex, detail});

  /* ---------- Worked example: f(x) = xᵀAx with A = [[1, a12], [0, 3]] and x = (x1, 1) ---------- */
  const quad = (A, v) => { const va = [v[0] * A[0][0] + v[1] * A[1][0], v[0] * A[0][1] + v[1] * A[1][1]]; return va[0] * v[0] + va[1] * v[1]; };  // (xᵀA)x
  const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
  function model(p) {
    const [k, x1] = p, A = [[1, k], [0, 3]], x = [x1, 1], S = [[2, k], [k, 6]];  // S = A + Aᵀ
    const grad = mv(S, x), Ax = mv(A, x), wrong = [2 * Ax[0], 2 * Ax[1]], diff = [grad[0] - wrong[0], grad[1] - wrong[1]];
    const h = 1e-3, f = quad(A, x), central = (quad(A, [x1 + h, 1]) - quad(A, [x1 - h, 1])) / (2 * h);
    const cos = (grad[0] * wrong[0] + grad[1] * wrong[1]) / (Math.hypot(...grad) * Math.hypot(...wrong));
    return {k, x1, A, x, S, grad, Ax, wrong, diff, f, central, angle: Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI};
  }
  function drawing(m) {
    const sym = [[1, m.k / 2], [m.k / 2, 3]], c = m.f;  // f(v) = vᵀ sym v; sym is positive definite for |a12| < 3.46
    const ell = Array.from({length: 121}, (_, i) => { const t = i / 120 * 2 * Math.PI, u = [Math.cos(t), Math.sin(t)], q = sym[0][0] * u[0] * u[0] + 2 * sym[0][1] * u[0] * u[1] + sym[1][1] * u[1] * u[1], r = Math.sqrt(c / q); return [r * u[0], r * u[1]]; });
    const R = Math.max(...ell.map(p => Math.hypot(...p))), gl = Math.hypot(...m.grad), wl = Math.hypot(...m.wrong), a = .55 * R / Math.max(gl, wl);
    const tipG = [m.x[0] + a * m.grad[0], m.x[1] + a * m.grad[1]], tipW = [m.x[0] + a * m.wrong[0], m.x[1] + a * m.wrong[1]];
    const n = [m.grad[0] / gl, m.grad[1] / gl], t = [-n[1], n[0]], tan = [[m.x[0] - .45 * R * t[0], m.x[1] - .45 * R * t[1]], [m.x[0] + .45 * R * t[0], m.x[1] + .45 * R * t[1]]];
    const pts = [...ell, [0, 0], tipG, tipW, ...tan], xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const lo = [Math.min(...xs), Math.min(...ys)], hi = [Math.max(...xs), Math.max(...ys)], sc = Math.min(300 / (hi[0] - lo[0]), 214 / (hi[1] - lo[1]));
    const ox = 25 + (300 - sc * (hi[0] - lo[0])) / 2, oy = 18 + (214 - sc * (hi[1] - lo[1])) / 2;
    const X = v => ox + (v - lo[0]) * sc, Y = v => oy + (hi[1] - v) * sc, P = p => `${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`;
    const text = (x, y, s, color = '#64736b', size = 14) => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial">${s}</text>`;
    let body = '<defs><marker id="l53-head-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#34734e"/></marker><marker id="l53-head-o" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#bd431c"/></marker></defs>';
    body += `<path d="M${X(lo[0]).toFixed(1)} ${Y(0).toFixed(1)}H${X(hi[0]).toFixed(1)}M${X(0).toFixed(1)} ${Y(lo[1]).toFixed(1)}V${Y(hi[1]).toFixed(1)}" stroke="#a8b6a5"/>`;
    body += `<path d="M${ell.map(P).join('L')}Z" fill="#315c8618" stroke="#315c86" stroke-width="2.5"/>`;
    body += `<path d="M${P(tan[0])}L${P(tan[1])}" stroke="#a8b6a5" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const px = [X(m.x[0]), Y(m.x[1])], np = [n[0], -n[1]], tp = [t[0], -t[1]], q = 9;  // pixel directions (the y axis points down)
    body += `<path d="M${(px[0] + q * np[0]).toFixed(1)} ${(px[1] + q * np[1]).toFixed(1)}L${(px[0] + q * np[0] + q * tp[0]).toFixed(1)} ${(px[1] + q * np[1] + q * tp[1]).toFixed(1)}L${(px[0] + q * tp[0]).toFixed(1)} ${(px[1] + q * tp[1]).toFixed(1)}" fill="none" stroke="#34734e" stroke-width="1.4"/>`;
    body += `<path d="M${P(m.x)}L${P(tipW)}" stroke="#bd431c" stroke-width="3" marker-end="url(#l53-head-o)"/><path d="M${P(m.x)}L${P(tipG)}" stroke="#34734e" stroke-width="3.5" marker-end="url(#l53-head-g)"/>`;
    body += `<circle cx="${px[0].toFixed(1)}" cy="${px[1].toFixed(1)}" r="5" fill="#172623"/>`;
    const v2 = v => `(${N(v[0], 2)}, ${N(v[1], 2)})`;
    body += text(345, 40, `level curve f = ${N(m.f, 2)}`, '#315c86') + text(345, 78, `(A + Aᵀ)x = ${v2(m.grad)}`, '#34734e') + text(345, 100, 'normal to the curve', '#64736b', 13);
    body += text(345, 138, `2Ax = ${v2(m.wrong)}`, '#bd431c') + text(345, 160, m.k === 0 ? 'same arrow: A is symmetric' : `${N(m.angle, 1)}° off the normal`, '#64736b', 13) + text(345, 198, `x = ${v2(m.x)}`, '#172623');
    return {body, caption: `Blue: the level curve of f through x = ${v2(m.x)}. Green: the true gradient (A + Aᵀ)x, perpendicular to the dashed tangent. Orange: the shortcut 2Ax${m.k === 0 ? ', which coincides with the green arrow because A is symmetric when a₁₂ = 0' : `, ${N(m.angle, 1)}° away from the normal`}. Both arrows share one scale.`};
  }
  function calculate(p) {
    const m = model(p), term = m.k === 0 ? '' : `${m.k < 0 ? '-' : '+'}${Math.abs(m.k) === 1 ? '' : N(Math.abs(m.k))}x_1x_2`;
    const gap = Math.hypot(...m.diff);
    return {
      steps: [
        step('Write the quadratic form out', Q`A=${mat(m.A)},\ x=${col(m.x)}:\quad f=x^TAx=x_1^2${term}+3x_2^2=${N(m.f, 4)}`, `Only the sum of the two off-diagonal entries, ${N(m.k)} + 0, multiplies x₁x₂. The lower-left entry is 0, so A is ${m.k === 0 ? 'diagonal, hence symmetric, at this setting' : 'not symmetric'}.`),
        step('Take the differential', Q`df=dx^TAx+x^TA\,dx=x^T(A+A^T)\,dx\;\Rightarrow\;\nabla f=${mat(m.S)}${col(m.x)}=${col(m.grad)}`, 'The first term is a number, so it equals its own transpose xᵀAᵀdx. Together the two terms give xᵀ(A + Aᵀ)dx, and the gradient is the column (A + Aᵀ)x, shaped like x.'),
        step('Compare with the shortcut 2Ax', Q`2Ax=${col(m.wrong)},\qquad (A+A^T)x-2Ax=(A^T-A)\,x=${col(m.diff)}`, `The shortcut treats A as symmetric. The error (Aᵀ − A)x has length ${N(gap, 4)}; it vanishes for every x only when A = Aᵀ, which here means a₁₂ = 0.`),
        step('Check with a central difference', Q`\frac{f(x+he_1)-f(x-he_1)}{2h}\Big|_{h=10^{-3}}=${N(m.central, 6)}\quad\text{vs}\quad ${N(m.grad[0])}\ \text{and}\ ${N(m.wrong[0])}`, `Perturbing x₁ by ±0.001 recovers ${N(m.central, 6)}, the first entry of (A + Aᵀ)x. A quadratic has no third derivative, so the central difference has no truncation error, only rounding. ${m.k === 0 ? 'With a₁₂ = 0 both formulas agree, so this check cannot tell them apart: always test with a non-symmetric matrix.' : `It disagrees with 2Ax by ${N(Math.abs(m.diff[0]), 4)} in this entry.`}`),
      ],
      values: [['f(x)', m.f], ['Correct gradient, x1', m.grad[0]], ['Correct gradient, x2', m.grad[1]], ['2Ax (wrong), x1', m.wrong[0]], ['2Ax (wrong), x2', m.wrong[1]], ['Central difference, x1', m.central]],
      note: 'Set a₁₂ = 0: A becomes diagonal, hence symmetric, and 2Ax agrees with (A + Aᵀ)x. Any other value separates them, and only the true gradient stays perpendicular to the level curve.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const T = M => M[0].map((_, j) => M.map(row => row[j]));
  const practice = [
    {key: 'quad-form-gradient', skill: 'Differentiate a quadratic form with a non-symmetric matrix', make(r) {
      let A;
      do { A = [[r.int(-3, 3), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 3)]]; } while (A[0][1] === A[1][0] || A.flat().filter(v => v !== 0).length < 3);
      const x = [r.nonzero(-2, 2), r.nonzero(-2, 2)], S = [[2 * A[0][0], A[0][1] + A[1][0]], [A[0][1] + A[1][0], 2 * A[1][1]]];
      const g = mv(S, x), w = mv(A, x).map(v => 2 * v);
      return {prompt: Q`Let \(f(x)=x^TAx\) with \(A=${mat(A)}\). Find the gradient \(\nabla f\) at \(x=(${x.join(', ')})\).`,
        answers: [{label: Q`\(\nabla f\)`, vector: g, tol: 0}],
        hint: Q`Use \(\nabla(x^TAx)=(A+A^T)x\). A is not symmetric, so form \(A+A^T\) first.`,
        solution: Q`\(A+A^T=${mat(S)}\), so \(\nabla f=${mat(S)}${col(x)}=(${g.map(v => N(v)).join(', ')})\). The shortcut \(2Ax=(${w.map(v => N(v)).join(', ')})\) is wrong here because \(A\neq A^T\).`};
    }},
    {key: 'lsq-gradient', skill: 'Differentiate a squared residual norm', make(r) {
      let A, b, x, res, g;
      do {
        A = [0, 1, 2].map(() => [r.int(-2, 2), r.int(-2, 2)]); b = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; x = [r.int(-2, 2), r.int(-2, 2)];
        res = A.map((row, i) => row[0] * x[0] + row[1] * x[1] - b[i]); g = [0, 1].map(j => 2 * A.reduce((t, row, i) => t + row[j] * res[i], 0));
      } while (g.every(v => v === 0) || A.some(row => row.every(v => v === 0)));
      return {prompt: Q`Let \(f(x)=\|Ax-b\|^2\) with \(A=${mat(A)}\) and \(b=(${b.join(', ')})\). Find \(\nabla f\) at \(x=(${x.join(', ')})\).`,
        answers: [{label: Q`\(\nabla f\)`, vector: g, tol: 0}],
        hint: Q`First compute the residual \(r=Ax-b\), which has 3 entries. Then \(\nabla f=2A^Tr\) has 2 entries, like x.`,
        solution: Q`\(r=Ax-b=(${res.map(v => N(v)).join(', ')})\) and \(A^Tr=(${g.map(v => N(v / 2)).join(', ')})\), so \(\nabla f=2A^Tr=(${g.map(v => N(v)).join(', ')})\).`};
    }},
    {key: 'linear-layer-grads', skill: 'Backpropagate through a linear layer', make(r) {
      let X, G, dW, db;
      do {
        X = [0, 1, 2].map(() => [r.int(-2, 2), r.int(-2, 2)]); G = [0, 1, 2].map(() => [r.int(-2, 2), r.int(-2, 2)]);
        dW = [0, 1].map(d => [0, 1].map(c => X.reduce((t, row, n) => t + row[d] * G[n][c], 0))); db = [0, 1].map(c => G.reduce((t, row) => t + row[c], 0));
      } while (dW.flat().every(v => v === 0) || X.some(row => row.every(v => v === 0)) || [0, 1].some(c => G.every(row => row[c] === 0)));
      return {prompt: Q`A linear layer computes \(Y=XW+\mathbf 1b^T\) for a batch of three rows with \(X=${mat(X)}\). Backpropagation delivers the upstream gradient \(G=\partial L/\partial Y=${mat(G)}\). Find \(\partial L/\partial W\), entered row by row as four numbers, and \(\partial L/\partial b\).`,
        answers: [{label: Q`\(\partial L/\partial W\) row by row`, vector: dW.flat(), tol: 0}, {label: Q`\(\partial L/\partial b\)`, vector: db, tol: 0}],
        hint: Q`\(\partial L/\partial W=X^TG\) has the shape of W, 2 × 2: entry (d, c) adds column d of X times column c of G over the three rows. \(\partial L/\partial b\) adds up each column of G.`,
        solution: Q`\(X^T=${mat(T(X))}\), so \(X^TG=${mat(dW)}\). The bias gradient is the column sums of G, \((${db.map(v => N(v)).join(', ')})\). Neither answer needs W; it enters only \(\partial L/\partial X=GW^T\).`};
    }},
    {key: 'gradient-shapes', skill: 'Predict gradient shapes in a linear layer', make(r) {
      let n, d, c;
      do { n = r.pick([8, 16, 32, 64]); d = r.pick([3, 48, 128, 256, 512, 784]); c = r.pick([2, 5, 10, 20, 100]); } while (n === d || d === c || n === c);
      return {prompt: Q`A linear layer maps a batch X of shape ${n} × ${d} to \(Y=XW+\mathbf 1b^T\) of shape ${n} × ${c}. Give the shapes of \(\partial L/\partial W\) and \(\partial L/\partial X\) as rows × columns (for example 3x4), and the number of entries of \(\partial L/\partial b\).`,
        answers: [{label: Q`Shape of \(\partial L/\partial W\)`, vector: [d, c], tol: 0}, {label: Q`Shape of \(\partial L/\partial X\)`, vector: [n, d], tol: 0}, {label: Q`Entries of \(\partial L/\partial b\)`, value: c, tol: 0}],
        hint: 'A gradient has the shape of its variable. First work out the shape of W from the shapes of X and Y.',
        solution: Q`W must be ${d} × ${c} so that XW is ${n} × ${c}. Then \(\partial L/\partial W=X^TG\) is \((${d}\times${n})(${n}\times${c})\), that is ${d} × ${c}; \(\partial L/\partial X=GW^T\) is \((${n}\times${c})(${c}\times${d})\), that is ${n} × ${d}; and \(\partial L/\partial b=G^T\mathbf 1\) has ${c} entries.`};
    }},
  ];

  /* ---------- Lab: a gradient checker ---------- */
  const matvec = (M, v) => M.map(row => row.reduce((t, a, j) => t + a * v[j], 0));
  const tmatvec = (M, v) => M[0].map((_, j) => M.reduce((t, row, i) => t + row[j] * v[i], 0));
  const vec = v => `(${v.map(x => N(x, 2)).join(', ')})`;
  const rowsText = M => `[${M.map(r => r.map(x => N(x, 2)).join(', ')).join('; ')}]`;
  const layerResidual = (w, inp) => inp.X.map((row, n) => [0, 1].map(c => row.reduce((t, a, d) => t + a * w[2 * d + c], 0) - inp.Y[n][c]));
  const FUNCS = {
    lin: {name: 'aᵀx with respect to x', shape: [3, 1], variable: inp => inp.x, describe: inp => `a = ${vec(inp.a)}, x = ${vec(inp.x)}`,
      f: (x, inp) => inp.a.reduce((t, a, i) => t + a * x[i], 0), grad: (x, inp) => inp.a.slice(), formula: 'a',
      bug: x => x.slice(), bugFormula: 'x (the wrong vector)'},
    quad: {name: 'xᵀAx with respect to x', shape: [3, 1], variable: inp => inp.x, describe: inp => `A = ${rowsText(inp.A)} (not symmetric), x = ${vec(inp.x)}`,
      f: (x, inp) => x.reduce((t, xi, i) => t + xi * inp.A[i].reduce((s, a, j) => s + a * x[j], 0), 0),
      grad: (x, inp) => matvec(inp.A, x).map((v, i) => v + tmatvec(inp.A, x)[i]), formula: '(A + Aᵀ)x',
      bug: (x, inp) => matvec(inp.A, x).map(v => 2 * v), bugFormula: '2Ax (assumes A = Aᵀ)'},
    lsq: {name: '‖Ax − b‖² with respect to x', shape: [3, 1], variable: inp => inp.x, describe: inp => `A is 4 × 3, b = ${vec(inp.b)}, x = ${vec(inp.x)}`,
      f: (x, inp) => matvec(inp.B, x).reduce((t, v, i) => t + (v - inp.b[i]) ** 2, 0),
      grad: (x, inp) => tmatvec(inp.B, matvec(inp.B, x).map((v, i) => v - inp.b[i])).map(v => 2 * v), formula: '2Aᵀ(Ax − b)',
      bug: (x, inp) => tmatvec(inp.B, matvec(inp.B, x).map((v, i) => v - inp.b[i])), bugFormula: 'Aᵀ(Ax − b) (factor 2 dropped)'},
    layer: {name: '‖XW − Y‖²_F with respect to W', shape: [3, 2], variable: inp => inp.W.flat(), describe: inp => `X is 4 × 3, Y is 4 × 2, W = ${rowsText(inp.W)}`,
      f: (w, inp) => layerResidual(w, inp).flat().reduce((t, v) => t + v * v, 0),
      grad: (w, inp) => { const R = layerResidual(w, inp); return [0, 1, 2].flatMap(d => [0, 1].map(c => 2 * inp.X.reduce((t, row, n) => t + row[d] * R[n][c], 0))); }, formula: '2Xᵀ(XW − Y)',
      bug: (w, inp) => FUNCS.layer.grad(w, inp).map(v => v / 4), bugFormula: '2Xᵀ(XW − Y)/4 (averaged, but the loss is a sum)'},
    softmax: {name: 'softmax cross-entropy with respect to the logits z', shape: [4, 1], variable: inp => inp.z, describe: inp => `z = ${vec(inp.z)}, target class t = ${inp.t} (counting from 0)`,
      f: (z, inp) => { const m = Math.max(...z); return m + Math.log(z.reduce((t, v) => t + Math.exp(v - m), 0)) - z[inp.t]; },
      grad: (z, inp) => { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((t, v) => t + v, 0); return e.map((v, i) => v / s - (i === inp.t ? 1 : 0)); }, formula: 'p − y',
      bug: (z, inp) => FUNCS.softmax.grad(z, inp).map((v, i) => v + (i === inp.t ? 1 : 0)), bugFormula: 'p (forgot to subtract the one-hot y)'},
  };
  function makeInputs(seed) {
    const g = window.CV_VISION.rng(5300 + 7919 * seed), u = () => Math.round((2 * g.next() - 1) * 15) / 10;
    const mk = (r, c) => Array.from({length: r}, () => Array.from({length: c}, u));
    return {a: mk(3, 1).flat(), x: mk(3, 1).flat(), A: mk(3, 3), B: mk(4, 3), b: mk(4, 1).flat(), X: mk(4, 3), W: mk(3, 2), Y: mk(4, 2), z: mk(4, 1).flat(), t: Math.floor(g.next() * 4)};
  }
  function numeric(F, inp, theta, h, scheme) {
    const f0 = scheme === 'forward' ? F.f(theta, inp) : 0;
    return theta.map((v, k) => {
      const up = theta.slice(); up[k] = v + h;
      if (scheme === 'forward') return (F.f(up, inp) - f0) / h;
      const down = theta.slice(); down[k] = v - h;
      return (F.f(up, inp) - F.f(down, inp)) / (2 * h);
    });
  }
  const relErr = (g, n) => g.map((v, k) => Math.abs(v - n[k]) / Math.max(1e-8, Math.abs(v) + Math.abs(n[k])));
  const lab = {
    name: 'matcalc', title: 'Gradient checker',
    heading: 'Derive a gradient. Then let finite differences judge it.',
    intro: 'Each function is evaluated on small random inputs. The analytic gradient, shaped like the variable, is compared entry by entry with a finite-difference estimate at step h.',
    defaults: {fn: 'softmax', buggy: false, scheme: 'central', logh: -5, seed: 1},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return select('fn', 'Function to check', [['lin', 'aᵀx, in x'], ['quad', 'xᵀAx, A not symmetric'], ['lsq', '‖Ax − b‖², in x'], ['layer', '‖XW − Y‖²_F, in W'], ['softmax', 'Softmax cross-entropy']], s.fn) +
        check('buggy', 'Use a common wrong formula', s.buggy) +
        select('scheme', 'Finite difference', [['central', 'Central difference'], ['forward', 'Forward difference']], s.scheme) +
        range('logh', 'Step size log₁₀ h', -12, -1, .5, s.logh) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New inputs ↻</button></div>' +
        '<div class="math-rule">central: ĝₖ = (f(θ + h eₖ) − f(θ − h eₖ)) / 2h<br>forward: ĝₖ = (f(θ + h eₖ) − f(θ)) / h<br>relative error = |gₖ − ĝₖ| / max(10⁻⁸, |gₖ| + |ĝₖ|)</div>';
    },
    visual: () => '<div id="mc-grids"></div><div id="mc-plot"></div>',
    note: 'Predict first: with the central difference on xᵀAx, does the error rise again when h gets large? It does not: a quadratic has no third derivative, so only rounding error remains and the curve keeps falling. Switch to softmax cross-entropy, or to forward differences, to see the full U: truncation error on the right, rounding error on the left. Then tick the wrong formula: the error stays large at every h, which is how a gradient check separates a bug from a poor step size.',
    render(s, root) {
      const V = window.CV_VISION, {fmt, E} = V, F = FUNCS[s.fn], inp = makeInputs(s.seed), theta = F.variable(inp), [rows, cols] = F.shape;
      const g = (s.buggy ? F.bug : F.grad)(theta, inp), h = 10 ** s.logh, num = numeric(F, inp, theta, h, s.scheme), err = relErr(g, num), worst = Math.max(...err);
      const sweep = scheme => Array.from({length: 45}, (_, i) => { const lh = -12 + i / 4; return [lh, Math.log10(Math.max(1e-17, ...relErr(g, numeric(F, inp, theta, 10 ** lh, scheme))))]; });
      const curves = {central: sweep('central'), forward: sweep('forward')}, mine = curves[s.scheme], best = mine.reduce((a, b) => b[1] < a[1] ? b : a);
      const seven = v => Math.abs(v) < 1e-300 ? '0' : Number(v.toPrecision(7)).toString(), expo = v => v === 0 ? '0' : v.toExponential(1);
      const heat = e => `background:color-mix(in srgb, var(--orange) ${Math.round(45 * Math.max(0, Math.min(1, (Math.log10(Math.max(e, 1e-17)) + 14) / 13)))}%, var(--paper))`;
      const grid = (vals, show, style, flag) => `<div class="number-grid" style="--columns:${cols};max-width:${cols * 96}px">${vals.map((v, i) => `<span${flag && flag(i) ? ' class="highlighted"' : ''}${style ? ` style="${style(i)}"` : ''}>${show(v)}</span>`).join('')}</div>`;
      root.querySelector('#mc-grids').innerHTML = `<div class="vk-probe"><div><h4>Analytic g = ${E(s.buggy ? F.bugFormula : F.formula)}</h4>${grid(g, seven)}</div><div><h4>Numerical ĝ (${s.scheme}, h = ${E(h.toExponential(1))})</h4>${grid(num, seven)}</div><div><h4>Relative error per entry</h4>${grid(err, expo, i => heat(err[i]), i => err[i] > 1e-6)}</div></div><p class="small muted">${E(F.name)}; ${rows} × ${cols} gradient, the shape of the variable. Inputs: ${E(F.describe(inp))}.</p>`;
      const plot = window.CV_VISION_LABS.svgPlot({h: 200, x: [-12, -1], y: [-16, 0], lines: [{points: curves.forward, cls: 'series-a'}, {points: curves.central, cls: 'series-b'}], dots: [[s.logh, Math.log10(Math.max(1e-17, worst)), s.scheme === 'central' ? 'vk-sample' : 'vk-tip']], marker: s.logh, label: 'Largest relative error against the step size for forward and central differences', xLabel: 'log₁₀ h', yLabel: 'log₁₀ max rel. error', xTicks: [-12, -10, -8, -6, -4, -2], yTicks: [-16, -12, -8, -4, 0]});
      root.querySelector('#mc-plot').innerHTML = plot + '<p class="vk-legend"><span style="white-space:nowrap"><span class="vk-key vk-key-vector" style="margin-right:5px"></span>forward difference</span><span style="white-space:nowrap"><span class="vk-key vk-key-eig1" style="margin-right:5px"></span>central difference</span><span>Dashed line: the current h.</span></p>';
      const bestH = (10 ** best[0]).toExponential(0), verdict = worst < 1e-6 ? 'agree' : best[1] < -6 ? `step-size effect: try h near ${bestH}` : 'disagree at every h: suspect the formula';
      return V.report([['f at the inputs', fmt(F.f(theta, inp), 4)], ['Max relative error', worst === 0 ? '0' : worst.toExponential(2)], ['Verdict', verdict], [`Best h for the ${s.scheme} difference`, best[1] > -2 ? 'none: the error is large at every h' : `${bestH} (error ${(10 ** best[1]).toExponential(1)})`]]);
    },
    action(name, s) { if (name === 'reseed') s.seed++; },
  };

  window.CV_EXTEND.lesson(53, {
    teaching: {
      equation: Q`dL=\operatorname{tr}\left(G^T dY\right),\quad Y=XW+\mathbf 1b^T\;\Rightarrow\;\frac{\partial L}{\partial W}=X^TG,\quad\frac{\partial L}{\partial X}=GW^T,\quad\frac{\partial L}{\partial b}=G^T\mathbf 1`,
      symbols: [['G', 'upstream gradient ∂L/∂Y'], ['X', 'batch of inputs, N × D'], ['W', 'weights, D × C'], ['tr', 'trace: sum of the diagonal'], ['1', 'column of N ones']],
      connection: 'Every layer in a vision network receives an upstream gradient G and returns XᵀG for its weights and GWᵀ for its input. Convolution, attention and normalization layers follow the same differential bookkeeping, and a gradient check is how you test a custom layer before training it.',
      trap: 'A common mistake is writing 2Ax for the gradient of xᵀAx: that holds only when A is symmetric. A square matrix lets a missing transpose pass a shape check, so confirm every new derivation numerically.',
      question: 'For Y = XW with X of shape 32 × 512 and W of shape 512 × 10, what is the shape of ∂L/∂W?',
      choices: ['512 × 10', '32 × 10', '10 × 512'], correct: 0,
      explanation: 'A gradient has the shape of its variable. XᵀG multiplies a 512 × 32 matrix by a 32 × 10 matrix, giving 512 × 10.',
    },
    guide: {
      title: 'Let shapes and the differential do the bookkeeping',
      paragraphs: [
        'Matrix calculus is the chain rule with careful accounting. Use one convention: the derivative of a scalar loss with respect to a vector or a matrix has the shape of that variable. Most transposes are then forced, because only one arrangement of the factors produces the right shape.',
        'The differential makes derivations short. Write the first-order change dL, rearrange it into tr(Mᵀ dW) with the cyclic property of the trace, and read off ∂L/∂W = M. For a linear layer this gives XᵀG, GWᵀ and the column sums of G in three lines.',
      ],
      example: 'The gradient of xᵀAx when A is not symmetric',
      controls: [{label: 'Off-diagonal entry a₁₂ (a₂₁ = 0)', min: -3, max: 3, step: .5, value: 2}, {label: 'Coordinate x₁ (x₂ = 1)', min: -2, max: 2, step: .5, value: 1}],
      predict: 'Set a₁₂ = 0 so that A is diagonal. Do (A + Aᵀ)x and 2Ax agree then? When a₁₂ ≠ 0, which arrow stays perpendicular to the level curve?',
      takeaway: 'The gradient of xᵀAx is (A + Aᵀ)x, and like every gradient it is perpendicular to the level curve through x. The shortcut 2Ax is right only for symmetric A, and a finite-difference check exposes the difference at once.',
      notation: 'G = ∂L/∂Y is the gradient arriving from the layers above and has the shape of Y. X holds one input per row and W maps D input features to C outputs. tr sums the diagonal, so tr(MᵀB) adds the products of matching entries, and 1 is a column of ones.',
    },
    notation: {
      G: {tex: 'G', detail: 'The upstream gradient ∂L/∂Y: how the loss changes with each entry of the layer output. It has the shape of Y, N × C, and is all a layer needs from the layers above it.'},
      X: {tex: 'X', detail: 'The batch of inputs, one example per row, of shape N × D. Its gradient ∂L/∂X = GWᵀ has the same shape and is passed on to the layer below.'},
      W: {tex: 'W', detail: 'The weight matrix of shape D × C, mapping D input features to C outputs. Its gradient XᵀG has the same shape, which is why the transpose sits on X.'},
      tr: {tex: Q`\operatorname{tr}`, detail: 'The trace adds the diagonal entries of a square matrix. tr(MᵀB) equals the sum of Mᵢⱼ Bᵢⱼ over all entries, and tr(ABC) = tr(CAB) lets you move factors to read off a gradient.'},
      '1': {tex: Q`\mathbf 1`, detail: 'A column of N ones. 1bᵀ copies the bias row into every example, and Gᵀ1 adds up the rows of G, which is the bias gradient.'},
    },
    calculate, practice, lab,
  });
})();
