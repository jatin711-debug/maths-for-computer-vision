"""Lesson 54: entropy, KL divergence and contrastive learning."""


def add(examples, example):
    examples[54] = example("Smooth a label and split the cross-entropy", '''
        import numpy as np

        epsilon = {{0}}        # label-smoothing amount
        K = {{1}}              # number of classes
        z_true = {{2}}         # logit of the true class; the other logits are 0

        y = np.zeros(K)
        y[0] = 1.0                                  # one-hot label: class 1 is correct
        p = (1 - epsilon) * y + epsilon / K         # smoothed target
        z = np.zeros(K)
        z[0] = z_true
        q = np.exp(z - z.max())
        q /= q.sum()                                # softmax prediction

        nz = p > 0                                  # use 0 * log 0 = 0
        entropy = -np.sum(p[nz] * np.log(p[nz]))
        cross_entropy = -np.sum(p * np.log(q))
        kl = np.sum(p[nz] * np.log(p[nz] / q[nz]))
        q_true = q[0]
        gradient = q[0] - p[0]                      # dL/dz_1 for softmax cross-entropy
    ''', [("Target entropy H(p)", "entropy"), ("Cross-entropy H(p,q)", "cross_entropy"), ("KL(p||q)", "kl"),
          ("Predicted q1", "q_true"), ("Gradient q1 - p1", "gradient")],
        ["p and q have shape (K,). np.log is the natural logarithm, so the results are in nats; divide by np.log(2) for bits.",
         "cross_entropy equals entropy + kl up to rounding. The mask nz skips classes with zero target probability, which contribute nothing."],
        "Set epsilon = 0 and check that cross_entropy equals kl. Then find the z_true at which gradient changes sign, and compare it with np.log(p[0] / p[1]).",
        "numpy")
