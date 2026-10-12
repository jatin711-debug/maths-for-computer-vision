/* Lesson 63: rotations as a manifold, point-set alignment and bundle adjustment. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const vec = (v, d = 3) => `(${v.map(x => N(x, d)).join(', ')})`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${extra}>${E(s)}</text>`;
  const z0 = v => v + 0;

  /* ---------- 2D helpers (matrices are arrays of rows) ---------- */
  const rot = a => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
  const mul2 = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  const tr2 = A => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
  const app = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
  const det2 = A => A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const angleOf = A => deg(Math.atan2(A[1][0] - A[0][1], A[0][0] + A[1][1]));
  // SVD of a 2 × 2 matrix, A = U diag(S) Vᵀ, from the eigenvectors of AᵀA. Matching columns of U and V may both flip sign.
  function svd2(A) {
    const [[a, b], [c, d]] = A, g11 = a * a + c * c, g12 = a * b + c * d, g22 = b * b + d * d;
    const half = (g11 + g22) / 2, disc = Math.sqrt(Math.max(0, half * half - (g11 * g22 - g12 * g12))), l1 = half + disc, l2 = Math.max(0, half - disc);
    let v1 = Math.abs(g12) > 1e-12 ? [g12, l1 - g11] : g11 >= g22 ? [1, 0] : [0, 1];
    const nv = Math.hypot(v1[0], v1[1]); v1 = [v1[0] / nv, v1[1] / nv];
    const v2 = [-v1[1], v1[0]], s1 = Math.sqrt(l1), s2 = Math.sqrt(l2);
    const u1 = s1 > 1e-12 ? app(A, v1).map(x => x / s1) : [1, 0], u2 = s2 > 1e-12 ? app(A, v2).map(x => x / s2) : [-u1[1], u1[0]];
    return {U: [[u1[0], u2[0]], [u1[1], u2[1]]], S: [s1, s2], V: [[v1[0], v2[0]], [v1[1], v2[1]]]};
  }
  // Kabsch in 2D: the rotation and translation that best map the points P onto the points T.
  function kabsch(P, T) {
    const n = P.length, pb = [0, 1].map(k => P.reduce((s, p) => s + p[k], 0) / n), qb = [0, 1].map(k => T.reduce((s, q) => s + q[k], 0) / n);
    const H = [[0, 0], [0, 0]];
    P.forEach((p, i) => { const a = [p[0] - pb[0], p[1] - pb[1]], b = [T[i][0] - qb[0], T[i][1] - qb[1]]; H[0][0] += a[0] * b[0]; H[0][1] += a[0] * b[1]; H[1][0] += a[1] * b[0]; H[1][1] += a[1] * b[1]; });
    const {U, S, V} = svd2(H), d = Math.sign(det2(mul2(V, tr2(U)))) || 1, R = mul2(mul2(V, [[1, 0], [0, d]]), tr2(U)), Rp = app(R, pb);
    return {R, t: [qb[0] - Rp[0], qb[1] - Rp[1]], H, U, S, V, d, pb, qb};
  }

  /* ---------- Worked example: Kabsch on four points ---------- */
  const RECT = [[2, 0], [0, 1], [-2, 0], [0, -1]];
  function model(p) {
    const [theta, tx, mirror] = p, R0 = rot(rad(theta)), M = mirror >= .5 ? [[1, 0], [0, -1]] : [[1, 0], [0, 1]];
    const Qs = RECT.map(q => { const r = app(R0, app(M, q)); return [r[0] + tx, r[1]]; }), k = kabsch(RECT, Qs);
    const fit = RECT.map(q => { const r = app(k.R, q); return [r[0] + k.t[0], r[1] + k.t[1]]; });
    const rms = Math.sqrt(fit.reduce((s, f, i) => s + (f[0] - Qs[i][0]) ** 2 + (f[1] - Qs[i][1]) ** 2, 0) / RECT.length);
    return {theta, tx, mirror: mirror >= .5, Qs, ...k, fit, rms, angle: deg(Math.atan2(k.R[1][0], k.R[0][0]))};
  }
  function drawing(m) {
    const S = 27, cx = 140, cy = 128, X = x => (cx + x * S).toFixed(1), Y = y => (cy - y * S).toFixed(1);
    let body = `<rect x="${cx - 4.6 * S}" y="${cy - 3.9 * S}" width="${9.2 * S}" height="${7.8 * S}" fill="#f6f5ef" stroke="#a8b6a5" rx="4"/>`;
    for (let g = -4; g <= 4; g++) body += `<path d="M${X(g)} ${Y(-3.8)}V${Y(3.8)}" stroke="#e5e6dd"/>` + (Math.abs(g) <= 3 ? `<path d="M${X(-4.5)} ${Y(g)}H${X(4.5)}" stroke="#e5e6dd"/>` : '');
    body += `<path d="M${X(-4.5)} ${Y(0)}H${X(4.5)}M${X(0)} ${Y(-3.8)}V${Y(3.8)}" stroke="#a8b6a5"/>`;
    const poly = (pts, color, dash = '') => `<path d="M${pts.map(p => `${X(p[0])} ${Y(p[1])}`).join('L')}Z" fill="none" stroke="${color}" stroke-width="1.6"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
    body += poly(RECT, '#34734e') + poly(m.Qs, '#bd431c') + poly(m.fit, '#315c86', '5 4');
    RECT.forEach((p, i) => {
      body += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" fill="#34734e"/>` + txt(Number(X(p[0])) + 6, Number(Y(p[1])) - 6, `p${i + 1}`, '#34734e', 11);
      body += `<path d="M${X(m.fit[i][0])} ${Y(m.fit[i][1])}L${X(m.Qs[i][0])} ${Y(m.Qs[i][1])}" stroke="#172623" stroke-width="1.5"/>`;
      body += `<circle cx="${X(m.Qs[i][0])}" cy="${Y(m.Qs[i][1])}" r="5" fill="#bd431c"/>` + txt(Number(X(m.Qs[i][0])) + 6, Number(Y(m.Qs[i][1])) + 14, `q${i + 1}`, '#bd431c', 11);
      body += `<circle cx="${X(m.fit[i][0])}" cy="${Y(m.fit[i][1])}" r="8" fill="none" stroke="#315c86" stroke-width="2"/>`;
    });
    const right = 290;
    body += txt(right, 30, 'Kabsch, step by step', '#172623', 14, 'start', ' font-weight="600"');
    body += txt(right, 54, `H = [${N(m.H[0][0], 2)} ${N(m.H[0][1], 2)}; ${N(m.H[1][0], 2)} ${N(m.H[1][1], 2)}]`, '#64736b', 12.5);
    body += txt(right, 74, `singular values ${N(m.S[0], 2)}, ${N(m.S[1], 2)}`, '#64736b', 12.5);
    body += txt(right, 94, `det(VUᵀ) = ${m.d > 0 ? '+1' : '−1'}${m.d > 0 ? '' : ': flip the last sign'}`, m.d > 0 ? '#64736b' : '#bd431c', 12.5);
    body += txt(right, 118, `R̂: a turn of ${N(m.angle, 1)}°`, '#315c86', 13, 'start', ' font-weight="600"') + txt(right, 138, `t̂ = (${N(m.t[0], 2)}, ${N(m.t[1], 2)})`, '#315c86', 13);
    body += txt(right, 162, `RMS residual ${N(m.rms, 3)}`, m.rms > 1e-6 ? '#bd431c' : '#34734e', 13, 'start', ' font-weight="600"');
    body += txt(right, 186, m.mirror ? 'The targets are a mirror image:' : 'A rotation and a shift fit exactly.', '#64736b', 12) + (m.mirror ? txt(right, 204, 'no rotation can reach them.', '#64736b', 12) : '');
    return {body, caption: `Green: the points p₁…p₄. Orange: their targets q, ${m.mirror ? 'mirrored, then ' : ''}turned by ${N(m.theta)}° and shifted by (${N(m.tx)}, 0). Blue rings: R̂p + t̂ from Kabsch; black segments are the remaining residuals.`};
  }
  function calculate(p) {
    const m = model(p), d = m.d > 0 ? 1 : -1;
    return {
      steps: [
        step('Centre both point sets', Q`\bar p=(0,0),\qquad \bar q=\tfrac14\sum_iq_i=${vec(m.qb)}`, `The rectangle p₁ = (2, 0), p₂ = (0, 1), p₃ = (−2, 0), p₄ = (0, −1) is centred already. Its targets are the same points ${m.mirror ? 'mirrored in the x axis, ' : ''}turned by ${N(m.theta)}° and shifted by (${N(m.tx)}, 0); subtracting the centroids removes the shift, so the rotation can be found on its own.`),
        step('Cross-covariance of the centred points', Q`H=\sum_i\tilde p_i\tilde q_i^T=${mat(m.H)}`, 'Each pair contributes the outer product of a centred source point with its centred target (Lesson 14). H collects how the x and y coordinates of one set move with those of the other.'),
        step('SVD and the determinant check', Q`H=U\Sigma V^T,\ \ \Sigma=\operatorname{diag}(${N(m.S[0])},\,${N(m.S[1])}),\ \ U=${mat(m.U)},\ V=${mat(m.V)},\quad \det(VU^T)=${d}`, d > 0 ? 'VUᵀ is a proper rotation, so no correction is needed. The signs of matching columns of U and V can flip together without changing VUᵀ.' : 'VUᵀ would be a reflection (determinant −1), the best fit to a mirror image. Kabsch flips the sign attached to the smaller singular value, which costs the least, so the answer stays a rotation.'),
        step('Rotation, translation and residual', Q`\hat R=V\operatorname{diag}(1,${d})U^T=${mat(m.R)},\quad \hat t=\bar q-\hat R\bar p=${vec(m.t)},\quad \text{RMS}=${N(m.rms, 4)}`, `R̂ is a turn of ${N(m.angle, 2)}°. ${m.mirror ? 'The residual stays large: a mirror image cannot be produced by any rotation, and the determinant correction prevents Kabsch from returning a reflection.' : 'Every target is reached exactly: Kabsch finds the rotation in one step, with no iterations and no starting guess.'}`),
      ],
      values: [['Recovered angle (degrees)', m.angle], ['det(V U^T)', d], ['Recovered t_x', m.t[0]], ['Recovered t_y', m.t[1]], ['RMS residual', m.rms]],
      note: 'Turn the targets by any angle: Kabsch always recovers it in one step. Then mirror them: det(VUᵀ) becomes −1, the correction keeps R̂ a rotation, and the residual can no longer reach zero.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const PTS2 = [[[2, 0], [0, 1], [-2, 0], [0, -1]], [[1, 0], [0, 2], [-1, 0], [0, -2]], [[3, 0], [0, 1], [-3, 0], [0, -1]]];
  const TURNS = {90: [[0, -1], [1, 0]], 180: [[-1, 0], [0, -1]], '-90': [[0, 1], [-1, 0]]};
  const practice = [
    {key: 'kabsch-2d', skill: 'Align matched points with Kabsch', make(r) {
      const P0 = r.pick(PTS2), ang = r.pick(['90', '180', '-90']), R = TURNS[ang], t = [r.int(-3, 3), r.int(-3, 3)];
      const T = P0.map(p => { const q = app(R, p); return [q[0] + t[0], q[1] + t[1]]; }), k = kabsch(P0, T);
      return {prompt: Q`The points ${P0.map(p => Q`\((${p.join(', ')})\)`).join(', ')} are matched, in order, to ${T.map(q => Q`\((${q.map(z0).join(', ')})\)`).join(', ')}. Use Kabsch: find the cross-covariance H, the rotation R (entries row by row) and the translation t.`,
        answers: [{label: Q`\(H\) row by row (4 entries)`, vector: k.H.flat().map(z0), tol: .001}, {label: Q`\(R\) row by row (4 entries)`, vector: R.flat(), tol: .001}, {label: Q`\(t\)`, vector: t, tol: .001}],
        hint: Q`The source points are centred. Subtract the target centroid, add up the outer products \(\tilde p_i\tilde q_i^T\), then find the turn that sends each \(\tilde p_i\) to \(\tilde q_i\) and check its determinant is +1.`,
        solution: Q`\(\bar p=(0,0)\) and \(\bar q=${vec(k.qb)}\). \(H=\sum_i\tilde p_i\tilde q_i^T=${mat(k.H.map(r2 => r2.map(z0)))}\). Its SVD gives \(R=VU^T=${mat(R)}\), a turn of ${ang}°, with determinant +1. Then \(t=\bar q-R\bar p=${vec(t)}\); check \(Rp_1+t=${vec(T[0])}\).`};
    }},
    {key: 'exp-versus-first-order', skill: 'Compare the exponential map with a first-order update', make(r) {
      const a = r.pick([.2, .3, .4, .5, .6, .8, 1]), p = r.pick([[1, 0], [0, 1], [2, 0], [1, 1], [3, 1]]);
      const ex = [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)], lin = [p[0] - a * p[1], p[1] + a * p[0]];
      return {prompt: Q`Apply the rotation vector \(\delta=(0,0,${a})\) to \(p=(${p[0]}, ${p[1]}, 0)\) in two ways: exactly, with \(\exp([\delta]_\times)\) (a turn of ${a} rad about z), and with the first-order matrix \(I+[\delta]_\times\). Give the x and y of both results and \(\det(I+[\delta]_\times)\).`,
        answers: [{label: 'Exact (x, y)', vector: ex, tol: .002}, {label: 'First order (x, y)', vector: lin, tol: .002}, {label: Q`\(\det(I+[\delta]_\times)\)`, value: 1 + a * a, tol: .002}],
        hint: Q`About z, \(\exp([\delta]_\times)\) turns (x, y) by the angle ${a}: \((x\cos a-y\sin a,\ x\sin a+y\cos a)\). The first-order matrix adds \(\delta\times p=(-ay,\ ax,\ 0)\) to p.`,
        solution: Q`Exact: \((${N(ex[0], 4)}, ${N(ex[1], 4)})\), length ${N(Math.hypot(...ex), 4)}. First order: \((${N(lin[0], 4)}, ${N(lin[1], 4)})\), length ${N(Math.hypot(...lin), 4)}, longer by the factor \(\sqrt{1+a^2}=${N(Math.sqrt(1 + a * a), 4)}\). \(\det(I+[\delta]_\times)=1+\|\delta\|^2=${N(1 + a * a, 4)}\ne1\), so \(I+[\delta]_\times\) is not a rotation; \(R\exp([\delta]_\times)\) always is.`};
    }},
    {key: 'rotation-jacobian', skill: 'Write the Jacobian −R[p]× of a rotated point', make(r) {
      const p = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)], turn = r.bool(), R = turn ? [[0, -1, 0], [1, 0, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const px = [[0, -p[2], p[1]], [p[2], 0, -p[0]], [-p[1], p[0], 0]], J = R.map(row => [0, 1, 2].map(j => z0(-row.reduce((s, v, k) => s + v * px[k][j], 0))));
      return {prompt: Q`A residual contains \(R\exp([\delta]_\times)\,p\) with \(R=${mat(R)}\) and \(p=(${p.join(', ')})\). Write the 3 × 3 Jacobian \(\partial\bigl(R\exp([\delta]_\times)p\bigr)/\partial\delta\) at \(\delta=0\), row by row.`,
        answers: [{label: 'Jacobian, row by row (9 entries)', vector: J.flat(), tol: 0}],
        hint: Q`To first order \(R\exp([\delta]_\times)p\approx Rp+R(\delta\times p)=Rp-R[p]_\times\delta\), so the Jacobian is \(-R[p]_\times\), with \([p]_\times=\begin{bmatrix}0&-p_3&p_2\\p_3&0&-p_1\\-p_2&p_1&0\end{bmatrix}\).`,
        solution: Q`\([p]_\times=${mat(px.map(row => row.map(z0)))}\), so the Jacobian is \(-R[p]_\times=${mat(J)}\). Column k says how the rotated point moves for a small turn about axis k; for example, a turn about the axis through p moves nothing in that direction.`};
    }},
    {key: 'ba-size', skill: 'Count the unknowns of bundle adjustment', make(r) {
      const M = r.pick([5, 10, 20, 50, 100, 200]), Np = r.pick([1000, 2000, 5000, 10000, 20000, 50000]), seen = r.pick([2, 3, 4, 5]);
      return {prompt: Q`Bundle adjustment refines ${M} cameras (6 numbers each) and ${Np.toLocaleString('en-GB')} points (3 numbers each); every point is seen by ${seen} cameras. How many unknowns and how many residuals (2 per observation) are there, and what is the size of the reduced camera system after the Schur complement?`,
        answers: [{label: 'Unknowns', value: 6 * M + 3 * Np, tol: 0}, {label: 'Residuals', value: 2 * seen * Np, tol: 0}, {label: 'Reduced system size (rows)', value: 6 * M, tol: 0}],
        hint: 'Count the camera and point parameters separately. The Schur complement eliminates every point, leaving only the camera unknowns.',
        solution: Q`Unknowns: \(6\cdot${M}+3\cdot${Np}=${6 * M + 3 * Np}\). Observations: \(${Np}\cdot${seen}=${seen * Np}\), so ${2 * seen * Np} residuals. Eliminating the points with their 3 × 3 blocks leaves a \(${6 * M}\times${6 * M}\) camera system; a monocular reconstruction also has 7 gauge directions that must be fixed.`};
    }},
    {key: 'schur', skill: 'Solve a small system with the Schur complement', make(r) {
      const e1 = r.int(1, 3), e2 = r.int(1, 3), c1 = r.pick([2, 4]), c2 = r.pick([2, 4]), b = e1 * e1 / c1 + e2 * e2 / c2 + r.int(1, 4), x = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)];
      const rhs = [b * x[0] + e1 * x[1] + e2 * x[2], e1 * x[0] + c1 * x[1], e2 * x[0] + c2 * x[2]], Sred = b - e1 * e1 / c1 - e2 * e2 / c2, vred = rhs[0] - e1 * rhs[1] / c1 - e2 * rhs[2] / c2;
      return {prompt: Q`Solve \(${mat([[b, e1, e2], [e1, c1, 0], [e2, 0, c2]])}\begin{bmatrix}\delta_c\\\delta_1\\\delta_2\end{bmatrix}=${mat(rhs.map(v => [v]))}\) by eliminating \(\delta_1\) and \(\delta_2\) (the "points") with the Schur complement, then back-substituting.`,
        answers: [{label: Q`\((\delta_c, \delta_1, \delta_2)\)`, vector: x, tol: .001}],
        hint: Q`Here \(B=${N(b)}\), \(E=(${e1}, ${e2})\), \(C=\operatorname{diag}(${c1}, ${c2})\). Reduced equation: \((B-EC^{-1}E^T)\,\delta_c=v-EC^{-1}w\). Then \(\delta_j=(w_j-e_j\delta_c)/c_j\).`,
        solution: Q`\(B-EC^{-1}E^T=${N(b)}-${e1 * e1}/${c1}-${e2 * e2}/${c2}=${N(Sred)}\) and \(v-EC^{-1}w=${rhs[0]}-${e1}\cdot${rhs[1]}/${c1}-${e2}\cdot${rhs[2]}/${c2}=${N(vred)}\), so \(\delta_c=${N(vred)}/${N(Sred)}=${x[0]}\). Then \(\delta_1=(${rhs[1]}-${e1}\cdot${x[0] < 0 ? `(${x[0]})` : x[0]})/${c1}=${x[1]}\) and \(\delta_2=(${rhs[2]}-${e2}\cdot${x[0] < 0 ? `(${x[0]})` : x[0]})/${c2}=${x[2]}\).`};
    }},
    {key: 'icp-translation', skill: 'Take one ICP step and spot a wrong match', make(r) {
      const gap = r.pick([3, 4]), T = [0, 1, 2, 3].map(k => k * gap), shift = r.pick([.5, 1, 1.5, 2.5, 3]) * (gap / 4) * 2, P = T.map(v => v - shift);
      const nn = P.map(p => T.reduce((a, t) => Math.abs(t - p) < Math.abs(a - p) - 1e-9 ? t : a, T[0])), step1 = nn.reduce((s, t, i) => s + t - P[i], 0) / P.length, right = nn.every((t, i) => t === T[i]);
      return {prompt: Q`On a line, target points sit at ${T.join(', ')} and the source points, a shifted copy, at ${P.map(v => N(v)).join(', ')} (source i belongs to target i). Do one ICP step for a translation only: match each source point to its nearest target, then shift by the mean of (target − source). What shift do you get, and were all the nearest-neighbour matches right?`,
        answers: [{label: 'ICP shift', value: step1, tol: .001}, {label: 'All matches right?', choices: ['Yes', 'No'], correct: right ? 0 : 1}],
        hint: 'For each source value find the closest target value (ties go to the smaller target). The best shift for fixed pairs is the mean difference.',
        solution: Q`Nearest targets: ${nn.join(', ')}. Differences: ${nn.map((t, i) => N(t - P[i])).join(', ')}, mean ${N(step1, 4)}. The true shift is ${N(shift)}. ${right ? 'Every match was right, so one step recovers the shift.' : 'Some matches were wrong because the copy was shifted by more than half the spacing, so ICP moves towards a wrong alignment: the local-minimum problem.'}`};
    }},
  ];

  /* ---------- Lab: align a turned copy of the cup's edge points; the sparsity of bundle adjustment ---------- */
  const KMAX = 30, UNIT = 60;   // ICP iterations plotted; pixels per unit in the point coordinates
  let memo = null;
  function makePairs(s, Qpts) {
    const g = window.CV_VISION.rng(630 + 41 * s.seed), R0 = rot(rad(s.angle)), t0 = [s.tx, s.ty], out = [];
    Qpts.forEach((q, i) => {
      const n1 = g.gauss(), n2 = g.gauss();
      if (s.partial && q[0] > .4) return;
      // Source = R0ᵀ (q − t0), mirrored if asked, plus noise: the true alignment is q = R0 M p + t0.
      let p = app(tr2(R0), [q[0] - t0[0], q[1] - t0[1]]);
      if (s.mirror) p = [-p[0], p[1]];
      out.push({p: [p[0] + s.noise * n1, p[1] + s.noise * n2], i});
    });
    return out;
  }
  function nearest(x, Qpts) { let bi = 0, bd = Infinity; for (let j = 0; j < Qpts.length; j++) { const dx = Qpts[j][0] - x[0], dy = Qpts[j][1] - x[1], d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = j; } } return {j: bi, d: bd}; }
  function iterate(s, pairs, Qpts) {
    let R = [[1, 0], [0, 1]], t = [0, 0], d = 1;
    const hist = [], record = () => {
      let sTrue = 0, sNN = 0;
      const X = pairs.map(pr => { const r = app(R, pr.p); return [r[0] + t[0], r[1] + t[1]]; });
      X.forEach((x, k) => { const q = Qpts[pairs[k].i]; sTrue += (x[0] - q[0]) ** 2 + (x[1] - q[1]) ** 2; sNN += nearest(x, Qpts).d; });
      hist.push({R, t, X, d, rmsTrue: Math.sqrt(sTrue / pairs.length), rmsNN: Math.sqrt(sNN / pairs.length)});
      return X;
    };
    let X = record();
    for (let k = 1; k <= KMAX; k++) {
      const partners = s.method === 'icp' ? X.map(x => Qpts[nearest(x, Qpts).j]) : pairs.map(pr => Qpts[pr.i]);
      if (s.method === 'kabsch' || s.method === 'icp') {
        const kb = kabsch(pairs.map(pr => pr.p), partners); R = kb.R; t = kb.t; d = kb.d;
      } else {
        // One Gauss–Newton step on (δθ, δt): the derivative of R·rot(δθ)·p at 0 is R·(−p_y, p_x), the 2D version of −R[p]×.
        const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], g = [0, 0, 0];
        pairs.forEach((pr, k2) => {
          const jr = app(R, [-pr.p[1], pr.p[0]]), res = [X[k2][0] - partners[k2][0], X[k2][1] - partners[k2][1]], rows = [[jr[0], 1, 0], [jr[1], 0, 1]];
          rows.forEach((row, c) => { for (let a = 0; a < 3; a++) { g[a] += row[a] * res[c]; for (let b = 0; b < 3; b++) A[a][b] += row[a] * row[b]; } });
        });
        const sol = window.CV_VISION.solve(A.flat(), g.map(v => -v), 3);
        if (!sol) break;
        const [dth, dx, dy] = sol;
        R = s.method === 'gn-exp' ? mul2(R, rot(dth)) : mul2(R, [[1, -dth], [dth, 1]]);   // exponential map, or adding the first-order matrix
        t = [t[0] + dx, t[1] + dy];
      }
      X = record();
    }
    return hist;
  }
  // Which cameras see point j: a run of 2 or 3 neighbouring cameras, as in a video.
  function seenBy(j, M, Np) { const k = Math.min(M, 2 + (j % 2)), start = Math.floor(j * (M - k + 1) / Np); return Array.from({length: k}, (_, u) => start + u); }
  function baFigure(M, Np) {
    const n = 6 * M + 3 * Np, size = 230, c = size / n, cs = 150 / (6 * M), see = Array.from({length: Np}, (_, j) => seenBy(j, M, Np));
    let a = `<svg class="vk-plot" viewBox="0 0 ${size + 200} ${size + 30}" role="img" aria-label="Sparsity of the bundle-adjustment normal equations and of the reduced camera system"><title>Sparsity of JᵀJ and of the reduced camera system</title>`;
    a += `<rect x="0" y="0" width="${size}" height="${size}" style="fill:var(--paper);stroke:var(--line)"/>`;
    const blk = (r0, c0, h, w, style) => `<rect x="${(c0 * c).toFixed(2)}" y="${(r0 * c).toFixed(2)}" width="${Math.max(.6, w * c).toFixed(2)}" height="${Math.max(.6, h * c).toFixed(2)}" style="${style}"/>`;
    for (let i = 0; i < M; i++) a += blk(6 * i, 6 * i, 6, 6, 'fill:var(--green);opacity:.85');
    for (let j = 0; j < Np; j++) {
      const o = 6 * M + 3 * j;
      a += blk(o, o, 3, 3, 'fill:var(--blue);opacity:.85');
      see[j].forEach(i => { a += blk(6 * i, o, 6, 3, 'fill:var(--orange);opacity:.75') + blk(o, 6 * i, 3, 6, 'fill:var(--orange);opacity:.75'); });
    }
    a += `<path d="M${(6 * M * c).toFixed(1)} 0V${size}M0 ${(6 * M * c).toFixed(1)}H${size}" style="stroke:var(--ink);stroke-width:1;stroke-dasharray:3 3"/>`;
    a += `<text x="0" y="${size + 20}" style="font-size:12px">JᵀJ: ${n} × ${n}</text>`;
    const ox = size + 40, share = (i, k) => see.some(v => v.includes(i) && v.includes(k));
    a += `<rect x="${ox}" y="0" width="150" height="150" style="fill:var(--paper);stroke:var(--line)"/>`;
    for (let i = 0; i < M; i++) for (let k = 0; k < M; k++) if (i === k || share(i, k)) a += `<rect x="${(ox + 6 * k * cs).toFixed(2)}" y="${(6 * i * cs).toFixed(2)}" width="${(6 * cs).toFixed(2)}" height="${(6 * cs).toFixed(2)}" style="fill:${i === k ? 'var(--green)' : 'var(--orange)'};opacity:.8;stroke:var(--paper);stroke-width:.5"/>`;
    a += `<text x="${ox}" y="170" style="font-size:12px">S = B − EC⁻¹Eᵀ:</text><text x="${ox}" y="186" style="font-size:12px">${6 * M} × ${6 * M}</text></svg>`;
    const nnz = 36 * M + 9 * Np + 2 * 18 * see.reduce((s2, v) => s2 + v.length, 0), dense = n ** 3 / 3, schur = (6 * M) ** 3 / 3 + see.reduce((s2, v) => s2 + 27 + (6 * v.length) ** 2 * 3, 0);
    return {svg: a, n, nnz, dense, schur};
  }
  function syncInputs(root, s, keys) {
    keys.forEach(k => {
      const el = root.querySelector('#vk-' + k);
      if (el && Number(el.value) !== s[k]) { el.value = s[k]; const out = root.querySelector(`#vk-${k}-value`); if (out) out.textContent = window.CV_VISION.fmt(s[k]); }
    });
  }
  const METHODS = [['kabsch', 'Kabsch, known matches (closed form)'], ['gn-exp', 'Gauss–Newton, known matches, R ← R·exp(δ)'], ['gn-add', 'Gauss–Newton, known matches, R ← R + R[δ]× (no exp)'], ['icp', 'ICP: nearest neighbours, then Kabsch']];
  const lab = {
    name: 'pointalign', title: 'Kabsch, ICP and the rotation manifold', photo: 'coffee',
    heading: 'Turn a copy of the cup’s edges. Align it back.',
    intro: 'About 220 edge points are taken from the photo (blue). The orange copy is the same set turned, shifted, optionally mirrored and noisy. Align it with Kabsch, with Gauss–Newton steps that update the rotation through the exponential map or by adding a matrix, or with ICP, which must guess the matches. Below, the block structure that makes bundle adjustment solvable.',
    defaults: {method: 'icp', angle: 15, tx: .3, ty: -.2, noise: .01, iters: 5, mirror: false, partial: false, seed: 1, cams: 4, pts: 16},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return select('method', 'Alignment method', METHODS, s.method) + range('iters', 'Iterations shown k', 0, KMAX, 1, s.iters) +
        range('angle', 'Turn of the copy (°)', -180, 180, 5, s.angle) + range('tx', 'Shift x', -1, 1, .05, s.tx) + range('ty', 'Shift y', -1, 1, .05, s.ty) +
        range('noise', 'Point noise σ', 0, .05, .005, s.noise) + check('mirror', 'Mirror the copy (no rotation can undo it)', s.mirror) + check('partial', 'Drop the right part of the copy (partial overlap)', s.partial) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="step">Next iteration →</button><button type="button" class="btn" data-vk-action="reseed">New noise ↻</button></div>' +
        '<div class="math-rule">H = Σ p̃ᵢq̃ᵢᵀ = UΣVᵀ,  R = V diag(1, det VUᵀ) Uᵀ</div>' +
        range('cams', 'Bundle adjustment: cameras M', 2, 12, 1, s.cams) + range('pts', 'Bundle adjustment: points N', 6, 60, 2, s.pts) +
        '<div class="math-rule">(B − E C⁻¹ Eᵀ) δ_c = v − E C⁻¹ w</div>';
    },
    visual: () => '<div class="vk-pair" style="min-width:0"><div id="pa-plot" style="min-width:0"></div><div id="pa-curve" style="min-width:0"></div></div><div id="pa-ba" style="min-width:0"></div>',
    note: 'Predict first: with ICP, raise the turn from 15° to 45° and step to 30 iterations. Does ICP still find it? Nearest neighbours pair the wrong points once the copy is turned by more than a few tens of degrees, and ICP settles into a wrong alignment with a small residual of its own (solid curve) but a large true error (dashed). Kabsch with known matches recovers any angle in one step. Now choose “R + R[δ]×” at 60°: every step stretches the copy, because I + [δ]× has determinant 1 + δ², while the exponential-map update stays rigid. Mirror the copy: det(VUᵀ) = −1, and Kabsch returns the best rotation instead of a reflection. In bundle adjustment, the orange camera–point blocks are the only coupling, so eliminating the blue point blocks leaves a small camera system.',
    async setup() {
      const V = window.CV_VISION, img = await V.load('coffee'), {w, h} = img, g = V.blur(img.gray, w, h, 1);
      const gx = V.filter(g, w, h, [-1, 0, 1, -2, 0, 2, -1, 0, 1], 3), gy = V.filter(g, w, h, [-1, -2, -1, 0, 0, 0, 1, 2, 1], 3);
      const mag = gx.map((v, i) => Math.hypot(v, gy[i])), thr = Float32Array.from(mag).sort()[Math.floor(.92 * mag.length)], pix = [];
      for (let cy = 2; cy < h - 2; cy += 7) for (let cx = 2; cx < w - 2; cx += 7) {
        let best = -1, bi = 0;
        for (let y = cy; y < Math.min(h - 2, cy + 7); y++) for (let x = cx; x < Math.min(w - 2, cx + 7); x++) { const v = mag[y * w + x]; if (v > best) { best = v; bi = y * w + x; } }
        if (best >= thr) pix.push([bi % w, Math.floor(bi / w)]);
      }
      const mx = pix.reduce((s2, p) => s2 + p[0], 0) / pix.length, my = pix.reduce((s2, p) => s2 + p[1], 0) / pix.length;
      return {Qpts: pix.map(([x, y]) => [(x - mx) / UNIT, -(y - my) / UNIT]), mx, my, w, h, src: window.CV_IMAGES.coffee.src};
    },
    render(s, root, data) {
      const V = window.CV_VISION, {fmt} = V, {Qpts} = data;
      syncInputs(root, s, ['iters']);
      const key = JSON.stringify([s.method, s.angle, s.tx, s.ty, s.noise, s.mirror, s.partial, s.seed]);
      if (!memo || memo.key !== key) { const pairs = makePairs(s, Qpts); memo = {key, pairs, hist: iterate(s, pairs, Qpts)}; }
      const {pairs, hist} = memo, k = Math.min(s.iters, hist.length - 1), cur = hist[k];
      // Main view: the photo behind the target edges, the current copy and its partners.
      const W = 480, H = 340, S = 60, cx = W / 2, cy = H / 2, X = x => (cx + x * S).toFixed(1), Y = y => (cy - y * S).toFixed(1);
      let svg = `<svg class="vk-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Target edge points, the aligned copy after k iterations and the pairs used"><title>Point-set alignment</title><rect x="0" y="0" width="${W}" height="${H}" style="fill:var(--paper);stroke:var(--line)"/>`;
      svg += `<image href="${data.src}" x="${X(-data.mx / UNIT)}" y="${Y(data.my / UNIT)}" width="${(data.w / UNIT * S).toFixed(1)}" height="${(data.h / UNIT * S).toFixed(1)}" opacity=".3" preserveAspectRatio="none"/>`;
      const partner = (x, idx) => s.method === 'icp' ? Qpts[nearest(x, Qpts).j] : Qpts[pairs[idx].i];
      cur.X.forEach((x, idx) => { if (idx % 2) return; const q = partner(x, idx); svg += `<line x1="${X(x[0])}" y1="${Y(x[1])}" x2="${X(q[0])}" y2="${Y(q[1])}" style="stroke:var(--muted);stroke-width:1;opacity:.6"/>`; });
      Qpts.forEach(q => { svg += `<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="2.6" class="vk-sample"/>`; });
      cur.X.forEach(x => { svg += `<circle cx="${X(x[0])}" cy="${Y(x[1])}" r="2.6" style="fill:var(--orange)"/>`; });
      svg += `<text x="10" y="22" style="font-size:14px;fill:var(--ink)">iteration k = ${k}</text></svg>`;
      root.querySelector('#pa-plot').innerHTML = svg + '<p class="vk-legend"><span><span class="vk-key vk-key-eig1" style="margin-right:5px"></span>target edge points</span><span><span class="vk-key vk-key-vector" style="margin-right:5px"></span>the copy after k iterations</span><span>grey: the pairs used (every second one)</span></p>';
      // Error against iteration: the method's own objective and the distance to the true partners.
      const own = hist.map((h2, i) => [i, s.method === 'icp' ? h2.rmsNN : h2.rmsTrue]), truth = hist.map((h2, i) => [i, h2.rmsTrue]), top = Math.max(.05, ...truth.map(p => p[1]), ...own.map(p => p[1])) * 1.08;
      root.querySelector('#pa-curve').innerHTML = window.CV_VISION_LABS.svgPlot({w: 330, h: 230, x: [0, KMAX], y: [0, top], lines: s.method === 'icp' ? [{points: own, cls: 'series-a'}, {points: truth, cls: 'series-b vk-thin'}] : [{points: truth, cls: 'series-a'}], marker: k, label: 'RMS alignment error against iteration', xLabel: 'iteration', yLabel: 'RMS error (units)', xTicks: [0, 10, 20, 30]}) +
        `<p class="vk-legend">${s.method === 'icp' ? '<span><span class="vk-key vk-key-vector" style="margin-right:5px"></span>RMS to the nearest target (what ICP minimises)</span><span><span class="vk-key vk-key-eig1" style="margin-right:5px"></span>RMS to the true partners</span>' : '<span><span class="vk-key vk-key-vector" style="margin-right:5px"></span>RMS to the true partners</span>'}</p>`;
      // Bundle-adjustment structure.
      const ba = baFigure(s.cams, s.pts);
      root.querySelector('#pa-ba').innerHTML = `<div class="vk-pair"><div>${ba.svg}</div><p class="vk-callout">Bundle adjustment with M = ${s.cams} cameras and N = ${s.pts} points has ${ba.n} unknowns. In JᵀJ, green blocks are cameras (B), blue blocks are points (C, one 3 × 3 block each) and orange blocks (E) link a camera to the points it sees; only ${fmt(100 * ba.nnz / (ba.n * ba.n), 1)}% of the entries are nonzero. Eliminating the points leaves the ${6 * s.cams} × ${6 * s.cams} system S on the right, where cameras are linked when they share a point. A dense solve would cost about ${fmt(ba.dense, 0)} operations; the Schur route about ${fmt(ba.schur, 0)}.</p></div>`;
      const ang = angleOf(cur.R), scale = Math.sqrt(Math.abs(det2(cur.R))), err = ((ang - s.angle) % 360 + 540) % 360 - 180;
      return V.report([
        ['Points', `${pairs.length} in the copy, ${Qpts.length} targets`],
        ['Recovered turn', `${fmt(ang, 2)}°${s.mirror ? ' (the copy is mirrored)' : ` (true ${s.angle}°, error ${fmt(err, 2)}°)`}`],
        ['Scale of the current R, √|det R|', fmt(scale, 4) + (scale > 1.005 ? ': not a rotation' : '')],
        ['RMS to the true partners', fmt(cur.rmsTrue, 4)],
        ['RMS to the nearest targets', fmt(cur.rmsNN, 4)],
        ['det(VUᵀ) in the last Kabsch step', s.method === 'kabsch' || s.method === 'icp' ? (k === 0 ? '—' : cur.d > 0 ? '+1' : '−1, corrected to a rotation') : 'not used'],
      ]);
    },
    action(name, s) { if (name === 'step') s.iters = Math.min(KMAX, s.iters + 1); if (name === 'reseed') s.seed++; },
  };

  window.CV_EXTEND.lesson(63, {
    teaching: {
      equation: Q`\begin{gathered}R\leftarrow R\exp([\delta]_\times),\qquad H=\sum_i\tilde p_i\tilde q_i^T=U\Sigma V^T,\ \ R=V\operatorname{diag}\bigl(1,1,\det VU^T\bigr)U^T\\ \bigl(B-EC^{-1}E^T\bigr)\,\delta_c=v-EC^{-1}w\end{gathered}`,
      symbols: [['δ', 'rotation step: a 3-vector'], ['exp([δ]×)', 'the step as a rotation (Rodrigues)'], ['H', 'cross-covariance of matched points'], ['B, C, E', 'camera, point and coupling blocks'], ['δ_c', 'camera update after elimination']],
      connection: 'Bundle adjustment in COLMAP and ORB-SLAM, pose-graph SLAM, visual-inertial odometry, ICP for depth cameras and LiDAR, trajectory evaluation (ATE) and pose-regression networks all update rotations through the exponential map and align point sets with Kabsch-style SVD solutions.',
      trap: 'Adding a small matrix to a rotation, or optimising its nine entries freely, leaves the set of rotations: I + [δ]× has determinant 1 + ‖δ‖², so repeated additive updates stretch the scene. Update with R exp([δ]×), and check det(VUᵀ) in Kabsch so that the answer is not a reflection.',
      question: 'Kabsch finds VUᵀ with determinant −1 for a pair of point sets. What does that mean, and what does the corrected algorithm return?',
      choices: ['The best fit is a reflection; flipping the sign tied to the smallest singular value gives the best proper rotation', 'The points are collinear, so no rotation exists', 'The rotation is 180°, which is returned unchanged'], correct: 0,
      explanation: 'det(VUᵀ) = −1 means the orthogonal matrix that best maps one set onto the other is a reflection, as for a mirrored copy. Kabsch replaces the last 1 in diag(1, …, 1, d) by d = −1, which loses the least because it is paired with the smallest singular value, so the answer is the best rotation.',
    },
    guide: {
      title: 'Turn with the exponential map; align with one SVD; eliminate the points',
      paragraphs: [
        'Rotations form a curved set, a manifold, so an optimiser updates them by R exp([δ]×): a small 3-vector δ turned into an exact rotation by Rodrigues’ formula. The derivative of a rotated point with respect to δ is −R[p]×, which is all Gauss–Newton needs.',
        'With matched points, the best rotation comes from one SVD of the cross-covariance H (Kabsch), with a determinant check against reflections; ICP alternates nearest-neighbour matching with this step. Bundle adjustment refines all cameras and points together; its normal equations are sparse, and the Schur complement eliminates the points to leave a small camera system.',
      ],
      example: 'Kabsch on four matched points',
      controls: [{label: 'Turn of the targets θ (°)', min: -165, max: 165, step: 15, value: 90}, {label: 'Shift of the targets tₓ', min: -2, max: 2, step: .5, value: 1}, {label: 'Mirror the targets (1 = yes, 0 = no)', min: 0, max: 1, step: 1, value: 0}],
      predict: 'Mirror the targets. Can any rotation and shift put the four points exactly on them?',
      takeaway: 'Centring removes the translation, the SVD of H gives the rotation in one step, and t = q̄ − Rp̄ follows. det(VUᵀ) = −1 signals that a reflection would fit better; the correction keeps the answer a rotation, so a mirror image leaves a residual that no rotation can remove.',
      notation: 'p̃ᵢ and q̃ᵢ are the matched points minus their centroids p̄ and q̄. H = Σp̃ᵢq̃ᵢᵀ is their cross-covariance and H = UΣVᵀ its SVD (Lesson 14). R̂ and t̂ are the estimated rotation and translation; the RMS residual is the root mean square distance left after alignment.',
    },
    notation: {
      'δ': {tex: Q`\delta`, detail: 'A small rotation step stored as a 3-vector: its direction is the axis and its length the angle in radians. It lives in the tangent space of the rotation manifold, so an optimiser can treat it as three ordinary numbers.'},
      'exp([δ]×)': {tex: Q`\exp([\delta]_\times)`, detail: 'The matrix exponential of the skew matrix of δ, computed by Rodrigues’ formula I + sin θ [n]× + (1 − cos θ)[n]×². It is exactly a rotation for every δ, unlike the first-order I + [δ]×.'},
      H: {tex: 'H', detail: 'In this lesson H is the 3 × 3 (or 2 × 2) cross-covariance Σp̃ᵢq̃ᵢᵀ of two centred, matched point sets, not a homography or a Hessian. Kabsch reads the best rotation from its SVD.'},
      'B, C, E': {tex: Q`B,\ C,\ E`, detail: 'The blocks of the bundle-adjustment normal equations JᵀJ: B for the cameras, C for the points (block-diagonal, one 3 × 3 block per point) and E for the camera–point coupling, nonzero only where a camera sees a point.'},
      'δ_c': {tex: Q`\delta_c`, detail: 'The update of all camera parameters, found from the reduced camera system (B − EC⁻¹Eᵀ)δ_c = v − EC⁻¹w. The point updates follow one at a time: δ_p = C⁻¹(w − Eᵀδ_c).'},
    },
    calculate, practice, lab,
  });
})();
