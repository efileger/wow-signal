import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Curated repository identities and manifest paths selected in issue #9.
const cohort = [
  ["Bagnon", "Jaliborc/Bagnon", 905553, "Bagnon.toc"],
  ["BetterBags", "Cidan/BetterBags", 716469792, "BetterBags_Camelot.toc"],
  [
    "Bags Forever",
    "APGM82/BagsForever",
    1411699833,
    "BagsForever/BagsForever.toc",
  ],
  ["AKForeverBags", "ajkatz/AKForeverBags", 1379284941, "AKForeverBags.toc"],
];

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value) => typeof value === "string" && value.trim().length > 0;
const isInteger = (value) => Number.isSafeInteger(value) && value >= 0;
const isId = (value) => isInteger(value) && value > 0;
const isDate = (value) => isText(value) && Number.isFinite(Date.parse(value));

function checked(value, predicate, field, optional = false) {
  if (optional && value == null) return null;
  assert.ok(predicate(value), `Invalid ${field} from GitHub`);
  return value;
}

function releaseMetadata(releases) {
  checked(releases, Array.isArray, "releases");
  for (const release of releases) {
    checked(release, isRecord, "release");
    checked(
      release.draft,
      (value) => typeof value === "boolean",
      "release draft",
    );
    checked(
      release.prerelease,
      (value) => typeof value === "boolean",
      "release prerelease",
    );
  }
  const release = releases.find(
    ({ draft, prerelease }) => !draft && !prerelease,
  );
  if (!release) return null;
  const assets = checked(release.assets, Array.isArray, "release assets", true);
  return {
    id: checked(release.id, isId, "release ID"),
    tag: checked(release.tag_name, isText, "release tag"),
    publishedAt: checked(release.published_at, isDate, "release date", true),
    assets:
      assets?.flatMap((asset) => {
        checked(asset, isRecord, "asset");
        const name = checked(asset.name, isText, "asset name");
        if (!name.toLowerCase().endsWith(".zip")) return [];
        return [
          {
            id: checked(asset.id, isId, "asset ID"),
            name,
            downloads: checked(
              asset.download_count,
              isInteger,
              "asset downloads",
              true,
            ),
          },
        ];
      }) ?? null,
  };
}

function declaredInterfaces(file) {
  if (file === null) return null;
  checked(file, isRecord, "TOC file");
  if (file.encoding !== "base64" || !isText(file.content)) return null;
  const text = Buffer.from(file.content, "base64").toString("utf8");
  const declarations = [
    ...text.matchAll(/^\uFEFF?##[ \t]*Interface:[ \t]*([^\r\n]*)/gim),
  ];
  const ids = declarations.flatMap((match) =>
    match[1].split(",").map((value) => value.trim()),
  );
  if (
    !ids.length ||
    ids.some((value) => !/^\d+$/.test(value) || !isId(Number(value)))
  )
    return null;
  return [...new Set(ids.map(Number))];
}

function workflowNames(files) {
  if (files === null) return null;
  checked(files, Array.isArray, "workflow directory");
  return files
    .flatMap((file) => {
      checked(file, isRecord, "workflow entry");
      const name = checked(file.name, isText, "workflow name");
      return file.type === "file" && /\.ya?ml$/i.test(name) ? [name] : [];
    })
    .sort();
}

function githubRequests({ fetcher, clock, token }) {
  let rateLimitReset;
  return async (path, optional = false) => {
    assert.ok(
      !rateLimitReset,
      `GitHub rate limit reached; retry after reset (${rateLimitReset})`,
    );
    const url = `https://api.github.com${path}`;
    const response = await fetcher(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "wow-signal-evidence",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    }).catch((error) => {
      throw new Error(`GitHub request failed for ${url}`, { cause: error });
    });
    const source = { url, observedAt: clock().toISOString() };
    if (response.headers.get("x-ratelimit-remaining") === "0") {
      rateLimitReset =
        response.headers.get("x-ratelimit-reset") ?? "the quota resets";
    }
    if (response.status === 404 && optional) return { value: null, source };
    const retryAfter = response.headers.get("retry-after");
    assert.ok(
      response.ok,
      `GitHub returned ${response.status} for ${url}${retryAfter ? `; Retry-After: ${retryAfter}` : ""}${rateLimitReset ? `; rate limit reset: ${rateLimitReset}` : ""}`,
    );
    return { value: await response.json(), source };
  };
}

// Each observation retains exact endpoint and fetch time; no scoring or raw
// response bodies are persisted. Requests are serialized and globally bounded.
export async function collectEvidence({
  fetcher = fetch,
  clock = () => new Date(),
  token,
} = {}) {
  const get = githubRequests({ fetcher, clock, token });
  const addons = [];
  for (const [name, slug, id, toc] of cohort) {
    const path = `/repos/${slug}`;
    const repository = await get(path);
    const repo = checked(repository.value, isRecord, "repository");
    assert.equal(repo.id, id, "Unexpected repository ID from GitHub");
    const release = await get(`${path}/releases?per_page=5`);
    release.value = releaseMetadata(release.value);
    const ref =
      release.value?.tag ??
      checked(repo.default_branch, isText, "default branch");
    const revision = await get(`${path}/commits/${encodeURIComponent(ref)}`);
    const sha = checked(
      revision.value?.sha,
      (value) => typeof value === "string" && /^[a-f0-9]{40}$/.test(value),
      "commit SHA",
    );
    revision.value = {
      kind: release.value ? "release-tag" : "default-branch",
      ref,
      sha,
    };
    const clientDeclaration = await get(
      `${path}/contents/${toc}?ref=${sha}`,
      true,
    );
    clientDeclaration.value = declaredInterfaces(clientDeclaration.value);
    const workflows = await get(
      `${path}/contents/.github/workflows?ref=${sha}`,
      true,
    );
    workflows.value = workflowNames(workflows.value);
    repository.value = {
      id,
      url: `https://github.com/${slug}`,
      stars: checked(
        repo.stargazers_count,
        isInteger,
        "repository stars",
        true,
      ),
      pushedAt: checked(repo.pushed_at, isDate, "repository pushed date", true),
      license: checked(
        repo.license?.spdx_id,
        isText,
        "repository license",
        true,
      ),
    };
    addons.push({
      id: `github:${id}`,
      name,
      repository,
      release,
      revision,
      clientDeclaration,
      workflows,
    });
  }
  return {
    schemaVersion: 1,
    provider: "github-rest",
    collectedAt: clock().toISOString(),
    client: { name: "World of Warcraft: Forever", interface: 16001 },
    addons,
  };
}

export async function collectAndSave(directory, options) {
  const snapshot = await collectEvidence(options);
  await mkdir(directory, { recursive: true });
  const stamp = snapshot.collectedAt.replaceAll(":", "-");
  const filename = join(directory, `${stamp}-${randomUUID()}.json`);
  const temporary = `${filename}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, {
      flag: "wx",
    });
    await rename(temporary, filename);
  } finally {
    await rm(temporary, { force: true });
  }
  return filename;
}

if (import.meta.main) {
  try {
    console.log(
      await collectAndSave(process.argv[2] ?? ".cache/evidence", {
        token: process.env.GITHUB_TOKEN,
      }),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
