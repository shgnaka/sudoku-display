interface SolveNumberPadProps {
  numberDisabled: boolean;
  backspaceDisabled: boolean;
  onNumber: (value: number) => void;
  onBackspace: () => void;
}

const NUMBER_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function SolveNumberPad({
  numberDisabled,
  backspaceDisabled,
  onNumber,
  onBackspace
}: SolveNumberPadProps): JSX.Element {
  return (
    <section aria-label="数字入力" className="solve-number-pad" role="region">
      <div className="solve-number-pad-grid">
        {NUMBER_KEYS.map((value) => (
          <button
            aria-label={`数字 ${value}`}
            className="btn btn--pad"
            disabled={numberDisabled}
            key={value}
            onClick={() => onNumber(value)}
            type="button"
          >
            {value}
          </button>
        ))}
        <button
          aria-label="数字を消去"
          className="btn btn--pad btn--backspace"
          disabled={backspaceDisabled}
          onClick={onBackspace}
          type="button"
        >
          ⌫
        </button>
      </div>
    </section>
  );
}
