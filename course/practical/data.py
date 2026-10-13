"""Dataset preparation, auditable splits, and joint spatial transformations."""
import argparse
import csv
import hashlib
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps
from torch.utils.data import Dataset
from torchvision.datasets import CIFAR10
from torchvision.datasets.utils import download_and_extract_archive
from torchvision.transforms import functional as TF

from .common import DATA, fingerprint, write_json

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def rgb(path):
    with Image.open(path) as image:
        return ImageOps.exif_transpose(image).convert("RGB")


def stratified_split(labels, seed=7):
    """Stable 80/20 development split; test data must be provided separately."""
    rng = np.random.default_rng(seed)
    train, val = [], []
    for label in sorted(set(labels)):
        ids = np.flatnonzero(np.array(labels) == label)
        if len(ids) < 2:
            raise ValueError(f"Class {label} needs at least two images for train/validation.")
        rng.shuffle(ids)
        n = max(1, int(len(ids) * .2))
        val.extend(ids[:n].tolist())
        train.extend(ids[n:].tolist())
    return sorted(train), sorted(val)


def cap_per_class(ids, labels, limit, seed=7):
    if limit is None:
        return list(ids)
    rng = np.random.default_rng(seed)
    result = []
    for label in sorted(set(labels)):
        candidates = [i for i in ids if labels[i] == label]
        rng.shuffle(candidates)
        result.extend(candidates[:limit])
    return sorted(result)


def cifar(root=DATA, split="train", download=False, limit=None, seed=7):
    ds = CIFAR10(str(root), train=split != "test", download=download)
    ids = list(range(len(ds)))
    if split != "test":
        train, val = stratified_split(ds.targets, seed)
        ids = train if split == "train" else val
    ids = cap_per_class(ids, ds.targets, limit, seed)
    records = [{"id": f"cifar10/{'test' if split == 'test' else 'train'}/{i}",
                "label": int(ds.targets[i]), "index": i} for i in ids]
    return ds, records


def audit_folder(root, groups=None):
    """Inspect root/class/image files without changing them; detect decoded duplicates."""
    root = Path(root).resolve()
    group_map = {}
    if groups:
        with Path(groups).open(newline="", encoding="utf-8-sig") as stream:
            for row in csv.DictReader(stream):
                if not row.get("path") or not row.get("group"):
                    raise ValueError("Group CSV needs path,group columns with nonempty values.")
                group_map[row["path"].replace("\\", "/")] = row["group"]
    classes = sorted(p.name for p in root.iterdir() if p.is_dir())
    records, corrupt = [], []
    for label, name in enumerate(classes):
        for path in sorted((root / name).rglob("*")):
            if path.suffix.lower() not in IMAGE_SUFFIXES or not path.is_file():
                continue
            rel = path.relative_to(root).as_posix()
            try:
                image = rgb(path)
                digest = hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()
                records.append({"path": rel, "label": label, "class": name,
                                "width": image.width, "height": image.height,
                                "sha256": digest, "group": group_map.get(rel, rel)})
            except (OSError, ValueError) as error:
                corrupt.append({"path": rel, "error": str(error)})
    buckets = defaultdict(list)
    for r in records:
        buckets[r["sha256"]].append(r["path"])
    missing_groups = [r["path"] for r in records if groups and r["path"] not in group_map]
    return {"root": str(root), "classes": classes, "records": records, "corrupt": corrupt,
            "counts": dict(Counter(r["class"] for r in records)), "missing_groups": missing_groups,
            "duplicates": [v for v in buckets.values() if len(v) > 1],
            "note": "Exact decoded RGB duplicates only; visually review near-duplicates separately."}


def grouped_split(records, seed=7):
    """Group-aware 60/20/20 split. Reject duplicates to avoid silent cross-group leakage."""
    if len({r["sha256"] for r in records}) != len(records):
        raise ValueError("Resolve duplicate images before splitting (see audit report).")
    groups = sorted({r["group"] for r in records})
    if len(groups) < 5:
        raise ValueError("Use at least five independent groups; more are needed for useful estimates.")
    np.random.default_rng(seed).shuffle(groups)
    n = max(1, len(groups) // 5)
    lookup = {g: "test" if i < n else "val" if i < 2*n else "train" for i, g in enumerate(groups)}
    result = [{**r, "split": lookup[r["group"]]} for r in records]
    labels = {r["label"] for r in records}
    for split in ("train", "val", "test"):
        if {r["label"] for r in result if r["split"] == split} != labels:
            raise ValueError(f"{split} is missing a class. Collect more independent groups or revise the group assignment.")
    return result


def validate_manifest(manifest):
    """Reject edited manifests that mix groups, repeat pixels, or change label meaning."""
    classes, records = manifest["classes"], manifest["records"]
    if not classes or len(set(classes)) != len(classes) or not records:
        raise ValueError("Manifest needs unique classes and nonempty records.")
    if manifest.get("fingerprint") != fingerprint(records):
        raise ValueError("Manifest changed since splitting. Rebuild it with data --split.")
    paths, hashes, groups = set(), set(), {}
    for record in records:
        label, split = record["label"], record.get("split")
        if type(label) is not int or not 0 <= label < len(classes) or record.get("class") != classes[label]:
            raise ValueError("Manifest class labels differ from the saved class order.")
        if split not in ("train", "val", "test") or not record.get("group"):
            raise ValueError("Every manifest record needs a split and an independent group.")
        if record["path"] in paths or record["sha256"] in hashes:
            raise ValueError("Resolve duplicate images before using the manifest.")
        group = record["group"]
        if group in groups and groups[group] != split:
            raise ValueError("An independent group crosses dataset splits.")
        paths.add(record["path"])
        hashes.add(record["sha256"])
        groups[group] = split
    for split in ("train", "val", "test"):
        if {r["label"] for r in records if r["split"] == split} != set(range(len(classes))):
            raise ValueError(f"{split} is missing a class. Rebuild the audited split.")


class ClassificationData(Dataset):
    def __init__(self, source, records, transform):
        self.source, self.records, self.transform = source, records, transform

    def __len__(self):
        return len(self.records)

    def __getitem__(self, index):
        record = self.records[index]
        image = self.source[record["index"]][0] if "index" in record else rgb(Path(self.source) / record["path"])
        return self.transform(image), record["label"], record.get("id", record.get("path"))


def penn_root(root=DATA, download=False):
    root = Path(root)
    folder = root / "PennFudanPed"
    if download and not folder.exists():
        download_and_extract_archive("https://www.cis.upenn.edu/~jshi/ped_html/PennFudanPed.zip",
                                     str(root), md5="5aaa3dee905cef73325923716e38fc6d")
    if not (folder / "PNGImages").is_dir():
        raise FileNotFoundError("PennFudan is missing. Run the documented command with --download once.")
    return folder


def penn_records(root=DATA, seed=7, download=False):
    folder = penn_root(root, download)
    paths = sorted((folder / "PNGImages").glob("*.png"))
    # PennFudan has scene prefixes but no reliable person/sequence grouping metadata.
    # This is a fixed educational image split, not evidence of new-camera generalization.
    order = np.random.default_rng(seed).permutation(len(paths))
    a, b = int(.6*len(paths)), int(.8*len(paths))
    split_ids = {int(idx): "train" if j < a else "val" if j < b else "test" for j, idx in enumerate(order)}
    return folder, [{"path": p.name, "split": split_ids[i]} for i, p in enumerate(paths)]


def mask_target(mask):
    array = np.asarray(mask)
    ids = np.unique(array)
    masks, boxes = [], []
    for value in ids[ids != 0]:
        binary = array == value
        y, x = np.where(binary)
        if not len(x):
            continue
        masks.append(binary)
        # Continuous boundaries include the entire last foreground pixel.
        boxes.append([x.min(), y.min(), x.max()+1, y.max()+1])
    h, w = array.shape
    return {"boxes": torch.tensor(boxes, dtype=torch.float32).reshape(-1, 4),
            "labels": torch.ones(len(boxes), dtype=torch.int64),
            "masks": torch.tensor(np.array(masks), dtype=torch.uint8).reshape(-1, h, w)}


def flip_target(image, target):
    width = image.shape[-1]
    result = {k: v.clone() for k, v in target.items()}
    result["boxes"][:, [0, 2]] = width - target["boxes"][:, [2, 0]]
    result["masks"] = target["masks"].flip(-1)
    return image.flip(-1), result


class PennData(Dataset):
    def __init__(self, folder, records, task="detect", size=128, augment=False):
        self.folder, self.records = Path(folder), records
        self.task, self.size, self.augment = task, size, augment

    def __len__(self):
        return len(self.records)

    def __getitem__(self, index):
        name = self.records[index]["path"]
        image = TF.to_tensor(rgb(self.folder / "PNGImages" / name))
        with Image.open(self.folder / "PedMasks" / (Path(name).stem + "_mask.png")) as mask:
            target = mask_target(mask)
        if self.augment and torch.rand(()) < .5:
            image, target = flip_target(image, target)
        if self.task == "segment":
            image = TF.resize(image, [self.size, self.size], antialias=True)
            binary = target["masks"].any(dim=0).float()[None]
            binary = TF.resize(binary, [self.size, self.size], interpolation=TF.InterpolationMode.NEAREST)
            return image, binary, name
        return image, target, name


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("root", type=Path, help="Folder containing one subdirectory per class")
    p.add_argument("--groups", type=Path, help="CSV with path,group; keep each subject/video/source together")
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--split", action="store_true")
    p.add_argument("--seed", type=int, default=7)
    a = p.parse_args()
    report = audit_folder(a.root, a.groups)
    write_json(a.out, report)
    if a.split:
        if report["corrupt"] or report["missing_groups"]:
            raise ValueError("Resolve corrupt images or missing groups in the saved audit first.")
        report["records"] = grouped_split(report["records"], a.seed)
        report["seed"] = a.seed
        report["fingerprint"] = fingerprint(report["records"])
        write_json(a.out, report)
    print(f"Saved {a.out}: {len(report['records'])} images; {len(report['duplicates'])} duplicate groups; {len(report['corrupt'])} unreadable.")


if __name__ == "__main__":
    main()
