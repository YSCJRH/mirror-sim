PYTHON ?= python

.PHONY: setup smoke test eval-demo eval-transfer public-demo-check dev-api dev-web

setup:
	$(PYTHON) -m pip install -e backend

smoke:
	$(PYTHON) -m backend.app.cli smoke

test:
	$(PYTHON) -m pytest backend/tests -q

eval-demo:
	$(PYTHON) -m backend.app.cli eval-demo

eval-transfer:
	$(PYTHON) -m backend.app.cli eval-transfer

public-demo-check:
	$(PYTHON) -m backend.app.cli eval-demo
	$(PYTHON) scripts/scan_frontend_bundle.py --path artifacts/demo
	npm run build --prefix frontend
	$(PYTHON) scripts/scan_frontend_bundle.py
	$(PYTHON) scripts/smoke_public_demo_web.py

dev-api:
	$(PYTHON) -m uvicorn backend.app.main:app --reload

dev-web:
	npm run dev --prefix frontend
