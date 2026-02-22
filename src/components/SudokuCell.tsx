import type { FocusEvent, MouseEvent } from "react";
import type { CellData } from "../types/sudoku";

type SudokuCellInputMode = "keyboard" | "sheet";

interface SudokuCellProps {
  cell: CellData;
  row: number;
  col: number;
  disabled?: boolean;
  inputMode?: SudokuCellInputMode;
  isSelected?: boolean;
  onChange: (row: number, col: number, value: number | null) => void;
  onBlurCell?: () => void;
  onFocusCell?: () => void;
  onSelect?: (row: number, col: number, isEditable: boolean) => void;
}

function getCellStateLabel(cell: CellData): string {
  if (cell.origin === "given") {
    return "初期値";
  }

  if (cell.origin === "user") {
    return "ユーザー入力";
  }

  return "空";
}

function getEditabilityLabel(cell: CellData, disabled: boolean): string {
  if (cell.origin === "given") {
    return "編集不可（初期値）";
  }

  if (disabled) {
    return "編集不可（確認モード）";
  }

  return "編集可能";
}

export function SudokuCell({
  cell,
  row,
  col,
  disabled = false,
  inputMode = "keyboard",
  isSelected = false,
  onChange,
  onBlurCell,
  onFocusCell,
  onSelect
}: SudokuCellProps): JSX.Element {
  const className = ["sudoku-cell", `origin-${cell.origin}`, isSelected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");
  const isReadOnly = cell.origin === "given" || disabled;
  const isEditable = cell.origin !== "given" && !disabled;
  const ariaLabel = `${row + 1}行${col + 1}列、${getCellStateLabel(cell)}、${getEditabilityLabel(cell, disabled)}`;

  const handleChange = (rawValue: string): void => {
    if (isReadOnly) {
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

  const handleFocus = (event: FocusEvent<HTMLInputElement>): void => {
    if (isReadOnly) {
      return;
    }

    event.currentTarget.select();
    onFocusCell?.();
  };

  const handleMouseUp = (event: MouseEvent<HTMLInputElement>): void => {
    if (isReadOnly) {
      return;
    }

    event.preventDefault();
  };

  const handleSelect = (): void => {
    if (disabled) {
      return;
    }

    onSelect?.(row, col, isEditable);
  };

  if (inputMode === "sheet") {
    return (
      <button
        aria-label={ariaLabel}
        aria-disabled={isReadOnly}
        className={className}
        data-col={col}
        data-row={row}
        onClick={handleSelect}
        tabIndex={disabled ? -1 : undefined}
        type="button"
      >
        {cell.value ?? ""}
      </button>
    );
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      data-col={col}
      data-row={row}
      inputMode="numeric"
      maxLength={1}
      onBlur={disabled ? undefined : onBlurCell}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={disabled ? undefined : handleFocus}
      onMouseUp={disabled ? undefined : handleMouseUp}
      readOnly={isReadOnly}
      tabIndex={disabled ? -1 : undefined}
      value={cell.value ?? ""}
    />
  );
}
