import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("API driven catalog", () => {
  test("catalog page uses the backend API instead of catalogData anime stubs", () => {
    const componentSource = readFileSync(
      resolve(import.meta.dir, "../src/features/catalog/components/AnimeCatalog.tsx"),
      "utf8"
    );
    const hookSource = readFileSync(
      resolve(import.meta.dir, "../src/features/catalog/hooks/useAnimeCatalog.ts"),
      "utf8"
    );

    expect(hookSource).toContain("getCatalog");
    expect(componentSource).not.toContain("catalogAnime");
  });
});
