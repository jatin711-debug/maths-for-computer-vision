# Lesson 10 - Least squares as projection

**Module:** 03 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 09; revisit any symbols you cannot yet explain.

**Goal:** Derive residual orthogonality and fit a line to inconsistent observations.

## Replace exact equality with a measurable error

Given A and observations b, choose parameters \(\theta\) minimizing \(\|A\theta-b\|_2^2\) (the equation card above calls the solution \(\hat x\); it is the same vector). The residual \(r=A\theta-b\) measures how the fitted observations differ from the measured ones. Squaring makes positive and negative errors contribute positively. Least squares treats large residuals strongly and can be sensitive to outliers.

## Derive the projection condition

Suppose changing theta along direction d changes predictions along Ad. At the best fit, the residual has no component that such a prediction change could cancel: r must be orthogonal to every column of A. This gives \(A^Tr=0\), hence \(A^TA\theta=A^Tb\), the normal equations. In Module 5 we also derive this by differentiation.

The fitted vector \(A\theta\) is the orthogonal projection of b onto the column space. If A has full column rank, the coefficient vector is unique. With dependent columns, fitted predictions remain unique but multiple coefficients may produce them. Least squares does not promise the true generating parameters; it finds the best fit under the chosen criterion.

## Work a noisy line fit

For \(t=[0,1,2]\) and \(b=[1,2,2]\), choose \(A=\begin{bmatrix}0&1\\1&1\\2&1\end{bmatrix}\) and \(\theta=(a,c)\). The normal-equation terms are \(A^TA=\begin{bmatrix}5&3\\3&3\end{bmatrix}\) and \(A^Tb=(6,5)\). Solving gives \(a=\frac12,\ c=\frac76\). Predictions are (7/6,5/3,13/6), so \(r=(\tfrac16,-\tfrac13,\tfrac16)\).

The residual sum is zero because the constant column is in A. Its dot product with the t column is \(-\frac13+2\cdot\frac16=0\). Squared residuals sum to 1/6; MSE divides that by three to obtain 1/18. These are different loss normalizations with the same minimizer.

## Compute the fit stably

The normal equations explain the optimum, but forming \(A^TA\) can worsen conditioning. Use np.linalg.lstsq(A,b,rcond=None) in the notebook. Never assume an inverse exists merely because the formula fits on a line. Draw the observations, predictions and residuals: a small average residual can hide large opposite errors.

## Practice before opening the answers

1. Fit a constant c to observations \([1,2,6]\) by least squares.
2. For the worked line fit, calculate the residual sum and sum of squared residuals.
3. Why is \(b-A\theta\) orthogonal to the column space at an optimum?
4. Does a residual sum of zero imply every observation is fit exactly?

## Check your understanding

Set up an unseen line fit, identify the column space, and verify the residual is orthogonal to its columns.

## Read with a purpose

MML 3.8 and 9.1-9.2; CS205A Chapters 3-4. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
