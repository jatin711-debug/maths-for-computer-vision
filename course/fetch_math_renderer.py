"""Copy a pinned KaTeX browser distribution locally; no CDN at study time."""
from pathlib import Path
from urllib.request import urlopen
import tarfile, io

base = Path(__file__).resolve().parent / 'vendor' / 'katex'
base.mkdir(parents=True, exist_ok=True)
with urlopen('https://registry.npmjs.org/katex/-/katex-0.19.0.tgz', timeout=45) as response:
    payload = response.read()
with tarfile.open(fileobj=io.BytesIO(payload), mode='r:gz') as archive:
    for member in archive.getmembers():
        name = member.name
        relative = name.removeprefix('package/dist/') if name.startswith('package/dist/') else None
        if name == 'package/LICENSE': relative = 'LICENSE'
        if relative and member.isfile() and (relative in ['katex.min.js','katex.min.css','LICENSE'] or relative.startswith('fonts/')):
            target = (base / relative).resolve()
            if not target.is_relative_to(base.resolve()): raise ValueError(name)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.extractfile(member).read())
print('Local KaTeX 0.19.0 with fonts and MIT license:', base)
