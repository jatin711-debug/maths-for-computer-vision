# Retrieve images and prompt masks

This is an optional extension after the core training labs. It uses existing pretrained models locally. Install the additional requirements in your practical environment. The first run needs internet, several hundred MB per model and more RAM than the small CNN. CPU inference is supported but can be slow. Downloads are opt-in; omit `--download` once weights are cached.

```bash
python -m pip install -r course/practical/requirements-foundation.txt
```

## CLIP image retrieval

Put ten varied photographs directly in `course/practical/data/gallery`. Choose a query and decide which photos count as relevant before looking at rankings.

```bash
python -m course.practical.foundation clip --images course/practical/data/gallery --text "a photo of a dog" "a photo of a vehicle" --download --run course/practical/runs/clip-a
```

CLIP embeds text and images into a shared space. The script normalizes embeddings and ranks image/text pairs by cosine similarity. It saves `retrieval.json`. Scores are similarities, not probabilities of correctness. An irrelevant gallery still produces a top-ranked image.

Repeat with two paraphrases, saving a new run. Manually label relevance and calculate precision at 3: relevant images among the first three divided by 3. Do not change the relevance definition after seeing the ranking. Include an unrelated query and compare the returned scores. Explain the contrastive objective using Lesson 54.

## SAM point prompts

Choose an image and an `(x,y)` pixel coordinate inside the intended object. Coordinates refer to the original, EXIF-oriented image. Replace the example point if your image is smaller or the object is elsewhere.

```bash
python -m course.practical.foundation sam --image course/practical/data/objects.jpg --point 100 100 --download --run course/practical/runs/sam-a
```

SAM generates candidate masks for the positive point. The script selects the highest predicted-quality candidate, restores the original image dimensions, and saves a mask and overlay. Predicted quality is not a measured IoU. To measure it, add `--mask` pointing to an aligned binary ground-truth mask with the same dimensions; any nonzero value is foreground.

## Experiment and mastery

Move the point within the same object, then onto a nearby object. Compare masks and ambiguity. A point identifies a region of interest; SAM does not automatically supply your task's semantic class. Save two retrieval rankings, two prompted masks, your manual relevance labels and one failure of each model. Explain how prompt choice changes the task.

References: [CLIP model card](https://huggingface.co/openai/clip-vit-base-patch32), [SAM model card](https://huggingface.co/facebook/sam-vit-base) and [SAM API documentation](https://huggingface.co/docs/transformers/v4.57.1/en/model_doc/sam). This lab pins Transformers to version 4 compatibility because major versions can change feature-extraction APIs.
