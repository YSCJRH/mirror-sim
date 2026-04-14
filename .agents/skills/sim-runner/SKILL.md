# sim-runner

- `name`: sim-runner
- `description`: Run the bounded, deterministic turn-based simulation and write trace artifacts.
- `triggers`: action-set changes, snapshot fixes, seeded-run regressions
- `inputs`: normalized scenario, graph, personas
- `outputs`: `run_trace.jsonl`, snapshots, `summary.json`
- `boundaries`: does not turn into an unconstrained multi-agent swarm
- `common_errors`: non-deterministic branching, unreadable state patches, missing snapshot files
- `minimal_test`: `python -m backend.app.cli simulate data/demo/scenarios/baseline.yaml --graph artifacts/demo/graph/graph.json --personas artifacts/demo/personas/personas.json --out artifacts/demo/run/baseline`
