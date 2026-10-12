"""Lesson 67: diffusion models, noising, denoising and sampling."""


def add(examples, example):
    examples[67] = example("Noise one value, then denoise it", '''
        import numpy as np

        x0 = {{0}}        # clean value
        eps = {{1}}       # the noise that was drawn
        abar = {{2}}      # signal fraction alpha-bar
        s = {{3}}         # data are x0 ~ N(0, s^2)

        sa, sn = np.sqrt(abar), np.sqrt(1 - abar)
        x_t = sa * x0 + sn * eps                   # forward process in one jump
        x0_hat = (x_t - sn * eps) / sa             # exact if the noise is known

        var_t = abar * s * s + 1 - abar            # Var(x_t) for Gaussian data
        best_x0 = sa * s * s * x_t / var_t         # E[x0 | x_t]: the optimal denoiser
        best_eps = sn * x_t / var_t                # E[eps | x_t]: the optimal noise prediction
        score = -x_t / var_t                       # d/dx ln p_t(x) at x_t
        assert np.isclose(score, -best_eps / sn)
        assert np.isclose((x_t + (1 - abar) * score) / sa, best_x0)   # Tweedie's formula
    ''', [("Noisy value x_t", "x_t"), ("Recovered x0 with the true noise", "x0_hat"),
          ("Best estimate E[x0|x_t]", "best_x0"), ("Best noise estimate E[eps|x_t]", "best_eps"), ("Score", "score")],
        ["x_t mixes signal and noise with weights whose squares add to 1, so unit-variance data stay at unit variance.",
         "A network trained with mean squared error on the noise can at best output best_eps, not eps, because it "
         "sees only x_t; best_x0 is then the posterior mean, pulled towards the data mean 0.",
         "The two asserts check that the noise prediction, the denoiser and the score are the same information."],
        "Sample 100,000 pairs (x0, eps) with np.random.default_rng(0), form x_t, and average x0 over the pairs whose x_t "
        "lies within 0.01 of your x_t: the Monte Carlo average should match best_x0.",
        "numpy")
