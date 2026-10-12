# Lesson 12 - Regularization and the cost of overfitting

**Module:** 03 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 11; revisit any symbols you cannot yet explain.

**Goal:** Understand how a penalty trades fitting error against coefficient magnitude.

## Exact fitting can be a poor prediction strategy

A flexible model may follow measurement noise and fit training observations closely while making poor predictions elsewhere. Regularization adds a preference for certain parameters. Ridge regression minimizes \(\|A\theta-b\|_2^2+\lambda\|\theta\|_2^2\), with \(\lambda\ge0\). The equation card above writes the same objective with the data matrix X, weights w and targets y in place of A, \(\theta\) and b, as most machine-learning code does. A larger lambda increases the cost of large coefficients; it changes the optimization problem rather than merely improving the arithmetic of the original one.

## Derive the adjusted system

The least-squares derivative is \(2A^T(A\theta-b)\) and the penalty derivative is \(2\lambda\theta\); Lessons 17-19 derive gradients like these, so take them on trust for now. Setting their sum to zero gives \((A^TA+\lambda I)\theta=A^Tb\). For \(\lambda>0\) this matrix is positive definite (every \(v\ne0\) gives \(v^T(A^TA+\lambda I)v=\|Av\|^2+\lambda\|v\|^2>0\)), so it is invertible even when columns of A are dependent. We still solve a system rather than explicitly taking its inverse.

In one dimension with A=[1] and b=[2], minimize \((\theta-2)^2+\lambda\theta^2\). The optimum is \(\theta=\frac2{1+\lambda}\). At \(\lambda=0\) the fit is 2; at \(\lambda=1\) it is 1. The residual grows, but the coefficient shrinks. Adding a penalty changes both the answer and the assumptions behind it.

## Scaling and bias require a decision

If one input feature is multiplied by 100, its coefficient can be divided by 100 to preserve predictions. Its squared penalty then changes, so ridge is sensitive to feature scale. Standardize using training statistics before interpreting equal coordinate penalties. It is common to leave the intercept unpenalized; then the penalty matrix has a zero in that coordinate, rather than being the full identity.

## Select lambda using validation evidence

Try a small declared set of lambda values using training fits and validation error. Choose using validation, then evaluate the held-out test set once the procedure is fixed. Training error alone usually favors weaker penalties. Neither an improved validation result nor a small coefficient proves that a model has learned causal structure.

Compare a line and a high-degree polynomial on a few noisy points. Ask where the fitted curves disagree away from observed inputs. This exposes how coefficient choices interact with the representation. Later, a Gaussian prior will give a statistical interpretation of a squared penalty.

## Practice before opening the answers

1. For the scalar example, find theta when \(\lambda=3\).
2. At \(\lambda=1\), compute the residual loss and penalty separately.
3. Why can input rescaling change a ridge fit?
4. Which split should choose lambda, and which split reports final performance?

## Check your understanding

Explain why regularization may deliberately worsen training fit while improving predictions, and design a comparison that avoids test-set tuning.

## Read with a purpose

MML 8.2.3, 9.2.2-9.2.4 and 8.6; CV 4.1.2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
