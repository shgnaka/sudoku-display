import { SUDOKU_BLOCK_SIZE, SUDOKU_CELL_COUNT, SUDOKU_EMPTY_VALUE, SUDOKU_MAX_VALUE, SUDOKU_SIZE } from "../constants/sudokuDomain";

export function line81ToPuzzleText(line81: ArrayLike<number>): string {
  if (line81.length !== SUDOKU_CELL_COUNT) {
    throw new Error(`line81 length must be ${SUDOKU_CELL_COUNT} (received: ${line81.length})`);
  }

  const rows: string[] = [];

  for (let row = 0; row < SUDOKU_SIZE; row += 1) {
    const tokens: string[] = [];

    for (let col = 0; col < SUDOKU_SIZE; col += 1) {
      const value = line81[row * SUDOKU_SIZE + col];
      if (!Number.isInteger(value) || value < SUDOKU_EMPTY_VALUE || value > SUDOKU_MAX_VALUE) {
        throw new Error(`Invalid cell value at row=${row}, col=${col}: ${value}`);
      }

      tokens.push(value === SUDOKU_EMPTY_VALUE ? "." : String(value));
    }

    rows.push(
      `${tokens.slice(0, SUDOKU_BLOCK_SIZE).join(" ")} | ` +
        `${tokens.slice(SUDOKU_BLOCK_SIZE, SUDOKU_BLOCK_SIZE * 2).join(" ")} | ` +
        `${tokens.slice(SUDOKU_BLOCK_SIZE * 2, SUDOKU_SIZE).join(" ")}`
    );

    if (row === SUDOKU_BLOCK_SIZE - 1 || row === SUDOKU_BLOCK_SIZE * 2 - 1) {
      rows.push("------+-------+------");
    }
  }

  return rows.join("\n");
}
