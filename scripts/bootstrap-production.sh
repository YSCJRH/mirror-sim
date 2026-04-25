#!/usr/bin/env sh
set -eu

cd /app/mirror

if [ "${MIRROR_BOOTSTRAP_DEMO:-1}" != "1" ]; then
  exec "$@"
fi

missing=0
for artifact_path in \
  artifacts/demo/graph/graph.json \
  artifacts/demo/personas/personas.json \
  artifacts/demo/report/report.md \
  artifacts/demo/eval/summary.json
do
  if [ ! -s "$artifact_path" ]; then
    missing=1
  fi
done

if [ "$missing" -eq 0 ]; then
  python -c "import json, pathlib, sys; data=json.loads(pathlib.Path('artifacts/demo/eval/summary.json').read_text(encoding='utf-8')); sys.exit(0 if data.get('eval_name') == 'fog_harbor_phase44_matrix' and data.get('world_id') == 'fog-harbor-east-gate' else 1)" || missing=1
fi

if [ "$missing" -eq 1 ]; then
  echo "Bootstrapping deterministic Mirror demo artifacts."
  python -m backend.app.cli eval-demo
else
  echo "Deterministic Mirror demo artifacts already exist."
fi

exec "$@"
