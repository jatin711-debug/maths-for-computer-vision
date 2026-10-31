"""Lesson 62: from two views to depth, and how fast the error grows."""
import numpy as np
from skimage import data
from studio import *

V = Video('stereo-depth', 62, 'Triangulation and depth from disparity', 'STEREO DEPTH', 'TWO VIEWS AND RENDERING')

P1 = np.c_[np.eye(3), [0, 0, 0.]]
P2 = np.c_[np.eye(3), [-1, 0, 0.]]
A = np.array([.25 * P1[2] - P1[0], .5 * P1[2] - P1[1], 0 * P2[2] - P2[0], .5 * P2[2] - P2[1]])
null = np.linalg.svd(A)[2][-1]
SOLVED = null / null[3]
assert np.allclose(SOLVED, (1, 2, 4, 1))
assert np.linalg.matrix_rank(A) == 3
FB = 800 * .1
depth = lambda d: FB / d
assert [round(depth(d), 2) for d in (20, 19, 21)] == [4, 4.21, 3.81]
sigma_z = lambda z, sd: z ** 2 / FB * sd
assert abs(sigma_z(4, .5) - .1) < 1e-9 and abs(sigma_z(20, .5) - 2.5) < 1e-9


@V.chapter('Two rays, one point', '''
    Once two cameras and a match are known, the 3D point is where the two rays meet.
    {eqs}Multiplying out the division in the camera equation gives two linear equations per view. Four rows, in four unknowns.
    {svd}Take the singular vector with the smallest singular value and divide by the last entry. {num}In this example the rows vanish at one, two, four.
    {angle}Accuracy depends on the angle: nearly parallel rays pin down the direction, but hardly the distance.
''')
def triangulate(s):
    c1, c2 = np.array([200., 850]), np.array([560., 850])
    point = np.array([380., 260])
    s.circle(*c1, 15, BLUE, at=s.t(.1))
    s.circle(*c2, 15, GREEN, at=s.t(.1))
    s.line(*c1, *(c1 + (point - c1) * 1.12), BLUE, 4, s.t(.3), draw=.9)
    s.line(*c2, *(c2 + (point - c2) * 1.12), GREEN, 4, s.t(.8), draw=.9)
    s.circle(*point, 16, YELLOW, at=s.t(1.7))
    s.eq(r'(x\,p_3^T-p_1^T)X=0', 800, 300, 50, at=s.cue('eqs'))
    s.eq(r'(y\,p_3^T-p_2^T)X=0', 800, 390, 50, at=s.cue('eqs', .7))
    s.eq(r'AX=0\ \to\ \text{smallest singular vector}', 800, 530, 46, YELLOW, at=s.cue('svd'))
    s.eq(rf'X=({SOLVED[0]:g},\ {SOLVED[1]:g},\ {SOLVED[2]:g})', 800, 640, 58, GREEN, at=s.cue('num'))
    s.text('narrow angle: distance is poorly known', 800, 800, 40, CORAL, at=s.cue('angle'))


PHOTO = data.chelsea()[40:240, 80:380] / 255.
ROW = 110


@V.chapter('Make the search one-dimensional', '''
    Rectification warps both images as if the cameras were stepped sideways, with no turn. Now every match sits on the same row.
    {shift}A point at x on the left appears at x minus d on the right. That shift d is the disparity.
    {eq}Similar triangles give the key result: depth is focal length times baseline, over disparity.
''')
def rectify(s):
    shift = 34
    # Two crops of one photo, so a match at x on the left is exactly at x - shift on the right.
    left, right = PHOTO[:, :-shift], PHOTO[:, shift:]
    scale = 450 / left.shape[1]
    height = left.shape[0] * scale
    s.image(left, 130, 240, 450, height, s.t(.1))
    s.image(right, 630, 240, 450, height, s.t(.1))
    s.text('left', 355, 215, 34, BLUE, anchor='middle', at=s.t(.1))
    s.text('right', 855, 215, 34, GREEN, anchor='middle', at=s.t(.1))
    y = 240 + ROW * scale
    s.line(130, y, 1080, y, YELLOW, 3, s.t(.8), draw=.8)
    match = 190
    xl, xr, same = 130 + match * scale, 630 + (match - shift) * scale, 630 + match * scale
    s.circle(xl, y, 13, BLUE, at=s.cue('shift'))
    s.circle(xr, y, 13, GREEN, at=s.cue('shift', .4))
    s.line(same, y + 36, xr, y + 36, YELLOW, 5, s.cue('shift', .8), draw=.4)
    s.eq('d', (same + xr) / 2, y + 86, 46, YELLOW, 'middle', at=s.cue('shift', 1))
    s.eq(r'd=x_L-x_R=\frac{fB}{Z}', 150, 760, 58, at=s.cue('eq'))
    s.eq(r'Z=\frac{fB}{d}', 860, 760, 70, GREEN, at=s.cue('eq', 1.8))


@V.chapter('Pause and predict', '''
    A rig has f B of eighty, so disparity twenty means four metres. A half-pixel matching error then costs about ten centimetres.
    {ask}What does the same half pixel cost at twenty metres, five times farther? Pause and predict.
''', hold=1.5)
def predict(s):
    s.eq(r'fB=80,\quad d=20\ \to\ Z=4\text{ m}', 960, 300, 58, anchor='middle', at=s.t(.2))
    s.eq(r'\sigma_d=0.5\ \to\ \sigma_Z\approx0.1\text{ m}', 960, 450, 58, GREEN, 'middle', at=s.t(1.6))
    s.eq(r'Z=20\text{ m}:\ \ \sigma_Z=\ ?', 960, 660, 68, YELLOW, 'middle', at=s.cue('ask'))


@V.chapter('Error grows with distance squared', '''
    Two point five metres. Five times farther means twenty-five times the error, because depth error grows with the square of distance.
    {slide}One pixel of disparity is twenty centimetres at four metres, and metres at twenty.
    {cure}Doubling the baseline or the focal length halves it, and so does matching more precisely.
''')
def growth(s):
    p = s.plot(150, 220, 900, 680, (0, 22), (0, 2.8), at=s.t(.1), xlabel='depth (m)', ylabel='depth error (m)')
    zs = np.linspace(.3, 21, 60)
    p.curve(zs, sigma_z(zs, .5), GREEN, 6, at=s.t(.2), draw=1.2)
    p.dot(4, sigma_z(4, .5), 13, YELLOW, at=s.t(.4))
    p.dot(20, sigma_z(20, .5), 15, CORAL, at=s.t(1.2))
    s.text('2.5 m', p.pt(20, 2.5)[0] - 24, p.pt(20, 2.5)[1] + 8, 42, CORAL, 700, 'end', at=s.t(1.3))
    s.text('0.1 m', p.pt(4, .1)[0] + 12, p.pt(4, .1)[1] - 26, 36, YELLOW, at=s.t(.5))
    s.eq(r'\sigma_Z\approx\frac{Z^2}{fB}\,\sigma_d', 1180, 340, 66, at=s.t(.3))
    s.eq(rf'd=20:\ {depth(20):.2f}\text{{ m}}', 1180, 500, 44, MUTED, at=s.cue('slide'))
    s.eq(rf'd=19:\ {depth(19):.2f}\text{{ m}}', 1180, 570, 44, MUTED, at=s.cue('slide', .3))
    s.eq(r'2B\ \to\ \tfrac12\,\sigma_Z', 1180, 720, 50, GREEN, at=s.cue('cure'))


left = np.array([10, 10, 80, 80, 30, 30, 90, 20, 20, 20.])
right = np.roll(left, -2)
costs = [np.abs(left[3:7] - right[3 - d:7 - d]).sum() for d in range(4)]
BEST = int(np.argmin(costs))
assert BEST == 2 and costs[BEST] == 0


@V.chapter('Matching along a row', '''
    To find d at every pixel, slide a small window along the same row and add up the absolute differences.
    {d}Try each disparity in turn. The cost dips where the windows truly match.
    {best}Here the minimum is at disparity two. {vol}Stacked for every pixel and every d, these costs form a cost volume, the structure modern stereo networks still learn on.
''', hold=.6)
def cost(s):
    cell = 86
    x0, y0 = 150, 260
    for row, values, name in ((0, left, 'left'), (1, right, 'right')):
        s.text(name, x0 - 14, y0 + row * 120 + 56, 34, MUTED, anchor='end', at=s.t(.1))
        for i, v in enumerate(values):
            shade = '#%02x%02x%02x' % tuple(int(40 + v * 2) for _ in range(3))
            s.rect(x0 + i * cell, y0 + row * 120, cell - 6, 100, shade, r=6, at=s.t(.1))
            s.text(f'{v:g}', x0 + i * cell + 40, y0 + row * 120 + 62, 34, BG if v > 45 else INK, anchor='middle', at=s.t(.1), rise=0)
    s.rect(x0 + 3 * cell - 5, y0 - 8, 4 * cell + 2, 116, 'none', YELLOW, 4, r=8, at=s.t(.3))
    box = s.rect(x0 + 3 * cell - 5, y0 + 112, 4 * cell + 2, 116, 'none', GREEN, 4, r=8, at=s.cue('d'))
    step = 1.
    for d in range(1, 3):
        s.to(box, s.cue('d') + (d - 1) * step + .3, .5, ease_io, x=x0 + (3 - d) * cell - 5)
    base, top = 880, 610
    for d, c in enumerate(costs):
        height = max(4, c / max(costs) * (base - top - 40))
        x = 1160 + d * 112
        at = s.cue('d') + d * .5
        s.rect(x, base - height, 86, height, YELLOW if d == BEST else BLUE, r=5, at=at)
        s.text(f'd = {d}', x + 43, base + 44, 30, MUTED, anchor='middle', at=at)
    s.text('C(d)', 1160, 590, 36, MUTED, at=s.cue('d'))
    s.eq(r'C(x,y,d)=\sum_{w}\big|I_L-I_R(\cdot-d)\big|', 150, 620, 44, at=s.t(.4))
    s.text('cost volume: x × y × d', 150, 790, 42, GREEN, at=s.cue('vol'))
