"""Small loopback-only course app server, with byte ranges for MP4 seeking."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json, re, os

ROOT = Path(__file__).resolve().parent.parent
class CourseHandler(SimpleHTTPRequestHandler):
    # Windows registry MIME associations can otherwise serve ES modules as text/plain.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.mjs': 'text/javascript', '.js': 'text/javascript',
                      '.wasm': 'application/wasm'}
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def end_headers(self):
        self.send_header('Cache-Control','no-cache, max-age=0')
        super().end_headers()
    def do_GET(self):
        if self.path == '/course-health':
            body=json.dumps({'app':'cv-maths-course','root':str(ROOT),'version':3}).encode()
            self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()
    def send_head(self):
        path=Path(self.translate_path(self.path))
        if path.is_file() and path.suffix.lower()=='.mp4':
            length=path.stat().st_size
            match=re.fullmatch(r'bytes=(\d*)-(\d*)',self.headers.get('Range',''))
            start,end=0,length-1
            if match:
                if match[1]: start=int(match[1]);end=min(int(match[2]) if match[2] else end,end)
                elif match[2]: start=max(0,length-int(match[2]))
                if start>=length or start>end:
                    self.send_response(416);self.send_header('Content-Range',f'bytes */{length}');self.end_headers();return None
            self.send_response(206 if match else 200)
            self.send_header('Content-Type','video/mp4');self.send_header('Accept-Ranges','bytes')
            self.send_header('Content-Length',str(end-start+1))
            if match:self.send_header('Content-Range',f'bytes {start}-{end}/{length}')
            self.end_headers()
            stream=path.open('rb');stream.seek(start);self.remaining=end-start+1
            return stream
        self.remaining=None
        return super().send_head()
    def copyfile(self,source,outputfile):
        if self.remaining is None:return super().copyfile(source,outputfile)
        remaining=self.remaining
        while remaining:
            block=source.read(min(64*1024,remaining))
            if not block:break
            outputfile.write(block);remaining-=len(block)
    def log_message(self,format,*args):
        pass

if __name__=='__main__':
    ThreadingHTTPServer(('127.0.0.1',50101),CourseHandler).serve_forever()
