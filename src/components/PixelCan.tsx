import can from "../assets/can.png";

export function PixelCan({
  className = "",
  caption,
  size = 180,
}: {
  className?: string;
  caption?: string;
  size?: number;
}) {
  return (
    <figure className={className}>
      <img
        className="pixel"
        src={can}
        alt=""
        aria-hidden="true"
        width={size}
        height={Math.round(size * (193 / 104))}
      />
      {caption ? <figcaption className="can-cap">{caption}</figcaption> : null}
    </figure>
  );
}
