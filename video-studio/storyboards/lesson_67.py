"""Lesson 67: noising an image in closed form, and walking the noise back."""
import math
import numpy as np
from skimage import data
from skimage.transform import resize
from studio import *

V = Video('diffusion-models', 67, 'Diffusion: noising, denoising and sampling', 'DIFFUSION', 'GENERATIVE MODELS AND SPLATTING')

PHOTO = data.chelsea()[20:276, 100:356] / 255.
SCALED = PHOTO * 2 - 1
BETA = np.linspace(1e-4, .02, 1000)
ALPHA_BAR = np.cumprod(1 - BETA)
assert abs(ALPHA_BAR[-1] - 4.0e-5) < 3e-6
assert abs(np.argmin(np.abs(ALPHA_BAR / (1 - ALPHA_BAR) - 1)) + 1 - 259) <= 2
rng = np.random.default_rng(67)
NOISE = rng.standard_normal(PHOTO.shape)


def noisy(t):
    bar = ALPHA_BAR[t - 1]
    return np.clip((math.sqrt(bar) * SCALED + math.sqrt(1 - bar) * NOISE + 1) / 2, 0, 1)


assert abs(.9 * .8 * .75 - .54) < 1e-12
assert abs(.8 * 2 + .6 * -1 - 1) < 1e-9


@V.chapter('Destroy the image slowly', '''
    A diffusion model learns to undo a process that turns images into noise. Each step shrinks the image a little and adds a little Gaussian noise.
    {steps}After a thousand steps, almost nothing of the image is left. {jump}Because Gaussian variances add, you do not need to walk there.
    {eq}Any noise level can be reached in one jump. {num}With zero point six four, the value two with noise minus one becomes one.
''')
def forward(s):
    stops = [1, 100, 250, 500, 750, 1000]
    side = 260
    for i, t in enumerate(stops):
        x = 130 + i * (side + 22)
        at = s.t(.2) + i * .9
        s.image(noisy(t), x, 240, side, side, at)
        s.text(f't = {t}', x + side / 2, 545, 34, MUTED, anchor='middle', at=at)
    s.eq(r'q(x_t\mid x_{t-1})=\mathcal N\big(\sqrt{1-\beta_t}\,x_{t-1},\ \beta_tI\big)', 130, 660, 40, at=s.t(.8))
    s.eq(r'x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon', 130, 790, 54, GREEN, at=s.cue('eq'))
    s.eq(r'0.8\cdot2+0.6\cdot(-1)=1.0', 1000, 790, 50, YELLOW, at=s.cue('num'))


@V.chapter('Predict the noise', '''
    A network sees the noisy image and the step, and is trained to recover the noise. {back}Know the noise, and you have the image: rearrange the same formula.
    {avg}But many clean images could give the same noisy one. So the best possible network outputs an average: the mean clean image consistent with what it sees.
''')
def predict_noise(s):
    side = 300
    y = 270
    s.image(noisy(250), 150, y, side, side, s.t(.2))
    s.eq('x_t', 300, y + side + 56, 44, MUTED, 'middle', at=s.t(.2))
    s.path(f'M520 {y + 10}L700 {y + 80}V{y + side - 80}L520 {y + side - 10}Z', fill=VIOLET, at=s.t(.5), o=.75)
    s.text('network', 610, y + side / 2 + 12, 34, BG, 700, 'middle', at=s.t(.5))
    bar = ALPHA_BAR[249]
    implied = (noisy(250) * 2 - 1 - math.sqrt(bar) * SCALED) / math.sqrt(1 - bar)
    s.image(np.clip((implied + 2.5) / 5, 0, 1), 770, y, side, side, s.t(.9))
    s.eq(r'\varepsilon_\theta(x_t,t)', 920, y + side + 56, 44, VIOLET, 'middle', at=s.t(.9))
    s.image(PHOTO, 1360, y, side, side, s.cue('back'))
    s.eq(r'\hat x_0=\frac{x_t-\sqrt{1-\bar\alpha_t}\,\varepsilon_\theta}{\sqrt{\bar\alpha_t}}', 1160, y + side + 170, 40, GREEN, at=s.cue('back', .4))
    s.arrow(1090, y + side / 2, 1340, y + side / 2, GREEN, 4, at=s.cue('back'), draw=.4)
    s.text('the average image that fits', 150, y + side + 170, 40, YELLOW, at=s.cue('avg', 1))


TEMPERATURE = lambda x: np.tanh(2.22 * x)
assert abs(TEMPERATURE(.5) - .804) < 1e-3


@V.chapter('Pause and predict', '''
    Take data that is only ever plus one or minus one, and suppose the noisy value is zero point five. {ask}What should the best denoiser output? One? Something else? Pause and decide.
''', hold=1.5)
def question(s):
    p = s.plot(420, 230, 1080, 660, (-2, 2), (-1.3, 1.3), at=s.t(.1), xlabel='noisy value', ylabel='best guess')
    (a, y), (b, _) = p.pt(-2, 0), p.pt(2, 0)
    s.line(a, y, b, y, LINE, 2, s.t(.1))
    for v in (-1, 1): s.line(*p.pt(-2, v), *p.pt(2, v), MUTED, 3, s.t(.3), dash='8 10')
    s.text('+1', p.pt(-2, 1)[0] - 16, p.pt(-2, 1)[1] + 12, 36, MUTED, anchor='end', at=s.t(.3))
    s.text('−1', p.pt(-2, -1)[0] - 16, p.pt(-2, -1)[1] + 12, 36, MUTED, anchor='end', at=s.t(.3))
    s.line(*p.pt(.5, -1.3), *p.pt(.5, 1.3), YELLOW, 3, s.cue('ask'), dash='8 8')
    p.dot(.5, 0, 12, YELLOW, at=s.cue('ask'))


DDIM = .9 * 2 + math.sqrt(.19) * -1
assert abs(DDIM - 1.364) < 1e-3
GUIDED = .2 + 3 * (.5 - .2)
assert abs(GUIDED - 1.1) < 1e-9


def tiny(image):
    side = min(image.shape[:2])
    return resize(image[:side, :side] / 255., (64, 64), anti_aliasing=True) * 2 - 1


colour = lambda image: np.dstack([image] * 3) if image.ndim == 2 else image[..., :3]
TRAINING = np.stack([tiny(colour(image)) for image in (data.chelsea(), data.coffee(), data.astronaut(), data.rocket(), data.camera(), data.moon())])


def exact_denoiser(x, bar):
    """The best possible noise predictor for this dataset: a soft choice between its images."""
    distance = ((x[None] - math.sqrt(bar) * TRAINING) ** 2).sum((1, 2, 3)) / (2 * (1 - bar))
    weights = np.exp(-(distance - distance.min()))
    weights /= weights.sum()
    return (weights[:, None, None, None] * TRAINING).sum(0)


def ddim_run(seed=7, steps=50):
    """A real DDIM run from pure noise."""
    x = np.random.default_rng(seed).standard_normal((64, 64, 3))
    levels = np.linspace(999, 0, steps + 1).astype(int)
    frames = [x.copy()]
    for t, previous in zip(levels, levels[1:]):
        clean = exact_denoiser(x, ALPHA_BAR[t])
        noise = (x - math.sqrt(ALPHA_BAR[t]) * clean) / math.sqrt(1 - ALPHA_BAR[t])
        x = math.sqrt(ALPHA_BAR[previous]) * clean + math.sqrt(1 - ALPHA_BAR[previous]) * noise
        frames.append(x.copy())
    return frames


RUN = ddim_run()
NEAREST = int(np.argmin(((TRAINING - RUN[-1]) ** 2).sum((1, 2, 3))))
assert ((TRAINING[NEAREST] - RUN[-1]) ** 2).mean() < 1e-3


@V.chapter('A soft choice, then walking back', '''
    About zero point eight: a soft choice between the two examples, never quite committing. {sample}To generate, start from pure noise and step towards less noise.
    Here is a real run with the exact best denoiser for six training images. {copy}It lands on one of them. The exact denoiser can only copy, which is why it must be learned.
    {ddpm}DDPM adds a little fresh noise at each of a thousand steps. {ddim}DDIM adds none, so one start always gives one image, and it can skip to fifty steps.
    {cfg}Guidance pushes past the conditional prediction to follow a prompt more closely. Weight three turns zero point five into one point one.
''', hold=.6)
def sampling(s):
    p = s.plot(150, 210, 520, 340, (-2, 2), (-1.3, 1.3), at=s.t(.1))
    xs = np.linspace(-2, 2, 90)
    p.curve(xs, TEMPERATURE(xs), GREEN, 6, at=s.t(.2), draw=.9)
    p.dot(.5, TEMPERATURE(.5), 13, YELLOW, at=s.t(.8))
    s.text(f'{TEMPERATURE(.5):.3f}', p.pt(.7, .95)[0], p.pt(.7, .95)[1] - 34, 38, YELLOW, at=s.t(.9))
    picks = [0, 20, 30, 38, 44, 50]
    size = 164
    for i, step in enumerate(picks):
        x = 760 + i * (size + 10)
        at = s.cue('sample') + i * .6
        s.image(np.clip((RUN[step] + 1) / 2, 0, 1), x, 240, size, size, at, pixelated=True)
        s.text(f'step {step}', x + size / 2, 438, 28, MUTED, anchor='middle', at=at)
    s.arrow(770, 470, 1790, 470, GREEN, 4, at=s.cue('sample'), draw=3.)
    s.text('exact denoiser, 6 training images', 760, 530, 34, MUTED, at=s.cue('sample', 3))
    s.text('it can only copy', 1400, 530, 36, CORAL, 700, at=s.cue('copy'))
    s.eq(r'\text{DDPM: fresh noise, }1000\text{ steps}', 760, 640, 40, BLUE, at=s.cue('ddpm'))
    s.eq(r'\text{DDIM: no fresh noise, }50\text{ steps}', 760, 720, 40, GREEN, at=s.cue('ddim'))
    s.eq(r'\tilde\varepsilon=\varepsilon_\varnothing+w\,(\varepsilon_c-\varepsilon_\varnothing)', 150, 860, 48, YELLOW, at=s.cue('cfg'))
    s.eq(rf'0.2+3\cdot0.3={GUIDED:g}', 800, 860, 48, YELLOW, at=s.cue('cfg', 3.4))
