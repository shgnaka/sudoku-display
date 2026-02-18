import { describe, expect, it } from "vitest";
import { parseSudokuText } from "../sudokuParser";

const validInput = `5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9`;

describe("parseSudokuText", () => {
  it("parses valid board format", () => {
    const result = parseSudokuText(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.board).toHaveLength(9);
    expect(result.board[0]).toHaveLength(9);
    expect(result.board[0][0]).toEqual({ value: 5, origin: "given" });
    expect(result.board[0][2]).toEqual({ value: null, origin: "empty" });
  });

  it("fails when row count is not 9", () => {
    const result = parseSudokuText("1 2 3");
    expect(result.ok).toBe(false);
  });

  it("fails when a line has non-9 cell count", () => {
    const malformed = `1 2 3 4 5 6 7 8
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9`;
    const result = parseSudokuText(malformed);

    expect(result.ok).toBe(false);
  });

  it("fails when digit 0 exists", () => {
    const malformed = `0 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9`;
    const result = parseSudokuText(malformed);

    expect(result.ok).toBe(false);
  });

  it("fails when invalid characters exist", () => {
    const malformed = `1 2 3 4 5 6 7 8 a
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9
1 2 3 4 5 6 7 8 9`;
    const result = parseSudokuText(malformed);

    expect(result.ok).toBe(false);
  });
});
