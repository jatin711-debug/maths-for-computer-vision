# Align views and track motion

Take two overlapping photographs of a flat poster or book cover from different viewpoints. Save them as `view-a.jpg` and `view-b.jpg` inside `course/practical/data`. Use texture and good lighting; a blank wall cannot supply reliable feature matches.

## Estimate a homography

```bash
python -m course.practical.opencv_lab match --image course/practical/data/view-a.jpg --second course/practical/data/view-b.jpg --run course/practical/runs/alignment
```

ORB finds keypoints and binary descriptors. Hamming distance compares descriptors. The ratio test rejects a match when the second-best candidate is almost as good as the best; ambiguous repeated patterns are risky. RANSAC seeks a homography supported by a consistent subset of matches. The matrix maps coordinates in the first photo into the second.

Inspect `matches.jpg`, `warped.jpg` and `geometry.json`. Record the inlier fraction and median inlier reprojection error in pixels. Low residual on the fitted inliers does not prove a correct whole-image alignment. Check corners or points you did not use to fit it. A homography is appropriate for a plane or near-pure camera rotation; translating around a 3D scene introduces parallax.

## Track features in video

Record a short video of a textured object moving slowly. Save a local video file as `motion.mp4`; this script never opens the webcam.

```bash
python -m course.practical.opencv_lab track --video course/practical/data/motion.mp4 --max-frames 150 --run course/practical/runs/motion
```

The script detects corners in the first frame, tracks them with pyramidal Lucas–Kanade, and checks that backward tracking returns near the original point. Tracks with more than 1.5 pixels of forward/backward disagreement are removed. `tracked.avi` shows displacement segments; `tracks.json` records surviving features and their median displacement. Points are not replenished, so the survival curve is meaningful.

## Stress the assumptions

Repeat with fast motion, a lighting change or an occlusion. Explain where local brightness consistency or small-motion assumptions fail. These are image-feature trajectories, not person identities. Multi-object tracking additionally needs detections, motion prediction, association and lifecycle rules; connect those missing components to Lesson 60.

## Evidence and mastery

Save one successful alignment, a parallax failure and a tracked video. Explain the difference between descriptor matching and optical flow. State what geometric or temporal information your project actually needs before choosing a more complicated model.

References: [OpenCV homography tutorial](https://docs.opencv.org/4.x/d1/de0/tutorial_py_feature_homography.html) and [optical flow tutorial](https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html).
