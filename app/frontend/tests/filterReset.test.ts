import { describe, expect, test } from "bun:test";
import { createEmptyCatalogFilterState } from "../src/utils/catalogData";

describe("catalog filter reset", () => {
  test("returns empty filter state without touching catalog sorting", () => {
    expect(createEmptyCatalogFilterState()).toEqual({
      checked: new Set<string>(),
      checkedGenres: new Set<string>(),
      isStrictMatch: false
    });
  });
});
