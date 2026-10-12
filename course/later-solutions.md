# Lessons 05-68: worked answers

Attempt each exercise before opening its answer. These solutions also appear in each lesson’s Practice tab, below the auto-checked questions with fresh numbers.

## Lesson 05 - Vectors as positions, displacements and features

**1. Find the displacement from (1,4) to (4,2).**

Subtract start from end: (4-1,2-4)=(3,-2).

**2. For u=(2,-1), v=(1,3), calculate 3u-2v.**

3u=(6,-3), 2v=(2,6), so the result is (4,-9).

**3. Flatten [[1,2],[3,4]] in row order and state its vector dimension.**

The vector is [1,2,3,4], with four coordinates. A column representation has shape (4,1).

**4. Why might raw distance between [brightness, width] be misleading?**

Different units and numerical scales can make one coordinate dominate. Fit scaling using training data, or choose a justified metric.

## Lesson 06 - Norms, dot products, angles and projections

**1. Find the L1 and L2 norms of (-3,4).**

L1=3+4=7; L2=sqrt(9+16)=5.

**2. Compute the cosine similarity of (1,0) and (1,1).**

The dot product is 1 and the norm product is sqrt(2), so cosine=1/sqrt(2).

**3. Project (2,3) onto u=(1,0), and give the residual.**

c=2, projection=(2,0), residual=(0,3). Its dot product with u is zero.

**4. Can the zero vector be normalized to a unit vector? Explain.**

No. Dividing by its norm divides by zero; it has no defined direction.

## Lesson 07 - Matrices as maps and composition

**1. Apply [[2,0],[0,3]] to the column vector (1,-2).**

The result is (2,-6).

**2. If X=(16,64) and W=(64,10), give the output and bias shapes.**

XW has shape (16,10); a bias of shape (10,) broadcasts across samples.

**3. For A=(3,2) and B=(4,3), which product is defined and what is its shape?**

BA is defined, with shape (4,2). AB is undefined because 2 and 4 do not match.

**4. Is f(x)=2x+1 a linear map? Justify with f(0).**

It is affine. f(0)=1, whereas a linear map must send zero to zero.

## Lesson 08 - Independence, bases, rank and null spaces

**1. Are (1,2) and (3,6) independent? Give a relation.**

They are dependent: 3*(1,2)-(3,6)=0.

**2. Find the rank and a null vector of [[1,1],[2,2]].**

Rank=1; (1,-1) is a nonzero null vector.

**3. A linear map has 5 inputs and rank 3. What is its null-space dimension?**

Rank-nullity gives 5-3=2.

**4. Why can a 2x4 map never have an inverse recovering every four-coordinate input?**

Its rank is at most 2, so its null-space dimension is at least 2. Different inputs share outputs.

## Lesson 09 - Exact, inconsistent and underdetermined systems

**1. Solve x+y=5 and x-y=1.**

Adding gives x=3; substituting gives y=2.

**2. Are x+2y=3 and 2x+4y=8 consistent?**

No. Doubling the first equation requires right-hand side 6, but the second requires 8.

**3. Describe all solutions of x-y=2.**

Let y=t freely; then x=t+2, so (x,y)=(t+2,t).

**4. Write the design matrix for fitting y=a*t+c at t=0,1,2.**

A=[[0,1],[1,1],[2,1]] and the unknown column is (a,c). The observed y values form b.

## Lesson 10 - Least squares as projection

**1. Fit a constant c to observations [1,2,6] by least squares.**

The projection onto the constant column gives c=(1+2+6)/3=3.

**2. For the worked line fit, calculate the residual sum and sum of squared residuals.**

Sum=0; squared sum=1/36+1/9+1/36=1/6.

**3. Why is b-A*theta orthogonal to the column space at an optimum?**

Otherwise a move within that space could remove a component of the error and reduce its squared length.

**4. Does a residual sum of zero imply every observation is fit exactly?**

No. Residuals [-1,1] sum to zero while squared error is 2.

## Lesson 11 - QR, pseudoinverses and numerical conditioning

**1. Solve R*theta=(5,3) for R=[[2,1],[0,3]].**

Back substitute: theta₂=1; 2theta₁+1=5 gives theta₁=2.

**2. Find the condition number of diag(4,0.5).**

The singular values are 4 and 0.5, so the condition number is 8.

**3. Find the minimum-norm solution of x₁+x₂=6.**

By symmetry or minimizing t²+(6-t)², the solution is (3,3).

**4. Why prefer lstsq over explicitly inverting AᵀA?**

A solver handles rank and stability using appropriate decompositions; normal equations can square conditioning, and explicit inversion is unnecessary.

## Lesson 12 - Regularization and the cost of overfitting

**1. For the scalar example, find theta when lambda=3.**

theta=2/(1+3)=0.5.

**2. At lambda=1, compute the residual loss and penalty separately.**

theta=1; residual loss=(1-2)²=1 and penalty=1²=1, totaling 2.

**3. Why can input rescaling change a ridge fit?**

Equivalent prediction coefficients have different magnitudes after rescaling, so the parameter penalty changes.

**4. Which split should choose lambda, and which split reports final performance?**

Use validation to choose lambda. Keep test data for final evaluation after model selection.

## Lesson 13 - Eigenvectors and repeated transformations

**1. Find eigenvalues and standard eigenvectors of diag(2,-1).**

Eigenvalue 2 with (1,0); eigenvalue -1 with (0,1).

**2. Apply diag(2,-1) three times to (1,2).**

The result is (2³*1,(-1)³*2)=(8,-2).

**3. Verify that (1,-1) is an eigenvector of [[2,1],[1,2]].**

The product is (1,-1), so its eigenvalue is 1.

**4. Why is the zero vector excluded from the eigenvector definition?**

It satisfies Av=lambda*v for every lambda and carries no invariant direction.

## Lesson 14 - SVD and low-rank structure

**1. For singular values [6,3,2], find squared rank-1 reconstruction error.**

Discard 3 and 2: 3²+2²=13.

**2. Give reduced-SVD shapes for a 5x3 matrix.**

q=3: U=(5,3), Sigma=(3,3), Vᵀ=(3,3).

**3. How many numbers store a rank-4 approximation of a 20x30 matrix?**

4*(20+30+1)=204 versus 600 original entries, ignoring metadata.

**4. Does smallest reconstruction error guarantee best recognition accuracy?**

No. Reconstruction error treats all entries geometrically; task-relevant details may lie in small singular directions.

## Lesson 15 - PCA, centering and covariance

**1. Center the samples (0,2) and (2,4).**

Mean=(1,3); centered samples are (-1,-1) and (1,1).

**2. Find the sample covariance of those two samples.**

N-1=1, so covariance is [[2,2],[2,2]].

**3. For covariance eigenvalues [4,1,0], what fraction of total variance does the first component retain?**

4/(4+1+0)=0.8, or 80%.

**4. Why is PCA not a supervised classifier?**

Its directions depend on input variation without using class labels; prediction requires an additional rule or model.

## Lesson 16 - Reconstruction error and data leakage

**1. If discarded singular values are [3,1], find squared Frobenius error.**

3²+1²=10.

**2. For N=5,D=2, turn that error into entrywise MSE.**

Divide by 5*2, giving MSE=1.

**3. Should validation samples get their own fitted PCA basis?**

No. Apply the training-fitted mean and basis; otherwise feature coordinates differ and validation informs preprocessing.

**4. Name a reason frame-level random splitting can overestimate future performance.**

Nearby frames can be almost duplicates. A model may recognize shared scenes rather than generalize to new sequences.

## Lesson 17 - Derivatives and local linearity

**1. Derive the difference quotient for f(x)=x² at a general x.**

[(x+h)²-x²]/h=2x+h, approaching 2x as h→0.

**2. Find the derivative of 3x²+2x-5 at x=2.**

The derivative is 6x+2, giving 14.

**3. Use a first-order approximation for (4.01)² around x=4.**

16+8*0.01=16.08; the exact answer is 16.0801.

**4. Differentiate (3x+1)² and evaluate at x=0.**

The chain rule gives 2(3x+1)*3=6(3x+1), which is 6 at zero.

## Lesson 18 - Gradients and directional derivatives

**1. Find ∇f for f=x²+xy+2y² at (1,2).**

Partial derivatives are 2x+y and x+4y; the gradient at (1,2) is (4,9).

**2. For gradient (3,4), find the derivative along unit direction (1,0).**

Dotting with (1,0) gives 3.

**3. Write the gradient of L=(1/N)||A*theta-b||².**

∇L=(2/N)Aᵀ(A*theta-b), with the same parameter dimension as theta.

**4. Does a negative directional derivative guarantee a decrease for every step length?**

No. It guarantees local decrease for sufficiently small positive steps under differentiability; a large step can overshoot.

## Lesson 19 - Jacobians and computational graphs

**1. Find the Jacobian of f(x,y)=(x+y,x*y).**

J=[[1,1],[y,x]], with rows indexing outputs.

**2. For z=(2x+1)², compute dz/dx at x=1.**

dz/dx=4(2x+1), giving 12.

**3. For L=u²+u³, calculate dL/du at u=2.**

dL/du=2u+3u²=4+12=16. Contributions from both branches add.

**4. If y=Ax and ∇_y L has shape (H,1), give ∇_x L and its shape.**

∇_x L=Aᵀ∇_y L, with shape (D,1) for A=(H,D).

## Lesson 20 - Hessians, Taylor approximations and gradient checks

**1. Find the Hessian of x²+xy+2y².**

H=[[2,1],[1,4]].

**2. Evaluate the central-difference derivative of w² at w=3 symbolically.**

[(3+h)²-(3-h)²]/(2h)=6 for nonzero h in exact arithmetic.

**3. At a stationary point with Hessian eigenvalues (2,-1), classify the curvature.**

The Hessian is indefinite, indicating a saddle for a smooth nondegenerate stationary point.

**4. Give two reasons a correct derivative implementation might fail a numerical check.**

A perturbation can cross a ReLU kink, or stochastic evaluations can use different randomness. Extreme h can also produce numerical error.

## Lesson 21 - Conditional probability and Bayes theorem

**1. With P(A)=0.3, P(B|A)=0.8 and P(B|not A)=0.2, compute P(B).**

P(B)=0.8*0.3+0.2*0.7=0.38.

**2. Using those values, compute P(A|B).**

P(A|B)=0.24/0.38=12/19≈0.6316.

**3. If A and B are independent with P(A)=0.4 and P(B)=0.5, find their intersection probability.**

P(A∩B)=0.4*0.5=0.2.

**4. Why is detector recall different from the probability an alerted image truly contains the object?**

Recall conditions on true objects; the alert probability conditions on predicted positives and also depends on prevalence and false positives.

## Lesson 22 - Random variables, densities and expectations

**1. Find E[X] for values 0,2,4 with probabilities 0.2,0.5,0.3.**

0*0.2+2*0.5+4*0.3=2.2.

**2. For uniform X on [0,4], find P(1≤X≤3).**

Density=1/4; interval width=2, so probability=0.5.

**3. What is P(X=2) for that continuous distribution?**

Zero; one exact value has zero interval width.

**4. If E[X]=2 and E[Y]=3, calculate E[2X-Y] without assuming independence.**

By linearity, 2E[X]-E[Y]=4-3=1.

## Lesson 23 - Variance, covariance and Gaussian noise

**1. Find mean and population variance of [1,3,5].**

Mean=3; variance=(4+0+4)/3=8/3.

**2. If Var(X)=4, find Var(3X+2).**

Var(aX+b)=a²Var(X), giving 9*4=36.

**3. For 16 independent samples each with variance 4, find variance of their mean.**

4/16=0.25, so standard deviation is 0.5.

**4. Does covariance zero guarantee independence? Give the lesson’s counterexample.**

No. For symmetric X over -1,0,1, Y=X² depends on X even though covariance is zero.

## Lesson 24 - Sampling and empirical uncertainty

**1. At p_hat=0.5 and N=100, find the plug-in standard error.**

sqrt(0.5*0.5/100)=0.05.

**2. How does standard error change if N is multiplied by four under the same independent model?**

It halves because standard error scales as 1/sqrt(N).

**3. Why is the plug-in normal interval unreliable after 3 successes out of 3?**

p_hat=1 gives plug-in standard error zero, hiding substantial uncertainty from a tiny sample.

**4. When evaluating many frames from each video, what could be a better bootstrap unit?**

Resample independent videos or groups when within-video frames are correlated and the deployment target is new videos.

## Lesson 25 - Likelihood and negative log likelihood

**1. For y=1,p=0.25, calculate binary NLL.**

-ln(0.25)=ln(4)≈1.3863.

**2. For labels [1,0] and predictions [0.8,0.3], write their summed NLL.**

The correct-label probabilities are 0.8 and 0.7, so NLL=-ln(0.8)-ln(0.7)≈0.5798.

**3. Under fixed Gaussian variance 2, what multiplies the squared residual sum in NLL?**

1/(2sigma²)=1/4.

**4. Why cannot the log-variance term be ignored when predicting variance?**

It depends on learned parameters. Dropping it would allow increasing variance to reduce the residual term without the proper likelihood cost.

## Lesson 26 - Priors, MAP and regularization

**1. With sigma²=2 and tau²=4, give lambda under the lesson’s summed-error convention.**

lambda=sigma²/tau²=2/4=0.5.

**2. For a single observation y=6 with both variances equal to 1, find the MAP.**

Minimize (theta-6)²+theta²; theta=3.

**3. Does MAP supply a full posterior uncertainty distribution?**

No. MAP supplies a mode; a full posterior or approximation is needed for distributional parameter uncertainty.

**4. If a summed data loss is divided by N, how should its penalty coefficient change to preserve the same optimum?**

Divide the penalty coefficient by N too, so the entire objective is scaled equally.

## Lesson 27 - Logistic regression, softmax and cross entropy

**1. Compute softmax([0,ln 2]).**

Exponentials are [1,2], so probabilities are [1/3,2/3].

**2. For those scores and true class 0, find cross entropy.**

-ln(1/3)=ln(3)≈1.0986.

**3. Write the score gradient for probabilities [0.2,0.7,0.1] with true class 1.**

Subtract one-hot [0,1,0], giving [0.2,-0.3,0.1]. Its entries sum to zero.

**4. For X=(8,4), W=(4,3), give dW and db shapes.**

dW=(4,3); db=(3,) when summed over the eight rows.

## Lesson 28 - Splits, bias, variance and calibration

**1. Which split selects learning rate?**

Validation selects it; training fits parameters and test evaluates the fixed choice.

**2. A model is 90% confident on 20 predictions and correct on 12. Give empirical accuracy and confidence gap.**

Accuracy=12/20=0.6; confidence exceeds it by 0.3. The sample is small, so interpret cautiously.

**3. Give an example of leakage before model training.**

Fitting normalization or PCA on all samples before splitting, or placing near-duplicates across train and test.

**4. Can perfect classification accuracy establish perfect probability calibration?**

No. A model can classify every case correctly while assigning systematically inaccurate probabilities.

## Lesson 29 - Gradient descent and optimality

**1. Take one step for (w-3)² from w=1 with alpha=0.2.**

Gradient=2*(1-3)=-4; next w=1.8.

**2. For that loss, give the error multiplier at alpha=0.75.**

1-2*0.75=-0.5: errors alternate sign and halve in magnitude.

**3. For H eigenvalues [2,10], give the convergence range for the half-scaled quadratic.**

0<alpha<2/10=0.2.

**4. Does ∇L=0 prove a global minimum for a nonconvex loss?**

No. It may be a local minimum, maximum, saddle or another stationary point.

## Lesson 30 - Mini-batch SGD, momentum and adaptive steps

**1. With N=100 and batch size 20 without dropping samples, how many updates form an epoch?**

100/20=5 updates.

**2. Under v_next=0.5v+g, start v=0 and apply gradients 4 then -2. Give both velocities.**

v₁=4; v₂=0.5*4-2=0.

**3. Why can oversampling a rare class change the optimized objective?**

Uniform averaging over the altered sampling distribution gives the rare class greater weight unless corrected.

**4. What is Adam’s bias-corrected second moment after its first nonzero scalar gradient g=3?**

v₁=(1-beta2)*9, and correction divides by 1-beta2, giving 9.

## Lesson 31 - Convexity, curvature and constraints

**1. Is f(x,y)=x²+2y² convex? Use its Hessian.**

H=diag(2,4) is positive definite everywhere, so the function is strictly convex.

**2. Minimize x²+y² subject to x+y=4.**

Symmetry or Lagrange conditions give x=y=2, with value 8.

**3. Minimize (w-3)² subject to 0≤w≤2.**

The nearest feasible point to 3 is w=2, with loss 1.

**4. Why need not a constrained minimum have an ordinary zero gradient?**

At a boundary, decreasing directions may be infeasible; constrained optimality only considers allowable movement.

## Lesson 32 - Initialization, scaling and training diagnostics

**1. What is cross entropy for equal logits over four classes?**

ln(4)≈1.3863 for a single correct class.

**2. Why can identical initialization keep two hidden units redundant?**

Their forward activations and backward gradients can be identical, so symmetry persists under updates.

**3. Under the stated variance approximation, what weight variance preserves linear variance for D=100?**

v²≈1/D=0.01 for the simple linear approximation; the ReLU heuristic would differ.

**4. Name two plausible causes of flat training loss.**

Parameters may not be updating, gradients may vanish, the learning rate may be tiny, or labels may be misaligned. Test rather than infer solely from the curve.

## Lesson 33 - Sampling, aliasing and image coordinates

**1. Downsample [0,1,0,1,0,1] by taking indices 0,2,4.**

The result is [0,0,0].

**2. Average adjacent pairs in that row before reducing.**

The result is [0.5,0.5,0.5].

**3. Why can cos(2*pi*n) be confused with a constant from integer samples?**

All integer samples equal 1, matching the constant signal exactly.

**4. Why is averaging class IDs during mask resizing usually wrong?**

Class IDs are categories, not quantities to blend; averaging IDs can invent unrelated classes.

## Lesson 34 - Convolution and cross-correlation

**1. Find valid cross-correlation of [1,3,2] with [1,-1].**

1-3=-2 and 3-2=1, so [-2,1].

**2. Find valid convolution of the same row and kernel.**

Use flipped [-1,1], giving [2,-1].

**3. Find full convolution of [1,2,3] with [1,1].**

The full output is [1,3,5,3].

**4. What is the response of a zero-sum kernel on a constant patch?**

It is the constant times the coefficient sum, so zero, before bias and boundary effects.

## Lesson 35 - Padding, stride, channels and receptive fields

**1. For L=10,K=3,P=0,S=2,d=1, find output length.**

floor((10-3)/2)+1=4.

**2. Count parameters in a biased 3x3 layer from 4 to 6 channels.**

3*3*4*6+6=222.

**3. Find receptive-field width after three 3x3 stride-1 layers.**

Widths are 3,5,7, so the result is 7.

**4. For X=(5,8,8,1), valid 3x3 stride-1 filtering with four kernels, give the output shape.**

Height and width become 6: (5,6,6,4).

## Lesson 36 - Fourier transforms, smoothing and edges

**1. Find the four-point DFT of [2,2,2,2].**

X_0=8 and X_1=X_2=X_3=0 under the stated DFT convention.

**2. What component is nonzero for [1,-1,1,-1]?**

X_2=4; all other components are zero.

**3. For lengths N=5 and K=3, what FFT padding length prevents circular wraparound in full linear convolution?**

At least N+K-1=7.

**4. Why might smoothing harm recognition of tiny objects?**

Small-object structure may depend on high-frequency detail that the smoother suppresses.

## Lesson 37 - Affine layers, activations and expressive power

**1. For X=(12,8), hidden width 5 and 3 classes, give all weight and activation shapes.**

W1=(8,5), b1=(5,), Z1=A1=(12,5), W2=(5,3), b2=(3,), logits=(12,3).

**2. Combine two affine maps y=Ax+b and z=By+c into one.**

z=(BA)x+(Bb+c) under column-vector notation.

**3. Apply ReLU to [-2,0,3].**

The output is [0,0,3].

**4. Evaluate the XOR construction at (1,1).**

h1=2,h2=1, so h1-2h2=0.

## Lesson 38 - Backpropagation through a two-layer network

**1. For hidden row [1,3] and G2=[0.2,-0.2], calculate dW2.**

The outer product is [[0.2,-0.2],[0.6,-0.6]].

**2. If dA1=[2,-3] and Z1=[-1,4], calculate dZ1.**

The ReLU mask is [0,1], giving [0,-3].

**3. For X=(7,4), dZ1=(7,6), give the first-layer weight-gradient shape.**

XᵀdZ1 has shape (4,6), matching W1.

**4. Why must parameters stay unchanged until their backward sensitivities are computed?**

All derivatives must refer to the same forward computation; early updates change downstream Jacobians.

## Lesson 39 - Regularization, normalization and numerical stability

**1. Differentiate (lambda/2)||W||².**

The gradient is lambda*W.

**2. At keep probability 0.25, what happens to a kept activation of 2 under inverted dropout?**

It becomes 2/0.25=8; a dropped activation becomes zero.

**3. For logit z=100 and label y=0, approximate stable binary NLL.**

NLL≈100 because ln(1+exp(-100)) is tiny.

**4. Why should training and evaluation mode be stated for dropout and batch normalization?**

Dropout randomness and normalization statistics follow different rules in training and evaluation, changing outputs if modes are mixed.

## Lesson 40 - Autograd compared with your own gradients

**1. For L=(wx+b-y)²/2 with x=3,w=2,b=0,y=4, find dL/dw and dL/db.**

z=6 and residual=2, so dL/dw=2*3=6 and dL/db=2.

**2. Why can calling backward twice without resetting gradients change the values you inspect?**

Many frameworks add newly computed gradients to existing stored ones rather than replacing them.

**3. What should be compared before comparing gradients?**

Forward values, shapes, dtype and the exact loss expression and reduction.

**4. Why is argmax classification accuracy usually unsuitable as the differentiable training objective?**

Argmax decisions are piecewise constant and discontinuous at boundaries, giving no useful ordinary gradient for most parameter settings.

## Lesson 41 - CNN classification, inductive bias and augmentation

**1. Count convolution parameters for a biased 3x3 layer from one to four channels.**

3*3*1*4+4=40.

**2. For the worked 8x8 CNN, give the flattened feature dimension.**

6*6*4=144.

**3. Why does shifting a feature map not imply unchanged class scores?**

The classifier head or pooling/stride/boundary choices may depend on where features occur.

**4. How should a horizontal flip affect a box [x1,y1,x2,y2] in an image of width W using boundary coordinates?**

The flipped box is [W-x2,y1,W-x1,y2], with the image and labels transformed together.

## Lesson 42 - Bounding boxes, localization losses and IoU

**1. Find IoU of [0,0,2,2] and [1,1,3,3].**

Intersection=1, union=4+4-1=7, so IoU=1/7.

**2. Convert center (4,3), width 2, height 4 to boundary coordinates.**

The box is [3,1,5,5].

**3. Evaluate Smooth L1 with delta=1 at residuals 0.5 and 2.**

At 0.5: 0.5*0.25=0.125. At 2: 2-0.5=1.5.

**4. Why should two duplicate boxes not both count as true positives for one object?**

One ground-truth object can be matched once under the declared protocol; otherwise duplicates would inflate recall and precision.

## Lesson 43 - Segmentation and class imbalance

**1. For 200 pixels with 5% foreground, find accuracy of predicting all background.**

There are 190 background pixels, so accuracy=190/200=0.95.

**2. For TP=8,FP=2,FN=4, calculate foreground IoU and Dice.**

IoU=8/(8+2+4)=4/7; Dice=16/(16+2+4)=8/11.

**3. Give the logit shape for a batch of 4 images, each 32x48, with three semantic classes.**

Under channel-last convention, shape is (4,32,48,3).

**4. Does adding rare-class weight leave the original unweighted cross-entropy objective unchanged?**

No. It changes the contributions to the loss and therefore the optimized objective.

## Lesson 44 - Precision, recall, AP and mask metrics

**1. For TP=6,FP=3,FN=2, calculate precision and recall.**

Precision=6/9=2/3; recall=6/8=0.75.

**2. For ranked outcomes TP,FP,TP and two targets, compute the lesson’s noninterpolated AP.**

Positive ranks have precision 1 and 2/3; AP=(1+2/3)/2=5/6.

**3. Why can micro and macro averages disagree on imbalanced classes?**

Micro pools counts and gives frequent classes more influence; macro gives each included class equal weight.

**4. What must be specified before comparing two detection AP numbers?**

Class set, matching and duplicate policy, IoU threshold(s), recall interpolation/sampling, size ranges and prediction limits where applicable.

## Lesson 45 - Choose a question, protocol and baseline

**1. Write a one-sentence comparison question for recognition.**

One possible answer: “Does a small CNN outperform linear softmax on held-out noisy 8x8 bars under the same split and training budget?”

**2. Give a segmentation baseline and a metric that reveals its weakness.**

All-background is a baseline; foreground IoU or recall reveals its failure when objects are present.

**3. List four decisions that should be fixed before testing.**

Split/grouping rule, preprocessing, primary metric and model-selection procedure; also record seeds and evaluation conditions.

**4. What does successful recognition on generated bars demonstrate?**

It demonstrates behavior for the declared synthetic generator and split, not general performance on real-world images.

## Lesson 46 - Controlled comparisons and reproducibility

**1. Find mean and sample standard deviation of [0.7,0.8,0.9].**

Mean=0.8; sample variance=(0.01+0+0.01)/2=0.01, so standard deviation=0.1.

**2. Why is changing optimizer and architecture simultaneously hard to interpret?**

The result measures a bundled change, so either factor or their interaction could explain the difference.

**3. Does averaging three training seeds remove uncertainty about the test population?**

No. Training-run variation and test-sampling uncertainty are different and both may matter.

**4. List information needed to reproduce a fitted preprocessing pipeline.**

Training split identifiers, scaling/centering statistics, selected feature basis, code and parameter settings.

## Lesson 47 - Errors, uncertainty and domain shift

**1. Name two different kinds of domain shift for synthetic bars.**

An input shift such as stronger noise, and a prevalence shift such as far fewer vertical bars. Position or label changes are other distinct cases.

**2. Why can unchanged recall coexist with worse precision after a prevalence change?**

Precision conditions on predicted positives and depends on prevalence as well as class-conditional positive and false-positive rates.

**3. How would you test whether contrast causes an error pattern?**

Vary contrast while keeping label, position, noise protocol and model fixed; compare errors and counts over repeated generated samples.

**4. Does a narrow confidence interval on one test set prove robustness to a new distribution?**

No. It addresses sampling uncertainty under its population assumptions, not arbitrary distribution shift.

## Lesson 48 - Read a method and defend your maths

**1. List five items you must identify in a new method.**

Inputs, parameters, outputs, objective and evaluation protocol, with the assumptions and shapes that define them.

**2. Distinguish an empirical benchmark result from a mathematical guarantee.**

A benchmark result measures a stated procedure on particular data; a guarantee is a conditional logical statement under specified assumptions.

**3. Give a complete input-to-metric explanation of your capstone in five sentences.**

A satisfactory answer declares representation and shapes, forward computation, loss assumptions, training updates and evaluation protocol without skipping preprocessing or selection.

**4. Name one next topic and explain which gap in your project motivates it.**

For example, camera geometry is motivated by estimating 3D structure from views; probability calibration is motivated by unreliable confidence. Choose based on a specific need.

## Lesson 49 - Homogeneous coordinates and 2D transformations

**1. Write the 3×3 matrix that rotates by 90° about the origin and then translates by (2,0). Apply it to (1,0).**

M=[[0,−1,2],[1,0,0],[0,0,1]]. M(1,0,1)ᵀ=(2,1,1)ᵀ, so the point moves to (2,1): rotation sends (1,0) to (0,1) and translation adds (2,0).

**2. Is (3,6,3) the same 2D point as (1,2)? Which 2D point is (4,−2,2)?**

Yes: dividing (3,6,3) by 3 gives (1,2,1). Dividing (4,−2,2) by 2 gives the point (2,−1).

**3. Find the homogeneous line through (0,0) and (1,1) with a cross product.**

(0,0,1)×(1,1,1)=(−1,1,0), the line −x+y=0, that is y=x. Any nonzero multiple names the same line.

**4. Which does an affine map preserve: lengths, parallel lines, angles, midpoints?**

Parallel lines and midpoints (ratios along a line). Lengths and angles are preserved only by the Euclidean (lengths, angles) and similarity (angles) subfamilies.

## Lesson 50 - Homographies, warping and resampling

**1. Map the point (2,1) with H = [[1,0,1],[0,1,0],[0.5,0,1]] and divide by the last coordinate.**

H(2,1,1)ᵀ = (2+0+1, 0+1+0, 0.5·2+0+1) = (3, 1, 2). Dividing by the last coordinate gives the point (1.5, 0.5). Without the division you would wrongly read (3, 1).

**2. Write the two rows of A contributed by the correspondence (1,2)↔(3,5), and explain why four correspondences are needed.**

With h = (h11,…,h33), the u-row is (x, y, 1, 0, 0, 0, −ux, −uy, −u) = (1, 2, 1, 0, 0, 0, −3, −6, −3) and the v-row is (0, 0, 0, x, y, 1, −vx, −vy, −v) = (0, 0, 0, 1, 2, 1, −5, −10, −5). H has 9 entries but only 8 degrees of freedom, because any nonzero multiple gives the same map; each correspondence gives 2 equations, so 4 correspondences (no three collinear) give the 8 that are needed.

**3. Interpolate bilinearly at α = 0.25, β = 0.75 between I00 = 10 (top-left), I10 = 30 (top-right), I01 = 50 (bottom-left) and I11 = 90 (bottom-right). What does nearest neighbour give?**

Top row: 0.75·10 + 0.25·30 = 15. Bottom row: 0.75·50 + 0.25·90 = 60. Vertically: 0.25·15 + 0.75·60 = 48.75. The weights 0.1875, 0.0625, 0.5625 and 0.1875 sum to 1. Nearest neighbour: α < 0.5 picks the left column and β > 0.5 the bottom row, so it returns I01 = 50.

**4. A warp enlarges a region by 2 in each direction. With forward mapping to the nearest output pixel, at least what fraction of output pixels receives no value? Why does inverse mapping avoid this?**

Each source pixel covers about 2 × 2 = 4 output pixels, but forward mapping writes it into only one, so at most a quarter of the output is filled and at least 75% of the output pixels are holes. Inverse mapping loops over the output pixels, maps each centre back with H⁻¹ and interpolates the source there, so every output pixel gets exactly one value.

## Lesson 51 - The pinhole camera, rotations and calibration

**1. A camera has fx = fy = 500, cx = 320, cy = 240, R = I and t = (0, 0, 1). Project the world point (0.6, 0.3, 2).**

Camera coordinates: Xc = R·(0.6, 0.3, 2) + t = (0.6, 0.3, 3). Divide by the depth: (0.2, 0.1). Then u = 500·0.2 + 320 = 420 and v = 500·0.1 + 240 = 290, so the pixel is (420, 290).

**2. A 640-pixel-wide image has fx = 320. Find its horizontal field of view. Which fx gives a 60° field of view?**

FOV = 2·atan(640 / (2·320)) = 2·atan(1) = 90°. For 60° we need 640 / (2·fx) = tan 30° = 1/√3, so fx = 320·√3 ≈ 554.3 pixels. A longer focal length gives a narrower view.

**3. Show that R = [[0,−1,0],[1,0,0],[0,0,1]] is a rotation, find its angle from the trace and its axis, and give a unit quaternion for it. Why does −q describe the same rotation?**

The columns (0,1,0), (−1,0,0), (0,0,1) are orthonormal, so RᵀR = I, and det R = 0·(0·1−0·0) − (−1)·(1·1−0·0) + 0 = 1, so it is a rotation, not a reflection. tr R = 1 = 1 + 2cos θ gives cos θ = 0, θ = 90°. The axis solves Rn = n (eigenvalue 1): n = (0, 0, 1); since R sends (1,0,0) to (0,1,0), the turn is +90° about +z. A unit quaternion is q = (cos 45°, 0, 0, sin 45°) = (√2/2, 0, 0, √2/2). −q = (cos 225°, sin 225°·n) describes a turn by 450° = 360° + 90°, the same rotation; the rotation formula v ↦ q v q* is quadratic in q, so the sign cancels.

**4. A 1280 × 960 image with fx = fy = 1000, cx = 640, cy = 480 is cropped to the region starting at pixel (200, 100), and the crop is resized by a factor 0.5. What is the new K?**

Cropping moves the principal point: cx = 640 − 200 = 440, cy = 480 − 100 = 380, with fx and fy unchanged. Resizing by 0.5 halves every pixel measure: fx = fy = 500, cx = 220, cy = 190. So K = [[500, 0, 220], [0, 500, 190], [0, 0, 1]]. Only the crop's corner and the scale factor matter, not the crop's size.

## Lesson 52 - Robust fitting: RANSAC and Gauss-Newton refinement

**1. For an outlier fraction ε = 0.3 and a 2-point line model, how many RANSAC samples give 99% confidence of at least one outlier-free sample? Repeat for a 4-point homography.**

A sample is clean with probability (0.7)² = 0.49, so N = ⌈ln 0.01 / ln 0.51⌉ = ⌈−4.605 / −0.6733⌉ = ⌈6.84⌉ = 7. For s = 4, (0.7)⁴ = 0.2401 and N = ⌈ln 0.01 / ln 0.7599⌉ = ⌈−4.605 / −0.2746⌉ = ⌈16.77⌉ = 17. Doubling the sample size more than doubles the work.

**2. With Huber threshold δ = 1, find the loss and the IRLS weight for residuals 0.5 and 4. Compare each loss with the squared loss ½r².**

|0.5| ≤ 1, so ρ = ½(0.5)² = 0.125 and the weight is 1: small residuals are treated exactly as in least squares (squared loss 0.125). |4| > 1, so ρ = 1·(4 − ½) = 3.5 and the weight is min(1, 1/4) = 0.25, against a squared loss of ½·16 = 8. The influence w·r is 1 instead of 4.

**3. The points are (0,1), (1,3), (2,5), (3,1), (4,9). RANSAC draws the samples {(0,1), (2,5)} and {(2,5), (3,1)}. With τ = 0.5 on vertical residuals, find each line's consensus set. Which model is kept, and what does the refit on its inliers give?**

Sample 1 gives y = 2x + 1. Its residuals are 0, 0, 0, −6, 0, so four points vote: (0,1), (1,3), (2,5) and (4,9). Sample 2 gives slope (1 − 5)/(3 − 2) = −4 and y = −4x + 13, with residuals −12, −6, 0, 0, 12: only its own two points vote. RANSAC keeps y = 2x + 1, and least squares on its four inliers returns y = 2x + 1 exactly because they lie on it.

**4. For residuals r₁ = θ² − 9 and r₂ = θ − 3, take one Gauss–Newton step from θ = 1 and one Levenberg–Marquardt step with λ = 4. Evaluate E = ½‖r‖² before and after each step.**

At θ = 1, r = (−8, −2), J = (2, 1), JᵀJ = 5, Jᵀr = −18 and E = ½(64 + 4) = 34. Gauss–Newton: δ = 18/5 = 3.6, θ = 4.6, r = (12.16, 1.6), E ≈ 75.2, so the full step overshoots and raises the cost (LM would reject it and increase λ). Levenberg–Marquardt: δ = 18/(5 + 4) = 2, θ = 3, r = (0, 0) and E = 0.

## Lesson 53 - Matrix calculus for layers and losses

**1. Find ∇f for f(x) = xᵀAx with A = [[1, 4], [0, 2]] at x = (1, 2). Compare it with 2Ax.**

A + Aᵀ = [[2, 4], [4, 4]], so ∇f = (A + Aᵀ)x = (2 + 8, 4 + 8) = (10, 12). Check with f = x₁² + 4x₁x₂ + 2x₂²: ∂f/∂x₁ = 2x₁ + 4x₂ = 10 and ∂f/∂x₂ = 4x₁ + 4x₂ = 12. The shortcut 2Ax = 2(9, 4) = (18, 8) is wrong because A is not symmetric.

**2. Find the gradient of ‖Ax − b‖² for A = [[1, 0], [0, 1], [1, 1]], b = (1, 2, 0) at x = (1, 1).**

r = Ax − b = (1, 1, 2) − (1, 2, 0) = (0, −1, 2). Aᵀr = (0 + 2, −1 + 2) = (2, 1), so ∇f = 2Aᵀr = (4, 2): two entries, like x.

**3. A linear layer Y = XW + 1bᵀ has X = [[1, 2], [3, 0], [0, 1]], W = [[2, 0], [1, 1]] and upstream gradient G = [[1, 0], [0, 1], [1, −1]]. Compute ∂L/∂W, ∂L/∂b and ∂L/∂X, and check each shape.**

∂L/∂W = XᵀG = [[1·1 + 3·0 + 0·1, 1·0 + 3·1 + 0·(−1)], [2·1 + 0·0 + 1·1, 2·0 + 0·1 + 1·(−1)]] = [[1, 3], [3, −1]], 2 × 2 like W. ∂L/∂b = column sums of G = (2, 0), two entries like b. ∂L/∂X = GWᵀ with Wᵀ = [[2, 1], [0, 1]]: rows (2, 1), (0, 1), (2, 0), so 3 × 2 like X.

**4. For f in Exercise 1, compute the central and the forward difference for ∂f/∂x₁ with h = 0.1. Why is the central difference exact here?**

f(1, 2) = 1 + 8 + 8 = 17, f(1.1, 2) = 18.01 and f(0.9, 2) = 16.01. Central: (18.01 − 16.01)/0.2 = 10, exactly the true value. Forward: (18.01 − 17)/0.1 = 10.1, an error of 0.1 = h·(∂²f/∂x₁²)/2 = 0.1·2/2. The central difference is exact because f is quadratic in x₁: the even-order terms cancel in f(x + h) − f(x − h), and there is no third derivative.

## Lesson 54 - Entropy, KL divergence and contrastive learning

**1. Compute the entropy of p=(1/2, 1/4, 1/8, 1/8) in bits and in nats, and compare it with the maximum for four classes.**

The surprises are 1, 2, 3 and 3 bits, so H = ½·1 + ¼·2 + ⅛·3 + ⅛·3 = 1.75 bits. In nats, 1.75 × ln 2 = 1.213. The maximum for four classes is log₂ 4 = 2 bits = ln 4 = 1.386 nats, reached only by the uniform distribution.

**2. For p=(0.5, 0.5) and q=(0.9, 0.1), compute KL(p‖q) and KL(q‖p). Which is larger, and why?**

KL(p‖q) = 0.5 ln(0.5/0.9) + 0.5 ln(0.5/0.1) = −0.294 + 0.805 = 0.511. KL(q‖p) = 0.9 ln(0.9/0.5) + 0.1 ln(0.1/0.5) = 0.529 − 0.161 = 0.368. KL(p‖q) is larger: p puts half its mass on the second class, where q gives only 0.1, and each such outcome costs ln 5 = 1.61 nats. The reverse direction weights the log-ratios by q, which rarely visits that class.

**3. Apply label smoothing with K = 5 and ε = 0.2. Write the target, compute its entropy, and find the logit gap z_t − z_j that minimizes cross-entropy.**

p_t = 1 − 0.2 + 0.2/5 = 0.84 and p_j = 0.2/5 = 0.04 for each of the four wrong classes, so p = (0.84, 0.04, 0.04, 0.04, 0.04). H(p) = −0.84 ln 0.84 − 4 × 0.04 ln 0.04 = 0.146 + 0.515 = 0.661 nats. Cross-entropy is smallest when q = p, and q_t/q_j = e^(z_t − z_j), so z_t − z_j = ln(0.84/0.04) = ln 21 = 3.045.

**4. An image has cosine similarities (0.6, 0.2, 0.0, −0.2) with four captions, and the first caption is its true partner. Compute the InfoNCE loss for τ = 0.2 and for τ = 1, and compare both with ln 4.**

τ = 0.2: logits (3, 1, 0, −1), so L = ln(e³ + e + 1 + e⁻¹) − 3 = ln(1 + e⁻² + e⁻³ + e⁻⁴) = ln 1.2034 = 0.185. τ = 1: logits (0.6, 0.2, 0, −0.2), so L = ln(1.822 + 1.221 + 1 + 0.819) − 0.6 = ln 4.862 − 0.6 = 0.982. Chance level is ln 4 = 1.386. Both are below it, but the small temperature turns the same cosines into a confident, nearly correct softmax.

## Lesson 55 - Attention and vision transformers

**1. A ViT uses 16 × 16 patches on a 384 × 384 × 3 image. How many patch tokens are there, how long is each flattened patch, and how many entries does one head's attention matrix have once the class token is included?**

384/16 = 24 patches per side, so 24² = 576 patch tokens. Each flattened patch has 16 × 16 × 3 = 768 numbers. With the class token there are 577 tokens, so one head's attention matrix has 577² = 332,929 entries, about 8.6 times the 197² = 38,809 of a 224 × 224 image.

**2. Compute one attention row with d = 4: query q = (1, 0, 2, 1), keys k₁ = (2, 0, 0, 0) and k₂ = (0, 1, 1, 1), and scalar values v₁ = 4, v₂ = −2. Give the weights and the output.**

Scores q·k₁ = 2 and q·k₂ = 0 + 0 + 2 + 1 = 3. Divide by √4 = 2: (1, 1.5). Softmax: e¹ = 2.718 and e^1.5 = 4.482, so the weights are 2.718/7.200 = 0.378 and 4.482/7.200 = 0.622. Output 0.378 × 4 + 0.622 × (−2) = 1.510 − 1.245 = 0.265.

**3. The entries of q and k are independent with mean 0 and variance 1, and d = 256. What are the standard deviations of qᵀk and of qᵀk/√d? Compare the softmax of two scores two standard deviations apart before and after scaling.**

Var(qᵀk) = d × 1 × 1 = 256, so its standard deviation is 16; after dividing by √256 = 16 it is 1. Two scores two standard deviations apart differ by 32 before scaling: softmax gives (1 − 1.3×10⁻¹⁴, 1.3×10⁻¹⁴), a one-hot row with vanishing gradients. After scaling they differ by 2: softmax gives (0.881, 0.119), and both keys still receive gradient.

**4. Explain why the class-token output of a self-attention layer without positional embeddings does not change when you shuffle the patches, and name two assumptions a CNN builds in that a ViT has to learn.**

Without positional embeddings every score depends only on the contents of the two tokens. Shuffling the patches permutes the class token's scores and the value vectors in the same way, so the weighted sum Σⱼ aⱼvⱼ is unchanged; the patch outputs are permuted identically (permutation equivariance). A CNN assumes locality (small kernels see neighbouring pixels) and translation equivariance with shared weights; a ViT must learn spatial relations from its positional embeddings and from data.

## Lesson 56 - Multi-scale features: pyramids, FPN and U-Net

**1. Build the Laplacian pyramid of the 1D signal (2,8,6,0) using pair averaging and repetition, then rebuild it. What does the rebuilt signal become if L₀ is set to zero?**

Pair averages give G₁=(5,3) and G₂=(4), so L₂=(4). up(G₁)=(5,5,3,3) gives L₀=(2−5, 8−5, 6−3, 0−3)=(−3,3,3,−3), and up(G₂)=(4,4) gives L₁=(1,−1). Rebuild: L₁+up(L₂)=(5,3)=G₁, then L₀+up(G₁)=(2,8,6,0)=G₀. With L₀ set to zero the result is (5,5,3,3); the error is exactly L₀.

**2. A 640×640 image goes through an FPN with levels P₂ to P₅ (strides 4, 8, 16, 32) and 3 anchors per cell. How many anchors are on each level, and in total?**

The map sides are 640/4=160, 80, 40 and 20. Anchors: 160²·3=76,800 on P₂, 80²·3=19,200 on P₃, 40²·3=4,800 on P₄ and 20²·3=1,200 on P₅, so 102,000 in total, about 75% of them on P₂.

**3. With k=⌊4+log₂(√(wh)/224)⌋ clamped to 2 to 5, assign boxes of 112×112, 300×200, 50×30 and 1200×1000 pixels to levels.**

√(wh)=112 gives 4+log₂(0.5)=3, so P₃. √60000≈244.9 gives 4+0.129≈4.13, so P₄. √1500≈38.7 gives 4−2.53≈1.47, floor 1, clamped to P₂. √1,200,000≈1095.4 gives 4+2.29≈6.29, floor 6, clamped to P₅.

**4. A transposed convolution with kernel 3, stride 2 and padding 1 takes a 16×16 map. What is the output side, and what does output padding 1 change? Why can this layer print a checkerboard, and which kernel size avoids uneven overlap at stride 2?**

(16−1)·2−2·1+3=31, so the output is 31×31; output padding 1 adds one row and column, giving 32×32, an exact doubling. With kernel 3 and stride 2 the kernel copies overlap unevenly: interior outputs alternately receive two taps and one, so a constant input can produce a period-2 pattern, a checkerboard in 2D, unless the learned weights compensate. Kernel 4, a multiple of the stride, gives every interior output two taps (with padding 1 it maps 16 to exactly 32); resizing first and then applying a 3×3 convolution also avoids the problem.

## Lesson 57 - Image gradients, the structure tensor and corners

**1. A 3×3 patch has rows (20, 30, 50), (20, 40, 60) and (30, 50, 70). Compute I_x and I_y with Sobel divided by 8, then |∇I| and θ = atan2(I_y, I_x) in degrees.**

Sobel x weighs the right column minus the left column by 1, 2, 1: (50 − 20) + 2(60 − 20) + (70 − 30) = 30 + 80 + 40 = 150, so I_x = 150/8 = 18.75. Sobel y weighs the bottom row minus the top row: (30 − 20) + 2(50 − 30) + (70 − 50) = 10 + 40 + 20 = 70, so I_y = 70/8 = 8.75. |∇I| = √(18.75² + 8.75²) = √428.125 ≈ 20.69 grey levels per pixel, and θ = atan2(8.75, 18.75) ≈ 25.0°: brightness grows to the right and somewhat downwards.

**2. A window has gradients (2, 1), (2, 1), (−1, 2) and (0, 0). Build M, find det M, tr M, the eigenvalues and the Harris score with k = 0.05. Flat, edge or corner?**

Add the outer products ∇I∇Iᵀ. (2, 1) gives [[4, 2], [2, 1]], twice: [[8, 4], [4, 2]]; (−1, 2) gives [[1, −2], [−2, 4]]; (0, 0) adds nothing. M = [[9, 2], [2, 6]]. det M = 9·6 − 2² = 50 and tr M = 15, so R = 50 − 0.05·15² = 50 − 11.25 = 38.75. Eigenvalues: 7.5 ± √(1.5² + 2²) = 7.5 ± 2.5, so λ₁ = 10 and λ₂ = 5 (check: 10·5 = 50 and 10 + 5 = 15). Both are large and R > 0: a corner.

**3. Three pixels have gradient (3, 4) and one has (0, 0). Find M, its eigenvalues and R with k = 0.04, and compare with three gradients (5, 0). What is E for a unit shift along the edge, (4, −3)/5, and across it, (3, 4)/5?**

M = 3·[[9, 12], [12, 16]] = [[27, 36], [36, 48]]. det M = 27·48 − 36² = 1296 − 1296 = 0 and tr M = 75, so λ = 75 and 0 and R = 0 − 0.04·75² = −225: an edge. Three gradients (5, 0) give M = [[75, 0], [0, 0]], the same eigenvalues and the same R: the edge is only rotated, since (3, 4) and (5, 0) both have length 5. Along the edge, u = (0.8, −0.6): Mu = (21.6 − 21.6, 28.8 − 28.8) = (0, 0), so E = 0 and the patch slides along itself unchanged. Across it, u = (0.6, 0.8): Mu = (45, 60) and E = uᵀMu = 27 + 48 = 75 = λ₁.

**4. A flat region carries independent noise with σ = 10 grey levels. Find the standard deviation of the central-difference I_x and of Sobel divided by 8. How many multiplications per pixel does a σ = 2 derivative of Gaussian need with and without separability, using a radius of 3σ?**

The central difference is (I(x+1) − I(x−1))/2: the variance is (1 + 1)σ²/4 = 50, so the standard deviation is σ/√2 ≈ 7.07. Sobel/8 combines six pixels with weights ±1, ±2, ±1 divided by 8: the variance is (1 + 4 + 1 + 1 + 4 + 1)σ²/64 = 12·100/64 = 18.75, a standard deviation of √12·10/8 ≈ 4.33. The built-in smoothing cuts the noise by almost 40%. With σ = 2 the radius is 6, so each 1D kernel has 13 taps: separable filtering costs 13 + 13 = 26 multiplications per pixel against 13² = 169 for the full 2D kernel, six and a half times fewer.

## Lesson 58 - Scale space, descriptors and matching

**1. An image is blurred with σ = 3 and then σ = 4. What single blur is that? A scale space holds σ = 1.6; what extra blur reaches σ = 3.2?**

Variances add: 3² + 4² = 9 + 16 = 25, so the two blurs equal one blur with σ = √25 = 5. To go from 1.6 to 3.2 the extra blur must supply the missing variance: √(3.2² − 1.6²) = √(10.24 − 2.56) = √7.68 ≈ 2.77, not 3.2 − 1.6 = 1.6. This is how a scale space is built incrementally, one small blur at a time.

**2. For a Gaussian blob of width s = 2, compute the normalised response 2σ²s²/(s² + σ²)² at σ = 1, 2 and 4. Which σ is detected, and what radius √2σ is drawn? What changes if the image is shrunk to half size?**

With s² = 4: σ = 1 gives 2·1·4/(4 + 1)² = 8/25 = 0.32; σ = 2 gives 2·4·4/8² = 32/64 = 0.5; σ = 4 gives 2·16·4/20² = 128/400 = 0.32. The response peaks at σ = 2 = s, so the blob is detected at σ = 2 with a circle of radius √2·2 ≈ 2.83 pixels. Shrinking the image to half size halves the blob to s = 1, so it is detected at σ = 1 with radius ≈ 1.41: the detected scale follows the image scale, which is what makes the detector scale-covariant.

**3. A descriptor cell has gradients (3, 0), (0, 2), (−1, 1) and (2, 2). Build its 8-bin orientation histogram (45° bins centred on 0°, 45°, …). What happens to it if the contrast doubles, if 50 is added to every pixel, and if the patch is rotated by 90° and angles are measured from the dominant orientation?**

Angles and magnitudes: (3, 0) is 0° with magnitude 3; (0, 2) is 90° with 2; (−1, 1) is 135° with √2 ≈ 1.41; (2, 2) is 45° with √8 ≈ 2.83. The histogram over bins 0°, 45°, …, 315° is (3, 2.83, 2, 1.41, 0, 0, 0, 0); its length is √23 ≈ 4.80, so the unit vector is (0.626, 0.590, 0.417, 0.295, 0, 0, 0, 0). Doubling the contrast doubles every gradient and every vote, but the unit vector is unchanged. Adding 50 to every pixel leaves all differences, and so all gradients, unchanged. Rotating by 90° adds 90° to every angle, shifting each vote two bins; the dominant orientation (here 0°) moves by 90° too, so angles measured from it, and the descriptor, are unchanged.

**4. Three descriptors in A have distances (0.20, 0.50, 0.70), (0.30, 0.35, 0.90) and (0.60, 0.80, 0.25) to three in B. Apply the ratio test with threshold 0.8 and the mutual test. Which matches survive? Then find the Hamming distance between the binary descriptors 10110010 and 10011011.**

A1: nearest B1 at 0.20, second 0.50, ratio 0.40 < 0.8, accept. A2: nearest B1 at 0.30, second 0.35, ratio 0.857 > 0.8, reject. A3: nearest B3 at 0.25, second 0.60, ratio 0.417, accept. Mutual test: B1's nearest in A is A1 (0.20 < 0.30 < 0.60) and B3's is A3 (0.25), so both accepted matches are mutual. The survivors are A1–B1 and A3–B3; A2 would also fail the mutual test, since B1 prefers A1. Hamming: 10110010 XOR 10011011 = 00101001, which has 3 ones, so the distance is 3.

## Lesson 59 - Optical flow and direct image alignment

**1. Three pixels have (I_x, I_y, I_t) = (2, 0, −2), (0, 1, 1) and (1, 1, 0). Build M and the right-hand side, solve for (u, v) and check each equation.**

M = [[ΣI_x², ΣI_xI_y], [ΣI_xI_y, ΣI_y²]] = [[4 + 0 + 1, 0 + 0 + 1], [1, 0 + 1 + 1]] = [[5, 1], [1, 2]]. Right-hand side −(ΣI_xI_t, ΣI_yI_t) = −((2)(−2) + 0 + (1)(0), 0 + (1)(1) + (1)(0)) = (4, −1). det M = 10 − 1 = 9, so (u, v) = (1/9)[[2, −1], [−1, 5]](4, −1) = (1/9)(8 + 1, −4 − 5) = (1, −1). Check I_xu + I_yv + I_t: 2·1 + 0 − 2 = 0, 0 + 1·(−1) + 1 = 0 and 1·1 + 1·(−1) + 0 = 0, so all three hold exactly.

**2. Every pixel in a window has gradient (3, 4) and I_t = −10. Why can Lucas–Kanade not solve for the flow? Give the normal flow vector and two different flows that satisfy the constraint.**

Every row of the least-squares system is (3, 4), so M = n·[[9, 12], [12, 16]] has determinant 0: its eigenvalues are 25n and 0, and the system has a line of solutions. Each pixel says only 3u + 4v = 10. The normal flow is the solution along the gradient: length −I_t/|∇I| = 10/5 = 2 pixels in direction (0.6, 0.8), i.e. (1.2, 1.6). Adding any multiple of the edge direction (−0.8, 0.6) also fits, for example (2, 1): 6 + 4 = 10, and (−2, 4): −6 + 16 = 10. This is the aperture problem: motion along the edge is invisible in the window.

**3. A camera pans so that content moves 8 pixels between frames, and Lucas–Kanade is reliable only below about 1 pixel. How many pyramid levels are needed, what is the motion at each level, and how many for a 13-pixel motion?**

Halving the image halves the motion: 8 px at level 0, 4 px at level 1, 2 px at level 2 and 1 px at level 3. Three levels above the original (a 4-level pyramid) bring it down to 1 pixel, where the linearisation works; the flow found there is doubled at each finer level and refined. For 13 px: 13, 6.5, 3.25, 1.625, 0.8125, so level 4 is the first below 1 pixel and four halvings are needed.

**4. Apply one Horn–Schunck update at a pixel with (I_x, I_y, I_t) = (1, 0, −2) and neighbour average ū = v̄ = 0 for α = 1 and α = 3. Repeat for α = 1 when ū = 1.5. What does α control?**

The data residual is I_xū + I_yv̄ + I_t = 0 + 0 − 2 = −2. With α = 1: u = 0 − 1·(−2)/(1 + 1) = 1 and v = 0 − 0 = 0. With α = 3: u = 2/(9 + 1) = 0.2. With ū = 1.5 and α = 1 the residual is 1.5 − 2 = −0.5, so u = 1.5 + 0.5/2 = 1.75. The single pixel alone asks for u = 2 (its constraint u − 2 = 0); α² weighs agreement with the neighbours against that data term, so a large α gives smooth flow that spreads from textured into flat regions, and a small α trusts each pixel's own constraint.

## Lesson 60 - Multivariate Gaussians, Kalman filtering and data association

**1. Let x ~ N((2, 1), diag(1, 4)) and y = Ax with A = [[1, 1], [0, 1]]. Find the mean and covariance of y, then the Mahalanobis distance of the point (5, 3) from y's mean.**

Mean Aμ = (2 + 1, 1) = (3, 1). Covariance AΣAᵀ: AΣ = [[1, 4], [0, 4]], and multiplying by Aᵀ = [[1, 0], [1, 1]] gives [[1 + 4, 4], [4, 4]] = [[5, 4], [4, 4]]. For (5, 3) the offset is (2, 2). The inverse is (1/(20 − 16))[[4, −4], [−4, 5]] = [[1, −1], [−1, 1.25]], so d² = (2, 2)·(2 − 2, −2 + 2.5) = (2, 2)·(0, 0.5) = 1 and d = 1: one standard deviation away, although the straight-line distance is 2.83, because the offset lies along the long, correlated axis of the ellipse.

**2. Run one Kalman step for x = (0, 2), P = I, F = [[1, 1], [0, 1]], Q = 0, H = [1 0], R = 2 and measurement z = 3.5. Give x⁻, P⁻, S, K, the updated x and P.**

Predict: x⁻ = Fx = (0 + 2, 2) = (2, 2) and P⁻ = FIFᵀ + 0 = [[2, 1], [1, 1]]. Innovation y = z − Hx⁻ = 3.5 − 2 = 1.5, with S = HP⁻Hᵀ + R = 2 + 2 = 4. Gain K = P⁻Hᵀ/S = (2, 1)/4 = (0.5, 0.25). Update: x = (2 + 0.5·1.5, 2 + 0.25·1.5) = (2.75, 2.375). P = P⁻ − KSKᵀ = [[2, 1], [1, 1]] − 4·[[0.25, 0.125], [0.125, 0.0625]] = [[1, 0.5], [0.5, 0.75]]. The position variance halves (precisions 1/2 + 1/2 = 1) and the unmeasured velocity is corrected by 0.375 through the covariance 1 between position and velocity.

**3. With the S of question 2, which of the measurements 3.5, 6.5 and −2 pass a 95% gate, d² < 3.84?**

The predicted measurement is Hx⁻ = 2 and S = 4. z = 3.5: y = 1.5, d² = 2.25/4 = 0.5625 < 3.84, accepted. z = 6.5: y = 4.5, d² = 20.25/4 = 5.06, rejected. z = −2: y = −4, d² = 16/4 = 4.00, just above 3.84, rejected. A gate of d² < 3.84 is the same as |y| < 1.96·√S = 3.92 for a one-dimensional measurement.

**4. Three tracks and three detections have costs [[0.1, 0.3, 0.9], [0.2, 0.9, 0.9], [0.9, 0.4, 0.3]]. Find the greedy assignment and its total, then the optimal assignment with the Hungarian algorithm.**

Greedy picks the smallest entry, 0.1 (track 1 to detection 1), then the smallest among the remaining rows 2–3 and columns 2–3, 0.3 (track 3 to detection 3), and is left with 0.9 (track 2 to detection 2): total 1.3. Hungarian: subtract the row minima 0.1, 0.2, 0.3 to get [[0, 0.2, 0.8], [0, 0.7, 0.7], [0.6, 0.1, 0]], then the column minima 0, 0.1, 0 to get [[0, 0.1, 0.8], [0, 0.6, 0.7], [0.6, 0, 0]]. All zeros are covered by two lines (column 1 and row 3), fewer than 3, so subtract the smallest uncovered value 0.1 from the uncovered entries and add it where the lines cross: [[0, 0, 0.7], [0, 0.5, 0.6], [0.7, 0, 0]]. Now three independent zeros exist: track 2 must take detection 1, so track 1 takes detection 2 and track 3 detection 3. Total 0.3 + 0.2 + 0.3 = 0.8, better than greedy's 1.3.

## Lesson 61 - Epipolar geometry and the eight-point algorithm

**1. Take R = I and t = (0, 1, 0), a vertical step. Write E = [t]×, check the epipolar constraint for X₁ = (1, 2, 4), and describe the epipolar lines in image 2.**

With t = (0, 1, 0), [t]× = [[0, −t₃, t₂], [t₃, 0, −t₁], [−t₂, t₁, 0]] = [[0, 0, 1], [0, 0, 0], [−1, 0, 0]], and E = [t]× because R = I. X₁ = (1, 2, 4) gives x̂₁ = (0.25, 0.5, 1); X₂ = X₁ + t = (1, 3, 4) gives x̂₂ = (0.25, 0.75, 1). The epipolar line is Ex̂₁ = (1, 0, −0.25), that is x − 0.25 = 0, and x̂₂ᵀEx̂₁ = 0.25 − 0.25 = 0, so the constraint holds. The epipole e₂ ≃ t = (0, 1, 0) has last coordinate 0, a point at infinity along y, so every epipolar line in image 2 is vertical: after a vertical step, matches move only up or down.

**2. Write the eight-point row for the pixel match (100, 50) ↔ (120, 40), and explain why the raw pixel row is badly scaled.**

With x₁ = (100, 50) and x₂ = (120, 40) the row (x₂x₁, x₂y₁, x₂, y₂x₁, y₂y₁, y₂, x₁, y₁, 1) is (12000, 6000, 120, 4000, 2000, 40, 100, 50, 1). Its entries range from 12,000 down to 1, and for a 640 × 480 image the products reach about 300,000. The smallest singular vector of A is then dominated by the large columns: tiny relative errors there swamp the entries that multiply 1, so noise drags the estimate by several pixels. Normalising each image's points (centroid at the origin, mean distance √2) makes every entry of order 1; afterwards F = T₂ᵀF̂T₁ undoes the change.

**3. An estimate of E has singular values (1.2, 0.8, 0.05). What are the singular values of the closest essential matrix, and how far is it in the Frobenius norm? With 40% wrong matches and p = 0.99, how many RANSAC samples do the eight-point and five-point algorithms need?**

An essential matrix has two equal singular values and a zero, because E = [t]×R and [t]×t = 0. The closest one in the Frobenius norm keeps the singular vectors and replaces the values by their mean and zero: ((1.2 + 0.8)/2, (1.2 + 0.8)/2, 0) = (1, 1, 0). The distance is √(0.2² + 0.2² + 0.05²) = √0.0825 ≈ 0.287. For RANSAC with ε = 0.4: an eight-point sample is clean with probability 0.6⁸ = 0.0168, so N = ⌈ln 0.01 / ln(1 − 0.0168)⌉ = ⌈−4.605 / −0.01694⌉ = ⌈271.9⌉ = 272. A five-point sample is clean with probability 0.6⁵ = 0.0778, so N = ⌈−4.605 / −0.0809⌉ = ⌈56.9⌉ = 57, almost five times fewer.

**4. A camera moves straight forward without turning: X₂ = X₁ + t with t = (0, 0, −1). Find E, the epipole in each image and the epipolar line of x̂₁ = (0.25, 0.5, 1). Where does X₁ = (1, 2, 4) appear in image 2?**

E = [t]× = [[0, 1, 0], [−1, 0, 0], [0, 0, 0]]. The epipole in image 2 is e₂ ≃ t = (0, 0, −1) ≃ (0, 0, 1), the image centre; camera 2's centre is at −Rᵀt = (0, 0, 1) in camera 1, so e₁ is the centre of image 1 too. The line Ex̂₁ = (0.5, −0.25, 0) is 0.5x − 0.25y = 0, that is y = 2x, a line through the centre: with forward motion all epipolar lines radiate from the epipole. X₂ = X₁ + t = (1, 2, 3) gives x̂₂ = (1/3, 2/3) ≈ (0.333, 0.667), which lies on y = 2x and farther from the centre than x̂₁ = (0.25, 0.5). As the camera moves forward, points stream outwards from this focus of expansion.

## Lesson 62 - Triangulation, rectification and stereo depth

**1. Take P₁ = [I | 0] and P₂ = [I | (−0.5, 0, 0)ᵀ] with the normalised match (0.1, −0.2) ↔ (0, −0.2). Write the four DLT rows and find the point.**

The rows of P₁ are p₁ = (1, 0, 0, 0), p₂ = (0, 1, 0, 0), p₃ = (0, 0, 1, 0); P₂ has p₁ = (1, 0, 0, −0.5) and the same p₂, p₃. View 1: x p₃ᵀ − p₁ᵀ = (−1, 0, 0.1, 0) and y p₃ᵀ − p₂ᵀ = (0, −1, −0.2, 0). View 2 with x = 0: (−1, 0, 0, 0.5); with y = −0.2: (0, −1, −0.2, 0). The first and third rows give X = 0.1Z and X = 0.5W; the second gives Y = −0.2Z. With W = 1: X = 0.5, Z = 5, Y = −1, so the point is (0.5, −1, 5). Check: the disparity is 0.1 − 0 = 0.1 = B/Z = 0.5/5.

**2. A stereo rig has f = 700 px and B = 0.12 m. Find the depth for disparities of 42 px and 6 px, and the depth error at both for σ_d = 0.25 px.**

fB = 700 · 0.12 = 84. For d = 42: Z = 84/42 = 2 m and σ_Z ≈ Z²σ_d/(fB) = 4 · 0.25/84 ≈ 0.0119 m, about 1.2 cm. For d = 6: Z = 84/6 = 14 m and σ_Z ≈ 196 · 0.25/84 ≈ 0.583 m. The second point is 7 times farther and its error is 49 times larger, because σ_Z grows with Z².

**3. The SAD costs at d = 17, 18 and 19 are 52, 20 and 28. Find the sub-pixel disparity and compare the depths it and the whole-pixel winner give with fB = 84.**

With C₋ = 52, C₀ = 20 and C₊ = 28: C₊ − 2C₀ + C₋ = 28 − 40 + 52 = 40, so d* = 18 − (28 − 52)/(2 · 40) = 18 + 24/80 = 18.3. The minimum leans towards d = 19, whose cost is lower than that of d = 17. The depths are 84/18.3 ≈ 4.590 m and 84/18 ≈ 4.667 m: rounding to the whole pixel would cost about 7.7 cm here.

**4. With the two rows of the SAD example, centre the 3-pixel window at x = 4 instead and compute the costs for d = 0 to 3. What would the costs be if both rows were constant at 20, and what does that say about matching on a white cup?**

The left window at x = 4 is (90, 40, 20). Against the right row at x − d: d = 0 gives (20, 20, 20) and a cost of 70 + 20 + 0 = 90; d = 1 gives (40, 20, 20) and 50 + 20 + 0 = 70; d = 2 gives (90, 40, 20) and 0; d = 3 gives (50, 90, 40) and 40 + 50 + 20 = 110. The winner is d̂ = 2, as at x = 3. If both rows were constant at 20, every cost would be 0: the cost curve is flat and any disparity fits equally well. A white cup or a smooth saucer behaves the same way, so matching there needs a larger window, a smoothness prior or a learned matcher, and its estimates should be flagged as unreliable.

## Lesson 63 - Rotations as a manifold, point-set alignment and bundle adjustment

**1. The points (2, 0), (0, 1), (−2, 0), (0, −1) are matched to (3, 2), (2, 0), (3, −2), (4, 0). Find the centroids, H, R and t with Kabsch.**

p̄ = (0, 0) and q̄ = ((3 + 2 + 3 + 4)/4, (2 + 0 − 2 + 0)/4) = (3, 0). The centred targets are (0, 2), (−1, 0), (0, −2), (1, 0). H = Σ p̃q̃ᵀ = (2,0)(0,2)ᵀ + (0,1)(−1,0)ᵀ + (−2,0)(0,−2)ᵀ + (0,−1)(1,0)ᵀ = [[0, 8], [−2, 0]]. Its SVD has Σ = diag(8, 2), U = [[1, 0], [0, −1]] and V = [[0, 1], [1, 0]], so VUᵀ = [[0, −1], [1, 0]] with determinant +1 and no correction is needed: R is the 90° turn [[0, −1], [1, 0]]. Then t = q̄ − Rp̄ = (3, 0). Check: R(2, 0) + t = (0, 2) + (3, 0) = (3, 2).

**2. Apply δ = (0, 0, 0.5) to p = (1, 0, 0) exactly with the exponential map and with the first-order matrix I + [δ]×. Compare the lengths, and find det(I + [δ]×).**

θ = ‖δ‖ = 0.5 about the z axis. Exactly: exp([δ]×)p = (cos 0.5, sin 0.5, 0) ≈ (0.878, 0.479, 0), of length 1. First order: (I + [δ]×)p = p + δ × p = (1, 0, 0) + (0, 0.5, 0) = (1, 0.5, 0), of length √1.25 ≈ 1.118, an 11.8% stretch. det(I + [δ]×) = 1 + ‖δ‖² = 1.25, so the first-order matrix is not a rotation; repeated additive updates keep inflating the shape, while R exp([δ]×) stays a rotation for any δ.

**3. A reconstruction has 50 cameras and 20,000 points, and each point is seen by 4 cameras on average. How many unknowns and residuals does bundle adjustment have, how large is the reduced camera system, and how many gauge directions are there?**

Unknowns: 6 · 50 + 3 · 20,000 = 300 + 60,000 = 60,300. Observations: 20,000 · 4 = 80,000, each giving 2 residuals (x and y), so 160,000 residuals. The Schur complement eliminates the 60,000 point unknowns three at a time, leaving a reduced camera system of size 6 · 50 = 300, that is 300 × 300. A monocular reconstruction can be moved, turned and scaled without changing any reprojection: 3 + 3 + 1 = 7 gauge directions, which must be fixed (for example by holding the first camera and the scale) or damped.

**4. Solve [[5, 2, 1], [2, 4, 0], [1, 0, 2]] δ = (4, 2, 1) by eliminating the last two unknowns with the Schur complement, then back-substitute.**

Here B = 5, E = (2, 1), C = diag(4, 2), v = 4 and w = (2, 1). Reduced equation: (5 − 2²/4 − 1²/2) δ_c = 4 − 2 · 2/4 − 1 · 1/2, that is 3.5 δ_c = 2.5, so δ_c = 5/7 ≈ 0.714. Back-substitution: δ₁ = (2 − 2δ_c)/4 = (4/7)/4 = 1/7 ≈ 0.143 and δ₂ = (1 − δ_c)/2 = (2/7)/2 = 1/7 ≈ 0.143. Check the first row: 5 · 5/7 + 2/7 + 1/7 = 28/7 = 4.

## Lesson 64 - Volume rendering and neural radiance fields

**1. Three samples along a ray have σδ = (0.2, 1.0, 2.0). Compute α, T and w for each, and the transmittance left for the background. Check that everything adds up to 1.**

α₁ = 1 − e^(−0.2) = 0.1813, α₂ = 1 − e^(−1) = 0.6321, α₃ = 1 − e^(−2) = 0.8647. Transmittance before each sample: T₁ = 1, T₂ = 1 − 0.1813 = 0.8187, T₃ = 0.8187 · 0.3679 = 0.3012. Weights wᵢ = Tᵢαᵢ: 0.1813, 0.5175 and 0.2604. The background gets T₄ = 0.3012 · 0.1353 = 0.0408. Total 0.1813 + 0.5175 + 0.2604 + 0.0408 = 1.0000: every bit of the pixel comes from one sample or the background.

**2. Their grey colours are 0.2, 0.9 and 0.5 at depths 2, 3 and 4, and the background is white (1). Render the pixel and find the expected depth of the opaque part.**

Ĉ = 0.1813 · 0.2 + 0.5175 · 0.9 + 0.2604 · 0.5 + 0.0408 · 1 = 0.0363 + 0.4658 + 0.1302 + 0.0408 ≈ 0.673. The samples' weights sum to 0.9592, so the expected depth of the opaque part is (0.1813 · 2 + 0.5175 · 3 + 0.2604 · 4)/0.9592 = 2.957/0.9592 ≈ 3.08: mostly the middle sample, pulled slightly towards the far one.

**3. Compute γ(p) for p = 0.1 with L = 3. Which pair of features changes fastest as p moves, and why does that help an MLP represent an edge?**

γ(0.1) = (sin 0.1π, cos 0.1π, sin 0.2π, cos 0.2π, sin 0.4π, cos 0.4π) = (0.309, 0.951, 0.588, 0.809, 0.951, 0.309). The last pair, with frequency 2²π = 4π, changes fastest: its derivative can be 4π ≈ 12.6 per unit of p, four times that of the first pair. A small step in p therefore moves the encoded point a long way, so a smooth, low-frequency function of γ(p), which is what an MLP learns first, can still jump sharply across an edge in p.

**4. A NeRF renders held-out images with an MSE of 0.004. What is its PSNR, and how many decibels would halving the RMS error add? Explain why a sample with Tᵢ = 0.01 behind a wall barely changes during training.**

PSNR = −10 log₁₀ 0.004 ≈ 23.98 dB. Halving the RMS error divides the MSE by 4, adding 10 log₁₀ 4 ≈ 6.02 dB, to about 30 dB. The rendered colour depends on that sample only through its weight wᵢ = Tᵢαᵢ ≤ 0.01, so ∂Ĉ/∂cᵢ ≤ 0.01, and the gradients for its density are scaled by Tᵢ as well. A sample hidden behind a wall changes almost nothing in the image, so the loss hardly pushes it: occluded space is learned slowly, if at all.

## Lesson 65 - Cross-attention, positional encodings and set prediction

**1. Compute IoU, the enclosing area and GIoU for A = [0, 0, 2, 2] and B = [4, 1, 6, 3]. Then move B to [3, 1, 5, 3]. Which position has the higher GIoU, and why does that help training?**

A spans x 0 to 2 and B spans x 4 to 6, so they do not overlap: IoU = 0 and the union is 4 + 4 = 8. The enclosing box is [0, 0, 6, 3], area 6 × 3 = 18, so GIoU = 0 − (18 − 8)/18 = −0.556. For B = [3, 1, 5, 3] the enclosing box is [0, 0, 5, 3], area 15, so GIoU = 0 − 7/15 = −0.467. The closer box has the higher GIoU, so the loss 1 − GIoU falls from 1.556 to 1.467 as B moves towards A. Plain IoU is 0 at both positions, so 1 − IoU gives no gradient there; GIoU does.

**2. A DETR-style decoder has 100 object queries and attends to the stride-32 features of an 800 × 1216 image. How many image tokens are there, how many entries does one head's cross-attention matrix have, and how many output rows? Compare with self-attention among the image tokens.**

The feature map is 800/32 = 25 by 1216/32 = 38, so there are 25 × 38 = 950 image tokens. The cross-attention matrix has one row per query and one column per image token: 100 × 950 = 95,000 entries per head. The output has 100 rows, one per query, whatever the image size. Self-attention among the image tokens would need 950² = 902,500 scores per head, about 9.5 times more.

**3. With D = 4 and ω = (1, 0.01), compute PE(2) and the dot product PE(2)·PE(5). Explain why PE(12)·PE(15) gives the same value.**

PE(2) = (sin 2, cos 2, sin 0.02, cos 0.02) = (0.909, −0.416, 0.020, 1.000). Each frequency contributes sin(ωp)sin(ωp′) + cos(ωp)cos(ωp′) = cos(ω(p − p′)), so PE(2)·PE(5) = cos(−3) + cos(−0.03) = −0.98999 + 0.99955 = 0.0096. The dot product depends only on the offset p − p′ = −3, so PE(12)·PE(15) gives the same 0.0096: moving both positions by 10 rotates every sine-cosine pair of both encodings by the same angle, which leaves their dot product unchanged.

**4. Targets T1, T2 and predictions P1, P2, P3 have the matching costs T1: (0.1, 0.3, 0.9) and T2: (0.2, 1.0, 0.8). Find the assignment with the smallest total, compare it with greedy matching, and say which prediction is trained towards ∅.**

With two targets and three predictions there are 3 × 2 = 6 assignments: (P1, P2) 0.1 + 1.0 = 1.1; (P1, P3) 0.1 + 0.8 = 0.9; (P2, P1) 0.3 + 0.2 = 0.5; (P2, P3) 0.3 + 0.8 = 1.1; (P3, P1) 0.9 + 0.2 = 1.1; (P3, P2) 0.9 + 1.0 = 1.9. The best is T1 → P2 and T2 → P1, total 0.5, which is what the Hungarian algorithm returns. Greedy matching takes the cheapest entry first, T1 → P1 (0.1), and must then give T2 its best remaining prediction, P3 (0.8), for a total of 0.9. In the optimal matching P3 is unmatched, so its target is ∅ and its loss −ln p̂₃(∅) pushes its no-object probability up.

## Lesson 66 - Latent-variable models: from EM to the variational autoencoder

**1. A mixture has π = (0.3, 0.7), means 0 and 2 and σ = 1. Compute the responsibilities and the log-likelihood of x = 0.5.**

The densities are N(0.5; 0, 1) = e^(−0.125)/√(2π) = 0.3521 and N(0.5; 2, 1) = e^(−1.125)/√(2π) = 0.1295. Weighted by π: 0.3 × 0.3521 = 0.1056 and 0.7 × 0.1295 = 0.0907, which sum to p(x) = 0.1963. The responsibilities are 0.1056/0.1963 = 0.538 and 0.0907/0.1963 = 0.462: the point is nearer the first mean, but the larger weight of the second component almost balances that. The log-likelihood is ln 0.1963 = −1.628.

**2. For the points (0, 1, 3, 4) with second-component responsibilities (0, 0.2, 0.8, 1), carry out the M-step for that component: N₂, μ₂, its variance and π₂.**

N₂ = 0 + 0.2 + 0.8 + 1 = 2. μ₂ = (0 × 0 + 0.2 × 1 + 0.8 × 3 + 1 × 4)/2 = (0.2 + 2.4 + 4)/2 = 3.3. The variance is (0 × 3.3² + 0.2 × 2.3² + 0.8 × 0.3² + 1 × 0.7²)/2 = (1.058 + 0.072 + 0.49)/2 = 0.81. π₂ = N₂/N = 2/4 = 0.5. By symmetry this mirrors the first component of the lesson, whose mean was 0.7.

**3. An encoder outputs μ = (0.5, −1) and σ = (1, 0.5) for a 2-D latent. Compute the KL divergence to N(0, I), dimension by dimension.**

Use ½(μ² + σ² − 1 − ln σ²) per dimension. Dimension 1: ½(0.25 + 1 − 1 − 0) = 0.125. Dimension 2: ½(1 + 0.25 − 1 − ln 0.25) = ½(0.25 + 1.386) = 0.818. The dimensions are independent under both distributions, so the KL divergences add: 0.125 + 0.818 = 0.943 nats. Only a code with μ = 0 and σ = 1 in every dimension costs nothing.

**4. For x = 1 in the lesson's mixture (π = (½, ½), means 0 and 4, σ = 1), compute the bound L(q) for q = (0.5, 0.5) and show that its gap to ln p(x) equals KL(q ‖ r).**

The joint terms are π₁N(1; 0, 1) = 0.5 × 0.2420 = 0.1210 and π₂N(1; 4, 1) = 0.5 × 0.00443 = 0.002216, so ln p(x) = ln 0.1232 = −2.094. With q = (0.5, 0.5): L(q) = 0.5 ln(0.1210/0.5) + 0.5 ln(0.002216/0.5) = 0.5(−1.419) + 0.5(−5.419) = −3.419. The gap is −2.094 − (−3.419) = 1.325. The responsibilities are r = (0.982, 0.018), and KL(q ‖ r) = 0.5 ln(0.5/0.982) + 0.5 ln(0.5/0.018) = 0.5(−0.675) + 0.5(3.325) = 1.325, the same number. The bound is tight only for q = r, which is why the E-step computes the responsibilities.

## Lesson 67 - Diffusion models: noising, denoising and sampling

**1. A schedule has β = (0.1, 0.2, 0.25). Compute ᾱ₃, the signal scale √ᾱ₃, the noise scale √(1 − ᾱ₃) and the SNR, then noise x₀ = 1.5 with ε = 0.4.**

ᾱ₃ = (1 − 0.1)(1 − 0.2)(1 − 0.25) = 0.9 × 0.8 × 0.75 = 0.54. Signal scale √0.54 = 0.735, noise scale √0.46 = 0.678, and SNR = 0.54/0.46 = 1.174, so signal and noise have similar power. x₃ = 0.735 × 1.5 + 0.678 × 0.4 = 1.102 + 0.271 = 1.374. The two scales satisfy 0.735² + 0.678² = 1, so unit-variance data keep unit variance.

**2. Data are x₀ ~ N(0, 4). At ᾱ = 0.2 and x_t = 1, compute E[x₀ | x_t], E[ε | x_t] and the score, and check that (x_t − √(1 − ᾱ) E[ε | x_t])/√ᾱ gives the same E[x₀ | x_t].**

Var(x_t) = ᾱs² + 1 − ᾱ = 0.2 × 4 + 0.8 = 1.6. E[x₀ | x_t] = √0.2 × 4 × 1/1.6 = 0.4472 × 2.5 = 1.118. E[ε | x_t] = √0.8 × 1/1.6 = 0.8944/1.6 = 0.559. The score is −x_t/Var(x_t) = −1/1.6 = −0.625, which also equals −E[ε | x_t]/√(1 − ᾱ) = −0.559/0.8944. Check: (1 − 0.8944 × 0.559)/0.4472 = (1 − 0.5)/0.4472 = 1.118. The estimate 1.118 lies between the prior mean 0 and x_t/√ᾱ = 2.236, which would only undo the shrinking of the signal: most of x_t is noise, so the best guess is pulled towards the average.

**3. Take one DDIM step from ᾱ_t = 0.36 to ᾱ_{t−1} = 0.64 with x_t = 0.2 and predicted noise 0.5.**

First estimate the clean value: x̂₀ = (x_t − √(1 − ᾱ_t) ε̂)/√ᾱ_t = (0.2 − 0.8 × 0.5)/0.6 = −0.333. Then re-noise it to the next level with the same predicted noise: x_{t−1} = √0.64 × (−0.333) + √0.36 × 0.5 = −0.267 + 0.3 = 0.033. No fresh noise is added, so the step is deterministic.

**4. With ε_∅ = (0.2, −0.1) and ε_c = (0.5, 0.3), compute the guided noise for w = 0, 1 and 3, and say what each setting means.**

ε̃ = ε_∅ + w(ε_c − ε_∅) with ε_c − ε_∅ = (0.3, 0.4). w = 0 gives (0.2, −0.1): the unconditional model, which ignores the prompt. w = 1 gives (0.5, 0.3): the plain conditional model. w = 3 gives (0.2 + 0.9, −0.1 + 1.2) = (1.1, 1.1): an extrapolation beyond the conditional prediction, which pushes samples harder towards what distinguishes the condition, at the cost of diversity.

## Lesson 68 - 3D Gaussian splatting

**1. With f = 200 px, W = I and Σ = diag(0.04, 0.01, 0.09), compute J and Σ′ for a Gaussian centred at (0.5, −0.2, 2.5).**

f/z = 200/2.5 = 80, −f x/z² = −200 × 0.5/6.25 = −16 and −f y/z² = −200 × (−0.2)/6.25 = 6.4, so J = [[80, 0, −16], [0, 80, 6.4]]. With a diagonal Σ, Σ′ᵢⱼ = Σₖ Jᵢₖ Jⱼₖ Σₖₖ: Σ′ₓₓ = 80² × 0.04 + 16² × 0.09 = 256 + 23.04 = 279.04; Σ′ᵧᵧ = 80² × 0.01 + 6.4² × 0.09 = 64 + 3.69 = 67.69; Σ′ₓᵧ = (−16)(6.4)(0.09) = −9.216. The splat has standard deviations of about 16.7 px and 8.2 px and is slightly tilted, because the depth extent is seen at an angle in both directions.

**2. In 2D, compute Σ = R(30°) diag(4, 1) R(30°)ᵀ and its determinant, and explain why it is a valid covariance for any angle.**

With c = cos 30° = 0.866 and s = sin 30° = 0.5: Σₓₓ = 4c² + 1·s² = 3 + 0.25 = 3.25, Σᵧᵧ = 4s² + c² = 1 + 0.75 = 1.75 and Σₓᵧ = (4 − 1)cs = 1.299. The determinant is 3.25 × 1.75 − 1.299² = 5.6875 − 1.6875 = 4 = 4 × 1, the product of the variances along the Gaussian's own axes, whatever the angle. For any vector v, vᵀRSSᵀRᵀv = ‖SᵀRᵀv‖² ≥ 0, so RSSᵀRᵀ is symmetric and never negative in any direction: always a valid covariance, which is why 3DGS optimises R and S instead of Σ.

**3. A splat has opacity 0.9 and Σ′ = diag(16, 4). Compute α at offsets (4, 0), (0, 4) and (4, 2) px from its centre.**

d² = dx²/16 + dy²/4. At (4, 0): d² = 1 and α = 0.9e^(−0.5) = 0.546. At (0, 4): d² = 4 and α = 0.9e^(−2) = 0.122. At (4, 2): d² = 1 + 1 = 2 and α = 0.9e^(−1) = 0.331. The splat is twice as wide horizontally (standard deviation 4 px against 2 px), so the same 4 px offset matters much less sideways than vertically.

**4. Composite three splats front to back: green with α = 0.4, then red with α = 0.5, then blue with α = 0.9. Give the colour and the remaining transmittance, then repeat in the reverse order.**

Front to back: green has transmittance 1 and weight 0.4; red has T = 0.6 and weight 0.6 × 0.5 = 0.3; blue has T = 0.6 × 0.5 = 0.3 and weight 0.3 × 0.9 = 0.27. Colour = 0.4·green + 0.3·red + 0.27·blue = (0.3, 0.4, 0.27), with 0.3 × 0.1 = 0.03 left for the background. In the reverse order: blue gets 0.9, red 0.1 × 0.5 = 0.05 and green 0.05 × 0.4 = 0.02, giving (0.05, 0.02, 0.9), almost pure blue. The remaining transmittance is 0.03 in both orders, because a product does not depend on its order, but the colour changes completely: the splats must be sorted by depth.

