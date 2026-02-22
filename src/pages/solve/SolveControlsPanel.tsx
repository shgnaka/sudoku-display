import { InkActionFloatBar } from "../../components/InkActionFloatBar";
import { InkToggleBar } from "../../components/InkToggleBar";

interface SolveControlsPanelProps {
  isReviewMode: boolean;
  isInkMode: boolean;
  shouldShowLegendGuide: boolean;
  shouldShowInkActions: boolean;
  onToggleReviewMode: () => void;
  onToggleInkMode: () => void;
  onClearActiveBlock: () => void;
  onClearAllInk: () => void;
}

export function SolveControlsPanel({
  isReviewMode,
  isInkMode,
  shouldShowLegendGuide,
  shouldShowInkActions,
  onToggleReviewMode,
  onToggleInkMode,
  onClearActiveBlock,
  onClearAllInk
}: SolveControlsPanelProps): JSX.Element {
  return (
    <section className="panel solve-controls">
      <div className="solve-toggle-row">
        <button
          aria-label={`確認モード切替（現在: ${isReviewMode ? "ON" : "OFF"}）`}
          aria-pressed={isReviewMode}
          className={isReviewMode ? "btn btn--mode-toggle btn--active" : "btn btn--mode-toggle btn--inactive"}
          onClick={onToggleReviewMode}
          type="button"
        >
          <span aria-hidden="true" className="mode-state-dot" data-state={isReviewMode ? "on" : "off"} />
          <span className="mode-label">確認</span>
        </button>
        <InkToggleBar
          isInkMode={isInkMode}
          isReviewMode={isReviewMode}
          onToggleInkMode={onToggleInkMode}
        />
      </div>
      <div className="solve-mode-slot">
        {isReviewMode ? (
          <p className="hint review-mode-message">確認モード中: 盤面操作と画面移動をロック中です。</p>
        ) : shouldShowInkActions ? (
          <InkActionFloatBar onClearActiveBlock={onClearActiveBlock} onClearAll={onClearAllInk} />
        ) : (
          <div aria-hidden="true" className="mode-slot-placeholder" />
        )}
      </div>
      {shouldShowLegendGuide && (
        <details className="solve-legend">
          <summary className="solve-legend-summary">マスの色分けを表示</summary>
          <ul className="solve-legend-list">
            <li className="solve-legend-item">
              <span aria-hidden="true" className="solve-legend-chip solve-legend-chip--given" />
              初期値
            </li>
            <li className="solve-legend-item">
              <span aria-hidden="true" className="solve-legend-chip solve-legend-chip--user" />
              ユーザー入力
            </li>
            <li className="solve-legend-item">
              <span aria-hidden="true" className="solve-legend-chip solve-legend-chip--empty" />
              空
            </li>
          </ul>
        </details>
      )}
    </section>
  );
}
