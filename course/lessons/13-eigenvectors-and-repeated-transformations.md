# Lesson 13 - Eigenvectors and repeated transformations

**Module:** 04 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 12; revisit any symbols you cannot yet explain.

**Goal:** Identify invariant directions and predict repeated application of a square map.

## A direction that does not turn

For a square matrix A, a nonzero v satisfying \(Av=\lambda v\) is an eigenvector, and lambda is its eigenvalue. The map may stretch, shrink or reverse this direction, but it remains on the same line. Zero is excluded as an eigenvector because it satisfies the equation for every lambda and identifies no direction.

For \(A=\operatorname{diag}(3,1)\), e₁ has eigenvalue 3 and e₂ has eigenvalue 1. Starting from x=\((2,1)\), one application gives \((6,1)\), and three applications give \((54,1)\). If \(x=av_1+bv_2\) in an eigenbasis, \(A^kx=a\lambda_1^kv_1+b\lambda_2^kv_2\). Repetition reveals which magnitudes grow or vanish.

## Find eigenvalues in a small example

Let \(A=\begin{bmatrix}2&1\\1&2\end{bmatrix}\). The eigenvalue equation requires \(\det(A-\lambda I)=0\). Here \((2-\lambda)^2-1=0\), so \(\lambda=3\) or 1. For \(\lambda=3\), v=\((1,1)\) works; for \(\lambda=1\), v=\((1,-1)\) works. These directions are perpendicular because this A is real symmetric. Normalize them if an orthonormal basis is needed.

Not every real square matrix has a real eigenbasis. A 90-degree rotation has no nonzero real vector that stays on the same line; its eigenvalues are complex. A repeated eigenvalue also does not guarantee enough independent eigenvectors. Symmetric real matrices are especially useful because they have an orthonormal eigenbasis and real eigenvalues.

## Why vision and optimization use this

A covariance matrix is symmetric and positive semidefinite. Its eigenvectors identify directions of feature variation; eigenvalues describe variance along those directions. A quadratic loss has a symmetric curvature matrix whose eigenvalues describe how steep different directions are. We will connect both to practical calculations.

Eigenvalues can be negative: \(A=\operatorname{diag}(-2,1)\) reverses and doubles its first direction. Singular values, studied next, are always nonnegative and apply to rectangular maps too. Do not treat these two sets of numbers as interchangeable for arbitrary matrices.

## Practice before opening the answers

1. Find eigenvalues and standard eigenvectors of \(\operatorname{diag}(2,-1)\).
2. Apply \(\operatorname{diag}(2,-1)\) three times to \((1,2)\).
3. Verify that \((1,-1)\) is an eigenvector of \(\begin{bmatrix}2&1\\1&2\end{bmatrix}\).
4. Why is the zero vector excluded from the eigenvector definition?

## Check your understanding

Predict repeated transformation along independent eigendirections and explain the conditions needed to use an eigenbasis.

## Read with a purpose

MML 4.2; CS205A Chapter 5. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
