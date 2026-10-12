# Lesson 25 - Likelihood and negative log likelihood

**Module:** 07 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 24; revisit any symbols you cannot yet explain.

**Goal:** Derive common training losses from declared observation models.

## Parameters change how plausible observations are

A probability model \(p_\theta(y\mid x)\) assigns a probability mass or density to each target given inputs and parameters. With independent observations, likelihood as a function of theta is the product of these terms. The observations are fixed; theta is varied. A likelihood is not a probability distribution over parameters unless a prior and normalization make it one.

Maximum likelihood chooses parameters making the observed data most plausible under the model. Maximizing a product is equivalent to maximizing its logarithm because log is increasing. Negative log likelihood is \(L(\theta)=-\sum_i\ln p_\theta(y_i\mid x_i)\). Sums are easier to compute and differentiate than long products that can underflow.

## Bernoulli targets give binary cross entropy

For a binary label \(y\in\{0,1\}\), the model term is \(p^y(1-p)^{1-y}\). Its negative log is \(-y\ln p-(1-y)\ln(1-p)\). At y=1,p=0.8, the loss is \(-\ln(0.8)\approx0.2231\). At y=0 with the same prediction, it is \(-\ln(0.2)\approx1.6094\). High probability assigned to the wrong outcome is expensive.

## Gaussian residuals give squared error

Suppose \(y_i=f_\theta(x_i)+\epsilon_i\), with independent epsilon_i distributed as \(\mathcal N(0,\sigma^2)\) and a fixed shared sigma². The negative log likelihood is \(N\ln(\sigma\sqrt{2\pi})+\frac1{2\sigma^2}\sum_i(y_i-f_\theta(x_i))^2\). The first term is constant in theta. Thus minimizing squared error maximizes this likelihood under these assumptions.

If variance is learned, its log term is no longer constant and cannot be dropped. If observations have different known variances, their errors are weighted differently. If errors are heavy-tailed or correlated, ordinary squared error is not automatically the corresponding likelihood criterion.

## A loss needs its data model and reduction

Dividing summed NLL by N gives mean NLL and keeps the same optimizer for a fixed dataset, but changes gradient scale. Adding a regularization term requires a compatible normalization. State label type, output distribution, independence assumption and averaging convention before writing a loss function.

## Practice before opening the answers

1. For y=1,p=0.25, calculate binary NLL.
2. For labels \([1,0]\) and predictions \([0.8,0.3]\), write their summed NLL.
3. Under fixed Gaussian variance 2, what multiplies the squared residual sum in NLL?
4. Why cannot the log-variance term be ignored when predicting variance?

## Check your understanding

Derive binary cross entropy and Gaussian squared error from likelihoods, and identify the assumptions that make each derivation valid.

## Read with a purpose

MML 8.3-8.4 and 9.2; CV Appendix B.2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
