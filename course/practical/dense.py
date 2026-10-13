"""Person detection and binary segmentation on PennFudan photographs."""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw
from torch import nn
from torch.utils.data import DataLoader
from torchvision.models.detection import (FasterRCNN_MobileNet_V3_Large_320_FPN_Weights,
                                           fasterrcnn_mobilenet_v3_large_320_fpn)
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.ops import box_iou

from .common import DATA, RUNS, environment, fingerprint, load_checkpoint, positive, prepare_run, setup, write_json
from .data import PennData, penn_records


class TinyUNet(nn.Module):
    """Two-resolution encoder/decoder; concatenation preserves fine spatial features."""
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(nn.Conv2d(3, 16, 3, padding=1), nn.ReLU(),
                                     nn.Conv2d(16, 16, 3, padding=1), nn.ReLU())
        self.low = nn.Sequential(nn.MaxPool2d(2), nn.Conv2d(16, 32, 3, padding=1), nn.ReLU())
        self.decoder = nn.Sequential(nn.Conv2d(48, 16, 3, padding=1), nn.ReLU(), nn.Conv2d(16, 1, 1))

    def forward(self, x):
        skip = self.encoder(x)
        low = nn.functional.interpolate(self.low(skip), size=skip.shape[-2:], mode="bilinear", align_corners=False)
        return self.decoder(torch.cat([skip, low], dim=1))


def detector(pretrained=False, size=320):
    weights = FasterRCNN_MobileNet_V3_Large_320_FPN_Weights.DEFAULT if pretrained else None
    model = fasterrcnn_mobilenet_v3_large_320_fpn(weights=weights, weights_backbone=None,
                                                min_size=size, max_size=size*2)
    model.roi_heads.box_predictor = FastRCNNPredictor(model.roi_heads.box_predictor.cls_score.in_features, 2)
    return model


def collate(batch):
    images, targets, names = zip(*batch)
    return list(images), list(targets), list(names)


def ap50(predictions, targets):
    """Single-class all-points interpolated AP at IoU .50, NOT COCO mAP."""
    total = sum(len(t["boxes"]) for t in targets)
    ranked = []
    for image_id, pred in enumerate(predictions):
        for box, score, label in zip(pred["boxes"], pred["scores"], pred["labels"]):
            if int(label) == 1:
                ranked.append((float(score), image_id, box))
    ranked.sort(key=lambda row: -row[0])
    if not total:
        return {"ap50": None, "ground_truth": 0, "predictions": len(ranked)}
    matched = [set() for _ in targets]
    tp, fp = [], []
    for _, image_id, box in ranked:
        gt = targets[image_id]["boxes"]
        candidates = [j for j in range(len(gt)) if j not in matched[image_id]]
        found = False
        if candidates:
            overlaps = box_iou(box.reshape(1, 4).cpu(), gt[candidates].cpu())[0]
            best = int(overlaps.argmax())
            if overlaps[best] >= .5:
                matched[image_id].add(candidates[best])
                found = True
        tp.append(int(found))
        fp.append(int(not found))
    tp, fp = np.cumsum(tp), np.cumsum(fp)
    recall = tp/total
    precision = tp/np.maximum(tp+fp, 1)
    r = np.r_[0., recall, 1.]
    p = np.r_[0., precision, 0.]
    p = np.maximum.accumulate(p[::-1])[::-1]
    change = np.where(r[1:] != r[:-1])[0]
    area = float(np.sum((r[change+1]-r[change])*p[change+1]))
    return {"ap50": area, "ground_truth": total, "predictions": len(ranked),
            "precision": precision.tolist(), "recall": recall.tolist(),
            "convention": "one class; score-ranked one-to-one matching; all-points precision envelope; IoU >= .50"}


def segmentation_metrics(tp, fp, fn, tn):
    union = tp+fp+fn
    return {"foreground_iou": tp/union if union else None,
            "foreground_dice": 2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None,
            "pixel_accuracy": (tp+tn)/(tp+fp+fn+tn), "tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "empty_policy": "null when foreground union is empty; pooled pixel counts across images"}


def overlay(image, pred, target, task, path):
    array = (image.cpu().permute(1, 2, 0).numpy()*255).clip(0, 255).astype(np.uint8)
    canvas = Image.fromarray(array)
    if task == "detect":
        draw = ImageDraw.Draw(canvas)
        for box in target["boxes"]:
            draw.rectangle(box.tolist(), outline="lime", width=2)
        for box, score in zip(pred["boxes"], pred["scores"]):
            if float(score) >= .5:
                draw.rectangle(box.tolist(), outline="red", width=2)
                draw.text(tuple(box[:2].tolist()), f"{float(score):.2f}", fill="red")
    else:
        out = np.array(canvas).copy()
        truth, predicted = target.squeeze().numpy().astype(bool), pred.squeeze().numpy().astype(bool)
        # Green=true foreground; red=false positive; blue=missed foreground.
        for mask, colour in [(truth & predicted, [0,255,0]), (~truth & predicted, [255,0,0]), (truth & ~predicted, [0,80,255])]:
            out[mask] = (.5*out[mask]+.5*np.array(colour)).astype(np.uint8)
        canvas = Image.fromarray(out)
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path)


def evaluate(model, loader, device, task, out=None):
    model.eval()
    predictions, targets = [], []
    counts = np.zeros(4, dtype=np.int64)
    rows = []
    with torch.inference_mode():
        for images, truth, names in loader:
            if task == "detect":
                output = model([im.to(device) for im in images])
                output = [{k: v.cpu() for k, v in p.items()} for p in output]
                predictions.extend(output)
                targets.extend(truth)
                for name, p, t in zip(names, output, truth):
                    rows.append({"image": name, "boxes": p["boxes"].tolist(), "scores": p["scores"].tolist(),
                                 "labels": p["labels"].tolist(), "target_boxes": t["boxes"].tolist()})
            else:
                output = model(torch.stack(images).to(device)).sigmoid().cpu() >= .5
                for name, p, t in zip(names, output, truth):
                    t = t.bool()
                    c = np.array([int((p&t).sum()), int((p&~t).sum()), int((~p&t).sum()), int((~p&~t).sum())])
                    counts += c
                    rows.append({"image": name, **segmentation_metrics(*map(int, c))})
            if out:
                for im, p, t, name in zip(images, output, truth, names):
                    overlay(im, p, t, task, out/"overlays"/name)
    report = ap50(predictions, targets) if task == "detect" else segmentation_metrics(*map(int, counts))
    if task == "segment":
        tp, fp, fn, tn = map(int, counts)
        report["all_background_baseline"] = segmentation_metrics(0, 0, tp+fn, tn+fp)
        report["threshold"] = .5
    report["images"] = rows
    report["n"] = len(rows)
    return report


def datasets(args):
    folder, records = penn_records(args.data, args.seed, args.download)
    chosen = [r for r in records if r["split"] == args.split]
    if args.limit:
        chosen = chosen[:args.limit]
    return PennData(folder, chosen, args.task, args.size, args.command == "train" and args.augment), records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["train", "evaluate"])
    parser.add_argument("--task", choices=["detect", "segment"], required=True)
    parser.add_argument("--data", type=Path, default=DATA)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--pretrained", action="store_true", help="Download COCO detection weights (~75 MB)")
    parser.add_argument("--augment", action="store_true")
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--size", type=positive, default=128, help="Segmentation square size or detector minimum side")
    parser.add_argument("--limit", type=positive, help="Small smoke-run subset, per split; omit for full split")
    parser.add_argument("--batch-size", type=positive, default=2)
    parser.add_argument("--epochs", type=positive, default=3)
    parser.add_argument("--lr", type=float, default=.001)
    parser.add_argument("--split", choices=["val", "test"], default="val", help="Evaluation only")
    parser.add_argument("--checkpoint", type=Path)
    parser.add_argument("--run", type=Path, default=RUNS/"dense")
    args = parser.parse_args()
    if args.size < 32 or args.lr <= 0:
        parser.error("Use --size >= 32 and --lr > 0")
    if args.command == "train" and args.checkpoint:
        parser.error("This lab starts a new run; --checkpoint is for evaluate. Classifier lab demonstrates resume.")
    if args.task == "segment" and args.pretrained:
        parser.error("TinyUNet is trained from scratch; --pretrained applies to detect.")
    device = setup(args.seed, args.device)
    run = prepare_run(args.run)
    ck = None
    if args.command == "evaluate":
        if not args.checkpoint:
            parser.error("evaluate requires --checkpoint")
        ck = load_checkpoint(args.checkpoint)
        if ck["task"] != args.task:
            parser.error("Checkpoint task differs")
        args.size, args.seed = ck["size"], ck["seed"]
    model = (detector(args.pretrained and ck is None, args.size) if args.task == "detect" else TinyUNet()).to(device)
    if ck:
        model.load_state_dict(ck["model"])
        ds, records = datasets(args)
        if ck["data_hash"] != fingerprint(records):
            raise ValueError("Dataset filenames/splits changed since training.")
        report = evaluate(model, DataLoader(ds, batch_size=args.batch_size, collate_fn=collate), device, args.task, run)
        report["split"] = args.split
        write_json(run/"metrics.json", report)
        print(f"Saved metrics and overlays to {run}")
        return
    args.split = "train"
    train_ds, records = datasets(args)
    args.split = "val"
    val_ds, _ = datasets(args)
    val_ds.augment = False
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=collate)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, collate_fn=collate)
    write_json(run/"protocol.json", {"records": records, "train_used": train_ds.records, "val_used": val_ds.records,
                                    "task": args.task, "size": args.size, "seed": args.seed, "lr": args.lr,
                                    "pretrained": args.pretrained, "augment": args.augment, "environment": environment(),
                                    "limitation": "Educational image split; no person/scene identity independence guarantee."})
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    history, best = [], -1.
    for epoch in range(args.epochs):
        model.train()
        loss_sum, seen = 0., 0
        for images, targets, _ in train_loader:
            optimizer.zero_grad(set_to_none=True)
            if args.task == "detect":
                # Detection has variable numbers of boxes, so batches remain lists.
                losses = model([im.to(device) for im in images], [{k: v.to(device) for k, v in t.items()} for t in targets])
                loss = sum(losses.values())
            else:
                logits = model(torch.stack(images).to(device))
                loss = nn.functional.binary_cross_entropy_with_logits(logits, torch.stack(targets).to(device))
            if not torch.isfinite(loss):
                raise ValueError("Nonfinite training loss; inspect targets and learning rate.")
            loss.backward()
            optimizer.step()
            loss_sum += float(loss.detach())*len(images)
            seen += len(images)
        report = evaluate(model, val_loader, device, args.task)
        metric = report["ap50" if args.task == "detect" else "foreground_iou"]
        history.append({"epoch": epoch+1, "train_loss": loss_sum/seen, "validation_metric": metric})
        if metric is not None and metric > best:
            best = metric
            torch.save({"model": model.state_dict(), "task": args.task, "size": args.size, "seed": args.seed,
                        "data_hash": fingerprint(records)}, run/"best.pt")
        write_json(run/"history.json", history)
        print(json.dumps(history[-1]), flush=True)
    model.load_state_dict(load_checkpoint(run/"best.pt")["model"])
    report = evaluate(model, val_loader, device, args.task, run)
    report["split"] = "val"
    write_json(run/"metrics.json", report)
    print(f"Saved {run}; thresholded overlays are illustrations, AP uses all returned detections.")


if __name__ == "__main__":
    main()
