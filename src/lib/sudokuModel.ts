import type { Board } from "../types/sudoku";

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function isGivenCell(board: Board, row: number, col: number): boolean {
  return board[row][col].origin === "given";
}

export function setUserCell(board: Board, row: number, col: number, value: number | null): Board {
  if (isGivenCell(board, row, col)) {
    return board;
  }

  const next = cloneBoard(board);
  next[row][col] = {
    value,
    origin: value === null ? "empty" : "user"
  };

  return next;
}
