"""Rebuild later-solutions.md from later-lessons.json and extensions/lesson-NN.json: python course/build_solutions.py"""
from pathlib import Path
import json

base = Path(__file__).resolve().parent
lessons = json.loads((base / 'later-lessons.json').read_text(encoding='utf-8'))
lessons += [json.loads(p.read_text(encoding='utf-8')) for p in sorted((base / 'extensions').glob('lesson-*.json'))]
lessons.sort(key=lambda lesson: lesson['id'])
text = (f'# Lessons {lessons[0]["id"]:02d}-{lessons[-1]["id"]:02d}: worked answers\n\n'
        'Attempt each exercise before opening its answer. These solutions also appear in each lesson’s Practice tab, '
        'below the auto-checked questions with fresh numbers.\n\n')
for lesson in lessons:
    text += f'## Lesson {lesson["id"]:02d} - {lesson["title"]}\n\n'
    for i, (question, answer) in enumerate(zip(lesson['exercises'], lesson['solutions']), 1):
        text += f'**{i}. {question}**\n\n{answer}\n\n'
(base / 'later-solutions.md').write_text(text, encoding='utf-8')
print(f'Wrote solutions for {len(lessons)} lessons ({lessons[0]["id"]}-{lessons[-1]["id"]}).')
