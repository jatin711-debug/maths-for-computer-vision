# Segment people pixel by pixel

Use the same PennFudan photographs with a different output: foreground person versus background for every pixel. We merge all nonzero instance IDs into one semantic foreground class. This loses information about which person is which, deliberately.

## Train a small U-Net

```bash
python -m course.practical.dense train --task segment --download --limit 8 --size 128 --epochs 2 --run course/practical/runs/segment-smoke
python -m course.practical.dense train --task segment --size 128 --epochs 10 --augment --run course/practical/runs/segment-full
```

The network encodes high-resolution features, pools to a coarser level, upsamples and concatenates the earlier features before predicting one logit per pixel. Read `TinyUNet.forward` and name each shape. Binary cross-entropy with logits trains the model; a sigmoid threshold of .5 defines the reported mask.

RGB images use bilinear resizing; categorical masks use nearest-neighbour resizing. Interpolating IDs would invent meaningless classes. Every spatial flip must also flip the target. The teaching path resizes to a square, which can distort shapes; record it as an assumption and compare an aspect-preserving strategy as a later extension.

## Read the outputs

`metrics.json` contains pooled pixel counts, foreground IoU, foreground Dice and pixel accuracy. It also reports an all-background baseline on exactly the evaluated images. If both predicted and true foreground are absent everywhere, foreground overlap is undefined and saved as null. Green overlay pixels are true foreground, red false foreground, blue missed foreground.

Inspect thin limbs, touching people, boundaries and clutter. A high pixel accuracy can coexist with nearly zero foreground recall because most pixels are background. Dice and IoU reward overlap differently; neither is a substitute for visual inspection. Thresholded metrics differ from a differentiable soft-Dice training objective.

## Experiment

Compare the fixed full run with one change: horizontal augmentation or image resolution. Keep the split and epoch budget recorded. If you add a class-weighted loss, choose its weight from training data only. Keep the .5 threshold fixed unless you explicitly select a new threshold on validation and record it with the artifact.

## Final evaluation

```bash
python -m course.practical.dense evaluate --task segment --checkpoint course/practical/runs/segment-full/best.pt --split test --run course/practical/runs/segment-test
```

Run this only after choosing the method. The same image-split limitations as the detection lab apply.

## Evidence and mastery

Save three overlays, foreground metrics, the all-background baseline and one boundary failure analysis. Explain why a resized categorical mask must remain discrete and why this model cannot give separate IDs to overlapping people. Review Lessons 43, 44 and 56 when connecting the code to the loss and architecture.
