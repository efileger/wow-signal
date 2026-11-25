---
name: yagni-review
description: Review an issue, implementation plan, or change for speculative scope and unnecessary complexity. Use before implementing and again on substantive changes before handoff.
---

# YAGNI review

Prove the current capability with the smallest coherent, correct, independently verifiable implementation. Expect incremental design rather than predicting future requirements.

1. Read the issue, acceptance criteria, current code, and proposed plan or diff. Separate current requirements and existing contracts from possible future needs.
2. Trace each proposed capability, abstraction, configuration option, dependency, service, and migration to a current requirement or demonstrated constraint. Check for an existing capability or a simpler direct implementation first.
3. Prefer concrete code, existing conventions, and reversible decisions. Remove speculative extension points, unused paths, premature generalization, and unrelated cleanup. Consider the cost of adding a capability later versus maintaining it now.
4. Keep necessary correctness, compatibility, reliability, security, and tests. Refactoring that makes the current change easier to understand or safely evolve is not speculative functionality.
5. Simplify the plan or in-scope implementation; for review-only work, report concrete findings. Defer genuine future needs to the issue tracker when useful, without inventing backlog work.

Return a short verdict: what to keep, simplify, or defer, with the relevant issue criterion or evidence and the proposed smallest alternative. If nothing is excessive, say so. Escalate actual product or architectural tradeoffs, not routine simplifications.

References: [Martin Fowler on YAGNI](https://martinfowler.com/bliki/Yagni.html) and [Microsoft's YAGNI skill](https://github.com/microsoft/agentic-loops/blob/master/skills/yagni/SKILL.md).
