"""Python examples for lessons defined in extensions/: each lesson_NN.py has add(EXAMPLES, example)."""
from importlib import import_module
from pathlib import Path


def add_examples(examples, example):
    for path in sorted(Path(__file__).parent.glob("lesson_*.py")):
        import_module(f"{__name__}.{path.stem}").add(examples, example)
