"""python -m studio <storyboard> [FFrames command...]

  python -m studio lesson_56                     compile only: narration, timeline, timing report
  python -m studio lesson_56 strip -n 24         a contact sheet, written into build/<key>/
  python -m studio lesson_56 render -o out.mp4   any FFrames command
  python -m studio lesson_56 publish             render, verify and add it to the course
"""
import importlib, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.stdout.reconfigure(encoding='utf8')


def environment(video_dir):
    env = dict(os.environ, CV_VIDEO=str(video_dir))
    ffmpeg = next((ROOT / '.tools').glob('ffmpeg-n9*'), None)
    if ffmpeg is None: sys.exit('Put the FFmpeg 9 shared build in video-studio/.tools; see README.md.')
    env['PATH'] = f'{ffmpeg / "bin"};{env["PATH"]}'
    return env


def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    name, command = sys.argv[1], sys.argv[2:]
    video = importlib.import_module(f'storyboards.{name}').V
    info = video.compile()
    print(f'{video.key}: {info["duration"]:.1f}s, {len(info["chapters"])} chapters, {sum(len(c["narration"].split()) for c in info["chapters"])} words')
    for ch in info['chapters']: print(f'  {ch["time"]:6.1f}  {ch["label"]}')
    if not command: return
    if command[0] == 'publish':
        from . import publish
        publish.publish(video, info, environment(video.dir))
        return
    binary = ROOT / 'target' / 'release' / 'cv-studio.exe'
    sys.exit(subprocess.run([str(binary), *command], env=environment(video.dir), cwd=video.dir).returncode)


main()
