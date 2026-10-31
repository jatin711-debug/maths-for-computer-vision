"""Lesson 61: a match must lie on a line."""
import numpy as np
from studio import *
from studio.core import bmat

V = Video('epipolar-geometry', 61, 'A match must lie on a line', 'EPIPOLAR GEOMETRY', 'TWO VIEWS AND RENDERING')


def skew(t):
    return np.array([[0, -t[2], t[1]], [t[2], 0, -t[0]], [-t[1], t[0], 0.]])


T = np.array([1, 0, 0.])
E = skew(T)
X1 = np.array([1, 2, 4.])
x1 = X1 / X1[2]
X2 = X1 + T
x2 = X2 / X2[2]
LINE_2 = E @ x1
assert np.allclose(x1, (.25, .5, 1)) and np.allclose(x2, (.5, .5, 1)) and np.allclose(LINE_2, (0, -1, .5))
assert abs(x2 @ E @ x1) < 1e-12
assert np.allclose(np.linalg.svd(E)[1], (1, 1, 0))
far = np.array([2, 4, 8.]) + T
assert np.allclose(far[:2] / far[2], (.375, .5))
LEFT_C, RIGHT_C = np.array([330., 800]), np.array([1040., 800])
POINT = np.array([700., 240])


def rig(s, at=None):
    """Two cameras seen from above, with their image planes."""
    for name, c, color in (('camera 1', LEFT_C, BLUE), ('camera 2', RIGHT_C, GREEN)):
        s.circle(*c, 16, color, at=at)
        s.text(name, c[0], c[1] + 62, 34, color, anchor='middle', at=at)
    planes = []
    for c, tilt in ((LEFT_C, 1.), (RIGHT_C, -1.)):
        centre = c + np.array([tilt * 70, -210])
        along = np.array([230, tilt * 66])
        along = along / np.linalg.norm(along) * 170
        a, b = centre - along, centre + along
        s.line(*a, *b, MUTED, 5, at)
        planes.append((a, b))
    return planes


def hit(c, p, plane):
    a, b = plane
    d, e = p - c, b - a
    u = np.cross(a - c, e) / np.cross(d, e)
    return c + u * d


@V.chapter('A ray seen by the other camera', '''
    One image cannot tell you how far away a point is. {ray}It could be anywhere along this ray.
    {see}But a second camera sees that whole ray as a line. {line}So the match of a point must lie on one line in the other image: its epipolar line.
    {plane}The two camera centres and the point form the epipolar plane, and that plane cuts each image in one of these lines.
''')
def ray(s):
    p1, p2 = rig(s, s.t(.1))
    direction = (POINT - LEFT_C) / np.linalg.norm(POINT - LEFT_C)
    tip = LEFT_C + direction * 760
    near = LEFT_C + direction * 380
    s.line(*LEFT_C, *tip, BLUE, 4, s.cue('ray'), draw=.8)
    samples = [near, POINT, tip - direction * 60]
    spots = [hit(RIGHT_C, q, p2) for q in samples]
    for q, seen, delay in zip(samples, spots, (0, .35, .7)):
        at = s.cue('see') + delay
        s.circle(*q, 13, YELLOW, at=at)
        s.line(*q, *seen, MUTED, 2, at, dash='7 8')
        s.circle(*seen, 11, YELLOW, at=at + .2)
    s.line(*spots[0], *spots[2], YELLOW, 7, s.cue('line'), draw=.7)
    s.text('epipolar line', 1300, 480, 40, YELLOW, at=s.cue('line'))
    s.path(f'M{LEFT_C[0]} {LEFT_C[1]}L{RIGHT_C[0]} {RIGHT_C[1]}L{POINT[0]} {POINT[1]}Z', fill=GREEN, at=s.cue('plane'), o=.12)
    s.line(*LEFT_C, *RIGHT_C, GREEN, 4, s.cue('plane'), draw=.6)
    s.text('baseline', (LEFT_C[0] + RIGHT_C[0]) / 2, 845, 34, GREEN, anchor='middle', at=s.cue('plane', .3))
    s.text('epipolar plane', 1300, 620, 40, GREEN, at=s.cue('plane', .5))


@V.chapter('The essential matrix', '''
    Three vectors in the epipolar plane are coplanar, so their triple product is zero.
    {eq}Written with the cross product as a skew matrix, that one fact is the epipolar constraint, and the matrix in the middle is the essential matrix.
    {rank}It has rank two, and five degrees of freedom. {scale}Scaling t does not change the constraint, so two views give the direction of the translation, but not its length.
''')
def essential(s):
    s.eq(r'a\cdot(b\times c)=0', 960, 280, 62, anchor='middle', at=s.t(.2))
    s.eq(rf'\hat x_2^T\,\textcolor{{{GREEN}}}{{[t]_\times R}}\,\hat x_1=0', 960, 470, 76, anchor='middle', at=s.cue('eq'))
    s.eq(rf'\textcolor{{{GREEN}}}{{E=[t]_\times R}}', 960, 600, 58, anchor='middle', at=s.cue('eq', 2))
    s.text('rank 2', 600, 760, 44, YELLOW, 700, 'middle', at=s.cue('rank'))
    s.text('3 for R + 2 for t = 5', 1240, 760, 44, YELLOW, anchor='middle', at=s.cue('rank', .6))
    s.text('Two views fix t only up to scale.', 960, 880, 42, CORAL, anchor='middle', at=s.cue('scale'))


@V.chapter('A sideways step', '''
    Take the simplest pair: no rotation, one step to the right. The point one, two, four lands at point two five, point five in the first image.
    {x}In the second image it lands at point five, point five. {l}Multiply by E, and the epipolar line is y equals point five. {zero}The constraint gives exactly zero.
''')
def worked(s):
    s.eq(rf'E={bmat(E)}', 150, 300, 50, at=s.t(.2))
    s.eq(rf'\hat x_1=({x1[0]:g},\ {x1[1]:g},\ 1)', 150, 500, 46, BLUE, at=s.t(.8))
    s.eq(rf'\hat x_2=({x2[0]:g},\ {x2[1]:g},\ 1)', 150, 590, 46, GREEN, at=s.cue('x'))
    s.eq(r'E\hat x_1=(0,\ -1,\ 0.5)', 150, 700, 46, YELLOW, at=s.cue('l'))
    s.eq(r'\hat x_2^TE\hat x_1=0-0.5+0.5=0', 150, 820, 46, GREEN, at=s.cue('zero'))
    x0, y0, w, h = 860, 230, 840, 640
    image = lambda p: (x0 + w * (p[0] + .1) / .9, y0 + h * (p[1] - .05) / .9)
    s.rect(x0, y0, w, h, PANEL, LINE, r=8)
    s.text('image 2', x0 + 20, y0 + 46, 34, MUTED)
    s.line(x0 + 10, image((0, .5))[1], x0 + w - 10, image((0, .5))[1], YELLOW, 5, s.cue('l'), draw=.7)
    s.circle(*image(x2), 15, GREEN, at=s.cue('x'))
    return image


@V.chapter('Pause and predict', '''
    Now move the point twice as far along the same ray, to two, four, eight. {ask}Where does camera two see it? Does it leave the line? Pause and work it out.
''', hold=1.5)
def predict(s):
    x0, y0, w, h = 860, 230, 840, 640
    image = lambda p: (x0 + w * (p[0] + .1) / .9, y0 + h * (p[1] - .05) / .9)
    s.rect(x0, y0, w, h, PANEL, LINE, r=8)
    s.line(x0 + 10, image((0, .5))[1], x0 + w - 10, image((0, .5))[1], YELLOW, 5)
    s.circle(*image(x2), 15, GREEN)
    s.eq(r'X_1=(2,\ 4,\ 8)', 150, 420, 56, at=s.t(.3))
    s.eq(r'\hat x_2=\ ?', 150, 580, 72, YELLOW, at=s.cue('ask'))


@V.chapter('Depth slides along the line', '''
    Camera two sees it at point three seven five, point five: still on the line. Depth slides a match along its epipolar line, but never off it.
    {f}In pixels, the same constraint uses the fundamental matrix, which folds in both cameras' intrinsics.
    {eight}Each match gives one linear equation in F. Eight matches fix it, and the last step forces rank two, so that every line meets at one epipole.
''')
def eight(s):
    x0, y0, w, h = 860, 230, 840, 640
    image = lambda p: (x0 + w * (p[0] + .1) / .9, y0 + h * (p[1] - .05) / .9)
    s.rect(x0, y0, w, h, PANEL, LINE, r=8)
    s.line(x0 + 10, image((0, .5))[1], x0 + w - 10, image((0, .5))[1], YELLOW, 5)
    dot = s.circle(*image(x2), 15, GREEN)
    target = image(far[:2] / far[2])
    s.to(dot, s.t(.3), 1.4, ease_io, x=target[0])
    s.text('depth', (image(x2)[0] + target[0]) / 2, image(x2)[1] - 30, 36, GREEN, anchor='middle', at=s.t(1))
    s.eq(r'x_2^TFx_1=0', 150, 310, 58, at=s.cue('f'))
    s.eq(r'F=K_2^{-T}E\,K_1^{-1}', 150, 420, 50, MUTED, at=s.cue('f', .6))
    s.eq(r'[\,x_2x_1\ \ x_2y_1\ \ x_2\ \ y_2x_1\ \ y_2y_1\ \ y_2\ \ x_1\ \ y_1\ \ 1\,]\,f=0', 150, 600, 31, at=s.cue('eight'))
    s.text('8 matches, then SVD', 150, 720, 40, GREEN, at=s.cue('eight', 1.4))
    s.eq(r'\text{force }\sigma_3=0', 150, 820, 46, YELLOW, at=s.cue('eight', 3.4))
