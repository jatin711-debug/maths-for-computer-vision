# Lesson 58 - Scale space, descriptors and matching

**Module:** 15 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 57, 56 and 44; revisit derivative-of-Gaussian gradients, Gaussian pyramids and precision and recall if they feel unfamiliar. The synthetic test pairs use the homographies of Lesson 50.

**Goal:** Detect blobs at their characteristic scale with a scale-normalised Laplacian (DoG), describe them with gradient-orientation histograms, and accept matches with the ratio and mutual-nearest-neighbour tests.

## The same object at many sizes

Lesson 57's corners use a fixed derivative scale σ and window σᵢ. Photograph a doorway from twice as far and every structure is half as wide in pixels, so a fixed-scale detector sees different things and repeatability collapses. The remedy is to look at every scale and let the image itself say which scale belongs to each structure.

The Gaussian scale space is the stack of blurred copies \(L(x,y,\sigma)=G_\sigma*I\) for a continuous range of σ. Blurs compose: blurring with \(\sigma_1\) and then \(\sigma_2\) is one blur with

\[
G_{\sigma_1}*G_{\sigma_2}=G_{\sqrt{\sigma_1^2+\sigma_2^2}},
\]

because variances add (Lesson 23). Blurring by 3 and then by 4 is a single blur of 5, and to move from σ = 1.6 to σ = 3.2 you add only \(\sqrt{3.2^2-1.6^2}\approx2.77\). Detectors build the stack incrementally this way, and once σ has doubled they keep every second pixel and start the next octave, the Gaussian pyramid of Lesson 56.

## The scale-normalised Laplacian finds blobs and their size

The Laplacian \(\nabla^2L=L_{xx}+L_{yy}\) adds the second derivatives in x and y. It is strongly negative at the centre of a bright blob and positive at a dark one. Its size falls as σ grows, simply because blurring flattens everything, so it is multiplied by σ² to compare scales fairly: \(\sigma^2\nabla^2L\) is the scale-normalised Laplacian of Gaussian (LoG).

Take a bright Gaussian blob \(I=\exp\big(-r^2/(2s^2)\big)\) of width s. Blurring gives another Gaussian of width \(t=\sqrt{s^2+\sigma^2}\) and peak \(s^2/t^2\), and differentiating that twice at the centre gives

\[
\big|\sigma^2\nabla^2L\big|_{\text{centre}}=\frac{2\sigma^2s^2}{(s^2+\sigma^2)^2},
\]

which is largest exactly when σ = s. For s = 3 the response is 0.32 at σ = 1.5, 0.50 at σ = 3 and 0.32 again at σ = 6. The best σ is the blob's characteristic scale, and a detector reports a circle of radius about \(\sqrt2\,\sigma\) there. Enlarge the image by 2 and the blob becomes s = 6, so the peak moves to σ = 6: detection follows the scale of the image. A keypoint is a point that is an extremum in all three coordinates (x, y, σ), larger or smaller than its 26 neighbours in the 3×3×3 block of the stack.

## Difference of Gaussians

Computing second derivatives at every scale is expensive. SIFT uses the difference of two neighbouring blurs instead:

\[
D(x,y,\sigma)=L(x,y,k\sigma)-L(x,y,\sigma)\approx(k-1)\,\sigma^2\nabla^2L.
\]

The approximation comes from the heat equation \(\partial L/\partial\sigma=\sigma\nabla^2L\): a small step in σ changes L by \((k\sigma-\sigma)\,\sigma\nabla^2L\). The factor σ² appears without being asked for, so the DoG is already scale-normalised. With S = 3 intervals per octave, \(k=2^{1/3}\approx1.26\); each octave needs S + 3 = 6 blurred images and gives S + 2 = 5 DoG images, of which the middle three can host extrema. At the blob above with σ = 1.5, the DoG is −0.084 and \((k-1)\cdot(-0.32)=-0.083\). Keypoints with a small \(|D|\) are discarded as noise, and those on edges are discarded with a curvature test on the 2×2 Hessian of D, much like the eigenvalue ratio of Lesson 57.

## Describe the patch with gradient histograms

A keypoint fixes a position and a scale. To compare it with keypoints in another image, it needs a description that survives rotation, lighting change and small misalignment. SIFT builds one from the gradients of Lesson 57, measured on the blurred image at the keypoint's scale.

First an orientation: a histogram of gradient directions in a disc around the point, each vote weighted by gradient magnitude, gives a dominant direction θ₀. All later angles are measured relative to θ₀, so rotating the image shifts every vote and θ₀ together and the description does not change. Then the descriptor: a square window aligned with θ₀ and about 12σ wide is split into 4×4 cells, and each cell holds an 8-bin histogram of gradient orientation weighted by magnitude: \(4\cdot4\cdot8=128\) numbers.

Take one cell with gradients (3, 0), (0, 2), (−1, 1) and (2, 2), and 45° bins centred on 0°, 45°, 90°, …. Their angles are 0°, 90°, 135° and 45° and their magnitudes 3, 2, 1.41 and 2.83, so the cell's histogram starts (3, 2.83, 2, 1.41, 0, 0, 0, 0). The whole 128-vector is divided by its length. Gradients already ignore a brightness offset, and the division removes a contrast factor: doubling contrast doubles every vote and leaves the unit vector unchanged. SIFT also clips entries at 0.2 and normalises again, so a few very strong gradients, such as a specular highlight, cannot dominate. ORB and BRIEF instead compare pairs of pixel intensities and store one bit per pair; they are compared by Hamming distance, the number of differing bits, so 10110010 and 10011011 are 3 apart.

## Match, then test the match

Matching compares descriptors by Euclidean distance (Lesson 05). For each descriptor in image A, find its nearest neighbour in image B at distance \(d_1\) and the second nearest at \(d_2\). Nearest alone is not enough: every descriptor has a nearest neighbour, even one whose true partner is hidden or outside the image. Lowe's ratio test accepts the match only if

\[
\frac{d_1}{d_2}<0.8,
\]

that is, if the best candidate is clearly better than the runner-up. With \(d_1=0.20\) and \(d_2=0.50\) the ratio is 0.40: accept. With \(d_1=0.30\) and \(d_2=0.35\) it is 0.86: reject, because two candidates look almost equally good, as happens on repeated bricks or windows. The mutual test adds that A's best match in B must have A as its own best match in A.

With distances from three descriptors in A (rows) to three in B (columns) of (0.20, 0.50, 0.70), (0.30, 0.35, 0.90) and (0.60, 0.80, 0.25), A1 and A3 pass both tests and are matched to B1 and B3. A2 fails the ratio test, and its nearest neighbour B1 prefers A1 in any case.

To evaluate a matcher, warp a photo by a known homography (Lesson 50) and change its brightness and contrast. A match is correct if the warped keypoint lands within a few pixels of its partner. Precision is the fraction of accepted matches that are correct and recall the fraction of possible correspondences that were found (Lesson 44); lowering the ratio threshold raises precision and lowers recall. The surviving matches feed RANSAC (Lesson 52), which needs most of them to be right.

## Practice before opening the answers

1. An image is blurred with σ = 3 and then σ = 4. What single blur is that? A scale space holds σ = 1.6; what extra blur reaches σ = 3.2?
2. For a Gaussian blob of width s = 2, compute the normalised response \(2\sigma^2s^2/(s^2+\sigma^2)^2\) at σ = 1, 2 and 4. Which σ is detected, and what radius \(\sqrt2\sigma\) is drawn? What changes if the image is shrunk to half size?
3. A descriptor cell has gradients (3, 0), (0, 2), (−1, 1) and (2, 2). Build its 8-bin orientation histogram (45° bins centred on 0°, 45°, …). What happens to it if the contrast doubles, if 50 is added to every pixel, and if the patch is rotated by 90° and angles are measured from the dominant orientation?
4. Three descriptors in A have distances (0.20, 0.50, 0.70), (0.30, 0.35, 0.90) and (0.60, 0.80, 0.25) to three in B. Apply the ratio test with threshold 0.8 and the mutual test. Which matches survive? Then find the Hamming distance between the binary descriptors 10110010 and 10011011.

## Check your understanding

Explain why the Laplacian must be multiplied by σ² before scales are compared and why its peak sits at the blob's own scale, describe how a SIFT descriptor gains rotation and contrast invariance, and apply the ratio and mutual tests to a small distance table.

## Read with a purpose

CV 3.5.3, 7.1.1, 7.1.2 and 7.1.3. Lowe (2004), "Distinctive image features from scale-invariant keypoints", describes the full SIFT pipeline, and Rublee et al. (2011) the binary ORB descriptor. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
