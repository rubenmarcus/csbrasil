// fy_baleia — "Baleia da Faria Lima": a estátua gigante da baleia como cover
// central, prédios de vidro da Faria Lima, canteiro com palmeiras e ciclovia.
// 100% fictício e satírico.
import * as THREE from 'three';

function texOf(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}
function mkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
function noiseOver(x, w, h, alpha, colors) {
  for (let i = 0; i < w * h / 14; i++) {
    x.fillStyle = colors[(Math.random() * colors.length) | 0];
    x.globalAlpha = Math.random() * alpha;
    x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  x.globalAlpha = 1;
}

export function buildBaleia(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);
  const lam = o => new THREE.MeshLambertMaterial(o);

  const glassTex = texOf(mkCanvas(128, 256, x => {
    x.fillStyle = '#2e4258'; x.fillRect(0, 0, 128, 256);
    for (let r = 0; r < 256; r += 20) for (let c = 0; c < 128; c += 20) {
      x.fillStyle = Math.random() > 0.5 ? '#3a5068' : '#28394a';
      x.fillRect(c + 1, r + 1, 18, 18);
    }
  }), 2, 4);
  const signTex = texOf(mkCanvas(512, 80, x => {
    x.fillStyle = '#12202e'; x.fillRect(0, 0, 512, 80);
    x.fillStyle = '#7dd0ff'; x.font = 'bold 40px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText('BALEIA DA TRETA LIMA', 256, 54);
  }), 1, 1);

  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.rz) m.rotation.z = opts.rz;
    root.add(m);
    if (opts.collide !== false) {
      const ex = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : w / 2;
      const ez = (opts.ry || opts.rz) ? Math.max(w, d) / 2 : d / 2;
      colliders.push({ minX: x - ex, maxX: x + ex, minY: y, maxY: y + h, minZ: z - ez, maxZ: z + ez });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
    m.receiveShadow = true; root.add(m); return m;
  }

  /* ---------------- a avenida (Faria Lima) ---------------- */
  const concreteTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#8f8a84'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.2, ['#7f7a74', '#9f9a94']);
  }), 8, 8);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 200), lam({ map: concreteTex }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  addPlane(56, 180, lam({ map: T.asphalt }), 0, 0.03, 0, 0, -Math.PI / 2);
  // ciclovia verde da Faria Lima
  addPlane(2.4, 180, lam({ color: 0x2a8f4a }), 9, 0.04, 0, 0, -Math.PI / 2);
  // canteiro central com palmeiras (cover baixo)
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    addBox(3, 0.7, 1.1, lam({ color: 0x5a5a5a }), 0, 0, i * 22);
    addBox(2.6, 0.4, 0.7, lam({ map: T.grass }), 0, 0.7, i * 22, { collide: false });
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3.6, 7), lam({ color: 0x7a5c38 }));
    pl.position.set(0, 2.9, i * 22); root.add(pl);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 5), lam({ color: 0x3f6b2a }));
    crown.position.set(0, 4.8, i * 22); crown.scale.y = 0.5; root.add(crown);
  }

  /* ---------------- A BALEIA (estátua gigante no meio) ---------------- */
  {
    const baleiaMat = lam({ color: 0x6a8a9a });
    // corpo (elipsóide alongado)
    const body = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 10), baleiaMat);
    body.scale.set(1.5, 0.75, 0.65); body.position.set(0, 4.2, 0); body.castShadow = true;
    root.add(body); occluders.push(body);
    // cabeça
    const head = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 8), baleiaMat);
    head.position.set(-6.2, 3.6, 0); head.scale.set(1.1, 0.8, 0.85); root.add(head);
    // cauda pra cima
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.6, 4.5, 8), baleiaMat);
    tail.position.set(6.8, 6.2, 0); tail.rotation.z = -0.6; root.add(tail);
    const fluke = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 3.2), baleiaMat);
    fluke.position.set(8.3, 8.6, 0); fluke.rotation.z = -0.5; root.add(fluke);
    // barbatanas
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 2.6), baleiaMat);
      fin.position.set(-1.5, 2.2, s * 3.4); fin.rotation.x = s * 0.5; root.add(fin);
    }
    // base/pedestal
    addBox(10, 1.2, 6, lam({ color: 0x3a3a3a }), 0, 0, 0);
    colliders.push(
      { minX: -8.5, maxX: 5, minY: 0, maxY: 8, minZ: -3.5, maxZ: 3.5 },
      { minX: 5, maxX: 9, minY: 0, maxY: 9.5, minZ: -2, maxZ: 2 },
    );
    addPlane(8, 1.2, lam({ map: signTex }), 0, 1.8, -3.2, 0);
  }

  /* ---------------- prédios de vidro da Faria Lima ---------------- */
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const bz = -46 + i * 42, bh = 26 + (i % 2) * 10, bw = 16 + (i % 3) * 4;
      addBox(bw, bh, 14, lam({ map: glassTex }), s * 32, 0, bz);
    }
  }
  addBox(26, 34, 14, lam({ map: glassTex }), -8, 0, -72);
  addBox(22, 28, 14, lam({ map: glassTex }), 14, 0, 74);

  /* ---------------- cover urbano ---------------- */
  // mesas de café com guarda-sol (cover baixo)
  for (const [cx, cz, cor] of [[-14, -14, 0xe03232], [14, 14, 0xffd23f], [-14, 26, 0x2b4d8f], [14, -26, 0xe03232]]) {
    addBox(1.6, 0.1, 1.6, lam({ color: 0xd8d8d8 }), cx, 0.7, cz, { collide: false });
    addBox(0.12, 0.7, 0.12, lam({ color: 0x8a8a8a }), cx, 0, cz, { collide: false });
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.7, 8), lam({ color: cor }));
    umb.position.set(cx, 2.1, cz); umb.castShadow = true; root.add(umb);
    colliders.push({ minX: cx - .6, maxX: cx + .6, minY: 0, maxY: 2.2, minZ: cz - .6, maxZ: cz + .6 });
  }
  // pilares de sustentação dos prédios (cover alto)
  for (const s of [-1, 1]) for (const pz of [-34, 0, 34])
    addBox(1.2, 7, 1.2, lam({ color: 0x6a6a6a }), s * 22, 0, pz);

  /* ---------------- pickups ---------------- */
  function gunAt(kind, x, z, yaw = 0) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, kind === 'awp' ? 1.1 : 0.4), lam({ color: kind === 'awp' ? 0x2e4a2e : 0x333333 }));
    g.add(body);
    g.position.set(x, 0.07, z); g.rotation.set(0, yaw, Math.PI / 2 * 0.1);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    root.add(g);
    pickups.push({ x, z, weapon: kind, readyAt: 0, mesh: g });
  }
  gunAt('awp', -10, -8, 0.3); gunAt('ak', 10, 8, -0.3);
  gunAt('shotgun', -16, 18, 0.9); gunAt('deagle', 16, -18, 0.1);

  /* ---------------- luz de fim de tarde corporativo ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xc8ccd8, 55, 190);
  const hemi = new THREE.HemisphereLight(0xd8e8ff, 0x4a4a5a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd8b0, 1.4);
  sun.position.set(-30, 45, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
  sun.shadow.camera.far = 170; sun.shadow.bias = -0.0004;
  scene.add(sun);

  /* ---------------- alturas / waypoints / spawns ---------------- */
  function groundHeightAt() { return 0; }
  const nodes = [], adj = [];
  const STEP = 4.5;
  const blocked = (x, z, inflate) => {
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate &&
          z > c.minZ - inflate && z < c.maxZ + inflate &&
          c.minY < 1.6 && c.maxY > 0.15) return true;
    }
    return false;
  };
  for (let gx = -28; gx <= 28; gx += STEP)
    for (let gz = -68; gz <= 68; gz += STEP)
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

  const spawns = {
    P: [-8, -3, 3, 8].map(x => ({ x, z: -62, yaw: 0 })),
    B: [-8, -3, 3, 8].map(x => ({ x, z: 62, yaw: Math.PI })),
  };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -26, maxX: 26, minZ: -70, maxZ: 70 },
  };
}
