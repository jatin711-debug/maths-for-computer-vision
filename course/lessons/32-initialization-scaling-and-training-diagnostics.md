# Lesson 32 - Initialization, scaling and training diagnostics

**Module:** 08 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 31; revisit any symbols you cannot yet explain.

**Goal:** Use controlled experiments to separate a broken computation from poor learning settings.

## Start with a computation that can succeed

Initialize identical hidden units with identical weights and they can receive identical gradients, remaining symmetric. Random initialization breaks this symmetry. Too-large weights can amplify signals or saturate activations; too-small weights can make gradients weak in some architectures. Initialization should match layer width and activation rather than an arbitrary common scale.

For roughly independent zero-mean inputs with variance \(s^2\) and D incoming weights with variance \(v^2\), a linear preactivation has variance about \(Dv^2s^2\). Scaling \(v^2\) inversely with D helps keep signals controlled. For ReLU layers, a common variance is about \(\frac2D\) under simplifying assumptions about input symmetry. This is a starting principle, not a proof of stable training for every network.

## Scaling affects the loss landscape

For half-scaled least squares, curvature is \(A^TA\). If feature scales differ widely, the eigenvalues can differ widely, producing a stretched landscape. A step small enough for a steep direction may barely move along a flat one. Training-fitted normalization can improve conditioning; it also changes the interpretation of penalties.

## A debugging sequence

Check shapes, labels, output range and finite values. Verify gradients numerically on a tiny smooth case. Confirm a linear loss behaves on a dataset with a known answer. Train on a tiny subset long enough to drive training loss down. Failure to overfit that subset suggests insufficient capacity, an implementation issue, regularization or optimization settings that need inspection.

With C equally scored classes, softmax probability is \(\frac1C\) and mean cross entropy is \(\ln C\). For three classes it is about 1.0986. This gives a useful starting scale. It is not a universal expected initial loss when logits are random or class weighting is used.

## Diagnose with paired evidence

Loss becomes NaN: inspect large logits, unstable log calculations, invalid targets and excessive steps. Loss stays flat: inspect gradients, frozen updates, label alignment and initialization. Training improves but validation degrades: examine overfitting, split protocol and distribution differences. Treat these as hypotheses and test one change at a time.

Keep the split, seed, initialization and metric fixed when comparing learning rates. Save a failure example and a curve with axes and units. A prettier curve alone does not establish correctness; controlled changes and sanity checks make the interpretation stronger.

## Practice before opening the answers

1. What is cross entropy for equal logits over four classes?
2. Why can identical initialization keep two hidden units redundant?
3. Under the stated variance approximation, what weight variance preserves linear variance for D=100?
4. Name two plausible causes of flat training loss.

## Check your understanding

Design a debugging order that verifies computation before changing model complexity, and justify a comparison with controlled conditions.

## Read with a purpose

MML 7.1 and 8.6; CV 5.3.6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
