interface InkToggleBarProps {
  isInkMode: boolean;
  isReviewMode: boolean;
  onToggleInkMode: () => void;
}

export function InkToggleBar({ isInkMode, isReviewMode, onToggleInkMode }: InkToggleBarProps): JSX.Element {
  const label = isInkMode ? "手書き: ON" : "手書き: OFF";

  return (
    <section className="panel ink-toggle-bar">
      <button
        aria-label={isReviewMode ? "確認モード中は手書きモード無効" : `手書きモード切替（現在: ${label}）`}
        className={isInkMode ? "ink-toggle-button on" : "ink-toggle-button off"}
        disabled={isReviewMode}
        onClick={onToggleInkMode}
        type="button"
      >
        {isReviewMode ? "確認モード中は手書きモード無効" : label}
      </button>
    </section>
  );
}
