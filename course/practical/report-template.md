# Practical CV project report

## Question and intended use

Task, user, expected input conditions, output meaning, hypothesis, baseline and one improvement.

## Data contract

Source/usage terms; class definitions; ambiguous labels; annotation review; image/box/mask conventions; independent group definition; exact split IDs and seed; counts per class and split; duplicate/corruption audit; near-duplicate review; test access policy.

## Experiment protocol

Commands; Python and dependency versions; hardware; input colour/size/dtype/normalization; pretrained weights and source; augmentation; loss; optimizer; batch size; epochs; model selection; threshold selection; repeat seeds and what they change.

| Run | Data/split hash | Change | Budget | Validation metric | Final test metric |
|---|---|---|---|---|---|
| Baseline | | | | | |
| Improvement | | | | | |

## Metrics and uncertainty

Primary metric with sample counts; class-wise results; AP/matching or mask-empty conventions; baseline; uncertainty from small samples; whether observations are independent; distinction between model confidence and measured correctness.

## Failure analysis

At least three saved examples, predicted/true result, a plausible hypothesis, a controlled check and what remains uncertain. Include at least one changed scene or unknown-class example.

## Inference contract

Saved artifact path; architecture; class order; preprocessing; exact new-image command; latency median/p95, repeats, warmup, hardware and measurement scope; known limitations and unsupported inputs.

## Reproduction and next step

Fresh-environment instructions, dataset access, split manifest, checkpoint, expected outputs and acceptable stochastic differences. Name one next experiment justified by the evidence.

## Readiness

For each category above record 0=missing, 1=partial, 2=clear and reproducible. Complete the missing evidence before marking the capstone ready. A model need not beat its baseline for the experiment to teach a defensible conclusion.
