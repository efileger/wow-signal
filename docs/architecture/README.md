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

## Generate a replayable assessment

Run the v0.1 engine against the checked-in cohort and accepted November 25, 2026 manual observations:

```sh
mkdir -p .cache/assessment
node scripts/assess-evidence.mjs \
  evidence/snapshots/2026-11-25T21-31-27.043Z-3a21de7f-58fb-4098-b450-c63033edcc37.json \
  evidence/observations/2026-11-25-inventory-calibration.json \
  > .cache/assessment/inventory.json
```

The engine is offline and does not modify the catalog or deploy the site. The input observation schema v1 joins to the snapshot by stable add-on ID. Each manually judged criterion carries a 0–3 or null rating, assessed revision, rationale, and one or more HTTP(S) sources with observation date and type (`claimed`, `inspected`, or `observed`). An observation may be explicitly stale or conflicting; a different revision is stale automatically. No arbitrary age cutoff is defined. A strong release-verification rating requires documented passing checks on the assessed revision, not merely a workflow filename or claim. Missing or unresolved ratings do not count as zero. A separate optional directly observed runtime outcome addresses compatibility; a manifest declaration alone is provisional. Neither popularity nor contribution volume supplies ratings.

The generated JSON keeps the input snapshot and observation dates, assessed revision, evidence pointers, task, client, method version, and each dimension's effective rating and source observation. Assessment as-of is the later input date, never the execution time. The estimate uses the accepted 60/40 purpose/engineering split even with missing evidence within a pillar; no overall score is published when either pillar lacks a judgment. Coverage by pillar and overall, and the full-score range implied by missing evidence, accompany each provisional estimate. An incompatible add-on is ineligible regardless of score. Result order is provisional, with stable ID tie-breaking, not a definitive ranking. The scope is the Forever simple unified bags/search task; other jobs need their own judgments.

The [independent fixtures](../../evidence/fixtures/README.md) test the calculations and evidence contract using the checked-in snapshot and synthetic cases; run `npm run test:unit`. See [issue #10](https://github.com/efileger/wow-signal/issues/10) for the accepted calibration and its in-game validation gaps. Catalog presentation and refresh automation remain separate work.
