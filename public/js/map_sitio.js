// fy_sitio — "Sítio da Treta" (Atibaia): casa sede, lago com pedalinhos,
// área gourmet, pomar, porteira com placa. Sátira 100% fictícia.
import * as THREE from 'three';

function mkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
function noiseOver(x, w, h, alpha, colors) {
  for (let i = 0; i < w * h / 14; i++) {
    x.fillStyle = colors[(Math.random() * colors.length) | 0];
    x.globalAlpha = Math.random() * alpha;
    x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  x.globalAlpha = 1;
}
function signTex(lines, bg, fg) {
  return mkCanvas(256, 96, x => {
    x.fillStyle = bg; x.fillRect(0, 0, 256, 96);
    x.strokeStyle = fg; x.lineWidth = 5; x.strokeRect(4, 4, 248, 88);
    x.fillStyle = fg; x.textAlign = 'center';
    x.font = `bold ${lines.length > 1 ? 26 : 30}px Arial Black,sans-serif`;
    lines.forEach((l, i) => x.fillText(l, 128, lines.length > 1 ? 40 + i * 34 : 58));
  });
}

export function buildSitio(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);
  const lam = o => new THREE.MeshLambertMaterial(o);
  const texOf = (c, rx = 1, ry = 1) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
    return t;
  };

  /* ---------------- texturas locais ---------------- */
  const waterTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#2a6b7a'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.3, ['#35808f', '#1f5a68', '#4a98a5']);
  }), 6, 4);
  const woodTex = texOf(mkCanvas(128, 128, x => {
    x.fillStyle = '#7a5c38'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#6b4f2e' : '#87673f'; x.fillRect(i * 32, 0, 30, 128); }
    noiseOver(x, 128, 128, 0.2, ['#5c4426']);
  }), 2, 1);
  const roofTex = texOf(mkCanvas(128, 128, x => {
    x.fillStyle = '#a8503a'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#8f4030';
    for (let r = 0; r < 128; r += 16) for (let c = (r / 16 % 2) * 8; c < 128; c += 16) x.fillRect(c, r, 14, 14);
  }), 4, 3);
  const wallTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#e8ddc8'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.15, ['#d8ccb4', '#f2e9d8']);
    x.fillStyle = '#7a4a3a'; x.fillRect(0, 236, 256, 20);      // rodapé
  }), 2, 1);
  const signObra = texOf(signTex(['OBRA:', 'ZECA PAGODINHO LTDA'], '#5c2a2a', '#ffd23f'));
  const signSitio = texOf(signTex(['SÍTIO SANTA TRETA'], '#2a4a2a', '#f2ead8'));
  const signPedal = texOf(signTex(['PEDALINHO', 'NÃO É PROVA'], '#e03232', '#f2ead8'));

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

  /* ---------------- campo (grama + estrada de terra) ---------------- */
  const grassMat = lam({ map: T.grass });
  T.grass.repeat.set(18, 18);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 200), grassMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // estrada de terra da porteira até a casa
  for (const [dx, dz, w, l] of [[8, 30, 5, 42], [8, 6, 5, 12], [4, -16, 5, 34], [-6, -34, 18, 5]])
    addPlane(w, l, lam({ map: T.dirt }), dx, 0.04, dz, 0, -Math.PI / 2);

  /* ---------------- O LAGO (com pedalinhos) ---------------- */
  const LAKE = { minX: -15, maxX: 15, minZ: -9, maxZ: 9 };
  const bed = addPlane(30, 18, lam({ color: 0x1a3a42 }), 0, -0.55, 0, 0, -Math.PI / 2);
  bed.receiveShadow = true;
  const water = addPlane(30, 18, new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.82 }), 0, -0.06, 0, 0, -Math.PI / 2);
  water.userData.isWater = true;
  // margem de areia
  for (const [bx, bz, bw, bl] of [[0, -10, 34, 2], [0, 10, 34, 2], [-16.5, 0, 3, 22], [16.5, 0, 3, 22]])
    addPlane(bw, bl, lam({ map: T.dirt }), bx, 0.03, bz, 0, -Math.PI / 2);

  function pedalinho(x, z, ry, cor) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.8), lam({ color: 0xf0f0f0 }));
    hull.position.y = 0.05; g.add(hull);
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 3), lam({ color: 0xf0f0f0 }));
    nose.rotation.set(0, 0, Math.PI / 2); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.05, 1.4); g.add(nose);
    const seat1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.4), lam({ color: cor })); seat1.position.set(0, 0.34, 0.5); g.add(seat1);
    const seat2 = seat1.clone(); seat2.position.z = -0.6; g.add(seat2);
    for (const [px, pz] of [[-0.6, 0.9], [0.6, 0.9], [-0.6, -0.9], [0.6, -0.9]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), lam({ color: 0x888888 }));
      post.position.set(px, 0.9, pz); g.add(post);
    }
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 2.2), lam({ color: cor }));
    canopy.position.y = 1.45; canopy.castShadow = true; g.add(canopy);
    g.position.set(x, -0.25, z); g.rotation.y = ry;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    root.add(g);
    colliders.push({ minX: x - 1.2, maxX: x + 1.2, minY: -0.55, maxY: 1.9, minZ: z - 1.6, maxZ: z + 1.6 });
    occluders.push(canopy);
    return g;
  }
  const boat1 = pedalinho(-6, 1, 0.4, 0x2b4d8f);
  pedalinho(5, 4, -0.5, 0xe03232);
  pedalinho(8, -5, 1.1, 0xffd23f);

  /* ---------------- CASA SEDE (spawn P, norte) ---------------- */
  {
    const HX = -10, HZ = -38;
    addBox(16, 4.5, 9, lam({ map: wallTex }), HX, 0, HZ);
    // telhado duas águas
    addBox(17, 0.3, 5.4, lam({ map: roofTex }), HX, 4.5, HZ - 2.3, { rx: 0.42, collide: false });
    addBox(17, 0.3, 5.4, lam({ map: roofTex }), HX, 4.5, HZ + 2.3, { rx: -0.42, collide: false });
    // janelas/porta
    addPlane(1.4, 2.2, lam({ color: 0x3a2a1e }), HX + 2, 1.1, HZ + 4.53, 0);
    for (const wx of [-5, -1, 5]) addPlane(1.6, 1.2, lam({ color: 0x2a3a4a }), HX + wx, 1.6, HZ + 4.53, 0);
    // varanda (plataforma jogável) de frente pro lago
    addBox(18, 1.0, 4.5, lam({ map: woodTex }), HX, 0, HZ + 6.5, { collide: false });
    for (let i = 0; i < 6; i++) addBox(0.18, 2.6, 0.18, lam({ map: woodTex }), HX - 7.5 + i * 3, 1.0, HZ + 8.4, { collide: false });
    addBox(18, 0.15, 5, lam({ map: roofTex }), HX, 3.6, HZ + 6.5, { collide: false });
    // rampa lateral da varanda
    addBox(3, 0.2, 5, lam({ map: woodTex }), HX + 9.5, 0.4, HZ + 6.5, { collide: false, rz: -0.18 });
  }

  /* ---------------- ÁREA GOURMET (NE) ---------------- */
  {
    const GX = 16, GZ = -32;
    addBox(5, 1.1, 2, lam({ color: 0x8f4a3a }), GX, 0, GZ);                 // balcão tijolo
    addBox(1.2, 0.5, 1.2, lam({ color: 0x2a2a2a }), GX - 1, 1.1, GZ);      // churrasqueira
    for (const [px, pz] of [[-2.5, -1.5], [2.5, -1.5], [-2.5, 1.5], [2.5, 1.5]])
      addBox(0.16, 2.6, 0.16, lam({ map: woodTex }), GX + px, 0, GZ + pz, { collide: false });
    addBox(6, 0.15, 4, lam({ map: roofTex }), GX, 2.6, GZ, { collide: false });
    const s = addPlane(3.2, 1.2, lam({ map: signObra }), GX, 2.0, GZ + 2.05, 0);
    s.rotation.y = 0;
  }

  /* ---------------- PISCINA (perto da casa) ---------------- */
  {
    const PX = -22, PZ = -28;
    addPlane(7, 4.5, lam({ map: waterTex, transparent: true, opacity: 0.85 }), PX, -0.3, PZ, 0, -Math.PI / 2);
    addBox(8, 0.25, 5.5, lam({ map: T.concrete }), PX, 0, PZ, { collide: false });
    colliders.push({ minX: PX - 3.5, maxX: PX + 3.5, minY: -0.5, maxY: 0.2, minZ: PZ - 2.25, maxZ: PZ + 2.25 });
  }

  /* ---------------- POMAR (linhas de árvores como cover) ---------------- */
  for (const tx of [-20, 20])
    for (let i = 0; i < 5; i++) {
      const tz = -16 + i * 8 + (tx > 0 ? 2 : 0);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 7), lam({ color: 0x6b4f2c }));
      trunk.position.set(tx, 0.9, tz); trunk.castShadow = true; root.add(trunk); occluders.push(trunk);
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), lam({ color: 0x3f6b2a }));
      c1.position.set(tx, 2.6, tz); c1.castShadow = true; root.add(c1);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), lam({ color: 0x4a7d32 }));
      c2.position.set(tx + 0.7, 3.3, tz + 0.4); root.add(c2);
      colliders.push({ minX: tx - 0.35, maxX: tx + 0.35, minY: 0, maxY: 1.8, minZ: tz - 0.35, maxZ: tz + 0.35 });
    }

  /* ---------------- cercas de madeira (meio-campo, cover) ---------------- */
  for (const [fx, fz, len, ry] of [[-10, -14, 10, 0.2], [10, 14, 10, -0.2], [-12, 20, 8, 1.0], [12, -20, 8, 1.0]]) {
    addBox(len, 0.12, 0.08, lam({ map: woodTex }), fx, 0.85, fz, { ry });
    addBox(len, 0.12, 0.08, lam({ map: woodTex }), fx, 0.45, fz, { ry });
    for (let i = -1; i <= 1; i++)
      addBox(0.14, 1.0, 0.14, lam({ map: woodTex }), fx + Math.cos(ry) * (len / 2) * i, 0, fz - Math.sin(ry) * (len / 2) * i, { collide: false });
  }

  /* ---------------- mais obstáculos rurais ---------------- */
  // fardos de feno (cover cilíndrico)
  for (const [hx, hz, hr] of [[-8, 14, 0.2], [9, -13, -0.3], [-17, 3, 0.8], [14, 22, 0.1]]) {
    const hay = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.6, 12), lam({ color: 0xc9a24a }));
    hay.rotation.set(Math.PI / 2, 0, hr); hay.position.set(hx, 1.0, hz);
    hay.castShadow = hay.receiveShadow = true; root.add(hay); occluders.push(hay);
    colliders.push({ minX: hx - 1, maxX: hx + 1, minY: 0, maxY: 2, minZ: hz - 1, maxZ: hz + 1 });
  }
  // trator velho (cover grande)
  {
    const TX = 22, TZ = 34, TR = -0.4;
    addBox(2.2, 1.2, 3.2, lam({ color: 0x8f2a2a }), TX, 0.6, TZ, { ry: TR });           // corpo
    addBox(1.6, 1.4, 1.6, lam({ color: 0x8f2a2a }), TX - 0.2, 1.8, TZ + 0.5, { ry: TR }); // cabine
    addBox(1.8, 0.5, 2.2, lam({ color: 0x2a2a2a }), TX, 0, TZ - 0.3, { ry: TR, collide: false }); // chassis
    for (const [wx, wz, r] of [[-1.2, -1, 0.55], [1.2, -1, 0.55], [-1.2, 1.1, 0.75], [1.2, 1.1, 0.75]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 10), lam({ color: 0x1a1a1a }));
      wheel.rotation.z = Math.PI / 2; wheel.rotation.y = TR;
      wheel.position.set(TX + wx, r, TZ + wz); root.add(wheel);
    }
  }
  // poço de pedra (cover central no pasto)
  {
    const WX = -14, WZ = 26;
    const well = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 1.0, 10), lam({ map: T.concreteDark }));
    well.position.set(WX, 0.5, WZ); well.castShadow = true; root.add(well); occluders.push(well);
    colliders.push({ minX: WX - 1.2, maxX: WX + 1.2, minY: 0, maxY: 1.0, minZ: WZ - 1.2, maxZ: WZ + 1.2 });
    for (const px of [-1, 1]) addBox(0.12, 1.8, 0.12, lam({ map: woodTex }), WX + px, 0.5, WZ, { collide: false });
    addBox(2.8, 0.12, 2.2, lam({ map: roofTex }), WX, 2.3, WZ, { collide: false });
  }
  // bebedouro dos cavalos
  addBox(3.4, 0.6, 1.0, lam({ map: woodTex }), -4, 0, 34);
  addPlane(3.2, 0.7, lam({ map: waterTex, transparent: true, opacity: 0.85 }), -4, 0.62, 34, 0, -Math.PI / 2);
  // mais cercas (zig-zag de cover no pasto sul)
  for (const [fx, fz, len, ry] of [[-18, 38, 8, 0.6], [-6, 40, 7, -0.4], [18, 40, 8, 0.3]]) {
    addBox(len, 0.12, 0.08, lam({ map: woodTex }), fx, 0.85, fz, { ry });
    addBox(len, 0.12, 0.08, lam({ map: woodTex }), fx, 0.45, fz, { ry });
  }

  /* ---------------- PORTEIRA + placas (spawn B, sul) ---------------- */
  {
    const GX = 8, GZ = 46;
    addBox(0.5, 3.4, 0.5, lam({ map: T.concreteDark }), GX - 4, 0, GZ);
    addBox(0.5, 3.4, 0.5, lam({ map: T.concreteDark }), GX + 4, 0, GZ);
    const arch = addPlane(7, 1.4, lam({ map: signSitio }), GX, 3.2, GZ - 0.2, Math.PI);   // face sul (portaria)
    addPlane(7, 1.4, lam({ map: signSitio }), GX, 3.2, GZ + 0.2, 0);                      // face norte (lago)
    addBox(2.2, 1.8, 0.3, lam({ map: wallTex }), GX - 7.5, 0, GZ);
    addPlane(2.4, 0.9, lam({ map: signPedal }), GX - 7.5, 1.0, GZ - 0.16, Math.PI);
  }

  /* ---------------- pickups estilo fy_ ---------------- */
  function gunAt(kind, x, z, yaw = 0, y = 0.02) {
    let mesh;
    if (kind === 'awp') {
      mesh = (function () {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 1.1), lam({ color: 0x2e4a2e })); g.add(body);
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 8), lam({ color: 0x1a1a1a }));
        sc.rotation.x = Math.PI / 2; sc.position.set(0, 0.08, 0.1); g.add(sc);
        return g;
      })();
    } else {
      mesh = new THREE.Group();
      mesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.28), lam({ color: 0x333333 })));
    }
    mesh.position.set(x, y + 0.05, z); mesh.rotation.set(0, yaw, Math.PI / 2 * 0.1);
    mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
    root.add(mesh);
    pickups.push({ x, z, weapon: kind, readyAt: 0, mesh });
  }
  gunAt('awp', -6, 1, 0.4, 0.6);            // em cima do pedalinho azul (meme)
  gunAt('awp', 16, -29, 1.2);
  gunAt('pistol', 8, 43, 0);
  gunAt('pistol', -19, -25, 0.5);
  gunAt('awp', 0, -16, 0.8);
  gunAt('pistol', -20, 8, 0.2);

  /* ---------------- luz do interior de SP ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xd8e8c8, 60, 200);
  const hemi = new THREE.HemisphereLight(0xfff0d8, 0x5a7a3a, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8c0, 1.5);
  sun.position.set(-30, 50, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -55; sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
  sun.shadow.camera.far = 160; sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc8e8a8, 0.3);
  fill.position.set(25, 30, -30); scene.add(fill);

  /* ---------------- altura do chão / água ---------------- */
  function groundHeightAt(x, z) {
    if (x >= LAKE.minX && x <= LAKE.maxX && z >= LAKE.minZ && z <= LAKE.maxZ) return -0.55;
    if (x >= -19 && x <= -1 && z >= -34.5 && z <= -29.5) return 1.0;      // varanda
    if (x >= -2.5 && x <= -0.5 && z >= -34.5 && z <= -29.5) return 0.5;   // rampa varanda (aprox)
    return 0;
  }
  function slowAt(x, z) {
    return x >= LAKE.minX && x <= LAKE.maxX && z >= LAKE.minZ && z <= LAKE.maxZ;
  }

  /* ---------------- waypoints ---------------- */
  const nodes = [], adj = [];
  const STEP = 4.5;
  const blocked = (x, z, inflate) => {
    const g = groundHeightAt(x, z);
    for (const c of colliders) {
      if (x > c.minX - inflate && x < c.maxX + inflate &&
          z > c.minZ - inflate && z < c.maxZ + inflate &&
          c.minY < g + 1.6 && c.maxY > g + 0.15) return true;
    }
    return false;
  };
  for (let gx = -30; gx <= 30; gx += STEP)
    for (let gz = -52; gz <= 52; gz += STEP)
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
  const spawns = {
    P: [-14, -10, -6, -2].map(x => ({ x, z: -33, yaw: 0 })),
    B: [4, 7, 10, 13].map(x => ({ x, z: 43, yaw: Math.PI })),
  };

  return {
    root, colliders, occluders, groundHeightAt, slowAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -32, maxX: 32, minZ: -54, maxZ: 54 },
  };
}
