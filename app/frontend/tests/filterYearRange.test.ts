import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("catalog year filter", () => {
  test("does not cap the upper year at 2026", () => {
    const source = readFileSync(
      resolve(import.meta.dir, "../src/features/catalog/components/FilterSidebar.tsx"),
      "utf8"
    );

    expect(source).not.toContain("max={2026}");
  });
});
