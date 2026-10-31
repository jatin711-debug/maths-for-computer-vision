"""Lesson 51: from a 3D point to a pixel, with rotations and lens distortion on the way."""
import math
import numpy as np
from studio import *

V = Video('pinhole-camera', 51, 'From a 3D point to a pixel', 'THE PINHOLE CAMERA', 'IMAGE GEOMETRY')

F = 800
K = np.array([[F, 0, 320], [0, F, 240], [0, 0, 1.]])
assert abs(F * .5 / 4 - 100) < 1e-9
point = K @ np.array([.5, -.25, 4.])
pixel = point[:2] / point[2]
assert np.allclose(pixel, (420, 190))
fov = math.degrees(2 * math.atan(640 / (2 * F)))
assert abs(fov - 43.6) < .05
Rt = np.c_[np.eye(3), [0, 0, 5.]]
P = K @ Rt
hom = P @ np.array([1, 0, 0, 1.])
assert np.allclose(hom, (2400, 1200, 5)) and np.allclose(P @ np.array([0, 0, -5, 1.]), 0)
EYE = (190, 640)
PLANE = 200
UNIT_Z, UNIT_X = 150, 300
to_side = lambda z, x: (EYE[0] + z * UNIT_Z, EYE[1] - x * UNIT_X)


def camera(s, at=None):
    s.line(EYE[0] - 10, EYE[1], 1720, EYE[1], LINE, 2, at)
    s.text('Z', 1740, EYE[1] + 12, 34, MUTED, at=at)
    s.line(EYE[0] + PLANE, EYE[1] - 240, EYE[0] + PLANE, EYE[1] + 120, BLUE, 4, at)
    s.text('image plane', EYE[0] + PLANE, EYE[1] + 170, 32, BLUE, anchor='middle', at=at)
    s.circle(*EYE, 15, YELLOW, at=at)
    s.text('centre', EYE[0], EYE[1] + 58, 30, YELLOW, anchor='middle', at=at)
    s.line(EYE[0], EYE[1] + 90, EYE[0] + PLANE, EYE[1] + 90, MUTED, 2, at)
    s.text('f', EYE[0] + PLANE / 2, EYE[1] + 128, 34, MUTED, anchor='middle', at=at)


@V.chapter('Similar triangles', '''
    Put the camera at the origin, looking along Z, with the image plane at distance f.
    {ray}A ray from a 3D point to the centre crosses that plane, {tri}and the two triangles are similar.
    {eq}So x equals f times X over Z. {num}With f of 800 pixels, a point half a metre off-axis at four metres lands one hundred pixels from the centre.
''')
def triangles(s):
    camera(s, s.t(.1))
    z, x = 4, .5
    end = to_side(z, x)
    s.circle(*end, 15, GREEN, at=s.cue('ray'))
    s.text('(X, Z) = (0.5, 4)', end[0] + 26, end[1] - 22, 34, GREEN, at=s.cue('ray'))
    s.line(*EYE, *end, GREEN, 3, s.cue('ray', .2), draw=.7)
    hit = EYE[0] + PLANE, EYE[1] - (end[1] * -1 + EYE[1]) * PLANE / (end[0] - EYE[0])
    s.circle(*hit, 12, YELLOW, at=s.cue('ray', .8))
    s.path(f'M{EYE[0]} {EYE[1]}L{hit[0]} {EYE[1]}L{hit[0]} {hit[1]}Z', fill=YELLOW, at=s.cue('tri'), o=.35)
    s.path(f'M{EYE[0]} {EYE[1]}L{end[0]} {EYE[1]}L{end[0]} {end[1]}Z', fill=GREEN, at=s.cue('tri', .4), o=.16)
    s.eq(r'x=f\,\frac XZ', 1150, 300, 66, at=s.cue('eq'))
    s.eq(rf'{F}\cdot\frac{{0.5}}{{4}}={F * .5 / 4:g}\text{{ px}}', 1150, 430, 52, YELLOW, at=s.cue('num'))


@V.chapter('Twice as wide, twice as far', '''
    Now slide the point along its ray. {far}The point one, zero, eight is twice as wide and twice as far, {same}and it lands on the same pixel.
    {why}One image cannot separate size from distance, which is why depth from one camera needs learned priors or known object sizes.
''')
def ambiguity(s):
    camera(s)
    end, far = to_side(4, .5), to_side(8, 1)
    s.line(*EYE, *to_side(9.5, 1.1875), GREEN, 3)
    hit = EYE[0] + PLANE, EYE[1] - PLANE * (.125 * UNIT_X / UNIT_Z)
    s.circle(*hit, 12, YELLOW)
    dot = s.circle(*end, 15, GREEN)
    s.to(dot, s.cue('far'), 2., ease_io, x=far[0], y=far[1])
    s.eq(r'\frac{0.5}{4}=\frac{1}{8}', 400, 300, 58, YELLOW, at=s.cue('same'))
    s.text('same ray, same pixel', 640, 280, 42, YELLOW, at=s.cue('same', .2))
    s.text('One image cannot separate size from distance.', 960, 960, 40, CORAL, anchor='middle', at=s.cue('why'))


@V.chapter('Pixels start at the corner', '''
    Pixel coordinates start at the image corner, so the intrinsic matrix K adds the principal point, here three twenty, two forty.
    {pt}The camera point zero point five, minus zero point two five, four, lands on pixel four twenty, one ninety.
    {fov}A six hundred and forty pixel wide image then spans a horizontal view of about forty-three point six degrees.
''')
def intrinsics(s):
    x0, y0, scale = 150, 200, 1.1
    w, h = 640 * scale, 480 * scale
    s.rect(x0, y0, w, h, PANEL, LINE, r=4)
    s.circle(x0, y0, 9, MUTED)
    s.text('(0, 0)', x0 + 16, y0 + 40, 30, MUTED)
    px = lambda u, v: (x0 + u * scale, y0 + v * scale)
    s.circle(*px(320, 240), 11, BLUE)
    s.text('(320, 240)', px(320, 240)[0] - 16, px(320, 240)[1] + 46, 32, BLUE, anchor='end')
    s.line(*px(320, 240), *px(*pixel), YELLOW, 3, s.cue('pt'), draw=.5)
    s.circle(*px(*pixel), 14, YELLOW, at=s.cue('pt', .4))
    s.text(f'({pixel[0]:g}, {pixel[1]:g})', px(*pixel)[0] + 20, px(*pixel)[1] - 18, 36, YELLOW, at=s.cue('pt', .5))
    s.eq(r'K=\begin{bmatrix}f_x&s&c_x\\0&f_y&c_y\\0&0&1\end{bmatrix}', 1000, 330, 54)
    s.eq(rf'u={F}\cdot\frac{{0.5}}{{4}}+320={pixel[0]:g}', 1000, 520, 48, YELLOW, at=s.cue('pt'))
    s.eq(rf'v={F}\cdot\frac{{-0.25}}{{4}}+240={pixel[1]:g}', 1000, 640, 48, YELLOW, at=s.cue('pt', .6))
    s.eq(rf'2\arctan\frac{{640}}{{2\cdot{F}}}\approx{fov:.1f}^\circ', 1000, 800, 48, GREEN, at=s.cue('fov'))


@V.chapter('Pause and predict', '''
    A training pipeline crops the image, starting one hundred pixels from the left and forty from the top.
    {ask}Where is the principal point in the crop? Pause and work it out.
''', hold=1.5)
def crop_question(s):
    x0, y0, scale = 180, 220, 1.1
    s.rect(x0, y0, 640 * scale, 480 * scale, PANEL, LINE, r=4, at=s.t(.1))
    s.circle(x0 + 320 * scale, y0 + 240 * scale, 11, BLUE, at=s.t(.1))
    s.rect(x0 + 100 * scale, y0 + 40 * scale, 440 * scale, 360 * scale, 'none', YELLOW, 4, at=s.t(1))
    s.text('crop', x0 + 100 * scale + 14, y0 + 40 * scale + 44, 36, YELLOW, at=s.t(1))
    s.eq(r'(c_x,\ c_y)=(320,\ 240)', 1040, 400, 54, at=s.t(.3))
    s.eq(r'(c_x^\prime,\ c_y^\prime)=\ ?', 1040, 560, 62, YELLOW, at=s.cue('ask'))


@V.chapter('A crop moves the principal point', '''
    Subtract the offset: two twenty, two hundred. {why}A crop or a resize changes K, so a network trained on crops with the old K learns inconsistent geometry.
    {p}Add a rotation and translation and you have the full three by four camera matrix.
    {cam}With the camera five metres back, the world point one, zero, zero gives twenty-four hundred, twelve hundred, five. {div}Divide by five: pixel four eighty, two forty.
''')
def full_matrix(s):
    s.eq(r"(c_x^\prime,\ c_y^\prime)=(320-100,\ 240-40)=(220,\ 200)", 150, 240, 50, GREEN, at=s.t(.1))
    s.text('Crops and resizes change K.', 150, 340, 42, CORAL, at=s.cue('why'))
    s.eq(r'\lambda\begin{bmatrix}u\\v\\1\end{bmatrix}=K\,[R\,|\,t]\begin{bmatrix}X\\Y\\Z\\1\end{bmatrix}', 150, 530, 56, at=s.cue('p'))
    rows = r'\\'.join('&'.join(f'{v:g}' for v in row) for row in P)
    s.eq(rf'P=\begin{{bmatrix}}{rows}\end{{bmatrix}}', 980, 530, 46, at=s.cue('cam'))
    s.eq(rf'P\,(1,0,0,1)^T=({hom[0]:g},\ {hom[1]:g},\ {hom[2]:g})', 150, 760, 50, YELLOW, at=s.cue('cam', 2.4))
    s.eq(rf'\div\,{hom[2]:g}\ \to\ ({hom[0] / hom[2]:g},\ {hom[1] / hom[2]:g})', 150, 880, 56, GREEN, at=s.cue('div'))


CORNERS = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)], float)
EDGES = [(i, j) for i in range(8) for j in range(i + 1, 8) if np.abs(CORNERS[i] - CORNERS[j]).sum() == 2]
assert len(EDGES) == 12
TURN = np.array([[0, -1, 0], [1, 0, 0], [0, 0, 1.]])
assert np.trace(TURN) == 1 and np.isclose(np.linalg.det(TURN), 1)


def view(point, cx=480, cy=570, unit=125):
    """Looks at the cube from above and to the side, without perspective."""
    pitch, yaw = math.radians(62), math.radians(24)
    x, y, z = point
    x, y = x * math.cos(yaw) - y * math.sin(yaw), x * math.sin(yaw) + y * math.cos(yaw)
    y, z = y * math.cos(pitch) - z * math.sin(pitch), y * math.sin(pitch) + z * math.cos(pitch)
    return cx + x * unit, cy + y * unit * -1 - 0


def spin(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])


@V.chapter('Four ways to write a rotation', '''
    A rotation matrix has nine entries but only three degrees of freedom. {tr}Here's a ninety degree turn about Z: its trace is one, so the cosine of theta is zero.
    {aa}Axis-angle stores it in three numbers, which suits optimizers. {eu}Euler angles are easy to read, but at ninety degrees of pitch they lose a degree of freedom: gimbal lock.
    {qu}Unit quaternions use four numbers with no gimbal lock, though q and minus q are the same rotation.
''')
def rotations(s):
    t0, t1 = s.cue('tr'), s.cue('tr', 2.4)
    angles = [(s.start, 0.)] + ramp(t0, 2.4, 0, 90, ease_io, 24) + ramp(s.end - 13, 9, 90, 180, ease_io, 24)
    for i, j in EDGES:
        ends = [(t, view(spin(a) @ CORNERS[i]), view(spin(a) @ CORNERS[j])) for t, a in angles]
        item = s.line(0, 0, 0, 0, BLUE, 4)
        item.update(x=[[t, p[0]] for t, p, _ in ends], y=[[t, p[1]] for t, p, _ in ends], x2=[[t, q[0]] for t, _, q in ends], y2=[[t, q[1]] for t, _, q in ends])
    bottom, top = view((0, 0, -1.9)), view((0, 0, 1.9))
    s.line(*bottom, *top, YELLOW, 4, s.cue('tr'))
    s.eq(r'R=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}', 900, 300, 44, at=s.t(.2))
    s.eq(r'\operatorname{tr}R=1+2\cos\theta', 1330, 300, 42, YELLOW, at=s.cue('tr'))
    rows = [('aa', r'\text{axis-angle: }\omega=\theta n', GREEN), ('eu', r'\text{Euler: }R_z(\psi)R_y(\theta)R_x(\phi)', CORAL), ('qu', r'\text{quaternion: }q\approx(0.707,0,0,0.707)', VIOLET)]
    for i, (cue, tex, color) in enumerate(rows):
        s.eq(tex, 900, 520 + i * 130, 48, color, at=s.cue(cue))
    s.eq(rf'q=\left(\cos\tfrac\theta2,\ \sin\tfrac\theta2\,n\right)', 900, 890, 40, MUTED, at=s.cue('qu', 1.4))


def distort(x, y, k):
    gain = 1 + k * (x * x + y * y)
    return x * gain, y * gain


@V.chapter('Real lenses bend straight lines', '''
    Real lenses bend straight lines. {r}The radial model scales each point by its distance from the centre.
    {b}A negative coefficient pulls the edges in, and the grid bows into a barrel. {cal}Calibration estimates these numbers from photos of a checkerboard, {end}and then we can undo the bend.
''', hold=.6)
def lens(s):
    centre, unit = (560, 570), 300
    screen = lambda p: (centre[0] + p[0] * unit, centre[1] - p[1] * unit)
    # Stays one-to-one while 1 + 3kr² > 0: this k keeps that true out to the grid's corners.
    coefficient = -.12
    assert 1 + 3 * coefficient * 2 * 1.15 ** 2 > 0
    bend = [(s.start, 0.)] + ramp(s.cue('b'), 2.2, 0, coefficient, ease_io, 14)
    bend += ramp(s.cue('end'), 2., coefficient, 0, ease_io, 14)
    values = np.linspace(-1.15, 1.15, 7)
    pieces = np.linspace(-1.15, 1.15, 13)
    for v in values:
        for a, b in zip(pieces, pieces[1:]):
            for first, second in (((v, a), (v, b)), ((a, v), (b, v))):
                ends = [(t, screen(distort(*first, k)), screen(distort(*second, k))) for t, k in bend]
                item = s.line(0, 0, 0, 0, BLUE, 3)
                item.update(x=[[t, p[0]] for t, p, _ in ends], y=[[t, p[1]] for t, p, _ in ends], x2=[[t, q[0]] for t, _, q in ends], y2=[[t, q[1]] for t, _, q in ends])
    s.eq(r'x_d=x\,(1+k_1r^2+k_2r^4)', 1110, 330, 46, at=s.cue('r'))
    s.eq(r'k_1<0:\ \text{barrel}', 1110, 480, 50, YELLOW, at=s.cue('b'))
    s.text('Fit from checkerboard photos.', 1110, 640, 38, GREEN, at=s.cue('cal'))
