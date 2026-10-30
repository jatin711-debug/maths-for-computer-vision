# Lesson 44 - Precision, recall, AP and mask metrics

**Module:** 11 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 43; revisit any symbols you cannot yet explain.

**Goal:** Calculate threshold-based and ranking-based metrics under a declared evaluation protocol.

## Count outcomes before computing ratios

\(\operatorname{precision}=\frac{TP}{TP+FP}\) asks how many predicted positives are correct. \(\operatorname{recall}=\frac{TP}{TP+FN}\) asks how many real positives were found. For \(TP=8,\ FP=2,\ FN=4\), precision is 0.8 and recall is 2/3. \(F_1=\frac{2TP}{2TP+FP+FN}=\frac8{11}\). State policies for a zero denominator and whether counts are pooled across classes or computed separately.

Changing a confidence threshold changes which predictions remain. Lowering it often increases recall and can reduce precision, but the empirical curve depends on the ordered outcomes. A threshold selected to meet an operating requirement belongs to validation, followed by held-out evaluation.

## A small ranking calculation

Take two true objects and three detections ordered by decreasing score. After class-aware one-to-one matching at a fixed IoU threshold, their outcomes are TP,FP,TP. Precision at each rank is 1,1/2,2/3 and recall is 1/2,1/2,1. Under a simple noninterpolated AP convention, sum precision at each true-positive rank and divide by the two ground-truth objects: \(\operatorname{AP}=\frac{1+2/3}{2}=\frac56\).

AP conventions vary. Some use an interpolated precision envelope and sampled recall points; benchmark reports also specify categories, overlap thresholds, size ranges and maximum detections. A toy AP function should not be advertised as an official benchmark evaluator. COCO's official implementation evaluates multiple IoU thresholds from 0.50 to 0.95 and a sampled recall grid; use its protocol for a COCO result.

## Class averaging changes the question

Macro averaging gives classes equal weight. Micro averaging pools counts, giving frequent classes more influence. Mean AP averages per-class AP under the stated protocol. Mean IoU for segmentation averages class overlaps under a declared absent-class policy. A pooled pixel accuracy answers a different question from class-balanced overlap.

## A report you can interpret

For recognition: class counts, accuracy, confusion matrix and probability quality. For detection: matching, score thresholds or AP convention, coordinate format and IoU thresholds. For segmentation: foreground or class-wise IoU/Dice, valid pixels and empty-mask policy. Include failure images and sampling uncertainty when the evaluation supports it.

Choose the metric because it answers the deployment question, not because it is largest. The Module 11 notebook calculates transparent toy metrics and labels its AP convention explicitly.

## Practice before opening the answers

1. For TP=6,FP=3,FN=2, calculate precision and recall.
2. For ranked outcomes TP,FP,TP and two targets, compute the lesson’s noninterpolated AP.
3. Why can micro and macro averages disagree on imbalanced classes?
4. What must be specified before comparing two detection AP numbers?

## Check your understanding

Explain a complete evaluation protocol and compute its small-case metrics by hand, including denominators and matching choices.

## Read with a purpose

CV 6.2-6.4; optional official COCO evaluation implementation. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
