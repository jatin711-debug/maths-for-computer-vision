/* Lesson 51: the pinhole camera, rotations and calibration. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const P = (x, d = 3) => x < 0 ? `(${N(x, d)})` : N(x, d);   // parenthesize negatives after \cdot
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const text = (x, y, s, color = '#64736b', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial"${extra}>${s}</text>`;

  /* ---------- Worked example: one point through a pinhole (camera coordinates, 640-pixel-wide image) ---------- */
  const WIDTH = 640, CX = 320, CY = 240;
  function model(p) {
    const [f, Z, X] = p, xn = X / Z, off = f * xn, u = off + CX;
    return {f, Z, X, xn, off, u, ppm: f / Z, fov: deg(2 * Math.atan(WIDTH / (2 * f))), hom: [f * X + CX * Z, CY * Z, Z]};
  }
  function drawing(m) {
    const ox = 120, oy = 125, k = 38, fd = 60, top = 30, bot = 220, right = 535;
    const sx = z => ox + z * k, sy = x => oy - x * k, slope = 320 / m.f, half = fd * slope, f1 = v => v.toFixed(1);
    let body = '';
    // Field of view: the wedge of rays through the pinhole that reach the sensor.
    const reachU = Math.min(right - ox, (oy - top) / slope), reachL = Math.min(right - ox, (bot - oy) / slope);
    const U = [ox + reachU, oy - slope * reachU], L = [ox + reachL, oy + slope * reachL], w = [[ox, oy], U];
    if (reachU < right - ox - .5) w.push([right, top]);
    if (reachL < right - ox - .5) w.push([right, bot]);
    w.push(L);
    body += `<path d="M${w.map(p => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z" fill="#34734e14"/>`;
    body += `<path d="M${ox} ${oy}L${f1(U[0])} ${f1(U[1])}M${ox} ${oy}L${f1(L[0])} ${f1(L[1])}" stroke="#34734e" stroke-width="1.2" stroke-dasharray="5 4"/>`;
    body += `<path d="M30 ${oy}H${right}" stroke="#a8b6a5" stroke-dasharray="6 4"/>`;
    body += text(130, 18, `u = ${N(m.u, 1)} px`, '#bd431c', 14, ' font-weight="600"') + text(245, 18, `FOV ${N(m.fov, 1)}°`, '#34734e', 13) + text(335, 18, `1 m = ${N(m.ppm, 1)} px at this depth`, '#64736b', 12.5);
    // The real image plane sits f behind the hole; its image is upside down.
    const sTop = Math.max(top, oy - half), sBot = Math.min(bot, oy + half);
    body += `<path d="M${ox - fd} ${f1(sTop)}V${f1(sBot)}" stroke="#34734e" stroke-width="4"/>`;
    body += `<path d="M${ox} ${oy - 46}V${oy - 5}M${ox} ${oy + 5}V${oy + 46}" stroke="#172623" stroke-width="3"/>`;
    const px = sx(m.Z), py = sy(m.X), ys = oy + fd * m.xn, onSensor = ys >= top && ys <= bot;
    const gx = sx(2 * m.Z), gy = sy(2 * m.X), ghost = gx <= right + 4 && gy >= top && gy <= bot;
    const start = onSensor ? [ox - fd, ys] : [ox, oy], end = ghost ? [gx, gy] : [px, py];
    body += `<path d="M${f1(start[0])} ${f1(start[1])}L${f1(end[0])} ${f1(end[1])}" stroke="#bd431c" stroke-width="2"/>`;
    body += `<path d="M${f1(px)} ${oy}V${f1(py)}" stroke="#bd431c" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    if (ghost) body += `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="7" fill="none" stroke="#315c86" stroke-width="2.5"/>`;
    body += `<circle cx="${f1(px)}" cy="${f1(py)}" r="6" fill="#bd431c"/>`;
    if (onSensor) body += `<circle cx="${ox - fd}" cy="${f1(ys)}" r="4.5" fill="#bd431c"/>`;
    // Dimension lines: f behind the hole and Z in front of it.
    body += `<path d="M${ox - fd} 236H${ox}M${ox - fd} 231V241M${ox} 231V241M${ox} 236H${f1(px)}M${f1(px)} 231V241" stroke="#64736b"/>`;
    body += text(ox - fd + 6, 232, 'f', '#34734e', 13, ' font-style="italic"') + text(Math.max(ox + 6, (ox + px) / 2 - 22), 232, `Z = ${N(m.Z)} m`, '#64736b', 12);
    body += text(f1(px > 470 ? px - 62 : px + 9), f1(Math.abs(py - oy) < 14 ? py - 10 : (py + oy) / 2 + 4), `X = ${N(m.X)} m`, '#bd431c', 12);
    body += text(8, Math.max(22, sTop - 8), 'image plane', '#34734e', 12) + text(ox - 22, oy - 52, 'pinhole', '#172623', 12);
    return {body, caption: `Side view seen from above the camera: depth runs to the right, the lateral position X upwards. Green: the pinhole, the image plane f = ${m.f} px behind it (its image is upside down) and the ${N(m.fov, 1)}° field of view. Orange: the point at X = ${N(m.X)} m, Z = ${N(m.Z)} m and its ray, ${N(m.off, 1)} px from the principal point${Math.abs(m.off) > 320 ? ', outside the 640-pixel image' : ''}. Blue ring (when it fits): the point twice as far and twice as wide, on the same ray.`};
  }
  function calculate(p) {
    const m = model(p), inside = m.u >= 0 && m.u <= WIDTH;
    return {
      steps: [
        step('Similar triangles give the offset on the image plane', Q`\frac{x}{f}=\frac{X}{Z}\;\Rightarrow\;x=f\,\frac{X}{Z}=${m.f}\cdot\frac{${N(m.X)}}{${N(m.Z)}}=${N(m.off)}\ \text{px}`, `The ray through the pinhole makes two similar triangles: lateral ${N(m.X)} m against depth ${N(m.Z)} m in the scene, and the offset x against f = ${m.f} px on the image plane. X/Z = ${N(m.xn, 4)} is the normalized image coordinate, the same for every camera.`),
        step('Shift to pixel indices', Q`u=f\,\frac{X}{Z}+c_x=${N(m.off)}+320=${N(m.u)}`, `Pixel columns start at the left edge, so add the principal point cₓ = 320 of this 640-pixel-wide image. ${inside ? 'The pixel lies inside the image.' : 'This is outside the image (0 to 640), so the camera does not record the point.'}`),
        step('The same projection as K times the point', Q`K\begin{bmatrix}X\\0\\Z\end{bmatrix}=${mat([[m.f, 0, CX], [0, m.f, CY], [0, 0, 1]])}${mat([[m.X], [0], [m.Z]])}=${mat([[m.hom[0]], [m.hom[1]], [m.hom[2]]])}\;\Rightarrow\;u=\frac{${N(m.hom[0])}}{${N(m.Z)}}=${N(m.u)}`, 'The point is already in camera coordinates (R = I, t = 0). The third entry of the product is the depth Z, and dividing by it is the perspective division of Lesson 49; v = 240 because Y = 0.'),
        step('Field of view, and what one image cannot tell', Q`\text{FOV}=2\arctan\frac{640}{2\cdot${m.f}}=${N(m.fov, 1)}^\circ,\qquad (2X,\,2Z)\mapsto u=${N(m.u)}`, `At this depth one metre spans ${N(m.ppm, 1)} pixels. The point (${N(2 * m.X)}, 0, ${N(2 * m.Z)}) m, twice as wide and twice as far, lands on the same pixel, so size and distance cannot be separated from one image.`),
      ],
      values: [['Normalized x = X/Z', m.xn], ['Offset from the principal point (px)', m.off], ['Pixel u', m.u], ['Pixels per metre at depth Z', m.ppm], ['Horizontal field of view (degrees)', m.fov]],
      note: 'Halve the focal length: the field of view widens and the offset from the principal point halves. Doubling the depth also halves the offset, but leaves the field of view unchanged.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const AX = ['x', 'y', 'z'];
  const practice = [
    {key: 'project-point', skill: 'Project a world point with K[R|t]', make(r) {
      const f = r.pick([400, 500, 800, 1000]), cx = r.pick([320, 400, 640]), cy = r.pick([240, 300, 360]);
      const Z = r.pick([2, 4, 5, 8, 10]), kx = r.int(-5, 5), ky = r.int(-5, 5), t = [r.int(-1, 1), r.int(-1, 1), r.int(0, 3)];
      const Xc = [kx * Z / 10, ky * Z / 10, Z], Xw = Xc.map((v, i) => v - t[i]), u = f * kx / 10 + cx, v = f * ky / 10 + cy;
      return {prompt: Q`A camera has \(K=${mat([[f, 0, cx], [0, f, cy], [0, 0, 1]])}\), \(R=I\) and \(t=(${t.join(', ')})\). Which pixel \((u, v)\) does the world point \((${Xw.map(x => N(x)).join(', ')})\) project to?`,
        answers: [{label: Q`\((u, v)\)`, vector: [u, v], tol: 0}],
        hint: Q`Move the point into the camera frame first: \(X_c=RX_w+t\). Then divide by its third coordinate.`,
        solution: Q`\(X_c=(${Xc.map(x => N(x)).join(', ')})\). Dividing by the depth ${Z} gives \((${N(kx / 10)}, ${N(ky / 10)})\). Then \(u=${f}\cdot${P(kx / 10)}+${cx}=${u}\) and \(v=${f}\cdot${P(ky / 10)}+${cy}=${v}\).`};
    }},
    {key: 'crop-resize', skill: 'Update K after a crop and a resize', make(r) {
      const f = r.pick([600, 800, 1000, 1200]), W = r.pick([1280, 1920]), H = W * 3 / 4;
      const cx = W / 2 + 4 * r.int(-3, 3), cy = H / 2 + 4 * r.int(-3, 3), x0 = 40 * r.int(1, 10), y0 = 40 * r.int(1, 8), a = r.pick([.5, .25, 2]);
      const out = [a * f, a * f, a * (cx - x0), a * (cy - y0)];
      return {prompt: Q`A ${W} × ${H} image has \(f_x=f_y=${f}\), \(c_x=${cx}\), \(c_y=${cy}\) (continuous pixel coordinates, origin at the top-left corner). You crop the region whose top-left corner is \((${x0}, ${y0})\), then resize the crop by a factor ${a}. Give the new \((f_x, f_y, c_x, c_y)\).`,
        answers: [{label: Q`\((f_x, f_y, c_x, c_y)\)`, vector: out, tol: 0}],
        hint: 'Cropping only moves the origin, so subtract the corner from the principal point. Resizing then scales every pixel measurement.',
        solution: Q`After the crop: \(c_x=${cx}-${x0}=${cx - x0}\), \(c_y=${cy}-${y0}=${cy - y0}\), focal lengths unchanged. Resizing by ${a} multiplies all four: \(f_x=f_y=${out[0]}\), \(c_x=${out[2]}\), \(c_y=${out[3]}\). A model that predicts metric depth from this crop must be told the new focal length.`};
    }},
    {key: 'axis-angle', skill: 'Read the angle and axis of a rotation matrix', make(r) {
      const th = r.pick([30, 45, 60, 90, 120, 135, 150]), ax = r.int(0, 2), sg = r.sign(), c = Math.cos(rad(th)), s = sg * Math.sin(rad(th));
      const R = ax === 0 ? [[1, 0, 0], [0, c, -s], [0, s, c]] : ax === 1 ? [[c, 0, s], [0, 1, 0], [-s, 0, c]] : [[c, -s, 0], [s, c, 0], [0, 0, 1]];
      const n = [0, 0, 0]; n[ax] = sg;
      const tr = 1 + 2 * c, w = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]];
      return {prompt: Q`The rotation \(R=${mat(R)}\) turns by an angle \(\theta\) between 0° and 180° about a unit axis n. Find \(\theta\) and n.`,
        answers: [{label: Q`\(\theta\) (degrees)`, value: th, tol: .5}, {label: Q`unit axis \(n\)`, vector: n, tol: .01}],
        hint: Q`Use \(\operatorname{tr}R=1+2\cos\theta\) for the angle. The axis is the direction R leaves unchanged (eigenvalue 1).`,
        solution: Q`\(\operatorname{tr}R=${N(tr)}\), so \(\cos\theta=(${N(tr)}-1)/2=${N(c)}\) and \(\theta=${th}^\circ\). R leaves the ${AX[ax]} axis unchanged, so \(n=\pm e_${AX[ax]}\). The sign comes from \((R_{32}-R_{23},\ R_{13}-R_{31},\ R_{21}-R_{12})=(${w.map(x => N(x)).join(', ')})=2\sin\theta\,n\), giving \(n=(${n.join(', ')})\).`};
    }},
    {key: 'radial-distortion', skill: 'Apply radial distortion to a point', make(r) {
      const x = r.pick([-.4, -.3, -.2, .2, .3, .4]), y = r.pick([-.3, -.2, -.1, 0, .1, .2, .3]), k1 = r.pick([-.3, -.2, -.1, .1, .2]), f = r.pick([500, 800, 1000]);
      const r2 = x * x + y * y, fac = 1 + k1 * r2, xd = x * fac, yd = y * fac, ud = f * xd + 320, vd = f * yd + 240;
      return {prompt: Q`A camera has \(f_x=f_y=${f}\), \(c_x=320\), \(c_y=240\) and radial distortion \(k_1=${k1}\), \(k_2=0\). A point has normalized coordinates \((x, y)=(${x}, ${y})\). Find the factor \(1+k_1r^2\) and the distorted pixel \((u_d, v_d)\).`,
        answers: [{label: Q`\(1+k_1r^2\)`, value: fac, tol: .0005}, {label: Q`\((u_d, v_d)\)`, vector: [ud, vd], tol: .01}],
        hint: Q`Start with \(r^2=x^2+y^2\).`,
        solution: Q`\(r^2=${P(x)}^2+${P(y)}^2=${N(r2, 4)}\), so the factor is \(1+${P(k1)}\cdot${N(r2, 4)}=${N(fac, 4)}\). The distorted normalized point is \((${N(xd, 4)}, ${N(yd, 4)})\), so \(u_d=${f}\cdot${P(xd, 4)}+320=${N(ud, 2)}\) and \(v_d=${f}\cdot${P(yd, 4)}+240=${N(vd, 2)}\). ${k1 < 0 ? 'With k₁ < 0 the point moves towards the principal point (barrel distortion).' : 'With k₁ > 0 the point moves away from the principal point (pincushion distortion).'}`};
    }},
  ];

  /* ---------- Lab: a wireframe house seen through an orbiting camera ---------- */
  const IW = 640, IH = 480, NEAR = .05, TARGET = [0, 0, 1], MARK = 4, R2MAX = 9;
  const VERTS = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1.2], [1, -1, 1.2], [1, 1, 1.2], [-1, 1, 1.2], [-1, 0, 2], [1, 0, 2]];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [4, 8], [7, 8], [5, 9], [6, 9], [8, 9]];
  const DOOR = [[-.25, -1, 0], [-.25, -1, .8], [.25, -1, .8], [.25, -1, 0]];
  const GRID = [];
  for (let i = -4; i <= 4; i++) GRID.push([[i, -4, 0], [i, 4, 0]], [[-4, i, 0], [4, i, 0]]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => { const n = Math.hypot(...a); return a.map(v => v / n); };
  const lerp = (a, b, s) => a.map((v, i) => v + (b[i] - v) * s);
  // Orbit camera looking at the house centre: rows of R are the camera's right, down and forward axes in world coordinates.
  function camera(s) {
    const y = rad(s.yaw), p = rad(s.pitch), dir = [Math.cos(p) * Math.cos(y), Math.cos(p) * Math.sin(y), Math.sin(p)];
    const C = TARGET.map((v, i) => v + s.dist * dir[i]), fwd = dir.map(v => -v), right = unit(cross(fwd, [0, 0, 1])), down = cross(fwd, right);
    const R = [right, down, fwd];
    return {C, R, t: R.map(row => -dot(row, C)), f: s.f, cx: IW / 2 + s.dcx, cy: IH / 2 + s.dcy, k1: s.k1};
  }
  const toCam = (cam, X) => cam.R.map((row, i) => dot(row, X) + cam.t[i]);
  // Radial distortion of normalized coordinates; null where the polynomial model is no longer valid.
  function distort(cam, x, y) {
    const r2 = x * x + y * y;
    if (cam.k1 && (r2 > R2MAX || (cam.k1 < 0 && r2 > -1 / (3 * cam.k1)))) return null;
    const d = 1 + cam.k1 * r2;
    return [x * d, y * d, d];
  }
  function pixel(cam, Xc) {
    if (!(Xc[2] >= NEAR * .999)) return null;
    const n = distort(cam, Xc[0] / Xc[2], Xc[1] / Xc[2]);
    return n && [cam.f * n[0] + cam.cx, cam.f * n[1] + cam.cy];
  }
  // Clip a camera-frame segment at the near plane, then subdivide it so that distortion can bend it.
  function segment(cam, A, B) {
    if (A[2] < NEAR && B[2] < NEAR) return '';
    if (A[2] < NEAR) A = lerp(A, B, (NEAR - A[2]) / (B[2] - A[2]));
    else if (B[2] < NEAR) B = lerp(B, A, (NEAR - B[2]) / (A[2] - B[2]));
    const n = cam.k1 ? 24 : 1;
    let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const q = pixel(cam, lerp(A, B, i / n));
      if (!q) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`; pen = true;
    }
    return d;
  }
  function quaternion(R) {
    const tr = R[0][0] + R[1][1] + R[2][2];
    let q;
    if (tr > 0) { const S = 2 * Math.sqrt(tr + 1); q = [S / 4, (R[2][1] - R[1][2]) / S, (R[0][2] - R[2][0]) / S, (R[1][0] - R[0][1]) / S]; }
    else if (R[0][0] > R[1][1] && R[0][0] > R[2][2]) { const S = 2 * Math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]); q = [(R[2][1] - R[1][2]) / S, S / 4, (R[0][1] + R[1][0]) / S, (R[0][2] + R[2][0]) / S]; }
    else if (R[1][1] > R[2][2]) { const S = 2 * Math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]); q = [(R[0][2] - R[2][0]) / S, (R[0][1] + R[1][0]) / S, S / 4, (R[1][2] + R[2][1]) / S]; }
    else { const S = 2 * Math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]); q = [(R[1][0] - R[0][1]) / S, (R[0][2] + R[2][0]) / S, (R[1][2] + R[2][1]) / S, S / 4]; }
    return q[0] < 0 ? q.map(v => -v) : q;
  }
  const lab = {
    name: 'camera', title: 'Project a house through a camera',
    heading: 'Move the camera. Change its lens.',
    intro: 'A wireframe house stands on a 1 m ground grid. The camera orbits the house and looks at its centre; every visible point goes through λ(u, v, 1)ᵀ = K[R | t](X, Y, Z, 1)ᵀ, then radial distortion. The image is 640 × 480 pixels.',
    defaults: {f: 600, yaw: -60, pitch: 20, dist: 6, dcx: 0, dcy: 0, k1: 0},
    controls(s) {
      const {range} = window.CV_VISION;
      return range('f', 'Focal length f (pixels)', 150, 1200, 10, s.f) + range('yaw', 'Yaw: angle around the house (°)', -180, 180, 5, s.yaw) +
        range('pitch', 'Pitch: camera elevation (°)', -20, 80, 5, s.pitch) + range('dist', 'Distance to the house centre (m)', 1, 20, .5, s.dist) +
        range('dcx', 'Principal-point shift Δcₓ (pixels)', -120, 120, 5, s.dcx) + range('dcy', 'Principal-point shift Δc_y (pixels)', -120, 120, 5, s.dcy) +
        range('k1', 'Radial distortion k₁', -.5, .5, .02, s.k1) + '<div class="math-rule">x_d = x (1 + k₁ r²),  u = f x_d + cₓ</div>';
    },
    visual: () => '<div id="cam-img"></div><div class="vk-pair"><div id="cam-top"></div><div id="cam-steps"></div></div>',
    note: 'Predict first: halve the focal length and halve the distance together. The house keeps about the same size, but does it look the same? Close and wide exaggerates perspective: the near corner grows and the far side shrinks. Shifting the principal point slides the picture without changing its shape. A negative k₁ bows straight grid lines (barrel distortion); beyond the dashed circle the polynomial folds back and is no longer a valid model. At 1 m the camera is inside the house: edges behind it are clipped at a near plane instead of being divided by a negative depth.',
    render(s, root) {
      const V = window.CV_VISION, fmt = V.fmt, E = V.E, cam = camera(s);
      const world = VERTS.map(X => toCam(cam, X)), path = (A, B) => segment(cam, A, B);
      const grid = GRID.map(([a, b]) => path(toCam(cam, a), toCam(cam, b))).join('');
      const house = EDGES.map(([a, b]) => path(world[a], world[b])).join('');
      const doorC = DOOR.map(X => toCam(cam, X)), door = doorC.slice(1).map((X, i) => path(doorC[i], X)).join('');
      // Horizon: image of the horizontal directions, the points with (world up in camera frame) · (x, y, 1) = 0.
      const up = [cam.R[0][2], cam.R[1][2], cam.R[2][2]];
      let horizon = '';
      if (Math.abs(up[1]) > 1e-9) {
        let pen = false;
        for (let i = 0; i <= 60; i++) {
          const x = -3 + i / 10, y = -(up[2] + up[0] * x) / up[1], n = distort(cam, x, y);
          if (!n) { pen = false; continue; }
          horizon += `${pen ? 'L' : 'M'}${(cam.f * n[0] + cam.cx).toFixed(1)} ${(cam.f * n[1] + cam.cy).toFixed(1)}`; pen = true;
        }
      }
      const Xm = world[MARK], qm = Xm[2] >= NEAR ? pixel(cam, Xm) : null, inImage = qm && qm[0] >= 0 && qm[0] <= IW && qm[1] >= 0 && qm[1] <= IH;
      const fold = cam.k1 < 0 ? Math.sqrt(-1 / (3 * cam.k1)) : 0, foldPx = fold * (1 + cam.k1 * fold * fold) * cam.f;
      const scene = (o) => `<path d="${grid}" style="stroke:var(--muted);stroke-width:1.2;fill:none;opacity:${o * .7}"/>` +
        (horizon ? `<path d="${horizon}" style="stroke:var(--blue);stroke-width:1.5;fill:none;stroke-dasharray:8 6;opacity:${o}"/>` : '') +
        `<path d="${house}" style="stroke:var(--green);stroke-width:3;fill:none;stroke-linejoin:round;opacity:${o}"/><path d="${door}" style="stroke:var(--blue);stroke-width:2.5;fill:none;opacity:${o}"/>`;
      let img = `<svg class="vk-plot" viewBox="-40 -40 720 560" role="img" aria-label="Simulated 640 by 480 camera image of the house and the ground grid"><defs><clipPath id="cam51-clip"><rect x="0" y="0" width="${IW}" height="${IH}"/></clipPath></defs>`;
      img += `<rect x="0" y="0" width="${IW}" height="${IH}" style="fill:var(--paper);stroke:var(--line);stroke-width:2"/>`;
      img += `<g>${scene(.22)}</g><g clip-path="url(#cam51-clip)">${scene(1)}`;
      if (fold && foldPx < 2000) img += `<circle cx="${cam.cx}" cy="${cam.cy}" r="${foldPx.toFixed(1)}" style="fill:none;stroke:var(--muted);stroke-width:1.5;stroke-dasharray:4 6"/>`;
      img += `<path d="M${cam.cx - 12} ${cam.cy}H${cam.cx + 12}M${cam.cx} ${cam.cy - 12}V${cam.cy + 12}" style="stroke:var(--blue);stroke-width:2"/>`;
      if (qm) img += `<circle cx="${qm[0].toFixed(1)}" cy="${qm[1].toFixed(1)}" r="8" style="fill:var(--orange);stroke:var(--paper);stroke-width:2"/>`;
      img += `</g><text x="0" y="-12" style="font-size:16px">640 × 480 image</text></svg>`;
      img += `<p class="vk-legend">Faint lines: projected, but outside the sensor. Blue cross: principal point (cₓ, c_y). Dashed blue: the horizon, where the ground plane’s parallel lines meet.${fold ? ' Dashed circle: beyond it the distortion polynomial folds back.' : ''} Orange: the marked corner (−1, −1, 1.2).</p>`;
      root.querySelector('#cam-img').innerHTML = img;

      // Top view of the ground plane.
      const horiz = Math.hypot(cam.C[0], cam.C[1]), Rv = Math.max(5, horiz + 1.5), sc = 118 / Rv, X = x => (130 + x * sc).toFixed(1), Y = y => (130 - y * sc).toFixed(1);
      let top = `<svg class="vk-plot" viewBox="0 0 260 280" role="img" aria-label="Top view of the camera, its horizontal field of view and the house"><title>Top view</title>`;
      for (let i = -4; i <= 4; i++) top += `<line class="grid-line" x1="${X(i)}" x2="${X(i)}" y1="${Y(-4)}" y2="${Y(4)}"/><line class="grid-line" x1="${X(-4)}" x2="${X(4)}" y1="${Y(i)}" y2="${Y(i)}"/>`;
      const ray = (u) => { const d = [(u - cam.cx) / cam.f, 0, 1], w = [0, 1, 2].map(j => cam.R[0][j] * d[0] + cam.R[1][j] * d[1] + cam.R[2][j] * d[2]), h = Math.hypot(w[0], w[1]); return h < 1e-6 ? null : [cam.C[0] + w[0] / h * 3 * Rv, cam.C[1] + w[1] / h * 3 * Rv]; };
      const l = ray(0), r = ray(IW);
      if (l && r) top += `<path d="M${X(l[0])} ${Y(l[1])}L${X(cam.C[0])} ${Y(cam.C[1])}L${X(r[0])} ${Y(r[1])}" style="fill:var(--blue);fill-opacity:.1;stroke:var(--blue);stroke-width:1.2"/>`;
      top += `<path d="M${X(cam.C[0])} ${Y(cam.C[1])}L${X(TARGET[0])} ${Y(TARGET[1])}" style="stroke:var(--muted);stroke-dasharray:3 3"/>`;
      top += `<path d="M${X(-1)} ${Y(-1)}H${X(1)}V${Y(1)}H${X(-1)}Z" style="fill:var(--green);fill-opacity:.15;stroke:var(--green);stroke-width:2"/><path d="M${X(-1)} ${Y(0)}H${X(1)}" style="stroke:var(--green);stroke-dasharray:3 2"/><path d="M${X(-.25)} ${Y(-1)}H${X(.25)}" style="stroke:var(--blue);stroke-width:3"/>`;
      top += `<circle cx="${X(VERTS[MARK][0])}" cy="${Y(VERTS[MARK][1])}" r="4" style="fill:var(--orange)"/><circle cx="${X(cam.C[0])}" cy="${Y(cam.C[1])}" r="5" style="fill:var(--ink)"/>`;
      top += `<text x="4" y="274">Top view, ${fmt(Rv * 2, 1)} m across</text></svg>`;
      root.querySelector('#cam-top').innerHTML = top;

      // The projection of the marked corner, one stage at a time.
      const tidy = x => Math.abs(x) < 5e-9 ? 0 : x, v3 = (a, d = 2) => `(${a.map(x => fmt(tidy(x), d)).join(', ')})`;
      const rows = [['World Xw', v3(VERTS[MARK])], ['Camera Xc = R Xw + t', v3(Xm)]];
      if (Xm[2] < NEAR) rows.push(['Depth Z', `${fmt(Xm[2], 2)} m: behind the camera, stop`]);
      else {
        const xn = Xm[0] / Xm[2], yn = Xm[1] / Xm[2], dn = distort(cam, xn, yn);
        rows.push(['Divide by Z: (x, y)', v3([xn, yn], 4)]);
        if (dn) rows.push(['Factor 1 + k₁r²', fmt(dn[2], 4)], ['Distorted (x_d, y_d)', v3([dn[0], dn[1]], 4)]);
        else rows.push(['Distortion', 'outside the model’s valid range']);
        rows.push(['Pixel (u, v) via K', qm ? `${v3(qm, 1)}${inImage ? '' : ' (outside)'}` : '—']);
      }
      root.querySelector('#cam-steps').innerHTML = `<div style="overflow-x:auto"><table class="vk-table"><thead><tr><th>Orange corner, step by step</th><th>Value</th></tr></thead><tbody>${rows.map(([a, b]) => `<tr><td>${E(a)}</td><td>${E(b)}</td></tr>`).join('')}</tbody></table></div>`;

      const q = quaternion(cam.R), half = Math.acos(Math.min(1, q[0])), sh = Math.sin(half), axis = sh > 1e-9 ? [q[1] / sh, q[2] / sh, q[3] / sh] : [0, 0, 1];
      const fovH = deg(Math.atan(cam.cx / cam.f) + Math.atan((IW - cam.cx) / cam.f)), fovV = deg(Math.atan(cam.cy / cam.f) + Math.atan((IH - cam.cy) / cam.f));
      const behind = world.filter(X => X[2] < NEAR).length, Cc = [0, 1, 2].map(j => -(cam.R[0][j] * cam.t[0] + cam.R[1][j] * cam.t[1] + cam.R[2][j] * cam.t[2]));
      return V.report([
        ['K', `[${fmt(cam.f)} 0 ${fmt(cam.cx)}; 0 ${fmt(cam.f)} ${fmt(cam.cy)}; 0 0 1]`],
        ['Field of view', `${fmt(fovH, 1)}° × ${fmt(fovV, 1)}°`],
        ['Orange corner (−1, −1, 1.2) → pixel', Xm[2] < NEAR ? 'behind the camera: not projected' : qm ? `(${fmt(qm[0], 1)}, ${fmt(qm[1], 1)})${inImage ? '' : ', outside the image'}` : 'beyond the distortion model'],
        ['R as axis–angle', `${fmt(deg(2 * half), 1)}° about ${v3(axis)}; q = ±${v3(q, 3)}`],
        ['Camera centre −Rᵀt', `${v3(Cc)} m`],
        ['House corners behind the camera', `${behind} of ${VERTS.length}`],
      ]);
    },
  };

  window.CV_EXTEND.lesson(51, {
    teaching: {
      equation: Q`\lambda\begin{bmatrix}u\\v\\1\end{bmatrix}=K\,[R\,|\,t]\begin{bmatrix}X\\Y\\Z\\1\end{bmatrix},\qquad K=\begin{bmatrix}f_x&s&c_x\\0&f_y&c_y\\0&0&1\end{bmatrix}`,
      symbols: [['K', 'intrinsic matrix, in pixels'], ['[R | t]', 'extrinsics: world → camera'], ['fₓ, f_y', 'focal lengths in pixels'], ['cₓ, c_y', 'principal point'], ['λ', 'depth of the point in the camera frame']],
      connection: 'Monocular 3D detection, depth estimation, multi-view reconstruction and NeRF-style models all turn pixels into rays with K and [R | t]. A crop or resize changes K, so geometric augmentations must update the intrinsics too.',
      trap: 'Check the depth before dividing by it: a point with Z ≤ 0 is behind the camera, and projecting it anyway puts a phantom point in the image, mirrored through the principal point.',
      question: 'A camera has fₓ = 500 and cₓ = 320. At which column u does the camera-frame point (1, 0, 5) appear?',
      choices: ['420', '100', '320'], correct: 0,
      explanation: 'u = fₓ·X/Z + cₓ = 500·0.2 + 320 = 420. 100 is the offset from the principal point before cₓ is added.',
    },
    guide: {
      title: 'Similar triangles give the pixel; K, R and t fix the units and the axes',
      paragraphs: [
        'A pinhole camera maps a point at depth Z and lateral position X to the image offset f·X/Z: the triangle in the scene and the triangle behind the hole are similar. The intrinsic matrix K turns that offset into pixel indices with the focal lengths and the principal point, and [R | t] first moves world points into the camera’s frame.',
        'Rotations can be stored as orthonormal matrices, axis–angle vectors, Euler angles or unit quaternions; each trades simplicity against problems such as gimbal lock or the sign ambiguity of q and −q. Calibration recovers K from photos of a checkerboard, whose plane is imaged by a homography, and also estimates the lens distortion that bends straight lines.',
      ],
      example: 'Project one point through a pinhole',
      controls: [{label: 'Focal length f (pixels)', min: 200, max: 1200, step: 50, value: 800}, {label: 'Depth Z (metres)', min: .5, max: 10, step: .5, value: 4}, {label: 'Lateral position X (metres)', min: -2, max: 2, step: .25, value: .5}],
      predict: 'Double both the depth and the lateral position. Does the point move in the image?',
      takeaway: 'u = f·X/Z + cₓ: the pixel depends on the ratio X/Z, so one image cannot separate size from distance, and the focal length scales every offset from the principal point. Writing it as K times the point, followed by a division by depth, is the same projective algebra as Lesson 49.',
      notation: 'Camera coordinates have x to the right, y down and z along the optical axis. fₓ and f_y are focal lengths in pixels, (cₓ, c_y) is the principal point, [R | t] maps world points into the camera frame, and λ is the depth Z that the homogeneous result is divided by.',
    },
    notation: {
      K: {tex: 'K', detail: 'In this lesson K is the camera’s intrinsic matrix, not a convolution kernel: [[fₓ, s, cₓ], [0, f_y, c_y], [0, 0, 1]]. It converts normalized image coordinates X/Z, Y/Z into pixel indices.'},
      '[R | t]': {tex: Q`[R\,|\,t]`, detail: 'The 3 × 4 extrinsic matrix: a rotation R (orthonormal, determinant +1) and a translation t that move world points into the camera frame, Xc = R Xw + t. The camera centre in world coordinates is −Rᵀt.'},
      'fₓ, f_y': {tex: Q`f_x, f_y`, detail: 'The focal length measured in pixel widths and pixel heights. A larger value narrows the field of view, 2·atan(W / 2fₓ), and magnifies every offset from the principal point.'},
      'cₓ, c_y': {tex: Q`c_x, c_y`, detail: 'The principal point: the pixel where the optical axis meets the sensor, usually near the image centre. Cropping subtracts the crop corner from it; resizing scales it.'},
      'λ': {tex: Q`\lambda`, detail: 'The unknown scale of the homogeneous pixel vector, equal to the point’s depth Z in the camera frame. Divide by it to read (u, v), and only when it is positive: λ ≤ 0 means the point is behind the camera.'},
    },
    calculate, practice, lab,
  });
})();
