"""Render a local HTML learning-curve and confusion-matrix report, without plotting dependencies."""
import argparse
import html
import json
from pathlib import Path


def curve(history, keys, title):
    series = [(key, [row.get(key) for row in history]) for key in keys]
    values = [float(v) for _, row in series for v in row if v is not None]
    if not values:
        return ""
    maximum = max(values) or 1.
    colours = ["#165bb0", "#a93424"]
    paths = []
    for j, (key, row) in enumerate(series):
        points = " ".join(f"{55+i*500/max(1,len(row)-1):.1f},{220-float(v)*180/maximum:.1f}" for i,v in enumerate(row) if v is not None)
        paths.append(f'<polyline points="{points}" fill="none" stroke="{colours[j]}" stroke-width="3"/>')
        for i,v in enumerate(row):
            if v is not None:
                paths.append(f'<circle cx="{55+i*500/max(1,len(row)-1):.1f}" cy="{220-float(v)*180/maximum:.1f}" r="3" fill="{colours[j]}"/>')
        paths.append(f'<text x="{55+j*260}" y="280" fill="{colours[j]}">{html.escape(key)}</text>')
    return (f'<h2>{title}</h2><svg viewBox="0 0 620 300" role="img" aria-label="{title} by epoch">'
            '<path d="M55 30V220H565" fill="none" stroke="#555"/>'
            f'<text x="0" y="45">{maximum:.3g}</text><text x="25" y="225">0</text>'
            f'<text x="55" y="247">Epoch {history[0]["epoch"]}</text>'
            f'<text x="475" y="247">Epoch {history[-1]["epoch"]}</text>'+"".join(paths)+"</svg>")


def render(run):
    run = Path(run)
    history = json.loads((run/"history.json").read_text())
    sections = [curve(history, ["train_loss", "val_loss"], "Loss"),
                curve(history, ["val_accuracy", "validation_metric"], "Validation quality")]
    validation = run/"validation.json"
    if validation.exists():
        report = json.loads(validation.read_text())
        cells = "".join("<tr><th>"+html.escape(name)+"</th>"+"".join(f"<td>{v}</td>" for v in row)+"</tr>"
                        for name,row in zip(report["classes"],report["confusion_rows_true_columns_predicted"]))
        headings = "".join("<th>"+html.escape(c)+"</th>" for c in report["classes"])
        sections.append(f'<h2>Confusion matrix</h2><p>Rows are true labels; columns are predictions. Validation n={report["n"]}.</p><div class="table"><table><tr><th>True / predicted</th>{headings}</tr>{cells}</table></div>')
    if (run/"failures.jpg").exists():
        sections.append('<h2>Confident mistakes</h2><img src="failures.jpg" alt="Validation photographs with true and predicted labels">')
    text = ('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>CV experiment report</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#172623;background:#fafaf7}svg,img{max-width:100%;height:auto}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #bbb;text-align:right}.table{overflow:auto}svg text{font:14px system-ui}</style>'
            '<h1>'+html.escape(run.name)+'</h1><p>Inspect the protocol and image-level JSON alongside these plots. Validation curves are development evidence.</p>'+"".join(sections)+"</html>")
    (run/"report.html").write_text(text, encoding="utf-8")
    return run/"report.html"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("run", type=Path)
    print(render(parser.parse_args().run))
