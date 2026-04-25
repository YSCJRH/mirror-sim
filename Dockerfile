FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    MIRROR_ENV=production \
    MIRROR_PUBLIC_DEMO_MODE=1 \
    MIRROR_ALLOW_ANONYMOUS_RUNS=0 \
    MIRROR_HOSTED_MODEL_ENABLED=0 \
    PORT=3000 \
    PYTHON=/opt/mirror-venv/bin/python \
    PATH=/opt/mirror-venv/bin:$PATH

WORKDIR /app/mirror

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        python3 \
        python3-pip \
        python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY frontend/package*.json frontend/
RUN npm ci --prefix frontend

COPY . .

ARG MIRROR_COMMIT_SHA=unknown
ENV MIRROR_COMMIT_SHA=$MIRROR_COMMIT_SHA

RUN python3 -m venv /opt/mirror-venv \
    && python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -e backend \
    && python -m backend.app.cli eval-demo \
    && npm run build --prefix frontend \
    && npm prune --prefix frontend --omit=dev \
    && chmod +x scripts/bootstrap-production.sh

WORKDIR /app/mirror/frontend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "const port = process.env.PORT || '3000'; fetch(`http://127.0.0.1:${port}/api/ready`).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/app/mirror/scripts/bootstrap-production.sh"]
CMD ["sh", "-c", "cd /app/mirror/frontend && exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port ${PORT:-3000}"]
