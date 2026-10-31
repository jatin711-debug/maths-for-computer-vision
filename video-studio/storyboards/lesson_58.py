"""Lesson 58: finding the scale of a structure, describing it and matching it."""
import math
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage import data
from studio import *

V = Video('scale-space-matching', 58, 'Scale space, descriptors and matching', 'SCALE SPACE', 'FEATURES AND TRACKING')


def response(sigma, width):
    """The scale-normalised Laplacian at the centre of a Gaussian blob."""
    return 2 * sigma ** 2 * width ** 2 / (width ** 2 + sigma ** 2) ** 2


assert abs(response(1.5, 3) - .32) < .001 and abs(response(3, 3) - .5) < 1e-9 and abs(response(6, 3) - .32) < .001
assert math.hypot(3, 4) == 5
y, x = np.mgrid[-48:48, -48:48]
blob = lambda width: np.exp(-(x ** 2 + y ** 2) / (2 * width ** 2))
PHOTO = data.chelsea()[20:276, 100:356] / 255.
blurred = lambda sigma: gaussian_filter(PHOTO, (sigma, sigma, 0))


@V.chapter('The same thing at many sizes', '''
    Photograph a doorway from twice as far and every structure is half as wide in pixels. {fix}A detector with one fixed scale sees different things in each photo.
    {all}So look at every scale, and let the image say which scale belongs to each structure.
    {stack}That stack of ever more blurred copies is the scale space. {add}And blurs compose, because variances add: blur by three and then by four, and you've blurred by five.
''')
def space(s):
    s.image(PHOTO, 150, 230, 400, 400, s.t(.1))
    s.image(PHOTO[::2, ::2], 590, 330, 200, 200, s.t(1.5))
    s.text('twice as far', 690, 580, 34, MUTED, anchor='middle', at=s.t(1.5))
    s.rect(290, 330, 90, 90, 'none', YELLOW, 4, at=s.cue('fix'))
    s.rect(650, 380, 90, 90, 'none', CORAL, 4, at=s.cue('fix', .5))
    s.text('same window, different content', 150, 700, 36, CORAL, at=s.cue('fix', .8), until=s.cue('stack'))
    for i, sigma in enumerate((1, 2, 4, 8, 16)):
        at = s.cue('stack') + i * .4
        offset = i * 110
        s.image(blurred(sigma), 930 + offset, 240 + i * 34, 300, 300, at)
    s.eq(r'L(x,y,\sigma)=G_\sigma*I', 930, 720, 52, at=s.cue('stack', 1))
    s.eq(r'G_{3}*G_{4}=G_{\sqrt{3^2+4^2}}=G_{5}', 930, 860, 48, GREEN, at=s.cue('add'))


@V.chapter('The peak marks the size', '''
    To find a blob's size, measure the Laplacian at every scale, multiplied by sigma squared so that scales compare fairly.
    {curve}For a blob of width three, the response rises to one half at sigma three, then falls away again.
    {peak}The peak is the blob's characteristic scale. A keypoint is a point that wins in position and in scale.
''')
def peak(s):
    p = s.plot(760, 220, 980, 660, (0, 13), (0, .58), at=s.t(.1))
    s.eq(r'\sigma', 1760, 925, 40, MUTED, 'end', at=s.t(.1))
    s.eq(r'\left|\sigma^2\nabla^2L\right|', 790, 240, 42, MUTED, at=s.t(.1))
    sigmas = np.linspace(.2, 13, 90)
    p.curve(sigmas, response(sigmas, 3), GREEN, 6, at=s.cue('curve'), draw=2.2)
    s.image(blob(3), 170, 250, 420, 420, s.t(.1), pixelated=True)
    s.eq(r's=3', 380, 730, 46, GREEN, 'middle', at=s.t(.1))
    s.circle(380, 460, 3 * math.sqrt(2) * 420 / 96, 'none', YELLOW, 4, at=s.cue('peak'))
    s.eq(r'r\approx\sqrt2\,\sigma', 380, 830, 44, YELLOW, 'middle', at=s.cue('peak', .4))
    p.dot(3, .5, 13, YELLOW, at=s.cue('peak'))
    s.line(*p.pt(3, 0), *p.pt(3, .5), YELLOW, 3, s.cue('peak'), dash='8 8')
    s.eq(r'\text{peak at }\sigma=s=3', p.pt(3.5, .54)[0], p.pt(3.5, .54)[1], 38, YELLOW, at=s.cue('peak', .4))


@V.chapter('Pause and predict', '''
    Now enlarge the image by two, so the blob has width six. {ask}Where does the peak move? Pause and predict.
''', hold=1.5)
def question(s):
    p = s.plot(760, 220, 980, 660, (0, 13), (0, .58), at=s.t(.1))
    sigmas = np.linspace(.2, 13, 90)
    p.curve(sigmas, response(sigmas, 3), GREEN, 5, at=s.t(.1), draw=.01)
    s.image(blob(6), 170, 250, 420, 420, s.t(.2), pixelated=True)
    s.eq(r's=6', 380, 730, 46, YELLOW, 'middle', at=s.t(.2))
    s.eq(r'\sigma^\ast=\ ?', 1250, 300, 66, YELLOW, 'middle', at=s.cue('ask'))


K = 2 ** (1 / 3)


def dog_centre(sigma, width, k=K):
    return width ** 2 / (width ** 2 + (k * sigma) ** 2) - width ** 2 / (width ** 2 + sigma ** 2)


assert abs(dog_centre(1.5, 3) + .084) < 1e-3


@V.chapter('Detection follows the image', '''
    The peak moves to six. Detection follows the scale of the image, which is the whole point.
    {dog}Second derivatives at every scale are expensive, so SIFT subtracts neighbouring blurs instead.
    {eq}This difference of Gaussians is already scale-normalised: at this blob it gives minus zero point zero eight four, against a prediction of minus zero point zero eight three.
''')
def dog(s):
    p = s.plot(760, 220, 980, 420, (0, 13), (0, .58), at=s.t(.1))
    sigmas = np.linspace(.2, 13, 90)
    p.curve(sigmas, response(sigmas, 3), GREEN, 4, at=s.t(.1), draw=.01)
    p.curve(sigmas, response(sigmas, 6), YELLOW, 6, at=s.t(.2), draw=1.4)
    p.dot(6, .5, 12, YELLOW, at=s.t(1.4))
    a, b = blurred(2), blurred(2 * K)
    side = 210
    s.image(b, 130, 260, side, side, s.cue('dog'))
    s.eq('-', 362, 380, 48, at=s.cue('dog'))
    s.image(a, 400, 260, side, side, s.cue('dog', .3))
    s.image(np.clip(.5 + (b - a).mean(2, keepdims=True).repeat(3, 2) * 7, 0, 1), 265, 520, side, side, s.cue('dog', .7))
    s.text('difference of Gaussians', 370, 790, 32, MUTED, anchor='middle', at=s.cue('dog', .7))
    s.eq(r'D\approx(k-1)\,\sigma^2\nabla^2L', 800, 760, 50, at=s.cue('eq'))
    s.eq(rf'{dog_centre(1.5, 3):.3f}\ \approx\ ({K - 1:.2f})(-{response(1.5, 3):.2f})={(K - 1) * -response(1.5, 3):.3f}', 800, 880, 46, GREEN, at=s.cue('eq', 2.5))


GRADS = np.array([(3, 0), (0, 2), (-1, 1), (2, 2.)])
angles = np.degrees(np.arctan2(GRADS[:, 1], GRADS[:, 0])) % 360
sizes = np.hypot(*GRADS.T)
HIST = np.zeros(8)
for a, m in zip(angles, sizes): HIST[int(round(a / 45)) % 8] += m
assert np.allclose(HIST[:4], (3, 2.83, 2, 1.41), atol=.01)
assert 4 * 4 * 8 == 128


@V.chapter('Describe the patch with gradients', '''
    A keypoint has a position and a scale. To compare it across images, it needs a description. SIFT builds one from gradients.
    {cell}Take one cell with these four gradients. {hist}Each votes for its direction, weighted by its length.
    {grid}Four by four cells of eight bins give one hundred and twenty-eight numbers. {unit}Divide by the length, and doubling the contrast changes nothing.
''')
def describe(s):
    cx, cy, unit = 400, 520, 64
    s.rect(cx - 240, cy - 240, 480, 480, PANEL, LINE, r=10, at=s.t(.1))
    s.text('one cell', cx, cy + 290, 34, MUTED, anchor='middle', at=s.t(.1))
    colors = [GREEN, BLUE, VIOLET, YELLOW]
    for i, (gx, gy) in enumerate(GRADS):
        s.arrow(cx, cy, cx + gx * unit, cy - gy * unit, colors[i], 6, 20, at=s.cue('cell') + i * .3, draw=.4)
    x0, base, width = 780, 760, 74
    for i, value in enumerate(HIST):
        height = max(value * 120, 3)
        color = colors[[0, 3, 1, 2][i]] if i < 4 else MUTED
        s.rect(x0 + i * (width + 10), base - height, width, height, color, r=5, at=s.cue('hist') + i * .15, grow='h')['y'] = ramp(s.cue('hist') + i * .15, .55, base, base - height)
        s.text(f'{i * 45}°', x0 + i * (width + 10) + width / 2, base + 44, 28, MUTED, anchor='middle', at=s.cue('hist'))
        if value: s.text(f'{value:.2f}'.rstrip('0').rstrip('.'), x0 + i * (width + 10) + width / 2, base - height - 16, 32, INK, anchor='middle', at=s.cue('hist') + i * .15 + .3)
    s.eq(r'4\cdot4\cdot8=128', 780, 300, 62, GREEN, at=s.cue('grid'))
    s.eq(r'\frac{v}{\|v\|}', 1300, 300, 62, YELLOW, at=s.cue('unit'))
    s.text('ignores contrast', 1430, 290, 36, YELLOW, at=s.cue('unit', .3))


D = np.array([[.20, .50, .70], [.30, .35, .90], [.60, .80, .25]])


def ratio(row):
    a, b = np.sort(row)[:2]
    return a / b


assert abs(ratio(D[0]) - .4) < 1e-9 and abs(ratio(D[1]) - .857) < 1e-3


@V.chapter('Match, then test the match', '''
    Every descriptor has a nearest neighbour, even one with no true partner. So test it.
    {ratio}Lowe's ratio test compares the best distance with the runner-up. {a}Point two against point five is a ratio of point four: accept.
    {b}Point three against point three five is point eight six: reject, because two candidates look equally good, like repeated windows on a building.
    {mut}The mutual test adds that the best match must choose you back.
''', hold=.6)
def match(s):
    x0, y0, cell = 330, 300, 150
    for j in range(3): s.text(f'B{j + 1}', x0 + j * cell + cell / 2, y0 - 26, 38, MUTED, anchor='middle', at=s.t(.1))
    for i in range(3):
        s.text(f'A{i + 1}', x0 - 34, y0 + i * 100 + 58, 38, MUTED, anchor='end', at=s.t(.1))
        low = np.argsort(D[i])[0]
        for j in range(3):
            s.rect(x0 + j * cell, y0 + i * 100, cell - 8, 92, PANEL, LINE, r=8, at=s.t(.1))
            s.text(f'{D[i, j]:.2f}', x0 + j * cell + (cell - 8) / 2, y0 + i * 100 + 60, 40, INK, anchor='middle', at=s.t(.1), rise=0)
        cue = 'a' if i == 0 else 'b' if i == 1 else 'mut'
        color = CORAL if i == 1 else GREEN
        s.rect(x0 + low * cell, y0 + i * 100, cell - 8, 92, 'none', color, 5, r=8, at=s.cue(cue))
    s.eq(r'\frac{d_1}{d_2}<0.8', 1000, 340, 64, at=s.cue('ratio'))
    s.eq(rf'\frac{{0.20}}{{0.50}}={ratio(D[0]):.2f}', 1000, 500, 50, GREEN, at=s.cue('a'))
    s.text('accept', 1300, 490, 44, GREEN, 700, at=s.cue('a', .4))
    s.eq(rf'\frac{{0.30}}{{0.35}}={ratio(D[1]):.2f}', 1000, 640, 50, CORAL, at=s.cue('b'))
    s.text('reject', 1300, 630, 44, CORAL, 700, at=s.cue('b', .4))
    s.text('A3 and B3 choose each other.', 1000, 780, 40, GREEN, at=s.cue('mut', .5))
