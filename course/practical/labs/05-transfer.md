# Transfer learning and fine-tuning

A pretrained model brings features learned on another dataset. We replace ResNet18's final classifier with ten outputs, then compare two adaptation strategies on the same CIFAR split. The first run downloads about 45 MB of ImageNet weights. Images are resized to 224 × 224 and normalized with the saved ImageNet constants. Upsampling CIFAR cannot create missing detail.

## Train only the head

```bash
python -m course.practical.classify train --arch resnet18 --pretrained --freeze --per-class 50 --epochs 3 --run course/practical/runs/resnet-head
```

All backbone weights have `requires_grad=False`. The script also keeps the frozen backbone in evaluation mode, preventing BatchNorm running statistics from drifting. Only the new classification head learns. Freezing gradients alone would not achieve that behavior.

## Unfreeze for a new experiment

```bash
python -m course.practical.classify train --arch resnet18 --init course/practical/runs/resnet-head/best.pt --per-class 50 --epochs 3 --lr 0.0001 --run course/practical/runs/resnet-finetune
```

This initializes a fresh optimizer from the earlier best weights and trains all layers. It is a new fine-tuning stage, not a resumed identical experiment. The smaller learning rate reduces how quickly useful pretrained features are overwritten. Compare validation loss, accuracy, class recall and actual failures; an extra stage costs extra training, so record that budget.

## Compare honestly

Compare the small CNN, frozen-head ResNet and fine-tuned ResNet. Preserve the data split and report differences in resolution, pretrained data, parameter count and training budget. This comparison answers a practical method-choice question, not a claim that one architecture is intrinsically better under equal conditions. Test your own data using the manifest option from Lab 03.

## Evidence and mastery

Save both protocols, reports and three changed predictions. Explain which parameters update in each strategy and why pretraining can help with few labels. Describe a domain where ImageNet features might transfer poorly. Do not claim that a pretrained model has never seen related evaluation data without checking its provenance.

Reference: [official transfer-learning tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html).
