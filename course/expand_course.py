"""Author the continuation without overwriting foundations or learner progress."""
from pathlib import Path
import json, re

BASE = Path(__file__).resolve().parent
lessons = []

def add(n, title, reading, goal, body, practice, solutions, checkpoint, lab):
    assert len(practice) == len(solutions) == 4
    module = (n - 1) // 4 + 1
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    name = f'{n:02d}-{slug}.md'
    previous = f'Lesson {n-1:02d}; revisit any symbols you cannot yet explain.'
    text = f'''# Lesson {n:02d} - {title}

**Module:** {module:02d} | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** {previous}

**Goal:** {goal}

{body.strip()}

## Practice before opening the answers

''' + '\n'.join(f'{i+1}. {q}' for i,q in enumerate(practice)) + f'''

## Check your understanding

{checkpoint}

## Read with a purpose

{reading} Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
'''
    (BASE/'lessons'/name).write_text(text, encoding='utf-8')
    lessons.append(dict(id=n, module=module, title=title, file='lessons/'+name,
                        reading=reading, goal=goal, exercises=practice, solutions=solutions,
                        checkpoint=checkpoint, lab=lab, minutes=90))

add(5, 'Vectors as positions, displacements and features', 'MML 2.4 and 3.1; CS205A 0.2.',
    'Separate a geometric position from a feature vector, and calculate vector operations with units in mind.', '''
## A list with a meaning

A vector is an ordered collection of coordinates. In a chosen coordinate system, p=(2,3) can locate a point. The displacement from p to q=(5,1) is q-p=(3,-2): move three units right and two down. A displacement tells us how to move, while a position depends on where we chose the origin. Image row coordinates usually increase downward, so always write your convention.

A feature vector instead might contain [mean brightness, edge count]. Its entries are measurements, not necessarily spatial coordinates. Flattening a 2x2 image [[20,60],[100,140]] in row order gives x=[20,60,100,140]. The order is part of the representation: changing it changes the meaning of each model weight.

## Work a vector calculation

For u=(1,2) and v=(3,-1), addition gives (4,1), and 2u-v=(-1,5). Scaling every coordinate by the same number gives scalar multiplication. A linear combination a*u+b*v is formed from scaling and addition. With a=2,b=1, it is (5,3). Each result has the same coordinate dimension as its inputs.

Write vectors as columns for mathematical maps: x has shape (D,1), and A*x has shape (H,1). In NumPy, a one-dimensional array of shape (D,) is neither a row nor a column matrix. x.reshape(D,1) makes the column convention explicit. Later notebooks use batches with samples in rows; both conventions work when declared consistently.

## Why the representation matters

For features [brightness, width], adding raw entries together is meaningless unless a model gives their units and scales a sensible interpretation. A Euclidean distance can be dominated by the larger numerical scale. Fit any normalization statistics on training data, then reuse them for new inputs. A change of representation changes the geometry seen by the classifier.

Two images may have identical means while their flattened vectors differ. Reducing an image to its mean loses arrangement information; a feature is a chosen summary, not the original object.
''', ['Find the displacement from (1,4) to (4,2).', 'For u=(2,-1), v=(1,3), calculate 3u-2v.', 'Flatten [[1,2],[3,4]] in row order and state its vector dimension.', 'Why might raw distance between [brightness, width] be misleading?'],
    ['Subtract start from end: (4-1,2-4)=(3,-2).', '3u=(6,-3), 2v=(2,6), so the result is (4,-9).', 'The vector is [1,2,3,4], with four coordinates. A column representation has shape (4,1).', 'Different units and numerical scales can make one coordinate dominate. Fit scaling using training data, or choose a justified metric.'],
    'Explain what every coordinate of a toy image feature means. Give a position, a displacement, and a feature vector without confusing their roles.', 'vectors')

add(6, 'Norms, dot products, angles and projections', 'MML 3.1-3.5 and 3.8; CS205A 0.2.',
    'Derive length, similarity and orthogonal projection from coordinate calculations.', '''
## Length and similarity

The Euclidean norm is ||x||₂=sqrt(sum x_i²). It extends the right-triangle length formula. For x=(3,4), the norm is 5; dividing by 5 produces a unit vector (0.6,0.8). The L1 norm is sum |x_i|, which is 7 here. A distance between x and y is the norm of x-y, so state which norm you use.

The dot product u·v=sum u_i*v_i also equals ||u||₂||v||₂*cos(theta). A positive result indicates an acute angle for nonzero vectors; a negative result indicates an obtuse angle. For u=(1,2), v=(3,-1), u·v=3-2=1, with lengths sqrt(5) and sqrt(10). The cosine is 1/sqrt(50), about 0.1414. Dot product alone combines alignment and magnitude; cosine similarity removes magnitude.

## Derive a projection

Approximate x by a multiple c*u. Orthogonal projection requires the residual x-c*u to be perpendicular to u. Thus u·(x-c*u)=0, giving c=(u·x)/(u·u), when u is nonzero.

For x=(3,4), u=(1,1), c=7/2. The projection is (3.5,3.5), and the residual is (-0.5,0.5). Their dot product with u is zero. The original vector equals its projection plus its residual. This is the geometric idea behind least squares in Module 3.

## A feature-matching interpretation

If a feature vector is multiplied by a positive brightness factor, its cosine similarity to another nonzero vector is unchanged, while raw dot products and Euclidean distances can change. This can help when overall intensity is a nuisance. It can also discard useful magnitude information, so choose the representation deliberately.

The zero vector has no direction. Its cosine similarity and the formula that normalizes it are undefined. A software epsilon prevents division errors but does not give zero a mathematical angle. Projection onto a non-unit vector needs the denominator u·u; omitting it changes the answer.
''', ['Find the L1 and L2 norms of (-3,4).', 'Compute the cosine similarity of (1,0) and (1,1).', 'Project (2,3) onto u=(1,0), and give the residual.', 'Can the zero vector be normalized to a unit vector? Explain.'],
    ['L1=3+4=7; L2=sqrt(9+16)=5.', 'The dot product is 1 and the norm product is sqrt(2), so cosine=1/sqrt(2).', 'c=2, projection=(2,0), residual=(0,3). Its dot product with u is zero.', 'No. Dividing by its norm divides by zero; it has no defined direction.'],
    'Derive the projection coefficient from residual orthogonality, then explain when cosine similarity loses information a classifier might need.', 'vectors')

add(7, 'Matrices as maps and composition', 'MML 2.2 and 2.6-2.7; CS205A 0.3.',
    'Interpret matrix columns geometrically and track dimensions through a linear layer.', '''
## A matrix describes where basis directions go

Let A=[[2,1],[0,1]] and x=(1,2) as a column vector. Multiplication gives Ax=(4,2). Another way to read this is x₁ times the first column plus x₂ times the second column: (2,0)+2*(1,1). Matrix columns are the images of the standard basis vectors e₁=(1,0) and e₂=(0,1).

A linear map satisfies A(u+v)=Au+Av and A(cu)=cAu. It sends zero to zero. Translation x→x+b generally fails that last property, so a neural layer Wx+b is an affine map. The bias allows a shift after the linear transformation.

## Composition is multiplication in the right order

If x first goes through A, then B, the result is B(Ax)=(BA)x. Let A=diag(2,1) and B=[[0,-1],[1,0]], a 90-degree counterclockwise rotation in Cartesian coordinates. Starting at x=(1,1), BAx=(-1,2). Reversing gives ABx=(-2,1). Rotation and unequal scaling do not commute.

For A of shape (H,D) and x of shape (D,1), output Ax has shape (H,1). If B has shape (C,H), BA has shape (C,D). The inner dimensions must match; outer dimensions describe the result. A transpose swaps rows and columns, and (BA)ᵀ=AᵀBᵀ.

## Use the batch convention carefully

For row-stored samples X of shape (N,D), use W of shape (D,H) and compute Z=XW+b, with b of shape (H,). Each row is one feature vector and each column of W selects one output feature. This convention is the transpose of applying a mathematical column map to each sample.

NumPy X*W performs elementwise multiplication with broadcasting where possible. X@W performs a matrix product. Broadcasting may produce a legal array whose meaning is wrong; write intended shapes before running code. Matrix multiplication is a weighted mixing of coordinates, not simply multiplying matching entries.
''', ['Apply [[2,0],[0,3]] to the column vector (1,-2).', 'If X=(16,64) and W=(64,10), give the output and bias shapes.', 'For A=(3,2) and B=(4,3), which product is defined and what is its shape?', 'Is f(x)=2x+1 a linear map? Justify with f(0).'],
    ['The result is (2,-6).', 'XW has shape (16,10); a bias of shape (10,) broadcasts across samples.', 'BA is defined, with shape (4,2). AB is undefined because 2 and 4 do not match.', 'It is affine. f(0)=1, whereas a linear map must send zero to zero.'],
    'Explain a matrix product using its columns, then annotate every shape in a batch affine layer without executing code.', 'linear')

add(8, 'Independence, bases, rank and null spaces', 'MML 2.4-2.6; CS205A 0.2-0.3.',
    'Connect independent directions and rank to information preserved or discarded.', '''
## How many distinct directions do we have?

Vectors are linearly independent if the only coefficients giving a zero linear combination are all zero. The vectors (1,0) and (0,1) are independent. The vectors (1,2) and (2,4) are dependent because 2*(1,2)-(2,4)=0. Two entries do not automatically give two independent directions.

The span of some vectors is every linear combination of them. A basis is an independent set spanning the space of interest. In the standard basis, (3,4)=3e₁+4e₂. In the basis u=(1,1), v=(1,-1), the same vector is 3.5u-0.5v. Coordinates depend on the chosen basis, while the represented vector stays the same.

## Rank tells us how much a map can express

For B=[[1,1],[2,2]], both columns lie on the same line, so its rank is 1. It maps x=(a,b) to (a+b,2a+2b). The outputs (2,4) and (3,6) are possible, but (2,3) is not. The column space is the set of attainable outputs.

The null space contains inputs sent to zero. Here B(1,-1)=0, and every multiple of (1,-1) is also invisible to B. Inputs (1,0) and (0,1) both map to (1,2). More generally, Bx=B(x+n) whenever n is in the null space. Thus a nontrivial null space means distinct inputs cannot always be recovered from outputs.

For a map with D input coordinates, rank + null-space dimension = D. This is rank-nullity. A square matrix has an inverse exactly when it has full rank. A rectangular dimension reduction from D to H<D must have a null space, although it may retain all information useful for a particular task.

## A vision consequence

Summing all image pixels is a rank-1 linear map from a high-dimensional image vector to one number. It loses all changes that sum to zero. Features can intentionally remove nuisance variation, but a low-dimensional feature cannot preserve every possible image distinction. Rank describes linear information, not recognition accuracy by itself.
''', ['Are (1,2) and (3,6) independent? Give a relation.', 'Find the rank and a null vector of [[1,1],[2,2]].', 'A linear map has 5 inputs and rank 3. What is its null-space dimension?', 'Why can a 2x4 map never have an inverse recovering every four-coordinate input?'],
    ['They are dependent: 3*(1,2)-(3,6)=0.', 'Rank=1; (1,-1) is a nonzero null vector.', 'Rank-nullity gives 5-3=2.', 'Its rank is at most 2, so its null-space dimension is at least 2. Different inputs share outputs.'],
    'Construct two different inputs with the same output under a rank-deficient map. Explain precisely what prevents recovery.', 'linear')

add(9, 'Exact, inconsistent and underdetermined systems', 'MML 2.1-2.3; CS205A Chapter 2.',
    'Decide whether a measurement system has zero, one or many solutions.', '''
## A system is a set of simultaneous constraints

The equations x+y=3 and x-y=1 can be written Ax=b with A=[[1,1],[1,-1]] and b=(3,1). Add the equations to obtain 2x=4; hence x=2 and y=1. Both constraints must hold at once. Row operations preserve the solution set when applied to both A and b.

An inconsistent system has no exact solution. For x+y=3 and 2x+2y=7, doubling the first left-hand side gives the second, but doubling the first right-hand side gives 6 rather than 7. Elimination exposes the impossible equation 0=1. Measurement noise often creates such inconsistencies in real fitting problems.

An underdetermined example is x+y=3 by itself. Write x=t, y=3-t. There are infinitely many solutions because one free parameter remains. Underdetermined means fewer equations than unknowns; it does not guarantee consistency. Overdetermined means more equations than unknowns and can still be exactly consistent.

## Use spaces to unify these cases

Ax=b is consistent exactly when b belongs to the column space of A. If x₀ is one solution, every other solution is x₀+n for n in the null space, because A(x₀+n)=b. A consistent system has a unique solution when its null space is trivial. Full column rank provides that uniqueness; it does not guarantee every b is attainable in an overdetermined system.

## From equations to vision measurements

Fitting a straight line y=a*t+c uses rows [t,1] in A and observed y values in b. With two distinct t values, there is a unique interpolating line. With many noisy measurements, exact intersection may disappear. The next lesson replaces exact equality with a principled residual minimization.

Keep the unknown parameter vector separate from observed inputs. A row of A describes how one observation depends on the parameters. Before using a solver, specify A, b, parameter units and the expected output shape. If a system has many solutions, a numerical solver needs a selection rule; one output is not proof of uniqueness.
''', ['Solve x+y=5 and x-y=1.', 'Are x+2y=3 and 2x+4y=8 consistent?', 'Describe all solutions of x-y=2.', 'Write the design matrix for fitting y=a*t+c at t=0,1,2.'],
    ['Adding gives x=3; substituting gives y=2.', 'No. Doubling the first equation requires right-hand side 6, but the second requires 8.', 'Let y=t freely; then x=t+2, so (x,y)=(t+2,t).', 'A=[[0,1],[1,1],[2,1]] and the unknown column is (a,c). The observed y values form b.'],
    'Classify one system of each kind and justify it using column space and null space, rather than only counting equations.', 'fitting')

add(10, 'Least squares as projection', 'MML 3.8 and 9.1-9.2; CS205A Chapters 3-4.',
    'Derive residual orthogonality and fit a line to inconsistent observations.', '''
## Replace exact equality with a measurable error

Given A and observations b, choose parameters theta minimizing ||A*theta-b||₂². The residual r=A*theta-b measures how the fitted observations differ from the measured ones. Squaring makes positive and negative errors contribute positively. Least squares treats large residuals strongly and can be sensitive to outliers.

## Derive the projection condition

Suppose changing theta along direction d changes predictions along Ad. At the best fit, the residual has no component that such a prediction change could cancel: r must be orthogonal to every column of A. This gives Aᵀr=0, hence AᵀA*theta=Aᵀb, the normal equations. In Module 5 we also derive this by differentiation.

The fitted vector A*theta is the orthogonal projection of b onto the column space. If A has full column rank, the coefficient vector is unique. With dependent columns, fitted predictions remain unique but multiple coefficients may produce them. Least squares does not promise the true generating parameters; it finds the best fit under the chosen criterion.

## Work a noisy line fit

For t=[0,1,2] and b=[1,2,2], choose A=[[0,1],[1,1],[2,1]] and theta=(a,c). The normal-equation terms are AᵀA=[[5,3],[3,3]] and Aᵀb=(6,5). Solving gives a=1/2, c=7/6. Predictions are (7/6,5/3,13/6), so r=(1/6,-1/3,1/6).

The residual sum is zero because the constant column is in A. Its dot product with the t column is -1/3+2*(1/6)=0. Squared residuals sum to 1/6; MSE divides that by three to obtain 1/18. These are different loss normalizations with the same minimizer.

## Compute the fit stably

The normal equations explain the optimum, but forming AᵀA can worsen conditioning. Use np.linalg.lstsq(A,b,rcond=None) in the notebook. Never assume an inverse exists merely because the formula fits on a line. Draw the observations, predictions and residuals: a small average residual can hide large opposite errors.
''', ['Fit a constant c to observations [1,2,6] by least squares.', 'For the worked line fit, calculate the residual sum and sum of squared residuals.', 'Why is b-A*theta orthogonal to the column space at an optimum?', 'Does a residual sum of zero imply every observation is fit exactly?'],
    ['The projection onto the constant column gives c=(1+2+6)/3=3.', 'Sum=0; squared sum=1/36+1/9+1/36=1/6.', 'Otherwise a move within that space could remove a component of the error and reduce its squared length.', 'No. Residuals [-1,1] sum to zero while squared error is 2.'],
    'Set up an unseen line fit, identify the column space, and verify the residual is orthogonal to its columns.', 'fitting')

add(11, 'QR, pseudoinverses and numerical conditioning', 'MML 4.5 and 9.2; CS205A 3.3, 4.3-4.5 and 6.2.1.',
    'Understand why mathematically valid formulas can be numerically unreliable.', '''
## A stable decomposition changes how we solve

For a tall full-column-rank A, a thin QR decomposition gives A=QR. Q has orthonormal columns, QᵀQ=I; R is square and upper triangular. Least squares reduces to solving R*theta=Qᵀb by back substitution. The remaining component of b perpendicular to Q cannot be fit. We avoid explicitly constructing an inverse.

For A=[[1,0],[0,1],[1,1]], the first column has length sqrt(2), so q₁=(1,0,1)/sqrt(2). Remove its component from the second column, then normalize what remains. This Gram-Schmidt picture explains QR; practical robust QR solvers usually use transformations such as Householder reflections rather than naive repeated subtraction.

## Sensitivity is a property of the problem

Consider A=diag(1,0.001). With b=(1,0.001), the exact solution is (1,1). Change the second measurement by 0.0001 and its solution becomes 1.1. The small singular direction amplifies measurement errors. The 2-norm condition number is largest singular value divided by smallest: here 1000. A high condition number indicates potential sensitivity, not that every particular perturbation will be disastrous.

Forming AᵀA squares the 2-norm condition number for full-column-rank A. Here it becomes one million. Floating-point arithmetic has finite precision; avoid making a sensitive problem even more sensitive through the solving method. Feature scaling can improve numerical behavior, though it also changes how penalties are interpreted.

## What if the system is singular?

An SVD-based pseudoinverse selects the minimum-Euclidean-norm least-squares solution. For x₁+x₂=2, the smallest-norm exact solution is (1,1). Other solutions such as (0,2) have the same fit but a larger squared norm. Tiny singular values may be treated as zero using a tolerance, so reported rank is a numerical decision as well as a mathematical concept.

Use a library solver and inspect its residuals, rank and singular values. A successful return means a computation finished; it does not establish that recovered parameters are reliable under small input changes.
''', ['Solve R*theta=(5,3) for R=[[2,1],[0,3]].', 'Find the condition number of diag(4,0.5).', 'Find the minimum-norm solution of x₁+x₂=6.', 'Why prefer lstsq over explicitly inverting AᵀA?'],
    ['Back substitute: theta₂=1; 2theta₁+1=5 gives theta₁=2.', 'The singular values are 4 and 0.5, so the condition number is 8.', 'By symmetry or minimizing t²+(6-t)², the solution is (3,3).', 'A solver handles rank and stability using appropriate decompositions; normal equations can square conditioning, and explicit inversion is unnecessary.'],
    'Distinguish problem sensitivity from solver error, and explain what a minimum-norm solution adds to least-squares fitting.', 'fitting')

add(12, 'Regularization and the cost of overfitting', 'MML 9.2 and 8.6; CS205A Chapter 4.',
    'Understand how a penalty trades fitting error against coefficient magnitude.', '''
## Exact fitting can be a poor prediction strategy

A flexible model may follow measurement noise and fit training observations closely while making poor predictions elsewhere. Regularization adds a preference for certain parameters. Ridge regression minimizes ||A*theta-b||₂²+lambda*||theta||₂², with lambda≥0. A larger lambda increases the cost of large coefficients; it changes the optimization problem rather than merely improving the arithmetic of the original one.

## Derive the adjusted system

The least-squares derivative is 2Aᵀ(A*theta-b). The penalty derivative is 2lambda*theta. Setting their sum to zero gives (AᵀA+lambda*I)*theta=Aᵀb. For lambda>0 this matrix is positive definite, even when columns of A are dependent. We still solve a system rather than explicitly taking its inverse.

In one dimension with A=[1] and b=[2], minimize (theta-2)²+lambda*theta². The optimum is theta=2/(1+lambda). At lambda=0 the fit is 2; at lambda=1 it is 1. The residual grows, but the coefficient shrinks. Adding a penalty changes both the answer and the assumptions behind it.

## Scaling and bias require a decision

If one input feature is multiplied by 100, its coefficient can be divided by 100 to preserve predictions. Its squared penalty then changes, so ridge is sensitive to feature scale. Standardize using training statistics before interpreting equal coordinate penalties. It is common to leave the intercept unpenalized; then the penalty matrix has a zero in that coordinate, rather than being the full identity.

## Select lambda using validation evidence

Try a small declared set of lambda values using training fits and validation error. Choose using validation, then evaluate the held-out test set once the procedure is fixed. Training error alone usually favors weaker penalties. Neither an improved validation result nor a small coefficient proves that a model has learned causal structure.

Compare a line and a high-degree polynomial on a few noisy points. Ask where the fitted curves disagree away from observed inputs. This exposes how coefficient choices interact with the representation. Later, a Gaussian prior will give a statistical interpretation of a squared penalty.
''', ['For the scalar example, find theta when lambda=3.', 'At lambda=1, compute the residual loss and penalty separately.', 'Why can input rescaling change a ridge fit?', 'Which split should choose lambda, and which split reports final performance?'],
    ['theta=2/(1+3)=0.5.', 'theta=1; residual loss=(1-2)²=1 and penalty=1²=1, totaling 2.', 'Equivalent prediction coefficients have different magnitudes after rescaling, so the parameter penalty changes.', 'Use validation to choose lambda. Keep test data for final evaluation after model selection.'],
    'Explain why regularization may deliberately worsen training fit while improving predictions, and design a comparison that avoids test-set tuning.', 'fitting')

add(13, 'Eigenvectors and repeated transformations', 'MML 4.2; CS205A Chapter 5.',
    'Identify invariant directions and predict repeated application of a square map.', '''
## A direction that does not turn

For a square matrix A, a nonzero v satisfying Av=lambda*v is an eigenvector, and lambda is its eigenvalue. The map may stretch, shrink or reverse this direction, but it remains on the same line. Zero is excluded as an eigenvector because it satisfies the equation for every lambda and identifies no direction.

For A=diag(3,1), e₁ has eigenvalue 3 and e₂ has eigenvalue 1. Starting from x=(2,1), one application gives (6,1), and three applications give (54,1). If x=a*v₁+b*v₂ in an eigenbasis, A^k*x=a*lambda₁^k*v₁+b*lambda₂^k*v₂. Repetition reveals which magnitudes grow or vanish.

## Find eigenvalues in a small example

Let A=[[2,1],[1,2]]. The eigenvalue equation requires det(A-lambda*I)=0. Here (2-lambda)²-1=0, so lambda=3 or 1. For lambda=3, v=(1,1) works; for lambda=1, v=(1,-1) works. These directions are perpendicular because this A is real symmetric. Normalize them if an orthonormal basis is needed.

Not every real square matrix has a real eigenbasis. A 90-degree rotation has no nonzero real vector that stays on the same line; its eigenvalues are complex. A repeated eigenvalue also does not guarantee enough independent eigenvectors. Symmetric real matrices are especially useful because they have an orthonormal eigenbasis and real eigenvalues.

## Why vision and optimization use this

A covariance matrix is symmetric and positive semidefinite. Its eigenvectors identify directions of feature variation; eigenvalues describe variance along those directions. A quadratic loss has a symmetric curvature matrix whose eigenvalues describe how steep different directions are. We will connect both to practical calculations.

Eigenvalues can be negative: A=diag(-2,1) reverses and doubles its first direction. Singular values, studied next, are always nonnegative and apply to rectangular maps too. Do not treat these two sets of numbers as interchangeable for arbitrary matrices.
''', ['Find eigenvalues and standard eigenvectors of diag(2,-1).', 'Apply diag(2,-1) three times to (1,2).', 'Verify that (1,-1) is an eigenvector of [[2,1],[1,2]].', 'Why is the zero vector excluded from the eigenvector definition?'],
    ['Eigenvalue 2 with (1,0); eigenvalue -1 with (0,1).', 'The result is (2³*1,(-1)³*2)=(8,-2).', 'The product is (1,-1), so its eigenvalue is 1.', 'It satisfies Av=lambda*v for every lambda and carries no invariant direction.'],
    'Predict repeated transformation along independent eigendirections and explain the conditions needed to use an eigenbasis.', 'spectrum')

add(14, 'SVD and low-rank structure', 'MML 4.4-4.6; CS205A Chapter 6.',
    'Read a rectangular map as orthogonal directions with nonnegative stretch factors.', '''
## A decomposition that works for rectangular maps

An SVD writes A=U*Sigma*Vᵀ. The columns of V are orthonormal input directions, Sigma supplies nonnegative singular values, and U gives orthonormal output directions. In geometry: change input coordinates, stretch along perpendicular directions, then express the result in output coordinates. Orthogonal factors can include reflections as well as rotations.

For A of shape (m,n), a reduced SVD has U=(m,q), Sigma=(q,q), Vᵀ=(q,n), where q=min(m,n). The number of strictly positive singular values is the rank. In numerical work, a tolerance decides what counts as positive. Singular values are the square roots of eigenvalues of AᵀA, but directly computing an SVD usually avoids forming that squared-condition matrix.

## Compression by keeping dominant terms

Write A as the sum sigma_i*u_i*v_iᵀ. The truncated approximation A_k keeps the k largest terms. For A=diag(5,2,1), rank-1 truncation gives diag(5,0,0). Its squared Frobenius error is 2²+1²=5. In general, the discarded squared singular values sum to the best achievable squared Frobenius error among rank-at-most-k matrices.

The Frobenius norm squares and sums every matrix entry. It measures reconstruction error without knowing whether the missing detail is important for recognition. Keeping a large singular direction can preserve a background gradient while removing a small but diagnostic object.

## A storage calculation

An m-by-n grayscale image uses mn numbers. A reduced rank-k representation uses approximately k(m+n+1): k input directions, k output directions and k singular values. For a 100x80 image and k=10, that is 1810 numbers rather than 8000. For large k this representation can exceed the original storage; it is not automatically a file-compression format.

## Inversion and sensitivity

The pseudoinverse reverses each nonzero singular stretch using 1/sigma_i. Tiny singular values amplify errors dramatically. Truncating them is a form of regularization: it stabilizes recovery by discarding directions. The choice can remove signal as well as noise, so inspect reconstruction and downstream behavior.
''', ['For singular values [6,3,2], find squared rank-1 reconstruction error.', 'Give reduced-SVD shapes for a 5x3 matrix.', 'How many numbers store a rank-4 approximation of a 20x30 matrix?', 'Does smallest reconstruction error guarantee best recognition accuracy?'],
    ['Discard 3 and 2: 3²+2²=13.', 'q=3: U=(5,3), Sigma=(3,3), Vᵀ=(3,3).', '4*(20+30+1)=204 versus 600 original entries, ignoring metadata.', 'No. Reconstruction error treats all entries geometrically; task-relevant details may lie in small singular directions.'],
    'Draw the three stages of an SVD and calculate the reconstruction error from discarded singular values.', 'spectrum')

add(15, 'PCA, centering and covariance', 'MML 10.1-10.4 and 10.6; CS205A Chapters 5-6.',
    'Derive the direction of maximum centered variance and distinguish PCA from SVD of one image.', '''
## Find how a collection varies

Let X have one sample per row, with shape (N,D). Compute the training mean mu=(1/N)*sum x_i and centered data Xc=X-mu. Sample covariance is C=XcᵀXc/(N-1), when N>1. Some objectives use division by N instead; this changes eigenvalues but not directions. State your convention.

PCA chooses a unit direction v maximizing variance of projections Xc*v. That variance is vᵀCv. Under ||v||=1, the maximum occurs at an eigenvector of C with its largest eigenvalue. Further components are perpendicular directions with the next largest variances. Thus PCA is an unsupervised representation: labels do not enter this calculation.

## Work an exact example

Samples (1,1), (2,2), (3,3) have mean (2,2). Centered rows are (-1,-1), (0,0), (1,1). Their sample covariance is [[1,1],[1,1]]. The first principal direction is (1,1)/sqrt(2), with eigenvalue 2; the perpendicular direction has eigenvalue 0.

Projection scores are -sqrt(2),0,sqrt(2). Reconstructing each score as score*v+mu recovers the three samples exactly with one coordinate because their centered data lie on a line. Without adding mu back, the reconstruction has the wrong location.

## Connect PCA and SVD

If Xc=U*Sigma*Vᵀ, principal directions are columns of V. Corresponding sample-covariance eigenvalues are sigma_i²/(N-1). Image SVD instead factors a single pixel matrix, treating rows and columns as its two axes. PCA over many flattened images studies how sample feature coordinates co-vary. These are related decompositions applied to different objects.

## Choose what variation means

Features with large units can dominate covariance, so standardized PCA may differ from raw PCA. Decide whether magnitude differences are meaningful. High variance is not necessarily discrimination: brightness variation can exceed the variation separating two classes. Evaluate recognition with a properly split dataset rather than using retained variance as a proxy for accuracy.
''', ['Center the samples (0,2) and (2,4).', 'Find the sample covariance of those two samples.', 'For covariance eigenvalues [4,1,0], what fraction of total variance does the first component retain?', 'Why is PCA not a supervised classifier?'],
    ['Mean=(1,3); centered samples are (-1,-1) and (1,1).', 'N-1=1, so covariance is [[2,2],[2,2]].', '4/(4+1+0)=0.8, or 80%.', 'Its directions depend on input variation without using class labels; prediction requires an additional rule or model.'],
    'Calculate one-dimensional PCA for points on a line, restore the mean during reconstruction, and explain what object each SVD factorizes.', 'spectrum')

add(16, 'Reconstruction error and data leakage', 'MML 10.4 and 10.6; CV 5.2.3.',
    'Evaluate compression and build preprocessing that does not learn from held-out observations.', '''
## A transform has learned parameters too

PCA learns a mean and directions from data. Standardization learns means and scales. A feature selector learns which coordinates to retain. Even when labels are absent, fitting these on validation or test examples lets held-out information influence the model. A clean evaluation treats preprocessing as part of the fitted pipeline.

Fit mu and V_k using training samples. Transform every split with Z=(X-mu)*V_k. Reconstruct with Xhat=Z*V_kᵀ+mu. New samples must use the original training mean and directions. Re-centering each new batch separately changes its representation and can make predictions depend on who else is in that batch.

## Measure reconstruction with a declared convention

For Xc, squared Frobenius reconstruction error after keeping k principal directions is the sum of discarded sigma_i². If you report MSE per entry, divide by N*D. If you report mean squared error per sample vector, divide by N. These quantities have different units and values, even though they summarize the same residuals.

Suppose a 4x3 centered dataset has discarded singular values 2 and 1. Squared total error is 5, mean squared vector error is 5/4, and entrywise MSE is 5/12. Explain the denominator before comparing numbers from two reports.

## Compare a downstream baseline

A nearest-centroid classifier computes each class centroid from training features, then assigns a new feature to the closest centroid. Choose PCA component count using validation performance. After fixing that choice, evaluate once on test. A higher component count can reduce reconstruction error while failing to improve classification.

Near-duplicate images and frames from the same video can leak across a random split. Group related observations by subject, sequence or source when the deployment question requires independence. Training and evaluation need to reflect the intended future use, not only a convenient array shuffle.

## Your module artifact

In the linear-algebra notebook, compare raw and PCA features using the same split and metric. Record retained dimensions, error normalization, training-only preprocessing and a failure example. Then compress one image at several ranks. Distinguish this single-image experiment from the classifier's learned dataset transform.
''', ['If discarded singular values are [3,1], find squared Frobenius error.', 'For N=5,D=2, turn that error into entrywise MSE.', 'Should validation samples get their own fitted PCA basis?', 'Name a reason frame-level random splitting can overestimate future performance.'],
    ['3²+1²=10.', 'Divide by 5*2, giving MSE=1.', 'No. Apply the training-fitted mean and basis; otherwise feature coordinates differ and validation informs preprocessing.', 'Nearby frames can be almost duplicates. A model may recognize shared scenes rather than generalize to new sequences.'],
    'Write a preprocessing protocol and error denominator precisely enough that another learner can reproduce your comparison.', 'spectrum')

add(17, 'Derivatives and local linearity', 'MML 5.1; CS205A 0.4.1.',
    'Derive a derivative from a limit and use it as a local sensitivity.', '''
## From a finite change to an instantaneous rate

For f(x)=x², increasing x to x+h changes the output by 2xh+h². Dividing by h gives 2x+h for nonzero h. As h approaches zero, this difference quotient approaches 2x. The derivative f′(x)=2x is the limiting rate, not simply a remembered exponent rule.

At x=3, f(3)=9 and f′(3)=6. A small change delta gives the approximation f(3+delta)≈9+6delta. At delta=0.1 the prediction is 9.6, while the exact value is 9.61. The error is delta²=0.01. A derivative is local: using the same line for a large change can be inaccurate.

## Build a small derivative toolkit

Constants have derivative zero; ax+b has derivative a. The power rule gives d(x^n)/dx=n*x^(n-1) where the expression is differentiable. The derivative of exp(x) is exp(x); that of ln(x) is 1/x for x>0. A sum differentiates term by term. For a product, (fg)′=f′g+fg′. For a composition, (f(g(x)))′=f′(g(x))*g′(x).

For L(w)=(2w-1)², first name the inner quantity u=2w-1. The derivative is 2u*2=4(2w-1). At w=0, it is -4: a small positive change in w initially reduces the loss. The sign indicates local direction and its magnitude indicates sensitivity in the chosen units.

## What about kinks?

ReLU(x)=max(0,x) has derivative 0 for x<0 and 1 for x>0. At zero its two one-sided slopes disagree, so an ordinary derivative does not exist. Training code chooses a convention, often zero, for that point. A gradient check that crosses such a kink may fail even when the implementation follows its declared convention.

Gradients tell us local sensitivity, not the answer to a whole optimization problem. A zero derivative can occur at a minimum, maximum or another stationary point. Later curvature and optimization lessons will distinguish these cases. Keep units in mind: a derivative measures output units per input unit.
''', ['Derive the difference quotient for f(x)=x² at a general x.', 'Find the derivative of 3x²+2x-5 at x=2.', 'Use a first-order approximation for (4.01)² around x=4.', 'Differentiate (3x+1)² and evaluate at x=0.'],
    ['[(x+h)²-x²]/h=2x+h, approaching 2x as h→0.', 'The derivative is 6x+2, giving 14.', '16+8*0.01=16.08; the exact answer is 16.0801.', 'The chain rule gives 2(3x+1)*3=6(3x+1), which is 6 at zero.'],
    'Explain a derivative using both a limit and a tangent approximation, then state when that approximation can fail.', 'derivatives')

add(18, 'Gradients and directional derivatives', 'MML 5.2 and 5.5; CS205A Chapter 8.',
    'Interpret a gradient as a vector of partial sensitivities and derive a least-squares gradient.', '''
## Change one coordinate at a time

For a scalar f(x,y), a partial derivative with respect to x holds y fixed. With f=x²+3xy+y², partial derivatives are 2x+3y and 3x+2y. Collect them as the column gradient ∇f=(partial f/partial x, partial f/partial y). At (1,2), the gradient is (8,7).

A small displacement delta=(dx,dy) changes the function by approximately ∇f·delta. For a unit direction u, the directional derivative is ∇f·u. Cauchy-Schwarz bounds this by ||∇f||, with equality for u in the gradient direction when the gradient is nonzero. Thus the negative gradient gives the steepest local decrease among Euclidean unit directions.

For f=x²+y² at (3,4), the gradient is (6,8), with norm 10. Moving along u=(1,0) has derivative 6; moving along u=(-0.6,-0.8) has derivative -10. This is a local statement. A large step in that direction can overshoot and increase f.

## Derive the loss gradient one coordinate at a time

Let predictions be A*theta and residuals r_i=sum_j A_ij*theta_j-b_i. Use L=(1/2)*sum_i r_i². Differentiating with respect to theta_j gives sum_i r_i*A_ij. Collecting coordinates yields ∇L=Aᵀ(A*theta-b). If L is the unhalved squared sum, multiply by 2; if it is a mean, divide by observation count. The shape of the gradient must match theta.

This derivation connects Module 3's residual orthogonality to a stationary condition ∇L=0. Full-column-rank A makes the quadratic strictly convex and the optimum unique. Rank-deficient A can give many coefficient optima with identical fitted predictions.

## Coordinate scale changes the geometry

Steepest descent depends on the distance convention. Rescaling one feature or parameter coordinate changes what a Euclidean unit move means, so gradient magnitudes across unrelated units are not intrinsically comparable. Scaling and adaptive updates can improve behavior without changing the derivative definition.
''', ['Find ∇f for f=x²+xy+2y² at (1,2).', 'For gradient (3,4), find the derivative along unit direction (1,0).', 'Write the gradient of L=(1/N)||A*theta-b||².', 'Does a negative directional derivative guarantee a decrease for every step length?'],
    ['Partial derivatives are 2x+y and x+4y; the gradient at (1,2) is (4,9).', 'Dotting with (1,0) gives 3.', '∇L=(2/N)Aᵀ(A*theta-b), with the same parameter dimension as theta.', 'No. It guarantees local decrease for sufficiently small positive steps under differentiability; a large step can overshoot.'],
    'Compute an unseen multivariable gradient, then verify the shape and normalization of a regression-loss gradient.', 'derivatives')

add(19, 'Jacobians and computational graphs', 'MML 5.3-5.6; CV 5.3.3.',
    'Apply the chain rule to vector computations and combine gradients across branching paths.', '''
## A derivative can itself be a map

For y=f(x) with D input coordinates and H outputs, the Jacobian J has shape (H,D). Entry J_ij measures how output i changes when input j changes. Locally, delta_y≈J*delta_x. For f(x₁,x₂)=(x₁²,x₁+x₂), J=[[2x₁,0],[1,1]]. At (2,3), changing input by (0.1,0) predicts output changes (0.4,0.1).

If z=g(y) has C outputs, its Jacobian with respect to x is J_g*J_f, of shape (C,D). For scalar loss L(y), the column gradient with respect to x is J_fᵀ*∇_y L. Forward sensitivity propagates changes through J; reverse differentiation propagates loss sensitivities through its transpose.

## Work a scalar graph

Take x=2,w=3,b=1,target=5. Define a=w*x+b=7 and L=(1/2)*(a-target)²=2. The backward calculation begins with dL/da=a-target=2. Local derivatives are da/dw=x=2, da/dx=w=3 and da/db=1. Therefore dL/dw=4, dL/dx=6 and dL/db=2. Every number follows a specific edge in the graph.

## Shared values receive sums from all paths

For L=u²+3u, u reaches the result along two paths. Their contributions are 2u and 3, so dL/du=2u+3. If u=w*x, then dL/dw=(2u+3)*x. Keeping only one branch loses part of the derivative. In a batch, a shared weight receives contributions from every sample; sums or averages follow the loss definition.

Backpropagation applies this chain rule efficiently by reusing intermediate values and traversing the graph backward. It need not explicitly store a huge Jacobian for each layer. Matrix-vector products with local derivatives are enough for scalar losses.

## A practical check

Before differentiating, name every intermediate, mark its shape and write which values depend on each parameter. A transpose is determined by these shapes, not by habit. Treat targets as fixed observations unless the model explicitly defines a differentiable target-producing computation.
''', ['Find the Jacobian of f(x,y)=(x+y,x*y).', 'For z=(2x+1)², compute dz/dx at x=1.', 'For L=u²+u³, calculate dL/du at u=2.', 'If y=Ax and ∇_y L has shape (H,1), give ∇_x L and its shape.'],
    ['J=[[1,1],[y,x]], with rows indexing outputs.', 'dz/dx=4(2x+1), giving 12.', 'dL/du=2u+3u²=4+12=16. Contributions from both branches add.', '∇_x L=Aᵀ∇_y L, with shape (D,1) for A=(H,D).'],
    'Draw a branching graph, accumulate every path contribution, and use Jacobian dimensions to justify each multiplication.', 'derivatives')

add(20, 'Hessians, Taylor approximations and gradient checks', 'MML 5.7-5.8; CS205A Chapters 1 and 8.',
    'Use curvature and finite differences to inspect analytic gradients.', '''
## The gradient also changes as we move

The Hessian of a scalar function is the matrix of second partial derivatives. For f=x²+3y², H=diag(2,6). The gradient changes three times faster along y than along x. For twice continuously differentiable functions, mixed partial derivatives agree, making the Hessian symmetric.

A second-order approximation is f(x+delta)≈f(x)+∇f(x)ᵀdelta+(1/2)deltaᵀH(x)delta. For a quadratic it is exact. For x² at x=3, delta=0.1, it gives 9+6*0.1+(1/2)*2*0.01=9.61. Positive definite curvature at a stationary point gives a strict local minimum; indefinite curvature indicates a saddle. A semidefinite Hessian may leave the test inconclusive.

## Check one parameter numerically

A central finite difference for coordinate j is [L(theta+h*e_j)-L(theta-h*e_j)]/(2h). It approximates the analytic derivative with error of order h² for sufficiently smooth functions. For L(w)=w³ at w=2, the estimate is 12+h². At h=0.01, it is 12.0001.

Making h smaller reduces truncation error until floating-point roundoff and subtraction cancellation dominate. There is a useful range of step sizes, not a universal best h. Try a sweep such as 1e-2 to 1e-6 in double precision on small deterministic data. Compare both absolute error and a relative error such as |g-num|/max(1e-8,|g|+|num|); tiny derivatives need careful interpretation.

## Match exactly the computation being checked

Disable stochastic dropout or fix its randomness. Use identical data, loss normalization and parameter values for the plus and minus evaluations. Restore each parameter after perturbing it. Avoid ReLU inputs near zero, where a perturbation can cross a nondifferentiable point. Check a few coordinates of every parameter block before checking a whole large network.

Gradient checking is a debugging tool, not a training method: numerical differences require many function evaluations. A passed check supports local derivative correctness for the tested points, not global correctness or good generalization. The calculus notebook demonstrates a small graph and a step-size sweep.
''', ['Find the Hessian of x²+xy+2y².', 'Evaluate the central-difference derivative of w² at w=3 symbolically.', 'At a stationary point with Hessian eigenvalues (2,-1), classify the curvature.', 'Give two reasons a correct derivative implementation might fail a numerical check.'],
    ['H=[[2,1],[1,4]].', '[(3+h)²-(3-h)²]/(2h)=6 for nonzero h in exact arithmetic.', 'The Hessian is indefinite, indicating a saddle for a smooth nondegenerate stationary point.', 'A perturbation can cross a ReLU kink, or stochastic evaluations can use different randomness. Extreme h can also produce numerical error.'],
    'Perform and interpret a gradient check, then explain why its result depends on smoothness, determinism and step size.', 'derivatives')

add(21, 'Conditional probability and Bayes theorem', 'MML 6.1 and 6.3; CV Appendix B.1.',
    'Calculate a posterior while keeping base rates and reversed conditionals separate.', '''
## Events and conditioning

An event is a collection of possible outcomes. Probabilities lie between zero and one, and the whole outcome space has probability one. For events A and B with P(B)>0, conditional probability is P(A|B)=P(A∩B)/P(B). It asks about A within the subset where B occurred.

The product rule gives P(A∩B)=P(B|A)P(A). Equating two ways to express the intersection yields Bayes theorem: P(A|B)=P(B|A)P(A)/P(B). The denominator includes every way that B can occur. For A versus its complement, P(B)=P(B|A)P(A)+P(B|not A)P(not A).

## Work a recognition example

Suppose 20% of images contain an object: P(A)=0.2. A detector raises a flag on 80% of object images and 10% of images without the object. Let B mean a flag. In 1000 representative images, expect 200 object images with 160 flags, and 800 non-object images with 80 flags. There are 240 flags, of which 160 correspond to objects. Thus P(A|B)=160/240=2/3.

The 80% detection rate P(B|A) is different from the 2/3 probability that a flagged image contains an object. If object prevalence drops to 1% with the same conditional flag rates, the posterior becomes 0.008/(0.008+0.099), about 0.0748. Base rates matter even if sensitivity stays fixed.

## Independence is a specific claim

A and B are independent when P(A∩B)=P(A)P(B), equivalently P(A|B)=P(A) when conditioning is defined. Independence is stronger than saying events merely seem unrelated. A dataset construction or probabilistic model may assume it; observations from consecutive video frames often violate an independent-sample assumption.

A neural-network score is not automatically a calibrated posterior. A sigmoid or softmax output has the range and normalization of a probability model, but calibration must be evaluated on relevant data. Bayes calculations clarify assumptions; they do not repair a misspecified likelihood on their own.
''', ['With P(A)=0.3, P(B|A)=0.8 and P(B|not A)=0.2, compute P(B).', 'Using those values, compute P(A|B).', 'If A and B are independent with P(A)=0.4 and P(B)=0.5, find their intersection probability.', 'Why is detector recall different from the probability an alerted image truly contains the object?'],
    ['P(B)=0.8*0.3+0.2*0.7=0.38.', 'P(A|B)=0.24/0.38=12/19≈0.6316.', 'P(A∩B)=0.4*0.5=0.2.', 'Recall conditions on true objects; the alert probability conditions on predicted positives and also depends on prevalence and false positives.'],
    'Solve a new Bayes example with a frequency table, and explain each conditioning direction in plain language.', 'bayes')

add(22, 'Random variables, densities and expectations', 'MML 6.2 and 6.4; CV Appendix B.1.',
    'Distinguish a probability mass from a density and calculate an expectation.', '''
## A random variable assigns a number to an outcome

A Bernoulli variable X records 1 for an event and 0 otherwise, with P(X=1)=p. Its expectation is E[X]=0*(1-p)+1*p=p. For a finite discrete variable, E[f(X)]=sum_x f(x)*P(X=x). Expectation is a probability-weighted average, not necessarily a value the variable can actually take.

A fair die has expectation 3.5 although no roll gives 3.5. For pixel noise taking values -1,0,1 with probabilities 0.25,0.5,0.25, the expected noise is zero and expected squared noise is 0.5. Zero average noise does not mean every observation is undisturbed.

## Continuous probability uses area

A density p(x) is nonnegative and integrates to one. Probability over [a,b] is the area under the density on that interval, written as an integral. You can picture an integral as the limit of adding narrow rectangle areas. For a uniform variable on [0,2], the density is 1/2 inside the interval. Probability of [0.5,1.5] is width 1 times height 1/2, giving 0.5.

At any single exact value, a continuous variable has probability zero because the interval width is zero, even though its density may be positive. A uniform density on [0,0.1] is 10; densities can exceed one. Their units are inverse input units, and only integrated area is a probability.

For continuous X, E[f(X)]=integral f(x)*p(x) dx. A uniform X on [0,2] has E[X]=integral_0^2 x/2 dx=1. Its cumulative distribution F(t)=P(X≤t) is 0 for t<0, t/2 inside the interval, and 1 for t≥2. A CDF, unlike a density, always lies in [0,1].

## Sample averages estimate expectations

The empirical average (1/N)*sum_i X_i estimates E[X] under a suitable sampling model. It is itself random because the sampled observations vary. Linearity gives E[aX+bY]=aE[X]+bE[Y], without requiring independence. Later variance formulas need additional assumptions; keep those distinct.
''', ['Find E[X] for values 0,2,4 with probabilities 0.2,0.5,0.3.', 'For uniform X on [0,4], find P(1≤X≤3).', 'What is P(X=2) for that continuous distribution?', 'If E[X]=2 and E[Y]=3, calculate E[2X-Y] without assuming independence.'],
    ['0*0.2+2*0.5+4*0.3=2.2.', 'Density=1/4; interval width=2, so probability=0.5.', 'Zero; one exact value has zero interval width.', 'By linearity, 2E[X]-E[Y]=4-3=1.'],
    'Explain how a density of 10 can be valid, then compute both a discrete expectation and a continuous interval probability.', 'bayes')

add(23, 'Variance, covariance and Gaussian noise', 'MML 6.4-6.5; CV Appendix B.1.',
    'Calculate fluctuation and co-variation, and state what Gaussian noise assumes.', '''
## How much does a quantity fluctuate?

Variance is Var(X)=E[(X-mu)²], where mu=E[X]. Expanding gives E[X²]-mu². Standard deviation is the square root of variance, so it shares the variable's units. For equally likely values [0,2,4], mu=2 and population variance=(4+0+4)/3=8/3.

For N independent samples estimating an unknown population variance, the usual unbiased estimator divides squared deviations from the sample mean by N-1. This is different from treating an observed finite list as the entire population and dividing by N. State the purpose and denominator before comparing results.

## Coordinates can fluctuate together

Cov(X,Y)=E[(X-E[X])(Y-E[Y])]. A covariance matrix records this for every feature pair. Positive covariance means above-average values tend to occur together; negative covariance means opposite deviations. Correlation divides covariance by the two standard deviations when neither is zero, producing a number in [-1,1]. Zero correlation does not generally imply independence.

If X is uniform over -1,0,1 and Y=X², then E[X]=0, E[Y]=2/3, and Cov(X,Y)=E[X³]=0. Yet Y is completely determined by X, so they are dependent. Linear co-variation cannot capture every relationship.

## A Gaussian model

A scalar Gaussian with mean mu and variance sigma² has density exp(-(x-mu)²/(2sigma²))/(sqrt(2*pi)*sigma), for sigma>0. It is a model of continuous variation. Under additive noise I_observed=I_clean+epsilon with E[epsilon]=0, the expected observed intensity equals the clean intensity. If independent Gaussian noise affects each pixel, its covariance matrix is sigma²*I.

Real images may have signal-dependent noise, spatial correlations, quantization and clipping. Clipping Gaussian samples to [0,255] changes their distribution and can introduce bias near boundaries. Use unclipped floating-point simulations when testing the assumed noise model, then study clipping separately.

For independent measurements with variance sigma², averaging N gives variance sigma²/N. Correlation weakens this reduction because cross-covariance terms remain. More nearly duplicate frames are not equivalent to the same number of independent measurements.
''', ['Find mean and population variance of [1,3,5].', 'If Var(X)=4, find Var(3X+2).', 'For 16 independent samples each with variance 4, find variance of their mean.', 'Does covariance zero guarantee independence? Give the lesson’s counterexample.'],
    ['Mean=3; variance=(4+0+4)/3=8/3.', 'Var(aX+b)=a²Var(X), giving 9*4=36.', '4/16=0.25, so standard deviation is 0.5.', 'No. For symmetric X over -1,0,1, Y=X² depends on X even though covariance is zero.'],
    'Distinguish population and sample variance, explain a covariance matrix, and list assumptions needed for averaging to reduce uncertainty.', 'bayes')

add(24, 'Sampling and empirical uncertainty', 'MML 6.4 and 8.6; revisit CV Appendix B.1.',
    'Measure uncertainty in an evaluation estimate without confusing it with model confidence.', '''
## An accuracy is an estimate from a sample

If predictions on N independently sampled images have correctness indicators C_i, accuracy is p_hat=(1/N)*sum_i C_i. Under an identical Bernoulli model with true accuracy p, Var(p_hat)=p(1-p)/N. A plug-in standard error is sqrt(p_hat*(1-p_hat)/N), useful when counts are sufficiently large and neither success nor failure is too rare.

At p_hat=0.8 with N=100, this is 0.04. A rough normal 95% interval is 0.8±1.96*0.04, approximately [0.722,0.878]. With N=25 the standard error doubles. This approximation is poor near zero or one and for tiny samples; 5 successes out of 5 should not be reported as certainty of perfect performance.

## What the interval means

A frequentist confidence procedure is designed to cover the fixed population quantity at a stated rate over repeated samples, under its assumptions. It is distinct from a probability that one model prediction is correct and from a Bayesian credible interval. The practical conclusion is that sample size and sampling design affect the strength of performance evidence.

## Bootstrap a declared sampling unit

For a basic nonparametric bootstrap, sample N observed units with replacement, compute accuracy, and repeat many times. Percentiles of these replicated accuracies form a simple approximate interval. This procedure uses the observed empirical distribution; it cannot invent unseen failure modes or fix an unrepresentative test set.

If images are clustered by patient, video or scene, bootstrap the independent groups rather than isolated correlated frames when that matches the target question. The choice of sampling unit belongs in the report. Comparing two models on the same images also produces paired outcomes, so preserve those pairs when estimating their difference.

## A controlled noise experiment

Generate several independent noisy images, evaluate a fixed classifier, and repeat the whole sample experiment. Keep model training separate from evaluation trials. Track how the estimate varies with N and noise level. Probability of a class from softmax, uncertainty in measured accuracy, and uncertainty from changing the training sample are different quantities; name which one you measure.
''', ['At p_hat=0.5 and N=100, find the plug-in standard error.', 'How does standard error change if N is multiplied by four under the same independent model?', 'Why is the plug-in normal interval unreliable after 3 successes out of 3?', 'When evaluating many frames from each video, what could be a better bootstrap unit?'],
    ['sqrt(0.5*0.5/100)=0.05.', 'It halves because standard error scales as 1/sqrt(N).', 'p_hat=1 gives plug-in standard error zero, hiding substantial uncertainty from a tiny sample.', 'Resample independent videos or groups when within-video frames are correlated and the deployment target is new videos.'],
    'Report accuracy with sample size, sampling unit and an uncertainty method, and explain the limits of that evidence.', 'bayes')

add(25, 'Likelihood and negative log likelihood', 'MML 8.3-8.4 and 9.2; CV Appendix B.2.',
    'Derive common training losses from declared observation models.', '''
## Parameters change how plausible observations are

A probability model p(y|x,theta) assigns a probability mass or density to each target given inputs and parameters. With independent observations, likelihood as a function of theta is the product of these terms. The observations are fixed; theta is varied. A likelihood is not a probability distribution over parameters unless a prior and normalization make it one.

Maximum likelihood chooses parameters making the observed data most plausible under the model. Maximizing a product is equivalent to maximizing its logarithm because log is increasing. Negative log likelihood is L(theta)=-sum_i ln p(y_i|x_i,theta). Sums are easier to compute and differentiate than long products that can underflow.

## Bernoulli targets give binary cross entropy

For a binary label y∈{0,1}, the model term is p^y*(1-p)^(1-y). Its negative log is -y*ln p-(1-y)*ln(1-p). At y=1,p=0.8, the loss is -ln(0.8)≈0.2231. At y=0 with the same prediction, it is -ln(0.2)≈1.6094. High probability assigned to the wrong outcome is expensive.

## Gaussian residuals give squared error

Suppose y_i=f_theta(x_i)+epsilon_i, with independent epsilon_i distributed as Gaussian(0,sigma²) and a fixed shared sigma². The negative log likelihood is N*ln(sigma*sqrt(2*pi)) + (1/(2sigma²))*sum_i (y_i-f_theta(x_i))². The first term is constant in theta. Thus minimizing squared error maximizes this likelihood under these assumptions.

If variance is learned, its log term is no longer constant and cannot be dropped. If observations have different known variances, their errors are weighted differently. If errors are heavy-tailed or correlated, ordinary squared error is not automatically the corresponding likelihood criterion.

## A loss needs its data model and reduction

Dividing summed NLL by N gives mean NLL and keeps the same optimizer for a fixed dataset, but changes gradient scale. Adding a regularization term requires a compatible normalization. State label type, output distribution, independence assumption and averaging convention before writing a loss function.
''', ['For y=1,p=0.25, calculate binary NLL.', 'For labels [1,0] and predictions [0.8,0.3], write their summed NLL.', 'Under fixed Gaussian variance 2, what multiplies the squared residual sum in NLL?', 'Why cannot the log-variance term be ignored when predicting variance?'],
    ['-ln(0.25)=ln(4)≈1.3863.', 'The correct-label probabilities are 0.8 and 0.7, so NLL=-ln(0.8)-ln(0.7)≈0.5798.', '1/(2sigma²)=1/4.', 'It depends on learned parameters. Dropping it would allow increasing variance to reduce the residual term without the proper likelihood cost.'],
    'Derive binary cross entropy and Gaussian squared error from likelihoods, and identify the assumptions that make each derivation valid.', 'softmax')

add(26, 'Priors, MAP and regularization', 'MML 8.3-8.4 and 9.3; CV Appendix B.4.',
    'Connect a parameter preference to a probabilistic prior while tracking loss scales.', '''
## Bayes reasoning for parameters

The posterior is p(theta|data) proportional to p(data|theta)*p(theta). The prior p(theta) describes parameter preference before observing these data. Maximum a posteriori estimation chooses a posterior mode. Taking a negative logarithm turns this into NLL(theta)-ln p(theta), plus a constant independent of theta.

Unlike a full Bayesian posterior computation, MAP returns one parameter setting. It does not by itself quantify uncertainty across other plausible settings. The choice of parameterization also matters when interpreting densities and modes.

## A Gaussian prior yields a squared penalty

If theta has independent Gaussian coordinates with mean zero and variance tau², then -ln p(theta)=||theta||²/(2tau²)+constant. Combine this with Gaussian residual variance sigma² from the previous lesson. Multiplying the entire MAP objective by 2sigma² gives squared residual sum + (sigma²/tau²)||theta||². The ridge coefficient is lambda=sigma²/tau² under this summed-error convention.

A tighter prior, smaller tau², produces a stronger penalty. Different coordinates can have different prior variances, giving different penalties. Leaving an intercept unpenalized represents a different prior choice from shrinking all parameters equally.

## Work the one-coordinate example

Observe y=2 with model y=theta+epsilon, sigma²=1, and prior theta~Gaussian(0,1). The posterior is proportional to exp(-[(2-theta)²+theta²]/2). Completing the square gives a Gaussian centered at 1 with variance 1/2. Its MAP is theta=1; maximum likelihood without the prior gives theta=2. The prior pulls the estimate toward zero.

## Keep reduction conventions consistent

Switching from a summed data loss to a mean divides its gradient by N. Keeping the same penalty coefficient then changes its strength relative to the data. A library's regularization coefficient must be interpreted with its stated objective, including any factor of 1/2.

Priors are assumptions, not additional observations. Choose their strength using a justified model or validation procedure. A zero-centered prior can be useful without literally believing every true coefficient is near zero; report the resulting bias and compare predictive performance on untouched data.
''', ['With sigma²=2 and tau²=4, give lambda under the lesson’s summed-error convention.', 'For a single observation y=6 with both variances equal to 1, find the MAP.', 'Does MAP supply a full posterior uncertainty distribution?', 'If a summed data loss is divided by N, how should its penalty coefficient change to preserve the same optimum?'],
    ['lambda=sigma²/tau²=2/4=0.5.', 'Minimize (theta-6)²+theta²; theta=3.', 'No. MAP supplies a mode; a full posterior or approximation is needed for distributional parameter uncertainty.', 'Divide the penalty coefficient by N too, so the entire objective is scaled equally.'],
    'Derive ridge from Gaussian assumptions and show how mean-versus-sum reduction changes the numeric coefficient.', 'softmax')

add(27, 'Logistic regression, softmax and cross entropy', 'MML 8.2-8.4; CV 5.1.3 and 5.3.4.',
    'Compute stable class probabilities and derive the gradient of a softmax classifier.', '''
## Linear scores become normalized probabilities

Binary logistic regression uses z=w·x+b and p=1/(1+exp(-z)). For multiple mutually exclusive classes, scores z_c become p_c=exp(z_c)/sum_j exp(z_j). Every p_c is positive and the probabilities sum to one. Softmax is a model for one selected class per example; independent multilabel outcomes usually need separate sigmoid outputs instead.

Adding the same constant a to every score leaves probabilities unchanged because exp(a) cancels between numerator and denominator. Use this to avoid overflow: subtract m=max z before exponentiating. For scores [1000,1001], compute from [-1,0], obtaining probabilities about [0.2689,0.7311]. Direct exp(1001) would overflow ordinary floating-point arithmetic.

## Compute the loss from scores

For true class t, cross entropy is -ln p_t = logsumexp(z)-z_t. A stable logsumexp is m+ln(sum exp(z-m)). For [0,ln(3)] and true class 1 under zero-based indexing, probabilities are [0.25,0.75] and loss is -ln(0.75)≈0.2877. This logit-based form avoids taking a log of a probability that has rounded to zero.

## Derive a useful gradient

Differentiate L=ln(sum exp z_j)-z_t with respect to z_c. The result is p_c-1[c=t]. With one-hot target vector y, ∂L/∂z=p-y. For row batches Z=XW+b and mean loss over N samples, G=(P-Y)/N, dW=XᵀG and db=sum_rows G. The gradient has W's shape and each class bias accumulates across all examples.

One-hot vectors here identify class membership, not a class ordering. Cross entropy assumes a target distribution; soft labels can also be used when justified. Softmax confidence alone does not establish calibration or reliability on unfamiliar inputs.

## Train a transparent baseline

The learning notebook trains a small linear classifier using these exact formulas, with training-only scaling and a held-out validation split. This is a useful benchmark before adding nonlinear layers. Inspect class errors and a confusion matrix; accuracy alone can conceal failures on a rare class.
''', ['Compute softmax([0,ln 2]).', 'For those scores and true class 0, find cross entropy.', 'Write the score gradient for probabilities [0.2,0.7,0.1] with true class 1.', 'For X=(8,4), W=(4,3), give dW and db shapes.'],
    ['Exponentials are [1,2], so probabilities are [1/3,2/3].', '-ln(1/3)=ln(3)≈1.0986.', 'Subtract one-hot [0,1,0], giving [0.2,-0.3,0.1]. Its entries sum to zero.', 'dW=(4,3); db=(3,) when summed over the eight rows.'],
    'Implement stable softmax and explain every term and shape in its mean-loss gradient.', 'softmax')

add(28, 'Splits, bias, variance and calibration', 'MML 8.6; CV 5.1.2 and 5.3.6.',
    'Design an honest evaluation and separate a confident prediction from a calibrated one.', '''
## Give each dataset split a job

Training data fit parameters and preprocessing. Validation data choose hyperparameters, architectures and stopping decisions. Test data estimate the performance of the fixed final procedure. Repeatedly selecting changes based on test results turns the test set into another validation set, weakening its independent evidence.

Split related images together when deployment involves new subjects or scenes. Record the seed and split identifiers. A random shuffle cannot resolve duplicate leakage or a mismatch between the sampled population and the intended application. Label-preserving augmentation belongs within the training procedure; do not generate a near-duplicate on one side of a split from an image on the other.

## Bias and variance describe kinds of prediction error

For squared loss, expected prediction error can be decomposed into squared bias, variance across training sets and irreducible noise under the usual model. A restricted linear model can underfit a nonlinear relation. A highly flexible fit can change dramatically with its training sample. Increasing complexity is not automatically helpful; regularization and more representative data change the tradeoff.

Training curves offer evidence but do not uniquely diagnose cause. High training and validation loss may mean underfitting, a broken implementation or poor optimization. Low training loss with high validation loss suggests generalization trouble, leakage in model selection or distribution differences worth inspecting.

## Confidence and calibration differ

A calibrated group of predictions assigned probability 0.8 should be correct about 80% of the time, under the calibration definition and population being tested. Suppose ten predictions all give top-class confidence 0.9 and only six are correct. Their observed accuracy is 0.6, suggesting overconfidence in that small group, though uncertainty is substantial.

Reliability diagrams compare average confidence with empirical accuracy across bins. Bin choices and small counts matter. Negative log likelihood and the Brier score can evaluate probabilities directly; classification accuracy ignores many changes in confidence. Calibration on one distribution may fail after domain shift.

## Your baseline report

Record preprocessing, class counts, split protocol, accuracy, per-class errors and mean NLL. Pick any threshold or calibration parameter using validation data. Report test results after fixing these choices. Label explanations of failure as hypotheses unless a controlled experiment supports them.
''', ['Which split selects learning rate?', 'A model is 90% confident on 20 predictions and correct on 12. Give empirical accuracy and confidence gap.', 'Give an example of leakage before model training.', 'Can perfect classification accuracy establish perfect probability calibration?'],
    ['Validation selects it; training fits parameters and test evaluates the fixed choice.', 'Accuracy=12/20=0.6; confidence exceeds it by 0.3. The sample is small, so interpret cautiously.', 'Fitting normalization or PCA on all samples before splitting, or placing near-duplicates across train and test.', 'No. A model can classify every case correctly while assigning systematically inaccurate probabilities.'],
    'Write a complete split protocol and identify a measure of correctness, a measure of probability quality and a source of sampling uncertainty.', 'softmax')

add(29, 'Gradient descent and optimality', 'MML 7.1; CS205A Chapter 8; CV 5.3.6.',
    'Derive a learning update and its convergence range for a simple quadratic.', '''
## Turn sensitivity into an update

Gradient descent updates theta_next=theta-alpha*∇L(theta), with learning rate alpha>0. The negative gradient gives local descent, while alpha determines the actual move. Parameters and their gradients have matching shapes. Compute the gradient at the current parameters before changing them.

For L(w)=(w-3)², ∇L=2(w-3). Starting at w=0 with alpha=0.1 gives w_next=0-0.1*(-6)=0.6. Loss decreases from 9 to 5.76. The next gradient is -4.8, giving w=1.08. Successive moves approach the minimizer when the learning rate is suitable.

## Derive when this particular update converges

Let e_k=w_k-3. Then e_next=(1-2alpha)*e_k. Its magnitude shrinks exactly when |1-2alpha|<1, which gives 0<alpha<1. Below alpha=0.5 errors retain their sign; above 0.5 they oscillate while shrinking. Alpha=1 alternates without shrinking, and alpha>1 diverges for a nonzero starting error. This range belongs to this quadratic, not all losses.

For L(theta)=(1/2)thetaᵀHtheta with symmetric positive definite H, each eigen-direction has error factor 1-alpha*lambda_i. Convergence from arbitrary initial errors requires 0<alpha<2/lambda_max. A direction with small curvature can converge slowly while the steep direction limits the step size. This connects optimization to eigenvalues from Module 4.

## Stationary does not mean globally best

At an unconstrained differentiable local minimum, the gradient is zero. Zero gradient alone is not sufficient: maxima and saddles can also be stationary. A convex objective makes any stationary point globally minimizing; strict convexity can give uniqueness. Neural-network objectives are usually nonconvex, so a training run does not establish a global optimum.

## Watch more than one scalar

Record training loss, validation loss, gradient norms and finite parameter values. Stopping because changes are tiny can mean convergence, a very small learning rate, saturation or numerical failure. Check simple synthetic cases with known optima before training a complicated model. The optimization workbench lets you compare step sizes on this exact quadratic.
''', ['Take one step for (w-3)² from w=1 with alpha=0.2.', 'For that loss, give the error multiplier at alpha=0.75.', 'For H eigenvalues [2,10], give the convergence range for the half-scaled quadratic.', 'Does ∇L=0 prove a global minimum for a nonconvex loss?'],
    ['Gradient=2*(1-3)=-4; next w=1.8.', '1-2*0.75=-0.5: errors alternate sign and halve in magnitude.', '0<alpha<2/10=0.2.', 'No. It may be a local minimum, maximum, saddle or another stationary point.'],
    'Derive rather than memorize a learning-rate range for a quadratic, and separate a stationary condition from a global guarantee.', 'optimization')

add(30, 'Mini-batch SGD, momentum and adaptive steps', 'MML 7.1; CV 5.3.6; optional CS231n learning notes.',
    'Explain gradient sampling and track the state of momentum and adaptive updates.', '''
## Estimate a large-data gradient

If the training objective is mean loss over N examples, its gradient is the mean of per-example gradients. A uniformly sampled mini-batch estimates this gradient. Under uniform independent sampling, its expected gradient equals the full-data gradient. Sampling classes unequally without correction changes the weighting and possibly the objective.

Smaller batches generally introduce more sampling variation and reduce work per update. Larger batches reduce that variation but require more work and memory. An epoch is one pass through the training examples, while an update is one batch step. Compare schedules using their declared unit: two models with the same epoch count can have different update counts.

## Momentum retains a history

One convention is v_next=beta*v+g and theta_next=theta-alpha*v_next, with v initially zero. For alpha=0.1,beta=0.9 and first two gradients g₁=2,g₂=1, v₁=2 then v₂=2.8. The moves are -0.2 and -0.28. Other implementations use an exponentially averaged gradient with a factor 1-beta; the learning-rate interpretation changes with the convention.

Momentum can accumulate movement in a persistent direction and damp alternating components. It is not a guarantee against divergence: an excessive step or stale momentum can overshoot. Reset optimizer state when restarting an experiment from scratch.

## An adaptive example: Adam

Adam tracks m_t=beta1*m_previous+(1-beta1)*g_t and v_t=beta2*v_previous+(1-beta2)*g_t² elementwise. Starting at zero, bias-correct with m_hat=m_t/(1-beta1^t) and v_hat=v_t/(1-beta2^t). The update is theta_next=theta-alpha*m_hat/(sqrt(v_hat)+epsilon). Epsilon stabilizes the denominator; the second moment is not the same as a centered variance.

For the first scalar gradient g=2, corrected moments are 2 and 4. With alpha=0.1 and tiny epsilon, the first move is approximately -0.1. This differs from plain SGD's -0.2. Coordinate-wise scaling changes the geometry of the update.

Compare optimizers using controlled initialization, data order, loss reduction and validation criteria. A lower training loss after a particular number of steps is evidence for that setup, not a universal ranking of optimizers or a guarantee of better generalization.
''', ['With N=100 and batch size 20 without dropping samples, how many updates form an epoch?', 'Under v_next=0.5v+g, start v=0 and apply gradients 4 then -2. Give both velocities.', 'Why can oversampling a rare class change the optimized objective?', 'What is Adam’s bias-corrected second moment after its first nonzero scalar gradient g=3?'],
    ['100/20=5 updates.', 'v₁=4; v₂=0.5*4-2=0.', 'Uniform averaging over the altered sampling distribution gives the rare class greater weight unless corrected.', 'v₁=(1-beta2)*9, and correction divides by 1-beta2, giving 9.'],
    'Work two momentum updates by hand, explain mini-batch gradient assumptions and state what optimizer history must be preserved.', 'optimization')

add(31, 'Convexity, curvature and constraints', 'MML 7.2-7.3; CS205A Chapters 8-9.',
    'Recognize convex guarantees and solve a small equality-constrained problem.', '''
## A convex objective has no hidden lower basin

A function is convex when f(t*x+(1-t)*y)≤t*f(x)+(1-t)*f(y) for t∈[0,1] on a convex domain. The value along a connecting segment lies below the chord. For a twice differentiable function on an open convex domain, a positive semidefinite Hessian everywhere establishes convexity. Positive definite curvature everywhere is a sufficient condition for strict convexity.

For f(x)=x², f((x+y)/2)≤(f(x)+f(y))/2. For -x² the inequality reverses. A single positive-curvature point does not make an entire objective convex. Least squares is convex; adding a positive squared penalty can give strict convexity. Composing trainable layers and nonlinear activations generally changes this picture.

## Constraints change optimality

To minimize x²+y² subject to x+y=1, the unconstrained optimum (0,0) is infeasible. Form the Lagrangian L=x²+y²+lambda*(x+y-1). Its stationary conditions are 2x+lambda=0, 2y+lambda=0 and x+y=1. Thus x=y=1/2 and lambda=-1. The objective value is 1/2.

Geometrically, the optimal point is the closest point on the constraint line to the origin. The objective gradient is perpendicular to feasible directions at the optimum. Lagrange multipliers express this alignment under suitable regularity; they do not automatically certify a global minimum for arbitrary nonconvex problems.

## A simple inequality example

Minimize (w-3)² subject to w≤1. The feasible optimum is w=1, where the ordinary derivative is -4 rather than zero. The boundary prevents the improving positive move. Constrained optima need not have zero unconstrained gradient. Projected gradient descent takes a gradient step and then projects into a declared convex feasible set; for an interval, projection is clipping.

## Interpret constraints in vision

Probability vectors must be nonnegative and sum to one; softmax builds this into the representation. Image-coordinate predictions might need bounds, but naively clipping inside a learned computation changes derivatives and may saturate them. Decide whether the constraint belongs to parameterization, optimization or evaluation. These are different operations with different mathematical consequences.
''', ['Is f(x,y)=x²+2y² convex? Use its Hessian.', 'Minimize x²+y² subject to x+y=4.', 'Minimize (w-3)² subject to 0≤w≤2.', 'Why need not a constrained minimum have an ordinary zero gradient?'],
    ['H=diag(2,4) is positive definite everywhere, so the function is strictly convex.', 'Symmetry or Lagrange conditions give x=y=2, with value 8.', 'The nearest feasible point to 3 is w=2, with loss 1.', 'At a boundary, decreasing directions may be infeasible; constrained optimality only considers allowable movement.'],
    'Solve an equality constraint with both geometry and multipliers, and distinguish local curvature from global convexity.', 'optimization')

add(32, 'Initialization, scaling and training diagnostics', 'MML 7.1 and 8.6; CV 5.3.6.',
    'Use controlled experiments to separate a broken computation from poor learning settings.', '''
## Start with a computation that can succeed

Initialize identical hidden units with identical weights and they can receive identical gradients, remaining symmetric. Random initialization breaks this symmetry. Too-large weights can amplify signals or saturate activations; too-small weights can make gradients weak in some architectures. Initialization should match layer width and activation rather than an arbitrary common scale.

For roughly independent zero-mean inputs with variance s² and D incoming weights with variance v², a linear preactivation has variance about D*v²*s². Scaling v² inversely with D helps keep signals controlled. For ReLU layers, a common variance is about 2/D under simplifying assumptions about input symmetry. This is a starting principle, not a proof of stable training for every network.

## Scaling affects the loss landscape

For half-scaled least squares, curvature is AᵀA. If feature scales differ widely, the eigenvalues can differ widely, producing a stretched landscape. A step small enough for a steep direction may barely move along a flat one. Training-fitted normalization can improve conditioning; it also changes the interpretation of penalties.

## A debugging sequence

Check shapes, labels, output range and finite values. Verify gradients numerically on a tiny smooth case. Confirm a linear loss behaves on a dataset with a known answer. Train on a tiny subset long enough to drive training loss down. Failure to overfit that subset suggests insufficient capacity, an implementation issue, regularization or optimization settings that need inspection.

With C equally scored classes, softmax probability is 1/C and mean cross entropy is ln(C). For three classes it is about 1.0986. This gives a useful starting scale. It is not a universal expected initial loss when logits are random or class weighting is used.

## Diagnose with paired evidence

Loss becomes NaN: inspect large logits, unstable log calculations, invalid targets and excessive steps. Loss stays flat: inspect gradients, frozen updates, label alignment and initialization. Training improves but validation degrades: examine overfitting, split protocol and distribution differences. Treat these as hypotheses and test one change at a time.

Keep the split, seed, initialization and metric fixed when comparing learning rates. Save a failure example and a curve with axes and units. A prettier curve alone does not establish correctness; controlled changes and sanity checks make the interpretation stronger.
''', ['What is cross entropy for equal logits over four classes?', 'Why can identical initialization keep two hidden units redundant?', 'Under the stated variance approximation, what weight variance preserves linear variance for D=100?', 'Name two plausible causes of flat training loss.'],
    ['ln(4)≈1.3863 for a single correct class.', 'Their forward activations and backward gradients can be identical, so symmetry persists under updates.', 'v²≈1/D=0.01 for the simple linear approximation; the ReLU heuristic would differ.', 'Parameters may not be updating, gradients may vanish, the learning rate may be tiny, or labels may be misaligned. Test rather than infer solely from the curve.'],
    'Design a debugging order that verifies computation before changing model complexity, and justify a comparison with controlled conditions.', 'optimization')

add(33, 'Sampling, aliasing and image coordinates', 'CV 3.4 and 3.5; revisit the image-coordinate conventions in Lesson 05.',
    'Explain how continuous variation becomes pixels and why lost detail cannot always be recovered.', '''
## A pixel array is a sampled representation

A continuous scene is filtered by optics and sensing before we store discrete measurements. A pixel can represent an integrated response over an area, followed by quantization. A grayscale value is therefore not the continuous world itself. Our toy arrays describe stored numerical measurements; their operations need not simulate physical light accurately.

State whether coordinates refer to pixel centers or cell boundaries, and whether (x,y) means (column,row). Most array indexing is [row,column]. A box convention using boundaries [x_min,x_max) differs from treating both integer endpoints as included pixels. Off-by-one errors change areas and alignment.

## Aliasing makes distinct signals share samples

Sample cos(2*pi*f*t) at integer times t=n. Frequencies differing by an integer cycles per sampling interval produce identical samples. At f=1, every sample is cos(2*pi*n)=1, indistinguishable from a constant signal. The oscillation has not become physically constant; the samples cannot reveal it.

For an ideally band-limited signal, sampling above twice its highest frequency supports ideal reconstruction under the sampling assumptions. Real images, finite fields and practical filters complicate that ideal. Downsampling without first suppressing frequencies above the new limit can turn fine texture into false coarse patterns.

## Work a tiny downsampling example

The alternating row [0,1,0,1,0,1,0,1] becomes [0,0,0,0] if we take every second entry starting at index zero. Starting at index one instead gives all ones. Averaging each neighboring pair before reducing gives [0.5,0.5,0.5,0.5]. A low-pass filter reduces phase-dependent aliasing but deliberately removes high-frequency detail.

Interpolation predicts values between samples under an assumed rule; it cannot recover arbitrary detail already discarded. Nearest-neighbor resizing selects existing values. Bilinear resizing blends neighboring values and may be inappropriate for categorical label IDs; masks need an operation that respects their semantics or a deliberate soft-target interpretation.

## The vision consequence

Small objects can disappear after strong downsampling. A network's stride changes both computation and the spatial evidence available for prediction. Compare a synthetic fine pattern before and after filtering and sampling, and state what information remains. Do not describe enlarging an image as creating measured evidence that was never captured.
''', ['Downsample [0,1,0,1,0,1] by taking indices 0,2,4.', 'Average adjacent pairs in that row before reducing.', 'Why can cos(2*pi*n) be confused with a constant from integer samples?', 'Why is averaging class IDs during mask resizing usually wrong?'],
    ['The result is [0,0,0].', 'The result is [0.5,0.5,0.5].', 'All integer samples equal 1, matching the constant signal exactly.', 'Class IDs are categories, not quantities to blend; averaging IDs can invent unrelated classes.'],
    'Create two different underlying patterns with the same sampled values and explain what an antialiasing filter can and cannot do.', 'convolution')

add(34, 'Convolution and cross-correlation', 'CV 3.2 and 5.4; optional CS231n convolutional-network notes.',
    'Calculate local filter responses and distinguish kernel flipping from weight sharing.', '''
## A local weighted sum

Discrete cross-correlation places a kernel on a patch and sums elementwise products. For row x=[1,2,4] and kernel k=[1,-1], valid cross-correlation outputs 1*1+2*(-1)=-1, then 2*1+4*(-1)=-2. The same weights are reused at both positions.

Mathematical convolution flips the kernel before the equivalent sliding dot product. For this example the flipped kernel is [-1,1], producing [1,2] in valid mode. Symmetric kernels give identical correlation and convolution results; asymmetric kernels reveal the difference. Many deep-learning layers named convolution implement unflipped cross-correlation.

## Extend the calculation to a patch

For patch [[1,2],[3,4]] and kernel [[1,0],[0,-1]], the response is 1-4=-3. A 2D valid operation on a 3x3 image with a 2x2 kernel has four placements and a 2x2 output at stride one. Every response mixes nearby values; each position uses the same kernel.

A smoothing kernel such as an all-ones 3x3 matrix divided by nine computes a local average away from boundaries. A difference kernel can emphasize a change across an edge and suppress a constant region because its coefficients sum to zero. Its sign depends on orientation and the flip convention.

## Linearity and boundaries

With a fixed kernel and zero bias, filtering is linear in the image: filter(aX+bY)=a*filter(X)+b*filter(Y). Adding bias makes the map affine. Applying ReLU afterward makes the overall operation nonlinear. Padding rules such as zero, reflection or wraparound alter boundary responses and must be declared.

Weight sharing reduces parameters and gives a translation-related structure in the interior. It does not make every final classifier automatically translation invariant: boundaries, stride, pooling and a flattened dense head can all affect the behavior.

## Your calculation first

Use the workbench to move a 3x3 kernel over a synthetic 5x5 image. Write one patch and compute its response by hand, then compare. In the vision notebook, verify your loop implementation against a second calculation before treating its output as evidence about learned features.
''', ['Find valid cross-correlation of [1,3,2] with [1,-1].', 'Find valid convolution of the same row and kernel.', 'Find full convolution of [1,2,3] with [1,1].', 'What is the response of a zero-sum kernel on a constant patch?'],
    ['1-3=-2 and 3-2=1, so [-2,1].', 'Use flipped [-1,1], giving [2,-1].', 'The full output is [1,3,5,3].', 'It is the constant times the coefficient sum, so zero, before bias and boundary effects.'],
    'Show the flip convention, compute a response by hand and explain how weight sharing differs from output invariance.', 'convolution')

add(35, 'Padding, stride, channels and receptive fields', 'CV 5.4; optional CS231n convolutional-network notes.',
    'Calculate output and parameter shapes and track receptive-field growth.', '''
## Count legal kernel placements

For a one-dimensional input length L, symmetric padding P, kernel size K, stride S and dilation d, the output length is floor((L+2P-d*(K-1)-1)/S)+1, provided the effective kernel fits. Dilation spaces the sampled kernel entries; with d=1 this reduces to floor((L+2P-K)/S)+1.

For L=7,K=3,P=1,S=2,d=1, the length is floor((7+2-3)/2)+1=4. Apply the same formula separately to height and width. A convention called same padding may require asymmetric sides when dimensions or strides demand it; state the actual padding, rather than guessing from its name.

## Channels mix too

With row-style image batches X=(N,H,W,C_in), a kernel bank can be stored as (K_h,K_w,C_in,C_out). Each output position and output channel sums over the spatial patch and all input channels. The output shape is (N,H_out,W_out,C_out). A bias contributes one parameter per output channel.

A 3x3 layer mapping 3 channels to 8 has 3*3*3*8+8=224 parameters with bias. The count is independent of image width and height because weights are shared. A dense layer connecting every input pixel to every output coordinate scales very differently.

## Trace the theoretical receptive field

Let r be the receptive-field width and j the spacing, in input pixels, between neighboring output centers. Start r=1,j=1. For a layer with effective kernel K_eff=d*(K-1)+1, r_next=r+(K_eff-1)*j and j_next=j*S. Two 3x3 stride-1 layers give r=3 then 5. If the first stride is 2, the second 3x3 layer gives r=7.

This theoretical field identifies which input coordinates can influence an output. Learned weights and nonlinearities determine how strongly they actually contribute. Padding may include positions outside the original image, so boundary outputs do not receive the same observed context as interior outputs.

## Explain the design tradeoff

Stride reduces resolution and computation but can lose localization detail. More channels provide more learned feature responses while increasing parameters and work. Write both activation shapes and parameter shapes for each proposed layer; channel count is not the same as spatial receptive-field size.
''', ['For L=10,K=3,P=0,S=2,d=1, find output length.', 'Count parameters in a biased 3x3 layer from 4 to 6 channels.', 'Find receptive-field width after three 3x3 stride-1 layers.', 'For X=(5,8,8,1), valid 3x3 stride-1 filtering with four kernels, give the output shape.'],
    ['floor((10-3)/2)+1=4.', '3*3*4*6+6=222.', 'Widths are 3,5,7, so the result is 7.', 'Height and width become 6: (5,6,6,4).'],
    'Annotate an unseen CNN with all activation shapes, parameter counts and a receptive-field calculation.', 'convolution')

add(36, 'Fourier transforms, smoothing and edges', 'CV 3.2, 3.4 and 3.5; MML 3.7 for function inner products.',
    'Interpret frequency components and connect local filtering with spectral behavior.', '''
## Represent a signal with oscillatory components

The discrete Fourier transform of N values is X_k=sum_n x_n*exp(-2*pi*i*k*n/N). The imaginary unit i satisfies i²=-1, and exp(i*theta)=cos(theta)+i*sin(theta). Each component measures alignment with a periodic pattern. The inverse transform divides by N under this normalization.

For x=[1,1,1,1], only X_0=4 is nonzero: the constant or DC component. For x=[1,-1,1,-1], X_2=4 and the others vanish. This second row alternates at the highest distinct frequency of the four-point grid. For a real signal, Fourier values have conjugate symmetry, so their complex parts describe phase without making the stored image complex.

## Magnitude and phase have different jobs

Magnitude measures component strength and phase describes alignment. Shifting a periodic signal changes phase while preserving magnitude. Two images with similar spectra can arrange their structures differently, so a magnitude plot alone does not reconstruct the spatial image.

In two dimensions, frequency directions identify how intensity oscillates across rows and columns. Fine repeated texture has strong higher-frequency content; smooth variation tends toward lower frequencies. A sharp boundary includes multiple frequencies, so edges are not a single spectral component.

## Filtering has a spectral interpretation

Circular convolution becomes pointwise multiplication of DFTs. To use FFTs for linear full convolution, pad enough to prevent circular wraparound: in 1D, at least N+K-1 entries. Boundary and normalization conventions matter. A finite zero-padded filter operation is not automatically equivalent to unpadded circular convolution.

Smoothing suppresses rapidly changing components. A difference filter suppresses DC because its coefficients sum to zero and responds to changes. Removing high frequencies may reduce noise and aliasing, but it can also blur small objects and important boundaries. Inspect both the spatial result and its spectrum.

## A practical experiment

Use NumPy FFT on constant, alternating and stripe patterns in the vision notebook. Check inverse reconstruction. Compare an average filter and a difference filter on the same row, then explain the lost or enhanced components. A frequency description complements local patch calculations; it does not replace the chosen task metric.
''', ['Find the four-point DFT of [2,2,2,2].', 'What component is nonzero for [1,-1,1,-1]?', 'For lengths N=5 and K=3, what FFT padding length prevents circular wraparound in full linear convolution?', 'Why might smoothing harm recognition of tiny objects?'],
    ['X_0=8 and X_1=X_2=X_3=0 under the stated DFT convention.', 'X_2=4; all other components are zero.', 'At least N+K-1=7.', 'Small-object structure may depend on high-frequency detail that the smoother suppresses.'],
    'Explain DC, magnitude and phase, and state the padding required before using an FFT for linear convolution.', 'convolution')

add(37, 'Affine layers, activations and expressive power', 'MML 5.6; CV 5.3.1-5.3.2.',
    'Write a shaped forward pass and explain why nonlinear activations change what a network can represent.', '''
## Compose computations with declared shapes

For N examples with D features, X has shape (N,D). A two-layer network uses Z1=XW1+b1 with W1=(D,H), A1=ReLU(Z1), then Z2=A1W2+b2 with W2=(H,C). Logits Z2 have shape (N,C); softmax turns each row into class probabilities. Biases b1=(H,) and b2=(C,) broadcast across examples.

Without the activation, the output is X*(W1W2)+(b1W2+b2). This is still a single affine map, regardless of the number of stacked affine layers. ReLU changes the mapping by selecting different active units for different inputs, giving a piecewise affine function.

## Work one forward pass

Use one row x=[1,2], W1=[[1,-1],[1,1]], b1=[0,0]. Then z1=[3,1], a1=[3,1]. Choose W2=[[1,-1],[2,1]] and b2=[0,0]. The logits are [5,-2]. Subtract the maximum to compute stable softmax from [0,-7], giving the first class high probability. Write each row and multiplication before calling an array library.

If x instead equals [-2,1], its hidden preactivation is [-1,3], so ReLU gives [0,3]. A hidden unit is inactive for that example, changing the local linear map. The pattern of active units is part of the expressive mechanism.

## A limitation of a linear decision boundary

The XOR labels on points (0,0),(0,1),(1,0),(1,1) assign different labels to diagonal versus off-diagonal corners. A single affine threshold cannot separate them. One ReLU construction is h1=ReLU(x1+x2), h2=ReLU(x1+x2-1), with output h1-2h2. At these binary inputs it gives 0,1,1,0. This demonstrates a representable pattern, not that any training run will discover the weights.

More capacity does not establish better held-out performance. It changes what functions are possible, while optimization and data determine what is learned. Keep a linear baseline so improvements have a meaningful comparison, and check that the output distribution matches the label semantics.
''', ['For X=(12,8), hidden width 5 and 3 classes, give all weight and activation shapes.', 'Combine two affine maps y=Ax+b and z=By+c into one.', 'Apply ReLU to [-2,0,3].', 'Evaluate the XOR construction at (1,1).'],
    ['W1=(8,5), b1=(5,), Z1=A1=(12,5), W2=(5,3), b2=(3,), logits=(12,3).', 'z=(BA)x+(Bb+c) under column-vector notation.', 'The output is [0,0,3].', 'h1=2,h2=1, so h1-2h2=0.'],
    'Annotate a forward pass and prove why removing every nonlinearity collapses stacked affine layers into one.', 'network')

add(38, 'Backpropagation through a two-layer network', 'MML 5.4-5.6; CV 5.3.3.',
    'Derive every weight, bias and input gradient of a small batch network.', '''
## Begin at the scalar objective

Use the previous row-batch network with mean softmax cross entropy. If P=(N,C) are probabilities and Y are one-hot targets, G2=∂L/∂Z2=(P-Y)/N. This includes the loss average once. Dividing again later would change the intended gradient scale.

Because Z2=A1W2+b2, each weight contributes its incoming activation to each affected output. Summing across examples gives dW2=A1ᵀG2 with shape (H,C). The shared bias gradient is db2=sum_rows G2 with shape (C,). Backward sensitivity to hidden activations is dA1=G2W2ᵀ, shape (N,H).

## Cross the activation and first layer

For ReLU away from zero, dZ1=dA1 elementwise multiplied by 1[Z1>0]. Then dW1=XᵀdZ1, db1=sum_rows dZ1 and dX=dZ1W1ᵀ. These shapes are (D,H), (H,) and (N,D), respectively. The mask is elementwise; the weight gradients are matrix products.

## Work the last-layer gradient numerically

Use hidden preactivation [2,-1], so a1=[2,0]. Choose W2=[[ln(3)/2,0],[2,1]] and zero output bias. The logits are [ln(3),0], giving probabilities [0.75,0.25]. For true class 0, G2=[-0.25,0.25]. The outer product gives dW2=[[-0.5,0.5],[0,0]], and db2=[-0.25,0.25]. Backward sensitivity is dA1=[-ln(3)/8,-0.25]. The ReLU mask is [1,0], so only the first component passes backward.

## Shared parameters collect all contributions

Every batch row uses the same W and b. Gradients add across rows because the objective combines their losses. A mean loss scales the sum by 1/N. A squared-weight penalty adds its derivative to the corresponding data gradient, with exactly the convention chosen for the objective.

Compute the complete backward pass using the forward-pass parameters before mutating any weight. Updating W2 before computing dA1 would differentiate a different network. Cache only the values needed for the backward formulas, verify analytic gradients on a tiny deterministic batch, and then train.

The learning notebook implements this chain in NumPy. It checks selected coordinates numerically and compares a nonlinear XOR model with a linear baseline, so the need for a hidden activation is visible.
''', ['For hidden row [1,3] and G2=[0.2,-0.2], calculate dW2.', 'If dA1=[2,-3] and Z1=[-1,4], calculate dZ1.', 'For X=(7,4), dZ1=(7,6), give the first-layer weight-gradient shape.', 'Why must parameters stay unchanged until their backward sensitivities are computed?'],
    ['The outer product is [[0.2,-0.2],[0.6,-0.6]].', 'The ReLU mask is [0,1], giving [0,-3].', 'XᵀdZ1 has shape (4,6), matching W1.', 'All derivatives must refer to the same forward computation; early updates change downstream Jacobians.'],
    'Derive the complete backward pass without looking up formulas and justify every transpose, sum and loss-normalization factor.', 'network')

add(39, 'Regularization, normalization and numerical stability', 'CV 5.3.5-5.3.6; MML 5.6 and 8.6.',
    'Explain how training aids change a computation and distinguish them from numerical safeguards.', '''
## A penalty changes the objective

If L=L_data+(lambda/2)||W||², the added gradient is lambda*W. Omitting the factor 1/2 would add 2lambda*W instead. Penalize the declared weight blocks; bias treatment is a separate choice. A penalty can reduce overfitting, but too much can prevent even a tiny subset from being fit.

## Dropout changes the training computation

With keep probability q, inverted dropout uses a random Bernoulli mask m and activation a_drop=m*a/q during training. Its conditional expectation equals a. At evaluation, remove the mask and use a directly. With q=0.5, a kept activation doubles and a dropped one becomes zero. Fix or disable this randomness during gradient checking.

The expected activation being unchanged does not mean the expected network output is unchanged through arbitrary nonlinear downstream layers. Dropout is a training procedure requiring empirical validation; it is not a substitute for representative data.

## Normalization declares an averaging axis

Training batch normalization centers and scales activations using statistics over a specified batch axis or set of axes, then applies learned scale and offset. Evaluation commonly uses stored estimates of those statistics. Layer normalization instead computes statistics within each example over designated feature axes, so it has different batch dependence.

For the chosen averaging group, write normalized=(a-mu)/sqrt(var+epsilon), then output=gamma*normalized+beta. For values [1,3], the mean is 2 and the group variance with divisor 2 is 1. Ignoring a tiny epsilon for this hand calculation, normalized values are [-1,1]. With gamma=2 and beta=0.5, outputs are [-1.5,2.5]. Both the averaging group and the learned affine adjustment belong to the computation.

At minimum, write which dimensions are averaged, where epsilon enters and which statistics are reused. Input standardization fitted once on training data is different from a normalization layer whose operation is part of each forward pass. A tiny or shifted batch can alter batch-statistic behavior.

## Stability preserves the intended formula

For binary logits z, NLL can be evaluated as max(z,0)-y*z+ln(1+exp(-|z|)). This equals binary cross entropy while avoiding huge exp(z) and subtraction of probabilities rounded to one. For multiclass logits, use logsumexp. Do not use arbitrary probability clipping to conceal an unstable calculation when a stable equivalent is available.

Check whether inputs, logits, loss and gradients are finite. Gradient clipping limits an update-related quantity according to a declared rule and changes training dynamics; it is not the same operation as pixel clipping. Compare changes independently so their effect can be understood.
''', ['Differentiate (lambda/2)||W||².', 'At keep probability 0.25, what happens to a kept activation of 2 under inverted dropout?', 'For logit z=100 and label y=0, approximate stable binary NLL.', 'Why should training and evaluation mode be stated for dropout and batch normalization?'],
    ['The gradient is lambda*W.', 'It becomes 2/0.25=8; a dropped activation becomes zero.', 'NLL≈100 because ln(1+exp(-100)) is tiny.', 'Dropout randomness and normalization statistics follow different rules in training and evaluation, changing outputs if modes are mixed.'],
    'Separate objective changes, stochastic training operations and stable equivalent formulas, and specify their behavior during gradient checking.', 'network')

add(40, 'Autograd compared with your own gradients', 'MML 5.6; CV 5.3.3; optional PyTorch autograd tutorial.',
    'Use an automatic-differentiation framework as a comparison for a derived computation.', '''
## Automatic differentiation applies the same chain rule

An autograd system records a graph of supported operations and propagates derivatives through their local rules. Reverse mode is efficient for scalar losses with many parameters. It evaluates derivatives of the executed numerical computation; it does not choose a sensible objective, detect leakage or validate the interpretation of the data.

For z=w*x+b and L=(1/2)*(z-y)², use x=2,w=3,b=1,y=5. Your hand gradients are dL/dw=4 and dL/db=2. Recreate the exact expression in a framework with floating parameters requiring gradients, call backward on the scalar loss and compare. Use its documented gradient-reset behavior before another training step, because many frameworks accumulate parameter gradients.

## A comparison worksheet

Start with a scalar graph, then a batch affine layer, then the two-layer network. Match dtype, shapes, activation convention, loss reduction and regularization. Compare forward values before gradients. A mismatch in mean-versus-sum reduction can scale every gradient while leaving the underlying chain rule correct.

In PyTorch, tensor parameters can request gradient tracking, a scalar loss can call backward(), and leaf parameters expose .grad. The linked official tutorial explains these operations. No framework is required to complete the supplied NumPy notebook; the framework comparison is an optional extension using an environment you already maintain.

## Know where a graph can stop

Turning intermediate tensors into detached arrays, extracting Python numbers for arithmetic, or executing an unsupported operation can break the differentiated path. Some in-place changes invalidate values needed for backward evaluation. A thresholded argmax is not a smooth surrogate for cross entropy and should not replace the training loss simply because it produces predicted labels.

Nondifferentiable points still require conventions. Autograd following one convention at a ReLU kink does not make a classical derivative exist there. Compare away from such points, using deterministic calculations.

## Your evidence packet

Keep a hand derivation, a finite-difference check and, if available, a framework comparison for the same small example. Agreement across these independent views is stronger evidence than a loss curve alone. Finish by writing a shaped forward and backward pass for the next CNN lesson. A framework saves bookkeeping; your maths explains what that bookkeeping is doing.
''', ['For L=(wx+b-y)²/2 with x=3,w=2,b=0,y=4, find dL/dw and dL/db.', 'Why can calling backward twice without resetting gradients change the values you inspect?', 'What should be compared before comparing gradients?', 'Why is argmax classification accuracy usually unsuitable as the differentiable training objective?'],
    ['z=6 and residual=2, so dL/dw=2*3=6 and dL/db=2.', 'Many frameworks add newly computed gradients to existing stored ones rather than replacing them.', 'Forward values, shapes, dtype and the exact loss expression and reduction.', 'Argmax decisions are piecewise constant and discontinuous at boundaries, giving no useful ordinary gradient for most parameter settings.'],
    'Produce a matched hand, numerical and optional framework derivative comparison, and explain why autograd does not guarantee a correct learning problem.', 'network')

add(41, 'CNN classification, inductive bias and augmentation', 'CV 5.4 and 6.2; optional CS231n convolutional-network notes.',
    'Connect local shared weights to a trainable image classifier and choose label-preserving transformations.', '''
## A CNN chooses a structured family of functions

A convolutional layer uses local patches and shared kernels, encoding a preference that the same visual pattern can matter at different positions. An activation changes the local response nonlinearly. Further layers can combine simpler responses into broader patterns. These architectural assumptions are an inductive bias: they guide learning but do not guarantee performance on a particular task.

For X=(N,8,8,1), a valid 3x3 layer with four kernels gives (N,6,6,4). ReLU keeps that shape. Flattening gives (N,144), and a dense two-class head uses W=(144,2), b=(2,). The convolution has 3*3*1*4+4=40 parameters; the head has 144*2+2=290. Total trainable parameters are 330.

## Shared weights also share gradient contributions

An output response is z_nijc=sum_abd X_n,i+a,j+b,d*K_abdc+b_c. Its kernel gradient accumulates input-patch values weighted by upstream sensitivities across every sample and placement. Weight sharing is present in both the forward and backward calculations. The notebook uses NumPy patch extraction and array contractions for this small CNN, and checks selected gradients before training.

## Equivariance differs from invariance

In an ideal interior stride-1 setting, shifting an input shifts a corresponding feature map: this is translation equivariance. Invariance would mean an unchanged final output. Padding, subsampling, cropping and a dense flattened head can change this behavior. Pooling or global aggregation can reduce sensitivity to location but may also discard information needed for localization.

## Augmentation expresses a task assumption

An augmentation must preserve the intended target, or transform it consistently. A horizontal flip may preserve a bar-orientation label but may alter a directional symbol. For detection, boxes must move with the image; for segmentation, masks must follow the same spatial transform. Adding unrealistic changes can train a different problem from the one you intend to solve.

Compare a CNN and linear baseline on the same synthetic bars and split. Then test a declared distribution change, such as new noise or positions, without retuning on those test outcomes. High toy accuracy teaches mechanics; it is not evidence of broad real-image recognition ability.

Save filter responses, one correct prediction and one failure or stressful case. Explain the shapes, objective and architectural assumptions before discussing accuracy. This connects the entire course: linear maps, local filtering, probabilities, gradients and evaluation.
''', ['Count convolution parameters for a biased 3x3 layer from one to four channels.', 'For the worked 8x8 CNN, give the flattened feature dimension.', 'Why does shifting a feature map not imply unchanged class scores?', 'How should a horizontal flip affect a box [x1,y1,x2,y2] in an image of width W using boundary coordinates?'],
    ['3*3*1*4+4=40.', '6*6*4=144.', 'The classifier head or pooling/stride/boundary choices may depend on where features occur.', 'The flipped box is [W-x2,y1,W-x1,y2], with the image and labels transformed together.'],
    'Explain an end-to-end CNN forward and backward computation, its parameter count and one task-specific augmentation assumption.', 'network')

add(42, 'Bounding boxes, localization losses and IoU', 'CV 6.3; revisit CV 5.3.4 for training objectives.',
    'Compute box overlap and distinguish localization training from detection evaluation.', '''
## A detection predicts what and where

Classification assigns an image label. Detection assigns classes and locations to a variable number of objects. A simple single-object exercise can output four box coordinates plus class scores; a general detector needs a method for proposing predictions, associating them with targets and handling no-object cases.

Use continuous boundary coordinates (x1,y1,x2,y2) with x2≥x1,y2≥y1. Area is (x2-x1)*(y2-y1). Under this convention there is no extra +1. A center-width-height parameterization gives x1=cx-w/2 and x2=cx+w/2; normalize coordinates by image dimensions only when the loss and conversion consistently use that convention.

## Work intersection over union

For boxes A=[0,0,2,2] and B=[1,0,3,2], overlap width is max(0,min(2,3)-max(0,1))=1 and height is 2. Intersection area is 2. Each box has area 4, so union is 4+4-2=6 and IoU=1/3. Disjoint boxes have intersection zero. Declare a policy for zero-area unions rather than dividing by zero silently.

## The loss can have multiple parts

A toy loss might be L_class+lambda*L_box, where L_box sums coordinate errors for a matched object. The units, coordinate scaling, number of matches and averaging convention affect relative magnitudes. Smooth L1 with threshold delta uses 0.5*r²/delta for |r|<delta and |r|-0.5delta otherwise. It behaves quadratically near zero and linearly for large errors.

IoU-based objectives target overlap directly, but plain IoU can provide unhelpful gradients when boxes do not overlap. Training objectives and evaluation criteria need not be identical. A coordinate loss can improve even while an IoU thresholded metric remains unchanged.

## Association and duplicate predictions matter

Evaluation matches predictions with ground-truth objects under a declared class and overlap rule. One object should not normally generate several true positives from duplicate detections. Non-maximum suppression orders predictions by score and suppresses highly overlapping alternatives under a chosen rule; it is a postprocessing choice with task-dependent effects.

The workbench moves a predicted box around a fixed target and updates intersection, union and IoU. Compute one position yourself before inspecting the result. Treat a single-object localization lab as a stepping stone, not a full benchmark detector.
''', ['Find IoU of [0,0,2,2] and [1,1,3,3].', 'Convert center (4,3), width 2, height 4 to boundary coordinates.', 'Evaluate Smooth L1 with delta=1 at residuals 0.5 and 2.', 'Why should two duplicate boxes not both count as true positives for one object?'],
    ['Intersection=1, union=4+4-1=7, so IoU=1/7.', 'The box is [3,1,5,5].', 'At 0.5: 0.5*0.25=0.125. At 2: 2-0.5=1.5.', 'One ground-truth object can be matched once under the declared protocol; otherwise duplicates would inflate recall and precision.'],
    'Calculate a box metric with explicit coordinate conventions and explain the output, training objective and matching rule of a localization task.', 'iou')

add(43, 'Segmentation and class imbalance', 'CV 6.4; revisit CV 5.3.4 for classification losses.',
    'Define pixelwise prediction and explain why background accuracy can mislead.', '''
## Predict a label for every pixel

Semantic segmentation assigns one class per pixel. An image batch (N,H,W,C_in) may produce logits (N,H,W,C_classes). Softmax applies across the class axis independently at each pixel, while the loss aggregates over examples and valid pixel positions. Binary foreground segmentation can instead use one sigmoid logit per pixel.

The target mask contains categorical labels, with any ignore label excluded from the declared loss and metrics. Instance segmentation additionally distinguishes separate objects of the same class. A foreground mask alone does not provide instance identities.

## Work a background-dominated example

Suppose a 100-pixel mask has 10 foreground pixels and 90 background pixels. Predicting background everywhere gives 90% pixel accuracy but zero foreground recall and zero foreground IoU. The number looks strong only because most pixels belong to a class that requires no object detection.

For foreground TP=6,FP=2,FN=4, IoU=TP/(TP+FP+FN)=6/12=0.5. Dice=2TP/(2TP+FP+FN)=12/18=2/3. True negatives do not appear in either foreground overlap measure. Report which classes are averaged and how absent classes or empty masks are handled.

## Choose the loss and its weights deliberately

Pixelwise cross entropy treats each labeled pixel as a contribution. Class weights can increase rare-class influence, but they change the effective objective and can affect calibration. Dice-style losses use overlap-related ratios with stated smoothing constants and reduction axes. They are not identical to thresholded Dice evaluation, especially when applied to soft probabilities.

For binary probabilities p_i and targets y_i, one soft Dice convention is (2*sum p_i*y_i+epsilon)/(sum p_i+sum y_i+epsilon). Other definitions square terms or average differently. Name the formula, whether it is per-image or pooled, and which labels are excluded.

## Resolution and alignment matter

Strided features may need upsampling before predicting a full-resolution mask. Check that output pixels correspond to target locations; good-looking shapes can hide shifts from padding or resizing. Apply every spatial augmentation identically to image and mask while preserving class semantics.

In the vision notebook, a simple trainable pixel classifier segments synthetic bright rectangles. Compare its foreground IoU with the all-background baseline and inspect noisy boundaries. This teaches output, loss and metric mechanics before a more expressive segmentation architecture is needed.
''', ['For 200 pixels with 5% foreground, find accuracy of predicting all background.', 'For TP=8,FP=2,FN=4, calculate foreground IoU and Dice.', 'Give the logit shape for a batch of 4 images, each 32x48, with three semantic classes.', 'Does adding rare-class weight leave the original unweighted cross-entropy objective unchanged?'],
    ['There are 190 background pixels, so accuracy=190/200=0.95.', 'IoU=8/(8+2+4)=4/7; Dice=16/(16+2+4)=8/11.', 'Under channel-last convention, shape is (4,32,48,3).', 'No. It changes the contributions to the loss and therefore the optimized objective.'],
    'Specify segmentation outputs, class axis, ignored pixels, loss reduction and overlap metrics, then explain an all-background failure.', 'masks')

add(44, 'Precision, recall, AP and mask metrics', 'CV 6.2-6.4; optional official COCO evaluation implementation.',
    'Calculate threshold-based and ranking-based metrics under a declared evaluation protocol.', '''
## Count outcomes before computing ratios

Precision=TP/(TP+FP) asks how many predicted positives are correct. Recall=TP/(TP+FN) asks how many real positives were found. For TP=8,FP=2,FN=4, precision is 0.8 and recall is 2/3. F1=2TP/(2TP+FP+FN)=8/11. State policies for a zero denominator and whether counts are pooled across classes or computed separately.

Changing a confidence threshold changes which predictions remain. Lowering it often increases recall and can reduce precision, but the empirical curve depends on the ordered outcomes. A threshold selected to meet an operating requirement belongs to validation, followed by held-out evaluation.

## A small ranking calculation

Take two true objects and three detections ordered by decreasing score. After class-aware one-to-one matching at a fixed IoU threshold, their outcomes are TP,FP,TP. Precision at each rank is 1,1/2,2/3 and recall is 1/2,1/2,1. Under a simple noninterpolated AP convention, sum precision at each true-positive rank and divide by the two ground-truth objects: AP=(1+2/3)/2=5/6.

AP conventions vary. Some use an interpolated precision envelope and sampled recall points; benchmark reports also specify categories, overlap thresholds, size ranges and maximum detections. A toy AP function should not be advertised as an official benchmark evaluator. COCO's official implementation evaluates multiple IoU thresholds from 0.50 to 0.95 and a sampled recall grid; use its protocol for a COCO result.

## Class averaging changes the question

Macro averaging gives classes equal weight. Micro averaging pools counts, giving frequent classes more influence. Mean AP averages per-class AP under the stated protocol. Mean IoU for segmentation averages class overlaps under a declared absent-class policy. A pooled pixel accuracy answers a different question from class-balanced overlap.

## A report you can interpret

For recognition: class counts, accuracy, confusion matrix and probability quality. For detection: matching, score thresholds or AP convention, coordinate format and IoU thresholds. For segmentation: foreground or class-wise IoU/Dice, valid pixels and empty-mask policy. Include failure images and sampling uncertainty when the evaluation supports it.

Choose the metric because it answers the deployment question, not because it is largest. The vision notebook calculates transparent toy metrics and labels its AP convention explicitly.
''', ['For TP=6,FP=3,FN=2, calculate precision and recall.', 'For ranked outcomes TP,FP,TP and two targets, compute the lesson’s noninterpolated AP.', 'Why can micro and macro averages disagree on imbalanced classes?', 'What must be specified before comparing two detection AP numbers?'],
    ['Precision=6/9=2/3; recall=6/8=0.75.', 'Positive ranks have precision 1 and 2/3; AP=(1+2/3)/2=5/6.', 'Micro pools counts and gives frequent classes more influence; macro gives each included class equal weight.', 'Class set, matching and duplicate policy, IoU threshold(s), recall interpolation/sampling, size ranges and prediction limits where applicable.'],
    'Explain a complete evaluation protocol and compute its small-case metrics by hand, including denominators and matching choices.', 'iou')

add(45, 'Choose a question, protocol and baseline', 'Revisit MML 8.6 and CV 6.2-6.4 for your chosen task.',
    'Turn a broad interest into an experiment with a testable hypothesis.', '''
## Start with one answerable question

Choose recognition, single-object localization or binary segmentation. For recognition, a question could be: does a small CNN improve bar-orientation accuracy under held-out noise compared with a linear classifier? It names the comparison, task and evaluation condition. A vague goal such as “build the best vision model” supplies no controlled decision.

The supplied notebooks use generated data so you can understand targets, coordinates and noise without needing a download. Real datasets are a later extension with additional questions about labeling, access and sampling. A synthetic result establishes behavior for its generator; do not treat it as evidence of real-scene robustness.

## Write a protocol before fitting

Declare the generator or dataset, sample counts, class balance, split and grouping rule, seed and preprocessing. Define the primary metric and a secondary diagnostic. Keep the test set separate until the comparison is fixed. Reserve an optional shifted evaluation set for one declared change, such as increased noise, and label it as a distinct distribution.

## Pick a baseline you can explain

For recognition, use nearest-centroid or linear softmax regression. For localization, a fixed average box can reveal whether a learned predictor does more than memorize typical geometry. For segmentation, use all-background and a simple intensity classifier. A weak baseline can still expose metric pitfalls, while a stronger transparent one helps judge the value of extra complexity.

Your hypothesis should predict both improvement and a possible limitation. For example, local shared kernels may help recognize shifted bars, while a flattened head can remain position-sensitive. State what observation would fail to support the hypothesis.

## Connect choices to maths

Name the input representation and its dimension, parameter shapes, output distribution, loss reduction and evaluation denominator. Identify where training-only fitted statistics enter. A mathematical justification makes the procedure inspectable; it is not a promise that the chosen model will outperform its baseline.

## Deliver the experiment plan

Use the capstone template in the library. Fill the question, hypothesis, data protocol, baseline, one improvement, fixed comparison conditions and planned failure analysis. Finish this before training so the experiment has a stable interpretation. If a practical issue changes the plan, record the change and preserve the original question rather than retrospectively rewriting the hypothesis to match results.
''', ['Write a one-sentence comparison question for recognition.', 'Give a segmentation baseline and a metric that reveals its weakness.', 'List four decisions that should be fixed before testing.', 'What does successful recognition on generated bars demonstrate?'],
    ['One possible answer: “Does a small CNN outperform linear softmax on held-out noisy 8x8 bars under the same split and training budget?”', 'All-background is a baseline; foreground IoU or recall reveals its failure when objects are present.', 'Split/grouping rule, preprocessing, primary metric and model-selection procedure; also record seeds and evaluation conditions.', 'It demonstrates behavior for the declared synthetic generator and split, not general performance on real-world images.'],
    'Submit a specific question, hypothesis and fixed evaluation protocol that can be reproduced without this chat.', 'network')

add(46, 'Controlled comparisons and reproducibility', 'MML 8.6; revisit the optimization diagnostics from Lesson 32.',
    'Separate a measured improvement from an uncontrolled difference between runs.', '''
## Change one declared factor

Compare a baseline with one justified modification while keeping data splits, preprocessing and evaluation fixed. If the CNN changes architecture, optimizer, training budget and augmentation at once, a gain cannot identify which change helped. A bundled comparison may still be useful, but it supports a narrower claim about the whole procedure.

An ablation removes or changes one component to test its contribution. For example, compare the same network with and without a nonlinear activation, or with and without a declared augmentation. Use a training budget and model-selection procedure suitable to the question; equal update counts and equal compute costs answer different questions.

## Use repeats carefully

Different seeds change initialization and data order. Repeat a fixed procedure with a small predeclared set of seeds and report individual results plus a summary. With three accuracies 0.80,0.82,0.78, the mean is 0.80 and sample standard deviation is 0.02. This variation across training runs differs from test-sampling uncertainty for one fixed model.

When comparing models on the same test images, retain paired outcomes. Improvements can come from a few changed predictions, and the covariance between their errors matters. A larger mean from a few trials is evidence with limited precision, not automatic proof of a reproducible gain.

## Make the computation repeatable

Record generator or dataset version, sample identifiers, seed, parameter shapes, dtype, training schedule, loss reduction and metric implementation. Save the selected parameters and the exact preprocessing statistics. Include run instructions and a known small sanity case. A fixed seed can help reproduce a run, though hardware and implementation details may still affect numerical results.

## Report the evidence at its proper scope

Write the result before its explanation: “On this held-out synthetic set, accuracy changed from A to B.” Then give a supported interpretation and a remaining hypothesis. Report failed experiments and settings when they affect interpretation. Do not select only the seed that makes the improvement look best.

In your capstone, run the unchanged baseline and one improvement, collect a table with counts and uncertainty type, and save at least three failure examples or stressful cases. You may extend to another task later; the required project is one complete controlled comparison.
''', ['Find mean and sample standard deviation of [0.7,0.8,0.9].', 'Why is changing optimizer and architecture simultaneously hard to interpret?', 'Does averaging three training seeds remove uncertainty about the test population?', 'List information needed to reproduce a fitted preprocessing pipeline.'],
    ['Mean=0.8; sample variance=(0.01+0+0.01)/2=0.01, so standard deviation=0.1.', 'The result measures a bundled change, so either factor or their interaction could explain the difference.', 'No. Training-run variation and test-sampling uncertainty are different and both may matter.', 'Training split identifiers, scaling/centering statistics, selected feature basis, code and parameter settings.'],
    'Produce a controlled comparison table and state exactly which differences its results can support.', 'optimization')

add(47, 'Errors, uncertainty and domain shift', 'MML 8.6; revisit CV Chapters 5-6 and Lesson 24.',
    'Audit failure patterns and distinguish observed evidence from explanations requiring another experiment.', '''
## Inspect errors as data

For each wrong prediction, record the input, target, prediction, confidence, preprocessing and relevant object attributes. Sort by groups such as noise, position, class or object size. A few memorable images can suggest a problem but cannot estimate its prevalence; compute group counts and metrics alongside examples.

If there are no natural failures in a simple toy set, use a declared stress test such as more noise or an unseen position range. Keep it separate from the original evaluation. Do not silently redefine the test set after seeing the results, and do not manufacture failure examples while reporting them as random samples.

## A confidence score is one type of uncertainty

Softmax can be highly confident on unfamiliar inputs. Calibration is a relationship between predicted probabilities and outcomes in a particular population; it is not guaranteed to transfer. Sampling intervals for accuracy describe uncertainty in the measured metric, while parameter uncertainty describes sensitivity to different plausible models. State which you are analyzing.

## Shift changes what performance means

Domain shift can alter input appearance, class prevalence, label meaning or the relation between input and target. Changing bar brightness is a different test from changing the fraction of vertical bars. Bayes Lesson 21 explains why altered prevalence can change precision even when class-conditional detection rates remain fixed.

Suppose precision falls on a new dataset. Candidate explanations include more false positives, rarer positives, different annotations or a changed threshold. The metric alone does not identify which cause occurred. Compare conditional rates, counts and data conventions before proposing a remedy.

## Test an explanation

If you suspect downsampling removes small objects, hold other generator properties fixed and vary object size. If you suspect sensitivity to contrast, vary contrast with labels and position held fixed. A targeted controlled experiment strengthens a causal interpretation within that synthetic setup. It does not establish that the same explanation holds for every real distribution.

## Write the limits plainly

List sample size, generator assumptions, absent classes, unresolved errors and evaluation choices that could change the conclusion. Give a next experiment with a measurable predicted outcome. A useful report explains where the method works, where it has been tested and what remains uncertain, rather than treating every failure as a reason to increase model size.
''', ['Name two different kinds of domain shift for synthetic bars.', 'Why can unchanged recall coexist with worse precision after a prevalence change?', 'How would you test whether contrast causes an error pattern?', 'Does a narrow confidence interval on one test set prove robustness to a new distribution?'],
    ['An input shift such as stronger noise, and a prevalence shift such as far fewer vertical bars. Position or label changes are other distinct cases.', 'Precision conditions on predicted positives and depends on prevalence as well as class-conditional positive and false-positive rates.', 'Vary contrast while keeping label, position, noise protocol and model fixed; compare errors and counts over repeated generated samples.', 'No. It addresses sampling uncertainty under its population assumptions, not arbitrary distribution shift.'],
    'Deliver three analyzed cases, group-level evidence, one tested explanation and one clearly labeled unresolved hypothesis.', 'bayes')

add(48, 'Read a method and defend your maths', 'Revisit the MML and CV sections used by your project; choose one original paper after matching its prerequisites.',
    'Map a research method to a concrete computation and defend the choices in your own project.', '''
## Translate a method before judging it

For any method description, identify the inputs, learned parameters, output representation, objective and evaluation protocol. Annotate the shape and meaning of every major symbol. Separate a mathematical guarantee from an empirical result on a particular dataset. A theorem's assumptions are part of the claim, not optional fine print.

Begin with the abstract and figures to locate the question, then read the method and the parts of the experiments that test it. Use related work to understand comparisons after you can describe the proposed computation. A new name does not explain what the model optimizes; reconstruct the forward pass and loss in your own notation.

## Check the evidence

Ask which baselines are compared, whether training and model-selection budgets differ, and what ablations isolate. Locate dataset splits, grouping, metric conventions and uncertainty reporting. A result can be well measured yet limited to its tested setting. Distinguish the authors' interpretation from the quantity directly observed.

## Reconnect the course

Linear algebra explains representations and layers. Calculus supplies sensitivities and backpropagation. Probability defines model outputs and observation assumptions. Optimization supplies update rules. Image mathematics explains sampling and shared local operations. Evaluation turns predictions into evidence. Use these connections to explain your own capstone from input to conclusion.

## Your final deliverable

Write a 3-5 page report with question, data protocol, baseline, one improvement, results, failure analysis and limitations. Include runnable code or notebooks, seeds, preprocessing statistics and a concise reproduction command or sequence. Give a ten-minute explanation of one forward pass, one derivative, one training update and one metric calculation.

Use the capstone template's rubric to check whether another reader could reproduce and interpret the comparison. A high score on a toy task is not the only success criterion: a correct and candid negative result can demonstrate strong mathematical understanding.

## Where to deepen next

Choose further study from a concrete need: camera geometry for 3D vision, stronger statistics for uncertainty, more numerical methods for difficult optimization, or a specific architecture paper after its prerequisites. The Guo book can supply later geometry enrichment. This course supplies a connected core for deep-learning vision; specialist advanced topics still need focused study and practice.
''', ['List five items you must identify in a new method.', 'Distinguish an empirical benchmark result from a mathematical guarantee.', 'Give a complete input-to-metric explanation of your capstone in five sentences.', 'Name one next topic and explain which gap in your project motivates it.'],
    ['Inputs, parameters, outputs, objective and evaluation protocol, with the assumptions and shapes that define them.', 'A benchmark result measures a stated procedure on particular data; a guarantee is a conditional logical statement under specified assumptions.', 'A satisfactory answer declares representation and shapes, forward computation, loss assumptions, training updates and evaluation protocol without skipping preprocessing or selection.', 'For example, camera geometry is motivated by estimating 3D structure from views; probability calibration is motivated by unreliable confidence. Choose based on a specific need.'],
    'Defend your complete project with one worked calculation from each mathematical pillar and a clear account of the limits of its evidence.', 'network')

assert [l['id'] for l in lessons] == list(range(5,49))
(BASE/'later-lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Authored {len(lessons)} continuation lessons and {sum(len(l["exercises"]) for l in lessons)} exercises with solutions.')
