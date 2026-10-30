# Lesson 29 - Gradient descent and optimality

**Module:** 08 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 13 and 18; revisit any symbols you cannot yet explain.

**Goal:** Derive a learning update and its convergence range for a simple quadratic.

## Turn sensitivity into an update

Gradient descent updates \(\theta_{t+1}=\theta_t-\alpha\nabla L(\theta_t)\), with learning rate \(\alpha>0\). The negative gradient gives local descent, while alpha determines the actual move. Parameters and their gradients have matching shapes. Compute the gradient at the current parameters before changing them.

For \(L(w)=(w-3)^2\), \(\nabla L=2(w-3)\). Starting at w=0 with alpha=0.1 gives \(w_1=0-0.1(-6)=0.6\). Loss decreases from 9 to 5.76. The next gradient is -4.8, giving w=1.08. Successive moves approach the minimizer when the learning rate is suitable.

## Derive when this particular update converges

Let \(e_k=w_k-3\). Then \(e_{k+1}=(1-2\alpha)e_k\). Its magnitude shrinks exactly when \(|1-2\alpha|<1\), which gives \(0<\alpha<1\). Below \(\alpha=0.5\) errors retain their sign; above 0.5 they oscillate while shrinking. Alpha=1 alternates without shrinking, and \(\alpha>1\) diverges for a nonzero starting error. This range belongs to this quadratic, not all losses.

For \(L(\theta)=\frac12\theta^TH\theta\) with symmetric positive definite H, each eigen-direction has error factor \(1-\alpha\lambda_i\). Convergence from arbitrary initial errors requires \(0<\alpha<\frac2{\lambda_{\max}}\). A direction with small curvature can converge slowly while the steep direction limits the step size. This connects optimization to eigenvalues from Module 4.

## Stationary does not mean globally best

At an unconstrained differentiable local minimum, the gradient is zero. Zero gradient alone is not sufficient: maxima and saddles can also be stationary. A convex objective makes any stationary point globally minimizing; strict convexity can give uniqueness. Neural-network objectives are usually nonconvex, so a training run does not establish a global optimum.

## Watch more than one scalar

Record training loss, validation loss, gradient norms and finite parameter values. Stopping because changes are tiny can mean convergence, a very small learning rate, saturation or numerical failure. Check simple synthetic cases with known optima before training a complicated model. The optimization workbench lets you compare step sizes on this exact quadratic.

## Practice before opening the answers

1. Take one step for (w-3)² from w=1 with \(\alpha=0.2\).
2. For that loss, give the error multiplier at \(\alpha=0.75\).
3. For H eigenvalues \([2,10]\), give the convergence range for the half-scaled quadratic.
4. Does \(\nabla L=0\) prove a global minimum for a nonconvex loss?

## Check your understanding

Derive rather than memorize a learning-rate range for a quadratic, and separate a stationary condition from a global guarantee.

## Read with a purpose

MML 7.1; CS205A Chapter 8; CV 5.3.6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
