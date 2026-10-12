"""Lesson 66: latent-variable models, from EM to the variational autoencoder."""


def add(examples, example):
    examples[66] = example("Responsibilities and the bound of a hard assignment", '''
        import numpy as np

        x = {{0}}          # the data point
        mu2 = {{1}}        # mean of the second component (the first has mean 0)
        sigma = {{2}}      # shared standard deviation
        pi1 = {{3}}        # weight of the first component

        pis = np.array([pi1, 1 - pi1])
        mus = np.array([0.0, mu2])

        # Work with logarithms: log of weight times density, for each component.
        log_dens = -(x - mus) ** 2 / (2 * sigma * sigma) - np.log(sigma) - 0.5 * np.log(2 * np.pi)
        log_joint = np.log(pis) + log_dens
        top = log_joint.max()
        log_px = top + np.log(np.exp(log_joint - top).sum())   # log-sum-exp: ln p(x)

        r = np.exp(log_joint - log_px)                         # E-step: responsibilities
        r1, r2 = r
        k = 0 if r1 >= r2 else 1                               # k-means keeps only the winner
        bound = log_joint[k]                                   # ELBO with q one-hot on component k
        gap = log_px - bound                                   # equals KL(q || r) = -ln r[k]
    ''', [("Responsibility r1", "r1"), ("Responsibility r2", "r2"), ("Log-likelihood ln p(x)", "log_px"),
          ("Hard-assignment bound", "bound"), ("Gap KL(q||r)", "gap")],
        ["log_dens holds ln N(x; mu_k, sigma^2) for both components at once; adding np.log(pis) gives ln(pi_k N_k).",
         "Subtracting the maximum before exponentiating (log-sum-exp) keeps the sum finite even when x is far from both "
         "means.",
         "For many points, stack them as rows: the responsibilities become an N x K matrix whose rows sum to 1, and the "
         "M-step is mu_k = (r[:, k] @ X) / r[:, k].sum()."],
        "Check that gap equals -np.log(r[k]). Then generate 200 points from the mixture with np.random.default_rng(0), "
        "run 20 EM iterations from wrong starting means, and print the log-likelihood after each one: it never falls.",
        "numpy")
