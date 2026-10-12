/* Lesson 56: multi-scale features: pyramids, FPN and U-Net. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const thousands = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const texInt = n => thousands(n).replace(/,/g, '{,}');
  const sub = k => String(k).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join('');

  /* ---------- Worked example: FPN map sizes, anchor counts and the level for one box ---------- */
  // Square S x S image (S a multiple of 32), levels P2..P5 with stride 2^k, A anchors per cell, a box with sqrt(wh) = b.
  function model(p) {
    const [S, b, A] = p, ks = [2, 3, 4, 5];
    const sides = ks.map(k => S / 2 ** k), counts = sides.map(n => n * n * A), total = counts.reduce((t, x) => t + x, 0);
    const raw = 4 + Math.log2(b / 224), kf = Math.floor(raw), k = Math.min(5, Math.max(2, kf)), cells = b / 2 ** k;
    return {S, b, A, ks, sides, counts, total, raw, kf, k, cells};
  }
  function drawing(m) {
    const T = (x, y, text, color = '#64736b', size = 12) => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial">${E(text)}</text>`;
    const base = 196, sizes = [140, 70, 35, 17.5], xs = [20, 182, 275, 345];
    let body = T(20, 24, `FPN levels for a ${m.S} × ${m.S} image, ${m.A} anchor${m.A > 1 ? 's' : ''} per cell`, '#172623', 15);
    m.ks.forEach((k, i) => {
      const on = k === m.k, d = sizes[i], x = xs[i], y = base - d, c = on ? '#bd431c' : '#34734e';
      body += `<rect x="${x}" y="${y}" width="${d}" height="${d}" fill="${c}1f" stroke="${c}" stroke-width="${on ? 3 : 1.5}"/>`;
      body += T(x, y - 7, `${thousands(m.counts[i])} anchors`, on ? '#bd431c' : '#172623', 12);
      body += T(x, base + 18, `P${k}  ${m.sides[i]}×${m.sides[i]}`, on ? '#bd431c' : '#172623', 12) + T(x, base + 34, `stride ${2 ** k}`, '#64736b', 11);
      if (on) { const bs = Math.max(1.5, Math.min(d, m.b / m.S * d)); body += `<rect x="${(x + (d - bs) / 2).toFixed(1)}" y="${(y + (d - bs) / 2).toFixed(1)}" width="${bs.toFixed(1)}" height="${bs.toFixed(1)}" fill="#bd431c"/>`; }
    });
    // Right panel: the box and the level's anchor measured in cells of the assigned level.
    const px = 440, pw = 102, shown = Math.ceil(Math.max(m.cells, 8)) + 2, c = Math.min(9, pw / shown), gw = c * shown, gx = px + (pw - gw) / 2, gy = 56, mid = [gx + gw / 2, gy + gw / 2];
    body += T(px, 44, `Box on P${m.k}`, '#bd431c', 13);
    let grid = '';
    for (let i = 0; i <= shown; i++) grid += `M${(gx + i * c).toFixed(1)} ${gy}V${(gy + gw).toFixed(1)}M${gx} ${(gy + i * c).toFixed(1)}H${(gx + gw).toFixed(1)}`;
    body += `<path d="${grid}" stroke="#a8b6a5" stroke-width="0.6" fill="none"/>`;
    const bs = m.cells * c, as = 8 * c;
    body += `<rect x="${(mid[0] - bs / 2).toFixed(1)}" y="${(mid[1] - bs / 2).toFixed(1)}" width="${bs.toFixed(1)}" height="${bs.toFixed(1)}" fill="#bd431c33" stroke="#bd431c" stroke-width="2"/>`;
    body += `<rect x="${(mid[0] - as / 2).toFixed(1)}" y="${(mid[1] - as / 2).toFixed(1)}" width="${as.toFixed(1)}" height="${as.toFixed(1)}" fill="none" stroke="#315c86" stroke-width="2" stroke-dasharray="4 3"/>`;
    body += T(px, 186, `box: ${N(m.cells, 2)} cells`, '#bd431c', 12) + T(px, 202, 'anchor: 8 cells', '#315c86', 12) + T(px, 218, `(${8 * 2 ** m.k} px at stride ${2 ** m.k})`, '#64736b', 11);
    return {body, caption: `Squares: levels P2 to P5 at relative size (each halves the grid); the number above each is its anchor count. Orange marks the level for a ${m.b}-pixel box, drawn to scale inside it. Right: that box (orange) and the level's anchor (blue, dashed) measured in cells of the level.`};
  }
  function calculate(p) {
    const m = model(p), share = 100 * m.counts[0] / m.total;
    return {
      steps: [
        step('Halve the grid at every level', Q`n_k=\frac{S}{2^k}:\quad n_2=${m.sides[0]},\ n_3=${m.sides[1]},\ n_4=${m.sides[2]},\ n_5=${m.sides[3]}`, `Level k has stride 2ᵏ, so one cell covers a 4 × 4 block of pixels on P2 and a 32 × 32 block on P5. The side S = ${m.S} is a multiple of 32, so every level has a whole number of cells.`),
        step('Count the anchors on each level', Q`N_k=n_k^2A:\quad N_2=${m.sides[0]}^2\cdot${m.A}=${texInt(m.counts[0])},\qquad \sum_{k=2}^{5}N_k=${texInt(m.total)}`, `The four levels hold ${m.counts.map(thousands).join(', ')} anchors. The finest level carries ${N(share, 1)}% of them: small objects need many candidate positions. In the FPN region proposal network the anchor side on Pₖ is 8 · 2ᵏ pixels (32, 64, 128, 256), and A counts its aspect ratios.`),
        step('Assign the box to a level', Q`k=\left\lfloor 4+\log_2\frac{${m.b}}{224}\right\rfloor=\lfloor ${N(m.raw, 3)}\rfloor=${m.kf}${m.kf !== m.k ? Q`\;\Rightarrow\;k=${m.k}\ \text{after clamping to }[2,5]` : ''}`, 'The constant k₀ = 4 sends a 224-pixel box, the ImageNet training size, to P4. Doubling the box side adds one to the level. The result is clamped to the levels that exist, here 2 to 5.'),
        step('Measure the box in cells of its level', Q`\frac{\sqrt{wh}}{2^{${m.k}}}=\frac{${m.b}}{${2 ** m.k}}=${N(m.cells, 3)}\ \text{cells},\qquad \text{anchor side }8\cdot2^{${m.k}}=${8 * 2 ** m.k}\text{ px}=8\text{ cells}`, m.kf === m.k ? 'An unclamped box always spans between 14 and 28 cells of its level, so every object reaches the head at a similar size in cells, as it would in an image pyramid.' : m.kf < 2 ? 'This box is smaller than the rule wants for P2, but no finer level exists, so it spans fewer than 14 cells. Very small objects remain hard for exactly this reason.' : 'This box is larger than the rule wants for P5, so it spans more than 28 cells of the coarsest level.'),
      ],
      values: [['P2 map side (stride 4)', m.sides[0]], ['P5 map side (stride 32)', m.sides[3]], ['Anchors on P2', m.counts[0]], ['Anchors on P2 to P5', m.total], ['Assigned level k', m.k], ['Box side in level-k cells', m.cells]],
      note: 'Set the box side to 224 and then 448: the level rises by one and the box covers 14 cells both times. Doubling the image side multiplies every anchor count by four.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const practice = [
    {key: 'laplacian-1d', skill: 'Build one Laplacian level of a 1D signal', make(r) {
      const a = r.int(4, 12), b = r.int(4, 12), d1 = r.nonzero(-3, 3), d2 = r.nonzero(-3, 3);
      const g = [a - d1, a + d1, b - d2, b + d2], l = [-d1, d1, -d2, d2];
      return {prompt: Q`The 1D signal \(G_0=(${g.join(', ')})\) is blurred and halved by averaging each pair of neighbours (samples 1 and 2, then 3 and 4), giving \(G_1\). Upsampling repeats each sample twice. Find \(G_1\) and the Laplacian level \(L_0=G_0-\operatorname{up}(G_1)\).`,
        answers: [{label: Q`\(G_1\)`, vector: [a, b], tol: 0}, {label: Q`\(L_0\)`, vector: l, tol: 0}],
        hint: `Average each pair first: (${g[0]} + ${g[1]})/2 and (${g[2]} + ${g[3]})/2. Then repeat each average twice before subtracting.`,
        solution: Q`\(G_1=(${a}, ${b})\), so \(\operatorname{up}(G_1)=(${a}, ${a}, ${b}, ${b})\) and \(L_0=(${g[0]}-${a},\ ${g[1]}-${a},\ ${g[2]}-${b},\ ${g[3]}-${b})=(${l.join(', ')})\). Adding \(\operatorname{up}(G_1)\) back to \(L_0\) returns \(G_0\) exactly. With pair averaging, the two entries of \(L_0\) in each pair always cancel.`};
    }},
    {key: 'anchor-count', skill: 'Count cells and anchors on one FPN level', make(r) {
      const H = r.pick([256, 320, 384, 480, 512, 640, 800]), W = r.pick([320, 384, 512, 640, 800, 1024]), k = r.int(2, 5), s = 2 ** k, A = r.pick([1, 3, 9]);
      const h = H / s, w = W / s, count = h * w * A;
      return {prompt: `An image of ${H} × ${W} pixels (height × width) feeds a feature pyramid network. Level P${k} has stride ${s}, and every cell holds ${A} anchor${A > 1 ? 's' : ''}. What is the size (height, width) of the P${k} feature map, and how many anchors does that level hold?`,
        answers: [{label: 'Map size (height, width)', vector: [h, w], tol: 0}, {label: 'Anchors on this level', value: count, tol: 0}],
        hint: `Divide each image side by the stride ${s}.`,
        solution: `${H}/${s} = ${h} and ${W}/${s} = ${w}, so P${k} has ${h} × ${w} = ${h * w} cells. With ${A} anchor${A > 1 ? 's' : ''} per cell: ${h * w} × ${A} = ${count}.`};
    }},
    {key: 'fpn-level', skill: 'Assign a box to an FPN level', make(r) {
      let w, h, raw;
      do {
        const bucket = 28 * 2 ** r.pick([0, 1, 2, 2, 3, 3, 4, 5]), side = bucket * r.real(1.1, 1.9, 2), q = r.pick([0.5, 0.75, 1, 1.5, 2]);
        w = 8 * Math.max(1, Math.round(side * Math.sqrt(q) / 8)); h = 8 * Math.max(1, Math.round(side / Math.sqrt(q) / 8));
        raw = 4 + Math.log2(Math.sqrt(w * h) / 224);
      } while (Math.abs(raw - Math.round(raw)) < 0.06);
      const kf = Math.floor(raw), k = Math.min(5, Math.max(2, kf)), side = Math.sqrt(w * h);
      return {prompt: Q`A region proposal is ${w} × ${h} pixels. FPN pools it from level \(k=\lfloor k_0+\log_2(\sqrt{wh}/224)\rfloor\) with \(k_0=4\), clamped to the available levels 2 to 5. Which level k?`,
        answers: [{label: Q`\(k\)`, value: k, tol: 0}],
        hint: Q`\(\sqrt{wh}=\sqrt{${w * h}}\approx${N(side, 1)}\). Level 4 covers \(224\le\sqrt{wh}<448\); each halving of \(\sqrt{wh}\) lowers k by one.`,
        solution: Q`\(4+\log_2(${N(side, 1)}/224)=4${raw >= 4 ? '+' : ''}${N(raw - 4, 3)}=${N(raw, 3)}\), whose floor is ${kf}${kf !== k ? `, clamped to ${k}` : ''}. The proposal is pooled from P${k}, where one cell is ${2 ** k} pixels wide.`};
    }},
    {key: 'transposed-size', skill: 'Output size and overlap of a transposed convolution', make(r) {
      const n = r.pick([4, 7, 8, 13, 16, 32]), s = r.pick([2, 2, 3]), k = r.int(s, s + 3), p = r.int(0, Math.floor((k - 1) / 2)), q = r.int(0, s - 1);
      const full = (n - 1) * s + k, out = full - 2 * p + q, even = k % s === 0;
      const options = ['Even: every interior output receives the same number of kernel taps', 'Uneven: neighbouring outputs receive different numbers of taps (checkerboard risk)'], order = r.shuffle([0, 1]);
      return {prompt: `A transposed convolution has kernel ${k}, stride ${s}, padding ${p} and output padding ${q} (dilation 1). Padding trims ${p} position${p === 1 ? '' : 's'} from each end of the full output; output padding adds ${q} at one end. What output side does a ${n} × ${n} input give, and is the overlap of the kernel copies even?`,
        answers: [{label: 'Output side', value: out, tol: 0}, {label: 'Overlap', choices: order.map(i => options[i]), correct: order.indexOf(even ? 0 : 1)}],
        hint: `The full output places one kernel copy every ${s} positions, so before trimming it has (n − 1)·s + k = (${n} − 1)·${s} + ${k} = ${full} positions.`,
        solution: `(${n} − 1)·${s} + ${k} = ${full}; trimming 2·${p} and adding ${q} gives ${full} − ${2 * p} + ${q} = ${out}. Kernel ${k} ${even ? 'is' : 'is not'} a multiple of stride ${s}, so interior outputs ${even ? `all receive ${k / s} tap${k === s ? '' : 's'}: the overlap is even.` : `receive ${Math.floor(k / s)} or ${Math.ceil(k / s)} taps in a repeating pattern, which can print a checkerboard unless the learned weights compensate.`}`};
    }},
  ];

  /* ---------- Lab: Gaussian and Laplacian pyramids, reconstruction and FPN anchors on a photo ---------- */
  // Blur with sigma, keep every second pixel (starting at 0). Up-sampling is linear interpolation with fine x <-> coarse x/2.
  function gaussianPyramid(gray, w, h, sigma, n) {
    const V = window.CV_VISION, G = [{data: Float64Array.from(gray), w, h}];
    for (let k = 1; k < n; k++) {
      const p = G[k - 1], b = V.blur(p.data, p.w, p.h, sigma), nw = Math.ceil(p.w / 2), nh = Math.ceil(p.h / 2), d = new Float64Array(nw * nh);
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) d[y * nw + x] = b[2 * y * p.w + 2 * x];
      G.push({data: d, w: nw, h: nh});
    }
    return G;
  }
  function up(p, W, H) {
    const out = new Float64Array(W * H), d = p.data;
    for (let y = 0; y < H; y++) {
      const cy = Math.min(y / 2, p.h - 1), y0 = Math.floor(cy), y1 = Math.min(p.h - 1, y0 + 1), fy = cy - y0;
      for (let x = 0; x < W; x++) {
        const cx = Math.min(x / 2, p.w - 1), x0 = Math.floor(cx), x1 = Math.min(p.w - 1, x0 + 1), fx = cx - x0;
        out[y * W + x] = (d[y0 * p.w + x0] * (1 - fx) + d[y0 * p.w + x1] * fx) * (1 - fy) + (d[y1 * p.w + x0] * (1 - fx) + d[y1 * p.w + x1] * fx) * fy;
      }
    }
    return out;
  }
  const MAX_LEVELS = 5;
  function pyramidFor(data, sigma) {
    if (data.cache && data.cache.sigma === sigma) return data.cache;
    const G = gaussianPyramid(data.gray, data.w, data.h, sigma, MAX_LEVELS);
    // D[k] = G[k] - up(G[k+1]); the Laplacian pyramid with n levels is D[0..n-2] followed by G[n-1].
    const D = G.slice(0, -1).map((g, k) => { const u = up(G[k + 1], g.w, g.h); return {data: g.data.map((v, i) => v - u[i]), w: g.w, h: g.h}; });
    return (data.cache = {sigma, G, D});
  }
  function rebuild(L, G, drop) {
    let R = Float64Array.from(L[L.length - 1].data);
    for (let k = L.length - 2; k >= 0; k--) {
      const U = up({data: R, w: G[k + 1].w, h: G[k + 1].h}, G[k].w, G[k].h);
      if (k >= drop) for (let i = 0; i < U.length; i++) U[i] += L[k].data[i];
      R = U;
    }
    return R;
  }
  const rms = a => { let s = 0; for (const v of a) s += v * v; return Math.sqrt(s / a.length); };
  // Level 0 on the left, the smaller levels stacked in a column on the right; unused pixels stay transparent (theme paper shows through).
  function composite(levels, grey) {
    const W = levels[0].w + (levels.length > 1 ? 4 + levels[1].w : 0), H = levels[0].h, rgba = new Uint8ClampedArray(W * H * 4);
    let y0 = 0;
    levels.forEach((p, k) => {
      const ox = k ? levels[0].w + 4 : 0, oy = k ? y0 : 0;
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const g = grey(k, p.data[y * p.w + x]), o = 4 * ((oy + y) * W + ox + x); rgba[o] = rgba[o + 1] = rgba[o + 2] = g; rgba[o + 3] = 255; }
      if (k) y0 += p.h + 4;
    });
    return {rgba, W, H};
  }
  const caption = (canvas, text) => { canvas.setAttribute('aria-label', text); canvas.nextElementSibling.textContent = text; };
  const tiny = v => v === 0 ? '0 (exact)' : v < 1e-9 ? `${v.toExponential(1)} (rounding only)` : window.CV_VISION.fmt(v, 3);
  const zeroed = d => d === 1 ? 'L₀' : d === 2 ? 'L₀ and L₁' : `L₀ … L${sub(d - 1)}`;
  const RATIO_COLOURS = {0.5: '#7fb8df', 1: '#3fae6a', 2: '#e8743b'};

  const lab = {
    name: 'pyramid', title: 'Image pyramids and FPN anchors', photo: 'camera',
    heading: 'Halve the photo. Keep what each halving loses.',
    intro: 'The 256 × 256 photo is blurred with σ and halved again and again: a Gaussian pyramid. Each Laplacian level stores one level minus the upsampled next level; here up() is linear interpolation. Switch the view to rebuild the photo, or to place FPN anchors on it.',
    defaults: {view: 'pyramid', levels: 4, sigma: 1, drop: 1, level: 4, ratios: 3},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('view', 'Show', [['pyramid', 'Gaussian and Laplacian levels'], ['recon', 'Rebuild from the Laplacian pyramid'], ['anchors', 'FPN anchors on the photo']], s.view) +
        `<div data-show-when="view:pyramid recon">${range('levels', 'Pyramid levels n', 3, 5, 1, s.levels)}${range('sigma', 'Blur σ before each halving (pixels)', .5, 2, .1, s.sigma)}</div>` +
        `<div data-show-when="view:recon">${range('drop', 'Zero the finest d Laplacian levels', 0, 4, 1, s.drop)}</div>` +
        `<div data-show-when="view:anchors">${select('level', 'FPN level (stride, anchor side)', [[2, 'P2 · stride 4 · anchor 32 px'], [3, 'P3 · stride 8 · anchor 64 px'], [4, 'P4 · stride 16 · anchor 128 px'], [5, 'P5 · stride 32 · anchor 256 px']], s.level)}${select('ratios', 'Aspect ratios (height : width)', [[1, '1:1 only'], [3, '1:2, 1:1 and 2:1']], s.ratios)}</div>` +
        '<div class="math-rule">Lₖ = Gₖ − up(Gₖ₊₁),   Gₖ = Lₖ + up(Gₖ₊₁)</div>';
    },
    visual: () => { const {figure} = window.CV_VISION; return `<div class="vk-pair">${figure('py-a', 'Gaussian pyramid')}${figure('py-b', 'Laplacian pyramid')}</div><div id="py-table"></div>`; },
    note: 'Predict first: which level carries the fine grass texture, and which the outline of the coat? Zero only the finest level and compare the error image with L₀ in the pyramid view: they are the same picture. Reconstruction is exact for every σ, because each level stores exactly what upsampling cannot predict. In the anchors view, the number of anchors falls by a factor of four per level while their size doubles.',
    async setup() { const img = await window.CV_VISION.load('camera'); return {gray: img.gray, w: img.w, h: img.h, cache: null}; },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt, clamp, report} = V, W = data.w, H = data.h;
      const a = root.querySelector('#py-a'), b = root.querySelector('#py-b'), table = root.querySelector('#py-table');
      if (s.view === 'anchors') {
        const k = Number(s.level), st = 2 ** k, n = W / st, A = Number(s.ratios), side = 8 * st, ratios = A === 3 ? [0.5, 1, 2] : [1];
        const ca = V.show(a, data.gray, W, H), ctx = ca.getContext('2d'), r = st >= 8 ? 1.5 : .6;
        ctx.fillStyle = st >= 8 ? 'rgba(232,116,59,.9)' : 'rgba(232,116,59,.6)';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) ctx.fillRect((i + .5) * st - r, (j + .5) * st - r, 2 * r, 2 * r);
        const picks = [[.3, .3], [.7, .62]].map(([fx, fy]) => [Math.floor(fx * n), Math.floor(fy * n)]);
        picks.forEach(([i, j]) => {
          const cx = (i + .5) * st, cy = (j + .5) * st;
          ratios.forEach(q => { const bw = side / Math.sqrt(q), bh = side * Math.sqrt(q); ctx.strokeStyle = RATIO_COLOURS[q]; ctx.lineWidth = 2; ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh); });
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI); ctx.fill();
        });
        caption(a, `Orange dots: the ${n * n} anchor centres of P${k}, one per ${st}-pixel cell. Boxes: the anchors at two of those cells (blue 1:2, green 1:1, orange 2:1).`);
        const small = V.downsample(data.gray, W, H, st), big = new Float32Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) big[y * W + x] = small.data[Math.floor(y / st) * small.w + Math.floor(x / st)];
        const cb = V.show(b, big, W, H), bctx = cb.getContext('2d');
        if (st >= 8) { bctx.strokeStyle = 'rgba(255,255,255,.35)'; bctx.lineWidth = 1; bctx.beginPath(); for (let g = st; g < W; g += st) { bctx.moveTo(g + .5, 0); bctx.lineTo(g + .5, H); bctx.moveTo(0, g + .5); bctx.lineTo(W, g + .5); } bctx.stroke(); }
        bctx.strokeStyle = '#e8743b'; bctx.lineWidth = 2;
        picks.forEach(([i, j]) => { if (st >= 8) bctx.strokeRect(i * st + 1, j * st + 1, st - 2, st - 2); else { bctx.beginPath(); bctx.arc((i + .5) * st, (j + .5) * st, 6, 0, 2 * Math.PI); bctx.stroke(); } });
        caption(b, `The ${n} × ${n} grid of P${k}: each cell shows the mean of its ${st} × ${st} block. A detector head scores the anchors of every cell.`);
        const all = [2, 3, 4, 5].map(l => { const m = W / 2 ** l; return {l, st: 2 ** l, m, count: m * m * A}; }), total = all.reduce((t, x) => t + x.count, 0);
        const cell = (on, text) => on ? `<strong>${text}</strong>` : text;
        table.innerHTML = `<table class="vk-table"><thead><tr><th>Level</th><th>Stride</th><th>Grid</th><th>Anchor side</th><th>Anchors (A = ${A})</th></tr></thead><tbody>${all.map(x => `<tr><td>${cell(x.l === k, 'P' + x.l)}</td><td>${cell(x.l === k, x.st)}</td><td>${cell(x.l === k, `${x.m} × ${x.m}`)}</td><td>${cell(x.l === k, `${8 * x.st} px`)}</td><td>${cell(x.l === k, x.count.toLocaleString())}</td></tr>`).join('')}<tr><td>All four</td><td></td><td></td><td></td><td>${total.toLocaleString()}</td></tr></tbody></table>`;
        return report([['Level', `P${k}: stride ${st}, anchor side ${side} px`], ['Grid on this 256 × 256 photo', `${n} × ${n} = ${n * n} cells`], ['Anchors at this level', `${n * n} × ${A} = ${(n * n * A).toLocaleString()}`], ['Anchor boxes (w × h)', ratios.map(q => `${fmt(side / Math.sqrt(q), 1)} × ${fmt(side * Math.sqrt(q), 1)}`).join(', ')], ['Share of all P2–P5 anchors', fmt(100 * n * n * A / total, 1) + '%']]);
      }
      const n = Number(s.levels), pyr = pyramidFor(data, Number(s.sigma)), G = pyr.G.slice(0, n), L = [...pyr.D.slice(0, n - 1), G[n - 1]];
      const recon = s.view === 'recon', d = recon ? Math.min(Number(s.drop), n - 1) : 0, R = rebuild(L, G, d);
      const err = new Float64Array(W * H); let maxErr = 0;
      for (let i = 0; i < err.length; i++) { err[i] = G[0].data[i] - R[i]; maxErr = Math.max(maxErr, Math.abs(err[i])); }
      const spread = L.map(l => rms(l.data)), stored = L.reduce((t, l) => t + l.w * l.h, 0);
      if (recon) {
        V.show(a, R, W, H, {min: 0, max: 255});
        caption(a, d ? `Rebuilt from the Laplacian pyramid with ${zeroed(d)} set to zero` : 'Rebuilt from all Laplacian levels');
        V.show(b, err, W, H, {min: -48, max: 48});
        caption(b, 'Error G₀ − rebuilt (grey = 0; black and white = ∓48 grey levels)');
      } else {
        const gc = composite(G, (k, v) => v);
        V.showRGBA(a, gc.rgba, gc.W, gc.H);
        caption(a, `Gaussian pyramid G₀ … G${sub(n - 1)}: blur with σ = ${fmt(s.sigma, 1)}, then keep every second pixel`);
        const lc = composite(L, (k, v) => k === n - 1 ? v : 128 + 127 * clamp(v / (3 * (spread[k] || 1)), -1, 1));
        V.showRGBA(b, lc.rgba, lc.W, lc.H);
        caption(b, `Laplacian pyramid: L₀ … L${sub(n - 2)} (grey = 0, each level stretched separately) and the coarse image L${sub(n - 1)} = G${sub(n - 1)}`);
      }
      table.innerHTML = `<table class="vk-table"><thead><tr><th>Level</th><th>Size</th><th>Numbers</th><th>RMS value</th><th>Role</th></tr></thead><tbody>${L.map((l, k) => `<tr><td>L${sub(k)}</td><td>${l.w} × ${l.h}</td><td>${(l.w * l.h).toLocaleString()}</td><td>${k === n - 1 ? `${fmt(spread[k], 1)} (an image)` : fmt(spread[k], 2)}</td><td>${k === n - 1 ? `coarse image G${sub(k)}` : recon && k < d ? 'detail, set to zero' : 'detail between two levels'}</td></tr>`).join('')}</tbody></table>`;
      if (recon) {
        const e = rms(err);
        return report([['Zeroed levels', d ? `${zeroed(d)}${d === n - 1 ? ' (all detail: only the coarse image is left)' : ''}` : 'none'], ['RMS error', e < 1e-9 ? tiny(e) : fmt(e, 3) + ' grey levels'], ['Max |error|', tiny(maxErr)], ['PSNR', e < 1e-9 ? 'unbounded (exact)' : fmt(20 * Math.log10(255 / e), 1) + ' dB']]);
      }
      return report([['Sizes', G.map(g => g.w).join(' → ') + ' px'], ['Numbers stored', `${stored.toLocaleString()} = ${fmt(stored / (W * H), 3)} × the image`], ['Blur kernel', `σ = ${fmt(s.sigma, 1)} px, ${V.gaussianKernel(Number(s.sigma)).length} taps`], ['Rebuild error max |G₀ − R|', tiny(maxErr)]]);
    },
  };

  window.CV_EXTEND.lesson(56, {
    teaching: {
      equation: Q`L_k=G_k-\operatorname{up}(G_{k+1}),\qquad P_k=\operatorname{up}(P_{k+1})+\operatorname{conv}_{1\times1}(C_k)`,
      symbols: [['Gₖ', 'Gaussian pyramid level k'], ['Lₖ', 'Laplacian level k: detail lost by one halving'], ['up', 'upsampling by a factor of 2'], ['Pₖ', 'FPN output at stride 2ᵏ'], ['Cₖ', 'backbone feature map at stride 2ᵏ']],
      connection: 'One detector has to find a 20-pixel bird and a 400-pixel bus in the same image. Feature pyramids give each object a level on which it spans a sensible number of cells, and U-Net skip connections return the fine detail that striding removed, so masks keep sharp boundaries.',
      trap: 'Upsampling a coarse level does not bring back the detail it lost: blurring and halving cannot be undone on their own. Exact reconstruction needs the stored Laplacian differences, just as a U-Net decoder needs its skip connections.',
      question: 'A Laplacian pyramid is built with a Gaussian blur and linear-interpolation upsampling. You switch the blur to a box filter. Does reconstruction stay exact?',
      choices: ['Yes, provided the same upsampling is used to build and to rebuild', 'No, only a Gaussian blur gives exact reconstruction', 'Only when the image side is a power of two'], correct: 0,
      explanation: 'Each level is defined as Lₖ = Gₖ − up(Gₖ₊₁), so adding up(Gₖ₊₁) back returns Gₖ whatever the blur. The filter changes what the levels contain, not whether they add up.',
    },
    guide: {
      title: 'Keep the detail that each coarser level throws away',
      paragraphs: [
        'A single feature map trades resolution against context. A fine map locates edges precisely, but each unit has seen little of the image; a coarse map has seen a lot, but it places things only to within one stride. A Gaussian pyramid blurs and halves the image repeatedly, and the Laplacian pyramid stores what each halving removed, so the image can be rebuilt exactly.',
        'Networks reuse the idea. A feature pyramid network passes coarse, semantic features back down to the finer levels and gives each object the level that suits its size; anchors sit on every cell of every level. U-Net concatenates encoder features with the upsampled decoder features, so a segmentation can be both precise and informed by context.',
      ],
      example: 'Feature-map sizes, anchor counts and the FPN level for one box',
      controls: [{label: 'Image side S (pixels, square image)', min: 448, max: 1024, step: 32, value: 512}, {label: 'Box side √(wh) (pixels)', min: 16, max: 448, step: 16, value: 96}, {label: 'Anchors per cell A', min: 1, max: 9, step: 1, value: 3}],
      predict: 'If you double the box side, how does its level change, and does the box then cover more cells on its new level?',
      takeaway: 'Each level halves the grid and divides the anchor count by four. The level rule moves a box up one level whenever its side doubles, so every object is seen at a similar size in cells: the benefit of an image pyramid, computed once inside the network.',
      notation: 'k indexes levels, and level k has stride 2ᵏ: P2 has stride 4 and P5 has stride 32. G and L are image pyramids; C and P are network feature maps. up() doubles both height and width.',
    },
    notation: {
      'Gₖ': {tex: 'G_k', detail: 'Level k of the Gaussian pyramid: the image blurred and halved k times, so it has 4⁻ᵏ as many pixels. G₀ is the original image.'},
      'Lₖ': {tex: 'L_k', detail: 'Level k of the Laplacian pyramid: Gₖ minus the upsampled next level. It holds the band of detail that one halving removes; the top level is the small image Gₙ itself.'},
      up: {tex: Q`\operatorname{up}`, detail: 'Upsampling by 2 in each direction: nearest-neighbour repetition, linear interpolation or a learned transposed convolution. Any fixed choice gives exact Laplacian reconstruction if the same one is used to build and to rebuild.'},
      'Pₖ': {tex: 'P_k', detail: 'Output level k of a feature pyramid network, with stride 2ᵏ. Every Pₖ has the same number of channels (256 in the original FPN), so one detection head can be shared across levels.'},
      'Cₖ': {tex: 'C_k', detail: 'The bottom-up backbone feature map at stride 2ᵏ, for example the last block of a ResNet stage. Its channel count grows with depth; a lateral 1 × 1 convolution maps it to the pyramid width.'},
    },
    calculate, practice, lab,
  });
})();
