# Build an independent CV project

This lab is the course capstone: Lessons 45-48 teach the method, and this project applies it. There is one capstone, not two. If you have no local Python or GPU, extend the synthetic starter in the Module 12 notebook and use the same report template.

Choose a modest question with data you can inspect. Examples: distinguish two types of household objects across new capture sessions; count objects under changing illumination; compare a segmentation model with a threshold baseline; or align a document under viewpoint change. You do not need to use every architecture in the course.

## Declare the protocol

Use the downloadable capstone report template. Write the task, population, label definitions, input/output contract and baseline. Save independent groups and fixed train/validation/test IDs before training. Decide the primary metric and how you will handle empty masks, missing objects and unknown classes. State your compute budget and one planned improvement.

Do not select the question after finding the most flattering result. If you use supplied CIFAR or PennFudan data, identify the source, subset limits and split limitations. Your own real-data project should include a data audit and annotation review.

## Build, compare and inspect

Train the baseline and one improvement with declared settings. Save curves, image-level results and three failures. Choose the final procedure on validation evidence, including threshold and preprocessing decisions. Make at least one controlled comparison. If you repeat random seeds, distinguish training randomness from changes to the split.

## Evaluate once the procedure is fixed

For a selected CIFAR classifier, run:

```bash
python -m course.practical.classify evaluate --checkpoint course/practical/runs/cifar-small/best.pt --split test --out course/practical/runs/cifar-test.json
```

This evaluates the full official test portion unless you explicitly request `--per-class`; record any subset. For your own data, add `--manifest course/practical/data/my-split.json`. Detection and segmentation have equivalent explicit test commands in their labs. If you change the method after inspecting test failures, describe that test as development data and obtain new held-out evidence for the revised method.

## Hand over the result

Include the runnable command, environment snapshot, data provenance and split, saved artifact, model contract, primary metric with sample counts, baseline comparison, latency if relevant and a failure gallery. Reproduce one inference result from a fresh process. Keep private photos and large checkpoints out of the Git repository; explain how an authorized collaborator obtains them.

## Mastery gate

Ask yourself: Can I justify the split? Trace one example through preprocessing and output? Explain the loss and metric? Show a baseline? Reproduce the saved result? Explain three failures without inventing causes? State the population the evidence supports?

If one answer is no, revisit the relevant lab. Finishing a command is a useful checkpoint; completing this evidence is what closes the practical learning gap. Further specialties such as robotics/SLAM, medical imaging, OCR, large-scale training or production serving can become separate projects after this foundation.
