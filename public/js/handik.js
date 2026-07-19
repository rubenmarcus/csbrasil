// Compact CCD (Cyclic Coordinate Descent) IK for the support hand.
//
// The Meshy rig has real arm bones (Shoulder → Arm → ForeArm → Hand) but NO
// finger bones, so we can't curl fingers — but we CAN pose the whole arm so the
// (baked, closed) support hand lands on the weapon's foregrip. This is how
// semi-pro games (Krunker-ish) make the off hand adapt to each weapon's length:
// the weapon defines a grip point, and the arm IK-tracks it every frame after
// the body animation runs.
//
// solveCCDIK(chain, end, targetWorld, opts) rotates each bone in `chain`
// (root → ... → parent-of-end) so `end`'s effector point reaches targetWorld.
// Bones are plain THREE.Bone/Object3D; rotations are written in parent-local
// space. Call AFTER mixer.update() each frame so it overrides the clip's arm.
import * as THREE from 'three';

const _pj = new THREE.Vector3();
const _pe = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _wq = new THREE.Quaternion();
const _pwq = new THREE.Quaternion();
const _off = new THREE.Vector3();

// chain: [rootBone, ...midBones]  (end effector bone passed separately)
// end: the end bone; its effector point = end origin + endOffset (in end-local space)
// targetWorld: THREE.Vector3 the effector should reach
export function solveCCDIK(chain, end, targetWorld, opts = {}) {
  const iterations = opts.iterations ?? 10;
  const maxStep = opts.maxStep ?? 0.6;      // clamp per-joint rotation (rad) for stability
  const endOffset = opts.endOffset || null; // local offset to the palm
  const root = chain[0];
  if (!root) return;
  root.updateWorldMatrix(true, true);

  const effWorld = () => {
    if (endOffset) { _off.copy(endOffset); return end.localToWorld(_off); }
    return end.getWorldPosition(_pe);
  };

  for (let it = 0; it < iterations; it++) {
    for (let i = chain.length - 1; i >= 0; i--) {
      const joint = chain[i];
      joint.getWorldPosition(_pj);
      const e = effWorld();
      _v1.subVectors(e, _pj);
      _v2.subVectors(targetWorld, _pj);
      const l1 = _v1.length(), l2 = _v2.length();
      if (l1 < 1e-6 || l2 < 1e-6) continue;
      _v1.divideScalar(l1); _v2.divideScalar(l2);
      let dot = Math.max(-1, Math.min(1, _v1.dot(_v2)));
      let angle = Math.acos(dot);
      if (angle < 1e-4) continue;
      if (angle > maxStep) angle = maxStep;
      _axis.crossVectors(_v1, _v2);
      if (_axis.lengthSq() < 1e-10) continue;
      _axis.normalize();
      _q.setFromAxisAngle(_axis, angle);              // world-space delta
      joint.getWorldQuaternion(_wq);
      _wq.premultiply(_q);                            // new world orientation
      if (joint.parent) {
        joint.parent.getWorldQuaternion(_pwq).invert();
        joint.quaternion.copy(_pwq).multiply(_wq).normalize();
      } else {
        joint.quaternion.copy(_wq).normalize();
      }
      joint.updateWorldMatrix(false, true);
    }
    if (effWorld().distanceToSquared(targetWorld) < 1e-6) break;
  }
}
