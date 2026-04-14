# corpus-ingest

- `name`: corpus-ingest
- `description`: Normalize a manifest-backed corpus into documents and chunks with stable IDs.
- `triggers`: manifest changes, ingest CLI work, chunking rules, source-map fixes
- `inputs`: `data/demo/corpus/manifest.yaml`, source documents
- `outputs`: `documents.jsonl`, `chunks.jsonl`
- `boundaries`: does not extract entities or write personas
- `common_errors`: non-stable IDs, chunk text without source mapping, manifest paths that are not relative
- `minimal_test`: `python -m backend.app.cli ingest data/demo/corpus/manifest.yaml --out artifacts/demo/ingest`
