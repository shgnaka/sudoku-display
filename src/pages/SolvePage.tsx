import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import "../styles/solve-page.css";
import { useBoardFitSize } from "../lib/useBoardFitSize";
import { useIsMobileViewport } from "../lib/useIsMobileViewport";
import { useKeyboardInset } from "../lib/useKeyboardInset";
import { useKeyboardScrollLock } from "../lib/useKeyboardScrollLock";
import { useSolveInputSheetViewport } from "../lib/useSolveInputSheetViewport";
import { useReviewScrollLock } from "../lib/useReviewScrollLock";
import { useSudokuAppState } from "../state/SudokuAppStateProvider";
import { SolveBoardPanel } from "./solve/SolveBoardPanel";
import { SolveControlsPanel } from "./solve/SolveControlsPanel";
import { SolveInputSection } from "./solve/SolveInputSection";
import { useSolveSelectionController } from "./solve/useSolveSelectionController";

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
  const solvePageRef = useRef<HTMLDivElement | null>(null);
  const boardSlotRef = useRef<HTMLDivElement | null>(null);
  const boardFitSize = useBoardFitSize(boardSlotRef, { enabled: !isMobileViewport });
  const inputMode = isSheetInputViewport ? "sheet" : "keyboard";
  const shouldShowInkActions = isInkMode && (inputMode === "sheet" || keyboardInset === 0);

  const {
    selectedCell,
    sheetA11yMessage,
    sheetA11yRevision,
    handleSheetCellSelect,
    handleNumberPadInput,
    handleNumberPadBackspace
  } = useSolveSelectionController({
    inputMode,
    isInkMode,
    isReviewMode,
    solvePageRef,
    onCellChange: handleCellChange
  });

  const isSheetInputDisabled = isReviewMode || selectedCell === null;

  useKeyboardScrollLock({
    enabled: inputMode === "keyboard" && isGridEditing && !isReviewMode,
    keyboardInset
  });
  useReviewScrollLock(isReviewMode);

  useEffect(() => {
    if (inputMode !== "sheet") {
      return;
    }

    setIsGridEditing(false);
  }, [inputMode, setIsGridEditing]);

  return (
    <div
      className="solve-page"
      data-testid="solve-page"
      ref={solvePageRef}
      style={{ "--keyboard-inset": `${keyboardInset}px` } as CSSProperties}
    >
      {inputMode === "sheet" && (
        <p aria-atomic="true" aria-live="polite" className="visually-hidden" key={sheetA11yRevision}>
          {sheetA11yMessage}
        </p>
      )}
      {errorMessage && (
        <p aria-live="polite" className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <SolveBoardPanel
        activeBlockId={activeBlockId}
        board={board}
        boardFitSize={boardFitSize}
        boardSlotRef={boardSlotRef}
        inkState={inkState}
        inputMode={inputMode}
        isInkMode={isInkMode}
        isReviewMode={isReviewMode}
        onActiveBlockChange={setActiveBlockId}
        onCellBlur={() => setIsGridEditing(false)}
        onCellChange={handleCellChange}
        onCellFocus={() => setIsGridEditing(true)}
        onCellSelect={handleSheetCellSelect}
        onCommitStroke={handleCommitStroke}
        selectedCell={selectedCell}
      />

      <SolveControlsPanel
        isInkMode={isInkMode}
        isReviewMode={isReviewMode}
        onClearActiveBlock={handleClearActiveBlock}
        onClearAllInk={handleClearAllInk}
        onToggleInkMode={toggleInkMode}
        onToggleReviewMode={toggleReviewMode}
        shouldShowInkActions={shouldShowInkActions}
      />

      <SolveInputSection
        inputDisabled={isSheetInputDisabled}
        inputMode={inputMode}
        isInkMode={isInkMode}
        onBackspace={handleNumberPadBackspace}
        onNumber={handleNumberPadInput}
      />
    </div>
  );
}
