from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI

from backend.app.config import get_settings

app = FastAPI(title="Mirror Engine", version="0.1.0")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "phase": "phase-0"}


@app.get("/demo/report")
def demo_report() -> dict[str, str]:
    report_path = get_settings().artifacts_root / "report" / "report.md"
    if not report_path.exists():
        return {"status": "missing", "message": "Run `make eval-demo` first."}
    return {"status": "ok", "report_path": str(Path(report_path))}
