"""Lesson 62: triangulation, rectification and stereo depth."""


def add(examples, example):
    examples[62] = example("From disparity to depth, and from matching error to depth error", '''
        import numpy as np

        d = {{0}}          # disparity in pixels
        f = {{1}}          # focal length in pixels
        B = {{2}}          # baseline in metres
        sigma_d = {{3}}    # standard deviation of the disparity error, in pixels

        fB = f * B
        Z = fB / d                         # depth of the point
        Z_far = fB / (d - 1)               # one pixel less disparity: farther
        Z_near = fB / (d + 1)              # one pixel more disparity: nearer
        slope = -fB / d**2                 # dZ/dd, which equals -Z**2 / fB
        sigma_Z = abs(slope) * sigma_d     # first-order error propagation
        relative = 100 * sigma_Z / Z

        # Triangulate the same depth with the DLT: P1 = [I | 0], P2 = [I | (-B, 0, 0)], f = 1 units.
        x1, x2 = 0.25, 0.25 - B / Z        # normalised x in each view (the row y = 0.5 is shared)
        P1 = np.hstack([np.eye(3), np.zeros((3, 1))])
        P2 = np.hstack([np.eye(3), [[-B], [0], [0]]])
        A = np.array([x1 * P1[2] - P1[0], 0.5 * P1[2] - P1[1],
                      x2 * P2[2] - P2[0], 0.5 * P2[2] - P2[1]])
        X = np.linalg.svd(A)[2][-1]
        assert np.isclose(X[2] / X[3], Z)  # the null vector puts the point at the same depth
    ''', [("Depth Z (m)", "Z"), ("Depth at d - 1 (m)", "Z_far"), ("Depth at d + 1 (m)", "Z_near"),
          ("Depth error sigma_Z (m)", "sigma_Z"), ("Relative error (%)", "relative")],
        ["Z = fB / d is a hyperbola, so Z_far - Z and Z - Z_near differ: one pixel of disparity is worth more "
         "depth when d is small.",
         "A has shape (4, 4): two rows per view. np.linalg.svd(A)[2][-1] is the right singular vector with the "
         "smallest singular value, the homogeneous point; divide by its last entry before reading it."],
        "Simulate the error: draw 100000 disparities d + sigma_d * np.random.randn(100000), convert each to depth "
        "and compare the standard deviation of the depths with sigma_Z. Try d = 4 with sigma_d = 1 to see the "
        "first-order rule break down.",
        "numpy")
