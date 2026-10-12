# Lesson 06 - Norms, dot products, angles and projections

**Module:** 02 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 05; revisit any symbols you cannot yet explain.

**Goal:** Derive length, similarity and orthogonal projection from coordinate calculations.

## Length and similarity

The Euclidean norm is \(\|x\|_2=\sqrt{\sum_i x_i^2}\). It extends the right-triangle length formula. For \(x=(3,4)\), the norm is 5; dividing by 5 produces a unit vector \((0.6,0.8)\). The L1 norm is \(\sum_i|x_i|\), which is 7 here. A distance between x and y is the norm of \(x-y\), so state which norm you use.

The dot product \(u^Tv=\sum_i u_iv_i\) also equals \(\|u\|_2\|v\|_2\cos\theta\). A positive result indicates an acute angle for nonzero vectors; a negative result indicates an obtuse angle. For \(u=(1,2)\), \(v=(3,-1)\), \(u^Tv=3-2=1\), with lengths \(\sqrt5\) and \(\sqrt{10}\). The cosine is \(\frac1{\sqrt{50}}\), about 0.1414. Dot product alone combines alignment and magnitude; cosine similarity removes magnitude.

## Derive a projection

Approximate x by a multiple \(cu\). Orthogonal projection requires the residual \(x-cu\) to be perpendicular to u. Thus \(u^T(x-cu)=0\), giving \(c=\frac{u^Tx}{u^Tu}\), when u is nonzero.

For \(x=(3,4)\), \(u=(1,1)\), \(c=\frac72\). The projection is \((3.5,3.5)\), and the residual is \((-0.5,0.5)\). Their dot product with u is zero. The original vector equals its projection plus its residual. This is the geometric idea behind least squares in Module 3.

## A feature-matching interpretation

If a feature vector is multiplied by a positive brightness factor, its cosine similarity to another nonzero vector is unchanged, while raw dot products and Euclidean distances can change. This can help when overall intensity is a nuisance. It can also discard useful magnitude information, so choose the representation deliberately.

The zero vector has no direction. Its cosine similarity and the formula that normalizes it are undefined. A software epsilon prevents division errors but does not give zero a mathematical angle. Projection onto a non-unit vector needs the denominator \(u^Tu\); omitting it changes the answer.

## Practice before opening the answers

1. Find the L1 and L2 norms of \((-3,4)\).
2. Compute the cosine similarity of \((1,0)\) and \((1,1)\).
3. Project \((2,3)\) onto \(u=(1,0)\), and give the residual.
4. Can the zero vector be normalized to a unit vector? Explain.

## Check your understanding

Derive the projection coefficient from residual orthogonality, then explain when cosine similarity loses information a classifier might need.

## Read with a purpose

MML 3.1-3.5 and 3.8; CS205A 0.2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
