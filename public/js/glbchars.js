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
import { weaponModel, preloadWeapons } from './weapons.js';

// Character ids that have a real model under public/models/characters/<id>.glb.
export const GLB_CHARS = new Set([
  'esquerdomacho', 'sindicato', 'mst', 'doutora', 'mistico',
  'caminhoneiro', 'influencer', 'sertanejo', 'senhora', 'coach',
  'gotinha', 'farialimer',
  'bombado', 'hipster', 'dollynho', 'et', 'ancap',
]);

const STATES = ['idle', 'walk', 'run', 'shoot', 'death', 'crouch', 'crouchwalk', 'jump'];
const qp = new URLSearchParams(location.search);
const TARGET_HEIGHT = parseFloat(qp.get('charh')) || 1.72;      // meters (match box silhouette)
// Per-clip natural ground speed (m/s) that plants the feet at timeScale 1, MEASURED from
// each clip's real foot stride (tools: iktest HARNESS.measureStride). walk and run have
// different strides, so a single ref moon-walks one of them. Override via ?wref/?rref/?cref.
const WALK_REF   = parseFloat(qp.get('wref')) || 0.79;
const RUN_REF    = parseFloat(qp.get('rref')) || 1.92;
const CROUCH_REF = parseFloat(qp.get('cref')) || 0.83;
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
    await Promise.all([
      preloadWeapons(), // real weapon GLBs (mounts fall back to box if missing)
      ...STATES.map(async (s) => {
        try {
          const g = await loadGLB(`models/anims/${s}.glb`);
          if (g.animations[0]) { g.animations[0].name = s; _clips[s] = g.animations[0]; }
        } catch (e) { console.warn('anim load failed', s, e); }
      }),
    ]);
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
export function buildCharacterModel(def, opts = {}) {
  const template = _base.get(def.id);
  if (!template || !_clips) return null;
  const withWeapon = opts.weapon !== false; // menu showcase passes weapon:false

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
  if (handBone && withWeapon) {
    const gun = weaponModel(opts.weaponId || 'awp') || buildRifle();
    gun.rotation.set(GUN_ROT[0], GUN_ROT[1], GUN_ROT[2]);
    // Measure the weapon's authored (real-world) size in its own space, before parenting.
    gun.updateMatrixWorld(true);
    const asz = new THREE.Vector3(); new THREE.Box3().setFromObject(gun).getSize(asz);
    const authored = Math.max(asz.x, asz.y, asz.z) || 1;
    const mount = new THREE.Group();
    handBone.add(mount); mount.add(gun);
    // Meshy rigs have wildly different hand-bone world scales (~70x apart), so a fixed
    // or clamped compensation makes weapons either microscopic or giant. Instead, measure
    // the mounted world size and rescale so the weapon always renders at its real length.
    // This is self-correcting: it can never balloon or shrink to a speck.
    group.updateMatrixWorld(true);
    const wsz = new THREE.Vector3(); new THREE.Box3().setFromObject(gun).getSize(wsz);
    const worldLen = Math.max(wsz.x, wsz.y, wsz.z) || authored;
    mount.scale.setScalar(GUN_SCALE * authored / worldLen); // -> mount space ~= world meters
    gun.position.set(GUN_POS[0], GUN_POS[1], GUN_POS[2]);
    gun.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.userData.noHit = true; } });
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
    this.cur = null; this.dead = false; this.shooting = false; this.crouch = false; this.jumping = false;
    this._loco = 'idle'; // current locomotion state (hysteresis memory for walk/run choice)
    mixer.addEventListener('finished', (e) => {
      if (e.action === actions.shoot) this.shooting = false;
      if (e.action === actions.jump) this.jumping = false;
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

  jump() {
    if (this.dead || this.crouch || this.jumping || !this.actions.jump) return;
    this.jumping = true;
    const a = this.actions.jump;
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false;
    a.enabled = true; a.fadeIn(0.08).play();
    if (this.cur && this.cur !== a) this.cur.fadeOut(0.08);
    this.cur = a;
  }

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

  die() {
    if (this.dead) return;
    this.dead = true; this.shooting = false;
    this._to('death', true);
    if (this.actions.death) this.actions.death.timeScale = 1.8; // snappy fall, not slow-mo
  }

  // Stop ALL actions first — the death clip runs with clampWhenFinished, so it holds
  // its last (fallen) frame at full weight forever. Without stopAllAction the revived
  // character does everything on top of the fallen pose (the "walking while falling
  // backward" bug). Then start idle clean.
  revive() {
    this.dead = false; this.shooting = false;
    this.mixer.stopAllAction();
    this.cur = null;
    this._to('idle');
  }

  // moving: 0..1, hasTarget: bool, speed: real ground speed (m/s), back: true when the
  // body is moving BACKWARD relative to its facing (combat retreat). Advances the mixer,
  // picks the locomotion state, and scales the leg-cycle rate to the actual ground speed
  // so the feet plant instead of ice-skating (root-motion-free clips have no built-in
  // stride, so we drive the cycle rate from how fast the body is really moving).
  update(dt, moving, hasTarget, speed = 0, back = false) {
    if (!this.dead) {
      if (this.crouch) {
        this._to(moving > 0.05 ? 'crouchwalk' : 'crouch');
      } else if (!this.shooting && !this.jumping) {
        if (moving <= 0.05) { this._to('idle'); this._loco = 'idle'; }
        else if (back) {
          // Backpedal: walk clip REVERSED (negative timeScale below) so the feet step
          // backward — a forward clip while retreating is the classic moonwalk.
          this._to('walk'); this._loco = 'walk';
        } else {
          // Pick the clip by SPEED with hysteresis (not by hasTarget): fast movement with
          // the slow walk clip needs a frantic ~2.4x cycle; slow movement with the run
          // clip looks like gliding. run > 1.45 m/s, walk < 1.15, keep current in between.
          if (this._loco !== 'run' && speed > 1.45) this._loco = 'run';
          else if (this._loco !== 'walk' && speed < 1.15) this._loco = 'walk';
          else if (this._loco !== 'walk' && this._loco !== 'run') this._loco = hasTarget && speed < 1.7 ? 'walk' : 'run';
          this._to(this._loco);
        }
      }
      // Per-clip cycle rate = ground speed / that clip's measured natural speed, so the
      // feet plant instead of ice-skating. clamp keeps it from looking frantic/frozen.
      const rate = (ref) => Math.max(0.45, Math.min(3.0, speed / ref));
      if (this.actions.run) this.actions.run.timeScale = rate(RUN_REF);
      if (this.actions.walk) this.actions.walk.timeScale = back ? -rate(WALK_REF) : rate(WALK_REF);
      if (this.actions.crouchwalk) this.actions.crouchwalk.timeScale = rate(CROUCH_REF);
    }
    this.mixer.update(dt);
    if (this.headBone) {
      this.group.updateMatrixWorld(true);
      this.head.position.copy(this.group.worldToLocal(this.headBone.getWorldPosition(_v)));
    }
  }
}
