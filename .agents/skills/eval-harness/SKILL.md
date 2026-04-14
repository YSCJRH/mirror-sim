# eval-harness

- `name`: eval-harness
- `description`: Run expectation checks, redline checks, and summarize Phase 0 demo quality.
- `triggers`: new expectations, smoke regressions, summary format changes
- `inputs`: run summaries, claims, expectation YAML
- `outputs`: `eval/summary.json`
- `boundaries`: does not implement the product pipeline itself
- `common_errors`: assertions that rely on hidden state, summary files that omit failures
- `minimal_test`: `python -m backend.app.cli eval-demo`
