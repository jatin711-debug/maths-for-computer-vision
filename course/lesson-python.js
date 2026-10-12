(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dependency = entry => entry.dependency === 'numpy' ? 'Python 3 + NumPy' : entry.dependency === 'torch' ? 'Python 3 + PyTorch' : 'Python 3 · standard library';
  const filename = (id, alternate = false) => `lesson-${String(id).padStart(2,'0')}-${alternate ? 'pytorch' : 'python'}.py`;
  const states = new WeakMap(), drafts = new Map();
  const sourceText = (root, kind) => root.querySelector(`[data-python-editor="${kind}"]`)?.value ?? root.querySelector(`[data-python-code="${kind}"]`).textContent;

  function appendError(output, error) {
    const previous = output.textContent;
    const separator = previous && !previous.endsWith('\n') ? '\n' : '';
    if (previous.length + separator.length + error.length <= 20000) {
      output.textContent = previous + separator + error;
      return;
    }
    const marker = '\n[Earlier output shortened to show the error.]\n';
    const available = Math.max(0, 20000 - marker.length - error.length);
    output.textContent = previous.slice(0, available) + marker + error;
  }

  function code(id, params, alternate = false) {
    const entry = alternate ? window.CV_PYTHON_EXAMPLES[id].alternate : window.CV_PYTHON_EXAMPLES[id];
    const body = entry.code.replace(/\{\{(\d+)\}\}/g, (_, i) => String(params[Number(i)]));
    return `# Lesson ${String(id).padStart(2,'0')}: ${entry.title}\n# Uses the current worked-example inputs.\n\n${body}`;
  }

  function highlight(source) {
    const tokens = /#.*$|(?:fr|rf|f|r)?(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(?:import|from|as|if|else|for|in|def|return|assert|and|or|not|True|False|None)\b|\b(?:print|float|int|len|sum|min|max|abs|range|list|set|zip)\b|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gm;
    let html = '', start = 0;
    for (const match of source.matchAll(tokens)) {
      const token = match[0];
      const type = token.startsWith('#') ? 'comment' : /^(?:fr|rf|f|r)?["']/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(?:print|float|int|len|sum|min|max|abs|range|list|set|zip)$/.test(token) ? 'function' : 'keyword';
      html += escape(source.slice(start, match.index)) + `<span class="py-${type}">${escape(token)}</span>`;
      start = match.index + token.length;
    }
    return html + escape(source.slice(start));
  }

  function panel(id, entry, alternate = false) {
    const kind = alternate ? 'alternate' : 'main';
    return `<div class="python-panel" data-python-panel="${kind}">
      <div class="python-code-head"><span>${escape(dependency(entry))}</span><div class="python-actions">
        <button class="btn" type="button" data-python-copy="${kind}">${alternate ? 'Copy PyTorch code' : 'Copy Python code'}</button>
        <button class="btn" type="button" data-python-download="${kind}">${alternate ? 'Download PyTorch .py' : 'Download .py'}</button>
      </div></div>
      <div class="python-grid"><div class="python-source">
        ${alternate ? '' : `<div class="python-editbar"><button class="btn" type="button" data-python-edit aria-expanded="false" aria-controls="python-editor-${id}">Edit code</button><button class="btn" type="button" data-python-restore disabled>Restore example</button><span class="python-follow" data-python-follow>Following lesson controls</span></div>`}
        <pre tabindex="0" role="region" aria-label="${alternate ? 'PyTorch' : 'Python'} code for lesson ${id}; scroll horizontally for long lines"><code class="language-python" data-python-code="${kind}"></code></pre>
        ${alternate ? '' : `<textarea class="python-editor" id="python-editor-${id}" data-python-editor="main" aria-label="Edit Python code for lesson ${id}" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" rows="18" hidden></textarea>
        <div class="python-runbar"><button class="btn btn-primary" type="button" data-python-run>▶ Run Python</button><button class="btn" type="button" data-python-stop disabled>Stop</button><span class="python-run-status" data-python-run-status role="status">Ready to run in your browser.</span></div>
        <div class="python-output" data-python-output-wrap hidden><div class="python-output-head"><h4>Python output</h4><span>Runs on your device</span></div><pre class="python-console" data-python-output tabindex="0" role="region" aria-label="Python execution output for lesson ${id}"></pre></div>`}
        <p class="python-status" data-python-status="${kind}" role="status"></p>
      </div><div class="python-guide">
        <h4 data-python-result-title="${kind}">Expected result <span>· lesson inputs, rounded</span></h4><dl class="python-results" data-python-results="${kind}"></dl>
        <h4>Read the code</h4><ul>${entry.notes.map(note => `<li>${escape(note)}</li>`).join('')}</ul>
        <p class="python-try"><strong>Try a change:</strong> ${escape(entry.tryIt)}</p>
      </div></div>
      <details class="python-setup"><summary>How to run this example</summary>
        ${alternate ? '<p>This optional PyTorch version runs in your installed Python environment. Copy or download it, then run it with your Python 3.12 interpreter. The browser example above checks the same calculation using Python or NumPy.</p>' : '<p>Select <strong>Run Python</strong> to execute the code here. Select <strong>Edit code</strong> to change it, or press Ctrl+Enter (⌘+Enter on Mac) inside the editor. Python and NumPy are included; you do not need to install them for the browser version.</p><p>The first run loads Python. Stop ends a running calculation; a run also stops after 10 seconds. Each run starts with fresh lesson variables. Your edits stay in this tab when you change lessons; Restore example loads the current slider values.</p>'}
        <p>To run outside the browser, copy into a Python 3 notebook cell, or download the file and run <code>python ${filename(id, alternate)}</code> in your terminal.</p>
        ${entry.dependency === 'numpy' ? '<p>This example uses NumPy. If needed, install it in the same environment with <code>python -m pip install numpy</code>.</p>' : entry.dependency === 'torch' ? '<p>PyTorch must be installed in that interpreter. Examples with a device setting choose CUDA when available and fall back to CPU. A browser worker cannot access your installed Python or CUDA; these snippets run outside the browser.</p>' : '<p>All imports are from Python’s standard library; no extra package is needed.</p>'}
      </details>
    </div>`;
  }

  function markup(id) {
    const entry = window.CV_PYTHON_EXAMPLES[id];
    if (!entry) return '';
    return `<section class="lesson-python" data-python="${id}" aria-labelledby="python-title-${id}">
      <div class="eyebrow">FROM THE EQUATION TO CODE</div>
      <h2 id="python-title-${id}" tabindex="-1">Try it in Python</h2>
      <p class="python-intro">${escape(entry.title)}. Run the example here, edit the code, and compare Python’s output with the worked calculation. The example inputs follow the controls above.</p>
      ${panel(id, entry)}
      ${entry.alternate ? `<details class="python-alternate"><summary>Optional: ${escape(entry.alternate.title)}</summary>${panel(id, entry.alternate, true)}</details>` : ''}
    </section>`;
  }

  function mount(root, id) {
    if (!root) return;
    root.closest('.lesson-tutor').querySelector('[data-python-jump]').addEventListener('click', () => {
      root.scrollIntoView({block:'start', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      root.querySelector('h2').focus({preventScroll:true});
    });
    const panel = root.querySelector('[data-python-panel="main"]');
    const editor = panel.querySelector('[data-python-editor]');
    states.set(panel, {id, example:'', dirty:false, running:false, token:0});
    panel.querySelector('[data-python-edit]').addEventListener('click', event => {
      const open = editor.hidden;
      editor.hidden = !open;
      panel.querySelector('[data-python-code]').closest('pre').hidden = open;
      event.currentTarget.setAttribute('aria-expanded', String(open));
      event.currentTarget.textContent = open ? 'View formatted code' : 'Edit code';
      if (open) editor.focus({preventScroll:true});
    });
    editor.addEventListener('input', () => {
      const state = states.get(panel);
      invalidate(panel, 'Code changed. Run Python to see the new result.');
      state.dirty = editor.value !== state.example;
      panel.querySelector('[data-python-code]').innerHTML = highlight(editor.value);
      if (state.dirty) drafts.set(id, editor.value); else drafts.delete(id);
      panel.querySelector('[data-python-status="main"]').textContent = '';
      syncLabel(panel);
    });
    editor.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        panel.querySelector('[data-python-run]').click();
      } else if (event.key === ']' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
        editor.dispatchEvent(new Event('input', {bubbles:true}));
      }
    });
    panel.querySelector('[data-python-restore]').addEventListener('click', () => restorePanel(panel));
    panel.querySelector('[data-python-stop]').addEventListener('click', () => window.CV_PYTHON_RUNNER.stop(undefined, panel));
    panel.querySelector('[data-python-run]').addEventListener('click', async () => {
      const state = states.get(panel), runSource = editor.value, token = ++state.token;
      const output = panel.querySelector('[data-python-output]');
      const status = panel.querySelector('[data-python-run-status]');
      panel.querySelector('[data-python-output-wrap]').hidden = false;
      output.textContent = '';
      state.running = true;
      panel.querySelector('[data-python-run]').disabled = true;
      panel.querySelector('[data-python-stop]').disabled = false;
      status.textContent = 'Starting Python…';
      const current = () => root.isConnected && state.token === token && editor.value === runSource;
      const result = await window.CV_PYTHON_RUNNER.run(runSource, {
        filename:filename(id), owner:panel,
        onPhase:phase => {if (current()) status.textContent = ({loading:'Loading Python for the first run…', ready:'Python is ready.', packages:'Preparing imports…', running:'Running Python…'})[phase];},
        onOutput:text => {if (current()) output.textContent += text;},
      });
      if (!current()) return;
      state.running = false;
      panel.querySelector('[data-python-run]').disabled = false;
      panel.querySelector('[data-python-stop]').disabled = true;
      panel.dataset.pythonRunResult = result.status;
      if (result.status === 'success') {
        const time = result.durationMs < 1000 ? `${Math.round(result.durationMs)} ms` : `${(result.durationMs / 1000).toFixed(1)} s`;
        status.textContent = `Finished in ${time} · Python ${result.version}${output.textContent ? '' : ' · No text output.'}`;
      } else if (result.status === 'error') {
        appendError(output, result.error);
        status.textContent = 'Python reported an error. Edit the code and run again.';
      } else {
        status.textContent = result.message;
        if (result.error) appendError(output, result.error);
      }
    });
    root.querySelectorAll('[data-python-copy]').forEach(button => button.addEventListener('click', async () => {
      const kind = button.dataset.pythonCopy;
      const status = root.querySelector(`[data-python-status="${kind}"]`);
      const text = sourceText(root, kind);
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (_) { /* Local-file pages can use the selection fallback below. */ }
      if (sourceText(root, kind) !== text || !root.isConnected) return;
      if (!copied) {
        const scrollX = window.scrollX, scrollY = window.scrollY;
        const selection = document.getSelection(), saved = [];
        for (let i = 0; i < selection.rangeCount; i++) saved.push(selection.getRangeAt(i).cloneRange());
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('aria-label', 'Code to copy');
        area.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
        document.body.append(area);
        area.focus({preventScroll:true});
        area.select();
        try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
        area.remove();
        button.focus({preventScroll:true});
        selection.removeAllRanges();
        saved.forEach(range => selection.addRange(range));
        window.scrollTo(scrollX, scrollY);
      }
      // A parameter edit during clipboard permission must not mark newer code as copied.
      if (sourceText(root, kind) !== text || !root.isConnected) return;
      status.textContent = copied ? 'Code copied. Paste it into Python or a notebook.' : 'Copy was unavailable. Select the code and copy it, or use Download .py.';
    }));
    root.querySelectorAll('[data-python-download]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.pythonDownload;
      const source = sourceText(root, kind);
      const url = URL.createObjectURL(new Blob([source], {type:'text/x-python;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename(id, kind === 'alternate');
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      root.querySelector(`[data-python-status="${kind}"]`).textContent = `Prepared ${link.download} with the current inputs.`;
    }));
  }

  function syncLabel(panel) {
    const state = states.get(panel);
    panel.querySelector('[data-python-follow]').textContent = state.dirty ? 'Your edits · kept when controls change' : 'Following lesson controls';
    panel.querySelector('[data-python-restore]').disabled = !state.dirty;
    panel.querySelector('[data-python-result-title]').innerHTML = `${state.dirty ? 'Reference result' : 'Expected result'} <span>· lesson inputs, rounded</span>`;
  }

  function invalidate(panel, message) {
    const state = states.get(panel);
    state.token++;
    if (state.running) window.CV_PYTHON_RUNNER.stop(message, panel);
    state.running = false;
    panel.querySelector('[data-python-run]').disabled = false;
    panel.querySelector('[data-python-stop]').disabled = true;
    panel.querySelector('[data-python-run-status]').textContent = message;
    panel.querySelector('[data-python-output]').textContent = '';
    panel.querySelector('[data-python-output-wrap]').hidden = true;
    delete panel.dataset.pythonRunResult;
  }

  function restorePanel(panel) {
    const state = states.get(panel);
    invalidate(panel, 'Example restored. Run Python to execute it.');
    state.dirty = false;
    drafts.delete(state.id);
    panel.querySelector('[data-python-editor]').value = state.example;
    panel.querySelector('[data-python-code]').innerHTML = highlight(state.example);
    panel.querySelector('[data-python-status="main"]').textContent = '';
    syncLabel(panel);
  }

  function restore(root) {
    if (root) restorePanel(root.querySelector('[data-python-panel="main"]'));
  }

  function update(root, id, params, model) {
    if (!root) return;
    const signature = JSON.stringify(params);
    if (root.dataset.pythonSignature === signature) return;
    root.dataset.pythonSignature = signature;
    for (const [kind, alternate] of [['main', false], ['alternate', true]]) {
      const source = root.querySelector(`[data-python-code="${kind}"]`);
      if (!source) continue;
      const generated = code(id, params, alternate);
      if (!alternate) {
        const panel = source.closest('[data-python-panel]'), state = states.get(panel);
        const editor = panel.querySelector('[data-python-editor]');
        if (!state.example && drafts.has(id)) {
          editor.value = drafts.get(id);
          state.dirty = editor.value !== generated;
          source.innerHTML = highlight(editor.value);
        } else if (!state.dirty) {
          if (state.example) invalidate(panel, 'Lesson inputs changed. Run Python to see the new result.');
          editor.value = generated;
          source.innerHTML = highlight(generated);
        }
        state.example = generated;
        editor.rows = Math.max(12, Math.min(22, editor.value.split('\n').length));
        syncLabel(panel);
      } else source.innerHTML = highlight(generated);
      const values = model.values.map(([label, value]) => [alternate && label === 'Analytic gradient' ? 'Autograd gradient' : label, value]);
      root.querySelector(`[data-python-results="${kind}"]`).innerHTML = values.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${value === null ? 'Undefined (no positive predictions)' : escape(Number(value.toPrecision(6)))}</dd></div>`).join('');
      root.querySelector(`[data-python-status="${kind}"]`).textContent = '';
    }
  }

  window.CV_PYTHON = {markup, mount, update, code, restore};
})();
