# Lesson 56 - Multi-scale features: pyramids, FPN and U-Net

**Module:** 14 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 33, 35 and 43; revisit aliasing, the receptive-field recursion and the per-pixel output shape of segmentation if they feel unfamiliar.

**Goal:** Build Gaussian and Laplacian pyramids and explain how feature pyramids and U-Net skip connections give a network both resolution and context.

## One feature map cannot serve every object size

The same street photo can contain a pedestrian 24 pixels tall and a bus 400 pixels wide. A convolutional network sees them through feature maps of a fixed stride s: each cell of the map stands for an s×s block of pixels. On a 512×512 image a stride-32 map has 16×16 cells, and the pedestrian is only \(24/32=0.75\) of a cell tall. Its position is known only to within 32 pixels, and its evidence is mixed with whatever else falls in that cell.

A fine map has the opposite problem. Lesson 35's recursion \(r_{\text{next}}=r+(K-1)j\) says that a 3×3 layer at jump \(j=4\) widens the receptive field by only 8 pixels, while the same layer at \(j=32\) widens it by 64. Units of a stride-4 map are precise but have seen little context, so they are weak at deciding what an object is; units of a stride-32 map have seen a lot but cannot say exactly where it is. The classical remedy is to run a detector on several resized copies of the image. That works, but costs a full network pass per scale. This lesson builds the classical pyramid first, then shows how networks get the same benefit in one pass.

## Gaussian and Laplacian pyramids

A Gaussian pyramid starts from the image \(G_0\) and repeats one step: blur, then keep every second pixel in each direction,

\[
G_{k+1}=\operatorname{down}_2\big(g*G_k\big).
\]

The blur is not decoration. Keeping every second pixel halves the sampling rate, so the highest frequency the new grid can represent drops from 0.5 to 0.25 cycles per original pixel. Detail above that limit would alias into false coarse patterns (Lesson 33); the blur removes it first. Each level has a quarter of the pixels of the one below, so all levels together need fewer than \(1+\frac14+\frac1{16}+\dots=\frac43\) times the storage of the image.

The Laplacian pyramid stores what each halving lost. With an upsampling operator that doubles the size,

\[
L_k=G_k-\operatorname{up}(G_{k+1})\quad(k<n),\qquad L_n=G_n,\qquad G_k=L_k+\operatorname{up}(G_{k+1}).
\]

Each \(L_k\) is a band of detail: the part of \(G_k\) that the coarser level cannot predict. Rebuilding runs from the top: start with \(L_n\), upsample, add \(L_{n-1}\), and repeat. Reconstruction is exact for any blur and any upsampling, provided the same up() is used to build and to rebuild, because each step adds back exactly what was subtracted.

Work it in 1D with the simplest choices: blur-and-halve by averaging each pair, and upsample by repeating each sample twice. For \(G_0=(4,6,10,2)\), the averages give \(G_1=(5,6)\) and \(G_2=(5.5)\). Then \(\operatorname{up}(G_1)=(5,5,6,6)\), so \(L_0=(-1,1,4,-4)\); \(\operatorname{up}(G_2)=(5.5,5.5)\), so \(L_1=(-0.5,0.5)\); and \(L_2=(5.5)\). Rebuild: \(L_1+\operatorname{up}(L_2)=(5,6)=G_1\), then \(L_0+\operatorname{up}(G_1)=(4,6,10,2)=G_0\). If you set \(L_0\) to zero, the result is \((5,5,6,6)\) and the error is exactly \(L_0\): that is what the finest level carries. Note that 4 samples became 7 stored numbers; the pyramid is slightly redundant. Practical pyramids use a 5-tap kernel such as \(\frac1{16}(1,4,6,4,1)\) and smoother upsampling, and then each \(L_k\) looks like the edges of the image at one scale.

## Feature pyramid networks

A backbone such as a ResNet already computes a pyramid: its stages produce maps \(C_2,C_3,C_4,C_5\) at strides 4, 8, 16 and 32, with more channels and more abstract features as the stride grows. Using these maps directly gives fine levels with weak semantics. A feature pyramid network (FPN) adds a top-down path. It starts with \(P_5\), a 1×1 convolution of \(C_5\) to 256 channels, and for \(k=4,3,2\) forms

\[
P_k=\operatorname{up}(P_{k+1})+\operatorname{conv}_{1\times1}(C_k),
\]

with nearest-neighbour upsampling by 2 and a lateral 1×1 convolution that brings \(C_k\) to the same 256 channels. A 3×3 convolution on each merged map then smooths the upsampling artefacts. Every \(P_k\) now combines its own resolution with the semantics of the deeper levels, much as Laplacian reconstruction adds the coarse level back to the stored detail. Because all levels have the same width, one detection head is shared across them.

Each object is handled on the level that suits its size. A region of \(w\times h\) pixels is pooled from

\[
k=\left\lfloor k_0+\log_2\frac{\sqrt{wh}}{224}\right\rfloor,\qquad k_0=4,
\]

clamped to the levels that exist, 2 to 5. A 224×224 box goes to \(P_4\), a 112×112 box to \(P_3\) because \(\log_2 0.5=-1\), and a 448×448 box to \(P_5\). A 40×40 box gives \(4+\log_2(40/224)\approx1.51\), floor 1, so it is clamped to \(P_2\). Doubling the side raises the level by one, so an unclamped box always spans between 14 and 28 cells of its level, the way an image pyramid presents every object at a similar size.

Anchors are the reference boxes that a detector's head scores and adjusts. In the FPN region proposal network each cell of \(P_k\) holds anchors of side \(8\cdot2^k\) pixels (32, 64, 128 and 256 on \(P_2\) to \(P_5\)) in A aspect ratios, usually 1:2, 1:1 and 2:1 with the area kept fixed. A 512×512 image therefore has \(128^2\cdot3=49{,}152\) anchors on \(P_2\), 12,288 on \(P_3\), 3,072 on \(P_4\) and 768 on \(P_5\): 65,280 in all, three quarters of them on the finest level. The original FPN also adds a stride-64 level with 512-pixel anchors; RetinaNet uses 9 anchors per cell.

## U-Net, skip connections and upsampling

Segmentation (Lesson 43) needs a label for every pixel at full resolution, yet the context that decides each label is only available after many strided layers. U-Net solves this with an encoder and a decoder of matching scales. With padded convolutions, a 256×256×3 input passes through encoder stages at 256, 128, 64 and 32 pixels with 64, 128, 256 and 512 channels, down to a 16×16×1024 bottleneck. The decoder upsamples step by step; at each scale it concatenates the encoder map of the same size (a skip connection) and convolves. At 32×32, for example, 512 upsampled channels plus 512 skipped channels make 1024 channels before the next convolutions. A final 1×1 convolution produces logits of shape 256×256×C. The skips carry the precise location that downsampling removed, the role \(L_k\) plays in a Laplacian pyramid, while the decoder brings the context. FPN adds the two streams; U-Net concatenates them and lets the next convolution learn how to mix them.

Three upsampling operators are common. Nearest-neighbour repeats values, has no parameters and gives blocky maps. Bilinear interpolation weights the nearest inputs by distance; it is smooth and also parameter-free. A transposed convolution is learned: with stride s it places a copy of the kernel, scaled by each input value, every s output positions and sums the overlaps. For input size \(n\), kernel k, stride s, padding p and output padding q,

\[
n_{\text{out}}=(n-1)s-2p+k+q.
\]

With \(n=16,\ k=4,\ s=2,\ p=1\) this gives \(15\cdot2-2+4=32\), an exact doubling. When k is not a multiple of s the copies overlap unevenly: with \(k=3,\ s=2\), interior outputs alternately receive one and two kernel taps, which can print a checkerboard pattern until the weights learn to compensate. Choosing \(k=4\) gives every interior output two taps; another common fix is to resize with nearest or bilinear upsampling and then apply an ordinary 3×3 convolution.

## Practice before opening the answers

1. Build the Laplacian pyramid of the 1D signal (2,8,6,0) using pair averaging and repetition, then rebuild it. What does the rebuilt signal become if L₀ is set to zero?
2. A 640×640 image goes through an FPN with levels P₂ to P₅ (strides 4, 8, 16, 32) and 3 anchors per cell. How many anchors are on each level, and in total?
3. With k=⌊4+log₂(√(wh)/224)⌋ clamped to 2 to 5, assign boxes of 112×112, 300×200, 50×30 and 1200×1000 pixels to levels.
4. A transposed convolution with kernel 3, stride 2 and padding 1 takes a 16×16 map. What is the output side, and what does output padding 1 change? Why can this layer print a checkerboard, and which kernel size avoids uneven overlap at stride 2?

## Check your understanding

Explain why a Laplacian pyramid rebuilds the image exactly whatever blur is used, compute the feature-map sizes, anchor counts and FPN level for a given image and box, and say what U-Net skip connections supply that the decoder alone cannot.

## Read with a purpose

CV 3.5.2-3.5.3, 5.4.1, 6.3.3, 6.4 and 6.4.2-6.4.3. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
