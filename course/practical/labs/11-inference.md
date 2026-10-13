# Use your model on new photos

A useful training result must reload in a separate process and apply the same class order, colour convention and preprocessing. This lab packages those assumptions with a saved classifier and measures inference on a local photo.

## Reload and predict

Save a new photograph as `course/practical/data/new-photo.jpg`, ideally of a class represented by your trained model.

```bash
python -m course.practical.classify predict --checkpoint course/practical/runs/cifar-small/best.pt --image course/practical/data/new-photo.jpg --repeats 30 --out course/practical/runs/new-photo-prediction.json
```

The process constructs the saved architecture without fetching pretrained weights, loads its state dictionary, restores the saved resize/normalization/class mapping, switches to evaluation mode, and runs without gradient tracking. Input is converted to RGB and corrected for EXIF orientation. Only load checkpoints you created or whose source you trust; the loader uses PyTorch's weights-only mode.

The report gives the top three class scores, preprocessing, environment and warm median/p95 latency. Three warmup passes precede timing. CUDA runs synchronize before and after each timed pass. Timing covers batch-one forward computation and softmax; it excludes file decoding, preprocessing, model loading and output writing. That is not end-to-end request latency.

## Measure a meaningful tradeoff

Compare the small CNN and your ResNet on the same image and machine. Record checkpoint size, model-only latency and validation quality. Use the same number of repeats. For an application, separately measure full request time and the data-loading bottleneck. If quantization or ONNX export becomes necessary, first verify prediction agreement with this reference implementation on representative inputs.

## Stress the interface

Try a portrait-format photo, a grayscale file, a rotated-camera image and an object outside the known classes. The script always chooses among known labels; a high score on an unknown object does not establish reliability. Resizing a large photo down to the model's input can also erase crucial detail. Record failures instead of silently changing preprocessing at inference time.

## Write the model contract

Record accepted file types, RGB conversion, input size, normalization, class order, expected scene conditions, validation evidence and latency scope. Save one invocation and its JSON output so someone else can verify the artifact. A CLI is a complete local inference handoff; serving it as a web service or mobile app is a separate packaging task.

## Evidence and mastery

Save predictions for three new photographs and one unknown class, plus a latency comparison. Explain why an unlabeled photo cannot measure accuracy, and why confidence thresholds must be selected using labeled validation data. Use Lab 12 to evaluate your final selected model on a held-out test set.
