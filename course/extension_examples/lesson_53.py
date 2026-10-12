"""Lesson 53: matrix calculus for layers and losses."""


def add(examples, example):
    examples[53] = example("Differentiate a quadratic form and check it numerically", '''
        import numpy as np

        a12 = {{0}}                       # the only off-diagonal entry; a21 = 0
        x1 = {{1}}
        A = np.array([[1.0, a12],
                      [0.0, 3.0]])
        x = np.array([x1, 1.0])

        f = x @ A @ x                     # x^T A x, a scalar
        gradient = (A + A.T) @ x          # correct for any square A
        wrong = 2 * A @ x                 # correct only when A is symmetric

        h = 1e-3                          # central difference along e1
        e1 = np.array([1.0, 0.0])
        central = ((x + h * e1) @ A @ (x + h * e1) - (x - h * e1) @ A @ (x - h * e1)) / (2 * h)

        # The same check, entry by entry, for a linear layer's loss sum((X W - Y)**2) with respect to W.
        rng = np.random.default_rng(0)
        X, W, Y = rng.normal(size=(4, 3)), rng.normal(size=(3, 2)), rng.normal(size=(4, 2))
        dW = 2 * X.T @ (X @ W - Y)        # shape (3, 2), like W
        numeric = np.zeros_like(W)
        for index in np.ndindex(W.shape):
            step = np.zeros_like(W)
            step[index] = 1e-5
            numeric[index] = (np.sum((X @ (W + step) - Y) ** 2) - np.sum((X @ (W - step) - Y) ** 2)) / 2e-5
        layer_error = np.max(np.abs(dW - numeric) / np.maximum(1e-8, np.abs(dW) + np.abs(numeric)))
    ''', [("f(x)", "f"), ("Correct gradient, x1", "gradient[0]"), ("Correct gradient, x2", "gradient[1]"),
          ("2Ax (wrong), x1", "wrong[0]"), ("2Ax (wrong), x2", "wrong[1]"), ("Central difference, x1", "central")],
        ["x has shape (2,), so x @ A @ x is a scalar and the gradient (A + A.T) @ x has shape (2,), like x. With a12 = 0, A is diagonal and both formulas agree.",
         "The layer check perturbs one entry of W at a time; dW = 2 X.T (XW - Y) has W's shape (3, 2). layer_error is not printed; it should be tiny, 1e-10 or below."],
        "Print layer_error, then replace dW by 2 * (X @ W - Y).T @ X: what does NumPy report, and why does a shape check catch this bug but not 2 * A @ x?",
        "numpy")
