/* Deterministic SVG scenes: the same frames drive the player and MP4 exports. */
(() => {
  'use strict';
  const orange='#f6a575', blue='#7fb8df', green='#97d7b0', muted='#b0c3b8', ink='#f4f5e9';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(x,y,s,size=20,color=ink,anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`;
  const line=(x,y,a,b,color=muted,width=2,dash='')=>`<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const rect=(x,y,w,h,color,stroke='none',radius=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${color}" stroke="${stroke}" stroke-width="2"/>`;
  const dot=(x,y,r=6,color=orange)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const arrow=(x,y,a,b,color=orange)=>line(x,y,a,b,color,3)+`<path d="M-9,-5 L0,0 L-9,5" fill="none" stroke="${color}" stroke-width="3" transform="translate(${a} ${b}) rotate(${Math.atan2(b-y,a-x)*180/Math.PI})"/>`;
  const rows=(x,y,lines,color=muted,size=18)=>lines.map((s,i)=>text(x,y+i*28,s,size,color)).join('');
  const matrix=(values,n,x,y,cell=55,active=[])=>values.map((v,i)=>{
    const a=x+(i%n)*cell,b=y+Math.floor(i/n)*cell;
    return rect(a,b,cell-5,cell-5,active.includes(i)?'#536952':'#30473b',active.includes(i)?orange:'#56715e',5)+text(a+(cell-5)/2,b+cell*.57,typeof v==='number'?Number(v.toFixed(2)):v,Math.min(22,cell*.38),ink,'middle');
  }).join('');
  const stories=[
    {id:'pixels',title:'An image is an array',tag:'01 / FOUNDATIONS',module:1,steps:[
      ['Represent','A 2 × 2 grayscale image','I = [20, 60; 100, 140]',['Row and column identify a pixel.','Stored intensity is a number.']],
      ['Scale','Multiply every entry by 0.5','0.5 I = [10, 30; 50, 70]',['The shape stays the same.','Every intensity is halved.']],
      ['Offset','Add 10 to each scaled value','J = [20, 40; 60, 80]',['The offset acts after scaling.','Order changes the result.']],
      ['Summarize','Check a property of the result','mean(J) = 50',['Original mean: 80.','0.5 × 80 + 10 = 50.']]]},
    {id:'projection',title:'A vector becomes two parts',tag:'02 / LINEAR ALGEBRA',module:2,steps:[
      ['Locate','Start with x = (3,4)','||x||₂ = 5',['Two coordinates define a vector.','The norm measures its length.']],
      ['Choose','Keep the direction u = (1,1)','uᵀx = 7 · uᵀu = 2',['The line contains multiples of u.','How much of x lies along it?']],
      ['Project','Choose coefficient c = 7/2','p = c u = (3.5,3.5)',['Projection lands on the line.','It is the closest point to x.']],
      ['Separate','What could not be represented?','r = x − p = (−0.5,0.5)',['uᵀr = 0: the residual is orthogonal.','x = p + r.']]]},
    {id:'fitting',title:'Least squares leaves a residual',tag:'03 / FITTING',module:3,steps:[
      ['Observe','Three imperfect observations','(0,1), (1,2), (2,2)',['A straight line has two parameters.','It cannot pass through all points.']],
      ['Predict','Use the fitted line','ŷ = 0.5 t + 7/6',['Predictions: 7/6, 5/3, 13/6.','The vertical gaps are residuals.']],
      ['Measure','Square each prediction error','r = [1/6, −1/3, 1/6]',['Sum of squared errors = 1/6.','MSE = (1/6)/3 = 1/18.']],
      ['Explain','Why this line is optimal','Aᵀr = 0',['r sums to zero.','0r₀ + 1r₁ + 2r₂ = 0.']]]},
    {id:'pca',title:'Keep a direction; lose some detail',tag:'04 / DIMENSION REDUCTION',module:4,steps:[
      ['Center','Subtract the training mean','Xc = X − μtrain',['The plotted cloud has mean zero.','Test data uses the same mean.']],
      ['Find','Locate the main direction','v₁ = (1,1)/√2',['This symmetric cloud varies most','along the diagonal direction.']],
      ['Compress','Keep one coordinate','score = xᵀv₁',['Every point becomes one scalar.','The perpendicular detail is lost.']],
      ['Rebuild','Map back to the retained line','x̂ = (xᵀv₁) v₁',['Reconstruction lies on the line.','Good reconstruction ≠ good labels.']]]},
    {id:'chain',title:'The chain rule follows the arrows',tag:'05 / CALCULUS',module:5,steps:[
      ['Forward','Break the function into operations','x=2 → a=x²=4 → y=3a+1=13',['Each node has a small local rule.','Compute values from left to right.']],
      ['Local','Measure each local sensitivity','da/dx = 4 · dy/da = 3',['Derivatives describe small changes.','Keep track of the evaluated input.']],
      ['Chain','Multiply along this path','dy/dx = 3 × 4 = 12',['A small change in x is amplified','through both operations.']],
      ['Predict','Compare with a nearby input','x=2.01 → y=13.1203',['Linear prediction: 13 + 12×0.01','= 13.12, close to the exact value.']]]},
    {id:'bayes',title:'An alert needs a base rate',tag:'06 / PROBABILITY',module:6,steps:[
      ['Count','Begin with 1,000 observations','200 object · 800 no object',['Each dot represents 10 cases.','Object prevalence is 20%.']],
      ['Detect','Flag 80% of object cases','160 true alerts · 40 missed',['Recall = P(alert | object) = 0.8.','This is not alert correctness.']],
      ['Include','Also flag 10% of non-objects','80 false alerts · 720 unflagged',['True and false alerts both appear','in the denominator of precision.']],
      ['Condition','Look only among the alerts','P(object | alert) = 160/240',['160 + 80 = 240 total alerts.','Posterior probability is 2/3.']]]},
    {id:'softmax',title:'Scores become probabilities and loss',tag:'07 / STATISTICAL LEARNING',module:7,steps:[
      ['Score','Three classes compete','z = [ln(3), 0, 0]',['Scores need not be probabilities.','The target is class 2 (zero-based).']],
      ['Normalize','Exponentiate, then divide','p = [3,1,1]/5 = [0.6,0.2,0.2]',['Probabilities are nonnegative.','They sum to one.']],
      ['Penalize','Read the correct-class probability','L = −ln(0.2) = ln(5)',['The model favoured class 0.','The true class receives only 0.2.']],
      ['Differentiate','Send a useful learning signal','dL/dz = [0.6,0.2,−0.8]',['Subtract the one-hot target.','Descent pushes the target score up.']]]},
    {id:'descent',title:'One small step down the loss',tag:'08 / OPTIMIZATION',module:8,steps:[
      ['Start','An imperfect parameter','w₀=0 · L=(w−3)²',['The best parameter is w=3.','Initial loss is 9.']],
      ['Differentiate','Find the local slope','g₀=2(w₀−3)=−6',['Use learning rate α=0.2.','Move opposite to the gradient.']],
      ['Update','Apply the first step','w₁=0−0.2(−6)=1.2',['New loss: (1.2−3)²=3.24.','The same rule computes each step.']],
      ['Repeat','Watch the error shrink','w₂=1.92 · w₃=2.352',['Each error is multiplied by 0.6.','A larger rate can overshoot.']]]},
    {id:'filter',title:'A kernel visits a neighbourhood',tag:'09 / IMAGE OPERATIONS',module:9,steps:[
      ['Select','A 3 × 3 patch in a 5 × 5 image','The first patch contains 3 ones',['A vertical step separates 0 and 1.','Valid output has shape 3 × 3.']],
      ['Weight','Use a mean kernel','Every kernel weight is 1/9',['Multiply nine entries by weights.','Add the products for one output.']],
      ['Write','The first output is 3/9','Response = 1/3',['The patch straddles the edge.','Averages soften that transition.']],
      ['Slide','Move the same kernel to the right','Next responses: 2/3, then 1',['The weights are shared.','Only the selected input patch moves.']]]},
    {id:'backprop',title:'A tiny network learns from its error',tag:'10 / NEURAL NETWORKS',module:10,steps:[
      ['Forward','x=2 → affine → ReLU → output','w₁=0.5, b₁=0, w₂=1 → ŷ=1',['z=1, so ReLU is active.','Target y=3.']],
      ['Loss','Half squared error','L=½(1−3)²=2 · dL/dŷ=−2',['The output is two units too low.','Reverse the sensitivity path.']],
      ['Backward','Multiply the local derivatives','gw₁=−4 · gb₁=−2 · gw₂=−2',['The ReLU derivative here is 1.','All gradients use the old weights.']],
      ['Step','Update together with α=0.1','w₁=0.9, b₁=0.2, w₂=1.2',['New hidden value=2; prediction=2.4.','New loss=½(2.4−3)²=0.18.']]]},
    {id:'overlap',title:'How close is a predicted box?',tag:'11 / COMPUTER VISION',module:11,steps:[
      ['Target','Locate the target box','A=[2,2,4,4] · area(A)=4',['Coordinates are continuous.','Width and height are both 2.']],
      ['Predict','Place another box nearby','B=[3,3,5,5] · area(B)=4',['Class correctness alone does not','measure the location error.']],
      ['Intersect','Measure the common region','Intersection width=1, height=1',['The shared area is 1.','Count it once in the union.']],
      ['Compare','Normalize by all covered area','IoU = 1/(4+4−1) = 1/7',['Identical boxes have IoU 1.','Disjoint boxes have IoU 0.']]]},
    {id:'evaluation',title:'Choose a metric that sees the error',tag:'12 / EVIDENCE & CAPSTONE',module:12,steps:[
      ['Target','Nine foreground pixels','A 5 × 5 target mask',['Foreground: 9; background: 16.','Each pixel is one binary decision.']],
      ['Baseline','Predict background everywhere','Accuracy = 16/25 = 64%',['The baseline misses every object pixel.','Foreground IoU is zero.']],
      ['Recover','Predict the nine target pixels','TP=9 · FP=0 · FN=0',['The toy mask is now exact.','Foreground IoU and Dice are 1.']],
      ['Report','Connect a number to its meaning','Name the split and metric',['Tune on validation; test once.','Show real failures and assumptions.']]]},
    {id:'homography',title:'A plane seen in perspective',tag:'13 / GEOMETRY',module:13,noVideo:true,steps:[
      ['Square','Start with a square grid','corners (0,0) … (1,1)',['Four corners, nine grid lines.','Opposite sides are parallel.']],
      ['Lift','Append a 1 to every point','x̃ = (x, y, 1)',['Homogeneous coordinates.','Scaling x̃ names the same point.']],
      ['Map','Multiply by a 3 × 3 matrix H','x̃′ = H x̃ = (u, v, w)',['One matrix moves every point.','Eight numbers fix H up to scale.']],
      ['Divide','Divide by the last coordinate','x′ = (u / w, v / w)',['Lines stay straight.','Parallel lines can now meet.']]]},
    {id:'attention',title:'Every patch looks at every patch',tag:'14 / ATTENTION',module:14,noVideo:true,steps:[
      ['Tokens','Cut the image into patches','x₁ … x₆ ∈ ℝᵈ',['Each patch becomes a vector.','Order is added as position.']],
      ['Compare','Score query against each key','sⱼ = qᵀkⱼ / √d',['Large dot product = similar.','√d keeps scores in range.']],
      ['Normalize','Softmax the scores','aⱼ = e^{sⱼ} / Σₖ e^{sₖ}',['Weights are positive.','They sum to one.']],
      ['Mix','Average the values','y = Σⱼ aⱼ vⱼ',['The output blends the patches.','Every patch can reach every other.']]]},
    {id:'corners',title:'A corner cannot slide',tag:'15 / FEATURES',module:15,noVideo:true,steps:[
      ['Gradients','Measure how brightness changes','∇I = (Iₓ, I_y)',['Arrows point towards brighter pixels.','A flat patch has none.']],
      ['Collect','Sum gradient products over a window','M = Σ ∇I ∇Iᵀ (2 × 2)',['One small matrix per window.','It is the structure tensor.']],
      ['Eigen','Read its two eigenvalues','λ₁, λ₂ = axes of the ellipse',['Both small: flat.','One large: an edge.']],
      ['Corner','Both large means a corner','R = det M − k (tr M)²',['Here k = 0.04.','Harris keeps the peaks of R.']]]},
    {id:'epipolar',title:'One pixel, one line',tag:'16 / TWO VIEWS',module:16,noVideo:true,steps:[
      ['Pixel','A pixel in view 1 fixes a ray','X = λ K⁻¹ x₁',['Its depth λ is unknown.','Every depth gives the same x₁.']],
      ['Move','The second camera has stepped aside','X₂ = R X₁ + t',['Here R = I, t = (1, 0.5, 0).','Each depth now lands elsewhere.']],
      ['Line','The ray images as a straight line','l₂ = F x₁',['The epipolar line.','A matcher searches only along it.']],
      ['Match','The true match obeys one equation','x₂ᵀ F x₁ = 0',['One equation per match.','Eight matches estimate F.']]]},
    {id:'diffusion',title:'Noise in, image out',tag:'17 / GENERATIVE',module:17,noVideo:true,steps:[
      ['Data','Start from clean samples','x₀ ~ data',['Points on a ring.','The model must learn this shape.']],
      ['Noise','Blend in Gaussian noise','x_t = √ᾱ x₀ + √(1 − ᾱ) ε',['Here √ᾱ = 0.6, √(1 − ᾱ) = 0.8.','One formula for any step t.']],
      ['Predict','A network predicts the noise','ε̂ = ε_θ(x_t, t)',['Trained with ‖ε − ε̂‖².','Dashes lead to the predicted clean point.']],
      ['Denoise','Remove the predicted noise','x̂₀ = (x_t − 0.8 ε̂) / 0.6',['Repeat in many small steps.','Fresh noise becomes a new sample.']]]}
  ];
  function frame(id, position=0) {
    const story=stories.find(s=>s.id===id)||stories[0];
    const p=Math.max(0,Math.min(3.999,position)), stage=Math.floor(p), phase=Math.min(1,(p-stage)*2), e=1-(1-phase)**3;
    const [label,title,formula,copy]=story.steps[stage];
    let art='';
    if(id==='pixels'){
      const source=[20,60,100,140], out=source.map(v=>stage===0?v:stage===1?v*(1-.5*e):stage===2?v*.5+10*e:v*.5+10);
      art=text(78,146,'INPUT I',18,muted)+text(360,146,'OUTPUT J',18,muted)+source.map((v,i)=>rect(70+i%2*105,175+Math.floor(i/2)*105,96,96,`rgb(${v},${v},${v})`)+text(118+i%2*105,231+Math.floor(i/2)*105,v,24,ink,'middle')).join('')+arrow(294,273,340,273)+out.map((v,i)=>rect(352+i%2*105,175+Math.floor(i/2)*105,96,96,`rgb(${v},${v},${v})`)+text(400+i%2*105,231+Math.floor(i/2)*105,Math.round(v),24,ink,'middle')).join('')+text(75,430,'2 rows × 2 columns',19,muted)+text(356,430,stage===3?'mean = 50':'shape is preserved',19,green);
    }
    if(id==='projection'||id==='pca'){
      const xy=(x,y)=>[110+x*60,435-y*60];
      for(let i=0;i<=5;i++) art+=line(...xy(i,0),...xy(i,5),'#334e3e',1)+line(...xy(0,i),...xy(5,i),'#334e3e',1);
      art+=arrow(...xy(0,0),...xy(5.3,0),muted)+arrow(...xy(0,0),...xy(0,5.3),muted);
      if(id==='projection'){
        art+=arrow(...xy(0,0),...xy(3,4),blue)+text(...xy(3.1,4.1),'x = (3,4)',21,blue);
        if(stage>=1)art+=line(...xy(0,0),...xy(5,5),green,2)+text(...xy(3.6,4.9),'span(u)',18,green);
        if(stage>=2)art+=arrow(...xy(0,0),...xy(3.5*(stage===2?e:1),3.5*(stage===2?e:1)),orange)+dot(...xy(3.5,3.5),5,orange);
        if(stage===3)art+=arrow(...xy(3.5,3.5),...xy(3.5-.5*e,3.5+.5*e),orange)+line(...xy(3,4),...xy(3.5,3.5),orange,2,'5 5')+text(104,482,'x = projection + orthogonal residual',20,muted);
      }else{
        const pts=[[-1.8,-1.4],[-1.4,-1.8],[-.8,-.3],[-.3,-.8],[.3,.8],[.8,.3],[1.4,1.8],[1.8,1.4]];
        art='';for(let i=-2;i<=2;i++)art+=line(300+i*75,130,300+i*75,450,'#334e3e',1)+line(85,280+i*75,525,280+i*75,'#334e3e',1);
        const coord=(x,y)=>[300+75*x,280-75*y];
        if(stage>=1)art+=line(...coord(-2.2,-2.2),...coord(2.2,2.2),orange,3)+text(104,122,'principal direction',19,orange);
        pts.forEach(([x,y])=>{const v=(x+y)/2, k=stage>=2?(stage===2?e:1):0;art+=dot(...coord(x+(v-x)*k,y+(v-y)*k),7,blue);if(stage===3)art+=line(...coord(x,y),...coord(v,v),muted,1,'4 4');});
        art+=text(95,484,stage>=2?'Project each point onto one retained direction':'Centered two-coordinate training features',20,muted);
      }
    }
    if(id==='fitting'||id==='descent'){
      const xy=id==='fitting'?(x,y)=>[95+x*175,432-y*100]:(x,y)=>[95+(x+1)*73,432-y*19];
      for(let i=0;i<5;i++)art+=line(95,432-i*70,535,432-i*70,'#334e3e',1);
      art+=arrow(95,432,545,432,muted)+arrow(95,432,95,120,muted);
      if(id==='fitting'){
        const a=stage>=1?.5*(stage===1?e:1):0,c=stage>=1?1+(1/6)*(stage===1?e:1):1;
        art+=line(...xy(0,c),...xy(2,c+2*a),orange,3);
        [1,2,2].forEach((y,i)=>{art+=dot(...xy(i,y),7,blue);if(stage>=1)art+=line(...xy(i,y),...xy(i,a*i+c),green,3,'5 4');});
        art+=text(265,482,'input t',20,muted)+text(108,128,'output y',19,muted);
      }else{
        let d='';for(let i=0;i<=100;i++){const w=-1+6*i/100,[x,y]=xy(w,(w-3)**2);d+=`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)} `;}art+=`<path d="${d}" fill="none" stroke="${green}" stroke-width="3"/>`;
        let w=stage<2?0:stage===2?1.2*e:1.2+1.152*e;
        art+=dot(...xy(w,(w-3)**2),9,orange)+text(115,137,`w=${w.toFixed(3)} · loss=${((w-3)**2).toFixed(3)}`,22,orange)+text(275,483,'weight w',20,muted)+text(...xy(3,0),'  optimum',18,green);
      }
    }
    if(id==='chain'||id==='backprop'){
      const vals=id==='chain'?['x = 2','a = 4','y = 13']:stage===3?['x = 2','h = 2','ŷ = 2.4']:['x = 2','h = 1','ŷ = 1'];
      vals.forEach((v,i)=>{art+=rect(75+i*160,235,130,85,'#304a3b',stage===i?orange:'#577563')+text(140+i*160,285,v,25,ink,'middle');if(i<2)art+=arrow(207+i*160,277,231+i*160,277,green);});
      art+=text(288,191,id==='chain'?'square                  ×3 + 1':'affine + ReLU            ×w₂',18,muted,'middle');
      if(stage>=1){art+=arrow(451,353,358,353,orange)+arrow(291,353,197,353,orange)+text(142,398,id==='chain'?'×4':'×x=2',23,orange,'middle')+text(319,398,id==='chain'?'×3':'×w₂=1',23,orange,'middle');}
      art+=rows(80,452,id==='chain'?[stage>=2?'Combined sensitivity: 12':'Forward values; backward sensitivities']:[stage===3?'Update all parameters together':'Active ReLU: derivative = 1'],muted,21);
    }
    if(id==='bayes'){
      for(let i=0;i<100;i++){let color=i<20?green:'#415448';if(stage>=1&&i<16)color=blue;if(stage>=2&&i>=20&&i<28)color=orange;if(stage===3&&!(i<16||(i>=20&&i<28)))color='#2d4035';art+=dot(91+i%10*42,146+Math.floor(i/10)*29,10,color);}
      art+=dot(93,463,6,blue)+text(108,470,'true alert',17,blue)+dot(250,463,6,orange)+text(265,470,'false alert',17,orange)+text(78,115,'100 dots × 10 observations',20,muted);
    }
    if(id==='softmax'){
      const values=stage===0?[Math.log(3),0,0]:[.6,.2,.2];
      values.forEach((v,i)=>{const h=(stage===0?v/1.2:v)*245;art+=rect(102+i*143,423-h,88,Math.max(2,h),i===2?orange:blue)+text(146+i*143,stage===0?180:413-h,stage===0?(i===0?'ln(3)':'0'):v.toFixed(1),25,i===2?orange:blue,'middle')+text(146+i*143,460,'class '+i,20,muted,'middle');});
      art+=line(85,426,530,426,muted,2)+text(94,122,stage===0?'raw class scores':'probability distribution',22,muted);
    }
    if(id==='filter'){
      const data=Array.from({length:25},(_,i)=>i%5>=2?1:0),col=stage===3?Math.min(2,Math.floor(e*2.99)):0, indices=[];
      for(let r=1;r<4;r++)for(let c=col;c<col+3;c++)indices.push(r*5+c);
      art+=text(74,132,'INPUT',19,muted)+matrix(data,5,72,157,53,indices)+text(391,132,'OUTPUT',19,muted);
      const responses=[1/3,2/3,1,1/3,2/3,1,1/3,2/3,1];
      art+=matrix(stage>=2?responses:Array(9).fill('·'),3,381,186,52,stage>=2?[3+col]:[])+arrow(341,270,372,270,orange);
      if(stage===1)art+=text(86,465,'Kernel: every one of its nine weights is 1/9',19,orange);
      else art+=text(82,465,'Orange border = selected 3 × 3 neighbourhood',19,orange);
    }
    if(id==='overlap'){
      const unit=62,ox=86,oy=117;
      for(let i=0;i<=6;i++)art+=line(ox+i*unit,oy,ox+i*unit,oy+5*unit,'#334e3e',1)+line(ox,oy+i*unit,ox+6*unit,oy+i*unit,'#334e3e',1);
      art+=rect(ox+2*unit,oy+2*unit,2*unit,2*unit,'#f6a57522',orange,0);
      if(stage>=1)art+=rect(ox+3*unit,oy+3*unit,2*unit,2*unit,'#7fb8df22',blue,0);
      if(stage>=2)art+=rect(ox+3*unit,oy+3*unit,unit,unit,'#97d7b088',green,0);
      art+=text(87,483,'orange: target · blue: prediction · green: shared',18,muted);
    }
    if(id==='evaluation'){
      const target=Array.from({length:25},(_,i)=>Math.floor(i/5)>=1&&Math.floor(i/5)<=3&&i%5>=1&&i%5<=3?1:0);
      art+=text(76,139,'TARGET',18,muted)+text(336,139,'PREDICTION',18,muted)+matrix(target,5,74,169,43,target.flatMap((v,i)=>v?[i]:[]))+matrix(stage>=2?target:Array(25).fill(0),5,332,169,43,stage>=2?target.flatMap((v,i)=>v?[i]:[]):[])+text(79,449,stage<2?'16 correct backgrounds; 9 missed foregrounds':'Toy exact recovery; now test on held-out cases',19,muted);
    }
    if(id==='homography'){
      const H=[[1,.25,0],[.08,1.05,0],[.45,.3,1]], k=stage<2?0:stage===2?e:1;
      const warp=(x,y)=>{const u=H[0][0]*x+H[0][1]*y+H[0][2],v=H[1][0]*x+H[1][1]*y+H[1][2],w=H[2][0]*x+H[2][1]*y+H[2][2];return [x+(u/w-x)*k,y+(v/w-y)*k];};
      const P=(x,y)=>{const [a,b]=warp(x,y);return [120+a*300,440-b*300];};
      for(let i=0;i<=4;i++){const g=i/4;art+=line(...P(g,0),...P(g,1),i%4?'#4f6b5a':green,i%4?1.5:3)+line(...P(0,g),...P(1,g),i%4?'#4f6b5a':green,i%4?1.5:3);}
      [[0,0],[1,0],[1,1],[0,1]].forEach(([x,y])=>{art+=dot(...P(x,y),7,orange);});
      if(stage>=1)art+=text(112,474,stage===1?'(x, y) → (x, y, 1)':stage===2?'H moves all points at once':'divide by w: perspective',19,orange);
      art+=text(112,122,stage===3?'top and bottom edges now converge':'a square in the plane',19,muted);
    }
    if(id==='attention'){
      const scores=[2.2,.4,1.6,-.6,.9,0], ex=scores.map(Math.exp), z=ex.reduce((a,b)=>a+b,0), wts=ex.map(v=>v/z), q=2;
      const shades=['#7c8f80','#4f6457','#a3b7a7','#3c5045','#8fa393','#5f7466'];
      shades.forEach((c,i)=>{const x=82+i*78;art+=rect(x,150,62,62,c,i===q?orange:'none',6)+text(x+31,238,'x'+(i+1),17,i===q?orange:muted,'middle');});
      if(stage>=1)scores.forEach((s,i)=>{const x=113+i*78;art+=line(113+q*78,214,x,300,stage>=2?orange:muted,stage>=2?1+wts[i]*14*(stage===2?e:1):1.5);art+=text(x,326,stage>=2?wts[i].toFixed(2):s.toFixed(1),17,stage>=2?orange:ink,'middle');});
      if(stage===3){const h=Math.round(wts.reduce((t,w,i)=>t+w*[124,79,163,60,143,95][i],0));art+=rect(270,370,62,62,`rgb(${h},${h+12},${h})`,orange,6)+text(301,458,'y = Σ aⱼ vⱼ',19,orange,'middle');}
      art+=text(82,122,stage<1?'six patch tokens':stage<2?'scores for query x3':'attention weights (line width)',19,muted);
    }
    if(id==='corners'){
      // Three 120-px windows (flat, a vertical edge, a corner), each with its structure-tensor ellipse.
      const kinds=[['flat',[0,0],0],['edge',[4,0],-0.64],['corner',[2,2],3.36]];
      kinds.forEach(([name,[l1,l2],R],i)=>{
        const x=82+i*162,y=140,lit='#c9d6cc',dk='#3f5648';
        art+=rect(x,y,120,120,name==='flat'?'#6f8676':dk,'#577563',4);
        if(name==='edge')art+=rect(x+60,y,60,120,lit,'none',0);
        if(name==='corner')art+=rect(x+60,y+60,60,60,lit,'none',0);
        if(name==='edge')art+=[25,60,95].map(b=>arrow(x+46,y+b,x+74,y+b,orange)).join('');
        if(name==='corner')art+=arrow(x+46,y+90,x+74,y+90,orange)+arrow(x+90,y+46,x+90,y+74,orange);
        if(stage>=1){const k=stage===1?e:1,cx=x+60,cy=345,ax=Math.max(3,l1*14*k),ay=Math.max(3,l2*14*k);art+=`<ellipse cx="${cx}" cy="${cy}" rx="${ax}" ry="${ay}" fill="#97d7b033" stroke="${green}" stroke-width="2.5"/>`+dot(cx,cy,3,green);}
        if(stage>=2)art+=text(x+60,422,`λ = ${l1}, ${l2}`,18,ink,'middle');
        if(stage===3)art+=text(x+60,452,`R = ${R}`,18,name==='corner'?orange:muted,'middle')+text(x+60,480,name,19,name==='corner'?orange:muted,'middle');
        else art+=text(x+60,290,name,17,muted,'middle');
      });
      art+=text(82,122,stage===0?'gradients inside three windows':'structure tensor of each window',19,muted);
    }
    if(id==='epipolar'){
      // Camera 1 at the origin, camera 2 at t = (1, 0.5, 0) with R = I; one ray x̂₁ = (0.15, 0.1, 1) sampled at four depths.
      const depths=[1.5,2.5,5,20],L=[180,280],Rc=[440,280],sc=180,proj=d=>[(d*.15-1)/d,(d*.1-.5)/d];
      const P2=([u,v])=>[Rc[0]+u*sc,Rc[1]-v*sc];
      art+=rect(84,190,192,180,'#243f31','#577563',4)+rect(344,190,192,180,'#243f31','#577563',4)+text(180,180,'view 1',17,muted,'middle')+text(440,180,'view 2',17,muted,'middle');
      const x1=[L[0]+.15*sc,L[1]-.1*sc];
      art+=dot(...x1,7,blue)+text(x1[0]+10,x1[1]-10,'x₁',18,blue);
      if(stage===0)art+=text(84,410,'depths 1.5, 2.5, 5 and 20 all land on x₁',18,muted);
      if(stage>=2){const k=stage===2?e:1,a=[-.53,-.24],b=[.26,.155],end=[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];art+=line(...P2(a),...P2(end),orange,3)+text(84,410,'all four depths lie on one line: l₂ = F x₁',18,orange);}
      if(stage>=1){const shown=stage===1?Math.max(1,Math.ceil(e*4)):4;depths.slice(0,shown).forEach((d,i)=>{const Q=P2(proj(d)),hit=stage===3&&d===2.5;art+=dot(...Q,hit?8:6,hit?green:ink)+text(Q[0],Q[1]+(i%2?-13:25),'λ='+d,14,muted,'middle');});}
      if(stage===3)art+=text(84,450,'the true match (depth 2.5) satisfies x₂ᵀ F x₁ = 0',18,green);
    }
    if(id==='diffusion'){
      // 24 points on a ring with fixed pseudo-random noise; √ᾱ = 0.6 and √(1 − ᾱ) = 0.8.
      let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
      const gauss=()=>{const u=Math.max(1e-9,rnd()),v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
      const S=100,C=[300,300],P=([a,b])=>[C[0]+a*S,C[1]-b*S];
      const pts=Array.from({length:24},(_,i)=>{const a=i/24*2*Math.PI;return {x:[Math.cos(a),Math.sin(a)],n:[Math.max(-1.6,Math.min(1.6,gauss()))*.8,Math.max(-1.6,Math.min(1.6,gauss()))*.8]};});
      const noisy=({x,n},k)=>[x[0]*(1-.4*k)+.8*n[0]*k,x[1]*(1-.4*k)+.8*n[1]*k];
      const toward=(q,x,k)=>[q[0]+(x[0]-q[0])*k,q[1]+(x[1]-q[1])*k];
      art+=rect(90,110,420,380,'#20382c','#3c5646',6);
      pts.forEach(pt=>{
        const q=noisy(pt,1);
        if(stage===0)art+=dot(...P(pt.x),6,blue);
        else if(stage===1)art+=dot(...P(noisy(pt,e)),6,blue);
        else if(stage===2)art+=line(...P(q),...P(toward(q,pt.x,e)),orange,1.5,'4 3')+dot(...P(q),6,blue);
        else art+=dot(...P(toward(q,pt.x,e)),6,e>.98?green:blue);
      });
      art+=text(104,140,stage===0?'clean data x₀':stage===1?'noised x_t':stage===2?'predicted clean points':'denoised samples',18,muted);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${esc(story.title+': '+title+'. '+formula)}"><title>${esc(title)}</title><rect width="960" height="540" fill="#193428"/><g font-family="Segoe UI, Arial, sans-serif">${text(36,44,story.tag,15,orange)}${text(36,85,story.title,31)}${art}${rect(584,125,342,365,'#243f31')}${text(611,165,'0'+(stage+1)+' / '+label.toUpperCase(),16,orange)}${rows(611,206,title.length>28?[title.slice(0,title.lastIndexOf(' ',28)),title.slice(title.lastIndexOf(' ',28)+1)]:[title],ink,22)}${rows(611,300,formula.length>35?[formula.slice(0,formula.lastIndexOf(' ',35)),formula.slice(formula.lastIndexOf(' ',35)+1)]:[formula],green,20)}${rows(611,396,copy,muted,17)}${[0,1,2,3].map(i=>rect(611+i*70,457,58,4,i<=stage?orange:'#506354', 'none',2)).join('')}</g></svg>`;
  }
  let dispose=()=>{};
  function stop(){dispose();dispose=()=>{};}
  function mount(target,id,opts={}){
    stop();const story=stories.find(s=>s.id===id)||stories[0];let position=0,playing=false,last=0,raf=0;
    target.innerHTML=`<section class="visual-player" aria-label="Animated explanation: ${esc(story.title)}"><div class="visual-player-head"><div><div class="eyebrow">SEE THE IDEA · 24 SECONDS</div><h2>${esc(story.title)}</h2></div><span class="pill">SVG walkthrough</span></div><div class="story-canvas"></div><div class="story-controls"><button type="button" class="btn btn-primary story-play" aria-label="Play animation">▶ Play</button><button type="button" class="btn story-reset" aria-label="Restart animation">↺</button><label class="story-scrubber">Timeline<input type="range" class="story-timeline" min="0" max="24" step="0.05" value="0" aria-label="Animation time in seconds"></label><output class="story-time">0 / 24 s</output></div><div class="story-stages" aria-label="Explanation steps">${story.steps.map((s,i)=>`<button type="button" data-stage="${i}" aria-pressed="${i===0}"><span>0${i+1}</span>${esc(s[0])}</button>`).join('')}</div><p class="story-caption" aria-live="polite"></p>${opts.video&&!story.noVideo?`<details class="story-video"><summary>Watch or download the MP4 version</summary><video controls playsinline preload="none" poster="media/${story.id}.png" aria-label="${esc(story.title)} video"><source src="media/${story.id}.mp4" type="video/mp4"><track kind="captions" src="media/${story.id}.vtt" srclang="en" label="English" default></video><p class="small muted">Silent clip with on-screen explanations. The four steps above provide the transcript.</p><a class="text-link" href="media/${story.id}.mp4" download>Download 24-second MP4 ↓</a></details>`:''}</section>`;
    const canvas=target.querySelector('.story-canvas'),play=target.querySelector('.story-play'),slider=target.querySelector('.story-timeline'),caption=target.querySelector('.story-caption');let previousStage=-1;
    const render=()=>{canvas.innerHTML=frame(story.id,position);slider.value=String(Math.min(24,position*6));target.querySelector('.story-time').textContent=`${Math.round(position*6)} / 24 s`;const st=Math.min(3,Math.floor(position));target.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===st)));if(st!==previousStage){caption.textContent=`${story.steps[st][1]}. ${story.steps[st][2]}. ${story.steps[st][3].join(' ')}`;previousStage=st;}};
    const pause=()=>{playing=false;cancelAnimationFrame(raf);play.textContent='▶ Play';play.setAttribute('aria-label','Play animation');};
    const tick=time=>{if(!playing)return;if(last)position+=(time-last)/6000;last=time;if(position>=3.999){position=3.999;pause();}render();if(playing)raf=requestAnimationFrame(tick);};
    play.addEventListener('click',()=>{if(playing)pause();else{if(position>=3.999)position=0;playing=true;last=0;play.textContent='Ⅱ Pause';play.setAttribute('aria-label','Pause animation');raf=requestAnimationFrame(tick);}});
    slider.addEventListener('input',()=>{pause();position=Math.min(3.999,Number(slider.value)/6);render();});
    target.querySelector('.story-reset').addEventListener('click',()=>{pause();position=0;render();});
    target.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{pause();position=Number(b.dataset.stage)+.8;render();}));
    const onHide=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',onHide);
    dispose=()=>{pause();document.removeEventListener('visibilitychange',onHide);target.querySelectorAll('video').forEach(v=>v.pause());};render();
  }
  window.CV_STORIES={stories,frame,mount,stop,forModule:n=>stories.find(s=>s.module===n)||stories[(n-1)%stories.length]};
})();
