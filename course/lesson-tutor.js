/* Lesson-specific numerical teaching. All calculations run locally. */
(() => {
  'use strict';
  const E = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N = (x, d = 3) => Math.abs(x) < 16 * Number.EPSILON ? '0' : Math.abs(x) < 10 ** -d ? x.toExponential(2) : Number(x.toFixed(d)).toString();
  const Q = String.raw;
  const step = (title, tex, detail) => ({title, tex, detail});
  const matrix = rows => Q`\begin{bmatrix}${rows.map(r => r.map(x => typeof x === 'number' ? N(x) : x).join('&')).join(Q`\\`)}\end{bmatrix}`;
  const norm = v => Math.hypot(...v);
  const sigmoid = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
  const result = (steps, values, note, extra = {}) => ({steps, values, note, ...extra});

  // Each lesson has a distinct example, with its assumptions stated in its guide.
  function calculate(id, p) {
    const a = p[0], b = p[1];
    switch (id) {
      case 1: {
        const src=[20,60,100,140], raw=src.map(x=>a*x+10), out=raw.map(x=>Math.min(255,Math.max(0,x)));
        return result([
          step('Name the input and its shape',Q`I=${matrix([[20,60],[100,140]])}\in\mathbb R^{2\times2}`,'There are four scalar entries, arranged into two rows and two columns. The layout tells us which entries are neighbours.'),
          step('Apply one rule to every entry',Q`J_{r,c}=${N(a)}I_{r,c}+10`,'Multiply first, then add ten. The offset is added to each pixel; it is not matrix multiplication.'),
          step('Calculate before clipping',Q`J=${matrix([raw.slice(0,2),raw.slice(2)])}`,'These are floating-point calculations. Keeping the raw values makes any range violation visible.'),
          step('Inspect the display values',Q`\operatorname{clip}_{[0,255]}(J)=${matrix([out.slice(0,2),out.slice(2)])}`,'Clipping changes values outside the range. When it activates, the displayed mean need not equal scale times input mean plus offset.')
        ],[['Input mean',80],['Raw mean',a*80+10],['Display mean',out.reduce((s,x)=>s+x,0)/4]],'Watch the last pixel as the scale increases: once it reaches 255, further changes to its raw value become invisible.',{pixels:out});
      }
      case 2: {
        const x=4, c=3, f=a*x, gf=f+c, fg=a*(x+c);
        return result([
          step('Specify the two functions',Q`f(x)=${N(a)}x,\quad g(x)=x+3`,'A function has an input and an output. Here one scales its input and the other shifts it.'),
          step('Read composition from the inside',Q`(g\circ f)(4)=g(${N(f)})`,'The function nearest the input acts first. The composition symbol does not mean multiply the functions.'),
          step('Finish both possible orders',Q`g(f(4))=${N(gf)},\quad f(g(4))=${N(fg)}`,'The first order adds three after scaling. The second scales the added three as well.'),
          step('Explain the difference',Q`f(g(4))-g(f(4))=3(${N(a)}-1)=${N(fg-gf)}`,'The orders agree at scale one. A particular agreement does not mean all transformations commute.')
        ],[['Scale then shift',gf],['Shift then scale',fg]],'Trace the input through both paths before comparing the final numbers.');
      }
      case 3: {
        const loss=a*a/3;
        return result([
          step('Define the residuals',Q`r=\hat y-y=${matrix([[a],[0],[0]])}`,'A residual is prediction minus target. Its sign tells us the direction of the error.'),
          step('Square before adding',Q`\sum_{i=1}^3r_i^2=(${N(a)})^2+0+0=${N(a*a)}`,'The square treats equal positive and negative mistakes equally and prevents cancellation.'),
          step('Average over observations',Q`L=\frac{${N(a*a)}}{3}=${N(loss)}`,'The denominator is the number of residuals, including zero residuals. It is not the number of mistakes.'),
          step('Check how scale changes loss',Q`L(2r)=4L(r)=${N(4*loss)}`,'Doubling errors quadruples squared error. Loss units are the square of the target units.')
        ],[['Signed residual',a],['Squared-error sum',a*a],['MSE',loss]],'Try equal positive and negative values of the slider. Their losses agree even though their error directions differ.');
      }
      case 4: {
        const prob=sigmoid(a), correct=b===0?1-prob:prob, loss=Math.max(a,0)-b*a+Math.log1p(Math.exp(-Math.abs(a)));
        return result([
          step('Start with an unrestricted score',Q`z=${N(a)},\quad z\in\mathbb R`,'A score can be negative or greater than one. It is not yet a probability, so taking the logarithm of the score would be the wrong operation.'),
          step('Map score to class-1 probability',Q`p=\sigma(z)=\frac{1}{1+e^{${N(-a)}}}=${N(prob)}`,'The exponential is positive, so the denominator exceeds one. This keeps the output strictly between zero and one for any finite score.'),
          step('Keep the observed class in view',b===0?Q`y=0:\quad p_y=1-p=${N(correct)}`:Q`y=1:\quad p_y=p=${N(correct)}`,'The model has two complementary probabilities. The loss uses the one assigned to the class that actually occurred.'),
          step('Measure how surprising that class is',Q`L=-\ln(p_y)=-\ln(${N(correct,5)})=${N(loss)}`,'Taking the negative logarithm produces a nonnegative penalty. A small true-class probability creates a large penalty; increasing it reduces the loss.')
        ],[['Class 1 probability',prob],['True-class probability',correct],['Negative log loss',loss]],'Change the target while keeping the score fixed. The prediction stays the same, but its correctness and loss change.',{confidence:{z:a,y:b,prob,loss}});
      }
      case 5: {
        const v=[a-2,-2];
        return result([
          step('Choose a coordinate convention',Q`x_{\rm start}=${matrix([[2],[1]])},\quad x_{\rm end}=${matrix([[a],[-1]])}`,'Both positions use the same origin, axis directions and coordinate units. Otherwise subtraction would not describe the intended move.'),
          step('Subtract coordinate by coordinate',Q`\Delta x=${matrix([[N(a)+'-2'],['-1-1']])}=${matrix([[a-2],[-2]])}`,'The first coordinate is horizontal change; the second is vertical change. A negative change means movement opposite the positive axis.'),
          step('Separate displacement from distance',Q`\|\Delta x\|_2=\sqrt{(${N(a-2)})^2+(-2)^2}=${N(norm(v))}`,'The displacement is a vector. Its Euclidean norm is a single nonnegative distance.'),
          step('Recover the endpoint',Q`x_{\rm start}+\Delta x=x_{\rm end}`,'Adding a displacement to a position gives another position. Shifting the origin changes both positions but leaves their difference unchanged.')
        ],[['Horizontal change',v[0]],['Vertical change',-2],['Distance',norm(v)]],'Move the endpoint horizontally. Its vertical change stays fixed.',{vector:v});
      }
      case 6: {
        const c=(a+4)/2, proj=[c,c], residual=[a-c,4-c];
        return result([
          step('Name the vector and direction',Q`x=${matrix([[a],[4]])},\quad u=${matrix([[1],[1]])}`,'The direction vector is not unit length. Its squared length is two, so the denominator cannot be omitted.'),
          step('Find the coefficient along that direction',Q`c=\frac{u^Tx}{u^Tu}=\frac{${N(a)}+4}{2}=${N(c)}`,'The dot product measures alignment; dividing by squared length compensates for how the direction vector was scaled.'),
          step('Build the projected vector',Q`p=cu=${matrix([[c],[c]])}`,'A coefficient is a scalar. Multiply it by the direction to obtain the actual point on the line.'),
          step('Verify the perpendicular leftover',Q`r=x-p=${matrix([[residual[0]],[residual[1]]])},\quad u^Tr=0`,'The residual has no component along the line. This orthogonality is the condition that makes the projection closest.')
        ],[['Projection coefficient',c],['Residual length',norm(residual)]],'At x = 4 the vector lies on the line, so its residual vanishes.',{vector:[a,4],projection:proj});
      }
      case 7: {
        const out=[2*a+3,3];
        return result([
          step('Check dimensions before multiplying',Q`A=${matrix([[a,1],[0,1]])}\in\mathbb R^{2\times2},\quad x=${matrix([[2],[3]])}\in\mathbb R^{2\times1}`,'The inner dimensions match. The result has two rows and one column; it is an output vector.'),
          step('Use a row as a weighted sum',Q`y_1=${N(a)}\cdot2+1\cdot3=${N(out[0])}`,'A row describes one output coordinate. Every entry in that row weights a corresponding input coordinate.'),
          step('Compute the other coordinate',Q`y_2=0\cdot2+1\cdot3=3,\quad Ax=${matrix([[out[0]],[3]])}`,'The second row keeps the vertical coordinate. This example stretches horizontally and adds a shear.'),
          step('Interpret the map geometrically',Q`\det(A)=${N(a)}`,'The determinant describes signed area scaling for this square map. At zero, one input direction collapses and the map is not invertible.')
        ],[['Output x',out[0]],['Output y',3],['Area scale',a]],'At scale zero, changing the first input coordinate has no effect on the output.',{vector:out});
      }
      case 8: {
        const nullv=[-a,1];
        return result([
          step('Inspect the map',Q`A=${matrix([[1,a],[0,0]])}`,'The second output coordinate is always zero. Although there are two input coordinates, only one independent output direction survives.'),
          step('Find an input that disappears',Q`v=${matrix([[-a],[1]])},\quad Av=${matrix([[0],[0]])}`,'Substitute this nonzero vector into the map: the first-row contributions cancel, and the second row is already zero.'),
          step('Count preserved and lost dimensions',Q`\operatorname{rank}(A)=1,\quad\dim\ker(A)=1`,'Rank counts independent output directions. Nullity counts independent input directions sent to zero.'),
          step('Check rank-nullity',Q`1+1=2=\text{number of input coordinates}`,'Adding a null vector to any input leaves its output unchanged. This demonstrates the information loss directly.')
        ],[['Rank',1],['Nullity',1],['Null x-coordinate',-a]],'Changing the coefficient rotates the lost direction without changing how many directions are lost.',{vector:nullv});
      }
      case 9: {
        const s=(1+a)/2, r1=s-1, r2=s-a;
        return result([
          step('Write the observed constraints',Q`x+y=1,\quad x+y=${N(a)}`,'Both equations ask about the same sum. They cannot determine x and y individually.'),
          step('Check exact consistency',a===1?Q`1=${N(a)}\Rightarrow\text{infinitely many exact solutions}`:Q`1\ne${N(a)}\Rightarrow\text{no exact solution}`,'Consistency asks whether all equations can hold simultaneously. Counting equations alone does not answer that question.'),
          step('Fit the identifiable sum instead',Q`\hat s=\frac{1+${N(a)}}2=${N(s)}`,'The least-squares compromise is the mean of the two requested sums. This changes the objective from exact matching to minimum squared error.'),
          step('Inspect the remaining error',Q`r=${matrix([[r1],[r2]])},\quad\|r\|_2^2=${N(r1*r1+r2*r2)}`,'The residual entries sum to zero. Even after fitting, x and y remain underdetermined: any pair with this fitted sum is a minimizer.')
        ],[['First target',1],['Second target',a],['Fitted sum',s]],'When the targets agree, the system becomes consistent, but it still does not have a unique solution.');
      }
      case 10: {
        const c=(3+a)/3, r=[c-1,c-2,c-a];
        return result([
          step('Choose a deliberately small model',Q`\hat y_i=c,\quad y=${matrix([[1],[2],[a]])}`,'The model predicts the same value for every observation. Its representable outputs lie on the line spanned by the all-ones vector.'),
          step('Minimize the squared distances',Q`\hat c=\frac{1+2+${N(a)}}3=${N(c)}`,'The sum of squared residuals is a parabola in c, and its lowest point is the sample mean. Lesson 17 shows the same result with a derivative.'),
          step('Compute the residual vector',Q`r=${matrix(r.map(x=>[x]))}`,'These are prediction-minus-observation residuals. Individual residuals can be nonzero at the best fit.'),
          step('Test the projection condition',Q`\mathbf1^Tr=${N(r.reduce((s,x)=>s+x,0))}=0`,'The residual is orthogonal to the only model direction. It cannot be reduced further by shifting every prediction together.')
        ],[['Fitted constant',c],['Squared residual sum',r.reduce((s,x)=>s+x*x,0)]],'Changing one observation moves the fitted constant by only one third of that change.');
      }
      case 11: {
        const k=10/a;
        return result([
          step('Identify the singular-value extremes',Q`\sigma_{\max}=10,\quad\sigma_{\min}=${N(a)}`,'Both values are positive in this example, so the map has full rank. A small minimum value marks a weakly preserved direction.'),
          step('Measure relative sensitivity',Q`\kappa_2(A)=\frac{10}{${N(a)}}=${N(k)}`,'The condition number compares strongest to weakest scaling. A larger ratio means that relative perturbations can be strongly amplified.'),
          step('See what normal equations change',Q`\kappa_2(A^TA)=\kappa_2(A)^2=${N(k*k)}`,'For a full-column-rank matrix, singular values are squared in the Gram matrix. This can worsen numerical sensitivity.'),
          step('Choose the computation accordingly',Q`A=QR\quad\text{or}\quad A=U\Sigma V^T`,'QR and SVD solve fitting problems without explicitly forming the Gram matrix. This improves the numerical route; it does not remove sensitivity inherent in the original data.')
        ],[['Condition number',k],['Gram condition number',k*k]],'Move the smallest singular value toward zero and watch both sensitivity measures grow.');
      }
      case 12: case 26: {
        const w=2/(1+a), residual=w-2, penalty=a*w*w;
        return result([
          step('Write a one-parameter objective',Q`L(w)=(w-2)^2+${N(a)}w^2`,'The first term rewards matching the observation. The second charges for weight magnitude; its coefficient states the tradeoff.'),
          step('Differentiate both terms',Q`L'(w)=2(w-2)+2\cdot${N(a)}w`,'The penalty contributes to the derivative too. Minimizing only the data term would give a different answer.'),
          step('Solve the stationary equation',Q`\hat w=\frac{2}{1+${N(a)}}=${N(w)}`,'Collecting the terms in w gives this solution. The positive curvature makes it the unique global minimizer in this example.'),
          step(id===26?'Connect the penalty to a prior':'Measure the compromise',id===26?Q`y\mid w\sim\mathcal N(w,1),\quad w\sim\mathcal N(0,1/${N(a)})`:Q`\text{fit error}=${N(residual*residual)},\quad\text{penalty}=${N(penalty)}`,id===26?'With observation variance one, multiplying the Gaussian negative log posterior by two produces the stated objective. A tighter zero-centred prior shrinks the MAP estimate.':'A larger penalty can increase training error while reducing weight size. Validation, rather than training fit alone, decides whether this preference is useful.')
        ],[['Unpenalized fit',2],['Regularized fit',w],['Data error',residual*residual]],id===26?'The estimate combines evidence and an explicit modelling preference. MAP does not mean the prior is certainly true.':'A zero regularization strength recovers the unpenalized solution.');
      }
      case 13: {
        const v=[a**3,0];
        return result([
          step('Choose an eigenvector',Q`A=\operatorname{diag}(${N(a)},2),\quad v=${matrix([[1],[0]])}`,Math.abs(a-2)<1e-9?'With λ = 2 both diagonal entries are equal, so A = 2I and every nonzero vector is an eigenvector. Move λ away from 2 to see that only the two axis directions stay on their own line.':'This nonzero vector lies along the first coordinate axis. The diagonal map does not mix it with the second axis.'),
          step('Apply the map once',Q`Av=${N(a)}v`,'The vector remains on the same line. The scalar multiplier is its eigenvalue.'),
          step('Apply it three times',Q`A^3v=(${N(a)})^3v=${matrix([[v[0]],[0]])}`,'Each application multiplies the previous coefficient by the same eigenvalue. Repeated action therefore produces a power.'),
          step('Interpret sign and magnitude',Q`|\lambda|=${N(Math.abs(a))}`,'Magnitude below one contracts; magnitude above one grows. A negative eigenvalue alternates the orientation on successive applications. At zero the direction disappears.')
        ],[['Eigenvalue',a],['After three maps',v[0]]],'Compare a positive and negative eigenvalue of equal magnitude.',{vector:v});
      }
      case 14: {
        const frac=16/(16+a*a);
        return result([
          step('Start with ordered singular values',Q`A=\operatorname{diag}(4,${N(a)}),\quad 4\ge${N(a)}\ge0`,'The restriction keeps the first direction at least as strong as the second. Singular values describe stretching, not signed eigenvalue reversal.'),
          step('Keep the strongest direction',Q`A_1=${matrix([[4,0],[0,0]])}`,'A rank-one approximation preserves the first singular component and discards the other.'),
          step('Measure discarded structure',Q`\|A-A_1\|_F=${N(a)},\quad\|A-A_1\|_F^2=${N(a*a)}`,'The Frobenius norm is the square root of the sum of squared entries. Its squared error equals the sum of squared discarded singular values.'),
          step('Calculate retained energy',Q`\frac{4^2}{4^2+${N(a)}^2}=${N(frac)}`,'This is a squared-norm energy fraction. A large fraction does not guarantee that the discarded detail is irrelevant to a CV task.')
        ],[['Retained singular value',4],['Discarded singular value',a],['Retained energy',frac]],'At equal singular values, either axis is an equally good rank-one choice; the best direction is not unique.');
      }
      case 15: {
        const l=a*a+1, u=[a/Math.sqrt(l),1/Math.sqrt(l)];
        return result([
          step('Centre three observations',Q`X_c=${matrix([[-a,-1],[0,0],[a,1]])},\quad\mu=(0,0)`,'Rows are observations and columns are features. This symmetric example already has a zero feature mean.'),
          step('Compute sample covariance',Q`C=\frac{X_c^TX_c}{3-1}=${matrix([[a*a,a],[a,1]])}`,'The denominator is n minus one for this sample-covariance convention. Off-diagonal entries measure joint variation.'),
          step('Find the leading unit direction',Q`u_1=${matrix([[u[0]],[u[1]]])},\quad\lambda_1=${N(l)}`,'All three centred points lie on one line. Its normalized direction is the first principal axis; the perpendicular variance is zero.'),
          step('Project into one coordinate',Q`Z=X_cu_1=${matrix([[-Math.sqrt(l)],[0],[Math.sqrt(l)]])}`,'The projection gives one scalar per observation. The sign of the principal axis may be flipped without changing the represented line or reconstruction.')
        ],[['Leading variance',l],['Second variance',0]],'Changing the horizontal spread rotates the axis while all variation remains one-dimensional.',{vector:[a,1]});
      }
      case 16: {
        const err=(3-a)**2+16;
        return result([
          step('State the retained subspace',Q`x=${matrix([[3],[4]])},\quad u=${matrix([[1],[0]])}`,'Only the horizontal axis is available for reconstruction. This restriction is what creates unavoidable information loss.'),
          step('Try a reconstruction coefficient',Q`\tilde x=zu=${matrix([[a],[0]])}`,'Changing z moves the reconstruction along the retained axis. It cannot recover a vertical coordinate.'),
          step('Separate adjustable and unavoidable error',Q`\|x-\tilde x\|_2^2=(3-${N(a)})^2+4^2=${N(err)}`,'The first term can be reduced by choosing z correctly. The second is the squared length of the discarded component.'),
          step('Identify the closest reconstruction',Q`z^*=u^Tx=3,\quad\min_z\|x-zu\|_2^2=16`,'Projection minimizes error inside the chosen subspace. Its minimum error is still nonzero because x is not in that subspace.')
        ],[['Coefficient z',a],['Squared error',err],['Unavoidable error',16]],'A low reconstruction error measures fidelity to the data, not whether the retained features help classify objects.',{vector:[3,4],projection:[a,0]});
      }
      case 17: {
        const sec=2*a+.1;
        return result([
          step('Pick the point on the curve',Q`f(x)=x^2,\quad x_0=${N(a)},\quad f(x_0)=${N(a*a)}`,'The function value is a height. A derivative is instead a rate of change of height with respect to the input.'),
          step('Measure a finite change',Q`\frac{f(x_0+0.1)-f(x_0)}{0.1}=${N(sec)}`,'This is a secant slope over a short interval, not yet the derivative at a single point.'),
          step('Take the local limit',Q`f'(x_0)=2x_0=${N(2*a)}`,'The derivative removes the interval-dependent extra term. Negative slope means the output decreases as the input increases locally.'),
          step('Use a tangent approximation',Q`f(x_0+h)\approx${N(a*a)}+${N(2*a)}h`,'This linear model approximates nearby changes. For this quadratic, the missing term is h squared, so it becomes less accurate farther away.')
        ],[['Function value',a*a],['Derivative',2*a],['Secant at h=0.1',sec]],'At zero the tangent is horizontal, although the function is not constant.',{curve:'square',point:a});
      }
      case 18: {
        const dot=1.2*a+3.2;
        return result([
          step('Hold other coordinates fixed for each partial',Q`f(x,y)=x^2+2y^2,\quad(x,y)=(${N(a)},1)`,'Two input coordinates allow different rates of change. A partial derivative varies one coordinate while holding the other fixed.'),
          step('Collect the partials into a gradient',Q`\nabla f=${matrix([[2*a],[4]])}`,'The gradient is a vector in input-coordinate space. Its components have the units of output per corresponding input.'),
          step('Choose a unit direction',Q`u=${matrix([[0.6],[0.8]])},\quad\|u\|_2=1`,'A unit direction specifies orientation without also scaling the length of the proposed move.'),
          step('Predict change in that direction',Q`D_uf=\nabla f^Tu=${N(dot)}`,'The dot product combines the coordinate sensitivities. Positive means ascent along this direction; negative means descent.')
        ],[['x partial',2*a],['y partial',4],['Directional derivative',dot]],'The direction of steepest decrease is the negative gradient when distance is measured with the Euclidean norm.',{vector:[2*a,4]});
      }
      case 19: {
        const out=2*a+1, r=out-5, grad=2*r;
        return result([
          step('Run the forward graph',Q`x=2,\ b=1,\ a=wx+b=${N(out)}`,'Use a distinct name for each intermediate. Values recorded in the forward pass will be needed in the backward calculation.'),
          step('Evaluate the scalar objective',Q`L=\tfrac12(a-5)^2=${N(.5*r*r)}`,'The target five is fixed. The one-half factor makes the derivative of the square especially simple.'),
          step('Differentiate the local edges',Q`\frac{\partial L}{\partial a}=a-5=${N(r)},\quad\frac{\partial a}{\partial w}=x=2`,'Each derivative describes one edge. One is loss sensitivity to the prediction; the other is prediction sensitivity to the weight.'),
          step('Multiply along the path',Q`\frac{\partial L}{\partial w}=\frac{\partial L}{\partial a}\frac{\partial a}{\partial w}=${N(grad)}`,'The chain rule combines these sensitivities. In a branching graph, contributions from every path into a shared value must be summed.')
        ],[['Prediction',out],['Loss',.5*r*r],['Weight gradient',grad]],'A zero gradient occurs when this example matches the target. Its sign indicates which direction of weight change decreases loss locally.',{network:[2,a,out,grad]});
      }
      case 20: {
        const exact=(2+a)**2, linear=4+4*a;
        return result([
          step('Choose a centre and a displacement',Q`f(x)=x^2,\quad x_0=2,\quad h=${N(a)}`,'Taylor expansion describes how the function changes around a named centre. The displacement h is not the new input itself.'),
          step('Build the first-order prediction',Q`f(2)+f'(2)h=4+4h=${N(linear)}`,'The derivative gives the tangent term. This approximation ignores curvature.'),
          step('Add the Hessian contribution',Q`\tfrac12 f''(2)h^2=\tfrac12\cdot2h^2=${N(a*a)}`,'In one dimension the Hessian is the second derivative. The quadratic term measures bending away from the tangent.'),
          step('Compare with the exact function',Q`f(2+h)=${N(exact)}=${N(linear)}+${N(a*a)}`,'For this degree-two polynomial the second-order expansion is exact. More general functions have higher-order remainder terms.')
        ],[['Linear prediction',linear],['Curvature correction',a*a],['Exact value',exact]],'Reducing the displacement by half divides the tangent error by four.',{curve:'square',point:2+a});
      }
      case 21: {
        const joint=.8*a, falseJoint=.1*(1-a), evidence=joint+falseJoint, posterior=joint/evidence;
        return result([
          step('State prevalence and test behaviour',Q`P(A)=${N(a)},\quad P(B\mid A)=0.8,\quad P(B\mid\neg A)=0.1`,'A is the target class; B is a positive prediction. The false-positive probability is conditional on not having the target.'),
          step('Calculate both routes to a positive',Q`P(A\cap B)=${N(joint)},\quad P(\neg A\cap B)=${N(falseJoint)}`,'Multiply each conditional probability by the size of its source population. Both true and false positives contribute to the observed positive group.'),
          step('Normalize by all positive outcomes',Q`P(B)=${N(evidence)}`,'The denominator includes the two mutually exclusive routes. It is not just the true-positive rate.'),
          step('Reverse the conditioning',Q`P(A\mid B)=\frac{${N(joint)}}{${N(evidence)}}=${N(posterior)}`,'Among all positive predictions, this fraction really belongs to the target class. Prevalence can change that fraction even when test behaviour stays fixed.')
        ],[['True-positive joint',joint],['False-positive joint',falseJoint],['Posterior',posterior]],'Try a very rare target class. A high true-positive rate alone need not imply a high posterior.');
      }
      case 22: {
        return result([
          step('Define a random variable and its outcomes',Q`X\in\{0,1\},\quad P(X=1)=${N(a)}`,'A random variable assigns a number to an uncertain outcome. Its distribution says how much probability each value receives.'),
          step('Check probability mass',Q`P(X=0)=1-${N(a)}=${N(1-a)}`,'The two probabilities are nonnegative and sum to one. These are probability masses, not continuous densities.'),
          step('Compute a probability-weighted average',Q`\mathbb E[X]=0(1-p)+1p=${N(a)}`,'The expectation need not be a possible single outcome. For example, an expectation of one-half does not mean a Bernoulli trial returns one-half.'),
          step('Interpret repeated observations',Q`\bar X=\frac1n\sum_{i=1}^nX_i`,'The sample mean is the observed fraction of ones. For independent identically distributed trials it concentrates around p as the sample size grows, while any finite sample can differ.')
        ],[['Mass at zero',1-a],['Mass at one',a],['Expectation',a]],'For a continuous density, probabilities come from areas over intervals; the density height at a point is not its point probability.');
      }
      case 23: {
        const v=2+2*a;
        return result([
          step('Fix the marginal scales',Q`\operatorname{Var}(X)=\operatorname{Var}(Y)=1`,'Variance measures squared spread around each variable’s mean. Here both variables have unit standard deviation.'),
          step('Specify their covariance',Q`\Sigma=${matrix([[1,a],[a,1]])}`,'The off-diagonal entry is covariance. With unit marginal variances it also equals the correlation coefficient.'),
          step('Find the spread of a sum',Q`\operatorname{Var}(X+Y)=1+1+2\cdot(${N(a)})=${N(v)}`,'The covariance term matters because the variables can move together or offset each other. Adding variances alone assumes zero covariance.'),
          step('Return to the original units',Q`\operatorname{SD}(X+Y)=\sqrt{${N(v)}}=${N(Math.sqrt(v))}`,'Standard deviation is the square root of variance. It has the same units as the summed measurement.')
        ],[['Correlation',a],['Variance of sum',v],['SD of sum',Math.sqrt(v)]],'Positive covariance reinforces fluctuations. Negative covariance makes some of them cancel.');
      }
      case 24: {
        const se=2/Math.sqrt(a), margin=1.96*se;
        return result([
          step('State the sampling assumptions',Q`X_i\overset{\rm iid}{\sim}\mathcal N(\mu,2^2),\quad n=${N(a)}`,'This example assumes independent normal observations with known standard deviation two. Repeated correlated video frames would violate independence.'),
          step('Compute variance of the sample mean',Q`\operatorname{Var}(\bar X)=\frac4{${N(a)}}=${N(4/a)}`,'Averaging n independent measurements divides the variance by n, rather than dividing the standard deviation by n.'),
          step('Find the standard error',Q`\operatorname{SE}(\bar X)=\frac2{\sqrt{${N(a)}}}=${N(se)}`,'Standard error measures sampling spread of the estimator. It is different from the spread of individual observations.'),
          step('Build the known-variance normal interval',Q`\bar X\pm1.96\operatorname{SE}=\bar X\pm${N(margin)}`,'Under these stated assumptions, the repeated-sampling procedure has about 95% coverage. A realized interval is not a 95% probability statement about a fixed parameter.')
        ],[['Observations',a],['Standard error',se],['Interval half-width',margin]],'Quadrupling the sample size halves the standard error. This calculation does not remove sampling bias.');
      }
      case 25: {
        const likelihood=a**3*(1-a), loss=-3*Math.log(a)-Math.log(1-a);
        return result([
          step('Keep the observations fixed',Q`y=(1,1,1,0),\quad p=${N(a)}`,'Likelihood varies the parameter while holding the actual data fixed. It is not a probability distribution over parameters.'),
          step('Multiply the observation probabilities',Q`\mathcal L(p)=p^3(1-p)=${N(likelihood,5)}`,'The product assumes conditionally independent Bernoulli observations with one shared success probability.'),
          step('Turn a product into a sum',Q`-\ln\mathcal L=-3\ln p-\ln(1-p)=${N(loss)}`,'The logarithm preserves the location of a maximum. Negating it turns likelihood maximization into loss minimization.'),
          step('Identify the maximum-likelihood estimate',Q`\hat p_{\rm MLE}=\frac34=0.75`,'The observed success fraction minimizes this loss. Moving toward certainty at either endpoint is punished because both outcome types occurred.')
        ],[['Likelihood',likelihood],['Total NLL',loss],['Mean NLL',loss/4]],'The mean and total loss have the same minimizer here, but their scales differ by four.');
      }
      case 27: {
        const ex=[Math.exp(a-Math.max(a,1)),Math.exp(1-Math.max(a,1)),Math.exp(-Math.max(a,1))], sum=ex.reduce((s,x)=>s+x,0), probs=ex.map(x=>x/sum), loss=-Math.log(probs[0]);
        return result([
          step('Name the mutually exclusive classes',Q`z=(${N(a)},1,0)\quad\text{for cat, dog, background}`,'These scores can be any real values. This softmax model assumes exactly one of the classes is the target.'),
          step('Normalize exponentials across the class axis',Q`p_c=\frac{e^{z_c}}{\sum_ke^{z_k}},\quad p=(${probs.map(x=>N(x)).join(',')})`,'Subtracting the maximum score before exponentiating gives the same probabilities and avoids unnecessarily large exponentials.'),
          step('Use the true-class probability',Q`y=\text{cat},\quad L=-\ln p_{\rm cat}=${N(loss)}`,'Cross entropy with a one-hot target is the negative logarithm of the chosen true-class probability.'),
          step('Connect the loss to the score gradient',Q`\nabla_zL=p-y=(${N(probs[0]-1)},${N(probs[1])},${N(probs[2])})`,'Increasing the cat score lowers this loss. The coupled probabilities sum to one, so increasing one class changes the others too.')
        ],[['Cat',probs[0]],['Dog',probs[1]],['Background',probs[2]]],'Adding the same constant to every score leaves all probabilities unchanged.');
      }
      case 28: {
        const brier=(12*(a-1)**2+8*a*a)/20;
        return result([
          step('Inspect a group of predictions',Q`n=20,\quad\sum_iy_i=12,\quad p_i=${N(a)}`,'All twenty examples receive the same predicted probability. Twelve of their binary targets are one.'),
          step('Compare confidence with observed frequency',Q`\bar y=12/20=0.6,\quad|p-\bar y|=${N(Math.abs(a-.6))}`,'A group predicted with confidence p is calibrated in the population if its positive frequency equals p. This finite group is only an estimate.'),
          step('Score individual probabilities',Q`\operatorname{Brier}=\frac{12(p-1)^2+8p^2}{20}=${N(brier)}`,'The Brier score measures squared error of binary probabilities, including contributions from both outcome classes.'),
          step('Keep evaluation roles separate',Q`\operatorname*{arg\,min}_p\operatorname{Brier}=0.6`,'This group’s best constant probability is its observed frequency. Choosing adjustments on this same final test group would compromise an independent test evaluation.')
        ],[['Predicted probability',a],['Observed frequency',.6],['Brier score',brier]],'A model can have good class accuracy and poor probability calibration.');
      }
      case 29: {
        const next=6*a, after=(next-3)**2;
        return result([
          step('Choose the objective and starting point',Q`L(w)=(w-3)^2,\quad w_0=0,\quad L(w_0)=9`,'The minimum is at three. We will take one update using only the local derivative.'),
          step('Evaluate the gradient where you are',Q`L'(0)=2(0-3)=-6`,'A negative derivative means increasing w reduces loss locally. The gradient is not the target weight itself.'),
          step('Take the negative-gradient step',Q`w_1=w_0-\alpha L'(w_0)=6(${N(a)})=${N(next)}`,'The learning rate sets how far to move. A large step can cross the minimum and land on a worse part of the curve.'),
          step('Check the objective after updating',Q`L(w_1)=(${N(next)}-3)^2=${N(after)}`,'For this quadratic, rates strictly between zero and one decrease error. At one the error magnitude is unchanged; above one repeated updates diverge unless already at the minimum.')
        ],[['Before loss',9],['Updated weight',next],['After loss',after]],'At learning rate one-half this special example reaches the minimum in one step.',{curve:'optimization',point:next});
      }
      case 30: {
        const v=2*a-1, next=1-.1*v;
        return result([
          step('State this momentum convention',Q`v_t=\beta v_{t-1}+g_t,\quad w_{t+1}=w_t-\alpha v_t`,'Different software can rescale the velocity. Here we use the unnormalized accumulated-gradient convention.'),
          step('Set the previous state and new batch gradient',Q`v_{t-1}=2,\quad g_t=-1,\quad w_t=1,\quad\alpha=0.1`,'The latest batch suggests one direction, while past gradients pull in the opposite direction.'),
          step('Combine memory with new evidence',Q`v_t=2(${N(a)})-1=${N(v)}`,'A high momentum coefficient retains more of the previous velocity. The current batch does not necessarily determine the update’s direction by itself.'),
          step('Update the weight',Q`w_{t+1}=1-0.1(${N(v)})=${N(next)}`,'At beta one-half the contributions cancel. Below it this example increases the weight; above it the weight decreases.')
        ],[['Old velocity',2],['New batch gradient',-1],['Combined velocity',v],['New weight',next]],'Momentum changes the path through an objective; it does not make noisy gradients exact.');
      }
      case 31: {
        const next=2*(1-.4*a);
        return result([
          step('Make curvature explicit',Q`L(w)=\tfrac12 a w^2,\quad a=${N(a)}>0`,'This quadratic is strictly convex. The curvature a controls how quickly the slope changes as the input moves.'),
          step('Compute slope and curvature',Q`L'(w)=aw,\quad L''(w)=a`,'The gradient tells us a direction at one point. The second derivative tells us how aggressively the gradient changes nearby.'),
          step('Use a fixed step from w = 2',Q`\eta=0.4,\quad w_1=2(1-0.4a)=${N(next)}`,'Keeping the learning rate fixed while increasing curvature makes the effective step more aggressive.'),
          step('Check the contraction condition',Q`|1-\eta a|=${N(Math.abs(1-.4*a))}\quad\text{${Math.abs(1-.4*a)<1?'below one: contracts':'not below one'}}`,'Strict contraction gives convergence for this example. Convexity alone does not make every learning rate safe; a must be below five for this fixed rate.')
        ],[['Curvature',a],['Updated weight',next],['Error multiplier',Math.abs(1-.4*a)]],'A large learning rate can fail even on an objective with a unique global minimum.',{curve:'curvature',point:next,coefficient:a});
      }
      case 32: {
        const variance=2/a;
        return result([
          step('State the layer assumptions',Q`z=\sum_{j=1}^{d}w_jx_j,\quad d=${N(a)}`,'Assume independent zero-mean weights and independent unit-second-moment inputs, with no bias contribution to this calculation.'),
          step('Choose He weight scale',Q`\operatorname{Var}(w_j)=\frac2d=${N(variance,5)}`,'As the number of summed inputs grows, each weight’s variance shrinks to avoid uncontrolled growth of activation scale.'),
          step('Predict preactivation variance',Q`\operatorname{Var}(z)=d\frac2d=2`,'Cross terms vanish under the stated independence and zero-mean assumptions. This is an initial-scale argument, not a guarantee throughout training.'),
          step('Track the ReLU second moment',Q`\mathbb E[\operatorname{ReLU}(z)^2]=\tfrac12\mathbb E[z^2]=1`,'For a symmetric preactivation distribution, ReLU removes half the squared contribution. This is a second moment, not variance: ReLU outputs generally have a positive mean.')
        ],[['Fan-in',a],['Weight variance',variance],['Weight SD',Math.sqrt(variance)]],'Using a fixed weight variance at every layer would make summed activation scale depend on fan-in.');
      }
      case 33: {
        const alias=Math.min(a%12,12-a%12), samples=Array.from({length:12},(_,n)=>Math.cos(2*Math.PI*a*n/12));
        return result([
          step('Describe the continuous signal',Q`f(t)=\cos(2\pi\,${N(a)}t),\quad f_s=12`,'The frequency is cycles per unit time or distance. The sampling rate uses the matching units.'),
          step('Observe only the sample locations',Q`x_n=f(n/12),\quad n=0,\ldots,11`,'Sampling keeps a sequence of values and discards what happened between them. Different continuous signals can share this sequence.'),
          step('Find a low-frequency alias',Q`f_{\rm apparent}=${N(alias)}`,'For this cosine, frequencies mirrored around half the sampling rate have identical samples. This apparent frequency cannot identify the original one uniquely.'),
          step('Connect this to resizing images',Q`f_{\rm Nyquist}=f_s/2=6`,'Before reducing sampling density, suppress frequencies above the new limit. Interpolation alone cannot recover structure already aliased by sampling.')
        ],[['Original frequency',a],['Apparent frequency',alias],['Nyquist limit',6]],'Compare frequencies four and eight: this cosine produces the same twelve sample values.',{samples});
      }
      case 34: {
        return result([
          step('Align patch and kernel',Q`x=(1,2,3),\quad k=(1,${N(a)},-1)`,'The order of entries matters. Fix which end of the patch aligns with which end of the kernel before multiplying.'),
          step('Compute cross-correlation',Q`1\cdot1+2\cdot${N(a)}+3(-1)=${N(2*a-2)}`,'Cross-correlation multiplies aligned entries directly. This is the operation many deep-learning convolution layers implement.'),
          step('Flip the kernel for mathematical convolution',Q`k_{\rm flipped}=(-1,${N(a)},1)`,'In this finite local illustration, convolution reverses kernel order before alignment. In two dimensions it reverses both spatial axes.'),
          step('Compare the resulting response',Q`1(-1)+2\cdot${N(a)}+3\cdot1=${N(2*a+2)}`,'The responses differ because this kernel is asymmetric. Symmetric kernels hide the distinction.')
        ],[['Cross-correlation',2*a-2],['Flipped-kernel response',2*a+2]],'Weights learned for one convention need a corresponding flip when transferred to the other.');
      }
      case 35: {
        const o=Math.floor(6/a)+1;
        return result([
          step('State spatial parameters',Q`N=7,\quad K=3,\quad P=1,\quad S=${N(a)}`,'N is input length, K kernel length, P padding on each side and S stride. This example uses unit dilation.'),
          step('Count valid kernel starts',Q`N+2P-K=7+2-3=6`,'Padding enlarges the usable coordinate range. The kernel must still fit completely at each chosen start.'),
          step('Convert distance into a count',Q`N_{\rm out}=\left\lfloor\frac6{${N(a)}}\right\rfloor+1=${o}`,'The floor discards an incomplete final stride. The plus one counts the first valid position.'),
          step('Distinguish spacing from field size',Q`\text{first-layer field}=3,\quad\text{output jump}=${N(a)}`,'Stride changes how far adjacent output positions are separated in input coordinates. The kernel still sees three padded positions at each first-layer output.')
        ],[['Input length',7],['Output length',o],['Output jump',a]],'For deeper layers, receptive fields depend on previous jumps, kernel sizes and dilation.');
      }
      case 36: {
        const high=1-4*a;
        return result([
          step('Choose a normalized smoothing kernel',Q`k=(${N(a)},${N(1-2*a)},${N(a)}),\quad\sum_jk_j=1`,'The symmetric nonnegative weights average nearby pixels. Normalization preserves a constant signal away from boundary effects.'),
          step('Inspect an edge locally',Q`(0,0,1)\mapsto${N(a)},\quad(0,1,1)\mapsto${N(1-a)}`,'Mixing across the edge creates intermediate intensities. Noise suppression and edge sharpness are linked tradeoffs.'),
          step('Describe its frequency response',Q`H(\omega)=1-2a+2a\cos\omega`,'A sinusoidal input is multiplied by this response. The spatial weights and frequency attenuation are two descriptions of the same linear filter.'),
          step('Check the highest sampled frequency',Q`H(\pi)=1-4a=${N(high)}`,'At a equal to one-quarter this kernel cancels the alternating high-frequency pattern. Our control range ends there to keep this attenuation nonnegative.')
        ],[['Edge left response',a],['Edge right response',1-a],['High-frequency response',high]],'Preserving constant brightness does not mean preserving every spatial detail.');
      }
      case 37: {
        const pre=2+a, active=Math.max(0,pre);
        return result([
          step('Apply the affine part',Q`x=2,\quad w=1,\quad z=wx+b=2+${N(a)}=${N(pre)}`,'Weights mix or scale input coordinates; the bias shifts the activation boundary.'),
          step('Apply a nonlinear activation',Q`h=\max(0,z)=${N(active)}`,'ReLU keeps positive preactivations and sets negative ones to zero. The complete map is piecewise linear.'),
          step('Inspect local sensitivity',pre===0?Q`\operatorname{ReLU}'(0)\text{ is undefined}`:Q`\frac{\partial h}{\partial z}=${pre>0?1:0}`,'At the kink there is no ordinary derivative. Autograd implementations choose a convention, often zero; away from it the derivative is zero or one.'),
          step('Explain why activation matters',Q`W_2(W_1x+b_1)+b_2=(W_2W_1)x+(W_2b_1+b_2)`,'Without a nonlinearity between affine layers, their composition is still one affine map. ReLU introduces input-dependent active regions.')
        ],[['Preactivation',pre],['ReLU output',active]],'Move the bias across minus two to switch which piece of the function is active.',{network:[2,pre,active]});
      }
      case 38: {
        const pre=2*a-1, h=Math.max(0,pre), output=2*h, error=output-3, grad=pre>0?4*error:0;
        return result([
          step('Run the hidden unit',Q`h=\operatorname{ReLU}(2w-1)=${N(h)}`,'Save the preactivation as well as the activation. Its sign determines which local derivative will be used.'),
          step('Run output and loss',Q`\hat y=2h=${N(output)},\quad L=\tfrac12(\hat y-3)^2=${N(.5*error*error)}`,'The output layer multiplies the hidden activation by two. The target is held fixed at three.'),
          step('Follow the chain backward',Q`\frac{\partial L}{\partial w}=(\hat y-3)\cdot2\cdot\operatorname{ReLU}'(2w-1)\cdot2`,'Each factor comes from one edge: loss, output weight, activation and input multiplication. Omitting a factor changes the gradient.'),
          step('Evaluate the active path',Q`\frac{\partial L}{\partial w}=${N(grad)}`,'For negative preactivation, this example passes zero gradient through ReLU even when loss is large. At exactly zero we use the implementation convention of zero, not an ordinary derivative.')
        ],[['Hidden activation',h],['Prediction',output],['Loss',.5*error*error],['Weight gradient',grad]],'A flat inactive path can have nonzero error: zero gradient does not always mean a good fit.',{network:[2,pre,h,output]});
      }
      case 39: {
        const grad=.5+2*a, next=2-.1*grad;
        return result([
          step('State the data gradient and penalty',Q`w=2,\quad\nabla L_{\rm data}=0.5,\quad R(w)=\tfrac\lambda2 w^2`,'The one-half factor is part of our definition. Check it before comparing regularization strengths across implementations.'),
          step('Differentiate the regularizer',Q`R'(w)=\lambda w=${N(2*a)}`,'This term pulls a positive weight toward zero. It is a modelling preference, not a measured prediction residual.'),
          step('Combine objective gradients',Q`\nabla(L_{\rm data}+R)=0.5+2\cdot${N(a)}=${N(grad)}`,'Both terms contribute to ordinary gradient descent on the regularized objective.'),
          step('Take a declared SGD step',Q`w_1=2-0.1(${N(grad)})=${N(next)}`,'For this simple SGD update the penalty gives a multiplicative shrinkage. Decoupled weight decay with an adaptive optimizer is a different update rule.')
        ],[['Data gradient',.5],['Penalty gradient',2*a],['Updated weight',next]],'Regularization, normalization and stable numerical formulas solve different problems; they should be checked separately.');
      }
      case 40: {
        const h=10**a, estimated=((2+h)**3-(2-h)**3)/(2*h);
        return result([
          step('Choose a smooth scalar check',Q`f(w)=w^3,\quad w=2,\quad h=10^{${N(a)}}`,'Use float64 for this small numerical check. Smoothness near the test point avoids ambiguity from activation kinks.'),
          step('Derive the analytic gradient',Q`f'(2)=3\cdot2^2=12`,'A numerical comparison is useful only when the objective, reduction and tested parameter match the analytic calculation.'),
          step('Use a symmetric finite difference',Q`g_h=\frac{f(2+h)-f(2-h)}{2h}=${N(estimated,6)}`,'Evaluate both displaced inputs while keeping all other inputs fixed. A central difference has smaller truncation error than a one-sided difference for this smooth example.'),
          step('Inspect approximation error',Q`g_h=12+h^2\quad\text{in exact arithmetic}`,'For this cubic the truncation error is exactly h squared. At extremely tiny h, subtraction and floating-point rounding can dominate, so smaller is not always better.')
        ],[['Step size h',h],['Analytic gradient',12],['Numerical gradient',estimated]],'Autograd applies the chain rule to recorded operations. This independent numerical check tests whether the implemented objective behaves as intended.');
      }
      case 41: {
        const src=[20,60,100,140], out=src.map(x=>Math.min(255,a*x));
        return result([
          step('Declare the transformation',Q`T(I)_{r,c}=\min(255,${N(a)}I_{r,c})`,'This toy brightness augmentation modifies stored values while keeping the same shape and pixel positions.'),
          step('Inspect the changed image',Q`T(I)=${matrix([out.slice(0,2),out.slice(2)])}`,'A larger scale can remove distinctions through clipping. The object’s outline is preserved here, but visibility can still change.'),
          step('State the label assumption',Q`y(T(I))=y(I)\quad\text{is an assumption to check}`,'Brightness changes may preserve an object identity label in a chosen range. They need not preserve labels for exposure quality or tasks whose target depends on intensity.'),
          step('Evaluate the intended benefit',Q`\text{same split, budget and metric}\quad\to\quad\text{compare with baseline}`,'Augmentation encourages a particular robustness, but improvement must be measured. A mathematically valid transformation can be inappropriate for the task.')
        ],[['Scale',a],['Original mean',80],['Augmented mean',out.reduce((s,x)=>s+x,0)/4]],'Inspect transformed examples and their targets before assuming a stronger augmentation is better.',{pixels:out});
      }
      case 42: {
        const inter=2*Math.max(0,2-a), union=8-inter, iou=inter/union;
        return result([
          step('Use continuous box coordinates',Q`A=[0,0,2,2],\quad B=[${N(a)},0,${N(a+2)},2]`,'Each box has width two and height two. We use continuous coordinates, so no inclusive-pixel plus-one correction is added.'),
          step('Find common width and height',Q`|A\cap B|=2\max(0,2-${N(a)})=${N(inter)}`,'Intersection width is clamped at zero when the boxes are separated. Negative intersection area has no geometric meaning.'),
          step('Avoid counting overlap twice',Q`|A\cup B|=4+4-${N(inter)}=${N(union)}`,'Adding both areas counts the shared region twice. Subtract it once to obtain the union.'),
          step('Normalize the intersection',Q`\operatorname{IoU}=\frac{${N(inter)}}{${N(union)}}=${N(iou)}`,'The ratio is scale-free for valid boxes with nonzero union. Zero means no overlap; one means the two boxes coincide.')
        ],[['Intersection area',inter],['Union area',union],['IoU',iou]],'A correct class label does not imply correct localization.',{boxes:a});
      }
      case 43: {
        const tp=a, fp=b, fn=10-a, tn=90-b, iou=tp/(tp+fp+fn), dice=2*tp/(2*tp+fp+fn);
        return result([
          step('Count foreground outcomes',Q`TP=${tp},\quad FP=${fp},\quad FN=${fn},\quad TN=${tn}`,'The mask has ten foreground and ninety background pixels. True positives recover foreground; false positives invent foreground on background pixels.'),
          step('Calculate pixel accuracy',Q`\operatorname{accuracy}=\frac{TP+TN}{100}=${N((tp+tn)/100)}`,'Background true negatives can dominate accuracy. With no positive predictions this example still achieves ninety percent.'),
          step('Measure foreground overlap',Q`\operatorname{IoU}=\frac{TP}{TP+FP+FN}=${N(iou)}`,'Foreground IoU excludes true negatives, so it reveals missed objects that background-heavy accuracy can hide.'),
          step('Compare Dice under the same counts',Q`\operatorname{Dice}=\frac{2TP}{2TP+FP+FN}=${N(dice)}`,'Dice weights true positives differently but uses the same errors. For these nonempty targets, Dice equals twice IoU divided by one plus IoU.')
        ],[['Pixel accuracy',(tp+tn)/100],['Foreground IoU',iou],['Dice',dice]],'Set both controls to zero to inspect the all-background baseline.',{mask:{tp,fp}});
      }
      case 44: {
        const scores=[.95,.8,.65,.55,.4,.2], labels=[1,0,1,1,0,1];
        const predicted=scores.map(s=>s>=a), tp=labels.filter((y,i)=>y&&predicted[i]).length, fp=labels.filter((y,i)=>!y&&predicted[i]).length, fn=4-tp, precision=tp+fp?tp/(tp+fp):null;
        return result([
          step('Turn scores into decisions',Q`\hat y_i=\mathbf1[p_i\ge${N(a)}]`,'The convention includes equality. Raising the threshold changes the positive set; it does not retrain the model.'),
          step('Compare each decision with its target',Q`TP=${tp},\quad FP=${fp},\quad FN=${fn}`,'There are four actual positives and two actual negatives in this tiny example.'),
          step('Ask how reliable positive predictions are',precision===null?Q`\operatorname{precision}=0/0\quad\text{undefined}`:Q`\operatorname{precision}=\frac{${tp}}{${tp+fp}}=${N(precision)}`,'Precision conditions on a positive prediction. If there are no positive predictions, state the chosen empty-denominator reporting convention.'),
          step('Ask how much of the target was recovered',Q`\operatorname{recall}=\frac{${tp}}4=${N(tp/4)}`,'Recall conditions on an actual positive. Sweeping thresholds creates multiple precision-recall points; detection AP additionally needs matching and an explicit integration convention.')
        ],[['Threshold',a],['Precision',precision],['Recall',tp/4]],'Watch the step changes when the threshold passes an observed score.',{scores,labels,predicted});
      }
      case 45: {
        const q=a/20, mixed=20*(1-(1-q)**5-q**5);
        return result([
          step('Identify the independent unit',Q`20\ \text{videos}\times5\ \text{frames}=100\ \text{images}`,'Frames in a video are related. A frame-level random split can put close relatives into both training and test sets.'),
          step('Allocate whole groups',Q`n_{\rm test\ groups}=${a},\quad n_{\rm train\ groups}=${20-a}`,'Whole-video splitting keeps each video in one role. The number of images is larger than the number of independent groups.'),
          step('Inspect an alternative random assignment',Q`q=${N(q)},\quad P(\text{mixed video})=1-(1-q)^5-q^5`,'For this comparison only, assume each frame is assigned independently to test with probability q. A video is mixed unless all five frames go to one side.'),
          step('Count expected overlapping groups',Q`\mathbb E[\text{mixed groups}]=${N(mixed)}`,'This is an expectation under independent frame assignments, not a deterministic count from a fixed-size split. Group splitting has zero mixed videos by construction.')
        ],[['Train videos',20-a],['Test videos',a],['Expected mixed videos under frame split',mixed]],'Make the split reflect the intended use: unseen videos, people or locations can require different grouping rules.');
      }
      case 46: {
        const diffs=[a-1,a,a+1];
        return result([
          step('Use paired runs with shared conditions',Q`R_{\rm base}=(70,72,71)\%`,'Compare the same seeds, data split and training budget. Pairing helps separate the changed factor from run-to-run variation.'),
          step('Change one factor',Q`R_{\rm new}=(${N(69+a)},${N(72+a)},${N(72+a)})\%`,'These toy results are constructed to illustrate a paired comparison. They are not measured model benchmarks.'),
          step('Subtract within each pair',Q`\Delta=(${diffs.map(x=>N(x)).join(',')})\ \text{percentage points}`,'A difference between percentages is measured in percentage points. It is not automatically a relative percent improvement.'),
          step('Report effect and variation together',Q`\bar\Delta=${N(a)},\quad s_\Delta=1\ \text{percentage point}`,'The mean alone hides disagreement between runs. Three illustrative seeds are not enough to guarantee a general improvement; inspect protocol and uncertainty.')
        ],[['Run 1 difference',a-1],['Run 2 difference',a],['Run 3 difference',a+1],['Mean difference',a]],'At mean difference zero, individual runs still show gains and losses.');
      }
      case 47: {
        const q=a/100, accuracy=.9*(1-q)+.5*q;
        return result([
          step('Separate subgroup behaviour',Q`\operatorname{acc}_{\rm bright}=0.9,\quad\operatorname{acc}_{\rm dark}=0.5`,'These conditional accuracies are held fixed in this toy example. The model already performs much worse on dark images.'),
          step('Change the evaluation mixture',Q`P(\text{dark})=${N(q)},\quad P(\text{bright})=${N(1-q)}`,'A different use environment can contain a different share of difficult conditions, even with identical behaviour inside each subgroup.'),
          step('Weight the subgroup results',Q`\operatorname{acc}=0.9(1-q)+0.5q=${N(accuracy)}`,'Aggregate accuracy is a weighted average here. A headline score can change simply because the subgroup mixture changed.'),
          step('State what the evidence supports',Q`\text{report subgroup metric, count and condition}`,'Compare conditional results as well as the aggregate. If subgroup performance changes too, mixture shift alone cannot explain the new result.')
        ],[['Bright accuracy',.9],['Dark accuracy',.5],['Aggregate accuracy',accuracy]],'An unchanged overall score can also conceal offsetting gains and losses across subgroups.');
      }
      case 48: {
        const length=Math.hypot(a,4), cosine=a/length;
        return result([
          step('Turn a method claim into a definition',Q`x=${matrix([[a],[4]])},\quad u=${matrix([[1],[0]])}`,'Suppose a method claims to compare feature direction with cosine similarity. First write down the actual vectors and verify they are nonzero.'),
          step('Check the normalization operation',Q`\tilde x=\frac{x}{\|x\|_2}=\frac{x}{${N(length)}}`,'Normalization changes magnitude while preserving direction. A paper’s dot-product formula represents cosine only when the required norms are included or inputs are already unit length.'),
          step('Derive the stated score',Q`\cos\theta=\tilde x^Tu=\frac{${N(a)}}{\sqrt{(${N(a)})^2+16}}=${N(cosine)}`,'Trace the equation into operations: squared entries, sum, square root, division and dot product. The shape of every intermediate should be clear.'),
          step('Test a checkable implication',Q`-1\le\cos\theta\le1,\quad x^Tu=${N(a)}`,'The raw dot product is a different score and can exceed one. An invariant check can expose a mismatch between a mathematical claim and its implementation before evaluating the full model.')
        ],[['Raw dot product',a],['Vector norm',length],['Cosine score',cosine]],'Defending a CV method means checking its definitions and implementation as well as its final benchmark.',{vector:[a,4]});
      }
      default: {
        // Lessons defined in extensions/lesson-NN.js register their calculation through CV_EXTEND.
        const extension=window.CV_TUTOR_EXT&&window.CV_TUTOR_EXT[id];
        if(extension)return extension(p);
        throw new Error('Missing lesson calculation '+id);
      }
    }
  }

  function renderMath(root) {
    if (!window.katex) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.parentElement.closest('pre,code,textarea,script,style,.katex,[data-equation]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    const regex=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
    nodes.forEach(node=>{
      const matches=[...node.textContent.matchAll(regex)];if(!matches.length)return;
      const frag=document.createDocumentFragment();let last=0;
      matches.forEach(m=>{frag.append(document.createTextNode(node.textContent.slice(last,m.index)));const el=document.createElement(m[2]!==undefined?'div':'span');el.dataset.equation=m[1]??m[2];el.dataset.inline=String(m[2]===undefined);el.className=m[2]===undefined?'inline-math':'body-equation';frag.append(el);last=m.index+m[0].length;});
      frag.append(document.createTextNode(node.textContent.slice(last)));node.replaceWith(frag);
    });
    root.querySelectorAll('[data-equation]').forEach(el=>{if(el.dataset.rendered===el.dataset.equation)return;window.katex.render(el.dataset.equation,el,{throwOnError:false,displayMode:el.dataset.inline!=='true',trust:false,strict:'warn'});el.dataset.rendered=el.dataset.equation;});
  }

  const svgText=(x,y,text,color='#64736b',size=13,className='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Segoe UI,Arial"${className ? ` class="${className}"` : ''}>${E(text)}</text>`;
  function drawing(m,id,p) {
    let body='', caption='The numerical summary below describes this example.';
    if(m.svg){
      body=m.svg.body;caption=m.svg.caption;
    } else if(m.confidence){
      const x=z=>45+(z+6)/12*460,y=v=>180-v*130;
      const points=Array.from({length:121},(_,i)=>{const z=-6+i/10;return `${x(z)},${y(sigmoid(z))}`;}).join(' ');
      body=`<path d="M45 45V180H505" fill="none" stroke="#c7cfc5"/><polyline points="${points}" fill="none" stroke="#34734e" stroke-width="3"/><path d="M${x(p[0])} 180V${y(m.confidence.prob)}H45" stroke="#bd431c" stroke-dasharray="4 4" fill="none"/><circle cx="${x(p[0])}" cy="${y(m.confidence.prob)}" r="6" fill="#bd431c"/>${svgText(45,205,'−6')}${svgText(267,205,'0')}${svgText(490,205,'6')}${svgText(11,54,'1')}${svgText(11,182,'0')}${svgText(140,24,'Sigmoid: score → probability','#172623',16)}${svgText(368,64,'p = '+N(m.confidence.prob),'#bd431c',15)}`;
      caption=`Score ${N(p[0])} gives class-1 probability ${N(m.confidence.prob)}. Target class ${p[1]} gives loss ${N(m.confidence.loss)}.`;
    } else if(m.pixels){
      const src=[20,60,100,140];[src,m.pixels].forEach((values,side)=>values.forEach((value,i)=>{const x=70+side*270+(i%2)*67,y=48+Math.floor(i/2)*67;body+=`<rect x="${x}" y="${y}" width="64" height="64" rx="5" fill="rgb(${value},${value},${value})"/>${svgText(x+13,y+38,N(value),value>117?'#000':'#fff',16,'pixel-value')}`;}));
      body+=svgText(70,27,'Original','#172623',15)+svgText(340,27,'Transformed','#172623',15)+svgText(248,121,'→','#bd431c',28);caption='Two 2×2 grayscale arrays: original pixel values and transformed display values.';
    } else if(m.boxes!==undefined){
      const d=m.boxes;body=`<rect x="60" y="55" width="140" height="140" fill="#34734e22" stroke="#34734e" stroke-width="3"/><rect x="${60+d*70}" y="55" width="140" height="140" fill="#bd431c22" stroke="#bd431c" stroke-width="3"/>${svgText(60,29,'Target box','#34734e',15)}${svgText(300,29,'Predicted box','#bd431c',15)}${svgText(60,220,'Horizontal displacement = '+N(d))}`;caption='Target and predicted boxes, drawn to the same scale. Their overlap changes with horizontal displacement.';
    } else if(m.mask){
      for(let i=0;i<100;i++){const fg=i<10,pred=fg?i<m.mask.tp:i<10+m.mask.fp;body+=`<rect x="${145+i%10*18}" y="${38+Math.floor(i/10)*18}" width="16" height="16" rx="2" fill="${fg&&pred?'#34734e':fg?'#f0c785':pred?'#bd431c':'#dce3d7'}"/>`;}
      body+=svgText(26,23,'100 pixels: ten true foreground pixels','#172623',16)+svgText(15,96,'Green: TP','#34734e')+svgText(15,120,'Orange: FP','#bd431c')+svgText(355,96,'Gold: missed')+svgText(355,120,'Grey: background');caption=`Mask with ${m.mask.tp} recovered foreground and ${m.mask.fp} false foreground pixels. The remaining true foreground pixels are missed.`;
    } else if(m.vector){
      const v=m.vector,unit=92/Math.max(6,...v.map(Math.abs),...(m.projection??[]).map(Math.abs)),x=v=>275+v*unit,y=v=>125-v*unit;
      body='<defs><marker id="tutor-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#bd431c"/></marker></defs>';
      for(let i=-6;i<=6;i++)body+=`<path d="M${x(i)} 17V233M145 ${y(i)}H405" stroke="#e5e8df"/>`;
      body+=`<path d="M145 125H405M275 17V233" stroke="#a8b6a5"/><path d="M275 125L${x(v[0])} ${y(v[1])}" stroke="#bd431c" stroke-width="3" marker-end="url(#tutor-arrow)"/>${svgText(x(v[0])+9,y(v[1])-8,'('+v.map(z=>N(z)).join(', ')+')','#bd431c',15)}`;
      if(m.projection)body+=`<path d="M275 125L${x(m.projection[0])} ${y(m.projection[1])}" stroke="#34734e" stroke-width="4"/><path d="M${x(m.projection[0])} ${y(m.projection[1])}L${x(v[0])} ${y(v[1])}" stroke="#64736b" stroke-dasharray="5 5"/>`;
      caption='Orange vector: ('+v.map(z=>N(z)).join(', ')+').'+(m.projection?' Green reconstruction: ('+m.projection.map(z=>N(z)).join(', ')+'). The dashed line is the residual.':'');
    } else if(m.samples){
      const pts=m.samples.map((v,i)=>`${45+i*42},${125-v*72}`).join(' ');body=`<path d="M40 125H515" stroke="#c7cfc5"/><polyline points="${pts}" fill="none" stroke="#34734e" stroke-width="2"/>`;
      m.samples.forEach((v,i)=>{body+=`<circle cx="${45+i*42}" cy="${125-v*72}" r="5" fill="#bd431c"/>`;});body+=svgText(45,24,'Twelve sampled cosine values','#172623',16);caption='Twelve discrete cosine samples. Dots are the observations; the connecting line only helps follow their order.';
    } else if(m.curve){
      const opt=m.curve!=='square',coef=m.coefficient??2,lo=opt?Math.min(-2,m.point-1):-4,hi=opt?Math.max(8,m.point+1):4, center=m.curve==='optimization'?3:0;
      const f=x=>opt?.5*coef*(x-center)**2:x*x, maxY=opt?Math.max(30,f(lo),f(hi),f(m.point)+3):25,x=v=>45+(v-lo)/(hi-lo)*460,y=v=>215-v/maxY*180;
      const pts=Array.from({length:101},(_,i)=>{const v=lo+(hi-lo)*i/100;return `${x(v)},${y(f(v))}`;}).join(' ');
      body=`<path d="M45 25V215H510" stroke="#c7cfc5" fill="none"/><polyline points="${pts}" fill="none" stroke="#34734e" stroke-width="3"/><circle cx="${x(m.point)}" cy="${y(f(m.point))}" r="6" fill="#bd431c"/>${svgText(45,20,opt?'Loss curve':'Function f(x) = x²','#172623',16)}`;
      if(!opt){const xx=m.point,yy=xx*xx,l=xx-1,r=xx+1;body+=`<path d="M${x(l)} ${y(yy+2*xx*(l-xx))}L${x(r)} ${y(yy+2*xx*(r-xx))}" stroke="#bd431c" stroke-width="2"/>`;}
      caption=opt?'Green loss curve; orange is the updated weight.':'Green quadratic; orange point and tangent describe the local function value and slope.';
    } else if(m.network){
      const count=m.network.length;m.network.forEach((v,i)=>{const x=65+i*(420/(count-1));if(i)body+=`<path d="M${x-420/(count-1)+29} 121H${x-29}" stroke="#a8b6a5" stroke-width="2"/>`;body+=`<circle cx="${x}" cy="121" r="29" fill="${i===count-1?'#fae5d9':'#e7eee5'}" stroke="${i===count-1?'#bd431c':'#34734e'}"/>${svgText(x-20,127,N(v),'#172623',15)}${svgText(x-27,175,'value '+(i+1))}`;});body+=svgText(40,35,'Follow the intermediate values','#172623',16);caption='Intermediate values in the worked computational example. Consult the named steps to distinguish forward values from gradients.';
    } else if(m.scores){
      m.scores.forEach((s,i)=>{const x=53+i*78,h=s*140;body+=`<rect x="${x}" y="${195-h}" width="44" height="${h}" rx="4" fill="${m.predicted[i]?'#34734e':'#d8dfd3'}"/>${svgText(x,217,'y='+m.labels[i])}${svgText(x,188-h,N(s))}`;});const ty=195-p[0]*140;body+=`<path d="M40 ${ty}H515" stroke="#bd431c" stroke-width="2" stroke-dasharray="5 4"/>${svgText(40,27,'Scores and decision threshold','#172623',16)}`;caption='Each bar is a score. Green bars pass the threshold. Labels below bars show the actual class.';
    } else {
      const vals=m.values.filter(v=>v[1]!==null),max=Math.max(1,...vals.map(v=>Math.abs(v[1])));
      vals.forEach(([label,value],i)=>{const y=47+i*43,w=Math.abs(value)/max*210;let first=label,second='';if(label.length>29){const split=label.lastIndexOf(' ',29);first=label.slice(0,split);second=label.slice(split+1);}body+=svgText(20,y+(second?11:17),first,'#172623',12)+(second?svgText(20,y+26,second,'#172623',12):'')+`<rect x="265" y="${y}" width="${w}" height="26" rx="5" fill="${value<0?'#bd431c':'#34734e'}"/>`+svgText(485,y+18,N(value),'#172623',14);});
      caption='Live numerical comparison. Bar lengths show magnitudes relative to the largest displayed value; labels retain the sign. These quantities may have different units.';
    }
    return `<figure class="tutor-figure"><svg viewBox="0 0 550 250" role="img" aria-label="${E(caption)}">${body}</svg><figcaption>${E(caption)}</figcaption></figure>`;
  }

  // A lesson may give a symbol its own meaning (CV_NOTATION_LESSON); otherwise the shared notation applies.
  const noteFor = (symbol, id) => (id && window.CV_NOTATION_LESSON?.[id]?.[symbol]) || window.CV_NOTATION[symbol];
  const symbolTex = (symbol, id) => noteFor(symbol, id)?.tex ?? (/^[a-zA-Z]$/.test(symbol) ? symbol : Q`\text{${symbol.replace(/[{}\\]/g,'')}}`);
  const texEl=(tex,inline=false)=>`<${inline?'span':'div'} class="${inline?'inline-math':'tutor-equation'}" data-equation="${E(tex)}" data-inline="${inline}"></${inline?'span':'div'}>`;
  const symbolMarkup = (symbol, id) => texEl(symbolTex(symbol, id),true);
  function markup(id) {
    const g=window.CV_GUIDES[id],t=window.CV_TEACHING[id];
    return `<section class="lesson-tutor" data-tutor="${id}"><div class="tutor-intro"><div class="eyebrow">START WITH THE IDEA</div><h2>${E(g.title)}</h2>${g.paragraphs.map(p=>`<p>${E(p)}</p>`).join('')}${window.CV_PYTHON ? '<button class="python-jump" type="button" data-python-jump>See the Python example ↓</button>' : ''}<div class="term-explorer"><div class="eyebrow">READ THE NOTATION · SELECT A TERM</div><div class="term-buttons">${t.symbols.map(([s,meaning],i)=>`<button type="button" data-term="${i}" aria-expanded="false" aria-controls="tutor-term-${id}">${symbolMarkup(s,id)}<span>${E(meaning)}</span></button>`).join('')}</div><div class="term-detail" id="tutor-term-${id}" role="region" aria-live="polite" hidden></div></div></div><div class="tutor-worked"><div class="tutor-worked-head"><div><div class="eyebrow">WORK IT THROUGH · LIVE NUMBERS</div><h2>${E(g.example)}</h2></div><button class="btn tutor-reset" type="button">Reset example</button></div><p class="tutor-predict"><strong>Predict first:</strong> ${E(g.predict)}</p><div class="tutor-grid"><div><div class="tutor-controls">${g.controls.map((c,i)=>`<div class="tutor-control"><label for="tutor-range-${i}">${E(c.label)}</label><div><input id="tutor-range-${i}" data-param="${i}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"><input class="tutor-number" type="number" data-number="${i}" aria-label="${E(c.label)} exact value" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></div></div>`).join('')}</div><p class="tutor-input-status" role="status"></p><div class="tutor-drawing"></div><div class="tutor-values"></div></div><div class="tutor-explanation"><nav class="tutor-step-tabs" aria-label="Worked example steps">${[0,1,2,3].map(i=>`<button type="button" data-step="${i}" aria-label="Show step ${i+1}">${i+1}</button>`).join('')}</nav><div class="tutor-current-step" aria-live="polite"></div><div class="tutor-step-actions"><button class="btn tutor-prev" type="button">← Previous step</button><button class="btn btn-primary tutor-next" type="button">Next step →</button></div><p class="tutor-interpretation"></p><details class="tutor-all-steps"><summary>Read all four steps together</summary><div></div></details></div></div><div class="tutor-bridge"><strong>What this example teaches</strong><p>${E(g.takeaway)}</p><a class="text-link" href="#lesson/${id}/explore">Continue with the full experiment ↗</a></div></div>${window.CV_PYTHON?.markup(id) ?? ''}</section>`;
  }
  function mount(root,id) {
    const g=window.CV_GUIDES[id];let params=g.controls.map(c=>c.value),current=0;
    const pythonRoot=root.querySelector('[data-python]');
    window.CV_PYTHON?.mount(pythonRoot,id);
    const update=()=>{
      const m=calculate(id,params),s=m.steps[current];
      window.CV_PYTHON?.update(pythonRoot,id,params,m);
      root.querySelector('.tutor-drawing').innerHTML=drawing(m,id,params);
      root.querySelector('.tutor-values').innerHTML=m.values.map(([label,value])=>`<div><span>${E(label)}</span><output>${value===null?'Undefined':N(value,5)}</output></div>`).join('');
      root.querySelector('.tutor-current-step').innerHTML=`<div class="eyebrow">STEP ${current+1} OF 4</div><h3>${E(s.title)}</h3>${texEl(s.tex)}<p>${E(s.detail)}</p>`;
      root.querySelector('.tutor-interpretation').textContent=m.note;
      root.querySelector('.tutor-all-steps>div').innerHTML=m.steps.map((s,i)=>`<section><h3>${i+1}. ${E(s.title)}</h3>${texEl(s.tex)}<p>${E(s.detail)}</p></section>`).join('');
      root.querySelectorAll('[data-step]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.step)===current)));
      root.querySelector('.tutor-prev').disabled=current===0;root.querySelector('.tutor-next').disabled=current===3;
      renderMath(root);
    };
    root.querySelectorAll('[data-param],[data-number]').forEach(el=>el.addEventListener('input',()=>{
      const i=Number(el.dataset.param??el.dataset.number),c=g.controls[i],raw=el.value,value=Number(raw),status=root.querySelector('.tutor-input-status');
      if(raw.trim()===''||!Number.isFinite(value)||value<c.min||value>c.max){status.textContent=`Enter ${c.label.toLowerCase()} between ${c.min} and ${c.max}.`;return;}
      if(c.step===1&&!Number.isInteger(value)){status.textContent='This count must be a whole number.';return;}
      status.textContent='';params[i]=value;root.querySelector(`[data-param="${i}"]`).value=value;root.querySelector(`[data-number="${i}"]`).value=value;update();
    }));
    const move=n=>{current=Math.max(0,Math.min(3,n));update();};
    root.querySelectorAll('[data-step]').forEach(el=>el.addEventListener('click',()=>move(Number(el.dataset.step))));
    root.querySelector('.tutor-prev').addEventListener('click',()=>move(current-1));root.querySelector('.tutor-next').addEventListener('click',()=>move(current+1));
    root.querySelector('.tutor-reset').addEventListener('click',()=>{params=g.controls.map(c=>c.value);current=0;root.querySelector('.tutor-input-status').textContent='';g.controls.forEach((c,i)=>{root.querySelector(`[data-param="${i}"]`).value=c.value;root.querySelector(`[data-number="${i}"]`).value=c.value;});update();window.CV_PYTHON?.restore(pythonRoot);});
    root.querySelectorAll('[data-term]').forEach(el=>el.addEventListener('click',()=>{
      const i=Number(el.dataset.term),[symbol,meaning]=window.CV_TEACHING[id].symbols[i],target=root.querySelector('.term-detail'),was=el.getAttribute('aria-expanded')==='true';
      root.querySelectorAll('[data-term]').forEach(b=>b.setAttribute('aria-expanded',String(b===el&&!was)));target.hidden=was;
      target.innerHTML=`<strong>${symbolMarkup(symbol,id)} · ${E(meaning)}</strong><p>${E(noteFor(symbol,id)?.detail ?? g.notation)}</p><p><strong>In this lesson:</strong> ${E(g.notation)}</p>`;
      renderMath(target);
    }));update();
  }
  window.CV_TUTOR={calculate,drawing,markup,mount,renderMath,symbolMarkup,noteFor};
})();
