import assert from "node:assert/strict";

const [baseUrl, revision, mode] = process.argv.slice(2);
assert.ok(
  baseUrl && revision,
  "Usage: node scripts/http-contract.mjs URL SHA [--health]",
);
assert.ok(mode === undefined || mode === "--health", "Unknown check mode");

const options = { cache: "no-store", signal: AbortSignal.timeout(10_000) };
function endpoint(path) {
  const url = new URL(path, baseUrl);
  url.searchParams.set("revision", revision);
  return url;
}

const page = await fetch(endpoint("/"), options);
assert.equal(page.status, 200, "Catalog page status");
assert.match(page.headers.get("content-type") ?? "", /^text\/html\b/);
const body = await page.text();
assert.match(body, /<h1\b[^>]*>WoW Signal<\/h1>/);
if (mode !== "--health") {
  assert.match(body, /<h3\b[^>]*>WeakAuras<\/h3>/);
  assert.match(body, /href="https:\/\/github\.com\/WeakAuras\/WeakAuras2"/);
}

const release = await fetch(endpoint("/release.json"), options);
assert.equal(release.status, 200, "Release metadata status");
assert.match(release.headers.get("content-type") ?? "", /^application\/json\b/);
assert.deepEqual(await release.json(), { revision });
console.log(
  `${mode ? "Health check" : "Catalog contract"} passed for ${revision}`,
);
