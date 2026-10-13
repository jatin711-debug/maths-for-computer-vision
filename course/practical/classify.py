"""Train, resume, evaluate and deploy a real-image classifier."""
import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw
from torch import nn
from torch.utils.data import DataLoader
from torchvision import models, transforms as T

from .common import DATA, RUNS, environment, fingerprint, load_checkpoint, positive, prepare_run, setup, write_json
from .data import ClassificationData, cifar, rgb, validate_manifest


class SmallCNN(nn.Module):
    def __init__(self, classes):
        super().__init__()
        self.layers = nn.Sequential(nn.Conv2d(3, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
                                    nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(),
                                    nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(32, classes))

    def forward(self, x):
        return self.layers(x)


def build_model(architecture, classes, pretrained=False):
    if architecture == "small":
        return SmallCNN(classes)
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if pretrained else None)
    model.fc = nn.Linear(model.fc.in_features, classes)
    return model


def preprocessing(architecture):
    return {"size": 64 if architecture == "small" else 224,
            "mean": [.485, .456, .406], "std": [.229, .224, .225],
            "resize": "square-bilinear", "colour": "RGB"}


def transform(config, augment=False):
    operations = [T.Resize((config["size"], config["size"]), antialias=True)]
    if augment:
        operations.append(T.RandomHorizontalFlip())
    return T.Compose(operations + [T.ToTensor(), T.Normalize(config["mean"], config["std"])])


def dataset(args, split, config, augment=False):
    if args.manifest:
        manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
        validate_manifest(manifest)
        records = [r for r in manifest["records"] if r.get("split") == split]
        if not records:
            raise ValueError(f"Manifest has no {split} records; prepare it with data --split.")
        source, classes = manifest["root"], manifest["classes"]
        # Validate content on use; edited files must not silently reuse a saved protocol.
        import hashlib
        for record in records:
            image = rgb(Path(source) / record["path"])
            digest = hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()
            if digest != record["sha256"]:
                raise ValueError(f"Image changed since audit: {record['path']}. Rebuild the manifest.")
    else:
        source, records = cifar(args.data, split, args.download, args.per_class, args.seed)
        classes = source.classes
    return ClassificationData(source, records, transform(config, augment)), classes


def evaluate(model, loader, device, classes):
    model.eval()
    confusion = torch.zeros((len(classes), len(classes)), dtype=torch.int64)
    total_loss, rows = 0., []
    with torch.inference_mode():
        for images, labels, ids in loader:
            logits = model(images.to(device))
            total_loss += nn.functional.cross_entropy(logits, labels.to(device), reduction="sum").item()
            probs = logits.softmax(1).cpu()
            predictions = probs.argmax(1)
            for label, pred, prob, name in zip(labels, predictions, probs, ids):
                confusion[label, pred] += 1
                rows.append({"image": name, "label": int(label), "prediction": int(pred),
                             "confidence": float(prob[pred])})
    n = len(rows)
    recall = [float(confusion[i, i] / confusion[i].sum()) if confusion[i].sum() else None
              for i in range(len(classes))]
    valid = [v for v in recall if v is not None]
    return {"n": n, "loss": total_loss/n, "accuracy": float(confusion.trace())/n,
            "balanced_accuracy": sum(valid)/len(valid), "classes": classes,
            "confusion_rows_true_columns_predicted": confusion.tolist(), "per_class_recall": recall,
            "predictions": rows}


def failure_sheet(ds, report, path):
    failures = sorted((r for r in report["predictions"] if r["label"] != r["prediction"]),
                      key=lambda r: -r["confidence"])[:12]
    if not failures:
        Path(path).unlink(missing_ok=True)
        return
    lookup = {r.get("id", r.get("path")): r for r in ds.records}
    sheet = Image.new("RGB", (4*180, ((len(failures)+3)//4)*155), "white")
    draw = ImageDraw.Draw(sheet)
    for i, row in enumerate(failures):
        record = lookup[row["image"]]
        im = ds.source[record["index"]][0] if "index" in record else rgb(Path(ds.source)/record["path"])
        x, y = (i % 4)*180, (i//4)*155
        sheet.paste(ImageOps_fit(im, (176, 110)), (x, y))
        draw.text((x+2, y+112), f"True: {report['classes'][row['label']]}\nPred: {report['classes'][row['prediction']]} {row['confidence']:.2f}", fill="black")
    sheet.save(path)


def ImageOps_fit(image, size):
    from PIL import ImageOps
    return ImageOps.contain(image, size)


def train(args):
    device = setup(args.seed, args.device)
    run = prepare_run(args.run, bool(args.resume))
    checkpoint = load_checkpoint(args.resume) if args.resume else None
    if args.pretrained and args.arch != "resnet18":
        raise ValueError("--pretrained requires --arch resnet18")
    if args.freeze and args.arch != "resnet18":
        raise ValueError("--freeze requires --arch resnet18")
    config = preprocessing(args.arch)
    train_ds, classes = dataset(args, "train", config, args.augment)
    val_ds, val_classes = dataset(args, "val", config)
    assert classes == val_classes
    protocol = {"train": train_ds.records, "val": val_ds.records, "classes": classes,
                "preprocessing": config, "arch": args.arch, "freeze": args.freeze,
                "augment": args.augment, "seed": args.seed, "batch_size": args.batch_size, "lr": args.lr}
    signature = fingerprint(protocol)
    if checkpoint and checkpoint["protocol_hash"] != signature:
        raise ValueError("Resume settings or data differ. Reuse the original settings; use --init for a new fine-tuning stage.")
    model = build_model(args.arch, len(classes), args.pretrained and not (checkpoint or args.init)).to(device)
    if args.init:
        initial = load_checkpoint(args.init)
        if initial["classes"] != classes or initial["arch"] != args.arch:
            raise ValueError("Initialization model architecture/classes differ.")
        model.load_state_dict(initial["model"])
    if args.freeze:
        for param in model.parameters():
            param.requires_grad = False
        for param in model.fc.parameters():
            param.requires_grad = True
    optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=args.lr)
    generator = torch.Generator().manual_seed(args.seed)
    history, start, best = [], 0, -1.
    best_model = None
    if checkpoint:
        model.load_state_dict(checkpoint["model"])
        optimizer.load_state_dict(checkpoint["optimizer"])
        start, best, history = checkpoint["epoch"], checkpoint["best"], checkpoint["history"]
        best_model = checkpoint["best_model"]
        generator.set_state(checkpoint["loader_rng"])
        torch.set_rng_state(checkpoint["torch_rng"])
        if device.type == "cuda" and checkpoint.get("cuda_rng"):
            torch.cuda.set_rng_state_all(checkpoint["cuda_rng"])
    if args.epochs <= start:
        raise ValueError("--epochs is the total epoch target; it must exceed the saved epoch.")
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, generator=generator, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, num_workers=0)
    counts = np.bincount([r["label"] for r in train_ds.records], minlength=len(classes))
    majority = int(counts.argmax())
    baseline = sum(r["label"] == majority for r in val_ds.records)/len(val_ds)
    write_json(run/"protocol.json", {**protocol, "hash": signature, "environment": environment(),
                                      "majority_class": classes[majority], "majority_val_accuracy": baseline})
    for epoch in range(start, args.epochs):
        model.train()
        if args.freeze:
            # Frozen parameters alone do not freeze BatchNorm running statistics.
            model.eval()
            model.fc.train()
        loss_sum, seen = 0., 0
        for images, labels, _ in train_loader:
            optimizer.zero_grad(set_to_none=True)
            logits = model(images.to(device))
            loss = nn.functional.cross_entropy(logits, labels.to(device))
            if not torch.isfinite(loss):
                raise ValueError("Nonfinite loss: inspect inputs and reduce learning rate.")
            loss.backward()
            optimizer.step()
            loss_sum += loss.item()*len(labels)
            seen += len(labels)
        report = evaluate(model, val_loader, device, classes)
        history.append({"epoch": epoch+1, "train_loss": loss_sum/seen, "val_loss": report["loss"],
                        "val_accuracy": report["accuracy"]})
        improved = report["accuracy"] > best
        if improved:
            best = report["accuracy"]
            best_model = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
        payload = {"model": model.state_dict(), "best_model": best_model, "optimizer": optimizer.state_dict(),
                   "arch": args.arch, "classes": classes, "preprocessing": config, "protocol_hash": signature,
                   "epoch": epoch+1, "best": best, "history": history, "loader_rng": generator.get_state(),
                   "torch_rng": torch.get_rng_state(),
                   "cuda_rng": torch.cuda.get_rng_state_all() if device.type == "cuda" else []}
        torch.save(payload, run/"last.pt")
        # Best is an inference artifact; last contains the optimizer and RNGs for resume.
        torch.save({"model": best_model, "arch": args.arch, "classes": classes,
                    "preprocessing": config, "protocol_hash": signature}, run/"best.pt")
        write_json(run/"history.json", history)
        print(json.dumps(history[-1]), flush=True)
    model.load_state_dict(best_model)
    report = evaluate(model, val_loader, device, classes)
    write_json(run/"validation.json", report)
    failure_sheet(val_ds, report, run/"failures.jpg")
    print(f"Saved {run}. Best validation accuracy {best:.3f}; majority baseline {baseline:.3f}.")


def restore(path, device):
    checkpoint = load_checkpoint(path)
    model = build_model(checkpoint["arch"], len(checkpoint["classes"])).to(device)
    model.load_state_dict(checkpoint["model"])
    model.eval()
    return model, checkpoint


def score(args):
    device = setup(args.seed, args.device)
    model, ck = restore(args.checkpoint, device)
    ds, classes = dataset(args, args.split, ck["preprocessing"])
    if classes != ck["classes"]:
        raise ValueError("Dataset class order differs from the saved model.")
    report = evaluate(model, DataLoader(ds, batch_size=args.batch_size), device, classes)
    report["split"] = args.split
    report["records_hash"] = fingerprint(ds.records)
    report["checkpoint"] = str(args.checkpoint)
    write_json(args.out, report)
    failure_sheet(ds, report, args.out.with_suffix(".jpg"))
    print(f"{args.split}: n={report['n']}, accuracy={report['accuracy']:.3f}; {args.out}")


def predict(args):
    device = setup(device=args.device)
    model, ck = restore(args.checkpoint, device)
    image = rgb(args.image)
    tensor = transform(ck["preprocessing"])(image)[None].to(device)
    with torch.inference_mode():
        for _ in range(3):
            model(tensor)
        times = []
        for _ in range(args.repeats):
            if device.type == "cuda":
                torch.cuda.synchronize()
            start = time.perf_counter()
            probs = model(tensor).softmax(1)
            if device.type == "cuda":
                torch.cuda.synchronize()
            times.append((time.perf_counter()-start)*1000)
    values, indices = probs[0].cpu().topk(min(3, len(ck["classes"])))
    report = {"image": str(args.image), "predictions": [{"class": ck["classes"][i], "score": float(v)} for v, i in zip(values, indices)],
              "latency_ms_median": float(np.median(times)), "latency_ms_p95": float(np.percentile(times, 95)),
              "timing_scope": "batch 1 model forward + softmax; excludes decode, preprocessing and file IO; 3 warmups",
              "device": str(device), "environment": environment(), "preprocessing": ck["preprocessing"],
              "note": "Softmax scores are not calibrated probabilities of correctness; unknown classes are forced into the known labels."}
    write_json(args.out, report)
    print(json.dumps(report, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    for name in ("train", "evaluate", "predict"):
        s = sub.add_parser(name)
        s.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
        if name != "predict":
            s.add_argument("--data", type=Path, default=DATA)
            s.add_argument("--manifest", type=Path)
            s.add_argument("--download", action="store_true")
            s.add_argument("--per-class", type=positive, help="Optional balanced subset per split; omit for all images")
            s.add_argument("--seed", type=int, default=7)
            s.add_argument("--batch-size", type=positive, default=16)
        if name == "train":
            s.add_argument("--run", type=Path, default=RUNS/"classifier")
            s.add_argument("--epochs", type=positive, default=3)
            s.add_argument("--arch", choices=["small", "resnet18"], default="small")
            s.add_argument("--lr", type=float, default=.001)
            s.add_argument("--augment", action="store_true")
            s.add_argument("--pretrained", action="store_true", help="Download ImageNet weights for ResNet18")
            s.add_argument("--freeze", action="store_true", help="Train only the ResNet head; freeze BatchNorm too")
            group = s.add_mutually_exclusive_group()
            group.add_argument("--resume", type=Path, help="last.pt; restore optimizer, data order and RNG state")
            group.add_argument("--init", type=Path, help="Initialize from best.pt for a new experiment")
        else:
            s.add_argument("--checkpoint", type=Path, required=True)
            s.add_argument("--out", type=Path, required=True)
        if name == "evaluate":
            s.add_argument("--split", choices=["val", "test"], default="val")
        if name == "predict":
            s.add_argument("--image", type=Path, required=True)
            s.add_argument("--repeats", type=positive, default=20)
    args = p.parse_args()
    if args.command == "train" and args.lr <= 0:
        p.error("--lr must be positive")
    {"train": train, "evaluate": score, "predict": predict}[args.command](args)


if __name__ == "__main__":
    main()
