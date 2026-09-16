import { FLAVORS, type FlavorId } from "../lib/flavors";

export function PixelCan({
  className = "",
  caption,
  size = 180,
  flavor = "tradicional",
}: {
  className?: string;
  caption?: string;
  size?: number;
  flavor?: FlavorId;
}) {
  return (
    <figure className={className}>
      <img
        className="pixel"
        src={FLAVORS[flavor].image}
        alt=""
        aria-hidden="true"
        width={size}
        height={Math.round(size * (193 / 104))}
      />
      {caption ? <figcaption className="can-cap">{caption}</figcaption> : null}
    </figure>
  );
}
