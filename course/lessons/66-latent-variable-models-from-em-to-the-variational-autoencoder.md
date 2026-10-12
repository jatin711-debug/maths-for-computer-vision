# Lesson 66 - Latent-variable models: from EM to the variational autoencoder

**Module:** 17 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 21, 23, 25 and 54; Lesson 60 treats the multivariate Gaussian in depth. Revisit Bayes' theorem, the Gaussian density, maximum likelihood and the KL divergence if they feel unfamiliar.

**Goal:** Fit a Gaussian mixture with EM, derive the ELBO from Jensen's inequality, and train a VAE with the reparameterisation trick and the closed-form Gaussian KL.

## A hidden variable explains the data

A latent variable is a quantity that is never observed but helps explain what is. Which of a few colour clusters produced a pixel's colour, or which object a pixel belongs to, are latent variables. A Gaussian mixture model makes this precise: first choose a component k with probability \(\pi_k\), then draw x from that component's Gaussian. Summing over the unobserved choice (Lesson 22) gives the density of x:

\[
p(x)=\sum_{k=1}^{K}\pi_k\,\mathcal N(x;\mu_k,\Sigma_k),\qquad \pi_k\ge0,\quad \sum_k\pi_k=1.
\]

Given a point, Bayes' theorem (Lesson 21) says how likely each component is to have produced it. This posterior probability is the responsibility:

\[
r_k(x)=\frac{\pi_k\,\mathcal N(x;\mu_k,\Sigma_k)}{\sum_j\pi_j\,\mathcal N(x;\mu_j,\Sigma_j)}.
\]

Take two 1-D components with \(\pi=(\tfrac12,\tfrac12)\), means 0 and 4 and \(\sigma=1\). At x = 1 the densities are \(\mathcal N(1;0,1)=0.2420\) and \(\mathcal N(1;4,1)=0.00443\), so the responsibilities are (0.982, 0.018): the point almost certainly came from the first component. At x = 2, halfway between the means, they are (0.5, 0.5). The log-likelihood of x = 1 is \(\ln(0.5\cdot0.2420+0.5\cdot0.00443)=-2.094\).

## EM: alternate soft assignments and weighted fits

Maximising \(\sum_n\ln p(x_n)\) directly is awkward, because the logarithm sits outside a sum. The expectation-maximisation (EM) algorithm alternates two easy steps. The E-step computes the responsibilities \(r_{nk}\) of every point with the current parameters. The M-step refits each component by weighted maximum likelihood (Lesson 25), with each point weighted by its responsibility:

\[
N_k=\sum_nr_{nk},\qquad \mu_k=\frac1{N_k}\sum_nr_{nk}x_n,\qquad \Sigma_k=\frac1{N_k}\sum_nr_{nk}(x_n-\mu_k)(x_n-\mu_k)^T,\qquad \pi_k=\frac{N_k}{N}.
\]

For the points (0, 1, 3, 4) with first-component responsibilities (1, 0.8, 0.2, 0), the first component gets \(N_1=2\), \(\mu_1=(0+0.8+0.6+0)/2=0.7\), variance \((0.49+0.072+1.058)/2=0.81\) and \(\pi_1=2/4=0.5\).

If every component has the same variance \(\sigma^2I\) and \(\sigma\) shrinks towards 0, the responsibilities become 0 or 1: each point belongs entirely to its nearest mean, and the M-step sets each mean to the average of its points. That is k-means, so k-means is the hard-assignment limit of EM. It is behind colour quantisation, SLIC superpixels, the anchor boxes of YOLO and the codebooks of bag-of-words retrieval.

## Jensen's inequality and the evidence lower bound

The logarithm is concave: every chord lies below its curve. Jensen's inequality states the consequence for averages, \(\ln\mathbb E[Y]\ge\mathbb E[\ln Y]\). If Y is 1 or 4 with probability ½ each, \(\ln\mathbb E[Y]=\ln2.5=0.916\) but \(\mathbb E[\ln Y]=\tfrac12\ln4=0.693\).

Apply it to any distribution q(z) over the latent variable. Multiply and divide inside the sum, then move the logarithm inside:

\[
\ln p(x)=\ln\sum_zq(z)\frac{p(x,z)}{q(z)}\ \ge\ \sum_zq(z)\ln\frac{p(x,z)}{q(z)}=\mathcal L(q),\qquad \ln p(x)=\mathcal L(q)+\mathrm{KL}\bigl(q(z)\,\|\,p(z|x)\bigr).
\]

\(\mathcal L(q)\) is the evidence lower bound (ELBO), and the gap is a KL divergence (Lesson 54), which is never negative and is 0 only when q is the true posterior. The E-step sets q to the posterior, so the bound touches \(\ln p(x)\); the M-step then raises the bound with q held fixed. The new likelihood is at least the raised bound, which is at least the old likelihood, so EM never lowers the likelihood.

At x = 1 above, \(\ln p(x)=-2.094\). With q equal to the responsibilities (0.982, 0.018) the bound equals −2.094. With the hard assignment q = (1, 0) of k-means, \(\mathcal L=\ln(0.5\cdot0.2420)=-2.112\), lower by \(\mathrm{KL}=-\ln0.982=0.018\). Writing \(p(x,z)=p(x|z)p(z)\) splits the bound into the form a VAE uses:

\[
\mathcal L(q)=\mathbb E_{q(z)}\bigl[\ln p(x|z)\bigr]-\mathrm{KL}\bigl(q(z)\,\|\,p(z)\bigr),
\]

an expected reconstruction score minus a penalty for straying from the prior.

## The variational autoencoder

When z is a continuous vector and \(p(x|z)\) is a neural network, the decoder, the posterior \(p(z|x)\) has no closed form, so the E-step cannot be done exactly. A variational autoencoder trains a second network, the encoder, to output a Gaussian \(q(z|x)=\mathcal N(\mu(x),\operatorname{diag}\sigma(x)^2)\) for each input, and maximises the bound over both networks with the prior \(p(z)=\mathcal N(0,I)\). For one latent dimension the KL term has a closed form:

\[
\mathrm{KL}\bigl(\mathcal N(\mu,\sigma^2)\,\|\,\mathcal N(0,1)\bigr)=\tfrac12\bigl(\mu^2+\sigma^2-1-\ln\sigma^2\bigr).
\]

It is 0 for \(\mu=0,\ \sigma=1\) and 0.818 for \(\mu=1,\ \sigma=0.5\); the dimensions add. The reconstruction term is a squared error for a Gaussian decoder (Lesson 25) or a binary cross-entropy for binary pixels.

The expectation is estimated with a sample of z, and a sampling step would block the gradient. The reparameterisation trick moves the randomness into an input: draw \(\varepsilon\sim\mathcal N(0,1)\) and set \(z=\mu+\sigma\varepsilon\). Then \(\partial z/\partial\mu=1\) and \(\partial z/\partial\sigma=\varepsilon\), so backpropagation passes through. With \(\mu=1\), \(\sigma=0.5\) and \(\varepsilon=-0.4\), \(z=0.8\); a downstream loss \((z-2)^2\) has derivative −2.4, so \(\partial L/\partial\mu=-2.4\) and \(\partial L/\partial\sigma=-2.4\cdot(-0.4)=0.96\).

Many models weight the KL term by β. A large β pulls every \(q(z|x)\) towards the prior: the latent space becomes smooth and easy to sample, but reconstructions blur, and at the extreme the encoder ignores its input. A β near 0 gives a plain autoencoder, whose codes can scatter with gaps that decode to nonsense. Stable Diffusion's autoencoder uses a very small KL weight so that its latent space stays compact and well scaled for the diffusion model of Lesson 67; VQ-VAE and VQGAN replace the Gaussian with the nearest entry of a learned codebook, a k-means step inside the network.

## Practice before opening the answers

1. A mixture has \(\pi=(0.3,0.7)\), means 0 and 2 and \(\sigma=1\). Compute the responsibilities and the log-likelihood of x = 0.5.
2. For the points (0, 1, 3, 4) with second-component responsibilities (0, 0.2, 0.8, 1), carry out the M-step for that component: \(N_2\), \(\mu_2\), its variance and \(\pi_2\).
3. An encoder outputs \(\mu=(0.5,-1)\) and \(\sigma=(1,0.5)\) for a 2-D latent. Compute the KL divergence to \(\mathcal N(0,I)\), dimension by dimension.
4. For x = 1 in the lesson's mixture, compute the bound \(\mathcal L(q)\) for q = (0.5, 0.5) and show that its gap to \(\ln p(x)\) equals \(\mathrm{KL}(q\,\|\,r)\).

## Check your understanding

Compute responsibilities and one M-step for a small mixture, derive the ELBO from Jensen's inequality and explain why EM never lowers the likelihood, and explain what the reparameterisation trick and the KL term do in a VAE.

## Read with a purpose

MML Chapter 11 (11.1-11.4) for Gaussian mixtures, EM and the latent-variable view, with MML 8.4.3 and 10.7 for latent-variable models more generally, MML 7.3 for the convexity behind Jensen's inequality and MML 6.5.4 for sampling a Gaussian as a mean plus scaled noise. CV 5.2.1-5.2.2 covers k-means and mixtures in vision, and CV 5.5.4 places VAEs among generative models. For the VAE itself read Kingma and Welling 2014, "Auto-Encoding Variational Bayes". Record one connection and one question; reading is part of your weekly study time.
