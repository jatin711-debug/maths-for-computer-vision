/* Primers for Module 17 (Lessons 65-68). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  add(65, {
    builds: [{lesson: 55, why: 'scaled dot-product attention and positional embeddings'}, {lesson: 42, why: 'boxes, IoU and the GIoU box loss'}, {lesson: 27, why: 'the softmax cross-entropy used for the class term'}],
    recall: ['scaled-dot-product-attention', 'positional-embedding', 'generalized-iou', 'hungarian-algorithm', 'fourier-features'],
    symbols: [
      ['X_q, X_img', 'query tokens (such as 100 learned object queries) and image tokens', 'cross-attention'],
      ['PE(p)', 'sinusoidal encoding of position p: sines and cosines of p at several speeds', 'sinusoidal-positional-encoding'],
      ['σ̂', 'the one-to-one matching of predictions to objects with the smallest total cost', 'set-prediction-loss'],
      ['∅', '“no object”: the label given to every prediction left unmatched', 'set-prediction-loss'],
      ['GIoU', 'generalised IoU: IoU minus the empty fraction of the enclosing box'],
      ['C', 'the smallest axis-aligned box that encloses both A and B']
    ],
    terms: [
      {
        id: 'cross-attention', term: 'Cross-attention', symbol: T`\operatorname{softmax}\!\Bigl(\frac{QK^T}{\sqrt d}\Bigr)V,\ Q=X_qW_Q,\ K,V\text{ from }X_{\rm img}`,
        plain: T`Attention in which the queries come from one set of tokens and the keys and values from another. Each query takes a weighted average of the other set’s values, so the output has one row per query, however many tokens it reads. DETR’s learned object queries read image features this way, and text-to-image models read the words of a prompt.`,
        formula: T`Y=\operatorname{softmax}\!\Bigl(\frac{(X_qW_Q)(X_{\rm img}W_K)^T}{\sqrt d}\Bigr)X_{\rm img}W_V,\qquad A\ \text{is}\ N_q\times N_{\rm img}`,
        steps: [T`Make the queries from the query tokens: \(Q=X_qW_Q\).`, T`Make the keys and values from the other set: \(K=X_{\rm img}W_K\) and \(V=X_{\rm img}W_V\).`, T`Score, scale and softmax each row: \(A=\operatorname{softmax}(QK^T/\sqrt d)\).`, T`Average the values: \(Y=AV\), one row per query.`],
        examples: [[T`\(q=(2,0,1,1)\); keys \((1,0,1,1)\), \((0,1,0,0)\), \((1,1,0,0)\)`, T`scores \((4,0,2)\), scaled \((2,0,1)\); weights \((0.665,\ 0.090,\ 0.245)\)`], [T`values \((1,0)\), \((0,1)\), \((0.5,0.5)\)`, T`output \((0.788,\ 0.212)\)`], [T`100 queries, 850 image tokens`, T`\(100\times850=85{,}000\) scores per head; 100 output rows`]],
        pitfall: T`Cross-attention is not symmetric: swapping the two sets changes which one gets an output row. Its cost grows with \(N_q\cdot N_{\rm img}\), not with \(N_{\rm img}^2\).`,
        seeAlso: [67]
      },
      {
        id: 'sinusoidal-positional-encoding', term: 'Sinusoidal position encoding', symbol: T`\mathrm{PE}(p)`,
        plain: T`A fixed way to turn a position p into a vector: pairs of sines and cosines of p, each pair turning at its own speed \(\omega_i\). Moving p rotates every pair, so the dot product of two encodings depends only on how far apart the positions are. Transformers add it to their tokens so that attention can use where things are.`,
        formula: T`\mathrm{PE}(p)_{2i}=\sin(\omega_ip),\quad \mathrm{PE}(p)_{2i+1}=\cos(\omega_ip),\quad \omega_i=10000^{-2i/D},\qquad \mathrm{PE}(p)\cdot\mathrm{PE}(p')=\sum_i\cos\bigl(\omega_i(p-p')\bigr)`,
        steps: [T`List the frequencies \(\omega_i=10000^{-2i/D}\) for \(i=0,\ldots,D/2-1\).`, T`For each frequency write \(\sin(\omega_ip)\) and \(\cos(\omega_ip)\), with angles in radians.`, T`To compare two positions, add \(\cos(\omega_i\Delta)\) over the frequencies, where \(\Delta=p-p'\).`],
        examples: [[T`\(D=4\)`, T`\(\omega=(1,\ 0.01)\)`], [T`\(\mathrm{PE}(1)\)`, T`\((0.841,\ 0.540,\ 0.010,\ 1.000)\)`], [T`\(\mathrm{PE}(1)\cdot\mathrm{PE}(0)\) and \(\mathrm{PE}(5)\cdot\mathrm{PE}(4)\)`, T`both \(\cos1+\cos0.01=1.540\)`], [T`\(\mathrm{PE}(2)\cdot\mathrm{PE}(5)\)`, T`\(\cos3+\cos0.03=0.0096\)`]],
        plot: {fn: 'x => { let t = 0; for (let i = 0; i < 32; i++) t += Math.cos(x * Math.pow(10000, -i / 32)); return t / 32; }', x: [0, 50], y: [0.4, 1], xLabel: 'offset p − p′ (D = 64)', yLabel: 'similarity ÷ (D/2)', marks: [0, 10]},
        pitfall: T`With only one or two frequencies the dot product oscillates, so far-apart positions can look as similar as neighbours. Real models use many frequencies; DETR uses 64 per image axis.`,
        seeAlso: [67]
      },
      {
        id: 'rotary-position-embedding', term: 'Rotary position embedding (RoPE)', symbol: T`R(m\theta)q`,
        plain: T`RoPE puts positions into attention by rotating rather than adding. Each 2-D pair of a query at position m is rotated by the angle \(m\theta\), and each pair of a key at position n by \(n\theta\). Rotations keep lengths and combine by adding angles, so the attention score depends only on the offset \(n-m\).`,
        formula: T`\bigl(R(m\theta)q\bigr)^T\bigl(R(n\theta)k\bigr)=q^TR\bigl((n-m)\theta\bigr)k,\qquad R(\phi)=\begin{bmatrix}\cos\phi&-\sin\phi\\\sin\phi&\cos\phi\end{bmatrix}`,
        steps: [T`Split the query and the key into 2-D pairs.`, T`Rotate each query pair by \(m\theta\) and each key pair by \(n\theta\).`, T`Take the dot product, or use \(\cos\phi\,(q\cdot k)+\sin\phi\,(q_2k_1-q_1k_2)\) with \(\phi=(n-m)\theta\).`],
        examples: [[T`\(q=(1,2)\), \(k=(2,1)\), \(\theta=0.5\), \((m,n)=(3,1)\)`, T`\(\phi=-1\): score \(-0.363\)`], [T`the same with \((m,n)=(5,3)\)`, T`\(-0.363\): same offset, same score`], [T`\((m,n)=(1,3)\)`, T`\(\phi=+1\): score \(4.686\)`], [T`\((m,n)=(4,4)\)`, T`no rotation: \(q\cdot k=4\)`]],
        pitfall: T`RoPE rotates the queries and keys only, never the values, and it is applied inside every attention layer, not once at the input.`
      },
      {
        id: 'set-prediction-loss', term: 'Set prediction with a matched loss', symbol: T`\hat\sigma=\arg\min_\sigma\sum_i\mathcal L_{\rm match}\bigl(y_i,\hat y_{\sigma(i)}\bigr)`,
        plain: T`A detector such as DETR outputs a fixed number of (class, box) guesses with no order, so training must first decide which guess answers which object. It takes the one-to-one matching with the smallest total cost, found by the Hungarian algorithm, labels every guess left over “no object” (∅), and only then applies the class and box losses. Duplicate guesses are trained to say ∅.`,
        formula: T`\mathcal L_{\rm match}=-\hat p_{\sigma(i)}(c_i)+\lambda_{L1}\|b_i-\hat b_{\sigma(i)}\|_1+\lambda_{\rm giou}\bigl(1-\mathrm{GIoU}(b_i,\hat b_{\sigma(i)})\bigr)`,
        steps: [T`Fill a cost matrix: one row per object, one column per prediction.`, T`Find the matching with the smallest total: list them all for tiny cases, use the Hungarian algorithm in general.`, T`Train each matched prediction on its object’s class and box, and every unmatched prediction towards ∅.`],
        examples: [[T`cup row \((-0.8,\ -0.3,\ 1.173)\), spoon row \((1.15,\ 1.011,\ -0.2)\)`, T`best: cup → p1, spoon → p3, total \(-1.0\)`], [T`the near-duplicate p2`, T`matched to ∅; its loss \(-\ln0.2=1.609\)`], [T`T1 \((0.1,0.3,0.9)\), T2 \((0.2,1.0,0.8)\)`, T`best total 0.5; greedy gets 0.9`], [T`100 predictions, 5 objects`, T`\(100!/95!\approx9.0\times10^9\) matchings by brute force`]],
        pitfall: T`The matching cost uses the probability \(-\hat p\), but the training loss uses \(-\ln\hat p\). The matching is recomputed for every image at every step, and no gradient flows through the choice itself.`
      }
    ]
  });

  add(66, {
    builds: [{lesson: 21, why: 'Bayes’ theorem gives the responsibilities'}, {lesson: 25, why: 'the M-step is a weighted maximum-likelihood fit'}, {lesson: 54, why: 'a KL divergence measures the gap in the bound'}],
    recall: ['bayes-theorem', 'gaussian-distribution', 'marginalization', 'maximum-likelihood-estimation', 'kl-divergence'],
    symbols: [
      ['z', 'latent variable: the hidden cause, such as a mixture component or a code vector', 'gaussian-mixture-model'],
      ['r_k', 'responsibility: the probability that component k produced the point x', 'gaussian-mixture-model'],
      ['q(z|x)', 'encoder: a Gaussian guess of the code z for the input x', 'variational-autoencoder'],
      ['p(x|z)', 'decoder: how likely x is given z; −ln p(x|z) is the reconstruction loss', 'variational-autoencoder'],
      ['ELBO', 'evidence lower bound: below ln p(x) by KL(q ‖ true posterior)', 'evidence-lower-bound'],
      ['ε', 'noise from N(0, I) that makes z = μ + σε differentiable in μ and σ', 'reparameterization-trick']
    ],
    terms: [
      {
        id: 'gaussian-mixture-model', term: 'Gaussian mixture and responsibilities', symbol: T`p(x)=\sum_k\pi_k\mathcal N(x;\mu_k,\Sigma_k)`,
        plain: T`A density built from K Gaussian bumps: choose component k with probability \(\pi_k\), then draw x from its Gaussian. Which component was chosen is a latent variable, never observed. Bayes’ theorem gives each component’s responsibility for a point: the probability that it produced that point.`,
        formula: T`p(x)=\sum_{k=1}^{K}\pi_k\,\mathcal N(x;\mu_k,\Sigma_k),\qquad r_k(x)=\frac{\pi_k\,\mathcal N(x;\mu_k,\Sigma_k)}{\sum_j\pi_j\,\mathcal N(x;\mu_j,\Sigma_j)}`,
        steps: [T`Evaluate each component’s density at x.`, T`Multiply each density by its weight \(\pi_k\).`, T`Add them to get \(p(x)\); divide each weighted density by \(p(x)\) to get the responsibilities.`],
        examples: [[T`\(\pi=(\tfrac12,\tfrac12)\), means 0 and 4, \(\sigma=1\), x = 1`, T`densities 0.2420 and 0.00443; \(r=(0.982,\ 0.018)\)`], [T`the same mixture at x = 2`, T`\(r=(0.5,\ 0.5)\)`], [T`its log-likelihood at x = 1`, T`\(\ln(0.1210+0.0022)=-2.094\)`], [T`\(\pi=(0.3,0.7)\), means 0 and 2, x = 0.5`, T`\(r=(0.538,\ 0.462)\)`]],
        pitfall: T`A responsibility is a probability about the hidden component, not about x. The responsibilities of one point always sum to 1, however unlikely the point itself is.`,
        seeAlso: [67]
      },
      {
        id: 'expectation-maximization', term: 'EM algorithm and k-means', symbol: T`r_{nk}\ \to\ (\pi_k,\mu_k,\Sigma_k)\ \to\ r_{nk}`,
        plain: T`EM fits a mixture by repeating two steps. The E-step computes every point’s responsibilities with the current parameters. The M-step refits each component by maximum likelihood, counting each point in proportion to its responsibility. The log-likelihood never decreases. With hard 0-or-1 responsibilities EM becomes k-means.`,
        formula: T`N_k=\sum_nr_{nk},\quad \mu_k=\frac1{N_k}\sum_nr_{nk}x_n,\quad \sigma_k^2=\frac1{N_k}\sum_nr_{nk}(x_n-\mu_k)^2,\quad \pi_k=\frac{N_k}{N}`,
        steps: [T`E-step: compute \(r_{nk}\) for every point and component.`, T`M-step: weighted counts, means, variances and weights, as in the formulas.`, T`Repeat until the log-likelihood stops rising.`, T`k-means instead: give each point to its nearest mean, then average each group.`],
        examples: [[T`x = (0, 1, 3, 4), \(r_1=(1,\ 0.8,\ 0.2,\ 0)\)`, T`\(N_1=2\), \(\mu_1=0.7\), \(\sigma_1^2=0.81\), \(\pi_1=0.5\)`], [T`the same points, \(r_2=(0,\ 0.2,\ 0.8,\ 1)\)`, T`\(\mu_2=3.3\), \(\sigma_2^2=0.81\)`], [T`k-means on (3, 5, 6, 7, 8, 12) from means 4 and 7`, T`groups (3, 5) and (6, 7, 8, 12); new means 4 and 8.25`]],
        pitfall: T`EM climbs only to a local maximum, so the result depends on the starting means; try several starts. A component can also collapse onto one repeated point, where its likelihood grows without limit.`
      },
      {
        id: 'jensens-inequality', term: 'Jensen’s inequality', symbol: T`\ln\mathbb E[Y]\ge\mathbb E[\ln Y]`,
        plain: T`For a concave function such as the logarithm, the function of an average is at least the average of the function, because every chord lies below the curve. It turns the log of a sum, which is hard to optimise, into a sum of logs that bounds it from below.`,
        formula: T`\ln\Bigl(\sum_kq_ka_k\Bigr)\ \ge\ \sum_kq_k\ln a_k\qquad\Bigl(q_k\ge0,\ \sum_kq_k=1,\ a_k>0\Bigr)`,
        steps: [T`Average the values with the weights \(q_k\), then take the log.`, T`Take the log of each value, then average the logs with the same weights.`, T`The first number is at least the second; they are equal only if every value with \(q_k>0\) is the same.`],
        examples: [[T`Y = 1 or 4, probability ½ each`, T`\(\ln2.5=0.916\ \ge\ \tfrac12\ln4=0.693\)`], [T`Y = 5 with probability 0.75, otherwise 3`, T`\(\ln4.5=1.504\ \ge\ 1.482\)`], [T`Y = 2 always`, T`both equal \(\ln2=0.693\): no gap`]],
        plot: {fn: 'x => Math.log(x)', x: [0.5, 5], y: [-0.8, 1.7], xLabel: 'y', yLabel: 'ln y', marks: [1, 2.5, 4]},
        pitfall: T`The inequality flips for convex functions such as \(y^2\): there \(\mathbb E[Y]^2\le\mathbb E[Y^2]\), which is why a variance is never negative.`
      },
      {
        id: 'evidence-lower-bound', term: 'Evidence lower bound (ELBO)', symbol: T`\mathcal L(q)`,
        plain: T`For any guess q of the latent variable, Jensen’s inequality gives a lower bound on the log-likelihood \(\ln p(x)\), called the evidence. The bound falls short by exactly the KL divergence from q to the true posterior, so it is tight when q is the posterior. Written as reconstruction minus a KL to the prior, it is the training objective of a VAE.`,
        formula: T`\ln p(x)=\underbrace{\sum_zq(z)\ln\frac{p(x,z)}{q(z)}}_{\mathcal L(q)}+\mathrm{KL}\bigl(q\,\|\,p(z|x)\bigr),\qquad \mathcal L(q)=\mathbb E_q\bigl[\ln p(x|z)\bigr]-\mathrm{KL}\bigl(q\,\|\,p(z)\bigr)`,
        steps: [T`For each value of z, compute \(\ln\bigl(p(x,z)/q(z)\bigr)\).`, T`Average those with the weights q(z): that is \(\mathcal L(q)\).`, T`Check: \(\ln p(x)-\mathcal L(q)\) equals the KL divergence from q to the posterior, which is never negative.`],
        examples: [[T`mixture at x = 1, q = responsibilities (0.982, 0.018)`, T`\(\mathcal L=\ln p(x)=-2.094\): tight`], [T`q = (1, 0), a hard assignment`, T`\(\mathcal L=-2.112\); gap \(-\ln0.982=0.018\)`], [T`q = (0.5, 0.5)`, T`\(\mathcal L=-3.419\); gap 1.325`]],
        pitfall: T`Raising the ELBO need not raise the likelihood: it may only make q a better guess of the posterior. Say whether a number is \(\ln p(x)\) or a bound on it.`,
        seeAlso: [67]
      },
      {
        id: 'reparameterization-trick', term: 'Reparameterisation trick', symbol: T`z=\mu+\sigma\varepsilon`,
        plain: T`To learn the mean and spread of a random code, draw the randomness separately: \(\varepsilon\) from a standard normal, then \(z=\mu+\sigma\varepsilon\). The sample is now an ordinary function of μ and σ, so the chain rule can pass gradients through it.`,
        formula: T`z=\mu+\sigma\varepsilon,\quad \varepsilon\sim\mathcal N(0,1)\qquad\Longrightarrow\qquad \frac{\partial z}{\partial\mu}=1,\quad \frac{\partial z}{\partial\sigma}=\varepsilon`,
        steps: [T`Draw \(\varepsilon\) from \(\mathcal N(0,1)\), independent of every parameter.`, T`Compute \(z=\mu+\sigma\varepsilon\), then the loss.`, T`Backpropagate: \(\partial L/\partial\mu=\partial L/\partial z\) and \(\partial L/\partial\sigma=\varepsilon\,\partial L/\partial z\).`],
        examples: [[T`\(\mu=1,\ \sigma=0.5,\ \varepsilon=-0.4\)`, T`\(z=0.8\)`], [T`loss \((z-2)^2\) at that sample`, T`\(\partial L/\partial z=-2.4\): \(\partial L/\partial\mu=-2.4\), \(\partial L/\partial\sigma=0.96\)`], [T`\(\mu=0,\ \sigma=1,\ \varepsilon=1.5\), loss \((z-1)^2\)`, T`\(\partial L/\partial\mu=1\), \(\partial L/\partial\sigma=1.5\)`]],
        pitfall: T`Networks usually output \(\ln\sigma^2\) instead of σ, which keeps σ positive. Then \(\sigma=e^{\frac12\ln\sigma^2}\) and the chain rule picks up one more factor, \(\partial\sigma/\partial\ln\sigma^2=\sigma/2\).`,
        seeAlso: [67]
      },
      {
        id: 'variational-autoencoder', term: 'Variational autoencoder (VAE)', symbol: T`q(z|x)\ \to\ z\ \to\ p(x|z)`,
        plain: T`An encoder network maps an image to a Gaussian \(q(z|x)\) over a small latent code, and a decoder network maps a code back to an image. Training maximises the ELBO: reconstruct well, but keep each \(q(z|x)\) close to the prior \(\mathcal N(0,I)\), so that codes drawn from the prior decode to plausible images.`,
        formula: T`\text{loss}=-\ln p(x|z)+\beta\sum_j\tfrac12\bigl(\mu_j^2+\sigma_j^2-1-\ln\sigma_j^2\bigr),\qquad z=\mu(x)+\sigma(x)\odot\varepsilon`,
        steps: [T`Encode: the network outputs μ and \(\ln\sigma^2\) for every latent dimension.`, T`Sample \(z=\mu+\sigma\varepsilon\) and decode it.`, T`Loss: the reconstruction error plus β times the KL term summed over dimensions; β = 1 gives the ELBO.`],
        examples: [[T`\(\mu=1,\ \sigma=0.5\)`, T`KL \(=\tfrac12(1+0.25-1+1.386)=0.818\)`], [T`\(\mu=0,\ \sigma=1\)`, T`KL 0: exactly the prior`], [T`\(\mu=(0.5,-1)\), \(\sigma=(1,0.5)\)`, T`KL \(0.125+0.818=0.943\)`], [T`the bars experiment with β = 4`, T`codes pulled onto the prior; blurred reconstructions`]],
        pitfall: T`β trades the two terms. Near 0 the codes scatter, with gaps that decode to nonsense; a large β makes the encoder ignore its input (posterior collapse). Stable Diffusion’s autoencoder uses a very small β.`,
        seeAlso: [67]
      }
    ]
  });

  add(67, {
    builds: [{lesson: 66, why: 'z = μ + σε and the ELBO behind the training loss'}, {lesson: 23, why: 'variances of independent Gaussians add'}, {lesson: 56, why: 'the U-Net that predicts the noise'}],
    recall: ['gaussian-conditioning', 'reparameterization-trick', 'evidence-lower-bound', 'cross-attention', 'sinusoidal-positional-encoding'],
    symbols: [
      ['ᾱ_t', 'signal fraction: the product of (1 − β) over the first t steps', 'forward-diffusion-process'],
      ['ε', 'standard Gaussian noise mixed into the image', 'forward-diffusion-process'],
      ['ε_θ', 'the network’s prediction of the noise in x_t', 'noise-prediction-loss'],
      ['x̂₀', 'the current estimate of the clean image, computed from ε_θ', 'noise-prediction-loss'],
      ['∇ ln p_t', 'score: the direction in which the noisy data become more likely', 'score-function'],
      ['w', 'guidance weight: how far to push past the unconditional prediction', 'classifier-free-guidance']
    ],
    terms: [
      {
        id: 'forward-diffusion-process', term: 'Forward noising and the signal fraction ᾱ', symbol: T`x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon`,
        plain: T`A diffusion model trains on images that are destroyed gradually: each of T steps scales the image by \(\sqrt{1-\beta_t}\) and adds Gaussian noise of variance \(\beta_t\). Because Gaussians compose, step t can be reached in one jump. \(\bar\alpha_t\) is the share of signal power left; it falls from almost 1 to almost 0.`,
        formula: T`\bar\alpha_t=\prod_{s=1}^{t}(1-\beta_s),\qquad x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon,\qquad \mathrm{SNR}=\frac{\bar\alpha_t}{1-\bar\alpha_t}`,
        steps: [T`Multiply \(1-\beta_s\) over the first t steps to get \(\bar\alpha_t\).`, T`Draw \(\varepsilon\) from \(\mathcal N(0,I)\).`, T`Mix: \(x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon\).`],
        examples: [[T`\(\beta=(0.1,\ 0.2,\ 0.25)\)`, T`\(\bar\alpha_3=0.54\), SNR 1.174`], [T`\(\bar\alpha=0.64\), \(x_0=2\), \(\varepsilon=-1\)`, T`\(x_t=0.8\cdot2+0.6\cdot(-1)=1.0\)`], [T`DDPM: β from 0.0001 to 0.02, T = 1000`, T`\(\bar\alpha_{1000}\approx4.0\times10^{-5}\): nearly pure noise`]],
        plot: {fn: 'x => { let a = 1; for (let t = 0; t < Math.round(x); t++) a *= 1 - (1e-4 + (0.02 - 1e-4) * t / 999); return a; }', x: [0, 1000], y: [0, 1], xLabel: 'step t (DDPM schedule)', yLabel: 'ᾱ_t', marks: [259, 500]},
        pitfall: T`\(\bar\alpha\) measures signal power; the signal itself is scaled by \(\sqrt{\bar\alpha}\). Mixing the two up gives the wrong noise level.`
      },
      {
        id: 'noise-prediction-loss', term: 'Noise prediction and the denoiser it gives', symbol: T`\bigl\|\varepsilon-\varepsilon_\theta(x_t,t)\bigr\|^2`,
        plain: T`The network sees a noisy image \(x_t\) and its step t, and is trained to output the noise that was added; undoing the mix then estimates the clean image. Many clean images could give the same \(x_t\), so the best possible prediction is the average noise \(\mathbb E[\varepsilon\mid x_t]\), and the estimate is the posterior mean \(\mathbb E[x_0\mid x_t]\) (Tweedie’s formula).`,
        formula: T`\mathcal L=\mathbb E\,\bigl\|\varepsilon-\varepsilon_\theta(x_t,t)\bigr\|^2,\qquad \hat x_0=\frac{x_t-\sqrt{1-\bar\alpha_t}\,\varepsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}}`,
        steps: [T`Pick a training image, a step t and noise ε, and form \(x_t\).`, T`Compare the network’s \(\varepsilon_\theta(x_t,t)\) with ε by squared error.`, T`At any time, turn a prediction into a clean estimate with the formula for \(\hat x_0\).`],
        examples: [[T`\(x_t=1\), \(\bar\alpha=0.64\), true noise −1`, T`\(\hat x_0=(1+0.6)/0.8=2\)`], [T`data \(\mathcal N(0,4)\), \(\bar\alpha=0.5\)`, T`optimum \(\mathbb E[x_0\mid x_t]=1.131\,x_t\), \(\mathbb E[\varepsilon\mid x_t]=0.283\,x_t\)`], [T`data ±1, \(\bar\alpha=0.64\), \(x_t=0.5\)`, T`\(\mathbb E[x_0\mid x_t]=\tanh(1.111)=0.804\)`]],
        pitfall: T`At high noise the best \(\hat x_0\) is a blurry average, not a sharp image. Sampling sharpens it step by step; one jump from pure noise gives only the mean of the data.`
      },
      {
        id: 'score-function', term: 'Score of a density', symbol: T`\nabla_x\ln p(x)`,
        plain: T`The score is the gradient of the log-density: at each point, an arrow towards where the data are more likely. For the noisy data of a diffusion model it equals the optimal predicted noise times \(-1/\sqrt{1-\bar\alpha_t}\), so a noise predictor is a score estimator, and one step along the score gives the denoised estimate.`,
        formula: T`\nabla_{x_t}\ln p_t(x_t)=-\frac{\mathbb E[\varepsilon\mid x_t]}{\sqrt{1-\bar\alpha_t}},\qquad \sqrt{\bar\alpha_t}\,\mathbb E[x_0\mid x_t]=x_t+(1-\bar\alpha_t)\,\nabla\ln p_t(x_t)`,
        steps: [T`For a 1-D Gaussian \(\mathcal N(0,v)\), \(\ln p=-x^2/(2v)+\text{const}\), so the score is \(-x/v\).`, T`For noisy data, divide the predicted noise by \(-\sqrt{1-\bar\alpha_t}\).`, T`Tweedie: add \(1-\bar\alpha_t\) times the score to \(x_t\), then divide by \(\sqrt{\bar\alpha_t}\).`],
        examples: [[T`data \(\mathcal N(0,4)\), \(\bar\alpha=0.64\), \(x_t=1\)`, T`\(\operatorname{Var}(x_t)=2.92\); score \(-1/2.92=-0.342\)`], [T`the same point`, T`\(\mathbb E[x_0\mid x_t]=(1+0.36\cdot(-0.342))/0.8=1.096\)`], [T`data \(\mathcal N(0,4)\), \(\bar\alpha=0.2\), \(x_t=1\)`, T`score \(-0.625\); \(\mathbb E[x_0\mid x_t]=1.118\)`]],
        pitfall: T`The score is a gradient with respect to the data x, not the network’s weights. It needs no normalising constant, because the log of a constant has zero gradient.`
      },
      {
        id: 'ddim-sampling', term: 'DDPM and DDIM sampling steps', symbol: T`x_{t-1}=\sqrt{\bar\alpha_{t-1}}\,\hat x_0+\sqrt{1-\bar\alpha_{t-1}}\,\varepsilon_\theta`,
        plain: T`Generation starts from pure noise and repeatedly moves to a lower noise level. DDIM estimates the clean image \(\hat x_0\), then re-noises it to the next level with the same predicted noise: it is deterministic and can skip steps. DDPM also adds fresh random noise at every step and normally uses all of them.`,
        formula: T`x_{t-1}=\sqrt{\bar\alpha_{t-1}}\,\hat x_0+\sqrt{1-\bar\alpha_{t-1}-\sigma_t^2}\;\varepsilon_\theta+\sigma_tz,\qquad \sigma_t=0\ \text{for DDIM}`,
        steps: [T`Predict the noise and form \(\hat x_0=(x_t-\sqrt{1-\bar\alpha_t}\,\varepsilon_\theta)/\sqrt{\bar\alpha_t}\).`, T`Scale \(\hat x_0\) by \(\sqrt{\bar\alpha_{t-1}}\) and add \(\sqrt{1-\bar\alpha_{t-1}-\sigma_t^2}\) times the predicted noise.`, T`DDPM-style: also add \(\sigma_tz\) with fresh \(z\sim\mathcal N(0,I)\); DDIM uses \(\sigma_t=0\).`],
        examples: [[T`\(\bar\alpha\): 0.64 → 0.81, \(x_t=1\), \(\hat\varepsilon=-1\)`, T`\(\hat x_0=2\); \(x_{t-1}=1.8-0.436=1.364\)`], [T`\(\bar\alpha\): 0.36 → 0.64, \(x_t=0.2\), \(\hat\varepsilon=0.5\)`, T`\(\hat x_0=-0.333\); \(x_{t-1}=0.033\)`], [T`the last step, \(\bar\alpha_{t-1}=1\)`, T`the sample is \(\hat x_0\)`]],
        pitfall: T`Too few steps do not merely leave noise: each big step trusts a blurry \(\hat x_0\), so samples drift towards the average of the data. Fast samplers use better ODE solvers, not just fewer Euler steps.`
      },
      {
        id: 'euler-method', term: 'Euler’s method for differential equations', symbol: T`y_{n+1}=y_n+h\,f(y_n,t_n)`,
        plain: T`A differential equation \(dy/dt=f(y,t)\) says how fast a quantity changes. Euler’s method follows it in small steps: from the current value, move by the step size h times the current rate of change. Gradient descent is Euler’s method on the gradient flow, and DDIM is, in rescaled variables, an Euler step of the probability-flow ODE that carries noise to data.`,
        formula: T`y_{n+1}=y_n+h\,f(y_n,t_n),\qquad t_{n+1}=t_n+h`,
        steps: [T`Evaluate the rate \(f(y_n,t_n)\) at the current point.`, T`Step: \(y_{n+1}=y_n+h\,f(y_n,t_n)\) and \(t_{n+1}=t_n+h\).`, T`Halve h to check the answer: its error should roughly halve.`],
        examples: [[T`\(dy/dt=-y\), \(y(0)=1\), \(h=0.5\), two steps`, T`\(1\to0.5\to0.25\); exact \(e^{-1}=0.368\)`], [T`the same with \(h=0.25\), four steps`, T`\(0.75^4=0.316\): closer`], [T`gradient descent on \(L=w^2\), rate 0.1, from \(w=1\)`, T`\(w\leftarrow1-0.1\cdot2=0.8\): an Euler step of \(dw/dt=-2w\)`]],
        pitfall: T`Euler’s error shrinks only in proportion to h. Heun’s method averages two slopes per step and is far more accurate for similar work, which is why some diffusion samplers use it.`
      },
      {
        id: 'classifier-free-guidance', term: 'Classifier-free guidance', symbol: T`\tilde\varepsilon=\varepsilon_\varnothing+w(\varepsilon_c-\varepsilon_\varnothing)`,
        plain: T`One network is trained both with a condition c (a class or a text prompt) and, some of the time, with an empty condition ∅. At sampling time the two predictions are combined; a weight w above 1 pushes past the conditional prediction, away from the unconditional one, so images follow the condition more closely but vary less.`,
        formula: T`\tilde\varepsilon=\varepsilon_\theta(x_t,t,\varnothing)+w\bigl(\varepsilon_\theta(x_t,t,c)-\varepsilon_\theta(x_t,t,\varnothing)\bigr)`,
        steps: [T`Run the network twice: with the condition and with the empty condition.`, T`Subtract them: the difference is what the condition adds.`, T`Add w times the difference to the unconditional prediction, and use the result in the sampling step.`],
        examples: [[T`\(\varepsilon_\varnothing=0.2\), \(\varepsilon_c=0.5\), w = 3`, T`\(0.2+3\cdot0.3=1.1\)`], [T`w = 0`, T`0.2: the condition is ignored`], [T`w = 1`, T`0.5: the plain conditional model`], [T`\(\varepsilon_\varnothing=(0.2,-0.1)\), \(\varepsilon_c=(0.5,0.3)\), w = 3`, T`\((1.1,\ 1.1)\)`]],
        pitfall: T`Guidance doubles the network evaluations per step, and a very large w oversaturates images. w is chosen at sampling time; it is not learned.`
      }
    ]
  });

  add(68, {
    builds: [{lesson: 51, why: 'the pinhole projection and the camera rotation'}, {lesson: 19, why: 'a Jacobian linearises the projection'}, {lesson: 23, why: 'covariance matrices describe a Gaussian’s shape'}],
    recall: ['multivariate-gaussian', 'jacobian', 'pinhole-projection', 'gaussian-linear-transform', 'alpha-compositing'],
    symbols: [
      ['Σ', '3D covariance of one Gaussian: its size, shape and orientation', 'scale-rotation-covariance'],
      ['R, S', 'a rotation (from a unit quaternion) and the three standard deviations', 'scale-rotation-covariance'],
      ['J', 'Jacobian of the pinhole projection at the Gaussian’s centre', 'ewa-splat-projection'],
      ['W', 'the rotation from world to camera coordinates'],
      ['Σ′', 'projected 2 × 2 covariance of the splat, in pixels²', 'ewa-splat-projection'],
      ['αᵢ', 'opacity of splat i at a pixel: o·exp(−½ dᵀΣ′⁻¹d)', 'splat-footprint']
    ],
    terms: [
      {
        id: 'gaussian-splatting', term: '3D Gaussian splatting', symbol: T`(\mu,\ q,\ s,\ o,\ c)`,
        plain: T`A way to represent a scene for rendering: a large set of 3D Gaussians, each with a centre, a shape (a rotation and three scales), an opacity and a colour. A view is rendered by projecting every Gaussian to a 2D splat on the image and blending the splats in depth order. Every step is differentiable, so the Gaussians are fitted to photographs by gradient descent.`,
        formula: T`C(p)=\sum_ic_i\,\alpha_i(p)\prod_{j<i}\bigl(1-\alpha_j(p)\bigr),\qquad \alpha_i(p)=o_i\,e^{-\frac12(p-\mu_i')^T\Sigma_i'^{-1}(p-\mu_i')}`,
        steps: [T`Move each Gaussian’s centre into the camera frame and project it to a pixel.`, T`Project its covariance to a 2 × 2 matrix Σ′ with the camera Jacobian.`, T`Sort the splats by depth and composite them front to back at every pixel.`, T`Compare the result with the photo and update every parameter by gradient descent.`],
        examples: [[T`a typical captured scene`, T`1 to 5 million Gaussians, rendered in real time`], [T`numbers per Gaussian with degree-3 colour`, T`3 + 4 + 3 + 1 + 48 = 59`], [T`the lab’s coffee scene`, T`600 Gaussians, one per 8 × 8 block of the photo`]],
        pitfall: T`Splats are not points: each covers many pixels and has an orientation. Unlike NeRF, no network is evaluated at render time; all the information is stored in the Gaussians themselves.`
      },
      {
        id: 'scale-rotation-covariance', term: 'Covariance from a rotation and scales', symbol: T`\Sigma=RSS^TR^T`,
        plain: T`A covariance matrix must be symmetric and give a non-negative variance in every direction, which gradient steps on its raw entries can break. Writing it as \(RSS^TR^T\), with a rotation R and a diagonal matrix S of standard deviations, gives a valid covariance for any parameters: the columns of R are the axes of the ellipsoid and the \(s_k^2\) are the variances along them.`,
        formula: T`\Sigma=RSS^TR^T,\qquad v^T\Sigma v=\|S^TR^Tv\|^2\ge0,\qquad \Sigma r_k=s_k^2\,r_k`,
        steps: [T`Square the scales: \(SS^T=\operatorname{diag}(s_1^2,s_2^2,s_3^2)\).`, T`Rotate: \(\Sigma=R\operatorname{diag}(s_k^2)R^T\).`, T`In 2D with angle θ: \(\Sigma_{xx}=s_1^2\cos^2\theta+s_2^2\sin^2\theta\) and \(\Sigma_{xy}=(s_1^2-s_2^2)\sin\theta\cos\theta\).`],
        examples: [[T`\(S=\operatorname{diag}(0.3,0.1,0.1)\), no rotation`, T`\(\Sigma=\operatorname{diag}(0.09,0.01,0.01)\)`], [T`the same turned 90° about z`, T`\(\Sigma=\operatorname{diag}(0.01,0.09,0.01)\)`], [T`turned 45° about z`, T`\(\Sigma_{xx}=\Sigma_{yy}=0.05\), \(\Sigma_{xy}=0.04\)`], [T`2D: scales 2 and 1, rotated 30°`, T`\(\Sigma=\begin{bmatrix}3.25&1.299\\1.299&1.75\end{bmatrix}\), determinant 4`]],
        pitfall: T`The scales are standard deviations, so the variances are their squares. The same Σ also comes from several (R, S) pairs, for example by swapping two axes together with their scales.`
      },
      {
        id: 'unit-quaternion', term: 'Unit quaternion for a rotation', symbol: T`q=(w,x,y,z)`,
        plain: T`Four numbers with \(w^2+x^2+y^2+z^2=1\) that describe a 3D rotation. A rotation by the angle θ about the unit axis n is \(q=(\cos\tfrac\theta2,\ \sin\tfrac\theta2\,n)\). Quaternions are easy to optimise: update the four numbers freely, then divide them by their length.`,
        formula: T`R=\begin{bmatrix}1-2(y^2+z^2)&2(xy-wz)&2(xz+wy)\\2(xy+wz)&1-2(x^2+z^2)&2(yz-wx)\\2(xz-wy)&2(yz+wx)&1-2(x^2+y^2)\end{bmatrix}`,
        steps: [T`Halve the angle: \(w=\cos\tfrac\theta2\) and \((x,y,z)=\sin\tfrac\theta2\,n\).`, T`Check the length \(w^2+x^2+y^2+z^2=1\); if it is not 1, divide by it.`, T`Fill R from the formula. About the z-axis it reduces to a 2D rotation: \(R_{11}=1-2z^2=\cos\theta\), \(R_{21}=2wz=\sin\theta\).`],
        examples: [[T`90° about z`, T`\(q=(0.7071,0,0,0.7071)\); \(R_{11}=0\), \(R_{21}=1\)`], [T`45° about z`, T`\(q=(0.9239,0,0,0.3827)\)`], [T`180° about z`, T`\(q=(0,0,0,1)\); \(R_{11}=-1\)`], [T`\(q\) and \(-q\)`, T`the same rotation`]],
        pitfall: T`The angle is halved inside the quaternion, and q and −q give the same rotation (the double cover of Lesson 51). Forgetting to renormalise makes R a rotation times a scale.`
      },
      {
        id: 'ewa-splat-projection', term: 'Projecting a Gaussian with the camera Jacobian', symbol: T`\Sigma'=JW\Sigma W^TJ^T`,
        plain: T`The pinhole projection is not linear, so a projected 3D Gaussian is not exactly a 2D Gaussian. Splatting linearises the projection at the Gaussian’s centre with its Jacobian J, then applies the rule that a linear map A turns a covariance Σ into \(A\Sigma A^T\). The result Σ′ is the 2 × 2 covariance of the splat, in pixels².`,
        formula: T`J=\begin{bmatrix}f_x/z&0&-f_xx/z^2\\0&f_y/z&-f_yy/z^2\end{bmatrix},\qquad \Sigma'=JW\Sigma W^TJ^T`,
        steps: [T`Rotate the covariance into the camera frame: \(W\Sigma W^T\).`, T`Compute J at the camera-frame centre (x, y, z).`, T`Multiply \(J(W\Sigma W^T)J^T\). For a diagonal Σ, \(\Sigma'_{ij}=\sum_kJ_{ik}J_{jk}\Sigma_{kk}\).`],
        examples: [[T`f = 100, \(\Sigma=\operatorname{diag}(0.01,0.01,0.04)\), centre (0, 0, 2)`, T`\(J=\begin{bmatrix}50&0&0\\0&50&0\end{bmatrix}\), \(\Sigma'=\operatorname{diag}(25,25)\)`], [T`the same at (0.4, 0, 2)`, T`\(J_{13}=-10\); \(\Sigma'=\operatorname{diag}(29,25)\)`], [T`the same at (0, 0, 4)`, T`\(\Sigma'=\operatorname{diag}(6.25,6.25)\): half the size`], [T`f = 200, \(\Sigma=\operatorname{diag}(0.04,0.01,0.09)\), (0.5, −0.2, 2.5)`, T`\(\Sigma'_{xx}=279.04\), \(\Sigma'_{yy}=67.69\), \(\Sigma'_{xy}=-9.216\)`]],
        pitfall: T`The approximation is good for small Gaussians and poor for large ones near the edge of the view, where the projection bends most. The camera translation moves the centre but does not change Σ′ directly.`
      },
      {
        id: 'splat-footprint', term: 'Splat footprint and depth-sorted blending', symbol: T`\alpha_i(p)=o_i\,e^{-\frac12d^T\Sigma_i'^{-1}d}`,
        plain: T`At a pixel p, a splat contributes its opacity times a 2D Gaussian bump around its projected centre. The splats are sorted by the depth of their centres and blended front to back: each colour is weighted by its α and by the transmittance left by the splats in front. The transmittance left over does not depend on the order, but the colour does.`,
        formula: T`d=p-\mu_i',\qquad \alpha_i=o_i\exp\bigl(-\tfrac12d^T\Sigma_i'^{-1}d\bigr),\qquad C=\sum_ic_i\alpha_i\prod_{j<i}(1-\alpha_j)`,
        steps: [T`Offset from the centre: \(d=p-\mu'\). With a diagonal Σ′, \(d^T\Sigma'^{-1}d=d_x^2/\Sigma'_{xx}+d_y^2/\Sigma'_{yy}\).`, T`\(\alpha=o\,e^{-\frac12d^T\Sigma'^{-1}d}\); skip the splat where α < 1/255.`, T`Front to back: add \(T\alpha c\), then multiply T by \(1-\alpha\); stop once T is tiny.`],
        examples: [[T`o = 0.8, \(\Sigma'=\operatorname{diag}(29,25)\), 5 px to the right`, T`\(d^2=0.862\); \(\alpha=0.520\)`], [T`o = 0.9, \(\Sigma'=\operatorname{diag}(16,4)\), offset (4, 2)`, T`\(d^2=2\); \(\alpha=0.331\)`], [T`red (α = 0.5) in front of blue (α = 0.8)`, T`(0.5, 0, 0.4); transmittance left 0.1`], [T`the same in the wrong order`, T`(0.1, 0, 0.8); transmittance left still 0.1`]],
        pitfall: T`Sorting by centre depth is only approximate when large splats pass through each other, which makes them pop as the camera moves. Without any sorting, far splats can cover near ones.`
      }
    ]
  });
})();
