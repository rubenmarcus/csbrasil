// Real weapon GLB models (Mint asset pack) — replaces the procedural box guns.
// Each source model is normalized to ~1 unit on its longest axis, so we scale each
// to a real-world length and rotate so the barrel points +Z (game forward).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const _cache = new Map();
export const WEAPON_IDS = ['awp', 'ak', 'm4', 'mp5', 'shotgun', 'deagle', 'pistol', 'knife',
  't56', 'akm', 'revolver38', 'md97', 'carbine', 'm400', 'mosin', 'rem700'];

// len = real length along the barrel (m); rot = degrees to point the barrel +Z;
// gripZ = fraction of length from the muzzle where the hand grips (0=muzzle,1=stock).
const CFG = {
  awp:     { len: 1.15, rot: [0, 90, 0], gripZ: 0.72 },
  ak:      { len: 0.88, rot: [0, 90, 0], gripZ: 0.62 },
  m4:      { len: 0.84, rot: [0, 90, 0], gripZ: 0.62 },
  mp5:     { len: 0.66, rot: [0, 90, 0], gripZ: 0.58 },
  shotgun: { len: 1.00, rot: [0, 180, 0], gripZ: 0.6 },
  deagle:  { len: 0.30, rot: [0, 90, 0], gripZ: 0.7 },
  pistol:  { len: 0.26, rot: [0, 90, 0], gripZ: 0.7 },
  knife:   { len: 0.30, rot: [0, 90, 0], gripZ: 0.6 },
  // arsenal-2 (Brazilian-flavored)
  t56:       { len: 0.88, rot: [0, 90, 0], gripZ: 0.62 },
  akm:       { len: 0.88, rot: [0, 90, 0], gripZ: 0.62 },
  revolver38:{ len: 0.24, rot: [0, 90, 0], gripZ: 0.68 },
  md97:      { len: 1.05, rot: [0, 90, 0], gripZ: 0.62 },
  carbine:   { len: 0.98, rot: [0, 90, 0], gripZ: 0.6 },
  m400:      { len: 0.92, rot: [0, 90, 0], gripZ: 0.62 },
  mosin:     { len: 1.20, rot: [0, 90, 0], gripZ: 0.66 },
  rem700:    { len: 1.15, rot: [0, 90, 0], gripZ: 0.66 },
};

const loadGLB = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

export async function preloadWeapons() {
  await Promise.all(WEAPON_IDS.map(async (id) => {
    if (_cache.has(id)) return;
    try { const g = await loadGLB(`models/weapons/${id}.glb`); _cache.set(id, g.scene); }
    catch (e) { console.warn('weapon load failed', id, e); }
  }));
}

export function hasWeapon(id) { return _cache.has(id); }

// Returns a THREE.Group holding the weapon, scaled to real size, barrel pointing +Z,
// grip roughly at the group origin (so it sits in a hand placed at origin).
export function weaponModel(id) {
  const tpl = _cache.get(id) || _cache.get('awp');
  if (!tpl) return null;
  const cfg = CFG[id] || CFG.awp;
  const model = tpl.clone(true);
  model.rotation.set(cfg.rot[0] * Math.PI / 180, cfg.rot[1] * Math.PI / 180, cfg.rot[2] * Math.PI / 180);

  const wrap = new THREE.Group();
  wrap.add(model);
  wrap.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrap);
  const zlen = (box.max.z - box.min.z) || 1;
  const s = cfg.len / zlen;
  wrap.scale.setScalar(s);
  // shift so the grip point (gripZ along the barrel) sits at the origin
  wrap.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(wrap);
  const gripWorldZ = b2.max.z - (b2.max.z - b2.min.z) * cfg.gripZ;
  model.position.z -= gripWorldZ / s;
  wrap.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
  return wrap;
}
