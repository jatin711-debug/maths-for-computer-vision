/* Lesson 60: multivariate Gaussians, Kalman filtering and data association. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const col = v => mat(v.map(x => [x]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const FONT = 'font-family="Segoe UI,Arial"';
  const text = (x, y, s, color = '#64736b', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${FONT}${extra}>${s}</text>`;

  // Points on the 1σ ellipse of a 2 × 2 covariance [[a, b], [b, c]] around (mx, my).
  function ellipse(mx, my, a, b, c, k = 1, n = 48) {
    const m = (a + c) / 2, q = Math.sqrt(((a - c) / 2) ** 2 + b * b), l1 = m + q, l2 = Math.max(0, m - q);
    let e = Math.abs(b) > 1e-12 ? [b, l1 - a] : (a >= c ? [1, 0] : [0, 1]);
    const len = Math.hypot(e[0], e[1]) || 1; e = [e[0] / len, e[1] / len];
    const r1 = k * Math.sqrt(Math.max(0, l1)), r2 = k * Math.sqrt(l2);
    return Array.from({length: n + 1}, (_, i) => { const t = 2 * Math.PI * i / n, c1 = r1 * Math.cos(t), s2 = r2 * Math.sin(t); return [mx + c1 * e[0] - s2 * e[1], my + c1 * e[1] + s2 * e[0]]; });
  }

  /* ---------- Worked example: one predict–update step for position and velocity ---------- */
  function model(p) {
    const [z, R, q] = p, x0 = [0, 1];
    // Predict with F = [[1, 1], [0, 1]] and white-acceleration noise Q = q [[1/4, 1/2], [1/2, 1]].
    const xp = [x0[0] + x0[1], x0[1]], Pp = [2 + q / 4, 1 + q / 2, 1 + q];   // [P11, P12, P22] of F I Fᵀ + Q
    const y = z - xp[0], S = Pp[0] + R, K = [Pp[0] / S, Pp[1] / S];
    const x = [xp[0] + K[0] * y, xp[1] + K[1] * y], P = [Pp[0] - S * K[0] * K[0], Pp[1] - S * K[0] * K[1], Pp[2] - S * K[1] * K[1]];
    return {z, R, q, x0, xp, Pp, y, S, K, x, P, d2: y * y / S};
  }
  function drawing(m) {
    const L = 40, Rr = 330, T = 22, B = 222, p0 = -1.5, p1 = 6, v0 = -1, v1 = 3.5, X = p => L + (p - p0) / (p1 - p0) * (Rr - L), Y = v => B - (v - v0) / (v1 - v0) * (B - T);
    const path = pts => pts.map(([p, v], i) => `${i ? 'L' : 'M'}${X(p).toFixed(1)} ${Y(v).toFixed(1)}`).join('') + 'Z';
    let body = `<defs><clipPath id="l60-box"><rect x="${L}" y="${T}" width="${Rr - L}" height="${B - T}"/></clipPath><marker id="l60-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#64736b"/></marker></defs>`;
    body += `<rect x="${L}" y="${T}" width="${Rr - L}" height="${B - T}" fill="none" stroke="#c7cfc5"/>`;
    for (let p = -1; p <= 6; p++) body += `<path d="M${X(p)} ${T}V${B}" stroke="${p ? '#e3e8e1' : '#a8b6a5'}"/>` + text(X(p) - 3, B + 13, String(p), '#64736b', 10);
    for (let v = -1; v <= 3; v++) body += `<path d="M${L} ${Y(v)}H${Rr}" stroke="${v ? '#e3e8e1' : '#a8b6a5'}"/>` + text(L - 14, Y(v) + 4, String(v), '#64736b', 10);
    body += text(Rr - 52, B + 27, 'position p', '#64736b', 11) + text(4, T - 8, 'velocity v', '#64736b', 11);
    body += '<g clip-path="url(#l60-box)">';
    // Measurement: z ± √R along the position axis only.
    const sr = Math.sqrt(m.R);
    body += `<rect x="${X(m.z - sr).toFixed(1)}" y="${T}" width="${(X(m.z + sr) - X(m.z - sr)).toFixed(1)}" height="${B - T}" fill="#315c861a"/><path d="M${X(m.z).toFixed(1)} ${T}V${B}" stroke="#315c86" stroke-width="2" stroke-dasharray="6 4"/>`;
    body += `<path d="${path(ellipse(m.x0[0], m.x0[1], 1, 0, 1))}" fill="none" stroke="#a8b6a5" stroke-width="2"/>`;
    body += `<path d="${path(ellipse(m.xp[0], m.xp[1], m.Pp[0], m.Pp[1], m.Pp[2]))}" fill="#bd431c14" stroke="#bd431c" stroke-width="2" stroke-dasharray="5 3"/>`;
    body += `<path d="${path(ellipse(m.x[0], m.x[1], m.P[0], m.P[1], m.P[2]))}" fill="#34734e22" stroke="#34734e" stroke-width="2.5"/>`;
    body += `<path d="M${X(m.x0[0])} ${Y(m.x0[1])}L${X(m.xp[0])} ${Y(m.xp[1])}" stroke="#64736b" stroke-width="1.5" marker-end="url(#l60-arr)"/><path d="M${X(m.xp[0])} ${Y(m.xp[1])}L${X(m.x[0]).toFixed(1)} ${Y(m.x[1]).toFixed(1)}" stroke="#64736b" stroke-width="1.5" marker-end="url(#l60-arr)"/>`;
    body += `<circle cx="${X(m.x0[0])}" cy="${Y(m.x0[1])}" r="4" fill="#a8b6a5"/><circle cx="${X(m.xp[0])}" cy="${Y(m.xp[1])}" r="4.5" fill="#bd431c"/><circle cx="${X(m.x[0]).toFixed(1)}" cy="${Y(m.x[1]).toFixed(1)}" r="5" fill="#34734e"/>`;
    body += '</g>';
    const c0 = 348;
    body += text(c0, 22, 'One predict–update step', '#172623', 14, ' font-weight="600"');
    body += text(c0, 44, 'grey: start (0, 1), P = I', '#64736b', 12) + text(c0, 62, `orange dashed: x⁻ = (${N(m.xp[0])}, ${N(m.xp[1])})`, '#bd431c', 12) + text(c0, 80, `blue band: z = ${N(m.z, 2)} ± √R = ${N(sr, 2)}`, '#315c86', 12);
    body += text(c0, 98, `green: x = (${N(m.x[0])}, ${N(m.x[1])})`, '#34734e', 12, ' font-weight="600"');
    body += text(c0, 124, `S = ${N(m.S)},  K = (${N(m.K[0])}, ${N(m.K[1])})`, '#172623', 12) + text(c0, 142, `P = [${N(m.P[0])}, ${N(m.P[1])}; ${N(m.P[1])}, ${N(m.P[2])}]`, '#172623', 12);
    body += text(c0, 168, `gate d² = y²/S = ${N(m.d2)}`, m.d2 < 3.84 ? '#34734e' : '#bd431c', 12) + text(c0, 184, m.d2 < 3.84 ? 'inside the 95% gate (3.84)' : 'outside the 95% gate (3.84)', m.d2 < 3.84 ? '#34734e' : '#bd431c', 12);
    body += text(c0, 210, 'Ellipses: 1σ of each Gaussian.', '#64736b', 11.5) + text(c0, 225, 'Only p is measured; v moves too.', '#64736b', 11.5);
    return {body, caption: `The (position, velocity) plane. Grey: the starting Gaussian. Orange dashed: after the prediction p ← p + v, stretched and tilted because position now depends on velocity. Blue: the measurement z = ${N(m.z, 2)} of position only. Green: the updated Gaussian, smaller and moved along its tilt, so the velocity changes from ${N(m.xp[1])} to ${N(m.x[1])} without being measured.`};
  }
  function calculate(p) {
    const m = model(p), Pp = [[m.Pp[0], m.Pp[1]], [m.Pp[1], m.Pp[2]]], P = [[m.P[0], m.P[1]], [m.P[1], m.P[2]]];
    return {
      steps: [
        step('Predict: push the Gaussian through the motion model', Q`x^-=Fx=\begin{bmatrix}1&1\\0&1\end{bmatrix}\begin{bmatrix}0\\1\end{bmatrix}=${col(m.xp)},\qquad P^-=FPF^T+Q=\begin{bmatrix}2&1\\1&1\end{bmatrix}+${N(m.q, 2)}\begin{bmatrix}\tfrac14&\tfrac12\\\tfrac12&1\end{bmatrix}=${mat(Pp)}`, 'The linear-transform rule: the mean follows F and the covariance becomes FPFᵀ. Process noise Q (here a random acceleration of variance q) is independent, so its covariance adds.'),
        step('Compare with the measurement', Q`y=z-Hx^-=${N(m.z, 2)}-${N(m.xp[0])}=${N(m.y)},\qquad S=HP^-H^T+R=${N(m.Pp[0])}+${N(m.R, 2)}=${N(m.S)}`, `H = [1 0] measures position only. S is the variance the innovation y should have; d² = y²/S = ${N(m.d2)} is ${m.d2 < 3.84 ? 'inside' : 'outside'} the 95% gate of 3.84, so ${m.d2 < 3.84 ? 'the measurement is plausible for this track' : 'a tracker would treat this measurement as belonging to something else'}.`),
        step('Compute the Kalman gain', Q`K=P^-H^TS^{-1}=\frac{1}{${N(m.S)}}\begin{bmatrix}${N(m.Pp[0])}\\${N(m.Pp[1])}\end{bmatrix}=${col(m.K)}`, 'The gain is the regression coefficient of the state on the measurement, Σ_ab Σ_bb⁻¹ in the conditioning rule. Its second entry is nonzero only because P⁻ couples position and velocity.'),
        step('Update: condition on the measurement', Q`x=x^-+Ky=${col(m.xp)}+${N(m.y)}${col(m.K)}=${col(m.x)},\qquad P=P^--KSK^T=${mat(P)}`, `The position moves ${N(m.K[0] * 100, 1)}% of the way to the measurement and the velocity changes by ${N(m.K[1] * m.y)}, although it was never measured. P = P⁻ − KSKᵀ equals (I − KH)P⁻ and is smaller than P⁻ in every direction.`),
      ],
      values: [['Predicted position', m.xp[0]], ['Predicted P11', m.Pp[0]], ['Predicted P12', m.Pp[1]], ['Innovation', m.y], ['Innovation variance S', m.S], ['Gain for position', m.K[0]], ['Gain for velocity', m.K[1]], ['Updated position', m.x[0]], ['Updated velocity', m.x[1]], ['Updated P11', m.P[0]], ['Updated P12', m.P[1]], ['Updated P22', m.P[2]], ['Gate distance d2', m.d2]],
      note: 'Raise R: the gain falls and the update barely moves. Raise q: the prediction is less trusted, so the gain rises. Set z = 5 with R = 1: d² = 16/3 is outside the 95% gate, so a tracker would not use this measurement for this track.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 3) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.join(', ')})`;
  const paren = v => Number(v) < 0 ? `(${v})` : `${v}`;
  const perms3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const practice = [
    {key: 'gaussian-affine', skill: 'Transform a Gaussian vector by a matrix', make(r) {
      let A;
      do { A = [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]]; } while (A[0][0] * A[1][1] - A[0][1] * A[1][0] === 0);
      const mu = [r.int(-2, 3), r.int(-2, 3)], s = [r.pick([1, 2, 4]), r.pick([1, 2, 4, 9])], b = [r.int(-3, 3), r.int(-3, 3)];
      const m = [A[0][0] * mu[0] + A[0][1] * mu[1] + b[0], A[1][0] * mu[0] + A[1][1] * mu[1] + b[1]];
      const C = [A[0][0] ** 2 * s[0] + A[0][1] ** 2 * s[1], A[0][0] * A[1][0] * s[0] + A[0][1] * A[1][1] * s[1], A[1][0] ** 2 * s[0] + A[1][1] ** 2 * s[1]];
      return {prompt: Q`Let \(x\sim\mathcal N\big(${tup(mu)},\ \operatorname{diag}(${s[0]}, ${s[1]})\big)\) and \(y=Ax+b\) with \(A=${mat(A)}\) and \(b=${tup(b)}\). Give the mean of y and the entries \((C_{11}, C_{12}, C_{22})\) of its covariance \(C=A\Sigma A^T\).`,
        answers: [{label: 'Mean of y', vector: m, tol: 0}, {label: Q`\((C_{11}, C_{12}, C_{22})\)`, vector: C, tol: 0}],
        hint: Q`The mean is \(A\mu+b\). With a diagonal Σ, \(C_{11}=a_{11}^2\sigma_1^2+a_{12}^2\sigma_2^2\), \(C_{12}=a_{11}a_{21}\sigma_1^2+a_{12}a_{22}\sigma_2^2\) and \(C_{22}=a_{21}^2\sigma_1^2+a_{22}^2\sigma_2^2\). The shift b does not change the covariance.`,
        solution: Q`Mean \(A\mu+b=${tup(m)}\). \(C_{11}=${paren(A[0][0])}^2\cdot${s[0]}+${paren(A[0][1])}^2\cdot${s[1]}=${C[0]}\), \(C_{12}=${paren(A[0][0])}\cdot${paren(A[1][0])}\cdot${s[0]}+${paren(A[0][1])}\cdot${paren(A[1][1])}\cdot${s[1]}=${C[1]}\), \(C_{22}=${paren(A[1][0])}^2\cdot${s[0]}+${paren(A[1][1])}^2\cdot${s[1]}=${C[2]}\). ${C[1] ? 'The off-diagonal entry shows that the two outputs are correlated although the inputs were not.' : 'The outputs happen to stay uncorrelated.'}`};
    }},
    {key: 'gaussian-condition', skill: 'Condition a two-dimensional Gaussian on one coordinate', make(r) {
      const sbb = r.pick([1, 2, 4]), sab = r.pick([-2, -1, 1, 2, 3]) * (sbb === 1 ? .5 : 1), saa = Math.ceil(sab * sab / sbb) + r.int(1, 4), ma = r.int(-3, 3), mb = r.int(-3, 3), xb = mb + r.nonzero(-3, 3);
      const m = ma + sab / sbb * (xb - mb), v = saa - sab * sab / sbb;
      return {prompt: Q`\((a,b)\) is Gaussian with means \((${ma}, ${mb})\), \(\operatorname{Var}(a)=${saa}\), \(\operatorname{Var}(b)=${sbb}\) and \(\operatorname{Cov}(a,b)=${sab}\). You observe \(b=${xb}\). What are the conditional mean and variance of a?`,
        answers: [{label: Q`\(\mu_{a|b}\)`, value: m, tol: .01}, {label: Q`\(\sigma^2_{a|b}\)`, value: v, tol: .01}],
        hint: Q`\(\mu_{a|b}=\mu_a+\frac{\Sigma_{ab}}{\Sigma_{bb}}(x_b-\mu_b)\) and \(\sigma^2_{a|b}=\Sigma_{aa}-\frac{\Sigma_{ab}^2}{\Sigma_{bb}}\).`,
        solution: Q`\(\mu_{a|b}=${ma}+\frac{${sab}}{${sbb}}\cdot(${xb}-${paren(mb)})=${dec(m)}\) and \(\sigma^2_{a|b}=${saa}-\frac{${paren(sab)}^2}{${sbb}}=${dec(v)}\). The variance shrinks by the same amount whatever value of b was observed; only the mean depends on it.`};
    }},
    {key: 'kalman-scalar', skill: 'Run one scalar Kalman predict and update', make(r) {
      const m = r.int(-5, 10), P = r.pick([1, 2, 3, 4]), Qn = r.pick([0, .5, 1, 2]), R = r.pick([.5, 1, 2, 4]), z = m + r.nonzero(-4, 4);
      const Pp = P + Qn, K = Pp / (Pp + R), xn = m + K * (z - m), Pn = (1 - K) * Pp;
      return {prompt: Q`A random-walk model \(x_k=x_{k-1}+w\) has \(\operatorname{Var}(w)=Q=${Qn}\). The current estimate is \(x=${m}\) with variance \(P=${P}\). A measurement \(z=${z}\) of x arrives with noise variance \(R=${R}\). Find the gain K, the updated estimate and its variance.`,
        answers: [{label: 'K', value: K, tol: .006}, {label: 'Updated x', value: xn, tol: .01}, {label: 'Updated P', value: Pn, tol: .01}],
        hint: Q`Predict: the mean stays, \(P^-=P+Q\). Update: \(K=P^-/(P^-+R)\), \(x=x^-+K(z-x^-)\), \(P=(1-K)P^-\).`,
        solution: Q`\(P^-=${P}+${Qn}=${dec(Pp)}\), \(K=${dec(Pp)}/(${dec(Pp)}+${R})=${dec(K, 4)}\), \(x=${m}+${dec(K, 4)}\cdot(${z}-${paren(m)})=${dec(xn)}\) and \(P=(1-${dec(K, 4)})\cdot${dec(Pp)}=${dec(Pn)}\). Check: \(1/P=1/${dec(Pp)}+1/${R}\), the precisions add.`};
    }},
    {key: 'kalman-predict', skill: 'Predict a constant-velocity state and its covariance', make(r) {
      const dt = r.pick([1, 2]), x = [r.int(-5, 10), r.int(-3, 3)], q = r.pick([0, 0, 1]);
      let a, b, c;
      do { a = r.pick([1, 2, 4]); b = r.pick([1, 2, 4]); c = r.pick([0, 0, 1, -1]); } while (c * c >= a * b);
      const xp = [x[0] + dt * x[1], x[1]], P11 = a + 2 * dt * c + dt * dt * b + q * dt ** 4 / 4, P12 = c + dt * b + q * dt ** 3 / 2, P22 = b + q * dt * dt;
      return {prompt: Q`A state \(x=(p,v)=${tup(x)}\) has covariance \(P=${mat([[a, c], [c, b]])}\). Predict ${dt} time step${dt === 1 ? '' : 's'} ahead with \(F=${mat([[1, dt], [0, 1]])}\)${q ? Q` and process noise \(Q=\begin{bmatrix}${dec(dt ** 4 / 4)}&${dec(dt ** 3 / 2)}\\${dec(dt ** 3 / 2)}&${dt * dt}\end{bmatrix}\)` : ' and no process noise'}. Give \(x^-\) and the entries \((P^-_{11}, P^-_{12}, P^-_{22})\).`,
        answers: [{label: Q`\(x^-\)`, vector: xp, tol: 0}, {label: Q`\((P^-_{11}, P^-_{12}, P^-_{22})\)`, vector: [P11, P12, P22], tol: .01}],
        hint: Q`\(x^-=Fx\). For \(F=\begin{bmatrix}1&\Delta t\\0&1\end{bmatrix}\): \(P^-_{11}=P_{11}+2\Delta t\,P_{12}+\Delta t^2P_{22}\), \(P^-_{12}=P_{12}+\Delta t\,P_{22}\), \(P^-_{22}=P_{22}\); then add Q.`,
        solution: Q`\(x^-=(${x[0]}+${dt}\cdot${paren(x[1])},\ ${x[1]})=${tup(xp)}\). \(FPF^T\): \(P_{11}=${a}+2\cdot${dt}\cdot${paren(c)}+${dt * dt}\cdot${b}=${a + 2 * dt * c + dt * dt * b}\), \(P_{12}=${c}+${dt}\cdot${b}=${c + dt * b}\), \(P_{22}=${b}\)${q ? Q`; adding Q gives \(${tup([dec(P11), dec(P12), dec(P22)])}\)` : ''}. Position uncertainty grows fastest, because errors in velocity accumulate.`};
    }},
    {key: 'innovation-gate', skill: 'Gate a measurement with its Mahalanobis distance', make(r) {
      const k = r.pick([1, 2]), gate = k === 1 ? 3.84 : 5.99;
      let pred, z, S, d2;
      do {
        pred = Array.from({length: k}, () => r.int(20, 200)); S = Array.from({length: k}, () => r.pick([4, 9, 16, 25])); z = pred.map((p, i) => p + r.int(-3, 3) * Math.sqrt(S[i]) / 2 * r.pick([1, 2]));
        d2 = z.reduce((t, v, i) => t + (v - pred[i]) ** 2 / S[i], 0);
      } while (Math.abs(d2 - gate) < .1);
      const inside = d2 < gate;
      return {prompt: Q`A track predicts the measurement \(Hx^-=${tup(pred)}\) with innovation covariance \(S=${k === 1 ? S[0] : Q`\operatorname{diag}(${S.join(', ')})`}\). A detection arrives at \(z=${tup(z)}\). Compute \(d^2=y^TS^{-1}y\) and decide whether it passes the 95% gate, \(d^2<${gate}\).`,
        answers: [{label: Q`\(d^2\)`, value: d2, tol: .01}, {label: 'Gate', choices: ['Inside the gate: use it for this track', 'Outside the gate: do not use it for this track'], correct: inside ? 0 : 1}],
        hint: Q`\(y=z-Hx^-\). With a diagonal S, \(d^2=\sum_iy_i^2/S_{ii}\).`,
        solution: Q`\(y=${tup(z.map((v, i) => dec(v - pred[i])))}\), so \(d^2=${z.map((v, i) => Q`${paren(dec(v - pred[i]))}^2/${S[i]}`).join('+')}=${dec(d2)}\), ${inside ? 'below' : 'above'} ${gate}. ${k === 1 ? 'For one dimension the gate is |y| < 1.96√S.' : 'In two dimensions the gate is an ellipse; 5.99 is the 95% point of the chi-squared distribution with 2 degrees of freedom.'}`};
    }},
    {key: 'assignment', skill: 'Compare greedy and optimal track–detection assignment', make(r) {
      let C, best, second, gt, gp;
      do {
        const vals = r.shuffle([.1, .2, .3, .4, .5, .6, .7, .8, .9]);
        C = [vals.slice(0, 3), vals.slice(3, 6), vals.slice(6, 9)];
        const tot = perms3.map(p => [p, p.reduce((t, j, i) => t + C[i][j], 0)]).sort((a, b) => a[1] - b[1]);
        [best, second] = tot;
        const rows = new Set(), cols = new Set(); gt = 0; gp = [];
        [...Array(9).keys()].map(k => [C[Math.floor(k / 3)][k % 3], Math.floor(k / 3), k % 3]).sort((a, b) => a[0] - b[0]).forEach(([v, i, j]) => { if (!rows.has(i) && !cols.has(j)) { rows.add(i); cols.add(j); gt += v; gp[i] = j; } });
      } while (second[1] - best[1] < .05);
      return {prompt: Q`Costs between tracks (rows) and detections (columns) are \(${mat(C)}\). Each track takes exactly one detection. Find the total cost of greedy matching (repeatedly take the smallest remaining entry), the optimal total, and the optimal detection (1, 2 or 3) for tracks 1, 2 and 3.`,
        answers: [{label: 'Greedy total', value: gt, tol: .01}, {label: 'Optimal total', value: best[1], tol: .01}, {label: 'Optimal detections for tracks 1–3', vector: best[0].map(j => j + 1), tol: 0}],
        hint: 'For greedy, cross out the row and column of each chosen entry. For the optimum, either list all 6 ways to pair three tracks with three detections, or reduce rows and columns by their minima as in the Hungarian algorithm.',
        solution: Q`Greedy: ${gp.map((j, i) => [C[i][j], i, j]).sort((a, b) => a[0] - b[0]).map(([v, i, j]) => `T${i + 1}–D${j + 1} (${dec(v)})`).join(', ')}, total ${dec(gt)}. Optimal: ${best[0].map((j, i) => `T${i + 1}–D${j + 1} (${dec(C[i][j])})`).join(', ')}, total ${dec(best[1])}${Math.abs(gt - best[1]) < 1e-9 ? ': here greedy happens to be optimal' : `, which is ${dec(gt - best[1])} better than greedy`}.`};
    }},
  ];

  /* ---------- Lab: tracking boxes across the coffee photo ---------- */
  const T_FRAMES = 60, MAX_MISS = 3, CONFIRM = 3, BIG = 1e6, ACC = .08;
  const OBJECTS = [{x: 22, y: 50, vx: 3.25, vy: .45, w: 34, h: 26}, {x: 218, y: 84, vx: -3.1, vy: -.35, w: 34, h: 26}, {x: 30, y: 132, vx: 3, vy: -1.55, w: 28, h: 28}];
  const TRACK_COLOURS = ['#e8743b', '#3fae6a', '#7fb8df', '#e0b13a', '#c678dd', '#ef6f8a', '#56c2b6', '#f2f2f2'];
  // Ground truth and detections depend only on the scene sliders, so every tracker setting sees the same data.
  function scene(s) {
    const g = window.CV_VISION.rng(4000 + s.seed), gt = [], dets = [];
    const obj = OBJECTS.map(o => ({...o}));
    for (let t = 0; t < T_FRAMES; t++) {
      gt.push(obj.map(o => [o.x, o.y]));
      const d = [];
      obj.forEach((o, k) => { const u = g.next(), nx = g.gauss(), ny = g.gauss(); if (u < s.pd) d.push({z: [o.x + s.sigma * nx, o.y + s.sigma * ny], obj: k}); });
      for (let c = 0; c < 3; c++) { const u = g.next(), px = g.next(), py = g.next(); if (u < s.clutter / 3) d.push({z: [10 + 220 * px, 10 + 140 * py], obj: -1}); }
      dets.push(d.sort((a, b) => a.z[0] - b.z[0]));   // a detector reports no identities, only positions
      obj.forEach(o => { o.vx += ACC * g.gauss(); o.vy += ACC * g.gauss(); o.x += o.vx; o.y += o.vy; });
    }
    return {gt, dets};
  }
  // Optimal assignment for a rectangular cost matrix (rows ≤ columns after transposing), Kuhn–Munkres with potentials.
  function hungarian(C) {
    const n = C.length, m = n ? C[0].length : 0;
    if (!n || !m) return new Array(n).fill(-1);
    if (n > m) { const t = hungarian(C[0].map((_, j) => C.map(row => row[j]))), out = new Array(n).fill(-1); t.forEach((i, j) => { if (i >= 0) out[i] = j; }); return out; }
    const INF = 1e18, u = new Array(n + 1).fill(0), v = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      p[0] = i; let j0 = 0;
      const minv = new Array(m + 1).fill(INF), used = new Array(m + 1).fill(false);
      do {
        used[j0] = true; const i0 = p[j0]; let delta = INF, j1 = 0;
        for (let j = 1; j <= m; j++) if (!used[j]) {
          const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
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
  function greedy(C) {
    const n = C.length, m = n ? C[0].length : 0, pairs = [], out = new Array(n).fill(-1), taken = new Set();
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) pairs.push([C[i][j], i, j]);
    pairs.sort((a, b) => a[0] - b[0]).forEach(([c, i, j]) => { if (out[i] < 0 && !taken.has(j)) { out[i] = j; taken.add(j); } });
    return out;
  }
  // Constant-velocity Kalman filter on (x, y, vx, vy) with white-acceleration noise, run over the whole sequence.
  function track(data, s, method) {
    const q = s.q, R = s.sigmaR * s.sigmaR, gate = Number(s.gate), frames = [];
    const Qm = [[q / 4, 0, q / 2, 0], [0, q / 4, 0, q / 2], [q / 2, 0, q, 0], [0, q / 2, 0, q]];
    let tracks = [], nextId = 1;
    const confirmedIds = new Set();
    for (let t = 0; t < T_FRAMES; t++) {
      const D = data.dets[t];
      tracks.forEach(tr => {
        const [x, y, vx, vy] = tr.x, P = tr.P;
        tr.x = [x + vx, y + vy, vx, vy];
        // P⁻ = F P Fᵀ + Q with F = [[I, I], [0, I]] in 2 × 2 blocks.
        const A = (i, j) => P[i][j] + P[i + 2][j] + P[i][j + 2] + P[i + 2][j + 2], Bm = (i, j) => P[i][j + 2] + P[i + 2][j + 2], Cm = (i, j) => P[i + 2][j + 2];
        const Np = [[A(0, 0), A(0, 1), Bm(0, 0), Bm(0, 1)], [A(1, 0), A(1, 1), Bm(1, 0), Bm(1, 1)], [Bm(0, 0), Bm(1, 0), Cm(0, 0), Cm(0, 1)], [Bm(0, 1), Bm(1, 1), Cm(1, 0), Cm(1, 1)]];
        tr.P = Np.map((row, i) => row.map((v, j) => v + Qm[i][j]));
        tr.S = [tr.P[0][0] + R, tr.P[0][1], tr.P[1][1] + R];
        tr.pred = [tr.x[0], tr.x[1]];
      });
      const d2 = (tr, z) => { const [a, b, c] = tr.S, det = a * c - b * b, dx = z[0] - tr.pred[0], dy = z[1] - tr.pred[1]; return (c * dx * dx - 2 * b * dx * dy + a * dy * dy) / det; };
      const cost = tracks.map(tr => D.map(d => d2(tr, d.z)));
      const gated = cost.map(row => row.map(c => c < gate ? c : BIG));
      const pick = method === 'greedy' ? greedy(gated) : hungarian(gated);
      const assigned = new Set(), matches = [];
      tracks.forEach((tr, i) => {
        const j = pick[i];
        if (j >= 0 && gated[i][j] < BIG) {
          const z = D[j].z, [a, b, c] = tr.S, det = a * c - b * b, Si = [[c / det, -b / det], [-b / det, a / det]], y = [z[0] - tr.pred[0], z[1] - tr.pred[1]], P = tr.P;
          const K = P.map(row => [row[0] * Si[0][0] + row[1] * Si[1][0], row[0] * Si[0][1] + row[1] * Si[1][1]]);
          tr.x = tr.x.map((v, r) => v + K[r][0] * y[0] + K[r][1] * y[1]);
          // P = (I − KH)P⁻, then symmetrised.
          const Pn = P.map((row, r) => row.map((v, cIdx) => v - K[r][0] * P[0][cIdx] - K[r][1] * P[1][cIdx]));
          tr.P = Pn.map((row, r) => row.map((v, cIdx) => (v + Pn[cIdx][r]) / 2));
          tr.hits++; tr.miss = 0; assigned.add(j); matches.push([tr.id, j, cost[i][j]]);
          if (tr.hits === CONFIRM) confirmedIds.add(tr.id);
        } else tr.miss++;
        tr.trail.push([tr.x[0], tr.x[1], t]);
      });
      const snapshot = {tracks: tracks.map(tr => ({id: tr.id, x: tr.x.slice(), P: tr.P.map(r => r.slice()), S: tr.S, pred: tr.pred, hits: tr.hits, miss: tr.miss, trail: tr.trail.slice(-20), colour: tr.colour})), cost, ids: tracks.map(tr => tr.id), matches};
      // Tentative tracks (fewer than 3 hits) die at their first miss; confirmed ones after MAX_MISS misses in a row.
      const gatedBy = D.map((_, j) => cost.some(row => row[j] < gate)), inGate = j => gatedBy[j];
      tracks = tracks.filter(tr => tr.hits >= CONFIRM ? tr.miss <= MAX_MISS : tr.miss === 0);
      // A new track starts from a detection that no track took and that lies outside every gate.
      D.forEach((d, j) => { if (!assigned.has(j) && !inGate(j)) { const id = nextId++; tracks.push({id, x: [d.z[0], d.z[1], 0, 0], P: [[R, 0, 0, 0], [0, R, 0, 0], [0, 0, 16, 0], [0, 0, 0, 16]], hits: 1, miss: 0, trail: [[d.z[0], d.z[1], t]], colour: TRACK_COLOURS[(id - 1) % TRACK_COLOURS.length], born: t}); } });
      frames.push(snapshot);
    }
    // ID switches, as in the CLEAR-MOT metrics: match objects one-to-one to confirmed tracks within 12 px (Hungarian on
    // distance) and count a switch whenever an object's matched track differs from the one it had before.
    const last = OBJECTS.map(() => null), switchesAt = [];
    let sw = 0, errSum = 0, errN = 0;
    frames.forEach((f, t) => {
      const live = f.tracks.filter(tr => tr.hits >= CONFIRM && tr.miss === 0), gt = data.gt[t];
      const dist = gt.map(p => live.map(tr => Math.hypot(tr.x[0] - p[0], tr.x[1] - p[1]))), pick = hungarian(dist.map(row => row.map(d => d <= 12 ? d : BIG)));
      gt.forEach((p, k) => {
        const j = pick[k];
        if (j < 0 || dist[k][j] > 12) return;
        const id = live[j].id;
        if (last[k] !== null && last[k] !== id) sw++;
        last[k] = id; errSum += dist[k][j]; errN++;
      });
      switchesAt.push(sw);
    });
    return {frames, switchesAt, created: nextId - 1, confirmed: confirmedIds.size, meanErr: errN ? errSum / errN : NaN};
  }
  const lab = {
    name: 'tracking', title: 'Kalman tracking and data association', photo: 'coffee',
    heading: 'Three boxes, noisy detections. Keep their identities.',
    intro: 'Three objects move across the photo. Each frame a detector reports their centres with noise, sometimes misses one, and adds false detections. Each track runs a constant-velocity Kalman filter on (x, y, vₓ, v_y); detections are assigned to tracks by their gated Mahalanobis distance d², greedily or optimally with the Hungarian algorithm.',
    defaults: {t: 31, method: 'hungarian', q: .5, sigmaR: 4, sigma: 4, pd: .85, clutter: 1, gate: '9.21', seed: 2},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return range('t', 'Frame', 0, T_FRAMES - 1, 1, s.t) + select('method', 'Assignment', [['hungarian', 'Hungarian (optimal total cost)'], ['greedy', 'Greedy (smallest cost first)']], s.method) +
        select('gate', 'Gate on d² (2 dimensions)', [['5.99', '95%: d² < 5.99'], ['9.21', '99%: d² < 9.21'], ['13.8', '99.9%: d² < 13.8'], ['1000000', 'No gate']], s.gate) +
        range('q', 'Process noise q (random acceleration)', 0, 2, .05, s.q) + range('sigmaR', 'Filter’s assumed detection noise σ_R (px)', .5, 10, .5, s.sigmaR) +
        range('sigma', 'True detection noise σ (px)', 0, 10, .5, s.sigma) + range('pd', 'Detection probability', .5, 1, .05, s.pd) + range('clutter', 'False detections per frame', 0, 3, .25, s.clutter) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New run ↻</button></div>' +
        '<div class="math-rule">x⁻ = Fx, P⁻ = FPFᵀ + Q;  S = HP⁻Hᵀ + R, K = P⁻HᵀS⁻¹;  gate yᵀS⁻¹y &lt; γ</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `${figure('tk-scene', 'Tracks on the photo')}<div id="tk-table"></div>`;
    },
    note: 'Predict first: around frames 29 to 36 the three boxes meet near the middle of the photo. Will greedy or Hungarian matching keep their identities? Step through those frames with each. Greedy grabs the single closest pair first and can leave another track with a poor choice, while Hungarian minimises the total; the summary counts the ID switches of both over all 60 frames, and New run draws another scene. Remove the gate and watch both methods force absurd matches onto false detections. Then lower q to 0: the filter trusts constant velocity, the gates (dashed) shrink and a turning object escapes its own gate. Set σ_R far below the true σ and good detections fall outside their gates; set it far above and false detections get accepted.',
    async setup() { const img = await window.CV_VISION.load('coffee'); return {img}; },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt, E} = V, {img} = data, w = img.w, h = img.h, t = Math.max(0, Math.min(T_FRAMES - 1, Number(s.t)));
      const sc = scene({seed: s.seed, pd: Number(s.pd), sigma: Number(s.sigma), clutter: Number(s.clutter)});
      const cfg = {q: Number(s.q), sigmaR: Number(s.sigmaR), gate: Number(s.gate)}, run = track(sc, cfg, s.method), other = track(sc, cfg, s.method === 'greedy' ? 'hungarian' : 'greedy');
      const f = run.frames[t], gamma = Number(s.gate);
      // Dimmed photo.
      const rgba = new Uint8ClampedArray(img.rgba);
      for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) rgba[4 * i + c] = 40 + .45 * rgba[4 * i + c];
      const canvas = root.querySelector('#tk-scene'), ctx = V.showRGBA(canvas, rgba, w, h).getContext('2d');
      // Ground-truth paths so far and the true boxes now.
      OBJECTS.forEach((o, k) => {
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath();
        for (let u = 0; u <= t; u++) { const [x, y] = sc.gt[u][k]; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.setLineDash([]);
        const [x, y] = sc.gt[t][k]; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.strokeRect(x - o.w / 2, y - o.h / 2, o.w, o.h);
      });
      // Tracks: trail, gate ellipse (from S), covariance ellipse (position block of P), and the assignment.
      const ell = (mx, my, a, b, c, k) => { const pts = ellipse(mx, my, a, b, c, k, 40); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); };
      const matchOf = new Map(f.matches.map(([id, j, c]) => [id, [j, c]]));
      f.tracks.forEach(tr => {
        const confirmed = tr.hits >= CONFIRM, m = matchOf.get(tr.id);
        ctx.strokeStyle = tr.colour; ctx.fillStyle = tr.colour;
        if (confirmed) {
          ctx.lineWidth = 1.5; ctx.beginPath(); tr.trail.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
          ctx.setLineDash([3, 3]); ctx.lineWidth = 1; if (gamma < 1e5) ell(tr.pred[0], tr.pred[1], tr.S[0], tr.S[1], tr.S[2], Math.sqrt(gamma)); ctx.setLineDash([]);
          ctx.lineWidth = 2; ell(tr.x[0], tr.x[1], tr.P[0][0], tr.P[0][1], tr.P[1][1], 2);
        }
        if (m) { const z = sc.dets[t][m[0]].z; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tr.pred[0], tr.pred[1]); ctx.lineTo(z[0], z[1]); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(tr.x[0], tr.x[1], confirmed ? 3.5 : 2.5, 0, 2 * Math.PI); confirmed ? ctx.fill() : ctx.stroke();
        ctx.font = `${confirmed ? 'bold ' : ''}10px Segoe UI, Arial`; ctx.fillText(confirmed ? String(tr.id) : `${tr.id}?`, tr.x[0] + 5, tr.x[1] - 5);
      });
      // Detections: + for real ones, × for false ones (only the viewer knows which is which).
      sc.dets[t].forEach(d => {
        const [x, y] = d.z; ctx.strokeStyle = d.obj >= 0 ? '#ffffff' : '#ff6fd8'; ctx.lineWidth = 1.6; ctx.beginPath();
        if (d.obj >= 0) { ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); } else { ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 3, y - 3); }
        ctx.stroke();
      });
      const cap = `Frame ${t}: white boxes are the true objects, + their detections and pink × false detections. Each coloured track shows its recent path, its 2σ position ellipse (solid), its gate d² < ${gamma < 1e5 ? fmt(gamma, 2) : '∞'} around the prediction (dashed) and a line to the detection it was given; hollow tracks marked ? are tentative (fewer than ${CONFIRM} hits).`;
      canvas.nextElementSibling.textContent = cap; canvas.setAttribute('aria-label', cap);
      // The cost matrix of this frame.
      const D = sc.dets[t], picked = new Map(f.matches.map(([id, j]) => [id, j]));
      root.querySelector('#tk-table').innerHTML = f.ids.length && D.length ? `<div style="overflow-x:auto"><table class="vk-table"><thead><tr><th>d² (track × detection)</th>${D.map((d, j) => `<th>D${j + 1}${d.obj < 0 ? ' (false)' : ''}</th>`).join('')}</tr></thead><tbody>${f.ids.map((id, i) => `<tr><td style="color:${E(f.tracks[i].colour)}"><strong>Track ${id}</strong></td>${D.map((_, j) => { const c = f.cost[i][j], chosen = picked.get(id) === j; return `<td>${chosen ? '<strong>' : ''}${c < gamma ? fmt(c, 2) : `<span class="muted">${c > 999 ? '&gt;999' : fmt(c, 1)}</span>`}${chosen ? ' ✓</strong>' : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">Grey entries are outside the gate and cannot be assigned. ✓ marks the ${s.method === 'greedy' ? 'greedy' : 'Hungarian'} choice; unassigned detections start new tracks.</p>` : '<p class="small muted">No tracks or no detections in this frame.</p>';
      const sw = run.switchesAt, swOther = other.switchesAt[T_FRAMES - 1];
      return V.report([
        ['ID switches so far', `${sw[t]} by frame ${t}; ${sw[T_FRAMES - 1]} over all ${T_FRAMES} frames`],
        [`${s.method === 'greedy' ? 'Hungarian' : 'Greedy'} on the same data`, `${swOther} ID switches over ${T_FRAMES} frames`],
        ['Tracks confirmed (3 objects)', `${run.confirmed} reached ${CONFIRM} hits; ${run.created - run.confirmed} tentative tracks, mostly from false detections, died at a miss`],
        ['Mean position error of confirmed tracks', Number.isFinite(run.meanErr) ? `${fmt(run.meanErr, 2)} px (true detection noise σ = ${fmt(Number(s.sigma), 1)} px)` : '—'],
        ['This frame', `${f.matches.length} of ${D.length} detections assigned to ${f.ids.length} tracks`],
      ]);
    },
    action(name, s) { if (name === 'reseed') s.seed++; },
  };

  window.CV_EXTEND.lesson(60, {
    teaching: {
      equation: Q`\begin{gathered}Ax+b\sim\mathcal N(A\mu+b,\ A\Sigma A^T),\qquad x^-=Fx,\quad P^-=FPF^T+Q\\ S=HP^-H^T+R,\quad K=P^-H^TS^{-1},\quad x=x^-+K(z-Hx^-),\quad P=(I-KH)P^-\end{gathered}`,
      symbols: [['μ, Σ', 'mean vector and covariance matrix'], ['F, Q', 'motion model and process noise'], ['H, R', 'measurement model and measurement noise'], ['P⁻, P', 'covariance before and after the update'], ['S', 'innovation covariance'], ['K', 'Kalman gain'], ['d²', 'squared Mahalanobis distance']],
      connection: 'SORT, DeepSORT and ByteTrack track objects with exactly this filter and a Hungarian assignment; visual-inertial odometry and SLAM run extended Kalman filters on camera poses. The same Gaussian rules return in diffusion models (conditioning), Gaussian splatting (JΣJᵀ) and DETR (Hungarian matching).',
      trap: 'Matching greedily, nearest first. One locally best pair can force another track into a much worse match; the Hungarian algorithm minimises the total cost over all tracks at once, and the gate should forbid implausible pairs before matching, not after.',
      question: 'A Kalman filter tracks position and velocity but only measures position. After an update with a measurement ahead of the prediction, what happens to the velocity estimate?',
      choices: ['It increases, because the predicted covariance links position and velocity', 'It stays the same, because velocity was not measured', 'It is reset to zero'], correct: 0,
      explanation: 'After a prediction step P⁻ has a positive position–velocity covariance, so the gain K = P⁻HᵀS⁻¹ has a nonzero velocity entry. A measurement ahead of the prediction means the object is faster than thought, and conditioning raises the velocity.',
    },
    guide: {
      title: 'Predict with a linear map, correct by conditioning, then decide who is who',
      paragraphs: [
        'A Gaussian stays Gaussian under linear maps: Ax + b has mean Aμ + b and covariance AΣAᵀ. That is the Kalman prediction, plus the covariance Q of the random motion. Conditioning a joint Gaussian on an observed part gives another Gaussian, and applied to the state and the measurement it is the Kalman update: the gain K weighs the innovation by how uncertain the prediction is compared with the sensor.',
        'With many objects, each detection must be given to one track. The innovation covariance S defines a gate, d² = yᵀS⁻¹y below a chi-squared threshold, and the remaining costs form an assignment problem that the Hungarian algorithm solves optimally.',
      ],
      example: 'One Kalman step for position and velocity, measuring position only',
      controls: [{label: 'Measured position z', min: -1, max: 5, step: .5, value: 2}, {label: 'Measurement variance R', min: .25, max: 4, step: .25, value: 1}, {label: 'Process noise q (random acceleration)', min: 0, max: 1, step: .25, value: 0}],
      predict: 'Only the position is measured. If z is ahead of the predicted position, will the velocity estimate rise, fall or stay at 1?',
      takeaway: 'The prediction spreads and tilts the uncertainty, so position and velocity become correlated. Conditioning on a position measurement then moves both: the velocity is corrected through the covariance even though it is never observed.',
      notation: 'x = (p, v) is position and velocity, F = [[1, 1], [0, 1]] moves the position by the velocity, H = [1 0] measures the position, R is the measurement variance and Q = q[[1/4, 1/2], [1/2, 1]] the effect of a random acceleration. y = z − Hx⁻ is the innovation, S its variance and K the gain.',
    },
    notation: {
      'μ, Σ': {tex: Q`\mu,\ \Sigma`, detail: 'The mean vector and covariance matrix of a multivariate Gaussian. Σ is symmetric and positive semidefinite; its eigenvectors and eigenvalues give the axes and squared half-lengths of the 1σ ellipse.'},
      'F, Q': {tex: Q`F,\ Q`, detail: 'The motion model x_k = Fx_{k−1} + w and the covariance Q of the process noise w. For constant velocity, F adds the velocity times the time step to the position; Q says how much the motion can deviate from that.'},
      'H, R': {tex: Q`H,\ R`, detail: 'The measurement model z = Hx + r and the covariance R of the measurement noise r. H = [1 0] measures position only. In an extended Kalman filter H is the Jacobian of a nonlinear h(x).'},
      'P⁻, P': {tex: Q`P^-,\ P`, detail: 'The covariance of the state after the prediction (P⁻ = FPFᵀ + Q) and after the measurement update (P = (I − KH)P⁻). The update never increases uncertainty.'},
      S: {tex: 'S', detail: 'The innovation covariance HP⁻Hᵀ + R: the covariance the surprise y = z − Hx⁻ should have if the model is right. It sets the gate and the gain.'},
      K: {tex: 'K', detail: 'The Kalman gain P⁻HᵀS⁻¹, the coefficient of the Gaussian conditioning rule. It is near 1 when the sensor is much more precise than the prediction and near 0 when it is much less precise.'},
      'd²': {tex: Q`d^2`, detail: 'The squared Mahalanobis distance yᵀS⁻¹y of an innovation. For a correct k-dimensional measurement it follows a chi-squared distribution with k degrees of freedom, so 95% fall below 3.84 (k = 1) or 5.99 (k = 2).'},
    },
    calculate, practice, lab,
  });
})();
