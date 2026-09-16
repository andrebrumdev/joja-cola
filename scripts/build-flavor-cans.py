"""Recolour the pixel can (src/assets/can.png) for each Joja flavor.

The art is drawn in five blues (body, light, mid, strong, deep) plus a dark
outline and metal greys. Every pixel close to one of the blues moves to the
same role in the flavor's palette, keeping half of the art's colour noise so
the pixel texture survives. The outline, lid and anything else stay as drawn.

The same role palette drives the 3D label shader (src/lib/flavors.ts), so a
flavor's flat can and its 3D can always match.

Run:  python3 scripts/build-flavor-cans.py [--report]
Out:  src/assets/can-limao.png, can-uva.png, can-laranja.png
"""

import sys
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src/assets/can.png"

ROLES = ["body", "light", "mid", "strong", "deep"]
SOURCE = {
    "body": (0, 252, 255),
    "light": (165, 253, 255),
    "mid": (1, 131, 253),
    "strong": (0, 41, 253),
    "deep": (1, 16, 170),
}
# Keep in sync with src/lib/flavors.ts.
FLAVORS = {
    "limao": {"body": "#c6f432", "light": "#eeffb8", "mid": "#6cc417", "strong": "#2f8f0e", "deep": "#155e08"},
    "uva": {"body": "#c08bff", "light": "#e9d6ff", "mid": "#8a4df0", "strong": "#5b22c9", "deep": "#33108a"},
    "laranja": {"body": "#ffb23a", "light": "#ffe0a8", "mid": "#ff7a1a", "strong": "#d9480f", "deep": "#8f2a05"},
}
MAX_DISTANCE = 95  # RGB distance that still counts as one of the drawn blues


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def nearest_role(rgb):
    role = min(ROLES, key=lambda r: sum((a - b) ** 2 for a, b in zip(SOURCE[r], rgb)))
    distance = sum((a - b) ** 2 for a, b in zip(SOURCE[role], rgb)) ** 0.5
    return role, distance


def recolor(image, palette):
    out = image.copy()
    px = out.load()
    target = {role: hex_rgb(palette[role]) for role in ROLES}
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            role, distance = nearest_role((r, g, b))
            if distance > MAX_DISTANCE:
                continue
            base = SOURCE[role]
            px[x, y] = (
                *(int(max(0, min(255, t + (c - s) * 0.5))) for t, c, s in zip(target[role], (r, g, b), base)),
                a,
            )
    return out


def main():
    image = Image.open(SRC).convert("RGBA")
    if "--report" in sys.argv:
        kept = Counter()
        for r, g, b, a in image.getdata():
            if a and nearest_role((r, g, b))[1] > MAX_DISTANCE:
                kept["#%02x%02x%02x" % (r, g, b)] += 1
        print("kept as drawn:", kept.most_common(12))
    for name, palette in FLAVORS.items():
        path = ROOT / f"src/assets/can-{name}.png"
        recolor(image, palette).save(path)
        print("wrote", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
