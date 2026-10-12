/* Register lessons that live in their own files (extensions/lesson-NN.js) without editing the large shared data files.
 *
 * CV_EXTEND.lesson(id, {
 *   teaching:  {equation, symbols: [[symbol, meaning]...], connection, trap, question, choices, correct, explanation},
 *   guide:     {title, paragraphs: [p, p], example, controls: [{label, min, max, step, value}], predict, takeaway, notation},
 *   notation:  {symbol: {tex, detail}},         // lesson-specific meanings; they take priority over the shared notation
 *   calculate: params => ({steps: [{title, tex, detail} x4], values: [[label, number|null]...], note, svg?: {body, caption}}),
 *   practice:  [generators],                    // see practice-engine.js
 *   lab:       {name, title, heading, intro, defaults, controls, visual, note, setup?, render, photo?}   // see vision-labs.js
 * })
 * Works in the browser and in the Node validators, where the practice engine or the labs may not be loaded.
 */
(() => {
  'use strict';
  const w = window;
  w.CV_TEACHING = w.CV_TEACHING || {};
  w.CV_GUIDES = w.CV_GUIDES || {};
  w.CV_NOTATION_LESSON = w.CV_NOTATION_LESSON || {};
  w.CV_TUTOR_EXT = w.CV_TUTOR_EXT || {};
  const registry = {};
  function lesson(id, spec) {
    registry[id] = spec;
    if (spec.teaching) w.CV_TEACHING[id] = spec.teaching;
    if (spec.guide) w.CV_GUIDES[id] = spec.guide;
    if (spec.notation) w.CV_NOTATION_LESSON[id] = spec.notation;
    if (spec.calculate) w.CV_TUTOR_EXT[id] = spec.calculate;
    if (spec.practice && w.CV_PRACTICE) w.CV_PRACTICE.add(id, spec.practice);
    if (spec.lab && w.CV_VISION_LABS) w.CV_VISION_LABS.register(spec.lab.name, spec.lab);
  }
  w.CV_EXTEND = {lesson, registry};
})();
