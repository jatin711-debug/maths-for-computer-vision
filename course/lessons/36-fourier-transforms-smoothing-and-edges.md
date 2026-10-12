# Lesson 36 - Fourier transforms, smoothing and edges

**Module:** 09 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 35; revisit any symbols you cannot yet explain.

**Goal:** Interpret frequency components and connect local filtering with spectral behavior.

## Represent a signal with oscillatory components

The discrete Fourier transform of N values is \(X_k=\sum_{n=0}^{N-1}x_ne^{-2\pi i kn/N}\). The imaginary unit i satisfies \(i^2=-1\), and \(e^{i\theta}=\cos\theta+i\sin\theta\). Each component measures alignment with a periodic pattern. The inverse transform divides by N under this normalization.

For x=\([1,1,1,1]\), only \(X_0=4\) is nonzero: the constant or DC component. For x=\([1,-1,1,-1]\), \(X_2=4\) and the others vanish. This second row alternates at the highest distinct frequency of the four-point grid. For a real signal, Fourier values have conjugate symmetry, so their complex parts describe phase without making the stored image complex.

## Magnitude and phase have different jobs

Magnitude measures component strength and phase describes alignment. Shifting a periodic signal changes phase while preserving magnitude. Two images with similar spectra can arrange their structures differently, so a magnitude plot alone does not reconstruct the spatial image.

In two dimensions, frequency directions identify how intensity oscillates across rows and columns. Fine repeated texture has strong higher-frequency content; smooth variation tends toward lower frequencies. A sharp boundary includes multiple frequencies, so edges are not a single spectral component.

## Filtering has a spectral interpretation

Circular convolution becomes pointwise multiplication of DFTs. To use FFTs for linear full convolution, pad enough to prevent circular wraparound: in 1D, at least \(N+K-1\) entries. Boundary and normalization conventions matter. A finite zero-padded filter operation is not automatically equivalent to unpadded circular convolution.

Smoothing suppresses rapidly changing components. A difference filter suppresses DC because its coefficients sum to zero and responds to changes. Removing high frequencies may reduce noise and aliasing, but it can also blur small objects and important boundaries. Inspect both the spatial result and its spectrum.

## A practical experiment

Use NumPy FFT on constant, alternating and stripe patterns in the vision notebook. Check inverse reconstruction. Compare an average filter and a difference filter on the same row, then explain the lost or enhanced components. A frequency description complements local patch calculations; it does not replace the chosen task metric.

## Practice before opening the answers

1. Find the four-point DFT of \([2,2,2,2]\).
2. What component is nonzero for \([1,-1,1,-1]\)?
3. For lengths N=5 and K=3, what FFT padding length prevents circular wraparound in full linear convolution?
4. Why might smoothing harm recognition of tiny objects?

## Check your understanding

Explain DC, magnitude and phase, and state the padding required before using an FFT for linear convolution.

## Read with a purpose

CV 3.2, 3.4 and 3.5; MML 3.7 for function inner products. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
