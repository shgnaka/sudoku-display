import { useSudokuAppState } from "../state/SudokuAppStateProvider";
import { STORAGE_MESSAGES } from "../constants/messages/storage";

export function StoragePage(): JSX.Element {
  const { resetGameData, clearInkData, clearAllStoredData } = useSudokuAppState();

  const handleClearGame = (): void => {
    if (!window.confirm(STORAGE_MESSAGES.confirm.clearGame)) {
      return;
    }

    resetGameData();
  };

  const handleClearInk = (): void => {
    if (!window.confirm(STORAGE_MESSAGES.confirm.clearInk)) {
      return;
    }

    clearInkData();
  };

  const handleClearAll = (): void => {
    if (!window.confirm(STORAGE_MESSAGES.confirm.clearAll)) {
      return;
    }

    clearAllStoredData();
  };

  return (
    <div className="storage-page">
      <section className="panel">
        <h2>{STORAGE_MESSAGES.title}</h2>
        <p className="hint">{STORAGE_MESSAGES.hint}</p>
        <div className="storage-actions">
          <button className="btn" onClick={handleClearGame} type="button">
            {STORAGE_MESSAGES.actions.clearGame}
          </button>
          <button className="btn" onClick={handleClearInk} type="button">
            {STORAGE_MESSAGES.actions.clearInk}
          </button>
          <button className="btn btn--danger" onClick={handleClearAll} type="button">
            {STORAGE_MESSAGES.actions.clearAll}
          </button>
        </div>
      </section>
    </div>
  );
}
