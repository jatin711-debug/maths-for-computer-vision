"""Lesson 64: volume rendering and neural radiance fields."""


def add(examples, example):
    examples[64] = example("Composite three samples along one ray", '''
        import numpy as np

        alpha = np.array([{{0}}, {{1}}, {{2}}])   # opacities of the samples at s = 1, 2, 3
        s = np.array([1.0, 2.0, 3.0])            # distances along the ray
        colours = np.array([[0.0, 1.0, 0.0],     # green
                            [1.0, 0.0, 0.0],     # red
                            [0.0, 0.0, 1.0]])    # blue
        background = np.array([1.0, 1.0, 1.0])   # white

        sigma_delta = -np.log(1 - alpha)                   # density times interval length
        T = np.concatenate([[1.0], np.cumprod(1 - alpha)])  # transmittance in front of each sample, then the background
        w = T[:3] * alpha                                  # compositing weights
        T_bg = T[3]
        C = w @ colours + T_bg * background                # the rendered pixel
        depth = (w * s).sum() / w.sum() if w.sum() > 1e-12 else 0.0
        assert np.isclose(w.sum() + T_bg, 1)
    ''', [("Weight w1", "w[0]"), ("Weight w2", "w[1]"), ("Weight w3", "w[2]"),
          ("Background transmittance", "T_bg"), ("Rendered red", "C[0]"), ("Rendered green", "C[1]"),
          ("Rendered blue", "C[2]"), ("Expected depth", "depth")],
        ["np.cumprod(1 - alpha) multiplies the pass fractions from the front, so T[i] is the light reaching sample i "
         "and T[3] what is left for the background.",
         "w @ colours has shape (3,): each colour channel is a weighted sum over the samples. The assert checks that "
         "the weights and the background share add up to 1."],
        "Replace the three samples by 64 samples of a Gaussian blob: s = np.linspace(2, 6, 64), "
        "sigma = 8 * np.exp(-(s - 4) ** 2 / 0.5), alpha = 1 - np.exp(-sigma * (s[1] - s[0])). Plot w against s and "
        "check that it peaks in front of the blob's centre, where the transmittance is still high.",
        "numpy")
