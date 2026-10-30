# Lesson 31 - Convexity, curvature and constraints

**Module:** 08 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 30; revisit any symbols you cannot yet explain.

**Goal:** Recognize convex guarantees and solve a small equality-constrained problem.

## A convex objective has no hidden lower basin

A function is convex when \(f(tx+(1-t)y)\le tf(x)+(1-t)f(y)\) for \(t\in[0,1]\) on a convex domain. The value along a connecting segment lies below the chord. For a twice differentiable function on an open convex domain, a positive semidefinite Hessian everywhere establishes convexity. Positive definite curvature everywhere is a sufficient condition for strict convexity.

For \(f(x)=x^2\), \(f\left(\frac{x+y}2\right)\le\frac{f(x)+f(y)}2\). For -x² the inequality reverses. A single positive-curvature point does not make an entire objective convex. Least squares is convex; adding a positive squared penalty can give strict convexity. Composing trainable layers and nonlinear activations generally changes this picture.

## Constraints change optimality

To minimize \(x^2+y^2\) subject to \(x+y=1\), the unconstrained optimum \((0,0)\) is infeasible. Form the Lagrangian \(\mathcal L=x^2+y^2+\lambda(x+y-1)\). Its stationary conditions are \(2x+\lambda=0\), \(2y+\lambda=0\) and \(x+y=1\). Thus \(x=y=\frac12\) and \(\lambda=-1\). The objective value is 1/2.

Geometrically, the optimal point is the closest point on the constraint line to the origin. The objective gradient is perpendicular to feasible directions at the optimum. Lagrange multipliers express this alignment under suitable regularity; they do not automatically certify a global minimum for arbitrary nonconvex problems.

## A simple inequality example

Minimize \((w-3)^2\) subject to \(w\le1\). The feasible optimum is w=1, where the ordinary derivative is -4 rather than zero. The boundary prevents the improving positive move. Constrained optima need not have zero unconstrained gradient. Projected gradient descent takes a gradient step and then projects into a declared convex feasible set; for an interval, projection is clipping.

## Interpret constraints in vision

Probability vectors must be nonnegative and sum to one; the softmax of Lesson 27 builds this into the representation. Image-coordinate predictions might need bounds, but naively clipping inside a learned computation changes derivatives and may saturate them. Decide whether the constraint belongs to parameterization, optimization or evaluation. These are different operations with different mathematical consequences.

## Practice before opening the answers

1. Is \(f(x,y)=x^2+2y^2\) convex? Use its Hessian.
2. Minimize \(x^2+y^2\) subject to \(x+y=4\).
3. Minimize \((w-3)^2\) subject to \(0\le w\le2\).
4. Why need not a constrained minimum have an ordinary zero gradient?

## Check your understanding

Solve an equality constraint with both geometry and multipliers, and distinguish local curvature from global convexity.

## Read with a purpose

MML 7.2-7.3; CS205A Chapters 8-9. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
