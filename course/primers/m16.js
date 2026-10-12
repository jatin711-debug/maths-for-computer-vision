/* Primers for Module 16 (Lessons 61-64). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  add(61, {
    builds: [{lesson: 49, why: 'cross products, skew matrices and lines stored as 3-vectors'}, {lesson: 51, why: 'cameras K[R | t] and the division by depth'}, {lesson: 50, why: 'the DLT null vector and Hartley normalisation'}],
    recall: ['cross-product', 'determinant', 'intrinsic-matrix', 'singular-value-decomposition', 'ransac'],
    symbols: [
      ['E', 'essential matrix: the two-view constraint for normalised points', 'essential-matrix'],
      ['F', 'fundamental matrix: the same constraint written for pixel coordinates', 'fundamental-matrix'],
      ['x̂', 'normalised image point K⁻¹x: a pixel with the camera’s intrinsics removed', 'essential-matrix'],
      ['[t]×', 'skew matrix of the translation t, so that [t]× v = t × v (Lesson 49)'],
      ['l₂', 'epipolar line in image 2: where the match of x₁ must lie', 'epipolar-geometry']
    ],
    terms: [
      {
        id: 'epipolar-geometry', term: 'Epipolar plane, line and epipole', symbol: T`l_2=F\,x_1`,
        plain: T`The geometry of two cameras looking at one point. The two camera centres and the point span a plane, the epipolar plane, which cuts each image in a line. So the match of a point in image 1 must lie on one line in image 2, its epipolar line, and the search for matches becomes a search along a line. All epipolar lines in an image meet at its epipole, the image of the other camera’s centre.`,
        steps: [T`Join the two camera centres: this segment is the baseline.`, T`The plane through the baseline and the scene point is the epipolar plane.`, T`It cuts each image in an epipolar line; the point’s two images lie on these lines.`, T`Every epipolar line in image 2 passes through the epipole \(e_2\), where camera 2 sees camera 1’s centre.`],
        examples: [[T`sideways step \(t=(1,0,0)\), \(\hat x_1=(0.25,0.5)\)`, T`epipolar line \(y=0.5\) in image 2; all lines horizontal`], [T`that point at depth 4, then at depth 8 on the same ray`, T`seen at \((0.5,0.5)\), then at \((0.375,0.5)\): both on \(y=0.5\)`], [T`forward step \(t=(0,0,-1)\), \(\hat x_1=(0.25,0.5)\)`, T`epipole at the image centre; line \(y=2x\) through it`]],
        pitfall: T`The epipolar line says where the match can be, not where it is. The unknown depth slides the match along the line, so a second cue (appearance, Lesson 58) still has to pick the right point on it.`,
        seeAlso: [62]
      },
      {
        id: 'scalar-triple-product', term: 'Scalar triple product and coplanarity', symbol: T`a\cdot(b\times c)`,
        plain: T`Take the cross product of two 3-vectors, then its dot product with a third. The result equals the determinant of the matrix with columns a, b and c: the signed volume of the box the three vectors span. It is zero exactly when the three vectors lie in one plane, which is the test that gives the epipolar constraint.`,
        formula: T`a\cdot(b\times c)=a^T[b]_\times c=\det\begin{bmatrix}a&b&c\end{bmatrix}`,
        steps: [T`Compute \(b\times c\) (Lesson 49). It is perpendicular to both b and c.`, T`Take its dot product with a.`, T`Zero means a lies in the plane of b and c: the three vectors are coplanar.`],
        examples: [[T`\(a=(1,0,0)\), \(b=(0,1,0)\), \(c=(0,0,1)\)`, T`\(b\times c=(1,0,0)\), so the product is 1: the unit cube`], [T`\(a=(1,1,0)\), \(b=(0,2,0)\), \(c=(0,0,3)\)`, T`\(b\times c=(6,0,0)\), product 6 = the box’s volume`], [T`\(a=(1,2,0)\), \(b=(0,1,0)\), \(c=(1,0,0)\)`, T`0: all three lie in the plane \(z=0\)`], [T`\(\hat x_2=(0.5,0.5,1)\), \(t=(1,0,0)\), \(R\hat x_1=(0.25,0.5,1)\)`, T`\(t\times R\hat x_1=(0,-1,0.5)\), and \(\hat x_2\cdot(0,-1,0.5)=0\): coplanar`]],
        pitfall: T`Swapping two of the vectors flips the sign of the product but not whether it is zero, so the coplanarity test does not care about the order.`
      },
      {
        id: 'essential-matrix', term: 'Essential matrix', symbol: T`E=[t]_\times R`,
        plain: T`A 3 × 3 matrix that stores the motion (R, t) between two calibrated cameras. For every true match in normalised coordinates \(\hat x=K^{-1}x\) it gives \(\hat x_2^TE\hat x_1=0\), and \(E\hat x_1\) is the epipolar line. It has rank 2 and singular values \((\sigma,\sigma,0)\); its 5 degrees of freedom are the rotation and the direction of t, because the length of t is lost.`,
        formula: T`\hat x_2^{T}E\,\hat x_1=0,\qquad E=[t]_\times R,\qquad \hat x=K^{-1}x=\Bigl(\frac XZ,\ \frac YZ,\ 1\Bigr)`,
        steps: [T`Remove the intrinsics: \(\hat x=K^{-1}x\), that is \(((u-c_x)/f_x,\ (v-c_y)/f_y,\ 1)\).`, T`Build \([t]_\times\) (Lesson 49) and multiply by R to get E.`, T`For a candidate match, compute the line \(E\hat x_1\), then its dot product with \(\hat x_2\). A true match gives 0.`],
        examples: [[T`\(R=I\), \(t=(1,0,0)\)`, T`\(E=\begin{bmatrix}0&0&0\\0&0&-1\\0&1&0\end{bmatrix}\), singular values \((1,1,0)\)`], [T`\(\hat x_1=(0.25,0.5,1)\)`, T`\(E\hat x_1=(0,-1,0.5)\): the line \(y=0.5\)`], [T`\(\hat x_2=(0.5,0.5,1)\)`, T`\(\hat x_2^TE\hat x_1=-0.5+0.5=0\)`], [T`\(R=I\), \(t=(0,1,0)\)`, T`\(E=\begin{bmatrix}0&0&1\\0&0&0\\-1&0&0\end{bmatrix}\): vertical epipolar lines`]],
        pitfall: T`E needs normalised coordinates, not pixels. And doubling t doubles E without changing any epipolar line: two views fix only the direction of the translation.`,
        seeAlso: [62]
      },
      {
        id: 'fundamental-matrix', term: 'Fundamental matrix', symbol: T`F=K_2^{-T}EK_1^{-1}`,
        plain: T`The essential matrix rewritten for pixel coordinates, so it works even when the intrinsics are unknown. True matches satisfy \(x_2^TFx_1=0\); \(Fx_1\) is the epipolar line in image 2 and \(F^Tx_2\) the line in image 1. F has rank 2, so its 9 entries have only 7 degrees of freedom (scale and \(\det F=0\) remove two).`,
        formula: T`x_2^{T}F\,x_1=0,\qquad l_2=Fx_1,\qquad Fe_1=0,\quad F^Te_2=0,\qquad d=\frac{|x_2^Tl_2|}{\sqrt{a^2+b^2}}`,
        steps: [T`Write both pixels as \((u,v,1)\).`, T`Compute the line \(l_2=Fx_1=(a,b,c)\), meaning \(au+bv+c=0\).`, T`The error of a match is the distance of \(x_2\) from that line, \(|x_2^Tl_2|/\sqrt{a^2+b^2}\) pixels.`, T`The epipoles are the null vectors: \(Fe_1=0\) and \(F^Te_2=0\).`],
        examples: [[T`\(f=400\), \(c=(320,240)\), sideways step`, T`\(F=E/400\)`], [T`\(x_1=(420,440)\)`, T`\(Fx_1\propto(0,1,-440)\): the row \(v=440\)`], [T`\(x_2=(520,440)\)`, T`on the line: the match moved 100 px along its row`], [T`\(x_2=(520,443)\)`, T`3 px from the line: not an exact match`]],
        pitfall: T`\(Fx_1\) is a line, not a point: (a, b, c) means \(au+bv+c=0\). Measure errors as distances to the line; the raw value \(x_2^TFx_1\) changes with the scale of F.`,
        seeAlso: [62]
      },
      {
        id: 'eight-point-algorithm', term: 'Normalised eight-point algorithm',
        plain: T`A linear way to estimate F. Each match gives one equation in the nine entries of F, so eight matches determine it as the null vector of a stacked matrix A, found with the SVD. Normalise the pixel coordinates first, force rank 2 afterwards, and run it inside RANSAC so that wrong matches cannot spoil it.`,
        formula: T`\begin{bmatrix}x_2x_1&x_2y_1&x_2&y_2x_1&y_2y_1&y_2&x_1&y_1&1\end{bmatrix}f=0`,
        steps: [T`Normalise each image’s points: centroid at the origin, mean distance \(\sqrt2\) (Lesson 50).`, T`Write one row per match and stack them into A; f is the right singular vector of A with the smallest singular value.`, T`Reshape f into \(\hat F\), take its SVD and set the smallest singular value to 0.`, T`Undo the normalisation: \(F=T_2^T\hat FT_1\).`],
        examples: [[T`pixels \((100,50)\leftrightarrow(120,40)\)`, T`row \((12000,6000,120,4000,2000,40,100,50,1)\): badly scaled`], [T`normalised \((0.25,0.5)\leftrightarrow(0.5,0.5)\)`, T`row \((0.125,0.25,0.5,0.125,0.25,0.5,0.25,0.5,1)\)`], [T`singular values \((1.2,0.8,0.05)\)`, T`rank-2 step: \((1.2,0.8,0)\)`], [T`half the matches wrong, \(p=0.99\)`, T`1177 RANSAC samples; the five-point solver needs 146`]],
        pitfall: T`Skipping the normalisation leaves entries near 250,000 beside a 1, and the estimate misses the matches by several pixels. Skipping the rank-2 step leaves epipolar lines that do not meet in one epipole.`
      },
      {
        id: 'essential-matrix-decomposition', term: 'Recovering R and t from E', symbol: T`E=U\operatorname{diag}(1,1,0)V^T`,
        plain: T`The SVD of E gives two possible rotations and two signs of t: four candidate camera motions. Only one places the triangulated points in front of both cameras, with positive depth in each, so keep that one. The length of t cannot be found from two images; it is set to 1.`,
        formula: T`R\in\{UWV^T,\ UW^TV^T\},\qquad t=\pm u_3,\qquad W=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}`,
        steps: [T`Compute \(E=K_2^TFK_1\) if you started from F.`, T`Take the SVD \(E=U\Sigma V^T\), with signs chosen so that \(\det U=\det V=+1\).`, T`Form the four pairs (R, t) above; \(u_3\) is the third column of U.`, T`Triangulate a match with each pair and keep the one with positive depth in both cameras.`],
        examples: [[T`\(E\) of the sideways step, candidate \(R=I\), \(t=(1,0,0)\)`, T`depths \((4,\ 4)\): in front of both, keep it`], [T`\(R=I\), \(t=(-1,0,0)\)`, T`depths \((-4,\ -4)\): behind both`], [T`\(R=\operatorname{diag}(1,-1,-1)\), \(t=(-1,0,0)\), then \(t=(1,0,0)\)`, T`depths \((1.33,\ -1.33)\), then \((-1.33,\ 1.33)\): behind one camera`]],
        pitfall: T`With noisy data, count how many matches end up in front under each candidate instead of trusting one point. And the recovered t is a unit direction: the scene is known only up to an overall scale.`,
        seeAlso: [63]
      }
    ]
  });

  add(62, {
    builds: [{lesson: 61, why: 'epipolar lines and the sideways-step geometry'}, {lesson: 20, why: 'the first-order Taylor approximation of Z(d)'}, {lesson: 34, why: 'sliding a window over every pixel'}],
    recall: ['epipolar-geometry', 'null-space', 'homography', 'taylor-approximation', 'standard-deviation'],
    symbols: [
      ['d', 'disparity: how many pixels a point shifts between the left and right images', 'disparity'],
      ['f', 'focal length in pixels, shared by both cameras of a rectified pair'],
      ['B', 'baseline: the distance between the two camera centres, in metres', 'disparity'],
      ['σ_d', 'standard deviation of the disparity error, in pixels', 'first-order-error-propagation'],
      ['pᵢᵀ', 'row i of a 3 × 4 camera matrix P, used to write the triangulation rows', 'triangulation']
    ],
    terms: [
      {
        id: 'triangulation', term: 'Triangulation (DLT)', symbol: T`\bigl(x\,p_3^T-p_1^T\bigr)X=0`,
        plain: T`Finding a 3D point from its images in two or more calibrated cameras: it is where the viewing rays meet. Multiplying out the projection’s division gives two linear equations per view in the homogeneous point \(X=(X,Y,Z,W)\); stack them and take the null vector with the SVD.`,
        formula: T`\begin{bmatrix}x_1p_3^{(1)T}-p_1^{(1)T}\\y_1p_3^{(1)T}-p_2^{(1)T}\\x_2p_3^{(2)T}-p_1^{(2)T}\\y_2p_3^{(2)T}-p_2^{(2)T}\end{bmatrix}X=0`,
        steps: [T`Write each camera matrix by rows \(p_1^T,p_2^T,p_3^T\).`, T`For each view add the rows \(x\,p_3^T-p_1^T\) and \(y\,p_3^T-p_2^T\).`, T`Take X as the right singular vector of the stacked matrix with the smallest singular value.`, T`Divide by the fourth entry W to read the point.`],
        examples: [[T`\(P_1=[I\,|\,0]\), \(P_2=[I\,|\,(-1,0,0)^T]\), match \((0.25,0.5)\leftrightarrow(0,0.5)\)`, T`rows \((-1,0,0.25,0)\), \((0,-1,0.5,0)\), \((-1,0,0,1)\), \((0,-1,0.5,0)\)`], [T`their null vector`, T`\((1,2,4,1)\): the point \((1,2,4)\)`], [T`\(P_2=[I\,|\,(-0.5,0,0)^T]\), match \((0.1,-0.2)\leftrightarrow(0,-0.2)\)`, T`the point \((0.5,-1,5)\)`]],
        pitfall: T`With noise the rays never quite meet, so the DLT returns an algebraic compromise. Refine it by minimising the reprojection error, and distrust points whose two rays are nearly parallel.`,
        seeAlso: [63]
      },
      {
        id: 'stereo-rectification', term: 'Stereo rectification', symbol: T`H_i=KR_{\text{rect}}R_i^TK^{-1}`,
        plain: T`Warping both images of a calibrated pair so that they look as if taken by two cameras pointing the same way, side by side along the baseline. Afterwards every epipolar line is a horizontal row, so a match of \((x,y)\) lies on the same row y and the search is one-dimensional.`,
        steps: [T`Choose the new orientation: first axis along the baseline \(C_2-C_1\), second perpendicular to it and to the old optical axis, third their cross product.`, T`Warp each image by the rotation homography \(H_i=KR_{\text{rect}}R_i^TK^{-1}\), with inverse mapping and bilinear sampling (Lesson 50).`, T`Check: matches now share a row, and F becomes the sideways-step matrix of Lesson 61.`],
        examples: [[T`baseline along x, camera 2 turned by 10°`, T`\(R_{\text{rect}}=I\): image 1 unchanged, image 2 turned back by 10°`], [T`that turn with \(f=500\)`, T`image 2’s centre moves by \(500\tan10^\circ\approx88\) px`], [T`after rectification, \(F\propto\begin{bmatrix}0&0&0\\0&0&-1\\0&1&0\end{bmatrix}\)`, T`\(x_2^TFx_1=y_1-y_2=0\): same row`]],
        pitfall: T`Rectification only rotates the cameras, so it cannot fix a wrong calibration: if K or R is off, matches end up a few rows apart and a row-only search misses them.`
      },
      {
        id: 'disparity', term: 'Disparity and depth', symbol: T`Z=\frac{fB}{d}`,
        plain: T`In a rectified pair, the disparity d is how many pixels further left a point appears in the right image. Near points shift a lot and far points hardly at all: depth is the focal length times the baseline divided by the disparity, so equal steps in d mean tiny depth steps nearby and huge ones far away.`,
        formula: T`d=x_L-x_R=\frac{fB}{Z},\qquad Z=\frac{fB}{d}`,
        steps: [T`Multiply the focal length f (pixels) by the baseline B (metres).`, T`Divide by the disparity d (pixels) to get the depth in metres.`, T`Zero disparity means the point is at infinity.`],
        examples: [[T`\(f=800\), \(B=0.1\), \(d=20\)`, T`\(Z=80/20=4\) m`], [T`\(d=19\) and \(d=21\)`, T`4.21 m and 3.81 m: about 0.2 m per pixel`], [T`\(d=4\)`, T`\(Z=20\) m; \(d=3\) gives 26.7 m`], [T`\(f=700\), \(B=0.12\), \(d=42\)`, T`\(Z=84/42=2\) m`]],
        plot: {fn: 'x => 80 / x', x: [2, 40], y: [0, 40], xLabel: 'disparity d (px), fB = 80', yLabel: 'depth Z (m)', marks: [4, 20]},
        pitfall: T`Disparity is measured in pixels and depth in the units of the baseline. Resizing the images halves both f (in pixels) and d, which leaves Z unchanged; changing only one of them does not.`
      },
      {
        id: 'first-order-error-propagation', term: 'First-order error propagation', symbol: T`\sigma_y\approx|g'(x)|\,\sigma_x`,
        plain: T`How the uncertainty of a measured input carries through a formula. Near the measured value replace the formula y = g(x) by its tangent line (Lesson 20); a straight line with slope a multiplies a standard deviation by |a| (Lesson 23). So the output’s standard deviation is about the slope’s size times the input’s.`,
        formula: T`y=g(x),\quad \sigma_y\approx|g'(x)|\,\sigma_x,\qquad Z=\frac{fB}{d}\ \Rightarrow\ \sigma_Z\approx\frac{fB}{d^2}\,\sigma_d=\frac{Z^2}{fB}\,\sigma_d`,
        steps: [T`Differentiate the formula: find \(g'(x)\).`, T`Evaluate it at the measured value.`, T`Multiply its absolute value by the input’s standard deviation.`],
        examples: [[T`\(y=3x\), \(\sigma_x=0.5\)`, T`\(\sigma_y=1.5\), exactly, because the formula is a line`], [T`\(y=x^2\) at \(x=4\), \(\sigma_x=0.1\)`, T`\(|2x|\,\sigma_x=0.8\)`], [T`\(Z=80/d\) at \(d=20\), \(\sigma_d=0.5\)`, T`\(\sigma_Z=16\cdot0.5/80=0.1\) m`], [T`the same at \(d=4\) (\(Z=20\) m)`, T`\(\sigma_Z=400\cdot0.5/80=2.5\) m`]],
        plot: {fn: 'x => x * x * 0.5 / 80', x: [0, 20], y: [0, 2.6], xLabel: 'depth Z (m), fB = 80, σ_d = 0.5', yLabel: 'depth error σ_Z (m)', marks: [4, 20]},
        pitfall: T`The rule is only first order. When \(\sigma_x\) is large compared with how quickly the slope changes, the true error is bigger and lopsided: \(80/3.5=22.9\) but \(80/4.5=17.8\), not \(20\pm2.5\).`
      },
      {
        id: 'cost-volume', term: 'Cost volume and block matching', symbol: T`C(x,y,d)`,
        plain: T`For every left pixel and every candidate disparity d, a cost that says how badly a small window around the pixel matches the window d pixels to the left in the right image. Stored for all pixels and all d, it is a 3D array; the simplest disparity estimate picks the cheapest d at each pixel (winner takes all).`,
        formula: T`C(x,y,d)=\sum_{(u,v)\in w}\bigl|I_L(x+u,y+v)-I_R(x+u-d,y+v)\bigr|,\qquad \hat d=\arg\min_dC(x,y,d)`,
        steps: [T`Fix a window size, for example 7 × 7, and a search range 0 to D.`, T`For each d, add up the absolute differences over the window (SAD).`, T`Pick the d with the smallest cost at each pixel.`, T`Where the cameras differ in brightness, use 1 − ZNCC: subtract each window’s mean and compare by cosine similarity (Lesson 06).`],
        examples: [[T`left window \((50,90,40)\); right windows for \(d=0,1,2\)`, T`costs 100, 110, 0: \(\hat d=2\)`], [T`two constant rows of 20`, T`every cost is 0: no disparity can be chosen`], [T`\((50,90,40)\) against \((60,108,48)\), 20% brighter`, T`SAD 36, but ZNCC = 1 (cost 0): a perfect match`]],
        pitfall: T`A small window is noisy on weak texture, and a large one smears depth edges, so a near object looks wider than it is. No window size fixes repeated texture, which gives several equal minima.`
      },
      {
        id: 'subpixel-refinement', term: 'Sub-pixel refinement by a parabola', symbol: T`d^*`,
        plain: T`The winner of the cost volume is a whole number of pixels, which makes depth jump in steps. Fit a parabola through the cost at the winner and at its two neighbours and move to the parabola’s lowest point: a shift of at most half a pixel towards the cheaper neighbour.`,
        formula: T`d^*=\hat d-\frac{C_+-C_-}{2\,(C_+-2C_0+C_-)}`,
        steps: [T`Read \(C_-=C(\hat d-1)\), \(C_0=C(\hat d)\) and \(C_+=C(\hat d+1)\).`, T`Compute the curvature term \(C_+-2C_0+C_-\), which is positive at a minimum.`, T`Shift the winner by \(-(C_+-C_-)/(2\cdot\text{curvature})\).`],
        examples: [[T`costs 30, 10, 20 at \(d=11,12,13\)`, T`\(d^*=12+10/60=12.17\)`], [T`costs 52, 20, 28 at \(d=17,18,19\)`, T`\(d^*=18+24/80=18.3\)`], [T`equal neighbours, such as 40, 10, 40`, T`\(d^*=\hat d\): no shift`]],
        pitfall: T`The parabola is only a model of the cost curve. SAD curves are V-shaped rather than round, so the estimates cluster near whole pixels (pixel locking); a better cost or interpolation reduces it.`
      }
    ]
  });

  add(63, {
    builds: [{lesson: 51, why: 'rotation matrices, axis–angle vectors and Rodrigues’ formula'}, {lesson: 52, why: 'Gauss–Newton and Levenberg–Marquardt steps'}, {lesson: 14, why: 'the SVD that Kabsch’s formula is built on'}],
    recall: ['rotation-matrix', 'matrix-exponential', 'singular-value-decomposition', 'determinant', 'gauss-newton'],
    symbols: [
      ['δ', 'a small rotation step stored as a 3-vector: axis times angle', 'exponential-map-update'],
      ['exp([δ]×)', 'that step turned into an exact rotation by Rodrigues’ formula', 'exponential-map-update'],
      ['H', 'cross-covariance of two centred, matched point sets', 'kabsch-algorithm'],
      ['B, C, E', 'camera, point and camera–point blocks of the bundle-adjustment equations', 'schur-complement'],
      ['δ_c', 'the camera update, solved after the points are eliminated', 'schur-complement']
    ],
    terms: [
      {
        id: 'special-orthogonal-group', term: 'Rotations as a manifold: SO(3)', symbol: T`SO(3)`,
        plain: T`The set of all 3D rotation matrices, those with \(R^TR=I\) and \(\det R=+1\). Multiplying two rotations gives a rotation, but adding them does not, so the set is a curved three-dimensional surface (a manifold) inside the nine-dimensional space of 3 × 3 matrices, as a globe’s surface is a curved 2D set in 3D space.`,
        formula: T`SO(3)=\{R:\ R^TR=I,\ \det R=+1\},\qquad \operatorname{angle}(R_1,R_2)=\arccos\frac{\operatorname{tr}(R_1^TR_2)-1}{2}`,
        steps: [T`To test a matrix, check \(R^TR=I\) and \(\det R=+1\).`, T`To compare two rotations, form \(R_1^TR_2\), the turn that takes one to the other.`, T`Its angle, from the trace (Lesson 51), is the distance between them.`],
        examples: [[T`\(R_z(90^\circ)\,R_z(90^\circ)\)`, T`\(R_z(180^\circ)\): still a rotation`], [T`\(R_z(90^\circ)+R_z(90^\circ)=2R_z(90^\circ)\)`, T`\(\det=2^3=8\): not a rotation`], [T`\(I+[\delta]_\times\) with \(\delta=(0,0,0.1)\)`, T`\(\det=1.01\): off the manifold`], [T`distance between \(R_z(30^\circ)\) and \(R_z(90^\circ)\)`, T`trace of \(R_z(60^\circ)\) is 2, so \(\arccos0.5=60^\circ\)`]],
        pitfall: T`Averaging rotation matrices entry by entry, or blending them linearly, gives a matrix that is not a rotation. Average or interpolate through the log and exponential maps, or with quaternions.`
      },
      {
        id: 'exponential-map-update', term: 'Updating a rotation with the exponential map', symbol: T`R\leftarrow R\exp([\delta]_\times)`,
        plain: T`Describe a small change of a rotation by a 3-vector δ (axis times angle) and apply it as \(R\exp([\delta]_\times)\), computed with Rodrigues’ formula (Lesson 51). The result is exactly a rotation for every δ, so an optimiser can solve for δ as three ordinary numbers. The derivative of a rotated point with respect to δ is \(-R[p]_\times\).`,
        formula: T`R\exp([\delta]_\times)\,p\approx Rp-R\,[p]_\times\,\delta,\qquad \frac{\partial\,R\exp([\delta]_\times)p}{\partial\delta}\Big|_{\delta=0}=-R\,[p]_\times`,
        steps: [T`Linearise each residual with the Jacobian \(-R[p]_\times\) for the rotation part.`, T`Solve the Gauss–Newton or Levenberg–Marquardt system for δ (Lesson 52).`, T`Update \(R\leftarrow R\exp([\delta]_\times)\) with Rodrigues’ formula, never \(R+R[\delta]_\times\).`, T`Repeat until δ is tiny.`],
        examples: [[T`\(\delta=(0,0,0.1)\), \(p=(1,0,0)\)`, T`exact \((0.995,\ 0.0998,\ 0)\); first order \((1,\ 0.1,\ 0)\)`], [T`\(\delta=(0,0,0.5)\)`, T`exact \((0.878,\ 0.479,\ 0)\), length 1; first order \((1,\ 0.5,\ 0)\), length 1.118`], [T`\(-[p]_\times\) for \(p=(1,0,0)\)`, T`rows \((0,0,0)\), \((0,0,1)\), \((0,-1,0)\)`], [T`additive updates aligning a copy turned by 60° (lab)`, T`the copy ends up 1.37 times too large`]],
        pitfall: T`Use the same side every time: \(R\exp([\delta]_\times)\) turns in the body’s own axes and \(\exp([\delta]_\times)R\) in world axes. Both work, but their Jacobians differ, and mixing them gives wrong steps.`
      },
      {
        id: 'kabsch-algorithm', term: 'Kabsch algorithm (point-set alignment)', symbol: T`R=V\operatorname{diag}(1,\ldots,d)U^T`,
        plain: T`The closed-form rotation and translation that best align two sets of matched points in the least-squares sense. Centre both sets, take the SVD of their cross-covariance H, and read off the rotation; the determinant \(d=\det(VU^T)\) stops the answer from being a reflection. No starting guess and no iterations are needed.`,
        formula: T`H=\sum_i(p_i-\bar p)(q_i-\bar q)^T=U\Sigma V^T,\qquad R=V\operatorname{diag}(1,\ldots,1,d)\,U^T,\qquad t=\bar q-R\bar p`,
        steps: [T`Subtract the centroids \(\bar p\) and \(\bar q\) from each set.`, T`Add up the outer products of matching centred points to get H.`, T`Take the SVD of H and set \(d=\det(VU^T)\).`, T`Form \(R=V\operatorname{diag}(1,\ldots,d)U^T\) and \(t=\bar q-R\bar p\).`],
        examples: [[T`square \((1,0),(0,1),(-1,0),(0,-1)\) turned by 90°`, T`\(H=\begin{bmatrix}0&2\\-2&0\end{bmatrix}\), \(R=\begin{bmatrix}0&-1\\1&0\end{bmatrix}\)`], [T`rectangle \((2,0),(0,1),(-2,0),(0,-1)\), turned by 90° and shifted by \((3,0)\)`, T`\(H=\begin{bmatrix}0&8\\-2&0\end{bmatrix}\), \(t=(3,0)\)`], [T`the rectangle mirrored, then turned`, T`\(d=-1\): the best rotation leaves an RMS residual of \(\sqrt2\approx1.414\)`]],
        pitfall: T`Kabsch needs the points matched in order; it does not find correspondences. Without the determinant check, a noisy or nearly symmetric set can come back as a reflection.`
      },
      {
        id: 'iterative-closest-point', term: 'Iterative closest point (ICP)',
        plain: T`Aligns two point sets whose matches are unknown. Alternate two steps: pair each source point with its nearest target point, then solve Kabsch on those pairs and move the source. The summed squared distance never increases, but the method only reaches the nearest local minimum, so it needs a reasonable starting alignment.`,
        steps: [T`Apply the current R and t to the source points.`, T`Pair each one with its nearest target point.`, T`Solve Kabsch on these pairs to get a new R and t.`, T`Repeat until the pairs stop changing.`],
        examples: [[T`targets 0, 4, 8, 12; copy shifted by 1, at −1, 3, 7, 11`, T`nearest targets are the true ones; one step shifts by 1`], [T`the copy shifted by 3, at −3, 1, 5, 9`, T`nearest targets 0, 0, 4, 8; mean shift 0: stuck`], [T`the cup’s edge points turned by 15° (lab)`, T`converges in about 20 iterations`], [T`the same turned by 45°`, T`locks onto a wrong alignment`]],
        pitfall: T`A small ICP residual does not prove a correct alignment: in a wrong local minimum the points still sit close to some target points. Start from a good guess, or from several, and reject pairs that are far apart.`
      },
      {
        id: 'bundle-adjustment', term: 'Bundle adjustment',
        plain: T`Refining every camera pose and 3D point of a reconstruction together, by minimising the robust reprojection error with Levenberg–Marquardt. Each residual involves one camera and one point, so the normal equations are sparse. The solution is fixed only up to a similarity of the whole scene: 7 gauge directions.`,
        formula: T`\min_{\{R_i,t_i\},\{X_j\}}\ \sum_{(i,j)}\rho\Bigl(\bigl\|x_{ij}-\pi(K,R_i,t_i,X_j)\bigr\|^2\Bigr)`,
        steps: [T`Project every point into every camera that sees it and take the pixel residuals.`, T`Linearise: each residual has 6 camera columns and 3 point columns in J.`, T`Take a Levenberg–Marquardt step, eliminating the points with the Schur complement.`, T`Update \(R_i\leftarrow R_i\exp([\delta_i]_\times)\), \(t_i\), \(X_j\), and repeat.`],
        examples: [[T`10 cameras, 10,000 points`, T`30,060 unknowns; reduced camera system 60 × 60`], [T`50 cameras, 20,000 points, 4 views each`, T`60,300 unknowns, 160,000 residuals, 300 × 300`], [T`monocular gauge freedom`, T`3 (shift) + 3 (turn) + 1 (scale) = 7 directions`]],
        pitfall: T`Fix the gauge, for example by holding the first camera and the scale, or damp the system; otherwise \(J^TJ\) is singular and the whole scene can drift without changing the cost.`
      },
      {
        id: 'schur-complement', term: 'Schur complement', symbol: T`B-EC^{-1}E^T`,
        plain: T`A way to solve a block system by eliminating one group of unknowns first. If C is easy to invert, the second block row gives those unknowns in terms of the rest; substituting them leaves a smaller system whose matrix \(B-EC^{-1}E^T\) is the Schur complement of C. Bundle adjustment eliminates all the points this way.`,
        formula: T`\begin{bmatrix}B&E\\E^T&C\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}=\begin{bmatrix}v\\w\end{bmatrix}\ \Rightarrow\ \bigl(B-EC^{-1}E^T\bigr)x=v-EC^{-1}w,\quad y=C^{-1}(w-E^Tx)`,
        steps: [T`Invert C; in bundle adjustment it is block-diagonal, one 3 × 3 block per point.`, T`Form the reduced matrix \(B-EC^{-1}E^T\) and right-hand side \(v-EC^{-1}w\).`, T`Solve the small system for x (the cameras).`, T`Back-substitute \(y=C^{-1}(w-E^Tx)\) for the eliminated unknowns.`],
        examples: [[T`\(\begin{bmatrix}4&1&2\\1&2&0\\2&0&4\end{bmatrix}\delta=(3,1,2)\)`, T`\((4-\tfrac12-1)\,\delta_c=3-\tfrac12-1\), so \(\delta_c=0.6\)`], [T`back-substitution`, T`\(\delta_1=(1-0.6)/2=0.2\), \(\delta_2=(2-1.2)/4=0.2\)`], [T`\(\begin{bmatrix}5&2&1\\2&4&0\\1&0&2\end{bmatrix}\delta=(4,2,1)\)`, T`\(\delta=(5/7,\ 1/7,\ 1/7)\)`]],
        pitfall: T`The reduced matrix is dense wherever cameras share points, so its size, not the number of points, sets the cost. The trick pays off because there are far more points than cameras.`
      }
    ]
  });

  add(64, {
    builds: [{lesson: 51, why: 'rays through pixels from K, R and t'}, {lesson: 22, why: 'integrals, densities and cumulative distributions'}, {lesson: 33, why: 'sinusoids, frequencies and aliasing'}],
    recall: ['natural-exponential', 'integral', 'cumulative-distribution-function', 'sinusoid', 'mean-squared-error'],
    symbols: [
      ['σᵢ', 'density at sample i: how strongly the scene absorbs light there', 'volume-rendering-integral'],
      ['δᵢ', 'length of the stretch of ray that sample i stands for', 'alpha-compositing'],
      ['αᵢ', 'opacity of that stretch: the chance light is absorbed there', 'alpha-compositing'],
      ['Tᵢ', 'transmittance: the share of light that gets from sample i to the camera', 'volume-rendering-integral'],
      ['γ(p)', 'Fourier features: sines and cosines of the coordinate p at doubling frequencies', 'fourier-features']
    ],
    terms: [
      {
        id: 'volume-rendering-integral', term: 'Density, transmittance and the rendering integral', symbol: T`T(s)=e^{-\int_0^s\sigma}`,
        plain: T`A scene described as a field: the density \(\sigma(x)\ge0\) says how much light is absorbed per unit length, and the colour c(x, d) what is emitted. Along a ray, the transmittance T(s), the share of light from distance s that reaches the camera, falls as the exponential of minus the integrated density. The pixel adds up \(T\sigma c\) along the ray, plus the background times the light left at the far end.`,
        formula: T`T(s)=\exp\Bigl(-\int_0^s\sigma\,du\Bigr),\qquad C=\int_{s_n}^{s_f}T(s)\,\sigma(s)\,c(s)\,ds+T(s_f)\,c_{\text{bg}}`,
        steps: [T`Integrate the density from the camera to distance s (Lesson 22).`, T`Take \(e\) to the minus that amount (Lesson 04): this is T(s).`, T`Multiply \(T\sigma c\) and integrate along the ray.`, T`Add the background colour times the transmittance left at the far end.`],
        examples: [[T`empty space, \(\sigma=0\)`, T`\(T=1\): all the light passes`], [T`a slab with \(\sigma=0.5\), thickness 2`, T`\(T=e^{-1}=0.368\): 63% absorbed`], [T`two slabs with \(\sigma\delta=0.2\), then 1.0`, T`\(T=e^{-1.2}=0.301\)`], [T`total \(\sigma\delta=\ln8\)`, T`\(T=1/8=0.125\)`]],
        plot: {fn: 'x => Math.exp(-0.5 * x)', x: [0, 6], y: [0, 1], xLabel: 'distance s into fog of density 0.5', yLabel: 'transmittance T(s)', marks: [2]},
        pitfall: T`Transmittance multiplies, it does not subtract: two layers that each pass half the light pass a quarter of it, not none.`,
        seeAlso: [68]
      },
      {
        id: 'alpha-compositing', term: 'Alpha compositing along a ray', symbol: T`w_i=T_i\alpha_i`,
        plain: T`The rendering integral with the ray cut into intervals. Interval i has opacity \(\alpha_i=1-e^{-\sigma_i\delta_i}\), it is reached by \(T_i=\prod_{j<i}(1-\alpha_j)\) of the light, and it contributes \(w_i=T_i\alpha_i\) of the pixel. The weights and the background share add up to 1, so the pixel is a weighted average of the sample colours.`,
        formula: T`\alpha_i=1-e^{-\sigma_i\delta_i},\qquad T_i=\prod_{j<i}(1-\alpha_j),\qquad \hat C=\sum_iT_i\alpha_ic_i+T_{N+1}c_{\text{bg}}`,
        steps: [T`Turn each \(\sigma_i\delta_i\) into an opacity \(\alpha_i\).`, T`Walk from the camera outwards, multiplying the pass fractions \(1-\alpha_j\) to get each \(T_i\).`, T`Multiply \(T_i\alpha_i\) to get the weights.`, T`Add up the weighted colours and the background times \(T_{N+1}\).`],
        examples: [[T`\(\sigma\delta=(0,\ \ln2,\ \ln4)\)`, T`\(\alpha=(0,0.5,0.75)\), \(w=(0,0.5,0.375)\), background 0.125`], [T`those samples red and blue, background white`, T`pixel \((0.625,\ 0.125,\ 0.5)\); depth \(2.125/0.875=2.43\)`], [T`\(\sigma\delta=(0.2,\ 1,\ 2)\)`, T`\(w=(0.181,\ 0.518,\ 0.260)\), background 0.041`]],
        pitfall: T`Composite front to back: the order matters. Swap an opaque front sample with a transparent one behind it and the pixel changes completely.`,
        seeAlso: [68]
      },
      {
        id: 'neural-radiance-field', term: 'Neural radiance field (NeRF)', symbol: T`F_\theta(\gamma(x),\gamma(d))=(\sigma,c)`,
        plain: T`A scene stored in a small neural network. Given a 3D position x and a viewing direction d, both Fourier-encoded, it returns a density σ and a colour c. A pixel is rendered by compositing the network’s outputs along its ray, and training adjusts the network so that rendered pixels match photographs with known camera poses.`,
        formula: T`\min_\theta\sum_{\text{rays }r}\bigl\|\hat C_\theta(r)-C(r)\bigr\|^2`,
        steps: [T`Pick random pixels from photos whose poses are known (Lessons 61–63).`, T`Cast each pixel’s ray, \(d=R^TK^{-1}(u,v,1)^T\), and place samples along it.`, T`Query the network at the samples and composite them into \(\hat C\).`, T`Take a gradient step on the squared error, then repeat with new pixels.`],
        examples: [[T`\(f=100\), \(c=(64,48)\), \(R=I\), pixel (114, 48)`, T`ray direction \(d=(0.5,\ 0,\ 1)\)`], [T`4096 rays with 64 samples each`, T`262,144 network evaluations per training step`], [T`encoding with L = 10 for x and L = 4 for d`, T`inputs of \(3+60=63\) and \(3+24=27\) numbers`], [T`a sample with \(w_3=0.375\)`, T`\(\partial\hat C/\partial c_3=0.375\): its colour learns at that rate`]],
        pitfall: T`A NeRF is only as good as its camera poses. Small pose errors make rays from different photos miss each other, and the reconstruction blurs.`
      },
      {
        id: 'fourier-features', term: 'Fourier features (positional encoding)', symbol: T`\gamma(p)`,
        plain: T`Replace each input coordinate p by sines and cosines of \(2^k\pi p\) for k = 0 … L − 1. A network fed raw coordinates learns smooth functions first, which is called spectral bias. With these features a smooth function of the inputs can still change sharply in p, so fine detail can be fitted; too many levels make the fit oscillate between the training samples.`,
        formula: T`\gamma(p)=\bigl(\sin2^0\pi p,\ \cos2^0\pi p,\ \ldots,\ \sin2^{L-1}\pi p,\ \cos2^{L-1}\pi p\bigr)`,
        steps: [T`Multiply p by \(\pi, 2\pi, 4\pi, \ldots, 2^{L-1}\pi\).`, T`Take the sine and the cosine of each product.`, T`Concatenate them, often together with p itself, and feed the result to the network.`],
        examples: [[T`\(p=0.25\), \(L=3\)`, T`\((0.707,\ 0.707,\ 1,\ 0,\ 0,\ -1)\)`], [T`\(p=0.75\), \(L=3\)`, T`\((0.707,\ -0.707,\ -1,\ 0,\ 0,\ -1)\)`], [T`\(p=0.1\), \(L=3\)`, T`\((0.309,\ 0.951,\ 0.588,\ 0.809,\ 0.951,\ 0.309)\)`], [T`fitting an image row (lab), held-out PSNR`, T`about 17 dB for L = 0, 24 dB for L = 4–5, 11–17 dB for L = 8`]],
        plot: {fn: 'x => Math.sin(4 * Math.PI * x)', x: [0, 1], y: [-1.1, 1.1], xLabel: 'coordinate p', yLabel: 'sin(2²πp)', marks: [.125, .25]},
        pitfall: T`The features are fixed functions of the input, not learned weights. Choose L for the sampling: frequencies above half the sampling rate alias, so the fit oscillates between samples (Lesson 33).`,
        seeAlso: [65]
      },
      {
        id: 'psnr', term: 'Peak signal-to-noise ratio (PSNR)', symbol: T`-10\log_{10}\text{MSE}`,
        plain: T`A logarithmic score, in decibels, for how close a rendered image is to the true one; higher is better. For intensities in [0, 1] it is minus ten times the base-10 logarithm of the mean squared error, so dividing the MSE by 10 adds 10 dB and halving the RMS error adds about 6 dB.`,
        formula: T`\text{PSNR}=-10\log_{10}\text{MSE}=20\log_{10}\frac{255}{\text{RMS}}\quad(\text{RMS in grey levels})`,
        steps: [T`Compute the mean squared error between the images, with intensities scaled to [0, 1].`, T`Take \(\log_{10}\) of it and multiply by −10.`, T`For 0–255 images, \(20\log_{10}(255/\text{RMS})\) gives the same number.`],
        examples: [[T`MSE 0.01`, T`20 dB`], [T`MSE 0.001`, T`30 dB`], [T`MSE 0.004`, T`23.98 dB`], [T`RMS error of 8 grey levels`, T`\(20\log_{10}(255/8)=30.07\) dB`]],
        pitfall: T`PSNR rewards average pixel accuracy, not what looks right: a slightly blurred render can score higher than a sharp one shifted by a pixel. Papers report SSIM and LPIPS alongside it.`
      },
      {
        id: 'inverse-transform-sampling', term: 'Inverse-transform (hierarchical) sampling', symbol: T`s=F^{-1}(u)`,
        plain: T`A way to draw random positions that follow a given distribution: feed uniform random numbers u between 0 and 1 through the inverse of its cumulative distribution F (Lesson 22). NeRF uses it to put extra samples along a ray where a first pass found matter, treating the normalised weights as a piecewise-constant density.`,
        formula: T`p_k=\frac{w_k}{\sum_jw_j},\qquad F_k=\sum_{j\le k}p_j,\qquad s=a_k+\frac{u-F_{k-1}}{p_k}\,(b_k-a_k)`,
        steps: [T`Normalise the weights so they sum to 1.`, T`Add them up to get the cumulative values \(F_k\).`, T`Find the interval \([a_k,b_k]\) where \(F\) first reaches u.`, T`Move into it in proportion to the part of u left over.`],
        examples: [[T`weights \((0,\ 0.5,\ 0.375)\) on [0.5, 1.5], [1.5, 2.5], [2.5, 3.5]`, T`\(p=(0,\ 0.571,\ 0.429)\), \(F=(0,\ 0.571,\ 1)\)`], [T`\(u=0.3\)`, T`\(s=1.5+0.3/0.571=2.03\)`], [T`\(u=0.8\)`, T`\(s=2.5+(0.8-0.571)/0.429=3.03\)`]],
        pitfall: T`Intervals with zero weight receive no new samples, so if the first pass misses a thin object, the second pass cannot find it. And normalise first: a ray’s weights need not sum to 1, because the background takes the rest.`
      }
    ]
  });
})();
