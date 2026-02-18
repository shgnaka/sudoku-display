import { useEffect, useState } from "react";
import "./App.css";
import { PuzzleInput } from "./components/PuzzleInput";
import { SudokuGrid } from "./components/SudokuGrid";
import { DEFAULT_PUZZLE_TEXT } from "./lib/defaultPuzzle";
import { parseSudokuText } from "./lib/sudokuParser";
import { setUserCell } from "./lib/sudokuModel";
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

  return (
    <main className="app-root">
      <header>
        <h1>Sudoku Display</h1>
      </header>

      <PuzzleInput onChange={setRawInput} value={rawInput} />

      {errorMessage && (
        <p aria-live="polite" className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <section className="panel">
        <h2>盤面</h2>
        <SudokuGrid board={board} onCellChange={handleCellChange} />
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
