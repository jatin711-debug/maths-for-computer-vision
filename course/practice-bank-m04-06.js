/* Auto-checked question generators for Modules 04-06 (Lessons 13-24). See practice-engine.js for the format. */
(() => {
  'use strict';
  const P = window.CV_PRACTICE, Q = String.raw;
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.join('&')).join(Q`\\`)}\end{bmatrix}`;
  const fx = (x, d = 4) => Number(x.toFixed(d));
  const eq = (x, d = 4) => (Math.abs(x - fx(x, d)) < 1e-12 ? '=' : Q`\approx`) + fx(x, d);  // '=0.5' when exact, '\approx0.3333' otherwise
  const sum = list => list.reduce((s, x) => s + x, 0);
  const vec = v => `(${v.join(', ')})`;
  const par = x => (x < 0 ? `(${x})` : `${x}`);
  // A signed TeX sum of [coefficient, symbol] terms: [[3,'x^2'],[-1,'x'],[4,'']] gives 3x^2-x+4. Zero terms are dropped.
  const poly = list => { let s = ''; for (const [c, m] of list) { if (!c) continue; const abs = Math.abs(c); s += (c < 0 ? '-' : s ? '+' : '') + (m && abs === 1 ? m : abs + m); } return s || '0'; };
  const shift = (v, c) => poly([[1, v], [-c, '']]);  // v-c with the right sign, e.g. x+2
  const places = n => ({tol: 10 ** -n, rel: 0});  // for answers the prompt asks to n decimal places
  // One correct option shuffled among distractors; correct is its index after shuffling.
  const choice = (r, label, correct, wrong) => { const choices = r.shuffle([correct, ...wrong]); return {label, choices, correct: choices.indexOf(correct)}; };
  // Symmetric 2x2 matrix lo*I + m*v*v^T: eigenvalue lo + m|v|^2 along v and lo along the perpendicular direction.
  const EIG_DIRS = [[1, 1], [1, -1], [1, 2], [2, 1], [1, -2], [2, -1], [1, 3], [3, 1]];
  const symFromEigen = (lo, m, [p, q]) => [[lo + m * p * p, m * p * q], [m * p * q, lo + m * q * q]];
  const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]];

  /* ---------- Module 04: eigenvectors, SVD, PCA and leakage ---------- */
  P.add(13, [
    {key: 'sym-eigenvalues', skill: 'Eigenvalues of a symmetric 2x2 matrix', make(r) {
      const v = r.pick(EIG_DIRS), n2 = v[0] ** 2 + v[1] ** 2, m = n2 === 2 ? r.int(1, 3) : 1, lo = r.int(-3, 3), hi = lo + m * n2;
      const A = symFromEigen(lo, m, v), tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] ** 2;
      return {prompt: Q`Find both eigenvalues of the symmetric matrix \(A=${mat(A)}\). Enter the larger one first.`,
        answers: [{label: Q`\(\lambda_1,\ \lambda_2\)`, vector: [hi, lo], tol: 0}],
        hint: Q`Solve \(\det(A-\lambda I)=0\). For a 2×2 matrix this is \(\lambda^2-\operatorname{tr}(A)\,\lambda+\det A=0\).`,
        solution: Q`Here \(\operatorname{tr}A=${tr}\) and \(\det A=${det}\), so \(${poly([[1, Q`\lambda^2`], [-tr, Q`\lambda`], [det, '']])}=(${shift(Q`\lambda`, hi)})(${shift(Q`\lambda`, lo)})=0\). The eigenvalues are \(${hi}\) and \(${lo}\); they add to the trace and multiply to the determinant. The vector \(${vec(v)}\) satisfies \(Av=${hi}v\), and the perpendicular direction \(${vec([-v[1], v[0]])}\) has eigenvalue \(${lo}\).`};
    }},
    {key: 'repeated-map', skill: 'Predict repeated application with an eigenbasis', make(r) {
      const [v1, v2] = r.pick([[[1, 1], [1, -1]], [[1, 2], [2, -1]], [[2, 1], [1, -2]]]);
      const [l1, l2] = r.distinct(2, -3, 3), k = r.int(2, 3), a = r.nonzero(-2, 2), b = r.nonzero(-2, 2);
      const x = [a * v1[0] + b * v2[0], a * v1[1] + b * v2[1]];
      const ca = a * l1 ** k, cb = b * l2 ** k, y = [ca * v1[0] + cb * v2[0], ca * v1[1] + cb * v2[1]];
      return {prompt: Q`A matrix \(A\) has eigenvectors \(v_1=${vec(v1)}\) with \(\lambda_1=${l1}\) and \(v_2=${vec(v2)}\) with \(\lambda_2=${l2}\). Compute \(A^${k}x\) for \(x=${vec(x)}\).`,
        answers: [{label: Q`\(A^${k}x\)`, vector: y, tol: 0}],
        hint: Q`First write \(x=c_1v_1+c_2v_2\) by solving for the two coefficients. Then \(A^${k}\) multiplies each coefficient by its eigenvalue to the power ${k}.`,
        solution: Q`Solving gives \(x=${poly([[a, 'v_1'], [b, 'v_2']])}\). Then \(A^${k}x=${a}\cdot(${l1})^{${k}}v_1+${par(b)}\cdot(${l2})^{${k}}v_2=${poly([[ca, 'v_1'], [cb, 'v_2']])}=${vec(y)}\). Only the coefficients change; each eigen-direction stays on its own line.`};
    }},
    {key: 'eigen-check', skill: 'Verify an eigenvector and find its eigenvalue', make(r) {
      const q = r.pick([-2, -1, 1, 2, 3]), lam = r.nonzero(-4, 4), b = r.nonzero(-3, 3);
      let k = r.nonzero(-2, 2);
      if (b * q + k === 0) k = -k;  // keep the other eigenvalue different from lam
      let A = [[lam - b * q, b], [q * k, lam - k]], v = [1, q];
      if (r.bool()) { A = [[A[1][1], A[1][0]], [A[0][1], A[0][0]]]; v = [q, 1]; }
      const Av = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]], A2v = v.map(x => lam * lam * x);
      return {prompt: Q`Check that \(v=${vec(v)}\) is an eigenvector of \(A=${mat(A)}\). Give its eigenvalue and the vector \(A^2v\).`,
        answers: [{label: Q`\(\lambda\)`, value: lam, tol: 0}, {label: Q`\(A^2v\)`, vector: A2v, tol: 0}],
        hint: Q`Multiply \(A\) by \(v\). If the result is a multiple of \(v\), that multiple is the eigenvalue; each further application multiplies by it again.`,
        solution: Q`\(Av=${vec(Av)}=${lam}\cdot${vec(v)}\), so \(\lambda=${lam}\). Applying \(A\) again gives \(A^2v=\lambda^2v=${lam * lam}\cdot${vec(v)}=${vec(A2v)}\), with no second matrix product needed.`};
    }},
    {key: 'long-run', skill: 'Long-run behaviour of repeated maps', make(r) {
      const CASES = [
        {dom: [0.5, 0.8, 0.9, -0.5, -0.8], text: 'It shrinks towards the zero vector.'},
        {dom: [1], text: 'It settles at a fixed nonzero vector along the eigenvector whose eigenvalue is 1.'},
        {dom: [1.5, 2, 3], text: 'It grows without bound and lines up with the dominant eigenvector, keeping one orientation.'},
        {dom: [-1.5, -2, -3], text: 'It grows without bound along the dominant eigenvector, flipping orientation at every step.'},
      ];
      const c = r.int(0, 3), big = r.pick(CASES[c].dom), small = r.pick([0.1, 0.2, -0.3, 0.5, -0.5].filter(s => Math.abs(s) < Math.abs(big)));
      const swap = r.bool(), l = swap ? [small, big] : [big, small], co = [r.nonzero(-3, 3), r.nonzero(-3, 3)], i = swap ? 2 : 1, cDom = co[i - 1];
      const why = [
        Q`Both \(|\lambda|<1\), so both terms shrink geometrically and \(A^kx\to0\).`,
        Q`\(1^k=1\) keeps the \(v_${i}\) term fixed while \((${small})^k\to0\), so \(A^kx\to${cDom}v_${i}\).`,
        Q`\(${big}^k\) grows and stays positive while the other term becomes negligible beside it, so the direction approaches the line of \(v_${i}\) with a fixed orientation.`,
        Q`\((${big})^k\) grows in size and alternates in sign, so the vector grows along the line of \(v_${i}\) and flips orientation at every step.`,
      ][c];
      return {prompt: Q`A matrix \(A\) has eigenvectors \(v_1, v_2\) with eigenvalues \(\lambda_1=${l[0]}\) and \(\lambda_2=${l[1]}\). Starting from \(x=${poly([[co[0], 'v_1'], [co[1], 'v_2']])}\), what happens to \(A^kx\) as \(k\) grows?`,
        answers: [choice(r, Q`Behaviour of \(A^kx\)`, CASES[c].text, CASES.filter((_, j) => j !== c).map(o => o.text))],
        hint: Q`Write \(A^kx=c_1\lambda_1^kv_1+c_2\lambda_2^kv_2\). Which \(|\lambda|\) is larger, and is it below, equal to or above 1?`,
        solution: Q`\(A^kx=${co[0]}(${l[0]})^kv_1+${par(co[1])}(${l[1]})^kv_2\). The term with the larger \(|\lambda|=${Math.abs(big)}\) dominates. ${why}`};
    }},
  ]);

  P.add(14, [
    {key: 'truncation-error', skill: 'Truncated SVD error from discarded singular values', make(r) {
      const n = r.int(3, 4), s = r.distinct(n, 1, 9).sort((x, y) => y - x), k = r.int(1, n - 1);
      const drop = s.slice(k), err = sum(drop.map(x => x * x)), tot = sum(s.map(x => x * x));
      return {prompt: Q`A matrix has singular values \(${s.join(', ')}\). Its best rank-${k} approximation \(A_${k}\) keeps ${k === 1 ? 'only the largest' : `the ${k} largest`}. Find \(\|A-A_${k}\|_F^2\) and the fraction of \(\|A\|_F^2\) that \(A_${k}\) retains.`,
        answers: [{label: Q`\(\|A-A_${k}\|_F^2\)`, value: err, tol: 0}, {label: 'Retained fraction', value: 1 - err / tot}],
        hint: Q`The squared Frobenius norm equals the sum of the squared singular values. The error comes only from the discarded ones.`,
        solution: Q`Discarding \(${drop.join(', ')}\) gives \(\|A-A_${k}\|_F^2=${drop.map(x => x + '^2').join('+')}=${err}\). The total is \(${s.map(x => x + '^2').join('+')}=${tot}\), so the retained fraction is \(1-${err}/${tot}${eq(1 - err / tot)}\).`};
    }},
    {key: 'rank-k-storage', skill: 'Reduced SVD shapes and rank-k storage', make(r) {
      const [m, n] = r.distinct(2, 2, 15).map(x => 8 * x), k = r.int(2, 12), q = Math.min(m, n), per = m + n + 1, st = k * per;
      let kb = 0;
      while ((kb + 1) * per < m * n) kb++;
      return {prompt: Q`An image is a \(${m}\times${n}\) matrix. Give the shape of \(U\) in its reduced SVD, the number of values a rank-${k} approximation stores (\(k\) columns each of \(U\) and \(V\) plus \(k\) singular values), and the largest rank that still stores fewer values than the image.`,
        answers: [{label: Q`shape of \(U\)`, vector: [m, q], tol: 0}, {label: `Values stored at rank ${k}`, value: st, tol: 0}, {label: 'Largest rank storing fewer values', value: kb, tol: 0}],
        hint: Q`In a reduced SVD the inner size is \(q=\min(m,n)\). A rank-\(k\) approximation stores \(k(m+n+1)\) values.`,
        solution: Q`With \(q=\min(${m},${n})=${q}\): \(U\) is \(${m}\times${q}\), \(\Sigma\) is \(${q}\times${q}\) and \(V^T\) is \(${q}\times${n}\). Rank ${k} stores \(${k}(${m}+${n}+1)=${st}\) values, against \(${m}\cdot${n}=${m * n}\) for the image${st >= m * n ? ', so it saves nothing' : ''}. Fewer values needs \(${per}k<${m * n}\), i.e. \(k<\tfrac{${m * n}}{${per}}${eq(m * n / per, 2)}\), so the largest such rank is ${kb}.`};
    }},
    {key: 'rank-one-sigma', skill: 'Largest singular value of a rank-1 matrix', make(r) {
      const PARTS = [[[1, 2, 2], 3], [[2, 1, 2], 3], [[2, 2, 1], 3], [[3, 4], 5], [[4, 3], 5]];
      const [u0, nu] = r.pick(PARTS), [v0, nv] = r.pick(PARTS);
      const u = u0.map(x => x * r.sign()), v = v0.map(x => x * r.sign()), A = u.map(a => v.map(b => a * b));
      return {prompt: Q`Find the largest singular value \(\sigma_1\) of \(A=${mat(A)}\).`,
        answers: [{label: Q`\(\sigma_1\)`, value: nu * nv, tol: 0}],
        hint: Q`Every row is a multiple of one row vector, so \(A=uv^T\) has rank 1. For a rank-1 matrix \(\sigma_1=\|u\|_2\|v\|_2\), which also equals \(\|A\|_F\).`,
        solution: Q`\(A=uv^T\) with \(u=${vec(u)}\) and \(v=${vec(v)}\), so its only nonzero singular value is \(\sigma_1=\|u\|_2\|v\|_2=${nu}\cdot${nv}=${nu * nv}\). Check: the squared entries sum to \(${sum(A.flat().map(x => x * x))}=${nu * nv}^2\), as \(\|A\|_F=\sigma_1\) for rank 1.`};
    }},
    {key: 'singular-vs-eigen', skill: 'Singular values versus eigenvalues', make(r) {
      const [a, b] = r.distinct(2, 2, 7), sa = r.sign(), sb = sa > 0 ? -1 : r.sign();  // at least one negative entry
      const d = [sa * a, sb * b], hi = Math.max(a, b), lo = Math.min(a, b), list = l => `(${l.join(', ')})`;
      return {prompt: Q`What are the singular values of \(A=${mat([[d[0], 0], [0, d[1]]])}\), listed from largest to smallest?`,
        answers: [choice(r, 'Singular values', list([hi, lo]), [list(d.slice().sort((x, y) => y - x)), list([hi * hi, lo * lo]), list([a + b, Math.abs(a - b)])])],
        hint: Q`Singular values are the square roots of the eigenvalues of \(A^TA\), so they can never be negative.`,
        solution: Q`\(A^TA=${mat([[a * a, 0], [0, b * b]])}\) has eigenvalues \(${a * a}\) and \(${b * b}\); their square roots give \(\sigma_1=${hi},\ \sigma_2=${lo}\). The eigenvalues of \(A\) itself are \(${d[0]}\) and \(${d[1]}\): a negative sign is a reflection, which the SVD places in \(U\) or \(V\) rather than in \(\Sigma\).`};
    }},
  ]);

  P.add(15, [
    {key: 'center-covariance', skill: 'Centre samples and form the sample covariance', make(r) {
      const dev = () => { const a = r.int(-3, 3), b = r.int(-3, 3); return a === 0 && b === 0 ? [2, -1, -1] : [a, b, -a - b]; };
      const dx = dev(), dy = dev(), mu = [r.int(-2, 6), r.int(-2, 6)], X = [0, 1, 2].map(i => [mu[0] + dx[i], mu[1] + dy[i]]);
      const C = [sum(dx.map(x => x * x)) / 2, sum(dx.map((x, i) => x * dy[i])) / 2, sum(dy.map(y => y * y)) / 2];
      const terms = (p, q) => p.map((x, i) => `${par(x)}\\cdot${par(q[i])}`).join('+');
      return {prompt: Q`Three samples (rows of \(X\)) are \(x_1=${vec(X[0])}\), \(x_2=${vec(X[1])}\) and \(x_3=${vec(X[2])}\). Find the mean \(\mu\) and the sample covariance \(C=X_c^TX_c/(N-1)\), entered as \(C_{11}, C_{12}, C_{22}\).`,
        answers: [{label: Q`\(\mu\)`, vector: mu, tol: 0}, {label: Q`\(C_{11}, C_{12}, C_{22}\)`, vector: C}],
        hint: Q`Subtract the mean from every row first. Each covariance entry is a sum of products of centred coordinates, divided by \(N-1=2\).`,
        solution: Q`\(\mu=${vec(mu)}\), so the centred rows are \(${vec([dx[0], dy[0]])}, ${vec([dx[1], dy[1]])}, ${vec([dx[2], dy[2]])}\). Then \(C_{11}=\tfrac12(${terms(dx, dx)})=${C[0]}\), \(C_{12}=\tfrac12(${terms(dx, dy)})=${C[1]}\) and \(C_{22}=\tfrac12(${terms(dy, dy)})=${C[2]}\).`};
    }},
    {key: 'principal-axis', skill: 'Leading variance and direction of a covariance matrix', make(r) {
      const v = r.pick(EIG_DIRS), n2 = v[0] ** 2 + v[1] ** 2, m = n2 === 2 ? r.int(1, 3) : 1, lo = r.int(0, 3), hi = lo + m * n2;
      const C = symFromEigen(lo, m, v), tr = C[0][0] + C[1][1], det = C[0][0] * C[1][1] - C[0][1] ** 2;
      return {prompt: Q`A centred 2-D feature set has sample covariance \(C=${mat(C)}\). Find the variance along the first principal direction, the slope \(v_y/v_x\) of that direction (it does not depend on the sign of \(v\)), and the fraction of total variance it captures.`,
        answers: [{label: 'Variance along PC1', value: hi, tol: 0}, {label: Q`slope \(v_y/v_x\)`, value: v[1] / v[0]}, {label: 'Fraction of total variance', value: hi / (hi + lo)}],
        hint: Q`The first principal direction is the eigenvector of \(C\) with the largest eigenvalue. Get the eigenvalues from \(\operatorname{tr}C\) and \(\det C\), then solve \((C-\lambda_1I)v=0\).`,
        solution: Q`\(\operatorname{tr}C=${tr}\) and \(\det C=${det}\), so the eigenvalues are \(${hi}\) and \(${lo}\). The first row of \((C-${hi}I)v=0\) reads \(${poly([[C[0][0] - hi, 'v_x'], [C[0][1], 'v_y']])}=0\), giving \(v\propto${vec(v)}\) and slope \(${v[1]}/${v[0]}${eq(v[1] / v[0])}\). PC1 captures \(${hi}/(${hi}+${lo})${eq(hi / (hi + lo))}\) of the total variance.`};
    }},
    {key: 'svd-to-variance', skill: 'Covariance eigenvalues from singular values of centred data', make(r) {
      const N = r.pick([5, 9, 11, 17, 21, 26]), s = r.distinct(r.int(3, 4), 1, 10).sort((a, b) => b - a), k = r.int(1, 2);
      const tot = sum(s.map(x => x * x)), keep = sum(s.slice(0, k).map(x => x * x)), lam = s[0] ** 2 / (N - 1);
      return {prompt: Q`Centred data \(X_c\) has \(N=${N}\) rows and singular values \(${s.join(', ')}\). Find the largest eigenvalue of the sample covariance \(C=X_c^TX_c/(N-1)\), and the fraction of total variance kept by ${k === 1 ? 'the first principal component' : `the first ${k} principal components`}.`,
        answers: [{label: Q`\(\lambda_1\)`, value: lam}, {label: 'Fraction kept', value: keep / tot}],
        hint: Q`If \(X_c=U\Sigma V^T\), then \(C=V\frac{\Sigma^2}{N-1}V^T\): each covariance eigenvalue is \(\sigma_i^2/(N-1)\).`,
        solution: Q`\(\lambda_1=${s[0]}^2/${N - 1}=${s[0] ** 2}/${N - 1}${eq(lam)}\). The fraction is \(\frac{${s.slice(0, k).map(x => x + '^2').join('+')}}{${s.map(x => x + '^2').join('+')}}=\frac{${keep}}{${tot}}${eq(keep / tot)}\); the factor \(1/(N-1)\) cancels from the ratio.`};
    }},
    {key: 'what-changes-pca', skill: 'Which changes can alter principal directions', make(r) {
      const n = r.int(40, 400), d = r.int(3, 12), j = r.int(1, d), c = r.int(5, 200), s = r.pick([2, 3, 10, 0.5]);
      const [from, to, f] = r.pick([['metres', 'millimetres', 1000], ['seconds', 'milliseconds', 1000], ['kilograms', 'grams', 1000], ['metres', 'centimetres', 100]]);
      const correct = r.pick([`Converting feature ${j} alone from ${from} to ${to} (multiplying only that column by ${f})`, 'Standardizing every feature to unit variance, when the features currently have different variances']);
      const wrong = r.shuffle([`Dividing by N = ${n} instead of N − 1 = ${n - 1}`, `Adding ${c} to every value of feature ${j} before centring`, `Multiplying every feature by the same factor ${s}`, `Shuffling the order of the ${n} sample rows`]).slice(0, 3);
      return {prompt: Q`You fit PCA to \(N=${n}\) training samples with \(D=${d}\) features, using \(C=X_c^TX_c/(N-1)\). Which change can alter the principal directions?`,
        answers: [choice(r, 'Change', correct, wrong)],
        hint: Q`For each change, ask whether it leaves \(C\) unchanged, multiplies all of \(C\) by one number, or changes the scale of some features relative to others.`,
        solution: Q`Using \(N\) instead of \(N-1\) multiplies \(C\) by \(${n - 1}/${n}\), and a common factor \(${s}\) multiplies it by \(${fx(s * s)}\): eigenvalues change, eigenvectors do not. Adding a constant to a feature is removed by centring, and row order does not affect \(X_c^TX_c\). Rescaling one feature, or standardizing features with unequal variances, changes their variances relative to each other, so the eigenvectors can rotate.`};
    }},
  ]);

  P.add(16, [
    {key: 'error-denominators', skill: 'Normalize a reconstruction error three ways', make(r) {
      const N = r.pick([4, 5, 6, 8, 10]), D = r.int(3, 4), s = r.distinct(D, 1, 9).sort((a, b) => b - a), k = r.int(1, D - 1);
      const drop = s.slice(k), err = sum(drop.map(x => x * x));
      return {prompt: Q`A centred dataset with \(N=${N}\) samples and \(D=${D}\) features has singular values \(${s.join(', ')}\). After keeping ${k} principal component${k > 1 ? 's' : ''}, give the squared Frobenius reconstruction error, the mean squared error per sample vector and the entrywise MSE (3 decimal places).`,
        answers: [{label: 'Squared Frobenius error', value: err, tol: 0}, {label: 'Per-sample mean squared error', value: err / N, ...places(3)}, {label: 'Entrywise MSE', value: err / (N * D), ...places(3)}],
        hint: Q`The squared Frobenius error is the sum of the discarded \(\sigma_i^2\). Per sample divides by \(N\); per entry divides by \(ND\).`,
        solution: Q`Discarded \(${drop.join(', ')}\): \(${drop.map(x => x + '^2').join('+')}=${err}\). Per sample: \(${err}/${N}${eq(err / N)}\). Per entry: \(${err}/(${N}\cdot${D})=${err}/${N * D}${eq(err / (N * D))}\). Same residuals, three different units, so state the denominator.`};
    }},
    {key: 'project-reconstruct', skill: 'Project and reconstruct a new sample with the training mean', make(r) {
      const [a, b] = r.pick([[3, 4], [4, 3], [3, -4], [4, -3], [-3, 4]]), v = [a / 5, b / 5], mu = [r.int(-3, 6), r.int(-3, 6)];
      let d = [r.int(-5, 5), r.int(-5, 5)];
      if (a * d[1] - b * d[0] === 0) d = [d[0] + 1, d[1]];  // keep x - mu off the retained line
      const x = [mu[0] + d[0], mu[1] + d[1]], zi = a * d[0] + b * d[1], z = zi / 5;
      const xh = [mu[0] + zi * a / 25, mu[1] + zi * b / 25], err = (25 * (d[0] ** 2 + d[1] ** 2) - zi * zi) / 25;
      return {prompt: Q`PCA fitted on the training split gave mean \(\mu=${vec(mu)}\) and unit principal direction \(v=${vec(v)}\). For a validation sample \(x=${vec(x)}\), find the score \(z=v^T(x-\mu)\), the one-component reconstruction \(\hat x=zv+\mu\) and the squared error \(\|x-\hat x\|_2^2\).`,
        answers: [{label: Q`\(z\)`, value: z}, {label: Q`\(\hat x\)`, vector: xh}, {label: Q`\(\|x-\hat x\|_2^2\)`, value: err}],
        hint: Q`Subtract the training mean \(\mu\) (not the validation sample's own statistics), then dot with \(v\).`,
        solution: Q`\(x-\mu=${vec(d)}\), so \(z=${v[0]}\cdot${par(d[0])}+${par(v[1])}\cdot${par(d[1])}=${fx(z)}\). Then \(\hat x=${fx(z)}\cdot${vec(v)}+${vec(mu)}=${vec(xh.map(t => fx(t)))}\). The error is \(\|x-\mu\|^2-z^2=${d[0] ** 2 + d[1] ** 2}-${fx(z * z)}=${fx(err)}\), the squared length of the discarded perpendicular part.`};
    }},
    {key: 'smallest-rank', skill: 'Smallest rank meeting a reconstruction-error budget', make(r) {
      const s = r.distinct(5, 1, 12).sort((a, b) => b - a), pct = r.pick([5, 10, 15, 20, 25]), tot = sum(s.map(x => x * x));
      const tails = [tot];
      while (100 * tails.at(-1) > pct * tot) tails.push(tails.at(-1) - s[tails.length - 1] ** 2);
      const k = tails.length - 1, err = tails[k];
      return {prompt: Q`Centred data has singular values \(${s.join(', ')}\). What is the smallest number of components \(k\) whose squared Frobenius reconstruction error is at most ${pct}% of \(\|X_c\|_F^2\)? Also give that error.`,
        answers: [{label: Q`\(k\)`, value: k, tol: 0}, {label: 'Squared error at that k', value: err, tol: 0}],
        hint: Q`Square the singular values and add them for the total. The error after keeping \(k\) components is the sum of the remaining squares.`,
        solution: Q`\(\|X_c\|_F^2=${s.map(x => x + '^2').join('+')}=${tot}\), so the budget is \(${pct/100}\cdot${tot}=${fx(pct * tot / 100, 2)}\). The errors for \(k=${tails.slice(1).map((_, i) => i + 1).join(', ')}\) are \(${tails.slice(1).join(', ')}\); the first within budget is at \(k=${k}\), with error \(${err}\).`};
    }},
    {key: 'leakage-protocol', skill: 'Preprocessing and splits that avoid leakage', make(r) {
      if (r.bool()) {
        const tr = 10 * r.int(30, 80), va = 10 * r.int(5, 15), te = 10 * r.int(5, 15), k = r.int(5, 50);
        const correct = `Fit the mean and PCA basis on the ${tr} training images only, then apply them unchanged to validation and test`;
        return {prompt: Q`You will reduce images to \(k=${k}\) PCA components before a nearest-centroid classifier, using ${tr} training, ${va} validation and ${te} test images. Which protocol keeps the validation and test scores honest?`,
          answers: [choice(r, 'Protocol', correct, [`Fit PCA on all ${tr + va + te} images before splitting, since PCA does not use labels`, `Fit a separate PCA basis on the ${va} validation images so their features are properly centred`, 'Centre each test batch with its own mean, then project it with the training basis'])],
          hint: 'Treat the mean and the principal directions as fitted parameters, exactly like classifier weights.',
          solution: `PCA learns a mean and directions from data, so fitting it on validation or test images lets held-out data shape the features even without labels. A separate validation basis gives coordinates that do not match the ones the classifier was trained on, and re-centring each batch makes a prediction depend on which other images share the batch. Fit on the ${tr} training images and apply that same transform everywhere.`};
      }
      const v = r.int(12, 60), per = r.pick([20, 30, 50, 100]), n = v * per, m = r.pick([5, 10]);
      const correct = 'Assign whole videos to training, validation or test, so no video contributes frames to two splits';
      return {prompt: `A dataset has ${n} frames from ${v} videos (${per} per video), and the model will be used on videos it has never seen. Which split gives the most honest estimate of that future performance?`,
        answers: [choice(r, 'Split', correct, [`Shuffle all ${n} frames and split them at random`, `Put every ${m}th frame of each video in the test set and the rest in training`, 'Split frames at random, then drop test frames that are pixel-identical to a training frame'])],
        hint: 'Neighbouring frames of one video are near-duplicates. Ask what a test frame could share with the training set under each option.',
        solution: `Random or interleaved frame splits put near-copies of each test frame into training, so the score rewards recognizing familiar scenes. Removing only pixel-identical frames leaves the near-duplicates. Grouping by video makes every test video new to the model, which matches the deployment question.`};
    }},
  ]);

  /* ---------- Module 05: derivatives, gradients, Jacobians, Hessians ---------- */
  P.add(17, [
    {key: 'poly-derivative', skill: 'Differentiate a polynomial and evaluate it', make(r) {
      const a = r.nonzero(-3, 3), b = r.int(-4, 4), c = r.int(-6, 6), d = r.int(-9, 9), x = r.nonzero(-3, 3);
      const f = a * x ** 3 + b * x ** 2 + c * x + d, df = 3 * a * x * x + 2 * b * x + c;
      return {prompt: Q`For \(f(x)=${poly([[a, 'x^3'], [b, 'x^2'], [c, 'x'], [d, '']])}\), find \(f(${x})\) and \(f'(${x})\).`,
        answers: [{label: Q`\(f(${x})\)`, value: f, tol: 0}, {label: Q`\(f'(${x})\)`, value: df, tol: 0}],
        hint: Q`Differentiate term by term with \(\frac{d}{dx}x^n=nx^{n-1}\) (the constant drops out), then substitute \(x=${x}\).`,
        solution: Q`\(f'(x)=${poly([[3 * a, 'x^2'], [2 * b, 'x'], [c, '']])}\). At \(x=${x}\): \(f(${x})=${f}\) and \(f'(${x})=${3 * a}\cdot${par(x)}^2+${par(2 * b)}\cdot${par(x)}+${par(c)}=${df}\). The value is a height; the derivative is a slope.`};
    }},
    {key: 'tangent-error', skill: 'Tangent-line approximation and its error', make(r) {
      const n = r.pick([2, 3]), x0 = n === 2 ? r.int(2, 9) : r.int(1, 4), h = r.pick([0.1, -0.1, 0.2, -0.2, 0.05, 0.3]), x1 = fx(x0 + h);
      const f0 = x0 ** n, d0 = n * x0 ** (n - 1), lin = f0 + d0 * h, exact = x1 ** n, err = exact - lin;
      return {prompt: Q`Use the tangent line of \(f(x)=x^${n}\) at \(x_0=${x0}\) to approximate \(f(${x1})\). Then give the error \(f(${x1})\) minus that approximation. Give both to 4 decimal places.`,
        answers: [{label: 'Tangent approximation', value: lin, ...places(4)}, {label: 'Error (exact − tangent)', value: err, ...places(4)}],
        hint: Q`The tangent line is \(f(x_0)+f'(x_0)(x-x_0)\) with \(x-x_0=${h}\).`,
        solution: Q`\(f(${x0})=${f0}\) and \(f'(x)=${n === 2 ? '2x' : '3x^2'}\), so \(f'(${x0})=${d0}\). Tangent: \(${f0}+${d0}\cdot${par(h)}=${fx(lin)}\). Exact: \(${x1}^${n}=${fx(exact, 6)}\), so the error is \(${fx(err, 6)}\)${n === 2 ? Q`, which is exactly \(h^2\)` : Q`, which is \(3x_0h^2+h^3\)`}. It grows quickly as the step gets larger.`};
    }},
    {key: 'chain-rule', skill: 'Chain rule for a composite function', make(r) {
      const type = r.pick(['power', 'power', 'exp', 'log']), a = r.nonzero(-3, 3), x = r.int(-2, 2);
      const u = type === 'power' ? r.nonzero(-3, 3) : type === 'exp' ? r.int(-1, 1) : r.int(1, 6), b = u - a * x, inner = poly([[a, 'x'], [b, '']]);
      if (type === 'power') {
        const n = r.int(2, 4), df = n * a * u ** (n - 1);
        return {prompt: Q`Differentiate \(f(x)=(${inner})^${n}\) and evaluate \(f'(${x})\).`,
          answers: [{label: Q`\(f'(${x})\)`, value: df, tol: 0}],
          hint: Q`Name the inner quantity \(u=${inner}\). The derivative is the outer derivative \(${n}u^{${n - 1}}\) times \(du/dx\).`,
          solution: Q`With \(u=${inner}\), \(f=u^${n}\) and \(f'(x)=${n}u^{${n - 1}}\cdot${par(a)}\). At \(x=${x}\), \(u=${u}\), so \(f'(${x})=${n}\cdot${par(u)}^{${n - 1}}\cdot${par(a)}=${df}\).`};
      }
      if (type === 'exp') {
        const df = a * Math.exp(u);
        return {prompt: Q`Differentiate \(f(x)=e^{${inner}}\) and evaluate \(f'(${x})\).`,
          answers: [{label: Q`\(f'(${x})\)`, value: df}],
          hint: Q`Name the inner quantity \(u=${inner}\). The derivative of \(e^u\) is \(e^u\), multiplied by \(du/dx\).`,
          solution: Q`\(f'(x)=e^{${inner}}\cdot${par(a)}\). At \(x=${x}\) the exponent is \(${u}\), so \(f'(${x})=${a}e^{${u}}${eq(df)}\).`};
      }
      const df = a / u;
      return {prompt: Q`Differentiate \(f(x)=\ln(${inner})\) (natural log) and evaluate \(f'(${x})\).`,
        answers: [{label: Q`\(f'(${x})\)`, value: df}],
        hint: Q`Name the inner quantity \(u=${inner}\). The derivative of \(\ln u\) is \(1/u\), multiplied by \(du/dx\).`,
        solution: Q`\(f'(x)=\frac{${a}}{${inner}}\). At \(x=${x}\) the inner value is \(${u}\), so \(f'(${x})=${a}/${u}${eq(df)}\).`};
    }},
    {key: 'relu-kink', skill: 'Derivative of a scaled ReLU, including the kink', make(r) {
      const c = r.int(-3, 3), s = r.pick([1, 2, 3, -1, -2]), where = r.int(0, 2), x = where === 0 ? c - r.int(1, 3) : where === 1 ? c + r.int(1, 3) : c;
      const f = Q`${s === 1 ? '' : s === -1 ? '-' : s}\operatorname{ReLU}(${shift('x', c)})`;
      const opts = ['0', `${s}`, 'It does not exist: the one-sided slopes differ', 'It does not exist, because ReLU is not continuous'];
      const correct = opts[where === 2 ? 2 : where];
      const why = [Q`At \(x=${x}\) the ReLU input \(${x - c}\) is negative, so \(f\) is flat (zero) nearby and the slope is 0.`,
        Q`At \(x=${x}\) the ReLU input \(${x - c}\) is positive, so nearby \(f(x)=${s === 1 ? '' : s === -1 ? '-' : s}(${shift('x', c)})\) with slope ${s}.`,
        Q`At \(x=${x}\) the ReLU input is exactly 0. The slope from the left is 0 and from the right is ${s}, so no ordinary derivative exists; ReLU is continuous, the problem is the kink. Code picks a convention, often 0.`][where];
      return {prompt: Q`For \(f(x)=${f}\), what is \(f'(${x})\)?`,
        answers: [choice(r, Q`\(f'(${x})\)`, correct, opts.filter(o => o !== correct))],
        hint: Q`Find the sign of the ReLU input \(${shift('x', c)}\) at \(x=${x}\). \(\operatorname{ReLU}(t)\) has slope 0 for \(t<0\) and 1 for \(t>0\).`,
        solution: why};
    }},
  ]);

  P.add(18, [
    {key: 'gradient-polynomial', skill: 'Gradient of a two-variable polynomial', make(r) {
      const a = r.nonzero(-3, 3), b = r.int(-4, 4), c = r.nonzero(-3, 3), e = r.int(-5, 5), x = r.int(-3, 3), y = r.int(-3, 3);
      let d = r.int(-5, 5), g = [2 * a * x + b * y + d, b * x + 2 * c * y + e];
      if (!g[0] && !g[1]) { d += 1; g = [g[0] + 1, g[1]]; }
      const delta = [r.pick([0.1, -0.1, 0.2, -0.2]), r.pick([0.1, -0.1, 0.2, -0.2, 0])], change = g[0] * delta[0] + g[1] * delta[1];
      return {prompt: Q`For \(f(x,y)=${poly([[a, 'x^2'], [b, 'xy'], [c, 'y^2'], [d, 'x'], [e, 'y']])}\), find \(\nabla f\) at \((${x}, ${y})\). Then use it to estimate the change in \(f\) for the small step \(\delta=${vec(delta)}\).`,
        answers: [{label: Q`\(\nabla f(${x}, ${y})\)`, vector: g, tol: 0}, {label: 'Estimated change in f', value: change}],
        hint: Q`For \(\partial f/\partial x\) treat \(y\) as a constant, and the other way round. The change is approximately \(\nabla f^T\delta\).`,
        solution: Q`\(\partial f/\partial x=${poly([[2 * a, 'x'], [b, 'y'], [d, '']])}\) and \(\partial f/\partial y=${poly([[b, 'x'], [2 * c, 'y'], [e, '']])}\), so \(\nabla f(${x}, ${y})=${vec(g)}\). Then \(\Delta f\approx${g[0]}\cdot${par(delta[0])}+${par(g[1])}\cdot${par(delta[1])}=${fx(change)}\).`};
    }},
    {key: 'directional-derivative', skill: 'Directional derivative along a normalized direction', make(r) {
      const g = [r.nonzero(-8, 8), r.nonzero(-8, 8)], [p, q, n] = r.pick(TRIPLES), d = [p * r.sign(), q * r.sign()];
      const D = (g[0] * d[0] + g[1] * d[1]) / n, norm = Math.hypot(g[0], g[1]);
      return {prompt: Q`At a point, \(\nabla f=${vec(g)}\). Find the directional derivative in the direction of \(d=${vec(d)}\) (normalize \(d\) first), and the largest directional derivative over all unit directions.`,
        answers: [{label: Q`\(D_uf\)`, value: D}, {label: 'Largest directional derivative', value: norm}],
        hint: Q`Divide \(d\) by its length to get a unit vector \(u\), then compute \(\nabla f^Tu\). Cauchy–Schwarz bounds it by \(\|\nabla f\|_2\).`,
        solution: Q`\(\|d\|=${n}\), so \(u=${vec(d.map(t => fx(t / n)))}\) and \(D_uf=\frac{${g[0]}\cdot${par(d[0])}+${par(g[1])}\cdot${par(d[1])}}{${n}}=\frac{${g[0] * d[0] + g[1] * d[1]}}{${n}}${eq(D)}\). The largest value is \(\|\nabla f\|=\sqrt{${g[0] ** 2 + g[1] ** 2}}${eq(norm)}\), along \(u=\nabla f/\|\nabla f\|\).`};
    }},
    {key: 'least-squares-gradient', skill: 'Gradient of a least-squares loss', make(r) {
      const N = r.int(2, 3), A = Array.from({length: N}, () => [r.int(-2, 3), r.int(-2, 3)]), th = [r.int(-2, 2), r.int(-2, 2)], b = Array.from({length: N}, () => r.int(-3, 4));
      const res = A.map((row, i) => row[0] * th[0] + row[1] * th[1] - b[i]);
      if (res.every(t => t === 0)) { b[0] += 1; res[0] -= 1; }
      const conv = r.pick(['half', 'sum', 'mean']), factor = conv === 'half' ? 1 : conv === 'sum' ? 2 : 2 / N;
      const AtR = [0, 1].map(j => sum(A.map((row, i) => row[j] * res[i]))), grad = AtR.map(t => factor * t);
      const L = {half: Q`\tfrac12\|A\theta-b\|^2`, sum: Q`\|A\theta-b\|^2`, mean: Q`\tfrac1{${N}}\|A\theta-b\|^2`}[conv], pre = {half: '', sum: '2', mean: Q`\tfrac2{${N}}`}[conv];
      return {prompt: Q`Let \(A=${mat(A)}\), \(b=${mat(b.map(t => [t]))}\), \(\theta=${vec(th)}\) and \(L(\theta)=${L}\). Compute \(\nabla L(\theta)\).`,
        answers: [{label: Q`\(\nabla L(\theta)\)`, vector: grad}],
        hint: Q`First compute the residual \(r=A\theta-b\). The gradient is a multiple of \(A^Tr\); the multiple depends on the \(\tfrac12\), the plain sum or the mean.`,
        solution: Q`Residual \(r=A\theta-b=${vec(res)}\). Then \(A^Tr=${vec(AtR)}\), and \(\nabla L=${pre}A^Tr=${vec(grad.map(t => fx(t)))}\). Like \(\theta\), it has two entries.`};
    }},
    {key: 'steepest-descent', skill: 'Direction and rate of steepest local decrease', make(r) {
      const [p, q, n] = r.pick(TRIPLES), g = [p * r.sign(), q * r.sign()], fmt = v => `(${v.map(t => fx(t, 3)).join(', ')})`;
      const correct = fmt([-g[0] / n, -g[1] / n]);
      return {prompt: Q`At the current parameters the loss has gradient \(\nabla L=${vec(g)}\). Which unit direction \(u\) gives the steepest local decrease, and what is the directional derivative along it?`,
        answers: [choice(r, 'Steepest-descent direction', correct, [fmt([g[0] / n, g[1] / n]), fmt([g[1] / n, -g[0] / n]), fmt([-Math.sign(g[0]), 0])]), {label: Q`\(\nabla L^Tu\)`, value: -n, tol: 0}],
        hint: Q`For a unit \(u\), \(\nabla L^Tu\ge-\|\nabla L\|_2\) by Cauchy–Schwarz. Which \(u\) attains the bound?`,
        solution: Q`\(\|\nabla L\|=\sqrt{${p * p}+${q * q}}=${n}\). The minimum of \(\nabla L^Tu\) over unit vectors is \(-${n}\), reached at \(u=-\nabla L/\|\nabla L\|=${correct}\). This is local: a large step along \(u\) can still overshoot.`};
    }},
  ]);

  P.add(19, [
    {key: 'jacobian-point', skill: 'Evaluate a Jacobian and predict output changes', make(r) {
      const a = r.nonzero(-3, 3), b = r.nonzero(-3, 3), x = r.nonzero(-2, 3), y = r.nonzero(-2, 3);
      const T = r.pick([
        {f: [poly([[a, 'xy']]), poly([[1, 'x^2'], [b, 'y']])], S: [[poly([[a, 'y']]), poly([[a, 'x']])], ['2x', `${b}`]], J: [[a * y, a * x], [2 * x, b]]},
        {f: [poly([[a, 'x'], [b, 'y']]), 'x^2y'], S: [[`${a}`, `${b}`], ['2xy', 'x^2']], J: [[a, b], [2 * x * y, x * x]]},
        {f: [poly([[1, 'x^2'], [a, 'y^2']]), poly([[b, 'xy']])], S: [['2x', poly([[2 * a, 'y']])], [poly([[b, 'y']]), poly([[b, 'x']])]], J: [[2 * x, 2 * a * y], [b * y, b * x]]},
      ]);
      const delta = r.pick([[0.1, 0], [0, 0.1], [0.1, -0.1], [-0.1, 0.2], [0.2, 0.1]]), Jd = T.J.map(row => fx(row[0] * delta[0] + row[1] * delta[1], 6));
      return {prompt: Q`For \(f(x,y)=\big(${T.f[0]},\ ${T.f[1]}\big)\), evaluate the Jacobian \(J\) at \((${x}, ${y})\), with rows indexing outputs. Then use it to predict the change in \(f\) for the input change \(\delta=${vec(delta)}\).`,
        answers: [{label: Q`\(J_{11}, J_{12}, J_{21}, J_{22}\)`, vector: T.J.flat(), tol: 0}, {label: Q`predicted change \(J\delta\)`, vector: Jd}],
        hint: Q`Row \(i\) holds the partial derivatives of output \(i\): \(J_{ij}=\partial f_i/\partial x_j\). Then \(\Delta f\approx J\delta\).`,
        solution: Q`\(J=${mat(T.S)}\), so at \((${x}, ${y})\), \(J=${mat(T.J)}\). Then \(J\delta=${vec(Jd)}\): each output changes by its row dotted with \(\delta\).`};
    }},
    {key: 'scalar-backprop', skill: 'Backpropagate through a linear unit and squared loss', make(r) {
      const x = r.nonzero(-3, 3), w = r.int(-3, 3), b = r.int(-3, 3), a = w * x + b, half = r.bool();
      let t = r.int(-5, 5);
      if (t === a) t += 2;
      const e = a - t, dLda = half ? e : 2 * e, L = half ? e * e / 2 : e * e, grads = [dLda * x, dLda, dLda * w], h = half ? Q`\tfrac12` : '';
      return {prompt: Q`A graph computes \(a=wx+b\) and \(L=${h}(a-y)^2\) with \(x=${x}\), \(w=${w}\), \(b=${b}\) and target \(y=${t}\). Find \(L\) and the gradients \(\partial L/\partial w\), \(\partial L/\partial b\), \(\partial L/\partial x\).`,
        answers: [{label: Q`\(L\)`, value: L}, {label: Q`\(\partial L/\partial w,\ \partial L/\partial b,\ \partial L/\partial x\)`, vector: grads, tol: 0}],
        hint: Q`Run the forward pass first. Then find \(\partial L/\partial a\) and multiply it by each local derivative: \(\partial a/\partial w=x\), \(\partial a/\partial b=1\), \(\partial a/\partial x=w\).`,
        solution: Q`Forward: \(a=${w}\cdot${par(x)}+${par(b)}=${a}\), so \(L=${h}(${a}-${par(t)})^2=${L}\). Backward: \(\partial L/\partial a=${half ? '' : '2'}(a-y)=${dLda}\). Then \(\partial L/\partial w=${dLda}\cdot${par(x)}=${grads[0]}\), \(\partial L/\partial b=${dLda}\cdot1=${dLda}\) and \(\partial L/\partial x=${dLda}\cdot${par(w)}=${grads[2]}\).`};
    }},
    {key: 'shared-branches', skill: 'Add gradient contributions from every path', make(r) {
      const x = r.nonzero(-2, 2), w = r.nonzero(-2, 2), u = w * x, c = r.nonzero(-3, 3), cubic = r.bool();
      const parts = cubic ? [3 * u * u, 2 * c * u] : [2 * u, c], dLdu = parts[0] + parts[1];
      const Ltex = cubic ? poly([[1, 'u^3'], [c, 'u^2']]) : poly([[1, 'u^2'], [c, 'u']]), local = cubic ? [Q`3u^2`, Q`${2 * c}u`] : [Q`2u`, `${c}`];
      return {prompt: Q`A graph computes \(u=wx\) and then \(L=${Ltex}\), so \(u\) feeds two branches. With \(w=${w}\) and \(x=${x}\), find \(\partial L/\partial u\) and \(\partial L/\partial w\).`,
        answers: [{label: Q`\(\partial L/\partial u\)`, value: dLdu, tol: 0}, {label: Q`\(\partial L/\partial w\)`, value: dLdu * x, tol: 0}],
        hint: Q`Differentiate each branch with respect to \(u\) and add the contributions. Then multiply by \(\partial u/\partial w=x\).`,
        solution: Q`\(u=${w}\cdot${par(x)}=${u}\). The branches contribute \(${local[0]}=${parts[0]}\) and \(${local[1]}=${parts[1]}\), so \(\partial L/\partial u=${dLdu}\). Then \(\partial L/\partial w=${dLdu}\cdot${par(x)}=${dLdu * x}\). Keeping only one branch would give a wrong gradient.`};
    }},
    {key: 'chain-shapes', skill: 'Jacobian and gradient shapes through two linear maps', make(r) {
      const [D, H, C] = r.shuffle([2, 3, 4, 5, 8, 10, 16, 32, 64, 128]).slice(0, 3);
      return {prompt: Q`An input \(x\in\mathbb R^{${D}}\) passes through \(y=Ax\) with \(A\) of shape \((${H}, ${D})\), then \(z=By\) with \(B\) of shape \((${C}, ${H})\), and a scalar loss \(L(z)\). Give the shapes of the Jacobian \(\partial z/\partial x\) and of the column gradients \(\nabla_yL\) and \(\nabla_xL\).`,
        answers: [{label: Q`shape of \(\partial z/\partial x\)`, vector: [C, D], tol: 0}, {label: Q`shape of \(\nabla_yL\)`, vector: [H, 1], tol: 0}, {label: Q`shape of \(\nabla_xL\)`, vector: [D, 1], tol: 0}],
        hint: Q`A Jacobian has one row per output and one column per input. A gradient of a scalar has the shape of the variable it differentiates with respect to.`,
        solution: Q`\(\partial z/\partial x=BA\): \((${C}, ${H})(${H}, ${D})=(${C}, ${D})\). Reverse mode uses transposes: \(\nabla_yL=B^T\nabla_zL\) is \((${H}, ${C})(${C}, 1)=(${H}, 1)\), and \(\nabla_xL=A^T\nabla_yL\) is \((${D}, ${H})(${H}, 1)=(${D}, 1)\).`};
    }},
  ]);

  P.add(20, [
    {key: 'hessian-classify', skill: 'Hessian of a quadratic and its stationary point', make(r) {
      const kinds = ['minimum', 'maximum', 'saddle', 'flat'], kind = r.pick(kinds.slice(0, 3));
      const type = (a, b, c) => { const det = 4 * a * c - b * b; return det < 0 ? 'saddle' : det === 0 ? 'flat' : a > 0 ? 'minimum' : 'maximum'; };
      let a, b, c;
      do { a = r.nonzero(-3, 3); b = r.int(-4, 4); c = r.nonzero(-3, 3); } while (type(a, b, c) !== kind);
      const d = r.int(-4, 4), e = r.int(-4, 4), H = [[2 * a, b], [b, 2 * c]], det = 4 * a * c - b * b, tr = 2 * a + 2 * c;
      const text = {minimum: 'A local minimum', maximum: 'A local maximum', saddle: 'A saddle point', flat: 'The second-derivative test is inconclusive'};
      const why = kind === 'saddle' ? Q`\(\det H<0\), so the eigenvalues of \(H\) have opposite signs: the surface curves up along one direction and down along another.`
        : Q`\(\det H>0\), so both eigenvalues share a sign, and \(\operatorname{tr}H=${tr}\) is ${tr > 0 ? 'positive, so both are positive and the surface curves upward' : 'negative, so both are negative and the surface curves downward'} in every direction.`;
      return {prompt: Q`Find the Hessian of \(f(x,y)=${poly([[a, 'x^2'], [b, 'xy'], [c, 'y^2'], [d, 'x'], [e, 'y']])}\) and classify its stationary point.`,
        answers: [{label: Q`\(H_{11}, H_{12}, H_{22}\)`, vector: [2 * a, b, 2 * c], tol: 0}, choice(r, 'The stationary point is', text[kind], kinds.filter(k => k !== kind).map(k => text[k]))],
        hint: Q`Differentiate twice: \(H_{11}=\partial^2f/\partial x^2\), \(H_{12}=\partial^2f/\partial x\,\partial y\), \(H_{22}=\partial^2f/\partial y^2\). Then use the signs of \(\det H\) and \(\operatorname{tr}H\).`,
        solution: Q`\(H=${mat(H)}\) everywhere; the linear terms move the stationary point but do not change \(H\). \(\det H=${2 * a}\cdot${par(2 * c)}-${par(b)}^2=${det}\). ${why}`};
    }},
    {key: 'central-difference', skill: 'Central-difference estimate and its truncation error', make(r) {
      const a = r.nonzero(-2, 2), b = r.int(-3, 3), w = r.int(-2, 3), h = r.pick([0.1, 0.2, 0.05, 0.3]);
      const L = t => a * t ** 3 + b * t ** 2, g = 3 * a * w * w + 2 * b * w, err = a * h * h, est = g + err;
      return {prompt: Q`For \(L(w)=${poly([[a, 'w^3'], [b, 'w^2']])}\) at \(w=${w}\) with \(h=${h}\), compute the central difference \(\frac{L(w+h)-L(w-h)}{2h}\) and its error compared with the analytic derivative. Give both to 4 decimal places.`,
        answers: [{label: 'Central-difference estimate', value: est, ...places(4)}, {label: 'Estimate − analytic derivative', value: err, ...places(4)}],
        hint: Q`Evaluate \(L(${fx(w + h)})\) and \(L(${fx(w - h)})\), subtract, and divide by \(${fx(2 * h)}\). Compare with \(L'(w)\) from the power rule.`,
        solution: Q`\(L(${fx(w + h)})=${fx(L(w + h), 6)}\) and \(L(${fx(w - h)})=${fx(L(w - h), 6)}\), so the estimate is \(${fx(L(w + h) - L(w - h), 6)}/${fx(2 * h)}=${fx(est, 6)}\). Analytically \(L'(w)=${poly([[3 * a, 'w^2'], [2 * b, 'w']])}=${g}\), so the error is \(${fx(err, 6)}=${poly([[a, 'h^2']])}\): the squared term is differenced exactly, and the cubic leaves an \(h^2\) term.`};
    }},
    {key: 'taylor-second-order', skill: 'First- and second-order Taylor predictions', make(r) {
      const f0 = r.int(-5, 5), g = [r.int(-4, 4), r.int(-4, 4)], h12 = r.int(-3, 3), h22 = r.int(-2, 6), D = [r.pick([-3, -2, -1, 1, 2, 3]), r.pick([-3, -2, -1, 1, 2, 3])];
      let h11 = r.int(-2, 6), q = h11 * D[0] ** 2 + 2 * h12 * D[0] * D[1] + h22 * D[1] ** 2;
      if (q === 0) { h11 += 1; q += D[0] ** 2; }  // keep a visible curvature term
      const d = D.map(t => t / 10), H = [[h11, h12], [h12, h22]], lin = (g[0] * D[0] + g[1] * D[1]) / 10, first = f0 + lin, second = first + q / 200;
      return {prompt: Q`At \(x_0\), a function has \(f(x_0)=${f0}\), \(\nabla f(x_0)=${vec(g)}\) and Hessian \(H=${mat(H)}\). Predict \(f(x_0+\delta)\) for \(\delta=${vec(d)}\) to first order and to second order (3 decimal places).`,
        answers: [{label: 'First-order prediction', value: first, ...places(3)}, {label: 'Second-order prediction', value: second, ...places(3)}],
        hint: Q`First order: \(f(x_0)+\nabla f^T\delta\). Second order adds \(\tfrac12\delta^TH\delta\).`,
        solution: Q`\(\nabla f^T\delta=${fx(lin)}\), so the first-order prediction is \(${fx(first)}\). \(\delta^TH\delta=${h11}\cdot${par(d[0])}^2+2\cdot${par(h12)}\cdot${par(d[0])}\cdot${par(d[1])}+${par(h22)}\cdot${par(d[1])}^2=${fx(q / 100)}\), so the second-order prediction is \(${fx(first)}+\tfrac12\cdot${par(fx(q / 100))}=${fx(second)}\).`};
    }},
    {key: 'error-scaling', skill: 'How finite-difference error shrinks with the step size', make(r) {
      const central = r.bool(), h1 = r.pick([0.1, 0.2, 0.05, 0.04]), ratio = r.pick([2, 4, 5, 10]), h2 = fx(h1 / ratio, 6), order = central ? 2 : 1;
      const formula = central ? Q`\frac{L(w+h)-L(w-h)}{2h}` : Q`\frac{L(w+h)-L(w)}{h}`;
      return {prompt: Q`A gradient check on a smooth loss uses the ${central ? 'central' : 'forward'} difference \(${formula}\), and at \(h=${h1}\) its error is mostly truncation error. Ignoring roundoff, by what factor should the error shrink when \(h\) is reduced to \(${h2}\)?`,
        answers: [{label: 'Error shrinks by a factor of', value: ratio ** order, tol: 0}],
        hint: Q`Expand \(L(w\pm h)\) in a Taylor series. The ${central ? 'central' : 'forward'} difference error is proportional to \(${central ? 'h^2' : 'h'}\).`,
        solution: Q`${central ? Q`The \(h^2\) terms cancel in the central difference, leaving error \(\approx\tfrac16L'''(w)h^2\)` : Q`The forward difference keeps the curvature term, so its error is \(\approx\tfrac12L''(w)h\)`}. Dividing \(h\) by ${ratio} divides the error by \(${central ? `${ratio}^2=` : ''}${ratio ** order}\). Far smaller \(h\) eventually lets floating-point roundoff dominate.`};
    }},
  ]);

  /* ---------- Module 06: probability, variance and sampling uncertainty ---------- */
  P.add(21, [
    {key: 'bayes-frequency', skill: 'Posterior from a frequency table of 1000 images', make(r) {
      const nA = r.pick([20, 40, 60, 80, 100, 200, 300, 400]), sens = r.pick([60, 70, 75, 80, 85, 90, 95]), fpr = r.pick([5, 10, 15, 20, 25]);
      const tp = nA * sens / 100, fp = (1000 - nA) * fpr / 100, flagged = tp + fp, post = tp / flagged;
      const what = r.pick(['contain a pedestrian', 'show a cracked weld', 'contain a stop sign', 'show a defective part']);
      return {prompt: Q`Of 1000 representative images, ${nA} ${what} (event \(A\)). A detector flags (event \(B\)) ${sens}% of those images and ${fpr}% of the others. How many images are flagged, and what is \(P(A\mid B)\) to 3 decimal places?`,
        answers: [{label: 'Flagged images', value: flagged, tol: 0}, {label: Q`\(P(A\mid B)\)`, value: post, ...places(3)}],
        hint: Q`Split the 1000 images into the ${nA} with \(A\) and the ${1000 - nA} without. Count the flags in each group separately.`,
        solution: Q`True flags: \(${nA}\cdot${sens / 100}=${tp}\). False flags: \(${1000 - nA}\cdot${fpr / 100}=${fp}\). Flagged: \(${tp}+${fp}=${flagged}\). So \(P(A\mid B)=${tp}/${flagged}${eq(post)}\), different from the detection rate \(P(B\mid A)=${sens / 100}\).`};
    }},
    {key: 'bayes-no-alert', skill: 'Probability of a missed object given no alert', make(r) {
      const pA = r.pick([0.05, 0.1, 0.2, 0.3, 0.4]), sens = r.pick([0.7, 0.8, 0.9, 0.95]), fpr = r.pick([0.05, 0.1, 0.2]);
      const miss = (1 - sens) * pA, quiet = (1 - fpr) * (1 - pA), pNotB = miss + quiet, post = miss / pNotB;
      return {prompt: Q`An object appears in a fraction \(P(A)=${pA}\) of images. A detector alerts (event \(B\)) with \(P(B\mid A)=${sens}\) and \(P(B\mid\neg A)=${fpr}\). Find \(P(\neg B)\) to 3 decimal places and \(P(A\mid\neg B)\), the chance that an image without an alert still contains the object, to 4 decimal places.`,
        answers: [{label: Q`\(P(\neg B)\)`, value: pNotB, ...places(3)}, {label: Q`\(P(A\mid\neg B)\)`, value: post, ...places(4)}],
        hint: Q`Use \(P(\neg B\mid A)=1-P(B\mid A)\) and \(P(\neg B\mid\neg A)=1-P(B\mid\neg A)\), then add the two routes to "no alert".`,
        solution: Q`\(P(A\cap\neg B)=${fx(1 - sens, 2)}\cdot${pA}=${fx(miss, 6)}\) and \(P(\neg A\cap\neg B)=${fx(1 - fpr, 2)}\cdot${fx(1 - pA, 2)}=${fx(quiet, 6)}\). So \(P(\neg B)=${fx(pNotB, 6)}\) and \(P(A\mid\neg B)=${fx(miss, 6)}/${fx(pNotB, 6)}${eq(post, 5)}\).`};
    }},
    {key: 'independence-check', skill: 'Test independence and combine event probabilities', make(r) {
      const pA = r.pick([0.2, 0.3, 0.4, 0.5, 0.6]), pB = r.pick([0.2, 0.25, 0.4, 0.5, 0.8]), indep = r.bool(), prod = fx(pA * pB);
      const [ea, eb] = r.pick([['the image is blurred', 'the image was taken at night'], ['a car is present', 'the scene is urban'], ['the label is wrong', 'the image came from camera 2']]);
      const lo = Math.max(0, pA + pB - 1), hi = Math.min(pA, pB);
      const joint = indep ? prod : r.pick([-0.06, -0.04, 0.04, 0.05, 0.1].map(s => fx(prod + s)).filter(j => j > lo && j < hi));
      const yes = 'Yes: P(A ∩ B) equals P(A)P(B)', no = 'No: P(A ∩ B) differs from P(A)P(B)';
      return {prompt: Q`Let \(A\) be "${ea}" and \(B\) be "${eb}", with \(P(A)=${pA}\), \(P(B)=${pB}\) and \(P(A\cap B)=${joint}\). Find \(P(A\mid B)\) and \(P(A\cup B)\) to 3 decimal places, and decide whether \(A\) and \(B\) are independent.`,
        answers: [{label: Q`\(P(A\mid B)\)`, value: joint / pB, ...places(3)}, {label: Q`\(P(A\cup B)\)`, value: pA + pB - joint, ...places(3)}, choice(r, 'Independent?', indep ? yes : no, [indep ? no : yes])],
        hint: Q`\(P(A\mid B)=P(A\cap B)/P(B)\) and \(P(A\cup B)=P(A)+P(B)-P(A\cap B)\). For independence compare \(P(A\cap B)\) with \(P(A)P(B)\).`,
        solution: Q`\(P(A\mid B)=${joint}/${pB}${eq(joint / pB)}\) and \(P(A\cup B)=${pA}+${pB}-${joint}=${fx(pA + pB - joint)}\). \(P(A)P(B)=${prod}\), which ${indep ? 'equals' : 'differs from'} \(P(A\cap B)=${joint}\), so they are ${indep ? '' : 'not '}independent; equivalently \(P(A\mid B)\) ${indep ? 'equals' : 'differs from'} \(P(A)=${pA}\).`};
    }},
    {key: 'two-way-table', skill: 'Both conditioning directions from a count table', make(r) {
      const tp = r.int(20, 90), fn = r.int(5, 40), fp = r.int(5, 60), tn = r.int(100, 400), N = tp + fn + fp + tn;
      return {prompt: Q`A detector was run on ${N} images: ${tp} contain the object and were flagged, ${fn} contain it but were not flagged, ${fp} were flagged without the object, and ${tn} had neither. With \(A\) = "contains the object" and \(B\) = "flagged", find \(P(A)\), \(P(B\mid A)\) and \(P(A\mid B)\) to 3 decimal places.`,
        answers: [{label: Q`\(P(A)\)`, value: (tp + fn) / N, ...places(3)}, {label: Q`\(P(B\mid A)\)`, value: tp / (tp + fn), ...places(3)}, {label: Q`\(P(A\mid B)\)`, value: tp / (tp + fp), ...places(3)}],
        hint: Q`A conditional probability restricts attention to the condition's group: \(P(B\mid A)\) uses only the images with the object, \(P(A\mid B)\) only the flagged images.`,
        solution: Q`\(P(A)=(${tp}+${fn})/${N}${eq((tp + fn) / N)}\). Among the ${tp + fn} object images, \(P(B\mid A)=${tp}/${tp + fn}${eq(tp / (tp + fn))}\) (the recall). Among the ${tp + fp} flagged images, \(P(A\mid B)=${tp}/${tp + fp}${eq(tp / (tp + fp))}\) (the precision). Same numerator, different conditioning group.`};
    }},
  ]);

  P.add(22, [
    {key: 'discrete-expectation', skill: 'Expectation and second moment of a discrete variable', make(r) {
      const k = r.int(3, 4), vals = r.distinct(k, -3, 5).sort((a, b) => a - b), cuts = r.distinct(k - 1, 1, 9).sort((a, b) => a - b);
      const tenths = cuts.map((c, i) => c - (i ? cuts[i - 1] : 0)).concat(10 - cuts[k - 2]), p = tenths.map(t => t / 10);
      const E1 = sum(vals.map((v, i) => v * tenths[i])) / 10, E2 = sum(vals.map((v, i) => v * v * tenths[i])) / 10;
      return {prompt: Q`A random variable \(X\) takes the values \(${vals.join(', ')}\) with probabilities \(${p.join(', ')}\). Find \(\mathbb E[X]\) and \(\mathbb E[X^2]\).`,
        answers: [{label: Q`\(\mathbb E[X]\)`, value: E1}, {label: Q`\(\mathbb E[X^2]\)`, value: E2}],
        hint: Q`Use \(\mathbb E[f(X)]=\sum_x f(x)P(X=x)\): multiply each value (or its square) by its probability and add.`,
        solution: Q`\(\mathbb E[X]=${vals.map((v, i) => `${par(v)}\\cdot${p[i]}`).join('+')}=${E1}\) and \(\mathbb E[X^2]=${vals.map((v, i) => `${v * v}\\cdot${p[i]}`).join('+')}=${E2}\). The expectation need not be a value \(X\) can take.`};
    }},
    {key: 'uniform-interval', skill: 'Uniform density, interval probability and mean', make(r) {
      const w = r.pick([2, 4, 5, 8, 10]), a = r.int(-3, 3), b = a + w, c = r.int(a - 1, b - 1), d = r.int(Math.max(c, a) + 1, b + 1);
      const L = Math.max(c, a), R = Math.min(d, b), overlap = R - L;
      return {prompt: Q`\(X\) is uniform on \([${a}, ${b}]\). Give its density inside the interval, \(P(${c}\le X\le ${d})\) and \(\mathbb E[X]\), each to 3 decimal places.`,
        answers: [{label: 'Density', value: 1 / w, ...places(3)}, {label: Q`\(P(${c}\le X\le ${d})\)`, value: overlap / w, ...places(3)}, {label: Q`\(\mathbb E[X]\)`, value: (a + b) / 2, ...places(3)}],
        hint: Q`The density is constant on \([${a}, ${b}]\) and zero outside; the total area must be 1. Probability is the area over the part of \([${c}, ${d}]\) inside the support.`,
        solution: Q`Height \(1/${w}=${fx(1 / w)}\). ${c < a || d > b ? Q`Only \([${L}, ${R}]\) lies inside the support, with` : 'The interval has'} width \(${overlap}\), so the probability is \(${overlap}/${w}=${fx(overlap / w)}\). By symmetry \(\mathbb E[X]=(${a}+${b})/2=${(a + b) / 2}\).`};
    }},
    {key: 'linear-density', skill: 'Normalize a linear density and find an interval probability', make(r) {
      const L = r.int(1, 4), t = fx(L * r.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]), 2), c = 2 / (L * L), prob = (t / L) ** 2, mean = 2 * L / 3;
      return {prompt: Q`A random offset \(X\) has density \(p(x)=cx\) on \([0, ${L}]\) and 0 elsewhere. Find \(c\), \(P(X\le ${t})\) and \(\mathbb E[X]\), each to 3 decimal places.`,
        answers: [{label: Q`\(c\)`, value: c, ...places(3)}, {label: Q`\(P(X\le ${t})\)`, value: prob, ...places(3)}, {label: Q`\(\mathbb E[X]\)`, value: mean, ...places(3)}],
        hint: Q`The total area under \(p\) must be 1, and that area is a triangle with base \(${L}\) and height \(${L}c\).`,
        solution: Q`Area \(\tfrac12\cdot${L}\cdot${L}c=1\) gives \(c=2/${L * L}${eq(c)}\). \(P(X\le ${t})\) is the triangle up to \(${t}\): \(\tfrac12c\cdot${t}^2=(${t}/${L})^2${eq(prob)}\). \(\mathbb E[X]=\int_0^{${L}}x\cdot cx\,dx=c\cdot${L}^3/3=${2 * L}/3${eq(mean)}\).`};
    }},
    {key: 'density-not-probability', skill: 'Density height versus probability', make(r) {
      const w = r.pick([0.1, 0.2, 0.25, 0.5]), h = fx(1 / w), x0 = fx(w * r.pick([0.2, 0.4, 0.6, 0.8]), 3);
      const correct = r.pick([`P(X = ${x0}) = 0, even though the density at ${x0} is ${h}`, `P(X ≤ ${x0}) = ${fx(x0 / w, 3)}`]);
      return {prompt: Q`A sub-pixel offset \(X\) is uniform on \([0, ${w}]\) pixels. Which statement about the point \(x=${x0}\) is correct?`,
        answers: [choice(r, 'Statement', correct, [`P(X = ${x0}) = ${h}`, `This is not a valid density, because ${h} is greater than 1`, `P(0 ≤ X ≤ ${w}) = ${h}`])],
        hint: Q`Find the density height first. A probability is an area under the density, so ask what width each event has.`,
        solution: Q`The density is \(1/${w}=${h}\) per pixel on \([0, ${w}]\); it may exceed 1 because the total area \(${h}\cdot${w}=1\). A single point has width 0, so \(P(X=${x0})=0\), while \(P(X\le ${x0})=${h}\cdot${x0}=${fx(x0 / w, 3)}\) and the whole interval has probability 1.`};
    }},
  ]);

  P.add(23, [
    {key: 'population-vs-sample', skill: 'Population versus sample variance', make(r) {
      const n = r.int(4, 5);
      let d;
      do { d = Array.from({length: n - 1}, () => r.int(-4, 4)); d.push(-sum(d)); } while (Math.abs(d[n - 1]) > 5 || d.every(t => t === 0));
      const m = r.int(2, 12), x = r.shuffle(d).map(t => m + t), dev = x.map(t => t - m), ss = sum(dev.map(t => t * t));
      return {prompt: Q`${n === 4 ? 'Four' : 'Five'} repeated measurements of a pixel are \(${x.join(', ')}\). Find their mean, the population variance (divide by \(N\)) and the sample variance (divide by \(N-1\)).`,
        answers: [{label: 'Mean', value: m, tol: 0}, {label: 'Population variance', value: ss / n}, {label: 'Sample variance', value: ss / (n - 1)}],
        hint: 'Find the mean, subtract it from every value, square the deviations and add them. Only the final denominator differs.',
        solution: Q`Mean \(${m}\); deviations \(${dev.join(', ')}\); squared sum \(${ss}\). Population variance \(${ss}/${n}=${fx(ss / n)}\); sample variance \(${ss}/${n - 1}${eq(ss / (n - 1))}\). Use \(N-1\) when estimating an unknown population variance from a sample.`};
    }},
    {key: 'variance-combination', skill: 'Variance of a linear combination with covariance', make(r) {
      const sx = r.int(1, 3), sy = r.int(1, 4), lim = sx * sy - 1, cov = lim ? r.int(-lim, lim) : 0;  // |Cov| < sd_x sd_y keeps the covariance matrix valid
      const a = r.nonzero(-3, 3), b = r.nonzero(-3, 3), c = r.int(-5, 5), V = a * a * sx * sx + b * b * sy * sy + 2 * a * b * cov;
      const Z = poly([[a, 'X'], [b, 'Y'], [c, '']]);
      return {prompt: Q`\(\operatorname{Var}(X)=${sx * sx}\), \(\operatorname{Var}(Y)=${sy * sy}\) and \(\operatorname{Cov}(X,Y)=${cov}\). Find \(\operatorname{Var}(${Z})\) and its standard deviation.`,
        answers: [{label: Q`\(\operatorname{Var}(${Z})\)`, value: V, tol: 0}, {label: 'Standard deviation', value: Math.sqrt(V)}],
        hint: Q`\(\operatorname{Var}(aX+bY+c)=a^2\operatorname{Var}(X)+b^2\operatorname{Var}(Y)+2ab\operatorname{Cov}(X,Y)\); a constant shift does not change spread.`,
        solution: Q`\(${a * a}\cdot${sx * sx}+${b * b}\cdot${sy * sy}+2\cdot${par(a)}\cdot${par(b)}\cdot${par(cov)}=${V}\)${c ? Q`; the \(${c}\) drops out` : ''}. The standard deviation is \(\sqrt{${V}}${eq(Math.sqrt(V))}\), in the units of \(X\) and \(Y\).`};
    }},
    {key: 'average-correlated-noise', skill: 'Variance of an average with correlated noise', make(r) {
      const s2 = r.pick([4, 9, 16, 25, 36]), N = r.pick([4, 5, 8, 10]), rho = r.pick([0.1, 0.2, 0.25, 0.5]);
      const indep = s2 / N, corr = s2 / N * (1 + (N - 1) * rho);
      return {prompt: Q`A pixel is measured ${N} times, and each measurement has noise variance \(\sigma^2=${s2}\). Find the variance of the average if the noises are independent, and if every pair of noises has correlation \(\rho=${rho}\).`,
        answers: [{label: 'Independent noise', value: indep}, {label: 'Correlated noise', value: corr}],
        hint: Q`\(\operatorname{Var}(\bar X)=\frac1{N^2}\sum_i\sum_j\operatorname{Cov}(\epsilon_i,\epsilon_j)\): there are \(N\) variance terms and \(N(N-1)\) covariance terms \(\rho\sigma^2\).`,
        solution: Q`Independent: \(\sigma^2/N=${s2}/${N}=${fx(indep)}\). Correlated: \(\frac{${N}\cdot${s2}+${N * (N - 1)}\cdot${rho}\cdot${s2}}{${N * N}}=\frac{\sigma^2}{N}(1+(N-1)\rho)=${fx(corr)}\). The covariance terms do not average away, so near-duplicate measurements are worth less.`};
    }},
    {key: 'zero-covariance', skill: 'Zero covariance without independence', make(r) {
      const a = r.int(1, 3), q = r.pick([0.1, 0.2, 0.25, 0.3, 0.4]), sq = r.bool(), EY = fx(sq ? 2 * q * a * a : 2 * q * a), Y = sq ? 'X^2' : '|X|', ya = sq ? a * a : a;
      return {prompt: Q`\(X\) takes the values \(-${a}, 0, ${a}\) with probabilities \(${q}, ${fx(1 - 2 * q, 2)}, ${q}\), and \(Y=${Y}\). Find \(\mathbb E[Y]\), then choose the correct statement about \(X\) and \(Y\).`,
        answers: [{label: Q`\(\mathbb E[Y]\)`, value: EY}, choice(r, 'Statement', 'Cov(X, Y) = 0, yet X and Y are dependent', ['Cov(X, Y) = 0, so X and Y are independent', 'Cov(X, Y) > 0, because Y grows as |X| grows', `Cov(X, Y) = ${EY}, the mean of Y`])],
        hint: Q`\(\operatorname{Cov}(X,Y)=\mathbb E[XY]-\mathbb E[X]\mathbb E[Y]\). Use the symmetry of \(X\) around 0.`,
        solution: Q`\(Y\) is \(${ya}\) when \(X=\pm${a}\) and 0 otherwise, so \(\mathbb E[Y]=2\cdot${q}\cdot${ya}=${EY}\). \(\mathbb E[X]=0\) and \(\mathbb E[XY]=${q}\cdot(-${a})\cdot${ya}+${q}\cdot${a}\cdot${ya}=0\), so the covariance is 0. Yet \(Y\) is a function of \(X\): \(P(Y=0\mid X=0)=1\) while \(P(Y=0)=${fx(1 - 2 * q, 2)}\), so they are dependent.`};
    }},
  ]);

  P.add(24, [
    {key: 'accuracy-interval', skill: 'Plug-in standard error and normal interval for accuracy', make(r) {
      const N = r.pick([100, 200, 250, 400, 500, 800]), k = Math.round(N * r.pick([0.6, 0.66, 0.7, 0.75, 0.8, 0.84, 0.9, 0.95]));
      const p = k / N, se = Math.sqrt(p * (1 - p) / N), lo = p - 1.96 * se, hi = p + 1.96 * se;
      return {prompt: Q`A classifier is right on ${k} of ${N} independently sampled test images. Find the plug-in standard error of its accuracy (4 decimal places) and the normal 95% interval \(\hat p\pm1.96\,\mathrm{SE}\) (3 decimal places).`,
        answers: [{label: 'Standard error', value: se, ...places(4)}, {label: '95% interval (lower, upper)', vector: [lo, hi], ...places(3)}],
        hint: Q`First compute \(\hat p=${k}/${N}\), then \(\mathrm{SE}=\sqrt{\hat p(1-\hat p)/N}\).`,
        solution: Q`\(\hat p=${fx(p)}\), so \(\mathrm{SE}=\sqrt{${fx(p)}\cdot${fx(1 - p)}/${N}}${eq(se, 5)}\). The half-width is \(1.96\cdot${fx(se, 5)}${eq(1.96 * se)}\), giving \([${fx(lo)}, ${fx(hi)}]\). This describes sampling uncertainty in the measured accuracy, not the confidence of any single prediction.`};
    }},
    {key: 'sample-size-for-se', skill: 'Sample size needed for a target standard error', make(r) {
      const pct = r.pick([50, 60, 70, 75, 80, 90, 95]), T = r.pick([10, 15, 20, 25, 30]), p = pct / 100, s = T / 1000;
      const exact = pct * (100 - pct) * 100 / (T * T), N = Math.ceil(exact);  // integer arithmetic: p(1-p)/s^2
      return {prompt: Q`You expect accuracy near ${p} and want a plug-in standard error of at most ${s}. What is the smallest number of independent test images \(N\) that achieves this?`,
        answers: [{label: Q`\(N\)`, value: N, tol: 0}],
        hint: Q`Solve \(\sqrt{p(1-p)/N}\le ${s}\) for \(N\), then round up to a whole number of images.`,
        solution: Q`\(N\ge p(1-p)/s^2=${fx(p * (1 - p))}/${fx(s * s, 6)}${Number.isInteger(exact) ? '=' : Q`\approx`}${fx(exact, 2)}\), so \(N=${N}\). Because the SE scales as \(1/\sqrt N\), halving it again would need about four times as many images.`};
    }},
    {key: 'mean-standard-error', skill: 'Standard error and interval for a mean with known noise', make(r) {
      const sigma = r.pick([2, 3, 4, 5, 6, 10, 12]), n = r.pick([4, 9, 16, 25, 36, 64, 100]), xbar = r.int(40, 200) + r.pick([0, 0.5]);
      const se = sigma / Math.sqrt(n), half = 1.96 * se;
      return {prompt: Q`A static pixel is read ${n} times with independent Gaussian noise of known standard deviation \(\sigma=${sigma}\), and the readings average \(\bar x=${xbar}\). Find the standard error of the mean and the 95% interval \(\bar x\pm1.96\,\mathrm{SE}\), to 3 decimal places.`,
        answers: [{label: 'Standard error', value: se, ...places(3)}, {label: '95% interval (lower, upper)', vector: [xbar - half, xbar + half], ...places(3)}],
        hint: Q`Averaging \(n\) independent readings divides the variance by \(n\), so the standard deviation of the mean is \(\sigma/\sqrt n\).`,
        solution: Q`\(\mathrm{SE}=${sigma}/\sqrt{${n}}=${sigma}/${Math.sqrt(n)}=${fx(se)}\). Half-width \(1.96\cdot${fx(se)}=${fx(half)}\), so the interval is \([${fx(xbar - half)}, ${fx(xbar + half)}]\). Individual readings still spread with SD \(${sigma}\); the SE describes the average.`};
    }},
    {key: 'bootstrap-unit', skill: 'Choose what a bootstrap resamples', make(r) {
      if (r.bool()) {
        const v = r.int(15, 60), per = r.pick([20, 40, 50, 100]), n = v * per;
        return {prompt: `A test set has ${n} frames from ${v} videos (${per} per video), frames within a video are strongly correlated, and the model will be used on new videos. What should each bootstrap replicate resample?`,
          answers: [choice(r, 'Each replicate resamples', `${v} whole videos, drawn with replacement, keeping every frame of each drawn video`, [`${n} individual frames, drawn with replacement, ignoring which video they came from`, `${n} individual frames, drawn without replacement`, `The softmax confidences of the ${n} frames, instead of their correctness`])],
          hint: 'Resample the units that are independent and that match the deployment question.',
          solution: `Frames from one video share scene, lighting and objects, so ${n} frames carry far less independent evidence than ${n} separate videos would. Resampling frames understates the uncertainty, and drawing all ${n} without replacement just reproduces the original set. Resampling the ${v} videos keeps each video's correlated frames together.`};
      }
      const n = r.pick([200, 300, 500, 1000]), ka = r.int(Math.round(0.7 * n), Math.round(0.9 * n)), kb = ka + r.nonzero(-20, 20);
      return {prompt: `Models A and B were both evaluated on the same ${n} test images (A was right on ${ka}, B on ${kb}). What should each bootstrap replicate do to estimate the uncertainty in their accuracy difference?`,
        answers: [choice(r, 'Each replicate should', `Draw ${n} images with replacement and score both models on the same drawn images`, [`Draw ${n} images separately for each model, so the two samples are independent`, `Draw all ${n} images without replacement and recompute the difference`, 'Subtract the two plug-in standard errors and use that as the uncertainty'])],
        hint: 'The outcomes are paired: each image gives one result for A and one for B.',
        solution: `Both models see the same images, so their results are correlated: hard images tend to defeat both. Resampling images once and scoring both models preserves the pairing and measures the variability of the difference. Independent resampling ignores the pairing, sampling without replacement gives the same difference every time, and subtracting standard errors is not a standard error of a difference.`};
    }},
  ]);
})();
