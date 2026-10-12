# Lesson 02 - Functions, graphs and composition

**Time:** 60 minutes plus 30 minutes of practice.
**Goal:** read a function as a rule, understand slope, and distinguish the order of operations.

## A function is a rule

A function takes an allowed input and produces one output. For \(f(x)=2x+10\), input 30 produces 70. The domain is the set of allowed inputs; the codomain specifies the kind of output. A toy stored-pixel input may range from 0 to 255, while an unclipped calculation may produce values beyond that range.

## Read slope and offset

For \(y=ax+b\), increasing x by 1 changes y by a. This is the slope. The offset b is the output at \(x=0\). The graph of \(y=0.5x+10\) is a line: use inputs 0, 100 and 200 to get outputs 10, 60 and 110.

## Work through composition

Composition means applying one rule after another. Let \(f(x)=2x\) and \(g(x)=x+10\). Then \(g(f(x))=2x+10\), but \(f(g(x))=2x+20\). At \(x=30\) these are 70 and 80. Order matters. A neural network is also a composition, with trainable parameters in some of its rules.

## When one slope is not enough

The function \(h(x)=x^2\) is nonlinear: its slope changes with x. The input change from 1 to 2 increases the output by 3; the same input change from 10 to 11 increases the output by 21. Derivatives will let us describe such sensitivity precisely.

## A calculation you can reverse-check

Take a stored intensity \(x=40\). Pipeline A scales by 0.5 then adds 10: first 20, then 30. Pipeline B adds 10 then scales by 0.5: first 50, then 25. Write each intermediate result, not just the final result. The difference of 5 comes entirely from whether the offset is scaled.

Now check the domain. If your pipeline clips outputs to \([0,255]\), an input of 500 under Pipeline A would produce 260 before clipping and 255 after it. The clip is a separate function. You cannot recover 500 from the final output because other large inputs also become 255.

**Try before continuing:** what does Pipeline A produce for \(x=60\)? Compute \(30+10=40\). Its unclipped inverse is \(x=2(J-10)\), so \(J=40\) gives \(x=60\). The inverse check works for this value; it fails to identify a unique original once clipping has saturated the output.

## Practice and explanation

**Practice:** (1) Evaluate \(f(0),\ f(20),\ f(100)\) for \(f(x)=0.5x+10\). (2) Compose normalization \(n(x)=\frac{x}{255}\) with an offset \(g(x)=x+10\) in both orders. (3) Sketch \(y=x^2\) at \(x=-2,-1,0,1,2\). (4) Explain which operation, clipping or scaling, can map distinct inputs to the same output. (5) Explain why \(z=\max(0,x)\), the ReLU activation, is not a single straight line over all real x.

**Exit explanation:** Describe a two-stage computation and show why reversing its stages changes the output.

## Read with a purpose

CS205A 0.1 and 0.3; preview MML 2.7, where a linear mapping is a function between vector spaces. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
