# Count objects with OpenCV

Photograph several separated coins, beans or dark buttons on a plain contrasting background. Save it as `course/practical/data/objects.jpg`. Count them yourself first and record the number. Lighting, shadows and touching objects will become explicit assumptions of your algorithm.

## Build the pipeline

```bash
python -m course.practical.opencv_lab count --image course/practical/data/objects.jpg --dark --min-area 80 --kernel 3 --run course/practical/runs/count-a
```

Use `--dark` for dark objects on a light background; omit it for the reverse. The script converts BGR to grayscale, selects an Otsu threshold, opens the binary mask with a small kernel, and labels connected components. It removes components smaller than `--min-area`. It saves `mask.png`, `objects.jpg` and `counts.json`.

Otsu chooses a threshold from the intensity histogram. It does not know what a coin is. Opening is erosion followed by dilation: it can remove tiny isolated foreground specks, but also erase narrow real objects. A component is a connected foreground region; two touching coins may form one region. The box is measured in image pixels, not physical centimetres.

## Experiment

Repeat into `count-b` using `--kernel 5`, keeping everything else fixed. Compare the saved masks and count error against your manual count. Next change only `--min-area`. Which false positives disappear? Which true objects are lost? Photograph the same arrangement with a shadow, then with two objects touching. Keep your chosen settings fixed on those new photos.

The area threshold depends on resolution. If each image dimension doubles, an object's area grows by about four. Inspect colour spaces too: an HSV mask may separate a coloured object better than grayscale, but hue wraps around its numeric range. Try `cv2.cvtColor(image, cv2.COLOR_BGR2HSV)` and inspect values before choosing a range.

## Evidence and mastery

Save three photo/mask/output triples, manual versus automatic counts, and one failure explanation. Distinguish “the threshold missed a dark object” from “the model does not understand coins.” State one scene condition under which this simple pipeline is sufficient. Explain why a neural network might be unnecessary for a controlled scene.

Reference: [OpenCV morphology tutorial](https://docs.opencv.org/4.x/d9/d61/tutorial_py_morphological_ops.html) and [image-processing tutorials](https://docs.opencv.org/4.x/d7/da8/tutorial_table_of_content_imgproc.html).
