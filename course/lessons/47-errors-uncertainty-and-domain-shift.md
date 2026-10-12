# Lesson 47 - Errors, uncertainty and domain shift

**Module:** 12 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 46; revisit any symbols you cannot yet explain.

**Goal:** Audit failure patterns and distinguish observed evidence from explanations requiring another experiment.

## Inspect errors as data

For each wrong prediction, record the input, target, prediction, confidence, preprocessing and relevant object attributes. Sort by groups such as noise, position, class or object size. A few memorable images can suggest a problem but cannot estimate its prevalence; compute group counts and metrics alongside examples.

If there are no natural failures in a simple toy set, use a declared stress test such as more noise or an unseen position range. Keep it separate from the original evaluation. Do not silently redefine the test set after seeing the results, and do not manufacture failure examples while reporting them as random samples.

## A confidence score is one type of uncertainty

Softmax can be highly confident on unfamiliar inputs. Calibration is a relationship between predicted probabilities and outcomes in a particular population; it is not guaranteed to transfer. Sampling intervals for accuracy describe uncertainty in the measured metric, while parameter uncertainty describes sensitivity to different plausible models. State which you are analyzing.

## Shift changes what performance means

Domain shift can alter input appearance, class prevalence, label meaning or the relation between input and target. Changing bar brightness is a different test from changing the fraction of vertical bars. Bayes Lesson 21 explains why altered prevalence can change precision even when class-conditional detection rates remain fixed.

Suppose precision falls on a new dataset. Candidate explanations include more false positives, rarer positives, different annotations or a changed threshold. The metric alone does not identify which cause occurred. Compare conditional rates, counts and data conventions before proposing a remedy.

## Test an explanation

If you suspect downsampling removes small objects, hold other generator properties fixed and vary object size. If you suspect sensitivity to contrast, vary contrast with labels and position held fixed. A targeted controlled experiment strengthens a causal interpretation within that synthetic setup. It does not establish that the same explanation holds for every real distribution.

## Write the limits plainly

List sample size, generator assumptions, absent classes, unresolved errors and evaluation choices that could change the conclusion. Give a next experiment with a measurable predicted outcome. A useful report explains where the method works, where it has been tested and what remains uncertain, rather than treating every failure as a reason to increase model size.

## Practice before opening the answers

1. Name two different kinds of domain shift for synthetic bars.
2. Why can unchanged recall coexist with worse precision after a prevalence change?
3. How would you test whether contrast causes an error pattern?
4. Does a narrow confidence interval on one test set prove robustness to a new distribution?

## Check your understanding

Deliver three analyzed cases, group-level evidence, one tested explanation and one clearly labeled unresolved hypothesis.

## Read with a purpose

MML 8.6; revisit CV Chapters 5-6 and Lesson 24. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
