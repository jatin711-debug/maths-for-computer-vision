**Course overview:** All 68 lessons are available in the interactive webpage: a 50-lesson core plus an optional 18-lesson extension. Every lesson opens with plain-word primers for its new ideas, also collected in the Glossary. Every lesson has worked explanations, auto-checked practice with fresh numbers, four written exercises with solutions, a checkpoint and selected PDF readings that open at the cited page. Study at your own pace; the weekly schedule is a guide.

# Maths for Computer Vision - 28-week core with a 12-week extension

Designed for a learner who needs a refresher, can study 8-10 hours weekly, and wants recognition, detection and segmentation. The core plan is 246 hours and the extension adds 100, practical labs included. Timing is adjustable; advance by understanding, not by date.

## Course outcomes

Read CV mathematics, derive small models and their gradients, implement numerical ideas, train and evaluate real vision models, justify losses and metrics, and evaluate experiments. This is a strong foundation with an entry into advanced study; expertise and research depth require further practice.

## How to read this order

Lesson and module numbers are permanent labels, not a reading order, so follow the table below. Module 09 comes third because filters need only vectors, which puts real image work in the first six weeks. Gradient descent (Module 08) comes before the classifier that uses it (Module 07). Lessons 32 and 35 sit in Module 10 because they need neural-network layers. Lessons 55 and 56 sit in Module 11 because detection and segmentation depend on them.

## Weekly rhythm

A usual week has two 90-minute concept sessions, a 90-minute notebook or experiment session, a 60-minute reading session, a 90-minute practice session and a 60-minute checkpoint review: 8 hours. Weeks with a practical lab take up to 10 hours, and two weeks in Module 11 go entirely to labs. A week with one lesson has a second pass in place of the other, because that material needs the time. Weeks 1-2 use the starter schedule in first-two-weeks.md.

## Reading strategy

Lessons first, selected sections second, exercises third. Use MML as the mathematical bridge; CS205A for numerical depth; Szeliski for CV; Guo selectively for later geometry. Section numbers refer to verified contents, not PDF viewer page numbers. Stretch topics are optional.

| Step | Weeks | Module | Main result |
|---|---|---|---|
| 1 | 1-2 | 01. Refresh the language of maths | A one-page explanation plus the completed Week 1-2 notebook. |
| 2 | 3-4 | 02. Vectors, geometry and linear maps | A shape-annotated forward pass and a similarity-classification notebook. |
| 3 | 5-6 | 09. Images, convolution and frequency | A from-scratch filter notebook with a frequency-response comparison. |
| 4 | 7-8 | 03. Linear systems and least squares | A fitting report with clean/noisy/outlier comparisons and limitations. |
| 5 | 9-10 | 04. Eigenvectors, SVD and PCA | An image-compression experiment and PCA baseline. |
| 6 | 11-12 | 05. Calculus for learning | A worked chain-rule derivation and a verified gradient-check utility. |
| 7 | 13-14 | 06. Probability, noise and uncertainty | A noise experiment with uncertainty estimates and a written interpretation. |
| 8 | 15-16 | 08. Optimization: descent, momentum and curvature | An optimization experiment with justified settings and failure analysis. |
| 9 | 17-18 | 07. Statistical learning and losses | A recognition baseline with losses, confusion matrix and split protocol. |
| 10 | 19-21 | 10. Neural networks and backpropagation | A small neural network with gradient checks and a training report. |
| 11 | 22-26 | 11. Recognition, detection and segmentation | A CNN experiment with a localization or segmentation extension, plus the evidence checklists for Practical Labs 04-08. |
| 12 | 27-28 | 12. Capstone and a route into research | A 3-5 page report using the capstone template, a runnable experiment and a 10-minute mathematical explanation. |
| 13 | 29-30 | 13. Geometry of images and cameras (extension) | A rectification notebook with a robust homography estimate and a residual analysis. |
| 14 | 31 | 14. Matrix calculus and information theory (extension) | A gradient-and-information notebook with finite-difference checks and a short written explanation. |
| 15 | 32-34 | 15. Local features, motion and tracking (extension) | A features-and-tracking notebook: corner map, ratio-test precision curve, flow field and a tracked trajectory. |
| 16 | 35-37 | 16. Two-view geometry and neural rendering (extension) | A two-view notebook: estimated F with epipolar distances, a disparity map with depth error bars, and a rendered ray with its weights. |
| 17 | 38-40 | 17. Set prediction, generative models and splatting (extension) | A generative-models notebook: an EM log-likelihood curve, a diffusion sampling trajectory and a splatted image. |

## Module 01 - Refresh the language of maths (Weeks 1-2)

Read equations comfortably and connect arithmetic to images before tackling neural networks.

### Lessons

- 01 Images as numbers: scalars, vectors, matrices, shape and indexing
- 02 Functions and graphs: input, output, slope and composition
- 03 Sums, averages and squared error: reading sigma notation
- 04 Powers, logarithms and the sigmoid: confidence versus evidence

### By the end

- Explain each symbol in an image transformation.
- Evaluate and compose simple functions.
- Compute a mean and a mean squared error by hand.
- Use logarithms and exponentials without memorizing isolated formulas.

### Targeted reading

MML Chapter 1; CS205A 0.1 and 0.3.2. Use the supplied lessons first. Review the CS231n Python/NumPy tutorial if Python is unfamiliar.

### Practice

For I=[[20,60],[100,140]], compute 0.5I+10 and its mean. For predictions [2,4] and targets [1,7], compute MSE. Sketch y=2x+1 and explain its slope.

### Lab

Run the starter notebook. Create a toy grayscale image, change its brightness, normalize it, blend it with another image, and explain each array shape.

### Mastery gate

Without notes: explain scalar/vector/matrix, compute a four-pixel mean and an MSE, and distinguish scaling from adding an offset.

### Submit

A one-page explanation plus the completed Week 1-2 notebook.

## Module 02 - Vectors, geometry and linear maps (Weeks 3-4)

Understand features, similarities and the transformations performed by a neural-network layer.

### Lessons

- 05 Vectors as positions, displacements and features
- 06 Norms, dot products, angles and projections
- 07 Matrices as maps; multiplication and composition
- 08 Independence, bases, rank and null spaces

### By the end

- Explain the geometric meaning of a dot product.
- Track dimensions through matrix products.
- Connect rank to information preserved or lost.
- Separate elementwise multiplication from matrix multiplication.

### Targeted reading

MML 2.2 and 2.4-2.7; 3.1-3.5 and 3.8. CS205A 0.2-0.3. Optional: Guo Part I, Chapter 1, Sections 1-3.

### Practice

For x=[1,2] and w=[3,-1], compute w dot x. Apply A=[[2,0],[0,1]] to x and describe the geometry. Find a nonzero vector mapped to zero by B=[[1,1],[2,2]].

### Lab

Build a nearest-centroid classifier for synthetic 8x8 bars. Compare Euclidean distance and normalized dot-product similarity. Fit centroids using training data only.

### Practical labs in this module

- Lab 01: Your local vision lab (week 4)

### Mastery gate

Explain why a linear layer can change feature dimension and why matrix-product order matters. Solve three unseen shape questions.

### Submit

A shape-annotated forward pass and a similarity-classification notebook.

## Module 09 - Images, convolution and frequency (Weeks 5-6)

Build the mathematical picture behind filters: how an image is sampled, filtered and described by frequency.

### Lessons

- 33 Sampling, aliasing and image coordinates
- 34 Discrete convolution and cross-correlation
- 36 Fourier transforms, smoothing and edge responses

### By the end

- Compute a filter response by hand.
- Distinguish mathematical convolution from unflipped cross-correlation.
- Explain aliasing and why to blur before downsampling.
- Connect smoothing and edge detection to frequency content.

### Targeted reading

CV 2.3.1, 3.2, 3.4 and 3.5. MML 3.7 and complex-number reminders as needed. Read the indicated headings; do not read all of Chapter 3 at once.

### Practice

Convolve [1,2,3] with [1,1] in full mode. Find the response of the kernel [[1,0],[0,-1]] on the patch [[1,2],[3,4]]. Explain why two adjacent objects can become indistinguishable after excessive downsampling.

### Lab

Implement a small 2D cross-correlation using loops, compare it with a reference calculation, and test smoothing and edge kernels on synthetic images.

### Practical labs in this module

- Lab 02: Count objects with OpenCV (week 6)

### Mastery gate

Compute a filter response on an unseen patch, predict what a zero-sum kernel does on a flat region, and explain why blurring comes before downsampling.

### Submit

A from-scratch filter notebook with a frequency-response comparison.

## Module 03 - Linear systems and least squares (Weeks 7-8)

Learn how noisy measurements become a fitting problem and why stable solvers matter.

### Lessons

- 09 Exact, inconsistent and underdetermined systems
- 10 Least squares as projection and residual minimization
- 11 QR, pseudoinverses and numerical conditioning
- 12 Regularization and the cost of overfitting

### By the end

- Formulate a small fitting problem as Ax approximately b.
- Explain residual orthogonality.
- Explain why an explicit matrix inverse is usually a poor solving strategy.
- Compare unregularized fitting and ridge fitting.

### Targeted reading

MML 2.1-2.3 and 3.8; preview 9.1-9.2. CS205A Chapters 2-4. CV Appendix A.2.

### Practice

Fit y approximately ax+b to (0,1), (1,2), (2,2). Write A and b before computing. Derive A^T(Ax-b)=0 for least squares once Module 5 supplies the derivative tools; for now, explain the projection.

### Lab

Fit a line to clean data, then add noise and one outlier. Compare residuals and coefficient changes. Use numpy.linalg.lstsq; do not invert A^T A.

### Mastery gate

State when the solution is unique, distinguish residual from measurement noise, and explain an ill-conditioned example.

### Submit

A fitting report with clean/noisy/outlier comparisons and limitations.

## Module 04 - Eigenvectors, SVD and PCA (Weeks 9-10)

See how features can be compressed and why directions of variation matter.

### Lessons

- 13 Eigenvectors and repeated linear transformations
- 14 SVD as geometry and low-rank structure
- 15 PCA: centering, covariance and projection
- 16 Reconstruction error and the dangers of data leakage

### By the end

- Explain eigenvalues and singular values geometrically.
- Construct a truncated SVD reconstruction.
- Explain why PCA must center data.
- Fit preprocessing on training data and apply it unchanged to validation data.

### Targeted reading

MML 4.2 and 4.4-4.6; 10.1-10.4 and 10.6. CS205A Chapters 5-6. CV 5.2.3 and Appendix A.1.

### Practice

Find the eigenvalues of diag(3,1). For singular values [5,2,1], find the squared Frobenius reconstruction error after keeping the largest one. Explain why PCA directions are not class labels.

### Lab

Compress one grayscale image at several ranks; compare storage and error. Apply training-fitted PCA before the nearest-centroid classifier.

### Practical labs in this module

- Lab 03: Build and audit your dataset (week 10-11)

### Mastery gate

Distinguish eigenvalues from singular values, show a rank-k reconstruction, and explain one case where compression harms recognition.

### Submit

An image-compression experiment and PCA baseline.

## Module 05 - Calculus for learning (Weeks 11-12)

Understand derivatives as sensitivity and the chain rule as the engine of backpropagation.

### Lessons

- 17 Limits, derivatives and local linearity
- 18 Partial derivatives, gradients and directional derivatives
- 19 Jacobians, chain rule and computational graphs
- 20 Hessians, Taylor approximation and finite-difference checks

### By the end

- Derive basic scalar and multivariable derivatives.
- Track Jacobian dimensions.
- Differentiate a composed computation.
- Check analytic gradients against finite differences.

### Targeted reading

MML 5.1-5.3 and 5.5-5.8; treat 5.4 as reference. CS205A 0.4 and 12.3. Learn simple integrals as areas for Module 6.

### Practice

For L(w)=(3w-2)^2, find dL/dw and evaluate at w=1. For f(x,y)=x^2+3xy, compute its gradient. Verify a derivative using a central difference.

### Lab

Build a scalar computational graph and a gradient checker. Sweep the finite-difference step to observe truncation and roundoff error.

### Practical labs in this module

- Lab 03: Build and audit your dataset (week 10-11)

### Mastery gate

Derive the gradient of a new two-stage expression, state its shape, and explain why the numerical check has a useful step-size range.

### Submit

A worked chain-rule derivation and a verified gradient-check utility.

## Module 06 - Probability, noise and uncertainty (Weeks 13-14)

Understand what model probabilities mean and how noise changes the reliability of predictions.

### Lessons

- 21 Events, conditional probability and Bayes theorem
- 22 Random variables, distributions and expectations
- 23 Variance, covariance and Gaussian noise
- 24 Sampling, confidence and empirical uncertainty

### By the end

- Separate P(A given B) from P(B given A).
- Distinguish a density from a probability.
- Interpret covariance and correlation.
- Explain why high accuracy on a tiny sample is weak evidence.

### Targeted reading

MML 6.1-6.5; defer 6.6-6.7. CV Appendix B.1 and B.4. Guo Part III, Chapter 4 is optional measure-theory enrichment, not the probability foundation.

### Practice

Given P(A)=0.2, P(B given A)=0.8 and P(B given not A)=0.1, compute P(A given B). For pixel values [0,2,4], find mean and population variance. Integrate the uniform density on [0,1] over [0.2,0.5].

### Lab

Generate noisy versions of the same synthetic image. Estimate pixel means and variances; use repeated trials to measure classifier accuracy variation.

### Mastery gate

Solve an unseen Bayes problem, compute a variance, and explain why a continuous variable can have nonzero density but zero probability at one exact value.

### Submit

A noise experiment with uncertainty estimates and a written interpretation.

## Module 08 - Optimization: descent, momentum and curvature (Weeks 15-16)

Understand learning-rate choices, gradients and curvature, and why a step can diverge.

### Lessons

- 29 Gradient descent and optimality conditions
- 30 Mini-batch SGD, momentum and adaptive steps
- 31 Convexity, curvature and constrained problems

### By the end

- Derive and apply a gradient-descent update.
- Compare mini-batch SGD, momentum and adaptive steps on one objective.
- Explain the difference between convex and nonconvex objectives.
- Use a loss curve to tell a divergent step size from a slow one.

### Targeted reading

MML 7.1-7.3. CS205A Chapters 8-9; Chapter 10 optional. CV 5.3.6 and Appendix A.3.

### Practice

For L(w)=(w-3)^2, start at w=0 and compute one step with learning rate 0.1. Derive the convergence range 0<learning rate<1 for this particular quadratic. Do not generalize that range to every loss.

### Lab

Compare learning rates and momentum on a stretched quadratic and on a small least-squares image-fitting problem. Keep the data and initialization controlled.

### Mastery gate

Explain a divergent run, derive an update without notes, and distinguish a stationary point from a guaranteed global minimum.

### Submit

An optimization experiment with justified settings and failure analysis.

## Module 07 - Statistical learning and losses (Weeks 17-18)

Connect loss functions to assumptions about data, then build a transparent recognition baseline.

### Lessons

- 25 Likelihood, maximum likelihood and negative log likelihood
- 26 Priors, MAP and regularization
- 27 Logistic regression, softmax and cross entropy
- 28 Train/validation/test splits, bias, variance and calibration

### By the end

- Derive squared error from independent Gaussian residuals.
- Explain the role of a prior.
- Compute softmax and cross entropy stably.
- Compare confidence, correctness and calibration.

### Targeted reading

MML 8.1-8.4 and 8.6; 9.1-9.2. CV 5.1.2-5.1.3, 5.3.3-5.3.4 and Appendix B.2-B.4. MML Chapter 12 is optional after the core.

### Practice

For a correct-class probability of 0.8, compute -ln(0.8). Explain why predicting 0.99 for a wrong class incurs a large loss. Derive the softmax shift-invariance identity.

### Lab

Train softmax regression on synthetic image vectors with the gradient descent you learned in Module 08. Compare it with a nearest-centroid baseline; reserve test data until the final comparison.

### Mastery gate

Explain the statistical assumption behind MSE and cross entropy and spot two examples of data leakage.

### Submit

A recognition baseline with losses, confusion matrix and split protocol.

## Module 10 - Neural networks and backpropagation (Weeks 19-21)

Derive a trainable network before relying on a deep-learning framework, then add the convolutional layers and training diagnostics a vision model needs.

### Lessons

- 37 Affine layers, activations and expressive power
- 38 Backpropagation through a two-layer network
- 32 Initialization, scaling and optimization diagnostics
- 35 Padding, stride, channels and receptive fields
- 39 Regularization, normalization and numerical stability
- 40 Framework autograd compared with your own gradients

### By the end

- Write the forward pass with explicit batch and parameter shapes.
- Derive weight and bias gradients.
- Verify gradients numerically before training.
- Explain why stacking linear layers without nonlinearities stays linear.
- Calculate convolution output shapes, parameter counts and receptive fields.
- Use learning curves and initialization checks to diagnose training.

### Targeted reading

MML 5.6; CV 5.3.1-5.3.6 and 5.4. Optional CS231n neural-network case study; use current framework documentation when installing a framework.

### Practice

For X of shape (N,D), W1=(D,H), W2=(H,C), give every activation and gradient shape. Derive dL/dW for Z=XW+b. Explain the sum over the batch in the bias gradient. For input length 7, kernel size 3, padding 1 and stride 2, compute the output length.

### Lab

Implement a small NumPy MLP with stable softmax and mini-batch SGD. Overfit a tiny subset as a debugging check, then train and compare validation results.

### Mastery gate

Gradient checks pass away from nondifferentiable activation points, you can explain every backward-pass operation, and you can get the shapes right for an unseen convolution layer and say how weight sharing differs from a fully connected (dense) layer.

### Submit

A small neural network with gradient checks and a training report.

## Module 11 - Recognition, detection and segmentation (Weeks 22-26)

Understand how different vision tasks change the model outputs, objectives and evaluation, and read the modern backbones behind them: transfer learning, residual blocks, attention and multi-scale features.

### Lessons

- 41 CNN classification, inductive bias and augmentation
- 55 Attention and vision transformers
- 42 Bounding boxes, localization losses and IoU
- 43 Pixel classification, segmentation and class imbalance
- 44 Precision/recall, thresholds, average precision and mask metrics
- 56 Multi-scale features: pyramids, FPN and U-Net

### By the end

- Distinguish image labels, object boxes and pixel masks.
- Compute box IoU and mask IoU.
- Explain multi-part detection losses and pixelwise cross entropy.
- Recognize when background-dominated accuracy is misleading.
- Explain transfer learning: what is frozen, what is replaced and why fine-tuning uses a smaller step.
- Compute scaled dot-product attention by hand and explain residual connections.
- Say what FPN levels and U-Net skip connections add to a single feature map.

### Targeted reading

CV 5.4 and 6.2-6.4; CV 5.5.3, 5.4.3, 3.5.3, 6.3.3 and 6.4.2-6.4.3 for attention and multi-scale networks. CS231n public notes or lectures are optional applied support. Framework versions and dataset choices are selected when the lab begins.

### Practice

Two 2x2 boxes overlap over a 1x2 region: find their IoU. For TP=8, FP=2 and FN=4, compute precision and recall. Explain the failure of all-background predictions on a mostly background segmentation image. Compute one row of softmax(QK^T/sqrt(d)) for a query and two keys.

### Lab

Train a compact CNN on generated bars and rectangles, adding one-object box prediction or binary mask prediction and changing outputs and losses explicitly. Then move to real images in Practical Labs 04-08: a classifier, transfer learning, training diagnostics, detection and segmentation.

### Practical labs in this module

- Lab 04: Train a real-image classifier (week 22-23)
- Lab 05: Transfer learning and fine-tuning (week 24-25)
- Lab 06: Debug and resume training (week 25)
- Lab 07: Detect people in photographs (week 25-26)
- Lab 08: Segment people pixel by pixel (week 26)
- Lab 11: Use your model on new photos (week 26)

### Mastery gate

Explain outputs, loss and metric for all three tasks, justify one choice for class imbalance, and say what an FPN level adds that a single feature map lacks.

### Submit

A CNN experiment with a localization or segmentation extension, plus the evidence checklists for Practical Labs 04-08.

## Module 12 - Capstone and a route into research (Weeks 27-28)

Use the maths to justify model choices, evaluate evidence and read a research method critically.

### Lessons

- 45 Choose a question, dataset protocol and baseline
- 46 Compare models using controlled experiments
- 47 Audit errors, uncertainty and domain shift
- 48 Explain a paper and defend your mathematical decisions

### By the end

- Run a reproducible baseline and one justified improvement.
- Report meaningful metrics without tuning on the test set.
- Analyze at least three failure examples.
- Map a method description to its inputs, parameters, loss and assumptions.

### Targeted reading

Revisit CV Chapters 5-6 and the MML sections your project uses. Choose one original paper after discussing its prerequisites; do not treat a list of fashionable models as a reading assignment.

### Practice

Write your hypothesis before training. Predict what changes when you alter one hyperparameter. Separate measured results from explanations that remain hypotheses.

### Lab

Your capstone is Practical Lab 12: choose a modest question with data you can inspect, compare a baseline with one improvement, and evaluate once the procedure is fixed. Without local Python or a GPU, extend the runnable synthetic starter in the Module 12 notebook instead. Detection or segmentation is an optional task choice, not a second project.

### Practical labs in this module

- Lab 12: Build an independent CV project (week 27-28)

### Mastery gate

Deliver code, split protocol, seed, baseline, one controlled comparison, metrics, failure examples and a limitations section.

### Submit

A 3-5 page report using the capstone template, a runnable experiment and a 10-minute mathematical explanation.

## Module 13 - Geometry of images and cameras (Weeks 29-30, extension)

Describe how points move between planes and cameras, then fit those maps robustly to noisy matches. Ready early? Lesson 49 after Lesson 41; Lesson 50 after Lesson 49; Lesson 51 after Lesson 50; Lesson 52 after Lesson 51.

### Lessons

- 49 Homogeneous coordinates and 2D transformations
- 50 Homographies, warping and resampling
- 51 The pinhole camera, rotations and calibration
- 52 Robust fitting: RANSAC and Gauss-Newton refinement

### By the end

- Write translation, similarity, affine and projective maps as 3×3 matrices and say what each preserves.
- Estimate a homography from four correspondences and warp an image with inverse mapping and bilinear sampling.
- Project 3D points with K[R|t] and explain intrinsics, extrinsics and lens distortion.
- Fit a model with RANSAC and refine it with Gauss-Newton or Levenberg-Marquardt.

### Targeted reading

CV 2.1.1-2.1.5, 3.6.1, 8.1.1-8.1.4 and 11.1; Appendix A.3 and B.3. MML 3.9. Guo Part II, Chapter 1 and Part IV, Chapters 2-3 for geometric depth.

### Practice

Map the point (2,1) with the homography H=[[1,0,1],[0,1,0],[0.5,0,1]] and divide by the last coordinate. Explain why parallel lines can meet after a homography. For 40% outliers and a 2-point line model, how many RANSAC samples give 99% confidence of one clean sample?

### Lab

Pick four corners of a planar object in a photo, estimate H with the direct linear transform, and rectify the image with inverse mapping. Then add synthetic outlier matches and compare least squares with RANSAC.

### Mastery gate

Derive the two homography constraints from one correspondence, explain the role of the last coordinate, and justify a RANSAC threshold and iteration count.

### Submit

A rectification notebook with a robust homography estimate and a residual analysis.

## Module 14 - Matrix calculus and information theory (Week 31, extension)

Derive layer gradients in matrix form and compare distributions with entropy and KL divergence. Ready early? Lesson 53 after Lesson 40; Lesson 54 after Lesson 27.

### Lessons

- 53 Matrix calculus for layers and losses
- 54 Entropy, KL divergence and contrastive learning

### By the end

- Derive gradients of linear layers and quadratic forms with their shapes, using the chain rule and trace identities.
- Compute entropy, cross-entropy and KL divergence, and explain label smoothing and the InfoNCE loss.

### Targeted reading

MML 5.3-5.6. CV 5.3.4-5.3.5.

### Practice

Find the gradient of f(x)=xᵀAx for a non-symmetric A. Compute KL(p‖q) for p=(0.5,0.5) and q=(0.9,0.1), and KL(q‖p).

### Lab

Check linear-layer gradients against finite differences, then compute entropy, cross-entropy and KL divergence for real softmax outputs and observe the effect of label smoothing.

### Mastery gate

Derive dL/dW for a linear layer from the scalar chain rule, and explain why KL divergence is not symmetric.

### Submit

A gradient-and-information notebook with finite-difference checks and a short written explanation.

## Module 15 - Local features, motion and tracking (Weeks 32-34, extension)

Find and describe distinctive points, measure how image content moves between frames, and follow objects over time with a Kalman filter. Ready early? Lesson 57 after Lesson 52; Lesson 58 after Lesson 57; Lesson 59 after Lesson 57; Lesson 60 after Lesson 42.

### Lessons

- 57 Image gradients, the structure tensor and corners
- 58 Scale space, descriptors and matching
- 59 Optical flow and direct image alignment
- 60 Multivariate Gaussians, Kalman filtering and data association

### By the end

- Compute image gradients with derivative-of-Gaussian filters and classify a window as flat, edge or corner from its structure tensor.
- Detect blobs at their characteristic scale and accept descriptor matches with the ratio and mutual-nearest-neighbour tests.
- Solve Lucas–Kanade as a 2×2 least-squares problem, explain the aperture problem and recover large motion coarse-to-fine.
- Derive the Kalman predict and update steps from Gaussian rules and assign detections to tracks with the Hungarian algorithm.

### Targeted reading

CV 3.2.1-3.2.3, 7.1.1-7.1.5, 7.2.1, 9.1-9.3, Appendix B.1 and B.6. MML 6.5 and 4.3.

### Practice

Compute the Harris response for a window with gradients (1,0),(1,0),(0,1),(0,1). Solve Lucas–Kanade for four pixels. Run one Kalman predict-update step by hand.

### Lab

Map corners and gradient orientation on a photo, match features to a warped copy with a known homography, estimate optical flow on a synthetic warp, and track noisy boxes with a Kalman filter.

### Practical labs in this module

- Lab 09: Align views and track motion (week 34)

### Mastery gate

Explain why the eigenvalues of the structure tensor separate corners from edges, why Lucas–Kanade fails on a straight edge, and how a Kalman filter corrects a velocity it never measures.

### Submit

A features-and-tracking notebook: corner map, ratio-test precision curve, flow field and a tracked trajectory.

## Module 16 - Two-view geometry and neural rendering (Weeks 35-37, extension)

Relate two views of a scene, recover depth and camera motion, refine everything with bundle adjustment, and render novel views by integrating along rays. Ready early? Lesson 61 after Lesson 58; Lesson 62 after Lesson 61; Lesson 63 after Lesson 62; Lesson 64 after Lesson 61.

### Lessons

- 61 Epipolar geometry and the eight-point algorithm
- 62 Triangulation, rectification and stereo depth
- 63 Rotations as a manifold, point-set alignment and bundle adjustment
- 64 Volume rendering and neural radiance fields

### By the end

- Derive the epipolar constraint, estimate the fundamental matrix with the normalised eight-point algorithm and recover pose from the essential matrix.
- Triangulate points, compute disparity from a cost volume and propagate disparity error to depth.
- Update rotations with the exponential map, align point sets with Kabsch and explain the Schur complement in bundle adjustment.
- Render a pixel by alpha-compositing samples along a ray and explain why NeRF needs positional encoding.

### Targeted reading

CV 11.2-11.4, 12.1, 12.3-12.4, 12.7, 13.2.1, 14.6 and Appendix A.3-A.4. CS205A 6.2.4. Guo Part II, Chapter 1.

### Practice

Check the epipolar constraint for a sideways camera step. Triangulate one point and convert disparity 20 px to depth with f = 800 px and B = 0.1 m. Composite three samples along a ray.

### Lab

Draw epipolar lines between two synthetic views, block-match a rectified stereo pair, align point sets with ICP and ray-march a small volumetric scene.

### Mastery gate

Explain why a planar scene or pure rotation makes the fundamental matrix degenerate, why depth error grows with the square of distance, and why occluded samples receive little gradient in volume rendering.

### Submit

A two-view notebook: estimated F with epipolar distances, a disparity map with depth error bars, and a rendered ray with its weights.

## Module 17 - Set prediction, generative models and splatting (Weeks 38-40, extension)

Read the mathematics behind DETR-style detectors, variational autoencoders, diffusion models and 3D Gaussian splatting. Ready early? Lesson 65 after Lesson 64; Lesson 66 after Lesson 60; Lesson 67 after Lesson 66; Lesson 68 after Lesson 64.

### Lessons

- 65 Cross-attention, positional encodings and set prediction
- 66 Latent-variable models: from EM to the variational autoencoder
- 67 Diffusion models: noising, denoising and sampling
- 68 3D Gaussian splatting

### By the end

- Compute cross-attention and sinusoidal position encodings, and train a set predictor with a Hungarian-matched loss and GIoU.
- Fit a Gaussian mixture with EM, derive the ELBO and explain the reparameterisation trick and the Gaussian KL term.
- Derive closed-form forward noising, explain noise prediction as denoising and sample with DDPM, DDIM and guidance.
- Project a 3D Gaussian to a 2D splat with the camera Jacobian and alpha-composite depth-sorted splats.

### Targeted reading

CV 5.5.3, 6.3.3, 6.4.2-6.4.3, 5.2.1-5.2.2, 5.5.4, 13.4. MML 6.5, 6.7, 11.1-11.4. Primary papers for diffusion and splatting are cited in the lessons.

### Practice

Compute GIoU for two non-overlapping boxes. Compute GMM responsibilities and a Gaussian KL. Noise and denoise one value with known noise. Project one 3D Gaussian to a 2D covariance.

### Lab

Match predicted boxes to targets with the Hungarian algorithm, fit a colour mixture with EM, sample 2D diffusion with DDPM and DDIM steps, and render a small set of Gaussian splats.

### Practical labs in this module

- Lab 10: Retrieve images and prompt masks (week 39)

### Mastery gate

Explain why set prediction needs a matching step, why the ELBO is a lower bound, why predicting noise recovers the clean image, and why splats must be sorted by depth.

### Submit

A generative-models notebook: an EM log-likelihood curve, a diffusion sampling trajectory and a splatted image.

## Practical labs

Twelve labs apply the maths to real images in installed Python. Each sits in the weekly plan right after the lessons it needs. Lab 10 is optional.

| Lab | Weeks | Title | Do these lessons first |
|---|---|---|---|
| 01 | 4 | Your local vision lab | 1, 7 |
| 02 | 6 | Count objects with OpenCV | 1, 33, 34 |
| 03 | 10-11 | Build and audit your dataset | 12, 16 |
| 04 | 22-23 | Train a real-image classifier | 27, 30, 38, 40, 41 |
| 05 | 24-25 | Transfer learning and fine-tuning | 39, 41, 55 |
| 06 | 25 | Debug and resume training | 20, 32, 39 |
| 07 | 25-26 | Detect people in photographs | 42, 44, 56 |
| 08 | 26 | Segment people pixel by pixel | 43, 44, 56 |
| 09 | 34 | Align views and track motion | 50, 52, 58, 59, 60 |
| 10 | 39 | Retrieve images and prompt masks | 54, 55 |
| 11 | 26 | Use your model on new photos | 28, 41 |
| 12 | 27-28 | Build an independent CV project | 45 |

## Capstone rubric

There is one capstone: Practical Lab 12, reported with the capstone template. The Module 12 notebook is the alternative route if you have no local Python environment for the lab.

- Mathematical explanation: 30%. Define shapes, assumptions, objective and relevant derivatives.
- Experiment design: 25%. Fixed split, seed, baseline and one controlled comparison.
- Evaluation and errors: 25%. Appropriate metrics, failure cases, uncertainty and limitations.
- Reproducibility and communication: 20%. Runnable code and a clear report.

## Advanced continuation after the core

Modules 13-17 carry paths 1 and 4 below a long way: homogeneous coordinates, homographies, cameras and robust fitting; matrix calculus and information theory; local features, optical flow and tracking; epipolar geometry, stereo, bundle adjustment on the rotation manifold and neural rendering; set prediction, VAEs, diffusion models and Gaussian splatting. Each of those lessons opens as soon as what it needs is done, and the lesson that opens it links to it, so you can take them before or alongside the capstone. Then choose one path: (1) attention and vision transformers, beginning with dot products, softmax and matrix gradients; (2) segmentation and detection objectives, imbalance and evaluation; (3) statistical learning, generalization and uncertainty; (4) geometric CV, adding projective geometry, camera models, rotations and manifold optimization. Guo becomes more central on path 4. Choose primary papers and current implementations when that stage arrives.
