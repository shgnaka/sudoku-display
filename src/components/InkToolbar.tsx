import type { BlockId } from "../types/ink";

interface InkToolbarProps {
  isInkMode: boolean;
  isReviewMode: boolean;
  activeBlockId: BlockId;
  onClearActiveBlock: () => void;
  onClearAll: () => void;
  onToggleInkMode: () => void;
}

export function InkToolbar({
  isInkMode,
  isReviewMode,
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
      <p className="hint">
        Apple Pencil/ペンまたはマウスで描画できます。指タッチはスクロール優先です。
        {isReviewMode ? " 確認モード中は手書き入力できません。" : ""}
      </p>
      <div className="ink-toolbar-actions">
        <button disabled={isReviewMode} onClick={onToggleInkMode} type="button">
          {isReviewMode
            ? "確認モード中は描画モード無効"
            : isInkMode
              ? "描画モードをOFF"
              : "描画モードをON"}
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
