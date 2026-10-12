"""Lesson 50: homographies, warping and resampling."""


def add(examples, example):
    examples[50] = example("Bilinear interpolation inside one 2 × 2 neighbourhood", '''
        import numpy as np

        alpha = {{0}}                   # fraction of a pixel to the right of the top-left centre
        beta = {{1}}                    # fraction of a pixel below it
        patch = np.array([[20.0, 100.0],    # top row:    I00, I10
                          [60.0, 40.0]])    # bottom row: I01, I11

        top = (1 - alpha) * patch[0, 0] + alpha * patch[0, 1]
        bottom = (1 - alpha) * patch[1, 0] + alpha * patch[1, 1]
        value = (1 - beta) * top + beta * bottom

        weights = np.array([[(1 - alpha) * (1 - beta), alpha * (1 - beta)],
                            [(1 - alpha) * beta, alpha * beta]])
        assert np.isclose(weights.sum(), 1) and np.isclose((weights * patch).sum(), value)

        col = int(np.floor(alpha + 0.5))  # round half up, like the lesson
        row = int(np.floor(beta + 0.5))
        nearest = patch[row, col]
        slope = (1 - beta) * (patch[0, 1] - patch[0, 0]) + beta * (patch[1, 1] - patch[1, 0])
    ''', [("Top-row blend", "top"), ("Bottom-row blend", "bottom"), ("Bilinear value", "value"),
          ("Nearest-neighbour value", "nearest"), ("Slope along alpha", "slope")],
        ["patch[row, col] follows array order: the first index moves down, the second moves right. "
         "alpha is a horizontal offset, so it multiplies the column difference.",
         "The four weights are the areas of the rectangles opposite each pixel; the assert checks that "
         "they sum to 1 and reproduce the two-stage blend.",
         "Python's round() rounds 0.5 to the nearest even number, so the nearest pixel uses floor(t + 0.5) "
         "to match the lesson's round-half-up convention."],
        "Replace the patch by a 4 × 4 array, map the centres of a 3 × 3 output through a homography such as "
        "[[1, 0.2, 0], [0, 1, 0], [0.05, 0, 1]], and sample each location with the same two-stage blend.",
        "numpy")
