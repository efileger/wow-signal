import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export const methodVersion = "v0.1";
const task = "simple unified bags and search";
const pillars = {
  purpose: { defaultPath: 25, scope: 20, differentiation: 15 },
  engineering: { releaseVerification: 20, maintenance: 10, documentation: 10 },
};
const weights = Object.assign({}, ...Object.values(pillars));
const validRating = (value) =>
  value === null || (Number.isInteger(value) && value >= 0 && value <= 3);
const date = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// Distinct rating vectors can yield the same rational score with tiny float error.
const compareScore = (a, b) => {
  const difference = (b ?? -1) - (a ?? -1);
  return Math.abs(difference) < 1e-9 ? 0 : difference;
};

// Score assessed judgments, never provider activity or popularity metadata.
export function scoreRatings(ratings) {
  assert.ok(
    ratings &&
      typeof ratings === "object" &&
      Object.keys(ratings).length === Object.keys(weights).length,
    "Expected six criterion ratings",
  );
  let knownWeight = 0,
    lower = 0,
    estimate = 0,
    completePillars = true;
  const coverage = {};
  for (const [pillar, criteria] of Object.entries(pillars)) {
    let total = 0,
      known = 0,
      points = 0;
    for (const [id, weight] of Object.entries(criteria)) {
      const rating = ratings[id];
      assert.ok(validRating(rating), `Invalid rating: ${id}`);
      total += weight;
      if (rating !== null) {
        known += weight;
        points += rating * weight;
      }
    }
    coverage[pillar] = (100 * known) / total;
    knownWeight += known;
    lower += points / 3;
    if (known === 0) completePillars = false;
    else estimate += (total * points) / (3 * known);
  }
  return {
    score: completePillars ? estimate : null,
    coverage: { ...coverage, overall: knownWeight },
    range: [lower, lower + (100 - knownWeight)],
  };
}

function validUrl(value) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validateSource(source, asOf) {
  assert.ok(
    source &&
      text(source.url) &&
      ["claimed", "inspected", "observed"].includes(source.type) &&
      date(source.observedAt) &&
      Date.parse(source.observedAt) <= Date.parse(asOf),
    "Invalid observation source or date",
  );
  assert.ok(validUrl(source.url), "Expected HTTP(S) evidence URL");
}

function observationStatus(observation, revision, asOf) {
  assert.ok(
    text(observation.revision) &&
      text(observation.rationale) &&
      Array.isArray(observation.sources) &&
      observation.sources.length > 0,
    "Observation requires revision, rationale and sources",
  );
  for (const source of observation.sources) validateSource(source, asOf);
  assert.ok(
    [undefined, "stale", "conflicting"].includes(observation.status),
    "Invalid observation status",
  );
  if (observation.revision !== revision || observation.status === "stale")
    return "stale";
  return observation.status === "conflicting" ? "conflicting" : "current";
}

function dimension(id, observation, revision, asOf) {
  if (observation == null)
    return {
      id,
      weight: weights[id],
      rating: null,
      status: "unknown",
      rationale: "No assessed observation for this criterion.",
      observation: null,
    };
  assert.ok(validRating(observation.rating), `Invalid observed rating: ${id}`);
  const status = observationStatus(observation, revision, asOf);
  if (
    id === "releaseVerification" &&
    status === "current" &&
    observation.rating === 3
  ) {
    assert.ok(
      observation.checkOutcome === "passed" &&
        observation.sources.some((source) => source.type !== "claimed"),
      "Strong release verification requires a documented passing check",
    );
  }
  return {
    id,
    weight: weights[id],
    rating: status === "current" ? observation.rating : null,
    status:
      status === "current" && observation.rating === null ? "unknown" : status,
    rationale: observation.rationale,
    observation,
  };
}

function compatibility(addon, runtime, asOf, client) {
  const declaration = addon.clientDeclaration;
  assert.ok(
    declaration &&
      (declaration.value === null ||
        (Array.isArray(declaration.value) &&
          declaration.value.every(Number.isSafeInteger))) &&
      date(declaration.source?.observedAt) &&
      validUrl(declaration.source?.url),
    "Invalid client declaration",
  );
  const declared =
    declaration.value === null
      ? "unknown"
      : declaration.value.includes(client)
        ? "declared"
        : "not-declared";
  let runtimeStatus = "unknown";
  let evidenceStatus = "unknown";
  if (runtime != null) {
    assert.ok(
      ["compatible", "incompatible"].includes(runtime.outcome),
      "Invalid runtime outcome",
    );
    assert.ok(
      runtime.clientInterface === client,
      "Runtime observation targets a different client",
    );
    evidenceStatus = observationStatus(runtime, addon.revision.value.sha, asOf);
    assert.ok(
      runtime.sources.some((source) => source.type === "observed"),
      "Runtime observation requires direct evidence",
    );
    if (evidenceStatus === "current") runtimeStatus = runtime.outcome;
  }
  const status =
    runtimeStatus === "incompatible"
      ? "incompatible"
      : runtimeStatus === "compatible"
        ? "verified"
        : evidenceStatus === "conflicting"
          ? "unknown"
          : declared === "declared"
            ? "declared"
            : "unknown";
  return {
    status,
    recommendation:
      status === "incompatible"
        ? "ineligible"
        : status === "verified"
          ? "eligible"
          : status === "declared"
            ? "provisional"
            : "unknown",
    declaration: { ...declaration, status: declared },
    runtime: {
      status: runtimeStatus,
      evidenceStatus,
      observation: runtime ?? null,
    },
    release: addon.release,
  };
}

export function assessEvidence(snapshot, observations) {
  assert.ok(
    snapshot?.schemaVersion === 1 &&
      snapshot.client?.interface === 16001 &&
      date(snapshot.collectedAt) &&
      Array.isArray(snapshot.addons),
    "Expected Forever evidence snapshot schema v1",
  );
  assert.ok(
    observations?.schemaVersion === 1 &&
      observations.task === task &&
      observations.clientInterface === snapshot.client.interface &&
      date(observations.asOf) &&
      Array.isArray(observations.addons),
    "Expected observations for the v0.1 Forever task",
  );
  const asOf =
    Date.parse(snapshot.collectedAt) >= Date.parse(observations.asOf)
      ? snapshot.collectedAt
      : observations.asOf;
  const byId = new Map();
  for (const observation of observations.addons) {
    assert.ok(
      text(observation.addonId) &&
        !byId.has(observation.addonId) &&
        observation.criteria &&
        typeof observation.criteria === "object" &&
        !Array.isArray(observation.criteria),
      "Invalid or duplicate add-on observations",
    );
    assert.ok(
      Object.keys(observation.criteria).every((key) =>
        Object.hasOwn(weights, key),
      ),
      "Unknown criterion",
    );
    byId.set(observation.addonId, observation);
  }
  const ids = new Set();
  const assessments = snapshot.addons.map((addon) => {
    assert.ok(
      text(addon.id) &&
        !ids.has(addon.id) &&
        text(addon.name) &&
        text(addon.revision?.value?.sha) &&
        date(addon.revision.source?.observedAt) &&
        validUrl(addon.revision.source?.url),
      "Invalid or duplicate snapshot add-on",
    );
    ids.add(addon.id);
    const input = byId.get(addon.id);
    const dimensions = Object.keys(weights).map((id) =>
      dimension(
        id,
        input?.criteria[id],
        addon.revision.value.sha,
        observations.asOf,
      ),
    );
    const summary = scoreRatings(
      Object.fromEntries(dimensions.map(({ id, rating }) => [id, rating])),
    );
    return {
      addonId: addon.id,
      name: addon.name,
      revision: addon.revision,
      compatibility: compatibility(
        addon,
        input?.runtime,
        observations.asOf,
        snapshot.client.interface,
      ),
      dimensions,
      provisional: true,
      ...summary,
    };
  });
  assert.ok(
    [...byId.keys()].every((id) => ids.has(id)),
    "Observation add-on is absent from snapshot",
  );
  // An estimate order is not a definitive rank: coverage, ranges and client
  // evidence remain visible. An ineligible client is never a recommendation.
  assessments.sort(
    (a, b) =>
      Number(a.compatibility.recommendation === "ineligible") -
        Number(b.compatibility.recommendation === "ineligible") ||
      compareScore(a.score, b.score) ||
      compareText(a.addonId, b.addonId),
  );
  return {
    schemaVersion: 1,
    methodVersion,
    evidenceSchemaVersion: snapshot.schemaVersion,
    evidenceCollectedAt: snapshot.collectedAt,
    observationsAsOf: observations.asOf,
    asOf,
    client: snapshot.client,
    task,
    ordering: "provisional-estimate-not-definitive-ranking",
    assessments,
  };
}

if (import.meta.main) {
  try {
    const [snapshotPath, observationPath] = process.argv.slice(2);
    assert.ok(
      snapshotPath && observationPath,
      "Usage: node scripts/assess-evidence.mjs <snapshot.json> <observations.json>",
    );
    const [snapshot, observations] = await Promise.all(
      [snapshotPath, observationPath].map(async (path) =>
        JSON.parse(await readFile(path, "utf8")),
      ),
    );
    console.log(
      JSON.stringify(assessEvidence(snapshot, observations), null, 2),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
