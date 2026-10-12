# Lesson 61 - Epipolar geometry and the eight-point algorithm

**Module:** 16 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 49, 50, 51 and 52; the cross product and its skew matrix come from Lesson 49, the camera model from Lesson 51, and the null vector of the SVD and Hartley normalisation from Lessons 14 and 50. Lesson 58 shows how matches are found; here they are given.

**Goal:** Derive the epipolar constraint for calibrated (E) and uncalibrated (F) cameras, estimate F with the normalised eight-point algorithm inside RANSAC, and recover the camera motion (R, t) from E.

## A match must lie on a line

Two cameras photograph the same scene point. Write the point in the first camera's frame as \(X_1\) and in the second camera's frame as \(X_2=RX_1+t\), the extrinsics of Lesson 51 with camera 1 playing the role of the world. Work in normalised image coordinates \(\hat x=K^{-1}x=(X/Z,\ Y/Z,\ 1)\): a pixel with the intrinsics removed, so the hat here means "normalised", not "estimated".

From one image the point could be anywhere on the ray through \(\hat x_1\). The second camera sees that ray as a line, so the match of \(\hat x_1\) must lie on one line in image 2, its **epipolar line**. A search for matches becomes a search along a line. Three names help:

- the **baseline** joins the two camera centres;
- the **epipolar plane** contains the baseline and the scene point, and cuts each image in an epipolar line;
- the **epipole** is where one camera sees the other camera's centre. Every epipolar line in an image passes through its epipole.

## The essential matrix from a triple product

In camera 2's frame, the vector from camera 2 to the point is \(X_2\), parallel to \(\hat x_2\). Camera 1's centre sits at \(R\cdot0+t=t\), and the ray from camera 1 points along \(R\hat x_1\). All three vectors lie in the epipolar plane. Three vectors are coplanar exactly when their scalar triple product \(a\cdot(b\times c)=\det[a\ b\ c]\) is zero (Lessons 07 and 49): \(b\times c\) is perpendicular to the plane of b and c, so a third vector in that plane has zero dot product with it. Writing the cross product as the skew matrix \([t]_\times\) gives

\[
\hat x_2^T\,[t]_\times R\,\hat x_1=0,\qquad E=[t]_\times R.
\]

E is the **essential matrix**. Since \([t]_\times t=0\), E has rank 2. Its singular values are \((\sigma,\sigma,0)\), and it has five degrees of freedom: three for the rotation and two for the direction of t. Scaling t scales E without changing the constraint, so two views fix the direction of the translation but not its length.

## Worked example: a sideways step

Take R = I and t = (1, 0, 0). Then

\[
E=[t]_\times=\begin{bmatrix}0&0&0\\0&0&-1\\0&1&0\end{bmatrix},
\]

with singular values (1, 1, 0). The point \(X_1=(1,2,4)\) projects to \(\hat x_1=(0.25,\ 0.5,\ 1)\). In camera 2 it is \(X_2=(2,2,4)\), so \(\hat x_2=(0.5,\ 0.5,\ 1)\). The epipolar line is \(E\hat x_1=(0,-1,0.5)\), the line \(-y+0.5=0\), that is \(y=0.5\), and \(\hat x_2^TE\hat x_1=0-0.5+0.5=0\). Had the point been twice as far along the same ray, at (2, 4, 8), camera 2 would see it at (0.375, 0.5): still on y = 0.5. Depth slides a match along its epipolar line but never off it.

All epipolar lines are horizontal here. The epipole \(e_2\simeq t=(1,0,0)\) has last coordinate 0, a point at infinity along x, so the lines meet only at infinity. A sideways step gives an already rectified stereo pair, which Lesson 62 exploits.

## Pixels: the fundamental matrix

Substituting \(\hat x=K^{-1}x\) into the constraint gives \(x_2^TFx_1=0\) with the **fundamental matrix**

\[
F=K_2^{-T}E\,K_1^{-1}.
\]

\(l_2=Fx_1\) is the epipolar line of \(x_1\) in image 2, stored as (a, b, c) for \(ax+by+c=0\), and \(l_1=F^Tx_2\) is the line in image 1. The epipoles are the null vectors: \(Fe_1=0\) and \(F^Te_2=0\). F has 9 entries, minus one for scale and one for \(\det F=0\), so 7 degrees of freedom. With \(f=400\) and \(c=(320,240)\) for both cameras, the example's points are the pixels (420, 440) and (520, 440). Here \(F=E/400\), and \(Fx_1\) is proportional to (0, 1, −440): the row v = 440. The match moved 100 pixels along its row, which is \(fB/Z=400\cdot1/4\). The distance of a pixel from a line, \(|x_2^Tl_2|/\sqrt{a^2+b^2}\), is the usual error in pixels.

## The eight-point algorithm

Expanding \(x_2^TFx_1=\sum_{i,j}(x_2)_iF_{ij}(x_1)_j\) shows that each match \((x_1,y_1)\leftrightarrow(x_2,y_2)\) gives one linear equation in \(f=(F_{11},F_{12},\ldots,F_{33})\):

\[
\begin{bmatrix}x_2x_1&x_2y_1&x_2&y_2x_1&y_2y_1&y_2&x_1&y_1&1\end{bmatrix}f=0.
\]

For the example's normalised points the row is (0.125, 0.25, 0.5, 0.125, 0.25, 0.5, 0.25, 0.5, 1), and E's entries (0, 0, 0, 0, 0, −1, 0, 1, 0) give \(-0.5+0.5=0\). Eight matches fix the eight ratios. The normalised algorithm (Hartley) has four steps:

1. Normalise each image's points as in Lesson 50: centroid at the origin, mean distance \(\sqrt2\). Raw pixel coordinates put entries such as \(x_2x_1\approx250{,}000\) next to the final 1; in the lab the unnormalised estimate misses the matches by several pixels, while the normalised one is as accurate as the noise allows.
2. Stack the rows of all n ≥ 8 matches into A and take f as the right singular vector with the smallest singular value (Lesson 14).
3. Enforce rank 2: write \(\hat F=U\operatorname{diag}(\sigma_1,\sigma_2,\sigma_3)V^T\) and set \(\sigma_3=0\), the closest rank-2 matrix (Lesson 14). Without this step the epipolar lines do not all pass through one epipole.
4. Undo the normalisation: \(F=T_2^T\hat F\,T_1\). The transpose on the left, unlike \(H=T'^{-1}\hat HT\), appears because F sends points to lines.

Real matches contain mistakes, so the eight-point solver runs inside RANSAC (Lesson 52), scoring each candidate by the epipolar distance of every match. With half the matches wrong and p = 0.99, eight-point samples need 1177 draws. The seven-point algorithm uses det F = 0 and needs 588; for calibrated cameras the five-point algorithm (Nistér) needs only 146. The final F is refitted on the inliers, often by minimising the Sampson error, a first-order approximation of the geometric distance.

## From E back to R and t

With known intrinsics, \(E=K_2^TFK_1\). Take its SVD, forcing the singular values to (1, 1, 0) and det U = det V = +1: \(E=U\operatorname{diag}(1,1,0)V^T\). With \(W=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}\),

\[
R\in\{UWV^T,\ UW^TV^T\},\qquad t=\pm u_3,
\]

where \(u_3\) is the third column of U. That gives four candidate motions, and only one places the triangulated points in front of both cameras. For the example, triangulating the match under each candidate gives the depths (4, 4), (−4, −4), (1.33, −1.33) and (−1.33, 1.33) in cameras 1 and 2, so R = I, t = (1, 0, 0) is kept. The length of t is set to 1: two images alone cannot tell a model house from a real one.

## When two views are not enough

- **Pure rotation.** With t = 0, E = 0. Every match obeys \(x_2\simeq KRK^{-1}x_1\), a homography (Lesson 50): there is no parallax and no depth.
- **A planar scene.** Matches again obey \(x_2\simeq Hx_1\). The eight-point matrix A then has rank 6, so a three-dimensional family of F fits the data equally well, and the pose read from it is meaningless. SLAM initialisers such as ORB-SLAM fit both a homography and F and keep the model that scores better.
- **A tiny baseline** is close to pure rotation: depth, and the direction of t, become very uncertain.

Epipolar geometry is the first step of structure from motion (COLMAP), visual odometry and SLAM. Benchmarks for learned matchers such as SuperGlue and LightGlue report the accuracy of the pose recovered from E, and multi-view transformers restrict attention to epipolar lines. The camera poses that NeRF and Gaussian splatting train on (Lesson 64) come from this pipeline, refined by bundle adjustment (Lesson 63).

## Practice before opening the answers

1. Take R = I and t = (0, 1, 0), a vertical step. Write E = [t]×, check the epipolar constraint for X₁ = (1, 2, 4), and describe the epipolar lines in image 2.
2. Write the eight-point row for the pixel match (100, 50) ↔ (120, 40), and explain why the raw pixel row is badly scaled.
3. An estimate of E has singular values (1.2, 0.8, 0.05). What are the singular values of the closest essential matrix, and how far is it in the Frobenius norm? With 40% wrong matches and p = 0.99, how many RANSAC samples do the eight-point and five-point algorithms need?
4. A camera moves straight forward without turning: X₂ = X₁ + t with t = (0, 0, −1). Find E, the epipole in each image and the epipolar line of x̂₁ = (0.25, 0.5, 1). Where does X₁ = (1, 2, 4) appear in image 2?

## Check your understanding

Derive \(\hat x_2^TE\hat x_1=0\) from the coplanarity of the two rays and the baseline, write one eight-point row from a match, explain why the estimate is normalised first and truncated to rank 2 afterwards, and say which camera motions or scenes leave F undetermined.

## Read with a purpose

CV 11.3 (11.3.1-11.3.4) and 12.1; Guo Part II, Chapter 1. Primary sources: Longuet-Higgins (1981), who introduced the essential matrix; Hartley (1997), "In defense of the eight-point algorithm"; Nistér (2004) for the five-point algorithm. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
