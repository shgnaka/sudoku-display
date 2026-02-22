import { describe, expect, it } from "vitest";
import { SUDOKU_DIFFICULTIES } from "../difficulty";
import {
  SUDOKU_BLOCK_SIZE,
  SUDOKU_CELL_COUNT,
  SUDOKU_EMPTY_VALUE,
  SUDOKU_MAX_VALUE,
  SUDOKU_MIN_VALUE,
  SUDOKU_SIZE
} from "../sudokuDomain";

describe("sudoku domain contract", () => {
  it("keeps board dimensions and value range stable", () => {
    expect(SUDOKU_SIZE).toBe(9);
    expect(SUDOKU_BLOCK_SIZE).toBe(3);
    expect(SUDOKU_CELL_COUNT).toBe(SUDOKU_SIZE * SUDOKU_SIZE);
    expect(SUDOKU_EMPTY_VALUE).toBe(0);
    expect(SUDOKU_MIN_VALUE).toBe(1);
    expect(SUDOKU_MAX_VALUE).toBe(9);
  });

  it("keeps public difficulty options stable", () => {
    expect(SUDOKU_DIFFICULTIES).toEqual(["easy", "medium", "hard"]);
  });
});
