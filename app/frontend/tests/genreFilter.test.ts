import { describe, expect, test } from "bun:test";
import { GENRE_OPTIONS, filterGenreOptions } from "../src/utils/catalogData";

describe("genre filter data", () => {
  test("provides the long genre list used by the dropdown", () => {
    expect(GENRE_OPTIONS.length).toBeGreaterThan(40);
    expect(GENRE_OPTIONS).toContain("Идолы (Муж.)");
    expect(GENRE_OPTIONS).toContain("Романтический подтекст");
    expect(GENRE_OPTIONS).toContain("Этти");
  });

  test("filters genres by a case-insensitive search query", () => {
    expect(filterGenreOptions("роман")).toEqual(["Романтика", "Романтический подтекст"]);
    expect(filterGenreOptions("  спорт ")).toEqual(["Командный спорт", "Спорт", "Спортивные единоборства"]);
    expect(filterGenreOptions("")).toEqual([...GENRE_OPTIONS]);
  });
});
