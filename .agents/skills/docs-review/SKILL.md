---
name: docs-review
description: Review changed or affected documentation for accuracy, minimalism, and developer experience. Use after substantive changes, on documentation changes, or for a targeted docs audit.
---

# Docs review

Repository documentation is a working guide to the current product and codebase for developers and agents, not a diary of how the project evolved.

1. Identify the reader's task: understand the current architecture, find an owner or entry point, set up, develop, test, operate, recover, or follow a working agreement. Inspect changed and directly affected docs, including README, AGENTS.md, and skills where relevant.
2. Verify statements, links, commands, paths, prerequisites, and expected outcomes against the actual code, configuration, and available evidence. Do not claim an unrun command works. Update source material rather than generated copies.
3. Keep the minimum context needed to complete the task independently: purpose, actionable steps, important constraints, and where to find authoritative details. Put reusable instructions in one place and link to them. Remove duplication, stale advice, unsupported future designs, and text that does not help a reader act or understand an essential constraint.
4. Keep current product direction, meaningful architectural decisions and their rationale, and operational guidance where they remain useful. Issue scope, options explored, progress, plans, and implementation history belong in the canonical issue or PR, not additional repo pages. Preserve required records and don't discard unique useful information merely to shorten a file.
5. Fix in-scope inaccuracies and unnecessary text when editing is authorized. For review-only work, list the smallest proposed changes with file locations. Move or link useful project history to the issue when authorized; otherwise identify it for handoff.

Return a brief verdict with material fixes, missing essential context, and anything that could not be verified. No new document is required if the existing docs are sufficient.

Reference: [Diátaxis](https://diataxis.fr/) for reader needs and task-oriented documentation.
