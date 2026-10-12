"""Lesson 68: 3D Gaussian splatting."""


def add(examples, example):
    examples[68] = example("Project one 3D Gaussian to a 2D splat", '''
        import numpy as np

        x = {{0}}          # horizontal position of the centre (m); y = 0
        z = {{1}}          # depth (m)
        theta_deg = {{2}}  # rotation of the Gaussian about the vertical axis
        opacity = {{3}}
        f = 100.0          # focal length in pixels; the camera rotation W is the identity

        th = theta_deg * np.pi / 180
        c, s = np.cos(th), np.sin(th)
        R = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])      # rotation about the y-axis
        S = np.diag([0.1, 0.1, 0.2])                          # standard deviations along the Gaussian's axes
        Sigma = R @ S @ S.T @ R.T                             # always a valid covariance

        J = np.array([[f / z, 0, -f * x / z**2],
                      [0, f / z, 0]])                         # Jacobian of the pinhole projection at (x, 0, z)
        Sigma2 = J @ Sigma @ J.T                              # 2 x 2 covariance of the splat, in px^2

        d = np.array([5.0, 0.0])                              # a pixel 5 px to the right of the centre
        d2 = d @ np.linalg.solve(Sigma2, d)
        alpha = opacity * np.exp(-0.5 * d2)

        sigma_xz = Sigma[0, 2]
        J13 = J[0, 2]
        var_x, var_y = Sigma2[0, 0], Sigma2[1, 1]
    ''', [("3D covariance Sigma_xz", "sigma_xz"), ("Jacobian entry J13", "J13"),
          ("Projected variance Sigma'_xx (px^2)", "var_x"), ("Projected variance Sigma'_yy (px^2)", "var_y"),
          ("Alpha 5 px right of the centre", "alpha")],
        ["R @ S @ S.T @ R.T is symmetric and never negative in any direction, so the optimiser can change R and S freely.",
         "J is the derivative of (f x / z, f y / z) with respect to (x, y, z); Sigma2 = J Sigma J^T is the rule "
         "Cov(Ax) = A Sigma A^T for the linearised projection.",
         "np.linalg.solve(Sigma2, d) computes Sigma2^-1 d without forming the inverse explicitly."],
        "Composite two splats at the same pixel: put a red one with this alpha in front of a blue one with alpha 0.8, "
        "then swap their order and compare the colours and the remaining transmittance.",
        "numpy")
