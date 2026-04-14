# graph-build

- `name`: graph-build
- `description`: Build a light evidence-backed graph from chunks.
- `triggers`: entity extraction work, relation rules, graph schema updates
- `inputs`: `chunks.jsonl`
- `outputs`: `graph.json`
- `boundaries`: does not generate personas or run simulation
- `common_errors`: relations without evidence, over-generalized extraction, unstable entity IDs
- `minimal_test`: `python -m backend.app.cli build-graph artifacts/demo/ingest/chunks.jsonl --out artifacts/demo/graph`
