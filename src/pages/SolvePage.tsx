import type { CSSProperties } from "react";
import { InkActionFloatBar } from "../components/InkActionFloatBar";
import { InkOverlay } from "../components/InkOverlay";
import { InkToggleBar } from "../components/InkToggleBar";
import { SudokuGrid } from "../components/SudokuGrid";
import { useKeyboardInset } from "../lib/useKeyboardInset";
import { useKeyboardScrollLock } from "../lib/useKeyboardScrollLock";
import { useSudokuAppState } from "../state/SudokuAppStateProvider";

export function SolvePage(): JSX.Element {
  const {
    board,
    errorMessage,
    isInkMode,
    isReviewMode,
    activeBlockId,
    inkState,
    setActiveBlockId,
    setIsInkMode,
    setIsGridEditing,
    handleCellChange,
    handleCommitStroke,
    handleClearActiveBlock,
    handleClearAllInk,
    toggleReviewMode,
    isGridEditing
  } = useSudokuAppState();

  const keyboardInset = useKeyboardInset();
  useKeyboardScrollLock({ enabled: isGridEditing && !isReviewMode, keyboardInset });

  return (
    <div className="solve-page" style={{ "--keyboard-inset": `${keyboardInset}px` } as CSSProperties}>
      {errorMessage && (
        <p aria-live="polite" className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <section className="panel">
        <div className="board-panel-header">
          <h2>盤面</h2>
        </div>
        <div className={isReviewMode ? "board-wrap review-locked" : "board-wrap"}>
          <SudokuGrid
            board={board}
            disabled={isReviewMode}
            onCellBlur={() => setIsGridEditing(false)}
            onCellChange={handleCellChange}
            onCellFocus={() => setIsGridEditing(true)}
          />
          <InkOverlay
            activeBlockId={activeBlockId}
            inkState={inkState}
            isInkMode={isInkMode}
            onActiveBlockChange={setActiveBlockId}
            onCommitStroke={handleCommitStroke}
          />
        </div>
        <div className="legend">
          <span className="legend-item legend-given">初期値</span>
          <span className="legend-item legend-user">ユーザー入力</span>
          <span className="legend-item legend-empty">空マス</span>
        </div>
      </section>
      <section className="panel solve-controls">
        <button
          className={isReviewMode ? "mode-toggle-button on" : "mode-toggle-button off"}
          onClick={toggleReviewMode}
          type="button"
        >
          {isReviewMode ? "確認モードをOFF" : "確認モードをON"}
        </button>
        {isReviewMode && <p className="hint">確認モード中: 盤面の入力・手書き・盤面内操作をロック中です。</p>}
        <InkToggleBar
          isInkMode={isInkMode}
          isReviewMode={isReviewMode}
          onToggleInkMode={() => setIsInkMode(!isInkMode)}
        />
        {isInkMode && !isReviewMode && keyboardInset === 0 && (
          <InkActionFloatBar
            activeBlockId={activeBlockId}
            onClearActiveBlock={handleClearActiveBlock}
            onClearAll={handleClearAllInk}
          />
        )}
      </section>
      <div aria-hidden="true" className="keyboard-spacer" />
    </div>
  );
}
