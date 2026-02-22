import { InkActionFloatBar } from "../../components/InkActionFloatBar";
import { InkToggleBar } from "../../components/InkToggleBar";

interface SolveControlsPanelProps {
  isReviewMode: boolean;
  isInkMode: boolean;
  shouldShowInkActions: boolean;
  onToggleReviewMode: () => void;
  onToggleInkMode: () => void;
  onClearActiveBlock: () => void;
  onClearAllInk: () => void;
}

export function SolveControlsPanel({
  isReviewMode,
  isInkMode,
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
          className={isReviewMode ? "mode-toggle-button on" : "mode-toggle-button off"}
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
    </section>
  );
}
