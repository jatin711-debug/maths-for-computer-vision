/* Primers for Modules 04-07 (Lessons 13-28). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  add(13, {
    builds: [{lesson: 7, why: 'a matrix map can be applied again; det 0 means squashed'}, {lesson: 8, why: 'a nonzero vector sent to zero signals a null space'}, {lesson: 6, why: 'a zero dot product means perpendicular'}],
    recall: ['determinant', 'matrix-multiplication', 'diagonal-matrix', 'identity-matrix', 'null-space'],
    symbols: [
      ['v', 'eigenvector: a nonzero direction the matrix only stretches, shrinks or flips', 'eigenvector'],
      ['λ', 'eigenvalue: the number that eigenvector is multiplied by (it may be negative)', 'eigenvalue']
    ],
    terms: [
      {
        id: 'eigenvector', term: 'Eigenvector', symbol: T`Av=\lambda v`,
        plain: T`A nonzero vector that a square matrix sends to a multiple of itself. The matrix may stretch it, shrink it or flip it, but the result stays on the same line through the origin. Eigenvectors are the directions a map does not turn, which is why they explain repeated transformations, PCA and curvature.`,
        formula: T`Av=\lambda v,\qquad v\neq0`,
        steps: [T`Multiply the matrix by the candidate vector to get \(Av\).`, T`Check whether \(Av\) is one number times \(v\). Divide matching entries; entries that are 0 in \(v\) must also be 0 in \(Av\).`, T`If every ratio is the same, \(v\) is an eigenvector and that ratio is its eigenvalue. If the ratios differ, it is not an eigenvector.`],
        examples: [[T`\(A=\operatorname{diag}(3,1),\ v=(1,0)\)`, T`\(Av=(3,0)=3v\): eigenvector, \(\lambda=3\)`], [T`\(A=\begin{bmatrix}2&1\\1&2\end{bmatrix},\ v=(1,1)\)`, T`\(Av=(3,3)=3v\): eigenvector, \(\lambda=3\)`], [T`same \(A\), \(v=(1,-1)\)`, T`\(Av=(1,-1)=1v\): eigenvector, \(\lambda=1\)`], [T`same \(A\), \(v=(1,0)\)`, T`\(Av=(2,1)\), not a multiple of \((1,0)\): not an eigenvector`]],
        pitfall: T`Any nonzero multiple of an eigenvector is also an eigenvector with the same eigenvalue, so \((2,2)\) works as well as \((1,1)\). The zero vector never counts, because \(A0=\lambda0\) for every \(\lambda\).`,
        seeAlso: [15, 51]
      },
      {
        id: 'eigenvalue', term: 'Eigenvalue', symbol: T`\lambda`,
        plain: T`The number an eigenvector is multiplied by. A size above 1 stretches that direction, below 1 shrinks it, and a negative sign flips it. Applying the map \(k\) times multiplies the eigenvector by \(\lambda^k\), so eigenvalues predict growth, decay and alternation under repetition.`,
        formula: T`A^kv=\lambda^kv,\qquad x=av_1+bv_2\ \Rightarrow\ A^kx=a\lambda_1^kv_1+b\lambda_2^kv_2`,
        steps: [T`Find \(\lambda\) from \(Av=\lambda v\), or from the characteristic equation.`, T`For \(k\) repeated applications, raise it to the power \(k\): \(A^kv=\lambda^kv\).`, T`For a vector built from eigenvectors, scale each piece by its own \(\lambda^k\) and add the pieces.`],
        examples: [[T`\(\lambda=2\), applied 1, 2, 3 times`, T`factors \(2,\ 4,\ 8\): grows`], [T`\(\lambda=-2\), applied 1, 2, 3 times`, T`factors \(-2,\ 4,\ -8\): flips each time and grows`], [T`\(\lambda=0.5\), applied 1, 2, 3 times`, T`factors \(0.5,\ 0.25,\ 0.125\): shrinks towards 0`], [T`\(A=\operatorname{diag}(3,1)\), \(x=(2,1)\), three times`, T`\((2\cdot3^3,\ 1\cdot1^3)=(54,1)\)`]],
        pitfall: T`Eigenvalues can be negative or zero; singular values (Lesson 14) never are. You can read eigenvalues off the diagonal of a diagonal matrix, but not off the entries of a general matrix.`,
        seeAlso: [14, 15, 20, 29, 32]
      },
      {
        id: 'characteristic-equation', term: 'Characteristic equation (finding eigenvalues)', symbol: T`\det(A-\lambda I)=0`,
        plain: T`The equation whose solutions are the eigenvalues. \(Av=\lambda v\) means \((A-\lambda I)v=0\) for a nonzero \(v\). That happens exactly when \(A-\lambda I\) squashes some direction to zero, that is when its determinant is zero. For a 2×2 matrix it is a quadratic in \(\lambda\).`,
        formula: T`\det\begin{bmatrix}a-\lambda&b\\c&d-\lambda\end{bmatrix}=(a-\lambda)(d-\lambda)-bc=0`,
        steps: [T`Subtract \(\lambda\) from each diagonal entry of \(A\). (\(I\) is the identity matrix, so nothing else changes.)`, T`Write the determinant of that matrix and set it equal to zero.`, T`Solve the quadratic: factor it, or use \(\lambda=\tfrac{t\pm\sqrt{t^2-4D}}{2}\) with \(t=a+d\) and \(D=ad-bc\).`, T`For each \(\lambda\), find a nonzero \(v\) with \((A-\lambda I)v=0\).`],
        examples: [[T`\(\begin{bmatrix}2&1\\1&2\end{bmatrix}\)`, T`\((2-\lambda)^2-1=0\Rightarrow\lambda=3\) with \(v=(1,1)\), or \(\lambda=1\) with \(v=(1,-1)\)`], [T`\(\begin{bmatrix}4&1\\2&3\end{bmatrix}\)`, T`\(\lambda^2-7\lambda+10=0\Rightarrow\lambda=5\) with \(v=(1,1)\), or \(\lambda=2\) with \(v=(1,-2)\)`], [T`\(\operatorname{diag}(2,-1)\)`, T`\((2-\lambda)(-1-\lambda)=0\Rightarrow\lambda=2,\ -1\) with \(v=(1,0),\ (0,1)\)`], [T`\(\begin{bmatrix}0&-1\\1&0\end{bmatrix}\)`, T`\(\lambda^2+1=0\): no real solution, because a 90° rotation turns every direction`]],
        pitfall: T`Solving the equation gives only the eigenvalues; you still have to find each eigenvector. A repeated eigenvalue need not come with two independent eigenvectors.`,
        seeAlso: [15]
      },
      {
        id: 'symmetric-matrix', term: 'Symmetric matrix', symbol: T`A=A^T`,
        plain: T`A square matrix that equals its own transpose: the entry in row \(i\), column \(j\) equals the entry in row \(j\), column \(i\). Covariance matrices and Hessians are symmetric, and symmetric matrices have the best-behaved eigenvectors: their eigenvalues are real and their eigenvectors can be chosen perpendicular.`,
        formula: T`A_{ij}=A_{ji}\quad\text{for every }i,j`,
        steps: [T`Mirror the matrix across its main diagonal and compare with the original.`, T`Find its eigenvalues and eigenvectors.`, T`Check perpendicularity with a dot product (it should be 0). Divide each eigenvector by its length if you need an orthonormal basis.`],
        examples: [[T`\(\begin{bmatrix}2&1\\1&2\end{bmatrix}\)`, T`symmetric; eigenvectors \((1,1)\) and \((1,-1)\) have dot product \(1-1=0\)`], [T`unit-length versions`, T`\((1,1)/\sqrt2\approx(0.707,0.707)\) and \((1,-1)/\sqrt2\approx(0.707,-0.707)\)`], [T`\(\begin{bmatrix}4&1\\2&3\end{bmatrix}\)`, T`not symmetric; eigenvectors \((1,1)\) and \((1,-2)\) have dot product \(-1\), so they are not perpendicular`]],
        pitfall: T`A non-symmetric matrix can still have real eigenvalues, but its eigenvectors need not be perpendicular. Only square matrices can be symmetric.`,
        seeAlso: [15, 20, 29, 51]
      },
      {
        id: 'complex-eigenvalue', term: 'Complex numbers and complex eigenvalues', symbol: T`\lambda=a\pm bi`,
        plain: T`A complex number \(a+bi\) pairs a real part \(a\) with an imaginary part \(b\), where \(i\) is a new number with \(i^2=-1\). Some real matrices, such as rotations, keep no direction on its own line, so they have no real eigenvalues. Their characteristic equation then has complex solutions, which signal turning rather than stretching.`,
        formula: T`i^2=-1,\qquad \sqrt{-q}=i\sqrt q\ \ (q>0),\qquad \begin{bmatrix}a&-b\\b&a\end{bmatrix}\ \text{has}\ \lambda=a\pm bi`,
        steps: [T`Solve the characteristic equation as usual.`, T`If the quadratic formula needs the square root of a negative number, write \(\sqrt{-q}=i\sqrt q\).`, T`Complex results \(a\pm bi\) mean the map rotates; their size \(\sqrt{a^2+b^2}\) is the stretch per application.`],
        examples: [[T`\(i^2\) and \((2i)^2\)`, T`\(-1\) and \(-4\)`], [T`\(\sqrt{-4}\)`, T`\(2i\)`], [T`90° rotation \(\begin{bmatrix}0&-1\\1&0\end{bmatrix}\)`, T`\(\lambda^2+1=0\Rightarrow\lambda=\pm i\), size 1: a pure quarter turn`], [T`\(\begin{bmatrix}1&-1\\1&1\end{bmatrix}\)`, T`\((1-\lambda)^2+1=0\Rightarrow\lambda=1\pm i\), size \(\sqrt2\approx1.414\): turns 45° and stretches`]],
        pitfall: T`Complex eigenvalues of a real matrix come in pairs \(a\pm bi\). Symmetric matrices never have them, which is one reason covariance matrices are easy to analyse. Lesson 36 develops complex numbers further.`
      },
      {
        id: 'positive-definite-matrix', term: 'Positive-definite matrix', symbol: T`x^TAx>0`,
        plain: T`A symmetric matrix \(A\) is positive definite when the single number \(x^TAx=x\cdot(Ax)\) is positive for every nonzero vector \(x\): the map never turns a vector 90° or more away from itself. Equivalently, all its eigenvalues are positive. Such matrices describe bowl-shaped losses with one lowest point, and systems \(Ax=b\) with them always have exactly one solution.`,
        formula: T`x^TAx>0\ \text{for all }x\neq0\iff\text{all eigenvalues of }A>0;\qquad x^T(A^TA+\lambda I)x=\|Ax\|_2^2+\lambda\|x\|_2^2`,
        steps: [T`Compute \(Ax\), then the dot product of \(x\) with it: \(x^TAx\) is one number.`, T`Or find all the eigenvalues and check that every one is positive.`, T`For \(A^TA+\lambda I\) with \(\lambda>0\): \(x^TA^TAx=\|Ax\|^2\ge0\) and \(\lambda\,x^Tx>0\) for \(x\neq0\), so the sum is always positive.`],
        examples: [[T`\(\begin{bmatrix}2&1\\1&2\end{bmatrix},\ x=(1,-1)\)`, T`\(Ax=(1,-1)\), \(x^TAx=2>0\); eigenvalues \(3,1\): positive definite`], [T`\(\begin{bmatrix}1&2\\2&1\end{bmatrix},\ x=(1,-1)\)`, T`\(Ax=(-1,1)\), \(x^TAx=-2<0\); eigenvalues \(3,-1\): not positive definite`], [T`\(A^TA=\begin{bmatrix}1&1\\1&1\end{bmatrix}\) for \(A=[1\ \ 1]\)`, T`eigenvalues \(2,0\): \(x=(1,-1)\) gives 0, so not positive definite`], [T`add \(\lambda I\) with \(\lambda=1\)`, T`eigenvalues \(3,1\): positive definite, as ridge regression needs`]],
        pitfall: T`Positive entries are not enough: \(\begin{bmatrix}1&2\\2&1\end{bmatrix}\) has an eigenvalue of \(-1\). Allowing \(x^TAx=0\) gives the weaker positive semidefinite condition (Lesson 31).`,
        seeAlso: [20, 29, 31]
      }
    ]
  });

  add(14, {
    builds: [{lesson: 13, why: 'singular values come from eigenvalues of AᵀA'}, {lesson: 11, why: 'orthonormal columns and singular values in conditioning'}, {lesson: 8, why: 'rank counts independent directions'}],
    recall: ['singular-value', 'orthonormal-columns', 'transpose', 'rank', 'eigenvalue'],
    symbols: [
      ['U, V', 'columns are perpendicular unit directions: V for inputs, U for outputs', 'singular-value-decomposition'],
      ['Σ', 'diagonal matrix of singular values: stretch factors, never negative, largest first', 'singular-value-decomposition']
    ],
    terms: [
      {
        id: 'singular-value-decomposition', term: 'Singular value decomposition (SVD)', symbol: T`A=U\Sigma V^T`,
        plain: T`Any matrix, square or rectangular, can be split into three simple steps: turn the input onto perpendicular directions (\(V^T\)), stretch each direction by a non-negative singular value (\(\Sigma\)), then turn the result into output directions (\(U\)). Ranking the stretches from largest to smallest shows which directions carry most of the matrix.`,
        formula: T`A=U\Sigma V^T=\sum_i\sigma_iu_iv_i^T,\qquad \sigma_1\ge\sigma_2\ge\dots\ge0,\qquad U^TU=V^TV=I`,
        steps: [T`Compute \(A^TA\) and find its eigenvalues (Lesson 13).`, T`Take their square roots, largest first: these are the singular values \(\sigma_i\).`, T`Use the unit eigenvectors of \(A^TA\) as the columns \(v_i\) of \(V\); then \(u_i=Av_i/\sigma_i\) for each nonzero \(\sigma_i\).`, T`For anything bigger than 2×2, use \(\texttt{np.linalg.svd(A)}\).`],
        examples: [[T`\(\operatorname{diag}(4,1)\)`, T`\(U=V=I,\ \Sigma=\operatorname{diag}(4,1)\): already in SVD form`], [T`\(\operatorname{diag}(-3,2)\)`, T`singular values \(3\) and \(2\); the minus sign is absorbed by \(U\) or \(V\)`], [T`\(\begin{bmatrix}2&1\\1&2\end{bmatrix}\)`, T`singular values \(3\) and \(1\), equal to its eigenvalues because it is symmetric with positive eigenvalues`], [T`\(\begin{bmatrix}3&0\\4&0\end{bmatrix}\)`, T`\(A^TA=\operatorname{diag}(25,0)\), singular values \(5\) and \(0\), so the rank is 1`]],
        pitfall: T`Singular values are not eigenvalues in general: they are never negative and they exist for rectangular matrices too. The number of nonzero singular values is the rank.`,
        seeAlso: [15, 16, 50]
      },
      {
        id: 'outer-product', term: 'Outer product (a rank-one matrix)', symbol: T`uv^T`,
        plain: T`A column vector times a row vector gives a whole matrix whose entry in row \(i\), column \(j\) is \(u_iv_j\). Every row is a multiple of \(v^T\), so the matrix has rank one. An SVD writes a matrix as a sum of such rank-one pieces, each weighted by a singular value.`,
        formula: T`(uv^T)_{ij}=u_iv_j`,
        steps: [T`Write the entries of \(u\) down the side and the entries of \(v\) along the top.`, T`Fill each cell with its row entry of \(u\) times its column entry of \(v\).`, T`For a piece \(\sigma uv^T\), multiply every cell by \(\sigma\).`],
        examples: [[T`\(u=(1,2),\ v=(3,1)\)`, T`\(uv^T=\begin{bmatrix}3&1\\6&2\end{bmatrix}\)`], [T`\(4\,e_1e_1^T\)`, T`\(\begin{bmatrix}4&0\\0&0\end{bmatrix}\): the rank-1 piece of \(\operatorname{diag}(4,1)\)`], [T`\(v^Tu\) for the same vectors`, T`\(3\cdot1+1\cdot2=5\): a single number, not a matrix`]],
        pitfall: T`\(u^Tv\) (a dot product) is one number, while \(uv^T\) is a matrix. Where the transpose sits decides which one you get.`,
        seeAlso: [38]
      },
      {
        id: 'low-rank-approximation', term: 'Low-rank approximation (truncated SVD)', symbol: T`A_k`,
        plain: T`Keep only the \(k\) strongest pieces \(\sigma_iu_iv_i^T\) of the SVD and drop the rest. The result \(A_k\) is the closest rank-\(k\) matrix to \(A\). Its squared error is the sum of the dropped squared singular values, and it can store an image or feature matrix with far fewer numbers.`,
        formula: T`A_k=\sum_{i=1}^{k}\sigma_iu_iv_i^T,\qquad \|A-A_k\|_F^2=\sum_{i>k}\sigma_i^2`,
        steps: [T`Sort the singular values from largest to smallest.`, T`Keep the first \(k\) pieces; set the other singular values to zero.`, T`Squared error: add the squares of the dropped singular values. Kept energy: the kept squares divided by all the squares.`, T`Storage for an \(m\times n\) matrix: about \(k(m+n+1)\) numbers instead of \(mn\).`],
        examples: [[T`\(\sigma=(5,2,1),\ k=1\)`, T`error \(2^2+1^2=5\); kept energy \(25/30\approx0.833\)`], [T`\(\operatorname{diag}(4,1),\ k=1\)`, T`\(A_1=\operatorname{diag}(4,0)\); error \(1^2=1\); kept energy \(16/17\approx0.941\)`], [T`\(\sigma=(6,3,2),\ k=1\)`, T`error \(9+4=13\)`], [T`100×80 image, \(k=10\)`, T`\(10(100+80+1)=1810\) numbers instead of \(8000\)`]],
        pitfall: T`A small error or a large kept-energy fraction does not mean the dropped detail is unimportant: a small but telling object can sit in a weak component.`,
        seeAlso: [15, 16]
      },
      {
        id: 'frobenius-norm', term: 'Frobenius norm', symbol: T`\|A\|_F`,
        plain: T`The size of a whole matrix: square every entry, add them up and take the square root, just like the length of one long vector made from all the entries. It measures how far a reconstruction is from the original, and it also equals the square root of the sum of the squared singular values.`,
        formula: T`\|A\|_F=\sqrt{\sum_{i,j}A_{ij}^2}=\sqrt{\sum_i\sigma_i^2}`,
        steps: [T`Square every entry of the matrix.`, T`Add all the squares.`, T`Take the square root, or stop before it when you need the squared norm.`],
        examples: [[T`\(\begin{bmatrix}1&2\\3&4\end{bmatrix}\)`, T`\(\sqrt{1+4+9+16}=\sqrt{30}\approx5.477\)`], [T`\(\operatorname{diag}(4,1)\)`, T`\(\sqrt{16+1}=\sqrt{17}\approx4.123\), the same as \(\sqrt{4^2+1^2}\) from its singular values`], [T`\(A-A_1=\operatorname{diag}(0,1)\)`, T`\(\|A-A_1\|_F=1\)`]],
        pitfall: T`It treats every entry equally, so it cannot tell an important object from background. Check whether a report quotes the norm or its square.`,
        seeAlso: [16]
      }
    ]
  });

  add(15, {
    builds: [{lesson: 13, why: 'PCA directions are eigenvectors of a symmetric matrix'}, {lesson: 14, why: 'the SVD of centred data gives the same directions'}, {lesson: 6, why: 'a score is a projection onto a unit direction'}],
    recall: ['mean', 'eigenvector', 'eigenvalue', 'symmetric-matrix', 'singular-value-decomposition'],
    symbols: [
      ['Xc', 'centred data: each sample minus the training mean, one sample per row', 'centering'],
      ['C', 'sample covariance matrix: variances on the diagonal, covariances off it', 'covariance-matrix'],
      ['n', 'number of samples; at least 2, because the formula divides by n − 1']
    ],
    terms: [
      {
        id: 'centering', term: 'Centering (subtracting the training mean)', symbol: T`X_c=X-\mathbf 1\mu`,
        plain: T`Average each feature over the training samples, then subtract that average from every sample, so each feature has mean zero. Centering moves the data cloud to the origin, which lets covariance and PCA describe how the samples spread rather than where they sit.`,
        formula: T`\mu=\frac1N\sum_{i=1}^Nx_i,\qquad X_c=X-\mathbf1\mu\quad(\text{subtract }\mu\text{ from every row})`,
        steps: [T`Average each column (feature) of the training data to get the mean vector \(\mu\).`, T`Subtract \(\mu\) from every row (sample).`, T`Check that every column of \(X_c\) now averages to zero. Keep \(\mu\): you need it to centre new data and to reconstruct.`],
        examples: [[T`samples \((1,1),(2,2),(3,3)\)`, T`\(\mu=(2,2)\); centred rows \((-1,-1),(0,0),(1,1)\)`], [T`samples \((0,2),(2,4)\)`, T`\(\mu=(1,3)\); centred rows \((-1,-1),(1,1)\)`], [T`new sample \((4,4)\), training \(\mu=(2,2)\)`, T`centred \((2,2)\), using the training mean`]],
        pitfall: T`Centre validation and test samples with the training mean, not their own. \(\mathbf1\mu\) is just a stack of copies of the mean row, one per sample.`,
        seeAlso: [16]
      },
      {
        id: 'covariance-matrix', term: 'Sample covariance matrix', symbol: T`C=\tfrac{1}{n-1}X_c^TX_c`,
        plain: T`A square table of how features vary. Each diagonal entry is a feature’s variance, its average squared distance from the mean. Each off-diagonal entry is a covariance: positive when two features tend to be above average together, negative when one tends to be high while the other is low. PCA reads its directions from this matrix.`,
        formula: T`C_{jk}=\frac{1}{n-1}\sum_{i=1}^n(X_c)_{ij}(X_c)_{ik},\qquad C=\frac{1}{n-1}X_c^TX_c`,
        steps: [T`Centre the data.`, T`For entry \((j,k)\), multiply column \(j\) by column \(k\) entry by entry and add the products.`, T`Divide by \(n-1\), the number of samples minus one.`, T`Check that \(C\) is symmetric: \(C_{jk}=C_{kj}\).`],
        examples: [[T`centred rows \((-1,-1),(0,0),(1,1)\)`, T`every entry \((1+0+1)/2=1\): \(C=\begin{bmatrix}1&1\\1&1\end{bmatrix}\)`], [T`centred rows \((-2,-1),(0,0),(2,1)\)`, T`\(C=\begin{bmatrix}4&2\\2&1\end{bmatrix}\)`], [T`centred rows \((-1,-1),(1,1)\), \(n=2\)`, T`\(C=\begin{bmatrix}2&2\\2&2\end{bmatrix}\)`]],
        pitfall: T`Some libraries divide by \(n\) instead of \(n-1\); that rescales every entry but leaves the PCA directions unchanged. Features in large units dominate the covariance, so decide whether to standardize first.`,
        seeAlso: [16, 23]
      },
      {
        id: 'quadratic-form', term: 'Variance along a direction (quadratic form)', symbol: T`v^TCv`,
        plain: T`Project every centred sample onto a unit direction \(v\) to get one number per sample; the variance of those numbers is \(v^TCv\). This pattern, a row vector times a matrix times the same vector as a column, always gives a single number. It returns as the curvature term of a Taylor approximation.`,
        formula: T`v^TCv=\sum_{j,k}v_jC_{jk}v_k,\qquad \|v\|_2=1`,
        steps: [T`Make \(v\) unit length by dividing it by its norm.`, T`Compute the vector \(Cv\).`, T`Take the dot product of \(v\) with \(Cv\).`],
        examples: [[T`\(C=\begin{bmatrix}1&1\\1&1\end{bmatrix},\ v=(1,1)/\sqrt2\)`, T`\(Cv=(\sqrt2,\sqrt2)\), so \(v^TCv=2\)`], [T`same \(C\), \(v=(1,-1)/\sqrt2\)`, T`\(0\): no spread across the line`], [T`same \(C\), \(v=(1,0)\)`, T`\(1\), the first feature’s variance`], [T`\(C=\begin{bmatrix}4&2\\2&1\end{bmatrix},\ v=(2,1)/\sqrt5\)`, T`\(5\)`]],
        pitfall: T`Without the unit-length condition you could make \(v^TCv\) as large as you like simply by lengthening \(v\).`,
        seeAlso: [20, 31]
      },
      {
        id: 'principal-component-analysis', term: 'Principal component analysis (PCA)', symbol: T`Z=X_cV_k`,
        plain: T`PCA finds the perpendicular directions along which centred data spread the most. They are the eigenvectors of the covariance matrix, ranked by eigenvalue, and each eigenvalue is the variance along its direction. Projecting onto the first \(k\) directions gives \(k\) numbers per sample: compressed features learned without labels.`,
        formula: T`Cv_i=\lambda_iv_i,\quad \lambda_1\ge\lambda_2\ge\dots\ge0,\qquad Z=X_cV_k`,
        steps: [T`Centre the training data and compute its covariance \(C\).`, T`Find the eigenvalues and unit eigenvectors of \(C\); sort them, largest eigenvalue first.`, T`Keep the first \(k\) eigenvectors as the columns of \(V_k\).`, T`Compute the scores \(Z=X_cV_k\), one row of \(k\) numbers per sample. Equivalently, the SVD \(X_c=U\Sigma V^T\) gives the same \(V\), with \(\lambda_i=\sigma_i^2/(n-1)\).`],
        examples: [[T`samples \((1,1),(2,2),(3,3)\)`, T`\(v_1=(1,1)/\sqrt2\) with \(\lambda_1=2\); \(v_2=(1,-1)/\sqrt2\) with \(\lambda_2=0\)`], [T`scores of those centred rows on \(v_1\)`, T`\(-\sqrt2,\ 0,\ \sqrt2\approx-1.414,\ 0,\ 1.414\)`], [T`\(C=\begin{bmatrix}4&2\\2&1\end{bmatrix}\)`, T`\(v_1=(2,1)/\sqrt5\approx(0.894,0.447)\), \(\lambda_1=5\); scores \(-\sqrt5,0,\sqrt5\)`]],
        pitfall: T`High-variance directions are not necessarily the ones that separate classes: lighting can vary more than object identity. The sign of each direction is arbitrary; flipping it changes nothing.`,
        seeAlso: [16]
      },
      {
        id: 'explained-variance', term: 'Explained variance ratio', symbol: T`\frac{\lambda_1+\dots+\lambda_k}{\lambda_1+\dots+\lambda_D}`,
        plain: T`The share of the total spread that the first \(k\) principal components keep: their eigenvalues added up, divided by the sum of all the eigenvalues. It helps choose how many components to keep, but it measures retained variation, not usefulness for a task.`,
        steps: [T`List the covariance eigenvalues, largest first.`, T`Add the first \(k\) of them.`, T`Divide by the sum of all of them, which equals the sum of the diagonal of \(C\) (the total variance).`],
        examples: [[T`\(\lambda=(4,1,0),\ k=1\)`, T`\(4/5=0.8\)`], [T`\(\lambda=(4,1,0),\ k=2\)`, T`\(5/5=1\)`], [T`\(\lambda=(3,2,1),\ k=2\)`, T`\(5/6\approx0.833\)`], [T`\(\lambda=(2,0)\), points on a line`, T`\(2/2=1\): one component keeps everything`]],
        pitfall: T`A component that keeps 99% of the variance can still miss the small detail that decides the class. Choose \(k\) with validation on the real task.`,
        seeAlso: [16]
      },
      {
        id: 'rayleigh-quotient', term: 'Rayleigh quotient (why the top eigenvector wins)', symbol: T`R(v)=\frac{v^TCv}{v^Tv}`,
        plain: T`Write any direction \(v\) in the eigenvector basis of \(C\): \(v=c_1v_1+c_2v_2+\dots\). Then \(v^TCv/v^Tv\) is a weighted average of the eigenvalues, with weights \(c_i^2\). An average can never exceed its largest ingredient, so the projected variance is largest, equal to \(\lambda_1\), exactly when \(v\) points along the top eigenvector \(v_1\).`,
        formula: T`R(v)=\frac{v^TCv}{v^Tv}=\frac{\lambda_1c_1^2+\lambda_2c_2^2+\dots}{c_1^2+c_2^2+\dots}\le\lambda_1,\qquad c_i=v_i^Tv`,
        steps: [T`Find the unit eigenvectors \(v_i\) and eigenvalues \(\lambda_i\) of \(C\).`, T`Find the coordinates of \(v\) in that basis: \(c_i=v_i^Tv\).`, T`Average the eigenvalues with weights \(c_i^2\). The result reaches \(\lambda_1\) only when all the weight sits on \(v_1\).`],
        examples: [[T`\(C=\operatorname{diag}(3,1),\ v=(1,0)\)`, T`\(3\): all weight on the top eigenvector`], [T`same \(C\), \(v=(1,1)\)`, T`\((3+1)/2=2\): an equal mix`], [T`same \(C\), \(v=(2,1)\)`, T`\((4\cdot3+1\cdot1)/5=2.6\)`], [T`\(C=\begin{bmatrix}1&1\\1&1\end{bmatrix},\ v=(1,0)\)`, T`\(c=(0.707,0.707)\), so \((2\cdot0.5+0\cdot0.5)/1=1\)`]],
        pitfall: T`Dividing by \(v^Tv\) cancels the length of \(v\), which is why PCA can work with unit vectors. The second component maximizes the same quotient among directions perpendicular to \(v_1\).`,
        seeAlso: [20]
      }
    ]
  });

  add(16, {
    builds: [{lesson: 15, why: 'PCA learns a mean and directions from training data'}, {lesson: 14, why: 'dropped singular values give the reconstruction error'}, {lesson: 12, why: 'validation chooses settings; test reports once'}],
    recall: ['principal-component-analysis', 'centering', 'low-rank-approximation', 'frobenius-norm', 'train-validation-test-split'],
    symbols: [
      ['Ak', 'best rank-k approximation: rebuilt from the k largest SVD pieces (Lesson 14)'],
      ['F', 'Frobenius norm: square every entry, add them, take the square root (Lesson 14)']
    ],
    terms: [
      {
        id: 'pca-reconstruction', term: 'Encoding and reconstruction with a fitted PCA', symbol: T`\hat X=ZV_k^T+\mathbf1\mu`,
        plain: T`To compress a sample, centre it with the training mean and project it onto the kept directions. To rebuild it, send the scores back along those directions and add the mean again. The rebuilt sample lies in the kept subspace, so any part of the sample outside that subspace is lost.`,
        formula: T`Z=(X-\mathbf1\mu)V_k,\qquad \hat X=ZV_k^T+\mathbf1\mu`,
        steps: [T`Subtract the training mean \(\mu\) from the sample.`, T`Scores: take the dot product of the centred sample with each kept unit direction (the columns of \(V_k\)).`, T`Rebuild: multiply each score by its direction, add the results, then add \(\mu\) back.`],
        examples: [[T`\(x=(3,4)\), \(\mu=(0,0)\), keep \(u=(1,0)\)`, T`score \(z=3\); rebuilt \(\hat x=(3,0)\)`], [T`\(x=(3,3)\), \(\mu=(2,2)\), keep \(v_1=(1,1)/\sqrt2\)`, T`\(z=\sqrt2\approx1.414\); \(\hat x=\sqrt2\,v_1+\mu=(3,3)\), exact`], [T`same, but forgetting to add \(\mu\) back`, T`\((1,1)\): right direction, wrong place`]],
        pitfall: T`Use the training \(\mu\) and \(V_k\) for every split. Refitting them on each new batch makes a sample’s features depend on which other samples share its batch.`
      },
      {
        id: 'reconstruction-error', term: 'Reconstruction error and its denominator', symbol: T`\|X_c-\hat X_c\|_F^2`,
        plain: T`The total squared difference between the data and its reconstruction. For PCA keeping \(k\) components, it equals the sum of the dropped squared singular values of the centred data. Reports often divide it by the number of samples or by the number of entries, so always state the denominator.`,
        formula: T`\|X_c-\hat X_c\|_F^2=\sum_{i>k}\sigma_i^2,\qquad \text{per sample: divide by }N,\qquad\text{per entry: divide by }ND`,
        steps: [T`Square every residual entry and add them, or add the squares of the dropped singular values.`, T`Per-sample mean squared error: divide by the number of samples \(N\).`, T`Per-entry mean squared error: divide by \(N\times D\), samples times features.`],
        examples: [[T`\(x=(3,4)\) rebuilt as \((z,0)\)`, T`\((3-z)^2+4^2\); the best \(z=3\) leaves \(16\), the unavoidable part`], [T`4×3 data, dropped \(\sigma=2,1\)`, T`total \(5\); per sample \(5/4=1.25\); per entry \(5/12\approx0.417\)`], [T`\(N=5,\ D=2\), dropped \(\sigma=3,1\)`, T`total \(10\); per entry \(10/10=1\)`]],
        pitfall: T`A lower reconstruction error means a more faithful copy, not better classification. Compare two reports only after checking that they divide by the same thing.`
      },
      {
        id: 'data-leakage', term: 'Data leakage',
        plain: T`Information from validation or test data sneaking into anything that is fitted: model weights, but also means, scales, PCA directions or feature choices. Near-duplicate images, or frames of one video spread across splits, leak too. Leakage makes held-out scores look better than future performance will be.`,
        steps: [T`Split the data first, keeping related images (same video, subject or scene) in the same split.`, T`Fit every preprocessing step (mean, scale, PCA) on the training split only.`, T`Apply those fitted transforms unchanged to validation and test.`, T`Choose settings with validation; use the test split once, at the end.`],
        examples: [[T`standardize using the mean of all splits`, T`leak: test values shaped the features`], [T`PCA fitted on training, applied to test`, T`no leak`], [T`frames 1-50 of a video in training, frame 51 in test`, T`leak: the test frame is a near-duplicate`], [T`choose \(k\) on validation, report test once`, T`no leak`]],
        pitfall: T`Leakage needs no labels: fitting even an unsupervised mean or PCA on test images lets them influence the model.`,
        seeAlso: [28, 40, 45]
      },
      {
        id: 'nearest-centroid-classifier', term: 'Nearest-centroid classifier', symbol: T`c_j=\tfrac{1}{n_j}\textstyle\sum_{y_i=j}x_i`,
        plain: T`A very simple baseline. Average the training features of each class to get one centroid per class, then label a new sample with the class whose centroid is closest. It quickly tests whether a representation, such as PCA features, separates the classes.`,
        steps: [T`For each class, average its training feature vectors to get the centroid \(c_j\).`, T`For a new sample, compute its distance \(\|x-c_j\|_2\) to every centroid.`, T`Predict the class of the nearest centroid.`],
        examples: [[T`class A: \((0,0),(2,0)\); class B: \((4,4),(6,4)\)`, T`centroids \(c_A=(1,0)\), \(c_B=(5,4)\)`], [T`new point \((2,1)\)`, T`distances \(\sqrt2\approx1.414\) to A and \(\sqrt{18}\approx4.243\) to B: predict A`], [T`new point \((4,3)\)`, T`distances \(\sqrt{18}\approx4.243\) to A and \(\sqrt2\approx1.414\) to B: predict B`]],
        pitfall: T`Compute centroids from training data only, after the same fitted preprocessing. Features in large units dominate the distance.`,
        seeAlso: [45]
      }
    ]
  });

  add(17, {
    builds: [{lesson: 2, why: 'a derivative describes how a function’s output changes'}, {lesson: 4, why: 'the rules include the derivatives of e^x and ln x'}, {lesson: 12, why: 'ridge was solved by setting a derivative to zero'}],
    recall: ['slope', 'function-composition', 'natural-exponential', 'natural-logarithm'],
    symbols: [
      ['h', 'a small step added to the input x, measured in the same units as x', 'linear-approximation'],
      ['f′(x)', 'derivative of f at x: the local slope, output change per unit of input', 'derivative']
    ],
    terms: [
      {
        id: 'difference-quotient', term: 'Difference quotient (slope between two nearby points)', symbol: T`\frac{f(x+h)-f(x)}{h}`,
        plain: T`Change the input by a small amount \(h\), see how much the output changed, and divide: rise over run between two points on the curve. It is the slope of the straight line through those two points (a secant), and the first step towards a derivative.`,
        steps: [T`Compute \(f(x)\) and \(f(x+h)\).`, T`Subtract to get the change in output.`, T`Divide by the change in input \(h\).`],
        examples: [[T`\(f=x^2,\ x=2,\ h=0.1\)`, T`\((4.41-4)/0.1=4.1\)`], [T`\(f=x^2,\ x=2,\ h=0.01\)`, T`\((4.0401-4)/0.01=4.01\)`], [T`\(f=x^2,\ x=3,\ h=0.1\)`, T`\((9.61-9)/0.1=6.1\)`], [T`\(f=x^2\), any \(x\)`, T`\(\frac{(x+h)^2-x^2}{h}=\frac{2xh+h^2}{h}=2x+h\)`]],
        pitfall: T`It depends on \(h\) as well as on \(x\): on a curve, different step sizes give different slopes. Only its limit as \(h\) shrinks to zero is the derivative.`,
        seeAlso: [20, 40]
      },
      {
        id: 'limit', term: 'Limit', symbol: T`\lim_{h\to0}`,
        plain: T`The value an expression gets closer and closer to as its input approaches some number, even if you never plug that number in. Derivatives need it: the slope formula divides by \(h\), so you cannot simply set \(h=0\). Instead you ask what the slope approaches as \(h\) shrinks.`,
        formula: T`\lim_{h\to0}\frac{(3+h)^2-9}{h}=\lim_{h\to0}(6+h)=6`,
        steps: [T`Simplify the expression while \(h\neq0\), for example by cancelling a factor of \(h\).`, T`Try values such as \(h=0.1,\ 0.01,\ 0.001\), and negative ones too.`, T`If the results settle on one number from both sides, that number is the limit.`],
        examples: [[T`\(6+h\) at \(h=0.1,\ 0.01,\ 0.001\)`, T`\(6.1,\ 6.01,\ 6.001\to6\)`], [T`\(6+h\) at \(h=-0.1,\ -0.01\)`, T`\(5.9,\ 5.99\to6\): the same limit from below`], [T`\(\frac{(3+h)^2-9}{h}\) at \(h=0\)`, T`reads \(0/0\), undefined; yet the limit is \(6\)`], [T`\(\frac{\max(0,h)}{h}\)`, T`\(1\) for \(h>0\), \(0\) for \(h<0\): no limit, so \(\max(0,x)\) has no derivative at 0`]],
        pitfall: T`A limit is about approaching, not arriving. If the two sides approach different values, there is no limit.`,
        seeAlso: [18, 20]
      },
      {
        id: 'derivative', term: 'Derivative', symbol: T`f'(x)`,
        plain: T`The slope of a function at a single point: how fast the output changes per unit change of input, right there. It is the limit of the difference quotient as the step shrinks to zero. A positive derivative means the output rises as the input increases, a negative one means it falls, and its size measures sensitivity.`,
        formula: T`f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}`,
        steps: [T`Write the difference quotient and simplify it (for \(x^2\) it is \(2x+h\)).`, T`Let \(h\to0\) to get a formula for \(f'(x)\) (for \(x^2\) it is \(2x\)).`, T`Substitute the point you care about.`],
        examples: [[T`\(f=x^2\) at \(x=2\)`, T`\(f'(2)=4\)`], [T`\(f=x^2\) at \(x=3\)`, T`\(f'(3)=6\)`], [T`\(f=x^2\) at \(x=-1\)`, T`\(f'(-1)=-2\): falling`], [T`\(f=x^2\) at \(x=0\)`, T`\(f'(0)=0\): flat, at the minimum`]],
        plot: {fn: 'x => x * x', x: [-3, 3], y: [0, 9], xLabel: 'x', yLabel: 'f(x) = x²', marks: [-1, 0, 2]},
        pitfall: T`A zero derivative does not mean the function is constant: it can mark a minimum, a maximum or a flat point. At a kink, such as \(\max(0,x)\) at 0, there is no derivative at all.`,
        seeAlso: [18, 19, 20, 29, 38]
      },
      {
        id: 'linear-approximation', term: 'Tangent-line (first-order) approximation', symbol: T`f(x+h)\approx f(x)+f'(x)h`,
        plain: T`Close to a point, a smooth curve looks almost like a straight line, its tangent. Predict a nearby value by starting from \(f(x)\) and adding slope times step. The prediction is very good for small steps and gets worse as the step grows, because the curve bends away from the line.`,
        formula: T`f(x+h)\approx f(x)+f'(x)\,h`,
        steps: [T`Compute \(f(x)\) and \(f'(x)\) at the starting point.`, T`Multiply the derivative by the step \(h\).`, T`Add that to \(f(x)\). Compare with the exact value to see the error.`],
        examples: [[T`\(x^2\) from \(x=2\), \(h=0.1\)`, T`\(4+4(0.1)=4.4\); exact \(4.41\)`], [T`\(x^2\) from \(x=3\), \(h=0.1\)`, T`\(9.6\); exact \(9.61\), error \(0.01=h^2\)`], [T`\(x^2\) from \(x=4\), \(h=0.01\)`, T`\(16.08\); exact \(16.0801\)`], [T`\(x^2\) from \(x=2\), \(h=1\)`, T`\(8\); exact \(9\), error \(1\)`]],
        plot: {fn: 'x => x * x', x: [-1, 1], y: [0, 1], xLabel: 'step h', yLabel: 'tangent error for x²', marks: [0.1, 0.5]},
        pitfall: T`The approximation is local. For \(x^2\) the error is exactly \(h^2\): halving the step quarters the error, but a large step can be badly wrong.`,
        seeAlso: [18, 20, 29]
      },
      {
        id: 'differentiation-rules', term: 'Derivative rules', symbol: T`\tfrac{d}{dx}x^n=nx^{n-1}`,
        plain: T`A few rules let you differentiate most formulas without going back to limits. Constants give zero, \(x^n\) gives \(nx^{n-1}\), sums are differentiated term by term, \(e^x\) is its own derivative and \(\ln x\) gives \(1/x\). The notation \(\tfrac{d}{dx}\) means “the derivative with respect to \(x\)”.`,
        formula: T`\tfrac{d}{dx}c=0,\quad \tfrac{d}{dx}(ax+b)=a,\quad \tfrac{d}{dx}x^n=nx^{n-1},\quad \tfrac{d}{dx}e^x=e^x,\quad \tfrac{d}{dx}\ln x=\tfrac1x,\quad (fg)'=f'g+fg'`,
        steps: [T`Split a sum into its terms.`, T`Apply the matching rule to each term; constant factors stay in front.`, T`Add the results, then substitute the point.`],
        examples: [[T`\(3x^2+2x-5\) at \(x=2\)`, T`\(6x+2=14\)`], [T`\(x^3\) at \(x=2\)`, T`\(3x^2=12\)`], [T`\(\ln x\) at \(x=4\)`, T`\(1/4=0.25\)`], [T`\(x\,e^x\) at \(x=0\)`, T`product rule: \(e^x+x\,e^x=1\)`]],
        pitfall: T`The product rule is not “multiply the derivatives”: the derivative of \(x\cdot x\) is \(2x\), not \(1\cdot1\).`,
        seeAlso: [18, 20]
      },
      {
        id: 'chain-rule', term: 'Chain rule', symbol: T`\tfrac{d}{dx}f(g(x))=f'(g(x))\,g'(x)`,
        plain: T`How to differentiate one function inside another: differentiate the outer function at the inner value, then multiply by the derivative of the inner function. Sensitivities multiply along a chain of operations, which is the idea behind backpropagation.`,
        formula: T`\frac{d}{dx}f(g(x))=f'(g(x))\,g'(x)`,
        steps: [T`Name the inner quantity, \(u=g(x)\).`, T`Differentiate the outer function with respect to \(u\).`, T`Multiply by \(du/dx\), then substitute the numbers.`],
        examples: [[T`\((2w-1)^2\) at \(w=0\)`, T`\(u=2w-1\): \(2u\cdot2=4(2w-1)=-4\)`], [T`\((3x+1)^2\) at \(x=0\)`, T`\(2(3x+1)\cdot3=6\)`], [T`\((2x+1)^2\) at \(x=1\)`, T`\(2(3)\cdot2=12\)`], [T`\(e^{-x}\) at \(x=0\)`, T`\(e^{-x}\cdot(-1)=-1\)`]],
        pitfall: T`Evaluate the outer derivative at the inner value \(g(x)\), not at \(x\). Forgetting the inner factor \(g'(x)\) is the most common mistake.`,
        seeAlso: [19, 38, 53]
      }
    ]
  });

  add(18, {
    builds: [{lesson: 17, why: 'each partial is an ordinary one-variable derivative'}, {lesson: 6, why: 'directional change is a dot product with a unit vector'}, {lesson: 10, why: 'the least-squares loss and its normal equations'}],
    recall: ['derivative', 'linear-approximation', 'dot-product', 'unit-vector', 'least-squares'],
    symbols: [
      ['∇f', 'gradient of f: the vector of partial derivatives, one per input', 'gradient'],
      ['u', 'unit-length direction of travel, so the result is change per unit distance', 'directional-derivative']
    ],
    terms: [
      {
        id: 'partial-derivative', term: 'Partial derivative', symbol: T`\frac{\partial f}{\partial x}`,
        plain: T`For a function of several inputs, the partial derivative with respect to one input is its ordinary derivative while all the other inputs are held fixed, treated as constants. It measures sensitivity to that one coordinate alone. The curly \(\partial\) signals that other inputs exist.`,
        formula: T`\frac{\partial f}{\partial x}(x,y)=\lim_{h\to0}\frac{f(x+h,y)-f(x,y)}{h}`,
        steps: [T`Choose the input to vary; freeze the others as if they were numbers.`, T`Differentiate with the usual rules.`, T`Substitute the point.`],
        examples: [[T`\(f=x^2+3xy+y^2\), \(\partial f/\partial x\)`, T`\(2x+3y\); at \((1,2)\): \(8\)`], [T`same \(f\), \(\partial f/\partial y\)`, T`\(3x+2y\); at \((1,2)\): \(7\)`], [T`\(f=x^2+2y^2\) at \((1,1)\)`, T`\(\partial f/\partial x=2x=2\), \(\partial f/\partial y=4y=4\)`], [T`\(f=x^2+xy+2y^2\) at \((1,2)\)`, T`\(2x+y=4\), \(x+4y=9\)`]],
        pitfall: T`In \(3xy\), holding \(y\) fixed makes the \(x\)-partial \(3y\): not \(3\), and not \(0\).`,
        seeAlso: [19, 20, 38, 53]
      },
      {
        id: 'gradient', term: 'Gradient', symbol: T`\nabla f`,
        plain: T`The vector that collects all the partial derivatives of a function at a point, one per input. It points in the direction of steepest local increase and its length is that steepest rate. The negative gradient is therefore the steepest way down, which is what gradient descent uses to train models.`,
        formula: T`\nabla f=\begin{bmatrix}\partial f/\partial x\\ \partial f/\partial y\end{bmatrix},\qquad f(x+\delta)\approx f(x)+\nabla f^T\delta`,
        steps: [T`Compute each partial derivative.`, T`Stack them in input order as a column vector.`, T`Evaluate at the point. Its norm is the steepest rate of increase.`],
        examples: [[T`\(x^2+y^2\) at \((3,4)\)`, T`\((6,8)\), length \(10\)`], [T`\(x^2+2y^2\) at \((1,1)\)`, T`\((2,4)\)`], [T`\(x^2+3xy+y^2\) at \((1,2)\)`, T`\((8,7)\)`], [T`\(x^2+y^2\) at \((3,4)\), step \(\delta=(0.1,0)\)`, T`predicted change \(\nabla f^T\delta=0.6\); exact \(0.61\)`]],
        pitfall: T`The gradient has the same shape as the input (or the parameters) and changes from point to point, so always say where it was evaluated.`,
        seeAlso: [19, 29, 30, 38]
      },
      {
        id: 'directional-derivative', term: 'Directional derivative', symbol: T`D_uf=\nabla f^Tu`,
        plain: T`The rate of change of a function when you move in a chosen direction \(u\), per unit distance. It is the dot product of the gradient with a unit vector: largest when \(u\) points along the gradient, zero when \(u\) is perpendicular to it, and most negative when \(u\) points the opposite way.`,
        formula: T`D_uf(x)=\nabla f(x)^Tu,\quad \|u\|_2=1,\qquad -\|\nabla f\|_2\le D_uf\le\|\nabla f\|_2`,
        steps: [T`Make the direction unit length by dividing it by its norm.`, T`Compute the gradient at the point.`, T`Take the dot product of the two.`],
        examples: [[T`\(\nabla f=(6,8),\ u=(1,0)\)`, T`\(6\)`], [T`\(\nabla f=(6,8),\ u=(-0.6,-0.8)\)`, T`\(-10=-\|\nabla f\|\): the steepest descent`], [T`\(\nabla f=(2,4),\ u=(0.6,0.8)\)`, T`\(1.2+3.2=4.4\)`], [T`\(\nabla f=(6,8),\ u=(0.8,-0.6)\)`, T`\(0\): perpendicular, no first-order change`]],
        pitfall: T`Use a unit direction, otherwise the answer is scaled by the direction’s length. A negative value promises a decrease only for small steps; a large step can overshoot.`,
        seeAlso: [29]
      },
      {
        id: 'least-squares-gradient', term: 'Gradient of the least-squares loss', symbol: T`\nabla L=A^T(A\theta-b)`,
        plain: T`For predictions \(A\theta\) and targets \(b\), the loss \(L=\tfrac12\|A\theta-b\|_2^2\) has gradient \(A^T(A\theta-b)\): the residuals weighted by each feature column. It has the same shape as \(\theta\), and setting it to zero gives the normal equations from Lesson 10.`,
        formula: T`L(\theta)=\tfrac12\|A\theta-b\|_2^2\ \Rightarrow\ \nabla L=A^T(A\theta-b),\qquad \frac{\partial L}{\partial\theta_j}=\sum_ir_iA_{ij}`,
        steps: [T`Compute the residuals \(r=A\theta-b\).`, T`Multiply by \(A^T\): entry \(j\) is \(\sum_ir_iA_{ij}\).`, T`Adjust for the convention: without the \(\tfrac12\), multiply by 2; for a mean, divide by the number of observations.`],
        examples: [[T`\(A=\begin{bmatrix}1\\2\end{bmatrix},\ b=(1,3),\ \theta=1\)`, T`\(r=(0,-1)\), \(\nabla L=1\cdot0+2\cdot(-1)=-2\)`], [T`same, \(\theta=1.4\)`, T`\(r=(0.4,-0.2)\), \(\nabla L=0.4-0.4=0\): the least-squares fit`], [T`unhalved \(\|A\theta-b\|^2\) at \(\theta=1\)`, T`\(2\times(-2)=-4\)`], [T`mean \(\tfrac1N\|A\theta-b\|^2\), \(N=2\), \(\theta=1\)`, T`\(-4/2=-2\)`]],
        pitfall: T`Factors of 2 and \(1/N\) change the gradient’s size but not where it is zero. Always check that the gradient has the same shape as \(\theta\).`,
        seeAlso: [29, 30]
      }
    ]
  });

  add(19, {
    builds: [{lesson: 17, why: 'the one-variable chain rule multiplies derivatives'}, {lesson: 18, why: 'a Jacobian row is a gradient of one output'}, {lesson: 7, why: 'matrix products follow the order of composition'}],
    recall: ['chain-rule', 'partial-derivative', 'gradient', 'function-composition', 'matrix-multiplication'],
    symbols: [
      ['J', 'Jacobian: partial derivatives, one row per output and one column per input', 'jacobian'],
      ['g ∘ f', 'composition: apply f first, then g; its Jacobian is J_g times J_f', 'multivariable-chain-rule']
    ],
    terms: [
      {
        id: 'jacobian', term: 'Jacobian matrix', symbol: T`J_{ij}=\frac{\partial y_i}{\partial x_j}`,
        plain: T`For a function with several inputs and several outputs, the Jacobian is the matrix of all its partial derivatives: one row per output, one column per input. It is the best linear approximation of the function near a point, so a small input change \(\delta_x\) produces an output change of about \(J\delta_x\).`,
        formula: T`J=\begin{bmatrix}\partial y_1/\partial x_1&\cdots&\partial y_1/\partial x_D\\\vdots&&\vdots\\\partial y_H/\partial x_1&\cdots&\partial y_H/\partial x_D\end{bmatrix},\qquad \delta_y\approx J\,\delta_x`,
        steps: [T`Write one row for each output.`, T`In row \(i\), put the partial derivatives of output \(i\) with respect to each input, in input order.`, T`Evaluate at the point. The shape is (number of outputs) × (number of inputs).`],
        examples: [[T`\(f(x_1,x_2)=(x_1^2,\ x_1+x_2)\)`, T`\(J=\begin{bmatrix}2x_1&0\\1&1\end{bmatrix}\); at \((2,3)\): \(\begin{bmatrix}4&0\\1&1\end{bmatrix}\)`], [T`same, input change \(\delta_x=(0.1,0)\)`, T`\(J\delta_x=(0.4,\ 0.1)\); exact change \((0.41,\ 0.1)\)`], [T`\(f(x,y)=(x+y,\ xy)\)`, T`\(J=\begin{bmatrix}1&1\\y&x\end{bmatrix}\)`], [T`\(y=Ax\)`, T`\(J=A\)`]],
        pitfall: T`Rows are outputs and columns are inputs; swapping them gives the transpose. For a single-output function the Jacobian is the gradient written as a row.`,
        seeAlso: [38, 53]
      },
      {
        id: 'computational-graph', term: 'Computational graph',
        plain: T`A diagram of a calculation broken into small named steps. Each node is an intermediate value and each arrow shows which value feeds which. Running it forward computes the output; walking it backward lets you differentiate one simple step at a time instead of the whole formula at once.`,
        steps: [T`Break the formula into single operations and name each result: \(a=wx+b\), then \(L=\tfrac12(a-5)^2\).`, T`Draw an arrow from every input of an operation to its result.`, T`Run forward and record every intermediate value; the backward pass needs them.`],
        examples: [[T`\(x=2,\ w=3,\ b=1\)`, T`\(a=wx+b=7\to L=\tfrac12(7-5)^2=2\)`], [T`local derivatives on the edges into \(a\)`, T`\(\partial a/\partial w=x=2,\ \partial a/\partial x=w=3,\ \partial a/\partial b=1\)`], [T`\(L=u^2+3u\)`, T`\(u\) reaches \(L\) along two paths, through \(u^2\) and through \(3u\)`]],
        pitfall: T`Targets, such as the 5 above, are fixed data: they are leaves of the graph that you do not differentiate.`,
        seeAlso: [38, 40]
      },
      {
        id: 'multivariable-chain-rule', term: 'Chain rule on a graph (multiply along paths, add across paths)', symbol: T`J_{g\circ f}(x)=J_g(f(x))\,J_f(x)`,
        plain: T`To find how the final output depends on an early value, multiply the local derivatives along each path that connects them, then add the contributions of all the paths. For vector-valued steps the multiplications become Jacobian matrix products, taken in the same order as the composition.`,
        formula: T`\frac{\partial L}{\partial w}=\frac{\partial L}{\partial a}\,\frac{\partial a}{\partial w},\qquad J_{g\circ f}(x)=J_g(f(x))\,J_f(x)`,
        steps: [T`List every path from the variable to the output.`, T`Along each path, multiply the local derivatives.`, T`Add the products from all the paths.`],
        examples: [[T`\(a=wx+b,\ L=\tfrac12(a-5)^2\), at \(x=2,w=3,b=1\)`, T`\(\partial L/\partial w=(a-5)\cdot x=2\cdot2=4\)`], [T`same graph`, T`\(\partial L/\partial x=2\cdot3=6,\quad \partial L/\partial b=2\cdot1=2\)`], [T`\(L=u^2+u^3\) at \(u=2\)`, T`two paths: \(2u+3u^2=4+12=16\)`], [T`\(y=3x^2+1\) at \(x=2\)`, T`\(3\cdot(2x)=12\)`]],
        pitfall: T`Order matters: \(J_gJ_f\) is generally not \(J_fJ_g\). Dropping a branch where paths meet loses part of the derivative.`,
        seeAlso: [38, 40, 53]
      },
      {
        id: 'backpropagation', term: 'Backpropagation (reverse-mode differentiation)', symbol: T`\nabla_xL=J_f^T\,\nabla_yL`,
        plain: T`The efficient way to get the gradient of one scalar loss with respect to every parameter. Run the graph forward and keep the intermediate values. Start from \(\partial L/\partial L=1\) at the output and walk backward, multiplying the incoming sensitivity by each edge’s local derivative and adding where paths meet.`,
        steps: [T`Forward pass: compute and store every intermediate value.`, T`Set the output sensitivity \(\partial L/\partial L=1\).`, T`Visit nodes in reverse order: multiply the sensitivity arriving at a node by each local derivative and pass the result to that node’s inputs.`, T`Where several paths reach one value, add their contributions.`],
        examples: [[T`worked graph \(a=wx+b,\ L=\tfrac12(a-5)^2\)`, T`\(1\to\partial L/\partial a=a-5=2\to\partial L/\partial w=2\cdot x=4\)`], [T`\(y=Ax\), with \(\nabla_yL\) of shape \((H,1)\)`, T`\(\nabla_xL=A^T\nabla_yL\), shape \((D,1)\)`], [T`\(A=\begin{bmatrix}1&2\\3&4\end{bmatrix},\ \nabla_yL=(1,0)\)`, T`\(\nabla_xL=A^T(1,0)=(1,2)\)`]],
        pitfall: T`Backpropagation gives exactly the derivatives of the chain rule; it is only a clever order that reuses work. The transpose comes from the shapes, not from habit.`,
        seeAlso: [38, 40]
      }
    ]
  });

  add(20, {
    builds: [{lesson: 18, why: 'the gradient gives the first-order change'}, {lesson: 17, why: 'the tangent line is the first-order prediction'}, {lesson: 15, why: 'the curvature term δᵀHδ is a quadratic form'}],
    recall: ['gradient', 'linear-approximation', 'quadratic-form', 'eigenvalue', 'symmetric-matrix'],
    symbols: [
      ['g', 'gradient at x: the vector of first partial derivatives (Lesson 18)'],
      ['H', 'Hessian at x: the matrix of second partial derivatives, the curvature', 'hessian'],
      ['δ', 'small displacement from x; trust the approximation only while δ is small', 'taylor-approximation']
    ],
    terms: [
      {
        id: 'second-derivative', term: 'Second derivative (curvature)', symbol: T`f''(x)`,
        plain: T`The derivative of the derivative: how fast the slope itself is changing. A positive second derivative means the curve bends upwards like a bowl; a negative one means it bends downwards like a dome. This bending is what makes a straight-line prediction drift away from the curve.`,
        formula: T`f''(x)=\frac{d}{dx}f'(x)`,
        steps: [T`Differentiate once to get \(f'(x)\).`, T`Differentiate \(f'(x)\) again.`, T`Substitute the point and read the sign as the direction of bending.`],
        examples: [[T`\(x^2\)`, T`\(f'=2x,\ f''=2\) everywhere`], [T`\(x^3\) at \(x=2\)`, T`\(f'=3x^2,\ f''=6x=12\)`], [T`\(x^3\) at \(x=-1\)`, T`\(f''=-6\): bends downwards`], [T`\(e^x\) at \(x=0\)`, T`\(f''=e^0=1\)`]],
        pitfall: T`Where the first derivative is zero, a positive second derivative means a minimum and a negative one a maximum. If the second derivative is also zero, this test says nothing.`,
        seeAlso: [31, 52]
      },
      {
        id: 'hessian', term: 'Hessian matrix', symbol: T`H=\nabla^2f`,
        plain: T`For a function of several inputs, the Hessian is the matrix of all second partial derivatives: entry \((i,j)\) says how the \(i\)-th slope changes as input \(j\) changes. It is symmetric for smooth functions, and its eigenvalues give the curvature along its eigenvector directions.`,
        formula: T`H_{ij}=\frac{\partial^2f}{\partial x_i\,\partial x_j},\qquad H=H^T`,
        steps: [T`Compute the gradient, all the first partial derivatives.`, T`Differentiate each gradient entry with respect to each input; row \(i\) holds the partials of \(\partial f/\partial x_i\).`, T`Check symmetry: the mixed entries \(H_{12}\) and \(H_{21}\) should agree.`],
        examples: [[T`\(x^2+3y^2\)`, T`\(H=\operatorname{diag}(2,6)\): three times more curved along \(y\)`], [T`\(x^2+xy+2y^2\)`, T`\(H=\begin{bmatrix}2&1\\1&4\end{bmatrix}\)`], [T`\(x^2+3xy+y^2\)`, T`\(H=\begin{bmatrix}2&3\\3&2\end{bmatrix}\), eigenvalues \(5\) and \(-1\)`], [T`eigenvalues \((2,-1)\) where the gradient is zero`, T`a saddle: up one way, down another`]],
        pitfall: T`Where the gradient is zero, all-positive eigenvalues mean a local minimum, mixed signs mean a saddle, and a zero eigenvalue can leave the test undecided. Read the eigenvalues, not the individual entries.`,
        seeAlso: [29, 31, 32, 52]
      },
      {
        id: 'taylor-approximation', term: 'Second-order Taylor approximation', symbol: T`f(x+\delta)\approx f(x)+g^T\delta+\tfrac12\delta^TH\delta`,
        plain: T`A better local prediction than the tangent line: start from the value, add the slope term, then add half the curvature times the step squared. With several inputs the slope term is a dot product with the gradient and the curvature term is the quadratic form \(\delta^TH\delta\). For a quadratic function it is exact.`,
        formula: T`f(x+\delta)\approx f(x)+g^T\delta+\tfrac12\delta^TH\delta,\qquad \text{one input: }f(x+h)\approx f(x)+f'(x)h+\tfrac12f''(x)h^2`,
        steps: [T`Evaluate \(f\), the gradient \(g\) and the Hessian \(H\) at the centre point.`, T`Compute the slope term \(g^T\delta\).`, T`Compute the curvature term \(\tfrac12\delta^TH\delta\).`, T`Add all three.`],
        examples: [[T`\(x^2\) at \(x=2\), \(h=0.5\)`, T`\(4+2+0.25=6.25\), exactly \(2.5^2\)`], [T`\(x^2\) at \(x=3\), \(h=0.1\)`, T`\(9+0.6+0.01=9.61\), exact`], [T`\(e^x\) at \(x=0\), \(h=0.1\)`, T`\(1+0.1+0.005=1.105\); exact \(1.10517\)`], [T`\(x^2+3y^2\) at \((0,0)\), \(\delta=(1,1)\)`, T`\(0+0+\tfrac12(2+6)=4\), exact`]],
        pitfall: T`\(\delta\) is the displacement from the centre, not the new point itself. Away from quadratics there is a remainder that grows as the step grows.`,
        seeAlso: [29, 31, 52]
      },
      {
        id: 'central-difference', term: 'Central finite difference', symbol: T`\frac{L(\theta+he_j)-L(\theta-he_j)}{2h}`,
        plain: T`A numerical estimate of one partial derivative: nudge parameter \(j\) up by \(h\), then down by \(h\), and divide the change in loss by \(2h\). Here \(e_j\) is the vector with 1 in position \(j\) and 0 elsewhere. It beats a one-sided difference because its error shrinks like \(h^2\).`,
        formula: T`\frac{\partial L}{\partial\theta_j}\approx\frac{L(\theta+he_j)-L(\theta-he_j)}{2h}`,
        steps: [T`Add \(h\) to entry \(j\) only and evaluate the loss.`, T`Subtract \(h\) from entry \(j\) instead and evaluate again.`, T`Subtract the second loss from the first and divide by \(2h\). Restore the parameter afterwards.`],
        examples: [[T`\(w^3\) at \(w=2\), \(h=0.01\)`, T`\((8.120601-7.880599)/0.02=12.0001\); exact \(12\)`], [T`one-sided \((2.01^3-2^3)/0.01\)`, T`\(12.0601\): a larger error`], [T`\(w^2\) at \(w=3\), any \(h\)`, T`\(\frac{(3+h)^2-(3-h)^2}{2h}=6\) exactly`], [T`\(w^3\) at \(w=2\), \(h=10^{-12}\)`, T`error about \(0.001\): rounding now dominates`]],
        pitfall: T`Smaller \(h\) is not always better: below about \(10^{-6}\) in double precision, rounding in the subtraction starts to win.`,
        seeAlso: [40, 53]
      },
      {
        id: 'gradient-check', term: 'Gradient check', symbol: T`\frac{|g-g_{\rm num}|}{\max(10^{-8},\,|g|+|g_{\rm num}|)}`,
        plain: T`A debugging test for code that computes derivatives. Compare each analytic gradient entry \(g\) with its central-difference estimate \(g_{\rm num}\) using a relative error. Tiny relative errors support a correct implementation at the tested points; large ones point to a bug or to an unfair test.`,
        steps: [T`Use small, fixed data in double precision; switch off dropout or fix its randomness.`, T`For a few coordinates of every parameter block, compute \(g_{\rm num}\) by central difference.`, T`Compute the relative error, sweeping \(h\) from about \(10^{-2}\) to \(10^{-6}\).`, T`Avoid points where a ReLU input is close to 0, a kink.`],
        examples: [[T`\(g=12,\ g_{\rm num}=12.0001\)`, T`\(0.0001/24.0001\approx4.2\times10^{-6}\): agrees`], [T`\(g=12,\ g_{\rm num}=6\) (a missing factor of 2)`, T`\(6/18\approx0.33\): a bug`], [T`\(g=0,\ g_{\rm num}=10^{-9}\)`, T`\(10^{-9}/10^{-8}=0.1\), yet both are essentially zero: also check the absolute error`]],
        pitfall: T`A passed check supports correctness only at the tested points. Each estimate costs two loss evaluations, so check a sample of coordinates, never use it to train.`,
        seeAlso: [32, 39, 40]
      }
    ]
  });

  add(21, {
    builds: [{lesson: 4, why: 'a classifier output between 0 and 1 is read as a probability'}, {lesson: 2, why: 'sets list the possible outcomes'}],
    recall: ['set-notation', 'sigmoid'],
    symbols: [
      ['A', 'the event you care about, such as “this image contains the object”', 'probability'],
      ['B', 'the event you observed, such as “the detector raised a flag”; needs P(B) > 0', 'conditional-probability']
    ],
    terms: [
      {
        id: 'probability', term: 'Probability of an event', symbol: T`P(A)`,
        plain: T`An event is a set of possible outcomes, such as “the image contains a cat”. Its probability is a number from 0 (impossible) to 1 (certain); in a representative sample it is the fraction of cases in which the event happens. \(A\cap B\) means both events happen, and \(A^c\) (also written \(\neg A\)) means \(A\) does not happen.`,
        formula: T`0\le P(A)\le1,\qquad P(A^c)=1-P(A),\qquad P(A\cap B)=P(A\text{ and }B)`,
        steps: [T`Count the cases where the event happens.`, T`Divide by the total number of cases.`, T`For “not \(A\)”, subtract from 1.`],
        examples: [[T`200 of 1000 images contain the object`, T`\(P(A)=200/1000=0.2\)`], [T`not containing it`, T`\(P(A^c)=1-0.2=0.8\)`], [T`160 images contain the object and raise a flag`, T`\(P(A\cap B)=160/1000=0.16\)`], [T`fair die, event “even”`, T`\(3/6=0.5\)`]],
        pitfall: T`The probabilities of all the separate possible outcomes add up to 1. \(A\cap B\) means “and”, so it can never be larger than \(P(A)\) or \(P(B)\).`,
        seeAlso: [22, 47]
      },
      {
        id: 'conditional-probability', term: 'Conditional probability', symbol: T`P(A\mid B)`,
        plain: T`The probability of \(A\) once you know that \(B\) happened: restrict attention to the cases where \(B\) occurred and ask what fraction of them also have \(A\). The vertical bar reads “given”. Rearranged, the definition gives the product rule for the probability that both happen.`,
        formula: T`P(A\mid B)=\frac{P(A\cap B)}{P(B)}\quad(P(B)>0),\qquad P(A\cap B)=P(B\mid A)\,P(A)`,
        steps: [T`Identify the group you condition on: the event after the bar.`, T`Find how much of that group also has the event before the bar.`, T`Divide by the size of the group.`],
        examples: [[T`240 flagged images, 160 contain the object`, T`\(P(A\mid B)=160/240=2/3\)`], [T`200 object images, 160 flagged`, T`\(P(B\mid A)=160/200=0.8\)`], [T`800 images without the object, 80 flagged`, T`\(P(B\mid A^c)=80/800=0.1\)`], [T`product rule`, T`\(P(B\mid A)P(A)=0.8\times0.2=0.16=P(A\cap B)\)`]],
        pitfall: T`\(P(A\mid B)\) and \(P(B\mid A)\) answer different questions with different denominators: \(2/3\) versus \(0.8\) above. Always ask “among which group?”`,
        seeAlso: [25, 26]
      },
      {
        id: 'law-of-total-probability', term: 'Law of total probability', symbol: T`P(B)=\textstyle\sum P(B\mid\text{group})P(\text{group})`,
        plain: T`To find how often \(B\) happens overall, split everyone into non-overlapping groups (here \(A\) and not-\(A\)), find how often \(B\) happens in each group, weight each rate by its group’s size and add. This gives the denominator of Bayes’ theorem.`,
        formula: T`P(B)=P(B\mid A)P(A)+P(B\mid A^c)P(A^c)`,
        steps: [T`Multiply each group’s rate of \(B\) by the probability of that group.`, T`Add the products.`],
        examples: [[T`\(P(A)=0.2\), rates \(0.8\) and \(0.1\)`, T`\(0.16+0.08=0.24\)`], [T`\(P(A)=0.01\), same rates`, T`\(0.008+0.099=0.107\)`], [T`\(P(A)=0.3\), rates \(0.8\) and \(0.2\)`, T`\(0.24+0.14=0.38\)`]],
        pitfall: T`The groups must cover everyone without overlapping. Leaving out the false-positive route makes \(P(B)\) too small.`,
        seeAlso: [26, 47]
      },
      {
        id: 'bayes-theorem', term: 'Bayes’ theorem', symbol: T`P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}`,
        plain: T`Bayes’ theorem reverses a conditional probability. From how often a detector fires on real objects, \(P(B\mid A)\), and how common the objects are, \(P(A)\), it gives how often a fired detector is right, \(P(A\mid B)\). The base rate \(P(A)\) matters a lot: when objects are rare, most alerts can be false.`,
        formula: T`P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B\mid A)P(A)+P(B\mid A^c)P(A^c)}`,
        steps: [T`Compute the true route \(P(B\mid A)P(A)\).`, T`Compute the false route \(P(B\mid A^c)P(A^c)\).`, T`Divide the true route by the sum of both routes.`],
        examples: [[T`\(P(A)=0.2\), rates \(0.8\) and \(0.1\)`, T`\(0.16/0.24=2/3\approx0.667\)`], [T`\(P(A)=0.01\), same rates`, T`\(0.008/0.107\approx0.0748\)`], [T`\(P(A)=0.3\), rates \(0.8\) and \(0.2\)`, T`\(0.24/0.38\approx0.632\)`], [T`as counts in 1000 images`, T`160 true flags, 80 false flags: \(160/240\)`]],
        pitfall: T`A detector that finds 80% of objects can still be wrong on most of its alerts when the object is rare. A softmax score is not automatically a calibrated \(P(A\mid B)\).`,
        seeAlso: [24, 26, 47]
      },
      {
        id: 'independent-events', term: 'Independent events', symbol: T`P(A\cap B)=P(A)P(B)`,
        plain: T`Two events are independent when knowing that one happened does not change the probability of the other. Then the probability of both is the product of the separate probabilities. Independence is a specific claim to check, not a default: neighbouring video frames, for example, are usually far from independent.`,
        formula: T`P(A\cap B)=P(A)\,P(B)\iff P(A\mid B)=P(A)`,
        steps: [T`Compute \(P(A)P(B)\).`, T`Compare it with the actual \(P(A\cap B)\), or compare \(P(A\mid B)\) with \(P(A)\).`, T`Equal means independent; different means dependent.`],
        examples: [[T`independent, \(P(A)=0.4,\ P(B)=0.5\)`, T`\(P(A\cap B)=0.2\)`], [T`two fair coin flips, both heads`, T`\(0.5\times0.5=0.25\)`], [T`detector: \(P(A)=0.2,\ P(B)=0.24,\ P(A\cap B)=0.16\)`, T`\(0.2\times0.24=0.048\neq0.16\): dependent, so the flag carries information`]],
        pitfall: T`Independent is not the same as mutually exclusive. Two events with nonzero probabilities that cannot happen together are strongly dependent.`,
        seeAlso: [22, 23, 24, 25]
      }
    ]
  });

  add(22, {
    builds: [{lesson: 21, why: 'a distribution gives each outcome a probability'}, {lesson: 17, why: 'an integral is a limit of sums, undone by derivatives'}, {lesson: 3, why: 'an average is a sum divided by a count'}],
    recall: ['probability', 'mean', 'summation-notation', 'limit', 'derivative'],
    symbols: [
      ['E[X]', 'expected value of X: the probability-weighted average of its possible values', 'expected-value'],
      ['P(X=x)', 'probability that the random variable X takes the particular value x', 'random-variable']
    ],
    terms: [
      {
        id: 'random-variable', term: 'Random variable and its distribution', symbol: T`X`,
        plain: T`A random variable turns an uncertain outcome into a number, such as 1 if an image contains a cat and 0 if not. Capital \(X\) names the variable; lowercase \(x\) names one value it can take. For a discrete variable, the distribution lists each possible value with its probability \(P(X=x)\); these are never negative and add to 1.`,
        formula: T`P(X=x)\ge0,\qquad \sum_xP(X=x)=1;\qquad \text{Bernoulli: }P(X=1)=p,\ \ P(X=0)=1-p`,
        steps: [T`List the values the variable can take.`, T`Give each value its probability.`, T`Check that none is negative and that they add up to 1.`],
        examples: [[T`Bernoulli with \(p=0.6\)`, T`\(P(X=1)=0.6,\ P(X=0)=0.4\)`], [T`fair die`, T`each of \(1,\dots,6\) has probability \(1/6\)`], [T`noise \(-1,0,1\) with \(0.25,0.5,0.25\)`, T`adds to 1: valid`], [T`values \(0,2,4\) with \(0.2,0.5,0.4\)`, T`adds to \(1.1\): not a valid distribution`]],
        pitfall: T`The variable \(X\) and an observed value \(x\) are different things: \(X\) describes every possible outcome, while \(x=1\) is what happened once.`,
        seeAlso: [23, 24, 25]
      },
      {
        id: 'expected-value', term: 'Expected value (expectation)', symbol: T`\mathbb E[X]`,
        plain: T`The probability-weighted average of the values a random variable can take: the long-run average you would expect over many repetitions. It need not be a value the variable can actually produce. The average of observed samples, the sample mean, estimates it, and is itself random because the samples vary.`,
        formula: T`\mathbb E[X]=\sum_xx\,P(X=x),\qquad \mathbb E[f(X)]=\sum_xf(x)\,P(X=x),\qquad \mathbb E[aX+bY]=a\,\mathbb E[X]+b\,\mathbb E[Y]`,
        steps: [T`Multiply each value by its probability.`, T`Add the products.`, T`For \(\mathbb E[f(X)]\), apply \(f\) to each value first, then weight and add.`],
        examples: [[T`Bernoulli, \(p=0.6\)`, T`\(0\cdot0.4+1\cdot0.6=0.6\)`], [T`fair die`, T`\((1+2+\dots+6)/6=3.5\), not a possible roll`], [T`values \(0,2,4\) with \(0.2,0.5,0.3\)`, T`\(0+1+1.2=2.2\)`], [T`noise \(-1,0,1\) with \(0.25,0.5,0.25\)`, T`\(\mathbb E[X]=0\), but \(\mathbb E[X^2]=0.5\)`], [T`\(\mathbb E[X]=2,\ \mathbb E[Y]=3\)`, T`\(\mathbb E[2X-Y]=4-3=1\)`]],
        pitfall: T`Linearity needs no independence, but \(\mathbb E[X^2]\) is not \((\mathbb E[X])^2\): the noise example gives \(0.5\) versus \(0\).`,
        seeAlso: [23, 25, 28, 39, 54]
      },
      {
        id: 'integral', term: 'Integral (area under a curve)', symbol: T`\int_a^bf(x)\,dx`,
        plain: T`The integral of \(f\) from \(a\) to \(b\) is the area between the curve and the horizontal axis over that interval: the limit of adding many very narrow rectangles. The fundamental theorem of calculus makes it computable: find an antiderivative \(F\), a function whose derivative is \(f\), and take \(F(b)-F(a)\). Probabilities and expectations of continuous variables are integrals.`,
        formula: T`\int_a^bf(x)\,dx=F(b)-F(a)\ \text{ where }F'=f;\qquad \int x^n\,dx=\frac{x^{n+1}}{n+1}+C\ \ (n\ne-1);\qquad \int_{-\infty}^{\infty}e^{-x^2/2}\,dx=\sqrt{2\pi}`,
        steps: [T`For flat or straight pieces, use rectangle (width × height) and triangle (½ × base × height) areas.`, T`Otherwise find an antiderivative \(F\): for \(x^n\), raise the power by one and divide by the new power; \(e^x\) is its own antiderivative.`, T`Compute \(F(b)-F(a)\); any added constant \(C\) cancels.`, T`Some integrals have no simple \(F\). The bell-curve area \(\sqrt{2\pi}\) is a known result, and computers add narrow rectangles numerically.`],
        examples: [[T`\(\int_{0.5}^{1.5}\tfrac12\,dx\)`, T`rectangle \(1\times\tfrac12=0.5\)`], [T`\(\int_0^2\tfrac x2\,dx\)`, T`triangle \(\tfrac12\cdot2\cdot1=1\); or \(F=x^2/4\): \(1-0=1\)`], [T`\(\int_0^1x^2\,dx\)`, T`\(F=x^3/3\): \(1/3\approx0.333\)`], [T`\(\int_0^1e^x\,dx\)`, T`\(e^1-e^0\approx1.718\)`], [T`\(\int_{-\infty}^{\infty}e^{-x^2/2}\,dx\)`, T`\(\sqrt{2\pi}\approx2.507\): why the Gaussian divides by \(\sqrt{2\pi}\,\sigma\)`]],
        pitfall: T`\(dx\) only names the variable you integrate over; it is not a number to multiply. Area below the axis counts as negative.`,
        seeAlso: [23, 25]
      },
      {
        id: 'probability-density', term: 'Probability density', symbol: T`p(x)`,
        plain: T`For a continuous variable, such as a noise value, any single exact value has probability zero, so we describe it with a density instead. A density is never negative and has total area 1; the probability of landing in an interval is the area under the density over that interval. A density’s height can exceed 1.`,
        formula: T`P(a\le X\le b)=\int_a^bp(x)\,dx,\qquad \int_{-\infty}^{\infty}p(x)\,dx=1,\qquad \mathbb E[X]=\int x\,p(x)\,dx`,
        steps: [T`Check that the density is never negative and that its total area is 1.`, T`For an interval, find the area under \(p(x)\) between its ends.`, T`For a single exact value the area, and so the probability, is 0.`],
        examples: [[T`uniform on \([0,2]\)`, T`\(p(x)=\tfrac12\); \(P(0.5\le X\le1.5)=1\times\tfrac12=0.5\)`], [T`uniform on \([0,0.1]\)`, T`\(p(x)=10\): valid, since the area is \(0.1\times10=1\)`], [T`uniform on \([0,4]\)`, T`\(P(1\le X\le3)=2\times\tfrac14=0.5\); \(P(X=2)=0\)`], [T`uniform on \([0,2]\)`, T`\(\mathbb E[X]=\int_0^2\tfrac x2\,dx=1\)`]],
        pitfall: T`A density value is not a probability; only areas are. Its units are “per unit of \(x\)”, which is why it can be 10.`,
        seeAlso: [23, 25]
      },
      {
        id: 'cumulative-distribution-function', term: 'Cumulative distribution function (CDF)', symbol: T`F(t)=P(X\le t)`,
        plain: T`The probability that the variable is at most \(t\). It starts at 0 on the far left, never decreases, and reaches 1 on the far right. For a continuous variable it is the area under the density to the left of \(t\), and differences of the CDF give interval probabilities.`,
        formula: T`F(t)=P(X\le t)=\int_{-\infty}^{t}p(x)\,dx,\qquad P(a<X\le b)=F(b)-F(a)`,
        steps: [T`Find the area, or add the probabilities, of everything at or below \(t\).`, T`For an interval, subtract: \(F(b)-F(a)\).`],
        examples: [[T`uniform on \([0,2]\), \(t=0.5\)`, T`\(F=0.25\)`], [T`same, \(t=1\)`, T`\(F=0.5\)`], [T`same, \(t=-1\) and \(t=3\)`, T`\(F=0\) and \(F=1\)`], [T`\(P(0.5<X\le1.5)\)`, T`\(F(1.5)-F(0.5)=0.75-0.25=0.5\)`]],
        plot: {fn: 'x => Math.min(1, Math.max(0, x / 2))', x: [-1, 3], y: [0, 1], xLabel: 't', yLabel: 'F(t), uniform on [0, 2]', marks: [0.5, 1.5]},
        pitfall: T`Unlike a density, a CDF always lies between 0 and 1.`
      },
      {
        id: 'marginalization', term: 'Marginalizing (integrating out a variable)', symbol: T`p(x)=\int p(x,y)\,dy`,
        plain: T`A joint distribution gives the probability of two variables taking values together. To get the distribution of just one of them, add, or for continuous variables integrate, over every value of the other. This is the law of total probability in general form, and it also produces the denominator of Bayes’ theorem.`,
        formula: T`P(X=x)=\sum_yP(X=x,\,Y=y),\qquad p(x)=\int p(x,y)\,dy`,
        steps: [T`Fix the value \(x\) you want.`, T`Add the joint probabilities over every value of \(y\), or integrate the joint density over \(y\).`, T`Check that the result adds (or integrates) to 1 over all \(x\).`],
        examples: [[T`joint (object, flag): yes-yes \(0.16\), yes-no \(0.04\), no-yes \(0.08\), no-no \(0.72\)`, T`\(P(\text{object})=0.16+0.04=0.2\); \(P(\text{flag})=0.16+0.08=0.24\)`], [T`\(p(x,y)=1\) on the unit square`, T`\(p(x)=\int_0^11\,dy=1\) for \(0\le x\le1\)`], [T`\(p(x,y)=x+y\) on the unit square`, T`\(p(x)=\int_0^1(x+y)\,dy=x+\tfrac12\)`]],
        pitfall: T`Marginalizing throws away how the variables relate: very different joint distributions can share the same marginals.`,
        seeAlso: [26]
      }
    ]
  });

  add(23, {
    builds: [{lesson: 22, why: 'variance is an expected value of squared deviations'}, {lesson: 21, why: 'averaging helps only for independent measurements'}, {lesson: 15, why: 'the sample covariance matrix of data'}],
    recall: ['expected-value', 'covariance-matrix', 'natural-exponential', 'determinant', 'matrix-inverse'],
    symbols: [
      ['X̄', 'the average of n independent samples that all have the same variance', 'variance-of-the-mean'],
      ['σ²', 'variance of a single sample: its expected squared distance from the mean', 'variance']
    ],
    terms: [
      {
        id: 'variance', term: 'Variance', symbol: T`\operatorname{Var}(X)`,
        plain: T`Variance measures how spread out a quantity is: the expected squared distance from its mean. Squaring stops positive and negative deviations cancelling and weights big deviations more. For a list of data, divide the summed squares by \(N\) if the list is the whole population, or by \(N-1\) to estimate a population’s variance from a sample.`,
        formula: T`\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]=\mathbb E[X^2]-\mu^2,\qquad \operatorname{Var}(aX+b)=a^2\operatorname{Var}(X)`,
        steps: [T`Find the mean \(\mu\).`, T`Square each value’s distance from \(\mu\).`, T`Average the squares: weight them by probability, or divide by \(N\) (or \(N-1\)) for data.`],
        examples: [[T`equally likely \(0,2,4\)`, T`\(\mu=2\); \((4+0+4)/3=8/3\approx2.667\)`], [T`data \(1,3,5\)`, T`population \(8/3\approx2.667\); sample \(8/2=4\)`], [T`noise \(-1,0,1\) with \(0.25,0.5,0.25\)`, T`\(\mathbb E[X^2]-0^2=0.5\)`], [T`\(\operatorname{Var}(X)=4\)`, T`\(\operatorname{Var}(3X+2)=9\cdot4=36\)`]],
        pitfall: T`Adding a constant does not change the spread, and scaling by \(a\) multiplies the variance by \(a^2\), not by \(a\). Always state which denominator you used.`,
        seeAlso: [24, 28, 32, 39]
      },
      {
        id: 'standard-deviation', term: 'Standard deviation', symbol: T`\sigma=\sqrt{\operatorname{Var}(X)}`,
        plain: T`The square root of the variance: the non-negative number that, multiplied by itself, gives the variance. It measures spread in the same units as the data (intensity, not intensity squared), so it is the easier number to read; a typical deviation from the mean is about one standard deviation.`,
        formula: T`\sigma=\sqrt{\sigma^2},\qquad \sigma\ge0`,
        steps: [T`Compute the variance.`, T`Take its square root, the non-negative number that squared gives the variance.`],
        examples: [[T`variance \(4\)`, T`\(\sigma=2\)`], [T`variance \(8/3\)`, T`\(\sigma\approx1.633\)`], [T`variance \(3\)`, T`\(\sigma\approx1.732\)`], [T`\(\operatorname{Var}(3X+2)=36\)`, T`\(\sigma=6=3\times2\)`]],
        pitfall: T`Standard deviations do not add: two independent noises with \(\sigma=1\) combine to \(\sqrt2\approx1.414\), not 2. Add the variances, then take the root.`,
        seeAlso: [24, 32, 46, 52]
      },
      {
        id: 'covariance', term: 'Covariance and correlation', symbol: T`\operatorname{Cov}(X,Y)`,
        plain: T`Covariance measures whether two quantities move together: positive if they tend to be above their means at the same time, negative if one tends to be high when the other is low. It decides how variances combine when quantities are added and fills the off-diagonal of a covariance matrix \(\Sigma\). Dividing by both standard deviations gives the correlation \(\rho\), a unit-free number from −1 to 1.`,
        formula: T`\operatorname{Cov}(X,Y)=\mathbb E\bigl[(X-\mathbb E X)(Y-\mathbb E Y)\bigr],\qquad \operatorname{Var}(X+Y)=\operatorname{Var}X+\operatorname{Var}Y+2\operatorname{Cov}(X,Y),\qquad \rho=\frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}`,
        steps: [T`Subtract each variable’s mean.`, T`Multiply the two deviations for each outcome.`, T`Average the products, weighting by probability: that is the covariance.`, T`For the correlation, divide by the product of the two standard deviations (neither may be zero).`],
        examples: [[T`\(\operatorname{Var}X=\operatorname{Var}Y=1,\ \operatorname{Cov}=0.5\)`, T`\(\operatorname{Var}(X+Y)=1+1+1=3\)`], [T`same, \(\operatorname{Cov}=-0.5\)`, T`\(1+1-1=1\): the fluctuations partly cancel`], [T`\(\operatorname{Cov}=2,\ \sigma_X=1,\ \sigma_Y=4\)`, T`\(\rho=2/4=0.5\)`], [T`\(Y=-2X\)`, T`\(\rho=-1\): a perfect downhill line`], [T`\(X\) uniform on \(-1,0,1\), \(Y=X^2\)`, T`\(\operatorname{Cov}=\mathbb E[X^3]-0=0\), so \(\rho=0\), yet \(Y\) depends on \(X\)`]],
        pitfall: T`Zero covariance does not mean independence: it only rules out a straight-line trend, as the \(Y=X^2\) example shows. Independence does imply zero covariance.`,
        seeAlso: [24, 46]
      },
      {
        id: 'gaussian-distribution', term: 'Gaussian (normal) distribution', symbol: T`\mathcal N(\mu,\sigma^2)`,
        plain: T`The bell-shaped density used to model continuous noise. It is centred at the mean \(\mu\) and its width is set by the standard deviation \(\sigma\): about 68% of the area lies within one \(\sigma\) of the mean and about 95% within \(1.96\sigma\). \(X\sim\mathcal N(\mu,\sigma^2)\) reads “\(X\) has this distribution”.`,
        formula: T`p(x)=\frac{1}{\sqrt{2\pi}\,\sigma}\exp\!\Bigl(-\frac{(x-\mu)^2}{2\sigma^2}\Bigr),\qquad \sigma>0`,
        steps: [T`Subtract the mean and divide by \(\sigma\): \(t=(x-\mu)/\sigma\).`, T`Compute \(e^{-t^2/2}\).`, T`Divide by \(\sqrt{2\pi}\,\sigma\approx2.507\,\sigma\).`],
        examples: [[T`\(\mu=0,\ \sigma=1,\ x=0\)`, T`\(1/\sqrt{2\pi}\approx0.399\), the peak`], [T`\(\mu=0,\ \sigma=1,\ x=1\)`, T`\(0.399\,e^{-0.5}\approx0.242\)`], [T`\(\mu=0,\ \sigma=0.1,\ x=0\)`, T`\(\approx3.989\): a density above 1`], [T`area within \(\mu\pm1.96\sigma\)`, T`\(\approx0.95\)`]],
        plot: {fn: 'x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)', x: [-4, 4], y: [0, 0.45], xLabel: 'x (μ = 0, σ = 1)', yLabel: 'density p(x)', marks: [0, 1, 2]},
        pitfall: T`Real pixel noise is often not exactly Gaussian: clipping to \([0,255]\), rounding and brightness-dependent noise all break the model. Independent Gaussian noise of variance \(\sigma^2\) on every pixel has covariance matrix \(\sigma^2I\).`,
        seeAlso: [24, 25, 26, 32]
      },
      {
        id: 'multivariate-gaussian', term: 'Multivariate Gaussian', symbol: T`\mathcal N(\mu,\Sigma)`,
        plain: T`The Gaussian for a vector of several, possibly correlated, values. The mean vector \(\mu\) sets the centre and the covariance matrix \(\Sigma\) the spread and tilt. Points of equal density lie on ellipses whose axes point along the eigenvectors of \(\Sigma\), with half-lengths proportional to \(\sqrt{\lambda_i}\). The Mahalanobis distance counts standard deviations from the centre, allowing for correlation.`,
        formula: T`p(x)=\frac{1}{(2\pi)^{d/2}|\Sigma|^{1/2}}\exp\!\Bigl(-\tfrac12(x-\mu)^T\Sigma^{-1}(x-\mu)\Bigr),\qquad d_M^2=(x-\mu)^T\Sigma^{-1}(x-\mu),\qquad x=\mu+L\varepsilon,\ \ LL^T=\Sigma`,
        steps: [T`Subtract the mean: \(x-\mu\).`, T`Squared Mahalanobis distance: \(d_M^2=(x-\mu)^T\Sigma^{-1}(x-\mu)\), using the matrix inverse. For a diagonal \(\Sigma\), add each squared deviation divided by its variance.`, T`Density: \(e^{-d_M^2/2}\) divided by \((2\pi)^{d/2}\sqrt{|\Sigma|}\), where \(d\) counts the coordinates and \(|\Sigma|\) is the determinant.`, T`To sample: find a matrix square root \(L\) with \(LL^T=\Sigma\) (\(\texttt{np.linalg.cholesky}\)), draw \(\varepsilon\) of independent \(\mathcal N(0,1)\) values, and return \(\mu+L\varepsilon\).`],
        examples: [[T`\(\Sigma=\operatorname{diag}(4,1)\), \(x-\mu=(2,1)\)`, T`\(d_M^2=4/4+1/1=2\), \(d_M\approx1.414\) (straight-line distance \(\sqrt5\approx2.236\))`], [T`\(\Sigma=\begin{bmatrix}1&0.5\\0.5&1\end{bmatrix}\), \(x-\mu=(1,1)\) and \((1,-1)\)`, T`\(d_M^2\approx1.333\) and \(4\): going against the correlation is “farther”`], [T`density at the centre, \(d=2\)`, T`\(\Sigma=I\): \(1/(2\pi)\approx0.159\); \(\Sigma=\operatorname{diag}(4,1)\): \(1/(2\pi\cdot2)\approx0.0796\)`], [T`ellipse axes for \(\Sigma=\begin{bmatrix}1&0.5\\0.5&1\end{bmatrix}\)`, T`along \((1,1)/\sqrt2\) and \((1,-1)/\sqrt2\); half-lengths \(\propto\sqrt{1.5}\approx1.225\) and \(\sqrt{0.5}\approx0.707\)`], [T`sample with \(\Sigma=\operatorname{diag}(4,1)\), \(\varepsilon=(0.5,-1)\)`, T`\(L=\operatorname{diag}(2,1)\): \(x=\mu+(1,-1)\)`], [T`sample with \(\Sigma=\begin{bmatrix}1&0.5\\0.5&1\end{bmatrix}\), \(\varepsilon=(1,0)\)`, T`\(L=\begin{bmatrix}1&0\\0.5&0.866\end{bmatrix}\): \(x=\mu+(1,\ 0.5)\)`]],
        pitfall: T`A matrix square root is not the square root of each entry, and \(L\) is not unique. With independent coordinates \(\Sigma\) is diagonal and the density is a product of one-dimensional Gaussians.`,
        seeAlso: [52]
      },
      {
        id: 'variance-of-the-mean', term: 'Variance of an average', symbol: T`\operatorname{Var}(\bar X)=\frac{\sigma^2}{n}`,
        plain: T`Averaging \(n\) independent measurements that each have variance \(\sigma^2\) gives an average with variance \(\sigma^2/n\), so its standard deviation is \(\sigma/\sqrt n\). This is why averaging noisy frames reduces noise, but only for independent measurements: correlated ones keep extra covariance terms.`,
        formula: T`\bar X=\frac1n\sum_{i=1}^nX_i,\qquad \operatorname{Var}(\bar X)=\frac{\sigma^2}{n},\qquad \operatorname{SD}(\bar X)=\frac{\sigma}{\sqrt n}`,
        steps: [T`Check that the measurements are independent and share the variance \(\sigma^2\).`, T`Divide the variance by \(n\).`, T`For the standard deviation, divide \(\sigma\) by \(\sqrt n\).`],
        examples: [[T`\(\sigma^2=4,\ n=4\)`, T`\(\operatorname{Var}(\bar X)=1\)`], [T`\(\sigma^2=4,\ n=16\)`, T`\(0.25\); standard deviation \(2/4=0.5\)`], [T`two copies of the same frame`, T`still \(\sigma^2\): perfectly correlated, no gain`]],
        pitfall: T`Variance shrinks as \(1/n\) but the standard deviation only as \(1/\sqrt n\): four times the data halves the spread. Near-duplicate frames are not independent measurements.`,
        seeAlso: [24, 30, 46]
      }
    ]
  });

  add(24, {
    builds: [{lesson: 23, why: 'an average of n independent values has variance σ²/n'}, {lesson: 22, why: 'each correct/incorrect prediction is a Bernoulli variable'}, {lesson: 21, why: 'the formulas assume independent observations'}],
    recall: ['variance-of-the-mean', 'standard-deviation', 'gaussian-distribution', 'random-variable', 'independent-events'],
    symbols: [
      ['k', 'number of successes observed, such as correct predictions', 'sample-proportion'],
      ['n', 'sample size: the number of independent observations', 'sample-proportion'],
      ['p̂', 'sample proportion k/n: an estimate of the true rate p', 'sample-proportion']
    ],
    terms: [
      {
        id: 'sample-proportion', term: 'Sample proportion', symbol: T`\hat p=\frac kn`,
        plain: T`The fraction of successes in a sample, such as correct predictions on a test set: count them and divide by the sample size. It estimates the true rate \(p\) in the wider population. A different sample would give a different count, so the estimate has its own variance, \(p(1-p)/n\).`,
        formula: T`\hat p=\frac kn=\frac1n\sum_{i=1}^nC_i,\qquad \operatorname{Var}(\hat p)=\frac{p(1-p)}{n}`,
        steps: [T`Count the successes \(k\).`, T`Divide by the number of independent trials \(n\).`, T`Report \(n\) alongside the estimate.`],
        examples: [[T`9 correct out of 10`, T`\(\hat p=0.9\)`], [T`900 correct out of 1000`, T`\(\hat p=0.9\), with far more evidence`], [T`80 correct out of 100`, T`\(\hat p=0.8\)`], [T`5 correct out of 5`, T`\(\hat p=1\), which is not proof of perfect performance`]],
        pitfall: T`Equal proportions can carry very different evidence: \(9/10\) and \(900/1000\) are both 0.9. The hat on \(\hat p\) marks an estimate, not the true value.`,
        seeAlso: [28, 44]
      },
      {
        id: 'standard-error', term: 'Standard error', symbol: T`\operatorname{SE}`,
        plain: T`The standard deviation of an estimate across repeated samples: how much a sample mean or an accuracy would typically change if you collected a fresh sample of the same size. It shrinks with the square root of the sample size, so four times more data halves it.`,
        formula: T`\operatorname{SE}(\bar X)=\frac{\sigma}{\sqrt n},\qquad \operatorname{SE}(\hat p)\approx\sqrt{\frac{\hat p(1-\hat p)}{n}}`,
        steps: [T`Find the spread of one observation: \(\sigma\), or \(\sqrt{\hat p(1-\hat p)}\) for a proportion.`, T`Divide by \(\sqrt n\).`],
        examples: [[T`\(\sigma=2,\ n=25\)`, T`\(2/5=0.4\)`], [T`\(\hat p=0.8,\ n=100\)`, T`\(\sqrt{0.16/100}=0.04\)`], [T`\(\hat p=0.8,\ n=25\)`, T`\(0.08\): a quarter of the data doubles it`], [T`\(\hat p=0.5,\ n=100\)`, T`\(0.05\)`]],
        pitfall: T`The standard error describes the estimate, not individual observations, which still spread with \(\sigma\). The plug-in formula fails for tiny samples and for rates near 0 or 1.`,
        seeAlso: [28, 46]
      },
      {
        id: 'confidence-interval', term: 'Confidence interval', symbol: T`\text{estimate}\pm1.96\,\operatorname{SE}`,
        plain: T`A range built from the sample so that, if you repeated the whole sampling procedure many times, about 95% of such ranges would contain the true value. The rough recipe is estimate ± 1.96 standard errors; 1.96 comes from the Gaussian, which has 95% of its area within 1.96 standard deviations of its mean.`,
        formula: T`\text{estimate}\pm1.96\times\operatorname{SE}`,
        steps: [T`Compute the estimate and its standard error.`, T`Multiply the standard error by 1.96 to get the margin.`, T`Subtract and add the margin.`],
        examples: [[T`\(\hat p=0.8,\ \operatorname{SE}=0.04\)`, T`\(0.8\pm0.0784\to[0.722,\ 0.878]\)`], [T`\(\bar X\) with \(\operatorname{SE}=0.4\)`, T`\(\bar X\pm0.784\)`], [T`\(\hat p=0.5,\ n=100\)`, T`\(0.5\pm0.098\to[0.402,\ 0.598]\)`], [T`3 correct out of 3`, T`\(\operatorname{SE}=0\), interval \([1,1]\): the approximation has failed`]],
        pitfall: T`The 95% describes the procedure, not this particular interval. It covers sampling noise under its assumptions only, not bias from an unrepresentative test set.`,
        seeAlso: [28, 46, 47]
      },
      {
        id: 'bootstrap', term: 'Bootstrap',
        plain: T`A way to estimate uncertainty by reusing the data you have. Draw a new sample of the same size from your observations with replacement, so some appear twice and some not at all, recompute the statistic, and repeat many times. The spread of the recomputed values approximates the sampling spread; their middle 95% gives an interval.`,
        steps: [T`Choose the sampling unit: single images, or whole videos or patients when frames are related.`, T`Draw \(n\) units at random with replacement and recompute the statistic.`, T`Repeat many times, for example 1000.`, T`Use the 2.5th and 97.5th percentiles as the interval: the values below which 2.5% and 97.5% of the results fall.`],
        examples: [[T`observed correctness \((1,1,0,1,1)\)`, T`accuracy \(0.8\)`], [T`one resample \((1,0,0,1,1)\)`, T`accuracy \(0.6\)`], [T`another resample \((1,1,1,1,1)\)`, T`accuracy \(1.0\)`], [T`1000 resampled accuracies, sorted`, T`the 25th and 975th values bound a 95% interval`]],
        pitfall: T`The bootstrap can only reuse what was observed; it cannot invent failure modes missing from the test set. Resampling single frames from correlated videos understates the uncertainty.`,
        seeAlso: [46]
      },
      {
        id: 'iid-sampling', term: 'Independent and identically distributed (iid)', symbol: T`X_i\overset{\text{iid}}{\sim}\mathcal N(\mu,\sigma^2)`,
        plain: T`The standard assumption behind most uncertainty formulas: every observation comes from the same distribution (identically distributed) and none tells you anything about another (independent). The symbol \(\sim\) reads “is distributed as”. Formulas such as \(\sigma/\sqrt n\) rely on this assumption.`,
        steps: [T`Ask whether every observation was drawn from the same population and conditions.`, T`Ask whether observations share causes (same video, patient or scene) that make them move together.`, T`If either fails, group related observations and treat each group as one unit.`],
        examples: [[T`25 photos of 25 unrelated scenes`, T`roughly iid`], [T`25 consecutive frames of one video`, T`not independent: effectively far fewer observations`], [T`training images by day, test images at night`, T`not identically distributed`]],
        pitfall: T`Collecting more correlated data does not shrink uncertainty as fast as \(1/\sqrt n\) promises.`,
        seeAlso: [25, 28, 45]
      }
    ]
  });

  add(25, {
    builds: [{lesson: 4, why: 'the loss is minus the log of the true-class probability'}, {lesson: 22, why: 'a Bernoulli variable models a yes/no target'}, {lesson: 23, why: 'the Gaussian density models residual noise'}],
    recall: ['negative-log-loss', 'natural-logarithm', 'random-variable', 'gaussian-distribution', 'mean-squared-error'],
    symbols: [
      ['θ', 'model parameters: adjusted while the observed data stay fixed', 'likelihood'],
      ['pθ', 'probability the model with parameters θ gives to the target actually observed', 'negative-log-likelihood']
    ],
    terms: [
      {
        id: 'likelihood', term: 'Likelihood', symbol: T`\mathcal L(\theta)`,
        plain: T`How plausible the observed data are under a model with parameters \(\theta\): multiply together the probabilities the model gives to each observed target. The data stay fixed and \(\theta\) is varied, so likelihood compares candidate parameters. \(\prod\) means “multiply these together”, just as \(\sum\) means add them.`,
        formula: T`\mathcal L(\theta)=\prod_{i=1}^Np_\theta(y_i\mid x_i)=p_\theta(y_1\mid x_1)\times\cdots\times p_\theta(y_N\mid x_N)`,
        steps: [T`For each observation, find the probability the model gives to its observed target.`, T`Multiply these probabilities together; this assumes independent observations.`, T`Repeat for another \(\theta\) and compare: higher means more plausible.`],
        examples: [[T`\(y=(1,1,1,0)\), \(p=0.5\)`, T`\(0.5^3\times0.5=0.0625\)`], [T`same, \(p=0.75\)`, T`\(0.75^3\times0.25\approx0.105\)`], [T`same, \(p=0.9\)`, T`\(0.9^3\times0.1\approx0.0729\)`], [T`same, \(p=1\)`, T`\(0\): the observed 0 has become impossible`]],
        plot: {fn: 'x => x ** 3 * (1 - x)', x: [0, 1], y: [0, 0.12], xLabel: 'candidate p', yLabel: 'likelihood p³(1 − p)', marks: [0.5, 0.75, 0.9]},
        pitfall: T`A likelihood is not a probability distribution over \(\theta\): its values need not add up to 1. With many observations the product becomes tiny and can underflow, which is one reason to take logs.`,
        seeAlso: [26, 54]
      },
      {
        id: 'maximum-likelihood-estimation', term: 'Maximum likelihood estimate (MLE)', symbol: T`\hat\theta_{\rm MLE}=\operatorname*{arg\,max}_\theta\mathcal L(\theta)`,
        plain: T`Choose the parameters that make the observed data most plausible: the highest point of the likelihood. Because \(\ln\) always increases, maximizing the log-likelihood, or minimizing its negative, gives the same answer and is far easier to compute. For yes/no data with one shared probability, the MLE is the observed fraction of yeses.`,
        formula: T`\hat\theta_{\rm MLE}=\operatorname*{arg\,max}_\theta\mathcal L(\theta)=\operatorname*{arg\,min}_\theta\bigl(-\ln\mathcal L(\theta)\bigr)`,
        steps: [T`Write the negative log-likelihood.`, T`Differentiate it with respect to \(\theta\) and set the derivative to zero.`, T`Solve, and check that you found a minimum of the negative log-likelihood.`],
        examples: [[T`\(y=(1,1,1,0)\)`, T`\(-3\ln p-\ln(1-p)\); derivative \(-\tfrac3p+\tfrac1{1-p}=0\Rightarrow\hat p=0.75\)`], [T`7 successes out of 10`, T`\(\hat p=0.7\)`], [T`Gaussian with fixed variance, data \(1,2,6\)`, T`MLE of the mean is the sample mean, \(3\)`]],
        pitfall: T`The MLE can overfit small samples: 3 successes out of 3 gives \(\hat p=1\), claiming certainty. A prior (Lesson 26) tempers this.`,
        seeAlso: [26, 54]
      },
      {
        id: 'argmax', term: 'Argmax and argmin', symbol: T`\operatorname*{arg\,max}_xf(x)`,
        plain: T`\(\max\) gives the largest value a function reaches; \(\arg\max\) gives the input at which it is reached. Likewise \(\arg\min\) is the input with the smallest value. Training looks for the argmin of a loss, and a classifier predicts the argmax of its class scores.`,
        formula: T`\max_xf(x)=\text{the largest value},\qquad \operatorname*{arg\,max}_xf(x)=\text{the }x\text{ that achieves it}`,
        steps: [T`Evaluate the function at every candidate, or solve where its derivative is zero.`, T`Find the largest (or smallest) value.`, T`Report the input that gives it, not the value itself.`],
        examples: [[T`scores \((2.0,\ 5.1,\ 0.3)\) for classes 0, 1, 2`, T`\(\max=5.1\), \(\arg\max=1\)`], [T`\(p^3(1-p)\) on \([0,1]\)`, T`\(\max\approx0.105\), \(\arg\max=0.75\)`], [T`\((w-2)^2\)`, T`\(\min=0\), \(\arg\min=2\)`]],
        pitfall: T`Adding a constant or multiplying by a positive number never moves the argmax, which is why such constants can be dropped from a loss. Ties can make the argmax not unique.`,
        seeAlso: [26, 28, 41]
      },
      {
        id: 'negative-log-likelihood', term: 'Negative log-likelihood (NLL)', symbol: T`L(\theta)=-\sum_i\ln p_\theta(y_i\mid x_i)`,
        plain: T`The training loss obtained from a likelihood: take the log of each observation’s probability, add them up and flip the sign. Logs turn the product into a sum, and the minus sign turns “maximize plausibility” into “minimize a loss”. An observation costs a lot when the model gave its true target a low probability.`,
        formula: T`L(\theta)=-\ln\mathcal L(\theta)=-\sum_{i=1}^N\ln p_\theta(y_i\mid x_i),\qquad \text{mean NLL}=\frac LN`,
        steps: [T`For each observation, take the natural log of the probability given to its observed target.`, T`Add these logs and change the sign.`, T`Divide by \(N\) for the mean NLL, if that is the stated convention.`],
        examples: [[T`\(y=(1,1,1,0)\), \(p=0.5\)`, T`\(4\ln2\approx2.773\); mean \(\approx0.693\)`], [T`\(y=1,\ p=0.8\) and \(y=0,\ p=0.8\)`, T`\(-\ln0.8\approx0.223\) and \(-\ln0.2\approx1.609\)`], [T`\(y=1,\ p=0.25\)`, T`\(\ln4\approx1.386\)`], [T`labels \((1,0)\), predictions \((0.8,0.3)\)`, T`\(-\ln0.8-\ln0.7\approx0.580\)`]],
        pitfall: T`Summed and mean NLL have the same minimizer but different sizes and gradient scales. For yes/no targets, NLL is exactly binary cross-entropy from Lesson 04.`,
        seeAlso: [26, 27, 28, 54]
      },
      {
        id: 'gaussian-negative-log-likelihood', term: 'Squared error as a Gaussian likelihood', symbol: T`\tfrac{1}{2\sigma^2}\textstyle\sum_i(y_i-f_\theta(x_i))^2`,
        plain: T`If each target equals the model’s prediction plus independent Gaussian noise with a fixed variance \(\sigma^2\), the negative log-likelihood is a constant plus the sum of squared residuals divided by \(2\sigma^2\). So minimizing squared error is maximum likelihood under that noise model.`,
        formula: T`-\ln\mathcal L=N\ln\bigl(\sigma\sqrt{2\pi}\bigr)+\frac{1}{2\sigma^2}\sum_{i=1}^N\bigl(y_i-f_\theta(x_i)\bigr)^2`,
        steps: [T`Compute the residuals \(y_i-f_\theta(x_i)\).`, T`Square and add them, then divide by \(2\sigma^2\).`, T`Add the constant \(N\ln(\sigma\sqrt{2\pi})\); with \(\sigma\) fixed it does not depend on \(\theta\).`],
        examples: [[T`\(\sigma^2=2\)`, T`the squared-residual sum is multiplied by \(1/(2\cdot2)=1/4\)`], [T`\(\sigma=1\), residuals \((1,-1)\), \(N=2\)`, T`\(2\ln\sqrt{2\pi}+\tfrac12\cdot2=\ln(2\pi)+1\approx2.838\)`], [T`\(\sigma=1\), residuals \((0,0)\)`, T`\(\ln(2\pi)\approx1.838\): the constant alone`]],
        pitfall: T`If the model also predicts \(\sigma\), the \(N\ln\sigma\) term depends on the parameters and cannot be dropped. Heavy-tailed or correlated errors call for a different loss.`,
        seeAlso: [26, 52]
      }
    ]
  });

  add(26, {
    builds: [{lesson: 21, why: 'Bayes’ theorem combines a prior with new evidence'}, {lesson: 25, why: 'the likelihood and its negative log'}, {lesson: 12, why: 'ridge adds a squared-weight penalty'}],
    recall: ['bayes-theorem', 'likelihood', 'negative-log-likelihood', 'gaussian-distribution', 'ridge-regression'],
    symbols: [
      ['D', 'the observed data, held fixed while parameter values are compared'],
      ['p(θ)', 'prior: how plausible each parameter value is before seeing D', 'prior'],
      ['∝', 'proportional to: equal up to a positive factor that does not depend on θ', 'proportional-to']
    ],
    terms: [
      {
        id: 'proportional-to', term: 'Proportional to (∝)', symbol: T`\propto`,
        plain: T`\(f(\theta)\propto g(\theta)\) means \(f\) equals \(g\) times some positive constant that does not depend on \(\theta\). You can compare or maximize using the simpler \(g\), because the constant changes heights, not where the peak is. To turn unnormalized values into probabilities, divide each by their total.`,
        formula: T`f(\theta)\propto g(\theta)\iff f(\theta)=c\,g(\theta)\ \text{ for a constant }c>0`,
        steps: [T`Drop every factor that does not involve \(\theta\).`, T`Compare or maximize what remains.`, T`If you need actual probabilities, divide each value by the sum (or integral) of all of them.`],
        examples: [[T`unnormalized \(0.16\) and \(0.08\) (object, no object, given a flag)`, T`\(0.16/0.24=2/3\) and \(0.08/0.24=1/3\)`], [T`unnormalized \((2,1,1)\)`, T`\((0.5,\ 0.25,\ 0.25)\)`], [T`\(5\,e^{-(\theta-1)^2}\propto e^{-(\theta-1)^2}\)`, T`same peak, at \(\theta=1\)`]],
        pitfall: T`The constant may depend on the data but never on \(\theta\). \(\propto\) is not \(\approx\): the two sides can be far apart in value.`
      },
      {
        id: 'prior', term: 'Prior distribution', symbol: T`p(\theta)`,
        plain: T`A probability distribution over the parameters that states what you consider plausible before seeing the current data. A zero-centred Gaussian prior says small weights are more plausible than large ones; its variance \(\tau^2\) sets how strongly. Its negative log becomes a penalty added to the loss.`,
        formula: T`\theta\sim\mathcal N(0,\tau^2)\ \Rightarrow\ -\ln p(\theta)=\frac{\theta^2}{2\tau^2}+\text{constant},\qquad \text{precision }\lambda=\frac1{\tau^2}`,
        steps: [T`Choose a distribution for the parameters, for example \(\mathcal N(0,\tau^2)\) for each weight.`, T`Take its negative log and drop the constants.`, T`Add this penalty to the negative log-likelihood.`],
        examples: [[T`\(\tau^2=1,\ \theta=2\)`, T`penalty \(4/2=2\)`], [T`\(\tau^2=4,\ \theta=2\)`, T`penalty \(4/8=0.5\): a looser prior penalizes less`], [T`\(\tau^2=0.25\)`, T`precision \(\lambda=4\): a tight prior`], [T`\(\theta=0\)`, T`penalty \(0\): the prior’s favourite value`]],
        pitfall: T`A prior is an assumption, not extra data. Justify its strength or choose it with validation, and report it.`
      },
      {
        id: 'posterior', term: 'Posterior distribution', symbol: T`p(\theta\mid D)\propto p(D\mid\theta)\,p(\theta)`,
        plain: T`Bayes’ theorem applied to parameters: what is plausible after seeing the data \(D\). It combines the likelihood (how well \(\theta\) explains the data) with the prior (how plausible \(\theta\) was beforehand). It is written with \(\propto\) because the denominator \(p(D)\) does not depend on \(\theta\).`,
        formula: T`p(\theta\mid D)=\frac{p(D\mid\theta)\,p(\theta)}{p(D)}\propto p(D\mid\theta)\,p(\theta)`,
        steps: [T`Write the likelihood \(p(D\mid\theta)\) and the prior \(p(\theta)\).`, T`Multiply them.`, T`Normalize only if you need actual probabilities.`],
        examples: [[T`\(y=2\), \(y\sim\mathcal N(\theta,1)\), \(\theta\sim\mathcal N(0,1)\)`, T`\(\propto\exp\bigl(-\tfrac{(2-\theta)^2+\theta^2}{2}\bigr)\): a Gaussian centred at 1 with variance \(1/2\)`], [T`compare \(\theta=1\) with \(\theta=2\)`, T`exponents \(-1\) and \(-2\): \(\theta=1\) is more plausible`], [T`\(y=6\), same model`, T`centred at \(3\)`]],
        pitfall: T`The posterior is a whole distribution with a spread, not one number. A likelihood on its own is not a posterior.`
      },
      {
        id: 'map-estimation', term: 'Maximum a posteriori (MAP) estimate', symbol: T`\hat\theta_{\rm MAP}=\operatorname*{arg\,max}_\theta\,p(\theta\mid D)`,
        plain: T`The single most plausible parameter value under the posterior. Taking negative logs turns it into minimizing NLL plus a prior penalty. With Gaussian noise of variance \(\sigma^2\) and a zero-centred Gaussian prior of variance \(\tau^2\), this is exactly ridge regression with \(\lambda=\sigma^2/\tau^2\).`,
        formula: T`\hat\theta_{\rm MAP}=\operatorname*{arg\,min}_\theta\bigl[\operatorname{NLL}(\theta)-\ln p(\theta)\bigr]\ \Rightarrow\ \sum_ir_i^2+\frac{\sigma^2}{\tau^2}\|\theta\|_2^2`,
        steps: [T`Write \(\operatorname{NLL}(\theta)-\ln p(\theta)\) and drop the constants.`, T`Differentiate and set the derivative to zero, or recognize the ridge form.`, T`Solve for \(\theta\).`],
        examples: [[T`\(y=2,\ \sigma^2=\tau^2=1\)`, T`minimize \((\theta-2)^2+\theta^2\): \(\hat\theta=1\) (the MLE would be 2)`], [T`\(y=6\), both variances 1`, T`\(\hat\theta=3\)`], [T`\(\sigma^2=2,\ \tau^2=4\)`, T`\(\lambda=2/4=0.5\)`], [T`\((w-2)^2+\lambda w^2\), \(\lambda=1\)`, T`\(\hat w=2/(1+\lambda)=1\)`]],
        pitfall: T`MAP is one point and says nothing about the posterior’s spread. If the data loss changes from a sum to a mean (divided by \(N\)), divide the penalty coefficient by \(N\) too to keep the same optimum.`,
        seeAlso: [39]
      }
    ]
  });

  add(27, {
    builds: [{lesson: 4, why: 'sigmoid turns one score into a probability'}, {lesson: 25, why: 'cross-entropy is a negative log-likelihood'}, {lesson: 19, why: 'gradients flow back through the scores'}],
    recall: ['sigmoid', 'logit', 'natural-exponential', 'negative-log-loss', 'negative-log-likelihood'],
    symbols: [
      ['z', 'class scores (logits): one real number per class, of any sign', 'softmax'],
      ['y', 'one-hot target: 1 for the true class and 0 for every other class', 'one-hot-encoding'],
      ['L', 'cross-entropy: minus the log of the probability given to the true class', 'cross-entropy']
    ],
    terms: [
      {
        id: 'logistic-regression', term: 'Logistic regression', symbol: T`p=\sigma(w^Tx+b)`,
        plain: T`The simplest probabilistic classifier for two classes. A linear score \(z=w^Tx+b\), weights times features plus a bias, is passed through the sigmoid to give the probability of class 1. Training chooses \(w\) and \(b\) to minimize the negative log-likelihood, which here is binary cross-entropy.`,
        formula: T`z=w^Tx+b,\qquad p=\sigma(z)=\frac1{1+e^{-z}},\qquad \frac{\partial L}{\partial z}=p-y`,
        steps: [T`Compute the score \(z=w^Tx+b\): a dot product plus the bias.`, T`Apply the sigmoid to get \(p\).`, T`For training, the score gradient is \(p-y\); multiply it by \(x\) to get the weight gradient.`],
        examples: [[T`\(w=(2,-1),\ x=(1,1),\ b=0\)`, T`\(z=1\), \(p\approx0.731\)`], [T`same, true label \(y=1\)`, T`loss \(-\ln0.731\approx0.313\); \(\partial L/\partial z\approx-0.269\)`], [T`\(w=(2,-1),\ x=(0,2),\ b=1\)`, T`\(z=-1\), \(p\approx0.269\)`]],
        pitfall: T`Its decision boundary \(z=0\) is a straight line (a flat plane in more dimensions), so it cannot separate classes that need a curved boundary unless you add new features.`,
        seeAlso: [37]
      },
      {
        id: 'softmax', term: 'Softmax', symbol: T`p_j=\frac{e^{z_j}}{\sum_ke^{z_k}}`,
        plain: T`Turns one score per class into probabilities for mutually exclusive classes: exponentiate every score so it is positive, then divide by the total so they add to 1. Larger scores get larger probabilities, and raising one score lowers all the others. Adding the same number to every score changes nothing.`,
        formula: T`p_j=\frac{e^{z_j}}{\sum_ke^{z_k}},\qquad p_j>0,\qquad \sum_jp_j=1`,
        steps: [T`Subtract the largest score from every score, for numerical safety.`, T`Exponentiate each shifted score.`, T`Divide each result by the sum of all of them.`],
        examples: [[T`\(z=(1,1,0)\)`, T`\(e^0,e^0,e^{-1}=1,1,0.368\); sum \(2.368\); \(p\approx(0.422,\ 0.422,\ 0.155)\)`], [T`\(z=(0,\ \ln2)\)`, T`\(p=(1/3,\ 2/3)\)`], [T`\(z=(0,\ \ln3)\)`, T`\(p=(0.25,\ 0.75)\)`], [T`\(z=(1000,\ 1001)\)`, T`shift to \((-1,0)\): \(p\approx(0.269,\ 0.731)\)`]],
        pitfall: T`Softmax assumes exactly one class is true. When several labels can be present at once, use a separate sigmoid for each. A confident softmax is not necessarily calibrated.`,
        seeAlso: [38, 39, 43, 55]
      },
      {
        id: 'one-hot-encoding', term: 'One-hot encoding', symbol: T`y=(0,\dots,1,\dots,0)`,
        plain: T`A way to write a class label as a vector: one entry per class, with 1 for the true class and 0 for every other. It lets the target be compared directly with a vector of predicted probabilities. The positions are only labels; they carry no order.`,
        steps: [T`Fix the class order, for example (cat, dog, background).`, T`Make a vector of zeros with one entry per class.`, T`Put a 1 at the true class’s position.`],
        examples: [[T`true class cat in (cat, dog, background)`, T`\(y=(1,0,0)\)`], [T`class 2 of classes 0, 1, 2`, T`\(y=(0,0,1)\)`], [T`class 1 of classes 0, 1, 2`, T`\(y=(0,1,0)\)`]],
        pitfall: T`Class indices often start at 0, so “class 2” of three classes is the last position. Soft targets such as \((0.9,0.05,0.05)\) are also allowed when justified.`,
        seeAlso: [38, 53, 54]
      },
      {
        id: 'cross-entropy', term: 'Cross-entropy loss', symbol: T`L=-\ln p_t`,
        plain: T`The multiclass training loss: minus the log of the probability the model gave to the true class \(t\). With a one-hot target, the general formula \(-\sum_cy_c\ln p_c\) keeps only that one term. It is the negative log-likelihood of a softmax model and can be computed straight from the scores.`,
        formula: T`L=-\sum_cy_c\ln p_c=-\ln p_t=\operatorname{logsumexp}(z)-z_t`,
        steps: [T`Compute the softmax probabilities.`, T`Pick out the probability of the true class.`, T`Take its natural log and change the sign, or compute \(\operatorname{logsumexp}(z)-z_t\) directly from the scores.`],
        examples: [[T`\(p_{\rm cat}\approx0.422\), true class cat`, T`\(L\approx0.862\)`], [T`\(z=(0,\ \ln3)\), true class 1`, T`\(-\ln0.75\approx0.288\)`], [T`\(z=(0,\ \ln2)\), true class 0`, T`\(-\ln(1/3)=\ln3\approx1.099\)`], [T`\(p_t=1\)`, T`\(L=0\); as \(p_t\to0\), \(L\) grows without bound`]],
        pitfall: T`Check how the true class is indexed (from 0 or from 1). The loss reads only the true class’s probability, but softmax links that probability to every score.`,
        seeAlso: [32, 38, 39, 43, 54]
      },
      {
        id: 'log-sum-exp', term: 'Log-sum-exp and the max-subtraction trick', symbol: T`\operatorname{logsumexp}(z)=m+\ln\sum_je^{z_j-m}`,
        plain: T`\(\ln\sum_je^{z_j}\) appears inside cross-entropy, but a computer overflows on \(e^{1000}\). Subtracting the largest score \(m\) first, then adding it back outside the log, gives the same value without overflow. The same shift leaves softmax probabilities unchanged.`,
        formula: T`\ln\sum_je^{z_j}=m+\ln\sum_je^{z_j-m},\qquad m=\max_jz_j`,
        steps: [T`Find the largest score \(m\).`, T`Subtract \(m\) from every score and exponentiate; now every term is at most 1.`, T`Add them, take the log, then add \(m\) back.`],
        examples: [[T`\(z=(1000,\ 1001)\)`, T`\(1001+\ln(e^{-1}+1)\approx1001.313\)`], [T`\(z=(1,1,0)\)`, T`\(1+\ln2.368\approx1.862\)`], [T`cross-entropy for cat from that`, T`\(1.862-z_{\rm cat}=1.862-1=0.862\)`], [T`\(z=(0,\ \ln3)\)`, T`\(\ln4\approx1.386\); loss for class 1: \(1.386-1.099=0.288\)`]],
        pitfall: T`Taking the log of a softmax probability that has rounded to 0 gives \(\ln0\). Work from the scores with log-sum-exp instead.`,
        seeAlso: [39]
      },
      {
        id: 'softmax-gradient', term: 'Gradient of softmax cross-entropy', symbol: T`\nabla_zL=p-y`,
        plain: T`The derivative of cross-entropy with respect to each class score is simply predicted probability minus target: \(p_c-1\) for the true class and \(p_c\) for every other. Training therefore raises the true score and lowers the others, each in proportion to how wrong the probabilities are.`,
        formula: T`\frac{\partial L}{\partial z_c}=p_c-y_c;\qquad Z=XW+b:\ \ G=\frac{P-Y}{N},\quad dW=X^TG,\quad db=\sum_iG_{i,:}`,
        steps: [T`Compute the softmax probabilities \(p\).`, T`Subtract the one-hot target \(y\).`, T`For a linear layer with a mean loss over \(N\) examples, divide by \(N\); then \(dW=X^TG\), and \(db\) adds up the rows of \(G\).`],
        examples: [[T`\(p\approx(0.422,0.422,0.155)\), \(y=(1,0,0)\)`, T`\((-0.578,\ 0.422,\ 0.155)\)`], [T`\(p=(0.6,0.2,0.2)\), true class 2`, T`\((0.6,\ 0.2,\ -0.8)\)`], [T`\(p=(0.2,0.7,0.1)\), true class 1`, T`\((0.2,\ -0.3,\ 0.1)\)`], [T`\(X\) of shape 8×4, \(W\) of shape 4×3`, T`\(dW\) is 4×3; \(db\) has 3 entries`]],
        pitfall: T`The gradient entries always add up to zero, because \(p\) and \(y\) both add up to 1. A perfect prediction gives a zero gradient.`,
        seeAlso: [38, 53]
      }
    ]
  });

  add(28, {
    builds: [{lesson: 16, why: 'fit everything on training data; avoid leakage'}, {lesson: 25, why: 'NLL scores the probabilities themselves'}, {lesson: 24, why: 'small groups carry sampling uncertainty'}],
    recall: ['train-validation-test-split', 'data-leakage', 'overfitting', 'negative-log-likelihood', 'argmax'],
    symbols: [
      ['R̂', 'empirical risk: the average per-example loss on one named data split', 'empirical-risk'],
      ['ℓ', 'per-example loss: compares one prediction with its target', 'empirical-risk']
    ],
    terms: [
      {
        id: 'empirical-risk', term: 'Empirical risk', symbol: T`\hat R=\frac1n\sum_i\ell(f(x_i),y_i)`,
        plain: T`The average loss of a model over the examples of one named data split. The per-example loss \(\ell\) compares one prediction with its target; averaging gives one number for the split. Training, validation and test risk use the same formula on different data and answer different questions.`,
        formula: T`\hat R=\frac1n\sum_{i=1}^n\ell\bigl(f(x_i),y_i\bigr)`,
        steps: [T`Choose the split and the per-example loss \(\ell\).`, T`Compute \(\ell\) for every example in that split.`, T`Average the results.`],
        examples: [[T`per-example losses \(0.2,\ 0.5,\ 1.1\)`, T`\(1.8/3=0.6\)`], [T`cross-entropy with true-class probabilities \(0.8,\ 0.5,\ 0.25\)`, T`\((0.223+0.693+1.386)/3\approx0.767\)`], [T`0-1 loss (1 if wrong), 3 errors in 20`, T`\(0.15\), the error rate`]],
        pitfall: T`Always name the split. A low training risk says little about new data; the risk on the whole future population is what matters, and a split only estimates it.`,
        seeAlso: [46]
      },
      {
        id: 'bias-variance-tradeoff', term: 'Bias and variance of a model', symbol: T`\text{error}=\text{bias}^2+\text{variance}+\text{noise}`,
        plain: T`Train the same kind of model on many different training sets and look at its prediction for one input. Bias is how far the average prediction is from the truth, typical of too-simple models; variance is how much the predictions scatter between training sets, typical of too-flexible ones. For squared loss the expected error adds them, plus noise that no model can remove.`,
        formula: T`\mathbb E\bigl[(\hat f(x)-f(x))^2\bigr]=\bigl(\mathbb E[\hat f(x)]-f(x)\bigr)^2+\operatorname{Var}\bigl(\hat f(x)\bigr)\quad(+\ \sigma^2_{\rm noise}\text{ for noisy targets})`,
        steps: [T`Collect the predictions at one input from models trained on different training sets.`, T`Bias: their mean minus the true value.`, T`Variance: the variance of those predictions.`, T`Check: mean squared error = bias² + variance (plus the noise variance for noisy targets).`],
        examples: [[T`predictions \(2.0,\ 2.4,\ 2.6\); truth \(3\)`, T`mean \(2.333\); bias \(-0.667\); bias² \(\approx0.444\)`], [T`same predictions`, T`variance \(\approx0.062\)`], [T`check`, T`mean squared error \((1+0.36+0.16)/3\approx0.507=0.444+0.062\)`], [T`straight line fitted to a curve; wiggly polynomial through 5 noisy points`, T`high bias; high variance`]],
        pitfall: T`Training curves suggest but do not prove which one dominates: high training and validation loss can also come from a bug or poor optimization.`,
        seeAlso: [32, 39]
      },
      {
        id: 'calibration', term: 'Calibration', symbol: T`P(\text{correct}\mid\text{confidence }p)=p`,
        plain: T`A model is calibrated when its probabilities match reality: among all the predictions it makes with confidence 0.8, about 80% should turn out correct. Accuracy checks the final decisions; calibration checks the probabilities behind them. A model can be accurate and still overconfident.`,
        formula: T`P(Y=1\mid\hat p=p)=p,\qquad \text{gap}=\bigl|\text{average confidence}-\text{observed frequency}\bigr|`,
        steps: [T`Group predictions with similar confidence into bins.`, T`In each bin, compare the average confidence with the fraction actually correct (or positive).`, T`Plot one against the other in a reliability diagram; calibrated bins lie on the diagonal.`],
        examples: [[T`20 predictions at 0.8, 12 positives`, T`observed \(0.6\), gap \(0.2\): overconfident`], [T`10 predictions at 0.9, 6 correct`, T`observed \(0.6\), gap \(0.3\)`], [T`100 predictions at 0.7, 70 correct`, T`gap \(0\): calibrated in this bin`]],
        pitfall: T`Small bins carry large sampling uncertainty (Lesson 24), and calibration measured on one data distribution can fail after domain shift. Perfect accuracy does not imply calibrated probabilities.`,
        seeAlso: [43, 47, 54]
      },
      {
        id: 'brier-score', term: 'Brier score', symbol: T`\frac1n\sum_i(p_i-y_i)^2`,
        plain: T`A score for probability predictions: the mean squared difference between each predicted probability and the 0/1 outcome. Lower is better and 0 is perfect. Unlike accuracy it rewards honest confidence: for a group given one constant probability, it is smallest when that probability equals the observed frequency.`,
        formula: T`\operatorname{Brier}=\frac1n\sum_{i=1}^n(p_i-y_i)^2`,
        steps: [T`For each example, subtract the 0/1 outcome from the predicted probability.`, T`Square the difference.`, T`Average over the examples.`],
        examples: [[T`one prediction \(p=0.9\): \(y=1\), then \(y=0\)`, T`\(0.01\), then \(0.81\)`], [T`20 predictions at \(0.8\), 12 positives`, T`\((12\cdot0.04+8\cdot0.64)/20=0.28\)`], [T`same group at \(p=0.6\)`, T`\((12\cdot0.16+8\cdot0.36)/20=0.24\): the minimum, at the observed frequency`], [T`always predicting \(0.5\)`, T`\(0.25\), whatever the outcomes`]],
        pitfall: T`Choose any recalibration or threshold on validation data. Tuning it on the test set turns the test set into another validation set.`
      }
    ]
  });
})();
