"""Lesson 68: a scene of 3D Gaussians, projected to 2D splats and composited."""
import math
import numpy as np
from studio import *
from studio.core import bmat, ellipse

V = Video('gaussian-splatting', 68, '3D Gaussian splatting', 'GAUSSIAN SPLATTING', 'GENERATIVE MODELS AND SPLATTING')


def turn(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])


SCALES = np.diag([.3, .1, .1])
covariance = lambda deg: turn(deg) @ SCALES @ SCALES.T @ turn(deg).T
assert np.allclose(np.diag(covariance(90)), (.01, .09, .01))
c45 = covariance(45)
assert abs(c45[0, 0] - .05) < 1e-9 and abs(c45[0, 1] - .04) < 1e-9
rng = np.random.default_rng(68)
BLOBS = [(rng.uniform(140, 1000), rng.uniform(220, 880), rng.uniform(26, 110), rng.uniform(.3, 1.), rng.uniform(0, 180)) for _ in range(46)]
TINTS = [GREEN, BLUE, YELLOW, CORAL, VIOLET]


def blob_points(x, y, major, ratio, angle, n=30):
    t = np.linspace(0, 2 * np.pi, n)
    px, py = major * np.cos(t), major * ratio * np.sin(t)
    c, s = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    return [(x + a * c - b * s, y + a * s + b * c) for a, b in zip(px, py)]


@V.chapter('A scene made of Gaussians', '''
    Gaussian splatting describes a scene with hundreds of thousands of 3D Gaussians. Each has a centre, a shape, an opacity and a colour.
    {proj}To render, every Gaussian is projected to the image, and the splats are blended from front to back.
    {diff}Every step is differentiable, so all the parameters are fitted to photographs by gradient descent. {fast}Unlike NeRF, no network is queried along each ray, so rendering runs in real time.
''')
def scene(s):
    for i, (x, y, major, ratio, angle) in enumerate(BLOBS):
        s.poly(blob_points(x, y, major, ratio, angle), TINTS[i % 5], 0.1, at=s.t(.1) + i * .05, closed=True, fill=TINTS[i % 5], o=.34)
    s.text('centre', 1120, 300, 40, YELLOW, at=s.t(1))
    s.text('shape', 1120, 370, 40, YELLOW, at=s.t(1.6))
    s.text('opacity', 1120, 440, 40, YELLOW, at=s.t(2.2))
    s.text('colour', 1120, 510, 40, YELLOW, at=s.t(2.8))
    s.text('project, sort, blend', 1120, 650, 42, GREEN, at=s.cue('proj'))
    s.text('differentiable', 1120, 730, 42, GREEN, at=s.cue('diff'))
    s.text('real time: no network per ray', 1120, 810, 42, CORAL, at=s.cue('fast'))


@V.chapter('A shape that stays valid', '''
    A gradient step on the raw covariance could produce a matrix that isn't a covariance at all. So splatting stores a rotation and three scales instead.
    {eq}Sigma is R S S transpose R transpose, which is valid by construction. {spin}Spin the rotation, and the same long Gaussian turns.
    {ninety}At ninety degrees, its long axis points along y.
''')
def shape(s):
    centre, unit = (520, 570), 800
    screen = lambda p: (centre[0] + p[0] * unit, centre[1] - p[1] * unit)
    s.line(*screen((-.42, 0)), *screen((.42, 0)), LINE, 3, s.t(.1))
    s.line(*screen((0, -.42)), *screen((0, .42)), LINE, 3, s.t(.1))
    times = [(s.start, 0.)] + ramp(s.cue('spin'), 2.6, 0, 45, ease_io, 20) + ramp(s.cue('ninety'), 1.2, 45, 90, ease_io, 12)
    outline = ellipse((0, 0), covariance(0)[:2, :2], 1, 44)
    spin = lambda p, deg: turn(deg)[:2, :2] @ p
    for a, b in zip(outline, outline[1:]):
        item = s.line(0, 0, 0, 0, GREEN, 6, s.t(.2))
        ends = [(t, screen(spin(a, d)), screen(spin(b, d))) for t, d in times]
        item.update(x=[[t, p[0]] for t, p, _ in ends], y=[[t, p[1]] for t, p, _ in ends], x2=[[t, q[0]] for t, _, q in ends], y2=[[t, q[1]] for t, _, q in ends])
    s.eq(r'\Sigma=RSS^TR^T', 1040, 310, 60, GREEN, at=s.cue('eq'))
    s.eq(r'v^T\Sigma v=\|S^TR^Tv\|^2\ge0', 1040, 420, 46, at=s.cue('eq', 1.4))
    s.eq(rf'0^\circ:\ \operatorname{{diag}}(0.09,\ 0.01)', 1040, 580, 44, MUTED, at=s.t(.4))
    s.eq(rf'45^\circ:\ \Sigma_{{xy}}={c45[0, 1]:g}', 1040, 670, 44, YELLOW, at=s.cue('spin', 1.8))
    s.eq(rf'90^\circ:\ \operatorname{{diag}}(0.01,\ 0.09)', 1040, 760, 44, GREEN, at=s.cue('ninety', .8))


def jacobian(x, y, z, f=100.):
    return np.array([[f / z, 0, -f * x / z ** 2], [0, f / z, -f * y / z ** 2]])


SIGMA = np.diag([.01, .01, .04])
project = lambda x, y, z: jacobian(x, y, z) @ SIGMA @ jacobian(x, y, z).T
CENTRE, OFF_AXIS, FAR = project(0, 0, 2), project(.4, 0, 2), project(0, 0, 4)
assert np.allclose(CENTRE, np.diag([25, 25])) and np.allclose(OFF_AXIS, np.diag([29, 25])) and np.allclose(FAR, np.diag([6.25, 6.25]))


@V.chapter('From 3D Gaussian to 2D splat', '''
    The pinhole camera isn't linear, so splatting linearises it at the centre of each Gaussian, with the Jacobian.
    {eq}A linear map sends covariance Sigma to J Sigma J transpose, the rule the Kalman filter uses. {a}On the axis, at depth two, this gives a round splat of five pixels.
    {b}Off the axis, the depth extent is seen at an angle, and the splat widens sideways. {c}Twice as far, and it's half the size.
''')
def splat(s):
    s.eq(r'J=\begin{bmatrix}f_x/z&0&-f_xx/z^2\\0&f_y/z&-f_yy/z^2\end{bmatrix}', 150, 300, 46, at=s.t(.3))
    s.eq(r"\Sigma'=J\,W\Sigma W^T\!J^T", 980, 300, 58, GREEN, at=s.cue('eq'))
    shown = [('at (0, 0, 2)', CENTRE, 'a', BLUE, 420), ('at (0.4, 0, 2)', OFF_AXIS, 'b', YELLOW, 960), ('at (0, 0, 4)', FAR, 'c', GREEN, 1500)]
    for label, cov, cue, color, x in shown:
        scale = 11
        s.poly([(x + a * scale, 620 - b * scale) for a, b in ellipse((0, 0), cov)], color, 6, at=s.cue(cue), draw=.7, closed=False)
        s.text(label, x, 830, 38, color, anchor='middle', at=s.cue(cue))
        s.eq(rf"\Sigma'=\operatorname{{diag}}({cov[0, 0]:g},\ {cov[1, 1]:g})", x, 900, 38, INK, 'middle', at=s.cue(cue, .3))


FRONT, BACK = np.array([1, 0, 0.]), np.array([0, 0, 1.])
RIGHT = .5 * FRONT + .5 * .8 * BACK
WRONG = .8 * BACK + .2 * .5 * FRONT
assert np.allclose(RIGHT, (.5, 0, .4)) and np.allclose(WRONG, (.1, 0, .8))


@V.chapter('Pause and predict', '''
    Red has opacity zero point five, and blue has zero point eight. Now blend them in the wrong order, with blue in front. {ask}Does the pixel change? Does the light that gets through change? Pause and decide.
''', hold=1.5)
def question(s):
    s.rect(620, 300, 300, 300, '#e5484d', r=14, at=s.t(.3), o=.8)
    s.rect(1000, 300, 300, 300, '#3b6fe0', r=14, at=s.t(.6), o=.8)
    s.eq(r'\alpha=0.5', 770, 680, 46, CORAL, 'middle', at=s.t(.3))
    s.eq(r'\alpha=0.8', 1150, 680, 46, BLUE, 'middle', at=s.t(.6))
    s.eq(r'C(p)=\sum_ic_i\,\alpha_i\prod_{j<i}(1-\alpha_j)', 960, 860, 44, YELLOW, 'middle', at=s.cue('ask'))


@V.chapter('Order changes the colour', '''
    The colour changes, but the light left over does not. Red in front gives a mix of red and blue. {wrong}In the wrong order, it's mostly blue.
    {left}Yet one tenth of the light gets through either way: the product doesn't care about order, but the colour does.
    {sort}So real renderers sort splats by depth, tile by tile. {train}And during training, Gaussians are cloned, split or pruned, so the detail goes where the scene needs it.
''', hold=.6)
def order(s):
    to_hex = lambda c: '#%02x%02x%02x' % tuple(int(v * 255) for v in c)
    for i, (label, colour, at) in enumerate((('red in front', RIGHT, s.t(.2)), ('blue in front', WRONG, s.cue('wrong')))):
        x = 200 + i * 560
        s.rect(x, 240, 420, 300, to_hex(colour), r=14, at=at)
        s.text(label, x + 210, 600, 40, anchor='middle', at=at)
        s.text(f'({colour[0]:g}, {colour[1]:g}, {colour[2]:g})', x + 210, 660, 38, MUTED, anchor='middle', at=at)
    s.eq(r'(1-0.5)(1-0.8)=0.1', 1320, 340, 42, GREEN, at=s.cue('left'))
    s.text('either way', 1320, 420, 38, GREEN, at=s.cue('left', .4))
    for i, (word, cue) in enumerate((('sort by depth, per tile', 'sort'), ('clone, split, prune', 'train'))):
        s.text(word, 200 + i * 760, 830, 46, YELLOW, 700, at=s.cue(cue))
