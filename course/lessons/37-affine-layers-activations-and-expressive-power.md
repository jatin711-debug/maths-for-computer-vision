# Lesson 37 - Affine layers, activations and expressive power

**Module:** 10 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 02, 07 and 27; revisit any symbols you cannot yet explain.

**Goal:** Write a shaped forward pass and explain why nonlinear activations change what a network can represent.

## Compose computations with declared shapes

For N examples with D features, X has shape (N,D). A two-layer network uses \(Z_1=XW_1+b_1\) with W1=(D,H), \(A_1=\operatorname{ReLU}(Z_1)\), then \(Z_2=A_1W_2+b_2\) with W2=(H,C). Logits Z2 have shape (N,C); softmax turns each row into class probabilities. Biases b1=(H,) and b2=(C,) broadcast across examples.

Without the activation, the output is \(X(W_1W_2)+(b_1W_2+b_2)\). This is still a single affine map, regardless of the number of stacked affine layers. ReLU changes the mapping by selecting different active units for different inputs, giving a piecewise affine function.

## Work one forward pass

Use one row \(x=[1,2]\), \(W_1=\begin{bmatrix}1&-1\\1&1\end{bmatrix}\), \(b_1=[0,0]\). Then \(z_1=[3,1]\), \(a_1=[3,1]\). Choose \(W_2=\begin{bmatrix}1&-1\\2&1\end{bmatrix}\) and \(b_2=[0,0]\). The logits are \([5,-2]\). Subtract the maximum to compute stable softmax from \([0,-7]\), giving the first class high probability. Write each row and multiplication before calling an array library.

If x instead equals \([-2,1]\), its hidden preactivation is \([-1,3]\), so ReLU gives \([0,3]\). A hidden unit is inactive for that example, changing the local linear map. The pattern of active units is part of the expressive mechanism.

## A limitation of a linear decision boundary

The XOR labels on points \((0,0)\),\((0,1)\),\((1,0)\),\((1,1)\) assign different labels to diagonal versus off-diagonal corners. A single affine threshold cannot separate them. One ReLU construction is \(h_1=\operatorname{ReLU}(x_1+x_2)\), \(h_2=\operatorname{ReLU}(x_1+x_2-1)\), with output \(h_1-2h_2\). At these binary inputs it gives 0,1,1,0. This demonstrates a representable pattern, not that any training run will discover the weights.

More capacity does not establish better held-out performance. It changes what functions are possible, while optimization and data determine what is learned. Keep a linear baseline so improvements have a meaningful comparison, and check that the output distribution matches the label semantics.

## Practice before opening the answers

1. For X=\((12,8)\), hidden width 5 and 3 classes, give all weight and activation shapes.
2. Combine two affine maps \(y=Ax+b\) and \(z=By+c\) into one.
3. Apply ReLU to \([-2,0,3]\).
4. Evaluate the XOR construction at \((1,1)\).

## Check your understanding

Annotate a forward pass and prove why removing every nonlinearity collapses stacked affine layers into one.

## Read with a purpose

MML 5.6; CV 5.3.1-5.3.2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
