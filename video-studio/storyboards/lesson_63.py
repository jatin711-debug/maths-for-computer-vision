"""Lesson 63: optimising over rotations, aligning point sets, and bundle adjustment."""
import math
import numpy as np
from scipy.linalg import expm
from studio import *
from studio.core import bmat

V = Video('rotations-and-bundle-adjustment', 63, 'Rotations as a manifold, and bundle adjustment', 'BUNDLE ADJUSTMENT', 'TWO VIEWS AND RENDERING')


def skew(v):
    return np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0.]])


STEP = np.array([0, 0, .1])
APPROX = np.eye(3) + skew(STEP)
EXACT = expm(skew(STEP))
E1 = np.array([1, 0, 0.])
assert abs(np.linalg.norm(APPROX @ E1) - 1.005) < 1e-3 and abs(np.linalg.det(APPROX) - 1.01) < 1e-9
assert abs(np.linalg.norm(EXACT @ E1) - 1) < 1e-12


@V.chapter('You cannot simply add to a rotation', '''
    Rotations do not live in a flat space. Inside all three by three matrices they form a curved surface, a manifold, like the surface of a globe.
    {step}So an optimizer that adds a small step walks off the surface. {num}A tenth of a radian added this way sends a unit vector to length one point zero zero five,
    {det}and the determinant becomes one point zero one. It stretches space, so it's no longer a rotation.
    {exp}The exponential map fixes this: keep a three-number step, and bend it back onto the surface.
''')
def manifold(s):
    centre, radius = (520, 570), 330
    s.circle(*centre, radius, 'none', BLUE, 4, at=s.t(.1))
    for angle in (-60, -30, 0, 30, 60):
        rx = radius * math.cos(math.radians(angle))
        s.line(centre[0] - rx, centre[1] - radius * math.sin(math.radians(angle)), centre[0] + rx, centre[1] - radius * math.sin(math.radians(angle)), LINE, 2, s.t(.1))
    at = math.radians(55)
    p = np.array([centre[0] + radius * math.cos(at), centre[1] - radius * math.sin(at)])
    tangent = np.array([-math.sin(at), -math.cos(at)])
    s.circle(*p, 14, YELLOW, at=s.t(.4))
    s.text('R', p[0] + 24, p[1] - 16, 42, YELLOW, 700, at=s.t(.4))
    length = 230
    q = p + tangent * length
    s.arrow(*p, *q, CORAL, 5, 20, at=s.cue('step'), draw=.6)
    s.text('R + step: off the surface', q[0] - 10, q[1] - 26, 34, CORAL, anchor='middle', at=s.cue('step', .4))
    arc = [(centre[0] + radius * math.cos(a), centre[1] - radius * math.sin(a)) for a in np.linspace(at, at + length / radius, 24)]
    s.poly(arc, GREEN, 7, at=s.cue('exp'), draw=1.)
    s.circle(*arc[-1], 14, GREEN, at=s.cue('exp', .9))
    s.eq(rf'\|(I+[\delta]_\times)e_1\|={np.linalg.norm(APPROX @ E1):.3f}', 1020, 300, 46, CORAL, at=s.cue('num'))
    s.eq(rf'\det(I+[\delta]_\times)={np.linalg.det(APPROX):.2f}', 1020, 400, 46, CORAL, at=s.cue('det'))
    s.eq(r'R\ \leftarrow\ R\exp([\delta]_\times)', 1020, 590, 60, GREEN, at=s.cue('exp'))
    s.text('always exactly a rotation', 1020, 670, 38, GREEN, at=s.cue('exp', 1))


PTS = np.array([(1, 0), (0, 1), (-1, 0), (0, -1.)])
TURN = np.array([[0, -1], [1, 0.]])
QS = PTS @ TURN.T
H = PTS.T @ QS
U, _, Vt = np.linalg.svd(H)
d = np.linalg.det(Vt.T @ U.T)
R = Vt.T @ np.diag([1, d]) @ U.T
assert np.allclose(R, TURN) and np.allclose(H, [[0, 2], [-2, 0]])


@V.chapter('Align two point sets in one shot', '''
    Given matched points, the best rotation has a closed form, with no iterations. This is Kabsch.
    {c}Subtract both centroids. {h}Form the cross-covariance H and take its SVD. {r}The rotation is V times U transpose.
    {d}If that comes out as a reflection, flip the sign of the smallest singular direction.
    {ex}This square, turned by ninety degrees, gives back exactly that turn.
''')
def kabsch(s):
    screen = lambda p: (480 + p[0] * 240, 570 - p[1] * 240)
    square = lambda pts, color, at, sw=4: s.poly([screen(p) for p in list(pts) + [pts[0]]], color, sw, at=at, draw=.8)
    square(QS, GREEN, s.t(.2))
    a, b = screen((-1.5, 0)), screen((1.5, 0))
    s.line(*a, *b, LINE, 2, s.t(.1))
    s.line(*screen((0, -1.4)), *screen((0, 1.4)), LINE, 2, s.t(.1))
    corners = [p * np.array([1, 1]) for p in PTS] + [PTS[0]]
    t0 = s.cue('ex')
    us = [(s.start, 0.)] + [(t0 + 1.6 * i / 14, ease_io(i / 14)) for i in range(15)]
    for p, q in zip(corners, corners[1:]):
        item = s.line(0, 0, 0, 0, BLUE, 5, s.t(.2))
        turned = lambda v, u: np.array([[math.cos(u * math.pi / 2), -math.sin(u * math.pi / 2)], [math.sin(u * math.pi / 2), math.cos(u * math.pi / 2)]]) @ v
        ends = [(t, screen(turned(p, u)), screen(turned(q, u))) for t, u in us]
        item.update(x=[[t, m[0]] for t, m, _ in ends], y=[[t, m[1]] for t, m, _ in ends], x2=[[t, n[0]] for t, _, n in ends], y2=[[t, n[1]] for t, _, n in ends])
    # A square looks the same after a quarter turn, so one marked corner shows the motion.
    marked = s.circle(0, 0, 16, YELLOW, at=s.t(.3))
    spots = [(t, screen(turned(PTS[0], u))) for t, u in us]
    marked.update(x=[[t, m[0]] for t, m in spots], y=[[t, m[1]] for t, m in spots])
    s.circle(*screen(QS[0]), 24, 'none', GREEN, 4, at=s.t(.3))
    s.eq(r'\tilde p_i=p_i-\bar p,\quad \tilde q_i=q_i-\bar q', 960, 280, 46, at=s.cue('c'))
    s.eq(r'H=\sum_i\tilde p_i\tilde q_i^T=U\Sigma V^T', 960, 400, 48, at=s.cue('h'))
    s.eq(r'R=V\,\operatorname{diag}(1,d)\,U^T', 960, 530, 52, GREEN, at=s.cue('r'))
    s.eq(r'd=\det(VU^T)', 960, 620, 44, YELLOW, at=s.cue('d'))
    s.eq(rf'H={bmat(H)}\ \to\ R={bmat(R)}', 960, 800, 46, at=s.cue('ex'))


@V.chapter('Pause and predict', '''
    Now bundle adjustment. It refines ten cameras and ten thousand points together. {ask}Each camera has six numbers and each point three.
    How big is the linear system? And could you really solve that directly? Pause and estimate.
''', hold=1.5)
def question(s):
    s.text('10 cameras', 620, 330, 58, BLUE, 700, 'middle', at=s.t(.2))
    s.text('10,000 points', 1300, 330, 58, GREEN, 700, 'middle', at=s.t(.6))
    s.eq(r'10\cdot6+10000\cdot3=\ ?', 960, 560, 72, YELLOW, 'middle', at=s.cue('ask'))


UNKNOWNS = 10 * 6 + 10000 * 3
assert UNKNOWNS == 30060


@V.chapter('Eliminate the points', '''
    Thirty thousand and sixty unknowns. {sparse}But each residual touches just one camera and one point, so the system is sparse, and its point block is diagonal in small pieces.
    {elim}Solve the points in terms of the cameras, and substitute. What's left is the Schur complement: {small}a sixty by sixty system, for the cameras alone.
    {back}Then recover each point, one at a time. This is why large reconstruction is possible at all.
''', hold=.6)
def schur(s):
    x0, y0, size = 150, 230, 620
    split = 130
    s.rect(x0, y0, size, size, PANEL, LINE, r=6, at=s.t(.2))
    s.rect(x0, y0, split, split, BLUE, r=4, at=s.cue('sparse'), o=.85)
    s.eq('B', x0 + split / 2, y0 + split / 2 + 18, 52, BG, 'middle', at=s.cue('sparse'))
    rng = np.random.default_rng(63)
    for i in range(12):
        x = x0 + split + i * (size - split) / 12
        s.rect(x + 2, y0 + split + i * (size - split) / 12 + 2, (size - split) / 12 - 4, (size - split) / 12 - 4, GREEN, r=2, at=s.cue('sparse', .3) + i * .04)
        for j in rng.choice(6, 2, replace=False):
            h = split / 6
            s.rect(x + 3, y0 + j * h + 2, (size - split) / 12 - 6, h - 4, YELLOW, r=2, at=s.cue('sparse', .8), o=.8)
            s.rect(x0 + j * h + 2, y0 + split + i * (size - split) / 12 + 3, h - 4, (size - split) / 12 - 6, YELLOW, r=2, at=s.cue('sparse', .8), o=.8)
    s.eq(r'\begin{bmatrix}B&E\\E^T&C\end{bmatrix}\begin{bmatrix}\delta_c\\\delta_p\end{bmatrix}=\begin{bmatrix}v\\w\end{bmatrix}', 880, 340, 44, at=s.t(.3))
    s.eq(r'\delta_p=C^{-1}(w-E^T\delta_c)', 880, 490, 44, GREEN, at=s.cue('elim'))
    s.eq(r'\big(B-EC^{-1}E^T\big)\,\delta_c=v-EC^{-1}w', 880, 610, 44, YELLOW, at=s.cue('elim', 1.8))
    s.eq(rf'{UNKNOWNS}\ \to\ 60', 880, 780, 72, GREEN, at=s.cue('small'))
