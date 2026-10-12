/* Primers for Module 15 (Lessons 57-60). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  add(57, {
    builds: [{lesson: 18, why: 'an image gradient is the gradient of brightness'}, {lesson: 34, why: 'derivatives are computed by sliding small kernels'}, {lesson: 13, why: 'the eigenvalues of M decide flat, edge or corner'}],
    recall: ['gradient', 'cross-correlation', 'gaussian-kernel', 'eigenvalue', 'non-maximum-suppression'],
    symbols: [
      ['I_x, I_y', 'brightness change per pixel to the right and downwards', 'image-gradient'],
      ['∇I', 'the gradient (I_x, I_y): its length is edge strength, atan2 gives its angle', 'image-gradient'],
      ['G_σ', 'Gaussian blur of width σ; its derivative smooths and differentiates at once', 'derivative-of-gaussian'],
      ['M', 'structure tensor: I_x², I_xI_y and I_y² added up over a window', 'structure-tensor'],
      ['λ₁, λ₂', 'eigenvalues of M: how fast the window changes along its two main directions', 'structure-tensor'],
      ['R', 'Harris score: positive at corners, negative on edges, near 0 when flat', 'harris-corner-response'],
      ['k', 'Harris constant, usually between 0.04 and 0.06', 'harris-corner-response']
    ],
    terms: [
      {
        id: 'image-gradient', term: 'Image gradient', symbol: T`\nabla I=(I_x,I_y)`,
        plain: T`The gradient of an image at a pixel is a pair of numbers: \(I_x\), how fast brightness changes per pixel to the right, and \(I_y\), how fast it changes per pixel downwards. Its length, the gradient magnitude, measures edge strength, and it points across an edge from dark to bright. Edge detectors, corner detectors, descriptors and optical flow are all built from it.`,
        formula: T`I_x\approx\frac{I(x+1,y)-I(x-1,y)}{2},\qquad I_y\approx\frac{I(x,y+1)-I(x,y-1)}{2},\qquad |\nabla I|=\sqrt{I_x^2+I_y^2}`,
        steps: [T`Subtract the left neighbour from the right neighbour and halve the result: that is \(I_x\).`, T`Subtract the pixel above from the pixel below and halve it: that is \(I_y\), because image rows count downwards.`, T`The magnitude is \(\sqrt{I_x^2+I_y^2}\); the direction is \(\operatorname{atan2}(I_y,I_x)\).`],
        examples: [[T`rows (33, 45, 57), (38, 50, 62), (43, 55, 67), centre 50`, T`\(I_x=(62-38)/2=12\), \(I_y=(55-45)/2=5\)`], [T`\(\nabla I=(12,5)\)`, T`\(|\nabla I|=\sqrt{144+25}=13\) grey levels per pixel`], [T`a flat patch, every pixel 80`, T`\(\nabla I=(0,0)\): no edge`], [T`right-hand pixel 62 raised to 72 by noise`, T`\(I_x=(72-38)/2=17\): one noisy pixel moves it by 5`]],
        pitfall: T`Image y points down, so a positive \(I_y\) means brighter below, not above. A difference of two pixels is very sensitive to noise, which is why detectors smooth before differentiating.`,
        seeAlso: [58, 59]
      },
      {
        id: 'atan2', term: 'Angle of a vector: atan2', symbol: T`\operatorname{atan2}(y,x)`,
        plain: T`atan2 gives the direction of the vector \((x,y)\) as an angle measured from the positive x axis, between −180° and 180°. Unlike \(\arctan(y/x)\) it looks at the signs of both entries, so it can tell \((12,5)\) from \((-12,-5)\), which point in opposite directions, and it still works when \(x=0\). It turns a gradient into an edge orientation.`,
        formula: T`\theta=\operatorname{atan2}(y,x),\qquad \cos\theta=\frac{x}{\sqrt{x^2+y^2}},\qquad \sin\theta=\frac{y}{\sqrt{x^2+y^2}}`,
        steps: [T`Find the first-quadrant angle \(\arctan(|y|/|x|)\), or 90° if \(x=0\).`, T`If \(x<0\), replace it by 180° minus that angle.`, T`If \(y<0\), make the angle negative.`, T`In Python, \(\texttt{math.degrees(math.atan2(y, x))}\): note that y comes first.`],
        examples: [[T`\((12,5)\)`, T`\(\arctan(5/12)\approx22.6^\circ\)`], [T`\((-12,5)\)`, T`\(180^\circ-22.6^\circ=157.4^\circ\)`], [T`\((-12,-5)\)`, T`\(-157.4^\circ\)`], [T`\((3,-4)\)`, T`\(-53.1^\circ\)`], [T`\((0,7)\)`, T`\(90^\circ\): straight down the image`]],
        pitfall: T`\(\arctan(5/12)\) and \(\arctan\big((-5)/(-12)\big)\) are the same number, 22.6°, although the two vectors point in opposite directions: that lost information is exactly what atan2 keeps. Also check the argument order, y before x.`,
        seeAlso: [58]
      },
      {
        id: 'sobel-operator', term: 'Sobel operator', symbol: T`S_x`,
        plain: T`A 3×3 derivative kernel. It takes the right-minus-left difference in three neighbouring rows and averages them with weights 1, 2, 1, which makes it less sensitive to noise than a plain difference. Dividing its response by 8 gives the brightness change per pixel. Its transpose \(S_y\) measures the vertical change in the same way.`,
        formula: T`S_x=\begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix}=\begin{bmatrix}1\\2\\1\end{bmatrix}\begin{bmatrix}-1&0&1\end{bmatrix},\qquad I_x\approx\frac{S_x\star I}{8},\qquad S_y=S_x^T`,
        steps: [T`In each row of the 3×3 patch, subtract the left pixel from the right pixel.`, T`Weight the three differences by 1, 2 and 1 (top, middle, bottom) and add them.`, T`Divide by 8 to get \(I_x\). For \(I_y\), use bottom row minus top row in each column, weighted 1, 2, 1 from left to right.`],
        examples: [[T`ramp rows (33, 45, 57), (38, 50, 62), (43, 55, 67)`, T`\((24+2\cdot24+24)/8=96/8=12\): the ramp’s slope`], [T`same ramp, \(I_y\)`, T`\((10+2\cdot10+10)/8=5\)`], [T`right-hand pixel 62 → 72`, T`\((96+20)/8=14.5\), against 17 for the central difference`], [T`rows (20, 30, 50), (20, 40, 60), (30, 50, 70)`, T`\(I_x=150/8=18.75\), \(I_y=70/8=8.75\)`]],
        pitfall: T`Libraries usually skip the division by 8, so their Sobel values are 8 times the slope. Some also use the opposite sign; check on a ramp that brightens to the right.`,
        seeAlso: [58]
      },
      {
        id: 'derivative-of-gaussian', term: 'Derivative-of-Gaussian filter', symbol: T`\frac{\partial G_\sigma}{\partial x}`,
        plain: T`Blurring with a Gaussian and then differentiating can be done in one step, by filtering with the derivative of the Gaussian. The blur suppresses noise, and σ chooses the scale of the edges being measured. The 2D kernel separates into a 1D derivative along x times a 1D blur along y, so it costs two short passes instead of one big square kernel.`,
        formula: T`\frac{\partial G_\sigma}{\partial x}(x,y)=g_\sigma'(x)\,g_\sigma(y),\qquad g_\sigma'(x)=-\frac{x}{\sigma^2}\,g_\sigma(x),\qquad d_i=\frac{i\,g_\sigma(i)}{\sum_j j^2g_\sigma(j)}`,
        steps: [T`Build the 1D Gaussian weights \(g(i)\) for \(i=-r,\dots,r\) with \(r\approx3\sigma\), normalised to sum 1.`, T`Multiply each weight by its offset \(i\) and divide by \(\sum_j j^2g(j)\), so a ramp of slope 1 gives exactly 1. These are the cross-correlation taps \(d_i\).`, T`Filter every row with \(d\), then every column with \(g\): that is \(I_x\). Swap the two kernels for \(I_y\).`],
        examples: [[T`\(\sigma=1\), \(r=3\): Gaussian weights`, T`\(\approx(0.004,\ 0.054,\ 0.242,\ 0.399,\ 0.242,\ 0.054,\ 0.004)\)`], [T`\(\sigma=1\): derivative taps \(d_i\)`, T`\(\approx(-0.013,\ -0.108,\ -0.243,\ 0,\ 0.243,\ 0.108,\ 0.013)\)`], [T`\(\sigma=2\): \(r=6\), 13 taps`, T`separable: \(13+13=26\) multiplications per pixel; full 2D kernel: \(13^2=169\)`]],
        pitfall: T`The derivative taps add up to 0, not 1, so a flat region gives 0. Scale them with the ramp test \(\sum_i i\,d_i=1\), not by dividing by their sum.`,
        seeAlso: [58, 59]
      },
      {
        id: 'structure-tensor', term: 'Structure tensor (second-moment matrix)', symbol: T`M`,
        plain: T`A 2×2 matrix that summarises the gradients in a window by adding up \(I_x^2\), \(I_xI_y\) and \(I_y^2\). It predicts how much the window changes when shifted by \(\Delta u\): \(E\approx\Delta u^TM\Delta u\). Its eigenvalues say whether the window is flat (both small), an edge (one large, one near 0) or a corner (both large).`,
        formula: T`M=\sum_x w(x)\begin{bmatrix}I_x^2&I_xI_y\\I_xI_y&I_y^2\end{bmatrix}=\begin{bmatrix}a&b\\b&c\end{bmatrix},\qquad \lambda_{1,2}=\frac{a+c}{2}\pm\sqrt{\Big(\frac{a-c}{2}\Big)^2+b^2}`,
        steps: [T`For each pixel of the window, compute \(I_x^2\), \(I_xI_y\) and \(I_y^2\).`, T`Add them up, with Gaussian weights \(w\) if the window has them, to get \(a\), \(b\) and \(c\).`, T`Find the two eigenvalues with the formula and compare them.`],
        examples: [[T`gradients (1, 0), (1, 0), (0, 1), (0, 1)`, T`\(M=\operatorname{diag}(2,2)\), \(\lambda=2,2\): corner`], [T`four gradients (1, 0)`, T`\(M=\operatorname{diag}(4,0)\), \(\lambda=4,0\): edge`], [T`two gradients (1, 1)`, T`\(M=\begin{bmatrix}2&2\\2&2\end{bmatrix}\), \(\lambda=4,0\): the same edge at 45°`], [T`(2, 1), (2, 1), (−1, 2), (0, 0)`, T`\(M=\begin{bmatrix}9&2\\2&6\end{bmatrix}\), \(\lambda=7.5\pm2.5=10,\ 5\): corner`]],
        pitfall: T`Large entries do not make a corner: \(\begin{bmatrix}2&2\\2&2\end{bmatrix}\) is an edge. Only the eigenvalues, or the determinant and trace together, decide. Rotating the image does not change them.`,
        seeAlso: [59]
      },
      {
        id: 'harris-corner-response', term: 'Harris and Shi–Tomasi corner scores', symbol: T`R=\det M-k(\operatorname{tr}M)^2`,
        plain: T`One number per pixel that is large and positive at corners, negative along edges and near zero in flat regions. Harris builds it from the determinant and trace of M, so no square roots are needed; Shi and Tomasi use the smaller eigenvalue instead. A detector keeps the pixels whose score beats all their neighbours and returns the strongest of them.`,
        formula: T`R=\det M-k\,(\operatorname{tr}M)^2=\lambda_1\lambda_2-k(\lambda_1+\lambda_2)^2,\qquad k\approx0.04\text{ to }0.06,\qquad R_{\rm ST}=\min(\lambda_1,\lambda_2)`,
        steps: [T`Compute \(\det M=ac-b^2\) and \(\operatorname{tr}M=a+c\).`, T`Subtract \(k\) times the trace squared.`, T`Large and positive: corner; negative: edge; near 0: flat. Then keep only local maxima (non-maximum suppression).`],
        examples: [[T`\(\operatorname{diag}(2,2)\), \(k=0.04\)`, T`\(4-0.04\cdot16=3.36\): corner`], [T`\(\operatorname{diag}(4,0)\), \(k=0.04\)`, T`\(0-0.64=-0.64\): edge`], [T`\(\begin{bmatrix}9&2\\2&6\end{bmatrix}\), \(k=0.05\)`, T`\(50-0.05\cdot225=38.75\)`], [T`when is \(R>0\) for \(k=0.04\)?`, T`only when \(\lambda_2/\lambda_1>0.044\)`]],
        pitfall: T`R grows like the fourth power of contrast, so a fixed threshold that suits one photo fails on a darker one. Keeping the strongest N local maxima avoids that.`,
        seeAlso: [58, 59]
      }
    ]
  });

  add(58, {
    builds: [{lesson: 57, why: 'descriptors are histograms of image gradients'}, {lesson: 56, why: 'each octave is a level of a Gaussian pyramid'}, {lesson: 44, why: 'matchers are scored with precision and recall'}],
    recall: ['image-gradient', 'atan2', 'gaussian-pyramid', 'vector-norm', 'precision-recall-curve'],
    symbols: [
      ['L(x, σ)', 'the image blurred by σ, for every σ: the scale space', 'gaussian-scale-space'],
      ['σ²∇²L', 'Laplacian times σ²: largest when σ matches the width of a blob', 'scale-normalised-laplacian'],
      ['D', 'difference of two neighbouring blurs, close to (k − 1)σ²∇²L', 'difference-of-gaussians'],
      ['k', 'ratio between neighbouring blur levels, k = 2^(1/S)', 'difference-of-gaussians'],
      ['d₁, d₂', 'distances to the nearest and the second-nearest descriptor', 'ratio-test']
    ],
    terms: [
      {
        id: 'gaussian-scale-space', term: 'Gaussian scale space', symbol: T`L(x,\sigma)=G_\sigma*I`,
        plain: T`A stack of copies of one image blurred by every amount σ, from sharp to very smooth. Fine detail disappears as σ grows, so each structure can be examined at the blur that suits its size. Blurs combine by adding variances, so the stack is built one small extra blur at a time, and the image is halved whenever σ doubles.`,
        formula: T`L(x,\sigma)=G_\sigma*I,\qquad G_{\sigma_1}*G_{\sigma_2}=G_{\sqrt{\sigma_1^2+\sigma_2^2}}`,
        steps: [T`Choose the levels, for example \(\sigma_i=\sigma_0k^i\) with \(\sigma_0=1.6\) and \(k=2^{1/3}\).`, T`Blur each level from the one before with the extra blur \(\sqrt{\sigma_i^2-\sigma_{i-1}^2}\).`, T`When σ has doubled, keep every second pixel and carry on at half size: that starts the next octave.`],
        examples: [[T`blur σ = 3, then σ = 4`, T`one blur with \(\sqrt{9+16}=5\)`], [T`from σ = 1.6 to σ = 3.2`, T`extra blur \(\sqrt{10.24-2.56}\approx2.77\)`], [T`\(\sigma_0=1.6\), \(k=2^{1/3}\approx1.26\)`, T`levels 1.6, 2.02, 2.54, 3.2, …`]],
        pitfall: T`Blurs do not add like lengths: σ = 3 followed by σ = 4 is σ = 5, not 7. Add the squares, then take the root.`
      },
      {
        id: 'scale-normalised-laplacian', term: 'Scale-normalised Laplacian of Gaussian (LoG)', symbol: T`\sigma^2\nabla^2L`,
        plain: T`The Laplacian \(\nabla^2L=L_{xx}+L_{yy}\) adds the second derivatives in x and y; it is strongly negative at the centre of a bright blob. Multiplying it by σ² makes responses at different blur levels comparable, and then a blob responds most at the σ equal to its own width, its characteristic scale. A detector draws a circle of radius about \(\sqrt2\,\sigma\) there.`,
        formula: T`\big|\sigma^2\nabla^2L\big|_{\text{centre}}=\frac{2\sigma^2s^2}{(s^2+\sigma^2)^2}\quad\text{for the blob }e^{-r^2/(2s^2)},\qquad\text{largest at }\sigma=s,\ \text{value }\tfrac12`,
        steps: [T`Blur the image with \(G_\sigma\) and add its second derivatives \(L_{xx}+L_{yy}\).`, T`Multiply by \(\sigma^2\).`, T`Repeat for every σ and keep the σ where the size of the response is largest.`],
        examples: [[T`blob width \(s=3\), \(\sigma=1.5\)`, T`\(2\cdot2.25\cdot9/11.25^2=0.32\)`], [T`\(s=3\), \(\sigma=3\)`, T`\(0.5\): the peak`], [T`\(s=3\), \(\sigma=6\)`, T`\(0.32\) again: symmetric in \(\log\sigma\)`], [T`image enlarged 2×, so \(s=6\)`, T`peak moves to \(\sigma=6\)`]],
        pitfall: T`Without the factor σ², every blob would be found at the smallest σ, because blurring weakens all responses. The sign tells bright blobs (negative) from dark ones (positive).`
      },
      {
        id: 'difference-of-gaussians', term: 'Difference of Gaussians (DoG)', symbol: T`D=L(k\sigma)-L(\sigma)`,
        plain: T`Subtract two neighbouring levels of the scale space. The result approximates (k − 1) times the scale-normalised Laplacian using only blurs and one subtraction, which is why SIFT uses it. Keypoints are the points whose D is larger, or smaller, than all 26 neighbours in position and scale, with |D| above a contrast threshold.`,
        formula: T`D=L(k\sigma)-L(\sigma)\approx(k-1)\,\sigma^2\nabla^2L,\qquad k=2^{1/S}\ \text{ for }S\text{ intervals per octave}`,
        steps: [T`Blur the image at σ and at kσ.`, T`Subtract the first from the second.`, T`Compare each value with its 8 neighbours at the same scale and the 9 at each neighbouring scale, and keep the extrema.`],
        examples: [[T`\(S=3\)`, T`\(k=2^{1/3}\approx1.26\); 6 blurred images and 5 DoG images per octave`], [T`blob \(s=3\), \(\sigma=1.5\), \(k=1.26\)`, T`\(D\approx-0.084\), and \((k-1)(-0.32)\approx-0.083\)`], [T`same blob, \(\sigma=3\)`, T`\(D\approx-0.114\) against \(-0.13\)`]],
        pitfall: T`The approximation needs k close to 1. With one interval per octave, k = 2, it can be 40% off, although the position of the peak over σ is still about right.`
      },
      {
        id: 'sift-descriptor', term: 'SIFT descriptor (gradient-orientation histograms)', symbol: T`d\in\mathbb R^{128}`,
        plain: T`A list of 128 numbers describing the patch around a keypoint. The patch is turned to the keypoint’s dominant gradient orientation and split into 4×4 cells, and each cell records an 8-bin histogram of gradient directions weighted by gradient strength. Measuring angles from the dominant orientation cancels rotation, and normalising the list to unit length cancels a change of contrast.`,
        formula: T`4\times4\text{ cells}\times8\text{ bins}=128,\qquad d\leftarrow\frac{d}{\|d\|},\ \ d_i\leftarrow\min(d_i,0.2),\ \ d\leftarrow\frac{d}{\|d\|}`,
        steps: [T`Find the dominant orientation θ₀: the peak of a magnitude-weighted histogram of gradient angles around the keypoint.`, T`In a square aligned with θ₀ and about 12σ wide, add each gradient’s magnitude to its cell’s histogram, in the bin of its angle minus θ₀.`, T`Stack the 16 histograms, divide by the length, clip entries at 0.2 and divide by the length again.`],
        examples: [[T`one cell with gradients (3, 0), (0, 2), (−1, 1), (2, 2); 45° bins`, T`votes \((3,\ 2.83,\ 2,\ 1.41,\ 0,\ 0,\ 0,\ 0)\)`], [T`its unit vector (length \(\sqrt{23}\approx4.80\))`, T`\((0.626,\ 0.590,\ 0.417,\ 0.295,\ 0,\dots)\)`], [T`contrast doubled`, T`every vote doubles; the unit vector is unchanged`], [T`patch rotated by 90°`, T`votes shift by 2 bins and so does θ₀; the descriptor is unchanged`]],
        pitfall: T`Rotation invariance depends entirely on θ₀: if the orientation is estimated wrongly, the whole descriptor is compared in the wrong frame. Brightness offsets cancel already in the gradients.`
      },
      {
        id: 'ratio-test', term: 'Nearest-neighbour matching: ratio and mutual tests', symbol: T`\frac{d_1}{d_2}<\tau`,
        plain: T`To match descriptors, find for each one its nearest neighbour in the other image. Lowe’s ratio test keeps the match only if the nearest distance \(d_1\) is clearly smaller than the second-nearest \(d_2\), which removes ambiguous matches on repeated texture and points with no true partner. The mutual test also requires the partner to choose it back.`,
        steps: [T`For a descriptor in A, compute its distances to every descriptor in B and find the two smallest, \(d_1\) and \(d_2\).`, T`Accept the nearest only if \(d_1/d_2<\tau\), usually \(\tau=0.8\).`, T`Mutual test: the accepted descriptor in B must have this one as its own nearest neighbour in A.`],
        examples: [[T`\(d_1=0.20,\ d_2=0.50\)`, T`ratio 0.40: accept`], [T`\(d_1=0.30,\ d_2=0.35\)`, T`ratio 0.86: reject (two near-equal candidates)`], [T`rows (0.20, 0.50, 0.70), (0.30, 0.35, 0.90), (0.60, 0.80, 0.25)`, T`A1–B1 and A3–B3 pass both tests; A2 fails`]],
        pitfall: T`Lowering τ gives fewer but more reliable matches: precision rises and recall falls. On strongly repeated patterns even correct matches fail the test, so few survive.`
      },
      {
        id: 'hamming-distance', term: 'Hamming distance (binary descriptors)', symbol: T`d_H(a,b)`,
        plain: T`The number of positions at which two equal-length strings of bits differ. Binary descriptors such as BRIEF and ORB store one bit per comparison of two pixel intensities and are compared with Hamming distance, which a computer finds with one XOR and a count of the ones: much faster than a Euclidean distance between 128 real numbers.`,
        formula: T`d_H(a,b)=\sum_i[a_i\ne b_i]=\operatorname{popcount}(a\oplus b)`,
        steps: [T`Write the two bit strings one above the other.`, T`Mark every position where they differ (XOR, \(\oplus\), gives 1 there).`, T`Count the marks.`],
        examples: [[T`10110010 and 10011011`, T`XOR 00101001: distance 3`], [T`11110000 and 00001111`, T`distance 8, every bit differs`], [T`a string and itself`, T`distance 0`]],
        pitfall: T`Use Hamming distance only for bit strings of the same length; real-valued descriptors such as SIFT are compared with Euclidean distance. The ratio test works the same way with either.`
      }
    ]
  });

  add(59, {
    builds: [{lesson: 57, why: 'Lucas–Kanade inverts the structure tensor'}, {lesson: 52, why: 'iterative alignment is Gauss–Newton'}, {lesson: 56, why: 'pyramids make large motions small'}],
    recall: ['image-gradient', 'structure-tensor', 'normal-equations', 'gauss-newton', 'gaussian-pyramid'],
    symbols: [
      ['(u, v)', 'the flow at a pixel: how far its content moved right and down', 'optical-flow'],
      ['I_t', 'frame 2 minus frame 1 at the same pixel', 'brightness-constancy'],
      ['M', 'structure tensor; Lucas–Kanade solves M d = −ΣI_t∇I', 'lucas-kanade'],
      ['d_ℓ', 'the displacement at pyramid level ℓ, which is d/2^ℓ', 'coarse-to-fine-estimation'],
      ['α', 'Horn–Schunck weight trading data fit against smooth flow', 'horn-schunck']
    ],
    terms: [
      {
        id: 'optical-flow', term: 'Optical flow', symbol: T`(u,v)`,
        plain: T`The apparent motion of image content between two frames: at every pixel, a vector \((u,v)\) giving how many pixels the content moved to the right and down. It is measured from brightness alone, so it is the motion that can be seen, which need not equal the true 3D motion: a plain rotating ball shows none.`,
        formula: T`x_{t+1}=x_t+(u,v),\qquad \text{endpoint error}=\big\|(u,v)-(u^*,v^*)\big\|`,
        steps: [T`Pick a pixel of frame 1 and find where its content is in frame 2.`, T`The displacement, right and down in pixels, is its flow \((u,v)\).`, T`To score an estimate, take the length of estimate minus truth: the endpoint error.`],
        examples: [[T`content moved 2 right and 1 down`, T`\((u,v)=(2,1)\)`], [T`the camera pans right by 5 pixels`, T`the background flows \((-5,0)\) everywhere`], [T`estimate (2.3, 0.6), truth (2, 1)`, T`endpoint error \(\sqrt{0.09+0.16}=0.5\) px`]],
        pitfall: T`Flow is in pixels per frame and v points down the image. Flow of the camera and flow of the objects add up, so a static scene still has flow when the camera moves.`
      },
      {
        id: 'brightness-constancy', term: 'Brightness constancy and its linear form', symbol: T`I_xu+I_yv+I_t\approx0`,
        plain: T`The assumption that a point keeps its brightness as it moves between frames. Expanding the moved image to first order turns it into one linear equation per pixel, linking the spatial gradient, the flow and the temporal difference \(I_t\): frame 2 minus frame 1 at the same pixel.`,
        formula: T`I(x+u,\,y+v,\,t+1)=I(x,y,t)\ \Rightarrow\ I_xu+I_yv+I_t\approx0,\qquad I_t=I(x,y,t+1)-I(x,y,t)`,
        steps: [T`Measure \(I_x\) and \(I_y\) in frame 1, and \(I_t\) as frame 2 minus frame 1 at the same pixel.`, T`Write \(I_xu+I_yv+I_t=0\).`, T`Remember that it is one equation for two unknowns.`],
        examples: [[T`\(I_x=1,\ I_y=0\), content moves 2 right`, T`\(I_t=-2\): the pixel now shows darker content from its left`], [T`\(I_x=3,\ I_y=4\), flow (2, 1)`, T`\(I_t=-(6+4)=-10\)`], [T`\(I_x=2,\ I_y=0,\ I_t=-2\)`, T`\(u=1\); v can be anything`]],
        pitfall: T`It fails where lighting changes, on specular highlights and at occlusions, and the linear form holds only for motions of about a pixel.`
      },
      {
        id: 'aperture-problem', term: 'Aperture problem', symbol: T`-\frac{I_t}{|\nabla I|}`,
        plain: T`Through a small window, motion along an edge is invisible: sliding a straight edge along itself changes no pixel. One brightness-constancy equation fixes only the normal flow, the component of the motion across the edge, and a window whose gradients all point the same way has a singular structure tensor.`,
        formula: T`(u,v)=-\frac{I_t}{|\nabla I|}\,\frac{\nabla I}{|\nabla I|}+s\,t_{\text{edge}}\quad\text{for any }s`,
        steps: [T`Compute the gradient length \(|\nabla I|\).`, T`The normal flow has signed length \(-I_t/|\nabla I|\) along the unit gradient \(\nabla I/|\nabla I|\).`, T`Any amount of motion along the edge direction can be added without changing the equation.`],
        examples: [[T`gradient (3, 4), \(I_t=-10\)`, T`length 10/5 = 2 along (0.6, 0.8): normal flow (1.2, 1.6)`], [T`the same edge`, T`(2, 1) and (−2, 4) both satisfy \(3u+4v=10\)`], [T`four gradients (1, 0)`, T`\(M=\operatorname{diag}(4,0)\): v undetermined`]],
        pitfall: T`A larger window does not cure it if the window still holds only one straight edge. It needs a second gradient direction, as at a corner.`
      },
      {
        id: 'lucas-kanade', term: 'Lucas–Kanade flow', symbol: T`Md=-\sum I_t\nabla I`,
        plain: T`Assume the flow is the same for every pixel in a small window, stack their brightness-constancy equations and solve them by least squares. The matrix of the 2×2 system is the structure tensor, so the flow is well determined only where the window has gradients in two directions. Warping and repeating the solve makes it Gauss–Newton.`,
        formula: T`\begin{bmatrix}\sum I_x^2&\sum I_xI_y\\\sum I_xI_y&\sum I_y^2\end{bmatrix}\begin{bmatrix}u\\v\end{bmatrix}=-\begin{bmatrix}\sum I_xI_t\\\sum I_yI_t\end{bmatrix}`,
        steps: [T`For each pixel of the window, collect \(I_x\), \(I_y\) and \(I_t\).`, T`Add \(I_x^2\), \(I_xI_y\), \(I_y^2\) into M, and \(-I_xI_t\), \(-I_yI_t\) into the right-hand side.`, T`Solve the 2×2 system with \(M^{-1}=\frac{1}{\det M}\begin{bmatrix}M_{22}&-M_{12}\\-M_{12}&M_{11}\end{bmatrix}\).`, T`Warp frame 2 by the result and repeat to refine it.`],
        examples: [[T`(1, 0, −2) twice and (0, 1, −1) twice`, T`\(M=\operatorname{diag}(2,2)\), right-hand side (4, 2): flow (2, 1)`], [T`(2, 0, −2), (0, 1, 1), (1, 1, 0)`, T`\(M=\begin{bmatrix}5&1\\1&2\end{bmatrix}\), right-hand side (4, −1): flow (1, −1)`], [T`(1, 0, −2) four times`, T`\(M=\operatorname{diag}(4,0)\): u = 2, v unknown`]],
        pitfall: T`Check \(\lambda_{\min}(M)\) first. With nearly parallel gradients the solve divides by a tiny eigenvalue, and half a grey level of noise can move the answer by a pixel.`
      },
      {
        id: 'coarse-to-fine-estimation', term: 'Coarse-to-fine (pyramidal) estimation', symbol: T`d_\ell=\frac{d}{2^\ell}`,
        plain: T`Large motions break the one-pixel linearisation. Halving an image halves every displacement, so estimate the flow first on the smallest pyramid level, where the motion is small. Then double it, warp the next finer level by it, estimate only the remaining correction, and repeat down to full resolution.`,
        formula: T`d_\ell=\frac{d}{2^\ell},\qquad d_{\ell-1}=2\,d_\ell+\delta_{\ell-1}`,
        steps: [T`Build Gaussian pyramids of both frames.`, T`Solve for the flow at the coarsest level.`, T`Double it, warp the next level of frame 2 by it, solve for the correction δ and add it.`, T`Repeat until level 0, the full image.`],
        examples: [[T`8-pixel motion`, T`4, 2 and 1 pixel at levels 1, 2 and 3`], [T`13-pixel motion`, T`four halvings: \(13/16\approx0.81\) px`], [T`estimate 1.1 px at level 3`, T`level 2 starts from 2.2 px`]],
        pitfall: T`Small, fast objects vanish at the coarse levels, so their motion is lost. This is one reason RAFT compares features over all displacements in a correlation volume instead.`
      },
      {
        id: 'horn-schunck', term: 'Horn–Schunck flow (smoothness prior)', symbol: T`\alpha`,
        plain: T`A global alternative to windows: choose the whole flow field so that it satisfies brightness constancy and changes smoothly from pixel to pixel, with α² weighting the smoothness. The update pulls each pixel’s flow towards the average of its neighbours, corrected along the gradient, so flow spreads into regions without texture.`,
        formula: T`E=\sum\big(I_xu+I_yv+I_t\big)^2+\alpha^2\big(\|\nabla u\|^2+\|\nabla v\|^2\big),\qquad u\leftarrow\bar u-\frac{I_x\rho}{\alpha^2+I_x^2+I_y^2},\ \ \rho=I_x\bar u+I_y\bar v+I_t`,
        steps: [T`Average the current flow of the four neighbours: \(\bar u,\bar v\).`, T`Compute the residual \(\rho=I_x\bar u+I_y\bar v+I_t\).`, T`Subtract \(I_x\rho/(\alpha^2+I_x^2+I_y^2)\) from \(\bar u\) and \(I_y\rho/(\alpha^2+I_x^2+I_y^2)\) from \(\bar v\); sweep the image many times.`],
        examples: [[T`\(\bar u=\bar v=0\), (1, 0, −2), α = 1`, T`\(u=0+2/2=1\)`], [T`the same with α = 3`, T`\(u=2/10=0.2\): smoothness wins`], [T`\(\bar u=1.5\), α = 1`, T`\(\rho=-0.5\), \(u=1.5+0.25=1.75\)`], [T`α close to 0`, T`\(u\to2\), the pixel’s own answer`]],
        pitfall: T`Smoothness also blurs the flow across motion boundaries, where neighbouring pixels really do move differently. Robust penalties such as the Charbonnier reduce this.`
      }
    ]
  });

  add(60, {
    builds: [{lesson: 23, why: 'the multivariate Gaussian and Mahalanobis distance'}, {lesson: 21, why: 'conditioning is Bayes’ theorem for Gaussians'}, {lesson: 42, why: 'trackers compare boxes by IoU'}],
    recall: ['multivariate-gaussian', 'covariance-matrix', 'jacobian', 'intersection-over-union', 'bayes-theorem'],
    symbols: [
      ['μ, Σ', 'mean vector and covariance matrix of a Gaussian (Lesson 23)'],
      ['F, Q', 'motion model, and the covariance of the random motion added each step', 'kalman-filter'],
      ['H, R', 'what the sensor measures, and the covariance of its noise', 'kalman-filter'],
      ['P⁻, P', 'state covariance before and after the measurement update', 'kalman-filter'],
      ['S', 'the covariance the innovation should have; it sets the gate', 'innovation-gating'],
      ['K', 'Kalman gain: how much of the surprise in a measurement to believe', 'kalman-filter'],
      ['d²', 'squared Mahalanobis distance of the innovation', 'innovation-gating']
    ],
    terms: [
      {
        id: 'gaussian-linear-transform', term: 'Linear transform of a Gaussian', symbol: T`Ax+b\sim\mathcal N(A\mu+b,\ A\Sigma A^T)`,
        plain: T`Multiply a Gaussian vector by a matrix A and add a constant b, and the result is again Gaussian. Its mean follows the same map, and its covariance is sandwiched between A and \(A^T\). The Kalman prediction, the propagation of measurement errors through a camera model and the image footprint of a 3D Gaussian splat all use this rule.`,
        formula: T`\mathbb E[Ax+b]=A\mu+b,\qquad \operatorname{Cov}(Ax+b)=A\Sigma A^T,\qquad \operatorname{Cov}(x+w)=\Sigma+Q\ \text{ for independent }w`,
        steps: [T`Map the mean: \(A\mu+b\).`, T`Multiply \(A\Sigma\), then multiply the result on the right by \(A^T\).`, T`If independent noise is added, add its covariance.`],
        examples: [[T`\(\Sigma=I\), \(A=\begin{bmatrix}1&1\\0&1\end{bmatrix}\)`, T`\(A\Sigma A^T=\begin{bmatrix}2&1\\1&1\end{bmatrix}\)`], [T`\(\mu=(2,1)\), \(\Sigma=\operatorname{diag}(1,4)\), the same A`, T`mean (3, 1), covariance \(\begin{bmatrix}5&4\\4&4\end{bmatrix}\)`], [T`one dimension, \(y=3x+2\)`, T`\(\operatorname{Var}(y)=9\operatorname{Var}(x)\)`]],
        pitfall: T`The shift b moves the mean but never the covariance, and the covariance is \(A\Sigma A^T\), not \(A\Sigma\): scaling by 3 multiplies a variance by 9.`,
        seeAlso: [68]
      },
      {
        id: 'gaussian-conditioning', term: 'Conditioning a Gaussian', symbol: T`\mu_{a|b},\ \Sigma_{a|b}`,
        plain: T`If two groups of numbers are jointly Gaussian and you observe one group, the other is still Gaussian. Its mean shifts by a regression on the surprise in the observed group, and its covariance shrinks by an amount that depends only on how strongly the groups covary. The Kalman update is this rule applied to the state and the measurement.`,
        formula: T`\mu_{a|b}=\mu_a+\Sigma_{ab}\Sigma_{bb}^{-1}(x_b-\mu_b),\qquad \Sigma_{a|b}=\Sigma_{aa}-\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}`,
        steps: [T`Split the mean and the covariance into the unobserved part a and the observed part b.`, T`Compute the regression matrix \(\Sigma_{ab}\Sigma_{bb}^{-1}\).`, T`New mean: add it times \(x_b-\mu_b\). New covariance: subtract it times \(\Sigma_{ba}\).`],
        examples: [[T`\(\Sigma_{aa}=4,\ \Sigma_{ab}=2,\ \Sigma_{bb}=2\), zero means, \(x_b=1\)`, T`mean \(2/2\cdot1=1\), variance \(4-2\cdot2/2=2\)`], [T`\(\Sigma_{ab}=0\)`, T`nothing changes: b carries no information about a`], [T`two estimates of one value, variances 2 and 1`, T`precisions add, \(1/2+1=3/2\): variance 2/3`]],
        pitfall: T`The conditional variance does not depend on the value observed, only on the covariances. A surprising observation moves the mean but does not make you more or less certain.`,
        seeAlso: [63, 67]
      },
      {
        id: 'kalman-filter', term: 'Kalman filter', symbol: T`K=P^-H^TS^{-1}`,
        plain: T`A recursive estimator for a state that moves by a linear model and is seen through noisy linear measurements. Each step predicts the state and its covariance forward, then corrects them with the new measurement, weighting the surprise by the Kalman gain: large when the prediction is uncertain, small when the sensor is noisy. With Gaussian noise it is the exact Bayesian answer.`,
        formula: T`x^-=Fx,\quad P^-=FPF^T+Q;\qquad S=HP^-H^T+R,\quad K=P^-H^TS^{-1},\quad x=x^-+K(z-Hx^-),\quad P=(I-KH)P^-`,
        steps: [T`Predict the mean with F and the covariance with \(FPF^T+Q\).`, T`Form the innovation \(y=z-Hx^-\) and its covariance \(S=HP^-H^T+R\).`, T`Compute the gain \(K=P^-H^TS^{-1}\), then update \(x=x^-+Ky\) and \(P=(I-KH)P^-\).`],
        examples: [[T`\(x=(0,1)\), \(P=I\), \(R=1\), \(z=2\)`, T`\(x^-=(1,1)\), \(S=3\), \(K=(2/3,1/3)\), \(x=(5/3,4/3)\)`], [T`one dimension, \(P^-=2\), \(R=1\)`, T`\(K=2/3\), \(P=2/3\)`], [T`\(x=(0,2)\), \(P=I\), \(R=2\), \(z=3.5\)`, T`\(S=4\), \(K=(0.5,0.25)\), \(x=(2.75,2.375)\)`]],
        pitfall: T`Q and R are modelling choices. Too small a Q makes the filter ignore real changes of speed; too small an R makes it chase measurement noise.`
      },
      {
        id: 'extended-kalman-filter', term: 'Extended Kalman filter (EKF)', symbol: T`H=\frac{\partial h}{\partial x}`,
        plain: T`The Kalman filter for nonlinear models \(x_k=f(x_{k-1})+w\) and \(z=h(x)+r\). It moves the mean through f and h themselves, and the covariances through their Jacobians at the current estimate, as if the functions were linear nearby. Visual-inertial odometry and SLAM run it on camera poses.`,
        formula: T`x^-=f(x),\quad F=\frac{\partial f}{\partial x}\Big|_{x},\quad P^-=FPF^T+Q;\qquad y=z-h(x^-),\quad H=\frac{\partial h}{\partial x}\Big|_{x^-}`,
        steps: [T`Predict the mean with the nonlinear f and the covariance with its Jacobian F.`, T`Compute the innovation with the nonlinear h: \(y=z-h(x^-)\).`, T`Use the Jacobian H of h in S and K exactly as in the linear filter.`],
        examples: [[T`range sensor \(h(x)=\sqrt{x_1^2+x_2^2}\) at (3, 4)`, T`\(h=5\), \(H=(3/5,\ 4/5)=(0.6,\ 0.8)\)`], [T`range measured as 5.5`, T`innovation \(y=0.5\)`], [T`\(h(p)=p^2\) at \(p=3\)`, T`\(H=2p=6\)`]],
        pitfall: T`The linearisation is only as good as the estimate. Far from the truth the Jacobian is wrong, and the filter can become overconfident and diverge.`
      },
      {
        id: 'innovation-gating', term: 'Innovation gating (chi-squared test)', symbol: T`d^2=y^TS^{-1}y`,
        plain: T`Before using a measurement, check that it is plausible for the track. If the model is right, the innovation y is Gaussian with covariance S, so its squared Mahalanobis distance follows a chi-squared distribution: the distribution of a sum of k squared standard normal numbers, where k is the size of the measurement. Measurements beyond its 95% point are rejected.`,
        formula: T`d^2=y^TS^{-1}y\sim\chi^2_k,\qquad\text{95\% gates: }3.84\ (k=1),\ \ 5.99\ (k=2);\qquad\text{99\%: }6.63,\ 9.21`,
        steps: [T`Compute the innovation \(y=z-Hx^-\) and its covariance S.`, T`Compute \(d^2=y^TS^{-1}y\); for a diagonal S, add up \(y_i^2/S_{ii}\).`, T`Accept the measurement if \(d^2\) is below the chi-squared threshold for that dimension and confidence.`],
        examples: [[T`\(S=3\), \(y=1\)`, T`\(d^2=1/3\): accept`], [T`\(S=3\), \(y=4\)`, T`\(d^2=16/3\approx5.33>3.84\): reject`], [T`\(S=4\), \(y=-4\)`, T`\(d^2=4.00\): just outside`], [T`\(S=\operatorname{diag}(4,9)\), \(y=(2,3)\)`, T`\(d^2=1+1=2<5.99\): accept`]],
        pitfall: T`A 2D gate needs the threshold with 2 degrees of freedom, 5.99, not \(1.96^2=3.84\). Too tight a gate loses a track during a turn; too loose a gate lets clutter in.`
      },
      {
        id: 'hungarian-algorithm', term: 'Assignment problem and the Hungarian algorithm', symbol: T`\min_\sigma\sum_iC_{i\sigma(i)}`,
        plain: T`Given a cost for pairing each track with each detection, choose one detection per track so that the total cost is as small as possible. Taking the cheapest pair first (greedy) can be far from optimal. The Hungarian algorithm finds the optimum in about \(n^3\) steps by subtracting row and column minima, which never changes the best assignment, until enough independent zeros appear.`,
        steps: [T`Subtract each row’s minimum from its row, then each column’s minimum from its column.`, T`Cover all zeros with as few horizontal and vertical lines as possible.`, T`If fewer than n lines are needed, subtract the smallest uncovered entry from all uncovered entries, add it where two lines cross, and cover again.`, T`Choose n zeros with one in each row and column: that is the optimal assignment.`],
        examples: [[T`\(\begin{bmatrix}0.1&0.2\\0.3&0.9\end{bmatrix}\), greedy`, T`0.1, then forced 0.9: total 1.0`], [T`the same, optimal`, T`0.2 + 0.3 = 0.5 (track 1 with detection 2)`], [T`\(\begin{bmatrix}0.1&0.3&0.9\\0.2&0.9&0.9\\0.9&0.4&0.3\end{bmatrix}\)`, T`optimal 0.3 + 0.2 + 0.3 = 0.8; greedy 1.3`]],
        pitfall: T`Forbid pairs outside the gate before matching, by giving them a huge cost, or the optimum may include an absurd pair. In Python, \(\texttt{scipy.optimize.linear\_sum\_assignment}\) solves it.`,
        seeAlso: [65]
      }
    ]
  });
})();
