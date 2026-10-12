# Lesson 68 - 3D Gaussian splatting

**Module:** 17 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 51, 19 and 23; Lesson 60 for the rule \(A\Sigma A^T\) and Lesson 64 for alpha compositing along a ray. Revisit the pinhole camera, Jacobians and covariance matrices if they feel unfamiliar.

**Goal:** Represent a scene by anisotropic 3D Gaussians, project each to a 2D Gaussian with the camera Jacobian, and alpha-composite depth-sorted splats.

## A scene made of Gaussians

3D Gaussian splatting (Kerbl et al. 2023) describes a scene with hundreds of thousands to a few million 3D Gaussians. Each one has a centre μ, a 3 × 3 covariance Σ that sets its size, shape and orientation, an opacity o between 0 and 1, and a colour c, which can depend on the viewing direction. To render a view, every Gaussian is projected to the image as a 2D Gaussian, a splat, and the splats are blended from front to back. Every step is differentiable, so all the parameters are fitted to photographs by gradient descent with Adam (Lesson 30), starting from the sparse points of structure from motion (Lessons 61-63). Unlike NeRF (Lesson 64), no network is queried at points along each ray, so rendering runs in real time.

## Covariance from a rotation and a scale

A gradient step on the nine entries of Σ could easily produce a matrix that is not a covariance: one that is not symmetric, or has a negative variance in some direction. 3DGS therefore stores a scale vector and a rotation, and builds

\[
\Sigma=RSS^TR^T,\qquad S=\operatorname{diag}(s_1,s_2,s_3),\qquad v^T\Sigma v=\|S^TR^Tv\|^2\ge0\ \text{for every }v.
\]

The columns of R are the Gaussian's own axes and \(s_k^2\) are the variances along them, so they are its eigenvectors and eigenvalues (Lesson 13). The rotation comes from a unit quaternion \(q=(w,x,y,z)\), four numbers with \(w^2+x^2+y^2+z^2=1\); rotating by angle θ about a unit axis n gives \(q=(\cos\tfrac\theta2,\ \sin\tfrac\theta2\,n)\). For a rotation about the z-axis,

\[
R=\begin{bmatrix}1-2z^2&-2wz&0\\2wz&1-2z^2&0\\0&0&1\end{bmatrix}.
\]

The optimiser updates q freely and divides it by its length afterwards. Take \(S=\operatorname{diag}(0.3,0.1,0.1)\), a Gaussian three times longer along its first axis. With no rotation, \(\Sigma=\operatorname{diag}(0.09,0.01,0.01)\). A 90° turn about z, \(q=(0.7071,0,0,0.7071)\), gives \(R=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}\) and \(\Sigma=\operatorname{diag}(0.01,0.09,0.01)\): the long axis now points along y. A 45° turn, \(q=(0.9239,0,0,0.3827)\), gives \(\Sigma_{xx}=\Sigma_{yy}=0.05\) and \(\Sigma_{xy}=0.04\).

## Projecting a 3D Gaussian to a 2D splat

A camera first moves the centre into its own frame, \(t=W\mu+t_W\), with rotation W and translation \(t_W\) (Lesson 51). The pinhole then maps a camera-frame point (x, y, z) to the pixel \(u=f_xx/z+c_x\), \(v=f_yy/z+c_y\). This map is not linear, so a projected Gaussian is not exactly Gaussian. Splatting linearises the map at the Gaussian's centre (Lesson 19) with the Jacobian

\[
J=\frac{\partial(u,v)}{\partial(x,y,z)}=\begin{bmatrix}f_x/z&0&-f_xx/z^2\\0&f_y/z&-f_yy/z^2\end{bmatrix},
\]

and then applies the rule that a linear map A sends a Gaussian with covariance Σ to one with covariance \(A\Sigma A^T\) (Lesson 60). With \(A=JW\):

\[
\Sigma'=JW\Sigma W^TJ^T,\qquad \text{a }2\times2\text{ covariance in pixels}^2.
\]

This is the EWA splatting approximation of Zwicker et al. 2001. Take \(f=100\) px, W = I and \(\Sigma=\operatorname{diag}(0.01,0.01,0.04)\), a Gaussian with standard deviation 0.1 across and 0.2 in depth. At (0, 0, 2), \(J=\begin{bmatrix}50&0&0\\0&50&0\end{bmatrix}\) and \(\Sigma'=\operatorname{diag}(25,25)\): a round splat with a standard deviation of 5 px. At (0.4, 0, 2) the corner entry becomes \(-100\cdot0.4/4=-10\), so \(\Sigma'_{xx}=50^2\cdot0.01+10^2\cdot0.04=25+4=29\) and \(\Sigma'=\operatorname{diag}(29,25)\). Off the optical axis the camera sees the Gaussian's depth extent at an angle, which widens the splat sideways. At (0, 0, 4), J halves and \(\Sigma'=\operatorname{diag}(6.25,6.25)\): twice as far, half the size. 3DGS also adds 0.3 px² to the diagonal of Σ′, a small blur so that no splat is thinner than about a pixel (Lesson 33).

## Footprints, sorting and compositing

At a pixel p, splat i contributes the opacity

\[
\alpha_i(p)=o_i\exp\Bigl(-\tfrac12(p-\mu_i')^T\Sigma_i'^{-1}(p-\mu_i')\Bigr),
\]

where \(\mu_i'\) is its projected centre. With \(o=0.8\) and \(\Sigma'=\operatorname{diag}(29,25)\), a pixel 5 px to the right of the centre has \(d^2=25/29=0.862\) and \(\alpha=0.8\,e^{-0.431}=0.520\). The splats are sorted by the depth of their centres and blended from front to back exactly as the samples along a ray in Lesson 64:

\[
C(p)=\sum_ic_i\,\alpha_i(p)\prod_{j<i}\bigl(1-\alpha_j(p)\bigr).
\]

A red splat with \(\alpha=0.5\) in front of a blue one with \(\alpha=0.8\) gives \(0.5\cdot(1,0,0)+0.5\cdot0.8\cdot(0,0,1)=(0.5,0,0.4)\), with transmittance \(0.5\cdot0.2=0.1\) left for the background. Blend them in the wrong order and the pixel becomes (0.1, 0, 0.8), mostly blue, although the transmittance left is still 0.1: the product does not depend on the order, but the colour does. Real renderers split the image into 16 × 16 tiles and sort each tile's splats once per frame by their centre depth. This is an approximation, and overlapping large splats can pop when the view changes, but it is what makes the method fast.

The gradient of a rendered pixel reaches every parameter through \(\alpha_i\) and \(\Sigma_i'\): the centres, quaternions, scales, opacities and colours. During training, Gaussians with large positional gradients are cloned or split, and nearly transparent ones are pruned, so the density adapts to the scene. View-dependent colour usually comes from spherical-harmonic coefficients, 16 per colour channel at degree 3.

## Practice before opening the answers

1. With f = 200 px, W = I and \(\Sigma=\operatorname{diag}(0.04,0.01,0.09)\), compute J and Σ′ for a Gaussian centred at (0.5, −0.2, 2.5).
2. In 2D, compute \(\Sigma=R(30^\circ)\operatorname{diag}(4,1)R(30^\circ)^T\) and its determinant, and explain why it is a valid covariance for any angle.
3. A splat has opacity 0.9 and \(\Sigma'=\operatorname{diag}(16,4)\). Compute α at offsets (4, 0), (0, 4) and (4, 2) px from its centre.
4. Composite three splats front to back: green with α = 0.4, then red with α = 0.5, then blue with α = 0.9. Give the colour and the remaining transmittance, then repeat in the reverse order.

## Check your understanding

Explain why 3DGS builds Σ from a rotation and a scale, derive \(\Sigma'=JW\Sigma W^TJ^T\) from the linearised projection, compute a splat's opacity at a pixel, and show with two splats why the splats must be sorted by depth before compositing.

## Read with a purpose

Gaussian splatting is too recent for the books. Read MML 6.5.3 for linear transformations of Gaussians, MML 5.8 for linearisation by a Taylor series, CV 2.1.4 for 3D-to-2D projection, CV 3.1.3 for compositing and CV 13.4 for point-based representations; Guo Part IV, Chapter 3 covers quaternions. Then read the primary papers: Kerbl, Kopanas, Leimkühler and Drettakis 2023, "3D Gaussian Splatting for Real-Time Radiance Field Rendering", and Zwicker, Pfister, van Baar and Gross 2001, "EWA Splatting". Record one connection and one question; reading is part of your weekly study time.
