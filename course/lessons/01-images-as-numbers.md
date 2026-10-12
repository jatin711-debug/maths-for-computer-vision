# Lesson 01 - An image is a collection of numbers

**Time:** 45-60 minutes, followed by 30 minutes of practice.
**Prerequisites:** addition, multiplication and a willingness to inspect small arrays.
**Goal:** explain scalars, vectors and matrices using an image; calculate a simple image transformation.

## 1. Start with a tiny image

Imagine a grayscale image with only four pixels:

\[
I=\begin{bmatrix}20&60\\100&140\end{bmatrix}.
\]

For this toy 8-bit representation, 0 means black and 255 means white. Larger values appear lighter. This is a model of stored pixel values, not a claim that every file stores physically linear light intensity.

The matrix has two rows and two columns: its shape is 2 by 2. A single pixel value such as 60 is a **scalar**. The ordered list \([20,60,100,140]\) is a **vector** made by reading the rows in order. The rectangular arrangement is a **matrix**. Flattening changes the representation, not the four values; if we forget the shape and ordering, we lose knowledge of which pixels were neighbors.

In mathematical notation, \(I_{r,c}\) means the entry at row r, column c. Here and in the notebook, indexing starts at zero: \(I_{0,1}=60\). Many maths books start at one; always check the convention.

## 2. Scaling and shifting are different operations

Consider a transformation that halves each value and then adds 10:

\[
J=0.5I+10=\begin{bmatrix}20&40\\60&80\end{bmatrix}.
\]

Here '+10' means add 10 to every entry. More explicitly it is 0.5I plus 10 times an all-ones matrix of the same shape. The top-right pixel changes from 60 to \(0.5\cdot60+10=40\). Scaling changes differences between values: a difference of 40 becomes 20. Adding an offset changes all values equally, so differences stay the same.

This operation is **affine**: scale plus offset. With offset zero it is linear. We will prove the distinction later; today the useful distinction is operational.

## 3. A mean is a first image summary

The original mean is \(\frac{20+60+100+140}{4}=80\). The transformed mean is \(\frac{20+40+60+80}{4}=50\). We can predict the result without adding again: 0.5 times 80 plus 10 equals 50. This identity holds for ordinary scaling and offset before clipping or rounding.

A mean compresses four numbers into one. It cannot tell us where bright pixels occur. Images \(\begin{bmatrix}0&255\\0&255\end{bmatrix}\) and \(\begin{bmatrix}0&0\\255&255\end{bmatrix}\) have the same mean, even though one has a vertical edge and the other a horizontal edge. Recognition requires information about arrangement.

## 4. Range limits and types matter

If a transformation produces -5 or 270, those values lie outside the chosen display range. Clipping replaces values below 0 by 0 and above 255 by 255. It destroys information: 260 and 300 both become 255. Work in floating-point arrays for calculations; clip deliberately when producing a display image. Arithmetic on unsigned 8-bit arrays can wrap around rather than implement your mathematical intention.

For normalized stored values, use \(I/255\). The result lies in \([0,1]\). Dividing by 255 rescales stored values; it does not by itself correct a camera response or gamma encoding.

## 5. Blending two images is a weighted sum

Let \(A=\begin{bmatrix}0&255\\0&255\end{bmatrix}\) and \(B=\begin{bmatrix}0&0\\255&255\end{bmatrix}\). At weight \(a=0.5\), \(C=aA+(1-a)B=\begin{bmatrix}0&127.5\\127.5&255\end{bmatrix}\). We combine corresponding entries, so the images must have matching shapes and intended alignment. Because \(0\le a\le1\), every result lies between the two contributing values. Floating-point values such as 127.5 are valid during computation.

This weighted-sum idea appears again in feature combination and neural-network layers. Those later layers can use many weights, negative weights and learned biases; they are not limited to blending two images.

## 6. Practice before looking at solutions

1. State the shape of I and the value at \(I_{1,0}\).
2. Compute \(K=2I-20\) entry by entry. Mark values outside \([0,255]\).
3. Find the mean of K before clipping, and after clipping. Explain the difference.
4. Flatten I in row order. Describe what additional information is needed to reconstruct the matrix.
5. Compute \(0.25A+0.75B\) for the A and B above.
6. Give two different 2x2 images with the same mean.
7. Explain why a batch of 32 RGB images, each 64x64, needs four axes in the common (batch,height,width,channels) convention. Name the shape.

**Exit explanation:** In your own words, explain why a matrix is a useful image representation and why image recognition cannot rely on the mean alone.

**Reading after practice:** CS205A 0.3.2, then MML Chapter 1 for motivation. Detailed matrix multiplication comes in Module 2.
