"""Vendor a pinned Pyodide runtime and NumPy for browser execution without a CDN."""
from pathlib import Path
from urllib.request import urlopen
import hashlib
import json

VERSION = "314.0.7"
BASE = f"https://cdn.jsdelivr.net/pyodide/v{VERSION}/full/"
TARGET = Path(__file__).resolve().parent / "vendor" / "pyodide"


def download(url):
    with urlopen(url, timeout=60) as response:
        return response.read()


def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    lock_bytes = download(BASE + "pyodide-lock.json")
    lock = json.loads(lock_bytes)
    assets = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip"]
    needed = set()

    def visit(name):
        if name in needed:
            return
        needed.add(name)
        for dependency in lock["packages"][name].get("depends", []):
            visit(dependency)

    visit("numpy")
    files = {"pyodide-lock.json": lock_bytes}
    for asset in assets:
        files[asset] = download(BASE + asset)
    for package in sorted(needed):
        entry = lock["packages"][package]
        data = download(BASE + entry["file_name"])
        assert hashlib.sha256(data).hexdigest() == entry["sha256"], f"Checksum mismatch for {package}"
        files[entry["file_name"]] = data
    files["LICENSE"] = download(f"https://raw.githubusercontent.com/pyodide/pyodide/{VERSION}/LICENSE")
    python_version = lock["info"]["python"]
    files["CPYTHON-LICENSE"] = download(f"https://raw.githubusercontent.com/python/cpython/v{python_version}/LICENSE")
    files["EMSCRIPTEN-LICENSE"] = download("https://raw.githubusercontent.com/emscripten-core/emscripten/5.0.3/LICENSE")
    # Limit auto-loading to the wheels actually bundled with this course.
    local_lock = {**lock, "packages": {name: lock["packages"][name] for name in sorted(needed)}}
    files["pyodide-lock.json"] = (json.dumps(local_lock, indent=2) + "\n").encode()
    manifest = dict(version=VERSION, python=lock["info"]["python"], source=BASE,
                    packages={name: lock["packages"][name]["version"] for name in sorted(needed)}, files={})
    for name, data in files.items():
        destination = TARGET / name
        assert destination.resolve().parent == TARGET.resolve(), f"Unexpected asset path: {name}"
        destination.write_bytes(data)
        manifest["files"][name] = dict(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        print(f"Saved {name}: {len(data):,} bytes", flush=True)
    (TARGET / "runtime-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Vendored Pyodide {VERSION}: {sum(item['bytes'] for item in manifest['files'].values()) / 1_000_000:.1f} MB")


if __name__ == "__main__":
    main()
