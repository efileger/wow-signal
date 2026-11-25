import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import { afterEach, describe, expect, it } from "vitest";
import { collectAndSave, collectEvidence } from "./collect-evidence.mjs";

const repos = [
  ["Jaliborc/Bagnon", 905553, "Bagnon.toc"],
  ["Cidan/BetterBags", 716469792, "BetterBags_Camelot.toc"],
  ["APGM82/BagsForever", 1411699833, "BagsForever/BagsForever.toc"],
  ["ajkatz/AKForeverBags", 1379284941, "AKForeverBags.toc"],
];
const sha = "a".repeat(40);
const observedAt = "2026-11-25T00:00:00.000Z";
const clock = () => new Date(observedAt);

function fixtureFetch({ failure, malformed = false, rateLimit = false } = {}) {
  const requests = [];
  const fetcher = async (url) => {
    requests.push(url);
    const endpoint = new URL(url);
    expect(endpoint.origin).toBe("https://api.github.com");
    const [slug, id, toc] = repos.find(([slug]) =>
      endpoint.pathname.startsWith(`/repos/${slug}`),
    );
    const path = endpoint.pathname.slice(`/repos/${slug}`.length);
    const response = (body, status = 200) =>
      new globalThis.Response(JSON.stringify(body), {
        status,
        headers: rateLimit
          ? { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1795640400" }
          : {},
      });
    if (failure && slug === repos[3][0] && path === "/releases")
      return response({}, failure);
    if (!path)
      return response({
        id: malformed ? undefined : id,
        default_branch: "main",
        stargazers_count: 0,
        ...(id === 905553 ? {} : { pushed_at: observedAt }),
        license: id === 905553 ? null : { spdx_id: "MIT" },
      });
    if (path === "/releases") {
      expect(endpoint.searchParams.get("per_page")).toBe("5");
      return response(
        id === 905553
          ? []
          : [
              { draft: false, prerelease: true, id: 3, tag_name: "beta" },
              {
                draft: false,
                prerelease: false,
                id: 10,
                tag_name: "v1.0",
                published_at: observedAt,
                assets: [
                  { id: 20, name: "addon.zip", download_count: 0 },
                  { id: 21, name: "extras.zip" },
                  { id: 22, name: "release.json", download_count: 30 },
                ],
              },
            ],
      );
    }
    if (path.startsWith("/commits/")) {
      expect(path).toBe(id === 905553 ? "/commits/main" : "/commits/v1.0");
      return response({ sha });
    }
    expect(endpoint.searchParams.get("ref")).toBe(sha);
    if (path === `/contents/${toc}`)
      return id === 1379284941
        ? response({}, 404)
        : response({
            encoding: "base64",
            content: Buffer.from(
              "## Interface: 16001, 120000\n## Notes: discarded source text\n",
            ).toString("base64"),
          });
    if (path === "/contents/.github/workflows")
      return id === 905553
        ? response({}, 404)
        : response([{ type: "file", name: "tests.yml" }]);
    throw Error(`Unexpected fixture request: ${url}`);
  };
  return { fetcher, requests };
}

const directories = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((dir) => rm(dir, { recursive: true })),
  );
});

async function outputDirectory() {
  const dir = await mkdtemp(join(tmpdir(), "wow-evidence-"));
  directories.push(dir);
  return dir;
}

describe("GitHub evidence contract", () => {
  it("collects four bounded public observations, distinguishing missing and zero", async () => {
    const { fetcher, requests } = fixtureFetch();
    const result = await collectEvidence({ fetcher, clock });
    expect(result.schemaVersion).toBe(1);
    expect(result.client.interface).toBe(16001);
    expect(result.addons.map((addon) => addon.id)).toEqual(
      repos.map(([, id]) => `github:${id}`),
    );
    expect(requests).toHaveLength(20);
    const [bagnon, betterBags, , ak] = result.addons;
    expect(bagnon.repository.value).toMatchObject({
      stars: 0,
      pushedAt: null,
      license: null,
    });
    expect(bagnon.release.value).toBeNull();
    expect(bagnon.revision.value).toMatchObject({
      kind: "default-branch",
      ref: "main",
      sha,
    });
    expect(betterBags.release.value).toMatchObject({
      id: 10,
      tag: "v1.0",
      assets: [
        { id: 20, name: "addon.zip", downloads: 0 },
        { id: 21, name: "extras.zip", downloads: null },
      ],
    });
    expect(betterBags.revision.value).toMatchObject({
      kind: "release-tag",
      ref: "v1.0",
      sha,
    });
    expect(betterBags.clientDeclaration).toEqual({
      value: [16001, 120000],
      source: {
        url: `https://api.github.com/repos/Cidan/BetterBags/contents/BetterBags_Camelot.toc?ref=${sha}`,
        observedAt,
      },
    });
    expect(ak.clientDeclaration.value).toBeNull();
    expect(betterBags.workflows.value).toEqual(["tests.yml"]);
    expect(bagnon.workflows.value).toBeNull();
    expect(JSON.stringify(result)).not.toContain("discarded source text");
  });

  it("keeps independent replayable snapshots on repeated collection", async () => {
    const dir = await outputDirectory();
    const first = await collectAndSave(dir, { ...fixtureFetch(), clock });
    const second = await collectAndSave(dir, { ...fixtureFetch(), clock });
    expect(first).not.toBe(second);
    expect(await readdir(dir)).toHaveLength(2);
    expect(JSON.parse(await readFile(first, "utf8"))).toEqual(
      JSON.parse(await readFile(second, "utf8")),
    );
  });

  it.each([503, 429, 403])(
    "preserves complete evidence when a provider request fails (%i)",
    async (failure) => {
      const dir = await outputDirectory();
      const first = await collectAndSave(dir, { ...fixtureFetch(), clock });
      const previous = await readFile(first, "utf8");
      await expect(
        collectAndSave(dir, { ...fixtureFetch({ failure }), clock }),
      ).rejects.toThrow(`${failure}`);
      expect(await readdir(dir)).toHaveLength(1);
      expect(await readFile(first, "utf8")).toBe(previous);
    },
  );

  it("stops after quota exhaustion without requesting the next endpoint", async () => {
    const { fetcher, requests } = fixtureFetch({ rateLimit: true });
    await expect(collectEvidence({ fetcher, clock })).rejects.toThrow(
      /rate limit reached/i,
    );
    expect(requests).toHaveLength(1);
  });

  it("rejects a malformed required provider identifier", async () => {
    const dir = await outputDirectory();
    await expect(
      collectAndSave(dir, { ...fixtureFetch({ malformed: true }), clock }),
    ).rejects.toThrow(/repository ID/i);
    expect(await readdir(dir)).toEqual([]);
  });
});
