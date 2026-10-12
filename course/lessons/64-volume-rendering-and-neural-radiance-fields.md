# Lesson 64 - Volume rendering and neural radiance fields

**Module:** 16 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 51 for the rays of a camera, Lesson 22 for integrals and cumulative distributions, Lesson 04 for the exponential, Lessons 33 and 36 for frequencies and sinusoids, and Lesson 40 for training a network by gradient descent. Lessons 61-63 explain where the camera poses come from.

**Goal:** Render a pixel by integrating density and colour along its camera ray, discretise the integral into alpha compositing, and explain with Fourier-feature positional encoding why NeRF can represent fine detail.

## A pixel looks along a ray

A camera with intrinsics K and extrinsics [R | t] (Lesson 51) sends a ray through every pixel (u, v). The ray starts at the camera centre \(o=-R^Tt\) and points along

\[
d=R^TK^{-1}\begin{bmatrix}u\\v\\1\end{bmatrix},\qquad r(s)=o+s\,d,\quad s\ge0.
\]

Here s measures the distance along the ray, so that t stays the translation. With f = 100, principal point (64, 48) and R = I, the pixel (114, 48) looks along \(d=(0.5,0,1)\): half a unit right for every unit forward.

A neural radiance field (NeRF) describes a scene by two functions of position: a **density** \(\sigma(x)\ge0\), the fraction of light absorbed per unit length, and a **colour** \(c(x,d)\), the light emitted towards direction d. Thin fog has small density; a solid wall has very large density. Nothing about surfaces is assumed: a pixel is computed by looking through the field along its ray.

## Transmittance and the rendering integral

Light from distance s reaches the camera only if nothing in front of it was absorbed. Over a short step ds a fraction \(\sigma\,ds\) is absorbed, so the **transmittance** T, the fraction still passing, obeys \(T(s+ds)=T(s)(1-\sigma\,ds)\), that is \(dT/ds=-\sigma(s)T(s)\) with T(0) = 1. Its solution is an exponential of an integral (Lessons 04 and 22):

\[
T(s)=\exp\Bigl(-\int_0^s\sigma\bigl(r(u)\bigr)\,du\Bigr),\qquad C=\int_{s_n}^{s_f}T(s)\,\sigma\bigl(r(s)\bigr)\,c\bigl(r(s),d\bigr)\,ds+T(s_f)\,c_{\text{bg}}.
\]

A slab of constant density 0.5 and thickness 2 lets through \(T=e^{-1}=0.368\) of the light and absorbs 63%. The product \(T(s)\sigma(s)\) is a probability density for where along the ray the light comes from: it integrates to \(1-T(s_f)\), and the background receives the rest.

## From the integral to alpha compositing

Split the ray between the near and far bounds into N intervals of lengths \(\delta_i\) and treat density and colour as constant inside each. Then the integral becomes a finite sum:

\[
\alpha_i=1-e^{-\sigma_i\delta_i},\qquad T_i=\prod_{j<i}(1-\alpha_j),\qquad w_i=T_i\,\alpha_i,\qquad \hat C=\sum_{i=1}^{N}w_ic_i+T_{N+1}\,c_{\text{bg}}.
\]

\(\alpha_i\) is the opacity of interval i, the probability that light is absorbed there, and \(w_i\) the share of the pixel it contributes. The weights and \(T_{N+1}\) add up to 1, so the pixel is a weighted average of the sample colours and the background. This is front-to-back alpha compositing (CV 3.1.3), the same rule Gaussian splatting uses (Lesson 68).

Take samples at s = 1, 2 and 3 with \(\sigma\delta=(0,\ \ln2,\ \ln4)\): red at s = 2, blue at s = 3 and a white background. Then \(\alpha=(0,\ 0.5,\ 0.75)\), \(T=(1,\ 1,\ 0.5)\), \(w=(0,\ 0.5,\ 0.375)\) and \(T_4=0.125\). The pixel is \(0.5\,(1,0,0)+0.375\,(0,0,1)+0.125\,(1,1,1)=(0.625,\ 0.125,\ 0.5)\), a purple. The expected depth of the opaque part is \(\sum w_is_i/\sum w_i=(1+1.125)/0.875=2.43\).

The same sums give the gradients that train a NeRF. \(\partial\hat C/\partial c_3=w_3=0.375\), and a sample hidden behind an opaque one has \(T_i\approx0\), so it receives almost no gradient: occluded parts of a scene are learned slowly or not at all.

How many samples? Too few, at fixed positions, step over thin structures and turn smooth density into visible bands. NeRF draws stratified samples, one at a random position inside each interval, so that training sees every depth. It then samples again where the first pass found matter: the normalised weights \(w_i/\sum w\) form a piecewise-constant probability density, and inverting its cumulative distribution (Lesson 22) turns uniform random numbers into new sample positions. For the example, the normalised weights (0, 0.571, 0.429) on the intervals [0.5, 1.5], [1.5, 2.5] and [2.5, 3.5] send u = 0.3 to s = 2.03 and u = 0.8 to s = 3.03.

## Why the network needs positional encoding

NeRF represents σ and c with a multilayer perceptron, trained by rendering pixels of photographs with known camera poses and minimising the squared error. Quality is reported as the peak signal-to-noise ratio, \(\text{PSNR}=-10\log_{10}\text{MSE}\) for intensities in [0, 1]: an MSE of 0.001 is 30 dB, and halving the RMS error adds \(10\log_{10}4\approx6\) dB.

Fed raw coordinates, an MLP trained by gradient descent fits smooth, low-frequency functions first and fine detail only extremely slowly. This **spectral bias** makes a NeRF on raw (x, y, z) blurry. The fix is to feed each coordinate p through **Fourier features**:

\[
\gamma(p)=\bigl(\sin(2^0\pi p),\ \cos(2^0\pi p),\ \sin(2^1\pi p),\ \cos(2^1\pi p),\ \ldots,\ \sin(2^{L-1}\pi p),\ \cos(2^{L-1}\pi p)\bigr).
\]

For p = 0.25 and L = 3 this is (0.707, 0.707, 1, 0, 0, −1); for p = 0.75 it is (0.707, −0.707, −1, 0, 0, −1). Each pair is a point on a circle turning \(2^k\) times faster than the last (Lessons 33 and 36), so two nearby positions that differ by only a little in p differ a lot in the fast features, and a smooth function of γ(p) can still change sharply in p.

The lab fits one row of a photo with a two-layer MLP, trained on every second pixel and tested on the others. Without encoding the held-out PSNR stays near 17 dB and edges are blurred; with L = 4 or 5 it rises to about 24 dB; at L = 8 the training pixels are matched almost perfectly, but the held-out PSNR falls back to between 11 and 17 dB, depending on the random initialisation, because frequencies above what the samples can support oscillate between them, the aliasing of Lesson 33. NeRF uses L = 10 for positions and L = 4 for viewing directions. Mip-NeRF integrates the encoding over the cone of a pixel to tame the aliasing, Instant-NGP replaces it with learned features stored in a multi-resolution hash grid, and Lesson 65 meets the same sinusoids as the position encodings of transformers.

Volume rendering is the core of NeRF, Mip-NeRF and Instant-NGP, of NeuS and VolSDF, which convert a signed distance into density, of semantic and feature fields, and of text-to-3D methods such as DreamFusion, which render a NeRF and score the images with a diffusion model (Lesson 67). Its compositing weights reappear in Gaussian splatting (Lesson 68).

## Practice before opening the answers

1. Three samples along a ray have σδ = (0.2, 1.0, 2.0). Compute α, T and w for each, and the transmittance left for the background. Check that everything adds up to 1.
2. Their grey colours are 0.2, 0.9 and 0.5 at depths 2, 3 and 4, and the background is white (1). Render the pixel and find the expected depth of the opaque part.
3. Compute γ(p) for p = 0.1 with L = 3. Which pair of features changes fastest as p moves, and why does that help an MLP represent an edge?
4. A NeRF renders held-out images with an MSE of 0.004. What is its PSNR, and how many decibels would halving the RMS error add? Explain why a sample with \(T_i=0.01\) behind a wall barely changes during training.

## Check your understanding

Derive \(T(s)=\exp(-\int\sigma)\) from the absorption over a short step, turn the rendering integral into the weights \(w_i=T_i\alpha_i\), composite a few samples by hand, and explain how Fourier features overcome spectral bias and what goes wrong when L is too large.

## Read with a purpose

CV 14.6, 3.1.3, 13.5 (13.5.1) and 14.3; CS205A 12.2 for quadrature; MML 6.7.1 for the change of variables behind inverse-transform sampling. Primary sources: Max (1995), "Optical models for direct volume rendering"; Mildenhall et al. (2020), "NeRF"; Tancik et al. (2020), "Fourier features let networks learn high frequency functions in low dimensional domains". Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
