# Lesson 41 - CNN classification, inductive bias and augmentation

**Module:** 11 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lesson 40; revisit any symbols you cannot yet explain.

**Goal:** Connect local shared weights to a trainable image classifier, choose label-preserving transformations and reuse a pretrained network.

## A CNN chooses a structured family of functions

A convolutional layer uses local patches and shared kernels, encoding a preference that the same visual pattern can matter at different positions. An activation changes the local response nonlinearly. Further layers can combine simpler responses into broader patterns. These architectural assumptions are an inductive bias: they guide learning but do not guarantee performance on a particular task.

For X=(N,8,8,1), a valid 3x3 layer with four kernels gives (N,6,6,4). ReLU keeps that shape. Flattening gives (N,144), and a dense two-class head uses W=\((144,2)\), b=(2,). The convolution has \(3\cdot3\cdot1\cdot4+4=40\) parameters; the head has \(144\cdot2+2=290\). Total trainable parameters are 330.

## Shared weights also share gradient contributions

An output response is \(z_{nijc}=\sum_{a,b,d}X_{n,i+a,j+b,d}K_{abdc}+b_c\). Its kernel gradient accumulates input-patch values weighted by upstream sensitivities across every sample and placement. Weight sharing is present in both the forward and backward calculations. The Module 11 notebook uses NumPy patch extraction and array contractions for this small CNN, and checks selected gradients before training.

## Equivariance differs from invariance

In an ideal interior stride-1 setting, shifting an input shifts a corresponding feature map: this is translation equivariance. Invariance would mean an unchanged final output. Padding, subsampling, cropping and a dense flattened head can change this behavior. Pooling or global aggregation can reduce sensitivity to location but may also discard information needed for localization.

## Augmentation expresses a task assumption

An augmentation must preserve the intended target, or transform it consistently. A horizontal flip may preserve a bar-orientation label but may alter a directional symbol. For detection, boxes must move with the image; for segmentation, masks must follow the same spatial transform. Adding unrealistic changes can train a different problem from the one you intend to solve.

Compare a CNN and linear baseline on the same synthetic bars and split. Then test a declared distribution change, such as new noise or positions, without retuning on those test outcomes. High toy accuracy teaches mechanics; it is not evidence of broad real-image recognition ability.

Save filter responses, one correct prediction and one failure or stressful case. Explain the shapes, objective and architectural assumptions before discussing accuracy. This connects the entire course: linear maps, local filtering, probabilities, gradients and evaluation.

## Reuse a trained network: transfer learning

Training every weight from random values needs a lot of data. Transfer learning starts from a network trained on a larger dataset, because its early layers have already learned general features such as edges and textures. Keep that backbone and replace the final head, which was tied to the old classes. To use the backbone as a feature extractor, freeze it so only the head's weights change: a backbone giving 512 features and a new ten-class head train just \(512\cdot10+10=5130\) parameters, however large the backbone is.

Fine-tuning then unfreezes some or all of the backbone and continues with a learning rate about ten times smaller. The weights are already useful, so small steps adapt them while large steps can destroy them. Wait until the head has settled, because a random head sends large gradients back into good weights.

Two things stay your responsibility. The preprocessing the weights were trained with, including input size, colour order and normalization, is part of the model. And pretrained weights do not replace evaluation: keep an independent test set and compare the frozen and fine-tuned models on the same split. Practical Lab 05 runs both strategies.

## Practice before opening the answers

1. Count convolution parameters for a biased 3x3 layer from one to four channels.
2. For the worked 8x8 CNN, give the flattened feature dimension.
3. Why does shifting a feature map not imply unchanged class scores?
4. How should a horizontal flip affect a box [x1,y1,x2,y2] in an image of width W using boundary coordinates?

## Check your understanding

Explain an end-to-end CNN forward and backward computation, its parameter count and one task-specific augmentation assumption.

## Read with a purpose

CV 5.4 and 6.2; optional CS231n convolutional-network notes. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
