/* Lesson 54: entropy, KL divergence and contrastive learning. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  // Plain-text number (details, captions, SVG) and TeX number (equations).
  const N = (x, d = 3) => !Number.isFinite(x) ? (x > 0 ? '∞' : '−∞') : Math.abs(x) < 1e-12 ? '0' : Math.abs(x) < 10 ** -d ? x.toExponential(2) : Number(x.toFixed(d)).toString();
  const T = (x, d = 3) => {
    if (!Number.isFinite(x)) return x > 0 ? Q`\infty` : Q`-\infty`;
    if (Math.abs(x) < 1e-12) return '0';
    if (Math.abs(x) < 10 ** -d) { const [m, e] = x.toExponential(2).split('e'); return Q`${m}\times10^{${Number(e)}}`; }
    return Number(x.toFixed(d)).toString();
  };
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const lse = z => { const m = Math.max(...z); return m + Math.log(z.reduce((t, v) => t + Math.exp(v - m), 0)); };
  const logSoftmax = z => { const l = lse(z); return z.map(v => v - l); };
  const softmax = z => logSoftmax(z).map(Math.exp);
  const entropy = p => -p.reduce((t, v) => t + (v > 0 ? v * Math.log(v) : 0), 0);
  const crossEntropy = (p, q) => -p.reduce((t, v, k) => t + (v > 0 ? v * Math.log(q[k]) : 0), 0);
  const kl = (p, q) => p.reduce((t, v, k) => t + (v > 0 ? (q[k] > 0 ? v * Math.log(v / q[k]) : Infinity) : 0), 0);

  // Worked example: smooth a one-hot label over K classes and score the prediction softmax(z1, 0, ..., 0).
  function model(prm) {
    const [eps, Kraw, z1] = prm, K = Math.round(Kraw);
    const pt = 1 - eps + eps / K, pj = eps / K;
    const p = Array.from({length: K}, (_, k) => k ? pj : pt);
    const q = softmax(Array.from({length: K}, (_, k) => k ? 0 : z1));
    const H = entropy(p), CE = crossEntropy(p, q), D = kl(p, q);
    return {eps, K, z1, pt, pj, p, q, H, CE, D, gap: pj > 0 ? Math.log(pt / pj) : Infinity, grad: q[0] - p[0]};
  }
  function drawing(m) {
    const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', weight = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}>${E(s)}</text>`;
    const x0 = 46, x1 = 356, base = 206, top = 52, Y = v => base - v * (base - top);
    let body = txt(x0, 24, 'Target p (solid green) and prediction q (orange outline)', '#172623', 14);
    body += `<path d="M${x0} ${Y(1)}H${x1}M${x0} ${Y(.5)}H${x1}" stroke="#a8b6a5" stroke-dasharray="3 4"/><path d="M${x0} ${base}H${x1}M${x0} ${top - 8}V${base}" stroke="#a8b6a5"/>`;
    body += txt(x0 - 6, Y(1) + 4, '1', '#64736b', 11, 'end') + txt(x0 - 6, Y(.5) + 4, '0.5', '#64736b', 11, 'end') + txt(x0 - 6, base + 4, '0', '#64736b', 11, 'end');
    const gw = (x1 - x0) / m.K, bw = Math.min(18, gw * .34);
    for (let k = 0; k < m.K; k++) {
      const cx = x0 + gw * (k + .5);
      body += `<rect x="${(cx - bw - 1).toFixed(1)}" y="${Y(m.p[k]).toFixed(1)}" width="${bw.toFixed(1)}" height="${(base - Y(m.p[k])).toFixed(1)}" fill="#34734e"/>`;
      body += `<rect x="${(cx + 1).toFixed(1)}" y="${Y(m.q[k]).toFixed(1)}" width="${bw.toFixed(1)}" height="${(base - Y(m.q[k])).toFixed(1)}" fill="#bd431c" fill-opacity=".18" stroke="#bd431c" stroke-width="2"/>`;
      body += txt(cx.toFixed(1), base + 16, String(k + 1), k ? '#64736b' : '#34734e', 11, 'middle', k ? '' : '700');
    }
    body += txt(x0, base + 34, 'class (1 is the true class)', '#64736b', 11);
    // Stacked bar: cross-entropy = entropy (floor) + KL (mismatch). The dashed line marks the maximum entropy ln K.
    const bx = 404, bwid = 40, maxV = Math.max(Math.log(m.K) * 1.08, m.CE * 1.05, .5), S = v => base - v / maxV * (base - top);
    body += `<rect x="${bx}" y="${S(m.H).toFixed(1)}" width="${bwid}" height="${(base - S(m.H)).toFixed(1)}" fill="#34734e"/>`;
    body += `<rect x="${bx}" y="${S(m.CE).toFixed(1)}" width="${bwid}" height="${(S(m.H) - S(m.CE)).toFixed(1)}" fill="#bd431c" fill-opacity=".18" stroke="#bd431c" stroke-width="2"/>`;
    body += `<path d="M${bx - 8} ${S(Math.log(m.K)).toFixed(1)}H${bx + bwid + 8}" stroke="#315c86" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M${bx - 10} ${base}H${bx + bwid + 10}" stroke="#a8b6a5"/>`;
    body += txt(bx + bwid / 2, base + 16, 'H(p,q)', '#172623', 11, 'middle');
    body += txt(bx + bwid + 14, 70, 'cross-entropy', '#172623', 12) + txt(bx + bwid + 14, 86, N(m.CE), '#172623', 13, 'start', '700');
    body += txt(bx + bwid + 14, 114, 'KL(p‖q)', '#bd431c', 12) + txt(bx + bwid + 14, 130, N(m.D), '#bd431c', 13, 'start', '700');
    body += txt(bx + bwid + 14, 158, 'H(p)', '#34734e', 12) + txt(bx + bwid + 14, 174, N(m.H), '#34734e', 13, 'start', '700');
    body += txt(bx + bwid + 14, 200, `ln K = ${N(Math.log(m.K), 2)}`, '#315c86', 11);
    return {body, caption: `Bars: smoothed target p (ε = ${N(m.eps)}, K = ${m.K}) and prediction q from logit z₁ = ${N(m.z1)}. Right: cross-entropy ${N(m.CE)} nats = entropy ${N(m.H)} (green, the floor) + KL ${N(m.D)} (orange, the mismatch). Blue dashes: the largest possible entropy, ln K.`};
  }
  function calculate(prm) {
    const m = model(prm), others = m.K - 1, rest = m.K > 2 ? Q`,0,\dots,0` : ',0';
    let advice;
    if (m.eps === 0) advice = `With a one-hot target the best gap is infinite: the gradient q₁ − p₁ = ${N(m.grad)} is negative for every finite logit, so training keeps pushing z₁ up.`;
    else if (Math.abs(m.grad) < 1e-12) advice = 'The prediction matches the target, so the KL term is 0 and the cross-entropy has reached its floor H(p).';
    else if (m.grad > 0) advice = `The prediction is more confident than the target (q₁ = ${N(m.q[0])} > p₁ = ${N(m.pt)}), so the gradient q₁ − p₁ = ${N(m.grad)} is positive and gradient descent lowers z₁ toward the best gap ${N(m.gap)}.`;
    else advice = `The prediction is less confident than the target (q₁ = ${N(m.q[0])} < p₁ = ${N(m.pt)}), so the gradient q₁ − p₁ = ${N(m.grad)} is negative and gradient descent raises z₁ toward the best gap ${N(m.gap)}.`;
    return {
      steps: [
        step('Smooth the one-hot label', Q`p_1=1-\varepsilon+\tfrac{\varepsilon}{K}=${T(m.pt)},\qquad p_j=\tfrac{\varepsilon}{K}=${T(m.pj)}\ \text{for the other ${others === 1 ? 'class' : others + ' classes'}}`, `Label smoothing takes ε = ${N(m.eps)} of the probability off the true class and spreads it evenly over all ${m.K} classes, so the target still sums to 1. ${m.eps === 0 ? 'With ε = 0 the target is the one-hot label itself.' : 'The true class keeps most of the mass but is no longer certain.'}`),
        step('Turn the logits into a prediction', Q`z=(${T(m.z1)}${rest}),\quad q_1=\frac{e^{${T(m.z1)}}}{e^{${T(m.z1)}}+${others}}=${T(m.q[0])},\quad q_j=${T(m.q[1])}`, 'The true class has logit z₁ and every other class has 0, so the softmax gives q₁ = e^z₁ / (e^z₁ + K − 1). Raising z₁ makes the prediction more confident.'),
        step('Entropy: the floor no prediction can beat', Q`H(p)=-${T(m.pt)}\ln ${T(m.pt)}${m.pj > 0 ? Q`-${others}\cdot ${T(m.pj)}\ln ${T(m.pj)}` : ''}=${T(m.H)}\ \text{nats}=${T(m.H / Math.LN2)}\ \text{bits}`, `${m.eps === 0 ? 'A one-hot target has zero entropy, so all of the cross-entropy below is KL divergence.' : 'This much loss remains even for a perfect prediction q = p: it is the uncertainty that smoothing put into the target.'} The maximum possible, for a uniform target, is ln K = ${N(Math.log(m.K))} nats.`),
        step('Split the cross-entropy and find the best logits', Q`H(p,q)=${T(m.CE)}=\underbrace{${T(m.H)}}_{H(p)}+\underbrace{${T(m.D)}}_{\mathrm{KL}(p\,\|\,q)},\qquad z_1^\star-z_j^\star=\ln\frac{p_1}{p_j}=${T(m.gap)}`, advice),
      ],
      values: [['Target entropy H(p)', m.H], ['Cross-entropy H(p,q)', m.CE], ['KL(p||q)', m.D], ['Predicted q1', m.q[0]], ['Gradient q1 - p1', m.grad]],
      note: 'With ε > 0, raise the logit past the best gap: the cross-entropy stops falling and rises again, because the KL term grows once q is more confident than the target.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const frac = d => d ? Q`\tfrac{1}{${d}}` : '0';
  const dec = (x, d = 4) => Number(x.toFixed(d)).toString();
  const practice = [
    {key: 'entropy-bits', skill: 'Compute entropy in bits and in nats', make(r) {
      const dens = r.shuffle(r.pick([[2, 2], [2, 4, 4], [2, 4, 8, 8], [4, 4, 4, 4], [2, 8, 8, 8, 8], [4, 4, 4, 8, 8], [2, 4, 4, 0], [4, 4, 8, 8, 8, 8], [2, 4, 8, 16, 16], [2, 4, 16, 16, 16, 16], [2, 2, 0, 0]]));
      const terms = dens.filter(d => d), bits = terms.reduce((t, d) => t + Math.log2(d) / d, 0), K = dens.length;
      return {prompt: Q`Compute the entropy of \(p=(${dens.map(frac).join(Q`,\ `)})\) over K = ${K} classes, first in bits and then in nats.`,
        answers: [{label: Q`\(H(p)\) in bits`, value: bits}, {label: Q`\(H(p)\) in nats`, value: bits * Math.LN2}],
        hint: Q`An outcome with probability \(1/2^m\) has surprise m bits, so it contributes \(m/2^m\) bits. Classes with probability 0 contribute nothing.`,
        solution: Q`\(H(p)=${terms.map(d => Q`\tfrac{1}{${d}}\cdot${Math.log2(d)}`).join('+')}=${dec(bits)}\) bits. Multiply by \(\ln2\approx0.6931\) for nats: \(${dec(bits * Math.LN2)}\). The maximum for ${K} classes is \(\log_2 ${K}=${dec(Math.log2(K), 3)}\) bits, reached only by the uniform distribution.`};
    }},
    {key: 'kl-asymmetry', skill: 'Compute KL divergence in both directions', make(r) {
      let a, b;
      do { a = r.int(1, 9) / 10; b = r.int(1, 9) / 10; } while (Math.abs(a - b) < .29);
      const p = [a, 1 - a], q = [b, 1 - b], f = kl(p, q), g = kl(q, p), s = x => dec(x, 1);
      const t = (u, v) => Q`${s(u[0])}\ln\frac{${s(u[0])}}{${s(v[0])}}+${s(u[1])}\ln\frac{${s(u[1])}}{${s(v[1])}}`;
      return {prompt: Q`Two classes: \(p=(${s(a)}, ${s(1 - a)})\) and \(q=(${s(b)}, ${s(1 - b)})\). Compute \(\mathrm{KL}(p\,\|\,q)\) and \(\mathrm{KL}(q\,\|\,p)\) in nats.`,
        answers: [{label: Q`\(\mathrm{KL}(p\,\|\,q)\)`, value: f, tol: .002}, {label: Q`\(\mathrm{KL}(q\,\|\,p)\)`, value: g, tol: .002}],
        hint: Q`\(\mathrm{KL}(p\,\|\,q)=\sum_k p_k\ln(p_k/q_k)\): the first argument supplies both the weights and the numerators.`,
        solution: Q`\(\mathrm{KL}(p\,\|\,q)=${t(p, q)}=${dec(f)}\). \(\mathrm{KL}(q\,\|\,p)=${t(q, p)}=${dec(g)}\). The two directions differ because each weights the log-ratios by its own first distribution.`};
    }},
    {key: 'smoothing-gap', skill: 'Find a smoothed target and its optimal logit gap', make(r) {
      const K = r.pick([2, 4, 5, 10]), eps = r.pick([.1, .2, .3, .4]), pt = 1 - eps + eps / K, pj = eps / K, gap = Math.log(pt / pj);
      return {prompt: Q`Label smoothing with ε = ${eps} over K = ${K} classes. Give the smoothed target for the true class and for one wrong class, \((p_t, p_j)\), and the logit gap \(z_t-z_j\) at which the cross-entropy is smallest.`,
        answers: [{label: Q`\((p_t, p_j)\)`, vector: [pt, pj], tol: 1e-4}, {label: Q`\(z_t-z_j\)`, value: gap}],
        hint: Q`\(p=(1-\varepsilon)y+\varepsilon/K\): every class receives \(\varepsilon/K\) and the true class also keeps \(1-\varepsilon\).`,
        solution: Q`\(p_t=1-${eps}+${eps}/${K}=${dec(pt)}\) and \(p_j=${eps}/${K}=${dec(pj)}\). Cross-entropy is smallest when \(q=p\), and a softmax has \(q_t/q_j=e^{z_t-z_j}\), so \(z_t-z_j=\ln(${dec(pt)}/${dec(pj)})=\ln ${dec(pt / pj, 3)}=${dec(gap)}\). With ε = 0 the gap would have to be infinite.`};
    }},
    {key: 'infonce-loss', skill: 'Compute an InfoNCE loss from cosine similarities', make(r) {
      const n = r.int(3, 5), tau = r.pick([.1, .2, .25, .5]), cap = Math.min(3, Math.floor(1 / tau + 1e-9)), negCap = Math.min(2, cap), pos = r.int(0, n - 1);
      const logits = Array.from({length: n}, (_, j) => j === pos ? r.int(1, cap) : r.int(-negCap, negCap));
      const sims = logits.map(l => dec(l * tau, 2)), loss = lse(logits) - logits[pos], sum = logits.reduce((t, l) => t + Math.exp(l - logits[pos]), 0);
      return {prompt: Q`An image embedding has cosine similarities \(s=(${sims.join(Q`,\ `)})\) with ${n} captions, and caption ${pos + 1} is its true partner. With temperature τ = ${tau}, compute the InfoNCE loss, then the loss if all ${n} similarities were equal.`,
        answers: [{label: Q`\(L\)`, value: loss, tol: .002, rel: .002}, {label: 'Loss with equal similarities', value: Math.log(n)}],
        hint: Q`Divide every similarity by τ to get logits; then \(L=\ln\sum_j e^{\ell_j}-\ell^+\), the softmax cross-entropy for the true caption.`,
        solution: Q`Logits \(s/\tau=(${logits.join(Q`,\ `)})\). \(L=\ln\sum_j e^{\ell_j-\ell^+}=\ln(${logits.map(l => Q`e^{${l - logits[pos]}}`).join('+')})=\ln ${dec(sum)}=${dec(loss)}\). With equal similarities every caption gets probability \(1/${n}\), so \(L=\ln ${n}=${dec(Math.log(n))}\): the chance level.${loss > Math.log(n) ? ' This loss is above chance: the true caption is no more similar than the others, so the softmax does worse than a uniform guess.' : ''}`};
    }},
  ];

  /* ---------- Lab: two distributions, then an image–caption batch ---------- */
  const SUB = ['₁', '₂', '₃', '₄'], ROWS = ['cat', 'coffee', 'bricks', 'camera'], COLS = ['“a cat”', '“a cup”', '“a wall”', '“a man”'];
  function syncInputs(root, s, keys) {
    keys.forEach(k => {
      const el = root.querySelector('#vk-' + k);
      if (el && Math.abs(Number(el.value) - s[k]) > 1e-9) { el.value = s[k]; const out = root.querySelector(`#vk-${k}-value`); if (out) out.textContent = window.CV_VISION.fmt(s[k]); }
    });
  }
  function targetP(s) {
    const base = s.ptype === 'bimodal' ? [.48, .02, .02, .48] : s.ptype === 'logits' ? softmax([s.a1, s.a2, s.a3, s.a4]) : [1, 0, 0, 0];
    return base.map(v => (1 - s.eps) * v + s.eps / 4);
  }
  function renderDist(s, root, V) {
    syncInputs(root, s, ['b1', 'b2', 'b3', 'b4', 'T']);
    const p = targetP(s), z = [s.b1, s.b2, s.b3, s.b4].map(v => v / s.T), lq = logSoftmax(z), q = lq.map(Math.exp);
    const u = s.units === 'bits' ? 1 / Math.LN2 : 1, unit = s.units === 'bits' ? 'bits' : 'nats', f = x => Number.isFinite(x) ? V.fmt(x * u, 3) : '∞';
    const Hp = entropy(p), Hq = entropy(q), CE = -p.reduce((t, v, k) => t + (v > 0 ? v * lq[k] : 0), 0);
    const Dpq = p.reduce((t, v, k) => t + (v > 0 ? v * (Math.log(v) - lq[k]) : 0), 0);
    const Dqp = q.reduce((t, v, k) => t + (p[k] > 0 ? v * (lq[k] - Math.log(p[k])) : Infinity), 0);
    const W = 560, H = 250, x0 = 40, x1 = 360, base = 196, top = 46, Y = v => base - v * (base - top), gw = (x1 - x0) / 4, bw = 26;
    let svg = `<svg class="vk-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bars for the target p and the model q over four classes, with cross-entropy split into entropy and KL divergence"><title>Target p, model q and the cross-entropy split</title>`;
    svg += `<rect x="${x0}" y="12" width="12" height="12" style="fill:var(--green)"/><text x="${x0 + 17}" y="22">target p (smoothed)</text><rect x="${x0 + 150}" y="12" width="12" height="12" style="fill:var(--orange);fill-opacity:.18;stroke:var(--orange);stroke-width:2"/><text x="${x0 + 167}" y="22">model q = softmax(z/T)</text>`;
    [0, .5, 1].forEach(v => { svg += `<line class="grid-line" x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; });
    svg += `<line class="axis-line" x1="${x0}" x2="${x1}" y1="${base}" y2="${base}"/>`;
    for (let k = 0; k < 4; k++) {
      const cx = x0 + gw * (k + .5), yp = Y(p[k]), yq = Y(q[k]);
      svg += `<rect x="${cx - bw - 1}" y="${yp.toFixed(1)}" width="${bw}" height="${(base - yp).toFixed(1)}" style="fill:var(--green)"/><rect x="${cx + 1}" y="${yq.toFixed(1)}" width="${bw}" height="${(base - yq).toFixed(1)}" style="fill:var(--orange);fill-opacity:.18;stroke:var(--orange);stroke-width:2"/>`;
      svg += `<text x="${cx - bw / 2 - 1}" y="${(yp - 4).toFixed(1)}" text-anchor="middle">${V.fmt(p[k], 2)}</text><text x="${cx + bw / 2 + 1}" y="${(yq - 4).toFixed(1)}" text-anchor="middle">${V.fmt(q[k], 2)}</text>`;
      svg += `<text x="${cx}" y="${base + 15}" text-anchor="middle" style="fill:var(--ink)">class ${k + 1}</text><text x="${cx}" y="${base + 30}" text-anchor="middle">${p[k] > 0 ? f(-p[k] * lq[k]) : '0'}</text>`;
    }
    svg += `<text x="${x0}" y="${base + 46}">bottom row: −pₖ ln qₖ, each class’s share of the cross-entropy (${unit})</text>`;
    const bx = 392, bwid = 34, maxV = Math.max(Math.log(4) * 1.1, CE * 1.05), S = v => base - Math.min(v, maxV) / maxV * (base - top);
    svg += `<rect x="${bx}" y="${S(Hp).toFixed(1)}" width="${bwid}" height="${(base - S(Hp)).toFixed(1)}" style="fill:var(--green)"/><rect x="${bx}" y="${S(CE).toFixed(1)}" width="${bwid}" height="${(S(Hp) - S(CE)).toFixed(1)}" style="fill:var(--orange);fill-opacity:.18;stroke:var(--orange);stroke-width:2"/>`;
    svg += `<line x1="${bx - 6}" x2="${bx + bwid + 6}" y1="${S(Math.log(4)).toFixed(1)}" y2="${S(Math.log(4)).toFixed(1)}" style="stroke:var(--blue);stroke-width:1.5;stroke-dasharray:5 4"/><line class="axis-line" x1="${bx - 8}" x2="${bx + bwid + 8}" y1="${base}" y2="${base}"/>`;
    svg += `<text x="${bx + bwid / 2}" y="${base + 15}" text-anchor="middle" style="fill:var(--ink)">H(p,q)</text>`;
    svg += `<text x="${bx + bwid + 12}" y="70" style="fill:var(--ink)">H(p,q) = ${f(CE)}</text><text x="${bx + bwid + 12}" y="96">= KL(p‖q) ${f(Dpq)}</text><text x="${bx + bwid + 12}" y="114">+ H(p) ${f(Hp)}</text><text x="${bx + bwid + 12}" y="150" style="fill:var(--blue)">dashes: ln 4,</text><text x="${bx + bwid + 12}" y="164" style="fill:var(--blue)">the largest H</text></svg>`;
    let msg;
    if (!Number.isFinite(Dqp)) msg = 'KL(q‖p) is infinite: q gives probability to a class where p has none, and every such class costs an unbounded log-ratio. Raise ε above 0 and it becomes finite.';
    else if (s.ptype === 'bimodal') {
      // Compare the two button presets in both directions for the current (smoothed) p.
      const qU = [.25, .25, .25, .25], qS = softmax([3.9, 0, 0, 0]), fU = kl(p, qU), fS = kl(p, qS), rU = kl(qU, p), rS = kl(qS, p);
      msg = `p has two modes. For the two button presets, forward KL(p‖q) is ${f(fU)} for the uniform q and ${f(fS)} for the sharp one, so it prefers ${fU <= fS ? 'covering both modes' : 'the single mode'}. Reverse KL(q‖p) is ${f(rU)} and ${f(rS)}, so it prefers ${rS < rU ? 'the single mode' : 'covering both modes'}.${rS < rU ? '' : ' Lower ε toward 0 and the reverse direction switches to the single mode.'} Your current q: forward ${f(Dpq)}, reverse ${f(Dqp)}.`;
    }
    else msg = `The two directions differ by ${f(Math.abs(Dpq - Dqp))} ${unit}. They agree only when q = p, where both are 0 and the cross-entropy equals H(p).`;
    root.querySelector('#en-dist').innerHTML = svg + `<p class="vk-callout">${msg}</p>`;
    return V.report([['H(p), target', f(Hp)], ['H(q), model', f(Hq)], ['Cross-entropy H(p,q)', f(CE)], ['KL(p‖q)', f(Dpq)], ['KL(q‖p)', f(Dqp)], ['Largest entropy, ln 4', f(Math.log(4))], ['Units', unit]]);
  }
  // Four image and four caption embeddings in 8 dimensions; caption i = image i + noise, then both are normalized.
  function batch(seed, noise, V) {
    const g = V.rng(5401 + seed), d = 8, gv = () => Array.from({length: d}, () => g.gauss());
    const X = Array.from({length: 4}, gv), Z = Array.from({length: 4}, gv), unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };
    const img = X.map(unit), txt = X.map((x, i) => unit(x.map((v, k) => v + noise * Z[i][k])));
    return img.map(a => txt.map(b => a.reduce((t, v, k) => t + v * b[k], 0)));
  }
  function heat(M, {title, signed, best, label}) {
    const cw = 56, ch = 40, L = 66, Tp = 34, W = L + 4 * cw + 6, H = Tp + 4 * ch + 8;
    let svg = `<svg class="vk-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(label)}"><title>${E(label)}</title><text x="${L}" y="12" style="fill:var(--ink)">${E(title)}</text>`;
    COLS.forEach((c, j) => { svg += `<text x="${L + cw * (j + .5)}" y="${Tp - 6}" text-anchor="middle">${E(c)}</text>`; });
    M.forEach((row, i) => {
      svg += `<text x="${L - 6}" y="${Tp + ch * (i + .5) + 4}" text-anchor="end">${ROWS[i]}</text>`;
      row.forEach((v, j) => {
        const x = L + cw * j, y = Tp + ch * i, color = signed ? (v >= 0 ? 'var(--blue)' : 'var(--orange)') : 'var(--green)', alpha = signed ? .08 + .62 * Math.min(1, Math.abs(v)) : .06 + .74 * v;
        svg += `<rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" style="fill:${color};fill-opacity:${alpha.toFixed(3)}"/>`;
        if (i === j) svg += `<rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="3" style="fill:none;stroke:var(--ink);stroke-width:1.6"/>`;
        svg += `<text x="${x + cw / 2}" y="${y + ch / 2 + 4}" text-anchor="middle" style="fill:var(--ink)${best && best(i, j) ? ';font-weight:700' : ''}">${v.toFixed(2)}</text>`;
      });
    });
    return svg + '</svg>';
  }
  function renderNce(s, root, V) {
    const S = batch(s.seed, s.noise, V), tau = s.tau, L = S.map(r => r.map(v => v / tau)), cols = [0, 1, 2, 3].map(j => L.map(r => r[j]));
    const rowP = L.map(softmax), colP = cols.map(softmax), shown = s.view === 't2i' ? S.map((r, i) => r.map((_, j) => colP[j][i])) : rowP;
    const rowLoss = L.map((r, i) => lse(r) - r[i]), colLoss = cols.map((c, j) => lse(c) - c[j]);
    const mean = a => a.reduce((t, v) => t + v, 0) / a.length, i2t = mean(rowLoss), t2i = mean(colLoss), sym = (i2t + t2i) / 2;
    const argmax = a => a.indexOf(Math.max(...a));
    const best = s.view === 't2i' ? (i, j) => argmax(colP[j]) === i : (i, j) => argmax(rowP[i]) === j;
    const correct = s.view === 't2i' ? colP.filter((c, j) => argmax(c) === j).length : rowP.filter((r, i) => argmax(r) === i).length;
    const losses = s.view === 't2i' ? colLoss : rowLoss, floor = Math.log(1 + 3 * Math.exp(-2 / tau));
    root.querySelector('#en-nce').innerHTML = `<div class="vk-pair">${heat(S, {title: 'Cosine similarity S (rows: images)', signed: true, label: 'Four by four matrix of cosine similarities between image and caption embeddings; the outlined diagonal holds the true pairs'})}${heat(shown, {title: s.view === 't2i' ? 'softmax(S/τ) down each column' : 'softmax(S/τ) along each row', signed: false, best, label: 'The InfoNCE softmax probabilities as a heat-map; bold marks the most probable match'})}</div>` +
      `<p class="vk-callout">${s.view === 't2i' ? 'Caption' : 'Image'} losses Lᵢ = −ln(diagonal probability): <strong>${losses.map(v => V.fmt(v, 3)).join(', ')}</strong>. Lowest possible at τ = ${V.fmt(tau, 2)}, with s⁺ = 1 and every other cosine −1: ln(1 + 3e^(−2/τ)) = <strong>${V.fmt(floor, 4)}</strong>. Blue cells are positive cosines, orange negative; outlined cells are the true pairs.</p>`;
    return V.report([['Mean loss, image → caption', V.fmt(i2t, 3)], ['Mean loss, caption → image', V.fmt(t2i, 3)], ['Symmetric CLIP loss', V.fmt(sym, 3)], ['Chance level ln 4', V.fmt(Math.log(4), 3)], ['Correct top-1 matches', `${correct} of 4`], ['ln 4 − loss (information bound)', V.fmt(Math.log(4) - sym, 3) + ' nats']]);
  }
  const lab = {
    name: 'entropy', title: 'Entropy, KL and InfoNCE',
    heading: 'Compare two distributions. Then score a batch.',
    intro: 'First mode: a target p and a model q over four classes. Smooth p, soften q with a temperature, and read entropy, cross-entropy and both KL directions. Second mode: four image–caption pairs, their cosine similarities and the InfoNCE softmax.',
    defaults: {mode: 'dist', ptype: 'onehot', a1: 2, a2: .5, a3: 0, a4: -1, eps: .1, b1: 1.5, b2: 1, b3: 0, b4: -.5, T: 1, units: 'nats', tau: .1, noise: 1.2, view: 'i2t', seed: 1},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('mode', 'Experiment', [['dist', 'Two distributions p and q'], ['infonce', 'Contrastive batch (InfoNCE)']], s.mode) +
        '<div data-show-when="mode:dist">' +
        select('ptype', 'Target p before smoothing', [['onehot', 'One-hot on class 1'], ['bimodal', 'Two modes: (0.48, 0.02, 0.02, 0.48)'], ['logits', 'Softmax of target logits']], s.ptype) +
        `<div data-show-when="ptype:logits">${[1, 2, 3, 4].map(k => range('a' + k, `Target logit ${k}`, -4, 4, .1, s['a' + k])).join('')}</div>` +
        range('eps', 'Label smoothing ε on p', 0, .5, .01, s.eps) +
        [1, 2, 3, 4].map(k => range('b' + k, `Model logit z${SUB[k - 1]}`, -4, 4, .1, s['b' + k])).join('') +
        range('T', 'Temperature T on q', .2, 5, .05, s.T) +
        select('units', 'Units', [['nats', 'nats (natural log)'], ['bits', 'bits (log base 2)']], s.units) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="cover">q uniform: cover every class</button><button type="button" class="btn" data-vk-action="sharp">q on one sharp mode</button></div>' +
        '<div class="math-rule">H(p,q) = H(p) + KL(p‖q),  KL(p‖q) = Σₖ pₖ ln(pₖ / qₖ) ≥ 0</div></div>' +
        '<div data-show-when="mode:infonce">' +
        range('tau', 'Temperature τ', .02, 1, .01, s.tau) +
        range('noise', 'Caption noise (0: each caption matches its image)', 0, 3, .05, s.noise) +
        select('view', 'Softmax direction', [['i2t', 'Rows: each image picks a caption'], ['t2i', 'Columns: each caption picks an image']], s.view) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New batch ↻</button></div>' +
        '<div class="math-rule">Lᵢ = −ln( exp(Sᵢᵢ/τ) / Σⱼ exp(Sᵢⱼ/τ) ),  Sᵢⱼ = cos(imageᵢ, captionⱼ)</div></div>';
    },
    visual: () => '<div id="en-dist" data-show-when="mode:dist"></div><div id="en-nce" data-show-when="mode:infonce"></div>',
    note: 'Predict first: with p one-hot and ε = 0, what is KL(q‖p)? Infinite, because q puts probability where p has none; any ε > 0 makes it finite. With two modes in p and little smoothing, a uniform q has the smaller forward KL(p‖q) but a single sharp mode has the smaller reverse KL(q‖p). In the contrastive batch, lower τ and watch the diagonal take over each row. At τ = 1 the loss cannot fall below ln(1 + 3e⁻²) ≈ 0.34, because cosines stay in [−1, 1]. The embeddings are random vectors standing in for an image and a text encoder.',
    render(s, root) { const V = window.CV_VISION; return s.mode === 'infonce' ? renderNce(s, root, V) : renderDist(s, root, V); },
    action(name, s) {
      if (name === 'reseed') s.seed++;
      if (name === 'cover') { s.b1 = s.b2 = s.b3 = s.b4 = 0; s.T = 1; }
      if (name === 'sharp') { s.b1 = 3.9; s.b2 = s.b3 = s.b4 = 0; s.T = 1; }
    },
  };

  window.CV_EXTEND.lesson(54, {
    teaching: {
      equation: Q`H(p,q)=-\sum_k p_k\ln q_k=H(p)+\mathrm{KL}(p\,\|\,q),\qquad \mathrm{KL}(p\,\|\,q)=\sum_k p_k\ln\frac{p_k}{q_k}\ge0`,
      symbols: [['H(p)', 'entropy of the target'], ['H(p,q)', 'cross-entropy'], ['KL(p‖q)', 'Kullback–Leibler divergence'], ['ε', 'label-smoothing amount'], ['τ', 'contrastive temperature']],
      connection: 'Classification heads, label smoothing, knowledge distillation and contrastive pre-training such as SimCLR and CLIP all minimize a cross-entropy, so each one is a KL divergence between a target distribution and a softmax.',
      trap: 'KL divergence is not a distance: KL(p‖q) and KL(q‖p) usually differ, and the direction you minimize decides whether the model spreads over every mode or locks onto one.',
      question: 'The target is one-hot. How are cross-entropy and KL divergence related?',
      choices: ['They are equal, because a one-hot target has entropy 0', 'Cross-entropy is KL plus ln K', 'Cross-entropy is KL minus the entropy of the prediction'], correct: 0,
      explanation: 'H(p,q) = H(p) + KL(p‖q), and a one-hot p has H(p) = −1·ln 1 = 0. So the usual classification loss −ln q_t is exactly KL(p‖q).',
    },
    guide: {
      title: 'Cross-entropy is unavoidable surprise plus mismatch',
      paragraphs: [
        'Entropy H(p) is the average surprise −ln p of outcomes drawn from p: zero for a certain outcome, ln K for a uniform guess over K classes. Cross-entropy H(p,q) is the average surprise when you score those outcomes with a model q, and it always splits into H(p) plus the KL divergence KL(p‖q) ≥ 0.',
        'With the target fixed, H(p) is a constant, so training on cross-entropy shrinks the KL divergence. Label smoothing and distillation change the target; contrastive losses such as InfoNCE build the target from a batch, where each image must pick its own caption from a softmax over cosine similarities divided by a temperature τ.',
      ],
      example: 'Smooth a one-hot label and score a fixed prediction',
      controls: [{label: 'Label smoothing ε', min: 0, max: .5, step: .05, value: .1}, {label: 'Number of classes K', min: 2, max: 10, step: 1, value: 4}, {label: 'True-class logit z₁ (others 0)', min: 0, max: 8, step: .5, value: 5}],
      predict: 'As the true-class logit grows, does the smoothed cross-entropy keep falling?',
      takeaway: 'Cross-entropy cannot fall below the entropy of its target. With a smoothed target the KL part reaches zero at a finite logit gap ln(p₁/p_j), so the loss stops rewarding ever larger logits.',
      notation: 'p is the target distribution and q the model’s softmax. Logarithms are natural, giving nats; divide by ln 2 for bits. KL(p‖q) weights each log-ratio by its first argument, so the order matters. ε spreads label mass over K classes, and τ divides cosine similarities in a contrastive loss.',
    },
    notation: {
      'H(p)': {tex: 'H(p)', detail: 'Entropy: the average surprise −Σ pₖ ln pₖ of outcomes drawn from p, with 0 ln 0 = 0. It is 0 for a one-hot distribution and ln K for a uniform one over K classes. Here H is not a Hessian.'},
      'H(p,q)': {tex: 'H(p,q)', detail: 'Cross-entropy: the average surprise −Σ pₖ ln qₖ when outcomes follow p but are scored by q. It equals H(p) + KL(p‖q), so it is never below the entropy of the target.'},
      'KL(p‖q)': {tex: Q`\mathrm{KL}(p\,\|\,q)`, detail: 'Kullback–Leibler divergence Σ pₖ ln(pₖ/qₖ). It is at least 0, equals 0 only when q = p, and is not symmetric. It is infinite if q gives zero probability to a class that p allows.'},
      'ε': {tex: Q`\varepsilon`, detail: 'The label-smoothing amount. The smoothed target is (1 − ε)y + ε/K: every class receives ε/K and the true class also keeps 1 − ε.'},
      'τ': {tex: Q`\tau`, detail: 'The temperature that divides similarities before the softmax in a contrastive loss. Small τ sharpens the softmax; because cosines lie in [−1, 1], τ sets how confident the loss can become.'},
    },
    calculate, practice, lab,
  });
})();
