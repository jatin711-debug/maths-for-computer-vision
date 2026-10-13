"""Small, explicit utilities shared by the training and inference labs."""
import hashlib
import json
import random
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
RUNS = ROOT / "runs"


def setup(seed=7, device="cpu"):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.set_num_threads(min(4, torch.get_num_threads()))
    if device == "cuda" and not torch.cuda.is_available():
        raise ValueError("CUDA is unavailable. Use --device cpu or install a compatible CUDA build.")
    # Repeatability within the same software/hardware environment, not bitwise portability.
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True
    return torch.device(device)


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def environment():
    import platform
    import torchvision
    return {"python": platform.python_version(), "torch": str(torch.__version__),
            "torchvision": str(torchvision.__version__), "numpy": np.__version__}


def positive(value):
    import argparse
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("Must be a positive integer")
    return number


def load_checkpoint(path):
    return torch.load(path, map_location="cpu", weights_only=True)


def prepare_run(path, resume=False):
    path = Path(path)
    if path.exists() and any(path.iterdir()) and not resume:
        raise ValueError(f"{path} is not empty. Use a new --run directory or --resume.")
    path.mkdir(parents=True, exist_ok=True)
    return path
