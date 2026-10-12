# Lesson 28 - Splits, bias, variance and calibration

**Module:** 07 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 27; revisit any symbols you cannot yet explain.

**Goal:** Design an honest evaluation and separate a confident prediction from a calibrated one.

## Give each dataset split a job

Training data fit parameters and preprocessing. Validation data choose hyperparameters, architectures and stopping decisions. Test data estimate the performance of the fixed final procedure. Repeatedly selecting changes based on test results turns the test set into another validation set, weakening its independent evidence.

Split related images together when deployment involves new subjects or scenes. Record the seed and split identifiers. A random shuffle cannot resolve duplicate leakage or a mismatch between the sampled population and the intended application. Label-preserving augmentation belongs within the training procedure; do not generate a near-duplicate on one side of a split from an image on the other.

## Bias and variance describe kinds of prediction error

For squared loss, expected prediction error can be decomposed into squared bias, variance across training sets and irreducible noise under the usual model. A restricted linear model can underfit a nonlinear relation. A highly flexible fit can change dramatically with its training sample. Increasing complexity is not automatically helpful; regularization and more representative data change the tradeoff.

Training curves offer evidence but do not uniquely diagnose cause. High training and validation loss may mean underfitting, a broken implementation or poor optimization. Low training loss with high validation loss suggests generalization trouble, leakage in model selection or distribution differences worth inspecting.

## Confidence and calibration differ

A calibrated group of predictions assigned probability 0.8 should be correct about 80% of the time, under the calibration definition and population being tested. Suppose ten predictions all give top-class confidence 0.9 and only six are correct. Their observed accuracy is 0.6, suggesting overconfidence in that small group, though uncertainty is substantial.

Reliability diagrams compare average confidence with empirical accuracy across bins. Bin choices and small counts matter. Negative log likelihood and the Brier score can evaluate probabilities directly; classification accuracy ignores many changes in confidence. Calibration on one distribution may fail after domain shift.

## Your baseline report

Record preprocessing, class counts, split protocol, accuracy, per-class errors and mean NLL. Pick any threshold or calibration parameter using validation data. Report test results after fixing these choices. Label explanations of failure as hypotheses unless a controlled experiment supports them.

## Practice before opening the answers

1. Which split selects learning rate?
2. A model is 90% confident on 20 predictions and correct on 12. Give empirical accuracy and confidence gap.
3. Give an example of leakage before model training.
4. Can perfect classification accuracy establish perfect probability calibration?

## Check your understanding

Write a complete split protocol and identify a measure of correctness, a measure of probability quality and a source of sampling uncertainty.

## Read with a purpose

MML 8.2.4 and 8.6; CV 4.1.2 and 5.3.6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
