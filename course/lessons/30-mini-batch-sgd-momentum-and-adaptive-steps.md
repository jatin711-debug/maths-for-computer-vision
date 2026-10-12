# Lesson 30 - Mini-batch SGD, momentum and adaptive steps

**Module:** 08 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 29; revisit any symbols you cannot yet explain.

**Goal:** Explain gradient sampling and track the state of momentum and adaptive updates.

## Estimate a large-data gradient

If the training objective is mean loss over N examples, its gradient is the mean of per-example gradients. A uniformly sampled mini-batch estimates this gradient. Under uniform independent sampling, its expected gradient equals the full-data gradient. Sampling classes unequally without correction changes the weighting and possibly the objective.

Smaller batches generally introduce more sampling variation and reduce work per update. Larger batches reduce that variation but require more work and memory. An epoch is one pass through the training examples, while an update is one batch step. Compare schedules using their declared unit: two models with the same epoch count can have different update counts.

## Momentum retains a history

One convention is \(v_{t+1}=\beta v_t+g_t\) and \(\theta_{t+1}=\theta_t-\alpha v_{t+1}\), with v initially zero. For \(\alpha=0.1,\ \beta=0.9\) and first two gradients \(g_1=2,\ g_2=1\), \(v_1=2\) then \(v_2=2.8\). The moves are -0.2 and -0.28. Other implementations use an exponentially averaged gradient with a factor 1-beta; the learning-rate interpretation changes with the convention.

Momentum can accumulate movement in a persistent direction and damp alternating components. It is not a guarantee against divergence: an excessive step or stale momentum can overshoot. Reset optimizer state when restarting an experiment from scratch.

## An adaptive example: Adam

Adam tracks \(m_t=\beta_1m_{t-1}+(1-\beta_1)g_t\) and \(v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2\) elementwise. Starting at zero, bias-correct with \(\hat m_t=\frac{m_t}{1-\beta_1^t}\) and \(\hat v_t=\frac{v_t}{1-\beta_2^t}\). The update is \(\theta_{t+1}=\theta_t-\alpha\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}\). Epsilon stabilizes the denominator; the second moment is not the same as a centered variance.

For the first scalar gradient g=2, corrected moments are 2 and 4. With alpha=0.1 and tiny epsilon, the first move is approximately -0.1. This differs from plain SGD's -0.2. Coordinate-wise scaling changes the geometry of the update.

Compare optimizers using controlled initialization, data order, loss reduction and validation criteria. A lower training loss after a particular number of steps is evidence for that setup, not a universal ranking of optimizers or a guarantee of better generalization.

## Practice before opening the answers

1. With N=100 and batch size 20 without dropping samples, how many updates form an epoch?
2. Under \(v_{t+1}=0.5v_t+g_t\), start v=0 and apply gradients 4 then -2. Give both velocities.
3. Why can oversampling a rare class change the optimized objective?
4. What is Adam’s bias-corrected second moment after its first nonzero scalar gradient g=3?

## Check your understanding

Work two momentum updates by hand, explain mini-batch gradient assumptions and state what optimizer history must be preserved.

## Read with a purpose

MML 7.1; CV 5.3.6; optional CS231n learning notes. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
