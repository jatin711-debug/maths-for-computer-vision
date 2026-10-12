# Lesson 26 - Priors, MAP and regularization

**Module:** 07 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 25; revisit any symbols you cannot yet explain.

**Goal:** Connect a parameter preference to a probabilistic prior while tracking loss scales.

## Bayes reasoning for parameters

The posterior is \(p(\theta\mid D)\propto p(D\mid\theta)p(\theta)\). The prior \(p(\theta)\) describes parameter preference before observing these data. Maximum a posteriori estimation chooses a posterior mode. Taking a negative logarithm turns this into \(\operatorname{NLL}(\theta)-\ln p(\theta)\), plus a constant independent of theta.

Unlike a full Bayesian posterior computation, MAP returns one parameter setting. It does not by itself quantify uncertainty across other plausible settings. The choice of parameterization also matters when interpreting densities and modes.

## A Gaussian prior yields a squared penalty

If theta has independent Gaussian coordinates with mean zero and variance tau², then \(-\ln p(\theta)=\frac{\|\theta\|_2^2}{2\tau^2}+\text{constant}\). Combine this with Gaussian residual variance sigma² from the previous lesson. Multiplying the entire MAP objective by \(2\sigma^2\) gives squared residual sum + \(\frac{\sigma^2}{\tau^2}\|\theta\|_2^2\). The ridge coefficient is \(\lambda=\sigma^2/\tau^2\) under this summed-error convention.

A tighter prior, smaller tau², produces a stronger penalty. Different coordinates can have different prior variances, giving different penalties. Leaving an intercept unpenalized represents a different prior choice from shrinking all parameters equally.

## Work the one-coordinate example

Observe y=2 with model \(y=\theta+\epsilon\), \(\sigma^2=1\), and prior \(\theta\sim\mathcal N(0,1)\). The posterior is proportional to \(\exp\left(-\frac{(2-\theta)^2+\theta^2}{2}\right)\). Completing the square gives a Gaussian centered at 1 with variance 1/2. Its MAP is \(\theta=1\); maximum likelihood without the prior gives \(\theta=2\). The prior pulls the estimate toward zero.

## Keep reduction conventions consistent

Switching from a summed data loss to a mean divides its gradient by N. Keeping the same penalty coefficient then changes its strength relative to the data. A library's regularization coefficient must be interpreted with its stated objective, including any factor of 1/2.

Priors are assumptions, not additional observations. Choose their strength using a justified model or validation procedure. A zero-centered prior can be useful without literally believing every true coefficient is near zero; report the resulting bias and compare predictive performance on untouched data.

## Practice before opening the answers

1. With \(\sigma^2=2\) and \(\tau^2=4\), give lambda under the lesson’s summed-error convention.
2. For a single observation y=6 with both variances equal to 1, find the MAP.
3. Does MAP supply a full posterior uncertainty distribution?
4. If a summed data loss is divided by N, how should its penalty coefficient change to preserve the same optimum?

## Check your understanding

Derive ridge from Gaussian assumptions and show how mean-versus-sum reduction changes the numeric coefficient.

## Read with a purpose

MML 8.3-8.4 and 9.3; CV Appendix B.4. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
