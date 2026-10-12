/* Lesson 50: homographies, warping and resampling. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const step = (title, tex, detail) => ({title, tex, detail});
  const FONT = 'font-family="Segoe UI,Arial"';
  const text = (x, y, s, color = '#64736b', size = 13, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${FONT}${extra}>${s}</text>`;

  /* ---------- Worked example: bilinear interpolation inside one 2 x 2 neighbourhood ---------- */
  // Pixel values of the neighbourhood: [row][column], so P[0][1] is the top-right pixel I10.
  const P = [[20, 100], [60, 40]];
  function model(p) {
    const [a, b] = p;
    const top = (1 - a) * P[0][0] + a * P[0][1], bottom = (1 - a) * P[1][0] + a * P[1][1], value = (1 - b) * top + b * bottom;
    const w = [[(1 - a) * (1 - b), a * (1 - b)], [(1 - a) * b, a * b]];
    const col = Math.floor(a + .5), row = Math.floor(b + .5), nearest = P[row][col];   // ties (0.5) round towards the right/bottom
    const slope = (1 - b) * (P[0][1] - P[0][0]) + b * (P[1][1] - P[1][0]);
    return {a, b, top, bottom, value, w, col, row, nearest, slope};
  }
  function drawing(m) {
    const S = 100, X0 = 90, Y0 = 75, cx = i => X0 + i * S, cy = j => Y0 + j * S, px = X0 + m.a * S, py = Y0 + m.b * S;
    let body = '';
    // The four pixels as grey tiles centred on their pixel centres.
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const v = P[j][i], ink = v > 117 ? '#172623' : '#ffffff';
      body += `<rect x="${cx(i) - S / 2}" y="${cy(j) - S / 2}" width="${S}" height="${S}" fill="rgb(${v},${v},${v})" stroke="#a8b6a5"/>`;
      const tx = i ? cx(i) + 6 : cx(i) - 44, ty = j ? cy(j) + 30 : cy(j) - 30;
      body += text(tx, ty, `${v}`, ink, 15, ' font-weight="600"') + text(tx, ty + 16, `w ${N(m.w[j][i], 3)}`, ink, 12);
    }
    // The interpolation cell between the centres, split by the sample point into four rectangles.
    body += `<rect x="${X0}" y="${Y0}" width="${S}" height="${S}" fill="#34734e22" stroke="#34734e" stroke-width="2.5"/>`;
    body += `<path d="M${px.toFixed(1)} ${Y0}V${Y0 + S}M${X0} ${py.toFixed(1)}H${X0 + S}" stroke="#bd431c" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) body += `<circle cx="${cx(i)}" cy="${cy(j)}" r="4.5" fill="#34734e"/>`;
    body += `<circle cx="${cx(m.col)}" cy="${cy(m.row)}" r="10" fill="none" stroke="#315c86" stroke-width="2.5"/>`;
    body += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="#bd431c" stroke="#ffffff" stroke-width="1.5"/>`;
    // Right: the formula with live numbers, then the value along the alpha direction at this beta.
    const w = m.w.flat();
    body += text(285, 26, 'Bilinear: weights × pixel values', '#172623', 14, ' font-weight="600"');
    body += text(285, 47, `${N(w[0])}·20 + ${N(w[1])}·100`, '#64736b', 13) + text(285, 65, `+ ${N(w[2])}·60 + ${N(w[3])}·40`, '#64736b', 13);
    body += text(285, 88, `= ${N(m.value)}`, '#bd431c', 16, ' font-weight="600"') + text(400, 88, `nearest: ${m.nearest}`, '#315c86', 14);
    const lx = a => 300 + a * 220, ly = v => 228 - v * .9, along = a => (1 - m.b) * ((1 - a) * P[0][0] + a * P[0][1]) + m.b * ((1 - a) * P[1][0] + a * P[1][1]);
    body += `<path d="M300 228H520M300 228V124" stroke="#a8b6a5"/>` + text(286, 232, '0', '#64736b', 11) + text(276, 142, '100', '#64736b', 11) + text(296, 244, 'α = 0', '#64736b', 11) + text(492, 244, 'α = 1', '#64736b', 11);
    body += text(318, 113, `Value along α at β = ${N(m.b, 2)}`, '#172623', 12.5);
    body += `<path d="M${lx(0)} ${ly(along(0)).toFixed(1)}L${lx(1)} ${ly(along(1)).toFixed(1)}" stroke="#34734e" stroke-width="3"/>`;
    const nl = P[m.row][0], nr = P[m.row][1];
    body += `<path d="M${lx(0)} ${ly(nl).toFixed(1)}H${lx(.5)}V${ly(nr).toFixed(1)}H${lx(1)}" fill="none" stroke="#315c86" stroke-width="2" stroke-dasharray="5 4"/>`;
    body += `<circle cx="${lx(m.a).toFixed(1)}" cy="${ly(m.value).toFixed(1)}" r="5.5" fill="#bd431c"/>`;
    return {body, caption: `Grey tiles: four pixels with their values and bilinear weights. Green square: the cell between their centres; the orange point at α = ${N(m.a, 2)}, β = ${N(m.b, 2)} splits it into four rectangles, and each pixel's weight is the area of the rectangle opposite it. Blue ring: the nearest centre. Right: along α the bilinear value (green) is a straight line, nearest neighbour (blue dashed) jumps at α = 0.5.`};
  }
  function calculate(p) {
    const m = model(p), a = N(m.a), b = N(m.b), ia = N(1 - m.a), ib = N(1 - m.b);
    return {
      steps: [
        step('Locate the sample inside its 2 × 2 neighbourhood', Q`x=x_0+\alpha,\quad y=y_0+\beta,\qquad \alpha=${a},\ \ \beta=${b}`, 'After mapping an output pixel centre back through the inverse homography and dividing, the source location is rarely a pixel centre. α and β are its offsets, as fractions of a pixel, from the top-left of the four surrounding centres: 20 and 100 on the top row, 60 and 40 below.'),
        step('Blend along each row', Q`I_{\text{top}}=${ia}\cdot20+${a}\cdot100=${N(m.top)},\qquad I_{\text{bottom}}=${ia}\cdot60+${a}\cdot40=${N(m.bottom)}`, 'Each row is a straight-line interpolation between its two pixels, with weight 1 − α on the left pixel and α on the right one.'),
        step('Blend the two rows vertically', Q`I=${ib}\cdot${N(m.top)}+${b}\cdot${N(m.bottom)}=${N(m.value)}`, `The combined weights are ${N(m.w[0][0])}, ${N(m.w[0][1])}, ${N(m.w[1][0])} and ${N(m.w[1][1])} for top-left, top-right, bottom-left and bottom-right. They sum to 1, and each is the area of the rectangle opposite its pixel; blending columns first gives the same value.`),
        step('Compare nearest neighbour, and take the slope', Q`I_{\text{nearest}}=${m.nearest},\qquad \frac{\partial I}{\partial\alpha}=${ib}\,(100-20)+${b}\,(40-60)=${N(m.slope)}`, 'Nearest neighbour copies the closest pixel and jumps when α or β crosses 0.5. The bilinear value moves continuously and has this slope, which is what lets a spatial transformer or RoIAlign pass gradients back through the sampling positions.'),
      ],
      values: [['Top-row blend', m.top], ['Bottom-row blend', m.bottom], ['Bilinear value', m.value], ['Nearest-neighbour value', m.nearest], ['Slope along alpha', m.slope]],
      note: 'Set α = β = 0.5: bilinear sampling returns the mean of the four pixels, 55, while nearest neighbour must pick one of them. At α = β = 0 both return the top-left pixel exactly.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const practice = [
    {key: 'apply-homography', skill: 'Map a point with a homography and divide', make(r) {
      let H, p, w;
      do {
        H = [[r.pick([1, 2]), r.pick([0, 1]), r.int(-2, 2)], [0, r.pick([1, 2]), r.int(-2, 2)], [r.pick([0, .5, .25, -.25]), r.pick([0, .5, .25, -.25]), 1]];
        p = [r.int(0, 4), r.int(0, 4)];
        w = H[2][0] * p[0] + H[2][1] * p[1] + 1;
      } while (w < .25 || Math.abs(w - 1) < 1e-9);
      const u = H[0][0] * p[0] + H[0][1] * p[1] + H[0][2], v = H[1][1] * p[1] + H[1][2], x = u / w, y = v / w;
      const exact = [x, y].every(z => Math.abs(z * 1000 - Math.round(z * 1000)) < 1e-6);
      return {prompt: Q`Map the point \((${p[0]}, ${p[1]})\) with \(H=${mat(H)}\). Which 2D point do you get?`,
        answers: [{label: Q`\((x', y')\)`, vector: [x, y], tol: .01}],
        hint: Q`Multiply \(H\,(${p[0]}, ${p[1]}, 1)^T\) first. Its third entry is the scale to divide by.`,
        solution: Q`\(H\tilde x=(${N(u)},\ ${N(v)},\ ${N(w)})^T\). Dividing the first two entries by \(${N(w)}\) gives \((${N(u)}/${N(w)},\ ${N(v)}/${N(w)})${exact ? '=' : Q`\approx`}(${N(x)},\ ${N(y)})\). Reading \((${N(u)}, ${N(v)})\) without dividing is the classic mistake.`};
    }},
    {key: 'dlt-row', skill: 'Write a DLT row for one correspondence', make(r) {
      const x = r.int(-3, 4), y = r.int(-3, 4), u = r.nonzero(-4, 5), v = r.nonzero(-4, 5), which = r.pick(['u', 'v']), c = which === 'u' ? u : v;
      const z = n => n === 0 ? 0 : n;  // avoid printing −0
      const row = (which === 'u' ? [x, y, 1, 0, 0, 0] : [0, 0, 0, x, y, 1]).concat([z(-c * x), z(-c * y), -c]);
      const form = which === 'u' ? Q`(h_{11}x+h_{12}y+h_{13})-u\,(h_{31}x+h_{32}y+h_{33})=0` : Q`(h_{21}x+h_{22}y+h_{23})-v\,(h_{31}x+h_{32}y+h_{33})=0`;
      return {prompt: Q`The correspondence \((x,y)=(${x}, ${y})\leftrightarrow(u,v)=(${u}, ${v})\) constrains \(h=(h_{11},h_{12},h_{13},h_{21},h_{22},h_{23},h_{31},h_{32},h_{33})\). Write the ${which}-equation in the form \(${form}\) and give its row \(a\) (9 entries) with \(a^Th=0\).`,
        answers: [{label: Q`\(a\) (9 entries)`, vector: row, tol: 0}],
        hint: Q`The coefficient of each \(h\) entry is what multiplies it: \(x, y, 1\) in the first bracket, and \(-${which}x, -${which}y, -${which}\) for \(h_{31}, h_{32}, h_{33}\).`,
        solution: Q`\(a=(${row.join(', ')})\). The other coordinate gives a second row, so one correspondence gives two equations, and four correspondences give the eight needed for the eight degrees of freedom of H.`};
    }},
    {key: 'bilinear', skill: 'Interpolate bilinearly between four pixels', make(r) {
      const I = [r.int(0, 25) * 8, r.int(0, 25) * 8, r.int(0, 25) * 8, r.int(0, 25) * 8], fr = [.2, .25, .4, .5, .6, .75, .8];
      const a = r.pick(fr), b = r.pick(fr);
      const top = (1 - a) * I[0] + a * I[1], bot = (1 - a) * I[2] + a * I[3], val = (1 - b) * top + b * bot;
      return {prompt: Q`A sample point lies \(\alpha=${a}\) of a pixel to the right of, and \(\beta=${b}\) below, the top-left of four pixel centres with values \(I_{00}=${I[0]}\) (top-left), \(I_{10}=${I[1]}\) (top-right), \(I_{01}=${I[2]}\) (bottom-left) and \(I_{11}=${I[3]}\) (bottom-right). What is the bilinear value?`,
        answers: [{label: Q`\(I\)`, value: val, tol: .01}],
        hint: Q`Blend along each row first: \(I_{\text{top}}=(1-\alpha)I_{00}+\alpha I_{10}\), and the same for the bottom row.`,
        solution: Q`\(I_{\text{top}}=${N(1 - a)}\cdot${I[0]}+${a}\cdot${I[1]}=${N(top)}\) and \(I_{\text{bottom}}=${N(1 - a)}\cdot${I[2]}+${a}\cdot${I[3]}=${N(bot)}\). Then \(I=${N(1 - b)}\cdot${N(top)}+${b}\cdot${N(bot)}=${N(val)}\).`};
    }},
    {key: 'normalize', skill: 'Normalize points before the DLT', make(r) {
      const [p, q, d] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [15, 20, 25], [20, 21, 29], [30, 40, 50]]);
      const [ax, by] = r.bool() ? [p, q] : [q, p], cx = r.int(5, 40) * 10, cy = r.int(5, 30) * 10, s = Math.SQRT2 / d;
      const pts = r.shuffle([[cx - ax, cy - by], [cx + ax, cy - by], [cx + ax, cy + by], [cx - ax, cy + by]]);
      return {prompt: Q`Hartley normalization translates a point set so its centroid is at the origin, then scales it by s so that the mean distance from the origin is \(\sqrt2\). For the points ${pts.map(t => Q`\((${t[0]}, ${t[1]})\)`).join(', ')}, find the centroid, the mean distance from it, and s.`,
        answers: [{label: 'Centroid (x, y)', vector: [cx, cy], tol: 0}, {label: 'Mean distance', value: d, tol: 0}, {label: Q`Scale factor \(s\)`, value: s, tol: .0002}],
        hint: 'Average the x and y coordinates separately. All four points are corners of one rectangle, so they are equally far from its centre.',
        solution: Q`The centroid is \((${cx}, ${cy})\). Every point is offset from it by \((\pm${ax}, \pm${by})\), so each distance is \(\sqrt{${ax}^2+${by}^2}=${d}\). Then \(s=\sqrt2/${d}\approx${N(s, 5)}\), and the normalized points are \((\pm${N(ax * s, 4)}, \pm${N(by * s, 4)})\), each at distance \(\sqrt2\) from the origin.`};
    }},
  ];

  /* ---------- Lab: rectify the brick wall from four dragged corners ---------- */
  const WALL = [[62, 36], [173, 36], [191, 226], [48, 226]];   // along two mortar lines, so the bricks come out rectangular
  const BORDER = [[0, 0], [256, 0], [256, 256], [0, 256]];
  const HOLE = [232, 116, 59];
  const sig = v => Math.abs(v) < 1e-10 ? '0' : Number(v.toPrecision(3)).toString();
  // Jacobian of x -> H x (with the division) at a photo point: output pixels per photo pixel along each direction.
  function jacobian(H, x, y) {
    const w = H[6] * x + H[7] * y + H[8], u = (H[0] * x + H[1] * y + H[2]) / w, v = (H[3] * x + H[4] * y + H[5]) / w;
    const a = (H[0] - u * H[6]) / w, b = (H[1] - u * H[7]) / w, c = (H[3] - v * H[6]) / w, d = (H[4] - v * H[7]) / w;
    const det = a * d - b * c, f = a * a + b * b + c * c + d * d, disc = Math.sqrt(Math.max(0, f * f - 4 * det * det));
    return {area: Math.abs(det), smin: Math.sqrt(Math.max(0, (f - disc) / 2))};
  }
  const lab = {
    name: 'homography', title: 'Rectify a plane from four corners', photo: 'brick',
    heading: 'Drag four corners. Unwarp the wall.',
    intro: 'The numbered handles mark a region of the wall. Sending them to the corners of the output rectangle gives eight equations for H. Every output pixel is then pulled from the photo through H⁻¹.',
    defaults: {corners: WALL.map(c => c.slice()), sampling: 'bilinear', width: 140, height: 200, blur: false, active: 2},
    controls(s) {
      const {range, select, check} = window.CV_VISION;
      return select('sampling', 'How each output pixel gets its value', [['bilinear', 'Inverse + bilinear'], ['nearest', 'Inverse + nearest'], ['forward', 'Forward (push pixels)']], s.sampling) +
        range('width', 'Output width (pixels)', 16, 256, 4, s.width) + range('height', 'Output height (pixels)', 16, 256, 4, s.height) +
        `<div data-show-when="sampling:bilinear nearest">${check('blur', 'Blur the photo first where the warp shrinks (σ = F/2)', s.blur)}</div>` +
        '<div class="button-row"><button type="button" class="btn" data-vk-action="wall">Corners on the wall region</button><button type="button" class="btn" data-vk-action="border">Corners at the photo border</button></div>' +
        '<div class="math-rule">x̃ ≃ H⁻¹ x̃′,  output(x′) = photo(x)</div>';
    },
    visual: () => {
      const {figure} = window.CV_VISION;
      return `<div class="vk-pair">${figure('hg-src', 'Photo: drag the numbered handles, or click it, press 1–4 and use the arrow keys (Shift moves 5 px). Blue: the output’s quarter lines pulled back through H⁻¹.')}${figure('hg-out', 'Rectified output', 'vk-pixelated')}</div>`;
    },
    note: 'Predict first: switch to forward mapping. Do the holes appear near the top of the wall or the bottom? The far (top) part is magnified most, so it has fewer photo pixels than output pixels. Then shrink the output to about 32 × 48 with nearest neighbour: mortar lines break up and vanish (aliasing, Lesson 33) until you blur first. Four corners fix H only once you choose the output rectangle, so its aspect ratio is your decision. This lab solves the 8 × 8 system with h₃₃ = 1 directly; coordinates up to 256 are small enough for double precision, but normalize them in your own code.',
    async setup() { return {img: await window.CV_VISION.load('brick'), blurred: new Map()}; },
    render(s, root, data) {
      const V = window.CV_VISION, {img, blurred} = data, {w, h} = img, W = s.width, Hh = s.height, C = s.corners;
      const src = root.querySelector('#hg-src'), out = root.querySelector('#hg-out'), cap = out.nextElementSibling;
      V.showRGBA(src, img.rgba, w, h);
      const ctx = src.getContext('2d');
      const dst = [[0, 0], [W, 0], [W, Hh], [0, Hh]];
      const Hinv = V.homography4(dst, C), Hraw = Hinv && V.inv3(Hinv);
      // Convex quadrilateral: the four turns all have the same sign.
      const turns = C.map((p, i) => { const q = C[(i + 1) % 4], t = C[(i + 2) % 4]; return (q[0] - p[0]) * (t[1] - q[1]) - (q[1] - p[1]) * (t[0] - q[0]); });
      const convex = turns.every(z => z > 1e-9) || turns.every(z => z < -1e-9);
      const quad = (color, width) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); C.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke(); };
      const handles = () => {
        C.forEach((p, i) => {
          ctx.beginPath(); ctx.arc(p[0], p[1], i === s.active ? 7.5 : 6, 0, 2 * Math.PI); ctx.fillStyle = i === s.active ? '#3fae6a' : '#e8743b'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px Segoe UI, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), p[0], p[1] + .5);
        });
      };
      if (!Hraw) {
        quad('#e8743b', 2); handles();
        V.showRGBA(out, new Uint8ClampedArray(W * Hh * 4).fill(128), W, Hh); cap.textContent = 'No output: the corners do not define a homography';
        return V.report([['H', 'undefined: three or more corners are (nearly) collinear, so the eight equations are dependent'], ['Fix', 'move a handle so that no three corners lie on one line']]);
      }
      const k = Math.abs(Hraw[8]) > 1e-9 ? Hraw[8] : Math.hypot(...Hraw), H = Hraw.map(v => v / k);
      // Pull the output's quarter lines back onto the photo (straight lines stay straight under a homography).
      if (convex) {
        ctx.strokeStyle = '#7fb8df'; ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const seg = (a, b) => { const p = V.applyH(Hinv, ...a), q = V.applyH(Hinv, ...b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
          seg([W * i / 4, 0], [W * i / 4, Hh]); seg([0, Hh * i / 4], [W, Hh * i / 4]);
        }
      }
      quad('#e8743b', 2); handles();
      // Local scale of the warp: area factor and the most-shrunk direction, at the corners, edge midpoints and centre.
      const probes = [...C, ...C.map((p, i) => [(p[0] + C[(i + 1) % 4][0]) / 2, (p[1] + C[(i + 1) % 4][1]) / 2]), [C.reduce((t, p) => t + p[0], 0) / 4, C.reduce((t, p) => t + p[1], 0) / 4]];
      const smin = Math.min(...probes.map(p => jacobian(H, ...p).smin));
      const topArea = jacobian(H, (C[0][0] + C[1][0]) / 2, (C[0][1] + C[1][1]) / 2).area, botArea = jacobian(H, (C[2][0] + C[3][0]) / 2, (C[2][1] + C[3][1]) / 2).area;
      let extra, blurNote = 'off';
      if (s.sampling === 'forward') {
        const pix = new Uint8ClampedArray(W * Hh * 4), hit = new Uint8Array(W * Hh);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const [u, v] = V.applyH(H, x + .5, y + .5);
          if (!(u >= 0 && v >= 0 && u < W && v < Hh)) continue;
          const o = Math.floor(v) * W + Math.floor(u), i = 4 * (y * w + x);
          pix[4 * o] = img.rgba[i]; pix[4 * o + 1] = img.rgba[i + 1]; pix[4 * o + 2] = img.rgba[i + 2]; pix[4 * o + 3] = 255; hit[o] = 1;
        }
        let holes = 0;
        for (let o = 0; o < W * Hh; o++) if (!hit[o]) { holes++; pix[4 * o] = HOLE[0]; pix[4 * o + 1] = HOLE[1]; pix[4 * o + 2] = HOLE[2]; pix[4 * o + 3] = 255; }
        V.showRGBA(out, pix, W, Hh);
        cap.textContent = 'Forward mapping: orange output pixels received no photo pixel (holes)';
        extra = ['Holes', `${V.fmt(100 * holes / (W * Hh), 1)}% of ${W * Hh} output pixels`];
      } else {
        let rgba = img.rgba;
        if (s.blur && smin < 1) {
          const sigma = Math.min(6, Math.round(4 * .5 / Math.max(smin, 1e-6)) / 4);
          if (!blurred.has(sigma)) {
            const g = V.blur(img.gray, w, h, sigma), b = new Uint8ClampedArray(w * h * 4);
            for (let i = 0; i < w * h; i++) { b[4 * i] = b[4 * i + 1] = b[4 * i + 2] = g[i]; b[4 * i + 3] = 255; }
            blurred.set(sigma, b);
          }
          rgba = blurred.get(sigma); blurNote = `σ = ${sigma} px (F = ${V.fmt(1 / smin, 2)})`;
        } else if (s.blur) blurNote = 'not needed: the warp never shrinks';
        V.showRGBA(out, V.warpRGBA(rgba, w, h, Hinv, W, Hh, {nearest: s.sampling === 'nearest'}), W, Hh);
        cap.textContent = `Inverse mapping, ${s.sampling === 'nearest' ? 'nearest neighbour' : 'bilinear'}: ${W} × ${Hh} output pixels`;
        extra = ['Strongest shrink', smin < 1 ? `×${V.fmt(smin, 2)} in one direction (F = ${V.fmt(1 / smin, 2)})${smin < .5 ? (s.blur ? ', blurred first' : ': aliasing likely without a blur') : ': mild'}` : 'none: the warp enlarges everywhere'];
      }
      const c = C[2], hv = [H[0] * c[0] + H[1] * c[1] + H[2], H[3] * c[0] + H[4] * c[1] + H[5], H[6] * c[0] + H[7] * c[1] + H[8]];
      return V.report([
        ['H (photo → output, h₃₃ = 1)', `[${sig(H[0])} ${sig(H[1])} ${sig(H[2])}; ${sig(H[3])} ${sig(H[4])} ${sig(H[5])}; ${sig(H[6])} ${sig(H[7])} ${sig(H[8])}]`],
        ['Corner 3 maps to', `H(${c[0]}, ${c[1]}, 1)ᵀ = (${sig(hv[0])}, ${sig(hv[1])}, ${sig(hv[2])}) → (${V.fmt(hv[0] / hv[2], 1)}, ${V.fmt(hv[1] / hv[2], 1)})`],
        ['Area scale (output px per photo px)', `×${V.fmt(topArea, 3)} at the top edge, ×${V.fmt(botArea, 3)} at the bottom edge`],
        extra, ['Blur first', s.sampling === 'forward' ? 'n/a' : blurNote],
        ...(convex ? [] : [['Warning', 'the corners do not form a convex quadrilateral, so the map passes through infinity (grey: no valid source)']]),
      ]);
    },
    wire(root, s, rerender) {
      const c = root.querySelector('#hg-src'), clamp = window.CV_VISION.clamp, size = 256;
      if (!c) return;
      c.style.touchAction = 'none'; c.style.cursor = 'grab'; c.tabIndex = 0;
      c.setAttribute('aria-label', 'Brick photo with four draggable corner handles. Focus it, press 1 to 4 to choose a corner, then move it with the arrow keys.');
      let drag = -1;
      const at = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * size, (e.clientY - r.top) / r.height * size]; };
      const pick = p => { const r = c.getBoundingClientRect(), tol = 24 * size / Math.max(1, r.width); let best = -1, bd = tol; s.corners.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = i; } }); return best; };
      c.addEventListener('pointerdown', e => { const i = pick(at(e)); if (i < 0) return; drag = i; s.active = i; try { c.setPointerCapture(e.pointerId); } catch {} c.style.cursor = 'grabbing'; e.preventDefault(); c.focus({preventScroll: true}); rerender(); });
      c.addEventListener('pointermove', e => {
        if (drag < 0) { if (e.pointerType === 'mouse') c.style.cursor = pick(at(e)) >= 0 ? 'grab' : 'default'; return; }
        const [x, y] = at(e); s.corners[drag] = [Math.round(clamp(x, 0, size)), Math.round(clamp(y, 0, size))]; e.preventDefault(); rerender();
      });
      const end = e => { if (drag < 0) return; drag = -1; c.style.cursor = 'grab'; try { c.releasePointerCapture(e.pointerId); } catch {} };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
      c.addEventListener('keydown', e => {
        if (/^[1-4]$/.test(e.key)) { s.active = Number(e.key) - 1; e.preventDefault(); rerender(); return; }
        const d = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key];
        if (!d) return;
        const k = e.shiftKey ? 5 : 1, q = s.corners[s.active];
        s.corners[s.active] = [clamp(q[0] + d[0] * k, 0, size), clamp(q[1] + d[1] * k, 0, size)]; e.preventDefault(); rerender();
      });
    },
    action(name, s) { if (name === 'wall') s.corners = WALL.map(c => c.slice()); if (name === 'border') s.corners = BORDER.map(c => c.slice()); },
  };

  window.CV_EXTEND.lesson(50, {
    teaching: {
      equation: Q`\begin{gathered}\tilde x'\simeq H\tilde x,\qquad A\,h=0,\ \ \|h\|=1\\ I'(x')=(1-\alpha)(1-\beta)I_{00}+\alpha(1-\beta)I_{10}+(1-\alpha)\beta I_{01}+\alpha\beta I_{11}\end{gathered}`,
      symbols: [['H', 'homography: 3 × 3, defined up to scale'], ['≃', 'equal after dividing by the last coordinate'], ['A', 'two rows per point correspondence'], ['h', 'the nine entries of H as one vector'], ['α, β', 'fractional offsets of a sample point']],
      connection: 'Document scanning, panorama stitching, bird’s-eye road views, spatial transformer layers and RoIAlign all resample an image or feature map through a geometric map, usually with bilinear interpolation, which is differentiable in both the pixel values and the sample positions.',
      trap: 'Do not push pixels forward through H: wherever the warp enlarges, output pixels are left empty. Loop over the output pixels and pull each value from H⁻¹, interpolating between source pixels.',
      question: 'How many independent linear equations on the entries of H does one point correspondence (x, y) ↔ (u, v) give?',
      choices: ['Two', 'One', 'Three'], correct: 0,
      explanation: 'The u and v coordinates each give one equation once the division is multiplied out. H has 8 degrees of freedom, so four correspondences, no three on a line, determine it.',
    },
    guide: {
      title: 'Four corners fix a homography; inverse mapping and bilinear sampling fill the pixels',
      paragraphs: [
        'A homography is a 3 × 3 matrix used up to scale, so it has eight degrees of freedom. Each point correspondence gives two linear equations in its entries, so four correspondences determine it: stack the equations as A h = 0 and take the unit vector h that A sends to zero, which the SVD provides.',
        'To warp an image, loop over the output pixels, map each centre back with H⁻¹ and read the source there. That location usually falls between four pixel centres, so blend them with weights given by the fractional offsets α and β. Pushing source pixels forward instead leaves holes, and shrinking without a blur first aliases.',
      ],
      example: 'Sample between four pixels with bilinear interpolation',
      controls: [{label: 'Horizontal offset α (fraction of a pixel)', min: 0, max: 1, step: .05, value: .3}, {label: 'Vertical offset β (fraction of a pixel)', min: 0, max: 1, step: .05, value: .6}],
      predict: 'At α = β = 0.5 the sample sits exactly between the four centres. Will the bilinear value be their mean, and will nearest neighbour agree with it?',
      takeaway: 'Bilinear sampling blends the four nearest pixels with weights (1 − α)(1 − β), α(1 − β), (1 − α)β and αβ. It is continuous and differentiable in the sample position, which is why warps inside networks use it, while nearest neighbour jumps from pixel to pixel.',
      notation: 'H maps photo coordinates to output coordinates in homogeneous form, and ≃ means equal after dividing by the last coordinate. A stacks two rows per correspondence and h holds the nine entries of H. α and β are a sample point’s offsets, as fractions of a pixel, from the top-left of the four pixel centres around it; I₀₀ is the top-left pixel and I₁₀ the top-right one.',
    },
    notation: {
      H: {tex: 'H', detail: 'In this lesson H is a homography, not a Hessian: an invertible 3 × 3 matrix applied to homogeneous points. Any nonzero multiple of H is the same map, so it has 8 degrees of freedom.'},
      '≃': {tex: Q`\simeq`, detail: 'Equality of homogeneous vectors up to a nonzero factor: x̃′ ≃ H x̃ means H x̃ is some multiple of x̃′, so you divide by the last coordinate before reading the point.'},
      A: {tex: 'A', detail: 'The 2n × 9 matrix of the direct linear transform. Each correspondence (x, y) ↔ (u, v) adds the rows (x, y, 1, 0, 0, 0, −ux, −uy, −u) and (0, 0, 0, x, y, 1, −vx, −vy, −v).'},
      h: {tex: 'h', detail: 'The entries of H stacked into a 9-vector (h₁₁, h₁₂, …, h₃₃). The DLT solution is the unit vector minimizing ‖Ah‖: the right singular vector of A with the smallest singular value.'},
      'α, β': {tex: Q`\alpha,\beta`, detail: 'The horizontal and vertical offsets of a sample point from the top-left of the four surrounding pixel centres, each between 0 and 1. They set the bilinear weights (1 − α)(1 − β), α(1 − β), (1 − α)β and αβ.'},
    },
    calculate, practice, lab,
  });
})();
