import * as THREE from "three";
import {
  CHAPTER_ANCHORS,
  CHAPTERS,
  FROST_CHAPTER,
  PHONE_ANCHORS,
  sceneScroll,
  TOAST_CHAPTER,
} from "../../lib/sceneScroll";

// The scene is split in two canvases (atmosphere behind the page, the can on
// top of it). Both must see the same camera, so the pose is computed once per
// frame here and each canvas copies it.
//
// The can never has a world-space keyframe: every chapter parks it in a layout
// slot ([data-can-anchor]) whose CSS box sets where it sits and how tall it is.
// Proportion and composition therefore live in the stylesheet, per breakpoint,
// and the can can't land on top of copy.

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const FOV = 35;

// Camera descends through the ice field; parallax only, the can ignores it.
const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [v(0, 0.25, 7), v(0, -4.7, 6.6), v(0.2, -9.7, 7.2), v(0, -15, 8), v(0, -20, 8), v(-0.3, -24.8, 6.2)],
  false,
  "centripetal",
);
const LOOK_PATH = new THREE.CatmullRomCurve3(
  [v(0, 0.1, 0), v(0, -5, 0), v(0.2, -10, 0), v(0, -15.2, 0), v(0, -20.2, 0), v(-0.3, -25, 0)],
  false,
  "centripetal",
);

/** Distance from the camera at which the can is placed for every slot. */
const DEPTH = 4.5;
/** World height of the rendered can at scale 1 (0.165 model units × 12.7). */
const CAN_HEIGHT = 2.1;
/** Slight top-down view of the lid, identical in every chapter. */
const PITCH = 0.06;

export const pose = {
  camera: v(0, 0.25, 13),
  look: v(0, 0.1, 0),
  can: v(0, 0.2, 0),
  canRotation: new THREE.Euler(),
  canScale: 1,
  /** 0 → 1 while the "Gelada." beat is on screen */
  frost: 0,
  /** Second can for the "O acompanhamento." toast. */
  toast: { visible: false, position: v(0, 0, 0), rotation: new THREE.Euler(), scale: 1 },
  /** Last clink: time in performance.now() seconds and where the tops met. */
  clink: { time: -10, origin: v(0, 0, 0) },
};

const pointer = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}

const motion = {
  time: -1,
  chapter: 0,
  spin: 0,
  spinVelocity: 0,
  roll: 0,
  lean: 0,
  last: new THREE.Vector3(),
  primed: false,
  clinkArmed: true,
};
const probe = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
const tmp = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3(),
  up: new THREE.Vector3(),
  ray: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  clinkAt: new THREE.Vector3(),
  edge: new THREE.Vector3(),
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Places `out` in the slot for `chapter`; returns the scale that fits the slot height. */
function slot(chapter: number, out: THREE.Vector3): number {
  const el = document.querySelector(`[data-can-anchor="${CHAPTER_ANCHORS[chapter]}"]`);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const r = el?.getBoundingClientRect();
  const cx = r ? r.left + r.width / 2 : w / 2;
  const cy = r ? r.top + r.height / 2 : h / 2;
  const px = r && r.height > 0 ? r.height : h * 0.45;

  tmp.ray.set((cx / w) * 2 - 1, -(cy / h) * 2 + 1, 0.5).unproject(probe).sub(probe.position).normalize();
  out.copy(probe.position).addScaledVector(tmp.ray, DEPTH);
  const worldPerPixel = (2 * DEPTH * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h;
  return (px * worldPerPixel) / CAN_HEIGHT;
}

export function updatePose() {
  const now = performance.now() / 1000;
  // Both canvases tick in the same animation frame; compute once.
  if (now - motion.time < 0.004) return;
  const delta = motion.time < 0 ? 0 : Math.min(0.1, now - motion.time);
  motion.time = now;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const portrait = width / height < 0.8;
  const intro = sceneScroll.intro;

  sceneScroll.velocity = THREE.MathUtils.damp(sceneScroll.velocity, 0, 2.5, delta);
  motion.chapter = THREE.MathUtils.damp(motion.chapter, sceneScroll.chapter, 5, delta);

  const clamped = THREE.MathUtils.clamp(motion.chapter, 0, CHAPTERS - 1);
  const seg = Math.min(Math.floor(clamped), CHAPTERS - 2);
  const raw = clamped - seg;
  const from = CHAPTER_ANCHORS[seg];
  const to = CHAPTER_ANCHORS[seg + 1];
  const sameSlot = from === to;
  // The can rides its slot with the content, then hands over inside a short
  // window, so it spends as little time as possible crossing copy.
  const f = sameSlot
    ? smoothstep(0.35, 0.65, raw)
    : portrait
      ? smoothstep(0.38, 0.62, raw)
      : to === "close"
        ? smoothstep(0.5, 0.9, raw) // wait for the Varejo list to scroll away first
        : smoothstep(0.28, 0.72, raw);
  const arc = Math.sin(Math.PI * f);

  CAMERA_PATH.getPoint(clamped / (CHAPTERS - 1), pose.camera);
  LOOK_PATH.getPoint(clamped / (CHAPTERS - 1), pose.look);
  pose.camera.x += Math.sin(now * 0.25) * 0.12 + pointer.x * 0.35;
  pose.camera.y += Math.cos(now * 0.2) * 0.08 + pointer.y * 0.2;
  pose.camera.z += (1 - intro) * 6;

  probe.aspect = width / height;
  probe.position.copy(pose.camera);
  probe.lookAt(pose.look);
  probe.updateProjectionMatrix();
  probe.updateMatrixWorld();
  probe.getWorldDirection(tmp.forward);
  tmp.right.set(1, 0, 0).applyQuaternion(probe.quaternion);
  tmp.up.set(0, 1, 0).applyQuaternion(probe.quaternion);

  const scaleA = slot(seg, tmp.a);
  const scaleB = slot(seg + 1, tmp.b);
  pose.can.lerpVectors(tmp.a, tmp.b, f);

  const leavingPhone = PHONE_ANCHORS.has(from) && !sameSlot;
  const phoneWeight = Math.min(
    1,
    (PHONE_ANCHORS.has(from) ? 1 - f : 0) + (PHONE_ANCHORS.has(to) ? f : 0),
  );

  let scale = THREE.MathUtils.lerp(scaleA, scaleB, f);
  if (!sameSlot) {
    if (portrait) {
      // Single column: slip along the right gutter, small, instead of across the copy.
      const halfWidth = DEPTH * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * probe.aspect;
      pose.can.addScaledVector(tmp.right, arc * halfWidth * 0.5);
      scale *= 1 - arc * 0.3;
    } else {
      scale *= 1 + arc * (leavingPhone ? 0.45 : 0.12);
    }
    // Out of the phone screen, toward the viewer.
    if (leavingPhone) pose.can.addScaledVector(tmp.forward, -arc * 0.8);
  }
  const bob = Math.sin(now * 1.1) * 0.035 * (1 - phoneWeight);
  pose.can.addScaledVector(tmp.up, bob - (1 - intro) * 0.4);
  pose.canScale = scale * (0.85 + 0.15 * intro);

  // Toast: the guest can swings in from the left, tops tilt together, clink as
  // the beat centres, then it drops out of frame. Scrubbed by scroll; the clink
  // itself is a time-based impulse so it lands the same at any scroll speed.
  const enter = smoothstep(TOAST_CHAPTER - 0.38, TOAST_CHAPTER - 0.02, clamped);
  const leave = smoothstep(TOAST_CHAPTER + 0.05, TOAST_CHAPTER + 0.42, clamped);
  const presence = enter * (1 - leave);
  // Portrait: two cans side by side must fit the width.
  if (portrait) pose.canScale *= 1 - 0.24 * presence;
  const canHeight = CAN_HEIGHT * pose.canScale;
  const canWidth = canHeight * 0.5;
  // Portrait: make room for the guest on the left.
  if (portrait) pose.can.addScaledVector(tmp.right, presence * 0.85 * canWidth);
  pose.toast.visible = enter > 0.001 && leave < 0.999;
  if (pose.toast.visible) {
    tmp.clinkAt
      .copy(pose.can)
      .addScaledVector(tmp.right, -1.56 * canWidth) // tilted tops just meet
      .addScaledVector(tmp.up, -0.05 * canHeight);
    if (leave > 0) {
      tmp.edge.copy(tmp.clinkAt).addScaledVector(tmp.right, -3.4 * canWidth).addScaledVector(tmp.up, -1.3 * canHeight);
      pose.toast.position.lerpVectors(tmp.clinkAt, tmp.edge, leave ** 3);
    } else {
      tmp.edge.copy(tmp.clinkAt).addScaledVector(tmp.right, -3.2 * canWidth).addScaledVector(tmp.up, -0.7 * canHeight);
      pose.toast.position.lerpVectors(tmp.edge, tmp.clinkAt, 1 - (1 - enter) ** 3);
    }
    pose.toast.scale = pose.canScale;
  }
  // Scroll is damped, so the chapter settles onto the beat without crossing it:
  // clink on arriving near the centre, re-arm once the beat is left behind.
  const toastDistance = Math.abs(clamped - TOAST_CHAPTER);
  if (toastDistance > 0.15) motion.clinkArmed = true;
  if (motion.clinkArmed && toastDistance < 0.03 && presence > 0.8) {
    motion.clinkArmed = false;
    pose.clink.time = now;
    pose.clink.origin
      .copy(pose.can)
      .add(tmp.clinkAt)
      .multiplyScalar(0.5)
      .addScaledVector(tmp.up, 0.45 * canHeight);
  }
  const sinceClink = now - pose.clink.time;
  const wobble = sinceClink < 1.2 ? Math.exp(-sinceClink * 6) * Math.sin(sinceClink * 34) * 0.12 : 0;

  // Lean into the direction of travel; upright again the moment it parks.
  if (!motion.primed) {
    motion.last.copy(pose.can);
    motion.primed = true;
  }
  tmp.velocity.subVectors(pose.can, motion.last).divideScalar(Math.max(delta, 1 / 240));
  motion.last.copy(pose.can);
  const vRight = tmp.velocity.dot(tmp.right);
  const vUp = tmp.velocity.dot(tmp.up);
  motion.roll = THREE.MathUtils.damp(motion.roll, THREE.MathUtils.clamp(-vRight * 0.05, -0.2, 0.2), 6, delta);
  motion.lean = THREE.MathUtils.damp(motion.lean, THREE.MathUtils.clamp(vUp * 0.03, -0.14, 0.14), 6, delta);

  // Scrolling flicks the can; it settles back to facing the viewer when idle.
  motion.spinVelocity = THREE.MathUtils.damp(motion.spinVelocity, sceneScroll.velocity / 2000, 4, delta);
  motion.spin = THREE.MathUtils.damp(motion.spin + motion.spinVelocity * delta, 0, 1.2, delta);

  // Face the camera (logo centred wherever the slot is on screen); alternate
  // front and back print per chapter so every hand-over is a half turn.
  const toCamera = Math.atan2(pose.camera.x - pose.can.x, pose.camera.z - pose.can.z);
  const sway = Math.sin(now * 0.6) * 0.08 * (1 - phoneWeight);
  pose.canRotation.set(
    PITCH + motion.lean,
    toCamera + (seg + f) * Math.PI + sway + motion.spin - (1 - intro) * Math.PI,
    motion.roll + 0.32 * presence + wobble,
    "YXZ",
  );
  if (pose.toast.visible) {
    const guestYaw = Math.atan2(pose.camera.x - pose.toast.position.x, pose.camera.z - pose.toast.position.z);
    pose.toast.rotation.set(PITCH, guestYaw + leave * 2.4, -0.32 * presence - wobble - leave * 0.9, "YXZ");
  }

  pose.frost = smoothstep(FROST_CHAPTER - 0.45, FROST_CHAPTER - 0.05, clamped) *
    (1 - smoothstep(FROST_CHAPTER + 0.3, FROST_CHAPTER + 0.75, clamped));
}

export function applyCamera(camera: THREE.Camera) {
  camera.position.copy(pose.camera);
  camera.lookAt(pose.look);
}
