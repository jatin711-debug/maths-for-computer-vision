/* Lesson-specific experiments, most on real photographs. Each lab: heading, intro, controls(s), visual(s), note, optional setup(), render(s, root, data). */
(() => {
  'use strict';
  const V = window.CV_VISION, {E, fmt, clamp, range, select, check, report, figure} = V;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // A small SVG plot used by several labs: series of [x,y] points, optional vertical marker and bars.
  function svgPlot({w = 440, h = 190, x, y, lines = [], bars = [], dots = [], marker, label, xLabel = '', yLabel = '', xTicks, yTicks}) {
    const l = 46, r = 12, t = 12, b = 34;
    const sx = v => l + (v - x[0]) / (x[1] - x[0]) * (w - l - r), sy = v => h - b - (v - y[0]) / (y[1] - y[0]) * (h - t - b);
    let s = `<svg class="vk-plot" viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(label)}"><title>${E(label)}</title>`;
    (xTicks || [x[0], (x[0] + x[1]) / 2, x[1]]).forEach(v => { s += `<line class="grid-line" x1="${sx(v)}" x2="${sx(v)}" y1="${t}" y2="${h - b}"/><text x="${sx(v)}" y="${h - b + 15}" text-anchor="middle">${fmt(v, 2)}</text>`; });
    (yTicks || [y[0], (y[0] + y[1]) / 2, y[1]]).forEach(v => { s += `<line class="grid-line" x1="${l}" x2="${w - r}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${l - 6}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, 2)}</text>`; });
    bars.forEach(([x0, x1, v, cls = '']) => { s += `<rect class="vk-bar ${cls}" x="${sx(x0)}" y="${sy(Math.max(y[0], v))}" width="${Math.max(.5, sx(x1) - sx(x0) - .5)}" height="${Math.max(0, sy(y[0]) - sy(Math.max(y[0], v)))}"/>`; });
    lines.forEach(({points, cls = 'series-a'}) => { s += `<path class="${cls}" fill="none" d="${points.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(clamp(p[1], y[0], y[1])).toFixed(1)}`).join('')}"/>`; });
    dots.forEach(([px, py, cls = 'vk-dot']) => { s += `<circle class="${cls}" cx="${sx(px).toFixed(1)}" cy="${sy(clamp(py, y[0], y[1])).toFixed(1)}" r="2.6"/>`; });
    if (marker !== undefined) s += `<line class="vk-marker" x1="${sx(marker)}" x2="${sx(marker)}" y1="${t}" y2="${h - b}"/>`;
    s += `<text x="${(l + w - r) / 2}" y="${h - 3}" text-anchor="middle">${E(xLabel)}</text><text x="11" y="${(t + h - b) / 2}" text-anchor="middle" transform="rotate(-90,11,${(t + h - b) / 2})">${E(yLabel)}</text></svg>`;
    return s;
  }
  const $ = (root, id) => root.querySelector('#' + id);

  const labs = {};

  /* ===== Lesson 13: repeated transformations and eigen-directions ===== */
  const PRESETS = {stretch: [2, 1, 1, 2], decay: [.9, .2, .2, .5], flip: [1.2, 0, 0, -.8], shear: [1, 1, 0, 1], rotation: [.8, -.6, .6, .8]};
  labs.power = {
    title: 'Repeated transformations', heading: 'Apply the same map again and again.',
    intro: 'Each step multiplies by A. Watch the unit circle and one vector. Eigen-directions are the lines A maps onto themselves.',
    defaults: {preset: 'stretch', a: 2, b: 1, c: 1, d: 2, steps: 0, angle: 100},
    controls: s => select('preset', 'Matrix', [['stretch', 'Symmetric stretch [[2,1],[1,2]]'], ['decay', 'Shrinking map [[0.9,0.2],[0.2,0.5]]'], ['flip', 'Flip one axis [[1.2,0],[0,−0.8]]'], ['shear', 'Shear [[1,1],[0,1]]'], ['rotation', 'Rotation by 36.9°'], ['custom', 'Custom entries']], s.preset) +
      `<div class="vk-matrix-inputs" ${s.preset === 'custom' ? '' : 'hidden'}>${['a', 'b', 'c', 'd'].map(k => range(k, `Entry ${k}`, -2, 2, .1, s[k])).join('')}</div>` +
      range('steps', 'Number of applications k', 0, 10, 1, s.steps) + range('angle', 'Starting vector angle (°)', 0, 180, 5, s.angle) + '<div class="math-rule">xₖ = Aᵏ x₀</div>',
    visual: () => `<div class="vk-svg-stage" id="pw-svg"></div>`,
    note: 'Predict first: after many steps, which direction will the vector point in, and does the starting angle matter? A rotation has no real eigen-direction, so its vector never settles. A shear has only one.',
    render(s, root) {
      const [a, b, c, d] = s.preset === 'custom' ? [s.a, s.b, s.c, s.d] : PRESETS[s.preset];
      const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
      const real = disc >= -1e-12, l1 = tr / 2 + Math.sqrt(Math.max(0, disc)), l2 = tr / 2 - Math.sqrt(Math.max(0, disc));
      const eigvec = l => Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : (Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1]);
      const apply = (v, k) => { let [x, y] = v; for (let i = 0; i < k; i++) [x, y] = [a * x + b * y, c * x + d * y]; return [x, y]; };
      const th = s.angle * Math.PI / 180, x0 = [Math.cos(th), Math.sin(th)];
      const path = Array.from({length: s.steps + 1}, (_, k) => apply(x0, k));
      const circle = Array.from({length: 73}, (_, i) => apply([Math.cos(i * Math.PI / 36), Math.sin(i * Math.PI / 36)], s.steps));
      const eigLines = (X, Y, reach) => real ? (Math.abs(l1) >= Math.abs(l2) ? [[l1, 'vk-eig1'], [l2, 'vk-eig2']] : [[l2, 'vk-eig1'], [l1, 'vk-eig2']]).map(([l, cls], i) => { if (i && Math.abs(l1 - l2) < 1e-9) return ''; const v = eigvec(l), n = Math.hypot(...v) || 1, u = [v[0] / n * reach, v[1] / n * reach]; return `<line class="${cls}" x1="${X(-u[0])}" y1="${Y(-u[1])}" x2="${X(u[0])}" y2="${Y(u[1])}"/>`; }).join('') : '';
      const panel = (title, extent, body) => {
        const W = 260, H = 260, sc = W / 2 / extent, X = v => W / 2 + v * sc, Y = v => H / 2 - v * sc;
        const step = 10 ** Math.floor(Math.log10(extent)), grid = extent / step > 5 ? step * 2 : step;
        let svg = `<svg class="vk-plot" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="${E(title)}"><title>${E(title)}</title>`;
        for (let g = -Math.floor(extent / grid) * grid; g <= extent; g += grid) svg += `<line class="grid-line" x1="${X(g)}" x2="${X(g)}" y1="0" y2="${H}"/><line class="grid-line" x1="0" x2="${W}" y1="${Y(g)}" y2="${Y(g)}"/>`;
        svg += `<line class="axis-line" x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}"/><line class="axis-line" x1="${X(0)}" x2="${X(0)}" y1="0" y2="${H}"/>` + eigLines(X, Y, extent * 1.5) + body(X, Y) + `<text x="4" y="${H + 14}">${E(title)}</text></svg>`;
        return svg;
      };
      const extent = Math.max(1.2, ...circle.map(p => Math.hypot(...p)), Math.hypot(...path.at(-1))) * 1.08, last = path.at(-1);
      const shape = panel(`After k = ${s.steps} steps (fitted to view)`, extent, (X, Y) => `<path class="vk-ellipse" d="${circle.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('')}Z"/><line class="vk-vector" x1="${X(0)}" y1="${Y(0)}" x2="${X(last[0])}" y2="${Y(last[1])}"/><circle class="vk-tip" cx="${X(last[0])}" cy="${Y(last[1])}" r="4.5"/>`);
      const dirs = panel('Directions of x₀ … xₖ', 1.25, (X, Y) => `<circle cx="${X(0)}" cy="${Y(0)}" r="${(X(1) - X(0)).toFixed(1)}" fill="none" class="axis-line"/>` + path.map((p, k) => { const n = Math.hypot(...p) || 1; return `<line class="vk-vector" x1="${X(0)}" y1="${Y(0)}" x2="${X(p[0] / n)}" y2="${Y(p[1] / n)}" opacity="${k === s.steps ? 1 : .18 + .4 * k / Math.max(1, s.steps)}" stroke-width="${k === s.steps ? 3 : 1.5}"/><circle class="vk-dir" cx="${X(p[0] / n)}" cy="${Y(p[1] / n)}" r="${k === s.steps ? 4.5 : 3}"/><text x="${X(p[0] / n * 1.13) - 3}" y="${Y(p[1] / n * 1.13) + 4}">${k}</text>`; }).join(''));
      $(root, 'pw-svg').innerHTML = `<div class="vk-pair">${shape}${dirs}</div><p class="vk-legend"><span class="vk-key vk-key-ellipse"></span>image of the unit circle <span class="vk-key vk-key-vector"></span>xₖ (numbers: step j) ${real ? '<span class="vk-key vk-key-eig1"></span>eigen-directions (dashed: larger |λ|)' : 'no real eigen-directions'}</p>`;
      let angleToDominant = '—';
      if (real) { const dom = Math.abs(l1) >= Math.abs(l2) ? l1 : l2, v = eigvec(dom), cos = Math.abs(v[0] * last[0] + v[1] * last[1]) / ((Math.hypot(...v) || 1) * (Math.hypot(...last) || 1)); angleToDominant = fmt(Math.acos(clamp(cos, -1, 1)) * 180 / Math.PI, 2) + '°'; }
      return report([['Eigenvalues', real ? `${fmt(l1)}, ${fmt(l2)}` : `${fmt(tr / 2)} ± ${fmt(Math.sqrt(-disc))}i`], ['|λ₁/λ₂|', real && Math.abs(l2) > 1e-9 ? fmt(Math.abs(l1 / l2)) : real ? '∞' : '1 (complex pair)'], ['‖xₖ‖', fmt(Math.hypot(...last))], ['Angle to dominant eigen-direction', angleToDominant], ['det A', fmt(det)]]);
    },
  };

  /* ===== Lesson 14: SVD compression of a photograph ===== */
  labs.svdimage = {
    title: 'Low-rank image approximation', heading: 'Keep the strongest directions of a photo.',
    intro: 'The 128 × 128 photo is a matrix A. Its SVD writes A as a sum of rank-one layers σᵢuᵢvᵢᵀ, largest σ first. Keep k of them.',
    defaults: {rank: 8, view: 'recon'},
    controls: s => range('rank', 'Retained rank k', 1, 64, 1, s.rank) + select('view', 'Show', [['recon', 'Rank-k approximation Aₖ'], ['layer', 'Only layer k: σₖuₖvₖᵀ'], ['residual', 'What is missing: A − Aₖ']], s.view) + '<div class="math-rule">Aₖ = Σᵢ₌₁ᵏ σᵢ uᵢ vᵢᵀ</div>',
    visual: () => `<div class="vk-pair">${figure('svd-a', 'Original A (128 × 128)')}${figure('svd-b', 'Rank-k view')}</div><div id="svd-plot"></div>`,
    note: 'Predict first: how many layers before you recognise the tripod? Large singular values carry broad structure; fine edges need many small ones. Storage assumes you keep k columns of U and V plus k singular values.',
    async setup() {
      const img = await V.load('camera'), small = V.downsample(img.gray, img.w, img.h, 2), A = Float64Array.from(small.data);
      return {A, m: small.h, n: small.w, svd: V.svd(A, small.h, small.w)};
    },
    render(s, root, {A, m, n, svd}) {
      V.show($(root, 'svd-a'), A, n, m);
      const k = s.rank, out = new Float64Array(m * n), from = s.view === 'layer' ? k - 1 : 0, to = k;
      for (let r = from; r < to; r++) { const u = svd.U[r], v = svd.V[r], sg = svd.S[r]; for (let i = 0; i < m; i++) { const ui = u[i] * sg; if (!ui) continue; for (let j = 0; j < n; j++) out[i * n + j] += ui * v[j]; } }
      if (s.view === 'residual') for (let i = 0; i < out.length; i++) out[i] = A[i] - out[i];
      V.show($(root, 'svd-b'), out, n, m, {mode: s.view === 'recon' ? 'gray' : 'signed'});
      $(root, 'svd-b').nextElementSibling.textContent = s.view === 'recon' ? `Rank-${k} approximation` : s.view === 'layer' ? `Layer ${k} alone (grey = 0)` : `Residual A − A${k} (grey = 0)`;
      const total = svd.S.reduce((t, x) => t + x * x, 0), kept = svd.S.slice(0, k).reduce((t, x) => t + x * x, 0);
      const pts = svd.S.map((x, i) => [i + 1, Math.log10(Math.max(x, 1e-3))]);
      $(root, 'svd-plot').innerHTML = svgPlot({x: [1, n], y: [0, Math.ceil(pts[0][1])], lines: [{points: pts}], marker: k, label: 'Singular values on a log scale with the retained rank marked', xLabel: 'index i', yLabel: 'log₁₀ σᵢ', xTicks: [1, 32, 64, 96, 128]});
      return report([['Stored numbers', `${k * (m + n + 1)} of ${m * n} (${fmt(100 * k * (m + n + 1) / (m * n), 1)}%)`], ['Retained energy Σσᵢ²', fmt(100 * kept / total, 2) + '%'], ['Relative error ‖A−Aₖ‖_F/‖A‖_F', fmt(Math.sqrt(Math.max(0, 1 - kept / total)), 4)], ['σ₁ / σₖ', `${fmt(svd.S[0], 1)} / ${fmt(svd.S[k - 1], 1)}`]]);
    },
  };

  /* ===== Lesson 15: PCA of image patches, and what "variation" means ===== */
  const PREP = {none: 'Raw patches (no centering)', dataset: 'Subtract the mean patch (standard PCA)', patch: 'Also remove each patch’s own brightness'};
  labs.patches = {
    title: 'PCA of 8 × 8 patches', heading: 'Find how a collection of patches varies.',
    intro: 'Cut the photo into 1,024 non-overlapping 8 × 8 patches. Each is a 64-dimensional sample. PCA finds directions of largest variance across the collection.',
    defaults: {k: 6, prep: 'dataset'},
    controls: s => range('k', 'Components kept k', 0, 64, 1, s.k) + select('prep', 'Before PCA', Object.entries(PREP), s.prep) + '<div class="math-rule">C = (1/(N−1)) Σ (xᵢ − μ)(xᵢ − μ)ᵀ</div>',
    visual: () => `<div class="vk-pair">${figure('pca-recon', 'Each patch rebuilt from k components')}${figure('pca-tiles', 'Top 16 principal directions as 8 × 8 tiles', 'vk-tiles')}</div><div id="pca-plot"></div>`,
    note: 'Predict first: what does the first direction look like for raw or mean-centred patches? A nearly flat tile — brightness differences between patches dominate the variance. Remove each patch’s own brightness and the leading directions become edges and gradients. High variance is not the same as useful for recognition. PCA here is over a collection of patches, not the SVD of one image.',
    async setup() {
      const img = await V.load('camera'), w = img.w, h = img.h, P = 8, N = (w / P) * (h / P), D = P * P, X = new Float64Array(N * D), own = new Float64Array(N);
      let idx = 0;
      for (let by = 0; by < h / P; by++) for (let bx = 0; bx < w / P; bx++, idx++) for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) X[idx * D + y * P + x] = img.gray[(by * P + y) * w + bx * P + x];
      for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < D; j++) m += X[i * D + j]; own[i] = m / D; }
      const prepared = prep => { const Y = new Float64Array(N * D); for (let i = 0; i < N; i++) for (let j = 0; j < D; j++) Y[i * D + j] = X[i * D + j] - (prep === 'patch' ? own[i] : 0); const mu = new Float64Array(D); if (prep !== 'none') { for (let i = 0; i < N; i++) for (let j = 0; j < D; j++) mu[j] += Y[i * D + j] / N; } return {Y, mu}; };
      const fit = prep => { const {Y, mu} = prepared(prep), C = new Float64Array(D * D), div = prep === 'none' ? N : N - 1; for (let i = 0; i < N; i++) for (let a = 0; a < D; a++) { const ya = Y[i * D + a] - mu[a]; for (let b = a; b < D; b++) C[a * D + b] += ya * (Y[i * D + b] - mu[b]); } for (let a = 0; a < D; a++) for (let b = a; b < D; b++) C[b * D + a] = C[a * D + b] /= div; return {Y, mu, ...V.eigSym(C, D)}; };
      return {w, h, P, N, D, X, own, fits: {none: fit('none'), dataset: fit('dataset'), patch: fit('patch')}};
    },
    render(s, root, {w, h, P, N, D, X, own, fits}) {
      const e = fits[s.prep], out = new Float32Array(w * h), per = w / P;
      let sq = 0;
      for (let i = 0; i < N; i++) {
        const rec = Float64Array.from(e.mu);
        for (let c = 0; c < s.k; c++) { const v = e.vectors[c]; let coef = 0; for (let j = 0; j < D; j++) coef += v[j] * (e.Y[i * D + j] - e.mu[j]); for (let j = 0; j < D; j++) rec[j] += coef * v[j]; }
        const bx = i % per, by = Math.floor(i / per), add = s.prep === 'patch' ? own[i] : 0;
        for (let j = 0; j < D; j++) { const val = rec[j] + add; out[(by * P + Math.floor(j / P)) * w + bx * P + j % P] = val; sq += (val - X[i * D + j]) ** 2; }
      }
      V.show($(root, 'pca-recon'), out, w, h);
      $(root, 'pca-recon').nextElementSibling.textContent = s.prep === 'patch' ? 'Each patch rebuilt from its own brightness plus k components' : 'Each patch rebuilt from k components';
      const T = 4, gap = 1, size = T * P + (T + 1) * gap, tiles = new Float32Array(size * size).fill(NaN);
      for (let c = 0; c < 16; c++) { const v = e.vectors[c], m = Math.max(...v.map(Math.abs)) || 1, ox = gap + (c % T) * (P + gap), oy = gap + Math.floor(c / T) * (P + gap); for (let j = 0; j < D; j++) tiles[(oy + Math.floor(j / P)) * size + ox + j % P] = v[j] / m; }
      V.show($(root, 'pca-tiles'), tiles, size, size, {mode: 'gray', min: -1, max: 1});
      const total = e.values.reduce((t, x) => t + Math.max(0, x), 0), kept = e.values.slice(0, s.k).reduce((t, x) => t + Math.max(0, x), 0);
      const flat = Math.abs(e.vectors[0].reduce((t, x) => t + x, 0)) / Math.sqrt(D);
      let cum = 0; const curve = e.values.map((x, i) => [i + 1, 100 * (cum += Math.max(0, x)) / total]);
      $(root, 'pca-plot').innerHTML = svgPlot({x: [1, D], y: [0, 100], lines: [{points: curve}], marker: Math.max(1, s.k), label: 'Cumulative share explained by the leading components', xLabel: 'components', yLabel: s.prep === 'none' ? '% second moment' : '% variance', xTicks: [1, 16, 32, 48, 64], yTicks: [0, 50, 100]});
      return report([[s.prep === 'none' ? 'Second moment explained' : 'Variance explained', fmt(100 * kept / total, 2) + '%'], ['First direction alone', fmt(100 * Math.max(0, e.values[0]) / total, 1) + '%'], ['How flat is direction 1? |cos(v₁, constant)|', fmt(flat < 1e-9 ? 0 : flat, 3)], ['RMS reconstruction error', fmt(Math.sqrt(sq / (N * D)), 2) + ' grey levels']]);
    },
  };

  /* ===== Lesson 23: Gaussian noise, covariance and averaging ===== */
  labs.noise = {
    title: 'Gaussian pixel noise', heading: 'Add noise. Then average it away.',
    intro: 'Each frame adds independent Gaussian noise with standard deviation σ to every pixel. Averaging N frames keeps the image and shrinks the noise.',
    defaults: {sigma: 25, frames: 1, correlated: false, seed: 1},
    controls: s => range('sigma', 'Noise standard deviation σ', 0, 60, 1, s.sigma) + range('frames', 'Frames averaged N', 1, 64, 1, s.frames) + check('correlated', 'Spatially correlated noise (blurred, same per-frame σ)', s.correlated) + '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New noise sample ↻</button></div><div class="math-rule">Var(mean of N) = σ² / N</div>',
    visual: () => `<div class="vk-pair">${figure('nz-img', 'Average of N noisy frames (display clipped to 0–255)')}<div class="vk-plots"><div id="nz-hist"></div><div id="nz-scatter"></div></div></div>`,
    note: 'Predict first: to halve the noise standard deviation, how many frames do you need? Independence matters: correlated noise makes neighbouring pixels move together, which the scatter plot shows as a tilted cloud.',
    async setup() { const img = await V.load('camera'), s = V.downsample(img.gray, img.w, img.h, 2); return {clean: s.data, w: s.w, h: s.h}; },
    render(s, root, {clean, w, h}) {
      const g = V.rng(1000 + s.seed), n = w * h, avg = new Float32Array(n);
      for (let f = 0; f < s.frames; f++) for (let i = 0; i < n; i++) avg[i] += g.gauss();
      for (let i = 0; i < n; i++) avg[i] *= s.sigma / s.frames;
      let noise = avg;
      if (s.correlated) { const k = V.gaussianKernel(1.5), gain = 1 / k.reduce((t, x) => t + x * x, 0); noise = V.blur(avg, w, h, 1.5).map(v => v * gain); }
      const noisy = noise.map((v, i) => clean[i] + v);
      V.show($(root, 'nz-img'), noisy.map(v => clamp(v, 0, 255)), w, h);
      const st = V.stats(noise), sd = Math.sqrt(st.variance), pred = s.sigma / Math.sqrt(s.frames);
      const lim = Math.ceil(Math.max(10, 3.5 * Math.max(pred, sd)) / 10) * 10, bins = 40, hist = new Array(bins).fill(0);
      for (const v of noise) { const b = Math.floor((v + lim) / (2 * lim) * bins); if (b >= 0 && b < bins) hist[b]++; }
      const dens = hist.map(c => c / (n * 2 * lim / bins)), peak = Math.max(...dens, pred > 0 ? 1 / (pred * Math.sqrt(2 * Math.PI)) : 0) * 1.1 || 1;
      const curve = pred > 0 ? Array.from({length: 81}, (_, i) => { const x = -lim + 2 * lim * i / 80; return [x, Math.exp(-x * x / (2 * pred * pred)) / (pred * Math.sqrt(2 * Math.PI))]; }) : [];
      $(root, 'nz-hist').innerHTML = svgPlot({w: 300, h: 170, x: [-lim, lim], y: [0, peak], bars: hist.map((c, b) => [-lim + 2 * lim * b / bins, -lim + 2 * lim * (b + 1) / bins, dens[b]]), lines: curve.length ? [{points: curve, cls: 'series-b'}] : [], label: 'Histogram of the noise values with the predicted Gaussian density', xLabel: 'noise value', yLabel: 'density', yTicks: [0]});
      const pairs = [], gg = V.rng(7); let sxy = 0, sxx = 0, syy = 0, cnt = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) { const a = noise[y * w + x], b = noise[y * w + x + 1]; sxy += a * b; sxx += a * a; syy += b * b; cnt++; if (gg.next() < 500 / (w * h)) pairs.push([a, b]); }
      const corr = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
      $(root, 'nz-scatter').innerHTML = svgPlot({w: 300, h: 170, x: [-lim, lim], y: [-lim, lim], dots: pairs, label: 'Scatter of each noise value against its right-hand neighbour', xLabel: 'noise at pixel', yLabel: 'right neighbour', yTicks: [-lim, 0, lim]});
      return report([['Predicted std σ/√N', fmt(pred, 2)], ['Measured std', fmt(sd, 2)], ['Neighbour correlation', fmt(corr, 3)], ['Measured mean', fmt(st.mean, 3)]]);
    },
    action(name, s) { if (name === 'reseed') s.seed++; },
  };

  /* ===== Lesson 24: sampling uncertainty of an accuracy estimate ===== */
  labs.estimate = {
    title: 'An accuracy is an estimate', heading: 'Draw many test sets from the same model.',
    intro: 'A model is correct with probability p on new images. Each test set of n images gives an estimate p̂. How much do those estimates vary?',
    defaults: {p: .85, n: 100, seed: 1},
    controls: s => range('p', 'True accuracy p', .5, .99, .01, s.p) + select('n', 'Test-set size n', [25, 50, 100, 200, 500, 1000, 2000].map(v => [v, `${v} images`]), s.n) + '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">Draw new test sets ↻</button></div><div class="math-rule">SE(p̂) = √(p(1 − p) / n)</div>',
    visual: () => `<div id="est-hist"></div><div id="est-one"></div>`,
    note: 'Predict first: going from 100 to 400 test images, how much narrower does the spread become? Halving the uncertainty needs four times the data. A softmax confidence is a different number: it describes one prediction, not the sampling variation of an evaluation.',
    render(s, root) {
      const g = V.rng(500 + s.seed), R = 400, n = Number(s.n), est = [];
      let covered = 0, first = null;
      for (let r = 0; r < R; r++) {
        let k = 0; const outcomes = r === 0 ? [] : null;
        for (let i = 0; i < n; i++) { const ok = g.next() < s.p; k += ok; if (outcomes) outcomes.push(ok); }
        const ph = k / n, half = 1.96 * Math.sqrt(ph * (1 - ph) / n);
        if (Math.abs(ph - s.p) <= half) covered++;
        est.push(ph); if (r === 0) first = {ph, half, outcomes};
      }
      // Bootstrap the first test set: resample its n outcomes with replacement.
      const boots = []; for (let b = 0; b < 400; b++) { let k = 0; for (let i = 0; i < n; i++) k += first.outcomes[Math.floor(g.next() * n)]; boots.push(k / n); }
      const sd = Math.sqrt(V.stats(est).variance), bsd = Math.sqrt(V.stats(boots).variance), se = Math.sqrt(s.p * (1 - s.p) / n);
      const lo = Math.max(0, s.p - 5 * se), hi = Math.min(1, s.p + 5 * se), bins = 30, hist = new Array(bins).fill(0);
      est.forEach(v => { const b = Math.floor((v - lo) / (hi - lo) * bins); if (b >= 0 && b < bins) hist[b]++; });
      $(root, 'est-hist').innerHTML = svgPlot({x: [lo, hi], y: [0, Math.max(...hist) * 1.15], bars: hist.map((c, b) => [lo + (hi - lo) * b / bins, lo + (hi - lo) * (b + 1) / bins, c]), marker: s.p, label: 'Histogram of accuracy estimates from 400 independent test sets; the line is the true accuracy', xLabel: 'estimated accuracy p̂ from one test set', yLabel: 'test sets', yTicks: [0]});
      $(root, 'est-one').innerHTML = `<p class="vk-callout">Your first test set: <strong>p̂ = ${fmt(first.ph, 3)}</strong>, 95% interval <strong>[${fmt(first.ph - first.half, 3)}, ${fmt(first.ph + first.half, 3)}]</strong>. ${Math.abs(first.ph - s.p) <= first.half ? 'This one contains the true value.' : 'This one misses the true value, as about 1 in 20 intervals should.'}</p>`;
      return report([['Predicted SE', fmt(se, 4)], ['Spread across test sets', fmt(sd, 4)], ['Bootstrap SE from one set', fmt(bsd, 4)], ['95% intervals covering p', `${fmt(100 * covered / R, 1)}%`]]);
    },
    action(name, s) { if (name === 'reseed') s.seed++; },
  };

  /* ===== Lesson 33: sampling and aliasing ===== */
  const zone = (() => { let z; return () => { if (z) return z; const N = 256, d = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r2 = (x - N / 2) ** 2 + (y - N / 2) ** 2; d[y * N + x] = 127.5 + 127.5 * Math.cos(Math.PI * r2 / 512); } return z = {gray: d, w: N, h: N}; }; })();
  labs.aliasing = {
    title: 'Downsampling and aliasing', heading: 'Keep every F-th pixel. What survives?',
    intro: 'Sampling on a coarser grid can only represent patterns slower than half a cycle per new pixel. Faster patterns do not vanish: they reappear as false, slower ones.',
    defaults: {source: 'zone', factor: 4, prefilter: false},
    controls: s => select('source', 'Image', [['zone', 'Zone plate (frequency grows with radius)'], ['brick', 'Brick wall photo']], s.source) + select('factor', 'Downsampling factor F', [1, 2, 3, 4, 6, 8].map(v => [v, `F = ${v}`]), s.factor) + check('prefilter', 'Blur first (Gaussian, σ = F/2)', s.prefilter) + '<div class="math-rule">Nyquist limit: 0.5 cycles per sample</div>',
    visual: () => `<div class="vk-pair">${figure('al-src', 'Original 256 × 256')}${figure('al-out', 'Downsampled, then enlarged for display', 'vk-pixelated')}</div><div id="al-row"></div>`,
    note: 'Predict first: on the zone plate, where will false rings appear for F = 4? Outside the dashed circle, the original pattern changes faster than the new grid can follow. Blurring first removes that detail instead of disguising it. Nothing in the samples alone can recover what was lost.',
    async setup() { const brick = await V.load('brick'); return {brick: {gray: brick.gray, w: brick.w, h: brick.h}}; },
    render(s, root, {brick}) {
      const src = s.source === 'zone' ? zone() : brick, F = Number(s.factor), {w, h} = src;
      const base = s.prefilter && F > 1 ? V.blur(src.gray, w, h, F / 2) : src.gray;
      const nw = Math.floor(w / F), nh = Math.floor(h / F), small = new Float32Array(nw * nh);
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) small[y * nw + x] = base[(y * F) * w + x * F];
      const canvas = V.show($(root, 'al-src'), src.gray, w, h);
      if (s.source === 'zone' && F > 1) { const ctx = canvas.getContext('2d'); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#e8743b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w / 2, h / 2, 256 / F, 0, 2 * Math.PI); ctx.stroke(); }
      V.show($(root, 'al-out'), small, nw, nh);
      // One row through the centre: the continuous-looking original and the retained samples.
      const row = Math.floor(h / 2), pts = Array.from({length: w}, (_, x) => [x, src.gray[row * w + x]]), samples = Array.from({length: nw}, (_, x) => [x * F, base[row * w + x * F], 'vk-sample']);
      const joined = samples.map(p => [p[0], p[1]]);
      $(root, 'al-row').innerHTML = svgPlot({h: 170, x: [0, w - 1], y: [0, 255], lines: [{points: pts, cls: 'series-a vk-thin'}, {points: joined, cls: 'series-b'}], dots: F > 1 ? samples : [], label: 'Intensity along the centre row with the retained samples joined by straight lines', xLabel: 'column in the original image', yLabel: 'intensity', xTicks: [0, 64, 128, 192, 255], yTicks: [0, 255]});
      return report([['New size', `${nw} × ${nh}`], ['Highest representable frequency', `${fmt(.5 / F, 3)} cycles/original pixel`], ...(s.source === 'zone' ? [['Aliasing begins at radius', F > 1 ? `${fmt(256 / F, 1)} px` : 'none (original grid)']] : []), ['Anti-alias blur', s.prefilter && F > 1 ? `σ = ${F / 2} px` : 'off']]);
    },
  };

  /* ===== Lesson 34: filtering a real photo ===== */
  const KERNELS = {
    identity: [[0, 0, 0, 0, 1, 0, 0, 0, 0], 'Identity'], box: [Array(9).fill(1 / 9), 'Box blur (all 1/9)'], gauss: [null, 'Gaussian blur (σ below)'],
    sobelx: [[-1, 0, 1, -2, 0, 2, -1, 0, 1], 'Sobel x: horizontal change'], sobely: [[-1, -2, -1, 0, 0, 0, 1, 2, 1], 'Sobel y: vertical change'],
    gradmag: [null, 'Gradient magnitude √(Gx² + Gy²)'], laplace: [[0, 1, 0, 1, -4, 1, 0, 1, 0], 'Laplacian'], sharpen: [[0, -1, 0, -1, 5, -1, 0, -1, 0], 'Sharpen'], custom: [null, 'Custom 3 × 3'],
  };
  labs.imagefilter = {
    title: 'Filters on a photograph', heading: 'One small kernel, slid over every pixel.',
    intro: 'Each output pixel is a weighted sum of its 3 × 3 neighbourhood. Click the photo to inspect the nine products at one location.',
    defaults: {kernel: 'sobelx', sigma: 1.5, flip: false, px: 120, py: 70, c0: 0, c1: -1, c2: 0, c3: -1, c4: 4, c5: -1, c6: 0, c7: -1, c8: 0},
    controls: s => select('kernel', 'Kernel', Object.entries(KERNELS).map(([k, v]) => [k, v[1]]), s.kernel) + `<div data-show-if="gauss" ${s.kernel === 'gauss' ? '' : 'hidden'}>${range('sigma', 'Gaussian σ (pixels)', .5, 4, .1, s.sigma)}</div>` +
      `<div class="vk-kernel-edit" data-show-if="custom" ${s.kernel === 'custom' ? '' : 'hidden'}><span class="small muted">Custom weights</span><div class="vk-kernel-grid">${Array.from({length: 9}, (_, i) => `<input type="number" step="0.5" data-vk="c${i}" value="${s['c' + i]}" aria-label="Kernel weight row ${Math.floor(i / 3)}, column ${i % 3}">`).join('')}</div></div>` +
      check('flip', 'Flip the kernel (true convolution)', s.flip) + '<div class="math-rule">out[y,x] = Σᵢⱼ k[i,j] · in[y+i, x+j]</div>',
    visual: () => `<div class="vk-pair">${figure('fl-in', 'Input: click to choose a pixel', 'vk-clickable')}${figure('fl-out', 'Filtered output')}</div><div id="fl-probe"></div>`,
    note: 'Predict first: does flipping change the box blur? Symmetric kernels give identical results; Sobel changes sign. Smoothing kernels sum to 1 and keep average brightness; derivative kernels sum to 0, so flat regions become 0 (mid-grey in a signed display).',
    async setup() { const img = await V.load('camera'); return {gray: img.gray, w: img.w, h: img.h}; },
    render(s, root, {gray, w, h}) {
      const custom = Array.from({length: 9}, (_, i) => Number(s['c' + i]) || 0);
      const k3 = s.kernel === 'custom' ? custom : KERNELS[s.kernel][0];
      let out, used = k3, size = 3;
      if (s.kernel === 'gauss') { const g = V.gaussianKernel(s.sigma); size = g.length; used = Array.from({length: size * size}, (_, i) => g[Math.floor(i / size)] * g[i % size]); out = V.blur(gray, w, h, s.sigma); }
      else if (s.kernel === 'gradmag') { const gx = V.filter(gray, w, h, KERNELS.sobelx[0], 3, 3, {flip: s.flip}), gy = V.filter(gray, w, h, KERNELS.sobely[0], 3, 3, {flip: s.flip}); out = gx.map((v, i) => Math.hypot(v, gy[i])); used = null; }
      else out = V.filter(gray, w, h, k3, 3, 3, {flip: s.flip});
      const sum = used ? used.reduce((t, x) => t + x, 0) : null, signed = sum !== null && Math.abs(sum) < 1e-9;
      const canvas = V.show($(root, 'fl-in'), gray, w, h), ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#e8743b'; ctx.lineWidth = 2; ctx.strokeRect(s.px - 2.5, s.py - 2.5, 5, 5);
      V.show($(root, 'fl-out'), out, w, h, signed ? {mode: 'signed'} : s.kernel === 'gradmag' ? {mode: 'auto'} : {min: 0, max: 255});
      $(root, 'fl-out').nextElementSibling.textContent = signed ? 'Filtered output (grey = 0, dark negative, light positive)' : 'Filtered output';
      const at = (x, y) => gray[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
      if (used && size === 3) {
        const k = s.flip ? used.slice().reverse() : used, patch = Array.from({length: 9}, (_, i) => at(s.px + i % 3 - 1, s.py + Math.floor(i / 3) - 1));
        const grid = (vals, d) => `<div class="number-grid" style="--columns:3">${vals.map(v => `<span>${fmt(v, d)}</span>`).join('')}</div>`;
        $(root, 'fl-probe').innerHTML = `<div class="vk-probe"><div><h4>Patch at (${s.px}, ${s.py})</h4>${grid(patch, 0)}</div><div><h4>Kernel${s.flip ? ' (flipped)' : ''}</h4>${grid(k, 3)}</div><div><h4>Response</h4><p class="vk-big">${fmt(patch.reduce((t, v, i) => t + v * k[i], 0), 2)}</p><p class="small muted">Sum of the nine products</p></div></div>`;
      } else $(root, 'fl-probe').innerHTML = `<p class="vk-callout">Response at (${s.px}, ${s.py}): <strong>${fmt(out[s.py * w + s.px], 2)}</strong>${s.kernel === 'gauss' ? ` using a ${size} × ${size} kernel` : ' from the two Sobel responses'}.</p>`;
      let lo = Infinity, hi = -Infinity; for (const v of out) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      return report([['Kernel size', `${size} × ${size}`], ['Sum of weights', sum === null ? 'n/a (nonlinear)' : fmt(sum, 3)], ['Output range', `${fmt(lo, 1)} to ${fmt(hi, 1)}`], ['Borders', 'reflected']]);
    },
    wire(root, s, rerender) {
      root.querySelector('#fl-in').addEventListener('click', e => { const c = e.currentTarget, rect = c.getBoundingClientRect(); s.px = clamp(Math.floor((e.clientX - rect.left) / rect.width * c.width), 1, c.width - 2); s.py = clamp(Math.floor((e.clientY - rect.top) / rect.height * c.height), 1, c.height - 2); rerender(); });
    },
  };

  /* ===== Lesson 35: receptive fields of stacked layers ===== */
  labs.receptive = {
    title: 'Receptive field of a stack', heading: 'How much of the image can one output see?',
    intro: 'Stack up to five convolution layers on a 64 × 64 input. The orange square is the theoretical receptive field of the centre output unit.',
    defaults: {layers: 3, k1: 3, s1: 1, d1: 1, k2: 3, s2: 1, d2: 1, k3: 3, s3: 2, d3: 1, k4: 3, s4: 1, d4: 1, k5: 3, s5: 1, d5: 1, padding: 'same', channels: 16},
    controls: s => range('layers', 'Number of layers', 1, 5, 1, s.layers) + `<div class="vk-layer-table">${[1, 2, 3, 4, 5].map(l => `<div class="vk-layer-row" ${l > s.layers ? 'hidden' : ''}><b>Layer ${l}</b>${select('k' + l, 'kernel', [1, 3, 5, 7].map(v => [v, `${v}×${v}`]), s['k' + l])}${select('s' + l, 'stride', [[1, '1'], [2, '2']], s['s' + l])}${select('d' + l, 'dilation', [[1, '1'], [2, '2']], s['d' + l])}</div>`).join('')}</div>` +
      select('padding', 'Padding', [['same', '“same”: p = d(k−1)/2'], ['valid', '“valid”: p = 0']], s.padding) + select('channels', 'Channels per layer (input has 3)', [8, 16, 32, 64].map(v => [v, String(v)]), s.channels) + '<div class="math-rule">rₗ = rₗ₋₁ + dₗ(kₗ − 1) jₗ₋₁,  jₗ = jₗ₋₁ sₗ</div>',
    visual: () => `<div class="vk-pair">${figure('rf-img', 'Input 64 × 64 with the centre unit’s receptive field', 'vk-pixelated')}<div id="rf-table"></div></div>`,
    note: 'Predict first: three 3 × 3 layers or one 7 × 7 layer — same receptive field? Yes, both see 7 × 7, but the stack uses fewer weights and adds nonlinearities. Strides multiply the jump, so later layers grow the field quickly. This is the theoretical field; the effective influence is concentrated near its centre.',
    async setup() { const img = await V.load('camera'); return V.downsample(img.gray, img.w, img.h, 4); },
    render(s, root, small) {
      const rows = []; let n = 64, j = 1, r = 1, cin = 3, params = 0;
      for (let l = 1; l <= s.layers; l++) {
        const k = Number(s['k' + l]), st = Number(s['s' + l]), d = Number(s['d' + l]), p = s.padding === 'same' ? Math.floor(d * (k - 1) / 2) : 0;
        const out = Math.floor((n + 2 * p - d * (k - 1) - 1) / st) + 1;
        r += d * (k - 1) * j; j *= st; const pc = k * k * cin * Number(s.channels) + Number(s.channels); params += pc;
        rows.push({l, k, st, d, p, out, j, r, pc}); n = out; cin = Number(s.channels);
      }
      // Map the centre output unit back to an input interval, one axis (the same for both axes).
      let a = Math.floor((n - 1) / 2), b = a;
      for (let i = rows.length - 1; i >= 0; i--) { const {k, st, d, p} = rows[i]; a = a * st - p; b = b * st - p + d * (k - 1); }
      const canvas = V.show($(root, 'rf-img'), small.data, small.w, small.h), ctx = canvas.getContext('2d');
      if (n > 0) { ctx.fillStyle = 'rgba(232,116,59,.28)'; ctx.fillRect(Math.max(0, a), Math.max(0, a), Math.min(63, b) - Math.max(0, a) + 1, Math.min(63, b) - Math.max(0, a) + 1); ctx.strokeStyle = '#e8743b'; ctx.lineWidth = .8; ctx.strokeRect(a + .4, a + .4, b - a + .2, b - a + .2); }
      $(root, 'rf-table').innerHTML = `<table class="vk-table"><thead><tr><th>Layer</th><th>k, s, d, p</th><th>Output</th><th>Jump</th><th>Receptive field</th><th>Weights</th></tr></thead><tbody>${rows.map(x => `<tr><td>${x.l}</td><td>${x.k}, ${x.st}, ${x.d}, ${x.p}</td><td>${x.out > 0 ? `${x.out} × ${x.out}` : 'none'}</td><td>${x.j}</td><td>${x.r} × ${x.r}</td><td>${x.pc.toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
      return report([['Final output', n > 0 ? `${n} × ${n} × ${s.channels}` : 'empty: input too small'], ['Receptive field', `${r} × ${r} input pixels`], ['Field covers', n > 0 ? `columns ${a} to ${b}${a < 0 || b > 63 ? ' (partly padding)' : ''}` : '—'], ['Total weights + biases', params.toLocaleString()]]);
    },
  };

  /* ===== Lesson 36: Fourier filtering of a photo ===== */
  labs.fourier = {
    title: 'Filtering in the frequency domain', heading: 'Keep some frequencies. Remove the rest.',
    intro: 'The 2D Fourier transform describes the photo as a sum of oriented waves. The centre of the spectrum holds slow variation; the edges hold fine detail.',
    defaults: {mode: 'lowpass', shape: 'ideal', cutoff: 16},
    controls: s => select('mode', 'Operation', [['lowpass', 'Low-pass: keep slow variation'], ['highpass', 'High-pass: keep fine detail'], ['bandpass', 'Band-pass: keep a ring'], ['phase', 'Keep only the phase'], ['magnitude', 'Keep only the magnitude']], s.mode) + `<div data-show-if-not="phase magnitude" ${['phase', 'magnitude'].includes(s.mode) ? 'hidden' : ''}>${select('shape', 'Filter edge', [['ideal', 'Ideal (sharp cutoff)'], ['gaussian', 'Gaussian (smooth)']], s.shape)}${range('cutoff', 'Cutoff radius (cycles per image)', 1, 64, 1, s.cutoff)}</div><div class="math-rule">filtered = F⁻¹( H · F(image) )</div>`,
    visual: () => `<div class="vk-pair">${figure('ft-spec', 'log(1 + |F|), centred; dimmed = removed')}${figure('ft-out', 'Result of the inverse transform')}</div>`,
    note: 'Predict first: what does an ideal low-pass filter do near sharp edges? It rings — ripples appear because a sharp cutoff in frequency spreads out in space. A Gaussian edge avoids most ringing. Phase carries where edges are: phase-only reconstruction keeps the outlines, magnitude-only does not.',
    async setup() {
      const img = await V.load('camera'), s = V.downsample(img.gray, img.w, img.h, 2), N = s.w, re = Float64Array.from(s.data), im = new Float64Array(N * N);
      V.fft2(re, im, N);
      return {N, re, im, img: s.data};
    },
    render(s, root, {N, re, im}) {
      const f = (u) => u < N / 2 ? u : u - N, H = new Float64Array(N * N), c = s.cutoff;
      for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) {
        const r = Math.hypot(f(u), f(v)); let h = 1;
        if (s.mode === 'lowpass') h = s.shape === 'ideal' ? (r <= c ? 1 : 0) : Math.exp(-r * r / (2 * c * c));
        if (s.mode === 'highpass') h = s.shape === 'ideal' ? (r > c ? 1 : 0) : 1 - Math.exp(-r * r / (2 * c * c));
        if (s.mode === 'bandpass') h = s.shape === 'ideal' ? (r >= c / 2 && r <= c ? 1 : 0) : Math.exp(-((r - .75 * c) ** 2) / (2 * (c / 4) ** 2));
        H[v * N + u] = h;
      }
      const gr = new Float64Array(N * N), gi = new Float64Array(N * N); let eIn = 0, eOut = 0, meanMag = 0;
      for (let i = 0; i < N * N; i++) meanMag += Math.hypot(re[i], im[i]) / (N * N);
      for (let i = 0; i < N * N; i++) {
        const mag = Math.hypot(re[i], im[i]);
        if (s.mode === 'phase') { gr[i] = mag ? re[i] / mag * meanMag : 0; gi[i] = mag ? im[i] / mag * meanMag : 0; }
        else if (s.mode === 'magnitude') { gr[i] = mag; gi[i] = 0; }
        else { gr[i] = re[i] * H[i]; gi[i] = im[i] * H[i]; }
        if (i) { eIn += mag * mag; eOut += gr[i] ** 2 + gi[i] ** 2; }
      }
      // Display the centred log spectrum, dimming the removed frequencies.
      const spec = new Float32Array(N * N);
      for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) { const su = (u + N / 2) % N, sv = (v + N / 2) % N, i = v * N + u; spec[sv * N + su] = Math.log1p(Math.hypot(re[i], im[i])) * (['phase', 'magnitude'].includes(s.mode) ? 1 : .25 + .75 * H[i]); }
      V.show($(root, 'ft-spec'), spec, N, N, {mode: 'auto'});
      const out = Float64Array.from(gr), oi = Float64Array.from(gi); V.fft2(out, oi, N, true);
      const display = s.mode === 'lowpass' ? {min: 0, max: 255} : s.mode === 'magnitude' ? {mode: 'auto'} : s.mode === 'phase' ? {mode: 'auto'} : {mode: 'signed'};
      V.show($(root, 'ft-out'), out, N, N, display);
      $(root, 'ft-out').nextElementSibling.textContent = s.mode === 'highpass' || s.mode === 'bandpass' ? 'Result (grey = 0): only detail remains' : s.mode === 'phase' ? 'Phase only, magnitudes set equal' : s.mode === 'magnitude' ? 'Magnitude only, phases set to zero' : 'Result of the inverse transform';
      return report([...(['phase', 'magnitude'].includes(s.mode) ? [['Kept', s.mode === 'phase' ? 'phase of every frequency' : 'magnitude of every frequency']] : [['Cutoff', `${c} cycles/image = ${fmt(c / N, 3)} cycles/pixel`], ['Energy kept (excluding the mean)', fmt(100 * eOut / eIn, 2) + '%']]), ['Image size', `${N} × ${N}, highest frequency ${N / 2} cycles/image`]]);
    },
  };

  /* ===== Lesson 41: augmentation and what happens to a box label ===== */
  const CUP = [68, 6, 162, 122];
  labs.augment = {
    title: 'Augmentation and its labels', heading: 'Transform the image. Transform the label too.',
    intro: 'A detector’s label is a box. When an augmentation moves pixels, the box must move with them. Rotation forces an axis-aligned box to grow.',
    defaults: {flip: false, angle: 0, scale: 1, tx: 0, ty: 0, brightness: 0, contrast: 1},
    controls: s => check('flip', 'Horizontal flip', s.flip) + range('angle', 'Rotation (degrees)', -40, 40, 1, s.angle) + range('scale', 'Scale', .6, 1.4, .05, s.scale) + range('tx', 'Shift x (pixels)', -60, 60, 2, s.tx) + range('ty', 'Shift y (pixels)', -40, 40, 2, s.ty) + range('brightness', 'Brightness offset', -80, 80, 4, s.brightness) + range('contrast', 'Contrast factor', .5, 1.6, .05, s.contrast) + '<div class="math-rule">x′ = M x + t (one 2 × 3 affine map for every pixel and box corner)</div>',
    visual: () => `<div class="vk-pair">${figure('ag-src', 'Original with its box label')}${figure('ag-out', 'Augmented: green = moved rectangle, orange = new axis-aligned box')}</div>`,
    note: 'Predict first: rotate by 30°. Does the new axis-aligned box fit the cup as tightly? It cannot; its corners now include background. Photometric changes (brightness, contrast) leave the box alone. A flip keeps the label “cup” but would change a label such as “handle on the left”.',
    async setup() { return V.load('coffee'); },
    render(s, root, img) {
      const {w, h} = img, cx = w / 2, cy = h / 2, th = s.angle * Math.PI / 180, cs = Math.cos(th) * s.scale, sn = Math.sin(th) * s.scale, fx = s.flip ? -1 : 1;
      // M = translate(c + t) · rotate · scale · flip · translate(−c)
      const M = [cs * fx, -sn, sn * fx, cs], t = [cx + s.tx - (M[0] * cx + M[1] * cy), cy + s.ty - (M[2] * cx + M[3] * cy)];
      const map = ([x, y]) => [M[0] * x + M[1] * y + t[0], M[2] * x + M[3] * y + t[1]];
      const src = V.showRGBA($(root, 'ag-src'), img.rgba, w, h), sctx = src.getContext('2d');
      sctx.strokeStyle = '#3fae6a'; sctx.lineWidth = 2; sctx.strokeRect(CUP[0], CUP[1], CUP[2] - CUP[0], CUP[3] - CUP[1]);
      const out = $(root, 'ag-out'); out.width = w; out.height = h;
      const ctx = out.getContext('2d', {willReadFrequently: true});
      ctx.fillStyle = '#7f7f7f'; ctx.fillRect(0, 0, w, h);
      ctx.setTransform(M[0], M[2], M[1], M[3], t[0], t[1]); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img.img, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (s.brightness || s.contrast !== 1) { const d = ctx.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) for (let c = 0; c < 3; c++) d.data[i + c] = clamp((d.data[i + c] - 128) * s.contrast + 128 + s.brightness, 0, 255); ctx.putImageData(d, 0, 0); }
      const corners = [[CUP[0], CUP[1]], [CUP[2], CUP[1]], [CUP[2], CUP[3]], [CUP[0], CUP[3]]].map(map);
      ctx.strokeStyle = '#3fae6a'; ctx.lineWidth = 2; ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.stroke();
      const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]), box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      const clip = [clamp(box[0], 0, w), clamp(box[1], 0, h), clamp(box[2], 0, w), clamp(box[3], 0, h)];
      ctx.strokeStyle = '#e8743b'; ctx.setLineDash([5, 3]); ctx.strokeRect(clip[0], clip[1], clip[2] - clip[0], clip[3] - clip[1]); ctx.setLineDash([]);
      const rectArea = (CUP[2] - CUP[0]) * (CUP[3] - CUP[1]) * s.scale * s.scale, boxArea = (box[2] - box[0]) * (box[3] - box[1]), clipArea = Math.max(0, clip[2] - clip[0]) * Math.max(0, clip[3] - clip[1]);
      return report([['Affine M | t', `[${fmt(M[0], 2)} ${fmt(M[1], 2)} | ${fmt(t[0], 1)}; ${fmt(M[2], 2)} ${fmt(M[3], 2)} | ${fmt(t[1], 1)}]`], ['New box (x₀, y₀, x₁, y₁)', clip.map(v => fmt(v, 1)).join(', ')], ['Box area vs object rectangle', `+${fmt(100 * (boxArea / rectArea - 1), 1)}%`], ['Box inside the image', fmt(100 * clipArea / boxArea, 1) + '%'], ['Handle side label', s.flip ? 'right (flipped)' : 'left']]);
    },
  };

  /* ---------- Mounting ---------- */
  const states = {}, defaults = {};
  Object.entries(labs).forEach(([k, lab]) => { defaults[k] = JSON.parse(JSON.stringify(lab.defaults)); states[k] = JSON.parse(JSON.stringify(lab.defaults)); });
  const names = Object.fromEntries(Object.entries(labs).map(([k, lab]) => [k, lab.title]));
  const credit = {svdimage: 'camera', patches: 'camera', noise: 'camera', aliasing: 'brick', imagefilter: 'camera', receptive: 'camera', fourier: 'camera', augment: 'coffee'};

  async function mount(name, target) {
    const lab = labs[name], s = states[name];
    target.dataset.lab = name;
    const photo = credit[name] && window.CV_IMAGES[credit[name]];
    target.innerHTML = `<div class="lab-layout vk-lab"><section class="lab-controls"><h3>${lab.heading}</h3><p>${lab.intro}</p>${lab.controls(s)}<button type="button" class="btn lab-defaults">Reset this experiment</button></section><section class="experiment"><div class="experiment-top"><h3>${E(lab.title)}</h3><span class="live-badge">LIVE EXPERIMENT</span></div><div class="vk-stage">${lab.visual(s)}</div><div class="vk-report"><p class="small muted">Preparing the experiment…</p></div></section></div><p class="explore-note">${lab.note}</p>${photo ? `<p class="vk-credit">Photo: ${E(photo.title)} · ${E(photo.credit)}</p>` : ''}`;
    let data = null;
    try { data = lab.setup ? await lab.setup() : null; }
    catch (error) { target.querySelector('.vk-report').innerHTML = `<p class="incorrect">${E(error.message)}</p>`; return; }
    if (!target.isConnected || target.dataset.lab !== name) return;
    // Coalesce rapid slider input into one render per frame; the timeout also covers pages that are not painting.
    let pending = false;
    const draw = () => { if (!pending) return; pending = false; if (target.isConnected && target.dataset.lab === name) target.querySelector('.vk-report').innerHTML = lab.render(s, target, data) || ''; };
    const render = () => { if (pending) return; pending = true; requestAnimationFrame(draw); setTimeout(draw, 60); };
    const sync = () => {
      target.querySelectorAll('[data-show-if]').forEach(el => { el.hidden = !String(el.dataset.showIf).split(' ').includes(String(s.kernel ?? s.mode)); });
      target.querySelectorAll('[data-show-if-not]').forEach(el => { el.hidden = String(el.dataset.showIfNot).split(' ').includes(String(s.mode)); });
      target.querySelectorAll('[data-show-when]').forEach(el => { const [key, values] = el.dataset.showWhen.split(':'); el.hidden = !values.split(' ').includes(String(s[key])); });
      target.querySelectorAll('.vk-layer-row').forEach((row, i) => { row.hidden = i >= s.layers; });
      const m = target.querySelector('.vk-matrix-inputs'); if (m) m.hidden = s.preset !== 'custom';
    };
    target.querySelectorAll('[data-vk]').forEach(el => el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => {
      const key = el.dataset.vk, old = s[key];
      s[key] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? (typeof defaults[name][key] === 'number' ? Number(el.value) : el.value) : Number(el.value);
      if (el.type === 'number' && !Number.isFinite(s[key])) s[key] = old;
      if (key === 'preset' && s.preset !== 'custom') { [s.a, s.b, s.c, s.d] = PRESETS[s.preset]; ['a', 'b', 'c', 'd'].forEach(k => { const input = target.querySelector(`#vk-${k}`); if (input) { input.value = s[k]; target.querySelector(`#vk-${k}-value`).textContent = fmt(s[k]); } }); }
      const out = target.querySelector(`#vk-${key}-value`); if (out) out.textContent = fmt(s[key]);
      sync(); render();
    }));
    target.querySelectorAll('[data-vk-action]').forEach(el => el.addEventListener('click', () => { lab.action?.(el.dataset.vkAction, s); render(); }));
    target.querySelector('.lab-defaults').addEventListener('click', () => { Object.assign(s, JSON.parse(JSON.stringify(defaults[name]))); mount(name, target).then(() => target.querySelector('.lab-defaults')?.focus()); });
    lab.wire?.(target, s, render);
    sync(); render();
  }
  // Lessons in extensions/ add their own experiments here.
  function register(name, lab) {
    labs[name] = lab;
    defaults[name] = JSON.parse(JSON.stringify(lab.defaults));
    states[name] = JSON.parse(JSON.stringify(lab.defaults));
    names[name] = lab.title;
    if (lab.photo) credit[name] = lab.photo;
  }
  window.CV_VISION_LABS = {names, mount, labs, svgPlot, register};
})();
