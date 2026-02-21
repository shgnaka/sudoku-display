import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { InkActionFloatBar } from "../components/InkActionFloatBar";
import { InkOverlay } from "../components/InkOverlay";
import { InkToggleBar } from "../components/InkToggleBar";
import { SolveNumberPad } from "../components/SolveNumberPad";
import { SudokuGrid } from "../components/SudokuGrid";
import { useBoardFitSize } from "../lib/useBoardFitSize";
import { useIsMobileViewport } from "../lib/useIsMobileViewport";
import { useKeyboardInset } from "../lib/useKeyboardInset";
import { useKeyboardScrollLock } from "../lib/useKeyboardScrollLock";
import { useSolveInputSheetViewport } from "../lib/useSolveInputSheetViewport";
import { useReviewScrollLock } from "../lib/useReviewScrollLock";
import { useSudokuAppState } from "../state/SudokuAppStateProvider";

interface SelectedCell {
  row: number;
  col: number;
}

export function SolvePage(): JSX.Element {
  const {
    board,
    errorMessage,
    isInkMode,
    isReviewMode,
    activeBlockId,
    inkState,
    setActiveBlockId,
    toggleInkMode,
    setIsGridEditing,
    handleCellChange,
    handleCommitStroke,
    handleClearActiveBlock,
    handleClearAllInk,
    toggleReviewMode,
    isGridEditing
  } = useSudokuAppState();

  const keyboardInset = useKeyboardInset();
  const isMobileViewport = useIsMobileViewport();
  const isSheetInputViewport = useSolveInputSheetViewport();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const boardSlotRef = useRef<HTMLDivElement | null>(null);
  const boardFitSize = useBoardFitSize(boardSlotRef, { enabled: !isMobileViewport });
  const inputMode = isSheetInputViewport ? "sheet" : "keyboard";
  const shouldShowInkActions = isInkMode && (inputMode === "sheet" || keyboardInset === 0);
  useKeyboardScrollLock({
    enabled: inputMode === "keyboard" && isGridEditing && !isReviewMode,
    keyboardInset
  });
  useReviewScrollLock(isReviewMode);

  useEffect(() => {
    if (!isSheetInputViewport || !isInkMode) {
      return;
    }

    setSelectedCell(null);
  }, [isInkMode, isSheetInputViewport]);

  useEffect(() => {
    if (inputMode !== "sheet") {
      return;
    }

    setIsGridEditing(false);
  }, [inputMode, setIsGridEditing]);

  const handleNumberPadInput = (value: number): void => {
    if (!selectedCell || isReviewMode) {
      return;
    }

    handleCellChange(selectedCell.row, selectedCell.col, value);
  };

  const handleNumberPadClear = (): void => {
    if (!selectedCell || isReviewMode) {
      return;
    }

    handleCellChange(selectedCell.row, selectedCell.col, null);
  };

  return (
    <div className="solve-page" style={{ "--keyboard-inset": `${keyboardInset}px` } as CSSProperties}>
      {errorMessage && (
        <p aria-live="polite" className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

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
              onCellBlur={inputMode === "keyboard" ? () => setIsGridEditing(false) : undefined}
              onCellChange={handleCellChange}
              onCellFocus={inputMode === "keyboard" ? () => setIsGridEditing(true) : undefined}
              onCellSelect={
                inputMode === "sheet"
                  ? (row, col) => {
                      setSelectedCell({ row, col });
                    }
                  : undefined
              }
              selectedCell={inputMode === "sheet" ? selectedCell : null}
            />
            <InkOverlay
              activeBlockId={activeBlockId}
              inkState={inkState}
              isInkMode={isInkMode}
              onActiveBlockChange={setActiveBlockId}
              onCommitStroke={handleCommitStroke}
            />
          </div>
        </div>
        <div className="legend solve-legend">
          <span className="legend-item legend-given">初期値</span>
          <span className="legend-item legend-user">ユーザー入力</span>
          <span className="legend-item legend-empty">空マス</span>
        </div>
      </section>
      <section className="panel solve-controls">
        <div className="solve-toggle-row">
          <button
            aria-label={`確認モード切替（現在: ${isReviewMode ? "ON" : "OFF"}）`}
            aria-pressed={isReviewMode}
            className={isReviewMode ? "mode-toggle-button on" : "mode-toggle-button off"}
            onClick={toggleReviewMode}
            type="button"
          >
            <span aria-hidden="true" className="mode-state-dot" data-state={isReviewMode ? "on" : "off"} />
            <span className="mode-label">確認</span>
          </button>
          <InkToggleBar
            isInkMode={isInkMode}
            isReviewMode={isReviewMode}
            onToggleInkMode={toggleInkMode}
          />
        </div>
        <div className="solve-mode-slot">
          {isReviewMode ? (
            <p className="hint review-mode-message">確認モード中: 盤面操作と画面移動をロック中です。</p>
          ) : shouldShowInkActions ? (
            <InkActionFloatBar onClearActiveBlock={handleClearActiveBlock} onClearAll={handleClearAllInk} />
          ) : (
            <div aria-hidden="true" className="mode-slot-placeholder" />
          )}
        </div>
      </section>
      {inputMode === "sheet" ? (
        <section className="solve-input-sheet-slot">
          {!isInkMode ? (
            <SolveNumberPad
              disabled={isReviewMode || selectedCell === null}
              onClear={handleNumberPadClear}
              onNumber={handleNumberPadInput}
            />
          ) : (
            <div aria-hidden="true" className="solve-number-pad-placeholder" />
          )}
        </section>
      ) : (
        <div aria-hidden="true" className="keyboard-spacer" />
      )}
    </div>
  );
}
