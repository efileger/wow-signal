---
name: test-hierarchy-review
description: Choose and review the lowest-cost tests that prove current behavior and repository contracts. Use when planning or changing behavior, tests, or build and delivery verification, and at handoff for those changes.
---

# Test hierarchy review

Maximize confidence per unit of feedback time and maintenance. Tests are executable evidence of actual supported behavior, not targets for an arbitrary coverage percentage or a way to justify hypothetical features.

Map each changed acceptance criterion, regression, or material failure mode to existing coverage. Choose the cheapest reliable test that exercises it through an observable interface. In implementation mode, add or adjust tests as needed. In review-only mode, report gaps and proposed tests without changing the reviewed diff.

| Level                                     | Use when                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Static checks                             | Types, schemas, formatting, lint, manifest validity, or other mechanically enforceable invariants.                                    |
| Unit                                      | Pure logic, decisions, data transformations, and edge cases; use real in-process collaborators when cheap.                            |
| Narrow integration / component / contract | Module wiring, real storage or serialization, interfaces between components, or provider contracts that a unit test cannot establish. |
| Artifact / end-to-end / acceptance        | Build output, critical user journeys, deployment wiring, or behavior requiring the assembled system.                                  |
| Live or manual verification               | Real external environment, exploratory usability, or other evidence that cannot be established reliably by local automation.          |

- Keep most automated coverage in fast, deterministic unit and narrow integration tests. Run fast checks early; use broader or slower checks only for distinct confidence they add and at the appropriate delivery stage. No fixed ratios or new frameworks without need.
- Inspect existing tests and CI commands first. Prefer a failing regression or behavior test before implementation when practical. Assert observable outcomes and meaningful invariants, not private implementation details; avoid mocks that merely repeat assumptions, flaky waits, and duplicated assertions at multiple layers.
- Check that fixtures, contracts, actual data, build output and documented claims agree where relevant. If a broader test exposes a defect, add a focused lower-level regression if it can express that failure, retaining the broader check if it proves a distinct integration contract.
- Keep existing release gates and essential coverage. Replace redundant tests only when the replacement demonstrably preserves their relevant assurance. For a docs-only change, use appropriate docs/skill checks rather than inventing runtime tests.

Report the criterion or risk, chosen test level and evidence, and why any higher-cost test is warranted. Identify uncovered behavior or blocked checks honestly. In implementation mode, use the implementation skill to execute verification; in review-only mode, run authorized existing checks as needed and report their results.

References: [Martin Fowler's Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) and [Ham Vocke's Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html).
