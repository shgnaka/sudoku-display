import type { Board } from "../types/sudoku";
import { SudokuCell } from "./SudokuCell";

interface SudokuGridProps {
  board: Board;
  onCellChange: (row: number, col: number, value: number | null) => void;
}

export function SudokuGrid({ board, onCellChange }: SudokuGridProps): JSX.Element {
  return (
    <div aria-label="sudoku-grid" className="sudoku-grid" role="grid">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <SudokuCell
            cell={cell}
            col={colIndex}
            key={`${rowIndex}-${colIndex}`}
            onChange={onCellChange}
            row={rowIndex}
          />
        ))
      )}
    </div>
  );
}
