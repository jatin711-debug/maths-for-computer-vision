# Debug and resume training

When training looks wrong, inspect evidence in order: input pixels and labels, model outputs, loss, gradients, optimizer settings, then generalization. A large model does not fix mislabeled or incorrectly normalized inputs.

## Read the curves

```bash
python -m course.practical.report course/practical/runs/cifar-small
```

If both losses stay high, inspect labels and learning rate; the model may also lack useful capacity. If training loss falls while validation loss rises, investigate overfitting or a split mismatch. If results jump wildly, examine learning rate, small validation counts and accidental training-mode evaluation. Curves are diagnostic clues rather than unique explanations.

## Resume an interrupted run

```bash
python -m course.practical.classify train --per-class 50 --epochs 5 --resume course/practical/runs/cifar-small/last.pt --run course/practical/runs/cifar-small
```

`--epochs 5` means five epochs total. Keep the original seed, architecture, learning rate, batch size, augmentation and freeze flags. A protocol mismatch is rejected. `last.pt` restores the optimizer, model, loader generator and torch RNG state; `best.pt` is an inference artifact and cannot resume training. Exact repeatability is tested on CPU within one environment. CUDA and different library/hardware versions may still differ.

## Make failures informative

Use a tiny training subset to test whether the network can reduce training loss. If it cannot, inspect a batch and the class indices before increasing model size. This debug subset is not your validation/test evidence. Intentionally raise the learning rate for a separate short run, then restore it. Save the curves and explain what changed.

Choose just one proper comparison: augmentation, learning rate or training budget. Use separate run directories with the same split seed. Repeat your chosen procedure with additional training seeds for a capstone, recording that a changed seed also changes the built-in CIFAR development split; use a custom fixed manifest if you need seed-only comparisons on identical data.

## CPU/GPU and memory

Batch size trades memory for throughput. Start with a correct full-precision run. Automatic mixed precision is an optional extension after measuring a CUDA bottleneck; it requires autocast and gradient scaling, and these teaching scripts intentionally do not enable it. Device mismatch errors usually mean an input, target or model remained on the other device.

## Evidence and mastery

Save one curve diagnosis, a resumed history and one controlled comparison. Explain why validation is not a training gradient source, why evaluation mode matters, and why changing a split after seeing errors weakens your conclusion.
