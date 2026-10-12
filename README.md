# Maths for Computer Vision

An interactive course that takes you from school algebra to the mathematics behind modern computer vision: 68 lessons in 17 modules, from images as arrays and dot products to epipolar geometry, diffusion models and 3D Gaussian splatting.

**Open the course: [jatin711-debug.github.io/maths-for-computer-vision](https://jatin711-debug.github.io/maths-for-computer-vision/)**. It runs entirely in your browser. Progress, notes and answers are saved in that browser only; nothing is sent anywhere.

![A lesson page: the equation card, then plain-word primers for each new idea](docs/lesson.jpg)

## What is inside

- **68 lessons**, each with a reading, an equation card, a live worked example whose numbers follow its sliders, and a notation explorer.
- **Plain-word primers.** Every lesson opens with its new ideas explained for a beginner: what each one is, how to calculate it by hand, worked numbers, a small graph and the usual mistake. All 354 terms are collected in a searchable **Glossary**. Maths that later lessons need (cos and sin, determinants, complex numbers, integrals, the multivariate Gaussian, the cross product and more) is taught where it is first used.
- **46 interactive experiments**, most on real photographs: filtering and Fourier analysis, SVD compression, corners and feature matching, optical flow, Kalman tracking, epipolar lines, block-matching stereo, ICP, a ray-marched volume, Hungarian box matching, EM and a small VAE trained in the browser, diffusion sampling and a Gaussian-splat renderer.
- **Auto-checked practice** with fresh numbers each time (312 question types), hints, worked solutions, spaced review, an automatic error log and a five-question checkpoint per module.
- **Python in the browser.** Every lesson has an editable NumPy example that runs locally via Pyodide; 13 also have optional PyTorch versions.
- **75 videos:** 10 two-minute animated explanations of the hardest ideas (projection, eigenvectors, SVD, Bayes, softmax and cross-entropy, convolution, Fourier, backpropagation, homographies, attention), a narrated worked walkthrough for each of Lessons 1-48, and a short overview per module.
- **7 Jupyter notebooks** (NumPy only) that follow the modules with predict-then-run checks.

![An experiment: Harris corners and the structure tensor on a photo](docs/experiment.jpg)

## Syllabus

| Module | Title | Lessons | Weeks |
|---|---|---|---|
| 01 | Refresh the language of maths | 01–04 | 1-2 |
| 02 | Vectors, geometry and linear maps | 05–08 | 3-4 |
| 03 | Linear systems and least squares | 09–12 | 5-6 |
| 04 | Eigenvectors, SVD and PCA | 13–16 | 7-8 |
| 05 | Calculus for learning | 17–20 | 9-10 |
| 06 | Probability, noise and uncertainty | 21–24 | 11-12 |
| 07 | Statistical learning and losses | 25–28 | 13-14 |
| 08 | Optimization and reliable training | 29–32 | 15-16 |
| 09 | Images, convolution and frequency | 33–36 | 17-18 |
| 10 | Neural networks and backpropagation | 37–40 | 19-20 |
| 11 | Recognition, detection and segmentation | 41–44 | 21-22 |
| 12 | Capstone and a route into research | 45–48 | 23-24 |
| 13 | Geometry of images and cameras | 49–52 | 25-26 |
| 14 | Matrix calculus and modern architectures | 53–56 | 27-28 |
| 15 | Local features, motion and tracking | 57–60 | 29-30 |
| 16 | Two-view geometry and neural rendering | 61–64 | 31-32 |
| 17 | Set prediction, generative models and splatting | 65–68 | 33-34 |

Modules 1-12 form a 24-week core at 8-10 hours a week; Modules 13-17 are an optional extension. The full plan, outcomes and mastery gates are in [course/syllabus.md](course/syllabus.md).

![The Visual classroom](docs/visual-classroom.jpg)

## Run it on your own computer

The course is a static site; it needs no build step and no internet once downloaded.

```bash
git clone https://github.com/jatin711-debug/maths-for-computer-vision.git
cd maths-for-computer-vision
python course/serve_course.py
```

Then open http://127.0.0.1:50101/course/. On Windows you can instead double-click **Open Course.cmd**. Opening `course/index.html` directly from disk also works, but the in-browser Python runner and video captions need the local server.

## Books

Lessons cite four books, and every reading reference links to the exact PDF page of the cited section. The PDFs are **not** included. Two are free from their authors: *Mathematics for Machine Learning* (Deisenroth, Faisal and Ong) and *Computer Vision: Algorithms and Applications* (Szeliski). See [course/resources/README.md](course/resources/README.md) for all four, and save your copies there so the page links open locally.

## For contributors

- Lessons 1-48 live in shared data files (`teaching-data.js`, `lesson-guides.js`, `lesson-tutor.js`, `practice-bank-*.js`); Lessons 49-68 are self-contained in `course/lessons/NN-*.md`, `course/extensions/lesson-NN.{js,json}` and `course/extension_examples/lesson_NN.py`.
- Primers are in `course/primers/*.js` (schema at the top of `course/primers.js`).
- `python course/build_web_data.py` rebuilds `course-data.js` from the Markdown lessons (needs `pypdf` only if the book PDFs are present).
- Checks, all currently at 0 issues: `node course/validate_lessons.cjs`, `node course/validate_practice.cjs`, `node course/validate_primers.cjs` and `python course/validate_python_examples.py` (NumPy, optionally PyTorch).
- More detail on how each part was built and validated is in [course/README.md](course/README.md).

Found a mistake? Please open an issue with the lesson number and what looks wrong.

## How it was made

The lessons, experiments, practice generators and videos were written with AI assistance (Anthropic's Claude) and checked by script: every worked number, practice answer and primer example is verified in Python, and the validators above run across all lessons. The explanations have not been reviewed by an independent computer-vision expert, so cross-check anything surprising against the books. The animated explanations were rendered with [fframes](https://github.com/dmtrKovalenko/fframes), and all narration was synthesized locally with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M).

## Licence

- Code (JavaScript, Python, CSS, HTML and scripts): [MIT](LICENSE).
- Course content (lesson text, primers, exercises, notebooks' prose, images and videos): [CC BY 4.0](LICENSE-CONTENT.md). You may share and adapt it, including commercially, with credit.
- Third-party components keep their own licences: [KaTeX](https://katex.org/) (MIT, `course/vendor/katex`), the [Pyodide](https://pyodide.org/) runtime with CPython, Emscripten and NumPy (MPL-2.0, PSF, MIT and BSD; licence files in `course/vendor/pyodide`), sample photographs from [scikit-image](https://scikit-image.org/) (CC0), and Kokoro-82M voice output (Apache-2.0).
