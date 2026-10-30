# Lesson 35 - Padding, stride, channels and receptive fields

**Module:** 10 | **Study time:** 60 minutes learning + 30 minutes practice.

**Before you begin:** Lessons 32, 34 and 37; revisit any symbols you cannot yet explain.

**Goal:** Calculate output and parameter shapes and track receptive-field growth.

## Count legal kernel placements

For a one-dimensional input length L, symmetric padding P, kernel size K, stride S and dilation d, the output length is \(\left\lfloor\frac{L+2P-d(K-1)-1}{S}\right\rfloor+1\), provided the effective kernel fits. Dilation spaces the sampled kernel entries; with d=1 this reduces to \(\left\lfloor\frac{L+2P-K}{S}\right\rfloor+1\).

For \(L=7,\ K=3,\ P=1,\ S=2,\ d=1\), the length is \(\left\lfloor\frac{7+2-3}{2}\right\rfloor+1=4\). Apply the same formula separately to height and width. A convention called same padding may require asymmetric sides when dimensions or strides demand it; state the actual padding, rather than guessing from its name.

## Channels mix too

With row-style image batches X=(N,H,W,C_in), a kernel bank can be stored as (K_h,K_w,C_in,C_out). Each output position and output channel sums over the spatial patch and all input channels. The output shape is (N,H_out,W_out,C_out). A bias contributes one parameter per output channel.

A 3x3 layer mapping 3 channels to 8 has \(3\cdot3\cdot3\cdot8+8=224\) parameters with bias. The count is independent of image width and height because weights are shared. A dense layer connecting every input pixel to every output coordinate scales very differently.

## Trace the theoretical receptive field

Let r be the receptive-field width and j the spacing, in input pixels, between neighboring output centers. Start \(r=1,\ j=1\). For a layer with effective kernel \(K_{\mathrm{eff}}=d(K-1)+1\), \(r_{\mathrm{next}}=r+(K_{\mathrm{eff}}-1)j\) and \(j_{\mathrm{next}}=jS\). Two 3x3 stride-1 layers give r=3 then 5. If the first stride is 2, the second 3x3 layer gives r=7.

This theoretical field identifies which input coordinates can influence an output. Learned weights and nonlinearities determine how strongly they actually contribute. Padding may include positions outside the original image, so boundary outputs do not receive the same observed context as interior outputs.

## Explain the design tradeoff

Stride reduces resolution and computation but can lose localization detail. More channels provide more learned feature responses while increasing parameters and work. Write both activation shapes and parameter shapes for each proposed layer; channel count is not the same as spatial receptive-field size.

## Practice before opening the answers

1. For L=10,K=3,P=0,S=2,d=1, find output length.
2. Count parameters in a biased 3x3 layer from 4 to 6 channels.
3. Find receptive-field width after three 3x3 stride-1 layers.
4. For X=\((5,8,8,1)\), valid 3x3 stride-1 filtering with four kernels, give the output shape.

## Check your understanding

Annotate an unseen CNN with all activation shapes, parameter counts and a receptive-field calculation.

## Read with a purpose

CV 5.4; optional CS231n convolutional-network notes. Read the relevant definitions and example after attempting this lesson. Record one connection and one question; reading is part of your weekly study time.
