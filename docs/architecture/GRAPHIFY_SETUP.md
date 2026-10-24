# 🗺️ Codebase Knowledge Graph & Architecture Map (Graphify)

Graphify provides AST-based codebase graph extraction, community clustering, and interactive visual mapping for CareerDesk. It is a developer and documentation tool, completely decoupled from the production runtime and excluded from Firebase Hosting deployments.

---

## 🚀 Viewing the Architecture Visualizer

The codebase graph and report are generated and published under `docs/architecture/`:

1. **Interactive Visual Map:**
   Open [`graph.html`](graph.html) directly in any web browser.
   - Zoom, pan, and search symbols (functions, state variables, event handlers).
   - Color-coded by architectural module/community (Core State, Cloud Sync, Routine, Tracker, MCQ Engine, etc.).
   - Inspect incoming/outgoing dependency edges.

2. **Architecture Analysis Report:**
   Read [`GRAPH_REPORT.md`](GRAPH_REPORT.md).
   - God Nodes (core architectural hubs with the highest connectivity).
   - Cohesion metrics and community groupings across the production JavaScript modules.

---

## 🛠️ Regenerating the Map Locally

### 1. Requirements & Installation
Requires Python 3.10+.
```bash
pip install graphifyy
# or using uv:
uv pip install graphifyy
```

### 2. Run the Builder Script
```bash
python scripts/build_graphify.py
```
This script:
- Scans production JavaScript modules in `assets/js/**`.
- Excludes temporary scratch files, dependencies, and minified vendor scripts (`lucide.min.js`).
- Applies smart architectural labeling to all detected clusters.
- Updates `docs/architecture/graph.html`, `docs/architecture/GRAPH_REPORT.md`, and `docs/architecture/graph.json`.

---

## 🤖 CI / GitHub Actions Automation

The workflow in [`../../.github/workflows/graphify.yml`](../../.github/workflows/graphify.yml) runs whenever changes to `assets/js/**` are pushed:
- Automatically validates graph generation in a clean environment.
- Publishes the summary table directly into the GitHub Actions **Run Step Summary**.
- Uploads the interactive map and report artifacts for easy download.

---

## 🔒 Security & Deployment Notes

- Graphify artifacts and scripts are listed in `firebase.json` under `hosting.ignore`, ensuring internal AST models and function maps are never bundled into the public Firebase web app.
