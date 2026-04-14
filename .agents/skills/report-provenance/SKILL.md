# report-provenance

- `name`: report-provenance
- `description`: Generate a run or branch-comparison report with labeled claims and evidence references.
- `triggers`: report format changes, claim-table regressions, evidence coverage fixes
- `inputs`: run summaries, turn traces
- `outputs`: `report.md`, `claims.json`
- `boundaries`: does not emit unsupported certainty language
- `common_errors`: unlabeled claims, empty evidence lists, report text that overstates predictions
- `minimal_test`: `python -m backend.app.cli report artifacts/demo/run/reporter_detained --baseline artifacts/demo/run/baseline --out artifacts/demo/report`
