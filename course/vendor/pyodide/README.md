# Browser Python runtime

Pinned Pyodide 314.0.7 (Python 3.14.2) and NumPy 2.4.6, fetched by `course/fetch_python_runtime.py` from the official distribution documented at https://pyodide.org/en/stable/usage/downloading-and-deploying.html.

The worker imports `pyodide.mjs` from this folder. Only NumPy is included in the local package lock; its wheel retains its package licenses. Pyodide, CPython and Emscripten licenses are retained alongside the runtime. `runtime-manifest.json` records provenance, versions, asset sizes and SHA-256 checksums.

The assets load on demand from the same server as the course, without a remote CDN or a backend code execution endpoint. Serve `.mjs` as `text/javascript` and `.wasm` as `application/wasm` when deploying with another static server.
