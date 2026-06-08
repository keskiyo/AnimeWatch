import { describe, expect, test } from "bun:test";
import { CATALOG_INTRO_COLLAPSED, CATALOG_INTRO_EXPANDED, STRICT_MATCH_TOOLTIP } from "../src/utils/catalogData";

describe("catalog intro copy", () => {
  test("keeps expanded intro longer than collapsed intro", () => {
    expect(CATALOG_INTRO_COLLAPSED.length).toBe(1);
    expect(CATALOG_INTRO_EXPANDED.length).toBeGreaterThan(CATALOG_INTRO_COLLAPSED.length);
  });

  test("explains strict genre match behavior", () => {
    expect(STRICT_MATCH_TOOLTIP).toContain("включено");
    expect(STRICT_MATCH_TOOLTIP).toContain("отключено");
  });
});
