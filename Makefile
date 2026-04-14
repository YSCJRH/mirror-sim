PYTHON ?= python

.PHONY: setup smoke test eval-demo dev-api dev-web

setup:
	$(PYTHON) -m pip install -e backend

smoke:
	$(PYTHON) -m backend.app.cli smoke

test:
	$(PYTHON) -m pytest backend/tests -q

eval-demo:
	$(PYTHON) -m backend.app.cli eval-demo

dev-api:
	$(PYTHON) -m uvicorn backend.app.main:app --reload

dev-web:
	npm run dev --prefix frontend
