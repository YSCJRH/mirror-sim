# Phase 1 Public Demo Deployment

## Intent

The production deployment serves the deterministic-only Fog Harbor public demo. It must not require Hosted GPT secrets or write provider secrets into environment files, images, logs, bundles, or artifacts.

## Required Deployment Settings

```env
MIRROR_PUBLIC_DEMO_MODE=1
MIRROR_ALLOW_ANONYMOUS_RUNS=0
MIRROR_HOSTED_MODEL_ENABLED=0
MIRROR_BOOTSTRAP_DEMO=1
```

Only infrastructure settings such as `DEPLOY_DOMAIN`, `MIRROR_IMAGE`, and `MIRROR_COMMIT_SHA` are required for the Docker Compose deployment path.

## Build And Runtime Behavior

- The Docker image generates canonical deterministic demo artifacts before `npm run build --prefix frontend`.
- Runtime bootstrap regenerates canonical demo artifacts when they are missing or when the persisted eval summary is not the Fog Harbor canonical summary.
- Caddy is public by default for Phase 1. Add external access control outside this stack if a private preview is needed.
- Public APIs expose logical artifact ids and content only; they do not expose repository paths.
- The Next.js API path is `/api/public-demo/...`; the FastAPI service also exposes `/public-demo/...` for service-side smoke and future deployment splits.
- Container and deployment health checks use readiness, not only liveness. Missing, unparsable, or workbench-unloadable canonical artifacts return failure status so deploys can roll back clearly.

## Deployment Validation

```bash
python scripts/check_no_secrets.py
python -m backend.app.cli eval-demo
python scripts/scan_frontend_bundle.py --path artifacts/demo
npm run build --prefix frontend
python scripts/scan_frontend_bundle.py
python scripts/smoke_public_demo_web.py
docker build -t mirror-public-demo:test .
docker history --no-trunc mirror-public-demo:test
```

Review Docker history for provider key patterns, public browser key assignments, or hosted-provider secret values. The deploy workflow performs this scan automatically before pushing the image.

## Rollback

The deploy workflow preserves the previous remote `.env.production` as `.env.production.previous` and rolls back if `docker compose up` fails health checks. Reverting to the older private-beta deployment path requires restoring the previous Compose, Caddy, and deploy workflow files and reintroducing any access controls intentionally.
