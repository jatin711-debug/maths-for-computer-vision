/* A lazy, reusable worker. Stop and timeouts terminate Python without blocking the UI. */
(() => {
  'use strict';
  const workerURL = new URL('python-runtime-worker.mjs?v=4', document.currentScript.src);
  const LOAD_TIMEOUT = 60000, RUN_TIMEOUT = 10000;
  let worker, active, sequence = 0, ready = false;

  function finish(result) {
    if (!active) return;
    const job = active;
    active = null;
    clearTimeout(job.timer);
    job.resolve({...result, stdout:job.stdout, stderr:job.stderr});
  }

  function terminate() {
    worker?.terminate();
    worker = undefined;
    ready = false;
  }

  function stop(message = 'Stopped. Run Python to start again.', owner) {
    if (!active || (owner && active.owner !== owner)) return false;
    terminate();
    finish({status:'stopped', message});
    return true;
  }

  function deadline(milliseconds, phase) {
    clearTimeout(active.timer);
    active.timer = setTimeout(() => {
      terminate();
      finish({status:'timeout', message:phase === 'run' ? 'Stopped after 10 seconds. Check for an endless loop or reduce the work, then run again.' : 'Python took too long to load. Run again to retry.'});
    }, milliseconds);
  }

  function startWorker() {
    const instance = new Worker(workerURL, {type:'module', name:'course-python'});
    worker = instance;
    instance.onmessage = ({data}) => {
      if (worker !== instance || !active || data.id !== active.id) return;
      if (data.type === 'phase') {
        if (data.phase === 'ready') ready = true;
        if (data.phase === 'running') deadline(RUN_TIMEOUT, 'run');
        active.onPhase?.(data.phase);
      } else if (data.type === 'output') {
        active[data.stream === 'stderr' ? 'stderr' : 'stdout'] += data.text;
        active.onOutput?.(data.text, data.stream);
      } else if (data.type === 'done') {
        if (data.bootFailed) {
          terminate();
          finish({...data, status:'unavailable', message:'Python could not load. Run Python again to retry.'});
        } else finish(data);
      }
    };
    instance.onerror = event => {
      event.preventDefault();
      if (worker !== instance) return;
      terminate();
      finish({status:'unavailable', message:'Python could not start. Refresh the course and try again.', error:event.message});
    };
  }

  function run(source, {filename='lesson-example.py', owner, onPhase, onOutput} = {}) {
    if (!['http:', 'https:'].includes(location.protocol)) {
      return Promise.resolve({status:'unavailable', message:'Open the course using Open-Course.ps1 to run Python in your browser. Copy and Download also work on this page.', stdout:'', stderr:''});
    }
    if (!window.Worker || !window.WebAssembly) {
      return Promise.resolve({status:'unavailable', message:'This browser cannot run Python here. Try a current browser or download the example.', stdout:'', stderr:''});
    }
    if (!source.trim()) return Promise.resolve({status:'empty', message:'Enter some Python code first.', stdout:'', stderr:''});
    if (source.length > 65536) return Promise.resolve({status:'error', error:'This lesson editor supports up to 65,536 characters of code.', stdout:'', stderr:''});
    stop('Stopped to start another example.');
    return new Promise(resolve => {
      active = {id:++sequence, owner, resolve, onPhase, onOutput, stdout:'', stderr:''};
      try {
        if (!worker) startWorker();
        deadline(LOAD_TIMEOUT, 'load');
        onPhase?.(ready ? 'packages' : 'loading');
        worker.postMessage({type:'run', id:active.id, source, filename});
      } catch (error) {
        terminate();
        finish({status:'unavailable', message:'Python could not start. Refresh the course and try again.', error:String(error.message || error)});
      }
    });
  }

  window.addEventListener('hashchange', () => stop('Stopped when you left the lesson.'));
  window.addEventListener('pagehide', () => {stop(); terminate();});
  window.CV_PYTHON_RUNNER = {run, stop, isReady:() => ready, limits:{load:LOAD_TIMEOUT, run:RUN_TIMEOUT}};
})();
