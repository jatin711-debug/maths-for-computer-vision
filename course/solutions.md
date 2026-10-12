# Solutions - open after attempting the work

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
