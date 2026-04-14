# safety-guardrails

- `name`: safety-guardrails
- `description`: Enforce demo-data, redline, and phrasing safeguards before reports are exported.
- `triggers`: safety policy changes, prohibited domain checks, wording restrictions
- `inputs`: scenario text, corpus text, report text
- `outputs`: pass/fail decision with reasons
- `boundaries`: does not rewrite unsafe requests into a nearby unsafe variant
- `common_errors`: letting real-person language slip through, allowing unsupported certainty phrasing
- `minimal_test`: `python -m pytest backend/tests -q`
