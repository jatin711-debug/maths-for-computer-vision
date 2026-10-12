# Lesson 42 - Bounding boxes, localization losses and IoU

**Module:** 11 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 41; revisit any symbols you cannot yet explain.

**Goal:** Compute box overlap and distinguish localization training from detection evaluation.

## A detection predicts what and where

Classification assigns an image label. Detection assigns classes and locations to a variable number of objects. A simple single-object exercise can output four box coordinates plus class scores; a general detector needs a method for proposing predictions, associating them with targets and handling no-object cases.

Use continuous boundary coordinates (x1,y1,x2,y2) with \(x_2\ge x_1,\ y_2\ge y_1\). Area is \((x_2-x_1)(y_2-y_1)\). Under this convention there is no extra +1. A center-width-height parameterization gives \(x_1=c_x-w/2\) and \(x_2=c_x+w/2\); normalize coordinates by image dimensions only when the loss and conversion consistently use that convention.

## Work intersection over union

For boxes A=\([0,0,2,2]\) and B=\([1,0,3,2]\), overlap width is \(\max(0,\min(2,3)-\max(0,1))=1\) and height is 2. Intersection area is 2. Each box has area 4, so union is 4+4-2=6 and \(\operatorname{IoU}=\frac13\). Disjoint boxes have intersection zero. Declare a policy for zero-area unions rather than dividing by zero silently.

## The loss can have multiple parts

A toy loss might be \(L_{\rm class}+\lambda L_{\rm box}\), where L_box sums coordinate errors for a matched object. The units, coordinate scaling, number of matches and averaging convention affect relative magnitudes. Smooth L1 with threshold delta uses \(\frac{r^2}{2\delta}\) for \(|r|<\delta\) and \(|r|-\frac\delta2\) otherwise. It behaves quadratically near zero and linearly for large errors.

IoU-based objectives target overlap directly, but plain IoU can provide unhelpful gradients when boxes do not overlap: IoU is zero however far apart they are. Generalised IoU fixes this by subtracting the empty fraction of the smallest enclosing box C, \(\mathrm{GIoU}=\mathrm{IoU}-|C\setminus(A\cup B)|/|C|\), which still decreases as separated boxes move apart (Lesson 65 uses it). Training objectives and evaluation criteria need not be identical. A coordinate loss can improve even while an IoU thresholded metric remains unchanged.

## Association and duplicate predictions matter

Evaluation matches predictions with ground-truth objects under a declared class and overlap rule. One object should not normally generate several true positives from duplicate detections. Non-maximum suppression orders predictions by score and suppresses highly overlapping alternatives under a chosen rule; it is a postprocessing choice with task-dependent effects.

The workbench moves a predicted box around a fixed target and updates intersection, union and IoU. Compute one position yourself before inspecting the result. Treat a single-object localization lab as a stepping stone, not a full benchmark detector.

## Practice before opening the answers

1. Find IoU of \([0,0,2,2]\) and \([1,1,3,3]\).
2. Convert center \((4,3)\), width 2, height 4 to boundary coordinates.
3. Evaluate Smooth L1 with \(\delta=1\) at residuals 0.5 and 2.
4. Why should two duplicate boxes not both count as true positives for one object?

## Check your understanding

Calculate a box metric with explicit coordinate conventions and explain the output, training objective and matching rule of a localization task.

## Read with a purpose

CV 6.3; revisit CV 5.3.4 for training objectives. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
