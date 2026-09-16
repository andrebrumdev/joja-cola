import { StepIcon } from "./StepIcon";

/** Pack quantity picker. Zero is a valid choice; the add action decides what zero allows. */
export function QtyStepper({ value, onChange, name }: { value: number; onChange: (next: number) => void; name: string }) {
  return (
    <div className="stepper" role="group" aria-label={`Packs de ${name}`}>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Diminuir ${name}`} disabled={value <= 0}>
        <StepIcon type="minus" />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label={`Aumentar ${name}`}>
        <StepIcon type="plus" />
      </button>
    </div>
  );
}
