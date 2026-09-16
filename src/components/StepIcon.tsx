/** Stepper glyphs drawn in the app's icon grammar (round caps, 2px stroke), not text characters. */
export function StepIcon({ type }: { type: "minus" | "plus" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d={type === "minus" ? "M5 12h14" : "M12 5v14M5 12h14"} />
    </svg>
  );
}
