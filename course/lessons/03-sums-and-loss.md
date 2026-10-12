# Lesson 03 - Sums, averages and error

**Time:** 60 minutes plus 30 minutes of practice.
**Goal:** read summation notation and turn prediction mistakes into a scalar objective.

## Read a sum and a mean

For \(x=[20,60,100,140]\), the sum is 320 and the mean is 80. The notation sum from i=1 to n of x_i means add each entry once. The mean is that sum divided by n. Keep the indexing convention clear: a book may number \(x_1,\ldots,x_n\) while Python numbers entries 0 through n-1.

Write the compact notation as an explicit instruction to add every observation once:

\[
S=\sum_{i=1}^{n}x_i,\qquad \bar x=\frac1n\sum_{i=1}^{n}x_i.
\]

The index names which observation contributes; it is not an extra factor multiplying the value.

## Work a loss calculation

Suppose predictions are \(p=[2,4]\) and targets are \(y=[1,7]\). Define residuals as \(p-y=[1,-3]\). Their mean is -1, which hides part of the error because positive and negative residuals cancel. Squaring gives \([1,9]\). The mean squared error is \(\operatorname{MSE}=\frac{1+9}{2}=5\). The root mean squared error is \(\sqrt5\), expressed in the same units as the original targets.

For predictions \(\hat y_i\) and fixed targets \(y_i\), the general rule is:

\[
\operatorname{MSE}=\frac1n\sum_{i=1}^{n}(\hat y_i-y_i)^2,\qquad \operatorname{RMSE}=\sqrt{\operatorname{MSE}}.
\]

Subtract within each observation, square that residual, add the squared residuals, then divide by the number of observations.

## What the loss measures

The **loss** is the number we try to reduce during fitting. Squared error penalizes a residual of magnitude 3 nine times as much as a residual of magnitude 1. It is sensitive to unusually large errors. It is one modeling choice; it is not the right loss for every task.

## Fit is different from generalization

MSE is zero precisely when every prediction equals its target. A low training MSE does not prove that the model predicts new data well. We will learn to separate training, validation and test data.

## Keep the units and the averaging rule

Use a toy localization model that predicts horizontal positions in pixels. Targets \([10,20]\) and predictions \([12,18]\) have residuals \([2,-2]\) pixels. Their squared errors are \([4,4]\) square pixels, MSE is 4 square pixels, and RMSE is 2 pixels. RMSE is easier to compare with an ordinary position error because its units match the target.

If the same positions are represented in tens of pixels, the residuals become \([0.2,-0.2]\) and the MSE becomes 0.04. The physical prediction has not improved; you changed the unit. Report the scale before comparing two loss values.

**Try before continuing:** duplicate both examples to form a four-example dataset. The squared-error sum doubles from 8 to 16, while its mean remains 4. This is why a sum and a mean behave differently when you change dataset or batch size. For several output coordinates, also specify whether the mean averages over examples, coordinates, or both.

## Practice and explanation

**Practice:** (1) Find MSE for \(p=[0,2,4]\), \(y=[1,2,3]\). (2) Give nonzero residuals whose mean is zero. (3) Explain how the sum of squared errors differs from its mean when the number of observations changes. (4) Compare MSE before and after multiplying both predictions and targets by 10. (5) Why might a single large residual dominate this loss?

**Exit explanation:** Explain why error cancellation motivates a loss such as squared error, and distinguish a loss from a final evaluation metric.

## Read with a purpose

MML 8.2.2 for a loss used in training; CS205A 1.2 for how numerical error is measured. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
