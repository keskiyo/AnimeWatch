import { describe, expect, test } from "bun:test";
import { formatEpisodeLabel, formatProgressLabel } from "../src/utils/formatters";

describe("formatters", () => {
  test("formats episode labels consistently", () => {
    expect(formatEpisodeLabel(12)).toBe("Episode 12");
  });

  test("formats progress labels with total fallback", () => {
    expect(formatProgressLabel(4, 12)).toBe("4 / 12 watched");
    expect(formatProgressLabel(undefined, 0)).toBe("0 watched");
  });
});
