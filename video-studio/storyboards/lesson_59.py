"""Lesson 59: optical flow. Each pixel is one line in (u, v) space."""
import math
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage import data
from studio import *
from studio.core import bmat

V = Video('optical-flow', 59, 'Optical flow: one equation per pixel', 'OPTICAL FLOW', 'FEATURES AND TRACKING')

PHOTO = data.chelsea()[20:276, 100:356] / 255.


@V.chapter('Brightness constancy', '''
    Optical flow asks how far the content at each pixel moved between two frames. The basic assumption: a point keeps its brightness as it moves.
    {ramp}Take a pixel on a ramp, where brightness rises by one per pixel to the right. {move}If the content slides two pixels right, this pixel now shows what was two to its left, which is two darker.
    {eq}Expand to first order, and you get one linear equation per pixel.
''')
def constancy(s):
    p = s.plot(150, 240, 880, 560, (0, 8), (0, 8), at=s.t(.1), xlabel='x', ylabel='brightness')
    xs = np.array([0, 8.])
    line = lambda shift: (p.pt(0, 0 - shift + 2), p.pt(8, 8 - shift + 2))
    grey = s.line(*p.pt(0, 2), *p.pt(6, 8), MUTED, 4, s.t(.2))
    moving = s.line(*p.pt(0, 2), *p.pt(6, 8), GREEN, 6, s.cue('ramp'))
    t = s.cue('move')
    (ax, ay), (bx, by) = p.pt(2, 2), p.pt(8, 8)
    s.to(moving, t, 2., ease_io, x=ax, y=ay, x2=bx, y2=by)
    fixed = 4
    x0, y0 = p.pt(fixed, 6)
    s.line(x0, p.y, x0, p.y + p.h, YELLOW, 3, s.cue('ramp'), dash='8 8')
    dot = s.circle(x0, y0, 14, YELLOW, at=s.cue('ramp'))
    s.to(dot, t, 2., ease_io, y=p.pt(fixed, 4)[1])
    s.eq(r'I(x+u,\ y+v,\ t+1)=I(x,y,t)', 1090, 330, 42, at=s.t(.2))
    s.eq(r'I_t=-2', 1090, 500, 54, YELLOW, at=s.cue('move', 1.8))
    s.eq(r'I_xu+I_yv+I_t\approx0', 1090, 640, 54, GREEN, at=s.cue('eq'))
    s.eq(r'1\cdot2+0\cdot v-2=0', 1090, 750, 46, MUTED, at=s.cue('eq', 1.2))


CENTRE, UNIT = (560, 610), 95
to = lambda u, v: (CENTRE[0] + u * UNIT, CENTRE[1] - v * UNIT)


def flow_axes(s):
    s.line(*to(-4, 0), *to(5.3, 0), LINE, 3, s.t(.1))
    s.line(*to(0, -3.2), *to(0, 4.5), LINE, 3, s.t(.1))
    s.eq('u', to(5.3, 0)[0] + 12, to(5.3, 0)[1] + 12, 40, MUTED, at=s.t(.1))
    s.eq('v', to(0, 4.5)[0] + 16, to(0, 4.5)[1] + 16, 40, MUTED, at=s.t(.1))


def eq_line(s, a, b, c, color, at, draw=.8, sw=5):
    """Draws a u + b v = c across the axes."""
    if abs(b) < 1e-9:
        return s.line(*to(c / a, -3.2), *to(c / a, 4.5), color, sw, at, draw=draw)
    ends = [(u, (c - a * u) / b) for u in (-2.9, 5.3)]
    return s.line(*to(*ends[0]), *to(*ends[1]), color, sw, at, draw=draw)


GRAD, TEMPORAL = np.array([3, 4.]), -10.
NORMAL = -TEMPORAL * GRAD / (GRAD @ GRAD)
assert np.allclose(NORMAL, (1.2, 1.6))


@V.chapter('The aperture problem', '''
    One equation, two unknowns. {line}In the plane of u and v, one pixel only says the answer lies on this line.
    {n}We can pin down one piece: the normal flow, along the gradient. {other}But two, one and minus two, four fit equally well.
    {bar}Through a small hole, a bar looks the same whether or not it slides along itself. This is the aperture problem.
''')
def aperture(s):
    flow_axes(s)
    eq_line(s, *GRAD, -TEMPORAL, YELLOW, s.cue('line'))
    s.eq(r'3u+4v=10', 960, 200, 44, YELLOW, at=s.cue('line'))
    s.arrow(*to(0, 0), *to(*NORMAL), GREEN, 6, 20, at=s.cue('n'), draw=.5)
    s.text('(1.2, 1.6)', to(*NORMAL)[0] - 22, to(*NORMAL)[1] - 22, 34, GREEN, anchor='end', at=s.cue('n', .4))
    for u, v in ((2, 1), (-2, 4)):
        s.circle(*to(u, v), 13, CORAL, at=s.cue('other'))
        s.text(f'({u}, {v})'.replace('-', '−'), to(u, v)[0] + 22, to(u, v)[1] - 16, 34, CORAL, at=s.cue('other'))
    cx, cy, r = 1480, 650, 200
    t0 = s.cue('bar')
    bar = s.rect(cx - 250, cy - 44, 500, 88, BLUE, at=t0, o=1.)
    s.to(bar, t0, 1.6, ease_io, x=cx - 120)
    s.to(bar, t0 + 1.6, 1.6, ease_io, x=cx - 380)
    s.path(f'M{cx - 400} {cy - 300}H{cx + 400}V{cy + 300}H{cx - 400}ZM{cx - r} {cy}A{r} {r} 0 1 0 {cx + r} {cy}A{r} {r} 0 1 0 {cx - r} {cy}Z', fill=BG, at=t0, fade=.2)
    s.circle(cx, cy, r, 'none', MUTED, 4, at=t0)


PIXELS = np.array([(1, 0, -2), (1, 0, -2), (0, 1, -1), (0, 1, -1.)])
M = PIXELS[:, :2].T @ PIXELS[:, :2]
RHS = -(PIXELS[:, :2].T @ PIXELS[:, 2])
FLOW = np.linalg.solve(M, RHS)
assert np.allclose(FLOW, (2, 1)) and np.allclose(M, 2 * np.eye(2))


@V.chapter('Lucas-Kanade: use a whole window', '''
    Lucas and Kanade assume that the flow is the same across a small window. Now every pixel adds its own line.
    {a}Two pixels see a gradient to the right. {b}Two see one downwards. {x}The lines cross at one point: two, one.
    {m}The least squares solve is a two by two system, and its matrix is the structure tensor from corners.
''')
def window(s):
    flow_axes(s)
    eq_line(s, 1, 0, 2, BLUE, s.cue('a'))
    eq_line(s, 0, 1, 1, GREEN, s.cue('b'))
    s.circle(*to(*FLOW), 16, YELLOW, at=s.cue('x'))
    s.text('(2, 1)', to(*FLOW)[0] + 26, to(*FLOW)[1] - 22, 40, YELLOW, at=s.cue('x'))
    x0, y0, cell = 1130, 200, 112
    for i, (gx, gy, _) in enumerate(PIXELS):
        x, y = x0 + (i % 2) * cell, y0 + (i // 2) * cell
        s.rect(x, y, cell - 8, cell - 8, PANEL, LINE, r=8, at=s.t(.3))
        s.arrow(x + 52 - gx * 34, y + 52 - gy * 34, x + 52 + gx * 34, y + 52 + gy * 34, BLUE if gx else GREEN, 5, 16, at=s.cue('a' if gx else 'b'), draw=.3)
    s.eq(r'u=2', 1400, 270, 46, BLUE, at=s.cue('a'))
    s.eq(r'v=1', 1400, 360, 46, GREEN, at=s.cue('b'))
    s.eq(r'M\begin{bmatrix}u\\v\end{bmatrix}=-\begin{bmatrix}\sum I_xI_t\\\sum I_yI_t\end{bmatrix}', 1130, 590, 46, at=s.cue('m'))
    s.eq(rf'M={bmat(M)}', 1130, 790, 54, YELLOW, at=s.cue('m', 2))


@V.chapter('Pause and predict', '''
    Now suppose all four pixels have the same gradient, pointing right. {ask}What happens to the solve? Pause and think about M.
''', hold=1.5)
def question(s):
    flow_axes(s)
    s.eq(r'(I_x,I_y,I_t)=(1,\ 0,\ -2)', 1130, 330, 46, at=s.t(.3))
    s.text('for all four pixels', 1130, 400, 36, MUTED, at=s.t(.5))
    s.eq(r'M=\ ?', 1130, 590, 80, YELLOW, at=s.cue('ask'))


SAME = np.array([(1, 0, -2)] * 4, float)
MS = SAME[:, :2].T @ SAME[:, :2]
assert np.linalg.matrix_rank(MS) == 1


@V.chapter('A rank-deficient window', '''
    M becomes four, zero, zero, zero, which is singular. All four lines are the same line, so nothing fixes v.
    {r}The aperture problem is a rank-deficient structure tensor. {k}That's why a KLT tracker follows corners, where the smaller eigenvalue is large and the flow is well determined.
''')
def singular(s):
    flow_axes(s)
    eq_line(s, 1, 0, 2, BLUE, s.t(.2), sw=7)
    s.eq(rf'M={bmat(MS)}', 1130, 350, 62, CORAL, at=s.t(.2))
    s.text('v is free', to(2, 3.4)[0] + 26, to(2, 3.4)[1], 38, BLUE, at=s.t(1))
    s.text('rank-deficient', 1130, 520, 44, CORAL, at=s.cue('r'))
    s.wrap('Track corners: a large smallest eigenvalue pins down the flow.', 1130, 680, 660, 42, GREEN, at=s.cue('k'))


def down(image):
    return gaussian_filter(image, (1, 1, 0))[::2, ::2]


LEVELS = [PHOTO]
for _ in range(3): LEVELS.append(down(LEVELS[-1]))
assert 8 / 2 ** 3 == 1 and 13 / 2 ** 4 < 1


@V.chapter('Coarse to fine', '''
    The linear step only holds for motions of about a pixel. Each pass is really a Gauss-Newton step, so we can iterate, but an eight pixel jump is too far.
    {pyr}A pyramid fixes that. Halving the image halves every displacement, so eight pixels are one pixel, three levels up.
    {down}Estimate there, double it, warp the next level, and solve for the small correction. {end}Repeat down to full resolution.
''', hold=.6)
def coarse(s):
    x, base = 150, 800
    moves = [8, 4, 2, 1]
    for i, level in enumerate(LEVELS):
        size = 400 / 2 ** i
        at = s.t(.2) if i == 0 else s.cue('pyr') + i * .5
        s.image(level, x, base - size, size, size, at, pixelated=True)
        s.text(f'{moves[i]} px', x + size / 2, base + 50, 38, YELLOW, 700, 'middle', at=at)
        s.arrow(x + size / 2 - moves[i] * 6, base - size - 26, x + size / 2 + moves[i] * 6, base - size - 26, YELLOW, 5, 15, at=at + .2, draw=.3)
        x += size + 70
    s.eq(r'd_\ell=\frac{d}{2^\ell}', 1240, 300, 62, at=s.cue('pyr'))
    steps = ['estimate at the top', 'double the flow', 'warp the next level', 'solve the correction']
    for i, step in enumerate(steps):
        at = s.cue('down') + i * .75
        s.text(f'{i + 1}.  {step}', 1240, 470 + i * 72, 38, GREEN if i < 3 else YELLOW, at=at)
