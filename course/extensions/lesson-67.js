/* Lesson 67: diffusion models, noising, denoising and sampling. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const gauss = (x, m, v) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);

  /* ---------- Worked example: noise one value, then denoise it ---------- */
  function model(p) {
    const [x0, eps, abar, s] = p, sa = Math.sqrt(abar), sn = Math.sqrt(1 - abar), xt = sa * x0 + sn * eps, x0hat = (xt - sn * eps) / sa;
    const v = abar * s * s + 1 - abar, Ex0 = sa * s * s * xt / v, Eeps = sn * xt / v, score = -xt / v, postVar = s * s * (1 - abar) / v;
    return {x0, eps, abar, s, sa, sn, xt, x0hat, v, Ex0, Eeps, score, postVar};
  }
  function drawing(m) {
    const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', weight = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}>${E(s)}</text>`;
    const x0 = -6, x1 = 6, L = 30, R = 530, Tp = 46, B = 200, X = v => L + (v - x0) / (x1 - x0) * (R - L);
    const curves = [[v => gauss(v, 0, m.s * m.s), '#34734e', '6 4'], [v => gauss(v, 0, m.v), '#315c86', ''], [v => gauss(v, m.Ex0, m.postVar), '#bd431c', '']];
    const top = Math.max(gauss(0, 0, m.s * m.s), gauss(0, 0, m.v), gauss(0, 0, m.postVar)) * 1.08, Y = v => B - v / top * (B - Tp);
    let body = txt(L, 18, 'Densities: data x₀ (green dashes), noisy x_t (blue), and x₀ given this x_t (orange)', '#172623', 12.5);
    body += `<path d="M${L} ${B}H${R}" stroke="#a8b6a5"/>`;
    for (let v = -6; v <= 6; v += 2) body += `<path d="M${X(v)} ${B}v4" stroke="#a8b6a5"/>` + txt(X(v), B + 16, String(v), '#64736b', 10, 'middle');
    curves.forEach(([f, color, dash]) => { body += `<path d="${Array.from({length: 301}, (_, i) => x0 + i * .04).map((v, i) => `${i ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(f(v)).toFixed(1)}`).join('')}" fill="none" stroke="${color}" stroke-width="2.2"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`; });
    // Tweedie: x_t + (1 − ᾱ)·score = √ᾱ E[x₀ | x_t]; dividing by √ᾱ gives the denoised value.
    const tip = m.xt + (1 - m.abar) * m.score, ay = B + 32;
    body += `<path d="M${X(m.xt).toFixed(1)} ${ay}H${X(tip).toFixed(1)}" stroke="#a06a00" stroke-width="2.4"/><path d="M${X(tip).toFixed(1)} ${ay}l${tip < m.xt ? 7 : -7} -4v8z" fill="#a06a00"/>`;
    body += txt(R, ay + 4, '(1 − ᾱ)·score', '#a06a00', 11, 'end');
    [[m.x0, '#34734e', 'x₀'], [m.xt, '#315c86', 'x_t'], [m.Ex0, '#bd431c', 'E[x₀|x_t]']].forEach(([v, color, label], i) => { body += `<circle cx="${X(v).toFixed(1)}" cy="${B}" r="5" fill="${color}"/>` + txt(X(v).toFixed(1), Tp - 6 + i * 13, label, color, 11, 'middle', '700') + `<path d="M${X(v).toFixed(1)} ${Tp - 3 + i * 13}V${B}" stroke="${color}" stroke-width=".8" stroke-dasharray="2 3"/>`; });
    return {body, caption: `The data (green dashes) are N(0, ${N(m.s * m.s, 2)}). Noising with ᾱ = ${N(m.abar, 2)} shrinks them by √ᾱ and adds noise, giving the blue density. Seeing only x_t = ${N(m.xt)}, the best one can say about x₀ is the orange posterior: its mean E[x₀ | x_t] = ${N(m.Ex0)} is what an ideal noise predictor returns, not the true x₀ = ${N(m.x0, 2)}. Gold arrow: the Tweedie step (1 − ᾱ)·score from x_t, which lands on √ᾱ E[x₀ | x_t].`};
  }
  function calculate(p) {
    const m = model(p), sa = N(m.sa, 4), sn = N(m.sn, 4);
    return {
      steps: [
        step('Noise in one jump', Q`x_t=\sqrt{\bar\alpha}\,x_0+\sqrt{1-\bar\alpha}\,\varepsilon=${sa}\cdot(${N(m.x0, 2)})+${sn}\cdot(${N(m.eps, 2)})=${N(m.xt)}`, `With ᾱ = ${N(m.abar, 2)} the signal keeps a factor ${sa} and the noise gets ${sn}; the two squares add to 1, so unit-variance data keep unit variance.`),
        step('Undo it with the true noise', Q`\hat x_0=\frac{x_t-\sqrt{1-\bar\alpha}\,\varepsilon}{\sqrt{\bar\alpha}}=\frac{${N(m.xt)}-${sn}\cdot(${N(m.eps, 2)})}{${sa}}=${N(m.x0hat)}`, 'If the network predicted the noise perfectly, this formula would give the clean value back exactly.'),
        step('The best guess when the noise is unknown', Q`\mathbb E[x_0\mid x_t]=\frac{\sqrt{\bar\alpha}\,s^2}{\bar\alpha s^2+1-\bar\alpha}\,x_t=${N(m.Ex0)},\qquad \mathbb E[\varepsilon\mid x_t]=\frac{\sqrt{1-\bar\alpha}}{\bar\alpha s^2+1-\bar\alpha}\,x_t=${N(m.Eeps)}`, `For data x₀ ~ N(0, ${N(m.s * m.s, 2)}), Gaussian conditioning (Lesson 60) gives these exactly. A network trained with ‖ε − ε_θ‖² can at best output E[ε | x_t] = ${N(m.Eeps)}, not the true ε = ${N(m.eps, 2)}; its denoised value is the posterior mean, with posterior variance ${N(m.postVar)}.`),
        step('The same thing as a score (Tweedie)', Q`\nabla\ln p_t(x_t)=-\frac{x_t}{${N(m.v, 4)}}=${N(m.score)}=-\frac{\mathbb E[\varepsilon\mid x_t]}{\sqrt{1-\bar\alpha}},\qquad \frac{x_t+(1-\bar\alpha)\nabla\ln p_t}{\sqrt{\bar\alpha}}=${N((m.xt + (1 - m.abar) * m.score) / m.sa)}`, 'The noisy data have density N(0, ᾱs² + 1 − ᾱ); its log-gradient, the score, points back towards the data. Predicting noise and estimating the score are the same task, and one step along the score recovers the posterior mean.'),
      ],
      values: [['Noisy value x_t', m.xt], ['Recovered x0 with the true noise', m.x0hat], ['Best estimate E[x0|x_t]', m.Ex0], ['Best noise estimate E[eps|x_t]', m.Eeps], ['Score', m.score]],
      note: 'Lower ᾱ towards 0.04: x_t becomes mostly noise, and the best estimate E[x₀ | x_t] falls towards the data mean 0 however large x₀ was. Raise it to 0.96 and the estimate approaches x₀. Make the data spread s small: the denoiser then trusts the prior and pulls every x_t towards 0.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 4) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.map(x => dec(x)).join(', ')})`;
  const SQ = [[.04, .2], [.09, .3], [.16, .4], [.25, .5], [.36, .6], [.49, .7], [.64, .8], [.81, .9]];   // ᾱ with a tidy square root
  const practice = [
    {key: 'alpha-bar', skill: 'Compose noise steps into ᾱ and the SNR', make(r) {
      const b = Array.from({length: 3}, () => r.int(1, 6) * .05), ab = b.reduce((t, v) => t * (1 - v), 1);
      return {prompt: Q`A diffusion schedule starts with \(\beta_1=${dec(b[0])}\), \(\beta_2=${dec(b[1])}\), \(\beta_3=${dec(b[2])}\). Compute \(\bar\alpha_3=\prod_{s\le3}(1-\beta_s)\) and the signal-to-noise ratio \(\bar\alpha_3/(1-\bar\alpha_3)\).`,
        answers: [{label: Q`\(\bar\alpha_3\)`, value: ab, tol: .001}, {label: 'SNR', value: ab / (1 - ab), tol: .01}],
        hint: Q`Multiply \(1-\beta\) for the three steps. The noise variance at step 3 is \(1-\bar\alpha_3\).`,
        solution: Q`\(\bar\alpha_3=${b.map(v => dec(1 - v)).join('\\cdot')}=${dec(ab)}\). The noise variance is \(1-${dec(ab)}=${dec(1 - ab)}\), so SNR \(=${dec(ab)}/${dec(1 - ab)}=${dec(ab / (1 - ab))}\). Then \(x_3=${dec(Math.sqrt(ab))}\,x_0+${dec(Math.sqrt(1 - ab))}\,\varepsilon\) in one jump.`};
    }},
    {key: 'forward-noise', skill: 'Noise a value and estimate it back', make(r) {
      const [ab, sa] = r.pick(SQ), sn = Math.sqrt(1 - ab), x0 = r.int(-6, 6) / 2, eps = r.nonzero(-4, 4) / 4, xt = sa * x0 + sn * eps;
      let eh; do { eh = r.int(-8, 8) / 8; } while (Math.abs(eh - eps) < 1e-9);
      const est = (xt - sn * eh) / sa;
      return {prompt: Q`With \(\bar\alpha=${ab}\), noise \(x_0=${x0}\) with \(\varepsilon=${eps}\). A network then sees \(x_t\) and predicts the noise \(\hat\varepsilon=${eh}\). What are \(x_t\) and the network's estimate \(\hat x_0\)?`,
        answers: [{label: Q`\(x_t\)`, value: xt, tol: .002}, {label: Q`\(\hat x_0\)`, value: est, tol: .01}],
        hint: Q`\(\sqrt{${ab}}=${sa}\) and \(\sqrt{1-${ab}}=${dec(sn)}\). Then \(\hat x_0=(x_t-\sqrt{1-\bar\alpha}\,\hat\varepsilon)/\sqrt{\bar\alpha}\).`,
        solution: Q`\(x_t=${sa}\cdot(${x0})+${dec(sn)}\cdot(${eps})=${dec(xt)}\). \(\hat x_0=(${dec(xt)}-${dec(sn)}\cdot(${eh}))/${sa}=${dec(est)}\). The error in \(\hat x_0\) is \(\sqrt{1-\bar\alpha}/\sqrt{\bar\alpha}\) times the error in the predicted noise: \(${dec(sn / sa)}\cdot(${dec(eps - eh)})=${dec(est - x0)}\).`};
    }},
    {key: 'gaussian-denoiser', skill: 'Compute the optimal denoiser for Gaussian data', make(r) {
      const s2 = r.pick([1, 4, .25]), ab = r.pick([.2, .36, .5, .64, .8]), xt = r.nonzero(-6, 6) / 2, v = ab * s2 + 1 - ab;
      const ex = Math.sqrt(ab) * s2 * xt / v, ee = Math.sqrt(1 - ab) * xt / v;
      return {prompt: Q`Data are \(x_0\sim\mathcal N(0,${s2})\). At \(\bar\alpha=${ab}\) a noisy value \(x_t=${xt}\) is observed. Compute the optimal denoiser output \(\mathbb E[x_0\mid x_t]\), the optimal noise prediction \(\mathbb E[\varepsilon\mid x_t]\) and the score \(-x_t/\operatorname{Var}(x_t)\).`,
        answers: [{label: Q`\(\mathbb E[x_0\mid x_t]\)`, value: ex, tol: .006}, {label: Q`\(\mathbb E[\varepsilon\mid x_t]\)`, value: ee, tol: .006}, {label: 'Score', value: -xt / v, tol: .006}],
        hint: Q`\(\operatorname{Var}(x_t)=\bar\alpha s^2+1-\bar\alpha\). Then \(\mathbb E[x_0\mid x_t]=\sqrt{\bar\alpha}\,s^2x_t/\operatorname{Var}(x_t)\) and \(\mathbb E[\varepsilon\mid x_t]=\sqrt{1-\bar\alpha}\,x_t/\operatorname{Var}(x_t)\).`,
        solution: Q`\(\operatorname{Var}(x_t)=${ab}\cdot${s2}+${dec(1 - ab)}=${dec(v)}\). \(\mathbb E[x_0\mid x_t]=${dec(Math.sqrt(ab))}\cdot${s2}\cdot(${xt})/${dec(v)}=${dec(ex)}\) and \(\mathbb E[\varepsilon\mid x_t]=${dec(Math.sqrt(1 - ab))}\cdot(${xt})/${dec(v)}=${dec(ee)}\). Score \(=-(${xt})/${dec(v)}=${dec(-xt / v)}\), which equals \(-\mathbb E[\varepsilon\mid x_t]/\sqrt{1-\bar\alpha}\).`};
    }},
    {key: 'ddim-step', skill: 'Take one DDIM sampling step', make(r) {
      let i, j; do { i = r.int(0, 6); j = r.int(1, 7); } while (j <= i);
      const [at, sat] = SQ[i], [ap, sap] = SQ[j], xt = r.int(-8, 8) / 4, eh = r.int(-8, 8) / 8, snt = Math.sqrt(1 - at), snp = Math.sqrt(1 - ap);
      const x0 = (xt - snt * eh) / sat, xp = sap * x0 + snp * eh;
      return {prompt: Q`Take one DDIM step from \(\bar\alpha_t=${at}\) to \(\bar\alpha_{t-1}=${ap}\). The current sample is \(x_t=${xt}\) and the network predicts the noise \(\hat\varepsilon=${eh}\). Compute \(\hat x_0\) and \(x_{t-1}\).`,
        answers: [{label: Q`\(\hat x_0\)`, value: x0, tol: .01}, {label: Q`\(x_{t-1}\)`, value: xp, tol: .01}],
        hint: Q`\(\hat x_0=(x_t-\sqrt{1-\bar\alpha_t}\,\hat\varepsilon)/\sqrt{\bar\alpha_t}\), then \(x_{t-1}=\sqrt{\bar\alpha_{t-1}}\,\hat x_0+\sqrt{1-\bar\alpha_{t-1}}\,\hat\varepsilon\).`,
        solution: Q`\(\hat x_0=(${xt}-${dec(snt)}\cdot(${eh}))/${sat}=${dec(x0)}\). \(x_{t-1}=${sap}\cdot(${dec(x0)})+${dec(snp)}\cdot(${eh})=${dec(xp)}\). No fresh noise is added: the step re-noises the clean estimate to the lower noise level along the same predicted direction.`};
    }},
    {key: 'cfg', skill: 'Combine predictions with classifier-free guidance', make(r) {
      const e0 = [r.int(-5, 5) / 10, r.int(-5, 5) / 10], ec = [r.int(-5, 5) / 10, r.int(-5, 5) / 10], w = r.pick([0, 1, 2, 3, 5, 7.5]);
      if (ec.every((v, k) => v === e0[k])) ec[0] += .3;
      const g = e0.map((v, k) => v + w * (ec[k] - v));
      return {prompt: Q`An unconditional prediction \(\varepsilon_\varnothing=${tup(e0)}\) and a conditional prediction \(\varepsilon_c=${tup(ec)}\) are combined with guidance weight w = ${w}. Compute the guided noise \(\tilde\varepsilon\).`,
        answers: [{label: Q`\(\tilde\varepsilon\)`, vector: g, tol: .001}],
        hint: Q`\(\tilde\varepsilon=\varepsilon_\varnothing+w(\varepsilon_c-\varepsilon_\varnothing)\), one coordinate at a time.`,
        solution: Q`\(\varepsilon_c-\varepsilon_\varnothing=${tup(ec.map((v, k) => v - e0[k]))}\), so \(\tilde\varepsilon=${tup(e0)}+${w}\cdot${tup(ec.map((v, k) => v - e0[k]))}=${tup(g)}\). ${w === 0 ? 'w = 0 ignores the condition.' : w === 1 ? 'w = 1 is the plain conditional prediction.' : 'w > 1 extrapolates past the conditional prediction, trading diversity for fidelity to the condition.'}`};
    }},
    {key: 'two-point-denoiser', skill: 'Denoise data that take only two values', make(r) {
      const a = r.pick([.5, 1, 2]), [ab, sa] = r.pick(SQ.slice(2)), xt = r.nonzero(-6, 6) / 4, k = a * sa / (1 - ab), val = a * Math.tanh(k * xt);
      return {prompt: Q`Training data are \(x_0=+${a}\) or \(-${a}\) with equal probability. At \(\bar\alpha=${ab}\) the optimal denoiser is \(\mathbb E[x_0\mid x_t]=${a}\tanh\bigl(${a}\sqrt{\bar\alpha}\,x_t/(1-\bar\alpha)\bigr)\). Evaluate it at \(x_t=${xt}\).`,
        answers: [{label: Q`\(\mathbb E[x_0\mid x_t]\)`, value: val, tol: .006}],
        hint: Q`The coefficient is \(${a}\cdot${sa}/${dec(1 - ab)}\). Multiply by \(x_t\), take tanh, then multiply by ${a}.`,
        solution: Q`Coefficient \(${a}\cdot${sa}/${dec(1 - ab)}=${dec(k)}\), so \(\mathbb E[x_0\mid x_t]=${a}\tanh(${dec(k)}\cdot(${xt}))=${a}\tanh(${dec(k * xt)})=${dec(val)}\). It lies between \(-${a}\) and ${a}: a soft choice between the two training values, weighted by how likely each is to have produced \(x_t\).`};
    }},
  ];

  /* ---------- Lab helpers: exact denoising of a 2-D point cloud ---------- */
  const T_STEPS = 1000, R = 1.75, M = 200, TRAIL = 20;
  const SCHED = (() => { const ab = new Float64Array(T_STEPS); let a = 1; for (let t = 0; t < T_STEPS; t++) { a *= 1 - (1e-4 + (.02 - 1e-4) * t / (T_STEPS - 1)); ab[t] = a; } return ab; })();   // SCHED[t − 1] = ᾱ_t
  // E[x₀ | x_t] when the data are the points P (flat [x, y, ...]) blurred by N(0, h²I): a softmax over the points.
  function denoise(x, y, ab, P, h2) {
    const sa = Math.sqrt(ab), v = Math.max(1e-9, ab * h2 + 1 - ab), k = sa * h2 / v, n = P.length / 2;
    let mx = -Infinity;
    const lw = new Float64Array(n);
    for (let j = 0; j < n; j++) { const dx = x - sa * P[2 * j], dy = y - sa * P[2 * j + 1]; lw[j] = -(dx * dx + dy * dy) / (2 * v); if (lw[j] > mx) mx = lw[j]; }
    let s = 0, ex = 0, ey = 0, top = 0;
    for (let j = 0; j < n; j++) { const w = Math.exp(lw[j] - mx); s += w; if (w > top) top = w; ex += w * (P[2 * j] + k * (x - sa * P[2 * j])); ey += w * (P[2 * j + 1] + k * (y - sa * P[2 * j + 1])); }
    return {x: ex / s, y: ey / s, top: top / s};
  }
  function epsHat(x, y, ab, P, h2) { const d = denoise(x, y, ab, P, h2), sa = Math.sqrt(ab), sn = Math.sqrt(1 - ab); return [(x - sa * d.x) / sn, (y - sa * d.y) / sn]; }
  function guidedEps(x, y, ab, s, data) {
    const h2 = s.h * s.h;
    if (s.data !== 'both') return epsHat(x, y, ab, data.photo, h2);
    const eu = epsHat(x, y, ab, data.both, h2);
    if (!s.w) return eu;
    const ec = epsHat(x, y, ab, s.target === 'ring' ? data.ring : data.photo, h2);
    return [eu[0] + s.w * (ec[0] - eu[0]), eu[1] + s.w * (ec[1] - eu[1])];
  }
  // DDIM (η = 0) or DDPM-like (η = 1) sampling with S network evaluations, from ᾱ_1000 down to a clean estimate.
  function sample(s, data) {
    const S = s.steps, eta = s.sampler === 'ddpm' ? 1 : 0, g = window.CV_VISION.rng(500 + s.seed);
    // Evenly spaced steps from t = 1000 down to t = 1, as in DDIM; the last evaluation is at almost no noise.
    const taus = Array.from({length: S}, (_, i) => Math.round((T_STEPS - 1) * (S - 1 - i) / (S - 1)));
    const X = new Float64Array(2 * M);
    for (let i = 0; i < 2 * M; i++) X[i] = g.gauss();
    const trails = Array.from({length: TRAIL}, (_, i) => [[X[2 * i], X[2 * i + 1]]]);
    for (let i = 0; i < S; i++) {
      const at = SCHED[taus[i]], ap = i + 1 < S ? SCHED[taus[i + 1]] : 1, sat = Math.sqrt(at), snt = Math.sqrt(1 - at);
      const sig = eta * Math.sqrt((1 - ap) / (1 - at)) * Math.sqrt(Math.max(0, 1 - at / ap)), dirScale = Math.sqrt(Math.max(0, 1 - ap - sig * sig));
      for (let k = 0; k < M; k++) {
        const x = X[2 * k], y = X[2 * k + 1], [ex, ey] = guidedEps(x, y, at, s, data);
        const hx = (x - snt * ex) / sat, hy = (y - snt * ey) / sat;
        X[2 * k] = Math.sqrt(ap) * hx + dirScale * ex + sig * g.gauss();
        X[2 * k + 1] = Math.sqrt(ap) * hy + dirScale * ey + sig * g.gauss();
        if (k < TRAIL) trails[k].push([X[2 * k], X[2 * k + 1]]);
      }
    }
    return {X, trails, taus};
  }
  const nearest = (x, y, P) => { let b = Infinity; for (let j = 0; j < P.length / 2; j++) { const d = (x - P[2 * j]) ** 2 + (y - P[2 * j + 1]) ** 2; if (d < b) b = d; } return Math.sqrt(b); };

  const lab = {
    name: 'diffusion', title: 'Diffusion with an exact denoiser', photo: 'camera',
    heading: 'Noise the points. Then sample new ones.',
    intro: 'The data are 300 points on the strongest edges of the camera photo, scaled to the square from −1 to 1. No network is trained: the denoiser E[x₀ | x_t] is computed exactly for these points (optionally blurred by a Gaussian of width h), as a softmax over the training points. The schedule is DDPM’s: 1000 steps, β from 0.0001 to 0.02.',
    defaults: {view: 'forward', abar: .9, sampler: 'ddim', steps: 20, h: 0, data: 'photo', target: 'ring', w: 0, seed: 1},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('view', 'Show', [['forward', 'Forward: noise the data, draw the denoiser'], ['sample', 'Reverse: sample new points']], s.view) +
        `<div data-show-when="view:forward">${range('abar', 'Signal fraction ᾱ', .01, 1, .01, s.abar)}</div>` +
        `<div data-show-when="view:sample">${select('sampler', 'Sampler', [['ddim', 'DDIM: deterministic (η = 0)'], ['ddpm', 'DDPM: fresh noise each step (η = 1)']], s.sampler)}${select('steps', 'Network evaluations', [5, 10, 20, 50, 100].map(v => [v, `${v} steps`]), s.steps)}</div>` +
        range('h', 'Smooth the data: width h', 0, .1, .01, s.h) +
        select('data', 'Training data', [['photo', 'Photo edges only'], ['both', 'Photo edges + a ring (two classes)']], s.data) +
        `<div data-show-when="data:both">${select('target', 'Guide towards', [['ring', 'the ring'], ['photo', 'the photo edges']], s.target)}${range('w', 'Guidance weight w (0 = unconditional)', 0, 6, .5, s.w)}</div>` +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="seed">New noise ↻</button></div>' +
        '<div class="math-rule">x̂₀ = (x_t − √(1−ᾱ_t) ε̂)/√ᾱ_t;  x_{t−1} = √ᾱ_{t−1} x̂₀ + √(1−ᾱ_{t−1}−σ²) ε̂ + σz</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `${figure('df-plot', 'Grey: training points over the faint photo (green: the ring class). Forward view: blue noisy points with orange arrows to the exact denoiser output E[x₀ | x_t]. Reverse view: orange samples, with the paths of 20 of them.')}<div id="df-sched"></div>`;
    },
    note: 'Predict first, in the forward view: at ᾱ = 0.9 do the arrows point back to the exact training point each noisy point came from? Rarely: the denoiser returns an average of all the training points that could have produced the noisy one, so the arrows end on or between nearby edges. Lower ᾱ and the arrows all converge on the middle of the cloud. In the reverse view with h = 0, almost every sample lands on a training point (memorisation): the exact denoiser of a finite training set can only reproduce it. Raise h to about 0.03 and the samples fall near the edges but not on old points, as new data would; a trained network’s smoothness plays this role. Cut the steps to 5 or 2: each big step trusts a blurry, averaged x̂₀, so the samples bunch up near the middle and reuse a few training points. Then choose two classes, guide towards the ring and raise w from 0 to 1 and 3.',
    async setup() {
      const V = window.CV_VISION, img = await V.load('camera'), {w, h} = img, g = V.blur(img.gray, w, h, 1.5), mag = new Float32Array(w * h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const gx = g[y * w + x + 1] - g[y * w + x - 1], gy = g[(y + 1) * w + x] - g[(y - 1) * w + x]; mag[y * w + x] = Math.hypot(gx, gy); }
      const sorted = Float32Array.from(mag).sort(), thr = sorted[Math.floor(.92 * sorted.length)];
      const idx = []; for (let i = 0; i < w * h; i++) if (mag[i] > thr) idx.push(i);
      const r = V.rng(7);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const photo = new Float64Array(600);
      idx.slice(0, 300).forEach((i, k) => { photo[2 * k] = (i % w + .5) / (w / 2) - 1; photo[2 * k + 1] = 1 - (Math.floor(i / w) + .5) / (h / 2); });
      const ring = new Float64Array(240);
      for (let k = 0; k < 120; k++) { const a = 2 * Math.PI * k / 120; ring[2 * k] = .55 + .3 * Math.cos(a); ring[2 * k + 1] = .55 + .3 * Math.sin(a); }
      const both = new Float64Array(840); both.set(photo); both.set(ring, 600);
      // Fixed noise for the forward view, one ε per training point.
      const fg = V.rng(11), noise = Float64Array.from({length: 840}, () => fg.gauss());
      return {img, photo, ring, both, noise, cache: new Map()};
    },
    render(s, root, data) {
      const V = window.CV_VISION, canvas = root.querySelector('#df-plot'), S0 = 420, P = s.data === 'both' ? data.both : data.photo, n = P.length / 2;
      canvas.width = S0; canvas.height = S0;
      const ctx = canvas.getContext('2d'), X = v => (v + R) / (2 * R) * S0, Y = v => (R - v) / (2 * R) * S0, h2 = s.h * s.h;
      ctx.fillStyle = '#fbfaf5'; ctx.fillRect(0, 0, S0, S0);
      if (data.img.img) { ctx.globalAlpha = .2; ctx.drawImage(data.img.img, X(-1), Y(1), X(1) - X(-1), Y(-1) - Y(1)); ctx.globalAlpha = 1; }
      ctx.strokeStyle = '#d5d9cf'; ctx.lineWidth = 1; ctx.strokeRect(X(-1), Y(1), X(1) - X(-1), Y(-1) - Y(1));
      const dot = (x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, 2 * Math.PI); ctx.fill(); };
      for (let j = 0; j < n; j++) dot(P[2 * j], P[2 * j + 1], 1.6, j >= 300 ? '#2f8a53' : '#5f6b63');
      const sched = Array.from({length: 101}, (_, i) => [i * 10, SCHED[Math.max(0, i * 10 - 1)]]);
      if (s.view === 'forward') {
        const ab = s.abar, sa = Math.sqrt(ab), sn = Math.sqrt(1 - ab);
        let err = 0, errNaive = 0, top = 0, own = 0;
        for (let j = 0; j < n; j++) {
          const xt = sa * P[2 * j] + sn * data.noise[2 * j], yt = sa * P[2 * j + 1] + sn * data.noise[2 * j + 1], d = denoise(xt, yt, ab, P, h2);
          err += Math.hypot(d.x - P[2 * j], d.y - P[2 * j + 1]); errNaive += Math.hypot(xt / sa - P[2 * j], yt / sa - P[2 * j + 1]); top += d.top;
          if (j % 4 === 0) {
            ctx.strokeStyle = 'rgba(189,67,28,.75)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(X(xt), Y(yt)); ctx.lineTo(X(d.x), Y(d.y)); ctx.stroke();
            dot(d.x, d.y, 1.8, '#bd431c');
          }
          dot(xt, yt, 2, '#315c86');
          if (Math.hypot(d.x - P[2 * j], d.y - P[2 * j + 1]) < 1e-3) own++;
        }
        const tNear = sched.reduce((b, p) => Math.abs(p[1] - ab) < Math.abs(b[1] - ab) ? p : b, sched[0])[0];
        root.querySelector('#df-sched').innerHTML = window.CV_VISION_LABS.svgPlot({x: [0, T_STEPS], y: [0, 1], lines: [{points: sched}], marker: tNear, label: 'DDPM noise schedule: the signal fraction ᾱ_t against the step t', xLabel: 'diffusion step t', yLabel: 'ᾱ_t', xTicks: [0, 250, 500, 750, 1000], yTicks: [0, .5, 1]});
        return V.report([
          ['ᾱ, √ᾱ, √(1 − ᾱ)', `${V.fmt(ab, 2)}, ${V.fmt(sa, 3)}, ${V.fmt(sn, 3)}`], ['Signal-to-noise ratio', V.fmt(ab / Math.max(1e-9, 1 - ab), 3)], ['Nearest step of the schedule', `t ≈ ${tNear}`],
          ['Mean error of E[x₀ | x_t]', V.fmt(err / n, 3)], ['Mean error of just x_t / √ᾱ', V.fmt(errNaive / n, 3)],
          ['Denoiser’s weight on its top point', `${V.fmt(top / n, 3)} on average${own ? `; ${own} of ${n} land on their own point` : ''}`],
        ]);
      }
      const key = JSON.stringify([s.sampler, s.steps, s.h, s.data, s.target, s.w, s.seed]);
      if (!data.cache.has(key)) { if (data.cache.size > 24) data.cache.clear(); data.cache.set(key, sample(s, data)); }
      const out = data.cache.get(key);
      out.trails.forEach(tr => { ctx.strokeStyle = 'rgba(232,116,59,.45)'; ctx.lineWidth = 1; ctx.beginPath(); tr.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.stroke(); });
      let mem = 0, dsum = 0, onTarget = 0, spread = 0, dataSpread = 0;
      const hits = new Set(), targetP = s.target === 'ring' ? data.ring : data.photo, otherP = s.target === 'ring' ? data.photo : data.ring;
      for (let j = 0; j < n; j++) dataSpread += Math.hypot(P[2 * j], P[2 * j + 1]) / n;
      for (let k = 0; k < M; k++) {
        const x = out.X[2 * k], y = out.X[2 * k + 1];
        let d = Infinity, jn = -1;
        for (let j = 0; j < n; j++) { const e = Math.hypot(x - P[2 * j], y - P[2 * j + 1]); if (e < d) { d = e; jn = j; } }
        dsum += d; spread += Math.hypot(x, y) / M;
        if (d < .01) { mem++; hits.add(jn); }
        if (s.data === 'both' && nearest(x, y, targetP) < nearest(x, y, otherP)) onTarget++;
        dot(x, y, 2.3, '#e8743b');
      }
      root.querySelector('#df-sched').innerHTML = window.CV_VISION_LABS.svgPlot({x: [0, T_STEPS], y: [0, 1], lines: [{points: sched}], dots: out.taus.map(t => [t + 1, SCHED[t]]), label: 'The schedule with the steps the sampler evaluates', xLabel: 'diffusion step t (dots: steps used)', yLabel: 'ᾱ_t', xTicks: [0, 250, 500, 750, 1000], yTicks: [0, .5, 1]});
      return V.report([
        ['Sampler', `${s.sampler === 'ddpm' ? 'DDPM-like (η = 1)' : 'DDIM (η = 0)'}, ${s.steps} steps`],
        ['Samples on a training point (within 0.01, about a pixel)', `${mem} of ${M} (${V.fmt(100 * mem / M, 1)}%), ${hits.size} different points`],
        ['Mean distance to the nearest training point', V.fmt(dsum / M, 4)],
        ['Spread: mean distance from the centre', `${V.fmt(spread, 3)} (training data: ${V.fmt(dataSpread, 3)})`],
        ...(s.data === 'both' ? [[`Samples nearer the ${s.target === 'ring' ? 'ring' : 'photo edges'}`, `${onTarget} of ${M} (${V.fmt(100 * onTarget / M, 1)}%)`]] : []),
        ['Data smoothing h', s.h ? V.fmt(s.h, 2) : '0 (exact empirical data)'],
      ]);
    },
    action(name, s) { if (name === 'seed') s.seed++; },
  };

  window.CV_EXTEND.lesson(67, {
    teaching: {
      equation: Q`\begin{gathered}x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon,\qquad \mathcal L=\mathbb E\bigl\|\varepsilon-\varepsilon_\theta(x_t,t)\bigr\|^2,\qquad \nabla\ln p_t(x_t)=-\frac{\mathbb E[\varepsilon\mid x_t]}{\sqrt{1-\bar\alpha_t}}\\ \hat x_0=\frac{x_t-\sqrt{1-\bar\alpha_t}\,\varepsilon_\theta}{\sqrt{\bar\alpha_t}},\qquad x_{t-1}=\sqrt{\bar\alpha_{t-1}}\,\hat x_0+\sqrt{1-\bar\alpha_{t-1}}\,\varepsilon_\theta\end{gathered}`,
      symbols: [['ᾱ_t', 'fraction of signal power left at step t'], ['ε', 'standard Gaussian noise'], ['ε_θ', 'noise-prediction network'], ['x̂₀', 'estimate of the clean image'], ['∇ ln p_t', 'score of the noisy data'], ['w', 'guidance weight']],
      connection: 'DDPM, DDIM, Stable Diffusion and its latent autoencoder, ControlNet, video diffusion and flow-matching models such as SD3 and FLUX all train a network to predict noise (or a velocity) and sample by stepping from noise to data. Diffusion priors also drive depth estimation, super-resolution, inverse problems and text-to-3D.',
      trap: 'Thinking the trained network recovers the exact noise that was added. It sees only x_t, so the best it can do is the average noise E[ε | x_t]; its clean estimate is a blurry posterior mean at high noise, and sampling must refine it over many steps.',
      question: 'A network is trained with E‖ε − ε_θ(x_t, t)‖². What does the best possible network output for a given x_t?',
      choices: ['The average noise E[ε | x_t] over all images that could have produced x_t', 'The exact noise that was added to this image', 'Zero, because the noise has mean zero'], correct: 0,
      explanation: 'A squared-error loss is minimised by the conditional mean of the target. Many (x₀, ε) pairs lead to the same x_t, so the optimum is E[ε | x_t]. That gives the posterior-mean denoiser E[x₀ | x_t] (Tweedie) and, rescaled, the score of the noisy data.',
    },
    guide: {
      title: 'Noise in one jump, learn to predict the noise, then walk it back',
      paragraphs: [
        'The forward process mixes each image with Gaussian noise step by step, but because Gaussians compose, any step can be reached directly: x_t = √ᾱ_t x₀ + √(1 − ᾱ_t) ε. A network is trained to predict the ε that was added; from its prediction, x̂₀ = (x_t − √(1 − ᾱ) ε̂)/√ᾱ estimates the clean image.',
        'Because the network sees only x_t, its best prediction is the average noise E[ε | x_t], which is also a rescaled score: the direction in which the noisy data become more likely. Sampling starts from pure noise and repeatedly denoises and re-noises to a lower level, with fresh noise (DDPM) or without (DDIM); guidance pushes the prediction towards a condition.',
      ],
      example: 'Noise one value, then denoise it with and without knowing the noise',
      controls: [{label: 'Clean value x₀', min: -3, max: 3, step: .5, value: 2}, {label: 'Noise draw ε', min: -2, max: 2, step: .5, value: -1}, {label: 'Signal fraction ᾱ', min: .04, max: .96, step: .04, value: .64}, {label: 'Spread of the data s', min: .5, max: 3, step: .5, value: 2}],
      predict: 'Set ᾱ to 0.04, so x_t is almost pure noise. Will the best estimate E[x₀ | x_t] stay close to x₀ = 2?',
      takeaway: 'With the true noise the clean value comes back exactly; without it, the best a network can do is the posterior mean E[x₀ | x_t], which moves from the data mean towards x₀ as ᾱ grows. The noise prediction, the denoiser and the score are three views of the same quantity.',
      notation: 'x₀ is the clean value and ε ~ N(0, 1) the noise; ᾱ is the share of signal power left, so x_t = √ᾱ x₀ + √(1 − ᾱ) ε. The data are N(0, s²). E[· | x_t] is an average over everything that could have produced the observed x_t, and the score is the derivative of ln p_t at x_t.',
    },
    notation: {
      'ᾱ_t': {tex: Q`\bar\alpha_t`, detail: 'The product (1 − β₁)(1 − β₂)⋯(1 − β_t) of the per-step signal factors. x_t keeps √ᾱ_t of the signal and has noise variance 1 − ᾱ_t; it falls from almost 1 at t = 1 to about 4 × 10⁻⁵ at t = 1000 in DDPM.'},
      'ε': {tex: Q`\varepsilon`, detail: 'Standard Gaussian noise N(0, I), drawn fresh for every training example and step. In training it is the regression target; at sampling time ε_θ stands in for it.'},
      'ε_θ': {tex: Q`\varepsilon_\theta(x_t,t)`, detail: 'The network (usually a U-Net or a transformer) that predicts the noise in x_t, given the step t and optionally a condition c. Its optimum is E[ε | x_t].'},
      'x̂₀': {tex: Q`\hat x_0`, detail: 'The current estimate of the clean image, (x_t − √(1 − ᾱ_t) ε_θ)/√ᾱ_t. With the optimal network it is the posterior mean E[x₀ | x_t], which is blurry at high noise.'},
      '∇ ln p_t': {tex: Q`\nabla\ln p_t`, detail: 'The score: the gradient of the log-density of the noisy data at step t. It points towards higher density and equals −E[ε | x_t]/√(1 − ᾱ_t), so a noise predictor is a score estimator.'},
      w: {tex: 'w', detail: 'The classifier-free guidance weight in ε̃ = ε_∅ + w(ε_c − ε_∅). w = 0 ignores the condition, w = 1 is the conditional model, and w > 1 extrapolates for stronger adherence and less diversity.'},
    },
    calculate, practice, lab,
  });
  window.CV_EXTEND.registry[67].helpers = {model, denoise, epsHat, sample, SCHED, nearest};
})();
