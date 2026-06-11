import type { FocusEvent, MouseEvent } from "react";
import type { CellData } from "../types/sudoku";
import { SUDOKU_MAX_VALUE, SUDOKU_MIN_VALUE } from "../constants/sudokuDomain";
import { buildCellAriaLabel } from "../lib/solveA11y";

type SudokuCellInputMode = "keyboard" | "sheet";

interface SudokuCellProps {
  cell: CellData;
  row: number;
  col: number;
  disabled?: boolean;
  inputMode?: SudokuCellInputMode;
  isSelected?: boolean;
  isInvalid?: boolean;
  onChange: (row: number, col: number, value: number | null) => void;
  onBlurCell?: () => void;
  onFocusCell?: () => void;
  onSelect?: (row: number, col: number, isEditable: boolean) => void;
}

export function SudokuCell({
  cell,
  row,
  col,
  disabled = false,
  inputMode = "keyboard",
  isSelected = false,
  isInvalid = false,
  onChange,
  onBlurCell,
  onFocusCell,
  onSelect
}: SudokuCellProps): JSX.Element {
  const className = [
    "sudoku-cell",
    `origin-${cell.origin}`,
    isSelected ? "is-selected" : "",
    isInvalid ? "is-invalid" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const isReadOnly = cell.origin === "given" || disabled;
  const isEditable = cell.origin !== "given" && !disabled;
  const ariaLabel = buildCellAriaLabel({ cell, row, col, disabled });

  const handleChange = (rawValue: string): void => {
    if (isReadOnly) {
      return;
    }

    if (rawValue === "") {
      onChange(row, col, null);
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isInteger(parsed) && parsed >= SUDOKU_MIN_VALUE && parsed <= SUDOKU_MAX_VALUE) {
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
        aria-invalid={isInvalid || undefined}
        className={className}
        data-col={col}
        data-row={row}
        disabled={disabled}
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
      aria-invalid={isInvalid || undefined}
      disabled={disabled}
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
