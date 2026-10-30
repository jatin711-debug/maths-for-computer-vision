# Lesson 38 - Backpropagation through a two-layer network

**Module:** 10 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 37; revisit any symbols you cannot yet explain.

**Goal:** Derive every weight, bias and input gradient of a small batch network.

## Begin at the scalar objective

Use the previous row-batch network with mean softmax cross entropy. If P=(N,C) are probabilities and Y are one-hot targets, \(G_2=\frac{\partial L}{\partial Z_2}=\frac{P-Y}{N}\). This includes the loss average once. Dividing again later would change the intended gradient scale.

Because \(Z_2=A_1W_2+b_2\), each weight contributes its incoming activation to each affected output. Summing across examples gives \(dW_2=A_1^TG_2\) with shape (H,C). The shared bias gradient is \(db_2=\sum_i(G_2)_{i,:}\) with shape (C,). Backward sensitivity to hidden activations is \(dA_1=G_2W_2^T\), shape (N,H).

## Cross the activation and first layer

For ReLU away from zero, \(dZ_1=dA_1\odot\mathbf1_{Z_1>0}\). Then \(dW_1=X^TdZ_1\), \(db_1=\sum_i(dZ_1)_{i,:}\) and \(dX=dZ_1W_1^T\). These shapes are (D,H), (H,) and (N,D), respectively. The mask is elementwise; the weight gradients are matrix products.

## Work the last-layer gradient numerically

Use hidden preactivation \([2,-1]\), so a1=\([2,0]\). Choose \(W_2=\begin{bmatrix}\ln(3)/2&0\\2&1\end{bmatrix}\) and zero output bias. The logits are [ln(3),0], giving probabilities \([0.75,0.25]\). For true class 0, \(G_2=[-0.25,0.25]\). The outer product gives \(dW_2=\begin{bmatrix}-0.5&0.5\\0&0\end{bmatrix}\), and \(db_2=[-0.25,0.25]\). Backward sensitivity is \(dA_1=[-\ln(3)/8,-0.25]\). The ReLU mask is \([1,0]\), so only the first component passes backward.

## Shared parameters collect all contributions

Every batch row uses the same W and b. Gradients add across rows because the objective combines their losses. A mean loss scales the sum by 1/N. A squared-weight penalty adds its derivative to the corresponding data gradient, with exactly the convention chosen for the objective.

Compute the complete backward pass using the forward-pass parameters before mutating any weight. Updating W2 before computing dA1 would differentiate a different network. Cache only the values needed for the backward formulas, verify analytic gradients on a tiny deterministic batch, and then train.

The Module 10 notebook implements this chain in NumPy. It checks selected coordinates numerically and compares a nonlinear model with a linear baseline on a two-bar image task that no linear boundary can solve, so the need for a hidden activation is visible.

## Practice before opening the answers

1. For hidden row \([1,3]\) and \(G_2=[0.2,-0.2]\), calculate dW2.
2. If \(dA_1=[2,-3]\) and \(Z_1=[-1,4]\), calculate dZ1.
3. For X=\((7,4)\), dZ1=\((7,6)\), give the first-layer weight-gradient shape.
4. Why must parameters stay unchanged until their backward sensitivities are computed?

## Check your understanding

Derive the complete backward pass without looking up formulas and justify every transpose, sum and loss-normalization factor.

## Read with a purpose

MML 5.4-5.6; CV 5.3.5. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
