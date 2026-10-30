"""Create and execute one NumPy notebook per core module (Modules 2-12): python course/build_core_notebooks.py

Module 1 keeps its hand-written starter notebook, and Modules 13-17 have their own builders.
Every assert runs here, so a notebook that is written has passed its own checks. Needs Pillow only to embed the photographs.
"""
from pathlib import Path
from contextlib import redirect_stdout
import base64, io, json, re, textwrap, zlib
from PIL import Image

BASE=Path(__file__).resolve().parent
reports=[]

def md(text): return dict(cell_type='markdown',metadata={},source=textwrap.dedent(text).strip()+'\n')
def code(text): return dict(cell_type='code',metadata={},source=textwrap.dedent(text).strip()+'\n',execution_count=None,outputs=[])
def write(name,cells):
    namespace={};count=0
    for cell in cells:
        if cell['cell_type']!='code': continue
        count+=1;output=io.StringIO()
        with redirect_stdout(output): exec(compile(cell['source'],name,'exec'),namespace)
        cell['execution_count']=count
        if output.getvalue(): cell['outputs']=[dict(output_type='stream',name='stdout',text=output.getvalue())]
    notebook=dict(nbformat=4,nbformat_minor=5,metadata=dict(kernelspec=dict(display_name='Python 3',language='python',name='python3'),language_info=dict(name='python',version='3')),
                  cells=[dict(id=f'cell-{i:03d}',**cell) for i,cell in enumerate(cells)])
    (BASE/'notebooks'/name).write_text(json.dumps(notebook,indent=2)+'\n',encoding='utf-8')
    reports.append(dict(file=name,executed_code_cells=count,result='passed'))

def photo_cell(name='camera',size=96):
    """Embed one CC0 sample photograph, so a notebook downloaded on its own still runs."""
    source=(BASE/'vision-images.js').read_text(encoding='utf-8')
    data=re.search(r'"%s":\s*\{\s*"src":\s*"data:image/png;base64,([A-Za-z0-9+/=]+)"'%name,source)[1]
    image=Image.open(io.BytesIO(base64.b64decode(data))).convert('L').resize((size,size),Image.LANCZOS)
    packed=base64.b64encode(zlib.compress(image.tobytes(),9)).decode('ascii')
    return code(f'''import base64, zlib
import numpy as np
# A {size}x{size} grayscale sample photograph from scikit-image (CC0), embedded so this notebook runs on its own.
PHOTO = np.frombuffer(zlib.decompress(base64.b64decode('{packed}')), dtype=np.uint8).reshape({size}, {size}).astype(float)
print('photo shape:', PHOTO.shape, 'min:', PHOTO.min(), 'max:', PHOTO.max(), 'mean:', round(PHOTO.mean(), 2))''')

write('module-02-vectors-and-similarity.ipynb',[
md(r'''# Vectors and similarity · Module 02
Python 3 and NumPy only. Predict every printed number before you run its cell, then explain any surprise. The final experiment asks you to change one thing.

Synthetic bars teach mechanics. They are not evidence about real photographs.'''),
md(r'''## Part 1: Dot products, angles and projection
Work these by hand first (Lessons 05 and 06). The residual is what the projection leaves behind, so it must be perpendicular to `u`.'''),
code(r'''import numpy as np
np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(202)
x = np.array([1., 2.]); w = np.array([3., -1.])
print('dot product w.x:', w @ x)
assert w @ x == 1
print('length of x:', np.linalg.norm(x))
print('cosine of the angle:', (w @ x) / (np.linalg.norm(w) * np.linalg.norm(x)))
u = np.array([1., 1.]); y = np.array([3., 4.])
projection = u * (u @ y) / (u @ u)
residual = y - projection
assert np.isclose(u @ residual, 0)
print('projection:', projection, 'residual:', residual)'''),
md(r'''## Part 2: A layer is a matrix product plus a bias
Examples are stored as rows, so `X` has shape (N, D). Write the output shape before running the cell. Then notice that `*` and `@` are different operations and that matrix order matters.'''),
code(r'''X = np.array([[1.,0.,0.],[0.,1.,0.],[0.,0.,1.],[1.,1.,1.]])   # (N, D) = (4, 3)
W = np.array([[2.,0.],[0.,1.],[1.,1.]])                        # (D, H) = (3, 2)
b = np.array([.5, -.5])                                        # one bias per output
Y = X @ W + b
print('X', X.shape, '@ W', W.shape, '+ b', b.shape, 'gives', Y.shape)
print(Y)
assert Y.shape == (4, 2)
print('trainable numbers in this layer:', W.size + b.size)
A = np.array([[1.,2.],[3.,4.]]); B = np.array([[0.,1.],[1.,0.]])
print('elementwise A*B:\n', A * B)
print('matrix product A@B:\n', A @ B)
print('matrix product B@A:\n', B @ A)
assert not np.allclose(A @ B, B @ A)'''),
md(r'''## Part 3: Rank and information lost
`B` below squeezes the plane onto a line. Find a nonzero vector it sends to zero, then see that adding it to any input changes nothing in the output. That lost direction is the null space.'''),
code(r'''B = np.array([[1.,1.],[2.,2.]])
null = np.array([1.,-1.])
assert np.allclose(B @ null, 0)
print('rank of B:', np.linalg.matrix_rank(B))
x = np.array([3.,5.])
print('B@x:', B @ x, 'and B@(x + 2*null):', B @ (x + 2 * null))
assert np.allclose(B @ x, B @ (x + 2 * null))
print('rank of diag(2,1):', np.linalg.matrix_rank(np.diag([2.,1.])))'''),
md(r'''## Part 4: Nearest-centroid recognition on 8x8 bars
Each image is flattened to a 64-dimensional vector. The classifier stores one average vector per class, fitted on training data only, and compares a new image with both. Compare Euclidean distance with normalized dot-product (cosine) similarity.

Expand the squared distance: ||x - c||² = ||x||² - 2 x·c + ||c||². When both centroids have the same length, the smallest distance and the largest dot product pick the same class, so expect the two rules to agree on this first dataset.'''),
code(r'''def bars(n, noise=.12, levels=(1., 1.)):
    y = rng.integers(0, 2, n); images = np.zeros((n, 8, 8))
    for i, label in enumerate(y):
        p = int(rng.integers(1, 6))
        if label == 0: images[i, p:p+2, :] = levels[0]
        else:          images[i, :, p:p+2] = levels[1]
    return (images + rng.normal(0, noise, images.shape)).reshape(n, -1), y
def show(row):
    shades = ' .:-=+*#%@'
    for line in np.clip(row.reshape(8, 8), 0, .99):
        print(''.join(shades[int(v * 10)] * 2 for v in line))
X, y = bars(240)
Xtr, ytr, Xval, yval = X[:160], y[:160], X[160:], y[160:]
print('one training example, label', ytr[0]); show(Xtr[0])
centers = np.stack([Xtr[ytr == c].mean(axis=0) for c in [0, 1]])
print('centroids', centers.shape, '(classes, pixels)')
def euclidean(new, centers):
    return np.sum((new[:, None, :] - centers[None, :, :]) ** 2, axis=2).argmin(axis=1)
def cosine(new, centers):
    a = new / np.linalg.norm(new, axis=1, keepdims=True)
    b = centers / np.linalg.norm(centers, axis=1, keepdims=True)
    return (a @ b.T).argmax(axis=1)
print('validation accuracy, Euclidean:', np.mean(euclidean(Xval, centers) == yval))
print('validation accuracy, cosine:   ', np.mean(cosine(Xval, centers) == yval))
assert np.mean(cosine(Xval, centers) == yval) > .9
assert np.mean(euclidean(Xval, centers) == cosine(Xval, centers)) > .9'''),
md(r'''## Part 5: When length misleads
Suppose the training photos of class 1 happened to be taken in brighter light. Brightness now changes the length of a centroid without saying anything about the label. Predict which rule suffers on evenly lit test images, using the expansion from Part 4.'''),
code(r'''Xlit, ylit = bars(160, levels=(.6, 1.8))
lit = np.stack([Xlit[ylit == c].mean(axis=0) for c in [0, 1]])
print('centroid lengths:', np.linalg.norm(lit, axis=1))
results = {}
for level in [.5, 1.]:
    Xtest, ytest = bars(400, levels=(level, level))
    results[level] = np.mean(euclidean(Xtest, lit) == ytest), np.mean(cosine(Xtest, lit) == ytest)
    print(f'test images at brightness {level}: Euclidean {results[level][0]:.3f}, cosine {results[level][1]:.3f}, N=400')
assert results[.5][1] > results[.5][0] + .2'''),
md(r'''## Your experiment
Write the shape of every array in Part 4 on paper: this is your shape-annotated forward pass. Explain the result of Part 5 with the geometry of length and angle. Then change one thing, such as noise or bar width, and report both accuracies with their counts. Fit centroids on training data only, and say what your result does not show about real photographs.''')])

write('module-09-filters-and-frequency.ipynb',[
md(r'''# Filters and frequency · Module 09
Python 3 and NumPy only. You meet this module early, once vectors are in place, because filters need only dot products. Compute each small response by hand first.'''),
photo_cell(),
code(r'''np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(209)
def correlate(image, kernel):
    """Valid cross-correlation, written as loops so that every step is visible."""
    kh, kw = kernel.shape; h, w = image.shape
    out = np.zeros((h - kh + 1, w - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(image[i:i+kh, j:j+kw] * kernel)
    return out
patch = np.array([[1.,2.],[3.,4.]]); kernel = np.array([[1.,0.],[0.,-1.]])
print('response on one patch:', correlate(patch, kernel))
assert correlate(patch, kernel).item() == -3
image = np.array([[1.,2.,3.],[4.,5.,6.],[7.,8.,9.]])
print('valid cross-correlation:\n', correlate(image, kernel))
print('valid convolution (kernel flipped first):\n', correlate(image, kernel[::-1, ::-1]))
# A second calculation guards the loops: the same sum using a sliding-window view.
windows = np.lib.stride_tricks.sliding_window_view(PHOTO, (3, 3))
sobel = np.array([[1.,0.,-1.],[2.,0.,-2.],[1.,0.,-1.]])
assert np.allclose(correlate(PHOTO, sobel), np.sum(windows * sobel, axis=(2, 3)))
print('loops match the second calculation on the photo.')'''),
md(r'''## Part 2: What a kernel's weights decide
A kernel whose weights add to 1 keeps average brightness. One whose weights add to 0 answers nothing on a flat region and responds to change. Predict both statements before running this cell. The linearity check is why a fixed filter counts as a linear map.'''),
code(r'''box = np.ones((3, 3)) / 9
flat = np.full((3, 3), 50.)
print('mean kernel on a flat patch:', correlate(flat, box).item())
print('zero-sum kernel on a flat patch:', correlate(flat, sobel).item())
assert np.isclose(correlate(flat, box).item(), 50) and correlate(flat, sobel).item() == 0
print('photo mean:', PHOTO.mean().round(2), 'after the mean filter:', correlate(PHOTO, box).mean().round(2))
edges = np.abs(correlate(PHOTO, sobel))
print('largest vertical-edge response:', edges.max(), 'median response:', np.median(edges))
Y = rng.normal(0, 10, PHOTO.shape)
assert np.allclose(correlate(2 * PHOTO + 3 * Y, box), 2 * correlate(PHOTO, box) + 3 * correlate(Y, box))
print('linearity holds: filter(2X + 3Y) = 2 filter(X) + 3 filter(Y)')'''),
md(r'''## Part 3: A Gaussian blur is two short blurs
Build the 1D weights from Lesson 34, then check that blurring rows and then columns matches the full 2D kernel. Each 2D entry is one 1D weight times another, which is what `np.outer` computes.'''),
code(r'''def gaussian(sigma):
    r = int(np.ceil(3 * sigma)); x = np.arange(-r, r + 1)
    g = np.exp(-x ** 2 / (2 * sigma ** 2))
    return g / g.sum()
g = gaussian(1.)
print('1D weights:', g, 'sum:', g.sum())
assert np.isclose(g.sum(), 1)
two_step = correlate(correlate(PHOTO, g[None, :]), g[:, None])
one_step = correlate(PHOTO, np.outer(g, g))
assert np.allclose(two_step, one_step)
print('multiplications per pixel, 2D:', g.size ** 2, 'separable:', 2 * g.size)'''),
md(r'''## Part 4: Aliasing, and why blurring comes first
A stripe at 0.45 cycles per sample is fine at full resolution. Keep every second sample and its frequency per new sample should be 0.9, which the new grid cannot represent, so it appears as a false slow wave near 0.1. Blurring before downsampling removes the stripe instead of letting it masquerade.'''),
code(r'''t = np.arange(256)
stripes = np.cos(2 * np.pi * .45 * t)
def peak_frequency(signal):
    spectrum = np.abs(np.fft.rfft(signal - signal.mean()))
    return round(float(spectrum.argmax() / len(signal)), 4), round(float(spectrum.max() / len(signal)), 4)
print('original (frequency, amplitude):', peak_frequency(stripes))
naive = stripes[::2]
print('downsampled naively:', peak_frequency(naive))
assert abs(peak_frequency(naive)[0] - .1) < .01
blur = np.array([1., 2., 1.]) / 4
safe = np.convolve(stripes, blur, mode='same')[1:-1][::2]
print('blurred, then downsampled:', peak_frequency(safe))
assert peak_frequency(safe)[1] < peak_frequency(naive)[1] / 10'''),
md(r'''## Part 5: The same filters, seen by frequency
The DFT writes a signal as a sum of waves. Its frequency response shows what a filter keeps: an average passes slow change, a difference passes fast change. The convolution theorem says circular filtering is multiplication of spectra.'''),
code(r'''row = np.array([1., -1., 1., -1.])
print('alternating row, DFT:', np.fft.fft(row).real)
assert np.allclose(np.fft.fft(row), [0, 0, 4, 0])
assert np.allclose(np.fft.ifft(np.fft.fft(row)).real, row)
average = np.abs(np.fft.rfft([.5, .5], 64)); difference = np.abs(np.fft.rfft([.5, -.5], 64))
print('average filter, gain at zero and top frequency:', average[0], average[-1].round(4))
print('difference filter, same two gains:', difference[0], difference[-1].round(4))
assert np.isclose(average[0], 1) and np.isclose(difference[0], 0)
signal = rng.normal(0, 1, 32); kernel1d = np.zeros(32); kernel1d[:3] = [.25, .5, .25]
looped = np.array([sum(signal[(n - k) % 32] * kernel1d[k] for k in range(32)) for n in range(32)])
assert np.allclose(looped, np.fft.ifft(np.fft.fft(signal) * np.fft.fft(kernel1d)).real)
print('convolution theorem confirmed on a random signal.')
spectrum = np.fft.fftshift(np.fft.fft2(PHOTO - PHOTO.mean()))
yy, xx = np.indices(PHOTO.shape) - 48
for radius in [4, 12, 24]:
    keep = (xx ** 2 + yy ** 2) <= radius ** 2
    print('radius', radius, 'keeps', round(float(np.sum(np.abs(spectrum[keep]) ** 2) / np.sum(np.abs(spectrum) ** 2)), 4), 'of the photo energy')'''),
md(r'''## Your experiment
Write a filter of your own, predict what it does from its weights and their sum, then test it on the photo and on a synthetic edge. Compare a mean filter and a Gaussian of similar width using their frequency responses. Submit your loop implementation, the second calculation that checks it, and a short explanation of why two adjacent objects can merge after careless downsampling.''')])

write('module-03-least-squares.ipynb',[
md(r'''# Least squares · Module 03
Python 3 and NumPy only. Write A and b on paper before computing. Use `np.linalg.lstsq`; do not invert `A.T @ A`.'''),
code(r'''import numpy as np
np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(203)
t = np.array([0., 1., 2.]); b = np.array([1., 2., 2.])
A = np.column_stack([t, np.ones_like(t)])
theta, _, rank, singular = np.linalg.lstsq(A, b, rcond=None)
residual = A @ theta - b
print('slope, intercept:', theta, 'rank:', rank, 'singular values:', singular)
assert np.allclose(theta, [.5, 7 / 6])
print('A.T @ residual (should be zero):', A.T @ residual)
assert np.allclose(A.T @ residual, 0, atol=1e-12)'''),
md(r'''## Part 2: Clean, noisy and one outlier
Fit the same line to three versions of the data. Squared error punishes a large residual heavily, so one bad point can pull the whole fit. Predict which coefficient moves most before you run the cell.'''),
code(r'''t = np.linspace(0, 10, 25); truth = np.array([2., -1.])
A = np.column_stack([t, np.ones_like(t)])
clean = A @ truth
noisy = clean + rng.normal(0, .5, t.size)
outlier = noisy.copy(); outlier[-1] += 30
results = {}
for name, b in [('clean', clean), ('noisy', noisy), ('one outlier', outlier)]:
    fit = np.linalg.lstsq(A, b, rcond=None)[0]
    r = A @ fit - b
    results[name] = fit
    print(f'{name:12s} fit {fit}  RMSE {np.sqrt(np.mean(r ** 2)):.3f}  largest |r| {np.abs(r).max():.2f}')
assert np.allclose(results['clean'], truth)
assert np.linalg.norm(results['one outlier'] - truth) > 3 * np.linalg.norm(results['noisy'] - truth)'''),
md(r'''## Part 3: Why stable solvers matter
Forming `A.T @ A` squares the condition number. QR works on A directly. Here a polynomial design matrix is badly conditioned, so the two routes give visibly different accuracy on a problem whose answer is known.'''),
code(r'''t = np.linspace(0, 1, 40); A = np.vander(t, 10, increasing=True)
known = rng.normal(0, 1, 10); b = A @ known
print('condition of A:', np.linalg.cond(A), ' of A.T@A:', np.linalg.cond(A.T @ A))
normal = np.linalg.solve(A.T @ A, A.T @ b)
Q, R = np.linalg.qr(A); qr = np.linalg.solve(R, Q.T @ b)
errors = np.linalg.norm(normal - known), np.linalg.norm(qr - known)
print('coefficient error, normal equations:', errors[0], ' QR:', errors[1])
assert errors[1] < errors[0]
print('explicit inverse for a small singular matrix fails:', end=' ')
try: np.linalg.inv(np.array([[1., 1.], [2., 2.]]))
except np.linalg.LinAlgError as error: print(error)
print('pseudoinverse still gives a minimum-norm answer:', np.linalg.pinv(np.array([[1., 1.], [2., 2.]])) @ np.array([1., 2.]))'''),
md(r'''## Part 4: Ridge regression and an honest choice of lambda
A flexible polynomial can chase noise. A penalty pulls the coefficients down. Choose lambda using validation error, then touch the test set once. The intercept is left unpenalized.'''),
code(r'''def design(x): return np.vander(x, 10, increasing=True)
def sample(n):
    x = rng.uniform(-1, 1, n)
    return x, np.sin(3 * x) + rng.normal(0, .25, n)
xtr, ytr = sample(16); xval, yval = sample(60); xtest, ytest = sample(200)
Atr, Aval, Atest = design(xtr), design(xval), design(xtest)
def ridge(A, y, lam):
    penalty = np.sqrt(lam) * np.eye(A.shape[1])[1:]
    return np.linalg.lstsq(np.vstack([A, penalty]), np.r_[y, np.zeros(A.shape[1] - 1)], rcond=None)[0]
mse = lambda A, y, w: np.mean((A @ w - y) ** 2)
choices = [0., 1e-4, 1e-2, 1e-1, 1., 10.]; scores = []
for lam in choices:
    w = ridge(Atr, ytr, lam); scores.append(mse(Aval, yval, w))
    print(f'lambda {lam:<7} train MSE {mse(Atr, ytr, w):.4f}  validation MSE {scores[-1]:.4f}  weight norm {np.linalg.norm(w):8.2f}')
best = choices[int(np.argmin(scores))]
w = ridge(Atr, ytr, best)
print('selected lambda:', best, ' test MSE, used once:', mse(Atest, ytest, w), ' test count:', ytest.size)
assert best > 0 and min(scores) < scores[0]'''),
md(r'''## Your experiment
Add a second outlier, or move the outlier to the middle of the range, and explain why the effect changes. Then repeat Part 4 with a fresh seed and report whether the chosen lambda is stable. Your fitting report should compare clean, noisy and outlier fits, separate residual from measurement noise, and state what the fit cannot tell you.''')])

write('module-04-svd-and-pca.ipynb',[
md(r'''# SVD and PCA · Module 04
Python 3 and NumPy only. An SVD of one image and a PCA of many samples are different calculations: keep asking which matrix is being factored.'''),
photo_cell(),
code(r'''np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(204)
A = np.array([[2., 1.], [1., 2.]])
values, vectors = np.linalg.eigh(A)
print('eigenvalues:', values)
assert np.allclose(A @ vectors[:, 1], values[1] * vectors[:, 1])
x = np.array([1., 0.])
for step in range(1, 9):
    x = A @ x; x = x / np.linalg.norm(x)
print('repeated multiplication points along:', x, ' top eigenvector:', vectors[:, 1])
assert np.isclose(abs(x @ vectors[:, 1]), 1, atol=1e-4)'''),
md(r'''## Part 2: Compress a photograph
Factor one pixel matrix. Keeping k terms stores k left vectors, k right vectors and k singular values. The squared error must equal the sum of the discarded squared singular values, which is a check you can trust.'''),
code(r'''U, s, Vt = np.linalg.svd(PHOTO, full_matrices=False)
print('largest singular values:', s[:5])
for k in [1, 5, 10, 20, 40]:
    approx = (U[:, :k] * s[:k]) @ Vt[:k]
    error = np.sum((PHOTO - approx) ** 2)
    assert np.isclose(error, np.sum(s[k:] ** 2))
    stored = k * (96 + 96 + 1)
    print(f'k={k:2d}  stored numbers {stored:5d} of {PHOTO.size}  RMSE {np.sqrt(error / PHOTO.size):6.2f}')'''),
md(r'''## Part 3: PCA of image patches
Now each sample is an 8x8 patch. Centering first means the directions describe variation, not the average patch. Compare the eigenvalues of the covariance matrix with the singular values of the centered data: they are the same information.'''),
code(r'''rows, cols = rng.integers(0, 88, 800), rng.integers(0, 88, 800)
patches = np.stack([PHOTO[r:r+8, c:c+8].ravel() for r, c in zip(rows, cols)])
mean = patches.mean(axis=0); centered = patches - mean
_, singular, components = np.linalg.svd(centered, full_matrices=False)
covariance = centered.T @ centered / (len(patches) - 1)
eigenvalues = np.linalg.eigvalsh(covariance)[::-1]
assert np.allclose(eigenvalues[:64], singular ** 2 / (len(patches) - 1))
explained = np.cumsum(eigenvalues) / eigenvalues.sum()
print('variance explained by 1, 4, 16 components:', explained[[0, 3, 15]])
scores = centered @ components[:4].T
rebuilt = scores @ components[:4] + mean
print('patch RMSE with 4 components:', np.sqrt(np.mean((rebuilt - patches) ** 2)))
print('the first direction is close to flat brightness; its entries:', (components[0][:4]))
assert explained[15] > .9'''),
md(r'''## Part 4: How leakage manufactures accuracy
These labels are pure coin flips, so honest accuracy is about 50%. Choosing the best features using all the data lets the held-out samples influence the choice. The score rises even though nothing real was learned.'''),
code(r'''def nearest_centroid(train, labels, new):
    centers = np.stack([train[labels == c].mean(axis=0) for c in [0, 1]])
    return np.sum((new[:, None, :] - centers[None, :, :]) ** 2, axis=2).argmin(axis=1)
def top_features(X, y, k):
    return np.argsort(np.abs(X[y == 0].mean(axis=0) - X[y == 1].mean(axis=0)))[-k:]
leaky, honest = [], []
for trial in range(40):
    X = rng.normal(0, 1, (60, 500)); y = rng.integers(0, 2, 60)
    if len(set(y[:40])) < 2: continue
    chosen = top_features(X, y, 10)
    leaky.append(np.mean(nearest_centroid(X[:40][:, chosen], y[:40], X[40:][:, chosen]) == y[40:]))
    chosen = top_features(X[:40], y[:40], 10)
    honest.append(np.mean(nearest_centroid(X[:40][:, chosen], y[:40], X[40:][:, chosen]) == y[40:]))
print('mean accuracy, features chosen on all data: ', np.mean(leaky))
print('mean accuracy, features chosen on training: ', np.mean(honest))
assert np.mean(leaky) > np.mean(honest) + .1'''),
md(r'''## Part 5: A training-only recognition pipeline
Fit the mean and the PCA basis on training data, then apply them unchanged to validation and test data. Choose the number of components using validation, and look at test results once.'''),
code(r'''def bars(n):
    y = rng.integers(0, 2, n); images = np.zeros((n, 8, 8))
    for i, label in enumerate(y):
        p = int(rng.integers(1, 6))
        if label == 0: images[i, p:p+2, :] = 1.
        else:          images[i, :, p:p+2] = 1.
    return (images + rng.normal(0, .6, images.shape)).reshape(n, -1), y
X, y = bars(320)
Xtr, Xval, Xtest = X[:200], X[200:260], X[260:]; ytr, yval, ytest = y[:200], y[200:260], y[260:]
mu = Xtr.mean(axis=0)
_, _, Vt = np.linalg.svd(Xtr - mu, full_matrices=False)
choices = [1, 2, 4, 8, 16, 32]; scores = []
for k in choices:
    basis = Vt[:k].T
    scores.append(np.mean(nearest_centroid((Xtr - mu) @ basis, ytr, (Xval - mu) @ basis) == yval))
    print('components', k, 'validation accuracy', scores[-1])
k = choices[int(np.argmax(scores))]; basis = Vt[:k].T
print('selected k:', k)
print('fixed-procedure test accuracy:', np.mean(nearest_centroid((Xtr - mu) @ basis, ytr, (Xtest - mu) @ basis) == ytest), 'test count:', len(ytest))
print('raw pixels on the same test set:', np.mean(nearest_centroid(Xtr, ytr, Xtest) == ytest))'''),
md(r'''## Your experiment
Find one case where compression harms recognition: try a class difference that lives in a low-variance direction, and explain why PCA ignores it even though it matters to the label. PCA directions are not class labels. Submit your rank-k compression table and the PCA baseline, with the split protocol stated.''')])

write('module-05-gradients-and-checks.ipynb',[
md(r'''# Gradients and checks · Module 05
Python 3 and NumPy only. A numerical derivative checks a calculation at one point; it does not replace the derivation. You will keep the checker you build here for the rest of the course.'''),
md(r'''## Part 1: Sweep the step size
A forward difference has error proportional to h, and a central difference to h squared. Very small steps then fail for a different reason: roundoff. Predict where the error is smallest before you run this.'''),
code(r'''import numpy as np
np.set_printoptions(precision=6, suppress=False)
rng = np.random.default_rng(205)
x = 1.; exact = np.cos(x)
forward = lambda h: (np.sin(x + h) - np.sin(x)) / h
central = lambda h: (np.sin(x + h) - np.sin(x - h)) / (2 * h)
print('      h       forward error   central error')
errors = {}
for h in [1e-1, 1e-3, 1e-5, 1e-7, 1e-9, 1e-11, 1e-13]:
    errors[h] = abs(central(h) - exact)
    print(f'{h:9.0e}   {abs(forward(h) - exact):12.3e}   {errors[h]:12.3e}')
assert errors[1e-5] < errors[1e-1] and errors[1e-5] < errors[1e-13]'''),
md(r'''## Part 2: A reusable gradient checker
Give it a loss function, an analytic gradient and a point. It reports the largest relative disagreement. Test it on a correct gradient, then on a deliberately wrong one, because a check that cannot fail proves nothing.'''),
code(r'''def check_gradient(loss, gradient, theta, h=1e-5):
    theta = np.array(theta, dtype=float); analytic = gradient(theta); numeric = np.zeros_like(theta)
    for j in range(theta.size):
        step = np.zeros_like(theta); step[j] = h
        numeric[j] = (loss(theta + step) - loss(theta - step)) / (2 * h)
    scale = np.maximum(1e-8, np.abs(analytic) + np.abs(numeric))
    return np.max(np.abs(analytic - numeric) / scale)
loss = lambda t: t[0] ** 2 + 3 * t[0] * t[1] + t[1] ** 2
right = lambda t: np.array([2 * t[0] + 3 * t[1], 3 * t[0] + 2 * t[1]])
wrong = lambda t: np.array([2 * t[0] + 3 * t[1], 3 * t[0] + 3 * t[1]])
print('correct gradient, disagreement:', check_gradient(loss, right, [1., 2.]))
print('wrong gradient, disagreement:  ', check_gradient(loss, wrong, [1., 2.]))
assert check_gradient(loss, right, [1., 2.]) < 1e-7 < check_gradient(loss, wrong, [1., 2.])'''),
md(r'''## Part 3: A scalar computational graph
Each node remembers its value, its parents and the local derivative to each parent. `backward` visits nodes in reverse order and multiplies along every path. When a value is used twice, the two paths add.'''),
code(r'''class Node:
    def __init__(self, value, parents=(), local=()):
        self.value, self.parents, self.local, self.grad = value, parents, local, 0.
    @staticmethod
    def wrap(other): return other if isinstance(other, Node) else Node(other)
    def __add__(self, other):
        other = Node.wrap(other); return Node(self.value + other.value, (self, other), (1., 1.))
    def __mul__(self, other):
        other = Node.wrap(other); return Node(self.value * other.value, (self, other), (other.value, self.value))
    __radd__ = __add__; __rmul__ = __mul__
    def __sub__(self, other): return self + (Node.wrap(other) * -1.)
    def square(self): return Node(self.value ** 2, (self,), (2 * self.value,))
    def backward(self):
        order, seen = [], set()
        def visit(node):
            if id(node) not in seen:
                seen.add(id(node))
                for parent in node.parents: visit(parent)
                order.append(node)
        visit(self); self.grad = 1.
        for node in reversed(order):
            for parent, local in zip(node.parents, node.local): parent.grad += local * node.grad
w, b = Node(3.), Node(1.); x, target = 2., 5.
loss = 0.5 * (w * x + b - target).square()
loss.backward()
print('loss:', loss.value, 'dL/dw:', w.grad, 'dL/db:', b.grad)
assert (loss.value, w.grad, b.grad) == (2., 4., 2.)
x, y = Node(1.), Node(2.)
shared = x * x + 3. * x * y
shared.backward()
print('f = x^2 + 3xy, value and gradient:', shared.value, x.grad, y.grad)
assert (x.grad, y.grad) == (8., 3.)'''),
md(r'''## Part 4: Jacobians multiply, and shapes tell you how
`f` maps 2 numbers to 3, and `g` maps 3 numbers to 1. The chain rule multiplies a 1x3 row by a 3x2 Jacobian. Check the product against the checker from Part 2.'''),
code(r'''def f(t): return np.array([t[0] * t[1], t[0] + t[1] ** 2, np.sin(t[0])])
def jacobian(t): return np.array([[t[1], t[0]], [1., 2 * t[1]], [np.cos(t[0]), 0.]])
g = lambda y: float(y @ y)
composite = lambda t: g(f(t))
chain = lambda t: 2 * f(t) @ jacobian(t)
point = np.array([.7, -1.2])
print('Jacobian shape:', jacobian(point).shape, ' gradient shape:', chain(point).shape)
assert check_gradient(composite, chain, point) < 1e-7
hessian = np.array([[2., 3.], [3., 2.]])
print('Hessian of x^2+3xy+y^2 has eigenvalues', np.linalg.eigvalsh(hessian), 'so the origin is a saddle.')
h = np.array([.1, -.05]); quadratic = lambda t: t[0] ** 2 + 3 * t[0] * t[1] + t[1] ** 2
t0 = np.array([1., 2.]); grad0 = right(t0)
taylor = quadratic(t0) + grad0 @ h + .5 * h @ hessian @ h
print('Taylor approximation:', taylor, ' true value:', quadratic(t0 + h))
assert np.isclose(taylor, quadratic(t0 + h))'''),
md(r'''## Your experiment
Add `exp` and `log` nodes to the graph, derive a two-stage expression of your own, and confirm it with `check_gradient`. Then explain, from the table in Part 1, why the checker has a useful range of step sizes rather than a best answer of "as small as possible". Submit your derivation and the verified utility.''')])

write('module-06-noise-and-uncertainty.ipynb',[
md(r'''# Noise and uncertainty · Module 06
Python 3 and NumPy only. Name the assumption behind every estimate. An uncertainty estimate applies to its declared sampling model and cannot reveal failures that were never sampled.'''),
photo_cell(),
code(r'''np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(206)
def posterior(prior, hit=.8, false_alarm=.1):
    return prior * hit / (prior * hit + (1 - prior) * false_alarm)
print('P(object | flag) with prior 0.2:', posterior(.2))
assert np.isclose(posterior(.2), 2 / 3)
for prior in [.5, .2, .05, .01]:
    print(f'prior {prior:5.2f}  posterior {posterior(prior):.3f}')
print('uniform density on [0,1], probability of [0.2, 0.5]:', .5 - .2)
print('the same density at one exact point has height 1 but probability 0.')
values = np.array([0., 2., 4.])
print('mean', values.mean(), 'population variance', values.var())
assert values.var() == (4 + 0 + 4) / 3'''),
md(r'''## Part 2: Noise on one photograph
Make many noisy copies of the same image. These are unclipped floating-point measurements, because clipping would change the noise model. Each pixel's sample variance should be near the true variance, and the variance of an average of N frames should be near sigma squared over N.'''),
code(r'''sigma = 20.
frames = PHOTO + rng.normal(0, sigma, (200, 96, 96))
print('average per-pixel sample variance:', frames.var(axis=0, ddof=1).mean(), ' true variance:', sigma ** 2)
assert abs(frames.var(axis=0, ddof=1).mean() - sigma ** 2) < 10
for n in [1, 4, 16, 64]:
    averaged = frames[:n].mean(axis=0)
    print(f'{n:3d} frames: variance of the error {np.var(averaged - PHOTO):8.2f}, model {sigma ** 2 / n:8.2f}')
assert np.var(frames[:64].mean(axis=0) - PHOTO) < 1.3 * sigma ** 2 / 64'''),
md(r'''## Part 3: Pixels are not independent
Neighbouring pixels in a photograph are strongly correlated, while added sensor noise is not. This is why a thousand pixels are not a thousand independent measurements. Zero covariance is also not independence, as the last line shows.'''),
code(r'''def neighbour_correlation(image):
    return np.corrcoef(image[:, :-1].ravel(), image[:, 1:].ravel())[0, 1]
print('neighbouring pixels in the photo:', neighbour_correlation(PHOTO))
print('neighbouring pixels of pure noise:', neighbour_correlation(rng.normal(0, 1, (96, 96))))
assert neighbour_correlation(PHOTO) > .8
X = np.array([-1., 0., 1.]); Y = X ** 2
print('covariance of X and X^2 on {-1,0,1}:', np.mean((X - X.mean()) * (Y - Y.mean())), 'though Y depends on X.')
covariance = np.cov(np.stack([PHOTO[:, :-1].ravel(), PHOTO[:, 1:].ravel()]))
print('covariance matrix of neighbouring pixels:\n', covariance)'''),
md(r'''## Part 4: How much should a small test set convince you?
Train one nearest-centroid classifier, then measure it on many independent test sets of two sizes. The same model scores differently on each draw. A bootstrap estimates that spread from one test set, under the assumption that test images are independent.'''),
code(r'''def bars(n, noise=.75):
    y = rng.integers(0, 2, n); images = np.zeros((n, 8, 8))
    for i, label in enumerate(y):
        p = int(rng.integers(1, 6))
        if label == 0: images[i, p:p+2, :] = 1.
        else:          images[i, :, p:p+2] = 1.
    return (images + rng.normal(0, noise, images.shape)).reshape(n, -1), y
Xtr, ytr = bars(200)
centers = np.stack([Xtr[ytr == c].mean(axis=0) for c in [0, 1]])
def accuracy(X, y):
    return np.mean(np.sum((X[:, None, :] - centers[None, :, :]) ** 2, axis=2).argmin(axis=1) == y)
for size in [20, 200, 2000]:
    scores = [accuracy(*bars(size)) for _ in range(200 if size < 2000 else 40)]
    print(f'test size {size:5d}: mean accuracy {np.mean(scores):.3f}, spread (std) {np.std(scores):.3f}, range {min(scores):.2f}-{max(scores):.2f}')
Xtest, ytest = bars(100)
correct = (np.sum((Xtest[:, None, :] - centers[None, :, :]) ** 2, axis=2).argmin(axis=1) == ytest).astype(float)
replicates = correct[rng.integers(0, 100, (4000, 100))].mean(axis=1)
low, high = np.quantile(replicates, [.025, .975])
print(f'one test set of 100: accuracy {correct.mean():.2f}, bootstrap interval {low:.2f} to {high:.2f}')
assert low <= correct.mean() <= high
print('3 correct out of 3: the plug-in standard error is', np.sqrt(1 * 0 / 3), 'which is misleading, not reassuring.')'''),
md(r'''## Your experiment
Add correlated noise by blurring the noise before adding it, and show that averaging helps less than sigma squared over N predicts when frames share noise. Then explain why consecutive video frames need a group-based split and a group-based uncertainty estimate. Write down what your intervals assume, and what they cannot cover.''')])

write('module-08-optimization.ipynb',[
md(r'''# Optimization · Module 08
Python 3 and NumPy only. This module comes before the classifier in Module 07, so that training is already familiar when you meet it. The objectives here are ones whose answers you can check: a quadratic and a least-squares fit.'''),
code(r'''import numpy as np
np.set_printoptions(precision=5, suppress=True)
rng = np.random.default_rng(208)
print('L(w) = (w-3)^2, starting at w = 0')
for lr in [.1, .5, .9, 1., 1.1]:
    w = 0.; path = []
    for step in range(6):
        path.append(round(w, 3)); w -= lr * 2 * (w - 3)
    print(f'learning rate {lr:3.1f}: {path}')
w = 0.; w -= .1 * 2 * (w - 3)
assert np.isclose(w, .6)
# Each step multiplies the error by (1 - 2*lr), so this quadratic converges only for 0 < lr < 1.'''),
md(r'''## Part 2: A stretched bowl
With curvatures 1 and kappa, the steep direction limits the learning rate to below 2/kappa, while the shallow direction wants a large step. Momentum builds speed along the shallow direction. Predict both results before running the cell.'''),
code(r'''def run(kappa, lr, beta=0., steps=3000, tol=1e-6):
    curvature = np.array([1., kappa]); x = np.array([1., 1.]); velocity = np.zeros(2)
    for step in range(steps):
        velocity = beta * velocity - lr * curvature * x
        x = x + velocity
        size = np.linalg.norm(x)
        if size < tol: return step + 1
        if size > 1e6: return 'diverged'
    return 'not finished'
for kappa in [1., 10., 100.]:
    print(f'kappa {kappa:5.0f}: lr just below the limit {run(kappa, 1.9 / kappa)}, just above {run(kappa, 2.1 / kappa)}')
assert run(100., 2.1 / 100) == 'diverged'
plain, momentum = run(100., 1 / 100), run(100., 1 / 100, beta=.9)
print('kappa 100, lr 0.01: plain steps', plain, ' with momentum 0.9:', momentum)
assert momentum < plain'''),
md(r'''## Part 3: Recover a filter by least squares
You know filters from Module 09 and least squares from Module 03. Here an unknown 3x3 kernel blurred some images, and you must recover it from input and output pairs. The inputs are smooth, because neighbouring pixels in real images are correlated (Module 06), and that correlation is what stretches this bowl. The Hessian is known exactly, so you can compute the largest stable learning rate rather than guess.'''),
code(r'''truth = np.array([[0.,.2,0.],[.2,.2,.2],[0.,.2,0.]])
noise = rng.normal(0, 1, (30, 18, 18))
images = np.lib.stride_tricks.sliding_window_view(noise, (3, 3), axis=(1, 2)).mean(axis=(3, 4)) * 3
patches = np.lib.stride_tricks.sliding_window_view(images, (3, 3), axis=(1, 2)).reshape(-1, 9)
targets = patches @ truth.ravel() + rng.normal(0, .01, len(patches))
exact = np.linalg.lstsq(patches, targets, rcond=None)[0]
print('samples:', patches.shape, ' recovered kernel:\n', exact.reshape(3, 3).round(3))
loss = lambda w: np.mean((patches @ w - targets) ** 2)
gradient = lambda w, A=patches, b=targets: 2 * A.T @ (A @ w - b) / len(A)
hessian = 2 * patches.T @ patches / len(patches)
curvatures = np.linalg.eigvalsh(hessian)
print('Hessian eigenvalues from', curvatures[0].round(3), 'to', curvatures[-1].round(3), '; all positive, so this objective is convex')
print('condition number, the stretch of the bowl:', (curvatures[-1] / curvatures[0]).round(1))
assert curvatures[0] > 0 and curvatures[-1] / curvatures[0] > 20
limit = 2 / curvatures[-1]
print('largest stable full-batch learning rate:', limit)
def descend(lr, beta=0., steps=300):
    w = np.zeros(9); v = np.zeros(9); curve = []
    for _ in range(steps):
        curve.append(loss(w)); v = beta * v - lr * gradient(w); w = w + v
    return w, curve
print('setting      loss at steps 0, 20, 100, 299      largest error in the kernel')
for name, lr, beta in [('too small', .05 * limit, 0.), ('near limit', .9 * limit, 0.), ('momentum', .25 * limit, .9), ('too large', 1.05 * limit, 0.)]:
    w, curve = descend(lr, beta)
    print(f'{name:10s} {curve[0]:9.4f} {curve[20]:9.4f} {curve[100]:9.5f} {curve[299]:11.4g}   {np.abs(w - exact).max():.3g}')
assert np.abs(descend(.25 * limit, .9)[0] - exact).max() < np.abs(descend(.9 * limit)[0] - exact).max()
assert descend(1.05 * limit)[1][-1] > descend(1.05 * limit)[1][0]'''),
md(r'''## Part 4: Mini-batches and adaptive steps
A mini-batch gradient is a noisy estimate of the full gradient, so the loss jitters while each step stays cheap. Adam scales each coordinate by a running estimate of its gradient size. Compare them on the same data, from the same start, and read the curves rather than only the final number.'''),
code(r'''def minibatch(lr, batch=32, epochs=8):
    w = np.zeros(9); curve = []; generator = np.random.default_rng(1)
    for _ in range(epochs):
        order = generator.permutation(len(patches))
        for start in range(0, len(order), batch):
            chosen = order[start:start + batch]
            w -= lr * gradient(w, patches[chosen], targets[chosen])
        curve.append(loss(w))
    return w, curve
def adam(lr=.02, steps=300, b1=.9, b2=.999):
    w = np.zeros(9); m = np.zeros(9); s = np.zeros(9)
    for t in range(1, steps + 1):
        g = gradient(w); m = b1 * m + (1 - b1) * g; s = b2 * s + (1 - b2) * g * g
        w = w - lr * (m / (1 - b1 ** t)) / (np.sqrt(s / (1 - b2 ** t)) + 1e-8)
    return w
w, curve = minibatch(.4 * limit)
print('mini-batch loss after each epoch:', np.round(curve, 5), ' updates per epoch:', int(np.ceil(len(patches) / 32)))
print('exact least-squares loss:', loss(exact))
assert curve[-1] < 2 * loss(exact)
print('Adam loss after 300 steps:', loss(adam()))
assert loss(adam()) < 10 * loss(exact)'''),
md(r'''## Part 5: A stationary point is not automatically a minimum
A zero gradient says only that the surface is flat there. The Hessian tells you what kind of flat. On a nonconvex function, where you start decides where you finish, so no single run proves a global minimum.'''),
code(r'''f = lambda x: x ** 4 - 3 * x ** 2 + x
df = lambda x: 4 * x ** 3 - 6 * x + 1
d2f = lambda x: 12 * x ** 2 - 6
for start in [-2., 2.]:
    x = start
    for _ in range(200): x -= .01 * df(x)
    print(f'start {start:4.1f} ends at x={x:.4f}, f={f(x):.4f}, gradient {df(x):.2e}, curvature {d2f(x):.2f}')
left, right = -2., 2.
for _ in range(200): left -= .01 * df(left); right -= .01 * df(right)
assert abs(df(left)) < 1e-4 and abs(df(right)) < 1e-4 and f(left) < f(right) - 1'''),
md(r'''## Your experiment
Pick one setting from Part 3 that fails. Say what the loss curve shows, explain the failure from the Hessian, and fix it by changing one thing. Then compare momentum values with everything else fixed. Keep your learning-rate table: in Module 07 you will use it to train a classifier, without guessing.''')])

write('module-07-linear-classifier.ipynb',[
md(r'''# A linear classifier · Module 07
Python 3 and NumPy only. You will train with the gradient descent from Module 08. The task is three classes of small synthetic images, with a nearest-centroid baseline. Keep the test set out of every decision until the procedure is fixed.'''),
code(r'''import numpy as np
np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(207)
def softmax(z):
    shifted = z - z.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)
def cross_entropy(z, y):
    shifted = z - z.max(axis=1, keepdims=True)
    return np.mean(np.log(np.exp(shifted).sum(axis=1)) - shifted[np.arange(len(y)), y])
with np.errstate(over='ignore'): print('exp(1000) alone overflows to', np.exp(1000.))
print('the stable softmax subtracts the largest score first:', softmax(np.array([[1000., 1001.]])))
assert np.allclose(softmax(np.array([[1000., 1001.]])), softmax(np.array([[0., 1.]])))
scores = np.array([[2., 1., 0.]])
print('softmax:', softmax(scores), ' shifted by 5:', softmax(scores + 5))
assert np.allclose(softmax(scores), softmax(scores + 5))
print('loss when the true class gets 0.8:', -np.log(.8), ' when it gets 0.01:', -np.log(.01))
print('Gaussian residuals give squared error: NLL = (y-f)^2/(2 s^2) + constant, so minimizing one minimizes the other.')'''),
md(r'''## Part 2: Data and a protocol, declared first
Three classes: horizontal bar, vertical bar and diagonal. The split is fixed once. Standardization statistics come from training data only. The comparison is nearest centroid against softmax regression, and test accuracy is read once at the end.'''),
code(r'''CLASSES = ['horizontal', 'vertical', 'diagonal']
def make_images(n, noise=.7):
    y = rng.integers(0, 3, n); images = np.zeros((n, 8, 8))
    for i, label in enumerate(y):
        p = int(rng.integers(1, 6))
        if label == 0: images[i, p:p+2, :] = 1.
        elif label == 1: images[i, :, p:p+2] = 1.
        else: images[i, np.arange(8), (np.arange(8) + p) % 8] = 1.5
    return (images + rng.normal(0, noise, images.shape)).reshape(n, -1), y
X, y = make_images(600)
Xtr, Xval, Xtest = X[:360], X[360:480], X[480:]; ytr, yval, ytest = y[:360], y[360:480], y[480:]
mu, scale = Xtr.mean(axis=0), Xtr.std(axis=0)
Str, Sval, Stest = (Xtr - mu) / scale, (Xval - mu) / scale, (Xtest - mu) / scale
centers = np.stack([Str[ytr == c].mean(axis=0) for c in range(3)])
def centroid_predict(S): return np.sum((S[:, None, :] - centers[None, :, :]) ** 2, axis=2).argmin(axis=1)
print('sizes:', Str.shape, Sval.shape, Stest.shape)
print('nearest-centroid validation accuracy:', np.mean(centroid_predict(Sval) == yval))'''),
md(r'''## Part 3: Softmax regression, gradient checked before training
With row-stored examples, `logits = S @ W + b`, and the gradient comes from (P - Y). A check first, training second. Read the learning curve as you did in Module 08.'''),
code(r'''def logits(S, W, b): return S @ W + b
def loss_grad(S, y, W, b, weight_decay=0.):
    z = logits(S, W, b); G = (softmax(z) - np.eye(3)[y]) / len(y)
    return cross_entropy(z, y) + .5 * weight_decay * np.sum(W ** 2), S.T @ G + weight_decay * W, G.sum(axis=0)
W = rng.normal(0, .01, (64, 3)); b = np.zeros(3)
_, dW, db = loss_grad(Str[:8], ytr[:8], W, b, .1)
for index in [(0, 0), (17, 2), (40, 1)]:
    plus = W.copy(); plus[index] += 1e-5; minus = W.copy(); minus[index] -= 1e-5
    numeric = (loss_grad(Str[:8], ytr[:8], plus, b, .1)[0] - loss_grad(Str[:8], ytr[:8], minus, b, .1)[0]) / 2e-5
    print('gradient check at', index, 'error', abs(numeric - dW[index]))
    assert abs(numeric - dW[index]) < 1e-7
def train(weight_decay=0., lr=.1, steps=400):
    W = np.zeros((64, 3)); b = np.zeros(3); history = []
    for step in range(steps):
        loss, dW, db = loss_grad(Str, ytr, W, b, weight_decay)
        W -= lr * dW; b -= lr * db
        if step % 100 == 0: history.append(round(float(loss), 4))
    return W, b, history
W, b, history = train()
print('training loss every 100 steps:', history)
assert history[-1] < history[0]
print('softmax-regression validation accuracy:', np.mean(logits(Sval, W, b).argmax(axis=1) == yval))'''),
md(r'''## Part 4: Choose a penalty on validation data
A squared penalty is the Gaussian prior of Lesson 26. Compare a few values and choose by validation loss, which sees confidence as well as correctness.'''),
code(r'''choices = [0., 1e-3, 1e-2, 1e-1, 1.]; scores = []
for penalty in choices:
    Wp, bp, _ = train(penalty)
    scores.append(cross_entropy(logits(Sval, Wp, bp), yval))
    print(f'penalty {penalty:<6} validation NLL {scores[-1]:.4f}  accuracy {np.mean(logits(Sval, Wp, bp).argmax(axis=1) == yval):.3f}  weight norm {np.linalg.norm(Wp):.2f}')
best = choices[int(np.argmin(scores))]
print('selected penalty:', best)
W, b, _ = train(best)'''),
md(r'''## Part 5: Test once, then look at the errors
The procedure is now fixed. A confusion matrix shows which classes are mixed up, which a single accuracy hides. Confidence is not correctness, so compare the two by bins: this is a calibration check.'''),
code(r'''z = logits(Stest, W, b); predicted = z.argmax(axis=1)
print('test count:', len(ytest))
print('nearest-centroid test accuracy:', np.mean(centroid_predict(Stest) == ytest))
print('softmax test accuracy:', np.mean(predicted == ytest), ' test NLL:', cross_entropy(z, ytest))
confusion = np.zeros((3, 3), dtype=int); np.add.at(confusion, (ytest, predicted), 1)
print('rows = true, columns = predicted', CLASSES); print(confusion)
assert confusion.sum() == len(ytest)
confidence = softmax(z).max(axis=1); correct = predicted == ytest
for low, high in [(0., .6), (.6, .8), (.8, .95), (.95, 1.01)]:
    members = (confidence >= low) & (confidence < high)
    if members.any():
        print(f'confidence {low:.2f}-{min(high, 1):.2f}: n={members.sum():3d}  mean confidence {confidence[members].mean():.3f}  accuracy {correct[members].mean():.3f}')
wrong = np.where(~correct)[0]
if len(wrong):
    worst = wrong[confidence[wrong].argmax()]
    print('most confident mistake: true', CLASSES[ytest[worst]], 'predicted', CLASSES[predicted[worst]], 'confidence', confidence[worst].round(3))'''),
md(r'''## Your experiment
Spot two ways leakage could enter this notebook, and show the effect of one of them. Then change one thing, such as adding a fourth class or raising the noise, and explain the change with the confusion matrix. Use a fresh test set for a revised procedure. Submit the baseline, losses, confusion matrix and your split protocol.''')])

write('module-10-backprop-from-scratch.ipynb',[
md(r'''# Backpropagation from scratch · Module 10
Python 3 and NumPy only. Derive the equations of Lesson 38 first. The task is an image version of XOR that no linear boundary can solve, so the need for a hidden layer is visible rather than asserted. It teaches mechanics and is not a real-image benchmark.'''),
code(r'''import numpy as np
np.set_printoptions(precision=5, suppress=True)
rng = np.random.default_rng(210)
def softmax(z):
    shifted = z - z.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)
def cross_entropy(z, y):
    shifted = z - z.max(axis=1, keepdims=True)
    return np.mean(np.log(np.exp(shifted).sum(axis=1)) - shifted[np.arange(len(y)), y])
A = rng.normal(0, 1, (3, 4)); B = rng.normal(0, 1, (4, 2)); x = rng.normal(0, 1, (5, 3))
assert np.allclose((x @ A) @ B, x @ (A @ B))
print('two linear layers equal one linear layer, shape', (A @ B).shape, ': stacking alone adds nothing.')
def two_bars(n, noise=.15):
    top, left = rng.integers(0, 2, n), rng.integers(0, 2, n); images = np.zeros((n, 8, 8))
    images[top == 1, 1:3, :] += 1.
    images[left == 1, :, 1:3] += 1.
    return (images + rng.normal(0, noise, images.shape)).reshape(n, -1), (top != left).astype(int)
X, y = two_bars(480)
Xtr, Xval, Xtest = X[:300], X[300:390], X[390:]; ytr, yval, ytest = y[:300], y[300:390], y[390:]
mu, scale = Xtr.mean(axis=0), Xtr.std(axis=0) + 1e-8
Xtr, Xval, Xtest = (Xtr - mu) / scale, (Xval - mu) / scale, (Xtest - mu) / scale
print('label is 1 when exactly one bar is present. Shapes:', Xtr.shape, ytr.shape)'''),
md(r'''## Part 2: The linear baseline, and why it fails
With one bar the label is 1, and with both bars it returns to 0, so no single weight on "top bar present" can be right. Run the same softmax regression you built in Module 07 before adding anything else.'''),
code(r'''W = np.zeros((64, 2)); b = np.zeros(2); Y = np.eye(2)[ytr]
for _ in range(800):
    z = Xtr @ W + b; G = (softmax(z) - Y) / len(ytr)
    W -= .1 * Xtr.T @ G; b -= .1 * G.sum(axis=0)
linear_val = np.mean((Xval @ W + b).argmax(axis=1) == yval)
print('linear training loss:', cross_entropy(Xtr @ W + b, ytr), ' validation accuracy:', linear_val)
assert linear_val < .75'''),
md(r'''## Part 3: Every backward equation, then a check
Write the shape of each array on paper: X (N,D), W1 (D,H), A1 (N,H), W2 (H,C), logits (N,C). All gradients are computed from the same forward pass, before any update. ReLU at exactly zero uses derivative zero by convention.'''),
code(r'''def init(hidden=32, seed=3):
    generator = np.random.default_rng(seed)
    return {'W1': generator.normal(0, .25, (64, hidden)), 'b1': np.full(hidden, .1),
            'W2': generator.normal(0, .25, (hidden, 2)), 'b2': np.zeros(2)}
def forward(X, p):
    Z1 = X @ p['W1'] + p['b1']; A1 = np.maximum(0, Z1)
    return Z1, A1, A1 @ p['W2'] + p['b2']
def loss_grad(X, y, p, weight_decay=0.):
    Z1, A1, logits = forward(X, p)
    G2 = (softmax(logits) - np.eye(2)[y]) / len(y)
    G1 = (G2 @ p['W2'].T) * (Z1 > 0)
    grads = {'W2': A1.T @ G2 + weight_decay * p['W2'], 'b2': G2.sum(axis=0),
             'W1': X.T @ G1 + weight_decay * p['W1'], 'b1': G1.sum(axis=0)}
    return cross_entropy(logits, y) + .5 * weight_decay * (np.sum(p['W1'] ** 2) + np.sum(p['W2'] ** 2)), grads
p = init(); analytic = loss_grad(Xtr[:8], ytr[:8], p, .01)[1]
for name, index in [('W1', (0, 0)), ('W1', (30, 4)), ('b1', (2,)), ('W2', (3, 1)), ('b2', (0,))]:
    value = p[name][index]; h = 1e-5
    p[name][index] = value + h; plus = loss_grad(Xtr[:8], ytr[:8], p, .01)[0]
    p[name][index] = value - h; minus = loss_grad(Xtr[:8], ytr[:8], p, .01)[0]
    p[name][index] = value
    error = abs((plus - minus) / (2 * h) - analytic[name][index])
    print('gradient check', name, index, 'error', error)
    assert error < 1e-6'''),
md(r'''## Part 4: Overfit a tiny subset first
A network that cannot memorize eight examples has a bug, so this is a fast debugging check. Then train on everything with mini-batch SGD, recording training and validation evidence.'''),
code(r'''p = init()
for step in range(500):
    _, grads = loss_grad(Xtr[:8], ytr[:8], p)
    for name in p: p[name] -= .3 * grads[name]
tiny = loss_grad(Xtr[:8], ytr[:8], p)[0]
print('loss on 8 memorized examples:', tiny)
assert tiny < .05
p = init(); generator = np.random.default_rng(5); history = []
for epoch in range(80):
    order = generator.permutation(len(Xtr))
    for start in range(0, len(order), 32):
        chosen = order[start:start + 32]
        _, grads = loss_grad(Xtr[chosen], ytr[chosen], p, 1e-4)
        for name in p: p[name] -= .1 * grads[name]
    if epoch % 20 == 0:
        history.append((epoch, round(float(loss_grad(Xtr, ytr, p)[0]), 4), round(float(np.mean(forward(Xval, p)[2].argmax(axis=1) == yval)), 3)))
print('(epoch, training loss, validation accuracy):', history)
mlp_val = np.mean(forward(Xval, p)[2].argmax(axis=1) == yval)
print('validation accuracy, linear:', linear_val, ' MLP:', mlp_val)
assert mlp_val > linear_val + .15
print('fixed procedure, test accuracy:', np.mean(forward(Xtest, p)[2].argmax(axis=1) == ytest), ' test count:', len(ytest))'''),
md(r'''## Part 5: Why initialization matters (Lesson 32)
Give two hidden units identical weights and they receive identical gradients, so they stay copies forever. Then watch signal variance: if weights are too large it grows with depth, and if too small it dies. Scaling variance by one over the fan-in keeps it steady.'''),
code(r'''q = init(hidden=2); q['W1'][:, 1] = q['W1'][:, 0]; q['W2'][1] = q['W2'][0]; q['b1'][:] = .1
for step in range(50):
    _, grads = loss_grad(Xtr[:32], ytr[:32], q)
    for name in q: q[name] -= .1 * grads[name]
assert np.allclose(q['W1'][:, 0], q['W1'][:, 1])
print('after 50 steps the two hidden units are still identical.')
def variance_through_depth(weight_std, depth=10, fan_in=256):
    x = rng.normal(0, 1, (400, fan_in))
    for layer in range(depth):
        x = x @ rng.normal(0, weight_std, (fan_in, fan_in))
    return x.var()
for name, std in [('too small', .5 / 256 ** .5), ('scaled by fan-in', 1 / 256 ** .5), ('too large', 2 / 256 ** .5)]:
    print(f'{name:18s} output variance after 10 layers: {variance_through_depth(std):.3g}')
assert variance_through_depth(.5 / 256 ** .5) < .01 < 100 < variance_through_depth(2 / 256 ** .5)'''),
md(r'''## Part 6: Convolution shapes and receptive fields (Lesson 35)
Now that you know layers, count them. Check the output-size formula against a direct count of kernel positions. Then see why stacking small kernels with stride widens the view quickly. A fully connected layer on the same image needs far more weights, because a convolution shares its kernel across positions.'''),
code(r'''def output_size(n, kernel, padding, stride): return (n + 2 * padding - kernel) // stride + 1
def count_positions(n, kernel, padding, stride): return len(range(0, n + 2 * padding - kernel + 1, stride))
for n, k, pad, s in [(7, 3, 1, 2), (32, 3, 1, 1), (32, 5, 2, 2), (28, 2, 0, 2)]:
    assert output_size(n, k, pad, s) == count_positions(n, k, pad, s)
    print(f'input {n}, kernel {k}, padding {pad}, stride {s}: output {output_size(n, k, pad, s)}')
def parameters(kernel, channels_in, channels_out): return kernel * kernel * channels_in * channels_out + channels_out
print('3x3 layer, 3 to 8 channels:', parameters(3, 3, 8), 'parameters')
print('fully connected from a 32x32x3 image to 8 outputs:', 32 * 32 * 3 * 8 + 8, 'parameters')
assert parameters(3, 3, 8) == 224
def receptive_field(layers):
    r, j = 1, 1
    for kernel, stride in layers:
        r += (kernel - 1) * j; j *= stride
    return r, j
print('(receptive field, jump) for three 3x3 stride-1 layers:', receptive_field([(3, 1)] * 3))
print('for four 3x3 stride-2 layers:', receptive_field([(3, 2)] * 4))
assert receptive_field([(3, 1)] * 3) == (7, 1)'''),
md(r'''## Your experiment
Remove the ReLU and predict the validation accuracy before you run it. Then declare one comparison on a fresh held-out split: learning rate, hidden size or weight decay. Change one factor at a time and report the settings that failed. Your training report should include your gradient checks and explain why this result says nothing about real images. Practical Lab 04 is the next step.''')])

write('module-11-detection-and-segmentation.ipynb',[
md(r'''# Recognition, detection and segmentation · Module 11
Python 3 and NumPy only. Each part follows a lesson in this module: a CNN and transfer learning (41), attention and residual connections (55), boxes (42), masks (43), metrics (44) and multi-scale features (56). Tasks are small and synthetic so that the mechanics stay visible. Practical Labs 04-08 repeat these ideas on real images.'''),
code(r'''import numpy as np
np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(211)
def softmax(z):
    shifted = z - z.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)
def cross_entropy(z, y):
    shifted = z - z.max(axis=1, keepdims=True)
    return np.mean(np.log(np.exp(shifted).sum(axis=1)) - shifted[np.arange(len(y)), y])
def make_bars(n, noise=.1):
    y = rng.integers(0, 2, n); images = np.zeros((n, 8, 8))
    for i, label in enumerate(y):
        p = int(rng.integers(1, 6))
        if label == 0: images[i, p:p+2, :] = 1
        else:          images[i, :, p:p+2] = 1
    return images + rng.normal(0, noise, images.shape), y
def patches(X): return np.lib.stride_tricks.sliding_window_view(X, (3, 3), axis=(1, 2)).reshape(len(X), 6, 6, 9)
X, y = make_bars(240)
Ptr, Pval, Ptest = patches(X[:160]), patches(X[160:200]), patches(X[200:])
ytr, yval, ytest = y[:160], y[160:200], y[200:]
parameters = {'K': rng.normal(0, .25, (9, 4)), 'bc': np.zeros(4), 'W': rng.normal(0, .05, (144, 2)), 'b': np.zeros(2)}
def cnn(P, p):
    Z = np.einsum('nijk,kf->nijf', P, p['K']) + p['bc']
    A = np.maximum(0, Z).reshape(len(P), -1)
    return Z, A, A @ p['W'] + p['b']
def loss_grad(P, y, p):
    Z, A, logits = cnn(P, p)
    G = (softmax(logits) - np.eye(2)[y]) / len(y)
    Gconv = (G @ p['W'].T).reshape(Z.shape) * (Z > 0)
    return cross_entropy(logits, y), {'W': A.T @ G, 'b': G.sum(axis=0), 'K': np.einsum('nijk,nijf->kf', P, Gconv), 'bc': Gconv.sum(axis=(0, 1, 2))}
print('trainable parameters:', sum(v.size for v in parameters.values()))
assert sum(v.size for v in parameters.values()) == 330'''),
md(r'''## Part 1: A shared-kernel derivative, then training
The kernel gradient accumulates contributions over the batch and over every placement. Check selected coordinates before training, as you did for the MLP.'''),
code(r'''analytic = loss_grad(Ptr[:4], ytr[:4], parameters)[1]
for name, index in [('K', (1, 2)), ('bc', (1,)), ('W', (17, 0)), ('b', (0,))]:
    value = parameters[name][index]; h = 1e-5
    parameters[name][index] = value + h; plus = loss_grad(Ptr[:4], ytr[:4], parameters)[0]
    parameters[name][index] = value - h; minus = loss_grad(Ptr[:4], ytr[:4], parameters)[0]
    parameters[name][index] = value
    error = abs((plus - minus) / (2 * h) - analytic[name][index])
    print('CNN gradient check:', name, index, error)
    assert error < 1e-6
initial = loss_grad(Ptr, ytr, parameters)[0]
for step in range(300):
    _, grads = loss_grad(Ptr, ytr, parameters)
    for name in parameters: parameters[name] -= .1 * grads[name]
final = loss_grad(Ptr, ytr, parameters)[0]
assert final < initial
print('training loss:', initial, 'to', final, ' validation accuracy:', np.mean(cnn(Pval, parameters)[2].argmax(axis=1) == yval))
print('fixed procedure, test accuracy:', np.mean(cnn(Ptest, parameters)[2].argmax(axis=1) == ytest), ' N:', len(ytest))'''),
md(r'''## Part 2: Transfer learning, and when it helps
Train a small pooled CNN on plenty of clean bars. Then reuse its kernels, frozen, for a new task with only 6 labelled images, so that only a tiny head trains. Compare that with training everything from those same 6 images. Two new tasks test the idea from both sides: one shares the old features, and one needs something else. The numbers are averages over 12 random draws of the labelled images. Practical Lab 05 repeats this with ResNet18, a far deeper network with far more to reuse.'''),
code(r'''def windows(X): return np.lib.stride_tricks.sliding_window_view(X, (3, 3), axis=(1, 2)).reshape(len(X), 36, 9)
def pooled(P, K, c): return np.maximum(0, P @ K + c).mean(axis=1)
def train_pooled(P, y, generator, steps, lr=1., kernels=4):
    K = generator.normal(0, .3, (9, kernels)); c = np.zeros(kernels); W = generator.normal(0, .05, (kernels, 2)); b = np.zeros(2); Y = np.eye(2)[y]
    for _ in range(steps):
        Z = P @ K + c; A = np.maximum(0, Z); F = A.mean(axis=1)
        G = (softmax(F @ W + b) - Y) / len(P); Gc = (G @ W.T)[:, None, :] * (Z > 0) / 36
        K -= lr * np.einsum('npk,npf->kf', P, Gc); c -= lr * Gc.sum(axis=(0, 1)); W -= lr * F.T @ G; b -= lr * G.sum(axis=0)
    return K, c, W, b
def fit_head(K, c, Ps, ys, steps=500, lr=2.):
    """Only the head changes here: K and c are frozen."""
    F = pooled(Ps, K, c); mu, sd = F.mean(axis=0), F.std(axis=0) + 1e-8
    A = (F - mu) / sd; W = np.zeros((K.shape[1], 2)); b = np.zeros(2); Y = np.eye(2)[ys]
    for _ in range(steps):
        G = (softmax(A @ W + b) - Y) / len(A)
        W -= lr * (A.T @ G + .02 * W); b -= lr * G.sum(axis=0)
    return lambda P: ((pooled(P, K, c) - mu) / sd) @ W + b
def bars_task(generator, n, noise):
    images = np.zeros((n, 8, 8)); y = generator.integers(0, 2, n)
    for i, label in enumerate(y):
        p = int(generator.integers(1, 6))
        if label == 0: images[i, p:p+2, :] = 1
        else:          images[i, :, p:p+2] = 1
    return images + generator.normal(0, noise, images.shape), y
def cross_task(generator, n, noise):
    """A different question: one bar, or a cross made of two?"""
    images = np.zeros((n, 8, 8)); y = generator.integers(0, 2, n)
    for i, label in enumerate(y):
        a, b = generator.integers(1, 6, 2)
        if label == 1: images[i, a:a+2, :] = 1; images[i, :, b:b+2] = 1
        elif generator.random() < .5: images[i, a:a+2, :] = 1
        else: images[i, :, b:b+2] = 1
    return images + generator.normal(0, noise, images.shape), y
source = np.random.default_rng(1); Xsrc, ysrc = bars_task(source, 300, .3)
K, c, _, _ = train_pooled(windows(Xsrc), ysrc, source, 500)
frozen = K.copy()
compare = {}
for name, task, noise in [('shares the old features: bars in heavy noise', bars_task, .9), ('needs something else: bar or cross', cross_task, .3)]:
    reused, scratch = [], []
    for trial in range(12):
        generator = np.random.default_rng(900 + trial); X, y = task(generator, 206, noise)
        Ps, Pt, ys, yt = windows(X[:6]), windows(X[6:]), y[:6], y[6:]
        if len(set(ys)) < 2: continue
        reused.append(np.mean(fit_head(K, c, Ps, ys)(Pt).argmax(axis=1) == yt))
        k2, c2, w2, b2 = train_pooled(Ps, ys, generator, 400)
        scratch.append(np.mean((pooled(Pt, k2, c2) @ w2 + b2).argmax(axis=1) == yt))
    compare[name] = np.mean(reused), np.mean(scratch)
    print(f'{name:46s} frozen pretrained {compare[name][0]:.3f}   trained from scratch {compare[name][1]:.3f}')
assert np.array_equal(frozen, K)
print('head parameters updated:', 4 * 2 + 2, 'of', K.size + c.size + 4 * 2 + 2)
same, other = compare.values()
assert same[0] > same[1] and other[0] < other[1]'''),
md(r'''Read those two rows carefully. Reusing features helps when the new task shares them, and it can hurt when the task needs something else, because frozen kernels cannot adapt. "Pretrained" is not automatically better, so compare it on your own split.'''),
md(r'''## Part 3: One attention head, and a residual connection
Attention scores are dot products, softmaxed along each row, then used to average the values. Dividing by the square root of d keeps scores at a sensible scale. A shuffle check shows why positional information has to be added separately. Then compare gradients through 20 layers with and without residual connections.'''),
code(r'''def attention(Q, K, V):
    scores = Q @ K.T / np.sqrt(Q.shape[1])
    weights = softmax(scores)
    return weights @ V, weights
d = 4; tokens = rng.normal(0, 1, (6, 16))
WQ, WK, WV = rng.normal(0, 1, (3, 16, d)) / 4
Q, K, V = tokens @ WQ, tokens @ WK, tokens @ WV
output, weights = attention(Q, K, V)
print('tokens', tokens.shape, ' attention weights', weights.shape, ' output', output.shape)
assert np.allclose(weights.sum(axis=1), 1)
order = rng.permutation(6)
assert np.allclose(attention(Q[order], K[order], V[order])[0], output[order])
print('shuffling tokens only shuffles outputs: without position, attention sees a set.')
q = np.array([[1., 0., 2., 1.]]); k = np.array([[2., 0., 0., 0.], [0., 1., 1., 1.]]); v = np.array([[4.], [-2.]])
print('hand-checkable row: weights', attention(q, k, v)[1], ' output', attention(q, k, v)[0])
slopes = rng.uniform(-.6, .6, 20)
plain, residual = np.prod(slopes), np.prod(1 + slopes)
print('gradient through 20 plain layers:', plain, ' through 20 residual layers:', residual)
assert abs(residual) > 1e3 * abs(plain)'''),
md(r'''## Part 4: Boxes, IoU and non-maximum suppression
Predict one box with a linear model, and compare it with always guessing the average box: a baseline that shows whether the model has learned anything about position. Then remove duplicate detections with NMS. Boxes use continuous boundary coordinates, without a +1.'''),
code(r'''def box_iou(a, b):
    left = np.maximum(a[..., :2], b[..., :2]); right = np.minimum(a[..., 2:], b[..., 2:])
    intersection = np.prod(np.maximum(0, right - left), axis=-1)
    union = np.prod(a[..., 2:] - a[..., :2], axis=-1) + np.prod(b[..., 2:] - b[..., :2], axis=-1) - intersection
    return np.where(union > 0, intersection / np.maximum(union, 1e-12), 0.)
assert np.isclose(box_iou(np.array([0., 0., 2., 2.]), np.array([1., 1., 3., 3.])), 1 / 7)
def scene(n, size=16):
    images = np.zeros((n, size, size)); boxes = np.zeros((n, 4))
    for i in range(n):
        h, w = rng.integers(4, 9, 2); top, left = rng.integers(0, size - h + 1), rng.integers(0, size - w + 1)
        images[i, top:top+h, left:left+w] = 1; boxes[i] = [left, top, left + w, top + h]
    return (images + rng.normal(0, .1, images.shape)).reshape(n, -1), boxes
Xb, boxes = scene(500)
design = np.c_[Xb, np.ones(len(Xb))]
ridge = np.linalg.solve(design[:400].T @ design[:400] + np.eye(design.shape[1]), design[:400].T @ boxes[:400])
predicted = design[400:] @ ridge
average = np.tile(boxes[:400].mean(axis=0), (100, 1))
print('mean IoU, always the average box:', box_iou(average, boxes[400:]).mean())
print('mean IoU, linear box regression: ', box_iou(predicted, boxes[400:]).mean())
assert box_iou(predicted, boxes[400:]).mean() > box_iou(average, boxes[400:]).mean() + .2
def nms(boxes, scores, threshold=.5):
    order = list(np.argsort(scores)[::-1]); keep = []
    while order:
        best = order.pop(0); keep.append(int(best))
        order = [i for i in order if box_iou(boxes[best], boxes[i]) < threshold]
    return keep
detections = np.array([[0., 0., 4., 4.], [.3, .2, 4.2, 4.1], [8., 8., 12., 12.], [.5, 0., 4.5, 4.]])
print('NMS keeps boxes', nms(detections, np.array([.9, .8, .7, .6])))
assert nms(detections, np.array([.9, .8, .7, .6])) == [0, 2]'''),
md(r'''## Part 5: Masks, precision and recall
One scalar logit per pixel models bright synthetic foreground, which is deliberately simpler than an encoder-decoder. Compare it with the all-background baseline: accuracy flatters that baseline, and IoU does not. The AP here is a noninterpolated toy AP at one matching threshold, not COCO AP.'''),
code(r'''def rectangles(n):
    masks = np.zeros((n, 16, 16), dtype=bool)
    for i in range(n):
        top, left = rng.integers(0, 12, 2); height, width = rng.integers(2, 5, 2)
        masks[i, top:top+height, left:left+width] = True
    return .8 * masks + rng.normal(0, .12, masks.shape), masks
observed, masks = rectangles(140)
train, test, ttr, ttest = observed[:100], observed[100:], masks[:100], masks[100:]
a, bias = 1., 0.
for _ in range(500):
    z = a * train + bias; p = 1 / (1 + np.exp(-z)); residual = p - ttr
    a -= .8 * np.mean(residual * train); bias -= .8 * np.mean(residual)
def mask_metrics(pred, true):
    tp = np.sum(pred & true); fp = np.sum(pred & ~true); fn = np.sum(~pred & true)
    return dict(accuracy=round(float(np.mean(pred == true)), 3), iou=round(float(tp / (tp + fp + fn)) if tp + fp + fn else 0., 3), dice=round(float(2 * tp / (2 * tp + fp + fn)) if tp + fp + fn else 0., 3))
print('foreground share of pixels:', ttest.mean().round(3))
print('all background:', mask_metrics(np.zeros_like(ttest), ttest))
print('learned pixels:', mask_metrics(a * test + bias >= 0, ttest))
assert mask_metrics(np.zeros_like(ttest), ttest)['accuracy'] > .85 and mask_metrics(np.zeros_like(ttest), ttest)['iou'] == 0
assert mask_metrics(a * test + bias >= 0, ttest)['iou'] > .5
tp = np.array([1, 0, 1]); precision = np.cumsum(tp) / np.arange(1, 4); ap = precision[tp == 1].sum() / 2
assert np.isclose(ap, 5 / 6)
print('ranked precision:', precision, ' toy AP:', ap)'''),
md(r'''## Part 6: Multi-scale features
A Laplacian pyramid stores what each coarser level loses, so it rebuilds the image exactly. That is the idea behind a U-Net skip connection: coarse context alone loses fine detail, and the skip brings it back. The FPN rule then assigns each box to the level whose stride suits its size.'''),
code(r'''def down(x): return (x[::2, ::2] + x[1::2, ::2] + x[::2, 1::2] + x[1::2, 1::2]) / 4
def up(x): return np.repeat(np.repeat(x, 2, axis=0), 2, axis=1)
image = np.zeros((32, 32)); image[10:22, 14:16] = 1.; image[4:8, 4:28] = .5
levels = [image]
for _ in range(3): levels.append(down(levels[-1]))
laplacian = [levels[i] - up(levels[i + 1]) for i in range(3)]
rebuilt = levels[-1]
for detail in reversed(laplacian): rebuilt = up(rebuilt) + detail
print('pixels at each level:', [level.size for level in levels])
print('reconstruction error with every level:', np.abs(rebuilt - image).max())
assert np.allclose(rebuilt, image)
coarse_only = up(up(up(levels[-1])))
print('error using coarse context alone (no skips):', np.abs(coarse_only - image).max())
def fpn_level(w, h): return int(np.clip(np.floor(4 + np.log2(np.sqrt(w * h) / 224)), 2, 5))
for side in [32, 96, 224, 448, 900]:
    print(f'box {side}x{side}: level P{fpn_level(side, side)}')
assert fpn_level(96, 96) == 2 and fpn_level(224, 224) == 4'''),
md(r'''## Your experiment
Declare one comparison before you run it: change bar noise, kernel count, the number of labelled images in Part 2 or the rectangle contrast. Keep target transformations aligned with input transformations. Use fresh held-out data for a revised procedure, and report coordinates, counts and metric conventions. Then move to Practical Labs 04-08, where the same ideas meet real images.''')])

write('module-12-capstone-starter.ipynb',[
md(r'''# Capstone starter · Module 12
Python 3 and NumPy only. The capstone is Practical Lab 12, on data you can inspect. If you have no local Python environment for that lab, this notebook is the alternative route: a complete controlled experiment that you can change into your own. Either way, use the capstone template for your report.

The question below is only an example. Replace it, and write your hypothesis before you run anything.'''),
md(r'''## Part 1: Declare the protocol
Everything that defines the experiment sits in one place, and the same seeds drive both models. The hypothesis: a small CNN beats softmax regression when bars shift to new positions, because its kernels are shared across positions. It would be contradicted by an interval on the difference that sits at or below zero.'''),
code(r'''import numpy as np
np.set_printoptions(precision=4, suppress=True)
PROTOCOL = dict(question='Does a small CNN beat softmax regression on shifted bars?',
                sizes=(160, 40, 200), noise=.35, train_positions=(1, 4), shifted_positions=(4, 6),
                seeds=[11, 12, 13, 14, 15], steps=300, lr=.4, primary_metric='accuracy on the shifted set')
for key, value in PROTOCOL.items(): print(f'{key:18s} {value}')
def bars(rng, n, positions):
    y = rng.integers(0, 2, n); images = np.zeros((n, 8, 8))
    for i, label in enumerate(y):
        p = int(rng.integers(*positions))
        if label == 0: images[i, p:p+2, :] = 1
        else:          images[i, :, p:p+2] = 1
    return images + rng.normal(0, PROTOCOL['noise'], images.shape), y
def softmax(z):
    shifted = z - z.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)
def nll(z, y):
    shifted = z - z.max(axis=1, keepdims=True)
    return float(np.mean(np.log(np.exp(shifted).sum(axis=1)) - shifted[np.arange(len(y)), y]))'''),
md(r'''## Part 2: Two models, one training budget
The baseline is transparent, and the improvement changes one thing: shared local kernels with pooling. Both get the same split, seed, steps and learning rate. Training-only statistics are computed inside `run_once`, so nothing leaks.'''),
code(r'''def train_linear(Xtr, ytr, steps, lr):
    mu, scale = Xtr.reshape(len(Xtr), -1).mean(axis=0), Xtr.reshape(len(Xtr), -1).std(axis=0) + 1e-8
    prepare = lambda X: (X.reshape(len(X), -1) - mu) / scale
    S = prepare(Xtr); W = np.zeros((64, 2)); b = np.zeros(2); Y = np.eye(2)[ytr]
    for _ in range(steps):
        G = (softmax(S @ W + b) - Y) / len(S)
        W -= lr * S.T @ G; b -= lr * G.sum(axis=0)
    return lambda X: prepare(X) @ W + b
def windows(X): return np.lib.stride_tricks.sliding_window_view(X, (3, 3), axis=(1, 2)).reshape(len(X), 36, 9)
def cnn_forward(P, p):
    Z = P @ p['K'] + p['bc']; A = np.maximum(0, Z)
    return Z, A, A.mean(axis=1) @ p['W'] + p['b']          # global average pooling
def cnn_loss_grad(P, y, p):
    Z, A, logits = cnn_forward(P, p)
    G = (softmax(logits) - np.eye(2)[y]) / len(P)
    Gc = (G @ p['W'].T)[:, None, :] * (Z > 0) / Z.shape[1]
    return nll(logits, y), {'K': np.einsum('npk,npf->kf', P, Gc), 'bc': Gc.sum(axis=(0, 1)), 'W': A.mean(axis=1).T @ G, 'b': G.sum(axis=0)}
def cnn_init(seed, kernels=6):
    rng = np.random.default_rng(seed)
    return {'K': rng.normal(0, .3, (9, kernels)), 'bc': np.zeros(kernels), 'W': rng.normal(0, .05, (kernels, 2)), 'b': np.zeros(2)}
def train_cnn(Xtr, ytr, steps, lr, seed):
    P = windows(Xtr); p = cnn_init(seed)
    for _ in range(steps):
        _, grads = cnn_loss_grad(P, ytr, p)
        for name in p: p[name] -= lr * grads[name]
    return lambda X: cnn_forward(windows(X), p)[2]
# Trust the improvement only after its gradients pass the check from Module 05.
Xcheck, ycheck = bars(np.random.default_rng(0), 8, PROTOCOL['train_positions'])
Pcheck = windows(Xcheck); p = cnn_init(0); analytic = cnn_loss_grad(Pcheck, ycheck, p)[1]
for name, index in [('K', (1, 2)), ('bc', (3,)), ('W', (2, 1)), ('b', (0,))]:
    value = p[name][index]; h = 1e-5
    p[name][index] = value + h; plus = cnn_loss_grad(Pcheck, ycheck, p)[0]
    p[name][index] = value - h; minus = cnn_loss_grad(Pcheck, ycheck, p)[0]
    p[name][index] = value
    assert abs((plus - minus) / (2 * h) - analytic[name][index]) < 1e-6
print('CNN gradient checks passed.')
def run_once(seed):
    rng = np.random.default_rng(seed); ntr, nval, nshift = PROTOCOL['sizes']
    Xtr, ytr = bars(rng, ntr, PROTOCOL['train_positions']); Xval, yval = bars(rng, nval, PROTOCOL['train_positions'])
    Xs, ys = bars(rng, nshift, PROTOCOL['shifted_positions'])
    row = {}
    for name, model in [('baseline', train_linear(Xtr, ytr, PROTOCOL['steps'], PROTOCOL['lr'])), ('improvement', train_cnn(Xtr, ytr, PROTOCOL['steps'], PROTOCOL['lr'], seed))]:
        row[name] = dict(validation=float(np.mean(model(Xval).argmax(axis=1) == yval)), shifted=float(np.mean(model(Xs).argmax(axis=1) == ys)), shifted_nll=nll(model(Xs), ys))
    return row, model, Xs, ys
runs = {seed: run_once(seed) for seed in PROTOCOL['seeds']}
print('seed  | baseline val  shifted | improvement val  shifted')
for seed, (row, *_ ) in runs.items():
    print(f"{seed:5d} | {row['baseline']['validation']:12.3f} {row['baseline']['shifted']:8.3f} | {row['improvement']['validation']:15.3f} {row['improvement']['shifted']:8.3f}")'''),
md(r'''## Part 3: Compare with uncertainty
The runs are paired: both models saw the same data. So compare them seed by seed. With only five seeds the interval is rough, and it describes this generator, not the world. The interval below is a bootstrap over seeds.

A score far below 50% on two balanced classes is a clue, not just a bad result: the baseline is confidently wrong, so ask what it learned instead of the orientation.'''),
code(r'''baseline = np.array([runs[s][0]['baseline']['shifted'] for s in PROTOCOL['seeds']])
improvement = np.array([runs[s][0]['improvement']['shifted'] for s in PROTOCOL['seeds']])
difference = improvement - baseline
draws = np.random.default_rng(0).integers(0, len(difference), (4000, len(difference)))
low, high = np.quantile(difference[draws].mean(axis=1), [.025, .975])
print('mean shifted accuracy, baseline:', baseline.mean().round(3), ' improvement:', improvement.mean().round(3))
print(f'paired difference {difference.mean():.3f}, bootstrap interval {low:.3f} to {high:.3f}, from {len(difference)} seeds')
print('Hypothesis supported on this generator?', bool(low > 0))
assert len(difference) == len(PROTOCOL['seeds']) and np.all((0 <= baseline) & (baseline <= 1))'''),
md(r'''## Part 4: Audit the failures
A metric says how often, and failures say how. Pull out the most confident mistakes and look at them. Write one explanation you can test, and one you cannot yet separate from chance.'''),
code(r'''def show(image):
    shades = ' .:-=+*#%@'
    for line in np.clip(image, 0, .99):
        print(''.join(shades[int(v * 10)] * 2 for v in line))
row, model, Xs, ys = runs[PROTOCOL['seeds'][0]]
probabilities = softmax(model(Xs)); predicted = probabilities.argmax(axis=1); confidence = probabilities.max(axis=1)
wrong = np.where(predicted != ys)[0]
print('errors:', len(wrong), 'of', len(ys))
for index in wrong[np.argsort(confidence[wrong])[::-1]][:3]:
    print(f'\nimage {index}: true {"vertical" if ys[index] else "horizontal"}, predicted {"vertical" if predicted[index] else "horizontal"}, confidence {confidence[index]:.3f}')
    show(Xs[index])
print('\nNext: state the population this evidence supports, and what would change your conclusion.')'''),
md(r'''## Make it your capstone
Replace the question, change one factor at a time, and keep the protocol cell honest: if you change a setting after seeing a result, record that you did. Fill in the capstone template with your question, data protocol, shapes, one derivative, the comparison table, three failures and your limitations. A candid negative result is a successful capstone.''')])

(BASE/'notebook-validation.json').write_text(json.dumps(reports,indent=2)+'\n',encoding='utf-8')
print(json.dumps(reports))
