// Real rigged GLB characters (Mint-generated) with shared animation clips.
//
// Meshy delivers a rigged base mesh per character plus one GLB per animation clip.
// All characters share the same humanoid rig, so the 5 clips (idle/walk/run/shoot/
// death) are loaded ONCE and re-bound by bone name onto every character's skeleton.
// Base meshes are ~270KB (texture downscaled to 512/webp); clips ~30-70KB each.
//
// Only bots use these models (the player is first-person). Characters without a GLB
// fall back to the procedural box meshes in characters.js.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { buildRifle } from './characters.js';

// Character ids that have a real model under public/models/characters/<id>.glb.
export const GLB_CHARS = new Set([
  'esquerdomacho', 'sindicato', 'mst', 'doutora', 'mistico',
  'caminhoneiro', 'influencer', 'sertanejo', 'senhora', 'coach',
]);

const STATES = ['idle', 'walk', 'run', 'shoot', 'death', 'crouch', 'crouchwalk'];
const qp = new URLSearchParams(location.search);
const TARGET_HEIGHT = parseFloat(qp.get('charh')) || 1.72;      // meters (match box silhouette)
const FACING_OFFSET = (parseFloat(qp.get('charface')) || 0) * Math.PI / 180; // yaw fix if model faces -Z

// Rifle mounted in the right hand (bone-local meters via a scale-compensated mount).
// Tunable live with ?gunpos=x,y,z ?gunrot=xdeg,ydeg,zdeg ?guns=scale.
const _num3 = (s, d) => { const p = (s || '').split(',').map(Number); return p.length === 3 && p.every((n) => !isNaN(n)) ? p : d; };
const GUN_POS = _num3(qp.get('gunpos'), [0.02, 0.02, 0.10]);
const GUN_ROT = _num3(qp.get('gunrot'), [90, 0, 0]).map((d) => d * Math.PI / 180);
const GUN_SCALE = parseFloat(qp.get('guns')) || 1.0;

const loader = new GLTFLoader();
const loadGLB = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

let _clips = null;                 // { idle: AnimationClip, ... } shared across all chars
const _base = new Map();           // id -> THREE.Object3D template scene

export function hasModel(id) { return _base.has(id); }

// Preload shared clips + base meshes for the given character ids. Safe to call once
// before a match; already-loaded assets are skipped. Failures are swallowed per-asset
// so a missing model just falls back to the box mesh.
export async function preloadCharacterAssets(ids) {
  if (!_clips) {
    _clips = {};
    await Promise.all(STATES.map(async (s) => {
      try {
        const g = await loadGLB(`models/anims/${s}.glb`);
        if (g.animations[0]) { g.animations[0].name = s; _clips[s] = g.animations[0]; }
      } catch (e) { console.warn('anim load failed', s, e); }
    }));
  }
  const wanted = [...new Set(ids)].filter((id) => GLB_CHARS.has(id) && !_base.has(id));
  await Promise.all(wanted.map(async (id) => {
    try {
      const g = await loadGLB(`models/characters/${id}.glb`);
      _base.set(id, g.scene);
    } catch (e) { console.warn('model load failed', id, e); }
  }));
}

const _v = new THREE.Vector3();

// Build a bot mesh from a loaded GLB. Returns an object shaped like buildCharacter()'s
// result ({ group, parts }) plus animation control (isGLB, mixer, ctrl). Returns null
// if the character has no model loaded.
export function buildCharacterModel(def) {
  const template = _base.get(def.id);
  if (!template || !_clips) return null;

  const model = skeletonClone(template);

  // Normalize: scale to target height, drop feet to y=0, apply facing fix.
  // Update world matrices first so the bounding box reflects the real transforms.
  model.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(model);
  const h = bbox.max.y - bbox.min.y || 1;
  const s = TARGET_HEIGHT / h;
  if (qp.get('chartune')) console.log(`[glbchars] ${def.id} rawH=${h.toFixed(3)} min.y=${bbox.min.y.toFixed(3)} scale=${s.toFixed(3)}`);
  model.scale.setScalar(s);
  model.position.y = -bbox.min.y * s;
  model.rotation.y = FACING_OFFSET;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });

  const group = new THREE.Group();
  group.add(model);

  // Head hitbox: an invisible (unrendered) but raycastable box tracked to the head bone
  // each frame, so headshots stay accurate through the animation.
  let headBone = null;
  model.traverse((o) => { if (o.isBone && !headBone && /head/i.test(o.name)) headBone = o; });
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.30, 0.26),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(head);

  // Rifle in the right hand: a scale-compensated mount parented to the hand bone so
  // GUN_POS/GUN_ROT are expressed in world meters regardless of the bone's scale.
  let handBone = null;
  model.traverse((o) => { if (o.isBone && !handBone && /right.?hand|hand.?r\b|rhand|r_hand/i.test(o.name)) handBone = o; });
  if (!handBone) model.traverse((o) => { if (o.isBone && !handBone && /hand/i.test(o.name)) handBone = o; });
  if (handBone) {
    handBone.updateWorldMatrix(true, false);
    const bs = new THREE.Vector3();
    handBone.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), bs);
    const mount = new THREE.Group();
    mount.scale.setScalar(1 / (bs.x || 1));       // 1 mount unit == 1 world meter
    const gun = buildRifle();
    gun.scale.multiplyScalar(GUN_SCALE);
    gun.position.set(GUN_POS[0], GUN_POS[1], GUN_POS[2]);
    gun.rotation.set(GUN_ROT[0], GUN_ROT[1], GUN_ROT[2]);
    gun.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.userData.noHit = true; } });
    mount.add(gun);
    handBone.add(mount);
  }

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  for (const name of STATES) if (_clips[name]) actions[name] = mixer.clipAction(_clips[name]);

  const ctrl = new CharController(mixer, actions, group, headBone, head);
  return { group, parts: { head }, isGLB: true, mixer, ctrl };
}

const FADE = 0.16;

class CharController {
  constructor(mixer, actions, group, headBone, head) {
    this.mixer = mixer; this.actions = actions;
    this.group = group; this.headBone = headBone; this.head = head;
    this.cur = null; this.dead = false; this.shooting = false; this.crouch = false;
    mixer.addEventListener('finished', (e) => {
      if (e.action === actions.shoot) this.shooting = false;
    });
    this._to('idle');
  }

  _to(name, once = false) {
    const a = this.actions[name];
    if (!a || this.cur === a) return;
    a.reset();
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    a.clampWhenFinished = once;
    a.enabled = true; a.fadeIn(FADE); a.play();
    if (this.cur) this.cur.fadeOut(FADE);
    this.cur = a;
  }

  setCrouch(v) { this.crouch = !!v; }

  shoot() {
    if (this.dead || this.crouch || !this.actions.shoot) return; // crouch pose already aims
    this.shooting = true;
    this.actions.shoot.reset();
    this.actions.shoot.setLoop(THREE.LoopOnce, 1);
    this.actions.shoot.clampWhenFinished = true;
    this.actions.shoot.enabled = true; this.actions.shoot.fadeIn(0.06).play();
    if (this.cur && this.cur !== this.actions.shoot) this.cur.fadeOut(0.06);
    this.cur = this.actions.shoot;
  }

  die() { if (!this.dead) { this.dead = true; this.shooting = false; this.cur = null; this._to('death', true); } }

  revive() { this.dead = false; this.shooting = false; this.cur = null; this._to('idle'); }

  // moving: 0..1, hasTarget: bool. Advances mixer and picks locomotion state.
  update(dt, moving, hasTarget) {
    if (!this.dead) {
      if (this.crouch) {
        this._to(moving > 0.05 ? 'crouchwalk' : 'crouch');
      } else if (!this.shooting) {
        this._to(moving > 0.05 ? (hasTarget ? 'walk' : 'run') : 'idle');
      }
    }
    this.mixer.update(dt);
    if (this.headBone) {
      this.group.updateMatrixWorld(true);
      this.head.position.copy(this.group.worldToLocal(this.headBone.getWorldPosition(_v)));
    }
  }
}
