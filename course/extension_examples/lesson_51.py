"""Lesson 51: the pinhole camera, rotations and calibration."""


def add(examples, example):
    examples[51] = example("Project one point through a pinhole camera", '''
        import numpy as np

        f = {{0}}                      # focal length in pixels
        Z = {{1}}                      # depth in metres
        X = {{2}}                      # lateral position in metres
        width, cx, cy = 640, 320.0, 240.0
        K = np.array([[f, 0.0, cx],
                      [0.0, f, cy],
                      [0.0, 0.0, 1.0]])

        point_cam = np.array([X, 0.0, Z])   # already in the camera frame: R = I, t = 0
        uvw = K @ point_cam                  # homogeneous pixel; the third entry is the depth
        u = uvw[0] / uvw[2]

        x_norm = X / Z
        offset = u - cx
        pixels_per_metre = f / Z
        fov_deg = np.degrees(2 * np.arctan(width / (2 * f)))

        # Twice as wide and twice as far: the same pixel.
        uvw_far = K @ (2 * point_cam)
        assert np.isclose(uvw_far[0] / uvw_far[2], u)
    ''', [("Normalized x = X/Z", "x_norm"), ("Offset from the principal point (px)", "offset"),
          ("Pixel u", "u"), ("Pixels per metre at depth Z", "pixels_per_metre"),
          ("Horizontal field of view (degrees)", "fov_deg")],
        ["K @ point gives (u·Z, v·Z, Z); dividing by the last entry is the perspective division. "
         "Check that the depth is positive before dividing in real code.",
         "For a world point, first move it into the camera frame with R @ X_world + t, "
         "or use the 3 × 4 matrix K @ np.hstack([R, t[:, None]]) on (X, Y, Z, 1)."],
        "Add a rotation: build R for a 10° turn about the y axis with np.cos and np.sin, check "
        "R.T @ R = I and np.linalg.det(R) = 1, and project R @ point_cam. Then apply radial "
        "distortion x_d = x(1 + k1 r²) with k1 = -0.2 before multiplying by K.",
        "numpy")
