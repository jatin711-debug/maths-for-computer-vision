"""Lesson 61: epipolar geometry and the eight-point algorithm."""


def add(examples, example):
    examples[61] = example("One point, two views: the epipolar constraint", '''
        import numpy as np

        t_z = {{0}}        # forward part of the step t = (1, 0, t_z)
        yaw_deg = {{1}}    # turn of camera 2 about its vertical (y) axis, in degrees
        depth = {{2}}      # depth Z of the point along the ray through (0.25, 0.5)

        def skew(v):
            """[v]x, the matrix with skew(v) @ w == np.cross(v, w)."""
            return np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])

        a = np.radians(yaw_deg)
        R = np.array([[np.cos(a), 0, np.sin(a)],
                      [0, 1, 0],
                      [-np.sin(a), 0, np.cos(a)]])
        t = np.array([1.0, 0.0, t_z])
        E = skew(t) @ R                      # essential matrix

        x1 = np.array([0.25, 0.5, 1.0])      # normalised point in view 1
        X1 = depth * x1                      # the 3D point in camera-1 coordinates
        X2 = R @ X1 + t                      # the same point in camera-2 coordinates
        x2 = X2 / X2[2]                      # normalised point in view 2

        line = E @ x1                        # epipolar line (a, b, c): a x + b y + c = 0
        residual = x2 @ line                 # x2^T E x1, zero for a true match
        angle = np.degrees(np.arctan(-line[0] / line[1]))
        assert np.isclose(np.linalg.svd(E, compute_uv=False)[2], 0)   # rank 2
    ''', [("View-2 x", "x2[0]"), ("View-2 y", "x2[1]"), ("Epipolar residual", "residual"),
          ("Epipolar line angle (degrees)", "angle"), ("Depth in camera 2", "X2[2]")],
        ["skew(t) @ R has shape (3, 3). E @ x1 is a line, not a point: its three entries are the coefficients "
         "(a, b, c) of a x + b y + c = 0.",
         "The residual is about 1e-17 rather than exactly 0 because of floating-point rounding. The assert checks "
         "that E has rank 2: its smallest singular value is 0."],
        "Make 20 random points with depths between 4 and 9, project them into both views, add noise of 0.002 to "
        "the normalised coordinates, stack the eight-point rows and take np.linalg.svd(A)[2][-1].reshape(3, 3). "
        "Compare it with E / np.linalg.norm(E) up to sign.",
        "numpy")
