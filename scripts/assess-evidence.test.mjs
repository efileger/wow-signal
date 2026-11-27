import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assessEvidence, scoreRatings } from "./assess-evidence.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const fixtures = read("evidence/fixtures/assessment-v0.1.json");
const snapshot = read(fixtures.calibrationSnapshot);
const observations = read(
  "evidence/observations/2026-11-25-inventory-calibration.json",
);
const vectors = Object.fromEntries(
  fixtures.scoringCases.map((item) => [item.id, item]),
);
const behavior = Object.fromEntries(
  fixtures.behaviorCases.map((item) => [item.id, item]),
);
const ratings = (item) =>
  Object.fromEntries(
    fixtures.criterionOrder.map((key, index) => [key, item.ratings[index]]),
  );

function expectVector(actual, vector) {
  const expected = vector.expected;
  if (expected.score === null) expect(actual.score).toBeNull();
  else expect(actual.score).toBeCloseTo(expected.score, 8);
  fixtures.coverageOrder.forEach((key, i) =>
    expect(actual.coverage[key]).toBeCloseTo(expected.coverage[i], 8),
  );
  expected.range.forEach((value, i) =>
    expect(actual.range[i]).toBeCloseTo(value, 8),
  );
}

const source = (
  url = "https://example.invalid/fixtures/observation",
  type = "inspected",
  observedAt = "2026-11-25",
) => ({ url, type, observedAt });
const clone = (value) => JSON.parse(JSON.stringify(value));
function simulated(vector, id = "fixture:alpha", revision = "revision-a") {
  const input = clone(snapshot);
  const addon = { ...input.addons[0], id, name: id };
  addon.revision.value.sha = revision;
  input.addons = [addon];
  const manual = {
    ...observations,
    addons: [
      {
        addonId: id,
        criteria: Object.fromEntries(
          Object.entries(ratings(vector)).map(([key, rating]) => [
            key,
            {
              rating,
              revision,
              rationale: `Fixture judgment for ${key}`,
              sources: [source()],
              ...(key === "releaseVerification" && rating === 3
                ? { checkOutcome: "passed" }
                : {}),
            },
          ]),
        ),
      },
    ],
  };
  return { input, manual, addon, entry: manual.addons[0] };
}
function runtime(entry, revision, outcome) {
  entry.runtime = {
    outcome,
    revision,
    clientInterface: 16001,
    rationale: "Synthetic in-client check",
    sources: [source(undefined, "observed")],
  };
}
const result = ({ input, manual }) =>
  assessEvidence(input, manual).assessments[0];

describe("independent scoring oracle", () => {
  it.each(fixtures.scoringCases)("$id", (vector) =>
    expectVector(scoreRatings(ratings(vector)), vector),
  );
  it.each([-1, 4, 1.5, "3", undefined])(
    "rejects invalid ratings (%s)",
    (rating) => {
      expect(() =>
        scoreRatings({
          ...ratings(vectors["all-strong"]),
          defaultPath: rating,
        }),
      ).toThrow(/invalid rating/i);
    },
  );
});

describe("assessment evidence contract", () => {
  it("replays all four accepted manual judgments from the real saved snapshot", () => {
    const actual = assessEvidence(snapshot, observations);
    expect(actual.methodVersion).toBe(fixtures.methodVersion);
    expect(actual.evidenceSchemaVersion).toBe(snapshot.schemaVersion);
    expect(actual.asOf).toBe(fixtures.calibrationAsOf);
    expect(actual.assessments).toHaveLength(4);
    for (const vector of fixtures.scoringCases.filter(
      ({ addonId }) => addonId,
    )) {
      const assessment = actual.assessments.find(
        ({ addonId }) => addonId === vector.addonId,
      );
      const original = snapshot.addons.find(({ id }) => id === vector.addonId);
      expectVector(assessment, vector);
      expect(assessment.dimensions.map(({ rating }) => rating)).toEqual(
        vector.ratings,
      );
      expect(assessment.revision).toEqual(original.revision);
      expect(assessment.compatibility.declaration.source).toEqual(
        original.clientDeclaration.source,
      );
      expect(assessment.compatibility.status).toBe("declared");
      expect(assessment.provisional).toBe(true);
      for (const dimension of assessment.dimensions) {
        const observed = observations.addons.find(
          ({ addonId }) => addonId === vector.addonId,
        ).criteria[dimension.id];
        expect(dimension.observation).toEqual(observed);
      }
    }
  });

  it.each(["declared-only", "known-incompatible", "unknown-compatibility"])(
    "%s",
    (id) => {
      const example = behavior[id];
      const sim = simulated(vectors[example.scoringCase]);
      const evidence = example.evidence;
      sim.addon.clientDeclaration.value =
        evidence.declaredInterface === null
          ? null
          : [evidence.declaredInterface];
      if (evidence.runtimeObservation)
        runtime(sim.entry, "revision-a", "incompatible");
      const actual = result(sim);
      expectVector(actual, vectors[example.scoringCase]);
      expect(actual.compatibility.status).toBe(
        id === "known-incompatible"
          ? "incompatible"
          : id === "declared-only"
            ? "declared"
            : "unknown",
      );
      expect(actual.compatibility.recommendation).toBe(
        id === "known-incompatible"
          ? "ineligible"
          : id === "declared-only"
            ? "provisional"
            : "unknown",
      );
      if (id === "known-incompatible")
        expect(actual.compatibility.declaration.status).toBe("declared");
    },
  );

  it("quiet-compatible-vs-active-compatible", () => {
    const example = behavior["quiet-compatible-vs-active-compatible"];
    const sim = simulated(vectors[example.scoringCase]);
    runtime(sim.entry, "revision-a", "compatible");
    sim.entry.criteria.maintenance.rationale =
      example.evidence.maintenanceObservation;
    sim.addon.repository.value.pushedAt = example.evidence.quietLastChange;
    const quiet = result(sim);
    sim.addon.repository.value.pushedAt = example.evidence.activeLastChange;
    const active = result(sim);
    expect(quiet).toEqual(active);
    expectVector(quiet, vectors[example.scoringCase]);
    expect(quiet.compatibility.status).toBe("verified");
  });

  it("stale-release-check-and-workflow-presence", () => {
    const example = behavior["stale-release-check-and-workflow-presence"];
    const e = example.evidence;
    const sim = simulated(
      vectors[example.scoringCase],
      "fixture:stale",
      e.currentRevision,
    );
    sim.addon.workflows.value = ["tests.yml"];
    sim.entry.criteria.releaseVerification = {
      rating: 3,
      revision: e.checkedRevision,
      rationale: "Passing check for previous revision",
      checkOutcome: e.checkedOutcome,
      sources: [source(e.source, "observed", e.checkedAt)],
    };
    const actual = result(sim);
    const verification = actual.dimensions.find(
      ({ id }) => id === "releaseVerification",
    );
    expect(verification).toMatchObject({
      rating: e.currentReleaseVerification,
      status: "stale",
      observation: sim.entry.criteria.releaseVerification,
    });
    expectVector(actual, vectors[example.scoringCase]);
  });

  it("overlapping-options-not-definitive-ranking", () => {
    const example = behavior["overlapping-options-not-definitive-ranking"];
    const actual = assessEvidence(snapshot, observations);
    expect(actual.ordering).toBe("provisional-estimate-not-definitive-ranking");
    const [ak, bagnon] = actual.assessments;
    expect(ak.score).toBeGreaterThan(bagnon.score);
    expect(ak.range[0]).toBeLessThan(bagnon.range[1]);
    for (const id of example.scoringCases) {
      const vector = vectors[id];
      const entry = actual.assessments.find(
        ({ addonId }) => addonId === vector.addonId,
      );
      expectVector(entry, vector);
      expect(entry.provisional).toBe(true);
    }
  });

  it("different-player-job", () => {
    const example = behavior["different-player-job"];
    expect(assessEvidence(snapshot, observations).task).toBe(
      example.evidence.defaultJob,
    );
    for (const alternative of example.evidence.alternativeJobs)
      expect(() =>
        assessEvidence(snapshot, { ...observations, task: alternative }),
      ).toThrow(/v0.1 Forever task/);
  });

  it("deterministic-tie-and-replay", () => {
    const example = behavior["deterministic-tie-and-replay"];
    const [a, b] = example.evidence.addonIds.map((id) =>
      simulated(vectors[example.scoringCase], id),
    );
    a.input.addons.push(b.addon);
    a.manual.addons.push(b.entry);
    const first = assessEvidence(a.input, a.manual);
    a.input.addons.reverse();
    a.manual.addons.reverse();
    expect(assessEvidence(a.input, a.manual)).toEqual(first);
    expect(first.assessments.map(({ addonId }) => addonId)).toEqual(
      example.evidence.addonIds,
    );
    expect(first.assessments[0].score).toBe(first.assessments[1].score);
    expect(first.ordering).toBe("provisional-estimate-not-definitive-ranking");
    runtime(a.entry, "revision-a", "incompatible");
    expect(assessEvidence(a.input, a.manual).assessments.at(-1).addonId).toBe(
      a.entry.addonId,
    );
  });

  it("breaks mathematically equal scores by ID even when floating values differ", () => {
    const a = simulated({ ratings: [1, 0, 3, 0, 0, 0] }, "fixture:alpha");
    const b = simulated({ ratings: [2, 0, 0, 1, 0, 0] }, "fixture:beta");
    a.input.addons = [b.addon, a.addon];
    a.manual.addons = [b.entry, a.entry];
    const actual = assessEvidence(a.input, a.manual).assessments;
    expect(actual.map(({ addonId }) => addonId)).toEqual([
      "fixture:alpha",
      "fixture:beta",
    ]);
    for (const entry of actual) expect(entry.score).toBeCloseTo(70 / 3, 8);
  });

  it("source-linked-assessment-replay", () => {
    const example = behavior["source-linked-assessment-replay"];
    const e = example.evidence;
    const sim = simulated(vectors[example.scoringCase], e.addonId, e.revision);
    sim.manual.asOf = e.asOf;
    const o = e.observation;
    sim.entry.criteria[o.criterion] = {
      rating: o.rating,
      revision: o.revision,
      rationale: o.rationale,
      sources: [source(o.source, o.sourceType, o.observedAt)],
    };
    const actual = assessEvidence(sim.input, sim.manual);
    expect(actual.methodVersion).toBe(fixtures.methodVersion);
    expect(actual.observationsAsOf).toBe(e.asOf);
    expect(actual.asOf).toBe(snapshot.collectedAt);
    const assessment = actual.assessments[0];
    expect(assessment.dimensions[0].observation).toEqual(
      sim.entry.criteria[o.criterion],
    );
    expectVector(assessment, vectors[example.scoringCase]);
  });

  it("does not infer judgments from provider metadata when no observations exist", () => {
    const actual = assessEvidence(snapshot, { ...observations, addons: [] });
    for (const entry of actual.assessments)
      expectVector(entry, vectors["no-evidence"]);
  });

  it("rejects unsupported versions, orphan observations and unsubstantiated full release credit", () => {
    expect(() =>
      assessEvidence({ ...snapshot, schemaVersion: 2 }, observations),
    ).toThrow(/snapshot schema/);
    const sim = simulated(vectors["all-strong"]);
    delete sim.entry.criteria.releaseVerification.checkOutcome;
    expect(() => result(sim)).toThrow(/documented passing check/);
    sim.entry.criteria.releaseVerification.checkOutcome = "passed";
    sim.entry.criteria.releaseVerification.sources[0].type = "claimed";
    expect(() => result(sim)).toThrow(/documented passing check/);
    sim.entry.addonId = "fixture:orphan";
    expect(() => result(sim)).toThrow(/absent from snapshot/);
  });

  it("retains unresolved conflicting and explicitly stale observations without scoring them", () => {
    const sim = simulated(vectors["all-strong"]);
    sim.entry.criteria.defaultPath.status = "conflicting";
    sim.entry.criteria.maintenance.status = "stale";
    const actual = result(sim);
    expect(actual.dimensions[0]).toMatchObject({
      rating: null,
      status: "conflicting",
      observation: { rating: 3 },
    });
    expect(actual.dimensions[4]).toMatchObject({
      rating: null,
      status: "stale",
      observation: { rating: 3 },
    });
    expect(actual.coverage.overall).toBe(65);
    runtime(sim.entry, "revision-a", "compatible");
    sim.entry.runtime.status = "conflicting";
    expect(result(sim).compatibility).toMatchObject({
      status: "unknown",
      recommendation: "unknown",
      declaration: { status: "declared" },
      runtime: { evidenceStatus: "conflicting" },
    });
  });
});
