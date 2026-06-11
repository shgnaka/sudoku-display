import { formatElapsedTime } from "../../lib/elapsedTime";
import { useSudokuAppState } from "../../state/SudokuAppStateProvider";

export function SolveToolsPanel(): JSX.Element | null {
  const {
    answerCheckMessage,
    checkAnswers,
    elapsedSeconds,
    isTimerCompleted,
    isTimerPaused,
    toggleTimerPause
  } = useSudokuAppState();

  if (isTimerCompleted) {
    return null;
  }

  return (
    <section aria-label="解答ツール" className="solve-tools-panel">
      <div className="solve-tools-time">
        <span>経過時間</span>
        <strong aria-live="off">{formatElapsedTime(elapsedSeconds)}</strong>
      </div>
      <div className="solve-tools-actions">
        <button className="btn btn--inactive" onClick={toggleTimerPause} type="button">
          {isTimerPaused ? "再開" : "一時停止"}
        </button>
        <button
          className="btn btn--active"
          disabled={isTimerPaused}
          onClick={checkAnswers}
          type="button"
        >
          答え合わせ
        </button>
      </div>
      {answerCheckMessage && (
        <p aria-live="polite" className="solve-tools-message" role="status">
          {answerCheckMessage}
        </p>
      )}
    </section>
  );
}
