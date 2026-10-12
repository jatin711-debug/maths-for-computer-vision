/* Lesson 52: robust fitting with RANSAC, robust losses and Gauss–Newton refinement. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  // Four significant figures, switching to a TeX power of ten for very small or very large magnitudes.
  const sig = (x, d = 4) => {
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e-3 && a < 1e7) return Number(x.toPrecision(d)).toString();
    const e = Math.floor(Math.log10(a));
    return Q`${Number((x / 10 ** e).toPrecision(3))}\times10^{${e}}`;
  };
  const sigText = x => sig(x).replace(Q`\times10^`, ' × 10^').replace(/[{}]/g, '');
  const step = (title, tex, detail) => ({title, tex, detail});

  /* ---------- Worked example: how many RANSAC samples? ---------- */
  function model(p) {
    const [eps, s, conf] = p;
    const clean = (1 - eps) ** s;                                // one minimal sample is outlier-free
    const exact = Math.log(1 - conf) / Math.log(1 - clean);      // solve (1 - clean)^N = 1 - p
    const iters = Math.ceil(exact);
    const fail = (1 - clean) ** iters;                           // every one of the N samples contaminated
    return {eps, s, conf, clean, exact, iters, fail, expected: 1 / clean};
  }
  function drawing(m) {
    const L = 62, R = 505, T = 22, B = 212, emax = 0.8, lmax = 7;
    const X = e => L + e / emax * (R - L), Y = l => B - Math.max(0, Math.min(lmax, l)) / lmax * (B - T);
    const logN = (e, s) => { const n = Math.log(1 - m.conf) / Math.log(1 - (1 - e) ** s); return Math.log10(Math.max(1, n)); };
    const curve = s => Array.from({length: 81}, (_, i) => `${i ? 'L' : 'M'}${X(i / 100).toFixed(1)} ${Y(logN(i / 100, s)).toFixed(1)}`).join('');
    const text = (x, y, t, color = '#64736b', size = 12, anchor = 'start', halo = false) => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${halo ? ' stroke="#fffefa" stroke-width="5" paint-order="stroke" stroke-linejoin="round"' : ''}>${t}</text>`;
    const ticks = ['1', '10', '100', '1k', '10k', '100k', '1M', '10M'];
    let body = '';
    ticks.forEach((t, l) => { body += `<path d="M${L} ${Y(l)}H${R}" stroke="#a8b6a5" stroke-width="${l ? .6 : 1.2}" opacity="${l ? .55 : 1}"/>` + text(L - 8, Y(l) + 4, t, '#64736b', 11, 'end'); });
    [0, .2, .4, .6, .8].forEach(e => { body += `<path d="M${X(e)} ${T}V${B}" stroke="#a8b6a5" stroke-width="${e ? .6 : 1.2}" opacity="${e ? .55 : 1}"/>` + text(X(e), B + 16, N(e, 1), '#64736b', 11, 'middle'); });
    [2, 4, 8].filter(s => s !== m.s).forEach(s => { body += `<path d="${curve(s)}" fill="none" stroke="#a8b6a5" stroke-width="1.6" stroke-dasharray="5 4"/>` + text(R + 4, Y(logN(.8, s)) + 4, `s = ${s}`); });
    body += `<path d="${curve(m.s)}" fill="none" stroke="#34734e" stroke-width="3"/>` + text(R + 4, Y(logN(.8, m.s)) + (m.eps > .7 ? 22 : 4), `s = ${m.s}`, '#34734e', 12);
    const px = X(m.eps), py = Y(Math.log10(Math.max(1, m.exact)));
    body += `<path d="M${L} ${py.toFixed(1)}H${px.toFixed(1)}V${B}" fill="none" stroke="#bd431c" stroke-width="1.2" stroke-dasharray="4 4"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="#bd431c"/>`;
    body += text(px > 360 ? px - 10 : px + 10, py > 40 ? py - 12 : py + 22, `N = ${m.iters}`, '#bd431c', 14, px > 360 ? 'end' : 'start', true);
    body += text((L + R) / 2, 244, 'outlier fraction ε', '#172623', 12, 'middle') + `<text x="16" y="${(T + B) / 2}" fill="#172623" font-size="12" font-family="Segoe UI,Arial" text-anchor="middle" transform="rotate(-90,16,${(T + B) / 2})">samples N (log scale)</text>`;
    return {body, caption: `Green: samples needed against the outlier fraction for s = ${m.s} at confidence p = ${N(m.conf)}. Grey dashed: s = 2, 4 and 8 for comparison. Orange: your setting, N = ${m.iters}. The vertical axis is logarithmic.`};
  }
  function calculate(p) {
    const m = model(p);
    return {
      steps: [
        step('Probability that one sample is clean', Q`(1-\varepsilon)^s=(1-${N(m.eps, 2)})^{${m.s}}=${sig(m.clean)}`, `A sample is outlier-free only if all ${m.s} of its points are inliers. Treating the draws as independent, each is an inlier with probability ${N(1 - m.eps, 2)}, so the probabilities multiply.`),
        step('Probability that every sample fails', Q`P(\text{all }N\text{ contaminated})=\left(1-${sig(m.clean)}\right)^N\le1-p=${sig(1 - m.conf)}`, `Each sample is contaminated with probability ${sigText(1 - m.clean)}. RANSAC fails only if all N samples are, and you require that to happen at most a fraction ${sigText(1 - m.conf)} of the time.`),
        step('Solve for N and round up', Q`N=\left\lceil\frac{\ln(1-p)}{\ln\left(1-(1-\varepsilon)^s\right)}\right\rceil=\left\lceil\frac{${sig(Math.log(1 - m.conf))}}{${sig(Math.log(1 - m.clean))}}\right\rceil=\lceil${N(m.exact, 2)}\rceil=${m.iters}`, 'Take logarithms of both sides. Both logarithms are negative, so dividing by the denominator flips the inequality into N ≥ the ratio. Round up, because N counts samples.'),
        step('Check the guarantee', Q`\left(1-${sig(m.clean)}\right)^{${m.iters}}=${sig(m.fail)}\le${sig(1 - m.conf)},\qquad \frac{1}{(1-\varepsilon)^s}=${sig(m.expected)}`, `With ${m.iters} samples the chance of never drawing a clean one is ${sigText(m.fail)}. On average the first clean sample arrives after about ${sigText(m.expected)} draws; N is larger because it must also cover unlucky runs.`),
      ],
      values: [['Clean-sample probability', m.clean], ['Exact N from the formula', m.exact], ['Iterations N (rounded up)', m.iters], ['Chance every sample fails', m.fail], ['Expected draws until a clean sample', m.expected]],
      note: 'Raise s from 2 to 4 at ε = 0.5: N grows from 17 to 72. The cost is exponential in the sample size, so minimal models and a good guess of ε matter more than the confidence p.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dot = (a, b) => a.reduce((t, v, i) => t + v * b[i], 0);
  const practice = [
    {key: 'ransac-iterations', skill: 'Choose the number of RANSAC samples', make(r) {
      let eps, s, p, w, exact;
      do { eps = r.pick([.1, .2, .25, .3, .4, .5]); s = r.pick([2, 3, 4]); p = r.pick([.95, .99]); w = (1 - eps) ** s; exact = Math.log(1 - p) / Math.log(1 - w); } while (Math.abs(exact - Math.round(exact)) < .05);
      const n = Math.ceil(exact);
      return {prompt: Q`A model needs \(s=${s}\) points per minimal sample, and a fraction \(\varepsilon=${eps}\) of the data are outliers. How many samples N give confidence \(p=${p}\) that at least one sample is outlier-free? Give \((1-\varepsilon)^s\) and the whole number N (round up).`,
        answers: [{label: Q`\((1-\varepsilon)^s\)`, value: w, tol: 1e-4}, {label: 'N', value: n, tol: 0}],
        hint: Q`First find the probability that one sample is clean, \((1-${eps})^{${s}}\). Then solve \(\left(1-(1-\varepsilon)^s\right)^N\le1-p\) for N.`,
        solution: Q`\((1-${eps})^{${s}}=${N(w, 6)}\). Then \(N=\left\lceil\ln(${N(1 - p, 2)})/\ln(${N(1 - w, 6)})\right\rceil=\lceil${N(Math.log(1 - p), 4)}/(${N(Math.log(1 - w), 4)})\rceil=\lceil${N(exact, 2)}\rceil=${n}\).`};
    }},
    {key: 'huber-weight', skill: 'Evaluate the Huber loss and its IRLS weight', make(r) {
      const delta = r.pick([.5, 1, 2]), res = r.sign() * r.pick([.25, .5, 1.5, 3, 4, 6, 8]), a = Math.abs(res);
      const small = a <= delta, rho = small ? res * res / 2 : delta * (a - delta / 2), w = Math.min(1, delta / a);
      return {prompt: Q`For the Huber loss with threshold \(\delta=${delta}\), find the loss \(\rho_\delta(r)\) and the IRLS weight \(w(r)=\min(1,\delta/|r|)\) for the residual \(r=${res}\).`,
        answers: [{label: Q`\(\rho_\delta(r)\)`, value: rho}, {label: Q`\(w(r)\)`, value: w}],
        hint: Q`Compare \(|r|=${a}\) with \(\delta=${delta}\). Use \(\tfrac12r^2\) inside the threshold and \(\delta(|r|-\tfrac12\delta)\) outside it.`,
        solution: small ? Q`\(|r|=${a}\le${delta}\), so \(\rho=\tfrac12(${res})^2=${N(rho, 5)}\) and \(w=1\): inside the threshold the loss is ordinary least squares.` : Q`\(|r|=${a}>${delta}\), so \(\rho=${delta}\,(${a}-${delta / 2})=${N(rho, 5)}\), compared with \(\tfrac12r^2=${N(res * res / 2, 5)}\) for squared loss. The weight is \(${delta}/${a}=${N(w, 5)}\), so the influence \(w\,r=${N(w * res, 5)}\) is capped at \(\pm\delta\).`};
    }},
    {key: 'ransac-consensus', skill: 'Fit a minimal sample and count its consensus set', make(r) {
      const m = r.nonzero(-2, 2), c = r.int(-3, 3), xs = [0, 1, 2, 3, 4, 5], bad = r.distinct(r.int(1, 2), 0, 5);
      const dev = xs.map(i => bad.includes(i) ? r.pick([-5, -4, -3, 3, 4, 5]) : r.pick([0, 0, .5, -.5]));
      const ys = xs.map((x, i) => m * x + c + dev[i]);
      let i, j, slope, guard = 0;
      do { [i, j] = r.distinct(2, 0, 5).sort((a, b) => a - b); slope = (ys[j] - ys[i]) / (j - i); guard++; } while (Math.abs(2 * slope - Math.round(2 * slope)) > 1e-9 && guard < 40);
      if (Math.abs(2 * slope - Math.round(2 * slope)) > 1e-9) { j = i + 1 <= 5 ? i + 1 : i - 1; if (j < i) [i, j] = [j, i]; slope = (ys[j] - ys[i]) / (j - i); }
      const icpt = ys[i] - slope * xs[i], res = xs.map((x, k) => ys[k] - (slope * x + icpt)), count = res.filter(v => Math.abs(v) <= 1 + 1e-9).length;
      const hit = [i, j].filter(k => bad.includes(k));
      const remark = hit.length ? `The sample contains a gross outlier (x = ${hit.join(' and x = ')}), so its line misses the trend that most points follow; a clean sample would usually gather more votes.` : 'Both sampled points are inliers of the generating line, so this model is the kind RANSAC is looking for; a least-squares refit on its consensus set would average out the small deviations.';
      return {prompt: Q`The data are ${xs.map(k => Q`\((${k}, ${N(ys[k], 2)})\)`).join(', ')}. RANSAC draws the minimal sample \((${i}, ${N(ys[i], 2)})\) and \((${j}, ${N(ys[j], 2)})\). Find the line \(y=mx+c\) through them, then count the points (the two sampled ones included) with vertical residual \(|y-(mx+c)|\le1\).`,
        answers: [{label: Q`\((m, c)\)`, vector: [slope, icpt], tol: 1e-6}, {label: 'Consensus count', value: count, tol: 0}],
        hint: Q`\(m=(y_j-y_i)/(x_j-x_i)\) and then \(c=y_i-m\,x_i\). Compute each residual \(y-(mx+c)\) and compare its size with 1.`,
        solution: Q`\(m=(${N(ys[j], 2)}-(${N(ys[i], 2)}))/(${j}-${i})=${N(slope, 3)}\) and \(c=${N(ys[i], 2)}-(${N(slope, 3)})(${i})=${N(icpt, 3)}\). The residuals are ${res.map(v => Q`\(${N(v, 2)}\)`).join(', ')}, so ${count} of the 6 points are within 1. ${remark}`};
    }},
    {key: 'gauss-newton-step', skill: 'Take a Gauss–Newton and a Levenberg–Marquardt step', make(r) {
      let J, res;
      do { J = [r.nonzero(-3, 3), r.int(-2, 2), r.nonzero(-2, 2)]; res = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; } while (dot(J, res) === 0);
      const lambda = r.pick([1, 2, 4, 5, 10]), JtJ = dot(J, J), Jtr = dot(J, res), gn = -Jtr / JtJ, lm = -Jtr / (JtJ + lambda);
      return {prompt: Q`A one-parameter model has, at the current estimate, residuals \(r=(${res.join(', ')})\) and derivatives \(J=\partial r/\partial\theta=(${J.join(', ')})\). Find the Gauss–Newton step \(\delta\) from \(J^TJ\,\delta=-J^Tr\), and the Levenberg–Marquardt step with \(\lambda=${lambda}\).`,
        answers: [{label: Q`Gauss–Newton \(\delta\)`, value: gn}, {label: Q`Levenberg–Marquardt \(\delta\)`, value: lm}],
        hint: Q`With one parameter, \(J^TJ=\sum_iJ_i^2\) and \(J^Tr=\sum_iJ_ir_i\) are numbers, so each step is a division.`,
        solution: Q`\(J^TJ=${J.map(v => v * v).join('+')}=${JtJ}\) and \(J^Tr=${J.map((v, k) => `(${v})(${res[k]})`).join('+')}=${Jtr}\). Gauss–Newton: \(\delta=${-Jtr}/${JtJ}=${N(gn, 4)}\). Levenberg–Marquardt: \(\delta=${-Jtr}/(${JtJ}+${lambda})=${N(lm, 4)}\), a shorter step in the same direction.`};
    }},
  ];

  /* ---------- Lab: least squares, Huber IRLS and RANSAC on a corrupted line ---------- */
  const DOMAIN = {x: [-3, 3], y: [-3.5, 3.5]}, COUNT = 50;
  let view = null;  // the latest plot mapping, used by the pointer handlers in wire()
  // Weighted least-squares line y = m x + c (weights optional); null when the x values do not determine a line.
  function fitLine(P, w) {
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
    P.forEach(([x, y], i) => { const a = w ? w[i] : 1; S += a; Sx += a * x; Sy += a * y; Sxx += a * x * x; Sxy += a * x * y; });
    const det = S * Sxx - Sx * Sx;
    return Math.abs(det) > 1e-12 ? {m: (S * Sxy - Sx * Sy) / det, c: (Sxx * Sy - Sx * Sxy) / det} : null;
  }
  function makeData(s) {
    const V = window.CV_VISION, g = V.rng(5200 + 7919 * s.seed);
    const m = -.9 + 1.8 * g.next(), c = -.6 + 1.2 * g.next();
    const base = Array.from({length: COUNT}, () => ({x: -2.9 + 5.8 * g.next(), z: g.gauss(), oy: DOMAIN.y[0] + .2 + (DOMAIN.y[1] - DOMAIN.y[0] - .4) * g.next(), rank: g.next()}));
    const order = base.map((_, i) => i).sort((a, b) => base[a].rank - base[b].rank), k = Math.round(s.outliers * COUNT), isOut = new Array(COUNT).fill(false);
    order.slice(0, k).forEach(i => { isOut[i] = true; });
    const pts = base.map((b, i) => s.moved && s.moved[i] ? s.moved[i].slice() : [b.x, isOut[i] ? b.oy : m * b.x + c + s.sigma * b.z]);
    const clean = isOut.map((o, i) => !o && !(s.moved && s.moved[i]));
    return {m, c, pts, clean};
  }
  function ransac(P, s, clean) {
    const g = window.CV_VISION.rng(9100 + s.seed);  // the same sample sequence for every N, so more samples extend the search
    let best = null, firstClean = 0, cleanDrawn = 0;
    for (let t = 1; t <= s.iters; t++) {
      const i = Math.floor(g.next() * P.length); let j = Math.floor(g.next() * (P.length - 1)); if (j >= i) j++;
      if (clean[i] && clean[j]) { cleanDrawn++; if (!firstClean) firstClean = t; }
      const dx = P[j][0] - P[i][0]; if (Math.abs(dx) < 1e-9) continue;
      const m = (P[j][1] - P[i][1]) / dx, c = P[i][1] - m * P[i][0];
      let count = 0; for (const [x, y] of P) if (Math.abs(y - m * x - c) <= s.threshold) count++;
      if (!best || count > best.count) best = {m, c, count, i, j, t};
    }
    if (!best) return {best, firstClean, cleanDrawn};
    const inl = P.map(([x, y]) => Math.abs(y - best.m * x - best.c) <= s.threshold);
    return {best, inl, refit: fitLine(P, inl.map(Number)) || {m: best.m, c: best.c}, firstClean, cleanDrawn};
  }
  function huberIRLS(P, delta, start) {
    let fit = start;
    for (let it = 0; it < 40 && fit; it++) {
      const w = P.map(([x, y]) => { const a = Math.abs(y - fit.m * x - fit.c); return a <= delta ? 1 : delta / a; });
      const next = fitLine(P, w); if (!next) break;
      const done = Math.abs(next.m - fit.m) + Math.abs(next.c - fit.c) < 1e-10; fit = next; if (done) break;
    }
    return fit;
  }
  const lab = {
    name: 'ransac', title: 'RANSAC against least squares',
    heading: 'Corrupt some points. See which fit survives.',
    intro: 'Fifty points lie near a dashed true line; a chosen fraction are replaced by gross outliers. Compare least squares, a Huber fit by iteratively reweighted least squares, and RANSAC with a least-squares refit on its inliers. Drag any point to move it.',
    defaults: {outliers: .3, sigma: .15, threshold: .4, iters: 10, seed: 1, moved: {}},
    controls(s) {
      const {range} = window.CV_VISION;
      return range('outliers', 'Outlier fraction ε', 0, .7, .05, s.outliers) + range('sigma', 'Inlier noise σ', .02, .5, .01, s.sigma) +
        range('threshold', 'Inlier threshold τ (Huber uses δ = τ)', .05, 1.5, .05, s.threshold) + range('iters', 'RANSAC samples N', 1, 200, 1, s.iters) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New data ↻</button></div>' +
        '<div class="math-rule">inlier: |y − (mx + c)| ≤ τ;  N = ⌈log(1 − p) / log(1 − (1 − ε)ˢ)⌉ with s = 2, p = 0.99</div>';
    },
    visual: () => {
      const key = (cls, label, extra = '') => `<span style="white-space:nowrap"><span class="vk-key ${cls}" style="margin-right:5px;${extra}"></span>${label}</span>`;
      return `<div id="rs-plot"></div><p class="vk-legend">${key('', 'true line (dashed)', 'background:var(--ink)')}${key('vk-key-vector', 'least squares')}${key('vk-key-eig1', 'Huber IRLS')}${key('vk-key-ellipse', 'RANSAC + refit', 'height:4px')}<span>Filled dots: RANSAC inliers. Small rings: outliers. Large rings: the winning sample. Band: ± τ around its line.</span></p><div id="rs-table"></div>`;
    },
    note: 'Predict first: raise the outlier fraction from 0 to 0.6. Which line moves first, and which one survives? Least squares drifts as soon as outliers appear. The Huber fit resists a few, but many outliers on one side still pull it. RANSAC holds as long as one clean sample is drawn and τ separates the noise from the outliers. Try N below the formula’s value, a τ smaller than σ, and dragging a single point far from the line.',
    render(s, root) {
      const V = window.CV_VISION, {fmt, E} = V, data = makeData(s), P = data.pts, n = P.length;
      const ls = fitLine(P), hub = huberIRLS(P, s.threshold, ls), rs = ransac(P, s, data.clean);
      const W = 460, H = 300, l = 34, rgt = 10, t = 10, b = 26;
      const X = x => l + (x - DOMAIN.x[0]) / (DOMAIN.x[1] - DOMAIN.x[0]) * (W - l - rgt), Y = y => H - b - (y - DOMAIN.y[0]) / (DOMAIN.y[1] - DOMAIN.y[0]) * (H - t - b);
      view = {W, H, pts: P, X, Y, ix: px => DOMAIN.x[0] + (px - l) / (W - l - rgt) * (DOMAIN.x[1] - DOMAIN.x[0]), iy: py => DOMAIN.y[0] + (H - b - py) / (H - t - b) * (DOMAIN.y[1] - DOMAIN.y[0])};
      const seg = (f, style) => f ? `<path d="M${X(DOMAIN.x[0]).toFixed(1)} ${Y(f.m * DOMAIN.x[0] + f.c).toFixed(1)}L${X(DOMAIN.x[1]).toFixed(1)} ${Y(f.m * DOMAIN.x[1] + f.c).toFixed(1)}" fill="none" ${style}/>` : '';
      let svg = `<svg class="vk-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter plot of the data with the true, least-squares, Huber and RANSAC lines" style="touch-action:none;cursor:grab"><title>Data, inliers and fitted lines</title><defs><clipPath id="rs-clip"><rect x="${l}" y="${t}" width="${W - l - rgt}" height="${H - t - b}"/></clipPath></defs>`;
      for (let x = -3; x <= 3; x++) svg += `<line class="${x ? 'grid-line' : 'axis-line'}" x1="${X(x)}" x2="${X(x)}" y1="${t}" y2="${H - b}"/><text x="${X(x)}" y="${H - b + 15}" text-anchor="middle">${x}</text>`;
      for (let y = -3; y <= 3; y++) svg += `<line class="${y ? 'grid-line' : 'axis-line'}" x1="${l}" x2="${W - rgt}" y1="${Y(y)}" y2="${Y(y)}"/><text x="${l - 6}" y="${Y(y) + 4}" text-anchor="end">${y}</text>`;
      svg += '<g clip-path="url(#rs-clip)">';
      // Colours come from existing plot classes, which have dark-theme overrides: series-a orange, series-b blue, vk-bar/vk-ellipse green, vk-vector orange.
      if (rs.best) { const {m, c} = rs.best, x0 = DOMAIN.x[0], x1 = DOMAIN.x[1], tau = s.threshold; svg += `<path class="vk-bar" d="M${X(x0)} ${Y(m * x0 + c + tau)}L${X(x1)} ${Y(m * x1 + c + tau)}L${X(x1)} ${Y(m * x1 + c - tau)}L${X(x0)} ${Y(m * x0 + c - tau)}Z" style="opacity:.14"/>`; }
      svg += seg({m: data.m, c: data.c}, 'style="stroke:var(--ink);stroke-width:1.6;stroke-dasharray:3 4"') + seg(ls, 'class="series-a"') + seg(hub, 'class="series-b"') + seg(rs.refit, 'class="vk-ellipse" style="fill:none;stroke-width:3.2"');
      svg += '</g>';
      P.forEach(([x, y], i) => {
        const cx = X(Math.max(DOMAIN.x[0], Math.min(DOMAIN.x[1], x))).toFixed(1), cy = Y(Math.max(DOMAIN.y[0], Math.min(DOMAIN.y[1], y))).toFixed(1);
        svg += rs.inl && rs.inl[i] ? `<circle class="vk-bar" cx="${cx}" cy="${cy}" r="4" style="opacity:.95"/>` : `<circle class="vk-vector" cx="${cx}" cy="${cy}" r="3.6" style="fill:var(--paper);stroke-width:1.6"/>`;
        if (s.moved && s.moved[i]) svg += `<circle cx="${cx}" cy="${cy}" r="7.5" fill="none" style="stroke:var(--muted);stroke-width:1" stroke-dasharray="2 2"/>`;
      });
      if (rs.best) [rs.best.i, rs.best.j].forEach(i => { svg += `<circle cx="${X(P[i][0]).toFixed(1)}" cy="${Y(P[i][1]).toFixed(1)}" r="7.5" fill="none" style="stroke:var(--ink);stroke-width:1.6"/>`; });
      root.querySelector('#rs-plot').innerHTML = svg + '</svg>';
      const row = (name, f) => `<tr><td>${name}</td><td>${f ? fmt(f.m, 3) : '—'}</td><td>${f ? fmt(f.c, 3) : '—'}</td><td>${f ? fmt(Math.abs(f.m - data.m), 3) : '—'}</td><td>${f ? fmt(Math.abs(f.c - data.c), 3) : '—'}</td></tr>`;
      root.querySelector('#rs-table').innerHTML = `<div style="overflow-x:auto"><table class="vk-table"><thead><tr><th>Line</th><th>Slope m</th><th>Intercept c</th><th>Slope error</th><th>Intercept error</th></tr></thead><tbody>${row('True', {m: data.m, c: data.c})}${row('Least squares', ls)}${row(E(`Huber, δ = ${fmt(s.threshold, 2)}`), hub)}${row('RANSAC + refit', rs.refit)}</tbody></table></div>`;
      const bad = data.clean.filter(v => !v).length, eps = bad / n, clean = (1 - eps) ** 2;
      const recommended = eps <= 0 ? 1 : Math.max(1, Math.ceil(Math.log(.01) / Math.log(1 - clean)));
      const trueIn = rs.inl ? rs.inl.filter((v, i) => v && data.clean[i]).length : 0;
      return V.report([
        ['RANSAC consensus set', rs.best ? `${rs.best.count} of ${n} (${trueIn} genuine inliers)` : 'none'],
        ['Best sample found at', rs.best ? `sample ${rs.best.t} of ${s.iters}` : '—'],
        ['First all-inlier sample', rs.firstClean ? `sample ${rs.firstClean}` : 'none yet'],
        ['Clean samples drawn', `${rs.cleanDrawn} of ${s.iters}`],
        ['Formula N for ε = ' + fmt(eps, 2), `${recommended} samples (p = 0.99)`],
      ]);
    },
    wire(root, s, rerender) {
      const host = root.querySelector('#rs-plot');
      let drag = null;
      const locate = e => { const svg = host.querySelector('svg'); if (!svg || !view) return null; const box = svg.getBoundingClientRect(); if (!box.width) return null; const px = (e.clientX - box.left) / box.width * view.W, py = (e.clientY - box.top) / box.height * view.H; return {px, py, x: view.ix(px), y: view.iy(py)}; };
      host.addEventListener('pointerdown', e => {
        const q = locate(e); if (!q) return;
        let hit = -1, near = 16;
        view.pts.forEach(([x, y], i) => { const d = Math.hypot(view.X(x) - q.px, view.Y(y) - q.py); if (d < near) { near = d; hit = i; } });
        if (hit < 0) return;
        drag = hit; e.preventDefault();
        try { host.setPointerCapture(e.pointerId); } catch {}
      });
      host.addEventListener('pointermove', e => {
        if (drag === null) return;
        const q = locate(e); if (!q) return;
        s.moved = {...(s.moved || {}), [drag]: [Math.max(DOMAIN.x[0], Math.min(DOMAIN.x[1], q.x)), Math.max(DOMAIN.y[0], Math.min(DOMAIN.y[1], q.y))]};
        rerender();
      });
      const end = e => { if (drag === null) return; drag = null; try { host.releasePointerCapture(e.pointerId); } catch {} };
      host.addEventListener('pointerup', end);
      host.addEventListener('pointercancel', end);
    },
    action(name, s) { if (name === 'reseed') { s.seed++; s.moved = {}; } },
  };

  window.CV_EXTEND.lesson(52, {
    teaching: {
      equation: Q`N=\left\lceil\frac{\ln(1-p)}{\ln\left(1-(1-\varepsilon)^s\right)}\right\rceil,\qquad \left(J^TJ+\lambda I\right)\delta=-J^Tr`,
      symbols: [['ε', 'outlier fraction'], ['s', 'points per minimal sample'], ['p', 'required confidence'], ['J', 'Jacobian of the residuals'], ['λ', 'damping parameter']],
      connection: 'Feature matches always include wrong pairs. Homography, camera-pose and calibration pipelines run RANSAC to find the consistent matches, then refine on the inliers with Gauss–Newton or Levenberg–Marquardt, as bundle adjustment does for whole reconstructions.',
      trap: 'A common mistake is to add RANSAC iterations when the real problem is the inlier threshold: too small a τ rejects genuine inliers, and too large a τ lets outliers vote.',
      question: 'With 50% outliers, about how many random 2-point samples give 99% confidence that at least one is outlier-free?',
      choices: ['17', '5', '100'], correct: 0,
      explanation: 'A sample is clean with probability 0.5² = 0.25, so N = ⌈ln 0.01 / ln 0.75⌉ = ⌈16.01⌉ = 17.',
    },
    guide: {
      title: 'Let clean samples vote, then polish the fit',
      paragraphs: [
        'Least squares lets every point pull on the answer in proportion to its error, so a few wrong matches can ruin a fit. Robust losses cap that pull, and RANSAC sidesteps it: fit many tiny random samples exactly, and keep the model that the most points agree with.',
        'RANSAC only needs one outlier-free sample, and the formula for N says how many draws make that likely. After it has chosen the inliers, Gauss–Newton or Levenberg–Marquardt refines the parameters of a nonlinear model by repeatedly solving a linearised least-squares problem.',
      ],
      example: 'How many RANSAC samples do you need?',
      controls: [{label: 'Outlier fraction ε', min: .05, max: .8, step: .05, value: .4}, {label: 'Points per sample s', min: 1, max: 8, step: 1, value: 2}, {label: 'Confidence p', min: .9, max: .999, step: .001, value: .99}],
      predict: 'If the outlier fraction doubles from 0.25 to 0.5, does a 4-point model need twice as many samples?',
      takeaway: 'N grows exponentially with the sample size s and steeply with the outlier fraction ε, but only logarithmically with the confidence p. Choose minimal models, estimate ε honestly, and let RANSAC stop early when a large consensus set shows that ε is smaller than feared.',
      notation: 'ε is the fraction of outliers, s the number of points in a minimal sample, p the confidence required and N the number of samples. In the refinement, r(θ) stacks the residuals, J holds their derivatives and λ damps the step.',
    },
    notation: {
      'ε': {tex: Q`\varepsilon`, detail: 'The fraction of the data that are outliers, between 0 and 1. It is usually unknown, so RANSAC either assumes a pessimistic value or updates it from the best consensus set found so far.'},
      s: {tex: 's', detail: 'The number of data points a minimal sample needs to fix the model exactly: 2 for a line, 3 for an affine map, 4 correspondences for a homography.'},
      p: {tex: 'p', detail: 'The confidence that at least one of the N samples is outlier-free, such as 0.99. Here p is a probability you choose, not a point or a projection.'},
      J: {tex: 'J', detail: 'The Jacobian of the residual vector r(θ): one row per residual, one column per parameter, with entries ∂rᵢ/∂θⱼ. JᵀJ approximates the Hessian of ½‖r‖² and Jᵀr is its gradient.'},
      'λ': {tex: Q`\lambda`, detail: 'The Levenberg–Marquardt damping parameter. Adding λI to JᵀJ shortens the step and turns it towards the negative gradient; λ = 0 gives the Gauss–Newton step.'},
    },
    calculate, practice, lab,
  });
})();
