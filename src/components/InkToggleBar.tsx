interface InkToggleBarProps {
  isInkMode: boolean;
  isReviewMode: boolean;
  onToggleInkMode: () => void;
}

export function InkToggleBar({ isInkMode, isReviewMode, onToggleInkMode }: InkToggleBarProps): JSX.Element {
  const currentStateLabel = isInkMode ? "ON" : "OFF";

  return (
    <button
      aria-label={isReviewMode ? "確認モード中は手書きモード無効" : `手書きモード切替（現在: ${currentStateLabel}）`}
      aria-pressed={isInkMode}
      className={isInkMode ? "btn btn--mode-toggle btn--active" : "btn btn--mode-toggle btn--inactive"}
      disabled={isReviewMode}
      onClick={onToggleInkMode}
      type="button"
    >
      <span aria-hidden="true" className="mode-state-dot" data-state={isInkMode ? "on" : "off"} />
      <span className="mode-label">手書き</span>
    </button>
  );
}
