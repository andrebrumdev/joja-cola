"""Bake the Joja Cola can art (src/assets/can.png) into the label texture of
public/models/SodaCan.glb.

can.png is a shaded front view of a cylinder, so it cannot be wrapped as-is.
The label print is rebuilt as a flat 360-degree pixel strip:
  - horizontal bands: the colour profile of the art's centre column, run
    full-width so they stay straight and seamless around the can
  - logo, underline, drip and droplets: copied 1:1 from the art, once on the
    front and once on the back
  - the art's side shading is not baked in; JojaCan's label shader redraws it
    from the view angle, so it matches the drawing from every rotation

The label's UV island is skewed (u drifts with the angle), so the strip is
rasterised through the real label triangles: every texel gets its surface
height and angle, and samples the strip there.

Run:  python3 scripts/build-can-label.py
Out:  public/models/joja-label.png
"""

import json
import struct
from math import pi
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src/assets/can.png"
GLB = ROOT / "public/models/SodaCan.glb"
OUT = ROOT / "public/models/joja-label.png"
LABEL_MATERIAL = "SodaMaterial_Inst"

ATLAS = 2048
ROW_TOP, ROW_BOTTOM = 23, 178  # label rows in can.png (under the lid, above the rim)
CENTER_X = 52
BODY_RADIUS = 47
ART_ROWS = (80, 114)  # logo + underline: no bands here
DRIP_BOX = (35, 45, 108, 160)  # x0, x1, y0, y1
DECOR_COLS = (30, 73)  # clean body columns between the art's shading stripes

CYAN = (0, 252, 255)
LIGHT = (165, 253, 255)
MID = (1, 131, 253)
STRONG = (0, 41, 253)
DEEP = (1, 16, 170)
PALETTE = [CYAN, LIGHT, MID, STRONG, DEEP]


def nearest(rgb):
    return min(PALETTE, key=lambda p: sum((a - b) ** 2 for a, b in zip(p, rgb)))


def build_strip():
    src = Image.open(SRC).convert("RGBA")
    px = src.load()

    def color(x, y):
        if not (0 <= x < src.width and 0 <= y < src.height):
            return None
        r, g, b, a = px[x, y]
        if a < 128:
            return None
        if g < 70 and b < 110:  # dark silhouette outline
            return DEEP
        return nearest((r, g, b))

    def near_strong(x, y):
        return any(
            color(x + dx, y + dy) in (STRONG, DEEP)
            for dx in (-1, 0, 1)
            for dy in (-1, 0, 1)
        )

    strip_w = round(2 * pi * BODY_RADIUS)
    rows = ROW_BOTTOM - ROW_TOP + 1
    strip = Image.new("RGB", (strip_w, rows), CYAN)
    sp = strip.load()

    for sy in range(rows):
        y = ROW_TOP + sy
        if ART_ROWS[0] <= y <= ART_ROWS[1]:
            continue
        window = [color(CENTER_X + dx, y) for dx in range(-3, 4)]
        window = [c for c in window if c]
        band = max(set(window), key=window.count) if window else CYAN
        for sx in range(strip_w):
            sp[sx, sy] = band

    x0, x1, y0, y1 = DRIP_BOX
    decor = []
    for y in range(ROW_TOP, ROW_BOTTOM + 1):
        for x in range(10, 96):
            c = color(x, y)
            if c is None or c == CYAN:
                continue
            if ART_ROWS[0] <= y <= ART_ROWS[1]:
                keep = c in (STRONG, DEEP) or near_strong(x, y)
            elif x0 <= x <= x1 and y0 <= y <= y1:
                keep = c in (LIGHT, MID)
            else:
                band_row = strip.getpixel((0, y - ROW_TOP)) != CYAN
                keep = DECOR_COLS[0] <= x <= DECOR_COLS[1] and not band_row and c in (LIGHT, MID)
            if keep:
                decor.append((x - CENTER_X, y - ROW_TOP, c))

    for center in (strip_w // 2, 0):
        for dx, sy, c in decor:
            sp[(center + dx) % strip_w, sy] = c

    return np.asarray(strip)


def read_label_mesh():
    data = GLB.read_bytes()
    json_len = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20 : 20 + json_len])
    bin_start = 20 + json_len + 8

    def accessor(index):
        acc = gltf["accessors"][index]
        view = gltf["bufferViews"][acc["bufferView"]]
        dtype = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[
            acc["componentType"]
        ]
        width = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[acc["type"]]
        offset = bin_start + view.get("byteOffset", 0) + acc.get("byteOffset", 0)
        count = acc["count"] * width
        return np.frombuffer(data, dtype, count, offset).reshape(-1, width)

    names = [m["name"] for m in gltf["materials"]]
    for mesh in gltf["meshes"]:
        for prim in mesh["primitives"]:
            if names[prim["material"]] == LABEL_MATERIAL:
                return (
                    accessor(prim["attributes"]["POSITION"]),
                    accessor(prim["attributes"]["TEXCOORD_0"]),
                    accessor(prim["indices"]).reshape(-1, 3),
                )
    raise SystemExit(f"{LABEL_MATERIAL} not found in {GLB}")


def main():
    strip = build_strip()
    rows, strip_w = strip.shape[:2]
    positions, uvs, triangles = read_label_mesh()

    y_bottom, y_top = positions[:, 1].min(), positions[:, 1].max()
    heights = positions[:, 1]
    # Front of the can (+z, 90 degrees) is the strip centre; reading runs toward -angle.
    angles = np.degrees(np.arctan2(positions[:, 2], positions[:, 0]))

    atlas = np.zeros((ATLAS, ATLAS, 3), np.uint8)
    atlas[:] = CYAN

    for tri in triangles:
        pu = uvs[tri, 0] * ATLAS
        pv = uvs[tri, 1] * ATLAS  # flipY = false: v runs down the image
        h = heights[tri]
        a = angles[tri].astype(np.float64)
        a = a[0] + (a - a[0] + 180) % 360 - 180  # unwrap across the +-180 cut

        x_min, x_max = int(np.floor(pu.min())) - 1, int(np.ceil(pu.max())) + 1
        y_min, y_max = int(np.floor(pv.min())) - 1, int(np.ceil(pv.max())) + 1
        x_min, y_min = max(x_min, 0), max(y_min, 0)
        x_max, y_max = min(x_max, ATLAS - 1), min(y_max, ATLAS - 1)
        gx, gy = np.meshgrid(np.arange(x_min, x_max + 1) + 0.5, np.arange(y_min, y_max + 1) + 0.5)

        det = (pv[1] - pv[2]) * (pu[0] - pu[2]) + (pu[2] - pu[1]) * (pv[0] - pv[2])
        if abs(det) < 1e-9:
            continue
        w0 = ((pv[1] - pv[2]) * (gx - pu[2]) + (pu[2] - pu[1]) * (gy - pv[2])) / det
        w1 = ((pv[2] - pv[0]) * (gx - pu[2]) + (pu[0] - pu[2]) * (gy - pv[2])) / det
        w2 = 1 - w0 - w1
        pad = -1.5 / max(abs(det) ** 0.5, 1)  # a texel of padding against seams
        inside = (w0 >= pad) & (w1 >= pad) & (w2 >= pad)
        if not inside.any():
            continue

        height = w0 * h[0] + w1 * h[1] + w2 * h[2]
        angle = w0 * a[0] + w1 * a[1] + w2 * a[2]
        sx = np.floor((strip_w / 2 + (90 - angle) / 360 * strip_w) % strip_w).astype(int)
        sy = np.clip(
            np.floor((y_top - height) / (y_top - y_bottom) * rows).astype(int), 0, rows - 1
        )
        region = atlas[y_min : y_max + 1, x_min : x_max + 1]
        region[inside] = strip[sy[inside], sx[inside]]

    Image.fromarray(atlas).save(OUT)
    print(f"strip {strip_w}x{rows}, {len(triangles)} triangles -> {OUT.relative_to(ROOT)}")
    return strip


if __name__ == "__main__":
    strip = main()
    if __import__("sys").argv[1:] == ["--preview"]:
        Image.fromarray(strip).resize(
            (strip.shape[1] * 4, strip.shape[0] * 4), Image.Resampling.NEAREST
        ).save("joja-label-strip-preview.png")
