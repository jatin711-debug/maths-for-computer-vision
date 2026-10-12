/* Shared helpers for the image experiments: image loading, canvas display, filtering, eigen/SVD and FFT. All local. */
(() => {
  'use strict';
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, d = 3) => !Number.isFinite(n) ? String(n) : Math.abs(n) >= 1e5 || (n !== 0 && Math.abs(n) < 10 ** -d) ? n.toExponential(2) : Number(n.toFixed(d)).toString();
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- Images ---------- */
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const meta = window.CV_IMAGES[name];
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = meta.width; canvas.height = meta.height;
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        ctx.drawImage(img, 0, 0);
        const rgba = ctx.getImageData(0, 0, meta.width, meta.height).data;
        const gray = new Float32Array(meta.width * meta.height);
        for (let i = 0; i < gray.length; i++) gray[i] = .299 * rgba[4 * i] + .587 * rgba[4 * i + 1] + .114 * rgba[4 * i + 2];
        resolve({name, w: meta.width, h: meta.height, gray, rgba: new Uint8ClampedArray(rgba), img, title: meta.title, credit: meta.credit});
      };
      img.onerror = () => reject(Error('Could not decode the sample image ' + name));
      img.src = meta.src;
    });
    cache.set(name, promise);
    return promise;
  }
  // Area-average downsampling by an integer factor (or bilinear resampling for other sizes).
  function downsample(gray, w, h, factor) {
    const nw = Math.floor(w / factor), nh = Math.floor(h / factor), out = new Float32Array(nw * nh), a = factor * factor;
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      let s = 0;
      for (let dy = 0; dy < factor; dy++) for (let dx = 0; dx < factor; dx++) s += gray[(y * factor + dy) * w + x * factor + dx];
      out[y * nw + x] = s / a;
    }
    return {data: out, w: nw, h: nh};
  }
  function bilinear(gray, w, h, x, y) {
    if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return NaN;
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = x - x0, fy = y - y0;
    return (gray[y0 * w + x0] * (1 - fx) + gray[y0 * w + x1] * fx) * (1 - fy) + (gray[y1 * w + x0] * (1 - fx) + gray[y1 * w + x1] * fx) * fy;
  }

  /* ---------- Display ---------- */
  // mode 'gray' maps [min,max] to black-white; 'signed' maps 0 to mid-grey with symmetric range; 'heat' uses a warm ramp.
  function show(canvas, values, w, h, {mode = 'gray', min = 0, max = 255} = {}) {
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'), image = ctx.createImageData(w, h), d = image.data;
    let lo = min, hi = max;
    // Signed views use a symmetric range at the 99.5th percentile of |v| so a few extreme pixels do not wash out the rest.
    if (mode === 'signed') { const mags = Float32Array.from(values, v => Number.isFinite(v) ? Math.abs(v) : 0).sort(); hi = mags[Math.min(mags.length - 1, Math.floor(mags.length * .995))] || mags.at(-1) || 1; lo = -hi; }
    if (mode === 'auto' || mode === 'heat') { lo = Infinity; hi = -Infinity; for (const v of values) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } if (hi <= lo) hi = lo + 1; }
    for (let i = 0; i < w * h; i++) {
      const v = values[i];
      if (!Number.isFinite(v)) { d[4 * i] = 230; d[4 * i + 1] = 226; d[4 * i + 2] = 214; d[4 * i + 3] = 255; continue; }
      const t = clamp((v - lo) / (hi - lo), 0, 1);
      if (mode === 'heat') { d[4 * i] = 255 * Math.min(1, t * 1.6); d[4 * i + 1] = 255 * clamp(t * 1.6 - .45, 0, 1); d[4 * i + 2] = 255 * clamp(t * 2.2 - 1.2, 0, 1); }
      else if (mode === 'signed') { const g = 255 * t; d[4 * i] = g; d[4 * i + 1] = g; d[4 * i + 2] = g; }
      else { const g = 255 * t; d[4 * i] = d[4 * i + 1] = d[4 * i + 2] = g; }
      d[4 * i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  }
  function showRGBA(canvas, rgba, w, h) {
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
    return canvas;
  }

  /* ---------- Filtering ---------- */
  const reflect = (i, n) => { if (n === 1) return 0; while (i < 0 || i >= n) i = i < 0 ? -i - 1 : 2 * n - i - 1; return i; };
  // Cross-correlation with a kw x kh kernel (set flip for convolution); reflected borders keep the output size.
  function filter(gray, w, h, kernel, kw, kh = kw, {flip = false} = {}) {
    const k = flip ? Float32Array.from(kernel).reverse() : kernel, out = new Float32Array(w * h), rx = kw >> 1, ry = kh >> 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0;
      for (let j = 0; j < kh; j++) { const yy = reflect(y + j - ry, h) * w; for (let i = 0; i < kw; i++) s += k[j * kw + i] * gray[yy + reflect(x + i - rx, w)]; }
      out[y * w + x] = s;
    }
    return out;
  }
  function gaussianKernel(sigma) {
    const r = Math.max(1, Math.ceil(3 * sigma)), k = new Float32Array(2 * r + 1);
    let s = 0;
    for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-i * i / (2 * sigma * sigma)); s += k[i + r]; }
    return k.map(v => v / s);
  }
  function blur(gray, w, h, sigma) {
    if (sigma <= 0) return Float32Array.from(gray);
    const k = gaussianKernel(sigma);
    return filter(filter(gray, w, h, k, k.length, 1), w, h, k, 1, k.length);
  }

  /* ---------- Linear algebra ---------- */
  // Cyclic Jacobi eigen-decomposition of a symmetric n x n matrix (row-major). Returns eigenpairs sorted by value, largest first.
  function eigSym(input, n) {
    const a = Float64Array.from(input), v = new Float64Array(n * n);
    for (let i = 0; i < n; i++) v[i * n + i] = 1;
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0, total = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = a[i * n + j] ** 2; total += x; if (i !== j) off += x; }
      if (off <= 1e-22 * total) break;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq), t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k * n + p], akq = a[k * n + q];
          a[k * n + p] = c * akp - s * akq; a[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p * n + k], aqk = a[q * n + k];
          a[p * n + k] = c * apk - s * aqk; a[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k * n + p], vkq = v[k * n + q];
          v[k * n + p] = c * vkp - s * vkq; v[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
    const order = Array.from({length: n}, (_, i) => i).sort((i, j) => a[j * n + j] - a[i * n + i]);
    return {values: order.map(i => a[i * n + i]), vectors: order.map(i => Float64Array.from({length: n}, (_, k) => v[k * n + i]))};
  }
  // Thin SVD of an m x n matrix (n small enough for an n x n eigenproblem): A = U diag(S) V^T.
  function svd(A, m, n) {
    const g = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { let s = 0; for (let k = 0; k < m; k++) s += A[k * n + i] * A[k * n + j]; g[i * n + j] = g[j * n + i] = s; }
    const {values, vectors} = eigSym(g, n);
    const S = values.map(x => Math.sqrt(Math.max(0, x)));
    const U = S.map((s, r) => { const u = new Float64Array(m); if (s < 1e-9) return u; for (let k = 0; k < m; k++) { let t = 0; for (let j = 0; j < n; j++) t += A[k * n + j] * vectors[r][j]; u[k] = t / s; } return u; });
    return {U, S, V: vectors};
  }
  // In-place radix-2 FFT of complex rows/columns of an n x n array (n a power of two). inverse uses +i and divides by n.
  function fft1(re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = 2 * Math.PI / len * (inverse ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  function fft2(re, im, n, inverse = false) {
    const r = new Float64Array(n), c = new Float64Array(n);
    for (let y = 0; y < n; y++) { for (let x = 0; x < n; x++) { r[x] = re[y * n + x]; c[x] = im[y * n + x]; } fft1(r, c, inverse); for (let x = 0; x < n; x++) { re[y * n + x] = r[x]; im[y * n + x] = c[x]; } }
    for (let x = 0; x < n; x++) { for (let y = 0; y < n; y++) { r[y] = re[y * n + x]; c[y] = im[y * n + x]; } fft1(r, c, inverse); for (let y = 0; y < n; y++) { re[y * n + x] = r[y]; im[y * n + x] = c[y]; } }
  }

  /* ---------- Projective geometry ---------- */
  const mul3 = (A, B) => Array.from({length: 9}, (_, k) => { const r = Math.floor(k / 3), c = k % 3; return A[3 * r] * B[c] + A[3 * r + 1] * B[3 + c] + A[3 * r + 2] * B[6 + c]; });
  function inv3(m) {
    const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C;
    if (Math.abs(det) < 1e-12) return null;
    return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map(v => v / det);
  }
  const applyH = (H, x, y) => { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w, w]; };
  // Solve A x = b by Gaussian elimination with partial pivoting (A is n x n, row-major).
  function solve(A, b, n) {
    const M = Array.from({length: n}, (_, r) => [...A.slice(r * n, r * n + n), b[r]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((row, r) => row[n] / row[r]);
  }
  // Direct linear transform for exactly four correspondences, with h33 fixed to 1.
  function homography4(src, dst) {
    const A = [], b = [];
    for (let k = 0; k < 4; k++) {
      const [x, y] = src[k], [u, v] = dst[k];
      A.push(x, y, 1, 0, 0, 0, -u * x, -u * y); b.push(u);
      A.push(0, 0, 0, x, y, 1, -v * x, -v * y); b.push(v);
    }
    const h = solve(A, b, 8);
    return h ? [...h, 1] : null;
  }
  // Inverse mapping: for each output pixel, Hinv gives the source location, sampled bilinearly (or nearest).
  function warpRGBA(rgba, sw, sh, Hinv, ow, oh, {nearest = false, background = [128, 128, 128]} = {}) {
    const out = new Uint8ClampedArray(ow * oh * 4);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const [sx, sy, w] = applyH(Hinv, x + .5, y + .5), o = 4 * (y * ow + x);
      const u = sx - .5, v = sy - .5;
      if (!(w > 0) || u < -.5 || v < -.5 || u > sw - .5 || v > sh - .5) { out[o] = background[0]; out[o + 1] = background[1]; out[o + 2] = background[2]; out[o + 3] = 255; continue; }
      if (nearest) { const i = 4 * (clamp(Math.round(v), 0, sh - 1) * sw + clamp(Math.round(u), 0, sw - 1)); out[o] = rgba[i]; out[o + 1] = rgba[i + 1]; out[o + 2] = rgba[i + 2]; }
      else {
        const x0 = clamp(Math.floor(u), 0, sw - 1), y0 = clamp(Math.floor(v), 0, sh - 1), x1 = Math.min(sw - 1, x0 + 1), y1 = Math.min(sh - 1, y0 + 1), fx = clamp(u - x0, 0, 1), fy = clamp(v - y0, 0, 1);
        for (let c = 0; c < 3; c++) out[o + c] = (rgba[4 * (y0 * sw + x0) + c] * (1 - fx) + rgba[4 * (y0 * sw + x1) + c] * fx) * (1 - fy) + (rgba[4 * (y1 * sw + x0) + c] * (1 - fx) + rgba[4 * (y1 * sw + x1) + c] * fx) * fy;
      }
      out[o + 3] = 255;
    }
    return out;
  }

  /* ---------- Random numbers ---------- */
  function rng(seed = 1) {
    let a = seed >>> 0, spare = null;
    const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const gauss = () => { if (spare !== null) { const s = spare; spare = null; return s; } let u = 0; while (u === 0) u = next(); const v = next(), r = Math.sqrt(-2 * Math.log(u)); spare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v); };
    return {next, gauss};
  }
  const stats = values => { let s = 0, q = 0, n = 0; for (const v of values) if (Number.isFinite(v)) { s += v; q += v * v; n++; } const mean = s / n; return {mean, variance: Math.max(0, q / n - mean * mean), n}; };

  /* ---------- Markup helpers matching the existing experiments ---------- */
  const range = (key, label, min, max, step, value, shown = fmt(value)) => `<div class="control"><label for="vk-${key}"><span>${label}</span><output id="vk-${key}-value">${shown}</output></label><input id="vk-${key}" data-vk="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  const select = (key, label, options, value) => `<div class="control"><label for="vk-${key}">${label}</label><select id="vk-${key}" data-vk="${key}" class="lab-select">${options.map(([v, t]) => `<option value="${E(v)}"${String(v) === String(value) ? ' selected' : ''}>${E(t)}</option>`).join('')}</select></div>`;
  const check = (key, label, value) => `<label class="check-label"><input id="vk-${key}" data-vk="${key}" type="checkbox"${value ? ' checked' : ''}>${label}</label>`;
  const report = pairs => `<div class="plot-summary" aria-live="polite">${pairs.map(([k, v]) => `<span>${k} <strong>${v}</strong></span>`).join('')}</div>`;
  const figure = (id, caption, cls = '') => `<figure class="vk-figure ${cls}"><canvas id="${id}" role="img" aria-label="${E(caption)}"></canvas><figcaption>${caption}</figcaption></figure>`;

  window.CV_VISION = {E, fmt, clamp, load, downsample, bilinear, show, showRGBA, filter, gaussianKernel, blur, eigSym, svd, fft2, mul3, inv3, applyH, solve, homography4, warpRGBA, rng, stats, range, select, check, report, figure};
})();
