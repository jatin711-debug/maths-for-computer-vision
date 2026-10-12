/* Primers for Modules 08-11 (Lessons 29-44). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  /* ---------- Module 08: optimization and reliable training ---------- */

  add(29, {
    builds: [{lesson: 18, why: 'the negative gradient points in the steepest downhill direction'}, {lesson: 13, why: 'eigenvalues measure how steep each direction is'}],
    recall: ['gradient', 'derivative', 'second-derivative', 'eigenvalue', 'hessian'],
    symbols: [
      ['α', 'learning rate: how far each step moves against the gradient', 'learning-rate'],
      ['t', 'update counter: wₜ is the weight after t updates', 'gradient-descent']
    ],
    terms: [
      {
        id: 'gradient-descent', term: 'Gradient descent', symbol: T`w_{t+1}=w_t-\alpha\nabla L(w_t)`,
        plain: T`The basic training loop. At the current weights, compute the gradient of the loss (which way is uphill), then take a small step the opposite way. Repeating this walks the weights downhill towards lower loss, one update at a time. For a single weight, \(\nabla L\) is just the derivative \(L'(w)\).`,
        formula: T`w_{t+1}=w_t-\alpha\,\nabla L(w_t)`,
        steps: [T`Evaluate the gradient at the current weight, before changing anything.`, T`Multiply it by the learning rate \(\alpha\).`, T`Subtract the result from the weight to get \(w_{t+1}\).`, T`Recompute the loss to check that it went down, then repeat from the new weight.`],
        examples: [[T`\(L=(w-3)^2,\ w_0=0,\ \alpha=0.1\)`, T`gradient \(2(0-3)=-6\), so \(w_1=0-0.1(-6)=0.6\); loss \(9\to5.76\)`], [T`next step from \(w_1=0.6\)`, T`gradient \(-4.8\), so \(w_2=0.6+0.48=1.08\); loss \(\approx3.69\)`], [T`\(w_0=0,\ \alpha=0.2\)`, T`\(w_1=0-0.2(-6)=1.2\)`]],
        pitfall: T`Subtract the gradient; adding it walks uphill. A negative gradient means the weight should increase, as in the example above.`,
        seeAlso: [30, 31, 38, 54]
      },
      {
        id: 'learning-rate', term: 'Learning rate (step size)', symbol: T`\alpha`,
        plain: T`The positive number that scales each gradient step. Too small and training crawls; too large and each step overshoots the minimum, so the loss bounces or blows up. Some pages and libraries write it as \(\eta\) (eta); it means the same thing.`,
        formula: T`w_{t+1}-3=(1-2\alpha)(w_t-3)\qquad\text{for }L=(w-3)^2`,
        steps: [T`Write the error \(e_t=w_t-3\): the distance from the minimum.`, T`One update multiplies the error by \(1-2\alpha\).`, T`The error shrinks when \(|1-2\alpha|<1\), which needs \(0<\alpha<1\).`, T`A negative multiplier (\(\alpha>0.5\)) flips the error’s sign each step, so the weight zigzags across the minimum.`, T`The graph shows the loss after one step from \(w_0=0\): best at \(0.5\), back to the start at \(1\), worse beyond.`],
        examples: [[T`\(\alpha=0.25\)`, T`multiplier \(0.5\): the error halves each step`], [T`\(\alpha=0.5\)`, T`multiplier \(0\): lands on \(w=3\) in one step`], [T`\(\alpha=0.75\)`, T`multiplier \(-0.5\): zigzags but shrinks`], [T`\(\alpha=1.2\)`, T`multiplier \(-1.4\): the error grows and training diverges`]],
        plot: {fn: 'x => 9 * (2 * x - 1) ** 2', x: [0, 1.2], y: [0, 18], xLabel: 'learning rate α', yLabel: 'loss after one step', marks: [0.1, 0.5, 1]},
        pitfall: T`A rate that works for one loss can diverge on another: the safe range depends on the curvature. A steeper loss needs a smaller step.`,
        seeAlso: [30, 31, 32]
      },
      {
        id: 'convergence-range', term: 'Safe learning-rate range on a quadratic', symbol: T`0<\alpha<2/\lambda_{\max}`,
        plain: T`On a bowl-shaped (quadratic) loss, each direction has its own curvature, given by an eigenvalue \(\lambda\) of the Hessian. Along that direction one step multiplies the error by \(1-\alpha\lambda\). Training settles only if every multiplier has size below one, so the steepest direction sets the largest safe learning rate.`,
        formula: T`|1-\alpha\lambda_i|<1\ \text{for every }i\iff0<\alpha<\frac{2}{\lambda_{\max}}`,
        steps: [T`Find the curvatures: the eigenvalues of the Hessian (for one weight, the second derivative).`, T`Take the largest one, \(\lambda_{\max}\).`, T`Choose the learning rate between \(0\) and \(2/\lambda_{\max}\).`, T`Check the flattest direction too: a small \(\lambda\) gives a multiplier near 1, so progress there is slow.`],
        examples: [[T`\(L=(w-3)^2\), curvature \(L''=2\)`, T`\(0<\alpha<2/2=1\)`], [T`eigenvalues \(2\) and \(10\)`, T`\(0<\alpha<2/10=0.2\)`], [T`eigenvalues \(2,10\) with \(\alpha=0.15\)`, T`multipliers \(0.7\) and \(-0.5\): both shrink`]],
        pitfall: T`The range is exact only for quadratics. For a neural network it is a guide: curvature changes from place to place, so a rate that was safe early can become unsafe later.`,
        seeAlso: [31, 32]
      },
      {
        id: 'local-minimum', term: 'Local and global minima', symbol: T`\nabla L=0`,
        plain: T`A local minimum is lower than every nearby point; a global minimum is the lowest point anywhere. The gradient is zero at both, but it is also zero at a maximum and at a saddle (downhill one way, uphill another). A zero gradient only says “flat here”, not “best possible”.`,
        steps: [T`Solve \(\nabla L=0\) to find the flat (stationary) points.`, T`Check the curvature there: upward in every direction means a local minimum.`, T`Compare the loss at all local minima to find the global one.`, T`For a convex loss (Lesson 31), any local minimum is already global.`],
        examples: [[T`\(L=(w-3)^2\) at \(w=3\)`, T`\(L'=0,\ L''=2>0\): the global minimum`], [T`\(L=-w^2\) at \(w=0\)`, T`\(L'=0,\ L''=-2<0\): a maximum`], [T`\(L=x^2-y^2\) at \((0,0)\)`, T`gradient \((0,0)\); up along \(x\), down along \(y\): a saddle`], [T`\(L=w^3\) at \(w=0\)`, T`\(L'=0,\ L''=0\): flat but neither; lower values lie to the left`]],
        pitfall: T`Neural-network losses have many flat points. When training stops improving you have found a flat region, not proof of the best possible weights.`,
        seeAlso: [31]
      }
    ]
  });

  add(30, {
    builds: [{lesson: 29, why: 'each optimizer here changes the gradient-descent step'}, {lesson: 22, why: 'a batch gradient estimates the expected gradient'}],
    recall: ['gradient-descent', 'learning-rate', 'expected-value', 'ridge-regression', 'cosine'],
    symbols: [
      ['v', 'velocity: a running total of past gradients, shrunk by β each step', 'momentum'],
      ['β', 'fraction of the old velocity kept each step, between 0 and 1', 'momentum'],
      ['g', 'gradient computed on the current mini-batch', 'mini-batch-sgd']
    ],
    terms: [
      {
        id: 'mini-batch-sgd', term: 'Mini-batch stochastic gradient descent (SGD)', symbol: T`g_t=\frac1B\sum_{i\in\text{batch}}\nabla\ell_i`,
        plain: T`The exact gradient needs every training example. SGD instead averages the gradients of a small random batch of \(B\) examples and steps with that estimate. It is noisy but cheap, and on average it equals the full gradient. One epoch is one pass through all \(N\) training examples, which takes \(N/B\) updates.`,
        formula: T`g_t=\frac1B\sum_{i\in\text{batch}_t}\nabla\ell_i(w_t),\qquad\text{updates per epoch}=\frac{N}{B}`,
        steps: [T`Shuffle the training set and cut it into batches of \(B\) examples.`, T`For one batch, average the examples’ gradients to get \(g_t\) (\(i\in\text{batch}\) means “for each example \(i\) in the batch”).`, T`Take a gradient-descent step with \(g_t\).`, T`When every batch has been used once, one epoch is finished; reshuffle and repeat.`],
        examples: [[T`\(N=100,\ B=20\)`, T`\(100/20=5\) updates per epoch`], [T`per-example gradients \(1,3,5,7\)`, T`full gradient: their mean, \(4\)`], [T`batches of two: \(\{1,3\},\ \{5,7\},\ \{1,7\}\)`, T`estimates \(2,\ 6,\ 4\): noisy, but all six possible pairs average to \(4\)`]],
        pitfall: T`“10 epochs” and “10 updates” are very different budgets. Sampling one class more often than it occurs changes what is being minimized unless you correct for it.`,
        seeAlso: [32, 39]
      },
      {
        id: 'exponential-moving-average', term: 'Exponential moving average', symbol: T`m_t=\beta m_{t-1}+(1-\beta)x_t`,
        plain: T`A running average that keeps a fraction \(\beta\) of its old value and takes the rest from the newest number. Recent values count most and older ones fade away. Optimizers use it to smooth noisy gradients; normalization layers use it to remember typical activation statistics.`,
        formula: T`m_t=\beta\,m_{t-1}+(1-\beta)\,x_t,\qquad\hat m_t=\frac{m_t}{1-\beta^{t}}\ \text{(bias correction when }m_0=0)`,
        steps: [T`Start with \(m_0=0\).`, T`For each new value, multiply the old average by \(\beta\) and add \((1-\beta)\) times the new value.`, T`Because the starting 0 drags early averages down, divide by \(1-\beta^t\) to correct them.`],
        examples: [[T`\(\beta=0.9\), values \(2,2,2\)`, T`\(m=0.2,\ 0.38,\ 0.542\)`], [T`corrected: \(0.2/0.1,\ 0.38/0.19,\ 0.542/0.271\)`, T`\(2,\ 2,\ 2\): the true average`], [T`\(\beta=0.5\), values \(4,0,4\)`, T`\(m=2,\ 1,\ 2.5\)`]],
        pitfall: T`A larger \(\beta\) means a longer memory and a slower reaction to change, not a larger average.`,
        seeAlso: [39]
      },
      {
        id: 'momentum', term: 'Momentum', symbol: T`v_t=\beta v_{t-1}+g_t`,
        plain: T`Momentum gives the update a memory. Instead of stepping along the latest gradient alone, it keeps a velocity \(v\): the new gradient plus a shrunk copy of the previous velocity. Steps grow along directions where gradients keep agreeing and partly cancel where they keep flipping sign.`,
        formula: T`v_t=\beta\,v_{t-1}+g_t,\qquad w_{t+1}=w_t-\alpha\,v_t,\qquad v_0=0`,
        steps: [T`Start the velocity at zero.`, T`Multiply the old velocity by \(\beta\) and add the new gradient.`, T`Move the weight by \(-\alpha\) times the velocity.`],
        examples: [[T`\(\beta=0.9,\ v_{t-1}=2,\ g_t=1\)`, T`\(v_t=0.9(2)+1=2.8\)`], [T`\(\alpha=0.1,\ \beta=0.9\), gradients \(2\) then \(1\)`, T`\(v=2\) then \(2.8\); moves \(-0.2\) then \(-0.28\)`], [T`\(\beta=0.5\), gradients \(4\) then \(-2\)`, T`\(v=4\) then \(0.5(4)-2=0\): the sign flip cancels`]],
        pitfall: T`Libraries differ: some use \(v_t=\beta v_{t-1}+(1-\beta)g_t\), which changes what \(\alpha\) means. Check the exact formula before comparing settings, and reset \(v\) to zero when restarting training.`
      },
      {
        id: 'adam', term: 'Adam optimizer', symbol: T`\theta_{t+1}=\theta_t-\alpha\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}`,
        plain: T`Adam keeps two exponential moving averages for every parameter: \(m\) of the gradient and \(v\) of the squared gradient. It steps by \(\hat m/\sqrt{\hat v}\), which divides each gradient by its typical size, so every parameter moves on a similar scale however large its raw gradient is.`,
        formula: T`m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,\quad v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2,\quad\hat m_t=\frac{m_t}{1-\beta_1^t},\quad\hat v_t=\frac{v_t}{1-\beta_2^t}`,
        steps: [T`Update \(m\) with the gradient and \(v\) with the squared gradient (common choices: \(\beta_1=0.9,\ \beta_2=0.999\)).`, T`Bias-correct both by dividing by \(1-\beta^t\).`, T`Divide \(\hat m\) by \(\sqrt{\hat v}\) plus a tiny \(\epsilon\) (such as \(10^{-8}\)) that prevents division by zero.`, T`Move the parameter by \(-\alpha\) times that ratio.`],
        examples: [[T`first gradient \(g=2\)`, T`\(m=0.2,\ v=0.004\); corrected \(\hat m=2,\ \hat v=4\)`], [T`its step with \(\alpha=0.1\)`, T`\(-0.1\times2/\sqrt4=-0.1\) (plain SGD would move \(-0.2\))`], [T`first gradient \(g=3\)`, T`\(\hat v=9\); the step is again \(\approx-0.1\)`], [T`first gradient \(g=100\) or \(g=-0.01\)`, T`step \(\approx-0.1\) or \(\approx+0.1\): its size comes from \(\alpha\), not \(g\)`]],
        pitfall: T`\(\hat v\) is the average squared gradient (the second moment), not the variance: the mean is not subtracted. A lower training loss with Adam in one run is not proof that it generalizes better.`
      },
      {
        id: 'adamw', term: 'AdamW: decoupled weight decay', symbol: T`\theta\leftarrow\theta-\alpha\lambda\theta`,
        plain: T`Adding an L2 penalty \(\frac\lambda2\|\theta\|^2\) to the loss puts \(\lambda\theta\) inside the gradient, so Adam divides it by \(\sqrt{\hat v}\) like everything else: weights with large gradients are barely shrunk and weights with tiny gradients are shrunk hard. AdamW takes the Adam step on the data loss alone and then shrinks every weight by the same fraction, \(\alpha\lambda\theta\).`,
        formula: T`\theta_{t+1}=\theta_t-\alpha\Bigl(\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}+\lambda\,\theta_t\Bigr)\qquad(\hat m,\ \hat v\text{ from the data gradient only})`,
        steps: [T`Compute Adam’s step from the data-loss gradient, without any penalty.`, T`Separately shrink the weight: subtract \(\alpha\lambda\theta\).`, T`Contrast L2-inside-Adam: \(\lambda\theta\) is added to \(g\) before the moving averages, so the shrinkage is rescaled by \(1/\sqrt{\hat v}\).`],
        examples: [[T`first step, \(\theta=1\), data gradient 2, \(\alpha=0.1,\ \lambda=0.01\)`, T`AdamW: \(1-0.1-0.001=0.899\)`], [T`same with L2 inside Adam`, T`\(g=2+0.01=2.01\), step still \(-0.1\): \(\theta=0.9\), the penalty has no effect`], [T`shrinkage of \(\theta=1\) per step when \(\sqrt{\hat v}=10\)`, T`L2 in Adam \(\approx0.1\cdot0.01/10=0.0001\); AdamW \(0.001\)`], [T`the same when \(\sqrt{\hat v}=0.01\)`, T`L2 in Adam \(\approx0.1\); AdamW still \(0.001\)`]],
        pitfall: T`In many libraries the weight-decay setting of plain Adam is the L2 version, while AdamW is the decoupled one. The same \(\lambda\) does not give the same model.`,
        seeAlso: [39]
      },
      {
        id: 'learning-rate-schedule', term: 'Learning-rate schedules: warmup and cosine decay', symbol: T`\alpha_t`,
        plain: T`The learning rate need not stay fixed. Warmup raises it in a straight line from near 0 over the first few hundred or thousand updates, which avoids huge early steps while the weights and Adam’s averages settle. Cosine decay then lowers it smoothly along half a cosine curve to a small final value, so the last updates make fine adjustments.`,
        formula: T`\alpha_t=\alpha_{\max}\frac{t}{T_w}\ \ (t\le T_w),\qquad\alpha_t=\alpha_{\min}+\tfrac12(\alpha_{\max}-\alpha_{\min})\bigl(1+\cos(\pi s)\bigr),\ \ s=\frac{t-T_w}{T-T_w}`,
        steps: [T`During warmup (\(t\le T_w\)), multiply the peak rate by \(t/T_w\).`, T`After warmup, find the progress \(s\) from 0 to 1 through the remaining updates.`, T`Compute \(\tfrac12(1+\cos\pi s)\): it falls from 1 to 0. Scale it into the range from \(\alpha_{\min}\) to \(\alpha_{\max}\).`],
        examples: [[T`\(\alpha_{\max}=0.001,\ T_w=100\), update 50`, T`\(0.0005\)`], [T`update 100 (end of warmup)`, T`\(0.001\)`], [T`total \(T=1100,\ \alpha_{\min}=0\), update 350 (\(s=0.25\))`, T`\(0.001\cdot\tfrac12(1+0.707)\approx0.00085\)`], [T`update 600 (\(s=0.5\)) and update 1100 (\(s=1\))`, T`\(0.0005\) and \(0\)`]],
        pitfall: T`Schedules count updates, not epochs. Changing the batch size changes the number of updates per epoch, so the same schedule in epochs gives a different curve.`
      }
    ]
  });

  add(31, {
    builds: [{lesson: 20, why: 'the Hessian collects second derivatives (curvature)'}, {lesson: 29, why: 'flat points and gradient steps'}, {lesson: 13, why: 'eigenvalues give the curvature along each direction'}],
    recall: ['hessian', 'quadratic-form', 'eigenvalue', 'local-minimum', 'clipping'],
    symbols: [
      ['∇²f', 'Hessian of f: the matrix of second derivatives, its curvature'],
      ['⪰0', 'positive semidefinite: curvature is upward or flat in every direction', 'positive-semidefinite']
    ],
    terms: [
      {
        id: 'convex-function', term: 'Convex function', symbol: T`f(tx+(1-t)y)\le tf(x)+(1-t)f(y)`,
        plain: T`A function is convex when the straight line (chord) joining any two points on its graph never dips below the graph, like a bowl. A convex loss has no hidden lower valleys: any local minimum is the global minimum, so gradient descent cannot get stuck in a worse one.`,
        formula: T`f\bigl(tx+(1-t)y\bigr)\le t\,f(x)+(1-t)\,f(y)\qquad\text{for all }x,y\text{ and }0\le t\le1`,
        steps: [T`Pick two inputs \(x,y\) and a mixing weight \(t\) between 0 and 1.`, T`Left side: evaluate \(f\) at the mixed input \(tx+(1-t)y\).`, T`Right side: mix the two outputs, \(tf(x)+(1-t)f(y)\).`, T`Convex needs left \(\le\) right for every choice; one failure proves it is not convex.`],
        examples: [[T`\(f=x^2,\ x=0,\ y=2,\ t=0.5\)`, T`\(f(1)=1\le\frac{0+4}{2}=2\): holds`], [T`\(f=-x^2\), same points`, T`\(-1\le-2\)? No, so \(-x^2\) is not convex`], [T`\(f=|x|,\ x=-2,\ y=4,\ t=0.5\)`, T`\(|1|=1\le\frac{2+4}{2}=3\): holds (convex despite its corner)`]],
        pitfall: T`Curving upward at one point does not make a whole function convex. Least squares is convex, but a neural network’s loss usually is not.`,
        seeAlso: [52]
      },
      {
        id: 'positive-semidefinite', term: 'Positive semidefinite matrix', symbol: T`H\succeq0`,
        plain: T`A symmetric matrix \(H\) is positive semidefinite when \(v^THv\ge0\) for every vector \(v\): it never curves downward in any direction. For a Hessian this is the matrix version of “second derivative \(\ge0\)”. Equivalently, all its eigenvalues are \(\ge0\). If they are all \(>0\) it is positive definite.`,
        formula: T`H\succeq0\iff v^THv\ge0\ \text{for all }v\iff\text{every eigenvalue }\lambda_i\ge0`,
        steps: [T`Check the matrix is symmetric (the Hessian of a smooth function is).`, T`Find its eigenvalues; for a diagonal matrix they are the diagonal entries.`, T`All \(\ge0\): positive semidefinite. All \(>0\): positive definite. Any negative: neither.`, T`To prove “not”, one vector with \(v^THv<0\) is enough.`],
        examples: [[T`\(f=x^2+2y^2\), \(H=\operatorname{diag}(2,4)\)`, T`eigenvalues \(2,4>0\): positive definite, so \(f\) is convex`], [T`\(\begin{bmatrix}2&1\\1&2\end{bmatrix}\)`, T`eigenvalues \(1,3\): positive definite`], [T`\(\begin{bmatrix}1&2\\2&1\end{bmatrix}\)`, T`eigenvalues \(-1,3\); \(v=(1,-1)\) gives \(v^THv=-2\): not semidefinite`], [T`\(\operatorname{diag}(2,0)\)`, T`eigenvalues \(2,0\): semidefinite, flat along the second axis`]],
        pitfall: T`Positive entries are not enough: \(\begin{bmatrix}1&2\\2&1\end{bmatrix}\) has only positive entries yet curves down along \((1,-1)\). Check the eigenvalues, not the entries.`
      },
      {
        id: 'lagrange-multiplier', term: 'Lagrange multipliers', symbol: T`\mathcal L=f+\lambda(g-c)`,
        plain: T`A method for minimizing a function when the inputs must satisfy an equation, such as \(x+y=1\). Attach the constraint to the objective with a new unknown \(\lambda\) (the multiplier), then set every partial derivative to zero. At the answer, no move that keeps the constraint true can lower the objective.`,
        formula: T`\mathcal L(x,y,\lambda)=f(x,y)+\lambda\bigl(g(x,y)-c\bigr),\qquad\frac{\partial\mathcal L}{\partial x}=0,\quad\frac{\partial\mathcal L}{\partial y}=0,\quad g(x,y)=c`,
        steps: [T`Write the constraint as \(g(x,y)=c\).`, T`Form \(\mathcal L=f+\lambda(g-c)\).`, T`Set the partial derivatives with respect to \(x\) and \(y\) to zero, and keep the constraint as a third equation.`, T`Solve the three equations together, then evaluate \(f\) at the solution.`],
        examples: [[T`minimize \(x^2+y^2\) with \(x+y=1\)`, T`\(2x+\lambda=0,\ 2y+\lambda=0\Rightarrow x=y=\tfrac12,\ \lambda=-1\); value \(\tfrac12\)`], [T`minimize \(x^2+y^2\) with \(x+y=4\)`, T`\(x=y=2,\ \lambda=-4\); value \(8\)`]],
        pitfall: T`The unconstrained minimum \((0,0)\) breaks the constraint, so the answer is not where the ordinary gradient is zero. The equations give candidates; check that a candidate really is a minimum.`
      },
      {
        id: 'projected-gradient-descent', term: 'Constraints and projected gradient descent', symbol: T`\operatorname{clip}_{[a,b]}`,
        plain: T`A constraint limits which values are allowed, such as \(w\le1\). The best allowed point can sit on the boundary, where the ordinary gradient is not zero. Projected gradient descent takes a normal step and then moves back to the nearest allowed point; for an interval that is just clipping.`,
        formula: T`w_{t+1}=\operatorname{clip}_{[a,b]}\bigl(w_t-\alpha L'(w_t)\bigr),\qquad\operatorname{clip}_{[a,b]}(u)=\min\bigl(b,\max(a,u)\bigr)`,
        steps: [T`Take an ordinary gradient step.`, T`If the result is below \(a\), set it to \(a\); if it is above \(b\), set it to \(b\).`, T`At a boundary optimum the gradient points out of the allowed range instead of being zero.`],
        examples: [[T`minimize \((w-3)^2\) with \(w\le1\)`, T`best \(w=1\); there \(L'=-4\ne0\)`], [T`minimize \((w-3)^2\) with \(0\le w\le2\)`, T`best \(w=2\), where \(L'=-2\)`], [T`from \(w=0.5\) with \(\alpha=0.25\), allowed \([0,1]\)`, T`step to \(0.5-0.25(-5)=1.75\), then clip to \(1\)`]],
        pitfall: T`Clipping inside a network changes its derivatives: once a value is clipped, its gradient is zero. Decide whether a constraint belongs in the model, the optimizer or only in evaluation.`
      }
    ]
  });

  add(32, {
    builds: [{lesson: 23, why: 'variances add up over independent terms'}, {lesson: 27, why: 'softmax cross-entropy gives the starting-loss check'}, {lesson: 29, why: 'curvature limits the step size'}],
    recall: ['variance', 'standard-deviation', 'cross-entropy', 'softmax', 'condition-number'],
    symbols: [
      ['fan-in', 'fan-in: how many inputs one unit adds together', 'fan-in'],
      ['W', 'starting weights: random, with a spread chosen from the fan-in', 'weight-initialization']
    ],
    terms: [
      {
        id: 'fan-in', term: 'Fan-in', symbol: T`D`,
        plain: T`The number of inputs feeding into one unit (neuron) of a layer. The unit adds up that many weighted inputs, so the size of its output grows with the fan-in unless the weights are made smaller to compensate.`,
        steps: [T`Pick one output unit and count the inputs it adds together.`, T`For a dense layer from \(D\) features, every unit has fan-in \(D\).`],
        examples: [[T`dense layer \(784\to128\)`, T`fan-in \(784\) (and fan-out \(128\))`], [T`dense layer \(100\to10\)`, T`fan-in \(100\)`], [T`a \(3\times3\) filter over 16 input channels (Lesson 35)`, T`fan-in \(3\cdot3\cdot16=144\)`]],
        pitfall: T`Fan-in counts the inputs to one unit, not the number of units in the layer (that is the fan-out).`,
        seeAlso: [35]
      },
      {
        id: 'weight-initialization', term: 'Variance-scaled weight initialization', symbol: T`\operatorname{Var}(w)=\tfrac{2}{D}`,
        plain: T`Training starts from random weights. If each of \(D\) inputs has variance \(s^2\) and each weight has variance \(v^2\), their weighted sum has variance about \(Dv^2s^2\). Choosing \(v^2=1/D\) keeps the signal the same size layer after layer; for ReLU layers the He rule \(v^2=2/D\) makes up for ReLU zeroing about half the values.`,
        formula: T`\operatorname{Var}\Bigl(\sum_{j=1}^{D}w_jx_j\Bigr)\approx D\,v^2s^2,\qquad v^2_{\text{He}}=\frac{2}{D}`,
        steps: [T`Find the fan-in \(D\) of the layer.`, T`Choose the weight variance: \(1/D\) to preserve a plain weighted sum, \(2/D\) (He) before a ReLU.`, T`Take the square root to get the standard deviation, and draw zero-mean weights with that spread.`, T`Give every weight its own random value so that units do not start identical.`],
        examples: [[T`\(D=100,\ v^2=1,\ s^2=1\)`, T`sum variance \(100\) (standard deviation 10): far too large`], [T`\(D=100,\ v^2=1/100\)`, T`sum variance \(1\): size preserved`], [T`He, \(D=100\)`, T`\(v^2=0.02\), standard deviation \(\approx0.141\)`], [T`He, \(D=32\)`, T`\(v^2=0.0625\), standard deviation \(0.25\)`]],
        pitfall: T`Never start every weight at the same value, such as all zeros: identical units receive identical gradients and stay copies of each other. Random starts break that symmetry.`,
        seeAlso: [37, 41]
      },
      {
        id: 'vanishing-and-exploding-gradients', term: 'Vanishing and exploding gradients', symbol: T`c^{\,n}`,
        plain: T`In a deep network each layer scales the signal going forward, and the gradient going backward, by some factor. Multiplying by a number below one again and again shrinks it towards zero (vanishing); by a number above one it grows out of control (exploding). Keeping each layer’s factor near one is why the initialization scale matters.`,
        formula: T`\text{size after }n\text{ layers}\approx c^{\,n}\times\text{starting size}`,
        steps: [T`Estimate how much one layer scales the size of what passes through it: the factor \(c\).`, T`Raise it to the number of layers \(n\).`, T`Far below 1 means tiny gradients and early layers that barely learn; far above 1 means overflow and NaN values.`],
        examples: [[T`\(c=0.5,\ n=10\)`, T`\(0.5^{10}\approx0.001\)`], [T`\(c=1.5,\ n=10\)`, T`\(1.5^{10}\approx57.7\)`], [T`\(c=0.9,\ n=20\)`, T`\(0.9^{20}\approx0.12\)`], [T`\(c=1,\ n=10\)`, T`\(1\): size preserved`]],
        pitfall: T`A flat training loss can come from vanishing gradients, but also from a learning rate that is too small, frozen parameters or misaligned labels. Measure the gradient sizes before deciding.`,
        seeAlso: [38, 39]
      },
      {
        id: 'chance-level-loss', term: 'Starting-loss check: ln C', symbol: T`L_0\approx\ln C`,
        plain: T`If a freshly initialized classifier gives all \(C\) classes the same score, softmax gives each class probability \(1/C\), so the cross-entropy loss is \(-\ln(1/C)=\ln C\). Comparing the first loss you see with \(\ln C\) is a quick check that the outputs and labels are wired up correctly.`,
        formula: T`p_c=\frac1C\ \Rightarrow\ L=-\ln\frac1C=\ln C`,
        steps: [T`Count the classes \(C\).`, T`Compute \(\ln C\).`, T`Compare it with the loss on the first batch. Far above it suggests very large starting scores or a bug.`],
        examples: [[T`\(C=2\)`, T`\(\ln2\approx0.693\)`], [T`\(C=3\)`, T`\(\ln3\approx1.0986\)`], [T`\(C=4\)`, T`\(\ln4\approx1.386\)`], [T`\(C=10\)`, T`\(\ln10\approx2.303\)`]],
        pitfall: T`It is a rough guide, not an exact law: random starting scores and class weights move the first loss away from \(\ln C\).`
      }
    ]
  });

  /* ---------- Module 09: images, convolution and frequency ---------- */

  add(33, {
    builds: [{lesson: 1, why: 'an image is a grid of stored numbers indexed by row and column'}, {lesson: 5, why: 'a position needs a stated origin and axis order'}],
    recall: ['pixel', 'cosine', 'weighted-sum', 'absolute-value', 'set-notation'],
    symbols: [
      ['fs', 'sampling rate: how many samples are taken per unit of time or distance', 'nyquist-rate'],
      ['fmax', 'the highest frequency the signal contains (it must have one)', 'nyquist-rate']
    ],
    terms: [
      {
        id: 'sinusoid', term: 'Cosine and sine waves: frequency and period', symbol: T`\cos(2\pi ft)`,
        plain: T`Lesson 6 gave \(\cos\theta\) and \(\sin\theta\) for an angle. Let the angle keep growing and the values repeat after every full turn, \(2\pi\approx6.283\) radians (360°), tracing a smooth wave. \(\cos(2\pi ft)\) completes \(f\) full turns per unit of \(t\): \(f\) is the frequency (cycles per unit) and \(1/f\) is the period, the length of one cycle.`,
        formula: T`\cos(\theta+2\pi)=\cos\theta,\qquad x(t)=\cos(2\pi ft),\qquad\text{period}=\frac1f`,
        steps: [T`Turn time into an angle: \(\theta=2\pi ft\) (one full cycle is \(2\pi\) radians).`, T`Use the key values \(\cos0=1,\ \cos\frac\pi2=0\ (90^\circ),\ \cos\pi=-1\ (180^\circ),\ \cos\frac{3\pi}2=0\). The sine wave is the same shape shifted by a quarter cycle.`, T`For other angles use a calculator in radian mode, or \(\texttt{math.cos}\) in Python.`, T`The period, the time for one cycle, is \(1/f\).`],
        examples: [[T`\(\cos(2\pi t)\) at \(t=0,\ 0.25,\ 0.5,\ 0.75,\ 1\)`, T`\(1,\ 0,\ -1,\ 0,\ 1\)`], [T`\(\sin(2\pi t)\) at the same times`, T`\(0,\ 1,\ 0,\ -1,\ 0\)`], [T`\(f=2\)`, T`period \(0.5\): two cycles per unit`], [T`\(f=0.5\)`, T`period \(2\)`]],
        plot: {fn: 'x => Math.cos(2 * Math.PI * x)', x: [0, 2], y: [-1.2, 1.2], xLabel: 't', yLabel: 'cos(2πt)', marks: [0, 0.25, 0.5]},
        pitfall: T`A calculator in degree mode gives wrong answers: \(\cos(2\pi t)\) assumes radians. In Lesson 6 the cosine measured an angle between vectors; here the same function describes a repeating wave.`,
        seeAlso: [36]
      },
      {
        id: 'nyquist-rate', term: 'Sampling rate and the Nyquist limit', symbol: T`f_s>2f_{\max}`,
        plain: T`Sampling records a signal only at evenly spaced points, \(f_s\) times per unit. A wave can be pinned down from its samples only if it is sampled more than twice per cycle. So the sampling rate must exceed twice the highest frequency present. Half the sampling rate, \(f_s/2\), is the Nyquist limit: the fastest wave the samples can represent.`,
        formula: T`f_s>2f_{\max}\iff f_{\max}<\frac{f_s}{2}\quad\text{(the Nyquist limit)}`,
        steps: [T`Find the highest frequency in the signal, \(f_{\max}\).`, T`Double it.`, T`The sampling rate must be strictly larger; otherwise high frequencies will pose as low ones.`],
        examples: [[T`\(f_{\max}=4\) cycles per unit`, T`need \(f_s>8\)`], [T`\(f_s=12\)`, T`Nyquist limit \(6\): waves below 6 cycles per unit are safe`], [T`halving an image’s width`, T`\(f_s\) and the limit halve, so the finest detail must be removed first`]],
        pitfall: T`The rule assumes the signal has a highest frequency. Sharp edges and fine texture in real images contain very high frequencies, so practical resizing blurs slightly first.`,
        seeAlso: [36, 56]
      },
      {
        id: 'aliasing', term: 'Aliasing', symbol: T`f_{\text{apparent}}`,
        plain: T`When a wave is sampled too slowly, its samples are identical to those of a slower wave, so it shows up as a false low frequency: an alias. Once sampled, nothing can tell the two apart. In images this causes moiré patterns and broken stripes after careless shrinking.`,
        formula: T`f_{\text{apparent}}=\bigl|f-k\,f_s\bigr|,\qquad k=\text{the whole number nearest to }f/f_s`,
        steps: [T`Divide the frequency by the sampling rate and round to the nearest whole number \(k\).`, T`Subtract \(kf_s\) from \(f\) and take the absolute value.`, T`If the result differs from \(f\), the samples cannot tell \(f\) from that slower frequency.`],
        examples: [[T`\(f=8,\ f_s=12\)`, T`\(k=1\): apparent \(|8-12|=4\); the same 12 samples as \(f=4\)`], [T`\(f=11,\ f_s=12\)`, T`apparent \(1\)`], [T`\(\cos(2\pi n)\) at whole numbers \(n\) (\(f=f_s=1\))`, T`every sample is 1, exactly like a constant`], [T`\([0,1,0,1,0,1,0,1]\), keep every second entry`, T`\([0,0,0,0]\), or \([1,1,1,1]\) starting from index 1`]],
        pitfall: T`Enlarging the image afterwards cannot bring the lost detail back: the information was discarded when the samples were taken.`,
        seeAlso: [36, 50, 56]
      },
      {
        id: 'low-pass-filter', term: 'Low-pass (anti-aliasing) filter',
        plain: T`A low-pass filter keeps slow changes and removes fast ones, usually by averaging neighbouring values. Applied before downsampling, it removes the detail the coarser grid cannot represent, so that detail fades to an even grey instead of turning into false patterns.`,
        steps: [T`Replace each group of neighbours by its average (here, each pair).`, T`Keep one value per group.`, T`Compare with plain downsampling: the result no longer depends on where you start.`],
        examples: [[T`\([0,1,0,1,0,1,0,1]\), average each pair`, T`\([0.5,0.5,0.5,0.5]\) whichever index you start from`], [T`\([0,1,0,1,0,1]\)`, T`\([0.5,0.5,0.5]\)`], [T`smooth ramp \([0,1,2,3]\)`, T`\([0.5,2.5]\): the slow trend survives`]],
        pitfall: T`Low-pass filtering deliberately throws away fine detail, which can erase tiny objects. It prevents false patterns; it does not recover the lost texture.`,
        seeAlso: [36, 56]
      },
      {
        id: 'interpolation', term: 'Interpolation: nearest and bilinear', symbol: T`(1-t)a+tb`,
        plain: T`Interpolation estimates a value between stored samples using a rule. Nearest-neighbour copies the closest sample. Linear interpolation blends the two neighbours in proportion to distance; bilinear does this along a row and then down a column, mixing four pixels. It guesses smooth in-between values; it never adds measured detail.`,
        formula: T`\text{linear: }(1-t)\,a+t\,b,\qquad 0\le t\le1`,
        steps: [T`Locate the point between samples \(a\) and \(b\); \(t\) is its fractional distance from \(a\).`, T`Nearest: take \(a\) if \(t<0.5\), otherwise \(b\).`, T`Linear: compute \((1-t)a+tb\).`, T`Bilinear: interpolate along each of the two rows, then interpolate those two results down the column.`],
        examples: [[T`\(a=10,\ b=20,\ t=0.25\)`, T`linear \(12.5\); nearest \(10\)`], [T`\(a=10,\ b=20,\ t=0.7\)`, T`linear \(17\); nearest \(20\)`], [T`centre of \(\begin{bmatrix}0&10\\20&30\end{bmatrix}\)`, T`rows give \(5\) and \(25\); bilinear \(15\)`], [T`mask labels 1 and 3, halfway`, T`linear gives \(2\), a class nobody labelled; nearest keeps 1 or 3`]],
        pitfall: T`Masks hold category IDs, not brightness. Averaging IDs invents wrong classes, so resize label masks with nearest-neighbour.`,
        seeAlso: [50, 56]
      },
      {
        id: 'pixel-coordinates', term: 'Pixel coordinates: (x, y), centres and edges', symbol: T`(x,y)=(c,r)`,
        plain: T`Arrays index pixels as [row, column], counting rows downward from the top. Geometry usually writes \((x,y)\) with \(x\) the column and \(y\) the row, so the order flips. You must also say whether a whole number marks a pixel’s centre or its edge. In the edge convention pixel column \(c\) covers \(c\le x<c+1\) and its centre is at \(c+0.5\).`,
        steps: [T`Swap the order: array entry [r, c] has \(x=c\) and \(y=r\).`, T`In the edge convention pixel \((r,c)\) covers \([c,c+1)\) across and \([r,r+1)\) down; \([a,b)\) means from \(a\) up to but not including \(b\). Its centre is \((c+0.5,\ r+0.5)\).`, T`For a width, subtract the edges: \([x_{\min},x_{\max})\) holds \(x_{\max}-x_{\min}\) pixels. Counting both whole-number ends instead adds one.`],
        examples: [[T`array entry \(I[2,5]\)`, T`\(x=5,\ y=2\)`], [T`pixel at row 2, column 5, edge convention`, T`covers \(5\le x<6,\ 2\le y<3\); centre \((5.5,\ 2.5)\)`], [T`columns \(2\le x<5\)`, T`\(5-2=3\) pixels (columns 2, 3, 4)`], [T`columns 2 to 5, both ends included`, T`\(5-2+1=4\) pixels`]],
        pitfall: T`Mixing conventions shifts boxes by half a pixel or changes areas by a row or a column. These off-by-one errors are silent: the code still runs.`,
        seeAlso: [41, 42, 50]
      }
    ]
  });

  add(34, {
    builds: [{lesson: 6, why: 'each output is a dot product of a patch with the kernel'}, {lesson: 33, why: 'an image is a grid of samples'}],
    recall: ['dot-product', 'weighted-sum', 'summation-notation', 'gaussian-distribution', 'outer-product'],
    symbols: [
      ['K', 'kernel: the small grid of weights slid across the image', 'filter-kernel'],
      ['I', 'input image: the grid of pixel values being filtered'],
      ['Y', 'output: one weighted sum for each position where the kernel fits fully', 'cross-correlation']
    ],
    terms: [
      {
        id: 'filter-kernel', term: 'Filter kernel', symbol: T`K`,
        plain: T`A small grid of weights, such as 3×3, laid over one patch of the image at a time. Its numbers decide what it detects: equal positive weights average (blur) the patch, while weights that add up to zero, such as \([1,-1]\), respond to changes and give zero on flat regions.`,
        steps: [T`Lay the kernel over a patch of the same size.`, T`Multiply each weight by the pixel under it and add the products.`, T`Add up the kernel’s own weights: a sum of 1 keeps the average brightness; a sum of 0 gives 0 on any flat patch.`],
        examples: [[T`3×3 mean kernel (every weight \(1/9\)) over six 1s and three 0s`, T`\(6/9=2/3\)`], [T`difference kernel \([1,-1]\) on the flat patch \([5,5]\)`, T`\(5-5=0\)`], [T`\([1,-1]\) on the step \([2,7]\)`, T`\(2-7=-5\): it responds to the change`]],
        pitfall: T`“Kernel” here means a filter’s weights. It has nothing to do with the kernel (null space) of a matrix in Lesson 8.`,
        seeAlso: [35, 41, 56]
      },
      {
        id: 'cross-correlation', term: 'Cross-correlation (sliding weighted sum)', symbol: T`Y_{r,c}=\sum_{i,j}K_{i,j}I_{r+i,c+j}`,
        plain: T`Slide the kernel across the image. At each position, multiply every kernel weight by the pixel beneath it and add the products: that sum is one output value. “Valid” mode uses only positions where the kernel fits entirely, so a row of length \(n\) and a kernel of length \(k\) give \(n-k+1\) outputs.`,
        formula: T`Y_{r,c}=\sum_{i,j}K_{i,j}\,I_{r+i,\,c+j}`,
        steps: [T`Place the kernel’s top-left weight over pixel \((r,c)\).`, T`Multiply each weight by the pixel under it and add everything: that is \(Y_{r,c}\).`, T`Move one step and repeat until the kernel would hang over the edge.`],
        examples: [[T`row \([1,2,4]\), kernel \([1,-1]\)`, T`\(1-2=-1\), then \(2-4=-2\): output \([-1,-2]\)`], [T`row \([1,3,2]\), kernel \([1,-1]\)`, T`\([-2,1]\)`], [T`patch \(\begin{bmatrix}1&2\\3&4\end{bmatrix}\), kernel \(\begin{bmatrix}1&0\\0&-1\end{bmatrix}\)`, T`\(1\cdot1+4\cdot(-1)=-3\)`], [T`3×3 image, 2×2 kernel`, T`\(2\times2=4\) valid positions`]],
        pitfall: T`This is entry-by-entry multiplication followed by one sum, not a matrix product of the patch and the kernel.`,
        seeAlso: [35, 41]
      },
      {
        id: 'convolution', term: 'Convolution (flipped kernel)', symbol: T`x*k`,
        plain: T`Mathematical convolution is cross-correlation with the kernel flipped end to end first (in 2D, flipped left–right and top–bottom). For symmetric kernels the two agree. Most deep-learning libraries call their unflipped cross-correlation “convolution”; that is harmless for learned weights but matters when you copy a kernel from one convention to the other.`,
        formula: T`x*k=\text{cross-correlation of }x\text{ with }k\text{ reversed}`,
        steps: [T`Reverse the kernel: \([1,-1]\) becomes \([-1,1]\).`, T`Cross-correlate with the reversed kernel.`, T`“Full” mode also counts the partial overlaps at both ends, giving \(n+k-1\) outputs.`],
        examples: [[T`row \([1,2,4]\), kernel \([1,-1]\), valid`, T`flipped \([-1,1]\): output \([1,2]\)`], [T`row \([1,3,2]\), kernel \([1,-1]\), valid`, T`\([2,-1]\)`], [T`row \([1,2,3]\), kernel \([1,1]\), full`, T`\([1,3,5,3]\)`], [T`symmetric kernel \([1,2,1]\)`, T`flipping changes nothing, so both operations agree`]],
        pitfall: T`Check which convention each tool uses before comparing results. A kernel such as \([1,-1]\) copied without flipping gives edge responses of the opposite sign.`,
        seeAlso: [35, 36, 41]
      },
      {
        id: 'weight-sharing', term: 'Weight sharing',
        plain: T`A convolutional layer uses the same kernel weights at every image position. It needs far fewer parameters than connecting every pixel to every output, and a pattern learned in one place can be found anywhere. During training, each shared weight’s gradient adds up the contributions from every position.`,
        steps: [T`Count the kernel’s weights: they are reused at every placement.`, T`Compare with a dense layer, which needs one weight for every input–output pair.`],
        examples: [[T`3×3 kernel on a 5×5 image (9 outputs)`, T`9 shared weights`], [T`dense map from those 25 pixels to 9 outputs`, T`\(25\times9=225\) weights`], [T`the same kernel on a 100×100 image`, T`still 9 weights`]],
        pitfall: T`Sharing weights does not by itself make a classifier ignore position: borders, stride, pooling and the final layers can all respond to where things are (Lesson 41).`,
        seeAlso: [35, 41]
      },
      {
        id: 'gaussian-kernel', term: 'Gaussian blur kernel (separable)', symbol: T`G(x,y)=g(x)\,g(y)`,
        plain: T`A Gaussian kernel blurs by weighting each neighbour with the bell-shaped Gaussian curve \(e^{-x^2/(2\sigma^2)}\): near pixels count most and \(\sigma\) sets the width. The 2D kernel is the product \(g(x)g(y)\), so you can blur every row and then every column with one short 1D kernel. Cut it off at a radius of about \(3\sigma\) and divide by the sum so that the weights add to 1.`,
        formula: T`g(x)=\frac{e^{-x^2/(2\sigma^2)}}{\sum_{x'=-r}^{r}e^{-x'^2/(2\sigma^2)}},\quad x=-r,\dots,r,\ \ r\approx3\sigma;\qquad G(x,y)=g(x)\,g(y)`,
        steps: [T`Choose \(\sigma\) and a radius \(r\approx3\sigma\), rounded up to a whole number.`, T`For \(x=-r,\dots,r\), compute \(e^{-x^2/(2\sigma^2)}\).`, T`Divide every value by their sum, so the weights add to 1 and brightness is kept.`, T`Blur each row with \(g\), then each column with \(g\): the same result as the 2D kernel \(G\).`],
        examples: [[T`\(\sigma=1,\ r=3\): raw values at \(x=0,1,2,3\)`, T`\(1,\ 0.607,\ 0.135,\ 0.011\); their sum over \(-3..3\) is \(\approx2.506\)`], [T`normalized`, T`\(\approx[0.004,\ 0.054,\ 0.242,\ 0.399,\ 0.242,\ 0.054,\ 0.004]\)`], [T`small kernel \(g=[0.25,0.5,0.25]\) (\(\sigma\approx0.71\))`, T`\(G=g\,g^T=\tfrac1{16}\begin{bmatrix}1&2&1\\2&4&2\\1&2&1\end{bmatrix}\)`], [T`7×7 kernel, cost per pixel`, T`49 multiplications directly, \(7+7=14\) separably`]],
        pitfall: T`Forgetting to normalize brightens or darkens the image. Cutting the kernel off well short of \(3\sigma\) gives a cruder, boxier blur.`,
        seeAlso: [36, 56]
      }
    ]
  });

  add(35, {
    builds: [{lesson: 34, why: 'each output is one placement of a sliding kernel'}, {lesson: 32, why: 'fan-in counts the inputs one output adds up'}],
    recall: ['cross-correlation', 'filter-kernel', 'weight-sharing', 'fan-in'],
    symbols: [
      ['n, k', 'n: input length along one axis; k: kernel length along that axis', 'convolution-output-size'],
      ['p, s', 'p: values added on each side; s: step between kernel positions', 'stride'],
      ['assumption', 'assumes dilation 1 (no gaps inside the kernel) and equal padding on both sides', 'convolution-output-size']
    ],
    terms: [
      {
        id: 'floor-function', term: 'Floor (round down)', symbol: T`\lfloor x\rfloor`,
        plain: T`The floor of a number is the largest whole number that is not bigger than it; for a positive number, just drop the fractional part. Shape formulas use it because a kernel that would only partly fit at the end is not counted.`,
        formula: T`\lfloor x\rfloor=\text{the largest whole number}\le x`,
        steps: [T`If \(x\) is already whole, \(\lfloor x\rfloor=x\).`, T`If it is positive, drop the digits after the decimal point.`, T`If it is negative, move down to the next whole number: \(\lfloor-1.2\rfloor=-2\).`],
        examples: [[T`\(\lfloor3.7\rfloor\)`, T`\(3\)`], [T`\(\lfloor3\rfloor\)`, T`\(3\)`], [T`\(\lfloor6/4\rfloor=\lfloor1.5\rfloor\)`, T`\(1\)`], [T`\(\lfloor-1.2\rfloor\)`, T`\(-2\)`]],
        pitfall: T`Floor is not ordinary rounding: \(\lfloor3.7\rfloor=3\), not 4. In Python use \(\texttt{math.floor}\) or integer division \(\texttt{//}\).`,
        seeAlso: [56]
      },
      {
        id: 'stride', term: 'Stride', symbol: T`s`,
        plain: T`The stride is how far the kernel jumps between neighbouring output positions. Stride 1 visits every position; stride 2 skips every other one, roughly halving the output size and the work, at the cost of spatial detail.`,
        steps: [T`List the starting positions \(0,\ s,\ 2s,\dots\)`, T`Stop at the last start where the whole kernel still fits inside the (padded) input.`, T`Count the starts: that is the output length.`],
        examples: [[T`\(n=7,\ k=3,\ s=2,\ p=0\)`, T`starts \(0,2,4\): 3 outputs`], [T`the same with \(p=1\) (padded length 9)`, T`starts \(0,2,4,6\): 4 outputs`], [T`\(n=32,\ k=3,\ p=1\), stride 1 or 2`, T`\(32\) or \(16\) outputs`]],
        pitfall: T`A larger stride does not let the kernel see more pixels at once; it only spaces the placements further apart, and small objects can fall between them.`,
        seeAlso: [41, 43, 56]
      },
      {
        id: 'convolution-output-size', term: 'Padding and the output size of a convolution', symbol: T`n_{\text{out}}=\left\lfloor\frac{n+2p-k}{s}\right\rfloor+1`,
        plain: T`Padding adds \(p\) extra values, usually zeros, to each end of an axis so the kernel can also sit on border pixels. The output size counts the kernel positions: the padded length minus the kernel length is how far the kernel can travel; divide by the stride, round down, and add one for the starting position. Apply it separately to height and width.`,
        formula: T`n_{\text{out}}=\left\lfloor\frac{n+2p-k}{s}\right\rfloor+1\qquad\text{(with dilation }d\text{, replace }k\text{ by }d(k-1)+1)`,
        steps: [T`Pad: the length becomes \(n+2p\). Zeros are usual; mirrored or wrapped-round values are alternatives.`, T`Subtract the kernel size \(k\).`, T`Divide by the stride \(s\) and take the floor.`, T`Add 1. At stride 1 an odd kernel keeps the size with \(p=(k-1)/2\) (“same” padding).`],
        examples: [[T`row \([1,2,3]\) padded with \(p=1\) zero`, T`\([0,1,2,3,0]\)`], [T`\(n=5,\ k=3,\ p=0,\ s=1\)`, T`\(\lfloor2/1\rfloor+1=3\)`], [T`\(n=7,\ k=3,\ p=1,\ s=2\)`, T`\(\lfloor6/2\rfloor+1=4\)`], [T`\(n=7,\ k=3,\ p=1,\ s=1\)`, T`\(\lfloor6/1\rfloor+1=7\): “same” padding keeps the size`]],
        pitfall: T`Border outputs see padded zeros rather than real image. “Same” padding can need unequal sides for even kernels or larger strides, so state the actual numbers. The formula is spatial only: the output channel count is the number of kernels.`,
        seeAlso: [36, 41, 56]
      },
      {
        id: 'channels', term: 'Channels and parameter count', symbol: T`(k_h,k_w,C_{\text{in}},C_{\text{out}})`,
        plain: T`Images and feature maps have a channel axis, such as red, green and blue. Each kernel covers a small spatial patch and every input channel, and produces one output channel, so a layer with \(C_{\text{out}}\) kernels outputs \(C_{\text{out}}\) channels. Its parameter count depends on kernel size and channels, not on the image size.`,
        formula: T`\text{parameters}=k_h\,k_w\,C_{\text{in}}\,C_{\text{out}}+C_{\text{out}}\quad\text{(one bias per output channel)}`,
        steps: [T`Multiply kernel height, kernel width and input channels: the weights in one kernel.`, T`Multiply by the number of kernels \(C_{\text{out}}\).`, T`Add one bias per kernel.`, T`The output shape is \((N,H_{\text{out}},W_{\text{out}},C_{\text{out}})\).`],
        examples: [[T`3×3, 3 channels in, 8 out`, T`\(3\cdot3\cdot3\cdot8+8=224\)`], [T`3×3, 4 channels in, 6 out`, T`\(3\cdot3\cdot4\cdot6+6=222\)`], [T`batch \((5,8,8,1)\), valid 3×3, 4 kernels`, T`output \((5,6,6,4)\)`]],
        pitfall: T`More channels give more kinds of feature, not a wider view: the channel count does not change the receptive field.`,
        seeAlso: [41, 55, 56]
      },
      {
        id: 'depthwise-separable-convolution', term: 'Grouped and depthwise-separable convolution', symbol: T`K^2C_{\text{in}}+C_{\text{in}}C_{\text{out}}`,
        plain: T`A standard layer connects every output channel to every input channel. A grouped convolution splits the channels into \(g\) groups and connects only within each group, dividing the weights by \(g\). With one group per channel it is depthwise: one \(K\times K\) filter per channel. Following that with a 1×1 convolution that mixes channels gives a depthwise-separable layer, far cheaper than a standard one.`,
        formula: T`\text{standard }K^2C_{\text{in}}C_{\text{out}},\qquad\text{grouped }K^2\tfrac{C_{\text{in}}}{g}C_{\text{out}},\qquad\text{depthwise-separable }K^2C_{\text{in}}+C_{\text{in}}C_{\text{out}}\quad\text{(weights, no biases)}`,
        steps: [T`Standard: multiply \(K\cdot K\cdot C_{\text{in}}\cdot C_{\text{out}}\).`, T`Grouped: divide that by the number of groups \(g\).`, T`Depthwise: \(K\cdot K\cdot C_{\text{in}}\), one small filter per input channel.`, T`Pointwise 1×1 mixing: \(C_{\text{in}}\cdot C_{\text{out}}\). Add it to the depthwise count.`],
        examples: [[T`\(K=3,\ C_{\text{in}}=32,\ C_{\text{out}}=64\), standard`, T`\(3\cdot3\cdot32\cdot64=18432\)`], [T`the same, grouped with \(g=4\)`, T`\(18432/4=4608\)`], [T`the same, depthwise-separable`, T`\(288+2048=2336\), about 7.9 times fewer`]],
        pitfall: T`Fewer weights does not always mean faster on real hardware, and in a grouped layer each output sees only its own group’s channels. Count the biases separately.`
      },
      {
        id: 'receptive-field', term: 'Receptive field', symbol: T`r_{\text{next}}=r+(k-1)j`,
        plain: T`The receptive field of an output is the patch of input pixels that can influence it. One 3×3 layer sees 3×3 pixels. Stacking layers widens it, and strides make later layers widen it faster, because their neighbouring positions lie further apart in the input (the jump \(j\)).`,
        formula: T`r_{\text{next}}=r+(k-1)\,j,\qquad j_{\text{next}}=j\,s,\qquad r=j=1\text{ at the input}`,
        steps: [T`Start at the input with \(r=1\) and \(j=1\).`, T`For each layer, add \((k-1)\times j\) to \(r\).`, T`Then multiply \(j\) by that layer’s stride.`],
        examples: [[T`two 3×3 layers, stride 1`, T`\(r=3\), then \(5\)`], [T`three 3×3 layers, stride 1`, T`\(r=3,\ 5,\ 7\)`], [T`3×3 at stride 2, then 3×3 at stride 1`, T`\(r=3\) with \(j=2\), then \(3+2\cdot2=7\)`]],
        pitfall: T`This is the region that can matter, not how much each pixel does matter: learned weights usually concentrate on the centre.`,
        seeAlso: [41, 56]
      }
    ]
  });

  add(36, {
    builds: [{lesson: 33, why: 'cosine waves, frequency and aliasing'}, {lesson: 34, why: 'filters are sliding weighted sums'}, {lesson: 4, why: 'the exponential e to a power, now an imaginary power'}],
    recall: ['cosine', 'sinusoid', 'natural-exponential', 'summation-notation', 'convolution'],
    symbols: [
      ['N', 'number of samples in the signal', 'discrete-fourier-transform'],
      ['k', 'frequency number: how many full cycles fit into the N samples', 'discrete-fourier-transform'],
      ['i', 'imaginary unit, with i² = −1 (here it is not an index)', 'complex-number']
    ],
    terms: [
      {
        id: 'complex-number', term: 'Complex numbers: modulus, argument and conjugate', symbol: T`z=a+bi,\ i^2=-1`,
        plain: T`A complex number \(z=a+bi\) pairs a real part \(a\) with an imaginary part \(b\), where \(i\) is a new number with \(i^2=-1\). Picture it as the point \((a,b)\). Its modulus \(|z|=\sqrt{a^2+b^2}\) is its distance from 0 (the magnitude) and its argument is its angle from the positive real axis (the phase). Multiplying complex numbers multiplies their moduli and adds their angles: it scales and rotates.`,
        formula: T`(a+bi)(c+di)=(ac-bd)+(ad+bc)i,\qquad|z|=\sqrt{a^2+b^2},\qquad\bar z=a-bi,\quad z\,\bar z=|z|^2`,
        steps: [T`Add: add the real parts and the imaginary parts separately.`, T`Multiply: expand the brackets as usual, then replace \(i^2\) by \(-1\).`, T`Modulus: \(\sqrt{a^2+b^2}\). Argument: the angle of the point \((a,b)\), measured anticlockwise from the positive real axis.`, T`Conjugate \(\bar z\): flip the sign of the imaginary part, a mirror image across the real axis.`],
        examples: [[T`\((1+2i)(3-i)\)`, T`\(3-i+6i-2i^2=5+5i\)`], [T`\(z=3+4i\)`, T`\(|z|=\sqrt{9+16}=5\), argument \(\approx53.1^\circ\)`], [T`\(\overline{3+4i}\), and \((3+4i)(3-4i)\)`, T`\(3-4i\), and \(9+16=25=|z|^2\)`], [T`\(i\,(1+i)\)`, T`\(-1+i\): turned \(90^\circ\) (from \(45^\circ\) to \(135^\circ\)), size \(\sqrt2\) unchanged`]],
        pitfall: T`The stored image never becomes complex. Complex numbers are bookkeeping that packs a wave’s strength and its shift into one number.`
      },
      {
        id: 'eulers-formula', term: 'Euler’s formula (the complex exponential)', symbol: T`e^{i\theta}=\cos\theta+i\sin\theta`,
        plain: T`Raising \(e\) to an imaginary power gives a point on the circle of radius 1: \(e^{i\theta}\) has real part \(\cos\theta\) and imaginary part \(\sin\theta\). As \(\theta\) grows the point spins round the circle, so \(e^{-2\pi ikn/N}\) is a compact way to write a cosine wave and a sine wave together.`,
        formula: T`e^{i\theta}=\cos\theta+i\sin\theta,\qquad|e^{i\theta}|=1,\qquad e^{i\alpha}e^{i\beta}=e^{i(\alpha+\beta)}`,
        steps: [T`Find \(\cos\theta\) and \(\sin\theta\), with the angle in radians.`, T`Write the result as \(\cos\theta+i\sin\theta\).`, T`A minus sign in the power spins the other way: \(e^{-i\theta}=\cos\theta-i\sin\theta\).`, T`Multiplying any complex number by \(e^{i\theta}\) turns it by \(\theta\) without changing its size.`],
        examples: [[T`\(\theta=0\)`, T`\(e^{0}=1\)`], [T`\(\theta=\pi/2\)`, T`\(i\)`], [T`\(\theta=\pi\)`, T`\(-1\)`], [T`\(e^{-2\pi in/4}\) for \(n=0,1,2,3\)`, T`\(1,\ -i,\ -1,\ i\): a quarter turn per step, clockwise`]],
        pitfall: T`\(e^{i\theta}\) never grows or shrinks; it only turns. Growth comes from a real power, as in Lesson 4.`
      },
      {
        id: 'discrete-fourier-transform', term: 'Discrete Fourier transform (DFT): magnitude and phase', symbol: T`X_k=\sum_{n=0}^{N-1}x_ne^{-2\pi ikn/N}`,
        plain: T`The DFT rewrites \(N\) samples as a sum of waves. Each output \(X_k\) measures how strongly the signal matches a wave that completes \(k\) cycles over the \(N\) samples: multiply by that wave and add up. \(X_0\) is the plain sum (the constant, or DC, part). Each \(X_k\) is complex: its magnitude says how strong that wave is, and its phase says where the wave’s peaks sit.`,
        formula: T`X_k=\sum_{n=0}^{N-1}x_n\,e^{-2\pi i\,kn/N},\qquad k=0,1,\dots,N-1`,
        steps: [T`For frequency \(k\), list the wave values \(e^{-2\pi ikn/N}\) for \(n=0,\dots,N-1\).`, T`Multiply each sample \(x_n\) by its wave value.`, T`Add the products to get \(X_k\). Repeat for every \(k\).`, T`Read off the magnitude \(|X_k|\) and the phase (argument) of each value.`, T`In practice call \(\texttt{np.fft.fft}\); the inverse transform rebuilds the samples, dividing by \(N\).`],
        examples: [[T`\([1,1,1,1]\)`, T`\([4,0,0,0]\): only the constant part`], [T`\([1,-1,1,-1]\)`, T`\([0,0,4,0]\): only the fastest wave, \(k=2\)`], [T`\(X_1\) of \([1,-1,1,-1]\), wave values \(1,-i,-1,i\)`, T`\(1+i-1-i=0\)`], [T`\([1,0,0,0]\) and the shifted \([0,1,0,0]\)`, T`\([1,1,1,1]\) and \([1,-i,-1,i]\): the same magnitudes, different phases`]],
        pitfall: T`Shifting a signal changes only the phases, so a magnitude plot alone cannot tell you where things are. For \(N\) samples the fastest distinct wave is \(k=N/2\).`
      },
      {
        id: 'fourier-transform-pairs', term: '2D DFT, symmetry and transform pairs', symbol: T`X_{k,l}`,
        plain: T`An image has a 2D DFT: one complex value for each pair of vertical and horizontal frequencies \((k,l)\). For a real image the spectrum is conjugate-symmetric, \(X_{N-k}=\overline{X_k}\), so half of it is redundant and the inverse is real. Known pairs: a Gaussian transforms to a Gaussian (wide in space means narrow in frequency), and a box transforms to a sinc, whose ripples cause ringing.`,
        formula: T`X_{k,l}=\sum_{m=0}^{M-1}\sum_{n=0}^{N-1}x_{m,n}\,e^{-2\pi i\,(km/M+ln/N)},\qquad X_{N-k}=\overline{X_k}\ \text{for real }x`,
        steps: [T`For a 2D DFT, take the 1D DFT of every row, then of every column of the result.`, T`For a real signal, bin \(N-k\) is the conjugate of bin \(k\); only about half the bins carry new information.`, T`Gaussian pair: blurring with a wider Gaussian keeps a narrower band of low frequencies, falling off smoothly.`, T`Box pair: the spectrum is a sinc, \(\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)\), which dips and rises again, so a box blur lets some high frequencies through and sharp cut-offs ring near edges.`],
        examples: [[T`\(\begin{bmatrix}1&-1\\1&-1\end{bmatrix}\) (alternates across each row)`, T`\(\begin{bmatrix}0&4\\0&0\end{bmatrix}\): only horizontal frequency 1`], [T`DFT of \([1,2,3,4]\)`, T`\([10,\ -2+2i,\ -2,\ -2-2i]\): \(X_3=\overline{X_1}\)`], [T`Gaussian kernels with \(\sigma=1\) and \(\sigma=2\), response at \(\omega=\pi/2\)`, T`\(\approx0.29\) and \(\approx0.007\): the wider blur keeps a narrower band`], [T`box \([1,1,1,0,0,0,0,0]/3\), magnitudes for \(k=0\) to \(4\)`, T`\(1,\ 0.80,\ 0.33,\ 0.14,\ 0.33\): they fall, then rise again (sinc ripples)`]],
        pitfall: T`A plotted 2D spectrum of a real image is mirror-symmetric, so it holds only half the information it seems to. An ideal sharp frequency cut-off is a sinc in space, so it rings too.`
      },
      {
        id: 'convolution-theorem', term: 'Convolution theorem and FFT padding', symbol: T`\operatorname{DFT}(x\circledast k)`,
        plain: T`Filtering in space equals multiplying in frequency: the DFT of a circular convolution is the entry-by-entry product of the two DFTs. “Circular” means the signal wraps round, so values at the end leak into the start. Pad both with zeros to at least \(N+K-1\) samples to get the ordinary (full, linear) convolution.`,
        formula: T`\operatorname{DFT}(x\circledast k)_m=\operatorname{DFT}(x)_m\,\operatorname{DFT}(k)_m,\qquad\text{pad to length}\ge N+K-1`,
        steps: [T`Pad the signal (length \(N\)) and the kernel (length \(K\)) with zeros to length \(N+K-1\) or more.`, T`Take both DFTs and multiply them entry by entry.`, T`Take the inverse DFT: the result equals the full convolution.`],
        examples: [[T`\(N=5,\ K=3\)`, T`pad to at least \(7\)`], [T`\([1,2,3]\) with \([1,1]\), padded to length 4`, T`\([1,3,5,3]\), the full convolution`], [T`the same without padding (length 3, circular)`, T`\([4,3,5]\): the final 3 wrapped onto the first 1`]],
        pitfall: T`Without enough padding the right edge of an image bleeds into the left edge. State the padding and the boundary rule whenever you filter with an FFT.`
      },
      {
        id: 'frequency-response', term: 'Frequency response: low-pass and high-pass', symbol: T`H(\omega)`,
        plain: T`A filter multiplies each frequency by its own factor, its frequency response \(H\). A smoothing (low-pass) kernel keeps the constant part, \(H=1\) at frequency 0, and weakens fast wiggles. A difference (high-pass) kernel, whose weights add up to zero, removes the constant part and keeps or boosts fast changes such as edges.`,
        formula: T`\text{kernel }(a,\,1-2a,\,a):\quad H(\omega)=1-2a+2a\cos\omega`,
        steps: [T`\(\omega\) is how far the wave turns per sample: \(\omega=0\) is a constant, \(\omega=\pi\) is the alternating \(1,-1,1,-1,\dots\)`, T`Feed in a constant: the output is the input times \(H(0)\), the sum of the weights.`, T`Feed in the alternating pattern: the output is the input times \(H(\pi)\).`, T`\(H(0)\) near 1 with \(H(\pi)\) near 0 means low-pass; the reverse means high-pass.`],
        examples: [[T`\((0.25,0.5,0.25)\)`, T`\(H(0)=1,\ H(\pi)=0\): keeps constants, removes alternation (low-pass)`], [T`\((0.2,0.6,0.2)\)`, T`\(H(\pi)=1-0.8=0.2\): alternation shrunk to a fifth`], [T`difference \([1,-1]\)`, T`\(|H(0)|=0,\ |H(\pi)|=2\): removes constants, doubles alternation (high-pass)`]],
        pitfall: T`Smoothing that removes noise also softens edges and can erase tiny objects. Check both the filtered image and the task metric.`
      }
    ]
  });

  /* ---------- Module 10: neural networks and backpropagation ---------- */

  add(37, {
    builds: [{lesson: 7, why: 'a layer is a matrix product plus a bias'}, {lesson: 27, why: 'softmax turns the final scores into probabilities'}, {lesson: 2, why: 'stacking layers is function composition'}],
    recall: ['affine-layer', 'matrix-multiplication', 'softmax', 'function-composition', 'nonlinear-function'],
    symbols: [
      ['h', 'hidden activations: the layer’s ReLU outputs, never negative', 'relu'],
      ['W, b', 'weights and bias of the affine step Wx + b, learned in training', 'forward-pass']
    ],
    terms: [
      {
        id: 'relu', term: 'ReLU (rectified linear unit)', symbol: T`\operatorname{ReLU}(z)=\max(0,z)`,
        plain: T`ReLU keeps a positive number and replaces a negative one by zero: it outputs the larger of 0 and its input. Applied to every entry after an affine step, it is the most common activation in vision networks. Its slope is 1 where the input is positive and 0 where it is negative.`,
        formula: T`\operatorname{ReLU}(z)=\max(0,z)=\begin{cases}z,&z>0\\0,&z\le0\end{cases}\qquad\operatorname{ReLU}'(z)=\begin{cases}1,&z>0\\0,&z<0\end{cases}`,
        steps: [T`Treat each entry separately.`, T`If it is positive, keep it; otherwise write 0.`, T`For the slope: 1 for a positive input, 0 for a negative one. At exactly 0 there is a corner, and software picks a convention (usually 0).`],
        examples: [[T`\(\operatorname{ReLU}(-2)\)`, T`\(0\)`], [T`\(\operatorname{ReLU}(3)\)`, T`\(3\)`], [T`\(\operatorname{ReLU}([-2,0,3])\)`, T`\([0,0,3]\)`], [T`\(\operatorname{ReLU}([-1,3])\)`, T`\([0,3]\): the first unit is switched off`]],
        plot: {fn: 'x => Math.max(0, x)', x: [-3, 3], y: [-1, 3], xLabel: 'z', yLabel: 'ReLU(z)', marks: [-2, 2]},
        pitfall: T`A unit whose input is negative for every example always outputs 0 and passes back zero gradient, so it stops learning (a “dead” ReLU).`,
        seeAlso: [38, 40, 41]
      },
      {
        id: 'activation-function', term: 'Activation function: why layers need a nonlinearity', symbol: T`h=\phi(Wx+b)`,
        plain: T`A nonlinear function, such as ReLU or sigmoid, applied entry by entry to a layer’s affine output. Without it, stacking layers gains nothing: an affine map of an affine map is still one affine map, so ten layers could do no more than one. The activation lets different inputs use different pieces, which builds bent decision boundaries.`,
        formula: T`B(Ax+b)+c=(BA)x+(Bb+c)\qquad\text{(no activation: still one affine map)}`,
        steps: [T`Compute the affine part \(z=Wx+b\), the pre-activation.`, T`Apply the activation \(\phi\) to each entry: \(h=\phi(z)\).`, T`Feed \(h\) to the next layer.`, T`To see why it matters, compose two affine maps without it and simplify: one affine map remains.`],
        examples: [[T`\(y=2x+1\), then \(z=3y-4\)`, T`\(z=6x-1\): a single straight line`], [T`at \(x=-1\), no activation`, T`\(z=6(-1)-1=-7\)`], [T`at \(x=-1\) with ReLU between: \(z=3\operatorname{ReLU}(2x+1)-4\)`, T`\(3\cdot0-4=-4\): no longer that line`], [T`sigmoid as the activation, at \(z=0\)`, T`\(\sigma(0)=0.5\)`]],
        pitfall: T`“Linear” and “affine” differ: \(Wx\) is linear, \(Wx+b\) is affine. Either way, without a nonlinear activation in between, extra depth adds parameters but no expressive power.`,
        seeAlso: [38, 39, 41]
      },
      {
        id: 'forward-pass', term: 'Forward pass of a two-layer network', symbol: T`Z_2=\operatorname{ReLU}(XW_1+b_1)W_2+b_2`,
        plain: T`The forward pass runs the inputs through the network to get scores. A batch \(X\) of shape \((N,D)\) goes through an affine layer to \(H\) hidden units, then ReLU, then a second affine layer to \(C\) class scores (logits). Softmax turns each row into probabilities. Writing the shape next to every array catches most mistakes.`,
        formula: T`Z_1=XW_1+b_1,\quad A_1=\operatorname{ReLU}(Z_1),\quad Z_2=A_1W_2+b_2,\quad P=\operatorname{softmax}(Z_2)`,
        steps: [T`Multiply the input rows by \(W_1\) and add \(b_1\) to every row.`, T`Apply ReLU entry by entry.`, T`Multiply by \(W_2\) and add \(b_2\) to get the logits.`, T`Subtract each row’s largest logit, then apply softmax.`],
        examples: [[T`\(x=[1,2],\ W_1=\begin{bmatrix}1&-1\\1&1\end{bmatrix},\ b_1=0\)`, T`\(z_1=[3,1],\ a_1=[3,1]\)`], [T`then \(W_2=\begin{bmatrix}1&-1\\2&1\end{bmatrix},\ b_2=0\)`, T`logits \([5,-2]\), shifted \([0,-7]\), \(p\approx[0.999,\ 0.001]\)`], [T`\(x=[-2,1]\), same \(W_1\)`, T`\(z_1=[-1,3]\), \(a_1=[0,3]\)`], [T`\(X:(12,8)\), 5 hidden units, 3 classes`, T`\(W_1:(8,5),\ A_1:(12,5),\ W_2:(5,3),\ Z_2:(12,3)\)`]],
        pitfall: T`Keep the pre-activation \(Z_1\) as well as \(A_1\): the backward pass needs the signs of \(Z_1\) to know which units were active.`,
        seeAlso: [38, 40, 41]
      },
      {
        id: 'linear-separability', term: 'Linear decision boundary and XOR', symbol: T`w^Tx+b=0`,
        plain: T`A linear classifier splits the inputs with a straight line (or a flat plane): one side is class 1, the other class 0. Some label patterns cannot be split that way. In XOR the corners \((0,1)\) and \((1,0)\) are class 1 while \((0,0)\) and \((1,1)\) are class 0; no single line separates them, but one hidden ReLU layer can.`,
        steps: [T`Plot the points with their labels.`, T`Try to draw one straight line with every class-1 point on one side: for XOR it cannot be done.`, T`Add hidden ReLU units, compute their outputs at each point, and combine them.`],
        examples: [[T`\(h_1=\operatorname{ReLU}(x_1+x_2),\ h_2=\operatorname{ReLU}(x_1+x_2-1)\), output \(h_1-2h_2\)`, T`at \((0,0)\): \(0-0=0\)`], [T`at \((0,1)\) or \((1,0)\)`, T`\(1-0=1\)`], [T`at \((1,1)\)`, T`\(2-2\cdot1=0\)`]],
        pitfall: T`Being able to represent XOR does not mean training will find these weights, and more capacity does not guarantee better test accuracy. Keep a linear baseline for comparison.`,
        seeAlso: [38]
      }
    ]
  });

  add(38, {
    builds: [{lesson: 19, why: 'backpropagation runs the chain rule backwards through a graph'}, {lesson: 27, why: 'P − Y is the softmax cross-entropy gradient'}, {lesson: 37, why: 'the forward pass whose saved values are reused'}],
    recall: ['backpropagation', 'chain-rule', 'outer-product', 'relu', 'forward-pass'],
    symbols: [
      ['z', 'hidden pre-activation w₁x + b₁ in the scalar example'],
      ['1z>0', 'ReLU slope: 1 where z > 0 and 0 where z < 0', 'relu-derivative-mask'],
      ['ŷ', 'prediction: w₂ × ReLU(z)']
    ],
    terms: [
      {
        id: 'backward-pass', term: 'Backward pass of a two-layer network', symbol: T`dW_2=A_1^TG_2`,
        plain: T`Backpropagation for the two-layer network, layer by layer. Start from the loss gradient with respect to the logits, \(G_2=(P-Y)/N\). Each affine layer turns the gradient of its output into gradients for its weights, its bias and its input; the ReLU layer lets the gradient through only where a unit was active.`,
        formula: T`\begin{aligned}G_2&=\tfrac1N(P-Y) & dA_1&=G_2W_2^T\\ dW_2&=A_1^TG_2 & dZ_1&=dA_1\odot\mathbf 1_{Z_1>0}\\ db_2&=\textstyle\sum_i(G_2)_{i,:} & dW_1&=X^TdZ_1,\ \ db_1=\textstyle\sum_i(dZ_1)_{i,:}\end{aligned}`,
        steps: [T`Output: \(G_2=(P-Y)/N\), the softmax cross-entropy gradient of a mean loss.`, T`Last layer: \(dW_2=A_1^TG_2\); \(db_2\) adds up the rows of \(G_2\).`, T`Pass it back: \(dA_1=G_2W_2^T\), then zero the entries of inactive units to get \(dZ_1\).`, T`First layer: \(dW_1=X^TdZ_1\); \(db_1\) adds up the rows of \(dZ_1\). Only then update any weight.`],
        examples: [[T`\(p=[0.75,0.25]\), true class 0, \(N=1\)`, T`\(G_2=[-0.25,\ 0.25]\)`], [T`\(a_1=[2,0]\)`, T`\(dW_2=\begin{bmatrix}-0.5&0.5\\0&0\end{bmatrix},\ db_2=[-0.25,\ 0.25]\)`], [T`\(W_2=\begin{bmatrix}\ln3/2&0\\2&1\end{bmatrix}\)`, T`\(dA_1=G_2W_2^T=[-\ln3/8,\ -0.25]\approx[-0.137,\ -0.25]\)`], [T`scalar: \(x=2,\ w_1=0.5,\ b_1=0,\ w_2=1\), target 3`, T`\(z=h=\hat y=1\); \(\partial L/\partial w_1=(1-3)\cdot1\cdot1\cdot2=-4\)`]],
        pitfall: T`Compute every gradient with the forward-pass weights before changing any of them; updating \(W_2\) first would differentiate a different network. Divide by \(N\) once only.`,
        seeAlso: [40, 41, 53]
      },
      {
        id: 'relu-derivative-mask', term: 'ReLU gradient mask (indicator)', symbol: T`\mathbf 1_{z>0}`,
        plain: T`The indicator \(\mathbf 1_{z>0}\) equals 1 when \(z>0\) and 0 otherwise. It is ReLU’s slope, so going backward through a ReLU layer multiplies the incoming gradient entry by entry (written \(\odot\)) by this mask: active units pass their gradient on unchanged, inactive units pass nothing.`,
        formula: T`dZ_1=dA_1\odot\mathbf 1_{Z_1>0},\qquad\mathbf 1_{z>0}=\begin{cases}1,&z>0\\0,&z\le0\end{cases}`,
        steps: [T`Look at the saved pre-activation \(Z_1\), entry by entry.`, T`Write 1 where it is positive and 0 elsewhere: that is the mask.`, T`Multiply each entry of the incoming gradient by the matching mask entry.`],
        examples: [[T`\(dA_1=[2,-3],\ Z_1=[-1,4]\)`, T`mask \([0,1]\), so \(dZ_1=[0,-3]\)`], [T`\(Z_1=[2,-1],\ dA_1\approx[-0.137,-0.25]\)`, T`mask \([1,0]\), so \(dZ_1\approx[-0.137,\ 0]\)`], [T`scalar example with \(w_1=-0.5\) instead`, T`\(z=-1\), mask 0: \(\partial L/\partial w_1=0\) although the loss is \(4.5\)`]],
        pitfall: T`A zero gradient here does not mean the prediction is good; this path is simply switched off for this example. \(\odot\) is entry-by-entry multiplication, not a matrix product.`,
        seeAlso: [40]
      },
      {
        id: 'gradient-shape-rule', term: 'A gradient has the shape of its parameter', symbol: T`\operatorname{shape}(dW)=\operatorname{shape}(W)`,
        plain: T`The gradient of a scalar loss with respect to an array is an array of the same shape: one sensitivity per entry. That tells you where the transposes go. \(dW_2\) must be \((H,C)\) like \(W_2\), and the only product of \(A_1:(N,H)\) and \(G_2:(N,C)\) with that shape is \(A_1^TG_2\), which also adds up the contributions of all \(N\) examples.`,
        steps: [T`Write down the shape of every array in the forward pass.`, T`For each gradient, find the product of available arrays whose shape matches the target; inner dimensions must agree.`, T`A bias shared by every row gets the sum of the rows of its output gradient.`],
        examples: [[T`\(A_1:(N,H),\ G_2:(N,C)\)`, T`\(dW_2=A_1^TG_2:(H,C)\)`], [T`\(G_2:(N,C),\ W_2:(H,C)\)`, T`\(dA_1=G_2W_2^T:(N,H)\)`], [T`\(X:(7,4),\ dZ_1:(7,6)\)`, T`\(dW_1=X^TdZ_1:(4,6)\)`], [T`hidden row \([1,3]\), \(G_2=[0.2,-0.2]\)`, T`\(dW_2=\begin{bmatrix}0.2&-0.2\\0.6&-0.6\end{bmatrix}\)`]],
        pitfall: T`Shapes can match by accident when two dimensions are equal (for example \(N=H\)). Check one entry by hand on a tiny example too.`,
        seeAlso: [40, 53]
      }
    ]
  });

  add(39, {
    builds: [{lesson: 12, why: 'a squared-weight penalty trades fit for smaller weights'}, {lesson: 27, why: 'log-sum-exp keeps softmax cross-entropy finite'}, {lesson: 23, why: 'normalizing uses a mean and a variance'}],
    recall: ['log-sum-exp', 'regularization', 'frobenius-norm', 'expected-value', 'variance'],
    symbols: [
      ['m', 'the largest score, subtracted from every score before exponentiating', 'floating-point-overflow'],
      ['z', 'the raw scores (logits) before softmax']
    ],
    terms: [
      {
        id: 'weight-decay', term: 'Squared-weight penalty (weight decay)', symbol: T`\tfrac\lambda2\|W\|_F^2`,
        plain: T`Adding \(\frac\lambda2\|W\|_F^2\), half of \(\lambda\) times the sum of all the squared weights, to the loss discourages large weights. Its gradient is simply \(\lambda W\), so every gradient step also shrinks each weight a little towards zero; that is why it is called weight decay.`,
        formula: T`L=L_{\text{data}}+\frac\lambda2\|W\|_F^2\ \Rightarrow\ \nabla_WL=\nabla_WL_{\text{data}}+\lambda W`,
        steps: [T`Square every weight in the penalized blocks, add them up and multiply by \(\lambda/2\).`, T`Its gradient: multiply each weight by \(\lambda\).`, T`Add that to the data gradient before the update.`],
        examples: [[T`\(w=2\), data gradient \(0.5\), \(\lambda=0.2\)`, T`total gradient \(0.5+0.2\cdot2=0.9\)`], [T`then one SGD step with \(\alpha=0.1\)`, T`\(w=2-0.1(0.9)=1.91\)`], [T`same, but the penalty \(\lambda w^2\) without the \(\tfrac12\)`, T`gradient \(0.5+2\lambda w=1.3\)`], [T`\(W=\begin{bmatrix}1&-2\\0&3\end{bmatrix},\ \lambda=0.1\)`, T`penalty \(0.05\times14=0.7\); gradient \(\begin{bmatrix}0.1&-0.2\\0&0.3\end{bmatrix}\)`]],
        pitfall: T`Whether the \(\tfrac12\) is included, and whether biases are penalized, are choices to state. With Adam, decoupled weight decay (AdamW, Lesson 30) is a different update.`
      },
      {
        id: 'dropout', term: 'Dropout (inverted)', symbol: T`m\odot a/q`,
        plain: T`During training, dropout switches activations off at random: each one is kept with probability \(q\) (its mask entry is 1) and set to 0 otherwise. Kept values are divided by \(q\), so the average activation is unchanged. At evaluation the mask is removed and the activations are used as they are.`,
        formula: T`a_{\text{drop}}=\frac{m\odot a}{q},\qquad m_j=\begin{cases}1&\text{with probability }q\\0&\text{otherwise}\end{cases},\qquad\mathbb E[a_{\text{drop}}]=a`,
        steps: [T`Draw a random 0/1 mask, each entry 1 with probability \(q\), the keep probability.`, T`Multiply the activations by the mask entry by entry.`, T`Divide by \(q\).`, T`At evaluation, and during a gradient check, switch dropout off.`],
        examples: [[T`\(q=0.5\), activation \(3\)`, T`kept: \(6\); dropped: \(0\); average \(0.5\cdot6=3\)`], [T`\(q=0.25\), activation \(2\)`, T`kept: \(8\)`], [T`\(q=0.8,\ a=[1,2,3,4]\), mask \([1,0,1,1]\)`, T`\([1.25,\ 0,\ 3.75,\ 5]\)`]],
        pitfall: T`Some papers quote the drop probability \(1-q\) instead of the keep probability. Forgetting to switch dropout off at evaluation makes predictions random.`
      },
      {
        id: 'batch-normalization', term: 'Batch normalization', symbol: T`\gamma\frac{a-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta`,
        plain: T`Batch normalization standardizes each feature using the mean and variance over the current batch: subtract the mean, then divide by the standard deviation. A learned scale \(\gamma\) and shift \(\beta\) then let the network choose the final spread. At evaluation it uses stored running averages of the statistics instead of the batch’s own.`,
        formula: T`\hat a=\frac{a-\mu}{\sqrt{\sigma^2+\epsilon}},\qquad\text{output}=\gamma\hat a+\beta`,
        steps: [T`For one feature, compute the batch mean \(\mu\) and variance \(\sigma^2\).`, T`Subtract \(\mu\) and divide by \(\sqrt{\sigma^2+\epsilon}\); the tiny \(\epsilon\) avoids division by zero.`, T`Multiply by \(\gamma\) and add \(\beta\).`, T`In evaluation mode, use the stored running mean and variance instead.`],
        examples: [[T`values \([1,3]\)`, T`\(\mu=2,\ \sigma^2=1\): normalized \([-1,1]\)`], [T`then \(\gamma=2,\ \beta=0.5\)`, T`\([-1.5,\ 2.5]\)`], [T`values \([2,4,6]\)`, T`\(\mu=4,\ \sigma^2=8/3\): \(\approx[-1.225,\ 0,\ 1.225]\)`], [T`\([1,3]\) with \(\epsilon=10^{-5}\)`, T`\(\approx[-0.999995,\ 0.999995]\)`]],
        pitfall: T`The output depends on which other examples share the batch, and tiny batches give noisy statistics. Training and evaluation modes compute different things, so state which one you used.`
      },
      {
        id: 'layer-normalization', term: 'Layer normalization', symbol: T`\mu,\ \sigma^2\ \text{per example}`,
        plain: T`The same formula as batch normalization, but the mean and variance are taken over the features of one example instead of over the batch. Each example is normalized on its own, so the result does not depend on batch size or on the other examples, and training and evaluation behave the same way.`,
        steps: [T`Take one example’s feature values.`, T`Compute their mean and variance.`, T`Normalize, then apply the learned \(\gamma\) and \(\beta\) as before.`],
        examples: [[T`rows \([1,2,3]\) and \([2,4,9]\), batch norm (down each column)`, T`every column becomes \([-1,1]\)`], [T`the same rows, layer norm (along each row)`, T`row 1 \(\approx[-1.225,0,1.225]\); row 2 \(\approx[-1.019,-0.340,1.359]\)`]],
        pitfall: T`Always name the averaging axes. “Normalize” can mean batch norm, layer norm or input standardization, and these are different computations.`,
        seeAlso: [55]
      },
      {
        id: 'floating-point-overflow', term: 'Overflow, underflow and the max-shift trick', symbol: T`e^{710}\to\infty`,
        plain: T`Computers store numbers in a limited range. In standard 64-bit floating point, \(e^{x}\) becomes infinity once \(x\) passes about 709 (overflow), and \(e^{-1000}\) rounds to exactly 0 (underflow), whose log is \(-\infty\). Stable formulas rearrange the same maths to avoid these extremes, for example by subtracting the largest score before exponentiating.`,
        formula: T`\log\sum_ie^{z_i}=m+\log\sum_ie^{z_i-m},\qquad m=\text{the largest }z_i`,
        steps: [T`Find the largest score \(m\).`, T`Subtract it from every score, so the largest becomes 0 and no exponential exceeds 1.`, T`Compute \(\log\sum_i e^{z_i-m}\) and add \(m\) back.`],
        examples: [[T`\(e^{709}\) and \(e^{710}\)`, T`\(\approx8.2\times10^{307}\) and \(\infty\)`], [T`naive \(\log(e^{1000}+e^{1001})\)`, T`\(\log\infty=\infty\)`], [T`stable: \(1001+\log(e^{-1}+1)\)`, T`\(\approx1001.313\)`], [T`softmax of \([1000,1001]\) computed from \([-1,0]\)`, T`\(\approx[0.269,\ 0.731]\)`]],
        pitfall: T`32-bit floats, common on GPUs, overflow much earlier: \(e^{89}\) is already infinite. A NaN loss is often an overflow followed by \(\infty-\infty\) or \(0\times\infty\).`
      },
      {
        id: 'stable-binary-cross-entropy', term: 'Stable binary cross-entropy from logits', symbol: T`\max(z,0)-yz+\ln(1+e^{-|z|})`,
        plain: T`Binary cross-entropy can be computed straight from the logit \(z\) without forming the probability \(p=\sigma(z)\) first. The rearranged formula gives exactly the same value, but it never exponentiates a large positive number and never takes the log of a probability that has rounded to 0 or 1.`,
        formula: T`-\bigl[y\ln\sigma(z)+(1-y)\ln(1-\sigma(z))\bigr]=\max(z,0)-yz+\ln\bigl(1+e^{-|z|}\bigr)`,
        steps: [T`Compute \(\max(z,0)\): \(z\) if it is positive, otherwise 0.`, T`Subtract \(y\times z\).`, T`Add \(\ln(1+e^{-|z|})\). Since \(-|z|\le0\), this exponential is at most 1.`],
        examples: [[T`\(z=2,\ y=1\)`, T`\(2-2+\ln(1+e^{-2})\approx0.127\), equal to \(-\ln\sigma(2)\)`], [T`\(z=0,\ y=1\)`, T`\(\ln2\approx0.693\)`], [T`\(z=-3,\ y=0\)`, T`\(\ln(1+e^{-3})\approx0.049\)`], [T`\(z=40,\ y=0\)`, T`\(40\); the naive route rounds \(\sigma(40)\) to 1 and returns \(-\ln0=\infty\)`]],
        pitfall: T`Clipping probabilities to a range such as \([10^{-7},\ 1-10^{-7}]\) hides the problem and distorts the gradient. Use the logit form, which libraries call “with logits”.`
      }
    ]
  });

  add(40, {
    builds: [{lesson: 19, why: 'autograd runs backpropagation on a recorded graph'}, {lesson: 20, why: 'central differences give an independent check'}, {lesson: 38, why: 'your hand-derived gradients to compare against'}],
    recall: ['computational-graph', 'central-difference', 'gradient-check', 'backward-pass', 'argmax'],
    symbols: [
      ['ei', 'the direction that changes parameter i alone: 1 in place i, 0 elsewhere'],
      ['h', 'the small step in the finite difference, such as 0.001']
    ],
    terms: [
      {
        id: 'automatic-differentiation', term: 'Automatic differentiation (autograd)', symbol: T`\texttt{loss.backward()}`,
        plain: T`Autograd records every operation as your code computes the loss, building a computational graph. Calling backward on the scalar loss applies the chain rule through that graph in reverse and fills in the gradient of every parameter that asked for one. It differentiates exactly the computation you ran, right or wrong.`,
        steps: [T`Create the parameters as tensors that require gradients.`, T`Run the forward computation to a single scalar loss.`, T`Call \(\texttt{backward()}\) and read each parameter’s \(\texttt{.grad}\).`, T`Compare with your hand derivation on the same numbers, forward values first.`],
        examples: [[T`\(z=wx+b,\ L=\tfrac12(z-y)^2\), with \(x=2,\ w=3,\ b=1,\ y=5\)`, T`\(z=7,\ L=2,\ \partial L/\partial z=z-y=2\)`], [T`its parameter gradients`, T`\(\partial L/\partial w=2x=4,\ \partial L/\partial b=2\)`], [T`\(x=3,\ w=2,\ b=0,\ y=4\)`, T`\(z=6\); \(\partial L/\partial w=6,\ \partial L/\partial b=2\)`]],
        pitfall: T`Turning a tensor into a plain Python number or a detached array cuts the graph, so later operations get no gradient. Autograd cannot tell you whether the loss itself is the right one.`,
        seeAlso: [41, 53]
      },
      {
        id: 'gradient-accumulation', term: 'Gradient accumulation and resetting', symbol: T`\texttt{.grad}\ \mathrel{+}=`,
        plain: T`Most frameworks add each new gradient to whatever is already stored in a parameter’s \(\texttt{.grad}\) instead of overwriting it. That lets several backward calls combine, but if you forget to reset the stored gradient to zero before the next step, old gradients leak into the new update.`,
        steps: [T`Before each training step, reset every \(\texttt{.grad}\) to zero (for example with \(\texttt{optimizer.zero\_grad()}\)).`, T`Run the forward pass and one backward call.`, T`Update the parameters.`],
        examples: [[T`\(\partial L/\partial w=4\), backward called once`, T`\(\texttt{w.grad}=4\)`], [T`backward called twice without resetting`, T`\(\texttt{w.grad}=8\)`], [T`two equal-sized batches accumulated, then divided by 2`, T`the same gradient as one batch twice the size`]],
        pitfall: T`A gradient check that calls backward repeatedly sees doubled or tripled values unless the gradients are reset between calls.`
      },
      {
        id: 'surrogate-loss', term: 'Surrogate loss: train on cross-entropy, report accuracy', symbol: T`L_{\text{CE}}\ \text{instead of accuracy}`,
        plain: T`Accuracy counts how often the argmax of the scores is the true class. Nudging the scores rarely flips an argmax, so accuracy stays flat and then jumps: its gradient is zero almost everywhere. Training therefore minimizes a smooth stand-in (a surrogate) such as cross-entropy, which changes whenever the scores change, and reports accuracy afterwards.`,
        steps: [T`Find the predicted class with argmax and compare it with the label: each example scores 1 or 0.`, T`Change a score slightly and recompute: accuracy usually does not move.`, T`Compute cross-entropy before and after: it moves, and its gradient says which way to go.`],
        examples: [[T`scores \([1,\ 0.5]\to[1,\ 0.6]\), true class 0`, T`accuracy \(1\to1\); cross-entropy \(0.474\to0.513\)`], [T`scores \([1,\ 0.9]\to[1,\ 1.1]\), true class 0`, T`accuracy jumps \(1\to0\) as the scores cross; cross-entropy changes smoothly, \(0.644\to0.744\)`]],
        pitfall: T`A lower cross-entropy usually, but not always, goes with higher accuracy. Evaluate the metric you care about on held-out data.`,
        seeAlso: [41, 43]
      }
    ]
  });

  /* ---------- Module 11: recognition, detection and segmentation ---------- */

  add(41, {
    builds: [{lesson: 35, why: 'shapes and parameter counts of convolution layers'}, {lesson: 38, why: 'gradients flow back through the head and the kernels'}, {lesson: 25, why: 'the predicted class is the argmax of the scores'}],
    recall: ['argmax', 'weight-sharing', 'channels', 'convolution-output-size', 'softmax'],
    symbols: [
      ['zc', 'score for class c: one number per class from the network’s head'],
      ['arg max', 'the class whose score is largest (its index, not the score)']
    ],
    terms: [
      {
        id: 'inductive-bias', term: 'Inductive bias',
        plain: T`The assumptions built into a model before it sees any data. A CNN assumes that useful patterns are local and can appear anywhere, so it uses small shared kernels. Such assumptions shrink the set of functions the model can learn: that saves parameters and data when they match the task, and hurts when they do not.`,
        steps: [T`List what the architecture forces: local patches, the same weights at every position, a fixed sequence of layers.`, T`Count the parameters it needs compared with a model without those assumptions.`, T`Ask whether the task really has that structure.`],
        examples: [[T`3×3 convolution, 1 → 4 channels, on an 8×8 image`, T`\(3\cdot3\cdot1\cdot4+4=40\) parameters`], [T`dense layer giving the same \(6\cdot6\cdot4=144\) outputs from the 64 pixels`, T`\(64\cdot144+144=9360\) parameters`]],
        pitfall: T`An inductive bias is a preference, not a guarantee: a CNN can still fail on a task, and a model with weaker assumptions can win when data are plentiful.`,
        seeAlso: [55]
      },
      {
        id: 'flatten', term: 'Flattening and the dense classification head', symbol: T`(N,6,6,4)\to(N,144)`,
        plain: T`To classify, the stack of feature maps is unrolled into one long vector per image (flattening reads every value in a fixed order) and fed to an ordinary affine layer that outputs one score per class. Track the shape at every step and count the parameters layer by layer.`,
        steps: [T`Find the shape after the convolution, for example with the output-size formula.`, T`Flatten: multiply height × width × channels to get the vector length.`, T`Head parameters: vector length × classes + classes (the biases).`, T`Add the layers’ counts for the total.`],
        examples: [[T`\(X:(N,8,8,1)\), valid 3×3, 4 kernels`, T`\((N,6,6,4)\); ReLU keeps the shape`], [T`flatten`, T`\(6\cdot6\cdot4=144\), shape \((N,144)\)`], [T`two-class head \(W:(144,2),\ b:(2,)\)`, T`\(144\cdot2+2=290\) parameters`], [T`whole network`, T`\(40+290=330\) parameters`]],
        pitfall: T`Each head weight is tied to one position of the flattened map, so the head is not translation invariant even though the convolution shares its weights.`,
        seeAlso: [55]
      },
      {
        id: 'translation-equivariance', term: 'Translation equivariance and invariance', symbol: T`f(\operatorname{shift}x)=\operatorname{shift}f(x)`,
        plain: T`A map is translation-equivariant if shifting the input shifts the output by the same amount; an interior convolution is, because it uses the same kernel everywhere. It is invariant if shifting the input leaves the output unchanged, as a sum or maximum over all positions does. A classifier wants invariance; a detector or segmenter must keep track of where things are.`,
        steps: [T`Compute the output for the input.`, T`Shift the input and compute again.`, T`If the output moved by the same shift, the map is equivariant; if it did not change at all, it is invariant.`],
        examples: [[T`\(x=[0,1,0,0]\), kernel \([1,-1]\), valid`, T`\([-1,1,0]\)`], [T`shifted input \([0,0,1,0]\)`, T`\([0,-1,1]\): the output shifts too (equivariant)`], [T`the maximum over each output`, T`\(1\) both times: unchanged (invariant)`]],
        pitfall: T`Borders, padding and stride break exact equivariance, and a flattened dense head is neither equivariant nor invariant. Test the shift you care about.`,
        seeAlso: [55]
      },
      {
        id: 'pooling', term: 'Pooling (max and average), forward and backward', symbol: T`\max_{\text{window}}`,
        plain: T`Pooling shrinks a feature map by summarizing each window, typically 2×2 with stride 2: max pooling keeps the largest value and average pooling the mean. Going backward, max pooling sends the whole incoming gradient to the position that won (its argmax) and zero to the others; average pooling shares it equally among the window’s entries.`,
        steps: [T`Forward: split the map into windows and take each window’s maximum or mean.`, T`Max backward: give the window’s incoming gradient to the winning position; the others get 0. Remember which one won.`, T`Average backward: give every position the incoming gradient divided by the window size.`, T`Global average pooling averages each whole channel to a single number.`],
        examples: [[T`window \(\begin{bmatrix}1&3\\2&0\end{bmatrix}\)`, T`max \(3\); average \(1.5\)`], [T`incoming gradient 1, max pooling`, T`\(\begin{bmatrix}0&1\\0&0\end{bmatrix}\)`], [T`incoming gradient 1, average pooling`, T`\(\begin{bmatrix}0.25&0.25\\0.25&0.25\end{bmatrix}\)`], [T`4×4 map, 2×2 windows, stride 2`, T`a 2×2 map`]],
        pitfall: T`Pooling makes small shifts matter less but discards exact positions, which localization needs. Ties in max pooling need a convention for where the gradient goes.`
      },
      {
        id: 'data-augmentation', term: 'Data augmentation (label-preserving)', symbol: T`(T(x),\ y)`,
        plain: T`Augmentation trains on transformed copies of the images, such as flips, crops or brightness changes, to teach robustness to those changes. It is valid only if the label stays correct, or is transformed consistently: a box or a mask must move with the image. It encodes an assumption about the task.`,
        steps: [T`Choose a transformation \(T\) and apply it to a training image.`, T`Check that the original label is still true for the transformed image.`, T`Apply the same geometric change to boxes and masks.`, T`Measure the effect against a run without it, using the same split and budget.`],
        examples: [[T`brightness ×1.5 on \([20,60,100,140]\)`, T`\([30,90,150,210]\)`], [T`brightness ×2`, T`\([40,120,200,255]\): the 280 is clipped to 255`], [T`horizontal flip of box \([x_1,y_1,x_2,y_2]=[2,3,5,7]\), image width \(W=10\)`, T`\([W-x_2,\ y_1,\ W-x_1,\ y_2]=[5,3,8,7]\)`], [T`flip an image of the arrow “→” labelled “right”`, T`it shows “←”: the label is no longer valid`]],
        pitfall: T`Augment only the training data, and never let an augmented copy of one image land in another split. More augmentation is not automatically better.`,
        seeAlso: [43, 46]
      }
    ]
  });

  add(42, {
    builds: [{lesson: 33, why: 'pixel coordinates: edges versus centres'}, {lesson: 41, why: 'a detector extends a CNN classifier'}, {lesson: 3, why: 'a loss built from residuals'}],
    recall: ['pixel-coordinates', 'set-notation', 'absolute-value', 'l1-norm', 'residual'],
    symbols: [
      ['A, B', 'the target box and the predicted box', 'bounding-box'],
      ['|·|', 'area, measured in one consistent coordinate convention', 'intersection-over-union']
    ],
    terms: [
      {
        id: 'bounding-box', term: 'Bounding box', symbol: T`[x_1,y_1,x_2,y_2]`,
        plain: T`A detection says where an object is with an axis-aligned rectangle. In corner format \([x_1,y_1,x_2,y_2]\) the top-left and bottom-right corners are given in continuous edge coordinates, so the width is \(x_2-x_1\), the height \(y_2-y_1\) and the area their product. Detectors often predict the centre, width and height instead.`,
        formula: T`\text{area}=(x_2-x_1)(y_2-y_1),\qquad x_1=c_x-\tfrac w2,\quad x_2=c_x+\tfrac w2,\quad y_1=c_y-\tfrac h2,\quad y_2=c_y+\tfrac h2`,
        steps: [T`Check that \(x_2\ge x_1\) and \(y_2\ge y_1\).`, T`Width \(x_2-x_1\), height \(y_2-y_1\), area = width × height.`, T`From centre format: subtract and add half the width and half the height.`],
        examples: [[T`\([0,0,2,2]\)`, T`area \(2\cdot2=4\)`], [T`\([1,0,3,2]\)`, T`area \(4\)`], [T`centre \((4,3)\), width 2, height 4`, T`\([3,1,5,5]\)`]],
        pitfall: T`With continuous coordinates there is no “+1”. Boxes given as inclusive integer pixel indices add 1 to each side length. Normalized coordinates (divided by the image size) must be used the same way everywhere.`,
        seeAlso: [43, 56]
      },
      {
        id: 'intersection-over-union', term: 'Intersection over union (IoU)', symbol: T`\frac{|A\cap B|}{|A\cup B|}`,
        plain: T`IoU measures how well two regions overlap: the area they share (\(A\cap B\), the intersection) divided by the area covered by either (\(A\cup B\), the union). It is 1 for identical boxes and 0 for boxes that do not touch. The union is the two areas added up minus the overlap, which was counted twice.`,
        formula: T`|A\cap B|=\max\bigl(0,\min(x_2,x_2')-\max(x_1,x_1')\bigr)\cdot\max\bigl(0,\min(y_2,y_2')-\max(y_1,y_1')\bigr),\qquad\operatorname{IoU}=\frac{|A\cap B|}{|A|+|B|-|A\cap B|}`,
        steps: [T`Overlap width: the smaller right edge minus the larger left edge, or 0 if that is negative.`, T`Overlap height: the same with the bottom and top edges.`, T`Intersection = overlap width × overlap height.`, T`Union = area A + area B − intersection; divide.`],
        examples: [[T`\([0,0,2,2]\) and \([1,0,3,2]\)`, T`overlap \(1\times2=2\); union \(4+4-2=6\); IoU \(1/3\)`], [T`\([0,0,2,2]\) and \([1,1,3,3]\)`, T`overlap 1; union 7; IoU \(1/7\approx0.143\)`], [T`\([0,0,2,2]\) and \([3,0,5,2]\)`, T`width \(\max(0,2-3)=0\): IoU \(0\)`], [T`a box and itself`, T`IoU \(1\)`]],
        pitfall: T`Decide what happens when the union is 0 (two empty boxes) instead of dividing by zero. IoU 0.5 is a common threshold for a match, but conventions vary, so state yours.`,
        seeAlso: [43, 44]
      },
      {
        id: 'generalized-iou', term: 'Generalized IoU (GIoU)', symbol: T`\operatorname{IoU}-\frac{|C\setminus(A\cup B)|}{|C|}`,
        plain: T`Plain IoU is 0 for every pair of boxes that do not touch, however far apart, so as a loss it gives no signal to pull them together. GIoU subtracts a penalty: the fraction of \(C\), the smallest box enclosing both, that is covered by neither. It ranges from −1 to 1, equals 1 for identical boxes and falls below 0 as separated boxes move apart.`,
        formula: T`\operatorname{GIoU}=\operatorname{IoU}-\frac{|C|-|A\cup B|}{|C|},\qquad\text{loss}=1-\operatorname{GIoU}`,
        steps: [T`Compute the IoU and the union \(|A\cup B|\).`, T`Enclosing box \(C=[\min x_1,\ \min y_1,\ \max x_2,\ \max y_2]\) over both boxes; find its area.`, T`Empty part: \(|C|-|A\cup B|\) (\(C\setminus(A\cup B)\) means the part of \(C\) outside both boxes).`, T`GIoU = IoU − empty part / \(|C|\).`],
        examples: [[T`\(A=[0,0,2,2],\ B=[3,0,5,2]\)`, T`IoU 0; \(C=[0,0,5,2]\), area 10; union 8; GIoU \(0-2/10=-0.2\)`], [T`\(A=[0,0,2,2],\ B=[4,0,6,2]\)`, T`\(|C|=12\): GIoU \(-4/12\approx-0.333\), worse as they separate`], [T`\(A=[0,0,2,2],\ B=[1,0,3,2]\)`, T`\(C\) equals the union (area 6): GIoU = IoU \(=1/3\)`]],
        pitfall: T`When one box lies inside the other, \(C\) is the larger box and GIoU equals IoU, so it adds no extra push. Use \(1-\operatorname{GIoU}\) as the loss, not GIoU itself.`
      },
      {
        id: 'smooth-l1-loss', term: 'L1 and smooth L1 box losses', symbol: T`\operatorname{smooth}_{L_1}(r)`,
        plain: T`A box loss compares predicted and target coordinates through the residual \(r\), prediction minus target. Squared error grows fast, so one bad box can dominate; the L1 loss \(|r|\) grows only linearly but has a sharp corner at 0. Smooth L1 is quadratic for small residuals and linear for large ones, getting the best of both.`,
        formula: T`\operatorname{smooth}_{L_1}(r)=\begin{cases}\dfrac{r^2}{2\delta},&|r|<\delta\\[4pt]|r|-\dfrac\delta2,&|r|\ge\delta\end{cases}`,
        steps: [T`Compute the residual \(r\) for each of the four coordinates.`, T`If \(|r|<\delta\), use \(r^2/(2\delta)\); otherwise \(|r|-\delta/2\).`, T`Add the four values for the box.`],
        examples: [[T`\(\delta=1,\ r=0.5\)`, T`\(0.25/2=0.125\)`], [T`\(\delta=1,\ r=2\)`, T`\(2-0.5=1.5\) (L1: 2; half the squared error: 2)`], [T`\(\delta=1,\ r=-3\)`, T`\(2.5\) (half the squared error: 4.5)`]],
        plot: {fn: 'x => Math.abs(x) < 1 ? x * x / 2 : Math.abs(x) - 0.5', x: [-3, 3], y: [0, 3], xLabel: 'residual r', yLabel: 'smooth L1 (δ = 1)', marks: [0.5, 2]},
        pitfall: T`Coordinate units and scaling decide how large this loss is next to the class loss. A coordinate loss can improve while an IoU-threshold metric stays the same.`,
        seeAlso: [52]
      },
      {
        id: 'non-maximum-suppression', term: 'Non-maximum suppression (NMS)',
        plain: T`A detector often fires several overlapping boxes on one object. NMS keeps the highest-scoring box, removes every remaining box that overlaps it by more than an IoU threshold, and repeats with the next highest survivor. The result is roughly one box per object.`,
        steps: [T`Sort the boxes by score, highest first.`, T`Keep the top box.`, T`Remove every remaining box whose IoU with it exceeds the threshold.`, T`Repeat with the highest box still left, until none remain.`],
        examples: [[T`A (score 0.9), B (0.8), C (0.7); IoU(A,B) = 0.6, IoU(A,C) = 0.1; threshold 0.5`, T`keep A, remove B, keep C`], [T`the same boxes with threshold 0.7`, T`keep all three`]],
        pitfall: T`Two different objects that overlap heavily, as in a crowd, can be merged into one. The threshold is a choice that changes the results.`
      },
      {
        id: 'true-and-false-positives', term: 'True positives, false positives and false negatives', symbol: T`TP,\ FP,\ FN`,
        plain: T`Evaluation sorts outcomes into counts. A true positive (TP) is a prediction that matches a real object; a false positive (FP) is a prediction with nothing real to match; a false negative (FN) is a real object that nothing found. In detection, a prediction matches if it has the right class and enough IoU with a target that is not already matched.`,
        steps: [T`Sort the predictions by score.`, T`For each, find the best still-unmatched target of the same class. If its IoU reaches the threshold, count a TP and mark that target as matched; otherwise count an FP.`, T`Every target left unmatched is an FN.`],
        examples: [[T`3 objects, 4 predictions, 2 of which match`, T`\(TP=2,\ FP=2,\ FN=1\)`], [T`two boxes on one object, IoU 0.8 and 0.7`, T`the first is a TP; the duplicate is an FP`], [T`segmentation, counted per pixel`, T`TP: foreground called foreground; FP: background called foreground; FN: foreground missed`]],
        pitfall: T`Detection has no true-negative count, because there is no fixed list of “non-objects”. Always say what unit is counted: image, box or pixel.`,
        seeAlso: [43, 44]
      }
    ]
  });

  add(43, {
    builds: [{lesson: 42, why: 'TP, FP, FN and IoU, now counted per pixel'}, {lesson: 27, why: 'softmax cross-entropy, applied at every pixel'}, {lesson: 33, why: 'masks must be resized without blending labels'}],
    recall: ['true-and-false-positives', 'intersection-over-union', 'softmax', 'cross-entropy', 'interpolation'],
    symbols: [
      ['TP', 'true positives: foreground pixels predicted as foreground'],
      ['FP, FN', 'FP: background wrongly called foreground; FN: foreground missed']
    ],
    terms: [
      {
        id: 'semantic-segmentation', term: 'Semantic segmentation', symbol: T`(N,H,W,C)`,
        plain: T`Semantic segmentation predicts a class for every pixel. The network outputs one score per class at each pixel, a logit array of shape \((N,H,W,C)\); softmax over the class axis gives each pixel its own probabilities, and the loss averages over all labelled pixels. Instance segmentation also separates different objects of the same class.`,
        steps: [T`Write the logit shape: images × height × width × classes.`, T`At each pixel, apply softmax across the classes.`, T`The predicted mask is the argmax class at each pixel.`, T`Average the per-pixel loss, leaving out any pixels marked “ignore”.`],
        examples: [[T`4 images of 32×48, 3 classes`, T`logits \((4,32,48,3)\)`], [T`one pixel’s logits \([2,0,-1]\)`, T`softmax \(\approx[0.844,\ 0.114,\ 0.042]\): class 0`], [T`binary foreground segmentation`, T`one sigmoid logit per pixel: \((N,H,W,1)\)`]],
        pitfall: T`Resize masks with nearest neighbour, and apply every spatial augmentation to the image and its mask identically. A one-pixel misalignment quietly lowers every score.`,
        seeAlso: [44, 56]
      },
      {
        id: 'class-imbalance', term: 'Class imbalance and misleading pixel accuracy', symbol: T`\frac{TP+TN}{\text{all pixels}}`,
        plain: T`When one class dominates, a model that always predicts it scores a high accuracy while finding nothing. Pixel accuracy counts true negatives (TN, background correctly called background), and background supplies most of them. Report foreground measures such as IoU or Dice, and compare with the all-background baseline.`,
        steps: [T`Find the fraction of pixels in the majority class: that is the accuracy of always predicting it.`, T`Compute foreground IoU for the same prediction: with no foreground predicted it is 0.`, T`Judge a model by how far it beats this baseline on the foreground measures.`],
        examples: [[T`100 pixels, 10 foreground, predict all background`, T`accuracy \(90/100=90\%\); foreground IoU \(0\)`], [T`25 pixels, 9 foreground`, T`all-background accuracy \(16/25=64\%\)`], [T`200 pixels, 5% foreground`, T`all-background accuracy \(95\%\)`]],
        pitfall: T`Say which classes are averaged and how empty masks are scored. Class weights or resampling fight imbalance but also change the objective.`,
        seeAlso: [44]
      },
      {
        id: 'dice-coefficient', term: 'Dice coefficient', symbol: T`\frac{2TP}{2TP+FP+FN}`,
        plain: T`Dice measures the overlap between a predicted mask and the target: twice the shared foreground divided by the total foreground in both. Like IoU it ignores true negatives, so abundant background cannot inflate it. It runs from 0 (no overlap) to 1 (perfect) and is never smaller than IoU.`,
        formula: T`\operatorname{Dice}=\frac{2TP}{2TP+FP+FN},\qquad\operatorname{IoU}=\frac{TP}{TP+FP+FN},\qquad\operatorname{Dice}=\frac{2\,\operatorname{IoU}}{1+\operatorname{IoU}}`,
        steps: [T`Count TP, FP and FN over the pixels.`, T`Dice: \(2TP\) divided by \(2TP+FP+FN\).`, T`For comparison, IoU: \(TP\) divided by \(TP+FP+FN\).`],
        examples: [[T`\(TP=6,\ FP=2,\ FN=4\)`, T`Dice \(12/18=2/3\); IoU \(6/12=0.5\)`], [T`\(TP=8,\ FP=2,\ FN=4\)`, T`Dice \(16/22\approx0.727\); IoU \(8/14\approx0.571\)`], [T`all background predicted, 10 foreground pixels`, T`Dice \(0\), IoU \(0\)`]],
        pitfall: T`An empty target with an empty prediction gives \(0/0\): declare the convention (often 1). Averaging Dice per image differs from pooling the counts over all images.`,
        seeAlso: [44, 45]
      },
      {
        id: 'soft-dice-loss', term: 'Soft Dice loss', symbol: T`1-\frac{2\sum_ip_iy_i+\epsilon}{\sum_ip_i+\sum_iy_i+\epsilon}`,
        plain: T`To train on overlap directly, replace the hard 0/1 predictions in Dice by probabilities \(p_i\). The soft Dice score changes smoothly, so it has gradients, and the loss is one minus it. A small \(\epsilon\) keeps the ratio defined when both masks are empty.`,
        formula: T`L_{\text{Dice}}=1-\frac{2\sum_ip_iy_i+\epsilon}{\sum_ip_i+\sum_iy_i+\epsilon}`,
        steps: [T`Multiply each probability by its 0/1 target and add up: the soft TP.`, T`Add up all the probabilities, and separately all the targets.`, T`Divide twice the soft TP by that total; the loss is 1 minus the result.`],
        examples: [[T`\(p=[0.9,0.2,0.6],\ y=[1,0,1]\) (ignoring the tiny \(\epsilon\))`, T`\(2(0.9+0.6)/(1.7+2)=3/3.7\approx0.811\); loss \(\approx0.189\)`], [T`hard predictions \(p=[1,0,1]\)`, T`\(4/4=1\); loss \(0\)`]],
        pitfall: T`Soft Dice on probabilities is not the thresholded Dice you report, and definitions vary (squared terms, per-image or pooled). Name the formula you use.`
      },
      {
        id: 'weighted-cross-entropy', term: 'Class-weighted cross-entropy', symbol: T`-w_y\ln p_y`,
        plain: T`Multiply each pixel’s cross-entropy by a weight for its true class, larger for rare classes, so that they influence training more. This changes the objective: the model is pushed towards predicting the rare class more often, which can raise recall but distorts the probabilities.`,
        steps: [T`Choose a weight per class, for example one over the class’s frequency.`, T`For each pixel, multiply \(-\ln p_y\) by the weight of its true class.`, T`Average over the pixels (some definitions divide by the total weight instead).`],
        examples: [[T`foreground weight 9, background 1; a foreground pixel with \(p_y=0.5\)`, T`\(9\times0.693\approx6.24\) instead of \(0.693\)`], [T`10% foreground, inverse-frequency weights`, T`foreground \(1/0.1=10\), background \(1/0.9\approx1.11\)`]],
        pitfall: T`Choose the weights with validation data, and remember the weighted loss is no longer the plain negative log-likelihood.`
      },
      {
        id: 'focal-loss', term: 'Focal loss', symbol: T`-(1-p_t)^{\gamma}\ln p_t`,
        plain: T`Focal loss turns down the cross-entropy of examples the model already gets right. With \(p_t\) the probability given to the true class, it multiplies \(-\ln p_t\) by \((1-p_t)^\gamma\), usually with \(\gamma=2\). Easy, confident pixels, mostly abundant background, then contribute almost nothing, and training concentrates on the hard, rare ones.`,
        formula: T`\operatorname{FL}(p_t)=-(1-p_t)^{\gamma}\ln p_t,\qquad\gamma=0\ \text{gives ordinary cross-entropy}`,
        steps: [T`Find \(p_t\), the predicted probability of the true class.`, T`Compute the cross-entropy \(-\ln p_t\).`, T`Multiply by \((1-p_t)^\gamma\).`],
        examples: [[T`\(\gamma=2,\ p_t=0.9\) (easy)`, T`\(0.01\times0.105\approx0.0011\): 100 times smaller`], [T`\(\gamma=2,\ p_t=0.5\)`, T`\(0.25\times0.693\approx0.173\)`], [T`\(\gamma=2,\ p_t=0.1\) (hard)`, T`\(0.81\times2.303\approx1.865\): barely reduced`]],
        plot: {fn: 'x => -((1 - x) ** 2) * Math.log(x)', x: [0.02, 1], y: [0, 3], xLabel: 'probability of the true class', yLabel: 'focal loss (γ = 2)', marks: [0.1, 0.5]},
        pitfall: T`\(\gamma\), and the optional class weight often added to it, are extra settings to choose on validation data. Like class weights, focal loss changes the objective and can distort calibrated probabilities.`
      }
    ]
  });

  add(44, {
    builds: [{lesson: 42, why: 'TP, FP and FN come from IoU matching'}, {lesson: 22, why: 'an integral is an area under a curve'}, {lesson: 43, why: 'overlap metrics for masks'}],
    recall: ['true-and-false-positives', 'intersection-over-union', 'dice-coefficient', 'integral', 'conditional-probability'],
    symbols: [
      ['precision', 'precision: of everything predicted positive, the fraction that was right', 'precision'],
      ['recall', 'recall: of everything actually positive, the fraction that was found', 'recall']
    ],
    terms: [
      {
        id: 'precision', term: 'Precision', symbol: T`\frac{TP}{TP+FP}`,
        plain: T`Precision asks: when the model says “positive”, how often is it right? It divides the correct positive predictions by all positive predictions. High precision means few false alarms.`,
        formula: T`\operatorname{precision}=\frac{TP}{TP+FP}`,
        steps: [T`Count the positive predictions: \(TP+FP\).`, T`Divide the correct ones, \(TP\), by that count.`, T`If nothing was predicted positive the ratio is \(0/0\); state the convention you report.`],
        examples: [[T`\(TP=6,\ FP=2\)`, T`\(6/8=0.75\)`], [T`\(TP=8,\ FP=2\)`, T`\(8/10=0.8\)`], [T`\(TP=6,\ FP=3\)`, T`\(6/9\approx0.667\)`]],
        pitfall: T`Precision ignores what was missed: predicting only the single most confident box can give precision 1 with terrible recall.`,
        seeAlso: [47]
      },
      {
        id: 'recall', term: 'Recall', symbol: T`\frac{TP}{TP+FN}`,
        plain: T`Recall asks: of all the real positives, how many did the model find? It divides the correct positive predictions by the number of real positive targets. High recall means few misses.`,
        formula: T`\operatorname{recall}=\frac{TP}{TP+FN}`,
        steps: [T`Count the real positives: \(TP+FN\).`, T`Divide \(TP\) by that count.`],
        examples: [[T`\(TP=6,\ FN=4\)`, T`\(6/10=0.6\)`], [T`\(TP=8,\ FN=4\)`, T`\(8/12\approx0.667\)`], [T`\(TP=6,\ FN=2\)`, T`\(6/8=0.75\)`]],
        pitfall: T`Calling everything positive gives recall 1. Precision and recall have different denominators, so neither can replace the other.`,
        seeAlso: [47]
      },
      {
        id: 'f1-score', term: 'F1 score', symbol: T`F_1=\frac{2PR}{P+R}`,
        plain: T`F1 combines precision \(P\) and recall \(R\) into one number, their harmonic mean. It is high only when both are high: a model that is good at one and poor at the other scores low. In counts it is \(2TP/(2TP+FP+FN)\), the same formula as Dice.`,
        formula: T`F_1=\frac{2PR}{P+R}=\frac{2TP}{2TP+FP+FN}`,
        steps: [T`Compute precision and recall.`, T`Multiply them, double it, and divide by their sum.`, T`Check with the counts: \(2TP/(2TP+FP+FN)\).`],
        examples: [[T`\(TP=8,\ FP=2,\ FN=4\)`, T`\(16/22=8/11\approx0.727\)`], [T`\(P=0.75,\ R=0.6\)`, T`\(0.9/1.35\approx0.667\)`], [T`\(P=1,\ R=0.1\)`, T`\(0.2/1.1\approx0.18\), far below their plain average of 0.55`]],
        pitfall: T`F1 ignores true negatives and depends on the chosen threshold. Two models with the same F1 can trade precision and recall very differently.`
      },
      {
        id: 'precision-recall-curve', term: 'Thresholds and the precision–recall curve',
        plain: T`A detector gives each prediction a confidence score, and a threshold decides which predictions count as positive. Lowering it accepts more predictions: recall can only stay the same or rise, while precision often falls. Each threshold gives one (recall, precision) point; joining them gives the precision–recall curve.`,
        steps: [T`Sort the predictions by score.`, T`For each threshold, count TP and FP among the predictions at or above it; FN are the targets left unfound.`, T`Compute precision and recall, and plot recall across, precision up.`],
        examples: [[T`scores \(0.95,0.8,0.65,0.55,0.4,0.2\), labels \(1,0,1,1,0,1\); threshold 0.9`, T`\(TP=1,\ FP=0\): precision 1, recall 0.25`], [T`threshold 0.5`, T`\(TP=3,\ FP=1\): precision 0.75, recall 0.75`], [T`threshold 0.1`, T`\(TP=4,\ FP=2\): precision 0.667, recall 1`]],
        pitfall: T`Choose an operating threshold on validation data, then report on held-out data. The curve is not always smooth or downhill; it zigzags as true and false positives arrive.`
      },
      {
        id: 'average-precision', term: 'Average precision (AP) and mAP', symbol: T`\operatorname{AP}`,
        plain: T`AP summarizes a whole precision–recall curve in one number, roughly the area under it (an integral, Lesson 22). In the simple version used here, rank the detections by score, note the precision at each rank that is a true positive, add these and divide by the number of real objects. mAP is the mean of AP over the classes.`,
        formula: T`\operatorname{AP}=\frac1G\sum_{k\,:\,\text{rank }k\text{ is a TP}}\operatorname{precision}@k\ \approx\ \int_0^1 P(R)\,dR\qquad(G=\text{number of real objects})`,
        steps: [T`Rank the detections by score and mark each as TP or FP after matching.`, T`At each TP, compute precision so far: TPs so far divided by the rank.`, T`Add those precisions and divide by \(G\). Objects never found contribute 0.`],
        examples: [[T`TP, FP, TP with \(G=2\)`, T`precisions \(1\) and \(2/3\): \(\operatorname{AP}=(1+2/3)/2=5/6\approx0.833\)`], [T`FP, TP, TP with \(G=2\)`, T`\((1/2+2/3)/2=7/12\approx0.583\)`], [T`TP, TP, FP, FP, TP with \(G=4\)`, T`\((1+1+0.6)/4=0.65\); one object never found`]],
        pitfall: T`AP conventions differ: COCO averages over IoU thresholds from 0.50 to 0.95 and samples recall on a grid. Compare AP numbers only under the same protocol.`
      },
      {
        id: 'macro-and-micro-averaging', term: 'Macro and micro averaging (and mean IoU)',
        plain: T`With several classes there are two ways to average a metric. Macro averaging computes it for each class and takes the plain mean, so every class counts equally. Micro averaging pools the counts of all classes first, so frequent classes dominate. Mean IoU for segmentation is a macro average of the per-class IoUs.`,
        steps: [T`Macro: compute the metric per class, then average the results.`, T`Micro: add up TP, FP and FN over all classes, then compute the metric once.`, T`State the policy for a class absent from both the target and the prediction.`],
        examples: [[T`class A: \(TP=90,\ FP=10\); class B: \(TP=1,\ FP=9\)`, T`precisions 0.9 and 0.1: macro \(0.5\)`], [T`the same, micro`, T`\(91/110\approx0.827\)`], [T`class IoUs \(0.9,\ 0.5,\ 0.1\)`, T`mean IoU \(0.5\)`]],
        pitfall: T`A strong micro average can hide a failing rare class. Report per-class numbers next to the average.`
      }
    ]
  });
})();
