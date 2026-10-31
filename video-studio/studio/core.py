"""The storyboard toolkit. A storyboard writes chapters of narration and draws each chapter here.

Times in a chapter come from the narration itself: put {name} before a word in the text and
s.cue('name') gives the second that word is spoken. Numbers on screen should be computed in the
storyboard, not typed, so a video cannot disagree with its own maths.
"""
from __future__ import annotations
import hashlib, json, math, re, shutil, xml.etree.ElementTree as ET
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image, ImageFont
from . import narrate

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / 'build'
FPS, W, H = 30, 1920, 1080
LEFT, RIGHT, TOP, BOTTOM = 120, 1800, 150, 985
MAX_BLANK = 1.5

BG, PANEL, LINE, OFF = '#0b131f', '#131e2e', '#2a3a4f', '#192737'
INK, MUTED, GREEN, YELLOW, CORAL, BLUE, VIOLET = '#f1f5f9', '#9aa8bb', '#3ccc91', '#fde68a', '#fb8a8a', '#7cc4fa', '#c4b5fd'

ease_out = lambda u: 1 - (1 - u) ** 3
ease_in = lambda u: u ** 3
ease_io = lambda u: u * u * (3 - 2 * u)
linear = lambda u: u
spring = lambda u: 1 - math.exp(-6 * u) * math.cos(9 * u) if u < 1 else 1.0


def ramp(t, dur, a, b, ease=ease_out, steps=14):
    """Keys that move a to b over dur seconds. All easing is baked in here."""
    if dur <= 0: return [[t, b]]
    return [[t + dur * i / steps, a + (b - a) * ease(i / steps)] for i in range(steps + 1)]


def sample(track, t):
    if not isinstance(track, list): return track
    if t <= track[0][0]: return track[0][1]
    for (t0, v0), (t1, v1) in zip(track, track[1:]):
        if t <= t1: return v0 if t1 == t0 else v0 + (v1 - v0) * (t - t0) / (t1 - t0)
    return track[-1][1]


FONT_FILES = {400: 'DMSans-Regular.ttf', 500: 'DMSans-Medium.ttf', 700: 'DMSans-Bold.ttf'}
_fonts = {}
def text_width(text, size, weight=500):
    key = (size, weight)
    if key not in _fonts: _fonts[key] = ImageFont.truetype(str(ROOT / 'media' / FONT_FILES[weight]), size)
    return _fonts[key].getlength(text)


_characters = None
def font_characters():
    global _characters
    if _characters is None:
        from fontTools.ttLib import TTFont
        _characters = set(TTFont(ROOT / 'media' / FONT_FILES[400]).getBestCmap())
    return _characters


_tex_cache_path = BUILD / 'cache' / 'tex.json'
_tex_cache = None
def _tex_svg(tex):
    global _tex_cache
    if _tex_cache is None:
        _tex_cache = json.loads(_tex_cache_path.read_text(encoding='utf8')) if _tex_cache_path.exists() else {}
    if tex not in _tex_cache:
        out = subprocess.run(['node', str(ROOT / 'tools' / 'tex2svg.cjs')], input=json.dumps([tex]), capture_output=True, text=True, encoding='utf8', cwd=ROOT)
        if out.returncode: raise ValueError(f'MathJax failed on {tex!r}: {out.stderr[-400:]}')
        _tex_cache[tex] = json.loads(out.stdout)[0]
        _tex_cache_path.parent.mkdir(parents=True, exist_ok=True)
        _tex_cache_path.write_text(json.dumps(_tex_cache), encoding='utf8')
    return _tex_cache[tex]


_num = re.compile(r'-?\d*\.?\d+(?:e-?\d+)?')
def _map_path(d, sx, sy, tx, ty):
    """Bakes a scale and translate into MathJax path data, which uses only absolute commands."""
    out = []
    for cmd, args in re.findall(r'([MLHVQTCSZ])([^MLHVQTCSZ]*)', d):
        values = [float(v) for v in _num.findall(args)]
        if cmd == 'H': mapped = [v * sx + tx for v in values]
        elif cmd == 'V': mapped = [v * sy + ty for v in values]
        else: mapped = [v * sx + tx if i % 2 == 0 else v * sy + ty for i, v in enumerate(values)]
        out.append(cmd + ' '.join(f'{v:.2f}' for v in mapped))
    return ''.join(out)


def _flatten(node, sx, sy, tx, ty, fill, out):
    tag = node.tag.rsplit('}', 1)[-1]
    transform = node.get('transform', '')
    for name, args in re.findall(r'(translate|scale)\(([^)]*)\)', transform):
        values = [float(v) for v in re.split(r'[ ,]+', args.strip())]
        if name == 'translate':
            tx, ty = tx + sx * values[0], ty + sy * (values[1] if len(values) > 1 else 0)
        else:
            sx, sy = sx * values[0], sy * (values[1] if len(values) > 1 else values[0])
    fill = node.get('fill', fill)
    if fill == 'currentColor': fill = None
    if tag == 'path':
        out.append((_map_path(node.get('d'), sx, sy, tx, ty), fill))
    elif tag == 'rect':
        x, y, w, h = (float(node.get(k, 0)) for k in ('x', 'y', 'width', 'height'))
        x0, x1, y0, y1 = x * sx + tx, (x + w) * sx + tx, y * sy + ty, (y + h) * sy + ty
        out.append((f'M{x0:.2f} {y0:.2f}L{x1:.2f} {y0:.2f}L{x1:.2f} {y1:.2f}L{x0:.2f} {y1:.2f}Z', fill))
    for kid in node: _flatten(kid, sx, sy, tx, ty, fill, out)


def tex_paths(tex, size):
    """Returns the paths of an equation with its baseline at y=0, and its width, ascent and descent."""
    root = ET.fromstring(_tex_svg(tex))
    x0, y0, width, height = (float(v) for v in root.get('viewBox').split())
    scale = size / 1000
    out = []
    for kid in root: _flatten(kid, scale, scale, -x0 * scale, 0, None, out)
    return out, width * scale, -y0 * scale, (height + y0) * scale


class Scene:
    """Draws one chapter. Anything drawn stays until the chapter ends unless `until` says otherwise."""

    def __init__(self, video, start=0., end=0., cues=None):
        self.v, self.start, self.end, self.cues = video, start, end, cues or {}
        self.dur = end - start
        self._groups = []

    def cue(self, name, plus=0.):
        return self.cues[name] + plus

    def t(self, seconds):
        return self.start + seconds

    def _add(self, item, at, until, fade=.35, out=.25):
        at = self.start if at is None else at
        until = self.end + .2 if until is None else until
        item.update(a=round(at, 3), b=round(until, 3), _in=fade, _out=out)
        (self._groups[-1]['kids'] if self._groups else self.v.items).append(item)
        return item

    def _nested(self, at, until):
        """A child of a group fades with its group unless it was given its own time."""
        if self._groups and at is None:
            g = self._groups[-1]
            return g['a'], g['b'], 0, 0
        return at, until, None, None

    def to(self, item, t, dur=.6, ease=ease_io, **props):
        """Moves numbers or colours of something already drawn, starting at second t."""
        for key, target in props.items():
            old = item.get(key, 1. if key in ('o', 'sx', 'sy') else 0.)
            if key in ('fill', 'stroke'):
                keys = old if isinstance(old, list) else [[0., old]]
                item[key] = keys + [[t, keys[-1][1]], [t + dur, target]]
            else:
                keys = old if isinstance(old, list) else [[0., old]]
                item[key] = keys + ramp(t, dur, keys[-1][1], target, ease)
        return item

    def group(self, x=0, y=0, at=None, until=None, fade=.35, **extra):
        return _Group(self, dict(k='g', x=x, y=y, kids=[], **extra), at, until, fade)

    def text(self, s, x, y, size=36, color=INK, weight=500, anchor='start', at=None, until=None, rise=14, fade=.35):
        missing = {c for c in s if ord(c) not in font_characters()}
        if missing: raise ValueError(f'{s!r}: DM Sans has no {sorted(missing)}. Set it with s.eq.')
        at, until, f, o = self._nested(at, until)
        width = text_width(s, size, weight)
        left = x - (width if anchor == 'end' else width / 2 if anchor == 'middle' else 0)
        self.v.bounds.append((s, left, left + width, y - size, y + size * .3))
        item = dict(k='t', s=s, x=x, y=y, size=size, weight=weight, fill=color, anchor=anchor)
        if rise and f is None:
            start = self.start if at is None else at
            item['y'] = [[start, y + rise]] + ramp(start, .5, y + rise, y)[1:]
        return self._add(item, at, until, fade if f is None else f, .25 if o is None else o)

    def wrap(self, s, x, y, width, size=36, color=INK, weight=500, gap=1.35, **kw):
        """Breaks text to a width. Returns the y just below the last line."""
        words, lines, line = s.split(), [], ''
        for word in words:
            trial = (line + ' ' + word).strip()
            if text_width(trial, size, weight) > width and line: lines.append(line); line = word
            else: line = trial
        lines.append(line)
        for i, part in enumerate(lines): self.text(part, x, y + i * size * gap, size, color, weight, **kw)
        return y + len(lines) * size * gap

    def eq(self, tex, x, y, size=44, color=INK, anchor='start', at=None, until=None, rise=14, fade=.35):
        """An equation with its baseline at y. Use \\textcolor{#hex}{...} to colour a term."""
        paths, width, ascent, descent = tex_paths(tex, size)
        left = x - (width if anchor == 'end' else width / 2 if anchor == 'middle' else 0)
        self.v.bounds.append((tex, left, left + width, y - ascent, y + descent))
        at, until, f, o = self._nested(at, until)
        start = self.start if at is None else at
        y_track = y if not rise or f is not None else [[start, y + rise]] + ramp(start, .5, y + rise, y)[1:]
        item = dict(k='g', x=left, y=y_track, kids=[dict(k='p', d=d, fill=fill or color, a=0, b=1e9) for d, fill in paths])
        item['_size'] = (width, ascent, descent)
        return self._add(item, at, until, fade if f is None else f, .25 if o is None else o)

    def rect(self, x, y, w, h, fill='none', stroke='none', sw=2, r=0, at=None, until=None, grow=None, fade=.35, o=1.):
        at_, until, f, out = self._nested(at, until)
        item = dict(k='r', x=x, y=y, w=w, h=h, r=r, fill=fill, stroke=stroke, sw=sw if stroke != 'none' else 0, o=o)
        start = self.start if at_ is None else at_
        if grow:
            for key, size in (('w', w), ('h', h)):
                if key in grow: item[key] = ramp(start, .55, .5, size)
        return self._add(item, at_, until, fade if f is None else f, .25 if out is None else out)

    def circle(self, x, y, r, fill='none', stroke='none', sw=2, at=None, until=None, fade=.3, o=1.):
        at, until, f, out = self._nested(at, until)
        item = dict(k='c', x=x, y=y, r=r, fill=fill, stroke=stroke, sw=sw if stroke != 'none' else 0, o=o)
        return self._add(item, at, until, fade if f is None else f, .25 if out is None else out)

    def line(self, x1, y1, x2, y2, color=MUTED, sw=3, at=None, until=None, draw=0., dash=None, o=1.):
        at, until, f, out = self._nested(at, until)
        item = dict(k='l', x=x1, y=y1, x2=x2, y2=y2, stroke=color, sw=sw, o=o)
        start = self.start if at is None else at
        if dash: item['dash'] = dash
        elif draw:
            length = math.hypot(x2 - x1, y2 - y1)
            item['dash'], item['off'] = f'{length:.1f} {length + 4:.1f}', ramp(start, draw, length, 0, ease_io)
        return self._add(item, at, until, (.15 if draw else .3) if f is None else f, .25 if out is None else out)

    def path(self, d, fill='none', stroke='none', sw=3, at=None, until=None, fade=.3, o=1.):
        at, until, f, out = self._nested(at, until)
        item = dict(k='p', d=d, fill=fill, stroke=stroke, sw=sw if stroke != 'none' else 0, o=o)
        return self._add(item, at, until, fade if f is None else f, .25 if out is None else out)

    def poly(self, points, color=GREEN, sw=4, at=None, until=None, draw=0., closed=False, fill='none', dash=None, o=1.):
        """A polyline through points, drawn on over `draw` seconds."""
        at, until, f, out = self._nested(at, until)
        d = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in points) + ('Z' if closed else '')
        item = dict(k='p', d=d, fill=fill, stroke=color, sw=sw, o=o)
        start = self.start if at is None else at
        if dash: item['dash'] = dash
        elif draw:
            length = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(points, points[1:]))
            item['dash'], item['off'] = f'{length:.1f} {length + 4:.1f}', ramp(start, draw, length, 0, ease_io)
        return self._add(item, at, until, (.15 if draw else .3) if f is None else f, .25 if out is None else out)

    def arrow(self, x1, y1, x2, y2, color=MUTED, sw=4, head=16, at=None, until=None, draw=.5, dash=None):
        """A line with a head. Its head is tangent to the line and lands as the line arrives."""
        angle = math.atan2(y2 - y1, x2 - x1)
        tipx, tipy = x2 - head * .8 * math.cos(angle), y2 - head * .8 * math.sin(angle)
        line = self.line(x1, y1, tipx, tipy, color, sw, at, until, draw if not dash else 0, dash)
        wing = lambda a: (x2 - head * math.cos(angle + a), y2 - head * math.sin(angle + a))
        (ax, ay), (bx, by) = wing(.5), wing(-.5)
        head_at = None if at is None else at + max(0, draw * .75)
        self.path(f'M{x2:.1f} {y2:.1f}L{ax:.1f} {ay:.1f}L{bx:.1f} {by:.1f}Z', fill=color, at=head_at, until=until, fade=.15)
        return line

    def image(self, data, x, y, w, h, at=None, until=None, pixelated=False, fade=.4, o=1.):
        """Draws an array in 0-1 or 0-255. Pixelated blocks stay sharp when scaled up."""
        at, until, f, out = self._nested(at, until)
        name = self.v.save_image(data, w, h, pixelated)
        item = dict(k='i', s=name, x=x, y=y, w=w, h=h, o=o, anchor='auto')
        return self._add(item, at, until, fade if f is None else f, .25 if out is None else out)

    def cells(self, values, x, y, cw=84, ch=84, color=INK, fill=PANEL, stroke=LINE, size=36, at=None, until=None, stagger=.07, fmt=None):
        """One row of numbers in boxes. Returns the centre x of each box."""
        show = fmt or (lambda v: f'{v:g}')
        for i, value in enumerate(values):
            start = None if at is None else at + i * stagger
            self.rect(x + i * cw, y, cw - 8, ch, fill, stroke, 2, r=10, at=start, until=until)
            self.text(show(value).replace('-', '−'), x + i * cw + (cw - 8) / 2, y + ch / 2 + size * .36, size, color, 500, 'middle', at=start, until=until, rise=0)
        return [x + i * cw + (cw - 8) / 2 for i in range(len(values))]

    def plot(self, x, y, w, h, xr, yr, at=None, until=None, xlabel=None, ylabel=None):
        return Plot(self, x, y, w, h, xr, yr, at, until, xlabel, ylabel)

    def moving_line(self, a, b, keys, screen, color=LINE, sw=2, at=None, until=None, o=1.):
        """A line whose ends follow matrices: keys are (second, 3×3), screen maps a point to pixels.
        Lines stay straight under every matrix here, so the two ends are all that is needed."""
        item = self.line(0, 0, 0, 0, color, sw, at, until, o=o)
        ends = [(t, screen(apply(H, a)), screen(apply(H, b))) for t, H in keys]
        item.update(x=[[t, p[0]] for t, p, _ in ends], y=[[t, p[1]] for t, p, _ in ends], x2=[[t, q[0]] for t, _, q in ends], y2=[[t, q[1]] for t, _, q in ends])
        return item

    def moving_dot(self, p, keys, screen, r=10, color=YELLOW, at=None, until=None):
        item = self.circle(0, 0, r, color, at=at, until=until)
        spots = [(t, screen(apply(H, p))) for t, H in keys]
        item.update(x=[[t, q[0]] for t, q in spots], y=[[t, q[1]] for t, q in spots])
        return item

    def grid(self, keys, screen, lo=-3, hi=3, step=1, color=LINE, sw=2, at=None, until=None, o=1.):
        for v in np.arange(lo, hi + step / 2, step):
            self.moving_line((v, lo), (v, hi), keys, screen, color, sw, at, until, o)
            self.moving_line((lo, v), (hi, v), keys, screen, color, sw, at, until, o)


def bmat(M, fmt='{:g}'):
    """TeX for a matrix of numbers."""
    rows = r'\\'.join('&'.join(fmt.format(v + 0.) for v in row) for row in np.atleast_2d(M))  # + 0. turns -0.0 into 0.0
    return rf'\begin{{bmatrix}}{rows}\end{{bmatrix}}'


def ellipse(mean, cov, scale=1., n=72):
    """Points on the ellipse where the Mahalanobis distance from mean equals scale."""
    values, vectors = np.linalg.eigh(np.asarray(cov, float))
    t = np.linspace(0, 2 * np.pi, n + 1)
    return np.asarray(mean, float) + scale * (vectors @ (np.sqrt(values)[:, None] * np.vstack([np.cos(t), np.sin(t)]))).T


def apply(H, p):
    """Applies a 3×3 matrix to a 2D point, dividing by the last coordinate."""
    x, y, w = np.asarray(H, float) @ np.array([p[0], p[1], 1.])
    return x / w, y / w


def matrix_keys(*stages, start=None):
    """Keys for moving_line and friends. A stage is (second, duration, f), where f(u) is the matrix
    at progress u from 0 to 1. Stages run one after another and hold in between."""
    first = stages[0]
    keys = [(first[0] - .01 if start is None else start, first[2](0.))]
    for t, dur, f in stages:
        keys += [(t + dur * i / 16, f(ease_io(i / 16))) for i in range(17)]
    return keys


class _Group:
    def __init__(self, scene, item, at, until, fade):
        self.scene, self.item, self.at, self.until, self.fade = scene, item, at, until, fade

    def __enter__(self):
        self.scene._add(self.item, self.at, self.until, self.fade)
        self.scene._groups.append(self.item)
        return self.item

    def __exit__(self, *_):
        self.scene._groups.pop()


class Plot:
    """Axes that map data to the screen."""

    def __init__(self, s, x, y, w, h, xr, yr, at, until, xlabel, ylabel):
        self.s, self.x, self.y, self.w, self.h, self.xr, self.yr = s, x, y, w, h, xr, yr
        s.line(x, y + h, x + w, y + h, MUTED, 2, at, until)
        s.line(x, y, x, y + h, MUTED, 2, at, until)
        if xlabel: s.text(xlabel, x + w, y + h + 40, 28, MUTED, 500, 'end', at, until, 0)
        if ylabel: s.text(ylabel, x, y - 16, 28, MUTED, 500, 'start', at, until, 0)

    def pt(self, u, v):
        return (self.x + (u - self.xr[0]) / (self.xr[1] - self.xr[0]) * self.w,
                self.y + self.h - (v - self.yr[0]) / (self.yr[1] - self.yr[0]) * self.h)

    def curve(self, us, vs, color=GREEN, sw=4, at=None, until=None, draw=1., dash=None):
        return self.s.poly([self.pt(u, v) for u, v in zip(us, vs)], color, sw, at, until, draw, dash=dash)

    def dot(self, u, v, r=9, color=YELLOW, at=None, until=None):
        x, y = self.pt(u, v)
        return self.s.circle(x, y, r, color, at=at, until=until)


class Video:
    def __init__(self, key, lesson, title, topic, section, say=None):
        self.key, self.lesson, self.title, self.topic, self.section = key, lesson, title, topic, section
        self.say = {**narrate.SAY, **(say or {})}
        self.chapters = []
        self.items, self.bounds = [], []
        self.dir = BUILD / key

    def chapter(self, label, narration, hold=0.):
        """Registers a chapter. `hold` adds silence after it, for a prediction."""
        def register(draw):
            self.chapters.append(dict(label=label, text=' '.join(narration.split()), hold=hold, draw=draw))
            return draw
        return register

    def save_image(self, data, w, h, pixelated):
        array = np.asarray(data)
        if array.dtype != np.uint8: array = (np.clip(array, 0, 1) * 255).round().astype(np.uint8)
        if pixelated:
            factor = max(1, math.ceil(max(w / array.shape[1], h / array.shape[0]) * 1.5))
            array = np.repeat(np.repeat(array, factor, 0), factor, 1)
        name = 'i' + hashlib.sha1(array.tobytes() + str(array.shape).encode()).hexdigest()[:14] + '.png'
        path = self.dir / 'media' / name
        if not path.exists(): Image.fromarray(array).save(path)
        return name

    def compile(self):
        media = self.dir / 'media'
        if self.dir.exists(): shutil.rmtree(media, ignore_errors=True)
        media.mkdir(parents=True, exist_ok=True)
        time, parts = narrate.LEAD, []
        for i, ch in enumerate(self.chapters):
            spoken = narrate.speakable(ch['text'], self.say)
            clip = narrate.synthesise(spoken)
            ch['display'] = narrate.strip_cues(ch['text'])
            pause = narrate.OUTRO if i == len(self.chapters) - 1 else narrate.PAUSE
            ch.update(time=time, voice_end=time + clip['seconds'], clip=clip, spoken=spoken)
            parts.append(clip)
            ch['end'] = ch['voice_end'] + pause + ch['hold']
            time = ch['end']
        frames = math.ceil(time * FPS) + 1
        narrate.assemble(self.chapters, frames / FPS, media / 'narration.wav')
        for ch in self.chapters:
            s = Scene(self, ch['time'], ch['end'], narrate.cue_times(ch['clip'], ch['spoken'], ch['time']))
            drawn = len(self.items)
            ch['draw'](s)
            first = min((item['a'] for item in self.items[drawn:]), default=ch['end'])
            if first - ch['time'] > MAX_BLANK: print(f'  BLANK for {first - ch["time"]:.1f}s at the start of {ch["label"]!r}')
        self._frame_furniture(frames / FPS)
        issues = [f'{what[:60]!r}: {left:.0f}-{right:.0f} x, {top:.0f}-{bottom:.0f} y' for what, left, right, top, bottom in self.bounds
                  if left < 60 or right > W - 60 or top < 40 or bottom > H - 40]
        if issues: raise ValueError(f'{self.key}: off the safe area:\n  ' + '\n  '.join(issues))
        items = [_finish(item) for item in self.items]
        (self.dir / 'timeline.json').write_text(json.dumps(dict(frames=frames, background=BG, items=items), separators=(',', ':'), default=float), encoding='utf8')
        meta = [dict(label=ch['label'], name=re.sub(r'\W', '', ch['label'].title()), time=ch['time'], end=ch['end'], frames=round((ch['end'] - ch['time']) * FPS),
                     narration=ch['display'], captions=narrate.sentences(ch['clip'], ch['display'], ch['spoken'], ch['time'])) for ch in self.chapters]
        info = dict(key=self.key, lesson=self.lesson, title=self.title, topic=self.topic, duration=frames / FPS, frames=frames, chapters=meta)
        (self.dir / 'video.json').write_text(json.dumps(info, indent=1), encoding='utf8')
        return info

    def _frame_furniture(self, total):
        """The header and chapter progress bar shared with the existing explainers."""
        s = Scene(self, 0, total)
        s.text(self.topic, LEFT, 80, 28, GREEN, 500, rise=0, until=total + 1, fade=0)
        left = LEFT + text_width(self.topic, 28) + 28
        for ch in self.chapters:
            scene = Scene(self, ch['time'], ch['end'])
            scene.text('/  ' + ch['label'].upper(), left, 80, 28, MUTED, 500, rise=0)
        s.text(f'LESSON {self.lesson}  /  {self.section}', RIGHT, 80, 28, MUTED, 500, 'end', rise=0, until=total + 1, fade=0)
        gap, span = 8, RIGHT - LEFT
        usable = span - gap * (len(self.chapters) - 1)
        x, whole = LEFT, sum(ch['end'] - ch['time'] for ch in self.chapters)
        for ch in self.chapters:
            width = usable * (ch['end'] - ch['time']) / whole
            s.rect(x, 1028, width, 6, OFF, r=3, until=total + 1, fade=0)
            s.rect(x, 1028, .5, 6, GREEN, r=3, until=total + 1, fade=0, at=ch['time'])['w'] = [[ch['time'], .5], [ch['end'], width]]
            x += width + gap


def _finish(item):
    """Applies each item's fade in and out to its opacity, and rounds what goes into the JSON."""
    item = dict(item)
    a, b, fade_in, fade_out = item.pop('a', 0), item.pop('b', 1e9), item.pop('_in', 0), item.pop('_out', 0)
    item.pop('_size', None)
    base = item.get('o', 1.)
    if fade_in or fade_out:
        times = sorted({a, a + fade_in, b - fade_out, b} | ({k[0] for k in base} if isinstance(base, list) else set()))
        env = lambda t: min(1, (t - a) / fade_in if fade_in else 1, (b - t) / fade_out if fade_out else 1)
        item['o'] = [[t, max(0., sample(base, t) * env(t))] for t in times]
    item.update(a=a, b=min(b, 1e9))
    if 'kids' in item: item['kids'] = [_finish(kid) for kid in item['kids']]
    for key, value in item.items():
        if isinstance(value, float): item[key] = round(value, 3)
        elif isinstance(value, list) and key != 'kids' and value and isinstance(value[0], list):
            cleaned = []
            for t, v in value:
                if cleaned and t <= cleaned[-1][0]: cleaned[-1] = [cleaned[-1][0], v]
                else: cleaned.append([round(t, 3), round(v, 3) if not isinstance(v, str) else v])
            item[key] = cleaned
    return item
