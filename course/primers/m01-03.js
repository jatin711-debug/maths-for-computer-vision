/* Primers for Modules 01-03 (Lessons 01-12). Schema: see ../primers.js. T`...` keeps TeX backslashes literal. */
(() => {
  'use strict';
  const T = String.raw;
  const add = window.CV_PRIMER.add;

  add(1, {
    symbols: [
      ['I', 'the input image: a grid of pixel values, one number per location', 'pixel'],
      ['r, c', 'row number and column number that pick out one pixel, counted from 0 here', 'pixel'],
      ['a, b', 'a multiplies every pixel (the scale); b is then added to every pixel (the offset)', 'affine-map']
    ],
    terms: [
      {
        id: 'pixel', term: 'Pixel and pixel value', symbol: T`I_{r,c}`,
        plain: T`A digital image is a grid of tiny squares called pixels, and each pixel stores one number. In an 8-bit grayscale image that number runs from 0 (black) to 255 (white). \(I_{r,c}\) means the value in row \(r\), column \(c\). This course counts rows and columns from 0, so the top-left pixel is \(I_{0,0}\).`,
        formula: T`I=\begin{bmatrix}I_{0,0}&I_{0,1}\\I_{1,0}&I_{1,1}\end{bmatrix}=\begin{bmatrix}20&60\\100&140\end{bmatrix}`,
        steps: [T`Find the row: count down from the top, starting at 0.`, T`Find the column: count across from the left, starting at 0.`, T`Read the number where they meet. To rescale it into the range 0 to 1, divide by 255.`],
        examples: [[T`\(I_{0,1}\)`, T`\(60\) (top row, right column)`], [T`\(I_{1,1}\)`, T`\(140\) (bottom row, right column)`], [T`\(60/255\)`, T`\(\approx0.235\)`], [T`\(255/255\)`, T`\(1\), which is white`]],
        pitfall: T`Many maths books count from 1, so their \(I_{1,1}\) is this course’s \(I_{0,0}\). Check the convention before reading an index. A colour image stores three numbers per pixel: red, green and blue.`,
        seeAlso: [33, 35]
      },
      {
        id: 'array-shape', term: 'Scalar, vector, matrix and shape', symbol: T`I\in\mathbb R^{2\times2}`,
        plain: T`One number is a scalar. An ordered list of numbers is a vector, and a grid with rows and columns is a matrix. Arrays with more axes, such as height, width and colour channel, are often called tensors. The shape lists the length of each axis. \(\mathbb R\) stands for the real numbers, so \(I\in\mathbb R^{2\times2}\) says “I is a 2-by-2 grid of real numbers”.`,
        formula: T`\text{number of values}=\text{product of the shape}:\qquad(32,32,3)\ \Rightarrow\ 32\cdot32\cdot3=3072`,
        steps: [T`Count the length of each axis in order: rows, then columns, then any channel or batch axis.`, T`Write the shape as a list, such as \((2,2)\) or \((32,32,3)\).`, T`Multiply the lengths to get the number of stored values.`, T`To flatten a matrix in row order, read the top row from left to right, then the next row, and so on.`],
        examples: [[T`\(\begin{bmatrix}20&60\\100&140\end{bmatrix}\)`, T`shape \((2,2)\): four values`], [T`flatten it in row order`, T`\([20,60,100,140]\), a vector of length 4`], [T`one \(32\times32\) RGB image`, T`\(32\cdot32\cdot3=3072\) values`], [T`a batch of 8 RGB images, each \(28\times28\)`, T`shape \((8,28,28,3)\): \(18{,}816\) values`]],
        pitfall: T`Flattening keeps the values but drops the shape. Without knowing the image was 2 by 2, the list \([20,60,100,140]\) could be a 1-by-4 image, and you would lose which pixels are neighbours.`,
        seeAlso: [5, 35, 37]
      },
      {
        id: 'affine-map', term: 'Scale and offset (affine map)', symbol: T`J=aI+b`,
        plain: T`Multiply every pixel by the same number \(a\) (the scale), then add the same number \(b\) (the offset). Scaling stretches or shrinks the differences between pixels; the offset moves every value by the same amount and leaves differences alone. A scale followed by an offset is called an affine map. With no offset, \(b=0\), it is linear.`,
        formula: T`J_{r,c}=a\,I_{r,c}+b\quad\text{for every row }r\text{ and column }c`,
        steps: [T`Multiply each entry by \(a\).`, T`Add \(b\) to each result. Keep the order: scale first, then offset.`, T`Check one entry by hand, for example the top-right pixel.`],
        examples: [[T`\(a=0.5,\ b=10\), pixel \(60\)`, T`\(0.5\cdot60+10=40\)`], [T`the same rule on \(\begin{bmatrix}20&60\\100&140\end{bmatrix}\)`, T`\(\begin{bmatrix}20&40\\60&80\end{bmatrix}\)`], [T`difference \(100-60=40\)`, T`becomes \(60-40=20\): halved by the scale, untouched by the offset`]],
        pitfall: T`Order matters. Adding 10 first and then halving gives \(0.5\cdot(60+10)=35\), not 40, because the offset gets halved too.`,
        seeAlso: [2, 7, 37]
      },
      {
        id: 'mean', term: 'Mean (average)', symbol: T`\bar x`,
        plain: T`The mean adds up all the values and divides by how many there are. It compresses many numbers into one typical value, such as the average brightness of an image, but it says nothing about where the bright pixels are.`,
        formula: T`\text{mean}=\frac{\text{sum of the values}}{\text{number of values}},\qquad\text{mean}(aI+b)=a\cdot\text{mean}(I)+b`,
        steps: [T`Add every value once.`, T`Divide by the number of values.`, T`After a scale and offset you need not add again: scale the old mean, then add the offset.`],
        examples: [[T`\(20,60,100,140\)`, T`\(320/4=80\)`], [T`\(20,40,60,80\)`, T`\(200/4=50\), which equals \(0.5\cdot80+10\)`], [T`\(\begin{bmatrix}0&255\\0&255\end{bmatrix}\) and \(\begin{bmatrix}0&0\\255&255\end{bmatrix}\)`, T`both \(127.5\), although their edges point different ways`]],
        pitfall: T`The shortcut \(\text{mean}(aI+b)=a\cdot\text{mean}(I)+b\) fails once values are clipped or rounded. Equal means do not imply equal images.`,
        seeAlso: [3, 15, 22]
      },
      {
        id: 'clipping', term: 'Clipping to a range', symbol: T`\operatorname{clip}_{[0,255]}(x)`,
        plain: T`Clipping forces a number into an allowed range: anything below the minimum becomes the minimum, and anything above the maximum becomes the maximum. Images are clipped to \([0,255]\), all numbers from 0 to 255 including both ends, before display. In the formula, \(\max\) picks the larger of two numbers and \(\min\) the smaller.`,
        formula: T`\operatorname{clip}_{[0,255]}(x)=\min\bigl(255,\ \max(0,x)\bigr)`,
        steps: [T`If the value is below 0, replace it by 0.`, T`If it is above 255, replace it by 255.`, T`Otherwise keep it unchanged.`],
        examples: [[T`\(-5\)`, T`\(0\)`], [T`\(128\)`, T`\(128\)`], [T`\(270\)`, T`\(255\)`], [T`\(260\) and \(300\)`, T`both \(255\): you can no longer tell them apart`]],
        pitfall: T`Clip deliberately, after the calculation, when you need a display image. Arithmetic on 8-bit integer arrays can wrap around instead of clipping: \(250+10\) can come out as \(4\).`,
        seeAlso: [2, 39]
      },
      {
        id: 'weighted-sum', term: 'Weighted sum and blending', symbol: T`aA+(1-a)B`,
        plain: T`A weighted sum multiplies each input by its own weight and adds the results. Blending two images of the same shape uses the weights \(a\) and \(1-a\), pixel by pixel; with \(a\) between 0 and 1, each result lies between the two original pixel values. Neural-network layers are built from weighted sums too.`,
        formula: T`C_{r,c}=a\,A_{r,c}+(1-a)\,B_{r,c},\qquad0\le a\le1`,
        steps: [T`Check that the two images have the same shape.`, T`At each position, multiply the first pixel by \(a\) and the second by \(1-a\).`, T`Add the two products.`],
        examples: [[T`\(a=0.5\), pixels \(255\) and \(0\)`, T`\(127.5+0=127.5\)`], [T`\(a=0.5\), pixels \(0\) and \(0\)`, T`\(0\)`], [T`\(a=0.8\), pixels \(100\) and \(200\)`, T`\(80+40=120\)`]],
        pitfall: T`The weights must act on matching pixels, so the images need the same shape and alignment. Values such as 127.5 are fine while you calculate.`,
        seeAlso: [7, 34, 37]
      }
    ]
  });

  add(2, {
    builds: [{lesson: 1, why: 'pixel scale and offset are the first example functions'}],
    recall: ['affine-map', 'clipping'],
    symbols: [
      ['f, g', 'two functions: rules that turn each input number into one output', 'function'],
      ['∘', 'composition: g ∘ f means apply f first, then apply g to its result', 'function-composition']
    ],
    terms: [
      {
        id: 'function', term: 'Function', symbol: T`f(x)`,
        plain: T`A function is a rule that takes an allowed input and gives exactly one output. \(f(x)=2x+10\) is read “f of x equals two x plus ten”; the letter in brackets stands for the input. The domain is the set of inputs the rule accepts, such as stored pixel values from 0 to 255; the codomain is the kind of value that comes out.`,
        steps: [T`Write the rule with its input letter, for example \(f(x)=2x+10\).`, T`Replace every \(x\) by the input number.`, T`Do the arithmetic. The result is \(f\) of that input.`],
        examples: [[T`\(f(30)\) for \(f(x)=2x+10\)`, T`\(2\cdot30+10=70\)`], [T`\(f(0)\)`, T`\(10\)`], [T`\(f(-5)\)`, T`\(0\)`]],
        pitfall: T`\(f(x)\) does not mean f times x: the brackets hold the input. One input never gives two outputs, but two different inputs may give the same output.`,
        seeAlso: [17, 19, 37]
      },
      {
        id: 'set-notation', term: 'Sets, intervals and the symbol ∈', symbol: T`x\in[0,255]`,
        plain: T`A set is a collection of allowed values. Curly brackets list the members, as in \(\{0,1\}\). Square brackets give an interval: \([0,255]\) is every number from 0 to 255, ends included. \(\mathbb R\) is the set of all real numbers and \(\mathbb R^n\) the set of lists of \(n\) real numbers. The symbol \(\in\) reads “is in”.`,
        formula: T`y\in\{0,1\},\qquad x\in[0,255],\qquad z\in\mathbb R,\qquad v\in\mathbb R^{3}`,
        steps: [T`Read \(\in\) as “is in” or “belongs to”.`, T`Curly brackets list every member: \(\{0,1\}\) contains only 0 and 1.`, T`Square brackets give a range that includes its ends. Inequalities such as \(0<p<1\) describe a range that leaves the ends out.`],
        examples: [[T`\(0.5\in[0,1]\)`, T`true`], [T`\(0.5\in\{0,1\}\)`, T`false: only 0 and 1 belong`], [T`\((2,3)\in\mathbb R^2\)`, T`true: a list of two real numbers`], [T`\(-4\in[0,255]\)`, T`false: below the range`]],
        pitfall: T`\(\{0,1\}\) has two members, while \([0,1]\) has infinitely many. A class label in \(\{0,1\}\) cannot be 0.5; a probability in \([0,1]\) can.`,
        seeAlso: [4, 22, 31]
      },
      {
        id: 'slope', term: 'Straight line: slope and offset', symbol: T`y=ax+b`,
        plain: T`For a straight line \(y=ax+b\), the slope \(a\) is how much \(y\) changes when \(x\) increases by 1, and the offset \(b\) is the value of \(y\) at \(x=0\). A larger slope gives a steeper line; a negative slope runs downhill.`,
        formula: T`a=\frac{\text{change in }y}{\text{change in }x}=\frac{y_2-y_1}{x_2-x_1},\qquad b=\text{the value of }y\text{ at }x=0`,
        steps: [T`Pick two points on the line, \((x_1,y_1)\) and \((x_2,y_2)\).`, T`Divide the change in \(y\) by the change in \(x\): that is the slope.`, T`Read the offset as the output at \(x=0\).`],
        examples: [[T`\(y=0.5x+10\) at \(x=0,100,200\)`, T`\(10,\ 60,\ 110\)`], [T`slope from \((0,10)\) to \((100,60)\)`, T`\((60-10)/100=0.5\)`], [T`\(y=-2x+4\)`, T`falls by 2 for each step right; equals 4 at \(x=0\)`]],
        plot: {fn: 'x => 0.5 * x + 10', x: [0, 200], y: [0, 120], xLabel: 'input x', yLabel: 'y = 0.5x + 10', marks: [0, 100, 200]},
        pitfall: T`The offset is the output at \(x=0\), not where the line crosses the x-axis: \(y=0.5x+10\) crosses it at \(x=-20\).`,
        seeAlso: [10, 17, 52]
      },
      {
        id: 'function-composition', term: 'Function composition', symbol: T`(g\circ f)(x)=g(f(x))`,
        plain: T`Composition chains functions: the output of one becomes the input of the next. \(g\circ f\), read “g after f”, means apply \(f\) first and then \(g\). Image preprocessing pipelines and neural networks are compositions, and changing the order usually changes the answer.`,
        formula: T`(g\circ f)(x)=g\bigl(f(x)\bigr)`,
        steps: [T`Work from the inside out: compute the innermost function first.`, T`Write the intermediate number down.`, T`Feed it into the outer function.`],
        examples: [[T`\(f(x)=2x,\ g(x)=x+3\): \(g(f(4))\)`, T`\(g(8)=11\)`], [T`the same functions: \(f(g(4))\)`, T`\(f(7)=14\)`], [T`\(f(x)=2x,\ g(x)=x+10\) at \(x=30\)`, T`\(g(f(30))=70\), but \(f(g(30))=80\)`]],
        pitfall: T`The small circle is not multiplication, and \(g\circ f\) acts right to left: \(f\) runs first even though \(g\) is written first.`,
        seeAlso: [7, 19, 37]
      },
      {
        id: 'nonlinear-function', term: 'Nonlinear function', symbol: T`h(x)=x^2`,
        plain: T`A function is nonlinear when its graph is not a straight line, so its slope changes from place to place. For \(h(x)=x^2\), the same input step of 1 changes the output by different amounts depending on where you start. Derivatives (Lesson 17) measure this local slope.`,
        steps: [T`Take two input steps of the same size at different places.`, T`Compute the output change for each step.`, T`If the changes differ, the function is not a straight line.`],
        examples: [[T`\(x^2\) from \(1\) to \(2\)`, T`\(4-1=3\)`], [T`\(x^2\) from \(10\) to \(11\)`, T`\(121-100=21\)`], [T`\(\max(0,x)\) from \(-2\) to \(-1\), then from \(1\) to \(2\)`, T`changes of \(0\) and \(1\)`]],
        plot: {fn: 'x => x * x', x: [-3, 3], y: [0, 9], xLabel: 'x', yLabel: 'x²', marks: [1, 2]},
        pitfall: T`Clipping and \(\max(0,x)\) (called ReLU in neural networks) are made of straight pieces, but they are still nonlinear: the slope jumps at a corner.`,
        seeAlso: [17, 37]
      },
      {
        id: 'inverse-function', term: 'Inverse function', symbol: T`f^{-1}`,
        plain: T`An inverse undoes a function: it takes an output back to the input that produced it. Undo the steps in reverse order, each with its opposite operation. A function has an inverse only if no two inputs share an output, which is why clipping cannot be undone.`,
        formula: T`f(x)=0.5x+10\quad\Longrightarrow\quad f^{-1}(J)=2(J-10)`,
        steps: [T`List the steps of the function in order: here, halve and then add 10.`, T`Reverse the list and replace each step by its opposite: subtract 10, then double.`, T`Check that \(f^{-1}(f(x))\) gives back \(x\).`],
        examples: [[T`\(f(60)\)`, T`\(0.5\cdot60+10=40\)`], [T`\(f^{-1}(40)\)`, T`\(2\cdot(40-10)=60\)`], [T`undo a clipped output of \(255\)`, T`impossible: \(260\), \(300\) and \(500\) all clip to \(255\)`]],
        pitfall: T`\(f^{-1}\) is the inverse function, not \(1/f\). The \(-1\) is a label here, not a power.`,
        seeAlso: [4, 8, 50]
      }
    ]
  });

  add(3, {
    builds: [{lesson: 1, why: 'the mean of pixel values introduced averaging'}],
    recall: ['mean'],
    symbols: [
      ['ŷ, y', 'ŷ (“y-hat”) is the model’s prediction; y is the true target it should match', 'residual'],
      ['n', 'how many observations are added up and averaged', 'summation-notation'],
      ['L', 'the loss: here the mean of the squared residuals (mean squared error)', 'mean-squared-error']
    ],
    terms: [
      {
        id: 'summation-notation', term: 'Summation notation', symbol: T`\sum_{i=1}^{n}x_i`,
        plain: T`The capital Greek letter sigma, \(\Sigma\), is shorthand for “add these up”. The index \(i\) starts at the number written below, goes up by 1 each time and stops at the number on top; \(x_i\) is the value with index \(i\). Read it as a loop that adds one term for each value of \(i\).`,
        formula: T`\sum_{i=1}^{n}x_i=x_1+x_2+\cdots+x_n,\qquad\bar x=\frac1n\sum_{i=1}^{n}x_i`,
        steps: [T`Set \(i\) to the lower limit and write down the term for that \(i\).`, T`Increase \(i\) by 1 and write the next term, until \(i\) reaches the upper limit.`, T`Add all the terms. For the mean \(\bar x\) (“x-bar”), divide the total by \(n\).`],
        examples: [[T`\(\sum_{i=1}^{4}x_i\) for \(x=[20,60,100,140]\)`, T`\(320\); mean \(\bar x=80\)`], [T`\(\sum_{i=2}^{3}x_i\) for the same \(x\)`, T`\(60+100=160\)`], [T`\(\sum_{i=1}^{3}i\)`, T`\(1+2+3=6\)`], [T`\(\sum_{i=1}^{3}i^2\)`, T`\(1+4+9=14\)`]],
        pitfall: T`The index \(i\) only says which value to use; it is not multiplied in. Books usually count from \(i=1\), while Python counts from 0.`,
        seeAlso: [6, 15, 22]
      },
      {
        id: 'residual', term: 'Residual (signed error)', symbol: T`\hat y_i-y_i`,
        plain: T`A residual is prediction minus target for one observation; the hat in \(\hat y\) marks a prediction. A positive residual means the model guessed too high, a negative one too low. Averaging signed residuals lets positive and negative errors cancel, which hides mistakes.`,
        steps: [T`Subtract the target from the prediction, one observation at a time.`, T`Keep the sign: it says whether the prediction was too high or too low.`],
        examples: [[T`predictions \([2,4]\), targets \([1,7]\)`, T`residuals \([1,-3]\); their mean is \(-1\)`], [T`predictions \([12,18]\), targets \([10,20]\)`, T`residuals \([2,-2]\); their mean is \(0\), yet both predictions are wrong`]],
        pitfall: T`Some books define the residual as target minus prediction. The sign flips, but squared errors do not change.`,
        seeAlso: [9, 10, 52]
      },
      {
        id: 'absolute-value', term: 'Absolute value (size of a number)', symbol: T`|x|`,
        plain: T`The absolute value of a number is its size with the sign dropped: \(|-3|=3\) and \(|3|=3\). It is the distance from the number to zero, so it is never negative. A residual of magnitude 3 means \(|\text{residual}|=3\), whether the prediction was 3 too high or 3 too low.`,
        formula: T`|x|=\begin{cases}x,&x\ge0\\-x,&x<0\end{cases}`,
        steps: [T`If the number is zero or positive, keep it.`, T`If it is negative, remove the minus sign.`],
        examples: [[T`\(|-3|\)`, T`\(3\)`], [T`\(|2.5|\)`, T`\(2.5\)`], [T`\(|1-7|\)`, T`\(|-6|=6\)`]],
        pitfall: T`Work out what is inside the bars first: \(|1-7|=6\), whereas \(|1|-|7|=-6\).`,
        seeAlso: [4, 6, 42]
      },
      {
        id: 'loss-function', term: 'Loss', symbol: T`L`,
        plain: T`A loss is one number that scores how wrong a model’s predictions are; smaller is better. Training means adjusting the model to make the loss small. A loss can add up the per-example errors (a sum) or average them (a mean), and the two behave differently when the dataset grows.`,
        steps: [T`Compute an error for each example, such as its squared residual.`, T`Combine them: add for a sum, or add and divide by \(n\) for a mean.`, T`State which you used, and the units, before comparing two losses.`],
        examples: [[T`squared errors \([4,4]\)`, T`sum \(8\), mean \(4\)`], [T`the same two examples duplicated: \([4,4,4,4]\)`, T`sum \(16\), mean still \(4\)`]],
        pitfall: T`A low loss on the training data does not prove the model works on new data. Changing the units also changes the loss without changing the predictions.`,
        seeAlso: [4, 12, 25]
      },
      {
        id: 'mean-squared-error', term: 'Mean squared error (MSE)', symbol: T`\operatorname{MSE}`,
        plain: T`Square each residual, then take the mean. Squaring makes every error count as positive, so errors cannot cancel, and it makes large errors count much more than small ones. The MSE is zero only when every prediction equals its target.`,
        formula: T`\operatorname{MSE}=\frac1n\sum_{i=1}^{n}(\hat y_i-y_i)^2`,
        steps: [T`Subtract target from prediction for each observation.`, T`Square each residual.`, T`Add the squares and divide by the number of observations \(n\).`],
        examples: [[T`residuals \([1,-3]\)`, T`\((1+9)/2=5\)`], [T`residuals \([2,-2]\) pixels`, T`\((4+4)/2=4\) square pixels`], [T`the same residuals in tens of pixels, \([0.2,-0.2]\)`, T`\(0.04\): the same fit in a different unit`]],
        pitfall: T`Divide by the number of observations, including any with zero error. MSE is in squared units: a residual of 3 pixels costs 9 square pixels.`,
        seeAlso: [10, 16]
      },
      {
        id: 'root-mean-squared-error', term: 'Root mean squared error (RMSE)', symbol: T`\operatorname{RMSE}=\sqrt{\operatorname{MSE}}`,
        plain: T`RMSE is the square root of the MSE. Taking the root brings the error back into the units of the target, so an RMSE of 2 pixels can be compared directly with a typical position error.`,
        steps: [T`Compute the MSE.`, T`Take its square root: the positive number whose square is the MSE.`],
        examples: [[T`\(\operatorname{MSE}=4\) square pixels`, T`\(\operatorname{RMSE}=2\) pixels`], [T`\(\operatorname{MSE}=5\)`, T`\(\sqrt5\approx2.236\)`]],
        pitfall: T`RMSE is not the average size of the residuals. For \([1,-3]\) the average of \(|1|\) and \(|-3|\) is 2, but the RMSE is about 2.24, because the large error weighs more.`
      }
    ]
  });

  add(4, {
    builds: [{lesson: 2, why: 'sigmoid is a composition of simple functions'}, {lesson: 3, why: 'a training loss averages these per-image losses'}],
    recall: ['function-composition', 'inverse-function', 'set-notation', 'absolute-value', 'loss-function'],
    symbols: [
      ['z', 'score (logit): any real number the model outputs', 'logit'],
      ['σ(z)', 'sigmoid of z: the score squashed into a probability between 0 and 1', 'sigmoid'],
      ['e', 'Euler’s number, about 2.718: the base of the natural exponential', 'natural-exponential'],
      ['ln', 'natural logarithm: the power of e that produces a number', 'natural-logarithm'],
      ['pᵧ', 'the probability the model gave to the class that actually happened', 'negative-log-loss'],
      ['L', 'loss −ln pᵧ: small when the true class got a high probability', 'negative-log-loss']
    ],
    terms: [
      {
        id: 'natural-exponential', term: 'Natural exponential', symbol: T`e^{x}`,
        plain: T`Raise Euler’s number \(e\approx2.718\) to a power. The result is always positive, grows quickly for positive inputs and shrinks towards zero for negative ones. It is written \(e^x\) or \(\exp(x)\).`,
        formula: T`e^{x}=\underbrace{e\times e\times\cdots\times e}_{x\text{ times, for whole }x},\qquad e^{-x}=\frac{1}{e^{x}}`,
        steps: [T`For a whole-number power, multiply \(e\) by itself that many times.`, T`For a negative power, take one over the positive power: \(e^{-1}=1/e\).`, T`For any other input, use a calculator or \(\texttt{math.exp(x)}\) in Python.`],
        examples: [[T`\(e^{0}\)`, T`\(1\)`], [T`\(e^{1}\)`, T`\(\approx2.718\)`], [T`\(e^{2}\)`, T`\(\approx7.389\)`], [T`\(e^{-1}\)`, T`\(\approx0.368\)`]],
        plot: {fn: 'x => Math.exp(x)', x: [-2, 2], y: [0, 8], xLabel: 'x', yLabel: 'e^x', marks: [0, 1]},
        pitfall: T`A positive number is not automatically a probability: \(e^{2}\approx7.39\) is far above one. Sigmoid and softmax divide to bring it back into range.`,
        seeAlso: [22, 27]
      },
      {
        id: 'natural-logarithm', term: 'Natural logarithm', symbol: T`\ln`,
        plain: T`The logarithm answers the question “what power of \(e\) gives this number?” It undoes the exponential, accepts only positive inputs and turns products into sums.`,
        formula: T`\ln(e^{x})=x,\qquad \ln(ab)=\ln a+\ln b`,
        steps: [T`Ask which power of \(e\) produces the number: \(e^{1}=e\), so \(\ln e=1\).`, T`Inputs above one give positive results; inputs between zero and one give negative results.`, T`For other values use a calculator or \(\texttt{math.log(x)}\) in Python (natural log by default).`],
        examples: [[T`\(\ln 1\)`, T`\(0\)`], [T`\(\ln e\)`, T`\(1\)`], [T`\(\ln 2\)`, T`\(\approx0.693\)`], [T`\(\ln 0.5\)`, T`\(\approx-0.693\)`]],
        plot: {fn: 'x => Math.log(x)', x: [0.05, 4], y: [-3, 1.5], xLabel: 'x', yLabel: 'ln x', marks: [0.5, 1, 2]},
        pitfall: T`\(\ln(0)\) is undefined and \(\ln(a+b)\) is not \(\ln a+\ln b\). The product rule works only for multiplication.`,
        seeAlso: [25, 27, 54]
      },
      {
        id: 'sigmoid', term: 'Sigmoid function', symbol: T`\sigma(z)`,
        plain: T`An S-shaped function that squashes any real number into a value strictly between 0 and 1. A classifier uses it to turn a score into the probability of class 1: large positive scores give probabilities near 1, large negative scores near 0, and a score of 0 gives exactly one half.`,
        formula: T`\sigma(z)=\frac{1}{1+e^{-z}}`,
        steps: [T`Negate the score: \(-z\).`, T`Take the exponential \(e^{-z}\). It is always positive.`, T`Add one. The denominator is now bigger than one.`, T`Take the reciprocal. One over a number bigger than one lies between 0 and 1.`],
        examples: [[T`\(z=0\)`, T`\(1/(1+1)=0.5\)`], [T`\(z=2\)`, T`\(1/(1+e^{-2})=1/1.135\approx0.881\)`], [T`\(z=-2\)`, T`\(1/(1+e^{2})=1/8.389\approx0.119\)`], [T`\(z=\ln 3\approx1.099\)`, T`\(1/(1+\tfrac13)=0.75\)`]],
        plot: {fn: 'x => 1 / (1 + Math.exp(-x))', x: [-6, 6], y: [0, 1], xLabel: 'score z', yLabel: 'σ(z)', marks: [-2, 0, 2]},
        pitfall: T`The score and the probability are different numbers. A score of 0.75 gives \(\sigma(0.75)\approx0.68\), not a probability of 0.75. Also note the symmetry \(\sigma(-z)=1-\sigma(z)\).`,
        seeAlso: [27, 37, 38]
      },
      {
        id: 'logit', term: 'Odds and logit (log-odds)', symbol: T`z=\ln\frac{p}{1-p}`,
        plain: T`The odds compare how likely class 1 is with how likely it is not: probability 0.75 means odds of three to one. The logit is the natural log of the odds, and it is exactly the score that sigmoid turns back into \(p\).`,
        formula: T`\text{odds}=\frac{p}{1-p},\qquad z=\ln\!\Bigl(\frac{p}{1-p}\Bigr)\iff p=\sigma(z)`,
        steps: [T`Divide the probability by its complement to get the odds.`, T`Take the natural log of the odds to get the logit.`, T`Check: apply sigmoid to the logit and you get \(p\) back.`],
        examples: [[T`\(p=0.5\)`, T`odds \(1\), logit \(0\)`], [T`\(p=0.75\)`, T`odds \(3\), logit \(\ln3\approx1.099\)`], [T`\(p=0.1\)`, T`odds \(1/9\approx0.111\), logit \(\approx-2.197\)`]],
        pitfall: T`Probability, odds and logit have different ranges: \(0<p<1\), odds above 0, logit any real number. Keep track of which one you are holding.`,
        seeAlso: [27]
      },
      {
        id: 'negative-log-loss', term: 'Negative log loss (binary cross-entropy)', symbol: T`L=-\ln p_y`,
        plain: T`A score for how wrong a probability was. Pick the probability the model gave to the class that actually happened, \(p_y\), and take minus its log. A confident correct prediction costs almost nothing; a confident wrong one costs a lot.`,
        formula: T`L=-\ln p_y=-\bigl[y\ln p+(1-y)\ln(1-p)\bigr],\qquad p_y=\begin{cases}p,&y=1\\1-p,&y=0\end{cases}`,
        steps: [T`Compute the class-1 probability \(p=\sigma(z)\).`, T`Select \(p_y\): use \(p\) if the true label is 1, and \(1-p\) if it is 0.`, T`Take the natural log and flip the sign.`],
        examples: [[T`\(p_y=0.75\)`, T`\(L=-\ln0.75\approx0.288\)`], [T`\(p_y=0.5\)`, T`\(L=\ln2\approx0.693\)`], [T`\(p_y=0.25\)`, T`\(L\approx1.386\)`], [T`\(p_y=0.01\)`, T`\(L\approx4.605\)`]],
        plot: {fn: 'x => -Math.log(x)', x: [0.01, 1], y: [0, 5], xLabel: 'probability of the true class', yLabel: 'loss', marks: [0.25, 0.5, 0.75]},
        pitfall: T`The log is taken of the probability of the true class, not of the score and not always of \(p\). Changing the label changes \(p_y\) but not the prediction.`,
        seeAlso: [25, 27, 54]
      }
    ]
  });

  add(5, {
    builds: [{lesson: 1, why: 'flattening an image already produced a vector'}],
    recall: ['array-shape', 'set-notation', 'weighted-sum', 'mean'],
    symbols: [
      ['x', 'a vector: an ordered list of coordinates, such as (2, 1)', 'vector'],
      ['Δx', 'displacement: end position minus start position, one coordinate at a time', 'displacement']
    ],
    terms: [
      {
        id: 'vector', term: 'Vector', symbol: T`x=(x_1,x_2,\ldots,x_D)`,
        plain: T`A vector is an ordered list of numbers called coordinates or components; how many there are, \(D\), is its dimension. A vector can mark a position in space, describe a movement, or list measurements of an image. The order is part of the meaning: \((2,3)\) and \((3,2)\) are different vectors.`,
        formula: T`x=\begin{bmatrix}2\\3\end{bmatrix}\in\mathbb R^{2}\qquad(\text{a column vector of shape }2\times1)`,
        steps: [T`Fix what each position in the list means, for example horizontal first, then vertical.`, T`Write the numbers in that order, in round brackets or as a column.`, T`Count the entries to get the dimension.`],
        examples: [[T`a point 2 right and 3 up from the origin`, T`\(p=(2,3)\), dimension 2`], [T`\(\begin{bmatrix}20&60\\100&140\end{bmatrix}\) flattened in row order`, T`\(x=(20,60,100,140)\in\mathbb R^4\)`], [T`[mean brightness, edge count] of an image`, T`a feature vector such as \((80,12)\)`]],
        pitfall: T`In maths a vector is usually a column of shape \(D\times1\). A NumPy array of shape \((D,)\) is neither a row nor a column until you reshape it.`,
        seeAlso: [6, 7, 18]
      },
      {
        id: 'displacement', term: 'Displacement', symbol: T`\Delta x=x_{\rm end}-x_{\rm start}`,
        plain: T`A displacement is the move from one position to another: subtract the start coordinates from the end coordinates, one at a time. The Greek letter \(\Delta\) (delta) means “change in”. A position depends on where you put the origin; a displacement does not.`,
        formula: T`\Delta x=x_{\rm end}-x_{\rm start},\qquad x_{\rm start}+\Delta x=x_{\rm end}`,
        steps: [T`Write both positions in the same coordinate system.`, T`Subtract start from end, coordinate by coordinate.`, T`Check: the start plus the displacement gives the end.`],
        examples: [[T`from \((2,1)\) to \((5,-1)\)`, T`\((5-2,\ -1-1)=(3,-2)\)`], [T`from \((2,3)\) to \((5,1)\)`, T`\((3,-2)\): three right and two down`], [T`from \((5,-1)\) back to \((2,1)\)`, T`\((-3,2)\): the reverse move`]],
        pitfall: T`It is end minus start; swapping them reverses the direction. In image (row, column) coordinates the row number grows downwards, so say which way is positive.`,
        seeAlso: [18, 49]
      },
      {
        id: 'linear-combination', term: 'Adding and scaling vectors: linear combinations', symbol: T`au+bv`,
        plain: T`Add two vectors of the same dimension by adding matching coordinates. Multiply a vector by a number (a scalar) by multiplying every coordinate by it. Doing both, \(au+bv\), gives a linear combination: the basic building block of linear algebra and of neural-network layers.`,
        formula: T`au+bv=\begin{bmatrix}au_1+bv_1\\au_2+bv_2\end{bmatrix}`,
        steps: [T`Scale each vector: multiply every coordinate by its number.`, T`Add the scaled vectors coordinate by coordinate.`, T`Check that the result has the same dimension as the inputs.`],
        examples: [[T`\(u=(1,2),\ v=(3,-1)\): \(u+v\)`, T`\((4,1)\)`], [T`\(2u-v\)`, T`\((2-3,\ 4+1)=(-1,5)\)`], [T`\(2u+v\)`, T`\((5,3)\)`]],
        pitfall: T`Only add vectors whose coordinates mean the same things in the same units. Adding a brightness to a width in millimetres gives a number, but not a meaningful one.`,
        seeAlso: [7, 8, 37]
      },
      {
        id: 'vector-norm', term: 'Length and distance (Euclidean norm)', symbol: T`\|x\|_2`,
        plain: T`A norm measures the length of a vector. The usual one, the Euclidean norm, is straight-line length from Pythagoras’ theorem: square the coordinates, add them, take the square root. The distance between two points is the length of the displacement between them. A norm is one non-negative number, so it loses the direction.`,
        formula: T`\|x\|_2=\sqrt{x_1^2+x_2^2+\cdots+x_D^2},\qquad\text{distance}(p,q)=\|q-p\|_2`,
        steps: [T`Square every coordinate.`, T`Add the squares.`, T`Take the square root. For a distance, do this to the displacement \(q-p\).`],
        examples: [[T`\(\|(3,4)\|_2\)`, T`\(\sqrt{9+16}=5\)`], [T`\(\|(3,-2)\|_2\)`, T`\(\sqrt{9+4}=\sqrt{13}\approx3.606\)`], [T`distance from \((2,1)\) to \((5,-1)\)`, T`\(\|(3,-2)\|_2\approx3.606\)`]],
        pitfall: T`A feature measured in large numbers dominates a distance. Rescale features, using training data only, before comparing feature vectors by distance.`,
        seeAlso: [6, 11, 18]
      },
      {
        id: 'feature-vector', term: 'Feature vector', symbol: T`[\text{brightness},\ \text{width}]`,
        plain: T`A feature vector lists chosen measurements of an object, such as an image’s mean brightness and its width. Its coordinates are measurements, not positions in space, and each can have its own unit and scale. A model sees only these numbers, so the choice of features decides what it can tell apart.`,
        steps: [T`Decide which measurement goes in each coordinate, and its unit.`, T`Compute the measurements for every image, always in the same order.`, T`If the features have very different scales, divide each by a typical size computed from the training data, and reuse those numbers for new images.`],
        examples: [[T`\(\begin{bmatrix}20&60\\100&140\end{bmatrix}\) as [mean, number of pixels above 90]`, T`\((80,2)\)`], [T`distance between \((80,30)\) and \((90,500)\)`, T`\(\|(10,470)\|_2\approx470.1\): almost all from the width`], [T`the same after dividing by typical sizes 10 and 200`, T`\(\|(1,2.35)\|_2\approx2.55\): both features now count`]],
        pitfall: T`Different images can share one feature vector: mean brightness alone cannot tell a vertical edge from a horizontal one.`,
        seeAlso: [6, 7, 15]
      }
    ]
  });

  add(6, {
    builds: [{lesson: 5, why: 'lengths and dot products are computed from coordinates'}],
    recall: ['vector', 'vector-norm', 'summation-notation', 'absolute-value', 'linear-combination'],
    symbols: [
      ['p', 'the projection of x onto the line of u: the point on that line closest to x', 'orthogonal-projection'],
      ['T', 'transpose: turns the column u into a row, so uᵀx is a single number', 'dot-product'],
      ['uᵀu', 'u dotted with itself: the squared length of u', 'dot-product']
    ],
    terms: [
      {
        id: 'dot-product', term: 'Dot product', symbol: T`u^Tv`,
        plain: T`Multiply matching coordinates of two vectors and add the products. The result is one number: positive when the vectors point roughly the same way, zero when they are perpendicular (also called orthogonal), negative when they point in opposing directions. The T, for transpose, turns the column \(u\) into a row so the product can be written \(u^Tv\).`,
        formula: T`u^Tv=\sum_i u_iv_i=u_1v_1+u_2v_2+\cdots,\qquad u^Tu=\|u\|_2^2`,
        steps: [T`Check that both vectors have the same dimension.`, T`Multiply matching coordinates.`, T`Add the products. A result of 0 means the vectors are orthogonal.`],
        examples: [[T`\((1,2)\) and \((3,-1)\)`, T`\(3-2=1\)`], [T`\((1,1)\) and \((3,4)\)`, T`\(3+4=7\)`], [T`\((1,1)\) and \((-0.5,0.5)\)`, T`\(0\): perpendicular`], [T`\((1,1)\) with itself`, T`\(2=\|(1,1)\|_2^2\)`]],
        pitfall: T`The dot product is a number, not a vector, and it mixes direction with length: doubling one vector doubles the result. Cosine similarity removes the length.`,
        seeAlso: [10, 34, 55]
      },
      {
        id: 'cosine', term: 'Cosine and sine of an angle', symbol: T`\cos\theta,\ \sin\theta`,
        plain: T`Walk one unit from the centre of a circle at angle \(\theta\) (theta), measured anticlockwise from the positive x-axis. Your horizontal position is \(\cos\theta\) and your vertical position is \(\sin\theta\). So the cosine says how much of a unit step lies along the reference direction: 1 when aligned, 0 when perpendicular, −1 when opposite.`,
        formula: T`\cos\theta=\frac{\text{adjacent side}}{\text{hypotenuse}},\qquad\sin\theta=\frac{\text{opposite side}}{\text{hypotenuse}},\qquad\cos^2\theta+\sin^2\theta=1`,
        steps: [T`In a right-angled triangle, divide the side next to the angle by the longest side to get the cosine; the side opposite the angle gives the sine.`, T`Remember the key values: \(\cos0^\circ=1\), \(\cos60^\circ=0.5\), \(\cos90^\circ=0\), \(\cos180^\circ=-1\).`, T`To get an angle back from its cosine, use the inverse cosine, \(\arccos\) (\(\cos^{-1}\) on a calculator).`],
        examples: [[T`\(\cos60^\circ\)`, T`\(0.5\)`], [T`\(\cos90^\circ\) and \(\sin90^\circ\)`, T`\(0\) and \(1\)`], [T`\(\cos180^\circ\)`, T`\(-1\)`], [T`\(\arccos(0.1414)\)`, T`\(\approx81.9^\circ\)`]],
        plot: {fn: 'x => Math.cos(x * Math.PI / 180)', x: [0, 180], y: [-1, 1], xLabel: 'angle θ in degrees', yLabel: 'cos θ', marks: [0, 60, 90]},
        pitfall: T`Software measures angles in radians, not degrees: \(180^\circ=\pi\) radians, so \(\texttt{math.cos(90)}\) is about \(-0.448\), not 0. Multiply degrees by \(\pi/180\) first.`,
        seeAlso: [7, 33, 36, 51]
      },
      {
        id: 'cosine-similarity', term: 'Angle between vectors and cosine similarity', symbol: T`\cos\theta=\frac{u^Tv}{\|u\|_2\,\|v\|_2}`,
        plain: T`The dot product equals the two lengths multiplied together and by the cosine of the angle between the vectors. Dividing by the lengths leaves the cosine alone: a similarity score from −1 (opposite) through 0 (perpendicular) to 1 (same direction) that ignores how long the vectors are. It is undefined for the zero vector.`,
        formula: T`u^Tv=\|u\|_2\,\|v\|_2\cos\theta\quad\Longrightarrow\quad\cos\theta=\frac{u^Tv}{\|u\|_2\,\|v\|_2}`,
        steps: [T`Compute the dot product \(u^Tv\).`, T`Compute both lengths \(\|u\|_2\) and \(\|v\|_2\).`, T`Divide the dot product by the product of the lengths. Apply \(\arccos\) if you need the angle itself.`],
        examples: [[T`\(u=(1,2),\ v=(3,-1)\)`, T`\(1/(\sqrt5\sqrt{10})=1/\sqrt{50}\approx0.141\), about \(81.9^\circ\)`], [T`\((1,0)\) and \((0,1)\)`, T`\(0\): perpendicular, \(90^\circ\)`], [T`\((1,1)\) and \((3,3)\)`, T`\(1\): same direction`], [T`\((1,0)\) and \((-2,0)\)`, T`\(-1\): opposite`]],
        pitfall: T`Multiplying a vector by a positive number leaves its cosine similarity unchanged. That helps when overall brightness is a nuisance, but it throws away size information a classifier might need.`,
        seeAlso: [54, 55]
      },
      {
        id: 'orthogonal-projection', term: 'Orthogonal projection onto a direction', symbol: T`p=\frac{u^Tx}{u^Tu}\,u`,
        plain: T`Projection finds the point on the line through \(u\) that is closest to \(x\): the part of \(x\) that lies along \(u\). What is left over, the residual \(x-p\), is perpendicular to \(u\). This idea of a best approximation with a perpendicular leftover is the heart of least squares.`,
        formula: T`c=\frac{u^Tx}{u^Tu},\qquad p=c\,u,\qquad u^T(x-p)=0`,
        steps: [T`Compute the dot products \(u^Tx\) and \(u^Tu\).`, T`Divide them to get the coefficient \(c\), a single number.`, T`Multiply \(u\) by \(c\) to get the projected point \(p\).`, T`Check that the residual \(x-p\) has dot product 0 with \(u\).`],
        examples: [[T`\(x=(3,4),\ u=(1,1)\)`, T`\(c=7/2\), \(p=(3.5,3.5)\), residual \((-0.5,0.5)\)`], [T`\(x=(3,4),\ u=(2,2)\)`, T`\(c=14/8=1.75\), \(p=(3.5,3.5)\): the same point`], [T`\(x=(3,4),\ u=(1,0)\)`, T`\(p=(3,0)\), residual \((0,4)\)`]],
        pitfall: T`Keep the denominator \(u^Tu\); it equals 1 only when \(u\) has length 1. Without it, projecting \((3,4)\) onto \((1,1)\) gives \((7,7)\) instead of \((3.5,3.5)\).`,
        seeAlso: [10, 15, 31]
      },
      {
        id: 'unit-vector', term: 'Unit vector (normalizing)', symbol: T`\frac{x}{\|x\|_2}`,
        plain: T`A unit vector has length exactly 1. Dividing any non-zero vector by its length gives the unit vector pointing the same way: it keeps the direction and discards the size. The zero vector has no direction, so it cannot be normalized.`,
        formula: T`\Bigl\|\frac{x}{\|x\|_2}\Bigr\|_2=1\qquad(x\ne0)`,
        steps: [T`Compute the length \(\|x\|_2\).`, T`Divide every coordinate by it.`, T`Check that the squares of the new coordinates add up to 1.`],
        examples: [[T`\((3,4)\)`, T`\((3/5,\ 4/5)=(0.6,0.8)\)`], [T`\((1,1)\)`, T`\((1/\sqrt2,\ 1/\sqrt2)\approx(0.707,0.707)\)`], [T`\((0,0)\)`, T`undefined: its length is 0`]],
        pitfall: T`Adding a tiny number to the denominator stops a division error in code, but it does not give the zero vector a real direction.`,
        seeAlso: [11, 13, 54]
      },
      {
        id: 'l1-norm', term: 'L1 norm', symbol: T`\|x\|_1`,
        plain: T`The L1 norm adds the absolute values of a vector’s coordinates, like walking along the streets of a grid city instead of straight across. It is another way to measure length, so always say which norm you mean: L1 and Euclidean (L2) lengths differ.`,
        formula: T`\|x\|_1=\sum_i|x_i|=|x_1|+|x_2|+\cdots+|x_D|`,
        steps: [T`Drop the sign of every coordinate.`, T`Add the results.`],
        examples: [[T`\(\|(3,4)\|_1\)`, T`\(7\), whereas \(\|(3,4)\|_2=5\)`], [T`\(\|(1,-2,2)\|_1\)`, T`\(5\), whereas \(\|(1,-2,2)\|_2=3\)`]],
        pitfall: T`The L1 norm is never smaller than the Euclidean norm, and the two can rank pairs of vectors differently.`,
        seeAlso: [42, 52]
      }
    ]
  });

  add(7, {
    builds: [{lesson: 2, why: 'a matrix product composes two maps, right to left'}, {lesson: 6, why: 'each output entry is a dot product of a row with x'}],
    recall: ['vector', 'linear-combination', 'dot-product', 'function-composition', 'affine-map'],
    symbols: [
      ['X', 'the inputs: n examples stored as rows, d features each (shape n × d)', 'affine-layer'],
      ['W', 'the weight matrix: turns d input features into k outputs (shape d × k)', 'affine-layer'],
      ['Y', 'the outputs: one row of k values per example (shape n × k)', 'affine-layer']
    ],
    terms: [
      {
        id: 'matrix-multiplication', term: 'Matrix multiplication', symbol: T`Ax,\ BA`,
        plain: T`A matrix acts on a vector by weighted mixing: entry \(i\) of \(Ax\) is the dot product of row \(i\) of \(A\) with \(x\), or equivalently \(Ax\) adds up the columns of \(A\) weighted by the entries of \(x\). Multiplying two matrices gives the matrix of one map after another: \(B(Ax)=(BA)x\) applies \(A\) first, then \(B\). The inner sizes must match, and the order matters.`,
        formula: T`\begin{bmatrix}a&b\\c&d\end{bmatrix}\begin{bmatrix}x_1\\x_2\end{bmatrix}=\begin{bmatrix}ax_1+bx_2\\cx_1+dx_2\end{bmatrix},\qquad(BA)_{ij}=\sum_k B_{ik}A_{kj},\qquad(C\times H)(H\times D)\to C\times D`,
        steps: [T`Check the shapes: the number of columns on the left must equal the number of rows on the right.`, T`The outer numbers give the shape of the result.`, T`For each entry of the result, take a row on the left and a column on the right, multiply matching entries and add.`],
        examples: [[T`\(\begin{bmatrix}2&1\\0&1\end{bmatrix}\begin{bmatrix}1\\2\end{bmatrix}\)`, T`\((2+2,\ 0+2)=(4,2)\), or by columns \(1\cdot(2,0)+2\cdot(1,1)\)`], [T`shapes \((2\times3)(3\times4)\)`, T`\(2\times4\)`], [T`\(B=\begin{bmatrix}0&-1\\1&0\end{bmatrix},\ A=\begin{bmatrix}2&0\\0&1\end{bmatrix}\)`, T`\(BA=\begin{bmatrix}0&-1\\2&0\end{bmatrix}\)`], [T`\(BAx\) and \(ABx\) for \(x=(1,1)\)`, T`\((-1,2)\) and \((-2,1)\): order matters`]],
        pitfall: T`Usually \(AB\ne BA\), and the matrix nearest \(x\) acts first. In NumPy \(\texttt{A @ x}\) is this product, while \(\texttt{A * x}\) multiplies matching entries, which is a different operation.`,
        seeAlso: [13, 19, 38]
      },
      {
        id: 'diagonal-matrix', term: 'Diagonal matrix', symbol: T`\operatorname{diag}(d_1,d_2)`,
        plain: T`A diagonal matrix has numbers only on its main diagonal, from top-left to bottom-right, and zeros everywhere else; \(\operatorname{diag}(2,1)\) is shorthand for one. As a map it stretches each coordinate axis by its own factor without mixing the coordinates.`,
        formula: T`\operatorname{diag}(d_1,d_2)=\begin{bmatrix}d_1&0\\0&d_2\end{bmatrix},\qquad\operatorname{diag}(d_1,d_2)\begin{bmatrix}x_1\\x_2\end{bmatrix}=\begin{bmatrix}d_1x_1\\d_2x_2\end{bmatrix}`,
        steps: [T`Place the listed numbers down the diagonal and fill the rest with zeros.`, T`To apply it, multiply each coordinate by its own diagonal entry.`],
        examples: [[T`\(\operatorname{diag}(2,1)\) applied to \((1,1)\)`, T`\((2,1)\): x stretched by 2, y unchanged`], [T`\(\operatorname{diag}(2,3)\) applied to \((4,-1)\)`, T`\((8,-3)\)`], [T`\(\operatorname{diag}(2,1)\,\operatorname{diag}(3,5)\)`, T`\(\operatorname{diag}(6,5)\)`]],
        pitfall: T`Diagonal matrices are the easy case where the order of multiplication does not matter; most matrices do not commute.`,
        seeAlso: [11, 13, 14]
      },
      {
        id: 'linear-map', term: 'Linear map', symbol: T`x\mapsto Ax`,
        plain: T`A map sends each input vector to an output vector; \(x\mapsto Ax\) reads “x is sent to Ax”. It is linear when it respects addition and scaling. Every matrix gives a linear map, and its columns show where \(e_1=(1,0)\) and \(e_2=(0,1)\) land. A linear map always sends zero to zero; adding an offset, \(x\mapsto Ax+b\), makes it affine.`,
        formula: T`A(u+v)=Au+Av,\qquad A(cu)=c\,Au,\qquad Ae_1=\text{column 1},\quad Ae_2=\text{column 2}`,
        steps: [T`Test zero first: a linear map must send 0 to 0.`, T`Check that doubling the input doubles the output, and that the output of a sum is the sum of the outputs.`, T`For a matrix, read its columns to see where \(e_1\) and \(e_2\) go.`],
        examples: [[T`\(f(x)=2x\)`, T`linear: \(f(0)=0\) and \(f(3+4)=f(3)+f(4)=14\)`], [T`\(f(x)=2x+1\)`, T`affine but not linear: \(f(0)=1\)`], [T`\(\begin{bmatrix}0&-1\\1&0\end{bmatrix}e_1\)`, T`\((0,1)\), the first column: a quarter turn anticlockwise, since \(\cos90^\circ=0\) and \(\sin90^\circ=1\)`]],
        pitfall: T`School algebra calls \(y=2x+1\) a linear function, but in linear algebra it is affine because of the \(+1\).`,
        seeAlso: [8, 37, 49]
      },
      {
        id: 'transpose', term: 'Transpose', symbol: T`A^T`,
        plain: T`The transpose flips a matrix over its main diagonal, so rows become columns. A matrix of shape \(m\times n\) becomes \(n\times m\), and a column vector becomes a row vector, which is why the dot product is written \(u^Tv\). Transposing a product reverses the order of the factors.`,
        formula: T`(A^T)_{ij}=A_{ji},\qquad(BA)^T=A^TB^T`,
        steps: [T`Write the first row of \(A\) as the first column of \(A^T\).`, T`Repeat for every row.`, T`Check that the shape has swapped.`],
        examples: [[T`\(\begin{bmatrix}1&2&3\\4&5&6\end{bmatrix}^T\)`, T`\(\begin{bmatrix}1&4\\2&5\\3&6\end{bmatrix}\): shape \(2\times3\) becomes \(3\times2\)`], [T`\(\begin{bmatrix}1\\2\end{bmatrix}^T\)`, T`\(\begin{bmatrix}1&2\end{bmatrix}\)`], [T`\(\begin{bmatrix}2&1\\0&1\end{bmatrix}^T\)`, T`\(\begin{bmatrix}2&0\\1&1\end{bmatrix}\)`]],
        pitfall: T`The T is a label, not a power. And \((BA)^T\) equals \(A^TB^T\), not \(B^TA^T\).`,
        seeAlso: [10, 19, 38]
      },
      {
        id: 'determinant', term: 'Determinant', symbol: T`\det A`,
        plain: T`The determinant of a square matrix is one number that says how its map scales area: a determinant of 2 doubles every area. A negative sign means the map also flips orientation, like a mirror. A determinant of 0 means the map squashes the plane onto a line or a point, so some direction is lost and the map cannot be undone.`,
        formula: T`\det\begin{bmatrix}a&b\\c&d\end{bmatrix}=ad-bc`,
        steps: [T`Multiply the top-left and bottom-right entries.`, T`Multiply the top-right and bottom-left entries.`, T`Subtract the second product from the first.`, T`For larger matrices the formula has more terms; use \(\texttt{np.linalg.det}\).`],
        examples: [[T`\(\begin{bmatrix}2&1\\0&1\end{bmatrix}\)`, T`\(2\cdot1-1\cdot0=2\): areas double`], [T`\(\begin{bmatrix}0&-1\\1&0\end{bmatrix}\)`, T`\(0-(-1)=1\): a rotation keeps area`], [T`\(\begin{bmatrix}1&1\\2&2\end{bmatrix}\)`, T`\(2-2=0\): squashed onto a line`], [T`\(\begin{bmatrix}0&1\\1&0\end{bmatrix}\)`, T`\(0-1=-1\): a mirror flip`]],
        pitfall: T`Only square matrices have determinants. A tiny but non-zero determinant does not reliably mean a map is nearly squashed; Lesson 11’s condition number measures that.`,
        seeAlso: [8, 13, 51]
      },
      {
        id: 'affine-layer', term: 'Batched affine layer', symbol: T`Y=XW+b`,
        plain: T`A neural-network layer applies the same weights to every example. Store the \(n\) examples as the rows of \(X\). Multiplying by \(W\) turns each row of \(d\) features into \(k\) outputs, and the bias \(b\), one number per output, is added to every row. NumPy calls this automatic repetition of \(b\) broadcasting.`,
        formula: T`\underbrace{Y}_{n\times k}=\underbrace{X}_{n\times d}\,\underbrace{W}_{d\times k}+\underbrace{b}_{\text{length }k}`,
        steps: [T`Write the shape under every symbol.`, T`Check that the columns of \(X\) match the rows of \(W\): both are \(d\).`, T`Read the output shape from the outer sizes, \(n\times k\); \(b\) has length \(k\).`, T`Count the trainable numbers: \(d\cdot k\) weights plus \(k\) biases.`],
        examples: [[T`\(X\) is \(4\times5\), \(W\) is \(5\times2\)`, T`\(Y\) is \(4\times2\); \(b\) has length 2; \(5\cdot2+2=12\) trainable numbers`], [T`one row \(x=[1,2]\), \(W=\begin{bmatrix}1&0\\1&1\end{bmatrix}\), \(b=[0.5,0]\)`, T`\(xW+b=[3,2]+[0.5,0]=[3.5,2]\)`]],
        pitfall: T`Row-stored batches use \(XW\); a single column vector uses \(Wx\) with the transposed weights. Broadcasting can also produce a legal array with the wrong meaning, so write the shapes first.`,
        seeAlso: [37, 38, 53]
      }
    ]
  });

  add(8, {
    builds: [{lesson: 5, why: 'span and bases are built from linear combinations'}, {lesson: 7, why: 'rank and null space describe what a matrix map keeps'}],
    recall: ['linear-combination', 'matrix-multiplication', 'determinant', 'diagonal-matrix', 'inverse-function'],
    symbols: [
      ['d', 'the number of input coordinates the matrix accepts: its number of columns', 'null-space'],
      ['ker(A)', 'kernel or null space: every input that A sends to the zero vector', 'null-space'],
      ['rank(A)', 'rank: how many independent directions the outputs of A can point in', 'rank']
    ],
    terms: [
      {
        id: 'linear-independence', term: 'Linear independence',
        plain: T`Vectors are linearly independent when none of them can be built from the others, so the only way to combine them into the zero vector is with every coefficient zero. A dependent vector repeats directions you already have, so it adds no new information.`,
        formula: T`a_1v_1+a_2v_2+\cdots+a_kv_k=0\quad\text{only when}\quad a_1=a_2=\cdots=a_k=0`,
        steps: [T`For two vectors, check whether one is a multiple of the other; if so, they are dependent.`, T`For more vectors, try to write one as a linear combination of the rest.`, T`For two vectors in 2-D, put them as the columns of a matrix: a non-zero determinant means independent.`],
        examples: [[T`\((1,0)\) and \((0,1)\)`, T`independent`], [T`\((1,2)\) and \((2,4)\)`, T`dependent: \(2(1,2)-(2,4)=(0,0)\)`], [T`\((1,1)\) and \((1,-1)\)`, T`independent: \(\det\begin{bmatrix}1&1\\1&-1\end{bmatrix}=-2\ne0\)`]],
        pitfall: T`Having two coordinates does not guarantee two independent directions. Any set that contains the zero vector is dependent.`,
        seeAlso: [9, 11, 13]
      },
      {
        id: 'basis', term: 'Span, basis and coordinates', symbol: T`x=a\,u+b\,v`,
        plain: T`The span of some vectors is everything you can reach with linear combinations of them. A basis is a set of independent vectors that spans the whole space, so every vector has exactly one recipe in it; the numbers in the recipe are its coordinates in that basis. The standard basis \(e_1=(1,0)\), \(e_2=(0,1)\) gives the ordinary coordinates.`,
        steps: [T`Write \(x=a\,u+b\,v\) as one equation per coordinate.`, T`Solve the equations for \(a\) and \(b\).`, T`Check by recombining: \(a\,u+b\,v\) should give \(x\).`],
        examples: [[T`\((3,4)\) in the standard basis`, T`\(3e_1+4e_2\): coordinates \((3,4)\)`], [T`\((3,4)\) with \(u=(1,1),\ v=(1,-1)\)`, T`\(a+b=3,\ a-b=4\), so \(a=3.5,\ b=-0.5\)`], [T`the span of \((1,2)\) and \((2,4)\)`, T`only the line through \((1,2)\): not a basis of the plane`]],
        pitfall: T`Coordinates depend on the basis, but the vector does not: \((3,4)\) in the standard basis and \((3.5,-0.5)\) in the basis \(u,v\) are the same arrow.`,
        seeAlso: [13, 16]
      },
      {
        id: 'rank', term: 'Rank and column space', symbol: T`\operatorname{rank}(A)`,
        plain: T`The column space of \(A\) is the set of all outputs \(Ax\) can produce: every linear combination of its columns. The rank is the number of independent columns, which is the number of independent directions those outputs can point in. A rank below the number of columns means some input information is lost.`,
        formula: T`\operatorname{rank}(A)=\text{number of independent columns}\le\min(\text{rows},\ \text{columns})`,
        steps: [T`List the columns of \(A\).`, T`Remove, one at a time, any column that is a combination of the remaining ones, until the rest are independent.`, T`Count what remains. For a \(2\times2\) matrix: rank 2 if \(\det A\ne0\), rank 1 if \(\det A=0\) but \(A\) is not all zeros.`],
        examples: [[T`\(\begin{bmatrix}1&1\\2&2\end{bmatrix}\)`, T`rank 1: both columns are \((1,2)\)`], [T`\(\begin{bmatrix}2&1\\0&1\end{bmatrix}\)`, T`rank 2: \(\det=2\ne0\)`], [T`summing 4 pixels: \(\begin{bmatrix}1&1&1&1\end{bmatrix}\)`, T`rank 1: one output number`]],
        pitfall: T`With \(\begin{bmatrix}1&1\\2&2\end{bmatrix}\) the output \((2,4)\) is reachable but \((2,3)\) is not: it lies outside the column space.`,
        seeAlso: [9, 11, 14]
      },
      {
        id: 'null-space', term: 'Null space and rank–nullity', symbol: T`\ker(A)`,
        plain: T`The null space, or kernel, of \(A\) holds every input that \(A\) sends to zero, written \(\{x: Ax=0\}\) (“all x such that Ax = 0”). Adding such a vector to an input leaves the output unchanged, so those changes are invisible and cannot be recovered. Rank–nullity balances the books: directions kept plus directions lost equal the number of inputs \(d\).`,
        formula: T`\ker(A)=\{x: Ax=0\},\qquad\operatorname{rank}(A)+\dim\ker(A)=d`,
        steps: [T`Write \(Ax=0\) as equations.`, T`Solve them; every unknown left free gives one null-space direction.`, T`Count the free directions: that is \(\dim\ker(A)\), the nullity.`, T`Check: rank plus nullity equals the number of columns.`],
        examples: [[T`\(\begin{bmatrix}1&1\\2&2\end{bmatrix}x=0\)`, T`\(x_1+x_2=0\): null vector \((1,-1)\)`], [T`inputs \((1,0)\) and \((0,1)\) to that matrix`, T`both give \((1,2)\); they differ by \((1,-1)\)`], [T`10 inputs, rank 7`, T`nullity \(10-7=3\)`]],
        pitfall: T`A map from \(d\) inputs to fewer than \(d\) outputs always has a non-zero null space, so it must lose some input directions.`,
        seeAlso: [9, 50]
      },
      {
        id: 'identity-matrix', term: 'Identity matrix', symbol: T`I`,
        plain: T`The identity matrix is the diagonal matrix with ones on the diagonal. As a map it changes nothing: \(Ix=x\) and \(IA=AI=A\). It plays the role that the number 1 plays in ordinary multiplication.`,
        formula: T`I_2=\begin{bmatrix}1&0\\0&1\end{bmatrix},\qquad Ix=x`,
        steps: [T`Choose the size \(n\) to match the matrix or vector it multiplies.`, T`Put 1 at each diagonal position and 0 everywhere else.`],
        examples: [[T`\(I_2\begin{bmatrix}3\\4\end{bmatrix}\)`, T`\((3,4)\), unchanged`], [T`\(5I_2\)`, T`\(\begin{bmatrix}5&0\\0&5\end{bmatrix}\)`]],
        pitfall: T`The letter \(I\) also names images in this course. A size subscript, as in \(I_2\) or \(I_n\), or a matrix equation around it, tells you it is the identity.`,
        seeAlso: [11, 12, 13]
      },
      {
        id: 'matrix-inverse', term: 'Matrix inverse', symbol: T`A^{-1}`,
        plain: T`The inverse of a square matrix \(A\) undoes its map: \(A^{-1}Ax=x\). It exists exactly when \(A\) has full rank, which for a square matrix means \(\det A\ne0\). If \(A\) squashes some direction to zero, no matrix can bring that direction back.`,
        formula: T`A^{-1}A=AA^{-1}=I,\qquad\begin{bmatrix}a&b\\c&d\end{bmatrix}^{-1}=\frac{1}{ad-bc}\begin{bmatrix}d&-b\\-c&a\end{bmatrix}`,
        steps: [T`Compute the determinant \(ad-bc\). If it is 0, stop: there is no inverse.`, T`Swap \(a\) and \(d\), and change the signs of \(b\) and \(c\).`, T`Divide every entry by the determinant.`, T`Check that multiplying by \(A\) gives \(I\).`],
        examples: [[T`\(\begin{bmatrix}2&1\\0&1\end{bmatrix}^{-1}\)`, T`\(\tfrac12\begin{bmatrix}1&-1\\0&2\end{bmatrix}=\begin{bmatrix}0.5&-0.5\\0&1\end{bmatrix}\)`], [T`\(\operatorname{diag}(2,4)^{-1}\)`, T`\(\operatorname{diag}(0.5,0.25)\)`], [T`\(\begin{bmatrix}1&1\\2&2\end{bmatrix}^{-1}\)`, T`does not exist: \(\det=0\)`]],
        pitfall: T`Only square, full-rank matrices have inverses. In code, solve \(Ax=b\) with a solver instead of computing \(A^{-1}\) and multiplying; it is faster and more accurate.`,
        seeAlso: [10, 11, 50]
      }
    ]
  });

  add(9, {
    builds: [{lesson: 7, why: 'Ax = b packs the equations into one matrix product'}, {lesson: 8, why: 'column space and null space decide how many solutions exist'}],
    recall: ['matrix-multiplication', 'rank', 'null-space', 'slope'],
    symbols: [
      ['A', 'coefficient matrix: one row per equation, one column per unknown', 'system-of-linear-equations'],
      ['x', 'the unknowns you solve for, stacked into a vector', 'system-of-linear-equations'],
      ['b', 'the right-hand sides: the observed values the equations must match', 'system-of-linear-equations']
    ],
    terms: [
      {
        id: 'system-of-linear-equations', term: 'System of linear equations', symbol: T`Ax=b`,
        plain: T`A system of linear equations is a set of conditions that must all hold at the same time. Write the coefficients as a matrix \(A\), the unknowns as a vector \(x\) and the right-hand sides as \(b\), and the whole system becomes \(Ax=b\): row \(i\) of \(A\) times \(x\) must equal \(b_i\).`,
        formula: T`\begin{cases}x+y=3\\x-y=1\end{cases}\iff\begin{bmatrix}1&1\\1&-1\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}=\begin{bmatrix}3\\1\end{bmatrix}`,
        steps: [T`Give every unknown a fixed position in \(x\).`, T`Write each equation as one row of \(A\), using 0 for an unknown that does not appear.`, T`Put the right-hand sides, in the same order, into \(b\).`],
        examples: [[T`\(x+y=3,\ x-y=1\)`, T`\(A=\begin{bmatrix}1&1\\1&-1\end{bmatrix},\ b=(3,1)\)`], [T`\(2x=4,\ y=1\)`, T`\(A=\begin{bmatrix}2&0\\0&1\end{bmatrix},\ b=(4,1)\)`], [T`check \((x,y)=(2,1)\) in the first system`, T`\((2+1,\ 2-1)=(3,1)\), which matches \(b\)`]],
        pitfall: T`In small examples the letter \(x\) is both the whole unknown vector and its first entry. Keep the unknown parameters separate from the observed numbers in \(A\) and \(b\).`,
        seeAlso: [10, 11, 52]
      },
      {
        id: 'gaussian-elimination', term: 'Solving by elimination',
        plain: T`Elimination solves a system by combining equations so that unknowns drop out one at a time. Adding, subtracting or scaling whole equations (row operations) never changes the solutions, provided you treat both sides alike. If elimination produces an impossible line such as \(0=1\), the system has no solution.`,
        steps: [T`Add or subtract a multiple of one equation from another so that one unknown cancels.`, T`Solve the shorter equation for the remaining unknown.`, T`Substitute back to find the other unknowns.`, T`Check every original equation.`],
        examples: [[T`\(x+y=3,\ x-y=1\)`, T`add them: \(2x=4\), so \(x=2\) and \(y=1\)`], [T`\(2x+y=5,\ x+y=3\)`, T`subtract: \(x=2\), then \(y=1\)`], [T`\(x+y=3,\ 2x+2y=7\)`, T`subtract twice the first: \(0=1\), so no solution`]],
        pitfall: T`Apply each operation to both sides, that is, to the row of \(A\) and the matching entry of \(b\) together.`,
        seeAlso: [10, 12]
      },
      {
        id: 'consistent-system', term: 'Consistent and inconsistent systems',
        plain: T`A system is consistent if at least one \(x\) satisfies every equation, and inconsistent if none does. In the language of Lesson 08, \(Ax=b\) is consistent exactly when \(b\) lies in the column space of \(A\). Noisy measurements often make real systems inconsistent.`,
        formula: T`Ax=b\ \text{has a solution}\iff b\in\text{column space of }A`,
        steps: [T`Eliminate until each equation is as simple as possible.`, T`If a line reads \(0=c\) with \(c\ne0\), the system is inconsistent.`, T`Otherwise it is consistent: one solution if no unknown is left free, infinitely many if some are.`],
        examples: [[T`\(x-y=0,\ x-y=2\)`, T`inconsistent: one difference cannot be both 0 and 2`], [T`\(x+y=3,\ x-y=1\)`, T`consistent, with exactly one solution \((2,1)\)`], [T`\(x+y=2,\ 2x+2y=4\)`, T`consistent, with infinitely many solutions`]],
        pitfall: T`Counting equations is not enough: more equations than unknowns can still be consistent, and fewer can still be inconsistent.`,
        seeAlso: [10, 51]
      },
      {
        id: 'underdetermined-system', term: 'Underdetermined systems and free parameters',
        plain: T`When a consistent system leaves some unknowns unconstrained, it has infinitely many solutions. Give each free unknown a parameter such as \(t\) and write the others in terms of it. Every solution is one particular solution plus a null-space vector, because adding a null vector does not change \(Ax\).`,
        formula: T`x=x_0+n\ \text{ with }\ An=0;\qquad\text{e.g. }x+y=3:\ (x,y)=(t,\ 3-t)`,
        steps: [T`Eliminate as far as possible.`, T`Choose a free unknown and call it \(t\).`, T`Solve for the other unknowns in terms of \(t\).`, T`Check two different values of \(t\) in the original equations.`],
        examples: [[T`\(x+y=3\)`, T`\((t,\ 3-t)\): for example \((0,3)\), \((1,2)\), \((1.5,1.5)\)`], [T`particular solution \((1,2)\) plus null vector \((1,-1)\)`, T`\((2,1)\), also a solution`], [T`\(x-2y=1\), with \(y=t\)`, T`\((1+2t,\ t)\)`]],
        pitfall: T`“Underdetermined” means fewer equations than unknowns; it does not promise that a solution exists. A solver that returns one answer has not shown it is the only one.`,
        seeAlso: [11]
      },
      {
        id: 'design-matrix', term: 'Design matrix for fitting a line',
        plain: T`To fit a line \(y=at+c\) to data, treat the slope \(a\) and the offset (intercept) \(c\) as the unknowns. Each observation \((t_i,y_i)\) gives one equation \(a\,t_i+c=y_i\), so \(A\) gets one row \([t_i,\ 1]\) per observation and \(b\) holds the observed values. This \(A\) is called the design matrix.`,
        formula: T`\begin{bmatrix}t_1&1\\t_2&1\\\vdots&\vdots\\t_n&1\end{bmatrix}\begin{bmatrix}a\\c\end{bmatrix}=\begin{bmatrix}y_1\\y_2\\\vdots\\y_n\end{bmatrix}`,
        steps: [T`Write one row \([t_i,\ 1]\) per observation; the 1 multiplies the intercept \(c\).`, T`Stack the observed \(y_i\) into \(b\) in the same order.`, T`Two distinct \(t\) values give exactly one line; more noisy points usually give no exact solution.`],
        examples: [[T`points \((1,3)\) and \((2,5)\)`, T`\(A=\begin{bmatrix}1&1\\2&1\end{bmatrix},\ b=(3,5)\), so \(a=2,\ c=1\)`], [T`points \((0,1),\ (1,2),\ (2,2)\)`, T`three equations, two unknowns, no exact line: see Lesson 10`]],
        pitfall: T`The column of ones is part of the model, not data. Leave it out and the line is forced through the origin.`,
        seeAlso: [10, 12, 52]
      }
    ]
  });

  add(10, {
    builds: [{lesson: 9, why: 'starts from systems Ax = b that have no exact solution'}, {lesson: 6, why: 'the fit projects b, as x was projected onto u'}, {lesson: 3, why: 'the objective is a sum of squared residuals'}],
    recall: ['orthogonal-projection', 'residual', 'design-matrix', 'rank', 'transpose'],
    symbols: [
      ['x̂', 'x-hat: the least-squares solution (θ in the reading), a best compromise, not exact', 'least-squares'],
      ['A x̂ − b', 'the residual vector r: fitted values minus observations', 'least-squares'],
      ['Aᵀr=0', 'at the best fit the residual is perpendicular to every column of A', 'residual-orthogonality']
    ],
    terms: [
      {
        id: 'least-squares', term: 'Least squares', symbol: T`\hat x=\arg\min_x\|Ax-b\|_2^2`,
        plain: T`When \(Ax=b\) has no exact solution, least squares picks the \(x\) that makes the residual \(r=Ax-b\) as short as possible, by minimizing the sum of squared residuals. The hat marks this estimate \(\hat x\): the best compromise, not an exact solution. The fitted vector \(A\hat x\) is the projection of \(b\) onto the column space of \(A\).`,
        formula: T`\hat x=\arg\min_x\ \|Ax-b\|_2^2=\arg\min_x\ \sum_i\bigl((Ax)_i-b_i\bigr)^2`,
        steps: [T`Write the design matrix \(A\) and the observations \(b\).`, T`Solve the normal equations \(A^TA\hat x=A^Tb\), or call a least-squares solver.`, T`Compute the residual \(r=A\hat x-b\) and inspect it.`],
        examples: [[T`constant model \(\hat y=c\), targets \(1,2,3\)`, T`\(\hat c=2\), the mean; residuals \((1,0,-1)\)`], [T`line \(y=at+c\) through \((0,1),\ (1,2),\ (2,2)\)`, T`\(a=1/2,\ c=7/6\); squared residuals add up to \(1/6\)`]],
        pitfall: T`Least squares finds the best fit under squared error, not the true parameters. One large outlier can pull the fit a long way, because its error is squared.`,
        seeAlso: [11, 12, 52]
      },
      {
        id: 'normal-equations', term: 'Normal equations', symbol: T`A^TA\hat x=A^Tb`,
        plain: T`The normal equations turn a least-squares problem into an ordinary square system. Multiply both sides of \(Ax=b\) by \(A^T\): the result \(A^TA\hat x=A^Tb\) has exactly one solution when the columns of \(A\) are independent. They say the same as “the residual is perpendicular to every column”.`,
        formula: T`A^T(A\hat x-b)=0\iff A^TA\,\hat x=A^Tb`,
        steps: [T`Compute \(A^TA\), called the Gram matrix: the dot products of every pair of columns of \(A\).`, T`Compute \(A^Tb\): the dot product of each column with \(b\).`, T`Solve the small square system, for example by elimination.`],
        examples: [[T`\(A=\begin{bmatrix}0&1\\1&1\\2&1\end{bmatrix},\ b=(1,2,2)\)`, T`\(A^TA=\begin{bmatrix}5&3\\3&3\end{bmatrix},\ A^Tb=(6,5)\)`], [T`solve \(5a+3c=6,\ 3a+3c=5\)`, T`subtract: \(2a=1\), so \(a=1/2\) and \(c=7/6\)`], [T`constant model: \(A\) is a column of ones`, T`\(n\,\hat c=\sum_i b_i\), so \(\hat c\) is the mean`]],
        pitfall: T`The normal equations explain the answer, but forming \(A^TA\) can make rounding errors worse (Lesson 11). In code use \(\texttt{np.linalg.lstsq}\).`,
        seeAlso: [11, 12, 52]
      },
      {
        id: 'residual-orthogonality', term: 'Residual orthogonal to the columns', symbol: T`A^Tr=0`,
        plain: T`At the best fit, the residual is perpendicular to every column of \(A\): its dot product with each column is zero. If it were not, nudging the parameters along that column would shorten the residual. The individual residuals need not be zero; only these dot products are.`,
        formula: T`r=A\hat x-b,\qquad a_j^Tr=0\ \text{ for every column }a_j\text{ of }A`,
        steps: [T`Compute the residual \(r=A\hat x-b\).`, T`Take the dot product of \(r\) with each column of \(A\).`, T`Every one should be 0, up to rounding.`],
        examples: [[T`line fit: \(r=(\tfrac16,-\tfrac13,\tfrac16)\) with the ones column`, T`\(\tfrac16-\tfrac13+\tfrac16=0\)`], [T`the same \(r\) with the \(t\) column \((0,1,2)\)`, T`\(0-\tfrac13+2\cdot\tfrac16=0\)`], [T`constant fit to \(1,2,3\): \(r=(1,0,-1)\)`, T`sum \(0\): orthogonal to the ones column`]],
        pitfall: T`A residual sum of zero does not mean every point is fitted exactly: \((1,0,-1)\) sums to zero, yet two points are missed.`,
        seeAlso: [14, 15]
      },
      {
        id: 'minimum-of-a-quadratic', term: 'Minimizing a quadratic: min and argmin', symbol: T`\arg\min_c f(c)`,
        plain: T`\(\min_c f(c)\) is the smallest value \(f\) can take; \(\arg\min_c f(c)\) is the input \(c\) where that happens. A squared-error loss in one parameter is a U-shaped parabola, so school algebra finds its lowest point: \(Ac^2+Bc+C\) with \(A>0\) is lowest at \(c=-B/(2A)\). Lesson 17 reaches the same answer using slopes.`,
        formula: T`f(c)=Ac^2+Bc+C,\ \ A>0\quad\Longrightarrow\quad\arg\min_c f(c)=-\frac{B}{2A}`,
        steps: [T`Expand the loss into the form \(Ac^2+Bc+C\).`, T`Read off \(A\) and \(B\), and check \(A>0\) so the parabola opens upwards.`, T`The minimizer is \(c=-B/(2A)\); substitute it back to get the minimum value.`],
        examples: [[T`\((c-1)^2+(c-2)^2+(c-3)^2=3c^2-12c+14\)`, T`argmin \(c=12/6=2\), the mean of the targets`], [T`\((c-5)^2+1\)`, T`argmin \(5\), min \(1\)`], [T`\((\theta-2)^2+\theta^2=2\theta^2-4\theta+4\)`, T`argmin \(\theta=4/4=1\), min \(2\)`]],
        plot: {fn: 'x => (x - 1) ** 2 + (x - 2) ** 2 + (x - 3) ** 2', x: [-1, 5], y: [0, 30], xLabel: 'constant c', yLabel: 'sum of squared errors', marks: [1, 2, 3]},
        pitfall: T`min is a value of the loss; argmin is a parameter value. For \((c-5)^2+1\) they are 1 and 5.`,
        seeAlso: [11, 12, 17, 29]
      }
    ]
  });

  add(11, {
    builds: [{lesson: 10, why: 'QR and the pseudoinverse are safer routes to least squares'}, {lesson: 6, why: 'orthonormal columns are perpendicular unit vectors'}],
    recall: ['least-squares', 'normal-equations', 'orthogonal-projection', 'unit-vector', 'identity-matrix'],
    symbols: [
      ['κ₂', 'kappa-2, the condition number: largest stretch divided by smallest stretch', 'condition-number'],
      ['σ', 'sigma: a singular value, one of the stretch factors of the matrix', 'singular-value']
    ],
    terms: [
      {
        id: 'orthonormal-columns', term: 'Orthonormal vectors and columns', symbol: T`Q^TQ=I`,
        plain: T`Vectors are orthonormal when each has length 1 and every pair is perpendicular. Put them as the columns of \(Q\) and \(Q^TQ=I\): each column dotted with itself gives 1, and with any other gives 0. Multiplying by such a \(Q\) never stretches lengths, which makes it numerically safe. The steps below, called Gram–Schmidt, build orthonormal vectors from independent ones.`,
        formula: T`q_i^Tq_j=\begin{cases}1,&i=j\\0,&i\ne j\end{cases}\iff Q^TQ=I`,
        steps: [T`Gram–Schmidt: divide the first vector by its length, \(q_1=a_1/\|a_1\|_2\).`, T`From the second vector subtract its projection onto \(q_1\): \(a_2-(q_1^Ta_2)\,q_1\).`, T`Divide what remains by its length to get \(q_2\).`, T`Check that \(q_1^Tq_2=0\) and that both lengths are 1.`],
        examples: [[T`\((1,0)\) and \((0,1)\)`, T`orthonormal`], [T`\((0.6,0.8)\) and \((-0.8,0.6)\)`, T`orthonormal: both have length 1, and \(-0.48+0.48=0\)`], [T`\(a_1=(1,0,1)\)`, T`\(q_1=(1,0,1)/\sqrt2\approx(0.707,0,0.707)\)`]],
        pitfall: T`Orthogonal alone means perpendicular; orthonormal also requires length 1. For a tall \(Q\), \(Q^TQ=I\) but \(QQ^T\ne I\).`,
        seeAlso: [13, 14, 51]
      },
      {
        id: 'qr-decomposition', term: 'QR decomposition', symbol: T`A=QR`,
        plain: T`QR writes a tall matrix \(A\) with independent columns as \(Q\) times \(R\). \(Q\) has orthonormal columns spanning the same space as \(A\); \(R\) is a small square upper-triangular matrix (zeros below the diagonal) recording how to rebuild the columns of \(A\). Least squares then becomes \(R\hat x=Q^Tb\), solved without forming \(A^TA\) or any inverse.`,
        formula: T`A=QR,\quad Q^TQ=I,\quad R=\begin{bmatrix}r_{11}&r_{12}\\0&r_{22}\end{bmatrix}\quad\Longrightarrow\quad R\hat x=Q^Tb`,
        steps: [T`Run Gram–Schmidt on the columns of \(A\) to get the columns of \(Q\).`, T`Record the numbers used: \(r_{11}=\|a_1\|_2\), \(r_{12}=q_1^Ta_2\), and \(r_{22}\), the length of what was left of \(a_2\).`, T`Compute \(Q^Tb\), then solve \(R\hat x=Q^Tb\) by back substitution.`],
        examples: [[T`\(A=\begin{bmatrix}1&0\\0&1\\1&1\end{bmatrix}\), first column \((1,0,1)\)`, T`\(r_{11}=\sqrt2\approx1.414\), \(q_1=(1,0,1)/\sqrt2\)`], [T`second column \(a_2=(0,1,1)\)`, T`\(r_{12}=1/\sqrt2\approx0.707\); left over \((-0.5,1,0.5)\), so \(r_{22}=\sqrt{1.5}\approx1.225\)`]],
        pitfall: T`Libraries compute QR with more stable methods (Householder reflections) than hand Gram–Schmidt, and may flip signs, but the result means the same. A tall \(Q\) is not square, so \(Q^T\) is not its inverse.`
      },
      {
        id: 'back-substitution', term: 'Back substitution',
        plain: T`An upper-triangular system has zeros below the diagonal, so its last equation contains only the last unknown. Solve that one first, then substitute upwards one row at a time. This is how \(R\hat x=Q^Tb\) is solved after a QR decomposition.`,
        formula: T`\begin{bmatrix}r_{11}&r_{12}\\0&r_{22}\end{bmatrix}\begin{bmatrix}x_1\\x_2\end{bmatrix}=\begin{bmatrix}y_1\\y_2\end{bmatrix}\ \Longrightarrow\ x_2=\frac{y_2}{r_{22}},\quad x_1=\frac{y_1-r_{12}x_2}{r_{11}}`,
        steps: [T`Solve the bottom row: it has a single unknown.`, T`Substitute that value into the row above and solve for its unknown.`, T`Continue upwards until every unknown is known.`],
        examples: [[T`\(\begin{bmatrix}2&1\\0&4\end{bmatrix}x=(4,8)\)`, T`\(x_2=8/4=2\), then \(x_1=(4-1\cdot2)/2=1\)`], [T`\(\begin{bmatrix}1&2\\0&5\end{bmatrix}x=(7,10)\)`, T`\(x_2=2\), then \(x_1=7-2\cdot2=3\)`]],
        pitfall: T`Work from the bottom up. A zero on the diagonal means there is no unique solution.`
      },
      {
        id: 'singular-value', term: 'Singular values', symbol: T`\sigma_{\max},\ \sigma_{\min}`,
        plain: T`Every matrix stretches some directions more than others. Its singular values are these stretch factors along special perpendicular directions. They are never negative and are listed from the largest, \(\sigma_{\max}\), to the smallest, \(\sigma_{\min}\). A singular value of 0 marks a direction squashed flat, and the number of non-zero ones is the rank. Lesson 14 finds the directions.`,
        formula: T`\sigma_{\max}=\max_{\|x\|_2=1}\|Ax\|_2,\qquad\sigma_{\min}=\min_{\|x\|_2=1}\|Ax\|_2\quad(A\text{ square or tall})`,
        steps: [T`For a diagonal matrix, read them off: the sizes (absolute values) of the diagonal entries.`, T`Sort them from largest to smallest.`, T`For any other matrix, use a library, for example \(\texttt{np.linalg.svd}\).`],
        examples: [[T`\(\operatorname{diag}(10,0.5)\)`, T`\(\sigma_{\max}=10,\ \sigma_{\min}=0.5\)`], [T`\(\operatorname{diag}(1,0.001)\)`, T`\(1\) and \(0.001\)`], [T`\(\operatorname{diag}(3,-5)\)`, T`\(5\) and \(3\): sizes, sorted`], [T`\(\begin{bmatrix}1&1\\1&1\end{bmatrix}\)`, T`\(2\) and \(0\): rank 1`]],
        pitfall: T`Here \(\sigma\) is a singular value, not the sigmoid function of Lesson 04. Singular values are never negative, even when the matrix entries are.`,
        seeAlso: [13, 14, 16]
      },
      {
        id: 'condition-number', term: 'Condition number', symbol: T`\kappa_2(A)=\frac{\sigma_{\max}}{\sigma_{\min}}`,
        plain: T`The condition number measures how much a problem can magnify small errors in its data: the strongest stretch divided by the weakest. A value near 1 is safe; a large value means a tiny change in the measurements \(b\) can cause a large change in the solution. It belongs to the problem, not to the solver.`,
        formula: T`\kappa_2(A)=\frac{\sigma_{\max}}{\sigma_{\min}}\ge1,\qquad\kappa_2(A^TA)=\kappa_2(A)^2\ \ (\text{full column rank})`,
        steps: [T`Find the largest and smallest singular values.`, T`Divide the largest by the smallest.`, T`If you form \(A^TA\), square the result: that is the sensitivity the normal equations face.`],
        examples: [[T`\(\sigma_{\max}=10,\ \sigma_{\min}=0.5\)`, T`\(\kappa_2=20\); for \(A^TA\), \(400\)`], [T`\(\operatorname{diag}(1,0.001)\)`, T`\(\kappa_2=1000\); for \(A^TA\), one million`], [T`\(\operatorname{diag}(1,0.001)\), \(b=(1,0.001)\) changed to \((1,0.0011)\)`, T`the solution moves from \((1,1)\) to \((1,1.1)\): a nudge of 0.0001 moves it by 0.1`]],
        pitfall: T`A large condition number warns that errors can be amplified; it does not mean every error will be. A tiny residual does not prove the recovered parameters are accurate.`,
        seeAlso: [12, 32, 50]
      },
      {
        id: 'pseudoinverse', term: 'Pseudoinverse and minimum-norm solution', symbol: T`A^{+}`,
        plain: T`When a system has many least-squares solutions, the pseudoinverse picks the one with the smallest length. It works for any matrix, square or not, full rank or not, and agrees with the ordinary inverse when that exists. Libraries compute it from the singular values, treating very small ones as zero.`,
        formula: T`\hat x=A^{+}b\ \text{ is the least-squares solution with the smallest }\|\hat x\|_2`,
        steps: [T`Describe all solutions, for example with a free parameter \(t\).`, T`Write the squared length of the solution in terms of \(t\).`, T`Choose the \(t\) that makes it smallest: the lowest point of a parabola.`, T`In code: \(\texttt{np.linalg.pinv(A) @ b}\), or \(\texttt{np.linalg.lstsq}\).`],
        examples: [[T`\(x_1+x_2=2\)`, T`solutions \((t,\ 2-t)\); squared length \(2t^2-4t+4\) is smallest at \(t=1\): \((1,1)\)`], [T`another solution, \((0,2)\)`, T`the same fit, but squared length 4 instead of 2`], [T`\(2x_1+x_2=5\)`, T`minimum-norm solution \((2,1)\), a multiple of the coefficients \((2,1)\)`]],
        pitfall: T`The pseudoinverse picks one answer from many; it does not make the others wrong. Its tolerance for “zero” singular values is a numerical choice that can change the reported rank.`,
        seeAlso: [14]
      }
    ]
  });

  add(12, {
    builds: [{lesson: 10, why: 'ridge adds a penalty to the least-squares objective'}, {lesson: 11, why: 'adding λI also improves the conditioning'}],
    recall: ['least-squares', 'normal-equations', 'vector-norm', 'minimum-of-a-quadratic', 'identity-matrix'],
    symbols: [
      ['λ', 'lambda: how strongly large weights are penalized; zero or positive', 'ridge-regression'],
      ['w', 'the weights being fitted and penalized (θ in the reading)', 'ridge-regression']
    ],
    terms: [
      {
        id: 'overfitting', term: 'Overfitting',
        plain: T`A model overfits when it follows the noise in its training data so closely that it predicts new data badly. The warning sign is a training error that keeps falling while the error on held-out data rises. Flexible models with many parameters and few observations overfit most easily.`,
        steps: [T`Fit the model on training data and record the training error.`, T`Measure the error on data the fit never saw.`, T`A low training error with a much higher held-out error signals overfitting.`],
        examples: [[T`a cubic \(at^3+bt^2+ct+d\) through \((0,0.1),(1,1.3),(2,1.7),(3,3.2)\)`, T`passes through all four points: training MSE \(0\); predicts \(7.7\) at \(t=4\)`], [T`the least-squares line on the same points`, T`\(y=0.97t+0.12\): training MSE \(\approx0.051\); predicts \(4.0\) at \(t=4\)`]],
        pitfall: T`A training error of zero is not a goal in itself; it often means the model has memorized the noise.`,
        seeAlso: [28, 32, 39]
      },
      {
        id: 'regularization', term: 'Regularization',
        plain: T`Regularization adds a penalty to the training loss that charges for something you want to avoid, such as large weights. A strength \(\lambda\ge0\) sets the trade-off: \(\lambda=0\) gives the plain fit, while a larger \(\lambda\) accepts a slightly worse training fit in exchange for smaller, steadier weights that often predict new data better.`,
        formula: T`\text{total cost}=\text{data loss}(w)+\lambda\cdot\text{penalty}(w),\qquad\lambda\ge0`,
        steps: [T`Choose a penalty, such as the squared length \(\|w\|_2^2\).`, T`Add \(\lambda\) times the penalty to the data loss.`, T`Minimize the total, for several values of \(\lambda\).`],
        examples: [[T`\(w=(3,-1)\), \(\lambda=0.5\)`, T`penalty \(\|w\|_2^2=9+1=10\), so the added cost is \(5\)`], [T`\(\lambda=0\)`, T`no penalty: ordinary least squares`]],
        pitfall: T`Regularization changes the problem being solved, not just the arithmetic. Its answer is a different, deliberately shrunk estimate.`,
        seeAlso: [26, 39]
      },
      {
        id: 'ridge-regression', term: 'Ridge regression', symbol: T`\min_w\|Xw-y\|_2^2+\lambda\|w\|_2^2`,
        plain: T`Ridge regression is least squares plus a penalty of \(\lambda\) times the squared length of the weights. It shrinks the weights towards zero, more strongly as \(\lambda\) grows. Its solution solves \((X^TX+\lambda I)w=X^Ty\), which has exactly one solution whenever \(\lambda>0\) (the reading says the matrix is positive definite), even if the columns of \(X\) are dependent.`,
        formula: T`(X^TX+\lambda I)\,\hat w=X^Ty;\qquad\text{one weight: }\ \hat w=\arg\min_w\,(w-2)^2+\lambda w^2=\frac{2}{1+\lambda}`,
        steps: [T`Compute \(X^TX\) and \(X^Ty\), as for the normal equations.`, T`Add \(\lambda\) to every diagonal entry of \(X^TX\).`, T`Solve the system. With one weight, expand the cost into a parabola and take its lowest point; the reading gets the same result with derivatives.`],
        examples: [[T`\(\lambda=0\)`, T`\(\hat w=2\): fit error \(0\), penalty \(0\)`], [T`\(\lambda=1\)`, T`\(\hat w=1\): fit error \((1-2)^2=1\), penalty \(1\)`], [T`\(\lambda=4\)`, T`\(\hat w=0.4\): fit error \(2.56\), penalty \(0.64\)`]],
        plot: {fn: 'x => 2 / (1 + x)', x: [0, 5], y: [0, 2], xLabel: 'penalty strength λ', yLabel: 'fitted weight ŵ', marks: [0, 1, 4]},
        pitfall: T`Ridge is sensitive to feature units, because rescaling a feature changes its penalty. Rescale features using training statistics first, and usually leave the intercept unpenalized.`,
        seeAlso: [26, 39]
      },
      {
        id: 'train-validation-test-split', term: 'Training, validation and test data',
        plain: T`Split the data into three parts with separate jobs. The training set fits the weights; the validation set chooses settings such as \(\lambda\); the test set is used once, at the end, to estimate how the finished procedure does on new data. If the test set helps choose anything, it stops being an honest test.`,
        steps: [T`Fit one model per candidate \(\lambda\) on the training set.`, T`Compute each model’s error on the validation set and pick the smallest.`, T`Report the chosen model’s error on the test set, once.`],
        examples: [[T`validation MSE \(4.1,\ 3.2,\ 3.6\) for \(\lambda=0.1,\ 1,\ 10\)`, T`choose \(\lambda=1\)`], [T`training MSE \(1.0,\ 1.4,\ 2.5\) for the same \(\lambda\)`, T`training error alone would wrongly favour the smallest \(\lambda\)`]],
        pitfall: T`Never tune on the test set: choosing \(\lambda\) by test error makes the reported test score look better than it really is.`,
        seeAlso: [16, 28, 46]
      }
    ]
  });
})();
