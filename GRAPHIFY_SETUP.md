# Graphify setup for CareerDesk

Graphify is a local developer tool, not a runtime dependency of the deployed app.

## Install

Requires Python 3.10+. Recommended:

```bash
uv tool install graphifyy
```

Alternative: `pipx install graphifyy`. The PyPI package is `graphifyy`; the CLI command is `graphify`.

## Build the code graph

Open this repository in a supported coding assistant and run:

```text
/graphify .
```

For Codex, the project-local skill can also be registered with `graphify install --project --platform codex`.

## Outputs

Graphify normally creates `graphify-out/` with `graph.html` (interactive map), `graph.json` (graph data), and `GRAPH_REPORT.md` (architecture report). These artifacts are generated locally; review them before committing or publishing because they can expose source-code structure.

## CareerDesk context

- No-build HTML, CSS, and vanilla JavaScript app.
- Entry points: `index.html`, `assets/js/app/master.js`, `assets/js/app/app.js`, and `assets/js/core/core.js`.
- Follow script loading order in `assets/js/app/master.js` when tracing feature dependencies.
- Browser `localStorage` is primary storage; Firebase is optional sync/backup.
- Do not add Graphify to production runtime dependencies or Firebase hosting assets.
