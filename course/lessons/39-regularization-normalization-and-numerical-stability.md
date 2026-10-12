# Lesson 39 - Regularization, normalization and numerical stability

**Module:** 10 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 38; revisit any symbols you cannot yet explain.

**Goal:** Explain how training aids change a computation and distinguish them from numerical safeguards.

## A penalty changes the objective

If \(L=L_{\rm data}+\frac\lambda2\|W\|_F^2\), the added gradient is \(\lambda W\). Under plain SGD this is the same as shrinking every weight by \(\alpha\lambda W\) each step, called weight decay. Under Adam it is not: the penalty's gradient is rescaled with everything else, so most modern CV training uses AdamW, which applies the decay \(\theta\leftarrow\theta-\alpha\lambda\theta\) separately from the adaptive step. Omitting the factor 1/2 would add \(2\lambda W\) instead. Penalize the declared weight blocks; bias treatment is a separate choice. A penalty can reduce overfitting, but too much can prevent even a tiny subset from being fit.

## Dropout changes the training computation

With keep probability q, inverted dropout uses a random Bernoulli mask m and activation \(a_{\rm drop}=m\odot a/q\) during training. Its conditional expectation equals a. At evaluation, remove the mask and use a directly. With q=0.5, a kept activation doubles and a dropped one becomes zero. Fix or disable this randomness during gradient checking.

The expected activation being unchanged does not mean the expected network output is unchanged through arbitrary nonlinear downstream layers. Dropout is a training procedure requiring empirical validation; it is not a substitute for representative data.

## Normalization declares an averaging axis

Training batch normalization centers and scales activations using statistics over a specified batch axis or set of axes, then applies learned scale and offset. Evaluation commonly uses stored estimates of those statistics. Layer normalization instead computes statistics within each example over designated feature axes, so it has different batch dependence.

For the chosen averaging group, write \(\hat a=\frac{a-\mu}{\sqrt{\operatorname{var}+\epsilon}}\), then \(\text{output}=\gamma\hat a+\beta\). For values \([1,3]\), the mean is 2 and the group variance with divisor 2 is 1. Ignoring a tiny epsilon for this hand calculation, normalized values are \([-1,1]\). With \(\gamma=2\) and \(\beta=0.5\), outputs are \([-1.5,2.5]\). Both the averaging group and the learned affine adjustment belong to the computation.

At minimum, write which dimensions are averaged, where epsilon enters and which statistics are reused. Input standardization fitted once on training data is different from a normalization layer whose operation is part of each forward pass. A tiny or shifted batch can alter batch-statistic behavior.

## Stability preserves the intended formula

For binary logits z, NLL can be evaluated as \(\max(z,0)-yz+\ln(1+e^{-|z|})\). This equals binary cross entropy while avoiding huge \(e^z\) and subtraction of probabilities rounded to one. For multiclass logits, use logsumexp. Do not use arbitrary probability clipping to conceal an unstable calculation when a stable equivalent is available.

Check whether inputs, logits, loss and gradients are finite. Gradient clipping limits an update-related quantity according to a declared rule and changes training dynamics; it is not the same operation as pixel clipping. Compare changes independently so their effect can be understood.

## Practice before opening the answers

1. Differentiate \(\frac\lambda2\|W\|_F^2\).
2. At keep probability 0.25, what happens to a kept activation of 2 under inverted dropout?
3. For logit z=100 and label y=0, approximate stable binary NLL.
4. Why should training and evaluation mode be stated for dropout and batch normalization?

## Check your understanding

Separate objective changes, stochastic training operations and stable equivalent formulas, and specify their behavior during gradient checking.

## Read with a purpose

CV 5.3.3 and 5.3.6; MML 5.6 and 8.6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
