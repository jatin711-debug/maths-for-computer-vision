# Lesson 15 - PCA, centering and covariance

**Module:** 04 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 14; revisit any symbols you cannot yet explain.

**Goal:** Derive the direction of maximum centered variance and distinguish PCA from SVD of one image.

## Find how a collection varies

Let X have one sample per row, with shape (N,D). Compute the training mean \(\mu=\frac1N\sum_{i=1}^N x_i\) and centered data \(X_c=X-\mathbf1\mu\). Sample covariance is \(C=\frac{X_c^TX_c}{N-1}\), when \(N>1\). Some objectives use division by N instead; this changes eigenvalues but not directions. State your convention.

PCA chooses a unit direction v maximizing variance of projections \(X_cv\). That variance is \(v^TCv\). Under \(\|v\|_2=1\), the maximum occurs at an eigenvector of C with its largest eigenvalue. To see why, write v in C's orthonormal eigenvectors, \(v=\sum_i c_iq_i\) with \(\sum_i c_i^2=1\). Then \(v^TCv=\sum_i\lambda_ic_i^2\): a weighted average of the eigenvalues with weights \(c_i^2\) that sum to one. An average is never larger than its largest entry, and it equals \(\lambda_1\) only when all the weight sits on \(q_1\). This ratio \(v^TCv/v^Tv\) is called the Rayleigh quotient. Further components are perpendicular directions with the next largest variances. Thus PCA is an unsupervised representation: labels do not enter this calculation.

## Work an exact example

Samples \((1,1)\), \((2,2)\), \((3,3)\) have mean \((2,2)\). Centered rows are \((-1,-1)\), \((0,0)\), \((1,1)\). Their sample covariance is \(\begin{bmatrix}1&1\\1&1\end{bmatrix}\). The first principal direction is \((1,1)/\sqrt2\), with eigenvalue 2; the perpendicular direction has eigenvalue 0.

Projection scores are \(-\sqrt2,0,\sqrt2\). Reconstructing each score as \(\text{score}\cdot v+\mu\) recovers the three samples exactly with one coordinate because their centered data lie on a line. Without adding mu back, the reconstruction has the wrong location.

## Connect PCA and SVD

If \(X_c=U\Sigma V^T\), principal directions are columns of V. Corresponding sample-covariance eigenvalues are \(\frac{\sigma_i^2}{N-1}\). Image SVD instead factors a single pixel matrix, treating rows and columns as its two axes. PCA over many flattened images studies how sample feature coordinates co-vary. These are related decompositions applied to different objects.

## Choose what variation means

Features with large units can dominate covariance, so standardized PCA may differ from raw PCA. Decide whether magnitude differences are meaningful. High variance is not necessarily discrimination: brightness variation can exceed the variation separating two classes. Evaluate recognition with a properly split dataset rather than using retained variance as a proxy for accuracy.

## Practice before opening the answers

1. Center the samples \((0,2)\) and \((2,4)\).
2. Find the sample covariance of those two samples.
3. For covariance eigenvalues \([4,1,0]\), what fraction of total variance does the first component retain?
4. Why is PCA not a supervised classifier?

## Check your understanding

Calculate one-dimensional PCA for points on a line, restore the mean during reconstruction, and explain what object each SVD factorizes.

## Read with a purpose

MML 10.1-10.4 and 10.6; CS205A Chapters 5-6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
