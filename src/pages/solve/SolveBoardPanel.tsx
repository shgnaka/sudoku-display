import type { CSSProperties, RefObject } from "react";
import { InkOverlay } from "../../components/InkOverlay";
import { SudokuGrid } from "../../components/SudokuGrid";
import type { BlockId, InkState, Stroke } from "../../types/ink";
import type { Board } from "../../types/sudoku";
import type { SelectedCell } from "./useSolveSelectionController";

interface SolveBoardPanelProps {
  board: Board;
  boardFitSize: number | null;
  boardSlotRef: RefObject<HTMLDivElement>;
  inputMode: "keyboard" | "sheet";
  isReviewMode: boolean;
  isInkMode: boolean;
  activeBlockId: BlockId;
  inkState: InkState;
  selectedCell: SelectedCell | null;
  onCellChange: (row: number, col: number, value: number | null) => void;
  onCellFocus: () => void;
  onCellBlur: () => void;
  onCellSelect: (row: number, col: number, isEditable: boolean) => void;
  onActiveBlockChange: (blockId: BlockId) => void;
  onCommitStroke: (blockId: BlockId, stroke: Stroke) => void;
}

export function SolveBoardPanel({
  board,
  boardFitSize,
  boardSlotRef,
  inputMode,
  isReviewMode,
  isInkMode,
  activeBlockId,
  inkState,
  selectedCell,
  onCellChange,
  onCellFocus,
  onCellBlur,
  onCellSelect,
  onActiveBlockChange,
  onCommitStroke
}: SolveBoardPanelProps): JSX.Element {
  return (
    <section className="panel solve-board-panel">
      <div className="board-panel-header">
        <h2>盤面</h2>
      </div>
      <div className="board-slot" ref={boardSlotRef}>
        <div
          className={isReviewMode ? "board-wrap review-locked" : "board-wrap"}
          style={boardFitSize ? ({ "--board-fit-size": `${boardFitSize}px` } as CSSProperties) : undefined}
        >
          <SudokuGrid
            board={board}
            disabled={isReviewMode}
            inputMode={inputMode}
            onCellBlur={inputMode === "keyboard" ? onCellBlur : undefined}
            onCellChange={onCellChange}
            onCellFocus={inputMode === "keyboard" ? onCellFocus : undefined}
            onCellSelect={inputMode === "sheet" ? onCellSelect : undefined}
            selectedCell={inputMode === "sheet" ? selectedCell : null}
          />
          <InkOverlay
            activeBlockId={activeBlockId}
            inkState={inkState}
            isInkMode={isInkMode}
            onActiveBlockChange={onActiveBlockChange}
            onCommitStroke={onCommitStroke}
          />
        </div>
      </div>
      <div className="legend solve-legend">
        <span className="legend-item legend-given">初期値</span>
        <span className="legend-item legend-user">ユーザー入力</span>
        <span className="legend-item legend-empty">空マス</span>
      </div>
    </section>
  );
}
