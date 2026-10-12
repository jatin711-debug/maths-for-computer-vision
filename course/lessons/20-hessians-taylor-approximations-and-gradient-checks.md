# Lesson 20 - Hessians, Taylor approximations and gradient checks

**Module:** 05 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 19; revisit any symbols you cannot yet explain.

**Goal:** Use curvature and finite differences to inspect analytic gradients.

## The gradient also changes as we move

The Hessian of a scalar function is the matrix of second partial derivatives. For \(f=x^2+3y^2\), \(H=\operatorname{diag}(2,6)\). The gradient changes three times faster along y than along x. For twice continuously differentiable functions, mixed partial derivatives agree, making the Hessian symmetric.

A second-order approximation is \(f(x+\delta)\approx f(x)+\nabla f(x)^T\delta+\frac12\delta^TH(x)\delta\). For a quadratic it is exact. For x² at x=3, delta=0.1, it gives \(9+6\cdot0.1+\frac12\cdot2\cdot0.01=9.61\). Positive definite curvature at a stationary point gives a strict local minimum; indefinite curvature indicates a saddle. A semidefinite Hessian may leave the test inconclusive.

## Check one parameter numerically

A central finite difference for coordinate j is \(\frac{L(\theta+he_j)-L(\theta-he_j)}{2h}\). It approximates the analytic derivative with error of order h² for sufficiently smooth functions. For \(L(w)=w^3\) at w=2, the estimate is \(12+h^2\). At \(h=0.01\), it is 12.0001.

Making h smaller reduces truncation error until floating-point roundoff and subtraction cancellation dominate. There is a useful range of step sizes, not a universal best h. Try a sweep such as 1e-2 to 1e-6 in double precision on small deterministic data. Compare both absolute error and a relative error such as \(\frac{|g-g_{\rm num}|}{\max(10^{-8},|g|+|g_{\rm num}|)}\); tiny derivatives need careful interpretation.

## Match exactly the computation being checked

Disable stochastic dropout or fix its randomness. Use identical data, loss normalization and parameter values for the plus and minus evaluations. Restore each parameter after perturbing it. Avoid ReLU inputs near zero, where a perturbation can cross a nondifferentiable point. Check a few coordinates of every parameter block before checking a whole large network.

Gradient checking is a debugging tool, not a training method: numerical differences require many function evaluations. A passed check supports local derivative correctness for the tested points, not global correctness or good generalization. The calculus notebook demonstrates a small graph and a step-size sweep.

## Practice before opening the answers

1. Find the Hessian of \(x^2+xy+2y^2\).
2. Evaluate the central-difference derivative of \(w^2\) at w=3 symbolically.
3. At a stationary point with Hessian eigenvalues \((2,-1)\), classify the curvature.
4. Give two reasons a correct derivative implementation might fail a numerical check.

## Check your understanding

Perform and interpret a gradient check, then explain why its result depends on smoothness, determinism and step size.

## Read with a purpose

MML 5.7-5.8; CS205A 12.3.2-12.3.3, with CS205A 1.2 for rounding error. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
