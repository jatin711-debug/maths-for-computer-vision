"""Lesson 49: homogeneous coordinates make every 2D move one matrix."""
import math
import numpy as np
from studio import *
from studio.core import apply, matrix_keys

V = Video('homogeneous-coordinates', 49, 'One matrix for every 2D move', 'HOMOGENEOUS COORDINATES', 'IMAGE GEOMETRY')


def rot(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])


def shift(x, y):
    return np.array([[1, 0, x], [0, 1, y], [0, 0, 1.]])


def blend(H, base=None):
    base = np.eye(3) if base is None else base
    return lambda u: base * (1 - u) + np.asarray(H) * u


def plane(cx, cy, unit):
    return lambda p: (cx + p[0] * unit, cy - p[1] * unit)


@V.chapter('A 2 by 2 matrix pins the origin', '''
    A two by two matrix can move a picture in many ways. {r}It can rotate it. {s}It can scale it. {h}It can shear it.
    {o}But watch the origin. It never moves, because A times zero is always zero.
    {t}So sliding an image, the simplest move of all, is not a matrix product.
''')
def pinned(s):
    screen = plane(620, 575, 72)
    spin, stretch = rot(35), np.diag([1.25, 1.25, 1.])
    tilt = np.array([[1, .7, 0], [0, 1, 0], [0, 0, 1.]])
    keys = matrix_keys((s.cue('r'), 1.2, blend(spin)), (s.cue('s'), 1., blend(spin @ stretch, spin)), (s.cue('h'), 1.1, blend(tilt, spin @ stretch)), (s.cue('o', 1.4), 1.2, blend(np.eye(3), tilt)), start=s.start)
    s.grid(keys, screen, -3, 3, color=BLUE, sw=2, o=.55)
    s.moving_line((0, 0), (2, 0), keys, screen, GREEN, 6)
    s.moving_line((0, 0), (0, 2), keys, screen, CORAL, 6)
    s.circle(620, 575, 15, YELLOW, at=s.cue('o'))
    s.eq(r'A\,\mathbf 0=\mathbf 0', 1240, 480, 76, YELLOW, at=s.cue('o', .4))
    s.text('The origin stays put.', 1240, 560, 40, at=s.cue('o', .8))
    s.eq(r'x\mapsto x+t', 1240, 720, 58, CORAL, at=s.cue('t'))
    s.text('not of the form Ax', 1240, 790, 38, CORAL, at=s.cue('t', .4))


@V.chapter('Append a one', '''
    Give every point a third coordinate equal to one. {m}Now translation is a three by three matrix.
    {p}Multiply it out: x plus t x, y plus t y, and the one stays one. {slide}The origin finally moves.
    {all}Every transformation here is now a single matrix, and a sequence of them is a single product.
''')
def append(s):
    screen = plane(400, 640, 72)
    keys = matrix_keys((s.cue('slide'), 1.5, blend(shift(2, 1))), start=s.start)
    s.grid(keys, screen, -3, 3, color=BLUE, sw=2, o=.55)
    s.moving_dot((0, 0), keys, screen, 15)
    s.eq(r'(x,y)\ \to\ (x,y,\textcolor{#fde68a}{1})', 1000, 250, 58)
    s.eq(r'\begin{bmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{bmatrix}\begin{bmatrix}x\\y\\1\end{bmatrix}=\begin{bmatrix}x+t_x\\y+t_y\\1\end{bmatrix}', 1000, 500, 50, at=s.cue('m'))
    s.text('one matrix, one product', 1000, 740, 44, GREEN, at=s.cue('all'))


START = (1, 1)
TURN, SLIDE = rot(90), shift(2, 0)
assert np.allclose(apply(SLIDE @ TURN, START), (1, 1)) and np.allclose(apply(TURN @ SLIDE, START), (-1, 3))
SCREEN = plane(700, 720, 105)


def axes(s):
    s.grid([(s.start, np.eye(3))], SCREEN, -4, 4, color=LINE, sw=1.5, o=.6)
    s.line(*SCREEN((-4, 0)), *SCREEN((4, 0)), MUTED, 2)
    s.line(*SCREEN((0, -1.5)), *SCREEN((0, 4)), MUTED, 2)


@V.chapter('Order still matters', '''
    Take the point one, one. {r}Rotate it ninety degrees and it lands on minus one, one.
    {t}Translate by two, zero, and you end at one, one.
''')
def order(s):
    axes(s)
    keys = matrix_keys((s.cue('r'), 1.3, lambda u: rot(90 * u)), (s.cue('t'), 1.1, lambda u: shift(2 * u, 0) @ TURN), start=s.start)
    s.moving_dot(START, keys, SCREEN, 15, GREEN)
    s.eq(r'T\,R\,\tilde x', 1420, 430, 76, GREEN, at=s.cue('r'))
    s.text('rotate, then translate', 1420, 510, 36, GREEN, at=s.cue('r', .3))


@V.chapter('Pause and predict', '''
    Now swap them. {ask}Translate first, then rotate. Where does the point land? Pause here and work it out.
''', hold=1.5)
def order_question(s):
    axes(s)
    x, y = SCREEN(START)
    s.circle(x, y, 15, YELLOW)
    s.circle(*SCREEN((1, 1)), 24, 'none', GREEN, 3)
    s.eq(r'R\,T\,\tilde x=\ ?', 1420, 430, 76, YELLOW, at=s.cue('ask'))
    s.text('translate, then rotate', 1420, 510, 36, YELLOW, at=s.cue('ask', .3))


@V.chapter('The nearest matrix acts first', '''
    Translating first gives three, one. {r}Rotating that gives minus one, three: a different point.
    {eq}Read the product from the right. The matrix nearest the point acts first.
''')
def order_answer(s):
    axes(s)
    keys = matrix_keys((s.t(.1), 1.1, lambda u: shift(2 * u, 0)), (s.cue('r'), 1.3, lambda u: rot(90 * u) @ SLIDE), start=s.start)
    s.circle(*SCREEN((1, 1)), 24, 'none', GREEN, 3)
    s.moving_dot(START, keys, SCREEN, 15, YELLOW)
    s.text('(−1, 3)', SCREEN((-1, 3))[0] - 26, SCREEN((-1, 3))[1] - 22, 38, YELLOW, anchor='end', at=s.cue('r', 1.2))
    s.text('(1, 1)', SCREEN((1, 1))[0] + 36, SCREEN((1, 1))[1] + 12, 36, GREEN, at=s.start)
    s.eq(r'R\,T\,\tilde x\neq T\,R\,\tilde x', 1320, 430, 62, at=s.cue('eq'))


TILES = [
    ('Translation', 2, 'all but position', shift(.7, .35)),
    ('Rigid', 3, 'lengths, angles', shift(.3, .1) @ rot(32)),
    ('Similarity', 4, 'angles, ratios', shift(.1, .1) @ rot(32) @ np.diag([.68, .68, 1.])),
    ('Affine', 6, 'parallel lines', np.array([[.95, .55, -.2], [.18, .8, 0], [0, 0, 1.]])),
    ('Projective', 8, 'straight lines', np.array([[.92, .15, 0], [.1, .95, 0], [.22, .26, 1.]])),
]


@V.chapter('Each family keeps less', '''
    Restrict the entries of the matrix and you get a family of moves.
    {a}Translation has two numbers, and only position changes. {b}Rigid has three: lengths and angles survive.
    {c}Similarity has four: angles and ratios of lengths. {d}Affine has six: parallel lines stay parallel.
    {e}Projective has eight, and only straight lines stay straight.
''')
def families(s):
    s.eq(r'\begin{bmatrix}A&t\\v^T&1\end{bmatrix}', 960, 230, 54, anchor='middle')
    tile, gap = 312, 28
    for i, (name, count, keeps, H) in enumerate(TILES):
        x = 130 + i * (tile + gap)
        cue = s.cue('abcde'[i])
        s.rect(x, 330, tile, 420, PANEL, LINE, r=12, at=cue - .1)
        centre = plane(x + tile / 2, 500, 72)
        keys = matrix_keys((cue + .3, 1.3, blend(H)), start=cue - .1)
        s.grid(keys, centre, -1, 1, .5, GREEN if i < 4 else YELLOW, 2.5, at=cue)
        s.text(name, x + tile / 2, 700, 38, INK, 700, 'middle', at=cue)
        s.text(f'{count} numbers', x + tile / 2, 810, 36, GREEN, anchor='middle', at=cue)
        s.text(keeps, x + tile / 2, 866, 32, MUTED, anchor='middle', at=cue)


@V.chapter('Divide by the last coordinate', '''
    After a projective map the last coordinate is usually not one, so read the point by dividing.
    {same}Two, four, two and one, two, one are the same point: {ray}every vector on this ray names it.
    {zero}As the ray tips over, its point runs away, and when the last coordinate is zero there is no ordinary point. It names a direction, a point at infinity.
''')
def scale(s):
    x0, y0, unit = 200, 830, 118
    to = lambda y, w: (x0 + y * unit, y0 - w * unit)
    s.line(*to(0, 0), *to(7.8, 0), MUTED, 2)
    s.line(*to(0, 0), *to(0, 5), MUTED, 2)
    s.text('w', to(0, 5)[0] - 18, to(0, 5)[1] + 10, 36, MUTED, anchor='end')
    s.text('y', to(7.8, 0)[0], to(7.8, 0)[1] + 48, 36, MUTED, anchor='middle')
    s.line(*to(0, 1), *to(7.8, 1), GREEN, 3)
    s.text('w = 1', to(7.8, 1)[0], to(7.8, 1)[1] - 16, 34, GREEN, anchor='end')
    angles = [(s.cue('ray'), math.atan2(2, 4))] + ramp(s.cue('zero'), 3.2, math.atan2(2, 4), .012, ease_io, 40)
    ray = s.line(*to(0, 0), 0, 0, YELLOW, 4, s.cue('ray', -.2))
    length = 8
    ray['x2'], ray['y2'] = [[t, to(length * math.cos(a), length * math.sin(a))[0]] for t, a in angles], [[t, to(length * math.cos(a), length * math.sin(a))[1]] for t, a in angles]
    dot = s.circle(0, 0, 14, YELLOW, at=s.cue('ray'), until=s.cue('zero', 2.1))
    hits = [(t, 1 / math.tan(a)) for t, a in angles]
    dot['x'], dot['y'] = [[t, to(min(h, 7.7), 1)[0]] for t, h in hits], to(0, 1)[1]
    s.circle(*to(4, 2), 12, BLUE, at=s.cue('same'), until=s.cue('zero'))
    s.text('(2, 4, 2)', to(4, 2)[0] + 22, to(4, 2)[1] - 16, 38, BLUE, at=s.cue('same'), until=s.cue('zero'))
    s.text('(1, 2, 1)', to(2, 1)[0] + 16, to(2, 1)[1] + 52, 38, YELLOW, at=s.cue('same', .3), until=s.cue('zero'))
    s.eq(r'(u,v,w)\ \to\ \left(\frac uw,\ \frac vw\right)', 1050, 300, 56, at=s.t(.1))
    s.eq(r'w=0:\ \text{a direction}', 1050, 500, 50, CORAL, at=s.cue('zero', 2))


L1, L2 = np.array([0, 1, -1.]), np.array([0, 1, -2.])
MEET = np.cross(L1, L2)
assert np.allclose(MEET, (-1, 0, 0))
TILT = .25
ROAD = lambda u: np.array([[1, 0, 0], [0, 1, 0], [TILT * u, 0, 1.]]) @ np.diag([1 + 7.5 * u, 1, 1.]) @ shift(0, -1.5)


@V.chapter('Parallel lines can meet', '''
    A line is a vector too. {l}The lines y equals one and y equals two have the vectors zero, one, minus one and zero, one, minus two.
    {x}Their cross product is minus one, zero, zero. Its last coordinate is zero: a point at infinity.
    {h}A homography can bring that point into view, {rail}which is why railway tracks meet in a photograph.
''', hold=1.2)
def rails(s):
    screen = lambda p: (150 + p[0] * 140, 590 - p[1] * 330)
    keys = matrix_keys((s.cue('h'), 2.2, ROAD), start=s.start)
    s.moving_line((0, 1), (7.4, 1), keys, screen, YELLOW, 7)
    s.moving_line((0, 2), (7.4, 2), keys, screen, YELLOW, 7)
    for x in np.linspace(.2, 7.2, 13):
        s.moving_line((x, .85), (x, 2.15), keys, screen, MUTED, 7, o=.7)
    s.eq(r'l_1=(0,1,-1)', 1190, 220, 44, at=s.cue('l'))
    s.eq(r'l_2=(0,1,-2)', 1190, 290, 44, at=s.cue('l', 1))
    s.eq(rf'l_1\times l_2=({MEET[0]:g},{MEET[1]:g},{MEET[2]:g})', 1190, 390, 46, CORAL, at=s.cue('x'))
    vanish = ROAD(1) @ np.array([1, 0, 0.])
    target = screen((vanish[0] / vanish[2], vanish[1] / vanish[2]))
    s.circle(*target, 16, CORAL, at=s.cue('rail'))
    s.text('the point at infinity, in view', target[0] + 34, target[1] + 12, 36, CORAL, at=s.cue('rail', .2))
