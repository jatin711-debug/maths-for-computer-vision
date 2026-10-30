# Lesson 33 - Sampling, aliasing and image coordinates

**Module:** 09 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 01 and 05; revisit any symbols you cannot yet explain.

**Goal:** Explain how continuous variation becomes pixels and why lost detail cannot always be recovered.

## A pixel array is a sampled representation

A continuous scene is filtered by optics and sensing before we store discrete measurements. A pixel can represent an integrated response over an area, followed by quantization. A grayscale value is therefore not the continuous world itself. Our toy arrays describe stored numerical measurements; their operations need not simulate physical light accurately.

State whether coordinates refer to pixel centers or cell boundaries, and whether (x,y) means (column,row). Most array indexing is [row,column]. A box convention using boundaries [x_min,x_max) differs from treating both integer endpoints as included pixels. Off-by-one errors change areas and alignment.

## Aliasing makes distinct signals share samples

Sample \(\cos(2\pi ft)\) at integer times \(t=n\). Frequencies differing by an integer cycles per sampling interval produce identical samples. At f=1, every sample is \(\cos(2\pi n)=1\), indistinguishable from a constant signal. The oscillation has not become physically constant; the samples cannot reveal it.

For an ideally band-limited signal, sampling above twice its highest frequency supports ideal reconstruction under the sampling assumptions. Real images, finite fields and practical filters complicate that ideal. Downsampling without first suppressing frequencies above the new limit can turn fine texture into false coarse patterns.

## Work a tiny downsampling example

The alternating row \([0,1,0,1,0,1,0,1]\) becomes \([0,0,0,0]\) if we take every second entry starting at index zero. Starting at index one instead gives all ones. Averaging each neighboring pair before reducing gives \([0.5,0.5,0.5,0.5]\). A low-pass filter reduces phase-dependent aliasing but deliberately removes high-frequency detail.

Interpolation predicts values between samples under an assumed rule; it cannot recover arbitrary detail already discarded. Nearest-neighbor resizing selects existing values. Bilinear resizing blends neighboring values and may be inappropriate for categorical label IDs; masks need an operation that respects their semantics or a deliberate soft-target interpretation.

## The vision consequence

Small objects can disappear after strong downsampling. A network's stride changes both computation and the spatial evidence available for prediction. Compare a synthetic fine pattern before and after filtering and sampling, and state what information remains. Do not describe enlarging an image as creating measured evidence that was never captured.

## Practice before opening the answers

1. Downsample \([0,1,0,1,0,1]\) by taking indices 0,2,4.
2. Average adjacent pairs in that row before reducing.
3. Why can \(\cos(2\pi n)\) be confused with a constant from integer samples?
4. Why is averaging class IDs during mask resizing usually wrong?

## Check your understanding

Create two different underlying patterns with the same sampled values and explain what an antialiasing filter can and cannot do.

## Read with a purpose

CV 2.3.1, 3.5.1-3.5.2 and 3.4; revisit the image-coordinate conventions in Lesson 05. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
