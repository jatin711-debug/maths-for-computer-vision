"""Lesson 52: robust fitting with RANSAC and Gauss-Newton refinement."""


def add(examples, example):
    examples[52] = example("Choose the number of RANSAC samples", '''
        import numpy as np

        outlier_fraction = {{0}}       # epsilon
        sample_size = {{1}}            # s points per minimal sample
        confidence = {{2}}             # p

        clean = (1 - outlier_fraction) ** sample_size        # one sample is outlier-free
        exact_n = np.log(1 - confidence) / np.log(1 - clean)  # solve (1 - clean)**N = 1 - p
        iterations = np.ceil(exact_n)
        fail = (1 - clean) ** iterations                      # all N samples contaminated
        expected_draws = 1 / clean                            # mean wait for a clean sample

        # Monte Carlo check: in 20000 simulated runs, at which sample does the first clean one arrive?
        rng = np.random.default_rng(0)
        first_clean = rng.geometric(clean, size=20000)
        simulated_fail = np.mean(first_clean > iterations)
    ''', [("Clean-sample probability", "clean"), ("Exact N from the formula", "exact_n"),
          ("Iterations N (rounded up)", "iterations"), ("Chance every sample fails", "fail"),
          ("Expected draws until a clean sample", "expected_draws")],
        ["Each sampled point is an inlier with probability 1 - outlier_fraction, independently, so a sample of s points is clean with probability (1 - outlier_fraction)**s. Real RANSAC samples without replacement, which makes little difference when there are many points.",
         "np.ceil rounds up because N counts samples. rng.geometric draws the index of the first clean sample in each simulated run; simulated_fail is not printed, so inspect it yourself and compare it with fail."],
        "Print simulated_fail and first_clean.mean(). Then set sample_size = 4 and outlier_fraction = 0.5: how many samples does a homography need?",
        "numpy")
