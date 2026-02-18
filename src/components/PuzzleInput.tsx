interface PuzzleInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PuzzleInput({ value, onChange }: PuzzleInputProps): JSX.Element {
  return (
    <section className="panel">
      <h2>問題入力</h2>
      <p className="hint">入力中に自動反映します。形式が不正な場合は盤面を更新しません。</p>
      <textarea
        aria-label="puzzle-input"
        className="puzzle-input"
        onChange={(event) => onChange(event.target.value)}
        rows={12}
        value={value}
      />
    </section>
  );
}
