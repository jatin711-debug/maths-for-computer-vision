# Lesson 52 - Robust fitting: RANSAC and Gauss-Newton refinement

**Module:** 13 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 10, 20 and 31; revisit the normal equations, the second-order Taylor approximation and why a convex objective has a single basin. Lessons 50 and 51 supply the homographies and cameras that this lesson fits, but every example here uses lines and one-parameter curves.

**Goal:** Fit models when some measurements are wrong, and refine a nonlinear fit with Gauss–Newton or Levenberg–Marquardt.

## One wrong measurement can drag a least-squares fit

Least squares (Lesson 10) minimises \(\sum_i r_i^2\). The derivative of \(r_i^2\) is \(2r_i\), so the pull a point exerts on the solution grows in proportion to how wrong it is. A single gross error can outweigh many good measurements.

Take the four points (0,0), (1,1), (2,2), (3,3) on the line y = x and add one mismatched point (4,0). For the model \(y=mx+c\), the sums are \(\sum x=10,\ \sum x^2=30,\ \sum y=6,\ \sum xy=14\), and the normal equations

\[
\begin{bmatrix}30&10\\10&5\end{bmatrix}\begin{bmatrix}m\\c\end{bmatrix}=\begin{bmatrix}14\\6\end{bmatrix}
\]

give \(m=0.2\) and \(c=0.8\). One bad point turned slope 1 into slope 0.2, and the four good points now have residuals −0.8, 0, 0.8 and 1.6 instead of zero. The same happens to a constant: the least-squares fit of [1, 2, 3, 4, 40] is its mean, 10, although four of the five values lie between 1 and 4.

In vision this is the normal case, not a rare accident. A feature matcher pairs corners that look alike, and a sizeable fraction of its matches can belong to different scene points. A fitting method for matches must tolerate them.

## Robust losses bound the influence of large residuals

Replace \(r^2\) by a loss that grows more slowly for large residuals. The Huber loss with threshold δ is quadratic near zero and linear beyond δ; its derivative ψ, the influence of one residual, is capped at δ:

\[
\rho_\delta(r)=\begin{cases}\tfrac12r^2,&|r|\le\delta\\ \delta\left(|r|-\tfrac12\delta\right),&|r|>\delta\end{cases}\qquad\psi_\delta(r)=\rho_\delta'(r)=\begin{cases}r,&|r|\le\delta\\ \delta\operatorname{sign}(r),&|r|>\delta\end{cases}
\]

For the constant fit to [1, 2, 3, 4, 40] with δ = 1, the optimum c satisfies \(\sum_i\psi(y_i-c)=0\). At c = 3 the five influences are −1, −1, 0, 1 and 1, which sum to zero, so the Huber estimate is 3. The value 40 pulls exactly as hard as the value 4.

Iteratively reweighted least squares (IRLS) computes such fits with the tools of Lesson 10. Write \(\psi(r)=w(r)\,r\) with weight \(w(r)=\min(1,\delta/|r|)\). Then alternate: compute the weights from the current residuals, and solve the weighted normal equations \(A^TWA\,\theta=A^TWb\) with \(W=\operatorname{diag}(w_i)\). Starting from the mean 10, the residuals −9, −8, −7, −6, 30 give weights 1/9, 1/8, 1/7, 1/6 and 1/30, and the weighted mean is 4.82. The next rounds give 3.53, 3.19, 3.07, … and converge to 3.

The Huber loss is convex (Lesson 31), so IRLS has only one basin to find. Bounded influence is not zero influence, though: many outliers on the same side still shift a Huber fit. Redescending losses go further. The Cauchy loss \(\tfrac{c^2}{2}\ln\left(1+r^2/c^2\right)\) has weight \(1/(1+r^2/c^2)\), and Tukey's biweight gives weight exactly 0 beyond c, so gross errors are ignored. Neither is convex, so both need a reasonable starting fit. The smooth L1 box loss of Lesson 42 is the Huber loss divided by δ: a detector's box regression already has a bounded gradient for large coordinate errors.

## RANSAC: fit minimal samples and count the votes

RANSAC (random sample consensus) does not fit all the data at once. It repeats four steps:

1. Draw a minimal sample: s points, just enough to fix the model (2 for a line, 4 correspondences for a homography).
2. Fit the model exactly to those s points.
3. Count the consensus set: the data whose residual is at most an inlier threshold τ.
4. Keep the model with the largest consensus set. At the end, refit it by least squares on its inliers only.

For the five points above, the sample {(1,1), (3,3)} gives y = x, with residuals 0, 0, 0, 0 and −4; with τ = 0.5 four points vote for it. Every sample that contains (4,0) gets only its own two votes, so RANSAC keeps y = x, and the refit on the four inliers returns it exactly.

The threshold comes from the noise. If inlier residuals are Gaussian with standard deviation σ, then \(|r|\le2\sigma\) holds for about 95% of inliers and \(|r|\le3\sigma\) for 99.7%, so τ between 2σ and 3σ is a common choice. A τ that is too small splits the real inliers; one that is too large lets outliers vote.

How many samples are enough? If a fraction ε of the data are outliers, a random minimal sample is outlier-free with probability about \((1-\varepsilon)^s\), and all N samples are contaminated with probability \(\left(1-(1-\varepsilon)^s\right)^N\). Requiring this to be at most \(1-p\) for a confidence p gives

\[
N=\left\lceil\frac{\log(1-p)}{\log\left(1-(1-\varepsilon)^s\right)}\right\rceil.
\]

With ε = 0.4, s = 2 and p = 0.99: \((0.6)^2=0.36\) and \(N=\lceil\ln0.01/\ln0.64\rceil=\lceil10.32\rceil=11\). A 4-point homography with ε = 0.5 needs 72 samples, and an 8-point model needs 1177. The count grows exponentially with s, which is one reason to use minimal models. In practice ε is unknown; adaptive RANSAC starts pessimistic and lowers N whenever a larger consensus set reveals a smaller outlier fraction.

## Gauss–Newton and Levenberg–Marquardt refine the fit

Many vision models are nonlinear in their parameters: a homography after dividing by the last coordinate, a camera projection, a rotation angle. After RANSAC has chosen the inliers, refine the parameters θ by nonlinear least squares:

\[
E(\theta)=\tfrac12\|r(\theta)\|^2,\qquad J_{ij}=\frac{\partial r_i}{\partial\theta_j}.
\]

The gradient is \(\nabla E=J^Tr\) and the Hessian is \(J^TJ+\sum_ir_i\nabla^2r_i\) (Lesson 20). Gauss–Newton linearises the residuals, \(r(\theta+\delta)\approx r+J\delta\), and minimises \(\tfrac12\|r+J\delta\|^2\), which is a linear least-squares problem in δ with normal equations

\[
J^TJ\,\delta=-J^Tr.
\]

This is Newton's method with the second-derivative term dropped. That term is small when the residuals are small or nearly linear, so close to a good fit Gauss–Newton converges almost as fast as Newton without any second derivatives. For the residuals \(r_1=\theta^2-4\) and \(r_2=\theta-2\), both zero at θ = 2, start at θ = 1: r = (−3, −1), J = (2, 1), \(J^TJ=5\) and \(J^Tr=-7\), so δ = 1.4 and θ = 2.4. The next iterates are 2.0319, 2.0002 and 2.00000001.

Levenberg–Marquardt damps the step: \((J^TJ+\lambda I)\,\delta=-J^Tr\). With λ = 5 the first step above becomes 7/10, landing at θ = 1.7 with E = 0.661, better than the full Gauss–Newton step's 1.629 (E was 5 at θ = 1). A large λ gives a short step along the negative gradient; λ → 0 recovers Gauss–Newton. A common rule: if the step lowers E, accept it and divide λ by 10; otherwise reject it and multiply λ by 10. Damping helps when the start is far from the solution, and when \(J^TJ\) is singular or badly conditioned (Lesson 11) because the data barely constrain some parameter.

The standard pipeline for a homography (Lesson 50) or a calibrated camera (Lesson 51) is: match features, run RANSAC with a minimal solver to find the inliers, then minimise the reprojection error over all inliers with Levenberg–Marquardt, often with a Huber or Cauchy loss in case a few outliers slipped through. Bundle adjustment applies the same refinement to many cameras and 3D points at once; its \(J^TJ\) is large but sparse, because each residual involves one camera and one point.

## Practice before opening the answers

1. For an outlier fraction ε = 0.3 and a 2-point line model, how many RANSAC samples give 99% confidence of at least one outlier-free sample? Repeat for a 4-point homography.
2. With Huber threshold δ = 1, find the loss and the IRLS weight for residuals 0.5 and 4. Compare each loss with the squared loss \(\tfrac12r^2\).
3. The points are (0,1), (1,3), (2,5), (3,1), (4,9). RANSAC draws the samples {(0,1), (2,5)} and {(2,5), (3,1)}. With τ = 0.5 on vertical residuals, find each line's consensus set. Which model is kept, and what does the refit on its inliers give?
4. For residuals \(r_1=\theta^2-9\) and \(r_2=\theta-3\), take one Gauss–Newton step from θ = 1 and one Levenberg–Marquardt step with λ = 4. Evaluate \(E=\tfrac12\|r\|^2\) before and after each step.

## Check your understanding

Justify a RANSAC inlier threshold and iteration count for a given noise level and outlier fraction, and derive the Gauss–Newton step by linearising the residuals.

## Read with a purpose

CV 8.1.3-8.1.4, 4.1.3, Appendix A.3 and B.3; CS205A 7.2 for Newton's method in several variables. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
