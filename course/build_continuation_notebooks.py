"""Create and execute four NumPy notebooks; no foundation file is overwritten."""
from pathlib import Path
from contextlib import redirect_stdout
import io, json, textwrap
BASE=Path(__file__).resolve().parent
reports=[]

def md(text): return dict(cell_type='markdown',metadata={},source=textwrap.dedent(text).strip()+'\n')
def code(text): return dict(cell_type='code',metadata={},source=textwrap.dedent(text).strip()+'\n',execution_count=None,outputs=[])
def write(name,cells):
    namespace={};count=0
    for cell in cells:
        if cell['cell_type']!='code': continue
        count+=1;output=io.StringIO()
        with redirect_stdout(output): exec(compile(cell['source'],name,'exec'),namespace)
        cell['execution_count']=count
        if output.getvalue(): cell['outputs']=[dict(output_type='stream',name='stdout',text=output.getvalue())]
    notebook=dict(nbformat=4,nbformat_minor=5,metadata=dict(kernelspec=dict(display_name='Python 3',language='python',name='python3'),language_info=dict(name='python',version='3')),
                  cells=[dict(id=f'cell-{i:03d}',**cell) for i,cell in enumerate(cells)])
    (BASE/'notebooks'/name).write_text(json.dumps(notebook,indent=2)+'\n',encoding='utf-8')
    reports.append(dict(file=name,executed_code_cells=count,result='passed'))

write('linear-algebra-and-pca.ipynb',[
md('''# Linear algebra, fitting and PCA · Modules 2–4
Run top to bottom with Python 3 and NumPy. Predict the numbers before executing each cell. The demonstrations are complete; the experiment prompts ask you to change one thing and explain the result.

Keep the same train/validation/test split while comparing representations. Synthetic bars teach mechanics, not real-image performance.'''),
code('''import numpy as np
np.set_printoptions(precision=4, suppress=True)
rng = np.random.default_rng(205)
x = np.array([3.,4.]); u = np.array([1.,1.])
projection = u * (u @ x) / (u @ u)
residual = x-projection
assert np.allclose(u @ residual,0)
print('length:',np.linalg.norm(x),'projection:',projection,'residual:',residual)
A = np.array([[2.,1.],[0.,1.]])
print('Ax:', A @ np.array([1.,2.]))
B = np.array([[1.,1.],[2.,2.]])
assert np.allclose(B @ np.array([1.,-1.]),0)
print('B rank:',np.linalg.matrix_rank(B))'''),
md('''## Predict and explain
Change x so it is perpendicular to u. Predict its projection. Then make a full-rank B and explain which nonzero null vector disappears.

## Least squares
Write the design matrix and solve the worked line fit. Residual orthogonality is a check on this known mathematical case.'''),
code('''t = np.array([0.,1.,2.]); b = np.array([1.,2.,2.])
design = np.column_stack([t,np.ones_like(t)])
theta,_,rank,singular = np.linalg.lstsq(design,b,rcond=None)
residual = design @ theta-b
assert np.allclose(theta,[.5,7/6])
assert np.allclose(design.T @ residual,0,atol=1e-12)
print('slope, intercept:',theta,'MSE:',np.mean(residual**2))
print('rank and singular values:',rank,singular)
for outlier in [0.,3.]:
    observations=b.copy();observations[-1]+=outlier
    for penalty in [0.,1.,4.]:
        # The intercept is deliberately unpenalized.
        augmented=np.vstack([design,[np.sqrt(penalty),0.]])
        targets=np.r_[observations,0.]
        fit=np.linalg.lstsq(augmented,targets,rcond=None)[0]
        print('outlier, lambda, fit:',outlier,penalty,fit)
print('condition diag(1,.001):',np.linalg.cond(np.diag([1.,.001])))'''),
md('''## Image SVD
This factors one pixel matrix. PCA below instead factors centered samples. Check the storage calculation and the sum of discarded squared singular values for each k.'''),
code('''image=np.zeros((12,12));image[2:10,3:5]=1;image[6:8,1:11]+=.6
image+=np.linspace(0,.2,12)[None,:]
U,s,Vt=np.linalg.svd(image,full_matrices=False)
for k in [1,2,3,6]:
    reconstruction=(U[:,:k]*s[:k]) @ Vt[:k]
    error=np.sum((image-reconstruction)**2)
    assert np.allclose(error,np.sum(s[k:]**2),atol=1e-12)
    print('k, squared error, factor storage:',k,error,k*(12+12+1))
print('original storage:',image.size)'''),
md('''## A training-only recognition pipeline
Generate independent noisy 8x8 bars, split once, and fit every representation using training data. Each row is one flattened image. This is a deliberately small nearest-centroid baseline.'''),
code('''def bars(n):
    y=rng.integers(0,2,n);images=np.zeros((n,8,8))
    for i,label in enumerate(y):
        position=int(rng.integers(1,6))
        if label==0: images[i,position:position+2,:]=1.
        else: images[i,:,position:position+2]=1.
    images+=rng.normal(0,.12,images.shape)
    return images.reshape(n,-1),y
X,y=bars(240)
Xtr,Xval,Xtest=X[:160],X[160:200],X[200:]
ytr,yval,ytest=y[:160],y[160:200],y[200:]
mu=Xtr.mean(axis=0)
_,singular,Vt=np.linalg.svd(Xtr-mu,full_matrices=False)
def centroid_predict(train,labels,new):
    centers=np.stack([train[labels==c].mean(axis=0) for c in [0,1]])
    distances=np.sum((new[:,None,:]-centers[None,:,:])**2,axis=2)
    return distances.argmin(axis=1)
raw_val=np.mean(centroid_predict(Xtr,ytr,Xval)==yval)
centers=np.stack([Xtr[ytr==c].mean(axis=0) for c in [0,1]])
assert np.all(np.linalg.norm(centers,axis=1)>0) and np.all(np.linalg.norm(Xval,axis=1)>0)
unit_centers=centers/np.linalg.norm(centers,axis=1,keepdims=True)
unit_validation=Xval/np.linalg.norm(Xval,axis=1,keepdims=True)
cosine_prediction=(unit_validation @ unit_centers.T).argmax(axis=1)
print('Euclidean/cosine validation accuracy:',raw_val,np.mean(cosine_prediction==yval))
choices=[2,4,8,16];scores=[]
for k in choices:
    basis=Vt[:k].T
    train=(Xtr-mu) @ basis;validation=(Xval-mu) @ basis
    score=np.mean(centroid_predict(train,ytr,validation)==yval)
    scores.append(score)
    print('components, validation accuracy:',k,score)
selected=choices[int(np.argmax(scores))]
basis=Vt[:selected].T
test_prediction=centroid_predict((Xtr-mu) @ basis,ytr,(Xtest-mu) @ basis)
print('raw validation:',raw_val,'selected k:',selected)
print('fixed PCA procedure test accuracy:',np.mean(test_prediction==ytest),'test count:',len(ytest))
assert (Xtest-mu).shape[1]==basis.shape[0]'''),
md('''## Your experiment
Before seeing test results, declare a new comparison: change noise or component choices, but keep the split protocol. Use a fresh held-out test set for that revised procedure. Explain why centering on the validation mean would make this a different and leaky pipeline. Submit a shape-annotated forward calculation, an error denominator, and one failure or declared stressful example.''')])

write('calculus-and-probability.ipynb',[
md('''# Calculus, noise and uncertainty · Modules 5–6
Use Python 3 and NumPy. Name the assumption behind each estimate. A numerical derivative checks a computation locally; an uncertainty estimate applies to its declared sampling model.'''),
code('''import numpy as np
np.set_printoptions(precision=8,suppress=True)
rng=np.random.default_rng(206)
def loss(theta):
    x,y=theta
    return x*x+3*x*y+y*y
def analytic(theta):
    x,y=theta
    return np.array([2*x+3*y,3*x+2*y])
def central_gradient(fn,theta,h):
    result=np.zeros_like(theta,dtype=float)
    for j in range(len(theta)):
        plus=theta.copy();minus=theta.copy()
        plus[j]+=h;minus[j]-=h
        result[j]=(fn(plus)-fn(minus))/(2*h)
    return result
theta=np.array([1.,2.]);g=analytic(theta)
print('analytic gradient:',g)
for h in [1e-2,1e-4,1e-6,1e-8]:
    numeric=central_gradient(loss,theta,h)
    print('h, numerical, max abs error:',h,numeric,np.max(np.abs(numeric-g)))
assert np.allclose(central_gradient(loss,theta,1e-4),g,atol=1e-8)
# A nonquadratic derivative shows truncation error as well.
for h in [.1,.01,1e-5,1e-8]:
    numeric=((2+h)**3-(2-h)**3)/(2*h)
    print('cubic step, error:',h,numeric-12)'''),
md('''## Chain-rule check
Write a=w*x+b and L=(a-target)^2/2. Derive the parameter gradients before running the cell. Do not modify parameters while computing a backward pass.'''),
code('''x=2.;w=3.;b=1.;target=5.
a=w*x+b;r=a-target
print('forward:',a,'loss:',r*r/2)
print('dL/dw, dL/db, dL/dx:',r*x,r,r*w)
assert np.allclose([r*x,r,r*w],[4,2,6])
prior=.2;recall=.8;false_rate=.1
tp=prior*recall;fp=(1-prior)*false_rate
posterior=tp/(tp+fp)
assert np.isclose(posterior,2/3)
print('P(object | flag):',posterior)
print('uniform [0,2], P([.5,1.5]):',(1.5-.5)/2)'''),
md('''## Gaussian noise and averages
These are unclipped floating-point measurements. Clipping would change the model. Estimate variance reduction over many independent trials and compare it with sigma^2/N.'''),
code('''sigma=2.;n=16;trials=20000
measurements=50.+rng.normal(0,sigma,(trials,n))
averages=measurements.mean(axis=1)
estimated=averages.var(ddof=1)
expected=sigma**2/n
print('mean estimate:',averages.mean(),'variance of mean:',estimated,'model variance:',expected)
assert abs(estimated-expected)<.03
X=np.array([-1.,0.,1.]);Y=X**2
covariance=np.mean((X-X.mean())*(Y-Y.mean()))
assert np.isclose(covariance,0)
print('dependent X,Y with covariance zero:',covariance)'''),
md('''## Accuracy sampling uncertainty
The independent Bernoulli model is explicit. Bootstrap the observed outcomes with replacement. This simple percentile interval is approximate and cannot create unseen failure modes.'''),
code('''correct=rng.binomial(1,.8,100)
accuracy=correct.mean();se=np.sqrt(accuracy*(1-accuracy)/len(correct))
replicates=correct[rng.integers(0,len(correct),(4000,len(correct)))].mean(axis=1)
interval=np.quantile(replicates,[.025,.975])
print('accuracy:',accuracy,'N:',len(correct),'plug-in SE:',se)
print('rough normal interval:',accuracy+np.array([-1,1])*1.96*se)
print('bootstrap percentile interval:',interval)
assert 0<=interval[0]<=interval[1]<=1
print('3 successes out of 3: naive plug-in SE is',np.sqrt(1*(1-1)/3),'and is misleading.')'''),
md('''## Your experiment
Sweep finite-difference step size on a smooth nonquadratic loss. Predict when error falls and when roundoff matters. Then vary independent sample count and plot or tabulate variance of the mean. Finally, explain why correlated video frames need a group-based sampling model rather than treating every frame as independent.''')])

write('learning-and-backprop.ipynb',[
md('''# Losses, optimization and backpropagation · Modules 7–8 and 10
Python 3 and NumPy only. Derive the equations in Lessons 27 and 38 first. The nonlinear task is noisy XOR; it makes the limitation of a linear decision boundary visible. It is a controlled teaching problem, not a real-image benchmark.'''),
code('''import numpy as np
np.set_printoptions(precision=5,suppress=True)
rng=np.random.default_rng(207)
def probabilities(z):
    shifted=z-z.max(axis=1,keepdims=True)
    exp=np.exp(shifted)
    return exp/exp.sum(axis=1,keepdims=True)
def cross_entropy(z,y):
    shifted=z-z.max(axis=1,keepdims=True)
    return np.mean(np.log(np.exp(shifted).sum(axis=1))-shifted[np.arange(len(y)),y])
print('stable probabilities:',probabilities(np.array([[1000.,1001.]])))
assert np.allclose(probabilities(np.array([[1000.,1001.]])),probabilities(np.array([[0.,1.]])))
for alpha in [.1,.75,1.,1.2]:
    w=0.;history=[]
    for step in range(8):
        history.append((w,(w-3)**2));w-=alpha*2*(w-3)
    print('learning rate:',alpha,'first/last weight,loss:',history[0],history[-1])'''),
md('''## Split once and standardize on training only
The declared comparison uses 1200 full-batch updates at learning rate 0.15 for each model. Keep the test split until the training and validation procedure is fixed.'''),
code('''bits=rng.integers(0,2,(400,2));labels=(bits[:,0]!=bits[:,1]).astype(int)
features=bits+rng.normal(0,.06,bits.shape)
Xtr,Xval,Xtest=features[:240],features[240:320],features[320:]
ytr,yval,ytest=labels[:240],labels[240:320],labels[320:]
mu=Xtr.mean(axis=0);scale=Xtr.std(axis=0)
Xtr=(Xtr-mu)/scale;Xval=(Xval-mu)/scale;Xtest=(Xtest-mu)/scale
Y=np.eye(2)[ytr]
linear_W=np.zeros((2,2));linear_b=np.zeros(2)
for _ in range(1200):
    logits=Xtr @ linear_W+linear_b
    G=(probabilities(logits)-Y)/len(ytr)
    dW=Xtr.T @ G;db=G.sum(axis=0)
    linear_W-=.15*dW;linear_b-=.15*db
print('linear training loss:',cross_entropy(Xtr @ linear_W+linear_b,ytr))
print('linear validation accuracy:',np.mean((Xval @ linear_W+linear_b).argmax(axis=1)==yval))'''),
md('''## Implement every backward equation
The gradients are all computed before any parameter update. ReLU at exactly zero uses derivative zero by convention. The loss is a mean across examples.'''),
code('''parameters={'W1':rng.normal(0,.7,(2,12)),'b1':np.full(12,.2),
            'W2':rng.normal(0,.2,(12,2)),'b2':np.zeros(2)}
def forward(X,p):
    Z1=X @ p['W1']+p['b1'];A1=np.maximum(0,Z1)
    logits=A1 @ p['W2']+p['b2']
    return Z1,A1,logits
def loss_grad(X,y,p):
    Z1,A1,logits=forward(X,p)
    G2=(probabilities(logits)-np.eye(2)[y])/len(y)
    G1=(G2 @ p['W2'].T)*(Z1>0)
    gradients={'W2':A1.T @ G2,'b2':G2.sum(axis=0),
               'W1':X.T @ G1,'b1':G1.sum(axis=0)}
    return cross_entropy(logits,y),gradients
batch=Xtr[:8];target=ytr[:8]
_,analytic=loss_grad(batch,target,parameters)
checks=[]
for name,index in [('W1',(0,0)),('W1',(1,4)),('b1',(2,)),('W2',(3,1)),('b2',(0,))]:
    value=parameters[name][index];h=1e-5
    parameters[name][index]=value+h;plus=loss_grad(batch,target,parameters)[0]
    parameters[name][index]=value-h;minus=loss_grad(batch,target,parameters)[0]
    parameters[name][index]=value
    numeric=(plus-minus)/(2*h);error=abs(numeric-analytic[name][index])
    checks.append(error);print('gradient check:',name,index,error)
assert max(checks)<1e-6'''),
md('''## Train after the derivative checks
Record both training and validation evidence. Model capacity and training quality are different questions.'''),
code('''initial=loss_grad(Xtr,ytr,parameters)[0];history=[]
for step in range(1200):
    loss,gradients=loss_grad(Xtr,ytr,parameters)
    for name in parameters: parameters[name]-=.15*gradients[name]
    if step%200==0: history.append((step,loss))
final=loss_grad(Xtr,ytr,parameters)[0]
validation=forward(Xval,parameters)[2]
assert np.isfinite(final) and final<initial
print('MLP loss history:',history)
print('MLP final loss:',final,'validation accuracy:',np.mean(validation.argmax(axis=1)==yval))
# The procedure is fixed; inspect held-out test outcomes now.
linear_test=(Xtest @ linear_W+linear_b).argmax(axis=1)
mlp_logits=forward(Xtest,parameters)[2];mlp_test=mlp_logits.argmax(axis=1)
print('test count:',len(ytest),'linear accuracy:',np.mean(linear_test==ytest),
      'MLP accuracy:',np.mean(mlp_test==ytest),'MLP NLL:',cross_entropy(mlp_logits,ytest))
confusion=np.zeros((2,2),dtype=int)
np.add.at(confusion,(ytest,mlp_test),1)
print('confusion rows=true, columns=predicted:\\n',confusion)'''),
md('''## Your experiment
Write the forward and backward shapes without notes. Verify at least two new parameter coordinates. Declare one comparison using a fresh held-out split: remove the ReLU, change learning rate, or add a squared penalty with an explicitly stated reduction. Change one factor at a time. Report unsuccessful settings too, and explain why this synthetic result does not establish real-image performance.''')])

write('vision-and-metrics.ipynb',[
md('''# Filters, a trainable CNN and mask metrics · Modules 9, 11–12
Python 3 and NumPy only. The code uses valid unflipped cross-correlation and row-batch, channel-last activations. No GPU or framework is required. Derive local filter responses and the network backward equations first.

The synthetic classification and segmentation tasks establish mechanics for their generators. They are not benchmark detection or segmentation systems.'''),
code('''import numpy as np
np.set_printoptions(precision=4,suppress=True)
rng=np.random.default_rng(209)
def correlate(image,kernel):
    kh,kw=kernel.shape;h,w=image.shape
    out=np.zeros((h-kh+1,w-kw+1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]): out[i,j]=np.sum(image[i:i+kh,j:j+kw]*kernel)
    return out
image=np.array([[1.,2.,3.],[4.,5.,6.],[7.,8.,9.]])
kernel=np.array([[1.,0.],[0.,-1.]])
assert np.allclose(correlate(image,kernel),-4)
print('valid cross-correlation:\\n',correlate(image,kernel))
print('valid flipped convolution:\\n',correlate(image,kernel[::-1,::-1]))
row=np.array([1.,-1.,1.,-1.])
spectrum=np.fft.fft(row)
assert np.allclose(spectrum,[0,0,4,0])
assert np.allclose(np.fft.ifft(spectrum).real,row)
print('alternating-row DFT:',spectrum)
print('output length L7,K3,P1,S2:',(7+2-3)//2+1)'''),
md('''## Independent bars and a fixed protocol
Generate 160 training, 40 validation and 40 test images. The declared CNN has four 3x3 kernels, ReLU and a two-class flattened head. It trains all convolution and head parameters for 300 full-batch steps at learning rate 0.1. The test set is inspected only after this fixed procedure.'''),
code('''def make_bars(n):
    y=rng.integers(0,2,n);images=np.zeros((n,8,8))
    for i,label in enumerate(y):
        position=int(rng.integers(1,6))
        if label==0: images[i,position:position+2,:]=1
        else: images[i,:,position:position+2]=1
    images+=rng.normal(0,.1,images.shape)
    return images,y
X,y=make_bars(240)
Xtr,Xval,Xtest=X[:160],X[160:200],X[200:]
ytr,yval,ytest=y[:160],y[160:200],y[200:]
def patches(X):
    return np.lib.stride_tricks.sliding_window_view(X,(3,3),axis=(1,2)).reshape(len(X),6,6,9)
Ptr,Pval,Ptest=patches(Xtr),patches(Xval),patches(Xtest)
parameters={'K':rng.normal(0,.25,(9,4)),'bc':np.zeros(4),
            'W':rng.normal(0,.05,(144,2)),'b':np.zeros(2)}
def cnn(P,p):
    Z=np.einsum('nijk,kf->nijf',P,p['K'])+p['bc']
    A=np.maximum(0,Z).reshape(len(P),-1)
    logits=A @ p['W']+p['b']
    return Z,A,logits
def loss_grad(P,y,p):
    Z,A,logits=cnn(P,p)
    shifted=logits-logits.max(axis=1,keepdims=True)
    ex=np.exp(shifted);probs=ex/ex.sum(axis=1,keepdims=True)
    loss=np.mean(np.log(ex.sum(axis=1))-shifted[np.arange(len(y)),y])
    G=(probs-np.eye(2)[y])/len(y)
    Gconv=(G @ p['W'].T).reshape(Z.shape)*(Z>0)
    gradients={'W':A.T @ G,'b':G.sum(axis=0),
               'K':np.einsum('nijk,nijf->kf',P,Gconv),
               'bc':Gconv.sum(axis=(0,1,2))}
    return loss,gradients
assert cnn(Ptr[:2],parameters)[0].shape==(2,6,6,4)
print('trainable parameters:',sum(v.size for v in parameters.values()))'''),
md('''## Check a shared-kernel derivative
The kernel gradient accumulates contributions over the batch and all placements. All derivatives are computed using the original forward parameters.'''),
code('''_,analytic=loss_grad(Ptr[:4],ytr[:4],parameters)
for name,index in [('K',(1,2)),('bc',(1,)),('W',(17,0)),('b',(0,))]:
    value=parameters[name][index];h=1e-5
    parameters[name][index]=value+h;plus=loss_grad(Ptr[:4],ytr[:4],parameters)[0]
    parameters[name][index]=value-h;minus=loss_grad(Ptr[:4],ytr[:4],parameters)[0]
    parameters[name][index]=value
    numeric=(plus-minus)/(2*h);error=abs(numeric-analytic[name][index])
    print('CNN gradient check:',name,index,error)
    assert error<1e-6
initial=loss_grad(Ptr,ytr,parameters)[0]
for step in range(300):
    loss,gradients=loss_grad(Ptr,ytr,parameters)
    for name in parameters: parameters[name]-=.1*gradients[name]
final=loss_grad(Ptr,ytr,parameters)[0]
assert np.isfinite(final) and final<initial
print('CNN initial/final training loss:',initial,final)
print('validation accuracy:',np.mean(cnn(Pval,parameters)[2].argmax(axis=1)==yval))
print('fixed-procedure test accuracy:',np.mean(cnn(Ptest,parameters)[2].argmax(axis=1)==ytest),'N:',len(ytest))'''),
md('''## Box and ranking metrics
Boxes use continuous boundary coordinates without +1. This AP example is noninterpolated toy AP at one fixed matching threshold, not COCO AP.'''),
code('''def box_iou(a,b):
    left=np.maximum(a[:2],b[:2]);right=np.minimum(a[2:],b[2:])
    wh=np.maximum(0,right-left);intersection=np.prod(wh)
    union=np.prod(a[2:]-a[:2])+np.prod(b[2:]-b[:2])-intersection
    return intersection/union if union>0 else 0.
value=box_iou(np.array([0.,0.,2.,2.]),np.array([1.,1.,3.,3.]))
assert np.isclose(value,1/7)
print('box IoU:',value)
tp=np.array([1,0,1]);precision=np.cumsum(tp)/np.arange(1,4)
ap=precision[tp==1].sum()/2
assert np.isclose(ap,5/6)
print('ranked precision:',precision,'noninterpolated toy AP:',ap)'''),
md('''## A trainable pixel classifier for rectangles
One scalar logit per pixel models bright synthetic foreground. This is deliberately simpler than an encoder-decoder segmentation network. Train and select on separate images, then compare foreground IoU with the all-background baseline.'''),
code('''def rectangles(n):
    masks=np.zeros((n,8,8),dtype=bool)
    for i in range(n):
        top,left=rng.integers(0,4,2);height,width=rng.integers(2,5,2)
        masks[i,top:top+height,left:left+width]=True
    observed=.8*masks+rng.normal(0,.12,masks.shape)
    return observed,masks
observed,masks=rectangles(140)
train,validation,test=observed[:100],observed[100:120],observed[120:]
ttr,tval,ttest=masks[:100],masks[100:120],masks[120:]
a=1.;bias=0.
for _ in range(500):
    z=a*train+bias;p=1/(1+np.exp(-z))
    residual=p-ttr
    da=np.mean(residual*train);db=np.mean(residual)
    a-=.8*da;bias-=.8*db
def mask_metrics(pred,true):
    tp=np.sum(pred & true);fp=np.sum(pred & ~true);fn=np.sum(~pred & true)
    union=tp+fp+fn
    iou=tp/union if union else 0. # Explicit empty-union convention.
    dice=2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else 0.
    return dict(accuracy=float(np.mean(pred==true)),iou=float(iou),dice=float(dice),tp=int(tp),fp=int(fp),fn=int(fn))
print('pixel classifier parameters:',a,bias)
print('validation:',mask_metrics(a*validation+bias>=0,tval))
prediction=a*test+bias>=0
print('test all-background:',mask_metrics(np.zeros_like(ttest),ttest))
print('test learned mask:',mask_metrics(prediction,ttest))
assert prediction.shape==ttest.shape
assert mask_metrics(np.zeros_like(ttest),ttest)['iou']==0'''),
md('''## Capstone extension
Declare one new comparison before training: change bar noise, training augmentation, kernel count or rectangle contrast. Keep target transformations aligned with input transformations. Use fresh held-out data for a revised procedure. Save three failures or clearly labeled stressful cases; report coordinates, counts and metric conventions. Complete the capstone template with a baseline, one controlled improvement, reproducible settings and limits of the evidence.''')])

(BASE/'notebook-validation.json').write_text(json.dumps(reports,indent=2)+'\n',encoding='utf-8')
print(json.dumps(reports))
