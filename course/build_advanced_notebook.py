"""Write notebooks/features-geometry-and-generative.ipynb for Modules 15-17 (Lessons 57-68).

Run with: python course/build_advanced_notebook.py
The notebook is written without outputs; open it in Jupyter and run the cells top to bottom (Python 3 + NumPy only).
"""
from pathlib import Path
import json
import textwrap

BASE = Path(__file__).resolve().parent
TARGET = BASE / 'notebooks' / 'features-geometry-and-generative.ipynb'


def md(text):
    return dict(cell_type='markdown', metadata={}, source=textwrap.dedent(text).strip() + '\n')


def code(text):
    return dict(cell_type='code', metadata={}, source=textwrap.dedent(text).strip() + '\n', execution_count=None, outputs=[])


CELLS = [
    md(r'''
    # Features, two-view geometry and generative models · Modules 15–17
    Python 3 and NumPy only, no GPU or framework. Run the cells top to bottom: later cells reuse functions defined earlier.

    Each section follows Lessons 57–68: a short explanation, a **Predict, then run** prompt, a complete demonstration with checks (`assert`), and a small exercise. Write your prediction down before you execute a cell; the interesting part is the gap between the prediction and the output.

    Conventions: an image is an array `img[row, column]`; x is the column, counted to the right, and y the row, counted downwards, so 2D points are `(x, y)`; homogeneous points are `(x, y, 1)`; data matrices store one example per row; a camera maps a point by $X_c=RX+t$ (Lesson 51). Every section seeds its own random generator, so its numbers do not depend on how often earlier cells were run.
    '''),
    code(r'''
    import numpy as np
    from itertools import permutations
    np.set_printoptions(precision=4, suppress=True)
    print('NumPy', np.__version__)
    '''),

    # 1. Gradients, structure tensor, Harris -------------------------------------------------------
    md(r'''
    ## 1. Sobel and derivative-of-Gaussian gradients, the structure tensor and Harris corners (Lesson 57)
    An image gradient $\nabla I=(I_x,I_y)$ is two filter responses. Sobel takes the central difference $\tfrac12[-1,\ 0,\ 1]$ in three neighbouring rows and averages them with weights 1, 2, 1, so $I_x\approx\tfrac18(S_x\star I)$. A derivative of Gaussian blurs and differentiates with one separable kernel: taps proportional to $i\,g_\sigma(i)$ across the columns, scaled so that a ramp of slope 1 gives 1, and the blur $g_\sigma$ down the rows. Blurring first averages the noise that a plain difference amplifies.

    The structure tensor of a window, $M=\sum_x w(x)\,\nabla I\,\nabla I^T$, is the matrix of the quadratic form $E(\Delta u)\approx\Delta u^TM\Delta u$: how much the patch changes under a small shift. Two small eigenvalues mean a flat patch, one large and one near 0 an edge, two large a corner. Harris avoids the eigenvalues with $R=\det M-k(\operatorname{tr}M)^2$: positive at corners, negative at edges, near 0 on flat patches.

    **Predict, then run.** On the ramp $I=50+12x+5y$, what do Sobel/8 and the central difference give for $I_x$? Add 10 grey levels to the right-hand pixel: which estimate moves more? For the gradients (1, 0), (1, 0), (0, 1), (0, 1), and for two gradients (1, 1), what are the eigenvalues of M and the sign of R with k = 0.04? Where on a bright square will the four strongest Harris responses be?
    '''),
    code(r'''
    SOBEL_X = np.outer([1., 2., 1.], [-1., 0., 1.])    # smoothing down the rows times a difference across the columns
    SOBEL_Y = SOBEL_X.T

    ramp = np.array([[33., 45., 57.], [38., 50., 62.], [43., 55., 67.]])   # I = 50 + 12x + 5y around the centre pixel
    Ix, Iy = np.sum(SOBEL_X * ramp) / 8, np.sum(SOBEL_Y * ramp) / 8
    print('Sobel/8 on the ramp: Ix = %.2f, Iy = %.2f' % (Ix, Iy))
    print('|grad I| = %.2f, theta = %.1f deg; the reversed gradient has theta = %.1f deg' % (
        np.hypot(Ix, Iy), np.degrees(np.arctan2(Iy, Ix)), np.degrees(np.arctan2(-Iy, -Ix))))
    assert np.isclose(Ix, 12) and np.isclose(Iy, 5) and np.isclose(np.hypot(Ix, Iy), 13)
    assert np.isclose(np.degrees(np.arctan2(-Iy, -Ix)), -157.38, atol=0.01)

    noisy = ramp.copy(); noisy[1, 2] += 10                                  # 62 -> 72
    central, sobel = (noisy[1, 2] - noisy[1, 0]) / 2, np.sum(SOBEL_X * noisy) / 8
    print('one noisy pixel: central difference %.1f, Sobel/8 %.1f (true slope 12)' % (central, sobel))
    assert np.isclose(central, 17) and np.isclose(sobel, 14.5)

    def filter_rows(img, taps):
        """Cross-correlate every row with the 1D taps (centre tap in the middle), repeating the edge pixels."""
        r = len(taps) // 2
        padded = np.pad(img, ((0, 0), (r, r)), mode='edge')
        return sum(w * padded[:, i:i + img.shape[1]] for i, w in enumerate(taps))

    def filter_cols(img, taps):
        return filter_rows(img.T, taps).T

    def gauss_taps(sigma):
        i = np.arange(-int(np.ceil(3 * sigma)), int(np.ceil(3 * sigma)) + 1)   # radius 3 sigma
        g = np.exp(-i ** 2 / (2 * sigma ** 2))
        return g / g.sum(), i

    def dog_taps(sigma):
        g, i = gauss_taps(sigma)
        d = i * g                              # proportional to -g'(i): positive on the right
        return d / np.sum(i * d)               # a ramp of slope 1 gives exactly 1

    def gradients(img, sigma=1.0):
        """(Ix, Iy) by derivative-of-Gaussian filtering: differentiate along one axis, blur along the other."""
        g, d = gauss_taps(sigma)[0], dog_taps(sigma)
        return filter_cols(filter_rows(img, d), g), filter_rows(filter_cols(img, d), g)

    def blur(img, sigma):
        g = gauss_taps(sigma)[0]
        return filter_cols(filter_rows(img, g), g)

    print('derivative-of-Gaussian taps for sigma = 1:', dog_taps(1.0))
    assert np.allclose(dog_taps(1.0)[4:], [0.243, 0.108, 0.013], atol=5e-4)
    yy, xx = np.mgrid[0:20, 0:20]
    gx, gy = gradients(50 + 12. * xx + 5. * yy, 1.0)
    assert np.allclose(gx[5:-5, 5:-5], 12) and np.allclose(gy[5:-5, 5:-5], 5)   # exact on a ramp, away from the border

    rng = np.random.default_rng(57)
    noise = rng.normal(0, 10, (300, 300))                                   # a flat region with sigma = 10 grey levels
    inner = (slice(5, -5), slice(5, -5))
    g1, d1 = gauss_taps(1.0)[0], dog_taps(1.0)
    measured = {'central difference': filter_rows(noise, [-0.5, 0, 0.5])[inner].std(),
                'Sobel/8': filter_cols(filter_rows(noise, [-0.5, 0, 0.5]), [0.25, 0.5, 0.25])[inner].std(),
                'derivative of Gaussian, sigma = 1': gradients(noise, 1.0)[0][inner].std()}
    predicted = {'central difference': 10 * np.sqrt(2) / 2, 'Sobel/8': 10 * np.sqrt(12) / 8,
                 'derivative of Gaussian, sigma = 1': 10 * np.sqrt(np.sum(d1 ** 2) * np.sum(g1 ** 2))}
    for name in measured:
        print('noise in Ix, %-35s measured %.2f, predicted %.2f' % (name + ':', measured[name], predicted[name]))
        assert abs(measured[name] / predicted[name] - 1) < 0.03
    print('sigma = 2, radius 6: separable filtering costs %d multiplications per pixel, the full 2D kernel %d' % (2 * 13, 13 ** 2))
    '''),
    code(r'''
    def structure_tensor(grads):
        g = np.asarray(grads, float)
        return g.T @ g                         # the sum of the outer products grad grad^T

    def harris(M, k=0.04):
        return np.linalg.det(M) - k * np.trace(M) ** 2

    windows = {'corner': [(1, 0), (1, 0), (0, 1), (0, 1)], 'edge': [(1, 0)] * 4,
               'edge at 45 deg': [(1, 1), (1, 1)], 'flat': [(0, 0)] * 4}
    for name, grads in windows.items():
        M = structure_tensor(grads)
        print('%-15s M = %-22s eigenvalues %s, R = %+.2f' % (name, M.tolist(), np.linalg.eigvalsh(M)[::-1], harris(M)))
    assert np.isclose(harris(structure_tensor(windows['corner'])), 3.36)
    assert np.isclose(harris(structure_tensor(windows['edge'])), -0.64) and np.isclose(harris(structure_tensor(windows['edge at 45 deg'])), -0.64)
    assert np.allclose(np.linalg.eigvalsh(structure_tensor(windows['edge at 45 deg'])), [0, 4])
    ratio = np.roots([0.04, 2 * 0.04 - 1, 0.04]).min()      # t = k (1 + t)^2: R > 0 only when lambda2 / lambda1 exceeds it
    print('R changes sign at lambda2 / lambda1 = %.4f' % ratio)
    assert abs(ratio - 0.044) < 0.001

    # A bright square on a dark background, with a little noise: the Harris response of every pixel.
    img = np.zeros((40, 40)); img[10:30, 12:32] = 100.
    img += rng.normal(0, 2, img.shape)
    Ix, Iy = gradients(img, 1.0)
    Sxx, Sxy, Syy = blur(Ix * Ix, 1.5), blur(Ix * Iy, 1.5), blur(Iy * Iy, 1.5)   # window weights: a Gaussian, sigma_i = 1.5
    R_map = Sxx * Syy - Sxy ** 2 - 0.04 * (Sxx + Syy) ** 2
    for name, (x, y) in {'corner': (12, 10), 'edge': (12, 20), 'flat inside': (22, 20), 'flat outside': (3, 3)}.items():
        lam = np.linalg.eigvalsh(np.array([[Sxx[y, x], Sxy[y, x]], [Sxy[y, x], Syy[y, x]]]))[::-1]
        print('%-12s at (x, y) = (%2d, %2d): eigenvalues %s, R = %.1f' % (name, x, y, lam, R_map[y, x]))
    assert R_map[10, 12] > 0 > R_map[20, 12] and abs(R_map[20, 22]) < 1

    padded = np.pad(R_map, 2, constant_values=-np.inf)                       # non-maximum suppression in a 5 x 5 window
    neighbours = [padded[dy:dy + 40, dx:dx + 40] for dy in range(5) for dx in range(5) if (dy, dx) != (2, 2)]
    peaks = np.argwhere(R_map >= np.max(neighbours, axis=0))                   # (row, column) of every local maximum
    strongest = peaks[np.argsort(R_map[peaks[:, 0], peaks[:, 1]])[::-1][:4]]
    print('the four strongest local maxima (x, y):', [(int(x), int(y)) for y, x in strongest])
    print('the fifth strongest is %.1e times the fourth' % (np.sort(R_map[peaks[:, 0], peaks[:, 1]])[-5] / R_map[tuple(strongest[-1])]))
    square_corners = np.array([[10, 12], [10, 31], [29, 12], [29, 31]])       # (row, column) of the square's corner pixels
    assert all(np.abs(square_corners - p).sum(axis=1).min() <= 3 for p in strongest)
    '''),
    md(r'''
    **Exercise.** Lesson 57's first two practice questions: work out by hand Sobel/8, $|\nabla I|$ and θ for the patch with rows (20, 30, 50), (20, 40, 60) and (30, 50, 70), and M, its eigenvalues and R with k = 0.05 for the gradients (2, 1), (2, 1), (−1, 2), (0, 0). Then run the cell. Finally, the cell walks down the square's left edge from its corner: predict how the smaller eigenvalue changes before you look.
    '''),
    code(r'''
    patch = np.array([[20., 30., 50.], [20., 40., 60.], [30., 50., 70.]])
    gx, gy = np.sum(SOBEL_X * patch) / 8, np.sum(SOBEL_Y * patch) / 8
    print('Ix = %.2f, Iy = %.2f, |grad| = %.2f, theta = %.1f deg' % (gx, gy, np.hypot(gx, gy), np.degrees(np.arctan2(gy, gx))))
    M = structure_tensor([(2, 1), (2, 1), (-1, 2), (0, 0)])
    print('M =', M.tolist(), ' eigenvalues', np.linalg.eigvalsh(M)[::-1], ' R = %.2f' % harris(M, k=0.05))
    for y in range(10, 21, 2):
        lam = np.linalg.eigvalsh(np.array([[Sxx[y, 12], Sxy[y, 12]], [Sxy[y, 12], Syy[y, 12]]]))
        print('column 12, row %d: eigenvalues %7.1f and %7.1f, R = %9.1f' % (y, lam[1], lam[0], R_map[y, 12]))
    '''),

    # 2. Scale space and matching ----------------------------------------------------------------
    md(r'''
    ## 2. Scale-normalised blobs, descriptors and the ratio test (Lesson 58)
    Blurring by $\sigma_1$ and then by $\sigma_2$ is one blur by $\sqrt{\sigma_1^2+\sigma_2^2}$, because variances add. The Laplacian $\nabla^2L=L_{xx}+L_{yy}$ of the blurred image shrinks as σ grows, so scales are compared with $\sigma^2\nabla^2L$. For a Gaussian blob of width s its size at the centre is $2\sigma^2s^2/(s^2+\sigma^2)^2$, largest exactly at σ = s: the blob's characteristic scale. The difference of Gaussians $L(k\sigma)-L(\sigma)\approx(k-1)\,\sigma^2\nabla^2L$ is the cheaper version SIFT uses.

    A descriptor is a magnitude-weighted histogram of gradient orientations, divided by its length. A match from A to B passes the ratio test if the nearest distance $d_1$ and the second nearest $d_2$ satisfy $d_1/d_2<0.8$, and the mutual test if B's nearest neighbour in A is the same descriptor.

    **Predict, then run.** For s = 3, what is the normalised response at σ = 1.5, 3 and 6? Where does the peak move if the image is enlarged by 2? In the distance table with rows (0.20, 0.50, 0.70), (0.30, 0.35, 0.90) and (0.60, 0.80, 0.25), which matches survive both tests? When 20 descriptors have no true partner, how does the ratio test change the precision?
    '''),
    code(r'''
    def blob_response(s, sigma):
        """|sigma^2 Laplacian| at the centre of the blurred blob exp(-r^2 / (2 s^2)), in closed form."""
        return 2 * sigma ** 2 * s ** 2 / (s ** 2 + sigma ** 2) ** 2

    print('closed form for s = 3 at sigma = 1.5, 3, 6:', [round(blob_response(3, sg), 3) for sg in (1.5, 3, 6)])
    assert np.allclose([blob_response(3, sg) for sg in (1.5, 3, 6)], [0.32, 0.5, 0.32])

    def sampled_gauss(sigma):
        i = np.arange(-int(4 * sigma) - 1, int(4 * sigma) + 2)
        return np.exp(-i ** 2 / (2 * sigma ** 2)) / (sigma * np.sqrt(2 * np.pi))

    composed, single = np.convolve(sampled_gauss(3.0), sampled_gauss(4.0)), sampled_gauss(5.0)
    cut = (len(composed) - len(single)) // 2
    gap = np.abs(composed[cut:len(composed) - cut] - single).max()
    print('blur by 3, then by 4, against one blur by 5: largest difference %.1e (peak %.3f)' % (gap, single.max()))
    print('from sigma = 1.6 to 3.2 the extra blur is %.2f, not 1.6' % np.sqrt(3.2 ** 2 - 1.6 ** 2))
    assert gap < 1e-4

    def log_response(s, sigmas, n=129):
        """sigma^2 |Laplacian| at the blob centre, measured on a sampled blob with FFTs: in Fourier space the blur
        multiplies by exp(-2 pi^2 sigma^2 f^2) and the Laplacian by -4 pi^2 f^2 (Lesson 36). The value of an
        inverse FFT at index [0, 0] is the mean of the spectrum, so no inverse transform is needed."""
        y, x = np.mgrid[:n, :n] - n // 2
        blob_hat = np.real(np.fft.fft2(np.fft.ifftshift(np.exp(-(x ** 2 + y ** 2) / (2 * s ** 2)))))
        f = np.fft.fftfreq(n)
        f2 = f[:, None] ** 2 + f[None, :] ** 2
        return np.array([sg ** 2 * abs(np.mean(blob_hat * np.exp(-2 * np.pi ** 2 * sg ** 2 * f2) * (-4 * np.pi ** 2 * f2)))
                         for sg in sigmas])

    sigmas = np.geomspace(1, 12, 241)
    for s in [3, 6]:                                   # s = 6 is the same blob after enlarging the image by 2
        response = log_response(s, sigmas)
        peak = sigmas[np.argmax(response)]
        print('blob s = %d: measured response peaks at sigma = %.2f (value %.4f); detected radius sqrt(2) sigma = %.2f px' % (
            s, peak, response.max(), np.sqrt(2) * peak))
        assert abs(peak / s - 1) < 0.011 and np.abs(response - blob_response(s, sigmas)).max() < 1e-3

    k = 2 ** (1 / 3)                                   # S = 3 intervals per octave
    dog = 9 / (9 + (k * 1.5) ** 2) - 9 / (9 + 1.5 ** 2)    # L(k sigma) - L(sigma) at the centre of the s = 3 blob
    print('DoG at sigma = 1.5: %.4f; (k - 1) times the normalised Laplacian: %.4f' % (dog, (k - 1) * -blob_response(3, 1.5)))
    assert np.isclose(dog, -0.084, atol=5e-4) and np.isclose((k - 1) * -blob_response(3, 1.5), -0.083, atol=5e-4)
    '''),
    code(r'''
    def orientation_histogram(grads, bins=8):
        """Magnitude-weighted histogram of gradient directions; bin b is centred on b * 360 / bins degrees."""
        g = np.asarray(grads, float)
        angle = np.degrees(np.arctan2(g[:, 1], g[:, 0])) % 360
        hist = np.zeros(bins)
        np.add.at(hist, np.round(angle / (360 / bins)).astype(int) % bins, np.hypot(g[:, 0], g[:, 1]))
        return hist

    cell = np.array([(3, 0), (0, 2), (-1, 1), (2, 2)], float)
    hist = orientation_histogram(cell)
    unit = hist / np.linalg.norm(hist)
    print('cell histogram:', hist, '\nunit vector:   ', unit)
    assert np.allclose(hist[:4], [3, np.sqrt(8), 2, np.sqrt(2)]) and np.allclose(unit[:4], [0.626, 0.590, 0.417, 0.295], atol=1e-3)
    doubled = orientation_histogram(2 * cell)
    assert np.allclose(doubled / np.linalg.norm(doubled), unit)                # contrast cancels in the unit vector
    turned = orientation_histogram(cell @ np.array([[0., -1.], [1., 0.]]).T)  # every gradient turned by +90 degrees
    print('after a 90 deg turn the votes move two bins:', turned)
    assert np.allclose(turned, np.roll(hist, 2))
    assert np.allclose(np.roll(turned, -np.argmax(turned)), np.roll(hist, -np.argmax(hist)))   # measured from the dominant bin

    def match(dist, ratio=0.8, mutual=True):
        """Accepted pairs (i, j) for a distance table: rows are descriptors in A, columns descriptors in B."""
        order = np.argsort(dist, axis=1)
        pairs = []
        for i in range(len(dist)):
            j, j2 = order[i, 0], order[i, 1]
            if dist[i, j] < ratio * dist[i, j2] and (not mutual or np.argmin(dist[:, j]) == i):
                pairs.append((i, int(j)))
        return pairs

    table = np.array([[0.20, 0.50, 0.70], [0.30, 0.35, 0.90], [0.60, 0.80, 0.25]])
    nearest_two = np.sort(table, axis=1)[:, :2]
    print('ratios d1 / d2:', np.round(nearest_two[:, 0] / nearest_two[:, 1], 3))
    print('accepted (A, B), counted from 1:', [(i + 1, j + 1) for i, j in match(table)])
    assert match(table) == [(0, 0), (2, 2)] and match(table, mutual=False) == [(0, 0), (2, 2)]
    print('Hamming distance of 10110010 and 10011011:', bin(0b10110010 ^ 0b10011011).count('1'))
    assert bin(0b10110010 ^ 0b10011011).count('1') == 3

    # 40 descriptors in A are noisy copies of the first 40 of 60 in B; 20 more in A have no partner at all.
    rng = np.random.default_rng(58)
    dim = 32
    desc_B = np.abs(rng.normal(size=(60, dim)))
    desc_A = np.vstack([desc_B[:40] + rng.normal(0, 0.25, (40, dim)), np.abs(rng.normal(size=(20, dim)))])
    desc_A, desc_B = (np.abs(d) / np.linalg.norm(np.abs(d), axis=1, keepdims=True) for d in (desc_A, desc_B))
    dist = np.linalg.norm(desc_A[:, None, :] - desc_B[None, :, :], axis=2)
    precision = {}
    for label, pairs in [('nearest neighbour only', [(i, int(np.argmin(dist[i]))) for i in range(len(dist))]),
                         ('ratio test, 0.8', match(dist, 0.8, mutual=False)), ('ratio and mutual tests', match(dist, 0.8))]:
        correct = sum(i == j for i, j in pairs)
        precision[label] = correct / len(pairs)
        print('%-23s %2d accepted, precision %.2f, recall %.2f' % (label, len(pairs), precision[label], correct / 40))
    assert precision['ratio test, 0.8'] > precision['nearest neighbour only'] + 0.2 and precision['ratio and mutual tests'] >= 0.95
    '''),
    md(r'''
    **Exercise.** Lesson 58's practice question 2: for a blob of width s = 2, compute the normalised response at σ = 1, 2 and 4, the detected radius, and what happens when the image is shrunk to half size. Then sweep the ratio threshold on the synthetic descriptors: predict how precision and recall move as the threshold rises from 0.5 to 0.95.
    '''),
    code(r'''
    print('s = 2:', [round(blob_response(2, sg), 3) for sg in (1, 2, 4)], ' radius at the peak %.2f px' % (np.sqrt(2) * 2))
    print('half size, s = 1:', [round(blob_response(1, sg), 3) for sg in (0.5, 1, 2)])
    for threshold in [0.5, 0.6, 0.7, 0.8, 0.9, 0.95]:
        pairs = match(dist, threshold, mutual=False)
        correct = sum(i == j for i, j in pairs)
        print('ratio %.2f: %2d accepted, precision %.2f, recall %.2f' % (threshold, len(pairs), correct / max(len(pairs), 1), correct / 40))
    '''),

    # 3. Optical flow ----------------------------------------------------------------------------
    md(r'''
    ## 3. Lucas–Kanade, the aperture problem and coarse-to-fine flow (Lesson 59)
    Brightness constancy $I(x+u,y+v,t+1)=I(x,y,t)$, expanded to first order, gives one equation per pixel, $I_xu+I_yv+I_t\approx0$: it fixes only the flow along the gradient. Lucas–Kanade assumes one flow for a whole window and solves the least-squares normal equations $M\,(u,v)^T=-\bigl(\sum I_xI_t,\ \sum I_yI_t\bigr)^T$, where M is the structure tensor of Section 1. If M is singular, as on a straight edge, motion along the edge is invisible: the aperture problem.

    The linearisation holds for motions of about a pixel. Iterating (warp the second frame back by the current estimate, recompute $I_t$, solve again) is Gauss–Newton. For larger motions a pyramid halves the displacement at every level: estimate at the coarsest level, double the estimate, refine at the next level down.

    **Predict, then run.** Four pixels have $(I_x,I_y,I_t)$ = (1, 0, −2), (1, 0, −2), (0, 1, −1), (0, 1, −1): what is (u, v)? If all four were (1, 0, −2), what could you say about v? A texture moves by (6.4, −4.8), 8 pixels: will Lucas–Kanade at full resolution find it, and how many pyramid levels bring it down to one pixel?
    '''),
    code(r'''
    def lucas_kanade(rows):
        """Least-squares flow from rows (Ix, Iy, It); returns (u, v) and the eigenvalues of M, largest first."""
        r = np.asarray(rows, float)
        A, It = r[:, :2], r[:, 2]
        flow = np.linalg.lstsq(A, -It, rcond=None)[0]         # the minimum-norm solution if M = A^T A is singular
        return flow, np.linalg.eigvalsh(A.T @ A)[::-1]

    flow, lam = lucas_kanade([(1, 0, -2), (1, 0, -2), (0, 1, -1), (0, 1, -1)])
    print('two gradient directions: (u, v) =', flow, ' eigenvalues of M', lam)
    assert np.allclose(flow, [2, 1]) and np.allclose(lam, [2, 2])
    flow, lam = lucas_kanade([(1, 0, -2)] * 4)
    print('one gradient direction:  (u, v) =', flow, ' eigenvalues of M', lam, '-> v is not determined')
    assert np.allclose(flow, [2, 0]) and np.isclose(lam[1], 0)

    g, It = np.array([3., 4.]), -10.
    normal_flow = -It / np.linalg.norm(g) * g / np.linalg.norm(g)
    print('gradient (3, 4), It = -10: normal flow', normal_flow, '; (2, 1) and (-2, 4) fit as well:', g @ [2, 1] + It, g @ [-2, 4] + It)
    assert np.allclose(normal_flow, [1.2, 1.6]) and g @ [2, 1] + It == 0 == g @ [-2, 4] + It

    for theta in [90, 15]:            # pixels 3 and 4 have gradient direction theta; It of pixel 4 is off by 0.5
        gt = (np.cos(np.radians(theta)), np.sin(np.radians(theta)))
        flow, lam = lucas_kanade([(1, 0, 0), (1, 0, 0), (*gt, 0), (*gt, 0.5)])   # true flow 0: the estimate is the error
        print('gradients %2d deg apart: error %.2f px, condition number lam1 / lam2 = %.1f' % (theta, np.linalg.norm(flow), lam[0] / lam[1]))
    assert np.linalg.norm(flow) > 0.9     # 15 degrees apart: half a grey level moves the estimate by about a pixel
    '''),
    code(r'''
    def fourier_blur(img, sigma):
        fy, fx = np.fft.fftfreq(img.shape[0])[:, None], np.fft.fftfreq(img.shape[1])[None, :]
        return np.real(np.fft.ifft2(np.fft.fft2(img) * np.exp(-2 * np.pi ** 2 * sigma ** 2 * (fx ** 2 + fy ** 2))))

    def fourier_shift(img, dx, dy):
        """Move the content of a periodic image by (dx, dy) pixels, exactly, also by fractions of a pixel."""
        fy, fx = np.fft.fftfreq(img.shape[0])[:, None], np.fft.fftfreq(img.shape[1])[None, :]
        return np.real(np.fft.ifft2(np.fft.fft2(img) * np.exp(-2j * np.pi * (fx * dx + fy * dy))))

    def bilinear_wrap(img, x, y):
        """Bilinear sample of a periodic image at real-valued (x, y) = (column, row), as in Lesson 50."""
        h, w = img.shape
        x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
        fx, fy = x - x0, y - y0
        x0, y0 = x0 % w, y0 % h
        x1, y1 = (x0 + 1) % w, (y0 + 1) % h
        return (img[y0, x0] * (1 - fx) + img[y0, x1] * fx) * (1 - fy) + (img[y1, x0] * (1 - fx) + img[y1, x1] * fx) * fy

    def central_gradients(img):
        return (np.roll(img, -1, 1) - np.roll(img, 1, 1)) / 2, (np.roll(img, -1, 0) - np.roll(img, 1, 0)) / 2

    def lk_align(I0, I1, d=(0., 0.), iterations=10):
        """Iterated Lucas-Kanade (Gauss-Newton) for one translation d with I1(x + d) = I0(x), over the whole image."""
        Ix, Iy = central_gradients(I0)
        M = np.array([[np.sum(Ix * Ix), np.sum(Ix * Iy)], [np.sum(Ix * Iy), np.sum(Iy * Iy)]])
        yy, xx = np.mgrid[0:I0.shape[0], 0:I0.shape[1]].astype(float)
        d = np.array(d, float)
        for _ in range(iterations):
            It = bilinear_wrap(I1, xx + d[0], yy + d[1]) - I0      # temporal difference after warping frame 2 back
            d = d + np.linalg.solve(M, -np.array([np.sum(Ix * It), np.sum(Iy * It)]))
        return d

    BINOMIAL = np.array([1., 4., 6., 4., 1.]) / 16

    def down_wrap(img):
        """Blur with the binomial kernel and keep every second pixel (Lesson 56), for a periodic image."""
        out = sum(w * np.roll(img, 2 - i, axis=1) for i, w in enumerate(BINOMIAL))
        out = sum(w * np.roll(out, 2 - i, axis=0) for i, w in enumerate(BINOMIAL))
        return out[::2, ::2]

    def coarse_to_fine(I0, I1, levels=4, iterations=10, verbose=False):
        P0, P1 = [I0], [I1]
        for _ in range(levels - 1):
            P0.append(down_wrap(P0[-1])); P1.append(down_wrap(P1[-1]))
        d = np.zeros(2)
        for level in range(levels - 1, -1, -1):
            d = lk_align(P0[level], P1[level], d, iterations)
            if verbose:
                print('  level %d (%3d x %3d): estimate %s' % (level, *P0[level].shape, d))
            if level:
                d = 2 * d                  # one pixel at this level is two at the next finer one
        return d

    rng = np.random.default_rng(59)
    frame0 = fourier_blur(rng.normal(size=(128, 128)), 1.5)
    frame0 *= 40 / frame0.std()                                     # a smooth random texture, std 40 grey levels
    small = (0.7, -0.4)
    estimate = lk_align(frame0, fourier_shift(frame0, *small))
    print('shift', small, '-> Lucas-Kanade at full resolution:', estimate)
    assert np.allclose(estimate, small, atol=0.03)

    large = (6.4, -4.8)                                              # 8 pixels
    frame1 = fourier_shift(frame0, *large)
    single = lk_align(frame0, frame1, iterations=20)
    print('shift', large, '-> full resolution only, 20 iterations:', single)
    print('coarse-to-fine with 4 levels:')
    pyramid = coarse_to_fine(frame0, frame1, verbose=True)
    assert np.linalg.norm(single - large) > 2 and np.allclose(pyramid, large, atol=0.03)

    stripes = np.tile(fourier_blur(rng.normal(size=(1, 128)), 2.0), (128, 1))   # brightness changes only along x
    stripes *= 40 / stripes.std()
    Ix, Iy = central_gradients(stripes)
    flow, lam = lucas_kanade(np.c_[Ix.ravel(), Iy.ravel(), (fourier_shift(stripes, 0.5, 0.5) - stripes).ravel()])
    print('vertical stripes moved by (0.5, 0.5): one Lucas-Kanade step gives', flow, ' eigenvalues of M', lam)
    assert lam[1] < 1e-9 * lam[0] and abs(flow[0] - 0.5) < 0.05 and abs(flow[1]) < 1e-9
    '''),
    md(r'''
    **Exercise.** Lesson 59's practice questions 1, 3 and 4: solve the window with $(I_x,I_y,I_t)$ = (2, 0, −2), (0, 1, 1), (1, 1, 0); count the pyramid levels for an 8-pixel and a 13-pixel motion; apply one Horn–Schunck update at a pixel with (1, 0, −2) for α = 1 and α = 3, and for α = 1 with $\bar u=1.5$. Predict each answer first. Then predict the smallest number of pyramid levels that still recovers the 8-pixel shift; the last loop tries one to four.
    '''),
    code(r'''
    print('three pixels: (u, v) =', lucas_kanade([(2, 0, -2), (0, 1, 1), (1, 1, 0)])[0])
    for motion in [8, 13]:
        print('%2d px at levels 0-4: %s -> %d levels above full resolution' % (motion, [motion / 2 ** l for l in range(5)], int(np.ceil(np.log2(motion)))))

    def horn_schunck_update(Ix, Iy, It, u_bar, v_bar, alpha):
        r = (Ix * u_bar + Iy * v_bar + It) / (alpha ** 2 + Ix ** 2 + Iy ** 2)
        return u_bar - Ix * r, v_bar - Iy * r

    for alpha, u_bar in [(1, 0.), (3, 0.), (1, 1.5)]:
        print('alpha = %d, u_bar = %.1f -> (u, v) = (%.2f, %.2f)' % (alpha, u_bar, *horn_schunck_update(1, 0, -2, u_bar, 0, alpha)))
    for levels in [1, 2, 3, 4]:
        found = coarse_to_fine(frame0, frame1, levels=levels)
        print('%d pyramid level(s) for the 8 px shift: estimate %s, error %.3f px' % (levels, found, np.linalg.norm(found - large)))
    '''),

    # 4. Kalman filter and assignment ------------------------------------------------------------
    md(r'''
    ## 4. Kalman filtering and data association (Lesson 60)
    Three rules about Gaussians carry a tracker. A linear map sends $\mathcal N(\mu,\Sigma)$ to $\mathcal N(A\mu+b,\ A\Sigma A^T)$; independent noises add their covariances; and conditioning a joint Gaussian on part of it gives $\mu_{a|b}=\mu_a+\Sigma_{ab}\Sigma_{bb}^{-1}(x_b-\mu_b)$ and $\Sigma_{a|b}=\Sigma_{aa}-\Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}$. The Kalman filter predicts with the first two, $x^-=Fx$ and $P^-=FPF^T+Q$, and updates with the third: $S=HP^-H^T+R$, $K=P^-H^TS^{-1}$, $x=x^-+K(z-Hx^-)$, $P=(I-KH)P^-$. The innovation's $d^2=y^TS^{-1}y$ gates measurements: 3.84 keeps 95% of correct ones in one dimension.

    Deciding which detection updates which track is an assignment problem, $\min_\sigma\sum_iC_{i\sigma(i)}$. Greedy matching can be far from optimal; the Hungarian algorithm finds the optimum in $O(n^3)$ time.

    **Predict, then run.** From position 0 and velocity 1 with $P=I$, R = 1 and a measurement z = 2, what are the updated position and velocity? Why does the velocity change at all, when only the position is measured? For the costs [[0.1, 0.2], [0.3, 0.9]], what totals do greedy matching and the optimum reach?
    '''),
    code(r'''
    rng = np.random.default_rng(60)
    F = np.array([[1., 1.], [0., 1.]])                               # p <- p + v
    samples = rng.normal(size=(200000, 2)) @ F.T                      # x ~ N(0, I), then the linear map
    print('Cov(Fx) from samples:\n', np.cov(samples.T), '\nF F^T:\n', F @ F.T)
    assert np.allclose(np.cov(samples.T), [[2, 1], [1, 1]], atol=0.03)

    joint = rng.multivariate_normal([0, 0], [[4, 2], [2, 2]], size=1000000)   # Sigma_aa = 4, Sigma_ab = 2, Sigma_bb = 2
    near = np.abs(joint[:, 1] - 1) < 0.02                                       # condition on b = 1
    print('a given b = 1: sample mean %.3f (formula 1), sample variance %.3f (formula 2)' % (joint[near, 0].mean(), joint[near, 0].var()))
    assert abs(joint[near, 0].mean() - 1) < 0.05 and abs(joint[near, 0].var() - 2) < 0.1

    def kalman_step(x, P, z, F, Q, H, R):
        x_pred, P_pred = F @ x, F @ P @ F.T + Q                       # predict: the linear-map rule plus process noise
        y = z - H @ x_pred                                            # innovation
        S = H @ P_pred @ H.T + R
        K = P_pred @ H.T @ np.linalg.inv(S)                           # gain: how much of the surprise to believe
        x_new, P_new = x_pred + K @ y, (np.eye(len(x)) - K @ H) @ P_pred
        return x_new, P_new, float(y @ np.linalg.solve(S, y)), (x_pred, P_pred, S, K)

    H = np.array([[1., 0.]])                                          # only the position is measured
    x_new, P_new, d2, (x_pred, P_pred, S, K) = kalman_step(np.array([0., 1.]), np.eye(2), np.array([2.]), F, np.zeros((2, 2)), H, np.array([[1.]]))
    print('x- =', x_pred, ' P- =', P_pred.tolist(), ' S =', S[0, 0], ' K =', K.ravel())
    print('updated x =', x_new, ' P =', P_new.round(4).tolist(), ' gate d2 = %.3f' % d2)
    assert np.allclose(x_new, [5 / 3, 4 / 3]) and np.allclose(P_new, [[2 / 3, 1 / 3], [1 / 3, 2 / 3]]) and np.isclose(d2, 1 / 3)
    print('z = 6 instead: d2 = %.2f > 3.84, rejected as belonging to something else' % ((6 - 1) ** 2 / 3))

    def range_sensor(p):
        return np.hypot(p[0], p[1])
    H_range = np.array([(range_sensor([3 + 1e-6, 4]) - range_sensor([3 - 1e-6, 4])) / 2e-6,
                        (range_sensor([3, 4 + 1e-6]) - range_sensor([3, 4 - 1e-6])) / 2e-6])
    print('extended Kalman filter: Jacobian of the range at (3, 4):', H_range)
    assert np.allclose(H_range, [0.6, 0.8])

    # A constant-velocity track with small random accelerations, measured with noise of standard deviation 2.
    q, r_var, n_steps = 0.01, 4.0, 60
    Q = q * np.array([[0.25, 0.5], [0.5, 1.0]])                       # a random acceleration a: p += v + a / 2, v += a
    truth = np.zeros((n_steps, 2)); truth[0] = [0., 1.5]
    for k in range(1, n_steps):
        a = rng.normal(0, np.sqrt(q))
        truth[k] = F @ truth[k - 1] + [0.5 * a, a]
    measurements = truth[:, 0] + rng.normal(0, np.sqrt(r_var), n_steps)
    x, P = np.array([measurements[0], 0.]), np.diag([r_var, 10.])    # start at the first measurement, velocity unknown
    estimates, gates = [x], []
    for z in measurements[1:]:
        x, P, d2, _ = kalman_step(x, P, np.array([z]), F, Q, H, np.array([[r_var]]))
        estimates.append(x); gates.append(d2)
    estimates = np.array(estimates)
    rms_meas = np.sqrt(np.mean((measurements[10:] - truth[10:, 0]) ** 2))
    rms_filter = np.sqrt(np.mean((estimates[10:, 0] - truth[10:, 0]) ** 2))
    print('position RMS error after step 10: measurements %.2f, Kalman filter %.2f' % (rms_meas, rms_filter))
    print('final velocity: true %.3f, estimated %.3f (never measured)' % (truth[-1, 1], estimates[-1, 1]))
    print('mean gate distance d2 = %.2f (about 1 when the model is right); %d of %d above 3.84' % (np.mean(gates), np.sum(np.array(gates) > 3.84), len(gates)))
    assert rms_filter < 0.7 * rms_meas and abs(estimates[-1, 1] - truth[-1, 1]) < 0.3
    '''),
    code(r'''
    def greedy_assignment(C):
        C = np.array(C, float); pairs = []
        for _ in range(min(C.shape)):
            i, j = np.unravel_index(np.argmin(C), C.shape)          # take the cheapest remaining entry
            pairs.append((int(i), int(j))); C[i, :] = np.inf; C[:, j] = np.inf
        return sorted(pairs)

    def brute_force_assignment(C):
        C = np.asarray(C, float)
        best = min(permutations(range(C.shape[1]), C.shape[0]), key=lambda cols: C[range(C.shape[0]), cols].sum())
        return list(enumerate(best))

    def hungarian(C):
        """Optimal assignment of every row to a different column (rows <= columns), in O(n^2 m) steps.

        u and v are the amounts subtracted from each row and each column, as in the lesson's row and column
        reductions. Throughout, every reduced cost C - u - v stays >= 0; at the end every chosen pair has
        reduced cost 0, and that certificate proves that no other assignment is cheaper."""
        C = np.asarray(C, float)
        n, m = C.shape
        u, v = np.zeros(n + 1), np.zeros(m + 1)                      # index 0 is a dummy row and column
        owner, way = np.zeros(m + 1, int), np.zeros(m + 1, int)      # owner[j]: row (from 1) assigned to column j
        for i in range(1, n + 1):
            owner[0], j0 = i, 0
            slack, used = np.full(m + 1, np.inf), np.zeros(m + 1, bool)
            while True:                                              # grow a tree of zero reduced costs from row i
                used[j0] = True
                i0, free = owner[j0], ~used[1:]
                cur = C[i0 - 1] - u[i0] - v[1:]
                better = free & (cur < slack[1:])
                slack[1:][better], way[1:][better] = cur[better], j0
                masked = np.where(free, slack[1:], np.inf)
                j1 = int(np.argmin(masked)) + 1
                delta = masked[j1 - 1]
                u[owner[used]] += delta; v[used] -= delta; slack[~used] -= delta   # shift the smallest slack
                j0 = j1
                if owner[j0] == 0:
                    break
            while j0:                                                # flip the augmenting path
                j1 = way[j0]; owner[j0] = owner[j1]; j0 = j1
        pairs = sorted((int(owner[j]) - 1, j - 1) for j in range(1, m + 1) if owner[j])
        return pairs, u[1:], v[1:]

    two = np.array([[0.1, 0.2], [0.3, 0.9]])
    row_reduced = two - two.min(axis=1, keepdims=True)
    col_reduced = row_reduced - row_reduced.min(axis=0, keepdims=True)
    print('row reduction', row_reduced.round(4).tolist(), '-> column reduction', col_reduced.round(4).tolist())
    assert np.allclose(col_reduced, [[0, 0], [0, 0.5]])
    totals = {}
    for name, solver in [('greedy', greedy_assignment), ('Hungarian', lambda C: hungarian(C)[0]), ('brute force', brute_force_assignment)]:
        pairs = solver(two)
        totals[name] = sum(two[i, j] for i, j in pairs)
        print('%-11s (track, detection) from 1: %s, total %.1f' % (name, [(i + 1, j + 1) for i, j in pairs], totals[name]))
    assert np.isclose(totals['greedy'], 1.0) and np.isclose(totals['Hungarian'], 0.5) and np.isclose(totals['brute force'], 0.5)

    for trial in range(30):
        C_rand = rng.uniform(0, 1, (5, 5) if trial % 2 else (4, 6))
        pairs, u_pot, v_pot = hungarian(C_rand)
        reduced = C_rand - u_pot[:, None] - v_pot[None, :]
        assert np.isclose(sum(C_rand[i, j] for i, j in pairs), sum(C_rand[i, j] for i, j in brute_force_assignment(C_rand)))
        assert reduced.min() > -1e-12 and all(abs(reduced[i, j]) < 1e-12 for i, j in pairs)
    print('30 random 5 x 5 and 4 x 6 problems: Hungarian total = brute-force total; reduced costs >= 0 and 0 on the chosen pairs')
    '''),
    md(r'''
    **Exercise.** Lesson 60's practice questions: (1) the mean, covariance and Mahalanobis distance of (5, 3) for $y=Ax$ with $x\sim\mathcal N((2,1),\operatorname{diag}(1,4))$ and $A=\begin{bmatrix}1&1\\0&1\end{bmatrix}$; (2) one Kalman step from x = (0, 2) with R = 2 and z = 3.5; (3) which of z = 3.5, 6.5 and −2 pass the 95% gate; (4) greedy and Hungarian assignments for the 3 × 3 costs. Work each out by hand, then run. Why is the distance of (5, 3) only 1 although the point is 2.83 away from the mean?
    '''),
    code(r'''
    A_map, mu, Sigma = np.array([[1., 1.], [0., 1.]]), np.array([2., 1.]), np.diag([1., 4.])
    mean_y, cov_y = A_map @ mu, A_map @ Sigma @ A_map.T
    offset = np.array([5., 3.]) - mean_y
    print('mean', mean_y, ' covariance', cov_y.tolist(), ' Mahalanobis distance %.3f' % np.sqrt(offset @ np.linalg.solve(cov_y, offset)))
    x2, P2, _, (xp, Pp, S2, K2) = kalman_step(np.array([0., 2.]), np.eye(2), np.array([3.5]), F, np.zeros((2, 2)), H, np.array([[2.]]))
    print('x- =', xp, ' P- =', Pp.tolist(), ' S =', S2[0, 0], ' K =', K2.ravel(), ' x =', x2, ' P =', P2.tolist())
    for z in [3.5, 6.5, -2]:
        print('z = %4.1f: d2 = %.4f' % (z, (z - (H @ xp)[0]) ** 2 / S2[0, 0]))
    costs3 = np.array([[0.1, 0.3, 0.9], [0.2, 0.9, 0.9], [0.9, 0.4, 0.3]])
    for name, solver in [('greedy', greedy_assignment), ('Hungarian', lambda C: hungarian(C)[0])]:
        pairs = solver(costs3)
        print('%-9s' % name, [(i + 1, j + 1) for i, j in pairs], 'total %.1f' % sum(costs3[i, j] for i, j in pairs))
    '''),

    # 5. Epipolar geometry -----------------------------------------------------------------------
    md(r'''
    ## 5. The essential matrix and the normalised eight-point algorithm (Lesson 61)
    For normalised image points $\hat x=K^{-1}x$ and the motion $X_2=RX_1+t$, the two rays and the baseline lie in one plane, so their triple product vanishes: $\hat x_2^TE\,\hat x_1=0$ with $E=[t]_\times R$. E has rank 2 and singular values $(\sigma,\sigma,0)$. In pixels the constraint reads $x_2^TFx_1=0$ with $F=K_2^{-T}EK_1^{-1}$, and $Fx_1$ is the epipolar line of $x_1$ in image 2.

    Each match gives one linear equation $(x_2x_1,\ x_2y_1,\ x_2,\ y_2x_1,\ y_2y_1,\ y_2,\ x_1,\ y_1,\ 1)\cdot f=0$ in the nine entries of F. The normalised eight-point algorithm moves each image's points to centroid 0 and mean distance $\sqrt2$, takes f as the right singular vector of the smallest singular value, sets the smallest singular value of the result to 0, and undoes the normalisation with $F=T_2^T\hat FT_1$.

    **Predict, then run.** For R = I, t = (1, 0, 0) and $X_1=(1,2,4)$, where does the point appear in view 2, and what is its epipolar line? With raw pixel coordinates the entries of a row range from about 300,000 down to 1: how far from their epipolar lines will noise-free matches be, compared with the normalised estimate? What does the rank-2 step change about the epipolar lines?
    '''),
    code(r'''
    def skew(v):
        """[v]x: skew(v) @ w equals np.cross(v, w)."""
        return np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])

    E = skew([1., 0., 0.]) @ np.eye(3)                              # a sideways step: R = I, t = (1, 0, 0)
    print('E =\n', E, '\nsingular values', np.linalg.svd(E, compute_uv=False))
    assert np.allclose(np.linalg.svd(E, compute_uv=False), [1, 1, 0])

    X1 = np.array([1., 2., 4.])
    X2 = X1 + [1., 0., 0.]
    x1, x2 = X1 / X1[2], X2 / X2[2]
    line = E @ x1
    print('x1 =', x1, ' x2 =', x2, ' epipolar line E x1 =', line, ' x2^T E x1 =', x2 @ line)
    assert np.allclose(x2, [0.5, 0.5, 1]) and np.allclose(line, [0, -1, 0.5]) and np.isclose(x2 @ line, 0)
    far = 2 * X1 + [1., 0., 0.]
    print('twice as far along the same ray, view 2 sees', far[:2] / far[2], ': still on the line y = 0.5')
    assert np.isclose((far / far[2]) @ line, 0)

    K_px = np.array([[400., 0, 320], [0, 400, 240], [0, 0, 1]])
    F_px = np.linalg.inv(K_px).T @ E @ np.linalg.inv(K_px)
    p1, p2 = K_px @ x1, K_px @ x2
    l2 = F_px @ p1
    print('pixels', p1[:2], '->', p2[:2], '; the epipolar line is proportional to', l2 / l2[1], ', the row v = 440')
    assert np.allclose(p1[:2], [420, 440]) and np.allclose(p2[:2], [520, 440]) and np.allclose(l2 / l2[1], [0, 1, -440])

    def eight_point_rows(a, b):
        """One row per match a = (x1, y1) <-> b = (x2, y2): the coefficients of F11, F12, ..., F33."""
        x1, y1, x2, y2 = a[:, 0], a[:, 1], b[:, 0], b[:, 1]
        return np.c_[x2 * x1, x2 * y1, x2, y2 * x1, y2 * y1, y2, x1, y1, np.ones_like(x1)]

    row = eight_point_rows(x1[None, :2], x2[None, :2])[0]
    print('eight-point row of the normalised match:', row, ' row . vec(E) =', row @ E.ravel())
    assert np.allclose(row, [0.125, 0.25, 0.5, 0.125, 0.25, 0.5, 0.25, 0.5, 1]) and np.isclose(row @ E.ravel(), 0)
    '''),
    code(r'''
    def normaliser(pts):
        """The similarity T that moves the points T x to centroid 0 and mean distance sqrt(2) (Lesson 50)."""
        c = pts.mean(axis=0)
        s = np.sqrt(2) / np.mean(np.linalg.norm(pts - c, axis=1))
        return np.array([[s, 0, -s * c[0]], [0, s, -s * c[1]], [0, 0, 1]])

    def to_h(pts):
        return np.c_[pts, np.ones(len(pts))]

    def eight_point(a, b, normalise=True, rank2=True):
        T1, T2 = (normaliser(a), normaliser(b)) if normalise else (np.eye(3), np.eye(3))
        na, nb = (to_h(a) @ T1.T)[:, :2], (to_h(b) @ T2.T)[:, :2]
        F_hat = np.linalg.svd(eight_point_rows(na, nb))[2][-1].reshape(3, 3)   # smallest right singular vector
        if rank2:
            U, s, Vt = np.linalg.svd(F_hat)
            F_hat = U @ np.diag([s[0], s[1], 0.]) @ Vt                         # the closest rank-2 matrix
        F_est = T2.T @ F_hat @ T1
        return F_est / np.linalg.norm(F_est)

    def epipolar_distance(F_est, a, b):
        """Mean distance in pixels of each point from the epipolar line of its match, averaged over both images."""
        ha, hb = to_h(a), to_h(b)
        l2, l1 = ha @ F_est.T, hb @ F_est
        r = np.abs(np.sum(hb * l2, axis=1))
        return np.mean(0.5 * (r / np.hypot(l2[:, 0], l2[:, 1]) + r / np.hypot(l1[:, 0], l1[:, 1])))

    def rot_y(deg):
        c, s = np.cos(np.radians(deg)), np.sin(np.radians(deg))
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

    def rot_x(deg):
        c, s = np.cos(np.radians(deg)), np.sin(np.radians(deg))
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

    rng = np.random.default_rng(61)
    K_cam = np.array([[500., 0, 320], [0, 500, 240], [0, 0, 1]])
    R_true, t_true = rot_y(-8) @ rot_x(3), np.array([1., 0.1, 0.2])
    F_true = np.linalg.inv(K_cam).T @ skew(t_true) @ R_true @ np.linalg.inv(K_cam)

    def pixels(Xc):
        uvw = Xc @ K_cam.T
        return uvw[:, :2] / uvw[:, 2:]

    def random_scene(n=60):
        """n points 4 to 9 units deep, seen by both cameras; returns the exact pixels and copies with 0.5 px of noise."""
        scene = np.c_[rng.uniform(-2, 2, n), rng.uniform(-1.5, 1.5, n), rng.uniform(4, 9, n)]
        clean1, clean2 = pixels(scene), pixels(scene @ R_true.T + t_true)
        return clean1, clean2, clean1 + rng.normal(0, 0.5, clean1.shape), clean2 + rng.normal(0, 0.5, clean2.shape)

    model_error = {'raw pixels': [], 'normalised': []}
    for trial in range(20):
        clean1, clean2, obs1, obs2 = random_scene()
        for label, normalise in [('raw pixels', False), ('normalised', True)]:
            model_error[label].append(epipolar_distance(eight_point(obs1, obs2, normalise), clean1, clean2))
    print('the largest entry of a raw-pixel row is %.0f; the last entry is 1' % np.abs(eight_point_rows(obs1, obs2)).max())
    for label, e in model_error.items():
        print('%-10s: noise-free points lie %.2f px from the estimated lines (median of 20 scenes), %.2f px at worst' % (label, np.median(e), np.max(e)))
    print('true F    : the noisy matches lie %.2f px from their lines, the floor set by the noise' % epipolar_distance(F_true, obs1, obs2))
    assert np.max(model_error['normalised']) < 0.5 and np.median(model_error['raw pixels']) > 3 * np.median(model_error['normalised'])

    for label, F_est in [('without the rank-2 step', eight_point(obs1, obs2, rank2=False)), ('with the rank-2 step', eight_point(obs1, obs2))]:
        lines = to_h(obs2) @ F_est                                  # the epipolar lines F^T x2 in image 1, one per row
        lines /= np.linalg.norm(lines, axis=1, keepdims=True)
        s = np.linalg.svd(lines, compute_uv=False)                  # lines through one common point <=> a null vector
        print('%-24s: smallest singular value of the 60 stacked lines %.1e' % (label, s[-1]))
    assert s[-1] < 1e-12
    e1 = np.linalg.svd(eight_point(obs1, obs2))[2][-1]              # F e1 = 0: the epipole in image 1
    baseline = -R_true.T @ t_true                                   # camera 2's centre in camera 1's frame
    ray = np.linalg.inv(K_cam) @ e1
    print('epipole direction vs true baseline direction: %.2f deg apart' % np.degrees(np.arccos(abs(ray @ baseline) / np.linalg.norm(ray) / np.linalg.norm(baseline))))

    needed = {s: int(np.ceil(np.log(0.01) / np.log(1 - 0.5 ** s))) for s in (8, 7, 5)}
    print('RANSAC samples for 99%% confidence with half the matches wrong: eight-point %d, seven-point %d, five-point %d' % (needed[8], needed[7], needed[5]))
    assert needed == {8: 1177, 7: 588, 5: 146}
    '''),
    md(r'''
    **Exercise.** Lesson 61's practice questions 1, 3 and 4: the vertical step t = (0, 1, 0); the closest essential matrix to singular values (1.2, 0.8, 0.05) and the RANSAC counts for 40% wrong matches; the forward motion t = (0, 0, −1). Predict each, then run. The last line replaces ten matches by wrong ones: predict how far the normalised eight-point estimate then misses the noise-free points, and why the solver must run inside RANSAC.
    '''),
    code(r'''
    E_vert = skew([0., 1., 0.])
    x1v, X2v = np.array([0.25, 0.5, 1.]), np.array([1., 3., 4.])
    print('vertical step: E =', E_vert.tolist(), ' line E x1 =', E_vert @ x1v, ' residual', (X2v / X2v[2]) @ E_vert @ x1v)
    s_est = np.array([1.2, 0.8, 0.05])
    closest = np.array([s_est[:2].mean(), s_est[:2].mean(), 0.])
    print('closest essential singular values', closest, ' Frobenius distance %.3f' % np.linalg.norm(s_est - closest))
    for sample in [8, 5]:
        print('%d-point samples, 40%% wrong: N = %d' % (sample, np.ceil(np.log(0.01) / np.log(1 - 0.6 ** sample))))
    E_fwd = skew([0., 0., -1.])
    X2f = np.array([1., 2., 3.])
    print('forward motion: E =', E_fwd.tolist(), ' line of (0.25, 0.5):', E_fwd @ x1v, ' the point appears at', X2f[:2] / X2f[2])
    bad = obs2.copy(); bad[:10] += rng.uniform(-60, 60, (10, 2))       # ten wrong matches among sixty
    print('with 10 wrong matches the normalised estimate misses noise-free points by %.2f px' % epipolar_distance(eight_point(obs1, bad), clean1, clean2))
    '''),

    # 6. Triangulation and stereo ----------------------------------------------------------------
    md(r'''
    ## 6. Triangulation, disparity and depth error (Lesson 62)
    A camera $P$ with rows $p_1^T,p_2^T,p_3^T$ sees X at $x=p_1^TX/p_3^TX$, $y=p_2^TX/p_3^TX$. Multiplying out the division gives two linear rows per view, $(x\,p_3^T-p_1^T)X=0$ and $(y\,p_3^T-p_2^T)X=0$; the DLT stacks them and takes the null vector, as in Lesson 50.

    In a rectified pair the match of (x, y) lies on the same row at $x-d$, and the disparity gives the depth $Z=fB/d$. A matching error $\sigma_d$ becomes a depth error $\sigma_Z\approx\frac{Z^2}{fB}\sigma_d$ by the first-order Taylor rule: five times farther means twenty-five times the error. Disparities come from sliding a window along the row and taking the cheapest match in the cost volume $C(x,y,d)$.

    **Predict, then run.** With f = 800 px and B = 0.1 m, what depths do d = 19, 20 and 21 px give? With $\sigma_d=0.5$ px, what is $\sigma_Z$ at 4 m and at 20 m, and is the error at 20 m symmetric? In a noisy textured scene, which window gives the most wrong disparities, 1 × 1, 5 × 5 or 11 × 11, and which one blurs the depth edges?
    '''),
    code(r'''
    def triangulate(P1, P2, a, b):
        """DLT: two rows per view, the null vector of the 4 x 4 matrix, divided by its last entry."""
        A = np.array([a[0] * P1[2] - P1[0], a[1] * P1[2] - P1[1], b[0] * P2[2] - P2[0], b[1] * P2[2] - P2[1]])
        X = np.linalg.svd(A)[2][-1]
        return X[:3] / X[3], A

    P_left = np.c_[np.eye(3), np.zeros(3)]
    P_right = np.c_[np.eye(3), [-1., 0., 0.]]                    # one unit to the right, looking the same way
    X, A = triangulate(P_left, P_right, (0.25, 0.5), (0., 0.5))
    print('DLT rows:\n', A, '\npoint', X, ' rank of A', np.linalg.matrix_rank(A))
    assert np.allclose(X, [1, 2, 4]) and np.linalg.matrix_rank(A) == 3

    # Lesson 61's last step: E gives four candidate motions; only one puts the point in front of both cameras.
    U, _, Vt = np.linalg.svd(skew([1., 0., 0.]))
    U, Vt = U * np.sign(np.linalg.det(U)), Vt * np.sign(np.linalg.det(Vt))   # force det U = det V = +1
    W90 = np.array([[0., -1, 0], [1, 0, 0], [0, 0, 1]])
    depths = []
    for R_c in (U @ W90 @ Vt, U @ W90.T @ Vt):
        for t_c in (U[:, 2], -U[:, 2]):
            Xc, _ = triangulate(P_left, np.c_[R_c, t_c], (0.25, 0.5), (0.5, 0.5))
            depths.append((round(float(Xc[2]), 2), round(float((R_c @ Xc + t_c)[2]), 2)))
            print('R =', np.round(R_c, 2).tolist(), 't =', np.round(t_c, 2), '-> depths in cameras 1 and 2:', depths[-1])
    assert sorted(depths) == sorted([(4, 4), (-4, -4), (1.33, -1.33), (-1.33, 1.33)])

    fB = 800 * 0.1
    print('f B = 80: d = 19, 20, 21 px give Z = %.2f, %.2f, %.2f m' % (fB / 19, fB / 20, fB / 21))
    assert np.allclose([fB / 19, fB / 20, fB / 21], [4.21, 4.00, 3.81], atol=0.005)
    rng = np.random.default_rng(62)
    for Z in [4., 20.]:
        d = fB / Z
        sigma_Z = Z ** 2 / fB * 0.5
        simulated = fB / (d + rng.normal(0, 0.5, 400000))
        print('Z = %4.1f m (d = %4.1f px): first-order sigma_Z %.3f m; simulated std %.3f m, simulated mean %.2f m' % (Z, d, sigma_Z, simulated.std(), simulated.mean()))
        assert np.isclose(sigma_Z, 0.1 if Z == 4 else 2.5)
    assert abs(simulated.std() / 2.5 - 1) > 0.02 and simulated.mean() > 20   # at 20 m the rule is only a guide
    print('lopsided: d = 3.5 gives %.1f m, d = 4.5 gives %.1f m' % (fB / 3.5, fB / 4.5))
    '''),
    code(r'''
    left_row = np.array([10, 10, 50, 90, 40, 20, 20, 20.])
    right_row = np.array([50, 90, 40, 20, 20, 20, 20, 20.])
    sad = [int(np.abs(left_row[2:5] - right_row[2 - d:5 - d]).sum()) for d in range(3)]   # 3-pixel window centred at x = 3
    print('SAD at x = 3 for d = 0, 1, 2:', sad)
    assert sad == [100, 110, 0]

    def subpixel(c_minus, c0, c_plus, d_hat):
        """Vertex of the parabola through the costs at d_hat - 1, d_hat and d_hat + 1."""
        return d_hat - (c_plus - c_minus) / (2 * (c_plus - 2 * c0 + c_minus))
    print('costs 30, 10, 20 at d = 11, 12, 13: d* = %.3f' % subpixel(30, 10, 20, 12))
    assert np.isclose(subpixel(30, 10, 20, 12), 12 + 1 / 6)

    def box_sum(img, r):
        """Sum over the (2r + 1) x (2r + 1) window around every pixel, with an integral image; edge pixels repeated."""
        c = np.pad(np.cumsum(np.cumsum(np.pad(img, r, mode='edge'), 0), 1), ((1, 0), (1, 0)))
        n, (h, w) = 2 * r + 1, img.shape
        return c[n:n + h, n:n + w] - c[:h, n:n + w] - c[n:n + h, :w] + c[:h, :w]

    def smooth_texture(shape):
        t = rng.uniform(0, 255, shape)
        return (t + np.roll(t, 1, 0) + np.roll(t, 1, 1) + np.roll(t, (1, 1), (0, 1))) / 4

    def in_rect(y, x, y0, y1, x0, x1):
        return (y >= y0) & (y < y1) & (x >= x0) & (x < x1)

    def in_square(y, x):
        return in_rect(y, x, 14, 34, 30, 54)

    # A rectified pair: a near square (disparity 6) in front of a far wall (disparity 2), both textured, plus noise.
    h_img, w_img, D_max = 48, 80, 9
    wall, square = smooth_texture((h_img, w_img + D_max)), smooth_texture((h_img, w_img + D_max))
    yy, xx = np.mgrid[0:h_img, 0:w_img]
    d_true = np.where(in_square(yy, xx), 6, 2)
    left = np.where(in_square(yy, xx), square[yy, xx], wall[yy, xx])
    right = np.where(in_square(yy, xx + 6), square[yy, xx + 6], wall[yy, xx + 2])     # right pixel x sees left pixel x + d
    left, right = left + rng.normal(0, 6, left.shape), right + rng.normal(0, 6, right.shape)
    visible = ~(~in_square(yy, xx) & in_square(yy, xx + 4)) & (xx >= D_max)   # wall hidden in the right view; left border
    near_edge = in_rect(yy, xx, 11, 37, 27, 57) & ~in_rect(yy, xx, 17, 31, 33, 51)  # within 3 px of the square's outline

    def winner_take_all(left, right, r):
        h, w = left.shape
        cost = np.empty((D_max, h, w))
        for d in range(D_max):                                       # one slice of the cost volume per disparity
            diff = np.full((h, w), 255.)
            diff[:, d:] = np.abs(left[:, d:] - right[:, :w - d])     # compare left x with right x - d
            cost[d] = box_sum(diff, r)
        return cost.argmin(axis=0)

    errors = {}
    print('row 24, x = 20 to 63 (- marks wall that the right camera cannot see, so no disparity is right there):')
    print('  truth    ', ''.join(str(v) if ok else '-' for v, ok in zip(d_true[24, 20:64], visible[24, 20:64])))
    for r in [0, 2, 5]:
        estimate = winner_take_all(left, right, r)
        wrong = (estimate != d_true) & visible
        errors[r] = (wrong.sum() / visible.sum(), wrong[near_edge].sum() / visible[near_edge].sum())
        print('  %2d x %-2d  ' % (2 * r + 1, 2 * r + 1) + ''.join(str(v) for v in estimate[24, 20:64]),
              '  wrong: %4.1f%% overall, %4.1f%% within 3 px of the depth edges' % (100 * errors[r][0], 100 * errors[r][1]))
    assert errors[2][0] < errors[0][0] / 10 and errors[5][1] > errors[2][1]
    '''),
    md(r'''
    **Exercise.** Lesson 62's practice questions: (1) triangulate the match (0.1, −0.2) ↔ (0, −0.2) with $P_2=[I\,|\,(-0.5,0,0)^T]$; (2) depths and depth errors for f = 700 px, B = 0.12 m, d = 42 and 6 px, $\sigma_d=0.25$ px; (3) the sub-pixel disparity for the costs 52, 20, 28 at d = 17, 18, 19 and fB = 84; (4) the SAD costs at x = 4 for d = 0 to 3, and for two constant rows. Predict, then run. Finally make the wall texture-free (`wall[:] = 128`) and rerun the matcher cell: which pixels go wrong now, and why?
    '''),
    code(r'''
    X_ex, A_ex = triangulate(P_left, np.c_[np.eye(3), [-0.5, 0., 0.]], (0.1, -0.2), (0., -0.2))
    print('DLT rows:\n', A_ex, '\npoint', X_ex)
    for d in [42, 6]:
        Z = 84 / d
        print('d = %2d px: Z = %.2f m, sigma_Z = %.4f m' % (d, Z, Z ** 2 / 84 * 0.25))
    d_star = subpixel(52, 20, 28, 18)
    print('sub-pixel d* = %.2f -> %.3f m; whole pixel 18 -> %.3f m' % (d_star, 84 / d_star, 84 / 18))
    print('SAD at x = 4 for d = 0..3:', [int(np.abs(left_row[3:6] - right_row[3 - d:6 - d]).sum()) for d in range(4)])
    print('two constant rows:', [int(np.abs(np.full(3, 20.) - np.full(8, 20.)[3 - d:6 - d]).sum()) for d in range(4)])
    '''),

    # 7. Rotations, Kabsch, Schur ----------------------------------------------------------------
    md(r'''
    ## 7. Rotations on a manifold, Kabsch and the Schur complement (Lesson 63)
    Rotations form a curved three-dimensional surface inside the nine-dimensional space of 3 × 3 matrices, so adding a small matrix to a rotation leaves the surface. The exponential map keeps a 3-vector step δ and lands exactly on a rotation, $R\leftarrow R\exp([\delta]_\times)$, with Rodrigues' formula $\exp([\delta]_\times)=I+\sin\theta\,[n]_\times+(1-\cos\theta)[n]_\times^2$. At δ = 0 the Jacobian of a rotated point is $-R[p]_\times$, so Gauss–Newton can treat δ as three plain numbers.

    Kabsch aligns matched points in closed form: centre both sets, take the SVD of $H=\sum_i\tilde p_i\tilde q_i^T=U\Sigma V^T$, set $R=V\operatorname{diag}(1,\ldots,1,d)\,U^T$ with $d=\det(VU^T)$, then $t=\bar q-R\bar p$. The normal equations of bundle adjustment, $\begin{bmatrix}B&E\\E^T&C\end{bmatrix}$, have a block-diagonal C, so eliminating the points leaves the small Schur-complement system $(B-EC^{-1}E^T)\,\delta_c=v-EC^{-1}w$.

    **Predict, then run.** For δ = (0, 0, 0.1), where does $I+[\delta]_\times$ send (1, 0, 0), and what is its determinant? Apply a small turn 100 times, additively and with the exponential map: which result is still a rotation? Will Gauss–Newton on the manifold and Kabsch agree? In the lesson's 3 × 3 system, what is $\delta_c$?
    '''),
    code(r'''
    def exp_so3(delta):
        """Rodrigues' formula: the rotation by the angle |delta| about the axis delta / |delta|."""
        delta = np.asarray(delta, float)
        theta = np.linalg.norm(delta)
        if theta < 1e-12:
            return np.eye(3) + skew(delta)
        n = skew(delta / theta)
        return np.eye(3) + np.sin(theta) * n + (1 - np.cos(theta)) * n @ n

    def log_so3(R):
        """The rotation vector of R, for angles below 180 degrees."""
        theta = np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1))
        if theta < 1e-12:
            return np.zeros(3)
        return theta / (2 * np.sin(theta)) * np.array([R[2, 1] - R[1, 2], R[0, 2] - R[2, 0], R[1, 0] - R[0, 1]])

    delta, e_x = np.array([0., 0., 0.1]), np.array([1., 0., 0.])
    first_order = np.eye(3) + skew(delta)
    print('I + [delta]x  : (1, 0, 0) ->', first_order @ e_x, ' length %.4f, det %.4f' % (np.linalg.norm(first_order @ e_x), np.linalg.det(first_order)))
    print('exp([delta]x) : (1, 0, 0) ->', exp_so3(delta) @ e_x, ' length %.4f, det %.4f' % (np.linalg.norm(exp_so3(delta) @ e_x), np.linalg.det(exp_so3(delta))))
    assert np.isclose(np.linalg.det(first_order), 1.01) and np.allclose(exp_so3(delta) @ e_x, [np.cos(0.1), np.sin(0.1), 0])

    step = np.array([0.01, -0.02, 0.015])
    R_add, R_exp = np.eye(3), np.eye(3)
    for _ in range(100):
        R_add = R_add @ (np.eye(3) + skew(step))          # first-order, additive update
        R_exp = R_exp @ exp_so3(step)                     # update on the manifold
    for name, Rm in [('additive', R_add), ('exponential map', R_exp)]:
        print('%-15s after 100 steps: |R^T R - I| = %.1e, det R = %.4f' % (name, np.linalg.norm(Rm.T @ Rm - np.eye(3)), np.linalg.det(Rm)))
    assert np.linalg.norm(R_exp.T @ R_exp - np.eye(3)) < 1e-12 and np.allclose(log_so3(R_exp), 100 * step)
    assert np.linalg.det(R_add) > 1.05

    rng = np.random.default_rng(63)
    R0, p = exp_so3(rng.normal(size=3)), rng.normal(size=3)
    J_numeric = np.column_stack([(R0 @ exp_so3(hv) @ p - R0 @ exp_so3(-hv) @ p) / 2e-6 for hv in 1e-6 * np.eye(3)])
    print('Jacobian -R [p]x against central differences: largest error %.1e' % np.abs(-R0 @ skew(p) - J_numeric).max())
    assert np.abs(-R0 @ skew(p) - J_numeric).max() < 1e-8 and np.allclose(-skew(e_x), [[0, 0, 0], [0, 0, 1], [0, -1, 0]])
    '''),
    code(r'''
    def kabsch(P, Q):
        """R, t minimising sum |R p_i + t - q_i|^2 over matched rows of P and Q (2D or 3D), and d = det(V U^T)."""
        p_bar, q_bar = P.mean(axis=0), Q.mean(axis=0)
        H = (P - p_bar).T @ (Q - q_bar)                    # cross-covariance: the sum of the outer products
        U, _, Vt = np.linalg.svd(H)
        d = np.sign(np.linalg.det(Vt.T @ U.T))
        R = Vt.T @ np.diag([1.] * (len(H) - 1) + [d]) @ U.T
        return R, q_bar - R @ p_bar, d

    square = np.array([[1., 0], [0, 1], [-1, 0], [0, -1]])
    turned = square @ np.array([[0., -1], [1, 0]]).T
    R2, t2, _ = kabsch(square, turned)
    print('square turned by 90 deg: H =', (square.T @ turned).tolist(), ' R =', R2.round(6).tolist(), ' t =', t2)
    assert np.allclose(square.T @ turned, [[0, 2], [-2, 0]]) and np.allclose(R2, [[0, -1], [1, 0]]) and np.allclose(t2, 0)

    P3 = rng.normal(size=(30, 3))
    R3, t3 = exp_so3([0.3, -0.5, 0.8]), np.array([1., -2., 0.5])
    Q3 = P3 @ R3.T + t3 + rng.normal(0, 0.01, P3.shape)
    R_est, t_est, d = kabsch(P3, Q3)
    angle_error = np.degrees(np.linalg.norm(log_so3(R_est.T @ R3)))
    print('3D, noise 0.01: rotation error %.3f deg, translation error %.4f' % (angle_error, np.linalg.norm(t_est - t3)))
    assert angle_error < 0.2 and d == 1
    R_m, _, d_m = kabsch(P3, P3 * [1, 1, -1])            # mirrored targets: no rotation can produce them
    print('mirrored targets: det(V U^T) = %+.0f; the corrected R has det %+.3f' % (d_m, np.linalg.det(R_m)))
    assert d_m == -1 and np.isclose(np.linalg.det(R_m), 1)

    Pc, Qc = P3 - P3.mean(axis=0), Q3 - Q3.mean(axis=0)  # Gauss-Newton on the manifold, from R = I (57 degrees away)
    R_gn = np.eye(3)
    for it in range(6):
        residual = (Pc @ R_gn.T - Qc).ravel()                          # R p_i - q_i, stacked
        J = np.vstack([-R_gn @ skew(p_i) for p_i in Pc])                # 3 rows per point
        R_gn = R_gn @ exp_so3(np.linalg.solve(J.T @ J, -J.T @ residual))
        print('Gauss-Newton iteration %d: cost %.6f' % (it + 1, 0.5 * np.sum((Pc @ R_gn.T - Qc) ** 2)))
    assert np.allclose(R_gn, R_est, atol=1e-8)

    N3, b3 = np.array([[4., 1, 2], [1, 2, 0], [2, 0, 4]]), np.array([3., 1, 2])
    B_s, E_s, C_s, v_s, w_s = N3[0, 0], N3[0, 1:], np.diag(N3)[1:], b3[0], b3[1:]   # C is diagonal here
    delta_c = (v_s - E_s @ (w_s / C_s)) / (B_s - E_s @ (E_s / C_s))
    delta_p = (w_s - E_s * delta_c) / C_s
    print('scalar example: delta_c = %.2f, delta_1, delta_2 = %s' % (delta_c, delta_p))
    assert np.isclose(delta_c, 0.6) and np.allclose(delta_p, [0.2, 0.2]) and np.allclose(np.linalg.solve(N3, b3), [0.6, 0.2, 0.2])

    # A bundle-adjustment-shaped system: 4 cameras (6 unknowns each), 50 points (3 each), each point seen by 3 cameras.
    n_cam, n_pts = 4, 50
    n_c = 6 * n_cam
    blocks = []
    for j in range(n_pts):
        for i in rng.choice(n_cam, 3, replace=False):
            Jrow = np.zeros((2, n_c + 3 * n_pts))                           # one observation, two residuals
            Jrow[:, 6 * i:6 * i + 6] = rng.normal(size=(2, 6))              # depends on one camera ...
            Jrow[:, n_c + 3 * j:n_c + 3 * j + 3] = rng.normal(size=(2, 3))  # ... and one point
            blocks.append(Jrow)
    J_ba = np.vstack(blocks)
    N_ba = J_ba.T @ J_ba + 1e-3 * np.eye(J_ba.shape[1])                     # with Levenberg-Marquardt damping
    g_ba = -J_ba.T @ rng.normal(size=len(J_ba))
    B_blk, E_blk, v_blk, w_blk = N_ba[:n_c, :n_c], N_ba[:n_c, n_c:], g_ba[:n_c], g_ba[n_c:]
    C_inv = np.zeros((3 * n_pts, 3 * n_pts))
    for j in range(n_pts):                                                  # C is block-diagonal: invert 3 x 3 blocks
        s = slice(3 * j, 3 * j + 3)
        C_inv[s, s] = np.linalg.inv(N_ba[n_c:, n_c:][s, s])
    assert np.allclose(N_ba[n_c:, n_c:] * (1 - np.kron(np.eye(n_pts), np.ones((3, 3)))), 0)
    reduced = B_blk - E_blk @ C_inv @ E_blk.T
    delta_cam = np.linalg.solve(reduced, v_blk - E_blk @ C_inv @ w_blk)
    delta_pts = C_inv @ (w_blk - E_blk.T @ delta_cam)
    print('%d residuals, %d unknowns; the reduced camera system is only %d x %d' % (len(J_ba), N_ba.shape[0], *reduced.shape))
    assert np.allclose(np.r_[delta_cam, delta_pts], np.linalg.solve(N_ba, g_ba))
    '''),
    md(r'''
    **Exercise.** Lesson 63's practice questions: (1) Kabsch for (2, 0), (0, 1), (−2, 0), (0, −1) matched to (3, 2), (2, 0), (3, −2), (4, 0); (2) δ = (0, 0, 0.5) applied exactly and to first order; (3) the sizes for 50 cameras and 20,000 points seen 4 times each; (4) the Schur-complement solve of the second 3 × 3 system. Predict each, then run. Then start the Gauss–Newton loop from `exp_so3([2.5, 0, 0])` instead of the identity: does it still reach Kabsch's answer?
    '''),
    code(r'''
    R_ex, t_ex, _ = kabsch(np.array([[2., 0], [0, 1], [-2, 0], [0, -1]]), np.array([[3., 2], [2, 0], [3, -2], [4, 0]]))
    print('R =', R_ex.round(6).tolist(), ' t =', t_ex)
    big = np.array([0., 0., 0.5])
    print('exact', exp_so3(big) @ e_x, ' first order', (np.eye(3) + skew(big)) @ e_x, ' det(I + [delta]x) = %.2f' % np.linalg.det(np.eye(3) + skew(big)))
    cams, pts, seen = 50, 20000, 4
    print('unknowns %d, residuals %d, reduced camera system %d x %d, gauge directions %d' % (6 * cams + 3 * pts, 2 * seen * pts, 6 * cams, 6 * cams, 3 + 3 + 1))
    N4, b4 = np.array([[5., 2, 1], [2, 4, 0], [1, 0, 2]]), np.array([4., 2, 1])
    dc = (b4[0] - N4[0, 1:] @ (b4[1:] / np.diag(N4)[1:])) / (N4[0, 0] - N4[0, 1:] @ (N4[0, 1:] / np.diag(N4)[1:]))
    print('delta_c = %.4f (5/7 = %.4f), points %s' % (dc, 5 / 7, (b4[1:] - N4[0, 1:] * dc) / np.diag(N4)[1:]))
    '''),

    # 8. Volume rendering ------------------------------------------------------------------------
    md(r'''
    ## 8. Volume rendering, Fourier features and PSNR (Lesson 64)
    Light from distance s along a ray reaches the camera with transmittance $T(s)=\exp\bigl(-\int_0^s\sigma\bigr)$. Cutting the ray into intervals of constant density turns the rendering integral into alpha compositing: $\alpha_i=1-e^{-\sigma_i\delta_i}$, $T_i=\prod_{j<i}(1-\alpha_j)$, $w_i=T_i\alpha_i$ and $\hat C=\sum_iw_ic_i+T_{N+1}c_{\text{bg}}$. The weights and the leftover transmittance add up to 1, and $\partial\hat C/\partial c_i=w_i$: a hidden sample gets almost no gradient.

    An MLP fed raw coordinates learns smooth functions first (spectral bias). Fourier features $\gamma(p)=(\sin2^k\pi p,\ \cos2^k\pi p)_{k<L}$ let it represent sharp detail, but frequencies the samples cannot support alias between them. Quality is reported as $\text{PSNR}=-10\log_{10}\text{MSE}$ for intensities in [0, 1].

    **Predict, then run.** Samples at s = 1, 2, 3 have $\sigma\delta=(0,\ \ln2,\ \ln4)$, red at s = 2, blue at s = 3, and the background is white: what colour is the pixel, and what is the expected depth? Training on every second pixel of a row, which input gives the best held-out PSNR: the raw coordinate, L = 4 or L = 8?
    '''),
    code(r'''
    def composite(sigma_delta, colours, background):
        alpha = 1 - np.exp(-np.asarray(sigma_delta, float))
        T = np.concatenate([[1.], np.cumprod(1 - alpha)])             # light reaching each sample, then the background
        w = T[:-1] * alpha
        return w @ colours + T[-1] * background, w, T

    colours = np.array([[0., 1., 0.], [1., 0., 0.], [0., 0., 1.]])   # the first sample is empty, so its green is never seen
    white = np.ones(3)
    sd = [0, np.log(2), np.log(4)]
    pixel, w, T = composite(sd, colours, white)
    depth = w @ [1., 2., 3.] / w.sum()
    print('alpha =', 1 - np.exp(-np.array(sd)), ' T =', T, ' w =', w)
    print('pixel =', pixel, ' expected depth %.3f' % depth)
    assert np.allclose(w, [0, 0.5, 0.375]) and np.isclose(T[-1], 0.125) and np.allclose(pixel, [0.625, 0.125, 0.5])
    assert np.isclose(depth, 17 / 7) and np.isclose(w.sum() + T[-1], 1)
    bumped = colours.copy(); bumped[2, 2] += 1e-6
    dC_dc3 = (composite(sd, bumped, white)[0][2] - pixel[2]) / 1e-6
    print('dC/dc3 (blue channel) = %.4f = w3' % dC_dc3)
    assert np.isclose(dC_dc3, w[2], atol=1e-6)

    K_ray = np.array([[100., 0, 64], [0, 100, 48], [0, 0, 1]])
    direction = np.linalg.inv(K_ray) @ [114, 48, 1]                  # R = I, so d = K^-1 (u, v, 1)
    print('pixel (114, 48) looks along', direction)
    assert np.allclose(direction, [0.5, 0, 1])

    def density(s):
        return 3 * np.exp(-(s - 4) ** 2 / 0.08)                       # a thin bump of matter at s = 4

    def colour_along(s):
        return np.c_[np.clip(s - 3.5, 0, 1), np.zeros_like(s), np.clip(4.5 - s, 0, 1)]

    def render_ray(n, near=2., far=6.):
        edges = np.linspace(near, far, n + 1)
        mids = (edges[:-1] + edges[1:]) / 2
        return composite(density(mids) * np.diff(edges), colour_along(mids), white)[0]

    reference = render_ray(20000)
    for n in [8, 32, 128, 512]:
        print('%4d samples: pixel %s, error %.1e' % (n, render_ray(n), np.abs(render_ray(n) - reference).max()))
    assert np.abs(render_ray(512) - reference).max() < np.abs(render_ray(32) - reference).max() < np.abs(render_ray(8) - reference).max()
    slab = composite(np.full(100, 0.5 * 2 / 100), np.zeros((100, 3)), white)[2][-1]
    print('a slab of density 0.5 and thickness 2 lets through %.3f (e^-1 = %.3f)' % (slab, np.exp(-1)))
    assert np.isclose(slab, np.exp(-1))

    edges = np.array([0.5, 1.5, 2.5, 3.5])                           # the intervals around the three samples
    cdf = np.concatenate([[0.], np.cumsum(w / w.sum())])
    resampled = np.interp([0.3, 0.8], cdf, edges)                     # inverse-transform sampling (Lesson 22)
    print('normalised weights', w / w.sum(), '-> u = 0.3 and 0.8 give s = %.3f and %.3f' % tuple(resampled))
    assert np.allclose(resampled, [1.5 + 0.3 / (4 / 7), 2.5 + (0.8 - 4 / 7) / (3 / 7)])
    '''),
    code(r'''
    def fourier_features(p, L):
        """gamma(p) = (sin 2^0 pi p, cos 2^0 pi p, ..., sin 2^(L-1) pi p, cos 2^(L-1) pi p), for scalar or array p."""
        angles = np.pi * np.asarray(p, float)[..., None] * 2.0 ** np.arange(L)
        return np.stack([np.sin(angles), np.cos(angles)], axis=-1).reshape(*np.shape(p), 2 * L)

    print('gamma(0.25) =', fourier_features(0.25, 3), '\ngamma(0.75) =', fourier_features(0.75, 3))
    assert np.allclose(fourier_features(0.25, 3), [0.7071, 0.7071, 1, 0, 0, -1], atol=1e-4)
    assert np.allclose(fourier_features(0.75, 3), [0.7071, -0.7071, -1, 0, 0, -1], atol=1e-4)

    def psnr(a, b):
        return -10 * np.log10(max(np.mean((np.asarray(a) - np.asarray(b)) ** 2), 1e-10))   # capped at 100 dB
    print('MSE 0.001 -> %.1f dB; halving the RMS error adds %.2f dB' % (psnr(0, np.sqrt(0.001)), 10 * np.log10(4)))
    assert np.isclose(psnr(0, np.sqrt(0.001)), 30)

    # One row of an image: sharp edges on the left, a fine texture on the right. Train on every second pixel.
    n_px = 128
    p_row = np.arange(n_px) / n_px
    signal_row = (0.5 + 0.3 * np.sign(np.sin(2 * np.pi * 3 * p_row)) * (p_row < 0.5)
                  + 0.15 * np.sin(2 * np.pi * 13 * p_row) * (p_row >= 0.5))
    train, test = np.arange(0, n_px, 2), np.arange(1, n_px, 2)

    def fit_mlp(L, steps=1000, hidden=64, lr=0.01, seed=0):
        """A two-layer ReLU MLP trained with Adam on the squared error; L = 0 feeds the raw coordinate."""
        g = np.random.default_rng(seed)
        X = (2 * p_row - 1)[:, None] if L == 0 else fourier_features(p_row, L)
        Xtr, ytr = X[train], signal_row[train][:, None]
        params = [g.normal(0, np.sqrt(2 / X.shape[1]), (X.shape[1], hidden)), np.zeros(hidden),
                  g.normal(0, np.sqrt(1 / hidden), (hidden, 1)), np.zeros(1)]
        first, second = [np.zeros_like(q) for q in params], [np.zeros_like(q) for q in params]
        for it in range(1, steps + 1):
            W1, b1, W2, b2 = params
            pre = Xtr @ W1 + b1
            hid = np.maximum(pre, 0)
            G = 2 * (hid @ W2 + b2 - ytr) / len(ytr)                   # dLoss / dOutput
            Gh = (G @ W2.T) * (pre > 0)
            for q, gq, m1, m2 in zip(params, [Xtr.T @ Gh, Gh.sum(0), hid.T @ G, G.sum(0)], first, second):
                m1 += 0.1 * (gq - m1); m2 += 0.001 * (gq * gq - m2)    # Adam's running moments
                q -= lr * (m1 / (1 - 0.9 ** it)) / (np.sqrt(m2 / (1 - 0.999 ** it)) + 1e-8)
        W1, b1, W2, b2 = params
        prediction = (np.maximum(X @ W1 + b1, 0) @ W2 + b2)[:, 0]
        return psnr(prediction[train], signal_row[train]), psnr(prediction[test], signal_row[test])

    scores = {}
    for L in [0, 2, 4, 6, 8]:
        scores[L] = fit_mlp(L)
        print('%-8s train PSNR %5.1f dB, held-out PSNR %5.1f dB' % ('raw p' if L == 0 else 'L = %d' % L, *scores[L]))
    assert scores[4][1] > scores[0][1] + 3 and scores[8][0] > scores[4][0] and scores[8][1] < scores[0][1]
    fastest = fourier_features(p_row, 8)[:, -1]                       # cos(2^7 pi p), the last feature at L = 8
    print('cos(2^7 pi p) is %+.0f on every training pixel and %+.0f on every held-out pixel: aliasing' % (fastest[train].mean(), fastest[test].mean()))
    assert np.allclose(fastest[train], 1) and np.allclose(fastest[test], -1)
    '''),
    md(r'''
    **Exercise.** Lesson 64's practice questions: (1–2) three samples with σδ = (0.2, 1.0, 2.0), grey colours 0.2, 0.9 and 0.5 at depths 2, 3 and 4 and a white background: α, T, w, the pixel and the expected depth; (3) γ(0.1) with L = 3; (4) the PSNR of an MSE of 0.004. Predict, then run. The last line repeats the L = 8 fit with other initialisations: does the held-out PSNR stay low, and why can no initialisation fix it?
    '''),
    code(r'''
    pix, w_ex, T_ex = composite([0.2, 1.0, 2.0], np.array([[0.2], [0.9], [0.5]]), np.array([1.]))
    print('alpha', 1 - np.exp(-np.array([0.2, 1.0, 2.0])), ' T', T_ex[:3], ' w', w_ex)
    print('background %.4f, total %.4f; pixel %.3f, expected depth %.2f' % (T_ex[-1], w_ex.sum() + T_ex[-1], pix[0], w_ex @ [2, 3, 4] / w_ex.sum()))
    print('gamma(0.1) =', fourier_features(0.1, 3))
    print('MSE 0.004 -> PSNR %.2f dB; a quarter of that MSE -> %.2f dB' % (-10 * np.log10(0.004), -10 * np.log10(0.001)))
    print('L = 8, held-out PSNR with other initialisations:', [round(float(fit_mlp(8, seed=s)[1]), 1) for s in (1, 2, 3)])
    '''),

    # 9. Cross-attention, positions, set loss -----------------------------------------------------
    md(r'''
    ## 9. Cross-attention, sinusoidal positions and a Hungarian-matched set loss (Lesson 65)
    Cross-attention takes its queries from one set and its keys and values from another: $Y=\operatorname{softmax}(QK^T/\sqrt d)\,V$ has one row per query, however many image tokens there are. Sinusoidal encodings $\mathrm{PE}(p)_{2i}=\sin\omega_ip$, $\mathrm{PE}(p)_{2i+1}=\cos\omega_ip$ with $\omega_i=10000^{-2i/D}$ turn every sine–cosine pair by $\omega_i\Delta$ when the position moves by Δ, so $\mathrm{PE}(p)\cdot\mathrm{PE}(p')=\sum_i\cos\omega_i(p-p')$ depends only on the offset. RoPE applies the same rotation to queries and keys directly.

    A set predictor such as DETR outputs N (class, box) pairs and is trained after a one-to-one matching: the assignment that minimises $\sum_i\bigl[-\hat p_{\sigma(i)}(c_i)+\lambda_{\rm giou}\bigl(1-\mathrm{GIoU}(b_i,\hat b_{\sigma(i)})\bigr)+\ldots\bigr]$, found with the Hungarian algorithm of Section 4. GIoU subtracts from the IoU the empty fraction of the smallest enclosing box, so it keeps sloping when the boxes do not overlap.

    **Predict, then run.** For A = [0, 0, 2, 2] and B = [3, 0, 5, 2], what are the IoU and GIoU? What happens to 1 − IoU and to 1 − GIoU as B slides towards A? With D = 4 and ω = (1, 0.01), is PE(0)·PE(1) equal to PE(5)·PE(4)? In the cup-and-spoon example, which prediction is matched to the cup, and which one is trained towards "no object"?
    '''),
    code(r'''
    def softmax_rows(S):
        E = np.exp(S - S.max(axis=1, keepdims=True))
        return E / E.sum(axis=1, keepdims=True)

    q_obj = np.array([[2., 0., 1., 1.]])                              # one object query, d = 4
    keys = np.array([[1., 0., 1., 1.], [0., 1., 0., 0.], [1., 1., 0., 0.]])
    values = np.array([[1., 0.], [0., 1.], [0.5, 0.5]])
    att = softmax_rows(q_obj @ keys.T / np.sqrt(4))
    print('scaled scores', q_obj @ keys.T / 2, ' weights', att, ' output', att @ values)
    assert np.allclose(att, [[0.665, 0.090, 0.245]], atol=1e-3) and np.allclose(att @ values, [[0.788, 0.212]], atol=1e-3)

    rng = np.random.default_rng(65)
    queries, image_tokens = rng.normal(size=(100, 256)), rng.normal(size=(25 * 34, 256))
    weights = softmax_rows(queries @ image_tokens.T / np.sqrt(256))
    print('DETR-sized cross-attention: weights %s = %d scores (self-attention among the tokens: %d); output %s' % (
        weights.shape, weights.size, 850 ** 2, (weights @ image_tokens).shape))
    assert weights.shape == (100, 850) and np.allclose(weights.sum(axis=1), 1)

    def box_area(b):
        return max(b[2] - b[0], 0) * max(b[3] - b[1], 0)

    def iou_giou(a, b):
        inter = box_area([max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])])
        union = box_area(a) + box_area(b) - inter
        enclosing = box_area([min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])])
        return inter / union, inter / union - (enclosing - union) / enclosing

    A_box = [0, 0, 2, 2]
    for x0, expected in [(6, -0.5), (3, -0.2), (2, 0.0), (1, 1 / 3)]:
        iou, giou = iou_giou(A_box, [x0, 0, x0 + 2, 2])
        print('B = [%d, 0, %d, 2]: IoU %.3f, GIoU %+.3f; losses 1 - IoU = %.3f, 1 - GIoU = %.3f' % (x0, x0 + 2, iou, giou, 1 - iou, 1 - giou))
        assert np.isclose(giou, expected)

    def loss_slope(which, x0, h=1e-4):
        loss = lambda x: 1 - iou_giou(A_box, [x, 0, x + 2, 2])[which]
        return (loss(x0 + h) - loss(x0 - h)) / (2 * h)
    print("slope of the losses as B's left edge moves at x0 = 3: 1 - IoU %.3f, 1 - GIoU %.3f" % (loss_slope(0, 3), loss_slope(1, 3)))
    assert loss_slope(0, 3) == 0 < loss_slope(1, 3)
    assert np.isclose(iou_giou([0, 0, 6, 6], [9, 0, 15, 6])[1], -0.2)    # scaling both boxes by 3 changes nothing

    def sinusoidal(p, D, base=10000.):
        omega = base ** (-2 * np.arange(D // 2) / D)
        angles = np.asarray(p, float)[..., None] * omega
        return np.stack([np.sin(angles), np.cos(angles)], axis=-1).reshape(*np.shape(p), D)

    print('PE(0) =', sinusoidal(0, 4), ' PE(1) =', sinusoidal(1, 4))
    dot01, dot54 = sinusoidal(0, 4) @ sinusoidal(1, 4), sinusoidal(5, 4) @ sinusoidal(4, 4)
    print('PE(0).PE(1) = %.4f, PE(5).PE(4) = %.4f, cos 1 + cos 0.01 = %.4f' % (dot01, dot54, np.cos(1) + np.cos(0.01)))
    assert np.isclose(dot01, dot54) and np.isclose(dot01, 1.540, atol=5e-4)
    gram = sinusoidal(np.arange(64), 128) @ sinusoidal(np.arange(64), 128).T
    assert all(np.allclose(np.diag(gram, k), gram[0, k]) for k in range(64))     # constant along diagonals: only the offset counts
    offsets = [0, 1, 2, 4, 8, 16, 32]
    print('D = 128: PE(0).PE(k) for k =', offsets, ':', np.round(gram[0, offsets], 1))
    print('D = 4:   PE(0).PE(k) for k =', offsets, ':', np.round(sinusoidal(np.array(offsets), 4) @ sinusoidal(0, 4), 2))

    def rot2(a):
        return np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    q2, k2, theta = np.array([1., 2.]), np.array([2., 1.]), 0.5
    rope = {(m, n): (rot2(m * theta) @ q2) @ (rot2(n * theta) @ k2) for m, n in [(3, 1), (5, 3), (1, 3)]}
    print('RoPE scores for (m, n):', {key: round(float(val), 3) for key, val in rope.items()})
    assert np.isclose(rope[(3, 1)], rope[(5, 3)]) and np.isclose(rope[(3, 1)], -0.363, atol=1e-3) and np.isclose(rope[(1, 3)], 4.686, atol=1e-3)
    '''),
    code(r'''
    # Two objects, three predictions; matching cost -p(class) + 1 * (1 - GIoU), that is lambda_L1 = 0 and lambda_giou = 1.
    classes = {'cup': 0, 'spoon': 1, 'none': 2}
    targets = [('cup', [0, 0, 2, 2]), ('spoon', [3, 0, 5, 2])]
    pred_boxes = [[0, 0, 2, 2], [0.5, 0, 2.5, 2], [3.5, 0, 5.5, 2]]
    pred_probs = np.array([[0.8, 0.05, 0.15], [0.7, 0.1, 0.2], [0.1, 0.6, 0.3]])     # columns: cup, spoon, no object

    def match_cost(targets, pred_boxes, pred_probs):
        return np.array([[-pred_probs[j, classes[c]] + 1 - iou_giou(b, pred_boxes[j])[1] for j in range(len(pred_boxes))]
                         for c, b in targets])

    cost = match_cost(targets, pred_boxes, pred_probs)
    print('matching cost (rows: cup, spoon; columns: p1, p2, p3):\n', cost)
    assert np.allclose(cost, [[-0.8, -0.3, 1.1727], [1.15, 1.0111, -0.2]], atol=1e-4)
    totals = {cols: cost[[0, 1], list(cols)].sum() for cols in permutations(range(3), 2)}
    for cols, total in sorted(totals.items(), key=lambda kv: kv[1]):
        print('  cup -> p%d, spoon -> p%d: total %+.3f' % (cols[0] + 1, cols[1] + 1, total))
    pairs = hungarian(cost)[0]
    print('Hungarian:', [(targets[i][0], 'p%d' % (j + 1)) for i, j in pairs])
    assert pairs == [(0, 0), (1, 2)] and np.isclose(min(totals.values()), -1.0)

    def set_loss(targets, pred_boxes, pred_probs, no_object_weight=0.1):
        """DETR-style loss after Hungarian matching: cross-entropy for every query (target 'none' if unmatched,
        weighted by 0.1) plus 1 - GIoU for the matched boxes."""
        target_class = np.full(len(pred_boxes), classes['none'])
        box_term = 0.
        for i, j in hungarian(match_cost(targets, pred_boxes, pred_probs))[0]:
            target_class[j] = classes[targets[i][0]]
            box_term += 1 - iou_giou(targets[i][1], pred_boxes[j])[1]
        nll = -np.log(pred_probs[np.arange(len(pred_boxes)), target_class])
        weight = np.where(target_class == classes['none'], no_object_weight, 1.)
        return np.sum(weight * nll) + box_term, target_class

    loss, target_class = set_loss(targets, pred_boxes, pred_probs)
    print('target per query:', [list(classes)[c] for c in target_class], ' set loss %.4f' % loss,
          '(the duplicate p2 pays -ln 0.2 = %.3f, weighted by 0.1)' % -np.log(0.2))
    order = [2, 0, 1]                                                   # list the same predictions in another order
    shuffled, _ = set_loss(targets, [pred_boxes[k] for k in order], pred_probs[order])
    print('the same predictions listed in another order: set loss %.4f' % shuffled)
    assert target_class.tolist() == [0, 2, 1] and np.isclose(loss, shuffled)
    print('assignments brute force would try for N = 100 queries and M = 5 objects: %.1e' % np.prod(np.arange(96., 101.)))
    assert np.isclose(np.prod(np.arange(96., 101.)), 9.03e9, rtol=1e-3)
    '''),
    md(r'''
    **Exercise.** Lesson 65's practice questions: (1) IoU, enclosing area and GIoU for A = [0, 0, 2, 2] with B = [4, 1, 6, 3] and with B = [3, 1, 5, 3]; (2) the token and score counts for an 800 × 1216 image at stride 32 with 100 queries; (3) PE(2) and PE(2)·PE(5) for D = 4; (4) the optimal and greedy matchings for the costs T1: (0.1, 0.3, 0.9) and T2: (0.2, 1.0, 0.8). Predict, then run. Which prediction is trained towards "no object" in (4)?
    '''),
    code(r'''
    for B_ex in ([4, 1, 6, 3], [3, 1, 5, 3]):
        enclosing = box_area([0, 0, max(2, B_ex[2]), max(2, B_ex[3])])
        print('B =', B_ex, ' IoU %.3f, GIoU %.3f' % iou_giou([0, 0, 2, 2], B_ex), ' enclosing area', enclosing)
    tokens = (800 // 32) * (1216 // 32)
    print('image tokens %d, cross-attention entries %d, self-attention entries %d, output rows 100' % (tokens, 100 * tokens, tokens ** 2))
    print('PE(2) =', sinusoidal(2, 4), ' PE(2).PE(5) = %.4f, PE(12).PE(15) = %.4f' % (sinusoidal(2, 4) @ sinusoidal(5, 4), sinusoidal(12, 4) @ sinusoidal(15, 4)))
    costs_ex = np.array([[0.1, 0.3, 0.9], [0.2, 1.0, 0.8]])
    for name, pairs in [('Hungarian', hungarian(costs_ex)[0]), ('greedy', greedy_assignment(costs_ex))]:
        print('%-9s' % name, [('T%d' % (i + 1), 'P%d' % (j + 1)) for i, j in pairs], 'total %.1f' % sum(costs_ex[i, j] for i, j in pairs))
    '''),

    # 10. EM and VAE -----------------------------------------------------------------------------
    md(r'''
    ## 10. Gaussian mixtures, EM, the ELBO and the reparameterisation trick (Lesson 66)
    A Gaussian mixture first picks a hidden component k with probability $\pi_k$, then draws x from $\mathcal N(\mu_k,\Sigma_k)$. EM alternates the E-step, the responsibilities $r_{nk}=\pi_k\mathcal N(x_n;\mu_k,\Sigma_k)\big/\sum_j\pi_j\mathcal N(x_n;\mu_j,\Sigma_j)$, and the M-step, a weighted maximum-likelihood fit with $N_k=\sum_nr_{nk}$, $\mu_k=\frac1{N_k}\sum_nr_{nk}x_n$ and $\pi_k=N_k/N$. Jensen's inequality gives the evidence lower bound $\ln p(x)\ge\mathcal L(q)$, with gap $\mathrm{KL}\bigl(q\,\|\,p(z|x)\bigr)$; the E-step closes the gap and the M-step raises the bound, so the log-likelihood never falls.

    A VAE's encoder outputs $q(z|x)=\mathcal N(\mu,\sigma^2)$, penalised by $\mathrm{KL}\bigl(\mathcal N(\mu,\sigma^2)\,\|\,\mathcal N(0,1)\bigr)=\tfrac12(\mu^2+\sigma^2-1-\ln\sigma^2)$, and samples $z=\mu+\sigma\varepsilon$ with $\varepsilon\sim\mathcal N(0,1)$, so that gradients pass through μ and σ.

    **Predict, then run.** With π = (½, ½), means 0 and 4 and σ = 1, what are the responsibilities of x = 1 and of x = 2? Over 60 EM iterations on 2D data, can the printed log-likelihood ever go down? For μ = 1, σ = 0.5 and ε = −0.4, what are z, ∂L/∂μ and ∂L/∂σ for $L=(z-2)^2$?
    '''),
    code(r'''
    def log_normal_1d(x, mu, sigma):
        return -0.5 * ((x - mu) / sigma) ** 2 - np.log(sigma) - 0.5 * np.log(2 * np.pi)

    def logsumexp(a, axis=-1):
        top = np.max(a, axis=axis, keepdims=True)
        return np.squeeze(top, axis) + np.log(np.sum(np.exp(a - top), axis=axis))

    pis, mus = np.array([0.5, 0.5]), np.array([0., 4.])
    for x in [1., 2.]:
        log_joint = np.log(pis) + log_normal_1d(x, mus, 1.)          # ln(pi_k N(x; mu_k, 1))
        print('x = %.0f: densities %s, responsibilities %s, ln p(x) = %.3f' % (
            x, np.exp(log_normal_1d(x, mus, 1.)), np.exp(log_joint - logsumexp(log_joint)), logsumexp(log_joint)))
    log_joint1 = np.log(pis) + log_normal_1d(1., mus, 1.)
    r1 = np.exp(log_joint1 - logsumexp(log_joint1))
    assert np.allclose(r1, [0.982, 0.018], atol=1e-3) and np.isclose(logsumexp(log_joint1), -2.094, atol=1e-3)
    assert np.allclose(np.exp(log_joint - logsumexp(log_joint)), [0.5, 0.5])          # x = 2, halfway

    points, resp1 = np.array([0., 1., 3., 4.]), np.array([1., 0.8, 0.2, 0.])
    N1 = resp1.sum(); mu1 = resp1 @ points / N1
    var1 = resp1 @ (points - mu1) ** 2 / N1
    print('M-step: N1 = %.1f, mu1 = %.2f, variance %.2f, pi1 = %.2f' % (N1, mu1, var1, N1 / len(points)))
    assert np.allclose([N1, mu1, var1, N1 / 4], [2, 0.7, 0.81, 0.5])

    print('Jensen: ln E[Y] = %.3f >= E[ln Y] = %.3f for Y = 1 or 4' % (np.log(2.5), 0.5 * np.log(4)))

    def elbo(q, log_joint):
        """L(q) = sum_z q(z) ln(p(x, z) / q(z))."""
        q = np.asarray(q, float); nz = q > 0
        return np.sum(q[nz] * (log_joint[nz] - np.log(q[nz])))

    for q in [r1, np.array([1., 0.])]:
        bound = elbo(q, log_joint1)
        gap, kl_qr = logsumexp(log_joint1) - bound, -elbo(q, np.log(r1))     # KL(q || r) = -sum q ln(r / q)
        print('q = %s: bound %.3f, gap to ln p(x) %.3f, KL(q || r) %.3f' % (np.round(q, 3), bound, abs(gap), abs(kl_qr)))
        assert np.isclose(gap, kl_qr)
    assert np.isclose(elbo([1., 0.], log_joint1), -2.112, atol=1e-3)

    for sigma in [1.0, 0.3, 0.05]:                                    # k-means is the limit of a vanishing shared sigma
        lj = np.log(pis) + log_normal_1d(np.array([1., 1.9, 2.1])[:, None], mus, sigma)
        print('sigma = %.2f: first-component responsibilities of x = 1, 1.9, 2.1:' % sigma, np.exp(lj - logsumexp(lj, axis=1)[:, None])[:, 0].round(4))
    '''),
    code(r'''
    def log_normal_2d(X, mu, Sigma):
        diff = X - mu
        return -0.5 * np.einsum('ni,ij,nj->n', diff, np.linalg.inv(Sigma), diff) - 0.5 * np.log(np.linalg.det(Sigma)) - np.log(2 * np.pi)

    def em_gmm(data, K, iterations=60, seed=0):
        """EM for a K-component Gaussian mixture with full covariances, started from K random data points."""
        g = np.random.default_rng(seed)
        means = data[g.choice(len(data), K, replace=False)]
        covs, weights = np.array([np.eye(data.shape[1])] * K), np.full(K, 1 / K)
        history = []
        for _ in range(iterations):
            log_joint = np.column_stack([np.log(weights[k]) + log_normal_2d(data, means[k], covs[k]) for k in range(K)])
            log_px = logsumexp(log_joint, axis=1)
            history.append(log_px.sum())                                  # log-likelihood of the current parameters
            resp = np.exp(log_joint - log_px[:, None])                     # E-step
            Nk = resp.sum(axis=0)                                          # M-step
            means = resp.T @ data / Nk[:, None]
            covs = np.array([(resp[:, k, None] * (data - means[k])).T @ (data - means[k]) / Nk[k] for k in range(K)])
            weights = Nk / len(data)
        return means, covs, weights, np.array(history)

    rng = np.random.default_rng(66)
    true_means = np.array([[0., 0.], [4., 1.], [1., 4.]])
    true_covs = [np.array([[1., 0.3], [0.3, 0.5]]), np.array([[0.6, -0.2], [-0.2, 0.8]]), np.array([[0.4, 0.], [0., 1.2]])]
    counts = [250, 200, 150]
    data = np.vstack([rng.multivariate_normal(m, S, size=n) for m, S, n in zip(true_means, true_covs, counts)])

    means, covs, weights_mix, history = em_gmm(data, 3)
    print('log-likelihood at iterations 1, 2, 3, 6, 11, 21, 60:', np.round(history[[0, 1, 2, 5, 10, 20, 59]], 2))
    print('largest decrease from one iteration to the next: %.1e' % max(0., -np.diff(history).min()))
    assert np.all(np.diff(history) > -1e-8)
    best = list(min(permutations(range(3)), key=lambda order: np.abs(means[list(order)] - true_means).sum()))
    print('fitted means, in the order of the true ones:\n', means[best], '\nweights', weights_mix[best], ' (true %s)' % (np.array(counts) / 600))
    assert np.abs(means[best] - true_means).max() < 0.25 and np.allclose(weights_mix[best], np.array(counts) / 600, atol=0.05)

    def kl_to_standard(mu, sigma):
        return 0.5 * (mu ** 2 + sigma ** 2 - 1 - np.log(sigma ** 2))

    z_samples = 1 + 0.5 * rng.normal(size=400000)                         # z ~ q = N(1, 0.5^2)
    mc_kl = np.mean(log_normal_1d(z_samples, 1, 0.5) - log_normal_1d(z_samples, 0, 1))
    print('KL(N(1, 0.5^2) || N(0, 1)): closed form %.4f, Monte Carlo %.4f' % (kl_to_standard(1, 0.5), mc_kl))
    assert np.isclose(kl_to_standard(1, 0.5), 0.818, atol=5e-4) and abs(mc_kl - kl_to_standard(1, 0.5)) < 0.01 and kl_to_standard(0, 1) == 0

    mu_q, sigma_q, eps = 1.0, 0.5, -0.4
    z = mu_q + sigma_q * eps                                               # the reparameterised sample
    dL_dz = 2 * (z - 2)
    print('z = %.2f, dL/dmu = dL/dz * 1 = %.2f, dL/dsigma = dL/dz * eps = %.2f' % (z, dL_dz, dL_dz * eps))
    loss_of = lambda m, s: (m + s * eps - 2) ** 2
    assert np.isclose(z, 0.8) and np.isclose((loss_of(mu_q + 1e-6, sigma_q) - loss_of(mu_q - 1e-6, sigma_q)) / 2e-6, -2.4)
    assert np.isclose((loss_of(mu_q, sigma_q + 1e-6) - loss_of(mu_q, sigma_q - 1e-6)) / 2e-6, 0.96)
    eps_many = rng.normal(size=1000000)                                    # E[(z - 2)^2] = (mu - 2)^2 + sigma^2
    grad_mu = np.mean(2 * (mu_q + sigma_q * eps_many - 2))
    grad_sigma = np.mean(2 * (mu_q + sigma_q * eps_many - 2) * eps_many)
    print('pathwise gradient of E[(z - 2)^2]: (%.3f, %.3f); exact (2(mu - 2), 2 sigma) = (%.1f, %.1f)' % (grad_mu, grad_sigma, 2 * (mu_q - 2), 2 * sigma_q))
    assert abs(grad_mu + 2) < 0.01 and abs(grad_sigma - 1) < 0.01
    '''),
    md(r'''
    **Exercise.** Lesson 66's practice questions: (1) responsibilities and log-likelihood of x = 0.5 for π = (0.3, 0.7), means 0 and 2 and σ = 1; (2) the M-step for the second component with responsibilities (0, 0.2, 0.8, 1); (3) the KL divergence for μ = (0.5, −1) and σ = (1, 0.5); (4) the bound for q = (0.5, 0.5) at x = 1, and its gap. Predict, then run. Then restart EM from other random starting points: does every start reach the same final log-likelihood?
    '''),
    code(r'''
    lj = np.log([0.3, 0.7]) + log_normal_1d(0.5, np.array([0., 2.]), 1.)
    print('(1) responsibilities', np.exp(lj - logsumexp(lj)), ' ln p(x) = %.3f' % logsumexp(lj))
    resp2 = np.array([0., 0.2, 0.8, 1.]); N2 = resp2.sum(); mu2 = resp2 @ points / N2
    print('(2) N2 = %.1f, mu2 = %.2f, variance %.3f, pi2 = %.2f' % (N2, mu2, resp2 @ (points - mu2) ** 2 / N2, N2 / 4))
    per_dim = kl_to_standard(np.array([0.5, -1.]), np.array([1., 0.5]))
    print('(3) KL per dimension', per_dim, ' total %.3f' % per_dim.sum())
    q_half = np.array([0.5, 0.5])
    print('(4) bound %.3f, gap %.3f, KL(q || r) %.3f' % (elbo(q_half, log_joint1), logsumexp(log_joint1) - elbo(q_half, log_joint1), -elbo(q_half, np.log(r1))))
    for seed in range(1, 6):
        print('EM from start %d: final log-likelihood %.2f' % (seed, em_gmm(data, 3, seed=seed)[3][-1]))
    '''),

    # 11. Diffusion ------------------------------------------------------------------------------
    md(r'''
    ## 11. Diffusion: noising, the optimal denoiser, DDIM and guidance (Lesson 67)
    The forward process shrinks the data and adds a little noise at every step, $q(x_t|x_{t-1})=\mathcal N(\sqrt{1-\beta_t}\,x_{t-1},\ \beta_tI)$. Variances add, so any step can be reached in one jump: $x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\varepsilon$ with $\bar\alpha_t=\prod_{s\le t}(1-\beta_s)$. A network trained with a squared error to predict ε can at best output $\mathbb E[\varepsilon|x_t]$. That is a denoiser, $\hat x_0=(x_t-\sqrt{1-\bar\alpha_t}\,\hat\varepsilon)/\sqrt{\bar\alpha_t}=\mathbb E[x_0|x_t]$, and a score, $\nabla\ln p_t(x_t)=-\hat\varepsilon/\sqrt{1-\bar\alpha_t}$.

    DDIM steps deterministically to the next noise level, $x_{t-1}=\sqrt{\bar\alpha_{t-1}}\,\hat x_0+\sqrt{1-\bar\alpha_{t-1}}\,\hat\varepsilon$. Classifier-free guidance extrapolates from the unconditional prediction towards the conditional one, $\tilde\varepsilon=\varepsilon_\varnothing+w(\varepsilon_c-\varepsilon_\varnothing)$. When the data distribution is known, the optimal denoiser has a closed form, so the sampler below runs without training any network.

    **Predict, then run.** For DDPM's linear schedule (T = 1000, β from 0.0001 to 0.02), near which step is the signal-to-noise ratio 1? For Gaussian data with $s^2=4$ at ᾱ = 0.5, what multiple of $x_t$ is the best estimate of $x_0$? Data lie near −1 or +1; with guidance towards +1, what fraction of DDIM samples land there for w = 0, 1 and 3, and how varied are they?
    '''),
    code(r'''
    rng = np.random.default_rng(67)
    betas = np.linspace(1e-4, 0.02, 1000)
    alpha_bar = np.cumprod(1 - betas)                                   # alpha_bar[t - 1] belongs to step t
    snr = alpha_bar / (1 - alpha_bar)
    print('SNR at t = 1: %.0f; closest to 1 at t = %d; alpha_bar_T = %.1e' % (snr[0], np.argmin(np.abs(snr - 1)) + 1, alpha_bar[-1]))
    assert round(snr[0]) == 9999 and np.argmin(np.abs(snr - 1)) + 1 == 259 and np.isclose(alpha_bar[-1], 4.0e-5, rtol=0.02)

    print('beta = (0.1, 0.2, 0.25): alpha_bar_3 = %.2f' % np.prod(1 - np.array([0.1, 0.2, 0.25])))
    x_t = np.sqrt(0.64) * 2 + np.sqrt(0.36) * -1
    print('alpha_bar = 0.64, x0 = 2, eps = -1: x_t = %.1f; knowing the noise gives back x0 = %.1f' % (x_t, (x_t - 0.6 * -1) / 0.8))
    assert np.isclose(np.prod(1 - np.array([0.1, 0.2, 0.25])), 0.54) and np.isclose(x_t, 1.0)

    x_steps = 2 + 0.5 * rng.normal(size=200000)                          # data N(2, 0.5^2), noised one step at a time
    for b in [0.1, 0.2, 0.25]:
        x_steps = np.sqrt(1 - b) * x_steps + np.sqrt(b) * rng.normal(size=x_steps.size)
    print('after three steps: mean %.4f (one jump: %.4f), variance %.4f (one jump: %.4f)' % (
        x_steps.mean(), np.sqrt(0.54) * 2, x_steps.var(), 0.54 * 0.25 + 0.46))
    assert abs(x_steps.mean() - np.sqrt(0.54) * 2) < 0.01 and abs(x_steps.var() - (0.54 * 0.25 + 0.46)) < 0.01

    s2, ab = 4.0, 0.5                                                    # Gaussian data N(0, 4) at alpha_bar = 0.5
    x0_g, eps_g = 2 * rng.normal(size=400000), rng.normal(size=400000)
    xt_g = np.sqrt(ab) * x0_g + np.sqrt(1 - ab) * eps_g
    var_t = ab * s2 + 1 - ab
    slope_x0, slope_eps = np.sqrt(ab) * s2 / var_t, np.sqrt(1 - ab) / var_t
    fit_x0, fit_eps = (xt_g @ x0_g) / (xt_g @ xt_g), (xt_g @ eps_g) / (xt_g @ xt_g)   # least-squares predictors c * x_t
    print('E[x0 | x_t] = %.3f x_t (fitted to samples: %.3f); E[eps | x_t] = %.3f x_t (fitted: %.3f)' % (slope_x0, fit_x0, slope_eps, fit_eps))
    assert np.isclose(slope_x0, 1.131, atol=1e-3) and np.isclose(slope_eps, 0.283, atol=1e-3)
    assert abs(fit_x0 - slope_x0) < 0.01 and abs(fit_eps - slope_eps) < 0.01
    assert np.isclose((1 - np.sqrt(1 - ab) * slope_eps) / np.sqrt(ab), slope_x0)    # the noise predictor is a denoiser ...
    assert np.isclose(-1 / var_t, -slope_eps / np.sqrt(1 - ab))                    # ... and a score: d/dx ln p_t = -x / var_t

    x0_b = rng.choice([-1., 1.], size=2000000)                           # data -1 or +1 at alpha_bar = 0.64
    xt_b = 0.8 * x0_b + 0.6 * rng.normal(size=x0_b.size)
    near = np.abs(xt_b - 0.5) < 0.01
    print('data -1 or +1: Monte Carlo E[x0 | x_t = 0.5] = %.3f; tanh(0.8 x_t / 0.36) = tanh(2.22 x_t) = %.3f' % (
        x0_b[near].mean(), np.tanh(0.8 * 0.5 / 0.36)))
    assert np.isclose(np.tanh(0.8 * 0.5 / 0.36), 0.804, atol=1e-3) and abs(x0_b[near].mean() - 0.804) < 0.02
    '''),
    code(r'''
    def ddim_step(x_t, eps_hat, ab_t, ab_next):
        x0_hat = (x_t - np.sqrt(1 - ab_t) * eps_hat) / np.sqrt(ab_t)      # estimate the clean value ...
        return np.sqrt(ab_next) * x0_hat + np.sqrt(1 - ab_next) * eps_hat  # ... and re-noise it with the same noise

    print('DDIM step 0.64 -> 0.81 from x_t = 1 with predicted noise -1: %.3f' % ddim_step(1., -1., 0.64, 0.81))
    assert np.isclose(ddim_step(1., -1., 0.64, 0.81), 0.9 * 2 - np.sqrt(0.19))
    print('guidance with eps_none = 0.2, eps_c = 0.5, w = 3: %.1f' % (0.2 + 3 * (0.5 - 0.2)))
    assert np.isclose(0.2 + 3 * (0.5 - 0.2), 1.1)

    centres, spread = np.array([-1., 1.]), 0.3                          # class "minus" N(-1, 0.3^2), class "plus" N(+1, 0.3^2)

    def optimal_eps(x_t, ab, class_weights):
        """E[eps | x_t] for a mixture of Gaussians: responsibilities (Lesson 66) times each component's denoiser (Lesson 60)."""
        var = ab * spread ** 2 + 1 - ab
        log_r = np.log(np.maximum(class_weights, 1e-300)) + log_normal_1d(x_t[:, None], np.sqrt(ab) * centres, np.sqrt(var))
        r = np.exp(log_r - logsumexp(log_r, axis=1)[:, None])
        x0_each = centres + np.sqrt(ab) * spread ** 2 * (x_t[:, None] - np.sqrt(ab) * centres) / var
        x0_hat = np.sum(r * x0_each, axis=1)
        return (x_t - np.sqrt(ab) * x0_hat) / np.sqrt(1 - ab)

    def sample(n, steps=50, w=0.0):
        """DDIM from x_T ~ N(0, 1) with classifier-free guidance towards class "plus"."""
        ts = np.linspace(999, 0, steps + 1).round().astype(int)
        x = rng.normal(size=n)
        for i in range(steps):
            ab_t, ab_next = alpha_bar[ts[i]], (alpha_bar[ts[i + 1]] if i < steps - 1 else 1.0)   # the last step lands on x0
            e_uncond = optimal_eps(x, ab_t, np.array([0.5, 0.5]))
            e_cond = optimal_eps(x, ab_t, np.array([0., 1.]))
            x = ddim_step(x, e_uncond + w * (e_cond - e_uncond), ab_t, ab_next)
        return x

    results = {}
    for w in [0, 1, 3]:
        x = sample(20000, w=w)
        results[w] = ((x > 0).mean(), x[x > 0].mean(), x[x > 0].std())
        print('w = %d: %5.1f%% of the samples near +1; their mean %.3f and spread %.3f (data: 1 and %.1f)' % (w, 100 * results[w][0], results[w][1], results[w][2], spread))
    assert abs(results[0][0] - 0.5) < 0.03 and results[1][0] > 0.99 and results[3][2] < 0.8 * results[1][2]
    '''),
    md(r'''
    **Exercise.** Lesson 67's practice questions: (1) $\bar\alpha_3$, the two scales and the SNR for β = (0.1, 0.2, 0.25), and the noised value of $x_0=1.5$ with ε = 0.4; (2) the optimal denoiser, noise prediction and score for $x_0\sim\mathcal N(0,4)$ at ᾱ = 0.2 and $x_t=1$; (3) one DDIM step from ᾱ = 0.36 to 0.64; (4) guided noise for w = 0, 1 and 3. Predict, then run. Finally DDIM carries Gaussian data N(0, 4) with its exact denoiser: predict whether 10, 50 or 250 steps reach the data's spread of 2.
    '''),
    code(r'''
    ab3 = 0.54
    print('(1) signal %.3f, noise %.3f, SNR %.3f, x3 = %.3f' % (np.sqrt(ab3), np.sqrt(1 - ab3), ab3 / (1 - ab3), np.sqrt(ab3) * 1.5 + np.sqrt(1 - ab3) * 0.4))
    ab, var_t = 0.2, 0.2 * 4 + 0.8
    print('(2) E[x0|x_t] = %.3f, E[eps|x_t] = %.3f, score %.3f' % (np.sqrt(ab) * 4 / var_t, np.sqrt(1 - ab) / var_t, -1 / var_t))
    print('(3) DDIM 0.36 -> 0.64: %.3f' % ddim_step(0.2, 0.5, 0.36, 0.64))
    for w in [0, 1, 3]:
        print('(4) w = %d: guided noise %s' % (w, np.array([0.2, -0.1]) + w * (np.array([0.5, 0.3]) - np.array([0.2, -0.1]))))
    for steps in [10, 50, 250]:
        ts = np.linspace(999, 0, steps + 1).round().astype(int)
        x = rng.normal(size=20000)
        for i in range(steps):
            ab_t, ab_next = alpha_bar[ts[i]], (alpha_bar[ts[i + 1]] if i < steps - 1 else 1.0)
            x = ddim_step(x, np.sqrt(1 - ab_t) * x / (ab_t * 4 + 1 - ab_t), ab_t, ab_next)   # exact E[eps | x_t]
        print('Gaussian data N(0, 4), %3d DDIM steps: sample spread %.3f' % (steps, x.std()))
    '''),

    # 12. Gaussian splatting ---------------------------------------------------------------------
    md(r'''
    ## 12. 3D Gaussian splatting: covariance, projection and compositing (Lesson 68)
    Each Gaussian stores a unit quaternion and three scales and builds $\Sigma=RSS^TR^T$. That matrix is symmetric with $v^T\Sigma v=\|S^TR^Tv\|^2\ge0$ for any parameters, so the optimiser can change them freely. To render, the centre moves into the camera frame, $t=W\mu+t_W$, and the pinhole is linearised there with $J=\begin{bmatrix}f_x/z&0&-f_xx/z^2\\0&f_y/z&-f_yy/z^2\end{bmatrix}$; the splat then has the 2 × 2 covariance $\Sigma'=JW\Sigma W^TJ^T$, the linear-map rule of Section 4. At a pixel, splat i has opacity $\alpha_i=o_i\exp\bigl(-\tfrac12d^T\Sigma_i'^{-1}d\bigr)$, and the depth-sorted splats are blended front to back exactly like the samples along a ray in Section 8.

    **Predict, then run.** S = diag(0.3, 0.1, 0.1) turned by 90° about z: which axis is now the long one? With f = 100 px and Σ = diag(0.01, 0.01, 0.04), what is Σ′ at (0, 0, 2), at (0.4, 0, 2) and at (0, 0, 4)? A red splat with α = 0.5 lies in front of a blue one with α = 0.8: what colour is the pixel, and what changes if they are blended in the wrong order?
    '''),
    code(r'''
    def quat_to_rot(q):
        w, x, y, z = np.asarray(q, float) / np.linalg.norm(q)          # the optimiser's q is normalised first
        return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
                         [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
                         [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]])

    def covariance(q, scales):
        M = quat_to_rot(q) @ np.diag(scales)
        return M @ M.T                                                  # R S S^T R^T

    S_scales = [0.3, 0.1, 0.1]
    for deg in [0, 90, 45]:
        q = [np.cos(np.radians(deg) / 2), 0, 0, np.sin(np.radians(deg) / 2)]   # a turn of deg about z
        print('turn of %2d deg about z, q = %s:\n%s' % (deg, np.round(q, 4), covariance(q, S_scales)))
    assert np.allclose(covariance([np.cos(np.pi / 4), 0, 0, np.sin(np.pi / 4)], S_scales), np.diag([0.01, 0.09, 0.01]))
    Sigma45 = covariance([np.cos(np.pi / 8), 0, 0, np.sin(np.pi / 8)], S_scales)
    assert np.allclose([Sigma45[0, 0], Sigma45[1, 1], Sigma45[0, 1]], [0.05, 0.05, 0.04])

    rng = np.random.default_rng(68)
    for _ in range(5):                                                  # any quaternion and scales give a valid covariance
        q_rand, s_rand = rng.normal(size=4), rng.uniform(0.01, 1, 3)
        Sig, Rq = covariance(q_rand, s_rand), quat_to_rot(q_rand)
        assert np.allclose(Sig, Sig.T) and np.allclose(np.linalg.eigvalsh(Sig), np.sort(s_rand ** 2))
        assert np.allclose(Rq.T @ Rq, np.eye(3)) and np.isclose(np.linalg.det(Rq), 1)
    print('five random quaternions and scales: R is a rotation, Sigma is symmetric with eigenvalues = scales squared')

    def project_covariance(mean_cam, Sigma, f, W=np.eye(3)):
        x, y, z = mean_cam
        J = np.array([[f / z, 0, -f * x / z ** 2], [0, f / z, -f * y / z ** 2]])   # Jacobian of the pinhole at the centre
        return J @ W @ Sigma @ W.T @ J.T, J

    Sigma_d = np.diag([0.01, 0.01, 0.04])
    for centre, expected in [((0, 0, 2), [25, 25]), ((0.4, 0, 2), [29, 25]), ((0, 0, 4), [6.25, 6.25])]:
        S2, J = project_covariance(np.array(centre, float), Sigma_d, 100.)
        print("centre %-12s J = %s   Sigma' = %s" % (centre, J.round(2).tolist(), S2.round(2).tolist()))
        assert np.allclose(S2, np.diag(expected))

    centre = np.array([0.4, 0., 2.])
    pts = rng.multivariate_normal(centre, Sigma_d, size=400000)          # sample the 3D Gaussian, project exactly
    uv = 100 * pts[:, :2] / pts[:, 2:]
    print("covariance of exactly projected samples:\n%s\nlinearised Sigma':\n%s" % (np.cov(uv.T), project_covariance(centre, Sigma_d, 100.)[0]))
    assert np.allclose(np.cov(uv.T), np.diag([29, 25]), rtol=0.1, atol=1)
    '''),
    code(r'''
    def splat_alpha(opacity, Sigma2, offset):
        offset = np.asarray(offset, float)
        return opacity * np.exp(-0.5 * offset @ np.linalg.solve(Sigma2, offset))

    a5 = splat_alpha(0.8, np.diag([29., 25.]), [5, 0])
    print('5 px right of the centre: d2 = %.3f, alpha = %.3f' % (25 / 29, a5))
    assert np.isclose(a5, 0.520, atol=1e-3)

    def blend(alphas, colours):
        """Front-to-back compositing of splats that are already in depth order (the rule of Section 8)."""
        T, C = 1.0, np.zeros(3)
        for a, c in zip(alphas, colours):
            C += T * a * np.asarray(c, float); T *= 1 - a
        return C, T

    red, green, blue = [1, 0, 0], [0, 1, 0], [0, 0, 1]
    (c_right, T_right), (c_wrong, T_wrong) = blend([0.5, 0.8], [red, blue]), blend([0.8, 0.5], [blue, red])
    print('red in front of blue: colour %s, transmittance %.2f; wrong order: colour %s, transmittance %.2f' % (c_right, T_right, c_wrong, T_wrong))
    assert np.allclose(c_right, [0.5, 0, 0.4]) and np.allclose(c_wrong, [0.1, 0, 0.8]) and np.isclose(T_right, T_wrong)

    # Render three splats into a 24 x 48 image: project, sort by depth, blend every pixel front to back.
    splats = [dict(mean=[-0.25, 0.0, 3.0], q=[1, 0, 0, 0.3], scales=[0.30, 0.10, 0.10], opacity=0.9, colour=red),
              dict(mean=[0.0, 0.05, 2.0], q=[1, 0, 0, -0.4], scales=[0.20, 0.06, 0.10], opacity=0.8, colour=green),
              dict(mean=[0.25, -0.05, 4.0], q=[1, 0.2, 0, 0], scales=[0.35, 0.25, 0.10], opacity=0.7, colour=blue)]
    f_px, height, width = 60., 24, 48
    pix_y, pix_x = np.mgrid[0:height, 0:width] + 0.5
    pix = np.stack([pix_x - width / 2, pix_y - height / 2], axis=-1)   # pixel offsets from the principal point

    def render(splats, order):
        image, T = np.zeros((height, width, 3)), np.ones((height, width))
        for k in order:
            s = splats[k]
            mean = np.array(s['mean'], float)
            S2 = project_covariance(mean, covariance(s['q'], s['scales']), f_px)[0] + 0.3 * np.eye(2)   # plus 3DGS's small blur
            d = pix - f_px * mean[:2] / mean[2]
            alpha = s['opacity'] * np.exp(-0.5 * np.einsum('...i,ij,...j->...', d, np.linalg.inv(S2), d))
            image += (T * alpha)[..., None] * np.array(s['colour'], float)
            T *= 1 - alpha
        return image, T

    depth_order = np.argsort([s['mean'][2] for s in splats])          # nearest first: green, red, blue
    front, T_front = render(splats, depth_order)
    back, T_back = render(splats, depth_order[::-1])

    def ascii_art(image, T):
        return [''.join('.' if T[y, x] > 0.8 else 'RGB'[np.argmax(image[y, x])] for x in range(width)) for y in range(0, height, 2)]

    print('sorted by depth (green nearest)'.ljust(width), '   blended back to front')
    for a, b in zip(ascii_art(front, T_front), ascii_art(back, T_back)):
        print(a, '  ', b)
    assert np.allclose(T_front, T_back) and np.allclose(front.sum(axis=-1) + T_front, 1) and not np.allclose(front, back)
    '''),
    md(r'''
    **Exercise.** Lesson 68's practice questions: (1) J and Σ′ for f = 200 px, Σ = diag(0.04, 0.01, 0.09) and a centre at (0.5, −0.2, 2.5); (2) the 2D covariance $R(30^\circ)\operatorname{diag}(4,1)R(30^\circ)^T$ and its determinant; (3) α at offsets (4, 0), (0, 4) and (4, 2) for opacity 0.9 and Σ′ = diag(16, 4); (4) green (α = 0.4), red (0.5) and blue (0.9) composited front to back, then in reverse. Predict, then run. Then move the green splat to depth 5 in `splats` and rerun the renderer: which colour now fills the overlap?
    '''),
    code(r'''
    S2_ex, J_ex = project_covariance(np.array([0.5, -0.2, 2.5]), np.diag([0.04, 0.01, 0.09]), 200.)
    print("(1) J =\n%s\nSigma' =\n%s" % (J_ex, S2_ex))
    c30, s30 = np.cos(np.radians(30)), np.sin(np.radians(30))
    R30 = np.array([[c30, -s30], [s30, c30]])
    Sigma_2d = R30 @ np.diag([4., 1.]) @ R30.T
    print('(2) covariance at 30 deg:\n%s\n    determinant %.3f' % (Sigma_2d, np.linalg.det(Sigma_2d)))
    for offset in [(4, 0), (0, 4), (4, 2)]:
        print('(3) offset %s: alpha %.3f' % (offset, splat_alpha(0.9, np.diag([16., 4.]), offset)))
    for label, (colour, T_left) in [('front to back', blend([0.4, 0.5, 0.9], [green, red, blue])), ('reversed', blend([0.9, 0.5, 0.4], [blue, red, green]))]:
        print('(4) %-13s colour %s, transmittance left %.3f' % (label, colour, T_left))
    '''),
    md(r'''
    ## Write-up for the module artifact
    In a short paragraph, explain (1) why a corner, unlike an edge, has a structure tensor with two large eigenvalues, and how the same matrix decides whether Lucas–Kanade can recover a flow; (2) why the normalised eight-point algorithm beats raw pixels, using the printed epipolar distances, and why depth error grows with $Z^2$; (3) what the compositing weights of a NeRF ray and of depth-sorted splats have in common, and why a network that predicts the noise is also a denoiser. Keep the asserts: they are the evidence that your filters, estimators and samplers are right.
    '''),
]


def build():
    notebook = dict(nbformat=4, nbformat_minor=5,
                    metadata=dict(kernelspec=dict(display_name='Python 3', language='python', name='python3'),
                                  language_info=dict(name='python', version='3')),
                    cells=[dict(id=f'cell-{i:03d}', **cell) for i, cell in enumerate(CELLS)])
    TARGET.write_text(json.dumps(notebook, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {TARGET.relative_to(BASE)}: {sum(c["cell_type"] == "code" for c in CELLS)} code cells, '
          f'{sum(c["cell_type"] == "markdown" for c in CELLS)} markdown cells, no stored outputs.')


if __name__ == '__main__':
    build()
