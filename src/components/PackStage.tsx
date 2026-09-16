import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrthographicCamera, RoundedBox, View } from "@react-three/drei";
import * as THREE from "three";
import { useCanParts } from "./JojaCan";
import { FLAVORS, type FlavorId } from "../lib/flavors";

// Catalog packs: every card draws into ONE shared canvas through drei's View
// (a scissored region that follows the card's DOM box), so the catalog never
// opens a WebGL context per card. Each card's cans are InstancedMeshes: one draw
// call per can part however many packs are stacked.

/** Can model (0.0413 radius, 0.1665 tall) scaled to ~1 unit tall. */
const CAN_SCALE = 6;
const CAN_RADIUS = 0.0413 * CAN_SCALE;
const CAN_HEIGHT = 0.1665 * CAN_SCALE;
const CAN_PITCH = CAN_RADIUS * 2 + 0.012;
/** A pack: six cans, three by two, held by a strap. */
const PACK_W = CAN_PITCH * 3;
const PACK_D = CAN_PITCH * 2;
const PACK_GAP = 0.09;
const LAYER = CAN_HEIGHT + 0.03;
export const MAX_PACKS = 8;

const CANS_IN_PACK: [number, number][] = [
  [-CAN_PITCH, -CAN_PITCH / 2],
  [0, -CAN_PITCH / 2],
  [CAN_PITCH, -CAN_PITCH / 2],
  [-CAN_PITCH, CAN_PITCH / 2],
  [0, CAN_PITCH / 2],
  [CAN_PITCH, CAN_PITCH / 2],
];

/** Four packs on the floor, four on top; each layer fills far-from-camera first. */
const PACK_SLOTS: THREE.Vector3[] = [0, 1].flatMap((layer) =>
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].map(([ix, iz]) => new THREE.Vector3(ix * (PACK_W + PACK_GAP) / 2, layer * LAYER, iz * (PACK_D + PACK_GAP) / 2)),
);

/** True isometric view from the (1, 1, 1) diagonal, aimed a little above the stack's middle so it sits clear of the pack count. */
const ISO_TARGET = new THREE.Vector3(0, LAYER + 0.25, 0);
const ISO_POSITION = new THREE.Vector3(10, 10 + LAYER + 0.25, 10);
/** Projected size of a full 8-pack stack plus its base, so the framing never changes as packs land. */
const BASE_W = PACK_W * 2 + PACK_GAP + 0.16;
const BASE_D = PACK_D * 2 + PACK_GAP + 0.16;
const ISO_WIDTH = (BASE_W + BASE_D) * Math.SQRT1_2;
const ISO_HEIGHT = LAYER * 2 * Math.cos(Math.atan(Math.SQRT1_2)) + (BASE_W + BASE_D) * Math.sin(Math.atan(Math.SQRT1_2)) * Math.SQRT1_2;

/** Full-viewport transparent canvas above the cards; views draw only inside their boxes. */
export function PackCanvas() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}
    >
      <ClearFrame />
      <View.Port />
    </Canvas>
  );
}

// Views render with autoClear off and R3F stops its own render once they exist:
// clear the whole canvas once per frame, before any view draws (priority 0 < 1).
function ClearFrame() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.clear(true, true, false);
  });
  return null;
}

/** Fits the full stack to the view box; the box can change size with the layout. */
function IsoCamera() {
  const camera = useRef<THREE.OrthographicCamera>(null);
  useFrame(() => {
    const c = camera.current;
    if (!c) return;
    // drei's View sets left/right/top/bottom to the view's pixel box before each render.
    const width = c.right - c.left;
    const height = c.top - c.bottom;
    if (width <= 2 || height <= 2) return;
    const zoom = Math.min(width / ISO_WIDTH, height / ISO_HEIGHT) * 0.8;
    if (Math.abs(zoom - c.zoom) > 0.01) {
      c.zoom = zoom;
      c.updateProjectionMatrix();
    }
  });
  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      position={ISO_POSITION}
      near={0.1}
      far={60}
      onUpdate={(c) => c.lookAt(ISO_TARGET)}
    />
  );
}

/** A rounded-rectangle ring hugging the pack's outer cans: the strap. */
function strapGeometry() {
  const thickness = 0.02;
  const ring = (halfW: number, halfD: number, radius: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(-halfW + radius, -halfD);
    shape.lineTo(halfW - radius, -halfD);
    shape.absarc(halfW - radius, -halfD + radius, radius, -Math.PI / 2, 0, false);
    shape.lineTo(halfW, halfD - radius);
    shape.absarc(halfW - radius, halfD - radius, radius, 0, Math.PI / 2, false);
    shape.lineTo(-halfW + radius, halfD);
    shape.absarc(-halfW + radius, halfD - radius, radius, Math.PI / 2, Math.PI, false);
    shape.lineTo(-halfW, -halfD + radius);
    shape.absarc(-halfW + radius, -halfD + radius, radius, Math.PI, Math.PI * 1.5, false);
    return shape;
  };
  const halfW = CAN_PITCH + CAN_RADIUS + thickness;
  const halfD = CAN_PITCH / 2 + CAN_RADIUS + thickness;
  const outer = ring(halfW, halfD, CAN_RADIUS + thickness);
  const hole = ring(halfW - thickness, halfD - thickness, CAN_RADIUS);
  outer.holes.push(new THREE.Path(hole.getPoints(48)));
  const geometry = new THREE.ExtrudeGeometry(outer, { depth: 0.2, bevelEnabled: false, curveSegments: 16 });
  // Extruded along z: stand it up around the cans, centred a little below mid-height.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, CAN_HEIGHT * 0.42, 0);
  return geometry;
}

type PackState = { y: number; v: number; s: number; present: boolean; since: number };
const ENTER_FROM = 1.4;
const STAGGER = 0.07;

function PackStack({ flavor, count }: { flavor: FlavorId; count: number }) {
  const parts = useCanParts(flavor);
  const strap = useMemo(strapGeometry, []);
  const strapMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FLAVORS[flavor].palette.strong, roughness: 0.38, metalness: 0.15 }),
    [flavor],
  );
  useLayoutEffect(
    () => () => {
      strap.dispose();
      strapMaterial.dispose();
    },
    [strap, strapMaterial],
  );

  const shown = Math.min(count, MAX_PACKS);
  const previous = useRef(0);
  const from = previous.current;
  useLayoutEffect(() => {
    previous.current = shown;
  }, [shown]);

  const packs = useRef<PackState[]>(PACK_SLOTS.map(() => ({ y: ENTER_FROM, v: 0, s: 0, present: false, since: 0 })));
  const canMeshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const strapMesh = useRef<THREE.InstancedMesh>(null);
  const settled = useRef(false);
  const matrices = useMemo(
    () => ({ pack: new THREE.Matrix4(), can: new THREE.Matrix4(), out: new THREE.Matrix4(), yaw: new THREE.Matrix4().makeRotationY(Math.PI / 4) }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const now = clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    let moving = false;

    PACK_SLOTS.forEach((_, slot) => {
      const p = packs.current[slot];
      const present = slot < shown;
      if (present !== p.present) {
        p.present = present;
        // New packs are set down one after another, in slot order, from the previous count.
        p.since = now + (present ? Math.max(0, slot - from) * STAGGER : 0);
        if (present) {
          p.y = ENTER_FROM;
          p.v = 0;
        }
        settled.current = false;
      }
      if (p.present && now >= p.since) {
        // Dropped onto the pallet with a small bounce; the stack itself never turns.
        p.s = THREE.MathUtils.damp(p.s, 1, 16, dt);
        p.v += -p.y * 120 * dt;
        p.v *= Math.exp(-8 * dt);
        p.y += p.v * dt;
        if (Math.abs(p.y) < 0.0005 && Math.abs(p.v) < 0.01) {
          p.y = 0;
          p.v = 0;
        }
      } else if (!p.present) {
        p.y = THREE.MathUtils.damp(p.y, 0.8, 12, dt);
        p.s = THREE.MathUtils.damp(p.s, 0, 16, dt);
      }
      const landing = p.present && (now < p.since || p.y !== 0 || p.s < 0.998);
      const leaving = !p.present && p.s > 0.01;
      if (landing || leaving) moving = true;
    });

    // Once everything has landed the matrices stop changing: skip the rebuild.
    if (settled.current && !moving) return;
    settled.current = !moving;

    let cans = 0;
    let straps = 0;
    PACK_SLOTS.forEach((position, slot) => {
      const p = packs.current[slot];
      if (p.s < 0.01) return;
      matrices.pack.compose(
        // The bounce never sinks through the pallet or the pack below.
        new THREE.Vector3(position.x, position.y + Math.max(0, p.y), position.z),
        new THREE.Quaternion(),
        new THREE.Vector3(p.s, p.s, p.s),
      );
      strapMesh.current?.setMatrixAt(straps++, matrices.pack);
      for (const [x, z] of CANS_IN_PACK) {
        matrices.can.makeTranslation(x, 0, z).multiply(matrices.yaw).scale(new THREE.Vector3(CAN_SCALE, CAN_SCALE, CAN_SCALE));
        matrices.can.premultiply(matrices.pack);
        parts.forEach((part, index) => {
          const mesh = canMeshes.current[index];
          if (!mesh) return;
          matrices.out.multiplyMatrices(matrices.can, part.matrix);
          mesh.setMatrixAt(cans, matrices.out);
        });
        cans++;
      }
    });

    canMeshes.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.count = cans;
      mesh.instanceMatrix.needsUpdate = true;
    });
    if (strapMesh.current) {
      strapMesh.current.count = straps;
      strapMesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Pallet with the four floor positions marked. */}
      <RoundedBox args={[BASE_W, 0.07, BASE_D]} radius={0.03} smoothness={3} position={[0, -0.035, 0]}>
        <meshStandardMaterial color="#0b1a36" roughness={0.6} metalness={0.2} />
      </RoundedBox>
      {PACK_SLOTS.slice(0, 4).map((slot, i) => (
        <mesh key={i} position={[slot.x, 0.002, slot.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[PACK_W - 0.03, PACK_D - 0.03]} />
          <meshBasicMaterial color="#132a52" toneMapped={false} />
        </mesh>
      ))}
      {parts.map((part, index) => (
        <instancedMesh
          key={index}
          ref={(mesh) => {
            canMeshes.current[index] = mesh;
          }}
          args={[part.geometry, part.material, MAX_PACKS * CANS_IN_PACK.length]}
          count={0}
          frustumCulled={false}
        />
      ))}
      <instancedMesh ref={strapMesh} args={[strap, strapMaterial, MAX_PACKS]} count={0} frustumCulled={false} />
    </group>
  );
}

export function PackView({ flavor, count, className }: { flavor: FlavorId; count: number; className?: string }) {
  const accent = FLAVORS[flavor].accent;
  return (
    <View className={className}>
      <IsoCamera />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 9, 6]} intensity={2} />
      {/* Rim light in the flavor's colour, from behind the stack. */}
      <directionalLight position={[-6, 4, -5]} intensity={1.3} color={accent} />
      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.5} />
        <PackStack flavor={flavor} count={count} />
      </Suspense>
    </View>
  );
}
