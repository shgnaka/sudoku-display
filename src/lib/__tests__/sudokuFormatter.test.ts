import { describe, expect, it } from "vitest";
import { line81ToPuzzleText } from "../sudokuFormatter";

describe("line81ToPuzzleText", () => {
  it("formats an 81-cell array into parser-compatible text", () => {
    const puzzle = new Uint8Array(81);
    puzzle[0] = 5;
    puzzle[1] = 3;
    puzzle[4] = 7;
    puzzle[80] = 9;

    const text = line81ToPuzzleText(puzzle);
    const lines = text.split("\n");

    expect(lines).toHaveLength(11);
    expect(lines[0]).toBe("5 3 . | . 7 . | . . .");
    expect(lines[3]).toBe("------+-------+------");
    expect(lines[10]).toBe(". . . | . . . | . . 9");
  });

  it("throws when length is not 81", () => {
    expect(() => line81ToPuzzleText(new Uint8Array(80))).toThrow(/length must be 81/);
  });
});
