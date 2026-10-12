"""Lesson 55: attention and vision transformers."""


def add(examples, example):
    examples[55] = example("One row of scaled dot-product attention", '''
        import numpy as np

        q1 = {{0}}             # first coordinate of the query
        use_sqrt_d = {{1}}     # 1: divide the scores by sqrt(d); 0: use raw dot products
        c = {{2}}              # query scale

        K = np.array([[1, 0, 0, 1],
                      [0, 1, 1, 0],
                      [-1, 0, 1, 1]], dtype=float)   # one key per row, d = 4
        V = np.array([[1, 0],
                      [0, 1],
                      [-1, -1]], dtype=float)        # one value per row
        q = c * np.array([q1, 1, 1, 0], dtype=float)
        d = q.size

        scores = K @ q                                # s_j = q . k_j
        logits = scores / np.sqrt(d) if use_sqrt_d else scores
        a = np.exp(logits - logits.max())
        a /= a.sum()                                  # softmax: one row of A
        out = a @ V                                   # weighted average of the values
        entropy = -np.sum(a * np.log(a))
        effective = np.exp(entropy)
    ''', [("Weight a1", "a[0]"), ("Weight a2", "a[1]"), ("Weight a3", "a[2]"),
          ("Output o1", "out[0]"), ("Output o2", "out[1]"), ("Effective number exp(H)", "effective")],
        ["K has shape (3, 4) and q shape (4,), so K @ q gives the three scores. a @ V mixes the rows of V with the weights a.",
         "For a full layer, stack all queries as rows of Q and compute softmax(Q @ K.T / np.sqrt(d), axis=1) @ V; each row of the weight matrix sums to 1."],
        "Set use_sqrt_d = 0 and c = 3 and watch the weights approach one-hot. Then build Q with two query rows and check that every row of the weight matrix sums to 1.",
        "numpy")
