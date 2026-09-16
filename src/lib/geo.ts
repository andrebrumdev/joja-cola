export type LngLat = [number, number];

function haversine(a: LngLat, b: LngLat) {
  const R = 6371e3;
  const φ1 = (a[1] * Math.PI) / 180;
  const φ2 = (b[1] * Math.PI) / 180;
  const dφ = ((b[1] - a[1]) * Math.PI) / 180;
  const dλ = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function pathMeta(path: LngLat[]) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = haversine(path[i], path[i + 1]);
    segs.push(d);
    total += d;
  }
  return { segs, total };
}

export function pointOnPath(path: LngLat[], t: number): { pos: LngLat; bearing: number } {
  const { segs, total } = pathMeta(path);
  if (path.length < 2 || total === 0) {
    return { pos: path[0], bearing: 0 };
  }
  let dist = Math.min(1, Math.max(0, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i] || i === segs.length - 1) {
      const u = segs[i] === 0 ? 0 : dist / segs[i];
      const a = path[i];
      const b = path[i + 1];
      return {
        pos: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u],
        bearing: bearing(a, b),
      };
    }
    dist -= segs[i];
  }
  return { pos: path[path.length - 1], bearing: 0 };
}

export function bearing(a: LngLat, b: LngLat) {
  const φ1 = (a[1] * Math.PI) / 180;
  const φ2 = (b[1] * Math.PI) / 180;
  const λ = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(λ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function splitPath(path: LngLat[], t: number): { before: LngLat[]; after: LngLat[] } {
  if (path.length < 2) {
    return { before: path, after: path };
  }
  const clamped = Math.min(1, Math.max(0, t));
  const { pos } = pointOnPath(path, clamped);
  const { segs, total } = pathMeta(path);
  if (total === 0) {
    return { before: [path[0], pos], after: [pos, path[path.length - 1]] };
  }
  let dist = clamped * total;
  let idx = 0;
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i] || i === segs.length - 1) {
      idx = i;
      break;
    }
    dist -= segs[i];
  }
  return {
    before: [...path.slice(0, idx + 1), pos],
    after: [pos, ...path.slice(idx + 1)],
  };
}

export function boundsOf(paths: LngLat[][]) {
  let minX = 180,
    minY = 90,
    maxX = -180,
    maxY = -90;
  for (const path of paths) {
    for (const [x, y] of path) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return [
    [minX, minY],
    [maxX, maxY],
  ] as [LngLat, LngLat];
}
