"""Lesson 66: hidden variables, EM, the ELBO and the VAE."""
import math
import numpy as np
from studio import *

V = Video('variational-autoencoder', 66, 'From EM to the variational autoencoder', 'LATENT VARIABLES', 'GENERATIVE MODELS AND SPLATTING')


def normal(x, mean, variance=1.):
    return np.exp(-(x - mean) ** 2 / (2 * variance)) / math.sqrt(2 * math.pi * variance)


def resp(x, means=(0, 4.)):
    weights = np.array([normal(x, m) for m in means])
    return weights / weights.sum(0)


assert np.allclose(resp(1.), (.982, .018), atol=1e-3) and np.allclose(resp(2.), (.5, .5))
LOGP = math.log(.5 * normal(1, 0) + .5 * normal(1, 4))
assert abs(LOGP + 2.094) < 1e-3


@V.chapter('A hidden variable explains the data', '''
    A latent variable is never observed, but helps explain what is. A Gaussian mixture is the simplest case: first choose a component, then draw a value from it.
    {r}Given a point, Bayes says how likely each component is to have produced it. That's its responsibility.
    {one}At x equals one, it almost certainly came from the first. {two}Halfway between them, at x equals two, it's fifty-fifty.
''')
def mixture(s):
    p = s.plot(150, 220, 1000, 620, (-3.5, 7.5), (0, .46), at=s.t(.1), xlabel='x')
    xs = np.linspace(-3.5, 7.5, 140)
    p.curve(xs, .5 * normal(xs, 0), BLUE, 5, at=s.t(.2), draw=.9)
    p.curve(xs, .5 * normal(xs, 4), GREEN, 5, at=s.t(.7), draw=.9)
    s.eq(r'r_k(x)=\frac{\pi_k\,\mathcal N(x;\mu_k,\Sigma_k)}{\sum_j\pi_j\,\mathcal N(x;\mu_j,\Sigma_j)}', 1200, 320, 38, at=s.cue('r'))
    marker = s.line(*p.pt(1, 0), *p.pt(1, .44), YELLOW, 4, s.cue('one'))
    a, b = resp(1.), resp(2.)
    bar_x, bar_y, full = 1210, 500, 520
    first = s.rect(bar_x, bar_y, a[0] * full, 66, BLUE, r=6, at=s.cue('one'))
    second = s.rect(bar_x + a[0] * full + 3, bar_y, max(a[1] * full, 6), 66, GREEN, r=6, at=s.cue('one'))
    s.text(f'{a[0]:.3f}, {a[1]:.3f}', bar_x, bar_y + 118, 40, YELLOW, at=s.cue('one'), until=s.cue('two'))
    t = s.cue('two')
    px, _ = p.pt(2, 0)
    s.to(marker, t, 1., ease_io, x=px, x2=px)
    s.to(first, t, 1., ease_io, w=b[0] * full)
    s.to(second, t, 1., ease_io, x=bar_x + b[0] * full + 3, w=b[1] * full)
    s.text('0.5, 0.5', bar_x, bar_y + 118, 40, YELLOW, at=t + .6)


pts = np.array([0, 1, 3, 4.])
R1 = np.array([1, .8, .2, 0.])
N1 = R1.sum()
MU = (R1 * pts).sum() / N1
VAR = (R1 * (pts - MU) ** 2).sum() / N1
assert N1 == 2 and abs(MU - .7) < 1e-9 and abs(VAR - .81) < 1e-9


@V.chapter('EM alternates two easy steps', '''
    The log sits outside a sum, so maximising directly is awkward. EM alternates two easy steps instead.
    {e}The E step computes responsibilities with the current parameters. {m}The M step refits each component, weighting each point by its responsibility.
    {num}With these four points and weights, the first component gets mean zero point seven. {hard}Force the weights to zero or one, and this is k-means.
''')
def em(s):
    rng = np.random.default_rng(66)
    data = np.r_[rng.normal(0, 1, 26), rng.normal(4, 1, 26)]
    means = [np.array([1.6, 2.4])]
    for _ in range(5):
        weights = resp(data, means[-1])
        means.append((weights * data).sum(1) / weights.sum(1))
    assert abs(means[-1][0]) < .5 and abs(means[-1][1] - 4) < .5
    p = s.plot(150, 300, 1000, 420, (-3.5, 7.5), (0, .46), at=s.t(.1))
    y = p.pt(0, 0)[1] - 12
    for x in data: s.circle(p.pt(x, 0)[0], y, 8, MUTED, at=s.t(.2))
    colors = (BLUE, GREEN)
    start, stop = s.cue('e'), s.cue('num')
    gap = (stop - start) / 6
    xs = np.linspace(-3.5, 7.5, 70)
    for step in range(6):
        a, b = start + step * gap, start + (step + 1) * gap
        for k in (0, 1):
            s.poly([p.pt(x, .5 * normal(x, means[step][k])) for x in xs], colors[k], 5, at=a, until=b + .2 if step < 5 else None)
    s.eq(r'r_{nk}', 1230, 340, 50, BLUE, at=s.cue('e'))
    s.text('E step: who owns each point', 1340, 330, 34, BLUE, at=s.cue('e'))
    s.eq(r'\mu_k=\frac1{N_k}\sum_nr_{nk}x_n', 1230, 490, 44, GREEN, at=s.cue('m'))
    s.eq(rf'\mu_1=\frac{{0+0.8+0.6+0}}{{{N1:g}}}={MU:g}', 1230, 650, 42, YELLOW, at=s.cue('num'))
    s.text('hard weights: k-means', 1230, 790, 40, CORAL, at=s.cue('hard'))


@V.chapter('Pause and predict', '''
    Why does this work? Because the logarithm curves downwards. {q}Y is one or four, with equal odds.
    {ask}Which is larger: the log of the average, or the average of the log? Pause and decide.
''', hold=1.5)
def question(s):
    p = s.plot(150, 220, 800, 640, (0, 5), (-.5, 2), at=s.t(.1))
    xs = np.linspace(.62, 5, 70)
    p.curve(xs, np.log(xs), GREEN, 6, at=s.t(.2), draw=.9)
    s.eq(r'\ln', 860, 280, 44, GREEN, at=s.t(.4))
    p.dot(1, 0, 13, BLUE, at=s.cue('q'))
    p.dot(4, math.log(4), 13, BLUE, at=s.cue('q'))
    s.eq(r'\ln\mathbb E[Y]\quad ?\quad\mathbb E[\ln Y]', 1050, 500, 50, YELLOW, at=s.cue('ask'))


assert abs(math.log(2.5) - .916) < 1e-3 and abs(.5 * math.log(4) - .693) < 1e-3
KL = lambda m, sd: .5 * (m ** 2 + sd ** 2 - 1 - math.log(sd ** 2))
assert abs(KL(1, .5) - .818) < 1e-3 and abs(KL(0, 1)) < 1e-12


@V.chapter('A lower bound on the evidence', '''
    The log of the average is larger: zero point nine two against zero point six nine. That's Jensen's inequality.
    {bound}Apply it to any distribution over z, and you get the evidence lower bound, the ELBO. {gap}The gap is exactly a KL divergence.
    {split}Split it, and it reads as a reconstruction score, minus a penalty for straying from the prior.
''')
def elbo(s):
    p = s.plot(150, 220, 720, 640, (0, 5), (-.5, 2), at=s.t(.1))
    xs = np.linspace(.62, 5, 70)
    p.curve(xs, np.log(xs), GREEN, 6, at=s.t(.1), draw=.01)
    (x1, y1), (x2, y2) = p.pt(1, 0), p.pt(4, math.log(4))
    s.line(x1, y1, x2, y2, BLUE, 4, s.t(.2), draw=.7)
    p.dot(2.5, math.log(2.5), 14, GREEN, at=s.t(.6))
    p.dot(2.5, .5 * math.log(4), 14, BLUE, at=s.t(.9))
    s.text('0.916', p.pt(2.5, 1.05)[0] + 22, p.pt(2.5, 1.05)[1], 36, GREEN, at=s.t(.6))
    s.text('0.693', p.pt(2.5, .5)[0] + 22, p.pt(2.5, .5)[1] + 8, 36, BLUE, at=s.t(.9))
    s.eq(r'\ln p(x)\ \ge\ \sum_zq(z)\ln\frac{p(x,z)}{q(z)}=\mathcal L(q)', 960, 310, 40, at=s.cue('bound'))
    s.eq(r'\ln p(x)=\mathcal L(q)+\mathrm{KL}\big(q(z)\,\|\,p(z|x)\big)', 960, 470, 40, YELLOW, at=s.cue('gap'))
    s.eq(rf'\mathcal L(q)=\textcolor{{{GREEN}}}{{\mathbb E_q[\ln p(x|z)]}}-\textcolor{{{CORAL}}}{{\mathrm{{KL}}(q\,\|\,p(z))}}', 960, 640, 42, at=s.cue('split'))
    s.text('reconstruction', 1040, 730, 36, GREEN, at=s.cue('split', .6))
    s.text('stay near the prior', 1400, 730, 36, CORAL, at=s.cue('split', 1.2))


MEAN, SD, EPS = 1., .5, -.4
Z = MEAN + SD * EPS
GRAD = 2 * (Z - 2)
assert abs(Z - .8) < 1e-9 and abs(GRAD + 2.4) < 1e-9


@V.chapter('The reparameterisation trick', '''
    A variational autoencoder trains an encoder to output a mean and a width, and a decoder to rebuild the input.
    {block}But a random sample blocks the gradient. {trick}So move the randomness into an input: z is the mean, plus the width times a fixed noise.
    {flow}Now backpropagation passes straight through. {num}Here, z is zero point eight, and the gradient reaches both mu and sigma.
    {kl}And the penalty has a closed form: zero when the code matches the prior.
''', hold=.6)
def vae(s):
    y = 500
    boxes = [(150, 'x', MUTED), (390, 'encoder', BLUE), (1100, 'decoder', GREEN), (1400, r'\hat x', MUTED)]
    s.path(f'M390 {y - 150}L620 {y - 70}V{y + 70}L390 {y + 150}Z', fill=BLUE, at=s.t(.3), o=.75)
    s.text('encoder', 505, y + 12, 36, BG, 700, 'middle', at=s.t(.3))
    s.path(f'M1100 {y - 70}L1330 {y - 150}V{y + 150}L1100 {y + 70}Z', fill=GREEN, at=s.t(.6), o=.75)
    s.text('decoder', 1215, y + 12, 36, BG, 700, 'middle', at=s.t(.6))
    s.eq('x', 300, y + 14, 54, at=s.t(.2))
    s.eq(r'\hat x', 1400, y + 14, 54, at=s.t(.7))
    s.eq(r'\mu', 680, y - 60, 50, YELLOW, at=s.t(.4))
    s.eq(r'\sigma', 680, y + 80, 50, YELLOW, at=s.t(.4))
    s.rect(780, y - 70, 240, 140, PANEL, CORAL, 4, r=12, at=s.t(.5))
    s.text('sample z', 900, y - 8, 38, CORAL, anchor='middle', at=s.t(.5), until=s.cue('trick'))
    s.line(740, y - 110, 1040, y + 110, CORAL, 6, s.cue('block'), s.cue('trick'))
    s.eq(r'z=\mu+\sigma\varepsilon', 900, y + 14, 42, GREEN, 'middle', at=s.cue('trick'))
    s.eq(r'\varepsilon\sim\mathcal N(0,1)', 900, y + 150, 36, MUTED, 'middle', at=s.cue('trick', .5))
    s.arrow(1100, y - 170, 720, y - 170, YELLOW, 5, 18, at=s.cue('flow'), draw=.9)
    s.text('gradient', 910, y - 190, 34, YELLOW, anchor='middle', at=s.cue('flow'))
    s.eq(rf'z={Z:g},\quad \frac{{\partial L}}{{\partial\mu}}={GRAD:g},\quad \frac{{\partial L}}{{\partial\sigma}}={GRAD * EPS:g}', 150, 830, 42, GREEN, at=s.cue('num'))
    s.eq(r'\mathrm{KL}=\tfrac12\big(\mu^2+\sigma^2-1-\ln\sigma^2\big)', 960, 830, 42, CORAL, at=s.cue('kl'))
