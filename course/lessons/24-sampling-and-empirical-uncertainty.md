# Lesson 24 - Sampling and empirical uncertainty

**Module:** 06 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 23; revisit any symbols you cannot yet explain.

**Goal:** Measure uncertainty in an evaluation estimate without confusing it with model confidence.

## An accuracy is an estimate from a sample

If predictions on N independently sampled images have correctness indicators C_i, accuracy is \(\hat p=\frac1N\sum_i C_i\). Under an identical Bernoulli model with true accuracy p, \(\operatorname{Var}(\hat p)=\frac{p(1-p)}N\). A plug-in standard error is \(\sqrt{\frac{\hat p(1-\hat p)}N}\), useful when counts are sufficiently large and neither success nor failure is too rare.

At \(\hat p=0.8\) with \(N=100\), this is 0.04. A rough normal 95% interval is \(0.8\pm1.96\cdot0.04\), approximately \([0.722,0.878]\). With \(N=25\) the standard error doubles. This approximation is poor near zero or one and for tiny samples; 5 successes out of 5 should not be reported as certainty of perfect performance.

## What the interval means

A frequentist confidence procedure is designed to cover the fixed population quantity at a stated rate over repeated samples, under its assumptions. It is distinct from a probability that one model prediction is correct and from a Bayesian credible interval. The practical conclusion is that sample size and sampling design affect the strength of performance evidence.

## Bootstrap a declared sampling unit

For a basic nonparametric bootstrap, sample N observed units with replacement, compute accuracy, and repeat many times. Percentiles of these replicated accuracies form a simple approximate interval. This procedure uses the observed empirical distribution; it cannot invent unseen failure modes or fix an unrepresentative test set.

If images are clustered by patient, video or scene, bootstrap the independent groups rather than isolated correlated frames when that matches the target question. The choice of sampling unit belongs in the report. Comparing two models on the same images also produces paired outcomes, so preserve those pairs when estimating their difference.

## A controlled noise experiment

Generate several independent noisy images, evaluate a fixed classifier, and repeat the whole sample experiment. Keep model training separate from evaluation trials. Track how the estimate varies with N and noise level. Probability of a class from softmax, uncertainty in measured accuracy, and uncertainty from changing the training sample are different quantities; name which one you measure.

## Practice before opening the answers

1. At \(\hat p=0.5\) and \(N=100\), find the plug-in standard error.
2. How does standard error change if N is multiplied by four under the same independent model?
3. Why is the plug-in normal interval unreliable after 3 successes out of 3?
4. When evaluating many frames from each video, what could be a better bootstrap unit?

## Check your understanding

Report accuracy with sample size, sampling unit and an uncertainty method, and explain the limits of that evidence.

## Read with a purpose

MML 6.4 and 8.6; revisit CV Appendix B.1. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
