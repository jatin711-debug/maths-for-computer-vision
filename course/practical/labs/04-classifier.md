# Train a real-image classifier

This lab uses CIFAR-10: ten categories of small real photographs. It provides the official train/test boundary; we split the training portion into train and validation, stratified by class. The test portion is never used during training. The small CNN has two convolutions and global averaging so you can trace every shape.

## Run a small experiment

```bash
python -m course.practical.classify train --download --per-class 50 --epochs 3 --run course/practical/runs/cifar-small
```

The first command downloads the full archive (about 170 MB), even though it uses 50 images per class in each development split. Omit `--download` thereafter. `--per-class` is a speed control, not a representative full benchmark. No particular accuracy is promised from three epochs on this small subset.

Open `classify.py` and follow `dataset`, `ClassificationData.__getitem__`, the `DataLoader`, forward pass, cross-entropy, `backward` and optimizer step. The network emits ten logits. Do not apply softmax before `cross_entropy`: that function combines the needed log-softmax and loss stably. `zero_grad` prevents gradients accumulating across batches accidentally.

## Inspect the result

`protocol.json` records exact image IDs, split hash, settings, versions and majority-class validation baseline. `history.json` records train loss and validation loss/accuracy. `validation.json` gives the confusion matrix, per-class recall and individual predictions. `failures.jpg` shows up to twelve confident mistakes if errors occurred. `best.pt` was chosen by validation accuracy; `last.pt` supports resume.

The baseline selects the most common training class and predicts it for every validation image. Balanced accuracy averages recall over represented classes; ordinary accuracy averages correctness over images. On balanced CIFAR subsets they coincide, but they need not on your custom data.

```bash
python -m course.practical.report course/practical/runs/cifar-small
```

Open the generated `report.html` to inspect learning curves and the confusion matrix. Choose three errors and look at their source photographs. Distinguish plausible ambiguity from a preprocessing mistake. A high softmax score does not prove calibrated confidence.

## Extend one thing

Repeat with `--augment` and a new run directory, keeping the seed, subset, epochs and architecture fixed. Horizontal flips are acceptable for these categories, but not automatically for text or left/right labels. Write your hypothesis before comparing validation results. Save test evaluation for the final selected procedure in Lab 12.

Reference: [CIFAR-10 source](https://www.cs.toronto.edu/~kriz/cifar.html) and [PyTorch data tutorial](https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html).
