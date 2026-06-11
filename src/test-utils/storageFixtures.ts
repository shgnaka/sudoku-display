import type { Board } from "../types/sudoku";
import type { PersistedGameState } from "../lib/gameStorage";

const SOLVED_GRID = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
] as const;

export function createGameBoardFixture(): Board {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => {
      if (row === 0 && col === 0) {
        return { value: 5, origin: "given" as const };
      }

      if (row === 0 && col === 2) {
        return { value: 4, origin: "user" as const };
      }

      return { value: null, origin: "empty" as const };
    })
  );
}

export function createSolvedBoardFixture(): Board {
  return SOLVED_GRID.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      value,
      origin: rowIndex === 0 && colIndex === 0 ? ("given" as const) : ("user" as const)
    }))
  );
}

export function createNearlySolvedBoardFixture(): Board {
  const board = createSolvedBoardFixture();
  board[8][8] = { value: null, origin: "empty" };
  return board;
}

export function createSolvedPuzzleTextFixture(emptyCell?: { row: number; col: number }): string {
  return SOLVED_GRID.map((row, rowIndex) =>
    row
      .map((value, colIndex) => {
        return emptyCell?.row === rowIndex && emptyCell.col === colIndex ? "." : String(value);
      })
      .join(" ")
  ).join("\n");
}

export function createPersistedGameStateFixture(): PersistedGameState {
  return {
    rawInput: "5 3 . | . 7 . | . . .",
    board: createGameBoardFixture()
  };
}

export function createMalformedBoardFixture(): Array<
  Array<{
    value: unknown;
    origin: unknown;
  }>
> {
  return createGameBoardFixture().map((row) => row.map((cell) => ({ ...cell })));
}
