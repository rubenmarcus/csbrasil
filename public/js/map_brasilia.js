// "Praça dos Três Poderes" — Brasília arena built from Mint-generated building
// models (Congresso, Catedral, Ministério, Palácio) composed with a hand-authored
// competitive layout. Gameplay scaffolding (ground, esplanade, spawns, waypoints,
// cover, colliders) is procedural; the landmarks are real GLB models placed and
// collidered from their actual bounds. Same contract as buildWorld().
import * as THREE from 'three';
import { placeProp } from './mapprops.js';

export function buildBrasilia(scene, T) {
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
    root.add(m);
    if (opts.collide !== false) {
      const pad = opts.pad || 0;
      const ex = opts.ry ? Math.max(w, d) / 2 : w / 2, ez = opts.ry ? Math.max(w, d) / 2 : d / 2;
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

  // Place a Mint building GLB, normalized to targetH metres, and derive a footprint
  // collider from its real placed bounds. Returns the object (or null if not loaded).
  function putBuilding(id, { x, z, targetH, ry = 0, solid = true }) {
    const o = placeProp(id, { x, z, targetH, ry });
    if (!o) return null;
    root.add(o); occluders.push(o);
    o.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(o);
    if (solid) col(bb.min.x, bb.max.x, 0, Math.max(1, bb.max.y), bb.min.z, bb.max.z);
    return o;
  }

  /* ---------------- ground + esplanade ---------------- */
  // Tile the textures (clone + RepeatWrapping) so big surfaces show real detail
  // instead of one blurry stretched image.
  const tiled = (tex, rx, ry) => {
    const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t;
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 360), lam({ map: tiled(T.grass, 46, 55) }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // Esplanada dos Ministérios — pale stone paving (tiled so the slab grid reads)
  addPlane(30, 116, lam({ map: tiled(T.concrete, 10, 40) }), 0, 0.03, 0, 0, -Math.PI / 2);
  for (const sx of [-1, 1]) addPlane(7, 116, lam({ map: tiled(T.concreteDark, 3, 40) }), sx * 20, 0.02, 0, 0, -Math.PI / 2);

  /* ---------------- LANDMARKS (Mint building models) ---------------- */
  // Congresso Nacional at the NORTH end (towers + Senate dome + Chamber bowl).
  // ry = π: towers BEHIND the tray, Senate dome (convex) left, Chamber bowl right —
  // the postcard view from the esplanade (verified in mapeval).
  putBuilding('congresso', { x: 0, z: 62, targetH: 22, ry: Math.PI });
  // Catedral (crown) at the SOUTH end + stained glass BETWEEN the ribs (the Mint model
  // has no glass). The glass profile is fitted 0.3–0.5m INSIDE the measured rib envelope
  // (ribs run r≈10.3 @ base → r≈3.4 @ rim y≈9.5, see tools: measure-catedral) so the
  // white ribs stay visible outside the glass, like the real Niemeyer crown.
  putBuilding('catedral', { x: 0, z: -60, targetH: 13, ry: 0 });
  {
    const profile = [[9.6, 0.3], [9.35, 1], [8.35, 2], [7.3, 3], [6.3, 4], [4.6, 5],
      [4.1, 6], [3.5, 7], [3.35, 8], [3.2, 9.2]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const glassGeo = new THREE.LatheGeometry(profile, 28);
    const glassMat = new THREE.MeshLambertMaterial({
      color: 0x2e6f9e, emissive: 0x0a2440, transparent: true, opacity: 0.55,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0, -60); root.add(glass);
  }
  // Palácio do Planalto (east) + STF (west) framing the Praça, facing inward. A stone
  // plinth sized from each building's REAL placed footprint grounds the pilotis (the
  // old fixed 16×15 plinth was smaller than the roof overhang → building read floating).
  for (const px of [22, -22]) {
    const b = putBuilding('palacio', { x: px, z: 30, targetH: 6, ry: px > 0 ? -Math.PI / 2 : Math.PI / 2 });
    if (b) {
      const bb = new THREE.Box3().setFromObject(b);
      const pw = (bb.max.x - bb.min.x) + 1.2, pd = (bb.max.z - bb.min.z) + 1.2;
      addBox(pw, 0.4, pd, lam({ color: 0xcfd2cb }), (bb.min.x + bb.max.x) / 2, 0, (bb.min.z + bb.max.z) / 2, { collide: false });
    }
  }
  // Ministérios lining the esplanade (reuse the one slab, long axis along Z = lane walls).
  const ministries = [];
  for (const sx of [-1, 1]) for (const mz of [-26, 0, 26])
    ministries.push(putBuilding('ministerio', { x: sx * 23, z: mz, targetH: 7, ry: Math.PI / 2 }));

  /* ---------------- statues ---------------- */
  { // A Justiça — Mint GLB v2 (blindfolded, sword across the lap, Brazil flag draped as a
    // sash — matches the real reference). The flag is baked into the mesh now; we only add
    // the small "PERDEU, MANÉ" graffiti on the chest (Mint can't render reliable text).
    const sx = -11, sz = 22;   // out in the open facing the lane (+X)
    const o = placeProp('justica', { x: sx, z: sz, targetH: 3.6, ry: Math.PI / 2 });
    if (o) {
      root.add(o); occluders.push(o); col(sx - 1, sx + 1, 0, 3.6, sz - 1, sz + 1);
      // small "PERDEU MANÉ" graffiti decal on the chest (statue front faces +X, chest
      // surface measured by raycast at x≈-11.1), clear of the sash
      addPlane(0.6, 0.4, lam({ map: T.perdeuMane, transparent: true, side: THREE.DoubleSide }),
        sx - 0.04, 2.35, sz + 0.05, Math.PI / 2);
    }
  }
  { // Os Guerreiros — procedural bronze monument (Mint mesher failed on it twice)
    const bx = 6, bz = 40;
    const bronze = lam({ color: 0x6f5f42 });
    const g = new THREE.Group(); g.position.set(bx, 0, bz); root.add(g); occluders.push(g);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.7), lam({ color: 0x8f9391 }));
    ped.position.y = 0.25; ped.receiveShadow = true; g.add(ped);
    for (const dx of [-0.55, 0.55]) {
      const sgn = dx > 0 ? 1 : -1;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.5, 4.7, 6), bronze);
      body.position.set(dx, 2.85, 0); body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bronze);
      head.position.set(dx, 5.25, 0); head.castShadow = true; g.add(head);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.2, 5), bronze);
      arm.position.set(dx + sgn * 0.5, 4.7, 0); arm.rotation.z = -sgn * 0.9; g.add(arm);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 4), bronze);
      pole.position.set(dx + sgn * 1.05, 5.6, 0); pole.rotation.z = -sgn * 0.18; pole.castShadow = true; g.add(pole);
    }
    col(bx - 1.5, bx + 1.5, 0, 5.6, bz - 1, bz + 1);
  }

  /* ---------------- praça furniture ---------------- */
  // Mastro da bandeira (flagpole + stylised flag)
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 32, 8), lam({ color: 0x9aa0a6 }));
    pole.position.set(-11, 16, 44); pole.castShadow = true; root.add(pole);
    col(-11.3, -10.7, 0, 32, 43.7, 44.3);
    // real Brazil flag texture (mastro da Praça dos Três Poderes proportions ~3:2)
    addPlane(6, 4, lam({ map: T.flagBR, side: THREE.DoubleSide }), -8, 29, 44);
  }
  // Jardim com espelho d'água em frente ao Congresso (garden + reflecting pool)
  {
    addPlane(30, 9, lam({ color: 0x2f6ea0, transparent: true, opacity: 0.9 }), 0, 0.06, 50, 0, -Math.PI / 2);
    for (const rz of [45.2, 54.8]) addBox(31, 0.35, 0.7, lam({ color: 0xcfd2cb }), 0, 0, rz, { collide: false });
    for (const rx of [-15.2, 15.2]) addBox(0.7, 0.35, 10, lam({ color: 0xcfd2cb }), rx, 0, 50, { collide: false });
    for (const gx of [-22, 22]) addPlane(10, 12, lam({ map: tiled(T.grass, 3, 4) }), gx, 0.04, 50, 0, -Math.PI / 2);
  }

  /* ---------------- protest posters / banners on the ministry facades ---------------- */
  {
    const imgs = T.posterImgs || [], aspects = T.posterAspects || [];
    const laneOrder = [1, 4, 0, 3, 2, 5];   // priority posters land on the most-visible lane faces first
    const putPoster = (b, side, idx) => {
      if (!b || !imgs.length) return;
      const bb = new THREE.Box3().setFromObject(b);
      const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
      const lane = cx > 0 ? -1 : 1;
      const inner = side === 'lane';
      const edge = lane > 0 ? (inner ? bb.max.x : bb.min.x) : (inner ? bb.min.x : bb.max.x);
      const fx = edge + (lane > 0 ? (inner ? 0.06 : -0.06) : (inner ? -0.06 : 0.06));
      const ti = idx % imgs.length;
      const H = inner ? 4.6 : 5.4, A = aspects[ti] || 0.7;
      const fy = Math.min(bb.max.y - H / 2 - 0.5, 3.4);
      addPlane(H * A, H, lam({ map: imgs[ti], side: THREE.DoubleSide }), fx, fy, cz, lane > 0 ? Math.PI / 2 : -Math.PI / 2);
    };
    // lane faces: the priority posters (DOLLYNHO, ET, CHUPACABRA, SACI, +2)
    ministries.forEach((b, i) => putPoster(b, 'lane', laneOrder[i] ?? i));
    // outer sides ("laterais dos prédios"): the rest of the collection
    ministries.forEach((b, i) => putPoster(b, 'outer', 6 + i));
  }

  /* ---------------- gameplay cover: props do 8 de janeiro ---------------- */
  // Tire-pile barricades (Mint) as the main lane cover — the protest look.
  for (const [tx, tz, ry] of [[-6, -14, 0.3], [7, 12, -0.4], [-8, 26, 0.8], [9, -26, 0.2],
    [10, 3, 0], [-10, -3, 1.1], [4, 34, 0.5], [-4, -34, -0.3]])
    putBuilding('tires', { x: tx, z: tz, targetH: 1.6, ry });
  // Barraquinhas de camelô (vendor stalls)
  putBuilding('stall', { x: -13, z: -8, targetH: 2.7, ry: Math.PI / 2 });
  putBuilding('stall', { x: 13, z: 8, targetH: 2.7, ry: -Math.PI / 2 });
  // Mini-acampamento de barracas (protest camp) junto aos ministérios oeste
  for (const [tx, tz, ry] of [[-15, -30, 0.2], [-17, -35, 1.1], [-13, -36, -0.5], [16, 33, 0.6]])
    putBuilding('tent', { x: tx, z: tz, targetH: 1.7, ry });
  // a few Correios/SEDEX parcels still around for variety (Brazilian postal boxes)
  const crateMats = [lam({ map: T.crate }), lam({ map: T.crate2 || T.crate })];
  for (const [i, [cx, cz, lv]] of [[11, 2, 0], [-11, 0, 0], [11, 3.6, 1], [-5, 18, 0]].entries())
    addBox(1.6, 1.6, 1.6, crateMats[i % 2], cx, lv * 1.6, cz, { ry: (cx * 7 % 10) / 22, pad: -0.05 });

  /* ---------------- ônibus quebrado do DF (Mint GLB — cover grande mid-lane) ---------------- */
  // "Amarelinho" gerado no Mint, atravessado na esplanada (quebrado, encostado).
  putBuilding('bus', { x: 8.5, z: -12, targetH: 3.1, ry: 0.42 });

  /* ---------------- barraquinha de bebida (Mint GLB — mini-bar c/ guarda-sol) -------------- */
  // Drink stand com cadeiras de plástico e guarda-sol grande, junto às barraquinhas.
  putBuilding('drinkstand', { x: -14, z: -17, targetH: 3.2, ry: 0.5 });

  /* ---------------- barricada improvisada (bloco + chapa + tábuas) ---------------- */
  { // protest barricade near the west tents: concrete block, corrugated sheet, planks.
    const bx = -8, bz = 20, bry = -0.3;
    const g = new THREE.Group(); g.position.set(bx, 0, bz); g.rotation.y = bry; root.add(g); occluders.push(g);
    const conc = lam({ color: 0xb8bab2 }), rust = lam({ color: 0x8a5a3a }), wood = lam({ color: 0x9a7b4f });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.8), conc); base.position.y = 0.35; g.add(base);
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.08), rust);
    sheet.position.set(0.2, 1.15, 0.1); sheet.rotation.x = -0.12; g.add(sheet);
    for (const [py, pr] of [[0.95, 0.18], [1.25, -0.14]]) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 0.06), wood);
      plank.position.set(0, py, 0.28); plank.rotation.z = pr; g.add(plank);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const c = Math.abs(Math.cos(bry)), s = Math.abs(Math.sin(bry));
    const ex = 1.7 * c + 0.45 * s, ez = 1.7 * s + 0.45 * c;
    col(bx - ex, bx + ex, 0, 1.6, bz - ez, bz + ez);
  }

  // concrete planters with greenery
  for (const [px, pz] of [[-9, 8], [9, -8], [0, -20], [0, 16]]) {
    addBox(3.4, 0.9, 1.3, lam({ color: 0xd9dbd4 }), px, 0, pz);
    addBox(3, 0.5, 0.9, lam({ map: T.grass }), px, 0.9, pz, { collide: false });
  }

  /* ---------------- lighting & sky ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xbfd8ee, 100, 260);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunSprite, transparent: true, fog: false, depthWrite: false }));
  sunSpr.position.set(120, 95, -150); sunSpr.scale.setScalar(70); root.add(sunSpr);
  for (const [cx, cy, cz, cs] of [[-90, 80, -130, 60], [50, 88, -160, 74], [130, 72, 70, 64], [-120, 82, 100, 68]]) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloud, transparent: true, fog: false, depthWrite: false, opacity: 0.9 }));
    cl.position.set(cx, cy, cz); cl.scale.set(cs, cs * 0.42, 1); root.add(cl);
  }
  const hemi = new THREE.HemisphereLight(0xeaf3ff, 0x9c8f6f, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
  sun.position.set(40, 65, -10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
  sun.shadow.camera.far = 220; sun.shadow.bias = -0.0004;
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
  const mk = s => [-9, -3, 3, 9].map(x => ({ x, z: 43 * s, yaw: s < 0 ? Math.PI : 0 }));
  // Bolsonaristas start at the Cathedral (south) end, Petistas at the Congresso (north)
  // end — swapped per request.
  const spawns = { B: mk(-1), P: mk(1) };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -25.5, maxX: 25.5, minZ: -60, maxZ: 60 },
  };
}
