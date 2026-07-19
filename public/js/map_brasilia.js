// "Praça dos Três Poderes" — a faithful(ish) low-poly Brasília arena.
// Congresso Nacional (twin towers + Senate dome + Chamber bowl) at the NORTH end,
// Catedral de N. Sra. Aparecida (16-rib crown) at the SOUTH end, with the Praça dos
// Três Poderes (Planalto, STF, the Os Guerreiros & A Justiça statues) clustered at the
// Congresso end and the Esplanada dos Ministérios lane connecting the two ends.
// Niemeyer's forms reduce to primitives (slabs, a dome, an inverted bowl, radial ribs),
// so everything is procedural, collidable and native — same contract as buildWorld().
import * as THREE from 'three';
import { placeProp } from './mapprops.js';

const WHITE = 0xeeeee6;   // Niemeyer concrete white
const GLASS = 0x8fb6cf;

export function buildBrasilia(scene, T) {
  const colliders = [];   // {minX,minY,minZ,maxX,maxY,maxZ}
  const occluders = [];   // meshes for LOS / bullet raycasts
  const root = new THREE.Group();
  scene.add(root);

  const lam = (opts) => new THREE.MeshLambertMaterial(opts);
  const white = () => lam({ color: WHITE });
  const glass = () => lam({ color: GLASS, transparent: true, opacity: 0.55 });

  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.rz) m.rotation.z = opts.rz;
    root.add(m);
    if (opts.collide !== false) {
      const pad = opts.pad || 0;
      const ex = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : w / 2;
      const ez = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : d / 2;
      colliders.push({ minX: x - ex - pad, maxX: x + ex + pad, minY: y, maxY: y + h, minZ: z - ez - pad, maxZ: z + ez + pad });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    m.receiveShadow = true; root.add(m); return m;
  }
  const col = (minX, maxX, minY, maxY, minZ, maxZ) => colliders.push({ minX, maxX, minY, maxY, minZ, maxZ });

  /* ---------------- ground + esplanade ---------------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 300), lam({ map: T.grass }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // Esplanada dos Ministérios: long pale-concrete lane (the sniper sightline)
  addPlane(30, 104, lam({ map: T.concrete }), 0, 0.03, 0, 0, -Math.PI / 2);
  // side walkways
  for (const sx of [-1, 1]) addPlane(6, 104, lam({ map: T.concreteDark }), sx * 20, 0.02, 0, 0, -Math.PI / 2);

  /* ================= CONGRESSO NACIONAL (north end, z≈+54) ================= */
  {
    const CZ = 58;
    // long low horizontal building (the Congress "tray")
    addBox(46, 5, 15, white(), 0, 0, CZ + 1, { pad: 0.1 });
    addBox(48, 0.6, 17, white(), 0, 5, CZ + 1, { collide: false }); // roof slab overhang
    // Senate DOME (west) — hemisphere convex up on the roof
    const domeGeo = new THREE.SphereGeometry(6.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, white()); dome.position.set(-13, 5.4, CZ + 1);
    dome.castShadow = true; root.add(dome);
    col(-19, -7, 0, 9, CZ - 5, CZ + 7);
    // Chamber BOWL (east) — same hemisphere flipped → opens upward like a cup
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(6.8, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), white());
    bowl.rotation.x = Math.PI; bowl.position.set(13, 6.6, CZ + 1); bowl.castShadow = true; root.add(bowl);
    col(7, 19, 0, 6, CZ - 5, CZ + 7);
    // TWIN TOWERS (the "H") — two thin tall slabs with a gap + connecting bridges
    for (const tx of [-3, 3]) addBox(4.4, 40, 8.5, white(), tx, 5.6, CZ + 1, { pad: 0.1 });
    for (const by of [22, 30]) addBox(1.6, 3, 7, white(), 0, by, CZ + 1, { collide: false }); // crossbars
    // reflecting pool in front of Congresso (shallow, north of the B spawn)
    addPlane(34, 7, lam({ color: 0x2f6ea0, transparent: true, opacity: 0.9 }), 0, 0.06, CZ - 6, 0, -Math.PI / 2);
  }

  /* ============ PRAÇA DOS TRÊS PODERES (Congresso end, z≈+30) ============ */
  // Palácio do Planalto (east) & STF (west): horizontal white slab on tapered "sail" columns.
  const palace = (cx, cz, faceX) => {
    // raised slab (two floors) on columns
    addBox(20, 4, 12, white(), cx, 3.2, cz, { pad: 0.1 });          // main box (raised)
    addBox(22, 0.5, 14, white(), cx, 7.2, cz, { collide: false });  // thin roof slab
    addBox(22, 0.5, 14, white(), cx, 3.0, cz, { collide: false });  // thin floor slab
    // glass curtain wall
    addBox(18, 3.4, 0.2, glass(), cx, 3.4, cz - faceX * 6, { collide: false });
    // the iconic Niemeyer colonnade — thin curved "sail" columns along the facing side
    for (let i = -3; i <= 3; i++) {
      const fx = cx + i * 3;
      const fin = addBox(0.35, 4.4, 2.2, white(), fx, 0, cz - faceX * 6.6, { collide: false });
      fin.rotation.x = faceX * 0.12;
    }
    col(cx - 11, cx + 11, 0, 7.4, cz - 7, cz + 7);
  };
  palace(16, 30, 1);   // Planalto (east)
  palace(-16, 30, 1);  // STF (west)

  // Panteão da Pátria — small angular white monument near the praça
  {
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0, 3.2, 3.6, 3), white());
    pan.rotation.y = 0.4; pan.position.set(11, 1.8, 40); pan.castShadow = true; root.add(pan);
    col(8, 14, 0, 3.6, 37, 43);
  }
  // Mastro da bandeira — tall flagpole + stylised green/yellow flag
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 34, 8), lam({ color: 0x9aa0a6 }));
    pole.position.set(-12, 17, 40); pole.castShadow = true; root.add(pole);
    col(-12.3, -11.7, 0, 34, 39.7, 40.3);
    addPlane(5, 3.4, lam({ color: 0x1f9d55, side: THREE.DoubleSide }), -9.3, 31, 40);       // green field
    const diamond = addPlane(2.4, 2.4, lam({ color: 0xffd23f, side: THREE.DoubleSide }), -9.3, 31, 40.02);
    diamond.rotation.z = Math.PI / 4;                                                        // yellow rhombus
    addPlane(1.1, 1.1, lam({ color: 0x2b3f8f, side: THREE.DoubleSide }), -9.3, 31, 40.04);   // blue globe
  }

  /* ---------------- statues (Mint props, optional) ---------------- */
  const putStatue = (id, x, z, targetH, ry) => {
    const o = placeProp(id, { x, z, targetH, ry });
    if (!o) return;
    root.add(o); occluders.push(o);
    col(x - 1, x + 1, 0, targetH, z - 1, z + 1);
  };
  putStatue('guerreiros', 6, 36, 4.6, Math.PI);   // Os Guerreiros, praça centre-east
  putStatue('justica', -13, 24, 3.4, 0);          // A Justiça, in front of STF

  /* ================= CATEDRAL (south end, z≈-54) ================= */
  {
    const CX = 0, CZ = -58;
    // sunken circular base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1, 24), lam({ map: T.concrete }));
    base.position.set(CX, 0.5, CZ); base.receiveShadow = true; root.add(base);
    // central glass drum (the nave under the crown)
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 6, 20, 1, true), glass());
    drum.position.set(CX, 3.5, CZ); root.add(drum);
    // 16 hyperbolic ribs: bow outward at mid, converge up top
    const ribMat = white();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const cx = Math.cos(a), cz = Math.sin(a);
      const p0 = new THREE.Vector3(CX + cx * 6.5, 0.5, CZ + cz * 6.5);
      const p1 = new THREE.Vector3(CX + cx * 9.5, 8, CZ + cz * 9.5);
      const p2 = new THREE.Vector3(CX + cx * 3.2, 17, CZ + cz * 3.2);
      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.42, 6, false), ribMat);
      rib.castShadow = true; root.add(rib);
      // collider at each rib's ground foot (ring of thin AABBs blocks walking through)
      col(p0.x - 0.6, p0.x + 0.6, 0, 3, p0.z - 0.6, p0.z + 0.6);
    }
    // campanário (bell tower) beside the cathedral
    addBox(1.6, 26, 1.6, white(), 13, 0, CZ + 4, { pad: 0.1 });
    addBox(3, 3, 3, white(), 13, 20, CZ + 4, { collide: false });
    // three bronze "apostles" hint (simple figures) flanking the approach
    for (const ax of [-7, -3, 9]) {
      const ap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 6), lam({ color: 0x5a4632 }));
      ap.position.set(ax, 1.5, CZ + 9); ap.castShadow = true; root.add(ap);   // hug the cathedral, behind the P spawn
      col(ax - 0.5, ax + 0.5, 0, 3, CZ + 8.5, CZ + 9.5);
    }
  }

  /* ================= MINISTÉRIOS (lane walls / cover) ================= */
  // two rows of identical glass boxes flanking the esplanade — frame the sightline
  for (const sx of [-1, 1]) {
    for (const mz of [-30, -18, -6, 6, 18]) {
      addBox(9, 6.5, 9, glass(), sx * 24, 0, mz, { pad: 0.1 });
      addBox(9.4, 0.5, 9.4, white(), sx * 24, 6.5, mz, { collide: false }); // roof cap
    }
  }

  /* ---------------- gameplay cover along the esplanade ---------------- */
  const crateMat = lam({ map: T.crate });
  for (const [cx, cz, lv] of [[-6, -14, 0], [6, 14, 0], [-6, -12.4, 1], [7, -22, 0], [-7, 22, 0],
    [11, 2, 0], [-11, -2, 0], [4, 40, 0], [-4, -40, 0], [11, 3.6, 1]])
    addBox(1.6, 1.6, 1.6, crateMat, cx, lv * 1.6, cz, { ry: (cx * 7 % 10) / 22, pad: -0.05 });
  // low planters (Niemeyer concrete tubs with greenery)
  for (const [px, pz] of [[-10, 8], [10, -8], [-10, -20], [10, 20], [0, -34], [0, 34]]) {
    addBox(3.4, 0.9, 1.3, lam({ color: WHITE }), px, 0, pz);
    addBox(3, 0.5, 0.9, lam({ map: T.grass }), px, 0.9, pz, { collide: false });
  }

  /* ---------------- lighting & sky ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xbfd8ee, 90, 240);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunSprite, transparent: true, fog: false, depthWrite: false }));
  sunSpr.position.set(120, 95, -150); sunSpr.scale.setScalar(70); root.add(sunSpr);
  for (const [cx, cy, cz, cs] of [[-90, 80, -130, 60], [50, 88, -160, 74], [130, 72, 70, 64], [-120, 82, 100, 68]]) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloud, transparent: true, fog: false, depthWrite: false, opacity: 0.9 }));
    cl.position.set(cx, cy, cz); cl.scale.set(cs, cs * 0.42, 1); root.add(cl);
  }
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x9c8f6f, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.55);
  sun.position.set(40, 60, -10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.camera.far = 200; sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfd8ee, 0.3);
  fill.position.set(-30, 45, 30); scene.add(fill);

  /* ---------------- ground height (flat) ---------------- */
  function groundHeightAt() { return 0; }

  /* ---------------- waypoints graph ---------------- */
  const nodes = [], adj = [];
  const STEP = 4.4;
  const blocked = (x, z, inflate) => {
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate && z > c.minZ - inflate && z < c.maxZ + inflate &&
          c.minY < 1.6 && c.maxY > 0.15) return true;
    }
    return false;
  };
  for (let gx = -22; gx <= 22; gx += STEP)
    for (let gz = -46; gz <= 46; gz += STEP)
      if (!blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => {
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, 0.25)) return false;
    }
    return true;
  };
  for (let i = 0; i < nodes.length; i++) {
    adj.push([]);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z;
      if (dx * dx + dz * dz < STEP * STEP * 2.2 && segClear(nodes[i], nodes[j])) adj[i].push(j);
    }
  }
  function nearestWaypoint(x, z) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function findPath(fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    const prev = new Int16Array(nodes.length).fill(-1);
    const q = [fromIdx]; prev[fromIdx] = fromIdx;
    while (q.length) {
      const n = q.shift();
      for (const m of adj[n]) if (prev[m] === -1) {
        prev[m] = n;
        if (m === toIdx) {
          const path = [m]; let c = n;
          while (c !== fromIdx) { path.unshift(c); c = prev[c]; }
          path.unshift(fromIdx);
          return path;
        }
        q.push(m);
      }
    }
    return [fromIdx];
  }

  /* ---------------- spawns ---------------- */
  // P (Petistas) at the Cathedral end (south), B (Bolsonaristas) at the Congresso end
  // (north). yaw faces each team DOWN the esplanade toward the opposite landmark
  // (yaw 0 looks -Z, yaw π looks +Z in this engine).
  const mk = s => [-9, -3, 3, 9].map(x => ({ x, z: 43 * s, yaw: s < 0 ? Math.PI : 0 }));
  const spawns = { P: mk(-1), B: mk(1) };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -25.5, maxX: 25.5, minZ: -60, maxZ: 60 },
  };
}
