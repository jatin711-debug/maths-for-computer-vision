# Lesson 18 - Gradients and directional derivatives

**Module:** 05 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 17; revisit any symbols you cannot yet explain.

**Goal:** Interpret a gradient as a vector of partial sensitivities and derive a least-squares gradient.

## Change one coordinate at a time

For a scalar f(x,y), a partial derivative with respect to x holds y fixed. With \(f=x^2+3xy+y^2\), partial derivatives are 2x+3y and 3x+2y. Collect them as the column gradient \(\nabla f=\begin{bmatrix}\partial f/\partial x\\\partial f/\partial y\end{bmatrix}\). At \((1,2)\), the gradient is \((8,7)\).

A small displacement \(\delta=(dx,dy)\) changes the function by approximately \(\nabla f^T\delta\). For a unit direction u, the directional derivative is \(\nabla f^Tu\). Cauchy-Schwarz bounds this by \(\|\nabla f\|_2\), with equality for u in the gradient direction when the gradient is nonzero. Thus the negative gradient gives the steepest local decrease among Euclidean unit directions.

For \(f=x^2+y^2\) at \((3,4)\), the gradient is \((6,8)\), with norm 10. Moving along u=\((1,0)\) has derivative 6; moving along u=\((-0.6,-0.8)\) has derivative -10. This is a local statement. A large step in that direction can overshoot and increase f.

## Derive the loss gradient one coordinate at a time

Let predictions be \(A\theta\) and residuals \(r_i=\sum_j A_{ij}\theta_j-b_i\). Use \(L=\frac12\sum_i r_i^2\). Differentiating with respect to \(\theta_j\) gives \(\sum_i r_iA_{ij}\). Collecting coordinates yields \(\nabla L=A^T(A\theta-b)\). If L is the unhalved squared sum, multiply by 2; if it is a mean, divide by observation count. The shape of the gradient must match theta.

This derivation connects Module 3's residual orthogonality to a stationary condition \(\nabla L=0\). Full-column-rank A makes the quadratic strictly convex and the optimum unique. Rank-deficient A can give many coefficient optima with identical fitted predictions.

## Coordinate scale changes the geometry

Steepest descent depends on the distance convention. Rescaling one feature or parameter coordinate changes what a Euclidean unit move means, so gradient magnitudes across unrelated units are not intrinsically comparable. Scaling and adaptive updates can improve behavior without changing the derivative definition.

## Practice before opening the answers

1. Find ∇f for f=x²+xy+2y² at \((1,2)\).
2. For gradient \((3,4)\), find the derivative along unit direction \((1,0)\).
3. Write the gradient of L=(1/N)||\(A\theta\)-b||².
4. Does a negative directional derivative guarantee a decrease for every step length?

## Check your understanding

Compute an unseen multivariable gradient, then verify the shape and normalization of a regression-loss gradient.

## Read with a purpose

MML 5.2 and 5.5; CS205A 0.4.1. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
