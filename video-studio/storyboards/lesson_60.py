"""Lesson 60: the Kalman filter is a linear map followed by conditioning."""
import math
import numpy as np
from studio import *
from studio.core import bmat, ellipse, ramp

V = Video('kalman-tracking', 60, 'Kalman filtering and data association', 'TRACKING', 'FEATURES AND TRACKING')

F = np.array([[1, 1], [0, 1.]])
P0 = np.eye(2)
PRED = F @ P0 @ F.T + 0
H = np.array([[1, 0.]])
R = np.array([[1.]])
STATE = np.array([0, 1.])
MEAN = F @ STATE
S = (H @ PRED @ H.T + R).item()
GAIN = (PRED @ H.T / S).ravel()
Z = 2.
INNOVATION = Z - (H @ MEAN).item()
AFTER = MEAN + GAIN * INNOVATION
POST = (np.eye(2) - GAIN[:, None] @ H) @ PRED
assert np.allclose(PRED, [[2, 1], [1, 1]]) and S == 3
assert np.allclose(AFTER, (5 / 3, 4 / 3)) and np.allclose(POST, np.array([[2, 1], [1, 2]]) / 3)
fractions = {2 / 3: r'\tfrac23', 1 / 3: r'\tfrac13'}


@V.chapter('A tracker keeps a mean and a doubt', '''
    A tracker never knows exactly where an object is. It keeps a mean and a covariance, and the covariance is an ellipse of doubt.
    {rule}Gaussians are the natural language here, because a linear map keeps them Gaussian. {m}The mean follows the map, and the covariance is sandwiched.
    {step}Take position and velocity, and one time step. {shear}A round doubt shears into a tilted ellipse: position is less certain, and it is now tied to velocity.
''')
def linear(s):
    centre, unit = (560, 590), 165
    screen = lambda p: (centre[0] + p[0] * unit, centre[1] - p[1] * unit)
    s.line(*screen((-2.6, 0)), *screen((2.6, 0)), LINE, 3, s.t(.1))
    s.line(*screen((0, -2)), *screen((0, 2)), LINE, 3, s.t(.1))
    s.text('position', screen((2.6, 0))[0], screen((2.6, 0))[1] + 46, 34, MUTED, anchor='end', at=s.t(.1))
    s.text('velocity', screen((0, 2))[0] + 16, screen((0, 2))[1] + 14, 34, MUTED, at=s.t(.1))
    circle = ellipse((0, 0), P0, 1, 48)
    t0 = s.cue('shear')
    moves = [(s.start, 0.)] + [(t0 + 1.6 * i / 14, ease_io(i / 14)) for i in range(15)]
    for a, b in zip(circle, circle[1:]):
        item = s.line(0, 0, 0, 0, GREEN, 5, s.t(.2))
        shear = lambda p, u: (np.eye(2) + u * (F - np.eye(2))) @ p
        ends = [(t, screen(shear(a, u)), screen(shear(b, u))) for t, u in moves]
        item.update(x=[[t, p[0]] for t, p, _ in ends], y=[[t, p[1]] for t, p, _ in ends], x2=[[t, q[0]] for t, _, q in ends], y2=[[t, q[1]] for t, _, q in ends])
    s.eq(r'Ax+b\sim\mathcal N\big(A\mu+b,\ A\Sigma A^T\big)', 1040, 320, 44, at=s.cue('rule'))
    s.eq(rf'F={bmat(F)}', 1040, 520, 48, at=s.cue('step'))
    s.eq(rf'F\Sigma F^T={bmat(PRED)}', 1340, 520, 48, YELLOW, at=s.cue('shear'))


SIGMA = np.array([[4, 2], [2, 2.]])
OBSERVED = 1.
cond_mean = SIGMA[0, 1] / SIGMA[1, 1] * OBSERVED
cond_var = SIGMA[0, 0] - SIGMA[0, 1] ** 2 / SIGMA[1, 1]
assert cond_mean == 1 and cond_var == 2


def bell(mean, variance, xs):
    return np.exp(-(xs - mean) ** 2 / (2 * variance)) / math.sqrt(2 * math.pi * variance)


@V.chapter('Conditioning slices the ellipse', '''
    The second rule is conditioning. Two quantities a and b share a joint Gaussian. {see}Now observe b equals one.
    {slice}That slices the ellipse, and what's left of a is a narrower Gaussian. {num}The mean moves to one, and the variance falls from four to two.
    {note}The drop depends only on how strongly a and b vary together, not on the value you saw.
''')
def conditioning(s):
    centre, unit = (480, 590), 88
    screen = lambda p: (centre[0] + p[0] * unit, centre[1] - p[1] * unit)
    s.line(*screen((-4, 0)), *screen((4, 0)), LINE, 3, s.t(.1))
    s.line(*screen((0, -3.4)), *screen((0, 3.6)), LINE, 3, s.t(.1))
    s.eq('a', screen((4, 0))[0] + 12, screen((4, 0))[1] + 14, 42, MUTED, at=s.t(.1))
    s.eq('b', screen((0, 3.6))[0] + 18, screen((0, 3.6))[1] + 18, 42, MUTED, at=s.t(.1))
    for scale, color in ((1, GREEN), (2, LINE)):
        s.poly([screen(p) for p in ellipse((0, 0), SIGMA, scale)], color, 4, at=s.t(.2), draw=.8)
    s.line(*screen((-4, OBSERVED)), *screen((4, OBSERVED)), YELLOW, 4, s.cue('see'), draw=.5)
    s.text('b = 1', screen((4, OBSERVED))[0] - 8, screen((4, OBSERVED))[1] - 16, 34, YELLOW, anchor='end', at=s.cue('see'))
    p = s.plot(980, 300, 760, 420, (-5.5, 7.5), (0, .32), at=s.cue('slice'))
    xs = np.linspace(-5.5, 7.5, 120)
    p.curve(xs, bell(0, SIGMA[0, 0], xs), MUTED, 4, at=s.cue('slice'), draw=.8)
    p.curve(xs, bell(cond_mean, cond_var, xs), YELLOW, 6, at=s.cue('slice', .6), draw=.9)
    s.eq(r'\sigma^2=4', 1000, 290, 44, MUTED, at=s.cue('slice'))
    s.eq(rf'\mu={cond_mean:g},\ \sigma^2={cond_var:g}', 1380, 290, 44, YELLOW, at=s.cue('num'))
    s.eq(r'\Sigma_{aa}-\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}', 1000, 870, 48, at=s.cue('note'))


@V.chapter('Predict, measure, update', '''
    A Kalman filter is exactly these two rules. {pred}Predict with the first: at position one, with variance two.
    {meas}A measurement arrives at two, with variance one. {up}Condition on it. The new position is five thirds, with variance two thirds.
    {v}Now the surprise: velocity rose from one to four thirds, though it was never measured. The tilt in the covariance linked it to position.
''')
def update(s):
    p = s.plot(150, 240, 930, 640, (-2.5, 5.5), (0, .56), at=s.t(.1), xlabel='position')
    xs = np.linspace(-2.5, 5.5, 130)
    prior = PRED[0, 0]
    p.curve(xs, bell(MEAN[0], prior, xs), BLUE, 5, at=s.cue('pred'), draw=.8)
    p.curve(xs, bell(Z, R.item(), xs), YELLOW, 5, at=s.cue('meas'), draw=.8)
    p.curve(xs, bell(AFTER[0], POST[0, 0], xs), GREEN, 7, at=s.cue('up'), draw=.9)
    s.eq(r'K=P^-H^TS^{-1}', 1180, 280, 46, at=s.t(.2))
    s.eq(rf'x^-=({MEAN[0]:g},\ {MEAN[1]:g})', 1180, 400, 46, BLUE, at=s.cue('pred'))
    s.eq(rf'z={Z:g},\quad S={S:g}', 1180, 490, 46, YELLOW, at=s.cue('meas'))
    s.eq(r'x=\left(\tfrac53,\ \tfrac43\right)', 1180, 610, 56, GREEN, at=s.cue('up'))
    s.eq(r'v:\ 1\ \to\ \tfrac43', 1180, 760, 56, CORAL, at=s.cue('v'))
    s.text('never measured', 1180, 830, 36, CORAL, at=s.cue('v', .3))


@V.chapter('Pause and predict', '''
    If the model is right, the squared innovation over S is small. {g}The usual gate for one measurement is three point eight four.
    {ask}Now a measurement arrives at six. Is it accepted? Pause and work it out.
''', hold=1.5)
def question(s):
    s.eq(r'd^2=\frac{y^2}{S}', 960, 330, 76, anchor='middle', at=s.t(.2))
    s.eq(r'd^2<3.84', 960, 500, 56, GREEN, 'middle', at=s.cue('g'))
    s.eq(rf'x^-=1,\quad S={S:g},\quad z=6', 960, 680, 56, YELLOW, 'middle', at=s.cue('ask'))


COST = np.array([[.1, .2], [.3, .9]])
greedy = COST[0, 0] + COST[1, 1]
best = min(COST[0, 0] + COST[1, 1], COST[0, 1] + COST[1, 0])
assert abs(greedy - 1) < 1e-9 and abs(best - .5) < 1e-9
assert abs((6 - 1) ** 2 / S - 25 / 3) < 1e-9
ROWS = COST - COST.min(1, keepdims=True)
BOTH = ROWS - ROWS.min(0, keepdims=True)


@V.chapter('Who is who?', '''
    Rejected: d squared is about eight point three, so that detection belongs to something else.
    With several tracks, we must decide which detection updates which track. {cost}Build a cost matrix. {g}Greedy matching grabs the smallest cost, point one, and is then forced into point nine: one point zero in total.
    {b}The best pairing costs only point five. {h}The Hungarian algorithm finds it in cubic time, by subtracting each row's minimum and each column's minimum until independent zeros appear.
''', hold=.6)
def assignment(s):
    s.eq(rf'd^2=\frac{{5^2}}{{3}}\approx{25 / 3:.2f}>3.84', 150, 270, 46, CORAL, at=s.t(.2), until=s.cue('cost', 3))
    x0, y0, cell = 300, 400, 200
    for j in range(2): s.text(f'detection {j + 1}', x0 + j * cell + cell / 2, y0 - 26, 30, MUTED, anchor='middle', at=s.cue('cost'))
    for i in range(2):
        s.text(f'track {i + 1}', x0 - 22, y0 + i * 120 + 66, 32, MUTED, anchor='end', at=s.cue('cost'))
        for j in range(2):
            s.rect(x0 + j * cell, y0 + i * 120, cell - 10, 110, PANEL, LINE, r=10, at=s.cue('cost'))
            s.text(f'{COST[i, j]:g}', x0 + j * cell + (cell - 10) / 2, y0 + i * 120 + 70, 46, anchor='middle', at=s.cue('cost'), rise=0)
    for i, j, cue in ((0, 0, 'g'), (1, 1, 'g')):
        s.rect(x0 + j * cell, y0 + i * 120, cell - 10, 110, 'none', CORAL, 5, r=10, at=s.cue(cue, .3 + i), until=s.cue('b'))
    for i, j in ((0, 1), (1, 0)):
        s.rect(x0 + j * cell, y0 + i * 120, cell - 10, 110, 'none', GREEN, 5, r=10, at=s.cue('b'))
    s.text(f'greedy: {greedy:.1f}', 300, 720, 40, CORAL, at=s.cue('g', 1.6))
    s.text(f'best: {best:.1f}', 300, 780, 44, GREEN, 700, at=s.cue('b'))
    s.eq(rf'{bmat(COST)}\ \to\ {bmat(ROWS)}\ \to\ {bmat(BOTH)}', 960, 520, 46, YELLOW, at=s.cue('h', 3))
    s.text('row minimums, then column minimums', 960, 640, 34, MUTED, at=s.cue('h', 3.4))
    s.eq(r'O(n^3)\ \text{not}\ n!', 960, 780, 52, GREEN, at=s.cue('h', .4))
