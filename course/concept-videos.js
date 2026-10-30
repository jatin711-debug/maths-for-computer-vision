/* Local narrated walkthroughs. Generated metadata lives beside the video source. */
(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const items = [...window.CV_CONCEPT_VIDEO_DATA,...(window.CV_LESSON_VIDEO_DATA||[]),...(window.CV_EXPLAINER_VIDEO_DATA||[])].sort((a,b)=>a.lesson-b.lesson||Number(!!b.animated)-Number(!!a.animated));
  // Videos are filed under the module their lesson belongs to now.
  items.forEach(item => { const lesson = window.CV_COURSE?.lessons.find(l => l.id === item.lesson); if (lesson) item.module = lesson.module; });
  let dispose;
  const timeLabel = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;
  const durationLabel = seconds => {
    const total = Math.ceil(seconds), minutes = Math.floor(total / 60), remainder = total % 60;
    return minutes ? `${minutes} min${remainder ? ` ${remainder} sec` : ''}` : `${total} sec`;
  };
  const forModule = number => items.find(item => item.module === number);
  const forLesson = number => items.find(item => item.lesson === number);
  function mount(root, item) {
    stop();
    root.innerHTML = `<section class="concept-video-player" aria-label="Narrated walkthrough: ${escape(item.title)}"><div class="section-heading"><div><div class="eyebrow">${item.animated ? 'ANIMATED EXPLANATION' : 'NARRATED WALKTHROUGH'} · ${durationLabel(item.duration)}</div><h2>${escape(item.title)}</h2></div></div><video controls playsinline preload="none" poster="${item.poster}" aria-label="${escape(item.title)}"><source src="${item.src}" type="video/mp4"><track kind="captions" src="${item.captions}" srclang="en" label="English" default></video><div class="concept-video-tools"><p class="small muted">Pause at the prediction step. Replay a chapter to follow its calculation.</p><label>Playback speed <select aria-label="Walkthrough playback speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option></select></label></div><div class="concept-video-chapters" aria-label="Video chapters">${item.chapters.map((chapter,index) => `<button type="button" class="btn" data-concept-chapter="${index}" aria-pressed="false"><span>${timeLabel(chapter.time)}</span>${escape(chapter.label)}</button>`).join('')}</div><p class="concept-video-status small muted" role="status"></p><details class="concept-video-transcript"><summary>Read the transcript</summary><div data-concept-transcript><p>Expand this section to load the transcript.</p></div></details><a class="text-link" href="${item.src}" download>Download narrated MP4 ↓</a></section>`;
    const video = root.querySelector('video'), buttons = root.querySelectorAll('[data-concept-chapter]');
    const status = root.querySelector('.concept-video-status');
    let pendingSeek = null;
    const updateChapter = () => {
      let active = 0;
      item.chapters.forEach((chapter,index) => {if (video.currentTime + 0.001 >= chapter.time) active = index;});
      buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.conceptChapter) === active)));
    };
    video.addEventListener('timeupdate', updateChapter);
    video.addEventListener('loadedmetadata', () => {
      if (pendingSeek !== null) { video.currentTime = pendingSeek; pendingSeek = null; }
      updateChapter();
    });
    buttons.forEach(button => button.addEventListener('click', () => {
      const chapter = item.chapters[Number(button.dataset.conceptChapter)];
      if (video.readyState >= 1) { video.currentTime = chapter.time; updateChapter(); }
      else { pendingSeek = chapter.time; video.preload = 'metadata'; video.load(); }
      status.textContent = `Jumped to ${chapter.label.toLowerCase()} at ${timeLabel(chapter.time)}. Press Play to watch.`;
    }));
    root.querySelector('select').addEventListener('change', event => {video.playbackRate = Number(event.target.value);});
    root.querySelector('[data-concept-transcript]').innerHTML = item.chapters.map(chapter => `<p><strong>${escape(chapter.label)}.</strong> ${escape(chapter.narration)}</p>`).join('');
    const onHide = () => {if (document.hidden) video.pause();};
    document.addEventListener('visibilitychange', onHide);
    dispose = () => {video.pause(); document.removeEventListener('visibilitychange', onHide);};
  }
  function stop() {dispose?.(); dispose = undefined;}
  window.addEventListener('pagehide', stop);
  window.CV_CONCEPT_VIDEOS = {items, forModule, forLesson, durationLabel, mount, stop};
})();
