// Loader for static GLB map props (statues, monuments) placed by procedural maps.
// Mirrors the glbchars pattern: preload templates once, then clone per placement.
// Props are OPTIONAL — placeProp returns null if the GLB isn't loaded, so a map
// renders fine before (or without) the Mint-generated assets exist.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const loadGLB = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
const _base = new Map(); // id -> template scene

export async function preloadMapProps(ids) {
  await Promise.all([...new Set(ids)].filter((id) => !_base.has(id)).map(async (id) => {
    try { const g = await loadGLB(`models/props/${id}.glb`); _base.set(id, g.scene); }
    catch (e) { console.warn('map prop load failed', id, e); }
  }));
}

export function hasProp(id) { return _base.has(id); }

// Clone a prop, normalized so its height == targetH (metres), feet at y (default 0),
// centred on (x,z) and yawed by ry. Returns the Object3D, or null if not loaded.
export function placeProp(id, { x = 0, y = 0, z = 0, targetH = 2.4, ry = 0 } = {}) {
  const tpl = _base.get(id);
  if (!tpl) return null;
  const o = tpl.clone(true);
  o.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(o);
  const h = (box.max.y - box.min.y) || 1;
  const s = targetH / h;
  o.scale.setScalar(s);
  o.position.set(x, y - box.min.y * s, z);
  o.rotation.y = ry;
  o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
  return o;
}
