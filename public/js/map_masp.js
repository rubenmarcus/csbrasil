// fy_masp — "Museu da Treta": Av. Paulista com o MASP (laje vermelha sobre 4
// pilares, vão livre embaixo), prédios altos, canteiro central e ciclovia.
// 100% fictício e satírico.
import * as THREE from 'three';

function mkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
function texOf(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}
function noiseOver(x, w, h, alpha, colors) {
  for (let i = 0; i < w * h / 14; i++) {
    x.fillStyle = colors[(Math.random() * colors.length) | 0];
    x.globalAlpha = Math.random() * alpha;
    x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  x.globalAlpha = 1;
}

const MASP_RED = 0xa02525;

export function buildMasp(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);
  const lam = o => new THREE.MeshLambertMaterial(o);

  const glassTex = texOf(mkCanvas(128, 256, x => {
    x.fillStyle = '#3a4a5c'; x.fillRect(0, 0, 128, 256);
    for (let r = 0; r < 256; r += 16) for (let c = 0; c < 128; c += 16) {
      x.fillStyle = Math.random() > 0.5 ? '#46586b' : '#33424f';
      x.fillRect(c + 1, r + 1, 14, 14);
    }
  }), 2, 4);
  const concreteTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#9a948c'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.2, ['#8a847c', '#aaa49c']);
  }), 8, 8);
  const signMasp = texOf(mkCanvas(512, 96, x => {
    x.fillStyle = '#7d1717'; x.fillRect(0, 0, 512, 96);
    x.fillStyle = '#f2ead8'; x.font = 'bold 52px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText('MUSEU DA TRETA', 256, 66);
  }), 1, 1);
  const signBus = texOf(mkCanvas(256, 96, x => {
    x.fillStyle = '#1a4a8a'; x.fillRect(0, 0, 256, 96);
    x.fillStyle = '#fff'; x.font = 'bold 26px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText('PONTO DE ÔNIBUS', 128, 40);
    x.fillText('TRETA LIVRE 1', 128, 72);
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

  /* ---------------- a avenida ---------------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 220), lam({ map: concreteTex }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // asfalto da paulista (2 pistas + canteiro)
  addPlane(60, 200, lam({ map: T.asphalt }), 0, 0.03, 0, 0, -Math.PI / 2);
  // canteiro central com grama + palmeirinhas (cover baixo)
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    addBox(3.4, 0.7, 1.2, lam({ map: T.concreteDark }), 0, 0, i * 20);
    addBox(3.0, 0.4, 0.8, lam({ map: T.grass }), 0, 0.7, i * 20, { collide: false });
  }
  // ciclovia vermelha
  addPlane(2.2, 200, lam({ color: 0xb03030 }), -7.5, 0.04, 0, 0, -Math.PI / 2);

  /* ---------------- o MASP (laje vermelha no meio) ---------------- */
  {
    // 4 pilares
    for (const [px, pz] of [[-9, -2.5], [9, -2.5], [-9, 2.5], [9, 2.5]])
      addBox(1.8, 9, 1.8, lam({ color: MASP_RED }), px, 0, pz);
    // a laje (atravessa o mapa em x)
    addBox(44, 2.8, 11, lam({ color: MASP_RED }), 0, 9, 0);
    // vidro nas faces
    addBox(40, 2.2, 0.2, lam({ color: 0x2a3a4a }), 0, 9.3, -5.6, { collide: false });
    addBox(40, 2.2, 0.2, lam({ color: 0x2a3a4a }), 0, 9.3, 5.6, { collide: false });
    addPlane(12, 2.4, lam({ map: signMasp }), 0, 8.2, -6.2, 0);
    addPlane(12, 2.4, lam({ map: signMasp }), 0, 8.2, 6.2, Math.PI);
    // rampas laterais pro vão (subida visual)
    addBox(8, 0.4, 12, lam({ map: concreteTex }), -26, 0, 0, { collide: false });
    addBox(8, 0.4, 12, lam({ map: concreteTex }), 26, 0, 0, { collide: false });
  }

  /* ---------------- prédios (paredões com vidro) ---------------- */
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const bz = -60 + i * 40, bh = 22 + (i % 3) * 8, bw = 14 + (i % 2) * 6;
      addBox(bw, bh, 14, lam({ map: glassTex }), s * 34, 0, bz);
    }
  }
  // fundo: mais dois prédões fechando o mapa
  addBox(30, 26, 12, lam({ map: glassTex }), -10, 0, -75);
  addBox(24, 30, 12, lam({ map: glassTex }), 18, 0, 78);
  addBox(20, 20, 12, lam({ map: glassTex }), -18, 0, 72);

  /* ---------------- ponto de ônibus + bancos (cover) ---------------- */
  for (const s of [-1, 1]) {
    addBox(0.15, 2.8, 0.15, lam({ color: 0x8a8a8a }), s * 11.5, 0, s * 26, { collide: false });
    addBox(0.15, 2.8, 0.15, lam({ color: 0x8a8a8a }), s * 11.5, 0, s * 30, { collide: false });
    addBox(0.1, 0.5, 4.4, lam({ color: 0x2a6b8f, transparent: true, opacity: 0.5 }), s * 11.5, 2.8, s * 28, { collide: false });
    addPlane(2.2, 0.8, lam({ map: signBus }), s * 11.4, 2.4, s * 28, s < 0 ? -Math.PI / 2 : Math.PI / 2);
    addBox(3.6, 0.5, 0.7, lam({ color: 0x2a4a6a }), s * 11.5, 0, s * 28);
  }
  // bancas de revista (cover médio)
  for (const [kx, kz, kr] of [[-13, -10, 0.3], [13, 10, -0.3], [-13, 24, 0.1], [13, -24, -0.1]]) {
    addBox(2.6, 2.4, 2.2, lam({ color: 0x3a6b3a }), kx, 0, kz, { ry: kr });
    addBox(2.8, 0.2, 2.4, lam({ color: 0x2a4a2a }), kx, 2.4, kz, { ry: kr, collide: false });
  }
  // palmeiras
  for (const [px, pz] of [[-18, -34], [18, 34], [-18, 8], [18, -8]]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 5, 7), lam({ color: 0x7a5c38 }));
    trunk.position.set(px, 2.5, pz); trunk.castShadow = true; root.add(trunk); occluders.push(trunk);
    for (let a = 0; a < 5; a++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.2, 4), lam({ color: 0x3f6b2a }));
      leaf.position.set(px, 5.4, pz);
      leaf.rotation.set(Math.cos(a * 1.26) * 1.1, 0, Math.sin(a * 1.26) * 1.1 + Math.PI);
      root.add(leaf);
    }
    colliders.push({ minX: px - .3, maxX: px + .3, minY: 0, maxY: 5, minZ: pz - .3, maxZ: pz + .3 });
  }

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
  gunAt('awp', -8, -20, 0.4); gunAt('ak', 8, 20, -0.4);
  gunAt('m4', -16, 2, 0.8); gunAt('pistol', 16, -2, 0.2);

  /* ---------------- céu/luz de cidade ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xc8d0d8, 55, 200);
  const hemi = new THREE.HemisphereLight(0xf0e8d8, 0x6a6a5a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8c0, 1.4);
  sun.position.set(30, 55, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
  sun.shadow.camera.far = 180; sun.shadow.bias = -0.0004;
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
  for (let gx = -30; gx <= 30; gx += STEP)
    for (let gz = -70; gz <= 70; gz += STEP)
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
    P: [-8, -3, 3, 8].map(x => ({ x, z: -66, yaw: 0 })),
    B: [-8, -3, 3, 8].map(x => ({ x, z: 66, yaw: Math.PI })),
  };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -25.5, maxX: 25.5, minZ: -72.5, maxZ: 72.5 },
  };
}
