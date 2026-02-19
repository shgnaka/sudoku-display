interface AppHeaderProps {
  currentLabel: string;
  onOpenMenu: () => void;
}

export function AppHeader({ currentLabel, onOpenMenu }: AppHeaderProps): JSX.Element {
  return (
    <header className="app-header">
      <div>
        <h1>Sudoku Display</h1>
        <p className="header-current">現在: {currentLabel}</p>
      </div>
      <button aria-label="メニューを開く" className="hamburger-button" onClick={onOpenMenu} type="button">
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
