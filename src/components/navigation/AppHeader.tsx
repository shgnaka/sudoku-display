interface AppHeaderProps {
  currentLabel: string;
  onOpenMenu: () => void;
  compact?: boolean;
  floatingMenuOnly?: boolean;
}

export function AppHeader({ currentLabel, onOpenMenu, compact = false, floatingMenuOnly = false }: AppHeaderProps): JSX.Element {
  const buttonClassName = floatingMenuOnly ? "hamburger-button floating" : "hamburger-button";

  return (
    <header className={compact ? "app-header compact" : "app-header"}>
      {!compact && (
        <div>
          <h1>Sudoku Display</h1>
          <p className="header-current">現在: {currentLabel}</p>
        </div>
      )}
      <button aria-label="メニューを開く" className={buttonClassName} onClick={onOpenMenu} type="button">
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
