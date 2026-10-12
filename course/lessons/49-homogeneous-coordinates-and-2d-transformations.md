# Lesson 49 - Homogeneous coordinates and 2D transformations

**Module:** 13 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 07 and 41; revisit matrix composition and the augmentation matrix if they feel unfamiliar.

**Goal:** Write 2D transformations as 3×3 matrices in homogeneous coordinates and say which geometric properties each family preserves.

## Append a coordinate to make translation linear

A 2×2 matrix can rotate, scale or shear a point, but it cannot translate it: \(A\mathbf 0=\mathbf 0\) for every matrix A, so the origin never moves. Append a third coordinate equal to 1 and write the point as \(\tilde x=(x,y,1)^T\). Then translation by \(t=(t_x,t_y)\) becomes the matrix product

\[
\begin{bmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{bmatrix}\begin{bmatrix}x\\y\\1\end{bmatrix}=\begin{bmatrix}x+t_x\\y+t_y\\1\end{bmatrix}.
\]

Every transformation in this lesson is now one 3×3 matrix, and a sequence of transformations is a single product. The order matters exactly as it did for function composition in Lesson 02: \(TR\tilde x\) rotates first and translates second. Rotating (1,1) by 90° gives (−1,1); translating by (2,0) then gives (1,1). Translating first gives (3,1), and rotating that gives (−1,3).

A vector with last coordinate 0, such as \((d_x,d_y,0)\), is a direction rather than a position. Translation leaves it unchanged, which is what you want for displacements: moving an image does not change the direction of an edge.

## A hierarchy of transformations

Write the general 3×3 matrix as \(\begin{bmatrix}A&t\\v^T&1\end{bmatrix}\). Restricting its entries gives families with fewer degrees of freedom and more preserved properties:

1. **Translation** (2 numbers): A is the identity. Everything except absolute position is preserved.
2. **Euclidean or rigid** (3): A is a rotation R. Lengths and angles are preserved.
3. **Similarity** (4): A is sR for a scale s>0. Angles and ratios of lengths are preserved.
4. **Affine** (6): any invertible A, with v=0. Parallel lines stay parallel and midpoints stay midpoints; lengths and angles can change.
5. **Projective** or homography (8): v can be nonzero. Straight lines stay straight, but parallel lines can meet.

For a similarity with s=2, θ=90° and t=(1,0), the point (1,1) maps to \(2\cdot(-1,1)+(1,0)=(-1,2)\). Each family contains the previous one; a projective map has 9 entries but only 8 degrees of freedom, because multiplying the whole matrix by a nonzero constant gives the same map.

## Homogeneous points are defined up to scale

After a projective map the last coordinate is usually not 1. Read the point by dividing: \((u,v,w)\) names the 2D point \((u/w,\ v/w)\). So \((2,4,2)\) and \((1,2,1)\) are the same point. When w=0 there is no ordinary point; the vector names a point at infinity, a direction.

A line \(ax+by+c=0\) is also a 3-vector \(l=(a,b,c)\), and a point lies on it exactly when \(l^T\tilde x=0\). The line through two points is their cross product, and two lines meet at the cross product of their vectors. For the parallel lines y=1 and y=2, \(l_1=(0,1,-1)\) and \(l_2=(0,1,-2)\) give \(l_1\times l_2=(-1,0,0)\): last coordinate 0, a point at infinity in the x direction. Parallel lines meet at infinity, and a homography can bring that point into view, which is why railway tracks converge in a photograph.

## Where this appears in vision

The augmentation matrix of Lesson 41 is the affine case. Image registration, panorama stitching and the spatial transformer layer estimate one of these matrices and resample the image through it. The next lesson estimates a homography from four point correspondences and warps an image with it; Lesson 51 extends the same idea to a 3×4 camera matrix that maps 3D points to pixels.

## Practice before opening the answers

1. Write the 3×3 matrix that rotates by 90° about the origin and then translates by (2,0). Apply it to (1,0).
2. Is (3,6,3) the same 2D point as (1,2)? Which 2D point is (4,−2,2)?
3. Find the homogeneous line through (0,0) and (1,1) with a cross product.
4. Which does an affine map preserve: lengths, parallel lines, angles, midpoints?

## Check your understanding

Explain why translation needs the extra coordinate, and classify a given 3×3 matrix as Euclidean, similarity, affine or projective from its entries.

## Read with a purpose

CV 2.1 and 2.1.1; Guo Part II, Chapter 1, Sections 1-2; MML 2.8 for affine spaces. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
