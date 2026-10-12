# Lesson 48 - Read a method and defend your maths

**Module:** 12 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 47; revisit any symbols you cannot yet explain.

**Goal:** Map a research method to a concrete computation and defend the choices in your own project.

## Translate a method before judging it

For any method description, identify the inputs, learned parameters, output representation, objective and evaluation protocol. Annotate the shape and meaning of every major symbol. Separate a mathematical guarantee from an empirical result on a particular dataset. A theorem's assumptions are part of the claim, not optional fine print.

Begin with the abstract and figures to locate the question, then read the method and the parts of the experiments that test it. Use related work to understand comparisons after you can describe the proposed computation. A new name does not explain what the model optimizes; reconstruct the forward pass and loss in your own notation.

## Check the evidence

Ask which baselines are compared, whether training and model-selection budgets differ, and what ablations isolate. Locate dataset splits, grouping, metric conventions and uncertainty reporting. A result can be well measured yet limited to its tested setting. Distinguish the authors' interpretation from the quantity directly observed.

## Reconnect the course

Linear algebra explains representations and layers. Calculus supplies sensitivities and backpropagation. Probability defines model outputs and observation assumptions. Optimization supplies update rules. Image mathematics explains sampling and shared local operations. Evaluation turns predictions into evidence. Use these connections to explain your own capstone from input to conclusion.

## Your final deliverable

Write a 3-5 page report with question, data protocol, baseline, one improvement, results, failure analysis and limitations. Include runnable code or notebooks, seeds, preprocessing statistics and a concise reproduction command or sequence. Give a ten-minute explanation of one forward pass, one derivative, one training update and one metric calculation.

Use the capstone template's rubric to check whether another reader could reproduce and interpret the comparison. A high score on a toy task is not the only success criterion: a correct and candid negative result can demonstrate strong mathematical understanding.

## Where to deepen next

Choose further study from a concrete need: camera geometry for 3D vision, stronger statistics for uncertainty, more numerical methods for difficult optimization, or a specific architecture paper after its prerequisites. The extension modules take several of these paths further: camera geometry and robust fitting (Module 13), matrix calculus, attention and multi-scale networks (14), local features, optical flow and tracking (15), two-view geometry, bundle adjustment and neural rendering (16), and set prediction, VAEs, diffusion and Gaussian splatting (17). The Guo book can supply later geometry enrichment. Specialist topics beyond these still need focused study and practice.

## Practice before opening the answers

1. List five items you must identify in a new method.
2. Distinguish an empirical benchmark result from a mathematical guarantee.
3. Give a complete input-to-metric explanation of your capstone in five sentences.
4. Name one next topic and explain which gap in your project motivates it.

## Check your understanding

Defend your complete project with one worked calculation from each mathematical pillar and a clear account of the limits of its evidence.

## Read with a purpose

Revisit the MML and CV sections used by your project; choose one original paper after matching its prerequisites. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
