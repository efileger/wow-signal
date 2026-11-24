# Working on WoW Signal

- When a request changes intended behavior or scope, use [specify-work](.agents/skills/specify-work/SKILL.md) to shape the canonical GitHub issue.
- When implementing an accepted issue, changing runtime behavior, tests, or build tooling, use [implement-and-verify](.agents/skills/implement-and-verify/SKILL.md) before marking work complete.
- When a substantive change is ready for a PR or its behavior changes after review, use [review-change](.agents/skills/review-change/SKILL.md) on the current diff and record the reviewer and revision.

GitHub issues are the canonical specs for agent work. Keep intent, scope, acceptance criteria, dependencies, and progress in the issue. Record durable working agreements here, architecture and operational guides in `docs/architecture/`, architectural decisions in `docs/decisions/`, and reusable workflows in `.agents/skills/`.

Concentrate engineering effort on the evidence and assessment that help players choose add-ons. Use Wardley Mapping as a guide to reuse established capabilities and reserve custom development for material gaps and distinctive product needs. Before introducing tooling or automation, check existing repository and platform capabilities, then maintained open-source options. Prefer configuration and small integrations when sufficient. For a nontrivial choice, record the alternatives and rationale in the issue, considering reliability, ongoing maintenance and cognitive load, licensing, cost, and security.

Prefer one independently deliverable change per issue and short-lived branch. Aim for 50–250 lines of code changed per issue and plan for roughly 500 or fewer. Treat these as sizing guides. If a change is larger, look for a coherent, independently verifiable slice first. Keep a larger batch together when splitting would make delivery or verification harder, and record why in the issue. Merge small changes to `main` frequently and pause feature merges while `main` is red.

Use the existing Cloud checkout. Create branches or external GitHub artifacts within the authority given for the task.

Run `bash scripts/bootstrap` on a fresh checkout and `npm run task -- check` for fast feedback. A change is done when the acceptance criteria are exercised, applicable checks pass, and architecture, decisions, and docs reflect the changed behavior. For an unavailable check or review, state the blocker and keep it out of the passing evidence. Require the GitHub `verify` check to merge. Production delivery uses the [delivery runbook](docs/architecture/delivery.md).
