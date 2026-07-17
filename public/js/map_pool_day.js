// fy_pool_day homage — the classic CS 1.6 "full weapons" map, rebuilt from the
// real map: a COMPACT INDOOR tiled swimming-pool hall. White-tile walls with a
// navy accent band, white-tile floor, a big recessed cyan pool that dominates the
// room, banks of metal lockers as cover, blue lounge chairs, a white diving board,
// shower stalls, a glass skylight roof — and rows of weapons on the deck.
// Same buildWorld contract as map.js.
import * as THREE from 'three';

const HALF_X = 17, HALF_Z = 25;   // interior half-extents (walls sit just outside)
const WALL_H = 7, CEIL = 7;

/* ---------- inline procedural tile textures ---------- */
function mkTex(c, rx = 1, rz = 1, clamp = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.repeat.set(rx, rz);
  return t;
}
function tileTex(base, line, n, rx, rz) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = line; x.lineWidth = 3;
  const s = 128 / n;
  for (let i = 0; i <= n; i++) {
    x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, 128); x.stroke();
    x.beginPath(); x.moveTo(0, i * s); x.lineTo(128, i * s); x.stroke();
  }
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(120,140,160,${Math.random() * 0.05})`; x.fillRect(Math.random() * 128, Math.random() * 128, 4, 4); }
  return mkTex(c, rx, rz);
}
function signTexture(bg, fg, title, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(6, 6, 500, 116);
  x.textAlign = 'center'; x.fillStyle = fg;
  x.font = 'bold 44px "Arial Black",Impact,sans-serif'; x.fillText(title, 256, 60);
  if (sub) { x.font = 'bold 20px Arial,sans-serif'; x.fillText(sub, 256, 96); }
  return mkTex(c, 1, 1, true);
}

export function buildPoolDay(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);

  const lam = (opts) => new THREE.MeshLambertMaterial(opts);
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

  const TEX = {
    wall: tileTex('#eef3f6', '#c2d0d8', 4, 8, 3),
    floor: tileTex('#e7ecef', '#ccd6dd', 4, 12, 16),
    pool: tileTex('#33c6e0', '#7fe4f2', 4, 4, 5),
  };
  const MAT = {
    wall: lam({ map: TEX.wall }), floor: lam({ map: TEX.floor }), pool: lam({ map: TEX.pool }),
    navy: lam({ color: 0x24407a }), white: lam({ color: 0xf2f5f7 }),
    locker: lam({ color: 0xc2ccd4 }), lockerDark: lam({ color: 0x94a3af }),
    chair: lam({ color: 0x2f4f9e }), steel: lam({ color: 0x8a9096 }), ceil: lam({ color: 0xe4ebef }),
  };

  /* ---------------- pool basin (recessed, sloped sides) ---------------- */
  const POOL = { cx: 0, cz: -1, hx: 9, hz: 11, m: 2.5, depth: 1.5 };
  const OUTX = POOL.hx + POOL.m, OUTZ = POOL.hz + POOL.m;
  const nX = POOL.cx + OUTX, sX = POOL.cx - OUTX, nZ = POOL.cz + OUTZ, sZ = POOL.cz - OUTZ;
  function poolDepth(x, z) {
    const ox = Math.abs(x - POOL.cx), oz = Math.abs(z - POOL.cz);
    if (ox > OUTX || oz > OUTZ) return 0;
    const penX = Math.min(1, Math.max(0, (OUTX - ox) / POOL.m));
    const penZ = Math.min(1, Math.max(0, (OUTZ - oz) / POOL.m));
    return -POOL.depth * Math.min(penX, penZ);
  }

  /* ---------------- floor tiles framing the pool hole ---------------- */
  const addFloor = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.floor); m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); m.receiveShadow = true; root.add(m); };
  addFloor(HALF_X * 2, HALF_Z - nZ, 0, (nZ + HALF_Z) / 2);
  addFloor(HALF_X * 2, sZ + HALF_Z, 0, (sZ - HALF_Z) / 2);
  addFloor(HALF_X - nX, nZ - sZ, (nX + HALF_X) / 2, POOL.cz);
  addFloor(sX + HALF_X, nZ - sZ, (sX - HALF_X) / 2, POOL.cz);

  /* ---------------- the pool ---------------- */
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(POOL.hx * 2, POOL.hz * 2), MAT.pool);
    fl.rotation.x = -Math.PI / 2; fl.position.set(POOL.cx, -POOL.depth + 0.02, POOL.cz); fl.receiveShadow = true; root.add(fl);
    const ang = Math.atan2(POOL.depth, POOL.m), L = Math.hypot(POOL.depth, POOL.m);
    addBox(POOL.hx * 2, 0.1, L, MAT.pool, POOL.cx, -POOL.depth / 2, POOL.cz + POOL.hz + POOL.m / 2, { collide: false, rx: -ang, cast: false });
    addBox(POOL.hx * 2, 0.1, L, MAT.pool, POOL.cx, -POOL.depth / 2, POOL.cz - POOL.hz - POOL.m / 2, { collide: false, rx: ang, cast: false });
    addBox(L, 0.1, POOL.hz * 2, MAT.pool, POOL.cx + POOL.hx + POOL.m / 2, -POOL.depth / 2, POOL.cz, { collide: false, rz: ang, cast: false });
    addBox(L, 0.1, POOL.hz * 2, MAT.pool, POOL.cx - POOL.hx - POOL.m / 2, -POOL.depth / 2, POOL.cz, { collide: false, rz: -ang, cast: false });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(OUTX * 2 - 0.3, OUTZ * 2 - 0.3),
      new THREE.MeshLambertMaterial({ color: 0x2fd0ea, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2; water.position.set(POOL.cx, -0.4, POOL.cz); root.add(water);
    // navy tile border
    addBox(OUTX * 2 + 0.7, 0.16, 0.5, MAT.navy, POOL.cx, 0, nZ + 0.15, { collide: false });
    addBox(OUTX * 2 + 0.7, 0.16, 0.5, MAT.navy, POOL.cx, 0, sZ - 0.15, { collide: false });
    addBox(0.5, 0.16, OUTZ * 2 + 0.7, MAT.navy, nX + 0.15, 0, POOL.cz, { collide: false });
    addBox(0.5, 0.16, OUTZ * 2 + 0.7, MAT.navy, sX - 0.15, 0, POOL.cz, { collide: false });
    for (const lx of [-6, -2, 2, 6])
      addPlane(0.2, POOL.hz * 2 - 1, MAT.navy, POOL.cx + lx, -POOL.depth + 0.04, POOL.cz, 0, -Math.PI / 2);
    // ladders
    for (const sx of [1, -1]) {
      const lx = POOL.cx + sx * (OUTX - 0.1);
      for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), MAT.white); r.rotation.z = Math.PI / 2; r.position.set(lx, -0.15 - i * 0.28, POOL.cz + 3); root.add(r); }
      for (const dz of [-0.35, 0.35]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), MAT.white); r.position.set(lx, -0.05, POOL.cz + 3 + dz); root.add(r); }
    }
  }

  /* ---------------- diving board (north end over the water) ---------------- */
  addBox(0.3, 1.3, 0.3, MAT.steel, POOL.cx - 0.8, 0, nZ + 1.1);
  addBox(0.3, 1.3, 0.3, MAT.steel, POOL.cx + 0.8, 0, nZ + 1.1);
  addBox(1.4, 0.15, 4.0, MAT.white, POOL.cx, 1.3, nZ - 0.9, { collide: false });

  /* ---------------- walls: white tile + navy accent band ---------------- */
  const wX = HALF_X + 0.5, wZ = HALF_Z + 0.5;
  addBox(HALF_X * 2 + 2, WALL_H, 1, MAT.wall, 0, 0, -wZ);
  addBox(HALF_X * 2 + 2, WALL_H, 1, MAT.wall, 0, 0, wZ);
  addBox(1, WALL_H, HALF_Z * 2 + 2, MAT.wall, -wX, 0, 0);
  addBox(1, WALL_H, HALF_Z * 2 + 2, MAT.wall, wX, 0, 0);
  for (const [w, h, d, x, z] of [[HALF_X * 2 + 2, 0.6, 0.12, 0, -HALF_Z], [HALF_X * 2 + 2, 0.6, 0.12, 0, HALF_Z], [0.12, 0.6, HALF_Z * 2 + 2, -HALF_X, 0], [0.12, 0.6, HALF_Z * 2 + 2, HALF_X, 0]])
    addBox(w, h, d, MAT.navy, x, 2.0, z, { collide: false });
  // clock + signage on the north wall
  {
    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 20), MAT.white);
    clock.rotation.x = Math.PI / 2; clock.position.set(-8, 4.6, HALF_Z); root.add(clock);
    addPlane(1.5, 1.5, MAT.white, -8, 4.6, HALF_Z - 0.06, Math.PI);
    addPlane(1.1, 1.1, MAT.navy, -8, 4.6, HALF_Z - 0.08, Math.PI);
    addPlane(6, 2.2, signTexture('#1b3566', '#dff2ff', 'PISCINÃO DA TRETA', 'CLUBE AQUÁTICO PIXELÂNDIA'), 6, 4.4, HALF_Z - 0.06, Math.PI);
  }

  /* ---------------- glass skylight roof (keeps it enclosed) ---------------- */
  {
    const oX = 10, oZ = 15;
    addBox(HALF_X * 2 + 2, 0.35, HALF_Z - oZ, MAT.ceil, 0, CEIL, (oZ + HALF_Z) / 2, { collide: false, cast: false });
    addBox(HALF_X * 2 + 2, 0.35, HALF_Z - oZ, MAT.ceil, 0, CEIL, -(oZ + HALF_Z) / 2, { collide: false, cast: false });
    addBox(HALF_X - oX, 0.35, oZ * 2, MAT.ceil, (oX + HALF_X) / 2, CEIL, 0, { collide: false, cast: false });
    addBox(HALF_X - oX, 0.35, oZ * 2, MAT.ceil, -(oX + HALF_X) / 2, CEIL, 0, { collide: false, cast: false });
    // translucent glass panel + beams over the opening
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(oX * 2, oZ * 2), new THREE.MeshLambertMaterial({ color: 0xcfe8f2, transparent: true, opacity: 0.35 }));
    glass.rotation.x = Math.PI / 2; glass.position.set(0, CEIL - 0.05, 0); root.add(glass);
    for (let z = -oZ; z <= oZ; z += 3.75) addBox(oX * 2, 0.2, 0.2, MAT.steel, 0, CEIL - 0.15, z, { collide: false, cast: false });
    for (const x of [-oX / 2, 0, oX / 2]) addBox(0.2, 0.2, oZ * 2, MAT.steel, x, CEIL - 0.15, 0, { collide: false, cast: false });
  }

  /* ---------------- spawns' end signage ---------------- */
  for (const s of [1, -1]) {
    const label = s < 0 ? signTexture('#c62f2f', '#ffffff', 'PETISTAS', 'VESTIÁRIO A') : signTexture('#1faa4d', '#ffd23f', 'BOLSONARISTAS', 'VESTIÁRIO B');
    addPlane(8, 2.4, label, 0, 4.4, (HALF_Z - 0.06) * s, s < 0 ? 0 : Math.PI);
  }

  /* ---------------- lockers: cover on the decks ---------------- */
  function lockerBank(x, z, n, along, ry = 0) {
    for (let i = 0; i < n; i++) {
      const bx = x + (along === 'x' ? (i - (n - 1) / 2) * 1.35 : 0);
      const bz = z + (along === 'z' ? (i - (n - 1) / 2) * 1.35 : 0);
      addBox(along === 'x' ? 1.3 : 0.7, 2.1, along === 'z' ? 1.3 : 0.7, MAT.locker, bx, 0, bz, { ry, pad: -0.02 });
      addBox(along === 'x' ? 0.95 : 0.08, 1.5, along === 'z' ? 0.95 : 0.08, MAT.lockerDark, bx, 0.3, bz + (along === 'x' ? 0.36 : 0), { collide: false });
    }
  }
  lockerBank(-14, -1, 4, 'z');
  lockerBank(14, -1, 4, 'z');
  lockerBank(0, 18, 5, 'x');
  lockerBank(-6, -19, 3, 'x');
  lockerBank(6, -19, 3, 'x');

  /* ---------------- blue lounge chairs poolside ---------------- */
  for (const [cx, cz, ry] of [[-14, 5, 0.2], [14, 5, -0.2], [-14, -7, 0.1], [14, -7, -0.1], [7, 15, 0], [-7, 15, 0]]) {
    addBox(0.85, 0.25, 1.9, MAT.chair, cx, 0.2, cz, { collide: false, ry });
    const back = addBox(0.85, 0.85, 0.2, MAT.chair, cx, 0.2, cz - 0.85, { collide: false, ry }); back.rotation.x = -0.5;
  }

  /* ---------------- shower stalls (SE corner) ---------------- */
  {
    for (const dz of [0, 2.2]) {
      addBox(2.6, 3.0, 0.15, MAT.wall, 14.5, 0, -20 - dz, { collide: false });
      addBox(0.15, 3.0, 2.2, MAT.wall, 13.2, 0, -21.1 - dz, { pad: -0.02 });
      addBox(0.45, 0.45, 0.2, MAT.steel, 14.5, 2.4, -20 - dz, { collide: false });
    }
    addBox(0.15, 3.0, 4.6, MAT.wall, 15.8, 0, -21.1, { collide: false });
  }

  /* ---------------- fy_ weapons: rows of guns on the deck ---------------- */
  const GM = { black: lam({ color: 0x1b1d21 }), steel: lam({ color: 0x9aa0a6 }), wood: lam({ color: 0x7a5326 }), tan: lam({ color: 0xb39a63 }), green: lam({ color: 0x16432a }) };
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const cyl = (r, len, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m; };
  function buildGun(kind, x, z, yaw) {
    const g = new THREE.Group(); const add = (...ms) => ms.forEach(m => g.add(m));
    switch (kind) {
      case 'awp': add(box(0.11, 0.1, 1.35, GM.green, 0, 0.09, 0.05), box(0.11, 0.16, 0.36, GM.green, 0, 0.1, 0.6), cyl(0.05, 0.36, GM.black, 0, 0.19, 0.05), box(0.08, 0.18, 0.16, GM.black, 0, 0.03, -0.15)); break;
      case 'ak': add(box(0.1, 0.1, 1.05, GM.black, 0, 0.09, 0), box(0.11, 0.13, 0.34, GM.wood, 0, 0.1, 0.46), box(0.11, 0.12, 0.24, GM.wood, 0, 0.1, -0.12), box(0.09, 0.24, 0.14, GM.black, 0, -0.02, -0.02)); break;
      case 'm4': add(box(0.09, 0.1, 1.0, GM.black, 0, 0.09, 0), box(0.1, 0.14, 0.32, GM.black, 0, 0.1, 0.45), box(0.08, 0.06, 0.3, GM.black, 0, 0.17, 0.02), box(0.08, 0.2, 0.13, GM.black, 0, 0, -0.05)); break;
      case 'mp5': add(box(0.09, 0.11, 0.62, GM.black, 0, 0.09, 0), box(0.09, 0.1, 0.22, GM.black, 0, 0.09, 0.36), box(0.07, 0.22, 0.1, GM.black, 0, 0, -0.02)); break;
      case 'shotgun': add(box(0.1, 0.11, 1.0, GM.black, 0, 0.11, 0), box(0.1, 0.09, 0.9, GM.wood, 0, 0.02, 0.02), box(0.11, 0.15, 0.34, GM.wood, 0, 0.1, 0.5)); break;
      case 'deagle': add(box(0.09, 0.13, 0.4, GM.steel, 0, 0.1, 0), box(0.09, 0.2, 0.11, GM.tan, 0, 0.02, 0.15)); break;
      default: add(box(0.08, 0.12, 0.3, GM.black, 0, 0.09, 0), box(0.08, 0.16, 0.1, GM.black, 0, 0.03, 0.11));
    }
    g.position.set(x, 0.02, z); g.rotation.y = yaw; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g;
  }
  const RIFLES = ['awp', 'ak', 'm4', 'shotgun', 'mp5'];
  const place = (kind, x, z, yaw) => { const mesh = buildGun(kind, x, z, yaw); pickups.push({ x, z, kind, weapon: (kind === 'pistol' || kind === 'deagle') ? 'pistol' : 'awp', readyAt: 0, mesh }); };
  let ri = 0;
  for (const sx of [-1, 1]) { const x = sx * 15.5; for (const z of [-8, -4, 0, 4, 8]) place(RIFLES[ri++ % RIFLES.length], x, z, sx > 0 ? Math.PI / 2 : -Math.PI / 2); }
  for (const s of [-1, 1]) { const z = 20 * s; ['deagle', 'pistol', 'pistol', 'deagle'].forEach((k, i) => place(k, [-6, -2, 2, 6][i], z, s > 0 ? Math.PI : 0)); }
  place('awp', -3, 16, 0); place('ak', 3, 16, 0); place('m4', -3, -17, 0); place('shotgun', 3, -17, 0);

  /* ---------------- lighting: bright, even, indoor ---------------- */
  scene.background = T.sky;
  scene.fog = null;
  const hemi = new THREE.HemisphereLight(0xf2fbff, 0xb9c6d0, 1.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(10, 45, -6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
  sun.shadow.camera.far = 110; sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfeeff, 0.55);
  fill.position.set(-15, 35, 15); scene.add(fill);

  /* ---------------- ground height ---------------- */
  function groundHeightAt(x, z) { return poolDepth(x, z); }

  /* ---------------- waypoints (deck only) ---------------- */
  const nodes = [], adj = [];
  const STEP = 3.4;
  const blocked = (x, z, inflate) => {
    const g = groundHeightAt(x, z);
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate && z > c.minZ - inflate && z < c.maxZ + inflate && c.minY < g + 1.6 && c.maxY > g + 0.15) return true;
    }
    return false;
  };
  for (let gx = -HALF_X + 2; gx <= HALF_X - 2; gx += STEP)
    for (let gz = -HALF_Z + 2; gz <= HALF_Z - 2; gz += STEP)
      if (!blocked(gx, gz, 0.5) && groundHeightAt(gx, gz) > -0.35) nodes.push({ x: gx, z: gz });
  const segClear = (a, b) => {
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, 0.25)) return false;
      if (Math.abs(groundHeightAt(x, z) - groundHeightAt(a.x, a.z)) > 0.65) return false;
    }
    return true;
  };
  for (let i = 0; i < nodes.length; i++) {
    adj.push([]);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z, d2 = dx * dx + dz * dz;
      if (d2 < STEP * STEP * 2.4 && segClear(nodes[i], nodes[j])) adj[i].push(j);
    }
  }
  function nearestWaypoint(x, z) { let best = 0, bd = 1e9; for (let i = 0; i < nodes.length; i++) { const dx = nodes[i].x - x, dz = nodes[i].z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } } return best; }
  function findPath(fromIdx, toIdx) {
    if (fromIdx === toIdx) return [toIdx];
    const prev = new Int16Array(nodes.length).fill(-1);
    const q = [fromIdx]; prev[fromIdx] = fromIdx;
    while (q.length) {
      const n = q.shift();
      for (const m of adj[n]) if (prev[m] === -1) {
        prev[m] = n;
        if (m === toIdx) { const path = [m]; let c = n; while (c !== fromIdx) { path.unshift(c); c = prev[c]; } path.unshift(fromIdx); return path; }
        q.push(m);
      }
    }
    return [fromIdx];
  }

  // spawns at the two ends, on the deck
  const mk = s => [-6, -2, 2, 6].map(x => ({ x, z: (HALF_Z - 4) * s, yaw: s < 0 ? 0 : Math.PI }));
  const spawns = { P: mk(-1), B: mk(1) };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -HALF_X + 0.5, maxX: HALF_X - 0.5, minZ: -HALF_Z + 0.5, maxZ: HALF_Z - 0.5 },
  };
}
