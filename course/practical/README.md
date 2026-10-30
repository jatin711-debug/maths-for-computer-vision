# Practical computer vision

Twelve guided labs connect the maths course to working image systems. Open **Practical CV** in the course sidebar for the readings, commands, experiments, evidence checklists and saved notes. Each lab sits in the weekly plan right after the lessons it needs; see the sequence below. Allow roughly 35–55 hours of active work plus downloads/training; use the mastery checks to set your pace.

## Get the code

If you are studying the hosted course, first [download the repository](https://github.com/jatin711-debug/maths-for-computer-vision) and extract it, or clone it:

```bash
git clone https://github.com/jatin711-debug/maths-for-computer-vision.git
cd maths-for-computer-vision
```

The browser contains the readings; the Python commands need the repository files on your computer.

## Setup

Use Python 3.10–3.12 and run every command **from the repository root**. These labs use installed Python, not the browser's NumPy runner. CPU is the default. A GPU is optional; a full detector run is much more comfortable on one.

Windows PowerShell (activation is optional):

```powershell
python -m venv course/practical/.venv
course/practical/.venv/Scripts/python.exe -m pip install -r course/practical/requirements.txt
course/practical/.venv/Scripts/python.exe -m course.practical.check_environment
```

Use that environment's Python for the lab commands, or activate it with `course/practical/.venv/Scripts/Activate.ps1` so the shorter `python` commands work. If PowerShell blocks activation, use the explicit executable above; changing execution policy is unnecessary.

macOS/Linux:

```bash
python3 -m venv course/practical/.venv
source course/practical/.venv/bin/activate
python -m pip install -r course/practical/requirements.txt
python -m course.practical.check_environment
```

For NVIDIA GPUs, install a matched torch/torchvision pair using the official [PyTorch installer](https://pytorch.org/get-started/locally/), then install the remaining requirements. Pass `--device cuda` explicitly. macOS uses the CPU path in these scripts. Keep a snapshot of your working environment with `python -m pip freeze > course/practical/runs/environment.txt` after creating `runs`. Version ranges are compatibility bounds, not a lockfile. The checked environment and verification scope are recorded in `validation.md`.

## Start with a small real-data run

```bash
python -m course.practical.classify train --download --per-class 50 --epochs 3 --run course/practical/runs/cifar-small
python -m course.practical.dense train --task segment --download --limit 8 --epochs 2 --run course/practical/runs/people-small
```

The subset switches reduce computation, not download size. CIFAR-10 downloads about 170 MB (roughly 350 MB including extraction); PennFudan downloads about 54 MB (allow 150 MB with extraction). Allow several GB for packages, caches and experiments. Core labs can use a modest CPU laptop with about 8 GB RAM; lower batch size if memory is tight. Timing depends strongly on hardware. Small runs verify the pipeline; they are not benchmarks or guarantees of useful accuracy.

First downloads require internet. Subsequent runs use local data. `--pretrained` explicitly permits torchvision weight downloads; ResNet18 is about 45 MB and the detector about 75 MB. Foundation labs separately require `--download`, several hundred MB per model and additional RAM. No account, paid service or API key is needed for the supplied public models. Network outages can be handled by downloading from the linked primary source and placing the verified archive in `data`. If a corporate certificate causes an SSL error, fix Python's trusted certificate setup or use an OS-trusted browser download; do not turn off certificate verification.

## Lab sequence

| Lab | Weeks | What you build | Do these lessons first |
|---|---|---|---|
| 01 | 4 | **Environment, tensors and files:** understand RGB, dtype, layout and a batch | 1, 7 |
| 02 | 6 | **OpenCV object counter:** threshold, morphology, components and failure cases | 1, 33, 34 |
| 03 | 10-11 | **Your dataset:** annotation rules, duplicate audit and group-aware splits | 12, 16 |
| 04 | 22-23 | **Real-image classifier:** Dataset/DataLoader, training, baseline and confusion matrix | 27, 30, 38, 40, 41 |
| 05 | 24-25 | **Transfer learning:** frozen ResNet18 features, then fine-tuning | 39, 41, 55 |
| 06 | 25 | **Training diagnostics:** loss curves, exact CPU resume and controlled comparisons | 20, 32, 39 |
| 07 | 25-26 | **Object detection:** variable-size targets, pretrained Faster R-CNN and AP50 | 42, 44, 56 |
| 08 | 26 | **Segmentation:** a small U-Net, joint augmentation and foreground metrics | 43, 44, 56 |
| 09 | 34 | **Geometry and video:** ORB/RANSAC alignment and Lucas–Kanade tracks | 50, 52, 58, 59, 60 |
| 10 | 39 | **Foundation models (optional):** CLIP retrieval and SAM point prompts | 54, 55 |
| 11 | 26 | **Inference and latency:** saved preprocessing, new photographs and timing | 28, 41 |
| 12 | 27-28 | **The capstone:** your question, protocol, evidence and reproducible handoff | 45 |

The editable guides are in `labs/`; `manifest.json` defines each lab’s required and related lessons, and `study-path.json` places it in the weekly plan. `python course/practical/build_catalog.py` embeds them in the webpage so readings work offline and from `file://`. Python execution remains local. Lab notes and evidence checks use the existing course progress backup/import system.

## Files and contracts

- `classify.py`: `train`, `evaluate`, `predict`; CIFAR-10 or a custom folder manifest. `best.pt` is for inference; `last.pt` holds optimizer and RNG state for resume. Each run saves a protocol, environment versions, epoch history, confusion matrix, image-level predictions and a failure sheet when errors exist. Training only uses train/validation. Test evaluation is a separate explicit command.
- `data.py`: decoded RGB duplicate checks, corrupt-image reports, group splits and shared mask/box transforms. Split manifests contain an absolute dataset root for local use; change it when moving machines. Images are rehashed before custom classification runs. Exact duplicates must be resolved; near-duplicates still need visual review.
- `dense.py`: independent detection and binary segmentation runs. Detection uses one foreground class, continuous `xyxy` boundaries and all-points AP at IoU .50. It does **not** report COCO AP@[.50:.95]. Segmentation reports pooled foreground IoU/Dice, threshold .5 and an all-background baseline. PennFudan's educational image split cannot guarantee independence by person, scene or camera.
- `opencv_lab.py`: counting, homography estimation and feature-point tracking on local files.
- `foundation.py`: optional retrieval and promptable masks; requires `requirements-foundation.txt`.
- `tests/test_practical.py`: download-free checks of leakage prevention, metrics, spatial alignment, training, resume and inference.

All run directories must be new unless resuming a classifier. Data, model checkpoints and outputs are ignored by Git. Use a separate run name for each comparison. A checkpoint stores architecture/class names/preprocessing alongside weights; loading never automatically fetches pretrained weights.

## Data and attribution

CIFAR-10: [University of Toronto dataset page](https://www.cs.toronto.edu/~kriz/cifar.html), Alex Krizhevsky's *Learning Multiple Layers of Features from Tiny Images*. Preserve provenance and consult dataset terms before redistribution; downloaded data are not covered by this repository's content licence.

PennFudan: [University of Pennsylvania dataset page](https://www.cis.upenn.edu/~jshi/ped_html/), Wang, Shi, Song, Shen and Li, *An Experimental Study on Pedestrian Detection*. Masks identify instances; the semantic lab merges person instances. These images are not committed to the repo.

Model weights keep their upstream terms: [Torchvision models](https://docs.pytorch.org/vision/stable/models.html), [CLIP model card](https://huggingface.co/openai/clip-vit-base-patch32), [SAM model card](https://huggingface.co/facebook/sam-vit-base). Your own image collection needs a recorded source and intended use.

## Verify or extend

```bash
python -m unittest discover -s course/practical/tests -v
python course/practical/build_catalog.py --check
node course/validate_practical.cjs
```

Use `--help` on each module for options. These are educational implementations: the classifier demonstrates resume; dense prediction demonstrates model training and evaluation without a resume feature. A real deployment still needs task-specific validation, monitoring and packaging for its destination.
