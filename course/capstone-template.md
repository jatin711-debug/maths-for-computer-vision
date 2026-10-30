# Maths for computer vision: capstone report

This is the single report for the course capstone (Practical Lab 12, or the Module 12 notebook if you work without local Python). Delete any section that does not apply to your project, and say why.

## 1. Question and hypothesis

Task, intended use, expected input conditions, baseline, one improvement, predicted outcome and what would contradict it.

## 2. Data protocol

Generator or dataset, source and usage terms, class definitions and ambiguous labels, annotation review, image/box/mask conventions, sample and class counts per split, independent group definition, exact split IDs and seed, duplicate checks, preprocessing fitted on training data and held-out test policy.

## 3. Mathematical model

Input, parameter and output shapes; forward equations; loss assumptions and reduction; one derivative; optimizer and training budget.

## 4. Controlled comparison

What changes, what is fixed, validation choices, repeats and selected final procedure. Record commands, Python and dependency versions, hardware, input colour/size/dtype/normalization, pretrained weights and source, and augmentation.

| Run | Seed | Data/split hash | Model | Budget | Training metric | Validation metric | Test metric | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | Baseline | | | | | |
| 2 | | | Improvement | | | | | |

## 5. Metrics and uncertainty

Primary metric with sample counts and denominators, class-wise results, AP/matching or empty-mask conventions, uncertainty from small samples, whether observations are independent, and how model differences compare with that uncertainty.

## 6. Error analysis

Three failures or explicitly declared stressful cases, with predicted and true results, group counts, confidence interpretation, one tested explanation and one unresolved hypothesis. Include at least one changed scene or unknown-class example.

## 7. Inference contract

If you saved a model: artifact path, architecture, class order, preprocessing, the exact new-image command, latency median and p95 with repeats, warmup, hardware and measurement scope, known limitations and unsupported inputs.

## 8. Limitations and next experiment

Population and generator assumptions, sampling uncertainty, shift conditions, metric conventions and a concrete next comparison justified by the evidence.

## 9. Reproduction

Fresh-environment instructions, dataset access, exact run sequence, split manifest, dependencies, dtype, seeds, saved parameters, preprocessing statistics, expected outputs and acceptable stochastic differences. A fresh run should produce the stated calculation and explain any differences.

## Readiness rubric

For each item use 0=missing, 1=partial, 2=clear and reproducible. Revisit every item below 2 before presenting.

1. A specific question with a stated hypothesis.
2. Training-only preprocessing and a defensible split protocol.
3. Correct shapes, objective assumptions and derivative calculation.
4. A transparent baseline and one controlled comparison.
5. Metrics with counts, denominators and matching conventions.
6. Failure analysis that distinguishes evidence from hypotheses.
7. Runnable code, settings and an explanation of uncertainty and limits.

The rubric assesses understanding and evidence, not whether the larger model wins. A model need not beat its baseline for the experiment to succeed.
