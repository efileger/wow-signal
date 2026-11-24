import { describe, expect, it } from "vitest";
import { loadCatalog, readAddon } from "./catalog";

const addon = {
  name: "WeakAuras",
  summary: "Custom alerts",
  source: "https://github.com/WeakAuras/WeakAuras2",
};

describe("readAddon", () => {
  it("returns a validated add-on", () => {
    expect(readAddon(addon)).toEqual(addon);
  });

  it("rejects an unnamed entry", () => {
    expect(() => readAddon({ ...addon, name: " " })).toThrow(
      "Expected an add-on name",
    );
  });

  it("rejects an unsafe source link", () => {
    expect(() => readAddon({ ...addon, source: "http://example.com" })).toThrow(
      "Add-on source must be an HTTPS URL",
    );
  });
});

it("loads the published sample catalog through the entry validator", () => {
  expect(loadCatalog()).toEqual([
    {
      ...addon,
      summary:
        "A framework for creating custom visual and audio alerts in World of Warcraft.",
    },
  ]);
});
