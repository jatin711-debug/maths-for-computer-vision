# Lesson 51 - The pinhole camera, rotations and calibration

**Module:** 13 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 49, 07 and 13; the calibration section also uses the homographies of Lesson 50.

**Goal:** Project 3D points to pixels with K[R|t] and explain rotation representations, intrinsics and lens distortion.

## Similar triangles: the pinhole model

Put the camera centre at the origin, looking along the positive Z axis, with the image plane at distance f in front of it. The ray from a point (X, Y, Z) to the centre crosses that plane where the two triangles with sides (x, f) and (X, Z) are similar:

\[
x=f\,\frac{X}{Z},\qquad y=f\,\frac{Y}{Z}.
\]

With f = 800 pixels, a point 0.5 m to the right of the optical axis at depth Z = 4 m lands \(800\cdot0.5/4=100\) pixels from the image centre. The point (1, 0, 8), twice as wide and twice as far, lands on the same pixel: one image cannot separate size from distance, which is why monocular depth needs learned priors or known object sizes. The formula only makes sense for Z > 0. A point behind the camera gives a negative Z and would appear mirrored through the centre, so it must be discarded (or a line clipped at a near plane) before dividing.

## Intrinsics: from the image plane to pixel indices

Pixel coordinates start at the image corner, and the two axes can have different scales. The intrinsic matrix collects these conventions:

\[
K=\begin{bmatrix}f_x&s&c_x\\0&f_y&c_y\\0&0&1\end{bmatrix},\qquad \lambda\begin{bmatrix}u\\v\\1\end{bmatrix}=K\begin{bmatrix}X\\Y\\Z\end{bmatrix},\quad \lambda=Z.
\]

\(f_x\) and \(f_y\) are the focal length measured in pixel widths and heights, \((c_x,c_y)\) is the principal point where the optical axis meets the sensor, and the skew s is almost always 0. With \(f_x=f_y=800\), \(c_x=320\), \(c_y=240\), the camera-frame point (0.5, −0.25, 4) gives \(u=800\cdot0.125+320=420\) and \(v=800\cdot(-0.0625)+240=190\). A 640-pixel-wide image then spans a horizontal field of view of \(2\arctan\big(640/(2\cdot800)\big)\approx43.6^\circ\); a shorter focal length widens the view.

Image augmentations change K. Cropping at offset \((x_0,y_0)\) moves the principal point to \((c_x-x_0,\ c_y-y_0)\); resizing by a factor a multiplies \(f_x, f_y, c_x, c_y\) by a (in continuous coordinates with the origin at the image corner). A depth or 3D-detection network trained on crops and resizes that keep the old K learns inconsistent geometry.

## Extrinsics and the 3×4 camera matrix

World points are first moved into the camera frame by a rotation and a translation, \(X_c=RX_w+t\). Together with K this gives the 3×4 matrix \(P=K[R\,|\,t]\), which acts on homogeneous world points \((X,Y,Z,1)\) exactly as the 3×3 matrices of Lesson 49 act on 2D points:

\[
\lambda\begin{bmatrix}u\\v\\1\end{bmatrix}=K\,[R\,|\,t]\begin{bmatrix}X\\Y\\Z\\1\end{bmatrix}.
\]

If the camera sits at world position C = (0, 0, −5) with R = I, then \(t=-RC=(0,0,5)\) and \(P=\begin{bmatrix}800&0&320&1600\\0&800&240&1200\\0&0&1&5\end{bmatrix}\). The world point (1, 0, 0) gives \(P(1,0,0,1)^T=(2400,1200,5)\), the pixel (480, 240). The camera centre is the one point P cannot image: \(P(0,0,-5,1)^T=0\).

For points on the world plane Z = 0, the third column of R drops out: \(P(X,Y,0,1)^T=K[r_1\ r_2\ t](X,Y,1)^T\). A plane is imaged by the 3×3 homography \(H=K[r_1\ r_2\ t]\), which is where the homographies of Lesson 50 come from.

## Four ways to write a rotation

A rotation matrix is orthonormal, \(R^TR=I\), with \(\det R=+1\); determinant −1 would be a reflection. It has 9 entries but 3 degrees of freedom. Its axis is an eigenvector with eigenvalue 1 (Lesson 13), and its angle satisfies \(\operatorname{tr}R=1+2\cos\theta\). For \(R=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}\) the trace is 1, so \(\cos\theta=0\) and \(\theta=90^\circ\), about the axis (0, 0, 1).

- **Axis–angle (Rodrigues).** A unit axis n and angle θ, often stored as one 3-vector \(\omega=\theta n\). Rodrigues' formula rebuilds the matrix: \(R=I+\sin\theta\,[n]_\times+(1-\cos\theta)[n]_\times^2\), where \([n]_\times\) is the matrix of the cross product with n. Calibration and pose optimizers use ω because it has exactly three numbers and no constraint to maintain. Two cautions: at \(\theta=\pi\) the axes n and −n give the same rotation, so ω is not unique there; and practical optimisers do not add steps to ω directly but apply a small rotation on top of the current one, \(R\leftarrow R\exp([\delta]_\times)\) (Lesson 63).
- **Euler angles.** Three turns about coordinate axes, for example yaw ψ, pitch θ and roll φ in \(R=R_z(\psi)R_y(\theta)R_x(\phi)\). They are easy to read but convention-dependent, and at \(\theta=\pm90^\circ\) the first and last turns act about the same axis: for this convention at θ = 90°, R depends only on ψ − φ. This loss of one degree of freedom is gimbal lock, and near it small changes of R need large jumps of the angles.
- **Unit quaternions.** \(q=(\cos\tfrac\theta2,\ \sin\tfrac\theta2\,n)\), four numbers with \(\|q\|=1\), no gimbal lock and smooth interpolation. The 90° turn above is \(q\approx(0.707,0,0,0.707)\). Both q and −q give the same rotation (a double cover), so a regression loss must treat them as equal, for example \(1-|q\cdot\hat q|\).

## Calibration and lens distortion

Calibration estimates K from several photos of a flat checkerboard with known square size. In each photo the board plane is mapped to the image by a homography \(H=\lambda K[r_1\ r_2\ t]\), estimated from the detected corners with the DLT of Lesson 50. Because \(r_1\) and \(r_2\) are orthonormal, each homography gives two equations, \(h_1^TBh_2=0\) and \(h_1^TBh_1=h_2^TBh_2\), on the symmetric matrix \(B=K^{-T}K^{-1}\). B has five unknowns up to scale, so three views at different tilts determine it in general, and K follows from B. All parameters are then refined together by minimizing the reprojection error over every corner, which is the nonlinear least squares of Lesson 52.

Real lenses bend straight lines. The common radial model works in normalized coordinates \(x=X/Z,\ y=Y/Z\) with \(r^2=x^2+y^2\):

\[
x_d=x\,(1+k_1r^2+k_2r^4),\qquad y_d=y\,(1+k_1r^2+k_2r^4),\qquad u=f_xx_d+c_x.
\]

With \(k_1<0\) points are pulled towards the centre (barrel distortion); with \(k_1>0\) they are pushed out (pincushion). For x = 0.4, y = 0.3 we get \(r^2=0.25\); with \(k_1=-0.2\) the factor is 0.95, so the point moves to (0.38, 0.285). With \(f_x=f_y=800\) that is 16 pixels left and 12 up, 20 pixels in all. The model is only valid near the centre: for \(k_1<0\) it folds back beyond \(r^2=-1/(3k_1)\).

These matrices sit inside many vision models. A monocular 3D detector turns a box centre and a predicted depth into a 3D position with \(X=(u-c_x)Z/f_x\); a depth network trained on one focal length misjudges distances on another; triangulation and epipolar geometry need K for each view; NeRF-style models cast one ray per pixel in the direction \(R^TK^{-1}(u,v,1)^T\), so wrong intrinsics blur the whole reconstruction.

## Practice before opening the answers

1. A camera has fx = fy = 500, cx = 320, cy = 240, R = I and t = (0, 0, 1). Project the world point (0.6, 0.3, 2).
2. A 640-pixel-wide image has fx = 320. Find its horizontal field of view. Which fx gives a 60° field of view?
3. Show that R = [[0,−1,0],[1,0,0],[0,0,1]] is a rotation, find its angle from the trace and its axis, and give a unit quaternion for it. Why does −q describe the same rotation?
4. A 1280 × 960 image with fx = fy = 1000, cx = 640, cy = 480 is cropped to the region starting at pixel (200, 100), and the crop is resized by a factor 0.5. What is the new K?

## Check your understanding

Project a 3D point with K[R|t] step by step, say which entries of K change under a crop or a resize, convert a rotation matrix to its angle and axis, and explain why one checkerboard view gives two equations on K.

## Read with a purpose

CV 2.1.3-2.1.5 and 11.1; MML 3.9; Guo Part IV, Chapter 2, Sections 1-2 and Part IV, Chapter 3. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
