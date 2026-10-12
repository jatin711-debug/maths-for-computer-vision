"""Execute all snippets and compare their outputs with the live JavaScript lessons."""
from contextlib import nullcontext, redirect_stdout
from importlib.util import find_spec
from pathlib import Path
import io
import json
import math
import subprocess

from build_python_examples import EXAMPLES, render_code


def main():
    root = Path(__file__).resolve().parent
    fixtures = json.loads(subprocess.check_output(
        ["node", str(root / "python-fixtures.cjs")], text=True, encoding="utf-8"))
    report = dict(lessons=0, pythonExecutions=0, torchExecutions=0,
                  torchExecutionsByDevice={}, numericalComparisons=0, issues=[])
    torch_available = find_spec("torch") is not None
    devices = []
    if torch_available:
        import torch
        devices = ["cpu"] + (["cuda"] if torch.cuda.is_available() else [])
        report["torchVersion"] = torch.__version__
        report["cudaAvailable"] = torch.cuda.is_available()
        if report["cudaAvailable"]:
            report["cudaDevice"] = torch.cuda.get_device_name(0)
        report["torchExecutionsByDevice"] = dict.fromkeys(devices, 0)
    lesson_ids = {fixture["id"] for fixture in fixtures}
    assert set(EXAMPLES) == lesson_ids, f"Python examples {sorted(set(EXAMPLES) ^ lesson_ids)} do not match the lessons"
    generated = (root / "python-examples.js").read_text(encoding="utf-8")
    generated_data = json.loads(generated.split("window.CV_PYTHON_EXAMPLES = ", 1)[1].rstrip(";\n"))
    assert generated_data == json.loads(json.dumps(EXAMPLES)), "Rebuild python-examples.js after source edits."

    def run(entry, lesson, case, alternate=False, device=None):
        code = render_code(entry, case["params"])
        if device:
            code = code.replace('device = "cuda" if torch.cuda.is_available() else "cpu"',
                                f'device = "{device}"')
        assert "{{" not in code, "Unresolved input placeholder"
        namespace, stdout = {}, io.StringIO()
        # The legacy lesson 40 snippet uses the default device; the others set it.
        with redirect_stdout(stdout), torch.device(device) if device else nullcontext():
            exec(compile(code, f"lesson-{lesson:02d}-example.py", "exec"), namespace)
        if device:
            tensors = [value for value in namespace.values() if isinstance(value, torch.Tensor)]
            assert tensors and all(value.device.type == device for value in tensors), \
                f"Expected tensors on {device}"
        labels = [label for label, _ in entry["outputs"]]
        expected = {("Autograd gradient" if alternate and label == "Analytic gradient" else label): value
                    for label, value in case["values"]}
        assert labels == list(expected), f"Output labels disagree: {labels} vs {list(expected)}"
        lines = stdout.getvalue().strip().splitlines()
        assert len(lines) == len(labels), "Expected one printed line per result"
        for (label, expression), line in zip(entry["outputs"], lines):
            assert line.startswith(label + ":"), f"Missing printed result: {label}"
            actual, target = eval(expression, namespace), expected[label]
            if target is None:
                assert actual is None, f"{label} should be undefined"
            else:
                scalar = actual.detach().item() if device and isinstance(actual, torch.Tensor) else float(actual)
                assert math.isfinite(scalar), f"Non-finite {label}"
                assert math.isclose(scalar, target, rel_tol=1e-8, abs_tol=1e-8), \
                    f"{label}: Python {actual} != lesson {target}"
            report["numericalComparisons"] += 1
        report["torchExecutions" if alternate else "pythonExecutions"] += 1
        if device:
            report["torchExecutionsByDevice"][device] += 1

    for fixture in fixtures:
        lesson = fixture["id"]
        report["lessons"] += 1
        entry = EXAMPLES[lesson]
        assert entry["notes"] and entry["tryIt"]
        for case in fixture["cases"]:
            try:
                run(entry, lesson, case)
                if "alternate" in entry and torch_available:
                    for device in devices:
                        run(entry["alternate"], lesson, case, alternate=True, device=device)
            except Exception as error:
                report["issues"].append(dict(lesson=lesson, params=case["params"], error=str(error)))
    report["optionalTorchAvailable"] = torch_available
    (root / "python-validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if report["issues"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
