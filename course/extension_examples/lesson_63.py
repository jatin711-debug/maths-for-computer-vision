"""Lesson 63: rotations as a manifold, point-set alignment and bundle adjustment."""


def add(examples, example):
    examples[63] = example("Kabsch on four matched points", '''
        import numpy as np

        theta_deg = {{0}}   # turn of the targets, in degrees
        t_x = {{1}}         # shift of the targets along x
        mirror = {{2}}      # 1: mirror the targets in the x axis first (no rotation can undo that)

        P = np.array([[2.0, 0.0], [0.0, 1.0], [-2.0, 0.0], [0.0, -1.0]])   # source points, one per row
        a = np.radians(theta_deg)
        R_true = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
        M = np.diag([1.0, -1.0]) if mirror >= 0.5 else np.eye(2)
        Q = P @ M.T @ R_true.T + [t_x, 0.0]                               # targets q_i = R M p_i + t

        p_bar, q_bar = P.mean(axis=0), Q.mean(axis=0)
        H = (P - p_bar).T @ (Q - q_bar)          # cross-covariance: sum of outer products p~ q~^T
        U, S, Vt = np.linalg.svd(H)
        V = Vt.T
        d = np.sign(np.linalg.det(V @ U.T))      # -1 means the best orthogonal fit is a reflection
        R = V @ np.diag([1.0, d]) @ U.T          # the best proper rotation
        t = q_bar - R @ p_bar

        residual = P @ R.T + t - Q
        rms = np.sqrt((residual ** 2).sum(axis=1).mean())
        angle = np.degrees(np.arctan2(R[1, 0], R[0, 0]))
        assert np.isclose(np.linalg.det(R), 1)
    ''', [("Recovered angle (degrees)", "angle"), ("det(V U^T)", "d"), ("Recovered t_x", "t[0]"),
          ("Recovered t_y", "t[1]"), ("RMS residual", "rms")],
        ["P and Q hold one point per row, so (P - p_bar).T @ (Q - q_bar) adds up the outer products of matching "
         "rows. np.linalg.svd returns V transposed (Vt), so V = Vt.T.",
         "NumPy may flip the signs of matching columns of U and V compared with the lesson; V @ U.T, and so R, "
         "does not change. For 3D points use np.diag([1, 1, d])."],
        "Add noise with np.random.default_rng(0).normal(0, 0.05, Q.shape) to the targets and watch the angle and "
        "the RMS residual. Then try a 3D version: build P as 10 random 3D points and rotate them about the z axis.",
        "numpy")
