# ADR-0002: Adopt MIT As The Repository License

## Status

- Accepted

## Context

The remote repository for this project, `YSCJRH/mirror-sim`, already exists publicly and currently presents a `GPL-3.0` license on GitHub.  
The local Mirror workspace did not yet contain a `LICENSE` file, which left the local repo state inconsistent with the already-published remote metadata.

`mirror.md` treats license strategy as a governed surface, and specifically calls out license policy changes and upstream dependency/license strategy as decision-record material.

## Decision

- Mirror adopts `MIT` as the repository license.
- The local repository includes an MIT `LICENSE` file and matching package/documentation metadata.
- The remote repository should be brought into alignment by replacing its current GPL-facing license file on first push.
- Future license changes remain governed and must be recorded in `docs/decisions/`.

## Consequences

- Local repository state is now explicit and reviewable.
- The first push to `origin` must update the remote repository's visible license from GPL-3.0 to MIT by replacing the remote license file/history tip.
- Any future move away from MIT should be treated as a deliberate governance change, not an incidental cleanup.

## TODO[verify]

- `TODO[verify]:` Confirm whether a `NOTICE` file is desirable for repo hygiene even though MIT does not require one.
