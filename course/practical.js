/* Practical labs share the course's notes, sessions and progress backup. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const labs = window.CV_PRACTICAL_DATA;
  const key = (lab, i) => `practical-${lab.id}-${i}`;
  const lessonLink = id => `<a href="#lesson/${id}">${id}</a>`;
  // The weekly plan places every lab; the course data may be absent when this file runs in the validator.
  const weekOf = lab => { const index = window.CV_COURSE?.plan.findIndex(week => week.some(session => session.lab === lab.slug)) ?? -1; return index < 0 ? null : index + 1; };
  function render(main, slug, state, notes) {
    const lab = labs.find(item => item.slug === slug);
    const readiness = item => {
      const missing = item.requires.filter(id => !(state.completed || []).includes(id));
      return `<p class="practical-readiness${missing.length ? '' : ' ready'}">${missing.length ? `Still to do first: ${missing.map(id => `<a href="#lesson/${id}">Lesson ${String(id).padStart(2, '0')}</a>`).join(', ')}. You can read the guide now.` : 'You have finished the lessons this lab needs.'}</p>`;
    };
    const done = item => item.checks.filter((_, i) => state.sessions.includes(key(item, i))).length;
    const head = (title, description) => `<div class="page-head"><div class="eyebrow">PRACTICAL COMPUTER VISION</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
    const resources = `<div class="button-row"><a class="btn" href="practical/README.md" download>Setup guide ↓</a><a class="btn" href="capstone-template.md" download>Capstone report template ↓</a><a class="btn" href="#library">Back up your progress →</a></div>`;
    if (!lab) {
      const completed = labs.filter(item => done(item) === item.checks.length).length;
      main.innerHTML = head('From equations to working vision.', 'Twelve guided labs to prepare data, train models, inspect mistakes and use your results on new photographs.') +
        `<section class="panel practical-intro"><div><span class="pill">${completed} / ${labs.length} labs evidenced</span><h2>Build alongside the maths.</h2><p>Each lab has a place in the weekly plan, right after the lessons it needs. Labs 01–03 start with files, images and data; training begins after Lesson 41.</p><p class="muted">Run the commands in installed Python from the repository root. CPU is the default. Initial datasets and pretrained weights need internet; the readings work offline. Allow about 35–55 hours plus training time.</p><a class="btn btn-primary" href="#practical/setup">Start your local lab →</a></div><ol class="practical-path"><li><strong>Prepare</strong><span>Pixels, labels and independent splits</span></li><li><strong>Train</strong><span>Baselines, gradients and pretrained features</span></li><li><strong>Evaluate</strong><span>Metrics, controlled comparisons and failures</span></li><li><strong>Use</strong><span>Saved models, new inputs and reproducible evidence</span></li></ol></section>` + resources +
        `<div class="practical-grid">${labs.map(item => `<a class="panel practical-card" href="#practical/${item.slug}"><div class="eyebrow">LAB ${item.id} · ${esc(item.stage)}${weekOf(item) ? ` · WEEK ${weekOf(item)}` : ''}</div><h2>${esc(item.title)}</h2><p>${esc(item.summary)}</p><div class="practical-meta"><span>${esc(item.time)}</span><span>${done(item)} / ${item.checks.length} checks</span></div><span class="text-link">Open lab →</span></a>`).join('')}</div>`;
      return;
    }
    const index = labs.indexOf(lab);
    main.innerHTML = `<a class="text-link" href="#practical">← All practical labs</a>` + head(`Lab ${lab.id} · ${lab.title}`, lab.summary) +
      `<div class="practical-meta"><span>${esc(lab.time)} · ${esc(lab.stage)}</span><span>Do these lessons first: ${lab.requires.map(lessonLink).join(', ')}</span>${lab.related.length ? `<span>Related: ${lab.related.map(lessonLink).join(', ')}</span>` : ''}${weekOf(lab) ? `<span>Planned for week ${weekOf(lab)}</span>` : ''}</div>${readiness(lab)}` +
      `<article class="panel practical-reading">${lab.html}</article><section class="panel practical-evidence"><h2>Evidence checklist</h2><p>Mark these when you can show the result and explain it. These checks record your assessment; they do not run or grade the Python project.</p>${lab.checks.map((check,i) => `<label class="plan-session ${state.sessions.includes(key(lab,i))?'done':''}"><input type="checkbox" data-session="${key(lab,i)}" ${state.sessions.includes(key(lab,i))?'checked':''}><span>${esc(check)}</span></label>`).join('')}</section>` +
      notes(`practical-${lab.id}`, 'Your experiment notes, results and questions') +
      `<div class="button-row"><a class="btn" href="practical/${lab.file}" download>Download lab guide ↓</a>${index ? `<a class="btn" href="#practical/${labs[index-1].slug}">← Previous lab</a>` : ''}${index < labs.length-1 ? `<a class="btn btn-primary" href="#practical/${labs[index+1].slug}">Next lab →</a>` : '<a class="btn" href="capstone-template.md" download>Capstone report template ↓</a>'}</div>`;
  }
  window.CV_PRACTICAL = { render };
})();
