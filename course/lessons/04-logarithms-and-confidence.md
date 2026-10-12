# Lesson 04 - Powers, logarithms and confidence

**Time:** 60 minutes plus 30 minutes of practice.
**Goal:** understand the operations used to turn scores into probabilities and probabilities into losses.

## Powers describe multiplication and growth

An exponent tells you how a base is used. For example, \(3^2=3\times3=9\), while \(3^{-1}=1/3\). A zero exponent gives \(3^0=1\). For a positive base, multiplying powers adds their exponents:

\[
a^m a^n=a^{m+n},\qquad a>0.
\]

The constant \(e\approx2.718\) is the base of the natural exponential. You may see the same function written as \(e^x\) or \(\exp(x)\). Its output is always positive, even when its input is negative: \(e^{-x}=1/e^x\). That positivity will help us construct probabilities, but a positive number alone is not a probability: \(e^2\) is greater than one.

## A logarithm asks for the exponent

The natural logarithm answers: “What power of e produces this number?” Because \(e^3\) was produced using exponent three, \(\ln(e^3)=3\). Because \(e^0=1\), \(\ln(1)=0\). Exponentiation and the logarithm undo one another:

\[
\ln(e^x)=x,\qquad e^{\ln(a)}=a\quad(a>0).
\]

In real-valued maths, \(\ln(a)\) requires \(a>0\). The logarithm of zero is undefined; as a positive input approaches zero, its logarithm decreases without bound. Inputs between zero and one have negative logarithms. This sign is the reason we put a minus sign in front of log-probabilities when defining a loss.

Another useful property is \(\ln(ab)=\ln(a)+\ln(b)\), for positive a and b. A product of probabilities becomes a sum of log-probabilities. For example, \(\ln(0.5\times0.5)=2\ln(0.5)\). This property concerns multiplication: it does not allow you to replace the logarithm of a sum with a sum of logarithms.

## Turn a score into a binary probability

Suppose a classifier predicts whether an image contains a cat. Let class 1 mean “cat present” and class 0 mean “cat absent.” Its raw score \(z\in\mathbb R\), often called a logit, can be negative, zero or greater than one. The sigmoid turns that score into the model's probability for class 1:

\[
p=\sigma(z)=\frac{1}{1+e^{-z}},\qquad P(y=0\mid z)=1-p.
\]

The vertical bar reads “given”: \(P(y=0\mid z)\) is the probability of class 0 given the score z (Lesson 21 treats this properly). Read the formula from the inside: negate the score, take the exponential, add one, then take the reciprocal. The exponential is positive, so the denominator exceeds one. Consequently \(0<p<1\) for every finite score. Increasing z increases p; a negative z places p below one half.

At \(z=0\), the exponential is one, so \(p=1/(1+1)=0.5\). At \(z=\ln(3)\), we have \(e^{-z}=1/3\), so \(p=1/(1+1/3)=3/4\). At \(z=-\ln(3)\), the result is \(1/4\). The identity \(\sigma(-z)=1-\sigma(z)\) explains this symmetry.

The inverse relationship gives the score another interpretation: \(z=\ln\bigl(p/(1-p)\bigr)\). The fraction is the odds of class 1, and z is its log-odds. At p equal to three quarters, the odds are three to one. A probability, an odds ratio and a logit are three different quantities; their numerical ranges differ.

## Select the probability of what actually happened

Let the observed label be \(y\in\{0,1\}\). Before calculating a loss, select the probability assigned to that label:

\[
p_y=\begin{cases}p,&y=1,\\1-p,&y=0.\end{cases}
\]

With \(z=\ln(3)\), the prediction is always p equal to 0.75 for class 1. If the image really contains a cat, the true-class probability is 0.75. If it does not, the true-class probability is 0.25. Changing the observed label does not change the prediction; it changes how that prediction is evaluated. Try this with the target control in the live example.

## Turn that probability into a loss

Negative log likelihood measures how surprising the observed outcome was under the prediction:

\[
L=-\ln(p_y)=-\bigl[y\ln(p)+(1-y)\ln(1-p)\bigr].
\]

The expression on the right is binary cross-entropy for one example. When y is one, the second term vanishes. When y is zero, the first term vanishes. In either case, the selected probability is the probability of the observed class.

For the same score \(z=\ln(3)\), a cat image gives \(L=-\ln(0.75)\approx0.288\). A non-cat image gives \(L=-\ln(0.25)\approx1.386\). At score zero, either label gives \(L=\ln(2)\approx0.693\). A confident correct prediction improves that loss; a confident wrong prediction makes it much worse.

Loss is nonnegative because the logarithm of a probability is nonpositive. At true-class probability one the loss is zero, although a sigmoid with a finite input never reaches that endpoint exactly. As the true-class probability approaches zero, the loss grows without bound. Halving the true-class probability adds \(\ln(2)\) to the loss: \(-\ln(1/4)=2\ln(2)\), compared with \(-\ln(1/2)=\ln(2)\).

**Try before continuing:** hold the target at class 1 and move the score from zero to three. Predict the direction of the probability and loss changes before moving it. Now switch the target to class 0 without changing the score. Explain why the loss reverses direction.

## Interpret confidence and compute safely

A sigmoid output is a model probability. To evaluate its confidence, inspect held-out examples: among many predictions close to 0.8, does the predicted event occur approximately 80% of the time? This is a calibration question. A correctly computed sigmoid alone does not establish calibration; we will examine it in Module 7.

Computers also have finite numerical ranges. Directly computing an enormous exponential can overflow, while an extremely small probability can round to zero before its logarithm is taken. A stable expression for the same binary loss is:

\[
L(z,y)=\max(z,0)-yz+\ln\bigl(1+e^{-|z|}\bigr).
\]

Here the exponential's input is nonpositive, so that term cannot overflow. Implementations also use a specialised operation for accurately computing the final logarithm near zero. You do not need to memorise this formula today. Keep the distinction between the mathematical objective and the numerical route used to evaluate it; we will derive stable log-probability calculations later.

## Practice and explanation

**Practice:** (1) Simplify ln(e^3). (2) Find ln(1). (3) Calculate sigmoid(0), sigmoid(ln(3)) and sigmoid(-ln(3)). (4) Compare losses for true-class probabilities 1/2 and 1/4. (5) Explain why a confident wrong prediction should receive a larger classification loss than an uncertain prediction.

**Exit explanation:** Start with one score and explain how it becomes a class-1 probability, a true-class probability and a loss. State which quantity changes when the observed label changes. Describe what held-out evidence you would need before trusting the model's confidence.

## Read with a purpose

CV 5.1.3 and 5.3.4 as a preview of logistic regression and cross-entropy; MML 6.1.2 for probabilities and random variables. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
