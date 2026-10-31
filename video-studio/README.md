# Video studio

This folder makes the course's animated explanations: the 19 videos for Lessons 41, 49, 51-54 and 56-68, published to `course/media/fframes/` and listed in `course/explainer-video-data.js`. It is not published with the site.

It exists because the tooling behind the earlier videos was kept out of the repository and has been lost. Those videos still play, but they cannot be re-rendered. Everything needed for these 19 is here, so please keep it committed.

## How it fits together

| Step | Tool | Where |
|---|---|---|
| Storyboard: narration, computed maths, drawing | Python, NumPy | `storyboards/lesson_NN.py`, `studio/core.py` |
| Equations | MathJax 3, converted to vector paths | `tools/tex2svg.cjs` |
| Narration, with the second each word is spoken | Kokoro-82M, voice `af_heart`, on the GPU | `studio/narrate.py` |
| Drawing frames and encoding | FFrames 1.3 with Skia on Vulkan, then libx264 | `src/main.rs` |
| Checks and adding to the course | FFmpeg | `studio/publish.py` |

A storyboard writes `build/<key>/timeline.json`, and the Rust program plays that file. So changing a video never needs a recompile. FFrames can do far more than this program uses; it is deliberately a small player.

## Set up, once

Needs Rust, Node, Python with `kokoro`, `soundfile`, `scikit-image`, `scipy`, `fonttools`, `pillow` and `torch` (Lesson 64 trains a small network), and a Vulkan GPU.

1. Unzip `ffmpeg-n9.0-latest-win64-gpl-shared-9.0.zip` from [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds/releases/tag/latest) into `video-studio/.tools/`.
2. In PowerShell, from this folder:

```powershell
. .\env.ps1                 # sets FFMPEG_DIR, LIBCLANG_PATH and PATH for this shell
cargo build --release       # about 3 minutes the first time
npm install
```

`env.ps1` looks for libclang in `C:\msys64\ucrt64\bin`. Set `LIBCLANG_PATH` first if yours is elsewhere, for example `C:\Program Files\LLVM\bin`.

The Kokoro model downloads on first use. Its revision is pinned in `studio/narrate.py`, and narration is cached in `build/cache`, so unchanged sentences are not spoken again.

## Make a video

Run these from `video-studio`:

```bash
python -m studio lesson_56                                  # narration, timeline, chapter timings
python -m studio lesson_56 strip -n 24 --columns 4 --width 620   # contact sheet in build/<key>/strip.png
python -m studio lesson_56 frame 40s                        # any other FFrames command
python -m studio lesson_56 publish                          # render, verify, add to the course
```

After publishing, bump the `explainer-video-data.js?v=` number in `course/index.html`.

`publish` stops if the frame count, picture format, full decode or loudness (-14 LUFS, as the other explainers) is wrong.

## Writing a storyboard

Copy a short one, such as `storyboards/lesson_61.py`.

- A chapter is narration plus a drawing function. Put `{name}` before a word, and `s.cue('name')` is the second it is spoken, so motion lands on the words.
- **Compute what appears on screen, and assert it against the lesson.** A wrong number should stop the build. These asserts caught real mistakes while the videos were written.
- Each video needs a `Pause and predict` chapter, because the player tells learners to pause there. Show the answer on screen when the narrator gives it.
- Write numbers and symbols the way they should be spoken. Add names the voice misreads to `SAY` in `studio/narrate.py`.
- Greek letters are not in DM Sans, so set them with `s.eq`. The build stops if a character has no glyph, if text leaves the safe area, and warns about a blank opening.
- Show what is real, and say what is not. A sampler that plays noising backwards is not a sampler; Lesson 67 runs real DDIM instead.
- Then look at the contact sheet. Most problems only show up there.

Nothing here can listen to the result, so pronunciation is unchecked until someone hears it.
