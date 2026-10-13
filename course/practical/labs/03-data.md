# Build and audit your dataset

Pick two or three visually meaningful classes, such as mugs versus bottles. Start with at least 20 independently collected photos per class. Ten neighbouring video frames are not ten independent scenes. Record where each image came from and whether you can use it for the intended project.

## Write an annotation contract

Before labeling, write what each class includes/excludes, how to handle uncertain examples, and whether multiple objects can coexist. For boxes, specify continuous `xyxy` boundaries and whether partially occluded objects get the visible or estimated full box. For masks, distinguish background, foreground, individual instances and any ignored pixels. Have a second person label a small sample if possible; otherwise label it twice at different times and review disagreements.

Put classification photos in `course/practical/data/my-images/mug/` and `course/practical/data/my-images/bottle/`. Create `groups.csv` with one row per image:

```csv
path,group
mug/desk-01.jpg,desk-session-1
mug/desk-02.jpg,desk-session-1
bottle/kitchen-01.jpg,kitchen-session-1
```

Use the same group for the same subject, video, capture session or source whenever that relationship could make images unusually similar. The example above is just the schema; include every image and enough independent groups to represent every class in each split.

## Audit before splitting

```bash
python -m course.practical.data course/practical/data/my-images --groups course/practical/data/groups.csv --out course/practical/data/audit.json
```

Inspect unreadable files, dimensions, class counts and duplicate groups in the JSON. The hash compares decoded, EXIF-oriented RGB pixels; it catches identical images with different file encodings, but not crops or near-duplicates. Review thumbnails for near-duplicates and labeling errors. Resolve duplicates manually and preserve an audit note; the script does not delete photographs.

```bash
python -m course.practical.data course/practical/data/my-images --groups course/practical/data/groups.csv --split --seed 7 --out course/practical/data/my-split.json
```

This assigns entire groups to approximately 60% train, 20% validation and 20% test. Fractions refer to groups, so image counts can differ. Missing classes trigger an error: improve coverage rather than repeatedly searching seeds until your favourite model scores well. Without a group CSV each image is considered independent; use that only when it is a defensible assumption.

## Use the fixed split

```bash
python -m course.practical.classify train --manifest course/practical/data/my-split.json --epochs 5 --run course/practical/runs/my-classifier
```

The classifier verifies the manifest fingerprint, class order, duplicate hashes and group independence before loading a split, then verifies that split's image pixels. Rebuild the audited manifest if the data or labels change. Augmentation belongs only in training and must preserve your class meaning. The scripts use fixed ImageNet normalization constants; any statistics you estimate yourself must come only from training images. Group IDs never become model inputs.

## Evidence and mastery

Save the label contract, group CSV, audit and split manifest. Count each class in every split and explain how a random image split could inflate results. List three ambiguous examples and your decisions. Preserve the original test split while experimenting. The report template on Lab 12 includes this data contract.
