import { FLAVORS, type FlavorId } from "../lib/flavors";

/** Packs shown on a pallet: four on the floor, four on top. */
export const MAX_PACKS = 8;

/** Flat stand-in for the 3D pack stack (reduced motion, and while the 3D chunk loads): same fill rule. */
export function PixelPack({ flavor, count }: { flavor: FlavorId; count: number }) {
  const filled = Math.min(count, MAX_PACKS);
  // Top layer first in the markup so the floor sits at the bottom of the grid.
  const slots = [4, 5, 6, 7, 0, 1, 2, 3];
  return (
    <div className="pixel-pack">
      {slots.map((slot) =>
        slot < filled ? (
          <span key={slot} className="pixel-pack-tile">
            <span className="pixel-pack-cans">
              {[0, 1, 2].map((can) => (
                <img key={can} className="pixel" src={FLAVORS[flavor].image} alt="" />
              ))}
            </span>
          </span>
        ) : (
          <span key={slot} className="pixel-pack-tile is-empty" />
        ),
      )}
    </div>
  );
}
