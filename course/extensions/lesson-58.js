/* Lesson 58: scale space, descriptors and matching. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const step = (title, tex, detail) => ({title, tex, detail});
  const G3 = x => Math.abs(x) >= .01 ? N(x, 4) : Number(x.toPrecision(3)).toString();   // three significant figures for small values
  const FONT = 'font-family="Segoe UI,Arial"';
  const text = (x, y, s, color = '#64736b', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${FONT}${extra}>${s}</text>`;
  const TAU = 2 * Math.PI;
  // |σ²∇²L| at the centre of the blob exp(−r²/(2s²)) blurred with G_σ.
  const blobResponse = (s, sig) => 2 * sig * sig * s * s / (s * s + sig * sig) ** 2;

  /* ---------- Worked example: the scale-normalised Laplacian of one Gaussian blob ---------- */
  function model(p) {
    const [s, sigma, S] = p, k = 2 ** (1 / S), t2 = s * s + sigma * sigma, t = Math.sqrt(t2);
    const centre = s * s / t2, lap = -2 * s * s / (t2 * t2), norm = sigma * sigma * Math.abs(lap);
    const dog = s * s / (s * s + k * k * sigma * sigma) - centre, approx = (k - 1) * sigma * sigma * lap;
    return {s, sigma, S, k, t2, t, centre, lap, norm, dog, approx, frac: norm / .5};
  }
  function drawing(m) {
    let body = `<defs><radialGradient id="l58-blob"><stop offset="0" stop-color="#172623"/><stop offset=".455" stop-color="#172623" stop-opacity=".61"/><stop offset=".909" stop-color="#172623" stop-opacity=".14"/><stop offset="1" stop-color="#172623" stop-opacity="0"/></radialGradient></defs>`;
    // Left: the blob (drawn dark on light paper) with the probed circle √2σ and its own scale √2s.
    const cx = 112, cy = 118, sc = 72 / (Math.SQRT2 * Math.max(m.s, m.sigma));
    body += text(14, 22, 'The blob and the scale tried', '#172623', 13, ' font-weight="600"');
    body += `<circle cx="${cx}" cy="${cy}" r="${(Math.min(105, 2.2 * m.s * sc)).toFixed(1)}" fill="url(#l58-blob)"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="${(Math.SQRT2 * m.s * sc).toFixed(1)}" fill="none" stroke="#34734e" stroke-width="2.5"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="${(Math.SQRT2 * m.sigma * sc).toFixed(1)}" fill="none" stroke="#bd431c" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    body += text(14, 236, `green: √2·s = ${N(Math.SQRT2 * m.s, 2)} (the blob’s scale)`, '#34734e', 11.5) + text(14, 222, `orange: √2·σ = ${N(Math.SQRT2 * m.sigma, 2)} (the scale tried)`, '#bd431c', 11.5);
    // Right: the normalised response against log₂ σ, which is symmetric about σ = s.
    const X0 = 262, X1 = 536, Y0 = 210, Y1 = 40, lx = v => X0 + (Math.log2(v) + 1) / 5 * (X1 - X0), ly = v => Y0 - v / .55 * (Y0 - Y1);
    body += text(X0 - 10, 22, 'Normalised response |σ²∇²L| at the centre', '#172623', 13, ' font-weight="600"');
    body += `<path d="M${X0} ${Y0}H${X1}M${X0} ${Y0}V${Y1}" stroke="#a8b6a5"/>`;
    [.5, 1, 2, 4, 8, 16].forEach(v => { body += `<path d="M${lx(v).toFixed(1)} ${Y0}v4" stroke="#a8b6a5"/>` + text((lx(v) - 6).toFixed(1), Y0 + 16, String(v), '#64736b', 10); });
    [0, .25, .5].forEach(v => { body += text(X0 - 28, (ly(v) + 4).toFixed(1), String(v), '#64736b', 10); });
    body += text(X1 - 8, Y0 + 30, 'σ (log scale)', '#64736b', 11, ' text-anchor="end"');
    const pts = f => Array.from({length: 121}, (_, i) => { const v = 2 ** (-1 + 5 * i / 120); return `${i ? 'L' : 'M'}${lx(v).toFixed(1)} ${ly(f(v)).toFixed(1)}`; }).join('');
    body += `<path d="${pts(v => blobResponse(m.s, v))}" fill="none" stroke="#34734e" stroke-width="3"/>`;
    body += `<path d="${pts(v => Math.abs(m.s * m.s / (m.s * m.s + m.k * m.k * v * v) - m.s * m.s / (m.s * m.s + v * v)) / (m.k - 1))}" fill="none" stroke="#315c86" stroke-width="2" stroke-dasharray="5 4"/>`;
    body += `<path d="M${lx(m.s).toFixed(1)} ${Y0}V${ly(.5).toFixed(1)}" stroke="#34734e" stroke-dasharray="3 3"/>`;
    body += `<path d="M${lx(m.sigma).toFixed(1)} ${Y0}V${Y1}" stroke="#bd431c" stroke-dasharray="6 4"/><circle cx="${lx(m.sigma).toFixed(1)}" cy="${ly(m.norm).toFixed(1)}" r="6" fill="#bd431c" stroke="#ffffff" stroke-width="1.5"/>`;
    const right = lx(m.sigma) > 440;
    body += text((lx(m.sigma) + (right ? -9 : 9)).toFixed(1), (ly(m.norm) - 8).toFixed(1), `${N(m.norm)}`, '#bd431c', 13, ` font-weight="700"${right ? ' text-anchor="end"' : ''}`);
    body += text(X0 + 6, Y1 + 2, `peak 0.5 at σ = s = ${N(m.s, 2)}`, '#34734e', 11.5);
    return {body, caption: `Left: a bright Gaussian blob of width s = ${N(m.s, 2)} (drawn dark), its characteristic circle of radius √2·s (green) and the circle √2·σ for the scale being tried (orange dashed). Right: |σ²∇²L| at the blob centre for every σ, peaking at σ = s; the orange point is σ = ${N(m.sigma, 2)}. Blue dashed: |DoG|/(k − 1) with k = 2^(1/${m.S}) = ${N(m.k, 3)}, which follows the same curve.`};
  }
  function calculate(p) {
    const m = model(p), s2 = m.s * m.s, g2 = m.sigma * m.sigma;
    return {
      steps: [
        step('Blur the blob', Q`L=G_\sigma*I=\frac{s^2}{s^2+\sigma^2}\exp\!\Big(-\frac{r^2}{2(s^2+\sigma^2)}\Big),\qquad \sqrt{s^2+\sigma^2}=\sqrt{${N(s2)}+${N(g2)}}=${N(m.t)}`, `The blob I = exp(−r²/(2s²)) is a Gaussian, so blurring it gives another Gaussian whose variances add: width ${N(m.t)} and centre value s²/(s² + σ²) = ${N(m.centre)}.`),
        step('Take the Laplacian at the centre', Q`\nabla^2L\big|_{r=0}=L_{xx}+L_{yy}=-\frac{2s^2}{(s^2+\sigma^2)^2}=-\frac{2\cdot${N(s2)}}{${N(m.t2)}^2}=${G3(m.lap)}`, 'Each second derivative of the centred Gaussian is −(centre value)/(width²), and there are two of them. The value is negative because the centre of a bright blob is a peak.'),
        step('Normalise by σ²', Q`\big|\sigma^2\nabla^2L\big|=\frac{2\sigma^2s^2}{(s^2+\sigma^2)^2}=${N(g2)}\cdot${G3(Math.abs(m.lap))}=${G3(m.norm)}`, `Without σ² every blob would be found at the smallest scale, because blurring flattens all responses. With it the response peaks at σ = s with value 0.5; this σ gives ${N(100 * m.frac, 1)}% of the peak.`),
        step('Approximate it with a difference of Gaussians', Q`D=L(k\sigma)-L(\sigma)=\frac{${N(s2)}}{${N(s2)}+${N(m.k * m.k * g2)}}-${G3(m.centre)}=${G3(m.dog)}\ \approx\ (k-1)\,\sigma^2\nabla^2L=${G3(m.approx)}`, `With ${m.S} interval${m.S === 1 ? '' : 's'} per octave, k = 2^(1/${m.S}) = ${N(m.k)}. The DoG needs no derivatives at all, only two blurred images, and it already carries the σ² factor; the two numbers agree better as k approaches 1.`),
      ],
      values: [['Blurred blob width', m.t], ['Centre value of L', m.centre], ['Laplacian at the centre', m.lap], ['Normalised response', m.norm], ['Fraction of the peak', m.frac], ['DoG at the centre', m.dog], ['(k - 1) times the normalised Laplacian', m.approx]],
      note: 'Set σ = s: the response reaches its maximum 0.5 whatever s is. Double both s and σ and nothing changes, because only the ratio σ/s matters: that is why the detected scale follows the size of the image.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 3) => Number(x.toFixed(d)).toString();
  const practice = [
    {key: 'blur-compose', skill: 'Combine Gaussian blurs by adding variances', make(r) {
      const [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [.6, .8, 1], [1.2, 1.6, 2], [.9, 1.2, 1.5], [1.5, 2, 2.5], [2.4, 3.2, 4], [.5, 1.2, 1.3]]);
      if (r.bool()) {
        const [s1, s2] = r.bool() ? [a, b] : [b, a];
        return {prompt: Q`An image is blurred with a Gaussian of σ = ${s1} pixels and the result is blurred again with σ = ${s2}. What single Gaussian blur gives the same image?`,
          answers: [{label: 'Combined σ', value: c}],
          hint: Q`Convolving two Gaussians adds their variances: \(\sigma^2=\sigma_1^2+\sigma_2^2\).`,
          solution: Q`\(\sigma=\sqrt{${s1}^2+${s2}^2}=\sqrt{${dec(s1 * s1)}+${dec(s2 * s2)}}=\sqrt{${dec(c * c)}}=${c}\), less than \(${s1}+${s2}=${dec(s1 + s2)}\).`};
      }
      const [have, want] = r.bool() ? [a, c] : [b, c], extra = Math.sqrt(want * want - have * have);
      return {prompt: Q`A scale-space level has been blurred to σ = ${have}. What extra Gaussian blur turns it into the level with σ = ${want}?`,
        answers: [{label: 'Extra σ', value: extra}],
        hint: Q`The variances must add up: \(\sigma_{\text{have}}^2+\sigma_{\text{extra}}^2=\sigma_{\text{want}}^2\).`,
        solution: Q`\(\sigma_{\text{extra}}=\sqrt{${want}^2-${have}^2}=\sqrt{${dec(want * want)}-${dec(have * have)}}=${dec(extra)}\), not \(${want}-${have}=${dec(want - have)}\).`};
    }},
    {key: 'blob-scale', skill: 'Find the normalised Laplacian response and the detected scale of a blob', make(r) {
      const s = r.pick([1, 1.5, 2, 2.5, 3, 4, 5, 6]), sig = r.pick([.5, 1, 1.5, 2, 3, 4, 6, 8].filter(v => Math.abs(v - s) > 1e-9)), f = r.pick([.5, 2, 3, 1.5]);
      const R = blobResponse(s, sig);
      return {prompt: Q`A bright Gaussian blob \(\exp(-r^2/(2s^2))\) has width s = ${s} pixels. Compute its normalised response \(|\sigma^2\nabla^2L|=2\sigma^2s^2/(s^2+\sigma^2)^2\) at σ = ${sig}. At which σ is it detected after the image is resized by a factor ${f}, and what circle radius \(\sqrt2\,\sigma\) is drawn then?`,
        answers: [{label: Q`Response at \(\sigma=${sig}\)`, value: R, tol: .002}, {label: Q`Detected \(\sigma\) after resizing`, value: f * s, tol: .01}, {label: 'Circle radius', value: Math.SQRT2 * f * s, tol: .02}],
        hint: Q`The response peaks where σ equals the blob width, and resizing the image by a factor multiplies every width, including s, by that factor.`,
        solution: Q`\(2\cdot${dec(sig * sig)}\cdot${dec(s * s)}/(${dec(s * s)}+${dec(sig * sig)})^2=${dec(2 * sig * sig * s * s)}/${dec((s * s + sig * sig) ** 2)}=${dec(R, 4)}\), below the peak 0.5 because \(\sigma\ne s\). Resized by ${f}, the blob has width \(${dec(f * s)}\), so it is detected at \(\sigma=${dec(f * s)}\) with radius \(\sqrt2\cdot${dec(f * s)}\approx${dec(Math.SQRT2 * f * s, 2)}\).`};
    }},
    {key: 'dog-octave', skill: 'Set up the difference-of-Gaussians stack of an octave', make(r) {
      const S = r.pick([2, 3, 4, 5]), k = 2 ** (1 / S), lap = -r.pick([.1, .2, .25, .3, .4, .5]), sigma = r.pick([1.6, 2, 3.2]);
      return {prompt: Q`A detector uses S = ${S} intervals per octave, so neighbouring blurs differ by a factor \(k=2^{1/S}\). Find k, the number of Gaussian images per octave (S + 3) and of DoG images (S + 2). At a pixel where the normalised Laplacian \(\sigma^2\nabla^2L\) at σ = ${sigma} is ${lap}, what does \(D=L(k\sigma)-L(\sigma)\) approximately equal?`,
        answers: [{label: 'k', value: k, tol: .001}, {label: 'Gaussian images, DoG images', vector: [S + 3, S + 2], tol: 0}, {label: Q`\(D\)`, value: (k - 1) * lap, tol: .002}],
        hint: Q`\(D\approx(k-1)\,\sigma^2\nabla^2L\): the DoG is already scale-normalised. An extremum needs a DoG level above and below it, so S intervals need S + 2 DoG levels.`,
        solution: Q`\(k=2^{1/${S}}\approx${dec(k, 4)}\). The octave has ${S + 3} Gaussian images and ${S + 2} DoG images, of which the middle ${S} can hold extrema. \(D\approx(${dec(k, 4)}-1)\cdot(${lap})=${dec((k - 1) * lap, 4)}\).`};
    }},
    {key: 'ratio-test', skill: 'Apply Lowe’s ratio test to candidate matches', make(r) {
      const tau = r.pick([.7, .75, .8]);
      let rows, ratios;
      do {
        rows = Array.from({length: 4}, () => { const d2 = r.int(20, 90) / 100, d1 = r.int(5, Math.round(d2 * 100) - 1) / 100; return [d1, d2]; });
        ratios = rows.map(([a, b]) => a / b);
      } while (ratios.some(q => Math.abs(q - tau) < .015) || new Set(ratios.map(q => q < tau)).size < 2);
      const pass = ratios.filter(q => q < tau).length;
      return {prompt: Q`Four descriptors in image A have these nearest and second-nearest distances \((d_1, d_2)\) in image B: ${rows.map(([a, b], i) => Q`match ${i + 1}: \((${a}, ${b})\)`).join('; ')}. Compute the four ratios \(d_1/d_2\). How many matches pass the ratio test with threshold ${tau}?`,
        answers: [{label: 'Ratios (4 values)', vector: ratios, tol: .006}, {label: 'Matches accepted', value: pass, tol: 0}],
        hint: 'Divide the nearest distance by the second-nearest. A match is accepted only if this ratio is below the threshold: the best candidate must be clearly better than the runner-up.',
        solution: Q`Ratios ${ratios.map((q, i) => Q`\(${rows[i][0]}/${rows[i][1]}=${dec(q, 3)}\)`).join(', ')}. Below ${tau}: ${ratios.map((q, i) => q < tau ? `match ${i + 1}` : null).filter(Boolean).join(', ')}, so ${pass} pass. The others have a second candidate almost as close, the signature of repeated texture or a point with no true partner.`};
    }},
    {key: 'mutual-nn', skill: 'Find mutual nearest-neighbour matches in a distance table', make(r) {
      let D;
      do { const vals = r.shuffle(Array.from({length: 18}, (_, i) => (i + 2) * 5)).slice(0, 9).map(v => v / 100); D = [vals.slice(0, 3), vals.slice(3, 6), vals.slice(6, 9)]; }
      while (!D.some((row, i) => { const j = row.indexOf(Math.min(...row)); return D.map(x => x[j]).indexOf(Math.min(...D.map(x => x[j]))) !== i; }));
      const nnA = D.map(row => row.indexOf(Math.min(...row))), nnB = [0, 1, 2].map(j => { const col = D.map(row => row[j]); return col.indexOf(Math.min(...col)); });
      const mutual = nnA.map((j, i) => nnB[j] === i ? j + 1 : 0);
      return {prompt: Q`Rows are descriptors A1, A2, A3 and columns are B1, B2, B3; entries are descriptor distances: \(\begin{bmatrix}${D.map(row => row.join('&')).join(Q`\\`)}\end{bmatrix}\). For each of A1, A2, A3, give the number of the B it is mutually matched to (each is the other’s nearest neighbour), or 0 if there is none.`,
        answers: [{label: 'Partners of A1, A2, A3', vector: mutual, tol: 0}],
        hint: 'Find the smallest entry in each row (A’s nearest B) and in each column (B’s nearest A). Keep a pair only when the two agree.',
        solution: Q`Row minima: ${nnA.map((j, i) => `A${i + 1} → B${j + 1}`).join(', ')}. Column minima: ${nnB.map((i, j) => `B${j + 1} → A${i + 1}`).join(', ')}. Mutual pairs: ${mutual.some(Boolean) ? mutual.map((j, i) => j ? `A${i + 1}–B${j}` : null).filter(Boolean).join(', ') : 'none'}, so the answer is \((${mutual.join(', ')})\). A one-way nearest neighbour is often a descriptor whose true partner is missing.`};
    }},
    {key: 'hamming', skill: 'Compute the Hamming distance between binary descriptors', make(r) {
      const n = r.pick([8, 12, 16]), a = Array.from({length: n}, () => r.int(0, 1)), b = a.map(v => r.bool(.3) ? 1 - v : v);
      if (a.every((v, i) => v === b[i])) b[0] = 1 - b[0];
      const x = a.map((v, i) => v ^ b[i]), dist = x.reduce((t, v) => t + v, 0);
      return {prompt: Q`Two ${n}-bit binary descriptors are ${a.join('')} and ${b.join('')}. What is their Hamming distance, and what fraction of the bits differ?`,
        answers: [{label: 'Hamming distance', value: dist, tol: 0}, {label: 'Fraction of bits that differ', value: dist / n, tol: .006}],
        hint: 'XOR the two strings bit by bit (1 where they differ) and count the ones.',
        solution: Q`XOR: ${x.join('')}, which has ${dist} ones, so the distance is ${dist} and \(${dist}/${n}=${dec(dist / n, 4)}\) of the bits differ. ORB compares 256-bit strings this way with one XOR and a population count per machine word, far faster than a 128-D Euclidean distance.`};
    }},
  ];

  /* ---------- Lab: DoG keypoints, SIFT-style descriptors and ratio-test matching against a known warp ---------- */
  const SIGMA0 = 1.6, S_INT = 3, KS = 2 ** (1 / S_INT), OCTAVES = 3, IN_BLUR = .5, EPS = 4;
  function halve(img, w, h) {
    const nw = Math.floor(w / 2), nh = Math.floor(h / 2), out = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) out[y * nw + x] = img[2 * y * w + 2 * x];
    return {data: out, w: nw, h: nh};
  }
  // Gaussian scale space built incrementally (variances add), then differences of neighbouring levels.
  function scaleSpace(gray, w, h) {
    const V = window.CV_VISION, oct = [];
    let base = V.blur(gray, w, h, Math.sqrt(SIGMA0 ** 2 - IN_BLUR ** 2)), bw = w, bh = h;
    for (let o = 0; o < OCTAVES; o++) {
      const G = [base];
      for (let i = 1; i < S_INT + 3; i++) { const a = SIGMA0 * KS ** (i - 1), b = SIGMA0 * KS ** i; G.push(V.blur(G[i - 1], bw, bh, Math.sqrt(b * b - a * a))); }
      const D = G.slice(1).map((g, i) => { const lo = G[i], d = new Float32Array(g.length); for (let j = 0; j < g.length; j++) d[j] = g[j] - lo[j]; return d; });
      oct.push({w: bw, h: bh, G, D, f: 2 ** o});
      if (o < OCTAVES - 1) { const nb = halve(G[S_INT], bw, bh); base = nb.data; bw = nb.w; bh = nb.h; }
    }
    return oct;
  }
  function extrema(oct, thr, valid) {
    const kps = [];
    oct.forEach((O, o) => {
      const {w, h, D} = O;
      for (let i = 1; i <= S_INT; i++) {
        const L3 = [D[i - 1], D[i], D[i + 1]], mid = D[i];
        for (let y = 5; y < h - 5; y++) for (let x = 5; x < w - 5; x++) {
          const j = y * w + x, v = mid[j];
          if (Math.abs(v) < thr) continue;
          let mx = true, mn = true;
          for (let l = 0; l < 3 && (mx || mn); l++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (l === 1 && !dx && !dy) continue;
            const u = L3[l][j + dy * w + dx];
            if (u >= v) mx = false;
            if (u <= v) mn = false;
          }
          if (!mx && !mn) continue;
          // Reject edge responses: the 2 × 2 Hessian of D must have eigenvalues of the same sign and ratio below 10.
          const dxx = mid[j + 1] + mid[j - 1] - 2 * v, dyy = mid[j + w] + mid[j - w] - 2 * v, dxy = (mid[j + w + 1] - mid[j + w - 1] - mid[j - w + 1] + mid[j - w - 1]) / 4;
          const tr = dxx + dyy, det = dxx * dyy - dxy * dxy;
          if (det <= 0 || tr * tr / det >= 12.1) continue;
          const X = x * O.f, Y = y * O.f;
          if (valid && !valid(X, Y)) continue;
          kps.push({o, i, x, y, X, Y, sOct: SIGMA0 * KS ** i, sigma: SIGMA0 * KS ** i * O.f, d: v});
        }
      }
    });
    return kps;
  }
  function orientation(G, w, h, kp) {
    const sw = 1.5 * kp.sOct, R = Math.round(3 * sw), hist = new Float64Array(36);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = kp.x + dx, y = kp.y + dy;
      if (x < 1 || y < 1 || x > w - 2 || y > h - 2 || dx * dx + dy * dy > R * R) continue;
      const gx = (G[y * w + x + 1] - G[y * w + x - 1]) / 2, gy = (G[(y + 1) * w + x] - G[(y - 1) * w + x]) / 2;
      let a = Math.atan2(gy, gx); if (a < 0) a += TAU;
      hist[Math.min(35, Math.floor(a / TAU * 36))] += Math.hypot(gx, gy) * Math.exp(-(dx * dx + dy * dy) / (2 * sw * sw));
    }
    let b = 0; for (let i = 1; i < 36; i++) if (hist[i] > hist[b]) b = i;
    const l = hist[(b + 35) % 36], c = hist[b], r = hist[(b + 1) % 36], den = l - 2 * c + r, off = den < 0 ? .5 * (l - r) / den : 0;
    return (b + .5 + off) / 36 * TAU;
  }
  function gradAt(G, w, h, x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    if (x0 < 1 || y0 < 1 || x0 > w - 3 || y0 > h - 3) return null;
    const fx = x - x0, fy = y - y0;
    const gx = (a, b) => (G[b * w + a + 1] - G[b * w + a - 1]) / 2, gy = (a, b) => (G[(b + 1) * w + a] - G[(b - 1) * w + a]) / 2;
    const mix = f => (f(x0, y0) * (1 - fx) + f(x0 + 1, y0) * fx) * (1 - fy) + (f(x0, y0 + 1) * (1 - fx) + f(x0 + 1, y0 + 1) * fx) * fy;
    return [mix(gx), mix(gy)];
  }
  // 4 × 4 cells × 8 orientation bins, measured relative to the keypoint orientation; unit length, clipped at 0.2, renormalised.
  function describe(G, w, h, kp, theta) {
    const wc = 3 * kp.sOct, c = Math.cos(theta), s = Math.sin(theta), sw = 2 * wc, desc = new Float64Array(128);
    for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
      const u = (-2 + (a + .5) / 4) * wc, v = (-2 + (b + .5) / 4) * wc, g = gradAt(G, w, h, kp.x + c * u - s * v, kp.y + s * u + c * v);
      if (!g) continue;
      const gu = c * g[0] + s * g[1], gv = -s * g[0] + c * g[1], mag = Math.hypot(gu, gv) * Math.exp(-(u * u + v * v) / (2 * sw * sw));
      let ang = Math.atan2(gv, gu); if (ang < 0) ang += TAU;
      const f = ang / TAU * 8, b0 = Math.floor(f) % 8, t = f - Math.floor(f), cell = (Math.floor(b / 4) * 4 + Math.floor(a / 4)) * 8;
      desc[cell + b0] += mag * (1 - t); desc[cell + (b0 + 1) % 8] += mag * t;
    }
    const unit = () => { let n = 0; for (const x of desc) n += x * x; n = Math.sqrt(n); if (!n) return false; for (let i = 0; i < 128; i++) desc[i] /= n; return true; };
    if (!unit()) return null;
    for (let i = 0; i < 128; i++) desc[i] = Math.min(desc[i], .2);
    unit();
    return desc;
  }
  function features(gray, w, h, thr, count, valid) {
    const oct = scaleSpace(gray, w, h), all = extrema(oct, thr, valid).sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
    const kps = [];
    for (const kp of all) {
      if (kps.length >= count) break;
      const O = oct[kp.o], G = O.G[kp.i], theta = orientation(G, O.w, O.h, kp), desc = describe(G, O.w, O.h, kp, theta);
      if (desc) kps.push({...kp, theta, desc});
    }
    return {kps, found: all.length};
  }
  function warpFor(s, w, h) {
    const V = window.CV_VISION, t = s.angle * Math.PI / 180, c = Math.cos(t) * s.scale, sn = Math.sin(t) * s.scale, cx = w / 2, cy = h / 2;
    const T1 = [1, 0, -cx, 0, 1, -cy, 0, 0, 1], P = [1, 0, 0, 0, 1, 0, s.tilt / w, 0, 1], A = [c, -sn, 0, sn, c, 0, 0, 0, 1], T2 = [1, 0, cx, 0, 1, cy, 0, 0, 1];
    const H = V.mul3(T2, V.mul3(A, V.mul3(P, T1)));
    return {H, Hinv: V.inv3(H)};
  }
  const lab = {
    name: 'matching', title: 'Scale-invariant keypoints and ratio-test matching', photo: 'cat',
    heading: 'Detect, describe, match. Then check every match.',
    intro: 'The photo on the left is matched to a copy on the right that is rotated, scaled, tilted in perspective and given new brightness, contrast and noise by a known homography. Keypoints are DoG extrema in a 3-octave scale space; each gets an orientation and a 128-number gradient-histogram descriptor. Because the warp is known, every match can be marked right (green) or wrong (orange).',
    defaults: {img: 'cat', show: 'matches', angle: 20, scale: 1.2, tilt: .2, contrast: 1.3, brightness: 20, noise: 2, ratio: .8, mutual: true, thr: 3, count: 150},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return select('img', 'Photo', [['cat', 'Cat (varied texture)'], ['brick', 'Brick wall (repeated texture)'], ['coffee', 'Coffee cup'], ['camera', 'Cameraman']], s.img) +
        select('show', 'Show', [['matches', 'Accepted matches (green right, orange wrong)'], ['keypoints', 'Keypoints: circles of radius √2·σ with their orientation']], s.show) +
        range('angle', 'Rotate the copy (degrees)', -90, 90, 5, s.angle) + range('scale', 'Scale the copy', .6, 1.8, .05, s.scale) + range('tilt', 'Perspective tilt of the copy', -.5, .5, .05, s.tilt) +
        range('contrast', 'Contrast factor of the copy', .5, 1.6, .05, s.contrast) + range('brightness', 'Brightness offset of the copy', -60, 60, 5, s.brightness) + range('noise', 'Noise σ in the copy (grey levels)', 0, 12, 1, s.noise) +
        range('ratio', 'Ratio-test threshold τ (1 = no test)', .4, 1, .05, s.ratio) + check('mutual', 'Also require mutual nearest neighbours', s.mutual) +
        range('thr', 'DoG contrast threshold |D| (grey levels)', 1, 10, .5, s.thr) + range('count', 'Keypoints kept per image (strongest |D|)', 30, 300, 10, s.count) +
        '<div class="math-rule">D = L(kσ) − L(σ) ≈ (k − 1) σ²∇²L,   accept if d₁/d₂ &lt; τ</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `${figure('mt-pair', 'Left: the photo. Right: the warped copy.')}<div id="mt-plot"></div><p class="vk-legend"><span class="vk-key" style="background:#e8743b"></span>precision <span class="vk-key" style="background:#315c86"></span>recall, against the ratio threshold τ; the vertical line is the current τ.</p>`;
    },
    note: 'Predict first: on the cat, how many matches survive τ = 0.8, and how many of them are wrong? Very few are wrong, although the copy is rotated, rescaled, tilted and relit, because σ follows the image scale, angles are measured from each keypoint’s orientation and the descriptor is normalised. Now pick the brick wall and set τ = 1 (no test): many nearest neighbours land on the wrong brick, because every brick corner looks alike. Lower τ and precision rises while recall falls, the trade-off of Lesson 44. The mutual check removes extra wrong matches at almost no cost in recall.',
    async setup() {
      const V = window.CV_VISION, names = ['cat', 'brick', 'coffee', 'camera'], imgs = {};
      (await Promise.all(names.map(n => V.load(n)))).forEach((im, i) => { imgs[names[i]] = {...im, gray: Float32Array.from(im.gray, v => Math.round(v))}; });
      return {imgs, cache: new Map()};
    },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt, clamp} = V, img = data.imgs[s.img], w = img.w, h = img.h, thr = Number(s.thr), count = Number(s.count);
      const {H, Hinv} = warpFor({angle: Number(s.angle), scale: Number(s.scale), tilt: Number(s.tilt)}, w, h);
      const memo = (key, f) => { if (!data.cache.has(key)) { if (data.cache.size > 30) data.cache.clear(); data.cache.set(key, f()); } return data.cache.get(key); };
      const wkey = `${s.img}|${s.angle}|${s.scale}|${s.tilt}|${s.contrast}|${s.brightness}|${s.noise}`;
      const copy = memo('copy|' + wkey, () => {
        // Inverse warping with bilinear sampling (Lesson 50), then the photometric change and noise, rounded to 8 bits.
        const g = new Float32Array(w * h), rnd = V.rng(17), src = img.gray, gain = Number(s.contrast), offset = Number(s.brightness), noise = Number(s.noise);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const [sx, sy, z] = V.applyH(Hinv, x + .5, y + .5), u = sx - .5, v = sy - .5;
          let val = 128;
          if (z > 0 && u >= 0 && v >= 0 && u <= w - 1 && v <= h - 1) {
            const x0 = Math.min(w - 2, Math.floor(u)), y0 = Math.min(h - 2, Math.floor(v)), fx = u - x0, fy = v - y0, i = y0 * w + x0;
            val = (src[i] * (1 - fx) + src[i + 1] * fx) * (1 - fy) + (src[i + w] * (1 - fx) + src[i + w + 1] * fx) * fy;
          }
          g[y * w + x] = Math.round(clamp((val - 128) * gain + 128 + offset + noise * rnd.gauss(), 0, 255));
        }
        return g;
      });
      // The copy's keypoints must come from inside the warped photo, away from the grey border.
      const inside = (x, y, m) => x >= m && y >= m && x <= w - 1 - m && y <= h - 1 - m;
      const validCopy = (X, Y) => { const [u, v, z] = V.applyH(Hinv, X + .5, Y + .5); return z > 0 && inside(u - .5, v - .5, 8); };
      const A = memo(`A|${s.img}|${thr}|${count}`, () => features(img.gray, w, h, thr, count));
      const B = memo(`B|${wkey}|${thr}|${count}`, () => features(copy, w, h, thr, count, validCopy));
      const nA = A.kps.length, nB = B.kps.length;
      // Distances, nearest and second-nearest in both directions.
      const res = memo(`M|${wkey}|${s.img}|${thr}|${count}`, () => {
        const d = new Float64Array(nA * nB);
        for (let i = 0; i < nA; i++) for (let j = 0; j < nB; j++) { let t = 0; const p = A.kps[i].desc, q = B.kps[j].desc; for (let k = 0; k < 128; k++) { const e = p[k] - q[k]; t += e * e; } d[i * nB + j] = Math.sqrt(t); }
        const bestA = Array.from({length: nA}, (_, i) => { let j1 = -1, d1 = Infinity, d2 = Infinity; for (let j = 0; j < nB; j++) { const v = d[i * nB + j]; if (v < d1) { d2 = d1; d1 = v; j1 = j; } else if (v < d2) d2 = v; } return {j: j1, d1, d2, ratio: d2 > 0 && Number.isFinite(d2) ? d1 / d2 : 1}; });
        const bestB = Array.from({length: nB}, (_, j) => { let i1 = -1, d1 = Infinity; for (let i = 0; i < nA; i++) if (d[i * nB + j] < d1) { d1 = d[i * nB + j]; i1 = i; } return i1; });
        const mapped = A.kps.map(k => { const [u, v] = V.applyH(H, k.X + .5, k.Y + .5); return [u - .5, v - .5]; });
        const correct = bestA.map((b, i) => b.j >= 0 && Math.hypot(B.kps[b.j].X - mapped[i][0], B.kps[b.j].Y - mapped[i][1]) <= EPS);
        const possible = mapped.filter(([u, v]) => B.kps.some(k => Math.hypot(k.X - u, k.Y - v) <= EPS)).length;
        return {bestA, bestB, mapped, correct, possible};
      });
      const accept = (tau, i) => res.bestA[i].j >= 0 && res.bestA[i].ratio < tau && (!s.mutual || res.bestB[res.bestA[i].j] === i);
      const stats = tau => { let acc = 0, ok = 0; for (let i = 0; i < nA; i++) if (accept(tau, i)) { acc++; if (res.correct[i]) ok++; } return {acc, ok}; };
      const tau = Number(s.ratio) >= .999 ? 1.0001 : Number(s.ratio), cur = stats(tau), nnOk = res.correct.filter(Boolean).length;
      // Side-by-side picture.
      const gap = 8, W = 2 * w + gap, pair = new Uint8ClampedArray(W * h * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
        const o = 4 * (y * W + x), v = x < w ? img.gray[y * w + x] : x >= w + gap ? copy[y * w + x - w - gap] : 255;
        pair[o] = pair[o + 1] = pair[o + 2] = v; pair[o + 3] = 255;
      }
      const canvas = root.querySelector('#mt-pair'), ctx = V.showRGBA(canvas, pair, W, h).getContext('2d');
      const circle = (k, ox, color) => {
        const r = Math.SQRT2 * k.sigma;
        ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(k.X + .5 + ox, k.Y + .5, r, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(k.X + .5 + ox, k.Y + .5); ctx.lineTo(k.X + .5 + ox + r * Math.cos(k.theta), k.Y + .5 + r * Math.sin(k.theta)); ctx.stroke();
      };
      let drawn = 0, wrong = 0;
      if (s.show === 'keypoints') {
        A.kps.forEach(k => circle(k, 0, '#e8743b')); B.kps.forEach(k => circle(k, w + gap, '#7fb8df'));
      } else {
        for (let i = 0; i < nA; i++) {
          if (!accept(tau, i)) continue;
          const a = A.kps[i], b = B.kps[res.bestA[i].j], ok = res.correct[i];
          ctx.strokeStyle = ok ? 'rgba(63,174,106,.9)' : 'rgba(232,116,59,.95)'; ctx.lineWidth = ok ? 1 : 1.6;
          ctx.beginPath(); ctx.moveTo(a.X + .5, a.Y + .5); ctx.lineTo(b.X + .5 + w + gap, b.Y + .5); ctx.stroke();
          ctx.beginPath(); ctx.arc(a.X + .5, a.Y + .5, 2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(b.X + .5 + w + gap, b.Y + .5, 2, 0, TAU); ctx.stroke();
          drawn++; if (!ok) wrong++;
        }
      }
      // Outline of the photo inside the copy.
      ctx.save(); ctx.beginPath(); ctx.rect(w + gap, 0, w, h); ctx.clip();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#7fb8df'; ctx.lineWidth = 1; ctx.beginPath();
      [[0, 0], [w, 0], [w, h], [0, h]].forEach(([x, y], i) => { const [u, v] = V.applyH(H, x, y); i ? ctx.lineTo(u + w + gap, v) : ctx.moveTo(u + w + gap, v); });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      const cap = s.show === 'keypoints'
        ? `Left: ${nA} keypoints of the photo (orange); right: ${nB} of the copy (blue). Circle radius √2·σ shows each keypoint’s scale, the spoke its orientation. Scale the copy and its circles grow with it.`
        : `${drawn} accepted matches: ${drawn - wrong} right (green), ${wrong} wrong (orange). A match is right if the known warp puts the left keypoint within ${EPS} px of its partner. Dashed blue: the photo’s border inside the copy.`;
      canvas.nextElementSibling.textContent = cap; canvas.setAttribute('aria-label', cap);
      // Precision and recall against τ.
      const taus = Array.from({length: 61}, (_, i) => .4 + i * .01), curve = taus.map(t => ({t, ...stats(t >= .999 ? 1.0001 : t)}));
      const prec = curve.filter(c => c.acc).map(c => [c.t, c.ok / c.acc]), rec = curve.map(c => [c.t, res.possible ? c.ok / res.possible : 0]);
      const plot = window.CV_VISION_LABS?.svgPlot;
      if (plot) root.querySelector('#mt-plot').innerHTML = plot({w: 460, h: 190, x: [.4, 1], y: [0, 1], lines: [{points: prec, cls: 'series-a'}, {points: rec, cls: 'series-b'}], marker: Number(s.ratio), label: 'Precision and recall of the accepted matches against the ratio threshold', xLabel: 'ratio threshold τ', yLabel: 'precision, recall', xTicks: [.4, .6, .8, 1], yTicks: [0, .5, 1]});
      const pct = (a, b) => b ? `${fmt(100 * a / b, 1)}%` : '—';
      return V.report([
        ['Keypoints', `${nA} in the photo, ${nB} in the copy (of ${A.found} and ${B.found} DoG extrema)`],
        ['Nearest neighbour, no test', `${nnOk} of ${nA} right (${pct(nnOk, nA)})`],
        [`Accepted (d₁/d₂ &lt; ${fmt(Number(s.ratio), 2)}${s.mutual ? ', mutual' : ''})`, `${cur.acc}, of which ${cur.ok} right: precision ${pct(cur.ok, cur.acc)}`],
        ['Recall', `${cur.ok} of ${res.possible} findable correspondences (${pct(cur.ok, res.possible)})`],
        ['Scale space', `${OCTAVES} octaves × ${S_INT + 3} blurs, k = 2^(1/${S_INT}) = ${fmt(KS, 3)}, σ₀ = ${SIGMA0}`],
      ]);
    },
  };

  window.CV_EXTEND.lesson(58, {
    teaching: {
      equation: Q`\begin{gathered}L(x,\sigma)=G_\sigma*I,\qquad G_{\sigma_1}*G_{\sigma_2}=G_{\sqrt{\sigma_1^2+\sigma_2^2}},\qquad D=L(k\sigma)-L(\sigma)\approx(k-1)\,\sigma^2\nabla^2L\\ \text{accept }a\to b\ \text{ if }\ \frac{d_1}{d_2}<0.8\ \text{ and }a\text{ is also }b\text{’s nearest neighbour}\end{gathered}`,
      symbols: [['L(x, σ)', 'Gaussian scale space'], ['σ²∇²L', 'scale-normalised Laplacian'], ['D', 'difference of Gaussians'], ['k', 'scale step between levels'], ['d₁, d₂', 'nearest and second-nearest descriptor distances']],
      connection: 'SIFT, SURF and ORB keypoints with descriptors feed RANSAC for panorama stitching, structure from motion and SLAM. Learned matchers such as SuperPoint, LoFTR and LightGlue are still evaluated with the same ratio, mutual-nearest-neighbour and known-homography protocols.',
      trap: 'Accepting every nearest neighbour. Each descriptor has a nearest neighbour even when its true partner is occluded or outside the other image, and on repeated texture the right partner and a wrong one can be almost equally close. The ratio test rejects exactly those ambiguous cases.',
      question: 'You enlarge an image to twice its size and run a scale-normalised LoG detector. A blob that was detected at σ = 3 is now detected at which σ?',
      choices: ['σ = 6', 'σ = 3, the same as before', 'σ = 1.5'], correct: 0,
      explanation: 'The normalised response 2σ²s²/(s² + σ²)² depends only on σ/s and peaks at σ = s. Enlarging the image doubles the blob width s, so the peak moves to twice the σ: the detected scale follows the image scale.',
    },
    guide: {
      title: 'Find each structure at its own scale, then match descriptions that survive change',
      paragraphs: [
        'A scale space stacks the image blurred by every σ. Multiplying the Laplacian by σ² makes responses comparable across scales, and a blob then responds most strongly at its own width: its characteristic scale. A difference of neighbouring blurs approximates this normalised Laplacian with no derivatives, so SIFT finds keypoints as extrema of the DoG in position and scale.',
        'Each keypoint is described by histograms of gradient orientation, measured from its dominant orientation and normalised to unit length, so rotation and contrast changes cancel. Descriptors are matched by distance, and a match is kept only if it is clearly better than the second best (the ratio test) and mutual.',
      ],
      example: 'The scale-normalised Laplacian of one Gaussian blob',
      controls: [{label: 'Blob width s (pixels)', min: 1, max: 8, step: .5, value: 3}, {label: 'Scale tried σ (pixels)', min: .5, max: 12, step: .5, value: 1.5}, {label: 'Intervals per octave S (k = 2^(1/S))', min: 1, max: 5, step: 1, value: 3}],
      predict: 'For a blob of width s = 3, which σ will give the largest normalised response: 1.5, 3 or 6?',
      takeaway: 'The normalised response depends only on σ/s and peaks at σ = s with value 1/2. A detector that looks for that peak reports a scale proportional to the size of the structure, so the same blob is found at twice the σ in an image twice as large.',
      notation: 'The blob is I = exp(−r²/(2s²)) with width s. L = G_σ * I is its blur, ∇²L = L_xx + L_yy the Laplacian and σ²∇²L its scale-normalised form. D = L(kσ) − L(σ) is the difference of Gaussians and k = 2^(1/S) the step between levels.',
    },
    notation: {
      'L(x, σ)': {tex: Q`L(x,\sigma)`, detail: 'The Gaussian scale space: the image blurred by G_σ, for every σ. Blurring twice adds variances, so L at σ₂ comes from L at σ₁ with one extra blur of √(σ₂² − σ₁²).'},
      'σ²∇²L': {tex: Q`\sigma^2\nabla^2L`, detail: 'The scale-normalised Laplacian of Gaussian: σ² times L_xx + L_yy. Without the σ² the response always shrinks with σ; with it a blob of width s responds most at σ = s.'},
      D: {tex: 'D', detail: 'The difference of Gaussians L(kσ) − L(σ) between neighbouring scale-space levels. It approximates (k − 1)σ²∇²L, and SIFT keypoints are its extrema over position and scale.'},
      k: {tex: 'k', detail: 'Here k is the factor between neighbouring blur levels, k = 2^(1/S) for S intervals per octave (k ≈ 1.26 for S = 3), not the Harris constant of Lesson 57.'},
      'd₁, d₂': {tex: Q`d_1,\ d_2`, detail: 'The Euclidean distances from a descriptor to its nearest and second-nearest descriptors in the other image. Lowe’s ratio test accepts the nearest only if d₁/d₂ is below a threshold such as 0.8.'},
    },
    calculate, practice, lab,
  });
})();
