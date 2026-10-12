# Lesson 17 - Derivatives and local linearity

**Module:** 05 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 16; revisit any symbols you cannot yet explain.

**Goal:** Derive a derivative from a limit and use it as a local sensitivity.

## From a finite change to an instantaneous rate

For \(f(x)=x^2\), increasing x to x+h changes the output by \(2xh+h^2\). Dividing by h gives 2x+h for nonzero h. As h approaches zero, this difference quotient approaches 2x. The derivative \(f'(x)=2x\) is the limiting rate, not simply a remembered exponent rule.

At x=3, \(f(3)=9\) and \(f'(3)=6\). A small change delta gives the approximation \(f(3+\delta)\approx9+6\delta\). At \(\delta=0.1\) the prediction is 9.6, while the exact value is 9.61. The error is \(\delta^2=0.01\). A derivative is local: using the same line for a large change can be inaccurate.

## Build a small derivative toolkit

Constants have derivative zero; \(ax+b\) has derivative a. The power rule gives \(\frac{d}{dx}x^n=nx^{n-1}\) where the expression is differentiable. The derivative of \(\exp(x)\) is \(\exp(x)\); that of \(\ln(x)\) is \(\frac1x\) for \(x>0\). A sum differentiates term by term. For a product, \((fg)'=f'g+fg'\). For a composition, \((f(g(x)))'=f'(g(x))g'(x)\).

For \(L(w)=(2w-1)^2\), first name the inner quantity \(u=2w-1\). The derivative is \(2u\cdot2=4(2w-1)\). At w=0, it is -4: a small positive change in w initially reduces the loss. The sign indicates local direction and its magnitude indicates sensitivity in the chosen units.

## What about kinks?

\(\operatorname{ReLU}(x)=\max(0,x)\) has derivative 0 for \(x<0\) and 1 for \(x>0\). At zero its two one-sided slopes disagree, so an ordinary derivative does not exist. Training code chooses a convention, often zero, for that point. A gradient check that crosses such a kink may fail even when the implementation follows its declared convention.

Gradients tell us local sensitivity, not the answer to a whole optimization problem. A zero derivative can occur at a minimum, maximum or another stationary point. Later curvature and optimization lessons will distinguish these cases. Keep units in mind: a derivative measures output units per input unit.

## Practice before opening the answers

1. Derive the difference quotient for \(f(x)=x^2\) at a general x.
2. Find the derivative of \(3x^2+2x-5\) at x=2.
3. Use a first-order approximation for \((4.01)^2\) around x=4.
4. Differentiate \((3x+1)^2\) and evaluate at x=0.

## Check your understanding

Explain a derivative using both a limit and a tangent approximation, then state when that approximation can fail.

## Read with a purpose

MML 5.1; CS205A 0.4.1. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
