import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("catalog auto load", () => {
  test("enables infinite loading only after the first load more click", () => {
    const source = readFileSync(
      resolve(import.meta.dir, "../src/features/catalog/components/AnimeCatalog.tsx"),
      "utf8"
    );

    expect(source).toContain("isAutoLoadEnabled");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("setIsAutoLoadEnabled(true)");
  });
});
