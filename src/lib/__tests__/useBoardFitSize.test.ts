import { describe, expect, it } from "vitest";
import { computeBoardFitSize } from "../useBoardFitSize";

describe("computeBoardFitSize", () => {
  it("uses the smaller side when width is larger than height", () => {
    expect(computeBoardFitSize(640, 520, 258)).toBe(520);
  });

  it("uses the smaller side when height is larger than width", () => {
    expect(computeBoardFitSize(480, 720, 258)).toBe(480);
  });

  it("respects the minimum board size", () => {
    expect(computeBoardFitSize(200, 180, 258)).toBe(258);
  });

  it("returns 0 for invalid measured sizes", () => {
    expect(computeBoardFitSize(0, 480, 258)).toBe(0);
    expect(computeBoardFitSize(480, 0, 258)).toBe(0);
  });
});
