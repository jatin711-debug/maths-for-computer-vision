# Lesson 23 - Variance, covariance and Gaussian noise

**Module:** 06 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 22; revisit any symbols you cannot yet explain.

**Goal:** Calculate fluctuation and co-variation, and state what Gaussian noise assumes.

## How much does a quantity fluctuate?

Variance is \(\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]\), where \(\mu=\mathbb E[X]\). Expanding gives \(\mathbb E[X^2]-\mu^2\). Standard deviation is the square root of variance, so it shares the variable's units. For equally likely values \([0,2,4]\), mu=2 and population variance=(4+0+4)/3=8/3.

For N independent samples estimating an unknown population variance, the usual unbiased estimator divides squared deviations from the sample mean by N-1. This is different from treating an observed finite list as the entire population and dividing by N. State the purpose and denominator before comparing results.

## Coordinates can fluctuate together

\(\operatorname{Cov}(X,Y)=\mathbb E[(X-\mathbb E[X])(Y-\mathbb E[Y])]\). A covariance matrix records this for every feature pair. Positive covariance means above-average values tend to occur together; negative covariance means opposite deviations. Correlation divides covariance by the two standard deviations when neither is zero, producing a number in \([-1,1]\). Zero correlation does not generally imply independence.

If X is uniform over -1,0,1 and \(Y=X^2\), then \(\mathbb E[X]=0\), \(\mathbb E[Y]=\frac23\), and \(\operatorname{Cov}(X,Y)=\mathbb E[X^3]=0\). Yet Y is completely determined by X, so they are dependent. Linear co-variation cannot capture every relationship.

## A Gaussian model

A scalar Gaussian with mean mu and variance sigma² has density \(\frac1{\sqrt{2\pi}\sigma}\exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)\), for \(\sigma>0\). It is a model of continuous variation. Under additive noise \(I_{\rm observed}=I_{\rm clean}+\epsilon\) with \(\mathbb E[\epsilon]=0\), the expected observed intensity equals the clean intensity. If independent Gaussian noise affects each pixel, its covariance matrix is \(\sigma^2 I\).

Real images may have signal-dependent noise, spatial correlations, quantization and clipping. Clipping Gaussian samples to \([0,255]\) changes their distribution and can introduce bias near boundaries. Use unclipped floating-point simulations when testing the assumed noise model, then study clipping separately.

For independent measurements with variance sigma², averaging N gives variance \(\sigma^2/N\). Correlation weakens this reduction because cross-covariance terms remain. More nearly duplicate frames are not equivalent to the same number of independent measurements.

## Practice before opening the answers

1. Find mean and population variance of \([1,3,5]\).
2. If \(\operatorname{Var}(X)=4\), find \(\operatorname{Var}(3X+2)\).
3. For 16 independent samples each with variance 4, find variance of their mean.
4. Does covariance zero guarantee independence? Give the lesson’s counterexample.

## Check your understanding

Distinguish population and sample variance, explain a covariance matrix, and list assumptions needed for averaging to reduce uncertainty.

## Read with a purpose

MML 6.4-6.5; CV Appendix B.1. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
