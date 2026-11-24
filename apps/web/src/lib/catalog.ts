import fixture from "../data/catalog.json";

export interface Addon {
  name: string;
  summary: string;
  source: string;
}

export function readAddon(input: unknown): Addon {
  if (
    typeof input !== "object" ||
    input === null ||
    !("name" in input) ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    !("summary" in input) ||
    typeof input.summary !== "string" ||
    !input.summary.trim() ||
    !("source" in input) ||
    typeof input.source !== "string"
  ) {
    throw new Error("Expected an add-on name, summary, and source URL");
  }

  const url = URL.parse(input.source);
  if (!url || url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Add-on source must be an HTTPS URL without credentials");
  }

  return { name: input.name, summary: input.summary, source: url.href };
}

export function loadCatalog(): Addon[] {
  return fixture.map(readAddon);
}
