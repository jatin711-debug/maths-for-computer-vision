# Lesson 40 - Autograd compared with your own gradients

**Module:** 10 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 39; revisit any symbols you cannot yet explain.

**Goal:** Use an automatic-differentiation framework as a comparison for a derived computation.

## Automatic differentiation applies the same chain rule

An autograd system records a graph of supported operations and propagates derivatives through their local rules. Reverse mode is efficient for scalar losses with many parameters. It evaluates derivatives of the executed numerical computation; it does not choose a sensible objective, detect leakage or validate the interpretation of the data.

For \(z=wx+b\) and \(L=\frac12(z-y)^2\), use x=2,w=3,b=1,y=5. Your hand gradients are \(\frac{dL}{dw}=4\) and \(\frac{dL}{db}=2\). Recreate the exact expression in a framework with floating parameters requiring gradients, call backward on the scalar loss and compare. Use its documented gradient-reset behavior before another training step, because many frameworks accumulate parameter gradients.

## A comparison worksheet

Start with a scalar graph, then a batch affine layer, then the two-layer network. Match dtype, shapes, activation convention, loss reduction and regularization. Compare forward values before gradients. A mismatch in mean-versus-sum reduction can scale every gradient while leaving the underlying chain rule correct.

In PyTorch, tensor parameters can request gradient tracking, a scalar loss can call backward(), and leaf parameters expose .grad. The linked official tutorial explains these operations. No framework is required to complete the supplied NumPy notebook; the framework comparison is an optional extension using an environment you already maintain.

## Know where a graph can stop

Turning intermediate tensors into detached arrays, extracting Python numbers for arithmetic, or executing an unsupported operation can break the differentiated path. Some in-place changes invalidate values needed for backward evaluation. A thresholded argmax is not a smooth surrogate for cross entropy and should not replace the training loss simply because it produces predicted labels.

Nondifferentiable points still require conventions. Autograd following one convention at a ReLU kink does not make a classical derivative exist there. Compare away from such points, using deterministic calculations.

## Your evidence packet

Keep a hand derivation, a finite-difference check and, if available, a framework comparison for the same small example. Agreement across these independent views is stronger evidence than a loss curve alone. Finish by writing a shaped forward and backward pass for the next CNN lesson. A framework saves bookkeeping; your maths explains what that bookkeeping is doing.

## Practice before opening the answers

1. For \(L=\frac12(wx+b-y)^2\) with x=3,w=2,b=0,y=4, find dL/dw and dL/db.
2. Why can calling backward twice without resetting gradients change the values you inspect?
3. What should be compared before comparing gradients?
4. Why is argmax classification accuracy usually unsuitable as the differentiable training objective?

## Check your understanding

Produce a matched hand, numerical and optional framework derivative comparison, and explain why autograd does not guarantee a correct learning problem.

## Read with a purpose

MML 5.6; CV 5.3.5; optional PyTorch autograd tutorial. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
