"""Apply the teaching-studio interface without changing saved student progress."""
from pathlib import Path
base=Path(__file__).resolve().parent
p=base/'app.js'
s=p.read_text(encoding='utf-8')
if 'function mathFocus(' in s:
    raise SystemExit('The redesign is already applied. Edit the app files directly; this is a one-time migration.')
start=s.index('  function heroDiagram()')
end=s.index('  function lessonRows(',start)
s=s[:start]+'''  function heroDiagram() {
    return window.CV_STORIES.frame('filter', 3.8);
  }
  function storyTiles() {
    return `<div class="story-gallery">${window.CV_STORIES.stories.map(story => `<a class="story-card" href="#cinema/${story.id}"><div class="story-thumbnail">${window.CV_STORIES.frame(story.id,3.8)}</div><div class="story-card-copy"><span class="eyebrow">MODULE ${String(story.module).padStart(2,'0')} · 24 SEC</span><h3>${escape(story.title)}</h3><span class="text-link">Play the explanation ↗</span></div></a>`).join('')}</div>`;
  }
  function cinema(id) {
    const story=window.CV_STORIES.stories.find(s=>s.id===id);
    main.innerHTML=header('THE VISUAL CLASSROOM', story ? story.title : 'Watch the maths take shape.', 'Twelve short explanations. Play the motion, scrub the timeline, or take one step at a time. Each has a local MP4 and a written transcript.') + (story ? `<div id="cinema-player"></div><div class="button-row">${button('Study this module','#module/'+story.module,true)}${button('Try its experiment','#explore/'+({projection:'vectors',pca:'spectrum',chain:'derivatives',bayes:'bayes',softmax:'softmax',descent:'optimization',filter:'convolution',backprop:'network',overlap:'iou',evaluation:'masks',fitting:'fitting',pixels:'pixels'}[story.id]))}${button('All visual stories','#cinema')}</div><div class="library-extras"><h2>Keep exploring</h2>${storyTiles()}</div>` : storyTiles());
    if(story)window.CV_STORIES.mount(document.getElementById('cinema-player'),story.id,{video:true});
  }
''' + s[end:]
s=s.replace("lessonRows()}</div><div class=\"today-block\"", "lessonRows(next.module)}</div><div class=\"today-block\"")
s=s.replace('<h2>Your first chapter</h2>', '<h2>Your next chapter</h2>')
s=s.replace("${state.completed.filter(n => n <= 4).length} / 4 FOUNDATION LESSONS COMPLETE", "${state.completed.filter(n => course.lessons.find(l=>l.id===n)?.module===next.module).length} / 4 CHAPTER LESSONS COMPLETE")
s=s.replace("<div class=\"lower-grid\"><a", "<section class=\"visual-home-section\"><div class=\"section-heading\"><div><div class=\"eyebrow\">A VISUAL PATH THROUGH THE COURSE</div><h2>See what each chapter unlocks.</h2></div><a class=\"text-link\" href=\"#cinema\">12 animated explanations ↗</a></div>${storyTiles()}</section><div class=\"lower-grid\"><a",1)
s=s.replace('<div class="eyebrow">MODULE ${String(m.n)', '<div class="module-art">${window.CV_STORIES.frame(window.CV_STORIES.forModule(m.n).id,3.8)}</div><div class="eyebrow">MODULE ${String(m.n)',1)
start=s.index('  function lessonPage(')
end=s.index('  function rangeControl(',start)
s=s[:start]+'''  function mathFocus(id) {
    const t=window.CV_TEACHING[id];
    return `<section class="concept-focus"><div><div class="eyebrow">THE IDEA TO KEEP</div><div class="focus-equation" data-equation="${escape(t.equation)}"></div><div class="symbol-key">${t.symbols.map(([symbol,meaning])=>`<div><b>${escape(symbol)}</b><span>${escape(meaning)}</span></div>`).join('')}</div></div><div class="focus-connection"><div class="eyebrow">WHY THIS MATTERS IN CV</div><p>${escape(t.connection)}</p><div class="common-trap"><strong>Watch this detail</strong><p>${escape(t.trap)}</p></div></div></section>`;
  }
  function quickCheck(id) {
    const t=window.CV_TEACHING[id], old=state.quiz['concept-'+id];
    return `<section class="panel concept-check"><div class="eyebrow">PAUSE & PREDICT</div><h3>${escape(t.question)}</h3><div class="check-choices">${t.choices.map((c,i)=>`<button type="button" class="check-choice" data-choice="${i}" aria-pressed="${String(old)===String(i)}">${escape(c)}</button>`).join('')}</div><div id="concept-feedback" class="concept-feedback" role="status">${old!==undefined?`${Number(old)===t.correct?'✓ Correct.':'Revisit this. Pick another answer when you are ready.'} ${escape(t.explanation)}`:'Choose an answer to test this idea.'}</div></section>`;
  }
  function lessonPage(id, tab = 'read') {
    const lesson=course.lessons.find(l=>l.id===id);
    if(!lesson)return overview();
    if(!['read','explore','practice'].includes(tab))tab='read';
    const t=window.CV_TEACHING[id],story=window.CV_STORIES.forModule(lesson.module);
    main.innerHTML=header(`LESSON ${String(id).padStart(2,'0')} · MODULE ${String(lesson.module).padStart(2,'0')} · 90 MIN`,escape(lesson.title),escape(lesson.goal||'Connect mathematical notation to images, calculate a worked example and explain what the numbers mean.'))+
      `<nav class="lesson-tabs" aria-label="Lesson activities">${['read','explore','practice'].map((v,i)=>`<a class="tab${v===tab?' active':''}" href="#lesson/${id}/${v}"${v===tab?' aria-current="page"':''}><span class="activity-num">0${i+1}</span>${{read:'Learn & visualize',explore:'Experiment',practice:'Practice'}[v]}</a>`).join('')}</nav><div id="lesson-content"></div><div class="lesson-footer"><button class="btn complete-btn${state.completed.includes(id)?' selected':''}" id="complete-lesson" type="button" aria-pressed="${state.completed.includes(id)}">${state.completed.includes(id)?'✓ Lesson complete':'Mark lesson complete'}</button>${id>1?button('Previous lesson','#lesson/'+(id-1)):''}${id<course.lessons.length?button('Next lesson','#lesson/'+(id+1)):button('Your capstone module','#module/12')}</div>`;
    const content=document.getElementById('lesson-content');
    if(tab==='read'){
      content.innerHTML=mathFocus(id)+`<div class="lesson-visual-label"><span>Module ${String(lesson.module).padStart(2,'0')} worked illustration</span><a class="text-link" href="#lesson/${id}/explore">Change the numbers in the experiment ↗</a></div><div id="lesson-story"></div><div class="reading-grid"><article class="panel prose" id="lesson-article">${lesson.html}</article><aside class="reader-aside"><section class="panel reader-outline"><div class="eyebrow">IN THIS LESSON</div><div id="reading-outline"></div></section>${quickCheck(id)}${notes('lesson-'+id)}<section class="panel lesson-reading"><div class="eyebrow">READ WITH A PURPOSE</div><p>${escape(lesson.reading)}</p>${bookLinks(lesson.reading)}${(course.companions[id]||[]).map(item=>`<a class="book-chip" href="${item.url}" target="_blank" rel="noopener">${escape(item.title)} ↗</a>`).join('')}<div class="resource-downloads">${course.notebooks.filter(nb=>nb.modules.includes(lesson.module)).map(nb=>`<a class="btn nb-link" href="${nb.href}" download>Module notebook ↓</a>`).join('')}</div></section></aside></div>`;
      window.CV_STORIES.mount(document.getElementById('lesson-story'),story.id,{video:true});
      document.querySelectorAll('[data-equation]').forEach(el=>window.katex.render(el.dataset.equation,el,{throwOnError:false,displayMode:true,trust:false}));
      const headings=[...document.querySelectorAll('#lesson-article h2')];
      document.getElementById('reading-outline').innerHTML=headings.map((h,i)=>`<button type="button" data-section="${i}"><span>${String(i+1).padStart(2,'0')}</span>${escape(h.textContent)}</button>`).join('');
      headings.forEach(h=>h.tabIndex=-1);
      document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>{const h=headings[Number(b.dataset.section)];h.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});h.focus({preventScroll:true});}));
      document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const value=Number(b.dataset.choice);state.quiz['concept-'+id]=value;save();document.querySelectorAll('[data-choice]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));const feedback=document.getElementById('concept-feedback');feedback.textContent=`${value===t.correct?'✓ Correct.':'Revisit this. Pick another answer when you are ready.'} ${t.explanation}`;feedback.classList.toggle('success',value===t.correct);}));
    }
    if(tab==='explore')content.innerHTML=`<p class="explore-note" style="margin-top:0"><strong>Predict first:</strong> ${escape(t.trap)} Change one control, describe the result, then return to the lesson’s practice.</p><div id="lesson-lab"></div>`,mountLab(lesson.lab||lessonLab[id-1],document.getElementById('lesson-lab'));
    if(tab==='practice')content.innerHTML=`<p class="muted small">Work each question before opening its answer. Your writing is saved as you type.</p>${manualQuestions('lesson-'+id,lesson.exercises,lesson.solutions||lessonSolutions[id-1])}${notes('reflection-'+id,'What changed in your understanding?')}`;
    document.getElementById('complete-lesson').addEventListener('click',()=>{
      state.completed=state.completed.includes(id)?state.completed.filter(n=>n!==id):[...state.completed,id];save();
      const b=document.getElementById('complete-lesson');b.classList.toggle('selected',state.completed.includes(id));b.setAttribute('aria-pressed',String(state.completed.includes(id)));b.textContent=state.completed.includes(id)?'✓ Lesson complete':'Mark lesson complete';
    });
  }
''' + s[end:]
# Import complements the existing JSON export, with validation before replacing anything.
s=s.replace('<button class="btn" id="export-progress"', '<label class="btn import-label">Import progress ↑<input id="import-progress" type="file" accept="application/json,.json"></label><button class="btn" id="export-progress"')
s=s.replace('Notebook: Python 3 and NumPy. Progress export', '<span id="import-status" role="status"></span>Notebook: Python 3 and NumPy. Progress export')
pos=s.index("    document.getElementById('export-progress').addEventListener")
s=s[:pos]+'''    document.getElementById('import-progress').addEventListener('change',async event=>{
      const file=event.target.files[0];if(!file)return;const status=document.getElementById('import-status');
      try{
        if(file.size>5_000_000)throw Error('This file is too large for a progress backup.');
        const data=JSON.parse(await file.text());
        if(data.course!=='Maths for Computer Vision'||data.version!==1||!Array.isArray(data.completed)||!Array.isArray(data.ready)||!Array.isArray(data.sessions))throw Error('Choose a course progress JSON exported from this course.');
        for(const key of ['notes','answers','quiz'])if(!data[key]||typeof data[key]!=='object'||Array.isArray(data[key])||Object.values(data[key]).some(v=>typeof v!=='string'&&typeof v!=='number'))throw Error('The backup has invalid '+key+'.');
        // Merge notes and checks. Existing notes absent from the backup stay in place.
        state={...state,completed:[...new Set([...state.completed,...data.completed.filter(n=>course.lessons.some(l=>l.id===n))])],ready:[...new Set([...state.ready,...data.ready.filter(n=>Number.isInteger(n)&&n>=1&&n<=12)])],sessions:[...new Set([...state.sessions,...data.sessions.filter(v=>typeof v==='string')])],notes:{...state.notes,...data.notes},answers:{...state.answers,...data.answers},quiz:{...state.quiz,...data.quiz}};
        save();status.textContent='Backup imported and merged with your current progress. ';event.target.value='';
      }catch(error){status.textContent=error.message+' ';event.target.value='';}
    });
''' + s[pos:]
s=s.replace('  function route() {','  function route() {\n    window.CV_STORIES.stop();')
s=s.replace("const names = { overview:","const names = { cinema: 'Visual classroom', overview:")
s=s.replace('({ overview, roadmap, lessons:', '({ overview, roadmap, cinema: () => cinema(arg), lessons:')
# Clarify first-time storage failures instead of claiming a saved state.
s=s.replace("  route();\n})();", "  route();\n  document.getElementById('reload-course').addEventListener('click',()=>{save();location.reload();});\n})();")
p.write_text(s,encoding='utf-8')
p=base/'index.html';s=p.read_text(encoding='utf-8')
s=s.replace('<link rel="stylesheet" href="styles.css">','<link rel="stylesheet" href="vendor/katex/katex.min.css">\n  <link rel="stylesheet" href="styles.css?v=3">\n  <link rel="stylesheet" href="teaching-studio.css?v=3">\n  <script src="vendor/katex/katex.min.js" defer></script>')
s=s.replace('<script src="advanced-labs.js" defer></script>','<script src="advanced-labs.js?v=3" defer></script>\n  <script src="teaching-data.js?v=3" defer></script>\n  <script src="visual-stories.js?v=3" defer></script>')
s=s.replace('src="app.js"','src="app.js?v=3"').replace('src="course-data.js"','src="course-data.js?v=3"')
s=s.replace('<a href="#explore/pixels"','<a href="#cinema" data-nav="cinema"><span aria-hidden="true">▷</span> Visual classroom</a>\n        <a href="#explore/pixels"')
s=s.replace('<div class="topbar-right">','<div class="topbar-right"><button id="reload-course" class="reload-course" type="button" aria-label="Reload the latest course files">↻ Refresh</button>')
s=s.replace('<main id="main-content" tabindex="-1"></main>','<main id="main-content" tabindex="-1"><p>Loading your course…</p><noscript>Enable JavaScript to use the interactive course. The Markdown lessons and PDFs are also in this folder.</noscript></main>')
p.write_text(s,encoding='utf-8')
print('Teaching studio integrated: 48 concept guides, 12 visual stories, progress import.')
