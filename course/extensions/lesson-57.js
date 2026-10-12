/* Lesson 57: image gradients, the structure tensor and corners. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const vec = v => `(${v.map(x => N(x)).join(', ')})`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const FONT = 'font-family="Segoe UI,Arial"';
  const text = (x, y, s, color = '#64736b', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${FONT}${extra}>${s}</text>`;
  const rad = d => d * Math.PI / 180;
  const deg = (y, x) => Math.atan2(y, x) * 180 / Math.PI;

  // Eigenvalues and unit eigenvectors of the symmetric 2 x 2 matrix [[a, b], [b, c]], largest first.
  function eig2(a, b, c) {
    const m = (a + c) / 2, q = Math.sqrt(((a - c) / 2) ** 2 + b * b), l1 = m + q, l2 = m - q;
    let v = Math.abs(b) > 1e-12 ? [b, l1 - a] : (a >= c ? [1, 0] : [0, 1]);
    const n = Math.hypot(v[0], v[1]) || 1;
    v = [v[0] / n, v[1] / n];
    return {l1, l2, v1: v, v2: [-v[1], v[0]]};
  }
  // Ratio t = λ₂/λ₁ at which the Harris score changes sign: the small root of t = k(1 + t)².
  const harrisRatio = k => ((1 - 2 * k) - Math.sqrt((1 - 2 * k) ** 2 - 4 * k * k)) / (2 * k);

  /* ---------- Worked example: a four-pixel window with two gradient directions ---------- */
  function model(p) {
    const [t1, t2, g2, k] = p;
    const u1 = [Math.cos(rad(t1)), Math.sin(rad(t1))], u2 = [g2 * Math.cos(rad(t2)), g2 * Math.sin(rad(t2))];
    let a = 0, b = 0, c = 0;
    [u1, u1, u2, u2].forEach(([x, y]) => { a += x * x; b += x * y; c += y * y; });
    const e = eig2(a, b, c), det = a * c - b * b, tr = a + c, R = det - k * tr * tr, t = harrisRatio(k);
    return {t1, t2, g2, k, u1, u2, a, b, c, ...e, det, tr, R, t, corner: R > 0};
  }
  function drawing(m) {
    const ox = 135, oy = 128, S = 62;
    let body = '<defs><marker id="l57-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#bd431c"/></marker><marker id="l57-arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#315c86"/></marker></defs>';
    body += text(14, 22, 'Window gradients and the spread of M', '#172623', 14, ' font-weight="600"');
    body += `<path d="M${ox - 95} ${oy}H${ox + 95}M${ox} ${oy - 95}V${oy + 95}" stroke="#c7cfc5"/>` + text(ox + 82, oy - 6, 'x →', '#64736b', 11) + text(ox + 6, oy + 92, 'y ↓', '#64736b', 11);
    // Ellipse with semi-axes S·√(λᵢ/4): the RMS gradient along each eigenvector.
    const r1 = S * Math.sqrt(Math.max(0, m.l1) / 4), r2 = Math.max(.8, S * Math.sqrt(Math.max(0, m.l2) / 4)), phi = deg(m.v1[1], m.v1[0]);
    body += `<ellipse cx="${ox}" cy="${oy}" rx="${r1.toFixed(1)}" ry="${r2.toFixed(1)}" transform="rotate(${phi.toFixed(2)} ${ox} ${oy})" fill="#34734e22" stroke="#34734e" stroke-width="2.5"/>`;
    const arrow = (u, color, marker, label, dy) => {
      const L = Math.hypot(u[0], u[1]);
      if (L < 1e-9) return text(14, 244, label + ' = (0, 0): these two pixels are flat', color, 12);
      const x = ox + u[0] * S, y = oy + u[1] * S;
      return `<path d="M${ox} ${oy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${color}" stroke-width="3" marker-end="url(#${marker})"/>` + text((x + (u[0] >= 0 ? 6 : -6)).toFixed(1), (y + (u[1] >= 0 ? 16 : -6)).toFixed(1), label, color, 12, u[0] >= 0 ? '' : ' text-anchor="end"');
    };
    // When both pairs point the same way, drop the second label below the first so they do not overlap.
    const same = Math.hypot(m.u2[0], m.u2[1]) > 1e-9 && Math.abs(m.u1[0] * m.u2[1] - m.u1[1] * m.u2[0]) < .35 * Math.hypot(m.u2[0], m.u2[1]) && m.u1[0] * m.u2[0] + m.u1[1] * m.u2[1] > 0;
    body += arrow(m.u1, '#bd431c', 'l57-arrow', '∇I₁ = ∇I₂', -10) + arrow(m.u2, '#315c86', 'l57-arrow2', same ? '' : '∇I₃ = ∇I₄', 14) + (same ? text(14, 244, '∇I₃ = ∇I₄ (blue) points the same way as ∇I₁ = ∇I₂', '#315c86', 12) : '');
    // Right: the (λ₁, λ₂) plane with the Harris sign regions for this k.
    const X0 = 318, Y0 = 200, W = 200, H = 160, top = 4.4, X = l => X0 + l / top * W, Y = l => Y0 - l / top * H;
    body += text(X0 - 6, 22, 'Eigenvalue plane (λ₂ ≤ λ₁)', '#172623', 14, ' font-weight="600"');
    body += `<path d="M${X(0)} ${Y(0)}L${X(top)} ${Y(top)}L${X(top)} ${Y(top * m.t)}Z" fill="#34734e1f"/><path d="M${X(0)} ${Y(0)}L${X(top)} ${Y(top * m.t)}L${X(top)} ${Y(0)}Z" fill="#bd431c1a"/>`;
    body += `<path d="M${X(0)} ${Y(0)}L${X(top)} ${Y(top * m.t)}" stroke="#bd431c" stroke-dasharray="5 4"/><path d="M${X(0)} ${Y(0)}L${X(top)} ${Y(top)}" stroke="#a8b6a5"/>`;
    body += `<path d="M${X(0)} ${Y(0)}H${X(top) + 6}M${X(0)} ${Y(0)}V${Y(top) - 6}" stroke="#64736b"/>` + text(X(top) + 9, Y(0) + 4, 'λ₁', '#64736b', 12) + text(X(0) - 20, Y(top) + 6, 'λ₂', '#64736b', 12);
    [1, 2, 3, 4].forEach(v => { body += text(X(v) - 3, Y(0) + 14, String(v), '#64736b', 10) + text(X(0) - 12, Y(v) + 4, String(v), '#64736b', 10); });
    body += text(X(2.55), Y(2.05), 'corner, R &gt; 0', '#34734e', 12) + text(X(0) + 6, Y(0) + 32, 'edge, R &lt; 0: the thin wedge on the λ₁ axis', '#bd431c', 12) + text(X(0) + 4, Y(0) - 6, 'flat', '#64736b', 11);
    body += `<circle cx="${X(m.l1).toFixed(1)}" cy="${Y(Math.max(0, m.l2)).toFixed(1)}" r="6.5" fill="${m.corner ? '#34734e' : '#bd431c'}" stroke="#ffffff" stroke-width="1.5"/>`;
    body += text(X0 + 4, 46, `R = ${N(m.R)}  (k = ${N(m.k, 2)})`, m.corner ? '#34734e' : '#bd431c', 13, ' font-weight="600"');
    return {body, caption: `Left: the four pixel gradients (orange: two pixels at θ₁ = ${N(m.t1, 0)}°; blue: two at θ₂ = ${N(m.t2, 0)}° with strength ${N(m.g2, 2)}; y points down as in an image) and the ellipse of M, whose half-axes are the RMS gradient √(λᵢ/4) along each eigenvector. Right: the point (λ₁, λ₂) = (${N(m.l1)}, ${N(Math.max(0, m.l2))}); the dashed line λ₂ = ${N(m.t, 4)}·λ₁ is where the Harris score changes sign for this k.`};
  }
  function calculate(p) {
    const m = model(p), u1 = m.u1, u2 = m.u2, q = Math.sqrt(((m.a - m.c) / 2) ** 2 + m.b * m.b);
    const outer = u => [[u[0] * u[0], u[0] * u[1]], [u[0] * u[1], u[1] * u[1]]];
    return {
      steps: [
        step('List the gradients in the window', Q`\nabla I_{1}=\nabla I_{2}=(\cos${N(m.t1, 0)}^\circ,\ \sin${N(m.t1, 0)}^\circ)=${vec(u1)},\qquad \nabla I_{3}=\nabla I_{4}=${N(m.g2, 2)}\,(\cos${N(m.t2, 0)}^\circ,\ \sin${N(m.t2, 0)}^\circ)=${vec(u2)}`, 'Four pixels of a tiny window: two with a unit gradient in direction θ₁ and two with strength g₂ in direction θ₂. In a real detector these come from a derivative-of-Gaussian filter, and a Gaussian window weights them.'),
        step('Add the outer products', Q`M=\sum_x\nabla I\,\nabla I^T=2${mat(outer(u1))}+2${mat(outer(u2))}=${mat([[m.a, m.b], [m.b, m.c]])}`, 'Each pixel contributes Ix², Ix·Iy and Iy². M is symmetric, and ΔuᵀMΔu predicts how much the window changes when it is shifted by Δu.'),
        step('Find the eigenvalues', Q`\lambda=\frac{a+c}2\pm\sqrt{\Big(\frac{a-c}2\Big)^2+b^2}=${N((m.a + m.c) / 2)}\pm${N(q)}\ \Rightarrow\ \lambda_1=${N(m.l1)},\ \ \lambda_2=${N(Math.max(0, m.l2))}`, `The eigenvector of λ₁ points at ${N(deg(m.v1[1], m.v1[0]), 1)}°: the shift that changes the window fastest. A shift along the other eigenvector changes it by only λ₂ = ${N(Math.max(0, m.l2))} per unit.`),
        step('Score it with Harris', Q`R=\det M-k(\operatorname{tr}M)^2=${N(m.det)}-${N(m.k, 2)}\cdot${N(m.tr)}^2=${N(m.R)}`, m.corner
          ? `R > 0: a corner. Both directions change the window, since λ₂/λ₁ = ${N(m.l2 / m.l1, 3)} is above ${N(m.t, 4)}, the ratio at which R changes sign for k = ${N(m.k, 2)}. Shi–Tomasi would score min λ = ${N(Math.max(0, m.l2))}.`
          : `R ≤ 0: an edge. One direction barely changes the window, since λ₂/λ₁ = ${N(Math.max(0, m.l2) / m.l1, 3)} is at most ${N(m.t, 4)}, the ratio at which R changes sign for k = ${N(m.k, 2)}. The patch would slide along the edge unnoticed.`),
      ],
      values: [['M11 (sum of Ix squared)', m.a], ['M12 (sum of Ix times Iy)', m.b], ['M22 (sum of Iy squared)', m.c], ['Larger eigenvalue', m.l1], ['Smaller eigenvalue', m.l2], ['det M', m.det], ['tr M', m.tr], ['Harris R', m.R]],
      note: 'Set θ₂ = θ₁: the gradients all point one way and λ₂ = 0, an edge, whatever the angle. Set θ₁ = θ₂ = 45° and M = [[2, 2], [2, 2]] has large entries but is still an edge. Lower g₂ from 1 towards 0 and watch R change sign once λ₂/λ₁ falls below the dashed line.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 3) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.join(', ')})`;
  const sq = (v, d = 3) => v < 0 ? `(${dec(v, d)})^2` : `${dec(v, d)}^2`;   // square a printed number, bracketing negatives
  const SX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], SY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  const conv3 = (K, P) => K.reduce((t, row, i) => t + row.reduce((u, k, j) => u + k * P[i][j], 0), 0);
  const practice = [
    {key: 'sobel-gradient', skill: 'Compute a Sobel gradient on a 3 × 3 patch', make(r) {
      let P, sx, sy;
      do {
        const base = r.int(8, 30) * 5, gx = r.int(-12, 12), gy = r.int(-12, 12);
        P = [-1, 0, 1].map(y => [-1, 0, 1].map(x => base + gx * x + gy * y + (r.bool(.4) ? r.int(-6, 6) : 0)));
        sx = conv3(SX, P); sy = conv3(SY, P);
      } while (P.flat().some(v => v < 0 || v > 255) || (sx === 0 && sy === 0));
      const ix = sx / 8, iy = sy / 8, mag = Math.hypot(ix, iy);
      return {prompt: Q`A 3 × 3 patch has rows ${P.map(row => tup(row)).join(', ')} from top to bottom. Compute \(I_x\) and \(I_y\) with the Sobel kernels divided by 8, then the gradient magnitude \(|\nabla I|\).`,
        answers: [{label: Q`\((I_x, I_y)\)`, vector: [ix, iy], tol: .01}, {label: Q`\(|\nabla I|\)`, value: mag, tol: .02}],
        hint: Q`For \(I_x\): right column minus left column in each row, weighted 1, 2, 1, then divide by 8. For \(I_y\): bottom row minus top row in each column, weighted 1, 2, 1.`,
        solution: Q`\(S_x\): \((${P[0][2]}-${P[0][0]})+2(${P[1][2]}-${P[1][0]})+(${P[2][2]}-${P[2][0]})=${sx}\), so \(I_x=${sx}/8=${dec(ix)}\). \(S_y\): \((${P[2][0]}-${P[0][0]})+2(${P[2][1]}-${P[0][1]})+(${P[2][2]}-${P[0][2]})=${sy}\), so \(I_y=${sy}/8=${dec(iy)}\). \(|\nabla I|=\sqrt{${sq(ix)}+${sq(iy)}}\approx${dec(mag, 2)}\).`};
    }},
    {key: 'gradient-angle', skill: 'Find the magnitude and atan2 orientation of a gradient', make(r) {
      let x, y;
      do { [x, y] = r.bool(.5) ? r.pick([[3, 4], [4, 3], [5, 12], [12, 5], [8, 15], [6, 8], [0, 7], [9, 0]]).map(v => v * r.pick([1, 2])) : [r.int(-20, 20), r.int(-20, 20)]; x *= r.sign(); y *= r.sign(); }
      while ((x === 0 && y === 0) || (y === 0 && x < 0));
      const mag = Math.hypot(x, y), th = deg(y, x), base = x === 0 ? 90 : Math.atan(Math.abs(y) / Math.abs(x)) * 180 / Math.PI;
      const rule = x === 0 ? Q`\(I_x=0\), so the angle is \(\pm90^\circ\) by the sign of \(I_y\)` : x > 0 ? Q`\(I_x>0\), so the first-quadrant angle stands${y < 0 ? ', made negative because \\(I_y<0\\)' : ''}` : Q`\(I_x<0\), so use \(180^\circ-${dec(base, 2)}^\circ=${dec(180 - base, 2)}^\circ\)${y < 0 ? ', made negative because \\(I_y<0\\)' : ''}`;
      return {prompt: Q`A pixel has gradient \((I_x, I_y)=(${x}, ${y})\), with y pointing down the image. Give \(|\nabla I|\) and the orientation \(\theta=\operatorname{atan2}(I_y,I_x)\) in degrees, between −180° and 180°.`,
        answers: [{label: Q`\(|\nabla I|\)`, value: mag}, {label: Q`\(\theta\) (degrees)`, value: th, tol: .1}],
        hint: Q`Start from \(\arctan(|I_y|/|I_x|)\), then use the signs: \(I_x<0\) puts the vector on the left half (angle above 90° in size), and \(I_y<0\) makes the angle negative.`,
        solution: Q`\(|\nabla I|=\sqrt{${sq(x)}+${sq(y)}}=${dec(mag, 3)}\). ${x === 0 ? '' : Q`\(\arctan(${Math.abs(y)}/${Math.abs(x)})=${dec(base, 2)}^\circ\); `}${rule}: \(\theta=${dec(th, 2)}^\circ\). The gradient points from dark to bright${y > 0 ? ', partly downwards' : y < 0 ? ', partly upwards' : ''}; the edge runs perpendicular to it.`};
    }},
    {key: 'structure-tensor', skill: 'Build a structure tensor and its Harris score', make(r) {
      let G, a, b, c, R, k;
      do {
        G = Array.from({length: r.int(3, 4)}, () => [r.int(-3, 3), r.int(-3, 3)]);
        a = G.reduce((t, g) => t + g[0] * g[0], 0); b = G.reduce((t, g) => t + g[0] * g[1], 0); c = G.reduce((t, g) => t + g[1] * g[1], 0);
        k = r.pick([.04, .05, .06]); R = a * c - b * b - k * (a + c) ** 2;
      } while (a + c < 4 || Math.abs(R) < .5);
      const det = a * c - b * b, tr = a + c, corner = R > 0;
      return {prompt: Q`A window has pixel gradients ${G.map(g => Q`\(${tup(g)}\)`).join(', ')}. Build \(M=\sum\nabla I\,\nabla I^T\), give its entries \((M_{11}, M_{12}, M_{22})\) and the Harris score \(R=\det M-k(\operatorname{tr}M)^2\) with \(k=${k}\). Is the window a corner or an edge?`,
        answers: [{label: Q`\((M_{11}, M_{12}, M_{22})\)`, vector: [a, b, c], tol: 0}, {label: Q`\(R\)`, value: R, tol: .01}, {label: 'Verdict', choices: ['Corner (R > 0)', 'Edge (R < 0)'], correct: corner ? 0 : 1}],
        hint: Q`Add \(I_x^2\) over the pixels for \(M_{11}\), \(I_xI_y\) for \(M_{12}\) and \(I_y^2\) for \(M_{22}\). Then \(\det M=M_{11}M_{22}-M_{12}^2\) and \(\operatorname{tr}M=M_{11}+M_{22}\).`,
        solution: Q`\(M_{11}=${G.map(g => sq(g[0])).join('+')}=${a}\), \(M_{12}=${G.map(g => `(${g[0]})(${g[1]})`).join('+')}=${b}\), \(M_{22}=${G.map(g => sq(g[1])).join('+')}=${c}\). \(\det M=${a}\cdot${c}-${sq(b)}=${det}\), \(\operatorname{tr}M=${tr}\), so \(R=${det}-${k}\cdot${tr}^2=${dec(R, 2)}\): ${corner ? 'positive, a corner. Both eigenvalues are large.' : 'negative, an edge. One eigenvalue is small compared with the other.'}`};
    }},
    {key: 'tensor-eigenvalues', skill: 'Classify a window from the eigenvalues of M', make(r) {
      const kind = r.pick(['flat', 'edge', 'corner']);
      let p, j;
      if (kind === 'flat') { p = 1; j = r.int(0, 5); }
      else if (kind === 'edge') { p = r.int(2, 8); j = r.int(0, Math.ceil(p / 2) - 1); }
      else { p = r.int(2, 8); j = r.int(Math.ceil(p / 2), Math.min(5 * p, 4 * p)); }
      const L1 = 25 * p, L2 = 5 * j, [cs, sn] = r.pick([[1, 0], [0, 1], [.6, .8], [.8, .6], [.6, -.8], [.8, -.6]]);
      const a = Number((cs * cs * L1 + sn * sn * L2).toFixed(6)), b = Number((cs * sn * (L1 - L2)).toFixed(6)), c = Number((sn * sn * L1 + cs * cs * L2).toFixed(6));
      const m = (a + c) / 2, q = Math.sqrt(((a - c) / 2) ** 2 + b * b);
      return {prompt: Q`A window has structure tensor \(M=${mat([[a, b], [b, c]])}\). Find its eigenvalues \(\lambda_1\ge\lambda_2\). Then classify it with this rule: flat if \(\lambda_1<50\); otherwise an edge if \(\lambda_2<0.1\,\lambda_1\); otherwise a corner.`,
        answers: [{label: Q`\((\lambda_1, \lambda_2)\)`, vector: [L1, L2], tol: .01}, {label: 'Window type', choices: ['Flat', 'Edge', 'Corner'], correct: ['flat', 'edge', 'corner'].indexOf(kind)}],
        hint: Q`\(\lambda=\frac{a+c}2\pm\sqrt{\big(\frac{a-c}2\big)^2+b^2}\). Check: the eigenvalues add up to \(a+c\) and multiply to \(ac-b^2\).`,
        solution: Q`\(\frac{a+c}2=${dec(m)}\) and \(\sqrt{(${dec((a - c) / 2)})^2+(${dec(b)})^2}=${dec(q)}\), so \(\lambda_1=${L1}\) and \(\lambda_2=${L2}\) (sum ${dec(a + c)}, product ${dec(L1 * L2)}). ${kind === 'flat' ? Q`\(\lambda_1=${L1}<50\): flat; no shift changes the window much.` : kind === 'edge' ? Q`\(\lambda_1\ge50\) but \(\lambda_2=${L2}<0.1\cdot${L1}=${dec(.1 * L1)}\): an edge, which slides along itself unchanged.` : Q`\(\lambda_1\ge50\) and \(\lambda_2=${L2}\ge${dec(.1 * L1)}\): a corner, pinned down in both directions.`} The matrix is a rotated \(\operatorname{diag}(${L1}, ${L2})\), and rotation does not change eigenvalues.`};
    }},
    {key: 'derivative-noise', skill: 'Propagate pixel noise through a derivative filter', make(r) {
      const sigma = r.pick([2, 4, 5, 6, 8, 10, 12, 15, 20]), f = r.pick(['central', 'forward', 'sobel']);
      const spec = {central: [Q`the central difference \(\tfrac12\big(I(x+1)-I(x-1)\big)\)`, 2 / 4, Q`\(\tfrac14(1+1)\sigma^2=0.5\sigma^2\)`], forward: [Q`the forward difference \(I(x+1)-I(x)\)`, 2, Q`\((1+1)\sigma^2=2\sigma^2\)`], sobel: [Q`Sobel \(S_x\) divided by 8`, 12 / 64, Q`\(\tfrac1{64}(1+4+1+1+4+1)\sigma^2=\tfrac{12}{64}\sigma^2\)`]}[f];
      const sd = sigma * Math.sqrt(spec[1]);
      return {prompt: Q`A flat image region carries independent noise with standard deviation σ = ${sigma} grey levels at every pixel. What is the standard deviation of the derivative estimate given by ${spec[0]}?`,
        answers: [{label: 'Standard deviation', value: sd}],
        hint: Q`The filter output is a weighted sum of independent pixels. Its variance is the sum of (weight)² × σ², because variances of independent terms add and \(\operatorname{Var}(aX)=a^2\operatorname{Var}(X)\).`,
        solution: Q`Variance ${spec[2]} \(=${dec(spec[1] * sigma * sigma, 4)}\), so the standard deviation is \(${dec(sd, 3)}\). For comparison, the central difference gives \(0.707\sigma\) and Sobel/8 only \(0.433\sigma\): averaging over three rows smooths away part of the noise before it is differenced.`};
    }},
    {key: 'separable-cost', skill: 'Count the cost of a separable derivative-of-Gaussian filter', make(r) {
      const sigma = r.pick([.8, 1, 1.2, 1.5, 2, 2.5, 3, 4]), rr = Math.max(1, Math.ceil(3 * sigma)), n = 2 * rr + 1;
      return {prompt: Q`A derivative-of-Gaussian filter with σ = ${sigma} pixels is cut off at radius \(r=\lceil3\sigma\rceil\). How many taps does each 1D kernel have, how many multiplications per pixel does the full 2D kernel need, and how many does the separable version (a row pass and a column pass) need?`,
        answers: [{label: 'Taps per 1D kernel', value: n, tol: 0}, {label: 'Multiplications, 2D kernel', value: n * n, tol: 0}, {label: 'Multiplications, separable', value: 2 * n, tol: 0}],
        hint: Q`A kernel of radius r covers offsets −r … r, that is 2r + 1 taps. The 2D kernel is a square of those; the separable version uses one 1D kernel along x and one along y.`,
        solution: Q`\(r=\lceil${dec(3 * sigma)}\rceil=${rr}\), so each 1D kernel has \(2\cdot${rr}+1=${n}\) taps. The 2D kernel has \(${n}^2=${n * n}\) taps; the separable version needs \(${n}+${n}=${2 * n}\), about ${dec(n / 2, 1)} times fewer. This works because \(\partial G_\sigma/\partial x=g_\sigma'(x)\,g_\sigma(y)\).`};
    }},
  ];

  /* ---------- Lab: gradients, structure tensor and corners on a photo ---------- */
  const SOBEL = {x: [-1, 0, 1, -2, 0, 2, -1, 0, 1], y: [-1, -2, -1, 0, 0, 0, 1, 2, 1]};
  // 1D Gaussian g (sum 1) and derivative taps d with Σ i·dᵢ = 1, for cross-correlation (positive on the right).
  function derivKernel(sigma) {
    const g = window.CV_VISION.gaussianKernel(sigma), r = (g.length - 1) / 2;
    let s = 0;
    for (let i = -r; i <= r; i++) s += i * i * g[i + r];
    return {g, d: Float32Array.from(g, (v, j) => (j - r) * v / s)};
  }
  function gradients(gray, w, h, method, sigma) {
    const V = window.CV_VISION;
    if (method === 'sobel') return {ix: V.filter(gray, w, h, SOBEL.x, 3, 3).map(v => v / 8), iy: V.filter(gray, w, h, SOBEL.y, 3, 3).map(v => v / 8), taps: 3};
    const {g, d} = derivKernel(sigma), n = g.length;
    return {ix: V.filter(V.filter(gray, w, h, d, n, 1), w, h, g, 1, n), iy: V.filter(V.filter(gray, w, h, g, n, 1), w, h, d, 1, n), taps: n};
  }
  function tensor(ix, iy, w, h, sigmaI) {
    const V = window.CV_VISION, n = w * h, xx = new Float32Array(n), xy = new Float32Array(n), yy = new Float32Array(n);
    for (let i = 0; i < n; i++) { xx[i] = ix[i] * ix[i]; xy[i] = ix[i] * iy[i]; yy[i] = iy[i] * iy[i]; }
    return {a: V.blur(xx, w, h, sigmaI), b: V.blur(xy, w, h, sigmaI), c: V.blur(yy, w, h, sigmaI)};
  }
  function scores(T, k) {
    const n = T.a.length, R = new Float32Array(n), lmin = new Float32Array(n), lmax = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = T.a[i], b = T.b[i], c = T.c[i], m = (a + c) / 2, q = Math.sqrt(((a - c) / 2) ** 2 + b * b);
      lmax[i] = m + q; lmin[i] = Math.max(0, m - q); R[i] = a * c - b * b - k * (a + c) ** 2;
    }
    return {R, lmin, lmax};
  }
  const percentile = (values, p) => { const s = Float32Array.from(values).sort(); return s[Math.min(s.length - 1, Math.floor(p * s.length))] || 1; };
  // Local maxima (radius 3) of a positive score, strongest first; ties go to the earlier pixel.
  function detect(score, w, h, count, margin, valid) {
    const cand = [], rad3 = 3;
    for (let y = margin; y < h - margin; y++) for (let x = margin; x < w - margin; x++) {
      const i = y * w + x, v = score[i];
      if (!(v > 0) || (valid && !valid[i])) continue;
      let peak = true;
      for (let dy = -rad3; dy <= rad3 && peak; dy++) for (let dx = -rad3; dx <= rad3; dx++) {
        if (!dx && !dy) continue;
        const u = score[i + dy * w + dx];
        if (u > v || (u === v && dy * w + dx < 0)) { peak = false; break; }
      }
      if (peak) cand.push([x, y, v]);
    }
    return cand.sort((p, q) => q[2] - p[2]).slice(0, count);
  }
  function hsv(hue, sat, val) {
    const f = n => { const k = (n + hue / 60) % 6; return 255 * (val - val * sat * Math.max(0, Math.min(k, 4 - k, 1))); };
    return [f(5), f(3), f(1)];
  }
  // Rotation by `angle` degrees and scaling by `scale` about the image centre, in pixel-centre coordinates.
  function similarity(angle, scale, w, h) {
    const t = rad(angle), c = Math.cos(t) * scale, s = Math.sin(t) * scale, cx = w / 2, cy = h / 2;
    const H = [c, -s, cx - c * cx + s * cy, s, c, cy - s * cx - c * cy, 0, 0, 1];
    return {H, Hinv: window.CV_VISION.inv3(H)};
  }
  const VIEWS = [['harris', 'Harris score R (dark: edge, light: corner)'], ['lmin', 'Smaller eigenvalue λ₂ (Shi–Tomasi)'], ['mag', 'Gradient magnitude |∇I|'], ['theta', 'Gradient orientation θ as colour'], ['ix', 'Iₓ alone (grey = 0)'], ['iy', 'I_y alone (grey = 0)'], ['warp', 'Repeatability: rotate and scale the photo']];
  const lab = {
    name: 'corners', title: 'Gradients, structure tensor and corners', photo: 'brick',
    heading: 'Measure the gradient. Find the corners.',
    intro: 'Every pixel gets a gradient (Iₓ, I_y) from a derivative filter. Blurring Iₓ², IₓI_y and I_y² with a window Gaussian gives the structure tensor M at every pixel, and its eigenvalues score the pixel as flat, edge or corner. Click the photo to see one pixel’s M as an ellipse.',
    defaults: {img: 'brick', view: 'harris', method: 'dog', sigma: 1, sigmaI: 2, k: .05, score: 'harris', count: 100, angle: 30, scale: 1, px: 128, py: 128},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('img', 'Photo', [['brick', 'Brick wall'], ['camera', 'Cameraman']], s.img) +
        select('view', 'Right-hand view', VIEWS, s.view) +
        select('method', 'Gradient filter', [['dog', 'Derivative of Gaussian (σ below)'], ['sobel', 'Sobel ÷ 8 (fixed 3 × 3)']], s.method) +
        `<div data-show-when="method:dog">${range('sigma', 'Gradient scale σ (pixels)', .5, 3, .1, s.sigma)}</div>` +
        range('sigmaI', 'Window scale σᵢ (pixels)', .5, 4, .1, s.sigmaI) +
        select('score', 'Corner score', [['harris', 'Harris R = det M − k (tr M)²'], ['shi', 'Shi–Tomasi: smaller eigenvalue λ₂']], s.score) +
        range('k', 'Harris constant k', .02, .15, .01, s.k) + range('count', 'Corners kept N (strongest local maxima)', 10, 300, 10, s.count) +
        `<div data-show-when="view:warp">${range('angle', 'Rotate the copy by (degrees)', -90, 90, 5, s.angle)}${range('scale', 'Scale the copy by', .5, 2, .05, s.scale)}</div>` +
        '<div class="math-rule">M = G_σᵢ * [Iₓ²  IₓI_y; IₓI_y  I_y²],   R = det M − k (tr M)²</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div class="vk-pair">${figure('cn-photo', 'Photo with the N strongest corners (orange). Click to inspect a pixel: blue ellipse = its M, half-axes ∝ √λ along the eigenvectors.', 'vk-clickable')}${figure('cn-map', 'Score map', 'vk-clickable')}</div><div id="cn-info"></div>`;
    },
    note: 'Predict first: on the brick wall, do the mortar lines score positive or negative R? Negative: a straight mortar line is an edge, and only the junctions where lines meet score as corners. Click a line and then a junction: one ellipse is a thin needle, the other nearly round. Raise σ and fine texture stops producing corners; raise σᵢ and nearby corners merge. Compare Sobel with σ = 1: almost the same map. In the repeatability view a 45° rotation keeps most corners, because the eigenvalues of M do not depend on orientation, but scaling by 2 loses many of them: Harris is not scale-invariant, which Lesson 58 fixes.',
    async setup() {
      const V = window.CV_VISION, [brick, camera] = await Promise.all([V.load('brick'), V.load('camera')]);
      // Round to whole grey levels, as the warped copy is, so an identity warp repeats every corner exactly.
      const q = im => ({...im, gray: Float32Array.from(im.gray, v => Math.round(v))});
      return {imgs: {brick: q(brick), camera: q(camera)}, cache: new Map()};
    },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt, clamp} = V, img = data.imgs[s.img], w = img.w, h = img.h;
      const sigma = s.method === 'sobel' ? 0 : Number(s.sigma), sigmaI = Number(s.sigmaI), k = Number(s.k), count = Number(s.count);
      const margin = Math.ceil(3 * Math.max(sigma, .5) + 3 * sigmaI) + 1;
      const pipeline = (key, gray) => {
        if (data.cache.has(key)) return data.cache.get(key);
        const g = gradients(gray, w, h, s.method, sigma), T = tensor(g.ix, g.iy, w, h, sigmaI), mag = g.ix.map((v, i) => Math.hypot(v, g.iy[i]));
        const out = {...g, T, mag, magRef: percentile(mag, .99)};
        if (data.cache.size > 24) data.cache.clear();
        data.cache.set(key, out);
        return out;
      };
      const base = pipeline(`${s.img}|${s.method}|${sigma}|${sigmaI}`, img.gray), S = scores(base.T, k), score = s.score === 'shi' ? S.lmin : S.R;
      const lref = percentile(S.lmax, .99);
      const photo = root.querySelector('#cn-photo'), map = root.querySelector('#cn-map'), capMap = map.nextElementSibling, info = root.querySelector('#cn-info');
      const dot = (ctx, x, y, color, r = 3) => { ctx.beginPath(); ctx.arc(x + .5, y + .5, r, 0, 2 * Math.PI); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); };
      const scoreName = s.score === 'shi' ? 'Shi–Tomasi λ₂' : 'Harris R';
      // Non-flat pixels: those whose larger eigenvalue reaches 2% of the photo's 99th percentile.
      let strong = 0, edgeLike = 0;
      for (let i = 0; i < w * h; i++) if (S.lmax[i] > .02 * lref) { strong++; if (S.R[i] < 0) edgeLike++; }
      const filterText = s.method === 'sobel' ? 'Sobel ÷ 8 (3 × 3, smoothing [1 2 1])' : `derivative of Gaussian, σ = ${fmt(sigma, 1)}: ${base.taps} taps per 1D pass, ${2 * base.taps} multiplications per pixel instead of ${base.taps * base.taps}`;

      if (s.view === 'warp') {
        const {H, Hinv} = similarity(Number(s.angle), Number(s.scale), w, h), sc = Number(s.scale);
        const wkey = `${s.img}|warp|${s.angle}|${s.scale}`;
        let warped = data.cache.get(wkey);
        if (!warped) {
          const rgba = new Uint8ClampedArray(w * h * 4);
          for (let i = 0; i < w * h; i++) { rgba[4 * i] = rgba[4 * i + 1] = rgba[4 * i + 2] = img.gray[i]; rgba[4 * i + 3] = 255; }
          const out = V.warpRGBA(rgba, w, h, Hinv, w, h, {background: [128, 128, 128]}), gray = new Float32Array(w * h);
          for (let i = 0; i < w * h; i++) gray[i] = out[4 * i];
          warped = {gray, rgba: out};
          data.cache.set(wkey, warped);
        }
        const wp = pipeline(`${wkey}|${s.method}|${sigma}|${sigmaI}`, warped.gray), WS = scores(wp.T, k), wscore = s.score === 'shi' ? WS.lmin : WS.R;
        // Common region: warped pixels whose source is at least margin/scale inside the photo, and photo pixels that land there.
        const mSrc = (margin + 2) / sc, validW = new Uint8Array(w * h), validO = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const [u, v] = V.applyH(Hinv, x + .5, y + .5);
          if (u >= mSrc && v >= mSrc && u <= w - mSrc && v <= h - mSrc) validW[y * w + x] = 1;
          const [p, q] = V.applyH(H, x + .5, y + .5);
          if (p >= margin && q >= margin && p <= w - margin && q <= h - margin) validO[y * w + x] = 1;
        }
        const cw = detect(wscore, w, h, count, margin, validW), co = detect(score, w, h, count, margin, validO), eps = 2.5;
        let matched = 0;
        const hits = co.map(([x, y]) => {
          const [u, v] = V.applyH(H, x + .5, y + .5), ok = cw.some(([a, b]) => Math.hypot(a + .5 - u, b + .5 - v) <= eps);
          if (ok) matched++;
          return {x, y, u: u - .5, v: v - .5, ok};
        });
        const pc = V.show(photo, img.gray, w, h), pctx = pc.getContext('2d');
        // Outline of the part of the photo that the copy shows.
        pctx.setLineDash([4, 3]); pctx.strokeStyle = '#7fb8df'; pctx.lineWidth = 1.5; pctx.beginPath();
        [[0, 0], [w, 0], [w, h], [0, h]].forEach(([x, y], i) => { const [u, v] = V.applyH(Hinv, x, y); i ? pctx.lineTo(u, v) : pctx.moveTo(u, v); });
        pctx.closePath(); pctx.stroke(); pctx.setLineDash([]);
        hits.forEach(c => dot(pctx, c.x, c.y, c.ok ? '#3fae6a' : '#e8743b'));
        const mc = V.showRGBA(map, warped.rgba, w, h), mctx = mc.getContext('2d');
        cw.forEach(([x, y]) => dot(mctx, x, y, '#7fb8df', 4));
        hits.forEach(c => { mctx.fillStyle = c.ok ? '#3fae6a' : '#e8743b'; mctx.fillRect(c.u - 1, c.v - 1, 3, 3); });
        capMap.textContent = `Copy rotated by ${fmt(Number(s.angle), 0)}° and scaled by ${fmt(sc, 2)}. Blue rings: its own ${cw.length} corners. Small squares: the photo’s corners mapped through the known warp (green: a ring within ${eps} px).`;
        photo.nextElementSibling.textContent = 'Photo: green corners were found again in the copy, orange ones were not. Dashed blue: the part of the photo the copy shows.';
        info.innerHTML = `<p class="vk-callout">Repeatability <strong>${co.length ? fmt(100 * matched / co.length, 1) : '—'}%</strong>: ${matched} of the photo’s ${co.length} strongest corners in the shared region reappear within ${eps} px of a corner detected independently in the copy. Try 45° at scale 1, then 0° at scale 2.</p>`;
        return V.report([['Warp', `rotate ${fmt(Number(s.angle), 0)}°, scale ×${fmt(sc, 2)} about the centre`], ['Corners compared', `${co.length} in the photo, ${cw.length} in the copy (${scoreName})`], ['Repeated within 2.5 px', `${matched} (${co.length ? fmt(100 * matched / co.length, 1) : '—'}%)`], ['Gradient filter', filterText], ['Window', `Gaussian σᵢ = ${fmt(sigmaI, 1)} px`]]);
      }

      const corners = detect(score, w, h, count, margin);
      const pc = V.show(photo, img.gray, w, h), pctx = pc.getContext('2d');
      corners.forEach(([x, y]) => dot(pctx, x, y, '#e8743b'));
      photo.nextElementSibling.textContent = `Photo with the ${corners.length} strongest local maxima of ${scoreName} (orange). Click to inspect a pixel: blue ellipse = its M, half-axes ∝ √λ along the eigenvectors.`;
      // The clicked pixel: its structure tensor drawn as an ellipse.
      const px = clamp(Math.round(s.px), 0, w - 1), py = clamp(Math.round(s.py), 0, h - 1), j = py * w + px;
      const a = base.T.a[j], b = base.T.b[j], c = base.T.c[j], e = eig2(a, b, c), Rj = a * c - b * b - k * (a + c) ** 2;
      const r1 = Math.min(40, 22 * Math.sqrt(Math.max(0, e.l1) / lref)), r2 = Math.min(40, Math.max(.7, 22 * Math.sqrt(Math.max(0, e.l2) / lref)));
      pctx.strokeStyle = '#7fb8df'; pctx.lineWidth = 2; pctx.beginPath(); pctx.ellipse(px + .5, py + .5, Math.max(.7, r1), r2, Math.atan2(e.v1[1], e.v1[0]), 0, 2 * Math.PI); pctx.stroke();
      pctx.beginPath(); pctx.moveTo(px - 4, py + .5); pctx.lineTo(px + 5, py + .5); pctx.moveTo(px + .5, py - 4); pctx.lineTo(px + .5, py + 5); pctx.stroke();
      // Verdict: flat if λ₁ is tiny for this photo; edge if R < 0; a corner only if its score would make the top N.
      const cut = corners.length ? corners[corners.length - 1][2] : Infinity, mine = s.score === 'shi' ? Math.max(0, e.l2) : Rj;
      const kind = e.l1 < .02 * lref ? 'flat: both eigenvalues are small' : Rj < 0 ? 'edge: R &lt; 0, one eigenvalue dominates' : mine >= cut ? 'corner: both eigenvalues are large, and its score makes the top N' : `weak corner: R &gt; 0, but its ${scoreName} is below the ${fmt(cut, 1)} of the weakest kept corner (texture or a soft edge)`;
      const ix = base.ix[j], iy = base.iy[j];
      // Right-hand view.
      const views = {
        harris: () => { V.show(map, S.R.map(v => Math.sign(v) * Math.abs(v) ** .25), w, h, {mode: 'signed'}); return 'Harris R shown as sign · |R|^¼: dark = edge (R < 0), light = corner (R > 0), mid-grey = flat'; },
        lmin: () => { V.show(map, S.lmin.map(Math.sqrt), w, h, {mode: 'heat'}); return 'Smaller eigenvalue λ₂, shown as √λ₂: bright only where the gradients point in two directions'; },
        mag: () => { V.show(map, base.mag, w, h, {min: 0, max: base.magRef}); return `Gradient magnitude |∇I| (white ≥ ${fmt(base.magRef, 1)} grey levels per pixel, the 99th percentile)`; },
        theta: () => {
          map.width = w; map.height = h;
          const ctx = map.getContext('2d'), im = ctx.createImageData(w, h);
          for (let i = 0; i < w * h; i++) { const [rr, gg, bb] = hsv((deg(base.iy[i], base.ix[i]) + 360) % 360, 1, Math.min(1, base.mag[i] / base.magRef)); im.data[4 * i] = rr; im.data[4 * i + 1] = gg; im.data[4 * i + 2] = bb; im.data[4 * i + 3] = 255; }
          ctx.putImageData(im, 0, 0);
          return 'Orientation θ = atan2(I_y, Iₓ) as hue (red 0°: brighter to the right; yellow-green 90°: brighter below; cyan 180°; violet −90°), brightness ∝ |∇I|';
        },
        ix: () => { V.show(map, base.ix, w, h, {mode: 'signed'}); return 'Iₓ: light where brightness increases to the right, dark where it decreases, grey = 0'; },
        iy: () => { V.show(map, base.iy, w, h, {mode: 'signed'}); return 'I_y: light where brightness increases downwards, dark where it decreases, grey = 0'; },
      };
      capMap.textContent = (views[s.view] || views.harris)();
      const mctx = map.getContext('2d');
      mctx.strokeStyle = '#7fb8df'; mctx.lineWidth = 1.5; mctx.strokeRect(px - 3, py - 3, 7, 7);
      info.innerHTML = `<p class="vk-callout">Pixel (${px}, ${py}): Iₓ = <strong>${fmt(ix, 2)}</strong>, I_y = <strong>${fmt(iy, 2)}</strong>, |∇I| = ${fmt(Math.hypot(ix, iy), 2)}, θ = ${fmt(deg(iy, ix), 1)}°. Window M = [${fmt(a, 1)}, ${fmt(b, 1)}; ${fmt(b, 1)}, ${fmt(c, 1)}], λ₁ = <strong>${fmt(e.l1, 1)}</strong>, λ₂ = <strong>${fmt(Math.max(0, e.l2), 1)}</strong>, R = ${fmt(Rj, 1)}: <strong>${kind}</strong>.</p>`;
      return V.report([['Gradient filter', filterText], ['Window', `Gaussian σᵢ = ${fmt(sigmaI, 1)} px (weights sum to 1, so M is a weighted average)`], ['Corners kept', `${corners.length} local maxima of ${scoreName}`], ['Non-flat pixels that are edge-like (R &lt; 0)', strong ? `${fmt(100 * edgeLike / strong, 1)}% of ${strong}` : '—'], ['R changes sign at', `λ₂/λ₁ = ${fmt(harrisRatio(k), 4)} for k = ${fmt(k, 2)}`]]);
    },
    wire(root, s, rerender) {
      ['#cn-photo', '#cn-map'].forEach(sel => {
        const el = root.querySelector(sel);
        if (!el) return;
        el.addEventListener('click', e => {
          if (s.view === 'warp') return;
          const rect = el.getBoundingClientRect();
          if (!rect.width) return;
          s.px = Math.floor((e.clientX - rect.left) / rect.width * el.width); s.py = Math.floor((e.clientY - rect.top) / rect.height * el.height); rerender();
        });
      });
    },
  };

  window.CV_EXTEND.lesson(57, {
    teaching: {
      equation: Q`\begin{gathered}I_x=\frac{\partial G_\sigma}{\partial x}*I,\qquad |\nabla I|=\sqrt{I_x^2+I_y^2},\qquad \theta=\operatorname{atan2}(I_y,I_x)\\ M=\sum_x w(x)\begin{bmatrix}I_x^2&I_xI_y\\I_xI_y&I_y^2\end{bmatrix},\qquad R=\det M-k(\operatorname{tr}M)^2=\lambda_1\lambda_2-k(\lambda_1+\lambda_2)^2\end{gathered}`,
      symbols: [['I_x, I_y', 'horizontal and vertical image derivatives'], ['∇I', 'image gradient'], ['G_σ', 'Gaussian of scale σ'], ['M', 'structure tensor of a window'], ['λ₁, λ₂', 'eigenvalues of M'], ['R', 'Harris corner score'], ['k', 'Harris constant']],
      connection: 'Harris and Shi–Tomasi corners, KLT tracking, ORB’s corner score, Canny edges and SIFT’s orientation histograms all start from derivative-of-Gaussian gradients. The structure tensor M is also the matrix that Lucas–Kanade optical flow and direct image alignment invert.',
      trap: 'Do not read a corner off the entries of M. [[2, 2], [2, 2]] has four large entries, yet its eigenvalues are 4 and 0: a straight edge at 45°. Only the eigenvalues, or det M and tr M together, separate edges from corners.',
      question: 'A window contains a straight edge. You rotate the image by 30°. What happens to the eigenvalues of the window’s structure tensor?',
      choices: ['They stay the same; only the eigenvectors turn by 30°', 'The smaller one grows, so the edge starts to look like a corner', 'Both shrink by cos 30°'], correct: 0,
      explanation: 'Rotating the image rotates every gradient, so M becomes RMRᵀ. That matrix has the same eigenvalues with rotated eigenvectors, so an edge stays an edge and the Harris score is rotation-invariant.',
    },
    guide: {
      title: 'Gradients measure change; the structure tensor asks in how many directions',
      paragraphs: [
        'An image gradient is two filter responses: the brightness change per pixel to the right, Iₓ, and downwards, I_y. A plain difference of neighbours amplifies noise, so detectors blur first; the derivative of a Gaussian does both in one separable kernel, and Sobel is its 3 × 3 cousin. The magnitude measures edge strength and atan2 gives the direction across the edge.',
        'To decide whether a point is distinctive, ask how much its window changes when shifted. A first-order Taylor expansion turns the sum of squared differences into ΔuᵀMΔu, where M adds up Iₓ², IₓI_y and I_y². Two small eigenvalues mean flat, one large means an edge that slides along itself, two large mean a corner. Harris scores det M − k(tr M)² to avoid the square roots.',
      ],
      example: 'Structure tensor and Harris score of a four-pixel window',
      controls: [{label: 'Direction θ₁ of gradients 1 and 2 (degrees)', min: 0, max: 180, step: 15, value: 0}, {label: 'Direction θ₂ of gradients 3 and 4 (degrees)', min: 0, max: 180, step: 15, value: 90}, {label: 'Strength g₂ of gradients 3 and 4', min: 0, max: 1, step: .1, value: 1}, {label: 'Harris constant k', min: .04, max: .06, step: .01, value: .04}],
      predict: 'Set both directions to 45°. The four entries of M are then equal and nonzero. Will Harris call the window a corner?',
      takeaway: 'Corners need gradients in two different directions. The eigenvalues of M measure how much a shift changes the window along its two principal directions; Harris compares their product with their sum, so it is positive only when the smaller eigenvalue is a reasonable fraction of the larger.',
      notation: 'Iₓ and I_y are the brightness changes per pixel to the right and downwards, ∇I = (Iₓ, I_y). M = [[a, b], [b, c]] adds up Iₓ², IₓI_y and I_y² over the window; λ₁ ≥ λ₂ are its eigenvalues, det M = ac − b² and tr M = a + c. R is the Harris score and k a constant near 0.05.',
    },
    notation: {
      'I_x, I_y': {tex: Q`I_x,\ I_y`, detail: 'The partial derivatives of image brightness: Iₓ is the change per pixel to the right, I_y the change per pixel downwards (image rows grow downwards). Each is computed by sliding a derivative kernel such as Sobel ÷ 8 or a derivative of Gaussian.'},
      '∇I': {tex: Q`\nabla I`, detail: 'The image gradient (Iₓ, I_y). Its length √(Iₓ² + I_y²) is the edge strength; its direction atan2(I_y, Iₓ) points across the edge from dark to bright.'},
      'G_σ': {tex: Q`G_\sigma`, detail: 'The 2D Gaussian of standard deviation σ pixels, G_σ(x, y) = g_σ(x)g_σ(y). Filtering with its derivative ∂G_σ/∂x = g′_σ(x)g_σ(y) smooths and differentiates in one separable step; σ sets the scale of the edges measured.'},
      M: {tex: 'M', detail: 'The structure tensor (second-moment matrix) of a window: the weighted sum of the outer products ∇I∇Iᵀ. Here M is not a camera matrix. It is symmetric with eigenvalues λ₁ ≥ λ₂ ≥ 0, and E(Δu) ≈ ΔuᵀMΔu predicts the change of the window under a shift Δu.'},
      'λ₁, λ₂': {tex: Q`\lambda_1,\ \lambda_2`, detail: 'The eigenvalues of M, largest first: the change of the window per unit shift along its fastest and slowest directions. Both small: flat; λ₁ large and λ₂ ≈ 0: edge; both large: corner.'},
      R: {tex: 'R', detail: 'The Harris corner score det M − k(tr M)² = λ₁λ₂ − k(λ₁ + λ₂)². Positive at corners, negative on edges, near zero in flat regions. Here R is not a rotation matrix.'},
      k: {tex: 'k', detail: 'The Harris constant, usually 0.04 to 0.06. R is positive only when λ₂/λ₁ exceeds the small root of t = k(1 + t)², about 0.044 for k = 0.04, so a larger k demands more balanced eigenvalues.'},
    },
    calculate, practice, lab,
  });
})();
