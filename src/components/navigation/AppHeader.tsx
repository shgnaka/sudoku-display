import type { RefObject } from "react";

interface AppHeaderProps {
  currentLabel: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  menuButtonRef?: RefObject<HTMLButtonElement>;
  compact?: boolean;
}

export function AppHeader({
  currentLabel,
  isMenuOpen,
  onToggleMenu,
  menuButtonRef,
  compact = false
}: AppHeaderProps): JSX.Element {
  const buttonClassName = isMenuOpen ? "hamburger-button open" : "hamburger-button";
  const menuAriaLabel = isMenuOpen ? "メニューを閉じる" : "メニューを開く";

  return (
    <header className={compact ? "app-header compact" : "app-header"}>
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
