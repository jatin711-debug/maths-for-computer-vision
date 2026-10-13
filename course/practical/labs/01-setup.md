# Your local vision lab

The browser teaches the calculations. These labs use installed Python to read files, train models and save results. You can start this lab before completing the maths course. Python basics to know: variables, loops, functions, lists, imports and indexing; use the [CS231n Python/NumPy tutorial](https://cs231n.github.io/python-numpy-tutorial/) to refresh them.

## Set up once

If you are using the hosted course, first download and extract the [repository](https://github.com/jatin711-debug/maths-for-computer-vision), or clone it:

```bash
git clone https://github.com/jatin711-debug/maths-for-computer-vision.git
cd maths-for-computer-vision
```

Open a terminal in the repository root, the folder containing `README.md` and `course`. Create a Python 3.10–3.12 environment and install the practical requirements. On Windows:

```powershell
python -m venv course/practical/.venv
course/practical/.venv/Scripts/python.exe -m pip install -r course/practical/requirements.txt
course/practical/.venv/Scripts/python.exe -m course.practical.check_environment
```

Activate with `course/practical/.venv/Scripts/Activate.ps1`, or replace `python` in subsequent commands with the full environment executable. On macOS/Linux use `python3 -m venv course/practical/.venv`, then `source course/practical/.venv/bin/activate` and `python -m pip install -r course/practical/requirements.txt`. The setup guide is downloadable from the practical overview.

## Understand the first batch

Run this in a Python session in your environment:

```python
import torch
from PIL import Image
from torchvision.transforms import functional as F
image = Image.new("RGB", (48, 32), (255, 128, 0))
x = F.to_tensor(image)
batch = torch.stack([x, x])
labels = torch.tensor([0, 1], dtype=torch.long)
print(x.shape, x.dtype, x[:, 0, 0])
print(batch.shape, labels.shape, labels.dtype)
```

Predict before running: Pillow's size is width then height; a tensor is channels, height, width. The image becomes `(3,32,48)`, the batch `(2,3,32,48)`, and labels `(2,)`. The orange pixel becomes roughly `(1,0.502,0)`. Pixel floats are scaled to 0–1; labels remain integer class indices. Adding a batch dimension is different from adding a colour channel.

OpenCV conventionally uses BGR arrays; Pillow and the neural network paths here use RGB. Reversing red and blue can silently damage a trained model. `model.eval()` changes dropout/normalization behavior; `torch.inference_mode()` turns off gradient bookkeeping. They serve different purposes.

## Make a reproducible workspace

Downloaded datasets live in `course/practical/data`; outputs in `course/practical/runs`. Both are ignored by Git. Each experiment gets a new directory. Save your Python/package versions and the complete command. CPU is the default; passing `--device cuda` requires a compatible CUDA installation. Start small before increasing data or model size.

## Check your understanding

Change the image to grayscale and predict the channel dimension. Explain why a classification target is not a float image. Explain why a successful import is different from a successful training run. Save the environment output and tensor observations in your lab notes.

## If something fails

`No module named course` means you are probably outside the repository root. A missing `torchvision::nms` operator usually indicates incompatible torch/torchvision builds; reinstall them as a matched pair using the [official installer](https://pytorch.org/get-started/locally/). Reduce batch size on out-of-memory errors. First downloads require internet; the original maths course remains usable offline.
