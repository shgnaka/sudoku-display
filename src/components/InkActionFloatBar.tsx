interface InkActionFloatBarProps {
  onClearActiveBlock: () => void;
  onClearAll: () => void;
}

export function InkActionFloatBar({ onClearActiveBlock, onClearAll }: InkActionFloatBarProps): JSX.Element {
  return (
    <section className="ink-actions-inline" role="region" aria-label="手書き操作">
      <button onClick={onClearActiveBlock} type="button">
        ブロック消去
      </button>
      <button className="danger" onClick={onClearAll} type="button">
        全消去
      </button>
    </section>
  );
}
