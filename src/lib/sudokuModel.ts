import { SUDOKU_BLOCK_SIZE, SUDOKU_SIZE } from "../constants/sudokuDomain";
import type { Board, CellData } from "../types/sudoku";

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

function hasEverySudokuValue(cells: CellData[]): boolean {
  if (cells.length !== SUDOKU_SIZE) {
    return false;
  }

  const values = cells.map((cell) => cell.value);
  return values.every((value) => value !== null) && new Set(values).size === SUDOKU_SIZE;
}

export function isSolvedBoard(board: Board): boolean {
  if (board.length !== SUDOKU_SIZE || board.some((row) => row.length !== SUDOKU_SIZE)) {
    return false;
  }

  for (const row of board) {
    if (!hasEverySudokuValue(row)) {
      return false;
    }
  }

  for (let col = 0; col < SUDOKU_SIZE; col += 1) {
    const column = board.map((row) => row[col]);
    if (!hasEverySudokuValue(column)) {
      return false;
    }
  }

  for (let blockRow = 0; blockRow < SUDOKU_SIZE; blockRow += SUDOKU_BLOCK_SIZE) {
    for (let blockCol = 0; blockCol < SUDOKU_SIZE; blockCol += SUDOKU_BLOCK_SIZE) {
      const block: CellData[] = [];

      for (let row = blockRow; row < blockRow + SUDOKU_BLOCK_SIZE; row += 1) {
        for (let col = blockCol; col < blockCol + SUDOKU_BLOCK_SIZE; col += 1) {
          block.push(board[row][col]);
        }
      }

      if (!hasEverySudokuValue(block)) {
        return false;
      }
    }
  }

  return true;
}

export function getPuzzleId(board: Board): string {
  return board
    .flat()
    .map((cell) => cell.value ?? 0)
    .join("");
}

function isValueAllowed(values: Array<number | null>, value: number): boolean {
  return !values.includes(value);
}

export function solveBoard(board: Board): Board | null {
  if (board.length !== SUDOKU_SIZE || board.some((row) => row.length !== SUDOKU_SIZE)) {
    return null;
  }

  const values = board.map((row) => row.map((cell) => cell.value));
  const hasDuplicates = (items: Array<number | null>): boolean => {
    const filled = items.filter((value): value is number => value !== null);
    return new Set(filled).size !== filled.length;
  };

  for (let row = 0; row < SUDOKU_SIZE; row += 1) {
    if (hasDuplicates(values[row])) {
      return null;
    }
  }

  for (let col = 0; col < SUDOKU_SIZE; col += 1) {
    if (hasDuplicates(values.map((row) => row[col]))) {
      return null;
    }
  }

  for (let blockRow = 0; blockRow < SUDOKU_SIZE; blockRow += SUDOKU_BLOCK_SIZE) {
    for (let blockCol = 0; blockCol < SUDOKU_SIZE; blockCol += SUDOKU_BLOCK_SIZE) {
      const block: Array<number | null> = [];
      for (let row = blockRow; row < blockRow + SUDOKU_BLOCK_SIZE; row += 1) {
        for (let col = blockCol; col < blockCol + SUDOKU_BLOCK_SIZE; col += 1) {
          block.push(values[row][col]);
        }
      }
      if (hasDuplicates(block)) {
        return null;
      }
    }
  }

  const solveNext = (): boolean => {
    let targetRow = -1;
    let targetCol = -1;
    let targetCandidates: number[] = [];

    for (let row = 0; row < SUDOKU_SIZE; row += 1) {
      for (let col = 0; col < SUDOKU_SIZE; col += 1) {
        if (values[row][col] !== null) {
          continue;
        }

        const rowValues = values[row];
        const columnValues = values.map((current) => current[col]);
        const blockValues: Array<number | null> = [];
        const blockRow = Math.floor(row / SUDOKU_BLOCK_SIZE) * SUDOKU_BLOCK_SIZE;
        const blockCol = Math.floor(col / SUDOKU_BLOCK_SIZE) * SUDOKU_BLOCK_SIZE;

        for (let innerRow = blockRow; innerRow < blockRow + SUDOKU_BLOCK_SIZE; innerRow += 1) {
          for (let innerCol = blockCol; innerCol < blockCol + SUDOKU_BLOCK_SIZE; innerCol += 1) {
            blockValues.push(values[innerRow][innerCol]);
          }
        }

        const candidates = Array.from({ length: SUDOKU_SIZE }, (_, index) => index + 1).filter(
          (value) =>
            isValueAllowed(rowValues, value) &&
            isValueAllowed(columnValues, value) &&
            isValueAllowed(blockValues, value)
        );

        if (candidates.length === 0) {
          return false;
        }

        if (targetRow === -1 || candidates.length < targetCandidates.length) {
          targetRow = row;
          targetCol = col;
          targetCandidates = candidates;
        }
      }
    }

    if (targetRow === -1) {
      return true;
    }

    for (const candidate of targetCandidates) {
      values[targetRow][targetCol] = candidate;
      if (solveNext()) {
        return true;
      }
    }

    values[targetRow][targetCol] = null;
    return false;
  };

  if (!solveNext()) {
    return null;
  }

  return values.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      value,
      origin: board[rowIndex][colIndex].origin === "given" ? ("given" as const) : ("user" as const)
    }))
  );
}
