# Start your maths course here

**Your plan:** 24 weeks, 8-10 hours per week, with a refresher and a focus on deep-learning computer vision, plus an optional 10-week extension (weeks 25-34): image geometry and modern architectures, then local features and tracking, two-view geometry and neural rendering, and generative models.

Double-click [Open Course.cmd](<../Open Course.cmd>) (Windows) to start and open the course at http://127.0.0.1:50101/course/. The launcher reuses a running course server and starts it again after a computer restart. It serves only on your own computer.

Or start the server from a terminal:

```powershell
cd path	o	hisepository
make server
```

Then open http://127.0.0.1:50101/course/. The command runs the server in the background and reuses it if it is already running. Running `make` alone does the same thing.

You can also open [index.html](index.html) directly from disk. Lessons, SVG players, maths and notebooks are local. The book PDFs are not included; see [resources/README.md](resources/README.md). For MP4 captions and consistent saved progress, use the launcher and the same browser.

Your completed lessons, notes and written answers are saved in that browser. Use **Resource library → Export my progress** for a backup, and **Import progress** to bring one back. Imported notes are merged with existing writing. The same localhost address keeps existing browser progress available. Progress in different browsers is separate.

Use the sun/moon button in the top bar to switch between the original light appearance and a black, white and silver dark mode. The course follows your device’s colour preference until you choose a mode, then remembers that choice in this browser. Appearance is saved separately from course progress.

## What changed on 12 October 2026

- **Every new idea explained in plain words.** Each lesson now opens with **New in this lesson · in plain words**, directly under the equation card: 354 terms across the 68 lessons, each with what it is, how to calculate it by hand, worked numbers, a small graph where the shape matters and the usual mistake. Chips at the top link the earlier lessons it builds on and reopen terms from earlier lessons in place. The symbols in the equation card now have plain descriptions; select one to open its explanation. Maths the course used but never taught is covered where it is first needed: cos and sin (06), determinants (07), complex numbers and Euler's formula (13, 36), limits (17), integrals (22), the multivariate Gaussian (23), argmax and ∝ (25, 26), the cross product (49), trace and the matrix exponential (51) and more.
- **A Glossary page** in the sidebar collects all 354 terms alphabetically, with search and a module filter, each linking to the lesson that introduces it.
- **Three new modules, Lessons 57-68 (weeks 29-34),** close the gaps between this course and advanced computer vision, after an audit against the four books and current methods:
  - Module 15, *Local features, motion and tracking*: image gradients and Harris corners (57), scale space, SIFT-style descriptors and matching (58), optical flow and Lucas–Kanade (59), multivariate Gaussians, Kalman filtering and Hungarian data association (60).
  - Module 16, *Two-view geometry and neural rendering*: epipolar geometry and the eight-point algorithm (61), triangulation, rectification and stereo depth (62), rotations as a manifold, Kabsch/ICP and bundle adjustment (63), volume rendering and NeRF with Fourier features (64).
  - Module 17, *Set prediction, generative models and splatting*: cross-attention, positional encodings and DETR-style set prediction (65), EM and the variational autoencoder (66), diffusion models with DDPM/DDIM sampling and guidance (67), 3D Gaussian splatting (68).
  Each lesson has the full set: reading, equation card, worked example, notation, Python example, auto-checked practice (72 new question types), plain-word primers and its own experiment, most on the CC0 photographs (corner maps, feature matching to a warped copy, optical flow, multi-object tracking, epipolar lines, block-matching stereo, ICP, a ray-marched volume and a Fourier-feature MLP, Hungarian box matching, EM and a small VAE trained in the browser, diffusion sampling with an exact denoiser, and a Gaussian-splat renderer). Each module also has an overview animation and a checkpoint. A seventh notebook, `notebooks/features-geometry-and-generative.ipynb`, supports the three modules.
- **Corrections and clarifications in earlier lessons:** a broken formula in Lesson 35; the missing derivation of PCA's direction (Rayleigh quotient) in Lesson 15; conjugate symmetry in Lesson 36; weight decay versus AdamW (39); GIoU (42); focal loss (43); one learning-rate symbol, α, throughout Lessons 29-30; the directional-derivative letter in Lesson 18; and clearer wording in Lessons 01, 04, 07, 10, 12, 13, 33, 50, 51 and 52.
- **Visual classroom:** all 75 videos (10 animated explanations, 48 lesson walkthroughs, 17 module overviews) with filters by kind and module, search, grid and list views.

## What changed on 11 October 2026

- **Practice that checks you.** Every lesson's Practice tab starts with auto-checked questions that use new numbers each time (240 question types across 56 lessons). Type a number or an expression such as `2/3`, `ln(3)` or `sqrt(2)/2`; a miss shows a hint, a second miss shows the worked solution. The fixed written exercises remain below them.
- **Spaced review and an error log.** Each question type you answer returns on a widening schedule (1, 3, 7, 16 and 35 days) in **Practice → Today's review**, with a due-count badge in the sidebar and a reminder on the overview. Missed first attempts are recorded in an automatic error log with a "Try a similar question" button.
- **Real module checkpoints.** A module's mastery check is now five fresh questions from its lessons with no hints; 4 of 5 correct marks the module ready. A manual "mark ready" option remains for understanding shown another way. Progress export and import include the review schedule, error log and checkpoint results.
- **Readings open at the cited page.** Reading references in lessons and modules link to the exact PDF page (853 book sections indexed from the PDF bookmarks). Ten incorrect citations were fixed, and Lessons 02-04 gained their own readings.
- **Experiments on real photographs.** Ten lessons that shared a generic experiment now have their own: repeated transformations (13), SVD image compression (14), PCA of image patches (15), Gaussian noise and averaging (23), sampling uncertainty of an accuracy (24), aliasing (33), filters with a pixel probe (34), receptive fields (35), Fourier filtering and phase (36) and augmentation with box labels (41). The CC0 sample photographs are embedded in `vision-images.js`, so the experiments also work offline and from disk.
- **Two extension modules (Lessons 49-56, weeks 25-28).** Module 13, Geometry of images and cameras: homogeneous coordinates, homographies and warping, the pinhole camera and rotations, RANSAC and Gauss-Newton. Module 14, Matrix calculus and modern architectures: matrix calculus, entropy/KL and contrastive learning, attention and vision transformers, pyramids/FPN/U-Net. Each lesson has the full set: reading, worked example, notation, Python example, auto-checked practice and its own experiment. A sixth notebook, `notebooks/geometry-and-architectures.ipynb`, supports both modules. Two new SVG overview animations introduce the modules, and Lessons 50 and 55 have animated explanations (below).
- **Ten animated explanations of the hardest ideas.** Each is about two minutes of word-synced animation: the motion starts on the word that names it, with one prediction pause and real photographs where they help. They appear first in their lesson as **Animated · Watch the explanation** and lead the Visual classroom list. Lesson 06: projection is the closest point. Lesson 13: eigenvectors, directions that don't turn. Lesson 14: SVD, rotate, stretch, rotate. Lesson 21: Bayes, why a good detector can still be wrong. Lesson 27: softmax and cross-entropy, why the gradient is p − y. Lesson 34: convolution, one small dot product slid everywhere. Lesson 36: Fourier, an image is a sum of waves. Lesson 38: backpropagation, the chain rule run backwards. Lesson 50: homography, one matrix for a plane in perspective. Lesson 55: attention, every patch asks every other patch. The earlier narrated walkthroughs remain below them.
- **A tidier Visual classroom.** All the videos are in one browser. Filter by kind: animated explanations (10), lesson walkthroughs (48) or module overviews (one per module). Narrow it to a module, search a topic or lesson number, and switch between a grid and a compact list. Results are grouped under module headings, and each card shows its kind, lesson and length. Your kind, module and layout choices are remembered in this browser.

## Today

1. [Attempt the starting assessment](starting-assessment.md) (about 25 minutes).
2. [Read Lesson 01: Images as numbers](lessons/01-images-as-numbers.md) and attempt its exercises.
3. Send your reasoning for Lesson 01 Questions 1-3 in this chat. Mark anything uncertain.
4. [Follow your first two weeks](first-two-weeks.md).

## Materials

- [Full editable syllabus](syllabus.md)
- [Starter notebook](notebooks/week01-02-foundations.ipynb)
- [Book and section guide](resources/README.md)
- [Personal progress and error log](progress.md)
- [Solutions: use after an attempt](solutions.md)

## Notebook setup

The starter notebook uses Python 3 and NumPy only. You can open it in an existing Jupyter environment, or use a notebook service of your choice. No GPU, external image download or paid service is needed for this lab. If Python itself is new, use the linked CS231n tutorial and begin with the paper exercises.

## How I will teach you

Bring an attempted calculation or explanation. I will check it, give a worked explanation of the specific gap, and follow with a similar problem. We will revisit errors and use the mastery gates to adjust pace. All 68 lessons are authored, with plain-word primers, worked examples, auto-checked practice and checkpoints. Seven NumPy notebooks support the course; framework autograd is an optional extension. Teaching and pacing can adapt to your answers.

## Continue beyond the foundations

Open the course roadmap to reach any of the 68 lessons. Each lesson has reading, an interactive experiment and practice with worked answers. Expand “Suggested weekly rhythm” on the roadmap for all 34 weeks of pacing guidance (24 core weeks and the 10-week extension), session checklists and weekly notes. Existing saved checklists and notes are preserved.

The original printable guide covers the roadmap and first four lessons; the expanded lessons and solutions are in the webpage and editable Markdown files. See [later solutions](later-solutions.md) and the [capstone template](capstone-template.md). Browser notes and completion records are preserved.

## Visual teaching studio

- 68 lesson-specific equation cards, symbol explanations, CV connections, common mistakes and feedback checks, each followed by plain-word primers for the lesson's new ideas (354 terms, also collected in the Glossary).
- 68 live worked examples with their own controls, four explained calculation steps, exact-value inputs and reset buttons. Predict a result, change a value, then follow how the calculation changes.
- 68 editable Python examples below the worked calculations, with Run Python, Stop, Restore example, Copy and Download .py controls. Execution uses Python WebAssembly in a background browser worker and shows real output and tracebacks. Changing a lesson input updates the example; custom edits stay intact until restored. Each card explains the implementation and array shapes. Matrix and array examples use NumPy; scalar examples use the standard library. Thirteen lessons also have optional PyTorch equivalents for an installed Python environment: 1, 4, 7, 14, 18, 29, 33, 37–41 and 48. They cover tensors, stable loss, SVD, gradients, sampling, ReLU, regularization, augmentation and cosine similarity, with code that follows the lesson inputs.
- Select a notation term to see its own typeset symbol and explanation. The longer readings also use typeset fractions, sums, derivatives and matrices, with wide formulas scrolling inside the text on small screens.
- Lesson 04 now explains powers and logarithms, logits and log-odds, sigmoid probabilities, the observed-class probability, binary cross-entropy, calibration and stable loss evaluation.
- 14 SVG stories, one worked illustration for each module. Play, pause, scrub, restart or jump to a step.
- 12 local silent MP4s, each 24 seconds at 960 × 540 and 24 fps, with on-screen text and WebVTT captions. Find them in Visual classroom or in any lesson's video disclosure.
- Three narrated fframes walkthroughs: **Images are arrays** (41 sec), **Projection keeps a direction** (50 sec) and **Gradient descent follows slope** (51 sec). Each is 1920 × 1080 and 30 fps, with seven chapters timed to the speech, a brief prediction pause, worked numbers, captions and a transcript. Ordinary sections have about half a second between them. Find them in Visual classroom and in lessons 1, 6 and 29. Chapter buttons seek to a specific step; playback can be slowed to 0.75×.
- Ten animated explanations (1 min 52 sec to 2 min 28 sec, 22 minutes in all) for Lessons 6, 13, 14, 21, 27, 34, 36, 38, 50 and 55. They are made with fframes and Kokoro, with 8-11 chapters, captions and a transcript, and use real CC0 photographs for the vision examples. Each video's numbers are computed or checked by its `make_data.py`.
- 45 additional narrated walkthroughs complete the collection of **48 lesson videos**, one per lesson. These use the course's own default calculations, diagrams and typeset equations, with seven chapters, a prediction prompt, Kokoro narration, captions and a transcript. Find them in lesson order in Visual classroom, or expand **Watch the narrated walkthrough** inside a lesson. Every export is 1920 × 1080 at 30 fps and fully decoded before being added to the catalogue.
- 46 adjustable maths experiments, each with a reset button: the original 16 hand-checkable ones plus 30 lesson-specific experiments, most on real photographs (see “What changed”). The neural-network gradient step applies the exact simultaneous update without clipping weights to slider bounds.
- Expandable resource PDFs and notebooks remain in the Resource library.

The twelve short overview clips use the original SVG scenes authored in `visual-stories.js`, rendered to PNG frames in a browser and encoded by the installed FFmpeg. The three original narrated walkthroughs use the local fframes Rust project in `fframes-videos/concept-studio`, rendered with Skia Vulkan. The 45 additional walkthroughs use `fframes-videos/lesson-studio`: resvg renders the course diagrams and MathJax equations, Pillow lays out the chapters, and FFmpeg encodes the fades and moving chapter marker. All narration is synthesized locally using Kokoro-82M (`af_heart`, speed 1.0), with reading time between cues. The narration model revision is pinned in the storyboards; actual generation settings are recorded with the audio and exports. KaTeX 0.19.0 and its fonts are copied locally under `vendor/katex`, with the MIT license retained. The course makes no CDN request at study time.

Run `./Render-ConceptVideos.ps1` from the workspace root to rebuild the three original narrated videos, or add `-Concept projection` to render one. Add `-PrepareNarration` after changing the narration. Every build derives scene lengths, captions and embedded chapter/transcript data from the recordings, so changing voices does not leave empty time in fixed chapters. Video metadata and hashes are in `media/fframes/manifest.json`; full frame inspections, audio levels, contact sheets and codec metadata are in `fframes-videos/concept-studio/review`. Browser interaction checks are recorded in `concept-video-ui-validation.json`.

Run `./Render-LessonVideos.ps1` for the 45 additional videos, or use `-Lesson 4` for one. Add `-PrepareNarration` after changing teaching copy or narration, and `-Encoder libx264` for software encoding. Unchanged verified exports are reused when resuming a batch. Metadata and hashes are in `media/lessons/manifest.json`; chapter layouts, contact sheets and codec probes are in `fframes-videos/lesson-studio/review`. Run `python fframes-videos/lesson-studio/verify_lessons.py` to verify all 48 MP4 checksums, posters, chapter clocks and caption text. Its report is `lesson-video-validation.json`; playback, chapter, caption, transcript, responsive layout and PyTorch panel checks are in `lesson-video-ui-validation.json`.

Run `./Render-Explainers.ps1` for the ten animated explanations, or `-Video softmax-loss` for one; add `-Narrate` after editing a `script.json`. Each project is in `fframes-videos/<id>`, with its narration script, `make_data.py`, animation source (`src/lib.rs`), README and review strips. The script inspects every frame, checks audio levels, renders, verifies the frame count and a full decode, then writes the poster and captions to `media/fframes` and lists the video in `explainer-video-data.js`. See `FFRAMES-LOCAL.md` in the workspace root for making a new one.

Use the top-bar Refresh button after source edits. `build_web_data.py` rebuilds embedded Markdown content. `build_videos.cjs` exports all stories, or pass story IDs to update selected videos. `redesign_app.py` is a guarded one-time migration. The legacy `build_course.py` rebuilds the original foundation package; it is not the update command for this expanded site.

Run `node course/validate_lessons.cjs` from the workspace root to check all lesson equations and worked-example calculations without starting a server. The results are saved in `lesson-math-validation.json`. The latest browser checks in `lesson-ui-validation.json` cover all 48 lessons at 320, 390, 974 and 1440 CSS pixels, including controls, step navigation, symbol disclosures, invalid inputs and resets, plus the linked experiment and practice routes. Mobile widths were checked in responsive browser frames.

Python example source lives in `build_python_examples.py`. Run `python course/build_python_examples.py` from the workspace root after editing it; this regenerates the local `python-examples.js`. Open the course with `Open-Course.ps1` to enable Run Python; browsers restrict workers when `index.html` is opened directly as a file. Copy and Download remain available in either mode.

Run Python executes the editor contents on the learner's device using locally bundled Pyodide 314.0.7 (Python 3.14.2) and NumPy 2.4.6. No code-execution request is sent to the server. The local server serves the runtime's files with the JavaScript and WebAssembly content types. The runtime is about 16.4 MB and loads on the first run; NumPy loads when imported. Each run uses fresh lesson variables, execution stops after 10 seconds, and console output is limited to 20,000 characters. Stop terminates the worker and the next run starts a new one. Backend execution and GPUs are not part of this runner; the optional PyTorch snippet uses installed Python.

Use Edit code and Ctrl+Enter (⌘+Enter on Mac) to run a modification. Ctrl+] inserts four spaces. Drafts survive lesson navigation within the current tab but are cleared by a page refresh; download code to keep it. Slider changes preserve custom edits and the sidebar labels its calculated values as a reference. Restore example adopts the current lesson values, while Reset example restores the lesson defaults. The Python output console shows actual execution; the expected/reference result card still explains the lesson's calculation.

`fetch_python_runtime.py` rebuilds `vendor/pyodide` from the pinned official distribution, retaining licenses, checking NumPy's checksum and recording every asset's hash in `runtime-manifest.json`. All runtime assets are served locally, so the course makes no CDN request at study time. The browser supports the bundled NumPy and standard-library examples; extra packages must be bundled separately. See the official [worker guide](https://pyodide.org/en/stable/usage/webworker.html) and [JavaScript API](https://pyodide.org/en/stable/usage/api/js-api.html) for the runtime integration.

Run `python course/validate_python_examples.py` with Python, NumPy and Node installed to execute the examples across the lesson control ranges and compare their numerical outputs with the JavaScript worked examples. If PyTorch is installed, it checks all 13 optional equivalents on CPU and also on CUDA when available, including their actual tensor devices. The current report has 198 Python runs, 54 CPU PyTorch runs, 54 CUDA PyTorch runs and 904 numerical comparisons, with no issues. Results are saved in `python-validation.json`; browser interaction and responsive checks are recorded in `python-ui-validation.json` and `lesson-video-ui-validation.json`.

The actual browser execution audit in `python-runtime-validation.json` covers all 48 lessons across 198 parameter cases, 28 runner/editor behaviors, and all lesson editors at 320, 390, 974 and 1440 CSS pixels. It includes real responsive executions, error tracebacks, stopping and timing out endless loops, recovery, draft preservation, Copy/Download of edits and local runtime asset requests. Existing mathematical validation remains in `lesson-math-validation.json`.

Long Python tracebacks are shortened to 10,000 characters, keeping their beginning and end. If printed output and an error together exceed 20,000 characters, the console shortens earlier output to keep the error visible. Ordinary tracebacks retain their filename, line context and earlier output. The follow-up browser checks in `python-output-validation.json` cover oversized errors, combined stdout/stderr and tracebacks, recovery and the 28 runner/editor behaviors; all 36 checks passed at a measured width of 974 CSS pixels.

## Practice, review and new-lesson maintenance

- `practice-engine.js` holds the answer checker, review schedule, error log and checkpoints; question generators live in `practice-bank-m01-03.js` … `practice-bank-m10-12.js` and inside each extension lesson. Run `node course/validate_practice.cjs` to exercise every generator across 300 seeds (rendering, determinism, tolerances); results go to `practice-validation.json`.
- Lessons 49-68 are self-contained: `lessons/NN-*.md`, `extensions/lesson-NN.json` (metadata), `extensions/lesson-NN.js` (teaching card, worked example, notation, practice and experiment, registered through `extensions.js`) and `extension_examples/lesson_NN.py`. `build_web_data.py`, `build_python_examples.py`, `validate_lessons.cjs` and `validate_python_examples.py` pick them up automatically.
- `build_web_data.py` also indexes the PDF bookmarks so `reading-links.js` can link each cited section to its page. `build_vision_images.py` rebuilds the embedded sample photographs (requires scikit-image). `build_solutions.py` rebuilds `later-solutions.md`. `build_extension_notebook.py` rebuilds the Modules 13-14 notebook and `build_advanced_notebook.py` the Modules 15-17 notebook.
- Primers live in `primers.js` (panel, plots and Glossary) and `primers/*.js` (one `CV_PRIMER.add(lesson, {...})` per lesson; the schema is at the top of `primers.js`). Run `node course/validate_primers.cjs` to check every term: unique ids, valid lesson links, TeX that KaTeX renders and plots that draw; results go to `primer-validation.json`.
- Latest checks (12 October 2026): 68 lessons, 1,887 worked-example cases and 0 issues in `lesson-math-validation.json`; 312 generators, 93,600 instances and 0 issues in `practice-validation.json`; 1,887 Python runs, 108 PyTorch runs (CPU and CUDA) and 10,856 comparisons with 0 issues in `python-validation.json`; 354 primer terms and 0 issues in `primer-validation.json`.
