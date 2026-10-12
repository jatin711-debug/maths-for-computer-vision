"""Lesson 59: optical flow and direct image alignment."""


def add(examples, example):
    examples[59] = example("Lucas-Kanade on a four-pixel window", '''
        import numpy as np

        theta = {{0}}       # gradient direction of pixels 3 and 4 (degrees); pixels 1 and 2 have gradient (1, 0)
        u_true = {{1}}      # true flow to the right (pixels)
        v_true = {{2}}      # true flow downwards (pixels)
        err = {{3}}         # error added to the temporal difference of pixel 4

        t = theta * np.pi / 180
        g = (np.cos(t), np.sin(t))
        grads = [(1.0, 0.0), (1.0, 0.0), g, g]                      # (Ix, Iy) of each pixel
        It = [-(gx * u_true + gy * v_true) for gx, gy in grads]      # brightness constancy
        It[3] += err

        a = b = c = rhs1 = rhs2 = 0.0
        for (gx, gy), it in zip(grads, It):
            a += gx * gx; b += gx * gy; c += gy * gy                 # M = sum of grad grad^T
            rhs1 -= gx * it; rhs2 -= gy * it                         # -sum of grad * It

        # Solve M d = rhs through the eigenvectors of M, skipping a zero eigenvalue (minimum-norm least squares).
        mid, half = (a + c) / 2, np.sqrt(((a - c) / 2) ** 2 + b * b)
        lam1, lam2 = mid + half, mid - half
        e1 = np.array([b, lam1 - a]) if abs(b) > 1e-12 else np.array([1.0, 0.0] if a >= c else [0.0, 1.0])
        e1 = e1 / np.linalg.norm(e1)
        e2 = np.array([-e1[1], e1[0]])
        d = np.zeros(2)
        for lam, e in ((lam1, e1), (lam2, e2)):
            if lam > 1e-9 * lam1 and lam > 0:
                d += (e @ np.array([rhs1, rhs2])) / lam * e
        u, v = d
        A = np.array(grads)
        assert np.allclose(d, np.linalg.lstsq(A, -np.array(It), rcond=None)[0], atol=1e-6)
        epe = np.hypot(u - u_true, v - v_true)
    ''', [("M11", "a"), ("M12", "b"), ("M22", "c"), ("Right-hand side 1", "rhs1"), ("Right-hand side 2", "rhs2"),
          ("Estimated u", "u"), ("Estimated v", "v"), ("Smaller eigenvalue of M", "lam2"), ("Endpoint error", "epe")],
        ["Each pixel contributes one row (Ix, Iy) of A and one entry of -It; M = A^T A and rhs = -A^T It are the "
         "normal equations of Lesson 10.",
         "np.linalg.lstsq returns the minimum-norm least-squares solution, the same answer as skipping the zero "
         "eigenvalue, so the assert also holds when theta = 0 and v is undetermined.",
         "On real frames, cv2.calcOpticalFlowPyrLK(prev, next, points, None, winSize=(11, 11), maxLevel=2) runs this "
         "solve iteratively at every pyramid level."],
        "Set theta = 15 and err = 0.5 and compare the endpoint error with theta = 90. Then compute the "
        "condition number lam1 / lam2 for both cases.",
        "numpy")
