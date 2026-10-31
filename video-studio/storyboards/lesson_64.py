"""Lesson 64: rendering a pixel through a field of density, and why NeRF needs Fourier features."""
import math
import numpy as np
from skimage import data
from studio import *

V = Video('volume-rendering', 64, 'Volume rendering and neural radiance fields', 'VOLUME RENDERING', 'TWO VIEWS AND RENDERING')

assert abs(math.exp(-1) - .368) < 1e-3
OPTICAL = np.array([0, math.log(2), math.log(4)])
ALPHA = 1 - np.exp(-OPTICAL)
T = np.r_[1, np.cumprod(1 - ALPHA)]
W = T[:3] * ALPHA
COLOURS = np.array([(.5, .5, .5), (1, 0, 0), (0, 0, 1.)])
PIXEL = (W[:, None] * COLOURS).sum(0) + T[3] * np.ones(3)
assert np.allclose(ALPHA, (0, .5, .75)) and np.allclose(T, (1, 1, .5, .125)) and np.allclose(W, (0, .5, .375))
assert np.allclose(PIXEL, (.625, .125, .5))
assert abs((1 * 0 + 2 * .5 + 3 * .375) / W.sum() - 2.43) < .01


@V.chapter('A pixel looks along a ray', '''
    Every pixel looks along a ray through the scene. A neural radiance field describes that scene with two functions of position.
    {density}A density: how much light is absorbed per unit length. Fog is thin, and a wall is dense.
    {colour}And a colour, the light sent out in that direction. {none}Nothing about surfaces is assumed. A pixel is computed by looking through the field.
''')
def ray(s):
    camera = np.array([180., 570])
    s.path(f'M{camera[0]} {camera[1]}L{camera[0] + 150} {camera[1] - 110}V{camera[1] + 110}Z', fill=OFF, stroke=MUTED, sw=3, at=s.t(.1))
    s.line(*camera, 1780, 570, YELLOW, 3, s.t(.3), draw=1.1)
    rng = np.random.default_rng(64)
    for i in range(70):
        x, y = rng.uniform(760, 1240), rng.uniform(340, 800)
        s.circle(x, y, rng.uniform(14, 34), BLUE, at=s.cue('density') + i * .012, o=.13)
    s.rect(1370, 300, 80, 540, CORAL, r=6, at=s.cue('density', 1.4))
    s.text('fog', 1000, 300, 38, BLUE, anchor='middle', at=s.cue('density', .4))
    s.text('wall', 1410, 280, 38, CORAL, anchor='middle', at=s.cue('density', 1.4))
    s.eq(r'\sigma(x)', 760, 910, 52, BLUE, at=s.cue('density'))
    s.eq(r'c(x,d)', 1060, 910, 52, CORAL, at=s.cue('colour'))
    s.eq(r'r(s)=o+s\,d', 200, 910, 46, YELLOW, at=s.t(.6))


@V.chapter('Light that survives', '''
    Light from far away reaches the camera only if nothing in front absorbs it. The fraction that survives is the transmittance.
    {t}It falls exponentially with the density it has passed through. {num}A slab of density zero point five and thickness two lets through thirty-seven percent.
    {eq}The pixel adds up, along the ray, what survives times what is emitted, plus whatever background gets through.
''')
def transmittance(s):
    p = s.plot(150, 240, 860, 620, (0, 6), (0, 1.1), at=s.t(.1), xlabel='distance s', ylabel='T(s)')
    xs = np.linspace(0, 6, 80)
    density = np.where((xs > 2) & (xs < 4), .5, 0.)
    survive = np.exp(-np.cumsum(density) * (xs[1] - xs[0]))
    s.rect(p.pt(2, 1.1)[0], p.y, p.pt(4, 0)[0] - p.pt(2, 0)[0], p.h, BLUE, at=s.t(.4), o=.16)
    s.text('density 0.5', p.pt(3, 1)[0], p.pt(3, 1.03)[1], 32, BLUE, anchor='middle', at=s.t(.4))
    p.curve(xs, survive, GREEN, 6, at=s.cue('t'), draw=1.4)
    p.dot(6, math.exp(-1), 13, YELLOW, at=s.cue('num'))
    s.text('0.368', p.pt(5.8, .368)[0], p.pt(5.8, .368)[1] - 26, 38, YELLOW, anchor='end', at=s.cue('num'))
    s.eq(r'T(s)=\exp\!\Big(-\!\int_0^s\sigma\,du\Big)', 1090, 340, 50, GREEN, at=s.cue('t'))
    s.eq(r'C=\int T\,\sigma\,c\,ds+T(s_f)\,c_{\text{bg}}', 1090, 540, 50, at=s.cue('eq'))


@V.chapter('Pause and predict', '''
    Discretise the ray into intervals. Here is a clear sample, then a half-opaque red, then a three-quarter opaque blue, in front of a white background.
    {ask}How much of the pixel comes from red? How much from blue? Pause and work out the shares.
''', hold=1.5)
def predict(s):
    xs = [420, 800, 1180]
    for x, alpha, color, name in zip(xs, ALPHA, (LINE, CORAL, BLUE), ('clear', 'red', 'blue')):
        s.rect(x, 300, 240, 330, PANEL, color, 4, r=12, at=s.t(.2))
        s.text(name, x + 120, 400, 46, INK, 700, 'middle', at=s.t(.2))
        s.eq(rf'\alpha={alpha:g}', x + 120, 520, 46, YELLOW, 'middle', at=s.t(.6))
    s.rect(1540, 300, 150, 330, '#f1f5f9', r=12, at=s.t(.8))
    s.arrow(330, 465, 410, 465, YELLOW, 4, at=s.t(.3))
    s.eq(r'w_i=T_i\,\alpha_i=\ ?', 960, 800, 62, YELLOW, 'middle', at=s.cue('ask'))


@V.chapter('Compositing the weights', '''
    Blue only receives what red lets through. Red takes one half. {b}Blue takes a half of three quarters, which is zero point three seven five.
    {w}White gets the remaining eighth. {px}The pixel is a weighted average: a purple.
    {train}The same sums give the gradients. A sample hidden behind something opaque has weight near zero, so it receives almost no gradient.
''')
def compositing(s):
    x0, y0, total = 150, 330, 1000
    shares = [(W[1], '#e5484d', 'red', '0.5', s.t(.2)), (W[2], '#3b6fe0', 'blue', '0.375', s.cue('b')), (T[3], '#f1f5f9', 'white', '0.125', s.cue('w'))]
    x = x0
    for share, color, name, label, at in shares:
        width = share * total
        s.rect(x, y0, width, 170, color, r=4, at=at, grow='w')
        s.text(label, x + width / 2, y0 + 234, 42, INK, anchor='middle', at=at)
        s.text(name, x + width / 2, y0 + 290, 34, MUTED, anchor='middle', at=at)
        x += width
    s.eq(r'\alpha_i=1-e^{-\sigma_i\delta_i}', 1260, 300, 44, at=s.t(.3))
    s.eq(r'T_i=\prod_{j<i}(1-\alpha_j)', 1260, 420, 44, at=s.t(.6))
    colour = tuple(int(v * 255) for v in PIXEL)
    s.rect(1320, 560, 300, 200, '#%02x%02x%02x' % colour, r=14, at=s.cue('px'))
    s.text(f'({PIXEL[0]:g}, {PIXEL[1]:g}, {PIXEL[2]:g})', 1470, 810, 36, INK, anchor='middle', at=s.cue('px'))
    s.text('Hidden samples get almost no gradient.', 150, 830, 42, CORAL, at=s.cue('train'))


def encode(p, levels):
    return np.concatenate([[np.sin(2 ** k * np.pi * p), np.cos(2 ** k * np.pi * p)] for k in range(levels)], 0)


got = encode(np.array([.25]), 3).ravel()
assert np.allclose(got, (.7071, .7071, 1, 0, 0, -1), atol=1e-3)
PSNR = lambda mse: -10 * math.log10(mse)
assert abs(PSNR(.001) - 30) < 1e-9


SIGNAL = data.camera()[300, ::2] / 255.
CACHE = BUILD / 'cache' / 'lesson-64-fits.npz'


def fit(levels, steps=3000):
    """Trains the lesson's small network on every second pixel of one image row."""
    import torch
    torch.manual_seed(64)
    position = torch.linspace(0, 1, len(SIGNAL))[:, None]
    target = torch.tensor(SIGNAL, dtype=torch.float32)[:, None]
    def features(p):
        if not levels: return p
        return torch.cat([f(2 ** k * math.pi * p) for k in range(levels) for f in (torch.sin, torch.cos)], 1)
    x = features(position)
    net = torch.nn.Sequential(torch.nn.Linear(x.shape[1], 128), torch.nn.ReLU(), torch.nn.Linear(128, 128), torch.nn.ReLU(), torch.nn.Linear(128, 1))
    optimiser = torch.optim.Adam(net.parameters(), lr=1e-3)
    for _ in range(steps):
        optimiser.zero_grad()
        ((net(x[::2]) - target[::2]) ** 2).mean().backward()
        optimiser.step()
    with torch.no_grad():
        out = net(x)
        held_out = ((out[1::2] - target[1::2]) ** 2).mean().item()
    return out.numpy().ravel(), PSNR(held_out)


if not CACHE.exists():
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    fits = {L: fit(L) for L in (0, 5, 8)}
    np.savez(CACHE, **{f'curve{L}': c for L, (c, _) in fits.items()}, psnr=np.array([fits[L][1] for L in (0, 5, 8)]))
FITS = np.load(CACHE)
RAW_DB, FOURIER_DB, TOO_MANY_DB = FITS['psnr']


@V.chapter('Why NeRF needs Fourier features', '''
    Fed raw coordinates, a network learns smooth functions first, and fine detail extremely slowly. Here's a small network fitting one row of a photo. It's blurry.
    {f}The fix is to feed each coordinate through sines and cosines at doubling frequencies.
    {near}Nearby positions then differ a lot in the fast features, {fit}and the same network can suddenly follow the edges.
    {too}But push the frequencies too far, and on pixels it never saw, it does worse. That's aliasing again.
''', hold=.6)
def fourier(s):
    n = len(SIGNAL)
    screen = lambda i, v: (150 + i / n * 1000, 470 - v * 280)
    s.poly([screen(i, v) for i, v in enumerate(SIGNAL)], MUTED, 2, at=s.t(.1), draw=.7)
    s.poly([screen(i, v) for i, v in enumerate(FITS['curve0'])], CORAL, 5, at=s.t(.8), draw=1., until=s.cue('fit'))
    s.poly([screen(i, v) for i, v in enumerate(FITS['curve5'])], GREEN, 4, at=s.cue('fit'), draw=1.)
    s.text('one row of a photo', 150, 180, 34, MUTED, at=s.t(.1))
    x = 1210
    s.text('held-out PSNR', x, 230, 34, MUTED, at=s.t(.9))
    s.text(f'raw: {RAW_DB:.1f} dB', x, 300, 44, CORAL, 700, at=s.t(.9))
    s.text(f'L = 5: {FOURIER_DB:.1f} dB', x, 370, 44, GREEN, 700, at=s.cue('fit'))
    s.text(f'L = 8: {TOO_MANY_DB:.1f} dB', x, 440, 44, YELLOW, 700, at=s.cue('too'))
    xs = np.linspace(0, 1, 240)
    colors = [BLUE, GREEN, YELLOW, CORAL]
    for k in range(4):
        y0 = 555 + k * 112
        wave = np.sin(2 ** k * np.pi * xs)
        at = s.cue('f') + k * .4
        s.poly([(150 + u * 1000, y0 - v * 40) for u, v in zip(xs, wave)], colors[k], 4, at=at, draw=.8)
        s.eq(rf'\sin(2^{{{k}}}\pi p)', 1190, y0 + 12, 38, colors[k], at=at)
    for u in (.46, .5):
        s.line(150 + u * 1000, 510, 150 + u * 1000, 930, INK, 3, s.cue('near'), dash='6 8')
    s.text('nearby in p, far apart in the fast feature', 650, 975, 32, CORAL, anchor='middle', at=s.cue('near', .6))
