# Current architecture

`apps/web` is the sole deployable. Astro reads a checked-in sample catalog at build time, validates entry data, and generates static files. The release metadata route identifies the Git commit baked into the built site. Cloudflare Pages serves the immutable file set. There is no external catalog provider, database, or server process in production.

Codex Cloud and GitHub Actions use Node 24.22.3, npm 11.19.1, Python 3.12.14, and uv 0.13.9. The npm and uv lockfiles pin dependencies. Setup downloads Task, Gitleaks, and actionlint from their release projects and verifies the pinned archive checksums. The supported setup targets are Linux x86-64 and arm64.

The pre-commit hook runs checks against the work tree and Gitleaks against the index. CI repeats the checks on the merged PR candidate or actual trunk commit and scans the new commit range. CI is the authority on merge readiness. The artifact contract exercises the catalog page, source link, and revision over HTTP. Schema migration checks become required when a database is added. Add a deterministic contract and live provider verification when an external integration is introduced.
