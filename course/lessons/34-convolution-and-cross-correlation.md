# Lesson 34 - Convolution and cross-correlation

**Module:** 09 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 33; revisit any symbols you cannot yet explain.

**Goal:** Calculate local filter responses and distinguish kernel flipping from weight sharing.

## A local weighted sum

Discrete cross-correlation places a kernel on a patch and sums elementwise products. For row x=\([1,2,4]\) and kernel k=\([1,-1]\), valid cross-correlation outputs \(1\cdot1+2(-1)=-1\), then \(2\cdot1+4(-1)=-2\). The same weights are reused at both positions.

Mathematical convolution flips the kernel before the equivalent sliding dot product. For this example the flipped kernel is \([-1,1]\), producing \([1,2]\) in valid mode. Symmetric kernels give identical correlation and convolution results; asymmetric kernels reveal the difference. Many deep-learning layers named convolution implement unflipped cross-correlation.

## Extend the calculation to a patch

For patch \(\begin{bmatrix}1&2\\3&4\end{bmatrix}\) and kernel \(\begin{bmatrix}1&0\\0&-1\end{bmatrix}\), the response is \(1-4=-3\). A 2D valid operation on a 3x3 image with a 2x2 kernel has four placements and a 2x2 output at stride one. Every response mixes nearby values; each position uses the same kernel.

A smoothing kernel such as an all-ones 3x3 matrix divided by nine computes a local average away from boundaries. A difference kernel can emphasize a change across an edge and suppress a constant region because its coefficients sum to zero. Its sign depends on orientation and the flip convention.

## Linearity and boundaries

With a fixed kernel and zero bias, filtering is linear in the image: \(\operatorname{filter}(aX+bY)=a\operatorname{filter}(X)+b\operatorname{filter}(Y)\). Adding bias makes the map affine. Clipping negative responses to zero afterward makes the overall operation nonlinear. Padding rules such as zero, reflection or wraparound alter boundary responses and must be declared.

Weight sharing reduces parameters and gives a translation-related structure in the interior. It does not make every final classifier automatically translation invariant: boundaries, stride, pooling and a flattened dense head can all affect the behavior.

## Your calculation first

Use the workbench to move a 3x3 kernel over a synthetic 5x5 image. Write one patch and compute its response by hand, then compare. In the Module 09 notebook, verify your loop implementation against a second calculation before treating its output as evidence about learned features.

## Practice before opening the answers

1. Find valid cross-correlation of \([1,3,2]\) with \([1,-1]\).
2. Find valid convolution of the same row and kernel.
3. Find full convolution of \([1,2,3]\) with \([1,1]\).
4. What is the response of a zero-sum kernel on a constant patch?

## Check your understanding

Show the flip convention, compute a response by hand and explain how weight sharing differs from output invariance.

## Read with a purpose

CV 3.2 and 5.4; optional CS231n convolutional-network notes. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
