import { useLayoutEffect, useMemo } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { pose } from "./scene/pose";
import { FLAVORS, PALETTE_ROLES, SOURCE_PALETTE, type FlavorId } from "../lib/flavors";

export const CAN_MODEL_URL = `${import.meta.env.BASE_URL}models/SodaCan.glb`;
// Print baked from src/assets/can.png by scripts/build-can-label.py into this model's label UVs.
const LABEL_URL = `${import.meta.env.BASE_URL}models/joja-label.png`;
const METAL_TINT = new THREE.Color("#7fd6ff");
const METAL_FROST = new THREE.Color("#eefbff");

// can.png shades its cylinder in flat vertical stripes. Redraw those stripes
// from the view angle (normal.x in view space: -1 left edge, +1 right edge) so
// the 3D can reads like the drawing from any rotation, in the drawing's colours.
// uFrost grows patchy crystalline frost over the print for the "Gelada." beat.
// uSrc/uDst recolour the print for a flavor: each drawn role maps to the flavor's
// colour for that role (identity for Tradicional).
const labelVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    vec4 local = vec4(position, 1.0);
    vec3 objectNormal = normal;
    // Packs draw many cans as one InstancedMesh; three defines USE_INSTANCING for those.
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      objectNormal = mat3(instanceMatrix) * objectNormal;
    #endif
    vec4 mv = modelViewMatrix * local;
    vNormal = normalize(normalMatrix * objectNormal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const labelFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSrc[5];
  uniform vec3 uDst[5];
  uniform float uRemap;
  uniform vec3 uShade;
  uniform vec3 uLight;
  uniform vec3 uGlint;
  uniform vec3 uOutline;
  uniform float uFrost;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  float inBand(float x, float a, float b) { return step(a, x) * (1.0 - step(b, x)); }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  float ridged(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * (1.0 - abs(noise(p) * 2.0 - 1.0)); p *= 2.2; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 drawn = texture2D(uMap, vUv).rgb;
    vec3 n = normalize(vNormal);
    float x = n.x;
    // Body vs line is read from the drawn print, so shading bands stay put for every flavor.
    float body = step(0.5, dot(drawn, vec3(0.2126, 0.7152, 0.0722)));

    vec3 print = drawn;
    // Tradicional is the print as drawn (uRemap 0). Other flavors move every blue,
    // including the in-between texels at band and letter edges, to its nearest role;
    // the near-black outline stays as drawn.
    float lum = dot(drawn, vec3(0.2126, 0.7152, 0.0722));
    if (uRemap > 0.5 && lum > 0.02) {
      float nearest = 10.0;
      for (int i = 0; i < 5; i++) {
        float d = distance(drawn, uSrc[i]);
        if (d < nearest) { nearest = d; print = uDst[i]; }
      }
    }

    float shade = inBand(x, -0.91, -0.73) + inBand(x, -0.59, -0.53) + inBand(x, 0.78, 1.01);
    float light = inBand(x, -1.01, -0.91) + inBand(x, -0.73, -0.59)
                + inBand(x, 0.50, 0.57) + inBand(x, 0.75, 0.78);
    float glint = inBand(x, 0.57, 0.66);

    vec3 color = print;
    color = mix(color, uLight, light * body);
    color = mix(color, uGlint, glint * body);
    color = mix(color, uShade, shade * body);
    color = mix(color, print * 0.45, shade * (1.0 - body));

    if (uFrost > 0.001) {
      // Cylinder-unwrapped coordinates: isotropic around the can.
      vec2 p = vec2(atan(vPos.z, vPos.x) * 0.0413, vPos.y) * 180.0;
      float growth = fbm(p * 0.35);
      float mask = smoothstep(0.0, 0.08, uFrost * 1.15 - growth);
      float crystal = pow(ridged(p * 0.9 + growth * 3.0), 4.0);
      vec3 frost = mix(vec3(0.72, 0.94, 1.0), vec3(1.0), crystal);
      // A frosted blue can, not a white one: the print and logo keep reading through.
      color = mix(color, frost, mask * mix(0.22, 0.5, body) * (0.55 + 0.45 * crystal));
      vec2 cell = floor(p * 3.0);
      float sparkle = step(0.975, hash(cell)) * mask * (0.5 + 0.5 * sin(uTime * 3.0 + hash(cell + 7.0) * 40.0));
      color += sparkle * 0.6;
    }

    float rim = 1.0 - step(0.14, dot(n, normalize(vViewDir)));
    color = mix(color, uOutline, rim);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

type JojaCanProps = ThreeElements["group"] & {
  /** Render an independent copy of the model, for a second can in the same scene. */
  clone?: boolean;
  flavor?: FlavorId;
  /** Follow the landing's frost beat. Off for cans shown outside the scroll scene. */
  frosted?: boolean;
};

const SOURCE_COLORS = PALETTE_ROLES.map((role) => new THREE.Color(SOURCE_PALETTE[role]));
const LABEL_NAMES = new Set(["SodaMaterial_Inst", "JojaLabel"]);

/** The label shader for one flavor (frost off until the caller drives uFrost). */
function useLabelMaterial(flavor: FlavorId) {
  const print = useTexture(LABEL_URL, (t) => {
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.anisotropy = 8;
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: "JojaLabel",
        uniforms: {
          uMap: { value: print },
          uSrc: { value: SOURCE_COLORS },
          uDst: { value: PALETTE_ROLES.map(() => new THREE.Color()) },
          uRemap: { value: 0 },
          uShade: { value: new THREE.Color() },
          uLight: { value: new THREE.Color() },
          uGlint: { value: new THREE.Color() },
          uOutline: { value: new THREE.Color("#1a1e3b") },
          uFrost: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: labelVertex,
        fragmentShader: labelFragment,
        toneMapped: false,
      }),
    [print],
  );

  useLayoutEffect(() => {
    const f = FLAVORS[flavor];
    const u = material.uniforms;
    PALETTE_ROLES.forEach((role, i) => (u.uDst.value as THREE.Color[])[i].set(f.palette[role]));
    u.uRemap.value = flavor === "tradicional" ? 0 : 1;
    (u.uShade.value as THREE.Color).set(f.shade);
    (u.uLight.value as THREE.Color).set(f.palette.light);
    (u.uGlint.value as THREE.Color).set(f.glint);
  }, [flavor, material]);

  useLayoutEffect(() => () => material.dispose(), [material]);
  return material;
}

export type CanPart = { geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4 };

/**
 * The can split into its drawable parts (aluminium, label, seal), each with its own
 * material and its transform inside the model, for drawing many cans as InstancedMeshes.
 * Metals are private copies in the landing's resting tint, so no other scene's frost reaches them.
 */
export function useCanParts(flavor: FlavorId): CanPart[] {
  const { scene } = useGLTF(CAN_MODEL_URL);
  const label = useLabelMaterial(flavor);

  const parts = useMemo(() => {
    const list: CanPart[] = [];
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Transform relative to the model root (the root itself may sit in another scene).
      const matrix = new THREE.Matrix4();
      for (let node: THREE.Object3D | null = mesh; node && node !== scene; node = node.parent) {
        node.updateMatrix();
        matrix.premultiply(node.matrix);
      }
      const source = mesh.material as THREE.Material;
      const material = LABEL_NAMES.has(source.name)
        ? label
        : Object.assign((source as THREE.MeshStandardMaterial).clone(), { color: METAL_TINT.clone() });
      list.push({ geometry: mesh.geometry, material, matrix });
    });
    return list;
  }, [scene, label]);

  useLayoutEffect(
    () => () => parts.forEach((part) => part.material !== label && part.material.dispose()),
    [parts, label],
  );
  return parts;
}

export function JojaCan({ clone = false, flavor = "tradicional", frosted = true, ...props }: JojaCanProps) {
  const { scene: source, materials } = useGLTF(CAN_MODEL_URL);
  const scene = useMemo(() => (clone ? source.clone(true) : source), [clone, source]);
  const labelMaterial = useLabelMaterial(flavor);

  const metals = useMemo(
    () =>
      ["SodaAluminiumMaterial_Inst", "SodaSealMaterial_Inst"].map((name) => {
        const material = materials[name] as THREE.MeshStandardMaterial;
        return { material, roughness: material.roughness };
      }),
    [materials],
  );

  useLayoutEffect(() => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (LABEL_NAMES.has((mesh.material as THREE.Material).name)) mesh.material = labelMaterial;
    });
  }, [scene, labelMaterial]);

  useFrame((state) => {
    const frost = frosted ? pose.frost : 0;
    labelMaterial.uniforms.uFrost.value = frost;
    labelMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    for (const { material, roughness } of metals) {
      material.color.lerpColors(METAL_TINT, METAL_FROST, frost * 0.55);
      material.roughness = THREE.MathUtils.lerp(roughness, 1, frost * 0.6);
    }
  });

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(CAN_MODEL_URL);
useTexture.preload(LABEL_URL);
