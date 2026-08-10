import * as THREE from "three";

const GOLD = 0xd4af37;

// Builds a visible picture-frame matte: an opaque border surrounding a
// transparent window, so the in-frame video shows through the center "frame
// window" while a decorative frame is visibly set up around it. Sized to the
// target's photo/video aspect and meant to sit just behind the video plane
// (renderOrder -1, depthWrite off) so the two never z-fight.
export function createFrameMatte(
  photoWidth = 1,
  photoAspect = 1,
  opts?: { borderWorld?: number; depth?: number; color?: number },
) {
  const borderWorld = opts?.borderWorld ?? 0.08; // gold border thickness (world units)
  const depth = opts?.depth ?? -0.01; // sit just behind the video plane
  const color = new THREE.Color(opts?.color ?? GOLD);

  const outerW = photoWidth + borderWorld * 2;
  const outerH = photoWidth * photoAspect + borderWorld * 2;

  // Canvas texture: opaque outer rect, transparent center window.
  const pxWide = 512;
  const pxTall = Math.max(1, Math.round((pxWide * outerH) / outerW));
  const canvas = document.createElement("canvas");
  canvas.width = pxWide;
  canvas.height = pxTall;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ixL = (borderWorld / outerW) * canvas.width;
    const ixT = (borderWorld / outerH) * canvas.height;
    ctx.clearRect(ixL, ixT, canvas.width - 2 * ixL, canvas.height - 2 * ixT);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const geo = new THREE.PlaneGeometry(outerW, outerH);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = depth;
  mesh.renderOrder = -1; // behind the video plane
  return mesh;
}
