import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PresentationControls } from "@react-three/drei";
import { JojaCan } from "./JojaCan";
import { FLAVORS, type FlavorId } from "../lib/flavors";

/** Model units → the landing's can size (0.1665 tall × 12.7 ≈ 2.1), centred on its middle. */
const CAN_SCALE = 12.7;
const CAN_CENTER = -1.05;

/**
 * The product page's can: still, facing front. Drag turns it to read the whole
 * label; on release it settles back to the front. No idle motion.
 */
export function ProductHero({ flavor }: { flavor: FlavorId }) {
  const accent = FLAVORS[flavor].accent;
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ fov: 26, position: [0, 0.35, 7.4] }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} />
      {/* Rim light in the flavor's colour. */}
      <directionalLight position={[-4, 2, -3]} intensity={1.6} color={accent} />
      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.6} />
        <PresentationControls cursor snap speed={1.5} polar={[-0.12, 0.18]} damping={0.3}>
          <JojaCan clone flavor={flavor} frosted={false} scale={CAN_SCALE} position={[0, CAN_CENTER, 0]} rotation={[0.06, 0, 0]} />
        </PresentationControls>
      </Suspense>
    </Canvas>
  );
}
