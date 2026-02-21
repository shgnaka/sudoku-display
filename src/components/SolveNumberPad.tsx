interface SolveNumberPadProps {
  disabled: boolean;
  onNumber: (value: number) => void;
  onClear: () => void;
}

const NUMBER_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function SolveNumberPad({ disabled, onNumber, onClear }: SolveNumberPadProps): JSX.Element {
  return (
    <section aria-label="数字入力" className="solve-number-pad" role="region">
      <div className="solve-number-pad-grid">
        {NUMBER_KEYS.map((value) => (
          <button
            aria-label={`数字 ${value}`}
            disabled={disabled}
            key={value}
            onClick={() => onNumber(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      <button aria-label="数字消去" className="clear" disabled={disabled} onClick={onClear} type="button">
        消去
      </button>
    </section>
  );
}
