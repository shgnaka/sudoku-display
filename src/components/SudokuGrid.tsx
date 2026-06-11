import type { Board } from "../types/sudoku";
import { SudokuCell } from "./SudokuCell";

interface SelectedCell {
  row: number;
  col: number;
}

type SudokuGridInputMode = "keyboard" | "sheet";

interface SudokuGridProps {
  board: Board;
  disabled?: boolean;
  hidden?: boolean;
  invalidCellKeys?: ReadonlySet<string>;
  inputMode?: SudokuGridInputMode;
  selectedCell?: SelectedCell | null;
  onCellChange: (row: number, col: number, value: number | null) => void;
  onCellBlur?: () => void;
  onCellFocus?: () => void;
  onCellSelect?: (row: number, col: number, isEditable: boolean) => void;
}

export function SudokuGrid({
  board,
  disabled = false,
  hidden = false,
  invalidCellKeys = new Set(),
  inputMode = "keyboard",
  selectedCell = null,
  onCellChange,
  onCellBlur,
  onCellFocus,
  onCellSelect
}: SudokuGridProps): JSX.Element {
  return (
    <div aria-hidden={hidden || undefined} aria-label="sudoku-grid" className="sudoku-grid" role="grid">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <SudokuCell
            cell={cell}
            col={colIndex}
            disabled={disabled}
            inputMode={inputMode}
            isInvalid={invalidCellKeys.has(`${rowIndex}-${colIndex}`)}
            isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
            key={`${rowIndex}-${colIndex}`}
            onBlurCell={onCellBlur}
            onChange={onCellChange}
            onFocusCell={onCellFocus}
            onSelect={onCellSelect}
            row={rowIndex}
          />
        ))
      )}
    </div>
  );
}
