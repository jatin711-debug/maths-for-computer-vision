# Lesson 55 - Attention and vision transformers

**Module:** 14 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 06, 27 and 41; revisit dot products, the softmax and the inductive bias of convolutions if they feel unfamiliar.

**Goal:** Compute scaled dot-product attention by hand and explain how a vision transformer turns an image into tokens.

## An image becomes a sequence of tokens

A vision transformer (ViT) does not slide a kernel over the image. It cuts the image into non-overlapping patches and treats each patch as one token. A 224 × 224 × 3 image with 16 × 16 patches gives \(224/16=14\) patches per side, so N = 196 patches. Each patch is flattened into \(16\cdot16\cdot3=768\) numbers and multiplied by one shared matrix E with 768 rows and D columns. Applying the same linear map to every non-overlapping patch is exactly a 16 × 16 convolution with stride 16 and D output channels.

Two more ingredients complete the input. A positional embedding, one learned D-vector per patch position, is added to each token; without it the model would not know where a patch came from. A learnable class token is placed in front of the sequence, and its final state feeds the classifier, a softmax head as in Lesson 27. The input is a matrix X with 197 rows, one per token, and D columns.

Patch size controls cost. Halving the patch to 8 × 8 gives \(28^2=784\) tokens, and the number of query–key pairs grows from \(196^2=38{,}416\) to \(784^2=614{,}656\), sixteen times more. Doubling it to 32 × 32 leaves only 49 tokens: cheap, but each token summarizes a large, coarse region. Computing all the scores costs on the order of \(N^2d\) operations, quadratic in the number of tokens.

## Scaled dot-product attention

Each token produces a query, a key and a value through three learned matrices, each with D rows and d columns: \(Q=XW_Q\), \(K=XW_K\), \(V=XW_V\). The score of token i for token j is the dot product \(q_i^Tk_j\), large when what i is looking for matches what j offers (Lesson 06). Then

\[
A=\operatorname{softmax}\!\left(\frac{QK^T}{\sqrt d}\right),\qquad Y=AV,
\]

with the softmax taken along each row. Every row of A is a probability distribution, with \(A_{ij}\ge0\) and \(\sum_jA_{ij}=1\), so each output row \(y_i=\sum_jA_{ij}v_j\) is a weighted average of the value vectors. The weights are recomputed for every image: unlike a convolution kernel, they depend on the content.

Take d = 4, a query q = (3, 1, 1, 0) and keys \(k_1=(1,0,0,1)\), \(k_2=(0,1,1,0)\), \(k_3=(-1,0,1,1)\). The scores are (3, 2, −2). Dividing by \(\sqrt4=2\) gives (1.5, 1, −1), and the softmax gives weights (0.592, 0.359, 0.049), which sum to 1. With values \(v_1=(1,0)\), \(v_2=(0,1)\) and \(v_3=(-1,-1)\), the output is \(0.592v_1+0.359v_2+0.049v_3=(0.544,\ 0.311)\), a point inside the triangle formed by the three values.

## Why divide by √d

Suppose the entries of q and k are independent with mean 0 and variance 1. Each product \(q_mk_m\) then has variance 1, and the variances of independent terms add (Lesson 23), so the score \(q^Tk=\sum_{m=1}^{d}q_mk_m\) has variance d and standard deviation \(\sqrt d\). For a head with d = 64 the scores typically spread over ±8 or more. Two scores 16 apart give softmax weights (0.9999999, 0.0000001): the row is almost one-hot. The softmax derivative \(\partial a_i/\partial s_i=a_i(1-a_i)\) is then about \(10^{-7}\), so the losing keys receive almost no gradient and the head stops learning which keys matter (Lesson 27). Dividing by \(\sqrt d=8\) brings the scores back to unit standard deviation: the same pair becomes (2, 0), with weights (0.881, 0.119) and derivative 0.105.

The scaling fixes growth with dimension, not every scale problem. If the embeddings themselves grow during training, the scores grow too; layer normalization, described next, helps keep them in range.

## Heads, blocks and what attention assumes

Multi-head attention runs h heads in parallel, each with its own \(W_Q\), \(W_K\) and \(W_V\) of width \(d=D/h\). Each head can attend to different patches for different reasons. Their N × d outputs are concatenated into an N × D matrix and mixed by one more D × D matrix \(W_O\). ViT-Base uses D = 768 and h = 12, so each head has d = 64, which is why the example above used \(\sqrt d=8\).

A transformer block wraps attention in two residual connections: \(z=x+\operatorname{MSA}(\operatorname{LN}(x))\) and then \(x'=z+\operatorname{MLP}(\operatorname{LN}(z))\). The residual path lets signals and gradients pass straight through many blocks. Layer normalization rescales each token's D features to mean 0 and variance 1, followed by a learned scale and shift; it normalizes within one token, not across a batch. The MLP has two linear layers with a nonlinearity between them and acts on each token separately; only attention mixes information between tokens.

Without positional embeddings, attention treats the tokens as a set. Shuffling the rows of X shuffles the rows and columns of \(QK^T\) in the same way, so the outputs are shuffled identically: \(\operatorname{Attention}(PX)=P\operatorname{Attention}(X)\) for any permutation matrix P. This is permutation equivariance, and the class token's output does not change at all. Compare the inductive bias of Lesson 41: a convolution builds in locality and translation equivariance through small shared kernels, while attention connects every pair of patches from the first layer and must learn from data which ones matter and where they are. That weaker bias is why ViTs overtook strong CNNs only after pre-training on very large datasets, and why they can relate distant parts of an image in a single layer.

## Practice before opening the answers

1. A ViT uses 16 × 16 patches on a 384 × 384 × 3 image. How many patch tokens are there, how long is each flattened patch, and how many entries does one head's attention matrix have once the class token is included?
2. Compute one attention row with d = 4: query q = (1, 0, 2, 1), keys \(k_1=(2,0,0,0)\) and \(k_2=(0,1,1,1)\), and scalar values \(v_1=4\), \(v_2=-2\). Give the weights and the output.
3. The entries of q and k are independent with mean 0 and variance 1, and d = 256. What are the standard deviations of \(q^Tk\) and of \(q^Tk/\sqrt d\)? Compare the softmax of two scores two standard deviations apart before and after scaling.
4. Explain why the class-token output of a self-attention layer without positional embeddings does not change when you shuffle the patches, and name two assumptions a CNN builds in that a ViT has to learn.

## Check your understanding

Compute \(\operatorname{softmax}(QK^T/\sqrt d)\,V\) for a small example, explain why the scores are divided by \(\sqrt d\), and count the tokens and the attention cost for a given image and patch size.

## Read with a purpose

CV 5.5.3, 5.4.3 and 6.6; MML 5.6. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
