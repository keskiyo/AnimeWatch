import { describe, expect, test } from "bun:test";
import { NAV_ITEMS } from "../src/utils/catalogData";

describe("responsive catalog controls", () => {
  test("keeps header navigation items available for the mobile dropdown", () => {
    expect(NAV_ITEMS).toEqual(["Аниме", "Онгоинг", "Случайное аниме"]);
  });
});
