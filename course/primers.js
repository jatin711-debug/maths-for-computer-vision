/* Plain-language primers for the new ideas in each lesson, and the course glossary built from them.
 *
 * CV_PRIMER.add(lessonId, {
 *   builds:  [{lesson, why}],                       // earlier lessons this one relies on
 *   recall:  ['term-id', ...],                      // terms introduced earlier that this lesson uses again
 *   symbols: [[symbol, meaning, termId?], ...],     // optional clearer list for the "idea to keep" card
 *   terms: [{
 *     id, term, symbol?,                            // id: kebab-case, unique in the course; symbol: TeX
 *     plain,                                        // one or two sentences a beginner can read without the formula
 *     formula?,                                     // TeX shown as a display equation
 *     steps?: ['...'],                              // how to calculate it by hand
 *     examples?: [[input, result], ...],            // worked numbers (TeX allowed inside \( \))
 *     plot?: {fn: 'x => ...', x: [a, b], y: [c, d], xLabel, yLabel, marks: [x...]},
 *     pitfall?, seeAlso?: [lessonIds]
 *   }]
 * })
 * Text may contain \( inline \) and \[ display \] TeX; the page renders it with KaTeX.
 */
(() => {
  'use strict';
  const E = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pad = n => String(n).padStart(2, '0');
  const lessons = {};
  const terms = new Map();

  function add(lesson, spec) {
    lessons[lesson] = spec;
    (spec.terms || []).forEach(term => terms.set(term.id, {...term, lesson}));
  }
  const lessonTitle = id => window.CV_COURSE?.lessons.find(l => l.id === id)?.title || `Lesson ${pad(id)}`;

  function plot(spec, id) {
    const W = 340, H = 190, L = 44, R = 14, T = 14, B = 34;
    const f = new Function(`return (${spec.fn})`)();
    const [x0, x1] = spec.x, [y0, y1] = spec.y;
    const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
    const clampY = y => Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y));
    const pts = Array.from({length: 161}, (_, i) => x0 + (x1 - x0) * i / 160).map(x => [x, f(x)]).filter(([, y]) => Number.isFinite(y));
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(clampY(y)).toFixed(1)}`).join('');
    const nice = v => Math.abs(v) >= 100 ? v.toFixed(0) : Number(v.toFixed(3)).toString();
    const ticksX = [x0, (x0 + x1) / 2, x1], ticksY = [y0, (y0 + y1) / 2, y1];
    const zeroY = y0 < 0 && y1 > 0 ? `<line class="primer-axis" x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}"/>` : '';
    const zeroX = x0 < 0 && x1 > 0 ? `<line class="primer-axis" y1="${T}" y2="${H - B}" x1="${X(0)}" x2="${X(0)}"/>` : '';
    // Label each marked point on the side away from the curve: above-left of a rising curve, above-right of a falling one.
    const marks = (spec.marks || []).map(x => {
      const y = f(x);
      if (!(Number.isFinite(y) && y >= y0 && y <= y1)) return '';
      const px = X(x), py = Y(y), label = `(${nice(x)}, ${nice(y)})`, w = label.length * 5.8, h = (x1 - x0) / 400;
      const rising = f(x + h) >= f(x - h);
      const spots = {ul: [px - 8, py - 8, 'end'], ur: [px + 8, py - 8, 'start'], dr: [px + 8, py + 16, 'start'], dl: [px - 8, py + 16, 'end']};
      const fits = ([tx, ty, anchor]) => (anchor === 'end' ? tx - w >= L + 2 : tx + w <= W - R - 2) && ty - 10 >= T && ty <= H - B - 2;
      const [tx, ty, anchor] = (rising ? ['ul', 'dr', 'ur', 'dl'] : ['ur', 'dl', 'ul', 'dr']).map(k => spots[k]).find(fits) || spots[rising ? 'ul' : 'ur'];
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4"/><text class="primer-mark" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${label}</text>`;
    }).join('');
    return `<figure class="primer-plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="plot-${id}"><title id="plot-${id}">Graph of ${E(spec.yLabel || 'y')} against ${E(spec.xLabel || 'x')}</title>
      <rect class="primer-frame" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/>${zeroY}${zeroX}
      ${ticksX.map(v => `<text class="primer-tick" x="${X(v)}" y="${H - B + 15}" text-anchor="middle">${nice(v)}</text>`).join('')}
      ${ticksY.map(v => `<text class="primer-tick" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${nice(v)}</text>`).join('')}
      <text class="primer-label" x="${(L + W - R) / 2}" y="${H - 3}" text-anchor="middle">${E(spec.xLabel || 'x')}</text>
      <text class="primer-label" x="12" y="${(T + H - B) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(T + H - B) / 2})">${E(spec.yLabel || 'y')}</text>
      <path class="primer-curve" d="${d}"/>${marks}</svg></figure>`;
  }

  function card(term, {open = false, showLesson = false} = {}) {
    const body = [
      `<p class="primer-plain">${E(term.plain)}</p>`,
      term.formula ? `<div class="primer-formula">\\[${E(term.formula)}\\]</div>` : '',
      term.steps?.length ? `<div class="primer-steps"><h4>How to calculate it</h4><ol>${term.steps.map(s => `<li>${E(s)}</li>`).join('')}</ol></div>` : '',
      term.examples?.length ? `<table class="primer-examples"><thead><tr><th scope="col">Try</th><th scope="col">Result</th></tr></thead><tbody>${term.examples.map(([a, b]) => `<tr><td>${E(a)}</td><td>${E(b)}</td></tr>`).join('')}</tbody></table>` : '',
      term.plot ? plot(term.plot, term.id) : '',
      term.pitfall ? `<p class="primer-pitfall"><b>Watch out:</b> ${E(term.pitfall)}</p>` : '',
      showLesson || term.seeAlso?.length ? `<p class="primer-links">${showLesson ? `Introduced in <a href="#lesson/${term.lesson}">Lesson ${pad(term.lesson)}: ${E(lessonTitle(term.lesson))}</a>. ` : ''}${term.seeAlso?.length ? `Used again in ${term.seeAlso.map(n => `<a href="#lesson/${n}">Lesson ${pad(n)}</a>`).join(', ')}.` : ''}</p>` : ''
    ].join('');
    return `<details class="primer-term" id="term-${E(term.id)}" data-term="${E(term.id)}"${open ? ' open' : ''}><summary>${term.symbol ? `<span class="primer-symbol">\\(${E(term.symbol)}\\)</span>` : ''}<span class="primer-name">${E(term.term)}</span><span class="primer-toggle" aria-hidden="true"></span></summary><div class="primer-body">${body}</div></details>`;
  }

  function panel(lessonId) {
    const spec = lessons[lessonId];
    if (!spec?.terms?.length) return '';
    const n = spec.terms.length;
    const builds = (spec.builds || []).map(b => `<a class="primer-chip" href="#lesson/${b.lesson}"><b>Lesson ${pad(b.lesson)}</b> ${E(b.why)}</a>`).join('');
    const recall = (spec.recall || []).map(id => terms.get(id)).filter(Boolean).map(t => `<button type="button" class="primer-chip" data-recall="${E(t.id)}"><b>${E(t.term)}</b> Lesson ${pad(t.lesson)}</button>`).join('');
    return `<section class="primer" aria-labelledby="primer-head-${lessonId}">
      <div class="primer-intro"><div class="eyebrow">NEW IN THIS LESSON · IN PLAIN WORDS</div><h2 id="primer-head-${lessonId}">${n === 1 ? 'One new idea' : `${['', '', 'Two', 'Three', 'Four', 'Five', 'Six'][n] || n} new ideas`} to understand first</h2>
      <p>What each new term means and how to work it out by hand. Open one to see the steps and a worked example. The <button type="button" class="primer-jump" data-primer-jump>full reading</button> below explains them in more depth.</p></div>
      ${builds || recall ? `<div class="primer-context">${builds ? `<div><span class="primer-context-label">Builds on</span>${builds}</div>` : ''}${recall ? `<div><span class="primer-context-label">Recall</span>${recall}</div>` : ''}</div>` : ''}
      <div class="primer-terms">${spec.terms.map((t, i) => card({...t, lesson: lessonId}, {open: i === 0})).join('')}</div>
      <div class="primer-recall" hidden></div>
    </section>`;
  }

  // Wire the lesson panel: recall chips show an earlier term inline; symbol buttons open their term; the jump goes to the reading.
  function mount(root) {
    const section = root.querySelector('.primer');
    root.querySelectorAll('[data-primer-term]').forEach(button => button.addEventListener('click', () => {
      const target = root.querySelector(`#term-${CSS.escape(button.dataset.primerTerm)}`);
      if (!target) return;
      target.open = true;
      target.scrollIntoView({behavior: 'smooth', block: 'center'});
      target.querySelector('summary').focus({preventScroll: true});
    }));
    if (!section) return;
    const recallBox = section.querySelector('.primer-recall');
    section.querySelectorAll('[data-recall]').forEach(chip => chip.addEventListener('click', () => {
      const t = terms.get(chip.dataset.recall);
      const same = recallBox.dataset.term === t.id && !recallBox.hidden;
      section.querySelectorAll('[data-recall]').forEach(c => c.setAttribute('aria-pressed', 'false'));
      if (same) { recallBox.hidden = true; return; }
      chip.setAttribute('aria-pressed', 'true');
      recallBox.dataset.term = t.id;
      recallBox.innerHTML = `<div class="primer-recall-head"><span>From Lesson ${pad(t.lesson)}</span><button type="button" class="primer-close" aria-label="Close">×</button></div>${card(t, {open: true, showLesson: true}).replace(` id="term-${E(t.id)}"`, '')}`;
      recallBox.hidden = false;
      recallBox.querySelector('.primer-close').addEventListener('click', () => { recallBox.hidden = true; chip.setAttribute('aria-pressed', 'false'); chip.focus(); });
      window.CV_TUTOR?.renderMath(recallBox);
    }));
    section.querySelector('[data-primer-jump]')?.addEventListener('click', () => document.getElementById('lesson-article')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
  }

  function symbolsFor(lessonId) { return lessons[lessonId]?.symbols; }
  function hasTerm(lessonId, termId) { return !!lessons[lessonId]?.terms?.some(t => t.id === termId); }

  function glossary(root, focusId) {
    const modules = window.CV_COURSE.modules;
    const moduleOf = lesson => window.CV_COURSE.lessons.find(l => l.id === lesson)?.module;
    const all = [...terms.values()].sort((a, b) => a.term.localeCompare(b.term, 'en', {sensitivity: 'base'}));
    root.innerHTML = `<div class="glossary-tools"><label><span class="vc-sr">Search the glossary</span><input type="search" placeholder="Search a term, e.g. sigmoid, eigenvalue, IoU" autocomplete="off"></label><label><span class="vc-sr">Module</span><select><option value="0">All modules</option>${modules.map(m => `<option value="${m.n}">${pad(m.n)} · ${E(m.title)}</option>`).join('')}</select></label></div><p class="glossary-status" role="status" aria-live="polite"></p><div class="glossary-results"></div>`;
    const input = root.querySelector('input'), select = root.querySelector('select'), results = root.querySelector('.glossary-results'), status = root.querySelector('.glossary-status');
    const text = t => [t.term, t.plain, t.symbol, t.id.replace(/-/g, ' ')].join(' ').toLowerCase();
    function update() {
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean), m = Number(select.value);
      const list = all.filter(t => (!m || moduleOf(t.lesson) === m) && words.every(w => text(t).includes(w)));
      status.textContent = list.length === all.length ? `${all.length} terms, each with a plain explanation and a worked example` : `${list.length} of ${all.length} terms`;
      const groups = {};
      list.forEach(t => { const k = /[a-z]/i.test(t.term[0]) ? t.term[0].toUpperCase() : '#'; (groups[k] ||= []).push(t); });
      results.innerHTML = list.length ? Object.entries(groups).map(([k, ts]) => `<section class="glossary-group"><h2>${k}</h2><div class="primer-terms">${ts.map(t => card(t, {open: t.id === focusId, showLesson: true})).join('')}</div></section>`).join('') : '<p class="glossary-empty">No terms match. Try a shorter word.</p>';
      window.CV_TUTOR?.renderMath(results);
    }
    input.addEventListener('input', update);
    select.addEventListener('change', update);
    update();
    if (focusId) requestAnimationFrame(() => root.querySelector(`#term-${CSS.escape(focusId)}`)?.scrollIntoView({block: 'center'}));
  }

  window.CV_PRIMER = {add, panel, mount, glossary, symbolsFor, hasTerm, terms, lessons, plot};
})();
