/* Export the actual SVG teaching scenes, not separate placeholder footage. */
// Playwright from the project or global modules, else from the local Codex runtime used to build the original videos.
const { chromium } = (() => { try { return require('playwright'); } catch { return require(require('path').join(require('os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); } })();
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const base=__dirname, fps=24, seconds=24;
async function main(){
  const dir=path.join(base,'media');await fs.mkdir(dir,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const page=await browser.newPage();await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({path:path.join(base,'visual-stories.js')});
    const stories=await page.evaluate(()=>CV_STORIES.stories);
    let manifests=[];try{manifests=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));}catch{}
    const chosen=process.argv.slice(2);
    for(const story of stories.filter(s=>!chosen.length||chosen.includes(s.id))){
      const out=path.join(dir,story.id+'.mp4');
      const encoder=spawn('C:/ProgramData/chocolatey/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',out],{windowsHide:true});
      let error='';encoder.stderr.on('data',b=>error+=b.toString());encoder.stdin.on('error',()=>{});
      const done=new Promise((resolve,reject)=>encoder.on('close',code=>code===0?resolve():reject(Error(error||'Encoder exit '+code))));
      // Handle failure immediately while rendering, then await completion below.
      done.catch(()=>{});
      for(let i=0;i<fps*seconds;i++){
        const b64=await page.evaluate(async({id,position})=>{
          const svg=CV_STORIES.frame(id,position),image=new Image();
          image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await image.decode();
          const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;canvas.getContext('2d').drawImage(image,0,0);
          return canvas.toDataURL('image/png').split(',')[1];
        },{id:story.id,position:Math.min(3.999,i/(fps*6))});
        const buffer=Buffer.from(b64,'base64');
        if(i===Math.floor(.8*6*fps))await fs.writeFile(path.join(dir,story.id+'.png'),buffer);
        if(!encoder.stdin.write(buffer))await once(encoder.stdin,'drain');
      }
      encoder.stdin.end();await done;
      const vtt='WEBVTT\n\n'+story.steps.map((s,i)=>`${i+1}\n00:${String(i*6).padStart(2,'0')}.000 --> 00:${String((i+1)*6).padStart(2,'0')}.000\n${s[1]}. ${s[2]}.\n${s[3].join(' ')}\n`).join('\n');
      await fs.writeFile(path.join(dir,story.id+'.vtt'),vtt);
      manifests=manifests.filter(m=>m.id!==story.id);
      manifests.push({id:story.id,title:story.title,duration:seconds,width:960,height:540,fps,frames:fps*seconds,bytes:(await fs.stat(out)).size,renderer:'SVG → browser canvas → FFmpeg libx264'});
      console.log('Rendered',story.id,seconds+'s',Math.round(manifests.at(-1).bytes/1024)+' KiB');
    }
    await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifests,null,2));
    for(let half=0;half<2;half++){
    const sheet=await page.evaluate(async half=>{
      const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1620;const c=canvas.getContext('2d');
      for(let j=0;j<6;j++)for(let i=0;i<4;i++){
        const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(CV_STORIES.frame(CV_STORIES.stories[j+half*6].id,i+.8))));await image.decode();
        c.drawImage(image,i*480,j*270,480,270);
      }
      return canvas.toDataURL('image/png').split(',')[1];
    },half);
    await fs.writeFile(path.join(base,'..','tmp','story-contact-sheet-'+(half+1)+'.png'),Buffer.from(sheet,'base64'));
    }
    console.log('Complete:',manifests.length,'videos;',(manifests.reduce((s,m)=>s+m.bytes,0)/1024/1024).toFixed(2),'MiB total.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
