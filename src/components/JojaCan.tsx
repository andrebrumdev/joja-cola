import { useLayoutEffect, useMemo } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { pose } from "./scene/pose";

export const CAN_MODEL_URL = `${import.meta.env.BASE_URL}models/SodaCan.glb`;
// Print baked from src/assets/can.png by scripts/build-can-label.py into this model's label UVs.
const LABEL_URL = `${import.meta.env.BASE_URL}models/joja-label.png`;
const METAL_TINT = new THREE.Color("#7fd6ff");
const METAL_FROST = new THREE.Color("#eefbff");

// can.png shades its cylinder in flat vertical stripes. Redraw those stripes
// from the view angle (normal.x in view space: -1 left edge, +1 right edge) so
// the 3D can reads like the drawing from any rotation, in the drawing's colours.
// uFrost grows patchy crystalline frost over the print for the "Gelada." beat.
const labelVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const labelFragment = /* glsl */ `
  uniform sampler2D uMap;
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
    vec3 print = texture2D(uMap, vUv).rgb;
    vec3 n = normalize(vNormal);
    float x = n.x;
    float body = step(0.5, dot(print, vec3(0.2126, 0.7152, 0.0722)));

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
};

export function JojaCan({ clone = false, ...props }: JojaCanProps) {
  const { scene: source, materials } = useGLTF(CAN_MODEL_URL);
  const scene = useMemo(() => (clone ? source.clone(true) : source), [clone, source]);
  const print = useTexture(LABEL_URL, (t) => {
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.anisotropy = 8;
  });

  const labelMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: "JojaLabel",
        uniforms: {
          uMap: { value: print },
          uShade: { value: new THREE.Color("#1485fd") },
          uLight: { value: new THREE.Color("#a5fdff") },
          uGlint: { value: new THREE.Color("#e8ffff") },
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
      const name = (mesh.material as THREE.Material).name;
      if (name === "SodaMaterial_Inst" || name === "JojaLabel") mesh.material = labelMaterial;
    });
    return () => labelMaterial.dispose();
  }, [scene, labelMaterial]);

  useFrame((state) => {
    labelMaterial.uniforms.uFrost.value = pose.frost;
    labelMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    for (const { material, roughness } of metals) {
      material.color.lerpColors(METAL_TINT, METAL_FROST, pose.frost * 0.55);
      material.roughness = THREE.MathUtils.lerp(roughness, 1, pose.frost * 0.6);
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
