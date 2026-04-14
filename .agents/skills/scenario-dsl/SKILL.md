# scenario-dsl

- `name`: scenario-dsl
- `description`: Validate and normalize scenario YAML files into explicit injections.
- `triggers`: scenario schema work, intervention rule changes, validation fixes
- `inputs`: scenario YAML
- `outputs`: normalized scenario JSON
- `boundaries`: does not infer hidden interventions from natural language
- `common_errors`: mixing scenario ID with injection kind, missing seed/turn budget, unsafe scenario text
- `minimal_test`: `python -m backend.app.cli validate-scenario data/demo/scenarios/reporter_detained.yaml --out artifacts/demo/scenario/reporter_detained.json`
