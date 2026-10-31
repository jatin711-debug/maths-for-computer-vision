"""Lesson 54: entropy and KL divergence, and the losses built on them."""
import math
import numpy as np
from studio import *

V = Video('entropy-and-kl', 54, 'Entropy, KL divergence and contrastive learning', 'INFORMATION THEORY', 'CALCULUS AND INFORMATION')


def entropy(p):
    p = np.asarray(p, float)
    return float(-(p[p > 0] * np.log(p[p > 0])).sum())


def kl(p, q):
    p, q = np.asarray(p, float), np.asarray(q, float)
    return float((p[p > 0] * np.log(p[p > 0] / q[p > 0])).sum())


def softmax(z):
    z = np.asarray(z, float)
    return np.exp(z - z.max()) / np.exp(z - z.max()).sum()


P = np.array([.5, .25, .25])
assert abs(entropy(P) / math.log(2) - 1.5) < 1e-9
assert abs(kl((.5, .5), (.8, .2)) - .223) < 1e-3 and abs(kl((.8, .2), (.5, .5)) - .193) < 1e-3
ONE = np.array([1, 0, 0, 0.])
FLAT = np.ones(4) / 4


def bars(s, xs, top, base, values, colors, at=None, until=None):
    """Bars whose heights are given by tracks of (t, values)."""
    for i, x in enumerate(xs):
        height = [[t, max(v[i], .002) * (base - top)] for t, v in values]
        item = s.rect(x, 0, 96, 1, colors[i] if isinstance(colors, list) else colors, r=6, at=at, until=until)
        item['h'], item['y'] = height, [[t, base - h] for t, h in height]


@V.chapter('Entropy is average surprise', '''
    The surprise of an outcome with probability p is minus log p. {p}With probabilities one half, one quarter and one quarter,
    the surprises are one, two and two bits. {h}Entropy is their average: one point five bits.
    {flat}Now change the distribution. A certain outcome has entropy zero, {max}and the uniform one has the most: log K, which is exactly two bits for four classes.
''')
def surprise(s):
    xs = [190, 310, 430]
    values = [(s.start, P)]
    bars(s, xs, 240, 620, values, GREEN, s.t(.2), s.cue('flat'))
    for x, p, bits in zip(xs, P, (1, 2, 2)):
        s.text(f'{p:g}', x + 48, 668, 34, anchor='middle', at=s.t(.2), until=s.cue('flat'))
        s.text(f'{bits} bit{"s" if bits > 1 else ""}', x + 48, 720, 32, YELLOW, anchor='middle', at=s.cue('p'), until=s.cue('flat'))
    s.eq(r'H(p)=-\sum_k p_k\log p_k', 780, 300, 58, at=s.t(.2))
    s.eq(r'\tfrac12\cdot1+\tfrac14\cdot2+\tfrac14\cdot2=1.5\text{ bits}', 780, 440, 50, YELLOW, at=s.cue('h'), until=s.cue('flat'))
    t0, t1 = s.cue('flat'), s.cue('max', 1.5)
    steps = np.linspace(0, 1, 26)
    times = [t0 + (t1 - t0) * u for u in steps]
    mixes = [(t, (1 - u) * ONE + u * FLAT) for t, u in zip(times, steps)]
    bars(s, [190, 310, 430, 550], 240, 620, mixes, BLUE, t0)
    meter_x, meter_y, meter_w = 780, 590, 900
    s.rect(meter_x, meter_y, meter_w, 54, OFF, r=10, at=t0)
    meter = s.rect(meter_x, meter_y, 1, 54, GREEN, r=10, at=t0)
    meter['w'] = [[t, max(.5, entropy(p) / math.log(4) * meter_w)] for t, p in mixes]
    s.text('H', meter_x, meter_y - 22, 34, MUTED, at=t0)
    s.text('0', meter_x, meter_y + 96, 34, MUTED, at=t0)
    s.text('log 4 = 2 bits', meter_x + meter_w, meter_y + 96, 34, YELLOW, anchor='end', at=s.cue('max'))


Q0 = np.array([.1, .1, .8])
FLOOR = entropy(P)


@V.chapter('Cross-entropy is entropy plus KL', '''
    Cross-entropy is the average surprise when outcomes follow p, but you score them with a model q.
    {split}It splits into two parts: the entropy of p, plus the KL divergence. {move}As q moves towards p, KL shrinks to zero,
    {floor}but entropy stays. It is a floor no model can beat. {same}So with a fixed target, minimizing cross-entropy is the same as minimizing KL.
''')
def split(s):
    s.eq(r'H(p,q)=H(p)+\mathrm{KL}(p\,\|\,q)', 960, 260, 62, anchor='middle', at=s.t(.2))
    t0, t1 = s.cue('move'), s.cue('move', 3.2)
    us = np.linspace(0, 1, 30)
    times = [t0 + (t1 - t0) * u for u in us]
    qs = [(1 - u) * Q0 + u * P for u in ease_list(us)]
    xs = [230, 370, 510]
    for x, value in zip(xs, P):
        s.rect(x - 34, 760 - value * 480, 30, value * 480, GREEN, r=4, at=s.t(.3))
    q_track = [(s.start, Q0)] + list(zip(times, qs))
    for i, x in enumerate(xs):
        item = s.rect(x, 0, 30, 1, YELLOW, r=4, at=s.t(.5))
        h = [[t, float(q[i]) * 480] for t, q in q_track]
        item['h'], item['y'] = h, [[t, 760 - v] for t, v in h]
    s.text('p', 210, 830, 40, GREEN, at=s.t(.3))
    s.text('q', 270, 830, 40, YELLOW, at=s.t(.5))
    x0, y0, scale = 720, 520, 420
    s.rect(x0, y0, FLOOR * scale, 100, GREEN, r=8, at=s.cue('split'))
    s.eq('H(p)', x0 + FLOOR * scale / 2, y0 + 64, 40, BG, 'middle', at=s.cue('split'))
    gap = s.rect(x0 + FLOOR * scale + 6, y0, 1, 100, CORAL, r=8, at=s.cue('split'))
    gap['w'] = [[t, max(.5, kl(P, q) * scale)] for t, q in q_track]
    s.eq(r'\mathrm{KL}', x0 + FLOOR * scale + 80, y0 - 22, 42, CORAL, at=s.cue('split'))
    s.text('the floor', x0, y0 + 158, 38, GREEN, at=s.cue('floor'))
    s.wrap('Minimizing cross-entropy minimizes KL.', x0, 780, 900, 42, at=s.cue('same'))


def ease_list(us):
    return [ease_io(float(u)) for u in us]


@V.chapter('Pause and predict', '''
    Is KL a distance? {q}Take p as one half, one half, and q as zero point eight, zero point two.
    {ask}Would KL of p from q equal KL of q from p? Pause and decide.
''', hold=1.5)
def question(s):
    s.eq(r'p=(0.5,\ 0.5)', 960, 300, 60, GREEN, 'middle', at=s.t(.2))
    s.eq(r'q=(0.8,\ 0.2)', 960, 400, 60, YELLOW, 'middle', at=s.cue('q'))
    s.eq(r'\mathrm{KL}(p\,\|\,q)\ \overset{?}{=}\ \mathrm{KL}(q\,\|\,p)', 960, 620, 72, anchor='middle', at=s.cue('ask'))


T4 = softmax(np.array([3, 1, 0.]) / 4)
T1 = softmax((3, 1, 0))
assert np.allclose(T1, (.844, .114, .042), atol=1e-3) and np.allclose(T4, (.481, .292, .227), atol=1e-3)
LABEL = np.array([.925, .025, .025, .025])
assert abs(entropy(LABEL) - .349) < 1e-3 and abs(math.log(.925 / .025) - 3.61) < .01


@V.chapter('Softer targets', '''
    No: they are zero point two two three and zero point one nine three, so direction matters.
    {ls}Softer targets are KL at work too. Label smoothing moves a little mass to the wrong classes, which caps the best gap between logits at log thirty-seven, about three point six.
    {dist}Distillation softens a teacher with a temperature. {t}At T equals four, its logits show how it ranks the wrong classes.
''')
def softer(s):
    s.eq(rf'\mathrm{{KL}}(p\|q)={kl((.5, .5), (.8, .2)):.3f},\quad \mathrm{{KL}}(q\|p)={kl((.8, .2), (.5, .5)):.3f}', 960, 230, 52, YELLOW, 'middle', at=s.t(.2))
    s.eq(r'z_t-z_j=\ln\frac{0.925}{0.025}=\ln37', 150, 390, 46, at=s.cue('ls'))
    s.eq(rf'\approx{math.log(37):.2f}', 150, 500, 50, GREEN, at=s.cue('ls', 3))
    xs = [150, 270, 390, 510]
    bars(s, xs, 560, 900, [(s.start, LABEL)], GREEN, s.cue('ls', .6))
    s.text('0.925', xs[0] + 48, 945, 32, GREEN, anchor='middle', at=s.cue('ls', .6))
    s.text('0.025 each', xs[2] + 48, 945, 32, MUTED, anchor='middle', at=s.cue('ls', .6))
    s.text('label smoothing', 700, 905, 34, MUTED, at=s.cue('ls', .6))
    s.text('teacher, softened', 1030, 370, 36, BLUE, at=s.cue('dist'))
    x2 = [1030, 1180, 1330]
    t0 = s.cue('t')
    us = np.linspace(0, 1, 22)
    track = [(s.start, T1)] + [(t0 + 1.6 * u, softmax(np.array([3, 1, 0.]) / (1 + 3 * ease_io(float(u))))) for u in us]
    bars(s, x2, 420, 860, track, BLUE, s.cue('dist'))
    for x, label in zip(x2, ('cat', 'dog', 'car')): s.text(label, x + 48, 906, 34, MUTED, anchor='middle', at=s.cue('dist'))
    s.text('T = 1', 1610, 500, 40, MUTED, at=s.cue('dist'), until=t0)
    s.text('T = 4', 1610, 500, 44, YELLOW, 700, at=t0)


def info_nce(similar, tau):
    logits = np.asarray(similar, float) / tau
    return float(-logits[0] + np.log(np.exp(logits).sum()))


SIM = (.8, .2, .1, -.3)
assert abs(info_nce(SIM, .1) - .0034) < 1e-4 and abs(info_nce(SIM, 1) - .866) < 1e-3
rng = np.random.default_rng(54)
BATCH = 6
GRID = np.clip(rng.normal(.12, .13, (BATCH, BATCH)), -.3, .5)
np.fill_diagonal(GRID, rng.uniform(.68, .86, BATCH))


@V.chapter('Contrastive learning is classification', '''
    Contrastive learning is classification over a batch. {m}CLIP compares every image with every caption, and the diagonal holds the true pairs.
    {row}Each row asks an image to pick its caption, {col}and each column asks a caption to pick its image.
    {t}The temperature matters because cosines live between minus one and one: this example costs zero point eight seven at tau of one, and almost nothing at zero point one.
    {n}And if the scores carry no information, the loss is log N. That's chance.
''', hold=.5)
def clip(s):
    x0, y0, cell = 170, 230, 105
    for i in range(BATCH):
        for j in range(BATCH):
            value = (GRID[i, j] + .3) / 1.2
            color = '#%02x%02x%02x' % tuple(int(a + (b - a) * value) for a, b in zip((19, 30, 46), (60, 204, 145)))
            s.rect(x0 + j * cell, y0 + i * cell, cell - 6, cell - 6, color, r=8, at=s.t(.1) + (i + j) * .03)
            s.text(f'{GRID[i, j] + 0:.1f}'.replace('-0.0', '0.0').replace('-', '−'), x0 + j * cell + (cell - 6) / 2, y0 + i * cell + 60, 28, INK, anchor='middle', at=s.t(.3), rise=0)
    for i in range(BATCH): s.rect(x0 + i * cell, y0 + i * cell, cell - 6, cell - 6, 'none', YELLOW, 4, r=8, at=s.cue('m', 1) + i * .08)
    s.rect(x0 - 8, y0 + 2 * cell - 8, BATCH * cell + 10, cell + 10, 'none', BLUE, 5, r=10, at=s.cue('row'), until=s.cue('col'))
    s.rect(x0 + 3 * cell - 8, y0 - 8, cell + 10, BATCH * cell + 10, 'none', VIOLET, 5, r=10, at=s.cue('col'), until=s.cue('t'))
    s.eq(r'L=-\ln\frac{\exp(s^+/\tau)}{\sum_j\exp(s_j/\tau)}', 960, 310, 50, at=s.t(.6))
    s.eq(rf'\tau=1:\ L={info_nce(SIM, 1):.3f}', 960, 500, 50, CORAL, at=s.cue('t', 1.5))
    s.eq(rf'\tau=0.1:\ L={info_nce(SIM, .1):.4f}', 960, 590, 50, GREEN, at=s.cue('t', 3))
    s.eq(rf'\text{{chance: }}\ln N=\ln 4={math.log(4):.3f}', 960, 750, 50, YELLOW, at=s.cue('n'))
