# Assessment fixtures

`assessment-v0.1.json` is an independent oracle for [issue #12](https://github.com/efileger/wow-signal/issues/12), derived from the accepted [issue #10 calibration](https://github.com/efileger/wow-signal/issues/10) on November 27, 2026. It is not a snapshot of engine output or a replacement for the evidence schema. No engine implementation was used to produce the expected values.

## Numeric assertions

Map the six ratings, in the listed criterion order, onto the engine's accepted input contract. The respective weights are 25, 20, 15 (purpose), and 20, 10, 10 (engineering). `null` denotes unresolved evidence; zero denotes an assessed adverse result. Scores, coverage and missing-weight range endpoints are percentages on a 0–100 scale. Compare unrounded numbers with an absolute tolerance of `1e-6`; if an interface exposes rounded numbers, test rounding separately. Do not round intermediate pillar calculations.

The four `calibration-*` cases are the owner's hand-calibrated simple unified bags/search judgments. Their IDs join to the checked-in schema-v1 evidence snapshot. Their ordinal judgments and supporting sources come from #10, not from GitHub metadata alone. All four have declared Forever support, not an independent runtime pass. Other cases are synthetic. The `expected` values are fixed literals; do not regenerate them from the scorer.

Independent arithmetic examples:

- AK: purpose contributes 140/3, engineering contributes 320/9, so the estimate is 740/9. Known weight is 90 and the possible full-score range is 220/3 to 250/3.
- Asymmetric sparse: purpose contributes 60; engineering contributes 80/9 (verification 1, documentation 0). Known weight is 50 and the full-score range is 80/3 to 230/3. A global known-weight mean would instead give 160/3, which is incorrect.
- Unknown default: remaining criteria are strong; the estimate is 100, but only 75% of total weight is covered. Replacing unknown with observed zero gives 75 with full coverage.

## Contract scenarios

The `behaviorCases` describe additional assertions for the assessment adapter and comparison contract once they exist. They are scenario inputs, not the production observation schema; adapt them rather than forcing engine internals to match the fixture layout. `example.invalid` URLs and symbolic revisions are synthetic. The stale release case borrows a rating vector only; it makes no claim about the real Bagnon project. Keep the evidence links, dates, and source types from actual observations when replaying calibration cases.

Test stale or mismatched revision evidence without inventing an age threshold: v0.1 requires exposing stale evidence and unresolved judgments but does not specify a fixed expiry interval. Similarly, compatibility gating is outside the weighted estimate; ranking uncertainty is not a mandated tie-break algorithm. An absent pillar withholds the estimate; the range remains the mathematical possible interval, not an estimate or statistical confidence interval.

The numeric vectors run as pure unit tests and the behavior cases as narrow evidence/comparison contract tests in `scripts/assess-evidence.test.mjs`. Run `npm run test:unit`. The fixtures require no provider calls, in-game claims, added dependencies, or live service.
