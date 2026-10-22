"""Build a code-only Graphify knowledge graph for CareerDesk (no LLM/API key required)."""
from pathlib import Path

from graphify.extract import extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "graphify-out"
CODE_EXTENSIONS = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py"}
EXCLUDED_PARTS = {".git", ".github", ".agents", "node_modules", "graphify-out", "__pycache__"}

def main():
    files = sorted(
        p for p in ROOT.rglob("*")
        if p.is_file()
        and p.suffix.lower() in CODE_EXTENSIONS
        and not any(part in EXCLUDED_PARTS or part.startswith(".") for part in p.relative_to(ROOT).parts)
        and p.name not in {"lucide.min.js"}
    )
    if not files:
        raise SystemExit("No source-code files found.")

    print(f"Graphify: analyzing {len(files)} source files")
    extracted = extract(files)
    detection = {
        "files": {"code": [str(p) for p in files], "document": [], "paper": [], "image": []},
        "total_files": len(files),
        "total_words": sum(len(p.read_text(errors="ignore").split()) for p in files),
    }
    graph = build_from_json(extracted)
    communities = cluster(graph)
    cohesion = score_all(graph, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    gods = god_nodes(graph)
    surprises = surprising_connections(graph, communities)
    questions = suggest_questions(graph, communities, labels)

    OUT.mkdir(exist_ok=True)
    report = generate(
        graph, communities, cohesion, labels, gods, surprises, detection,
        {"input": 0, "output": 0}, str(ROOT), suggested_questions=questions,
    )
    (OUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(graph, communities, str(OUT / "graph.json"))
    try:
        to_html(graph, communities, str(OUT / "graph.html"), community_labels=labels)
        print("Graphify HTML visualization generated.")
    except ValueError as exc:
        print(f"HTML visualization skipped: {exc}")
    print(f"Graphify complete: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges, {len(communities)} communities.")
    print(f"Outputs: {OUT}")

if __name__ == "__main__":
    main()
