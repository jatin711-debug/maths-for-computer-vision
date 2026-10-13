"""Optional CLIP text-to-image retrieval and point-prompted SAM segmentation."""
import argparse
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from .common import RUNS, prepare_run, setup, write_json
from .data import IMAGE_SUFFIXES, rgb


def clip(args, device, out):
    from transformers import CLIPModel, CLIPProcessor
    model_id = "openai/clip-vit-base-patch32"
    processor = CLIPProcessor.from_pretrained(model_id, local_files_only=not args.download)
    model = CLIPModel.from_pretrained(model_id, local_files_only=not args.download).to(device).eval()
    paths = sorted(p for p in args.images.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES and p.is_file())
    if not paths:
        raise ValueError("The image folder is empty (put photos directly in this folder).")
    features = []
    with torch.inference_mode():
        for start in range(0, len(paths), 8):
            batch = processor(images=[rgb(p) for p in paths[start:start+8]], return_tensors="pt").to(device)
            embedding = model.get_image_features(**batch)
            features.append(torch.nn.functional.normalize(embedding, dim=-1).cpu())
        batch = processor(text=args.text, padding=True, return_tensors="pt").to(device)
        text = torch.nn.functional.normalize(model.get_text_features(**batch), dim=-1).cpu()
    similarity = text @ torch.cat(features).T
    report = {"model": model_id, "score": "cosine similarity, not probability",
              "queries": [{"text": query, "ranking": [{"image": str(paths[i]), "cosine": float(scores[i])}
                                                        for i in scores.argsort(descending=True).tolist()]}
                          for query, scores in zip(args.text, similarity)]}
    write_json(out/"retrieval.json", report)


def sam(args, device, out):
    from transformers import SamModel, SamProcessor
    model_id = "facebook/sam-vit-base"
    processor = SamProcessor.from_pretrained(model_id, local_files_only=not args.download)
    model = SamModel.from_pretrained(model_id, local_files_only=not args.download).to(device).eval()
    image = rgb(args.image)
    x, y = args.point
    if not (0 <= x < image.width and 0 <= y < image.height):
        raise ValueError("Point must be inside the EXIF-oriented image in original pixel coordinates.")
    inputs = processor(image, input_points=[[[x,y]]], input_labels=[[1]], return_tensors="pt").to(device)
    with torch.inference_mode():
        output = model(**inputs)
    masks = processor.image_processor.post_process_masks(output.pred_masks.cpu(), inputs["original_sizes"].cpu(), inputs["reshaped_input_sizes"].cpu())[0][0]
    scores = output.iou_scores[0,0].cpu()
    index = int(scores.argmax())
    mask = masks[index].numpy().astype(bool)
    Image.fromarray(mask.astype(np.uint8)*255).save(out/"mask.png")
    array = np.array(image)
    array[mask] = (.55*array[mask]+.45*np.array([0,255,0])).astype(np.uint8)
    Image.fromarray(array).save(out/"overlay.jpg")
    report = {"model": model_id, "point_xy": [x,y], "selected_candidate": index,
              "predicted_quality": float(scores[index]), "note": "Predicted quality is a model estimate, not a measured ground-truth IoU."}
    if args.mask:
        with Image.open(args.mask) as truth_image:
            truth = np.asarray(truth_image.convert("L")) > 0
        if truth.shape != mask.shape:
            raise ValueError("Ground-truth mask must have the oriented image's original dimensions.")
        union = int((mask | truth).sum())
        report["measured_iou"] = int((mask & truth).sum())/union if union else None
    write_json(out/"prompt.json", report)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["clip", "sam"])
    parser.add_argument("--images", type=Path)
    parser.add_argument("--text", nargs="+")
    parser.add_argument("--image", type=Path)
    parser.add_argument("--point", nargs=2, type=float)
    parser.add_argument("--mask", type=Path, help="Optional aligned binary ground-truth mask")
    parser.add_argument("--download", action="store_true", help="Allow model downloads; otherwise use local cache only")
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    parser.add_argument("--run", type=Path, default=RUNS/"foundation")
    args = parser.parse_args()
    if args.command == "clip" and (args.images is None or not args.text):
        parser.error("clip needs --images FOLDER and --text 'query' ['second query']")
    if args.command == "sam" and (args.image is None or args.point is None):
        parser.error("sam needs --image FILE and --point X Y")
    device = setup(device=args.device)
    out = prepare_run(args.run)
    {"clip": clip, "sam": sam}[args.command](args, device, out)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
