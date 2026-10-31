"""Lesson 57: from image gradients to corners, on real images."""
import math
import numpy as np
from scipy.ndimage import convolve, gaussian_filter, sobel
from skimage import data
from skimage.feature import corner_harris, corner_peaks
from studio import *
from studio.core import bmat

V = Video('structure-tensor', 57, 'Gradients, the structure tensor and corners', 'CORNERS', 'FEATURES AND TRACKING')

PHOTO = data.camera()[60:316, 120:376] / 255.
Ix = sobel(PHOTO, axis=1) / 8
Iy = sobel(PHOTO, axis=0) / 8
signed = lambda image: np.clip(.5 + image * 4, 0, 1)
RAMP = np.array([[33, 45, 57], [38, 50, 62], [43, 55, 67.]])
SX = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1.]])
gx, gy = (SX * RAMP).sum(), (SX.T * RAMP).sum()
assert (gx, gy) == (96, 40) and math.hypot(gx / 8, gy / 8) == 13
angle = math.degrees(math.atan2(gy, gx))
assert abs(angle - 22.6) < .05


@V.chapter('A gradient is two filter responses', '''
    An image gradient is two numbers per pixel: how fast brightness changes to the right, and how fast it changes downwards.
    {sobel}The Sobel filter takes a difference across three rows and averages them with weights one, two, one.
    {num}On a ramp that climbs twelve per pixel across and five down, its sums are ninety-six and forty. {div}Divide by eight, and you get exactly twelve and five.
    {mag}So the edge strength is thirteen, at about twenty-three degrees.
''')
def gradient(s):
    side = 340
    s.image(PHOTO, 130, 230, side, side, s.t(.1))
    s.image(signed(Ix), 130 + side + 30, 230, side, side, s.t(.8))
    s.image(signed(Iy), 130 + 2 * side + 60, 230, side, side, s.t(1.8))
    s.eq('I', 130 + side / 2, 625, 44, MUTED, 'middle', at=s.t(.1))
    s.eq('I_x', 130 + side * 1.5 + 30, 625, 44, GREEN, 'middle', at=s.t(.8))
    s.eq('I_y', 130 + side * 2.5 + 60, 625, 44, BLUE, 'middle', at=s.t(1.8))
    s.eq(rf'S_x={bmat(SX)}', 1250, 300, 44, at=s.cue('sobel'))
    s.eq(rf'\frac{{{gx:g}}}{{8}}={gx / 8:g},\quad \frac{{{gy:g}}}{{8}}={gy / 8:g}', 1250, 520, 46, YELLOW, at=s.cue('num'))
    s.eq(rf'|\nabla I|=\sqrt{{12^2+5^2}}={math.hypot(gx, gy) / 8:g}', 130, 790, 52, GREEN, at=s.cue('mag'))
    s.eq(rf'\theta=\operatorname{{atan2}}(5,\,12)={angle:.1f}^\circ', 900, 790, 52, GREEN, at=s.cue('mag', .8))


rng = np.random.default_rng(57)
NOISY = np.clip(PHOTO + rng.normal(0, .07, PHOTO.shape), 0, 1)
RAW = np.gradient(NOISY, axis=1)
SMOOTH = gaussian_filter(NOISY, 2, order=(0, 1))


@V.chapter('Smooth, then differentiate', '''
    A difference amplifies noise, because noise is the highest frequency there is. {raw}Here is a plain difference on a noisy image.
    {gauss}The principled fix is to blur with a Gaussian, then differentiate, and one kernel can do both.
    {sep}It separates into a derivative along the rows and a blur along the columns, so a thirteen-tap kernel needs twenty-six multiplications, not one hundred and sixty-nine.
''')
def smooth(s):
    side = 400
    s.image(NOISY, 130, 240, side, side, s.t(.1))
    s.text('noisy image', 130 + side / 2, 700, 34, MUTED, anchor='middle', at=s.t(.1))
    s.image(signed(RAW * 1.3), 130 + side + 40, 240, side, side, s.cue('raw'))
    s.text('plain difference', 130 + side * 1.5 + 40, 700, 34, CORAL, anchor='middle', at=s.cue('raw'))
    s.image(signed(SMOOTH * 2.5), 130 + 2 * side + 80, 240, side, side, s.cue('gauss'))
    s.text('derivative of Gaussian', 130 + side * 2.5 + 80, 700, 34, GREEN, anchor='middle', at=s.cue('gauss'))
    s.eq(r'I_x=\frac{\partial G_\sigma}{\partial x}*I', 300, 830, 52, at=s.cue('gauss', 1.2))
    s.eq(r'13+13=26\quad\text{not}\quad 13^2=169', 1000, 830, 50, GREEN, at=s.cue('sep', 2))


SCENE = np.zeros((96, 96))
SCENE[30:, 30:] = 1
SCENE = gaussian_filter(SCENE, 1.5)
SPOTS = (('flat', (12, 12), MUTED), ('edge', (70, 30), BLUE), ('corner', (30, 30), GREEN))


def bowl(row, col, radius=8, half=8):
    """The real sum of squared differences as the window at (row, col) shifts."""
    wide = np.pad(SCENE, radius, mode='edge')
    row, col = row + radius, col + radius
    patch = wide[row - half:row + half, col - half:col + half]
    out = np.zeros((2 * radius + 1, 2 * radius + 1))
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            moved = wide[row + dy - half:row + dy + half, col + dx - half:col + dx + half]
            out[dy + radius, dx + radius] = ((moved - patch) ** 2).sum()
    return out


def tint(values, top=None):
    top = top or values.max() or 1
    u = np.clip(values / top, 0, 1)[..., None]
    return (1 - u) * np.array([.05, .08, .13]) + u * np.array([.24, .8, .57])


@V.chapter('How much does a patch change?', '''
    A good feature point is one whose patch would look different if it moved in any direction.
    {shift}So shift a window, and add up the squared differences. {flat}On a flat patch nothing changes, and the map stays dark.
    {edge}On an edge, moving along it changes nothing, so you get a valley. {corner}At a corner, every direction costs, and you get a bowl.
    {eq}A Taylor expansion turns this into a quadratic form, with the structure tensor M in the middle.
''')
def window(s):
    x0, y0, scale = 130, 230, 7.2
    s.image(np.dstack([SCENE] * 3), x0, y0, 96 * scale, 96 * scale, s.t(.1), pixelated=True)
    top = max(bowl(row, col).max() for _, (row, col), _ in SPOTS)
    for i, (name, (row, col), color) in enumerate(SPOTS):
        at = s.cue(name)
        box = 16 * scale
        s.rect(x0 + (col - 8) * scale, y0 + (row - 8) * scale, box, box, 'none', color, 5, at=at)
        x = 880 + i * 300
        s.image(tint(bowl(row, col), top), x, 300, 260, 260, at, pixelated=True)
        s.text(name, x + 130, 610, 40, color, 700, 'middle', at=at)
    s.text('Squared difference for each shift', 880, 260, 34, MUTED, at=s.cue('shift'))
    s.eq(r'E(\Delta u)\approx\Delta u^TM\,\Delta u', 880, 740, 54, at=s.cue('eq'))
    s.eq(r'M=\sum_x w(x)\begin{bmatrix}I_x^2&I_xI_y\\I_xI_y&I_y^2\end{bmatrix}', 880, 890, 46, YELLOW, at=s.cue('eq', 1.2))


def tensor(gradients):
    g = np.array(gradients, float)
    return g.T @ g


DIAGONAL = tensor([(1, 1), (1, 1)])
assert np.allclose(np.linalg.eigvalsh(DIAGONAL), (0, 4))


@V.chapter('Pause and predict', '''
    Two pixels both have the gradient one, one. {m}Every entry of M is two, which looks big everywhere.
    {ask}Is this a corner, or an edge? Pause and work out the eigenvalues.
''', hold=1.5)
def question(s):
    s.eq(r'\nabla I=(1,\ 1),\ (1,\ 1)', 960, 320, 60, anchor='middle', at=s.t(.2))
    s.eq(rf'M={bmat(DIAGONAL)}', 960, 560, 72, YELLOW, 'middle', at=s.cue('m'))
    s.text('corner or edge?', 960, 800, 50, anchor='middle', at=s.cue('ask'))


def harris(gradients, k=.04):
    M = tensor(gradients)
    return np.linalg.det(M) - k * np.trace(M) ** 2


CORNER, EDGE = [(1, 0), (1, 0), (0, 1), (0, 1)], [(1, 0)] * 4
assert abs(harris(CORNER) - 3.36) < 1e-9 and abs(harris(EDGE) + .64) < 1e-9
points = corner_peaks(corner_harris(PHOTO, sigma=2), min_distance=9, threshold_rel=.02, num_peaks=60)


@V.chapter('The eigenvalues decide', '''
    It's an edge. The eigenvalues are four and zero: the same edge, turned by forty-five degrees.
    {plane}Both small: flat. {e}One large: an edge. {c}Both large: a corner.
    {harris}Harris avoids the square roots with the determinant and the trace. The corner scores three point three six, {neg}and edges score negative.
    {real}Keep the strongest local maxima, and these are the corners of a real image.
''', hold=.6)
def verdict(s):
    p = s.plot(130, 210, 640, 640, (0, 5), (0, 5), at=s.t(.1))
    s.eq(r'\lambda_1', 790, 870, 40, MUTED, at=s.t(.1))
    s.eq(r'\lambda_2', 130, 195, 40, MUTED, at=s.t(.1))
    s.rect(*p.pt(0, 1.05), 640 * .21, 640 * .21, MUTED, r=6, at=s.cue('plane'), o=.28)
    s.text('flat', p.pt(.5, .5)[0], p.pt(.5, .5)[1] + 12, 36, INK, anchor='middle', at=s.cue('plane'))
    s.path('M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ' % (*p.pt(1.05, 0), *p.pt(5, 0), *p.pt(5, .55), *p.pt(1.05, .55)), fill=BLUE, at=s.cue('e'), o=.4)
    s.text('edge', p.pt(3.3, .28)[0], p.pt(3.3, .28)[1] + 12, 36, INK, anchor='middle', at=s.cue('e'))
    s.path('M%.1f %.1fL%.1f %.1fL%.1f %.1fL%.1f %.1fZ' % (*p.pt(1.05, 1.05), *p.pt(5, 1.05), *p.pt(5, 5), *p.pt(1.05, 5)), fill=GREEN, at=s.cue('c'), o=.35)
    s.text('corner', p.pt(3, 3)[0], p.pt(3, 3)[1] + 12, 42, INK, 700, 'middle', at=s.cue('c'))
    p.dot(4, .03, 14, YELLOW, at=s.t(.4))
    s.eq(r'R=\det M-k\,(\operatorname{tr}M)^2', 860, 250, 44, at=s.cue('harris'))
    s.eq(rf'\text{{corner: }}{harris(CORNER):.2f}', 860, 340, 42, GREEN, at=s.cue('harris', 2.5))
    s.eq(rf'\text{{edge: }}{harris(EDGE):.2f}', 1320, 340, 42, CORAL, at=s.cue('neg'))
    x0, y0, side = 1000, 400, 500
    s.image(PHOTO, x0, y0, side, side, s.cue('real'))
    for i, (row, col) in enumerate(points):
        s.circle(x0 + col * side / 256, y0 + row * side / 256, 11, 'none', GREEN, 5, at=s.cue('real', .3) + i * .04)
