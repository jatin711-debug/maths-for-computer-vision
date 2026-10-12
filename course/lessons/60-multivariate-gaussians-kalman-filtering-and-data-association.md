# Lesson 60 - Multivariate Gaussians, Kalman filtering and data association

**Module:** 15 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 23, 21, 19 and 42; revisit the multivariate Gaussian and Mahalanobis distance from Lesson 23's primer, Bayes' theorem, Jacobians and IoU if they feel unfamiliar. The 2×2 inverses use the matrix inverse of Lesson 08.

**Goal:** Derive the Kalman predict and update steps from the linear-transform and conditioning rules of the Gaussian, and assign detections to tracks with the Hungarian algorithm.

## Gaussian vectors, briefly

A tracker never knows exactly where an object is; it keeps a mean and an uncertainty. For a vector x of d numbers, the multivariate Gaussian (Lesson 23) is

\[
\mathcal N(x;\mu,\Sigma)=\frac{1}{(2\pi)^{d/2}|\Sigma|^{1/2}}\exp\!\Big(-\tfrac12d^2\Big),\qquad d^2=(x-\mu)^T\Sigma^{-1}(x-\mu),
\]

where μ is the mean, Σ the covariance matrix and d the Mahalanobis distance: the number of standard deviations from the mean, allowing for correlation. Points of equal density lie on ellipses whose axes are the eigenvectors of Σ, with half-lengths \(\sqrt{\lambda_i}\) for d = 1. Three rules make Gaussians the natural language of tracking: they stay Gaussian under linear maps, independent Gaussian noises add their covariances, and conditioning on part of a Gaussian vector leaves a Gaussian.

## Rule 1: linear maps

If \(x\sim\mathcal N(\mu,\Sigma)\), then for any matrix A and vector b

\[
Ax+b\sim\mathcal N\big(A\mu+b,\ A\Sigma A^T\big).
\]

The mean simply follows the map; the covariance is sandwiched, because \(\operatorname{Cov}(Ax)=\mathbb E[A(x-\mu)(x-\mu)^TA^T]\). Take a state of position and velocity, \(x=(p,v)\), with \(\Sigma=I\), and one time step \(p\leftarrow p+v\), that is \(A=F=\begin{bmatrix}1&1\\0&1\end{bmatrix}\). Then \(F\Sigma F^T=\begin{bmatrix}2&1\\1&1\end{bmatrix}\): the position becomes more uncertain, and it becomes correlated with the velocity, because a higher velocity means a larger position. Gaussian splatting (Lesson 68) projects 3D covariances to the image with this same \(J\Sigma J^T\).

## Rule 2: conditioning

Split a Gaussian vector into parts a and b with covariance blocks \(\Sigma_{aa},\Sigma_{ab},\Sigma_{bb}\). Observing \(b=x_b\) leaves

\[
\mu_{a|b}=\mu_a+\Sigma_{ab}\Sigma_{bb}^{-1}(x_b-\mu_b),\qquad \Sigma_{a|b}=\Sigma_{aa}-\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}.
\]

The mean moves by the regression of a on b, and the variance shrinks by an amount that depends only on how strongly a and b covary, not on the value observed. With zero means, \(\Sigma_{aa}=4\), \(\Sigma_{ab}=2\), \(\Sigma_{bb}=2\) and an observation \(x_b=1\), the conditional mean is \(2/2\cdot1=1\) and the variance \(4-2\cdot2/2=2\), half the prior. The subtracted term \(\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}\) is called a Schur complement correction; it returns in bundle adjustment (Lesson 63) and diffusion denoising (Lesson 67).

## The Kalman filter: predict, then condition

A Kalman filter tracks a state x with a linear motion model and a linear measurement model, each with Gaussian noise: \(x_k=Fx_{k-1}+w\) with \(w\sim\mathcal N(0,Q)\), and \(z_k=Hx_k+r\) with \(r\sim\mathcal N(0,R)\).

Predict with rule 1 and the added process noise:

\[
x^-=Fx,\qquad P^-=FPF^T+Q.
\]

Update with rule 2. Before the measurement arrives, x and z are jointly Gaussian with \(\operatorname{Cov}(z)=HP^-H^T+R=S\) and \(\operatorname{Cov}(x,z)=P^-H^T\). Conditioning on the observed z gives

\[
K=P^-H^TS^{-1},\qquad x=x^-+K\,(z-Hx^-),\qquad P=(I-KH)\,P^-.
\]

\(y=z-Hx^-\) is the innovation, the surprise in the measurement, and K, the Kalman gain, says how much of it to believe: large when the prediction is uncertain (large \(P^-\)), small when the sensor is noisy (large R).

Work one step. Start at position 0 with velocity 1, \(P=I\), \(F=\begin{bmatrix}1&1\\0&1\end{bmatrix}\), \(Q=0\), \(H=[1\ 0]\) (only position is measured) and \(R=1\). Predict: \(x^-=(1,1)\) and \(P^-=\begin{bmatrix}2&1\\1&1\end{bmatrix}\). Measure z = 2: the innovation is 1, \(S=2+1=3\) and \(K=(2/3,\ 1/3)\), so \(x=(5/3,\ 4/3)\) and \(P=\begin{bmatrix}2/3&1/3\\1/3&2/3\end{bmatrix}\). The velocity rose from 1 to 4/3 although it was never measured: the off-diagonal entry of \(P^-\) linked it to the position. For the position alone, precisions add as in a product of two Gaussians: \(1/2+1/1=3/2\), a variance of 2/3.

When the motion or measurement is nonlinear, \(z=h(x)\), the extended Kalman filter uses the Jacobians of Lesson 19, \(F=\partial f/\partial x\) and \(H=\partial h/\partial x\), at the current estimate. For a range sensor \(h(x)=\sqrt{x_1^2+x_2^2}\) at (3, 4), \(H=(0.6,\ 0.8)\).

## Gating with the innovation

If the model is right, the innovation is Gaussian with covariance S, so \(d^2=y^TS^{-1}y\) measures how surprising a measurement is. For a k-dimensional innovation, \(d^2\) follows a chi-squared distribution with k degrees of freedom: the sum of k squared standard normal variables. 95% of correct measurements have \(d^2<3.84\) when k = 1 and \(d^2<5.99\) when k = 2, the usual gates. In the example \(S=3\): z = 2 gives \(d^2=1/3\) and is accepted, while z = 6 gives \(d^2=25/3\approx8.33\) and is rejected as belonging to something else.

## Data association: who is who?

With several tracks and several detections per frame, a tracker must decide which detection updates which track. Build a cost matrix \(C_{ij}\), for example \(1-\text{IoU}\) (Lesson 42) between the predicted box of track i and detection j, or the gated \(d^2\). The assignment problem chooses one detection per track to minimise the total cost, \(\min_\sigma\sum_iC_{i\sigma(i)}\). Greedy matching is not enough. With costs \(\begin{bmatrix}0.1&0.2\\0.3&0.9\end{bmatrix}\), greedy takes the smallest entry 0.1 first and is then forced into 0.9, a total of 1.0; the optimum pairs track 1 with detection 2 and track 2 with detection 1, a total of 0.2 + 0.3 = 0.5.

The Hungarian algorithm finds the optimum in \(O(n^3)\) time instead of trying all \(n!\) orders. Subtracting a constant from a whole row or column changes every assignment's total by the same amount, so it never changes which assignment is best. The algorithm subtracts each row's minimum and then each column's minimum, covers all zeros with as few lines as possible and, while fewer than n lines are needed, shifts the smallest uncovered value from the uncovered entries to the doubly covered ones. Once n independent zeros exist, they are the assignment. For the 2×2 example, row reduction gives \(\begin{bmatrix}0&0.1\\0&0.6\end{bmatrix}\) and column reduction \(\begin{bmatrix}0&0\\0&0.5\end{bmatrix}\); the independent zeros are (1, 2) and (2, 1).

SORT combines exactly these parts: a Kalman filter on each box's centre, size and velocity, Hungarian matching on IoU with a minimum-IoU gate, new tracks from unmatched detections and deletion after a few missed frames. DeepSORT adds an appearance descriptor to the cost, and ByteTrack also matches low-confidence detections. DETR (Lesson 65) uses Hungarian matching for its training loss.

## Practice before opening the answers

1. Let \(x\sim\mathcal N\big((2,1),\operatorname{diag}(1,4)\big)\) and \(y=Ax\) with \(A=\begin{bmatrix}1&1\\0&1\end{bmatrix}\). Find the mean and covariance of y, then the Mahalanobis distance of the point (5, 3) from y's mean.
2. Run one Kalman step for \(x=(0,2)\), \(P=I\), \(F=\begin{bmatrix}1&1\\0&1\end{bmatrix}\), \(Q=0\), \(H=[1\ 0]\), \(R=2\) and measurement z = 3.5. Give \(x^-\), \(P^-\), S, K, the updated x and P.
3. With the S of question 2, which of the measurements 3.5, 6.5 and −2 pass a 95% gate, \(d^2<3.84\)?
4. Three tracks and three detections have costs \(\begin{bmatrix}0.1&0.3&0.9\\0.2&0.9&0.9\\0.9&0.4&0.3\end{bmatrix}\). Find the greedy assignment and its total, then the optimal assignment with the Hungarian algorithm.

## Check your understanding

Derive the Kalman predict step from the linear-transform rule and the update from Gaussian conditioning, explain how a velocity that is never measured gets corrected, gate a measurement with its innovation, and solve a small assignment problem optimally.

## Read with a purpose

MML 6.5.1, 6.5.2, 6.5.3 and 4.3; CV Appendix B.1 and B.6, 9.4.4 and 11.5. Kalman (1960) is the original filter; Bewley et al. (2016), "Simple online and realtime tracking", shows how far a Kalman filter and the Hungarian algorithm go on their own; Kuhn (1955) describes the Hungarian method. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
