/* Auto-checked practice: seeded question generators, answer checking, spaced review, an error log and module checkpoints.
 *
 * Question banks call CV_PRACTICE.add(lessonId, generators). Each generator is
 *   { key: 'stable-id', skill: 'Short description', make(r) { return question; } }
 * where r is a seeded random source (r.int, r.real, r.pick, r.nonzero, r.shuffle, r.bool, r.sign) and the question is
 *   { prompt, answers: [answer...], hint, solution }
 * Prompts, hints and solutions are plain text and may contain TeX between \( and \). An answer is one of
 *   { label, value, tol?, rel? }          a number; typed answers may be expressions such as 2/3, ln(3) or sqrt(2)/2
 *   { label, vector: [...], tol?, rel? }  an ordered list, typed as 0.2, -0.3, 0.1 or (8, 3) or 8x3
 *   { label, choices: [...], correct }    one choice from a short list
 * Numbers are accepted when |typed - value| <= max(tol, rel * |value|). Without tol the defaults are tol 0.01 and rel 0.005; with an
 * explicit tol, rel defaults to 0. Use tol: 0 for exact integers, and an explicit tol for answers smaller than about 0.05.
 */
(() => {
  'use strict';
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const INTERVALS = [0, 1, 3, 7, 16, 35];  // days until the next review for Leitner boxes 1-5
  const MAX_ERRORS = 150, REVIEW_SIZE = 12, CHECKPOINT_SIZE = 5, CHECKPOINT_PASS = 4;

  /* ---------- Seeded randomness ---------- */
  function makeRng(seed) {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const r = {
      seed, next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      real: (lo, hi, dp = 1) => Number((lo + next() * (hi - lo)).toFixed(dp)),
      pick: list => list[Math.floor(next() * list.length)],
      bool: (p = .5) => next() < p,
      sign: () => next() < .5 ? -1 : 1,
      shuffle: list => { const out = list.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; },
    };
    r.nonzero = (lo, hi) => { let v = 0; while (v === 0) v = r.int(lo, hi); return v; };
    r.distinct = (count, lo, hi) => { const seen = new Set(); while (seen.size < count) seen.add(r.int(lo, hi)); return [...seen]; };
    return r;
  }
  const freshSeed = () => (Math.random() * 4294967296) >>> 0;

  /* ---------- Question bank ---------- */
  const bank = {};
  function add(lessonId, generators) {
    bank[lessonId] = (bank[lessonId] || []).concat(generators.map(g => ({...g, lesson: lessonId, id: `${lessonId}:${g.key}`})));
  }
  const generator = id => { const lesson = Number(String(id).split(':')[0]); return (bank[lesson] || []).find(g => g.id === id); };
  function instance(gen, seed = freshSeed()) {
    const q = gen.make(makeRng(seed));
    return {...q, gen, seed};
  }

  /* ---------- Answer parsing ---------- */
  // A small recursive-descent parser for typed answers. It never evaluates code.
  const FUNCS = {ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, atan: Math.atan, asin: Math.asin, acos: Math.acos};
  const CONSTS = {pi: Math.PI, e: Math.E, inf: Infinity};
  function parseExpression(text) {
    const src = String(text).trim().toLowerCase().replace(/[−–]/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/\*\*/g, '^').replace(/,(?=\d{3}\b)/g, '');
    if (!src) throw Error('empty');
    const tokens = src.match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+\d*|[()+\-*/^%]|\S/g) || [];
    let i = 0;
    const peek = () => tokens[i], take = () => tokens[i++];
    const isNum = t => /^\d*\.?\d+(?:e[+-]?\d+)?$/.test(t ?? '');
    const startsFactor = t => t !== undefined && (isNum(t) || /^[a-z]/.test(t) || t === '(');
    function primary() {
      const t = take();
      if (t === undefined) throw Error('incomplete');
      if (isNum(t)) return Number(t);
      if (t === '(') { const v = sum(); if (take() !== ')') throw Error('bracket'); return v; }
      if (t === '-') return -power();
      if (t === '+') return power();
      if (FUNCS[t]) { const arg = peek() === '(' ? primary() : power(); return FUNCS[t](arg); }
      if (t in CONSTS) return CONSTS[t];
      const joined = /^([a-z]+?)(\d+)$/.exec(t);  // ln3 means ln(3); log10 and log2 were matched above
      if (joined && FUNCS[joined[1]]) return FUNCS[joined[1]](Number(joined[2]));
      throw Error('symbol ' + t);
    }
    function power() { const base = primary(); if (peek() === '^') { take(); return base ** unary(); } if (peek() === '%') { take(); return base / 100; } return base; }
    function unary() { if (peek() === '-') { take(); return -unary(); } if (peek() === '+') { take(); return unary(); } return power(); }
    function product() {
      let v = unary();
      for (;;) {
        if (peek() === '*') { take(); v *= unary(); }
        else if (peek() === '/') { take(); v /= unary(); }
        else if (startsFactor(peek())) v *= unary();  // implicit multiplication: 2pi, 3ln(2)
        else return v;
      }
    }
    function sum() { let v = product(); while (peek() === '+' || peek() === '-') v = take() === '+' ? v + product() : v - product(); return v; }
    const value = sum();
    if (i < tokens.length) throw Error('unexpected ' + tokens[i]);
    return value;
  }
  function parseList(text) {
    let src = String(text).trim().replace(/^[[(]|[\])]$/g, '').trim();
    if (!src) throw Error('empty');
    let parts;
    if (/[,;]/.test(src)) parts = src.split(/[,;]/);
    else if (/^\s*\d+\s*[x×]\s*\d+(?:\s*[x×]\s*\d+)*\s*$/i.test(src)) parts = src.split(/[x×]/i);
    else parts = src.split(/\s+/);
    return parts.map(p => parseExpression(p));
  }
  const close = (typed, expected, spec) => {
    // An explicit tol is taken literally; only the default tolerance adds a relative allowance for large values.
    const tol = spec.tol ?? .01, rel = spec.rel ?? (spec.tol === undefined ? .005 : 0);
    return Math.abs(typed - expected) <= Math.max(tol === 0 ? 1e-9 : tol, rel * Math.abs(expected));
  };
  function checkAnswer(spec, raw) {
    if (spec.choices) return raw === '' || raw === undefined ? {empty: true} : {ok: Number(raw) === spec.correct};
    if (String(raw ?? '').trim() === '') return {empty: true};
    try {
      if (spec.vector) {
        const typed = parseList(raw);
        if (typed.length !== spec.vector.length) return {ok: false, note: `Enter ${spec.vector.length} values separated by commas.`};
        return {ok: typed.every((v, i) => Number.isFinite(v) && close(v, spec.vector[i], spec))};
      }
      const typed = parseExpression(raw);
      if (!Number.isFinite(typed)) return {ok: false, note: 'That expression does not give a finite number.'};
      return {ok: close(typed, spec.value, spec)};
    } catch {
      return {invalid: true, note: 'Use a number or a simple expression such as 2/3, ln(3) or sqrt(2)/2.'};
    }
  }
  const fmtNumber = v => { if (!Number.isFinite(v)) return String(v); const r = Number(v.toPrecision(6)); return Math.abs(r) >= 1e6 || (r !== 0 && Math.abs(r) < 1e-4) ? r.toExponential(3) : String(r); };
  const expectedText = spec => spec.choices ? spec.choices[spec.correct] : spec.vector ? `(${spec.vector.map(fmtNumber).join(', ')})` : fmtNumber(spec.value);

  /* ---------- Scheduling and records ---------- */
  let host = null;  // {getState, save, course}
  const S = () => host.getState();
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const addDays = (iso, days) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(y, m - 1, d + days); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
  const daysUntil = iso => { const [y, m, d] = iso.split('-').map(Number), [a, b, c] = today().split('-').map(Number); return Math.round((new Date(y, m - 1, d) - new Date(a, b - 1, c)) / 864e5); };
  function record(q, ok, given, context = 'practice') {
    const state = S(), id = q.gen.id, rec = state.practice[id] || {box: 0, right: 0, wrong: 0};
    rec.box = ok ? Math.min(5, Math.max(1, rec.box + 1)) : 1;
    rec.due = addDays(today(), INTERVALS[rec.box]);
    rec.last = today();
    ok ? rec.right++ : rec.wrong++;
    state.practice[id] = rec;
    if (!ok) {
      state.errors.unshift({item: id, lesson: q.gen.lesson, seed: q.seed, skill: q.gen.skill, prompt: q.prompt, given: given.slice(0, 200), expected: q.answers.map(a => `${a.label ? stripTex(a.label) + ': ' : ''}${expectedText(a)}`).join('; '), date: today(), context});
      state.errors.length = Math.min(state.errors.length, MAX_ERRORS);
    }
    host.save();
  }
  const stripTex = s => String(s).replace(/\\\(|\\\)/g, '');
  function dueItems() {
    const state = S(), now = today();
    return Object.entries(state.practice).filter(([id, rec]) => generator(id) && rec.due && rec.due <= now).sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box).map(([id]) => id);
  }
  // Avoid two questions from the same lesson in a row where possible.
  function interleave(ids) {
    const out = [], pool = ids.slice();
    while (pool.length) {
      const prev = out.at(-1)?.split(':')[0];
      const k = pool.findIndex(id => id.split(':')[0] !== prev);
      out.push(pool.splice(k < 0 ? 0 : k, 1)[0]);
    }
    return out;
  }
  function practiseAhead() {
    const state = S(), lessons = new Set([...state.completed, ...Object.keys(state.practice).map(id => Number(id.split(':')[0]))]);
    const ids = Object.values(bank).flat().filter(g => lessons.has(g.lesson)).map(g => g.id);
    return interleave(ids.sort((a, b) => (state.practice[a]?.box ?? 0) - (state.practice[b]?.box ?? 0) || (state.practice[a]?.due ?? '').localeCompare(state.practice[b]?.due ?? '')).slice(0, REVIEW_SIZE));
  }
  const lessonTitle = id => host.course.lessons.find(l => l.id === id)?.title ?? `Lesson ${id}`;

  /* ---------- One question card ---------- */
  function cardMarkup(q, {mode = 'practice', index, total} = {}) {
    const rec = S().practice[q.gen.id];
    const status = rec ? `Review box ${rec.box} of 5 · ${daysUntil(rec.due) <= 0 ? 'due now' : `next in ${daysUntil(rec.due)} day${daysUntil(rec.due) === 1 ? '' : 's'}`}` : 'New question type';
    const fields = q.answers.map((a, i) => a.choices
      ? `<fieldset class="pq-choices"><legend>${E(a.label || 'Choose one')}</legend>${a.choices.map((c, j) => `<label><input type="radio" name="pq-${q.gen.id}-${q.seed}-${i}" value="${j}" data-answer="${i}"><span>${E(c)}</span></label>`).join('')}</fieldset>`
      : `<label class="pq-field"><span class="pq-label">${E(a.label || 'Answer')}</span><input type="text" inputmode="text" autocomplete="off" spellcheck="false" data-answer="${i}" placeholder="${a.vector ? 'e.g. 0.2, -0.3, 0.1' : 'number or expression'}" aria-label="${E(stripTex(a.label || 'Answer'))}"></label>`).join('');
    const where = mode === 'practice' ? '' : `<a class="pq-lesson" href="#lesson/${q.gen.lesson}">Lesson ${String(q.gen.lesson).padStart(2, '0')} · ${E(lessonTitle(q.gen.lesson))}</a>`;
    return `<article class="pq-card" data-mode="${mode}"><div class="pq-meta"><span>${index !== undefined ? `QUESTION ${index + 1} OF ${total} · ` : ''}${E(q.gen.skill)}</span><span class="pq-status">${mode === 'checkpoint' ? 'Checkpoint · no hints' : E(status)}</span></div>${where}<p class="pq-prompt">${E(q.prompt)}</p><div class="pq-fields">${fields}</div><div class="pq-actions"><button type="button" class="btn btn-primary pq-check">Check</button>${mode === 'checkpoint' ? '' : '<button type="button" class="btn pq-hint-btn">Hint</button>'}<button type="button" class="btn pq-reveal">Show solution</button>${mode === 'practice' ? '<button type="button" class="btn pq-new">New numbers ↻</button>' : ''}</div><div class="pq-feedback" role="status" aria-live="polite"></div><div class="pq-hint" hidden><strong>Hint.</strong> ${E(q.hint || 'Write the definition first, then substitute the numbers one step at a time.')}</div><div class="pq-solution" hidden><strong>Worked solution.</strong> ${E(q.solution || '')}<p class="pq-expected">${q.answers.map(a => `${a.label ? E(a.label) + ': ' : ''}<b>${E(expectedText(a))}</b>`).join(' · ')}</p></div></article>`;
  }
  // Mount a card. onDone(ok) fires after the first check or a reveal; only that first attempt is scheduled.
  function mountCard(el, q, {mode = 'practice', onDone, onNew} = {}) {
    const render = window.CV_TUTOR?.renderMath || (() => {});
    render(el);
    let attempts = 0, done = false;
    const inputs = () => [...el.querySelectorAll('[data-answer]')];
    const values = () => q.answers.map((a, i) => a.choices ? (el.querySelector(`[data-answer="${i}"]:checked`)?.value ?? '') : el.querySelector(`[data-answer="${i}"]`).value);
    const feedback = el.querySelector('.pq-feedback');
    const reveal = () => { el.querySelector('.pq-solution').hidden = false; render(el.querySelector('.pq-solution')); };
    const finish = (ok, given) => {
      if (done) return; done = true;
      if (mode !== 'checkpoint') record(q, ok, given, mode);
      el.classList.add(ok ? 'pq-right' : 'pq-wrong');
      onDone?.(ok, given);
    };
    el.querySelector('.pq-check').addEventListener('click', () => {
      const typed = values(), results = q.answers.map((a, i) => checkAnswer(a, typed[i]));
      if (results.some(r => r.empty)) { feedback.className = 'pq-feedback'; feedback.textContent = 'Enter an answer in every box first.'; return; }
      const invalid = results.find(r => r.invalid || r.note);
      const ok = results.every(r => r.ok);
      attempts++;
      inputs().forEach(input => { const i = Number(input.dataset.answer); if (!q.answers[i].choices) input.setAttribute('aria-invalid', String(!results[i].ok)); });
      if (ok) {
        feedback.className = 'pq-feedback success';
        feedback.textContent = attempts === 1 ? '✓ Correct on the first try.' : '✓ Correct now. This counts as a miss for scheduling, so it will come back sooner.';
        reveal();
      } else {
        feedback.className = 'pq-feedback incorrect';
        const wrongParts = q.answers.length > 1 ? ` (${results.filter(r => !r.ok).length} of ${q.answers.length} not yet right)` : '';
        feedback.textContent = (invalid?.note ? invalid.note + ' ' : '') + (mode === 'checkpoint' ? `Not this time${wrongParts}. The solution is below.` : attempts === 1 ? `Not yet${wrongParts}. Check one step, use the hint, then try again.` : `Still not matching${wrongParts}. Compare with the worked solution.`);
        if (mode !== 'checkpoint') { el.querySelector('.pq-hint').hidden = false; render(el.querySelector('.pq-hint')); }
        if (mode === 'checkpoint' || attempts >= 2) reveal();
      }
      if (attempts === 1 || ok) finish(ok && attempts === 1, typed.map((v, i) => q.answers[i].choices ? q.answers[i].choices[Number(v)] ?? '' : v).join('; '));
      if (mode === 'checkpoint') { el.querySelector('.pq-check').disabled = true; inputs().forEach(i => i.disabled = true); }
    });
    el.querySelector('.pq-hint-btn')?.addEventListener('click', () => { el.querySelector('.pq-hint').hidden = false; render(el.querySelector('.pq-hint')); });
    el.querySelector('.pq-reveal').addEventListener('click', () => {
      reveal();
      if (!done) { feedback.className = 'pq-feedback'; feedback.textContent = 'Solution shown before a check. This question will come back tomorrow.'; finish(false, '(solution viewed)'); }
      if (mode === 'checkpoint') { el.querySelector('.pq-check').disabled = true; inputs().forEach(i => i.disabled = true); }
    });
    el.querySelector('.pq-new')?.addEventListener('click', () => onNew?.());
    el.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('input[type="text"]')) { event.preventDefault(); el.querySelector('.pq-check').click(); } });
  }

  /* ---------- Lesson practice tab ---------- */
  function lessonMarkup(id) {
    const gens = bank[id] || [];
    if (!gens.length) return '';
    return `<section class="pq-section" data-pq-lesson="${id}"><div class="section-heading"><div><div class="eyebrow">FRESH PRACTICE · CHECKED INSTANTLY</div><h2>New numbers every time</h2></div><span class="pill">${gens.length} question types</span></div><p class="muted small">Type a number or an expression such as <code>2/3</code>, <code>ln(3)</code> or <code>sqrt(2)/2</code>. Your first attempt on each question sets when it returns in your review queue. Correct answers return later; misses return tomorrow and go to your error log.</p><div class="pq-list">${gens.map((g, i) => `<div class="pq-slot" data-slot="${i}"></div>`).join('')}</div></section>`;
  }
  function mountLesson(root, id) {
    const section = root.querySelector(`[data-pq-lesson="${id}"]`);
    if (!section) return;
    (bank[id] || []).forEach((gen, i) => {
      const slot = section.querySelector(`[data-slot="${i}"]`);
      const show = () => { const q = instance(gen); slot.innerHTML = cardMarkup(q); mountCard(slot.firstElementChild, q, {onNew: show}); };
      show();
    });
  }

  /* ---------- Review session, error log and progress (Practice page) ---------- */
  function practiceMarkup() {
    const state = S(), due = dueItems(), tracked = Object.keys(state.practice).filter(generator).length;
    const boxes = [1, 2, 3, 4, 5].map(b => Object.entries(state.practice).filter(([id, r]) => generator(id) && r.box === b).length);
    const total = Object.values(bank).flat().length;
    return `<section class="panel pq-review-panel" id="review"><div class="section-heading"><div><div class="eyebrow">SPACED REVIEW</div><h2>${due.length ? `${due.length} question${due.length === 1 ? '' : 's'} due today` : tracked ? 'Nothing due today' : 'Your review queue starts here'}</h2></div>${due.length ? '<span class="pill pill-orange">Due</span>' : ''}</div><p class="muted">${tracked ? 'Questions return on a widening schedule: tomorrow after a miss, then 3, 7, 16 and 35 days as you keep answering correctly. Each review uses new numbers.' : 'Answer the fresh practice questions in any lesson. Each question type you try joins this queue and comes back on a schedule that adapts to your answers.'}</p><div class="pq-boxes" aria-label="Question types by review box">${boxes.map((n, i) => `<div><b>${n}</b><span>Box ${i + 1}</span></div>`).join('')}<div><b>${total - tracked}</b><span>Not tried</span></div></div><div class="button-row">${due.length ? `<a class="btn btn-primary" href="#practice/review">Start today’s review (${Math.min(due.length, REVIEW_SIZE)}) →</a>` : ''}${tracked || state.completed.length ? `<a class="btn" href="#practice/ahead">Practise ahead · mixed questions →</a>` : `<a class="btn btn-primary" href="#lesson/1/practice">Try Lesson 01 practice →</a>`}</div></section>
      <section class="panel pq-errors" id="errors"><div class="section-heading"><div><div class="eyebrow">YOUR ERROR LOG</div><h2>${state.errors.length ? 'Mistakes worth revisiting' : 'No mistakes recorded yet'}</h2></div>${state.errors.length ? `<span class="pill">${state.errors.length} recorded</span>` : ''}</div><p class="muted small">Missed first attempts and checkpoint misses are recorded automatically. Try a similar question; when you understand the mistake, remove it from the log.</p>${state.errors.slice(0, 25).map((e, i) => `<div class="pq-error"><div class="pq-error-head"><a href="#lesson/${e.lesson}/practice">Lesson ${String(e.lesson).padStart(2, '0')} · ${E(e.skill)}</a><span>${E(e.date)}${e.context === 'checkpoint' ? ' · checkpoint' : ''}</span></div><p class="pq-error-prompt">${E(e.prompt)}</p><p class="small"><span class="incorrect">You wrote: ${E(e.given || '—')}</span> · <span class="success">Expected: ${E(e.expected)}</span></p><div class="button-row"><button type="button" class="btn" data-retry="${i}">Try a similar question</button><button type="button" class="btn" data-forget="${i}">I understand this now ✓</button></div><div class="pq-retry" data-retry-slot="${i}"></div></div>`).join('')}${state.errors.length > 25 ? `<p class="small muted">Showing the 25 most recent of ${state.errors.length}.</p>` : ''}</section>`;
  }
  function mountPractice(root) {
    root.querySelectorAll('[data-retry]').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.retry), e = S().errors[i], gen = generator(e?.item), slot = root.querySelector(`[data-retry-slot="${i}"]`);
      if (!gen) { slot.textContent = 'This question type is no longer available.'; return; }
      const q = instance(gen); slot.innerHTML = cardMarkup(q, {mode: 'review'}); mountCard(slot.firstElementChild, q, {mode: 'review'});
      slot.querySelector('input')?.focus();
    }));
    root.querySelectorAll('[data-forget]').forEach(b => b.addEventListener('click', () => {
      S().errors.splice(Number(b.dataset.forget), 1); host.save(); host.rerender();
    }));
  }
  function sessionMarkup(kind) {
    return `<section class="panel pq-session" data-session="${kind}"><div class="section-heading"><div><div class="eyebrow">${kind === 'review' ? 'TODAY’S REVIEW' : 'PRACTISE AHEAD'}</div><h2>${kind === 'review' ? 'Recall it with new numbers' : 'Mixed questions from your lessons'}</h2></div><a class="text-link" href="#practice">Back to practice ↗</a></div><progress class="pq-progress" max="1" value="0"></progress><div class="pq-stage"></div></section>`;
  }
  function mountSession(root, kind) {
    const section = root.querySelector('.pq-session');
    const ids = kind === 'review' ? interleave(dueItems()).slice(0, REVIEW_SIZE) : practiseAhead();
    const stage = section.querySelector('.pq-stage'), bar = section.querySelector('.pq-progress');
    if (!ids.length) { stage.innerHTML = `<p>${kind === 'review' ? 'Nothing is due. Come back tomorrow, or practise ahead.' : 'Complete or practise a lesson first; its questions then appear here.'}</p><div class="button-row"><a class="btn" href="#practice">Back to practice</a></div>`; return; }
    bar.max = ids.length;
    let at = 0, right = 0;
    const next = () => {
      bar.value = at;
      if (at >= ids.length) {
        const due = dueItems().length;
        stage.innerHTML = `<div class="pq-summary"><h3>${right} of ${ids.length} correct on the first try</h3><p>${right === ids.length ? 'Every item moves to a longer interval.' : 'Missed items return tomorrow and are in your error log.'} ${due ? `${due} question${due === 1 ? ' is' : 's are'} still due.` : 'Nothing else is due today.'}</p><div class="button-row">${due ? `<a class="btn btn-primary" href="#practice/review" data-again>Continue reviewing →</a>` : ''}<a class="btn" href="#practice">Back to practice</a></div></div>`;
        stage.querySelector('[data-again]')?.addEventListener('click', e => { e.preventDefault(); mountSession(root, 'review'); });
        return;
      }
      const q = instance(generator(ids[at]));
      stage.innerHTML = cardMarkup(q, {mode: 'review', index: at, total: ids.length}) + '<div class="button-row pq-next-row" hidden><button type="button" class="btn btn-primary pq-next">Next question →</button></div>';
      mountCard(stage.firstElementChild, q, {mode: 'review', onDone: ok => { if (ok) right++; const row = stage.querySelector('.pq-next-row'); row.hidden = false; }});
      stage.querySelector('.pq-next').addEventListener('click', () => { at++; next(); stage.querySelector('input')?.focus(); });
      stage.querySelector('input')?.focus({preventScroll: true});
    };
    next();
  }

  /* ---------- Module checkpoint ---------- */
  function moduleGenerators(moduleN) {
    return host.course.lessons.filter(l => l.module === moduleN).map(l => bank[l.id] || []);
  }
  function checkpointMarkup(moduleN) {
    const groups = moduleGenerators(moduleN), available = groups.flat().length, rec = S().checkpoints[moduleN];
    if (!available) return '';
    return `<div class="pq-checkpoint" data-checkpoint="${moduleN}"><p class="small">Five fresh questions from this module’s lessons, with no hints. Pass with ${CHECKPOINT_PASS} of ${CHECKPOINT_SIZE} correct on the first try to mark the module ready. You can retake it any time with new numbers.</p>${rec ? `<p class="pq-checkpoint-record ${rec.passed ? 'success' : ''}">${rec.passed ? '✓ Passed' : 'Not passed yet'} · best ${rec.best}/${CHECKPOINT_SIZE} · last attempt ${E(rec.date)}</p>` : ''}<button type="button" class="btn btn-primary pq-start-checkpoint">${rec ? 'Retake the checkpoint' : 'Start the checkpoint'} →</button><div class="pq-checkpoint-stage"></div></div>`;
  }
  function mountCheckpoint(root, moduleN, onPass) {
    const box = root.querySelector(`[data-checkpoint="${moduleN}"]`);
    if (!box) return;
    box.querySelector('.pq-start-checkpoint').addEventListener('click', () => {
      const rng = makeRng(freshSeed()), groups = moduleGenerators(moduleN).filter(g => g.length).map(g => rng.shuffle(g));
      const chosen = [];
      for (let round = 0; chosen.length < CHECKPOINT_SIZE && groups.some(g => g.length > round); round++) {
        rng.shuffle(groups).forEach(g => { if (chosen.length < CHECKPOINT_SIZE && g[round]) chosen.push(g[round]); });
      }
      const stage = box.querySelector('.pq-checkpoint-stage');
      box.querySelector('.pq-start-checkpoint').hidden = true;
      let at = 0, right = 0;
      const misses = [];
      const next = () => {
        if (at >= chosen.length) {
          const state = S(), passed = right >= Math.min(CHECKPOINT_PASS, chosen.length - 1), old = state.checkpoints[moduleN];
          state.checkpoints[moduleN] = {best: Math.max(right, old?.best ?? 0), last: right, date: today(), passed: passed || !!old?.passed};
          misses.forEach(m => record(m.q, false, m.given, 'checkpoint'));
          const revisit = [...new Set(misses.map(m => m.q.gen.lesson))].map(id => host.course.lessons.find(l => l.id === id));
          const revisitList = revisit.length ? `<p class="pq-revisit-label">${passed ? 'Worth another look:' : 'Revisit these lessons first:'}</p><ul class="pq-revisit">${revisit.map(l => `<li><a class="text-link" href="#lesson/${l.id}">Lesson ${String(l.id).padStart(2, '0')} · ${E(l.title)}</a></li>`).join('')}</ul>` : '';
          if (passed) onPass?.();
          host.save();
          stage.innerHTML = `<div class="pq-summary"><h3>${right} of ${chosen.length} correct</h3><p>${passed ? 'Checkpoint passed. The module is marked ready, and Continue now moves past any unfinished lessons in it. They stay open.' : `You need ${CHECKPOINT_PASS} to pass. Missed questions are in your error log and return in tomorrow’s review.`}</p>${revisitList}<div class="button-row"><button type="button" class="btn${passed ? '' : ' btn-primary'}" data-retake>Retake with new numbers</button><a class="btn" href="#practice">Open your error log</a></div></div>`;
          stage.querySelector('[data-retake]').addEventListener('click', () => host.rerender());
          return;
        }
        const q = instance(chosen[at]);
        stage.innerHTML = cardMarkup(q, {mode: 'checkpoint', index: at, total: chosen.length}) + '<div class="button-row pq-next-row" hidden><button type="button" class="btn btn-primary pq-next">Next question →</button></div>';
        mountCard(stage.firstElementChild, q, {mode: 'checkpoint', onDone: (ok, given) => { if (ok) right++; else misses.push({q, given}); stage.querySelector('.pq-next-row').hidden = false; stage.querySelector('.pq-next').textContent = at + 1 < chosen.length ? 'Next question →' : 'See my result →'; }});
        stage.querySelector('.pq-next').addEventListener('click', () => { at++; next(); stage.querySelector('input')?.focus(); });
        stage.querySelector('input')?.focus({preventScroll: true});
      };
      next();
    });
  }

  /* ---------- Small summaries for other pages ---------- */
  const dueCount = () => host ? dueItems().length : 0;
  function lessonSummary(id) {
    const gens = bank[id] || [], recs = gens.map(g => S().practice[g.id]).filter(Boolean);
    return {total: gens.length, tried: recs.length, strong: recs.filter(r => r.box >= 3).length};
  }
  function init(options) { host = options; }

  window.CV_PRACTICE = {add, bank, makeRng, instance, generator, parseExpression, parseList, checkAnswer, expectedText, init,
    lessonMarkup, mountLesson, practiceMarkup, mountPractice, sessionMarkup, mountSession, checkpointMarkup, mountCheckpoint,
    dueCount, lessonSummary, today, addDays, INTERVALS, CHECKPOINT_PASS, CHECKPOINT_SIZE};
})();
