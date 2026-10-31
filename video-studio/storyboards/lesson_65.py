"""Lesson 65: DETR's three ideas: cross-attention, positional encodings and set prediction."""
import math
from itertools import permutations
import numpy as np
from studio import *
from studio.core import bmat

V = Video('set-prediction', 65, 'Cross-attention and set prediction', 'SET PREDICTION', 'GENERATIVE MODELS AND SPLATTING')


def softmax(z):
    z = np.asarray(z, float)
    return np.exp(z - z.max()) / np.exp(z - z.max()).sum()


Q = np.array([2, 0, 1, 1.])
KEYS = np.array([(1, 0, 1, 1), (0, 1, 0, 0), (1, 1, 0, 0.)])
VALUES = np.array([(1, 0), (0, 1), (.5, .5)])
SCORES = KEYS @ Q
WEIGHTS = softmax(SCORES / 2)
OUTPUT = WEIGHTS @ VALUES
assert np.allclose(SCORES, (4, 0, 2)) and np.allclose(WEIGHTS, (.665, .090, .245), atol=1e-3) and np.allclose(OUTPUT, (.788, .212), atol=1e-3)
assert 100 * 850 == 85000 and 850 ** 2 == 722500


@V.chapter('Queries ask, the image answers', '''
    In self-attention, queries, keys and values all come from one set. {cross}Cross-attention takes the queries from one set and the keys and values from another.
    {q}DETR uses one hundred learned object queries, {img}and eight hundred and fifty image tokens. {out}Each query reads from the whole image and comes back with one row, however many tokens there were.
    {ex}Here a query scores three tokens: four, zero and two. After softmax, it takes mostly from the first.
''')
def cross(s):
    for i in range(8):
        s.rect(170, 250 + i * 66, 120, 52, GREEN, r=8, at=s.cue('q') + i * .05)
    s.text('100 queries', 230, 830, 36, GREEN, anchor='middle', at=s.cue('q'))
    grid = []
    for r in range(6):
        for c in range(7):
            grid.append((640 + c * 66, 260 + r * 66))
            s.rect(640 + c * 66, 260 + r * 66, 56, 56, BLUE, r=6, at=s.cue('img') + (r + c) * .03, o=.75)
    s.text('850 image tokens', 870, 700, 36, BLUE, anchor='middle', at=s.cue('img'))
    for i, (x, y) in enumerate(grid[3::5]):
        s.line(290, 380, x + 28, y + 28, YELLOW, 2, s.cue('out'), o=.5)
    s.eq(r'Y=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt d}\right)V', 1160, 330, 46, at=s.t(.3))
    s.eq(rf'\text{{scores}}=({SCORES[0]:g},\ {SCORES[1]:g},\ {SCORES[2]:g})', 1160, 520, 44, YELLOW, at=s.cue('ex'))
    s.eq(rf'\text{{weights}}\approx({WEIGHTS[0]:.3f},\ {WEIGHTS[1]:.3f},\ {WEIGHTS[2]:.3f})', 1160, 610, 40, GREEN, at=s.cue('ex', 2.2))
    s.eq(rf'100\cdot850=85{{,}}000\ \text{{scores}}', 1160, 760, 40, MUTED, at=s.cue('out', 1))


omega = lambda D: np.array([10000 ** (-2 * i / D) for i in range(D // 2)])


def encoding(p, D=4):
    out = []
    for w in omega(D): out += [math.sin(w * p), math.cos(w * p)]
    return np.array(out)


assert abs(encoding(1) @ encoding(0) - 1.540) < 1e-3 and abs(encoding(5) @ encoding(4) - encoding(1) @ encoding(0)) < 1e-12


@V.chapter('Positions as turning circles', '''
    Attention alone treats its tokens as a set, so positions must be added. Sinusoidal encodings give each position a point on several unit circles.
    {fast}A fast circle separates neighbours. {slow}A slow one tells distant positions apart.
    {dot}And moving by a fixed offset just rotates every pair, so the dot product of two encodings depends only on the offset.
''')
def circles(s):
    centres, radius = ((400, 500), (900, 500)), 170
    t0, t1 = s.start + .3, s.end - .2
    speeds = (1.8, .22)
    for (cx, cy), speed, color, name in zip(centres, speeds, (GREEN, YELLOW), ('fast', 'slow')):
        s.circle(cx, cy, radius, 'none', LINE, 3, at=t0)
        times = np.linspace(t0, t1, 90)
        dot = s.circle(0, 0, 15, color, at=t0)
        hand = s.line(cx, cy, 0, 0, color, 4, t0)
        xs = [[t, cx + radius * math.sin(speed * (t - t0))] for t in times]
        ys = [[t, cy - radius * math.cos(speed * (t - t0))] for t in times]
        dot.update(x=xs, y=ys)
        hand.update(x2=xs, y2=ys)
        s.text(name, cx, cy + radius + 66, 40, color, 700, 'middle', at=s.cue(name))
    s.eq(r'\mathrm{PE}(p)_{2i}=\sin(\omega_ip)', 1240, 300, 42, at=s.t(.3))
    s.eq(r'\mathrm{PE}(p)_{2i+1}=\cos(\omega_ip)', 1240, 380, 42, at=s.t(.3))
    s.eq(r"\mathrm{PE}(p)^T\mathrm{PE}(p')=\sum_i\cos\big(\omega_i(p-p')\big)", 1240, 580, 34, YELLOW, at=s.cue('dot'))
    s.eq(rf'\mathrm{{PE}}(1)\cdot\mathrm{{PE}}(0)={encoding(1) @ encoding(0):.3f}', 1240, 700, 38, GREEN, at=s.cue('dot', 2))
    s.eq(rf'\mathrm{{PE}}(5)\cdot\mathrm{{PE}}(4)={encoding(5) @ encoding(4):.3f}', 1240, 780, 38, GREEN, at=s.cue('dot', 2.6))


@V.chapter('Pause and predict', '''
    DETR outputs one hundred predictions, but this image has two objects. And the objects come in no particular order.
    {ask}So which prediction should be blamed for which object? Pause and think about how you would decide.
''', hold=1.5)
def question(s):
    labels = [('cup', GREEN), ('spoon', YELLOW)]
    for i, (name, color) in enumerate(labels):
        s.rect(300, 280 + i * 190, 280, 140, PANEL, color, 4, r=12, at=s.t(.3))
        s.text(name, 440, 365 + i * 190, 46, color, 700, 'middle', at=s.t(.3))
    for i in range(3):
        s.rect(1220, 230 + i * 170, 340, 140, PANEL, LINE, 3, r=12, at=s.t(.7) + i * .2)
        s.text(f'prediction {i + 1}', 1390, 312 + i * 170, 40, anchor='middle', at=s.t(.7) + i * .2)
    s.eq('?', 900, 490, 150, YELLOW, 'middle', at=s.cue('ask'))


def giou(a, b):
    w = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    h = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = w * h
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    union = area(a) + area(b) - inter
    hull = (max(a[2], b[2]) - min(a[0], b[0])) * (max(a[3], b[3]) - min(a[1], b[1]))
    return inter / union - (hull - union) / hull


CUP, SPOON = (0, 0, 2, 2), (3, 0, 5, 2)
PRED = [((0, 0, 2, 2), (.8, .05, .15)), ((.5, 0, 2.5, 2), (.7, .1, .2)), ((3.5, 0, 5.5, 2), (.1, .6, .3))]
COST = np.array([[-p[c] + 1 - giou(target, box) for box, p in PRED] for c, target in enumerate((CUP, SPOON))])
assert np.allclose(COST, [[-.8, -.3, 1.173], [1.15, 1.011, -.2]], atol=1e-3)
totals = {(i, j): COST[0, i] + COST[1, j] for i, j in permutations(range(3), 2)}
BEST = min(totals, key=totals.get)
assert BEST == (0, 2) and abs(totals[BEST] + 1) < 1e-9
assert abs(giou(CUP, SPOON) + .2) < 1e-9 and abs(giou(CUP, (6, 0, 8, 2)) + .5) < 1e-9


@V.chapter('Match first, then score', '''
    Choose the best one-to-one assignment, and then compute the loss. {m}Build a cost matrix from class scores and box overlap.
    {h}The Hungarian algorithm picks the minimum: cup to prediction one, spoon to prediction three, a total of minus one.
    {dup}Prediction two is a near-duplicate of one, so it's matched to no object, and its loss pushes it down. {nms}Duplicates are trained away, which is why DETR needs no non-maximum suppression.
''')
def match(s):
    x0, y0, w, h = 560, 280, 220, 130
    for j in range(3): s.text(f'pred {j + 1}', x0 + j * w + (w - 10) / 2, y0 - 26, 36, MUTED, anchor='middle', at=s.t(.2))
    for i, (name, color) in enumerate((('cup', GREEN), ('spoon', YELLOW))):
        s.text(name, x0 - 30, y0 + i * (h + 12) + 76, 42, color, 700, 'end', at=s.t(.2))
        for j in range(3):
            s.rect(x0 + j * w, y0 + i * (h + 12), w - 10, h, PANEL, LINE, r=10, at=s.t(.2))
            s.text(f'{COST[i, j]:.3f}'.rstrip('0').rstrip('.').replace('-', '−'), x0 + j * w + (w - 10) / 2, y0 + i * (h + 12) + 80, 46, anchor='middle', at=s.cue('m', .2), rise=0)
    for i, j in enumerate(BEST):
        s.rect(x0 + j * w, y0 + i * (h + 12), w - 10, h, 'none', GREEN, 6, r=10, at=s.cue('h') + i * .5)
    s.rect(x0 + 1 * w, y0, w - 10, 2 * h + 12, 'none', CORAL, 5, r=10, at=s.cue('dup'))
    s.eq(rf'-\ln\hat p_2(\varnothing)=-\ln0.2={-math.log(.2):.3f}', 560, 700, 48, CORAL, at=s.cue('dup', 1.2))
    s.text('No non-maximum suppression needed.', 560, 830, 44, GREEN, at=s.cue('nms'))


@V.chapter('GIoU still slopes when boxes miss', '''
    One last problem. Two separated boxes have an IoU of zero wherever they are, so the loss gives no direction.
    {g}Generalised IoU subtracts the share of the enclosing box that neither covers.
    {slide}Slide the box closer and the loss falls steadily: one point five, one point two, one, and point six seven.
    {end}The boxes now know which way to move.
''', hold=.6)
def giou_slide(s):
    unit = 90
    to = lambda x: 180 + x * unit
    y0, h = 300, 2 * unit
    s.rect(to(0), y0, 2 * unit, h, GREEN, r=6, at=s.t(.2), o=.8)
    s.text('A', to(1), y0 + h / 2 + 14, 42, BG, 700, 'middle', at=s.t(.2))
    stops = [6, 3, 2, 1]
    box = s.rect(to(stops[0]), y0, 2 * unit, h, YELLOW, r=6, at=s.t(.4), o=.8)
    hull = s.rect(to(0) - 8, y0 - 8, (stops[0] + 2) * unit + 16, h + 16, 'none', CORAL, 3, r=8, at=s.cue('g'), until=s.cue('end'))
    gap = 1.7
    for i, stop in enumerate(stops):
        at = s.cue('slide') + (i - 1) * gap
        if i:
            s.to(box, at, .9, ease_io, x=to(stop))
            s.to(hull, at, .9, ease_io, w=(max(stop + 2, 2)) * unit + 16)
        value = 1 - giou(CUP, (stop, 0, stop + 2, 2))
        s.text(f'{value:.3g}', 200 + i * 260, 660, 56, CORAL if i == 0 else GREEN, 700, at=at + .5)
        s.text(f'B at x = {stop}', 200 + i * 260, 712, 30, MUTED, at=at + .5)
    s.eq(r'\mathrm{GIoU}=\mathrm{IoU}-\frac{|C|-|A\cup B|}{|C|}', 960, 860, 46, anchor='middle', at=s.cue('g'))
