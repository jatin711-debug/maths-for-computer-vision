/* Visual classroom browser: every video in one list, filtered by kind, module and search, shown as a grid or a list. */
(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pad = n => String(n).padStart(2, '0');
  const storageKey = 'cv-maths-classroom-v1';
  const KINDS = [
    {id:'all', label:'All videos', desc:'Everything, grouped by module'},
    {id:'animated', label:'Animated explanations', short:'Animated', desc:'Two-minute animations of the hardest ideas'},
    {id:'walkthrough', label:'Lesson walkthroughs', short:'Walkthrough', desc:'A narrated worked example for every lesson'},
    {id:'overview', label:'Module overviews', short:'Overview', desc:'Short previews, one per module'}
  ];
  const kindOf = id => KINDS.find(k => k.id === id);
  const clock = seconds => { const total = Math.ceil(seconds); return `${Math.floor(total / 60)}:${pad(total % 60)}`; }; // rounds up, like durationLabel
  const thumbs = new Map();

  function load() {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  }
  function save(prefs) {
    try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch { /* storage unavailable: preferences last for this visit */ }
  }

  function entries(modules) {
    const moduleTitle = n => modules.find(m => m.n === n)?.title || '';
    const videos = window.CV_CONCEPT_VIDEOS.items.map(item => ({
      id: item.id, kind: item.animated ? 'animated' : 'walkthrough', module: item.module, lesson: item.lesson,
      title: item.title, duration: item.duration, poster: item.poster,
      search: [item.title, `lesson ${item.lesson}`, `module ${item.module}`, moduleTitle(item.module), ...item.chapters.map(c => c.label)].join(' ').toLowerCase()
    }));
    const overviews = window.CV_STORIES.stories.map(story => ({
      id: story.id, kind: 'overview', module: story.module, lesson: null, title: story.title, duration: 24, story: true,
      search: [story.title, `module ${story.module}`, moduleTitle(story.module)].join(' ').toLowerCase()
    }));
    const order = {overview: 0, animated: 1, walkthrough: 2};
    return [...overviews, ...videos].sort((a, b) => a.module - b.module || (a.lesson ?? 0) - (b.lesson ?? 0) || order[a.kind] - order[b.kind]);
  }

  function thumb(entry) {
    if (!entry.story) return `<img src="${entry.poster}" alt="" loading="lazy" decoding="async" width="1920" height="1080">`;
    if (!thumbs.has(entry.id)) thumbs.set(entry.id, window.CV_STORIES.frame(entry.id, 3.8));
    return thumbs.get(entry.id);
  }

  function card(entry, grouped) {
    const kind = kindOf(entry.kind);
    const where = entry.lesson ? `Lesson ${pad(entry.lesson)}` : `Module ${pad(entry.module)}`;
    const context = grouped || !entry.lesson ? where : `Module ${pad(entry.module)} · ${where}`;
    const length = window.CV_CONCEPT_VIDEOS.durationLabel(entry.duration);
    return `<a class="vc-card" data-kind="${entry.kind}" href="#cinema/${entry.id}" aria-label="${escape(`${entry.title}. ${kind.label.replace(/s$/, '')}, ${where}, ${length}`)}">
      <span class="vc-thumb">${thumb(entry)}<span class="vc-time">${clock(entry.duration)}</span></span>
      <span class="vc-body"><span class="vc-meta"><span class="vc-badge"><i aria-hidden="true"></i>${kind.short}</span><span>${context}</span><span class="vc-length">${clock(entry.duration)}</span></span><span class="vc-title">${escape(entry.title)}</span></span>
    </a>`;
  }

  function render(root, {modules}) {
    const all = entries(modules);
    const saved = load();
    const prefs = {
      kind: kindOf(saved.kind) ? saved.kind : 'all',
      module: modules.some(m => m.n === saved.module) ? saved.module : 0,
      view: saved.view === 'list' ? 'list' : 'grid',
      query: ''
    };
    const count = id => id === 'all' ? all.length : all.filter(e => e.kind === id).length;
    root.innerHTML = `<section class="vc" data-view="${prefs.view}">
      <div class="vc-kinds" role="group" aria-label="Kind of video">${KINDS.map(k => `<button type="button" class="vc-kind" data-kind="${k.id}" aria-pressed="${k.id === prefs.kind}"><span class="vc-kind-top">${k.id === 'all' ? '' : '<i aria-hidden="true"></i>'}<b>${k.label}</b><span class="vc-count">${count(k.id)}</span></span><span class="vc-kind-desc">${k.desc}</span></button>`).join('')}</div>
      <div class="vc-tools">
        <label class="vc-search"><span class="vc-sr">Search videos</span><input type="search" placeholder="Search a topic, e.g. eigen, softmax, lesson 34" autocomplete="off"></label>
        <label class="vc-module"><span class="vc-sr">Module</span><select><option value="0">All modules</option>${modules.map(m => `<option value="${m.n}"${m.n === prefs.module ? ' selected' : ''}>${pad(m.n)} · ${escape(m.title)}</option>`).join('')}</select></label>
        <div class="vc-views" role="group" aria-label="Layout">
          <button type="button" data-view="grid" aria-pressed="${prefs.view === 'grid'}" title="Grid"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z" fill="currentColor"/></svg>Grid</button>
          <button type="button" data-view="list" aria-pressed="${prefs.view === 'list'}" title="List"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1 2h4v3H1zM7 2.5h8v2H7zM1 6.5h4v3H1zM7 7h8v2H7zM1 11h4v3H1zM7 11.5h8v2H7z" fill="currentColor"/></svg>List</button>
        </div>
      </div>
      <div class="vc-status"><p role="status" aria-live="polite"></p><button type="button" class="vc-clear" hidden>Clear filters</button></div>
      <div class="vc-results"></div>
    </section>`;
    const el = sel => root.querySelector(sel);
    const results = el('.vc-results'), status = el('.vc-status p'), clear = el('.vc-clear'), search = el('.vc-search input'), select = el('.vc-module select');

    function update() {
      save({kind: prefs.kind, module: prefs.module, view: prefs.view});
      root.querySelectorAll('.vc-kind').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === prefs.kind)));
      root.querySelectorAll('.vc-views button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === prefs.view)));
      el('.vc').dataset.view = prefs.view;
      const words = prefs.query.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = all.filter(e => (prefs.kind === 'all' || e.kind === prefs.kind) && (!prefs.module || e.module === prefs.module) && words.every(w => e.search.includes(w)));
      const filtered = prefs.kind !== 'all' || prefs.module || words.length;
      clear.hidden = !filtered;
      const noun = prefs.kind === 'all' ? 'videos' : kindOf(prefs.kind).label.toLowerCase();
      status.textContent = matches.length === all.length ? `Showing all ${all.length} videos` : `Showing ${matches.length} ${matches.length === 1 ? noun.replace(/s$/, '') : noun}${prefs.module ? ` in Module ${pad(prefs.module)}` : ''}${words.length ? ` matching “${prefs.query.trim()}”` : ''}`;
      if (!matches.length) {
        results.innerHTML = `<div class="vc-empty"><p>No videos match these filters.</p><button type="button" class="btn" data-vc-clear>Clear filters</button></div>`;
        return;
      }
      // Group by module when a module holds several kinds; the two smaller kinds read better as one flat shelf.
      const grouped = (prefs.kind === 'all' || prefs.kind === 'walkthrough') && !prefs.module;
      results.innerHTML = grouped
        ? modules.filter(m => matches.some(e => e.module === m.n)).map(m => {
            const items = matches.filter(e => e.module === m.n);
            return `<section class="vc-group" aria-labelledby="vc-module-${m.n}"><div class="vc-group-head"><h2 id="vc-module-${m.n}"><span>Module ${pad(m.n)}</span>${escape(m.title)}</h2><span class="vc-group-meta">${items.length} ${items.length === 1 ? 'video' : 'videos'} · <a class="text-link" href="#module/${m.n}">Module guide ↗</a></span></div><div class="vc-items">${items.map(e => card(e, true)).join('')}</div></section>`;
          }).join('')
        : `<div class="vc-items">${matches.map(e => card(e, !!prefs.module)).join('')}</div>`;
    }

    function reset() {
      prefs.kind = 'all'; prefs.module = 0; prefs.query = '';
      search.value = ''; select.value = '0';
      update();
    }
    root.querySelectorAll('.vc-kind').forEach(b => b.addEventListener('click', () => { prefs.kind = b.dataset.kind; update(); }));
    root.querySelectorAll('.vc-views button').forEach(b => b.addEventListener('click', () => { prefs.view = b.dataset.view; update(); }));
    select.addEventListener('change', () => { prefs.module = Number(select.value); update(); });
    search.addEventListener('input', () => { prefs.query = search.value; update(); });
    clear.addEventListener('click', reset);
    results.addEventListener('click', event => { if (event.target.closest('[data-vc-clear]')) reset(); });
    update();
  }

  window.CV_CLASSROOM = {render};
})();
