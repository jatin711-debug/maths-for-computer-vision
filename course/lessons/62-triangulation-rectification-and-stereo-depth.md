# Lesson 62 - Triangulation, rectification and stereo depth

**Module:** 16 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 61 for epipolar lines; the null vector of Lesson 14, the first-order Taylor approximation of Lesson 20, the variance rules of Lesson 23 and the sliding windows of Lesson 34 all return here.

**Goal:** Triangulate points from two calibrated views, rectify a stereo pair, compute disparity from a cost volume, and propagate disparity error to depth.

## Two rays, one point: triangulation

Once two cameras \(P_1\) and \(P_2\) (3 × 4 matrices, Lesson 51) and a match \(x_1\leftrightarrow x_2\) are known, the 3D point is where the two rays meet. Write the rows of a camera matrix as \(p_1^T, p_2^T, p_3^T\). The projection \(\lambda(x,y,1)^T=PX\) says \(x=p_1^TX/p_3^TX\) and \(y=p_2^TX/p_3^TX\); multiplying out the division gives two linear equations per view:

\[
\bigl(x\,p_3^T-p_1^T\bigr)X=0,\qquad \bigl(y\,p_3^T-p_2^T\bigr)X=0.
\]

Two views give four rows in the homogeneous unknown \(X=(X,Y,Z,W)\). Stack them into a 4 × 4 matrix A and take X as the right singular vector with the smallest singular value (Lessons 14 and 50), then divide by W. This is the DLT for triangulation.

Take \(P_1=[I\,|\,0]\) and \(P_2=[I\,|\,(-1,0,0)^T]\): camera 2 sits one unit to the right and looks the same way. The match is \(\hat x_1=(0.25,0.5)\) and \(\hat x_2=(0,0.5)\) in normalised coordinates. The rows are \((-1,0,0.25,0)\) and \((0,-1,0.5,0)\) from view 1, and \((-1,0,0,1)\) and \((0,-1,0.5,0)\) from view 2. The vector (1, 2, 4, 1) makes every row zero, so the point is X = (1, 2, 4), at depth 4. Two rows coincide, so A has rank 3 and exactly one null direction.

With noisy matches the rays miss each other and no X makes A vanish. The DLT then returns the best algebraic compromise, and the standard refinement minimises the reprojection error \(\sum_i\|x_i-\pi(P_iX)\|^2\) over the three coordinates of X with Gauss–Newton (Lesson 52). Accuracy depends on the angle between the rays: two nearly parallel rays pin down the direction of the point but hardly its distance.

## Rectification: make the epipolar lines horizontal

Lesson 61 showed that a camera stepped sideways without turning gives horizontal epipolar lines on the same row in both images. Rectification turns any calibrated pair into that form. Give both cameras the same new orientation \(R_{\text{rect}}\): its first row \(r_1\) points along the baseline \(C_2-C_1\), its second row \(r_2\) is perpendicular to \(r_1\) and to the old optical axis, and \(r_3=r_1\times r_2\). Turning a camera about its centre is a homography (Lessons 50 and 61), so each image is warped by

\[
H_i=K\,R_{\text{rect}}R_i^T\,K^{-1},
\]

with inverse mapping and bilinear sampling. If the baseline is already along x and camera 2 is only turned by 10° about its vertical axis, \(R_{\text{rect}}=I\), image 1 is unchanged, and \(H_2\) turns image 2 back by 10°, shifting its centre by \(f\tan10^\circ\approx88\) pixels when f = 500. Afterwards a match of \((x,y)\) lies on the same row y, at \(x-d\). The search for a match is one-dimensional, and the shift d is the **disparity**.

## Depth from disparity, and how its error grows

In a rectified pair with focal length f (pixels) and baseline B (metres), a point at depth Z appears at \(x_L=fX/Z+c_x\) and \(x_R=f(X-B)/Z+c_x\), so

\[
d=x_L-x_R=\frac{fB}{Z},\qquad Z=\frac{fB}{d}.
\]

In the triangulation example, f = 1 (normalised units), B = 1 and d = 0.25, so Z = 4. A real rig with f = 800 px and B = 0.1 m has fB = 80: d = 20 px gives 4.00 m, d = 19 gives 4.21 m and d = 21 gives 3.81 m. One pixel of disparity is about 0.2 m of depth at 4 m.

How large is the depth error for a matching error \(\sigma_d\)? Linearise \(Z(d)\) with the first-order Taylor approximation of Lesson 20: \(Z(d+\delta)\approx Z(d)+Z'(d)\,\delta\) with \(Z'(d)=-fB/d^2=-Z^2/(fB)\). Multiplying a random error by a constant multiplies its standard deviation by the size of that constant (Lesson 23), so

\[
\sigma_Z\approx\frac{Z^2}{fB}\,\sigma_d.
\]

With \(\sigma_d=0.5\) px the error is \(16\cdot0.5/80=0.1\) m at 4 m, but \(400\cdot0.5/80=2.5\) m at 20 m, where d = 4. Five times farther means twenty-five times the error, and the relative error \(\sigma_Z/Z=Z\sigma_d/(fB)\) grows in proportion to distance. Doubling the baseline or the focal length halves it, and so does matching to a tenth of a pixel instead of a fifth. Far away the error is also lopsided: d = 3.5 gives 22.9 m and d = 4.5 gives 17.8 m, so the first-order rule is only a guide once \(\sigma_d\) is a noticeable fraction of d.

## Matching along a row: the cost volume

To find d for every pixel, compare a small window around each left pixel with windows along the same row of the right image. The sum of absolute differences (SAD) over a window w is

\[
C(x,y,d)=\sum_{(u,v)\in w}\bigl|I_L(x+u,\,y+v)-I_R(x+u-d,\,y+v)\bigr|.
\]

Computed for every pixel and every candidate d from 0 to D, this three-dimensional array is the **cost volume**. The simplest estimate takes the winner, \(\hat d=\arg\min_dC\). Take the left row (10, 10, 50, 90, 40, 20, 20, 20) and the right row (50, 90, 40, 20, 20, 20, 20, 20), with pixels numbered from x = 0. A 3-pixel window centred at x = 3 holds (50, 90, 40) on the left. Against the right row at x − d it costs \(10+70+20=100\) for d = 0, \(40+50+20=110\) for d = 1 and 0 for d = 2, so \(\hat d=2\).

The window size is a trade-off. A small window is noisy where texture is weak, as on a white cup or a smooth saucer, because many disparities fit about equally well. A large window averages over a depth edge, so a near object appears fattened. Repeated texture gives several minima, and a brightness change between the cameras biases SAD. Zero-mean normalised cross-correlation (ZNCC) subtracts each window's mean and divides by its standard deviation, the cosine similarity of Lesson 06 applied to centred windows, so it ignores gain and offset; its cost is 1 − ZNCC.

The winner is a whole number. Fitting a parabola through the costs \(C_-, C_0, C_+\) at \(\hat d-1,\hat d,\hat d+1\) gives the sub-pixel estimate

\[
d^*=\hat d-\frac{C_+-C_-}{2\,(C_+-2C_0+C_-)}.
\]

For costs 30, 10 and 20 at d = 11, 12 and 13, \(d^*=12+10/60=12.17\): the minimum leans towards the cheaper neighbour.

Modern stereo keeps this structure. Semi-global matching adds a smoothness cost along image paths; PSMNet filters a learned cost volume with 3D convolutions; RAFT-Stereo looks up a correlation volume inside a recurrent update; and multi-view stereo (MVSNet) sweeps depth planes through many views, which is the plane sweep of CV 12.1.2. Depth sensors on cars and robots, the triangulation step of structure from motion, and the warping loss of self-supervised depth networks all use the geometry of this lesson.

## Practice before opening the answers

1. Take \(P_1=[I\,|\,0]\) and \(P_2=[I\,|\,(-0.5,0,0)^T]\) with the normalised match (0.1, −0.2) ↔ (0, −0.2). Write the four DLT rows and find the point.
2. A stereo rig has f = 700 px and B = 0.12 m. Find the depth for disparities of 42 px and 6 px, and the depth error at both for σ_d = 0.25 px.
3. The SAD costs at d = 17, 18 and 19 are 52, 20 and 28. Find the sub-pixel disparity and compare the depths it and the whole-pixel winner give with fB = 84.
4. With the two rows of the SAD example, centre the 3-pixel window at x = 4 instead and compute the costs for d = 0 to 3. What would the costs be if both rows were constant at 20, and what does that say about matching on a white cup?

## Check your understanding

Triangulate a point by stacking two rows per view, derive Z = fB/d for a rectified pair, propagate a disparity error to σ_Z ≈ Z²σ_d/(fB), and explain how the window size trades noise against blurred depth edges.

## Read with a purpose

CV 11.2.4, 12.1 (12.1.1-12.1.2), 12.3-12.4 and 12.6-12.7; Guo Part IV, Chapter 2, Section 4. Primary sources: Hartley and Sturm (1997) on triangulation; Fusiello, Trucco and Verri (2000) on rectification; Hirschmüller (2008) on semi-global matching. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
