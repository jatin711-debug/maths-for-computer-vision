/* Lesson 64: volume rendering and neural radiance fields. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const vec = (v, d = 3) => `(${v.map(x => N(x, d)).join(', ')})`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${extra}>${E(s)}</text>`;
  const rgbCss = c => `rgb(${c.map(v => Math.round(255 * Math.max(0, Math.min(1, v)))).join(',')})`;

  /* ---------- Worked example: three samples along one ray ---------- */
  const DEPTHS = [1, 2, 3], COLOURS = [[0, 1, 0], [1, 0, 0], [0, 0, 1]], BG = [1, 1, 1], NAMES = ['green', 'red', 'blue'];
  function model(p) {
    const alpha = p.slice(0, 3), sd = alpha.map(a => -Math.log(1 - a)), T = [1], w = [];
    alpha.forEach((a, i) => { w.push(T[i] * a); T.push(T[i] * (1 - a)); });
    const Tbg = T[3], C = [0, 1, 2].map(k => w.reduce((s, wi, i) => s + wi * COLOURS[i][k], 0) + Tbg * BG[k]), sw = w[0] + w[1] + w[2];
    const depth = sw > 1e-12 ? w.reduce((s, wi, i) => s + wi * DEPTHS[i], 0) / sw : 0;
    return {alpha, sd, T, w, Tbg, C, sw, depth};
  }
  function drawing(m) {
    const X = s => 70 + (s - .5) * 120, f1 = v => v.toFixed(1), yRay = 150;
    let body = `<path d="M40 ${yRay}H${X(3.9)}" stroke="#a8b6a5" stroke-width="2"/><path d="M${X(3.9)} ${yRay}l-8 -5v10z" fill="#a8b6a5"/>`;
    body += `<path d="M22 ${yRay - 12}h18v24h-18z" fill="#172623"/><path d="M40 ${yRay - 6}l10 -6v24l-10 -6z" fill="#172623"/>`;
    // Transmittance as a staircase: it drops by the factor (1 − α) at each sample.
    const yT = v => 40 + (1 - v) * 60;
    let stair = `M${X(.5)} ${yT(1)}`;
    DEPTHS.forEach((s, i) => { stair += `H${X(s)}V${f1(yT(m.T[i + 1]))}`; });
    stair += `H${X(3.9)}`;
    body += `<path d="M${X(.5)} 40V100H${X(3.9)}" fill="none" stroke="#c7cfc5"/>` + txt(X(.5) - 6, 44, '1', '#64736b', 10.5, 'end') + txt(X(.5) - 6, 103, '0', '#64736b', 10.5, 'end');
    body += `<path d="${stair}" fill="none" stroke="#315c86" stroke-width="2.5"/>` + txt(X(.5) + 4, 34, 'transmittance T before each point', '#315c86', 11.5);
    DEPTHS.forEach((s, i) => {
      const x = X(s);
      body += `<circle cx="${x}" cy="${yRay}" r="17" fill="${rgbCss(COLOURS[i])}" fill-opacity="${m.alpha[i].toFixed(3)}" stroke="${rgbCss(COLOURS[i])}" stroke-width="2"/>`;
      body += txt(x, yRay + 32, `s = ${s}, α = ${N(m.alpha[i], 2)}`, '#172623', 11, 'middle');
      const h = 60 * m.w[i];
      body += `<rect x="${x - 12}" y="${f1(232 - h)}" width="24" height="${f1(Math.max(.5, h))}" fill="#bd431c" opacity=".8"/>` + txt(x + 16, 228, `w = ${N(m.w[i], 3)}`, '#bd431c', 11);
    });
    const xb = X(3.55);
    body += `<rect x="${xb - 14}" y="${yRay - 14}" width="28" height="28" fill="#ffffff" stroke="#64736b"/>` + txt(xb, yRay + 32, `background T = ${N(m.Tbg, 3)}`, '#172623', 11, 'middle');
    const hb = 60 * m.Tbg;
    body += `<rect x="${xb - 12}" y="${f1(232 - hb)}" width="24" height="${f1(Math.max(.5, hb))}" fill="#64736b" opacity=".6"/>`;
    body += `<rect x="470" y="40" width="60" height="60" rx="4" fill="${rgbCss(m.C)}" stroke="#172623"/>` + txt(500, 118, 'pixel', '#172623', 12, 'middle', ' font-weight="600"') + txt(500, 134, `(${m.C.map(v => N(v, 2)).join(', ')})`, '#172623', 11, 'middle');
    return {body, caption: `The ray leaves the camera on the left and meets three samples, drawn with opacity α. Blue staircase: the transmittance, which drops by the factor 1 − α at each sample. Orange bars: the weights w = Tα, which with the background’s ${N(m.Tbg, 3)} add up to 1. The square on the right is the rendered pixel.`};
  }
  function calculate(p) {
    const m = model(p), [w1, w2, w3] = m.w;
    return {
      steps: [
        step('Opacity of each interval', Q`\alpha_i=1-e^{-\sigma_i\delta_i}:\qquad \sigma\delta=(${m.sd.map(v => N(v)).join(',\ ')})\ \Rightarrow\ \alpha=(${m.alpha.map(v => N(v)).join(',\ ')})`, 'Each sample stands for one interval of the ray. Inside it the density is taken as constant, so a fraction e^(−σδ) of the light passes and α = 1 − e^(−σδ) is absorbed there; σδ = −ln(1 − α) converts back.'),
        step('Transmittance in front of each sample', Q`T_1=1,\quad T_2=1-\alpha_1=${N(m.T[1])},\quad T_3=(1-\alpha_1)(1-\alpha_2)=${N(m.T[2])},\quad T_4=${N(m.Tbg)}`, 'Light from a sample reaches the camera only if every interval in front lets it through, so the pass fractions multiply. T₄ is what is left for the background.'),
        step('Weights: how much each sample contributes', Q`w_i=T_i\alpha_i=(${N(w1)},\ ${N(w2)},\ ${N(w3)}),\qquad \sum_iw_i+T_4=${N(w1 + w2 + w3 + m.Tbg)}`, 'A sample counts only if it is reached (T) and absorbs light there (α). The weights and the background share always add up to 1, so the pixel is a weighted average.'),
        step('Composite the colour and the depth', Q`\hat C=\sum_iw_ic_i+T_4c_{\text{bg}}=${vec(m.C)},\qquad \bar s=\frac{\sum_iw_is_i}{\sum_iw_i}=${m.sw > 1e-12 ? N(m.depth) : Q`\text{undefined}`}`, `The colours are ${NAMES.join(', ')} at s = 1, 2, 3 and the background is white. ∂Ĉ/∂c₃ = w₃ = ${N(w3)}: a sample behind opaque ones has small T, so its colour hardly affects the pixel and hardly receives gradient. ${m.sw > 1e-12 ? 'The depth is the weighted mean of the sample depths.' : 'Nothing absorbs light here, so there is no depth to report (shown as 0).'}`),
      ],
      values: [['Weight w1', w1], ['Weight w2', w2], ['Weight w3', w3], ['Background transmittance', m.Tbg], ['Rendered red', m.C[0]], ['Rendered green', m.C[1]], ['Rendered blue', m.C[2]], ['Expected depth', m.depth]],
      note: 'Raise α₁ to make the green sample opaque: it hides the red and blue samples behind it, their weights fall towards 0, and the pixel turns green. With all α = 0 the ray sees only the white background.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const practice = [
    {key: 'alpha-from-density', skill: 'Turn density into opacity and transmittance', make(r) {
      let sigma, delta, k;
      do { sigma = r.pick([.1, .2, .5, 1, 2, 3, 5]); delta = r.pick([.1, .2, .25, .5, 1]); k = r.int(2, 6); } while (k * sigma * delta > 4);   // keep T above about 0.02
      const a = 1 - Math.exp(-sigma * delta), T = Math.exp(-k * sigma * delta);
      return {prompt: Q`A ray crosses fog of constant density \(\sigma=${sigma}\) per unit length, sampled at intervals of \(\delta=${delta}\). What is the opacity α of one interval, and what fraction of light passes through ${k} such intervals in a row?`,
        answers: [{label: Q`\(\alpha\)`, value: a, tol: .001}, {label: `Transmittance after ${k} intervals`, value: T, tol: .001}],
        hint: Q`\(\alpha=1-e^{-\sigma\delta}\). Each interval passes \(1-\alpha=e^{-\sigma\delta}\), and the pass fractions multiply.`,
        solution: Q`\(\sigma\delta=${N(sigma * delta, 4)}\), so \(\alpha=1-e^{-${N(sigma * delta, 4)}}=${N(a, 4)}\). Through ${k} intervals: \((1-\alpha)^{${k}}=e^{-${N(k * sigma * delta, 4)}}=${N(T, 4)}\), the same as one slab of thickness \(${k}\delta\): splitting the integral does not change it.`};
    }},
    {key: 'weights', skill: 'Compute compositing weights along a ray', make(r) {
      const al = [r.int(1, 9) / 10, r.int(1, 9) / 10, r.int(1, 9) / 10], T = [1], w = [];
      al.forEach((a, i) => { w.push(T[i] * a); T.push(T[i] * (1 - a)); });
      return {prompt: Q`Three samples along a ray, front to back, have opacities \(\alpha=(${al.join(', ')})\). Compute their weights \(w_i=T_i\alpha_i\) and the transmittance left for the background.`,
        answers: [{label: Q`\((w_1, w_2, w_3)\)`, vector: w, tol: .001}, {label: Q`background \(T_4\)`, value: T[3], tol: .001}],
        hint: Q`\(T_1=1\) and \(T_{i+1}=T_i(1-\alpha_i)\). The weights and \(T_4\) must add up to 1.`,
        solution: Q`\(T=(1,\ ${N(T[1], 4)},\ ${N(T[2], 4)})\), so \(w=(${w.map(v => N(v, 4)).join(',\ ')})\) and \(T_4=${N(T[3], 4)}\). Check: \(${w.map(v => N(v, 4)).join('+')}+${N(T[3], 4)}=1\).`};
    }},
    {key: 'composite-grey', skill: 'Composite a pixel and its depth', make(r) {
      const al = [r.int(1, 9) / 10, r.int(1, 9) / 10], c = [r.int(0, 10) / 10, r.int(0, 10) / 10], bg = r.pick([0, 1]), s = [r.int(2, 4), r.int(5, 8)];
      const w = [al[0], (1 - al[0]) * al[1]], Tb = (1 - al[0]) * (1 - al[1]), C = w[0] * c[0] + w[1] * c[1] + Tb * bg, dep = (w[0] * s[0] + w[1] * s[1]) / (w[0] + w[1]);
      return {prompt: Q`A ray meets two samples: grey value ${c[0]} with \(\alpha_1=${al[0]}\) at depth ${s[0]}, then grey value ${c[1]} with \(\alpha_2=${al[1]}\) at depth ${s[1]}. The background is ${bg ? 'white (1)' : 'black (0)'}. Render the pixel and give the expected depth \(\sum w_is_i/\sum w_i\).`,
        answers: [{label: 'Pixel value', value: C, tol: .002}, {label: 'Expected depth', value: dep, tol: .005}],
        hint: Q`\(w_1=\alpha_1\), \(w_2=(1-\alpha_1)\alpha_2\) and the background gets \((1-\alpha_1)(1-\alpha_2)\).`,
        solution: Q`\(w=(${N(w[0], 4)},\ ${N(w[1], 4)})\) and the background weight is \(${N(Tb, 4)}\). Pixel: \(${N(w[0], 4)}\cdot${c[0]}+${N(w[1], 4)}\cdot${c[1]}+${N(Tb, 4)}\cdot${bg}=${N(C, 4)}\). Depth: \((${N(w[0], 4)}\cdot${s[0]}+${N(w[1], 4)}\cdot${s[1]})/${N(w[0] + w[1], 4)}=${N(dep, 4)}\).`};
    }},
    {key: 'fourier-features', skill: 'Encode a coordinate with Fourier features', make(r) {
      const p = r.pick([.05, .1, .125, .2, .25, .3, .375, .4, .5, .6, .75, .9]), L = r.pick([2, 3]), g = [];
      for (let k = 0; k < L; k++) { const a = 2 ** k * Math.PI * p; g.push(Math.sin(a), Math.cos(a)); }
      return {prompt: Q`Compute the Fourier-feature encoding \(\gamma(p)=(\sin2^0\pi p,\ \cos2^0\pi p,\ \ldots,\ \sin2^{L-1}\pi p,\ \cos2^{L-1}\pi p)\) for \(p=${p}\) with \(L=${L}\) (${2 * L} numbers).`,
        answers: [{label: Q`\(\gamma(${p})\)`, vector: g, tol: .002}],
        hint: Q`The angles are \(\pi p\), \(2\pi p\)${L > 2 ? Q`, \(4\pi p\)` : ''}, in radians. Take the sine and the cosine of each.`,
        solution: Q`Angles \(${Array.from({length: L}, (_, k) => N(2 ** k * Math.PI * p, 4)).join(',\ ')}\) rad, so \(\gamma(${p})=(${g.map(v => N(v, 3)).join(',\ ')})\). Each pair lies on the unit circle and turns twice as fast as the one before, which is what lets an MLP produce sharp changes in p.`};
    }},
    {key: 'psnr', skill: 'Convert a rendering error to PSNR', make(r) {
      const rms = r.pick([2, 4, 5, 8, 10, 12.75, 16, 25.5]), mse = (rms / 255) ** 2, psnr = -10 * Math.log10(mse);
      return {prompt: Q`A NeRF’s held-out renders differ from the photos by an RMS error of ${rms} grey levels on a 0–255 scale. What is the RMS error on the [0, 1] scale, and what is the PSNR in decibels?`,
        answers: [{label: 'RMS error on [0, 1]', value: rms / 255, tol: 1e-4}, {label: 'PSNR (dB)', value: psnr, tol: .02}],
        hint: Q`Divide the RMS error by 255, square it for the MSE, then \(\text{PSNR}=-10\log_{10}\text{MSE}\).`,
        solution: Q`\(${rms}/255=${N(rms / 255, 5)}\), so MSE \(=${N(mse, 7)}\) and \(\text{PSNR}=-10\log_{10}${N(mse, 7)}=${N(psnr, 2)}\) dB, the same as \(20\log_{10}(255/${rms})\). Halving the RMS error would add \(20\log_{10}2\approx6.02\) dB.`};
    }},
    {key: 'ray-direction', skill: 'Cast the ray through a pixel', make(r) {
      const f = r.pick([100, 200, 400, 500]), cx = r.pick([64, 160, 320]), cy = r.pick([48, 120, 240]), du = r.pick([-1, -.5, 0, .5, 1]), dv = r.pick([-.5, -.25, 0, .25, .5]), turn = r.bool();
      const u = cx + du * f, v = cy + dv * f, dc = [du, dv, 1], R = turn ? [[0, 0, -1], [0, 1, 0], [1, 0, 0]] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const d = [0, 1, 2].map(j => R[0][j] * dc[0] + R[1][j] * dc[1] + R[2][j] * dc[2]).map(x => x + 0);
      return {prompt: Q`A camera has \(K=${mat([[f, 0, cx], [0, f, cy], [0, 0, 1]])}\) and \(R=${mat(R)}\). Find the ray direction \(d=R^TK^{-1}(u,v,1)^T\) through the pixel \((u,v)=(${u}, ${v})\) (do not normalise it).`,
        answers: [{label: Q`\(d\)`, vector: d, tol: .001}],
        hint: Q`\(K^{-1}(u,v,1)^T=((u-c_x)/f,\ (v-c_y)/f,\ 1)\). Then multiply by \(R^T\), whose rows are the columns of R.`,
        solution: Q`\(K^{-1}(${u}, ${v}, 1)^T=${vec(dc)}\) in camera coordinates. ${turn ? Q`\(R^T=${mat([[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]])}\) turns it into world coordinates: \(d=${vec(d)}\).` : Q`With \(R=I\) the world direction is the same: \(d=${vec(d)}\).`} Points on the ray are \(o+sd\) with \(o=-R^Tt\).`};
    }},
    {key: 'inverse-cdf', skill: 'Place a new sample by inverting the CDF of the weights', make(r) {
      const raw = [r.int(0, 4), r.int(1, 5), r.int(1, 5), r.int(0, 4)], tot = raw.reduce((s, v) => s + v, 0), p = raw.map(v => v / tot), u = r.pick([.1, .2, .3, .45, .6, .7, .85, .95]);
      let F = 0, k = 0; while (k < 3 && F + p[k] < u) { F += p[k]; k++; }
      const s = k + .5 + (u - F) / p[k];
      return {prompt: Q`A coarse pass along a ray gave weights proportional to \((${raw.join(', ')})\) for the four intervals [0.5, 1.5], [1.5, 2.5], [2.5, 3.5] and [3.5, 4.5]. Treat the normalised weights as a piecewise-constant probability density and invert its cumulative distribution: where does the uniform number u = ${u} place a new sample?`,
        answers: [{label: 'New sample position s', value: s, tol: .002}],
        hint: 'Divide each weight by their sum, add them up from the front until the running total passes u, then move into that interval in proportion to the remaining part of u.',
        solution: Q`Normalised weights \((${p.map(v => N(v, 3)).join(',\ ')})\), cumulative \((${p.map((_, i) => N(p.slice(0, i + 1).reduce((a, b) => a + b, 0), 3)).join(',\ ')})\). u = ${u} falls in interval ${k + 1}, [${k + .5}, ${k + 1.5}], after a cumulative ${N(F, 3)}, so \(s=${k + .5}+(${u}-${N(F, 3)})/${N(p[k], 3)}=${N(s, 3)}\). Intervals with large weights receive most of the new samples.`};
    }},
  ];

  /* ---------- Lab part 1: ray-march a field of coloured Gaussian blobs ---------- */
  const IW = 120, IH = 90, FOC = 100, NEAR = 2, FAR = 6, DIST = 4;
  const BLOBS = [
    {mu: [0, 0, 0], s: .55, d: 6, c: [.86, .22, .16]},
    {mu: [.85, .45, .35], s: .35, d: 10, c: [.2, .38, .92]},
    {mu: [-.75, -.45, .15], s: .45, d: 2.2, c: [.25, .78, .32]},
    {mu: [.15, -.85, -.35], s: .28, d: 16, c: [.97, .8, .18]},
  ];
  function field(x, k) {
    let sig = 0, r = 0, g = 0, b = 0;
    for (const B of BLOBS) {
      const dx = x[0] - B.mu[0], dy = x[1] - B.mu[1], dz = x[2] - B.mu[2], v = k * B.d * Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * B.s * B.s));
      sig += v; r += v * B.c[0]; g += v * B.c[1]; b += v * B.c[2];
    }
    return sig > 1e-12 ? [sig, r / sig, g / sig, b / sig] : [0, 0, 0, 0];
  }
  function orbit(s) {
    const y = s.yaw * Math.PI / 180, p = s.pitch * Math.PI / 180, dir = [Math.cos(p) * Math.cos(y), Math.cos(p) * Math.sin(y), Math.sin(p)];
    const o = dir.map(v => DIST * v), fwd = dir.map(v => -v), rt = [fwd[1], -fwd[0], 0], n = Math.hypot(rt[0], rt[1]) || 1, right = rt.map(v => v / n);
    const down = [fwd[1] * right[2] - fwd[2] * right[1], fwd[2] * right[0] - fwd[0] * right[2], fwd[0] * right[1] - fwd[1] * right[0]];
    return {o, right, down, fwd};
  }
  // d = Rᵀ K⁻¹ (u, v, 1): the rows of R are the camera's right, down and forward axes in world coordinates.
  function rayDir(cam, u, v) { const a = (u - IW / 2) / FOC, b = (v - IH / 2) / FOC, d = [0, 1, 2].map(k => cam.right[k] * a + cam.down[k] * b + cam.fwd[k]), n = Math.hypot(...d); return d.map(x => x / n); }
  function sampleTs(s, g) {
    const n = s.samples, dl = (FAR - NEAR) / n, ts = Array.from({length: n}, (_, i) => NEAR + (i + (s.jitter ? g.next() : .5)) * dl);
    return {ts, ds: ts.map((t, i) => (i < n - 1 ? ts[i + 1] : FAR + (s.jitter ? 0 : dl / 2)) - t)};
  }
  function march(cam, d, s, g) {
    const {ts, ds} = sampleTs(s, g);
    let T = 1, r = 0, gg = 0, b = 0, sw = 0, st = 0;
    const per = [];
    for (let i = 0; i < ts.length; i++) {
      const x = [cam.o[0] + ts[i] * d[0], cam.o[1] + ts[i] * d[1], cam.o[2] + ts[i] * d[2]], [sig, cr, cg, cb] = field(x, s.density), a = 1 - Math.exp(-sig * ds[i]), w = T * a;
      r += w * cr; gg += w * cg; b += w * cb; sw += w; st += w * ts[i]; per.push({t: ts[i], dt: ds[i], sig, a, w, T});
      T *= 1 - a;
    }
    return {rgb: [r + T, gg + T, b + T], opacity: sw, depth: sw > 1e-6 ? st / sw : NaN, T, per};
  }

  /* ---------- Lab part 2: fit one image row with an MLP on Fourier features ---------- */
  const ROW = 100, HID = 32, STEPS = 400, LR = .01;
  const encode = (x, L) => { const f = [2 * x - 1]; for (let k = 0; k < L; k++) { const a = Math.PI * 2 ** k * x; f.push(Math.sin(a), Math.cos(a)); } return f; };
  function trainFit(L, target, seed) {
    const V = window.CV_VISION, g = V.rng(9100 + 131 * seed + 7 * L), n = target.length, D = 1 + 2 * L, idx = [], H = HID;
    for (let i = 0; i < n; i += 2) idx.push(i);
    const m = idx.length, X = new Float64Array(m * D), Y = Float64Array.from(idx, i => target[i]);
    idx.forEach((i, r) => X.set(encode((i + .5) / n, L), r * D));
    const he = (fan, len) => Float64Array.from({length: len}, () => g.gauss() * Math.sqrt(2 / fan));
    const P = {W1: he(D, D * H), b1: new Float64Array(H), W2: he(H, H * H), b2: new Float64Array(H), W3: he(H, H), b3: new Float64Array(1)};
    const keys = Object.keys(P), Mo = {}, Ve = {}, G = {};
    keys.forEach(k => { Mo[k] = new Float64Array(P[k].length); Ve[k] = new Float64Array(P[k].length); G[k] = new Float64Array(P[k].length); });
    const h1 = new Float64Array(m * H), h2 = new Float64Array(m * H), out = new Float64Array(m), g2 = new Float64Array(m * H), g1 = new Float64Array(m * H);
    const forward = () => {
      for (let r = 0; r < m; r++) {
        for (let j = 0; j < H; j++) { let z = P.b1[j]; for (let k = 0; k < D; k++) z += X[r * D + k] * P.W1[k * H + j]; h1[r * H + j] = z > 0 ? z : 0; }
        for (let j = 0; j < H; j++) { let z = P.b2[j]; for (let k = 0; k < H; k++) z += h1[r * H + k] * P.W2[k * H + j]; h2[r * H + j] = z > 0 ? z : 0; }
        let z = P.b3[0]; for (let k = 0; k < H; k++) z += h2[r * H + k] * P.W3[k]; out[r] = z;
      }
    };
    for (let it = 1; it <= STEPS; it++) {
      forward();
      keys.forEach(k => G[k].fill(0));
      for (let r = 0; r < m; r++) {
        const gy = 2 * (out[r] - Y[r]) / m;
        G.b3[0] += gy;
        for (let k = 0; k < H; k++) { G.W3[k] += h2[r * H + k] * gy; g2[r * H + k] = h2[r * H + k] > 0 ? gy * P.W3[k] : 0; }
        for (let j = 0; j < H; j++) { const gj = g2[r * H + j]; if (!gj) continue; G.b2[j] += gj; for (let k = 0; k < H; k++) G.W2[k * H + j] += h1[r * H + k] * gj; }
        for (let k = 0; k < H; k++) { if (h1[r * H + k] <= 0) { g1[r * H + k] = 0; continue; } let s2 = 0; for (let j = 0; j < H; j++) s2 += P.W2[k * H + j] * g2[r * H + j]; g1[r * H + k] = s2; }
        for (let j = 0; j < H; j++) { const gj = g1[r * H + j]; if (!gj) continue; G.b1[j] += gj; for (let k = 0; k < D; k++) G.W1[k * H + j] += X[r * D + k] * gj; }
      }
      const c1 = 1 - .9 ** it, c2 = 1 - .999 ** it;
      keys.forEach(k => { const p = P[k], gk = G[k], mo = Mo[k], ve = Ve[k]; for (let i = 0; i < p.length; i++) { mo[i] = .9 * mo[i] + .1 * gk[i]; ve[i] = .999 * ve[i] + .001 * gk[i] * gk[i]; p[i] -= LR * (mo[i] / c1) / (Math.sqrt(ve[i] / c2) + 1e-8); } });
    }
    const predict = x => {
      const f = encode(x, L), a1 = new Float64Array(H), a2 = new Float64Array(H);
      for (let j = 0; j < H; j++) { let z = P.b1[j]; for (let k = 0; k < D; k++) z += f[k] * P.W1[k * H + j]; a1[j] = z > 0 ? z : 0; }
      for (let j = 0; j < H; j++) { let z = P.b2[j]; for (let k = 0; k < H; k++) z += a1[k] * P.W2[k * H + j]; a2[j] = z > 0 ? z : 0; }
      let z = P.b3[0]; for (let k = 0; k < H; k++) z += a2[k] * P.W3[k]; return z;
    };
    let se = [0, 0], cnt = [0, 0];
    for (let i = 0; i < n; i++) { const e = predict((i + .5) / n) - target[i], part = i % 2; se[part] += e * e; cnt[part]++; }
    const curve = Array.from({length: 513}, (_, i) => [i / 512 * n, predict(i / 512)]);
    return {curve, train: -10 * Math.log10(se[0] / cnt[0]), test: -10 * Math.log10(se[1] / cnt[1]), params: D * H + H + H * H + H + H + 1};
  }

  let memo = {fits: {}};
  const lab = {
    name: 'volume', title: 'Volume rendering and Fourier features', photo: 'camera',
    heading: 'March rays through a volume. Then fit an edge.',
    intro: 'Part 1 renders four overlapping Gaussian blobs of density and colour, seen by a camera orbiting at 4 units; every pixel composites samples between distance 2 and 6 along its ray. Click a pixel to see its density, transmittance and weights. Part 2 trains a small MLP (two hidden layers of 32 ReLU units, Adam, 400 steps) on every second pixel of one row of the cameraman photo, with L levels of Fourier features.',
    defaults: {part: 'render', yaw: 30, pitch: 15, samples: 32, jitter: false, density: 1, seed: 1, px: 60, py: 45, levels: 0},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return select('part', 'Experiment', [['render', 'Part 1: render a volume of coloured blobs'], ['fourier', 'Part 2: fit an image row with Fourier features']], s.part) +
        `<div data-show-when="part:render">${range('yaw', 'Orbit: angle around the scene (°)', -180, 180, 5, s.yaw)}${range('pitch', 'Orbit: elevation (°)', -40, 70, 5, s.pitch)}${range('samples', 'Samples per ray N', 4, 128, 4, s.samples)}${check('jitter', 'Stratified (jittered) sample positions', s.jitter)}${range('density', 'Density scale', .25, 4, .25, s.density)}<div class="math-rule">αᵢ = 1 − e^(−σᵢδᵢ),  wᵢ = Tᵢαᵢ,  Ĉ = Σ wᵢcᵢ + T c_bg</div></div>` +
        `<div data-show-when="part:fourier">${range('levels', 'Fourier levels L (0 = raw coordinate only)', 0, 9, 1, s.levels)}<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New initialisation ↻</button></div><div class="math-rule">γ(p) = (sin 2ᵏπp, cos 2ᵏπp), k = 0 … L − 1</div></div>`;
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div id="vr-part-render" style="min-width:0"><div class="vk-pair">${figure('vr-img', 'Rendered image (click a pixel to inspect its ray)', 'vk-clickable vk-pixelated')}${figure('vr-depth', 'Expected depth Σwᵢsᵢ / Σwᵢ (dark = near, white = no matter)', 'vk-clickable vk-pixelated')}</div><div class="vk-pair"><div id="vr-sigma" style="min-width:0"></div><div id="vr-weights" style="min-width:0"></div></div></div>` +
        `<div id="vr-part-fourier" style="min-width:0"><div class="vk-pair">${figure('vr-photo', 'Cameraman: the fitted row is marked in orange')}<div id="vr-psnr"></div></div><div id="vr-fit" style="min-width:0"></div></div>`;
    },
    note: 'Predict first: with 8 samples per ray, do smooth blobs still look smooth? No: each sample stands for a thick slab, so the colours break into bands; turn on jittered samples and the bands become noise, which averages away over many rays, as in NeRF training. The yellow blob is dense: the weights behind it are almost 0, so in a NeRF nothing behind it would be learned. In Part 2, step L from 0 upwards. Without Fourier features the MLP draws a blurred row, however long it trains; L = 4 or 5 recovers the edges; L = 8 or 9 matches the training pixels almost exactly but oscillates between them, so the held-out PSNR falls. Each new L trains once (under a second) and is then remembered.',
    async setup() {
      const img = await window.CV_VISION.load('camera');
      return {img, row: Array.from({length: img.w}, (_, x) => img.gray[ROW * img.w + x] / 255)};
    },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt} = V, plot = window.CV_VISION_LABS.svgPlot;
      const partR = root.querySelector('#vr-part-render'), partF = root.querySelector('#vr-part-fourier');
      partR.style.display = s.part === 'render' ? '' : 'none'; partF.style.display = s.part === 'fourier' ? '' : 'none';
      if (s.part === 'fourier') {
        const key = `${s.levels}:${s.seed}`;
        if (!memo.fits[key]) memo.fits[key] = trainFit(s.levels, data.row, s.seed);
        const fit = memo.fits[key], n = data.row.length;
        V.showRGBA(root.querySelector('#vr-photo'), data.img.rgba, data.img.w, data.img.h);
        const ctx = root.querySelector('#vr-photo').getContext('2d'); ctx.fillStyle = 'rgba(232,116,59,.85)'; ctx.fillRect(0, ROW - 1, data.img.w, 2);
        root.querySelector('#vr-fit').innerHTML = plot({w: 640, h: 230, x: [0, n], y: [-.05, 1.05], lines: [{points: data.row.map((v, i) => [i + .5, v]), cls: 'series-b vk-thin'}, {points: fit.curve, cls: 'series-a'}], label: 'Intensity along the photo row and the MLP fit', xLabel: `column (row ${ROW} of the photo); trained on even columns, tested on odd ones`, yLabel: 'intensity', xTicks: [0, 64, 128, 192, 256], yTicks: [0, .5, 1]}) +
          '<p class="vk-legend"><span><span class="vk-key vk-key-eig1" style="margin-right:5px"></span>the photo’s row</span><span><span class="vk-key vk-key-vector" style="margin-right:5px"></span>the MLP’s output between and at the pixels</span></p>';
        const seen = Object.keys(memo.fits).filter(k => k.endsWith(`:${s.seed}`)).map(k => [Number(k.split(':')[0]), memo.fits[k]]);
        root.querySelector('#vr-psnr').innerHTML = plot({w: 330, h: 220, x: [-.5, 9.5], y: [0, 50], bars: seen.map(([L, f]) => [L - .35, L + .35, f.test]), dots: seen.map(([L, f]) => [L, Math.min(50, f.train), 'vk-dot']), marker: s.levels, label: 'Held-out PSNR (bars) and training PSNR (dots) for each L tried so far', xLabel: 'Fourier levels L (tried so far)', yLabel: 'PSNR (dB)', xTicks: [0, 3, 6, 9], yTicks: [0, 25, 50]}) + '<p class="vk-legend"><span>bars: held-out (odd) pixels · dots: training (even) pixels</span></p>';
        return V.report([['Input width', `${1 + 2 * s.levels} numbers (x and ${s.levels} sine–cosine pairs)`], ['Parameters', String(fit.params)], ['PSNR on the training pixels', `${fmt(fit.train, 1)} dB`], ['PSNR on the held-out pixels', `${fmt(fit.test, 1)} dB`], ['Highest frequency', s.levels ? `${2 ** (s.levels - 1)} cycles across the row (the 128 training pixels support up to 64)` : 'none: the raw coordinate only']]);
      }
      // Part 1: render every pixel, then the probe ray in detail.
      const cam = orbit(s), key = JSON.stringify([s.yaw, s.pitch, s.samples, s.jitter, s.density, s.seed]);
      if (memo.renderKey !== key) {
        // The same compositing as march(), written without temporary arrays because it runs for every pixel.
        const g = V.rng(640 + 17 * s.seed), img = new Uint8ClampedArray(IW * IH * 4), dep = new Uint8ClampedArray(IW * IH * 4), n = s.samples, dl = (FAR - NEAR) / n;
        const nb = BLOBS.length, mu = BLOBS.flatMap(B => B.mu), inv = BLOBS.map(B => 1 / (2 * B.s * B.s)), amp = BLOBS.map(B => s.density * B.d), col = BLOBS.flatMap(B => B.c), ts = new Float64Array(n + 1);
        for (let v = 0; v < IH; v++) for (let u = 0; u < IW; u++) {
          const [dx, dy, dz] = rayDir(cam, u + .5, v + .5);
          for (let i = 0; i < n; i++) ts[i] = NEAR + (i + (s.jitter ? g.next() : .5)) * dl;
          ts[n] = s.jitter ? FAR : FAR + dl / 2;
          let T = 1, r = 0, gg = 0, b = 0, sw = 0, st = 0;
          for (let i = 0; i < n && T > 1e-4; i++) {
            const t = ts[i], x = cam.o[0] + t * dx, y = cam.o[1] + t * dy, z = cam.o[2] + t * dz;
            let sig = 0, cr = 0, cg = 0, cb = 0;
            for (let k = 0; k < nb; k++) { const ax = x - mu[3 * k], ay = y - mu[3 * k + 1], az = z - mu[3 * k + 2], q = amp[k] * Math.exp(-(ax * ax + ay * ay + az * az) * inv[k]); sig += q; cr += q * col[3 * k]; cg += q * col[3 * k + 1]; cb += q * col[3 * k + 2]; }
            if (sig < 1e-9) continue;
            const w = T * (1 - Math.exp(-sig * (ts[i + 1] - t)));
            r += w * cr / sig; gg += w * cg / sig; b += w * cb / sig; sw += w; st += w * t; T -= w;
          }
          const i4 = 4 * (v * IW + u);
          img[i4] = 255 * (r + T); img[i4 + 1] = 255 * (gg + T); img[i4 + 2] = 255 * (b + T); img[i4 + 3] = 255;
          const gv = sw > .05 ? 255 * Math.max(0, Math.min(1, (st / sw - 2.6) / 2.8)) : 255;
          dep[i4] = dep[i4 + 1] = dep[i4 + 2] = gv; dep[i4 + 3] = 255;
        }
        memo.renderKey = key; memo.img = img; memo.dep = dep;
      }
      const imc = root.querySelector('#vr-img'), dpc = root.querySelector('#vr-depth');
      V.showRGBA(imc, memo.img, IW, IH); V.showRGBA(dpc, memo.dep, IW, IH);
      const px = Math.max(0, Math.min(IW - 1, Math.round(s.px))), py = Math.max(0, Math.min(IH - 1, Math.round(s.py)));
      [imc, dpc].forEach(cv => { const ctx = cv.getContext('2d'); ctx.strokeStyle = '#e8743b'; ctx.lineWidth = 1; ctx.strokeRect(px - 2.5, py - 2.5, 6, 6); });
      const d = rayDir(cam, px + .5, py + .5), probe = march(cam, d, s, V.rng(77 + s.seed));
      const dense = Array.from({length: 301}, (_, i) => NEAR + (FAR - NEAR) * i / 300).map(t => [t, field([cam.o[0] + t * d[0], cam.o[1] + t * d[1], cam.o[2] + t * d[2]], s.density)[0]]);
      let acc = 0;
      const Tline = dense.map((p, i) => { if (i) acc += (dense[i - 1][1] + p[1]) / 2 * (p[0] - dense[i - 1][0]); return [p[0], Math.exp(-acc)]; });
      const sMax = Math.max(1, ...dense.map(p => p[1])) * 1.08;
      root.querySelector('#vr-sigma').innerHTML = plot({w: 330, h: 190, x: [NEAR, FAR], y: [0, sMax], lines: [{points: dense, cls: 'series-a'}], dots: probe.per.map(q => [q.t, q.sig]), label: 'Density along the clicked ray, with the sample positions', xLabel: `distance s along the ray from pixel (${px}, ${py})`, yLabel: 'density σ', xTicks: [2, 3, 4, 5, 6]});
      root.querySelector('#vr-weights').innerHTML = plot({w: 330, h: 190, x: [NEAR, FAR], y: [0, 1], lines: [{points: Tline, cls: 'series-b'}], bars: probe.per.map(q => [q.t - q.dt / 2, q.t + q.dt / 2, q.w]), label: 'Transmittance along the ray (line) and the weight of each sample (bars)', xLabel: 'distance s along the ray', yLabel: 'T(s) and wᵢ', xTicks: [2, 3, 4, 5, 6], yTicks: [0, .5, 1]}) + '<p class="vk-legend"><span><span class="vk-key vk-key-eig1" style="margin-right:5px"></span>transmittance T(s)</span><span><span class="vk-key vk-key-ellipse" style="margin-right:5px"></span>sample weights wᵢ = Tᵢαᵢ</span></p>';
      const top = probe.per.reduce((a, q) => q.w > a.w ? q : a, probe.per[0]);
      return V.report([
        ['Samples per ray', `${s.samples}, ${s.jitter ? 'jittered' : 'at fixed midpoints'}, δ = ${fmt((FAR - NEAR) / s.samples, 3)}`],
        ['Clicked pixel colour', `(${probe.rgb.map(c => fmt(Math.max(0, Math.min(1, c)), 3)).join(', ')})`],
        ['Opacity Σwᵢ', fmt(probe.opacity, 3) + `, background share ${fmt(probe.T, 3)}`],
        ['Expected depth', Number.isFinite(probe.depth) ? fmt(probe.depth, 3) : 'none: the ray misses every blob'],
        ['Largest weight', `${fmt(top.w, 3)} at s = ${fmt(top.t, 2)}`],
        ['Rays × samples', `${IW * IH} × ${s.samples} = ${(IW * IH * s.samples).toLocaleString('en-GB')} density evaluations`],
      ]);
    },
    wire(root, s, rerender) {
      ['#vr-img', '#vr-depth'].forEach(sel => {
        const el = root.querySelector(sel);
        if (!el) return;
        el.style.touchAction = 'none';
        const pick = e => { const b = el.getBoundingClientRect(); if (!b.width) return; s.px = Math.floor((e.clientX - b.left) / b.width * IW); s.py = Math.floor((e.clientY - b.top) / b.height * IH); rerender(); };
        el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch {} pick(e); });
        el.addEventListener('pointermove', e => { if (el.hasPointerCapture?.(e.pointerId)) pick(e); });
      });
    },
    action(name, s) { if (name === 'reseed') s.seed++; },
  };

  window.CV_EXTEND.lesson(64, {
    teaching: {
      equation: Q`\begin{gathered}\hat C=\sum_{i=1}^{N}T_i\,\alpha_i\,c_i+T_{N+1}\,c_{\text{bg}},\qquad \alpha_i=1-e^{-\sigma_i\delta_i},\qquad T_i=\prod_{j<i}(1-\alpha_j)\\ \gamma(p)=\bigl(\sin2^k\pi p,\ \cos2^k\pi p\bigr)_{k=0}^{L-1}\end{gathered}`,
      symbols: [['σᵢ', 'density at sample i'], ['δᵢ', 'length of interval i'], ['αᵢ', 'opacity of interval i'], ['Tᵢ', 'transmittance before sample i'], ['γ(p)', 'Fourier features of coordinate p']],
      connection: 'NeRF and its successors (Mip-NeRF, Instant-NGP, NeuS), semantic and feature fields, and text-to-3D methods render images by compositing samples along camera rays, and Gaussian splatting uses the same weights; Fourier features also encode positions in transformers.',
      trap: 'A sample’s colour counts only through its weight Tᵢαᵢ. Samples behind an opaque surface have Tᵢ ≈ 0, so they barely affect the pixel and barely receive gradient: do not expect a NeRF to learn what no camera saw.',
      question: 'Two samples along a ray have α₁ = 0.5 and α₂ = 0.75, and the background gets the rest. What weight does the second sample receive?',
      choices: ['0.375', '0.75', '0.125'], correct: 0,
      explanation: 'The second sample is reached by T₂ = 1 − α₁ = 0.5 of the light and absorbs α₂ = 0.75 of it, so w₂ = 0.5 · 0.75 = 0.375. The 0.125 that passes both goes to the background.',
    },
    guide: {
      title: 'A pixel is a weighted average of the samples along its ray',
      paragraphs: [
        'A camera ray passes through a field of density and colour. Light from distance s survives the trip with probability T(s) = exp(−∫σ), so the pixel is the integral of T·σ·c along the ray plus what is left for the background. Splitting the ray into intervals turns the integral into alpha compositing: αᵢ = 1 − e^(−σᵢδᵢ), weights wᵢ = Tᵢαᵢ, and a weighted average of the sample colours.',
        'NeRF stores σ and c in an MLP and trains it by rendering pixels of posed photos. Because an MLP fed raw coordinates learns smooth functions first (spectral bias), each coordinate is first expanded into Fourier features sin(2ᵏπp), cos(2ᵏπp), which let the network represent fine detail.',
      ],
      example: 'Composite three samples along one ray',
      controls: [{label: 'Opacity α₁ of the green sample at s = 1', min: 0, max: .95, step: .05, value: 0}, {label: 'Opacity α₂ of the red sample at s = 2', min: 0, max: .95, step: .05, value: .5}, {label: 'Opacity α₃ of the blue sample at s = 3', min: 0, max: .95, step: .05, value: .75}],
      predict: 'Make the green sample at the front almost opaque. What happens to the weights of the red and blue samples behind it?',
      takeaway: 'Each sample contributes wᵢ = Tᵢαᵢ: it must be reached and must absorb. The weights and the background share sum to 1, so the pixel is a weighted average, and front samples hide those behind them, both in the image and in the gradients that train a NeRF.',
      notation: 'Samples sit at distances sᵢ = 1, 2, 3 along the ray. σᵢδᵢ is the density times the interval length, αᵢ the opacity, Tᵢ the transmittance in front of sample i, wᵢ its weight and cᵢ its colour; T₄ is the share left for the white background and s̄ the expected depth.',
    },
    notation: {
      'σᵢ': {tex: Q`\sigma_i`, detail: 'The density at sample i: the fraction of light absorbed per unit length there. Here σ is a density, not a standard deviation or a sigmoid; it is zero in empty space and very large inside solid objects.'},
      'δᵢ': {tex: Q`\delta_i`, detail: 'The length of the ray interval that sample i stands for, usually the distance to the next sample. Only the product σᵢδᵢ matters for the opacity.'},
      'αᵢ': {tex: Q`\alpha_i`, detail: 'The opacity of interval i, 1 − e^(−σᵢδᵢ): the probability that light is absorbed there. It is between 0 (empty) and 1 (opaque), the same alpha as in image compositing.'},
      'Tᵢ': {tex: Q`T_i`, detail: 'The transmittance in front of sample i, the product of (1 − αⱼ) over the earlier samples: the share of light from sample i that reaches the camera. It never increases along the ray.'},
      'γ(p)': {tex: Q`\gamma(p)`, detail: 'The Fourier-feature encoding of a coordinate p: sines and cosines of 2ᵏπp for k = 0 … L − 1. It replaces p as the network input so that an MLP can represent high-frequency detail.'},
    },
    calculate, practice, lab,
  });
})();
