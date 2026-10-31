"""Lesson 56: why one feature map is not enough, and how pyramids, FPN and U-Net fix it."""
import math
import numpy as np
from skimage import data
from skimage.transform import resize
from studio import *

V = Video('feature-pyramids', 56, 'Every scale at once: pyramids, FPN and U-Net', 'MULTI-SCALE', 'MODERN ARCHITECTURES')

PHOTO = data.chelsea()[20:276, 100:356] / 255.
TAPS = np.array([1, 4, 6, 4, 1]) / 16


def blur(image):
    out = image
    for axis in (0, 1):
        out = np.apply_along_axis(lambda line: np.convolve(np.pad(line, 2, mode='reflect'), TAPS, 'valid'), axis, out)
    return out


halve = lambda image: blur(image)[::2, ::2]
up = lambda image, shape: resize(image, shape, order=1, anti_aliasing=False)
levels = [PHOTO]
for _ in range(3): levels.append(halve(levels[-1]))
detail = levels[0] - up(levels[1], levels[0].shape)
without_finest = up(levels[1], levels[0].shape)
assert np.allclose(detail + without_finest, levels[0])


@V.chapter('One map cannot do both', '''
    One street photo can hold a pedestrian twenty-four pixels tall {bus}and a bus four hundred pixels wide.
    {grid}At stride thirty-two, every feature cell covers a thirty-two pixel block, {small}so the pedestrian is three quarters of one cell.
    {fine}A stride-four map places it precisely, {rf}but there a three by three layer adds eight pixels of context, not sixty-four.
    {pair}One map knows where, the other knows what. We need both.
''')
def one_map(s):
    scale, x0, y0 = 1.4, 150, 170
    px = lambda v: v * scale
    s.rect(x0, y0, px(512), px(512), PANEL, LINE, r=4)
    road = y0 + px(360)
    s.rect(x0, road, px(512), px(152), '#17243a')
    person = (x0 + px(466), road - px(24))
    s.circle(person[0] + px(4.5), person[1] + px(3.5), px(3.5), YELLOW)
    s.rect(person[0] + px(1.5), person[1] + px(7), px(6), px(17), YELLOW, r=2)
    s.text('24 px', person[0] + px(4.5), person[1] - 18, 32, YELLOW, anchor='middle', until=s.cue('rf'))
    with s.group(x0 + px(24), road - px(150), s.cue('bus')):
        s.rect(0, 0, px(400), px(135), '#2f6f6a', r=14)
        for i in range(7): s.rect(px(16 + i * 54), px(22), px(44), px(48), '#a8dadc', r=4)
        for wheel in (80, 320): s.circle(px(wheel), px(137), px(20), '#0d1420', INK, 4)
    s.text('400 px', x0 + px(224), road - px(166), 32, MUTED, anchor='middle', at=s.cue('bus', .2))
    for i in range(17):
        pos = px(i * 32)
        s.line(x0 + pos, y0, x0 + pos, y0 + px(512), GREEN, 2, s.cue('grid') + i * .02, s.cue('fine'), o=.6)
        s.line(x0, y0 + pos, x0 + px(512), y0 + pos, GREEN, 2, s.cue('grid') + i * .02, s.cue('fine'), o=.6)
    s.text('stride 32: 16 × 16 cells', x0, y0 + px(512) + 60, 36, GREEN, at=s.cue('grid'), until=s.cue('fine'))

    x1, side, top = 1000, 400, 230
    s.rect(x1, top, side, side, 'none', GREEN, 4, r=4, at=s.cue('small'), until=s.cue('fine'))
    tall = side * 24 / 32
    s.circle(x1 + side / 2, top + side - tall + tall * .15, tall * .15, YELLOW, at=s.cue('small'), until=s.cue('fine'))
    s.rect(x1 + side / 2 - tall * .12, top + side - tall * .7, tall * .24, tall * .7, YELLOW, r=8, at=s.cue('small'), until=s.cue('fine'))
    s.text('one cell', x1 + side + 40, top + 44, 36, GREEN, at=s.cue('small'), until=s.cue('fine'))
    s.eq(r'\frac{24}{32}=' + f'{24 / 32:g}', x1 + side + 40, top + 200, 58, YELLOW, at=s.cue('small', .4), until=s.cue('fine'))

    wide, narrow = (3 - 1) * 32, (3 - 1) * 4
    cx, cy = person[0] + px(4.5), person[1] + px(12)
    s.rect(cx - px(wide) / 2, cy - px(wide) / 2, px(wide), px(wide), 'none', GREEN, 4, at=s.cue('rf'))
    s.rect(cx - px(narrow) / 2, cy - px(narrow) / 2, px(narrow), px(narrow), 'none', BLUE, 3, at=s.cue('rf'))
    s.eq(r'r_{\text{next}}=r+(K-1)\,j', x1, 290, 58, at=s.cue('fine'))
    s.eq(rf'\textcolor{{{GREEN}}}{{j=32:\ (3-1)\cdot 32={wide}\text{{ px}}}}', x1, 430, 50, at=s.cue('rf'))
    s.eq(rf'\textcolor{{{BLUE}}}{{j=4:\ (3-1)\cdot 4={narrow}\text{{ px}}}}', x1, 530, 50, at=s.cue('rf', .3))
    s.text('stride 4 knows where', x1, 700, 48, BLUE, at=s.cue('pair'))
    s.text('stride 32 knows what', x1, 775, 48, GREEN, at=s.cue('pair', .3))


@V.chapter('Blur, then halve', '''
    The classical answer is a pyramid. {blur}Blur the image, {keep}keep every second pixel in each direction, and repeat.
    {why}The blur matters. {drop}Drop every second pixel of these fine stripes, and they turn into false, coarse stripes.
    {fixed}Blur first, and the false pattern is gone. {sum}Each level has a quarter of the pixels below it,
    so the whole pyramid costs under four thirds of the image.
''')
def gaussian(s):
    x, base, gap = 130, 800, 28
    for i, level in enumerate(levels):
        size = 440 / 2 ** i
        at = s.start if i == 0 else s.cue('keep') + (i - 1) * .55
        s.image(level, x, base - size, size, size, at, pixelated=True)
        s.eq(f'G_{i}', x + size / 2, base + 56, 38, MUTED, 'middle', at=at)
        s.text(f'{level.shape[0]} px', x + size / 2, base - size - 18, 30, MUTED, anchor='middle', at=at, rise=0)
        x += size + gap
    s.eq(r'G_{k+1}=\operatorname{down}_2\big(\,g * G_k\,\big)', 130, 250, 60, at=s.cue('blur'))
    stripes = (np.sin(2 * np.pi * .42 * np.add.outer(np.arange(64), np.arange(64) * .15)) + 1) / 2
    dropped, cleaned = stripes[::2, ::2], halve(stripes)
    x2, top, side = 1090, 300, 215
    s.image(stripes, x2, top, side, side, s.cue('why'), pixelated=True)
    s.text('fine stripes', x2 + side / 2, top - 20, 32, MUTED, anchor='middle', at=s.cue('why'))
    s.image(dropped, x2 + side + 30, top, side, side, s.cue('drop'), pixelated=True)
    s.text('dropped', x2 + side + 30 + side / 2, top - 20, 32, CORAL, anchor='middle', at=s.cue('drop'))
    s.image(cleaned, x2 + 2 * side + 60, top, side, side, s.cue('fixed'), pixelated=True)
    s.text('blurred first', x2 + 2 * side + 60 + side / 2, top - 20, 32, GREEN, anchor='middle', at=s.cue('fixed'))
    s.eq(r'1+\frac14+\frac1{16}+\dots=\frac43', 1090, 720, 58, YELLOW, at=s.cue('sum'))


FINE = np.array([4., 6., 10., 2.])
COARSE = FINE.reshape(2, 2).mean(1)
TOP = COARSE.mean(keepdims=True)
UP = np.repeat(COARSE, 2)
L0 = FINE - UP


@V.chapter('Store what each halving lost', '''
    A Laplacian pyramid stores what each halving lost. {g0}Take four, six, ten, two.
    {g1}Average each pair: five and six. {g2}Average again: five point five.
    {up}Now repeat five and six to upsample: five, five, six, six. {l0}Subtract from the original.
    Minus one, one, four, minus four. {eq}That is L zero, the part the coarser level cannot predict.
''')
def laplacian(s):
    x, y, cw, ch = 230, 190, 150, 116
    rows = [(FINE, 1, 'g0', '0'), (COARSE, 2, 'g1', '1'), (TOP, 4, 'g2', '2')]
    s.text('Average each pair', x, y - 8, 30, MUTED, at=s.start)
    for i, (values, wide, cue, name) in enumerate(rows):
        at = s.t(.2) if i == 0 else s.cue(cue)
        s.eq(f'G_{name}', x - 26, y + 22 + i * 140 + ch / 2, 44, MUTED, 'end', at=at)
        s.cells(values, x, y + 22 + i * 140, cw * wide, ch, size=46, at=at)
    x2 = 1120
    s.eq('G_0', x2 - 26, y + 22 + ch / 2, 44, MUTED, 'end', at=s.cue('up', -.1))
    s.cells(FINE, x2, y + 22, cw, ch, size=46, at=s.cue('up', -.1), stagger=0)
    s.eq(r'\operatorname{up}(G_1)', x2 - 26, y + 162 + ch / 2, 44, BLUE, 'end', at=s.cue('up'))
    s.cells(UP, x2, y + 162, cw, ch, BLUE, stroke=BLUE, size=46, at=s.cue('up'))
    s.line(x2, y + 292, x2 + 4 * cw - 8, y + 292, MUTED, 4, s.cue('l0'), draw=.4)
    s.eq('L_0', x2 - 26, y + 306 + ch / 2, 50, YELLOW, 'end', at=s.cue('l0', .3))
    s.cells(L0, x2, y + 306, cw, ch, YELLOW, stroke=YELLOW, size=46, at=s.cue('l0', .3))
    s.eq(r'L_k=G_k-\operatorname{up}(G_{k+1})', 960, 850, 62, YELLOW, 'middle', at=s.cue('eq'))


@V.chapter('Pause and predict', '''
    A quick test. {q}Set L zero to all zeros, then rebuild from the top. {ask}Which four numbers come back? Pause here and work it out.
''', hold=1.5)
def predict(s):
    s.eq(r'G_0=L_0+\operatorname{up}(G_1)', 960, 300, 76, anchor='middle')
    s.eq(rf'\textcolor{{{YELLOW}}}{{L_0=(0,\,0,\,0,\,0)}}', 960, 430, 56, anchor='middle', at=s.cue('q'))
    s.cells(['?'] * 4, 960 - 256, 540, 128, 128, YELLOW, stroke=YELLOW, size=62, at=s.cue('ask'), fmt=str)


@V.chapter('What the finest level carries', '''
    You get five, five, six, six, and the error is exactly L zero. {band}On a real image, the finest level looks like the edges.
    {soft}Without it, the picture goes soft. {exact}Keep every level and rebuilding is exact, for any blur,
    because each step adds back exactly what was subtracted.
''')
def finest(s):
    s.cells(UP, 150, 180, 120, 96, GREEN, stroke=GREEN, size=42)
    s.text('error', 700, 242, 38, MUTED)
    s.cells(FINE - UP, 830, 180, 120, 96, YELLOW, stroke=YELLOW, size=42, at=s.t(.8))
    side, top = 460, 340
    shown = [(PHOTO, 'original', INK, s.start), (.5 + 3 * detail.mean(2, keepdims=True).repeat(3, 2), 'finest level, brightened', YELLOW, s.cue('band')), (without_finest, 'rebuilt without it', CORAL, s.cue('soft'))]
    for i, (image, label, color, at) in enumerate(shown):
        x = 150 + i * (side + 100)
        s.image(image, x, top, side, side, at, pixelated=True)
        s.text(label, x + side / 2, top + side + 56, 36, color, anchor='middle', at=at)


STRIDES = [4, 8, 16, 32]
SIDE = lambda stride: 300 / (stride / 4) ** .72


@V.chapter('A backbone is already a pyramid', '''
    A ResNet already computes a pyramid in one pass. {weak}But its fine maps are sharp with weak features.
    {top}A feature pyramid network adds a top-down path. {p5}Start from P five.
    {eq}Each level upsamples the coarser map and adds a one by one convolution of the matching C map.
    {shared}Every level now has its own resolution and the deep meaning, with 256 channels, so one detection head serves them all.
''')
def fpn(s):
    cx, right, base = 340, 960, 925
    ys, y = [], base
    for stride in STRIDES:
        side = SIDE(stride) * .88
        y -= side / 2
        ys.append(y)
        y -= side / 2 + 44
    semantics = ['#3a4a5e', '#3f6a68', '#3b9a7c', GREEN]
    for i, stride in enumerate(STRIDES):
        side, y = SIDE(stride), ys[i]
        at = s.t(.1 + i * .4)
        s.rect(cx - side / 2, y - side * .44, side, side * .88, semantics[i], r=8, at=at)
        s.eq(f'C_{i + 2}', cx - side / 2 - 20, y + 14, 42, MUTED, 'end', at=at)
        s.text(f'stride {stride}', cx + side / 2 + 20, y + 11, 30, MUTED, at=at)
        if i < 3: s.arrow(cx, y - side * .44 - 2, cx, ys[i + 1] + SIDE(STRIDES[i + 1]) * .44 + 2, MUTED, 3, 13, at + .35, draw=.25)
    s.text('sharp, weak', cx, 975, 32, CORAL, anchor='middle', at=s.cue('weak'))
    order = [3, 2, 1, 0]
    for n, i in enumerate(order):
        side, y = SIDE(STRIDES[i]), ys[i]
        at = s.cue('p5') if n == 0 else s.cue('eq') + n * .9
        s.rect(right - side / 2, y - side * .44, side, side * .88, GREEN, r=8, at=at)
        s.eq(f'P_{i + 2}', right + side / 2 + 20, y + 14, 42, GREEN, at=at)
        s.arrow(cx + SIDE(STRIDES[i]) / 2 + 150, y, right - side / 2 - 8, y, BLUE, 3, 14, at - .3, draw=.25)
        if n:
            above = order[n - 1]
            s.arrow(right, ys[above] + SIDE(STRIDES[above]) * .44 + 2, right, y - side * .44 - 4, YELLOW, 4, 15, at - .4, draw=.25)
    s.eq(rf'P_k=\textcolor{{{YELLOW}}}{{\operatorname{{up}}(P_{{k+1}})}}+\textcolor{{{BLUE}}}{{\operatorname{{conv}}_{{1\times1}}(C_k)}}', 1215, 300, 44, at=s.cue('eq'))
    s.wrap('Own resolution, plus the deep meaning.', 1260, 470, 520, 38, at=s.cue('shared'))
    s.wrap('256 channels, one shared head.', 1260, 610, 520, 38, GREEN, at=s.cue('shared', .9))


def fpn_level(w, h):
    raw = 4 + math.log2(math.sqrt(w * h) / 224)
    return raw, min(5, max(2, math.floor(raw)))


assert [fpn_level(n, n)[1] for n in (224, 112, 448, 40)] == [4, 3, 5, 2]


@V.chapter('Give each box its level', '''
    Each box goes to the level that fits its size. {eq}Take the square root of its area over 224, take log base two, add four, and round down.
    {a}A 224 box goes to P four. {b}Half that goes to P three, {c}and double it to P five.
    {d}A forty-pixel box gives about one point five, {floor}rounds down to one, and is clamped to P two, the lowest level.
''')
def routing(s):
    s.eq(r'k=\left\lfloor 4+\log_2\frac{\sqrt{wh}}{224}\right\rfloor', 960, 280, 66, anchor='middle')
    for i, (size, cue) in enumerate(((224, 'a'), (112, 'b'), (448, 'c'), (40, 'd'))):
        raw, level = fpn_level(size, size)
        x = 150 + i * 420
        side = size * .55
        s.rect(x + (360 - side) / 2, 680 - side, side, side, 'none', YELLOW, 4, r=4, at=s.cue(cue))
        s.text(f'{size} × {size}', x + 180, 736, 38, anchor='middle', at=s.cue(cue))
        s.text(f'k = {raw:.2f}' if i == 3 else f'k = {raw:g}', x + 180, 796, 36, MUTED, anchor='middle', at=s.cue(cue, .1))
        s.eq(f'P_{level}', x + 180, 890, 76, GREEN, 'middle', at=s.cue('floor' if i == 3 else cue, .3))
    s.text('floor 1, clamped to 2', 1590, 960, 32, CORAL, anchor='middle', at=s.cue('floor', .4))


@V.chapter('U-Net keeps the location', '''
    Segmentation needs a label for every pixel. {enc}U-Net's encoder goes down, from 256 pixels and 64 channels
    to a bottleneck of sixteen pixels and 1024 channels. {dec}The decoder climbs back up,
    {skip}and at each scale it joins the encoder map of the same size.
    {add}At thirty-two pixels, 512 upsampled channels plus 512 skipped channels make 1024.
    {role}The skips bring back the location. The decoder brings the context.
''')
def unet(s):
    labels = levels[3].mean(2) > levels[3].mean()
    s.image(PHOTO, 420, 300, 420, 420, s.start, s.cue('enc'), pixelated=True)
    s.image(np.dstack([labels * .24 + .1, labels * .8 + .1, labels * .57 + .12]), 900, 300, 420, 420, s.t(.5), s.cue('enc'), pixelated=True)
    s.text('one label per pixel', 960, 800, 40, GREEN, anchor='middle', at=s.t(.5), until=s.cue('enc'))
    sizes, channels = [256, 128, 64, 32], [64, 128, 256, 512]
    ys = [235 + i * 165 for i in range(5)]
    height = lambda n: 30 + 125 * n / 256
    width = lambda c: 22 + 16 * math.log2(c / 64)
    left, right, step = 400, 1240, 84
    for i, (n, c) in enumerate(zip(sizes, channels)):
        at, dec = s.cue('enc') + i * .55, s.cue('dec') + (3 - i) * .55
        h, w = height(n), width(c)
        s.rect(left + i * step - w / 2, ys[i] - h / 2, w, h, BLUE, r=5, at=at)
        s.text(f'{n}² × {c}', left + i * step - w / 2 - 18, ys[i] + 11, 32, MUTED, anchor='end', at=at)
        s.rect(right - i * step - w / 2, ys[i] - h / 2, w, h, GREEN, r=5, at=dec)
        s.arrow(left + i * step + w / 2 + 12, ys[i], right - i * step - w / 2 - 12, ys[i], YELLOW, 4, 16, s.cue('skip') + (3 - i) * .4, draw=.5)
        if i < 3:
            below = height(sizes[i + 1]) / 2 + 8
            s.arrow(left + i * step, ys[i] + h / 2 + 6, left + (i + 1) * step, ys[i + 1] - below, MUTED, 3, 13, at + .3, draw=.3)
            s.arrow(right - (i + 1) * step, ys[i + 1] - below, right - i * step, ys[i] + h / 2 + 6, MUTED, 3, 13, dec - .4, draw=.3)
    mid = (left + right) / 2
    s.rect(mid - 40, ys[4] - 30, 80, 60, VIOLET, r=6, at=s.cue('enc', 2.3))
    s.text('16² × 1024', mid, ys[4] + 74, 34, VIOLET, anchor='middle', at=s.cue('enc', 2.3))
    s.arrow(left + 3 * step, ys[3] + 40, mid - 46, ys[4] - 10, MUTED, 3, 13, s.cue('enc', 2.2), draw=.3)
    s.arrow(mid + 46, ys[4] - 10, right - 3 * step, ys[3] + 40, MUTED, 3, 13, s.cue('dec', -.1), draw=.3)
    s.eq(rf'512+\textcolor{{{YELLOW}}}{{512}}={512 + 512}', 1380, 540, 50, at=s.cue('add'))
    s.text('channels at 32 × 32', 1380, 605, 32, MUTED, at=s.cue('add', .2))
    s.text('skips: where', 1380, 740, 44, YELLOW, at=s.cue('role'))
    s.text('decoder: what', 1380, 806, 44, GREEN, at=s.cue('role', 1.1))


@V.chapter('Add or concatenate', '''
    Both designs merge fine location with deep context. {fpn}FPN adds the two streams, so the channel count stays the same.
    {unet}U-Net concatenates them and lets the next convolution learn how to mix them.
    {end}Either way, the network reads every scale in a single pass.
''')
def merge(s):
    panel = lambda x, title, color, at: (s.rect(x, 200, 800, 580, PANEL, LINE, r=14, at=at), s.text(title, x + 44, 275, 44, color, 700, at=at))
    panel(130, 'FPN adds', GREEN, s.t(.1))
    panel(990, 'U-Net concatenates', YELLOW, s.t(.1))
    for x, color in ((200, BLUE), (350, GREEN)):
        s.rect(x, 360, 84, 270, color, r=6, at=s.cue('fpn'))
        s.text('256', x + 42, 682, 34, MUTED, anchor='middle', at=s.cue('fpn'))
    s.eq('+', 317, 512, 56, anchor='middle', at=s.cue('fpn'))
    s.arrow(464, 495, 620, 495, MUTED, 4, at=s.cue('fpn', .5))
    s.rect(660, 360, 84, 270, GREEN, r=6, at=s.cue('fpn', .9))
    s.text('256', 702, 682, 34, GREEN, 700, 'middle', at=s.cue('fpn', .9))
    s.rect(1060, 360, 84, 270, BLUE, r=6, at=s.cue('unet'))
    s.rect(1154, 360, 84, 270, YELLOW, r=6, at=s.cue('unet'))
    s.text('512 + 512', 1149, 682, 34, MUTED, anchor='middle', at=s.cue('unet'))
    s.arrow(1270, 495, 1410, 495, MUTED, 4, at=s.cue('unet', .5))
    s.rect(1440, 360, 84, 270, BLUE, r=6, at=s.cue('unet', .9))
    s.rect(1524, 360, 84, 270, YELLOW, r=6, at=s.cue('unet', .9))
    s.text('1024', 1524, 682, 34, YELLOW, 700, 'middle', at=s.cue('unet', .9))
    s.text('Fine location plus deep context, in one pass.', 960, 890, 50, anchor='middle', at=s.cue('end'))
