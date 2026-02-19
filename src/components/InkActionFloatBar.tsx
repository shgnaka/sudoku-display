import type { BlockId } from "../types/ink";

interface InkActionFloatBarProps {
  activeBlockId: BlockId;
  onClearActiveBlock: () => void;
  onClearAll: () => void;
}

export function InkActionFloatBar({
  activeBlockId,
  onClearActiveBlock,
  onClearAll
}: InkActionFloatBarProps): JSX.Element {
  return (
    <section className="ink-actions-inline" role="region" aria-label="手書き操作">
      <button onClick={onClearActiveBlock} type="button">
        現在ブロック消去（{activeBlockId}）
      </button>
      <button className="danger" onClick={onClearAll} type="button">
        メモを全消去
      </button>
    </section>
  );
}
