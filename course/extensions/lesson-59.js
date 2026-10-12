/* Lesson 59: optical flow and direct image alignment. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const col = v => mat(v.map(x => [x]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const FONT = 'font-family="Segoe UI,Arial"';
  const text = (x, y, s, color = '#64736b', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${FONT}${extra}>${s}</text>`;
  const rad = d => d * Math.PI / 180;

  // Eigenvalues (largest first) and unit eigenvectors of the symmetric 2 x 2 matrix [[a, b], [b, c]].
  function eig2(a, b, c) {
    const m = (a + c) / 2, q = Math.sqrt(((a - c) / 2) ** 2 + b * b), l1 = m + q, l2 = m - q;
    let v = Math.abs(b) > 1e-12 ? [b, l1 - a] : (a >= c ? [1, 0] : [0, 1]);
    const n = Math.hypot(v[0], v[1]) || 1;
    v = [v[0] / n, v[1] / n];
    return {l1, l2, v1: v, v2: [-v[1], v[0]]};
  }
  // Least-squares solve of M d = b through the eigenvectors: directions with a (numerically) zero eigenvalue are left at 0.
  function solve2(a, b, c, b1, b2) {
    const E = eig2(a, b, c);
    let u = 0, v = 0;
    [[E.l1, E.v1], [E.l2, E.v2]].forEach(([l, e]) => { if (l > 1e-9 * E.l1 && l > 0) { const k = (e[0] * b1 + e[1] * b2) / l; u += k * e[0]; v += k * e[1]; } });
    return {u, v, ...E, singular: !(E.l2 > 1e-9 * E.l1)};
  }

  /* ---------- Worked example: Lucas–Kanade on a four-pixel window ---------- */
  function model(p) {
    const [th, us, vs, e] = p, g = [Math.cos(rad(th)), Math.sin(rad(th))], G = [[1, 0], [1, 0], g, g];
    const It = G.map(([gx, gy]) => -(gx * us + gy * vs));
    It[3] += e;
    let a = 0, b = 0, c = 0, b1 = 0, b2 = 0;
    G.forEach(([gx, gy], i) => { a += gx * gx; b += gx * gy; c += gy * gy; b1 -= gx * It[i]; b2 -= gy * It[i]; });
    const S = solve2(a, b, c, b1, b2), res = G.map(([gx, gy], i) => gx * S.u + gy * S.v + It[i]);
    return {th, us, vs, e, G, It, a, b, c, b1, b2, ...S, res, epe: Math.hypot(S.u - us, S.v - vs)};
  }
  function drawing(m) {
    // Left: the velocity plane. Each pixel's equation Iₓu + I_yv + I_t = 0 is a line; v grows downwards, as in an image.
    const L = 40, T = 22, S = 200, R = 4, X = u => L + (u + R) / (2 * R) * S, Y = v => T + (v + R) / (2 * R) * S;
    let body = `<defs><clipPath id="l59-box"><rect x="${L}" y="${T}" width="${S}" height="${S}"/></clipPath></defs>`;
    body += `<rect x="${L}" y="${T}" width="${S}" height="${S}" fill="none" stroke="#c7cfc5"/>`;
    for (let k = -R; k <= R; k += 2) body += `<path d="M${X(k)} ${T}V${T + S}M${L} ${Y(k)}H${L + S}" stroke="${k ? '#e3e8e1' : '#a8b6a5'}"/>` + text(X(k) - 4, T + S + 13, String(k), '#64736b', 10) + text(L - 16, Y(k) + 4, String(k), '#64736b', 10);
    body += text(L + S - 6, T + S + 26, 'u →', '#64736b', 11) + text(10, T - 6, 'v ↓', '#64736b', 11);
    const line = ([gx, gy], it, color, dash) => {
      // Points with gx·u + gy·v = −it: start from the normal-flow point and run along the edge direction.
      const g2 = gx * gx + gy * gy, p = [-it * gx / g2, -it * gy / g2], t = [-gy, gx], far = 20;
      return `<path d="M${X(p[0] - far * t[0]).toFixed(1)} ${Y(p[1] - far * t[1]).toFixed(1)}L${X(p[0] + far * t[0]).toFixed(1)} ${Y(p[1] + far * t[1]).toFixed(1)}" stroke="${color}" stroke-width="2.2"${dash ? ' stroke-dasharray="6 4"' : ''}/>`;
    };
    body += '<g clip-path="url(#l59-box)">';
    // Uncertainty ellipse (d − d̂)ᵀM(d − d̂) = 1: half-axes 1/√λ, infinite along a zero eigenvalue.
    const ax = l => l > 1e-9 * m.l1 ? Math.min(30, 1 / Math.sqrt(l)) : 30, phi = Math.atan2(m.v1[1], m.v1[0]) * 180 / Math.PI;
    body += `<ellipse cx="${X(m.u).toFixed(1)}" cy="${Y(m.v).toFixed(1)}" rx="${(ax(m.l1) * S / (2 * R)).toFixed(1)}" ry="${(ax(m.l2) * S / (2 * R)).toFixed(1)}" transform="rotate(${phi.toFixed(2)} ${X(m.u).toFixed(1)} ${Y(m.v).toFixed(1)})" fill="#bd431c14" stroke="#bd431c" stroke-opacity=".5"/>`;
    body += line(m.G[0], m.It[0], '#315c86') + line(m.G[2], m.It[2], '#34734e') + (Math.abs(m.e) > 1e-12 ? line(m.G[3], m.It[3], '#8a6d1f', true) : '');
    body += '</g>';
    body += `<circle cx="${X(m.us).toFixed(1)}" cy="${Y(m.vs).toFixed(1)}" r="6" fill="none" stroke="#172623" stroke-width="2"/><circle cx="${X(m.u).toFixed(1)}" cy="${Y(m.v).toFixed(1)}" r="4.5" fill="#bd431c"/>`;
    // Right: the window and its numbers.
    const x0 = 278;
    body += text(x0, 22, 'Lucas–Kanade on four pixels', '#172623', 14, ' font-weight="600"');
    body += text(x0, 44, `blue line: pixels 1–2, gradient (1, 0)`, '#315c86', 12) + text(x0, 61, `green line: pixel 3${Math.abs(m.e) > 1e-12 ? '' : ' and 4'}, gradient at θ = ${N(m.th, 0)}°`, '#34734e', 12);
    if (Math.abs(m.e) > 1e-12) body += text(x0, 78, `gold dashed: pixel 4, with I_t off by ${N(m.e, 2)}`, '#8a6d1f', 12);
    body += text(x0, 104, `M = [${N(m.a)}, ${N(m.b)}; ${N(m.b)}, ${N(m.c)}]`, '#172623', 13) + text(x0, 122, `λ₁ = ${N(m.l1)}, λ₂ = ${N(Math.max(0, m.l2))}`, '#172623', 13);
    body += text(x0, 148, `true flow (black ring): (${N(m.us, 2)}, ${N(m.vs, 2)})`, '#172623', 13) + text(x0, 166, `estimate (orange): (${N(m.u)}, ${N(m.v)})`, '#bd431c', 13, ' font-weight="600"');
    body += text(x0, 184, `endpoint error ${N(m.epe)} px`, '#bd431c', 13);
    body += text(x0, 210, m.singular ? 'All lines are parallel: M is singular.' : `Pale ellipse: where noise in I_t moves the estimate`, '#64736b', 11.5) + text(x0, 225, m.singular ? 'Motion along the edge is free (aperture problem).' : `(half-axes 1/√λ: long where λ is small).`, '#64736b', 11.5);
    return {body, caption: `Left: the plane of possible flows (u, v), with v pointing down as in an image. Each pixel’s brightness-constancy equation is a line; Lucas–Kanade picks the least-squares point (orange), here ${m.singular ? 'on a family of parallel lines, so only the component across them is fixed' : 'near the crossing of the lines'}. The black ring is the true flow (${N(m.us, 2)}, ${N(m.vs, 2)}).`};
  }
  function calculate(p) {
    const m = model(p);
    return {
      steps: [
        step('Write one brightness-constancy equation per pixel', Q`\underbrace{${mat(m.G)}}_{[I_x\ I_y]}\begin{bmatrix}u\\v\end{bmatrix}=-I_t=${col(m.It.map(x => -x))}`, `Each row is Iₓu + I_yv = −I_t for one pixel. The temporal differences were made by brightness constancy from the true flow (${N(m.us, 2)}, ${N(m.vs, 2)})${Math.abs(m.e) > 1e-12 ? `, with an error of ${N(m.e, 2)} added to pixel 4` : ''}.`),
        step('Form the normal equations', Q`M=\sum\nabla I\,\nabla I^T=${mat([[m.a, m.b], [m.b, m.c]])},\qquad -\sum\nabla I\,I_t=${col([m.b1, m.b2])}`, 'Multiplying the stacked equations by the transpose of the gradient matrix gives the 2 × 2 system Md = −ΣI_t∇I. M is the structure tensor of Lesson 57 and the Gauss–Newton JᵀJ of Lesson 52.'),
        step(m.singular ? 'M is singular: only the normal flow is fixed' : 'Solve the 2 × 2 system', m.singular ? Q`\lambda_1=${N(m.l1)},\ \ \lambda_2=0,\qquad d=\frac{e_1^T(-\sum\nabla I\,I_t)}{\lambda_1}\,e_1=${col([m.u, m.v])}` : Q`\lambda_1=${N(m.l1)},\ \ \lambda_2=${N(m.l2)},\qquad d=M^{-1}\Big(-\sum\nabla I\,I_t\Big)=${col([m.u, m.v])}`, m.singular ? 'Every gradient points the same way, so the equations are parallel lines in the (u, v) plane. Moving along the edge direction e₂ changes no residual; the least-squares answer of smallest length (the pseudoinverse of Lesson 11) keeps only the component along e₁.' : m.l2 < .2 * m.l1 ? `The lines cross, but λ₂ = ${N(m.l2)} is small next to λ₁: the lines are nearly parallel, so a little noise in I_t moves the answer far along e₂.` : `Both eigenvalues are large, so the lines cross at a good angle and a little noise in I_t moves the answer only a little.`),
        step('Check the equations and the true flow', Q`r=I_xu+I_yv+I_t=${col(m.res)},\qquad \|d-d^{*}\|=${N(m.epe)}`, m.singular ? 'The residuals are as small as they can be, yet the estimate can still miss the truth: the data say nothing about motion along the edge.' : Math.abs(m.e) > 1e-12 ? 'Pixel 4 disagrees with the others, so least squares splits the difference and no residual is exactly zero.' : 'With exact data every equation holds and the true flow is recovered.'),
      ],
      values: [['M11', m.a], ['M12', m.b], ['M22', m.c], ['Right-hand side 1', m.b1], ['Right-hand side 2', m.b2], ['Estimated u', m.u], ['Estimated v', m.v], ['Smaller eigenvalue of M', m.l2], ['Endpoint error', m.epe]],
      note: 'Set θ = 0: all four gradients point the same way and v is lost. Then set θ = 15° and add an error of 0.5 to pixel 4: the lines are nearly parallel, and the estimate slides about a pixel along the edge. At θ = 90° the same error moves it by only 0.25.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 3) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.join(', ')})`;
  const paren = v => v < 0 ? `(${v})` : `${v}`;
  const practice = [
    {key: 'temporal-derivative', skill: 'Use the brightness-constancy equation at one pixel', make(r) {
      const Ix = r.nonzero(-6, 6), Iy = r.int(-6, 6), u = r.int(-4, 4), v = r.int(-4, 4), It = -(Ix * u + Iy * v);
      if (r.bool() || Iy === 0) {
        return {prompt: Q`At a pixel, \(I_x=${Ix}\) and \(I_y=${Iy}\) grey levels per pixel. The content moves by \((u,v)=(${u}, ${v})\) pixels between the frames. What temporal difference \(I_t\) does linearised brightness constancy predict?`,
          answers: [{label: Q`\(I_t\)`, value: It, tol: 0}],
          hint: Q`\(I_xu+I_yv+I_t\approx0\), so \(I_t\approx-(I_xu+I_yv)\).`,
          solution: Q`\(I_t=-(${Ix}\cdot${paren(u)}+${Iy}\cdot${paren(v)})=${It}\). The pixel now shows the content that was \((u,v)\) behind it, and to first order that content differs in brightness by \(-(I_xu+I_yv)\).`};
      }
      return {prompt: Q`At a pixel, \(I_x=${Ix}\), \(I_y=${Iy}\) and \(I_t=${It}\). The horizontal flow is known to be \(u=${u}\). What vertical flow v does the brightness-constancy equation give?`,
        answers: [{label: 'v', value: v, tol: 0}],
        hint: Q`Solve \(I_xu+I_yv+I_t=0\) for v: \(v=-(I_xu+I_t)/I_y\).`,
        solution: Q`\(v=-(${Ix}\cdot${paren(u)}+${paren(It)})/${paren(Iy)}=${v}\). Without knowing u, this one equation could not fix both components: that is the aperture problem.`};
    }},
    {key: 'lucas-kanade', skill: 'Solve the Lucas–Kanade normal equations for a small window', make(r) {
      let G, a, b, c, det;
      do { G = Array.from({length: 3}, () => [r.int(-2, 3), r.int(-2, 3)]); a = G.reduce((t, g) => t + g[0] * g[0], 0); b = G.reduce((t, g) => t + g[0] * g[1], 0); c = G.reduce((t, g) => t + g[1] * g[1], 0); det = a * c - b * b; }
      while (det < 3 || G.some(g => !g[0] && !g[1]));
      const u = r.int(-3, 3), v = r.int(-3, 3), It = G.map(([x, y]) => -(x * u + y * v)), b1 = -G.reduce((t, g, i) => t + g[0] * It[i], 0), b2 = -G.reduce((t, g, i) => t + g[1] * It[i], 0);
      return {prompt: Q`Three pixels of a window have \((I_x,I_y,I_t)\) = ${G.map((g, i) => Q`\(${tup([...g, It[i]])}\)`).join(', ')}. Build \(M\) and the right-hand side \(-(\sum I_xI_t,\ \sum I_yI_t)\), then solve for the flow \((u,v)\).`,
        answers: [{label: Q`\((M_{11}, M_{12}, M_{22})\)`, vector: [a, b, c], tol: 0}, {label: 'Right-hand side', vector: [b1, b2], tol: 0}, {label: Q`\((u, v)\)`, vector: [u, v], tol: .01}],
        hint: Q`\(M_{11}=\sum I_x^2\), \(M_{12}=\sum I_xI_y\), \(M_{22}=\sum I_y^2\). For a 2 × 2 system, \(M^{-1}=\frac{1}{\det M}\begin{bmatrix}M_{22}&-M_{12}\\-M_{12}&M_{11}\end{bmatrix}\).`,
        solution: Q`\(M=${mat([[a, b], [b, c]])}\), right-hand side \(${tup([b1, b2])}\), \(\det M=${a}\cdot${c}-${paren(b)}^2=${det}\). Then \(u=(${c}\cdot${paren(b1)}-${paren(b)}\cdot${paren(b2)})/${det}=${u}\) and \(v=(${a}\cdot${paren(b2)}-${paren(b)}\cdot${paren(b1)})/${det}=${v}\). Every equation \(I_xu+I_yv+I_t=0\) now holds.`};
    }},
    {key: 'normal-flow', skill: 'Find the normal flow at an edge', make(r) {
      const [p, q, n] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [1, 0, 1], [0, 2, 2], [8, 6, 10]]);
      const gx = p * r.sign(), gy = q * r.sign(), It = r.nonzero(-12, 12), len = -It / n, vec = [-It * gx / (n * n), -It * gy / (n * n)];
      return {prompt: Q`Every pixel in a window has gradient \((I_x,I_y)=(${gx}, ${gy})\) and temporal difference \(I_t=${It}\). Only the normal flow can be measured. Give its signed length \(-I_t/|\nabla I|\) along the gradient direction, and the normal-flow vector.`,
        answers: [{label: 'Signed length (pixels)', value: len, tol: .01}, {label: 'Normal-flow vector', vector: vec, tol: .01}],
        hint: Q`The constraint \(I_xu+I_yv=-I_t\) fixes the component of (u, v) along \(\nabla I/|\nabla I|\): it is \(-I_t/|\nabla I|\). Multiply that unit direction by it.`,
        solution: Q`\(|\nabla I|=\sqrt{${paren(gx)}^2+${paren(gy)}^2}=${n}\), so the length is \(${-It}/${n}=${dec(len)}\) and the vector is \(${dec(len)}\cdot(${gx}, ${gy})/${n}=(${dec(vec[0])}, ${dec(vec[1])})\). Any flow that adds a multiple of the edge direction \((${-gy}, ${gx})\) satisfies the same equations.`};
    }},
    {key: 'pyramid-levels', skill: 'Choose the number of pyramid levels for a large motion', make(r) {
      const d = r.pick([3, 5, 6, 7, 9, 10, 12, 14, 18, 20, 24, 30, 40, 50, 60]), lim = r.pick([1, 1, 2]);
      let l = 0; while (d / 2 ** l > lim) l++;
      return {prompt: Q`Content moves ${d} pixels between two frames, and Lucas–Kanade is reliable only for motions of at most ${lim} pixel${lim === 1 ? '' : 's'}. Each pyramid level halves the image. What is the smallest number of halvings ℓ that brings the motion within range, and what is the motion at that level?`,
        answers: [{label: 'Halvings ℓ', value: l, tol: 0}, {label: 'Motion at level ℓ (pixels)', value: d / 2 ** l, tol: .01}],
        hint: Q`A displacement d at level 0 is \(d/2^\ell\) at level ℓ. Keep halving until it is at most ${lim}.`,
        solution: Q`${Array.from({length: l + 1}, (_, k) => dec(d / 2 ** k, 4)).join(' → ')}: after \(\ell=${l}\) halvings the motion is \(${dec(d / 2 ** l, 4)}\le${lim}\). The flow found there is doubled at each finer level and refined, so the full ${d}-pixel motion is recovered.`};
    }},
    {key: 'horn-schunck', skill: 'Apply one Horn–Schunck update', make(r) {
      const Ix = r.int(-3, 3), Iy = r.int(-3, 3) || 1, It = r.nonzero(-6, 6), ub = r.int(-4, 4) / 2, vb = r.int(-4, 4) / 2, al = r.pick([.5, 1, 2, 3]);
      const res = Ix * ub + Iy * vb + It, den = al * al + Ix * Ix + Iy * Iy, u = ub - Ix * res / den, v = vb - Iy * res / den;
      return {prompt: Q`At a pixel, \((I_x,I_y,I_t)=(${Ix}, ${Iy}, ${It})\), the average flow of its neighbours is \((\bar u,\bar v)=(${ub}, ${vb})\) and the smoothness weight is \(\alpha=${al}\). Apply one Horn–Schunck update to find the new (u, v).`,
        answers: [{label: Q`\((u, v)\)`, vector: [u, v], tol: .01}],
        hint: Q`First the residual \(\rho=I_x\bar u+I_y\bar v+I_t\). Then \(u=\bar u-I_x\rho/(\alpha^2+I_x^2+I_y^2)\) and \(v=\bar v-I_y\rho/(\alpha^2+I_x^2+I_y^2)\).`,
        solution: Q`\(\rho=${Ix}\cdot${paren(ub)}+${Iy}\cdot${paren(vb)}+${paren(It)}=${dec(res)}\) and \(\alpha^2+I_x^2+I_y^2=${dec(den)}\), so \(u=${ub}-${paren(Ix)}\cdot${paren(dec(res))}/${dec(den)}=${dec(u)}\) and \(v=${vb}-${paren(Iy)}\cdot${paren(dec(res))}/${dec(den)}=${dec(v)}\). A larger α keeps the flow closer to its neighbours’ average.`};
    }},
  ];

  /* ---------- Lab: Lucas–Kanade flow on a synthetically moved photo ---------- */
  // Bilinear sample at continuous coordinates (pixel centres at i + 0.5), clamped to the image.
  function sample(img, w, h, X, Y) {
    let x = X - .5, y = Y - .5;
    if (x < 0) x = 0; else if (x > w - 1) x = w - 1;
    if (y < 0) y = 0; else if (y > h - 1) y = h - 1;
    let x0 = x | 0, y0 = y | 0;
    if (x0 > w - 2) x0 = w - 2;
    if (y0 > h - 2) y0 = h - 2;
    const fx = x - x0, fy = y - y0, i = y0 * w + x0;
    return (img[i] * (1 - fx) + img[i + 1] * fx) * (1 - fy) + (img[i + w] * (1 - fx) + img[i + w + 1] * fx) * fy;
  }
  function pyramid(gray, w, h, levels) {
    const V = window.CV_VISION, P = [{data: gray, w, h}];
    for (let l = 1; l < levels; l++) {
      const p = P[l - 1], b = V.blur(p.data, p.w, p.h, 1), nw = p.w >> 1, nh = p.h >> 1, d = new Float32Array(nw * nh);
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const i = 2 * y * p.w + 2 * x; d[y * nw + x] = (b[i] + b[i + 1] + b[i + p.w] + b[i + p.w + 1]) / 4; }
      P.push({data: d, w: nw, h: nh});
    }
    return P.map(p => {
      const gx = new Float32Array(p.w * p.h), gy = new Float32Array(p.w * p.h);
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        const i = y * p.w + x;
        gx[i] = (p.data[y * p.w + Math.min(p.w - 1, x + 1)] - p.data[y * p.w + Math.max(0, x - 1)]) / 2;
        gy[i] = (p.data[Math.min(p.h - 1, y + 1) * p.w + x] - p.data[Math.max(0, y - 1) * p.w + x]) / 2;
      }
      return {...p, gx, gy};
    });
  }
  // Pyramidal, iterative Lucas–Kanade for one point given in level-0 continuous coordinates.
  function track(P0, P1, X, Y, r, iters) {
    let du = 0, dv = 0, lmin = 0;
    for (let l = P0.length - 1; l >= 0; l--) {
      if (l < P0.length - 1) { du *= 2; dv *= 2; }
      const A = P0[l], B = P1[l], s = 2 ** l, cx = X / s, cy = Y / s, n = (2 * r + 1) ** 2, i0 = new Float64Array(n), gx = new Float64Array(n), gy = new Float64Array(n);
      let a = 0, b = 0, c = 0, k = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++, k++) {
        i0[k] = sample(A.data, A.w, A.h, cx + dx, cy + dy); gx[k] = sample(A.gx, A.w, A.h, cx + dx, cy + dy); gy[k] = sample(A.gy, A.w, A.h, cx + dx, cy + dy);
        a += gx[k] * gx[k]; b += gx[k] * gy[k]; c += gy[k] * gy[k];
      }
      const det = a * c - b * b;
      if (l === 0) lmin = Math.max(0, (a + c) / 2 - Math.sqrt(((a - c) / 2) ** 2 + b * b)) / n;
      if (det <= 1e-9 * (a + c) ** 2) continue;
      for (let it = 0; it < iters; it++) {
        let b1 = 0, b2 = 0; k = 0;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++, k++) { const e = sample(B.data, B.w, B.h, cx + dx + du, cy + dy + dv) - i0[k]; b1 -= gx[k] * e; b2 -= gy[k] * e; }
        const su = (c * b1 - b * b2) / det, sv = (a * b2 - b * b1) / det;
        du += su; dv += sv;
        if (Math.abs(su) + Math.abs(sv) < .005) break;
      }
    }
    return {du, dv, lmin};
  }
  const SPACING = 16;
  const lab = {
    name: 'opticalflow', title: 'Lucas–Kanade optical flow', photo: 'camera',
    heading: 'Move the photo. Recover the motion.',
    intro: 'Frame 2 is the photo moved by a known rotation, zoom and shift, plus noise, so the true flow is known at every pixel. Lucas–Kanade estimates the flow at a grid of points from a window around each, iterating and working down a Gaussian pyramid. Arrows are coloured by their error.',
    defaults: {tx: 8, ty: 4, rot: 2, zoom: 1.02, noise: 1, r: 5, iters: 5, levels: 3, view: 'lmin', gain: 2, truth: false},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return range('tx', 'Shift right (pixels)', -12, 12, .5, s.tx) + range('ty', 'Shift down (pixels)', -12, 12, .5, s.ty) + range('rot', 'Rotation (degrees)', -10, 10, .5, s.rot) + range('zoom', 'Zoom factor', .9, 1.1, .01, s.zoom) +
        range('noise', 'Noise σ in frame 2 (grey levels)', 0, 10, .5, s.noise) + range('r', 'Window half-width r (window 2r + 1)', 1, 10, 1, s.r) + range('iters', 'Gauss–Newton iterations per level', 1, 10, 1, s.iters) +
        range('levels', 'Pyramid levels (1 = no coarse-to-fine)', 1, 4, 1, s.levels) + range('gain', 'Draw arrows longer by', 1, 4, .5, s.gain) +
        select('view', 'Right-hand view', [['lmin', 'λ_min of M: where flow is measurable'], ['diff', 'Frame 2 − frame 1 (the I_t image)'], ['frame2', 'Frame 2 itself']], s.view) + check('truth', 'Also draw the true flow (thin blue)', s.truth) +
        '<div class="math-rule">M [u v]ᵀ = −[ΣIₓI_t  ΣI_yI_t]ᵀ,   d at level ℓ = d / 2ˡ</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div class="vk-pair">${figure('of-a', 'Frame 1 with the estimated flow')}${figure('of-b', 'Right-hand view')}</div><p class="vk-legend"><span class="vk-key" style="background:#3fae6a"></span>error below 0.5 px <span class="vk-key" style="background:#e0b13a"></span>0.5 to 2 px <span class="vk-key" style="background:#e8743b"></span>above 2 px</p><div id="of-info"></div>`;
    },
    note: 'Predict first: set the pyramid levels to 1 with the default 8-pixel shift. Most arrows turn orange, because the first linearisation compares pixels that are no longer related; with 3 levels the same shift is 2 pixels at the top and almost every arrow is green. Now look at the λ_min view: the remaining errors sit in the smooth sky and along straight edges such as the tripod legs, where M is nearly singular and only the flow across the edge is measured (the aperture problem). A bigger window helps there but blurs the flow where the motion changes. Rotation and zoom make the flow vary across the image, so a single shift per window is only an approximation.',
    async setup() { const img = await window.CV_VISION.load('camera'); return {img, cache: new Map()}; },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt, clamp} = V, {img} = data, w = img.w, h = img.h, I0 = img.gray;
      const th = rad(Number(s.rot)), z = Number(s.zoom), A = [z * Math.cos(th), -z * Math.sin(th), z * Math.sin(th), z * Math.cos(th)], cx = w / 2, cy = h / 2, tx = Number(s.tx), ty = Number(s.ty);
      const det = A[0] * A[3] - A[1] * A[2], Ai = [A[3] / det, -A[1] / det, -A[2] / det, A[0] / det];
      const flow = (X, Y) => [A[0] * (X - cx) + A[1] * (Y - cy) + cx + tx - X, A[2] * (X - cx) + A[3] * (Y - cy) + cy + ty - Y];
      const levels = Number(s.levels), r = Number(s.r), iters = Number(s.iters);
      const key = `${s.tx}|${s.ty}|${s.rot}|${s.zoom}|${s.noise}`;
      let F = data.cache.get(key);
      if (!F) {
        // Frame 2 at x shows frame 1 at W⁻¹(x): brightness constancy holds exactly, up to sampling and noise.
        const I1 = new Float32Array(w * h), g = V.rng(23), nz = Number(s.noise);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const X = x + .5 - cx - tx, Y = y + .5 - cy - ty;
          I1[y * w + x] = sample(I0, w, h, Ai[0] * X + Ai[1] * Y + cx, Ai[2] * X + Ai[3] * Y + cy) + nz * g.gauss();
        }
        F = {I1};
        if (data.cache.size > 20) data.cache.clear();
        data.cache.set(key, F);
      }
      const pyr0 = data.p0 && data.p0.length >= levels ? data.p0 : (data.p0 = pyramid(I0, w, h, 4)), pyr1 = F.pyr4 || (F.pyr4 = pyramid(F.I1, w, h, 4));
      const P0 = pyr0.slice(0, levels), P1 = pyr1.slice(0, levels);
      const pts = [];
      for (let Y = SPACING; Y < h; Y += SPACING) for (let X = SPACING; X < w; X += SPACING) {
        const t = track(P0, P1, X, Y, r, iters), f = flow(X, Y);
        pts.push({X, Y, ...t, f, err: Math.hypot(t.du - f[0], t.dv - f[1])});
      }
      const colour = e => e < .5 ? '#3fae6a' : e < 2 ? '#e0b13a' : '#e8743b', gain = Number(s.gain);
      const arrows = ctx => {
        pts.forEach(p => {
          if (s.truth) { ctx.strokeStyle = 'rgba(127,184,223,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(p.X + gain * p.f[0], p.Y + gain * p.f[1]); ctx.stroke(); }
          const ex = p.X + gain * clamp(p.du, -20, 20), ey = p.Y + gain * clamp(p.dv, -20, 20), ang = Math.atan2(ey - p.Y, ex - p.X), col = colour(p.err);
          ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 4 * Math.cos(ang - .45), ey - 4 * Math.sin(ang - .45)); ctx.lineTo(ex - 4 * Math.cos(ang + .45), ey - 4 * Math.sin(ang + .45)); ctx.closePath(); ctx.fill();
        });
      };
      const ca = root.querySelector('#of-a'), cb = root.querySelector('#of-b'), info = root.querySelector('#of-info');
      arrows(V.show(ca, I0, w, h).getContext('2d'));
      ca.nextElementSibling.textContent = `Frame 1 with the Lucas–Kanade flow at ${pts.length} points (arrows ${fmt(gain, 1)}× longer than the motion)${s.truth ? '; thin blue: the true flow' : ''}`;
      if (s.view === 'diff') { V.show(cb, F.I1.map((v, i) => v - I0[i]), w, h, {mode: 'signed'}); cb.nextElementSibling.textContent = 'I_t = frame 2 − frame 1 at each pixel (grey = 0): large only where the moving content has a gradient'; }
      else if (s.view === 'frame2') { V.show(cb, F.I1, w, h, {min: 0, max: 255}); cb.nextElementSibling.textContent = 'Frame 2: the photo moved by the known warp, plus noise'; }
      else {
        // λ_min of the box-window structure tensor at every pixel, shown as √λ_min.
        const lkey = `lmin|${r}`;
        let lm = data.cache.get(lkey);
        if (!lm) {
          const box = new Float32Array(2 * r + 1).fill(1 / (2 * r + 1)), n = w * h, xx = new Float32Array(n), xy = new Float32Array(n), yy = new Float32Array(n), G = pyr0[0];
          for (let i = 0; i < n; i++) { xx[i] = G.gx[i] * G.gx[i]; xy[i] = G.gx[i] * G.gy[i]; yy[i] = G.gy[i] * G.gy[i]; }
          const sm = q => V.filter(V.filter(q, w, h, box, box.length, 1), w, h, box, 1, box.length), a = sm(xx), b = sm(xy), c = sm(yy);
          lm = new Float32Array(n);
          for (let i = 0; i < n; i++) lm[i] = Math.sqrt(Math.max(0, (a[i] + c[i]) / 2 - Math.sqrt(((a[i] - c[i]) / 2) ** 2 + b[i] * b[i])));
          data.cache.set(lkey, lm);
        }
        arrows(V.show(cb, lm, w, h, {mode: 'heat'}).getContext('2d'));
        cb.nextElementSibling.textContent = `√λ_min of M over a ${2 * r + 1} × ${2 * r + 1} window (bright: gradients in two directions, flow well determined; dark: flat or a straight edge)`;
      }
      const errs = pts.map(p => p.err).sort((x, y) => x - y), mean = errs.reduce((t, e) => t + e, 0) / errs.length;
      const byL = pts.slice().sort((p, q) => p.lmin - q.lmin), qn = Math.floor(byL.length / 4), low = byL.slice(0, qn), high = byL.slice(qn);
      const avg = list => list.reduce((t, p) => t + p.err, 0) / Math.max(1, list.length), maxTrue = Math.max(...pts.map(p => Math.hypot(p.f[0], p.f[1])));
      info.innerHTML = `<p class="vk-callout">Largest true motion <strong>${fmt(maxTrue, 2)} px</strong>, which is <strong>${fmt(maxTrue / 2 ** (levels - 1), 2)} px</strong> at the coarsest of ${levels} level${levels === 1 ? '' : 's'}. Mean error where λ_min is in the lowest quarter: <strong>${fmt(avg(low), 2)} px</strong>; at the other points: <strong>${fmt(avg(high), 2)} px</strong>.</p>`;
      return V.report([['Points', `${pts.length} on a ${SPACING}-pixel grid`], ['Mean endpoint error', `${fmt(mean, 3)} px`], ['Median endpoint error', `${fmt(errs[Math.floor(errs.length / 2)], 3)} px`], ['Points within 0.5 px', `${fmt(100 * errs.filter(e => e < .5).length / errs.length, 1)}%`], ['Window', `${2 * r + 1} × ${2 * r + 1} pixels, ${iters} iteration${iters === 1 ? '' : 's'} per level`]]);
    },
  };

  window.CV_EXTEND.lesson(59, {
    teaching: {
      equation: Q`\begin{gathered}I(x+u,\,y+v,\,t+1)=I(x,y,t)\ \Rightarrow\ I_xu+I_yv+I_t\approx0\\ \begin{bmatrix}\sum I_x^2&\sum I_xI_y\\\sum I_xI_y&\sum I_y^2\end{bmatrix}\begin{bmatrix}u\\v\end{bmatrix}=-\begin{bmatrix}\sum I_xI_t\\\sum I_yI_t\end{bmatrix},\qquad d_\ell=\frac{d}{2^\ell}\end{gathered}`,
      symbols: [['(u, v)', 'optical flow at a pixel'], ['I_t', 'temporal difference between frames'], ['M', 'structure tensor of the window'], ['d_ℓ', 'displacement at pyramid level ℓ'], ['α', 'Horn–Schunck smoothness weight']],
      connection: 'KLT feature tracking, video stabilisation, direct visual odometry and SLAM, medical image registration and the photometric loss of self-supervised depth networks all minimise brightness differences after a warp. RAFT and DROID-SLAM keep the same idea and replace the 2 × 2 solve with learned iterative updates over a correlation volume.',
      trap: 'Trusting the flow everywhere. On a straight edge or a flat region M is singular or nearly so, and the solution divides by a tiny eigenvalue: only the component across the edge was measured, and the rest is noise. Check λ_min(M) before using a flow vector.',
      question: 'Every pixel in a Lucas–Kanade window has the same gradient direction, (1, 0). What can the window tell you about the flow?',
      choices: ['Only the horizontal component u; the vertical component v is undetermined', 'Both components, as long as the window is large enough', 'Nothing at all, because M is zero'], correct: 0,
      explanation: 'Each pixel gives Iₓu + I_t = 0, so u is fixed but v never appears. M = diag(ΣIₓ², 0) is singular: this is the aperture problem, and a larger window with the same edge does not help.',
    },
    guide: {
      title: 'One equation per pixel, two unknowns: pool a window, or iterate down a pyramid',
      paragraphs: [
        'Brightness constancy says a moving point keeps its brightness. Linearised, it gives one equation per pixel, Iₓu + I_yv + I_t ≈ 0, which fixes only the flow across the local edge. Lucas–Kanade assumes the flow is constant over a small window and solves the stacked equations by least squares: the 2 × 2 matrix is the structure tensor, so corners give reliable flow and edges do not.',
        'The linearisation holds for motions of about a pixel. Iterating, warping the second frame by the current estimate, is Gauss–Newton; running it from the coarsest pyramid level, where every motion is 2ˡ times smaller, recovers large motions. Horn–Schunck instead adds a smoothness penalty, which fills in flow where there is no texture.',
      ],
      example: 'Lucas–Kanade on a four-pixel window',
      controls: [{label: 'Gradient direction θ of pixels 3 and 4 (degrees)', min: 0, max: 90, step: 15, value: 90}, {label: 'True horizontal flow u* (pixels)', min: -3, max: 3, step: .5, value: 2}, {label: 'True vertical flow v* (pixels)', min: -3, max: 3, step: .5, value: 1}, {label: 'Error added to I_t of pixel 4', min: -1, max: 1, step: .25, value: 0}],
      predict: 'Turn θ down to 0, so that all four gradients point the same way. Which component of the flow can Lucas–Kanade still recover?',
      takeaway: 'Each pixel’s equation is a line in the (u, v) plane. Lucas–Kanade finds the least-squares point, which is well defined only when the lines cross at a good angle: that is, when both eigenvalues of M are large. Parallel lines leave the motion along the edge undetermined.',
      notation: 'Iₓ and I_y are spatial derivatives and I_t the difference between the frames at a pixel. (u, v) is the flow, M = Σ∇I∇Iᵀ the structure tensor and −ΣI_t∇I the right-hand side. λ₁ ≥ λ₂ are the eigenvalues of M; d* is the true flow.',
    },
    notation: {
      '(u, v)': {tex: Q`(u,v)`, detail: 'The optical flow at a pixel: how many pixels the image content there moves to the right (u) and down (v) between the two frames.'},
      I_t: {tex: 'I_t', detail: 'The temporal difference I(x, y, t + 1) − I(x, y, t) at a fixed pixel. Brightness constancy predicts I_t ≈ −(Iₓu + I_yv).'},
      M: {tex: 'M', detail: 'The structure tensor Σ∇I∇Iᵀ of the window (Lesson 57), which is also the Gauss–Newton matrix JᵀJ. If its smaller eigenvalue is near zero, the flow along the edge is undetermined.'},
      'd_ℓ': {tex: Q`d_\ell`, detail: 'The displacement measured at pyramid level ℓ, where the image has been halved ℓ times: d_ℓ = d/2ˡ. An 8-pixel motion is 1 pixel at ℓ = 3.'},
      'α': {tex: Q`\alpha`, detail: 'The Horn–Schunck weight on the smoothness term α²(‖∇u‖² + ‖∇v‖²). A large α gives smooth flow that spreads into textureless regions; a small α trusts each pixel’s own equation.'},
    },
    calculate, practice, lab,
  });
})();
