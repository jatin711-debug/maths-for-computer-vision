/* Lesson 68: 3D Gaussian splatting. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const bm = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;

  /* ---------- Worked example: project one Gaussian ---------- */
  const F = 100, VAR = [.01, .01, .04];   // focal length in px; variances along the Gaussian's own x, y and z axes
  function model(p) {
    const [x, z, deg, o] = p, th = deg * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    // Σ = R_y(θ) diag(VAR) R_y(θ)ᵀ: a rotation about the vertical axis mixes the x and depth variances.
    const Sxx = VAR[0] * c * c + VAR[2] * s * s, Szz = VAR[0] * s * s + VAR[2] * c * c, Sxz = (VAR[2] - VAR[0]) * s * c, Syy = VAR[1];
    const a = F / z, b = -F * x / (z * z);
    const S2xx = a * a * Sxx + 2 * a * b * Sxz + b * b * Szz, S2yy = a * a * Syy;
    const d2 = 25 / S2xx, alpha = o * Math.exp(-.5 * d2);
    return {x, z, deg, o, c, s, Sxx, Szz, Sxz, Syy, a, b, S2xx, S2yy, d2, alpha};
  }
  function drawing(m) {
    const txt = (x, y, s, color = '#64736b', size = 12, anchor = 'start', weight = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}>${E(s)}</text>`;
    // Left: seen from above (x across, depth z up). The ellipse is the 2σ contour of the x–z covariance.
    const X = v => 140 + v * 80, Y = v => 222 - v * 42;
    let body = txt(20, 18, 'Seen from above: camera and Gaussian (2σ)', '#172623', 12.5);
    body += `<path d="M${X(0)} ${Y(0)}L${X(-1.4)} ${Y(4.6)}M${X(0)} ${Y(0)}L${X(1.4)} ${Y(4.6)}" stroke="#a8b6a5" stroke-dasharray="3 4"/><path d="M${X(0)} ${Y(0)}V${Y(4.6)}" stroke="#d5d9cf"/>`;
    body += `<path d="M${X(0) - 9} ${Y(0) + 6}h18l-4 -10h-10z" fill="#172623"/>` + txt(X(0) + 12, Y(0) + 2, 'camera', '#172623', 11);
    const ev = Math.sqrt(Math.max(0, ((m.Sxx - m.Szz) / 2) ** 2 + m.Sxz ** 2)), l1 = (m.Sxx + m.Szz) / 2 + ev, l2 = (m.Sxx + m.Szz) / 2 - ev, ang = .5 * Math.atan2(2 * m.Sxz, m.Sxx - m.Szz);
    const pts = Array.from({length: 49}, (_, i) => { const t = i / 48 * 2 * Math.PI, u = 2 * Math.sqrt(l1) * Math.cos(t), w = 2 * Math.sqrt(l2) * Math.sin(t); return [m.x + u * Math.cos(ang) - w * Math.sin(ang), m.z + u * Math.sin(ang) + w * Math.cos(ang)]; });
    body += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}Z" fill="#bd431c33" stroke="#bd431c" stroke-width="2"/><circle cx="${X(m.x).toFixed(1)}" cy="${Y(m.z).toFixed(1)}" r="3" fill="#bd431c"/>`;
    body += `<path d="M${X(0)} ${Y(0)}L${X(m.x).toFixed(1)} ${Y(m.z).toFixed(1)}" stroke="#315c86" stroke-width="1.4"/>`;
    for (let v = 1; v <= 4; v++) body += txt(X(-1.75), Y(v) + 4, `z = ${v}`, '#64736b', 10);
    // Right: the projected splat in pixels, with 1σ and 2σ contours and the pixel 5 px to the right.
    const sx = Math.sqrt(m.S2xx), sy = Math.sqrt(m.S2yy), k = Math.min(4, 92 / (2 * Math.max(sx, sy, 5))), cx = 420, cy = 128;
    body += txt(305, 18, 'Projected splat on the image (pixels)', '#172623', 12.5);
    body += `<path d="M${cx - 110} ${cy}H${cx + 110}M${cx} ${cy - 100}V${cy + 100}" stroke="#d5d9cf"/>`;
    body += `<ellipse cx="${cx}" cy="${cy}" rx="${(2 * sx * k).toFixed(1)}" ry="${(2 * sy * k).toFixed(1)}" fill="#bd431c1f" stroke="#bd431c" stroke-dasharray="5 3"/><ellipse cx="${cx}" cy="${cy}" rx="${(sx * k).toFixed(1)}" ry="${(sy * k).toFixed(1)}" fill="#bd431c33" stroke="#bd431c" stroke-width="2"/>`;
    body += `<circle cx="${(cx + 5 * k).toFixed(1)}" cy="${cy}" r="4" fill="#315c86"/>` + txt((cx + 5 * k + 6).toFixed(1), cy - 8, `5 px right: α = ${N(m.alpha)}`, '#315c86', 11.5, 'start', '700');
    body += txt(305, 236, `σ′ₓ = ${N(sx, 2)} px, σ′ᵧ = ${N(sy, 2)} px (inner: 1σ, dashed: 2σ)`, '#64736b', 11);
    return {body, caption: `Left: from above, the Gaussian at x = ${N(m.x, 2)}, z = ${N(m.z, 2)}, rotated by ${N(m.deg, 0)}° about the vertical axis; the blue line is the ray to its centre. Right: its projection Σ′ = JΣJᵀ on the image, drawn ${N(k, 2)} times enlarged. Off the optical axis, or when turned, the 0.2 m depth extent is seen at an angle and widens the splat horizontally.`};
  }
  function calculate(p) {
    const m = model(p);
    return {
      steps: [
        step('Build Σ from a rotation and a scale', Q`\Sigma=R_y(\theta)\operatorname{diag}(0.01,\,0.01,\,0.04)R_y(\theta)^T=${bm([[m.Sxx, 0, m.Sxz], [0, m.Syy, 0], [m.Sxz, 0, m.Szz]])}`, `With θ = ${N(m.deg, 0)}° the Gaussian’s long (depth) axis is turned ${N(m.deg, 0)}° about the vertical, so the x and z variances mix: Σxz = (0.04 − 0.01) sin θ cos θ = ${N(m.Sxz, 4)}. RSSᵀRᵀ is a valid covariance for any angle.`),
        step('Linearise the projection: the Jacobian', Q`J=\begin{bmatrix}f/z&0&-fx/z^2\\0&f/z&-fy/z^2\end{bmatrix}=${bm([[m.a, 0, m.b], [0, m.a, 0]])}`, `At x = ${N(m.x, 2)}, y = 0 and z = ${N(m.z, 2)} with f = 100 px. f/z says how many pixels one metre sideways covers; −fx/z² says how far the image point slides when the depth changes, which is zero only on the optical axis.`),
        step('Project the covariance', Q`\Sigma'=J\Sigma J^T=${bm([[m.S2xx, 0], [0, m.S2yy]])}\ \text{px}^2,\qquad \Sigma'_{xx}=(f/z)^2\Sigma_{xx}+2(f/z)(-fx/z^2)\Sigma_{xz}+(fx/z^2)^2\Sigma_{zz}`, `This is the rule Cov(Ax) = AΣAᵀ with A = J (here the camera rotation W is the identity). The splat has standard deviations ${N(Math.sqrt(m.S2xx), 2)} px across and ${N(Math.sqrt(m.S2yy), 2)} px up.`),
        step('Evaluate the footprint 5 px to the right', Q`\alpha=o\,e^{-\frac12d^2},\quad d^2=\frac{5^2}{${N(m.S2xx, 3)}}=${N(m.d2)},\quad \alpha=${N(m.o, 2)}\,e^{-${N(m.d2 / 2)}}=${N(m.alpha)}`, 'This is the splat’s opacity at that pixel. Front-to-back compositing then weights its colour by α times the transmittance left by the splats in front of it.'),
      ],
      values: [['3D covariance Sigma_xz', m.Sxz], ['Jacobian entry J13', m.b], ['Projected variance Sigma\'_xx (px^2)', m.S2xx], ['Projected variance Sigma\'_yy (px^2)', m.S2yy], ['Alpha 5 px right of the centre', m.alpha]],
      note: 'Set x = 0 and θ = 0: the splat is round, 5 px in both directions at z = 2. Move x to 1 or turn θ to 90°: the depth extent appears sideways and the splat widens. Doubling z halves both standard deviations, exactly as perspective shrinks an object.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const dec = (x, d = 4) => Number(x.toFixed(d)).toString();
  const tup = v => `(${v.map(x => dec(x)).join(', ')})`;
  const COLS = {red: [1, 0, 0], green: [0, 1, 0], blue: [0, 0, 1]};
  const practice = [
    {key: 'project-covariance', skill: 'Project a 3D covariance to the image', make(r) {
      const f = r.pick([100, 200, 400]), z = r.pick([1, 2, 2.5, 4, 5]), x = r.int(-4, 4) / 4, y = r.int(-4, 4) / 4, v = [r.pick([.01, .04, .09]), r.pick([.01, .04]), r.pick([.01, .04, .09, .16])];
      const a = f / z, bx = -f * x / (z * z), by = -f * y / (z * z), Sxx = a * a * v[0] + bx * bx * v[2], Syy = a * a * v[1] + by * by * v[2], Sxy = bx * by * v[2];
      return {prompt: Q`A camera with f = ${f} px and W = I sees a Gaussian centred at \((${x},\ ${y},\ ${z})\) with \(\Sigma=\operatorname{diag}(${v.join(',\ ')})\). Compute \(\Sigma'=J\Sigma J^T\): its entries \(\Sigma'_{xx}\), \(\Sigma'_{yy}\) and \(\Sigma'_{xy}\) in px².`,
        answers: [{label: Q`\(\Sigma'_{xx}\)`, value: Sxx, tol: .01, rel: .002}, {label: Q`\(\Sigma'_{yy}\)`, value: Syy, tol: .01, rel: .002}, {label: Q`\(\Sigma'_{xy}\)`, value: Sxy, tol: .01, rel: .002}],
        hint: Q`\(J=\begin{bmatrix}f/z&0&-fx/z^2\\0&f/z&-fy/z^2\end{bmatrix}\). With a diagonal Σ, \(\Sigma'_{ij}=\sum_kJ_{ik}J_{jk}\Sigma_{kk}\).`,
        solution: Q`\(f/z=${dec(a)}\), \(-fx/z^2=${dec(bx)}\), \(-fy/z^2=${dec(by)}\). \(\Sigma'_{xx}=${dec(a)}^2\cdot${v[0]}+(${dec(bx)})^2\cdot${v[2]}=${dec(Sxx)}\), \(\Sigma'_{yy}=${dec(a)}^2\cdot${v[1]}+(${dec(by)})^2\cdot${v[2]}=${dec(Syy)}\), \(\Sigma'_{xy}=(${dec(bx)})(${dec(by)})\cdot${v[2]}=${dec(Sxy)}\). ${Sxy ? 'The off-diagonal term tilts the splat: the depth extent is seen at an angle in both directions.' : 'The off-diagonal term is 0 because the centre lies on an image axis.'}`};
    }},
    {key: 'rotated-covariance', skill: 'Build a covariance from a rotation and scales', make(r) {
      const deg = r.pick([30, 45, 60, 90, 120, 135, 150]), s1 = r.pick([1, 2, 3]), s2 = r.pick([.5, 1, 2].filter(v => v !== s1)), t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
      const a = s1 * s1, b = s2 * s2, xx = a * c * c + b * s * s, yy = a * s * s + b * c * c, xy = (a - b) * s * c;
      return {prompt: Q`In 2D, a Gaussian has standard deviations ${s1} and ${s2} along its own axes and is rotated by ${deg}°. Compute \(\Sigma=R(${deg}^\circ)\operatorname{diag}(${a},\ ${b})R(${deg}^\circ)^T\): \(\Sigma_{xx}\), \(\Sigma_{yy}\), \(\Sigma_{xy}\) and \(\det\Sigma\).`,
        answers: [{label: Q`\(\Sigma_{xx}\)`, value: xx, tol: .01}, {label: Q`\(\Sigma_{yy}\)`, value: yy, tol: .01}, {label: Q`\(\Sigma_{xy}\)`, value: xy, tol: .01}, {label: Q`\(\det\Sigma\)`, value: a * b, tol: .01}],
        hint: Q`With \(c=\cos\theta\), \(s=\sin\theta\): \(\Sigma_{xx}=s_1^2c^2+s_2^2s^2\), \(\Sigma_{yy}=s_1^2s^2+s_2^2c^2\), \(\Sigma_{xy}=(s_1^2-s_2^2)sc\).`,
        solution: Q`\(c=${dec(c)}\), \(s=${dec(s)}\). \(\Sigma_{xx}=${a}\cdot${dec(c * c)}+${b}\cdot${dec(s * s)}=${dec(xx)}\), \(\Sigma_{yy}=${a}\cdot${dec(s * s)}+${b}\cdot${dec(c * c)}=${dec(yy)}\), \(\Sigma_{xy}=(${a}-${b})\cdot${dec(s)}\cdot(${dec(c)})=${dec(xy)}\). \(\det\Sigma=${a}\cdot${b}=${dec(a * b)}\) for every angle: rotating changes the orientation, not the area.`};
    }},
    {key: 'splat-alpha', skill: 'Evaluate a splat’s opacity at a pixel', make(r) {
      const vx = r.pick([4, 9, 16, 25]), vy = r.pick([4, 9, 16, 25]), o = r.pick([.5, .6, .8, .9, 1]), dx = r.int(-5, 5), dy = r.int(-4, 4), d2 = dx * dx / vx + dy * dy / vy, al = o * Math.exp(-.5 * d2);
      return {prompt: Q`A splat has opacity ${o} and \(\Sigma'=\operatorname{diag}(${vx},\ ${vy})\) px². What is its α at the pixel offset \((${dx},\ ${dy})\) px from its centre?`,
        answers: [{label: Q`\(d^2\)`, value: d2, tol: .002}, {label: Q`\(\alpha\)`, value: al, tol: .002}],
        hint: Q`With a diagonal \(\Sigma'\), \(d^2=\Delta x^2/\Sigma'_{xx}+\Delta y^2/\Sigma'_{yy}\), and \(\alpha=o\,e^{-d^2/2}\).`,
        solution: Q`\(d^2=${dx * dx}/${vx}+${dy * dy}/${vy}=${dec(d2)}\), so \(\alpha=${o}\,e^{-${dec(d2 / 2)}}=${dec(al)}\). Renderers skip a splat at pixels where α falls below 1/255.`};
    }},
    {key: 'composite-splats', skill: 'Composite depth-sorted splats', make(r) {
      const names = r.shuffle(['red', 'green', 'blue']), al = names.map(() => r.int(2, 9) / 10);
      let T = 1; const C = [0, 0, 0], Ts = [];
      names.forEach((nm, i) => { Ts.push(T); COLS[nm].forEach((v, k) => { C[k] += T * al[i] * v; }); T *= 1 - al[i]; });
      return {prompt: Q`Three splats cover one pixel. From front to back they are ${names.map((nm, i) => `${nm} (α = ${al[i]})`).join(', ')}. Composite them front to back: what is the pixel colour (R, G, B) before the background, and what transmittance is left?`,
        answers: [{label: '(R, G, B)', vector: C, tol: .002}, {label: 'Transmittance left', value: T, tol: .0005}],
        hint: Q`Each splat adds \(T\alpha c\), then multiplies T by \(1-\alpha\). T starts at 1.`,
        solution: Q`Transmittances \(${tup(Ts)}\), weights \(${tup(Ts.map((t, i) => t * al[i]))}\). Colour \(${tup(C)}\); transmittance left \(${al.map(a => dec(1 - a)).join('\\cdot')}=${dec(T)}\), the same in any order, although the colour is not.`};
    }},
    {key: 'sort-order', skill: 'See what a wrong depth order does', make(r) {
      const a1 = r.int(3, 9) / 10, a2 = r.int(3, 9) / 10, c1 = r.int(0, 10) / 10, c2 = r.int(0, 10) / 10;
      const right = a1 * c1 + (1 - a1) * a2 * c2, wrong = a2 * c2 + (1 - a2) * a1 * c1;
      return {prompt: Q`Two grey splats overlap at a pixel. The near one has α = ${a1} and intensity ${c1}; the far one has α = ${a2} and intensity ${c2}. Composite them in the correct order (near first), then in the wrong order (far first). Ignore the background.`,
        answers: [{label: 'Correct order', value: right, tol: .002}, {label: 'Wrong order', value: wrong, tol: .002}],
        hint: Q`Near first: \(\alpha_1c_1+(1-\alpha_1)\alpha_2c_2\). Far first swaps the roles.`,
        solution: Q`Correct: \(${a1}\cdot${c1}+${dec(1 - a1)}\cdot${a2}\cdot${c2}=${dec(right)}\). Wrong: \(${a2}\cdot${c2}+${dec(1 - a2)}\cdot${a1}\cdot${c1}=${dec(wrong)}\). The difference, ${dec(right - wrong)}, is what an unsorted renderer gets wrong; the transmittance \(${dec((1 - a1) * (1 - a2))}\) is the same either way.`};
    }},
    {key: 'quaternion-rotation', skill: 'Turn a unit quaternion into a rotation', make(r) {
      const deg = r.pick([30, 60, 90, 120, 180, 45, 135]), h = deg * Math.PI / 360, w = Math.cos(h), z = Math.sin(h), R11 = 1 - 2 * z * z, R21 = 2 * w * z;
      return {prompt: Q`A Gaussian is rotated by ${deg}° about the z-axis. Write its unit quaternion \(q=(w,0,0,z)\) and the rotation-matrix entries \(R_{11}=1-2z^2\) and \(R_{21}=2wz\).`,
        answers: [{label: 'w', value: w, tol: .002}, {label: 'z', value: z, tol: .002}, {label: Q`\(R_{11}\)`, value: R11, tol: .002}, {label: Q`\(R_{21}\)`, value: R21, tol: .002}],
        hint: Q`\(q=(\cos\tfrac\theta2,\ \sin\tfrac\theta2\,n)\) with \(n=(0,0,1)\). Check: \(R_{11}\) should equal \(\cos\theta\) and \(R_{21}\) should equal \(\sin\theta\).`,
        solution: Q`\(\theta/2=${deg / 2}^\circ\), so \(w=${dec(w)}\) and \(z=${dec(z)}\). \(R_{11}=1-2\cdot${dec(z * z)}=${dec(R11)}=\cos${deg}^\circ\) and \(R_{21}=2\cdot${dec(w)}\cdot${dec(z)}=${dec(R21)}=\sin${deg}^\circ\). The quaternion \(-q\) gives the same rotation.`};
    }},
  ];

  /* ---------- Lab: about 600 Gaussians lifted from the coffee photo onto a synthetic depth map ---------- */
  const W = 240, H = 160, CELL = 8, FL = 220, CX = 120, CY = 80, PIVOT = 2.9, BG = [.92, .92, .9];
  function tableDepth(u, v) { return 2.4 + 1.0 * (1 - v / H); }
  function sceneDepth(u, v) {
    let z = tableDepth(u, v);
    const sau = ((u - 111) / 82) ** 2 + ((v - 89) / 61) ** 2, cup = ((u - 115) / 47) ** 2 + ((v - 64) / 58) ** 2;
    if (sau < 1) z -= .12;
    if (cup < 1) z -= .25 + .35 * Math.sqrt(1 - cup);
    return z;
  }
  function build(img) {
    const G = [];
    for (let gy = 0; gy < H / CELL; gy++) for (let gx = 0; gx < W / CELL; gx++) {
      let r = 0, g = 0, b = 0;
      for (let y = gy * CELL; y < gy * CELL + CELL; y++) for (let x = gx * CELL; x < gx * CELL + CELL; x++) { const i = 4 * (y * W + x); r += img.rgba[i]; g += img.rgba[i + 1]; b += img.rgba[i + 2]; }
      const n = CELL * CELL * 255, u = (gx + .5) * CELL, v = (gy + .5) * CELL, z = sceneDepth(u, v);
      G.push({mu: [(u - CX) * z / FL, (v - CY) * z / FL, z], col: [r / n, g / n, b / n], sxy: .55 * CELL * z / FL});
    }
    return G;
  }
  // Project every Gaussian for the current view: camera yaw φ about the vertical axis through (0, 0, PIVOT).
  function project(G, s) {
    const ph = s.yaw * Math.PI / 180, c = Math.cos(ph), sn = Math.sin(ph), out = [];
    G.forEach((g, i) => {
      const px = g.mu[0], py = g.mu[1], pz = g.mu[2] - PIVOT;
      const t = [c * px + sn * pz, py, -sn * px + c * pz + PIVOT];
      if (t[2] < .3) return;
      // Σ = diag(sxy², sxy², s_z²) in the world (no rotation); Σ_cam = W Σ Wᵀ with W = R_y(φ).
      const sx2 = (g.sxy * s.size) ** 2, sz2 = s.thick ** 2;
      const Cxx = c * c * sx2 + sn * sn * sz2, Czz = sn * sn * sx2 + c * c * sz2, Cxz = (sz2 - sx2) * c * sn, Cyy = sx2;
      const a = FL / t[2], bx = -FL * t[0] / (t[2] * t[2]), by = -FL * t[1] / (t[2] * t[2]);
      // Σ′ = J Σ_cam Jᵀ with J = [[a, 0, bx], [0, a, by]]
      let sxx = a * a * Cxx + 2 * a * bx * Cxz + bx * bx * Czz, syy = a * a * Cyy + by * by * Czz, sxy = a * by * Cxz + bx * by * Czz;
      if (s.lowpass) { sxx += .3; syy += .3; }
      const det = sxx * syy - sxy * sxy;
      if (!(det > 1e-9)) return;
      const tr = (sxx + syy) / 2, lmax = tr + Math.sqrt(Math.max(0, tr * tr - det));
      out.push({i, t, u: FL * t[0] / t[2] + CX, v: FL * t[1] / t[2] + CY, sxx, syy, sxy, ixx: syy / det, iyy: sxx / det, ixy: -sxy / det, rad: 3 * Math.sqrt(lmax), col: G[i].col, cam: [Cxx, Cyy, Czz, Cxz], J: [a, bx, by]});
    });
    return out;
  }
  function composite(P, order, o) {
    const n = W * H, C = new Float32Array(3 * n), T = new Float32Array(n).fill(1);
    let blends = 0;
    for (const p of order) {
      const x0 = Math.max(0, Math.floor(p.u - p.rad)), x1 = Math.min(W - 1, Math.ceil(p.u + p.rad)), y0 = Math.max(0, Math.floor(p.v - p.rad)), y1 = Math.min(H - 1, Math.ceil(p.v + p.rad));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const k = y * W + x; if (T[k] < 1e-4) continue;
        const dx = x + .5 - p.u, dy = y + .5 - p.v, q = p.ixx * dx * dx + 2 * p.ixy * dx * dy + p.iyy * dy * dy, al = Math.min(.99, o * Math.exp(-.5 * q));
        if (al < 1 / 255) continue;
        const wgt = T[k] * al; C[3 * k] += wgt * p.col[0]; C[3 * k + 1] += wgt * p.col[1]; C[3 * k + 2] += wgt * p.col[2]; T[k] *= 1 - al; blends++;
      }
    }
    const rgba = new Uint8ClampedArray(4 * n);
    for (let k = 0; k < n; k++) for (let ch = 0; ch < 3; ch++) rgba[4 * k + ch] = 255 * (C[3 * k + ch] + T[k] * BG[ch]);
    for (let k = 0; k < n; k++) rgba[4 * k + 3] = 255;
    return {rgba, blends};
  }
  // Painter's algorithm: back to front with the "over" operator, C ← αc + (1 − α)C. Same picture as front to back.
  function paintBackToFront(P, o) {
    const n = W * H, C = new Float32Array(3 * n);
    for (let k = 0; k < n; k++) for (let ch = 0; ch < 3; ch++) C[3 * k + ch] = BG[ch];
    for (const p of P) {
      const x0 = Math.max(0, Math.floor(p.u - p.rad)), x1 = Math.min(W - 1, Math.ceil(p.u + p.rad)), y0 = Math.max(0, Math.floor(p.v - p.rad)), y1 = Math.min(H - 1, Math.ceil(p.v + p.rad));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const k = y * W + x, dx = x + .5 - p.u, dy = y + .5 - p.v, q = p.ixx * dx * dx + 2 * p.ixy * dx * dy + p.iyy * dy * dy, al = Math.min(.99, o * Math.exp(-.5 * q));
        if (al < 1 / 255) continue;
        for (let ch = 0; ch < 3; ch++) C[3 * k + ch] = al * p.col[ch] + (1 - al) * C[3 * k + ch];
      }
    }
    const rgba = new Uint8ClampedArray(4 * n);
    for (let k = 0; k < n; k++) { for (let ch = 0; ch < 3; ch++) rgba[4 * k + ch] = 255 * C[3 * k + ch]; rgba[4 * k + 3] = 255; }
    return {rgba};
  }
  const ORDERS = {front: 'Sorted by depth, front to back', back: 'Sorted, back to front (painter’s “over”)', storage: 'Unsorted: storage order', wrong: 'Sorted the wrong way (far splats first)'};
  const lab = {
    name: 'splat', title: 'Rendering with Gaussian splats', photo: 'coffee',
    heading: 'Orbit the splats. Break the sort.',
    intro: 'Each 8 × 8 block of the coffee photo becomes one 3D Gaussian: its colour, placed at a depth from a simple synthetic depth map (a tilted table, a raised saucer and a rounded cup), and flattened in depth like a coin facing the camera. 600 Gaussians are projected with Σ′ = JWΣWᵀJᵀ and composited per pixel. Click a splat to inspect it.',
    defaults: {yaw: 20, order: 'front', thick: .04, size: 1.3, opacity: .9, lowpass: true, marks: true, sel: -1},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return range('yaw', 'Orbit the camera: yaw φ (degrees)', -45, 45, 1, s.yaw) + select('order', 'Compositing order', Object.entries(ORDERS), s.order) +
        range('thick', 'Depth thickness s_z of each Gaussian', .01, .3, .01, s.thick) + range('size', 'Width multiplier', .5, 2, .1, s.size) + range('opacity', 'Opacity o of every splat', .2, 1, .05, s.opacity) +
        check('lowpass', 'Add 0.3 px² to Σ′ (the 3DGS blur)', s.lowpass) + check('marks', 'Mark pixels that differ from the depth-sorted render (magenta)', s.marks) +
        '<div class="math-rule">α(p) = o·exp(−½ dᵀΣ′⁻¹d),  C = Σᵢ cᵢ αᵢ Πⱼ₍ⱼ₎ (1 − αⱼ)</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div class="vk-pair">${figure('sp-render', 'The splatted view. Click a splat: its 1σ and 2σ ellipses are drawn.', 'vk-clickable')}<div id="sp-top"></div></div><div id="sp-info"></div>`;
    },
    note: 'Predict first: switch to the storage order (rows from the top of the photo, which is the far table). Where does the picture break? Wherever splats at different depths overlap: the far table is laid down first and wins, so the rim of the cup and saucer is overdrawn. The painter’s order gives the same picture as front to back, and the wrong order breaks it everywhere they overlap. Then orbit to ±40° with the width at 0.8 and a thin depth: the coin-like Gaussians turn edge-on and cracks open between them; raise the thickness and the cracks close, at the cost of blur. Real 3DGS learns each Gaussian’s rotation and scales so that the surfaces stay closed from every training view.',
    async setup() { const img = await window.CV_VISION.load('coffee'); return {img, G: build(img)}; },
    render(s, root, data) {
      const V = window.CV_VISION, P = project(data.G, s), byDepth = P.slice().sort((a, b) => a.t[2] - b.t[2]);
      const view = s.order === 'storage' ? P : s.order === 'wrong' ? byDepth.slice().reverse() : byDepth;
      const out = s.order === 'back' ? paintBackToFront(byDepth.slice().reverse(), s.opacity) : composite(P, view, s.opacity);
      const ref = s.order === 'front' ? out : composite(P, byDepth, s.opacity);
      let diff = 0;
      const shown = s.marks && s.order !== 'front' ? Uint8ClampedArray.from(out.rgba) : out.rgba;
      for (let k = 0; k < W * H; k++) {
        let m = 0; for (let ch = 0; ch < 3; ch++) m = Math.max(m, Math.abs(out.rgba[4 * k + ch] - ref.rgba[4 * k + ch]));
        if (m > 25) { diff++; if (shown !== out.rgba) { shown[4 * k] = .45 * shown[4 * k] + 140; shown[4 * k + 1] = .45 * shown[4 * k + 1]; shown[4 * k + 2] = .45 * shown[4 * k + 2] + 140; } }
      }
      const canvas = root.querySelector('#sp-render');
      V.showRGBA(canvas, shown, W, H);
      canvas.__splatData = {P};   // the current projection, so that a click can pick a splat
      const sel = P.find(p => p.i === s.sel);
      if (sel) {
        const ctx = canvas.getContext('2d'), tr = (sel.sxx + sel.syy) / 2, ev = Math.sqrt(Math.max(0, ((sel.sxx - sel.syy) / 2) ** 2 + sel.sxy ** 2)), l1 = tr + ev, l2 = Math.max(1e-9, tr - ev), ang = .5 * Math.atan2(2 * sel.sxy, sel.sxx - sel.syy);
        [[1, '#ffffff', []], [2, '#ffffff', [4, 3]]].forEach(([k, color, dash]) => {
          ctx.setLineDash(dash); ctx.strokeStyle = '#172623'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sel.u, sel.v, k * Math.sqrt(l1), k * Math.sqrt(l2), ang, 0, 2 * Math.PI); ctx.stroke();
          ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(sel.u, sel.v, k * Math.sqrt(l1), k * Math.sqrt(l2), ang, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
        });
      }
      // Top view: Gaussian centres (x across, depth up) and the camera’s field of view.
      const ph = s.yaw * Math.PI / 180, S0 = 240, X = x => S0 / 2 + x * (S0 / 2 - 10) / 2.3, Y = z => S0 - 10 - (z + .2) / 3.8 * (S0 - 30);
      let svg = `<svg class="vk-plot" viewBox="0 0 ${S0} ${S0}" role="img" aria-label="Top view of the Gaussian centres and the camera"><title>Top view</title>`;
      // Camera-frame point t = R_y(φ)(μ − pivot) + (0, 0, pivot), so the camera centre is pivot + R_y(φ)ᵀ(0, 0, −pivot)
      // and a camera ray at horizontal angle a points along (sin(a − φ), cos(a − φ)) in the world.
      const cam = [Math.sin(ph) * PIVOT, PIVOT - Math.cos(ph) * PIVOT];
      const ray = a => { const d = [Math.sin(a - ph), Math.cos(a - ph)]; return `M${X(cam[0]).toFixed(1)} ${Y(cam[1]).toFixed(1)}L${X(cam[0] + 3.6 * d[0]).toFixed(1)} ${Y(cam[1] + 3.6 * d[1]).toFixed(1)}`; };
      svg += `<path d="${ray(-Math.atan(CX / FL))}${ray(Math.atan(CX / FL))}" class="vk-eig2"/>`;
      data.G.forEach((g, i) => { if (i % 2) return; svg += `<circle cx="${X(g.mu[0]).toFixed(1)}" cy="${Y(g.mu[2]).toFixed(1)}" r="1.8" fill="rgb(${g.col.map(v => Math.round(255 * v)).join(',')})"${i === s.sel ? ' stroke="#172623" stroke-width="1.5"' : ''}/>`; });
      svg += `<circle cx="${X(cam[0]).toFixed(1)}" cy="${Y(cam[1]).toFixed(1)}" r="5" class="vk-tip"/><text x="6" y="14">top view (x across, depth up)</text><text x="6" y="30">orange dot: camera</text></svg>`;
      root.querySelector('#sp-top').innerHTML = svg;
      const f = (v, d = 3) => V.fmt(v, d);
      root.querySelector('#sp-info').innerHTML = sel ? `<p class="vk-callout">Splat ${sel.i + 1} (depth rank ${byDepth.indexOf(sel) + 1} of ${P.length}). Camera-frame centre (${f(sel.t[0])}, ${f(sel.t[1])}, ${f(sel.t[2])}) m. Σ_cam = [${f(sel.cam[0], 5)} 0 ${f(sel.cam[3], 5)}; 0 ${f(sel.cam[1], 5)} 0; ${f(sel.cam[3], 5)} 0 ${f(sel.cam[2], 5)}] m². J = [${f(sel.J[0], 1)} 0 ${f(sel.J[1], 1)}; 0 ${f(sel.J[0], 1)} ${f(sel.J[2], 1)}] px/m. Σ′ = [${f(sel.sxx, 2)} ${f(sel.sxy, 2)}; ${f(sel.sxy, 2)} ${f(sel.syy, 2)}] px², so the splat’s standard deviations are ${f(Math.sqrt(sel.sxx), 2)} px across and ${f(Math.sqrt(sel.syy), 2)} px up.</p>` : '<p class="vk-callout">Click a splat in the rendered view to see its covariance, Jacobian and projected covariance.</p>';
      return V.report([
        ['Splats drawn', `${P.length} of ${data.G.length}`],
        ['Blends per pixel', out.blends ? f(out.blends / (W * H), 1) : '—'],
        ['Pixels changed vs the depth-sorted render', `${f(100 * diff / (W * H), 1)}%`],
        ['Camera yaw', `${s.yaw}°`],
      ]);
    },
    wire(root, s, rerender) {
      const el = root.querySelector('#sp-render');
      if (!el) return;
      el.addEventListener('pointerdown', e => {
        const r = el.getBoundingClientRect(); if (!r.width) return;
        const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
        const data = el.__splatData; if (!data) return;
        // The front-most splat that is visibly present at the click.
        const hit = data.P.slice().sort((a, b) => a.t[2] - b.t[2]).find(p => { const dx = x - p.u, dy = y - p.v; return s.opacity * Math.exp(-.5 * (p.ixx * dx * dx + 2 * p.ixy * dx * dy + p.iyy * dy * dy)) > .2; });
        s.sel = hit ? hit.i : -1; rerender();
      });
    },
  };
  window.CV_EXTEND.lesson(68, {
    teaching: {
      equation: Q`\Sigma=RSS^TR^T,\qquad \Sigma'=JW\Sigma W^TJ^T,\qquad \alpha_i(p)=o_i\,e^{-\frac12(p-\mu_i')^T\Sigma_i'^{-1}(p-\mu_i')},\qquad C(p)=\sum_ic_i\alpha_i\prod_{j<i}(1-\alpha_j)`,
      symbols: [['Σ', '3D covariance of a Gaussian'], ['R, S', 'rotation and scales'], ['J', 'Jacobian of the projection'], ['W', 'camera rotation'], ['Σ′', 'projected 2D covariance'], ['αᵢ', 'opacity of splat i at a pixel']],
      connection: '3D Gaussian splatting renders captured scenes in real time and has spread to dynamic scenes, SLAM, avatars and feed-forward reconstruction (pixelSplat, MVSplat). Its projection is the AΣAᵀ rule for Gaussians with a camera Jacobian, and its blending is the alpha compositing of volume rendering.',
      trap: 'Compositing splats without sorting them by depth. The transmittance product does not depend on the order, but the colour does: a far splat drawn first is treated as if it were in front.',
      question: 'Why does 3DGS store each Gaussian as a rotation (quaternion) and three scales instead of the six free entries of its covariance?',
      choices: ['RSSᵀRᵀ is a valid covariance for any parameter values, so gradient steps cannot break it', 'It makes the projection exact instead of approximate', 'It removes the need to sort splats by depth'], correct: 0,
      explanation: 'A gradient step on raw entries can make Σ indefinite, with a negative variance in some direction. vᵀRSSᵀRᵀv = ‖SᵀRᵀv‖² is never negative, so any rotation and scales give a valid Gaussian; the quaternion is renormalised after each step.',
    },
    guide: {
      title: 'Project each Gaussian with the camera Jacobian, then blend the splats in depth order',
      paragraphs: [
        'A Gaussian-splatting scene is a cloud of 3D Gaussians, each with a centre, a covariance built from a rotation and three scales, an opacity and a colour. To render, every Gaussian is linearised through the pinhole projection: its centre goes to a pixel and its covariance to the 2 × 2 matrix Σ′ = JWΣWᵀJᵀ.',
        'Each projected splat gives every nearby pixel an opacity that falls off as a 2D Gaussian. Sorted by depth, the splats are composited front to back exactly like samples along a ray in volume rendering, and because every step is differentiable the whole scene is fitted to photographs by gradient descent.',
      ],
      example: 'Project one Gaussian and read its footprint',
      controls: [{label: 'Horizontal position x (m)', min: -1, max: 1, step: .1, value: .4}, {label: 'Depth z (m)', min: 1, max: 4, step: .25, value: 2}, {label: 'Rotation about the vertical axis θ (degrees)', min: 0, max: 90, step: 15, value: 0}, {label: 'Opacity o', min: .1, max: 1, step: .1, value: .8}],
      predict: 'Move the Gaussian from x = 0 to x = 1 at the same depth. Will its splat get wider, narrower or stay the same?',
      takeaway: 'Σ′ = JΣJᵀ depends on where the Gaussian sits: f/z sets its overall size, and the corner entry −fx/z² lets its depth extent show up sideways away from the optical axis. Its opacity at a pixel is o·exp(−½d²), measured in the splat’s own standard deviations.',
      notation: 'The camera has f = 100 px and looks along z, with W = I. The Gaussian is centred at (x, 0, z) with standard deviations 0.1, 0.1 and 0.2 m along its own axes, rotated by θ about the vertical. Σ′ is in pixels², and d² is the squared distance in units of the splat’s standard deviation.',
    },
    notation: {
      'Σ': {tex: Q`\Sigma`, detail: 'The 3 × 3 covariance of one Gaussian in the scene, in m². It sets the Gaussian’s size, shape and orientation, and is stored as RSSᵀRᵀ so that it is always valid.'},
      'R, S': {tex: Q`R,\ S`, detail: 'R is a rotation matrix built from a unit quaternion (w, x, y, z), and S = diag(s₁, s₂, s₃) holds the standard deviations along the Gaussian’s own axes. Here S is a scale matrix, not a sum.'},
      J: {tex: 'J', detail: 'The 2 × 3 Jacobian of the pinhole projection at the Gaussian’s camera-frame centre: rows (f/z, 0, −fx/z²) and (0, f/z, −fy/z²). It linearises the projection, as in Lesson 19.'},
      W: {tex: 'W', detail: 'The rotation from world to camera coordinates (Lesson 51). The camera translation moves the centre but does not change the covariance.'},
      'Σ′': {tex: Q`\Sigma'`, detail: 'The projected 2 × 2 covariance JWΣWᵀJᵀ of the splat, in pixels². Its eigenvalues are the squared standard deviations of the splat’s ellipse on the image.'},
      'αᵢ': {tex: Q`\alpha_i`, detail: 'The opacity of splat i at a pixel: its stored opacity times exp(−½ dᵀΣ′⁻¹d). Splats are composited with weights αᵢ times the transmittance Πⱼ<ᵢ(1 − αⱼ) of the splats in front.'},
    },
    calculate, practice, lab,
  });
  window.CV_EXTEND.registry[68].helpers = {model, build, project, composite, paintBackToFront, sceneDepth};
})();
