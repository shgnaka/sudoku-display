import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./App.css";
import { InkOverlay } from "./components/InkOverlay";
import { InkToolbar } from "./components/InkToolbar";
import { PuzzleInput } from "./components/PuzzleInput";
import { SudokuGrid } from "./components/SudokuGrid";
import { DEFAULT_PUZZLE_TEXT } from "./lib/defaultPuzzle";
import { loadGameState, saveGameState } from "./lib/gameStorage";
import { appendStroke, clearAll, clearBlock, createEmptyInkState } from "./lib/inkModel";
import { clearInkState, loadInkState, saveInkState } from "./lib/inkStorage";
import { useKeyboardInset } from "./lib/useKeyboardInset";
import { useKeyboardScrollLock } from "./lib/useKeyboardScrollLock";
import { parseSudokuText } from "./lib/sudokuParser";
import { setUserCell } from "./lib/sudokuModel";
import type { Stroke, BlockId, InkState } from "./types/ink";
import type { Board } from "./types/sudoku";

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ value: null, origin: "empty" as const }))
  );
}

function App(): JSX.Element {
  const persistedGame = loadGameState();
  const [rawInput, setRawInput] = useState(persistedGame?.rawInput ?? DEFAULT_PUZZLE_TEXT);
  const [board, setBoard] = useState<Board>(() => persistedGame?.board ?? emptyBoard());
  const [errorMessage, setErrorMessage] = useState("");
  const [isInkMode, setIsInkMode] = useState(false);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<BlockId>("0-0");
  const [inkState, setInkState] = useState<InkState>(() => createEmptyInkState());
  const shouldKeepPersistedBoardRef = useRef(Boolean(persistedGame));
  const keyboardInset = useKeyboardInset();
  useKeyboardScrollLock({ enabled: isGridEditing && !isReviewMode, keyboardInset });

  useEffect(() => {
    setInkState(loadInkState());
  }, []);

  useEffect(() => {
    saveInkState(inkState);
  }, [inkState]);

  useEffect(() => {
    saveGameState({ rawInput, board });
  }, [rawInput, board]);

  useEffect(() => {
    const result = parseSudokuText(rawInput);

    if (result.ok) {
      if (shouldKeepPersistedBoardRef.current) {
        shouldKeepPersistedBoardRef.current = false;
        setErrorMessage("");
        return;
      }

      setBoard(result.board);
      setErrorMessage("");
      return;
    }

    shouldKeepPersistedBoardRef.current = false;
    setErrorMessage(result.error);
  }, [rawInput]);

  const handleCellChange = (row: number, col: number, value: number | null): void => {
    setBoard((current) => setUserCell(current, row, col, value));
  };

  const handleCommitStroke = (blockId: BlockId, stroke: Stroke): void => {
    setInkState((current) => appendStroke(current, blockId, stroke));
  };

  const handleClearActiveBlock = (): void => {
    setInkState((current) => clearBlock(current, activeBlockId));
  };

  const handleClearAll = (): void => {
    setInkState(clearAll());
    clearInkState();
  };

  const toggleReviewMode = (): void => {
    setIsReviewMode((prev) => {
      const next = !prev;
      if (next) {
        setIsInkMode(false);
        setIsGridEditing(false);
      }
      return next;
    });
  };

  return (
    <main
      className="app-root"
      style={{ "--keyboard-inset": `${keyboardInset}px` } as CSSProperties}
    >
      <header>
        <h1>Sudoku Display</h1>
      </header>

      <PuzzleInput onChange={setRawInput} value={rawInput} />

      <InkToolbar
        activeBlockId={activeBlockId}
        isInkMode={isInkMode}
        isReviewMode={isReviewMode}
        onClearActiveBlock={handleClearActiveBlock}
        onClearAll={handleClearAll}
        onToggleInkMode={() => setIsInkMode((prev) => !prev)}
      />

      {errorMessage && (
        <p aria-live="polite" className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <section className="panel">
        <div className="board-panel-header">
          <h2>盤面</h2>
          <button
            className={isReviewMode ? "review-mode-button on" : "review-mode-button"}
            onClick={toggleReviewMode}
            type="button"
          >
            {isReviewMode ? "確認モードをOFF" : "確認モードをON"}
          </button>
        </div>
        {isReviewMode && <p className="hint">確認モード中: 盤面の入力・手書き・盤面内操作をロック中です。</p>}
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
      <div aria-hidden="true" className="keyboard-spacer" />
    </main>
  );
}

export default App;
