# Lesson 45 - Choose a question, protocol and baseline

**Module:** 12 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 44; revisit any symbols you cannot yet explain.

**Goal:** Turn a broad interest into an experiment with a testable hypothesis.

## Start with one answerable question

Choose recognition, single-object localization or binary segmentation. For recognition, a question could be: does a small CNN improve bar-orientation accuracy under held-out noise compared with a linear classifier? It names the comparison, task and evaluation condition. A vague goal such as “build the best vision model” supplies no controlled decision.

The supplied notebooks use generated data so you can understand targets, coordinates and noise without needing a download. Practical Lab 12 takes the same protocol to real images, which adds questions about labeling, access and sampling. A synthetic result establishes behavior for its generator; do not treat it as evidence of real-scene robustness.

## Write a protocol before fitting

Declare the generator or dataset, sample counts, class balance, split and grouping rule, seed and preprocessing. Define the primary metric and a secondary diagnostic. Keep the test set separate until the comparison is fixed. Reserve an optional shifted evaluation set for one declared change, such as increased noise, and label it as a distinct distribution.

## Pick a baseline you can explain

For recognition, use nearest-centroid or linear softmax regression. For localization, a fixed average box can reveal whether a learned predictor does more than memorize typical geometry. For segmentation, use all-background and a simple intensity classifier. A weak baseline can still expose metric pitfalls, while a stronger transparent one helps judge the value of extra complexity.

Your hypothesis should predict both improvement and a possible limitation. For example, local shared kernels may help recognize shifted bars, while a flattened head can remain position-sensitive. State what observation would fail to support the hypothesis.

## Connect choices to maths

Name the input representation and its dimension, parameter shapes, output distribution, loss reduction and evaluation denominator. Identify where training-only fitted statistics enter. A mathematical justification makes the procedure inspectable; it is not a promise that the chosen model will outperform its baseline.

## Deliver the experiment plan

Use the capstone template in the library. Fill the question, hypothesis, data protocol, baseline, one improvement, fixed comparison conditions and planned failure analysis. Finish this before training so the experiment has a stable interpretation. If a practical issue changes the plan, record the change and preserve the original question rather than retrospectively rewriting the hypothesis to match results.

## Practice before opening the answers

1. Write a one-sentence comparison question for recognition.
2. Give a segmentation baseline and a metric that reveals its weakness.
3. List four decisions that should be fixed before testing.
4. What does successful recognition on generated bars demonstrate?

## Check your understanding

Submit a specific question, hypothesis and fixed evaluation protocol that can be reproduced without this chat.

## Read with a purpose

Revisit MML 8.6 and CV 6.2-6.4 for your chosen task. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
