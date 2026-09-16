"""Slim public/models/SodaCan.glb for the web.

- Drops the label material's textures: JojaCan replaces that material with its
  own shader, so they were downloaded and never shown.
- Resizes every remaining texture to at most MAX_SIZE px. The metal lid and rim
  cover a few hundred pixels on screen at most.

Geometry and UVs are copied byte for byte, so scripts/build-can-label.py keeps
working on the slimmed file. Safe to run more than once.

Run:  python3 scripts/slim-can-model.py
"""

import io
import json
import struct
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GLB = ROOT / "public/models/SodaCan.glb"
LABEL_MATERIAL = "SodaMaterial_Inst"
MAX_SIZE = 512

GLB_MAGIC = 0x46546C67
CHUNK_JSON = 0x4E4F534A
CHUNK_BIN = 0x004E4942


def texture_refs(material):
    refs = [material[k] for k in ("normalTexture", "occlusionTexture", "emissiveTexture") if k in material]
    pbr = material.get("pbrMetallicRoughness", {})
    refs += [pbr[k] for k in ("baseColorTexture", "metallicRoughnessTexture") if k in pbr]
    return refs


def resize_png(raw):
    image = Image.open(io.BytesIO(raw))
    if max(image.size) > MAX_SIZE:
        ratio = MAX_SIZE / max(image.size)
        size = (round(image.width * ratio), round(image.height * ratio))
        image = image.resize(size, Image.Resampling.LANCZOS)
    out = io.BytesIO()
    image.save(out, "PNG", optimize=True)
    return out.getvalue()


def main():
    data = GLB.read_bytes()
    before = len(data)
    json_len = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20 : 20 + json_len])
    bin_len = struct.unpack_from("<I", data, 20 + json_len)[0]
    blob = data[28 + json_len : 28 + json_len + bin_len]

    for material in gltf["materials"]:
        if material["name"] == LABEL_MATERIAL:
            for key in ("normalTexture", "occlusionTexture", "emissiveTexture"):
                material.pop(key, None)
            pbr = material.get("pbrMetallicRoughness", {})
            pbr.pop("baseColorTexture", None)
            pbr.pop("metallicRoughnessTexture", None)

    used_textures = sorted({ref["index"] for m in gltf["materials"] for ref in texture_refs(m)})
    texture_map = {old: new for new, old in enumerate(used_textures)}
    for material in gltf["materials"]:
        for ref in texture_refs(material):
            ref["index"] = texture_map[ref["index"]]
    gltf["textures"] = [gltf["textures"][i] for i in used_textures]

    old_images = gltf["images"]
    used_images = sorted({t["source"] for t in gltf["textures"]})
    image_map = {old: new for new, old in enumerate(used_images)}
    for texture in gltf["textures"]:
        texture["source"] = image_map[texture["source"]]
    gltf["images"] = [old_images[i] for i in used_images]

    image_views = {img["bufferView"] for img in gltf["images"]}
    dropped_views = {img["bufferView"] for i, img in enumerate(old_images) if i not in used_images}

    new_blob = bytearray()
    view_map = {}
    views = []
    for index, view in enumerate(gltf["bufferViews"]):
        if index in dropped_views:
            continue
        start = view.get("byteOffset", 0)
        chunk = blob[start : start + view["byteLength"]]
        if index in image_views:
            chunk = resize_png(chunk)
        new_blob.extend(b"\0" * (-len(new_blob) % 4))
        view = dict(view, byteOffset=len(new_blob), byteLength=len(chunk))
        new_blob.extend(chunk)
        view_map[index] = len(views)
        views.append(view)
    new_blob.extend(b"\0" * (-len(new_blob) % 4))

    gltf["bufferViews"] = views
    for accessor in gltf["accessors"]:
        if "bufferView" in accessor:
            accessor["bufferView"] = view_map[accessor["bufferView"]]
    for image in gltf["images"]:
        image["bufferView"] = view_map[image["bufferView"]]
    gltf["buffers"][0]["byteLength"] = len(new_blob)

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode()
    json_bytes += b" " * (-len(json_bytes) % 4)
    total = 12 + 8 + len(json_bytes) + 8 + len(new_blob)
    GLB.write_bytes(
        struct.pack("<III", GLB_MAGIC, 2, total)
        + struct.pack("<II", len(json_bytes), CHUNK_JSON)
        + json_bytes
        + struct.pack("<II", len(new_blob), CHUNK_BIN)
        + bytes(new_blob)
    )
    print(f"{GLB.relative_to(ROOT)}: {before / 1e6:.2f} MB -> {total / 1e6:.2f} MB, {len(gltf['images'])} textures")


if __name__ == "__main__":
    main()
