"""Download-free regression checks; fixtures are synthetic, not accuracy benchmarks."""
import contextlib
import copy
import csv
import io
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import cv2
import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.utils.data import DataLoader

from course.practical import classify, data, dense, opencv_lab, report
from course.practical.common import fingerprint, load_checkpoint, prepare_run, setup, write_json


def image_fixture(root):
    """Every independent capture group contains both labels and distinct pixels."""
    rows = []
    for label, name in enumerate(("blue", "red")):
        folder = root / name
        folder.mkdir(parents=True)
        for group in range(10):
            pixels = np.zeros((20, 24, 3), dtype=np.uint8)
            pixels[:, :, 2 if label == 0 else 0] = 140 + group * 8
            pixels[group:group+3, 2:7] = 255
            path = f"{name}/{group}.png"
            Image.fromarray(pixels).save(root / path)
            rows.append({"path": path, "group": f"capture-{group}"})
    groups = root / "groups.csv"
    with groups.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=["path", "group"])
        writer.writeheader()
        writer.writerows(rows)
    manifest = data.audit_folder(root, groups)
    manifest["records"] = data.grouped_split(manifest["records"])
    manifest["fingerprint"] = fingerprint(manifest["records"])
    path = root / "manifest.json"
    write_json(path, manifest)
    return path, manifest


class DataTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_group_split_is_disjoint_complete_and_repeatable(self):
        _, manifest = image_fixture(self.root)
        records = manifest["records"]
        self.assertEqual(records, data.grouped_split(records))
        self.assertEqual(len(records), 20)
        for split, count in (("train", 12), ("val", 4), ("test", 4)):
            chosen = [r for r in records if r["split"] == split]
            self.assertEqual(len(chosen), count)
            self.assertEqual({r["label"] for r in chosen}, {0, 1})
        self.assertEqual(len({r["group"] for r in records}), 10)
        data.validate_manifest(manifest)

    def test_decoded_duplicates_corruption_and_missing_groups(self):
        image_fixture(self.root)
        Image.open(self.root / "blue/0.png").save(self.root / "red/duplicate.bmp")
        (self.root / "red/broken.png").write_bytes(b"not an image")
        audit = data.audit_folder(self.root, self.root / "groups.csv")
        self.assertEqual(len(audit["duplicates"]), 1)
        self.assertEqual(audit["corrupt"][0]["path"], "red/broken.png")
        self.assertEqual(audit["missing_groups"], ["red/duplicate.bmp"])
        with self.assertRaisesRegex(ValueError, "duplicate"):
            data.grouped_split(audit["records"])

    def test_manifest_rejects_cross_split_groups_even_with_updated_hash(self):
        _, manifest = image_fixture(self.root)
        train = next(r for r in manifest["records"] if r["split"] == "train")
        val = next(r for r in manifest["records"] if r["split"] == "val")
        val["group"] = train["group"]
        manifest["fingerprint"] = fingerprint(manifest["records"])
        with self.assertRaisesRegex(ValueError, "crosses"):
            data.validate_manifest(manifest)

    def test_manifest_rejects_duplicate_pixels_and_changed_labels(self):
        _, manifest = image_fixture(self.root)
        changed = copy.deepcopy(manifest)
        changed["records"][1]["sha256"] = changed["records"][0]["sha256"]
        changed["fingerprint"] = fingerprint(changed["records"])
        with self.assertRaisesRegex(ValueError, "duplicate"):
            data.validate_manifest(changed)
        changed = copy.deepcopy(manifest)
        changed["records"][0]["label"] = 1
        changed["fingerprint"] = fingerprint(changed["records"])
        with self.assertRaisesRegex(ValueError, "class labels"):
            data.validate_manifest(changed)
        record = manifest["records"][0]
        record["split"] = "train" if record["split"] != "train" else "test"
        with self.assertRaisesRegex(ValueError, "changed since"):
            data.validate_manifest(manifest)

    def test_changed_image_rejected_before_training(self):
        path, manifest = image_fixture(self.root)
        record = next(r for r in manifest["records"] if r["split"] == "train")
        Image.new("RGB", (24, 20), "green").save(self.root / record["path"])
        with self.assertRaisesRegex(ValueError, "Image changed"):
            classify.dataset(SimpleNamespace(manifest=path), "train", classify.preprocessing("small"))

    def test_input_conversion_restores_exif_orientation_and_rgb_channels(self):
        image = Image.new("L", (3, 5), 128)
        exif = image.getexif()
        exif[274] = 6
        path = self.root / "rotated.png"
        image.save(path, exif=exif)
        converted = data.rgb(path)
        self.assertEqual(converted.mode, "RGB")
        self.assertEqual(converted.size, (5, 3))
        self.assertEqual(converted.getpixel((0, 0)), (128, 128, 128))

    def test_stratified_development_split_and_subset(self):
        labels = [0]*10 + [1]*10
        train, val = data.stratified_split(labels)
        self.assertFalse(set(train) & set(val))
        self.assertEqual(set(train) | set(val), set(range(20)))
        self.assertEqual([labels[i] for i in val].count(0), 2)
        self.assertEqual(len(data.cap_per_class(train, labels, 3)), 6)
        with self.assertRaisesRegex(ValueError, "at least two"):
            data.stratified_split([0, 1, 1])

    def test_cifar_official_test_is_separate_from_development(self):
        class FakeCifar:
            def __init__(self, root, train, download):
                self.train = train
                self.targets = [0]*10 + [1]*10 if train else [0]*3 + [1]*3
            def __len__(self):
                return len(self.targets)
        with patch.object(data, "CIFAR10", FakeCifar):
            _, train = data.cifar(self.root, "train")
            _, val = data.cifar(self.root, "val")
            source, test = data.cifar(self.root, "test")
        self.assertFalse(source.train)
        self.assertFalse({r["id"] for r in train} & {r["id"] for r in val})
        self.assertTrue(all(r["id"].startswith("cifar10/test/") for r in test))
        self.assertEqual(len(test), 6)

    def test_mask_boxes_include_last_pixel_and_joint_flip_is_invertible(self):
        array = np.zeros((8, 10), dtype=np.uint8)
        array[1:4, 2:6] = 1
        array[6, 9] = 2
        target = data.mask_target(Image.fromarray(array))
        self.assertEqual(target["boxes"].tolist(), [[2, 1, 6, 4], [9, 6, 10, 7]])
        image = torch.arange(240).reshape(3, 8, 10)
        flipped, truth = data.flip_target(image, target)
        self.assertEqual(truth["boxes"].tolist(), [[4, 1, 8, 4], [0, 6, 1, 7]])
        restored, truth = data.flip_target(flipped, truth)
        torch.testing.assert_close(restored, image)
        for key in target:
            torch.testing.assert_close(truth[key], target[key])
        empty = data.mask_target(Image.fromarray(np.zeros((8, 10), dtype=np.uint8)))
        self.assertEqual(tuple(empty["boxes"].shape), (0, 4))

    def test_segmentation_resize_preserves_binary_mask_alignment(self):
        folder = self.root / "penn"
        (folder / "PNGImages").mkdir(parents=True)
        (folder / "PedMasks").mkdir()
        pixels = np.zeros((16, 16, 3), dtype=np.uint8)
        pixels[:, 8:] = 255
        Image.fromarray(pixels).save(folder / "PNGImages/a.png")
        Image.fromarray((pixels[:, :, 0] > 0).astype(np.uint8)*2).save(folder / "PedMasks/a_mask.png")
        ds = data.PennData(folder, [{"path": "a.png"}], "segment", size=32, augment=True)
        with patch("torch.rand", return_value=torch.tensor(0.)):
            image, mask, _ = ds[0]
        self.assertEqual(set(mask.unique().tolist()), {0., 1.})
        torch.testing.assert_close(image[0] >= .5, mask[0].bool())


class MetricTests(unittest.TestCase):
    def test_detection_ap_duplicate_and_high_score_false_positive(self):
        pred = {"boxes": torch.tensor([[20., 20., 30., 30.], [0., 0., 10., 10.], [0., 0., 10., 10.]]),
                "scores": torch.tensor([.9, .8, .7]), "labels": torch.ones(3, dtype=torch.long)}
        truth = {"boxes": torch.tensor([[0., 0., 10., 10.]])}
        result = dense.ap50([pred], [truth])
        self.assertAlmostEqual(result["ap50"], .5)
        self.assertEqual(result["recall"], [0., 1., 1.])
        self.assertEqual(result["predictions"], 3)

    def test_detection_empty_predictions_missing_ground_truth_and_iou_boundary(self):
        empty = {"boxes": torch.empty(0, 4), "scores": torch.empty(0), "labels": torch.empty(0, dtype=torch.long)}
        truth = {"boxes": torch.tensor([[0., 0., 10., 10.]])}
        self.assertEqual(dense.ap50([empty], [truth])["ap50"], 0.)
        pred = {"boxes": torch.tensor([[0., 0., 5., 10.]]), "scores": torch.tensor([.8]), "labels": torch.tensor([1])}
        self.assertEqual(dense.ap50([pred], [truth])["ap50"], 1.)
        result = dense.ap50([pred], [{"boxes": torch.empty(0, 4)}])
        self.assertIsNone(result["ap50"])
        self.assertEqual(result["predictions"], 1)

    def test_segmentation_counts_and_empty_foreground_policy(self):
        result = dense.segmentation_metrics(3, 1, 2, 4)
        self.assertAlmostEqual(result["foreground_iou"], .5)
        self.assertAlmostEqual(result["foreground_dice"], 2/3)
        self.assertAlmostEqual(result["pixel_accuracy"], .7)
        empty = dense.segmentation_metrics(0, 0, 0, 10)
        self.assertIsNone(empty["foreground_iou"])
        self.assertIsNone(empty["foreground_dice"])

    def test_classification_confusion_and_balanced_accuracy(self):
        class Identity(nn.Module):
            def forward(self, x):
                return x
        inputs = torch.tensor([[4., 0.], [4., 0.], [0., 4.], [0., 4.]])
        labels = torch.tensor([0, 0, 0, 1])
        ds = [(inputs[i], labels[i], str(i)) for i in range(4)]
        result = classify.evaluate(Identity(), DataLoader(ds, batch_size=2), torch.device("cpu"), ["a", "b"])
        self.assertEqual(result["confusion_rows_true_columns_predicted"], [[2, 1], [0, 1]])
        self.assertEqual(result["accuracy"], .75)
        self.assertAlmostEqual(result["balanced_accuracy"], 5/6)
        self.assertEqual(len(result["predictions"]), 4)


class TrainingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.manifest, _ = image_fixture(self.root / "images")
        setup()

    def tearDown(self):
        self.temp.cleanup()

    def args(self, name, **changes):
        values = dict(seed=7, device="cpu", run=self.root/name, manifest=self.manifest,
                      arch="small", pretrained=False, freeze=False, augment=True,
                      batch_size=4, lr=.003, epochs=2, resume=None, init=None)
        return SimpleNamespace(**(values | changes))

    def train(self, args):
        with contextlib.redirect_stdout(io.StringIO()):
            classify.train(args)
        return load_checkpoint(args.run / "last.pt")

    def test_cpu_resume_matches_uninterrupted_weights_optimizer_and_history(self):
        full = self.train(self.args("full"))
        first_args = self.args("resumed", epochs=1)
        self.train(first_args)
        resumed = self.train(self.args("resumed", resume=first_args.run/"last.pt"))
        self.assertEqual(full["history"], resumed["history"])
        for key in full["model"]:
            self.assertTrue(torch.equal(full["model"][key], resumed["model"][key]), key)
        for key in full["optimizer"]["state"]:
            for name, value in full["optimizer"]["state"][key].items():
                self.assertTrue(torch.equal(value, resumed["optimizer"]["state"][key][name]))
        self.assertTrue(torch.equal(full["loader_rng"], resumed["loader_rng"]))

    def test_resume_rejects_changed_settings_and_nonempty_run(self):
        args = self.args("existing", epochs=1)
        self.train(args)
        with self.assertRaisesRegex(ValueError, "not empty"):
            classify.train(args)
        with self.assertRaisesRegex(ValueError, "settings or data differ"):
            classify.train(self.args("existing", resume=args.run/"last.pt", lr=.02))

    def test_saved_inference_finetuning_and_report_without_downloads(self):
        args = self.args("inference", epochs=1)
        self.train(args)
        with patch.object(classify.models, "resnet18", side_effect=AssertionError("unexpected model download")):
            model, ck = classify.restore(args.run/"best.pt", torch.device("cpu"))
        tensor = classify.transform(ck["preprocessing"])(data.rgb(self.root/"images/blue/0.png"))[None]
        before = model(tensor).detach()
        second, _ = classify.restore(args.run/"best.pt", torch.device("cpu"))
        torch.testing.assert_close(before, second(tensor))
        predict = SimpleNamespace(device="cpu", checkpoint=args.run/"best.pt", image=self.root/"images/blue/0.png",
                                  repeats=2, out=self.root/"prediction.json")
        with contextlib.redirect_stdout(io.StringIO()):
            classify.predict(predict)
        result = json.loads(predict.out.read_text())
        self.assertEqual(result["preprocessing"], ck["preprocessing"])
        self.assertEqual(len(result["predictions"]), 2)
        self.assertGreaterEqual(result["latency_ms_median"], 0.)
        score = SimpleNamespace(seed=7, device="cpu", checkpoint=args.run/"best.pt", manifest=self.manifest,
                                split="test", batch_size=4, out=self.root/"test.json")
        with contextlib.redirect_stdout(io.StringIO()):
            classify.score(score)
        evaluated = json.loads(score.out.read_text())
        self.assertEqual(evaluated["n"], 4)
        self.assertEqual(evaluated["split"], "test")
        self.assertEqual(evaluated["classes"], ck["classes"])
        self.assertTrue(report.render(args.run).exists())
        changed = self.train(self.args("finetune", init=args.run/"best.pt", epochs=1, lr=.0001))
        self.assertTrue(any(not torch.equal(ck["model"][k], changed["model"][k]) for k in ck["model"]))

    def test_frozen_resnet_keeps_backbone_and_batchnorm_but_updates_head(self):
        setup()
        initial = classify.build_model("resnet18", 2).state_dict()
        saved = self.train(self.args("frozen", arch="resnet18", freeze=True, epochs=1, batch_size=4))
        for key, value in initial.items():
            if not key.startswith("fc."):
                self.assertTrue(torch.equal(value, saved["model"][key]), key)
        self.assertFalse(torch.equal(initial["fc.weight"], saved["model"]["fc.weight"]))

    def test_no_failure_sheet_keeps_no_stale_image(self):
        path = self.root / "failures.jpg"
        path.write_bytes(b"stale")
        classify.failure_sheet(None, {"predictions": [{"label": 0, "prediction": 0}]}, path)
        self.assertFalse(path.exists())

    def test_segment_training_step_changes_weights_and_saves_overlay(self):
        model = dense.TinyUNet()
        optimizer = torch.optim.AdamW(model.parameters(), lr=.01)
        images = torch.rand(2, 3, 32, 32)
        masks = (images[:, :1] > .5).float()
        before = model.decoder[-1].weight.detach().clone()
        loss = nn.functional.binary_cross_entropy_with_logits(model(images), masks)
        loss.backward()
        optimizer.step()
        self.assertTrue(torch.isfinite(loss))
        self.assertFalse(torch.equal(before, model.decoder[-1].weight))
        loader = DataLoader([(images[i], masks[i], f"{i}.png") for i in range(2)], collate_fn=dense.collate)
        metrics = dense.evaluate(model, loader, torch.device("cpu"), "segment", self.root)
        self.assertEqual(metrics["tp"]+metrics["fp"]+metrics["fn"]+metrics["tn"], 2048)
        self.assertEqual(metrics["all_background_baseline"]["foreground_iou"], 0.)
        self.assertTrue((self.root/"overlays/0.png").exists())


class OpenCVTests(unittest.TestCase):
    def test_count_and_area_filter_for_bright_and_dark_objects(self):
        image = np.zeros((80, 100, 3), dtype=np.uint8)
        image[10:30, 10:30] = 255
        image[45:65, 60:90] = 255
        image[2:4, 2:4] = 255
        for source, dark in ((image, False), (255-image, True)):
            _, mask, result = opencv_lab.count_objects(source, min_area=40, dark=dark)
            self.assertEqual(result["count"], 2)
            self.assertEqual(sorted(r["area_pixels"] for r in result["objects"]), [400, 600])
            self.assertEqual(set(np.unique(mask)), {0, 255})

    def test_homography_recovers_known_translation_and_rejects_blank_views(self):
        rng = np.random.default_rng(4)
        first = rng.integers(0, 256, (300, 400, 3), dtype=np.uint8)
        expected = np.array([[1., 0., 12.], [0., 1., 8.], [0., 0., 1.]])
        second = cv2.warpPerspective(first, expected, (400, 300))
        _, _, result = opencv_lab.match_views(first, second)
        corners = np.array([[[80., 80.]], [[280., 180.]]], dtype=np.float32)
        actual = cv2.perspectiveTransform(corners, np.array(result["homography_first_to_second"]))
        wanted = cv2.perspectiveTransform(corners, expected)
        self.assertLess(float(np.linalg.norm(actual-wanted, axis=2).max()), 1.)
        self.assertGreater(result["inliers"], 20)
        with self.assertRaisesRegex(ValueError, "No descriptors"):
            opencv_lab.match_views(np.zeros_like(first), np.zeros_like(first))

    def test_video_tracks_known_motion_and_writes_decodable_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            video = root/"motion.avi"
            writer = cv2.VideoWriter(str(video), cv2.VideoWriter_fourcc(*"MJPG"), 10., (160, 120))
            self.assertTrue(writer.isOpened())
            frame = np.random.default_rng(3).integers(0, 256, (120, 160, 3), dtype=np.uint8)
            for i in range(5):
                writer.write(cv2.warpAffine(frame, np.float32([[1, 0, i*2], [0, 1, 0]]), (160, 120)))
            writer.release()
            out = prepare_run(root/"tracks")
            opencv_lab.track(video, out, max_frames=5)
            rows = json.loads((out/"tracks.json").read_text())["frames"]
            self.assertEqual(len(rows), 4)
            self.assertGreater(rows[-1]["retained_points"], 10)
            self.assertAlmostEqual(rows[-1]["median_displacement_pixels"], 2., delta=.3)
            capture = cv2.VideoCapture(str(out/"tracked.avi"))
            try:
                self.assertTrue(capture.read()[0])
            finally:
                capture.release()


if __name__ == "__main__":
    unittest.main()
