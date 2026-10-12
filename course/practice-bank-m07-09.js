/* Auto-checked question generators for Modules 07-09 (Lessons 25-36). See practice-engine.js for the format. */
(() => {
  'use strict';
  const P = window.CV_PRACTICE, Q = String.raw;
  const fx = (x, d = 3) => Number(x.toFixed(d));
  const sum = a => a.reduce((s, x) => s + x, 0);
  const tup = a => a.join(', ');
  const pn = x => (x < 0 ? `(${x})` : `${x}`);                                 // bracket negatives inside products
  const shift = (v, c) => (c === 0 ? `${v}` : c > 0 ? `${v}-${c}` : `${v}+${-c}`);  // v - c with tidy signs
  const sq = (v, c) => (c === 0 ? `${v}^2` : `(${shift(v, c)})^2`);
  const poly = terms => terms.reduce((s, [k, t]) => (k === 0 ? s : s + (k < 0 ? '-' : s ? '+' : '') + (Math.abs(k) === 1 && t ? '' : Math.abs(k)) + t), '') || '0';
  const mat = rows => Q`\begin{bmatrix}${rows.map(row => row.join('&')).join(Q`\\`)}\end{bmatrix}`;
  const choose = (r, label, options, right) => { const choices = r.shuffle(options); return {label, choices, correct: choices.indexOf(right)}; };
  const clip = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  P.add(25, [
    {key: 'binary-nll', skill: 'Binary NLL for one label', make(r) {
      const p = fx(r.int(1, 19) * 0.05, 2), y = r.int(0, 1), q = y ? p : fx(1 - p, 2), loss = -Math.log(q);
      return {prompt: Q`A binary classifier predicts \(P(y=1)=${p}\) for an image whose true label is \(y=${y}\). What is the negative log likelihood of that label (natural log)?`,
        answers: [{label: 'NLL', value: loss}],
        hint: Q`Use \(-y\ln p-(1-y)\ln(1-p)\). Only the term for the label that actually occurred survives.`,
        solution: y ? Q`With \(y=1\) the loss is \(-\ln p=-\ln(${p})\approx${fx(loss)}\).${p < 0.5 ? ' A low probability for the true outcome is expensive.' : ''}`
          : Q`With \(y=0\) the loss is \(-\ln(1-p)=-\ln(${q})\approx${fx(loss)}\).${p > 0.5 ? ' Confidently predicting the wrong outcome is expensive.' : ''}`};
    }},
    {key: 'batch-nll', skill: 'Summed and mean binary NLL', make(r) {
      const y = [r.int(0, 1), r.int(0, 1), r.int(0, 1)], p = y.map(() => r.int(1, 9) / 10);
      const q = y.map((v, i) => (v ? p[i] : fx(1 - p[i], 1))), total = -sum(q.map(Math.log));
      return {prompt: Q`Three independent images have labels \(y=(${tup(y)})\) and the model predicts \(P(y_i=1)=(${tup(p)})\). Give the summed NLL and the mean NLL (natural log).`,
        answers: [{label: 'Summed NLL', value: total}, {label: 'Mean NLL', value: total / 3}],
        hint: 'For each image take the probability the model gave to the label that actually occurred, then add the negative logs.',
        solution: Q`The probabilities of the observed labels are \((${tup(q)})\). Summed NLL \(=${q.map(v => Q`-\ln ${v}`).join('')}\approx${fx(total)}\); the mean divides by 3, giving \(${fx(total / 3)}\). Both reductions have the same minimizer but different gradient scales.`};
    }},
    {key: 'bernoulli-mle', skill: 'Bernoulli maximum likelihood from counts', make(r) {
      const n = r.pick([4, 5, 8, 10, 20]), k = r.int(1, n - 1), p = k / n, nll = -(k * Math.log(p) + (n - k) * Math.log(1 - p)), co = c => (c === 1 ? '' : c);
      return {prompt: Q`In ${n} independent binary observations with a shared success probability \(p\), the outcome \(y=1\) occurs ${k} time${k === 1 ? '' : 's'}. Give the maximum-likelihood estimate \(\hat p\) and the total NLL at \(\hat p\) (natural log).`,
        answers: [{label: Q`\(\hat p\)`, value: p}, {label: Q`NLL at \(\hat p\)`, value: nll}],
        hint: Q`The total NLL is \(-k\ln p-(n-k)\ln(1-p)\). Differentiate with respect to \(p\) and set the result to zero.`,
        solution: Q`\(\frac{d}{dp}\left[-${co(k)}\ln p-${co(n - k)}\ln(1-p)\right]=-\frac{${k}}{p}+\frac{${n - k}}{1-p}=0\) gives \(\hat p=\frac{${k}}{${n}}=${fx(p)}\). Then \(\text{NLL}=-${co(k)}\ln ${fx(p)}-${co(n - k)}\ln ${fx(1 - p)}\approx${fx(nll)}\).`};
    }},
    {key: 'gaussian-nll', skill: 'Gaussian NLL with a fixed variance', make(r) {
      const s2 = r.pick([0.5, 1, 2, 4]), f = [r.int(0, 9), r.int(0, 9), r.int(0, 9)];
      const res = [r.int(-2, 2), r.nonzero(-3, 3), r.int(-2, 2)], y = f.map((v, i) => v + res[i]);
      const sse = sum(res.map(v => v * v)), term = sse / (2 * s2), konst = 1.5 * Math.log(2 * Math.PI * s2), nll = konst + term;
      return {prompt: Q`Assume \(y_i=f(x_i)+\epsilon_i\) with independent \(\epsilon_i\sim\mathcal N(0,\sigma^2)\) and \(\sigma^2=${s2}\). Targets are \(y=(${tup(y)})\) and predictions are \(f(x)=(${tup(f)})\). Give the residual term \(\frac1{2\sigma^2}\sum_i(y_i-f(x_i))^2\) and the full NLL including the constant \(\frac N2\ln(2\pi\sigma^2)\) (natural log).`,
        answers: [{label: 'Residual term', value: term}, {label: 'Full NLL', value: nll}],
        hint: 'Compute the residuals, square and add them, then divide by twice the variance. The constant depends only on the variance and the number of observations.',
        solution: Q`Residuals \(y-f=(${tup(res)})\), so \(\sum_ir_i^2=${sse}\) and the residual term is \(${sse}/(2\cdot${s2})=${fx(term)}\). The constant is \(\tfrac32\ln(2\pi\cdot${s2})\approx${fx(konst)}\), so the full NLL is about \(${fx(nll)}\). Only the residual term depends on the predictions, so minimizing this NLL is minimizing squared error.`};
    }},
    {key: 'loss-from-model', skill: 'Match an observation model to its loss', make(r) {
      const BCE = Q`Binary cross entropy \(-y\ln p-(1-y)\ln(1-p)\)`, CE = Q`Categorical cross entropy \(-\ln p_y\) of the true class`;
      const SSE = 'Sum of squared residuals (up to a positive scale and a constant)', HET = Q`\(\sum_i\big[(y_i-\mu_i)^2/(2\sigma_i^2)+\ln\sigma_i\big]\), keeping the log-variance term`;
      const why = {[BCE]: Q`A Bernoulli term \(p^y(1-p)^{1-y}\) has negative log \(-y\ln p-(1-y)\ln(1-p)\).`,
        [CE]: Q`A categorical model assigns probability \(p_y\) to the observed class, so each example contributes \(-\ln p_y\).`,
        [SSE]: Q`With fixed \(\sigma^2\) the Gaussian NLL is \(\frac1{2\sigma^2}\sum_ir_i^2\) plus a constant, so only the squared residuals matter.`,
        [HET]: Q`When \(\sigma_i\) is predicted, \(\ln\sigma_i\) depends on the parameters and cannot be dropped; without it the model could inflate \(\sigma_i\) to hide every residual.`};
      const cases = [
        [Q`whether each image contains a pedestrian, with \(y\sim\text{Bernoulli}(p_\theta(x))\)`, BCE],
        [Q`whether each pixel is foreground, with independent \(y\sim\text{Bernoulli}(p_\theta(x))\)`, BCE],
        [`which one of ${r.pick([5, 10, 20])} mutually exclusive classes an image shows, using softmax probabilities`, CE],
        [`a depth value corrupted by independent Gaussian noise of known, fixed variance ${r.pick([0.5, 1, 2])}`, SSE],
        ['a keypoint coordinate corrupted by independent Gaussian noise with one shared, fixed variance', SSE],
        [Q`a depth value, outputting both a Gaussian mean \(\mu_i\) and a noise standard deviation \(\sigma_i\) per pixel`, HET],
      ];
      const [task, right] = r.pick(cases);
      return {prompt: `A network predicts ${task}. Which loss is the negative log likelihood of that observation model?`,
        answers: [choose(r, 'Loss', [BCE, CE, SSE, HET], right)],
        hint: 'Write the probability (or density) of one observed target under the model, then take its negative logarithm.',
        solution: `${why[right]} State the label type, noise model and independence assumption before choosing a loss.`};
    }},
  ]);

  P.add(26, [
    {key: 'ridge-lambda', skill: 'Ridge coefficient from noise and prior variances', make(r) {
      const [s2, t2] = r.pick([[1, 4], [2, 4], [1, 1], [2, 1], [4, 1], [1, 2], [3, 6], [0.5, 2], [4, 2], [2, 8]]), lam = s2 / t2, N = r.pick([4, 5, 10, 20]);
      return {prompt: Q`Observation noise is Gaussian with variance \(\sigma^2=${s2}\), and every weight has prior \(\mathcal N(0,\tau^2)\) with \(\tau^2=${t2}\). Multiplying the negative log posterior by \(2\sigma^2\) gives \(\sum_ir_i^2+\lambda\|\theta\|^2\). Give \(\lambda\), then the penalty coefficient that keeps the same optimum when the data term becomes the mean \(\frac1{${N}}\sum_ir_i^2\) over ${N} examples. Fractions such as 1/40 are accepted.`,
        answers: [{label: Q`\(\lambda\)`, value: lam}, {label: 'Coefficient with the mean data loss', value: lam / N, tol: 1e-4}],
        hint: Q`The negative log prior is \(\|\theta\|^2/(2\tau^2)\) and the data term is \(\sum_ir_i^2/(2\sigma^2)\). Multiply both by \(2\sigma^2\).`,
        solution: Q`\(2\sigma^2\cdot\frac{\|\theta\|^2}{2\tau^2}=\frac{\sigma^2}{\tau^2}\|\theta\|^2\), so \(\lambda=${s2}/${t2}=${lam}\). Dividing the whole objective by ${N} gives \(\frac1{${N}}\sum_ir_i^2+\frac{${lam}}{${N}}\|\theta\|^2\), so the coefficient becomes \(${fx(lam / N, 5)}\). Keeping ${lam} with a mean data loss would make the penalty ${N} times stronger relative to the data.`};
    }},
    {key: 'scalar-map', skill: 'MLE versus MAP with a Gaussian prior', make(r) {
      const n = r.int(1, 4), s2 = r.pick([1, 2, 4]), t2 = r.pick([0.5, 1, 2, 4]);
      let y; do { y = Array.from({length: n}, () => r.int(-3, 9)); } while (sum(y) === 0);
      const S = sum(y), lam = s2 / t2, mle = S / n, map = S / (n + lam);
      return {prompt: Q`Model \(y_i=\theta+\epsilon_i\) with independent \(\epsilon_i\sim\mathcal N(0,${s2})\) and prior \(\theta\sim\mathcal N(0,${t2})\). ${n === 1 ? Q`The single observation is \(y=${y[0]}\).` : Q`The observations are \(y=(${tup(y)})\).`} Give the maximum-likelihood estimate and the MAP estimate of \(\theta\).`,
        answers: [{label: 'MLE', value: mle}, {label: 'MAP', value: map}],
        hint: Q`Write the negative log posterior \(\frac1{2\sigma^2}\sum_i(y_i-\theta)^2+\frac{\theta^2}{2\tau^2}\) and set its derivative to zero.`,
        solution: Q`Without the prior the minimizer is the mean, \(${S}/${n}=${fx(mle)}\). With it, \(-\frac1{${s2}}\sum_i(y_i-\theta)+\frac{\theta}{${t2}}=0\), so \(\theta\,(n+\sigma^2/\tau^2)=\sum_iy_i\). Here \(\sigma^2/\tau^2=${lam}\), so \(\hat\theta_{\rm MAP}=\frac{${S}}{${fx(n + lam)}}\approx${fx(map)}\). The prior pulls the estimate toward 0.`};
    }},
    {key: 'prior-penalty', skill: 'Negative log Gaussian prior as a penalty', make(r) {
      const t2 = r.pick([0.5, 1, 2, 4]), th = [r.nonzero(-3, 3), r.nonzero(-3, 3), r.nonzero(-3, 3)];
      const ss = sum(th.map(v => v * v)), pen = ss / (2 * t2), grad = th.map(v => v / t2);
      return {prompt: Q`Each weight has an independent prior \(\theta_j\sim\mathcal N(0,${t2})\). For \(\theta=(${tup(th)})\), give the part of \(-\ln p(\theta)\) that depends on \(\theta\) (drop the normalizing constant), and its gradient with respect to \(\theta\).`,
        answers: [{label: 'Penalty value', value: pen}, {label: Q`\(\nabla_\theta\)`, vector: grad}],
        hint: Q`A zero-mean Gaussian density is proportional to \(\exp(-\theta_j^2/(2\tau^2))\). Take the negative log of the product over coordinates.`,
        solution: Q`\(-\ln p(\theta)=\frac{\|\theta\|^2}{2\tau^2}+\text{const}\). Here \(\|\theta\|^2=${ss}\), so the penalty is \(${ss}/(2\cdot${t2})=${fx(pen)}\). Its gradient is \(\theta/\tau^2=(${tup(grad.map(v => fx(v)))})\): weight decay pulls each weight toward 0 in proportion to its size.`};
    }},
    {key: 'shrinkage-direction', skill: 'How variances and data change MAP shrinkage', make(r) {
      const s2 = r.pick([1, 2, 4]), t2 = r.pick([1, 2, 4]), n = r.pick([2, 4, 5, 10]), lam = s2 / t2;
      const UP = Q`\(\lambda\) increases, so the MAP estimate moves toward 0`, DOWN = Q`\(\lambda\) decreases, so the MAP estimate moves toward \(\bar y\)`;
      const MOVE = Q`\(\lambda\) is unchanged, but the MAP estimate moves toward \(\bar y\)`, STAY = Q`\(\lambda\) is unchanged and the MAP estimate does not move`;
      const changes = [
        [Q`the prior variance is reduced to \(\tau^2=${t2 / 4}\)`, s2, t2 / 4, n, UP],
        [Q`the prior variance is increased to \(\tau^2=${t2 * 4}\)`, s2, t2 * 4, n, DOWN],
        [Q`the noise variance is increased to \(\sigma^2=${s2 * 4}\)`, s2 * 4, t2, n, UP],
        [Q`the noise variance is reduced to \(\sigma^2=${s2 / 4}\)`, s2 / 4, t2, n, DOWN],
        [`${3 * n} observations with the same sample mean are used instead of ${n}`, s2, t2, 3 * n, MOVE],
      ];
      const [text, s2b, t2b, nb, right] = r.pick(changes), lamb = s2b / t2b;
      return {prompt: Q`For \(y_i=\theta+\epsilon_i\) with \(\epsilon_i\sim\mathcal N(0,\sigma^2)\) and prior \(\theta\sim\mathcal N(0,\tau^2)\), the MAP estimate is \(\hat\theta=\bar y\,\frac{n}{n+\lambda}\) with \(\lambda=\sigma^2/\tau^2\). Currently \(\sigma^2=${s2}\), \(\tau^2=${t2}\) and \(n=${n}\). What happens if ${text}?`,
        answers: [choose(r, 'Effect', [UP, DOWN, MOVE, STAY], right)],
        hint: Q`Recompute \(\lambda=\sigma^2/\tau^2\) and the shrinkage factor \(n/(n+\lambda)\) before and after the change.`,
        solution: Q`Before: \(\lambda=${fx(lam, 4)}\) and \(\frac{n}{n+\lambda}=${fx(n / (n + lam), 4)}\). After: \(\lambda=${fx(lamb, 4)}\) and \(\frac{n}{n+\lambda}=${fx(nb / (nb + lamb), 4)}\). A factor closer to 1 means less shrinkage toward the prior mean 0: a tighter prior or noisier data shrink more, while more data let the observations dominate.`};
    }},
  ]);

  P.add(27, [
    {key: 'softmax-two', skill: 'Softmax of two class scores', make(r) {
      const a = r.int(-2, 2), b = a + r.nonzero(-3, 3), p = 1 / (1 + Math.exp(a - b));
      return {prompt: Q`A two-class model gives scores \(z=(${a}, ${b})\). What softmax probability does it assign to class 1 (the second class)?`,
        answers: [{label: Q`\(p_1\)`, value: p}],
        hint: Q`Subtract the larger score first, exponentiate, then divide by the sum. With two classes \(p_1=1/(1+e^{z_0-z_1})\).`,
        solution: Q`\(p_1=\frac{e^{${b}}}{e^{${a}}+e^{${b}}}=\frac{1}{1+e^{${a - b}}}\approx${fx(p)}\).`};
    }},
    {key: 'cross-entropy', skill: 'Cross entropy from a true-class probability', make(r) {
      const p = r.pick([0.9, 0.8, 0.75, 0.5, 0.4, 0.25, 0.2, 0.1, 0.05]);
      return {prompt: Q`A softmax classifier assigns probability \(${p}\) to the correct class. What is the cross-entropy loss (natural log)?`,
        answers: [{label: 'Loss', value: -Math.log(p)}],
        hint: 'With a one-hot target, only the true-class term remains: the negative log of its probability.',
        solution: Q`\(L=-\ln(${p})\approx${fx(-Math.log(p))}\). Smaller true-class probabilities give larger losses.`};
    }},
    {key: 'score-gradient', skill: 'Gradient of cross entropy with respect to scores', make(r) {
      const raw = r.distinct(3, 1, 8), s = raw.reduce((x, y) => x + y, 0), p = raw.map(x => fx(x / s, 2));
      p[2] = fx(1 - p[0] - p[1], 2);
      const t = r.int(0, 2), g = p.map((x, i) => fx(x - (i === t ? 1 : 0), 2));
      return {prompt: Q`Softmax probabilities are \(p=(${p.join(', ')})\) and the true class is \(${t}\) (zero-based). Enter the gradient \(\partial L/\partial z\) of the cross-entropy loss.`,
        answers: [{label: Q`\(\nabla_z L\)`, vector: g}],
        hint: 'Subtract the one-hot target from the probabilities.',
        solution: Q`\(\nabla_z L=p-y=(${p.join(', ')})-(${[0, 1, 2].map(i => i === t ? 1 : 0).join(', ')})=(${g.join(', ')})\). The entries sum to zero.`};
    }},
    {key: 'batch-shapes', skill: 'Shapes of weight and bias gradients', make(r) {
      const n = r.pick([8, 16, 32, 64]), d = r.pick([3, 4, 10, 128]), c = r.pick([2, 3, 5, 10]);
      return {prompt: Q`A linear softmax layer computes \(Z=XW+b\) for \(X\) of shape \((${n}, ${d})\) and \(${c}\) classes. Give the shapes of \(dW\) and \(db\).`,
        answers: [{label: Q`shape of \(dW\)`, vector: [d, c], tol: 0}, {label: Q`length of \(db\)`, value: c, tol: 0}],
        hint: 'A gradient has the same shape as the parameter it belongs to.',
        solution: Q`\(W\) maps ${d} features to ${c} scores, so \(dW=X^TG\) has shape \((${d}, ${c})\). The bias has one entry per class, so \(db\) has length ${c}; it sums \(G\) over the ${n} rows.`};
    }},
  ]);

  P.add(28, [
    {key: 'confidence-gap', skill: 'Accuracy versus stated confidence', make(r) {
      const n = r.pick([10, 20, 25, 40, 50]), conf = r.pick([0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]), k = r.int(Math.ceil(0.4 * n), n), acc = k / n, gap = conf - acc;
      return {prompt: Q`A model gives top-class confidence \(${conf}\) on each of ${n} test images and is correct on ${k} of them. Give the empirical accuracy and the gap (confidence minus accuracy).`,
        answers: [{label: 'Accuracy', value: acc}, {label: 'Confidence minus accuracy', value: gap}],
        hint: 'Accuracy is the fraction of correct predictions. A calibrated group would be correct about as often as its stated confidence.',
        solution: Q`Accuracy \(=${k}/${n}=${fx(acc)}\) and the gap is \(${conf}-${fx(acc)}=${fx(gap)}\), so this group looks ${gap > 1e-9 ? 'overconfident' : gap < -1e-9 ? 'underconfident' : 'calibrated'}. With only ${n} predictions the estimate itself is uncertain.`};
    }},
    {key: 'brier-score', skill: 'Brier score of probability predictions', make(r) {
      const y = r.shuffle([1, 0, r.int(0, 1), r.int(0, 1)]), p = y.map(() => r.int(1, 9) / 10);
      const se = p.map((v, i) => (v - y[i]) ** 2), brier = sum(se) / 4, base = sum(y) / 4, baseBrier = base * (1 - base);
      return {prompt: Q`Four predictions \(p_i=P(y_i=1)\) are \((${tup(p)})\) and the labels are \(y=(${tup(y)})\). Give the Brier score \(\frac14\sum_i(p_i-y_i)^2\), and the Brier score of always predicting the observed positive fraction \(\bar y\).`,
        answers: [{label: 'Model Brier score', value: brier}, {label: Q`Brier score of predicting \(\bar y\)`, value: baseBrier}],
        hint: Q`Square each prediction-minus-label difference and average. For the constant prediction, each positive contributes \((1-\bar y)^2\) and each negative \(\bar y^2\).`,
        solution: Q`Squared errors \((${tup(se.map(v => fx(v, 2)))})\) average to \(${fx(brier, 4)}\). With \(\bar y=${base}\) the constant predictor scores \(\bar y(1-\bar y)=${fx(baseBrier, 4)}\), so the model ${brier < baseBrier ? 'beats' : 'does not beat'} this baseline. Accuracy alone would ignore how far each probability is from its label.`};
    }},
    {key: 'ece-two-bins', skill: 'Expected calibration error from two bins', make(r) {
      const n1 = r.pick([10, 20, 40, 50]), n2 = r.pick([10, 20, 40, 50]), c1 = r.pick([0.55, 0.6, 0.65, 0.7]), c2 = r.pick([0.85, 0.9, 0.95]);
      const k1 = r.int(Math.round(0.3 * n1), n1), k2 = r.int(Math.round(0.5 * n2), n2), a1 = k1 / n1, a2 = k2 / n2, N = n1 + n2;
      const g1 = Math.abs(a1 - c1), g2 = Math.abs(a2 - c2), ece = (n1 * g1 + n2 * g2) / N;
      return {prompt: Q`Predictions are grouped into two confidence bins. Bin 1 has ${n1} predictions with average confidence ${c1}, of which ${k1} are correct. Bin 2 has ${n2} predictions with average confidence ${c2}, of which ${k2} are correct. Compute \(\mathrm{ECE}=\sum_b\frac{n_b}{N}\,|\mathrm{acc}_b-\mathrm{conf}_b|\).`,
        answers: [{label: 'ECE', value: ece}],
        hint: 'Find each bin accuracy, take its absolute gap from the bin confidence, then weight each gap by the fraction of predictions in that bin.',
        solution: Q`Accuracies are \(${k1}/${n1}=${fx(a1)}\) and \(${k2}/${n2}=${fx(a2)}\), with gaps \(${fx(g1)}\) and \(${fx(g2)}\). \(\mathrm{ECE}=\frac{${n1}}{${N}}(${fx(g1)})+\frac{${n2}}{${N}}(${fx(g2)})\approx${fx(ece, 4)}\). Small bins make each accuracy noisy, so report the counts too.`};
    }},
    {key: 'bias-variance', skill: 'Bias and variance from repeated training runs', make(r) {
      const f0 = r.int(2, 8), b = r.int(-2, 2), s2 = r.pick([0.25, 0.5, 1]), preds = Array.from({length: 4}, () => f0 + b + r.int(-2, 2));
      const m = sum(preds) / 4, bias = m - f0, v = sum(preds.map(x => (x - m) ** 2)) / 4, err = bias * bias + v + s2;
      return {prompt: Q`The same model is trained on four independent training sets. Its predictions at a test input are \((${tup(preds)})\), the true function value there is ${f0}, and the label noise variance is \(\sigma^2=${s2}\). Give the squared bias, the variance (divide by 4), and the expected squared test error \(\text{bias}^2+\text{variance}+\sigma^2\).`,
        answers: [{label: Q`\(\text{bias}^2\)`, value: bias * bias}, {label: 'Variance', value: v}, {label: 'Expected squared error', value: err}],
        hint: 'Average the four predictions first. Bias compares that average with the true value; variance measures spread around the average.',
        solution: Q`Mean prediction \(${fx(m, 4)}\), so bias \(=${fx(m, 4)}-${f0}=${fx(bias, 4)}\) and \(\text{bias}^2=${fx(bias * bias, 4)}\). Variance \(=\frac14\sum_j(\hat f_j-${fx(m, 4)})^2=${fx(v, 4)}\). Expected error \(=${fx(bias * bias, 4)}+${fx(v, 4)}+${s2}=${fx(err, 4)}\). The noise term cannot be reduced by any model.`};
    }},
    {key: 'split-role', skill: 'Which split does each job', make(r) {
      const TR = 'Training split', VA = 'Validation split', TE = 'Test split';
      const jobs = [
        ['fitting the network weights', TR, 'Parameters are fitted on training data.'],
        ['computing the mean and standard deviation used to normalize the inputs', TR, 'Preprocessing statistics are part of fitting; computing them on held-out data leaks information into training.'],
        ['choosing the learning rate from several candidates', VA, 'Hyperparameters are selected on validation data so the test set stays untouched.'],
        ['choosing the epoch at which to stop training', VA, 'Early stopping is a model-selection decision, so it belongs to validation data.'],
        ['fitting a temperature that calibrates the predicted probabilities', VA, 'A calibration parameter is chosen on held-out validation data, never on the final test set.'],
        ['choosing the decision threshold of a detector', VA, 'A threshold is a tuning choice, so it is picked on validation data.'],
        ['estimating the accuracy of the final, fixed procedure for the report', TE, 'The test set is used once, after every choice has been fixed.'],
      ];
      const [job, right, why] = r.pick(jobs);
      return {prompt: `In a train / validation / test protocol, which split should be used for ${job}?`,
        answers: [choose(r, 'Split', [TR, VA, TE], right)],
        hint: 'Training fits parameters and preprocessing, validation makes choices, and test evaluates the fixed result once.',
        solution: `${right}. ${why} Repeatedly adjusting choices based on test results would turn the test set into another validation set.`};
    }},
  ]);

  P.add(29, [
    {key: 'gd-two-steps', skill: 'Two gradient-descent steps on a quadratic', make(r) {
      const c = r.int(-3, 5), w0 = c + r.nonzero(-5, 5), a = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.75]);
      const g0 = 2 * (w0 - c), w1 = fx(w0 - a * g0, 6), g1 = fx(2 * (w1 - c), 6), w2 = fx(w1 - a * g1, 6);
      return {prompt: Q`Minimize \(L(w)=${sq('w', c)}\) by gradient descent from \(w_0=${w0}\) with learning rate \(\alpha=${a}\). Give \(w_1\) and \(w_2\).`,
        answers: [{label: Q`\(w_1\)`, value: w1}, {label: Q`\(w_2\)`, value: w2}],
        hint: Q`\(L'(w)=2(${shift('w', c)})\). Evaluate it at the current weight, then step: \(w_{t+1}=w_t-\alpha L'(w_t)\).`,
        solution: Q`\(L'(${w0})=2(${shift(w0, c)})=${g0}\), so \(w_1=${w0}-${a}\cdot${pn(g0)}=${w1}\). Then \(L'(${w1})=${g1}\) and \(w_2=${w1}-${a}\cdot${pn(g1)}=${w2}\). Each step multiplies the error \(${shift('w', c)}\) by \(1-2\alpha=${fx(1 - 2 * a, 4)}\).`};
    }},
    {key: 'error-multiplier', skill: 'Error multiplier and step-size behaviour', make(r) {
      const a = r.pick([1, 2, 4, 5, 8, 10]), c = r.int(-3, 5), kind = r.pick([0, 0, 1, 1, 2, 3, 3]);
      const target = [r.pick([0.2, 0.5, 0.6, 0.8]), r.pick([-0.2, -0.5, -0.6, -0.8]), -1, r.pick([-1.5, -2, -3])][kind];
      const al = fx((1 - target) / a, 6), m = fx(1 - al * a, 6);
      const B = ['Errors shrink without changing sign', 'Errors shrink while alternating in sign', 'Errors alternate in sign without shrinking', 'Errors grow in size, so the iteration diverges'];
      const why = [Q`\(0<m<1\): the error keeps its sign and shrinks.`, Q`\(-1<m<0\): the error flips sign each step while shrinking.`, Q`\(m=-1\): the iterate bounces between two points forever.`, Q`\(|m|>1\): the step exceeds the limit \(2/a=${fx(2 / a, 4)}\) and the error grows.`][kind];
      return {prompt: Q`Gradient descent with \(\alpha=${al}\) is applied to \(L(w)=\tfrac{a}{2}${sq('w', c)}\) with curvature \(a=${a}\). The error \(e_t=${shift('w_t', c)}\) obeys \(e_{t+1}=m\,e_t\). Give \(m\) and describe what happens to the error.`,
        answers: [{label: Q`\(m\)`, value: m}, choose(r, 'Behaviour', B, B[kind])],
        hint: Q`The update is \(w_{t+1}=w_t-\alpha a(${shift('w_t', c)})\). Subtract the minimizer from both sides.`,
        solution: Q`\(e_{t+1}=e_t-\alpha a\,e_t=(1-\alpha a)e_t\), so \(m=1-${al}\cdot${a}=${m}\). ${why}`};
    }},
    {key: 'stability-limit', skill: 'Largest stable learning rate from Hessian eigenvalues', make(r) {
      const q = r.nonzero(-3, 3), p = Math.abs(q) + r.int(1, 4), lmax = p + Math.abs(q), lmin = p - Math.abs(q), amax = 2 / lmax, slow = 1 - lmin / lmax;
      return {prompt: Q`For \(L(\theta)=\tfrac12\theta^TH\theta\) with \(H=${mat([[p, q], [q, p]])}\), gradient descent multiplies the error along eigenvector \(i\) by \(1-\alpha\lambda_i\). Give the bound \(\alpha_{\max}\) such that convergence from every start needs \(0<\alpha<\alpha_{\max}\), and the multiplier along the flatter eigenvector when \(\alpha=1/\lambda_{\max}\).`,
        answers: [{label: Q`\(\alpha_{\max}\)`, value: amax}, {label: 'Flat-direction multiplier', value: slow}],
        hint: Q`Try the vectors \((1,1)\) and \((1,-1)\): they are eigenvectors of this symmetric pattern. Then require \(|1-\alpha\lambda_i|<1\) for both.`,
        solution: Q`\(H(1,1)^T=${p + q}\,(1,1)^T\) and \(H(1,-1)^T=${p - q}\,(1,-1)^T\), so \(\lambda_{\max}=${lmax}\) and \(\lambda_{\min}=${lmin}\). Both conditions hold only for \(\alpha<2/${lmax}=${fx(amax, 4)}\). At \(\alpha=1/${lmax}\) the flatter direction has multiplier \(1-${lmin}/${lmax}=${fx(slow, 4)}\): the steep direction limits the step, so the flat one converges slowly.`};
    }},
    {key: 'gd-vector-step', skill: 'One gradient step in two dimensions', make(r) {
      const a = r.pick([1, 2, 3, 5]), b = r.pick([1, 2, 4]), c1 = r.int(-3, 3), c2 = r.int(-3, 3), al = r.pick([0.05, 0.1, 0.2, 0.25]);
      let x0 = r.int(-3, 4); const y0 = r.int(-3, 4); if (x0 === c1 && y0 === c2) x0 = c1 + 1;
      const g = [2 * a * (x0 - c1), 2 * b * (y0 - c2)], next = [fx(x0 - al * g[0], 6), fx(y0 - al * g[1], 6)];
      return {prompt: Q`Take one gradient-descent step on \(L(x,y)=${a === 1 ? '' : a}${sq('x', c1)}+${b === 1 ? '' : b}${sq('y', c2)}\) from \((x_0,y_0)=(${x0}, ${y0})\) with \(\alpha=${al}\). Give the gradient at the start and the new point.`,
        answers: [{label: Q`\(\nabla L(x_0,y_0)\)`, vector: g, tol: 0}, {label: Q`\((x_1,y_1)\)`, vector: next}],
        hint: 'Differentiate each squared term with respect to its own variable, evaluate at the starting point, then subtract the learning rate times the gradient.',
        solution: Q`\(\nabla L=\big(${2 * a}(${shift('x', c1)}),\ ${2 * b}(${shift('y', c2)})\big)=(${tup(g)})\) at the start. Then \((x_1,y_1)=(${x0}, ${y0})-${al}\,(${tup(g)})=(${tup(next)})\). The coordinate with larger curvature moves further for the same distance from its minimum.`};
    }},
  ]);

  P.add(30, [
    {key: 'epoch-updates', skill: 'Updates per epoch and in total', make(r) {
      const B = r.pick([16, 32, 64, 128, 256]), N = r.int(30, 900) * 10 + r.int(0, 9), drop = r.bool(), E = r.int(2, 30);
      const per = drop ? Math.floor(N / B) : Math.ceil(N / B), rem = N % B;
      const how = rem === 0 ? Q`\(${B}\) divides ${N} exactly, so there are \(${per}\)` : drop ? Q`Dropping the last ${rem} examples leaves \(\lfloor ${N}/${B}\rfloor=${per}\)` : Q`The last ${rem} examples form one smaller batch, so there are \(\lceil ${N}/${B}\rceil=${per}\)`;
      return {prompt: `A training set has ${N} examples and the batch size is ${B}. The final incomplete batch is ${drop ? 'dropped' : 'kept as a smaller batch'}. How many updates make one epoch, and how many updates are taken in ${E} epochs?`,
        answers: [{label: 'Updates per epoch', value: per, tol: 0}, {label: `Updates in ${E} epochs`, value: per * E, tol: 0}],
        hint: 'Divide the number of examples by the batch size, then decide whether the remainder counts as an extra batch.',
        solution: Q`\(${N}/${B}\approx${fx(N / B, 3)}\). ${how} updates per epoch, and \(${per}\times${E}=${per * E}\) updates in total. Schedules quoted in epochs and in updates are different units.`};
    }},
    {key: 'momentum-steps', skill: 'Two momentum updates', make(r) {
      const be = r.pick([0.5, 0.8, 0.9]), al = r.pick([0.1, 0.05, 0.5]), w0 = r.int(-3, 3), g0 = r.nonzero(-5, 5), g1 = r.nonzero(-5, 5);
      const v1 = g0, v2 = fx(be * v1 + g1, 6), w1 = fx(w0 - al * v1, 6), w2 = fx(w1 - al * v2, 6);
      return {prompt: Q`Momentum uses \(v_{t+1}=${be}\,v_t+g_t\) and \(w_{t+1}=w_t-${al}\,v_{t+1}\), starting from \(v_0=0\) and \(w_0=${w0}\). The first two mini-batch gradients are \(g_0=${g0}\) and \(g_1=${g1}\). Give the velocities \((v_1,v_2)\) and the weight \(w_2\).`,
        answers: [{label: Q`\((v_1,v_2)\)`, vector: [v1, v2]}, {label: Q`\(w_2\)`, value: w2}],
        hint: Q`Update the velocity first, then move the weight using the new velocity. With \(v_0=0\), \(v_1\) is just \(g_0\).`,
        solution: Q`\(v_1=${be}\cdot0+${pn(g0)}=${v1}\) and \(w_1=${w0}-${al}\cdot${pn(v1)}=${w1}\). Then \(v_2=${be}\cdot${pn(v1)}+${pn(g1)}=${v2}\) and \(w_2=${w1}-${al}\cdot${pn(v2)}=${w2}\).${v2 * g1 < 0 ? ' The velocity still points against the newest gradient: the remembered history outweighed it.' : ''}`};
    }},
    {key: 'adam-two-steps', skill: 'Adam bias-corrected moments after two steps', make(r) {
      const b1 = r.pick([0.8, 0.9]), b2 = r.pick([0.9, 0.99, 0.999]), g1 = r.nonzero(-4, 4), g2 = r.nonzero(-4, 4);
      const m1 = (1 - b1) * g1, m2 = b1 * m1 + (1 - b1) * g2, v1 = (1 - b2) * g1 * g1, v2 = b2 * v1 + (1 - b2) * g2 * g2;
      const mh = m2 / (1 - b1 * b1), vh = v2 / (1 - b2 * b2), step = -0.1 * mh / Math.sqrt(vh);
      return {prompt: Q`Adam starts from \(m_0=v_0=0\) with \(\beta_1=${b1}\), \(\beta_2=${b2}\), \(\alpha=0.1\) and negligible \(\epsilon\). The first two scalar gradients are \(g_1=${g1}\) and \(g_2=${g2}\). Give the bias-corrected moments \(\hat m_2\) and \(\hat v_2\), and the second update \(\theta_2-\theta_1\) to three decimals.`,
        answers: [{label: Q`\(\hat m_2\)`, value: mh}, {label: Q`\(\hat v_2\)`, value: vh}, {label: Q`\(\theta_2-\theta_1\)`, value: step, tol: 0.001}],
        hint: Q`Apply \(m_t=\beta_1m_{t-1}+(1-\beta_1)g_t\) and \(v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2\) twice, then divide by \(1-\beta_1^2\) and \(1-\beta_2^2\).`,
        solution: Q`\(m_1=${fx(m1, 4)}\), \(m_2=${b1}\cdot${pn(fx(m1, 4))}+${fx(1 - b1, 2)}\cdot${pn(g2)}=${fx(m2, 4)}\), so \(\hat m_2=${fx(m2, 4)}/${fx(1 - b1 * b1, 4)}=${fx(mh, 4)}\). \(v_1=${fx(v1, 5)}\), \(v_2=${fx(v2, 5)}\), so \(\hat v_2=${fx(v2, 5)}/${fx(1 - b2 * b2, 6)}=${fx(vh, 4)}\). The update is \(-0.1\cdot${pn(fx(mh, 4))}/\sqrt{${fx(vh, 4)}}\approx${fx(step, 4)}\). Equivalently \(\hat m_2=\frac{\beta_1g_1+g_2}{1+\beta_1}\) and \(\hat v_2=\frac{\beta_2g_1^2+g_2^2}{1+\beta_2}\).`};
    }},
    {key: 'minibatch-gradient', skill: 'Mini-batch gradient as an estimate', make(r) {
      const y = Array.from({length: 6}, () => r.int(0, 9)), w = r.int(0, 9), idx = r.distinct(r.pick([2, 3]), 0, 5).sort((a, b) => a - b);
      const ybar = sum(y) / 6, sub = idx.map(i => y[i]), bbar = sum(sub) / idx.length, full = 2 * (w - ybar), batch = 2 * (w - bbar);
      return {prompt: Q`The objective is \(L(w)=\frac16\sum_{i=0}^{5}(w-y_i)^2\) with \(y=(${tup(y)})\), at \(w=${w}\). Give the full-data gradient \(L'(w)\) and the mini-batch estimate that averages the per-example gradients over the zero-based indices \(${tup(idx)}\) only.`,
        answers: [{label: 'Full gradient', value: full}, {label: 'Mini-batch estimate', value: batch}],
        hint: Q`The per-example gradient is \(2(w-y_i)\). Average it over all six examples, then over the batch only.`,
        solution: Q`Full: \(2(w-\bar y)=2(${w}-${fx(ybar, 4)})=${fx(full, 4)}\). The batch values \((${tup(sub)})\) have mean ${fx(bbar, 4)}, so the estimate is \(2(${w}-${fx(bbar, 4)})=${fx(batch, 4)}\). Averaged over uniformly chosen batches, the estimate equals the full gradient; any single batch can differ.`};
    }},
  ]);

  P.add(31, [
    {key: 'hessian-convexity', skill: 'Classify convexity from a constant Hessian', make(r) {
      const kind = r.int(0, 2); let a, b, c, u = 0, v = 0;
      if (kind === 0) { a = r.int(1, 4); c = r.int(1, 4); const lim = Math.ceil(2 * Math.sqrt(a * c)) - 1; b = r.int(-lim, lim); }
      else if (kind === 1) { u = r.int(1, 2); v = r.nonzero(-3, 3); a = u * u; b = 2 * u * v; c = v * v; }
      else if (r.bool()) { a = r.int(1, 3); c = r.int(1, 3); b = r.sign() * (Math.floor(2 * Math.sqrt(a * c)) + r.int(1, 2)); }
      else { a = r.pick([-2, -1, 1, 2]); c = a > 0 ? -r.int(1, 3) : r.int(1, 3); b = r.int(-2, 2); }
      const det = 4 * a * c - b * b, C = ['Strictly convex', 'Convex but not strictly convex', 'Not convex'];
      const why = [Q`Both diagonal entries and the determinant are positive, so \(H\) is positive definite everywhere and \(f\) is strictly convex.`,
        Q`Here \(f=(${poly([[u, 'x'], [v, 'y']])})^2\). The determinant is 0 with a nonnegative diagonal, so \(H\) is only positive semidefinite: \(f\) is convex but flat along \((${v}, ${-u})\), so not strictly convex.`,
        Q`${det < 0 ? 'A negative determinant means the eigenvalues have opposite signs' : 'A negative diagonal entry means some direction has negative curvature'}, so \(f\) curves downward along some line: it is not convex (the origin is a saddle).`][kind];
      return {prompt: Q`Let \(f(x,y)=${poly([[a, 'x^2'], [b, 'xy'], [c, 'y^2']])}\), whose Hessian \(H\) is constant. Give \(\det H\) and classify \(f\) on \(\mathbb R^2\).`,
        answers: [{label: Q`\(\det H\)`, value: det, tol: 0}, choose(r, 'Classification', C, C[kind])],
        hint: Q`\(H=\begin{bmatrix}f_{xx}&f_{xy}\\f_{xy}&f_{yy}\end{bmatrix}\). A symmetric 2-by-2 matrix is positive definite when \(H_{11}>0\) and \(\det H>0\), and positive semidefinite when both diagonal entries and the determinant are at least 0.`,
        solution: Q`\(H=${mat([[2 * a, b], [b, 2 * c]])}\) and \(\det H=${2 * a}\cdot${pn(2 * c)}-${pn(b)}^2=${det}\). ${why}`};
    }},
    {key: 'equality-constraint', skill: 'Closest point on a line by Lagrange multipliers', make(r) {
      const a = r.nonzero(-3, 3), b = r.nonzero(-3, 3), c = r.nonzero(-10, 10), s = a * a + b * b, t = c / s;
      const pt = [fx(a * t, 6), fx(b * t, 6)], val = c * c / s, lam = -2 * t, line = poly([[a, 'x'], [b, 'y']]);
      return {prompt: Q`Minimize \(x^2+y^2\) subject to \(${line}=${c}\). With \(\mathcal L=x^2+y^2+\lambda(${line}${c < 0 ? '+' + -c : '-' + c})\), give the optimal point, the minimum value and \(\lambda\).`,
        answers: [{label: Q`\((x,y)\)`, vector: pt}, {label: 'Minimum value', value: val}, {label: Q`\(\lambda\)`, value: lam}],
        hint: Q`Set \(\partial\mathcal L/\partial x=0\) and \(\partial\mathcal L/\partial y=0\) to write \(x\) and \(y\) in terms of \(\lambda\), then substitute into the constraint.`,
        solution: Q`Stationarity gives \((2x,2y)=-\lambda(${a}, ${b})\), so the optimum is a multiple \(t\,(${a}, ${b})\) of the line's normal, with \(t=-\lambda/2\). The constraint gives \(${s}t=${c}\), so \(t=${fx(t, 4)}\), \((x,y)=(${tup(pt.map(z => fx(z, 4)))})\), the minimum is \(${pn(c)}^2/${s}=${fx(val, 4)}\) and \(\lambda=-2t=${fx(lam, 4)}\). Geometrically this is the closest point of the line to the origin.`};
    }},
    {key: 'interval-minimum', skill: 'Minimize a quadratic on an interval', make(r) {
      const lo = r.int(-3, 3), hi = lo + r.int(1, 4), c = r.bool(0.75) ? (r.bool() ? hi + r.int(1, 4) : lo - r.int(1, 4)) : r.int(lo, hi);
      const w = clip(c, lo, hi), L = (w - c) ** 2, d = 2 * (w - c);
      return {prompt: Q`Minimize \(L(w)=${sq('w', c)}\) subject to \(${lo}\le w\le ${hi}\). Give the constrained minimizer \(w^*\), the value \(L(w^*)\), and the ordinary derivative \(L'(w^*)\).`,
        answers: [{label: Q`\(w^*\)`, value: w, tol: 0}, {label: Q`\(L(w^*)\)`, value: L, tol: 0}, {label: Q`\(L'(w^*)\)`, value: d, tol: 0}],
        hint: Q`The unconstrained minimizer is \(w=${c}\). If it is infeasible, take the nearest feasible point.`,
        solution: w === c ? Q`The unconstrained minimizer ${c} lies inside \([${lo}, ${hi}]\), so \(w^*=${c}\), \(L(w^*)=0\) and \(L'(w^*)=0\): the constraint is inactive.`
          : Q`The unconstrained minimizer ${c} is infeasible, so the optimum is the nearest bound \(w^*=${w}\), with \(L=${pn(w - c)}^2=${L}\) and \(L'(w^*)=2(${shift(w, c)})=${d}\). The derivative is nonzero because the improving direction leaves the feasible set.`};
    }},
    {key: 'projected-step', skill: 'One projected gradient step', make(r) {
      const lo = r.int(-2, 1), hi = lo + r.int(2, 4), c = r.bool() ? hi + r.int(1, 4) : lo - r.int(1, 4), w0 = r.int(lo, hi), al = r.pick([0.25, 0.4, 0.5, 0.75]);
      const g = 2 * (w0 - c), u = fx(w0 - al * g, 6), w1 = clip(u, lo, hi);
      return {prompt: Q`Projected gradient descent minimizes \(L(w)=${sq('w', c)}\) over the interval \([${lo}, ${hi}]\). From \(w_0=${w0}\) with \(\alpha=${al}\), give the unprojected step \(w_0-\alpha L'(w_0)\) and the projected iterate \(w_1\).`,
        answers: [{label: 'Unprojected step', value: u}, {label: Q`\(w_1\)`, value: w1}],
        hint: 'Take an ordinary gradient step first. Projecting onto an interval means clipping to its end points.',
        solution: Q`\(L'(${w0})=2(${shift(w0, c)})=${g}\), so the step reaches \(${w0}-${al}\cdot${pn(g)}=${u}\). ${u > hi ? `That is above ${hi}, so clipping gives \\(w_1=${hi}\\).` : u < lo ? `That is below ${lo}, so clipping gives \\(w_1=${lo}\\).` : `That is already feasible, so \\(w_1=${u}\\).`} The minimizer ${c} lies outside the interval, so the iterates settle at the nearest bound.`};
    }},
  ]);

  P.add(32, [
    {key: 'initial-loss', skill: 'Cross entropy at equal logits', make(r) {
      const C = r.pick([2, 3, 4, 5, 10, 20, 100, 1000]), L0 = Math.log(C), L1 = r.real(0.1, Math.min(L0 - 0.05, 2.5), 2);
      return {prompt: Q`A ${C}-class softmax classifier starts with all logits equal. What is its cross-entropy loss (natural log) on any example? Later the mean loss is ${L1}: what geometric-mean probability \(e^{-L}\) does that give the true class?`,
        answers: [{label: 'Initial loss', value: L0}, {label: Q`\(e^{-L}\)`, value: Math.exp(-L1)}],
        hint: 'Equal logits give every class the same probability. Cross entropy is the negative log of the true-class probability.',
        solution: Q`Each class gets \(1/${C}\), so \(L=-\ln(1/${C})=\ln ${C}\approx${fx(L0, 4)}\); a first loss far from this suggests a scaling or label problem. A mean loss of ${L1} corresponds to \(e^{-${L1}}\approx${fx(Math.exp(-L1), 4)}\), the geometric mean of the true-class probabilities.`};
    }},
    {key: 'he-init', skill: 'Fan-in and He initialization for a conv layer', make(r) {
      const K = r.pick([1, 3, 5]), Cin = r.pick([3, 8, 16, 32, 64]), Cout = r.pick([16, 32, 64, 128]), D = K * K * Cin, sd = Math.sqrt(2 / D);
      return {prompt: Q`A \(${K}\times${K}\) convolution maps ${Cin} input channels to ${Cout} output channels and is followed by ReLU. Give its fan-in \(D\) (inputs summed per output value) and the He-initialization weight standard deviation, to four decimals (expressions such as sqrt(2/27) are accepted).`,
        answers: [{label: Q`Fan-in \(D\)`, value: D, tol: 0}, {label: 'Weight SD', value: sd, tol: 5e-4}],
        hint: Q`Each output value sums over one spatial window in every input channel. He initialization sets \(\operatorname{Var}(w)=2/D\).`,
        solution: Q`\(D=${K}\cdot${K}\cdot${Cin}=${D}\); the ${Cout} output channels do not change the fan-in. Then \(\operatorname{Var}(w)=2/${D}\approx${fx(2 / D, 5)}\) and the SD is \(\sqrt{2/${D}}\approx${fx(sd, 4)}\). The factor 2 compensates for ReLU zeroing about half of a symmetric preactivation.`};
    }},
    {key: 'depth-growth', skill: 'Signal scale through stacked linear layers', make(r) {
      const [sd, D] = r.pick([[0.1, 50], [0.1, 100], [0.1, 200], [0.1, 400], [0.05, 200], [0.05, 400], [0.05, 800], [0.05, 1600], [0.2, 25], [0.2, 50], [0.2, 100]]);
      const L = r.int(3, 6), g = fx(D * sd * sd, 6), out = g ** L, keep = 1 / Math.sqrt(D);
      return {prompt: Q`A stack of ${L} linear layers (no activations, no bias) each has fan-in ${D} and independent zero-mean weights with standard deviation ${sd}. Inputs are independent with variance 1. Give the per-layer variance factor, the output variance after all ${L} layers, and the weight SD that would keep the variance at 1 (expressions such as 2^-6 or 1/sqrt(50) are accepted).`,
        answers: [{label: 'Variance factor per layer', value: g}, {label: 'Output variance', value: out, tol: 1e-4}, {label: 'Variance-preserving SD', value: keep, tol: 5e-4}],
        hint: Q`For one layer \(\operatorname{Var}(z)\approx D\,\sigma_w^2\operatorname{Var}(x)\). Apply this once per layer.`,
        solution: Q`Each layer multiplies the variance by \(D\sigma_w^2=${D}\cdot${sd}^2=${g}\), so after ${L} layers it is \(${g}^{${L}}=${fx(out, 6)}\). ${g > 1 ? 'The signal explodes with depth.' : g < 1 ? 'The signal vanishes with depth.' : 'The scale is preserved.'} Keeping it at 1 needs \(\sigma_w=1/\sqrt{${D}}\approx${fx(keep, 4)}\).`};
    }},
    {key: 'feature-scaling', skill: 'Feature scales, curvature and step size', make(r) {
      const s1 = r.pick([2, 4, 5, 10]), s2 = r.pick([0.25, 0.5, 1]), h1 = s1 * s1, h2 = s2 * s2, kappa = h1 / h2, amax = 2 / h1;
      return {prompt: Q`Least squares \(L(w)=\frac1{2N}\|Xw-y\|^2\) has two zero-mean, uncorrelated features with standard deviations ${s1} and ${s2}. Give the condition number of the Hessian and the largest stable gradient-descent learning rate \(\alpha_{\max}\) (fractions accepted).`,
        answers: [{label: 'Condition number', value: kappa}, {label: Q`\(\alpha_{\max}\)`, value: amax, tol: 1e-4}],
        hint: Q`The Hessian is \(\frac1NX^TX\). For zero-mean, uncorrelated features it is diagonal, with each feature's variance on the diagonal.`,
        solution: Q`\(H=\operatorname{diag}(${h1}, ${h2})\), so \(\kappa=${h1}/${h2}=${kappa}\) and \(\alpha_{\max}=2/\lambda_{\max}=2/${h1}=${fx(amax, 5)}\). Even just below that rate the flat direction's error multiplier is about \(1-2/\kappa=${fx(1 - 2 / kappa, 4)}\), so it converges slowly. Standardizing both features with training statistics gives \(H=I\), \(\kappa=1\) and allows any \(\alpha<2\).`};
    }},
    {key: 'diagnose-symptom', skill: 'Match a training symptom to a first hypothesis', make(r) {
      const NUM = 'Overflowing logits, an unstable log or an excessive learning rate', FLAT = 'Zero gradients or parameters that are not being updated';
      const FIT = 'Overfitting, or a problem in the split protocol', SYM = 'Identical initialization that never broke symmetry';
      const C = r.pick([3, 5, 10]), steps = r.pick([50, 200, 500, 1000]), ep = r.int(5, 20);
      const cases = [
        [`The training loss turns into nan (not a number) after about ${steps} steps.`, NUM, 'A nan loss usually comes from overflow or log(0); inspect the largest logits, use a stable log-softmax and try a smaller step.'],
        [Q`With ${C} classes, the training loss stays at exactly \(\ln ${C}\approx${fx(Math.log(C), 3)}\) for ${steps} steps.`, FLAT, Q`\(\ln ${C}\) is the equal-logit loss, so the outputs never moved; check gradient norms and that the optimizer actually updates the parameters.`],
        [`Training loss keeps falling, but validation loss rises after epoch ${ep}.`, FIT, 'The model fits the training data better while generalizing worse; check regularization, early stopping and whether the splits are drawn properly.'],
        [`Two hidden units in the same layer still have exactly equal weights after ${steps} updates.`, SYM, 'Units that start identical receive identical gradients, so they stay identical; use random initialization.'],
      ];
      const [symptom, right, why] = r.pick(cases);
      return {prompt: `${symptom} Which hypothesis should you test first?`,
        answers: [choose(r, 'Hypothesis', [NUM, FLAT, FIT, SYM], right)],
        hint: 'Ask what the symptom says about the numbers flowing through the computation: invalid values, no change, a gap between splits, or identical units.',
        solution: `${right}. ${why} Treat it as a hypothesis and test one change at a time.`};
    }},
  ]);

  P.add(33, [
    {key: 'alias-frequency', skill: 'Apparent frequency after sampling', make(r) {
      const fs = r.pick([8, 10, 12, 16, 20]), f = r.int(fs / 2 + 1, 2 * fs - 1), k = Math.round(f / fs), d = f - k * fs, alias = Math.abs(d);
      return {prompt: Q`The pattern \(\cos(2\pi\cdot${f}\,t)\) (${f} cycles per unit length) is sampled at \(t=n/${fs}\), that is \(f_s=${fs}\) samples per unit length. Give the Nyquist frequency and the frequency in \([0,f_s/2]\) whose cosine produces exactly the same samples.`,
        answers: [{label: 'Nyquist frequency', value: fs / 2, tol: 0}, {label: 'Apparent frequency', value: alias, tol: 0}],
        hint: Q`Adding or subtracting a whole multiple of \(f_s\) leaves every sample unchanged, and cosine is even, so a negative frequency can be flipped.`,
        solution: Q`The Nyquist frequency is \(f_s/2=${fs / 2}\), and ${f} exceeds it. \(${f}-${k}\cdot${fs}=${d}\)${d < 0 ? Q`, and \(\cos(-\theta)=\cos\theta\) gives ${alias}` : ''}, so \(\cos(2\pi\cdot${f}\,n/${fs})=\cos(2\pi\cdot${alias}\,n/${fs})\) for every integer \(n\). Low-pass filtering before sampling prevents this false ${alias === 0 ? 'constant' : 'coarse pattern'}.`};
    }},
    {key: 'downsample-row', skill: 'Subsample with and without pre-averaging', make(r) {
      const stripes = r.bool(), lo = r.int(0, 3), hi = lo + r.int(3, 6), ph = r.int(0, 1);
      const x = Array.from({length: 8}, (_, n) => (stripes ? ((n + ph) % 2 ? hi : lo) : r.int(0, 9)));
      const o = r.int(0, 1), sub = x.filter((_, n) => n % 2 === o), avg = [0, 1, 2, 3].map(i => (x[2 * i] + x[2 * i + 1]) / 2);
      return {prompt: Q`A row is \(x=(${tup(x)})\) with zero-based indices. Give (a) the samples at indices ${o}, ${o + 2}, ${o + 4}, ${o + 6}, and (b) the result of averaging each neighbouring pair \((x_0,x_1),(x_2,x_3),\dots\) to halve the length.`,
        answers: [{label: '(a) Subsampled row', vector: sub, tol: 0}, {label: '(b) Pair averages', vector: avg}],
        hint: 'For (a) keep every second entry starting at the given index. For (b) average entries 0 and 1, then 2 and 3, and so on.',
        solution: Q`(a) \((${tup(sub)})\). (b) \((${tup(avg)})\). ${stripes ? 'The row alternates at the highest frequency, so plain subsampling turns it into a constant whose level depends on the starting index, while averaging gives the mean level.' : 'Averaging first acts as a simple low-pass filter, so fine detail is blended rather than skipped.'}`};
    }},
    {key: 'box-pixels', skill: 'Pixel counts under two box conventions', make(r) {
      const x0 = r.int(0, 40), y0 = r.int(0, 40), x1 = x0 + r.int(2, 20), y1 = y0 + r.int(2, 20), w = x1 - x0, h = y1 - y0, half = w * h, incl = (w + 1) * (h + 1);
      return {prompt: Q`A box has integer pixel coordinates \(x_{\min}=${x0}\), \(x_{\max}=${x1}\), \(y_{\min}=${y0}\), \(y_{\max}=${y1}\) (\(x\) is the column, \(y\) the row). How many pixels does it contain under the half-open convention \([x_{\min},x_{\max})\times[y_{\min},y_{\max})\), and how many if both end points are included?`,
        answers: [{label: 'Half-open count', value: half, tol: 0}, {label: 'Inclusive count', value: incl, tol: 0}],
        hint: 'A half-open range [a, b) of integers has b - a members; including both ends adds one.',
        solution: Q`Half-open: \((${x1}-${x0})(${y1}-${y0})=${w}\cdot${h}=${half}\). Inclusive: \((${w}+1)(${h}+1)=${incl}\). The ${incl - half} extra pixels are one extra row and one extra column, an off-by-one change that shifts areas and overlap scores.`};
    }},
    {key: 'resize-coordinate', skill: 'Map an output pixel centre into the input', make(r) {
      const [Win, Wout] = r.pick([[8, 4], [12, 4], [16, 8], [8, 16], [6, 9], [10, 4], [12, 8], [9, 6], [4, 10], [20, 8]]);
      const j = r.int(0, Wout - 1), u = (j + 0.5) * Win / Wout, i = Math.min(Win - 1, Math.floor(u)), naive = j * Win / Wout;
      return {prompt: Q`A row of ${Win} pixels is resized to ${Wout} pixels covering the same extent. In each row's own units pixel \(i\) is the cell \([i,i+1)\) with centre \(i+0.5\). For output pixel \(j=${j}\) (zero-based), give the continuous input coordinate of its centre and the index of the input cell containing that point.`,
        answers: [{label: 'Input coordinate', value: u}, {label: 'Input cell index', value: i, tol: 0}],
        hint: Q`The output centre is at \(j+0.5\) in output units. Convert to input units by multiplying by \(${Win}/${Wout}\).`,
        solution: Q`\(u=(${j}+0.5)\cdot\frac{${Win}}{${Wout}}=${fx(u, 4)}\), which lies in cell \(\lfloor ${fx(u, 4)}\rfloor=${i}\).${Number.isInteger(u) ? ' The centre falls exactly on a cell boundary, so a bilinear resize would weight the two neighbouring pixels equally.' : ''} Mapping \(j\cdot${Win}/${Wout}=${fx(naive, 4)}\) without the half-pixel offset would sample a different location, a common misalignment.`};
    }},
  ]);

  P.add(34, [
    {key: 'corr-conv-row', skill: 'Valid cross-correlation versus convolution', make(r) {
      const x = Array.from({length: 4}, () => r.int(-2, 5)); let k; do { k = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; } while (k[0] === k[2]);
      const kf = k.slice().reverse(), at = (w, i) => sum(w.map((v, j) => v * x[i + j])), terms = (w, i) => w.map((v, j) => `${pn(x[i + j])}\\cdot${pn(v)}`).join('+');
      const corr = [0, 1].map(i => at(k, i)), conv = [0, 1].map(i => at(kf, i));
      return {prompt: Q`For the row \(x=(${tup(x)})\) and kernel \(k=(${tup(k)})\), give the valid cross-correlation \(y_i=\sum_jx_{i+j}k_j\) and the valid convolution, which uses the flipped kernel (zero-based, stride 1, no padding).`,
        answers: [{label: 'Cross-correlation', vector: corr, tol: 0}, {label: 'Convolution', vector: conv, tol: 0}],
        hint: 'A length-3 kernel fits in two positions of a length-4 row. For convolution, reverse the kernel first, then slide it exactly as before.',
        solution: Q`Cross-correlation: \(y_0=${terms(k, 0)}=${corr[0]}\) and \(y_1=${terms(k, 1)}=${corr[1]}\). The flipped kernel is \((${tup(kf)})\), giving \(${terms(kf, 0)}=${conv[0]}\) and \(${terms(kf, 1)}=${conv[1]}\). The results differ because the kernel is not symmetric.`};
    }},
    {key: 'patch-2d', skill: '2D filter response at one position', make(r) {
      const grid = f => [0, 1, 2].map(() => [f(), f(), f()]), X = grid(() => r.int(0, 9));
      let K, Kr, corr, conv;
      do { K = grid(() => r.int(-1, 2)); Kr = K.map(row => row.slice().reverse()).reverse(); corr = sum(K.flatMap((row, i) => row.map((v, j) => v * X[i][j]))); conv = sum(Kr.flatMap((row, i) => row.map((v, j) => v * X[i][j]))); } while (corr === conv);
      return {prompt: Q`For the patch \(P=${mat(X)}\) and kernel \(K=${mat(K)}\), give the cross-correlation response \(\sum_{i,j}P_{ij}K_{ij}\) and the convolution response, which first rotates \(K\) by 180 degrees (flipping both axes).`,
        answers: [{label: 'Cross-correlation', value: corr, tol: 0}, {label: 'Convolution', value: conv, tol: 0}],
        hint: 'Multiply matching entries and add all nine products. For convolution, reverse the order of the rows and of the entries within each row first.',
        solution: Q`Elementwise products of \(P\) and \(K\) sum to \(${corr}\). The rotated kernel is \(${mat(Kr)}\), and its products with \(P\) sum to \(${conv}\). Many deep-learning "convolution" layers compute the first, unflipped version.`};
    }},
    {key: 'full-convolution', skill: 'Full 1D convolution', make(r) {
      const x = Array.from({length: 3}, () => r.int(-2, 4)), k = Array.from({length: r.pick([2, 3])}, () => r.nonzero(-2, 2));
      const y = Array(x.length + k.length - 1).fill(0); x.forEach((a, m) => k.forEach((b, j) => { y[m + j] += a * b; }));
      const work = y.map((v, n) => `y_${n}=${x.map((a, m) => (n - m >= 0 && n - m < k.length ? `${pn(a)}\\cdot${pn(k[n - m])}` : null)).filter(Boolean).join('+')}=${v}`);
      return {prompt: Q`Compute the full convolution \((x*k)_n=\sum_mx_mk_{n-m}\) of \(x=(${tup(x)})\) with \(k=(${tup(k)})\), counting every partial overlap (zero padding outside the row).`,
        answers: [{label: Q`\(x*k\)`, vector: y, tol: 0}],
        hint: 'The output has length N + K - 1. Equivalently, multiply the polynomials whose coefficients are x and k.',
        solution: Q`The output has length \(${x.length}+${k.length}-1=${y.length}\): \(${work.join(Q`,\ `)}\), so \(x*k=(${tup(y)})\).`};
    }},
    {key: 'affine-response', skill: 'Linearity versus an affine bias', make(r) {
      const beta = r.bool(0.75) ? r.nonzero(-3, 3) : 0; let s, t; do { s = r.nonzero(-3, 3); t = r.nonzero(-3, 3); } while (beta !== 0 && s + t === 1);
      const p = r.int(-8, 8), q = r.int(-8, 8), lin = s * (p - beta) + t * (q - beta), out = lin + beta, img = poly([[s, 'X'], [t, 'Y']]);
      return {prompt: Q`A filter layer with a fixed kernel and bias \(\beta=${beta}\) (no activation) outputs ${p} at one position for image \(X\) and ${q} at the same position for image \(Y\); both outputs include the bias. What does it output there for the image \(${img}\)?`,
        answers: [{label: 'Output', value: out, tol: 0}],
        hint: 'Remove the bias to get the linear part of each output, combine the linear parts, then add the bias once.',
        solution: Q`Linear parts: \(${p}-${pn(beta)}=${p - beta}\) and \(${q}-${pn(beta)}=${q - beta}\). The linear part for \(${img}\) is \(${s}\cdot${pn(p - beta)}+${pn(t)}\cdot${pn(q - beta)}=${lin}\), and adding the bias once gives \(${out}\).${beta ? Q` Combining the raw outputs, \(${s}\cdot${pn(p)}+${pn(t)}\cdot${pn(q)}=${s * p + t * q}\), is wrong: it carries the bias with total weight \(${s}+${pn(t)}=${s + t}\) instead of 1. With a bias the layer is affine, not linear.` : ' With zero bias the layer is linear, so the outputs combine directly.'}`};
    }},
  ]);

  P.add(35, [
    {key: 'output-size', skill: 'Output height and width of a conv layer', make(r) {
      const K = r.pick([1, 3, 3, 5, 7]), d = K > 1 && r.bool(0.25) ? 2 : 1, S = r.pick([1, 2, 2, 3]), keff = d * (K - 1) + 1, Pd = r.int(0, Math.ceil(keff / 2));
      const H = r.int(Math.max(9, keff), 64), W = r.int(Math.max(9, keff), 64), out = n => Math.floor((n + 2 * Pd - keff) / S) + 1;
      return {prompt: Q`An input of height ${H} and width ${W} passes through a \(${K}\times${K}\) convolution with padding ${Pd} on every side, stride ${S} and ${d > 1 ? `dilation ${d}` : 'no dilation'}. Give the output (height, width).`,
        answers: [{label: '(height, width)', vector: [out(H), out(W)], tol: 0}],
        hint: Q`Use \(\left\lfloor\frac{L+2P-d(K-1)-1}{S}\right\rfloor+1\) separately for the height and the width.`,
        solution: Q`The effective kernel size is \(d(K-1)+1=${keff}\). Height: \(\lfloor(${H}+${2 * Pd}-${keff})/${S}\rfloor+1=\lfloor ${H + 2 * Pd - keff}/${S}\rfloor+1=${out(H)}\). Width: \(\lfloor(${W}+${2 * Pd}-${keff})/${S}\rfloor+1=\lfloor ${W + 2 * Pd - keff}/${S}\rfloor+1=${out(W)}\). The floor discards an incomplete final stride.`};
    }},
    {key: 'conv-params', skill: 'Parameter count and output shape of a conv layer', make(r) {
      const N = r.pick([1, 8, 16, 32]), H = r.int(8, 64), W = r.int(8, 64), Cin = r.pick([1, 3, 16, 32, 64]), Cout = r.pick([8, 16, 32, 64, 128]), K = r.pick([1, 3, 5]), same = r.bool();
      const Pd = same ? (K - 1) / 2 : 0, Ho = H + 2 * Pd - K + 1, Wo = W + 2 * Pd - K + 1, w = K * K * Cin * Cout;
      return {prompt: Q`A batch \(X\) of shape \((${N}, ${H}, ${W}, ${Cin})\) (batch, height, width, channels) passes through a biased \(${K}\times${K}\) convolution with ${Cout} output channels, stride 1 and ${Pd ? `padding ${Pd} on every side` : 'no padding'}. Give the number of learnable parameters and the output shape.`,
        answers: [{label: 'Parameters', value: w + Cout, tol: 0}, {label: 'Output shape', vector: [N, Ho, Wo, Cout], tol: 0}],
        hint: 'Each output channel has one kernel spanning the spatial window and every input channel, plus one bias.',
        solution: Q`Weights: \(${K}\cdot${K}\cdot${Cin}\cdot${Cout}=${w}\), plus ${Cout} biases, gives ${w + Cout}. Spatially \(${H}+${2 * Pd}-${K}+1=${Ho}\) and \(${W}+${2 * Pd}-${K}+1=${Wo}\), so the output is \((${N}, ${Ho}, ${Wo}, ${Cout})\). The parameter count does not depend on the image size or the batch size, because the weights are shared.`};
    }},
    {key: 'receptive-field', skill: 'Receptive field and jump through stacked layers', make(r) {
      const layers = Array.from({length: r.int(2, 4)}, () => (r.bool(0.2) ? {K: 2, S: 2, d: 1, pool: true} : {K: r.pick([3, 3, 5]), S: r.pick([1, 1, 2]), d: r.bool(0.2) ? 2 : 1}));
      let rf = 1, j = 1; const trace = [];
      for (const L of layers) { rf += (L.d * (L.K - 1)) * j; j *= L.S; trace.push(`(${rf}, ${j})`); }
      const desc = layers.map(L => (L.pool ? Q`\(2\times2\) max pooling with stride 2` : Q`\(${L.K}\times${L.K}\) convolution with stride ${L.S}${L.d > 1 ? ` and dilation ${L.d}` : ''}`));
      return {prompt: `Layers are applied in this order: ${desc.join('; ')}. Starting from r = 1 and j = 1 in input pixels, give the receptive-field width r and the jump j (spacing between neighbouring output centres, in input pixels) after the last layer.`,
        answers: [{label: 'Receptive field r', value: rf, tol: 0}, {label: 'Jump j', value: j, tol: 0}],
        hint: Q`For each layer, \(K_{\mathrm{eff}}=d(K-1)+1\); update \(r\leftarrow r+(K_{\mathrm{eff}}-1)\,j\) using the old \(j\), then \(j\leftarrow jS\).`,
        solution: Q`After each layer \((r, j)\) becomes ${trace.join(', ')}. So \(r=${rf}\) and \(j=${j}\). Strides early in the stack multiply the growth contributed by every later layer.`};
    }},
    {key: 'same-padding', skill: 'Padding needed for same-style output', make(r) {
      const K = r.pick([2, 3, 4, 5, 7]), S = r.pick([1, 2, 2, 3]), L = r.int(7, 40), out = Math.ceil(L / S), total = Math.max((out - 1) * S + K - L, 0), left = Math.floor(total / 2), right = total - left;
      return {prompt: Q`"Same" padding with stride ${S} keeps \(\lceil L/S\rceil\) outputs. For an input of length ${L} and a kernel of size ${K}, give that output length and the (left, right) padding, putting any odd extra element on the right.`,
        answers: [{label: 'Output length', value: out, tol: 0}, {label: '(left, right) padding', vector: [left, right], tol: 0}],
        hint: Q`The last window starts at \((n_{\rm out}-1)S\) and must end inside the padded row, so the total padding is \(\max\big((n_{\rm out}-1)S+K-L,\,0\big)\).`,
        solution: Q`\(n_{\rm out}=\lceil ${L}/${S}\rceil=${out}\). Total padding \(\max\big((${out}-1)\cdot${S}+${K}-${L},\,0\big)=${total}\), split as (${left}, ${right}). Check: \(\lfloor(${L}+${total}-${K})/${S}\rfloor+1=${out}\).${left !== right ? ' The two sides differ, so this "same" layer cannot be written with one symmetric padding number.' : ''}`};
    }},
  ]);

  P.add(36, [
    {key: 'dft-four', skill: 'Four-point DFT by hand', make(r) {
      const x = Array.from({length: 4}, () => r.int(-3, 5)), X0 = sum(x), X2 = x[0] - x[1] + x[2] - x[3], re = x[0] - x[2], im = x[3] - x[1];
      return {prompt: Q`Using \(X_k=\sum_{n=0}^{3}x_ne^{-2\pi ikn/4}\), find \(X_0\), \(X_2\) and \(X_1\) (as real part, imaginary part) for \(x=(${tup(x)})\).`,
        answers: [{label: Q`\(X_0\)`, value: X0, tol: 0}, {label: Q`\(X_2\)`, value: X2, tol: 0}, {label: Q`\(X_1\) as (real, imaginary)`, vector: [re, im], tol: 0}],
        hint: Q`For \(N=4\) the factors \(e^{-2\pi ikn/4}\) are powers of \(-i\): for \(k=1\) they are \(1,-i,-1,i\), and for \(k=2\) they are \(1,-1,1,-1\).`,
        solution: Q`\(X_0=${x.map(pn).join('+')}=${X0}\), the DC sum. \(X_2=x_0-x_1+x_2-x_3=${X2}\). \(X_1=x_0-ix_1-x_2+ix_3=(${pn(x[0])}-${pn(x[2])})+i(${pn(x[3])}-${pn(x[1])})=${re}${im < 0 ? '-' : '+'}${Math.abs(im) === 1 ? '' : Math.abs(im)}i\). For a real signal \(X_3\) is the complex conjugate of \(X_1\).`};
    }},
    {key: 'cosine-bins', skill: 'DFT bins of a sampled cosine', make(r) {
      const N = r.pick([8, 12, 16]), m = r.int(1, N / 2 - 1), A = r.int(1, 4), c = r.int(0, 3), X0 = N * c, Xm = A * N / 2, mn = m === 1 ? 'n' : Q`\cdot${m}n`;
      return {prompt: Q`The ${N}-sample signal \(x_n=${c ? c + '+' : ''}${A === 1 ? '' : A}\cos(2\pi ${mn}/${N})\), \(n=0,\dots,${N - 1}\), is transformed with \(X_k=\sum_nx_ne^{-2\pi ikn/N}\). Give \(X_0\), \(X_{${m}}\), and the index of the other nonzero bin in \(0,\dots,${N - 1}\).`,
        answers: [{label: Q`\(X_0\)`, value: X0, tol: 0}, {label: Q`\(X_{${m}}\)`, value: Xm, tol: 0}, {label: 'Other nonzero bin', value: N - m, tol: 0}],
        hint: Q`Write \(\cos\theta=\tfrac12(e^{i\theta}+e^{-i\theta})\). A complex exponential that completes \(m\) cycles sums to \(N\) at bin \(m\) and to 0 at every other bin.`,
        solution: Q`${c ? Q`The constant ${c} contributes \(${N}\cdot${c}=${X0}\) to \(X_0\) only.` : Q`There is no constant term, so \(X_0=0\).`} The cosine is \(\tfrac{${A}}{2}\big(e^{2\pi i${mn}/${N}}+e^{-2\pi i${mn}/${N}}\big)\); each part sums to \(${N}\cdot\tfrac{${A}}{2}=${Xm}\), at bins ${m} and \(${N}-${m}=${N - m}\) (the negative frequency wraps around).`};
    }},
    {key: 'filter-gain', skill: 'Gain of a symmetric 3-tap filter', make(r) {
      let b, c;
      if (r.bool()) { const a = r.pick([0.1, 0.2, 0.25, 0.3]); [b, c] = r.bool(0.7) ? [a, fx(1 - 2 * a, 2)] : [-a, fx(1 + 2 * a, 2)]; } else { b = r.nonzero(-2, 2); c = r.int(0, 4); }
      const H0 = fx(c + 2 * b, 6), Hpi = fx(c - 2 * b, 6);
      return {prompt: Q`The kernel \(k=(${b}, ${c}, ${b})\) is slid along long rows (away from the boundaries). It multiplies the constant row \((1,1,1,\dots)\), the alternating row \((1,-1,1,-1,\dots)\) and the period-4 row \((1,0,-1,0,\dots)\) each by a gain. Give the three gains.`,
        answers: [{label: 'Constant row gain', value: H0}, {label: 'Alternating row gain', value: Hpi}, {label: 'Period-4 row gain', value: c}],
        hint: 'Place the kernel over three neighbouring entries of each row and compute one output; compare it with the centre input value.',
        solution: Q`Constant row: \(${pn(b)}+${pn(c)}+${pn(b)}=${H0}\). Alternating row at a \(+1\) entry: \(${pn(b)}(-1)+${pn(c)}(1)+${pn(b)}(-1)=${Hpi}\). Period-4 row at its peak: both neighbours are 0, so the gain is \(${c}\). These are \(H(\omega)=${pn(c)}+2\cdot${pn(b)}\cos\omega\) at \(\omega=0,\pi,\pi/2\).${Hpi === 0 ? ' The alternating pattern is removed completely.' : Hpi < 0 ? ' A negative gain also flips the sign of that pattern.' : ''}`};
    }},
    {key: 'fft-padding', skill: 'FFT length for linear convolution', make(r) {
      const N = r.int(20, 600), K = r.pick([3, 5, 7, 9, 15, 31, 63]), L = N + K - 1; let pow = 1; while (pow < L) pow *= 2;
      return {prompt: `A row of length ${N} is convolved with a kernel of length ${K} by multiplying FFTs. What is the minimum FFT length that avoids circular wraparound for full linear convolution, and the smallest power of two that is at least that long?`,
        answers: [{label: 'Minimum length', value: L, tol: 0}, {label: 'Power of two', value: pow, tol: 0}],
        hint: 'FFT multiplication computes circular convolution of the padded length. Pad until that length can hold every output of the full linear convolution.',
        solution: Q`Full linear convolution has \(${N}+${K}-1=${L}\) outputs, so both signals must be zero-padded to at least ${L}. The next power of two is ${pow}. With length ${N} only, the last ${K - 1} outputs would wrap around onto the first ${K - 1}.`};
    }},
    {key: 'suppressed-frequency', skill: 'Which pattern a filter removes', make(r) {
      const DC = 'Only the constant row', ALT = 'Only the alternating row', BOTH = 'Both rows', NONE = 'Neither row';
      const [k, den] = r.pick([[[1, 1], 2], [[1, 2, 1], 4], [[1, -1], 1], [[1, -2, 1], 1], [[1, 0, -1], 2], [[1, 1, 1], 3], [[-1, 3, -1], 1], [[1, 0, 1], 2], [[1, 1, 1, 1], 4], [[1, -1, 1, -1], 4], [[1, 3, 3, 1], 8], [[-1, 2, -1], 1], [[1, 1, -1, -1], 4]]);
      const s0 = sum(k), s1 = sum(k.map((v, j) => (j % 2 ? -v : v))), right = s0 === 0 && s1 === 0 ? BOTH : s0 === 0 ? DC : s1 === 0 ? ALT : NONE;
      return {prompt: Q`The kernel \(k=${den > 1 ? Q`\tfrac1{${den}}` : ''}(${tup(k)})\) is slid along long rows (away from the boundaries). Which of these rows does it map to all zeros: the constant row \((1,1,1,\dots)\) and the alternating row \((1,-1,1,-1,\dots)\)?`,
        answers: [choose(r, 'Rows sent to zero', [DC, ALT, BOTH, NONE], right)],
        hint: 'Sum the kernel coefficients for the constant row. For the alternating row, sum them with alternating signs.',
        solution: Q`Ignoring the overall factor, the coefficient sum is \(${s0}\) (the constant-row response) and the alternating sum is \(${s1}\) (the alternating-row response, up to sign). ${[`${right}.`, s0 === 0 ? 'A zero coefficient sum removes the DC component, as difference filters do.' : '', s1 === 0 ? 'A zero alternating sum removes the highest sampled frequency, as smoothing filters do.' : '', s0 !== 0 && s1 !== 0 ? 'Neither sum is zero, so both patterns pass, only rescaled.' : ''].filter(Boolean).join(' ')}`};
    }},
  ]);
})();
