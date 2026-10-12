"""Connect authored continuation to the existing offline learning page."""
from pathlib import Path
base=Path(__file__).resolve().parent
path=base/'app.js'
text=path.read_text(encoding='utf-8')
if 'function allLessons()' in text:
    print('The webpage is already upgraded; no changes made.')
    raise SystemExit(0)
text=text.replace('n >= 1 && n <= 4','course.lessons.some(l => l.id === n)')
text=text.replace('`${state.completed.length} / 4`','`${state.completed.length} / ${course.lessons.length}`')
text=text.replace("document.getElementById('sidebar-progress').value = state.completed.length;", "document.getElementById('sidebar-progress').max = course.lessons.length;\n    document.getElementById('sidebar-progress').value = state.completed.length;")
text=text.replace('function lessonRows() {','function lessonRows(moduleId = 1) {')
text=text.replace('return course.lessons.map(lesson =>', 'return course.lessons.filter(lesson => lesson.module === moduleId).map(lesson =>',1)
text=text.replace('<span><strong>4</strong> lessons ready · 48 planned</span>', '<span><strong>${course.lessons.length}</strong> lessons ready</span>')
text=text.replace('${state.completed.length} / 4 LESSONS COMPLETE','${state.completed.filter(n => n <= 4).length} / 4 FOUNDATION LESSONS COMPLETE')
text=text.replace('Twelve modules, each with four planned lessons, a practical experiment and a mastery check. The first four full lessons are ready; later lessons will develop as we work through the course.', 'Twelve modules with four authored lessons each, worked practice, interactive experiments and a mastery check. Follow the sequence and use the checkpoints to set your pace.')
text=text.replace("m.n === 1 ? '4 full lessons ready' : 'Planned'", "'4 lessons ready'")
text=text.replace("state.ready.includes(m.n) ? '' : m.n === 1 ? ' pill-orange' : ' pill-plan'", "state.ready.includes(m.n) ? '' : ' pill-orange'")
old='${m.n === 1 ? lessonRows() : `<ol>${m.lessons.map(title => `<li>${escape(title.slice(3))} <span class="pill pill-plan">Planned</span></li>`).join(\'\')}</ol>`}'
assert old in text
text=text.replace(old,'${lessonRows(id)}')
text=text.replace('<p>${escape(m.artifact)}</p></section>', '<p>${escape(m.artifact)}</p><div class="resource-downloads">${course.notebooks.filter(nb => nb.modules.includes(id)).map(nb => `<a class="btn nb-link" href="${nb.href}" download>Module notebook ↓</a>`).join(\'\')}</div>${id === 12 ? `<a class="text-link" href="capstone-template.md" download>Capstone report template ↓</a>` : \'\'}</section>')
text=text.replace("const lesson = course.lessons.find(l => l.id === id);", "const lesson = course.lessons.find(l => l.id === id);")
text=text.replace('MODULE 01`, escape(lesson.title)', 'MODULE ${String(lesson.module).padStart(2, \'0\')}`, escape(lesson.title)')
text=text.replace("${id < 4 ? button('Next lesson', '#lesson/' + (id + 1)) : button('Module 2 plan', '#module/2')}", "${id > 1 ? button('Previous lesson', '#lesson/' + (id - 1)) : ''}${id < course.lessons.length ? button('Next lesson', '#lesson/' + (id + 1)) : button('Your capstone module', '#module/12')}")
text=text.replace("if (tab === 'explore') mountLab(lessonLab[id - 1], content);", "if (tab === 'explore') mountLab(lesson.lab || lessonLab[id - 1], content);")
text=text.replace("lesson.exercises, lessonSolutions[id - 1]", "lesson.exercises, lesson.solutions || lessonSolutions[id - 1]")
text=text.replace('${notes(\'lesson-\' + id)}</div>', '${notes(\'lesson-\' + id)}<div class="panel lesson-reading"><div class="eyebrow">YOUR READING COMPANIONS</div><p>${escape(lesson.reading)}</p>${bookLinks(lesson.reading)}${(course.companions[id] || []).map(item => `<a class="book-chip" href="${item.url}" target="_blank" rel="noopener">${escape(item.title)} ↗</a>`).join(\'\')}<div class="resource-downloads">${course.notebooks.filter(nb => nb.modules.includes(lesson.module)).map(nb => `<a class="btn nb-link" href="${nb.href}" download>Module notebook ↓</a>`).join(\'\')}</div></div></div>')
text=text.replace("const labNames = {", "const labNames = { ...window.CV_LABS.names,")
text=text.replace("function mountLab(name, target) {", "function mountLab(name, target) {\n    if (window.CV_LABS.names[name]) return window.CV_LABS.mount(name, target);")
text=text.replace('if (lab) updateLab(lab.dataset.lab);', 'if (lab) { if (window.CV_LABS.names[lab.dataset.lab]) window.CV_LABS.refresh(); else updateLab(lab.dataset.lab); }')
start=text.index('  function plan(week = 1) {')
end=text.index('  function library() {',start)
text=text[:start]+'''  function allLessons() {
    main.innerHTML = header('YOUR LESSON LIBRARY', 'A connected course, ready to study.', 'All 48 lessons have explanations, practice and checkpoints. Use the roadmap sequence; you can revisit any lesson at any time.') +
      `<div class="lesson-filters"><label>Find a topic<input type="search" id="lesson-search" placeholder="Try vectors, gradient, IoU…"></label><label>Module<select id="lesson-module"><option value="0">All modules</option>${course.modules.map(m => `<option value="${m.n}">${String(m.n).padStart(2,'0')} · ${escape(m.title)}</option>`).join('')}</select></label></div><div id="lesson-index-results"></div>`;
    const render = () => {
      const query = document.getElementById('lesson-search').value.trim().toLowerCase();
      const module = Number(document.getElementById('lesson-module').value);
      const matches = course.lessons.filter(l => (!module || l.module === module) && (l.title + ' ' + (l.goal || '')).toLowerCase().includes(query));
      document.getElementById('lesson-index-results').innerHTML = matches.length ? course.modules.filter(m => matches.some(l => l.module === m.n)).map(m => `<section class="panel lesson-index-group"><div class="section-heading"><h2>${String(m.n).padStart(2,'0')} · ${escape(m.title)}</h2><a class="text-link" href="#module/${m.n}">Module guide ↗</a></div>${matches.filter(l => l.module === m.n).map(l => `<a class="lesson-row" href="#lesson/${l.id}"><span class="lesson-index">${state.completed.includes(l.id) ? '✓' : String(l.id).padStart(2,'0')}</span><div><div class="lesson-title">${escape(l.title)}</div><div class="lesson-meta">90 min · Read + explore + practice</div></div><span class="row-arrow">↗</span></a>`).join('')}</section>`).join('') : '<p role="status">No lessons match that topic. Try a shorter search.</p>';
    };
    document.getElementById('lesson-search').addEventListener('input',render);document.getElementById('lesson-module').addEventListener('change',render);render();
  }
  function plan(week = 1) {
    if (!Number.isInteger(week) || week < 1 || week > course.plan.length) week = 1;
    main.innerHTML = header('YOUR STUDY RHYTHM', 'Make room for understanding.', 'Eight core hours each week, plus up to two for review. The 24-week plan is flexible; use the mastery checks to set your pace.') +
      `<div class="study-week-picker"><label for="study-week">Choose your week</label><select id="study-week">${course.plan.map((_,i) => `<option value="${i+1}"${week === i+1 ? ' selected' : ''}>Week ${i+1} · Module ${Math.floor(i/2)+1}</option>`).join('')}</select></div><section class="panel"><div class="section-heading"><h2>Week ${week}</h2><span class="pill pill-orange">8 hours · 6 sessions</span></div>${course.plan[week - 1].map((session, i) => { const id = `${week}-${i}`; return `<label class="plan-session${state.sessions.includes(id) ? ' done' : ''}"><input type="checkbox" data-session="${id}"${state.sessions.includes(id) ? ' checked' : ''}><span class="session-time">${session.minutes} min</span><span><span class="session-task">${escape(session.task)}</span><span class="session-evidence" style="display:block">Evidence: ${escape(session.evidence)}</span></span></label>`; }).join('')}</section><p class="explore-note">Revisit an idea when it needs more time. A completed session records practice; explaining the idea and solving a new example checks mastery.</p>${notes('week-' + week, 'This week’s questions & things to revisit')}`;
    document.getElementById('study-week').addEventListener('change',event => { location.hash='#plan/'+event.target.value; });
  }
''' +text[end:]
text=text.replace('Printable course guide ↗', 'Original roadmap & foundations guide ↗')
text=text.replace('Worked solutions ↓', 'Foundation solutions ↓')
text=text.replace('<button class="btn" id="export-progress"', '<a class="btn" href="later-solutions.md" download>Lessons 05–48 solutions ↓</a><a class="btn" href="capstone-template.md" download>Capstone template ↓</a><button class="btn" id="export-progress"')
text=text.replace('<div class="library-extras"><h3>Optional companions</h3>', '<div class="library-extras"><h2>Five runnable notebooks</h2><div class="resource-downloads">${course.notebooks.map(nb => `<a class="btn nb-link" href="${nb.href}" download>${escape(nb.title)} ↓</a>`).join(\'\')}</div><p class="small muted" style="margin-top:12px">Python 3 and NumPy. Start at the module you are studying; the notebooks include demonstrations and experiment prompts.</p></div><div class="library-extras"><h3>Optional companions</h3>')
text=text.replace("lesson: 'Your lessons',", "lessons: 'Your lessons', lesson: 'Your lesson',")
text=text.replace("(page === 'module' ? 'roadmap' : page)", "(page === 'module' ? 'roadmap' : page === 'lessons' ? 'lesson' : page)")
text=text.replace('({ overview, roadmap, module:', '({ overview, roadmap, lessons: allLessons, module:')
path.write_text(text,encoding='utf-8')
html_path=base/'index.html'
html=html_path.read_text(encoding='utf-8').replace('<script src="app.js" defer>', '<script src="advanced-labs.js" defer></script>\n  <script src="app.js" defer>')
html=html.replace('href="#lesson/1" data-nav="lesson"','href="#lessons" data-nav="lesson"').replace('Available lessons','Course lessons').replace('0 / 4','0 / 48').replace('max="4"','max="48"')
html_path.write_text(html,encoding='utf-8')
print('Connected all lessons, 24 study weeks, reading links and notebooks.')
