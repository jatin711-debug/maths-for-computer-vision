# Lesson 08 - Independence, bases, rank and null spaces

**Module:** 02 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 07; revisit any symbols you cannot yet explain.

**Goal:** Connect independent directions and rank to information preserved or discarded.

## How many distinct directions do we have?

Vectors are linearly independent if the only coefficients giving a zero linear combination are all zero. The vectors \((1,0)\) and \((0,1)\) are independent. The vectors \((1,2)\) and \((2,4)\) are dependent because \(2(1,2)-(2,4)=(0,0)\). Two entries do not automatically give two independent directions.

The span of some vectors is every linear combination of them. A basis is an independent set spanning the space of interest. In the standard basis, \((3,4)=3e_1+4e_2\). In the basis \(u=(1,1)\), \(v=(1,-1)\), the same vector is \(3.5u-0.5v\). Coordinates depend on the chosen basis, while the represented vector stays the same.

## Rank tells us how much a map can express

For \(B=\begin{bmatrix}1&1\\2&2\end{bmatrix}\), both columns lie on the same line, so its rank is 1. It maps \(x=(a,b)\) to \((a+b,2a+2b)\). The outputs \((2,4)\) and \((3,6)\) are possible, but \((2,3)\) is not. The column space is the set of attainable outputs.

The null space contains inputs sent to zero. Here \(B(1,-1)=(0,0)\), and every multiple of \((1,-1)\) is also invisible to B. Inputs \((1,0)\) and \((0,1)\) both map to \((1,2)\). More generally, \(Bx=B(x+n)\) whenever n is in the null space. Thus a nontrivial null space means distinct inputs cannot always be recovered from outputs.

For a map with D input coordinates, \(\operatorname{rank}(A)+\dim\ker(A)=D\). This is rank-nullity (the equation card above writes the same count as d). A square matrix has an inverse exactly when it has full rank. A rectangular dimension reduction from D to \(H<D\) must have a null space, although it may retain all information useful for a particular task.

## A vision consequence

Summing all image pixels is a rank-1 linear map from a high-dimensional image vector to one number. It loses all changes that sum to zero. Features can intentionally remove nuisance variation, but a low-dimensional feature cannot preserve every possible image distinction. Rank describes linear information, not recognition accuracy by itself.

## Practice before opening the answers

1. Are \((1,2)\) and \((3,6)\) independent? Give a relation.
2. Find the rank and a null vector of \(\begin{bmatrix}1&1\\2&2\end{bmatrix}\).
3. A linear map has 5 inputs and rank 3. What is its null-space dimension?
4. Why can a 2x4 map never have an inverse recovering every four-coordinate input?

## Check your understanding

Construct two different inputs with the same output under a rank-deficient map. Explain precisely what prevents recovery.

## Read with a purpose

MML 2.4-2.6; CS205A 0.2-0.3. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
