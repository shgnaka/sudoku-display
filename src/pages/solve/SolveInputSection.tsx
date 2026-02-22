import { SolveNumberPad } from "../../components/SolveNumberPad";

interface SolveInputSectionProps {
  inputMode: "keyboard" | "sheet";
  isInkMode: boolean;
  inputDisabled: boolean;
  onNumber: (value: number) => void;
  onBackspace: () => void;
}

export function SolveInputSection({
  inputMode,
  isInkMode,
  inputDisabled,
  onNumber,
  onBackspace
}: SolveInputSectionProps): JSX.Element {
  if (inputMode !== "sheet") {
    return <div aria-hidden="true" className="keyboard-spacer" />;
  }

  return (
    <section className="solve-input-sheet-slot">
      {!isInkMode ? (
        <SolveNumberPad
          backspaceDisabled={inputDisabled}
          numberDisabled={inputDisabled}
          onBackspace={onBackspace}
          onNumber={onNumber}
        />
      ) : (
        <div aria-hidden="true" className="solve-number-pad-placeholder" />
      )}
    </section>
  );
}
