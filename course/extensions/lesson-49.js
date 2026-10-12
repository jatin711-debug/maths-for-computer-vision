/* Lesson 49: homogeneous coordinates and 2D transformations. Registered through CV_EXTEND (see extensions.js). */
(() => {
  'use strict';
  const Q = String.raw;
  const N = (x, d = 3) => Math.abs(x) < 1e-12 ? '0' : Number(x.toFixed(d)).toString();
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.map(v => typeof v === 'number' ? N(v) : v).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const step = (title, tex, detail) => ({title, tex, detail});
  const rad = d => d * Math.PI / 180;

  // Similarity applied to the point (1,1): rotate by theta, scale by s, then translate by (tx, 0).
  function model(p) {
    const [deg, s, tx] = p, c = Math.cos(rad(deg)), sn = Math.sin(rad(deg));
    const M = [[s * c, -s * sn, tx], [s * sn, s * c, 0], [0, 0, 1]];
    const mapped = [s * (c - sn) + tx, s * (sn + c)];
    const other = [s * ((1 + tx) * c - sn), s * ((1 + tx) * sn + c)];
    return {deg, s, tx, c, sn, M, mapped, other};
  }
  function drawing(m) {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]], map = ([x, y]) => [m.M[0][0] * x + m.M[0][1] * y + m.M[0][2], m.M[1][0] * x + m.M[1][1] * y + m.M[1][2]];
    const image = square.map(map), pts = [...square, ...image, m.other];
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), lo = [Math.min(...xs) - .6, Math.min(...ys) - .6], hi = [Math.max(...xs) + .6, Math.max(...ys) + .6];
    const k = Math.min(470 / (hi[0] - lo[0]), 200 / (hi[1] - lo[1])), X = x => 40 + (x - lo[0]) * k, Y = y => 225 - (y - lo[1]) * k;
    const poly = (ps, color, dash = '') => `<path d="${ps.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}Z" fill="${color}22" stroke="${color}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
    let body = `<path d="M${X(lo[0])} ${Y(0)}H${X(hi[0])}M${X(0)} ${Y(lo[1])}V${Y(hi[1])}" stroke="#a8b6a5"/>`;
    body += poly(square, '#34734e', '5 4') + poly(image, '#bd431c');
    body += `<circle cx="${X(1)}" cy="${Y(1)}" r="5" fill="#34734e"/><circle cx="${X(m.mapped[0])}" cy="${Y(m.mapped[1])}" r="6" fill="#bd431c"/><circle cx="${X(m.other[0])}" cy="${Y(m.other[1])}" r="5" fill="none" stroke="#315c86" stroke-width="2.5"/>`;
    body += `<text x="${X(1) + 8}" y="${Y(1) - 8}" fill="#34734e" font-size="13" font-family="Segoe UI,Arial">(1, 1)</text><text x="${X(m.mapped[0]) + 8}" y="${Y(m.mapped[1]) + 16}" fill="#bd431c" font-size="13" font-family="Segoe UI,Arial">(${N(m.mapped[0], 2)}, ${N(m.mapped[1], 2)})</text>`;
    return {body, caption: `Green dashed: unit square and the point (1, 1). Orange: their image under M. Blue ring: where (1, 1) lands if you translate first, then rotate and scale.`};
  }
  function calculate(p) {
    const m = model(p);
    return {
      steps: [
        step('Lift the point to homogeneous coordinates', Q`x=(1,1)\;\Rightarrow\;\tilde x=${mat([[1], [1], [1]])}`, 'Append a 1. The extra coordinate lets translation join rotation and scaling as one matrix product; it does not change which point we mean.'),
        step('Build one matrix: rotate and scale, then translate', Q`M=${mat([[m.M[0][0], m.M[0][1], m.M[0][2]], [m.M[1][0], m.M[1][1], m.M[1][2]], [0, 0, 1]])}`, `The top-left block is s·R with s = ${N(m.s)} and θ = ${N(m.deg)}°. The last column holds the translation (${N(m.tx)}, 0). The bottom row (0, 0, 1) keeps this an affine map.`),
        step('Multiply, then read the 2D point', Q`M\tilde x=${mat([[m.mapped[0]], [m.mapped[1]], [1]])}\;\Rightarrow\;x'=(${N(m.mapped[0])},\ ${N(m.mapped[1])})`, 'The last coordinate stays 1 here, so no division is needed. After a projective map it would not, and you would divide by it.'),
        step('Reverse the order and compare', Q`sR\,(x+t)=(${N(m.other[0])},\ ${N(m.other[1])})`, 'Translating first means the translation is also rotated and scaled. Matrix products do not commute; the order in a pipeline is part of its definition.'),
      ],
      values: [['Mapped x', m.mapped[0]], ['Mapped y', m.mapped[1]], ['Other order x', m.other[0]], ['Other order y', m.other[1]], ['Gap between orders', Math.hypot(m.mapped[0] - m.other[0], m.mapped[1] - m.other[1])]],
      note: 'Set the translation to 0: both orders agree, because rotation and uniform scaling commute with each other.',
      svg: drawing(m),
    };
  }

  /* ---------- Practice ---------- */
  const R = Q`\begin{bmatrix}`, Rend = Q`\end{bmatrix}`;
  const practice = [
    {key: 'homog-point', skill: 'Read a homogeneous point', make(r) {
      const a = r.int(-5, 5), b = r.int(-5, 5), w = r.pick([2, 3, 4, -2, -3]);
      return {prompt: Q`Which 2D point does the homogeneous vector \(\tilde x=(${a * w}, ${b * w}, ${w})\) name?`,
        answers: [{label: Q`\((x, y)\)`, vector: [a, b], tol: 0}],
        hint: 'Divide the first two coordinates by the last one.',
        solution: Q`\((${a * w}/${w},\ ${b * w}/${w})=(${a}, ${b})\). Any nonzero multiple of \(\tilde x\) names the same point.`};
    }},
    {key: 'similarity-map', skill: 'Apply rotate-scale-translate to a point', make(r) {
      const deg = r.pick([90, 180, 270]), s = r.pick([1, 2, 3]), t = [r.int(-3, 3), r.int(-3, 3)], p = [r.nonzero(-3, 3), r.int(-3, 3)];
      const c = Math.round(Math.cos(rad(deg))), sn = Math.round(Math.sin(rad(deg)));
      const rp = [c * p[0] - sn * p[1], sn * p[0] + c * p[1]], out = [s * rp[0] + t[0], s * rp[1] + t[1]];
      return {prompt: Q`Rotate the point \((${p[0]}, ${p[1]})\) by ${deg}° counter-clockwise about the origin, scale by ${s}, then translate by \((${t[0]}, ${t[1]})\). Where does it land?`,
        answers: [{label: Q`\((x', y')\)`, vector: out, tol: 0}],
        hint: Q`For ${deg}°, \(\cos\theta=${c}\) and \(\sin\theta=${sn}\). Rotate with \((x\cos\theta-y\sin\theta,\ x\sin\theta+y\cos\theta)\) first.`,
        solution: Q`Rotation gives \((${rp[0]}, ${rp[1]})\); scaling by ${s} gives \((${s * rp[0]}, ${s * rp[1]})\); adding \((${t[0]}, ${t[1]})\) gives \((${out[0]}, ${out[1]})\). As one matrix: \(${R}${s * c}&${-s * sn}&${t[0]}\\${s * sn}&${s * c}&${t[1]}\\0&0&1${Rend}\).`};
    }},
    {key: 'line-intersection', skill: 'Intersect two lines with a cross product', make(r) {
      const P = [r.int(-4, 4), r.int(-4, 4)];
      let a1, b1, a2, b2;
      do { a1 = r.int(-3, 3); b1 = r.int(-3, 3); a2 = r.int(-3, 3); b2 = r.int(-3, 3); } while ((a1 === 0 && b1 === 0) || (a2 === 0 && b2 === 0) || a1 * b2 - a2 * b1 === 0);
      const c1 = -(a1 * P[0] + b1 * P[1]), c2 = -(a2 * P[0] + b2 * P[1]);
      const x = [b1 * c2 - c1 * b2, c1 * a2 - a1 * c2, a1 * b2 - b1 * a2];
      return {prompt: Q`Lines are given as \(l=(a,b,c)\) for \(ax+by+c=0\): \(l_1=(${a1}, ${b1}, ${c1})\) and \(l_2=(${a2}, ${b2}, ${c2})\). Where do they intersect?`,
        answers: [{label: Q`\((x, y)\)`, vector: P, tol: 1e-6}],
        hint: Q`Compute \(l_1\times l_2\), then divide by its last coordinate.`,
        solution: Q`\(l_1\times l_2=(${x[0]}, ${x[1]}, ${x[2]})\). Dividing by \(${x[2]}\) gives \((${P[0]}, ${P[1]})\). Check: \(${a1}\cdot${P[0]}+${b1}\cdot${P[1]}+${c1}=0\).`};
    }},
    {key: 'family', skill: 'Classify a 3×3 transformation', make(r) {
      const families = ['Euclidean (rigid)', 'Similarity', 'Affine', 'Projective'], f = r.int(0, 3), t = [r.int(-4, 4), r.int(-4, 4)];
      const rot = r.pick([[0.6, 0.8], [0.8, 0.6], [0, 1], [1, 0]]), sg = r.sign(), [cc, ss] = [rot[0], sg * rot[1]];
      let A = [[cc, -ss], [ss, cc]], v = [0, 0];
      if (f === 1) { const k = r.pick([2, 3, 0.5]); A = A.map(row => row.map(x => x * k)); }
      if (f >= 2) A = r.pick([[[1, 0.5], [0, 1]], [[2, 0], [0, 1]], [[1, 0], [0.5, 1]], [[1, 1], [0, 2]]]);
      if (f === 3) v = r.pick([[0.1, 0], [0, 0.2], [0.05, 0.1]]);
      const order = r.shuffle([0, 1, 2, 3]);
      return {prompt: Q`What is the most specific family for \(${R}${N(A[0][0])}&${N(A[0][1])}&${t[0]}\\${N(A[1][0])}&${N(A[1][1])}&${t[1]}\\${N(v[0])}&${N(v[1])}&1${Rend}\)?`,
        answers: [{label: 'Family', choices: order.map(i => families[i]), correct: order.indexOf(f)}],
        hint: 'Check the bottom row first (projective if it is not 0, 0, 1). Then test whether the top-left block is a rotation, a scaled rotation, or neither.',
        solution: f === 3 ? Q`The bottom row is \((${N(v[0])}, ${N(v[1])}, 1)\), not \((0,0,1)\), so the map is projective.` : f === 2 ? Q`The bottom row is \((0,0,1)\), but the 2×2 block is not a multiple of a rotation (its columns are not orthogonal with equal length), so it is affine.` : f === 1 ? Q`The 2×2 block has orthogonal columns of equal length \(${N(Math.hypot(A[0][0], A[1][0]))}\neq1\): a scaled rotation, so a similarity.` : Q`The 2×2 block has orthonormal columns and determinant 1: a rotation plus translation, so Euclidean.`};
    }},
  ];

  /* ---------- Lab: transformation families on a photo ---------- */
  const lab = {
    name: 'transforms', title: 'Transformation families', photo: 'cat',
    heading: 'Choose a family. See what it keeps.',
    intro: 'One 3 × 3 matrix moves every pixel. Each family adds freedom and loses a guarantee. Coordinates are centred on the image and measured in units of 80 pixels.',
    defaults: {family: 'similarity', angle: 20, scale: 1.1, tx: 0, ty: 0, shear: 0.4, sy: 0.8, px: 0.25, py: 0.1},
    controls(s) {
      const {range, select} = window.CV_VISION;
      return select('family', 'Family', [['translation', 'Translation (2 numbers)'], ['euclidean', 'Euclidean / rigid (3)'], ['similarity', 'Similarity (4)'], ['affine', 'Affine (6)'], ['projective', 'Projective / homography (8)']], s.family) +
        range('tx', 'Translation x', -1, 1, .05, s.tx) + range('ty', 'Translation y', -1, 1, .05, s.ty) +
        `<div data-show-when="family:euclidean similarity affine projective">${range('angle', 'Rotation θ (degrees)', -90, 90, 5, s.angle)}</div>` +
        `<div data-show-when="family:similarity affine projective">${range('scale', 'Scale s', .5, 1.6, .05, s.scale)}</div>` +
        `<div data-show-when="family:affine projective">${range('shear', 'Shear k', -1, 1, .05, s.shear)}${range('sy', 'Vertical stretch', .5, 1.5, .05, s.sy)}</div>` +
        `<div data-show-when="family:projective">${range('px', 'Projective term h₃₁', -.6, .6, .05, s.px)}${range('py', 'Projective term h₃₂', -.6, .6, .05, s.py)}</div>` +
        '<div class="math-rule">x̃′ = H x̃,  x′ = (u/w, v/w)</div>';
    },
    visual: () => window.CV_VISION.figure('tf-out', 'Warped photo. Orange: two lines that start parallel. Green: a right angle. Blue: the image border.'),
    note: 'Predict first: which family is the first to bend the right angle, and which is the first to make the parallel lines meet? Affine maps keep parallels but not angles; only projective maps can make parallel lines converge. Straight lines stay straight in every family.',
    async setup() { return window.CV_VISION.load('cat'); },
    render(s, root, img) {
      const V = window.CV_VISION, f = s.family, u = 80, W = 300, H = 220;
      const th = f === 'translation' ? 0 : rad(s.angle), sc = ['similarity', 'affine', 'projective'].includes(f) ? s.scale : 1;
      const k = ['affine', 'projective'].includes(f) ? s.shear : 0, sy = ['affine', 'projective'].includes(f) ? s.sy : 1, pv = f === 'projective' ? [s.px, s.py] : [0, 0];
      const c = Math.cos(th), sn = Math.sin(th);
      // A = s R [[1, k], [0, sy]]
      const A = [[sc * c, sc * (c * k - sn * sy)], [sc * sn, sc * (sn * k + c * sy)]];
      const Hn = [A[0][0], A[0][1], s.tx, A[1][0], A[1][1], s.ty, pv[0], pv[1], 1];
      const Ns = [1 / u, 0, -img.w / 2 / u, 0, 1 / u, -img.h / 2 / u, 0, 0, 1], Nd = [u, 0, W / 2, 0, u, H / 2, 0, 0, 1];
      const F = V.mul3(Nd, V.mul3(Hn, Ns)), Finv = V.inv3(F);
      const canvas = root.querySelector('#tf-out');
      if (!Finv) { V.showRGBA(canvas, new Uint8ClampedArray(W * H * 4).fill(128), W, H); return V.report([['Matrix', 'not invertible: the map collapses the plane']]); }
      V.showRGBA(canvas, V.warpRGBA(img.rgba, img.w, img.h, Finv, W, H), W, H);
      const ctx = canvas.getContext('2d'), map = (x, y) => V.applyH(F, x, y);
      const segment = (pts, color, width = 2) => { const m = pts.map(p => map(...p)); if (m.some(p => !(p[2] > 0))) return null; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); m.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); return m; };
      const sample = (a, b, n = 24) => Array.from({length: n + 1}, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
      segment([[0, 0], [img.w, 0], [img.w, img.h], [0, img.h], [0, 0]].flatMap((p, i, arr) => i ? sample(arr[i - 1], p).slice(1) : [p]), '#7fb8df', 1.5);
      const l1 = segment(sample([24, 40], [200, 40]), '#e8743b', 2.5), l2 = segment(sample([24, 124], [200, 124]), '#e8743b', 2.5);
      const corner = segment([[60, 70], [60, 110], [100, 110]], '#3fae6a', 3);
      const dir = m => [m.at(-1)[0] - m[0][0], m.at(-1)[1] - m[0][1]], angle = (a, b) => Math.acos(V.clamp((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)), -1, 1)) * 180 / Math.PI;
      let parallel = '—', right = '—', lengths = '—';
      if (l1 && l2) { const d = angle(dir(l1), dir(l2)); parallel = `${N(Math.min(d, 180 - d), 2)}° apart`; }
      if (corner) { right = `${N(angle([corner[0][0] - corner[1][0], corner[0][1] - corner[1][1]], [corner[2][0] - corner[1][0], corner[2][1] - corner[1][1]]), 1)}°`; lengths = `${N(Math.hypot(corner[0][0] - corner[1][0], corner[0][1] - corner[1][1]) / 40, 3)} and ${N(Math.hypot(corner[2][0] - corner[1][0], corner[2][1] - corner[1][1]) / 40, 3)}`; }
      const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      return V.report([['H (centred units)', `[${N(Hn[0], 2)} ${N(Hn[1], 2)} ${N(Hn[2], 2)}; ${N(Hn[3], 2)} ${N(Hn[4], 2)} ${N(Hn[5], 2)}; ${N(Hn[6], 2)} ${N(Hn[7], 2)} 1]`], ['det of 2 × 2 block', N(det, 3)], ['Right angle becomes', right], ['Parallel lines', parallel], ['Length ratios (two sides)', lengths]]);
    },
  };

  window.CV_EXTEND.lesson(49, {
    teaching: {
      equation: Q`\tilde x'=\begin{bmatrix}sR&t\\0^T&1\end{bmatrix}\tilde x,\qquad \tilde x=\begin{bmatrix}x\\y\\1\end{bmatrix}`,
      symbols: [['x̃', 'homogeneous point'], ['R', 'rotation matrix'], ['s', 'uniform scale'], ['t', 'translation vector']],
      connection: 'Augmentation, image registration, panorama stitching and spatial transformer layers all move every pixel coordinate with one 3 × 3 matrix.',
      trap: 'The order of matrices is the order of operations read right to left: rotating then translating differs from translating then rotating.',
      question: 'Which homogeneous vector names the same 2D point as (3, −1)?',
      choices: ['(6, −2, 2)', '(3, −1, 0)', '(6, −2, 1)'], correct: 0,
      explanation: 'Divide by the last coordinate: (6/2, −2/2) = (3, −1). A last coordinate of 0 describes a direction, not a point.',
    },
    guide: {
      title: 'One extra coordinate turns every 2D move into a matrix',
      paragraphs: [
        'A 2 × 2 matrix can rotate, scale and shear, but it always keeps the origin fixed, so it cannot translate. Appending a coordinate equal to 1 fixes this: translation becomes a 3 × 3 matrix, and any sequence of moves becomes one product of matrices.',
        'The same trick organises transformations into families. Euclidean maps keep lengths and angles, similarities keep angles, affine maps keep parallel lines, and projective maps keep only straightness. Reading the bottom row and the top-left block of a matrix tells you which family you have.',
      ],
      example: 'Rotate and scale the point (1, 1), then translate it',
      controls: [{label: 'Rotation angle θ (degrees)', min: -180, max: 180, step: 15, value: 90}, {label: 'Scale s', min: .5, max: 2, step: .25, value: 1}, {label: 'Translation tₓ', min: -3, max: 3, step: .5, value: 2}],
      predict: 'If you translate first and then rotate, will the point end in the same place?',
      takeaway: 'Compose transformations by multiplying matrices, rightmost first. The homogeneous coordinate makes translation part of that algebra, which is why vision code stores every 2D map as a 3 × 3 matrix.',
      notation: 'A tilde marks a homogeneous vector; for a point its last entry is 1 until a projective map changes it. R is a rotation, s a positive scale and t a translation.',
    },
    notation: {
      'x̃': {tex: Q`\tilde x`, detail: 'A point written with an extra coordinate, (x, y, 1). Any nonzero multiple names the same point; divide by the last coordinate to read it.'},
      R: {tex: 'R', detail: 'A 2 × 2 rotation matrix [[cos θ, −sin θ], [sin θ, cos θ]]. Its columns are orthonormal and its determinant is 1, so it preserves lengths and angles.'},
      s: {tex: 's', detail: 'A positive uniform scale factor. Multiplying R by s changes lengths by the factor s but keeps every angle.'},
      t: {tex: 't', detail: 'A translation vector (tₓ, t_y). In homogeneous form it sits in the last column of the 3 × 3 matrix and moves positions but not directions.'},
    },
    calculate, practice, lab,
  });
})();
