# Lesson 09 - Exact, inconsistent and underdetermined systems

**Module:** 03 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 08; revisit any symbols you cannot yet explain.

**Goal:** Decide whether a measurement system has zero, one or many solutions.

## A system is a set of simultaneous constraints

The equations \(x+y=3\) and \(x-y=1\) can be written \(Ax=b\) with \(A=\begin{bmatrix}1&1\\1&-1\end{bmatrix}\) and \(b=(3,1)\). Add the equations to obtain \(2x=4\); hence \(x=2\) and \(y=1\). Both constraints must hold at once. Row operations preserve the solution set when applied to both A and b.

An inconsistent system has no exact solution. For \(x+y=3\) and \(2x+2y=7\), doubling the first left-hand side gives the second, but doubling the first right-hand side gives 6 rather than 7. Elimination exposes the impossible equation \(0=1\). Measurement noise often creates such inconsistencies in real fitting problems.

An underdetermined example is \(x+y=3\) by itself. Write \(x=t,\ y=3-t\). There are infinitely many solutions because one free parameter remains. Underdetermined means fewer equations than unknowns; it does not guarantee consistency. Overdetermined means more equations than unknowns and can still be exactly consistent.

## Use spaces to unify these cases

\(Ax=b\) is consistent exactly when b belongs to the column space of A. If \(x_0\) is one solution, every other solution is \(x_0+n\) for n in the null space, because \(A(x_0+n)=b\). A consistent system has a unique solution when its null space is trivial. Full column rank provides that uniqueness; it does not guarantee every b is attainable in an overdetermined system.

## From equations to vision measurements

Fitting a straight line \(y=at+c\) uses rows [t,1] in A and observed y values in b. With two distinct t values, there is a unique interpolating line. With many noisy measurements, exact intersection may disappear. The next lesson replaces exact equality with a principled residual minimization.

Keep the unknown parameter vector separate from observed inputs. A row of A describes how one observation depends on the parameters. Before using a solver, specify A, b, parameter units and the expected output shape. If a system has many solutions, a numerical solver needs a selection rule; one output is not proof of uniqueness.

## Practice before opening the answers

1. Solve \(x+y=5\) and \(x-y=1\).
2. Are \(x+2y=3\) and \(2x+4y=8\) consistent?
3. Describe all solutions of \(x-y=2\).
4. Write the design matrix for fitting \(y=at+c\) at \(t=0,1,2\).

## Check your understanding

Classify one system of each kind and justify it using column space and null space, rather than only counting equations.

## Read with a purpose

MML 2.1-2.3; CS205A Chapter 2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
