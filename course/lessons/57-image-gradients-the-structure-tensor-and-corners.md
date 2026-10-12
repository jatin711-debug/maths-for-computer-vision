# Lesson 57 - Image gradients, the structure tensor and corners

**Module:** 15 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 18, 34 and 13; revisit partial derivatives, cross-correlation with a 3×3 kernel and the eigenvalues of a symmetric 2×2 matrix if they feel unfamiliar. The noise arithmetic uses Lesson 23, and the last section links to Gauss–Newton in Lesson 52.

**Goal:** Compute image gradients with derivative-of-Gaussian filters, and classify a window as flat, edge or corner from the eigenvalues of its structure tensor.

## An image gradient is two filter responses

Treat a grey image as a function \(I(x,y)\) of the column x, counted to the right, and the row y, counted downwards. Its gradient \(\nabla I=(I_x,I_y)\) collects the two partial derivatives (Lesson 18): \(I_x\) is the change in brightness per pixel to the right and \(I_y\) the change per pixel downwards. An image is only known at pixel centres, so each derivative is estimated with a small kernel. The central difference uses the two neighbours, \(I_x\approx\tfrac12\big(I(x+1,y)-I(x-1,y)\big)\), which is cross-correlation (Lesson 34) with the kernel \(\tfrac12[-1,\ 0,\ 1]\).

The Sobel operator takes this difference in three neighbouring rows and averages them with weights 1, 2, 1:

\[
S_x=\begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix}=\begin{bmatrix}1\\2\\1\end{bmatrix}\begin{bmatrix}-1&0&1\end{bmatrix},\qquad I_x\approx\tfrac18\,(S_x\star I),\qquad S_y=S_x^T.
\]

The 8 is the sum 4 of the smoothing weights times the 2 of the difference, so a brightness ramp that rises by 12 per pixel gives exactly 12. Take the ramp \(I=50+12x+5y\) around a centre pixel of value 50: its rows are (33, 45, 57), (38, 50, 62) and (43, 55, 67). The Sobel sums are \((57-33)+2(62-38)+(67-43)=96\) and \((43-33)+2(55-45)+(67-57)=40\), so \(I_x=96/8=12\) and \(I_y=40/8=5\), the slopes of the ramp. Now add 10 grey levels of noise to the right-hand pixel, 62 → 72. The central difference becomes \((72-38)/2=17\), five too high, while Sobel gives \((96+20)/8=14.5\): its averaging halves the damage.

## Smooth, then differentiate

A difference subtracts neighbouring pixels, so it keeps fine detail and amplifies noise, the highest frequencies of Lesson 36. For independent pixel noise of standard deviation σ (Lesson 23), the central difference has standard deviation \(\sigma\sqrt2/2\approx0.707\sigma\), Sobel divided by 8 has \(\sigma\sqrt{12}/8\approx0.433\sigma\), and a wider blur reduces it further. The principled version blurs with a Gaussian \(G_\sigma\) and then differentiates. Because the derivative of a convolution is the convolution with the derivative, one kernel does both:

\[
I_x=\frac{\partial}{\partial x}\big(G_\sigma*I\big)=\frac{\partial G_\sigma}{\partial x}*I,\qquad G_\sigma(x,y)=g_\sigma(x)\,g_\sigma(y),\qquad \frac{\partial G_\sigma}{\partial x}=g_\sigma'(x)\,g_\sigma(y).
\]

The 2D Gaussian is separable, so its derivative is too: filter every row with the 1D derivative kernel and every column with the 1D blur g. Since \(g_\sigma'(x)=-\frac{x}{\sigma^2}g_\sigma(x)\) is odd, the cross-correlation taps are proportional to \(i\,g_\sigma(i)\), positive on the right. Scale them so that a ramp of slope 1 gives 1, that is \(\sum_i i\,d_i=1\). For σ = 1 and radius 3 the taps are \(\pm0.243,\ \pm0.108,\ \pm0.013\) at offsets ±1, ±2, ±3 (0 in the middle). With σ = 2 the radius is \(3\sigma=6\) and each 1D kernel has 13 taps: 26 multiplications per pixel instead of \(13^2=169\) for the full 2D kernel. The scale σ is a choice: a small σ sees fine texture and noise, a large σ only broad edges.

## Magnitude, orientation and edges

The gradient magnitude \(|\nabla I|=\sqrt{I_x^2+I_y^2}\) measures edge strength and the orientation \(\theta=\operatorname{atan2}(I_y,I_x)\) its direction. atan2 returns the angle of the vector \((I_x,I_y)\) from the positive x axis, between −180° and 180°, using both signs to find the quadrant. For the ramp, \(|\nabla I|=\sqrt{144+25}=13\) and \(\theta=22.6^\circ\): brighter to the right and slightly below, because y points down. The reversed gradient \((-12,-5)\) has the same magnitude and \(\theta=-157.4^\circ\); \(\arctan(I_y/I_x)\) cannot tell them apart. The gradient points across an edge, from dark to bright, and the edge runs perpendicular to it.

The Canny detector turns this into thin edges. It computes the gradient with a derivative of Gaussian, then applies non-maximum suppression along θ: a pixel survives only if its magnitude is at least that of its two neighbours in the gradient direction, so magnitudes (3, 8, 12, 9, 2) across an edge leave only the 12. Finally hysteresis keeps pixels above a high threshold and grows edges from them through connected pixels above a lower one, so a faint stretch of a strong edge is kept while isolated noise is not.

## How much does a patch change when it moves?

A good feature point is one whose patch would look different if moved in any direction. Take a window of pixels around a point, with weights \(w(x)\) (often a Gaussian of a second scale \(\sigma_i\)), shift it by \(\Delta u=(\Delta x,\Delta y)\) and add the squared differences. A first-order Taylor expansion, \(I(x+\Delta u)\approx I(x)+\nabla I(x)^T\Delta u\), turns this into a quadratic form:

\[
E(\Delta u)=\sum_x w(x)\big[I(x+\Delta u)-I(x)\big]^2\approx\Delta u^TM\,\Delta u,\qquad M=\sum_x w(x)\begin{bmatrix}I_x^2&I_xI_y\\I_xI_y&I_y^2\end{bmatrix}.
\]

M, the structure tensor, is a sum of outer products \(\nabla I\,\nabla I^T\), so it is symmetric with eigenvalues \(\lambda_1\ge\lambda_2\ge0\). Its eigenvectors are the directions of fastest and slowest change, and \(E(e_i)=\lambda_i\) for a unit shift along each. If both eigenvalues are small the window is flat; if \(\lambda_1\) is large and \(\lambda_2\approx0\) it is an edge, which slides along itself unchanged; if both are large it is a corner, pinned down in every direction.

Four pixels with gradients (1, 0), (1, 0), (0, 1), (0, 1) give \(M=\operatorname{diag}(2,2)\): a corner. Four gradients (1, 0) give \(\operatorname{diag}(4,0)\): an edge. Two gradients (1, 1) give \(M=\begin{bmatrix}2&2\\2&2\end{bmatrix}\). Every entry is large, yet the eigenvalues are 4 and 0, from \(\lambda=\frac{a+c}2\pm\sqrt{\big(\frac{a-c}2\big)^2+b^2}\): it is the same edge turned by 45°. Rotating the image turns M into \(RMR^T\), which has the same eigenvalues (Lesson 13), so the verdict does not depend on orientation. A flat patch gives \(M=0\).

## Harris and Shi–Tomasi scores

Detectors avoid square roots by using \(\det M=\lambda_1\lambda_2=ac-b^2\) and \(\operatorname{tr}M=\lambda_1+\lambda_2=a+c\):

\[
R=\det M-k\,(\operatorname{tr}M)^2=\lambda_1\lambda_2-k(\lambda_1+\lambda_2)^2,\qquad k\approx0.04\text{ to }0.06.
\]

With k = 0.04 the corner scores \(4-0.04\cdot16=3.36\), both edges \(0-0.64=-0.64\) and the flat patch 0. R is positive only when \(\lambda_2/\lambda_1\) exceeds about 0.044, the root of \(t=k(1+t)^2\), so edges score negative and corners positive. Shi and Tomasi score \(\lambda_2=\min\lambda\) directly, which the KLT tracker uses. A detector computes \(I_x\) and \(I_y\) at scale σ, blurs the three images \(I_x^2\), \(I_xI_y\) and \(I_y^2\) with the window Gaussian \(\sigma_i\), scores every pixel, keeps local maxima (non-maximum suppression, as for boxes in Lesson 42) and returns the strongest N.

M is not new. For the two unknowns of a shift, the residuals \(r=I(x+\Delta u)-I(x)\) have Jacobian rows \(\nabla I^T\), so \(M=J^TJ\), the Gauss–Newton matrix of Lesson 52. A corner is a point whose shift Gauss–Newton could recover in both directions; at an edge \(J^TJ\) is singular. Lesson 59 builds optical flow on exactly this matrix. Harris corners survive rotation and a brightness offset, but not a change of scale: Lesson 58 fixes that.

## Practice before opening the answers

1. A 3×3 patch has rows (20, 30, 50), (20, 40, 60) and (30, 50, 70). Compute \(I_x\) and \(I_y\) with Sobel divided by 8, then \(|\nabla I|\) and \(\theta=\operatorname{atan2}(I_y,I_x)\) in degrees.
2. A window has gradients (2, 1), (2, 1), (−1, 2) and (0, 0). Build M, find \(\det M\), \(\operatorname{tr}M\), the eigenvalues and the Harris score with k = 0.05. Flat, edge or corner?
3. Three pixels have gradient (3, 4) and one has (0, 0). Find M, its eigenvalues and R with k = 0.04, and compare with three gradients (5, 0). What is \(E\) for a unit shift along the edge, (4, −3)/5, and across it, (3, 4)/5?
4. A flat region carries independent noise with σ = 10 grey levels. Find the standard deviation of the central-difference \(I_x\) and of Sobel divided by 8. How many multiplications per pixel does a σ = 2 derivative of Gaussian need with and without separability, using a radius of 3σ?

## Check your understanding

Compute a Sobel or derivative-of-Gaussian gradient by hand, derive \(E(\Delta u)\approx\Delta u^TM\Delta u\) from a first-order Taylor expansion, and use the eigenvalues of M or the Harris score to say whether a window is flat, an edge or a corner.

## Read with a purpose

CV 3.2.1, 3.2.3, 7.2.1 and 7.1.1. The original papers are short: Harris and Stephens (1988) for the corner score, Shi and Tomasi (1994) for the minimum-eigenvalue criterion, and Canny (1986) for edges. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
