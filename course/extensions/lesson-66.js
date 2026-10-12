/* Lesson 66: latent-variable models, from EM to the variational autoencoder. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Math.abs(x) < 10 ** -d ? x.toExponential(2) : Number(x.toFixed(d)).toString();
  // TeX number: scientific notation for very small magnitudes.
  const T = (x, d = 3) => {
    if (Math.abs(x) < 1e-12) return '0';
    if (Math.abs(x) < 10 ** -d) { const [m, e] = x.toExponential(2).split('e'); return Q`${m}\times10^{${Number(e)}}`; }
    return Number(x.toFixed(d)).toString();
  };
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const LN2PI = Math.log(2 * Math.PI);
  const logN1 = (x, m, s) => -((x - m) ** 2) / (2 * s * s) - Math.log(s) - .5 * LN2PI;
  const lse2 = (a, b) => { const m = Math.max(a, b); return m + Math.log(Math.exp(a - m) + Math.exp(b - m)); };

  /* ---------- Worked example: responsibilities and the bound of a hard assignment ---------- */
  function model(p) {
    const [x, mu2, sigma, pi1] = p, pi2 = 1 - pi1, mu1 = 0;
    const g1 = logN1(x, mu1, sigma), g2 = logN1(x, mu2, sigma), l1 = Math.log(pi1) + g1, l2 = Math.log(pi2) + g2, lp = lse2(l1, l2);
    const r1 = Math.exp(l1 - lp), r2 = Math.exp(l2 - lp), k = r1 >= r2 ? 1 : 2, bound = k === 1 ? l1 : l2;
    return {x, mu1, mu2, sigma, pi1, pi2, n1: Math.exp(g1), n2: Math.exp(g2), l1, l2, lp, r1, r2, k, bound, gap: lp - bound};
  }
  function drawing(m) {
    const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', weight = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}>${E(s)}</text>`;
    const x0 = -3, x1 = 9, L = 40, R = 300, Tp = 36, B = 206;
    const f1 = x => m.pi1 * Math.exp(logN1(x, m.mu1, m.sigma)), f2 = x => m.pi2 * Math.exp(logN1(x, m.mu2, m.sigma));
    const ymax = 1.1 * Math.max(...Array.from({length: 121}, (_, i) => f1(x0 + i * .1) + f2(x0 + i * .1)));
    const X = v => L + (v - x0) / (x1 - x0) * (R - L), Y = v => B - v / ymax * (B - Tp);
    const path = f => Array.from({length: 241}, (_, i) => x0 + i * .05).map((v, i) => `${i ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(f(v)).toFixed(1)}`).join('');
    let body = txt(20, 20, 'Weighted components and the mixture p(x)', '#172623', 13);
    body += `<path d="M${L} ${B}H${R}M${L} ${B}V${Tp}" stroke="#a8b6a5"/>`;
    for (let v = -2; v <= 8; v += 2) body += txt(X(v), B + 15, String(v), '#64736b', 10, 'middle');
    body += `<path d="${path(f1)}" fill="none" stroke="#34734e" stroke-width="2"/><path d="${path(f2)}" fill="none" stroke="#bd431c" stroke-width="2"/><path d="${path(v => f1(v) + f2(v))}" fill="none" stroke="#172623" stroke-width="1.6" stroke-dasharray="5 3"/>`;
    body += `<path d="M${X(m.x).toFixed(1)} ${Tp}V${B}" stroke="#315c86" stroke-width="1.5"/><circle cx="${X(m.x).toFixed(1)}" cy="${Y(f1(m.x)).toFixed(1)}" r="4" fill="#34734e"/><circle cx="${X(m.x).toFixed(1)}" cy="${Y(f2(m.x)).toFixed(1)}" r="4" fill="#bd431c"/>`;
    body += txt(L + 4, B + 32, 'green π₁N(x; 0, σ²) · orange π₂N(x; μ₂, σ²) · dashes p(x)', '#64736b', 10.5);
    // Right: responsibilities as one split bar, then the log-likelihood and the bound of a hard assignment.
    const bx = 340, bw = 190;
    body += txt(bx, 20, 'Responsibilities at x = ' + N(m.x, 2), '#172623', 13);
    body += `<rect x="${bx}" y="32" width="${(bw * m.r1).toFixed(1)}" height="22" fill="#34734e"/><rect x="${(bx + bw * m.r1).toFixed(1)}" y="32" width="${(bw * m.r2).toFixed(1)}" height="22" fill="#bd431c"/>`;
    body += txt(bx, 70, `r₁ = ${N(m.r1)}`, '#34734e', 12, 'start', '700') + txt(bx + bw, 70, `r₂ = ${N(m.r2)}`, '#bd431c', 12, 'end', '700');
    body += txt(bx, 104, 'ln p(x) and a hard-assignment bound', '#172623', 13);
    const lo = Math.min(m.lp, m.bound), scale = bw / Math.max(1, -lo * 1.05), bar = (y, v, color, label) => `<rect x="${(bx + bw - scale * -Math.min(0, v)).toFixed(1)}" y="${y}" width="${(scale * -Math.min(0, v)).toFixed(1)}" height="18" fill="${color}"/>` + txt(bx, y + 33, label, color, 11.5);
    body += bar(116, m.lp, '#315c86', `ln p(x) = ${N(m.lp)}`) + bar(162, m.bound, '#a06a00', `bound with q = one-hot on ${m.k}: ${N(m.bound)}`);
    body += txt(bx, 232, `gap = KL(q ‖ r) = −ln r${m.k === 1 ? '₁' : '₂'} = ${N(m.gap)}`, '#172623', 12, 'start', '600');
    return {body, caption: `Left: the two weighted Gaussians and their sum p(x); the blue line marks x = ${N(m.x, 2)}. Right: the responsibilities (they sum to 1), and the log-likelihood (blue) against the bound from a hard k-means-style assignment (gold). Bars grow leftwards from 0 because both numbers are negative; the hard bound is always the lower one, by −ln of the winning responsibility.`};
  }
  function calculate(p) {
    const m = model(p);
    return {
      steps: [
        step('Evaluate each component at x', Q`\mathcal N(${N(m.x, 2)};0,${N(m.sigma, 2)}^2)=${T(m.n1, 4)},\qquad \mathcal N(${N(m.x, 2)};${N(m.mu2, 2)},${N(m.sigma, 2)}^2)=${T(m.n2, 4)}`, 'Each density is e^(−(x − μ)²/2σ²)/(σ√(2π)). The component whose mean is nearer x has the larger density.'),
        step('Weight and normalise: the responsibilities', Q`r_k=\frac{\pi_k\mathcal N_k}{\sum_j\pi_j\mathcal N_j}:\qquad r_1=\frac{${N(m.pi1, 2)}\cdot${T(m.n1, 4)}}{${N(m.pi1, 2)}\cdot${T(m.n1, 4)}+${N(m.pi2, 2)}\cdot${T(m.n2, 4)}}=${N(m.r1)},\quad r_2=${N(m.r2)}`, 'This is Bayes’ theorem: the prior weights π are multiplied by the likelihoods and rescaled to sum to 1. It is the E-step for this one point.'),
        step('Log-likelihood of the point', Q`\ln p(x)=\ln\bigl(\pi_1\mathcal N_1+\pi_2\mathcal N_2\bigr)=${N(m.lp)}`, 'EM maximises the sum of these over all points. The logarithm of a sum is what makes direct maximisation awkward.'),
        step('The bound from a hard assignment', Q`q=(${m.k === 1 ? '1,0' : '0,1'}):\quad \mathcal L(q)=\ln(\pi_${m.k}\mathcal N_${m.k})=${N(m.bound)}=\ln p(x)-\mathrm{KL}(q\,\|\,r)`, `With q equal to the responsibilities the bound would equal ln p(x) exactly. Rounding q to a one-hot assignment, as k-means does, loses KL(q ‖ r) = −ln r${m.k} = ${N(m.gap)} nats.`),
      ],
      values: [['Responsibility r1', m.r1], ['Responsibility r2', m.r2], ['Log-likelihood ln p(x)', m.lp], ['Hard-assignment bound', m.bound], ['Gap KL(q||r)', m.gap]],
      note: 'Put x halfway between the means with π₁ = 0.5: the responsibilities are 0.5 each and the hard assignment loses ln 2 = 0.693. Move x towards a mean, or shrink σ, and the responsibilities approach 0 and 1: soft EM turns into k-means.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 4) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.join(', ')})`;
  const sig = x => Math.abs(x) < 1e-4 ? T(x, 4) : String(Number(x.toPrecision(4)));
  const practice = [
    {key: 'responsibility', skill: 'Compute mixture responsibilities and a log-likelihood', make(r) {
      const s = r.pick([1, 2]), m1 = r.int(-2, 1), m2 = m1 + r.int(2, 4) * s, p1 = r.pick([.2, .3, .4, .5, .6, .7, .8]);
      const x = r.int(2 * (m1 - 1), 2 * (m2 + 1)) / 2;
      const g1 = logN1(x, m1, s), g2 = logN1(x, m2, s), l1 = Math.log(p1) + g1, l2 = Math.log(1 - p1) + g2, lp = lse2(l1, l2), r1 = Math.exp(l1 - lp);
      return {prompt: Q`A 1-D mixture has weights \(\pi=(${p1},\ ${dec(1 - p1, 2)})\), means ${m1} and ${m2}, and the same standard deviation \(\sigma=${s}\). Compute the responsibility \(r_1\) of the first component for x = ${x}, and the log-likelihood \(\ln p(x)\).`,
        answers: [{label: Q`\(r_1\)`, value: r1, tol: .006}, {label: Q`\(\ln p(x)\)`, value: lp, tol: .01}],
        hint: Q`\(\mathcal N(x;\mu,\sigma^2)=e^{-(x-\mu)^2/2\sigma^2}/(\sigma\sqrt{2\pi})\). Multiply each by its weight, add, and divide.`,
        solution: Q`\(\mathcal N(${x};${m1},${s}^2)=${sig(Math.exp(g1))}\) and \(\mathcal N(${x};${m2},${s}^2)=${sig(Math.exp(g2))}\). Weighted: \(${p1}\cdot${sig(Math.exp(g1))}=${sig(Math.exp(l1))}\) and \(${dec(1 - p1, 2)}\cdot${sig(Math.exp(g2))}=${sig(Math.exp(l2))}\), which sum to \(p(x)=${sig(Math.exp(lp))}\). So \(r_1=${dec(r1)}\), \(r_2=${dec(1 - r1)}\) and \(\ln p(x)=${dec(lp)}\).`};
    }},
    {key: 'm-step', skill: 'Carry out one M-step for a mixture component', make(r) {
      let xs, rs;
      do { xs = r.distinct(4, 0, 8).sort((a, b) => a - b); rs = Array.from({length: 4}, () => r.int(0, 10) / 10); } while (rs.reduce((t, v) => t + v, 0) < .5);
      const Nk = rs.reduce((t, v) => t + v, 0), mu = rs.reduce((t, v, i) => t + v * xs[i], 0) / Nk, va = rs.reduce((t, v, i) => t + v * (xs[i] - mu) ** 2, 0) / Nk;
      return {prompt: Q`Four points \(x=${tup(xs)}\) have responsibilities \(r=${tup(rs)}\) for component k. Carry out the M-step for k: compute \(N_k=\sum_nr_n\), the mean \(\mu_k\), the variance \(\sigma_k^2\) and the weight \(\pi_k=N_k/4\).`,
        answers: [{label: Q`\(N_k\)`, value: Nk, tol: .001}, {label: Q`\(\mu_k\)`, value: mu, tol: .01}, {label: Q`\(\sigma_k^2\)`, value: va, tol: .01}, {label: Q`\(\pi_k\)`, value: Nk / 4, tol: .001}],
        hint: Q`Every sum is weighted by r: \(\mu_k=\sum_nr_nx_n/N_k\) and \(\sigma_k^2=\sum_nr_n(x_n-\mu_k)^2/N_k\).`,
        solution: Q`\(N_k=${rs.join('+')}=${dec(Nk)}\). \(\mu_k=(${rs.map((v, i) => `${v}\\cdot${xs[i]}`).join('+')})/${dec(Nk)}=${dec(mu)}\). \(\sigma_k^2=(${rs.map((v, i) => `${v}\\cdot(${dec(xs[i] - mu, 3)})^2`).join('+')})/${dec(Nk)}=${dec(va)}\). \(\pi_k=${dec(Nk)}/4=${dec(Nk / 4)}\). This is maximum likelihood with each point counted r times.`};
    }},
    {key: 'gaussian-kl', skill: 'Compute the KL term of a VAE', make(r) {
      const mu = [r.int(-4, 4) / 2, r.int(-4, 4) / 2], sg = [r.pick([.25, .5, 1, 2]), r.pick([.25, .5, 1, 2])];
      const kl = mu.map((m, i) => .5 * (m * m + sg[i] ** 2 - 1 - Math.log(sg[i] ** 2)));
      return {prompt: Q`An encoder outputs \(\mu=${tup(mu)}\) and \(\sigma=${tup(sg)}\) for a 2-D latent code. Compute \(\mathrm{KL}\bigl(\mathcal N(\mu,\operatorname{diag}\sigma^2)\,\|\,\mathcal N(0,I)\bigr)\) for each dimension and in total.`,
        answers: [{label: 'Dimension 1', value: kl[0], tol: .006}, {label: 'Dimension 2', value: kl[1], tol: .006}, {label: 'Total', value: kl[0] + kl[1], tol: .006}],
        hint: Q`Per dimension \(\tfrac12(\mu^2+\sigma^2-1-\ln\sigma^2)\); independent dimensions add.`,
        solution: Q`Dimension 1: \(\tfrac12(${mu[0] ** 2}+${sg[0] ** 2}-1-\ln${sg[0] ** 2})=${dec(kl[0])}\). Dimension 2: \(\tfrac12(${mu[1] ** 2}+${sg[1] ** 2}-1-\ln${sg[1] ** 2})=${dec(kl[1])}\). Total ${dec(kl[0] + kl[1])} nats. Each term is 0 only for μ = 0 and σ = 1; a σ far below 1 costs \(-\ln\sigma\) even when μ = 0.`};
    }},
    {key: 'reparameterization', skill: 'Backpropagate through z = μ + σε', make(r) {
      const mu = r.int(-4, 4) / 2, sg = r.pick([.5, 1, 1.5, 2]), eps = r.nonzero(-3, 3) / 2, c = r.int(-2, 3), z = mu + sg * eps, g = 2 * (z - c);
      return {prompt: Q`A VAE samples \(z=\mu+\sigma\varepsilon\) with \(\mu=${mu}\), \(\sigma=${sg}\) and the drawn noise \(\varepsilon=${eps}\). A downstream loss is \(L=(z-${c})^2\). Compute z, \(\partial L/\partial\mu\) and \(\partial L/\partial\sigma\).`,
        answers: [{label: 'z', value: z, tol: .001}, {label: Q`\(\partial L/\partial\mu\)`, value: g, tol: .01}, {label: Q`\(\partial L/\partial\sigma\)`, value: g * eps, tol: .01}],
        hint: Q`\(\partial L/\partial z=2(z-${c})\). Then \(\partial z/\partial\mu=1\) and \(\partial z/\partial\sigma=\varepsilon\).`,
        solution: Q`\(z=${mu}+${sg}\cdot(${eps})=${dec(z)}\). \(\partial L/\partial z=2(${dec(z)}-${c})=${dec(g)}\), so \(\partial L/\partial\mu=${dec(g)}\cdot1=${dec(g)}\) and \(\partial L/\partial\sigma=${dec(g)}\cdot(${eps})=${dec(g * eps)}\). The noise is an input, so nothing random sits between the loss and μ, σ.`};
    }},
    {key: 'jensen-gap', skill: 'Check Jensen’s inequality for the logarithm', make(r) {
      const [a, b] = r.distinct(2, 1, 9), p = r.pick([.25, .5, .75]), mean = p * a + (1 - p) * b, lnMean = Math.log(mean), meanLn = p * Math.log(a) + (1 - p) * Math.log(b);
      return {prompt: Q`A positive quantity Y equals ${a} with probability ${p} and ${b} otherwise. Compute \(\ln\mathbb E[Y]\) and \(\mathbb E[\ln Y]\), and check which is larger.`,
        answers: [{label: Q`\(\ln\mathbb E[Y]\)`, value: lnMean, tol: .006}, {label: Q`\(\mathbb E[\ln Y]\)`, value: meanLn, tol: .006}],
        hint: Q`\(\mathbb E[Y]=${p}\cdot${a}+${dec(1 - p, 2)}\cdot${b}\). For \(\mathbb E[\ln Y]\), average the logarithms with the same weights.`,
        solution: Q`\(\mathbb E[Y]=${dec(mean)}\), so \(\ln\mathbb E[Y]=${dec(lnMean)}\). \(\mathbb E[\ln Y]=${p}\ln${a}+${dec(1 - p, 2)}\ln${b}=${dec(meanLn)}\). The first is larger by ${dec(lnMean - meanLn)}, as Jensen’s inequality says for the concave logarithm; the ELBO uses exactly this step.`};
    }},
    {key: 'kmeans-step', skill: 'Run one k-means step in 1-D', make(r) {
      let xs, m, A;
      do {
        xs = r.distinct(6, 0, 12).sort((u, v) => u - v); m = r.distinct(2, 0, 12).sort((u, v) => u - v);
        A = xs.map(x => Math.abs(x - m[0]) <= Math.abs(x - m[1]) ? 0 : 1);
      } while (xs.some(x => Math.abs(Math.abs(x - m[0]) - Math.abs(x - m[1])) < 1e-9) || !A.includes(0) || !A.includes(1));
      const c0 = xs.filter((_, i) => !A[i]), c1 = xs.filter((_, i) => A[i]), n0 = c0.reduce((t, v) => t + v, 0) / c0.length, n1 = c1.reduce((t, v) => t + v, 0) / c1.length;
      return {prompt: Q`Run one k-means step on the points \(${tup(xs)}\) with current means \(m_1=${m[0]}\) and \(m_2=${m[1]}\): assign each point to its nearer mean, then recompute both means. How many points go to \(m_1\), and what are the new means?`,
        answers: [{label: Q`Points assigned to \(m_1\)`, value: c0.length, tol: 0}, {label: Q`New \((m_1, m_2)\)`, vector: [n0, n1], tol: .01}],
        hint: 'A point goes to whichever mean is closer. Each new mean is the plain average of the points assigned to it: k-means is EM with responsibilities that are exactly 0 or 1.',
        solution: Q`The points \(${tup(c0)}\) are nearer ${m[0]} and \(${tup(c1)}\) are nearer ${m[1]}. New means: \(${dec(n0)}\) and \(${dec(n1)}\). With soft responsibilities this would be the M-step of a mixture whose variances have shrunk to 0.`};
    }},
  ];

  /* ---------- Lab helpers: a Gaussian mixture on RGB pixels ---------- */
  const ITERS = 30, VAR0 = .01, RIDGE = 1e-6;
  const det3 = m => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  function inv3(m) {
    const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C;
    return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map(v => v / det);
  }
  // k-means++ seeding with a seeded random source: the same start for k-means and for EM.
  function seedMeans(X, n, K, seed) {
    const g = window.CV_VISION.rng(seed), means = [], d2 = new Float64Array(n).fill(Infinity);
    let pick = Math.floor(g.next() * n);
    for (let k = 0; k < K; k++) {
      means.push([X[3 * pick], X[3 * pick + 1], X[3 * pick + 2]]);
      let total = 0;
      for (let i = 0; i < n; i++) { const m = means[k], d = (X[3 * i] - m[0]) ** 2 + (X[3 * i + 1] - m[1]) ** 2 + (X[3 * i + 2] - m[2]) ** 2; if (d < d2[i]) d2[i] = d; total += d2[i]; }
      let u = g.next() * total; pick = n - 1;
      for (let i = 0; i < n; i++) { u -= d2[i]; if (u <= 0) { pick = i; break; } }
    }
    return means;
  }
  // Log-density of every point under every component, as a function of the parameters.
  function logDens(X, n, prm) {
    const K = prm.means.length, out = new Float64Array(n * K);
    for (let k = 0; k < K; k++) {
      const S = prm.covs[k], Si = inv3(S), c = Math.log(prm.pis[k]) - .5 * (3 * LN2PI + Math.log(det3(S))), [m0, m1, m2] = prm.means[k];
      for (let i = 0; i < n; i++) {
        const a = X[3 * i] - m0, b = X[3 * i + 1] - m1, d = X[3 * i + 2] - m2;
        out[i * K + k] = c - .5 * (a * (Si[0] * a + Si[1] * b + Si[2] * d) + b * (Si[3] * a + Si[4] * b + Si[5] * d) + d * (Si[6] * a + Si[7] * b + Si[8] * d));
      }
    }
    return out;
  }
  function eStep(X, n, prm) {
    const K = prm.means.length, L = logDens(X, n, prm), R = new Float64Array(n * K);
    let ll = 0;
    for (let i = 0; i < n; i++) {
      let mx = -Infinity; for (let k = 0; k < K; k++) mx = Math.max(mx, L[i * K + k]);
      let s = 0; for (let k = 0; k < K; k++) s += Math.exp(L[i * K + k] - mx);
      const l = mx + Math.log(s); ll += l;
      for (let k = 0; k < K; k++) R[i * K + k] = Math.exp(L[i * K + k] - l);
    }
    return {R, ll: ll / n};
  }
  function mStep(X, n, R, K, old) {
    const prm = {means: [], covs: [], pis: []};
    for (let k = 0; k < K; k++) {
      let Nk = 0, s0 = 0, s1 = 0, s2 = 0;
      for (let i = 0; i < n; i++) { const r = R[i * K + k]; Nk += r; s0 += r * X[3 * i]; s1 += r * X[3 * i + 1]; s2 += r * X[3 * i + 2]; }
      if (Nk < 1e-6) { prm.means.push(old.means[k].slice()); prm.covs.push(old.covs[k].slice()); prm.pis.push(1e-9); continue; }
      const mu = [s0 / Nk, s1 / Nk, s2 / Nk], S = new Array(9).fill(0);
      for (let i = 0; i < n; i++) {
        const r = R[i * K + k], d = [X[3 * i] - mu[0], X[3 * i + 1] - mu[1], X[3 * i + 2] - mu[2]];
        for (let a = 0; a < 3; a++) for (let b = a; b < 3; b++) S[3 * a + b] += r * d[a] * d[b];
      }
      for (let a = 0; a < 3; a++) for (let b = a; b < 3; b++) { S[3 * a + b] /= Nk; S[3 * b + a] = S[3 * a + b]; }
      // The exact M-step keeps EM monotone; a tiny ridge is added only if a component collapses onto one colour.
      if (det3(S) < 1e-15) for (let a = 0; a < 3; a++) S[4 * a] += RIDGE;
      prm.means.push(mu); prm.covs.push(S); prm.pis.push(Nk / n);
    }
    const tot = prm.pis.reduce((t, v) => t + v, 0); prm.pis = prm.pis.map(v => v / tot);
    return prm;
  }
  function fitMixture(X, n, K, method, seed) {
    const start = seedMeans(X, n, K, seed), hist = [];
    if (method === 'kmeans') {
      let means = start.map(m => m.slice());
      for (let t = 0; t <= ITERS; t++) {
        const lab = new Int32Array(n), sum = Array.from({length: K}, () => [0, 0, 0, 0]);
        let J = 0;
        for (let i = 0; i < n; i++) {
          let best = 0, bd = Infinity;
          for (let k = 0; k < K; k++) { const m = means[k], d = (X[3 * i] - m[0]) ** 2 + (X[3 * i + 1] - m[1]) ** 2 + (X[3 * i + 2] - m[2]) ** 2; if (d < bd) { bd = d; best = k; } }
          lab[i] = best; J += bd; const sm = sum[best]; sm[0] += X[3 * i]; sm[1] += X[3 * i + 1]; sm[2] += X[3 * i + 2]; sm[3]++;
        }
        hist.push({means: means.map(m => m.slice()), J: J / n, share: sum.map(s => s[3] / n)});
        means = means.map((m, k) => sum[k][3] ? [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]] : m);
      }
      return hist;
    }
    let prm = {means: start.map(m => m.slice()), covs: start.map(() => [VAR0, 0, 0, 0, VAR0, 0, 0, 0, VAR0]), pis: start.map(() => 1 / K)};
    for (let t = 0; t <= ITERS; t++) {
      const {R, ll} = eStep(X, n, prm);
      hist.push({means: prm.means.map(m => m.slice()), covs: prm.covs.map(c => c.slice()), pis: prm.pis.slice(), ll});
      prm = mStep(X, n, R, K, prm);
    }
    return hist;
  }

  /* ---------- Lab helpers: a tiny VAE on 8 × 8 bar images, with manual backpropagation and Adam ---------- */
  const PX = 64, ZD = 2, HID = 24, TOTAL = 2000, CHUNK = 100, GRID = 9, ZMAX = 2.5;
  const BARS = (() => { const out = []; for (let o = 0; o < 2; o++) for (let k = 0; k < 8; k++) { const x = new Float64Array(PX); for (let i = 0; i < 8; i++) x[o ? i * 8 + k : k * 8 + i] = 1; out.push({x, o, k}); } return out; })();
  const PKEYS = ['W1', 'b1', 'Wm', 'bm', 'Wl', 'bl', 'W3', 'b3', 'W4', 'b4'];
  function vaeInit(seed) {
    const g = window.CV_VISION.rng(seed), mat = (r, c) => Float64Array.from({length: r * c}, () => g.gauss() * Math.sqrt(1 / r));
    return {W1: mat(PX, HID), b1: new Float64Array(HID), Wm: mat(HID, ZD), bm: new Float64Array(ZD), Wl: mat(HID, ZD), bl: new Float64Array(ZD), W3: mat(ZD, HID), b3: new Float64Array(HID), W4: mat(HID, PX), b4: new Float64Array(PX)};
  }
  function vaeDecode(P, z) {
    const h2 = new Float64Array(HID), lg = new Float64Array(PX);
    for (let j = 0; j < HID; j++) { let s = P.b3[j]; for (let k = 0; k < ZD; k++) s += z[k] * P.W3[k * HID + j]; h2[j] = Math.tanh(s); }
    for (let i = 0; i < PX; i++) { let s = P.b4[i]; for (let j = 0; j < HID; j++) s += h2[j] * P.W4[j * PX + i]; lg[i] = s; }
    return {h2, lg};
  }
  function vaeForward(P, x, eps) {
    const h1 = new Float64Array(HID), mu = new Float64Array(ZD), lv = new Float64Array(ZD), z = new Float64Array(ZD);
    for (let j = 0; j < HID; j++) { let s = P.b1[j]; for (let i = 0; i < PX; i++) if (x[i]) s += x[i] * P.W1[i * HID + j]; h1[j] = Math.tanh(s); }
    for (let k = 0; k < ZD; k++) { let a = P.bm[k], b = P.bl[k]; for (let j = 0; j < HID; j++) { a += h1[j] * P.Wm[j * ZD + k]; b += h1[j] * P.Wl[j * ZD + k]; } mu[k] = a; lv[k] = b; z[k] = a + Math.exp(b / 2) * (eps ? eps[k] : 0); }
    return {h1, mu, lv, z, ...vaeDecode(P, z)};
  }
  const softplus = v => v > 0 ? v + Math.log1p(Math.exp(-v)) : Math.log1p(Math.exp(v));
  // Loss = Σ over images of [binary cross-entropy of the 64 pixels + β · KL]; G (if given) accumulates its gradient.
  function vaeLoss(P, beta, epsList, G) {
    let rec = 0, kl = 0;
    BARS.forEach(({x}, n) => {
      const eps = epsList[n], f = vaeForward(P, x, eps);
      for (let i = 0; i < PX; i++) rec += softplus(f.lg[i]) - x[i] * f.lg[i];
      for (let k = 0; k < ZD; k++) kl += .5 * (f.mu[k] ** 2 + Math.exp(f.lv[k]) - 1 - f.lv[k]);
      if (!G) return;
      const dlg = new Float64Array(PX), da2 = new Float64Array(HID), dz = new Float64Array(ZD), dh1 = new Float64Array(HID);
      for (let i = 0; i < PX; i++) { dlg[i] = 1 / (1 + Math.exp(-f.lg[i])) - x[i]; G.b4[i] += dlg[i]; }
      for (let j = 0; j < HID; j++) { let s = 0; for (let i = 0; i < PX; i++) { G.W4[j * PX + i] += f.h2[j] * dlg[i]; s += P.W4[j * PX + i] * dlg[i]; } da2[j] = s * (1 - f.h2[j] ** 2); G.b3[j] += da2[j]; }
      for (let k = 0; k < ZD; k++) { let s = 0; for (let j = 0; j < HID; j++) { G.W3[k * HID + j] += f.z[k] * da2[j]; s += P.W3[k * HID + j] * da2[j]; } dz[k] = s; }
      const dmu = new Float64Array(ZD), dlv = new Float64Array(ZD);
      for (let k = 0; k < ZD; k++) { const sg = Math.exp(f.lv[k] / 2); dmu[k] = dz[k] + beta * f.mu[k]; dlv[k] = dz[k] * eps[k] * sg / 2 + beta * .5 * (Math.exp(f.lv[k]) - 1); G.bm[k] += dmu[k]; G.bl[k] += dlv[k]; }
      for (let j = 0; j < HID; j++) { let s = 0; for (let k = 0; k < ZD; k++) { G.Wm[j * ZD + k] += f.h1[j] * dmu[k]; G.Wl[j * ZD + k] += f.h1[j] * dlv[k]; s += P.Wm[j * ZD + k] * dmu[k] + P.Wl[j * ZD + k] * dlv[k]; } dh1[j] = s * (1 - f.h1[j] ** 2); G.b1[j] += dh1[j]; }
      for (let i = 0; i < PX; i++) if (x[i]) for (let j = 0; j < HID; j++) G.W1[i * HID + j] += x[i] * dh1[j];
    });
    return {rec, kl};
  }
  const zerosLike = P => Object.fromEntries(PKEYS.map(k => [k, new Float64Array(P[k].length)]));
  function vaeModel(beta, seed) {
    const P = vaeInit(seed);
    return {beta, seed, P, m: zerosLike(P), v: zerosLike(P), t: 0, g: window.CV_VISION.rng(seed + 7), curve: []};
  }
  function vaeTrain(M, steps, lr = .01) {
    const n = BARS.length;
    for (let s = 0; s < steps && M.t < TOTAL; s++) {
      M.t++;
      const eps = BARS.map(() => Float64Array.from({length: ZD}, () => M.g.gauss())), G = zerosLike(M.P), out = vaeLoss(M.P, M.beta, eps, G);
      for (const k of PKEYS) { const p = M.P[k], gk = G[k], mk = M.m[k], vk = M.v[k]; for (let i = 0; i < p.length; i++) { const gr = gk[i] / n; mk[i] = .9 * mk[i] + .1 * gr; vk[i] = .999 * vk[i] + .001 * gr * gr; p[i] -= lr * (mk[i] / (1 - .9 ** M.t)) / (Math.sqrt(vk[i] / (1 - .999 ** M.t)) + 1e-8); } }
      if (M.t % 20 === 0) M.curve.push([M.t, out.rec / n, out.kl / n]);
    }
  }
  // Exact evaluation at the encoder means (no sampling) for the report.
  function vaeSummary(M) {
    const enc = BARS.map(b => vaeForward(M.P, b.x)), n = BARS.length;
    let rec = 0; const klDim = [0, 0];
    enc.forEach((f, i) => { for (let p = 0; p < PX; p++) rec += softplus(f.lg[p]) - BARS[i].x[p] * f.lg[p]; for (let k = 0; k < ZD; k++) klDim[k] += .5 * (f.mu[k] ** 2 + Math.exp(f.lv[k]) - 1 - f.lv[k]); });
    return {enc, rec: rec / n, klDim: klDim.map(v => v / n)};
  }

  function syncInputs(root, s, keys) {
    keys.forEach(k => {
      const el = root.querySelector('#vk-' + k);
      if (el && Number(el.value) !== s[k]) { el.value = s[k]; const out = root.querySelector(`#vk-${k}-value`); if (out) out.textContent = window.CV_VISION.fmt(s[k]); }
    });
  }
  const lab = {
    name: 'latent', title: 'Mixtures, EM and a tiny VAE', photo: 'cat',
    heading: 'Fit hidden causes to data. Watch the bound climb.',
    intro: 'Mixture mode: every second pixel of the cat photo is a point in RGB space (jittered by less than one grey level so the colours are continuous). k-means and a Gaussian mixture fitted by EM start from the same seeded means. VAE mode: a variational autoencoder with a 2-D latent code learns 16 images of 8 × 8 bars, trained here in your browser.',
    defaults: {mode: 'mixture', method: 'gmm', K: 4, iter: 15, comp: 1, seed: 1, beta: 1, vseed: 1},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('mode', 'Experiment', [['mixture', 'Colour mixture: k-means or EM'], ['vae', 'Variational autoencoder on bars']], s.mode) +
        `<div data-show-when="mode:mixture">${select('method', 'Method', [['gmm', 'Gaussian mixture by EM (soft)'], ['kmeans', 'k-means (hard)']], s.method)}` +
        range('K', 'Components K', 2, 8, 1, s.K) + range('iter', 'Iteration t', 0, ITERS, 1, s.iter) + range('comp', 'Show component', 1, 8, 1, s.comp) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="seed">New starting means ↻</button></div>' +
        '<div class="math-rule">E: r_nk ∝ π_k N(x_n; μ_k, Σ_k)   M: μ_k = Σ r_nk x_n / N_k, π_k = N_k / N</div></div>' +
        `<div data-show-when="mode:vae">${range('beta', 'KL weight β', 0, 4, .25, s.beta)}` +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="vseed">Retrain with a new seed ↻</button></div>' +
        '<div class="math-rule">loss = BCE(x, decoder(z)) + β · ½ Σ (μ² + σ² − 1 − ln σ²),  z = μ + σ ε</div></div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div data-show-when="mode:mixture"><div class="vk-pair">${figure('lv-quant', 'Each pixel replaced by the mean colour of its most responsible component.')}${figure('lv-soft', 'Responsibility of the chosen component for every pixel (white = 1).')}</div><div id="lv-palette" class="vk-legend"></div><div id="lv-curve"></div></div>` +
        `<div data-show-when="mode:vae"><div class="vk-pair">${figure('lv-grid', 'Decoder outputs for a 9 × 9 grid of codes z from −2.5 to 2.5 in each direction.', 'vk-pixelated')}<div id="lv-latent"></div></div>${figure('lv-recon', 'Top: the 16 training images. Bottom: their reconstructions from the encoder means.', 'vk-pixelated')}<div id="lv-train"></div></div>`;
    },
    note: 'Predict first, in mixture mode: can the log-likelihood go down from one EM iteration to the next? It cannot; the report checks every step. k-means minimises a squared distance instead, which also never rises. Compare the soft map of EM with the hard map of k-means at an edge of the fur. In VAE mode, predict what β = 0 does: the KL term disappears, the codes drift far from the origin with tiny σ, and most of the decoded grid is not a bar at all. At β = 1 the codes pack into the prior and the grid morphs smoothly from bar to bar. At β = 4 the KL term wins: the encoder ignores its input and every reconstruction blurs towards the average image.',
    async setup() {
      const V = window.CV_VISION, img = await V.load('cat'), {w, h, rgba} = img;
      // Fit on every second pixel. A seeded jitter below one grey level turns the 8-bit colours into continuous data,
      // so that no component can collapse onto a single repeated colour.
      const sub = [], jitter = V.rng(99);
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const i = 4 * (y * w + x); for (let c = 0; c < 3; c++) sub.push((rgba[i + c] + jitter.next()) / 255); }
      const full = new Float64Array(w * h * 3);
      for (let i = 0; i < w * h; i++) { full[3 * i] = rgba[4 * i] / 255; full[3 * i + 1] = rgba[4 * i + 1] / 255; full[3 * i + 2] = rgba[4 * i + 2] / 255; }
      return {img, X: Float64Array.from(sub), n: sub.length / 3, full, fits: new Map(), vae: new Map(), current: null, timer: null, rerender: null};
    },
    render(s, root, data) { data.mode = s.mode; return s.mode === 'vae' ? renderVAE(s, root, data) : renderMixture(s, root, data); },
    // The VAE trains in the background between frames; it needs the lab's own rerender to refresh the figures.
    wire(root, s, rerender) { root.__latentRerender = rerender; },
    action(name, s) { if (name === 'seed') s.seed++; if (name === 'vseed') s.vseed++; },
  };
  function renderMixture(s, root, data) {
    const V = window.CV_VISION, {img, X, n, full, fits} = data, K = s.K, key = `${s.method}:${K}:${s.seed}`;
    if (!fits.has(key)) fits.set(key, fitMixture(X, n, K, s.method, s.seed));
    const hist = fits.get(key), t = Math.min(s.iter, ITERS), cur = hist[t], c = Math.min(s.comp, K) - 1, W = img.w, H = img.h, P = W * H;
    if (s.comp > K) { s.comp = K; syncInputs(root, s, ['comp']); }
    const quant = new Uint8ClampedArray(P * 4), soft = new Float32Array(P);
    let sq = 0;
    if (s.method === 'kmeans') {
      for (let i = 0; i < P; i++) {
        let best = 0, bd = Infinity;
        for (let k = 0; k < K; k++) { const m = cur.means[k], d = (full[3 * i] - m[0]) ** 2 + (full[3 * i + 1] - m[1]) ** 2 + (full[3 * i + 2] - m[2]) ** 2; if (d < bd) { bd = d; best = k; } }
        const m = cur.means[best]; quant[4 * i] = 255 * m[0]; quant[4 * i + 1] = 255 * m[1]; quant[4 * i + 2] = 255 * m[2]; quant[4 * i + 3] = 255; soft[i] = best === c ? 1 : 0; sq += bd;
      }
    } else {
      const {R} = eStep(full, P, cur);
      for (let i = 0; i < P; i++) {
        let best = 0; for (let k = 1; k < K; k++) if (R[i * K + k] > R[i * K + best]) best = k;
        const m = cur.means[best]; quant[4 * i] = 255 * m[0]; quant[4 * i + 1] = 255 * m[1]; quant[4 * i + 2] = 255 * m[2]; quant[4 * i + 3] = 255; soft[i] = R[i * K + c];
        sq += (full[3 * i] - m[0]) ** 2 + (full[3 * i + 1] - m[1]) ** 2 + (full[3 * i + 2] - m[2]) ** 2;
      }
    }
    V.showRGBA(root.querySelector('#lv-quant'), quant, W, H);
    V.show(root.querySelector('#lv-soft'), soft, W, H, {min: 0, max: 1});
    const weights = s.method === 'kmeans' ? cur.share : cur.pis, hex = m => '#' + m.map(v => Math.round(255 * Math.min(1, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
    root.querySelector('#lv-palette').innerHTML = cur.means.map((m, k) => `<span style="white-space:nowrap${k === c ? ';font-weight:700' : ''}"><span class="vk-key" style="width:14px;height:14px;margin-right:5px;background:${hex(m)};border:${k === c ? '2px solid var(--ink)' : '1px solid var(--line)'}"></span>${k + 1}: ${s.method === 'kmeans' ? 'share' : 'π'} ${V.fmt(weights[k], 3)}</span>`).join('');
    const series = hist.map((hh, i) => [i, s.method === 'kmeans' ? 255 * 255 * hh.J : hh.ll]), ys = series.map(p => p[1]);
    const lo = Math.min(...ys), hi = Math.max(...ys), pad = (hi - lo) * .08 || 1;
    root.querySelector('#lv-curve').innerHTML = window.CV_VISION_LABS.svgPlot({x: [0, ITERS], y: [lo - pad, hi + pad], lines: [{points: series}], dots: series.map(p => [p[0], p[1]]), marker: t, label: s.method === 'kmeans' ? 'k-means objective against iteration' : 'EM log-likelihood per pixel against iteration', xLabel: 'iteration t', yLabel: s.method === 'kmeans' ? 'mean squared distance' : 'log-likelihood per pixel', xTicks: [0, 10, 20, 30]});
    const deltas = ys.slice(1).map((v, i) => v - ys[i]), worst = s.method === 'kmeans' ? Math.max(...deltas) : Math.min(...deltas);
    const rms = Math.sqrt(sq / (3 * P)) * 255;
    return V.report(s.method === 'kmeans' ? [
      ['Mean squared distance J (0–255 units²)', V.fmt(255 * 255 * cur.J, 1)],
      ['Change from t − 1', t ? V.fmt(255 * 255 * (cur.J - hist[t - 1].J), 2) : '—'],
      ['Largest rise over all 30 steps', `${V.fmt(255 * 255 * Math.max(0, worst), 4)} (never rises)`],
      ['RMS colour error, full image', V.fmt(rms, 1) + ' grey levels'],
      ['Component ' + (c + 1) + ' share of pixels', V.fmt(weights[c], 3)],
    ] : [
      ['Log-likelihood per pixel', V.fmt(cur.ll, 4)],
      ['Change from t − 1', t ? V.fmt(cur.ll - hist[t - 1].ll, 5) : '—'],
      ['Smallest change over all 30 steps', `${V.fmt(worst, 6)} ${worst >= -1e-9 ? '(never negative ✓)' : ''}`],
      ['RMS colour error, full image', V.fmt(rms, 1) + ' grey levels'],
      ['Component ' + (c + 1) + ' weight π', V.fmt(weights[c], 3)],
    ]);
  }
  function tile(dst, W, ox, oy, vals) { for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) { const o = 4 * ((oy + r) * W + ox + q), v = Math.round(255 * (1 - vals[r * 8 + q])); dst[o] = dst[o + 1] = dst[o + 2] = v; dst[o + 3] = 255; } }
  const sigmoid = v => 1 / (1 + Math.exp(-v));
  function renderVAE(s, root, data) {
    const V = window.CV_VISION, key = `${s.beta}:${s.vseed}`;
    if (!data.vae.has(key)) data.vae.set(key, vaeModel(s.beta, s.vseed));
    const M = data.vae.get(key);
    data.current = key; data.root = root; data.rerender = root.__latentRerender || null;
    // Train in chunks between frames, so the page stays responsive and the latent map visibly organises itself.
    // A chunk stops the loop if the lab was reset or left (a newer rerender, a detached root) or the mode changed.
    if (M.t < TOTAL && !data.timer) {
      const mine = data.rerender, tick = () => {
        data.timer = null;
        const cur = data.vae.get(data.current), stale = data.root.__latentRerender !== mine || data.root.isConnected === false || data.mode !== 'vae';
        if (!cur || cur.t >= TOTAL || stale) return;
        vaeTrain(cur, CHUNK);
        if (mine) mine();
        if (cur.t < TOTAL) data.timer = setTimeout(tick, 0);
      };
      data.timer = setTimeout(tick, 0);
    }
    const sum = vaeSummary(M);
    // Decoded grid: row 0 at the top is z₂ = +2.5.
    const gw = GRID * 8 + GRID + 1, grid = new Uint8ClampedArray(gw * gw * 4).fill(200);
    for (let a = 0; a < GRID; a++) for (let b = 0; b < GRID; b++) {
      const z = [-ZMAX + 2 * ZMAX * b / (GRID - 1), ZMAX - 2 * ZMAX * a / (GRID - 1)], {lg} = vaeDecode(M.P, z);
      tile(grid, gw, 1 + b * 9, 1 + a * 9, Array.from(lg, sigmoid));
    }
    V.showRGBA(root.querySelector('#lv-grid'), grid, gw, gw);
    const rw = 16 * 9 + 1, rh = 2 * 9 + 1, rec = new Uint8ClampedArray(rw * rh * 4).fill(200);
    BARS.forEach((b, i) => { tile(rec, rw, 1 + i * 9, 1, b.x); tile(rec, rw, 1 + i * 9, 10, Array.from(sum.enc[i].lg, sigmoid)); });
    V.showRGBA(root.querySelector('#lv-recon'), rec, rw, rh);
    // Latent scatter: encoder means with ±σ ellipses; dashed square = the decoded grid.
    const ext = Math.max(3, ...sum.enc.map(f => Math.max(Math.abs(f.mu[0]), Math.abs(f.mu[1])) + 2 * Math.exp(f.lv[0] / 2))) * 1.08, S0 = 260, X = v => S0 / 2 + v / ext * (S0 / 2 - 14), Y = v => S0 / 2 - v / ext * (S0 / 2 - 14);
    let svg = `<svg class="vk-plot" viewBox="0 0 ${S0} ${S0 + 20}" role="img" aria-label="Encoder means of the 16 training images in the 2-D latent space"><title>Latent codes</title>`;
    svg += `<line class="axis-line" x1="0" x2="${S0}" y1="${Y(0)}" y2="${Y(0)}"/><line class="axis-line" x1="${X(0)}" x2="${X(0)}" y1="0" y2="${S0}"/>`;
    svg += `<rect x="${X(-ZMAX)}" y="${Y(ZMAX)}" width="${X(ZMAX) - X(-ZMAX)}" height="${Y(-ZMAX) - Y(ZMAX)}" fill="none" class="vk-marker"/>`;
    svg += `<circle cx="${X(0)}" cy="${Y(0)}" r="${(X(1) - X(0)).toFixed(1)}" fill="none" class="vk-eig2"/><circle cx="${X(0)}" cy="${Y(0)}" r="${(X(2) - X(0)).toFixed(1)}" fill="none" class="vk-eig2"/>`;
    sum.enc.forEach((f, i) => {
      const cls = BARS[i].o ? 'series-b' : 'series-a', cx = X(f.mu[0]), cy = Y(f.mu[1]);
      svg += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${Math.max(1, X(Math.exp(f.lv[0] / 2)) - X(0)).toFixed(1)}" ry="${Math.max(1, X(Math.exp(f.lv[1] / 2)) - X(0)).toFixed(1)}" class="${cls}" style="stroke-width:1.2;opacity:.75"/>`;
      svg += `<text x="${(cx + 4).toFixed(1)}" y="${(cy - 4).toFixed(1)}">${BARS[i].o ? 'v' : 'h'}${BARS[i].k + 1}</text>`;
    });
    svg += `<text x="4" y="${S0 + 14}">h: horizontal bar at row k · v: vertical bar at column k · axes to ±${V.fmt(ext, 1)}</text></svg>`;
    root.querySelector('#lv-latent').innerHTML = svg + '<p class="vk-legend">Orange: horizontal bars, blue: vertical bars; ellipses show ±σ. Dotted circles: radius 1 and 2 of the prior N(0, I). Dashed square: the decoded grid.</p>';
    const curve = M.curve.length ? M.curve : [[0, 0, 0]], top = Math.max(1, ...curve.map(p => p[1] + p[2]));
    root.querySelector('#lv-train').innerHTML = window.CV_VISION_LABS.svgPlot({x: [0, TOTAL], y: [0, Math.min(top, 60)], lines: [{points: curve.map(p => [p[0], p[1]]), cls: 'series-a'}, {points: curve.map(p => [p[0], p[2]]), cls: 'series-b'}], label: 'Reconstruction and KL terms per image during training', xLabel: 'training step (orange: reconstruction, blue: KL, nats per image)', yLabel: 'nats', xTicks: [0, 1000, 2000]});
    return V.report([
      ['Training', M.t < TOTAL ? `step ${M.t} of ${TOTAL}…` : `done (${TOTAL} Adam steps)`],
      ['Reconstruction −ln p(x|z)', V.fmt(sum.rec, 2) + ' nats per image'],
      ['KL per dimension', sum.klDim.map(v => V.fmt(v, 2)).join(' and ') + ' nats'],
      ['−ELBO (β = 1 bound)', V.fmt(sum.rec + sum.klDim[0] + sum.klDim[1], 2) + ' nats per image'],
      ['Codes inside the decoded grid', `${sum.enc.filter(f => Math.abs(f.mu[0]) <= ZMAX && Math.abs(f.mu[1]) <= ZMAX).length} of 16`],
    ]);
  }

  window.CV_EXTEND.lesson(66, {
    teaching: {
      equation: Q`\ln p(x)=\underbrace{\mathbb E_{q(z|x)}\bigl[\ln p(x|z)\bigr]-\mathrm{KL}\bigl(q(z|x)\,\|\,p(z)\bigr)}_{\text{ELBO}}+\mathrm{KL}\bigl(q(z|x)\,\|\,p(z|x)\bigr),\qquad z=\mu+\sigma\odot\varepsilon`,
      symbols: [['z', 'latent variable'], ['r_k', 'responsibility of component k'], ['q(z|x)', 'encoder: approximate posterior'], ['p(x|z)', 'decoder: likelihood of x given z'], ['ELBO', 'evidence lower bound'], ['ε', 'standard normal noise']],
      connection: 'Gaussian mixtures model backgrounds and colours, k-means builds superpixels, anchor boxes and visual vocabularies, and the VAE’s autoencoder gives Stable Diffusion its latent space. The ELBO derived here is also where the diffusion objective of Lesson 67 starts.',
      trap: 'Sampling z from the encoder’s Gaussian and expecting gradients to reach μ and σ. A random draw has no derivative; write z = μ + σε with ε drawn separately, so z is a differentiable function of μ and σ.',
      question: 'EM fits a mixture by alternating E- and M-steps. What happens to the data log-likelihood after each full iteration?',
      choices: ['It never decreases', 'It can rise or fall', 'It always reaches the global maximum'], correct: 0,
      explanation: 'The E-step makes the ELBO equal to the log-likelihood; the M-step raises the ELBO, and the log-likelihood is never below it. So the likelihood cannot fall, though EM can still stop at a local maximum that depends on the start.',
    },
    guide: {
      title: 'Explain the data with a hidden cause, then bound what you cannot compute',
      paragraphs: [
        'A latent variable is an unobserved cause, such as which colour cluster produced a pixel. A Gaussian mixture sums over it, and EM fits the mixture by alternating soft assignments (responsibilities, from Bayes’ theorem) with weighted maximum-likelihood fits. With hard 0-or-1 assignments EM becomes k-means.',
        'Jensen’s inequality gives a lower bound on the log-likelihood for any guess q of the latent variable, and the gap is KL(q ‖ posterior). A VAE maximises that bound with an encoder that outputs q(z|x) and a decoder p(x|z), using z = μ + σε so that gradients pass through the sampling step.',
      ],
      example: 'Responsibilities for one point, and what a hard assignment loses',
      controls: [{label: 'Point x', min: -2, max: 6, step: .5, value: 1}, {label: 'Second mean μ₂ (the first is 0)', min: 1, max: 6, step: .5, value: 4}, {label: 'Shared standard deviation σ', min: .5, max: 2, step: .25, value: 1}, {label: 'First weight π₁', min: .1, max: .9, step: .1, value: .5}],
      predict: 'Put x exactly halfway between the two means with equal weights. What are the responsibilities, and how much does a hard assignment lose?',
      takeaway: 'Responsibilities are Bayes’ theorem applied to the mixture. The bound for any q equals ln p(x) − KL(q ‖ r), so soft responsibilities make it tight, and the hard assignments of k-means lose −ln r of the winning component.',
      notation: 'π_k are the mixture weights, μ_k and σ the component means and shared standard deviation, and N_k = N(x; μ_k, σ²) the component densities. r_k is the responsibility of component k for the point x, q a distribution over the components, and L(q) its bound on ln p(x).',
    },
    notation: {
      z: {tex: 'z', detail: 'The latent variable: unobserved. In a mixture it is the component that produced x; in a VAE it is a continuous code vector, here 2-D, with prior N(0, I).'},
      r_k: {tex: 'r_k', detail: 'The responsibility of component k for a point: its posterior probability π_k N(x; μ_k, Σ_k)/p(x). The responsibilities of one point sum to 1; EM’s E-step computes them.'},
      'q(z|x)': {tex: Q`q(z\mid x)`, detail: 'An approximate posterior over the latent variable for input x. In EM it is set to the exact posterior; in a VAE the encoder outputs it as a Gaussian N(μ(x), diag σ(x)²).'},
      'p(x|z)': {tex: Q`p(x\mid z)`, detail: 'The likelihood of the data given the latent variable: a Gaussian component in a mixture, or the decoder network in a VAE. −ln p(x|z) is the reconstruction loss.'},
      ELBO: {tex: Q`\mathcal L(q)`, detail: 'The evidence lower bound E_q[ln p(x|z)] − KL(q ‖ p(z)). It is below ln p(x) by exactly KL(q ‖ p(z|x)), so raising it either fits the data better or makes q a better posterior.'},
      'ε': {tex: Q`\varepsilon`, detail: 'Noise drawn from N(0, I), independent of every parameter. Writing z = μ + σε (the reparameterisation trick) makes the sample a differentiable function of μ and σ.'},
    },
    calculate, practice, lab,
  });
  window.CV_EXTEND.registry[66].helpers = {model, fitMixture, eStep, vaeModel, vaeTrain, vaeSummary, vaeLoss, vaeInit, zerosLike, BARS, PKEYS};
})();
