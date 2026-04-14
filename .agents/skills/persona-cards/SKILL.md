# persona-cards

- `name`: persona-cards
- `description`: Produce persona cards from graph evidence for the small demo world.
- `triggers`: persona template changes, role/goals updates, evidence coverage fixes
- `inputs`: `graph.json`
- `outputs`: `personas.json`
- `boundaries`: does not model real people or run free-form dialog
- `common_errors`: persona claims without evidence, conflating public role with private information
- `minimal_test`: `python -m backend.app.cli personas artifacts/demo/graph/graph.json --out artifacts/demo/personas`
