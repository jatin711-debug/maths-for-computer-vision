/* Lesson 55: attention and vision transformers. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  // Plain-text number (details, captions, SVG) and TeX number (equations).
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Math.abs(x) < 10 ** -d ? x.toExponential(2) : Number(x.toFixed(d)).toString();
  const T = (x, d = 3) => {
    if (Math.abs(x) < 1e-12) return '0';
    if (Math.abs(x) < 10 ** -d) { const [m, e] = x.toExponential(2).split('e'); return Q`${m}\times10^{${Number(e)}}`; }
    return Number(x.toFixed(d)).toString();
  };
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const col = v => Q`\begin{bmatrix}${v.map(x => T(x)).join(Q`\\`)}\end{bmatrix}`;
  const lse = z => { const m = Math.max(...z); return m + Math.log(z.reduce((t, v) => t + Math.exp(v - m), 0)); };
  const softmax = z => { const l = lse(z); return z.map(v => Math.exp(v - l)); };
  const dot = (a, b) => a.reduce((t, v, i) => t + v * b[i], 0);

  // Worked example: d = 4, one query q = c (q1, 1, 1, 0) against three fixed keys, with 2D values for drawing.
  const KEYS = [[1, 0, 0, 1], [0, 1, 1, 0], [-1, 0, 1, 1]], VALUES = [[1, 0], [0, 1], [-1, -1]];
  function model(p) {
    const [q1, useScale, c] = p, scaled = useScale >= .5, q = [q1, 1, 1, 0].map(v => c * v), d = 4;
    const s = KEYS.map(k => dot(k, q)), logits = s.map(v => scaled ? v / Math.sqrt(d) : v), a = softmax(logits);
    const o = [0, 1].map(m => a.reduce((t, w, j) => t + w * VALUES[j][m], 0)), H = -a.reduce((t, w) => t + (w > 0 ? w * Math.log(w) : 0), 0);
    return {q1, c, scaled, q, s, logits, a, o, H, eff: Math.exp(H)};
  }
  function drawing(m) {
    const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', weight = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}>${E(s)}</text>`;
    let body = txt(20, 24, `Weights a = softmax(s${m.scaled ? '/√d' : ''}) for one query`, '#172623', 14);
    const bx = 92, bw = 170;
    m.a.forEach((w, j) => {
      const y = 62 + j * 52;
      body += txt(20, y + 15, `key ${j + 1}`, '#172623', 13, 'start', '600');
      body += txt(bx, y - 6, `s = ${N(m.s[j])}${m.scaled ? `  →  s/2 = ${N(m.logits[j])}` : '  (not scaled)'}`, '#315c86', 11);
      body += `<rect x="${bx}" y="${y}" width="${bw}" height="20" rx="3" fill="none" stroke="#a8b6a5"/><rect x="${bx}" y="${y}" width="${(bw * w).toFixed(1)}" height="20" rx="3" fill="#bd431c"/>`;
      body += txt(bx + bw + 8, y + 15, N(w), '#bd431c', 13, 'start', '700');
    });
    body += txt(20, 214, `entropy H = ${N(m.H)} nats`, '#64736b', 12) + txt(20, 232, `effective number exp(H) = ${N(m.eff, 2)} of 3`, '#64736b', 12);
    // Value space: the output is a convex combination of the three value vectors.
    const cx = 440, cy = 128, k = 64, X = v => cx + v * k, Y = v => cy - v * k;
    body += `<path d="M${X(-1.5)} ${Y(0)}H${X(1.5)}M${X(0)} ${Y(1.5)}V${Y(-1.5)}" stroke="#a8b6a5"/>`;
    body += `<path d="M${VALUES.map(v => `${X(v[0])} ${Y(v[1])}`).join('L')}Z" fill="#34734e14" stroke="#34734e" stroke-dasharray="5 4"/>`;
    VALUES.forEach((v, j) => {
      body += `<path d="M${X(m.o[0]).toFixed(1)} ${Y(m.o[1]).toFixed(1)}L${X(v[0])} ${Y(v[1])}" stroke="#bd431c" stroke-opacity=".55" stroke-width="${(1 + 6 * m.a[j]).toFixed(2)}"/>`;
      body += `<circle cx="${X(v[0])}" cy="${Y(v[1])}" r="6" fill="#34734e"/>` + txt(X(v[0]) + (v[0] < 0 ? -10 : 10), Y(v[1]) + (v[1] < 0 ? 16 : -8), `v${j + 1}`, '#34734e', 13, v[0] < 0 ? 'end' : 'start', '700');
    });
    const right = m.o[0] > .2;
    body += `<circle cx="${X(m.o[0]).toFixed(1)}" cy="${Y(m.o[1]).toFixed(1)}" r="7" fill="#bd431c"/>` + txt((X(m.o[0]) + (right ? -10 : 10)).toFixed(1), (Y(m.o[1]) + 20).toFixed(1), `o = (${N(m.o[0], 2)}, ${N(m.o[1], 2)})`, '#bd431c', 12, right ? 'end' : 'start', '700');
    body += txt(cx, 24, 'Values and the output o = Σ aⱼvⱼ', '#172623', 13, 'middle');
    return {body, caption: `Left: the three attention weights (they sum to 1)${m.scaled ? ' after dividing the scores by √d = 2' : ' with no √d scaling'}. Right: values v₁, v₂, v₃ (green) and the output o (orange), a weighted average that always lies inside their triangle; thicker lines carry larger weights.`};
  }
  function calculate(p) {
    const m = model(p), [a1, a2, a3] = m.a;
    return {
      steps: [
        step('Score the query against each key', Q`s=Kq=\begin{bmatrix}1&0&0&1\\0&1&1&0\\-1&0&1&1\end{bmatrix}${col(m.q)}=${col(m.s)}`, `The query is q = ${N(m.c)} × (${N(m.q1)}, 1, 1, 0). Each row of K is one key, so each score is a dot product: it is large when the key points the same way as the query.`),
        m.scaled
          ? step('Divide by √d', Q`\ell=\frac{s}{\sqrt d}=\frac{s}{\sqrt4}=(${m.logits.map(x => T(x)).join(',\ ')})`, 'With d = 4 the scores are halved. For entries with variance 1, a dot product of d terms has variance d, so this division keeps the softmax inputs near unit scale whatever the head width.')
          : step('Skip the √d division', Q`\ell=s=(${m.logits.map(x => T(x)).join(',\ ')})\quad\text{(not divided by }\sqrt d\text{)}`, 'Without the division the softmax receives the raw dot products. In wide heads these spread out like √d, which pushes the softmax toward a one-hot row.'),
        step('Softmax along the row', Q`a_j=\frac{e^{\ell_j}}{\sum_m e^{\ell_m}}=(${T(a1)},\ ${T(a2)},\ ${T(a3)}),\qquad\sum_ja_j=1`, `The weights are positive and sum to 1. Their entropy, \\(H=-\\sum_ja_j\\ln a_j\\), measures how spread out they are (Lesson 54 develops it). It is ${N(m.H)} nats, so the query effectively attends to exp(H) = ${N(m.eff, 2)} of the 3 keys.`),
        step('Average the values', Q`o=\sum_ja_jv_j=${T(a1)}${col(VALUES[0])}+${T(a2)}${col(VALUES[1])}+${T(a3)}${col(VALUES[2])}=${col(m.o)}`, 'The output is a convex combination of the value vectors, so it always lies inside their triangle. A one-hot row would simply copy one value; an even row averages all three.'),
      ],
      values: [['Weight a1', a1], ['Weight a2', a2], ['Weight a3', a3], ['Output o1', m.o[0]], ['Output o2', m.o[1]], ['Effective number exp(H)', m.eff]],
      note: 'Switch off the √d division or raise the query scale: the logits spread out, the weights approach one-hot and the effective number falls toward 1.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 4) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.join(', ')})`;
  const big = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  const practice = [
    {key: 'vit-tokens', skill: 'Count ViT tokens and attention entries', make(r) {
      const P = r.pick([8, 14, 16, 32]), mh = r.int(4, 16), mw = r.bool() ? mh : r.int(4, 16), H = P * mh, W = P * mw, n = mh * mw;
      return {prompt: Q`A ViT cuts a ${H} × ${W} × 3 image into ${P} × ${P} patches and adds one class token. How many patch tokens N are there, how many numbers does each flattened patch hold, and how many entries does one head's attention matrix have?`,
        answers: [{label: 'Patch tokens N', value: n, tol: 0}, {label: 'Numbers per flattened patch', value: 3 * P * P, tol: 0}, {label: 'Attention-matrix entries per head', value: (n + 1) ** 2, tol: 0}],
        hint: 'Patches per side = side length ÷ patch size. Multiply the two counts, then remember the class token before squaring.',
        solution: Q`\(${H}/${P}=${mh}\) and \(${W}/${P}=${mw}\), so \(N=${mh}\cdot${mw}=${n}\). Each patch holds \(${P}\cdot${P}\cdot3=${3 * P * P}\) numbers. With the class token there are ${n + 1} tokens, and every token scores every token: \(${n + 1}^2=${big((n + 1) ** 2)}\) entries per head.`};
    }},
    {key: 'attention-row', skill: 'Compute one row of scaled dot-product attention', make(r) {
      const n = r.int(2, 3);
      let q, keys, s;
      do {
        q = Array.from({length: 4}, () => r.int(-1, 2));
        keys = Array.from({length: n}, () => Array.from({length: 4}, () => r.int(-1, 1)));
        s = keys.map(k => dot(q, k));
      } while (q.every(v => v === 0) || new Set(s).size === 1);
      const vals = Array.from({length: n}, () => r.int(-3, 5)), l = s.map(v => v / 2), a = softmax(l), out = dot(a, vals), ex = l.map(Math.exp), Z = ex.reduce((t, v) => t + v, 0);
      return {prompt: Q`With d = 4, a query \(q=${tup(q)}\) meets ${n} keys ${keys.map((k, j) => Q`\(k_${j + 1}=${tup(k)}\)`).join(', ')} with scalar values \(v=${tup(vals)}\). Compute the weights \(\operatorname{softmax}(q^Tk_j/\sqrt d)\) and the output \(\sum_j a_jv_j\).`,
        answers: [{label: Q`\((a_1, \ldots, a_${n})\)`, vector: a, tol: .002}, {label: 'Output', value: out, tol: .01}],
        hint: Q`Score each key with a dot product, divide by \(\sqrt4=2\), then apply the softmax.`,
        solution: Q`Scores \(q^Tk_j=${tup(s)}\); divided by 2: \(${tup(l)}\). Exponentials \(${tup(ex.map(v => dec(v)))}\) sum to \(${dec(Z)}\), so \(a=${tup(a.map(v => dec(v)))}\). Output \(${a.map((w, j) => Q`${dec(w)}\cdot(${vals[j]})`).join('+')}=${dec(out)}\).`};
    }},
    {key: 'sqrt-d', skill: 'Find the spread of dot-product scores', make(r) {
      const d = r.pick([16, 36, 64, 100, 144, 256, 400, 576, 1024]), vq = r.pick([1, 4]), vk = r.pick([1, 4]), raw = Math.sqrt(d * vq * vk), scaled = Math.sqrt(vq * vk);
      return {prompt: Q`The entries of q and k are independent with mean 0. Each entry of q has variance ${vq}, each entry of k has variance ${vk}, and d = ${d}. What is the standard deviation of \(q^Tk\), and of \(q^Tk/\sqrt d\)?`,
        answers: [{label: Q`SD of \(q^Tk\)`, value: raw, tol: 0}, {label: Q`SD of \(q^Tk/\sqrt d\)`, value: scaled, tol: 0}],
        hint: Q`Each product \(q_mk_m\) has mean 0 and variance \(\operatorname{Var}(q_m)\operatorname{Var}(k_m)\); variances of independent terms add.`,
        solution: Q`\(\operatorname{Var}(q^Tk)=d\cdot${vq}\cdot${vk}=${d * vq * vk}\), so the standard deviation is \(\sqrt{${d * vq * vk}}=${raw}\). Dividing by \(\sqrt d=${Math.sqrt(d)}\) divides it by ${Math.sqrt(d)}: \(${raw}/${Math.sqrt(d)}=${scaled}\), which no longer depends on d.`};
    }},
    {key: 'multihead', skill: 'Size the matrices of multi-head attention', make(r) {
      const [D, h] = r.pick([[192, 3], [384, 6], [768, 12], [1024, 16], [768, 8], [512, 8], [256, 4], [384, 12], [1280, 16]]), d = D / h;
      return {prompt: Q`A multi-head attention layer has model width D = ${D} and h = ${h} heads, and the head outputs are concatenated and mixed by \(W_O\). What is the width d of each head, and how many weights do \(W_Q\), \(W_K\), \(W_V\) and \(W_O\) hold together for all heads (ignore biases)?`,
        answers: [{label: 'Head width d', value: d, tol: 0}, {label: 'Weights', value: 4 * D * D, tol: 0}],
        hint: Q`Each head maps D features to d = D/h. Stack the h heads side by side and each of Q, K and V becomes one D × D matrix.`,
        solution: Q`\(d=${D}/${h}=${d}\), so scores are divided by \(\sqrt{${d}}\). Per head, \(W_Q\), \(W_K\) and \(W_V\) are ${D} × ${d}; across ${h} heads each becomes ${D} × ${D}. With \(W_O\) (${D} × ${D}) the total is \(4D^2=4\cdot${D}^2=${big(4 * D * D)}\). The count does not depend on h: more heads means narrower heads.`};
    }},
  ];

  /* ---------- Lab: patch tokens of the cat photo, one query row at a time ---------- */
  const COLS = 14, ROWS = 10, PATCH = 16, OMEGA = [Math.PI / 16, Math.PI / 8, Math.PI / 4];
  const FEATS = {
    all: {keys: ['r', 'g', 'b', 'bright', 'energy', 'o1', 'o2'], label: 'Colour, brightness and texture (d = 7)'},
    colour: {keys: ['r', 'g', 'b'], label: 'Mean colour R, G, B (d = 3)'},
    texture: {keys: ['energy', 'o1', 'o2'], label: 'Gradient energy and orientation (d = 3)'},
    bright: {keys: ['bright'], label: 'Brightness only (d = 1)'},
  };
  const FEATURE_NAMES = {r: 'red', g: 'green', b: 'blue', bright: 'brightness', energy: 'gradient energy', o1: 'orientation cos 2θ', o2: 'orientation sin 2θ'};
  function syncInputs(root, s, keys) {
    keys.forEach(k => {
      const el = root.querySelector('#vk-' + k);
      if (el && Number(el.value) !== s[k]) { el.value = s[k]; const out = root.querySelector(`#vk-${k}-value`); if (out) out.textContent = window.CV_VISION.fmt(s[k]); }
    });
  }
  const lab = {
    name: 'attention', title: 'Attention over image patches', photo: 'cat',
    heading: 'Pick a patch. See where it looks.',
    intro: 'The 224 × 160 photo becomes 14 × 10 = 140 tokens of 16 × 16 pixels. Each token is a short vector of hand-made features, standardized over the 140 patches; a trained ViT learns hundreds of features per patch instead. Here W_Q = W_K = I, so a score is the dot product of two feature vectors.',
    defaults: {feat: 'all', T: 1, scale: true, pos: 0, qc: 11, qr: 5},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return select('feat', 'Patch features', Object.entries(FEATS).map(([k, v]) => [k, v.label]), s.feat) +
        range('T', 'Temperature T', .1, 5, .05, s.T) + check('scale', 'Divide scores by √d', s.scale) +
        range('pos', 'Positional-encoding strength β', 0, 2, .05, s.pos) +
        range('qc', 'Query patch column', 1, COLS, 1, s.qc) + range('qr', 'Query patch row', 1, ROWS, 1, s.qr) +
        '<div class="math-rule">aⱼ = softmax over j of (x_q·xⱼ + p_q·pⱼ) / (√d · T)</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div class="vk-pair">${figure('at-photo', 'Click or drag to choose the query patch (orange). Dimmed patches receive little attention; green dashes mark the largest weight.', 'vk-clickable')}${figure('at-heat', 'The same attention row as a heat-map, scaled to its largest weight (black: near 0).', 'vk-clickable')}</div><div id="at-info"></div>`;
    },
    note: 'Predict first: switch off the √d division with all seven features. Does the row become sharper or flatter? Sharper, because every score grows by √7 ≈ 2.6. Dot products reward alignment and length, not closeness, so patches with strongly expressed features, such as the eyes, attract attention from many queries; a trained ViT also learns W_Q ≠ W_K, so a patch need not match itself best. Raise the positional strength and attention gathers around the query, the kind of locality a ViT must learn from its positional embeddings. With β = 0, shuffling the patches would only shuffle this map.',
    async setup() {
      const V = window.CV_VISION, img = await V.load('cat'), {w, h, gray, rgba} = img, n = COLS * ROWS, P = PATCH;
      const raw = {r: [], g: [], b: [], bright: [], energy: [], o1: [], o2: []};
      const at = (x, y) => gray[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
      for (let pr = 0; pr < ROWS; pr++) for (let pc = 0; pc < COLS; pc++) {
        let sr = 0, sg = 0, sb = 0, sy = 0, jxx = 0, jyy = 0, jxy = 0;
        for (let y = pr * P; y < pr * P + P; y++) for (let x = pc * P; x < pc * P + P; x++) {
          const i = y * w + x, gx = (at(x + 1, y) - at(x - 1, y)) / 2, gy = (at(x, y + 1) - at(x, y - 1)) / 2;
          sr += rgba[4 * i]; sg += rgba[4 * i + 1]; sb += rgba[4 * i + 2]; sy += gray[i];
          jxx += gx * gx; jyy += gy * gy; jxy += gx * gy;
        }
        const m = P * P, tr = jxx + jyy + 1e-9;
        raw.r.push(sr / m / 255); raw.g.push(sg / m / 255); raw.b.push(sb / m / 255); raw.bright.push(sy / m / 255);
        // Structure tensor: (Jxx − Jyy, 2Jxy) / (Jxx + Jyy) is the dominant gradient orientation (as 2θ) times its coherence.
        raw.energy.push(Math.log1p((jxx + jyy) / m)); raw.o1.push((jxx - jyy) / tr); raw.o2.push(2 * jxy / tr);
      }
      const z = {};
      for (const [k, v] of Object.entries(raw)) { const mu = v.reduce((t, x) => t + x, 0) / n, sd = Math.sqrt(v.reduce((t, x) => t + (x - mu) ** 2, 0) / n) || 1; z[k] = v.map(x => (x - mu) / sd); }
      return {img, n, z};
    },
    render(s, root, {img, n, z}) {
      const V = window.CV_VISION, P = PATCH, keys = FEATS[s.feat].keys, d = keys.length;
      syncInputs(root, s, ['qc', 'qr']);
      const qc = s.qc - 1, qr = s.qr - 1, qi = qr * COLS + qc, X = Array.from({length: n}, (_, i) => keys.map(k => z[k][i]));
      // Appended position features p with p_q·p_j = β² (d/6) Σ_ω [cos ω Δcolumn + cos ω Δrow]: largest for nearby patches.
      const pw = s.pos * s.pos * d / 6, posSim = j => { const dc = j % COLS - qc, dr = Math.floor(j / COLS) - qr; return OMEGA.reduce((t, o) => t + Math.cos(o * dc) + Math.cos(o * dr), 0); };
      const div = (s.scale ? Math.sqrt(d) : 1) * s.T, scores = X.map((x, j) => (dot(x, X[qi]) + pw * posSim(j)) / div), a = softmax(scores);
      const amax = Math.max(...a), top = a.indexOf(amax), H = -a.reduce((t, w) => t + (w > 0 ? w * Math.log(w) : 0), 0);
      const where = i => `column ${i % COLS + 1}, row ${Math.floor(i / COLS) + 1}`;
      // Photo with a spotlight: each patch is dimmed by how far its weight is below the largest one.
      const photo = root.querySelector('#at-photo');
      V.showRGBA(photo, img.rgba, img.w, img.h);
      const ctx = photo.getContext('2d');
      for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(0,0,0,${(.8 * (1 - Math.sqrt(a[i] / amax))).toFixed(3)})`; ctx.fillRect(i % COLS * P, Math.floor(i / COLS) * P, P, P); }
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = .6; ctx.beginPath();
      for (let c = 1; c < COLS; c++) { ctx.moveTo(c * P, 0); ctx.lineTo(c * P, img.h); }
      for (let r = 1; r < ROWS; r++) { ctx.moveTo(0, r * P); ctx.lineTo(img.w, r * P); }
      ctx.stroke();
      const box = (g, i, color, dash) => { g.setLineDash(dash); g.strokeStyle = color; g.lineWidth = 2; g.strokeRect(i % COLS * P + 1, Math.floor(i / COLS) * P + 1, P - 2, P - 2); g.setLineDash([]); };
      if (top !== qi) box(ctx, top, '#3fae6a', [4, 2]);
      box(ctx, qi, '#e8743b', []);
      // Heat-map of the same row, using the warm ramp of the other experiments.
      const heat = root.querySelector('#at-heat');
      heat.width = img.w; heat.height = img.h;
      const hx = heat.getContext('2d');
      for (let i = 0; i < n; i++) { const t = a[i] / amax; hx.fillStyle = `rgb(${Math.round(255 * Math.min(1, t * 1.6))},${Math.round(255 * V.clamp(t * 1.6 - .45, 0, 1))},${Math.round(255 * V.clamp(t * 2.2 - 1.2, 0, 1))})`; hx.fillRect(i % COLS * P, Math.floor(i / COLS) * P, P, P); }
      if (top !== qi) box(hx, top, '#3fae6a', [4, 2]);
      box(hx, qi, '#7fb8df', []);
      const ranked = a.map((w, i) => [w, i]).sort((u, v) => v[0] - u[0]).slice(0, 5);
      root.querySelector('#at-info').innerHTML = `<p class="vk-callout">Query features (standardized): ${keys.map(k => `${FEATURE_NAMES[k]} <strong>${V.fmt(z[k][qi], 2)}</strong>`).join(', ')}. Largest weights: ${ranked.map(([w, i]) => `${i === qi ? 'itself' : `(${i % COLS + 1}, ${Math.floor(i / COLS) + 1})`} <strong>${V.fmt(w, 3)}</strong>`).join(' · ')}. Positions are (column, row).</p>`;
      return V.report([['Query patch', where(qi)], ['Largest weight', `${V.fmt(amax, 3)} at ${top === qi ? 'the query itself' : where(top)}`], ['Weight on itself', V.fmt(a[qi], 3)], ['Row entropy H', `${V.fmt(H, 3)} nats (at most ln 140 = ${V.fmt(Math.log(n), 3)})`], ['Effective patches exp(H)', `${V.fmt(Math.exp(H), 1)} of ${n}`], ['Feature dimension d', String(d)], ['Scores divided by', `${s.scale ? '√d · T' : 'T'} = ${V.fmt(div, 3)}`]]);
    },
    wire(root, s, rerender) {
      const pick = e => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const qc = Math.min(COLS, Math.max(1, Math.floor((e.clientX - rect.left) / rect.width * COLS) + 1)), qr = Math.min(ROWS, Math.max(1, Math.floor((e.clientY - rect.top) / rect.height * ROWS) + 1));
        if (qc !== s.qc || qr !== s.qr) { s.qc = qc; s.qr = qr; rerender(); }
      };
      ['#at-photo', '#at-heat'].forEach(sel => {
        const el = root.querySelector(sel);
        if (!el) return;
        el.style.touchAction = 'none';
        el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); pick(e); });
        el.addEventListener('pointermove', e => { if (el.hasPointerCapture?.(e.pointerId)) pick(e); });
      });
    },
  };

  window.CV_EXTEND.lesson(55, {
    teaching: {
      equation: Q`\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt d}\right)V,\qquad Q=XW_Q,\ K=XW_K,\ V=XW_V`,
      symbols: [['Q, K, V', 'queries, keys and values'], ['A', 'attention weights'], ['√d', 'score scaling'], ['X', 'token matrix'], ['N', 'number of tokens']],
      connection: 'Vision transformers, DETR-style detectors and transformer segmentation models all compute softmax(QKᵀ/√d)V over image tokens, so any patch can draw information from any other patch in a single layer.',
      trap: 'Leaving out the √d: raw dot products grow with the head width, the softmax saturates into a near one-hot row, and the keys that lose receive almost no gradient.',
      question: 'Without positional embeddings, what happens to the outputs of a self-attention layer if you shuffle the order of its input tokens?',
      choices: ['They are shuffled in exactly the same way', 'They stay in the original order, unchanged', 'They change in a way that depends on the image'], correct: 0,
      explanation: 'Permuting the rows of X permutes the rows and columns of QKᵀ and the rows of V together, so Attention(PX) = P Attention(X). The layer treats the tokens as a set; positional embeddings are what tell it where each patch was.',
    },
    guide: {
      title: 'Every token takes a weighted average of every token',
      paragraphs: [
        'A vision transformer cuts an image into patches, flattens each into a vector and embeds it with one shared matrix, adding a positional embedding so that location is not lost. Each token then asks a question (its query), advertises what it holds (its key) and offers content (its value).',
        'Scaled dot-product attention scores every query against every key, divides by √d so the scores do not grow with the head width, and turns each row into weights with a softmax. The output for a token is the weighted average of all value vectors, recomputed for every image.',
      ],
      example: 'One query, three keys: score, scale, softmax, mix',
      controls: [{label: 'Query coordinate q₁', min: -2, max: 4, step: .5, value: 3}, {label: 'Divide by √d (1 = yes, 0 = no)', min: 0, max: 1, step: 1, value: 1}, {label: 'Query scale c', min: .5, max: 3, step: .5, value: 1}],
      predict: 'Switch off the √d division. Will the three weights become more even or more peaked?',
      takeaway: 'Attention is a softmax over dot products followed by a weighted average. Dividing by √d keeps the scores at unit scale as heads get wider, so the softmax stays responsive and every key keeps receiving gradient.',
      notation: 'q is one query and k_j, v_j are the keys and values of the other tokens; s_j = qᵀk_j is a score, a_j a softmax weight and o the output. d is the width of a query or key, here 4, so √d = 2.',
    },
    notation: {
      'Q, K, V': {tex: Q`Q,\ K,\ V`, detail: 'Three learned linear maps of the same tokens: Q = XW_Q asks, K = XW_K advertises and V = XW_V carries the content that is averaged. Each has one row per token and d columns. Here K is not a convolution kernel.'},
      A: {tex: 'A', detail: 'The N × N attention matrix softmax(QKᵀ/√d). Row i holds the weights token i gives to every token; each row is nonnegative and sums to 1. Unlike a kernel, it is recomputed for every input.'},
      '√d': {tex: Q`\sqrt d`, detail: 'd is the width of one head’s queries and keys. A dot product of d independent unit-variance terms has variance d, so dividing by √d keeps the softmax inputs near unit scale.'},
      X: {tex: 'X', detail: 'The token matrix: one row per token (each patch embedding plus its positional embedding, and the class token) and D columns of features.'},
      N: {tex: 'N', detail: 'The number of tokens. An H × W image with P × P patches gives (H/P)(W/P) patch tokens, plus one class token; computing all scores costs on the order of N²d.'},
    },
    calculate, practice, lab,
  });
})();
