export function HelpPage(): JSX.Element {
  return (
    <div className="help-page">
      <section className="panel">
        <h2>使い方</h2>
        <p className="hint">解くページで盤面入力、作問ページで問題準備を行います。</p>
        <ul className="help-list">
          <li>「解く」: 数字入力、手書きモード切り替え、確認モード。</li>
          <li>「作問」: 難易度指定で自動生成、またはテキスト入力。</li>
          <li>「保存管理」: ローカル保存データの削除。</li>
        </ul>
      </section>

      <section className="panel">
        <h2>入力フォーマット</h2>
        <ul className="help-list">
          <li>データ行は9行、各行は `1-9` または `.` を9セル含む必要があります。</li>
          <li>許可文字: `1-9`, `.`, 空白, `|`, `+`, `-`。</li>
          <li>形式が不正な場合はエラー表示し、盤面は最後の有効状態を維持します。</li>
        </ul>
      </section>

      <section className="panel">
        <h2>手書きモード</h2>
        <ul className="help-list">
          <li>Apple Pencil/ペンまたはマウスで描画できます。指タッチはスクロール優先です。</li>
          <li>解くページの「手書き」ボタンで切り替えます（ボタンの色と点で状態を確認できます）。</li>
          <li>手書きモードがONの間だけ、画面下に消去操作が表示されます。</li>
        </ul>
      </section>

      <section className="panel">
        <h2>確認モード</h2>
        <p className="hint">確認モード中は盤面編集と手書き描画をロックします。見直し時の誤操作防止に使ってください。</p>
      </section>
    </div>
  );
}
