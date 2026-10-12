"""Refresh the course index, retaining authored files and learner records."""
from pathlib import Path
import json
base=Path(__file__).resolve().parent
lessons=json.loads((base/'later-lessons.json').read_text(encoding='utf-8'))
syllabus=base/'syllabus.md'
text=syllabus.read_text(encoding='utf-8')
notice='**Course expansion:** All 48 lessons are available in the interactive webpage. Lessons 05-48 now include worked explanations, four exercises with solutions, checkpoints and selected PDF readings. Five NumPy notebooks support the sequence. Study at your own pace; the 24-week schedule is a guide.\n\n'
if '**Course expansion:**' not in text: syllabus.write_text(notice+text,encoding='utf-8')
index='# Lessons 05-48: worked answers\n\nAttempt each exercise before opening its answer. These solutions also appear in each lesson’s Practice tab.\n\n'
for lesson in lessons:
    index+=f'## Lesson {lesson["id"]:02d} - {lesson["title"]}\n\n'
    for i,(q,a) in enumerate(zip(lesson['exercises'],lesson['solutions']),1):
        index+=f'**{i}. {q}**\n\n{a}\n\n'
(base/'later-solutions.md').write_text(index,encoding='utf-8')
(base/'capstone-template.md').write_text('''# Maths for computer vision: capstone report

## 1. Question and hypothesis

Task, baseline, one improvement, predicted outcome and what would contradict it.

## 2. Data protocol

Generator/dataset, sample and class counts, grouping, split identifiers, seeds, preprocessing fitted on training data, label conventions and held-out test policy.

## 3. Mathematical model

Input, parameter and output shapes; forward equations; loss assumptions and reduction; one derivative; optimizer and training budget.

## 4. Controlled comparison

What changes, what is fixed, validation choices, repeats and selected final procedure.

| Run | Seed | Model | Training metric | Validation metric | Test metric | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | Baseline | | | | |
| 2 | | Improvement | | | | |

## 5. Error analysis

Three failures or explicitly declared stressful cases, group counts, confidence interpretation, one tested explanation and one unresolved hypothesis.

## 6. Limitations and next experiment

Population and generator assumptions, sampling uncertainty, shift conditions, metric conventions and a concrete next comparison.

## 7. Reproduction

Exact run sequence, dependencies, dtype, seeds, saved parameters and preprocessing statistics. A fresh run should produce the stated calculation and explain any stochastic differences.

## Readiness rubric

For each item use 0=missing, 1=partial, 2=clear and reproducible. Revisit every item below 2 before presenting.

1. A specific question with a stated hypothesis.
2. Training-only preprocessing and a defensible split protocol.
3. Correct shapes, objective assumptions and derivative calculation.
4. A transparent baseline and one controlled comparison.
5. Metrics with counts, denominators and matching conventions.
6. Failure analysis that distinguishes evidence from hypotheses.
7. Runnable code, settings and an explanation of uncertainty and limits.

The rubric assesses understanding and evidence, not whether the larger model wins.
''',encoding='utf-8')
readme=base/'README.md'
text=readme.read_text(encoding='utf-8').replace('The full curriculum is planned; the first four lessons are authored now, and later teaching can adapt to your answers.','All 48 lessons are authored, with worked examples, practice and checkpoints. Five NumPy notebooks support the course; framework autograd is an optional extension. Teaching and pacing can adapt to your answers.')
text+='\n## Continue beyond the foundations\n\nOpen the course roadmap to reach any of the 48 lessons. Each lesson has reading, an interactive experiment and practice with worked answers. The study plan now covers all 24 weeks.\n\nThe original printable guide covers the roadmap and first four lessons; the expanded lessons and solutions are in the webpage and editable Markdown files. See [later solutions](later-solutions.md) and the [capstone template](capstone-template.md). Browser notes and completion records are preserved.\n'
readme.write_text(text,encoding='utf-8')
manifest_path=base/'manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest.update(authored_lesson_count=48,continuation_exercise_count=176,interactive_page='index.html',notebook_count=5,expanded_on='2026-10-11')
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('Refreshed course index, continuation solutions, capstone template and manifest.')
