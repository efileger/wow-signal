---
name: implement-and-verify
description: Use when implementing an accepted issue or changing runtime behavior, tests, or build tooling. Run the repository verification commands and record exact outcomes.
---

# Implement and verify

Read the issue and relevant architecture or ADR. Use [yagni-review](../yagni-review/SKILL.md) before implementation. Make the smallest change that satisfies the acceptance criteria. Use [test-hierarchy-review](../test-hierarchy-review/SKILL.md) to choose the lowest-cost reliable evidence; start with a failing test where practical. Update affected documentation and record meaningful architecture decisions in the same change. Before handoff, repeat the applicable review passes and use [docs-review](../docs-review/SKILL.md) to check affected documentation.

Run `bash scripts/bootstrap` when provisioning or updating tooling. Use `npm run task -- check` during work and `npm run task -- verify` before claiming completion. Report the checked revision or working diff, outcomes, and any blocked checks. Use the review skill for a substantive handoff.
