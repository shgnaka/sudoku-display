import { formatElapsedTime } from "../lib/elapsedTime";
import type { SolvedPuzzleHistoryEntry } from "../lib/historyStorage";
import { parseSudokuText } from "../lib/sudokuParser";

interface HistoryPageProps {
  entries: SolvedPuzzleHistoryEntry[];
  onViewEntry?: (entry: SolvedPuzzleHistoryEntry) => void;
  onRetryEntry?: (entry: SolvedPuzzleHistoryEntry) => void;
}

const DIFFICULTY_LABELS = {
  easy: "初級",
  medium: "中級",
  hard: "上級"
} as const;

const COMPLETED_AT_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo"
});

const COMPLETED_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Tokyo"
});

function getClueCount(puzzle: string): number {
  const parsed = parseSudokuText(puzzle);
  if (!parsed.ok) {
    return 0;
  }

  return parsed.board.flat().filter((cell) => cell.origin === "given").length;
}

function getPuzzleBoard(entry: SolvedPuzzleHistoryEntry) {
  if (entry.completedBoard) {
    return entry.completedBoard;
  }

  const parsed = parseSudokuText(entry.puzzle);
  return parsed.ok ? parsed.board : [];
}

export function HistoryPage({
  entries,
  onViewEntry = () => undefined,
  onRetryEntry = () => undefined
}: HistoryPageProps): JSX.Element {
  return (
    <div className="history-page">
      <header className="history-page-header">
        <div>
          <h2>問題履歴</h2>
          <p>{entries.length}件の履歴</p>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="history-empty" role="status">
          <p>まだ問題履歴はありません。</p>
          <p>問題を生成すると、ここに保存されます。</p>
        </div>
      ) : (
        <ol aria-label="問題履歴一覧" className="history-list">
          {entries.map((entry) => {
            const generatedDate = new Date(entry.generatedAt);
            const completedDate = entry.completedAt ? new Date(entry.completedAt) : null;
            const articleLabel = completedDate
              ? `${COMPLETED_DATE_FORMATTER.format(completedDate)}に解いた問題`
              : `${COMPLETED_DATE_FORMATTER.format(generatedDate)}に生成した問題、未完了`;
            const displayedBoard = getPuzzleBoard(entry);

            return (
              <li key={entry.attemptId}>
                <article aria-label={articleLabel} className="history-item">
                  <div className="history-item-content">
                    <div className="history-item-meta">
                      <div className="history-item-times">
                        <time dateTime={entry.generatedAt}>
                          開始 {COMPLETED_AT_FORMATTER.format(generatedDate)}
                        </time>
                        {entry.completedAt && completedDate && (
                          <time dateTime={entry.completedAt}>
                            完了 {COMPLETED_AT_FORMATTER.format(completedDate)}
                          </time>
                        )}
                        {entry.elapsedMs !== undefined && (
                          <span>所要時間 {formatElapsedTime(Math.floor(entry.elapsedMs / 1000))}</span>
                        )}
                      </div>
                      <div className="history-item-badges">
                        {!entry.completedAt && <span className="history-status-pending">未完了</span>}
                        {entry.difficulty && (
                          <span className="history-difficulty">
                            難易度 {DIFFICULTY_LABELS[entry.difficulty]}
                          </span>
                        )}
                        <span className="history-clue-count">ヒント {getClueCount(entry.puzzle)}個</span>
                      </div>
                    </div>
                    <div
                      aria-label={entry.completedAt ? "完成盤面" : "問題盤面"}
                      className="history-board"
                      role="grid"
                    >
                      {displayedBoard.map((row, rowIndex) => (
                        <div className="history-board-row" key={rowIndex} role="row">
                          {row.map((cell, colIndex) => {
                            const cellLabel =
                              cell.value === null
                                ? `${rowIndex + 1}行${colIndex + 1}列、空欄`
                                : `${rowIndex + 1}行${colIndex + 1}列、${
                                    cell.origin === "given" ? "初期数字" : "入力数字"
                                  }${cell.value}`;
                            return (
                              <span
                                aria-label={cellLabel}
                                className={`history-board-cell origin-${cell.origin}`}
                                data-col={colIndex}
                                data-origin={cell.origin}
                                data-row={rowIndex}
                                key={`${rowIndex}-${colIndex}`}
                                role="gridcell"
                              >
                                {cell.value ?? ""}
                              </span>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="history-item-actions">
                    <button onClick={() => onViewEntry(entry)} type="button">
                      {entry.completedAt ? "盤面を見る" : "続きから解く"}
                    </button>
                    {entry.completedAt && (
                      <button onClick={() => onRetryEntry(entry)} type="button">
                        もう一度解く
                      </button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
