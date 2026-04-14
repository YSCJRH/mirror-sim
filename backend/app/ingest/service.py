from __future__ import annotations

import re
from pathlib import Path

from backend.app.domain.models import Chunk, Document
from backend.app.safety.service import ensure_safe_demo_text
from backend.app.utils import ensure_dir, load_yaml, write_jsonl


def _split_paragraphs(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]


def ingest_manifest(manifest_path: Path, out_dir: Path) -> tuple[list[Document], list[Chunk]]:
    manifest = load_yaml(manifest_path)
    docs_root = manifest_path.parent
    documents: list[Document] = []
    chunks: list[Chunk] = []

    for entry in manifest["docs"]:
        source_path = docs_root / entry["path"]
        text = source_path.read_text(encoding="utf-8")
        ensure_safe_demo_text(text, context=entry["document_id"])
        document = Document(
            document_id=entry["document_id"],
            title=entry["title"],
            kind=entry["kind"],
            source_path=str(source_path.relative_to(manifest_path.parents[3])),
            created_at=entry.get("created_at"),
            metadata=entry.get("metadata", {}),
        )
        documents.append(document)

        cursor = 0
        for index, paragraph in enumerate(_split_paragraphs(text), start=1):
            start = text.index(paragraph, cursor)
            end = start + len(paragraph)
            cursor = end
            chunks.append(
                Chunk(
                    chunk_id=f"chunk_{document.document_id}_{index:03d}",
                    document_id=document.document_id,
                    text=paragraph,
                    char_start=start,
                    char_end=end,
                    source_id=document.document_id,
                )
            )

    ensure_dir(out_dir)
    write_jsonl(out_dir / "documents.jsonl", documents)
    write_jsonl(out_dir / "chunks.jsonl", chunks)
    return documents, chunks
