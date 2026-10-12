# Lesson 43 - Segmentation and class imbalance

**Module:** 11 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 42; revisit any symbols you cannot yet explain.

**Goal:** Define pixelwise prediction and explain why background accuracy can mislead.

## Predict a label for every pixel

Semantic segmentation assigns one class per pixel. An image batch (N,H,W,C_in) may produce logits (N,H,W,C_classes). Softmax applies across the class axis independently at each pixel, while the loss aggregates over examples and valid pixel positions. Binary foreground segmentation can instead use one sigmoid logit per pixel.

The target mask contains categorical labels, with any ignore label excluded from the declared loss and metrics. Instance segmentation additionally distinguishes separate objects of the same class. A foreground mask alone does not provide instance identities.

## Work a background-dominated example

Suppose a 100-pixel mask has 10 foreground pixels and 90 background pixels. Predicting background everywhere gives 90% pixel accuracy but zero foreground recall and zero foreground IoU. The number looks strong only because most pixels belong to a class that requires no object detection.

For foreground \(TP=6,\ FP=2,\ FN=4\), \(\operatorname{IoU}=\frac{TP}{TP+FP+FN}=\frac6{12}=0.5\). \(\operatorname{Dice}=\frac{2TP}{2TP+FP+FN}=\frac{12}{18}=\frac23\). True negatives do not appear in either foreground overlap measure. Report which classes are averaged and how absent classes or empty masks are handled.

## Choose the loss and its weights deliberately

Pixelwise cross entropy treats each labeled pixel as a contribution. Class weights can increase rare-class influence, but they change the effective objective and can affect calibration. Dice-style losses use overlap-related ratios with stated smoothing constants and reduction axes. They are not identical to thresholded Dice evaluation, especially when applied to soft probabilities. Focal loss is another common choice: \(-(1-p_t)^\gamma\ln p_t\), usually with \(\gamma=2\), scales down the loss of pixels or anchors the model already gets right, so the many easy background examples stop dominating the gradient. At \(p_t=0.9\) the factor is \(0.01\); at \(p_t=0.1\) it is \(0.81\).

For binary probabilities p_i and targets y_i, one soft Dice convention is \(\frac{2\sum_i p_iy_i+\epsilon}{\sum_i p_i+\sum_i y_i+\epsilon}\). Other definitions square terms or average differently. Name the formula, whether it is per-image or pooled, and which labels are excluded.

## Resolution and alignment matter

Strided features may need upsampling before predicting a full-resolution mask. Check that output pixels correspond to target locations; good-looking shapes can hide shifts from padding or resizing. Apply every spatial augmentation identically to image and mask while preserving class semantics.

In the vision notebook, a simple trainable pixel classifier segments synthetic bright rectangles. Compare its foreground IoU with the all-background baseline and inspect noisy boundaries. This teaches output, loss and metric mechanics before a more expressive segmentation architecture is needed.

## Practice before opening the answers

1. For 200 pixels with 5% foreground, find accuracy of predicting all background.
2. For TP=8,FP=2,FN=4, calculate foreground IoU and Dice.
3. Give the logit shape for a batch of 4 images, each 32x48, with three semantic classes.
4. Does adding rare-class weight leave the original unweighted cross-entropy objective unchanged?

## Check your understanding

Specify segmentation outputs, class axis, ignored pixels, loss reduction and overlap metrics, then explain an all-background failure.

## Read with a purpose

CV 6.4; revisit CV 5.3.4 for classification losses. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
