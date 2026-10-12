"""Lesson 65: cross-attention, positional encodings and set prediction."""


def add(examples, example):
    examples[65] = example("IoU and generalised IoU of two boxes", '''
        import numpy as np

        x = {{0}}        # left edge of box B
        y = {{1}}        # bottom edge of box B
        width = {{2}}    # width of box B (its height is 2)

        A = np.array([0.0, 0.0, 2.0, 2.0])            # [x0, y0, x1, y1]
        B = np.array([x, y, x + width, y + 2.0])

        def area(box):
            return (box[2] - box[0]) * (box[3] - box[1])

        overlap_w = max(0.0, min(A[2], B[2]) - max(A[0], B[0]))
        overlap_h = max(0.0, min(A[3], B[3]) - max(A[1], B[1]))
        intersection = overlap_w * overlap_h
        union = area(A) + area(B) - intersection
        iou = intersection / union

        C = np.array([min(A[0], B[0]), min(A[1], B[1]), max(A[2], B[2]), max(A[3], B[3])])
        enclosing = area(C)                            # smallest box containing A and B
        giou = iou - (enclosing - union) / enclosing
        giou_loss = 1 - giou
    ''', [("Intersection area", "intersection"), ("Union area", "union"), ("Enclosing area", "enclosing"),
          ("IoU", "iou"), ("GIoU", "giou"), ("GIoU loss", "giou_loss")],
        ["Boxes use continuous corner coordinates [x0, y0, x1, y1], so an area is a width times a height with no +1.",
         "When the boxes do not overlap, intersection = 0 and IoU = 0 wherever B is, but enclosing grows as B moves "
         "away, so GIoU keeps falling below 0.",
         "For a matched set loss, compute a cost matrix of -p(class) + 5 * L1 + 2 * (1 - GIoU) between targets and "
         "predictions and pass it to scipy.optimize.linear_sum_assignment, which implements the Hungarian algorithm."],
        "Loop x from -1 to 6 in steps of 0.5 and print IoU and GIoU side by side. Then build a 2 x 3 cost matrix and "
        "check that linear_sum_assignment returns the same matching as trying all six assignments.",
        "numpy")
