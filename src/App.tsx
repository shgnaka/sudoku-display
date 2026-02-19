import { useEffect, useState } from "react";
import "./App.css";
import { InkOverlay } from "./components/InkOverlay";
import { InkToolbar } from "./components/InkToolbar";
import { PuzzleInput } from "./components/PuzzleInput";
import { SudokuGrid } from "./components/SudokuGrid";
import { DEFAULT_PUZZLE_TEXT } from "./lib/defaultPuzzle";
import { appendStroke, clearAll, clearBlock, createEmptyInkState } from "./lib/inkModel";
import { clearInkState, loadInkState, saveInkState } from "./lib/inkStorage";
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
  const [rawInput, setRawInput] = useState(DEFAULT_PUZZLE_TEXT);
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [errorMessage, setErrorMessage] = useState("");
  const [isInkMode, setIsInkMode] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<BlockId>("0-0");
  const [inkState, setInkState] = useState<InkState>(() => createEmptyInkState());

  useEffect(() => {
    setInkState(loadInkState());
  }, []);

  useEffect(() => {
    saveInkState(inkState);
  }, [inkState]);

  useEffect(() => {
    const result = parseSudokuText(rawInput);

    if (result.ok) {
      setBoard(result.board);
      setErrorMessage("");
      return;
    }

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

  return (
    <main className="app-root">
      <header>
        <h1>Sudoku Display</h1>
      </header>

      <PuzzleInput onChange={setRawInput} value={rawInput} />

      <InkToolbar
        activeBlockId={activeBlockId}
        isInkMode={isInkMode}
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
        <h2>盤面</h2>
        <div className="board-wrap">
          <SudokuGrid board={board} onCellChange={handleCellChange} />
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
    </main>
  );
}

export default App;
