# Working on WoW Signal

## Required skills

- When a request changes intended behavior or scope, use [specify-work](.agents/skills/specify-work/SKILL.md) to shape the canonical GitHub issue.
- Before implementing an issue and again on substantive changes before handoff, use [yagni-review](.agents/skills/yagni-review/SKILL.md) to reduce scope to the smallest correct capability.
- When planning or changing behavior, tests, or build/delivery verification, use [test-hierarchy-review](.agents/skills/test-hierarchy-review/SKILL.md) to choose evidence and review it before handoff.
- When implementing an accepted issue, changing runtime behavior, tests, or build tooling, use [implement-and-verify](.agents/skills/implement-and-verify/SKILL.md) before marking work complete.
- When documentation changes or a substantive change is ready for handoff, use [docs-review](.agents/skills/docs-review/SKILL.md) on changed and affected docs.
- When a substantive change is ready for a PR or its behavior changes after review, use [review-change](.agents/skills/review-change/SKILL.md) on the current diff and record the reviewer and revision.

## Working agreements

GitHub issues are the canonical specs for agent work. Keep intent, scope, acceptance criteria, dependencies, plans, and progress in the issue; retain review and delivery evidence in the PR. Repository docs describe the current system and the minimum context developers and agents need. Record durable working agreements here, architecture and operational guides in `docs/architecture/`, architectural decisions in `docs/decisions/`, and reusable workflows in `.agents/skills/`.

Concentrate engineering effort on the evidence and assessment that help players choose add-ons. Use Wardley Mapping as a guide to reuse established capabilities and reserve custom development for material gaps and distinctive product needs. Before introducing tooling or automation, check existing repository and platform capabilities, then maintained open-source options. Prefer configuration and small integrations when sufficient. For a nontrivial choice, record the alternatives and rationale in the issue, considering reliability, ongoing maintenance and cognitive load, licensing, cost, and security.

Prefer one independently deliverable change per issue and short-lived branch. Aim for 50–250 lines of code changed per issue and plan for roughly 500 or fewer. Treat these as sizing guides. If a change is larger, look for a coherent, independently verifiable slice first. Keep a larger batch together when splitting would make delivery or verification harder, and record why in the issue. Merge small changes to `main` frequently and pause feature merges while `main` is red.

## Batch orchestration

The project owner starts and stops work through Codex, including requests to process the next 5–10 issues. The coordinating agent owns the batch; individual workers own one issue each.

- Select the requested number of ready issues from the canonical backlog in priority/dependency order. Resolve material scope questions before dispatch; work around blocked issues within the authorized batch.
- Run independent issues in separate Codex sessions or subagents with isolated branches/worktrees, subject to available concurrency. Serialize work with dependencies or conflicting changes; queue the rest. If isolation is unavailable, run issues sequentially.
- Give each worker the issue, acceptance criteria, base revision, ownership boundaries, repository instructions, and authorized handoff target. Workers follow the required skills, fix in-scope problems, and return the exact revision/diff, verification results, review disposition, and blockers.
- The coordinator tracks progress in the issues, arranges independent review, resolves integration conflicts, and advances ready work through the existing PR and CI workflow within granted authority. Do not wait for owner input on routine engineering choices. Escalate material product or architecture decisions and blockers that cannot be resolved independently; continue other issues.
- Stop taking new work when the authorized batch is exhausted or the owner says stop; tell active workers to stop as directed, preserve their work, and summarize completed, in-progress, and blocked issues with next actions. Do not expand the batch without authorization.

Use the existing Cloud checkout as the base. Create branches or external GitHub artifacts within the authority given for the task. No new orchestration service is required to follow this workflow.

## Verification and delivery

Run `bash scripts/bootstrap` on a fresh checkout and `npm run task -- check` for fast feedback. A change is done when the acceptance criteria are exercised, applicable checks pass, and architecture, decisions, and docs reflect the changed behavior. For an unavailable check or review, state the blocker and keep it out of the passing evidence. Require the GitHub `verify` check to merge. Production delivery uses the [delivery runbook](docs/architecture/delivery.md).
