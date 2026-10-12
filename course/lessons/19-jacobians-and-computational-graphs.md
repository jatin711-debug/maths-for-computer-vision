# Lesson 19 - Jacobians and computational graphs

**Module:** 05 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 18; revisit any symbols you cannot yet explain.

**Goal:** Apply the chain rule to vector computations and combine gradients across branching paths.

## A derivative can itself be a map

For y=f(x) with D input coordinates and H outputs, the Jacobian J has shape (H,D). Entry \(J_{ij}\) measures how output i changes when input j changes. Locally, \(\delta_y\approx J\delta_x\). For \(f(x_1,x_2)=(x_1^2,x_1+x_2)\), \(J=\begin{bmatrix}2x_1&0\\1&1\end{bmatrix}\). At \((2,3)\), changing input by \((0.1,0)\) predicts output changes \((0.4,0.1)\).

If z=g(y) has C outputs, its Jacobian with respect to x is \(J_gJ_f\), of shape (C,D). For scalar loss L(y), the column gradient with respect to x is \(J_f^T\nabla_y L\). Forward sensitivity propagates changes through J; reverse differentiation propagates loss sensitivities through its transpose.

## Work a scalar graph

Take x=2,w=3,b=1,target=5. Define \(a=wx+b=7\) and \(L=\frac12(a-\text{target})^2=2\). The backward calculation begins with \(\frac{dL}{da}=a-\text{target}=2\). Local derivatives are \(\frac{da}{dw}=x=2\), \(\frac{da}{dx}=w=3\) and \(\frac{da}{db}=1\). Therefore \(\frac{dL}{dw}=4\), \(\frac{dL}{dx}=6\) and \(\frac{dL}{db}=2\). Every number follows a specific edge in the graph.

## Shared values receive sums from all paths

For \(L=u^2+3u\), u reaches the result along two paths. Their contributions are 2u and 3, so \(\frac{dL}{du}=2u+3\). If \(u=wx\), then \(\frac{dL}{dw}=(2u+3)x\). Keeping only one branch loses part of the derivative. In a batch, a shared weight receives contributions from every sample; sums or averages follow the loss definition.

Backpropagation applies this chain rule efficiently by reusing intermediate values and traversing the graph backward. It need not explicitly store a huge Jacobian for each layer. Matrix-vector products with local derivatives are enough for scalar losses.

## A practical check

Before differentiating, name every intermediate, mark its shape and write which values depend on each parameter. A transpose is determined by these shapes, not by habit. Treat targets as fixed observations unless the model explicitly defines a differentiable target-producing computation.

## Practice before opening the answers

1. Find the Jacobian of \(f(x,y)=(x+y,xy)\).
2. For \(z=(2x+1)^2\), compute dz/dx at x=1.
3. For \(L=u^2+u^3\), calculate dL/du at u=2.
4. If y=Ax and \(\nabla_y L\) has shape (H,1), give \(\nabla_x L\) and its shape.

## Check your understanding

Draw a branching graph, accumulate every path contribution, and use Jacobian dimensions to justify each multiplication.

## Read with a purpose

MML 5.3-5.6; CV 5.3.5. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
