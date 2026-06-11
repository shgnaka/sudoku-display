import type { RefObject } from "react";

interface AppHeaderProps {
  currentLabel: string;
  isHistoryActive: boolean;
  isMenuOpen: boolean;
  onToggleHistory: () => void;
  onToggleMenu: () => void;
  menuButtonRef?: RefObject<HTMLButtonElement>;
  compact?: boolean;
}

export function AppHeader({
  currentLabel,
  isHistoryActive,
  isMenuOpen,
  onToggleHistory,
  onToggleMenu,
  menuButtonRef,
  compact = false
}: AppHeaderProps): JSX.Element {
  const buttonClassName = isMenuOpen ? "hamburger-button open" : "hamburger-button";
  const menuAriaLabel = isMenuOpen ? "メニューを閉じる" : "メニューを開く";

  return (
    <header className={compact ? "app-header compact" : "app-header"}>
      <button
        aria-current={isHistoryActive ? "page" : undefined}
        aria-label={isHistoryActive ? "履歴を閉じて元のページに戻る" : "履歴を表示"}
        className={isHistoryActive ? "history-button active" : "history-button"}
        onClick={onToggleHistory}
        type="button"
      >
        履歴
      </button>
      {!compact && (
        <div>
          <h1>Sudoku Display</h1>
          <p className="header-current">現在: {currentLabel}</p>
        </div>
      )}
      <button
        aria-controls="app-side-drawer"
        aria-expanded={isMenuOpen}
        aria-label={menuAriaLabel}
        className={buttonClassName}
        onClick={onToggleMenu}
        ref={menuButtonRef}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
