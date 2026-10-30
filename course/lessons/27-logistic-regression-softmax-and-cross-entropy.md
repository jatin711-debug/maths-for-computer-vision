# Lesson 27 - Logistic regression, softmax and cross entropy

**Module:** 07 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 26; revisit any symbols you cannot yet explain.

**Goal:** Compute stable class probabilities and derive the gradient of a softmax classifier.

## Linear scores become normalized probabilities

Binary logistic regression uses \(z=w^Tx+b\) and \(p=\frac1{1+e^{-z}}\). For multiple mutually exclusive classes, scores z_c become \(p_c=\frac{e^{z_c}}{\sum_j e^{z_j}}\). Every p_c is positive and the probabilities sum to one. Softmax is a model for one selected class per example; independent multilabel outcomes usually need separate sigmoid outputs instead.

Adding the same constant a to every score leaves probabilities unchanged because \(\exp(a)\) cancels between numerator and denominator. Use this to avoid overflow: subtract \(m=\max_c z_c\) before exponentiating. For scores \([1000,1001]\), compute from \([-1,0]\), obtaining probabilities about \([0.2689,0.7311]\). Direct \(\exp(1001)\) would overflow ordinary floating-point arithmetic.

## Compute the loss from scores

For true class t, cross entropy is \(-\ln p_t=\operatorname{logsumexp}(z)-z_t\). A stable logsumexp is \(m+\ln\sum_j e^{z_j-m}\). For [0,ln(3)] and true class 1 under zero-based indexing, probabilities are \([0.25,0.75]\) and loss is \(-\ln(0.75)\approx0.2877\). This logit-based form avoids taking a log of a probability that has rounded to zero.

## Derive a useful gradient

Differentiate \(L=\ln\sum_j e^{z_j}-z_t\) with respect to z_c. The result is \(p_c-\mathbf1_{c=t}\). With one-hot target vector y, \(\nabla_z L=p-y\). For row batches \(Z=XW+b\) and mean loss over N samples, \(G=\frac{P-Y}{N}\), \(dW=X^TG\) and \(db=\sum_{i=1}^N G_{i,:}\). The gradient has W's shape and each class bias accumulates across all examples.

One-hot vectors here identify class membership, not a class ordering. Cross entropy assumes a target distribution; soft labels can also be used when justified. Softmax confidence alone does not establish calibration or reliability on unfamiliar inputs.

## Train a transparent baseline

The Module 07 notebook trains a small linear classifier using these exact formulas, with training-only scaling and a held-out validation split. This is a useful benchmark before adding nonlinear layers. Inspect class errors and a confusion matrix; accuracy alone can conceal failures on a rare class.

## Practice before opening the answers

1. Compute softmax([0,ln 2]).
2. For those scores and true class 0, find cross entropy.
3. Write the score gradient for probabilities \([0.2,0.7,0.1]\) with true class 1.
4. For X=\((8,4)\), W=\((4,3)\), give dW and db shapes.

## Check your understanding

Implement stable softmax and explain every term and shape in its mean-loss gradient.

## Read with a purpose

MML 8.2-8.4; CV 5.1.3 and 5.3.4. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
