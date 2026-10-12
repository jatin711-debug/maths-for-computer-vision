/* Auto-checked question generators for Modules 10-12 (Lessons 37-48). See practice-engine.js for the format. */
(() => {
  'use strict';
  const P = window.CV_PRACTICE, Q = String.raw;
  const fx = (x, d = 3) => Number(x.toFixed(d)) + 0;  // + 0 turns -0 into 0
  const sum = v => v.reduce((s, x) => s + x, 0), mean = v => sum(v) / v.length;
  const sdev = v => { const m = mean(v); return Math.sqrt(sum(v.map(x => (x - m) ** 2)) / (v.length - 1)); };
  const dot = (a, b) => sum(a.map((x, i) => x * b[i])), norm = a => Math.sqrt(dot(a, a));
  const relu = z => Math.max(0, z);
  const mat = rows => Q`\begin{bmatrix}${rows.map(r => r.join('&')).join(Q`\\`)}\end{bmatrix}`;
  const col = v => mat(v.map(x => [x]));
  const row = v => `[${v.join(', ')}]`, tup = v => `(${v.join(', ')})`;
  const randMat = (r, m, n, lo, hi) => Array.from({length: m}, () => Array.from({length: n}, () => r.int(lo, hi)));
  const vecMat = (x, W) => W[0].map((_, j) => sum(x.map((xi, i) => xi * W[i][j])));
  const matVec = (A, x) => A.map(rw => dot(rw, x));
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const sci = x => { const e = Math.floor(Math.log10(Math.abs(x))); return Q`${fx(x / 10 ** e, 1)}\times10^{${e}}`; };
  const par = v => v < 0 ? `(${v})` : `${v}`;  // parenthesize negatives after an operator
  const times = (a, b) => a.map((x, i) => `(${x})(${b[i]})`).join('+');
  // A shuffled multiple-choice answer; distractors equal to the right option are dropped.
  const choose = (r, right, wrong, label = 'Choose one') => {
    const choices = r.shuffle([right, ...[...new Set(wrong)].filter(w => w !== right).slice(0, 3)]);
    return {label, choices, correct: choices.indexOf(right)};
  };
  // Boxes are [x1, y1, x2, y2] in continuous boundary coordinates, so area has no +1.
  const area = b => (b[2] - b[0]) * (b[3] - b[1]);
  const interW = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const interH = (a, b) => Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const randBox = (r, lo, hi, maxSide = 5) => { const x = r.int(lo, hi), y = r.int(lo, hi); return [x, y, x + r.int(1, maxSide), y + r.int(1, maxSide)]; };

  /* ---------- Module 10 ---------- */
  P.add(37, [
    {key: 'mlp-params', skill: 'Parameter count and logit shape of a two-layer network', make(r) {
      const n = r.pick([8, 16, 32, 64, 128]), d = r.pick([2, 4, 8, 10, 20, 64, 784]), h = r.pick([3, 5, 8, 16, 32, 100]), c = r.pick([2, 3, 4, 5, 10]);
      const p1 = d * h + h, p2 = h * c + c;
      return {prompt: Q`A batch \(X\) of shape \((${n}, ${d})\) goes through \(Z_1=XW_1+b_1\) with hidden width ${h}, a ReLU, then \(Z_2=A_1W_2+b_2\) with ${c} classes. How many trainable parameters (weights and biases) does the network have, and what is the shape of \(Z_2\)?`,
        answers: [{label: 'Trainable parameters', value: p1 + p2, tol: 0}, {label: Q`Shape of \(Z_2\)`, vector: [n, c], tol: 0}],
        hint: Q`\(W_1\) has shape \((D,H)\) and \(b_1\) length \(H\); \(W_2\) has shape \((H,C)\) and \(b_2\) length \(C\). The batch size does not enter the parameter count.`,
        solution: Q`First layer: \(${d}\cdot${h}+${h}=${p1}\). Second layer: \(${h}\cdot${c}+${c}=${p2}\). ReLU has no parameters, so the total is \(${p1}+${p2}=${p1 + p2}\). The logits have one row per example and one column per class: \((${n}, ${c})\).`};
    }},
    {key: 'forward-relu', skill: 'Forward pass through affine, ReLU and affine layers', make(r) {
      let x, W1, b1, xw, z1;
      do {
        x = [r.nonzero(-3, 3), r.nonzero(-3, 3)]; W1 = randMat(r, 2, 2, -2, 2); b1 = [r.int(-2, 2), r.int(-2, 2)];
        xw = vecMat(x, W1); z1 = xw.map((v, j) => v + b1[j]);
      } while (z1.some(v => v === 0) || z1.every(v => v < 0));
      const a1 = z1.map(relu), W2 = randMat(r, 2, 2, -2, 3), b2 = [r.int(-2, 2), r.int(-2, 2)];
      const aw = vecMat(a1, W2), z2 = aw.map((v, j) => v + b2[j]), off = [0, 1].find(j => z1[j] < 0);
      const note = off === undefined ? ' Both hidden units are active, so near this input the network acts as one affine map.'
        : Q` The ${ORD[off]} hidden unit is inactive for this input, so the ${ORD[off]} row of \(W_2\) contributes nothing.`;
      return {prompt: Q`For the row \(x=${row(x)}\) with \(W_1=${mat(W1)}\), \(b_1=${row(b1)}\), \(W_2=${mat(W2)}\) and \(b_2=${row(b2)}\), compute the hidden activation \(a_1=\operatorname{ReLU}(xW_1+b_1)\) and the logits \(z_2=a_1W_2+b_2\).`,
        answers: [{label: Q`\(a_1\)`, vector: a1, tol: 0}, {label: Q`\(z_2\)`, vector: z2, tol: 0}],
        hint: 'Entry j of xW1 is the dot product of x with column j of W1. Add the bias, apply ReLU entrywise, then repeat the affine step with W2.',
        solution: Q`\(xW_1+b_1=${row(xw)}+${row(b1)}=${row(z1)}\), so \(a_1=${row(a1)}\). Then \(a_1W_2=${row(aw)}\) and \(z_2=${row(aw)}+${row(b2)}=${row(z2)}\).${note}`};
    }},
    {key: 'collapse-affine', skill: 'Collapse two affine maps without an activation', make(r) {
      const A = randMat(r, 2, 2, -2, 3), B = randMat(r, 2, 2, -2, 3), b = [r.int(-3, 3), r.int(-3, 3)], c = [r.nonzero(-3, 3), r.int(-3, 3)];
      const M = B.map(rw => [0, 1].map(j => rw[0] * A[0][j] + rw[1] * A[1][j])), Bb = matVec(B, b), d = Bb.map((v, i) => v + c[i]);
      return {prompt: Q`With column vectors, \(y=Ax+b\) and \(z=By+c\) where \(A=${mat(A)}\), \(b=${col(b)}\), \(B=${mat(B)}\) and \(c=${col(c)}\). With no activation between them, \(z=Mx+d\). Give \(M\) row by row (four numbers) and \(d\).`,
        answers: [{label: Q`\(M\), row by row`, vector: M.flat(), tol: 0}, {label: Q`\(d\)`, vector: d, tol: 0}],
        hint: 'Substitute the first map into the second: z = B(Ax+b)+c = (BA)x + (Bb+c).',
        solution: Q`\(z=B(Ax+b)+c=(BA)x+(Bb+c)\). Here \(M=BA=${mat(M)}\) and \(d=Bb+c=${col(Bb)}+${col(c)}=${col(d)}\). Stacked affine maps without a nonlinearity are still one affine map.`};
    }},
    {key: 'relu-pieces', skill: 'Output and local slope of a one-input ReLU network', make(r) {
      let w, b, x, pre;
      do {
        w = [r.nonzero(-2, 2), r.nonzero(-2, 2), r.nonzero(-2, 2)]; b = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; x = r.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]);
        pre = w.map((wi, j) => wi * x + b[j]);
      } while (pre.some(p => p === 0) || !pre.some(p => p > 0) || !pre.some(p => p < 0));
      const v = [r.nonzero(-3, 3), r.nonzero(-3, 3), r.nonzero(-3, 3)], h = pre.map(relu), f = dot(v, h);
      const active = [0, 1, 2].filter(j => pre[j] > 0), slope = sum(active.map(j => v[j] * w[j]));
      return {prompt: Q`A one-input network has hidden units \(h_j=\operatorname{ReLU}(w_jx+b_j)\) with \(w=${tup(w)}\), \(b=${tup(b)}\), and output \(f(x)=\sum_jv_jh_j\) with \(v=${tup(v)}\). At \(x=${x}\), find \(f(x)\) and the local slope \(df/dx\).`,
        answers: [{label: Q`\(f(${x})\)`, value: f}, {label: Q`\(df/dx\)`, value: slope, tol: 0}],
        hint: Q`Compute each preactivation \(w_jx+b_j\). Only units with a positive preactivation are active, and each active unit adds \(v_jw_j\) to the slope.`,
        solution: Q`Preactivations \(w_jx+b_j=${tup(pre)}\), so \(h=${tup(h)}\) and \(f=${times(v, h)}=${f}\). Active units: ${active.map(j => ORD[j]).join(' and ')}, so \(df/dx=${active.map(j => `(${v[j]})(${w[j]})`).join('+')}=${slope}\). Crossing a kink changes the active set and therefore the slope: the function is piecewise affine.`};
    }},
    {key: 'activation-concept', skill: 'Why nonlinear activations change what a network represents', make(r) {
      const k = r.int(2, 6), widths = [r.pick([2, 4, 8, 64]), ...Array.from({length: k - 1}, () => r.pick([16, 32, 64, 128, 256])), r.pick([2, 3, 10])];
      const chain = widths.join(Q`\to`), v = r.int(0, 2);
      if (v === 0) return {prompt: Q`A network stacks ${k} affine layers with widths \(${chain}\) and no activation anywhere. Which statement is true?`,
        answers: [choose(r, 'It is exactly one affine map, so it cannot separate XOR', ['With enough hidden width it can represent XOR exactly', `Each of the ${k} layers adds new linear regions`, 'Its class boundary can be any smooth curve'])],
        hint: 'Compose two affine maps by hand: W2(W1x+b1)+b2.',
        solution: Q`Composing affine maps gives \(x\mapsto(W_${k}\cdots W_1)x+\tilde b\), a single affine map. Extra layers add parameters, not new function shapes; a single affine threshold cannot separate XOR.`};
      if (v === 1) return {prompt: Q`A ReLU is inserted after every hidden layer of the network with widths \(${chain}\). What does the activation change?`,
        answers: [choose(r, 'Different inputs can activate different units, so the map becomes piecewise affine', ['Nothing, because ReLU is linear for positive inputs', 'It guarantees better held-out accuracy', 'It turns the network into a single affine map with fewer parameters'])],
        hint: 'Ask which hidden units are active for two different inputs.',
        solution: 'ReLU zeroes negative preactivations. The active pattern depends on the input, so each region of input space gets its own affine map. This changes what can be represented; whether training finds a good function and whether it generalizes are separate questions.'};
      const hdn = r.pick([2, 3, 4, 8, 16]);
      return {prompt: `A ReLU network with ${hdn} hidden units fits all four XOR training points exactly. What does this establish?`,
        answers: [choose(r, 'The function class can represent XOR; held-out performance is a separate question', ['Any training run from any start will find such weights', 'Adding more hidden units will always improve test accuracy', 'A linear baseline is no longer needed for comparison'])],
        hint: 'Separate what a family of functions can represent from what optimization and data will produce.',
        solution: Q`The fit shows XOR is representable, for example by \(h_1-2h_2\) with \(h_1=\operatorname{ReLU}(x_1+x_2)\), \(h_2=\operatorname{ReLU}(x_1+x_2-1)\). It does not show that every training run finds it, nor that more capacity helps on held-out data; keep a linear baseline.`};
    }},
  ]);

  P.add(38, [
    {key: 'last-layer-grad', skill: 'Last-layer gradients dW2 and db2 for one example', make(r) {
      const a1 = r.shuffle([r.int(0, 4), r.int(1, 4)]), cut = r.distinct(2, 1, 9).sort((a, b) => a - b);
      const p = [cut[0], cut[1] - cut[0], 10 - cut[1]].map(x => x / 10), t = r.int(0, 2);
      const g = p.map((x, j) => fx(x - (j === t ? 1 : 0), 1)), dW = a1.map(a => g.map(x => fx(a * x, 2)));
      return {prompt: Q`One example has hidden activation \(a_1=${row(a1)}\) and softmax output \(p=${row(p)}\); its true class is ${t} (zero-based). For the cross-entropy loss of this one-example batch, \(G_2=p-y\). Give \(dW_2=a_1^TG_2\) row by row (six numbers) and \(db_2\).`,
        answers: [{label: Q`\(dW_2\), row by row`, vector: dW.flat()}, {label: Q`\(db_2\)`, vector: g}],
        hint: Q`Subtract 1 from the true-class probability to get \(G_2\). Row \(i\) of \(dW_2\) is \(a_1[i]\) times \(G_2\).`,
        solution: Q`\(G_2=p-y=${row(g)}\). The outer product is \(dW_2=a_1^TG_2=${mat(dW)}\), with shape (2, 3) like \(W_2\). The bias gradient is \(db_2=G_2=${row(g)}\).${a1.includes(0) ? ' A zero hidden activation gives a zero row: that weight row had no effect on this output.' : ''}`};
    }},
    {key: 'relu-backward', skill: 'Pass a batch gradient back through ReLU', make(r) {
      const Z = randMat(r, 2, 3, -4, 4).map(rw => rw.map(z => z || r.pick([-1, 1]))), dA = Array.from({length: 2}, () => Array.from({length: 3}, () => r.nonzero(-20, 20) / 10));
      const mask = Z.map(rw => rw.map(z => z > 0 ? 1 : 0)), dZ = dA.map((rw, i) => rw.map((g, j) => mask[i][j] ? g : 0));
      const db = [0, 1, 2].map(j => fx(dZ[0][j] + dZ[1][j], 1));
      return {prompt: Q`A batch of two rows has hidden preactivations \(Z_1=${mat(Z)}\) and upstream gradient \(dA_1=${mat(dA)}\) for \(A_1=\operatorname{ReLU}(Z_1)\). Give \(dZ_1\) row by row (six numbers) and \(db_1=\sum_i(dZ_1)_{i,:}\).`,
        answers: [{label: Q`\(dZ_1\), row by row`, vector: dZ.flat()}, {label: Q`\(db_1\)`, vector: db}],
        hint: Q`Multiply \(dA_1\) elementwise by the mask \(\mathbf1_{Z_1>0}\). Then add the two rows of \(dZ_1\) to get \(db_1\).`,
        solution: Q`The mask is \(${mat(mask)}\), so \(dZ_1=dA_1\odot\mathbf1_{Z_1>0}=${mat(dZ)}\). Summing over the batch rows gives \(db_1=${row(db)}\). The mask is elementwise; only the weight gradients use matrix products.`};
    }},
    {key: 'scalar-chain', skill: 'Chain rule through a scalar two-layer network', make(r) {
      let x, u, c, pre;
      do { x = r.nonzero(-3, 3); u = r.nonzero(-2, 3); c = r.int(-3, 3); pre = u * x + c; } while (pre === 0 || (pre < 0 && r.bool(0.6)));
      const v = r.nonzero(-3, 3), d = r.int(-2, 2), h = relu(pre), yhat = v * h + d;
      let y = r.int(-4, 6); if (y === yhat) y += r.pick([-2, 2]);
      const e = yhat - y, dv = e * h, du = pre > 0 ? e * v * x : 0;
      return {prompt: Q`A scalar network computes \(h=\operatorname{ReLU}(ux+c)\), \(\hat y=vh+d\) and \(L=\tfrac12(\hat y-y)^2\). With \(x=${x}\), \(u=${u}\), \(c=${c}\), \(v=${v}\), \(d=${d}\) and \(y=${y}\), find \(\partial L/\partial u\) and \(\partial L/\partial v\).`,
        answers: [{label: Q`\(\partial L/\partial u\)`, value: du, tol: 0}, {label: Q`\(\partial L/\partial v\)`, value: dv, tol: 0}],
        hint: Q`Run the forward pass and keep the preactivation \(ux+c\). Then \(\partial L/\partial v=(\hat y-y)h\) and \(\partial L/\partial u=(\hat y-y)\,v\,\mathbf1_{ux+c>0}\,x\).`,
        solution: pre > 0
          ? Q`Forward: \(ux+c=${pre}\), \(h=${h}\), \(\hat y=${yhat}\), residual \(\hat y-y=${e}\). Then \(\partial L/\partial v=${e}\cdot${h}=${dv}\) and \(\partial L/\partial u=${e}\cdot${par(v)}\cdot1\cdot${par(x)}=${du}\).`
          : Q`Forward: \(ux+c=${pre}<0\), so \(h=0\) and \(\hat y=${yhat}\), residual \(${e}\). Both gradients are 0: \(\partial L/\partial v=e\,h=0\), and ReLU passes zero gradient to \(u\). The loss \(${fx(e * e / 2, 2)}\) is not small, so a zero gradient here does not mean a good fit.`};
    }},
    {key: 'batch-bias-grad', skill: 'Mean-loss scaling of a batch bias gradient', make(r) {
      const N = r.pick([2, 4, 5]), Pm = [], labels = [];
      for (let i = 0; i < N; i++) { const cut = r.distinct(2, 1, 9).sort((a, b) => a - b); Pm.push([cut[0], cut[1] - cut[0], 10 - cut[1]].map(x => x / 10)); labels.push(r.int(0, 2)); }
      const D = Pm.map((rw, i) => rw.map((p, j) => fx(p - (j === labels[i] ? 1 : 0), 1)));
      const colSum = [0, 1, 2].map(j => fx(sum(D.map(rw => rw[j])), 1)), db = colSum.map(s => fx(s / N, 4));
      return {prompt: Q`A batch of ${N} examples has softmax outputs (one row each) \(P=${mat(Pm)}\) and true classes ${tup(labels)} (zero-based). For the mean cross-entropy loss, \(G_2=(P-Y)/N\). Give \(db_2=\sum_i(G_2)_{i,:}\).`,
        answers: [{label: Q`\(db_2\)`, vector: db}],
        hint: 'Subtract each one-hot target from its row of P, add the rows, then divide by N once.',
        solution: Q`\(P-Y=${mat(D)}\). Its column sums are \(${row(colSum)}\), and dividing by \(N=${N}\) gives \(db_2=${row(db)}\). The 1/N from the mean appears exactly once, and the entries still sum to zero.`};
    }},
    {key: 'transpose-check', skill: 'Choose the right backward formula by its shape', make(r) {
      const n = r.pick([4, 8, 16, 32]), D = r.pick([2, 3, 5, 10]), H = r.pick([4, 6, 8, 12]), C = r.pick([2, 3, 10]);
      const opt = [
        {q: Q`dW_2`, shape: [H, C], right: Q`\(A_1^TG_2\)`, wrong: [Q`\(G_2^TA_1\)`, Q`\(G_2W_2^T\)`, Q`\(X^TG_2\)`], why: Q`\(A_1^T\) is \((${H},${n})\) and \(G_2\) is \((${n},${C})\), so the product sums over the batch and has the shape of \(W_2\).`},
        {q: Q`dA_1`, shape: [n, H], right: Q`\(G_2W_2^T\)`, wrong: [Q`\(A_1^TG_2\)`, Q`\(G_2^TW_2\)`, Q`\(W_2G_2^T\)`], why: Q`\(G_2\) is \((${n},${C})\) and \(W_2^T\) is \((${C},${H})\), giving one sensitivity per example and hidden unit.`},
        {q: Q`dW_1`, shape: [D, H], right: Q`\(X^T\,dZ_1\)`, wrong: [Q`\(X^T\,dA_1\)`, Q`\(dZ_1^TX\)`, Q`\(dZ_1W_1^T\)`], why: Q`\(X^T\) is \((${D},${n})\) and \(dZ_1\) is \((${n},${H})\). Using \(dA_1\) instead would skip the ReLU mask even though its shape fits.`},
        {q: Q`dX`, shape: [n, D], right: Q`\(dZ_1W_1^T\)`, wrong: [Q`\(dA_1W_1^T\)`, Q`\(X^T\,dZ_1\)`, Q`\(W_1\,dZ_1^T\)`], why: Q`\(dZ_1\) is \((${n},${H})\) and \(W_1^T\) is \((${H},${D})\). The candidate with \(dA_1\) has the right shape but skips the ReLU mask.`},
      ][r.int(0, 3)];
      return {prompt: Q`In \(Z_1=XW_1+b_1\), \(A_1=\operatorname{ReLU}(Z_1)\), \(Z_2=A_1W_2+b_2\) with \(X\) of shape \((${n},${D})\), hidden width ${H} and ${C} classes, let \(G_2=\partial L/\partial Z_2\) and \(dZ_1=dA_1\odot\mathbf1_{Z_1>0}\). Which expression gives \(${opt.q}\), of shape \((${opt.shape.join(',')})\)?`,
        answers: [choose(r, opt.right, opt.wrong)],
        hint: 'A gradient has the shape of the quantity it belongs to. Check each product for shape and for whether it crosses the ReLU mask.',
        solution: Q`\(${opt.q}=\)${opt.right}. ${opt.why}`};
    }},
  ]);

  P.add(39, [
    {key: 'l2-step', skill: 'SGD step with an L2 penalty', make(r) {
      const w = [r.nonzero(-4, 4), r.nonzero(-4, 4)], g = [r.nonzero(-20, 20) / 10, r.nonzero(-20, 20) / 10], lam = r.pick([0.1, 0.2, 0.5]), eta = r.pick([0.1, 0.2, 0.5]);
      const pen = w.map(x => fx(lam * x, 4)), tot = g.map((x, i) => fx(x + pen[i], 4)), next = w.map((x, i) => fx(x - eta * tot[i], 4));
      return {prompt: Q`The objective is \(L_{\rm data}+\frac{\lambda}{2}\|W\|_F^2\) with \(\lambda=${lam}\). At \(W=${row(w)}\) the data gradient is \(${row(g)}\). Give the penalty gradient and the weights after one SGD step with learning rate \(${eta}\) (both are exact to two decimals).`,
        answers: [{label: 'Penalty gradient', vector: pen, tol: 0.004, rel: 0}, {label: 'Updated W', vector: next, tol: 0.004, rel: 0}],
        hint: Q`The derivative of \(\frac{\lambda}{2}\|W\|_F^2\) is \(\lambda W\). Add it to the data gradient, then step \(W-\eta\nabla L\).`,
        solution: Q`Penalty gradient \(\lambda W=${row(pen)}\). Total gradient \(${row(g)}+${row(pen)}=${row(tot)}\). Update \(${row(w)}-${eta}\cdot${row(tot)}=${row(next)}\). The penalty pulls each weight toward zero by \(\eta\lambda w\).`};
    }},
    {key: 'batchnorm', skill: 'Batch-normalization mean, variance and output', make(r) {
      let a; do { a = Array.from({length: 4}, () => r.int(-2, 9)); } while (new Set(a).size < 3);
      const mu = mean(a), v = mean(a.map(x => (x - mu) ** 2)), k = r.int(0, 3), gamma = r.pick([0.5, 1, 1.5, 2, 3]), beta = r.pick([-1, -0.5, 0, 0.5, 1, 2]);
      const ahat = (a[k] - mu) / Math.sqrt(v), out = gamma * ahat + beta;
      return {prompt: Q`In training mode, batch normalization of one feature over a batch of 4 sees the values \(${row(a)}\). Using the batch mean, the variance with divisor 4 and \(\epsilon\approx0\), give the mean, the variance and the output \(\gamma\hat a+\beta\) for the ${ORD[k]} value, with \(\gamma=${gamma}\) and \(\beta=${beta}\).`,
        answers: [{label: Q`\(\mu\)`, value: mu}, {label: 'Variance', value: v}, {label: 'Output', value: out}],
        hint: Q`Average over the batch axis, then \(\hat a=(a-\mu)/\sqrt{\operatorname{var}+\epsilon}\) and output \(\gamma\hat a+\beta\).`,
        solution: Q`\(\mu=${sum(a)}/4=${mu}\). Squared deviations \(${tup(a.map(x => fx((x - mu) ** 2, 4)))}\) average to \(${fx(v, 4)}\). For \(a=${a[k]}\): \(\hat a=(${a[k]}-${mu})/\sqrt{${fx(v, 4)}}\approx${fx(ahat, 4)}\), so the output is \(${gamma}\cdot${par(fx(ahat, 4))}${beta < 0 ? '' : '+'}${beta}\approx${fx(out, 3)}\).`};
    }},
    {key: 'stable-bce', skill: 'Stable binary cross entropy from a logit', make(r) {
      const z = r.sign() * (r.bool(0.2) ? r.pick([25, 40, 60, 100]) : r.real(0.2, 6, 1)), y = r.int(0, 1);
      const m = Math.max(z, 0), lin = -y * z, tail = Math.log1p(Math.exp(-Math.abs(z))), L = m + lin + tail;
      const tailText = tail < 1e-4 ? Q`\approx${sci(tail)}` : Q`\approx${fx(tail, 4)}`;
      return {prompt: Q`A binary classifier outputs the logit \(z=${z}\) for an example with label \(y=${y}\). Compute the binary cross-entropy loss using the stable form \(\max(z,0)-yz+\ln(1+e^{-|z|})\).`,
        answers: [{label: 'Loss', value: L, rel: 0}],
        hint: Q`Evaluate the three terms separately. The exponent \(-|z|\) is never positive, so nothing overflows.`,
        solution: Q`\(\max(z,0)=${m}\), \(-yz=${fx(lin, 3)}\) and \(\ln(1+e^{-${Math.abs(z)}})${tailText}\), so \(L\approx${fx(L, 4)}\). This equals \(-y\ln\sigma(z)-(1-y)\ln(1-\sigma(z))\) without forming probabilities that round to 0 or 1.`};
    }},
    {key: 'logsumexp', skill: 'Log-sum-exp and cross entropy with large logits', make(r) {
      const m = r.pick([100, 200, 500, 1000]), deltas = r.shuffle([0, -r.int(1, 3), -r.int(1, 4)]), z = deltas.map(d => m + d), t = r.int(0, 2);
      const s = sum(deltas.map(d => Math.exp(d))), lse = m + Math.log(s), ce = lse - z[t];
      return {prompt: Q`Logits are \(z=${tup(z)}\); exponentiating them directly would overflow in float32. Find \(\operatorname{LSE}(z)=\ln\sum_ie^{z_i}\) with the max shift, and the cross-entropy loss \(\operatorname{LSE}(z)-z_${t}\) for true class ${t} (zero-based).`,
        answers: [{label: Q`\(\operatorname{LSE}(z)\)`, value: lse, rel: 0}, {label: 'Loss', value: ce}],
        hint: Q`Subtract the largest logit \(m\): \(\operatorname{LSE}(z)=m+\ln\sum_ie^{z_i-m}\).`,
        solution: Q`\(m=${m}\) and \(\sum_ie^{z_i-m}=${deltas.map(d => `e^{${d}}`).join('+')}\approx${fx(s, 4)}\). So \(\operatorname{LSE}\approx${m}+${fx(Math.log(s), 4)}=${fx(lse, 4)}\) and the loss is \(${fx(lse, 4)}-${z[t]}\approx${fx(ce, 4)}\).`};
    }},
    {key: 'mode-concept', skill: 'Objective changes, training-only operations and stable rewrites', make(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const q = r.pick([0.25, 0.5, 0.75, 0.8, 0.9]), a = r.int(1, 9);
        return {prompt: Q`A hidden unit uses inverted dropout with keep probability \(${q}\). In training, a kept activation of \(${a}\) becomes \(${fx(a / q, 3)}\). What does the unit output for that activation in evaluation mode?`,
          answers: [choose(r, `${a}: no mask and no rescaling`, [`${fx(a * q, 3)}: multiplied by the keep probability`, `${fx(a / q, 3)}: still divided by the keep probability`, `0 or ${fx(a / q, 3)} at random, as in training`])],
          hint: 'Inverted dropout rescales by 1/q during training so that the expected activation is unchanged.',
          solution: Q`Training uses \(m\odot a/q\) with \(\mathbb E[m/q]=1\). At evaluation the mask is removed and the activation is used directly, so the output is \(${a}\). State the mode when checking gradients or reporting results.`};
      }
      if (v === 1) {
        const B = r.pick([16, 32, 64, 128, 256]), k = r.pick([1, 2, 5]);
        return {prompt: `A batch-normalization layer was trained with batches of ${B}. In evaluation mode you classify ${k === 1 ? 'a single image' : `a batch of ${k} images`}. Which statistics normalize its activations?`,
          answers: [choose(r, 'Stored running estimates of the training mean and variance', [`The mean and variance of the ${k === 1 ? 'single image' : `${k} test images`}`, 'Mean 0 and variance 1, ignoring the learned scale and shift', 'Fresh statistics computed over the whole test set'])],
          hint: 'Training mode uses batch statistics; evaluation mode commonly reuses stored estimates.',
          solution: 'Evaluation commonly uses running estimates collected during training, followed by the learned scale and shift. Using test-batch statistics would make each prediction depend on which other images share its batch.'};
      }
      if (v === 2) {
        const lam = r.pick([0.001, 0.01, 0.05, 0.1, 0.5]);
        return {prompt: Q`Adding \(\frac{\lambda}{2}\|W\|_F^2\) with \(\lambda=${lam}\) to the loss is best described as`,
          answers: [choose(r, `A change of objective that adds ${lam}W to the gradient`, [`A change of objective that adds ${fx(2 * lam, 4)}W to the gradient`, 'A stable rewrite that leaves the objective unchanged', 'A random operation that is switched off at evaluation'])],
          hint: Q`Differentiate \(\frac{\lambda}{2}\sum w_{ij}^2\) entry by entry.`,
          solution: Q`The penalty changes what is minimized; its gradient is \(\lambda W=${lam}W\). Without the factor \(\frac12\) it would be \(2\lambda W\). It is neither a numerical safeguard nor a training-only random operation.`};
      }
      const M = r.pick([90, 120, 300, 800, 1000]);
      return {prompt: Q`For logits near ${M}, replacing \(\ln\sum_ie^{z_i}\) with \(m+\ln\sum_ie^{z_i-m}\), where \(m=\max_iz_i\),`,
        answers: [choose(r, 'computes the same value without overflow', [`changes the loss by ${M}`, 'acts as a regularizer that shrinks large logits', 'must be switched off in evaluation mode'])],
        hint: Q`Factor \(e^m\) out of the sum.`,
        solution: Q`\(\ln\sum_ie^{z_i}=\ln\left(e^m\sum_ie^{z_i-m}\right)=m+\ln\sum_ie^{z_i-m}\) exactly. It is an equivalent formula, so the objective is unchanged; only the floating-point behaviour improves.`};
    }},
  ]);

  P.add(40, [
    {key: 'scalar-autograd', skill: 'Hand gradients of a squared-error affine model', make(r) {
      let x, w, b, y, z; do { x = r.nonzero(-4, 4); w = r.nonzero(-3, 3); b = r.int(-3, 3); y = r.int(-6, 6); z = w * x + b; } while (z === y);
      const e = z - y;
      return {prompt: Q`For \(z=wx+b\) and \(L=\frac12(z-y)^2\) with \(x=${x}\), \(w=${w}\), \(b=${b}\) and \(y=${y}\), what should autograd report for \(\partial L/\partial w\) and \(\partial L/\partial b\) after one backward call?`,
        answers: [{label: Q`\(\partial L/\partial w\)`, value: e * x, tol: 0}, {label: Q`\(\partial L/\partial b\)`, value: e, tol: 0}],
        hint: Q`\(\partial L/\partial z=z-y\); then \(\partial z/\partial w=x\) and \(\partial z/\partial b=1\).`,
        solution: Q`\(z=${w}\cdot${par(x)}${b < 0 ? '' : '+'}${b}=${z}\), residual \(z-y=${e}\). So \(\partial L/\partial w=${e}\cdot${par(x)}=${e * x}\) and \(\partial L/\partial b=${e}\). Compare forward values first, then gradients.`};
    }},
    {key: 'grad-accumulate', skill: 'Gradient accumulation across backward calls', make(r) {
      let w, b, x1, y1, x2, y2, g1, g2;
      do { w = r.nonzero(-3, 3); b = r.int(-2, 2); x1 = r.nonzero(-3, 3); x2 = r.nonzero(-3, 3); y1 = r.int(-5, 5); y2 = r.int(-5, 5); g1 = (w * x1 + b - y1) * x1; g2 = (w * x2 + b - y2) * x2; } while (g1 === 0 || g2 === 0);
      return {prompt: Q`With \(w=${w}\) and \(b=${b}\), you compute \(L_1=\frac12(wx_1+b-y_1)^2\) for \((x_1,y_1)=(${x1},${y1})\) and call backward, then \(L_2\) for \((x_2,y_2)=(${x2},${y2})\) and call backward again without zeroing gradients. What does w.grad hold now, and what would it hold had you zeroed it before the second call?`,
        answers: [{label: 'w.grad, accumulated', value: g1 + g2, tol: 0}, {label: 'w.grad, after zeroing', value: g2, tol: 0}],
        hint: Q`Each call adds \((wx_i+b-y_i)x_i\) to the stored gradient. Zeroing first leaves only the second contribution.`,
        solution: Q`First call: \((${w * x1 + b}-${par(y1)})\cdot${par(x1)}=${g1}\). Second: \((${w * x2 + b}-${par(y2)})\cdot${par(x2)}=${g2}\). Without zeroing the framework stores \(${g1}+${par(g2)}=${g1 + g2}\); after zeroing it stores \(${g2}\).`};
    }},
    {key: 'central-diff', skill: 'Central-difference gradient check and relative error', make(r) {
      let a, b, w0, d; do { a = r.pick([1, 2]); b = r.int(-6, 6); w0 = r.nonzero(-3, 3); d = 3 * a * w0 * w0 + b; } while (d === 0);
      const h = r.pick([0.1, 0.2, 0.5]), gh = d + a * h * h, rel = a * h * h / Math.abs(d);
      const f = `${a === 1 ? '' : a}w^3${b === 0 ? '' : `${b > 0 ? '+' : '-'}${Math.abs(b) === 1 ? '' : Math.abs(b)}w`}`;
      return {prompt: Q`Check the gradient of \(f(w)=${f}\) at \(w=${w0}\). Give the analytic \(f'(${w0})\), the central difference \(g_h=\frac{f(w+h)-f(w-h)}{2h}\) with \(h=${h}\), and the relative error \(|g_h-f'|/|f'|\) to four decimal places.`,
        answers: [{label: Q`\(f'(${w0})\)`, value: d, tol: 0}, {label: Q`\(g_h\)`, value: gh, tol: 0.004, rel: 0}, {label: 'Relative error', value: rel, tol: 0.0001, rel: 0}],
        hint: Q`\(f'(w)=${3 * a}w^2${b === 0 ? '' : `${b > 0 ? '+' : ''}${b}`}\). For a cubic, the central difference of \(aw^3\) is exactly \(a(3w^2+h^2)\); linear terms are exact.`,
        solution: Q`\(f'(${w0})=${3 * a}\cdot${w0 * w0}${b === 0 ? '' : `${b > 0 ? '+' : ''}${b}`}=${d}\). The central difference is \(f'+${a === 1 ? '' : a}h^2=${d}+${fx(a * h * h, 4)}=${fx(gh, 4)}\). Relative error \(${fx(a * h * h, 4)}/${Math.abs(d)}\approx${fx(rel, 5)}\). It shrinks like \(h^2\) until rounding error takes over at very small \(h\).`};
    }},
    {key: 'reduction-mismatch', skill: 'Sum versus mean loss reduction', make(r) {
      const N = r.pick([3, 4]); let x, y, w, g;
      do { x = Array.from({length: N}, () => r.nonzero(-3, 3)); y = Array.from({length: N}, () => r.int(-5, 5)); w = r.nonzero(-2, 3); g = sum(x.map((xi, i) => (w * xi - y[i]) * xi)); } while (g === 0);
      const res = x.map((xi, i) => w * xi - y[i]);
      return {prompt: Q`For data \(x=${tup(x)}\), \(y=${tup(y)}\) and the model \(\hat y=wx\) at \(w=${w}\), find \(dL/dw\) for the sum reduction \(L=\frac12\sum_i(wx_i-y_i)^2\) and for the mean of the same ${N} terms.`,
        answers: [{label: 'Sum reduction', value: g, tol: 0}, {label: 'Mean reduction', value: g / N}],
        hint: Q`\(\frac{d}{dw}\tfrac12(wx_i-y_i)^2=(wx_i-y_i)x_i\). Add these for the sum; divide by \(N\) for the mean.`,
        solution: Q`Residuals \(wx_i-y_i=${tup(res)}\). Sum: \(${times(res, x)}=${g}\). Mean: \(${g}/${N}\approx${fx(g / N, 4)}\). A framework using the other reduction differs by exactly the factor ${N}, with the chain rule still correct.`};
    }},
    {key: 'autograd-concept', skill: 'What autograd does and does not check', make(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const x = r.nonzero(-5, 5), y = r.int(-5, 5);
        return {prompt: Q`Before comparing your hand gradient with autograd's for \(L=\frac12(wx+b-y)^2\) at \(x=${x}\), \(y=${y}\), what should you check first?`,
          answers: [choose(r, 'That forward values, shapes, dtype and loss reduction match', ['That training accuracy after 100 steps is high', 'Nothing: autograd always differentiates the intended objective', 'That every gradient entry is below 1'])],
          hint: 'A gradient comparison is meaningful only when both sides differentiate the same computation.',
          solution: 'Compare the forward computation first: the same expression, shapes, dtype, reduction and regularization. Autograd differentiates whatever was executed, so a mismatched forward pass gives a correct derivative of the wrong function.'};
      }
      if (v === 1) {
        const a = r.nonzero(-4, 4), c = r.nonzero(-9, 9);
        return {prompt: Q`A graph computes \(z=${a}w\) and then \(L=e^{z}\). Which step would break the differentiated path from \(w\) to \(L\)?`,
          answers: [choose(r, 'Converting z to a plain Python number and continuing the arithmetic with it', [`Adding the constant ${c} to z`, 'Multiplying z by another tensor that requires gradients', 'Applying exp to the tensor z'])],
          hint: 'Autograd can only follow operations it recorded on tensors.',
          solution: 'Extracting a Python number (or detaching to an array) leaves the recorded graph, so later operations are invisible to backward. Adding constants, multiplying tensors and applying exp are all recorded operations with local derivative rules.'};
      }
      if (v === 2) {
        const K = r.pick([2, 3, 5, 10, 100]);
        return {prompt: `Why not train a ${K}-class classifier by maximizing its argmax accuracy directly with gradient descent?`,
          answers: [choose(r, 'Accuracy is piecewise constant in the parameters, so its gradient is zero almost everywhere', ['Accuracy is too slow to compute on a batch', 'Autograd cannot handle integer class labels', 'Cross entropy and accuracy always rank models identically'])],
          hint: 'Ask what happens to accuracy when a weight changes by a tiny amount.',
          solution: 'Small parameter changes rarely flip an argmax decision, so accuracy is flat almost everywhere and jumps at decision boundaries. Cross entropy is a smooth surrogate whose gradient carries useful information.'};
      }
      const N = r.pick([8, 16, 32, 64, 128]);
      return {prompt: `On a batch of ${N} examples, the autograd gradient is exactly ${N} times your hand-derived gradient for every parameter. What is the most likely cause?`,
        answers: [choose(r, 'One side uses a sum reduction and the other a mean', ['A different ReLU convention at the kink', 'float32 rounding error', `The learning rate is ${N} times larger in the framework`])],
        hint: 'Look for a factor that scales every gradient by the batch size.',
        solution: Q`A sum over \(N\) examples and a mean differ by exactly \(1/N\) in every gradient entry. A kink convention would affect only some entries, rounding would not give an exact factor, and the learning rate does not enter the gradient.`};
    }},
  ]);

  /* ---------- Module 11 ---------- */
  P.add(41, [
    {key: 'conv-params', skill: 'Parameters of a convolution versus a dense layer', make(r) {
      const k = r.pick([1, 3, 5, 7]), cin = r.pick([1, 3, 8, 16]), cout = r.pick([4, 8, 16, 32]), H = r.pick([8, 16, 28]);
      const conv = k * k * cin * cout + cout, dense = H * H * cin * cout + cout;
      return {prompt: Q`A biased \(${k}\times${k}\) convolution maps ${cin} input channel${cin === 1 ? '' : 's'} to ${cout} output channels on \(${H}\times${H}\) images. How many parameters does it have? For comparison, how many would a biased dense layer from the flattened \(${H}\times${H}\times${cin}\) input to ${cout} outputs need?`,
        answers: [{label: 'Convolution parameters', value: conv, tol: 0}, {label: 'Dense-layer parameters', value: dense, tol: 0}],
        hint: Q`Each output channel has a \(k\times k\times C_{in}\) kernel and one bias. The convolution count does not depend on the image size.`,
        solution: Q`Convolution: \(${k}\cdot${k}\cdot${cin}\cdot${cout}+${cout}=${conv}\). Dense: \(${H * H * cin}\cdot${cout}+${cout}=${dense}\). Local, shared kernels are the inductive bias that keeps the convolution small.`};
    }},
    {key: 'cnn-pipeline', skill: 'Shapes and parameter count of a small CNN classifier', make(r) {
      const H = r.pick([8, 10, 12, 16, 28]), k = r.pick([3, 5]), cin = r.pick([1, 3]), F = r.pick([2, 4, 6, 8]), K = r.pick([2, 3, 10]);
      const o = H - k + 1, flat = o * o * F, conv = k * k * cin * F + F, head = flat * K + K;
      return {prompt: Q`Images of shape \((N, ${H}, ${H}, ${cin})\) pass through a valid (no padding, stride 1) \(${k}\times${k}\) convolution with ${F} filters and bias, a ReLU, a flatten, and a biased dense layer to ${K} classes. Give the flattened feature dimension and the total number of trainable parameters.`,
        answers: [{label: 'Flattened dimension', value: flat, tol: 0}, {label: 'Total parameters', value: conv + head, tol: 0}],
        hint: Q`A valid \(k\times k\) convolution shrinks each side to \(H-k+1\). Count convolution weights and biases, then the dense weights and biases.`,
        solution: Q`Feature maps are \((N,${o},${o},${F})\), so flattening gives \(${o}\cdot${o}\cdot${F}=${flat}\). Convolution: \(${k * k}\cdot${cin}\cdot${F}+${F}=${conv}\). Head: \(${flat}\cdot${K}+${K}=${head}\). Total \(${conv + head}\).`};
    }},
    {key: 'crop-conv-shape', skill: 'Crop augmentation and convolution output shape', make(r) {
      const Hi = r.pick([32, 40, 64]), Wi = r.pick([32, 48, 64]), s = r.pick([24, 28, 32].filter(v => v <= Math.min(Hi, Wi))), F = r.pick([8, 16, 32]);
      let k, S, p; do { k = r.pick([3, 5, 7]); S = r.pick([1, 2]); p = r.pick([0, 1, 2, 3]); } while ((s + 2 * p - k) % S !== 0);
      const o = (s + 2 * p - k) / S + 1, offsets = (Hi - s + 1) * (Wi - s + 1);
      return {prompt: Q`Random-crop augmentation takes a \(${s}\times${s}\) crop at an integer offset from a \(${Hi}\times${Wi}\) image (height by width). A \(${k}\times${k}\) convolution with stride ${S}, padding ${p} and ${F} filters follows. How many distinct crop offsets are there, and what is the output shape (height, width, channels) for one crop?`,
        answers: [{label: 'Crop offsets', value: offsets, tol: 0}, {label: 'Output shape', vector: [o, o, F], tol: 0}],
        hint: Q`A crop can start at rows \(0,\dots,H-s\) and columns \(0,\dots,W-s\). Each output side is \((s+2p-k)/S+1\).`,
        solution: Q`Offsets: \((${Hi}-${s}+1)(${Wi}-${s}+1)=${Hi - s + 1}\cdot${Wi - s + 1}=${offsets}\). Output side: \((${s}+${2 * p}-${k})/${S}+1=${o}\), so the shape is \((${o}, ${o}, ${F})\). Every crop gives the same shape, so the classifier head still fits.`};
    }},
    {key: 'flip-box', skill: 'Transform a box consistently with an image flip', make(r) {
      const W = r.pick([32, 64, 100, 128]), H = r.pick([32, 48, 64, 80]), horiz = r.bool();
      const x1 = r.int(0, W - 12), x2 = x1 + r.int(4, 11), y1 = r.int(0, H - 12), y2 = y1 + r.int(4, 11);
      const out = horiz ? [W - x2, y1, W - x1, y2] : [x1, H - y2, x2, H - y1];
      return {prompt: Q`An image is ${W} wide and ${H} tall, and a box is \([x_1,y_1,x_2,y_2]=${row([x1, y1, x2, y2])}\) in continuous boundary coordinates (y increases downward). After a ${horiz ? 'horizontal (left-right)' : 'vertical (top-bottom)'} flip of the image, what must the box become?`,
        answers: [{label: 'Flipped box', vector: out, tol: 0}],
        hint: horiz ? Q`A horizontal flip maps \(x\mapsto W-x\). The old right edge becomes the new left edge.` : Q`A vertical flip maps \(y\mapsto H-y\). The old bottom edge becomes the new top edge.`,
        solution: horiz ? Q`\([W-x_2,\,y_1,\,W-x_1,\,y_2]=[${W}-${x2},\,${y1},\,${W}-${x1},\,${y2}]=${row(out)}\). The width \(${x2 - x1}\) is preserved and the edges swap roles.`
          : Q`\([x_1,\,H-y_2,\,x_2,\,H-y_1]=[${x1},\,${H}-${y2},\,${x2},\,${H}-${y1}]=${row(out)}\). The height \(${y2 - y1}\) is preserved and the edges swap roles.`};
    }},
    {key: 'augment-concept', skill: 'Is an augmentation label-preserving?', make(r) {
      const n = r.pick([8, 16, 28, 32, 64, 128]);
      const SAME = 'Yes: the label is unchanged', MOVE = 'Yes, if the target is transformed with the image', BREAK = 'No: it can change the correct label';
      const cases = [
        [`On ${n}x${n} images of horizontal versus vertical bars, is a horizontal (left-right) flip a label-preserving augmentation?`, SAME, 'A left-right flip keeps a horizontal bar horizontal and a vertical bar vertical.'],
        [`On ${n}x${n} images of horizontal versus vertical bars, is a 90-degree rotation a label-preserving augmentation?`, BREAK, 'A 90-degree rotation turns a horizontal bar into a vertical one, swapping the classes.'],
        [`For ${n}x${n} digit classification that includes 6 and 9, is a 180-degree rotation a label-preserving augmentation?`, BREAK, 'Rotating a 6 by 180 degrees produces something that looks like a 9.'],
        [`For box detection on ${n}x${n} images, is a horizontal flip a valid augmentation?`, MOVE, Q`The boxes must move with the image: \([x_1,y_1,x_2,y_2]\mapsto[W-x_2,y_1,W-x_1,y_2]\).`],
        [`For semantic segmentation on ${n}x${n} images, is a random translation a valid augmentation?`, MOVE, 'The mask must receive exactly the same spatial transform as the image.'],
        [`For classifying left-arrow versus right-arrow signs on ${n}x${n} images, is a horizontal flip a label-preserving augmentation?`, BREAK, 'A left-right flip turns a left arrow into a right arrow.'],
        [`For bar-orientation labels on ${n}x${n} images, is scaling brightness by a factor in [0.8, 1.2] (no clipping) a label-preserving augmentation?`, SAME, 'Orientation does not depend on overall brightness in this range.'],
      ];
      const [prompt, right, why] = r.pick(cases);
      return {prompt, answers: [choose(r, right, [SAME, MOVE, BREAK])],
        hint: 'Apply the transform to one example of each class and ask whether the target is still correct, or must move with the image.',
        solution: `${right}. ${why} An augmentation encodes a task assumption, so it must preserve the target or transform it consistently.`};
    }},
  ]);

  P.add(42, [
    {key: 'box-iou', skill: 'Intersection, union and IoU of two boxes', make(r) {
      const apart = r.bool(0.1); let A, B; do { A = randBox(r, 0, 6); B = randBox(r, 0, 6); } while ((interW(A, B) * interH(A, B) === 0) !== apart || A.join() === B.join());
      const iw = interW(A, B), ih = interH(A, B), I = iw * ih, U = area(A) + area(B) - I;
      return {prompt: Q`In continuous boundary coordinates \([x_1,y_1,x_2,y_2]\), find the intersection area, union area and IoU of \(A=${row(A)}\) and \(B=${row(B)}\).`,
        answers: [{label: 'Intersection', value: I, tol: 0}, {label: 'Union', value: U, tol: 0}, {label: 'IoU', value: I / U}],
        hint: Q`Overlap width is \(\max(0,\min(x_2)-\max(x_1))\), and likewise for height. Union is \(|A|+|B|-|A\cap B|\).`,
        solution: Q`Overlap width \(\max(0,\min(${A[2]},${B[2]})-\max(${A[0]},${B[0]}))=${iw}\), height \(${ih}\), intersection \(${I}\). Areas \(${area(A)}\) and \(${area(B)}\), so the union is \(${area(A)}+${area(B)}-${I}=${U}\) and \(\operatorname{IoU}=${I}/${U}\approx${fx(I / U, 4)}\).`};
    }},
    {key: 'center-corners', skill: 'Convert between center-size and corner box formats', make(r) {
      if (r.bool()) {
        const cx = r.int(4, 20), cy = r.int(4, 20), w = r.int(1, 8), h = r.int(1, 8), out = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
        return {prompt: Q`A box has center \((${cx}, ${cy})\), width ${w} and height ${h}. Give its boundary coordinates \([x_1,y_1,x_2,y_2]\).`,
          answers: [{label: Q`\([x_1,y_1,x_2,y_2]\)`, vector: out, tol: 0}],
          hint: Q`\(x_1=c_x-w/2\), \(x_2=c_x+w/2\), and likewise for \(y\) with the height.`,
          solution: Q`\(x_1=${cx}-${w / 2}=${out[0]}\), \(y_1=${cy}-${h / 2}=${out[1]}\), \(x_2=${cx}+${w / 2}=${out[2]}\), \(y_2=${cy}+${h / 2}=${out[3]}\). With boundary coordinates there is no extra +1.`};
      }
      const x1 = r.int(0, 15), y1 = r.int(0, 15), x2 = x1 + r.int(1, 9), y2 = y1 + r.int(1, 9), out = [(x1 + x2) / 2, (y1 + y2) / 2, x2 - x1, y2 - y1];
      return {prompt: Q`A box has boundary coordinates \(${row([x1, y1, x2, y2])}\). Give its center-size form \((c_x, c_y, w, h)\).`,
        answers: [{label: Q`\((c_x,c_y,w,h)\)`, vector: out, tol: 0}],
        hint: 'The center is the midpoint of the two edges; the size is their difference.',
        solution: Q`\(c_x=(${x1}+${x2})/2=${out[0]}\), \(c_y=(${y1}+${y2})/2=${out[1]}\), \(w=${x2}-${x1}=${out[2]}\), \(h=${y2}-${y1}=${out[3]}\).`};
    }},
    {key: 'smooth-l1', skill: 'L1 and Smooth L1 box regression losses', make(r) {
      const delta = r.pick([1, 1, 0.5]), tx = r.int(2, 20), ty = r.int(2, 20), T = [tx, ty, tx + r.int(5, 10), ty + r.int(5, 10)];
      let res; do { res = Array.from({length: 4}, () => r.nonzero(-25, 25) / 10); } while (!res.some(x => Math.abs(x) < delta) || !res.some(x => Math.abs(x) >= delta));
      const Pb = T.map((t, i) => fx(t + res[i], 1)), rr = Pb.map((p, i) => fx(p - T[i], 1));
      const parts = rr.map(x => Math.abs(x) < delta ? x * x / (2 * delta) : Math.abs(x) - delta / 2);
      const l1 = sum(rr.map(Math.abs)), sl1 = sum(parts);
      return {prompt: Q`A predicted box \(${row(Pb)}\) has target \(${row(T)}\). With residuals \(r=\text{pred}-\text{target}\) per coordinate, give the summed L1 loss and the summed Smooth L1 loss with \(\delta=${delta}\): \(\frac{r^2}{2\delta}\) if \(|r|<\delta\), otherwise \(|r|-\frac{\delta}{2}\).`,
        answers: [{label: 'L1 sum', value: l1}, {label: 'Smooth L1 sum', value: sl1}],
        hint: 'Find the four residuals first. Small residuals use the quadratic piece; large ones use the linear piece.',
        solution: Q`Residuals \(${tup(rr)}\). L1: \(${rr.map(Math.abs).join('+')}=${fx(l1, 3)}\). Smooth L1 terms \(${tup(parts.map(x => fx(x, 4)))}\), summing to \(${fx(sl1, 4)}\). The quadratic piece is gentler near zero; large errors grow only linearly.`};
    }},
    {key: 'giou', skill: 'Generalized IoU with an enclosing box', make(r) {
      const apart = r.bool(0.5); let A, B; do { A = randBox(r, 0, 8, 4); B = randBox(r, 0, 8, 4); } while ((interW(A, B) * interH(A, B) === 0) !== apart || A.join() === B.join());
      const I = interW(A, B) * interH(A, B), U = area(A) + area(B) - I, C = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])], c = area(C);
      const iou = I / U, g = iou - (c - U) / c;
      return {prompt: Q`For \(A=${row(A)}\) and \(B=${row(B)}\) in boundary coordinates, let \(C\) be the smallest axis-aligned box containing both. Give \(|C|\) and \(\operatorname{GIoU}=\operatorname{IoU}-\frac{|C|-|A\cup B|}{|C|}\).`,
        answers: [{label: Q`\(|C|\)`, value: c, tol: 0}, {label: 'GIoU', value: g}],
        hint: 'Compute intersection and union as for IoU. C runs from the smallest x1, y1 to the largest x2, y2.',
        solution: Q`Intersection \(${I}\), union \(${area(A)}+${area(B)}-${I}=${U}\), IoU \(\approx${fx(iou, 4)}\). \(C=${row(C)}\) with area \(${c}\). \(\operatorname{GIoU}=${fx(iou, 4)}-\frac{${c}-${U}}{${c}}\approx${fx(g, 4)}\).${I === 0 ? ' The boxes are disjoint, so IoU is 0 whatever their distance, while GIoU becomes more negative as they move apart.' : ''}`};
    }},
    {key: 'duplicate-matching', skill: 'One-to-one matching of duplicate detections', make(r) {
      const n = r.int(2, 4), t = r.pick([0.5, 0.7]), ious = Array.from({length: n}, () => r.pick([0.2, 0.35, 0.45, 0.55, 0.6, 0.75, 0.8, 0.9]));
      const scores = r.distinct(n, 50, 99).sort((a, b) => b - a).map(s => s / 100), above = ious.filter(v => v >= t).length, tp = above ? 1 : 0;
      const first = ious.findIndex(v => v >= t), say = (a, b) => `${a} TP and ${b} FP`;
      return {prompt: Q`An image has one ground-truth object. ${n} predictions of its class have scores \(${tup(scores)}\) and IoUs \(${tup(ious)}\) with it, in that order. With one-to-one matching in decreasing score order at IoU threshold ${t}, how are the predictions counted?`,
        answers: [choose(r, say(tp, n - tp), [say(above, n - above), say(n, 0), say(1, 0), say(0, n)])],
        hint: 'Visit predictions from the highest score. A prediction can match only if its IoU reaches the threshold and the object is still unmatched.',
        solution: first < 0 ? `No prediction reaches IoU ${t}, so all ${n} are false positives and the object is a false negative.`
          : `The ${ORD[first]} prediction (score ${scores[first]}, IoU ${ious[first]}) is the highest-scoring one at or above ${t}, so it is the single TP. The object is then taken, so the other ${n - 1} are FP, even if their IoU is high. Duplicates must not inflate recall or precision.`};
    }},
  ]);

  P.add(43, [
    {key: 'iou-dice', skill: 'Foreground IoU and Dice from pixel counts', make(r) {
      const tp = r.int(3, 40), fp = r.int(0, 15), fn = r.int(fp === 0 ? 1 : 0, 15), iou = tp / (tp + fp + fn), dice = 2 * tp / (2 * tp + fp + fn);
      return {prompt: Q`A foreground mask prediction has \(TP=${tp}\), \(FP=${fp}\) and \(FN=${fn}\) pixels. Compute the foreground IoU and Dice.`,
        answers: [{label: 'IoU', value: iou}, {label: 'Dice', value: dice}],
        hint: Q`\(\operatorname{IoU}=\frac{TP}{TP+FP+FN}\) and \(\operatorname{Dice}=\frac{2TP}{2TP+FP+FN}\). True negatives do not appear.`,
        solution: Q`\(\operatorname{IoU}=\frac{${tp}}{${tp + fp + fn}}\approx${fx(iou, 4)}\) and \(\operatorname{Dice}=\frac{${2 * tp}}{${2 * tp + fp + fn}}\approx${fx(dice, 4)}\). Check: \(2\,\mathrm{IoU}/(1+\mathrm{IoU})\approx${fx(2 * iou / (1 + iou), 4)}\).`};
    }},
    {key: 'accuracy-vs-iou', skill: 'Pixel accuracy versus foreground IoU under imbalance', make(r) {
      const side = r.pick([10, 16, 20]), T = side * side, F = r.int(Math.round(0.04 * T), Math.round(0.15 * T)), tp = r.int(Math.ceil(F / 3), F - 1), fp = r.int(1, Math.max(1, Math.round(0.8 * F)));
      const fn = F - tp, tn = T - F - fp, accA = (T - F) / T, accB = (tp + tn) / T, iou = tp / (tp + fp + fn);
      return {prompt: Q`A \(${side}\times${side}\) mask has ${F} foreground pixels. Model A predicts background everywhere. Model B predicts ${tp + fp} foreground pixels, ${tp} of them correct. Give A's pixel accuracy, B's pixel accuracy and B's foreground IoU.`,
        answers: [{label: 'Accuracy of A', value: accA}, {label: 'Accuracy of B', value: accB}, {label: 'Foreground IoU of B', value: iou}],
        hint: 'For B: TP is given, FP = predicted foreground - TP, FN = foreground - TP, and TN is everything else.',
        solution: Q`A: \(${T - F}/${T}=${fx(accA, 4)}\), with foreground IoU 0. B: \(TP=${tp}\), \(FP=${fp}\), \(FN=${fn}\), \(TN=${tn}\), accuracy \((${tp}+${tn})/${T}=${fx(accB, 4)}\), IoU \(${tp}/${tp + fp + fn}\approx${fx(iou, 4)}\). Background pixels dominate accuracy; IoU shows whether objects were found.`};
    }},
    {key: 'soft-dice', skill: 'Soft Dice from probabilities and targets', make(r) {
      const n = r.int(5, 6), eps = r.pick([0, 1]); let y; do { y = Array.from({length: n}, () => r.int(0, 1)); } while (!y.includes(1) || !y.includes(0));
      const p = Array.from({length: n}, () => r.int(0, 10) / 10), py = fx(dot(p, y), 1), sp = fx(sum(p), 1), sy = sum(y), dice = (2 * py + eps) / (sp + sy + eps);
      return {prompt: Q`Foreground probabilities are \(p=${tup(p)}\) for pixels with targets \(y=${tup(y)}\). Using the pooled soft Dice \(\frac{2\sum_ip_iy_i+\epsilon}{\sum_ip_i+\sum_iy_i+\epsilon}\) with \(\epsilon=${eps}\), give \(\sum_ip_iy_i\) and the soft Dice.`,
        answers: [{label: Q`\(\sum_ip_iy_i\)`, value: py}, {label: 'Soft Dice', value: dice}],
        hint: 'Add the probabilities on target pixels for the overlap term. The denominator adds all probabilities and all targets.',
        solution: Q`\(\sum p_iy_i=${py}\), \(\sum p_i=${sp}\), \(\sum y_i=${sy}\). Soft Dice \(=\frac{2\cdot${py}+${eps}}{${sp}+${sy}+${eps}}\approx${fx(dice, 4)}\). A Dice loss would use \(1-${fx(dice, 4)}\); thresholded Dice at evaluation can differ.`};
    }},
    {key: 'weighted-ce', skill: 'Class-weighted pixel cross entropy', make(r) {
      let lab; do { lab = Array.from({length: 5}, () => r.int(0, 1)); } while (!lab.includes(1) || !lab.includes(0));
      const p = lab.map(() => r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])), wf = r.pick([2, 3, 4, 5, 10]);
      const loss = p.map(x => -Math.log(x)), wts = lab.map(l => l ? wf : 1), plain = mean(loss), weighted = dot(wts, loss) / sum(wts);
      return {prompt: Q`Five pixels have true classes ${tup(lab.map(l => l ? 'F' : 'B'))} (F foreground, B background), and the model gives their true class probabilities \(${tup(p)}\). With foreground weight ${wf} and background weight 1, give the unweighted mean cross entropy and the weighted mean \(\sum_iw_{y_i}(-\ln p_i)/\sum_iw_{y_i}\).`,
        answers: [{label: 'Unweighted mean', value: plain}, {label: 'Weighted mean', value: weighted}],
        hint: 'Compute -ln p for each pixel first. The weighted mean divides by the total weight, not by the number of pixels.',
        solution: Q`Per-pixel losses \(${tup(loss.map(x => fx(x, 4)))}\). Unweighted mean \(\approx${fx(plain, 4)}\). Weights \(${tup(wts)}\) sum to ${sum(wts)}, so the weighted mean is \(\approx${fx(weighted, 4)}\). Weighting changes the objective being optimized, not just its scale.`};
    }},
    {key: 'seg-concept', skill: 'Segmentation outputs, ignore labels and class weights', make(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const w = r.pick([2, 5, 10, 20]), f = r.pick([1, 2, 5, 10]);
        return {prompt: `Pixel cross entropy gets foreground weight ${w} and background weight 1 on masks that are about ${f}% foreground. What does the weighting do?`,
          answers: [choose(r, 'It changes the optimized objective, so the learned model and its calibration can change', ['It leaves the objective unchanged and only speeds up training', 'It changes only the evaluation metric', 'It makes reporting foreground IoU unnecessary'])],
          hint: 'Write the weighted loss as a sum and compare it with the unweighted one.',
          solution: 'Weights change each pixel’s contribution, so the minimizer of the weighted loss is generally different. That can help a rare class but can also shift probabilities, so report the weights and evaluate with overlap metrics.'};
      }
      if (v === 1) {
        const lab = r.pick([255, -1, 99]);
        return {prompt: `Boundary pixels in the target masks carry the ignore label ${lab}. Under the usual declared protocol, how are they treated?`,
          answers: [choose(r, 'Excluded from both the loss and the metrics', ['Counted as background in the loss', 'Counted as false positives in IoU', 'Included in the loss but excluded from the metrics'])],
          hint: 'An ignore label marks pixels whose class is not part of the evaluation question.',
          solution: 'Ignored pixels are removed from the loss average and from the metric counts. Treating them as background would penalize predictions on pixels that have no reliable label.'};
      }
      if (v === 2) {
        const N = r.pick([2, 4, 8]), H = r.pick([32, 64, 128]), W = r.pick([48, 64, 96]), K = r.pick([3, 5, 21]);
        return {prompt: `Segmentation logits have shape (${N}, ${H}, ${W}, ${K}) in channel-last order with ${K} classes. Softmax is applied over`,
          answers: [choose(r, 'the class axis, separately at every pixel', ['the height and width axes, separately for each class', 'the batch axis', 'all pixels of each image jointly'])],
          hint: 'Each pixel needs a probability distribution over classes.',
          solution: `Each of the ${N}x${H}x${W} pixel positions gets its own distribution over ${K} classes, so softmax runs over the last axis. The loss then aggregates over examples and valid pixels.`};
      }
      const side = r.pick([10, 16, 20, 32]), tn = side * side - r.int(10, 40);
      return {prompt: `A ${side}x${side} foreground mask prediction has TN = ${tn} background pixels correctly predicted. Which counts determine foreground IoU and Dice?`,
        answers: [choose(r, 'TP, FP and FN only', ['TP, FP, FN and TN', 'TP and TN only', 'TN and FN only'])],
        hint: 'Write both formulas and look for TN.',
        solution: Q`\(\operatorname{IoU}=\frac{TP}{TP+FP+FN}\) and \(\operatorname{Dice}=\frac{2TP}{2TP+FP+FN}\). The ${tn} true negatives affect pixel accuracy but neither overlap measure, which is why overlap exposes an all-background predictor.`};
    }},
  ]);

  P.add(44, [
    {key: 'pr-f1', skill: 'Precision, recall and F1 from counts', make(r) {
      const tp = r.int(1, 60), fp = r.int(0, 20), fn = r.int(fp === 0 ? 1 : 0, 20), p = tp / (tp + fp), rc = tp / (tp + fn), f1 = 2 * tp / (2 * tp + fp + fn);
      return {prompt: Q`A detector at a fixed threshold has \(TP=${tp}\), \(FP=${fp}\) and \(FN=${fn}\). Compute precision, recall and \(F_1\).`,
        answers: [{label: 'Precision', value: p}, {label: 'Recall', value: rc}, {label: Q`\(F_1\)`, value: f1}],
        hint: Q`Precision divides by predicted positives \(TP+FP\); recall divides by real positives \(TP+FN\).`,
        solution: Q`Precision \(${tp}/${tp + fp}\approx${fx(p, 4)}\), recall \(${tp}/${tp + fn}\approx${fx(rc, 4)}\), \(F_1=\frac{2\cdot${tp}}{${2 * tp}+${fp}+${fn}}\approx${fx(f1, 4)}\), the harmonic mean of the two.`};
    }},
    {key: 'ranked-ap', skill: 'Non-interpolated AP from a ranked list', make(r) {
      const L = r.int(5, 7); let out; do { out = Array.from({length: L}, () => r.bool()); } while (!out.some(Boolean) || out.every(Boolean));
      const hits = out.filter(Boolean).length, missed = r.int(0, 2), G = hits + missed;
      let k = 0; const terms = [], vals = [];
      out.forEach((o, i) => { if (o) { k++; terms.push(Q`\tfrac{${k}}{${i + 1}}`); vals.push(k / (i + 1)); } });
      const ap = sum(vals) / G;
      return {prompt: Q`Detections sorted by decreasing score have outcomes ${out.map(o => o ? 'TP' : 'FP').join(', ')} after class-aware one-to-one matching at a fixed IoU threshold. There ${G === 1 ? 'is 1 ground-truth object' : `are ${G} ground-truth objects`}. Using the non-interpolated convention \(\operatorname{AP}=\frac1G\sum(\text{precision at each TP rank})\), give the final recall and AP.`,
        answers: [{label: 'Final recall', value: hits / G}, {label: 'AP', value: ap}],
        hint: 'At each TP, precision is (TPs so far)/(rank). Divide the sum by the number of ground-truth objects, not by the number of TPs.',
        solution: Q`Precision at the TP ranks: \(${terms.join(Q`,\ `)}\). \(\operatorname{AP}=\frac1{${G}}\left(${terms.join('+')}\right)\approx${fx(ap, 4)}\). Final recall \(${hits}/${G}\approx${fx(hits / G, 4)}\).${missed ? ` The ${missed} never-detected object${missed > 1 ? 's contribute' : ' contributes'} zero to the sum.` : ''}`};
    }},
    {key: 'threshold-pr', skill: 'Precision and recall at a score threshold', make(r) {
      const n = r.int(6, 8), scores = r.distinct(n, 5, 99).sort((a, b) => b - a).map(s => s / 100);
      let y; do { y = Array.from({length: n}, () => r.int(0, 1)); } while (!y.includes(1) || !y.includes(0));
      const i = r.int(1, n - 2), t = scores[i], tp = y.slice(0, i + 1).filter(Boolean).length, pos = sum(y), fp = i + 1 - tp;
      return {prompt: Q`Scores \(${tup(scores)}\) have true labels \(${tup(y)}\) (1 = positive). Predict positive when \(p\ge${t}\). Give precision and recall.`,
        answers: [{label: 'Precision', value: tp / (i + 1)}, {label: 'Recall', value: tp / pos}],
        hint: 'The threshold includes equality. Count positives among the predicted set, and all positives overall.',
        solution: Q`${i + 1} items have \(p\ge${t}\); ${tp} are positive, so \(TP=${tp}\), \(FP=${fp}\), \(FN=${pos - tp}\). Precision \(${tp}/${i + 1}\approx${fx(tp / (i + 1), 4)}\); recall \(${tp}/${pos}\approx${fx(tp / pos, 4)}\).`};
    }},
    {key: 'micro-macro', skill: 'Macro versus micro averaged precision', make(r) {
      const [big, rare] = r.pick([['car', 'bicycle'], ['person', 'dog'], ['vertical bar', 'diagonal bar'], ['cell', 'mitosis']]);
      const t1 = r.int(70, 95), f1 = r.int(3, 15), t2 = r.int(1, 6), f2 = r.int(2, 10), p1 = t1 / (t1 + f1), p2 = t2 / (t2 + f2), macro = (p1 + p2) / 2, micro = (t1 + t2) / (t1 + f1 + t2 + f2);
      return {prompt: `Per-class counts: ${big} TP = ${t1}, FP = ${f1}; ${rare} TP = ${t2}, FP = ${f2}. Give the macro-averaged precision (mean of class precisions) and the micro-averaged precision (pooled counts).`,
        answers: [{label: 'Macro precision', value: macro}, {label: 'Micro precision', value: micro}],
        hint: 'Macro: compute each class precision, then average. Micro: add TPs and FPs over classes first.',
        solution: Q`Class precisions \(${t1}/${t1 + f1}\approx${fx(p1, 4)}\) and \(${t2}/${t2 + f2}\approx${fx(p2, 4)}\); macro \(\approx${fx(macro, 4)}\). Micro \(${t1 + t2}/${t1 + f1 + t2 + f2}\approx${fx(micro, 4)}\). The frequent class dominates the pooled counts, so the averages disagree.`};
    }},
    {key: 'metric-concept', skill: 'Interpreting thresholds, averaging and AP protocols', make(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const a = r.int(35, 60), b = a - r.int(1, 4);
        return {prompt: `Paper A reports AP ${a}.0 and paper B reports AP ${b}.0 for detectors on the same image collection. What must match before the numbers can be compared?`,
          answers: [choose(r, 'IoU threshold(s), matching rule, AP convention and class set', ['Only the backbone architecture', 'Nothing: AP is defined the same way everywhere', 'Only the number of training epochs'])],
          hint: 'List every choice that turns ranked detections into one AP number.',
          solution: 'AP depends on class set, matching and duplicate rules, IoU thresholds, the interpolation or recall-sampling convention, size ranges and detection limits. A COCO result needs COCO’s protocol.'};
      }
      if (v === 1) {
        const p1 = r.pick([0.9, 0.92, 0.95]), p2 = r.pick([0.2, 0.3, 0.4]), n1 = r.pick([200, 500, 1000]), n2 = r.pick([10, 20, 25]);
        return {prompt: `A frequent class has precision ${p1} over ${n1} predictions and a rare class has precision ${p2} over ${n2} predictions. Why is macro precision lower than micro precision here?`,
          answers: [choose(r, 'Macro weights the rare class equally; micro pools counts dominated by the frequent class', ['Micro averaging ignores false positives', 'Macro averaging counts each prediction twice', 'They must be equal, so one value contains a bug'])],
          hint: 'Compute both: (p1 + p2)/2 and the pooled ratio.',
          solution: `Macro = (${p1} + ${p2})/2 = ${fx((p1 + p2) / 2, 3)}. Micro pools ${n1 + n2} predictions, so it is about ${fx((p1 * n1 + p2 * n2) / (n1 + n2), 3)}, close to the frequent class. Report which average answers your question.`};
      }
      const t1 = r.pick([0.6, 0.7, 0.8]), t2 = fx(t1 - r.pick([0.1, 0.2]), 1), k = r.int(2, 9), allFP = v === 2;
      return {prompt: `Lowering a detector's threshold from ${t1} to ${t2} adds ${k} new predictions, all of them ${allFP ? 'false' : 'true'} positives. Before the change some predictions were correct and some were wrong. What happens?`,
        answers: [choose(r, allFP ? 'Recall is unchanged and precision decreases' : 'Recall increases and precision increases', ['Recall is unchanged and precision decreases', 'Recall increases and precision increases', 'Recall increases and precision decreases', 'Recall decreases and precision is unchanged'])],
        hint: 'Write precision TP/(TP+FP) and recall TP/(TP+FN), then change only the counts that move.',
        solution: allFP ? 'Only FP grows, so the precision denominator grows while TP is fixed: precision falls. TP and FN are unchanged, so recall is unchanged.'
          : 'TP grows by the same amount in numerator and denominator of precision, which raises a precision below 1. FN falls, so recall rises.'};
    }},
  ]);

  /* ---------- Module 12 ---------- */
  P.add(45, [
    {key: 'accuracy-se', skill: 'Standard error and 95% interval of a test accuracy', make(r) {
      const n = r.pick([200, 250, 400, 500, 800, 1000]), k = r.int(Math.round(0.7 * n), Math.round(0.97 * n)), p = k / n, se = Math.sqrt(p * (1 - p) / n), half = 1.96 * se;
      return {prompt: Q`A model gets ${k} of ${n} independent test images right. Give the accuracy (%), its standard error \(\sqrt{p(1-p)/n}\) in percentage points, and the 95% normal-approximation interval \(p\pm1.96\,\mathrm{SE}\) in %.`,
        answers: [{label: 'Accuracy (%)', value: 100 * p, tol: 0.05, rel: 0}, {label: 'SE (percentage points)', value: 100 * se, rel: 0}, {label: '95% interval (%)', vector: [100 * (p - half), 100 * (p + half)], tol: 0.03, rel: 0}],
        hint: 'Work with p as a fraction, then multiply by 100 at the end.',
        solution: Q`\(p=${k}/${n}=${fx(p, 4)}\). \(\mathrm{SE}=\sqrt{${fx(p, 4)}\cdot${fx(1 - p, 4)}/${n}}\approx${fx(se, 5)}\), i.e. ${fx(100 * se, 3)} points. Half-width \(1.96\cdot${fx(100 * se, 3)}\approx${fx(100 * half, 3)}\), so the interval is about \([${fx(100 * (p - half), 2)}, ${fx(100 * (p + half), 2)}]\)%. This is test-sampling uncertainty for one fixed model.`};
    }},
    {key: 'group-split', skill: 'Group splitting versus frame-level random assignment', make(r) {
      const G = r.pick([20, 40, 60, 100]), F = r.pick([3, 4, 5, 8, 10]), q = r.pick([0.1, 0.2, 0.25, 0.3, 0.5]), tg = Math.round(q * G);
      const pm = 1 - (1 - q) ** F - q ** F, mixed = G * pm;
      return {prompt: Q`A dataset has ${G} videos with ${F} frames each. A group split puts ${tg} whole videos (${fx(100 * q, 1)}%) in the test set. How many test images is that? If instead each frame went to test independently with probability ${q}, how many videos would you expect to have frames on both sides?`,
        answers: [{label: 'Test images (group split)', value: tg * F, tol: 0}, {label: 'Expected mixed videos', value: mixed}],
        hint: Q`A video is mixed unless all its frames land on the same side: \(P(\text{mixed})=1-(1-q)^F-q^F\).`,
        solution: Q`Group split: \(${tg}\cdot${F}=${tg * F}\) images, with no video on both sides. Frame-level: \(P(\text{mixed})=1-${fx(1 - q, 2)}^{${F}}-${q}^{${F}}\approx${fx(pm, 4)}\), so about \(${G}\cdot${fx(pm, 4)}\approx${fx(mixed, 3)}\) videos leak near-duplicate frames into both sets.`};
    }},
    {key: 'mean-box-baseline', skill: 'IoU of a fixed average-box baseline', make(r) {
      let M, boxes, T;
      for (;;) {
        M = randBox(r, 3, 10, 6); M = [M[0], M[1], M[2] + 2, M[3] + 2];
        const d1 = Array.from({length: 4}, () => r.int(-2, 2)), d2 = Array.from({length: 4}, () => r.int(-2, 2)), d3 = d1.map((v, i) => -v - d2[i]);
        boxes = [d1, d2, d3].map(d => M.map((m, i) => m + d[i]));
        T = randBox(r, 2, 12, 7);
        if (boxes.every(b => b[2] > b[0] && b[3] > b[1] && b.every(c => c >= 0)) && interW(M, T) * interH(M, T) > 0) break;
      }
      const I = interW(M, T) * interH(M, T), U = area(M) + area(T) - I;
      return {prompt: Q`A fixed-box localization baseline predicts the coordinate-wise mean of the training boxes for every image. The training boxes are \(${boxes.map(row).join(Q`,\ `)}\). Give the baseline box and its IoU with the test target \(${row(T)}\).`,
        answers: [{label: 'Baseline box', vector: M, tol: 0}, {label: 'IoU', value: I / U}],
        hint: 'Average each coordinate over the three boxes, then compute intersection over union as usual.',
        solution: Q`Mean box \(${row(M)}\) (for example \(x_1=(${boxes.map(b => b[0]).join('+')})/3=${M[0]}\)). Intersection \(${I}\), union \(${area(M)}+${area(T)}-${I}=${U}\), IoU \(\approx${fx(I / U, 4)}\). A learned localizer should beat this geometry-only baseline.`};
    }},
    {key: 'test-size', skill: 'Test-set size for a target interval width', make(r) {
      const pp = r.pick([70, 80, 85, 90, 95]), hh = r.pick([1, 2, 3, 5]), num = 38416 * pp * (100 - pp), den = 10000 * hh * hh, n = Math.ceil(num / den);
      return {prompt: Q`You expect an accuracy near ${pp}% and want the 95% half-width \(1.96\sqrt{p(1-p)/n}\) to be at most ${hh} percentage point${hh === 1 ? '' : 's'}. What is the smallest test-set size \(n\)? Use \(z=1.96\) and round up.`,
        answers: [{label: Q`\(n\)`, value: n, tol: 1, rel: 0}],
        hint: Q`Solve \(1.96\sqrt{p(1-p)/n}\le h\) for \(n\): \(n\ge1.96^2p(1-p)/h^2\).`,
        solution: Q`\(n\ge\frac{1.96^2\cdot${pp / 100}\cdot${fx(1 - pp / 100, 2)}}{${hh / 100}^2}=${fx(num / den, 2)}\), so \(n=${n}\). Halving the width needs about four times as many test images.`};
    }},
    {key: 'protocol-concept', skill: 'What a protocol, baseline and synthetic result establish', make(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const a = r.int(88, 99), b = a - r.int(3, 20);
        return {prompt: `A small CNN reaches ${a}% and linear softmax ${b}% on held-out generated 8x8 bars, with the same split and training budget. What does this establish?`,
          answers: [choose(r, 'The CNN did better for this generator, split and protocol', ['The CNN will be more accurate on real photographs', 'CNNs always outperform linear models', 'The linear baseline was unnecessary'])],
          hint: 'Ask which population the test images were drawn from.',
          solution: 'A synthetic result establishes behaviour for its generator and protocol. Claims about real scenes need data from that distribution.'};
      }
      if (v === 1) {
        const k = r.int(4, 12), a = r.int(80, 97);
        return {prompt: `You train ${k} learning-rate settings and report the best test accuracy, ${a}%. What is the problem?`,
          answers: [choose(r, 'The figure is optimistically biased: select on validation data, then test once', ['None: each run was evaluated honestly', 'It is pessimistic because most settings were worse', 'None, as long as the seed is fixed'])],
          hint: 'The test set was used to make a choice.',
          solution: `Picking the maximum of ${k} noisy test scores favours settings that got lucky on those images. Choose with a validation split, fix the choice, then evaluate on the test set once.`};
      }
      if (v === 2) {
        const f = r.pick([2, 5, 8, 10]);
        return {prompt: `An all-background baseline reaches ${100 - f}% pixel accuracy on masks that are ${f}% foreground. Which metric exposes its weakness?`,
          answers: [choose(r, 'Foreground IoU, which is 0', [`Pixel accuracy, which is ${100 - f}%`, 'Background IoU, which is high', 'The training loss'])],
          hint: 'Which measure ignores the easy background pixels?',
          solution: 'With no predicted foreground, TP = 0, so foreground IoU and recall are 0 despite high pixel accuracy. A baseline is useful precisely because it exposes metric pitfalls.'};
      }
      const n = r.pick([500, 1000, 2000, 5000]);
      return {prompt: `Before evaluating on your ${n}-image test set, which decisions should already be fixed?`,
        answers: [choose(r, 'The split and grouping rule, preprocessing, primary metric and model-selection procedure', ['The accuracy you hope to report', 'Only the random seed', 'Which test images to drop after seeing the errors'])],
        hint: 'Anything chosen after seeing test results can be tuned to them.',
        solution: 'Fix the split, preprocessing, metric and selection procedure (and record seeds) first. Changing them after looking at test results turns the test set into a tuning set.'};
    }},
  ]);

  P.add(46, [
    {key: 'seed-stats', skill: 'Mean and sample standard deviation across seeds', make(r) {
      const k = r.int(3, 5), acc = Array.from({length: k}, () => r.real(70, 90, 1)), m = mean(acc), s = sdev(acc);
      return {prompt: `One training procedure run with ${k} seeds gives test accuracies (${acc.join(', ')})%. Give the mean (%) and the sample standard deviation (divisor n - 1, in percentage points).`,
        answers: [{label: 'Mean (%)', value: m, rel: 0}, {label: 'Sample SD (points)', value: s, rel: 0}],
        hint: 'Average first, then square each deviation, divide the total by n - 1 and take the square root.',
        solution: Q`Mean \(${fx(sum(acc), 1)}/${k}\approx${fx(m, 3)}\). Deviations \(${tup(acc.map(a => fx(a - m, 3)))}\); squared sum \(\approx${fx(sum(acc.map(a => (a - m) ** 2)), 4)}\); divided by ${k - 1} and square-rooted gives \(s\approx${fx(s, 3)}\). This measures run-to-run variation, not test-sampling uncertainty.`};
    }},
    {key: 'paired-diff', skill: 'Paired differences across matched seeds', make(r) {
      const k = r.int(3, 5); let base, nw, d;
      do { base = Array.from({length: k}, () => r.real(70, 85, 1)); nw = base.map(b => fx(b + r.real(-1.5, 3, 1), 1)); d = nw.map((x, i) => fx(x - base[i], 1)); } while (new Set(d).size === 1 || Math.abs(sum(d)) < 0.05);
      const md = mean(d), sd = sdev(d), t = md / (sd / Math.sqrt(k));
      return {prompt: `With the same ${k} seeds and data split, a baseline scores (${base.join(', ')})% and a modified model (${nw.join(', ')})%. Give the mean paired difference (new - base, points), the sample SD of the differences, and the paired statistic t = mean/(SD/sqrt(n)).`,
        answers: [{label: 'Mean difference', value: md, rel: 0}, {label: 'SD of differences', value: sd, rel: 0}, {label: 't', value: t}],
        hint: 'Subtract within each seed first; then treat the differences as one sample.',
        solution: Q`Differences \(${tup(d)}\), mean \(\approx${fx(md, 3)}\), SD \(\approx${fx(sd, 3)}\), so \(t=${fx(md, 3)}/(${fx(sd, 3)}/\sqrt{${k}})\approx${fx(t, 3)}\). Pairing removes seed-to-seed variation shared by both models; ${k} runs still give limited precision.`};
    }},
    {key: 'mcnemar', skill: 'Paired test outcomes and a McNemar statistic', make(r) {
      const n = r.pick([200, 300, 500, 1000]), b = r.int(3, 30), c = r.int(3, 40), n00 = r.int(5, Math.round(0.15 * n)), n11 = n - b - c - n00;
      const diff = 100 * (c - b) / n, chi = (b - c) ** 2 / (b + c);
      return {prompt: Q`Models A and B are scored on the same ${n} test images: both right on ${n11}, only A right on ${b}, only B right on ${c}, both wrong on ${n00}. Give the accuracy difference B − A in percentage points and the McNemar statistic \((b-c)^2/(b+c)\) without continuity correction.`,
        answers: [{label: 'B - A (points)', value: diff, rel: 0}, {label: 'McNemar statistic', value: chi}],
        hint: 'Images both models get right or both get wrong cancel in the difference. Only the discordant counts b and c matter.',
        solution: Q`Accuracies \((${n11}+${b})/${n}\) and \((${n11}+${c})/${n}\), so the difference is \((${c}-${b})/${n}\cdot100\approx${fx(diff, 3)}\) points. \(\chi^2=(${b}-${c})^2/(${b}+${c})\approx${fx(chi, 3)}\), compared with about 3.84 for a 5% test with one degree of freedom.`};
    }},
    {key: 'pp-vs-relative', skill: 'Percentage points versus relative change', make(r) {
      const A = r.int(60, 94), B = A + r.int(1, Math.min(8, 99 - A)), pp = B - A, rel = 100 * pp / A, err = 100 * pp / (100 - A);
      return {prompt: `Accuracy rises from ${A}% to ${B}%. Give the change in percentage points, the relative change in accuracy (%), and the relative reduction in error rate (%).`,
        answers: [{label: 'Change (points)', value: pp, tol: 0}, {label: 'Relative accuracy change (%)', value: rel}, {label: 'Error-rate reduction (%)', value: err}],
        hint: `The error rate is 100 - accuracy. Relative changes divide by the starting value.`,
        solution: Q`Points: \(${B}-${A}=${pp}\). Relative: \(${pp}/${A}\cdot100\approx${fx(rel, 3)}\%\). Error falls from ${100 - A}% to ${100 - B}%: \(${pp}/${100 - A}\cdot100\approx${fx(err, 3)}\%\). Say which one you report.`};
    }},
    {key: 'comparison-concept', skill: 'Which claims a comparison supports', make(r) {
      const v = r.int(0, 3), g = r.real(0.5, 4, 1);
      if (v === 0) return {prompt: `A run that changes both the optimizer and the architecture improves accuracy by ${g} points. What does this support?`,
        answers: [choose(r, 'That the bundled change helped under this protocol, not which factor caused it', ['That the new architecture caused the gain', 'That the new optimizer caused the gain', 'That either change alone would give the same gain'])],
        hint: 'How many factors changed between the two runs?',
        solution: 'Two factors changed, so either one or their interaction could explain the gain. An ablation that changes one factor at a time isolates each contribution.'};
      const k = r.int(3, 8);
      if (v === 1) return {prompt: `Of ${k} seeds, you report only the one where the new model wins by ${g} points. What is wrong?`,
        answers: [choose(r, 'It overstates the typical gain; report every seed and a summary', ['Nothing, the best seed shows what the model can do', 'It understates the gain', `Nothing, as long as all ${k} seeds were run`])],
        hint: 'What would a reader expect from a new run?',
        solution: `Selecting the best of ${k} runs reports the luckiest outcome. Report all runs, their mean and spread, and keep the seeds predeclared.`};
      if (v === 2) return {prompt: `Averaging ${k} training seeds gives a seed SD of ${g} points on one fixed test set. Does this capture uncertainty about performance on the whole test population?`,
        answers: [choose(r, 'No: seed variation and test-sampling uncertainty are different sources', ['Yes: averaging seeds removes all uncertainty', 'Yes, provided the test set has over 100 images', 'No, because the seeds should have been chosen after training'])],
        hint: 'What changes between seeds, and what stays the same?',
        solution: 'Seeds vary initialization and data order while the test images stay fixed. Sampling uncertainty about the population of test images needs a separate estimate, such as a binomial standard error or bootstrap.'};
      return {prompt: `Rerunning with the same seed on a different GPU gives an accuracy ${fx(g / 10, 2)} points different. What is the best response?`,
        answers: [choose(r, 'Record hardware and library versions and expect small numerical deviations', ['Conclude that the code has a bug', 'Report only the higher of the two numbers', 'Stop using seeds, since they do not work'])],
        hint: 'A fixed seed controls the random stream, not every floating-point detail.',
        solution: 'Hardware, library versions and nondeterministic kernels can change floating-point results. Record them, report the deviation, and keep it small relative to the claimed effect.'};
    }},
  ]);

  P.add(47, [
    {key: 'mixture-shift', skill: 'Aggregate accuracy under subgroup mixture shift', make(r) {
      const [g1, g2] = r.pick([['bright', 'dark'], ['low-noise', 'high-noise'], ['centred', 'off-centre'], ['large-object', 'small-object']]);
      const a1 = r.int(85, 98), a2 = r.int(40, 75), q0 = r.pick([5, 10, 20]), q1 = r.pick([30, 40, 50, 60, 70]);
      const old = (a1 * (100 - q0) + a2 * q0) / 100, nw = (a1 * (100 - q1) + a2 * q1) / 100;
      return {prompt: `A model has ${a1}% accuracy on ${g1} images and ${a2}% on ${g2} images, and these conditional accuracies stay fixed. The validation set is ${q0}% ${g2}; deployment is ${q1}% ${g2}. Give the aggregate accuracy (%) for each mixture.`,
        answers: [{label: 'Validation mixture (%)', value: old, rel: 0}, {label: 'Deployment mixture (%)', value: nw, rel: 0}],
        hint: 'Aggregate accuracy is the share-weighted average of subgroup accuracies.',
        solution: Q`Validation: \(${a1}\cdot${fx(1 - q0 / 100, 2)}+${a2}\cdot${q0 / 100}=${fx(old, 2)}\%\). Deployment: \(${a1}\cdot${fx(1 - q1 / 100, 2)}+${a2}\cdot${q1 / 100}=${fx(nw, 2)}\%\). The headline drops by ${fx(old - nw, 2)} points with no change in per-group behaviour, so report subgroup metrics and counts.`};
    }},
    {key: 'prevalence-precision', skill: 'Precision under a prevalence change', make(r) {
      const tpr = r.pick([0.8, 0.9, 0.95]), fpr = r.pick([0.02, 0.05, 0.1]), pi0 = r.pick([0.5, 0.3, 0.2]), pi1 = r.pick([0.1, 0.05, 0.01]);
      const prec = pi => tpr * pi / (tpr * pi + fpr * (1 - pi)), p0 = prec(pi0), p1 = prec(pi1);
      return {prompt: `A detector has recall (true-positive rate) ${tpr} and false-positive rate ${fpr}, and both stay fixed. Positives make up ${fx(pi0 * 100, 1)}% of the validation images but ${fx(pi1 * 100, 1)}% after deployment. Give the precision in each setting.`,
        answers: [{label: 'Validation precision', value: p0}, {label: 'Deployment precision', value: p1}],
        hint: Q`\(\text{precision}=\frac{\mathrm{TPR}\,\pi}{\mathrm{TPR}\,\pi+\mathrm{FPR}(1-\pi)}\), where \(\pi\) is the prevalence (Bayes' rule).`,
        solution: Q`Validation: \(\frac{${tpr}\cdot${pi0}}{${tpr}\cdot${pi0}+${fpr}\cdot${fx(1 - pi0, 2)}}\approx${fx(p0, 4)}\). Deployment: \(\frac{${tpr}\cdot${pi1}}{${tpr}\cdot${pi1}+${fpr}\cdot${fx(1 - pi1, 2)}}\approx${fx(p1, 4)}\). Recall is unchanged, yet precision falls because negatives now supply more of the predicted positives.`};
    }},
    {key: 'error-share', skill: 'Group error rates and share of all errors', make(r) {
      const names = ['low noise', 'medium noise', 'high noise'], n = [r.pick([200, 300, 400, 500]), r.pick([100, 150, 200, 250]), r.pick([40, 50, 80, 100])];
      const e = [r.int(2, Math.round(0.06 * n[0])), r.int(3, Math.round(0.15 * n[1])), r.int(Math.round(0.2 * n[2]), Math.round(0.5 * n[2]))];
      const rates = e.map((x, i) => 100 * x / n[i]), share = 100 * e[2] / sum(e);
      return {prompt: `Error analysis by group: ${names.map((g, i) => `${g}: ${e[i]} errors in ${n[i]} images`).join('; ')}. Give each group's error rate (%) in that order, and the share (%) of all errors that come from the high-noise group.`,
        answers: [{label: 'Error rates (%)', vector: rates, rel: 0}, {label: 'High-noise share of errors (%)', value: share, rel: 0}],
        hint: 'A rate divides by the group size; a share divides by the total number of errors.',
        solution: Q`Rates: \(${e.map((x, i) => `${x}/${n[i]}`).join(Q`,\ `)}\to${tup(rates.map(x => fx(x, 2)))}\%\). Total errors ${sum(e)}, so the high-noise share is \(${e[2]}/${sum(e)}\approx${fx(share, 2)}\%\). Rates show where the model is weak; shares show where errors come from in this mixture.`};
    }},
    {key: 'ece', skill: 'Expected calibration error from bins', make(r) {
      const n = [r.int(10, 60), r.int(20, 80), r.int(40, 150)], conf = [r.int(50, 64), r.int(65, 84), r.int(85, 98)], acc = conf.map(c => Math.min(100, Math.max(30, c + r.int(-18, 8))));
      const N = sum(n), ece = sum(n.map((k, i) => k * Math.abs(acc[i] - conf[i]))) / N, gap = sum(n.map((k, i) => k * (conf[i] - acc[i]))) / N;
      return {prompt: Q`A test set of ${N} predictions is split into three confidence bins with counts ${tup(n)}, mean confidence ${tup(conf)}% and accuracy ${tup(acc)}%. Give the expected calibration error \(\sum_b\frac{n_b}{N}|\mathrm{acc}_b-\mathrm{conf}_b|\) and the overall gap (mean confidence − accuracy), both in points.`,
        answers: [{label: 'ECE (points)', value: ece, rel: 0}, {label: 'Overall gap (points)', value: gap, rel: 0}],
        hint: 'Weight each bin by its share of predictions. ECE uses absolute gaps; the overall gap keeps signs, so bins can cancel.',
        solution: Q`Bin gaps (conf − acc): \(${tup(conf.map((c, i) => c - acc[i]))}\). ECE \(=\frac{${n.map((k, i) => Q`${k}\cdot${Math.abs(acc[i] - conf[i])}`).join('+')}}{${N}}\approx${fx(ece, 3)}\). Signed gap \(\approx${fx(gap, 3)}\). Calibration measured here need not transfer to a shifted population.`};
    }},
    {key: 'shift-concept', skill: 'Name the type of distribution shift', make(r) {
      const IN = 'Input appearance shift', PREV = 'Class prevalence shift', CON = 'Label meaning (concept) shift', NONE = 'No distribution shift';
      const s1 = r.pick([0.05, 0.1]), s2 = r.pick([0.2, 0.3]), f1 = r.pick([40, 50]), f2 = r.pick([5, 10, 20]), deg = r.pick([20, 30, 40]), seed = r.int(2, 999), k = r.pick([1.3, 1.5, 2]);
      const [prompt, right, why] = r.pick([
        [`Bar images at test time have pixel noise SD ${s2} instead of ${s1}; labels and class balance are unchanged. What kind of change is this?`, IN, 'The appearance of inputs changes while classes and their meaning stay fixed.'],
        [`Vertical bars fall from ${f1}% to ${f2}% of test images; each class looks the same as before. What kind of change is this?`, PREV, 'Class frequencies change while the class-conditional appearance is fixed. Precision can change even if per-class detection rates do not.'],
        [`New annotators label bars tilted more than ${deg} degrees from horizontal as vertical, which the old guide called horizontal. What kind of change is this?`, CON, 'The relation between input and target has changed, so the same image now has a different correct label.'],
        [`Test images are ${k} times brighter (no clipping); orientation labels and class balance are unchanged. What kind of change is this?`, IN, 'Input statistics change while the label rule is the same.'],
        [`A fresh test set is drawn from the same generator and settings with seed ${seed}. What kind of change is this?`, NONE, 'A new sample from the same distribution varies by sampling error only.'],
      ]);
      return {prompt, answers: [choose(r, right, [IN, PREV, CON, NONE])],
        hint: 'Ask what changed: the inputs, how often each class occurs, or what the label means.',
        solution: `${right}. ${why} The metric alone cannot identify the cause; compare conditional rates and counts.`};
    }},
  ]);

  P.add(48, [
    {key: 'cosine-check', skill: 'Dot product, norm and cosine similarity', make(r) {
      let x, u; do { x = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)]; u = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; } while (norm(x) === 0 || norm(u) === 0 || dot(x, u) === 0);
      const d = dot(x, u), nx = norm(x), nu = norm(u), c = d / (nx * nu);
      return {prompt: Q`A method scores a feature \(x\) against a prototype \(u\) by cosine similarity. For \(x=${tup(x)}\) and \(u=${tup(u)}\), give the raw dot product, \(\|x\|_2\) and \(\cos\theta=\frac{x^Tu}{\|x\|\|u\|}\).`,
        answers: [{label: Q`\(x^Tu\)`, value: d, tol: 0}, {label: Q`\(\|x\|_2\)`, value: nx}, {label: Q`\(\cos\theta\)`, value: c}],
        hint: 'Multiply matching entries and add for the dot product. Each norm is the square root of a sum of squares.',
        solution: Q`\(x^Tu=${times(x, u)}=${d}\). \(\|x\|=\sqrt{${dot(x, x)}}\approx${fx(nx, 4)}\), \(\|u\|=\sqrt{${dot(u, u)}}\approx${fx(nu, 4)}\). \(\cos\theta=${d}/(${fx(nx, 4)}\cdot${fx(nu, 4)})\approx${fx(c, 4)}\), inside \([-1,1]\) as it must be; the raw dot product is a different score.`};
    }},
    {key: 'cosine-softmax', skill: 'Cosine classifier with a temperature', make(r) {
      let x, w0, w1, c0, c1;
      do { x = [r.int(-3, 4), r.int(-3, 4)]; w0 = [r.int(-2, 3), r.int(-2, 3)]; w1 = [r.int(-2, 3), r.int(-2, 3)]; } while (!norm(x) || !norm(w0) || !norm(w1) || Math.abs((c0 = dot(x, w0) / (norm(x) * norm(w0))) - (c1 = dot(x, w1) / (norm(x) * norm(w1)))) < 0.05);
      const tau = r.pick([0.25, 0.5, 1].filter(t => Math.abs(c1 - c0) / t <= 3)), p0 = 1 / (1 + Math.exp((c1 - c0) / tau));
      return {prompt: Q`A method classifies \(x\) by \(s_k=\cos(x,w_k)/\tau\) and a softmax over two classes. For \(x=${tup(x)}\), \(w_0=${tup(w0)}\), \(w_1=${tup(w1)}\) and \(\tau=${tau}\), give both cosines and the probability of class 0.`,
        answers: [{label: Q`\(\cos(x,w_0)\)`, value: c0}, {label: Q`\(\cos(x,w_1)\)`, value: c1}, {label: Q`\(p_0\)`, value: p0}],
        hint: Q`Normalize before the dot product. With two classes, \(p_0=1/(1+e^{s_1-s_0})\).`,
        solution: Q`\(\cos(x,w_0)\approx${fx(c0, 4)}\) and \(\cos(x,w_1)\approx${fx(c1, 4)}\). Scores \(s=${tup([fx(c0 / tau, 3), fx(c1 / tau, 3)])}\), so \(p_0=1/(1+e^{${fx((c1 - c0) / tau, 3)}})\approx${fx(p0, 4)}\). A small temperature sharpens the softmax because cosines lie in \([-1,1]\).`};
    }},
    {key: 'sgd-step', skill: 'One forward pass, derivative and SGD update', make(r) {
      let x, w, b, y, e; do { x = r.nonzero(-4, 4); w = r.nonzero(-3, 3); b = r.int(-3, 3); y = r.int(-6, 6); e = w * x + b - y; } while (e === 0);
      const eta = r.pick([0.1, 0.05, 0.01]), w1 = fx(w - eta * e * x, 4), b1 = fx(b - eta * e, 4);
      return {prompt: Q`For \(\hat y=wx+b\) and \(L=\frac12(\hat y-y)^2\) with \(x=${x}\), \(y=${y}\), \(w=${w}\), \(b=${b}\), take one SGD step with learning rate \(${eta}\). Give the new \(w\) and \(b\) (exact to two decimals).`,
        answers: [{label: Q`new \(w\)`, value: w1, tol: 0.004, rel: 0}, {label: Q`new \(b\)`, value: b1, tol: 0.004, rel: 0}],
        hint: Q`Forward pass first, then \(\partial L/\partial w=(\hat y-y)x\) and \(\partial L/\partial b=\hat y-y\); step against the gradient.`,
        solution: Q`\(\hat y=${w * x + b}\), residual \(${e}\). Gradients \(${e * x}\) and \(${e}\). Update \(w=${w}-${eta}\cdot${par(e * x)}=${w1}\), \(b=${b}-${eta}\cdot${par(e)}=${b1}\). This links a forward pass, a derivative and a training update.`};
    }},
    {key: 'test-reuse', skill: 'Multiple comparisons on one test set', make(r) {
      const a = r.pick([0.01, 0.05, 0.1]), m = r.pick([3, 4, 5, 6, 8, 10, 20]), fwer = 1 - (1 - a) ** m, bon = a / m;
      return {prompt: `You compare ${m} model variants with a baseline on the same test set, each with a significance test at level ${a}. If no variant truly differs and the tests are independent, what is the probability that at least one looks significant? What per-test level would a Bonferroni correction use (to four decimal places, or as a fraction)?`,
        answers: [{label: 'P(at least one false positive)', value: fwer}, {label: 'Bonferroni per-test level', value: bon, tol: 0.00005, rel: 0}],
        hint: Q`\(P(\text{none})=(1-\alpha)^m\). Bonferroni divides \(\alpha\) by the number of tests.`,
        solution: Q`\(1-(1-${a})^{${m}}\approx${fx(fwer, 4)}\). Bonferroni uses \(${a}/${m}=${fx(bon, 5)}\) per test. Reusing one test set for many comparisons inflates false discoveries unless the analysis accounts for it.`};
    }},
    {key: 'claim-concept', skill: 'Guarantee, empirical result or interpretation?', make(r) {
      const G = 'A mathematical guarantee under stated assumptions', EMP = 'An empirical result for a specific dataset and protocol', INT = 'An interpretation that needs a further controlled experiment';
      const a = r.int(30, 60), b = r.int(70, 95), k = r.int(2, 8), s = r.int(3, 5);
      const [claim, right, why] = r.pick([
        [`"Our detector reaches ${a}.${r.int(0, 9)} AP on the validation split of dataset D."`, EMP, 'It measures one procedure on particular data under a stated protocol.'],
        [`"For any nonzero vectors x and u, the cosine score lies in [-1, 1]."`, G, 'It follows from the Cauchy-Schwarz inequality whenever its assumptions hold.'],
        [`"Stacking ${k} affine layers without activations gives an affine map."`, G, 'Composition of affine maps is affine; it is a theorem, not a measurement.'],
        [`"Accuracy rose from ${b - 3}% to ${b}% averaged over ${s} seeds on our test set."`, EMP, 'It reports measured outcomes for a fixed protocol and test set.'],
        [`"The gain of ${k}.0 AP shows the model has learned better shape features."`, INT, 'The table shows a gain; attributing it to shape needs a targeted experiment that varies shape while holding other factors fixed.'],
        [`"Attention maps on ${s} images focus on the object, so the model ignores the background."`, INT, 'A few visualizations suggest a hypothesis; a controlled test, such as changing backgrounds, is needed.'],
      ]);
      return {prompt: `Classify this statement from a method paper: ${claim}`, answers: [choose(r, right, [G, EMP, INT])],
        hint: 'Is it derived from assumptions, measured on data, or an explanation of a measurement?',
        solution: `${right}. ${why} Defending a method means keeping these three kinds of claim separate.`};
    }},
  ]);
})();
