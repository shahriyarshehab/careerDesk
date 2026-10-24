"""Build a code-only Graphify knowledge graph for CareerDesk (no LLM/API key required)."""
import os
import shutil
from pathlib import Path
from collections import Counter

from graphify.extract import extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

ROOT = Path(__file__).resolve().parents[1]
OUT_GRAPHIFY = ROOT / "graphify-out"
OUT_DOCS = ROOT / "docs" / "architecture"

# Human-readable labels for application modules
MODULE_TITLES = {
    "app.js": "App Shell & Router",
    "master.js": "Script Manifest Loader",
    "core.js": "Core State & Master Subjects",
    "countdown.js": "Exam Countdown Engine",
    "flashcards.js": "Flashcards System",
    "groupchat.js": "Peer Group Chat",
    "home.js": "Dashboard & Hero Hub",
    "dashboard.js": "Dashboard & Analytics",
    "mcq.js": "MCQ Quiz & Exam Engine",
    "profile.js": "Profile & Academic Curriculum",
    "questions.js": "BCS Question Bank Repository",
    "quotes.js": "Motivational Quotes & Wallpaper",
    "routine.js": "Routine & Calendar Schedule",
    "syllabus.js": "Syllabus Checklist Tracker",
    "study-chain.js": "Study Chain & Routine Timeline",
    "tracker.js": "Focus Timer & 24h Heatmap",
    "firebase-config.js": "Firebase Configuration",
    "firebase-sync.js": "Cloud Auth & Firestore Sync",
    "security.js": "WebCrypto AES-GCM & PIN Security",
}

def get_community_labels(graph, communities):
    """Assign descriptive module names to communities based on constituent node sources."""
    labels = {}
    for cid, nodes in communities.items():
        file_counts = Counter()
        for nid in nodes:
            node_data = graph.nodes.get(nid, {})
            sf = node_data.get("source_file")
            if sf:
                fname = Path(sf).name
                file_counts[fname] += 1
        if file_counts:
            top_f, count = file_counts.most_common(1)[0]
            labels[cid] = MODULE_TITLES.get(top_f, top_f)
        else:
            labels[cid] = f"Community {cid}"
    return labels

def main():
    # Only analyze application JavaScript code
    js_root = ROOT / "assets" / "js"
    files = sorted(
        p for p in js_root.rglob("*.js")
        if p.is_file() and p.name != "lucide.min.js"
    )
    if not files:
        raise SystemExit("No source-code files found in assets/js.")

    print(f"Graphify: analyzing {len(files)} CareerDesk core modules...")
    extracted = extract(files)
    detection = {
        "files": {"code": [str(p) for p in files], "document": [], "paper": [], "image": []},
        "total_files": len(files),
        "total_words": sum(len(p.read_text(errors="ignore").split()) for p in files),
    }
    graph = build_from_json(extracted)
    communities = cluster(graph)
    cohesion = score_all(graph, communities)
    labels = get_community_labels(graph, communities)
    gods = god_nodes(graph)
    surprises = surprising_connections(graph, communities)
    questions = suggest_questions(graph, communities, labels)

    for target_dir in [OUT_GRAPHIFY, OUT_DOCS]:
        target_dir.mkdir(parents=True, exist_ok=True)

    report = generate(
        graph, communities, cohesion, labels, gods, surprises, detection,
        {"input": 0, "output": 0}, str(ROOT), suggested_questions=questions,
    )
    
    # Write to docs/architecture
    (OUT_DOCS / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(graph, communities, str(OUT_DOCS / "graph.json"), force=True, community_labels=labels)

    try:
        to_html(graph, communities, str(OUT_DOCS / "graph.html"), community_labels=labels)
        print("Architecture HTML visualization generated in docs/architecture/graph.html")
    except ValueError as exc:
        print(f"HTML visualization skipped: {exc}")

    # Mirror to graphify-out
    (OUT_GRAPHIFY / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    to_json(graph, communities, str(OUT_GRAPHIFY / "graph.json"), force=True, community_labels=labels)
    if (OUT_DOCS / "graph.html").exists():
        shutil.copyfile(OUT_DOCS / "graph.html", OUT_GRAPHIFY / "graph.html")

    print(f"Graphify complete: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges, {len(communities)} communities.")
    print(f"Published documentation: {OUT_DOCS}")

    # If running in GitHub Actions, append summary to $GITHUB_STEP_SUMMARY
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path and Path(summary_path).exists():
        summary_md = f"""## 🗺️ CareerDesk Codebase Knowledge Graph
- **Analyzed modules**: {len(files)} JavaScript files
- **Total nodes**: {graph.number_of_nodes()} functions/abstractions
- **Total connections**: {graph.number_of_edges()} dependency edges
- **Architectural communities**: {len(communities)}

### Top Architectural Hubs (Core Abstractions)
"""
        for i, (node, edge_count) in enumerate(gods[:8], 1):
            summary_md += f"{i}. `{node}` ({edge_count} connections)\n"

        summary_md += "\n*Generated via Graphify. Interactive visualization available at `docs/architecture/graph.html`.*\n"
        with open(summary_path, "a", encoding="utf-8") as f:
            f.write(summary_md)

if __name__ == "__main__":
    main()
