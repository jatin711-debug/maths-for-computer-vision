# Lesson 05 - Vectors as positions, displacements and features

**Module:** 02 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 04; revisit any symbols you cannot yet explain.

**Goal:** Separate a geometric position from a feature vector, and calculate vector operations with units in mind.

## A list with a meaning

A vector is an ordered collection of coordinates. In a chosen coordinate system, \(p=(2,3)\) can locate a point. The displacement from p to \(q=(5,1)\) is \(q-p=(3,-2)\): move three units right and two down. A displacement tells us how to move, while a position depends on where we chose the origin. Image row coordinates usually increase downward, so always write your convention.

A feature vector instead might contain [mean brightness, edge count]. Its entries are measurements, not necessarily spatial coordinates. Flattening a 2x2 image \(\begin{bmatrix}20&60\\100&140\end{bmatrix}\) in row order gives \(x=[20,60,100,140]\). The order is part of the representation: changing it changes the meaning of each model weight.

## Work a vector calculation

For \(u=(1,2)\) and \(v=(3,-1)\), addition gives \((4,1)\), and \(2u-v=(-1,5)\). Scaling every coordinate by the same number gives scalar multiplication. A linear combination \(au+bv\) is formed from scaling and addition. With \(a=2,\ b=1\), it is \((5,3)\). Each result has the same coordinate dimension as its inputs.

Write vectors as columns for mathematical maps: x has shape (D,1), and \(Ax\) has shape (H,1). In NumPy, a one-dimensional array of shape (D,) is neither a row nor a column matrix. x.reshape(D,1) makes the column convention explicit. Later notebooks use batches with samples in rows; both conventions work when declared consistently.

## Why the representation matters

For features [brightness, width], adding raw entries together is meaningless unless a model gives their units and scales a sensible interpretation. A Euclidean distance can be dominated by the larger numerical scale. Fit any normalization statistics on training data, then reuse them for new inputs. A change of representation changes the geometry seen by the classifier.

Two images may have identical means while their flattened vectors differ. Reducing an image to its mean loses arrangement information; a feature is a chosen summary, not the original object.

## Practice before opening the answers

1. Find the displacement from \((1,4)\) to \((4,2)\).
2. For \(u=(2,-1)\), \(v=(1,3)\), calculate \(3u-2v\).
3. Flatten \(\begin{bmatrix}1&2\\3&4\end{bmatrix}\) in row order and state its vector dimension.
4. Why might raw distance between [brightness, width] be misleading?

## Check your understanding

Explain what every coordinate of a toy image feature means. Give a position, a displacement, and a feature vector without confusing their roles.

## Read with a purpose

MML 2.4 and 3.1; CS205A 0.2. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
