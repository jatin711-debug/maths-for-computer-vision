# Practical CV verification

Checked on 13 October 2026. These are educational pipeline checks, not model-quality benchmarks.

## Reproduce the download-free checks

Run from the repository root in an environment with `requirements.txt` installed:

```bash
python -m unittest discover -s course/practical/tests -v
python course/practical/build_catalog.py --check
node course/validate_practical.cjs
```

All **23 Python regression tests passed**. They cover decoded-image duplicates, corrupt files and missing groups; deterministic, disjoint splits; edited manifests and changed pixels; EXIF orientation and RGB conversion; official CIFAR test separation using a fixture; continuous box boundaries and joint flips; categorical mask resizing; hand-calculated confusion matrices, AP50 and foreground metrics; exact CPU resume including optimizer state; frozen ResNet backbone/BatchNorm; initialization of a new fine-tuning stage; saved-model inference, explicit test evaluation and reports; segmentation gradient updates; stale failure-image cleanup; object counting, known-transform homographies and a decodable tracked video.

The fixtures use small synthetic images and locally initialized models. The tests need no dataset/model downloads and make no claims about real-world accuracy. The JavaScript check passes all 12 lab routes and 36 evidence keys, and the generated catalog matches the editable lab guides.

The existing maths validators also passed: 68 lessons and 1,887 worked-example parameter cases; 312 practice generators across 93,600 instances; and 354 glossary terms. All reported zero issues. The practice validator retained six warnings about answer tolerances in the existing question bank.

## Checked environment

Windows, Python 3.12.0, NumPy 2.2.6, Pillow 12.3.0, PyTorch 2.8.0+cu126, torchvision 0.23.0+cu126, OpenCV 4.10.0. All recorded training checks use CPU. CUDA is available on this machine but practical CUDA execution was not checked.

The verification environment at `course/practical/.venv` shares the existing Python packages and installs its own supported OpenCV wheel. It is not a clean dependency-resolution test. The setup guide recommends an isolated environment; the requirements are version ranges, not a lockfile. The global environment also has a different OpenCV runtime, so use the recorded environment executable to reproduce these checks on this machine.

## Real photograph smoke runs

The locally downloaded PennFudan dataset was used for new CPU runs, without pretrained weights. Each run used horizontal augmentation, seed 7, learning rate .001 and batch size 2:

| Task | Images per development split | Size | Epochs | Validation result |
|---|---:|---:|---:|---|
| Binary segmentation | 4 | 64 × 64 | 1 | Foreground IoU 0.130371; Dice 0.230670 |
| Person detection | 2 | Minimum side 128 | 1 | Single-class AP50 0.016994; 5 ground-truth boxes |

Both saved `best.pt`, epoch history, image-level metrics and overlays. Loading each artifact with a separate `dense evaluate` process reproduced its validation metrics on the same subset; a local HTML learning-curve report was also generated for segmentation. Outputs are ignored by Git in `runs/verify-*-20261013`.

For example:

```bash
python -m course.practical.dense train --task segment --limit 4 --size 64 --epochs 1 --augment --run course/practical/runs/check-segment
python -m course.practical.dense evaluate --task segment --checkpoint course/practical/runs/check-segment/best.pt --limit 4 --run course/practical/runs/check-segment-eval
python -m course.practical.dense train --task detect --limit 2 --size 128 --epochs 1 --augment --run course/practical/runs/check-detect
python -m course.practical.dense evaluate --task detect --checkpoint course/practical/runs/check-detect/best.pt --limit 2 --run course/practical/runs/check-detect-eval
```

Add `--download` to the training command if PennFudan is missing. Use new run directories. The segmentation smoke model predicted foreground everywhere; its poor result verifies the metric and failure-analysis path, not a useful trained model. PennFudan's image split cannot establish person/scene independence.

## Browser checks

The collaborative browser rendered the overview and all 12 labs at measured widths of 974 and 1280 CSS pixels without document-level horizontal overflow. Each lab has one main heading, three evidence checks and a notes field. Notes and an evidence check survived a full page reload. The actual progress-export handler included both; importing an additional lab note/check merged them while preserving the existing ones. Temporary test progress was restored afterwards.

Mobile resizing attempts timed out in the preview tool, so mobile layout is not verified. Screenshot capture also failed intermittently; the browser findings above concern rendered DOM, navigation and persistence rather than a completed screenshot audit.

## Verification limits

- The official CIFAR archive download was stopped because throughput would require about an hour. CIFAR training and its live download/extraction path were not completed here. Classification training, exact resume, evaluation calculations and checkpoint inference passed on the custom-image fixture.
- ImageNet/COCO pretrained weight downloads and full training budgets were not executed. ResNet head freezing and fine-tuning mechanics were checked with locally initialized weights.
- Optional CLIP and SAM model downloads/inference were not executed. Their code follows the [Transformers 4 SAM API](https://huggingface.co/docs/transformers/v4.57.1/en/model_doc/sam); model-output quality still needs the Lab 10 experiments.
- No independent expert review, clean-environment install, macOS/Linux execution, CUDA run, or deployment benchmark is implied by these checks.
