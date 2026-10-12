import { loadPyodide } from './vendor/pyodide/pyodide.mjs';

let runtimePromise;
let busy = false;
const OUTPUT_LIMIT = 20000;
// Leave room for printed output alongside a long traceback in the console.
const ERROR_LIMIT = OUTPUT_LIMIT / 2;

function errorText(error) {
  const text = String(error.message || error);
  if (text.length <= ERROR_LIMIT) return text;
  const marker = '\n[Error shortened; beginning and end retained.]\n';
  const head = Math.ceil((ERROR_LIMIT - marker.length) / 2);
  const tail = ERROR_LIMIT - marker.length - head;
  return text.slice(0, head) + marker + text.slice(-tail);
}

self.onmessage = async ({data}) => {
  if (data.type !== 'run' || busy) return;
  busy = true;
  const {id, source, filename} = data;
  const send = message => self.postMessage({id, ...message});
  let python, globals, result, count = 0, pending = '', pendingStream = 'stdout', flushTimer;
  let truncated = false, started;
  const flush = () => {
    clearTimeout(flushTimer);
    if (pending) send({type:'output', stream:pendingStream, text:pending});
    pending = '';
  };
  const emit = (stream, text) => {
    if (count >= OUTPUT_LIMIT) {
      if (!truncated) {truncated = true; flush(); send({type:'output', stream, text:'\n[Output shortened after 20,000 characters.]\n'});}
      return;
    }
    if (stream !== pendingStream) flush();
    pendingStream = stream;
    const available = OUTPUT_LIMIT - count;
    pending += text.slice(0, available);
    count += Math.min(text.length, available);
    if (text.length > available && !truncated) {
      truncated = true;
      pending += '\n[Output shortened after 20,000 characters.]\n';
    }
    if (pending.length >= 512) flush();
    else { clearTimeout(flushTimer); flushTimer = setTimeout(flush, 40); }
  };
  const writer = stream => {
    const decoder = new TextDecoder();
    return {write:bytes => {emit(stream, decoder.decode(bytes, {stream:true})); return bytes.length;}};
  };
  const flushPython = () => {
    try { python?.runPython('__import__("sys").stdout.flush(); __import__("sys").stderr.flush()'); } catch (_) {}
  };

  try {
    if (!runtimePromise) {
      send({type:'phase', phase:'loading'});
      runtimePromise = loadPyodide({
        indexURL:new URL('./vendor/pyodide/', import.meta.url).href,
        stdout:() => {}, stderr:() => {},
      });
    }
    python = await runtimePromise;
    const version = python.runPython('__import__("sys").version.split()[0]');
    send({type:'phase', phase:'ready', version});
    python.setStdout(writer('stdout'));
    python.setStderr(writer('stderr'));
    python.setStdin({stdin:() => null});
    send({type:'phase', phase:'packages'});
    await python.loadPackagesFromImports(source, {messageCallback:() => {}, errorCallback:() => {}});
    globals = python.toPy({__name__:'__main__'});
    send({type:'phase', phase:'running'});
    started = performance.now();
    result = await python.runPythonAsync(source, {globals, filename, dedent:false});
    flushPython();
    // Like a notebook cell, show a final expression as well as print() output.
    if (result !== undefined && result !== null) emit('stdout', String(result) + '\n');
    flush();
    send({type:'done', status:'success', durationMs:performance.now() - started, version});
  } catch (error) {
    flushPython();
    flush();
    send({type:'done', status:'error', error:errorText(error), bootFailed:!python, durationMs:started ? performance.now() - started : 0});
  } finally {
    clearTimeout(flushTimer);
    result?.destroy?.();
    globals?.destroy?.();
    busy = false;
  }
};
