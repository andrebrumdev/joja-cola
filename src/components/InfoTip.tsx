import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/**
 * A "?" toggletip: secondary context that stays out of the page until asked for.
 * Click, tap or keyboard toggles it; a mouse hover previews it; Escape or a click
 * outside closes it. The text is announced when it opens.
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      className="infotip"
      ref={root}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && !pinned && setOpen(false)}
    >
      <button
        type="button"
        className="infotip-button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          const next = !pinned;
          setPinned(next);
          setOpen(next);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.6-2.8 2.6" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      <div className="infotip-bubble" id={id} role="status" hidden={!open}>
        {open ? children : null}
      </div>
    </div>
  );
}
