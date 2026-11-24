# Working on WoW Signal

- When a request changes intended behavior or scope, use [specify-work](.agents/skills/specify-work/SKILL.md) to shape the canonical GitHub issue.
- When implementing an accepted issue, changing runtime behavior, tests, or build tooling, use [implement-and-verify](.agents/skills/implement-and-verify/SKILL.md) before marking work complete.
- When a substantive change is ready for a PR or its behavior changes after review, use [review-change](.agents/skills/review-change/SKILL.md) on the current diff and record the reviewer and revision.

Work from the issue and prefer one independently deliverable change per short-lived branch. Link dependencies in GitHub, keep issue intent there, and integrate frequently. Pause feature merges while main is red. Use the existing Cloud checkout. Create branches or external GitHub artifacts within the authority given for the task.

Run `bash scripts/bootstrap` on a fresh checkout and `npm run task -- check` for fast feedback. A change is done when the acceptance criteria are exercised, applicable checks pass, and architecture, decisions, and docs reflect the changed behavior. For an unavailable check or review, state the blocker and keep it out of the passing evidence. Require the GitHub `verify` check to merge. Production delivery uses the [delivery runbook](docs/architecture/delivery.md).
