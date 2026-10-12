# Lesson 07 - Matrices as maps and composition

**Module:** 02 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 06; revisit any symbols you cannot yet explain.

**Goal:** Interpret matrix columns geometrically and track dimensions through a linear layer.

## A matrix describes where basis directions go

Let \(A=\begin{bmatrix}2&1\\0&1\end{bmatrix}\) and x=\((1,2)\) as a column vector. Multiplication gives \(Ax=(4,2)\). Another way to read this is x₁ times the first column plus x₂ times the second column: \((2,0)\)+2*\((1,1)\). Matrix columns are the images of the standard basis vectors \(e_1=(1,0)\) and \(e_2=(0,1)\).

A linear map satisfies \(A(u+v)=Au+Av\) and \(A(cu)=cAu\). It sends zero to zero. Translation \(x\mapsto x+b\) generally fails that last property, so a neural layer \(Wx+b\) is an affine map. The bias allows a shift after the linear transformation.

## Composition is multiplication in the right order

If x first goes through A, then B, the result is \(B(Ax)=(BA)x\). Let \(A=\operatorname{diag}(2,1)\) and \(B=\begin{bmatrix}0&-1\\1&0\end{bmatrix}\), a 90-degree counterclockwise rotation in Cartesian coordinates. Starting at x=\((1,1)\), \(BAx=(-1,2)\). Reversing gives \(ABx=(-2,1)\). Rotation and unequal scaling do not commute.

For A of shape (H,D) and x of shape (D,1), output Ax has shape (H,1). If B has shape (C,H), BA has shape (C,D). The inner dimensions must match; outer dimensions describe the result. A transpose swaps rows and columns, and \((BA)^T=A^TB^T\).

## Use the batch convention carefully

For row-stored samples X of shape (N,D), use W of shape (D,H) and compute \(Z=XW+b\), with b of shape (H,). Each row is one feature vector and each column of W selects one output feature. This convention is the transpose of applying a mathematical column map to each sample.

NumPy X*W performs elementwise multiplication with broadcasting where possible. X@W performs a matrix product. Broadcasting may produce a legal array whose meaning is wrong; write intended shapes before running code. Matrix multiplication is a weighted mixing of coordinates, not simply multiplying matching entries.

## Practice before opening the answers

1. Apply \(\begin{bmatrix}2&0\\0&3\end{bmatrix}\) to the column vector \((1,-2)\).
2. If X has shape \((16,64)\) and W has shape \((64,10)\), give the output and bias shapes.
3. If A has shape \((3,2)\) and B has shape \((4,3)\), which product is defined and what is its shape?
4. Is \(f(x)=2x+1\) a linear map? Justify with \(f(0)\).

## Check your understanding

Explain a matrix product using its columns, then annotate every shape in a batch affine layer without executing code.

## Read with a purpose

MML 2.2 and 2.6-2.7; CS205A 0.3. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
