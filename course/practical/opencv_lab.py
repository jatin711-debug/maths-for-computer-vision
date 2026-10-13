"""Classical CV projects: count objects, align two views, and track video points."""
import argparse
from pathlib import Path

import cv2
import numpy as np

from .common import RUNS, positive, prepare_run, write_json
from .data import rgb


def read_bgr(path):
    # Pillow handles Unicode paths and EXIF orientation consistently with the training labs.
    return cv2.cvtColor(np.array(rgb(path)), cv2.COLOR_RGB2BGR)


def save_image(path, array):
    from PIL import Image
    if array.ndim == 3:
        array = cv2.cvtColor(array, cv2.COLOR_BGR2RGB)
    Image.fromarray(array).save(path)


def count_objects(image, min_area=40, dark=False, kernel=3):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mode = cv2.THRESH_BINARY_INV if dark else cv2.THRESH_BINARY
    threshold, mask = cv2.threshold(gray, 0, 255, mode | cv2.THRESH_OTSU)
    element = np.ones((kernel, kernel), dtype=np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, element)
    n, labels, stats, centres = cv2.connectedComponentsWithStats(mask, connectivity=8)
    objects = []
    output = image.copy()
    for i in range(1, n):
        x, y, width, height, area = map(int, stats[i])
        if area < min_area:
            continue
        objects.append({"box_xywh": [x, y, width, height], "area_pixels": area, "centroid": centres[i].tolist()})
        cv2.rectangle(output, (x,y), (x+width-1,y+height-1), (0,0,255), 2)
        cv2.putText(output, str(len(objects)), (x,y+15), cv2.FONT_HERSHEY_SIMPLEX, .5, (0,0,255), 1)
    return output, mask, {"count": len(objects), "otsu_threshold": threshold, "objects": objects}


def match_views(first, second):
    orb = cv2.ORB_create(nfeatures=2500)
    key1, des1 = orb.detectAndCompute(cv2.cvtColor(first, cv2.COLOR_BGR2GRAY), None)
    key2, des2 = orb.detectAndCompute(cv2.cvtColor(second, cv2.COLOR_BGR2GRAY), None)
    if des1 is None or des2 is None:
        raise ValueError("No descriptors: choose textured overlapping views of a flat surface.")
    pairs = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(des1, des2, k=2)
    good = [pair[0] for pair in pairs if len(pair) == 2 and pair[0].distance < .75*pair[1].distance]
    if len(good) < 4:
        raise ValueError("Fewer than four ratio-test matches; cannot estimate a homography.")
    src = np.float32([key1[m.queryIdx].pt for m in good]).reshape(-1,1,2)
    dst = np.float32([key2[m.trainIdx].pt for m in good]).reshape(-1,1,2)
    cv2.setRNGSeed(7)
    matrix, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 3.)
    if matrix is None or inliers is None or inliers.sum() < 4 or not np.isfinite(matrix).all():
        raise ValueError("RANSAC failed: insufficient consistent correspondences.")
    error = np.linalg.norm(cv2.perspectiveTransform(src, matrix)-dst, axis=2).ravel()
    selected = inliers.ravel().astype(bool)
    visual = cv2.drawMatches(first, key1, second, key2, good, None,
                             matchesMask=inliers.ravel().tolist(), flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
    warped = cv2.warpPerspective(first, matrix, (second.shape[1], second.shape[0]))
    return visual, warped, {"homography_first_to_second": matrix.tolist(), "ratio_matches": len(good),
                           "inliers": int(selected.sum()), "inlier_fraction": float(selected.mean()),
                           "median_inlier_error_pixels": float(np.median(error[selected])),
                           "assumption": "Planar scene or near-pure camera rotation; visually inspect parallax and repeated patterns."}


def track(video, out, max_frames=200):
    capture = cv2.VideoCapture(str(video))
    writer = None
    rows = []
    try:
        ok, frame = capture.read()
        if not ok:
            raise ValueError("Cannot decode the video; use a local MP4 or AVI file.")
        fps = capture.get(cv2.CAP_PROP_FPS)
        fps = fps if np.isfinite(fps) and fps > 0 else 25.
        h, w = frame.shape[:2]
        writer = cv2.VideoWriter(str(out/"tracked.avi"), cv2.VideoWriter_fourcc(*"MJPG"), fps, (w,h))
        if not writer.isOpened():
            raise ValueError("MJPG video writer unavailable in this OpenCV installation.")
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        points = cv2.goodFeaturesToTrack(gray, 100, .02, 10)
        if points is None:
            raise ValueError("No corners in the first frame; use a textured scene.")
        writer.write(frame)
        for index in range(1, max_frames):
            ok, frame = capture.read()
            if not ok:
                break
            next_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            next_points, status, _ = cv2.calcOpticalFlowPyrLK(gray, next_gray, points, None)
            if next_points is None:
                break
            backward, back_status, _ = cv2.calcOpticalFlowPyrLK(next_gray, gray, next_points, None)
            if backward is None:
                break
            residual = np.linalg.norm(points-backward, axis=2).ravel()
            good = status.ravel().astype(bool) & back_status.ravel().astype(bool) & (residual < 1.5)
            old, new = points[good].reshape(-1,2), next_points[good].reshape(-1,2)
            for start, end in zip(old, new):
                cv2.line(frame, tuple(np.round(start).astype(int)), tuple(np.round(end).astype(int)), (0,255,0), 2)
            rows.append({"frame": index, "retained_points": len(new),
                         "median_displacement_pixels": float(np.median(np.linalg.norm(new-old, axis=1))) if len(new) else None})
            writer.write(frame)
            if not len(new):
                break
            gray, points = next_gray, new.reshape(-1,1,2)
    finally:
        capture.release()
        if writer:
            writer.release()
    write_json(out/"tracks.json", {"frames": rows, "note": "Feature point tracks; these are not object identities or a multi-object tracker."})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["count", "match", "track"])
    parser.add_argument("--image", type=Path)
    parser.add_argument("--second", type=Path)
    parser.add_argument("--video", type=Path)
    parser.add_argument("--min-area", type=positive, default=40)
    parser.add_argument("--kernel", type=positive, default=3)
    parser.add_argument("--dark", action="store_true", help="Objects are darker than the background")
    parser.add_argument("--max-frames", type=positive, default=200)
    parser.add_argument("--run", type=Path, default=RUNS/"opencv")
    args = parser.parse_args()
    if args.command != "track" and args.image is None:
        parser.error("count/match requires --image")
    if args.command == "match" and args.second is None:
        parser.error("match requires --second")
    if args.command == "track" and args.video is None:
        parser.error("track requires --video")
    out = prepare_run(args.run)
    if args.command == "count":
        visual, mask, report = count_objects(read_bgr(args.image), args.min_area, args.dark, args.kernel)
        save_image(out/"objects.jpg", visual)
        save_image(out/"mask.png", mask)
        write_json(out/"counts.json", report)
    elif args.command == "match":
        visual, warped, report = match_views(read_bgr(args.image), read_bgr(args.second))
        save_image(out/"matches.jpg", visual)
        save_image(out/"warped.jpg", warped)
        write_json(out/"geometry.json", report)
    else:
        track(args.video, out, args.max_frames)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
