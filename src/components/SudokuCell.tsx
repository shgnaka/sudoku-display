import type { CellData } from "../types/sudoku";

interface SudokuCellProps {
  cell: CellData;
  row: number;
  col: number;
  onChange: (row: number, col: number, value: number | null) => void;
}

export function SudokuCell({ cell, row, col, onChange }: SudokuCellProps): JSX.Element {
  const className = ["sudoku-cell", `origin-${cell.origin}`].join(" ");

  const handleChange = (rawValue: string): void => {
    if (cell.origin === "given") {
      return;
    }

    if (rawValue === "") {
      onChange(row, col, null);
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 9) {
      onChange(row, col, parsed);
    }
  };

  return (
    <input
      aria-label={`r${row + 1}c${col + 1}`}
      className={className}
      data-col={col}
      data-row={row}
      inputMode="numeric"
      maxLength={1}
      onChange={(event) => handleChange(event.target.value)}
      readOnly={cell.origin === "given"}
      value={cell.value ?? ""}
    />
  );
}
