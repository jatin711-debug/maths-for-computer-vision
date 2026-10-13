/* Run in the local course browser:
 * await fetch('tests/rendering.browser.js').then(r => r.text()).then(source => (0, eval)(source))
 * Uses the real DOM and KaTeX; restores the route and never edits saved progress.
 */
(async () => {
  const checks = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(name);
    checks.push(name);
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const waitFor = async predicate => {
    for (let i = 0; i < 100; i++) {
      if (predicate()) return true;
      await delay(10);
    }
    return false;
  };
  const startHash = location.hash, startScroll = scrollY;
  const navigate = async hash => {
    location.hash = hash;
    await delay(40);
  };
  const fixture = document.createElement('div');
  fixture.hidden = true;
  document.body.append(fixture);
  const originalKatex = window.katex.renderToString;
  let renders = 0;
  window.katex.renderToString = (...args) => { renders++; return originalKatex(...args); };
  const results = {};
  try {
    fixture.innerHTML = String.raw`<p>Before \(431+a\) between \[432+b\] after.</p><pre><code>\(literal\)</code></pre><textarea>\(literal\)</textarea><script type="text/plain">\(literal\)</script><style>/* \(literal\) */</style><div class="katex">\(literal\)</div>`;
    CV_TUTOR.renderMath(fixture);
    assert(fixture.querySelector('p').querySelectorAll('.katex').length === 2, 'Inline and display equations render');
    assert(fixture.querySelector('p').querySelectorAll('.katex-display').length === 1, 'Display mode is preserved');
    assert(fixture.querySelector('p').textContent.startsWith('Before ') && fixture.querySelector('p').textContent.endsWith(' after.'), 'Text around equations is preserved');
    assert(!fixture.querySelector('pre .katex') && fixture.querySelector('textarea').value === String.raw`\(literal\)`, 'Code and input text stay literal');
    const before = renders;
    CV_TUTOR.renderMath(fixture);
    assert(renders === before, 'A second scan reuses rendered equations');
    CV_TUTOR.renderMath(fixture.querySelector('code'));
    assert(!fixture.querySelector('code .katex'), 'Rendering a code root stays literal');

    fixture.innerHTML = '<span data-equation="433+c" data-inline="true"></span><span data-equation="433+c" data-inline="true"></span>';
    const cacheStart = renders;
    CV_TUTOR.renderMath(fixture);
    assert(renders === cacheStart + 1, 'Duplicate equations share a cached render');
    const equation = fixture.firstElementChild;
    equation.dataset.equation = '434+d';
    CV_TUTOR.renderMath(equation);
    assert(equation.querySelector('annotation').textContent === '434+d', 'Changed equation text updates');
    equation.dataset.inline = 'false';
    CV_TUTOR.renderMath(equation);
    assert(!!equation.querySelector('.katex-display'), 'Changed display mode updates');

    fixture.innerHTML = '<span data-equation="435+e" data-inline="true" data-math-deferred></span>';
    CV_TUTOR.renderMath(fixture);
    assert(!fixture.querySelector('.katex'), 'Deferred equations are skipped by page scans');
    fixture.firstElementChild.removeAttribute('data-math-deferred');
    CV_TUTOR.renderMath(fixture.firstElementChild);
    assert(!!fixture.querySelector('.katex'), 'Deferred equations render when requested');

    await navigate('#overview');
    const originalGlossary = CV_PRIMER.glossary;
    CV_PRIMER.glossary = (...args) => {
      const start = performance.now();
      try { return originalGlossary(...args); }
      finally { results.glossaryBuildMs = performance.now() - start; }
    };
    try { await navigate('#glossary'); }
    finally { CV_PRIMER.glossary = originalGlossary; }
    const root = document.getElementById('glossary');
    assert(root.querySelectorAll('.primer-term').length === CV_PRIMER.terms.size, 'Every glossary term is available');
    assert(root.querySelectorAll('.primer-plain').length === 0, 'Closed entries do not build hidden definitions');
    assert(await waitFor(() => root.querySelector('summary .katex')), 'Visible symbols render as the glossary appears');
    assert(root.querySelectorAll('summary .katex').length < root.querySelectorAll('summary [data-equation]').length, 'Off-screen symbols stay out of the initial render');
    assert(!root.querySelector('.katex-error'), 'Visible glossary symbols render without errors');
    const distant = [...root.querySelectorAll('.primer-term')].reverse().find(node => node.querySelector('[data-math-deferred]'));
    distant.scrollIntoView({block: 'center'});
    assert(await waitFor(() => distant.querySelector('summary .katex')), 'Scrolling renders newly visible symbols');
    assert(!distant.querySelector('.primer-plain'), 'Scrolling keeps unopened definitions unloaded');
    scrollTo(0, 0);
    const plotted = CV_PRIMER.terms.get('sigmoid') || [...CV_PRIMER.terms.values()].find(t => t.plot && t.examples?.length);
    const details = document.getElementById('term-' + plotted.id);
    details.querySelector('summary').click();
    await delay(20);
    const body = details.querySelector('.primer-body');
    assert(details.open && !!body.querySelector('.primer-plain'), 'Opening an entry loads its definition');
    assert(!!body.querySelector('svg') && !!body.querySelector('table'), 'Graphs and worked examples load');
    assert(!!body.querySelector('.katex') && !body.querySelector('.katex-error'), 'Entry equations render without errors');
    assert(body.querySelector('a').hash === '#lesson/' + plotted.lesson, 'The introducing lesson link is preserved');
    const bodyHtml = body.innerHTML;
    details.querySelector('summary').click();
    await delay(10);
    details.querySelector('summary').click();
    await delay(10);
    assert(body.innerHTML === bodyHtml, 'Reopening an entry reuses its content');

    const input = root.querySelector('input'), select = root.querySelector('select');
    const search = async text => { input.value = text; input.dispatchEvent(new Event('input')); await delay(110); };
    await search('  ' + plotted.term.toUpperCase() + '  ');
    assert(root.contains(details) && root.querySelectorAll('.primer-term').length < CV_PRIMER.terms.size, 'Search ignores case and extra spaces');
    assert(details.open && details.querySelector('.primer-body') === body, 'Filtering preserves expanded entries');
    const moduleOf = new Map(CV_COURSE.lessons.map(l => [l.id, l.module]));
    select.value = String(moduleOf.get(plotted.lesson));
    select.dispatchEvent(new Event('change'));
    assert(root.contains(details) && [...root.querySelectorAll('.primer-term')].every(node => moduleOf.get(CV_PRIMER.terms.get(node.dataset.term).lesson) === Number(select.value)), 'Search and module filtering work together');
    await search('');
    assert(root.querySelectorAll('.primer-term').length === [...CV_PRIMER.terms.values()].filter(t => moduleOf.get(t.lesson) === Number(select.value)).length, 'The module filter shows all its terms');
    await search('no-term-matches-this-ui-check');
    assert(root.querySelectorAll('.primer-term').length === 0 && root.querySelector('.glossary-empty'), 'Empty search results are explained');
    select.value = '0';
    input.value = '';
    select.dispatchEvent(new Event('change'));
    assert(root.querySelectorAll('.primer-term').length === CV_PRIMER.terms.size && root.contains(details), 'Clearing filters restores the same entries');

    input.value = 'queued search';
    input.dispatchEvent(new Event('input'));
    await navigate('#overview');
    await delay(110);
    assert(!root.isConnected && !document.querySelector('.glossary-results'), 'Queued search work stops when navigating away');
    await navigate('#glossary/' + plotted.id);
    const focused = document.getElementById('term-' + plotted.id);
    assert(focused.open && focused.querySelector('.primer-plain') && focused.querySelector('.katex'), 'Term deep links open complete definitions');
    assert(document.querySelectorAll('#glossary .primer-plain').length === 1, 'Deep links load only the requested definition');

    const printInput = document.querySelector('#glossary input');
    printInput.value = 'cos';
    printInput.dispatchEvent(new Event('input'));
    await delay(110);
    const printEntries = document.querySelectorAll('#glossary .primer-term');
    assert(printEntries.length > 0, 'The print fixture has matching terms');
    window.dispatchEvent(new Event('beforeprint'));
    assert([...printEntries].every(node => node.querySelector('.primer-plain') && !node.querySelector('[data-primer-pending]')), 'Printing includes closed definitions in the filtered results');

    await navigate('#lesson/29');
    assert(document.querySelectorAll('#lesson-content .katex').length > 0 && !document.querySelector('#lesson-content .katex-error'), 'Lesson equations still render');
    const control = document.querySelector('[data-tutor] [data-param]');
    const equationsBefore = [...document.querySelectorAll('[data-tutor] [data-equation]')].map(node => node.dataset.equation).join('|');
    control.value = String(Number(control.value) + Number(control.step));
    control.dispatchEvent(new Event('input'));
    const equationsAfter = [...document.querySelectorAll('[data-tutor] [data-equation]')].map(node => node.dataset.equation).join('|');
    assert(equationsBefore !== equationsAfter && !document.querySelector('[data-tutor] .katex-error'), 'Interactive lesson calculations update their maths');

    results.passed = checks.length;
    results.checks = checks;
    return results;
  } finally {
    window.katex.renderToString = originalKatex;
    fixture.remove();
    await navigate(startHash);
    scrollTo(0, startScroll);
  }
})()
