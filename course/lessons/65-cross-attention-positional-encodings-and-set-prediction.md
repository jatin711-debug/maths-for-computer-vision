# Lesson 65 - Cross-attention, positional encodings and set prediction

**Module:** 17 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 55, 42 and 27; Lesson 64 introduced Fourier features and Lesson 60 the Hungarian algorithm. Revisit scaled dot-product attention, IoU and softmax cross-entropy if they feel unfamiliar.

**Goal:** Compute cross-attention from learned queries to image tokens, encode positions with sinusoidal or Fourier features, and train a set predictor with a Hungarian-matched loss and GIoU.

## Cross-attention: queries from one set, keys and values from another

In self-attention (Lesson 55) the queries, keys and values all come from one token matrix X. Cross-attention takes them from two different sets: the queries from \(N_q\) query tokens \(X_q\), and the keys and values from \(N_{\rm img}\) image tokens \(X_{\rm img}\):

\[
Q=X_qW_Q,\quad K=X_{\rm img}W_K,\quad V=X_{\rm img}W_V,\qquad Y=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt d}\right)V.
\]

The weight matrix has \(N_q\) rows and \(N_{\rm img}\) columns. Row i says how much query i takes from each image token, so Y has one row per query, however many image tokens there are, and computing the scores costs on the order of \(N_qN_{\rm img}d\).

The DETR detector shows why this matters. Its CNN backbone reduces an 800 × 1088 image by a factor of 32 to 25 × 34 = 850 image tokens of width d = 256. Its decoder holds \(N_q=100\) object queries: learned vectors, the same for every image, each of which learns to ask for a kind of object in a kind of place. One cross-attention head computes 100 × 850 = 85,000 scores, against \(850^2=722{,}500\) for self-attention among the image tokens. After several decoder layers, each of the 100 output rows is turned into one class and one box. Text-to-image diffusion models use the same step to attend from image positions to the words of a prompt (Lesson 67).

A small example with d = 4, so \(\sqrt d=2\): an object query \(q=(2,0,1,1)\) meets three image tokens with keys \(k_1=(1,0,1,1)\), \(k_2=(0,1,0,0)\) and \(k_3=(1,1,0,0)\). The scores are (4, 0, 2), the scaled scores (2, 0, 1), and the softmax gives weights (0.665, 0.090, 0.245). With values \(v_1=(1,0)\), \(v_2=(0,1)\) and \(v_3=(0.5,0.5)\), the query's output is (0.788, 0.212): mostly the content of the first token.

## Positions as sines and cosines

Attention without positions treats its tokens as a set (Lesson 55). Lesson 55 learned one vector per position; the original transformer and DETR instead use fixed sinusoidal encodings. For a position p and an even width D,

\[
\mathrm{PE}(p)_{2i}=\sin(\omega_ip),\qquad \mathrm{PE}(p)_{2i+1}=\cos(\omega_ip),\qquad \omega_i=10000^{-2i/D},\quad i=0,\ldots,\tfrac D2-1.
\]

Each pair of entries is a point on a unit circle that turns at its own speed \(\omega_i\): fast pairs separate neighbouring positions, slow pairs distinguish distant ones. By the angle-addition formulas, moving by Δ rotates every pair:

\[
\begin{bmatrix}\sin\omega(p+\Delta)\\ \cos\omega(p+\Delta)\end{bmatrix}=\begin{bmatrix}\cos\omega\Delta&\sin\omega\Delta\\-\sin\omega\Delta&\cos\omega\Delta\end{bmatrix}\begin{bmatrix}\sin\omega p\\ \cos\omega p\end{bmatrix},\qquad \mathrm{PE}(p)^T\mathrm{PE}(p')=\sum_i\cos\bigl(\omega_i(p-p')\bigr).
\]

So the dot product of two encodings depends only on their offset. With D = 4 the frequencies are \(\omega=(1,\ 0.01)\), PE(0) = (0, 1, 0, 1) and PE(1) = (0.841, 0.540, 0.010, 1.000). Their dot product is \(\cos1+\cos0.01=1.540\), exactly the same as PE(5)·PE(4). It is largest, D/2 = 2, at zero offset. With many frequencies (DETR uses 64 per image axis, 128 sine and cosine features each for x and y) it falls off as positions move apart; with one or two frequencies it oscillates, and distant positions can look alike.

Rotary position embedding (RoPE) uses the rotation directly. Instead of adding an encoding to each token, it rotates each 2-D pair of a query at position m by the angle mθ, and each pair of a key at position n by nθ. Rotations keep lengths, and \((R(m\theta)q)^T(R(n\theta)k)=q^TR((n-m)\theta)k\), so the score sees only the offset n − m. With q = (1, 2), k = (2, 1) and θ = 0.5, positions (m, n) = (3, 1) and (5, 3) both give the score −0.363, while (1, 3) gives 4.686: the sign of the offset matters too. Fourier features (Lesson 64), \(\gamma(x)=(\sin2^k\pi x,\ \cos2^k\pi x)\), apply the same sines and cosines to continuous coordinates, so that a small network can represent fine detail.

## Detection as set prediction

A detector must output a set: the objects in an image have no natural order and their number varies. DETR therefore predicts a fixed number N of (class, box) pairs, one per query, with N larger than the number of objects in any image. Its class list has one extra entry, "no object" ∅, and the M ground-truth objects are padded with ∅ up to N. Before a prediction can be compared with a target, training must decide which prediction is responsible for which object. Comparing prediction i with object i in some listing order would make the loss depend on an arbitrary order, and the queries would compete for the same object.

The fix is to choose the best one-to-one assignment, a permutation σ of the predictions:

\[
\hat\sigma=\arg\min_{\sigma}\sum_{i=1}^{N}\mathbf 1_{\{c_i\ne\varnothing\}}\Bigl[-\hat p_{\sigma(i)}(c_i)+\lambda_{L1}\|b_i-\hat b_{\sigma(i)}\|_1+\lambda_{\rm giou}\bigl(1-\mathrm{GIoU}(b_i,\hat b_{\sigma(i)})\bigr)\Bigr].
\]

Here \(c_i\) and \(b_i\) are the class and box of target i, and \(\hat p_j\) and \(\hat b_j\) the class probabilities and box of prediction j. DETR uses \(\lambda_{L1}=5\) and \(\lambda_{\rm giou}=2\), with boxes written as normalised centre, width and height. Training then uses the matched pairs: a cross-entropy term \(-\ln\hat p_{\hat\sigma(i)}(c_i)\) for every query, with target ∅ for the unmatched ones, and the box terms for real objects. Since most queries are unmatched, DETR weights the ∅ terms by 0.1.

Choosing σ is the assignment problem met in Lesson 60: rows are targets, columns are predictions and the entries are matching costs. Trying every assignment means \(N!/(N-M)!\) candidates, about \(9.0\times10^9\) for N = 100 and M = 5. The Hungarian algorithm (Kuhn 1955) finds the exact minimum in on the order of \(N^3\) steps.

A worked example uses \(\lambda_{L1}=0\) and \(\lambda_{\rm giou}=1\). There are two objects, a cup at [0, 0, 2, 2] and a spoon at [3, 0, 5, 2], and three predictions with probabilities (cup, spoon, ∅):

- p1 has box [0, 0, 2, 2] and probabilities (0.8, 0.05, 0.15);
- p2 has box [0.5, 0, 2.5, 2] and probabilities (0.7, 0.1, 0.2);
- p3 has box [3.5, 0, 5.5, 2] and probabilities (0.1, 0.6, 0.3).

The cup row of the cost matrix is (−0.8, −0.3, 1.173) and the spoon row is (1.15, 1.011, −0.2). Of the six assignments, cup→p1 with spoon→p3 has the smallest total, −1.0; the runner-up, cup→p2 with spoon→p3, has −0.5. Prediction p2, a near-duplicate of p1, is matched to ∅, and its loss \(-\ln\hat p_2(\varnothing)=-\ln0.2=1.609\) pushes its no-object probability up. Duplicates are trained away, which is why DETR needs no non-maximum suppression (Lesson 42).

## GIoU: a box loss that still slopes when boxes do not overlap

Lesson 42 noted that the IoU of two separated boxes is 0 wherever they are, so the loss 1 − IoU gives no gradient to bring them together. Generalised IoU subtracts the fraction of the smallest enclosing box C that neither box covers:

\[
\mathrm{GIoU}(A,B)=\mathrm{IoU}(A,B)-\frac{|C\setminus(A\cup B)|}{|C|}=\mathrm{IoU}(A,B)-\frac{|C|-|A\cup B|}{|C|},\qquad -1<\mathrm{GIoU}\le1.
\]

Take A = [0, 0, 2, 2] and B = [3, 0, 5, 2]. They do not overlap, so \(\mathrm{IoU}=0\); the union is 8, and the enclosing box [0, 0, 5, 2] has area 10, so \(\mathrm{GIoU}=0-2/10=-0.2\). Slide B to [2, 0, 4, 2] and the boxes touch: the enclosing box equals the union, so \(\mathrm{GIoU}=0\). Slide it to [1, 0, 3, 2]: \(\mathrm{IoU}=2/6=1/3\), the enclosing area 6 again equals the union, and \(\mathrm{GIoU}=\mathrm{IoU}=1/3\). Moved out to [6, 0, 8, 2], GIoU falls to −0.5. The loss \(1-\mathrm{GIoU}\) therefore drops steadily, 1.5, 1.2, 1 and 0.667, as B approaches A, while \(1-\mathrm{IoU}\) stays at 1 until they overlap. Like IoU, GIoU does not change when both boxes are scaled up together; the L1 term does, so DETR combines the two.

## Practice before opening the answers

1. Compute IoU, the enclosing area and GIoU for A = [0, 0, 2, 2] and B = [4, 1, 6, 3]. Then move B to [3, 1, 5, 3]. Which position has the higher GIoU, and why does that help training?
2. A DETR-style decoder has 100 object queries and attends to the stride-32 features of an 800 × 1216 image. How many image tokens are there, how many entries does one head's cross-attention matrix have, and how many output rows? Compare with self-attention among the image tokens.
3. With D = 4 and \(\omega=(1,\ 0.01)\), compute PE(2) and the dot product PE(2)·PE(5). Explain why PE(12)·PE(15) gives the same value.
4. Targets T1, T2 and predictions P1, P2, P3 have the matching costs T1: (0.1, 0.3, 0.9) and T2: (0.2, 1.0, 0.8). Find the assignment with the smallest total, compare it with greedy matching, and say which prediction is trained towards ∅.

## Check your understanding

Compute one row of cross-attention and explain why the output has one row per query, show that the dot product of two sinusoidal encodings depends only on their offset, and explain why set prediction needs a one-to-one matching step and why GIoU gives a useful signal for boxes that do not overlap.

## Read with a purpose

CV 5.5.3 for transformers and cross-attention, and CV 6.3.3 and 6.4.2-6.4.3 for DETR and Mask2Former in context. The books do not cover the matching and encoding details, so read the primary papers: Carion et al. 2020, "End-to-End Object Detection with Transformers" (DETR; its third section derives the set loss); Kuhn 1955, "The Hungarian method for the assignment problem"; Rezatofighi et al. 2019, "Generalized Intersection over Union"; Su et al. 2021, "RoFormer" (rotary position embedding); and Vaswani et al. 2017, "Attention Is All You Need", for sinusoidal encodings. Record one connection and one question; reading is part of your weekly study time.
