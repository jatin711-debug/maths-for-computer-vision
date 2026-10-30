/* Primers for Modules 12-14 (Lessons 45-56). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  add(45, {
    builds: [{lesson: 28, why: 'each split has a job; related images stay together'}, {lesson: 22, why: 'an expected count is a probability times a number'}, {lesson: 44, why: 'choosing a metric that can expose a weak baseline'}],
    recall: ['data-leakage', 'nearest-centroid-classifier', 'independent-events', 'expected-value', 'dice-coefficient'],
    symbols: [
      ['baseline', 'a simple method you can explain, run under the same protocol as your model', 'baseline'],
      ['split', 'how examples are divided into training, validation and test roles', 'group-split']
    ],
    terms: [
      {
        id: 'experimental-protocol', term: 'Experimental protocol', symbol: T`\text{question}\to\text{split}\to\text{baseline}\to\text{metric}`,
        plain: T`A written plan, fixed before any training, that says what question you are asking, which data and split you will use, what you compare against and how you will score it. Writing it first means the result answers the question you asked, not one chosen after seeing the numbers.`,
        steps: [T`Write one comparison question that names the task, the two methods and the test condition.`, T`Fix the data: generator or dataset, sample counts, class balance, split and grouping rule, seed and preprocessing.`, T`Choose one primary metric and one secondary diagnostic.`, T`State the hypothesis and which result would fail to support it. Leave the test set untouched until all of this is fixed.`],
        examples: [[T`“Build the best vision model”`, T`not answerable: no comparison, no condition`], [T`“Does a small CNN beat a linear classifier on bar orientation under held-out noise?”`, T`answerable: two methods, one task, one declared condition`]],
        pitfall: T`Rewriting the hypothesis after seeing the results turns a test into a description. If something practical forces a change, record it and keep the original question.`,
        seeAlso: [46, 47, 48]
      },
      {
        id: 'baseline', term: 'Baseline', symbol: T`\text{baseline}`,
        plain: T`A simple, transparent method run under exactly the same data, split and metric as your proposed model. It answers “better than what?”: a gain means something only when it beats a sensible baseline under the same conditions, and a weak baseline can expose a misleading metric.`,
        steps: [T`Pick the simplest method that could plausibly do the task.`, T`Run it with the same data, split, preprocessing and metric as the new model.`, T`Report the new model’s result next to it, and the difference between them.`],
        examples: [[T`recognition`, T`nearest-centroid or linear softmax regression`], [T`localization`, T`always predict the average training box`], [T`segmentation`, T`predict all background, or a simple intensity threshold`], [T`all-background on masks with 5% foreground`, T`pixel accuracy 0.95, but Dice 0`]],
        pitfall: T`A baseline is only fair if it gets the same split, preprocessing and tuning budget. Comparing a tuned model with an untuned baseline measures the tuning, not the method.`,
        seeAlso: [46, 48]
      },
      {
        id: 'group-split', term: 'Group split', symbol: T`P(\text{mixed})=1-(1-q)^m-q^m`,
        plain: T`Frames of one video, or photos of one person, share background and content, so they are not independent examples. A group split puts each whole group in one role, so the test set measures performance on new groups, which is usually what you want to claim. A frame-by-frame random split leaks near-copies across roles.`,
        formula: T`P(\text{mixed group})=1-(1-q)^m-q^m,\qquad \mathbb E[\text{mixed groups}]=G\cdot P(\text{mixed group})`,
        steps: [T`Decide the independent unit from the claim: new videos, new people or new places.`, T`Assign whole groups to training or test, so every frame of a video lands on one side.`, T`To see the risk of a frame-level split, let each frame go to test with probability \(q\). A group of \(m\) frames stays on one side with probability \((1-q)^m+q^m\); the rest of the time it is mixed.`, T`Multiply by the number of groups \(G\) to get the expected number of mixed groups.`],
        examples: [[T`20 videos × 5 frames`, T`100 images, but only 20 independent groups`], [T`frame split with \(q=4/20=0.2\)`, T`\(P(\text{mixed})=1-0.8^5-0.2^5=0.672\)`], [T`expected mixed videos`, T`\(20\times0.672=13.44\) of the 20`], [T`group split, 4 test videos`, T`0 mixed videos by construction`]],
        pitfall: T`Counting 100 frames as 100 independent test cases overstates the evidence. Report both the number of images and the number of groups.`,
        seeAlso: [47, 48]
      }
    ]
  });

  add(46, {
    builds: [{lesson: 45, why: 'the protocol and baseline being compared'}, {lesson: 23, why: 'mean and standard deviation of repeated results'}, {lesson: 24, why: 'test-set sampling uncertainty is a separate thing'}],
    recall: ['baseline', 'experimental-protocol', 'standard-deviation', 'standard-error'],
    symbols: [
      ['Δ', 'the change in one stated metric: new result minus baseline result', 'controlled-comparison'],
      ['controls', 'what is kept fixed: data, split, training budget and evaluation rules', 'controlled-comparison']
    ],
    terms: [
      {
        id: 'controlled-comparison', term: 'Controlled comparison', symbol: T`\Delta=\hat R_{\rm new}-\hat R_{\rm baseline}`,
        plain: T`Compare a baseline with one declared change while everything else stays the same: data version, split, preprocessing, seeds, training budget and evaluation rules. Only then can the difference Δ in the metric be credited to that one change.`,
        steps: [T`List the controls you will hold fixed.`, T`Change exactly one factor.`, T`Compute \(\Delta=\) new result \(-\) baseline result on the same metric and the same test set.`, T`Say whether higher or lower is better before calling Δ an improvement.`],
        examples: [[T`accuracy 0.72 → 0.75`, T`\(\Delta=+0.03\), a gain of 3 percentage points`], [T`loss 0.40 → 0.35`, T`\(\Delta=-0.05\): better, because lower loss is better`], [T`architecture, optimizer and augmentation all changed`, T`a gain cannot be credited to any one of them`]],
        pitfall: T`Changing several factors at once supports only a claim about the whole bundle. Equal update counts and equal compute cost are different controls that answer different questions.`,
        seeAlso: [47, 48]
      },
      {
        id: 'ablation-study', term: 'Ablation study',
        plain: T`An experiment that removes or changes one component of a method and keeps everything else fixed, to measure how much that component contributes. It is a controlled comparison aimed at one part of your own model.`,
        steps: [T`Name the component you will remove or change.`, T`Train and evaluate the full model and the reduced model under the same protocol and seeds.`, T`Report the difference, run by run, and what it does and does not show.`],
        examples: [[T`the same network with and without ReLU`, T`tests whether the nonlinearity matters`], [T`with and without one declared augmentation`, T`tests that augmentation alone`], [T`removing a component changes nothing`, T`evidence it is not needed in this setting, not in every setting`]],
        pitfall: T`An ablation says what a part contributes inside this model on this data. It does not show the part is useless elsewhere.`,
        seeAlso: [48]
      },
      {
        id: 'random-seed', term: 'Random seed and run-to-run variation',
        plain: T`A seed fixes the random numbers a run uses: initial weights, data order and augmentations. Different seeds give different results for the same procedure. Repeat it with a few seeds chosen in advance and report every result plus their mean and sample standard deviation.`,
        formula: T`\bar R=\frac1n\sum_{i=1}^{n}R_i,\qquad s=\sqrt{\frac{1}{n-1}\sum_{i=1}^{n}\bigl(R_i-\bar R\bigr)^2}`,
        steps: [T`Run the same procedure with \(n\) predeclared seeds.`, T`Average the results to get \(\bar R\).`, T`Subtract the mean from each result, square, add the squares, divide by \(n-1\) and take the square root to get \(s\).`, T`Report every run, \(\bar R\) and \(s\). Never keep only the best seed.`],
        examples: [[T`accuracies 0.80, 0.82, 0.78`, T`mean 0.80; \(s=\sqrt{(0+0.0004+0.0004)/2}=0.02\)`], [T`accuracies 0.7, 0.8, 0.9`, T`mean 0.8; \(s=0.1\)`]],
        pitfall: T`Seed-to-seed spread measures variation between training runs. It is not the sampling uncertainty of the test set, and averaging seeds does not remove that.`,
        seeAlso: [48]
      },
      {
        id: 'paired-comparison', term: 'Paired differences', symbol: T`\Delta_i=R_{{\rm new},i}-R_{{\rm base},i}`,
        plain: T`Run the baseline and the new model with the same seeds and test images, and subtract within each pair. The paired differences show both the size of the effect and how consistently it appears, which two separate averages hide.`,
        formula: T`\Delta_i=R_{{\rm new},i}-R_{{\rm base},i},\qquad \bar\Delta=\frac1n\sum_{i=1}^{n}\Delta_i`,
        steps: [T`Pair each new run with the baseline run that used the same seed and data.`, T`Subtract within each pair.`, T`Report the differences, their mean \(\bar\Delta\) and their standard deviation \(s_\Delta\).`],
        examples: [[T`base (70, 72, 71)%, new (70, 73, 73)%`, T`\(\Delta=(0,1,2)\) percentage points`], [T`the same differences`, T`\(\bar\Delta=1\), \(s_\Delta=1\) percentage point`], [T`new (69, 72, 72)%`, T`\(\Delta=(-1,0,1)\): mean 0, yet the runs disagree`]],
        pitfall: T`Three pairs are little evidence: the standard error of the mean difference is \(s_\Delta/\sqrt n=1/\sqrt3\approx0.58\) points, more than half the effect.`
      },
      {
        id: 'paired-confidence-interval', term: 'Confidence interval for a paired difference', symbol: T`\bar\Delta\pm t\,\frac{s_\Delta}{\sqrt n}`,
        plain: T`To say whether a new model really beats the baseline, put an interval around the mean paired difference. With few runs, use the t multiplier instead of 1.96: it is larger because the standard deviation itself is uncertain. For per-image right/wrong results, McNemar's test uses only the images where the two models disagree.`,
        formula: T`\bar\Delta\pm t_{n-1}\frac{s_\Delta}{\sqrt n},\qquad \chi^2_{\text{McNemar}}=\frac{(b-c)^2}{b+c}`,
        steps: [T`Compute the paired differences, their mean \(\bar\Delta\) and their standard deviation \(s_\Delta\) (with \(n-1\)).`, T`Look up the 95% t multiplier for \(n-1\) degrees of freedom: 4.30 for 2, 2.78 for 4, 2.26 for 9, 2.05 for 29.`, T`Report \(\bar\Delta\pm t\,s_\Delta/\sqrt n\). If the interval includes 0, the data do not show a difference.`, T`For per-image accuracy, count \(b\) (only A right) and \(c\) (only B right); a McNemar value above 3.84 is significant at 5%.`],
        examples: [[T`3 seeds, \(\Delta=(0,1,2)\)`, T`\(1\pm4.30\cdot1/\sqrt3=[-1.48,\,3.48]\): not shown`], [T`1000 images, \(b=40\), \(c=22\)`, T`\((40-22)^2/62=5.23>3.84\): significant`], [T`the same 1000 images`, T`difference \(1.8\) points, 95% interval \([0.26,\,3.34]\)`]],
        pitfall: T`Do not compare two separate intervals for overlap; the pairing removes the variation the models share, so the paired interval is usually much narrower.`
      },
      {
        id: 'percentage-point', term: 'Percentage points',
        plain: T`The plain difference between two percentages. Going from 70% to 73% is a gain of 3 percentage points. The relative change divides that difference by the starting value: 3/70, about 4.3%.`,
        steps: [T`Subtract the percentages: 73% − 70% = 3 percentage points.`, T`For a relative change, divide the difference by the starting value: \(3/70\approx0.043\), or 4.3%.`],
        examples: [[T`70% → 73%`, T`+3 points; relative change +4.3%`], [T`10% → 15%`, T`+5 points; relative change +50%`], [T`error 20% → 15%`, T`−5 points; relative change −25%`]],
        pitfall: T`“Improved by 3%” is ambiguous. Say “3 percentage points” for a difference, and quote a relative change only when you have computed it.`
      }
    ]
  });

  add(47, {
    builds: [{lesson: 21, why: 'prevalence changes precision through Bayes’ rule'}, {lesson: 24, why: 'an interval describes one test set, not a new one'}, {lesson: 44, why: 'precision and recall from counts'}],
    recall: ['bayes-theorem', 'precision', 'confidence-interval', 'calibration', 'controlled-comparison'],
    symbols: [
      ['P', 'joint distribution: how often each input occurs together with each label', 'domain-shift'],
      ['use', 'the setting where the model will actually be used or evaluated', 'domain-shift']
    ],
    terms: [
      {
        id: 'domain-shift', term: 'Domain shift', symbol: T`P_{\rm train}(X,Y)\ne P_{\rm use}(X,Y)`,
        plain: T`The data a model meets in use differ from the data it was trained and tested on. \(P(X,Y)\), the joint distribution, says how often each combination of input X and label Y occurs. Shift can change how inputs look, how common each class is, what labels mean, or how input and label are linked.`,
        steps: [T`Name the training source and the use setting.`, T`Ask what changed: input appearance (light, noise), class prevalence, annotation rules, or the input–label relation.`, T`Evaluate on data from the use setting and report it separately from the original test set.`],
        examples: [[T`brighter or noisier bars`, T`input appearance shifts`], [T`more vertical bars than in training`, T`class prevalence shifts`], [T`annotators draw boxes more tightly`, T`label meaning shifts`]],
        pitfall: T`A strong held-out score from one source says little about another. A narrow confidence interval on one test set does not show robustness to a new distribution.`
      },
      {
        id: 'subgroup-metrics', term: 'Subgroup metrics and the mixture', symbol: T`\operatorname{acc}=\sum_g P(g)\,\operatorname{acc}_g`,
        plain: T`Report the metric separately for groups such as lighting, object size or source. Overall accuracy is the average of the group accuracies, weighted by how common each group is, so a change in the mix can move the headline number even when every group behaves exactly as before.`,
        formula: T`\operatorname{acc}=\sum_g P(g)\,\operatorname{acc}_g,\qquad\text{e.g. }\operatorname{acc}=0.9\,(1-q)+0.5\,q`,
        steps: [T`Split the evaluation set into groups and count each one.`, T`Compute the metric inside each group.`, T`Multiply each group metric by that group’s share and add.`],
        examples: [[T`bright 0.9, dark 0.5, dark share 20%`, T`\(0.9\cdot0.8+0.5\cdot0.2=0.82\)`], [T`same model, dark share 50%`, T`\(0.70\)`], [T`same model, dark share 60%`, T`\(0.66\)`]],
        pitfall: T`An unchanged overall score can hide a gain in one group and a loss in another. Always give the group counts with the group metrics.`
      },
      {
        id: 'prevalence-shift', term: 'Prevalence shift and precision', symbol: T`\text{precision}=\frac{\pi\,\text{TPR}}{\pi\,\text{TPR}+(1-\pi)\,\text{FPR}}`,
        plain: T`The share of positives \(\pi\) changes between datasets while the model behaves the same on each class: its recall (true-positive rate, TPR) and false-alarm rate on negatives (FPR) stay fixed. Precision still changes, because rarer positives leave more negatives to raise false alarms.`,
        steps: [T`Expected true positives per example: \(\pi\cdot\text{TPR}\).`, T`Expected false positives per example: \((1-\pi)\cdot\text{FPR}\).`, T`Precision is true positives divided by all positives predicted.`],
        examples: [[T`TPR 0.9, FPR 0.1, \(\pi=0.5\)`, T`\(0.45/(0.45+0.05)=0.9\)`], [T`same model, \(\pi=0.1\)`, T`\(0.09/(0.09+0.09)=0.5\)`], [T`same model, \(\pi=0.01\)`, T`\(0.009/(0.009+0.099)\approx0.083\)`]],
        pitfall: T`A fall in precision does not by itself show the model got worse. Rarer positives, a changed threshold or different annotations can each cause it, so compare conditional rates and counts first.`
      },
      {
        id: 'stress-test', term: 'Stress test',
        plain: T`An extra evaluation set built on purpose with one declared change, such as more noise or unseen positions, to probe a suspected weakness. It is kept apart from the original test set and labelled as a different distribution, so it can test an explanation without redefining the test.`,
        steps: [T`Declare the one property you will vary and its range.`, T`Hold every other property of the data fixed.`, T`Report the metric at each level of that property, next to the original test result.`],
        examples: [[T`vary contrast; keep labels and positions fixed`, T`tests whether contrast causes the errors`], [T`vary object size only`, T`tests whether downsampling loses small objects`], [T`errors rise steadily as noise rises`, T`supports a noise explanation in this synthetic setup`]],
        pitfall: T`Do not slip stress cases into the test set after seeing results, or present constructed failures as random samples.`
      }
    ]
  });

  add(48, {
    builds: [{lesson: 6, why: 'cosine similarity needs normalized vectors'}, {lesson: 46, why: 'controlled comparisons are the evidence'}, {lesson: 47, why: 'evidence has limits under domain shift'}],
    recall: ['cosine-similarity', 'vector-norm', 'controlled-comparison', 'ablation-study', 'domain-shift'],
    symbols: [
      ['claim', 'what the method says it achieves, stated so it can be checked', 'method-claim'],
      ['assumptions', 'conditions the maths and the evaluation need in order to hold', 'mathematical-guarantee']
    ],
    terms: [
      {
        id: 'method-claim', term: 'Claim, assumptions, derivation, evidence', symbol: T`\text{claim}\to\text{assumptions}\to\text{derivation}\to\text{evidence}`,
        plain: T`A way to read any method. State what it claims, the conditions it needs, how the maths gets from those conditions to the claim, and which experiment supports it. Each link can then be checked on its own, on paper, in code and in a controlled comparison.`,
        steps: [T`Write down the inputs, learned parameters, output, objective and evaluation protocol, with the shape of every symbol.`, T`List the assumptions the derivation uses.`, T`Rebuild the forward pass and loss in your own notation on a tiny example.`, T`Find the experiment behind the claim: baselines, budgets, ablations, splits and uncertainty.`],
        examples: [[T`“we compare features by cosine similarity”`, T`check that the code divides by both norms`], [T`“best accuracy on dataset D”`, T`evidence for D under its protocol, not for every dataset`]],
        pitfall: T`A new name does not explain what a model optimizes. Rebuild the computation before judging the result.`
      },
      {
        id: 'mathematical-guarantee', term: 'Guarantee versus empirical result',
        plain: T`A mathematical guarantee follows from stated assumptions and holds whenever they hold. An empirical result is a measurement on particular data under a particular protocol. Papers mix the two; a careful reader keeps them apart and checks the assumptions behind each guarantee.`,
        steps: [T`For each statement, ask: is it derived, or measured?`, T`For a derived statement, list its assumptions and check them against your data and code.`, T`For a measured one, note the dataset, split, metric and uncertainty it was measured with.`],
        examples: [[T`softmax outputs are positive and sum to 1`, T`guarantee, for every input`], [T`\(-1\le\cos\theta\le1\)`, T`guarantee, once both vectors are nonzero`], [T`91% accuracy on test set T`, T`empirical: holds for T under its protocol`]],
        pitfall: T`A theorem’s assumptions are part of the claim. Applying it where they fail removes the guarantee, even if the formula still runs.`
      },
      {
        id: 'invariant-check', term: 'Invariant check',
        plain: T`A quick test of a property that must always hold if the maths and the code agree, such as probabilities summing to 1 or a cosine lying between −1 and 1. It catches implementation mistakes before any benchmark is run.`,
        steps: [T`Pick a property the method guarantees.`, T`Build a small input where you can compute everything by hand, including a case that breaks a shortcut, such as a vector that is not unit length.`, T`Run the code and confirm the property holds.`],
        examples: [[T`\(x=(3,4)\), \(u=(1,0)\)`, T`raw dot product \(x^Tu=3\): outside \([-1,1]\)`], [T`normalize first: \(\|x\|=5\)`, T`\(\cos\theta=3/5=0.6\): inside \([-1,1]\)`], [T`a softmax row`, T`every entry \(\ge0\) and the row sums to 1`]],
        pitfall: T`Passing invariant checks shows consistency, not usefulness. A correct formula can still lose to a baseline; that needs a controlled experiment.`
      }
    ]
  });

  add(49, {
    builds: [{lesson: 7, why: 'matrices as maps, composed right to left'}, {lesson: 2, why: 'the order of composed operations matters'}, {lesson: 41, why: 'the augmentation matrix is the affine case'}],
    recall: ['matrix-multiplication', 'function-composition', 'cosine', 'determinant', 'orthonormal-columns'],
    symbols: [
      ['x̃', 'homogeneous point: (x, y) with a 1 appended, written (x, y, 1)', 'homogeneous-coordinates'],
      ['R', 'rotation matrix: turns points about the origin by an angle θ', 'rotation-matrix'],
      ['s', 'uniform scale: one positive factor that stretches every length equally', 'similarity-transform'],
      ['t', 'translation vector (tₓ, t_y): the shift added after rotating and scaling', 'similarity-transform']
    ],
    terms: [
      {
        id: 'homogeneous-coordinates', term: 'Homogeneous coordinates', symbol: T`\tilde x=(x,y,1)`,
        plain: T`Write a 2D point (x, y) as three numbers (x, y, 1). Any nonzero multiple (wx, wy, w) names the same point, and you read it back by dividing by the last entry. The extra coordinate lets translation, and later perspective, be done by one matrix multiplication.`,
        formula: T`(u,v,w)\;\longmapsto\;\Bigl(\frac uw,\ \frac vw\Bigr)\quad(w\ne0),\qquad (x,y)\;\longmapsto\;(x,y,1)`,
        steps: [T`To lift a point, append a 1: \((3,-1)\) becomes \((3,-1,1)\).`, T`To read a homogeneous vector \((u,v,w)\), divide its first two entries by \(w\).`, T`If \(w=0\) there is no ordinary point: the vector is a direction, also called a point at infinity.`],
        examples: [[T`\((3,-1)\)`, T`\((3,-1,1)\), or equally \((6,-2,2)\)`], [T`\((2,4,2)\)`, T`the point \((1,2)\)`], [T`\((4,-2,2)\)`, T`the point \((2,-1)\)`], [T`\((1,0,0)\)`, T`a direction along x; translation leaves it unchanged`]],
        pitfall: T`\((3,-1,0)\) is not the point \((3,-1)\): a last entry of 0 makes it a direction. Reading u and v without dividing by w is the commonest mistake.`,
        seeAlso: [50, 51]
      },
      {
        id: 'rotation-matrix', term: 'Rotation matrix', symbol: T`R(\theta)`,
        plain: T`A matrix that turns every point about the origin by an angle θ, counter-clockwise, without changing lengths or angles. Here cos θ and sin θ are the x and y coordinates reached by turning the point (1, 0) through θ on a circle of radius 1, so the columns of R are where (1, 0) and (0, 1) end up.`,
        formula: T`R(\theta)=\begin{bmatrix}\cos\theta&-\sin\theta\\ \sin\theta&\cos\theta\end{bmatrix},\qquad R(\theta)\begin{bmatrix}x\\y\end{bmatrix}=\begin{bmatrix}x\cos\theta-y\sin\theta\\ x\sin\theta+y\cos\theta\end{bmatrix}`,
        steps: [T`Find \(\cos\theta\) and \(\sin\theta\): for 90°, \(\cos=0\) and \(\sin=1\); for 180°, \(\cos=-1\) and \(\sin=0\); for 30°, \(\cos\approx0.866\) and \(\sin=0.5\).`, T`New x: \(x\cos\theta-y\sin\theta\).`, T`New y: \(x\sin\theta+y\cos\theta\).`, T`Check that the length \(\sqrt{x^2+y^2}\) has not changed.`],
        examples: [[T`\((1,1)\) by 90°`, T`\((-1,1)\)`], [T`\((1,0)\) by 90°`, T`\((0,1)\)`], [T`\((2,1)\) by 180°`, T`\((-2,-1)\)`], [T`\((1,0)\) by 30°`, T`\((0.866,\ 0.5)\)`]],
        pitfall: T`Counter-clockwise assumes y points up. In image coordinates y points down, so the same matrix turns the picture clockwise on screen.`,
        seeAlso: [51, 52]
      },
      {
        id: 'similarity-transform', term: 'Rotate, scale and translate in one matrix', symbol: T`\begin{bmatrix}sR&t\\0^T&1\end{bmatrix}`,
        plain: T`One 3 × 3 matrix that rotates by R, scales by s and then translates by t, acting on homogeneous points. Its top-left 2 × 2 block is sR, its last column holds t and its bottom row is (0, 0, 1). A chain of moves is one product of such matrices, applied right to left.`,
        formula: T`\begin{bmatrix}sR&t\\0^T&1\end{bmatrix}\begin{bmatrix}x\\y\\1\end{bmatrix}=\begin{bmatrix}sR\,(x,y)^T+t\\1\end{bmatrix}`,
        steps: [T`Rotate the point with R.`, T`Multiply both coordinates by s.`, T`Add \(t=(t_x,t_y)\).`, T`For a chain, multiply the matrices right to left: \(TR\tilde x\) rotates first and translates second.`],
        examples: [[T`\((1,1)\), θ = 90°, s = 1, t = (2, 0)`, T`rotate to \((-1,1)\), then translate to \((1,1)\)`], [T`same, but translate first`, T`\((3,1)\), then rotate to \((-1,3)\): a different point`], [T`\((1,1)\), θ = 90°, s = 2, t = (1, 0)`, T`\(2\cdot(-1,1)+(1,0)=(-1,2)\)`]],
        pitfall: T`Matrix order is operation order read right to left. Rotating then translating differs from translating then rotating, unless the translation is zero.`,
        seeAlso: [51]
      },
      {
        id: 'transformation-hierarchy', term: 'Families of 2D transformations', symbol: T`\begin{bmatrix}A&t\\v^T&1\end{bmatrix}`,
        plain: T`Restricting the 3 × 3 matrix gives five families. Each has more freedom than the one before and keeps fewer properties: translation (2 numbers), Euclidean or rigid (3, keeps lengths and angles), similarity (4, keeps angles), affine (6, keeps parallel lines) and projective (8, keeps only straight lines).`,
        steps: [T`Look at the bottom row. If it is not \((0,0,1)\), the map is projective.`, T`Otherwise look at the 2 × 2 block A. The identity means a pure translation.`, T`If A’s columns are perpendicular and both of length 1 (determinant +1), it is Euclidean; perpendicular with equal length \(s\ne1\), a similarity.`, T`Any other invertible A gives an affine map.`],
        examples: [[T`\(A=\begin{bmatrix}0.6&-0.8\\0.8&0.6\end{bmatrix}\), bottom row \((0,0,1)\)`, T`Euclidean: columns of length 1, perpendicular`], [T`\(A=\begin{bmatrix}1.2&-1.6\\1.6&1.2\end{bmatrix}\)`, T`similarity with \(s=2\)`], [T`\(A=\begin{bmatrix}1&0.5\\0&1\end{bmatrix}\)`, T`affine: a shear, columns not perpendicular`], [T`bottom row \((0.1,0,1)\)`, T`projective`]],
        pitfall: T`A projective matrix has 9 entries but only 8 degrees of freedom, because multiplying it by a constant gives the same map. Only projective maps can make parallel lines meet, as railway tracks do in a photo.`,
        seeAlso: [50]
      },
      {
        id: 'cross-product', term: 'Cross product and the skew matrix', symbol: T`a\times b=[a]_\times b`,
        plain: T`An operation on two 3-vectors that gives a third vector perpendicular to both, whose length is the area of the parallelogram they span. It can be written as a matrix product with the skew matrix \([a]_\times\). With a line \(ax+by+c=0\) stored as \(l=(a,b,c)\), the line through two points is their cross product, and two lines meet at the cross product of the lines.`,
        formula: T`a\times b=\begin{bmatrix}a_2b_3-a_3b_2\\a_3b_1-a_1b_3\\a_1b_2-a_2b_1\end{bmatrix}=\underbrace{\begin{bmatrix}0&-a_3&a_2\\a_3&0&-a_1\\-a_2&a_1&0\end{bmatrix}}_{[a]_\times}b,\qquad (a\times b)^Ta=(a\times b)^Tb=0`,
        steps: [T`First entry \(a_2b_3-a_3b_2\); second \(a_3b_1-a_1b_3\); third \(a_1b_2-a_2b_1\).`, T`Check: the result has dot product 0 with a and with b, and its length \(\|a\times b\|\) is the parallelogram’s area.`, T`For points and lines, write each point as \((x,y,1)\) and each line as \((a,b,c)\); a point lies on a line when \(l^T\tilde x=0\).`, T`For an intersection, divide the result by its last entry. A last entry of 0 means the lines are parallel and meet at infinity.`],
        examples: [[T`\(a=(2,0,0)\), \(b=(1,3,0)\)`, T`\((0,0,6)\): perpendicular to both; area \(2\times3=6\)`], [T`\([a]_\times\) for \(a=(1,2,3)\)`, T`\(\begin{bmatrix}0&-3&2\\3&0&-1\\-2&1&0\end{bmatrix}\)`], [T`points \((0,0,1)\times(1,1,1)\)`, T`\((-1,1,0)\): the line \(-x+y=0\), that is \(y=x\)`], [T`lines \(x=1\) and \(y=2\): \((1,0,-1)\times(0,1,-2)\)`, T`\((1,2,1)\): they meet at \((1,2)\)`], [T`lines \(y=1\) and \(y=2\): \((0,1,-1)\times(0,1,-2)\)`, T`\((-1,0,0)\): parallel, meeting at infinity along x`]],
        pitfall: T`Order flips the sign: \(b\times a=-(a\times b)\). For homogeneous lines and points that names the same object, but for 3D directions the sign matters.`,
        seeAlso: [51]
      }
    ]
  });

  add(50, {
    builds: [{lesson: 49, why: 'homogeneous points and dividing by the last entry'}, {lesson: 14, why: 'the SVD finds the unit vector A sends closest to 0'}, {lesson: 33, why: 'shrinking without a blur aliases'}],
    recall: ['homogeneous-coordinates', 'interpolation', 'singular-value-decomposition', 'condition-number', 'aliasing'],
    symbols: [
      ['H', 'homography: a 3 × 3 matrix mapping one plane to another, defined up to scale', 'homography'],
      ['≃', 'equal once both sides are divided by their last coordinate', 'homography'],
      ['A', 'the DLT matrix: two rows of linear equations for each point match', 'direct-linear-transform'],
      ['h', 'the nine entries of H stacked into one vector', 'direct-linear-transform'],
      ['α, β', 'how far a sample point lies right of and below the top-left pixel centre', 'bilinear-interpolation']
    ],
    terms: [
      {
        id: 'homography', term: 'Homography', symbol: T`\tilde x'\simeq H\tilde x`,
        plain: T`A projective map between two planes, stored as a 3 × 3 matrix H acting on homogeneous points: multiply, then divide by the last coordinate. The sign ≃ means “equal after that division”. Scaling H changes nothing, so it has 8 free numbers. Straight lines stay straight; ratios of lengths do not.`,
        formula: T`u=\frac{h_{11}x+h_{12}y+h_{13}}{h_{31}x+h_{32}y+h_{33}},\qquad v=\frac{h_{21}x+h_{22}y+h_{23}}{h_{31}x+h_{32}y+h_{33}}`,
        steps: [T`Lift the point: \((x,y)\to(x,y,1)\).`, T`Multiply by H to get \((u,v,w)\).`, T`Divide: the mapped point is \((u/w,\ v/w)\).`],
        examples: [[T`\(H=\begin{bmatrix}2&0&0\\0&2&0\\1&0&1\end{bmatrix}\), point \((1,1)\)`, T`\((2,2,2)\to(1,1)\)`], [T`same H, point \((0,1)\)`, T`\((0,2,1)\to(0,2)\)`], [T`same H, centre \((0.5,0.5)\)`, T`\((1,1,1.5)\to(0.667,\ 0.667)\)`], [T`\(H=\begin{bmatrix}1&0&1\\0&1&0\\0.5&0&1\end{bmatrix}\), point \((2,1)\)`, T`\((3,1,2)\to(1.5,\ 0.5)\)`]],
        pitfall: T`Reading \((u,v)\) without dividing by w is the classic mistake. In this lesson H is a homography, not a Hessian.`,
        seeAlso: [51, 52]
      },
      {
        id: 'direct-linear-transform', term: 'Direct linear transform (DLT)', symbol: T`Ah=0,\ \|h\|=1`,
        plain: T`A way to estimate H from point matches. Multiplying out the division turns each match \((x,y)\leftrightarrow(u,v)\) into two linear equations in the nine entries of H. Stack all of them as \(Ah=0\) and take the unit vector h that A sends closest to zero. Four matches, no three on one line, fix H.`,
        formula: T`\begin{bmatrix}x&y&1&0&0&0&-ux&-uy&-u\\0&0&0&x&y&1&-vx&-vy&-v\end{bmatrix}h=0`,
        steps: [T`For each match write the two rows above.`, T`Stack the rows of all n matches into a 2n × 9 matrix A.`, T`Take the right singular vector of A with the smallest singular value as h, and reshape it into H.`],
        examples: [[T`\((1,0)\leftrightarrow(1,0)\)`, T`rows \((1,0,1,0,0,0,-1,0,-1)\) and \((0,0,0,1,0,1,0,0,0)\)`], [T`check with \(h=(2,0,0,0,2,0,1,0,1)\)`, T`\(2-1-1=0\) and \(0+0=0\)`], [T`\((1,2)\leftrightarrow(3,5)\)`, T`\((1,2,1,0,0,0,-3,-6,-3)\) and \((0,0,0,1,2,1,-5,-10,-5)\)`], [T`4 matches`, T`8 equations for 8 degrees of freedom`]],
        pitfall: T`\(h=0\) always solves \(Ah=0\), which is why the constraint \(\|h\|=1\) is needed. Fixing \(h_{33}=1\) instead fails when the true \(h_{33}\) is near zero.`,
        seeAlso: [51]
      },
      {
        id: 'hartley-normalization', term: 'Normalizing points before the DLT',
        plain: T`Pixel coordinates in the hundreds make some entries of A, such as ux, about 250,000 while others equal 1, so A is badly conditioned and noise dominates. Moving each point set’s centroid to the origin and scaling its mean distance to √2 fixes this; afterwards undo both steps.`,
        formula: T`\hat x_i=s\,(x_i-\bar x),\qquad s=\frac{\sqrt2}{\tfrac1n\sum_i\|x_i-\bar x\|},\qquad H=T'^{-1}\hat H\,T`,
        steps: [T`Average the x and y coordinates separately to get the centroid \(\bar x\).`, T`Find the mean distance of the points from the centroid.`, T`Scale by \(s=\sqrt2/\text{mean distance}\).`, T`Estimate \(\hat H\) from the normalized points, then undo: \(H=T'^{-1}\hat HT\), with T and T′ the normalizing matrices of the two images.`],
        examples: [[T`\((97,46),(103,46),(97,54),(103,54)\)`, T`centroid \((100,50)\); every distance \(\sqrt{3^2+4^2}=5\)`], [T`scale`, T`\(s=\sqrt2/5\approx0.283\)`], [T`normalized points`, T`\((\pm0.849,\ \pm1.131)\), each at distance \(\sqrt2\)`]],
        pitfall: T`Normalize each image’s points with its own T and T′, and remember to undo both at the end, or H maps between the wrong coordinates.`
      },
      {
        id: 'inverse-warping', term: 'Inverse warping', symbol: T`x\simeq H^{-1}x'`,
        plain: T`To warp an image, loop over the output pixels, map each one back into the source with \(H^{-1}\) and read the source there. Every output pixel gets exactly one value. Pushing source pixels forward instead leaves holes wherever the warp enlarges and overwrites pixels where it shrinks.`,
        steps: [T`For each output pixel centre \(x'\), compute \(H^{-1}\tilde x'\).`, T`Divide by its last entry to get the source location.`, T`Sample the source there, usually between pixel centres, with bilinear interpolation.`, T`Where the warp shrinks by a factor F, blur the source first, for example with a Gaussian of \(\sigma\approx F/2\).`],
        examples: [[T`\(H=\operatorname{diag}(2,2,1)\), output point \((3,5)\)`, T`source point \((1.5,\ 2.5)\)`], [T`enlarge by 2 each way, forward mapping`, T`at least 3/4 of output pixels get no value`], [T`same warp, inverse mapping`, T`every output pixel gets a value`], [T`shrink by \(F=4\)`, T`blur with \(\sigma\approx2\) before sampling`]],
        pitfall: T`State the pixel convention. Mixing “centres at integers” with “centres at \(i+\tfrac12\)” shifts the whole warp by half a pixel.`
      },
      {
        id: 'bilinear-interpolation', term: 'Bilinear interpolation: the four weights', symbol: T`I(\alpha,\beta)`,
        plain: T`A way to read an image between pixel centres. Blend the four surrounding pixels with weights set by the offsets α (to the right) and β (downwards): first along each row, then between the two rows. Each weight is the area of the rectangle opposite its pixel. The result changes smoothly as the point moves, so gradients can flow through the sampling position.`,
        formula: T`I=(1-\alpha)(1-\beta)I_{00}+\alpha(1-\beta)I_{10}+(1-\alpha)\beta I_{01}+\alpha\beta I_{11}`,
        steps: [T`Find α and β, the offsets as fractions of a pixel from the top-left of the four centres.`, T`Blend each row: \(I_{\text{top}}=(1-\alpha)I_{00}+\alpha I_{10}\), and likewise \(I_{\text{bottom}}\) from \(I_{01}\) and \(I_{11}\).`, T`Blend the rows: \(I=(1-\beta)I_{\text{top}}+\beta I_{\text{bottom}}\).`],
        examples: [[T`\(\alpha=0.3,\ \beta=0.6\); pixels 20, 100 (top), 60, 40 (bottom)`, T`rows 44 and 54; \(I=0.4\cdot44+0.6\cdot54=50\)`], [T`the same, as weights`, T`0.28, 0.12, 0.42, 0.18 (they sum to 1); nearest neighbour gives 60`], [T`\(\alpha=\beta=0.5\)`, T`the mean of the four, 55`], [T`\(\alpha=0.25,\ \beta=0.75\); pixels 10, 30, 50, 90`, T`rows 15 and 60; \(I=48.75\); nearest gives 50`]],
        pitfall: T`Do not blend label masks: averaging class 1 and class 3 gives 2, a class that is not there. Use nearest neighbour for labels.`
      }
    ]
  });

  add(51, {
    builds: [{lesson: 49, why: 'homogeneous coordinates and the final division'}, {lesson: 50, why: 'a flat checkerboard is imaged by a homography'}, {lesson: 13, why: 'a rotation axis is an eigenvector with eigenvalue 1'}],
    recall: ['homogeneous-coordinates', 'rotation-matrix', 'homography', 'eigenvector', 'cosine'],
    symbols: [
      ['K', 'intrinsic matrix: turns a camera-frame point into pixel coordinates', 'intrinsic-matrix'],
      ['[R | t]', 'extrinsics: the rotation and shift that move world points into the camera frame', 'camera-extrinsics'],
      ['fₓ, f_y', 'focal lengths in pixels: how much offsets from the centre are magnified', 'intrinsic-matrix'],
      ['cₓ, c_y', 'principal point: the pixel where the camera’s viewing axis meets the image', 'intrinsic-matrix'],
      ['λ', 'the point’s depth Z in front of the camera, which the result is divided by', 'pinhole-projection']
    ],
    terms: [
      {
        id: 'pinhole-projection', term: 'Pinhole projection and field of view', symbol: T`x=f\,\frac XZ`,
        plain: T`The basic camera model. Light from a point (X, Y, Z) passes through one tiny hole, so similar triangles give its image offset \(x=fX/Z\), where Z is the depth and f the focal length; one image cannot separate size from distance. The same triangle gives the field of view: the arctangent turns the ratio (W/2)/f back into half the view angle.`,
        formula: T`x=f\,\frac XZ,\quad y=f\,\frac YZ\quad(Z>0),\qquad \tan\theta=\frac{\text{opposite}}{\text{adjacent}},\qquad \text{FOV}=2\arctan\frac{W}{2f}`,
        steps: [T`Put the point in camera coordinates (x right, y down, Z forward) and check \(Z>0\); a point behind the camera is discarded, not projected.`, T`Divide by the depth Z, then multiply by f.`, T`For the field of view, halve the image width and divide by f. That ratio is \(\tan\) of half the view angle: opposite side over adjacent side.`, T`Take the arctangent, the angle whose tangent is that ratio, and double it. Python’s \(\texttt{math.atan}\) answers in radians; multiply by \(180/\pi\) for degrees.`],
        examples: [[T`\(f=800\), \(X=0.5\) m, \(Z=4\) m`, T`\(800\cdot0.5/4=100\) pixels from the centre`], [T`twice as wide and twice as far: \(X=1\), \(Z=8\)`, T`also 100 pixels: the same ray`], [T`\(W=640\), \(f=800\)`, T`\(2\arctan0.4=0.761\) rad \(=43.6^\circ\)`], [T`\(W=640\), \(f=320\)`, T`\(2\arctan1=90^\circ\)`], [T`60° wanted, \(W=640\)`, T`\(f=320/\tan30^\circ\approx554\)`]],
        plot: {fn: 'x => 2 * Math.atan(320 / x) * 180 / Math.PI', x: [200, 1200], y: [0, 120], xLabel: 'focal length f (pixels), W = 640', yLabel: 'field of view (degrees)', marks: [320, 800]},
        pitfall: T`Projecting a point with \(Z\le0\) anyway puts a phantom point in the image, mirrored through the centre. And code answers angles in radians: 0.761 radians is 43.6 degrees.`,
        seeAlso: [52]
      },
      {
        id: 'intrinsic-matrix', term: 'Intrinsic matrix', symbol: T`K`,
        plain: T`A 3 × 3 matrix holding the camera’s own settings: focal lengths \(f_x, f_y\) in pixels, the principal point \((c_x,c_y)\) where the viewing axis meets the image, and a skew s that is almost always 0. Multiply a camera-frame point by K, divide by the depth, and you have its pixel.`,
        formula: T`K=\begin{bmatrix}f_x&s&c_x\\0&f_y&c_y\\0&0&1\end{bmatrix},\qquad u=f_x\frac XZ+c_x,\qquad v=f_y\frac YZ+c_y`,
        steps: [T`Divide by depth: \(X/Z\) and \(Y/Z\).`, T`Multiply by \(f_x\) and \(f_y\).`, T`Add \(c_x\) and \(c_y\), which moves the origin to the image corner.`, T`After cropping at corner \((x_0,y_0)\), subtract it from \((c_x,c_y)\). After resizing by a factor a, multiply \(f_x, f_y, c_x, c_y\) by a.`],
        examples: [[T`\(f_x=800\), \(c_x=320\), point \((0.5,0,4)\)`, T`\(u=800\cdot0.125+320=420\)`], [T`\(f_y=800\), \(c_y=240\), point \((0.5,-0.25,4)\)`, T`\(v=800\cdot(-0.0625)+240=190\)`], [T`\(f_x=500\), \(c_x=320\), point \((1,0,5)\)`, T`\(u=500\cdot0.2+320=420\)`], [T`\(f=1000\), \(c=(640,480)\); crop at \((200,100)\), resize by 0.5`, T`\(f=500\), \(c=(220,190)\)`]],
        pitfall: T`Here K is the camera’s intrinsic matrix, not a convolution kernel. A crop or resize changes K, so a depth or 3D model trained on augmented images must get the updated K.`,
        seeAlso: [52]
      },
      {
        id: 'camera-extrinsics', term: 'Extrinsics and the camera matrix', symbol: T`[R\,|\,t]`,
        plain: T`The rotation R and translation t that move a point from world coordinates into the camera’s own frame: \(X_c=RX_w+t\). Placed side by side they form a 3 × 4 matrix, and \(P=K[R\,|\,t]\) maps a homogeneous world point (X, Y, Z, 1) straight to a homogeneous pixel.`,
        formula: T`X_c=RX_w+t,\qquad \lambda\begin{bmatrix}u\\v\\1\end{bmatrix}=K\,[R\,|\,t]\begin{bmatrix}X\\Y\\Z\\1\end{bmatrix},\qquad C=-R^Tt`,
        steps: [T`Move the point into the camera frame: \(X_c=RX_w+t\).`, T`Multiply by K.`, T`Divide by the third entry λ, the depth, after checking that it is positive.`],
        examples: [[T`camera at \(C=(0,0,-5)\), \(R=I\)`, T`\(t=-RC=(0,0,5)\)`], [T`that camera with \(f=800\), \(c=(320,240)\), world point \((1,0,0)\)`, T`\(P(1,0,0,1)^T=(2400,1200,5)\), pixel \((480,240)\)`], [T`\(f=500\), \(c=(320,240)\), \(t=(0,0,1)\), world point \((0.6,0.3,2)\)`, T`\(X_c=(0.6,0.3,3)\), pixel \((420,290)\)`]],
        pitfall: T`t is not the camera’s position. The camera centre in world coordinates is \(C=-R^Tt\), and it is the one point P cannot image: \(PC=0\).`,
        seeAlso: [52]
      },
      {
        id: 'matrix-trace', term: 'Trace of a matrix', symbol: T`\operatorname{tr}(M)`,
        plain: T`The trace of a square matrix is the sum of its diagonal entries. For a 3D rotation it gives the angle: \(\operatorname{tr}R=1+2\cos\theta\), so θ is the arccos of \((\operatorname{tr}R-1)/2\), where arccos returns the angle that has a given cosine. Lesson 53 uses the trace to write sums of matching products as matrix products.`,
        formula: T`\operatorname{tr}(M)=\sum_iM_{ii},\qquad \theta=\arccos\frac{\operatorname{tr}R-1}{2},\qquad \operatorname{tr}(M^TB)=\sum_{i,j}M_{ij}B_{ij},\qquad \operatorname{tr}(ABC)=\operatorname{tr}(CAB)`,
        steps: [T`Add the diagonal entries: \(M_{11}+M_{22}+\dots\).`, T`For a rotation, compute \((\operatorname{tr}R-1)/2\), a number between −1 and 1.`, T`Take the arccos: the angle between 0° and 180° with that cosine. Python’s \(\texttt{math.acos}\) answers in radians.`, T`For \(\operatorname{tr}(M^TB)\), multiply matching entries of M and B and add them all.`],
        examples: [[T`\(\operatorname{tr}\begin{bmatrix}1&2\\3&4\end{bmatrix}\)`, T`\(1+4=5\)`], [T`\(R=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}\)`, T`trace 1; \(\arccos0=90^\circ\)`], [T`a rotation with trace 2`, T`\(\arccos0.5=60^\circ\)`], [T`\(R=\operatorname{diag}(1,-1,-1)\)`, T`trace \(-1\); \(\arccos(-1)=180^\circ\), about the x axis`], [T`\(M=\begin{bmatrix}1&2\\0&3\end{bmatrix}\), \(B=\begin{bmatrix}2&0\\1&1\end{bmatrix}\)`, T`\(\operatorname{tr}(M^TB)=2+0+0+3=5\)`]],
        pitfall: T`The trace gives the angle but not the axis; find that from \(Rn=n\). When rearranging, only cyclic moves are allowed: \(\operatorname{tr}(ABC)=\operatorname{tr}(CAB)\), but usually \(\operatorname{tr}(ABC)\ne\operatorname{tr}(BAC)\).`,
        seeAlso: [53]
      },
      {
        id: 'matrix-exponential', term: 'Axis–angle and the matrix exponential', symbol: T`R=\exp([\omega]_\times)`,
        plain: T`Store a 3D rotation by angle θ about a unit axis n as one 3-vector \(\omega=\theta n\). The matrix exponential, the series for \(e^x\) with a square matrix in place of x, turns the skew matrix \([\omega]_\times\) into the rotation itself; summed up, this is Rodrigues’ formula. Optimizers update a rotation as \(R\exp([\delta]_\times)\) for a small 3-vector δ, so the result stays a rotation.`,
        formula: T`\exp(A)=\sum_{k=0}^{\infty}\frac{A^k}{k!}=I+A+\frac{A^2}{2!}+\cdots,\qquad \exp([\omega]_\times)=I+\sin\theta\,[n]_\times+(1-\cos\theta)\,[n]_\times^2`,
        steps: [T`The factorial is \(k!=1\cdot2\cdots k\), with \(0!=1\): so 1, 1, 2, 6, 24, 120.`, T`Split ω into its angle \(\theta=\|\omega\|\) and unit axis \(n=\omega/\theta\).`, T`Build the skew matrix \([n]_\times\) (Lesson 49) and its square.`, T`Apply Rodrigues’ formula, then check \(Rn=n\) and \(R^TR=I\).`],
        examples: [[T`\(1+1+\tfrac12+\tfrac16+\tfrac1{24}+\tfrac1{120}\)`, T`\(\approx2.717\), close to \(e=\exp(1)\approx2.718\)`], [T`\(\exp\bigl(\operatorname{diag}(1,2)\bigr)\)`, T`\(\operatorname{diag}(e,e^2)\approx\operatorname{diag}(2.718,\ 7.389)\)`], [T`\(\omega=(0,0,\tfrac\pi2)\): \([n]_\times^2=\operatorname{diag}(-1,-1,0)\)`, T`\(R=\begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}\), 90° about z`], [T`small \(\delta=(0,0,0.01)\)`, T`\(\exp([\delta]_\times)\approx I+[\delta]_\times\)`]],
        pitfall: T`At θ = 180° axis–angle is not unique: ω and −ω give the same rotation. Unit quaternions \(q=(\cos\tfrac\theta2,\ \sin\tfrac\theta2\,n)\) have a similar double, q and −q, and Euler angles lock when the middle turn is 90°.`
      },
      {
        id: 'camera-calibration', term: 'Calibration and lens distortion', symbol: T`x_d=x\,(1+k_1r^2+k_2r^4)`,
        plain: T`Calibration estimates a camera’s K and its lens distortion from several photos of a flat checkerboard with known square size. Each photo gives a homography from the board to the image, and each homography gives two equations on K. Real lenses also bend straight lines; the radial model pulls or pushes points along lines through the centre.`,
        formula: T`r^2=x^2+y^2,\qquad x_d=x\,(1+k_1r^2+k_2r^4),\qquad y_d=y\,(1+k_1r^2+k_2r^4),\qquad u=f_xx_d+c_x`,
        steps: [T`Photograph the board in at least three different tilts and detect its corners.`, T`Estimate one homography per photo with the DLT; the equations they give determine K, and a least-squares refit polishes every parameter.`, T`To apply distortion to normalized coordinates \(x=X/Z\), \(y=Y/Z\): compute \(r^2\), multiply x and y by \(1+k_1r^2+k_2r^4\), then apply K.`],
        examples: [[T`\(x=0.4,\ y=0.3\), \(k_1=-0.2\), \(k_2=0\)`, T`\(r^2=0.25\), factor 0.95, point \((0.38,\ 0.285)\)`], [T`the same with \(f=800\)`, T`16 pixels left and 12 up: 20 pixels in all`], [T`\(k_1=+0.2\) instead`, T`factor 1.05, point \((0.42,\ 0.315)\)`]],
        pitfall: T`\(k_1<0\) pulls points towards the centre (barrel distortion) and \(k_1>0\) pushes them out (pincushion). The model is only valid near the centre: for \(k_1<0\) it folds back beyond \(r^2=-1/(3k_1)\).`,
        seeAlso: [52]
      }
    ]
  });

  add(52, {
    builds: [{lesson: 10, why: 'least squares and its normal equations'}, {lesson: 20, why: 'Newton steps from a second-order approximation'}, {lesson: 31, why: 'a convex loss has a single basin'}],
    recall: ['least-squares', 'jacobian', 'taylor-approximation', 'standard-deviation', 'smooth-l1-loss'],
    symbols: [
      ['ε', 'outlier fraction: the share of the data that are wrong matches', 'ransac-iteration-count'],
      ['s', 'points per minimal sample: just enough to fix the model, 2 for a line', 'ransac'],
      ['p', 'required confidence that at least one sample is free of outliers', 'ransac-iteration-count'],
      ['J', 'Jacobian of the residuals: how each residual changes with each parameter', 'gauss-newton'],
      ['λ', 'damping: shortens the step and turns it towards plain gradient descent', 'levenberg-marquardt']
    ],
    terms: [
      {
        id: 'ransac', term: 'RANSAC (random sample consensus)',
        plain: T`A way to fit a model when some of the data are plain wrong. Repeatedly fit the model exactly to a tiny random sample, count how many points agree with it, and keep the model with the most supporters. Finally refit it by least squares on those inliers only.`,
        steps: [T`Draw a minimal sample of s points: 2 for a line, 4 matches for a homography.`, T`Fit the model exactly to those s points.`, T`Count the consensus set: the points whose residual is at most the threshold τ.`, T`Keep the model with the largest consensus set, and refit it on its inliers.`],
        examples: [[T`\((0,0),(1,1),(2,2),(3,3)\) and a bad point \((4,0)\); least squares on all five`, T`\(y=0.2x+0.8\): the bad point drags the slope from 1 to 0.2`], [T`sample \(\{(1,1),(3,3)\}\), \(\tau=0.5\)`, T`\(y=x\); residuals \(0,0,0,0,-4\): 4 votes`], [T`sample \(\{(0,0),(4,0)\}\)`, T`\(y=0\); residuals \(0,1,2,3,0\): 2 votes`], [T`keep \(y=x\), refit on its 4 inliers`, T`\(y=x\) exactly`]],
        pitfall: T`RANSAC needs one clean sample, not clean data. Adding iterations will not rescue a wrong inlier threshold.`
      },
      {
        id: 'inlier-threshold', term: 'Inlier threshold', symbol: T`|r_i|\le\tau`,
        plain: T`The largest residual a point may have and still count as agreeing with a model. Base it on the noise of good measurements: if their errors are Gaussian with standard deviation σ, about 95% lie within 2σ and 99.7% within 3σ, so τ between 2σ and 3σ is a common choice.`,
        steps: [T`Estimate the noise σ of good measurements, for example from a clean calibration set.`, T`Set τ to about 2σ to 3σ.`, T`Count a point as an inlier when \(|r|\le\tau\).`],
        examples: [[T`\(\sigma=1\) pixel`, T`\(\tau\) from 2 to 3 pixels`], [T`\(\sigma=0.25\)`, T`\(\tau\) from 0.5 to 0.75`], [T`\(\tau\) too small`, T`genuine inliers are rejected and the model looks unsupported`], [T`\(\tau\) too large`, T`outliers vote and a wrong model can win`]],
        pitfall: T`The threshold is in the units of the residual. A homography residual in pixels needs a τ in pixels, measured in the image where the residual is computed.`
      },
      {
        id: 'ransac-iteration-count', term: 'How many RANSAC samples', symbol: T`N`,
        plain: T`A sample of s points is free of outliers with probability \((1-\varepsilon)^s\), so all N samples are contaminated with probability \((1-(1-\varepsilon)^s)^N\). Choose the smallest N that makes this at most \(1-p\). N grows exponentially with s and steeply with ε, but only slowly with p.`,
        formula: T`N=\left\lceil\frac{\ln(1-p)}{\ln\bigl(1-(1-\varepsilon)^s\bigr)}\right\rceil`,
        steps: [T`Probability one sample is clean: \((1-\varepsilon)^s\). The draws are treated as independent, so their probabilities multiply.`, T`Probability one sample is contaminated: \(1-(1-\varepsilon)^s\).`, T`Divide \(\ln(1-p)\) by the natural log of that probability. Both are negative, so the ratio is positive.`, T`Round up. The ceiling \(\lceil x\rceil\) is the smallest whole number at least x: \(\lceil10.32\rceil=11\).`],
        examples: [[T`\(\varepsilon=0.4,\ s=2,\ p=0.99\)`, T`\(0.6^2=0.36\); \(N=\lceil\ln0.01/\ln0.64\rceil=\lceil10.32\rceil=11\)`], [T`\(\varepsilon=0.5,\ s=2\)`, T`\(0.25\); \(N=\lceil16.01\rceil=17\)`], [T`\(\varepsilon=0.5,\ s=4\) (homography)`, T`\(N=72\)`], [T`\(\varepsilon=0.5,\ s=8\)`, T`\(N=1177\)`]],
        plot: {fn: 'x => Math.log(0.01) / Math.log(1 - Math.pow(1 - x, 2))', x: [0.05, 0.8], y: [0, 120], xLabel: 'outlier fraction ε (s = 2, p = 0.99)', yLabel: 'samples N before rounding', marks: [0.4, 0.5]},
        pitfall: T`Doubling ε does not double N. For a 4-point model, \(\varepsilon=0.25\) needs 13 samples and \(\varepsilon=0.5\) needs 72.`
      },
      {
        id: 'huber-loss', term: 'Huber loss and reweighting', symbol: T`\rho_\delta(r)`,
        plain: T`A robust loss: squared for small residuals, straight-line for large ones. Its slope, the pull a residual exerts on the fit, is capped at δ, so one wild point cannot dominate. Iteratively reweighted least squares (IRLS) minimizes it by solving weighted least-squares fits, with weight \(\min(1,\delta/|r|)\), again and again.`,
        formula: T`\rho_\delta(r)=\begin{cases}\tfrac12r^2,&|r|\le\delta\\ \delta\bigl(|r|-\tfrac12\delta\bigr),&|r|>\delta\end{cases}\qquad w(r)=\min\Bigl(1,\frac{\delta}{|r|}\Bigr)`,
        steps: [T`Compare \(|r|\) with δ.`, T`Inside the threshold: loss \(\tfrac12r^2\) and weight 1.`, T`Outside: loss \(\delta(|r|-\tfrac12\delta)\) and weight \(\delta/|r|\).`, T`IRLS: compute the weights from the current residuals, solve the weighted least-squares fit, and repeat until it settles.`],
        examples: [[T`\(\delta=1\), \(r=0.5\)`, T`loss 0.125 (same as squared), weight 1`], [T`\(\delta=1\), \(r=4\)`, T`loss 3.5 (squared: 8), weight 0.25`], [T`constant fit to \(1,2,3,4,40\)`, T`mean 10; Huber estimate 3`], [T`one IRLS round from 10`, T`weights \(\tfrac19,\tfrac18,\tfrac17,\tfrac16,\tfrac1{30}\); weighted mean 4.82, then 3.53, 3.19, …`]],
        pitfall: T`Bounded influence is not zero influence: many outliers on the same side still shift a Huber fit. Losses that ignore gross errors entirely, such as Tukey’s, are not convex and need a good start. The smooth L1 box loss of Lesson 42 is the Huber loss divided by δ.`
      },
      {
        id: 'gauss-newton', term: 'Gauss–Newton method', symbol: T`J^TJ\,\delta=-J^Tr`,
        plain: T`A way to minimize a sum of squared residuals \(E=\tfrac12\|r(\theta)\|^2\) when the model is nonlinear. Replace the residuals by their straight-line approximation \(r+J\delta\), solve that linear least-squares problem for the step δ, move, and repeat. Near a good fit it converges almost as fast as Newton’s method without any second derivatives.`,
        formula: T`J_{ij}=\frac{\partial r_i}{\partial\theta_j},\qquad J^TJ\,\delta=-J^Tr,\qquad \theta\leftarrow\theta+\delta`,
        steps: [T`Evaluate the residuals r and their Jacobian J at the current θ.`, T`Form \(J^TJ\) and \(J^Tr\). With one parameter both are single numbers.`, T`Solve \(J^TJ\,\delta=-J^Tr\) for the step.`, T`Update θ and repeat until the step is tiny.`],
        examples: [[T`\(r_1=\theta^2-4,\ r_2=\theta-2\) at \(\theta=1\)`, T`\(r=(-3,-1)\), \(J=(2,1)\), \(J^TJ=5\), \(J^Tr=-7\)`], [T`the step`, T`\(\delta=7/5=1.4\), so \(\theta=2.4\); E falls from 5 to 1.629`], [T`the next iterates`, T`2.0319, 2.0002, then 2.00000001`]],
        pitfall: T`Far from the answer the straight-line model can be poor. For \(r=(\theta^2-9,\ \theta-3)\) from \(\theta=1\), the full step lands at 4.6 and E rises from 34 to 75.2.`
      },
      {
        id: 'levenberg-marquardt', term: 'Levenberg–Marquardt method', symbol: T`(J^TJ+\lambda I)\,\delta=-J^Tr`,
        plain: T`Gauss–Newton with damping. Adding λ to the diagonal of \(J^TJ\) shortens the step: a large λ gives a short step along the negative gradient, and λ = 0 gives the Gauss–Newton step. λ is adjusted as you go, smaller after a good step and larger after a bad one.`,
        steps: [T`Solve \((J^TJ+\lambda I)\,\delta=-J^Tr\).`, T`If the new E is lower, accept the step and divide λ by 10.`, T`Otherwise reject the step, multiply λ by 10 and try again.`],
        examples: [[T`\(r=(\theta^2-4,\ \theta-2)\) at \(\theta=1\), \(\lambda=5\)`, T`\(\delta=7/(5+5)=0.7\), so \(\theta=1.7\) with \(E=0.661\)`], [T`compare the full Gauss–Newton step`, T`\(\theta=2.4\) with \(E=1.629\)`], [T`\(r=(\theta^2-9,\ \theta-3)\) at \(\theta=1\), \(\lambda=4\)`, T`\(\delta=18/(5+4)=2\), so \(\theta=3\) and \(E=0\)`]],
        pitfall: T`λ is not a fixed learning rate: the accept-or-reject rule changes it every iteration. Damping also helps when \(J^TJ\) is nearly singular because the data barely constrain some parameter.`
      }
    ]
  });

  add(53, {
    builds: [{lesson: 18, why: 'a gradient collects the partial derivatives'}, {lesson: 19, why: 'Jacobian shapes and the chain rule'}, {lesson: 38, why: 'the backward pass of a two-layer network'}],
    recall: ['matrix-trace', 'gradient-shape-rule', 'quadratic-form', 'symmetric-matrix', 'central-difference'],
    symbols: [
      ['G', 'upstream gradient ∂L/∂Y: how the loss changes with each layer output', 'linear-layer-gradients'],
      ['X', 'batch of inputs: N rows (one per example) by D columns (features)', 'linear-layer-gradients'],
      ['W', 'weight matrix: D input features by C outputs', 'linear-layer-gradients'],
      ['tr', 'trace: the sum of the diagonal entries of a square matrix (Lesson 51)'],
      ['1', 'a column of N ones; 1bᵀ copies the bias row into every example', 'linear-layer-gradients']
    ],
    terms: [
      {
        id: 'matrix-differential', term: 'The differential and reading off a gradient', symbol: T`dL=\operatorname{tr}(M^TdW)\Rightarrow\frac{\partial L}{\partial W}=M`,
        plain: T`The differential dL is the first-order change in L caused by small changes in its inputs. For a matrix variable it is the sum of each gradient entry times the change in that entry, which is a trace. So write dL, rearrange it into \(\operatorname{tr}(M^TdW)\), and M is the gradient.`,
        formula: T`dL=\sum_{i,j}\frac{\partial L}{\partial W_{ij}}\,dW_{ij}=\operatorname{tr}\Bigl(\bigl(\tfrac{\partial L}{\partial W}\bigr)^TdW\Bigr),\qquad d(AB)=dA\,B+A\,dB`,
        steps: [T`Write dL with the product rule \(d(AB)=dA\,B+A\,dB\).`, T`A single number equals its own transpose and its own trace; use that, \(\operatorname{tr}(M^T)=\operatorname{tr}(M)\) and the cyclic rule to bring dW (or dx) to the far right.`, T`Read off: whatever multiplies dW from the left is \(M^T\), and the gradient is M.`],
        examples: [[T`\(f=a^Tx\)`, T`\(df=a^Tdx\), so \(\nabla f=a\)`], [T`\(f=\operatorname{tr}(A^TW)\)`, T`\(df=\operatorname{tr}(A^TdW)\), so \(\partial f/\partial W=A\)`], [T`\(f=\|Ax-b\|^2\), with \(r=Ax-b\)`, T`\(df=2r^TA\,dx\), so \(\nabla f=2A^T(Ax-b)\)`], [T`\(A=\begin{bmatrix}1&0\\0&1\\1&1\end{bmatrix}\), \(b=(1,2,0)\), \(x=(1,1)\)`, T`\(r=(0,-1,2)\), \(\nabla f=(4,2)\)`], [T`cyclic rule: \(A=\begin{bmatrix}1&2\\3&4\end{bmatrix}\), \(B=\begin{bmatrix}0&1\\1&0\end{bmatrix}\), \(C=\operatorname{diag}(2,1)\)`, T`\(\operatorname{tr}(ABC)=\operatorname{tr}(CAB)=7\), but \(\operatorname{tr}(BAC)=8\)`]],
        pitfall: T`Read off M only after dW stands alone on the right. Reading the factor on the wrong side gives the transposed gradient, which may still have a legal shape.`
      },
      {
        id: 'quadratic-form-gradient', term: 'Gradient of a quadratic form', symbol: T`\nabla_x(x^TAx)=(A+A^T)x`,
        plain: T`A quadratic form \(x^TAx\) is a single number made from a vector x and a square matrix A, such as \(x_1^2+2x_1x_2+3x_2^2\). Its gradient is \((A+A^T)x\). The familiar shortcut 2Ax is correct only when A is symmetric, that is \(A=A^T\).`,
        formula: T`d(x^TAx)=dx^TAx+x^TA\,dx=x^T(A+A^T)\,dx`,
        steps: [T`Form \(A+A^T\) by adding A to its transpose.`, T`Multiply it by x.`, T`To check, write f out in coordinates and differentiate each variable, or use a finite difference.`],
        examples: [[T`\(A=\begin{bmatrix}1&2\\0&3\end{bmatrix}\), \(x=(1,1)\)`, T`\(f=6\); \(\nabla f=\begin{bmatrix}2&2\\2&6\end{bmatrix}x=(4,8)\)`], [T`the shortcut for the same A`, T`\(2Ax=(6,6)\): wrong, because \(A\ne A^T\)`], [T`\(A=\begin{bmatrix}1&4\\0&2\end{bmatrix}\), \(x=(1,2)\)`, T`\(\nabla f=(10,12)\), while \(2Ax=(18,8)\)`]],
        pitfall: T`A square A lets the wrong formula pass a shape check. Test any new derivation numerically, and with a non-symmetric matrix.`
      },
      {
        id: 'linear-layer-gradients', term: 'Gradients of a linear layer', symbol: T`X^TG,\ \ GW^T,\ \ G^T\mathbf 1`,
        plain: T`For a linear layer \(Y=XW+\mathbf 1b^T\), the layers above hand back \(G=\partial L/\partial Y\), shaped like Y. From G alone the layer gets its weight gradient \(X^TG\), its bias gradient (the column sums of G) and the gradient \(GW^T\) it passes down to the layer below.`,
        formula: T`\frac{\partial L}{\partial W}=X^TG,\qquad \frac{\partial L}{\partial X}=GW^T,\qquad \frac{\partial L}{\partial b}=G^T\mathbf 1`,
        steps: [T`Check shapes: X is N × D, W is D × C, G is N × C.`, T`Weight gradient: \(X^TG\), which is D × C like W.`, T`Bias gradient: add up each column of G, giving C numbers like b.`, T`Input gradient: \(GW^T\), which is N × D like X.`],
        examples: [[T`\(X=\begin{bmatrix}1&0&2\\0&1&1\end{bmatrix}\), \(G=\begin{bmatrix}1&-1\\0&2\end{bmatrix}\)`, T`\(X^TG=\begin{bmatrix}1&-1\\0&2\\2&0\end{bmatrix}\)`], [T`the same G`, T`bias gradient \((1,1)\)`], [T`with \(W=\begin{bmatrix}1&0\\0&1\\1&-1\end{bmatrix}\)`, T`\(GW^T=\begin{bmatrix}1&-1&2\\0&2&-2\end{bmatrix}\)`], [T`shapes: X 32 × 512, W 512 × 10, G 32 × 10`, T`\(X^TG\) is 512 × 10 like W; \(GW^T\) is 32 × 512 like X`]],
        pitfall: T`The bias is shared by every row, so its gradient sums over the batch. If the loss is a mean over the batch, the 1/N is already inside G; do not divide again.`
      },
      {
        id: 'finite-difference-step-size', term: 'Choosing the finite-difference step', symbol: T`h\approx\epsilon_{\text{mach}}^{1/3}`,
        plain: T`A finite difference trades two errors. Truncation error, from the formula itself, shrinks as h shrinks; rounding error, from storing numbers to about 16 digits, grows as h shrinks. Machine epsilon, about \(2.2\times10^{-16}\), is the gap between 1 and the next double-precision number. The best h is near \(6\times10^{-6}\) for a central difference and \(10^{-8}\) for a forward one.`,
        formula: T`\text{central: }\frac{h^2|f'''|}{6}+\frac{\epsilon_{\text{mach}}|f|}{h},\qquad \text{forward: }\frac{h|f''|}{2}+\frac{\epsilon_{\text{mach}}|f|}{h}`,
        steps: [T`Use a central difference with h around \(10^{-5}\), in double precision.`, T`Compare with the analytic entry by relative error: about \(10^{-10}\) supports a correct formula; \(10^{-2}\) or more at every h points to a bug.`, T`If unsure, sweep h over several powers of ten: the total error is U-shaped in h.`],
        examples: [[T`\(f=e^x\) at \(x=1\), central, \(h=10^{-2}\); \(10^{-5}\); \(10^{-10}\)`, T`errors \(4.5\times10^{-5}\); \(5.9\times10^{-11}\); \(6.7\times10^{-7}\)`], [T`the same, forward, \(h=10^{-5}\); \(10^{-8}\)`, T`errors \(1.4\times10^{-5}\); \(6.6\times10^{-9}\)`], [T`\(x^TAx\), \(A=\begin{bmatrix}1&4\\0&2\end{bmatrix}\), \(x=(1,2)\), \(h=0.1\), along \(x_1\)`, T`central 10 (exact, since \(f'''=0\)); forward 10.1`]],
        pitfall: T`A smaller h is not always better: far below \(10^{-6}\) rounding error takes over, and even a correct gradient can seem to fail the check.`
      }
    ]
  });

  add(54, {
    builds: [{lesson: 4, why: 'surprise as a negative logarithm'}, {lesson: 27, why: 'softmax and the cross-entropy loss'}, {lesson: 6, why: 'cosine similarity of unit vectors'}],
    recall: ['natural-logarithm', 'softmax', 'cross-entropy', 'cosine-similarity', 'chance-level-loss'],
    symbols: [
      ['H(p)', 'entropy of the target: its average surprise, a floor for the loss', 'entropy'],
      ['H(p,q)', 'cross-entropy: average surprise when outcomes follow p but are scored by q'],
      ['KL(p‖q)', 'Kullback–Leibler divergence: the extra loss from using q instead of p', 'kl-divergence'],
      ['ε', 'label smoothing: the share of probability moved off the true class', 'label-smoothing'],
      ['τ', 'temperature: divides similarities before the softmax; small τ sharpens it', 'softmax-temperature']
    ],
    terms: [
      {
        id: 'entropy', term: 'Entropy', symbol: T`H(p)`,
        plain: T`The average surprise of outcomes drawn from a distribution p, where an outcome of probability \(p_k\) has surprise \(-\ln p_k\). It is 0 when one outcome is certain and largest, \(\ln K\), when all K outcomes are equally likely. For a training target it is the floor that no prediction can beat.`,
        formula: T`H(p)=-\sum_{k=1}^{K}p_k\ln p_k,\qquad 0\le H(p)\le\ln K,\qquad 0\ln0=0`,
        steps: [T`For each class compute \(-p_k\ln p_k\); classes with \(p_k=0\) add nothing.`, T`Add them up. With ln the unit is the nat.`, T`Compare with the largest possible value, \(\ln K\).`],
        examples: [[T`\((1,0,0,0)\)`, T`0: nothing is uncertain`], [T`\((\tfrac14,\tfrac14,\tfrac14,\tfrac14)\)`, T`\(\ln4=1.386\) nats, the maximum for 4 classes`], [T`\((\tfrac12,\tfrac14,\tfrac14)\)`, T`1.040 nats`], [T`\((0.925,0.025,0.025,0.025)\)`, T`0.349 nats`]],
        plot: {fn: 'x => -(x * Math.log(x) + (1 - x) * Math.log(1 - x))', x: [0.01, 0.99], y: [0, 0.8], xLabel: 'probability of class 1 (two classes)', yLabel: 'entropy H (nats)', marks: [0.1, 0.5]},
        pitfall: T`Here H is entropy, not a Hessian or a homography. Entropy belongs to the target: training cannot lower it, only the mismatch on top of it.`
      },
      {
        id: 'kl-divergence', term: 'Kullback–Leibler divergence', symbol: T`\mathrm{KL}(p\,\|\,q)`,
        plain: T`A measure of how badly a model distribution q matches a target p: the extra average surprise from scoring outcomes with q instead of p. It is never negative and is 0 only when q = p. Cross-entropy is entropy plus KL, so with a fixed target, training on cross-entropy shrinks the KL divergence.`,
        formula: T`\mathrm{KL}(p\,\|\,q)=\sum_kp_k\ln\frac{p_k}{q_k},\qquad H(p,q)=-\sum_kp_k\ln q_k=H(p)+\mathrm{KL}(p\,\|\,q)`,
        steps: [T`For each class with \(p_k>0\), compute \(p_k\ln(p_k/q_k)\).`, T`Add them up.`, T`Check: cross-entropy minus entropy gives the same number.`],
        examples: [[T`\(p=(0.5,0.5)\), \(q=(0.8,0.2)\)`, T`\(\mathrm{KL}(p\|q)=0.223\), but \(\mathrm{KL}(q\|p)=0.193\)`], [T`\(p=(0.5,0.5)\), \(q=(0.9,0.1)\)`, T`\(\mathrm{KL}(p\|q)=0.511\), \(\mathrm{KL}(q\|p)=0.368\)`], [T`one-hot target, \(q_t=0.7\)`, T`\(\mathrm{KL}=-\ln0.7=0.357\), equal to the cross-entropy`]],
        pitfall: T`KL is not a distance: swapping p and q usually changes it. It is infinite if q gives probability 0 to a class that p allows.`
      },
      {
        id: 'bits-and-nats', term: 'Logarithm base 2, bits and nats', symbol: T`\log_2x=\frac{\ln x}{\ln2}`,
        plain: T`\(\log_2x\) asks “which power of 2 gives x?”, just as ln asks about powers of e. Information measured with ln is in nats; measured with \(\log_2\) it is in bits, the number of fair yes-or-no questions. Convert nats to bits by dividing by \(\ln2\approx0.693\).`,
        formula: T`\log_2x=\frac{\ln x}{\ln2},\qquad \text{bits}=\frac{\text{nats}}{\ln2},\qquad \log_2(2x)=\log_2x+1`,
        steps: [T`For a power of 2, count: \(\log_28=3\) because \(2^3=8\).`, T`Otherwise divide: \(\log_2x=\ln x/\ln2\).`, T`To convert an entropy from nats to bits, divide by \(\ln2\).`],
        examples: [[T`\(\log_28\)`, T`3`], [T`\(\log_20.5\)`, T`\(-1\): halving lowers it by 1`], [T`\(\log_2(96/224)\)`, T`\(\approx-1.222\)`], [T`\(\ln4=1.386\) nats; 1.040 nats`, T`2 bits; 1.5 bits`]],
        pitfall: T`An entropy without a unit is ambiguous: 1 nat is about 1.44 bits. State which logarithm you used.`
      },
      {
        id: 'label-smoothing', term: 'Label smoothing', symbol: T`p=(1-\varepsilon)y+\frac{\varepsilon}{K}`,
        plain: T`Replace the one-hot training label by a slightly softer target: take ε of the probability off the true class and spread it evenly over all K classes. The best logits are then a finite distance apart, so the loss stops rewarding ever larger, overconfident scores.`,
        formula: T`p_t=1-\varepsilon+\frac{\varepsilon}{K},\qquad p_j=\frac{\varepsilon}{K},\qquad z_t^\star-z_j^\star=\ln\frac{p_t}{p_j}`,
        steps: [T`True class: \(1-\varepsilon+\varepsilon/K\). Every other class: \(\varepsilon/K\).`, T`Check that the target sums to 1.`, T`The best logit gap between the true class and any other is \(\ln(p_t/p_j)\).`],
        examples: [[T`\(K=4,\ \varepsilon=0.1\)`, T`\((0.925,0.025,0.025,0.025)\); entropy 0.349 nats`], [T`its best logit gap`, T`\(\ln(0.925/0.025)=\ln37\approx3.61\)`], [T`\(K=5,\ \varepsilon=0.2\)`, T`\((0.84,0.04,0.04,0.04,0.04)\); gap \(\ln21\approx3.04\)`], [T`\(\varepsilon=0\) (one-hot)`, T`the best gap is infinite`]],
        pitfall: T`With smoothing the gradient on the logits is \(q-p\), not \(q-y\). Once \(q_t\) passes \(p_t\) (0.925 above), gradient descent pushes the true-class logit back down.`
      },
      {
        id: 'infonce-loss', term: 'Contrastive loss (InfoNCE)', symbol: T`L=-\ln\frac{e^{s^+/\tau}}{\sum_je^{s_j/\tau}}`,
        plain: T`Contrastive learning trains embeddings so that matching pairs, such as an image and its caption, are more similar than non-matching ones. InfoNCE scores one anchor against N candidates by cosine similarity, divides by a temperature τ, and applies softmax cross-entropy with the true partner as the correct class.`,
        steps: [T`Normalize every embedding to length 1 and compute the cosine similarities \(s_j\).`, T`Divide every similarity by τ to get logits.`, T`Apply the softmax and take minus the log of the true partner’s probability.`],
        examples: [[T`\(s=(0.8,0.2,0.1,-0.3)\), first is the partner, \(\tau=0.1\)`, T`logits \((8,2,1,-3)\); \(L=0.0034\)`], [T`the same with \(\tau=1\)`, T`\(L=0.866\)`], [T`\(s=(0.6,0.2,0,-0.2)\), \(\tau=0.2\)`, T`logits \((3,1,0,-1)\); \(L=0.185\)`], [T`all similarities equal, \(N=4\)`, T`\(L=\ln4=1.386\): chance level`]],
        pitfall: T`A loss near \(\ln N\) means the similarities carry no information, not that training has nearly finished. The loss can never certify more than \(\ln N\) nats, one reason contrastive methods use large batches.`
      },
      {
        id: 'softmax-temperature', term: 'Softmax temperature', symbol: T`\operatorname{softmax}(z/T)`,
        plain: T`Dividing logits by a temperature before the softmax controls how peaked the probabilities are: below 1 sharpens them towards one-hot, above 1 flattens them towards uniform. Contrastive losses use a small τ; knowledge distillation uses a large T, so a student can see how a teacher ranks the wrong classes.`,
        formula: T`p_k=\frac{e^{z_k/T}}{\sum_je^{z_j/T}}`,
        steps: [T`Divide every logit by the temperature.`, T`Apply the softmax as usual.`, T`For distillation, compare softened teacher and student outputs with \(T^2\,\mathrm{KL}(p^T\|q^T)\); the \(T^2\) keeps gradient sizes comparable.`],
        examples: [[T`teacher logits \((3,1,0)\), \(T=1\)`, T`\((0.844,\ 0.114,\ 0.042)\)`], [T`the same, \(T=4\)`, T`\((0.481,\ 0.292,\ 0.227)\)`], [T`the same, \(T=0.5\)`, T`\((0.980,\ 0.018,\ 0.002)\)`], [T`cosines in \([-1,1]\), \(\tau=1\), 4 candidates`, T`best possible InfoNCE loss \(\ln(1+3e^{-2})=0.341\)`]],
        pitfall: T`Temperature changes how confident the probabilities are, never their order: the largest logit stays the most likely class.`
      }
    ]
  });

  add(55, {
    builds: [{lesson: 6, why: 'a dot product scores how well two vectors align'}, {lesson: 27, why: 'softmax turns scores into weights that sum to 1'}, {lesson: 41, why: 'the inductive bias that convolutions build in'}],
    recall: ['dot-product', 'softmax', 'natural-logarithm', 'layer-normalization', 'translation-equivariance'],
    symbols: [
      ['Q, K, V', 'queries, keys and values: three learned linear maps of the same tokens', 'query-key-value'],
      ['A', 'attention weights: row i says how much token i takes from each token', 'scaled-dot-product-attention'],
      ['√d', 'divide scores by √d so they do not grow with the head width d', 'scaled-dot-product-attention'],
      ['X', 'token matrix: one row per token (patches and class token), D features each', 'patch-embedding'],
      ['N', 'number of tokens: (H/P)(W/P) patches, plus one class token', 'patch-embedding']
    ],
    terms: [
      {
        id: 'patch-embedding', term: 'Patches as tokens', symbol: T`N=\frac HP\cdot\frac WP`,
        plain: T`A vision transformer cuts an H × W image into non-overlapping P × P patches, flattens each into P·P·C numbers and multiplies it by one shared matrix to get a D-dimensional token. The tokens are the rows of X. This is the same as a P × P convolution with stride P.`,
        steps: [T`Patches per side: \(H/P\) and \(W/P\); multiply them for N.`, T`Length of one flattened patch: \(P\cdot P\cdot C\).`, T`Multiply each flattened patch by the shared embedding matrix, which has P·P·C rows and D columns.`, T`Add the positional embeddings and put the class token in front: X has N + 1 rows.`],
        examples: [[T`224 × 224 × 3, \(P=16\)`, T`\(14\times14=196\) patches of 768 numbers`], [T`the same image, \(P=8\)`, T`784 patches; query–key pairs grow from 38,416 to 614,656`], [T`the same image, \(P=32\)`, T`49 patches: cheap but coarse`], [T`384 × 384 × 3, \(P=16\), with class token`, T`577 tokens; \(577^2=332{,}929\) attention entries per head`]],
        pitfall: T`Attention cost grows with \(N^2\): halving the patch size makes 4 times as many tokens and 16 times as many score pairs.`
      },
      {
        id: 'positional-embedding', term: 'Positional embedding and class token',
        plain: T`Attention on its own treats the tokens as an unordered set: shuffle them and the outputs shuffle the same way. A vision transformer therefore adds a learned D-vector to each token that encodes which patch position it came from. A learnable class token is placed in front, and its final state feeds the classifier.`,
        steps: [T`Learn one D-vector per patch position, for example 196 of them for a 14 × 14 grid.`, T`Add it to the patch token at that position.`, T`Prepend one learnable class token; after the last block, feed its output to the softmax head.`],
        examples: [[T`196 patches plus the class token`, T`X has 197 rows`], [T`shuffle the patches, no positional embeddings`, T`outputs are shuffled identically; the class-token output does not change`], [T`with positional embeddings`, T`the same patch content at a new position gives a different token`]],
        pitfall: T`Without positional embeddings a ViT cannot tell a picture from a shuffled version of its patches.`
      },
      {
        id: 'query-key-value', term: 'Queries, keys and values', symbol: T`Q=XW_Q,\ K=XW_K,\ V=XW_V`,
        plain: T`Each token is mapped by three learned matrices into a query (what it is looking for), a key (what it offers to be matched on) and a value (the content it passes on). A query–key dot product scores how relevant one token is to another; the values are what gets averaged.`,
        steps: [T`Multiply the token matrix X by \(W_Q\), \(W_K\) and \(W_V\), each with D rows and d columns.`, T`Row i of Q is token i’s query; row j of K and of V are token j’s key and value.`, T`Score token j for token i with the dot product \(q_i^Tk_j\).`],
        examples: [[T`\(q=(3,1,1,0)\), \(k_1=(1,0,0,1)\)`, T`score 3`], [T`the same q, \(k_2=(0,1,1,0)\)`, T`score 2`], [T`the same q, \(k_3=(-1,0,1,1)\)`, T`score \(-2\)`]],
        pitfall: T`Here K holds keys, not a convolution kernel or a camera matrix. In self-attention Q, K and V all come from the same tokens, through different matrices.`
      },
      {
        id: 'scaled-dot-product-attention', term: 'Scaled dot-product attention', symbol: T`\operatorname{softmax}\!\Bigl(\frac{QK^T}{\sqrt d}\Bigr)V`,
        plain: T`Score every query against every key, divide by √d, turn each row of scores into weights with a softmax, and output for each token the weighted average of all value vectors. The weights are recomputed for every image, unlike the fixed weights of a convolution kernel.`,
        formula: T`A=\operatorname{softmax}\!\Bigl(\frac{QK^T}{\sqrt d}\Bigr),\qquad Y=AV,\qquad \sum_jA_{ij}=1`,
        steps: [T`Scores: \(s_j=q^Tk_j\).`, T`Divide by \(\sqrt d\), where d is the width of a query or key.`, T`Softmax along the row: \(a_j=e^{\ell_j}/\sum_me^{\ell_m}\); the weights are positive and sum to 1.`, T`Output: \(o=\sum_ja_jv_j\), a weighted average of the values.`],
        examples: [[T`scores \((3,2,-2)\), \(d=4\)`, T`\((1.5,1,-1)\); weights \((0.592,0.359,0.049)\)`], [T`values \((1,0),(0,1),(-1,-1)\)`, T`output \((0.544,\ 0.311)\)`], [T`the same without dividing by \(\sqrt d\)`, T`weights \((0.727,0.268,0.005)\): more peaked`], [T`\(d=64\), two scores 16 apart`, T`softmax \(\approx(0.9999999,\ 10^{-7})\); after \(/\sqrt{64}\): \((0.881,\ 0.119)\)`]],
        pitfall: T`Without the √d the scores spread out like √d, the softmax saturates to nearly one-hot and the losing keys get almost no gradient.`
      },
      {
        id: 'multi-head-attention', term: 'Multi-head attention', symbol: T`d=D/h`,
        plain: T`Run h attention heads side by side, each with its own \(W_Q, W_K, W_V\) of width \(d=D/h\), so different heads can attend for different reasons. Concatenate their N × d outputs into one N × D matrix and mix it with one more D × D matrix \(W_O\).`,
        steps: [T`Head width: \(d=D/h\).`, T`Compute scaled dot-product attention separately in each head.`, T`Place the h outputs side by side: N × D.`, T`Multiply by \(W_O\).`],
        examples: [[T`ViT-Base: \(D=768\), \(h=12\)`, T`\(d=64\), so \(\sqrt d=8\)`], [T`\(D=384\), \(h=6\)`, T`\(d=64\)`], [T`12 heads, 197 tokens`, T`12 attention matrices, each 197 × 197`]],
        pitfall: T`More heads at the same D does not add parameters to the query, key and value maps: it splits the same width into narrower heads.`
      },
      {
        id: 'residual-connection', term: 'Residual connections and the pre-norm block', symbol: T`y=x+F(x)`,
        plain: T`Each sub-layer’s output is added back to its own input, so the sub-layer only has to learn a correction. Its Jacobian is \(I+J_F\): the identity part gives gradients a direct path through many blocks. A pre-norm transformer block does this twice, normalizing before each sub-layer: \(z=x+\operatorname{MSA}(\operatorname{LN}(x))\), then \(x'=z+\operatorname{MLP}(\operatorname{LN}(z))\).`,
        formula: T`y=x+F(x),\qquad \frac{\partial y}{\partial x}=I+J_F,\qquad z=x+\operatorname{MSA}\bigl(\operatorname{LN}(x)\bigr),\quad x'=z+\operatorname{MLP}\bigl(\operatorname{LN}(z)\bigr)`,
        steps: [T`Layer-normalize each token, apply multi-head attention (MSA), and add the result to the input.`, T`Layer-normalize again, apply the MLP to each token separately, and add again.`, T`Backward: the gradient arriving at y passes to x through \(I+J_F\), that is unchanged plus the sub-layer’s share.`],
        examples: [[T`token \(x=(1,2)\), sub-layer output \((0.1,-0.3)\)`, T`\(y=(1.1,\ 1.7)\)`], [T`\(F(x)=Wx\) with \(W=\begin{bmatrix}0.1&0.2\\0&-0.3\end{bmatrix}\)`, T`Jacobian \(I+W=\begin{bmatrix}1.1&0.2\\0&0.7\end{bmatrix}\)`], [T`a sub-layer that outputs zeros`, T`\(y=x\), Jacobian I: the block passes x and its gradient straight through`]],
        pitfall: T`Here “residual” means a skip-and-add path, not the error \(y-\hat y\) of least squares. Only the attention step mixes tokens; the MLP acts on each token separately.`
      }
    ]
  });

  add(56, {
    builds: [{lesson: 33, why: 'blur before halving, or detail aliases'}, {lesson: 35, why: 'stride and receptive field of a feature map'}, {lesson: 43, why: 'segmentation needs a label at every pixel'}],
    recall: ['aliasing', 'stride', 'receptive-field', 'floor-function', 'natural-logarithm'],
    symbols: [
      ['Gₖ', 'Gaussian pyramid level k: the image blurred and halved k times', 'gaussian-pyramid'],
      ['Lₖ', 'Laplacian level k: the detail lost by one blur-and-halve step', 'laplacian-pyramid'],
      ['up', 'upsampling: double the height and width of a map', 'upsampling'],
      ['Pₖ', 'FPN output level k, stride 2ᵏ: its own resolution plus deep features', 'feature-pyramid-network'],
      ['Cₖ', 'backbone feature map at stride 2ᵏ, before the top-down merge', 'feature-pyramid-network']
    ],
    terms: [
      {
        id: 'gaussian-pyramid', term: 'Gaussian pyramid', symbol: T`G_{k+1}=\operatorname{down}_2(g*G_k)`,
        plain: T`A stack of ever smaller copies of an image: blur, keep every second pixel in each direction, and repeat. The blur removes detail the coarser grid cannot represent, which would otherwise alias into false patterns. Each level has a quarter of the pixels of the one below.`,
        steps: [T`Blur the current level: pair averages in 1D, a small Gaussian kernel g in 2D.`, T`Keep every second sample in each direction.`, T`Repeat on the result until the level is small enough.`],
        examples: [[T`1D: \(G_0=(4,6,10,2)\)`, T`\(G_1=(5,6)\), \(G_2=(5.5)\)`], [T`512 × 512 image`, T`levels 256, 128, 64, …`], [T`storage of all levels`, T`\(1+\tfrac14+\tfrac1{16}+\dots<\tfrac43\) of the image`]],
        pitfall: T`Dropping every second pixel without blurring first aliases: fine stripes can turn into false coarse patterns.`
      },
      {
        id: 'laplacian-pyramid', term: 'Laplacian pyramid', symbol: T`L_k=G_k-\operatorname{up}(G_{k+1})`,
        plain: T`Stores what each blur-and-halve step lost: each level is a Gaussian level minus the upsampled next level, and the top is the smallest Gaussian level. Adding the stored differences back, from the top down, rebuilds the image exactly, for any blur, as long as the same upsampling is used both ways.`,
        formula: T`L_k=G_k-\operatorname{up}(G_{k+1})\ (k<n),\qquad L_n=G_n,\qquad G_k=L_k+\operatorname{up}(G_{k+1})`,
        steps: [T`Upsample the next coarser level to the current size.`, T`Subtract it from the current Gaussian level: that difference is \(L_k\).`, T`Keep the smallest Gaussian level as the top, \(L_n=G_n\).`, T`To rebuild, start at the top: upsample, add the next L, and repeat.`],
        examples: [[T`\(G_0=(4,6,10,2)\), \(\operatorname{up}(G_1)=(5,5,6,6)\)`, T`\(L_0=(-1,1,4,-4)\)`], [T`\(G_1=(5,6)\), \(\operatorname{up}(G_2)=(5.5,5.5)\)`, T`\(L_1=(-0.5,0.5)\), \(L_2=(5.5)\)`], [T`rebuild`, T`\((5,6)\), then \((4,6,10,2)\) exactly`], [T`rebuild with \(L_0\) set to 0`, T`\((5,5,6,6)\): the error is exactly \(L_0\)`]],
        pitfall: T`Upsampling a coarse level alone cannot bring lost detail back; you need the stored differences, just as a U-Net decoder needs its skip connections.`
      },
      {
        id: 'upsampling', term: 'Upsampling and transposed convolution', symbol: T`n_{\rm out}=(n-1)s-2p+k+q`,
        plain: T`Making a map larger. Nearest neighbour repeats each value; bilinear interpolation blends neighbours; both have no parameters. A transposed convolution is learned: it places a copy of the kernel, scaled by each input value, every s output positions and adds up the overlaps.`,
        formula: T`n_{\rm out}=(n-1)s-2p+k+q\qquad(\text{input }n,\ \text{kernel }k,\ \text{stride }s,\ \text{padding }p,\ \text{output padding }q)`,
        steps: [T`Nearest neighbour by 2: repeat each value twice along each axis.`, T`For a transposed convolution, put n, k, s, p and q into the size formula.`, T`Prefer a kernel size that is a multiple of the stride, or resize and then apply an ordinary convolution, to avoid checkerboard patterns.`],
        examples: [[T`nearest neighbour on \((5,6)\)`, T`\((5,5,6,6)\)`], [T`\(n=16,\ k=4,\ s=2,\ p=1\)`, T`\(15\cdot2-2+4=32\): an exact doubling`], [T`\(n=16,\ k=3,\ s=2,\ p=1\)`, T`31; with output padding \(q=1\), 32`]],
        pitfall: T`With \(k=3\) and \(s=2\), interior outputs alternately receive one and two kernel taps, which can print a checkerboard until the weights compensate.`
      },
      {
        id: 'feature-pyramid-network', term: 'Feature pyramid network (FPN)', symbol: T`P_k=\operatorname{up}(P_{k+1})+\operatorname{conv}_{1\times1}(C_k)`,
        plain: T`A network add-on that gives every resolution deep, meaningful features. Starting from the coarsest backbone map, it upsamples by 2 and adds a 1 × 1 convolution of the backbone map at that scale, level by level. Each object is then handled on the level that suits its size.`,
        formula: T`k=\Bigl\lfloor4+\log_2\frac{\sqrt{wh}}{224}\Bigr\rfloor,\ \text{clamped to }2\le k\le5`,
        steps: [T`Level k has stride \(2^k\), so its map side is \(S/2^k\).`, T`\(\log_2x\) asks which power of 2 gives x; on a calculator, \(\log_2x=\ln x/\ln2\).`, T`For a box of w × h pixels compute \(4+\log_2(\sqrt{wh}/224)\).`, T`Round down: the floor \(\lfloor x\rfloor\) is the largest whole number not above x. Then clamp to the levels that exist, 2 to 5.`, T`The box spans \(\sqrt{wh}/2^k\) cells of its level.`],
        examples: [[T`512 × 512 image`, T`map sides 128, 64, 32, 16 on \(P_2\) to \(P_5\)`], [T`96 × 96 box`, T`\(4+\log_2(96/224)=2.78\), so \(P_2\); 24 cells`], [T`224 × 224 box; 448 × 448 box`, T`\(P_4\) and \(P_5\); 14 cells each`], [T`40 × 40 box`, T`\(1.51\), floor 1, clamped to \(P_2\)`]],
        pitfall: T`The lateral 1 × 1 convolution changes only the number of channels, so every level has the same width (256) and one detection head can be shared.`
      },
      {
        id: 'anchor-box', term: 'Anchor boxes', symbol: T`N_k=n_k^2A`,
        plain: T`Reference boxes placed at every cell of every feature level. The detector scores each anchor and adjusts it to fit a nearby object. In the FPN region proposal network, level k uses anchors of side \(8\cdot2^k\) pixels in A aspect ratios, so a level with an \(n_k\times n_k\) map holds \(n_k^2A\) anchors.`,
        steps: [T`Find each level’s map side \(n_k=S/2^k\).`, T`Multiply \(n_k^2\) by the number of anchors per cell, A.`, T`Add over the levels for the total.`],
        examples: [[T`512 × 512, \(A=3\), \(P_2\)`, T`\(128^2\cdot3=49{,}152\)`], [T`the same, \(P_3,P_4,P_5\)`, T`12,288; 3,072; 768. Total 65,280`], [T`640 × 640, \(A=3\)`, T`76,800; 19,200; 4,800; 1,200. Total 102,000`], [T`anchor sides on \(P_2\) to \(P_5\)`, T`32, 64, 128, 256 pixels`]],
        pitfall: T`About three quarters of the anchors sit on the finest level, and doubling the image side multiplies every count by four.`
      },
      {
        id: 'skip-connection', term: 'U-Net skip connection',
        plain: T`U-Net has an encoder that shrinks the image while gathering context and a decoder that grows it back. At each scale the decoder concatenates the encoder map of the same size, a skip connection, which returns the precise locations that striding removed, so masks keep sharp boundaries.`,
        steps: [T`Upsample the decoder map to the next scale.`, T`Concatenate the encoder map with the same height and width along the channel axis.`, T`Convolve to mix the two; a final 1 × 1 convolution gives one logit per class at every pixel.`],
        examples: [[T`at 32 × 32: 512 upsampled + 512 skipped channels`, T`1024 channels before the next convolutions`], [T`256 × 256 × 3 input, C classes`, T`output logits 256 × 256 × C`], [T`FPN merge of two 256-channel maps`, T`adds them: still 256 channels`]],
        pitfall: T`FPN adds the two streams, so channel counts must match; U-Net concatenates them, so channel counts add up. Mixing the conventions breaks the next layer’s shape.`
      }
    ]
  });
})();
