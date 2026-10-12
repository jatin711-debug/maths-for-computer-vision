# Lesson 50 - Homographies, warping and resampling

**Module:** 13 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 49 and 33; the null-space solution below uses the SVD from Lesson 14, and the conditioning remark refers to Lesson 11.

**Goal:** Estimate a homography from four correspondences and warp an image by inverse mapping with bilinear interpolation.

## Eight numbers need four points

A homography is a 3×3 matrix H acting on homogeneous points, \(\tilde x'\simeq H\tilde x\), where \(\simeq\) means "equal after dividing by the last coordinate". Multiplying H by any nonzero constant gives the same map, so only 8 of its 9 entries are free. Written out, the division is

\[
u=\frac{h_{11}x+h_{12}y+h_{13}}{h_{31}x+h_{32}y+h_{33}},\qquad v=\frac{h_{21}x+h_{22}y+h_{23}}{h_{31}x+h_{32}y+h_{33}}.
\]

Multiply each equation by its denominator and the unknown entries appear linearly. One correspondence \((x,y)\leftrightarrow(u,v)\) therefore gives two equations, and four correspondences give the eight that an 8-degree-of-freedom map needs, provided no three of the four points lie on one line.

A small example shows what such a map does. With \(H=\begin{bmatrix}2&0&0\\0&2&0\\1&0&1\end{bmatrix}\) the corner (1,1) of the unit square becomes \((2,2,2)\), that is (1,1), and (0,1) becomes \((0,2,1)\), that is (0,2); (0,0) and (1,0) stay put. The square's centre (0.5,0.5) becomes \((1,1,1.5)\), the point (2/3, 2/3). That is where the diagonals of the new quadrilateral cross, not the average of its corners, (0.5, 0.75). Straight lines and their intersections survive; ratios of lengths do not.

## The direct linear transform

Stack the entries as \(h=(h_{11},h_{12},h_{13},h_{21},h_{22},h_{23},h_{31},h_{32},h_{33})\). Rearranged as \((h_{11}x+h_{12}y+h_{13})-u\,(h_{31}x+h_{32}y+h_{33})=0\), the u-equation is one row acting on h:

\[
\begin{bmatrix}x&y&1&0&0&0&-ux&-uy&-u\end{bmatrix}h=0,
\]

and the v-equation is the row \((0,0,0,x,y,1,-vx,-vy,-v)\). With n correspondences the 2n rows form a matrix A, and we need \(Ah=0\). Since h=0 always solves this, ask for \(\|h\|=1\): the answer is the right singular vector of A with the smallest singular value (Lesson 14). With exactly four points in general position that singular value is 0 and h spans the null space; with more, noisy points it is the best compromise in the least-squares sense. A common shortcut fixes \(h_{33}=1\) and solves an 8×8 system, which fails when the true \(h_{33}\) is zero or close to it.

For the example's correspondence (1,0)↔(1,0), the rows are (1,0,1,0,0,0,−1,0,−1) and (0,0,0,1,0,1,0,0,0). With h = (2,0,0,0,2,0,1,0,1) the first gives 2 − 1 − 1 = 0 and the second gives 0 + 0 = 0, as they should.

Normalize the coordinates first. For pixel coordinates near 500, entries such as ux are about 250,000 while others equal 1, so A is badly conditioned (Lesson 11) and noise in the large entries dominates the answer. Translate each point set so its centroid is at the origin, scale it so the mean distance from the origin is \(\sqrt2\), estimate \(\hat H\) from the normalized points, and undo both steps: \(H=T'^{-1}\hat H\,T\), where T and T′ are the normalizing matrices of the two images.

## Pull pixels through the inverse map

Forward warping takes each source pixel, maps it with H and writes it into the nearest output pixel. Where the warp enlarges, some output pixels receive nothing and holes appear; where it shrinks, several source pixels land on one output pixel and overwrite each other. Inverse warping loops over the output instead. For each output pixel centre \(x'\), compute \(H^{-1}\tilde x'\), divide by its last coordinate, and sample the source at that location, which is usually between pixel centres. Every output pixel receives exactly one value.

State the pixel convention. Here the pixel in column i and row j covers \([i,i+1)\times[j,j+1)\), so its centre is \((i+\tfrac12,\ j+\tfrac12)\); a sampler subtracts one half before interpolating between centres. Mixing this convention with "pixel centres at integers" shifts the whole warp by half a pixel.

## Bilinear interpolation, worked

Suppose the inverse map lands at offsets \(\alpha=0.3\) to the right and \(\beta=0.6\) below the top-left of four pixel centres with values \(I_{00}=20\) (top-left), \(I_{10}=100\) (top-right), \(I_{01}=60\) (bottom-left) and \(I_{11}=40\) (bottom-right). Here the subscripts are \(x\) then \(y\), so \(I_{10}\) is one step right; this is the opposite order from the [row, column] array indexing of Lesson 33. Blend along each row: the top gives \(0.7\cdot20+0.3\cdot100=44\) and the bottom \(0.7\cdot60+0.3\cdot40=54\). Blend those vertically: \(0.4\cdot44+0.6\cdot54=50\). In one formula,

\[
I=(1-\alpha)(1-\beta)I_{00}+\alpha(1-\beta)I_{10}+(1-\alpha)\beta I_{01}+\alpha\beta I_{11},
\]

with weights 0.28, 0.12, 0.42 and 0.18. Each weight is the area of the rectangle on the opposite side of the sample point, so the four sum to 1. Nearest-neighbour sampling would return \(I_{01}=60\), the closest centre, and it jumps when \(\alpha\) or \(\beta\) crosses 0.5. Bilinear sampling changes continuously and has a slope, \(\partial I/\partial\alpha=(1-\beta)(I_{10}-I_{00})+\beta(I_{11}-I_{01})=0.4\cdot80+0.6\cdot(-20)=20\). A spatial transformer network backpropagates through that slope to learn its transformation, and RoIAlign samples feature maps at unrounded box positions this way, so the pooled features stay aligned with the box.

## Shrinking needs a blur first

Bilinear sampling reads only four source pixels per output pixel. When a warp shrinks a region by a factor F > 1, each output pixel stands for about F×F source pixels, and reading four of them is the point sampling of Lesson 33: detail finer than the new grid aliases into false patterns, such as broken mortar lines or moiré in printed text. Blur the source first, for example with a Gaussian of \(\sigma\approx F/2\), or average over each output pixel's footprint (area resampling, mipmaps). A homography shrinks some parts of the image more than others, so one global blur is a compromise; when a plane is rectified, its far side is usually magnified while the near side shrinks.

The same machinery appears throughout vision. Document scanners rectify a page from its four corners. Panorama stitching relates photos of a distant scene, or photos taken by a camera that only rotates, with homographies. Driver-assistance systems map the road plane to a bird's-eye view, and networks resample features with bilinear sampling inside spatial transformers and RoIAlign. Lesson 51 shows where homographies come from — a camera viewing a plane — and Lesson 52 makes the estimate robust to wrong matches.

## Practice before opening the answers

1. Map the point (2,1) with H = [[1,0,1],[0,1,0],[0.5,0,1]] and divide by the last coordinate.
2. Write the two rows of A contributed by the correspondence (1,2)↔(3,5), and explain why four correspondences are needed.
3. Interpolate bilinearly at α = 0.25, β = 0.75 between I00 = 10 (top-left), I10 = 30 (top-right), I01 = 50 (bottom-left) and I11 = 90 (bottom-right). What does nearest neighbour give?
4. A warp enlarges a region by 2 in each direction. With forward mapping to the nearest output pixel, at least what fraction of output pixels receives no value? Why does inverse mapping avoid this?

## Check your understanding

Derive the two linear equations that one correspondence gives, explain why a homography has eight degrees of freedom, and explain why a rectified image is computed by inverse mapping with bilinear sampling, with a blur first wherever the warp shrinks.

## Read with a purpose

CV 3.6.1, 8.1.1 and 3.5.1; CS205A 11.2 for multivariable interpolation; Guo Part II, Chapter 1, Section 2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
