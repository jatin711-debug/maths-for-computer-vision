# Lesson 67 - Diffusion models: noising, denoising and sampling

**Module:** 17 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 23, 25, 56 and 66; Lesson 60 for conditioning a Gaussian and Lesson 65 for cross-attention. Revisit sums of independent Gaussians, the reparameterisation \(z=\mu+\sigma\varepsilon\) and the U-Net if they feel unfamiliar.

**Goal:** Derive closed-form forward noising, show that predicting the noise is denoising score matching, and sample with DDPM and DDIM steps and classifier-free guidance.

## Destroy the data slowly, in closed form

A diffusion model learns to undo a process that turns images into noise. The forward process is a chain \(x_0\to x_1\to\cdots\to x_T\). Each step shrinks the current image a little and adds a little Gaussian noise:

\[
q(x_t\mid x_{t-1})=\mathcal N\bigl(\sqrt{1-\beta_t}\,x_{t-1},\ \beta_tI\bigr).
\]

The noise schedule \(\beta_t\) is small; DDPM uses T = 1000 steps with \(\beta_t\) rising linearly from 0.0001 to 0.02. A sum of independent Gaussians is Gaussian and their variances add (Lesson 23), so the steps compose. With \(\alpha_t=1-\beta_t\) and \(\bar\alpha_t=\alpha_1\alpha_2\cdots\alpha_t\),

\[
q(x_t\mid x_0)=\mathcal N\bigl(\sqrt{\bar\alpha_t}\,x_0,\ (1-\bar\alpha_t)I\bigr),\qquad x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon,\quad \varepsilon\sim\mathcal N(0,I).
\]

Two steps show why: \(x_2=\sqrt{\alpha_2}(\sqrt{\alpha_1}x_0+\sqrt{1-\alpha_1}\varepsilon_1)+\sqrt{1-\alpha_2}\varepsilon_2\), whose noise variance is \(\alpha_2(1-\alpha_1)+(1-\alpha_2)=1-\alpha_1\alpha_2\). So any noise level can be reached in one jump, with the reparameterisation of Lesson 66. The signal-to-noise ratio \(\bar\alpha_t/(1-\bar\alpha_t)\) falls from about 10,000 at t = 1 to 1 near t = 259 and to almost 0 at t = 1000, where \(\bar\alpha_T=4.0\times10^{-5}\) and \(x_T\) is close to pure noise \(\mathcal N(0,I)\), whatever the image was. For example, \(\beta=(0.1,0.2,0.25)\) gives \(\bar\alpha_3=0.9\cdot0.8\cdot0.75=0.54\). With \(\bar\alpha=0.64\), so that \(\sqrt{\bar\alpha}=0.8\) and \(\sqrt{1-\bar\alpha}=0.6\), the value \(x_0=2\) with noise \(\varepsilon=-1\) becomes \(x_t=1.6-0.6=1.0\).

## Predict the noise, and you have a denoiser

A network \(\varepsilon_\theta(x_t,t)\), usually a U-Net (Lesson 56) or a transformer, is trained to recover the noise. Draw an image \(x_0\), a step t and noise ε, form \(x_t\), and minimise

\[
\mathcal L=\mathbb E_{x_0,t,\varepsilon}\bigl\|\varepsilon-\varepsilon_\theta(x_t,t)\bigr\|^2,\qquad \hat x_0=\frac{x_t-\sqrt{1-\bar\alpha_t}\,\varepsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}}.
\]

Knowing the noise gives the image back: \(\hat x_0=(1.0+0.6\cdot1)/0.8=2\). Ho et al. derived this loss as a reweighted ELBO (Lesson 66). But the network sees only \(x_t\), and many pairs \((x_0,\varepsilon)\) produce the same \(x_t\). A squared-error loss is minimised by the conditional mean, so the best possible network outputs \(\mathbb E[\varepsilon\mid x_t]\), and \(\hat x_0\) becomes \(\mathbb E[x_0\mid x_t]\), the average clean image consistent with what it sees. This is Tweedie's formula.

For Gaussian data \(x_0\sim\mathcal N(0,s^2)\) the conditioning rule of Lesson 60 gives the optimal denoiser exactly. With \(s^2=4\) and \(\bar\alpha=0.5\), \(\operatorname{Var}(x_t)=0.5\cdot4+0.5=2.5\), and

\[
\mathbb E[x_0\mid x_t]=\frac{\sqrt{\bar\alpha}\,s^2}{\bar\alpha s^2+1-\bar\alpha}\,x_t=1.131\,x_t,\qquad \mathbb E[\varepsilon\mid x_t]=\frac{\sqrt{1-\bar\alpha}}{\bar\alpha s^2+1-\bar\alpha}\,x_t=0.283\,x_t.
\]

For data that are +1 or −1 with equal probability, at \(\bar\alpha=0.64\), the same reasoning gives \(\mathbb E[x_0\mid x_t]=\tanh(2.22\,x_t)\), which is 0.804 at \(x_t=0.5\); a Monte Carlo average over two million noisy samples agrees. The best denoiser makes a soft choice between the training examples.

The predicted noise is also a score: the gradient of the log-density of the noisy data, which points towards where data are more likely,

\[
\nabla_{x_t}\ln p_t(x_t)=-\frac{\mathbb E[\varepsilon\mid x_t]}{\sqrt{1-\bar\alpha_t}}.
\]

So training a noise predictor is denoising score matching (Song et al. 2021).

## Sampling: walk the noise back

To generate, start from \(x_T\sim\mathcal N(0,I)\) and step towards less noise. DDPM's ancestral step removes a little predicted noise and adds fresh noise \(z\sim\mathcal N(0,I)\):

\[
x_{t-1}=\frac{1}{\sqrt{\alpha_t}}\Bigl(x_t-\frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\,\varepsilon_\theta(x_t,t)\Bigr)+\sigma_tz,
\]

with \(\sigma_t^2\) close to \(\beta_t\), repeated for all 1000 steps. DDIM instead jumps to the next, smaller noise level with no fresh noise: estimate the clean image, then re-noise it with the same predicted noise,

\[
x_{t-1}=\sqrt{\bar\alpha_{t-1}}\,\hat x_0+\sqrt{1-\bar\alpha_{t-1}}\,\varepsilon_\theta(x_t,t).
\]

From \(\bar\alpha_t=0.64\) to \(\bar\alpha_{t-1}=0.81\), with \(x_t=1\) and predicted noise −1: \(\hat x_0=2\) and \(x_{t-1}=0.9\cdot2+\sqrt{0.19}\cdot(-1)=1.364\). DDIM is deterministic, so one starting noise always gives the same image, and it can skip steps, for example 50 instead of 1000. In suitably rescaled variables it is an Euler step, \(y\leftarrow y+h\,f(y)\), of an ordinary differential equation (the probability-flow ODE) that carries noise to data; better ODE solvers such as Heun's method take even fewer steps.

## Conditioning and guidance

A conditional model \(\varepsilon_\theta(x_t,t,c)\) also receives a condition c, such as a class or a text prompt that the U-Net reads by cross-attention (Lesson 65); the step t enters through a sinusoidal encoding. Classifier-free guidance trains one network both with c and, some of the time, with c replaced by an empty token ∅. At sampling time it extrapolates from the unconditional prediction towards the conditional one:

\[
\tilde\varepsilon=\varepsilon_\theta(x_t,t,\varnothing)+w\bigl(\varepsilon_\theta(x_t,t,c)-\varepsilon_\theta(x_t,t,\varnothing)\bigr).
\]

With \(\varepsilon_\varnothing=0.2\), \(\varepsilon_c=0.5\) and w = 3, \(\tilde\varepsilon=0.2+3\cdot0.3=1.1\): beyond the conditional prediction itself. Larger w gives images that follow the prompt more closely but vary less.

## Why the denoiser must be learned

If the denoiser were exact for the training set itself, a mixture of point masses at the training images, \(\mathbb E[x_0\mid x_t]\) would be a softmax-weighted average of training images, and sampling would reproduce training images: memorisation, which the experiment shows. A trained network is a smooth approximation of that denoiser, and the smoothness is what lets it produce new images. Stable Diffusion runs the whole process in the latent space of a VAE-style autoencoder (Lesson 66). Flow matching, used in SD3 and FLUX, follows the straight path \(x_t=(1-t)x_0+t\varepsilon\) and regresses the velocity \(\varepsilon-x_0\).

## Practice before opening the answers

1. A schedule has \(\beta=(0.1,0.2,0.25)\). Compute \(\bar\alpha_3\), the signal scale \(\sqrt{\bar\alpha_3}\), the noise scale \(\sqrt{1-\bar\alpha_3}\) and the SNR, then noise \(x_0=1.5\) with \(\varepsilon=0.4\).
2. Data are \(x_0\sim\mathcal N(0,4)\). At \(\bar\alpha=0.2\) and \(x_t=1\), compute \(\mathbb E[x_0\mid x_t]\), \(\mathbb E[\varepsilon\mid x_t]\) and the score, and check that \((x_t-\sqrt{1-\bar\alpha}\,\mathbb E[\varepsilon\mid x_t])/\sqrt{\bar\alpha}\) gives the same \(\mathbb E[x_0\mid x_t]\).
3. Take one DDIM step from \(\bar\alpha_t=0.36\) to \(\bar\alpha_{t-1}=0.64\) with \(x_t=0.2\) and predicted noise 0.5.
4. With \(\varepsilon_\varnothing=(0.2,-0.1)\) and \(\varepsilon_c=(0.5,0.3)\), compute the guided noise for w = 0, 1 and 3, and say what each setting means.

## Check your understanding

Derive \(q(x_t\mid x_0)\) from the one-step transitions, explain why a network trained to predict the noise outputs \(\mathbb E[\varepsilon\mid x_t]\) and how that gives a denoiser and a score, and contrast DDPM and DDIM sampling and the effect of the guidance weight.

## Read with a purpose

None of the four books covers diffusion models; CV 5.5.4 surveys generative models before them. For the supporting maths read MML 6.5 on Gaussians and 6.7 on change of variables, and CS205A 13.3 (13.3.1 and 13.3.4) on forward Euler and Runge–Kutta steps. Then read the primary papers: Ho, Jain and Abbeel 2020, "Denoising Diffusion Probabilistic Models"; Song et al. 2021, "Score-Based Generative Modeling through Stochastic Differential Equations"; Song, Meng and Ermon 2021, "Denoising Diffusion Implicit Models"; Ho and Salimans 2022, "Classifier-Free Diffusion Guidance"; and Lipman et al. 2023, "Flow Matching for Generative Modeling". Record one connection and one question; reading is part of your weekly study time.
