# Lesson 53 - Matrix calculus for layers and losses

**Module:** 14 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 18, 19 and 38; revisit the column gradient, Jacobian shapes and the backward pass of the two-layer network. The finite-difference checks at the end come from Lessons 20 and 40.

**Goal:** Differentiate scalar losses with respect to vectors and matrices, keeping track of shapes with the chain rule and trace identities.

## A gradient has the shape of its variable

For a scalar function f of a vector \(x\in\mathbb R^n\), the gradient \(\nabla f\) collects the n partial derivatives in a vector shaped like x (Lesson 18). For a vector-valued map \(g:\mathbb R^n\to\mathbb R^m\), the Jacobian is m × n, one row per output (Lesson 19). A scalar function therefore has a 1 × n Jacobian, a row, and its gradient is that row transposed. The two layouts hold the same numbers; mixing them is the commonest source of stray transposes.

This lesson uses one convention throughout: the derivative of a scalar loss with respect to a vector or a matrix has the shape of that variable. For a 512 × 10 weight matrix W, \(\partial L/\partial W\) is 512 × 10, and its entry (i, j) is \(\partial L/\partial W_{ij}\).

The tool that keeps this tidy is the differential, the first-order change in L. For a vector, \(dL=\nabla f^T dx\). For a matrix, \(dL=\sum_{i,j}(\partial L/\partial W)_{ij}\,dW_{ij}\), and a sum of products of matching entries is a trace:

\[
\operatorname{tr}(M^TB)=\sum_{i,j}M_{ij}B_{ij}.
\]

So the recipe is: write dL in terms of dW, rearrange it into the form \(\operatorname{tr}(M^T dW)\), and read off \(\partial L/\partial W=M\). The rearranging uses \(\operatorname{tr}(M^T)=\operatorname{tr}(M)\) and the cyclic rule \(\operatorname{tr}(ABC)=\operatorname{tr}(CAB)=\operatorname{tr}(BCA)\) whenever the products are defined. The simplest case is \(f(W)=\operatorname{tr}(A^TW)=\sum_{i,j}A_{ij}W_{ij}\): its differential is \(\operatorname{tr}(A^T dW)\), so \(\partial f/\partial W=A\).

## Three vector identities

**Linear.** For \(f=a^Tx\), \(df=a^T dx\), so \(\nabla f=a\).

**Quadratic form.** For \(f=x^TAx\) with a square A, the product rule gives \(df=dx^TAx+x^TA\,dx\). The first term is a number, so it equals its own transpose \(x^TA^T dx\). Then \(df=x^T(A+A^T)\,dx\) and

\[
\nabla_x\left(x^TAx\right)=(A+A^T)\,x.
\]

The familiar 2Ax is correct only when A is symmetric. Take \(A=\begin{bmatrix}1&2\\0&3\end{bmatrix}\) and x = (1, 1). Then Ax = (3, 3) and \(A^Tx=(1,5)\), so the gradient is (4, 8), while 2Ax = (6, 6). Writing \(f=x_1^2+2x_1x_2+3x_2^2\) confirms it: \(\partial f/\partial x_1=2x_1+2x_2=4\) and \(\partial f/\partial x_2=2x_1+6x_2=8\).

**Least squares.** For \(f=\|Ax-b\|^2=r^Tr\) with \(r=Ax-b\), \(df=2r^T dr=2r^TA\,dx\), so \(\nabla f=2A^T(Ax-b)\). This is Lesson 18's result without the factor ½. Check the shapes: for an m × n matrix A, r has m entries and \(A^Tr\) has n, like x.

## The linear layer, derived once

Use the row-batch convention of Lesson 38: inputs X are N × D, weights W are D × C, the bias b has C entries, and \(Y=XW+\mathbf 1b^T\) is N × C, where \(\mathbf 1\) is the vector of N ones that copies b into every row. The rest of the network only has to hand this layer the upstream gradient \(G=\partial L/\partial Y\), an N × C matrix. Then

\[
dL=\operatorname{tr}(G^T dY),\qquad dY=dX\,W+X\,dW+\mathbf 1\,db^T.
\]

Take the three terms one at a time:

1. \(\operatorname{tr}(G^TX\,dW)=\operatorname{tr}\big((X^TG)^T dW\big)\), so \(\partial L/\partial W=X^TG\), which is D × C like W.
2. \(\operatorname{tr}(G^T dX\,W)=\operatorname{tr}(WG^T dX)=\operatorname{tr}\big((GW^T)^T dX\big)\), so \(\partial L/\partial X=GW^T\), which is N × D like X.
3. \(\operatorname{tr}(G^T\mathbf 1\,db^T)=db^T(G^T\mathbf 1)\), so \(\partial L/\partial b=G^T\mathbf 1\): the column sums of G, with C entries like b.

Shapes alone nearly force these answers. The only way to combine X (N × D) and G (N × C) into a D × C matrix is \(X^TG\). The bias is shared by every row, so its gradient sums over the rows, the shared-parameter rule of Lesson 19.

With \(X=\begin{bmatrix}1&0&2\\0&1&1\end{bmatrix}\), \(W=\begin{bmatrix}1&0\\0&1\\1&-1\end{bmatrix}\) and \(G=\begin{bmatrix}1&-1\\0&2\end{bmatrix}\): \(X^TG=\begin{bmatrix}1&-1\\0&2\\2&0\end{bmatrix}\), \(GW^T=\begin{bmatrix}1&-1&2\\0&2&-2\end{bmatrix}\) and the column sums of G are (1, 1). Each entry has a meaning: \((X^TG)_{31}=2\cdot1+1\cdot0\) adds, over the batch, input feature 3 times the gradient arriving at output 1.

Softmax cross-entropy fits the same pattern. For logits z and a one-hot target y, \(\partial L/\partial z=p-y\) (Lesson 27). Stacking the rows of a batch and averaging gives \(G=(P-Y)/N\), which flows into \(X^TG\) for the weights below.

## Check every derivation numerically

A derivation can have the right shape and still be wrong: for a square A, 2Ax and (A + Aᵀ)x have the same shape. Finite differences (Lessons 20 and 40) catch this. Perturb one entry \(\theta_k\) by ±h and compare

\[
\hat g_k=\frac{f(\theta+he_k)-f(\theta-he_k)}{2h}
\]

with the analytic entry \(g_k\), using the relative error \(|g_k-\hat g_k|/\max(10^{-8},|g_k|+|\hat g_k|)\). For the example above with \(h=10^{-5}\), the central differences are 4.00000000003 and 8.00000000001: they agree with (4, 8) to about ten digits and disagree with 2Ax = (6, 6) in the first.

The step h trades two errors. The truncation error of the central difference is about \(h^2|f'''|/6\), which shrinks with h; the rounding error is about \(\epsilon_{\text{mach}}|f|/h\) with \(\epsilon_{\text{mach}}\approx2.2\times10^{-16}\) in double precision, which grows as h shrinks. Their sum is U-shaped in h, with its minimum near \(\epsilon_{\text{mach}}^{1/3}\approx6\times10^{-6}\). That is why steps around \(10^{-5}\) work well, why a correct gradient typically shows relative errors near \(10^{-10}\), and why a wrong formula shows errors of \(10^{-2}\) or more at every h. A forward difference \((f(\theta+he_k)-f(\theta))/h\) has truncation error about \(h|f''|/2\), so its best h is near \(\sqrt{\epsilon_{\text{mach}}}\approx10^{-8}\) and its best accuracy is only about \(10^{-8}\). For a quadratic, \(f'''=0\): the central difference has no truncation error at all, and only rounding remains.

## Practice before opening the answers

1. Find \(\nabla f\) for \(f(x)=x^TAx\) with \(A=\begin{bmatrix}1&4\\0&2\end{bmatrix}\) at x = (1, 2). Compare it with 2Ax.
2. Find the gradient of \(\|Ax-b\|^2\) for \(A=\begin{bmatrix}1&0\\0&1\\1&1\end{bmatrix}\), b = (1, 2, 0) at x = (1, 1).
3. A linear layer \(Y=XW+\mathbf 1b^T\) has \(X=\begin{bmatrix}1&2\\3&0\\0&1\end{bmatrix}\), \(W=\begin{bmatrix}2&0\\1&1\end{bmatrix}\) and upstream gradient \(G=\begin{bmatrix}1&0\\0&1\\1&-1\end{bmatrix}\). Compute \(\partial L/\partial W\), \(\partial L/\partial b\) and \(\partial L/\partial X\), and check each shape.
4. For f in Exercise 1, compute the central and the forward difference for \(\partial f/\partial x_1\) with h = 0.1. Why is the central difference exact here?

## Check your understanding

Derive \(\partial L/\partial W\), \(\partial L/\partial X\) and \(\partial L/\partial b\) for a linear layer from \(dL=\operatorname{tr}(G^T dY)\), justify every transpose by its shape, and design a finite-difference check with a sensible step size.

## Read with a purpose

MML 5.3-5.6; CV 5.3.5. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
