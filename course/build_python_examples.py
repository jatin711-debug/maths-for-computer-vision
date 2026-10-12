"""Author and rebuild the offline Python examples: python course/build_python_examples.py."""
from pathlib import Path
import json
import re
import textwrap


def example(title, body, outputs, notes, try_it, dependency="stdlib"):
    code = textwrap.dedent(body).strip() + "\n\n"
    for label, expression in outputs:
        if label == "Precision":
            code += ('print("Precision:", "undefined (no positive predictions)" '
                     f'if {expression} is None else f"{{{expression}:.6g}}")\n')
        else:
            code += f'print(f"{label}: {{{expression}:.6g}}")\n'
    return dict(title=title, code=code, outputs=outputs, notes=notes,
                tryIt=try_it, dependency=dependency)


EXAMPLES = {
    1: example("Scale a tiny image", '''
        import numpy as np

        scale = {{0}}
        image = np.array([[20, 60], [100, 140]], dtype=float)
        raw = scale * image + 10
        display = np.clip(raw, 0, 255)
        input_mean = image.mean()
        raw_mean = raw.mean()
        display_mean = display.mean()
    ''', [("Input mean", "input_mean"), ("Raw mean", "raw_mean"),
          ("Display mean", "display_mean")],
        ["image has shape (2, 2): two rows and two columns. Multiplying by a scalar changes every pixel.",
         "Use floating point for the arithmetic; clipping then limits display intensities to [0, 255]."],
        "Set the scale to 2 and compare the raw mean with the clipped display mean.", "numpy"),
    2: example("Compose two functions", '''
        scale = {{0}}
        x = 4

        def f(value):
            return scale * value

        def g(value):
            return value + 3

        scale_then_shift = g(f(x))
        shift_then_scale = f(g(x))
    ''', [("Scale then shift", "scale_then_shift"), ("Shift then scale", "shift_then_scale")],
        ["The inner function runs first: g(f(x)) applies f, then g.",
         "Each function receives one scalar and returns one scalar. The order can change the result."],
        "Try scale = 1. Why do both pipelines then agree?"),
    3: example("Reduce residuals to a loss", '''
        import numpy as np

        residual = {{0}}
        errors = np.array([residual, 0, 0], dtype=float)
        squared_error_sum = np.sum(errors ** 2)
        mse = np.mean(errors ** 2)
    ''', [("Signed residual", "residual"), ("Squared-error sum", "squared_error_sum"), ("MSE", "mse")],
        ["errors has shape (3,). Squaring is element by element; sum and mean reduce the array to a scalar.",
         "MSE divides by all three observations, including the two zero residuals."],
        "Change the residual from -2 to 2. Which output changes?", "numpy"),
    4: example("Turn a score into probability and stable log loss", '''
        import math

        score = {{0}}
        label = {{1}}  # Observed class: 0 or 1.
        if score >= 0:
            probability = 1 / (1 + math.exp(-score))
        else:
            exp_score = math.exp(score)
            probability = exp_score / (1 + exp_score)
        true_class_probability = probability if label == 1 else 1 - probability
        # Binary cross-entropy from the logit; avoids log(0).
        loss = max(score, 0) - label * score + math.log1p(math.exp(-abs(score)))
    ''', [("Class 1 probability", "probability"), ("True-class probability", "true_class_probability"),
          ("Negative log loss", "loss")],
        ["score is an unrestricted scalar logit. probability is the sigmoid result in [0, 1]; label is the observed outcome.",
         "math.log and math.log1p use the natural logarithm. This loss formula remains finite for very large logits."],
        "Keep a positive score and switch label from 1 to 0. Explain why the loss increases."),
    5: example("Subtract coordinates to get a displacement", '''
        import numpy as np

        end_x = {{0}}
        start = np.array([2, 1], dtype=float)
        end = np.array([end_x, -1], dtype=float)
        displacement = end - start
        distance = np.linalg.norm(displacement)
    ''', [("Horizontal change", "displacement[0]"), ("Vertical change", "displacement[1]"),
          ("Distance", "distance")],
        ["start, end and displacement have shape (2,), with horizontal coordinate first.",
         "np.linalg.norm returns the Euclidean length of a vector; the distance is a scalar."],
        "Set the endpoint's horizontal coordinate to 2. What remains of the distance?", "numpy"),
    6: example("Project onto a direction", '''
        import numpy as np

        x = np.array([{{0}}, 4], dtype=float)
        direction = np.array([1, 1], dtype=float)
        coefficient = (direction @ x) / (direction @ direction)
        projection = coefficient * direction
        residual = x - projection
        residual_length = np.linalg.norm(residual)
    ''', [("Projection coefficient", "coefficient"), ("Residual length", "residual_length")],
        ["x, direction and projection all have shape (2,). @ between two vectors computes a scalar dot product.",
         "The denominator handles a direction that is not a unit vector. The direction must be nonzero."],
        "Set x's horizontal coordinate to 4. Check that the residual is the zero vector.", "numpy"),
    7: example("Apply a matrix to a vector", '''
        import numpy as np

        scale = {{0}}
        matrix = np.array([[scale, 1], [0, 1]], dtype=float)
        x = np.array([2, 3], dtype=float)
        output = matrix @ x
        area_scale = abs(np.linalg.det(matrix))
    ''', [("Output x", "output[0]"), ("Output y", "output[1]"), ("Area scale", "area_scale")],
        ["matrix has shape (2, 2), x has shape (2,), and matrix @ x returns shape (2,).",
         "@ is matrix multiplication; * would multiply corresponding elements. The absolute determinant gives area scaling."],
        "Use scale = 0 and inspect the determinant and the transformed vector.", "numpy"),
    8: example("Inspect rank and a null direction", '''
        import numpy as np

        mixing = {{0}}
        matrix = np.array([[1, mixing], [0, 0]], dtype=float)
        null_vector = np.array([-mixing, 1])
        rank = np.linalg.matrix_rank(matrix)
        nullity = matrix.shape[1] - rank
        assert np.allclose(matrix @ null_vector, 0)
    ''', [("Rank", "rank"), ("Nullity", "nullity"), ("Null x-coordinate", "null_vector[0]")],
        ["matrix has two input coordinates and rank 1, so one independent input direction is lost.",
         "np.allclose allows for floating-point rounding when checking that a vector is sent to zero."],
        "Change mixing and notice that the null direction moves while rank and nullity stay the same.", "numpy"),
    9: example("Fit conflicting linear equations", '''
        import numpy as np

        second_target = {{0}}
        matrix = np.array([[1, 1], [1, 1]], dtype=float)
        targets = np.array([1, second_target], dtype=float)
        weights, _, _, _ = np.linalg.lstsq(matrix, targets, rcond=None)
        fitted = matrix @ weights
    ''', [("First target", "targets[0]"), ("Second target", "targets[1]"), ("Fitted sum", "fitted[0]")],
        ["matrix has shape (2, 2); targets and weights have shape (2,). Both equations ask for the same sum.",
         "lstsq minimizes squared residuals and returns a minimum-norm solution when the weights are not uniquely determined."],
        "Set the second target to 1. The equations agree, but are the two weights uniquely determined?", "numpy"),
    10: example("Fit a constant with least squares", '''
        import numpy as np

        targets = np.array([1, 2, {{0}}], dtype=float)
        design = np.ones((3, 1))
        weights, _, _, _ = np.linalg.lstsq(design, targets, rcond=None)
        fitted_constant = weights[0]
        residuals = design @ weights - targets
        squared_error_sum = residuals @ residuals
    ''', [("Fitted constant", "fitted_constant"), ("Squared residual sum", "squared_error_sum")],
        ["design has shape (3, 1): three observations and one constant parameter. weights has shape (1,).",
         "The fitted constant equals the sample mean; residuals have shape (3,)."],
        "Move the third target and compare weights[0] with targets.mean().", "numpy"),
    11: example("Measure numerical conditioning", '''
        import numpy as np

        smallest = {{0}}
        matrix = np.diag([10.0, smallest])
        condition = np.linalg.cond(matrix)
        gram_condition = np.linalg.cond(matrix.T @ matrix)
    ''', [("Condition number", "condition"), ("Gram condition number", "gram_condition")],
        ["np.linalg.cond uses the ratio of largest to smallest singular value by default. matrix.T is the transpose.",
         "For this example, forming the Gram matrix squares the condition number. Use lstsq for fitting instead of explicitly inverting it."],
        "Decrease the smallest singular value and compare how quickly the two condition numbers grow.", "numpy"),
    12: example("Solve a one-parameter ridge objective", '''
        penalty = {{0}}
        target = 2.0
        # Minimize (weight - target)**2 + penalty * weight**2.
        unpenalized = target
        weight = target / (1 + penalty)
        data_error = (weight - target) ** 2
    ''', [("Unpenalized fit", "unpenalized"), ("Regularized fit", "weight"), ("Data error", "data_error")],
        ["All inputs are scalars. penalty is nonnegative and weight is the minimizer of this particular objective.",
         "data_error reports only the squared data residual, excluding the penalty term."],
        "Set penalty = 0, then increase it. Why can data error rise even though this is the optimum?"),
    13: example("Apply an eigen-direction repeatedly", '''
        import numpy as np

        eigenvalue = {{0}}
        matrix = np.diag([eigenvalue, 2.0])
        direction = np.array([1.0, 0.0])
        after_three = np.linalg.matrix_power(matrix, 3) @ direction
    ''', [("Eigenvalue", "eigenvalue"), ("After three maps", "after_three[0]")],
        ["direction has shape (2,) and is an eigenvector of the (2, 2) matrix.",
         "matrix_power composes the matrix with itself. matrix ** 3 would cube each entry separately."],
        "Try a negative eigenvalue. How does the direction change after an odd number of maps?", "numpy"),
    14: example("Keep the leading SVD component", '''
        import numpy as np

        matrix = np.diag([4.0, {{0}}])
        u, singular_values, vt = np.linalg.svd(matrix, full_matrices=False)
        rank_one = singular_values[0] * np.outer(u[:, 0], vt[0, :])
        retained_energy = singular_values[0] ** 2 / np.sum(singular_values ** 2)
    ''', [("Retained singular value", "singular_values[0]"), ("Discarded singular value", "singular_values[1]"),
          ("Retained energy", "retained_energy")],
        ["u and vt have shape (2, 2); singular_values has shape (2,) and is sorted in descending order.",
         "rank_one reconstructs one component. Energy here means squared singular values, rather than their sum."],
        "Set the second singular value to 4. Why is retaining just one component no longer a unique choice?", "numpy"),
    15: example("Compute PCA from a covariance matrix", '''
        import numpy as np

        spread = {{0}}
        samples = np.array([[-spread, -1], [0, 0], [spread, 1]], dtype=float)
        centered = samples - samples.mean(axis=0)
        covariance = centered.T @ centered / (len(samples) - 1)
        variances, directions = np.linalg.eigh(covariance)
        order = np.argsort(variances)[::-1]
        variances = variances[order]
        directions = directions[:, order]
        scores = centered @ directions[:, :1]
    ''', [("Leading variance", "variances[0]"), ("Second variance", "variances[1]")],
        ["samples has shape (3, 2): observations are rows. The covariance is (2, 2), and one-component scores are (3, 1).",
         "eigh handles symmetric matrices and returns ascending eigenvalues, so we reverse their order. Either eigenvector sign is valid."],
        "Use zero horizontal spread and inspect which direction retains the variance.", "numpy"),
    16: example("Reconstruct from one retained coefficient", '''
        import numpy as np

        coefficient = {{0}}
        x = np.array([3.0, 4.0])
        basis = np.array([1.0, 0.0])
        reconstruction = coefficient * basis
        error = x - reconstruction
        squared_error = error @ error
        discarded = x - (basis @ x) * basis
        unavoidable_error = discarded @ discarded
    ''', [("Coefficient z", "coefficient"), ("Squared error", "squared_error"), ("Unavoidable error", "unavoidable_error")],
        ["x, basis and reconstruction have shape (2,). The basis is a unit vector; the retained coefficient is a scalar.",
         "Even the best coefficient cannot reconstruct the discarded vertical component."],
        "Compare coefficients 2, 3 and 4. Which minimizes the squared reconstruction error?", "numpy"),
    17: example("Compare a derivative with a secant slope", '''
        x = {{0}}
        h = 0.1

        def f(value):
            return value ** 2

        function_value = f(x)
        derivative = 2 * x
        secant = (f(x + h) - f(x)) / h
    ''', [("Function value", "function_value"), ("Derivative", "derivative"), ("Secant at h=0.1", "secant")],
        ["** means exponentiation in Python; ^ is a bitwise operation.",
         "The derivative is exact for this formula. The forward difference is an approximation with a nonzero step."],
        "Edit h to 0.01 in Python and observe how the secant approaches the derivative."),
    18: example("Take a directional derivative", '''
        import numpy as np

        x, y = {{0}}, 1.0
        # f(x, y) = x**2 + 2*y**2.
        gradient = np.array([2 * x, 4 * y])
        direction = np.array([0.6, 0.8])  # Unit length.
        directional_derivative = gradient @ direction
    ''', [("x partial", "gradient[0]"), ("y partial", "gradient[1]"),
          ("Directional derivative", "directional_derivative")],
        ["gradient and direction have shape (2,); their dot product is a scalar rate of change.",
         "A unit direction measures change per unit distance. Normalize a new direction before making that interpretation."],
        "Edit direction to [1.0, 0.0]. Which partial derivative should you recover?", "numpy"),
    19: example("Differentiate through a prediction and loss", '''
        weight = {{0}}
        x, bias, target = 2.0, 1.0, 5.0
        prediction = weight * x + bias
        error = prediction - target
        loss = 0.5 * error ** 2
        # dL/dw = dL/dprediction * dprediction/dw.
        weight_gradient = error * x
    ''', [("Prediction", "prediction"), ("Loss", "loss"), ("Weight gradient", "weight_gradient")],
        ["This is a scalar model. The factor 0.5 cancels the 2 from differentiating the square.",
         "Backpropagation multiplies the local derivatives: error from the loss and x from the linear prediction."],
        "Find the weight where prediction equals target and check the gradient."),
    20: example("Add a curvature correction to a tangent", '''
        displacement = {{0}}
        center = 2.0
        # f(x) = x**2, f'(x) = 2*x, f''(x) = 2.
        linear_prediction = center ** 2 + 2 * center * displacement
        curvature_correction = 0.5 * 2 * displacement ** 2
        exact_value = (center + displacement) ** 2
    ''', [("Linear prediction", "linear_prediction"), ("Curvature correction", "curvature_correction"),
          ("Exact value", "exact_value")],
        ["The displacement is relative to center = 2, rather than an absolute x coordinate.",
         "For this quadratic the second-order Taylor expression is exact; higher-order functions generally have a remainder."],
        "Try opposite displacements. Why is the curvature correction the same?"),
    21: example("Calculate a posterior with Bayes' rule", '''
        prevalence = {{0}}
        sensitivity = 0.8
        false_positive_rate = 0.1
        true_positive_joint = sensitivity * prevalence
        false_positive_joint = false_positive_rate * (1 - prevalence)
        probability_positive = true_positive_joint + false_positive_joint
        posterior = true_positive_joint / probability_positive
    ''', [("True-positive joint", "true_positive_joint"), ("False-positive joint", "false_positive_joint"),
          ("Posterior", "posterior")],
        ["The rates are probabilities in [0, 1]. The joint values include both the class prevalence and the conditional detection rate.",
         "posterior is P(target | positive). Its denominator counts every way a positive result can occur."],
        "Lower prevalence while keeping the detection rates fixed. Does a positive result become more convincing?"),
    22: example("Compute a discrete expectation", '''
        probability_one = {{0}}
        outcomes = [0, 1]
        probabilities = [1 - probability_one, probability_one]
        expectation = sum(x * p for x, p in zip(outcomes, probabilities))
    ''', [("Mass at zero", "probabilities[0]"), ("Mass at one", "probabilities[1]"), ("Expectation", "expectation")],
        ["The two lists align each outcome with its probability; the probability masses sum to 1.",
         "An expectation is a probability-weighted average. It need not be an outcome you can observe in one trial."],
        "Edit outcomes to [0, 10] in Python. How does that change the expectation?"),
    23: example("Propagate covariance through a sum", '''
        import numpy as np

        correlation = {{0}}
        covariance = np.array([[1, correlation], [correlation, 1]], dtype=float)
        weights = np.array([1.0, 1.0])
        variance_of_sum = weights @ covariance @ weights
        sd_of_sum = np.sqrt(variance_of_sum)
    ''', [("Correlation", "correlation"), ("Variance of sum", "variance_of_sum"), ("SD of sum", "sd_of_sum")],
        ["Both variables have variance 1, so their covariance equals correlation in this example. covariance has shape (2, 2).",
         "weights @ covariance @ weights computes the variance of the weighted sum, including cross terms."],
        "Compare positive and negative correlation. Which makes the sum more variable?", "numpy"),
    24: example("Compute a standard error and interval width", '''
        import math

        n = {{0}}
        population_sd = 2.0
        standard_error = population_sd / math.sqrt(n)
        interval_half_width = 1.96 * standard_error
    ''', [("Observations", "n"), ("Standard error", "standard_error"),
          ("Interval half-width", "interval_half_width")],
        ["This example assumes independent normal observations and a known population standard deviation of 2.",
         "A 95% interval for the mean is sample_mean ± interval_half_width under these assumptions; an estimated SD needs a different interval calculation."],
        "Compare sample counts 25 and 100. Does quadrupling n halve the standard error?"),
    25: example("Calculate Bernoulli likelihood in log space", '''
        import math

        probability = {{0}}
        observations = [1, 1, 1, 0]
        log_likelihood = sum(
            math.log(probability) if y == 1 else math.log1p(-probability)
            for y in observations
        )
        likelihood = math.exp(log_likelihood)
        total_nll = -log_likelihood
        mean_nll = total_nll / len(observations)
    ''', [("Likelihood", "likelihood"), ("Total NLL", "total_nll"), ("Mean NLL", "mean_nll")],
        ["The four observations stay fixed while probability changes. This snippet requires 0 < probability < 1.",
         "Sum log probabilities for longer datasets to avoid multiplying many small numbers. The mean loss divides by the observation count."],
        "Compare probabilities 0.5 and 0.75. Which assigns more likelihood to three successes out of four?"),
    26: example("Combine a Gaussian observation with a prior", '''
        prior_precision = {{0}}
        observation, likelihood_precision = 2.0, 1.0
        prior_mean = 0.0
        posterior_precision = likelihood_precision + prior_precision
        map_estimate = (
            likelihood_precision * observation + prior_precision * prior_mean
        ) / posterior_precision
        data_error = (map_estimate - observation) ** 2
    ''', [("Unpenalized fit", "observation"), ("Regularized fit", "map_estimate"), ("Data error", "data_error")],
        ["Precision is the inverse variance. The observation and prior here describe one scalar parameter.",
         "The Gaussian posterior mean is also its MAP estimate. A stronger zero-centered prior pulls the fit toward zero."],
        "Increase prior precision. Which has more influence: the observation or the prior?"),
    27: example("Compute a stable softmax", '''
        import numpy as np

        logits = np.array([{{0}}, 1.0, 0.0])  # Cat, dog, background.
        shifted = logits - logits.max()
        exp_logits = np.exp(shifted)
        probabilities = exp_logits / exp_logits.sum()
    ''', [("Cat", "probabilities[0]"), ("Dog", "probabilities[1]"), ("Background", "probabilities[2]")],
        ["logits and probabilities have shape (3,). Each class shares the same normalization denominator.",
         "Subtracting the maximum prevents exponential overflow and leaves the resulting probabilities unchanged."],
        "Add 1000 to every logit in Python. Check that the probabilities stay the same.", "numpy"),
    28: example("Evaluate probabilities with a Brier score", '''
        import numpy as np

        predicted_probability = {{0}}
        labels = np.array([1] * 12 + [0] * 8)
        predictions = np.full(labels.shape, predicted_probability)
        observed_frequency = labels.mean()
        brier_score = np.mean((predictions - labels) ** 2)
    ''', [("Predicted probability", "predicted_probability"), ("Observed frequency", "observed_frequency"),
          ("Brier score", "brier_score")],
        ["labels and predictions have shape (20,). Twelve outcomes are positive, so the observed frequency is 0.6.",
         "The Brier score is mean squared probability error. A lower score is better; this single group is only one calibration check."],
        "Compare predictions 0.6 and 0.9. Which better reflects the frequency of this group?", "numpy"),
    29: example("Take one gradient descent step", '''
        learning_rate = {{0}}
        weight = 0.0

        def loss(w):
            return (w - 3) ** 2

        before_loss = loss(weight)
        gradient = 2 * (weight - 3)
        updated_weight = weight - learning_rate * gradient
        after_loss = loss(updated_weight)
    ''', [("Before loss", "before_loss"), ("Updated weight", "updated_weight"), ("After loss", "after_loss")],
        ["The gradient is evaluated at the old weight. The learning rate sets how far to move in the negative gradient direction.",
         "after_loss evaluates the objective again at the updated weight so you can detect an overshoot."],
        "Increase the learning rate past 1. Does a downhill direction guarantee a better final loss?"),
    30: example("Update momentum and then the parameter", '''
        beta = {{0}}
        old_velocity = 2.0
        new_batch_gradient = -1.0
        weight, learning_rate = 1.0, 0.1
        velocity = beta * old_velocity + new_batch_gradient
        new_weight = weight - learning_rate * velocity
    ''', [("Old velocity", "old_velocity"), ("New batch gradient", "new_batch_gradient"),
          ("Combined velocity", "velocity"), ("New weight", "new_weight")],
        ["This uses the convention velocity = beta * old_velocity + gradient, without multiplying the new gradient by (1 - beta).",
         "Update the velocity first, then subtract learning_rate * velocity from the weight."],
        "Try beta = 0. Which part of the update's memory disappears?"),
    31: example("See how curvature changes an update", '''
        curvature = {{0}}
        weight, learning_rate = 2.0, 0.4
        # loss(w) = 0.5 * curvature * w**2.
        gradient = curvature * weight
        updated_weight = weight - learning_rate * gradient
        error_multiplier = abs(1 - learning_rate * curvature)
    ''', [("Curvature", "curvature"), ("Updated weight", "updated_weight"), ("Error multiplier", "error_multiplier")],
        ["The optimum is weight = 0. The signed factor 1 - learning_rate * curvature controls whether the update crosses it.",
         "error_multiplier below 1 contracts distance to the optimum; above 1 increases that distance."],
        "Try curvature = 6. Would repeatedly using the same step converge?"),
    32: example("Initialize weights at a He scale", '''
        import numpy as np

        fan_in = {{0}}
        weight_variance = 2 / fan_in
        weight_sd = np.sqrt(weight_variance)
        rng = np.random.default_rng(0)
        weights = rng.normal(0, weight_sd, size=(8, fan_in))
    ''', [("Fan-in", "fan_in"), ("Weight variance", "weight_variance"), ("Weight SD", "weight_sd")],
        ["weights has shape (8, fan_in): eight output units, each receiving fan_in inputs. This scale is intended for a ReLU layer.",
         "The printed variance is the sampling distribution's target; a finite array's measured variance will differ. The seed makes the example repeatable."],
        "Compare fan_in = 8 and 32. How should the initialization standard deviation change?", "numpy"),
    33: example("Sample a cosine and inspect its alias", '''
        import numpy as np

        frequency = {{0}}
        sample_rate = 12.0
        times = np.arange(12) / sample_rate
        samples = np.cos(2 * np.pi * frequency * times)
        wrapped = frequency % sample_rate
        apparent_frequency = min(wrapped, sample_rate - wrapped)
        nyquist_limit = sample_rate / 2
        alias_samples = np.cos(2 * np.pi * apparent_frequency * times)
        assert np.allclose(samples, alias_samples)
    ''', [("Original frequency", "frequency"), ("Apparent frequency", "apparent_frequency"),
          ("Nyquist limit", "nyquist_limit")],
        ["times and samples have shape (12,). Frequencies are in cycles per second and sample_rate is samples per second.",
         "For this zero-phase cosine, a frequency above the Nyquist limit matches a lower-frequency cosine at the sampled times."],
        "Compare frequencies 4 and 8 with sample_rate = 12. What can the samples distinguish?", "numpy"),
    34: example("Compare correlation with convolution", '''
        import numpy as np

        middle_weight = {{0}}
        patch = np.array([1.0, 2.0, 3.0])
        kernel = np.array([1.0, middle_weight, -1.0])
        correlation = np.correlate(patch, kernel, mode="valid")[0]
        convolution = np.convolve(patch, kernel, mode="valid")[0]
    ''', [("Cross-correlation", "correlation"), ("Flipped-kernel response", "convolution")],
        ["patch and kernel have shape (3,). With equal lengths, valid mode returns one output.",
         "np.convolve reverses the kernel; np.correlate uses its displayed order. Neural-network convolution layers usually use cross-correlation."],
        "Edit the kernel to [1.0, middle_weight, 1.0]. Why do the two operations then agree?", "numpy"),
    35: example("Calculate sliding-window output size", '''
        stride = {{0}}
        input_length, kernel_size, padding, dilation = 7, 3, 1, 1
        effective_kernel = dilation * (kernel_size - 1) + 1
        output_length = (input_length + 2 * padding - effective_kernel) // stride + 1
        input_jump = 1
        output_jump = input_jump * stride
    ''', [("Input length", "input_length"), ("Output length", "output_length"), ("Output jump", "output_jump")],
        ["All sizes are integers. // performs floor division and counts complete kernel placements.",
         "output_jump measures the spacing between adjacent output centers in original input coordinates. A later layer inherits the previous jump."],
        "Compare strides 1, 2 and 3. What happens to output length and sampling spacing?"),
    36: example("Filter an edge and a high-frequency pattern", '''
        import numpy as np

        neighbor_weight = {{0}}
        kernel = np.array([neighbor_weight, 1 - 2 * neighbor_weight, neighbor_weight])
        left_response = kernel @ np.array([0.0, 0.0, 1.0])
        right_response = kernel @ np.array([0.0, 1.0, 1.0])
        # Centered offsets [-1, 0, 1] at frequency pi.
        high_frequency_response = kernel @ np.array([-1.0, 1.0, -1.0])
    ''', [("Edge left response", "left_response"), ("Edge right response", "right_response"),
          ("High-frequency response", "high_frequency_response")],
        ["The three-tap kernel sums to 1, preserving constant intensities. Each dot product returns one scalar response.",
         "[-1, 1, -1] is an alternating pattern at the highest discrete frequency; smoothing suppresses its amplitude."],
        "Try neighbor_weight = 0.25. What happens to the high-frequency response?", "numpy"),
    37: example("Apply a rectified linear unit", '''
        bias = {{0}}
        x, weight = 2.0, 1.0
        preactivation = weight * x + bias
        relu_output = max(0.0, preactivation)
    ''', [("Preactivation", "preactivation"), ("ReLU output", "relu_output")],
        ["This scalar ReLU returns zero for a negative preactivation and passes a positive one through.",
         "For an array, np.maximum(0, preactivation) applies the same operation element by element."],
        "Move the bias below -2. Which part of the output becomes insensitive to the input?"),
    38: example("Backpropagate through a two-layer scalar network", '''
        weight = {{0}}
        x, bias, output_weight, target = 2.0, -1.0, 2.0, 3.0
        preactivation = weight * x + bias
        hidden = max(0.0, preactivation)
        prediction = output_weight * hidden
        error = prediction - target
        loss = 0.5 * error ** 2
        relu_gradient = 1.0 if preactivation > 0 else 0.0
        weight_gradient = error * output_weight * relu_gradient * x
    ''', [("Hidden activation", "hidden"), ("Prediction", "prediction"),
          ("Loss", "loss"), ("Weight gradient", "weight_gradient")],
        ["The backward pass uses values from the forward pass and multiplies all local derivatives along the path to weight.",
         "ReLU is not differentiable at zero. This implementation chooses gradient 0 there, as many frameworks do."],
        "Try a weight below 0.5. Why can the loss stay large while this weight's gradient is zero?"),
    39: example("Add an L2 penalty gradient", '''
        penalty = {{0}}
        weight, data_gradient, learning_rate = 2.0, 0.5, 0.1
        # Penalty contribution to loss: 0.5 * penalty * weight**2.
        penalty_gradient = penalty * weight
        total_gradient = data_gradient + penalty_gradient
        updated_weight = weight - learning_rate * total_gradient
    ''', [("Data gradient", "data_gradient"), ("Penalty gradient", "penalty_gradient"),
          ("Updated weight", "updated_weight")],
        ["The factor 0.5 in this penalty makes its derivative penalty * weight. Check the convention before translating another formula.",
         "This is an L2 contribution to a plain gradient step. Optimizers with adaptive scaling can treat decoupled weight decay differently."],
        "Set penalty = 0. Which gradient term remains?"),
    40: example("Check a gradient with central differences", '''
        log10_step = {{0}}
        h = 10.0 ** log10_step
        weight = 2.0

        def loss(w):
            return w ** 3

        analytic_gradient = 3 * weight ** 2
        numerical_gradient = (loss(weight + h) - loss(weight - h)) / (2 * h)
    ''', [("Step size h", "h"), ("Analytic gradient", "analytic_gradient"),
          ("Numerical gradient", "numerical_gradient")],
        ["This checks one scalar derivative in ordinary Python. The central difference approximates the slope using values on both sides.",
         "A very large step has approximation error; an extremely small one can have rounding error. Compare several step sizes."],
        "Decrease h and compare the numerical gradient with the analytic value of 12."),
    41: example("Apply a brightness augmentation", '''
        import numpy as np

        scale = {{0}}
        image = np.array([[20, 60], [100, 140]], dtype=float)
        augmented = np.clip(scale * image, 0, 255)
        original_mean = image.mean()
        augmented_mean = augmented.mean()
    ''', [("Scale", "scale"), ("Original mean", "original_mean"), ("Augmented mean", "augmented_mean")],
        ["image and augmented have shape (2, 2). This example changes brightness while keeping the pixel locations fixed.",
         "Preserving a label is a task assumption: brightness changes may be valid for object identity but invalid for an intensity measurement."],
        "Try scale = 2. Which pixels clip, and does the mean still double?", "numpy"),
    42: example("Compute intersection over union for two boxes", '''
        shift = {{0}}
        box_a = [0.0, 0.0, 2.0, 2.0]
        box_b = [shift, 0.0, shift + 2.0, 2.0]
        # Boxes use [x_min, y_min, x_max, y_max].
        width = max(0.0, min(box_a[2], box_b[2]) - max(box_a[0], box_b[0]))
        height = max(0.0, min(box_a[3], box_b[3]) - max(box_a[1], box_b[1]))
        intersection = width * height
        area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
        area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
        union = area_a + area_b - intersection
        iou = intersection / union
    ''', [("Intersection area", "intersection"), ("Union area", "union"), ("IoU", "iou")],
        ["Coordinates describe valid boxes with positive area and continuous edges; there is no inclusive-pixel +1 term.",
         "Clamping the overlap sizes to zero handles disjoint boxes. These boxes always have a nonzero union."],
        "Set shift to 0, 1 and 2. Predict the IoU before running each case."),
    43: example("Measure segmentation from Boolean masks", '''
        import numpy as np

        recovered, false_foreground = {{0}}, {{1}}
        truth = np.zeros(100, dtype=bool)
        truth[:10] = True
        prediction = np.zeros(100, dtype=bool)
        prediction[:recovered] = True
        prediction[10:10 + false_foreground] = True
        tp = np.count_nonzero(prediction & truth)
        fp = np.count_nonzero(prediction & ~truth)
        fn = np.count_nonzero(~prediction & truth)
        pixel_accuracy = np.mean(prediction == truth)
        iou = tp / (tp + fp + fn)
        dice = 2 * tp / (2 * tp + fp + fn)
    ''', [("Pixel accuracy", "pixel_accuracy"), ("Foreground IoU", "iou"), ("Dice", "dice")],
        ["The masks have shape (100,) and Boolean dtype. & combines masks element by element; ~ inverts a Boolean mask.",
         "Ten pixels are true foreground. IoU and Dice focus on foreground; the many background pixels can inflate overall accuracy."],
        "Set recovered = 0 and false_foreground = 0. Compare accuracy with foreground IoU.", "numpy"),
    44: example("Turn scores into precision and recall", '''
        import numpy as np

        threshold = {{0}}
        scores = np.array([0.95, 0.8, 0.65, 0.55, 0.4, 0.2])
        truth = np.array([1, 0, 1, 1, 0, 1], dtype=bool)
        prediction = scores >= threshold
        tp = np.count_nonzero(prediction & truth)
        fp = np.count_nonzero(prediction & ~truth)
        fn = np.count_nonzero(~prediction & truth)
        precision = tp / (tp + fp) if tp + fp else None
        recall = tp / (tp + fn)
    ''', [("Threshold", "threshold"), ("Precision", "precision"), ("Recall", "recall")],
        ["scores, truth and prediction have shape (6,). A score equal to the threshold counts as a positive prediction.",
         "Precision is undefined when there are no predicted positives; this example reports None rather than inventing a zero. There are four positive observations in the dataset, so recall's denominator is nonzero."],
        "Try threshold = 1 and inspect the undefined precision, then lower the threshold.", "numpy"),
    45: example("Split by video rather than by frame", '''
        test_count = {{0}}
        video_ids = list(range(20))
        train_videos = video_ids[:-test_count]
        test_videos = video_ids[-test_count:]
        assert set(train_videos).isdisjoint(test_videos)
        # Contrast: independently put each of five frames in test with probability q.
        q = test_count / len(video_ids)
        mixed_probability = 1 - (1 - q) ** 5 - q ** 5
        expected_mixed_videos = len(video_ids) * mixed_probability
    ''', [("Train videos", "len(train_videos)"), ("Test videos", "len(test_videos)"),
          ("Expected mixed videos under frame split", "expected_mixed_videos")],
        ["The lists contain group IDs, not frames. Assign every frame of a video to its video's split; this demonstration uses a fixed group ordering.",
         "The expected mixed count describes an independent random frame split. It is not the number mixed by the grouped split above, which is zero."],
        "Increase the held-out video count. How likely is a frame-level split to mix both sets within a video?"),
    46: example("Compare paired runs", '''
        import numpy as np

        mean_change = {{0}}
        baseline = np.array([70.0, 72.0, 71.0])
        candidate = baseline + np.array([mean_change - 1, mean_change, mean_change + 1])
        differences = candidate - baseline
        mean_difference = differences.mean()
    ''', [("Run 1 difference", "differences[0]"), ("Run 2 difference", "differences[1]"),
          ("Run 3 difference", "differences[2]"), ("Mean difference", "mean_difference")],
        ["Both arrays have shape (3,). Match each candidate run to the baseline run using the same split and seed.",
         "The scores are percentages; subtracting them gives percentage points. Three runs illustrate variability but do not establish a reliable significance claim."],
        "Try a small positive mean change. Does every individual paired run improve?", "numpy"),
    47: example("Weight slice scores by the evaluation mix", '''
        dark_share_percent = {{0}}
        dark_fraction = dark_share_percent / 100
        bright_accuracy, dark_accuracy = 0.9, 0.5
        aggregate_accuracy = (
            (1 - dark_fraction) * bright_accuracy + dark_fraction * dark_accuracy
        )
    ''', [("Bright accuracy", "bright_accuracy"), ("Dark accuracy", "dark_accuracy"),
          ("Aggregate accuracy", "aggregate_accuracy")],
        ["dark_share_percent is in percent; divide by 100 before using it as a probability weight.",
         "The per-slice accuracies stay fixed. The aggregate changes because the evaluation population changes."],
        "Compare a dark-image share of 20% and 80%. Did the model improve or did the mixture change?"),
    48: example("Implement cosine similarity", '''
        import numpy as np

        feature = np.array([{{0}}, 4.0])
        reference = np.array([1.0, 0.0])
        raw_dot = feature @ reference
        feature_norm = np.linalg.norm(feature)
        reference_norm = np.linalg.norm(reference)
        cosine_score = raw_dot / (feature_norm * reference_norm)
    ''', [("Raw dot product", "raw_dot"), ("Vector norm", "feature_norm"), ("Cosine score", "cosine_score")],
        ["feature and reference have shape (2,). Both norms are nonzero for these inputs.",
         "Cosine similarity divides out vector lengths and lies in [-1, 1]. General code must choose how to handle a zero vector."],
        "Multiply the entire feature vector by 3 in Python. Compare raw dot product with cosine similarity.", "numpy"),
}

EXAMPLES[40]["alternate"] = example("Let PyTorch compute the derivative", '''
    import torch

    log10_step = {{0}}
    h = 10.0 ** log10_step
    weight = torch.tensor(2.0, dtype=torch.float64, requires_grad=True)
    loss = weight ** 3
    loss.backward()
    autograd_gradient = weight.grad.item()
    numerical_gradient = ((2 + h) ** 3 - (2 - h) ** 3) / (2 * h)
''', [("Step size h", "h"), ("Autograd gradient", "autograd_gradient"),
      ("Numerical gradient", "numerical_gradient")],
    ["requires_grad=True asks PyTorch to track this scalar tensor. backward() populates the leaf tensor's .grad.",
     "Use float64 for this numerical comparison. Gradients accumulate when backward is called repeatedly; start with a fresh tensor or clear its gradient."],
    "Compare the autograd value with the central difference at several h values.", "torch")


from pytorch_examples import add_examples
add_examples(EXAMPLES, example)

# Lessons 49+ keep their examples beside their other files in extension_examples/lesson_NN.py.
from extension_examples import add_examples as add_extension_examples
add_extension_examples(EXAMPLES, example)


def render_code(entry, params):
    """Use the same placeholder convention as the browser, with valid Python numbers."""
    def replace(match):
        value = params[int(match[1])]
        return str(int(value)) if float(value).is_integer() else repr(float(value))
    return re.sub(r"\{\{(\d+)\}\}", replace, entry["code"])


def build():
    target = Path(__file__).with_name("python-examples.js")
    payload = json.dumps(EXAMPLES, ensure_ascii=False, indent=2)
    target.write_text("// Generated by build_python_examples.py; edit that source instead.\n"
                      "window.CV_PYTHON_EXAMPLES = " + payload + ";\n", encoding="utf-8")
    print(f"Built {len(EXAMPLES)} Python examples and {sum('alternate' in e for e in EXAMPLES.values())} optional PyTorch examples.")


if __name__ == "__main__":
    build()
