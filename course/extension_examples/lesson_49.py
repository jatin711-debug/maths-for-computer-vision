"""Lesson 49: homogeneous coordinates and 2D transformations."""


def add(examples, example):
    examples[49] = example("Rotate, scale and translate in homogeneous coordinates", '''
        import numpy as np

        theta = np.deg2rad({{0}})
        scale = {{1}}
        tx = {{2}}
        R = np.array([[np.cos(theta), -np.sin(theta)],
                      [np.sin(theta), np.cos(theta)]])
        S = np.eye(3)
        S[:2, :2] = scale * R          # rotate and scale
        T = np.eye(3)
        T[:2, 2] = [tx, 0.0]           # translate
        point = np.array([1.0, 1.0, 1.0])

        mapped = T @ S @ point         # rightmost acts first
        mapped_x, mapped_y = mapped[:2] / mapped[2]
        other = S @ T @ point          # translate first instead
        other_x, other_y = other[:2] / other[2]
        gap = np.hypot(mapped_x - other_x, mapped_y - other_y)
    ''', [("Mapped x", "mapped_x"), ("Mapped y", "mapped_y"), ("Other order x", "other_x"),
          ("Other order y", "other_y"), ("Gap between orders", "gap")],
        ["Points are 3-vectors (x, y, 1). T @ S @ point applies S first, then T, matching the order in the worked example.",
         "Divide by the last coordinate to read a 2D point. It stays 1 for these affine matrices but not for a homography."],
        "Set tx = 0 and check that both orders agree. Then put a nonzero entry in the bottom row of T and see the last coordinate change.",
        "numpy")
