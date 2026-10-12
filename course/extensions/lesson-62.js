/* Lesson 62: triangulation, rectification and stereo depth. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const P = (x, d = 3) => x < 0 ? `(${N(x, d)})` : N(x, d);   // parenthesize negatives after \cdot
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const vec = (v, d = 3) => `(${v.map(x => N(x, d)).join(', ')})`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${extra}>${E(s)}</text>`;
  const z0 = v => v + 0;

  /* ---------- Worked example: depth from disparity and its error ---------- */
  function model(p) {
    const [d, f, B, sd] = p, fB = f * B, Z = fB / d, Zfar = fB / (d - 1), Znear = fB / (d + 1), slope = -fB / (d * d), sZ = Z * Z * sd / fB;
    return {d, f, B, sd, fB, Z, Zfar, Znear, slope, sZ, rel: 100 * sZ / Z};
  }
  function drawing(m) {
    // Left: Z = fB/d against d, with the ±σ_d strip and the ±σ_Z band it produces. Right: σ_Z against Z.
    const L = 52, R = 300, T = 22, Bot = 212, dMax = 40, Zmax = Math.max(2, Math.ceil(2.5 * m.Z));
    const X = d => L + d / dMax * (R - L), Y = z => Bot - Math.min(z, Zmax * 1.02) / Zmax * (Bot - T), f1 = v => v.toFixed(1);
    let body = `<rect x="${L}" y="${T}" width="${R - L}" height="${Bot - T}" fill="#f6f5ef" stroke="#a8b6a5"/>`;
    const lo = Math.max(.5, m.d - m.sd), hi = m.d + m.sd;
    body += `<rect x="${f1(X(lo))}" y="${T}" width="${f1(X(hi) - X(lo))}" height="${Bot - T}" fill="#315c86" opacity=".14"/>`;
    const zTop = Math.min(m.fB / lo, Zmax), zBot = m.fB / hi;
    body += `<rect x="${L}" y="${f1(Y(zTop))}" width="${R - L}" height="${f1(Y(zBot) - Y(zTop))}" fill="#bd431c" opacity=".14"/>`;
    let path = '';
    for (let i = 0; i <= 160; i++) { const d = .5 + (dMax - .5) * i / 160, z = m.fB / d; path += `${i ? 'L' : 'M'}${f1(X(d))} ${f1(Y(z))}`; }
    body += `<clipPath id="l62-clip"><rect x="${L}" y="${T}" width="${R - L}" height="${Bot - T}"/></clipPath><path d="${path}" fill="none" stroke="#34734e" stroke-width="2.5" clip-path="url(#l62-clip)"/>`;
    for (const dd of [m.d - 1, m.d + 1]) { const z = m.fB / dd; if (z <= Zmax) body += `<circle cx="${f1(X(dd))}" cy="${f1(Y(z))}" r="3.5" fill="#34734e"/>`; }
    body += `<circle cx="${f1(X(m.d))}" cy="${f1(Y(m.Z))}" r="6" fill="#bd431c"/>`;
    [0, 10, 20, 30, 40].forEach(v => { body += txt(X(v), Bot + 14, String(v), '#64736b', 10.5, 'middle'); });
    [0, Zmax / 2, Zmax].forEach(v => { body += txt(L - 6, Y(v) + 4, N(v, 1), '#64736b', 10.5, 'end'); });
    body += txt((L + R) / 2, Bot + 30, 'disparity d (px)', '#64736b', 11, 'middle') + txt(14, (T + Bot) / 2, 'depth Z (m)', '#64736b', 11, 'middle', ` transform="rotate(-90 14 ${(T + Bot) / 2})"`);
    body += txt(L + 8, T + 16, `Z = fB/d = ${N(m.Z, 2)} m`, '#bd431c', 12.5, 'start', ' font-weight="600"') + txt(L + 8, T + 32, `± ${N(m.sZ, 3)} m for d ± ${N(m.sd, 2)} px`, '#bd431c', 11.5);
    // Right panel: σ_Z grows with Z².
    const L2 = 352, R2 = 536, Zr = Math.max(4, Math.ceil(2 * m.Z)), sMax = Zr * Zr * m.sd / m.fB, X2 = z => L2 + z / Zr * (R2 - L2), Y2 = s => Bot - s / sMax * (Bot - T);
    body += `<rect x="${L2}" y="${T}" width="${R2 - L2}" height="${Bot - T}" fill="#f6f5ef" stroke="#a8b6a5"/>`;
    let p2 = '';
    for (let i = 0; i <= 80; i++) { const z = Zr * i / 80; p2 += `${i ? 'L' : 'M'}${f1(X2(z))} ${f1(Y2(z * z * m.sd / m.fB))}`; }
    body += `<path d="${p2}" fill="none" stroke="#315c86" stroke-width="2.5"/><circle cx="${f1(X2(m.Z))}" cy="${f1(Y2(m.sZ))}" r="6" fill="#bd431c"/>`;
    body += txt(L2, Bot + 14, '0', '#64736b', 10.5, 'middle') + txt(R2, Bot + 14, N(Zr, 1), '#64736b', 10.5, 'middle') + txt((L2 + R2) / 2, Bot + 30, 'depth Z (m)', '#64736b', 11, 'middle');
    body += txt(L2 + 6, T + 16, 'σ_Z = Z²σ_d / (fB)', '#315c86', 12, 'start', ' font-weight="600"') + txt(L2 + 6, T + 32, `max ${N(sMax, 2)} m at ${N(Zr, 1)} m`, '#64736b', 11);
    return {body, caption: `Left: depth against disparity for fB = ${N(m.fB, 2)} pixel-metres. The blue strip is the disparity d = ${N(m.d)} ± ${N(m.sd, 2)} px; the curve turns it into the orange depth band ${N(zBot, 2)} to ${N(m.fB / lo, 2)} m, which widens quickly as d shrinks. Green dots: d − 1 and d + 1. Right: the first-order depth error grows with the square of the depth.`};
  }
  function calculate(p) {
    const m = model(p);
    return {
      steps: [
        step('Depth from disparity', Q`Z=\frac{fB}{d}=\frac{${N(m.f)}\cdot${N(m.B)}}{${N(m.d)}}=\frac{${N(m.fB)}}{${N(m.d)}}=${N(m.Z)}\ \text{m}`, `In a rectified pair a point at depth Z appears d = fB/Z pixels further left in the right image. f = ${N(m.f)} px is the focal length and B = ${N(m.B)} m the baseline; their product fB = ${N(m.fB)} has units of pixel-metres.`),
        step('One whole pixel either way', Q`Z(d-1)=\frac{${N(m.fB)}}{${N(m.d - 1)}}=${N(m.Zfar)},\qquad Z(d+1)=\frac{${N(m.fB)}}{${N(m.d + 1)}}=${N(m.Znear)}`, `A one-pixel matching mistake moves the depth by ${N(m.Zfar - m.Z, 3)} m one way and ${N(m.Z - m.Znear, 3)} m the other. The steps are unequal because Z = fB/d is a curve, not a line.`),
        step('Linearise: the slope of Z(d)', Q`\frac{dZ}{dd}=-\frac{fB}{d^2}=-\frac{Z^2}{fB}=-\frac{${N(m.Z)}^2}{${N(m.fB)}}=${N(m.slope, 4)}\ \text{m per px}`, 'The first-order Taylor approximation of Lesson 20 replaces the curve by its tangent at d: Z(d + δ) ≈ Z(d) + Z′(d)·δ. Near d the depth changes by this many metres for each pixel of disparity.'),
        step('Propagate the matching error', Q`\sigma_Z\approx\Bigl|\frac{dZ}{dd}\Bigr|\sigma_d=\frac{Z^2}{fB}\,\sigma_d=${N(-m.slope, 4)}\cdot${N(m.sd)}=${N(m.sZ, 4)}\ \text{m}\ \ (${N(m.rel, 2)}\%)`, `Scaling a random error by a constant scales its standard deviation by the size of that constant (Lesson 23). The error grows with Z², so the relative error σ_Z/Z = Zσ_d/(fB) = ${N(m.rel, 2)}% grows in proportion to the distance; a longer baseline or focal length reduces it.`),
      ],
      values: [['Depth Z (m)', m.Z], ['Depth at d - 1 (m)', m.Zfar], ['Depth at d + 1 (m)', m.Znear], ['Depth error sigma_Z (m)', m.sZ], ['Relative error (%)', m.rel]],
      note: 'Halve the disparity at fixed f and B: the point is twice as far, and its depth error is four times larger. Then double the baseline: the same point has twice the disparity and a quarter of the error.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const practice = [
    {key: 'depth-from-disparity', skill: 'Convert disparity to depth', make(r) {
      const f = r.pick([400, 500, 600, 700, 800, 1000]), B = r.pick([.05, .1, .12, .2, .25, .5]), d = r.int(4, 60), fB = f * B, Z = fB / d, Z1 = fB / (d + 1);
      return {prompt: Q`A rectified stereo rig has focal length f = ${f} px and baseline B = ${B} m. A pixel matches with disparity d = ${d} px. What is its depth, and what depth would a disparity one pixel larger give?`,
        answers: [{label: 'Depth Z (m)', value: Z, tol: .01}, {label: 'Depth at d + 1 (m)', value: Z1, tol: .01}],
        hint: Q`\(Z=fB/d\). Larger disparity means a nearer point.`,
        solution: Q`\(fB=${f}\cdot${B}=${N(fB)}\), so \(Z=${N(fB)}/${d}=${N(Z, 4)}\) m and \(Z(d+1)=${N(fB)}/${d + 1}=${N(Z1, 4)}\) m. One pixel of disparity is ${N(Z - Z1, 4)} m of depth here.`};
    }},
    {key: 'depth-error', skill: 'Propagate a disparity error to depth', make(r) {
      const f = r.pick([500, 600, 700, 800, 1000]), B = r.pick([.1, .12, .2, .25, .3]), Z = r.pick([2, 3, 4, 5, 8, 10, 15, 20]), sd = r.pick([.1, .2, .25, .5, 1]), fB = f * B, sZ = Z * Z * sd / fB;
      return {prompt: Q`A stereo rig has f = ${f} px and B = ${B} m, and its matcher has a disparity error of \(\sigma_d=${sd}\) px. To first order, what is the depth error \(\sigma_Z\) for a point at ${Z} m, and what would it be at ${2 * Z} m?`,
        answers: [{label: Q`\(\sigma_Z\) at ${Z} m`, value: sZ, rel: .005, tol: 1e-4}, {label: Q`\(\sigma_Z\) at ${2 * Z} m`, value: 4 * sZ, rel: .005, tol: 1e-4}],
        hint: Q`\(\sigma_Z\approx|dZ/dd|\,\sigma_d\) with \(dZ/dd=-fB/d^2=-Z^2/(fB)\).`,
        solution: Q`\(fB=${N(fB)}\). \(\sigma_Z\approx Z^2\sigma_d/(fB)=${Z}^2\cdot${sd}/${N(fB)}=${N(sZ, 4)}\) m. At twice the distance the error is \(2^2=4\) times larger: ${N(4 * sZ, 4)} m.`};
    }},
    {key: 'triangulate-rectified', skill: 'Triangulate a match in a rectified pair', make(r) {
      const B = r.pick([.5, 1, 2]), Z = r.pick([2, 4, 5, 8, 10]), X = r.int(-4, 4) / 2, Y = r.int(-4, 4) / 2;
      const a = X / Z, b = Y / Z, a2 = (X - B) / Z;
      return {prompt: Q`Two cameras are \(P_1=[I\,|\,0]\) and \(P_2=[I\,|\,(${-B},0,0)^T]\), so camera 2 sits ${B} units to the right. A point is seen at \(\hat x_1=(${N(a, 4)}, ${N(b, 4)})\) and \(\hat x_2=(${N(a2, 4)}, ${N(b, 4)})\) in normalised coordinates. Triangulate it.`,
        answers: [{label: Q`\(X=(X, Y, Z)\)`, vector: [X, Y, Z], tol: .01}],
        hint: Q`The rows match, so this pair is rectified. The disparity is \(\hat x_1-\hat x_2=B/Z\) in normalised units (f = 1); then \(X=\hat x_1Z\) and \(Y=\hat y_1Z\).`,
        solution: Q`The disparity is \(${N(a, 4)}-${P(a2, 4)}=${N(a - a2, 4)}=B/Z\), so \(Z=${B}/${N(a - a2, 4)}=${Z}\). Then \(X=${N(a, 4)}\cdot${Z}=${N(X)}\) and \(Y=${N(b, 4)}\cdot${Z}=${N(Y)}\). The DLT rows \((-1,0,${N(a, 4)},0)\), \((0,-1,${N(b, 4)},0)\), \((-1,0,${N(a2, 4)},${B})\), \((0,-1,${N(b, 4)},0)\) all vanish at \((${N(X)}, ${N(Y)}, ${Z}, 1)\).`};
    }},
    {key: 'dlt-rows', skill: 'Write the triangulation rows of one view', make(r) {
      const turn = r.bool(), R = turn ? [[0, -1, 0], [1, 0, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]], t = [r.int(-2, 2), r.int(-2, 2), r.int(0, 2)];
      const Pm = R.map((row, i) => [...row, t[i]]), x = r.int(-4, 4) / 4, y = r.int(-4, 4) / 4;
      const r1 = Pm[2].map((v, j) => z0(x * v - Pm[0][j])), r2 = Pm[2].map((v, j) => z0(y * v - Pm[1][j]));
      return {prompt: Q`A camera has \(P=[R\,|\,t]=${mat(Pm)}\) (normalised coordinates) and sees a point at \((x, y)=(${x}, ${y})\). Write its two triangulation rows \(x\,p_3^T-p_1^T\) and \(y\,p_3^T-p_2^T\), where \(p_i^T\) is row i of P. Enter the 8 numbers, first row first.`,
        answers: [{label: 'Two rows (8 entries)', vector: [...r1, ...r2], tol: .001}],
        hint: Q`\(p_3^T\) is the last row of P. Multiply it by x and subtract the first row; multiply it by y and subtract the second row.`,
        solution: Q`\(p_3^T=${vec(Pm[2])}\). Row 1: \(${x}\cdot${vec(Pm[2])}-${vec(Pm[0])}=${vec(r1)}\). Row 2: \(${y}\cdot${vec(Pm[2])}-${vec(Pm[1])}=${vec(r2)}\). Each row is \(x=p_1^TX/p_3^TX\) (or the y version) with the division multiplied out; a second view adds two more rows.`};
    }},
    {key: 'subpixel', skill: 'Refine a disparity with a parabola', make(r) {
      const d = r.int(5, 40), c0 = r.int(2, 30), cm = c0 + r.int(4, 40), cp = c0 + r.int(4, 40), den = cp - 2 * c0 + cm, ds = d - (cp - cm) / (2 * den);
      return {prompt: Q`Block matching gives the costs \(C(${d - 1})=${cm}\), \(C(${d})=${c0}\) and \(C(${d + 1})=${cp}\). Fit a parabola through the three points: what is the sub-pixel disparity \(d^*\)?`,
        answers: [{label: Q`\(d^*\)`, value: ds, tol: .002}],
        hint: Q`\(d^*=d-\dfrac{C_+-C_-}{2\,(C_+-2C_0+C_-)}\) with \(C_-=C(d-1)\), \(C_0=C(d)\), \(C_+=C(d+1)\).`,
        solution: Q`\(C_+-2C_0+C_-=${cp}-${2 * c0}+${cm}=${den}\), so \(d^*=${d}-\frac{${cp}-${cm}}{2\cdot${den}}=${d}${cp - cm > 0 ? '-' : '+'}${N(Math.abs(cp - cm) / (2 * den), 4)}=${N(ds, 4)}\). The estimate leans towards the neighbour with the lower cost${cp === cm ? '; here both neighbours tie, so it stays at the winner' : ''}.`};
    }},
    {key: 'sad-costs', skill: 'Compute SAD costs along a row', make(r) {
      let Lrow, rightRow, x, dTrue, costs;
      do {
        dTrue = r.int(1, 3); Lrow = Array.from({length: 9}, () => r.int(1, 9) * 10); x = r.int(4, 6);
        rightRow = Lrow.map((_, i) => Lrow[Math.min(8, i + dTrue)]);   // the right camera sees everything dTrue pixels further left
        costs = [0, 1, 2, 3].map(d => [-1, 0, 1].reduce((s, u) => s + Math.abs(Lrow[x + u] - rightRow[x + u - d]), 0));
      } while (costs.filter(c => c === Math.min(...costs)).length > 1);
      const best = costs.indexOf(Math.min(...costs));
      return {prompt: Q`A left image row is \((${Lrow.join(', ')})\) and the right row is \((${rightRow.join(', ')})\), with pixels numbered from 0. For the 3-pixel window centred at x = ${x} in the left row, compute the SAD cost \(\sum_{u=-1}^{1}|I_L(x+u)-I_R(x+u-d)|\) for d = 0, 1, 2 and 3, and give the winning disparity.`,
        answers: [{label: 'Costs for d = 0, 1, 2, 3', vector: costs, tol: 0}, {label: Q`winner \(\hat d\)`, value: best, tol: 0}],
        hint: 'The left window is the three values at x − 1, x and x + 1. For each d, compare them with the right row at x − 1 − d, x − d and x + 1 − d, and add the absolute differences.',
        solution: Q`Left window \((${[-1, 0, 1].map(u => Lrow[x + u]).join(', ')})\). ${[0, 1, 2, 3].map(d => Q`d = ${d}: \((${[-1, 0, 1].map(u => rightRow[x + u - d]).join(', ')})\), cost ${costs[d]}`).join('; ')}. The smallest cost is ${costs[best]} at \(\hat d=${best}\)${best === dTrue ? ', the true shift of the right row' : ''}.`};
    }},
  ];

  /* ---------- Lab: block matching on a synthetic rectified pair built from the coffee photo ---------- */
  // Scene: a tilted background plane (disparity 6 px at the top to 16 px at the bottom) and a box at 24 px, textured with the photo.
  const FOCAL = 240, BASE = .25, FB = FOCAL * BASE, BOXR = {x0: 150, x1: 215, y0: 12, y1: 72, d: 24};
  const FLAT = {x0: 8, x1: 104, y0: 6, y1: 60};
  const dBg = (y, h) => 6 + 10 * y / (h - 1);
  const inBox = (x, y) => x >= BOXR.x0 && x < BOXR.x1 && y >= BOXR.y0 && y < BOXR.y1;
  let memo = {};
  function sampleRow(img, w, x, y) {   // linear interpolation along a row, clamped at the ends
    const xc = Math.max(0, Math.min(w - 1, x)), x0 = Math.min(w - 2, Math.floor(xc)), f = xc - x0;
    return img[y * w + x0] * (1 - f) + img[y * w + x0 + 1] * f;
  }
  // Box mean over a (2r+1) × (2r+1) window, using a summed-area table; windows are clipped at the image border.
  function boxMean(src, w, h, r, out) {
    const S = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += src[y * w + x]; S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row; } }
    for (let y = 0; y < h; y++) {
      const ya = Math.max(0, y - r), yb = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const xa = Math.max(0, x - r), xb = Math.min(w, x + r + 1);
        out[y * w + x] = (S[yb * (w + 1) + xb] - S[ya * (w + 1) + xb] - S[yb * (w + 1) + xa] + S[ya * (w + 1) + xa]) / ((yb - ya) * (xb - xa));
      }
    }
    return out;
  }
  function makePair(s, base) {
    const V = window.CV_VISION, {w, h, gray} = base, key = [s.texture, s.noise, s.gain, s.seed].join();
    if (memo.pairKey === key) return memo.pair;
    let tex = gray;
    if (s.texture === 'blur') tex = V.blur(gray, w, h, 3);
    if (s.texture === 'flat') { tex = Float32Array.from(gray); for (let y = FLAT.y0; y < FLAT.y1; y++) for (let x = FLAT.x0; x < FLAT.x1; x++) tex[y * w + x] = 118; }
    const Lm = new Float32Array(w * h), Rm = new Float32Array(w * h), g = V.rng(620 + 97 * s.seed);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, src = inBox(x + BOXR.d, y) ? x + BOXR.d : x + dBg(y, h);
      Lm[i] = tex[i] + s.noise * g.gauss();
      Rm[i] = s.gain * sampleRow(tex, w, src, y) + s.noise * g.gauss();
    }
    memo.pairKey = key; memo.pair = {L: Lm, R: Rm}; memo.volKey = null;
    return memo.pair;
  }
  // Cost volume C[d][pixel] for d = 0..D, by SAD or 1 − ZNCC over the window; columns with x − d < 0 get a large cost.
  function costVolume(s, base, pair) {
    const {w, h} = base, n = w * h, r = s.radius, D = s.range, key = [memo.pairKey, r, D, s.cost].join();
    if (memo.volKey === key) return memo.vol;
    const vol = new Float32Array((D + 1) * n), tmp = new Float32Array(n), out = new Float32Array(n), {L, R} = pair, BIG = s.cost === 'sad' ? 255 : 2;
    let muL, sdL, muR, sdR;
    if (s.cost === 'zncc') {
      muL = boxMean(L, w, h, r, new Float32Array(n)); muR = boxMean(R, w, h, r, new Float32Array(n));
      const sq = a => a.map(v => v * v), eL = boxMean(sq(L), w, h, r, new Float32Array(n)), eR = boxMean(sq(R), w, h, r, new Float32Array(n));
      sdL = muL.map((m, i) => Math.sqrt(Math.max(0, eL[i] - m * m))); sdR = muR.map((m, i) => Math.sqrt(Math.max(0, eR[i] - m * m)));
    }
    for (let d = 0; d <= D; d++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; tmp[i] = x - d < 0 ? (s.cost === 'sad' ? BIG : 0) : s.cost === 'sad' ? Math.abs(L[i] - R[i - d]) : L[i] * R[i - d]; }
      boxMean(tmp, w, h, r, out);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (s.cost === 'sad') vol[d * n + i] = out[i];
        else if (x - d < r) vol[d * n + i] = BIG;
        else { const den = sdL[i] * sdR[i - d]; vol[d * n + i] = den > 1e-3 ? 1 - (out[i] - muL[i] * muR[i - d]) / den : 1; }
      }
    }
    memo.volKey = key; memo.vol = vol;
    return vol;
  }
  const RAMP = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]];
  const ramp = t => { const u = Math.max(0, Math.min(1, t)) * (RAMP.length - 1), k = Math.min(RAMP.length - 2, Math.floor(u)), f = u - k; return RAMP[k].map((c, j) => c + (RAMP[k + 1][j] - c) * f); };
  const lab = {
    name: 'stereo', title: 'Block matching on a rectified pair', photo: 'coffee',
    heading: 'Match along rows. Watch depth fail.',
    intro: 'The left image is the photo; the right image is the same scene seen from 0.25 m further right (f = 240 px). The scene is a tilted table plane, 6 px of disparity at the top to 16 px at the bottom, with a box at 24 px. Every left pixel is matched along its row by comparing windows. Click any image to see that pixel’s cost curve.',
    defaults: {radius: 3, range: 32, cost: 'sad', subpixel: true, noise: 4, gain: 1, texture: 'photo', seed: 1, px: 185, py: 40},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return range('radius', 'Window radius r (window 2r + 1)', 1, 8, 1, s.radius) + range('range', 'Disparity search range D (px)', 16, 40, 2, s.range) +
        select('cost', 'Matching cost', [['sad', 'Sum of absolute differences (SAD)'], ['zncc', '1 − zero-mean normalised cross-correlation']], s.cost) + check('subpixel', 'Sub-pixel parabola fit', s.subpixel) +
        range('noise', 'Image noise σ (grey levels)', 0, 20, 1, s.noise) + range('gain', 'Right camera brightness gain', .7, 1.3, .05, s.gain) +
        select('texture', 'Scene texture', [['photo', 'The photo as it is'], ['blur', 'Photo blurred (σ = 3 px): weak texture'], ['flat', 'A flat grey patch on the wood (top left)']], s.texture) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New noise ↻</button></div><div class="math-rule">C(x, y, d) = Σ_w |I_L(x, y) − I_R(x − d, y)|,  Z = fB / d</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div class="vk-pair">${figure('st-left', 'Left image (click to probe a pixel)', 'vk-clickable')}${figure('st-right', 'Right image: the same scene shifted left by the disparity')}</div><div class="vk-pair">${figure('st-disp', 'Estimated disparity (dark = far, yellow = near)', 'vk-clickable')}${figure('st-err', 'Error: green ≤ 1 px, red > 1 px, blue = occluded, grey = no match in range', 'vk-clickable')}</div><div class="vk-pair" style="min-width:0"><div id="st-cost" style="min-width:0"></div><div id="st-depth" style="min-width:0"></div></div>`;
    },
    note: 'Predict first: raise the noise to 12 with a 3 × 3 window (r = 1). Where do errors appear first? On the white cup and the red saucer, where many disparities fit about equally well; a larger window repairs them but fattens the box at its left edge. Shrink the search range below 24 and the box cannot be matched at all. With a brightness gain of 1.2, SAD fails on most of the image while ZNCC barely changes; on weak texture ZNCC is a little noisier than SAD, because it divides by a small standard deviation. The depth plot shows the measured error per depth band: it grows like Z², as σ_Z ≈ Z²σ_d/(fB) predicts.',
    async setup() {
      const img = await window.CV_VISION.load('coffee'), {w, h} = img, dTrue = new Float32Array(w * h), occ = new Uint8Array(w * h), edge = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, box = inBox(x, y);
        dTrue[i] = box ? BOXR.d : dBg(y, h);
        // A background pixel is occluded when the box hides it from the right camera.
        if (!box && inBox(x - dBg(y, h) + BOXR.d, y)) occ[i] = 1;
        let near = false;
        for (const [ex, ey] of [[x - 6, y], [x + 6, y], [x, y - 6], [x, y + 6]]) if (inBox(ex, ey) !== box) near = true;
        edge[i] = near ? 1 : 0;
      }
      return {img, w, h, gray: img.gray, dTrue, occ, edge};
    },
    render(s, root, base) {
      const V = window.CV_VISION, {fmt} = V, {w, h, dTrue, occ, edge} = base, n = w * h, D = s.range, r = s.radius;
      const pair = makePair(s, base), vol = costVolume(s, base, pair);
      const est = new Float32Array(n), bad = new Uint8Array(n);
      let valid = 0, nBad = 0, nEdge = 0, nEdgeBad = 0, sq = 0, good = 0, abs = 0, nOcc = 0;
      const bins = Array.from({length: 6}, () => ({s: 0, z: 0, n: 0}));   // depth bands of 1.25 m from 2.5 m
      for (let i = 0; i < n; i++) {
        let best = 0, bc = Infinity;
        for (let d = 0; d <= D; d++) { const c = vol[d * n + i]; if (c < bc) { bc = c; best = d; } }
        let dd = best;
        if (s.subpixel && best > 0 && best < D) { const cm = vol[(best - 1) * n + i], cp = vol[(best + 1) * n + i], den = cp - 2 * bc + cm; if (den > 1e-9) dd = best + (cm - cp) / (2 * den); }
        est[i] = dd;
        const x = i % w;
        if (occ[i]) { nOcc++; continue; }
        if (x < Math.min(D, dTrue[i] + 2) + r) continue;   // too close to the left border to have a match in range
        valid++;
        const err = dd - dTrue[i];
        if (Math.abs(err) > 1) { bad[i] = 1; nBad++; } else { good++; sq += err * err; abs += Math.abs(err); const Zt = FB / dTrue[i], b = Math.floor((Zt - 2.5) / 1.25); if (b >= 0 && b < bins.length) { bins[b].s += (FB / dd - Zt) ** 2; bins[b].z += Zt; bins[b].n++; } }
        if (edge[i]) { nEdge++; if (bad[i]) nEdgeBad++; }
      }
      const sd = good ? Math.sqrt(sq / good) : NaN;
      // Images.
      V.show(root.querySelector('#st-left'), pair.L, w, h); V.show(root.querySelector('#st-right'), pair.R, w, h);
      const dispPix = new Uint8ClampedArray(n * 4), errPix = new Uint8ClampedArray(n * 4);
      for (let i = 0; i < n; i++) {
        const c = ramp(est[i] / D), x = i % w;
        dispPix.set([c[0], c[1], c[2], 255], 4 * i);
        const e = Math.abs(est[i] - dTrue[i]);
        errPix.set(occ[i] ? [70, 120, 200, 255] : x < Math.min(D, dTrue[i] + 2) + r ? [150, 150, 150, 255] : e > 1 ? [215, 48, 39, 255] : [Math.round(60 + 120 * e), 170, 90, 255], 4 * i);
      }
      const dc = root.querySelector('#st-disp'), ec = root.querySelector('#st-err');
      V.showRGBA(dc, dispPix, w, h); V.showRGBA(ec, errPix, w, h);
      const px = Math.max(0, Math.min(w - 1, Math.round(s.px))), py = Math.max(0, Math.min(h - 1, Math.round(s.py))), pi = py * w + px;
      [dc, ec, root.querySelector('#st-left')].forEach(cv => { const ctx = cv.getContext('2d'); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py); ctx.moveTo(px, py - 7); ctx.lineTo(px, py + 7); ctx.stroke(); ctx.strokeStyle = '#e8743b'; ctx.strokeRect(px - r - .5, py - r - .5, 2 * r + 1, 2 * r + 1); });
      // Cost curve at the probe, with the parabola through the three points around the winner.
      const curve = Array.from({length: D + 1}, (_, d) => [d, vol[d * n + pi]]), cMax = Math.max(...curve.map(c => c[1])) * 1.08 || 1, wta = curve.reduce((a, c) => c[1] < a[1] ? c : a)[0];
      const lines = [{points: curve, cls: 'series-b'}], dots = [];
      if (wta > 0 && wta < D) {
        const [cm, c0, cp] = [curve[wta - 1][1], curve[wta][1], curve[wta + 1][1]], A2 = (cp + cm - 2 * c0) / 2, B1 = (cp - cm) / 2;
        lines.push({points: Array.from({length: 21}, (_, k) => { const u = -1.2 + 2.4 * k / 20; return [wta + u, c0 + B1 * u + A2 * u * u]; }), cls: 'series-a'});
        dots.push([wta - 1, cm], [wta, c0], [wta + 1, cp]);
      }
      const plot = window.CV_VISION_LABS.svgPlot;
      root.querySelector('#st-cost').innerHTML = plot({w: 330, h: 190, x: [0, D], y: [0, cMax], lines, dots, marker: dTrue[pi], label: 'Matching cost against disparity at the clicked pixel, with the parabola fitted around the minimum; the dashed line marks the true disparity', xLabel: `disparity d at (${px}, ${py})`, yLabel: s.cost === 'sad' ? 'mean |difference|' : '1 − ZNCC', xTicks: [0, 8, 16, 24, 32, 40].filter(v => v <= D)});
      // Measured depth error per depth band against the first-order prediction.
      const meas = bins.map(b => b.n > 30 ? [b.z / b.n, Math.sqrt(b.s / b.n)] : null).filter(Boolean), zs = Array.from({length: 41}, (_, k) => 2.5 + 7.5 * k / 40);
      const theory = Number.isFinite(sd) ? zs.map(z => [z, z * z * sd / FB]) : [], yTop = Math.max(.05, ...meas.map(m => m[1]), ...theory.map(t => t[1])) * 1.1;
      root.querySelector('#st-depth').innerHTML = plot({w: 330, h: 190, x: [2.5, 10], y: [0, yTop], lines: [{points: theory, cls: 'series-a'}], dots: meas, label: 'Measured RMS depth error per depth band (dots) and the prediction Z² σ_d / (fB) (line)', xLabel: 'true depth Z (m)', yLabel: 'depth error (m)', xTicks: [2.5, 5, 7.5, 10]});
      const pd = est[pi], pt = dTrue[pi];
      return V.report([
        ['Window', `${2 * r + 1} × ${2 * r + 1} pixels, d from 0 to ${D}`],
        ['Bad pixels (error > 1 px)', valid ? `${fmt(100 * nBad / valid, 1)}% of ${valid}` : '—'],
        ['Bad pixels within 6 px of the box edge', nEdge ? `${fmt(100 * nEdgeBad / nEdge, 1)}%` : '—'],
        ['Disparity error σ_d of the good pixels', Number.isFinite(sd) ? `${fmt(sd, 3)} px (mean |error| ${fmt(abs / good, 3)} px)` : '—'],
        ['Clicked pixel', `true d = ${fmt(pt, 2)}, winner ${wta}, ${s.subpixel ? `sub-pixel ${fmt(pd, 2)}` : 'no sub-pixel fit'}${occ[pi] ? ' (occluded: no true match)' : ''}`],
        ['Depth there (fB = 60 px·m)', `true ${fmt(FB / pt, 2)} m, estimated ${pd > 0 ? fmt(FB / pd, 2) + ' m' : 'infinite (d = 0)'}`],
        ['Occluded pixels', `${fmt(100 * nOcc / n, 1)}% of the image`],
      ]);
    },
    wire(root, s, rerender) {
      ['#st-left', '#st-disp', '#st-err'].forEach(sel => {
        const el = root.querySelector(sel);
        if (!el) return;
        el.style.touchAction = 'none';
        const pick = e => { const b = el.getBoundingClientRect(); if (!b.width) return; s.px = Math.round((e.clientX - b.left) / b.width * el.width); s.py = Math.round((e.clientY - b.top) / b.height * el.height); rerender(); };
        el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch {} pick(e); });
        el.addEventListener('pointermove', e => { if (el.hasPointerCapture?.(e.pointerId)) pick(e); });
      });
    },
    action(name, s) { if (name === 'reseed') s.seed++; },
  };

  window.CV_EXTEND.lesson(62, {
    teaching: {
      equation: Q`Z=\frac{fB}{d},\qquad \sigma_Z\approx\frac{Z^2}{fB}\,\sigma_d,\qquad \bigl(x\,p_3^T-p_1^T\bigr)X=0,\ \ \bigl(y\,p_3^T-p_2^T\bigr)X=0`,
      symbols: [['d', 'disparity in pixels'], ['f', 'focal length in pixels'], ['B', 'baseline between the cameras'], ['σ_d', 'disparity error'], ['pᵢᵀ', 'row i of a camera matrix P']],
      connection: 'Stereo cameras on cars and robots, depth sensors, multi-view stereo and the triangulation step of structure from motion all turn matches into depth this way; learned stereo networks such as PSMNet and RAFT-Stereo still build a cost volume over disparities.',
      trap: 'Depth error is not constant: σ_Z grows with the square of the distance, so a stereo rig accurate to a centimetre at 2 m may be off by a metre at 20 m. Report depth accuracy per distance band.',
      question: 'A rectified rig has f = 800 px and B = 0.1 m. A point has disparity 20 px, so it is 4 m away. Roughly how far does a one-pixel matching error move it?',
      choices: ['About 0.2 m', 'About 1 cm', 'About 2 m'], correct: 0,
      explanation: 'Z = fB/d = 80/20 = 4 m, while d = 19 and d = 21 give 4.21 m and 3.81 m. The slope is Z²/(fB) = 16/80 = 0.2 m per pixel, and it grows with Z².',
    },
    guide: {
      title: 'Disparity gives depth, and its error grows with distance squared',
      paragraphs: [
        'Two calibrated views of a point give four linear equations, two per view, whose null vector is the point: that is triangulation. Rectification warps both images with rotation homographies so that every match lies on the same row, and the horizontal shift between the two images is the disparity d.',
        'For a rectified pair, depth is Z = fB/d, so near points have large disparities and far points small ones. A matching error of σ_d pixels becomes a depth error of about Z²σ_d/(fB): five times farther means twenty-five times the error. Disparities themselves come from a cost volume, a window comparison for every pixel and every candidate shift.',
      ],
      example: 'From disparity to depth, and from matching error to depth error',
      controls: [{label: 'Disparity d (pixels)', min: 2, max: 40, step: 1, value: 20}, {label: 'Focal length f (pixels)', min: 200, max: 1200, step: 100, value: 800}, {label: 'Baseline B (metres)', min: .05, max: .5, step: .05, value: .1}, {label: 'Disparity error σ_d (pixels)', min: .1, max: 2, step: .1, value: .5}],
      predict: 'Halve the disparity from 20 to 10 pixels. The point is now twice as far. Does its depth error double, or more?',
      takeaway: 'Z = fB/d is a hyperbola: equal steps in disparity are tiny depth steps nearby and huge ones far away. To first order σ_Z = Z²σ_d/(fB), so accuracy falls with the square of the distance, and a longer baseline, a longer focal length or sub-pixel matching are the ways to win it back.',
      notation: 'd is the disparity in pixels, x_L − x_R in a rectified pair. f is the focal length in pixels and B the baseline in metres, so fB has units of pixel-metres. σ_d is the standard deviation of the disparity error and σ_Z that of the depth. In the triangulation rows, pᵢᵀ is row i of a 3 × 4 camera matrix P.',
    },
    notation: {
      d: {tex: 'd', detail: 'The disparity: how many pixels further left a point appears in the right image of a rectified pair, d = x_L − x_R = fB/Z. Zero disparity means a point at infinity.'},
      f: {tex: 'f', detail: 'The focal length in pixels, the same for both cameras of a rectified pair (Lesson 51). Larger f means more pixels of disparity for the same depth.'},
      B: {tex: 'B', detail: 'The baseline: the distance between the two camera centres, here in metres. Depth accuracy improves in proportion to B, but a long baseline makes the two views look less alike and hides more of the scene from one camera.'},
      'σ_d': {tex: Q`\sigma_d`, detail: 'The standard deviation of the disparity error, in pixels. Sub-pixel matching on good texture reaches about 0.1 to 0.25 px; weak texture or occlusions can give errors of many pixels.'},
      'pᵢᵀ': {tex: Q`p_i^T`, detail: 'Row i of a 3 × 4 camera matrix P = K[R | t]. A pixel (x, y) observed by P gives the two triangulation rows x p₃ᵀ − p₁ᵀ and y p₃ᵀ − p₂ᵀ, which multiply the homogeneous point X.'},
    },
    calculate, practice, lab,
  });
})();
