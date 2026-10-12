"""Optional native PyTorch equivalents. Keep CPU/CUDA choice explicit and local."""
import textwrap


def add_examples(examples, example):
    bodies = {
        1: '''
            scale = {{0}}
            image = torch.tensor([[20, 60], [100, 140]], **options)
            raw = scale * image + 10
            display = raw.clamp(0, 255)
            input_mean, raw_mean, display_mean = image.mean(), raw.mean(), display.mean()
        ''',
        4: '''
            score = torch.tensor({{0}}, **options)
            label = torch.tensor({{1}}, **options)
            probability = score.sigmoid()
            true_class_probability = torch.where(label == 1, probability, 1 - probability)
            # Feed the raw score to the stable fused loss, not sigmoid(score).
            loss = torch.nn.functional.binary_cross_entropy_with_logits(score, label)
        ''',
        7: '''
            scale = {{0}}
            matrix = torch.tensor([[scale, 1], [0, 1]], **options)
            x = torch.tensor([2, 3], **options)
            output = matrix @ x
            area_scale = torch.linalg.det(matrix).abs()
        ''',
        14: '''
            matrix = torch.diag(torch.tensor([4.0, {{0}}], **options))
            u, singular_values, vh = torch.linalg.svd(matrix, full_matrices=False)
            rank_one = singular_values[0] * torch.outer(u[:, 0], vh[0, :])
            retained_energy = singular_values[0].square() / singular_values.square().sum()
        ''',
        18: '''
            point = torch.tensor([{{0}}, 1.0], requires_grad=True, **options)
            value = point[0].square() + 2 * point[1].square()
            gradient, = torch.autograd.grad(value, point)
            direction = torch.tensor([0.6, 0.8], **options)
            directional_derivative = gradient @ direction
        ''',
        29: '''
            learning_rate = {{0}}
            weight = torch.tensor(0.0, requires_grad=True, **options)
            loss = (weight - 3).square()
            before_loss = loss.item()
            loss.backward()
            # An optimizer update should not become part of the gradient graph.
            with torch.no_grad():
                weight -= learning_rate * weight.grad
            updated_weight = weight.item()
            after_loss = (weight - 3).square().item()
            weight.grad = None
        ''',
        33: '''
            frequency = {{0}}
            sample_rate = 12.0
            times = torch.arange(12, **options) / sample_rate
            samples = torch.cos(2 * torch.pi * frequency * times)
            wrapped = frequency % sample_rate
            apparent_frequency = min(wrapped, sample_rate - wrapped)
            nyquist_limit = sample_rate / 2
            alias_samples = torch.cos(2 * torch.pi * apparent_frequency * times)
            assert torch.allclose(samples, alias_samples)
        ''',
        37: '''
            bias = torch.tensor({{0}}, **options)
            preactivation = 1.0 * 2.0 + bias
            relu_output = torch.relu(preactivation)
        ''',
        38: '''
            weight = torch.tensor({{0}}, requires_grad=True, **options)
            preactivation = weight * 2.0 - 1.0
            hidden = torch.relu(preactivation)
            prediction = 2.0 * hidden
            loss = 0.5 * (prediction - 3.0).square()
            loss.backward()
            weight_gradient = weight.grad.item()
        ''',
        39: '''
            penalty = {{0}}
            weight = torch.tensor(2.0, requires_grad=True, **options)
            # This illustrative data loss has the lesson's constant gradient 0.5.
            data_loss = 0.5 * weight
            penalty_loss = 0.5 * penalty * weight.square()
            data_gradient, = torch.autograd.grad(data_loss, weight)
            penalty_gradient, = torch.autograd.grad(penalty_loss, weight)
            total_gradient = data_gradient + penalty_gradient
            with torch.no_grad():
                updated_weight = weight - 0.1 * total_gradient
        ''',
        41: '''
            scale = {{0}}
            image = torch.tensor([[20, 60], [100, 140]], **options)
            augmented = (scale * image).clamp(0, 255)
            original_mean, augmented_mean = image.mean(), augmented.mean()
        ''',
        48: '''
            feature = torch.tensor([{{0}}, 4.0], **options)
            reference = torch.tensor([1.0, 0.0], **options)
            raw_dot = feature @ reference
            feature_norm = torch.linalg.vector_norm(feature)
            reference_norm = torch.linalg.vector_norm(reference)
            cosine_score = torch.nn.functional.cosine_similarity(feature, reference, dim=0)
        ''',
    }
    prefix = '''import torch

# Run in your installed Python environment. Change to "cpu" to compare.
device = "cuda" if torch.cuda.is_available() else "cpu"
options = dict(dtype=torch.float64, device=device)
'''
    specific = {
        4: 'binary_cross_entropy_with_logits combines sigmoid and log loss stably; targets are floating-point tensors with the same shape as scores.',
        7: 'The matrix has shape (2, 2); the input and output vectors have shape (2,). @ performs matrix multiplication.',
        14: 'SVD returns Vh, the transposed right singular vectors. Retained energy uses squared singular values.',
        18: 'autograd.grad returns both partial derivatives together. Dot with a unit direction to obtain its directional derivative.',
        29: 'backward() fills the leaf tensor gradient. Update under no_grad(), and clear gradients before a later training step.',
        38: 'Autograd chains the scalar operations automatically. PyTorch chooses derivative zero for ReLU at zero, matching this lesson.',
        39: 'The one-half in the L2 penalty makes its gradient penalty × weight. This is an explicit loss penalty, not a comparison of optimizer weight-decay conventions.',
        48: 'dim=0 compares the two feature vectors. PyTorch clamps small norms using epsilon; both lesson vectors are nonzero.',
    }
    for lesson, body in bodies.items():
        base = examples[lesson]
        examples[lesson]['alternate'] = example(
            'PyTorch: ' + base['title'], prefix + '\n' + textwrap.dedent(body).strip(), base['outputs'],
            [specific.get(lesson, 'Tensor operations apply the same calculation and shapes as the Python example above.'),
             'All tensors share one device and use float64 for comparison with the worked example. These tiny calculations do not need a GPU; CUDA is an optional learning exercise.'],
            'Run once on CUDA and once on CPU, then compare the numerical results. Keep related tensors on the same device.', 'torch')

