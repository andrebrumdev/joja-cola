import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { sceneScroll } from "../lib/sceneScroll";
import { JojaCan } from "./JojaCan";
import { applyCamera, FOV, pose, updatePose } from "./scene/pose";

const BG = "#081329";
// Model is 0.165 units tall with its origin at the base.
const CAN_SCALE = 12.7;
const CAN_CENTER_OFFSET = -1.05;

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function CameraSync() {
  useFrame((state) => {
    updatePose();
    applyCamera(state.camera);
  }, -1);
  return null;
}

// What the ice refracts. A static bright, cloudy image instead of the live
// scene: the navy background alone makes glass read as black, and no cube
// has to re-render the scene.
function iceRefractionTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#1b7fa3");
  base.addColorStop(0.5, "#0c4563");
  base.addColorStop(1, "#2bb8d9");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const rand = seeded(5);
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 40;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    const white = rand() < 0.4;
    glow.addColorStop(0, white ? "rgba(255,255,255,0.9)" : "rgba(160,245,255,0.7)");
    glow.addColorStop(1, "rgba(160,245,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Tileable value-noise normal map: dents and melt ripples.
function iceNormalMap(size = 128) {
  const rand = seeded(11);
  const grid = 8;
  const lattice = Array.from({ length: grid * grid }, () => rand());
  const at = (i: number, j: number) =>
    lattice[(((j % grid) + grid) % grid) * grid + (((i % grid) + grid) % grid)];
  const noise = (x: number, y: number) => {
    const gx = (x / size) * grid;
    const gy = (y / size) * grid;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const sx = (gx - x0) ** 2 * (3 - 2 * (gx - x0));
    const sy = (gy - y0) ** 2 * (3 - 2 * (gy - y0));
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return top + (bottom - top) * sy;
  };
  const data = new Uint8Array(size * size * 4);
  const n = new THREE.Vector3();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      n.set((noise(x - 1, y) - noise(x + 1, y)) * 6, (noise(x, y - 1) - noise(x, y + 1)) * 6, 1).normalize();
      const i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function IceCubes({ count }: { count: number }) {
  const cubes = useRef<(THREE.Group | null)[]>([]);
  const { geometry, refraction, normalMap, normalScale, frost, items } = useMemo(() => {
    const rand = seeded(42);
    // Copy sits on the left of most sections: cubes there stay far back and
    // small; close cubes live on the right, clear of the can's lane.
    const items = Array.from({ length: count }, (_, i) => {
      const lane = rand();
      let [x, z, size] =
        lane < 0.3
          ? [-2.6 - rand() * 3.4, -4 - rand() * 4, 0.35 + rand() * 0.35]
          : lane < 0.55
            ? [0.2 + rand() * 2.4, -2.6 - rand() * 3.4, 0.4 + rand() * 0.4]
            : [2.8 + rand() * 2.7, -4.2 + rand() * 5.2, 0.3 + rand() * 0.45];
      const y = 3 - (i / count) * 31 - rand() * 1.2;
      // Varejo mirrors the layout (copy on the right): keep that band's right lane far back.
      if (y < -19.5 && y > -25 && x > 0) {
        z = -6.5 - rand() * 1.5;
        size *= 0.7;
      }
      return {
        position: [x, y, z] as const,
        scale: [size * (0.9 + rand() * 0.2), size * (0.85 + rand() * 0.25), size * (0.9 + rand() * 0.2)] as const,
        rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as const,
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        spin: 0.12 + rand() * 0.3,
        float: 0.35 + rand() * 0.5,
        amp: 0.06 + rand() * 0.14,
        phase: rand() * Math.PI * 2,
      };
    });
    return {
      geometry: new RoundedBoxGeometry(1, 1, 1, 4, 0.14),
      refraction: iceRefractionTexture(),
      normalMap: iceNormalMap(),
      normalScale: new THREE.Vector2(0.3, 0.3),
      frost: new THREE.MeshBasicMaterial({
        color: "#dff9ff",
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      items,
    };
  }, [count]);

  useFrame((frame, delta) => {
    const time = frame.clock.elapsedTime;
    const boost = 1 + Math.min(4, Math.abs(sceneScroll.velocity) / 600);
    items.forEach((item, i) => {
      const cube = cubes.current[i];
      if (!cube) return;
      cube.rotateOnAxis(item.axis, delta * item.spin * boost);
      cube.position.y = item.position[1] + Math.sin(time * item.float + item.phase) * item.amp;
    });
  });

  return (
    <>
      {items.map((item, i) => (
        <group
          key={i}
          ref={(el) => {
            cubes.current[i] = el;
          }}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
        >
          <mesh geometry={geometry}>
            <MeshTransmissionMaterial
              buffer={refraction}
              resolution={16}
              backsideResolution={16}
              samples={6}
              transmission={1}
              thickness={1.1}
              roughness={0.1}
              ior={1.31}
              chromaticAberration={0.08}
              anisotropicBlur={0.15}
              distortion={0.35}
              distortionScale={0.5}
              temporalDistortion={0.04}
              color="#e6fbff"
              attenuationColor="#9ff0ff"
              attenuationDistance={1.8}
              clearcoat={1}
              clearcoatRoughness={0.06}
              envMapIntensity={2}
              normalMap={normalMap}
              normalScale={normalScale}
            />
          </mesh>
          <mesh geometry={geometry} material={frost} scale={0.55} />
        </group>
      ))}
    </>
  );
}

function Dust() {
  const geometry = useMemo(() => {
    const rand = seeded(7);
    const count = 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 16;
      positions[i * 3 + 1] = 5 - rand() * 36;
      positions[i * 3 + 2] = 2 - rand() * 12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#7fe9ff" size={0.035} sizeAttenuation transparent opacity={0.65} depthWrite={false} />
    </points>
  );
}

function FloatingCan() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.position.copy(pose.can);
    g.rotation.copy(pose.canRotation);
    g.scale.setScalar(pose.canScale);
  });
  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <JojaCan scale={CAN_SCALE} position={[0, CAN_CENTER_OFFSET, 0]} />
      </Suspense>
    </group>
  );
}

function GuestCan() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = pose.toast.visible;
    if (!g.visible) return;
    g.position.copy(pose.toast.position);
    g.rotation.copy(pose.toast.rotation);
    g.scale.setScalar(pose.toast.scale);
  });
  return (
    <group ref={group} visible={false}>
      <Suspense fallback={null}>
        <JojaCan clone scale={CAN_SCALE} position={[0, CAN_CENTER_OFFSET, 0]} />
      </Suspense>
    </group>
  );
}

const SPARK_COUNT = 40;
const SPARK_LIFE = 0.8;

// Clink: a burst of cold sparks and bubbles from where the two tops meet.
function ClinkSparks() {
  const points = useRef<THREE.Points>(null);
  const { geometry, material, sparks } = useMemo(() => {
    const rand = seeded(19);
    const sparks = Array.from({ length: SPARK_COUNT }, () => ({
      angle: rand() * Math.PI * 2,
      lift: 0.25 + rand() * 0.75,
      speed: 0.7 + rand() * 1.6,
    }));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARK_COUNT * 3), 3));
    const material = new THREE.PointsMaterial({
      color: "#e8fdff",
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material, sparks };
  }, []);
  const axes = useMemo(() => ({ right: new THREE.Vector3(), up: new THREE.Vector3() }), []);

  useFrame(({ camera }) => {
    const p = points.current;
    if (!p) return;
    const age = performance.now() / 1000 - pose.clink.time;
    p.visible = age >= 0 && age < SPARK_LIFE;
    if (!p.visible) return;
    axes.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    axes.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const size = pose.toast.scale;
    const array = geometry.attributes.position.array as Float32Array;
    sparks.forEach((spark, i) => {
      const r = spark.speed * age * size;
      const x = Math.cos(spark.angle) * r;
      const y = spark.lift * r - 2.4 * age * age * size;
      array[i * 3] = pose.clink.origin.x + axes.right.x * x + axes.up.x * y;
      array[i * 3 + 1] = pose.clink.origin.y + axes.right.y * x + axes.up.y * y;
      array[i * 3 + 2] = pose.clink.origin.z + axes.right.z * x + axes.up.z * y;
    });
    geometry.attributes.position.needsUpdate = true;
    material.opacity = 1 - age / SPARK_LIFE;
    material.size = 0.07 * size;
  });

  return <points ref={points} geometry={geometry} material={material} visible={false} frustumCulled={false} />;
}

// "Gelada.": frost creeps in from the screen edges like a chilled window, with
// ragged crystalline fingers, and stays clear of the beat's copy.
const frostVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
const frostFragment = /* glsl */ `
  uniform float uFrost;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec4 uClear;
  varying vec2 vUv;

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
    for (int i = 0; i < 5; i++) { v += a * (1.0 - abs(noise(p) * 2.0 - 1.0)); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 px = vUv * uRes;
    float edge = min(min(px.x, uRes.x - px.x), min(px.y, uRes.y - px.y));
    vec2 q = px / 80.0;
    float n = fbm(q * 0.6);
    float reach = uFrost * min(uRes.x, uRes.y) * 0.17 * (0.5 + 1.0 * n);
    float mask = 1.0 - smoothstep(reach * 0.35, reach, edge);

    vec2 fromTop = vec2(px.x, uRes.y - px.y);
    float clearDist = length(fromTop - clamp(fromTop, uClear.xy, uClear.zw));
    mask *= smoothstep(0.0, 96.0, clearDist);

    // Thin bright veins over a faint haze: crystals, not smoke.
    float crystal = pow(ridged(q * 1.3 + n * 1.5), 6.0);
    float fine = pow(ridged(q * 4.0 + 11.0), 8.0);
    vec3 color = mix(vec3(0.62, 0.9, 1.0), vec3(1.0), crystal);
    float alpha = mask * clamp(0.05 + 1.1 * crystal + 0.5 * fine, 0.0, 0.85);
    vec2 cell = floor(px / 3.0);
    float sparkle = step(0.994, hash(cell)) * mask * (0.5 + 0.5 * sin(uTime * 4.0 + hash(cell + 3.0) * 30.0));
    gl_FragColor = vec4(color * alpha + sparkle, clamp(alpha + sparkle, 0.0, 0.92));
  }
`;

function FrostOverlay() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uFrost: { value: 0 },
          uTime: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uClear: { value: new THREE.Vector4() },
        },
        vertexShader: frostVertex,
        fragmentShader: frostFragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        premultipliedAlpha: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
      }),
    [],
  );

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    m.visible = pose.frost > 0.002;
    if (!m.visible) return;
    const u = material.uniforms;
    u.uFrost.value = pose.frost;
    u.uTime.value = state.clock.elapsedTime;
    u.uRes.value.set(state.size.width, state.size.height);
    const copy = document.querySelectorAll(".pin-copy")[2]?.getBoundingClientRect();
    if (copy) u.uClear.value.set(copy.left, copy.top, copy.right, copy.bottom);
  });

  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={10} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

// R3F turns pointer events back on for its own wrapper; the front layer covers
// the whole page and must never swallow clicks.
const noPointer = { pointerEvents: "none" } as const;
const camera = { fov: FOV, near: 0.1, far: 60, position: [0, 0.25, 13] as [number, number, number] };

export function Scene3D() {
  const portrait = typeof window !== "undefined" && window.innerWidth / window.innerHeight < 0.8;

  return (
    <>
      <div className="scene3d scene3d-back" aria-hidden="true">
        <Canvas flat dpr={[1, 1.5]} camera={camera} style={noPointer} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <CameraSync />
          <color attach="background" args={[BG]} />
          <fog attach="fog" args={[BG, 9, 24]} />
          <Suspense fallback={null}>
            <Environment preset="city" environmentIntensity={0.8} />
          </Suspense>
          <ambientLight intensity={0.3} />
          <directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffffff" />
          <directionalLight position={[-5, -3, 2]} intensity={1.2} color="#00e5ff" />
          <IceCubes count={portrait ? 14 : 26} />
          <Dust />
          <EffectComposer multisampling={4}>
            <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.12} intensity={0.9} radius={0.7} />
          </EffectComposer>
        </Canvas>
      </div>

      <div className="scene3d scene3d-front" aria-hidden="true">
        <Canvas flat dpr={[1, 2]} camera={camera} style={noPointer} gl={{ alpha: true, antialias: true }}>
          <CameraSync />
          <Suspense fallback={null}>
            <Environment preset="city" environmentIntensity={0.8} />
          </Suspense>
          <ambientLight intensity={0.4} />
          <directionalLight position={[4, 6, 5]} intensity={2} color="#ffffff" />
          <FloatingCan />
          <GuestCan />
          <ClinkSparks />
          <FrostOverlay />
        </Canvas>
      </div>
    </>
  );
}
