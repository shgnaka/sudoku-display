import { useCallback, useEffect, useRef, useState } from "react";
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
  const [sheetA11yMessage, setSheetA11yMessage] = useState("");
  const solvePageRef = useRef<HTMLDivElement | null>(null);
  const boardSlotRef = useRef<HTMLDivElement | null>(null);
  const boardFitSize = useBoardFitSize(boardSlotRef, { enabled: !isMobileViewport });
  const inputMode = isSheetInputViewport ? "sheet" : "keyboard";
  const shouldShowInkActions = isInkMode && (inputMode === "sheet" || keyboardInset === 0);
  useKeyboardScrollLock({
    enabled: inputMode === "keyboard" && isGridEditing && !isReviewMode,
    keyboardInset
  });
  useReviewScrollLock(isReviewMode);

  const announceSheetMessage = useCallback((message: string): void => {
    setSheetA11yMessage((previous) => {
      if (previous === message) {
        return previous;
      }

      return message;
    });
  }, []);

  const describeCurrentCell = (row: number, col: number): string => {
    const cell = board[row]?.[col];
    if (!cell || cell.value === null) {
      return `${row + 1}行${col + 1}列を選択。現在は空です。`;
    }

    return `${row + 1}行${col + 1}列を選択。現在の値は ${cell.value} です。`;
  };

  useEffect(() => {
    if (inputMode !== "sheet") {
      setSelectedCell(null);
      return;
    }

    if (isInkMode || isReviewMode) {
      setSelectedCell(null);
      announceSheetMessage("セル選択を解除しました。");
    }
  }, [announceSheetMessage, inputMode, isInkMode, isReviewMode]);

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
    announceSheetMessage(`${selectedCell.row + 1}行${selectedCell.col + 1}列を ${value} にしました。`);
  };

  const handleNumberPadBackspace = (): void => {
    if (!selectedCell || isReviewMode) {
      return;
    }

    handleCellChange(selectedCell.row, selectedCell.col, null);
    announceSheetMessage(`${selectedCell.row + 1}行${selectedCell.col + 1}列を空にしました。`);
  };

  useEffect(() => {
    if (inputMode !== "sheet" || selectedCell === null) {
      return;
    }

    const root = solvePageRef.current;
    if (!root) {
      return;
    }

    const onPointerDown = (event: Event): void => {
      const target = event.target as Element | null;
      if (!target) {
        return;
      }

      if (target.closest(".sudoku-cell") || target.closest(".solve-number-pad")) {
        return;
      }

      setSelectedCell(null);
      announceSheetMessage("セル選択を解除しました。");
    };

    root.addEventListener("pointerdown", onPointerDown, true);
    root.addEventListener("mousedown", onPointerDown, true);
    root.addEventListener("touchstart", onPointerDown, true);
    root.addEventListener("click", onPointerDown, true);
    return () => {
      root.removeEventListener("pointerdown", onPointerDown, true);
      root.removeEventListener("mousedown", onPointerDown, true);
      root.removeEventListener("touchstart", onPointerDown, true);
      root.removeEventListener("click", onPointerDown, true);
    };
  }, [announceSheetMessage, inputMode, selectedCell]);

  return (
    <div className="solve-page" ref={solvePageRef} style={{ "--keyboard-inset": `${keyboardInset}px` } as CSSProperties}>
      {inputMode === "sheet" && (
        <p aria-atomic="true" aria-live="polite" className="visually-hidden">
          {sheetA11yMessage}
        </p>
      )}
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
                  ? (row, col, isEditable) => {
                      if (!isEditable) {
                        setSelectedCell(null);
                        announceSheetMessage("セル選択を解除しました。");
                        return;
                      }

                      setSelectedCell((current) => {
                        if (current?.row === row && current.col === col) {
                          announceSheetMessage("セル選択を解除しました。");
                          return null;
                        }

                        announceSheetMessage(describeCurrentCell(row, col));
                        return { row, col };
                      });
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
              numberDisabled={isReviewMode || selectedCell === null}
              onBackspace={handleNumberPadBackspace}
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
