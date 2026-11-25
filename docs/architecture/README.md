# Current architecture

`apps/web` is the sole deployable. Astro reads a checked-in sample catalog at build time, validates entry data, and generates static files. The release metadata route identifies the Git commit baked into the built site. Cloudflare Pages serves the immutable file set. There is no external catalog provider, database, or server process in production.

Codex Cloud and GitHub Actions use Node 24.22.3, npm 11.19.1, Python 3.12.14, and uv 0.13.9. The npm and uv lockfiles pin dependencies. Setup downloads Task, Gitleaks, and actionlint from their release projects and verifies the pinned archive checksums. The supported setup targets are Linux x86-64 and arm64.

The pre-commit hook runs checks against the work tree and Gitleaks against the index. CI repeats the checks on the merged PR candidate or actual trunk commit and scans the new commit range. CI is the authority on merge readiness. The artifact contract exercises the catalog page, source link, and revision over HTTP. Schema migration checks become required when a database is added. Add a deterministic contract and live provider verification when an external integration is introduced.

## Collect evidence manually

From the repository root, after bootstrap:

```sh
node --use-env-proxy scripts/collect-evidence.mjs
```

The command collects public GitHub REST metadata for the four inventory add-ons selected in [issue #9](https://github.com/efileger/wow-signal/issues/9), without building the site or scoring anything. A successful run makes 20 serial requests; GitHub’s anonymous limit is 60/hour. An optional read-only `GITHUB_TOKEN` increases the quota. Never put tokens in the command arguments or source. The Node proxy option works in Codex Cloud and has no effect when no proxy is configured. The collector stops on provider errors, rate limits, or timeouts; respect GitHub’s returned retry/reset time before retrying.

Each run writes a new, atomically published JSON snapshot to `.cache/evidence/` (or the output directory passed as the first argument) and prints its path. Previous complete snapshots are never overwritten; incomplete or failed runs publish nothing. Review and retain complete snapshots needed for replay in `evidence/snapshots/`; that directory includes a live sample collected on November 25, 2026.

The schema version 1 snapshot contains a collection timestamp, provider ID, target game client, stable add-on and repository IDs, and groups of values with the API source URL and time of observation. It records repository metadata, the first stable release in a bounded sample of five (including ZIP asset download counts), resolved commit SHA, TOC interface IDs, and workflow filenames at that SHA. If no stable release is in the sample, the default branch commit is used and the release value is null. Optional unknown values are null, which is distinct from zero or an observed empty array. A missing TOC or workflow path is also null; no code, issue text, contributor data, or raw provider responses are saved.

Manifest interface IDs are declarations, not observed compatibility; workflow filenames are not evidence that checks succeeded or that AI was used. Downloads may span game clients and do not indicate installs or quality. The collection deliberately omits scoring, broad discovery, scheduling, and issue sampling. Local JSON storage is sufficient for replay at this scale.
