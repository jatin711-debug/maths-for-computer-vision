# Lesson 21 - Conditional probability and Bayes theorem

**Module:** 06 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 20; revisit any symbols you cannot yet explain.

**Goal:** Calculate a posterior while keeping base rates and reversed conditionals separate.

## Events and conditioning

An event is a collection of possible outcomes. Probabilities lie between zero and one, and the whole outcome space has probability one. For events A and B with \(P(B)>0\), conditional probability is \(P(A\mid B)=\frac{P(A\cap B)}{P(B)}\). It asks about A within the subset where B occurred.

The product rule gives \(P(A\cap B)=P(B\mid A)P(A)\). Equating two ways to express the intersection yields Bayes theorem: \(P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}\). The denominator includes every way that B can occur. For A versus its complement, \(P(B)=P(B\mid A)P(A)+P(B\mid A^c)P(A^c)\).

## Work a recognition example

Suppose 20% of images contain an object: \(P(A)=0.2\). A detector raises a flag on 80% of object images and 10% of images without the object. Let B mean a flag. In 1000 representative images, expect 200 object images with 160 flags, and 800 non-object images with 80 flags. There are 240 flags, of which 160 correspond to objects. Thus \(P(A\mid B)=\frac{160}{240}=\frac23\).

The 80% detection rate \(P(B\mid A)\) is different from the 2/3 probability that a flagged image contains an object. If object prevalence drops to 1% with the same conditional flag rates, the posterior becomes 0.008/(0.008+0.099), about 0.0748. Base rates matter even if sensitivity stays fixed.

## Independence is a specific claim

A and B are independent when \(P(A\cap B)=P(A)P(B)\), equivalently \(P(A\mid B)=P(A)\) when conditioning is defined. Independence is stronger than saying events merely seem unrelated. A dataset construction or probabilistic model may assume it; observations from consecutive video frames often violate an independent-sample assumption.

A neural-network score is not automatically a calibrated posterior. A sigmoid or softmax output has the range and normalization of a probability model, but calibration must be evaluated on relevant data. Bayes calculations clarify assumptions; they do not repair a misspecified likelihood on their own.

## Practice before opening the answers

1. With \(P(A)=0.3\), \(P(B\mid A)\)=0.8 and \(P(B\mid A^c)=0.2\), compute P(B).
2. Using those values, compute \(P(A\mid B)\).
3. If A and B are independent with \(P(A)=0.4\) and \(P(B)=0.5\), find their intersection probability.
4. Why is detector recall different from the probability an alerted image truly contains the object?

## Check your understanding

Solve a new Bayes example with a frequency table, and explain each conditioning direction in plain language.

## Read with a purpose

MML 6.1 and 6.3; CV Appendix B.4. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
