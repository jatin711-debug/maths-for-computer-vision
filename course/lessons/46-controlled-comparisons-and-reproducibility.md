# Lesson 46 - Controlled comparisons and reproducibility

**Module:** 12 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 45; revisit any symbols you cannot yet explain.

**Goal:** Separate a measured improvement from an uncontrolled difference between runs.

## Change one declared factor

Compare a baseline with one justified modification while keeping data splits, preprocessing and evaluation fixed. If the CNN changes architecture, optimizer, training budget and augmentation at once, a gain cannot identify which change helped. A bundled comparison may still be useful, but it supports a narrower claim about the whole procedure.

An ablation removes or changes one component to test its contribution. For example, compare the same network with and without a nonlinear activation, or with and without a declared augmentation. Use a training budget and model-selection procedure suitable to the question; equal update counts and equal compute costs answer different questions.

## Use repeats carefully

Different seeds change initialization and data order. Repeat a fixed procedure with a small predeclared set of seeds and report individual results plus a summary. With three accuracies 0.80,0.82,0.78, the mean is 0.80 and sample standard deviation is 0.02. This variation across training runs differs from test-sampling uncertainty for one fixed model.

When comparing models on the same test images, retain paired outcomes. Improvements can come from a few changed predictions, and the covariance between their errors matters. A larger mean from a few trials is evidence with limited precision, not automatic proof of a reproducible gain.

## Make the computation repeatable

Record generator or dataset version, sample identifiers, seed, parameter shapes, dtype, training schedule, loss reduction and metric implementation. Save the selected parameters and the exact preprocessing statistics. Include run instructions and a known small sanity case. A fixed seed can help reproduce a run, though hardware and implementation details may still affect numerical results.

## Report the evidence at its proper scope

Write the result before its explanation: “On this held-out synthetic set, accuracy changed from A to B.” Then give a supported interpretation and a remaining hypothesis. Report failed experiments and settings when they affect interpretation. Do not select only the seed that makes the improvement look best.

In your capstone, run the unchanged baseline and one improvement, collect a table with counts and uncertainty type, and save at least three failure examples or stressful cases. You may extend to another task later; the required project is one complete controlled comparison.

## Practice before opening the answers

1. Find mean and sample standard deviation of \([0.7,0.8,0.9]\).
2. Why is changing optimizer and architecture simultaneously hard to interpret?
3. Does averaging three training seeds remove uncertainty about the test population?
4. List information needed to reproduce a fitted preprocessing pipeline.

## Check your understanding

Produce a controlled comparison table and state exactly which differences its results can support.

## Read with a purpose

MML 8.6; revisit the optimization diagnostics from Lesson 32. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
