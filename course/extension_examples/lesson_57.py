"""Lesson 57: image gradients, the structure tensor and corners."""


def add(examples, example):
    examples[57] = example("Structure tensor and Harris score of a four-pixel window", '''
        import numpy as np

        theta1 = {{0}}      # direction of gradients 1 and 2 (degrees; y points down the image)
        theta2 = {{1}}      # direction of gradients 3 and 4 (degrees)
        g2 = {{2}}          # strength of gradients 3 and 4
        k = {{3}}           # Harris constant

        t1, t2 = theta1 * np.pi / 180, theta2 * np.pi / 180
        u1 = np.array([np.cos(t1), np.sin(t1)])
        u2 = g2 * np.array([np.cos(t2), np.sin(t2)])
        grads = np.array([u1, u1, u2, u2])     # one row (Ix, Iy) per pixel of the window

        M = np.zeros((2, 2))
        for g in grads:
            M += np.outer(g, g)                # Ix^2, Ix*Iy, Iy^2 summed over the window
        a, b, c = M[0, 0], M[0, 1], M[1, 1]

        mid = (a + c) / 2
        half_gap = np.sqrt(((a - c) / 2) ** 2 + b ** 2)
        lam1, lam2 = mid + half_gap, mid - half_gap
        assert np.allclose(np.linalg.eigvalsh(M)[::-1], [lam1, lam2])

        det = a * c - b * b                    # = lam1 * lam2
        trace = a + c                          # = lam1 + lam2
        R = det - k * trace ** 2               # Harris score: > 0 corner, < 0 edge
    ''', [("M11 (sum of Ix squared)", "a"), ("M12 (sum of Ix times Iy)", "b"), ("M22 (sum of Iy squared)", "c"),
          ("Larger eigenvalue", "lam1"), ("Smaller eigenvalue", "lam2"), ("det M", "det"), ("tr M", "trace"),
          ("Harris R", "R")],
        ["grads has shape (4, 2): one gradient per pixel. np.outer(g, g) is the 2 x 2 matrix g g^T, and "
         "grads.T @ grads gives the same sum in one step.",
         "The closed-form eigenvalues of a symmetric 2 x 2 matrix avoid a general solver; the assert checks "
         "them against np.linalg.eigvalsh, which returns them in ascending order.",
         "On a real image, Ix and Iy come from a derivative-of-Gaussian filter, for example "
         "scipy.ndimage.gaussian_filter(img, sigma, order=(0, 1)) for Ix, and each entry of M is "
         "blurred with a second Gaussian instead of summed over four pixels."],
        "Set theta2 equal to theta1 and watch the smaller eigenvalue drop to 0. Then load "
        "skimage.data.camera(), compute the Harris response with skimage.feature.corner_harris and "
        "compare its sign on an edge and at a corner.",
        "numpy")
