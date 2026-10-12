"""Write notebooks/geometry-and-architectures.ipynb for Modules 13-14 (Lessons 49-56).

Run with: python course/build_extension_notebook.py
The notebook is written without outputs; open it in Jupyter and run the cells top to bottom (Python 3 + NumPy only).
"""
from pathlib import Path
import json
import textwrap

BASE = Path(__file__).resolve().parent
TARGET = BASE / 'notebooks' / 'geometry-and-architectures.ipynb'


def md(text):
    return dict(cell_type='markdown', metadata={}, source=textwrap.dedent(text).strip() + '\n')


def code(text):
    return dict(cell_type='code', metadata={}, source=textwrap.dedent(text).strip() + '\n', execution_count=None, outputs=[])


CELLS = [
    md(r'''
    # Geometry and modern architectures · Modules 13–14
    Python 3 and NumPy only, no GPU or framework. Run the cells top to bottom: later cells reuse functions defined earlier.

    Each section follows Lessons 49–56: a short explanation, a **Predict, then run** prompt, a complete demonstration with checks (`assert`), and a small exercise. Write your prediction down before you execute a cell; the interesting part is the gap between the prediction and the output.

    Conventions: 2D points are `(x, y)` with x to the right and y down the image rows; homogeneous points are `(x, y, 1)`; data matrices store one example per row.
    '''),
    code(r'''
    import numpy as np
    np.set_printoptions(precision=4, suppress=True)
    rng = np.random.default_rng(1314)
    print('NumPy', np.__version__)
    '''),

    # 1. Homogeneous 2D transforms -----------------------------------------------------------
    md(r'''
    ## 1. Homogeneous 2D transforms and composition order (Lesson 49)
    Appending a 1 to a point, $\tilde x=(x,y,1)^T$, makes translation a matrix product, so rotation, scaling, translation and their compositions are all 3×3 matrices. A product acts **right to left**: `T @ R @ p` rotates first and translates second. A vector with last coordinate 0 is a direction; translation leaves it unchanged.

    **Predict, then run.** Rotate by 90° and translate by (2, 0). Where does (1, 1) land if you rotate first? If you translate first? Which preserves the angle between the axes: a similarity or a shear?
    '''),
    code(r'''
    def translate(tx, ty):
        return np.array([[1., 0, tx], [0, 1, ty], [0, 0, 1]])

    def rotate(deg):
        c, s = np.cos(np.deg2rad(deg)), np.sin(np.deg2rad(deg))
        return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])

    def scale(s):
        return np.diag([s, s, 1.])

    def to_2d(p):
        return p[:2] / p[2]

    p = np.array([1., 1., 1.])
    T, R = translate(2, 0), rotate(90)
    print('T @ R @ p (rotate, then translate):', to_2d(T @ R @ p))
    print('R @ T @ p (translate, then rotate):', to_2d(R @ T @ p))
    assert np.allclose(to_2d(T @ R @ p), [1, 1]) and np.allclose(to_2d(R @ T @ p), [-1, 3])

    direction = np.array([1., 0., 0.])          # last coordinate 0: a direction, not a position
    print('translate a point:', T @ np.array([1., 0., 1.]), ' translate a direction:', T @ direction)

    M = translate(1, 0) @ rotate(90) @ scale(2)   # a similarity: s = 2, theta = 90 degrees, t = (1, 0)
    print('similarity maps (1, 1) to', to_2d(M @ p))
    assert np.allclose(to_2d(M @ p), [-1, 2])

    def axis_angle(A):
        e1, e2 = A[:2, :2] @ [1., 0.], A[:2, :2] @ [0., 1.]
        return np.degrees(np.arccos(e1 @ e2 / (np.linalg.norm(e1) * np.linalg.norm(e2))))

    shear = np.array([[1., 0.5, 0], [0, 1, 0], [0, 0, 1]])
    print('angle between the mapped axes: similarity %.2f deg, shear %.2f deg' % (axis_angle(M), axis_angle(shear)))
    '''),
    md(r'''
    **Exercise.** Build the matrix that rotates by 90° about the point c = (1, 2) rather than the origin: move c to the origin, rotate, move back. Predict the image of (2, 2) before running, and check that c itself does not move.
    '''),
    code(r'''
    c = np.array([1., 2.])
    about_c = translate(*c) @ rotate(90) @ translate(*(-c))
    print('c maps to', to_2d(about_c @ np.r_[c, 1.]))
    print('(2, 2) maps to', to_2d(about_c @ np.array([2., 2., 1.])))
    '''),

    # 2. DLT homography and inverse warping ----------------------------------------------------
    md(r'''
    ## 2. A homography from four points, and inverse warping (Lesson 50)
    A homography $H$ maps $(x,y,1)$ to $(u',v',w')$, read as $(u'/w',\,v'/w')$. Each correspondence $(x,y)\to(u,v)$ gives two linear equations in the nine entries of $H$; four correspondences give eight, and the direct linear transform (DLT) takes $h$ as the singular vector of the smallest singular value, then scales it so that $h_{33}=1$.

    To warp an image, loop over **output** pixels and ask where each came from: $x = H^{-1}u$. That location is usually between pixels, so sample it bilinearly. Mapping input pixels forward instead leaves holes.

    **Predict, then run.** After warping a checkerboard with a homography, do straight edges stay straight? Do squares stay squares? Is the bilinear sample of a linear ramp exact?
    '''),
    code(r'''
    def dlt(src, dst):
        rows = []
        for (x, y), (u, v) in zip(src, dst):
            rows.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
            rows.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])
        _, singular, Vt = np.linalg.svd(np.array(rows, float))
        H = Vt[-1].reshape(3, 3)
        return H / H[2, 2], singular

    def apply_h(H, pts):
        hom = np.c_[np.asarray(pts, float), np.ones(len(pts))] @ H.T
        return hom[:, :2] / hom[:, 2:]

    src = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], float)
    dst = np.array([[0, 0], [2, 0.2], [1.8, 1.5], [-0.1, 1]], float)
    H, singular = dlt(src, dst)
    print('H =\n', H)
    print('singular values of the 8 x 9 system (the last is 0 for an exact fit):', singular)
    print('max reprojection error:', np.abs(apply_h(H, src) - dst).max())
    assert np.allclose(apply_h(H, src), dst)
    '''),
    code(r'''
    def bilinear(img, x, y):
        """Sample img at real-valued (x, y) = (column, row); NaN outside the image."""
        h, w = img.shape
        x0 = np.clip(np.floor(x).astype(int), 0, w - 2)
        y0 = np.clip(np.floor(y).astype(int), 0, h - 2)
        fx, fy = x - x0, y - y0
        value = (img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx) * (1 - fy) + (img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx) * fy
        inside = (x >= 0) & (x <= w - 1) & (y >= 0) & (y <= h - 1)
        return np.where(inside, value, np.nan)

    yy, xx = np.mgrid[0:6, 0:6]
    ramp = 2. * xx + 3. * yy
    sample = bilinear(ramp, np.array(2.25), np.array(3.5))
    print('bilinear sample of the ramp 2x + 3y at (2.25, 3.5):', sample, ' exact value:', 2 * 2.25 + 3 * 3.5)
    assert np.isclose(sample, 2 * 2.25 + 3 * 3.5)   # bilinear interpolation is exact for linear functions

    # A 24 x 24 checkerboard of 6-pixel squares, warped into a 32 x 32 output.
    yy, xx = np.mgrid[0:24, 0:24]
    board = ((xx // 6 + yy // 6) % 2).astype(float)
    corners_src = np.array([[0, 0], [23, 0], [23, 23], [0, 23]], float)
    corners_dst = np.array([[3, 2], [29, 6], [26, 29], [1, 24]], float)
    Hw, _ = dlt(corners_src, corners_dst)
    out_y, out_x = np.mgrid[0:32, 0:32]
    source = apply_h(np.linalg.inv(Hw), np.c_[out_x.ravel(), out_y.ravel()])   # inverse mapping
    warped = bilinear(board, source[:, 0], source[:, 1]).reshape(32, 32)
    for row in warped[::2]:
        print(''.join(' ' if np.isnan(v) else '#' if v > 0.75 else '+' if v > 0.25 else '.' for v in row[::1]))
    print('pixels with a source inside the board:', int(np.sum(~np.isnan(warped))), 'of', warped.size)
    assert np.allclose(apply_h(Hw, corners_src), corners_dst)
    '''),
    md(r'''
    **Exercise.** Estimate the homography in the other direction, `dlt(dst, src)`. Predict what `H_back @ H` should be (up to scale) and check it. Then move one destination corner by one pixel and see how the warped picture changes.
    '''),
    code(r'''
    H_back, _ = dlt(dst, src)
    product = H_back @ H
    print('H_back @ H, scaled so the corner entry is 1:\n', product / product[2, 2])
    '''),

    # 3. Pinhole projection --------------------------------------------------------------------
    md(r'''
    ## 3. Projecting 3D points with K[R|t] (Lesson 51)
    A world point $X$ moves into camera coordinates with $X_c = RX + t$, where $t=-RC$ for a camera centre $C$. The intrinsic matrix $K=\begin{bmatrix}f&0&c_x\\0&f&c_y\\0&0&1\end{bmatrix}$ then maps it to pixels, and we divide by the depth $Z_c$: $\tilde u = K[R\,|\,t]\tilde X$.

    **Predict, then run.** With $R=I$, $t=(0,0,5)$, $f=500$ and principal point (320, 240), where does the point (1, 0.5, 0) project? When the camera moves further back, do the projected corners of a cube move toward or away from the principal point?
    '''),
    code(r'''
    f, cx, cy = 500., 320., 240.
    K = np.array([[f, 0, cx], [0, f, cy], [0, 0, 1]])

    def project(K, R, t, X):
        Xc = X @ R.T + t                  # camera coordinates, one point per row
        uv = Xc @ K.T
        return uv[:, :2] / uv[:, 2:], Xc[:, 2]

    pixels, depth = project(K, np.eye(3), np.array([0., 0., 5.]), np.array([[1., 0.5, 0.]]))
    print('hand example:', pixels[0], 'depth', depth[0])
    assert np.allclose(pixels[0], [420, 290])

    def rot_y(deg):
        c, s = np.cos(np.deg2rad(deg)), np.sin(np.deg2rad(deg))
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

    cube = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)], float)
    for distance in [5., 10.]:
        R = rot_y(20.)
        C = -distance * R.T @ np.array([0., 0., 1.])   # camera on its own optical axis, looking at the origin
        t = -R @ C
        uv, z = project(K, R, t, cube)
        assert np.all(z > 0), 'every corner must be in front of the camera'
        spread = np.abs(uv - [cx, cy]).max()
        print('distance %4.1f: depths %s, largest offset from the principal point %.1f px' % (distance, np.round(z, 2), spread))
        origin_uv, _ = project(K, R, t, np.zeros((1, 3)))
        assert np.allclose(origin_uv, [[cx, cy]])   # the point we look at lands on the principal point
    '''),
    md(r'''
    **Exercise.** Double the focal length and halve the distance? Predict first: which change makes the image of the cube larger, and do both give the same picture? (Compare the near and far corners: perspective distortion depends on distance, not on f.)
    '''),
    code(r'''
    for f_new, distance in [(500., 10.), (1000., 10.), (500., 5.)]:
        K_new = np.array([[f_new, 0, cx], [0, f_new, cy], [0, 0, 1]])
        R = rot_y(20.); C = -distance * R.T @ np.array([0., 0., 1.])
        uv, z = project(K_new, R, -R @ C, cube)
        print('f = %6.1f, distance = %4.1f, corner offsets x:' % (f_new, distance), np.round(uv[:, 0] - cx, 1))
    '''),

    # 4. RANSAC -------------------------------------------------------------------------------
    md(r'''
    ## 4. RANSAC line fitting versus least squares (Lesson 52)
    Least squares minimises the sum of squared residuals, so a few far-away points can drag the line. RANSAC repeatedly fits the line through two random points, counts the points within a threshold of it, keeps the largest consensus set, and finally refits by least squares on those inliers. With an inlier share $w$ and a minimal sample of $s$ points, $N=\frac{\log(1-p)}{\log(1-w^s)}$ samples give probability $p$ of drawing at least one all-inlier sample.

    **Predict, then run.** 40% of the points are outliers. Which estimate is closer to the true slope 0.5? How many samples does the formula ask for at 99% confidence?
    '''),
    code(r'''
    n_in, n_out = 60, 40
    x_in = rng.uniform(0, 10, n_in); y_in = 0.5 * x_in + 1 + rng.normal(0, 0.2, n_in)
    x_out = rng.uniform(0, 10, n_out); y_out = rng.uniform(-5, 15, n_out)
    xs, ys = np.r_[x_in, x_out], np.r_[y_in, y_out]

    def fit_line(x, y):
        return np.linalg.lstsq(np.c_[x, np.ones_like(x)], y, rcond=None)[0]   # (slope, intercept)

    def ransac_line(x, y, threshold=0.6, iterations=200, seed=0):
        sampler = np.random.default_rng(seed)
        best = np.zeros(len(x), bool)
        for _ in range(iterations):
            i, j = sampler.choice(len(x), 2, replace=False)
            if np.isclose(x[i], x[j]):
                continue
            slope = (y[j] - y[i]) / (x[j] - x[i])
            inliers = np.abs(y - (slope * (x - x[i]) + y[i])) < threshold   # vertical residuals, for simplicity
            if inliers.sum() > best.sum():
                best = inliers
        return fit_line(x[best], y[best]), best

    least_squares = fit_line(xs, ys)
    robust, inliers = ransac_line(xs, ys)
    print('true (slope, intercept): (0.5, 1.0)')
    print('least squares on everything:', least_squares)
    print('RANSAC, refit on %d inliers:' % inliers.sum(), robust)
    print('true inliers recovered:', int(inliers[:n_in].sum()), 'of', n_in, '; outliers accepted:', int(inliers[n_in:].sum()))
    needed = np.log(1 - 0.99) / np.log(1 - 0.6 ** 2)
    print('samples needed for 99%% confidence with 40%% outliers: %.2f -> %d' % (needed, np.ceil(needed)))
    assert abs(robust[0] - 0.5) < 0.05 and abs(robust[1] - 1) < 0.25
    assert abs(robust[0] - 0.5) < abs(least_squares[0] - 0.5)
    '''),
    md(r'''
    **Exercise.** Raise the outlier share to 70% (`n_out = 140`). Predict the new sample count from the formula, then rerun the RANSAC cell with `iterations` set to that number. Why does a threshold of 0.6 (three noise standard deviations) make sense here?
    '''),
    code(r'''
    for outlier_share in [0.4, 0.7]:
        w = 1 - outlier_share
        print('outlier share %.1f: N = %.1f samples' % (outlier_share, np.log(0.01) / np.log(1 - w ** 2)))
    '''),

    # 5. Linear layer gradients -----------------------------------------------------------------
    md(r'''
    ## 5. Gradients of a linear layer (Lesson 53)
    For $Y = XW + b$ with $X$ of shape (N, D) and $W$ of shape (D, M), let $G=\partial L/\partial Y$ (shape N × M). The chain rule, applied entry by entry, gives
    $\frac{\partial L}{\partial W}=X^TG$ (D × M), $\frac{\partial L}{\partial b}=\sum_i G_{i,:}$ (M), $\frac{\partial L}{\partial X}=GW^T$ (N × D). Each gradient has the shape of the thing it differentiates.

    **Predict, then run.** For $L=\tfrac12\lVert XW+b-T\rVert^2$, what is $G$? Which product of X (5 × 3) and G (5 × 2) has the shape of W?
    '''),
    code(r'''
    X = rng.normal(size=(5, 3)); W = rng.normal(size=(3, 2)); b = rng.normal(size=2); T_target = rng.normal(size=(5, 2))

    def layer_loss(W, b, X):
        return 0.5 * np.sum((X @ W + b - T_target) ** 2)

    G = X @ W + b - T_target                 # dL/dY for this loss
    dW, db, dX = X.T @ G, G.sum(axis=0), G @ W.T

    def numeric_grad(fun, A, h=1e-6):
        grad = np.zeros_like(A)
        for idx in np.ndindex(A.shape):
            plus, minus = A.copy(), A.copy()
            plus[idx] += h; minus[idx] -= h
            grad[idx] = (fun(plus) - fun(minus)) / (2 * h)
        return grad

    errors = {'W': np.abs(dW - numeric_grad(lambda A: layer_loss(A, b, X), W)).max(),
              'b': np.abs(db - numeric_grad(lambda A: layer_loss(W, A, X), b)).max(),
              'X': np.abs(dX - numeric_grad(lambda A: layer_loss(W, b, A), X)).max()}
    print('shapes: dW', dW.shape, 'db', db.shape, 'dX', dX.shape)
    print('dW = X^T G =\n', dW)
    print('max |analytic - central difference|:', errors)
    assert all(e < 1e-6 for e in errors.values())
    '''),
    md(r'''
    **Exercise.** Average the loss over the N = 5 rows instead of summing. Predict how dW changes, then confirm it numerically.
    '''),
    code(r'''
    mean_loss = lambda A: layer_loss(A, b, X) / len(X)
    print('ratio numeric(mean) / X^T G:\n', numeric_grad(mean_loss, W) / dW)
    '''),

    # 6. Entropy, KL and label smoothing ---------------------------------------------------------
    md(r'''
    ## 6. Entropy, KL divergence and label smoothing (Lesson 54)
    Entropy $H(p)=-\sum_i p_i\log p_i$ measures the average surprise of $p$ (here in nats). Cross-entropy $H(p,q)=-\sum_i p_i\log q_i$ is the average surprise when you code $p$ with $q$, and $\mathrm{KL}(p\,\|\,q)=H(p,q)-H(p)\ge 0$ is the excess. KL is not symmetric.

    Label smoothing replaces a one-hot target by $(1-\varepsilon)\,\text{one-hot}+\varepsilon/K$. With a hard target the cross-entropy keeps falling as the correct logit grows; with a smoothed target it has a finite minimum, at logit gap $\log\frac{1-\varepsilon+\varepsilon/K}{\varepsilon/K}$.

    **Predict, then run.** For p = (0.5, 0.5) and q = (0.9, 0.1), which is larger: KL(p‖q) or KL(q‖p)? With K = 3 and ε = 0.1, at what logit gap is the smoothed loss smallest?
    '''),
    code(r'''
    def entropy(p):
        p = np.asarray(p, float); nz = p > 0
        return -np.sum(p[nz] * np.log(p[nz]))

    def cross_entropy(p, q):
        p, q = np.asarray(p, float), np.asarray(q, float); nz = p > 0
        return -np.sum(p[nz] * np.log(q[nz]))

    def kl(p, q):
        return cross_entropy(p, q) - entropy(p)

    p, q = np.array([.5, .5]), np.array([.9, .1])
    print('H(p) = %.4f, H(q) = %.4f nats' % (entropy(p), entropy(q)))
    print('KL(p||q) = %.4f, KL(q||p) = %.4f' % (kl(p, q), kl(q, p)))
    assert np.isclose(kl(p, q), 0.5 * np.log(0.5 / 0.9) + 0.5 * np.log(0.5 / 0.1)) and kl(p, q) > kl(q, p) > 0

    def softmax(z):
        e = np.exp(z - z.max())
        return e / e.sum()

    K_classes, eps = 3, 0.1
    smoothed = np.full(K_classes, eps / K_classes); smoothed[0] += 1 - eps
    gaps = np.linspace(0, 8, 801)
    hard = np.array([cross_entropy(np.eye(K_classes)[0], softmax(np.array([g, 0., 0.]))) for g in gaps])
    soft = np.array([cross_entropy(smoothed, softmax(np.array([g, 0., 0.]))) for g in gaps])
    predicted = np.log((1 - eps + eps / K_classes) / (eps / K_classes))
    print('hard-label loss at gaps 2, 4, 8:', hard[[200, 400, 800]])
    print('smoothed loss is smallest at gap %.2f (formula %.3f)' % (gaps[np.argmin(soft)], predicted))
    assert np.all(np.diff(hard) < 0) and abs(gaps[np.argmin(soft)] - predicted) < 0.01
    '''),
    md(r'''
    **Exercise.** Predict KL(p‖p) and KL(p‖(1, 0)) before running. Why is the second one infinite, and what does that say about a model that assigns probability 0 to a class that occurs?
    '''),
    code(r'''
    print('KL(p||p) =', kl(p, p))
    with np.errstate(divide='ignore'):
        print('KL(p||(1, 0)) =', kl(p, np.array([1., 0.])))
    '''),

    # 7. Attention head ----------------------------------------------------------------------
    md(r'''
    ## 7. One attention head, the √d scaling and a gradient check (Lesson 55)
    For tokens $X$ (n × D), one head computes $Q=XW_Q$, $K=XW_K$, $V=XW_V$ (each n × d), scores $S=QK^T/\sqrt d$, weights $A=\operatorname{softmax}(S)$ row by row, and output $AV$. If query and key entries have unit variance, $q\cdot k$ has variance $d$; dividing by $\sqrt d$ keeps the scores at unit scale, so the softmax does not saturate as $d$ grows.

    Backward pass for $L=\sum (AV)\odot C$: $dV=A^TC$, $dA=CV^T$, $dS=A\odot\big(dA-\textstyle\sum_j (dA\odot A)_{:,j}\big)$, $dQ=dS\,K/\sqrt d$, $dK=dS^TQ/\sqrt d$, and $dW_Q=X^TdQ$.

    **Predict, then run.** Without the scaling, how large is the typical score for d = 64, and what happens to the largest weight in each row?
    '''),
    code(r'''
    def softmax_rows(S):
        E = np.exp(S - S.max(axis=1, keepdims=True))
        return E / E.sum(axis=1, keepdims=True)

    for d_head in [4, 64, 256]:
        q_s, k_s = rng.normal(size=(2000, d_head)), rng.normal(size=(8, d_head))
        raw = q_s @ k_s.T
        print('d = %3d: std of q.k = %6.2f, after /sqrt(d) = %.2f; mean largest weight %.2f unscaled vs %.2f scaled' % (
            d_head, raw.std(), (raw / np.sqrt(d_head)).std(), softmax_rows(raw).max(1).mean(), softmax_rows(raw / np.sqrt(d_head)).max(1).mean()))

    n_tok, D, d = 4, 6, 3
    Xt = rng.normal(size=(n_tok, D))
    Wq, Wk, Wv = (rng.normal(size=(D, d)) / np.sqrt(D) for _ in range(3))
    C_up = rng.normal(size=(n_tok, d))          # upstream gradient dL/d(output)

    def head(Wq, Wk, Wv):
        Q, Kt, V = Xt @ Wq, Xt @ Wk, Xt @ Wv
        A = softmax_rows(Q @ Kt.T / np.sqrt(d))
        return A @ V, (Q, Kt, V, A)

    def head_loss(Wq, Wk, Wv):
        return np.sum(head(Wq, Wk, Wv)[0] * C_up)

    out, (Q, Kt, V, A) = head(Wq, Wk, Wv)
    print('attention weights (each row sums to 1):\n', A)
    dV = A.T @ C_up
    dA = C_up @ V.T
    dS = A * (dA - np.sum(dA * A, axis=1, keepdims=True))
    dQ, dK = dS @ Kt / np.sqrt(d), dS.T @ Q / np.sqrt(d)
    dWq, dWk, dWv = Xt.T @ dQ, Xt.T @ dK, Xt.T @ dV
    checks = {'W_Q': np.abs(dWq - numeric_grad(lambda M: head_loss(M, Wk, Wv), Wq)).max(),
              'W_K': np.abs(dWk - numeric_grad(lambda M: head_loss(Wq, M, Wv), Wk)).max(),
              'W_V': np.abs(dWv - numeric_grad(lambda M: head_loss(Wq, Wk, M), Wv)).max()}
    print('max |analytic - central difference|:', checks)
    assert np.allclose(A.sum(axis=1), 1) and all(e < 1e-7 for e in checks.values())
    '''),
    md(r'''
    **Exercise.** Make the keys of tokens 0 and 1 identical (copy row 0 of `Xt` into row 1). Predict the relation between columns 0 and 1 of `A` in every row, then check. Why can attention alone not tell the two tokens apart, and what do positional encodings add?
    '''),
    code(r'''
    X_same = Xt.copy(); X_same[1] = X_same[0]
    A_same = softmax_rows((X_same @ Wq) @ (X_same @ Wk).T / np.sqrt(d))
    print('columns 0 and 1 of A:\n', A_same[:, :2])
    '''),

    # 8. Pyramids ---------------------------------------------------------------------------
    md(r'''
    ## 8. Gaussian and Laplacian pyramids with exact reconstruction (Lesson 56)
    A Gaussian pyramid blurs and keeps every second pixel: $G_{k+1}=\operatorname{down}_2(g*G_k)$. The blur removes detail that the coarser grid would alias. The Laplacian pyramid stores what each halving lost, $L_k=G_k-\operatorname{up}(G_{k+1})$, with the small image $G_n$ on top. Rebuilding with $G_k=L_k+\operatorname{up}(G_{k+1})$ is exact for any blur and any upsampling, as long as the same `up` is used both ways. Feature pyramid networks and U-Net reuse this pattern: coarse context is upsampled and combined with finer, stored detail.

    **Predict, then run.** How many numbers does a 4-level Laplacian pyramid of a 64 × 64 image store? If $L_0$ is set to zero, what exactly is the error image?
    '''),
    code(r'''
    BINOMIAL = np.array([1., 4., 6., 4., 1.]) / 16

    def blur(img, kernel=BINOMIAL):
        r = len(kernel) // 2
        padded = np.pad(img, r, mode='reflect')
        rows = sum(w * padded[:, i:i + img.shape[1]] for i, w in enumerate(kernel))       # horizontal pass
        return sum(w * rows[i:i + img.shape[0], :] for i, w in enumerate(kernel))        # vertical pass

    def down(img, kernel=BINOMIAL):
        return blur(img, kernel)[::2, ::2]

    def up(small, shape, kernel=BINOMIAL):
        z = np.zeros(shape); z[::2, ::2] = small
        return 4 * blur(z, kernel)        # insert zeros, then interpolate; the 4 restores the brightness

    def pyramids(img, levels, kernel=BINOMIAL):
        G = [img]
        for _ in range(levels - 1):
            G.append(down(G[-1], kernel))
        L = [G[k] - up(G[k + 1], G[k].shape, kernel) for k in range(levels - 1)] + [G[-1]]
        return G, L

    def rebuild(L, kernel=BINOMIAL, zero_finest=0):
        R = L[-1]
        for k in range(len(L) - 2, -1, -1):
            R = up(R, L[k].shape, kernel) + (0 if k < zero_finest else L[k])
        return R

    yy, xx = np.mgrid[0:64, 0:64]
    image = 100 * ((xx - 30) ** 2 + (yy - 34) ** 2 < 15 ** 2) + 40 * (np.sin(xx / 1.5) > 0) + rng.normal(0, 5, (64, 64))
    G, L = pyramids(image, 4)
    print('level shapes:', [g.shape for g in G])
    print('numbers stored: %d = %.3f x the image' % (sum(l.size for l in L), sum(l.size for l in L) / image.size))
    print('RMS of each Laplacian level:', [round(float(np.sqrt(np.mean(l ** 2))), 2) for l in L[:-1]], ' mean of the top:', round(float(L[-1].mean()), 2))
    exact = np.abs(rebuild(L) - image).max()
    print('rebuild error (all levels):', exact)
    no_fine = image - rebuild(L, zero_finest=1)
    print('error with L0 set to zero equals L0 exactly:', np.allclose(no_fine, L[0]), ' RMS', round(float(np.sqrt(np.mean(no_fine ** 2))), 2))
    for drop in [2, 3]:
        print('RMS error with the finest %d levels set to zero: %.2f' % (drop, np.sqrt(np.mean((image - rebuild(L, zero_finest=drop)) ** 2))))
    assert exact < 1e-10 and np.allclose(no_fine, L[0])
    '''),
    md(r'''
    **Exercise.** Replace the binomial kernel by the shorter (1, 2, 1)/4, and by the pair average (1, 1)/2, which makes `up` repeat each pixel as in the lesson's 1D example. Predict whether reconstruction stays exact in each case, then run. Finally, connect to Lesson 56: in an FPN, which operation plays the role of `up`, and what plays the role of the stored $L_k$?
    '''),
    code(r'''
    for kernel in [BINOMIAL, np.array([1., 2., 1.]) / 4, np.array([1., 1.]) / 2]:
        Gk, Lk = pyramids(image, 4, kernel)
        print('kernel %-28s rebuild error %.1e, RMS of L0 %.2f' % (np.round(kernel, 4), np.abs(rebuild(Lk, kernel) - image).max(), np.sqrt(np.mean(Lk[0] ** 2))))
    '''),
    md(r'''
    ## Write-up for the module artifact
    In a short paragraph, explain (1) why the attention scores are divided by $\sqrt d$, using the printed standard deviations, (2) what `dW = X.T @ G` means entry by entry, and (3) why the Laplacian pyramid rebuilds exactly while upsampling alone does not, and what an FPN level adds that a single feature map lacks. Keep the asserts: they are the evidence that your gradients and reconstructions are right.
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
