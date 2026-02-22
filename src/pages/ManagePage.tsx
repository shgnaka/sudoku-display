import { PuzzleInput } from "../components/PuzzleInput";
import { SUDOKU_DIFFICULTIES } from "../constants/difficulty";
import { useSudokuAppState } from "../state/SudokuAppStateProvider";
import type { SudokuDifficulty } from "../constants/difficulty";

function formatDifficultyLabel(value: SudokuDifficulty): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function ManagePage(): JSX.Element {
  const {
    rawInput,
    setRawInput,
    difficulty,
    setDifficulty,
    isGenerating,
    handleGeneratePuzzle,
    generationError,
    errorMessage
  } = useSudokuAppState();

  return (
    <div className="manage-page">
      <section className="panel generator-panel">
        <h2>問題生成（Rust + WASM）</h2>
        <p className="hint">重い処理は Rust 側で実行し、唯一解の問題を生成します。</p>
        <div className="generator-controls">
          <label htmlFor="difficulty-select">
            難易度
            <select
              id="difficulty-select"
              onChange={(event) => setDifficulty(event.target.value as SudokuDifficulty)}
              value={difficulty}
            >
              {SUDOKU_DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {formatDifficultyLabel(level)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={isGenerating} onClick={() => void handleGeneratePuzzle()} type="button">
            {isGenerating ? "生成中..." : "新しい問題を生成"}
          </button>
        </div>
      </section>

      {generationError && (
        <p aria-live="polite" className="error-message" role="alert">
          {generationError}
        </p>
      )}
      {errorMessage && (
        <p aria-live="polite" className="error-message" role="alert">
          {errorMessage}
        </p>
      )}

      <PuzzleInput onChange={setRawInput} value={rawInput} />
    </div>
  );
}
