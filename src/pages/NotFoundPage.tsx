interface NotFoundPageProps {
  onBackToSolve: () => void;
}

export function NotFoundPage({ onBackToSolve }: NotFoundPageProps): JSX.Element {
  return (
    <div className="notfound-page">
      <section className="panel notfound-panel">
        <h2>ページが見つかりません</h2>
        <p className="hint">
          指定されたURLは存在しないか、移動された可能性があります。数独を続けるには解くページに戻ってください。
        </p>
        <button onClick={onBackToSolve} type="button">
          解くへ戻る
        </button>
      </section>
    </div>
  );
}
