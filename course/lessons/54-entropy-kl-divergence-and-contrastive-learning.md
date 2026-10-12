# Lesson 54 - Entropy, KL divergence and contrastive learning

**Module:** 14 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 04, 25 and 27; revisit surprise as a negative logarithm, negative log-likelihood and the softmax gradient \(p-y\) if they feel unfamiliar.

**Goal:** Measure uncertainty and mismatch between distributions, and read cross-entropy, label smoothing, distillation and contrastive losses as KL-based objectives.

## Entropy is average surprise

Lesson 04 measured the surprise of an outcome with probability p as \(-\ln p\): a certain outcome costs nothing and a rare one costs a lot. Entropy is the surprise you expect on average when outcomes really follow p:

\[
H(p)=-\sum_{k=1}^{K}p_k\ln p_k,\qquad 0\le H(p)\le\ln K,
\]

with the convention \(0\ln0=0\), so impossible classes add nothing. With the natural logarithm the unit is the nat; with \(\log_2\) it is the bit, and you convert by dividing nats by \(\ln2\approx0.693\). For \(p=(\tfrac12,\tfrac14,\tfrac14)\) the surprises are 1, 2 and 2 bits, so \(H=\tfrac12\cdot1+\tfrac14\cdot2+\tfrac14\cdot2=1.5\) bits \(=1.040\) nats.

A one-hot distribution has entropy 0: nothing is uncertain. The uniform distribution has the largest entropy, \(\ln K\); for four classes that is \(\ln4=1.386\) nats, exactly 2 bits. The next section shows why no distribution can exceed it.

## Cross-entropy is entropy plus KL divergence

Cross-entropy \(H(p,q)=-\sum_k p_k\ln q_k\) is the average surprise when outcomes follow p but you score them with a model q. Adding and subtracting \(\sum_k p_k\ln p_k\) splits it into two parts:

\[
H(p,q)=H(p)+\mathrm{KL}(p\,\|\,q),\qquad \mathrm{KL}(p\,\|\,q)=\sum_k p_k\ln\frac{p_k}{q_k}.
\]

The Kullback–Leibler divergence is never negative. Using \(\ln x\le x-1\), \(-\mathrm{KL}(p\,\|\,q)=\sum_k p_k\ln\frac{q_k}{p_k}\le\sum_k p_k\left(\frac{q_k}{p_k}-1\right)\le1-1=0\), with equality only when q = p. Three consequences follow. Entropy is a floor that no model can beat. For a fixed target, H(p) is a constant, so minimizing cross-entropy over the model is the same as minimizing \(\mathrm{KL}(p\,\|\,q)\). And for a one-hot target H(p) = 0, so the Lesson 27 loss \(-\ln q_t\) is itself a KL divergence; averaged over a training set it is the mean negative log-likelihood of Lesson 25. Taking q uniform gives \(\mathrm{KL}(p\,\|\,u)=\ln K-H(p)\ge0\), which is why \(\ln K\) is the maximum entropy.

KL is not a distance. For \(p=(0.5,0.5)\) and \(q=(0.8,0.2)\), \(\mathrm{KL}(p\,\|\,q)=0.5\ln0.625+0.5\ln2.5=0.223\) but \(\mathrm{KL}(q\,\|\,p)=0.8\ln1.6+0.2\ln0.4=0.193\). The direction matters most when the model family cannot match p. Take a two-mode target \(p=(0.48,0.02,0.02,0.48)\) and two candidates: a uniform \(q_A\) that covers both modes, and \(q_B=(0.94,0.02,0.02,0.02)\) that sits on one mode. The forward divergence prefers covering: \(\mathrm{KL}(p\,\|\,q_A)=0.525<\mathrm{KL}(p\,\|\,q_B)=1.203\), because it punishes q for being small wherever p is large. The reverse divergence prefers one mode: \(\mathrm{KL}(q_A\,\|\,p)=0.937>\mathrm{KL}(q_B\,\|\,p)=0.568\), because it punishes q for putting mass where p has little. Maximum-likelihood training uses the forward, mass-covering direction; many variational methods use the reverse, mode-seeking one. The vision books treat KL only briefly; MacKay's Information Theory, Inference, and Learning Algorithms develops entropy and relative entropy in full.

## Softer targets: label smoothing and distillation

Label smoothing replaces the one-hot label y by \(p=(1-\varepsilon)y+\varepsilon/K\). With K = 4 and ε = 0.1 the target is (0.925, 0.025, 0.025, 0.025). Its entropy, \(-0.925\ln0.925-3(0.025\ln0.025)=0.349\) nats, is now a positive floor for the loss. Because cross-entropy is smallest when q = p, and a softmax has \(q_t/q_j=e^{z_t-z_j}\), the best logits satisfy

\[
z_t-z_j=\ln\frac{p_t}{p_j}=\ln\frac{0.925}{0.025}=\ln37=3.61.
\]

With a one-hot target the same equation asks for an infinite gap, so the loss keeps rewarding ever larger logits. Smoothing caps the gap, which discourages overconfidence and often improves calibration (Lesson 28). The Lesson 27 gradient p − y becomes q − p: once \(q_t\) rises past 0.925, gradient descent pushes \(z_t\) back down.

Knowledge distillation trains a student to match a teacher's whole distribution. Both logit vectors are softened with a temperature T, \(p^T=\operatorname{softmax}(v/T)\) for the teacher and \(q^T=\operatorname{softmax}(z/T)\) for the student, and the student minimizes \(T^2\,\mathrm{KL}(p^T\,\|\,q^T)\), usually alongside ordinary cross-entropy with the true labels. Teacher logits (3, 1, 0) give (0.844, 0.114, 0.042) at T = 1 but (0.481, 0.292, 0.227) at T = 4, which reveals how the teacher ranks the wrong classes. The gradient of the KL term with respect to \(z_i\) is \((q_i^T-p_i^T)/T\), and the difference itself shrinks as T grows. For a student with logits (1, 0.5, 0), the gradient on its first logit is −0.337 at T = 1 and −0.026 at T = 4; multiplying by \(T^2\) gives −0.337 and −0.421. The \(T^2\) factor keeps the soft-target gradients on a comparable scale when you change T.

## Contrastive learning is classification over a batch

In contrastive learning an anchor embedding u, say of an image, is compared with N candidate embeddings, say of captions, exactly one of which is its true partner. Normalize every embedding to unit length so each score is a cosine similarity \(s_j=u^Tv_j\in[-1,1]\) (Lesson 06). The InfoNCE loss is

\[
L=-\ln\frac{\exp(s^+/\tau)}{\sum_{j=1}^{N}\exp(s_j/\tau)},
\]

which is exactly softmax cross-entropy with logits \(s_j/\tau\) and a one-hot target on the positive. For \(s=(0.8,0.2,0.1,-0.3)\) with the first candidate positive and τ = 0.1, the logits are (8, 2, 1, −3) and \(L=\ln(1+e^{-6}+e^{-7}+e^{-11})=0.0034\). With τ = 1 the same similarities give L = 0.866. The temperature matters because cosines live in [−1, 1]: at τ = 1 even the best possible case with four candidates, \(s^+=1\) and every other similarity −1, cannot push the loss below \(\ln(1+3e^{-2})=0.341\).

If the similarities carry no information, all N logits are equal and \(L=\ln N\), which is 1.386 for N = 4: the chance level. More generally the expected loss satisfies \(\ln N-\mathbb E[L]\le I(u;v)\), so lowering the loss raises a lower bound on the mutual information between paired views, but that bound can never certify more than \(\ln N\) nats. This is one reason contrastive methods use large batches.

CLIP applies this to a batch of B image–caption pairs. Form the B × B matrix \(S_{ij}=\cos(f(x_i),g(t_j))\) of image and text embeddings; its diagonal holds the true pairs. Each row is an InfoNCE problem in which an image must pick its caption, each column one in which a caption must pick its image, and the loss averages the two directions. Every other pair in the batch serves as a negative at no extra cost. SimCLR does the same with two augmented views of each image in place of an image and its caption.

## Practice before opening the answers

1. Compute the entropy of \(p=(\tfrac12,\tfrac14,\tfrac18,\tfrac18)\) in bits and in nats, and compare it with the maximum for four classes.
2. For \(p=(0.5,0.5)\) and \(q=(0.9,0.1)\), compute \(\mathrm{KL}(p\,\|\,q)\) and \(\mathrm{KL}(q\,\|\,p)\). Which is larger, and why?
3. Apply label smoothing with K = 5 and ε = 0.2. Write the target, compute its entropy, and find the logit gap \(z_t-z_j\) that minimizes cross-entropy.
4. An image has cosine similarities (0.6, 0.2, 0.0, −0.2) with four captions, and the first caption is its true partner. Compute the InfoNCE loss for τ = 0.2 and for τ = 1, and compare both with \(\ln4\).

## Check your understanding

Show that cross-entropy equals entropy plus KL divergence, explain why minimizing it against a fixed target minimizes \(\mathrm{KL}(p\,\|\,q)\), and write InfoNCE as a softmax cross-entropy over similarities divided by τ.

## Read with a purpose

CV 5.3.4 and 5.4.7; MML 6.4.6 for a brief note on KL divergence and 8.3 for maximum likelihood. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
