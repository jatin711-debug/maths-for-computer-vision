"""Build original teaching materials; source books are referenced, never reproduced."""
from pathlib import Path
import contextlib
import hashlib
import io
import json
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, Preformatted,
)

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
PDF_PATH = ROOT / 'output' / 'pdf' / 'maths-for-computer-vision-course.pdf'

SOURCES = {
    'MML': {
        'title': 'Mathematics for Machine Learning',
        'authors': 'Marc Peter Deisenroth, A. Aldo Faisal, Cheng Soon Ong',
        'edition': 'Cambridge University Press, 2020; downloaded draft dated 2024-01-15',
        'path': str(BASE / 'resources' / 'mathematics-for-machine-learning.pdf'),
        'url': 'https://mml-book.github.io/',
        'role': 'The main mathematical bridge. Read selected sections after the lesson.',
    },
    'CS205A': {
        'title': 'Mathematical Methods for Computer Vision, Robotics, and Graphics',
        'authors': 'Justin Solomon',
        'edition': 'Stanford CS205A course notes, Fall 2013',
        'path': str(BASE / 'resources' / 'cs205a-mathematical-methods.pdf'),
        'role': 'Selected numerical explanations: least squares, SVD, conditioning, optimization.',
    },
    'CV': {
        'title': 'Computer Vision: Algorithms and Applications',
        'authors': 'Richard Szeliski',
        'edition': 'Second edition, 2022',
        'path': str(BASE / 'resources' / 'computer-vision-szeliski-2nd-edition.pdf'),
        'role': 'The application companion, especially Chapters 3, 5, 6 and Appendices A, B.',
    },
    'GUO': {
        'title': 'Modern Mathematics and Applications in Computer Graphics and Vision',
        'authors': 'Hongyu Guo',
        'edition': 'World Scientific, 2014',
        'path': str(BASE / 'resources' / 'modern-mathematics-graphics-and-vision.pdf'),
        'role': 'Optional geometry enrichment. Most topology and manifold chapters come later.',
    },
}

MODULES = [
    dict(n=1, weeks='1-2', title='Refresh the language of maths',
         purpose='Read equations comfortably and connect arithmetic to images before tackling neural networks.',
         lessons=['01 Images as numbers: scalars, vectors, matrices, shape and indexing',
                  '02 Functions and graphs: input, output, slope and composition',
                  '03 Sums, averages and squared error: reading sigma notation',
                  '04 Powers, logarithms and the sigmoid: confidence versus evidence'],
         outcomes=['Explain each symbol in an image transformation.', 'Evaluate and compose simple functions.',
                   'Compute a mean and a mean squared error by hand.', 'Use logarithms and exponentials without memorizing isolated formulas.'],
         reading='MML Chapter 1; CS205A 0.1 and 0.3.2. Use the supplied lessons first. Review the CS231n Python/NumPy tutorial if Python is unfamiliar.',
         practice='For I=[[20,60],[100,140]], compute 0.5I+10 and its mean. For predictions [2,4] and targets [1,7], compute MSE. Sketch y=2x+1 and explain its slope.',
         lab='Run the starter notebook. Create a toy grayscale image, change its brightness, normalize it, blend it with another image, and explain each array shape.',
         gate='Without notes: explain scalar/vector/matrix, compute a four-pixel mean and an MSE, and distinguish scaling from adding an offset.',
         artifact='A one-page explanation plus the completed Week 1-2 notebook.'),
    dict(n=2, weeks='3-4', title='Vectors, geometry and linear maps',
         purpose='Understand features, similarities and the transformations performed by a neural-network layer.',
         lessons=['05 Vectors as positions, displacements and features', '06 Norms, dot products, angles and projections',
                  '07 Matrices as maps; multiplication and composition', '08 Independence, bases, rank and null spaces'],
         outcomes=['Explain the geometric meaning of a dot product.', 'Track dimensions through matrix products.',
                   'Connect rank to information preserved or lost.', 'Separate elementwise multiplication from matrix multiplication.'],
         reading='MML 2.2 and 2.4-2.7; 3.1-3.5 and 3.8. CS205A 0.2-0.3. Optional: Guo Part I, Chapter 1, Sections 1-3.',
         practice='For x=[1,2] and w=[3,-1], compute w dot x. Apply A=[[2,0],[0,1]] to x and describe the geometry. Find a nonzero vector mapped to zero by B=[[1,1],[2,2]].',
         lab='Build a nearest-centroid classifier for synthetic 8x8 bars. Compare Euclidean distance and normalized dot-product similarity. Fit centroids using training data only.',
         gate='Explain why a linear layer can change feature dimension and why matrix-product order matters. Solve three unseen shape questions.',
         artifact='A shape-annotated forward pass and a similarity-classification notebook.'),
    dict(n=3, weeks='5-6', title='Linear systems and least squares',
         purpose='Learn how noisy measurements become a fitting problem and why stable solvers matter.',
         lessons=['09 Exact, inconsistent and underdetermined systems', '10 Least squares as projection and residual minimization',
                  '11 QR, pseudoinverses and numerical conditioning', '12 Regularization and the cost of overfitting'],
         outcomes=['Formulate a small fitting problem as Ax approximately b.', 'Explain residual orthogonality.',
                   'Explain why an explicit matrix inverse is usually a poor solving strategy.', 'Compare unregularized fitting and ridge fitting.'],
         reading='MML 2.1-2.3 and 3.8; preview 9.1-9.2. CS205A Chapters 2-4. CV Appendix A.2.',
         practice='Fit y approximately ax+b to (0,1), (1,2), (2,2). Write A and b before computing. Derive A^T(Ax-b)=0 for least squares once Module 5 supplies the derivative tools; for now, explain the projection.',
         lab='Fit a line to clean data, then add noise and one outlier. Compare residuals and coefficient changes. Use numpy.linalg.lstsq; do not invert A^T A.',
         gate='State when the solution is unique, distinguish residual from measurement noise, and explain an ill-conditioned example.',
         artifact='A fitting report with clean/noisy/outlier comparisons and limitations.'),
    dict(n=4, weeks='7-8', title='Eigenvectors, SVD and PCA',
         purpose='See how features can be compressed and why directions of variation matter.',
         lessons=['13 Eigenvectors and repeated linear transformations', '14 SVD as geometry and low-rank structure',
                  '15 PCA: centering, covariance and projection', '16 Reconstruction error and the dangers of data leakage'],
         outcomes=['Explain eigenvalues and singular values geometrically.', 'Construct a truncated SVD reconstruction.',
                   'Explain why PCA must center data.', 'Fit preprocessing on training data and apply it unchanged to validation data.'],
         reading='MML 4.2 and 4.4-4.6; 10.1-10.4 and 10.6. CS205A Chapters 5-6. CV 5.2.3 and Appendix A.1.',
         practice='Find the eigenvalues of diag(3,1). For singular values [5,2,1], find the squared Frobenius reconstruction error after keeping the largest one. Explain why PCA directions are not class labels.',
         lab='Compress one grayscale image at several ranks; compare storage and error. Apply training-fitted PCA before the nearest-centroid classifier.',
         gate='Distinguish eigenvalues from singular values, show a rank-k reconstruction, and explain one case where compression harms recognition.',
         artifact='An image-compression experiment and PCA baseline.'),
    dict(n=5, weeks='9-10', title='Calculus for learning',
         purpose='Understand derivatives as sensitivity and the chain rule as the engine of backpropagation.',
         lessons=['17 Limits, derivatives and local linearity', '18 Partial derivatives, gradients and directional derivatives',
                  '19 Jacobians, chain rule and computational graphs', '20 Hessians, Taylor approximation and finite-difference checks'],
         outcomes=['Derive basic scalar and multivariable derivatives.', 'Track Jacobian dimensions.',
                   'Differentiate a composed computation.', 'Check analytic gradients against finite differences.'],
         reading='MML 5.1-5.3 and 5.5-5.8; treat 5.4 as reference. CS205A 0.4 and 12.3. Learn simple integrals as areas for Module 6.',
         practice='For L(w)=(3w-2)^2, find dL/dw and evaluate at w=1. For f(x,y)=x^2+3xy, compute its gradient. Verify a derivative using a central difference.',
         lab='Build a scalar computational graph and a gradient checker. Sweep the finite-difference step to observe truncation and roundoff error.',
         gate='Derive the gradient of a new two-stage expression, state its shape, and explain why the numerical check has a useful step-size range.',
         artifact='A worked chain-rule derivation and a verified gradient-check utility.'),
    dict(n=6, weeks='11-12', title='Probability, noise and uncertainty',
         purpose='Understand what model probabilities mean and how noise changes the reliability of predictions.',
         lessons=['21 Events, conditional probability and Bayes theorem', '22 Random variables, distributions and expectations',
                  '23 Variance, covariance and Gaussian noise', '24 Sampling, confidence and empirical uncertainty'],
         outcomes=['Separate P(A given B) from P(B given A).', 'Distinguish a density from a probability.',
                   'Interpret covariance and correlation.', 'Explain why high accuracy on a tiny sample is weak evidence.'],
         reading='MML 6.1-6.5; defer 6.6-6.7. CV Appendix B.1. Guo Part III, Chapter 4 is optional measure-theory enrichment, not the probability foundation.',
         practice='Given P(A)=0.2, P(B given A)=0.8 and P(B given not A)=0.1, compute P(A given B). For pixel values [0,2,4], find mean and population variance. Integrate the uniform density on [0,1] over [0.2,0.5].',
         lab='Generate noisy versions of the same synthetic image. Estimate pixel means and variances; use repeated trials to measure classifier accuracy variation.',
         gate='Solve an unseen Bayes problem, compute a variance, and explain why a continuous variable can have nonzero density but zero probability at one exact value.',
         artifact='A noise experiment with uncertainty estimates and a written interpretation.'),
    dict(n=7, weeks='13-14', title='Statistical learning and losses',
         purpose='Connect loss functions to assumptions about data, then build a transparent recognition baseline.',
         lessons=['25 Likelihood, maximum likelihood and negative log likelihood', '26 Priors, MAP and regularization',
                  '27 Logistic regression, softmax and cross entropy', '28 Train/validation/test splits, bias, variance and calibration'],
         outcomes=['Derive squared error from independent Gaussian residuals.', 'Explain the role of a prior.',
                   'Compute softmax and cross entropy stably.', 'Compare confidence, correctness and calibration.'],
         reading='MML 8.1-8.4 and 8.6; 9.1-9.2. CV 5.1.2-5.1.3, 5.3.3-5.3.4 and Appendix B.2-B.4. MML Chapter 12 is optional after the core.',
         practice='For a correct-class probability of 0.8, compute -ln(0.8). Explain why predicting 0.99 for a wrong class incurs a large loss. Derive the softmax shift-invariance identity.',
         lab='Train logistic or softmax regression on synthetic image vectors. Compare a linear model with a nearest-centroid baseline; reserve test data until the final comparison.',
         gate='Explain the statistical assumption behind MSE and cross entropy and spot two examples of data leakage.',
         artifact='A recognition baseline with losses, confusion matrix and split protocol.'),
    dict(n=8, weeks='15-16', title='Optimization and reliable training',
         purpose='Understand learning-rate choices, gradients, curvature and training failure modes.',
         lessons=['29 Gradient descent and optimality conditions', '30 Mini-batch SGD, momentum and adaptive steps',
                  '31 Convexity, curvature and constrained problems', '32 Initialization, scaling and optimization diagnostics'],
         outcomes=['Derive and apply a gradient-descent update.', 'Separate optimization failure from generalization failure.',
                   'Explain the difference between convex and nonconvex objectives.', 'Use learning curves to diagnose training behavior.'],
         reading='MML 7.1-7.3. CS205A Chapters 8-9; Chapter 10 optional. CV 5.3.6 and Appendix A.3.',
         practice='For L(w)=(w-3)^2, start at w=0 and compute one step with learning rate 0.1. Derive the convergence range 0<learning rate<1 for this particular quadratic. Do not generalize that range to every loss.',
         lab='Compare learning rates and momentum on a stretched quadratic and your linear classifier. Keep the data split and initialization controlled.',
         gate='Explain a divergent run, derive an update without notes, and distinguish a stationary point from a guaranteed global minimum.',
         artifact='An optimization experiment with justified settings and failure analysis.'),
    dict(n=9, weeks='17-18', title='Images, convolution and frequency',
         purpose='Build the mathematical picture behind filters and convolutional layers.',
         lessons=['33 Sampling, aliasing and image coordinates', '34 Discrete convolution and cross-correlation',
                  '35 Padding, stride, channels and receptive fields', '36 Fourier transforms, smoothing and edge responses'],
         outcomes=['Compute a filter response by hand.', 'Distinguish mathematical convolution from unflipped cross-correlation.',
                   'Calculate output shapes and receptive fields.', 'Connect smoothing and edge detection to frequency content.'],
         reading='CV 3.2, 3.4 and 3.5; 5.4. MML 3.7 and complex-number reminders as needed. Read the indicated headings; do not read all of Chapter 3 at once.',
         practice='For input length 7, kernel size 3, padding 1 and stride 2, compute output length. Convolve [1,2,3] with [1,1] in full mode. Explain why two adjacent objects can become indistinguishable after excessive downsampling.',
         lab='Implement a small 2D cross-correlation using loops, compare it with a reference calculation, and test smoothing and edge kernels on synthetic images.',
         gate='Get shapes correct for an unseen convolution layer and explain how weight sharing differs from a fully connected layer.',
         artifact='A from-scratch filter notebook with an output-shape calculation sheet.'),
    dict(n=10, weeks='19-20', title='Neural networks and backpropagation',
         purpose='Derive a trainable network before relying on a deep-learning framework.',
         lessons=['37 Affine layers, activations and expressive power', '38 Backpropagation through a two-layer network',
                  '39 Regularization, normalization and numerical stability', '40 Framework autograd compared with your own gradients'],
         outcomes=['Write the forward pass with explicit batch and parameter shapes.', 'Derive weight and bias gradients.',
                   'Verify gradients numerically before training.', 'Explain why stacking linear layers without nonlinearities stays linear.'],
         reading='MML 5.6; CV 5.3.1-5.3.6. Optional CS231n neural-network case study; use current framework documentation when installing a framework.',
         practice='For X of shape (N,D), W1=(D,H), W2=(H,C), give every activation and gradient shape. Derive dL/dW for Z=XW+b. Explain the sum over the batch in the bias gradient.',
         lab='Implement a small NumPy MLP with stable softmax and mini-batch SGD. Overfit a tiny subset as a debugging check, then train and compare validation results.',
         gate='Gradient checks pass away from nondifferentiable activation points, and you can explain every backward-pass operation.',
         artifact='A small neural network with gradient checks and a training report.'),
    dict(n=11, weeks='21-22', title='Recognition, detection and segmentation',
         purpose='Understand how different vision tasks change the model outputs, objectives and evaluation.',
         lessons=['41 CNN classification, inductive bias and augmentation', '42 Bounding boxes, localization losses and IoU',
                  '43 Pixel classification, segmentation and class imbalance', '44 Precision/recall, thresholds, average precision and mask metrics'],
         outcomes=['Distinguish image labels, object boxes and pixel masks.', 'Compute box IoU and mask IoU.',
                   'Explain multi-part detection losses and pixelwise cross entropy.', 'Recognize when background-dominated accuracy is misleading.'],
         reading='CV 5.4 and 6.2-6.4. CS231n public notes or lectures are optional applied support. Framework versions and dataset choices are selected when the lab begins.',
         practice='Two 2x2 boxes overlap over a 1x2 region: find their IoU. For TP=8, FP=2 and FN=4, compute precision and recall. Explain the failure of all-background predictions on a mostly background segmentation image.',
         lab='Train a compact CNN on generated bars/rectangles. Add one-object box prediction or binary mask prediction, changing outputs and losses explicitly. This toy task teaches mechanics, not real-world performance.',
         gate='Explain outputs, loss and metric for all three tasks, and justify one choice for class imbalance.',
         artifact='A CNN experiment with either a localization or segmentation extension.'),
    dict(n=12, weeks='23-24', title='Capstone and a route into research',
         purpose='Use the maths to justify model choices, evaluate evidence and read a research method critically.',
         lessons=['45 Choose a question, dataset protocol and baseline', '46 Compare models using controlled experiments',
                  '47 Audit errors, uncertainty and domain shift', '48 Explain a paper and defend your mathematical decisions'],
         outcomes=['Run a reproducible baseline and one justified improvement.', 'Report meaningful metrics without tuning on the test set.',
                   'Analyze at least three failure examples.', 'Map a method description to its inputs, parameters, loss and assumptions.'],
         reading='Revisit CV Chapters 5-6 and the MML sections your project uses. Choose one original paper after discussing its prerequisites; do not treat a list of fashionable models as a reading assignment.',
         practice='Write your hypothesis before training. Predict what changes when you alter one hyperparameter. Separate measured results from explanations that remain hypotheses.',
         lab='Extend the synthetic recognition project, or choose a small public dataset when the module starts. Compare a linear baseline with an MLP or CNN; detection or segmentation is an optional extension, not a second mandatory capstone.',
         gate='Deliver code, split protocol, seed, baseline, one controlled comparison, metrics, failure examples and a limitations section.',
         artifact='A 3-5 page report, runnable experiment and a 10-minute mathematical explanation.'),
]

DIAGNOSTIC = [
    'Solve 3x+5=20. Show one intermediate step.',
    'For f(x)=2x+1, compute f(3). What is the slope of its graph?',
    'Simplify ln(e^2). What input values are allowed for ln(x) over the real numbers?',
    'Find the mean of pixel values 20, 60, 100, 140.',
    'If I=[[20,60],[100,140]], compute 0.5I+10 entry by entry.',
    'For vectors u=[1,2] and v=[3,4], compute their dot product.',
    'If A is 3x2 and x is 2x1, what is the shape of Ax? Can xA be multiplied in this order?',
    'Solve x+y=5 and x-y=1.',
    'Differentiate x^2. Then differentiate (2x+1)^2.',
    'For f(x,y)=x^2+3xy, find the two partial derivatives.',
    'Given P(A)=0.2, P(B given A)=0.8 and P(B given not A)=0.1, find P(A given B).',
    'Optional Python: create a 2x2 NumPy array and compute its mean. Explain the difference between * and @ for arrays.',
]

LESSON_01 = r'''# Lesson 01 - An image is a collection of numbers

**Time:** 45-60 minutes, followed by 30 minutes of practice.
**Prerequisites:** addition, multiplication and a willingness to inspect small arrays.
**Goal:** explain scalars, vectors and matrices using an image; calculate a simple image transformation.

## 1. Start with a tiny image

Imagine a grayscale image with only four pixels:

\[
I=\begin{bmatrix}20&60\\100&140\end{bmatrix}.
\]

For this toy 8-bit representation, 0 means black and 255 means white. Larger values appear lighter. This is a model of stored pixel values, not a claim that every file stores physically linear light intensity.

The matrix has two rows and two columns: its shape is 2 by 2. A single pixel value such as 60 is a **scalar**. The ordered list [20,60,100,140] is a **vector** made by reading the rows in order. The rectangular arrangement is a **matrix**. Flattening changes the representation, not the four values; if we forget the shape and ordering, we lose knowledge of which pixels were neighbors.

In mathematical notation, I[r,c] means the entry at row r, column c. Here and in the notebook, indexing starts at zero: I[0,1]=60. Many maths books start at one; always check the convention.

## 2. Scaling and shifting are different operations

Consider a transformation that halves each value and then adds 10:

\[
J=0.5I+10=\begin{bmatrix}20&40\\60&80\end{bmatrix}.
\]

Here '+10' means add 10 to every entry. More explicitly it is 0.5I+10 times an all-ones matrix of the same shape. The top-right pixel changes from 60 to 0.5(60)+10=40. Scaling changes differences between values: a difference of 40 becomes 20. Adding an offset changes all values equally, so differences stay the same.

This operation is **affine**: scale plus offset. With offset zero it is linear. We will prove the distinction later; today the useful distinction is operational.

## 3. A mean is a first image summary

The original mean is (20+60+100+140)/4=80. The transformed mean is (20+40+60+80)/4=50. We can predict the result without adding again: 0.5 times 80 plus 10 equals 50. This identity holds for ordinary scaling and offset before clipping or rounding.

A mean compresses four numbers into one. It cannot tell us where bright pixels occur. Images [[0,255],[0,255]] and [[0,0],[255,255]] have the same mean, even though one has a vertical edge and the other a horizontal edge. Recognition requires information about arrangement.

## 4. Range limits and types matter

If a transformation produces -5 or 270, those values lie outside the chosen display range. Clipping replaces values below 0 by 0 and above 255 by 255. It destroys information: 260 and 300 both become 255. Work in floating-point arrays for calculations; clip deliberately when producing a display image. Arithmetic on unsigned 8-bit arrays can wrap around rather than implement your mathematical intention.

For normalized stored values, use I/255. The result lies in [0,1]. Dividing by 255 rescales stored values; it does not by itself correct a camera response or gamma encoding.

## 5. Blending two images is a weighted sum

Let A=[[0,255],[0,255]] and B=[[0,0],[255,255]]. At weight a=0.5, C=aA+(1-a)B=[[0,127.5],[127.5,255]]. We combine corresponding entries, so the images must have matching shapes and intended alignment. Because 0<=a<=1, every result lies between the two contributing values. Floating-point values such as 127.5 are valid during computation.

This weighted-sum idea appears again in feature combination and neural-network layers. Those later layers can use many weights, negative weights and learned biases; they are not limited to blending two images.

## 6. Practice before looking at solutions

1. State the shape of I and the value at I[1,0].
2. Compute K=2I-20 entry by entry. Mark values outside [0,255].
3. Find the mean of K before clipping, and after clipping. Explain the difference.
4. Flatten I in row order. Describe what additional information is needed to reconstruct the matrix.
5. Compute 0.25A+0.75B for the A and B above.
6. Give two different 2x2 images with the same mean.
7. Explain why a batch of 32 RGB images, each 64x64, needs four axes in the common (batch,height,width,channels) convention. Name the shape.

**Exit explanation:** In your own words, explain why a matrix is a useful image representation and why image recognition cannot rely on the mean alone.

**Reading after practice:** CS205A 0.3.2, then MML Chapter 1 for motivation. Detailed matrix multiplication comes in Module 2.
'''

LESSON_02 = r'''# Lesson 02 - Functions, graphs and composition

**Time:** 60 minutes plus 30 minutes of practice.
**Goal:** read a function as a rule, understand slope, and distinguish the order of operations.

A function takes an allowed input and produces one output. For f(x)=2x+10, input 30 produces 70. The domain is the set of allowed inputs; the codomain specifies the kind of output. A toy stored-pixel input may range from 0 to 255, while an unclipped calculation may produce values beyond that range.

For y=ax+b, increasing x by 1 changes y by a. This is the slope. The offset b is the output at x=0. The graph of y=0.5x+10 is a line: use inputs 0, 100 and 200 to get outputs 10, 60 and 110.

Composition means applying one rule after another. Let f(x)=2x and g(x)=x+10. Then g(f(x))=2x+10, but f(g(x))=2x+20. At x=30 these are 70 and 80. Order matters. A neural network is also a composition, with trainable parameters in some of its rules.

The function h(x)=x^2 is nonlinear: its slope changes with x. The input change from 1 to 2 increases the output by 3; the same input change from 10 to 11 increases the output by 21. Derivatives will let us describe such sensitivity precisely.

**Practice:** (1) Evaluate f(0), f(20), f(100) for f(x)=0.5x+10. (2) Compose normalization n(x)=x/255 with an offset g(x)=x+10 in both orders. (3) Sketch y=x^2 at x=-2,-1,0,1,2. (4) Explain which operation, clipping or scaling, can map distinct inputs to the same output. (5) Explain why z=max(0,x), the ReLU activation, is not a single straight line over all real x.

**Exit explanation:** Describe a two-stage computation and show why reversing its stages changes the output.
'''

LESSON_03 = r'''# Lesson 03 - Sums, averages and error

**Time:** 60 minutes plus 30 minutes of practice.
**Goal:** read summation notation and turn prediction mistakes into a scalar objective.

For x=[20,60,100,140], the sum is 320 and the mean is 80. The notation sum from i=1 to n of x_i means add each entry once. The mean is that sum divided by n. Keep the indexing convention clear: a book may number x_1 through x_n while Python numbers entries 0 through n-1.

Suppose predictions are p=[2,4] and targets are y=[1,7]. Define residuals as p-y=[1,-3]. Their mean is -1, which hides part of the error because positive and negative residuals cancel. Squaring gives [1,9]. The mean squared error is MSE=(1+9)/2=5. The root mean squared error is sqrt(5), expressed in the same units as the original targets.

The **loss** is the number we try to reduce during fitting. Squared error penalizes a residual of magnitude 3 nine times as much as a residual of magnitude 1. It is sensitive to unusually large errors. It is one modeling choice; it is not the right loss for every task.

MSE is zero precisely when every prediction equals its target. A low training MSE does not prove that the model predicts new data well. We will learn to separate training, validation and test data.

**Practice:** (1) Find MSE for p=[0,2,4], y=[1,2,3]. (2) Give nonzero residuals whose mean is zero. (3) Explain how the sum of squared errors differs from its mean when the number of observations changes. (4) Compare MSE before and after multiplying both predictions and targets by 10. (5) Why might a single large residual dominate this loss?

**Exit explanation:** Explain why error cancellation motivates a loss such as squared error, and distinguish a loss from a final evaluation metric.
'''

LESSON_04 = r'''# Lesson 04 - Powers, logarithms and confidence

**Time:** 60 minutes plus 30 minutes of practice.
**Goal:** understand the operations used to turn scores into probabilities and probabilities into losses.

For a positive base a, a^m a^n=a^(m+n). The natural exponential exp(x)=e^x is always positive. The natural logarithm ln(x) is defined for x>0 and reverses exp: ln(exp(x))=x. For positive a and b, ln(ab)=ln(a)+ln(b). A product of many small probabilities can therefore be handled as a sum of logarithms.

The sigmoid s(z)=1/(1+exp(-z)) maps a real score z into (0,1). At z=0 it is 0.5; at ln(3) it is 0.75; at -ln(3) it is 0.25. A score is not itself a probability. Sigmoid produces a candidate probability in a binary model; its accuracy as a confidence estimate depends on the model and data.

For the true class, negative log likelihood is -ln(p). At p=1/2 the value is ln(2); at p=1/4 it is ln(4), twice as large. At p=1 it is zero. As p approaches zero it grows without bound. This discourages confident predictions that assign tiny probability to the correct class.

In real implementations, use stable log-probability calculations rather than computing extreme exponentials and then taking logarithms. We will derive these calculations in Module 7.

**Practice:** (1) Simplify ln(e^3). (2) Find ln(1). (3) Calculate sigmoid(0), sigmoid(ln(3)) and sigmoid(-ln(3)). (4) Compare losses for true-class probabilities 1/2 and 1/4. (5) Explain why a confident wrong prediction should receive a larger classification loss than an uncertain prediction.

**Exit explanation:** Distinguish score, probability and loss using one numerical example. These are concepts, not guarantees that a trained model is calibrated.
'''

ANSWER_KEY = '''# Solutions - open after attempting the work

These answers are for the original course exercises. They do not reproduce book exercise solutions.

## Starting assessment

1. 3x=15, so x=5.
2. f(3)=7; slope 2.
3. ln(e^2)=2; real ln(x) needs x>0.
4. Mean 80.
5. [[20,40],[60,80]].
6. Dot product 1*3+2*4=11.
7. Ax has shape 3x1. xA is invalid: the adjacent dimensions 1 and 3 do not match.
8. Add the equations: 2x=6, so x=3 and y=2.
9. 2x; then 4(2x+1), or 8x+4.
10. Partial derivative in x is 2x+3y; in y it is 3x.
11. P(B)=0.8*0.2+0.1*0.8=0.24. P(A given B)=0.16/0.24=2/3.
12. np.array([[20,60],[100,140]], dtype=float).mean() gives 80. * is elementwise multiplication; @ is matrix multiplication for these two-dimensional arrays.

Interpretation: do not add up a score across unfamiliar advanced questions. Trouble on 1-5 means spend the full first two weeks on foundations. Trouble on 6-8 is precisely what Modules 2-3 address. Trouble on 9-10 is handled in Module 5. Question 11 is a preview for Module 6. Question 12 identifies a Python support need.

## Lesson 01

1. Shape (2,2); I[1,0]=100.
2. K=[[20,100],[180,260]]; only 260 is above the chosen display range.
3. Before clipping: 560/4=140. After clipping: (20+100+180+255)/4=138.75. Clipping removes 5 from one entry, decreasing the mean by 5/4.
4. [20,60,100,140]. You need shape (2,2) and row-order convention.
5. [[0,63.75],[191.25,255]].
6. Example: [[0,100],[0,100]] and [[0,0],[100,100]] both have mean 50 but different arrangements.
7. Shape (32,64,64,3). Axes represent batch, height, width, channels; other frameworks may order these axes differently.

## Lesson 02

1. 10, 20, 60.
2. g(n(x))=x/255+10; n(g(x))=(x+10)/255. The offset has different units/scales in the two orders.
3. y values 4,1,0,1,4; a parabola symmetric around zero.
4. Clipping maps distinct values outside the bounds to the same boundary value. Nonzero scalar scaling is one-to-one before rounding/clipping.
5. ReLU has slope 0 for negative x and 1 for positive x; no one straight line represents both regions.

## Lesson 03

1. Residuals [-1,0,1]; MSE=2/3.
2. Example: [-2,2].
3. The sum grows with observation count for the same error pattern; the mean averages per observation.
4. MSE is multiplied by 100, because the residuals are multiplied by 10 and then squared.
5. Squaring magnifies large magnitudes.

## Lesson 04

1. 3. 2. 0. 3. 0.5, 0.75, 0.25. 4. ln(4)=2ln(2), so the second loss is twice as large. 5. When the model assigns a tiny probability to the correct class, -ln(p) becomes large; assigning confident probability to the wrong class has this effect.

## Selected module checks

- Module 2: w dot x=1; Ax=[2,2]. B maps [1,-1] to zero.
- Module 3: A=[[0,1],[1,1],[2,1]], b=[1,2,2]. Least-squares a=0.5, b=7/6.
- Module 4: eigenvalues 3,1; rank-one squared Frobenius error 2^2+1^2=5.
- Module 5: dL/dw=6(3w-2), giving 6 at w=1. Gradient f=[2x+3y,3x].
- Module 6: posterior 2/3; pixel mean 2, population variance 8/3; uniform probability 0.3.
- Module 7: -ln(0.8) approximately 0.2231. Adding c to every softmax score multiplies numerator and denominator by exp(c), which cancels.
- Module 8: gradient at w=0 is -6, so next w=0.6. Error recurrence is e_next=(1-2*learning_rate)e; it shrinks when 0<learning_rate<1.
- Module 9: output length floor((7+2-3)/2)+1=4. Full convolution [1,3,5,3].
- Module 10: hidden preactivation/activation (N,H), logits (N,C), dW1 (D,H), db1 (H,), dW2 (H,C), db2 (C,). dW=X.T@dZ and db=sum(dZ,axis=0); dZ already includes the chosen loss normalization.
- Module 11: box intersection 2, union 4+4-2=6, IoU=1/3. Precision=8/10=0.8; recall=8/12=2/3.
'''

WEEK_PLAN = '''# Your first two weeks

The core workload is 8 hours per week. Use up to 2 additional hours for review or questions. Days are flexible; these are study sessions, not calendar appointments.

## Week 1

| Session | Time | Work | Evidence |
|---|---:|---|---|
| 1 | 90 min | Starting assessment (25 min), review its foundation items (15 min), begin Lesson 01 (50 min) | Your reasoning for Questions 1-5 |
| 2 | 90 min | Complete Lesson 01 and begin Lesson 02 | Hand-computed arrays and two composed functions |
| 3 | 60 min | Attempt Lesson 01 exercises without solutions | Written answers with one uncertainty marked |
| 4 | 60 min | Attempt Lesson 02 exercises; review one missed foundation topic | A graph and explanation of operation order |
| 5 | 120 min | Starter notebook Parts A-C; learn array indexing and dtype if needed | Working numerical experiments |
| 6 | 60 min | Explain scalars/vectors/matrices, shapes, affine changes, mean and clipping aloud | A half-page explanation and an error-log entry |

## Week 2

| Session | Time | Work | Evidence |
|---|---:|---|---|
| 1 | 90 min | Lesson 03; work through sums and squared error | One hand-derived loss |
| 2 | 90 min | Lesson 04; explore logarithms and sigmoid | Score/probability/loss explanation |
| 3 | 60 min | Lesson 03 exercises and recall of Lesson 01 | Corrections and one new example |
| 4 | 60 min | Lesson 04 exercises and function-composition recall | Correct reasoning about log loss |
| 5 | 120 min | Notebook Part D and independent practice | Notebook plus three observations |
| 6 | 60 min | Module 1 mastery gate, then plan Module 2 | Explain the concepts without copying definitions |

Do not compensate for a weak foundation by reading more chapters. Identify one missed idea, do a simpler example, then try the original task again.

## How to work with your teacher

Send your attempted answer, your reasoning, and the exact line where you become uncertain. For example: "Lesson 01, Question 3: I got 140 before clipping and 140 after clipping. I think the mean should stay affine. Where did I go wrong?"

I will check reasoning, explain the gap, and set a short follow-up exercise. Continue to the next module when you can explain the ideas and solve new examples. Completing a calendar week alone is not evidence of mastery.
'''

def md_link(label, path):
    return f'[{label}](<{Path(path).as_posix()}>)'

def build_markdown():
    (BASE / 'lessons').mkdir(parents=True, exist_ok=True)
    for name, text in [('01-images-as-numbers.md', LESSON_01), ('02-functions-and-composition.md', LESSON_02),
                       ('03-sums-and-loss.md', LESSON_03), ('04-logarithms-and-confidence.md', LESSON_04)]:
        (BASE / 'lessons' / name).write_text(text, encoding='utf-8')
    (BASE / 'solutions.md').write_text(ANSWER_KEY, encoding='utf-8')
    (BASE / 'first-two-weeks.md').write_text(WEEK_PLAN, encoding='utf-8')
    diag = '# Starting assessment\n\nSpend about 25 minutes. No searching; "not sure" is useful. Show reasoning. Questions 9-11 preview later modules, so unfamiliarity is expected.\n\n'
    diag += '\n\n'.join(f'{i}. {q}' for i,q in enumerate(DIAGNOSTIC, 1))
    (BASE / 'starting-assessment.md').write_text(diag+'\n', encoding='utf-8')
    syllabus = '# Maths for Computer Vision - 24-week course\n\n'
    syllabus += 'Designed for a learner who needs a refresher, can study 8-10 hours weekly, and wants recognition, detection and segmentation. The core plan is 192 hours plus up to 48 hours of review. Timing is adjustable; advance by understanding, not by date.\n\n'
    syllabus += '## Course outcomes\n\nRead CV mathematics, derive small models and their gradients, implement numerical ideas, justify losses and metrics, and evaluate experiments. This is a strong foundation with an entry into advanced study; expertise and research depth require further practice.\n\n'
    syllabus += '## Weekly rhythm\n\nTwo 90-minute concept sessions, two 60-minute practice sessions, a 120-minute lab, and a 60-minute checkpoint: 8 hours. Optional extra time is for consolidation. Each module spans two weeks and four concept lessons.\n\n'
    syllabus += '## Reading strategy\n\nLessons first, selected sections second, exercises third. Use MML as the mathematical bridge; CS205A for numerical depth; Szeliski for CV; Guo selectively for later geometry. Section numbers refer to verified contents, not PDF viewer page numbers. Stretch topics are optional.\n\n'
    syllabus += '| Weeks | Module | Main result |\n|---|---|---|\n'
    for m in MODULES: syllabus += f"| {m['weeks']} | {m['n']:02d}. {m['title']} | {m['artifact']} |\n"
    for m in MODULES:
        syllabus += f"\n## Module {m['n']:02d} - {m['title']} (Weeks {m['weeks']})\n\n{m['purpose']}\n\n"
        for heading, content in [('Lessons',m['lessons']),('By the end',m['outcomes'])]:
            syllabus += f'### {heading}\n\n'+'\n'.join('- '+x for x in content)+'\n\n'
        for heading,key in [('Targeted reading','reading'),('Practice','practice'),('Lab','lab'),('Mastery gate','gate'),('Submit','artifact')]:
            syllabus += f'### {heading}\n\n{m[key]}\n\n'
    syllabus += '## Capstone rubric\n\n- Mathematical explanation: 30%. Define shapes, assumptions, objective and relevant derivatives.\n- Experiment design: 25%. Fixed split, seed, baseline and one controlled comparison.\n- Evaluation and errors: 25%. Appropriate metrics, failure cases, uncertainty and limitations.\n- Reproducibility and communication: 20%. Runnable code and a clear report.\n\n'
    syllabus += '## Advanced continuation after the core\n\nChoose one path: (1) attention and vision transformers, beginning with dot products, softmax and matrix gradients; (2) segmentation and detection objectives, imbalance and evaluation; (3) statistical learning, generalization and uncertainty; (4) geometric CV, adding projective geometry, camera models, rotations and manifold optimization. Guo becomes more central on path 4. Choose primary papers and current implementations when that stage arrives.\n'
    (BASE / 'syllabus.md').write_text(syllabus, encoding='utf-8')
    resource = '# Resource guide\n\nAll four books are together in this resources folder for your personal study. Your original files remain in their existing locations. The course contains original explanations and exercise prompts; it does not reproduce book chapters.\n\n'
    for code,s in SOURCES.items():
        resource += f"## {code} - {s['title']}\n\n{s['authors']}. {s['edition']}.\n\n{s['role']}\n\n{md_link('Open local PDF',s['path'])}\n\n"
        if s.get('url'): resource += f"[Authors' site]({s['url']})\n\n"
    resource += '## Optional public support\n\n- [Stanford CS231n](https://cs231n.stanford.edu/): applied deep-learning course for later modules; calculus, linear algebra and probability are prerequisites.\n- [CS231n Python/NumPy tutorial](https://cs231n.github.io/python-numpy-tutorial/): use the Python and NumPy sections for the starter notebook.\n- [CS231n neural-network case study](https://cs231n.github.io/neural-networks-case-study/): optional companion to Module 10.\n\nDownload source for MML: https://mml-book.github.io/book/mml-book.pdf\nRetrieved for this course on October 11, 2026; draft date inside PDF: January 15, 2024.\n'
    (BASE / 'resources' / 'README.md').write_text(resource, encoding='utf-8')
    progress = '# Progress and error log\n\nUse Not started / Learning / Revisiting / Ready. Record evidence, not just reading time.\n\n| Module | Weeks | Status | Evidence / next question |\n|---|---|---|---|\n'
    for m in MODULES: progress += f"| {m['n']:02d}. {m['title']} | {m['weeks']} | Not started | |\n"
    progress += '\n## Error log\n\nFor each entry: topic; my original reasoning; correction; one new example; date to revisit.\n\n## Session log\n\nFor each session: what I practiced; one idea I can explain; one uncertainty; next step.\n'
    (BASE / 'progress.md').write_text(progress, encoding='utf-8')
    readme = '# Start your maths course here\n\n**Your plan:** 24 weeks, 8-10 hours per week, with a refresher and a focus on deep-learning computer vision.\n\nOpen `index.html` in your browser for the interactive course, lessons, experiments and resource library. It works directly from disk.\n\n'
    readme += '## Today\n\n1. '+md_link('Attempt the starting assessment',BASE/'starting-assessment.md')+' (about 25 minutes).\n'
    readme += '2. '+md_link('Read Lesson 01: Images as numbers',BASE/'lessons'/'01-images-as-numbers.md')+' and attempt its exercises.\n'
    readme += '3. Send your reasoning for Lesson 01 Questions 1-3 in this chat. Mark anything uncertain.\n'
    readme += '4. '+md_link('Follow your first two weeks',BASE/'first-two-weeks.md')+'.\n\n'
    readme += '## Materials\n\n- '+md_link('Printable course guide',PDF_PATH)+'\n- '+md_link('Full editable syllabus',BASE/'syllabus.md')+'\n- '+md_link('Starter notebook',BASE/'notebooks'/'week01-02-foundations.ipynb')+'\n- '+md_link('Book and section guide',BASE/'resources'/'README.md')+'\n- '+md_link('Personal progress and error log',BASE/'progress.md')+'\n- '+md_link('Solutions: use after an attempt',BASE/'solutions.md')+'\n\n'
    readme += '## Notebook setup\n\nThe starter notebook uses Python 3 and NumPy only. You can open it in an existing Jupyter environment, or use a notebook service of your choice. No GPU, external image download or paid service is needed for this lab. If Python itself is new, use the linked CS231n tutorial and begin with the paper exercises.\n\n'
    readme += '## How I will teach you\n\nBring an attempted calculation or explanation. I will check it, give a worked explanation of the specific gap, and follow with a similar problem. We will revisit errors and use the mastery gates to adjust pace. The full curriculum is planned; the first four lessons are authored now, and later teaching can adapt to your answers.\n'
    (BASE / 'README.md').write_text(readme, encoding='utf-8')
    (BASE / 'course-map.json').write_text(json.dumps({'profile':{'hours_per_week':[8,10],'foundation':'refresher','focus':['recognition','detection','segmentation']}, 'modules':MODULES,'sources':SOURCES},indent=2),encoding='utf-8')

def build_notebook():
    cells=[]
    def md(text): cells.append({'cell_type':'markdown','metadata':{},'source':text.splitlines(True)})
    def code(text): cells.append({'cell_type':'code','metadata':{},'source':text.splitlines(True),'execution_count':None,'outputs':[]})
    md('# Weeks 1-2: Images, functions and loss\n\nWork through Lessons 01-04 first. Predict each output before running it. This lab uses NumPy only. Independent exercises are left for you; running all demonstration cells does not complete the lab.')
    code('import numpy as np\nI = np.array([[20, 60], [100, 140]], dtype=float)\nprint("Image:\\n", I)\nprint("Shape:", I.shape, "dtype:", I.dtype)\nprint("Top-right pixel:", I[0, 1])')
    md('## Part A: Representation\n\nA scalar is one value; a vector is an ordered list; a matrix has rows and columns. A channel axis extends this representation for color. Flattening requires an ordering convention.')
    code('v = I.reshape(-1)\nreconstructed = v.reshape(I.shape)\nprint("Row-order vector:", v)\nprint("Restored image:\\n", reconstructed)\nassert np.array_equal(I, reconstructed)')
    md('**Try independently:** Create a 3x2 image. Select its last row and first column. Flatten it, restore it, and describe the ordering. Write code in the next cell.')
    code('# Your own representation experiment goes here.\n')
    md('## Part B: Transformations and clipping\n\nCalculate J by hand before running this cell. Floating-point arithmetic preserves the intended intermediate values.')
    code('J = 0.5 * I + 10\nprint("Transformed image:\\n", J)\nprint("Original mean:", I.mean(), "transformed mean:", J.mean())\nassert np.isclose(J.mean(), 0.5 * I.mean() + 10)\nprint("Normalized stored values:\\n", I / 255.0)')
    md('**Try independently:** Compute 2I-20, then clip it to [0,255]. Compare the two means. Explain why the mean identity no longer gives the displayed mean after clipping.')
    code('# Your scaling and clipping experiment goes here.\n')
    md('## Part C: Weighted combinations and composition\n\nTwo images need matching shapes and meaningful alignment. The coefficient below changes their contribution; the blending is performed on toy stored values.')
    code('A = np.array([[0, 255], [0, 255]], dtype=float)\nB = np.array([[0, 0], [255, 255]], dtype=float)\na = 0.5\nC = a * A + (1 - a) * B\nprint("A:\\n", A, "\\nB:\\n", B, "\\nBlend:\\n", C)\nassert C.shape == A.shape == B.shape\nassert np.all((C >= 0) & (C <= 255))\nf = lambda x: 2 * x\ng = lambda x: x + 10\nprint("g(f(30)):", g(f(30)), "f(g(30)):", f(g(30)))')
    md('**Try independently:** Set a=0.25, predict C, and verify. Create two different 2x2 images with equal means. Explain what averaging fails to preserve.')
    code('# Your blending and equal-mean experiment goes here.\n')
    md('## Part D: Loss, sigmoid and logarithms\n\nA score, probability and loss are three different objects. Mean squared error is one possible regression objective. For classification, negative log likelihood relates the correct-class probability to a penalty.')
    code('predictions = np.array([2.0, 4.0])\ntargets = np.array([1.0, 7.0])\nresiduals = predictions - targets\nmse = np.mean(residuals ** 2)\nprint("Residuals:", residuals, "MSE:", mse)\nassert np.isclose(mse, 5.0)\nz = np.array([-np.log(3.0), 0.0, np.log(3.0)])\nprobabilities = 1 / (1 + np.exp(-z))  # Safe for these modest demonstration scores.\nprint("Scores:", z)\nprint("Sigmoid probabilities:", probabilities)\nprint("Correct-class losses:", -np.log(np.array([0.5, 0.25])))\nassert np.allclose(probabilities, [0.25, 0.5, 0.75])')
    md('**Try independently:** Implement a function for MSE and check an exact prediction gives zero. Multiply predictions and targets by 10; explain the change in MSE. Give one example of a confident wrong prediction and explain its loss.')
    code('# Your loss and confidence experiment goes here.\n')
    md('## Submit\n\nInclude your independent code, three numerical observations, one mistake you corrected, and a short explanation of why equal image means do not imply equal images. No charting package is required; start by inspecting the arrays.')
    namespace={}
    execution=0
    for cell in cells:
        if cell['cell_type']=='code':
            execution+=1
            buf=io.StringIO()
            with contextlib.redirect_stdout(buf): exec(''.join(cell['source']),namespace)
            cell['execution_count']=execution
            if buf.getvalue(): cell['outputs']=[{'output_type':'stream','name':'stdout','text':buf.getvalue().splitlines(True)}]
    nb={'cells':cells,'metadata':{'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python','version':'3.12'}},'nbformat':4,'nbformat_minor':4}
    (BASE/'notebooks').mkdir(exist_ok=True)
    (BASE/'notebooks'/'week01-02-foundations.ipynb').write_text(json.dumps(nb,indent=2),encoding='utf-8')
    print(f'Notebook: {execution} code cells executed; demonstration assertions passed.')

NAVY=colors.HexColor('#142A43')
TEAL=colors.HexColor('#087F8C')
INK=colors.HexColor('#263746')
MUTED=colors.HexColor('#526575')
PALE=colors.HexColor('#F0F5F8')
GOLD=colors.HexColor('#B98630')
STYLES={
    'eyebrow':ParagraphStyle('eyebrow',fontName='Helvetica-Bold',fontSize=9,leading=13,textColor=TEAL,spaceAfter=12),
    'title':ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=32,leading=37,textColor=NAVY,spaceAfter=18),
    'h1':ParagraphStyle('h1',fontName='Helvetica-Bold',fontSize=23,leading=28,textColor=NAVY,spaceAfter=16),
    'h2':ParagraphStyle('h2',fontName='Helvetica-Bold',fontSize=11,leading=15,textColor=TEAL,spaceBefore=12,spaceAfter=5),
    'body':ParagraphStyle('body',fontName='Helvetica',fontSize=10,leading=15,textColor=INK,spaceAfter=7),
    'small':ParagraphStyle('small',fontName='Helvetica',fontSize=8.5,leading=12,textColor=MUTED,spaceAfter=5),
    'bullet':ParagraphStyle('bullet',fontName='Helvetica',fontSize=10,leading=15,textColor=INK,leftIndent=12,firstLineIndent=-10,spaceAfter=5),
    'code':ParagraphStyle('code',fontName='Courier',fontSize=9,leading=13,textColor=INK,spaceAfter=12),
}

def P(text,style='body'): return Paragraph(escape(text),STYLES[style])
def bullet(text): return P('- '+text,'bullet')
def section(title,text): return [P(title,'h2'),P(text)]
def footer(canvas,doc):
    w,h=A4
    canvas.setStrokeColor(colors.HexColor('#DCE5EB'))
    canvas.line(22*mm,18*mm,w-22*mm,18*mm)
    canvas.setFont('Helvetica',8)
    canvas.setFillColor(MUTED)
    canvas.drawString(22*mm,12*mm,'MATHS FOR COMPUTER VISION | Personal learning course')
    canvas.drawRightString(w-22*mm,12*mm,str(doc.page))
    if doc.page>1:
        canvas.setFont('Helvetica',8)
        canvas.drawString(22*mm,h-14*mm,'FOUNDATIONS TO DEEP-LEARNING VISION')

def newpage(story, eyebrow, title):
    if story: story.append(PageBreak())
    story.extend([P(eyebrow,'eyebrow'),P(title,'h1')])

def build_pdf():
    PDF_PATH.parent.mkdir(parents=True,exist_ok=True)
    story=[]
    story += [Spacer(1,24*mm),P('YOUR PERSONAL COURSE | 24 WEEKS','eyebrow'),P('Maths for<br/>Computer Vision'.replace('<br/>','\n'),'title')]
    story += [P('From refreshed foundations to neural networks, recognition, detection and segmentation.'),Spacer(1,10*mm)]
    summary=Table([[P('8-10 hours / week','h2'),P('Learn, derive, build','h2')],[P('192 core hours plus up to 48 hours of consolidation.'),P('Every module ends with a small experiment and a mastery check.')]],colWidths=[81*mm,81*mm])
    summary.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]))
    story += [summary,Spacer(1,12*mm),P('Designed around your starting point','h2'),P('You know some algebra, matrices and derivatives, and want a refresher. Your target is deep-learning computer vision. The course keeps geometry in context and prioritizes the maths behind learning.'),P('What you should be able to do','h2')]
    for t in ['Read equations in a CV method and explain the symbols and assumptions.', 'Derive small models, losses and gradients; check them with numerical experiments.', 'Understand convolution, neural-network training and task-specific outputs.', 'Evaluate models with appropriate metrics and recognize misleading evidence.']: story.append(bullet(t))
    story += [Spacer(1,8*mm),P('This is a planned path into advanced study, not a promise of exhaustive mastery. The first four lessons are ready now; later teaching can adapt to your answers.','small'),P('Prepared October 11, 2026','small')]
    newpage(story,'HOW TO LEARN','Your weekly rhythm')
    for t in ['Two 90-minute concept sessions: intuition, symbols and a worked example.', 'Two 60-minute practice sessions: hand calculations and recall without notes.', 'One 120-minute lab: implement the idea and vary one condition.', 'One 60-minute checkpoint: explain, correct mistakes and plan the next step.']: story.append(bullet(t))
    story += section('The teaching cycle','Intuition -> precise statement -> worked calculation -> your attempt -> numerical experiment -> explanation in your own words. Use up to two extra hours for review rather than adding more new material.')
    story += section('Use four books with different jobs','MML is the main mathematical bridge. CS205A supplies selected numerical depth. Szeliski connects ideas to CV. Guo is optional enrichment, especially for geometry. Read the selected sections after the lesson; do not try to finish all four books in parallel.')
    story += section('Read an equation actively','Name every quantity and its shape. State the assumption. Work a tiny example. Change one input and predict the effect. Then ask where the formula might fail.')
    story += section('Advance by evidence','A module is ready when you can explain its ideas and solve a new example without copying a solution. If a checkpoint exposes a gap, revisit that idea and shift the schedule. Weeks are estimates, not deadlines.')
    story += section('Build an error log','For each mistake, record the original reasoning, the correction, and a new example. Revisit the idea in the next session and again the following week.')
    story += section('Work with your teacher','Send your attempted answer and the exact point where you are uncertain. I will check reasoning, explain the gap and give a follow-up problem. No assessment is treated as a grade or a judgment of ability.')
    story += section('Tools','The starter notebook uses Python 3 and NumPy only. No GPU or external dataset is needed for the first lab. Later framework setup is chosen when needed, using its current official documentation.')
    newpage(story,'STARTING ASSESSMENT','Find your starting point')
    story += [P('Allow about 25 minutes. Work without searching. Write "not sure" where appropriate. Questions 9-11 preview later modules, so unfamiliarity is expected.','small')]
    for i,q in enumerate(DIAGNOSTIC,1): story.extend([P(f'{i:02d}. {q}'),Spacer(1,4*mm)])
    story += [P('Use the separate solutions file only after your attempt. If Questions 1-5 are difficult, spend the full first two weeks on the refresher. Other questions identify where later modules should slow down.','small')]
    newpage(story,'THE ROADMAP','Twelve modules, one connected path')
    rows=[[P('Weeks','small'),P('Module','small'),P('Main application','small')]]
    for m in MODULES: rows.append([P(m['weeks'],'small'),P(f"{m['n']:02d}. {m['title']}",'small'),P(m['artifact'],'small')])
    table=Table(rows,colWidths=[18*mm,69*mm,75*mm],repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),0.3,colors.HexColor('#DEE7ED'))]))
    story += [table,Spacer(1,8*mm),P('The sequence is deliberate: representation -> linear algebra -> calculus and probability -> loss and optimization -> convolution -> neural networks -> evaluation. Geometry and topology become deeper electives later.','small')]
    for m in MODULES:
        newpage(story,f"MODULE {m['n']:02d} | WEEKS {m['weeks']}",m['title'])
        story.append(P(m['purpose']))
        story.append(P('Four concept lessons','h2'))
        for t in m['lessons']: story.append(bullet(t))
        story.append(P('By the end','h2'))
        for t in m['outcomes']: story.append(bullet(t))
        for title,key in [('Targeted reading','reading'),('Practice before the lab','practice'),('Lab','lab'),('Mastery gate','gate'),('Submit','artifact')]: story += section(title,m[key])
    newpage(story,'WEEKS 1-2','Your first study sessions')
    for title,items in [
        ('Week 1',['90 min: assessment, foundation review and beginning Lesson 01.', '90 min: finish Lesson 01 and work through Lesson 02.', '60 min: Lesson 01 exercises, without the answer key.', '60 min: Lesson 02 exercises and one targeted refresher.', '120 min: notebook Parts A-C; inspect arrays and shapes.', '60 min: explain representation, affine changes, means and clipping.']),
        ('Week 2',['90 min: Lesson 03, sums and squared error.', '90 min: Lesson 04, logarithms and sigmoid.', '60 min: Lesson 03 exercises and recall of Lesson 01.', '60 min: Lesson 04 exercises and function-composition recall.', '120 min: notebook Part D and independent experiments.', '60 min: Module 1 mastery check and the next-step discussion.'])]:
        story.append(P(title,'h2'))
        for t in items: story.append(bullet(t))
    story += section('Start today','Attempt the assessment, read the next three pages, then send your reasoning for Lesson 01 Questions 1-3 in this chat. Start with numbers on paper; the notebook makes the same operations concrete.')
    story += section('Optional review time','Use the extra one or two hours to revisit algebra or Python. Do not rush the next module if the current ideas still need practice.')
    newpage(story,'LESSON 01 | 45-60 MINUTES','An image is a collection of numbers')
    story += [P('Goal: explain scalars, vectors and matrices using an image, and calculate a simple image transformation.'),P('Start with a tiny grayscale image','h2'),Preformatted('I = [[ 20,  60],\n     [100, 140]]',STYLES['code'])]
    story += [P('In this toy 8-bit representation, 0 means black and 255 means white. Larger stored values appear lighter. This is a model of stored values, not a statement that every image stores physically linear light intensity.'),P('A scalar, a vector, a matrix','h2')]
    for t in ['A scalar is one value, such as the top-right pixel 60.', 'A vector is an ordered list, such as [20,60,100,140].', 'A matrix arranges values in rows and columns. I has shape 2 by 2.']: story.append(bullet(t))
    story += [P('Flattening changes the arrangement of the representation, not the four values. To restore the image, retain its shape and the ordering convention. Neighbor relationships are meaningful for vision.'),P('Indexing','h2'),P('We use zero-based indexing: I[0,1]=60 and I[1,0]=100. Many maths books start at one; check the convention rather than assuming it.'),P('Scaling and shifting','h2'),P('Halve each value and then add 10 to every entry:'),Preformatted('J = 0.5 * I + 10\n  = [[20, 40],\n     [60, 80]]',STYLES['code']),P('The top-right entry is 0.5(60)+10=40. Scaling changes differences between pixel values. Adding an offset changes all values equally, leaving those differences unchanged. Scale plus offset is an affine operation; with zero offset it is linear.')]
    newpage(story,'LESSON 01 | WORKED CONNECTIONS','Means, range limits and blends')
    story += section('A mean summarizes and discards','The original mean is (20+60+100+140)/4=80. The transformed mean is 50. Predict it as 0.5(80)+10. This identity holds for ordinary affine arithmetic before clipping or rounding.')
    story += [Preformatted('A = [[0, 255],       B = [[  0,   0],\n     [0, 255]]            [255, 255]]',STYLES['code']),P('A and B both have mean 127.5. One has a vertical edge; the other has a horizontal edge. A mean cannot recover spatial arrangement, so it is insufficient for recognition.')]
    story += section('Clipping destroys information','Clipping to [0,255] replaces -5 by 0 and 270 by 255. It maps distinct values such as 260 and 300 to the same display value. Work in floating-point arrays, then clip deliberately if producing an image for display. Unsigned 8-bit array arithmetic can wrap around instead of matching your intended mathematics.')
    story += section('Normalization','I/255 rescales stored values into [0,1]. It does not automatically undo a camera response or gamma encoding.')
    story += section('Blending is a weighted sum','For 0<=a<=1, combine matching entries: C=aA+(1-a)B. At a=0.5 the result is:')
    story += [Preformatted('C = [[  0, 127.5],\n     [127.5, 255]]',STYLES['code']),P('Each output lies between its contributing values. Matching shape and intended alignment are required. Floating-point results are valid during computation.'),P('Connection to learning','h2'),P('Weighted sums recur in neural-network layers, where weights can be learned, negative and numerous. The later model also applies activations and a loss; the blend is a first example of combining numerical features.')]
    newpage(story,'LESSON 01 | YOUR TURN','Practice and explain')
    for i,t in enumerate(['State the shape of I and the entry I[1,0].', 'Compute K=2I-20 entry by entry. Mark values outside [0,255].', 'Find the mean of K before clipping, and after clipping. Explain the difference.', 'Flatten I in row order. What information is needed to reconstruct it?', 'Compute 0.25A+0.75B for the A and B on the previous page.', 'Give two different 2x2 images with the same mean.', 'Give the shape of 32 RGB images of size 64x64 in (batch,height,width,channels) order.'],1):
        story += [P(f'{i}. {t}'),Spacer(1,8*mm)]
    story += section('Exit explanation','Explain why a matrix is a useful image representation and why recognition cannot rely on the mean alone.')
    story += section('Reading and next step','After your attempt, read CS205A 0.3.2 and MML Chapter 1. Continue with the supplied Lesson 02 on functions and composition. Send Questions 1-3 here for feedback before using the solutions.')
    newpage(story,'CAPSTONE AND REFERENCES','Continue with evidence')
    story += section('Capstone rubric','Mathematical explanation 30%; experiment design 25%; evaluation and error analysis 25%; reproducibility and communication 20%. Submit a 3-5 page report, runnable code and a short explanation. One justified improvement is enough; a large model is not the goal.')
    story += section('Advanced continuation','After the core, choose attention/vision transformers, detection/segmentation objectives, statistical learning/uncertainty, or geometric CV. Choose a small number of primary papers after identifying their prerequisites. Research depth takes further practice.')
    story += [P('Books and their roles','h2')]
    for code,s in SOURCES.items():
        story += [P(f"{code}: {s['title']}",'small'),P(f"{s['authors']}. {s['edition']}. {s['role']}",'small')]
    story += [P('Official public companions','h2')]
    for label,url in [('MML authors: free personal-study PDF','https://mml-book.github.io/'),('Stanford CS231n course','https://cs231n.stanford.edu/'),('CS231n Python/NumPy tutorial','https://cs231n.github.io/python-numpy-tutorial/'),('CS231n neural-network case study','https://cs231n.github.io/neural-networks-case-study/')]:
        story += [Paragraph(f'<link href="{url}" color="#087F8C">{escape(label)}</link>',STYLES['small'])]
    story += [Spacer(1,5*mm),P('Course explanations, exercises and scheduling are original. Source books are assigned by chapter/section; their text is not reproduced. The resource guide contains local paths. Source pages were checked on October 11, 2026.','small')]
    doc=SimpleDocTemplate(str(PDF_PATH),pagesize=A4,rightMargin=22*mm,leftMargin=22*mm,topMargin=25*mm,bottomMargin=25*mm,title='Maths for Computer Vision - Personal Course',author='Codex',pageCompression=1)
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    print('PDF:',PDF_PATH)

if __name__=='__main__':
    for s in SOURCES.values():
        if not Path(s['path']).exists(): raise FileNotFoundError(s['path'])
    build_markdown()
    build_notebook()
    build_pdf()
    mml=Path(SOURCES['MML']['path'])
    manifest={'mml_download':{'source_url':'https://mml-book.github.io/book/mml-book.pdf','sha256':hashlib.sha256(mml.read_bytes()).hexdigest(),'bytes':mml.stat().st_size},'pdf':str(PDF_PATH),'module_count':len(MODULES),'lesson_count':sum(len(m['lessons']) for m in MODULES),'authored_foundation_lessons':4,'notebook_demonstrations_executed':True}
    (BASE/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
