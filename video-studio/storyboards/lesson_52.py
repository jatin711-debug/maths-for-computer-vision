"""Lesson 52: surviving wrong measurements, then polishing the fit."""
import math
import numpy as np
from studio import *

V = Video('ransac-robust-fitting', 52, 'Fitting when some data is wrong', 'ROBUST FITTING', 'IMAGE GEOMETRY')

GOOD = [(0, 0), (1, 1), (2, 2), (3, 3)]
BAD = (4, 0)
A = np.array(GOOD + [BAD], float)
SLOPE, CUT = np.polyfit(A[:, 0], A[:, 1], 1)
assert np.allclose((SLOPE, CUT), (.2, .8))


@V.chapter('One bad point drags the line', '''
    Four points sit exactly on the line y equals x. {bad}Add one mismatched point.
    {fit}Least squares swings the slope from one down to zero point two.
    {why}The pull of a point grows with how wrong it is, so a single gross error can outweigh all the good ones.
    {vision}And in vision this is normal: a matcher pairs corners that merely look alike.
''')
def dragged(s):
    p = s.plot(180, 200, 820, 700, (-.5, 4.6), (-.8, 3.6), xlabel='x', ylabel='y')
    for x, y in GOOD: p.dot(x, y, 14, GREEN)
    p.dot(*BAD, 15, CORAL, at=s.cue('bad'))
    ends = lambda m, c: (p.pt(-.4, -.4 * m + c), p.pt(4.5, 4.5 * m + c))
    (a, b), (c, d) = ends(1, 0), ends(SLOPE, CUT)
    line = s.line(*a, *b, YELLOW, 5)
    s.to(line, s.cue('fit'), 1.1, ease_out, y=c[1], y2=d[1])
    s.eq(rf'm=1\ \to\ m={SLOPE:g}', 1120, 340, 62, YELLOW, at=s.cue('fit'))
    s.eq(r'\frac{d}{dr}\,r^2=2r', 1120, 540, 62, at=s.cue('why'))
    s.text('pull grows with the error', 1120, 620, 40, CORAL, at=s.cue('why', .6))
    s.text('Bad matches are the normal case.', 1120, 800, 40, MUTED, at=s.cue('vision'))


VALUES = np.array([1, 2, 3, 4, 40.])
huber = lambda r, d=1: np.clip(r, -d, d)
assert VALUES.mean() == 10 and huber(VALUES - 3).sum() == 0


@V.chapter('Cap the pull', '''
    A robust loss caps that pull. {plot}The Huber loss is quadratic near zero and linear beyond a threshold, so its influence stops growing.
    {data}Fit one constant to one, two, three, four and forty. {mean}The mean says ten.
    {h}Huber says three, because forty now pulls exactly as hard as four.
''')
def capped(s):
    p = s.plot(150, 260, 660, 560, (-4, 4), (-4, 4), xlabel='residual', ylabel='influence')
    us = np.linspace(-4, 4, 41)
    p.curve(us, us, CORAL, 4, at=s.t(.1), draw=.9)
    p.curve(us, huber(us), GREEN, 6, at=s.cue('plot'), draw=1.2)
    s.text('squared', p.pt(2.3, 3.4)[0], p.pt(2.3, 3.4)[1], 34, CORAL, anchor='end')
    s.text('Huber', p.pt(3.8, 1)[0], p.pt(3.8, 1)[1] - 18, 34, GREEN, anchor='end', at=s.cue('plot'))
    x, y, scale = 960, 560, 19.5
    s.line(x, y, x + 41 * scale, y, MUTED, 3, s.cue('data'))
    for v in VALUES: s.circle(x + v * scale, y, 12, INK, at=s.cue('data'))
    s.text('1 to 4', x + 2.5 * scale, y + 62, 32, MUTED, anchor='middle', at=s.cue('data'))
    s.text('40', x + 40 * scale, y + 62, 32, MUTED, anchor='middle', at=s.cue('data'))
    s.line(x + 10 * scale, y - 80, x + 10 * scale, y + 16, CORAL, 5, s.cue('mean'), draw=.3)
    s.text('mean 10', x + 10 * scale + 14, y - 58, 38, CORAL, at=s.cue('mean'))
    s.line(x + 3 * scale, y - 150, x + 3 * scale, y + 16, GREEN, 5, s.cue('h'), draw=.3)
    s.text('Huber 3', x + 3 * scale + 14, y - 128, 38, GREEN, at=s.cue('h'))
    s.text('Influences: −1, −1, 0, 1, 1. They sum to zero.', 960, 760, 34, GREEN, at=s.cue('h', 1))


rng = np.random.default_rng(52)
TRUE_M, TRUE_C = .62, .9
xs = rng.uniform(0, 10, 34)
ys = TRUE_M * xs + TRUE_C + rng.normal(0, .16, 34)
ox, oy = rng.uniform(0, 10, 22), rng.uniform(0, 7.5, 22)
far = np.abs(oy - (TRUE_M * ox + TRUE_C)) > .9
CLOUD = np.vstack([np.c_[xs, ys], np.c_[ox[far], oy[far]]])
TAU = .4
TRIES = []
best = 0
for _ in range(6):
    i, j = rng.choice(len(CLOUD), 2, replace=False)
    (x1, y1), (x2, y2) = CLOUD[i], CLOUD[j]
    if abs(x2 - x1) < .5: continue
    m = (y2 - y1) / (x2 - x1)
    c = y1 - m * x1
    votes = np.abs(CLOUD[:, 1] - (m * CLOUD[:, 0] + c)) <= TAU
    TRIES.append((i, j, m, c, votes))
winner = max(range(len(TRIES)), key=lambda k: TRIES[k][4].sum())


@V.chapter('RANSAC counts votes', '''
    RANSAC does not fit everything at once. {a}It draws just enough points to fix the model: two, for a line.
    {b}It fits them exactly, {c}then counts how many other points fall within a small threshold. Those are the votes.
    {d}Then it tries again, and again, and keeps the line with the most votes.
    {e}At the end it refits by least squares on the inliers alone.
''')
def ransac(s):
    p = s.plot(150, 180, 1040, 760, (0, 10.2), (0, 8))
    for x, y in CLOUD: p.dot(x, y, 8, MUTED)
    first, rest = s.cue('a'), s.cue('d')
    step = (s.cue('e') - rest - .2) / max(1, len(TRIES) - 1)
    order = [(first, s.cue('d'), TRIES[0])] + [(rest + k * step, rest + (k + 1) * step, t) for k, t in enumerate(TRIES[1:])]
    most = 0
    for n, (at, until, (i, j, m, c, votes)) in enumerate(order):
        lit = at + (s.cue('c') - first if n == 0 else .15)
        a, b = p.pt(0, c), p.pt(10.2, m * 10.2 + c)
        hold = until
        s.line(*a, *b, YELLOW, 4, at + (s.cue('b') - first if n == 0 else .05), hold)
        p.dot(*CLOUD[i], 14, YELLOW, at=at, until=hold)
        p.dot(*CLOUD[j], 14, YELLOW, at=at, until=hold)
        for x, y in CLOUD[votes]: p.dot(x, y, 8, GREEN, at=lit, until=hold)
        most = max(most, int(votes.sum()))
        s.text(f'{int(votes.sum())} votes', 1260, 340, 62, GREEN, 700, at=lit, until=hold, rise=0)
        s.text(f'try {n + 1}', 1260, 260, 40, MUTED, at=at, until=hold, rise=0)
        s.text(f'best so far: {most}', 1260, 430, 40, YELLOW, at=lit, until=hold, rise=0)
    _, _, m, c, votes = TRIES[winner]
    refit_m, refit_c = np.polyfit(*CLOUD[votes].T, 1)
    a, b = p.pt(0, refit_c), p.pt(10.2, refit_m * 10.2 + refit_c)
    s.line(*a, *b, GREEN, 6, s.cue('e'), draw=.6)
    for x, y in CLOUD[votes]: p.dot(x, y, 8, GREEN, at=s.cue('e'))
    s.text('refit on inliers', 1260, 340, 48, GREEN, 700, at=s.cue('e'))
    s.eq(rf'y={refit_m:.2f}x+{refit_c:.2f}', 1260, 430, 46, at=s.cue('e', .4))


def samples(outliers, s, p=.99):
    return math.ceil(math.log(1 - p) / math.log(1 - (1 - outliers) ** s))


assert (samples(.4, 2), samples(.5, 4), samples(.5, 8)) == (11, 72, 1177)


@V.chapter('Pause and predict', '''
    So how many tries are enough? {q}Suppose forty percent of the points are outliers and each sample takes two.
    {ask}Roughly how many samples give ninety-nine percent confidence of one clean sample? Pause and estimate it.
''', hold=1.5)
def how_many(s):
    s.eq(r'\varepsilon=0.4,\quad s=2,\quad p=0.99', 960, 340, 64, anchor='middle', at=s.t(.2))
    s.eq(r'N=\ ?', 960, 560, 96, YELLOW, anchor='middle', at=s.cue('ask'))


@V.chapter('The count explodes with sample size', '''
    A sample is clean with probability zero point six squared, which is zero point three six.
    {n}Solve for N, and eleven tries are enough. {four}A four-point homography at fifty percent outliers needs seventy-two.
    {eight}An eight-point model needs one thousand one hundred and seventy-seven. That's why we use minimal models.
''')
def explodes(s):
    s.eq(r'N=\left\lceil\frac{\log(1-p)}{\log\!\big(1-(1-\varepsilon)^s\big)}\right\rceil', 150, 300, 56)
    s.eq(rf'(0.6)^2={.6 ** 2:g}', 150, 480, 56, at=s.t(.3))
    s.eq(rf'N={samples(.4, 2)}', 150, 620, 80, GREEN, at=s.cue('n'))
    p = s.plot(980, 220, 760, 660, (0, 3), (0, math.log10(2000)))
    for i, (value, label, cue, color) in enumerate(((samples(.4, 2), '2 points', 'n', GREEN), (samples(.5, 4), '4 points', 'four', YELLOW), (samples(.5, 8), '8 points', 'eight', CORAL))):
        height = 660 * math.log10(value) / math.log10(2000)
        x = 1030 + i * 240
        s.rect(x, 880 - height, 170, height, color, r=6, at=s.cue(cue))['h'] = ramp(s.cue(cue), .6, .5, height)
        s.text(f'{value}', x + 85, 860 - height, 44, color, 700, 'middle', at=s.cue(cue, .4))
        s.text(label, x + 85, 926, 32, MUTED, anchor='middle', at=s.cue(cue))


def energy(t):
    return .5 * ((t ** 2 - 4) ** 2 + (t - 2) ** 2)


def gauss_newton(t, damping=0.):
    r = np.array([t ** 2 - 4, t - 2])
    J = np.array([2 * t, 1.])
    return t - (J @ r) / (J @ J + damping)


path = [1.]
for _ in range(3): path.append(gauss_newton(path[-1]))
assert abs(path[1] - 2.4) < 1e-9 and abs(path[2] - 2.0319) < 1e-3
damped = gauss_newton(1., 5)
assert abs(damped - 1.7) < 1e-9 and abs(energy(damped) - .661) < 1e-3


@V.chapter('Gauss-Newton polishes the fit', '''
    Vision models are often nonlinear, so after RANSAC we refine them. {lin}Gauss-Newton linearises the residuals and solves a small least-squares problem at each step.
    {a}Start at theta equals one. {b}One step lands at two point four. {c}The next lands near two, {d}and then it is almost exact.
''')
def refine(s):
    p = s.plot(150, 210, 880, 700, (.8, 2.7), (0, 6.4))
    s.eq(r'E(\theta)', 150, 190, 34, MUTED)
    s.eq(r'\theta', 1030, 950, 34, MUTED, 'end')
    ts = np.linspace(.9, 2.6, 70)
    p.curve(ts, energy(ts), GREEN, 5, at=s.t(.1), draw=1.)
    s.eq(r'J^TJ\,\delta=-J^Tr', 1130, 330, 60, at=s.cue('lin'))
    s.eq(r'r=(\theta^2-4,\ \theta-2)', 1130, 450, 44, MUTED, at=s.cue('lin', .8))
    cues = ['a', 'b', 'c', 'd']
    dot = s.circle(*p.pt(path[0], energy(path[0])), 14, YELLOW, at=s.cue('a'))
    for i in range(1, 4):
        x, y = p.pt(path[i], energy(path[i]))
        s.to(dot, s.cue(cues[i]), .8, ease_io, x=x, y=y)
    for i, cue in enumerate(cues):
        s.eq(rf'\theta={path[i]:.4g}', 1130, 610 + i * 66, 44, YELLOW if i < 3 else GREEN, at=s.cue(cue))


@V.chapter('Levenberg-Marquardt damps the step', '''
    Far from the solution, a full step can overshoot. {eq}Levenberg-Marquardt adds lambda to the diagonal.
    {l}With lambda equal to five, the first step shrinks to zero point seven, and the error is zero point six six, better than one point six three.
    {rule}If a step helps, accept it and shrink lambda. If not, reject it and grow lambda.
    {pipe}So the pipeline is: match features, run RANSAC for the inliers, then refine.
''')
def damp(s):
    s.eq(r'(J^TJ+\lambda I)\,\delta=-J^Tr', 150, 290, 62, GREEN)
    s.eq(r'\text{from }\theta=1', 150, 410, 40, MUTED, at=s.cue('l'))
    s.eq(rf'\lambda=0:\ \theta={path[1]:g},\ E={energy(path[1]):.3f}', 150, 490, 50, CORAL, at=s.cue('l', .3))
    s.eq(rf'\lambda=5:\ \theta={damped:g},\ E={energy(damped):.3f}', 150, 570, 50, GREEN, at=s.cue('l', 1.2))
    s.eq(r'\text{helped: accept, }\lambda\div 10', 1100, 490, 44, GREEN, at=s.cue('rule'))
    s.eq(r'\text{did not: reject, }\lambda\times 10', 1100, 570, 44, CORAL, at=s.cue('rule', 1.4))
    steps = ['match features', 'RANSAC', 'Levenberg-Marquardt']
    widths = [420, 300, 560]
    x = 150
    for i, (label, width) in enumerate(zip(steps, widths)):
        at = s.cue('pipe') + i * 1.1
        s.rect(x, 730, width, 120, PANEL, GREEN, 3, r=14, at=at)
        s.text(label, x + width / 2, 804, 42, anchor='middle', at=at)
        if i < 2: s.arrow(x + width + 14, 790, x + width + 76, 790, MUTED, 4, at=at + .5, draw=.3)
        x += width + 90
