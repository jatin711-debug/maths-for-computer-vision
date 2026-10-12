# Lesson 14 - SVD and low-rank structure

**Module:** 04 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 13; revisit any symbols you cannot yet explain.

**Goal:** Read a rectangular map as orthogonal directions with nonnegative stretch factors.

## A decomposition that works for rectangular maps

An SVD writes \(A=U\Sigma V^T\). The columns of V are orthonormal input directions, Sigma supplies nonnegative singular values, and U gives orthonormal output directions. In geometry: change input coordinates, stretch along perpendicular directions, then express the result in output coordinates. Orthogonal factors can include reflections as well as rotations.

For A of shape (m,n), a reduced SVD has \(U\in\mathbb R^{m\times q},\ \Sigma\in\mathbb R^{q\times q},\ V^T\in\mathbb R^{q\times n}\), where \(q=\min(m,n)\). The number of strictly positive singular values is the rank. In numerical work, a tolerance decides what counts as positive. Singular values are the square roots of eigenvalues of \(A^TA\), but directly computing an SVD usually avoids forming that squared-condition matrix.

## Compression by keeping dominant terms

Write A as the sum \(\sigma_i u_i v_i^T\). The truncated approximation \(A_k\) keeps the k largest terms. For \(A=\operatorname{diag}(5,2,1)\), rank-1 truncation gives \(\operatorname{diag}(5,0,0)\). Its squared Frobenius error is \(2^2+1^2=5\). In general, the discarded squared singular values sum to the best achievable squared Frobenius error among rank-at-most-k matrices.

The Frobenius norm squares and sums every matrix entry. It measures reconstruction error without knowing whether the missing detail is important for recognition. Keeping a large singular direction can preserve a background gradient while removing a small but diagnostic object.

## A storage calculation

An m-by-n grayscale image uses mn numbers. A reduced rank-k representation uses approximately \(k(m+n+1)\): k input directions, k output directions and k singular values. For a 100x80 image and k=10, that is 1810 numbers rather than 8000. For large k this representation can exceed the original storage; it is not automatically a file-compression format.

## Inversion and sensitivity

The pseudoinverse reverses each nonzero singular stretch using \(\frac1{\sigma_i}\). Tiny singular values amplify errors dramatically. Truncating them is a form of regularization: it stabilizes recovery by discarding directions. The choice can remove signal as well as noise, so inspect reconstruction and downstream behavior.

## Practice before opening the answers

1. For singular values \([6,3,2]\), find squared rank-1 reconstruction error.
2. Give reduced-SVD shapes for a 5x3 matrix.
3. How many numbers store a rank-4 approximation of a 20x30 matrix?
4. Does smallest reconstruction error guarantee best recognition accuracy?

## Check your understanding

Draw the three stages of an SVD and calculate the reconstruction error from discarded singular values.

## Read with a purpose

MML 4.4-4.6; CS205A Chapter 6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
