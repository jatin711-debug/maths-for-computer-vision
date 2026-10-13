# Detect people in photographs

Detection predicts a variable number of objects. This lab fine-tunes a Faster R-CNN with a MobileNet backbone on PennFudan. There is one foreground class, person, indexed 1; 0 is background. Instance masks provide the ground-truth boxes. This is an educational dataset and split, not a comprehensive pedestrian benchmark.

## Inspect the targets first

```bash
python -m course.practical.dense train --task detect --download --pretrained --limit 8 --size 128 --epochs 1 --run course/practical/runs/detect-smoke
```

This first run downloads the roughly 54 MB dataset and roughly 75 MB pretrained detector. Eight images per development split and a small resolution verify the path. Before trusting any metric, inspect the green ground-truth boxes and red predictions in `overlays`. In `data.py`, each nonzero instance ID becomes a mask and a continuous-boundary box. Width is `x2-x1`; the maximum occupied pixel contributes its full area via `max(x)+1`.

The DataLoader uses lists because photographs and object counts differ. During training, torchvision returns a dictionary of classification, box-regression and proposal losses. During evaluation it returns boxes, scores and labels. Model evaluation also uses its configured score filtering and non-maximum suppression.

## Run the full development split

```bash
python -m course.practical.dense train --task detect --pretrained --size 320 --epochs 5 --lr 0.0001 --augment --run course/practical/runs/detect-full
```

Add `--device cuda` if available. This is slower than the classifier on CPU; the smoke run is the place to establish memory and time expectations. The optional flip updates images, masks and boxes together. Use a new run directory each time; dense training does not implement resume.

## Read AP correctly

`metrics.json` reports all-points interpolated AP at IoU .50 for one class. Predictions are globally ranked by score; each ground-truth box can match only one prediction. A duplicate prediction is a false positive. AP uses all detections returned by the model; the .5 score cutoff used to draw red boxes affects only the illustrations. The metric is not COCO AP averaged over .50:.95, and it ignores none of the objects as crowd regions because this dataset path does not define crowds.

Compare a high-score false positive, an occluded missed person and a poorly localized box. Threshold selection is a validation decision. AP summarizes a ranking; a deployed threshold still needs its own precision/recall tradeoff.

## Final evaluation, after choosing settings

```bash
python -m course.practical.dense evaluate --task detect --checkpoint course/practical/runs/detect-full/best.pt --split test --run course/practical/runs/detect-test
```

The checkpoint restores the original size and split seed. Training never evaluates test images. PennFudan lacks reliable identity/group metadata for this workflow: related people or scenes may cross the image split. State that limitation explicitly.

## Evidence and mastery

Save the protocol, best weights, AP curve arrays and three annotated failures. Explain why one-object localization is simpler than detection, how NMS differs from evaluation matching, and how small objects suffer when you lower resolution.

Reference: [Torchvision detection tutorial](https://docs.pytorch.org/tutorials/intermediate/torchvision_tutorial.html) and [PennFudan source](https://www.cis.upenn.edu/~jshi/ped_html/).
