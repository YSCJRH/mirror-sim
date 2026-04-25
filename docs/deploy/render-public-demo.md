# Render Public Demo Deployment

## Intent

Render is the fastest no-VM path for Phase 1 because it can build the repo Dockerfile and publish a public `onrender.com` URL without Hosted GPT, BYOK, auth, database, object storage, or provider secrets.

## Blueprint

The repo-root `render.yaml` defines one Docker web service:

- `runtime: docker`
- `dockerfilePath: ./Dockerfile`
- `healthCheckPath: /api/ready`
- public demo flags enabled
- anonymous runtime mutation and hosted model access disabled

## Dashboard Steps

1. In Render, create a new Blueprint from the GitHub repository.
2. Select `main` and the repo-root `render.yaml`.
3. Review the single service named `mirror-public-demo`.
4. Deploy the Blueprint.
5. Open the generated `https://<service>.onrender.com` URL.

No OpenAI or provider API key should be configured for Phase 1.

## Validation

After the Render deploy finishes, verify:

```bash
curl --fail https://<service>.onrender.com/api/health
curl --fail https://<service>.onrender.com/api/ready
```

Expected public behavior:

- `/` loads the guided public demo.
- `/review` loads the advanced read-only review surface.
- `/api/public-demo/manifest` returns only logical artifact ids.
- runtime mutation endpoints return `403` in public demo mode.

