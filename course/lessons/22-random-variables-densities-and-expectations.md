# Lesson 22 - Random variables, densities and expectations

**Module:** 06 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 21; revisit any symbols you cannot yet explain.

**Goal:** Distinguish a probability mass from a density and calculate an expectation.

## A random variable assigns a number to an outcome

A Bernoulli variable X records 1 for an event and 0 otherwise, with \(P(X=1)=p\). Its expectation is \(\mathbb E[X]=0(1-p)+1p=p\). For a finite discrete variable, \(\mathbb E[f(X)]=\sum_x f(x)P(X=x)\). Expectation is a probability-weighted average, not necessarily a value the variable can actually take.

A fair die has expectation 3.5 although no roll gives 3.5. For pixel noise taking values -1,0,1 with probabilities 0.25,0.5,0.25, the expected noise is zero and expected squared noise is 0.5. Zero average noise does not mean every observation is undisturbed.

## Continuous probability uses area

A density p(x) is nonnegative and integrates to one. Probability over [a,b] is the area under the density on that interval, written as an integral. You can picture an integral as the limit of adding narrow rectangle areas. For a uniform variable on \([0,2]\), the density is 1/2 inside the interval. Probability of \([0.5,1.5]\) is width 1 times height 1/2, giving 0.5.

At any single exact value, a continuous variable has probability zero because the interval width is zero, even though its density may be positive. A uniform density on \([0,0.1]\) is 10; densities can exceed one. Their units are inverse input units, and only integrated area is a probability.

For continuous X, \(\mathbb E[f(X)]=\int f(x)p(x)\,dx\). A uniform X on \([0,2]\) has \(\mathbb E[X]=\int_0^2\frac{x}{2}\,dx=1\). Its cumulative distribution \(F(t)=P(X\le t)\) is 0 for \(t<0\), t/2 inside the interval, and 1 for \(t\ge2\). A CDF, unlike a density, always lies in \([0,1]\).

## Sample averages estimate expectations

The empirical average \(\frac1N\sum_{i=1}^N X_i\) estimates \(\mathbb E[X]\) under a suitable sampling model. It is itself random because the sampled observations vary. Linearity gives \(\mathbb E[aX+bY]=a\mathbb E[X]+b\mathbb E[Y]\), without requiring independence. Later variance formulas need additional assumptions; keep those distinct.

## Practice before opening the answers

1. Find \(\mathbb E[X]\) for values 0,2,4 with probabilities 0.2,0.5,0.3.
2. For uniform X on \([0,4]\), find \(P(1\le X\le3)\).
3. What is \(P(X=2)\) for that continuous distribution?
4. If \(\mathbb E[X]\)=2 and \(\mathbb E[Y]=3\), calculate \(\mathbb E[2X-Y]\) without assuming independence.

## Check your understanding

Explain how a density of 10 can be valid, then compute both a discrete expectation and a continuous interval probability.

## Read with a purpose

MML 6.2 and 6.4; CV Appendix B.1. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
