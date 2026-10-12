/* Run with node course/validate_lessons.cjs. No packages or server required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const katex = require('./vendor/katex/katex.min.js');
const window = {};
const context = vm.createContext({window, Math, Number, String});
const extensionFiles=fs.existsSync(path.join(__dirname,'extensions'))?fs.readdirSync(path.join(__dirname,'extensions')).filter(f=>/^lesson-\d+\.js$/.test(f)).sort().map(f=>'extensions/'+f):[];
for (const file of ['course-data.js','teaching-data.js','lesson-guides.js','lesson-notation.js','lesson-tutor.js','extensions.js',...extensionFiles]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
}
const {CV_COURSE:course,CV_GUIDES:guides,CV_TEACHING:teaching,CV_NOTATION:notation,CV_TUTOR:tutor}=window;
const report={lessons:0,parameterCases:0,workedEquations:0,readingEquations:0,notationTerms:0,numericalChecks:0,issues:[]};
function check(name, fn) {
  try { fn(); } catch(error) {report.issues.push({name,error:error.message});}
}
function equation(name,tex) {
  check(name,()=>katex.renderToString(tex,{throwOnError:true,strict:'error'}));
}
function close(actual,expected,tolerance=1e-9) {
  assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
}
function value(id,params,label) {
  const pair=tutor.calculate(id,params).values.find(v=>v[0]===label);
  assert.ok(pair,`Missing value ${label}`);
  return pair[1];
}
function numerical(name,fn) {report.numericalChecks++;check(name,fn);}
check('Every lesson listed in the course map exists',()=>assert.deepEqual(course.lessons.map(l=>l.id),course.modules.flatMap(m=>m.lessons.map(x=>parseInt(x,10)))));
for(const lesson of course.lessons) {
  const id=lesson.id,g=guides[id],t=teaching[id];
  report.lessons++;
  check(`Lesson ${id} coverage`,()=>{assert.ok(g&&t);assert.ok(g.paragraphs.length>=2);assert.ok(g.controls.length);});
  if(!g||!t)continue;
  equation(`Lesson ${id} concept`,t.equation);
  for(const [symbol] of t.symbols) {
    report.notationTerms++;
    const note=window.CV_NOTATION_LESSON?.[id]?.[symbol]??notation[symbol];
    check(`Lesson ${id} term ${symbol}`,()=>{assert.ok(note?.detail);});
    if(note)equation(`Lesson ${id} term ${symbol}`,note.tex);
  }
  const configs=g.controls.reduce((rows,c)=>{
    const middle=c.min+Math.round((c.max-c.min)/(2*c.step))*c.step;
    const values=[...new Set([c.min,c.value,middle,c.max])];
    return rows.flatMap(p=>values.map(v=>[...p,v]));
  },[[]]);
  for(const params of configs) {
    report.parameterCases++;
    const model=tutor.calculate(id,params);
    check(`Lesson ${id} values ${params}`,()=>{
      assert.equal(model.steps.length,4);
      model.values.forEach(([name,v])=>assert.ok(v===null||Number.isFinite(v),`Nonfinite ${name}`));
    });
    for(const [i,step] of model.steps.entries()) {
      report.workedEquations++;
      equation(`Lesson ${id} step ${i+1} ${params}`,step.tex);
    }
  }
  const decode=s=>s.replace(/&quot;/g,'"').replace(/&#(?:39|x27);/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  for(const match of lesson.html.matchAll(/data-equation="([^"]*)"/g)) {
    report.readingEquations++;
    equation(`Lesson ${id} reading`,decode(match[1]));
  }
}
numerical('Matrix rows use a TeX line break',()=>assert.ok(tutor.calculate(1,[.5]).steps[0].tex.includes('20&60\\\\100&140')));
numerical('Projection residual is orthogonal',()=>{
  for(const x of [0,3,6]) {const p=(x+4)/2;close((x-p)+(4-p),0);close(value(6,[x],'Residual length'),Math.hypot(x-p,4-p));}
});
numerical('Binary score, probability and loss',()=>{
  for(const z of [-6,0,Math.log(3),6])for(const y of [0,1]) {
    const p=1/(1+Math.exp(-z));
    close(value(4,[z,y],'Class 1 probability'),p);
    close(value(4,[z,y],'True-class probability'),y?p:1-p);
    close(value(4,[z,y],'Negative log loss'),-Math.log(y?p:1-p));
    const h=1e-5,grad=(value(4,[z+h,y],'Negative log loss')-value(4,[z-h,y],'Negative log loss'))/(2*h);
    close(grad,p-y,1e-7);
  }
  close(value(4,[1000,0],'Negative log loss'),1000);
  close(value(4,[-1000,1],'Negative log loss'),1000);
});
numerical('Scalar ridge and MAP stationarity',()=>{
  for(const id of [12,26])for(const lambda of [.25,1,4]) {
    const w=value(id,[lambda],'Regularized fit');
    close(2*(w-2)+2*lambda*w,0);
    assert.ok(tutor.calculate(id,[lambda]).steps[1].tex.includes('2\\cdot'));
  }
});
numerical('PCA covariance eigenvector',()=>{
  for(const a of [0,2,3]) {const lambda=a*a+1,u=[a/Math.sqrt(lambda),1/Math.sqrt(lambda)];close(a*a*u[0]+a*u[1],lambda*u[0]);close(a*u[0]+u[1],lambda*u[1]);close(value(15,[a],'Leading variance'),lambda);}
});
numerical('Shared graph and ReLU gradients',()=>{
  for(const id of [19,38])for(const w of [-1,.4,1,2]) {
    const h=1e-5,grad=(value(id,[w+h],'Loss')-value(id,[w-h],'Loss'))/(2*h);
    close(value(id,[w],'Weight gradient'),grad,1e-7);
  }
});
numerical('Softmax probabilities and loss gradient',()=>{
  for(const z of [-3,0,3]) {
    const model=tutor.calculate(27,[z]);close(model.values.reduce((sum,v)=>sum+v[1],0),1);
    const h=1e-5,loss=x=>-Math.log(value(27,[x],'Cat'));
    close((loss(z+h)-loss(z-h))/(2*h),value(27,[z],'Cat')-1,1e-7);
  }
});
numerical('Covariance sum formula',()=>{
  for(const rho of [-.9,0,.9])close(value(23,[rho],'Variance of sum'),2+2*rho);
  assert.ok(tutor.calculate(23,[.5]).steps[2].tex.includes('2\\cdot(0.5)'));
});
numerical('Quadratic descent checks the new objective',()=>{
  for(const rate of [0,.5,1,1.2])close(value(29,[rate],'After loss'),(6*rate-3)**2);
});
numerical('Stride counts actual legal starts',()=>{
  for(const stride of [1,2,3]) {const starts=[];for(let p=0;p+3<=9;p+=stride)starts.push(p);close(value(35,[stride],'Output length'),starts.length);}
});
numerical('Box geometry and mask identities',()=>{
  for(const displacement of [0,1,2,3]) {const intersection=2*Math.max(0,2-displacement);close(value(42,[displacement],'IoU'),intersection/(8-intersection));}
  for(const tp of [0,6,10])for(const fp of [0,2,20]) {const iou=value(43,[tp,fp],'Foreground IoU');close(value(43,[tp,fp],'Dice'),2*iou/(1+iou));close(value(43,[tp,fp],'Pixel accuracy'),(tp+90-fp)/100);}
});
numerical('Empty positive predictions have undefined precision',()=>{
  assert.equal(value(44,[1],'Precision'),null);close(value(44,[1],'Recall'),0);
});
numerical('Finite-difference step is visible at the smallest control value',()=>{
  close(value(40,[-8],'Step size h'),1e-8,1e-12);
  const number=tutor.calculate(40,[-8]).values[0][1];assert.ok(number>0);
});
numerical('Two-layer row-vector example',()=>{
  const x=[1,2],W1=[[1,-1],[1,1]],W2=[[1,-1],[2,1]];
  const multiply=(v,W)=>W[0].map((_,j)=>v.reduce((sum,z,i)=>sum+z*W[i][j],0));
  assert.deepEqual(multiply(x,W1),[3,1]);assert.deepEqual(multiply([3,1],W2),[5,-2]);
});
fs.writeFileSync(path.join(__dirname,'lesson-math-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.issues.length)process.exitCode=1;
