# Lesson 63 - Rotations as a manifold, point-set alignment and bundle adjustment

**Module:** 16 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 51 and 52; rotation matrices, axis–angle vectors and the matrix exponential come from Lesson 51, Gauss–Newton and Levenberg–Marquardt from Lesson 52, the SVD from Lesson 14, and triangulated points from Lesson 62.

**Goal:** Update rotations with the exponential map, align point sets in closed form (Kabsch), and solve the sparse normal equations of bundle adjustment with the Schur complement.

## You cannot simply add to a rotation

A 3D rotation matrix satisfies \(R^TR=I\) and \(\det R=+1\). These matrices form the group SO(3): composing two rotations gives a rotation, but adding matrices does not. Inside the nine-dimensional space of all 3 × 3 matrices, the rotations form a curved three-dimensional surface, a **manifold**, much as the surface of a globe is a curved two-dimensional set inside 3D space.

An optimiser that adds a small step to R leaves the surface. Take the rotation vector \(\delta=(0,0,0.1)\), a turn of 0.1 radians about z. The first-order matrix \(I+[\delta]_\times\) sends (1, 0, 0) to (1, 0.1, 0), whose length is 1.005, and its determinant is \(1+\|\delta\|^2=1.01\): it stretches space, so it is not a rotation. The exact turn sends (1, 0, 0) to \((\cos0.1,\ \sin0.1,\ 0)=(0.995,\ 0.0998,\ 0)\). Euler-angle increments stay on the surface but suffer from gimbal lock (Lesson 51).

The standard fix keeps a 3-vector step and maps it onto the manifold with the exponential map of Lesson 51, Rodrigues' formula:

\[
R\leftarrow R\exp([\delta]_\times),\qquad \exp([\delta]_\times)=I+\sin\theta\,[n]_\times+(1-\cos\theta)[n]_\times^2,\quad \theta=\|\delta\|,\ n=\delta/\theta.
\]

The result is exactly a rotation for every δ, δ = 0 means no change, and small steps behave like an ordinary vector, so Gauss–Newton and Levenberg–Marquardt can solve for δ as if it were three plain numbers. The way back is the log map: \(\theta=\arccos\bigl((\operatorname{tr}R-1)/2\bigr)\), with the axis read from \(R-R^T\). The angle of \(R_1^TR_2\) is the distance between two rotations, the error used to compare estimated and true camera orientations. A camera pose (R, t) lives in SE(3) and is updated the same way, with three more numbers for the translation.

## The Jacobian of a rotated point

Gauss–Newton needs the derivative of a residual with respect to δ. For a point p,

\[
R\exp([\delta]_\times)\,p\approx R\,(p+\delta\times p)=Rp-R\,[p]_\times\delta,\qquad\frac{\partial}{\partial\delta}\Bigl(R\exp([\delta]_\times)p\Bigr)\Big|_{\delta=0}=-R\,[p]_\times,
\]

using \(\delta\times p=-p\times\delta=-[p]_\times\delta\) (Lesson 49). For R = I and p = (1, 0, 0), \(-[p]_\times\) has rows (0, 0, 0), (0, 0, 1) and (0, −1, 0), so δ = (0, 0, 0.1) moves the point by (0, 0.1, 0), the first-order part of the exact turn above.

## Aligning two point sets in closed form: Kabsch

Given matched points \(p_i\leftrightarrow q_i\), find the rotation and translation that minimise \(\sum_i\|Rp_i+t-q_i\|^2\). The answer needs no iterations:

1. Compute the centroids \(\bar p,\bar q\) and the centred points \(\tilde p_i=p_i-\bar p\), \(\tilde q_i=q_i-\bar q\).
2. Form the cross-covariance \(H=\sum_i\tilde p_i\tilde q_i^T\) and its SVD \(H=U\Sigma V^T\).
3. Set \(R=V\operatorname{diag}(1,\ldots,1,\ d)\,U^T\) with \(d=\det(VU^T)\).
4. Set \(t=\bar q-R\bar p\).

Why it works: \(\sum_i\|R\tilde p_i-\tilde q_i\|^2\) equals a constant minus \(2\operatorname{tr}(RH)\), so the best R makes \(\operatorname{tr}(RH)=\operatorname{tr}(\Sigma\,V^TRU)\) as large as possible. \(V^TRU\) is orthogonal, so its diagonal entries are at most 1, and the maximum is \(V^TRU=I\), that is \(R=VU^T\). If \(VU^T\) is a reflection (determinant −1), d flips the sign attached to the smallest singular value, which costs least.

The square (1, 0), (0, 1), (−1, 0), (0, −1), turned by 90°, becomes (0, 1), (−1, 0), (0, −1), (1, 0). Both centroids are 0 and \(H=\begin{bmatrix}0&2\\-2&0\end{bmatrix}\); Kabsch returns \(R=\begin{bmatrix}0&-1\\1&0\end{bmatrix}\) with determinant +1. Umeyama's extension also estimates a scale, and it is how trajectories are aligned before the absolute trajectory error (ATE) of a SLAM system is reported.

## ICP: when the matches are unknown

Two scans of the same surface rarely come with matches. Iterative closest point (ICP) alternates two steps: match every source point to its nearest target point, then solve Kabsch on those pairs and move the source. Neither step can increase the summed squared distance, so the error goes down and settles, but only into the nearest local minimum. From a good start it converges in a few iterations; from a start tens of degrees away, nearest neighbours pair the wrong points and ICP locks onto a wrong alignment. Practical versions use k-d trees for the search, discard pairs that are too far apart, and minimise point-to-plane distances, as KinectFusion does for depth cameras.

## Bundle adjustment and the Schur complement

Bundle adjustment refines M cameras \((R_i,t_i)\) and N points \(X_j\) together, minimising the robust reprojection error (Lesson 52)

\[
\sum_{(i,j)\text{ observed}}\rho\Bigl(\bigl\|x_{ij}-\pi(K,R_i,t_i,X_j)\bigr\|^2\Bigr)
\]

with Levenberg–Marquardt, updating \(R_i\leftarrow R_i\exp([\delta_i]_\times)\), \(t_i\leftarrow t_i+\delta t_i\) and \(X_j\leftarrow X_j+\delta X_j\). Each residual depends on one camera (6 numbers) and one point (3 numbers), so each row of the Jacobian has only two nonzero blocks, and the normal equations have the shape

\[
\begin{bmatrix}B&E\\E^T&C\end{bmatrix}\begin{bmatrix}\delta_c\\\delta_p\end{bmatrix}=\begin{bmatrix}v\\w\end{bmatrix},
\]

where C is block-diagonal (one 3 × 3 block per point) and E is nonzero only where camera i sees point j. The second block row gives \(\delta_p=C^{-1}(w-E^T\delta_c)\), which is cheap because C is inverted one 3 × 3 block at a time. Substituting it into the first row eliminates every point:

\[
\bigl(B-EC^{-1}E^T\bigr)\,\delta_c=v-EC^{-1}w.
\]

The matrix \(B-EC^{-1}E^T\) is the **Schur complement** of C. With 10 cameras and 10,000 points there are \(10\cdot6+10{,}000\cdot3=30{,}060\) unknowns, but the reduced camera system is only 60 × 60; the points are then recovered one by one. A scalar version shows the arithmetic. For

\[
\begin{bmatrix}4&1&2\\1&2&0\\2&0&4\end{bmatrix}\begin{bmatrix}\delta_c\\\delta_1\\\delta_2\end{bmatrix}=\begin{bmatrix}3\\1\\2\end{bmatrix},
\]

the reduced equation is \((4-\tfrac12-1)\,\delta_c=3-\tfrac12-1\), so \(\delta_c=1.5/2.5=0.6\), and back-substitution gives \(\delta_1=(1-0.6)/2=0.2\) and \(\delta_2=(2-1.2)/4=0.2\).

One more subtlety: moving, turning or scaling the whole reconstruction changes no reprojection, so a monocular bundle adjustment has 7 directions (a similarity) along which the cost is flat. This **gauge freedom** makes \(J^TJ\) singular; solvers fix the first camera and the scale, or rely on the damping of Levenberg–Marquardt. Pose estimation from known 3D points (PnP) is the same machinery with a single camera.

COLMAP and ORB-SLAM run bundle adjustment after every few new images, visual-inertial odometry adds IMU residuals to the same structure, and DROID-SLAM unrolls a differentiable bundle-adjustment layer, Schur complement included, inside a network. The camera poses that NeRF and Gaussian splatting are trained on (Lesson 64) are the output of this refinement.

## Practice before opening the answers

1. The points (2, 0), (0, 1), (−2, 0), (0, −1) are matched to (3, 2), (2, 0), (3, −2), (4, 0). Find the centroids, H, R and t with Kabsch.
2. Apply δ = (0, 0, 0.5) to p = (1, 0, 0) exactly with the exponential map and with the first-order matrix I + [δ]×. Compare the lengths, and find det(I + [δ]×).
3. A reconstruction has 50 cameras and 20,000 points, and each point is seen by 4 cameras on average. How many unknowns and residuals does bundle adjustment have, how large is the reduced camera system, and how many gauge directions are there?
4. Solve \(\begin{bmatrix}5&2&1\\2&4&0\\1&0&2\end{bmatrix}\delta=\begin{bmatrix}4\\2\\1\end{bmatrix}\) by eliminating the last two unknowns with the Schur complement, then back-substitute.

## Check your understanding

Explain why a rotation is updated by \(R\exp([\delta]_\times)\) rather than by adding a matrix, derive Kabsch's rotation from the SVD of the cross-covariance including the determinant correction, and show how the Schur complement turns bundle adjustment into a small camera-only system.

## Read with a purpose

CV 2.1.3, 8.1.5, 11.2 (11.2.1-11.2.2), 11.4.2-11.4.5, 13.2.1 and Appendix A.3-A.4; CS205A 6.2.4 and 3.2.2; Guo Part IV, Chapter 3. Primary sources: Kabsch (1976) and Umeyama (1991) on point-set alignment; Besl and McKay (1992) on ICP; Triggs et al. (2000), "Bundle adjustment: a modern synthesis". Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
