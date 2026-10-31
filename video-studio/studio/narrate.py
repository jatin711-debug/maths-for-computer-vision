"""Local Kokoro-82M narration, cached, with the second each word is spoken.

The voice and timing match the course's existing videos; see the manifest in course/media/fframes.
"""
from __future__ import annotations
import hashlib, json, math, re, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'build' / 'cache' / 'voice'
REVISION, VOICE, LANG, SPEED, RATE = 'f3ff3571791e39611d31c381e3a41a3af07b4987', 'af_heart', 'a', 1.0, 24000
LEAD, PAUSE, OUTRO, TRIM_DB, TRIM_HEAD, TRIM_TAIL = .2, .3, .45, -50, .03, .05
TARGET_LUFS = -17.  # Mono. FFrames plays it on both stereo channels, which measures 3 LU louder: about -14.

# Written form to spoken form, for words the voice would otherwise misread.
SAY = {
    'U-Net': 'you net', 'FPN': 'F P N', 'R-CNN': 'R C N N', 'RANSAC': 'ran sack', 'NeRF': 'nerf',
    'SVD': 'S V D', 'ResNet': 'res net', 'ImageNet': 'image net', 'Kalman': 'Calman', 'KL': 'K L',
    'VAE': 'V A E', 'DETR': 'detter', 'SIFT': 'sift', 'CNN': 'C N N', 'MLP': 'M L P', 'ELBO': 'elbow',
}

_pipe = None
def _pipeline():
    global _pipe
    if _pipe is None:
        import warnings, torch
        warnings.filterwarnings('ignore')
        from kokoro import KModel, KPipeline
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model = KModel(repo_id='hexgrad/Kokoro-82M').to(device).eval()
        _pipe = KPipeline(lang_code=LANG, repo_id='hexgrad/Kokoro-82M', model=model)
    return _pipe


def strip_cues(text):
    return re.sub(r'\{\w+\}', '', text).replace('  ', ' ').strip()


def speakable(text, say):
    for written in sorted(say, key=len, reverse=True):
        text = re.sub(rf'(?<![\w-]){re.escape(written)}(?![\w-])', say[written], text)
    return text


def synthesise(spoken):
    """Returns audio and word times for text with {cue} markers in it."""
    plain = strip_cues(spoken)
    key = hashlib.sha1(f'{REVISION}|{VOICE}|{SPEED}|{plain}'.encode()).hexdigest()[:20]
    wav, meta = CACHE / f'{key}.wav', CACHE / f'{key}.json'
    if not wav.exists() or not meta.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        parts, words, offset, unknown = [], [], 0., []
        for result in _pipeline()(plain, voice=VOICE, speed=SPEED):
            audio = result.audio.detach().cpu().numpy()
            for token in result.tokens or []:
                if '❓' in (token.phonemes or ''): unknown.append(token.text)
                if token.start_ts is not None: words.append([token.text, offset + token.start_ts, offset + (token.end_ts or token.start_ts)])
            offset += len(audio) / RATE
            parts.append(audio)
        audio = np.concatenate(parts)
        loud = np.nonzero(np.abs(audio) > 10 ** (TRIM_DB / 20))[0]
        head = max(0, loud[0] - int(TRIM_HEAD * RATE))
        tail = min(len(audio), loud[-1] + int(TRIM_TAIL * RATE))
        sf.write(wav, audio[head:tail], RATE, subtype='FLOAT')
        meta.write_text(json.dumps(dict(words=[[w, s - head / RATE, e - head / RATE] for w, s, e in words], unknown=unknown), ensure_ascii=False), encoding='utf8')
    audio, _ = sf.read(wav, dtype='float32')
    info = json.loads(meta.read_text(encoding='utf8'))
    if info['unknown']: print('  voice guessed at:', sorted(set(info['unknown'])))
    return dict(audio=audio, words=info['words'], seconds=len(audio) / RATE)


def _word_spans(clip, plain):
    """Finds where each spoken token sits in the text."""
    spans, pos = [], 0
    for word, start, end in clip['words']:
        found = plain.find(word, pos)
        if found < 0: continue
        spans.append((found, start, end))
        pos = found + len(word)
    return spans


def cue_times(clip, spoken, chapter_start):
    """Maps each {cue} in the text to the absolute second of the word after it."""
    plain, cues, pos, offset_text = strip_cues(spoken), {}, 0, spoken
    spans = _word_spans(clip, plain)
    for match in re.finditer(r'\{(\w+)\}', spoken):
        before = strip_cues(spoken[:match.start()] + 'x')[:-1]
        at = len(before)
        cues[match.group(1)] = chapter_start + next((s for i, s, _ in spans if i >= at), clip['seconds'])
    return cues


def sentences(clip, display, spoken, chapter_start):
    """Caption cues: one per sentence, in the written text, timed from the spoken words."""
    plain = strip_cues(spoken)
    split = lambda text: re.split(r'(?<=[.?!:])\s+', text)
    shown, said = split(display), split(plain)
    if len(shown) != len(said): raise ValueError(f'Written and spoken text split differently: {display}')
    spans, out, pos = _word_spans(clip, plain), [], 0
    for text, part in zip(shown, said):
        low, high = pos, pos + len(part)
        inside = [(s, e) for i, s, e in spans if low <= i < high]
        pos = high + 1
        if inside: out.append([chapter_start + inside[0][0], chapter_start + inside[-1][1], text])
    return out


def _lufs(path):
    log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1])


def assemble(chapters, total, out):
    """Lays the chapters on one track and matches the course's loudness with a single gain."""
    mix = np.zeros(math.ceil(total * RATE) + RATE // 4, dtype=np.float32)
    for ch in chapters:
        start = round(ch['time'] * RATE)
        mix[start:start + len(ch['clip']['audio'])] += ch['clip']['audio']
    sf.write(out, mix, RATE, subtype='FLOAT')
    gain = 10 ** ((TARGET_LUFS - _lufs(out)) / 20)
    mix = np.clip(mix * gain, -.89, .89)
    sf.write(out, mix, RATE, subtype='PCM_16')
