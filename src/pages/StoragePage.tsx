import { useSudokuAppState } from "../state/SudokuAppStateProvider";

export function StoragePage(): JSX.Element {
  const { resetGameData, clearInkData, clearAllStoredData } = useSudokuAppState();

  const handleClearGame = (): void => {
    if (!window.confirm("盤面データを初期化します。よろしいですか？")) {
      return;
    }

    resetGameData();
  };

  const handleClearInk = (): void => {
    if (!window.confirm("手書きメモを削除します。よろしいですか？")) {
      return;
    }

    clearInkData();
  };

  const handleClearAll = (): void => {
    if (!window.confirm("保存データをすべて削除します。よろしいですか？")) {
      return;
    }

    clearAllStoredData();
  };

  return (
    <div className="storage-page">
      <section className="panel">
        <h2>保存データ管理</h2>
        <p className="hint">ローカルストレージに保存されている盤面と手書きメモを削除できます。</p>
        <div className="storage-actions">
          <button onClick={handleClearGame} type="button">
            盤面データを初期化
          </button>
          <button onClick={handleClearInk} type="button">
            手書きメモを削除
          </button>
          <button className="danger" onClick={handleClearAll} type="button">
            すべて削除
          </button>
        </div>
      </section>
    </div>
  );
}
