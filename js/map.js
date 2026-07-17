// awp_map-inspired arena, Brazilian satire edition. Procedural geometry only.
import * as THREE from 'three';

const WALL_H = 4.5;

export function buildWorld(scene, T) {
  const colliders = [];   // {minX,minY,minZ,maxX,maxY,maxZ}
  const occluders = [];   // meshes for LOS / bullet raycasts
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
      // conservative AABB even for slightly rotated boxes
      const ex = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : w / 2;
      const ez = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : d / 2;
      colliders.push({
        minX: x - ex - pad, maxX: x + ex + pad,
        minY: y, maxY: y + h,
        minZ: z - ez - pad, maxZ: z + ez + pad,
      });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    m.receiveShadow = true; root.add(m); return m;
  }

  /* ---------------- ground ---------------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 190), lam({ map: T.ground }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // central asphalt lane
  addPlane(14, 92, lam({ map: T.asphalt }), 0, 0.03, 0, 0, -Math.PI / 2);
  // plaza disc (fictional Praça dos Três Poderes)
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 0.08, 28), lam({ map: T.concrete }));
  plaza.position.y = 0.04; plaza.receiveShadow = true; root.add(plaza);
  // dirt patch (MST camp) + grass decor
  addPlane(14, 12, lam({ map: T.dirt }), -18, 0.05, -36, 0, -Math.PI / 2);
  for (const [gx, gz] of [[14, -26], [-12, 22], [20, 14], [-8, -14]])
    addPlane(5, 4, lam({ map: T.grass }), gx, 0.04, gz, 0, -Math.PI / 2);

  /* ---------------- perimeter walls with graffiti ---------------- */
  const wallMat = () => lam({ map: T.graffiti[(Math.random() * T.graffiti.length) | 0] });
  addBox(54, WALL_H, 1, wallMat(), 0, 0, -46.5);              // south (Petistas)
  addBox(54, WALL_H, 1, wallMat(), 0, 0, 46.5);               // north (Bolsonaristas)
  addBox(1, WALL_H, 94, wallMat(), -26.5, 0, 0);              // west
  addBox(1, WALL_H, 94, wallMat(), 26.5, 0, 0);               // east

  /* ---------------- spawn platforms + ramps ---------------- */
  const platMat = lam({ map: T.concreteDark });
  for (const s of [1, -1]) {
    // platform body (visual; height handled by groundHeightAt)
    addBox(30, 1.4, 8, platMat, 0, 0, 42 * s, { collide: false });
    // ramps (visual wedges made of slabs)
    for (const rx of [-11, 11]) {
      const ramp = addBox(6, 0.25, 8.6, platMat, rx, 0, 34 * s, { collide: false });
      ramp.rotation.x = -s * Math.atan2(1.4, 8);              // high at platform edge, low at mid
      ramp.position.y = 0.72;
    }
    // back decorative banner on platform wall
    const bannerT = s < 0 ? T.posters[0] : T.posters[1];
    addPlane(6, 4, lam({ map: bannerT }), 0, 3.2, 45.9 * s, s < 0 ? 0 : Math.PI);
  }

  /* ---------------- central cover: giant broken urna eletrônica ---------------- */
  {
    const urna = addBox(3.2, 4.2, 2.2, lam({ map: T.urna }), 0, 0, 0, { rz: 0.06, pad: 0.1 });
    addBox(3.6, 0.5, 2.6, lam({ map: T.concreteDark }), 0, 0, 0, { collide: false }); // base slab
    urna.castShadow = true;
  }
  // planters flanking the plaza
  for (const px of [-7, 7]) {
    addBox(4, 0.9, 1.3, lam({ map: T.concrete }), px, 0, 0);
    addBox(3.6, 0.5, 0.9, lam({ map: T.grass }), px, 0.9, 0, { collide: false });
  }

  /* ---------------- crates ---------------- */
  const crateMat = lam({ map: T.crate });
  const crates = [
    [-10, -12, 0], [10, 12, 0], [-10, -10.2, 1], // [x,z,stackLevel]
    [4, -20, 0], [-4, 20, 0], [5.8, -20, 0], [-5.8, 20, 0],
    [16, -6, 0], [-16, 6, 0], [16, -7.8, 0], [-16, 7.8, 0],
    [12, 24, 0], [-12, -24, 0], [12, 25.8, 1],
  ];
  for (const [cx, cz, lv] of crates)
    addBox(1.6, 1.6, 1.6, crateMat, cx, lv * 1.6, cz, { ry: (cx * 7 % 10) / 22, pad: -0.05 });

  // low cover walls
  for (const [wx, wz] of [[-18, -18], [18, 18], [18, -22], [-18, 22]])
    addBox(4.2, 1.15, 0.8, lam({ map: T.concrete }), wx, 0, wz);

  /* ---------------- caminhão (east) ---------------- */
  {
    const side = lam({ map: T.truckSide });
    const plain = lam({ color: 0x1faa4d });
    const trailerMats = [plain, plain, plain, plain, side, side];
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.9, 9), trailerMats);
    trailer.position.set(21, 1.9, -10); trailer.castShadow = trailer.receiveShadow = true;
    root.add(trailer); occluders.push(trailer);
    colliders.push({ minX: 19.7, maxX: 22.3, minY: 0, maxY: 3.4, minZ: -14.5, maxZ: -5.5 });
    addBox(2.4, 2.2, 2.6, lam({ color: 0xffd23f }), 21, 0, -3.6);       // cab
    addPlane(1.9, 1.3, lam({ map: T.flagBR, transparent: false }), 19.9, 1.5, -3.6, -Math.PI / 2);
    for (const wz of [-13, -8, -2.8]) {                                 // wheels
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10), lam({ color: 0x1a1a1a }));
      wheel.rotation.z = Math.PI / 2; wheel.position.set(19.9, 0.5, wz); root.add(wheel);
    }
  }

  /* ---------------- sindicato (west) ---------------- */
  {
    addBox(7, 4, 6, lam({ map: T.concrete }), -20, 0, 10);
    addPlane(5.6, 1.4, lam({ map: T.signSindicato }), -16.4, 3.1, 10, Math.PI / 2);
    addPlane(1.2, 2.2, lam({ color: 0x5c1a1a }), -16.45, 1.1, 10, Math.PI / 2);  // door
    addBox(2, 0.3, 1.2, lam({ map: T.concreteDark }), -16.2, 0, 10, { collide: false }); // step
  }

  /* ---------------- MST camp (north-west corner) ---------------- */
  {
    const tentMat = lam({ map: T.tent });
    for (const [tx, tz, tr] of [[-19, -34, .3], [-15, -38, -.4], [-21, -39, 1.2]]) {
      const geo = new THREE.CylinderGeometry(0, 1.7, 2.2, 4);          // pyramid tent
      const tent = new THREE.Mesh(geo, tentMat);
      tent.position.set(tx, 1.1, tz); tent.rotation.y = tr;
      tent.castShadow = tent.receiveShadow = true; root.add(tent); occluders.push(tent);
      colliders.push({ minX: tx - 1.2, maxX: tx + 1.2, minY: 0, maxY: 1.9, minZ: tz - 1.2, maxZ: tz + 1.2 });
    }
    for (const [fx, fz] of [[-17, -32], [-23, -36]]) {                  // red flags
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 6), lam({ color: 0x8a6b48 }));
      pole.position.set(fx, 2.2, fz); root.add(pole);
      const flag = addPlane(1.4, 0.9, lam({ color: 0xe03232, side: THREE.DoubleSide }), fx + 0.72, 3.9, fz);
      flag.castShadow = true;
    }
    addBox(1.2, 0.5, 1.2, lam({ color: 0x6b4f2c }), -17, 0, -36.5, { collide: false }); // fire pit
  }

  /* ---------------- boteco (south-east) ---------------- */
  {
    addBox(3.2, 2.5, 2.4, lam({ map: T.concreteDark }), 20, 0, 37);
    addPlane(3, 0.8, lam({ map: T.signBoteco }), 20, 2.9, 35.7, Math.PI);
    const awn = addPlane(3.6, 1.4, lam({ map: T.awning, side: THREE.DoubleSide }), 20, 2.4, 35.2, Math.PI);
    awn.rotation.x = -0.5;
    // plastic chairs + table (decor)
    for (const [cx, cz, cc] of [[17.5, 34.5, 0xe03232], [18.6, 34, 0x2b4d8f], [17.9, 33.2, 0xffd23f]]) {
      addBox(0.45, 0.45, 0.45, lam({ color: cc }), cx, 0, cz, { collide: false });
      addBox(0.45, 0.5, 0.1, lam({ color: cc }), cx, 0.45, cz - 0.18, { collide: false });
    }
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 10), lam({ color: 0xf0f0f0 }));
    table.position.set(18.2, 0.75, 33.8); root.add(table);
    addBox(0.08, 0.75, 0.08, lam({ color: 0x888888 }), 18.2, 0, 33.8, { collide: false });
  }

  /* ---------------- pastel stand (west mid) ---------------- */
  {
    addBox(1.8, 2.1, 3.4, lam({ map: T.concrete }), -24.2, 0, 0);
    addPlane(2.8, 0.7, lam({ map: T.signPastel }), -23.2, 2.6, 0, Math.PI / 2);
    const awn2 = addPlane(1.6, 3.8, lam({ map: T.awning, side: THREE.DoubleSide }), -23, 2.2, 0, Math.PI / 2);
    awn2.rotation.z = 0.4;
    addBox(1, 0.9, 2.8, lam({ color: 0xe8bd25 }), -23, 0, 0, { collide: false }); // counter
  }

  /* ---------------- loudspeaker poles ---------------- */
  for (const [px, pz] of [[-23, -43], [23, -43], [-23, 43], [23, 43]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 8), lam({ map: T.metal }));
    pole.position.set(px, 3, pz); pole.castShadow = true; root.add(pole);
    colliders.push({ minX: px - .25, maxX: px + .25, minY: 0, maxY: 6, minZ: pz - .25, maxZ: pz + .25 });
    for (let i = 0; i < 4; i++) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 8), lam({ color: 0xd8d8d8 }));
      horn.rotation.set(Math.PI / 2, 0, i * Math.PI / 2);
      horn.position.set(px + Math.sin(i * Math.PI / 2) * 0.35, 5.4, pz + Math.cos(i * Math.PI / 2) * 0.35);
      horn.rotation.y = i * Math.PI / 2; root.add(horn);
    }
  }

  /* ---------------- posters & billboards ---------------- */
  let pi = 0;
  for (const [px, py, pz, ry] of [
    [-25.9, 1.8, -20, Math.PI / 2], [-25.9, 1.7, 24, Math.PI / 2], [25.9, 1.8, 16, -Math.PI / 2],
    [25.9, 1.7, -28, -Math.PI / 2], [-12, 1.8, -45.9, 0], [12, 1.8, 45.9, Math.PI],
    [-25.9, 1.6, -6, Math.PI / 2], [25.9, 1.9, 30, -Math.PI / 2],
  ]) addPlane(1.3, 1.95, lam({ map: T.posters[pi++ % T.posters.length] }), px, py, pz, ry);

  // billboards on both end walls (above) — two single-sided faces so text never mirrors
  for (const s of [1, -1]) {
    for (const bx of [-8, 8]) {
      addBox(0.3, 3.4, 0.3, lam({ map: T.metal }), bx, WALL_H - 0.6, 46.4 * s, { collide: false });
      addBox(8.8, 3.8, 0.15, lam({ color: 0x222222 }), bx, WALL_H, 46.3 * s, { collide: false });
      addPlane(8.6, 3.6, lam({ map: T.billboard }), bx, WALL_H + 1.8, 46.3 * s - 0.09, Math.PI);
      addPlane(8.6, 3.6, lam({ map: T.billboard }), bx, WALL_H + 1.8, 46.3 * s + 0.09, 0);
    }
  }

  /* ---------------- skyline: fictional Brasília silhouettes ---------------- */
  {
    const sil = lam({ color: 0x5f7089 });
    const skyline = new THREE.Group(); root.add(skyline);
    // Congresso-inspired: twin towers + dome + bowl (north)
    const congress = new THREE.Group();
    for (const tx of [-2.2, 2.2]) {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 30, 3), sil);
      tower.position.set(tx, 15, 0); congress.add(tower);
    }
    const slab = new THREE.Mesh(new THREE.BoxGeometry(16, 2.4, 6), sil); slab.position.y = 8; congress.add(slab);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), sil);
    dome.position.set(-6, 9.2, 0); congress.add(dome);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), sil);
    bowl.position.set(7, 14.5, 0); congress.add(bowl);
    congress.position.set(0, 0, 78); skyline.add(congress);
    // Cathedral-inspired crown (south)
    const cath = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 5, 14), sil); base.position.y = 2.5; cath.add(base);
    for (let i = 0; i < 10; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.9, 14, 5), sil);
      const a = i / 10 * Math.PI * 2;
      spike.position.set(Math.cos(a) * 4.4, 10, Math.sin(a) * 4.4);
      spike.rotation.z = Math.cos(a) * 0.45; spike.rotation.x = -Math.sin(a) * 0.45;
      cath.add(spike);
    }
    cath.position.set(-14, 0, -80); skyline.add(cath);
    // generic blocks
    for (const [bx, bz, bw, bh] of [[-40, 70, 10, 16], [34, 74, 12, 22], [48, -70, 9, 13], [-44, -72, 11, 18], [20, -76, 8, 24], [-58, 0, 8, 12], [58, 10, 8, 15]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), sil);
      b.position.set(bx, bh / 2, bz); skyline.add(b);
    }
  }

  /* ---------------- realism props: railings, barrels, tires ---------------- */
  for (const s of [1, -1]) {
    // platform front railing (gaps where the ramps are)
    for (const [rx0, rx1] of [[-15, -8.2], [-7.8, 7.8], [8.2, 15]]) {
      const w = rx1 - rx0;
      addBox(w, 0.06, 0.06, lam({ map: T.metal }), (rx0 + rx1) / 2, 1.4 + 0.85, 38.1 * s, { collide: false });
      const n = Math.max(2, Math.round(w / 2.5));
      for (let i = 0; i <= n; i++)
        addBox(0.06, 0.9, 0.06, lam({ map: T.metal }), rx0 + (w * i) / n, 1.4, 38.1 * s, { collide: false });
    }
  }
  // rusty barrels
  const barrelMat = c => lam({ color: c });
  for (const [bx, bz, bc] of [[-14.5, -8, 0x8f4a2a], [-13.5, -8.6, 0x5a6b3a], [14.5, 8, 0x8f4a2a], [22, 20, 0x4a5a6b], [-22, -20, 0x5a6b3a]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.95, 12), barrelMat(bc));
    b.position.set(bx, 0.48, bz); b.castShadow = b.receiveShadow = true; root.add(b); occluders.push(b);
    colliders.push({ minX: bx - .36, maxX: bx + .36, minY: 0, maxY: .95, minZ: bz - .36, maxZ: bz + .36 });
  }
  // tire stacks
  for (const [tx, tz, n] of [[13.5, -15, 3], [-13.5, 15, 2]]) {
    for (let i = 0; i < n; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.15, 8, 14), lam({ color: 0x1e1e1e }));
      tire.rotation.x = Math.PI / 2; tire.position.set(tx, 0.15 + i * 0.3, tz);
      tire.castShadow = true; root.add(tire); if (i === n - 1) occluders.push(tire);
    }
    colliders.push({ minX: tx - .45, maxX: tx + .45, minY: 0, maxY: n * .3, minZ: tz - .45, maxZ: tz + .45 });
  }

  /* ---------------- lighting & sky ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xffc890, 70, 210);
  // sun disc + clouds (sprites, unaffected by fog)
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunSprite, transparent: true, fog: false, depthWrite: false }));
  sunSpr.position.set(110, 85, -140); sunSpr.scale.setScalar(70); root.add(sunSpr);
  for (const [cx, cy, cz, cs] of [[-80, 70, -120, 55], [40, 78, -150, 70], [120, 66, 60, 60], [-110, 74, 90, 65], [10, 82, 140, 55]]) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloud, transparent: true, fog: false, depthWrite: false, opacity: 0.9 }));
    cl.position.set(cx, cy, cz); cl.scale.set(cs, cs * 0.42, 1); root.add(cl);
  }
  const hemi = new THREE.HemisphereLight(0xffe6c0, 0x8a6b48, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0b3, 1.6);
  sun.position.set(35, 55, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 160; sun.shadow.bias = -0.0004;
  scene.add(sun);
  // warm fill from the other side
  const fill = new THREE.DirectionalLight(0xffc890, 0.35);
  fill.position.set(-30, 40, 30); scene.add(fill);

  /* ---------------- ground height ---------------- */
  function groundHeightAt(x, z) {
    const az = Math.abs(z);
    if (az >= 38 && x >= -15 && x <= 15) return 1.4;
    if (az > 30 && az < 38 && ((x >= 8 && x <= 14) || (x <= -8 && x >= -14)))
      return 1.4 * (az - 30) / 8;
    return 0;
  }

  /* ---------------- waypoints graph ---------------- */
  const nodes = [], adj = [];
  const STEP = 4.4;
  const blocked = (x, z, inflate) => {
    const g = groundHeightAt(x, z);
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate &&
          z > c.minZ - inflate && z < c.maxZ + inflate &&
          c.minY < g + 1.6 && c.maxY > g + 0.15) return true;
    }
    return false;
  };
  for (let gx = -22; gx <= 22; gx += STEP)
    for (let gz = -42; gz <= 42; gz += STEP)
      if (!blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });
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
      const dx = nodes[i].x - nodes[j].x, dz = nodes[i].z - nodes[j].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < STEP * STEP * 2.2 && segClear(nodes[i], nodes[j])) adj[i].push(j);
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
  const mk = s => [-9, -3, 3, 9].map(x => ({ x, z: 42 * s, yaw: s < 0 ? 0 : Math.PI }));
  const spawns = { P: mk(-1), B: mk(1) };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -25.5, maxX: 25.5, minZ: -45.5, maxZ: 45.5 },
  };
}
