import { describe, expect, it } from "vitest";
import {
  createNearlySolvedBoardFixture,
  createSolvedBoardFixture
} from "../../test-utils/storageFixtures";
import { isSolvedBoard, solveBoard } from "../sudokuModel";

describe("isSolvedBoard", () => {
  it("accepts a complete board whose rows, columns, and blocks contain 1 through 9", () => {
    expect(isSolvedBoard(createSolvedBoardFixture())).toBe(true);
  });

  it("rejects a board with an empty cell", () => {
    expect(isSolvedBoard(createNearlySolvedBoardFixture())).toBe(false);
  });

  it("rejects a full board with a duplicate in a row", () => {
    const board = createSolvedBoardFixture();
    board[0][8] = { value: 1, origin: "user" };

    expect(isSolvedBoard(board)).toBe(false);
  });

  it("rejects a full board with a duplicate in a column", () => {
    const board = createSolvedBoardFixture();
    board[8][0] = { value: 2, origin: "user" };

    expect(isSolvedBoard(board)).toBe(false);
  });

  it("rejects a full board with a duplicate in a 3 by 3 block", () => {
    const board = createSolvedBoardFixture();
    const topMiddle = board[0][3];
    board[0][3] = board[1][4];
    board[1][4] = topMiddle;

    expect(isSolvedBoard(board)).toBe(false);
  });
});

describe("solveBoard", () => {
  it("solves a valid incomplete puzzle without changing given origins", () => {
    const puzzle = createNearlySolvedBoardFixture();
    const solved = solveBoard(puzzle);

    expect(solved).not.toBeNull();
    expect(solved?.[8][8]).toEqual({ value: 9, origin: "user" });
    expect(solved?.[0][0].origin).toBe("given");
    expect(isSolvedBoard(solved!)).toBe(true);
  });

  it("returns null for a contradictory puzzle", () => {
    const puzzle = createNearlySolvedBoardFixture();
    puzzle[8][8] = { value: 8, origin: "user" };

    expect(solveBoard(puzzle)).toBeNull();
  });
});
