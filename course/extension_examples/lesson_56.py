"""Lesson 56: multi-scale features: pyramids, FPN and U-Net."""


def add(examples, example):
    examples[56] = example("Count FPN cells and anchors, and pick the level for a box", '''
        import numpy as np

        image_side = {{0}}          # square image, a multiple of 32
        box_side = {{1}}            # sqrt(w * h) of the box in pixels
        anchors_per_cell = {{2}}    # aspect ratios (and scales) per cell
        levels = np.arange(2, 6)                  # P2, P3, P4, P5
        strides = 2 ** levels                     # 4, 8, 16, 32
        map_sides = image_side // strides         # cells along each side
        anchors = map_sides ** 2 * anchors_per_cell

        raw_level = 4 + np.log2(box_side / 224)   # k0 = 4: a 224-pixel box goes to P4
        level = int(np.clip(np.floor(raw_level), 2, 5))
        cells = box_side / 2 ** level             # box side measured in cells of its level

        p2_side, p5_side = map_sides[0], map_sides[-1]
        p2_anchors = anchors[0]
        total_anchors = anchors.sum()
    ''', [("P2 map side (stride 4)", "p2_side"), ("P5 map side (stride 32)", "p5_side"),
          ("Anchors on P2", "p2_anchors"), ("Anchors on P2 to P5", "total_anchors"),
          ("Assigned level k", "level"), ("Box side in level-k cells", "cells")],
        ["map_sides and anchors are arrays with one entry per level P2 to P5. Integer division is exact because the image side is a multiple of 32.",
         "np.floor then np.clip reproduces the FPN rule: floor first, then clamp to the levels that exist. A box below 56 pixels is clamped to P2."],
        "Print anchors / anchors.sum() to see the share per level. Then try box_side = 224 and 448: the level rises by one and cells stays 14.",
        "numpy")
