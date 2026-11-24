---
name: implement-and-verify
description: Use when implementing an accepted issue or changing runtime behavior, tests, or build tooling. Run the repository verification commands and record exact outcomes.
---

# Implement and verify

Read the issue and relevant architecture or ADR. Make the smallest change that satisfies its acceptance criteria. For changed behavior, start with a failing test where practical and exercise the highest stable boundary that demonstrates the requirement. Update affected documentation and record meaningful architecture decisions in the same change.

Run `bash scripts/bootstrap` when provisioning or updating tooling. Use `npm run task -- check` during work and `npm run task -- verify` before claiming completion. Report the checked revision or working diff, outcomes, and any blocked checks. Use the review skill for a substantive handoff.
