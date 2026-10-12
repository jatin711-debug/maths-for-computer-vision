# Lesson 11 - QR, pseudoinverses and numerical conditioning

**Module:** 03 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 10; revisit any symbols you cannot yet explain.

**Goal:** Understand why mathematically valid formulas can be numerically unreliable.

## A stable decomposition changes how we solve

For a tall full-column-rank A, a thin QR decomposition gives \(A=QR\). Q has orthonormal columns, \(Q^TQ=I\); R is square and upper triangular. Least squares reduces to solving \(R\theta=Q^Tb\) by back substitution. The remaining component of b perpendicular to Q cannot be fit. We avoid explicitly constructing an inverse.

For \(A=\begin{bmatrix}1&0\\0&1\\1&1\end{bmatrix}\), the first column has length \(\sqrt2\), so \(q_1=(1,0,1)/\sqrt2\). Remove its component from the second column, then normalize what remains. This Gram-Schmidt picture explains QR; practical robust QR solvers usually use transformations such as Householder reflections rather than naive repeated subtraction.

## Sensitivity is a property of the problem

Consider \(A=\operatorname{diag}(1,0.001)\). With \(b=(1,0.001)\), the exact solution is \((1,1)\). Change the second measurement by 0.0001 and its solution becomes 1.1. The small singular direction amplifies measurement errors. The 2-norm condition number is largest singular value divided by smallest: here 1000. A high condition number indicates potential sensitivity, not that every particular perturbation will be disastrous.

Forming \(A^TA\) squares the 2-norm condition number for full-column-rank A. Here it becomes one million. Floating-point arithmetic has finite precision; avoid making a sensitive problem even more sensitive through the solving method. Feature scaling can improve numerical behavior, though it also changes how penalties are interpreted.

## What if the system is singular?

An SVD-based pseudoinverse selects the minimum-Euclidean-norm least-squares solution. For \(x_1+x_2=2\), the smallest-norm exact solution is \((1,1)\). Other solutions such as \((0,2)\) have the same fit but a larger squared norm. Tiny singular values may be treated as zero using a tolerance, so reported rank is a numerical decision as well as a mathematical concept.

Use a library solver and inspect its residuals, rank and singular values. A successful return means a computation finished; it does not establish that recovered parameters are reliable under small input changes.

## Practice before opening the answers

1. Solve \(R\theta=(5,3)\) for \(R=\begin{bmatrix}2&1\\0&3\end{bmatrix}\).
2. Find the condition number of \(\operatorname{diag}(4,0.5)\).
3. Find the minimum-norm solution of \(x_1+x_2=6\).
4. Why prefer lstsq over explicitly inverting \(A^TA\)?

## Check your understanding

Distinguish problem sensitivity from solver error, and explain what a minimum-norm solution adds to least-squares fitting.

## Read with a purpose

MML 4.5 and 9.2; CS205A 3.3, 4.3-4.5 and 6.2.1. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
