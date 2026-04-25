# ADR-0008: Hosted Model Access And Key Safety

## Status

- Accepted

## Context

Mirror's private-beta web path needs a less awkward model-access option than asking every tester to paste an API key into the browser.

The project is also open source, so the most expensive failure mode is accidentally exposing the developer's OpenAI API key in tracked code, docs, logs, artifacts, or client-side bundles.

The current OpenAI API authentication shape uses API keys. Those keys are secrets and must be loaded server-side, not shipped to browsers. A ChatGPT web account is not treated as a browser credential that Mirror can pass through to the OpenAI API.

## Decision

- Add a third session decision provider: `hosted_openai`.
- Keep `openai_compatible` as the BYOK path:
  - users may provide request-scoped `api_key` and `api_base_url`
  - those values remain browser-session/request-only and are not persisted
- Use `hosted_openai` for private-beta hosted GPT access:
  - the OpenAI API key is read only from `MIRROR_HOSTED_OPENAI_API_KEY`
  - the provider must be explicitly enabled with `MIRROR_HOSTED_MODEL_ENABLED=1`
  - the hosted model comes from `MIRROR_HOSTED_DECISION_MODEL` or `MIRROR_DECISION_MODEL`
  - the web API requires `MIRROR_BETA_ACCESS_CODE` before starting or generating hosted sessions
- Add local quota accounting for hosted access:
  - daily per-user branch request limit: `MIRROR_HOSTED_DAILY_REQUEST_LIMIT`
  - per-session branch request limit: `MIRROR_HOSTED_SESSION_BRANCH_LIMIT`
  - usage is written under ignored `state/usage/`
  - user identity is hashed before storage
- Add repository secret hygiene:
  - ignore local `.env` files
  - keep only empty placeholders in `.env.example`
  - run `scripts/check_no_secrets.py` in CI
  - fail if tracked or unignored candidate files contain real-looking OpenAI keys or non-empty key assignments

## Consequences

- Private-beta testers no longer need to bring their own API key for the hosted path.
- The browser never receives the developer's hosted OpenAI API key.
- Hosted use is bounded by application-level beta gating and quota before the model call.
- OpenAI project-level spend/rate limits should still be configured outside the repo as the second hard stop.
- The beta access code is an interim identity gate, not a long-term account system.
- A later OAuth or account-auth layer can replace the beta access code without changing the provider contract, as long as it supplies a stable server-side user identity for quota checks.

## Not Adopted

- Committing a shared API key or any real secret into the repository.
- Sending the hosted API key to the browser.
- Treating a user's ChatGPT web login as an OpenAI API credential.
- Removing the BYOK `openai_compatible` path.
