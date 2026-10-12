/* Lesson 65: cross-attention, positional encodings and set prediction. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const softmax = z => { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((t, v) => t + v, 0); return e.map(v => v / s); };
  const dot = (a, b) => a.reduce((t, v, i) => t + v * b[i], 0);
  const tup = v => `(${v.join(', ')})`;

  /* ---------- Boxes: IoU and generalised IoU ---------- */
  // Boxes are [x0, y0, x1, y1] with x1 > x0 and y1 > y0 (continuous coordinates, no +1).
  function boxStats(A, B) {
    const iw = Math.max(0, Math.min(A[2], B[2]) - Math.max(A[0], B[0])), ih = Math.max(0, Math.min(A[3], B[3]) - Math.max(A[1], B[1]));
    const inter = iw * ih, areaA = (A[2] - A[0]) * (A[3] - A[1]), areaB = (B[2] - B[0]) * (B[3] - B[1]), union = areaA + areaB - inter;
    const C = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])], areaC = (C[2] - C[0]) * (C[3] - C[1]);
    const iou = inter / union, giou = iou - (areaC - union) / areaC;
    return {iw, ih, inter, areaA, areaB, union, C, areaC, iou, giou};
  }

  /* ---------- Worked example: slide box B past box A ---------- */
  const A0 = [0, 0, 2, 2];
  function model(p) {
    const [x, y, w] = p, B = [x, y, x + w, y + 2], st = boxStats(A0, B);
    const h = 1e-3, slope = f => (f(boxStats(A0, [x + h, y, x + h + w, y + 2])) - f(boxStats(A0, [x - h, y, x - h + w, y + 2]))) / (2 * h);
    return {x, y, w, B, ...st, slopeIoU: slope(s => s.iou), slopeGIoU: slope(s => s.giou)};
  }
  function drawing(m) {
    const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', weight = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}>${E(s)}</text>`;
    const k = 24, X = v => 50 + v * k, Y = v => 208 - v * k;
    let body = txt(20, 22, 'Boxes A, B and the enclosing box C', '#172623', 13);
    for (let g = -1; g <= 10; g++) body += `<path d="M${X(g)} ${Y(-0.2)}V${Y(5.4)}" stroke="#e5e6dd"/>` + txt(X(g), 226, String(g), '#64736b', 10, 'middle');
    for (let g = 0; g <= 5; g++) body += `<path d="M${X(-1.2)} ${Y(g)}H${X(10.2)}" stroke="#e5e6dd"/>` + txt(X(-1.2) - 4, Y(g) + 4, String(g), '#64736b', 10, 'end');
    const rect = (b, stroke, fill, extra = '') => `<rect x="${X(b[0]).toFixed(1)}" y="${Y(b[3]).toFixed(1)}" width="${((b[2] - b[0]) * k).toFixed(1)}" height="${((b[3] - b[1]) * k).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="2.4"${extra}/>`;
    body += rect(m.C, '#315c86', 'none', ' stroke-dasharray="6 4"') + rect(A0, '#34734e', '#34734e33') + rect(m.B, '#bd431c', '#bd431c2e');
    if (m.inter > 0) body += rect([Math.max(0, m.B[0]), Math.max(0, m.B[1]), Math.min(2, m.B[2]), Math.min(2, m.B[3])], 'none', '#172623', ' fill-opacity=".28"');
    body += txt(X(1), Y(1) + 4, 'A', '#34734e', 14, 'middle', '700') + txt(X((m.B[0] + m.B[2]) / 2), Y((m.B[1] + m.B[3]) / 2) + 4, 'B', '#bd431c', 14, 'middle', '700');
    // Right: IoU and GIoU as B slides horizontally (same y and width).
    const L = 330, R = 530, T = 40, Bt = 196, px = v => L + (v + 1) / 7 * (R - L), py = v => Bt - (v + 1) / 2 * (Bt - T);
    const curve = f => Array.from({length: 141}, (_, i) => -1 + i * .05).map((v, i) => `${i ? 'L' : 'M'}${px(v).toFixed(1)} ${py(f(boxStats(A0, [v, m.y, v + m.w, m.y + 2]))).toFixed(1)}`).join('');
    body += txt(L, 22, 'IoU and GIoU as B slides', '#172623', 13);
    body += `<rect x="${L}" y="${T}" width="${R - L}" height="${Bt - T}" fill="none" stroke="#a8b6a5"/><path d="M${L} ${py(0)}H${R}" stroke="#a8b6a5" stroke-dasharray="2 3"/>`;
    [-1, 0, 1].forEach(v => { body += txt(L - 5, py(v) + 4, String(v), '#64736b', 10, 'end'); });
    [-1, 1, 3, 5].forEach(v => { body += txt(px(v), Bt + 14, String(v), '#64736b', 10, 'middle'); });
    body += `<path d="${curve(s => s.iou)}" fill="none" stroke="#34734e" stroke-width="2.4"/><path d="${curve(s => s.giou)}" fill="none" stroke="#bd431c" stroke-width="2.4"/>`;
    body += `<path d="M${px(m.x).toFixed(1)} ${T}V${Bt}" stroke="#315c86" stroke-dasharray="4 3"/><circle cx="${px(m.x).toFixed(1)}" cy="${py(m.iou).toFixed(1)}" r="4.5" fill="#34734e"/><circle cx="${px(m.x).toFixed(1)}" cy="${py(m.giou).toFixed(1)}" r="4.5" fill="#bd431c"/>`;
    body += txt(L, Bt + 32, 'green: IoU · orange: GIoU', '#64736b', 11) + txt(R, Bt + 32, 'x →', '#64736b', 11, 'end');
    return {body, caption: `Left: A = [0, 0, 2, 2] and B = [${N(m.B[0])}, ${N(m.B[1])}, ${N(m.B[2])}, ${N(m.B[3])}], with the smallest box C that encloses both; the dark patch is their intersection. Right: IoU (green) is flat at 0 whenever the boxes are apart, while GIoU (orange) keeps rising as B approaches A. The dashed line marks the current position.`};
  }
  function calculate(p) {
    const m = model(p), [x0, y0, x1, y1] = m.B;
    return {
      steps: [
        step('Intersect, then unite', Q`|A\cap B|=${N(m.iw)}\times${N(m.ih)}=${N(m.inter)},\quad |A\cup B|=4+${N(m.areaB)}-${N(m.inter)}=${N(m.union)},\quad \mathrm{IoU}=\frac{${N(m.inter)}}{${N(m.union)}}=${N(m.iou)}`, `B = [${N(x0)}, ${N(y0)}, ${N(x1)}, ${N(y1)}]. The overlap width is max(0, min(2, ${N(x1)}) − max(0, ${N(x0)})) = ${N(m.iw)} and its height ${N(m.ih)}. The union counts the overlap once.`),
        step('Find the smallest enclosing box', Q`C=[${N(m.C[0])},\ ${N(m.C[1])},\ ${N(m.C[2])},\ ${N(m.C[3])}],\qquad |C|=${N(m.C[2] - m.C[0])}\times${N(m.C[3] - m.C[1])}=${N(m.areaC)}`, 'C takes the smallest left and top edges and the largest right and bottom edges of the two boxes. Its area minus the union is the empty space between them.'),
        step('Subtract the empty fraction of C', Q`\mathrm{GIoU}=\mathrm{IoU}-\frac{|C|-|A\cup B|}{|C|}=${N(m.iou)}-\frac{${N(m.areaC)}-${N(m.union)}}{${N(m.areaC)}}=${N(m.giou)}`, m.areaC - m.union > 1e-12 ? 'The boxes leave part of C uncovered, so GIoU is below IoU. The further apart they are, the larger that empty fraction, down to almost −1.' : 'The two boxes fill C completely, so nothing is subtracted and GIoU equals IoU.'),
        step('Compare the two losses', Q`1-\mathrm{IoU}=${N(1 - m.iou)},\qquad 1-\mathrm{GIoU}=${N(1 - m.giou)},\qquad \frac{\partial\,\mathrm{GIoU}}{\partial x}\approx${N(m.slopeGIoU)}`, m.inter > 0 ? `The boxes overlap, so both losses respond to moving B (the IoU slope along x is ${N(m.slopeIoU)}).` : `The boxes do not overlap: IoU is 0 here and its slope along x is ${N(m.slopeIoU)}, so 1 − IoU gives no direction to move. GIoU still changes with x, so its loss tells B which way to go.`),
      ],
      values: [['Intersection area', m.inter], ['Union area', m.union], ['Enclosing area', m.areaC], ['IoU', m.iou], ['GIoU', m.giou], ['GIoU loss', 1 - m.giou]],
      note: 'Slide B from x = 6 to x = 2. IoU stays 0 the whole way, but GIoU climbs from −0.5 to 0, and the loss 1 − GIoU falls. Then lift B with y = 3: the enclosing box grows upwards too.',
      svg: drawing(m),
    };
  }

  /* ---------- Matching helpers (also used by the lab) ---------- */
  // Hungarian algorithm (Kuhn–Munkres with potentials) for an n × m cost matrix with n ≤ m. Returns the column of each row.
  function hungarian(cost) {
    const n = cost.length, m = cost[0].length, INF = 1e18;
    const u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(m + 1).fill(INF), used = new Array(m + 1).fill(false);
      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = INF, j1 = 0;
        for (let j = 1; j <= m; j++) if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= m; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const out = new Array(n).fill(-1);
    for (let j = 1; j <= m; j++) if (p[j]) out[p[j] - 1] = j - 1;
    return out;
  }
  // Greedy: repeatedly take the cheapest remaining (row, column) pair.
  function greedy(cost) {
    const n = cost.length, m = cost[0].length, out = new Array(n).fill(-1), usedC = new Set();
    for (let k = 0; k < n; k++) {
      let best = null;
      for (let i = 0; i < n; i++) if (out[i] < 0) for (let j = 0; j < m; j++) if (!usedC.has(j) && (!best || cost[i][j] < best[2])) best = [i, j, cost[i][j]];
      out[best[0]] = best[1]; usedC.add(best[1]);
    }
    return out;
  }
  // Every injective assignment of rows to columns (for small checks).
  function allAssignments(n, m) {
    const out = [], rec = (row, used, acc) => { if (row === n) { out.push(acc.slice()); return; } for (let j = 0; j < m; j++) if (!used.has(j)) { used.add(j); acc.push(j); rec(row + 1, used, acc); acc.pop(); used.delete(j); } };
    rec(0, new Set(), []);
    return out;
  }
  const total = (cost, asg) => asg.reduce((t, j, i) => t + cost[i][j], 0);

  /* ---------- Practice ---------- */
  const dec = (x, d = 4) => Number(x.toFixed(d)).toString();
  const big = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  const practice = [
    {key: 'giou-boxes', skill: 'Compute IoU, the enclosing box and GIoU', make(r) {
      let A, B;
      do {
        const ax = r.int(0, 3), ay = r.int(0, 3), bx = r.int(0, 6), by = r.int(0, 6);
        A = [ax, ay, ax + r.int(1, 4), ay + r.int(1, 4)]; B = [bx, by, bx + r.int(1, 4), by + r.int(1, 4)];
      } while (A.every((v, i) => v === B[i]));
      const s = boxStats(A, B);
      return {prompt: Q`Boxes are written \([x_0,y_0,x_1,y_1]\). For \(A=[${A.join(',')}]\) and \(B=[${B.join(',')}]\), compute the IoU, the area of the smallest enclosing box C, and \(\mathrm{GIoU}=\mathrm{IoU}-(|C|-|A\cup B|)/|C|\).`,
        answers: [{label: 'IoU', value: s.iou, tol: .006}, {label: Q`\(|C|\)`, value: s.areaC, tol: 0}, {label: 'GIoU', value: s.giou, tol: .006}],
        hint: Q`Overlap width \(=\max(0,\min(x_1)-\max(x_0))\), and the same for the height. C takes the smallest \(x_0,y_0\) and the largest \(x_1,y_1\).`,
        solution: Q`Overlap \(${s.iw}\times${s.ih}=${s.inter}\); areas ${s.areaA} and ${s.areaB}, so the union is \(${s.areaA}+${s.areaB}-${s.inter}=${s.union}\) and \(\mathrm{IoU}=${s.inter}/${s.union}=${dec(s.iou)}\). \(C=[${s.C.join(',')}]\) has area ${s.areaC}, so \(\mathrm{GIoU}=${dec(s.iou)}-(${s.areaC}-${s.union})/${s.areaC}=${dec(s.giou)}\).${s.inter === 0 ? ' The boxes do not overlap, so IoU is 0 but GIoU is negative and still says how far apart they are.' : ''}`};
    }},
    {key: 'cross-attention-shapes', skill: 'Count the scores of cross-attention', make(r) {
      const st = r.pick([16, 32]), nq = r.pick([50, 100, 300, 900]), rows = r.int(12, 40), cols = r.int(12, 50), H = st * rows, W = st * cols, n = rows * cols;
      return {prompt: Q`A decoder with ${nq} object queries cross-attends to the stride-${st} feature map of a ${H} × ${W} image. How many image tokens are there, how many entries does one head's cross-attention matrix have, and how many output rows does the layer produce?`,
        answers: [{label: 'Image tokens', value: n, tol: 0}, {label: 'Attention entries per head', value: nq * n, tol: 0}, {label: 'Output rows', value: nq, tol: 0}],
        hint: 'Divide each side of the image by the stride. The attention matrix has one row per query and one column per image token.',
        solution: Q`\(${H}/${st}=${rows}\) and \(${W}/${st}=${cols}\), so there are \(${rows}\cdot${cols}=${big(n)}\) image tokens. The matrix \(\operatorname{softmax}(QK^T/\sqrt d)\) is ${nq} × ${n}: \(${big(nq * n)}\) entries. Each query gets one output row, so Y has ${nq} rows whatever the image size; self-attention among the image tokens would need \(${big(n)}^2=${big(n * n)}\) entries.`};
    }},
    {key: 'cross-attention-row', skill: 'Compute one object query’s cross-attention', make(r) {
      let q, keys, s;
      do {
        q = Array.from({length: 4}, () => r.int(-1, 2));
        keys = Array.from({length: 3}, () => Array.from({length: 4}, () => r.int(-1, 1)));
        s = keys.map(k => dot(q, k));
      } while (q.every(v => v === 0) || new Set(s).size < 2);
      const vals = Array.from({length: 3}, () => r.int(-3, 5)), l = s.map(v => v / 2), a = softmax(l), out = dot(a, vals), ex = l.map(Math.exp), Z = ex.reduce((t, v) => t + v, 0);
      return {prompt: Q`An object query \(q=${tup(q)}\) (d = 4) cross-attends to three image tokens with keys \(k_1=${tup(keys[0])}\), \(k_2=${tup(keys[1])}\), \(k_3=${tup(keys[2])}\) and scalar values \(v=${tup(vals)}\). Compute the weights \(\operatorname{softmax}(q^Tk_j/\sqrt d)\) and the output \(\sum_ja_jv_j\).`,
        answers: [{label: Q`\((a_1,a_2,a_3)\)`, vector: a, tol: .002}, {label: 'Output', value: out, tol: .01}],
        hint: Q`Score each image token with a dot product, divide by \(\sqrt4=2\), apply the softmax, then average the values.`,
        solution: Q`Scores \(${tup(s)}\); divided by 2: \(${tup(l)}\). Exponentials \(${tup(ex.map(v => dec(v)))}\) sum to \(${dec(Z)}\), so \(a=${tup(a.map(v => dec(v)))}\). Output \(${a.map((w, j) => Q`${dec(w)}\cdot(${vals[j]})`).join('+')}=${dec(out)}\). The query is not one of the image tokens: it only reads from them.`};
    }},
    {key: 'sinusoidal-pe', skill: 'Compute sinusoidal position encodings and their dot product', make(r) {
      const w1 = r.pick([.1, .01, .5]), p = r.int(0, 12);
      let p2; do { p2 = r.int(0, 12); } while (p2 === p);
      const pe = x => [Math.sin(x), Math.cos(x), Math.sin(w1 * x), Math.cos(w1 * x)], P = pe(p), P2 = pe(p2), d = p - p2, val = dot(P, P2);
      return {prompt: Q`With D = 4 and frequencies \(\omega=(1,\ ${w1})\), \(\mathrm{PE}(p)=(\sin\omega_0p,\ \cos\omega_0p,\ \sin\omega_1p,\ \cos\omega_1p)\) (angles in radians). Compute \(\mathrm{PE}(${p})\) and the dot product \(\mathrm{PE}(${p})\cdot\mathrm{PE}(${p2})\).`,
        answers: [{label: Q`\(\mathrm{PE}(${p})\) (4 entries)`, vector: P, tol: .002}, {label: 'Dot product', value: val, tol: .002}],
        hint: Q`Each sine–cosine pair contributes \(\sin a\sin b+\cos a\cos b=\cos(a-b)\), so the dot product is \(\cos(\omega_0\Delta)+\cos(\omega_1\Delta)\) with \(\Delta=p-p'\).`,
        solution: Q`\(\mathrm{PE}(${p})=(${P.map(v => dec(v)).join(',\ ')})\). With \(\Delta=${p}-${p2}=${d}\): \(\cos(${d})+\cos(${dec(w1 * d, 3)})=${dec(Math.cos(d))}+${dec(Math.cos(w1 * d))}=${dec(val)}\). Only the offset matters, so shifting both positions by the same amount gives the same value.`};
    }},
    {key: 'rope-score', skill: 'Score a query and key with rotary position embedding', make(r) {
      let q, k;
      do { q = [r.int(-2, 2), r.int(-2, 2)]; k = [r.int(-2, 2), r.int(-2, 2)]; } while (q.every(v => !v) || k.every(v => !v) || q[1] * k[0] - q[0] * k[1] === 0);
      const th = r.pick([.25, .5, 1]), m = r.int(0, 6);
      let n; do { n = r.int(0, 6); } while (n === m);
      const phi = (n - m) * th, cross = q[1] * k[0] - q[0] * k[1], score = Math.cos(phi) * dot(q, k) + Math.sin(phi) * cross;
      return {prompt: Q`RoPE rotates a 2-D query at position m by \(R(m\theta)\) and a key at position n by \(R(n\theta)\), with \(R(\phi)=\begin{bmatrix}\cos\phi&-\sin\phi\\\sin\phi&\cos\phi\end{bmatrix}\). For \(q=${tup(q)}\), \(k=${tup(k)}\), \(\theta=${th}\), m = ${m} and n = ${n}, what is the offset n − m, and what is the score \((R(m\theta)q)^T(R(n\theta)k)\)?`,
        answers: [{label: 'Offset n − m', value: n - m, tol: 0}, {label: 'Score', value: score, tol: .005}],
        hint: Q`\(R(m\theta)^TR(n\theta)=R((n-m)\theta)\), and \(q^TR(\phi)k=\cos\phi\,(q\cdot k)+\sin\phi\,(q_2k_1-q_1k_2)\).`,
        solution: Q`The offset is ${n} − ${m} = ${n - m}, so \(\phi=(${n - m})\cdot${th}=${dec(phi, 3)}\). Then \(q\cdot k=${dot(q, k)}\) and \(q_2k_1-q_1k_2=${cross}\), giving \(\cos(${dec(phi, 3)})\cdot(${dot(q, k)})+\sin(${dec(phi, 3)})\cdot(${cross})=${dec(score)}\). Any positions with the same offset give the same score.`};
    }},
    {key: 'set-matching', skill: 'Find the one-to-one matching of smallest total cost', make(r) {
      let C, sums, best;
      do {
        const vals = r.shuffle(r.distinct(6, 1, 12).map(v => v / 10));
        C = [vals.slice(0, 3), vals.slice(3)];
        sums = allAssignments(2, 3).map(a => [a, total(C, a)]).sort((u, v) => u[1] - v[1]);
        best = sums[0];
      } while (Math.abs(sums[1][1] - best[1]) < 1e-9);
      const g = greedy(C), gt = total(C, g), unmatched = [0, 1, 2].find(j => !best[0].includes(j));
      const first = C[0][g[0]] < C[1][g[1]] ? 0 : 1, second = 1 - first;
      const greedyText = `Greedy first takes the cheapest entry, T${first + 1} → P${g[first] + 1} (${C[first][g[first]]}), then gives T${second + 1} its cheapest remaining prediction, P${g[second] + 1} (${C[second][g[second]]}): total ${dec(gt, 2)}${Math.abs(gt - best[1]) < 1e-9 ? ', the same as the optimum here' : ', worse than the optimum'}.`;
      return {prompt: Q`Two targets T1, T2 and three predictions P1, P2, P3 have matching costs T1: \(${tup(C[0])}\) and T2: \(${tup(C[1])}\) (one entry per prediction). Find the smallest total cost of a one-to-one matching, the total that greedy matching gives (cheapest pair first), and the prediction that is trained towards ∅.`,
        answers: [{label: 'Smallest total', value: best[1], tol: .001}, {label: 'Greedy total', value: gt, tol: .001}, {label: 'Matched to ∅', choices: ['P1', 'P2', 'P3'], correct: unmatched}],
        hint: 'There are only 3 × 2 = 6 matchings: choose a prediction for T1, then a different one for T2, and add the two costs.',
        solution: Q`All six totals: ${sums.map(([a, t]) => `(P${a[0] + 1}, P${a[1] + 1}) ${dec(t, 2)}`).join('; ')}. The best is T1 → P${best[0][0] + 1}, T2 → P${best[0][1] + 1} with total ${dec(best[1], 2)}. ${greedyText} In the optimal matching P${unmatched + 1} is left over, so its target is ∅.`};
    }},
  ];

  /* ---------- Lab: match predictions to objects on the coffee photo, and one query's cross-attention ---------- */
  const IMG_W = 240, IMG_H = 160, S = 2;   // canvas drawn at twice the photo resolution
  const TARGETS = [{name: 'cup', box: [68, 6, 162, 122]}, {name: 'saucer', box: [30, 28, 193, 150]}, {name: 'spoon', box: [127, 27, 168, 130]}];
  const CLASSES = ['cup', 'saucer', 'spoon', '∅'];
  const PROBS = [[.70, .10, .05, .15], [.55, .15, .05, .25], [.15, .60, .05, .20], [.10, .05, .55, .30]];
  const START = [[74, 14, 160, 116], [52, 18, 146, 126], [40, 40, 184, 146], [124, 76, 170, 126]];
  const PCOL = ['#e8743b', '#d4a017', '#7fb8df', '#c779d0'];
  const toCxcywh = b => [(b[0] + b[2]) / 2 / IMG_W, (b[1] + b[3]) / 2 / IMG_H, (b[2] - b[0]) / IMG_W, (b[3] - b[1]) / IMG_H];
  function costs(s, preds) {
    return TARGETS.map((t, ti) => preds.map((b, j) => {
      const cls = -PROBS[j][ti], l1 = toCxcywh(t.box).reduce((acc, v, k) => acc + Math.abs(v - toCxcywh(b)[k]), 0), g = boxStats(t.box, b).giou;
      return {cls, l1, g, total: s.lc * cls + s.ll * l1 + s.lg * (1 - g)};
    }));
  }
  function matchBy(rule, C, qid) {
    const M = C.map(row => row.map(c => c.total));
    if (rule === 'greedy') return greedy(M);
    if (rule === 'order') return TARGETS.map((_, t) => qid.indexOf(t + 1));   // target t ↔ the prediction from query t + 1
    return hungarian(M);
  }
  // Coffee patches for cross-attention: 15 × 10 tokens of 16 × 16 pixels.
  const COLS = 15, ROWS = 10, PATCH = 16;
  const OMEGA = f => 2 * 2 ** -f;   // radians per patch: 2, 1, 0.5, ...
  const posSim = (dx, dy, F) => { let t = 0; for (let f = 0; f < F; f++) t += Math.cos(OMEGA(f) * dx) + Math.cos(OMEGA(f) * dy); return t / F; };
  // The query's content vector is the mean feature of the patches in one small region of the photo.
  const QUERIES = {red: ['Dark red (from the cup body)', [72, 78, 160, 122]], white: ['White (from the cup rim)', [70, 8, 162, 36]], metal: ['Shiny metal (from the spoon head)', [128, 94, 162, 128]], none: ['No content (position only)', null]};
  const inBox = (i, b) => { const cx = (i % COLS + .5) * PATCH, cy = (Math.floor(i / COLS) + .5) * PATCH; return cx >= b[0] && cx <= b[2] && cy >= b[1] && cy <= b[3]; };
  function attention(s, data) {
    const {z, n} = data, keys = Object.keys(z), d = keys.length, X = Array.from({length: n}, (_, i) => keys.map(k => z[k][i]));
    let cq = new Array(d).fill(0);
    const region = QUERIES[s.content]?.[1];
    if (region) {
      const sel = Array.from({length: n}, (_, i) => i).filter(i => inBox(i, region));
      cq = keys.map((_, k) => sel.reduce((t, i) => t + X[i][k], 0) / sel.length);
    }
    const qx = s.qx - 1, qy = s.qy - 1;
    const scores = X.map((x, i) => 2 * (s.alpha * dot(cq, x) / Math.sqrt(d) + s.beta * posSim(i % COLS - qx, Math.floor(i / COLS) - qy, s.F)));
    return {a: softmax(scores), d};
  }
  function syncInputs(root, s, keys) {
    keys.forEach(k => {
      const el = root.querySelector('#vk-' + k);
      if (el && Number(el.value) !== s[k]) { el.value = s[k]; const out = root.querySelector(`#vk-${k}-value`); if (out) out.textContent = window.CV_VISION.fmt(s[k]); }
    });
  }
  const lab = {
    name: 'setmatch', title: 'Set prediction and cross-attention', photo: 'coffee',
    heading: 'Match boxes to objects. Then watch one query look.',
    intro: 'Matching mode: three objects (green) and four predicted boxes from four queries Q1–Q4, each with fixed class probabilities. Drag a box to move it, or its corner square to resize it. The cost matrix and the matching update live. Cross-attention mode: one object query scores the 15 × 10 patch tokens of the photo by content and by position.',
    defaults: {mode: 'match', rule: 'hungarian', lc: 1, ll: 5, lg: 2, preds: START.map(b => b.slice()), qid: [1, 2, 3, 4], content: 'red', alpha: 1, beta: 0, F: 3, qx: 7, qy: 6},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('mode', 'Experiment', [['match', 'Match predictions to objects'], ['attend', 'Cross-attention of one object query']], s.mode) +
        `<div data-show-when="mode:match">${select('rule', 'Matching rule', [['hungarian', 'Hungarian (smallest total cost)'], ['greedy', 'Greedy (cheapest pair first)'], ['order', 'Fixed order (target i ↔ query i)']], s.rule)}` +
        range('lc', 'Class weight λ_class', 0, 4, .5, s.lc) + range('ll', 'Box L1 weight λ_L1', 0, 10, .5, s.ll) + range('lg', 'GIoU weight λ_giou', 0, 5, .5, s.lg) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="shuffle">Shuffle the query numbers ↻</button><button type="button" class="btn" data-vk-action="boxes">Reset the boxes</button></div>' +
        '<div class="math-rule">cost = −λ_class p̂(c) + λ_L1 ‖b − b̂‖₁ + λ_giou (1 − GIoU)</div></div>' +
        `<div data-show-when="mode:attend">${select('content', 'Query content', Object.entries(QUERIES).map(([k, v]) => [k, v[0]]), s.content)}` +
        range('alpha', 'Content weight α', 0, 2, .1, s.alpha) + range('beta', 'Position weight β', 0, 2, .1, s.beta) + range('F', 'Frequencies per axis F', 1, 6, 1, s.F) +
        range('qx', 'Query position: column', 1, COLS, 1, s.qx) + range('qy', 'Query position: row', 1, ROWS, 1, s.qy) +
        '<div class="math-rule">score = 2 [α c_q·c_k / √d + β (1/F) Σ_f (cos ω_f Δx + cos ω_f Δy)],  ω_f = 2, 1, 0.5, … per patch</div></div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div data-show-when="mode:match">${figure('sm-photo', 'Green: objects. Coloured dashes: predictions Q1–Q4 (drag to move, drag the corner square to resize). Solid links join matched pairs; ∅ marks a prediction trained towards “no object”.', 'vk-clickable')}<div id="sm-table" style="overflow-x:auto"></div></div>` +
        `<div data-show-when="mode:attend"><div class="vk-pair">${figure('sa-photo', 'Click to move the query position (cross). Dimmed patches receive little attention. Dashed boxes: the cup (green) and the saucer (blue).', 'vk-clickable')}${figure('sa-heat', 'The same attention row as a heat-map, scaled to its largest weight.', 'vk-clickable')}</div><div id="sa-plot"></div></div>`;
    },
    note: 'Predict first, in matching mode: the second query (Q2) sits on the cup next to Q1. Which one gets the cup, and what happens to the other? The cheaper one wins the cup and the other is matched to ∅, so training teaches it to say “no object”; no non-maximum suppression is needed. Choose the fixed-order rule: it pairs each object with the query that has its number, whatever that query predicts, and the loss jumps. Press shuffle: the Hungarian matching and its loss do not change, because they ignore the query order. Drag Q4 off the spoon until it no longer overlaps: the GIoU term still grows with the distance, so the loss still says which way to move. In cross-attention mode, start with the dark-red query, α = 1 and β = 0: it attends to the cup body and the saucer alike, because content alone cannot say which red object is meant. Raise β to 1 with the cross on the cup and most of the attention moves inside the cup box; move the cross to the left of the saucer and the same query picks the saucer instead. Set F = 1: a single frequency repeats every π patches, so distant stripes look as near as neighbours.',
    async setup() {
      const V = window.CV_VISION, img = await V.load('coffee'), {w, h, gray, rgba} = img, n = COLS * ROWS, P = PATCH;
      const raw = {r: [], g: [], b: [], bright: [], energy: []};
      const at = (x, y) => gray[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
      for (let pr = 0; pr < ROWS; pr++) for (let pc = 0; pc < COLS; pc++) {
        let sr = 0, sg = 0, sb = 0, sy = 0, en = 0;
        for (let y = pr * P; y < pr * P + P; y++) for (let x = pc * P; x < pc * P + P; x++) {
          const i = y * w + x, gx = (at(x + 1, y) - at(x - 1, y)) / 2, gy = (at(x, y + 1) - at(x, y - 1)) / 2;
          sr += rgba[4 * i]; sg += rgba[4 * i + 1]; sb += rgba[4 * i + 2]; sy += gray[i]; en += gx * gx + gy * gy;
        }
        const m = P * P;
        raw.r.push(sr / m); raw.g.push(sg / m); raw.b.push(sb / m); raw.bright.push(sy / m); raw.energy.push(Math.log1p(en / m));
      }
      const z = {};
      for (const [k, v] of Object.entries(raw)) { const mu = v.reduce((t, x) => t + x, 0) / n, sd = Math.sqrt(v.reduce((t, x) => t + (x - mu) ** 2, 0) / n) || 1; z[k] = v.map(x => (x - mu) / sd); }
      return {img, n, z};
    },
    render(s, root, data) {
      return s.mode === 'attend' ? renderAttend(s, root, data) : renderMatch(s, root, data);
    },
    wire(root, s, rerender) {
      const V = window.CV_VISION;
      const photo = root.querySelector('#sm-photo');
      if (photo) {
        photo.style.touchAction = 'none';
        let drag = null;
        const at = e => { const r = photo.getBoundingClientRect(); return r.width ? [(e.clientX - r.left) / r.width * IMG_W, (e.clientY - r.top) / r.height * IMG_H] : null; };
        photo.addEventListener('pointerdown', e => {
          const p = at(e); if (!p) return;
          const tol = 7 * IMG_W / Math.max(1, photo.getBoundingClientRect().width) + 3;
          let hit = null;
          s.preds.forEach((b, j) => { if (Math.hypot(p[0] - b[2], p[1] - b[3]) < tol) hit = {j, kind: 'size'}; });
          if (!hit) {
            const inside = s.preds.map((b, j) => [j, (b[2] - b[0]) * (b[3] - b[1])]).filter(([j]) => { const b = s.preds[j]; return p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3]; }).sort((u, v) => u[1] - v[1]);
            if (inside.length) hit = {j: inside[0][0], kind: 'move'};
          }
          if (!hit) return;
          drag = {...hit, start: p, box: s.preds[hit.j].slice()};
          e.preventDefault();
          try { photo.setPointerCapture(e.pointerId); } catch {}
        });
        photo.addEventListener('pointermove', e => {
          if (!drag) return;
          const p = at(e); if (!p) return;
          const dx = p[0] - drag.start[0], dy = p[1] - drag.start[1], b = drag.box;
          if (drag.kind === 'move') {
            const ox = V.clamp(dx, -b[0], IMG_W - b[2]), oy = V.clamp(dy, -b[1], IMG_H - b[3]);
            s.preds[drag.j] = [b[0] + ox, b[1] + oy, b[2] + ox, b[3] + oy].map(Math.round);
          } else s.preds[drag.j] = [b[0], b[1], V.clamp(Math.round(b[2] + dx), b[0] + 6, IMG_W), V.clamp(Math.round(b[3] + dy), b[1] + 6, IMG_H)];
          e.preventDefault();
          rerender();
        });
        const end = e => { if (!drag) return; drag = null; try { photo.releasePointerCapture(e.pointerId); } catch {} };
        photo.addEventListener('pointerup', end); photo.addEventListener('pointercancel', end);
      }
      ['#sa-photo', '#sa-heat'].forEach(sel => {
        const el = root.querySelector(sel);
        if (!el) return;
        el.style.touchAction = 'none';
        const pick = e => {
          const r = el.getBoundingClientRect(); if (!r.width) return;
          const qx = V.clamp(Math.floor((e.clientX - r.left) / r.width * COLS) + 1, 1, COLS), qy = V.clamp(Math.floor((e.clientY - r.top) / r.height * ROWS) + 1, 1, ROWS);
          if (qx !== s.qx || qy !== s.qy) { s.qx = qx; s.qy = qy; syncInputs(root, s, ['qx', 'qy']); rerender(); }
        };
        el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); pick(e); });
        el.addEventListener('pointermove', e => { if (el.hasPointerCapture?.(e.pointerId)) pick(e); });
      });
    },
    action(name, s) {
      if (name === 'boxes') s.preds = START.map(b => b.slice());
      if (name === 'shuffle') { const old = s.qid.join(); do { s.qid = s.qid.map(v => [v, Math.random()]).sort((u, v) => u[1] - v[1]).map(u => u[0]); } while (s.qid.join() === old); }
    },
  };
  function renderMatch(s, root, data) {
    const V = window.CV_VISION, {img} = data, C = costs(s, s.preds), asg = matchBy(s.rule, C, s.qid);
    const hung = hungarian(C.map(r => r.map(c => c.total))), M = C.map(r => r.map(c => c.total));
    const brute = Math.min(...allAssignments(3, 4).map(a => total(M, a)));
    const canvas = root.querySelector('#sm-photo');
    canvas.width = IMG_W * S; canvas.height = IMG_H * S;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (img.img) ctx.drawImage(img.img, 0, 0, IMG_W * S, IMG_H * S);
    else V.showRGBA(canvas, img.rgba, img.w, img.h);
    const rect = (b, color, width, dash = []) => { ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.strokeRect(b[0] * S, b[1] * S, (b[2] - b[0]) * S, (b[3] - b[1]) * S); ctx.setLineDash([]); };
    const label = (x, y, t, bg) => { ctx.font = 'bold 12px Segoe UI, Arial'; const w = ctx.measureText ? ctx.measureText(t).width : 30; ctx.fillStyle = bg; ctx.fillRect(x, y - 13, w + 8, 16); ctx.fillStyle = '#ffffff'; ctx.fillText(t, x + 4, y); };
    TARGETS.forEach(t => { rect(t.box, '#3fae6a', 3); label(t.box[0] * S + 2, t.box[3] * S - 4, t.name, '#2f8a53'); });
    const centre = b => [(b[0] + b[2]) / 2 * S, (b[1] + b[3]) / 2 * S];
    s.preds.forEach((b, j) => {
      const matched = asg.includes(j);
      rect(b, PCOL[j], 2.4, [7, 4]);
      ctx.fillStyle = PCOL[j]; ctx.fillRect(b[2] * S - 6, b[3] * S - 6, 12, 12);
      label(b[0] * S + 3, b[1] * S + 16, `Q${s.qid[j]}${matched ? '' : ' → ∅'}`, PCOL[j]);
    });
    asg.forEach((j, t) => {
      const [x0, y0] = centre(TARGETS[t].box), [x1, y1] = centre(s.preds[j]);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = PCOL[j]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = '#3fae6a'; ctx.beginPath(); ctx.arc(x0, y0, 4, 0, 2 * Math.PI); ctx.fill();
    });
    // Cost table: one row per object, one column per query (sorted by query number).
    const order = [0, 1, 2, 3].sort((a, b) => s.qid[a] - s.qid[b]);
    const head = order.map(j => `<th style="color:${PCOL[j]}">Q${s.qid[j]}<br><span style="font-weight:400">${PROBS[j].map((v, c) => `${CLASSES[c]} ${v}`).join(' · ')}</span></th>`).join('');
    const rows = TARGETS.map((t, ti) => `<tr><td><b>${t.name}</b></td>${order.map(j => { const c = C[ti][j], on = asg[ti] === j; return `<td style="${on ? 'font-weight:700;background:var(--green-soft)' : ''}" title="class ${V.fmt(c.cls, 2)}, L1 ${V.fmt(c.l1, 3)}, GIoU ${V.fmt(c.g, 3)}">${V.fmt(c.total, 3)}<br><span style="font-size:10px">GIoU ${V.fmt(c.g, 2)}</span></td>`; }).join('')}</tr>`).join('');
    root.querySelector('#sm-table').innerHTML = `<table class="vk-table"><thead><tr><th>Object</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    // DETR-style loss with the chosen matching: −ln p̂(c) + box terms for matched pairs; 0.1 · (−ln p̂(∅)) for the rest.
    let loss = 0;
    asg.forEach((j, t) => { const c = C[t][j]; loss += -Math.log(PROBS[j][t]) + s.ll * c.l1 + s.lg * (1 - c.g); });
    [0, 1, 2, 3].filter(j => !asg.includes(j)).forEach(j => { loss += .1 * -Math.log(PROBS[j][3]); });
    const pairs = asg.map((j, t) => `${TARGETS[t].name} → Q${s.qid[j]}`).join(', '), empty = [0, 1, 2, 3].filter(j => !asg.includes(j)).map(j => `Q${s.qid[j]}`).join(', ');
    return V.report([
      ['Matching', pairs], ['Trained towards ∅', empty],
      ['Total matching cost', `${V.fmt(total(M, asg), 3)}${s.rule === 'hungarian' ? '' : ` (Hungarian: ${V.fmt(total(M, hung), 3)})`}`],
      ['Smallest of all 24 matchings', `${V.fmt(brute, 3)}${Math.abs(brute - total(M, hung)) < 1e-9 ? ' = Hungarian ✓' : ''}`],
      ['Training loss with this matching', V.fmt(loss, 3)],
    ]);
  }
  function renderAttend(s, root, data) {
    const V = window.CV_VISION, {img, n} = data, P = PATCH, {a, d} = attention(s, data);
    const amax = Math.max(...a), top = a.indexOf(amax), H = -a.reduce((t, w) => t + (w > 0 ? w * Math.log(w) : 0), 0);
    const share = test => a.reduce((t, w, i) => t + (test(i) ? w : 0), 0), cupB = TARGETS[0].box, sauB = TARGETS[1].box;
    const inCup = share(i => inBox(i, cupB)), saucerOnly = share(i => inBox(i, sauB) && !inBox(i, cupB)), outside = share(i => !inBox(i, sauB) && !inBox(i, cupB));
    const photo = root.querySelector('#sa-photo');
    V.showRGBA(photo, img.rgba, img.w, img.h);
    const ctx = photo.getContext('2d');
    for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(0,0,0,${(.82 * (1 - Math.sqrt(a[i] / amax))).toFixed(3)})`; ctx.fillRect(i % COLS * P, Math.floor(i / COLS) * P, P, P); }
    const cross = (g, color) => { const x = (s.qx - .5) * P, y = (s.qy - .5) * P; g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke(); };
    [[cupB, '#3fae6a'], [sauB, '#7fb8df']].forEach(([b, color]) => { ctx.setLineDash([4, 3]); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); ctx.setLineDash([]); });
    cross(ctx, '#e8743b');
    const heat = root.querySelector('#sa-heat');
    heat.width = img.w; heat.height = img.h;
    const hx = heat.getContext('2d');
    for (let i = 0; i < n; i++) { const t = a[i] / amax; hx.fillStyle = `rgb(${Math.round(255 * Math.min(1, t * 1.6))},${Math.round(255 * V.clamp(t * 1.6 - .45, 0, 1))},${Math.round(255 * V.clamp(t * 2.2 - 1.2, 0, 1))})`; hx.fillRect(i % COLS * P, Math.floor(i / COLS) * P, P, P); }
    cross(hx, '#7fb8df');
    const pts = Array.from({length: 113}, (_, i) => { const dx = -14 + i * .25; return [dx, posSim(dx, 0, s.F)]; });
    const ticks = Array.from({length: 15}, (_, i) => -14 + 2 * i).filter(v => v % 7 === 0);
    root.querySelector('#sa-plot').innerHTML = window.CV_VISION_LABS.svgPlot({x: [-14, 14], y: [-2, 2], lines: [{points: pts}], marker: 0, label: 'Position similarity of two patches in the same row against their column offset', xLabel: 'column offset Δx (same row)', yLabel: 'position similarity', xTicks: ticks, yTicks: [-2, 0, 2]});
    const where = i => `column ${i % COLS + 1}, row ${Math.floor(i / COLS) + 1}`;
    return V.report([
      ['Attention inside the cup box', V.fmt(100 * inCup, 1) + '%'],
      ['On the saucer outside the cup', V.fmt(100 * saucerOnly, 1) + '%'],
      ['Outside both', V.fmt(100 * outside, 1) + '%'],
      ['Largest weight', `${V.fmt(amax, 3)} at ${where(top)}`],
      ['Effective patches exp(H)', `${V.fmt(Math.exp(H), 1)} of ${n}`],
      ['Content features d', `${d} (R, G, B, brightness, texture)`],
    ]);
  }

  window.CV_EXTEND.lesson(65, {
    teaching: {
      equation: Q`\begin{gathered}Y=\operatorname{softmax}\!\Bigl(\frac{QK^T}{\sqrt d}\Bigr)V,\quad Q=X_qW_Q,\ K=X_{\rm img}W_K,\ V=X_{\rm img}W_V\\ \hat\sigma=\arg\min_{\sigma}\sum_i\mathcal L_{\rm match}\bigl(y_i,\hat y_{\sigma(i)}\bigr),\qquad \mathrm{GIoU}=\mathrm{IoU}-\frac{|C\setminus(A\cup B)|}{|C|}\end{gathered}`,
      symbols: [['X_q, X_img', 'query tokens and image tokens'], ['PE(p)', 'sinusoidal position encoding'], ['σ̂', 'best one-to-one assignment'], ['∅', 'the no-object class'], ['GIoU', 'generalised intersection over union'], ['C', 'smallest box enclosing A and B']],
      connection: 'DETR, Deformable DETR, DINO and Mask2Former decode a set of object queries by cross-attention to image features, match them to the ground truth with the Hungarian algorithm and train the boxes with L1 plus GIoU. Diffusion models use the same cross-attention to read a text prompt, and RoPE and Fourier features encode positions in recent ViTs and in NeRF.',
      trap: 'Comparing prediction i with ground-truth object i in a fixed order. The objects have no natural order, so the loss would punish correct boxes in the “wrong” slot; set prediction needs the best one-to-one matching first.',
      question: 'A DETR model outputs two nearly identical boxes on the same cup. What does the Hungarian-matched loss do with the second box?',
      choices: ['Matches it to “no object” and trains its no-object probability up', 'Averages it with the first box', 'Ignores it, so non-maximum suppression must remove it'], correct: 0,
      explanation: 'Each object is matched to exactly one prediction. The cheaper of the two duplicates takes the cup; the other is assigned ∅, and the cross-entropy −ln p̂(∅) pushes it to predict no object. That is why DETR needs no non-maximum suppression.',
    },
    guide: {
      title: 'Learned queries read the image, and each object claims exactly one of them',
      paragraphs: [
        'In cross-attention the queries come from one set and the keys and values from another. DETR’s decoder holds a fixed set of learned object queries; each reads the image tokens through softmax(QKᵀ/√d)V and becomes one predicted class and box. Sine and cosine position encodings, whose dot products depend only on the offset between positions, tell the queries where each image token is.',
        'Because the objects in an image have no order, training first finds the one-to-one matching between predictions and objects with the smallest total cost (the Hungarian algorithm), labels the leftover predictions “no object”, and only then applies the class and box losses. GIoU, the box term, keeps a slope even when boxes do not overlap.',
      ],
      example: 'Slide box B past box A and compare IoU with GIoU',
      controls: [{label: 'B’s left edge x', min: -1, max: 6, step: .5, value: 3}, {label: 'B’s bottom edge y', min: 0, max: 3, step: .5, value: 0}, {label: 'B’s width', min: 1, max: 4, step: .5, value: 2}],
      predict: 'Move B from x = 3 to x = 5, further from A. Will IoU change? Will GIoU?',
      takeaway: 'GIoU subtracts the empty fraction of the smallest enclosing box from IoU. It equals IoU when the boxes fill that box, and it keeps decreasing as separated boxes move apart, so 1 − GIoU gives a training signal where 1 − IoU is flat.',
      notation: 'Boxes are [x₀, y₀, x₁, y₁]. A = [0, 0, 2, 2] is fixed and B = [x, y, x + width, y + 2] moves. C is the smallest axis-aligned box containing both, |·| is an area, and C ∖ (A ∪ B) is the part of C covered by neither box.',
    },
    notation: {
      'X_q, X_img': {tex: Q`X_q,\ X_{\rm img}`, detail: 'The two token sets of cross-attention: X_q holds the query tokens (in DETR, 100 learned object queries) and X_img the image tokens from the backbone. Queries come from X_q; keys and values from X_img.'},
      'PE(p)': {tex: Q`\mathrm{PE}(p)`, detail: 'The sinusoidal encoding of position p: pairs (sin ω_i p, cos ω_i p) with ω_i = 10000^(−2i/D). Shifting p rotates every pair, so PE(p)·PE(p′) depends only on p − p′.'},
      'σ̂': {tex: Q`\hat\sigma`, detail: 'The permutation of the predictions that minimises the total matching cost against the targets, found by the Hungarian algorithm. σ̂(i) is the prediction assigned to target i.'},
      '∅': {tex: Q`\varnothing`, detail: 'The extra “no object” class. Targets are padded with ∅ up to the number of queries; predictions left unmatched are trained to predict it.'},
      GIoU: {tex: Q`\mathrm{GIoU}`, detail: 'Generalised IoU: IoU minus the fraction of the enclosing box C covered by neither box. It lies in (−1, 1], equals IoU when the boxes fill C, and still changes when boxes do not overlap.'},
      C: {tex: 'C', detail: 'Here C is the smallest axis-aligned box that contains both A and B, not a cost matrix or a number of channels.'},
    },
    calculate, practice, lab,
  });
  // Exposed for the node harness and for later lessons that reuse the helpers.
  window.CV_EXTEND.registry[65].helpers = {boxStats, hungarian, greedy, allAssignments, posSim, attention, costs, matchBy};
})();
