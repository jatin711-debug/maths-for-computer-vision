"""Lesson 53: derivatives with respect to vectors and matrices, by following shapes."""
import numpy as np
from studio import *
from studio.core import bmat, ellipse

V = Video('matrix-calculus', 53, 'Matrix calculus by following the shapes', 'MATRIX CALCULUS', 'CALCULUS AND INFORMATION')

A = np.array([[1, 2], [0, 3.]])
AT = np.array([1, 1.])
TRUE = (A + A.T) @ AT
WRONG = 2 * A @ AT
assert np.allclose(TRUE, (4, 8)) and np.allclose(WRONG, (6, 6))
f = lambda x: x @ A @ x
SYM = (A + A.T) / 2


@V.chapter('A gradient has the shape of its variable', '''
    Here is the one convention that keeps this tidy. The derivative of a scalar loss has the shape of the variable.
    {w}If W is 512 by 10, then the derivative of L with respect to W is 512 by 10 as well. {entry}Each entry says how L changes when that one weight moves.
    {tr}And a sum of matching entries of two matrices is a trace, the tool that makes the algebra short.
''')
def shapes(s):
    size = 22
    for (x, label, color, cue) in ((170, 'W', BLUE, None), (640, r'\partial L/\partial W', GREEN, 'w')):
        at = s.t(.2) if cue is None else s.cue(cue)
        for i in range(12):
            for j in range(10):
                s.rect(x + j * (size + 6), 300 + i * (size + 6), size, size, color, r=4, at=at + (i + j) * .012, o=.35 + .5 * ((i * 7 + j * 3) % 5) / 5 if cue else .55)
        s.eq(label, x + 140, 262, 46, color, 'middle', at=at)
    s.text('512 × 10', 310, 680, 38, MUTED, anchor='middle', at=s.t(.3))
    s.text('512 × 10', 780, 680, 38, GREEN, anchor='middle', at=s.cue('w', .3))
    x, y = 640 + 4 * 28 + 11, 300 + 5 * 28 + 11
    s.circle(x, y, 19, 'none', YELLOW, 4, at=s.cue('entry'))
    s.eq(r'\left(\frac{\partial L}{\partial W}\right)_{ij}=\frac{\partial L}{\partial W_{ij}}', 1130, 420, 52, YELLOW, at=s.cue('entry', .3))
    s.eq(r'\operatorname{tr}(M^TB)=\sum_{i,j}M_{ij}B_{ij}', 1130, 620, 52, at=s.cue('tr'))


@V.chapter('Write dL, read off the gradient', '''
    The recipe has three moves. {d}Write the small change in L in terms of the small change in W.
    {r}Rearrange it into trace of M transpose d W, using the cyclic rule. {m}Then M is the gradient. There is nothing else to do.
    {ex}For example, trace of A transpose W has the differential trace of A transpose d W, so its gradient is A.
''')
def recipe(s):
    rows = [('1', r'dL=\ \dots\ dW\ \dots', 'd', INK), ('2', r'dL=\operatorname{tr}(M^T\,dW)', 'r', INK), ('3', r'\frac{\partial L}{\partial W}=M', 'm', GREEN)]
    for i, (n, tex, cue, color) in enumerate(rows):
        at = s.t(.2) if i == 0 else s.cue(cue)
        s.circle(190, 270 + i * 150, 38, PANEL, GREEN, 3, at=at)
        s.text(n, 190, 284 + i * 150, 42, GREEN, 700, 'middle', at=at, rise=0)
        s.eq(tex, 270, 290 + i * 150, 56, color, at=at)
    s.eq(r'\operatorname{tr}(ABC)=\operatorname{tr}(CAB)', 980, 420, 50, MUTED, at=s.cue('r', .4))
    s.eq(r'f=\operatorname{tr}(A^TW)', 170, 800, 52, YELLOW, at=s.cue('ex'))
    s.eq(r'\to\ df=\operatorname{tr}(A^T\,dW)\ \to\ \frac{\partial f}{\partial W}=A', 640, 800, 52, YELLOW, at=s.cue('ex', 1.6))


CENTRE, UNIT = (530, 575), 128
to = lambda p: (CENTRE[0] + p[0] * UNIT, CENTRE[1] - p[1] * UNIT)


def contours(s):
    for level, color in ((1.5, LINE), (3.4, LINE), (f(AT), GREEN)):
        s.poly([to(p) for p in ellipse((0, 0), np.linalg.inv(SYM) * level)], color, 3 if color == GREEN else 2, at=s.t(.1), draw=.8)
    s.line(CENTRE[0] - 410, CENTRE[1], CENTRE[0] + 410, CENTRE[1], LINE, 2, s.t(.1))
    s.line(CENTRE[0], CENTRE[1] - 260, CENTRE[0], CENTRE[1] + 260, LINE, 2, s.t(.1))
    s.circle(*to(AT), 12, YELLOW, at=s.t(.3))
    s.text('x = (1, 1)', to(AT)[0] + 26, to(AT)[1] + 44, 34, YELLOW, at=s.t(.3))


@V.chapter('Pause and predict', '''
    Now a quadratic form: x transpose A x, with this A, at the point one, one. Many people write the gradient as two A x.
    {ask}Is that right here? The gradient must cross the contour at a right angle. Pause and decide.
''', hold=1.5)
def question(s):
    contours(s)
    s.eq(r'f=x^TAx', 1120, 280, 60, at=s.t(.2))
    s.eq(rf'A={bmat(A)}', 1120, 440, 52, at=s.t(.4))
    s.eq(rf'2Ax={bmat(WRONG[None].T)}\ ?', 1120, 640, 52, YELLOW, at=s.cue('ask'))


@V.chapter('A must be symmetric for 2Ax', '''
    It is not. The product rule gives A plus A transpose, times x, which is four, eight. {check}Write f out by hand and the partial derivatives agree.
    {arrow}That arrow crosses the contour at a right angle, {bad}and two A x does not. The familiar formula holds only when A is symmetric.
''')
def answer(s):
    contours(s)
    tip = lambda g: (AT[0] + g[0] * .13, AT[1] + g[1] * .13)
    s.eq(r'\nabla_x\!\left(x^TAx\right)=(A+A^T)\,x', 1060, 270, 50, GREEN, at=s.t(.2))
    s.eq(rf'=({TRUE[0]:g},\ {TRUE[1]:g})', 1060, 350, 52, GREEN, at=s.t(1.2))
    s.eq(r'f=x_1^2+2x_1x_2+3x_2^2', 1060, 480, 48, at=s.cue('check'))
    s.eq(r'\partial_1 f=4,\quad \partial_2 f=8', 1060, 560, 46, MUTED, at=s.cue('check', .6))
    s.arrow(*to(AT), *to(tip(TRUE)), GREEN, 6, 22, at=s.cue('arrow'), draw=.6)
    s.arrow(*to(AT), *to(tip(WRONG)), CORAL, 5, 20, at=s.cue('bad'), draw=.6)
    s.text('2Ax, not at a right angle', 1060, 720, 40, CORAL, at=s.cue('bad', .3))


X = np.array([[1, 0, 2], [0, 1, 1.]])
W = np.array([[1, 0], [0, 1], [1, -1.]])
G = np.array([[1, -1], [0, 2.]])
XG, GW, COLUMNS = X.T @ G, G @ W.T, G.sum(0)
assert np.allclose(XG, [[1, -1], [0, 2], [2, 0]]) and np.allclose(COLUMNS, (1, 1))


def block(s, x, y, w, h, color, label, dims, at):
    s.rect(x, y, w, h, color, r=8, at=at, o=.8)
    s.eq(label, x + w / 2, y + h / 2 + 18, 54, BG, 'middle', at=at)
    s.text(dims, x + w / 2, y + h + 42, 32, MUTED, anchor='middle', at=at)


@V.chapter('The linear layer, derived once', '''
    A linear layer has inputs X, N by D, and weights W, D by C. The rest of the network only hands it G, the gradient at its output, N by C.
    {need}We need a D by C matrix, shaped like W. {flip}Flip X on its side, and X transpose G is the only product that fits.
    {solve}The trace rearrangement gives exactly that answer, {num}and each entry adds, over the batch, an input feature times the gradient reaching an output.
''')
def layer(s):
    block(s, 170, 300, 300, 150, BLUE, 'X', 'N × D', s.t(.2))
    block(s, 170, 560, 150, 300, VIOLET, 'W', 'D × C', s.t(.8))
    block(s, 560, 300, 150, 150, GREEN, 'G', 'N × C', s.t(1.6))
    s.rect(1320, 230, 150, 300, 'none', YELLOW, 4, r=8, at=s.cue('need'))
    s.text('D × C', 1395, 572, 34, YELLOW, anchor='middle', at=s.cue('need'))
    s.eq(r'\partial L/\partial W', 1395, 200, 40, YELLOW, 'middle', at=s.cue('need'))
    with s.group(860, 380, s.cue('flip')) as g:
        s.rect(-150, -75, 300, 150, BLUE, r=8, o=.8)
    g['rot'] = ramp(s.cue('flip', .3), .9, 0, 90, ease_io)
    s.eq(r'X^T', 860, 400, 54, BG, 'middle', at=s.cue('flip', 1))
    s.text('D × N', 860, 595, 32, MUTED, anchor='middle', at=s.cue('flip', 1))
    s.eq(r'\cdot', 972, 396, 60, at=s.cue('flip', 1))
    block(s, 1010, 305, 150, 150, GREEN, 'G', 'N × C', s.cue('flip', 1.1))
    s.eq('=', 1240, 400, 60, at=s.cue('flip', 1.4))
    s.rect(1320, 230, 150, 300, YELLOW, r=8, at=s.cue('solve'), o=.75)
    s.eq(r'X^TG', 1395, 398, 44, BG, 'middle', at=s.cue('solve'))
    s.eq(rf'X^TG={bmat(XG)}', 640, 800, 46, at=s.cue('num'))
    s.eq(rf'X={bmat(X)}\quad G={bmat(G)}', 1060, 800, 40, MUTED, at=s.cue('num', .4))


H = 1e-5
numeric = [(f(AT + H * e) - f(AT - H * e)) / (2 * H) for e in np.eye(2)]
assert np.allclose(numeric, TRUE, atol=1e-7)


@V.chapter('Check it numerically', '''
    A derivation can have the right shape and still be wrong. Two A x and A plus A transpose times x have the same shape.
    {fd}So nudge one entry up and down, and take the central difference. {num}The numbers agree with four, eight to about ten digits,
    {bad}and disagree with two A x in the very first digit. {end}Follow the shapes, then trust the check.
''', hold=.6)
def check(s):
    s.eq(r'\hat g_k=\frac{f(\theta+he_k)-f(\theta-he_k)}{2h}', 960, 320, 62, anchor='middle', at=s.cue('fd', -.8))
    s.eq(rf'h=10^{{-5}}', 960, 430, 42, MUTED, 'middle', at=s.cue('fd', .4))
    rows = [('analytic', f'({TRUE[0]:g},  {TRUE[1]:g})', GREEN, s.t(.2)), ('numeric', f'({numeric[0]:.11f},  {numeric[1]:.11f})', YELLOW, s.cue('num')), ('2Ax', f'({WRONG[0]:g},  {WRONG[1]:g})', CORAL, s.cue('bad'))]
    for i, (name, value, color, at) in enumerate(rows):
        s.text(name, 520, 590 + i * 92, 42, MUTED, anchor='end', at=at)
        s.text(value, 570, 590 + i * 92, 46, color, at=at)
