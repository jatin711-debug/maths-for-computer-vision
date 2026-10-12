"""Lesson 58: scale space, descriptors and matching."""


def add(examples, example):
    examples[58] = example("The scale-normalised Laplacian of one Gaussian blob", '''
        import numpy as np

        s = {{0}}           # blob width: I = exp(-r^2 / (2 s^2))
        sigma = {{1}}       # scale tried by the detector
        S = {{2}}           # intervals per octave, so k = 2^(1/S)

        k = 2 ** (1 / S)
        t2 = s * s + sigma * sigma            # variances add when Gaussians are convolved
        width = np.sqrt(t2)
        centre = s * s / t2                   # peak of the blurred blob L = G_sigma * I
        lap = -2 * s * s / t2 ** 2            # L_xx + L_yy at the centre
        norm = sigma * sigma * abs(lap)       # scale-normalised response; 0.5 when sigma = s
        fraction = norm / 0.5
        dog = s * s / (s * s + k * k * sigma * sigma) - centre   # L(k sigma) - L(sigma) at the centre
        approx = (k - 1) * sigma * sigma * lap

        # Check the closed form numerically: sample the blob, then blur and differentiate it with FFTs.
        n = 129
        y, x = np.mgrid[:n, :n] - n // 2
        blob = np.fft.ifftshift(np.exp(-(x ** 2 + y ** 2) / (2 * s * s)))   # centre moved to index [0, 0]
        f = np.fft.fftfreq(n)
        f2 = f[:, None] ** 2 + f[None, :] ** 2
        blur = np.exp(-2 * np.pi ** 2 * sigma ** 2 * f2)      # Fourier transform of G_sigma
        laplacian = -4 * np.pi ** 2 * f2                       # Fourier transform of d2/dx2 + d2/dy2
        lap_numeric = np.real(np.fft.ifft2(np.fft.fft2(blob) * blur * laplacian))[0, 0]
        assert abs(sigma * sigma * abs(lap_numeric) - norm) < 1e-3
    ''', [("Blurred blob width", "width"), ("Centre value of L", "centre"), ("Laplacian at the centre", "lap"),
          ("Normalised response", "norm"), ("Fraction of the peak", "fraction"), ("DoG at the centre", "dog"),
          ("(k - 1) times the normalised Laplacian", "approx")],
        ["The closed form uses two facts: blurring a Gaussian blob gives a wider Gaussian (variances add), and "
         "each second derivative of a centred Gaussian at its peak is minus its height over its variance.",
         "The numerical check works in the Fourier domain (Lesson 36): blurring multiplies by "
         "exp(-2 pi^2 sigma^2 f^2) and the Laplacian by -4 pi^2 f^2. It agrees with the formula to about "
         "1e-4; a 5-point finite-difference stencil would be off by several per cent for s = 1.",
         "In a real detector, skimage.feature.blob_log and cv2.SIFT_create do this search over every pixel "
         "and every scale."],
        "Loop sigma over 0.5 to 12 for s = 3 and plot norm: the curve peaks at sigma = 3 and is symmetric in "
        "log(sigma). Then double s and check that the peak moves to sigma = 6.",
        "numpy")
