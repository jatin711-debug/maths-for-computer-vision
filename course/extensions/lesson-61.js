/* Lesson 61: epipolar geometry and the eight-point algorithm. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const col = v => mat(v.map(x => [x]));
  const vec = (v, d = 3) => `(${v.map(x => N(x, d)).join(', ')})`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${extra}>${E(s)}</text>`;

  /* ---------- Small 3-vector and 3 × 3 helpers (matrices are arrays of rows) ---------- */
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const skew = v => [[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]];
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const mv = (A, x) => A.map(r => r.reduce((s, v, k) => s + v * x[k], 0));
  const tr = A => A[0].map((_, j) => A.map(r => r[j]));
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
  const z0 = v => v + 0;   // turns −0 into 0
  const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  // Clip the line a x + b y + c = 0 to a rectangle; returns its two end points or null.
  function clipLine([a, b, c], x0, x1, y0, y1) {
    const pts = [], eps = 1e-9;
    if (Math.abs(b) > eps) for (const x of [x0, x1]) { const y = -(a * x + c) / b; if (y >= y0 - eps && y <= y1 + eps) pts.push([x, y]); }
    if (Math.abs(a) > eps) for (const y of [y0, y1]) { const x = -(b * y + c) / a; if (x >= x0 - eps && x <= x1 + eps) pts.push([x, y]); }
    let best = null, bd = 1e-9;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d > bd) { bd = d; best = [pts[i], pts[j]]; } }
    return best;
  }
  // The line a x + b y + c = 0 written with tidy signs.
  function lineTex([a, b, c]) {
    let out = '';
    for (const [v, sym] of [[a, 'x'], [b, 'y'], [c, '']]) {
      const m = N(Math.abs(v));
      if (m === '0') continue;
      out += (v < 0 ? '-' : out ? '+' : '') + (m === '1' && sym ? '' : m) + sym;
    }
    return (out || '0') + '=0';
  }

  /* ---------- Worked example: one point seen by two cameras ---------- */
  // Camera 2 sees X₂ = R X₁ + t with t = (1, 0, t_z) and R a turn about the vertical axis; the point lies on the ray through (0.25, 0.5).
  const X1HAT = [.25, .5, 1], BOX = {x0: -.5, x1: 2, y0: -.25, y1: 1.25};
  function model(p) {
    const [tz, yaw, Z] = p, R = rotY(rad(yaw)), t = [1, 0, tz], Ess = mm(skew(t), R);
    const at = depth => { const X2 = mv(R, X1HAT.map(v => depth * v)).map((v, i) => v + t[i]); return X2.map(v => v / X2[2]); };
    const X1 = X1HAT.map(v => Z * v), X2 = mv(R, X1).map((v, i) => v + t[i]), x2 = X2.map(v => v / X2[2]);
    const l = mv(Ess, X1HAT), res = dot3(x2, l), angle = deg(Math.atan(-l[0] / l[1]));
    const ray = mv(R, X1HAT), vp = ray.map(v => v / ray[2]);   // the image of the ray's far end (infinite depth)
    return {tz, yaw, Z, R, t, Ess, X1, X2, x2, l, res, angle, vp, at};
  }
  function drawing(m) {
    const S = 100, X0 = [22, 290], Y0 = 52, px = (k, x) => X0[k] + (x - BOX.x0) * S, py = y => Y0 + (y - BOX.y0) * S, f1 = v => v.toFixed(1);
    const inside = q => q[0] >= BOX.x0 && q[0] <= BOX.x1 && q[1] >= BOX.y0 && q[1] <= BOX.y1;
    let body = '';
    [0, 1].forEach(k => {
      body += `<rect x="${X0[k]}" y="${Y0}" width="250" height="150" rx="4" fill="#f6f5ef" stroke="#a8b6a5"/>`;
      body += `<path d="M${px(k, 0) - 6} ${py(0)}H${px(k, 0) + 6}M${px(k, 0)} ${py(0) - 6}V${py(0) + 6}" stroke="#315c86" stroke-width="1.5"/>`;
      body += txt(X0[k], 40, k ? 'View 2' : 'View 1', '#172623', 13, 'start', ' font-weight="600"') + txt(X0[k] + 250, 40, 'normalised x̂ = (X/Z, Y/Z)', '#64736b', 11, 'end');
    });
    body += `<circle cx="${f1(px(0, .25))}" cy="${f1(py(.5))}" r="6" fill="#bd431c"/>` + txt(px(0, .25) + 10, py(.5) - 8, 'x̂₁ = (0.25, 0.5)', '#bd431c', 12);
    const seg = clipLine(m.l, BOX.x0, BOX.x1, BOX.y0, BOX.y1);
    if (seg) body += `<path d="M${f1(px(1, seg[0][0]))} ${f1(py(seg[0][1]))}L${f1(px(1, seg[1][0]))} ${f1(py(seg[1][1]))}" stroke="#34734e" stroke-width="2.5"/>`;
    for (const d of [2, 4, 6, 8, 10]) { const q = m.at(d); if (inside(q)) body += `<circle cx="${f1(px(1, q[0]))}" cy="${f1(py(q[1]))}" r="3" fill="#34734e" opacity=".55"/>`; }
    if (inside(m.vp)) body += `<circle cx="${f1(px(1, m.vp[0]))}" cy="${f1(py(m.vp[1]))}" r="6" fill="none" stroke="#315c86" stroke-width="2"/>`;
    if (inside(m.x2)) body += `<circle cx="${f1(px(1, m.x2[0]))}" cy="${f1(py(m.x2[1]))}" r="6" fill="#bd431c"/>` + txt(Math.min(px(1, m.x2[0]) + 9, 425), py(m.x2[1]) - 9, `x̂₂ = (${N(m.x2[0], 2)}, ${N(m.x2[1], 2)})`, '#bd431c', 12);
    const ep = Math.abs(m.tz) < 1e-12 ? null : [1 / m.tz, 0];
    body += txt(290, 224, ep ? `epipole e₂ = (${N(ep[0], 2)}, 0)${inside(ep) ? '' : ', off this window'}` : 'epipole e₂ at infinity along x', '#315c86', 11.5);
    if (ep && inside(ep)) body += `<path d="M${f1(px(1, ep[0]) - 7)} ${f1(py(0) - 7)}l14 14m0 -14l-14 14" stroke="#315c86" stroke-width="2.5"/>`;
    body += txt(22, 224, `depth Z = ${N(m.Z)}, residual x̂₂ᵀE x̂₁ = ${N(m.res)}`, '#64736b', 11.5);
    return {body, caption: `Left: the point's image x̂₁ in view 1 (blue cross: the principal point). Right: its epipolar line l₂ = E x̂₁ (green). Faint green dots show where the point would appear at depths 2, 4, 6, 8 and 10; the blue ring is the image of the ray at infinite depth. The orange dot is the match for depth ${N(m.Z)}.`};
  }
  function calculate(p) {
    const m = model(p), ep = Math.abs(m.tz) < 1e-12;
    return {
      steps: [
        step('Build the essential matrix', Q`E=[t]_\times R=${mat(skew(m.t).map(r => r.map(z0)))}${mat(m.R)}=${mat(m.Ess)}`, `The translation is t = (1, 0, ${N(m.tz)}) and R turns camera 2 by ${N(m.yaw)}° about its vertical axis. [t]× is the cross-product matrix of Lesson 49, so [t]× v = t × v for every vector v; multiplying by R first turns the ray of view 1 into camera 2's axes.`),
        step('Project the point into both views', Q`X_1=${N(m.Z)}${col(X1HAT)}=${col(m.X1)},\quad X_2=RX_1+t=${col(m.X2)},\quad \hat x_2=\frac{X_2}{${N(m.X2[2])}}=${col(m.x2)}`, `The point sits at depth ${N(m.Z)} on the ray through x̂₁ = (0.25, 0.5, 1). Moving it into camera 2's frame and dividing by its new depth ${N(m.X2[2])} gives its normalised image point in view 2.`),
        step('Turn the view-1 point into a line in view 2', Q`l_2=E\hat x_1=${col(m.l)}:\qquad ${lineTex(m.l)}`, `E sends x̂₁ to a line, stored as (a, b, c) for a·x + b·y + c = 0. It slopes at ${N(m.angle, 1)}° and depends only on x̂₁ and the camera motion, not on the depth: wherever the point is along its ray, view 2 must see it on this line.`),
        step('Check the constraint and find the epipole', Q`\hat x_2^TE\,\hat x_1=${N(m.res)},\qquad e_2\simeq t=(1,\,0,\,${N(m.tz)})${ep ? Q`\ \text{: at infinity along }x` : Q`\ \Rightarrow\ \bigl(${N(1 / m.tz)},\ 0\bigr)`}`, `The residual is zero up to rounding, at every depth. The epipole is where camera 1's centre appears in view 2, at camera-2 coordinates t; every epipolar line passes through it. ${ep ? 'With no forward component its last coordinate is 0, so it lies at infinity and every epipolar line in view 2 is horizontal, as in a rectified stereo pair.' : 'A forward component brings it in from infinity, so the epipolar lines tilt towards it.'}`),
      ],
      values: [['View-2 x', m.x2[0]], ['View-2 y', m.x2[1]], ['Epipolar residual', m.res], ['Epipolar line angle (degrees)', m.angle], ['Depth in camera 2', m.X2[2]]],
      note: 'Change the depth: x̂₂ slides along the green line and the residual stays 0. Add a forward component t_z and the line tilts towards the epipole; turn camera 2 and both the line and the point move, but the point never leaves the line.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const RZ90 = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
  const practice = [
    {key: 'essential-matrix', skill: 'Build the essential matrix E = [t]×R', make(r) {
      let t;
      do { t = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; } while (t.filter(v => v !== 0).length < 2);
      const turn = r.bool(), R = turn ? RZ90 : I3, S = skew(t).map(row => row.map(z0)), Ess = mm(S, R).map(row => row.map(z0));
      return {prompt: Q`Camera 2 sees each point at \(X_2=RX_1+t\) with \(t=${vec(t)}\) and \(R=${mat(R)}\). Compute the essential matrix \(E=[t]_\times R\) and enter its nine entries row by row.`,
        answers: [{label: Q`\(E\), row by row (9 entries)`, vector: Ess.flat(), tol: 0}],
        hint: Q`\([t]_\times=\begin{bmatrix}0&-t_3&t_2\\t_3&0&-t_1\\-t_2&t_1&0\end{bmatrix}\) (Lesson 49).${turn ? ' Then multiply by R: entry (i, j) of E is row i of [t]× times column j of R.' : ' With R = I, E is simply [t]×.'}`,
        solution: Q`\([t]_\times=${mat(S)}\)${turn ? Q`, so \(E=[t]_\times R=${mat(Ess)}\)` : Q`, and \(E=[t]_\times I=${mat(Ess)}\)`}. Check: \(E^Tt=R^T[t]_\times^Tt=-R^T(t\times t)=0\), so t is the epipole in view 2.`};
    }},
    {key: 'epipolar-check', skill: 'Test a candidate match with the epipolar constraint', make(r) {
      const t = r.pick([[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0], [1, 1, 0], [0, 0, -1], [1, 0, -1]]);
      let x1, l;
      do { x1 = [r.int(-2, 3) / 4, r.int(-2, 3) / 4, 1]; l = cross(t, x1).map(z0); } while (l.every(v => Math.abs(v) < 1e-12));
      const Z = t[2] ? 2 : r.pick([2, 4]), X2 = x1.map((v, i) => Z * v + t[i]), x2 = X2.map(v => v / X2[2]);
      const good = r.bool(), shift = r.pick([-.25, .25]), cand = good ? x2 : Math.abs(l[0]) > 1e-12 ? [x2[0] + shift, x2[1], 1] : [x2[0], x2[1] + shift, 1];
      const res = z0(dot3(cand, l));
      return {prompt: Q`With \(R=I\) and \(t=${vec(t)}\), the essential matrix is \(E=[t]_\times=${mat(skew(t).map(row => row.map(z0)))}\). A point is seen at \(\hat x_1=${vec(x1)}\) in view 1, and a candidate match at \(\hat x_2=${vec(cand)}\) in view 2. Compute the epipolar line \(l_2=E\hat x_1\) and the residual \(\hat x_2^Tl_2\). Can these two points be a match?`,
        answers: [{label: Q`\(l_2\) (3 entries)`, vector: l, tol: .001}, {label: Q`residual \(\hat x_2^Tl_2\)`, value: res, tol: .001}, {label: 'A possible match?', choices: ['Yes: the residual is 0, so it lies on the epipolar line', 'No: the residual is not 0, so it is off the epipolar line'], correct: good ? 0 : 1}],
        hint: Q`With R = I, \(l_2=[t]_\times\hat x_1=t\times\hat x_1\). Then take the dot product of \(\hat x_2\) with \(l_2\).`,
        solution: Q`\(l_2=t\times\hat x_1=${vec(l)}\), the line \(${lineTex(l)}\). Then \(\hat x_2^Tl_2=${cand.map((v, i) => Q`(${N(v)})(${N(l[i])})`).join('+')}=${N(res, 4)}\). ${good ? 'Zero: the candidate lies on the epipolar line, so it can be the match. The test is necessary but not sufficient: every point on the line passes it.' : 'Not zero: the candidate is off the epipolar line, so it cannot be the match.'}`};
    }},
    {key: 'eight-point-row', skill: 'Write the eight-point row for one match', make(r) {
      const u1 = r.int(1, 12) * 10, v1 = r.int(1, 9) * 10, u2 = r.int(1, 12) * 10, v2 = r.int(1, 9) * 10;
      const row = [u2 * u1, u2 * v1, u2, v2 * u1, v2 * v1, v2, u1, v1, 1];
      return {prompt: Q`A match pairs the pixel \(x_1=(${u1}, ${v1})\) in image 1 with \(x_2=(${u2}, ${v2})\) in image 2. Write its row \(a\) of the eight-point system \(Af=0\), where \(f=(F_{11},F_{12},F_{13},F_{21},F_{22},F_{23},F_{31},F_{32},F_{33})\) and the constraint is \(x_2^TFx_1=0\).`,
        answers: [{label: Q`row \(a\) (9 entries)`, vector: row, tol: 0}],
        hint: Q`Write both points as \((u,v,1)\). In \(x_2^TFx_1=\sum_{i,j}(x_2)_iF_{ij}(x_1)_j\) the coefficient of \(F_{ij}\) is \((x_2)_i(x_1)_j\).`,
        solution: Q`\(a=(u_2u_1,\ u_2v_1,\ u_2,\ v_2u_1,\ v_2v_1,\ v_2,\ u_1,\ v_1,\ 1)=(${row.join(', ')})\). The entries run from ${Math.max(...row)} down to 1, which is why Hartley normalisation is applied before the smallest singular vector of A is computed.`};
    }},
    {key: 'epipole', skill: 'Locate the epipoles of a camera that moves without turning', make(r) {
      const f = r.pick([400, 500, 800]), cx = r.pick([320, 400]), cy = r.pick([240, 300]), tz = r.pick([-2, -1, 1, 2]), ax = r.pick([-.5, -.25, 0, .25, .5]), ay = r.pick([-.25, 0, .25]);
      const t = [z0(ax * tz), z0(ay * tz), tz], Kt = [f * t[0] + cx * tz, f * t[1] + cy * tz, tz], e = [f * ax + cx, f * ay + cy];
      return {prompt: Q`Both images come from one camera with \(K=${mat([[f, 0, cx], [0, f, cy], [0, 0, 1]])}\). Between the shots it moves without turning: \(X_2=X_1+t\) with \(t=${vec(t)}\). At which pixel is the epipole \(e_2\) of image 2, and at which pixel is the epipole \(e_1\) of image 1?`,
        answers: [{label: Q`\(e_2\) (pixel)`, vector: e, tol: .01}, {label: Q`\(e_1\) (pixel)`, vector: e, tol: .01}],
        hint: Q`\(e_2\) is where camera 1's centre appears in image 2; that centre has camera-2 coordinates \(R\cdot0+t=t\), so \(e_2\simeq Kt\). Camera 2's centre has camera-1 coordinates \(-R^Tt\).`,
        solution: Q`\(Kt=${vec(Kt)}\), and dividing by its last entry ${tz} gives \(e_2=(${e.join(', ')})\). Camera 2's centre sits at \(-t\) in camera 1, and \(K(-t)\) divided by \(${-tz}\) gives the same pixel, so \(e_1=e_2\): with no rotation both epipoles are the same image point. ${tz < 0 ? 'Here the depths shrink, so the camera moves forward and points stream outwards from this pixel, the focus of expansion.' : 'Here the depths grow, so the camera moves backwards and points stream in towards this pixel.'}`};
    }},
    {key: 'ransac-samples', skill: 'Compare the RANSAC cost of eight- and five-point solvers', make(r) {
      const eps = r.pick([.2, .25, .3, .35, .4, .45, .5, .6]), p = r.pick([.95, .99]), need = s => Math.log(1 - p) / Math.log(1 - (1 - eps) ** s);
      return {prompt: Q`A matcher returns pairs of which a fraction \(\varepsilon=${eps}\) are wrong. RANSAC must draw at least one sample free of wrong matches with confidence \(p=${p}\). How many samples N does the eight-point algorithm need, and how many does the five-point algorithm for calibrated cameras need?`,
        answers: [{label: 'Eight-point N', value: Math.ceil(need(8)), tol: 0}, {label: 'Five-point N', value: Math.ceil(need(5)), tol: 0}],
        hint: Q`Use Lesson 52: \(N=\lceil\ln(1-p)/\ln(1-(1-\varepsilon)^s)\rceil\) with s = 8 and then s = 5.`,
        solution: Q`For s = 8: \((1-\varepsilon)^8=${N((1 - eps) ** 8, 5)}\), so \(N=\lceil${N(Math.log(1 - p), 4)}/${N(Math.log(1 - (1 - eps) ** 8), 5)}\rceil=\lceil${N(need(8), 2)}\rceil=${Math.ceil(need(8))}\). For s = 5: \((1-\varepsilon)^5=${N((1 - eps) ** 5, 5)}\) and \(N=\lceil${N(need(5), 2)}\rceil=${Math.ceil(need(5))}\). Fewer points per sample means exponentially fewer samples, which is why calibrated pipelines use the five-point solver.`};
    }},
    {key: 'rank-two', skill: 'Project an estimate onto a valid F or E', make(r) {
      const kind = r.pick(['F', 'E']), s1 = r.int(10, 20) / 10, s2 = r.int(5, Math.round(s1 * 10) - 1) / 10, s3 = r.int(1, 9) / 100;
      const m = (s1 + s2) / 2, target = kind === 'F' ? [s1, s2, 0] : [m, m, 0], dist = kind === 'F' ? s3 : Math.sqrt((s1 - m) ** 2 + (s2 - m) ** 2 + s3 * s3);
      return {prompt: Q`A linear estimate of ${kind === 'F' ? 'the fundamental matrix F' : 'the essential matrix E'} has singular values \((${s1}, ${s2}, ${s3})\). Keeping its singular vectors, what singular values does the closest valid ${kind === 'F' ? 'fundamental' : 'essential'} matrix have, and how far is it from the estimate in the Frobenius norm?`,
        answers: [{label: 'Singular values (3 entries)', vector: target, tol: .001}, {label: 'Frobenius distance', value: dist, tol: .001}],
        hint: kind === 'F' ? 'A fundamental matrix only needs rank 2. The Frobenius distance between two matrices with the same singular vectors is the root of the summed squared differences of their singular values.' : 'An essential matrix has two equal singular values and a zero. The closest one replaces the first two by their mean. The Frobenius distance is the root of the summed squared differences of the singular values.',
        solution: kind === 'F' ? Q`Set the smallest singular value to 0: \((${s1}, ${s2}, 0)\). Only that entry changed, so the distance is \(${s3}\). This is the rank-2 step of the eight-point algorithm; afterwards every epipolar line passes through one epipole.` : Q`Average the first two: \(m=(${s1}+${s2})/2=${N(m)}\), giving \((${N(m)}, ${N(m)}, 0)\). The distance is \(\sqrt{(${s1}-${N(m)})^2+(${s2}-${N(m)})^2+${s3}^2}=${N(dist, 4)}\). Equal singular values come from \(E=[t]_\times R\), whose nonzero singular values both equal \(\|t\|\).`};
    }},
  ];

  /* ---------- Lab: two synthetic views, the eight-point algorithm and RANSAC ---------- */
  const IW = 640, IH = 480, FOC = 500, NPTS = 60, MAXIT = 1200;
  const VB = [-4, -48, 648, 532];   // SVG viewBox of each view: the 640 × 480 image plus a title band above it
  let memo = null;   // the latest scene and estimates, reused while only the probe or the drawn method changes
  const KM = [[FOC, 0, 320], [0, FOC, 240], [0, 0, 1]], KI = [[1 / FOC, 0, -320 / FOC], [0, 1 / FOC, -240 / FOC], [0, 0, 1]], WM = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
  const hom = q => [q[0], q[1], 1];
  const unitM = A => { const n = Math.hypot(...A.flat()); return n > 0 ? A.map(r => r.map(v => v / n)) : A; };
  const toPix = X => [FOC * X[0] / X[2] + 320, FOC * X[1] / X[2] + 240];
  const gram3 = A => [0, 1, 2].flatMap(i => [0, 1, 2].map(j => A[0][i] * A[0][j] + A[1][i] * A[1][j] + A[2][i] * A[2][j]));   // AᵀA, row-major
  const smallest = (G, n) => Array.from(window.CV_VISION.eigSym(G, n).vectors[n - 1]);
  function makeScene(s) {
    const g = window.CV_VISION.rng(6100 + 7919 * s.seed), R = rotY(rad(s.yaw)), t = [s.tx, 0, s.tz], M = [];
    for (let i = 0; i < NPTS; i++) {
      // Every point draws the same random numbers, so the scene changes smoothly as the sliders move.
      const xn = -.55 + 1.1 * g.next(), yn = -.4 + .8 * g.next(), depth = 4 + 5 * g.next(), nz = [g.gauss(), g.gauss(), g.gauss(), g.gauss()], rank = g.next(), ou = g.next(), ov = g.next();
      const Z = s.scene === 'plane' ? 6.5 / (1 - .35 * xn + .25 * yn) : depth, X = [Z * xn, Z * yn, Z], X2 = mv(R, X).map((v, k) => v + t[k]);
      if (X2[2] < .3) continue;
      const q1 = toPix(X), q2 = toPix(X2);
      if (q2[0] < 0 || q2[0] > IW || q2[1] < 0 || q2[1] > IH) continue;
      const out = rank < s.outliers;
      M.push({p1: [q1[0] + s.noise * nz[0], q1[1] + s.noise * nz[1]], p2: out ? [IW * ou, IH * ov] : [q2[0] + s.noise * nz[2], q2[1] + s.noise * nz[3]], out});
    }
    return {R, t, M};
  }
  // Hartley normalisation: centroid to the origin, mean distance √2.
  function normaliser(P) {
    let cx = 0, cy = 0, d = 0;
    P.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= P.length; cy /= P.length;
    P.forEach(q => { d += Math.hypot(q[0] - cx, q[1] - cy); }); d /= P.length;
    const k = d > 1e-12 ? Math.SQRT2 / d : 1;
    return [[k, 0, -k * cx], [0, k, -k * cy], [0, 0, 1]];
  }
  const applyT = (T, q) => [T[0][0] * q[0] + T[0][2], T[1][1] * q[1] + T[1][2]];
  // Rank-2 step: F (I − v vᵀ) removes the smallest singular direction v, which is the same as setting σ₃ = 0.
  function rank2(F) {
    const {values, vectors} = window.CV_VISION.eigSym(gram3(F), 3), v = vectors[2];
    return {F: F.map(r => { const d = dot3(r, v); return r.map((x, j) => x - d * v[j]); }), sv: values.map(x => Math.sqrt(Math.max(0, x)))};
  }
  function eightPoint(P1, P2, normalise) {
    const n = P1.length, T1 = normalise ? normaliser(P1) : I3, T2 = normalise ? normaliser(P2) : I3, G = new Float64Array(81);
    for (let i = 0; i < n; i++) {
      const a = applyT(T1, P1[i]), b = applyT(T2, P2[i]), row = [b[0] * a[0], b[0] * a[1], b[0], b[1] * a[0], b[1] * a[1], b[1], a[0], a[1], 1];
      for (let p = 0; p < 9; p++) for (let q = p; q < 9; q++) G[9 * p + q] += row[p] * row[q];
    }
    for (let p = 0; p < 9; p++) for (let q = 0; q < p; q++) G[9 * p + q] = G[9 * q + p];
    const {values, vectors} = window.CV_VISION.eigSym(G, 9), f = vectors[8], r2 = rank2([[f[0], f[1], f[2]], [f[3], f[4], f[5]], [f[6], f[7], f[8]]]);
    return {F: unitM(mm(mm(tr(T2), r2.F), T1)), svA: values.map(x => Math.sqrt(Math.max(0, x))), svF: r2.sv};
  }
  // Symmetric epipolar distance in pixels: the mean distance of x₂ from F x₁ and of x₁ from Fᵀx₂.
  function symDist(F, p1, p2) {
    const [a, b] = p1, [c, d] = p2, [f0, f1, f2] = F[0], [f3, f4, f5] = F[1], [f6, f7, f8] = F[2];
    const l0 = f0 * a + f1 * b + f2, l1 = f3 * a + f4 * b + f5, l2 = f6 * a + f7 * b + f8, m0 = f0 * c + f3 * d + f6, m1 = f1 * c + f4 * d + f7;
    const r = Math.abs(c * l0 + d * l1 + l2);
    return (r / (Math.hypot(l0, l1) || 1e-300) + r / (Math.hypot(m0, m1) || 1e-300)) / 2;
  }
  function ransacF(M, s, tau) {
    const g = window.CV_VISION.rng(4200 + 31 * s.seed), n = M.length;
    let best = null, need = MAXIT, it = 0;
    for (; it < need && it < MAXIT; it++) {
      const idx = [];
      while (idx.length < 8) { const k = Math.floor(g.next() * n); if (!idx.includes(k)) idx.push(k); }
      const est = eightPoint(idx.map(k => M[k].p1), idx.map(k => M[k].p2), true), inl = M.map(m => symDist(est.F, m.p1, m.p2) <= tau), count = inl.filter(Boolean).length;
      if (!best || count > best.count) {
        best = {count, inl};
        const w = count / n;
        need = w >= 1 ? 1 : w <= 0 ? MAXIT : Math.ceil(Math.log(.01) / Math.log(1 - w ** 8));
      }
    }
    const use = M.filter((m, k) => best.inl[k]), fit = use.length >= 8 ? eightPoint(use.map(m => m.p1), use.map(m => m.p2), true) : eightPoint(M.map(m => m.p1), M.map(m => m.p2), true);
    return {...fit, inl: best.inl, count: best.count, iters: it};
  }
  function triangulate(R, t, a, b) {   // a, b: normalised points (x, y, 1) in views 1 and 2; P₁ = [I | 0], P₂ = [R | t]
    const P2 = R.map((row, i) => [...row, t[i]]), rows = [[-1, 0, a[0], 0], [0, -1, a[1], 0], P2[2].map((v, j) => b[0] * v - P2[0][j]), P2[2].map((v, j) => b[1] * v - P2[1][j])], G = [];
    for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) G.push(rows.reduce((s, r) => s + r[p] * r[q], 0));
    const h = smallest(G, 4);
    return Math.abs(h[3]) < 1e-12 ? null : [h[0] / h[3], h[1] / h[3], h[2] / h[3]];
  }
  // E = KᵀFK, its SVD with det U = det V = +1, four candidate motions, and the one with most points in front of both cameras.
  function poseFromF(F, M) {
    const Ess = unitM(mm(mm(tr(KM), F), KM)), {values, vectors} = window.CV_VISION.eigSym(gram3(Ess), 3);
    const s1 = Math.sqrt(Math.max(values[0], 0)), s2 = Math.sqrt(Math.max(values[1], 0));
    if (s2 < 1e-9) return null;
    const v1 = Array.from(vectors[0]), v2 = Array.from(vectors[1]), u1 = mv(Ess, v1).map(x => x / s1), u2 = mv(Ess, v2).map(x => x / s2), u3 = cross(u1, u2);
    const U = tr([u1, u2, u3]), Vt = [v1, v2, cross(v1, v2)], pts = M.map(m => [mv(KI, hom(m.p1)), mv(KI, hom(m.p2))]);
    const cands = [];
    for (const Wm of [WM, tr(WM)]) for (const sg of [1, -1]) {
      const R = mm(mm(U, Wm), Vt), t = u3.map(x => sg * x);
      let front = 0;
      for (const [a, b] of pts) { const X = triangulate(R, t, a, b); if (X && X[2] > 0 && dot3(R[2], X) + t[2] > 0) front++; }
      cands.push({R, t, front});
    }
    return cands.sort((a, b) => b.front - a.front)[0];
  }
  const rotErr = (A, B) => { const M = mm(tr(A), B); return deg(Math.acos(Math.max(-1, Math.min(1, (M[0][0] + M[1][1] + M[2][2] - 1) / 2)))); };
  const dirErr = (a, b) => deg(Math.acos(Math.max(-1, Math.min(1, dot3(a, b) / (Math.hypot(...a) * Math.hypot(...b))))));
  function homographyError(M) {
    const P1 = M.map(m => m.p1), P2 = M.map(m => m.p2), T1 = normaliser(P1), T2 = normaliser(P2), G = new Float64Array(81);
    const add = row => { for (let p = 0; p < 9; p++) for (let q = 0; q < 9; q++) G[9 * p + q] += row[p] * row[q]; };
    M.forEach((m, i) => { const [x, y] = applyT(T1, P1[i]), [u, v] = applyT(T2, P2[i]); add([x, y, 1, 0, 0, 0, -u * x, -u * y, -u]); add([0, 0, 0, x, y, 1, -v * x, -v * y, -v]); });
    const h = smallest(G, 9), T2i = [[1 / T2[0][0], 0, -T2[0][2] / T2[0][0]], [0, 1 / T2[1][1], -T2[1][2] / T2[1][1]], [0, 0, 1]];
    const H = mm(mm(T2i, [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], h[8]]]), T1);
    return M.reduce((s, m) => { const w = mv(H, hom(m.p1)); return s + Math.hypot(w[0] / w[2] - m.p2[0], w[1] / w[2] - m.p2[1]); }, 0) / M.length;
  }
  function syncInputs(root, s, keys) {
    keys.forEach(k => {
      const el = root.querySelector('#vk-' + k);
      if (el && Number(el.value) !== s[k]) { el.value = s[k]; const out = root.querySelector(`#vk-${k}-value`); if (out) out.textContent = window.CV_VISION.fmt(s[k]); }
    });
  }
  const METHODS = [['raw', 'Eight-point on raw pixels'], ['hartley', 'Eight-point, Hartley-normalised'], ['ransac', 'Normalised eight-point inside RANSAC']];
  const lab = {
    name: 'epipolar', title: 'Epipolar lines from noisy matches',
    heading: 'Move camera 2. Estimate F. Click view 1.',
    intro: 'Sixty points in front of camera 1 are photographed by a second camera with X₂ = RX₁ + t; both images are 640 × 480 with f = 500 px. Matches get pixel noise, and some are replaced by wrong matches. Click view 1: its epipolar line appears in view 2, solid from the estimated F and dashed from the true one.',
    defaults: {tx: .8, tz: .3, yaw: 5, scene: 'cloud', noise: 1, outliers: 0, method: 'hartley', seed: 1, probe: null},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return range('tx', 'Sideways translation tₓ (m)', -1, 1, .1, s.tx) + range('tz', 'Forward translation t_z (m)', -1, 1, .1, s.tz) + range('yaw', 'Turn of camera 2 about the vertical axis (°)', -20, 20, 1, s.yaw) +
        select('scene', 'Scene', [['cloud', 'Points spread in depth (4–9 m)'], ['plane', 'All points on one tilted plane']], s.scene) +
        range('noise', 'Pixel noise σ (px)', 0, 3, .1, s.noise) + range('outliers', 'Fraction of wrong matches', 0, .5, .05, s.outliers) +
        select('method', 'Estimate of F to draw', METHODS, s.method) +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="reseed">New points ↻</button><button type="button" class="btn" data-vk-action="rotation">Pure rotation (t = 0)</button></div>' +
        '<div class="math-rule">x₂ᵀ F x₁ = 0,  l₂ = F x₁,  F = K⁻ᵀ [t]ₓ R K⁻¹</div>';
    },
    // Every block is a grid item of .vk-stage: min-width:0 lets it shrink to the card, and the table scrolls inside its own box.
    visual: () => '<style>#ep-table .vk-table th,#ep-table .vk-table td{white-space:normal;min-width:4.5em}#ep-table .vk-table td:first-child{min-width:10em}</style>' +
      '<div class="vk-pair" style="min-width:0"><div id="ep-v1" style="min-width:0"></div><div id="ep-v2" style="min-width:0"></div></div>' +
      '<p class="vk-legend" id="ep-legend" style="min-width:0"></p><div id="ep-table" style="min-width:0;max-width:100%;overflow-x:auto"></div>',
    note: 'Predict first: switch from the normalised to the raw-pixel eight-point estimate. Does the error grow by a little or by a lot? A lot: the same arithmetic on coordinates in the hundreds misses the matches by several pixels and turns the translation direction by tens of degrees. Then add 30% wrong matches: both least-squares estimates break, while RANSAC keeps a noise-level fit. Finally choose the planar scene: every estimate still fits the matches, and so does a homography, yet the translation recovered from E is off by tens of degrees, because a three-dimensional family of F explains the data. Press “Pure rotation”: the rotation is still found, but there is no baseline and no depth. SLAM initialisers fit both a homography and F for exactly this reason.',
    render(s, root) {
      const V = window.CV_VISION, {fmt} = V;
      syncInputs(root, s, ['tx', 'tz']);
      const v1 = root.querySelector('#ep-v1'), v2 = root.querySelector('#ep-v2');
      // Estimation depends only on the scene settings, so dragging the probe reuses it.
      const key = JSON.stringify([s.tx, s.tz, s.yaw, s.scene, s.noise, s.outliers, s.seed]);
      if (!memo || memo.key !== key) {
        const {R, t, M} = makeScene(s), genuine = M.filter(m => !m.out), tLen = Math.hypot(...t), tau = Math.max(1, 3 * s.noise);
        memo = {key, R, t, M, genuine, tLen, tau};
        if (M.length >= 8 && genuine.length >= 3) {
          const P1 = M.map(m => m.p1), P2 = M.map(m => m.p2), est = {raw: eightPoint(P1, P2, false), hartley: eightPoint(P1, P2, true), ransac: ransacF(M, s, tau)};
          const mean = F => genuine.reduce((a, m) => a + symDist(F, m.p1, m.p2), 0) / genuine.length;
          const summary = k => {
            const e = est[k], use = k === 'ransac' ? M.filter((m, i) => e.inl[i]) : M, pose = poseFromF(e.F, use.length >= 8 ? use : M);
            return {dist: mean(e.F), rot: pose ? rotErr(pose.R, R) : NaN, dir: pose && tLen > 1e-9 ? dirErr(pose.t, t) : NaN};
          };
          const Ftrue = tLen > 1e-9 ? unitM(mm(mm(tr(KI), mm(skew(t), R)), KI)) : null;
          Object.assign(memo, {est, Ftrue, floorDist: Ftrue ? mean(Ftrue) : NaN, rows: Object.fromEntries(METHODS.map(([k]) => [k, summary(k)])), h: homographyError(genuine)});
        }
      }
      const {M, genuine, tLen, tau, est, Ftrue, rows} = memo, n = M.length;
      if (!est) { v1.innerHTML = v2.innerHTML = ''; root.querySelector('#ep-table').innerHTML = ''; root.querySelector('#ep-legend').innerHTML = ''; return V.report([['Visible matches', `${n}: move camera 2 back so that at least 8 points stay in view`]]); }
      const cur = est[s.method], probe = s.probe || genuine[0].p1;
      // Draw both views as SVG in pixel coordinates.
      const L = (l, style) => { const sg = l && clipLine(l, 0, IW, 0, IH); return sg ? `<line x1="${sg[0][0].toFixed(1)}" y1="${sg[0][1].toFixed(1)}" x2="${sg[1][0].toFixed(1)}" y2="${sg[1][1].toFixed(1)}" style="${style}"/>` : ''; };
      // The title sits in a band above the image (y < 0), so points and lines can never cover it.
      const open = label => `<svg class="vk-plot" viewBox="${VB.join(' ')}" style="width:100%;height:auto;display:block" role="img" aria-label="${E(label)}"><title>${E(label)}</title><rect x="0" y="0" width="${IW}" height="${IH}" style="fill:var(--paper);stroke:var(--line);stroke-width:3"/>`;
      const every = Math.max(1, Math.floor(n / 10)), pencil = M.filter((m, k) => k % every === 0).slice(0, 10), faint = 'stroke:var(--blue);stroke-width:2;opacity:.35';
      const ransacOut = k => s.method === 'ransac' && !est.ransac.inl[k];
      const dots = side => M.map((m, k) => { const q = side ? m.p2 : m.p1; return (m.out ? `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="7" class="vk-vector" style="fill:none;stroke-width:3"/>` : `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="6" class="vk-dot" style="opacity:.8"/>`) + (ransacOut(k) ? `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="13" style="fill:none;stroke:var(--muted);stroke-width:2;stroke-dasharray:4 4"/>` : ''); }).join('');
      const epipole = (F, left) => { const e = smallest(gram3(left ? F : tr(F)), 3); return Math.abs(e[2]) > 1e-12 ? [e[0] / e[2], e[1] / e[2]] : null; };
      const mark = (e, name) => e && e[0] >= 0 && e[0] <= IW && e[1] >= 0 && e[1] <= IH ? `<path d="M${(e[0] - 12).toFixed(1)} ${(e[1] - 12).toFixed(1)}l24 24m0 -24l-24 24" style="stroke:var(--ink);stroke-width:4"/><text x="${(e[0] + 14).toFixed(1)}" y="${(e[1] - 12).toFixed(1)}" style="font-size:26px;fill:var(--ink)">${name}</text>` : '';
      const e1 = epipole(cur.F, true), e2 = epipole(cur.F, false);
      let a = open('View 1: matched points, a few epipolar lines and the clicked pixel'), b = open('View 2: the clicked pixel’s epipolar line from the estimated and the true F');
      pencil.forEach(m => { a += L(mv(tr(cur.F), hom(m.p2)), faint); b += L(mv(cur.F, hom(m.p1)), faint); });
      b += L(Ftrue && mv(Ftrue, hom(probe)), 'stroke:var(--ink);stroke-width:3;stroke-dasharray:14 10') + L(mv(cur.F, hom(probe)), 'stroke:var(--orange);stroke-width:5');
      a += dots(0) + mark(e1, 'e₁') + `<circle cx="${probe[0].toFixed(1)}" cy="${probe[1].toFixed(1)}" r="12" style="fill:none;stroke:var(--orange);stroke-width:5"/><path d="M${probe[0] - 20} ${probe[1]}h40M${probe[0]} ${probe[1] - 20}v40" style="stroke:var(--orange);stroke-width:2.5"/>`;
      b += dots(1) + mark(e2, 'e₂');
      a += `<text x="0" y="-14" style="font-size:28px;fill:var(--ink)">View 1 · click to probe</text></svg>`;
      b += `<text x="0" y="-14" style="font-size:28px;fill:var(--ink)">View 2</text></svg>`;
      v1.innerHTML = a; v2.innerHTML = b;
      root.querySelector('#ep-legend').innerHTML = '<span><span class="vk-key vk-key-vector" style="margin-right:5px"></span>epipolar line of the clicked pixel (estimated F)</span><span><span class="vk-key" style="background:var(--ink);margin-right:5px"></span>the same line from the true F (dashed)</span><span><span class="vk-key vk-key-eig1" style="margin-right:5px"></span>epipolar lines of ten matches; they meet at the epipoles e₁, e₂</span><span>Dots: genuine matches · orange rings: wrong matches' + (s.method === 'ransac' ? ' · dashed rings: rejected by RANSAC' : '') + '</span>';
      const cell = (v, unit, d = 2) => Number.isFinite(v) ? `${fmt(Math.abs(v) < .005 ? 0 : v, d)}${unit}` : '—';
      const tableRow = (k, label) => { const rw = rows[k], on = k === s.method; return `<tr${on ? ' style="font-weight:700"' : ''}><td>${E(label)}${on ? ' ◀' : ''}</td><td>${cell(rw.dist, ' px')}</td><td>${cell(rw.rot, '°')}</td><td>${tLen > 1e-9 ? cell(rw.dir, '°', 1) : 'none: t = 0'}</td></tr>`; };
      root.querySelector('#ep-table').innerHTML = `<div style="overflow-x:auto"><table class="vk-table"><thead><tr><th>Estimate of F</th><th>Mean epipolar distance, genuine matches</th><th>Rotation error of the pose from E</th><th>Direction error of t</th></tr></thead><tbody><tr><td>True F (the noise floor)</td><td>${Ftrue ? cell(memo.floorDist, ' px') : 'none: t = 0'}</td><td>0°</td><td>0°</td></tr>${METHODS.map(([k, label]) => tableRow(k, k === 'ransac' ? `${label} (${est.ransac.count} inliers)` : label)).join('')}</tbody></table></div>`;
      const sv = est.hartley.svA, h = memo.h, floor = Math.max(.3, 1.6 * s.noise) + .2;
      const where = e => !e ? 'at infinity' : e[0] >= 0 && e[0] <= IW && e[1] >= 0 && e[1] <= IH ? `(${fmt(e[0], 0)}, ${fmt(e[1], 0)}) px, inside the image` : `(${fmt(e[0], 0)}, ${fmt(e[1], 0)}) px, outside the image`;
      return V.report([
        ['Visible matches', `${n} (${n - genuine.length} wrong)`],
        ['Smallest singular values of the normalised A ÷ σ₁', `${sv.slice(6).map(x => fmt(x / sv[0], 4)).join(', ')}`],
        ['σ₃ / σ₁ of F before the rank-2 step', fmt(cur.svF[2] / cur.svF[0], 4)],
        ['Homography fitted to the genuine matches', `${fmt(h, 2)} px mean transfer error${h < floor ? ': a homography explains them, so F is not determined' : ''}`],
        ['Epipole e₂ of the drawn F', where(e2)],
        ['RANSAC', `${est.ransac.iters} samples, ${est.ransac.count} of ${n} inliers, τ = ${fmt(tau, 1)} px`],
      ]);
    },
    wire(root, s, rerender) {
      const host = root.querySelector('#ep-v1');
      if (!host) return;
      host.style.touchAction = 'none'; host.style.cursor = 'crosshair';
      const pick = e => {
        const svg = host.querySelector('svg'); if (!svg) return;
        const box = svg.getBoundingClientRect(); if (!box.width) return;
        const u = (e.clientX - box.left) / box.width * VB[2] + VB[0], v = (e.clientY - box.top) / box.height * VB[3] + VB[1];
        s.probe = [Math.max(0, Math.min(IW, u)), Math.max(0, Math.min(IH, v))]; rerender();
      };
      host.addEventListener('pointerdown', e => { e.preventDefault(); try { host.setPointerCapture(e.pointerId); } catch {} pick(e); });
      host.addEventListener('pointermove', e => { if (host.hasPointerCapture?.(e.pointerId)) pick(e); });
    },
    action(name, s) { if (name === 'reseed') s.seed++; if (name === 'rotation') { s.tx = 0; s.tz = 0; } },
  };

  window.CV_EXTEND.lesson(61, {
    teaching: {
      equation: Q`\hat x_2^{T}E\,\hat x_1=0,\quad E=[t]_\times R,\qquad x_2^{T}F\,x_1=0,\quad F=K_2^{-T}E\,K_1^{-1}`,
      symbols: [['E', 'essential matrix (normalised points)'], ['F', 'fundamental matrix (pixels)'], ['x̂', 'normalised image point K⁻¹x'], ['[t]×', 'cross-product matrix of t'], ['l₂', 'epipolar line F x₁ in image 2']],
      connection: 'Structure from motion (COLMAP), visual odometry and SLAM start from the relative pose of two views; stereo systems search for matches along epipolar lines; matcher benchmarks score the pose recovered from E; and NeRF and Gaussian splatting train on camera poses estimated this way.',
      trap: 'E acts on normalised points K⁻¹x and F on pixels. Plugging pixels into E, or skipping the normalisation or the rank-2 step of the eight-point algorithm, gives epipolar lines that miss the matches by many pixels.',
      question: 'A camera steps straight sideways between two shots: R = I, t = (1, 0, 0). What do the epipolar lines in the second image look like?',
      choices: ['Horizontal lines, parallel to the baseline', 'Lines through the image centre', 'Vertical lines'], correct: 0,
      explanation: 'The epipole e₂ ≃ t = (1, 0, 0) has last coordinate 0: a point at infinity along x, so every epipolar line is horizontal. For x̂₁ = (0.25, 0.5, 1), l₂ = E x̂₁ = (0, −1, 0.5), the line y = 0.5. Lines through the centre belong to forward motion.',
    },
    guide: {
      title: 'A match must lie on its epipolar line',
      paragraphs: [
        'From one image a point could lie anywhere along its ray. A second camera sees that ray as a line, so the match of a point must lie on one line in the other image, its epipolar line. The two camera centres and the point span one plane; writing that coplanarity with a cross product gives x̂₂ᵀEx̂₁ = 0 with E = [t]×R in normalised coordinates, and x₂ᵀFx₁ = 0 with F = K₂⁻ᵀEK₁⁻¹ in pixels.',
        'Each match gives one linear equation in the nine entries of F, so eight matches determine it as a null vector, once the coordinates are normalised; afterwards F is forced to rank 2. Inside RANSAC the estimate survives wrong matches, and the SVD of E gives back the rotation and the direction of the translation.',
      ],
      example: 'One point, two views: the match slides along its epipolar line',
      controls: [{label: 'Forward part of the step t_z (t = (1, 0, t_z))', min: -.5, max: .5, step: .1, value: 0}, {label: 'Turn of camera 2 about the vertical axis (°)', min: -20, max: 20, step: 5, value: 0}, {label: 'Depth Z of the point along its ray', min: 2, max: 10, step: 1, value: 4}],
      predict: 'Move the point deeper along its ray. Does its image in view 2 leave the epipolar line?',
      takeaway: 'The epipolar line depends only on x̂₁ and the camera motion. Depth only slides the match along it, from the epipole (depth 0) towards the image of the ray at infinite depth, so x̂₂ᵀEx̂₁ = 0 holds at every depth and a two-view matcher only has to search along one line.',
      notation: 'X₁ and X₂ are the point in the two camera frames, with X₂ = RX₁ + t. x̂ = (X/Z, Y/Z, 1) is a normalised image point. [t]× is the cross-product matrix of t (Lesson 49), E = [t]×R the essential matrix, l₂ = E x̂₁ the epipolar line a·x + b·y + c = 0 in view 2, and e₂ ≃ t the epipole.',
    },
    notation: {
      E: {tex: 'E', detail: 'The essential matrix [t]×R of two calibrated cameras. It acts on normalised points x̂ = K⁻¹x, has rank 2 with singular values (σ, σ, 0), and has five degrees of freedom because the length of t cannot be recovered.'},
      F: {tex: 'F', detail: 'The fundamental matrix K₂⁻ᵀEK₁⁻¹, which acts on pixel coordinates. It is defined up to scale and has det F = 0, so it has 7 degrees of freedom; F x₁ is the epipolar line of x₁ in image 2.'},
      'x̂': {tex: Q`\hat x`, detail: 'A normalised image point (X/Z, Y/Z, 1): a pixel with the intrinsics removed, x̂ = K⁻¹x. Here the hat means normalised, not estimated.'},
      '[t]×': {tex: Q`[t]_\times`, detail: 'The 3 × 3 skew matrix with [t]× v = t × v (Lesson 49). t is the translation in X₂ = RX₁ + t, the position of camera 1’s centre seen from camera 2.'},
      'l₂': {tex: 'l_2', detail: 'The epipolar line in image 2, stored as (a, b, c) for the line ax + by + c = 0. Every match of x₁ lies on l₂ = F x₁, and every epipolar line in image 2 passes through the epipole e₂.'},
    },
    calculate, practice, lab,
  });
})();
