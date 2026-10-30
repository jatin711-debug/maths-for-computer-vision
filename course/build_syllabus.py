"""Write syllabus.md and progress.md from the built course data, so they cannot drift from study-path.json.

Run after build_web_data.py: python course/build_syllabus.py
"""
from pathlib import Path
import json

BASE=Path(__file__).resolve().parent
text=(BASE/'course-data.js').read_text(encoding='utf-8').removeprefix('window.CV_COURSE = ').rstrip().rstrip(';').replace('<\\/','</')
course=json.loads(text)
labs=json.loads((BASE/'practical'/'manifest.json').read_text(encoding='utf-8'))
modules=sorted(course['modules'],key=lambda m:m['step'])
plan=course['plan'];core_weeks=course['path']['coreWeeks'];total_weeks=len(plan)
hours=lambda weeks:round(sum(s['minutes'] for week in weeks for s in week)/60)
core_hours,extension_hours=hours(plan[:core_weeks]),hours(plan[core_weeks:])
core_lessons=sum(len(m['lessonIds']) for m in modules if not m.get('extension'))
extension_lessons=sum(len(m['lessonIds']) for m in modules if m.get('extension'))
weeks_of=lambda m:f'Week {m["weeks"]}' if '-' not in m['weeks'] else f'Weeks {m["weeks"]}'
def lab_weeks(slug):
    weeks=[i for i,week in enumerate(plan,1) if any(s.get('lab')==slug for s in week)]
    return str(weeks[0]) if len(weeks)==1 else f'{weeks[0]}-{weeks[-1]}'
def module_labs(m):
    slugs=list(dict.fromkeys(s['lab'] for i,week in enumerate(plan) if course['path']['weeks'][i]['module']==m['n'] for s in week if s.get('lab')))
    return [next(lab for lab in labs if lab['slug']==slug) for slug in slugs]

out=[f'''**Course overview:** All 68 lessons are available in the interactive webpage: a {core_lessons}-lesson core plus an optional {extension_lessons}-lesson extension. Every lesson opens with plain-word primers for its new ideas, also collected in the Glossary. Every lesson has worked explanations, auto-checked practice with fresh numbers, four written exercises with solutions, a checkpoint and selected PDF readings that open at the cited page. Study at your own pace; the weekly schedule is a guide.

# Maths for Computer Vision - {core_weeks}-week core with a {total_weeks-core_weeks}-week extension

Designed for a learner who needs a refresher, can study 8-10 hours weekly, and wants recognition, detection and segmentation. The core plan is {core_hours} hours and the extension adds {extension_hours}, practical labs included. Timing is adjustable; advance by understanding, not by date.

## Course outcomes

Read CV mathematics, derive small models and their gradients, implement numerical ideas, train and evaluate real vision models, justify losses and metrics, and evaluate experiments. This is a strong foundation with an entry into advanced study; expertise and research depth require further practice.

## How to read this order

Lesson and module numbers are permanent labels, not a reading order, so follow the table below. Module 09 comes third because filters need only vectors, which puts real image work in the first six weeks. Gradient descent (Module 08) comes before the classifier that uses it (Module 07). Lessons 32 and 35 sit in Module 10 because they need neural-network layers. Lessons 55 and 56 sit in Module 11 because detection and segmentation depend on them.

## Weekly rhythm

A usual week has two 90-minute concept sessions, a 90-minute notebook or experiment session, a 60-minute reading session, a 90-minute practice session and a 60-minute checkpoint review: 8 hours. Weeks with a practical lab take up to 10 hours, and two weeks in Module 11 go entirely to labs. A week with one lesson has a second pass in place of the other, because that material needs the time. Weeks 1-2 use the starter schedule in first-two-weeks.md.

## Reading strategy

Lessons first, selected sections second, exercises third. Use MML as the mathematical bridge; CS205A for numerical depth; Szeliski for CV; Guo selectively for later geometry. Section numbers refer to verified contents, not PDF viewer page numbers. Stretch topics are optional.

| Step | Weeks | Module | Main result |
|---|---|---|---|''']
out+=[f'| {m["step"]} | {m["weeks"]} | {m["n"]:02d}. {m["title"]}{" (extension)" if m.get("extension") else ""} | {m["artifact"]} |' for m in modules]
out.append('')
for m in modules:
    tag=', extension' if m.get('extension') else ''
    out.append(f'## Module {m["n"]:02d} - {m["title"]} ({weeks_of(m)}{tag})\n')
    out.append(m['purpose']+(' '+m['after'] if m.get('extension') else '')+'\n')
    out.append('### Lessons\n')
    out+=[f'- {line}' for line in m['lessons']]
    out.append('\n### By the end\n')
    out+=[f'- {line}' for line in m['outcomes']]
    out+=['\n### Targeted reading\n',m['reading'],'\n### Practice\n',m['practice'],'\n### Lab\n',m['lab']]
    extra=module_labs(m)
    if extra:
        out.append('\n### Practical labs in this module\n')
        out+=[f'- Lab {lab["id"]}: {lab["title"]} (week {lab_weeks(lab["slug"])})' for lab in extra]
    out+=['\n### Mastery gate\n',m['gate'],'\n### Submit\n',m['artifact'],'']
out.append('''## Practical labs

Twelve labs apply the maths to real images in installed Python. Each sits in the weekly plan right after the lessons it needs. Lab 10 is optional.

| Lab | Weeks | Title | Do these lessons first |
|---|---|---|---|''')
out+=[f'| {lab["id"]} | {lab_weeks(lab["slug"])} | {lab["title"]} | {", ".join(str(n) for n in lab["requires"])} |' for lab in labs]
out.append('''
## Capstone rubric

There is one capstone: Practical Lab 12, reported with the capstone template. The Module 12 notebook is the alternative route if you have no local Python environment for the lab.

- Mathematical explanation: 30%. Define shapes, assumptions, objective and relevant derivatives.
- Experiment design: 25%. Fixed split, seed, baseline and one controlled comparison.
- Evaluation and errors: 25%. Appropriate metrics, failure cases, uncertainty and limitations.
- Reproducibility and communication: 20%. Runnable code and a clear report.

## Advanced continuation after the core

Modules 13-17 carry paths 1 and 4 below a long way: homogeneous coordinates, homographies, cameras and robust fitting; matrix calculus and information theory; local features, optical flow and tracking; epipolar geometry, stereo, bundle adjustment on the rotation manifold and neural rendering; set prediction, VAEs, diffusion models and Gaussian splatting. Each of those lessons opens as soon as what it needs is done, and the lesson that opens it links to it, so you can take them before or alongside the capstone. Then choose one path: (1) attention and vision transformers, beginning with dot products, softmax and matrix gradients; (2) segmentation and detection objectives, imbalance and evaluation; (3) statistical learning, generalization and uncertainty; (4) geometric CV, adding projective geometry, camera models, rotations and manifold optimization. Guo becomes more central on path 4. Choose primary papers and current implementations when that stage arrives.
''')
(BASE/'syllabus.md').write_text('\n'.join(out),encoding='utf-8')

rows=[f'| {m["n"]:02d}. {m["title"]} | {m["weeks"]} | Not started | |' for m in modules]
progress=(BASE/'progress.md').read_text(encoding='utf-8')
head,_,rest=progress.partition('| Module | Weeks | Status | Evidence / next question |')
table,_,tail=rest.partition('\n\n')
(BASE/'progress.md').write_text(head+'| Module | Weeks | Status | Evidence / next question |\n|---|---|---|---|\n'+'\n'.join(rows)+'\n\n'+tail,encoding='utf-8')
print(f'Wrote syllabus.md and progress.md: {core_weeks}+{total_weeks-core_weeks} weeks, {core_hours}+{extension_hours} hours.')
