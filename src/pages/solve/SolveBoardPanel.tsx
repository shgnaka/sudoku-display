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
  isTimerPaused: boolean;
  invalidCellKeys: ReadonlySet<string>;
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
  isTimerPaused,
  invalidCellKeys,
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
    <div className="solve-board-panel">
      <div className="board-slot" ref={boardSlotRef}>
        <div
          className={[
            "board-wrap",
            isReviewMode ? "review-locked" : "",
            isTimerPaused ? "timer-paused" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          style={boardFitSize ? ({ "--board-fit-size": `${boardFitSize}px` } as CSSProperties) : undefined}
        >
          <SudokuGrid
            board={board}
            disabled={isReviewMode || isTimerPaused}
            hidden={isTimerPaused}
            inputMode={inputMode}
            invalidCellKeys={invalidCellKeys}
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
    </div>
  );
}
