import can from "../assets/can.png";
import canLaranja from "../assets/can-laranja.png";
import canLimao from "../assets/can-limao.png";
import canUva from "../assets/can-uva.png";

export type FlavorId = "tradicional" | "limao" | "uva" | "laranja";

/** The five roles the can art is drawn in, from the lightest body tone to the deepest line. */
export type FlavorPalette = { body: string; light: string; mid: string; strong: string; deep: string };

export type Flavor = {
  id: FlavorId;
  label: string;
  /** Label print colours, role by role (the 3D label shader remaps the print with these). */
  palette: FlavorPalette;
  /** Side shading and highlight the label shader redraws from the view angle. */
  shade: string;
  glint: string;
  /** UI accent: glow behind the pack, the flavor dot, the rim light. */
  accent: string;
  /** Pixel can recoloured by scripts/build-flavor-cans.py. */
  image: string;
};

/** The palette the original art (and the baked 3D label) is drawn in. */
export const SOURCE_PALETTE: FlavorPalette = {
  body: "#00fcff",
  light: "#a5fdff",
  mid: "#0183fd",
  strong: "#0029fd",
  deep: "#0110aa",
};

// Palettes are kept in sync with scripts/build-flavor-cans.py.
export const FLAVORS: Record<FlavorId, Flavor> = {
  tradicional: {
    id: "tradicional",
    label: "Tradicional",
    palette: SOURCE_PALETTE,
    shade: "#1485fd",
    glint: "#e8ffff",
    accent: "#00e5ff",
    image: can,
  },
  limao: {
    id: "limao",
    label: "Limão",
    palette: { body: "#c6f432", light: "#eeffb8", mid: "#6cc417", strong: "#2f8f0e", deep: "#155e08" },
    shade: "#6cc417",
    glint: "#f7ffe0",
    accent: "#c6f432",
    image: canLimao,
  },
  uva: {
    id: "uva",
    label: "Uva",
    palette: { body: "#c08bff", light: "#e9d6ff", mid: "#8a4df0", strong: "#5b22c9", deep: "#33108a" },
    shade: "#8a4df0",
    glint: "#f6eeff",
    accent: "#c08bff",
    image: canUva,
  },
  laranja: {
    id: "laranja",
    label: "Laranja",
    palette: { body: "#ffb23a", light: "#ffe0a8", mid: "#ff7a1a", strong: "#d9480f", deep: "#8f2a05" },
    shade: "#ff7a1a",
    glint: "#fff3e0",
    accent: "#ffb23a",
    image: canLaranja,
  },
};

export const PALETTE_ROLES: (keyof FlavorPalette)[] = ["body", "light", "mid", "strong", "deep"];
