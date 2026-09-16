// Shared between GSAP (writes, in Landing.tsx) and the R3F render loop (reads, in
// the scene). A plain mutable object: updating it never re-renders React.
export const sceneScroll = {
  /** 0 = hero … CHAPTERS - 1 = closing section, fractional in between */
  chapter: 0,
  /** ScrollTrigger velocity, px/s */
  velocity: 0,
  /** hero entrance, 0 → 1 */
  intro: 0,
  /** Login: the second can stays in and the two keep toasting, 0 → 1 */
  duo: 0,
  /** Set when a page opens on a chapter: the scene lands there instead of travelling from the last page's. */
  snap: false,
};

// Each chapter parks the can in a layout slot: [data-can-anchor="<name>"].
export const CHAPTER_ANCHORS = [
  "hero",
  "beats",
  "beats",
  "beats",
  "plate-1",
  "plate-2",
  "plate-3",
  "sistema",
  "varejo",
  "close",
] as const;

export const CHAPTERS = CHAPTER_ANCHORS.length;
export const PHONE_ANCHORS = new Set(["sistema", "varejo"]);
/** The "O acompanhamento." beat: a second can comes in for a toast, then leaves. */
export const TOAST_CHAPTER = 2;
/** The "Gelada." beat: the can frosts over. */
export const FROST_CHAPTER = 3;
