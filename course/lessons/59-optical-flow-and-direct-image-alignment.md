# Lesson 59 - Optical flow and direct image alignment

**Module:** 15 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 57, 52 and 56; revisit the structure tensor, the Gauss–Newton normal equations \(J^TJ\delta=-J^Tr\) and Gaussian pyramids if they feel unfamiliar. The warping step uses the bilinear sampling of Lesson 50.

**Goal:** Derive brightness constancy, solve Lucas–Kanade as 2×2 least squares, see the aperture problem as a rank-deficient structure tensor, and recover large motions coarse-to-fine.

## Brightness constancy

Optical flow is the apparent motion of image content between two frames: a vector \((u,v)\) at every pixel saying how far, in pixels, the content there moved to the right and down. It is what a tracker follows, what video stabilisation cancels and what a self-supervised depth network predicts indirectly.

The basic assumption is brightness constancy: a point keeps its brightness as it moves, so

\[
I(x+u,\ y+v,\ t+1)=I(x,y,t).
\]

For a small motion, expand the left side to first order (Lesson 20): \(I(x+u,y+v,t+1)\approx I+I_xu+I_yv+I_t\), where \(I_x\) and \(I_y\) are the spatial derivatives of Lesson 57 and \(I_t=I(x,y,t+1)-I(x,y,t)\) is the temporal difference at a fixed pixel. Brightness constancy becomes one linear equation per pixel:

\[
I_xu+I_yv+I_t\approx0.
\]

Take a pixel with \(I_x=1\) and \(I_y=0\): brightness rises by 1 grey level per pixel to the right. If the content moves 2 pixels to the right, the pixel now shows what was 2 pixels to its left, which is 2 darker, so \(I_t=-2\), and indeed \(1\cdot2+0\cdot v-2=0\). The same equation is satisfied by every v: one pixel gives one equation for two unknowns.

## The aperture problem

The equation fixes only the component of the flow along the gradient, the normal flow \(-I_t/|\nabla I|\) in the direction \(\nabla I/|\nabla I|\). Motion along an edge leaves every pixel's brightness unchanged, so it cannot be seen through a small window: a straight bar seen through a hole looks the same whether it slides along itself or not. This is the aperture problem. For gradient (3, 4) and \(I_t=-10\), the normal flow has length \(10/5=2\) pixels in the direction (0.6, 0.8), the vector (1.2, 1.6), but (2, 1) and (−2, 4) satisfy \(3u+4v=10\) equally well.

## Lucas–Kanade: least squares over a window

Lucas and Kanade assume that the flow is the same for all pixels in a small window and solve the stacked equations by least squares (Lesson 10):

\[
\min_{u,v}\sum_{\text{window}}\big(I_xu+I_yv+I_t\big)^2\quad\Longrightarrow\quad
\underbrace{\begin{bmatrix}\sum I_x^2&\sum I_xI_y\\\sum I_xI_y&\sum I_y^2\end{bmatrix}}_{M}\begin{bmatrix}u\\v\end{bmatrix}=-\begin{bmatrix}\sum I_xI_t\\\sum I_yI_t\end{bmatrix}.
\]

The matrix is the structure tensor M of Lesson 57. Four pixels with \((I_x,I_y,I_t)\) = (1, 0, −2), (1, 0, −2), (0, 1, −1) and (0, 1, −1) give \(M=\operatorname{diag}(2,2)\) and right-hand side \(-(-2-2,\ -1-1)=(4,2)\), so \((u,v)=(2,1)\), and every one of the four equations holds exactly.

If instead all four pixels are (1, 0, −2), then \(M=\operatorname{diag}(4,0)\) is singular. The first equation gives u = 2, but nothing fixes v: the aperture problem is a rank-deficient structure tensor. Near-singular windows are just as bad, because the solution divides by the small eigenvalue: if the two gradient directions are only 15° apart, an error of half a grey level in one \(I_t\) moves the estimate by about a pixel. This is why the KLT tracker tracks Shi–Tomasi corners: their \(\lambda_{\min}(M)\) is large, so their flow is well determined.

## Iterate: Lucas–Kanade is Gauss–Newton

The linearisation is valid only for motions small compared with the scale over which the image gradient changes, typically about a pixel. For larger motions, iterate. Write the residuals \(r_i(d)=I_1(x_i+d)-I_0(x_i)\) for a displacement d; their Jacobian rows are \(\nabla I^T\), so \(J^TJ=M\) and the Lucas–Kanade solve is exactly the Gauss–Newton step \(J^TJ\,\delta=-J^Tr\) of Lesson 52. Each iteration warps the second frame by the current d with bilinear sampling (Lesson 50), recomputes \(I_t\) from the warped frame and solves for the correction δ. The same scheme with a 6-parameter affine or 8-parameter homography warp \(W(x;p)\) minimises \(\sum\big[I_1(W(x;p))-I_0(x)\big]^2\): direct image alignment, used for stabilisation, panorama refinement and direct visual odometry.

## Coarse-to-fine

Iteration alone rarely rescues an 8-pixel motion: the first linearisation compares pixels that are no longer related, so it can point the wrong way. A Gaussian pyramid does (Lesson 56): halving the image halves every displacement, so a shift of d pixels at level 0 is \(d/2^\ell\) at level ℓ. An 8-pixel shift is 1 pixel three levels up, where Lucas–Kanade works. Estimate the flow at the coarsest level, double it, warp the next finer level by it, estimate the small remaining correction and repeat down to full resolution. A 13-pixel motion needs four levels, since \(13/2^4\approx0.81\). Coarse-to-fine estimation fails for small fast objects, which vanish at coarse levels, one reason RAFT replaced it with a correlation volume \(C(x,d)=f_1(x)\cdot f_2(x+d)\) of learned features over all displacements.

## Horn–Schunck: smoothness instead of windows

Lucas–Kanade gives no answer where a window has no texture. Horn and Schunck instead minimise one energy over the whole image,

\[
E(u,v)=\sum_{\text{pixels}}\big(I_xu+I_yv+I_t\big)^2+\alpha^2\big(\|\nabla u\|^2+\|\nabla v\|^2\big),
\]

where the second term penalises flow that changes from pixel to pixel and α sets the trade-off. Setting the derivatives to zero gives an update that pulls each pixel's flow towards the average \((\bar u,\bar v)\) of its neighbours, corrected along the gradient:

\[
u\leftarrow\bar u-I_x\,\frac{I_x\bar u+I_y\bar v+I_t}{\alpha^2+I_x^2+I_y^2},\qquad v\leftarrow\bar v-I_y\,\frac{I_x\bar u+I_y\bar v+I_t}{\alpha^2+I_x^2+I_y^2}.
\]

With \(\bar u=\bar v=0\), \((I_x,I_y,I_t)=(1,0,-2)\) and α = 1, one update gives u = 2/2 = 1; with α = 3 only 0.2, because smoothness dominates. Repeating the update spreads flow from textured pixels into flat regions. Robust penalties such as the Charbonnier \(\sqrt{r^2+\varepsilon^2}\) replace the squares in modern variants, so motion boundaries and occlusions are not smoothed over.

## Practice before opening the answers

1. Three pixels have \((I_x,I_y,I_t)\) = (2, 0, −2), (0, 1, 1) and (1, 1, 0). Build M and the right-hand side, solve for (u, v) and check each equation.
2. Every pixel in a window has gradient (3, 4) and \(I_t=-10\). Why can Lucas–Kanade not solve for the flow? Give the normal flow vector and two different flows that satisfy the constraint.
3. A camera pans so that content moves 8 pixels between frames, and Lucas–Kanade is reliable only below about 1 pixel. How many pyramid levels are needed, what is the motion at each level, and how many for a 13-pixel motion?
4. Apply one Horn–Schunck update at a pixel with \((I_x,I_y,I_t)=(1,0,-2)\) and neighbour average \(\bar u=\bar v=0\) for α = 1 and α = 3. Repeat for α = 1 when \(\bar u=1.5\). What does α control?

## Check your understanding

Derive \(I_xu+I_yv+I_t\approx0\) from brightness constancy, solve the 2×2 Lucas–Kanade system for a small window, explain the aperture problem through the eigenvalues of M, and explain why a pyramid lets the same linearisation recover large motions.

## Read with a purpose

CV 9.1, 9.1.1, 9.1.3, 9.3 and 7.1.5. The original papers are Lucas and Kanade (1981) and Horn and Schunck (1981); Baker and Matthews (2004), "Lucas–Kanade 20 years on", unifies the image-alignment variants, and Teed and Deng (2020) introduce RAFT. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
