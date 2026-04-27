PYTHON ?= python
MIRROR_PUBLIC_DEMO_BASE_URL ?= https://mirror-public-demo.onrender.com
MIRROR_REMOTE_SMOKE_TIMEOUT ?= 60
MIRROR_REMOTE_SMOKE_RETRIES ?= 5
MIRROR_REMOTE_SMOKE_RETRY_DELAY ?= 2

.PHONY: setup smoke test eval-demo eval-transfer public-demo-check plugin-check plugin-release-check plugin-cli-preflight plugin-app-preflight plugin-remote-check dev-api dev-web

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

plugin-check:
	$(PYTHON) plugins/mirror-codex/scripts/validate_plugin.py
	$(PYTHON) -m pytest plugins/mirror-codex/tests -q
	$(PYTHON) plugins/mirror-codex/scripts/smoke_mcp_stdio.py
	$(PYTHON) plugins/mirror-codex/scripts/acceptance_check.py

plugin-release-check: plugin-check
	$(PYTHON) plugins/mirror-codex/scripts/check_pr_scope.py
	$(PYTHON) scripts/check_no_secrets.py
	$(PYTHON) -m backend.app.cli audit-phase phase2
	git diff --check

plugin-cli-preflight:
	$(PYTHON) plugins/mirror-codex/scripts/cli_marketplace_preflight.py

plugin-app-preflight:
	$(PYTHON) plugins/mirror-codex/scripts/app_protocol_preflight.py

plugin-remote-check:
	$(PYTHON) scripts/smoke_public_demo_web.py --base-url $(MIRROR_PUBLIC_DEMO_BASE_URL) --timeout $(MIRROR_REMOTE_SMOKE_TIMEOUT) --http-retries $(MIRROR_REMOTE_SMOKE_RETRIES) --retry-delay $(MIRROR_REMOTE_SMOKE_RETRY_DELAY)

dev-api:
	$(PYTHON) -m uvicorn backend.app.main:app --reload

dev-web:
	npm run dev --prefix frontend
