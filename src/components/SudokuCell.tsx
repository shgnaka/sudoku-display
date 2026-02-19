import type { CellData } from "../types/sudoku";

interface SudokuCellProps {
  cell: CellData;
  row: number;
  col: number;
  disabled?: boolean;
  onChange: (row: number, col: number, value: number | null) => void;
  onBlurCell?: () => void;
  onFocusCell?: () => void;
}

export function SudokuCell({
  cell,
  row,
  col,
  disabled = false,
  onChange,
  onBlurCell,
  onFocusCell
}: SudokuCellProps): JSX.Element {
  const className = ["sudoku-cell", `origin-${cell.origin}`].join(" ");

  const handleChange = (rawValue: string): void => {
    if (cell.origin === "given" || disabled) {
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
      onBlur={disabled ? undefined : onBlurCell}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={disabled ? undefined : onFocusCell}
      readOnly={cell.origin === "given" || disabled}
      tabIndex={disabled ? -1 : undefined}
      value={cell.value ?? ""}
    />
  );
}
