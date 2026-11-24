---
name: review-change
description: Use when a substantive change is ready for a pull request or changes after review. Check the current diff against its issue and report findings and validation evidence.
---

# Review change

Use a fresh Codex review task, native GitHub Codex review, or a human reviewer independent of implementation. Pass the issue, target merge base, and exact revision or diff. Assess observable behavior, failure paths, release safety, and whether existing tests would catch a regression. Ground findings in the changed code and give a concrete consequence. Report any missing evidence.

Resolve blocking findings and review substantive updates again. Record the reviewed revision, reviewer, issue link, and exact verification results in the PR template. If an independent reviewer is unavailable, mark review pending. Treat architecture or product tradeoffs as decisions for the project owner.
