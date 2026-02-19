interface InkToggleBarProps {
  isInkMode: boolean;
  isReviewMode: boolean;
  onToggleInkMode: () => void;
}

export function InkToggleBar({ isInkMode, isReviewMode, onToggleInkMode }: InkToggleBarProps): JSX.Element {
  const label = isReviewMode
    ? "確認モード中は手書きモード無効"
    : isInkMode
      ? "手書き: ON"
      : "手書き: OFF";

  return (
    <button
      aria-label={isReviewMode ? "確認モード中は手書きモード無効" : `手書きモード切替（現在: ${label}）`}
      className={isInkMode ? "mode-toggle-button on" : "mode-toggle-button off"}
      disabled={isReviewMode}
      onClick={onToggleInkMode}
      type="button"
    >
      {label}
    </button>
  );
}
