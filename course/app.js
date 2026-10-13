(() => {
  'use strict';
  const course = window.CV_COURSE;
  const main = document.getElementById('main-content');
  const storageKey = 'cv-maths-learning-studio-v1';
  const blankState = { completed: [], ready: [], answers: {}, notes: {}, sessions: [], quiz: {}, practice: {}, errors: [], checkpoints: {} };
  const validModule = n => Number.isInteger(n) && course.modules.some(m => m.n === n);
  // Practice records come from the auto-checked questions; keep only well-formed entries.
  const cleanPractice = value => Object.fromEntries(Object.entries(value && typeof value === 'object' && !Array.isArray(value) ? value : {}).filter(([id, r]) => /^\d+:[\w-]+$/.test(id) && r && typeof r === 'object' && Number.isInteger(r.box) && r.box >= 0 && r.box <= 5 && /^\d{4}-\d{2}-\d{2}$/.test(r.due || '') && Number.isFinite(r.right) && Number.isFinite(r.wrong)));
  const cleanErrors = value => (Array.isArray(value) ? value : []).filter(e => e && typeof e === 'object' && typeof e.item === 'string' && Number.isInteger(e.lesson) && ['prompt', 'expected', 'date', 'skill'].every(k => typeof e[k] === 'string')).map(e => ({...e, given: String(e.given ?? '')})).slice(0, 150);
  const cleanCheckpoints = value => Object.fromEntries(Object.entries(value && typeof value === 'object' && !Array.isArray(value) ? value : {}).filter(([n, r]) => validModule(Number(n)) && r && typeof r === 'object' && Number.isFinite(r.best) && typeof r.date === 'string'));
  let state = { ...blankState };
  let storageAvailable = true;
  let lessonActionsObserver;
  new ResizeObserver(entries=>document.documentElement.style.setProperty('--course-topbar-height',`${entries[0].target.getBoundingClientRect().height}px`)).observe(document.querySelector('.topbar'));
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (stored && typeof stored === 'object') {
      state = { ...blankState, ...stored };
      state.completed = Array.isArray(stored.completed) ? stored.completed.filter(n => Number.isInteger(n) && course.lessons.some(l => l.id === n)) : [];
      state.ready = Array.isArray(stored.ready) ? stored.ready.filter(validModule) : [];
      state.practice = cleanPractice(stored.practice);
      state.errors = cleanErrors(stored.errors);
      state.checkpoints = cleanCheckpoints(stored.checkpoints);
      state.sessions = Array.isArray(stored.sessions) ? stored.sessions.filter(n => typeof n === 'string') : [];
      ['answers', 'notes', 'quiz'].forEach(key => {
        if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
      });
    }
  } catch { storageAvailable = false; }
  const labState = { pixels: { scale: .5, offset: 10, clip: true }, functions: { slope: 2, offset: 10, input: 30 }, loss: { weight: .5 }, confidence: { score: 0, label: 1 } };
  const labDefaults = JSON.parse(JSON.stringify(labState));
  const labNames = { pixels: 'Images & pixels', functions: 'Functions & order', loss: 'Error & fitting', confidence: 'Scores & confidence', ...window.CV_LABS.names, ...window.CV_VISION_LABS.names };
  const lessonLab = ['pixels', 'functions', 'loss', 'confidence'];
  const lessonSolutions = [
    ['Shape (2,2); I[1,0]=100.', 'K=[[20,100],[180,260]]. Only 260 exceeds 255.', 'Before clipping: 140. After clipping: 138.75. One entry loses 5, so the mean loses 5/4.', '[20,60,100,140]. Preserve shape (2,2) and the row-order convention.', '[[0,63.75],[191.25,255]].', 'For example, [[0,100],[0,100]] and [[0,0],[100,100]] both have mean 50.', 'Shape (32,64,64,3); the four axes describe batch, height, width and channels.'],
    ['The outputs are 10, 20 and 60.', 'g(n(x))=x/255+10; n(g(x))=(x+10)/255. The two offsets act on different scales.', 'The y values are 4,1,0,1,4. The graph is a parabola symmetric around zero.', 'Clipping can map distinct values to the same boundary. Nonzero scaling alone is one-to-one before rounding or clipping.', 'ReLU has slope 0 for negative x and 1 for positive x, so a single straight line does not describe both regions.'],
    ['Residuals are [-1,0,1]; MSE=2/3.', 'For example, residuals [-2,2] have mean zero.', 'The sum grows with observation count for the same error pattern; the mean averages per observation.', 'Multiplying residuals by 10 multiplies MSE by 100.', 'Squaring magnifies large error magnitudes, so an unusually large residual can dominate the sum.'],
    ['ln(e^3)=3.', 'ln(1)=0.', 'The probabilities are 0.5, 0.75 and 0.25.', 'The losses are ln(2) and ln(4)=2ln(2). The second is twice as large.', 'A confident wrong prediction assigns tiny probability to the correct class. Its negative logarithm is large.']
  ];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = (n, digits = 2) => Number(n.toFixed(digits)).toString();
  const clamp = (v, low, high) => Math.min(high, Math.max(low, v));
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const button = (text, href, primary = false) => `<a class="btn${primary ? ' btn-primary' : ''}" href="${href}">${text}<span aria-hidden="true">→</span></a>`;
  const experimentHref = (name, module) => {
    const lesson = course.lessons.find(l => l.lab === name && (!module || l.module === module)) || course.lessons.find(l => l.lab === name);
    return `#lesson/${lesson?.id || 1}/explore`;
  };
  const bookLinks = reading => `<div class="reading-links">${window.CV_READING.chips(reading)}</div>`;
  window.CV_PRACTICE.init({ course, getState: () => state, save: () => save(), rerender: () => route() });
  const extensionModules = () => course.modules.filter(m => m.extension);
  const coreWeeks = () => 2 * (course.modules.length - extensionModules().length);
  // A one-line reminder of the spaced-review queue on the overview.
  function reviewStrip() {
    const due = window.CV_PRACTICE.dueCount(), tried = Object.keys(state.practice).length;
    return `<a class="review-strip${due ? ' due' : ''}" href="${due ? '#practice/review' : tried ? '#practice' : `#lesson/${(course.lessons.find(l => !state.completed.includes(l.id)) || course.lessons[0]).id}/practice`}"><span class="eyebrow">SPACED REVIEW</span><strong>${due ? `${due} question${due === 1 ? '' : 's'} due today` : tried ? 'Nothing due today' : 'Start with a lesson’s fresh practice'}</strong><span>${due ? 'New numbers, about a minute each. Start today’s review →' : tried ? 'Your next review will appear here. Practise ahead or revisit your error log →' : 'Each question you answer joins a review schedule that adapts to you →'}</span></a>`;
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    document.getElementById('save-status').textContent = storageAvailable ? 'Saved in this browser' : 'Progress could not be saved';
    updateProgress();
  }
  function updateProgress() {
    document.getElementById('sidebar-progress').max = course.lessons.length;
    document.getElementById('sidebar-progress').value = state.completed.length;
    document.getElementById('sidebar-progress-value').textContent = `${state.completed.length} / ${course.lessons.length}`;
    const practiceLink = document.querySelector('[data-nav="practice"]'), due = window.CV_PRACTICE.dueCount();
    let badge = practiceLink.querySelector('.nav-badge');
    if (!badge) { badge = document.createElement('b'); badge.className = 'nav-badge'; practiceLink.append(badge); }
    badge.textContent = due; badge.hidden = !due; badge.setAttribute('aria-label', `${due} review question${due === 1 ? '' : 's'} due`);
  }
  function header(eyebrow, title, description = '') {
    return `<div class="page-head"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>`;
  }
  function notes(key, label = 'Your notes & questions') {
    return `<div class="notes-panel"><label for="notes-${key}" class="notes-label">${label}</label><textarea id="notes-${key}" class="notes" data-note="${key}" placeholder="Explain the idea in your own words. Record a question or a mistake to revisit.">${escape(state.notes[key] || '')}</textarea><p class="small muted">Saved here as you write. Bring your questions back to our chat.</p></div>`;
  }
  function heroDiagram() {
    return window.CV_STORIES.frame('filter', 3.8);
  }
  function storyTiles() {
    return `<div class="story-gallery">${window.CV_STORIES.stories.map(story => `<a class="story-card" href="#cinema/${story.id}"><div class="story-thumbnail">${window.CV_STORIES.frame(story.id,3.8)}</div><div class="story-card-copy"><span class="eyebrow">MODULE ${String(story.module).padStart(2,'0')} · 24 SEC</span><h3>${escape(story.title)}</h3><span class="text-link">Play the explanation ↗</span></div></a>`).join('')}</div>`;
  }
  function cinema(id) {
    const narrated = window.CV_CONCEPT_VIDEOS.items.find(item => item.id === id);
    if (narrated) {
      main.innerHTML = header('THE VISUAL CLASSROOM', narrated.title, 'Follow a complete worked example, predict the next result, and replay any chapter. Narration, captions and a written transcript are included.') + `<div id="concept-video-player"></div><div class="button-row">${button('Study the lesson','#lesson/'+narrated.lesson,true)}${button('Try its experiment','#lesson/'+narrated.lesson+'/explore')}${button('All videos','#cinema')}</div>`;
      window.CV_CONCEPT_VIDEOS.mount(document.getElementById('concept-video-player'), narrated);
      return;
    }
    const story=window.CV_STORIES.stories.find(s=>s.id===id);
    main.innerHTML=header('THE VISUAL CLASSROOM', story ? story.title : 'Watch the maths take shape.', story ? 'A short preview of this module. Play, pause, scrub or jump to a step.' : `${window.CV_CONCEPT_VIDEOS.items.length + window.CV_STORIES.stories.length} videos of three kinds. Start with an animated explanation for the hardest ideas, or follow the worked walkthrough for any lesson.`) + (story ? `<div id="cinema-player"></div><div class="button-row">${button('Study this module','#module/'+story.module,true)}${button('Try its experiment',experimentHref({projection:'vectors',pca:'patches',chain:'derivatives',bayes:'bayes',softmax:'softmax',descent:'optimization',filter:'imagefilter',backprop:'network',overlap:'iou',evaluation:'masks',fitting:'fitting',pixels:'pixels',homography:'homography',attention:'attention',corners:'corners',epipolar:'epipolar',diffusion:'diffusion'}[story.id],story.module))}${button('All videos','#cinema')}</div><div class="library-extras"><h2>Keep exploring</h2>${storyTiles()}</div>` : '<div id="classroom"></div>');
    if(story)window.CV_STORIES.mount(document.getElementById('cinema-player'),story.id,{video:true});
    else window.CV_CLASSROOM.render(document.getElementById('classroom'), {modules: course.modules});
  }
  function lessonRows(moduleId = 1) {
    return course.lessons.filter(lesson => lesson.module === moduleId).map(lesson => `<a class="lesson-row${state.completed.includes(lesson.id) ? ' complete' : ''}" href="#lesson/${lesson.id}"><span class="lesson-index">${state.completed.includes(lesson.id) ? '✓' : String(lesson.id).padStart(2, '0')}</span><div><div class="lesson-title">${escape(lesson.title)}</div><div class="lesson-meta">${lesson.id === 1 ? '75–90' : '90'} min · Lesson + experiment + practice</div></div><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('');
  }
  function overview() {
    const next = course.lessons.find(l => !state.completed.includes(l.id)) || course.lessons[0];
    main.innerHTML = `<section class="hero"><div><div class="eyebrow">YOUR PERSONAL COURSE</div><h1>Understand the maths.<br>See the vision.</h1><p>A connected path from refreshed foundations to recognition, detection and segmentation. Read a little, work the numbers, then see the idea change.</p><div class="button-row">${button(state.completed.length ? 'Continue your lessons' : 'Start Lesson 01', `#lesson/${next.id}`, true)}${button('View the roadmap', '#roadmap')}</div></div><div class="hero-art">${heroDiagram()}</div></section>
      <div class="course-facts"><span><strong>${coreWeeks()}</strong> core weeks${extensionModules().length ? ` + ${course.plan.length - coreWeeks()} extension` : ''}</span><span><strong>8–10</strong> hours / week</span><span><strong>${course.modules.length}</strong> modules</span><span><strong>${course.lessons.length}</strong> lessons ready</span></div>${reviewStrip()}
      <div class="dashboard-grid"><section class="panel"><div class="section-heading"><h2>Your next chapter</h2><span class="pill">Ready to study</span></div><div class="lesson-list">${lessonRows(next.module)}</div><div class="today-block"><div class="eyebrow" style="margin:0">${state.completed.filter(n => course.lessons.find(l=>l.id===n)?.module===next.module).length} / 4 CHAPTER LESSONS COMPLETE</div><p>Understanding sets the pace.<br>Revisit an idea whenever you need.</p></div></section>
      <section class="panel panel-dark"><div class="eyebrow">TRY AN IDEA</div><h2>Pixels are numbers.</h2><p class="muted small">Move the scale. Watch every entry change.</p><div class="mini-image-row"><div id="mini-original" class="mini-matrix"></div><span class="mini-arrow" aria-hidden="true">→</span><div id="mini-output" class="mini-matrix"></div></div><label class="mini-control" for="mini-scale"><span>Scale</span><output id="mini-scale-value">0.50</output></label><input id="mini-scale" type="range" min="0" max="1.5" step=".05" value=".5"><div class="mini-control"><span>Output mean</span><output id="mini-mean">40</output></div><a class="text-link" style="color:#ffc29a;display:inline-block;margin-top:20px" href="#lesson/1/explore">Open the full experiment ↗</a></section></div>
      <section class="visual-home-section"><div class="section-heading"><div><div class="eyebrow">A VISUAL PATH THROUGH THE COURSE</div><h2>See what each chapter unlocks.</h2></div><a class="text-link" href="#cinema">All ${window.CV_CONCEPT_VIDEOS.items.length + window.CV_STORIES.stories.length} videos ↗</a></div>${storyTiles()}</section><div class="lower-grid"><a class="shortcut" href="#practice"><span class="shortcut-num">01 / FIND YOUR START</span><h3>A short assessment</h3><p>No grades. Find the ideas to refresh.</p></a><a class="shortcut" href="#roadmap/week/1"><span class="shortcut-num">02 / MAKE A RHYTHM</span><h3>Your weekly rhythm</h3><p>Six flexible study sessions each week.</p></a><a class="shortcut" href="#library"><span class="shortcut-num">03 / GO DEEPER</span><h3>All four books, together</h3><p>Your PDFs and the MML bridge, one click away.</p></a></div>`;
    const base = [20, 60, 100, 140];
    renderPixels(document.getElementById('mini-original'), base, true);
    const updateMini = () => {
      const s = Number(document.getElementById('mini-scale').value);
      const output = base.map(v => v * s);
      renderPixels(document.getElementById('mini-output'), output, true);
      document.getElementById('mini-scale-value').textContent = s.toFixed(2);
      document.getElementById('mini-mean').textContent = fmt(mean(output));
    };
    document.getElementById('mini-scale').addEventListener('input', updateMini);
    updateMini();
  }
  function roadmap(week = 1, showRhythm = false) {
    week = validStudyWeek(week);
    main.innerHTML = header('THE CONNECTED PATH', 'Your course roadmap', `${course.modules.length - extensionModules().length} core modules${extensionModules().length ? ` and ${extensionModules().length} extension modules` : ''}, each with four authored lessons, auto-checked practice, interactive experiments and a checkpoint. Follow the sequence and let the checkpoints set your pace.`) +
      `<details class="roadmap-rhythm" id="weekly-rhythm"${showRhythm ? ' open' : ''}><summary>Suggested weekly rhythm<span>${course.plan.length} flexible weeks · 8–10 hours per week</span></summary><div class="roadmap-rhythm-content"><p class="muted">Eight core hours each week, plus up to two for review. Use the mastery checks to set your pace.</p>${weeklyRhythmMarkup(week)}</div></details>` +
      `<div class="roadmap">${course.modules.map(m => `<a class="module-card" href="#module/${m.n}"><div class="module-art">${window.CV_STORIES.frame(window.CV_STORIES.forModule(m.n).id,3.8)}</div><div class="eyebrow">MODULE ${String(m.n).padStart(2, '0')} · WEEKS ${m.weeks}${m.extension ? ' · EXTENSION' : ''}</div><h3>${escape(m.title)}</h3><p>${escape(m.purpose)}</p>${m.extension && m.after ? `<p class="small muted">${escape(m.after)}</p>` : ''}<div class="card-bottom"><span class="pill${state.ready.includes(m.n) ? '' : ' pill-orange'}">${state.checkpoints[m.n]?.passed ? '✓ Checkpoint passed' : state.ready.includes(m.n) ? 'Marked ready' : `${course.lessons.filter(l => l.module === m.n).length} lessons ready`}</span><span class="text-link">Explore module ↗</span></div></a>`).join('')}</div>`;
    document.getElementById('study-week').addEventListener('change', event => { location.hash = '#roadmap/week/' + event.target.value; });
  }
  function modulePage(id) {
    const m = course.modules.find(m => m.n === id);
    if (!m) return overview();
    main.innerHTML = header(`MODULE ${String(id).padStart(2, '0')} · WEEKS ${m.weeks}${m.extension ? ' · EXTENSION' : ''}`, escape(m.title), escape(m.purpose) + (m.extension && m.after ? `<br><span class="small">${escape(m.after)}</span>` : '')) +
      `<div class="detail-grid"><div class="detail-stack"><section class="panel"><h3>Four concept lessons</h3>${lessonRows(id)}</section><section class="panel"><h3>By the end, you can…</h3><ul>${m.outcomes.map(t => `<li>${escape(t)}</li>`).join('')}</ul></section><section class="panel"><h3>Practice before the lab</h3><p>${escape(m.practice)}</p></section><section class="panel"><h3>Your experiment</h3><p>${escape(m.lab)}</p><h3>What to submit</h3><p>${escape(m.artifact)}</p><div class="resource-downloads">${course.notebooks.filter(nb => nb.modules.includes(id)).map(nb => `<a class="btn nb-link" href="${nb.href}" download>Module notebook ↓</a>`).join('')}</div>${id === 12 ? `<a class="text-link" href="capstone-template.md" download>Capstone report template ↓</a>` : ''}</section></div>
      <div class="detail-stack"><section class="panel"><div class="eyebrow">READ WITH A PURPOSE</div><h3>Your book sections</h3><p>${window.CV_READING.linkify(m.reading)}</p>${bookLinks(m.reading)}</section><section class="panel"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h3>Mastery check</h3><p>${escape(m.gate)}</p>${window.CV_PRACTICE.checkpointMarkup(id)}<div class="pq-manual"><button class="btn complete-btn${state.ready.includes(id) ? ' selected' : ''}" id="mark-ready" type="button" aria-pressed="${state.ready.includes(id)}">${state.ready.includes(id) ? '✓ Module marked ready' : 'Mark ready without the checkpoint'}</button><p class="small muted" style="margin-top:10px">Use this when you have shown the same understanding another way, such as explaining the gate above and solving a new example.</p></div></section>${notes('module-' + id)}</div></div>`;
    document.getElementById('mark-ready').addEventListener('click', () => {
      state.ready = state.ready.includes(id) ? state.ready.filter(n => n !== id) : [...state.ready, id];
      save(); modulePage(id);
    });
    window.CV_PRACTICE.mountCheckpoint(main, id, () => { if (!state.ready.includes(id)) state.ready = [...state.ready, id]; save(); const b = document.getElementById('mark-ready'); b.classList.add('selected'); b.setAttribute('aria-pressed', 'true'); b.textContent = '✓ Module marked ready'; });
  }
  function manualQuestions(prefix, questions, solutions) {
    return `<div class="assessment">${questions.map((q, i) => `<section class="assessment-card"><div class="question-meta"><span>QUESTION ${String(i + 1).padStart(2, '0')}</span></div><h3 id="q-label-${prefix}-${i}">${escape(q)}</h3><textarea class="notes" data-answer="${prefix}-${i}" aria-labelledby="q-label-${prefix}-${i}" placeholder="Show your reasoning. ‘Not sure’ is a useful starting point.">${escape(state.answers[`${prefix}-${i}`] || '')}</textarea>${solutions && solutions[i] ? `<details><summary>Show the worked answer</summary><p>${escape(solutions[i])}</p></details>` : ''}</section>`).join('')}</div>`;
  }
  function mathFocus(id) {
    const t=window.CV_TEACHING[id];
    return `<section class="concept-focus"><div><div class="eyebrow">THE IDEA TO KEEP</div><div class="focus-equation" data-equation="${escape(t.equation)}"></div><div class="symbol-key">${(window.CV_PRIMER?.symbolsFor(id)||t.symbols).map(([symbol,meaning,term])=>`<div><b>${window.CV_TUTOR.symbolMarkup(symbol,id)}</b>${term&&window.CV_PRIMER.hasTerm(id,term)?`<button type="button" class="symbol-term" data-primer-term="${escape(term)}">${escape(meaning)}</button>`:`<span>${escape(meaning)}</span>`}</div>`).join('')}</div></div><div class="focus-connection"><div class="eyebrow">WHY THIS MATTERS IN CV</div><p>${escape(t.connection)}</p><div class="common-trap"><strong>Watch this detail</strong><p>${escape(t.trap)}</p></div></div></section>`;
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
      `<nav class="lesson-tabs" aria-label="Lesson activities">${['read','explore','practice'].map((v,i)=>`<a class="tab${v===tab?' active':''}" href="#lesson/${id}/${v}"${v===tab?' aria-current="page"':''}><span class="activity-num">0${i+1}</span>${{read:'Learn & visualize',explore:'Experiment',practice:'Practice'}[v]}</a>`).join('')}</nav><div id="lesson-content"></div><div class="lesson-footer"><button class="btn complete-btn${state.completed.includes(id)?' selected':''}" id="complete-lesson" type="button" aria-pressed="${state.completed.includes(id)}">${state.completed.includes(id)?'✓ Lesson complete':'Mark lesson complete'}</button>${id>1?button('Previous lesson','#lesson/'+(id-1)):''}${course.lessons.some(l=>l.id===id+1)?button('Next lesson','#lesson/'+(id+1)):button('Back to the roadmap','#roadmap')}</div>`;
    const content=document.getElementById('lesson-content');
    const actions=main.querySelector('.lesson-footer');
    actions.classList.add('lesson-actions');
    actions.setAttribute('role','group');
    actions.setAttribute('aria-label','Lesson navigation and completion');
    main.querySelector('.lesson-tabs').before(actions);
    const updateLessonOffset=()=>document.documentElement.style.setProperty('--lesson-actions-height',`${actions.getBoundingClientRect().height}px`);
    lessonActionsObserver?.disconnect();
    lessonActionsObserver=new ResizeObserver(updateLessonOffset);
    lessonActionsObserver.observe(actions);
    updateLessonOffset();
    if(tab==='read'){
      content.innerHTML=mathFocus(id)+(window.CV_PRIMER?.panel(id)||'')+window.CV_TUTOR.markup(id)+`<details class="lesson-module-story"><summary>Watch the module ${String(lesson.module).padStart(2,'0')} animated overview</summary><div id="lesson-story"></div></details><div class="reading-grid"><article class="panel prose" id="lesson-article">${lesson.html}</article><aside class="reader-aside"><section class="panel reader-outline"><div class="eyebrow">IN THIS LESSON</div><div id="reading-outline"></div></section>${quickCheck(id)}${notes('lesson-'+id)}<section class="panel lesson-reading"><div class="eyebrow">READ WITH A PURPOSE</div><p>${window.CV_READING.linkify(lesson.reading)}</p>${bookLinks(lesson.reading)}${(course.companions[id]||[]).map(item=>`<a class="book-chip" href="${item.url}" target="_blank" rel="noopener">${escape(item.title)} ↗</a>`).join('')}<div class="resource-downloads">${course.notebooks.filter(nb=>nb.modules.includes(lesson.module)).map(nb=>`<a class="btn nb-link" href="${nb.href}" download>Module notebook ↓</a>`).join('')}</div></section></aside></div>`;
      window.CV_TUTOR.mount(content.querySelector('[data-tutor]'),id);
      window.CV_PRIMER?.mount(content);
      // A lesson can have an animated explanation as well as a walkthrough; each player loads when opened.
      window.CV_CONCEPT_VIDEOS.items.filter(item => item.lesson === id).sort((a, b) => Number(!!b.animated) - Number(!!a.animated)).forEach(narrated => {
        const disclosure = document.createElement('details');
        disclosure.className = 'concept-lesson-video';
        disclosure.innerHTML = `<summary>${narrated.animated ? '<span class="pill pill-orange">Animated</span> Watch the explanation' : 'Watch the narrated walkthrough'}: ${escape(narrated.title)} · ${window.CV_CONCEPT_VIDEOS.durationLabel(narrated.duration)}</summary><div data-concept-lesson-player></div>`;
        content.querySelector('.lesson-module-story').before(disclosure);
        let mounted = false;
        disclosure.addEventListener('toggle', () => {
          if (disclosure.open && !mounted) { window.CV_CONCEPT_VIDEOS.mount(disclosure.querySelector('[data-concept-lesson-player]'), narrated); mounted = true; }
          if (!disclosure.open) disclosure.querySelector('video')?.pause();
        });
      });
      window.CV_STORIES.mount(document.getElementById('lesson-story'),story.id,{video:true});
      window.CV_TUTOR.renderMath(content);
      document.querySelectorAll('#lesson-article h2').forEach(h=>{if(/read with a purpose/i.test(h.textContent)&&h.nextElementSibling?.tagName==='P')window.CV_READING.linkifyElement(h.nextElementSibling);});
      document.querySelectorAll('#lesson-article p').forEach(p=>{if(/^Reading after practice/i.test(p.textContent))window.CV_READING.linkifyElement(p);});
      const headings=[...document.querySelectorAll('#lesson-article h2')];
      document.getElementById('reading-outline').innerHTML=headings.map((h,i)=>`<button type="button" data-section="${i}"><span>${String(i+1).padStart(2,'0')}</span>${escape(h.textContent)}</button>`).join('');
      headings.forEach(h=>h.tabIndex=-1);
      document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>{const h=headings[Number(b.dataset.section)];h.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});h.focus({preventScroll:true});}));
      document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{const value=Number(b.dataset.choice);state.quiz['concept-'+id]=value;save();document.querySelectorAll('[data-choice]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));const feedback=document.getElementById('concept-feedback');feedback.textContent=`${value===t.correct?'✓ Correct.':'Revisit this. Pick another answer when you are ready.'} ${t.explanation}`;feedback.classList.toggle('success',value===t.correct);}));
    }
    if(tab==='explore')content.innerHTML=`<p class="explore-note" style="margin-top:0"><strong>Predict first:</strong> ${escape(t.trap)} Change one control, describe the result, then return to the lesson’s practice.</p><div id="lesson-lab"></div>`,mountLab(lesson.lab||lessonLab[id-1],document.getElementById('lesson-lab'));
    if(tab==='practice'){content.innerHTML=`${window.CV_PRACTICE.lessonMarkup(id)}<section class="pq-written"><div class="section-heading"><div><div class="eyebrow">EXPLAIN IN WRITING</div><h2>Worked exercises</h2></div></div><p class="muted small">Work each question before opening its answer. Your writing is saved as you type.</p>${manualQuestions('lesson-'+id,lesson.exercises,lesson.solutions||lessonSolutions[id-1])}</section>${notes('reflection-'+id,'What changed in your understanding?')}`;window.CV_PRACTICE.mountLesson(content,id);}
    document.getElementById('complete-lesson').addEventListener('click',()=>{
      state.completed=state.completed.includes(id)?state.completed.filter(n=>n!==id):[...state.completed,id];save();
      const b=document.getElementById('complete-lesson');b.classList.toggle('selected',state.completed.includes(id));b.setAttribute('aria-pressed',String(state.completed.includes(id)));b.textContent=state.completed.includes(id)?'✓ Lesson complete':'Mark lesson complete';
    });
  }
  function rangeControl(id, label, min, max, step, value) {
    return `<div class="control"><label for="${id}"><span>${label}</span><output id="${id}-value">${fmt(value)}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  }
  function explore(name = 'pixels') {
    if (!labNames[name]) name = 'pixels';
    main.innerHTML = header('THE MATHS WORKBENCH', 'Make an idea visible.', 'Change one quantity. Predict what will happen, then compare it with the result.') +
      `<div class="study-week-picker"><label for="experiment-select">Choose an experiment</label><select id="experiment-select">${Object.entries(labNames).map(([key, title]) => `<option value="${key}"${name === key ? ' selected' : ''}>${title}</option>`).join('')}</select></div><div id="lab-content"></div>`;
    mountLab(name, document.getElementById('lab-content'));
    document.getElementById('experiment-select').addEventListener('change', event => { location.hash = '#explore/' + event.target.value; });
  }
  function mountLab(name, target) {
    if (window.CV_VISION_LABS.names[name]) return window.CV_VISION_LABS.mount(name, target);
    if (window.CV_LABS.names[name]) return window.CV_LABS.mount(name, target);
    let controls = '', visual = '', note = '';
    const s = labState[name];
    if (name === 'pixels') {
      controls = `<h3>A tiny image, a simple rule.</h3><p>Scale every pixel, then add an offset. Compare the mean before and after clipping.</p>${rangeControl('pixel-scale', 'Scale', 0, 2, .05, s.scale)}${rangeControl('pixel-offset', 'Offset', -50, 100, 5, s.offset)}<label class="check-label"><input id="pixel-clip" type="checkbox"${s.clip ? ' checked' : ''}>Clip to the range 0–255</label><div class="math-rule">J = scale × I + offset</div>`;
      visual = `<div class="pixel-pair"><div><div class="pixel-caption">Original image</div><div id="pixel-original" class="pixel-grid" role="img" aria-label="Original 2 by 2 image: 20, 60, 100, 140"></div><div class="pixel-foot"><span>Mean</span><strong>80</strong></div></div><div><div class="pixel-caption">Transformed image</div><div id="pixel-output" class="pixel-grid" role="img"></div><div class="pixel-foot"><span>Mean</span><strong id="pixel-mean">50</strong></div></div></div><p class="experiment-caption" id="pixel-caption" aria-live="polite"></p>`;
      note = 'Try scale 2 and offset −20. Turn clipping off, then on. Explain why the mean changes. We operate on toy stored values; these are not a physical lighting simulation.';
    } else if (name === 'functions') {
      controls = `<h3>Order changes the answer.</h3><p>Let f(x)=ax and g(x)=x+b. Compare “scale, then shift” with “shift, then scale”.</p>${rangeControl('function-slope', 'Scale a', -2, 3, .1, s.slope)}${rangeControl('function-offset', 'Offset b', -20, 20, 1, s.offset)}${rangeControl('function-input', 'Input x', 0, 50, 1, s.input)}<div class="math-rule">g(f(x)) = ax + b<br>f(g(x)) = ax + ab</div>`;
      visual = `<div class="plot-legend"><span><i class="legend-line"></i>Scale → shift</span><span><i class="legend-line blue"></i>Shift → scale</span></div><div id="function-plot" class="plot"></div><div class="plot-summary" aria-live="polite"><span>g(f(x)) <strong id="function-result-a"></strong></span><span>f(g(x)) <strong id="function-result-b"></strong></span><span>Difference <strong id="function-difference"></strong></span></div>`;
      note = 'Make the two outputs agree. Does that require a particular input x, or particular values of a and b? Explain your prediction before changing the controls.';
    } else if (name === 'loss') {
      controls = `<h3>How wrong is the fit?</h3><p>Fit predictions y=wx+1 to targets at x=[0,1,2], y=[1,3,5]. The mean squared error changes as w changes.</p>${rangeControl('loss-weight', 'Model weight w', -1, 4, .01, s.weight)}<div class="button-row"><button id="gradient-step" class="btn btn-primary" type="button">Take a learning step →</button></div><div class="math-rule">MSE = mean((prediction − target)²)</div><p class="small muted" style="margin-top:15px">The button uses a gradient step with learning rate 0.15. We derive this in the calculus and optimization modules.</p>`;
      visual = `<div id="loss-plot" class="plot"></div><div class="plot-summary" aria-live="polite"><span>MSE <strong id="loss-value"></strong></span><span>Predictions <strong id="loss-predictions"></strong></span></div>`;
      note = 'Find a weight that produces zero error. Try a few learning steps from a different starting point. A lower loss on these three points says nothing by itself about new data.';
    } else {
      controls = `<h3>A score becomes a probability.</h3><p>Sigmoid maps a real score into (0,1). The loss depends on the probability assigned to the correct class.</p>${rangeControl('confidence-score', 'Score z', -6, 6, .1, s.score)}<div class="control"><label for="confidence-label">Correct class</label><select class="lab-select" id="confidence-label"><option value="1"${s.label === 1 ? ' selected' : ''}>Class 1</option><option value="0"${s.label === 0 ? ' selected' : ''}>Class 0</option></select></div><div class="math-rule">p(class 1) = 1 / (1 + e⁻ᶻ)<br>Loss = −ln(p(correct class))</div>`;
      visual = `<div id="confidence-plot" class="plot"></div><div class="plot-summary" aria-live="polite"><span>p(class 1) <strong id="confidence-probability"></strong></span><span>p(correct class) <strong id="confidence-correct"></strong></span><span>Log loss <strong id="confidence-loss"></strong></span></div>`;
      note = 'Keep the score high and change the correct class. Explain why a confident prediction can receive a large loss. A probability is a model output; confidence still needs evaluation.';
    }
    target.innerHTML = `<div class="lab-layout"><section class="lab-controls">${controls}</section><section class="experiment"><div class="experiment-top"><h3>${labNames[name]}</h3><span class="live-badge">LIVE EXPERIMENT</span></div>${visual}</section></div><p class="explore-note">${note}</p>`;
    if (name === 'pixels') {
      ['pixel-scale', 'pixel-offset', 'pixel-clip'].forEach(id => document.getElementById(id).addEventListener('input', () => {
        s.scale = Number(document.getElementById('pixel-scale').value); s.offset = Number(document.getElementById('pixel-offset').value); s.clip = document.getElementById('pixel-clip').checked; updateLab(name);
      }));
    } else if (name === 'functions') {
      ['function-slope', 'function-offset', 'function-input'].forEach(id => document.getElementById(id).addEventListener('input', () => {
        s.slope = Number(document.getElementById('function-slope').value); s.offset = Number(document.getElementById('function-offset').value); s.input = Number(document.getElementById('function-input').value); updateLab(name);
      }));
    } else if (name === 'loss') {
      document.getElementById('loss-weight').addEventListener('input', event => { s.weight = Number(event.target.value); updateLab(name); });
      document.getElementById('gradient-step').addEventListener('click', () => {
        s.weight = clamp(s.weight - .15 * (10 / 3) * (s.weight - 2), -1, 4);
        document.getElementById('loss-weight').value = s.weight; updateLab(name);
      });
    } else {
      ['confidence-score', 'confidence-label'].forEach(id => document.getElementById(id).addEventListener('input', () => {
        s.score = Number(document.getElementById('confidence-score').value); s.label = Number(document.getElementById('confidence-label').value); updateLab(name);
      }));
    }
    target.dataset.lab = name;
    target.querySelector('.lab-controls').insertAdjacentHTML('beforeend','<button type="button" class="btn lab-defaults">Reset this experiment</button>');
    target.querySelector('.lab-defaults').addEventListener('click',()=>{Object.assign(labState[name],labDefaults[name]);mountLab(name,target);target.querySelector('.lab-defaults').focus();});
    updateLab(name);
  }
  function renderPixels(el, values, mini = false) {
    el.innerHTML = values.map(value => {
      const gray = Math.round(clamp(value, 0, 255));
      return `<div class="${mini ? 'mini-pixel' : 'pixel-cell'}" style="background:rgb(${gray},${gray},${gray});color:${gray > 117 ? '#000' : '#fff'}">${fmt(value)}</div>`;
    }).join('');
    el.setAttribute('aria-label', `Two by two image values: ${values.map(v => fmt(v)).join(', ')}`);
  }
  function plot(id, config) {
    const el = document.getElementById(id);
    if (!el) return;
    const w = Math.max(230, Math.round(el.getBoundingClientRect().width)), h = 260;
    const margin = { left: 60, right: 16, top: 17, bottom: 43 };
    const sx = x => margin.left + (x - config.x[0]) / (config.x[1] - config.x[0]) * (w - margin.left - margin.right);
    const sy = y => h - margin.bottom - (y - config.y[0]) / (config.y[1] - config.y[0]) * (h - margin.top - margin.bottom);
    let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(config.label)}"><title>${escape(config.label)}</title>`;
    const nticks = w < 340 ? 3 : 5;
    for (let i = 0; i <= nticks; i++) {
      const x = config.x[0] + i / nticks * (config.x[1] - config.x[0]);
      svg += `<line class="grid-line" x1="${sx(x)}" x2="${sx(x)}" y1="${margin.top}" y2="${h - margin.bottom}"/><text x="${sx(x)}" y="${h - margin.bottom + 19}" text-anchor="${i === 0 ? 'start' : i === nticks ? 'end' : 'middle'}">${fmt(x, 1)}</text>`;
    }
    for (let i = 0; i <= 4; i++) {
      const y = config.y[0] + i / 4 * (config.y[1] - config.y[0]);
      svg += `<line class="grid-line" x1="${margin.left}" x2="${w - margin.right}" y1="${sy(y)}" y2="${sy(y)}"/><text x="${margin.left - 8}" y="${sy(y) + 4}" text-anchor="end">${fmt(y, 1)}</text>`;
    }
    svg += `<line class="axis-line" x1="${margin.left}" x2="${w - margin.right}" y1="${h - margin.bottom}" y2="${h - margin.bottom}"/><text x="${(margin.left + w - margin.right) / 2}" y="${h - 3}" text-anchor="middle">${escape(config.xLabel)}</text><text x="13" y="${(margin.top + h - margin.bottom) / 2}" text-anchor="middle" transform="rotate(-90,13,${(margin.top + h - margin.bottom) / 2})">${escape(config.yLabel)}</text>`;
    config.series.forEach((series, i) => {
      const points = Array.from({ length: 101 }, (_, k) => {
        const x = config.x[0] + k / 100 * (config.x[1] - config.x[0]);
        return `${k ? 'L' : 'M'}${sx(x).toFixed(2)},${sy(series.fn(x)).toFixed(2)}`;
      }).join(' ');
      svg += `<path class="series-${i === 0 ? 'a' : 'b'}" d="${points}"/>`;
    });
    if (Number.isFinite(config.selected)) {
      svg += `<line class="selected-guide" x1="${sx(config.selected)}" x2="${sx(config.selected)}" y1="${margin.top}" y2="${h - margin.bottom}"/>`;
      config.series.forEach((series, i) => { svg += `<circle cx="${sx(config.selected)}" cy="${sy(series.fn(config.selected))}" r="5" fill="${i === 0 ? '#bd431c' : '#315c86'}" stroke="#fffefa" stroke-width="2"/>`; });
    }
    el.innerHTML = svg + '</svg>';
  }
  function updateLab(name) {
    const s = labState[name];
    if (name === 'pixels' && document.getElementById('pixel-output')) {
      const base = [20, 60, 100, 140];
      const raw = base.map(value => s.scale * value + s.offset);
      const values = s.clip ? raw.map(value => clamp(value, 0, 255)) : raw;
      renderPixels(document.getElementById('pixel-original'), base);
      renderPixels(document.getElementById('pixel-output'), values);
      document.getElementById('pixel-scale-value').textContent = s.scale.toFixed(2);
      document.getElementById('pixel-offset-value').textContent = fmt(s.offset);
      document.getElementById('pixel-mean').textContent = fmt(mean(values));
      const n = s.clip ? raw.filter(v => v < 0 || v > 255).length : 0;
      document.getElementById('pixel-caption').textContent = `${n} of 4 pixels clipped. Mean before clipping: ${fmt(mean(raw))}. Values are displayed within 0–255 even when the calculation is unclipped.`;
    } else if (name === 'functions' && document.getElementById('function-plot')) {
      const fa = x => s.slope * x + s.offset, fb = x => s.slope * x + s.slope * s.offset;
      const extent = [fa(0), fa(50), fb(0), fb(50)];
      const ymin = Math.min(...extent), ymax = Math.max(...extent), pad = Math.max(4, (ymax - ymin) * .12);
      plot('function-plot', { x: [0, 50], y: [ymin - pad, ymax + pad], series: [{ fn: fa }, { fn: fb }], selected: s.input, xLabel: 'Input x', yLabel: 'Output', label: 'Two function compositions across inputs from 0 to 50.' });
      ['slope', 'offset', 'input'].forEach(key => { document.getElementById('function-' + key + '-value').textContent = fmt(s[key]); });
      document.getElementById('function-result-a').textContent = fmt(fa(s.input));
      document.getElementById('function-result-b').textContent = fmt(fb(s.input));
      document.getElementById('function-difference').textContent = fmt(fb(s.input) - fa(s.input));
    } else if (name === 'loss' && document.getElementById('loss-plot')) {
      const loss = w => 5 / 3 * (w - 2) ** 2;
      plot('loss-plot', { x: [-1, 4], y: [0, 16], series: [{ fn: loss }], selected: s.weight, xLabel: 'Model weight w', yLabel: 'Mean squared error', label: 'Mean squared error as a function of model weight. The minimum is at weight 2.' });
      document.getElementById('loss-weight-value').textContent = fmt(s.weight);
      document.getElementById('loss-value').textContent = fmt(loss(s.weight), 4);
      document.getElementById('loss-predictions').textContent = `[${[0, 1, 2].map(x => fmt(s.weight * x + 1)).join(', ')}]`;
    } else if (name === 'confidence' && document.getElementById('confidence-plot')) {
      const sigmoid = z => 1 / (1 + Math.exp(-z));
      const p = sigmoid(s.score), correct = s.label === 1 ? p : 1 - p;
      plot('confidence-plot', { x: [-6, 6], y: [0, 1], series: [{ fn: sigmoid }], selected: s.score, xLabel: 'Score z', yLabel: 'p(class 1)', label: 'Sigmoid probability as the score changes from negative to positive.' });
      document.getElementById('confidence-score-value').textContent = fmt(s.score);
      document.getElementById('confidence-probability').textContent = fmt(p, 4);
      document.getElementById('confidence-correct').textContent = fmt(correct, 4);
      document.getElementById('confidence-loss').textContent = fmt(-Math.log(correct), 4);
    }
  }
  const quizQuestions = [
    { text: 'For I=[[20,60],[100,140]], what is the mean pixel value?', answer: 80, explanation: '(20+60+100+140)/4 = 80.' },
    { text: 'With zero-based indexing, what is I[1,0]?', answer: 100, explanation: 'Row 1 is the second row; column 0 is the first column. Its value is 100.' },
    { text: 'What is the mean of 2I−20 before clipping?', answer: 140, explanation: '2×80−20=140. The entries are [20,100,180,260].' },
    { text: 'What is that mean after clipping values to [0,255]?', answer: 138.75, explanation: 'Only 260 changes, becoming 255. The new mean is (20+100+180+255)/4=138.75.' }
  ];
  function practice(sub) {
    if (sub === 'review' || sub === 'ahead') {
      main.innerHTML = header('PRACTICE & REFLECTION', sub === 'review' ? 'Today’s review' : 'Practise ahead', 'One question at a time, with new numbers. Answer before you look; your first attempt decides when the question returns.') + window.CV_PRACTICE.sessionMarkup(sub);
      window.CV_PRACTICE.mountSession(main, sub);
      return;
    }
    main.innerHTML = header('PRACTICE & REFLECTION', 'Work it out. Explain your steps.', 'Review questions that are due, revisit your mistakes, or use the starting assessment to find what needs a refresher. Your answers are saved in this browser.') +
      window.CV_PRACTICE.practiceMarkup() +
      `<div class="section-heading" style="margin-top:45px"><h2>Lesson 01 quick check</h2><a href="#lesson/1" class="text-link">Revisit the lesson ↗</a></div><div class="quiz">${quizQuestions.map((q, i) => `<div class="quiz-question"><div class="question-meta">CHECK ${i + 1}</div><label for="quiz-${i}">${q.text}</label><input id="quiz-${i}" type="number" step="any" placeholder="Your answer" value="${escape(state.quiz[i] ?? '')}" data-quiz="${i}"><div id="quiz-feedback-${i}" class="quiz-feedback"></div></div>`).join('')}</div><div class="button-row"><button id="check-quiz" class="btn btn-primary" type="button">Check my answers</button><span id="quiz-result" role="status" class="small"></span></div>
      <div class="section-heading" style="margin-top:45px"><h2>Your starting assessment</h2><span class="pill pill-plan">About 25 minutes</span></div><p class="muted small">The later questions preview calculus and probability. “Not sure” helps us choose where to slow down.</p>${manualQuestions('assessment', course.assessment, course.assessmentAnswers)}<div class="answer-copy"><button class="btn" id="copy-answers" type="button">Copy answers for our chat ↗</button><span id="copy-status" class="small muted" role="status" style="margin-left:12px"></span><div id="copy-fallback"></div></div>`;
    window.CV_PRACTICE.mountPractice(main);
    document.getElementById('check-quiz').addEventListener('click', () => {
      let correct = 0;
      quizQuestions.forEach((q, i) => {
        const raw = document.getElementById('quiz-' + i).value;
        const v = Number(raw), ok = raw.trim() !== '' && Number.isFinite(v) && Math.abs(v - q.answer) < .005;
        if (ok) correct++;
        document.getElementById('quiz-feedback-' + i).innerHTML = `<span class="${ok ? 'success' : 'incorrect'}">${ok ? '✓ Correct. ' : raw.trim() ? 'Revisit this step. ' : 'Try an answer first. '}</span>${raw.trim() ? escape(q.explanation) : ''}`;
      });
      document.getElementById('quiz-result').textContent = `${correct} of 4 correct. ${correct === 4 ? 'Now explain why clipping changes the mean.' : 'Use the explanation, then try a new example.'}`;
    });
    document.getElementById('copy-answers').addEventListener('click', async () => {
      const content = course.assessment.map((q, i) => `${i + 1}. ${q}\nMy answer: ${state.answers['assessment-' + i] || 'Not attempted yet'}`).join('\n\n');
      try { await navigator.clipboard.writeText(content); document.getElementById('copy-status').textContent = 'Copied. Paste into our chat.'; }
      catch {
        document.getElementById('copy-fallback').innerHTML = `<label class="notes-label" for="copy-text">Select and copy your answers</label><textarea id="copy-text" class="notes clipboard-fallback" readonly>${escape(content)}</textarea>`;
        document.getElementById('copy-text').select(); document.getElementById('copy-status').textContent = 'Press Ctrl+C to copy the selected answers.';
      }
    });
  }
  function allLessons() {
    main.innerHTML = header('YOUR LESSON LIBRARY', 'A connected course, ready to study.', `All ${course.lessons.length} lessons have explanations, auto-checked practice and checkpoints. Use the roadmap sequence; you can revisit any lesson at any time.`) +
      `<div class="lesson-filters"><label>Find a topic<input type="search" id="lesson-search" placeholder="Try vectors, gradient, IoU…"></label><label>Module<select id="lesson-module"><option value="0">All modules</option>${course.modules.map(m => `<option value="${m.n}">${String(m.n).padStart(2,'0')} · ${escape(m.title)}</option>`).join('')}</select></label></div><div id="lesson-index-results"></div>`;
    const render = () => {
      const query = document.getElementById('lesson-search').value.trim().toLowerCase();
      const module = Number(document.getElementById('lesson-module').value);
      const matches = course.lessons.filter(l => (!module || l.module === module) && (l.title + ' ' + (l.goal || '')).toLowerCase().includes(query));
      document.getElementById('lesson-index-results').innerHTML = matches.length ? course.modules.filter(m => matches.some(l => l.module === m.n)).map(m => `<section class="panel lesson-index-group"><div class="section-heading"><h2>${String(m.n).padStart(2,'0')} · ${escape(m.title)}</h2><a class="text-link" href="#module/${m.n}">Module guide ↗</a></div>${matches.filter(l => l.module === m.n).map(l => `<a class="lesson-row" href="#lesson/${l.id}"><span class="lesson-index">${state.completed.includes(l.id) ? '✓' : String(l.id).padStart(2,'0')}</span><div><div class="lesson-title">${escape(l.title)}</div><div class="lesson-meta">90 min · Read + explore + practice</div></div><span class="row-arrow">↗</span></a>`).join('')}</section>`).join('') : '<p role="status">No lessons match that topic. Try a shorter search.</p>';
    };
    document.getElementById('lesson-search').addEventListener('input',render);document.getElementById('lesson-module').addEventListener('change',render);render();
  }
  function validStudyWeek(week) {
    return Number.isInteger(week) && week >= 1 && week <= course.plan.length ? week : 1;
  }
  function weeklyRhythmMarkup(week) {
    return `<div class="study-week-picker"><label for="study-week">Choose your week</label><select id="study-week">${course.plan.map((_,i) => `<option value="${i+1}"${week === i+1 ? ' selected' : ''}>Week ${i+1} · Module ${Math.floor(i/2)+1}</option>`).join('')}</select></div><section class="panel"><div class="section-heading"><h2>Week ${week}</h2><span class="pill pill-orange">8 hours · 6 sessions</span></div>${course.plan[week - 1].map((session, i) => { const id = `${week}-${i}`; return `<label class="plan-session${state.sessions.includes(id) ? ' done' : ''}"><input type="checkbox" data-session="${id}"${state.sessions.includes(id) ? ' checked' : ''}><span class="session-time">${session.minutes} min</span><span><span class="session-task">${escape(session.task)}</span><span class="session-evidence" style="display:block">Evidence: ${escape(session.evidence)}</span></span></label>`; }).join('')}</section><p class="explore-note">Revisit an idea when it needs more time. A completed session records practice; explaining the idea and solving a new example checks mastery.</p>${notes('week-' + week, 'This week’s questions & things to revisit')}`;
  }
  function glossaryPage(focus) {
    main.innerHTML=header('GLOSSARY','Every new idea, in plain words.','Each term has a plain explanation, how to calculate it by hand and a worked example, with a link to the lesson that introduces it.')+'<div id="glossary"></div>';
    window.CV_PRIMER.glossary(document.getElementById('glossary'),focus);
  }
  function library() {
    main.innerHTML = header('YOUR RESOURCE LIBRARY', 'Four books. Different jobs.', 'Your three original resources and Mathematics for Machine Learning are now together. Open the relevant sections after a lesson, then return to your own calculations.') +
      `<div class="library-grid">${Object.entries(course.sources).map(([key, book]) => `<article class="book-card"><div class="book-cover" aria-hidden="true"><b>${key === 'GUO' ? 'Guo' : key}</b><span>${key === 'MML' ? 'MATHEMATICS\nFOR MACHINE\nLEARNING' : key === 'CV' ? 'COMPUTER\nVISION' : key === 'CS205A' ? 'MATHEMATICAL\nMETHODS' : 'MODERN\nMATHEMATICS'}</span><small>${book.pages} pages</small></div><div><h3>${escape(book.title)}</h3><div class="book-author">${escape(book.authors)}</div><p class="book-role">${escape(book.role)}</p><a class="text-link" href="${book.href}" target="_blank" rel="noopener" data-book="${key}">Open PDF ↗</a><div class="small muted" style="margin-top:9px">${book.pages} pages · ${escape(book.edition)}</div></div></article>`).join('')}</div>
      <div class="library-extras"><h2>Your course materials</h2><div class="resource-downloads"><a class="btn" href="notebooks/week01-02-foundations.ipynb" download>Starter notebook ↓</a><a class="btn" href="syllabus.md" download>Full syllabus ↓</a><a class="btn" href="solutions.md" download>Foundation solutions ↓</a><a class="btn" href="later-solutions.md" download>Lessons 05–${course.lessons.at(-1).id} solutions ↓</a><a class="btn" href="capstone-template.md" download>Capstone template ↓</a><label class="btn import-label">Import progress ↑<input id="import-progress" type="file" accept="application/json,.json"></label><button class="btn" id="export-progress" type="button">Export my progress ↓</button></div><p class="small muted" style="margin-top:16px"><span id="import-status" role="status"></span>Notebook: Python 3 and NumPy. Progress export includes your lesson checks, notes, written answers, review schedule, error log and checkpoint results.</p></div><div class="library-extras"><h2>${course.notebooks.length} runnable notebooks</h2><div class="resource-downloads">${course.notebooks.map(nb => `<a class="btn nb-link" href="${nb.href}" download>${escape(nb.title)} ↓</a>`).join('')}</div><p class="small muted" style="margin-top:12px">Python 3 and NumPy. Start at the module you are studying; the notebooks include demonstrations and experiment prompts.</p></div><div class="library-extras"><h3>Optional companions</h3><div class="resource-downloads"><a class="book-chip" href="https://mml-book.github.io/" target="_blank" rel="noopener">MML authors’ site ↗</a><a class="book-chip" href="https://cs231n.github.io/python-numpy-tutorial/" target="_blank" rel="noopener">Python & NumPy tutorial ↗</a><a class="book-chip" href="https://cs231n.stanford.edu/" target="_blank" rel="noopener">Stanford CS231n ↗</a></div></div>`;
    document.getElementById('import-progress').addEventListener('change',async event=>{
      const file=event.target.files[0];if(!file)return;const status=document.getElementById('import-status');
      try{
        if(file.size>5_000_000)throw Error('This file is too large for a progress backup.');
        const data=JSON.parse(await file.text());
        if(data.course!=='Maths for Computer Vision'||data.version!==1||!Array.isArray(data.completed)||!Array.isArray(data.ready)||!Array.isArray(data.sessions))throw Error('Choose a course progress JSON exported from this course.');
        for(const key of ['notes','answers','quiz'])if(!data[key]||typeof data[key]!=='object'||Array.isArray(data[key])||Object.values(data[key]).some(v=>typeof v!=='string'&&typeof v!=='number'))throw Error('The backup has invalid '+key+'.');
        // Merge notes and checks. Existing notes absent from the backup stay in place.
        const mergeWriting=(current,incoming)=>{const merged={...current};for(const [key,value] of Object.entries(incoming)){const text=String(value);merged[key]=merged[key]&&merged[key]!==text?merged[key]+'\n\n[Imported backup]\n'+text:text;}return merged;};
        // Keep whichever practice record was reviewed more recently; keep the best checkpoint result.
        const incomingPractice=cleanPractice(data.practice),practiceMerged={...state.practice};
        for(const [id,r] of Object.entries(incomingPractice))if(!practiceMerged[id]||(r.last||'')>(practiceMerged[id].last||''))practiceMerged[id]=r;
        const checkpointMerged={...state.checkpoints};
        for(const [n,r] of Object.entries(cleanCheckpoints(data.checkpoints)))if(!checkpointMerged[n]||r.best>checkpointMerged[n].best)checkpointMerged[n]={...r,passed:r.passed||!!checkpointMerged[n]?.passed};
        const errorKey=e=>e.item+'|'+e.date+'|'+e.prompt;
        const errorsMerged=[...state.errors,...cleanErrors(data.errors).filter(e=>!state.errors.some(x=>errorKey(x)===errorKey(e)))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,150);
        state={...state,completed:[...new Set([...state.completed,...data.completed.filter(n=>course.lessons.some(l=>l.id===n))])],ready:[...new Set([...state.ready,...data.ready.filter(validModule)])],sessions:[...new Set([...state.sessions,...data.sessions.filter(v=>typeof v==='string')])],notes:mergeWriting(state.notes,data.notes),answers:mergeWriting(state.answers,data.answers),quiz:{...data.quiz,...state.quiz},practice:practiceMerged,errors:errorsMerged,checkpoints:checkpointMerged};
        save();status.textContent='Backup imported and merged with your current progress. ';event.target.value='';
      }catch(error){status.textContent=error.message+' ';event.target.value='';}
    });
    document.getElementById('export-progress').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ course: 'Maths for Computer Vision', version: 1, ...state }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'maths-course-progress.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  let saveTimer;
  main.addEventListener('input', event => {
    const target = event.target;
    if (target.dataset.note) state.notes[target.dataset.note] = target.value;
    else if (target.dataset.answer) state.answers[target.dataset.answer] = target.value;
    else if (target.dataset.quiz !== undefined) state.quiz[target.dataset.quiz] = target.value;
    else return;
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 250);
  });
  main.addEventListener('change', event => {
    const target = event.target;
    if (target.dataset.session) {
      state.sessions = target.checked ? [...new Set([...state.sessions, target.dataset.session])] : state.sessions.filter(id => id !== target.dataset.session);
      target.closest('.plan-session').classList.toggle('done', target.checked); save();
    }
  });
  const mobileNav = window.matchMedia('(max-width: 720px)');
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault(); main.focus(); main.scrollIntoView({ block: 'start' });
  });
  function closeNav() {
    document.getElementById('sidebar').classList.remove('open'); document.getElementById('nav-scrim').hidden = true; document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
    document.getElementById('menu-toggle').setAttribute('aria-label', 'Open navigation');document.body.style.overflow='';
    document.getElementById('sidebar').inert = mobileNav.matches;
  }
  mobileNav.addEventListener('change', closeNav);
  document.getElementById('menu-toggle').addEventListener('click', () => {
    const open = document.getElementById('sidebar').classList.toggle('open'); document.getElementById('nav-scrim').hidden = !open; document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open));
    document.getElementById('sidebar').inert = !open && mobileNav.matches;
    document.getElementById('menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');document.body.style.overflow=open&&mobileNav.matches?'hidden':'';
    if(open)document.querySelector('.sidebar a').focus();
  });
  document.getElementById('nav-scrim').addEventListener('click', closeNav);
  document.addEventListener('keydown', event => {
    if(event.key==='Tab'&&mobileNav.matches&&document.getElementById('sidebar').classList.contains('open')){
      const links=[...document.querySelectorAll('.sidebar a')],first=links[0],last=links.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    if (event.key === 'Escape' && document.getElementById('sidebar').classList.contains('open')) {
      closeNav(); document.getElementById('menu-toggle').focus();
    }
  });
  function route() {
    lessonActionsObserver?.disconnect();
    document.documentElement.style.setProperty('--lesson-actions-height','0px');
    window.CV_STORIES.stop();
    window.CV_CONCEPT_VIDEOS.stop();
    clearTimeout(saveTimer);
    if (document.querySelector('[data-note], [data-answer], [data-quiz]')) save();
    const [page = 'overview', arg, sub] = (location.hash.slice(1) || 'overview').split('/');
    if (page === 'plan') {
      location.replace('#roadmap/week/' + validStudyWeek(Number(arg)));
      return;
    }
    const contextModule = page === 'module' ? Number(arg) : page === 'lesson' ? course.lessons.find(l => l.id === Number(arg))?.module : page === 'cinema' && arg ? (window.CV_CONCEPT_VIDEOS.items.find(item=>item.id===arg)?.module || window.CV_STORIES.stories.find(s=>s.id===arg)?.module) : (course.lessons.find(l => !state.completed.includes(l.id)) || course.lessons[0]).module;
    const chapter = course.modules.find(m => m.n === contextModule) || course.modules[0];
    const chapterLink = document.querySelector('.chapter-link');
    chapterLink.href = '#module/' + chapter.n;
    chapterLink.innerHTML = `<span class="chapter-number">${String(chapter.n).padStart(2,'0')}</span><span>${escape(chapter.title)}</span><span aria-hidden="true">→</span>`;
    const names = { practical: 'Practical CV', cinema: 'Visual classroom', overview: 'Overview', roadmap: 'Course roadmap', module: 'Module details', lessons: 'Your lessons', lesson: 'Your lesson', explore: 'Explore the maths', practice: 'Practice', library: 'Resource library', glossary: 'Glossary' };
    document.getElementById('breadcrumb').innerHTML = `Your course <span>/</span> ${names[page] || 'Overview'}`;
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === (page === 'module' ? 'roadmap' : page === 'lessons' ? 'lesson' : page)) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    ({ overview, practical: () => window.CV_PRACTICAL.render(main, arg, state, notes), roadmap: () => roadmap(arg === 'week' ? Number(sub) : 1, arg === 'week'), cinema: () => cinema(arg), lessons: allLessons, module: () => modulePage(Number(arg)), lesson: () => lessonPage(Number(arg) || 1, sub), explore: () => explore(arg), practice: () => practice(arg), library, glossary: () => glossaryPage(arg) }[page] || overview)();
    window.CV_TUTOR.renderMath(main);
    updateProgress(); closeNav(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {} });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { const lab = main.querySelector('[data-lab]'); if (lab && !window.CV_VISION_LABS.names[lab.dataset.lab]) { if (window.CV_LABS.names[lab.dataset.lab]) window.CV_LABS.refresh(); else updateLab(lab.dataset.lab); } }, 80); });
  if (!storageAvailable) document.getElementById('save-status').textContent = 'Progress saving unavailable';
  route();
  document.getElementById('reload-course').addEventListener('click',()=>{save();location.reload();});
})();
