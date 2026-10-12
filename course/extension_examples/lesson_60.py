"""Lesson 60: multivariate Gaussians, Kalman filtering and data association."""


def add(examples, example):
    examples[60] = example("One Kalman predict-update step for position and velocity", '''
        import numpy as np

        z = {{0}}           # measured position
        R = {{1}}           # measurement variance
        q = {{2}}           # process noise: variance of a random acceleration

        x = np.array([0.0, 1.0])                  # position 0, velocity 1
        P = np.eye(2)
        F = np.array([[1.0, 1.0], [0.0, 1.0]])    # p <- p + v
        Q = q * np.array([[0.25, 0.5], [0.5, 1.0]])
        H = np.array([[1.0, 0.0]])                # only the position is measured

        # Predict: the linear-transform rule A x ~ N(A mu, A Sigma A^T), plus independent noise.
        x_pred = F @ x
        P_pred = F @ P @ F.T + Q

        # Update: condition the joint Gaussian of (state, measurement) on the observed z.
        y = z - (H @ x_pred)[0]                   # innovation
        S = (H @ P_pred @ H.T)[0, 0] + R          # its variance
        K = P_pred @ H.T[:, 0] / S                # Kalman gain
        x_new = x_pred + K * y
        P_new = P_pred - S * np.outer(K, K)       # = (I - K H) P_pred
        assert np.allclose(P_new, (np.eye(2) - np.outer(K, H[0])) @ P_pred)
        d2 = y * y / S                            # gate: compare with 3.84 (95%, 1 dimension)
    ''', [("Predicted position", "x_pred[0]"), ("Predicted P11", "P_pred[0, 0]"), ("Predicted P12", "P_pred[0, 1]"),
          ("Innovation", "y"), ("Innovation variance S", "S"), ("Gain for position", "K[0]"), ("Gain for velocity", "K[1]"),
          ("Updated position", "x_new[0]"), ("Updated velocity", "x_new[1]"), ("Updated P11", "P_new[0, 0]"),
          ("Updated P12", "P_new[0, 1]"), ("Updated P22", "P_new[1, 1]"), ("Gate distance d2", "d2")],
        ["H has shape (1, 2), so H @ P_pred @ H.T is a 1 x 1 matrix; [0, 0] takes its single entry. For a "
         "vector measurement S is a matrix and K = P_pred @ H.T @ np.linalg.inv(S).",
         "The velocity changes by K[1] * y although it is never measured: K[1] is P_pred[1, 0] / S, the "
         "position-velocity covariance created by the prediction.",
         "For data association, scipy.optimize.linear_sum_assignment(cost) returns the optimal (Hungarian) "
         "assignment of tracks to detections."],
        "Loop the predict-update step over ten measurements z = 2, 3, 4, ... and print the velocity: it converges "
        "to 1 per step. Then set q = 1 and compare how fast it follows a change in speed.",
        "numpy")
