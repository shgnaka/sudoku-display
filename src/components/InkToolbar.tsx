import type { BlockId } from "../types/ink";

interface InkToolbarProps {
  isInkMode: boolean;
  activeBlockId: BlockId;
  onClearActiveBlock: () => void;
  onClearAll: () => void;
  onToggleInkMode: () => void;
}

export function InkToolbar({
  isInkMode,
  activeBlockId,
  onClearActiveBlock,
  onClearAll,
  onToggleInkMode
}: InkToolbarProps): JSX.Element {
  return (
    <section className="panel ink-panel">
      <div className="ink-toolbar-header">
        <h2>手書きメモ</h2>
        <span className={isInkMode ? "ink-mode-badge on" : "ink-mode-badge"}>
          {isInkMode ? "描画モード ON" : "描画モード OFF"}
        </span>
      </div>
      <p className="hint">Apple Pencil/ペンまたはマウスで描画できます。指タッチはスクロール優先です。</p>
      <div className="ink-toolbar-actions">
        <button onClick={onToggleInkMode} type="button">
          {isInkMode ? "描画モードをOFF" : "描画モードをON"}
        </button>
        <button onClick={onClearActiveBlock} type="button">
          現在ブロックを消去（{activeBlockId}）
        </button>
        <button className="danger" onClick={onClearAll} type="button">
          メモを全消去
        </button>
      </div>
    </section>
  );
}
