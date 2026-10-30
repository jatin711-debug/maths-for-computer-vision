# Lesson 16 - Reconstruction error and data leakage

**Module:** 04 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 15; revisit any symbols you cannot yet explain.

**Goal:** Evaluate compression and build preprocessing that does not learn from held-out observations.

## A transform has learned parameters too

PCA learns a mean and directions from data. Standardization learns means and scales. A feature selector learns which coordinates to retain. Even when labels are absent, fitting these on validation or test examples lets held-out information influence the model. A clean evaluation treats preprocessing as part of the fitted pipeline.

Fit mu and V_k using training samples. Transform every split with \(Z=(X-\mathbf1\mu)V_k\). Reconstruct with \(\hat X=ZV_k^T+\mathbf1\mu\). New samples must use the original training mean and directions. Re-centering each new batch separately changes its representation and can make predictions depend on who else is in that batch.

## Measure reconstruction with a declared convention

For Xc, squared Frobenius reconstruction error after keeping k principal directions is the sum of discarded \(\sigma_i^2\). If you report MSE per entry, divide by \(ND\). If you report mean squared error per sample vector, divide by N. These quantities have different units and values, even though they summarize the same residuals.

Suppose a 4x3 centered dataset has discarded singular values 2 and 1. Squared total error is 5, mean squared vector error is 5/4, and entrywise MSE is 5/12. Explain the denominator before comparing numbers from two reports.

## Compare a downstream baseline

A nearest-centroid classifier computes each class centroid from training features, then assigns a new feature to the closest centroid. Choose PCA component count using validation performance. After fixing that choice, evaluate once on test. A higher component count can reduce reconstruction error while failing to improve classification.

Near-duplicate images and frames from the same video can leak across a random split. Group related observations by subject, sequence or source when the deployment question requires independence. Training and evaluation need to reflect the intended future use, not only a convenient array shuffle.

## Your module artifact

In the Module 04 notebook, compare raw and PCA features using the same split and metric. Record retained dimensions, error normalization, training-only preprocessing and a failure example. Then compress one image at several ranks. Distinguish this single-image experiment from the classifier's learned dataset transform.

## Practice before opening the answers

1. If discarded singular values are \([3,1]\), find squared Frobenius error.
2. For \(N=5,\ D=2\), turn that error into entrywise MSE.
3. Should validation samples get their own fitted PCA basis?
4. Name a reason frame-level random splitting can overestimate future performance.

## Check your understanding

Write a preprocessing protocol and error denominator precisely enough that another learner can reproduce your comparison.

## Read with a purpose

MML 10.4 and 10.6; CV 5.2.3. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
