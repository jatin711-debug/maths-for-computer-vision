"""Lesson 41: reusing a trained network. The lesson's other walkthrough predates this section."""
import numpy as np
from studio import *

V = Video('transfer-learning', 41, 'Transfer learning: keep the backbone, replace the head', 'TRANSFER LEARNING', 'CNN CLASSIFICATION')

LAYERS = [(150, 400), (260, 340), (370, 280), (480, 230), (590, 190), (700, 150)]
HEAD_X = 860


def gabor(angle, frequency=.16, size=33):
    y, x = np.mgrid[-16:17, -16:17] / 1.
    along = x * np.cos(angle) + y * np.sin(angle)
    wave = np.cos(2 * np.pi * frequency * along) * np.exp(-(x ** 2 + y ** 2) / (2 * 7.5 ** 2))
    return np.clip(.5 + .5 * wave, 0, 1)


def backbone(s, color=BLUE, at=None, until=None):
    """The stack of layers, shrinking in space towards the head."""
    items = []
    for x, height in LAYERS:
        items.append(s.rect(x, 560 - height / 2, 70, height, color, r=8, at=at, until=until))
    return items


@V.chapter('Why start from scratch?', '''
    Training every weight from random values needs a lot of data. {pre}But a network trained on a large dataset has already done most of the work.
    {early}Its early layers have learned general features, like edges and textures.
    {head}Only the final head is tied to the old classes.
''')
def start(s):
    backbone(s, MUTED, at=s.t(.1), until=s.cue('pre'))
    s.text('random weights', 460, 830, 38, MUTED, anchor='middle', at=s.t(.1), until=s.cue('pre'))
    backbone(s, BLUE, at=s.cue('pre'))
    s.rect(HEAD_X, 460, 80, 200, CORAL, r=8, at=s.cue('head'))
    s.text('old head', HEAD_X + 40, 700, 36, CORAL, anchor='middle', at=s.cue('head'))
    s.text('1000 old classes', HEAD_X + 40, 750, 32, MUTED, anchor='middle', at=s.cue('head', .2))
    for i, angle in enumerate(np.linspace(0, np.pi, 9)[:-1]):
        s.image(gabor(angle), 1060 + (i % 4) * 170, 290 + (i // 4) * 170, 150, 150, s.cue('early') + i * .12, pixelated=True)
    s.text('edge-like filters, early layers', 1060, 660, 36, MUTED, at=s.cue('early', .5))
    s.arrow(1050, 365, 240, 330, BLUE, 3, at=s.cue('early', .8), dash='8 10')


@V.chapter('Keep the backbone, replace the head', '''
    So keep the backbone, {off}take off the old head, {on}and attach a new one for your classes. Here, ten.
    {features}The backbone hands over 512 features, and the new head turns them into ten class scores.
''')
def swap(s):
    backbone(s)
    old = s.rect(HEAD_X, 460, 80, 200, CORAL, r=8, until=s.cue('on', .6))
    s.to(old, s.cue('off'), .9, ease_in, y=1100, o=0)
    new = s.rect(HEAD_X, -260, 80, 200, GREEN, r=8, at=s.cue('on', -.1))
    s.to(new, s.cue('on'), .8, spring, y=460)
    s.text('new head', HEAD_X + 40, 700, 36, GREEN, anchor='middle', at=s.cue('on', .5))
    s.text('10 classes', HEAD_X + 40, 750, 32, MUTED, anchor='middle', at=s.cue('on', .7))
    s.text('512', 800, 448, 34, YELLOW, anchor='middle', at=s.cue('features'))
    s.arrow(778, 560, 852, 560, YELLOW, 5, at=s.cue('features'), draw=.3)
    for i in range(10):
        y = 395 + i * 37
        at = s.cue('features', .5) + i * .06
        s.line(944, 560, 1090, y, MUTED, 1.5, at, o=.7)
        s.circle(1104, y, 13, GREEN, at=at)
    s.text('class scores', 1140, 572, 38, GREEN, at=s.cue('features', 1.2))


FEATURES, CLASSES = 512, 10
HEAD_PARAMETERS = FEATURES * CLASSES + CLASSES
assert HEAD_PARAMETERS == 5130


@V.chapter('Freeze it and count', '''
    To use the backbone as a feature extractor, {lock}freeze it, so only the head's weights change.
    {count}Each of the ten outputs has 512 weights and one bias: 5130 parameters to train.
''')
def freeze(s):
    layers = backbone(s, BLUE)
    for item in layers: s.to(item, s.cue('lock'), .6, ease_io, fill='#2c3a4d')
    s.text('frozen', 430, 830, 44, MUTED, 700, 'middle', at=s.cue('lock'))
    s.rect(HEAD_X, 460, 80, 200, GREEN, r=8)
    s.text('training', HEAD_X + 40, 700, 36, GREEN, anchor='middle', at=s.cue('lock', .3))
    s.eq(rf'{FEATURES}\cdot{CLASSES}+{CLASSES}', 1080, 460, 70, at=s.cue('count'))
    s.eq(rf'={HEAD_PARAMETERS}', 1080, 590, 88, GREEN, at=s.cue('count', 1.4))
    s.text('weights plus biases', 1080, 670, 36, MUTED, at=s.cue('count', 1.8))


@V.chapter('Pause and predict', '''
    Now swap in a backbone ten times larger that still gives 512 features. {ask}How many parameters do you train while it is frozen? Pause and decide.
''', hold=1.5)
def predict(s):
    wide = [(150 + i * 90, 470 - i * 34) for i in range(7)]
    for x, height in wide: s.rect(x, 560 - height / 2, 74, height, '#2c3a4d', r=8, at=s.t(.1))
    s.text('10 × larger, frozen', 420, 880, 40, MUTED, anchor='middle', at=s.t(.3))
    s.rect(HEAD_X + 60, 460, 80, 200, GREEN, r=8, at=s.t(.3))
    s.eq(r'?', 1290, 590, 150, YELLOW, anchor='middle', at=s.cue('ask'))


@V.chapter('Fine-tuning takes small steps', '''
    Still 5130, however large the backbone is. {fine}Fine-tuning goes further: it unfreezes the backbone and keeps training.
    {lr}But use a learning rate about ten times smaller. {big}The weights are already good. A large step throws them out of the valley.
    {small}A small step adapts them. {wait}And wait until the head has settled, because a random head sends large gradients back into good weights.
''')
def fine_tune(s):
    p = s.plot(150, 220, 860, 690, (-2.5, 2.5), (0, 6.2))
    us = np.linspace(-2.4, 2.4, 80)
    curve = lambda w: 1.05 * w ** 2 + .1
    grad = lambda w: 2.1 * w
    p.curve(us, curve(us), GREEN, 5, at=s.t(.1), draw=.9)
    s.eq(r'\text{loss}(w)', 150, 196, 34, MUTED, at=s.t(.1))
    s.eq(rf'\text{{still }}{HEAD_PARAMETERS}', 1120, 360, 72, GREEN, at=s.t(.1), until=s.cue('lr'))
    start_w = .7
    def walk(rate, steps):
        out = [start_w]
        for _ in range(steps): out.append(out[-1] - rate * grad(out[-1]))
        return out
    big, small = walk(1.08, 4), walk(.108, 12)
    assert abs(big[-1]) > abs(big[0]) and abs(small[-1]) < abs(small[0])
    dot = s.circle(*p.pt(start_w, curve(start_w)), 14, CORAL, at=s.cue('big'), until=s.cue('small'))
    gap = (s.cue('small') - s.cue('big') - .3) / 4
    for i, w in enumerate(big[1:]):
        x, y = p.pt(w, curve(w))
        s.to(dot, s.cue('big') + i * gap, gap * .8, ease_io, x=x, y=y)
    dot2 = s.circle(*p.pt(start_w, curve(start_w)), 14, GREEN, at=s.cue('small'))
    for i, w in enumerate(small[1:]):
        x, y = p.pt(w, curve(w))
        s.to(dot2, s.cue('small') + i * .22, .2, linear, x=x, y=y)
    s.eq(r'\eta_{\text{fine}}\approx\frac{\eta}{10}', 1120, 340, 66, GREEN, at=s.cue('lr'))
    s.text('large step: overshoots', 1120, 500, 40, CORAL, at=s.cue('big'))
    s.text('small step: adapts', 1120, 570, 40, GREEN, at=s.cue('small'))
    s.text('Let the head settle first.', 1120, 720, 40, YELLOW, at=s.cue('wait'))


@V.chapter('What stays your job', '''
    Two things stay your responsibility. {pre}The preprocessing the weights were trained with is part of the model: input size, colour order and normalization.
    {test}And pretrained weights do not replace evaluation. Keep an independent test set, {compare}and compare frozen against fine-tuned on the same split.
''', hold=.6)
def duties(s):
    for i, (title, lines, cue) in enumerate((('Same preprocessing', ['input size', 'colour order', 'normalization'], 'pre'), ('Honest evaluation', ['independent test set', 'frozen vs fine-tuned', 'same split'], 'test'))):
        x = 150 + i * 840
        at = s.cue(cue) if i else s.t(.2)
        s.rect(x, 240, 780, 520, PANEL, LINE, r=16, at=at)
        s.text(title, x + 54, 340, 50, GREEN, 700, at=at)
        for j, line in enumerate(lines):
            delay = at + .5 + j * .5 if i == 0 else s.cue('compare') * (j > 0) + (at + .4) * (j == 0) + (j - 1) * .5 * (j > 0)
            s.text(line, x + 54, 460 + j * 86, 44, at=delay)
