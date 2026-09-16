/**
 * Line art for an empty order: an open shipping box in isometric view, flaps out,
 * nothing inside, with the Joja cyan tape along its base. Drawn in the system's
 * navy surfaces and muted strokes so it reads as a quiet illustration, not an icon.
 *
 * Coordinates come from an isometric projection of a 5 × 2.6 × 3.4 box
 * (x → down-right, z → down-left, y → up), 24px per unit.
 */
export function EmptyBoxArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-130 -125 290 245" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="empty-box-glow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="15" cy="10" rx="140" ry="112" fill="url(#empty-box-glow)" />
      {/* Floor shadow */}
      <path d="M-12 108 L118 64 L150 80 L20 124 Z" fill="#020712" opacity="0.55" />

      <g stroke="#7f95b3" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Back flaps, folded away from the opening */}
        <path d="M0 -62.4 L103.9 -2.4 L130.5 -40.8 L26.6 -100.8 Z" fill="#10234a" />
        <path d="M0 -62.4 L-70.7 -21.6 L-97.3 -60 L-26.6 -100.8 Z" fill="#0d1f42" />
        {/* Inside: back walls and the empty floor */}
        <path d="M0 0 L103.9 60 L103.9 -2.4 L0 -62.4 Z" fill="#0a1733" />
        <path d="M0 0 L-70.7 40.8 L-70.7 -21.6 L0 -62.4 Z" fill="#081530" />
        <path d="M0 0 L103.9 60 L33.3 100.8 L-70.7 40.8 Z" fill="#06102a" />
        {/* Front walls */}
        <path d="M-70.7 40.8 L33.3 100.8 L33.3 38.4 L-70.7 -21.6 Z" fill="#13284c" />
        <path d="M103.9 60 L33.3 100.8 L33.3 38.4 L103.9 -2.4 Z" fill="#0f2142" />
      </g>

      {/* Joja tape along the base of both front walls */}
      <path d="M-70.7 19.2 L33.3 79.2 L33.3 88.8 L-70.7 28.8 Z" fill="#00e5ff" opacity="0.85" />
      <path d="M103.9 38.4 L33.3 79.2 L33.3 88.8 L103.9 48 Z" fill="#00b8d4" opacity="0.85" />

      <g stroke="#7f95b3" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Front flaps, open and hanging outward */}
        <path d="M-70.7 -21.6 L33.3 38.4 L14.5 57.6 L-89.4 -2.4 Z" fill="#173058" />
        <path d="M103.9 -2.4 L33.3 38.4 L52 57.6 L122.6 16.8 Z" fill="#132a50" />
        {/* The corner where the walls meet, drawn last so it stays crisp */}
        <path d="M33.3 38.4 L33.3 100.8" />
      </g>
    </svg>
  );
}
