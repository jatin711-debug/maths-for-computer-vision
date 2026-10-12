/* Turn reading references such as "MML 8.2-8.4; CV 5.3.5" into links that open each PDF at the cited page. */
(() => {
  'use strict';
  const course = window.CV_COURSE;
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BOOK = {MML:'MML', CS205A:'CS205A', CV:'CV', Guo:'GUO'};
  const ROMAN = {I:1, II:2, III:3, IV:4, V:5};
  const SECTION = String.raw`(?:[AB]\.\d+(?:\.\d+)?|\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)`;
  // Order matters: book names set the context; lesson and module numbers are matched only so they are skipped.
  const pattern = new RegExp([
    String.raw`\b(MML|CS205A|CV|Guo)\b`,
    String.raw`\bAppendix\s+([AB](?:\.\d+)*)(?:\s*[-–]\s*([AB](?:\.\d+)*))?`,
    String.raw`\bChapters?\s+(\d+)(?:\s*(?:[-–]|and)\s*(\d+))?`,
    String.raw`\bPart\s+([IVX]+)(?:,\s*Chapter\s+(\d+))?(?:,\s*Sections?\s+(\d+)(?:\s*[-–]\s*(\d+))?)?`,
    String.raw`\b(?:Lessons?|Modules?|Weeks?)\s+\d+(?:\s*[-–]\s*\d+)?|\ball of Chapters?\s+\d+`,
    String.raw`\b(${SECTION})(?:\s*[-–]\s*(${SECTION}))?\b`
  ].join('|'), 'g');

  function lookup(book, label) {
    const index = course.sections?.[book] || {};
    for (let key = label; key; key = key.includes('.') ? key.slice(0, key.lastIndexOf('.')) : '') {
      if (index[key]) return {...index[key], exact: key === label};
    }
    return null;
  }
  function parse(text) {
    const found = [];
    let book = null;
    for (const m of String(text).matchAll(pattern)) {
      if (m[1]) { book = BOOK[m[1]]; continue; }
      if (!book) continue;
      let label, display, start = m[0];
      if (m[2]) { label = m[2]; display = m[3] ? `${m[2]}–${m[3]}` : m[2]; }
      else if (m[4]) { label = m[4]; display = m[5] ? `Ch. ${m[4]}–${m[5]}` : `Ch. ${m[4]}`; }
      else if (m[6]) {
        if (book !== 'GUO') continue;
        const part = ROMAN[m[6]];
        label = m[7] ? `P${part}.C${m[7]}${m[8] ? `.S${m[8]}` : ''}` : `P${part}`;
        display = `Part ${m[6]}${m[7] ? `, Ch. ${m[7]}` : ''}${m[8] ? `, §${m[8]}${m[9] ? `–${m[9]}` : ''}` : ''}`;
      } else if (m[10]) { label = m[10]; display = m[11] ? `${m[10]}–${m[11]}` : m[10]; }
      else continue;
      const target = lookup(book, label);
      if (!target) continue;
      found.push({book, label, display, page: target.page, title: target.title, index: m.index, length: start.length});
    }
    return found;
  }
  const href = c => `${course.sources[c.book].href}#page=${c.page}`;
  const name = key => key === 'GUO' ? 'Guo' : key;
  const tip = c => `Open ${name(c.book)} at PDF page ${c.page}: ${c.title}`;

  // Plain reading text with each section reference linked in place.
  function linkify(text) {
    text = String(text ?? '');
    let html = '', last = 0;
    for (const c of parse(text)) {
      html += E(text.slice(last, c.index)) + `<a class="reading-ref" href="${href(c)}" target="_blank" rel="noopener" title="${E(tip(c))}">${E(text.substr(c.index, c.length))}</a>`;
      last = c.index + c.length;
    }
    return html + E(text.slice(last));
  }
  // One chip per cited section, plus a whole-book chip for any book mentioned without a section.
  function chips(text) {
    const seen = new Set(), cited = parse(text).filter(c => !seen.has(c.book + c.display) && seen.add(c.book + c.display));
    const mentioned = Object.keys(course.sources).filter(key => new RegExp(`\\b${name(key)}\\b`).test(text) && !cited.some(c => c.book === key));
    return cited.map(c => `<a class="book-chip section-chip" href="${href(c)}" target="_blank" rel="noopener" title="${E(tip(c))}"><b>${E(name(c.book))} ${E(c.display)}</b><span>${E(c.title)}</span></a>`).join('') +
      mentioned.map(key => `<a class="book-chip" href="${course.sources[key].href}" target="_blank" rel="noopener">${name(key)} PDF ↗</a>`).join('');
  }
  // Link the references inside rendered lesson prose without disturbing other markup.
  function linkifyElement(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!parse(node.textContent).length) return;
      const span = document.createElement('span');
      span.innerHTML = linkify(node.textContent);
      node.replaceWith(...span.childNodes);
    });
  }
  // The book PDFs are not redistributed with the public course. Check once whether each local copy exists; when one is
  // missing, a click on its link explains where to get the book instead of opening an error page.
  const available = {};
  const bookFor = link => Object.keys(course.sources).find(key => (link.getAttribute('href') || '').startsWith(course.sources[key].href));
  if (location.protocol.startsWith('http')) {
    Object.entries(course.sources).forEach(([key, source]) => {
      fetch(source.href, {method: 'HEAD', cache: 'no-store'}).then(r => { available[key] = r.ok; }).catch(() => { available[key] = false; });
    });
  }
  let note;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    const key = link && bookFor(link);
    if (!key || available[key] !== false) return;
    event.preventDefault();
    const source = course.sources[key];
    if (!note) {
      note = document.createElement('div');
      note.className = 'book-missing-note';
      note.setAttribute('role', 'status');
      document.body.append(note);
    }
    const page = (link.getAttribute('href').match(/#page=(\d+)/) || [])[1];
    note.innerHTML = `<b>${E(source.title)}</b> is not included with this copy of the course.${page ? ` This reference is on PDF page ${E(page)}.` : ''} ${source.url ? `It is free from <a href="${E(source.url)}" target="_blank" rel="noopener">its official site</a>; also see` : 'See'} <code>course/resources/README.md</code> for where to find each book; a copy saved there as <code>${E(source.href.split('/').pop())}</code> makes these links open at the right page. <button type="button" aria-label="Close">×</button>`;
    note.querySelector('button').addEventListener('click', () => note.classList.remove('show'));
    note.classList.add('show');
    clearTimeout(note.timer);
    note.timer = setTimeout(() => note.classList.remove('show'), 12000);
  });
  window.CV_READING = {parse, linkify, chips, linkifyElement};
})();
