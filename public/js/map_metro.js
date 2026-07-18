// fy_metro — "Estação Treta": trincheira central com trilhos, trem Linha Azul
// que vai e volta (para, abre portas, transporta), mezanino com escadas
// rolantes cruzando os lados. Identidade Metrô de SP, 100% fictício.
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

const BLUE = 0x0f5fb7, YELLOW = 0xf5c400, STEEL = 0xb8bcbe;

export function buildMetro(scene, T) {
  const colliders = [];
  const occluders = [];
  const movers = [];          // AABBs do trem (atualizados no tick)
  const root = new THREE.Group();
  scene.add(root);
  const lam = o => new THREE.MeshLambertMaterial(o);

  /* ---------------- texturas ---------------- */
  const tileTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#dcd8d0'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#b8b4ac'; x.lineWidth = 1;
    for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
    x.fillStyle = '#0f5fb7'; x.fillRect(0, 96, 256, 40);   // faixa Linha Azul
    noiseOver(x, 256, 256, 0.08, ['#c8c4bc']);
  }), 6, 2);
  const floorTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#8a8680'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.2, ['#7a7670', '#9a9690']);
  }), 8, 8);
  const tactileTex = texOf(mkCanvas(128, 128, x => {
    x.fillStyle = '#e8b400'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#c89800';
    for (let a = 0; a < 128; a += 16) for (let b = 0; b < 128; b += 16) { x.beginPath(); x.arc(a + 8, b + 8, 4, 0, 7); x.fill(); }
  }), 1, 12);
  const signStation = texOf(mkCanvas(512, 96, x => {
    x.fillStyle = '#0f5fb7'; x.fillRect(0, 0, 512, 96);
    x.fillStyle = '#fff'; x.font = 'bold 44px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText('ESTAÇÃO TRETA', 256, 62);
  }), 1, 1);
  const signExit = texOf(mkCanvas(256, 64, x => {
    x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, 256, 64);
    x.fillStyle = '#ffd23f'; x.font = 'bold 30px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText('SAÍDA →', 128, 42);
  }), 1, 1);
  const signYellow = texOf(mkCanvas(512, 48, x => {
    x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, 512, 48);
    x.fillStyle = '#e8b400'; x.font = 'bold 22px Arial,sans-serif'; x.textAlign = 'center';
    x.fillText('NÃO ULTRAPASSE A FAIXA AMARELA', 256, 32);
  }), 1, 1);
  const signDest = texOf(mkCanvas(256, 64, x => {
    x.fillStyle = '#111'; x.fillRect(0, 0, 256, 64);
    x.fillStyle = '#ffb400'; x.font = 'bold 34px monospace'; x.textAlign = 'center';
    x.fillText('TRETA', 128, 44);
  }), 1, 1);
  const adTex = (lines, bg, fg) => texOf(mkCanvas(256, 128, x => {
    x.fillStyle = bg; x.fillRect(0, 0, 256, 128);
    x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(4, 4, 248, 120);
    x.fillStyle = fg; x.textAlign = 'center';
    x.font = 'bold 26px Arial Black,sans-serif';
    lines.forEach((l, i) => x.fillText(l, 128, 48 + i * 34));
  }), 1, 1);
  const ads = [
    adTex(['TretaTok', 'a rede da treta™'], '#1b2a4a', '#ffd23f'),
    adTex(['PASTEL DO ZÉ', 'o oficial da linha'], '#8f1d1d', '#ffe9c4'),
    adTex(['CURSO QUÂNTICO', 'manifeste headshots'], '#3b1b4a', '#ff7ad9'),
  ];

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

  /* ---------------- caixa da estação ---------------- */
  const LEN = 96;   // z -48..48
  // piso das plataformas laterais + pontas
  for (const s of [-1, 1]) {
    addBox(18, 0.22, LEN, lam({ map: floorTex }), s * 17, 0.9, 0, { collide: false });
    // piso tátil amarelo na borda
    addBox(1.1, 0.02, LEN, lam({ map: tactileTex }), s * 8.6, 1.13, 0, { collide: false });
    // piso das pontas (spawns)
    addBox(52, 0.22, 14, lam({ map: floorTex }), 0, 0.9, s * 41, { collide: false });
    addBox(1.1, 0.02, 52, lam({ map: tactileTex }), 0, 1.13, s * 34.4, { collide: false });
  }
  // trincheira dos trilhos
  addBox(16, 0.2, LEN, lam({ color: 0x3a3a3a }), 0, -1.0, 0, { collide: false });
  // paredes laterais com azulejo + faixa azul
  for (const s of [-1, 1]) {
    addBox(0.6, 6.5, LEN, lam({ map: tileTex }), s * 26.3, 0, 0);
    addBox(52.6, 6.5, 0.6, lam({ map: tileTex }), 0, 0, s * (LEN / 2 + 0.3));
  }
  // teto com vigas
  addBox(53, 0.4, LEN, lam({ color: 0x4a4a48 }), 0, 6.4, 0, { collide: false });
  for (let i = -5; i <= 5; i++) addBox(53, 0.5, 0.7, lam({ color: 0x3a3a38 }), 0, 6.1, i * 8, { collide: false });
  // luminárias fluorescentes
  for (let i = -5; i <= 5; i++) for (const fx of [-10, 0, 10])
    addBox(4, 0.1, 0.6, new THREE.MeshBasicMaterial({ color: 0xf0f4ff }), fx, 5.85, i * 8, { collide: false });

  /* ---------------- trilhos ---------------- */
  for (const rx of [-1.6, 1.6]) {
    addBox(0.18, 0.12, LEN, lam({ color: 0x8a8a8a }), rx, -0.8, 0, { collide: false });
    addBox(0.18, 0.12, LEN, lam({ color: 0x8a8a8a }), rx + 1.4, -0.8, 0, { collide: false });
  }
  for (let i = -22; i <= 22; i++) addBox(5.4, 0.06, 0.5, lam({ color: 0x5c4a32 }), 0, -0.84, i * 2.2, { collide: false });

  /* ---------------- colunas amarelas Metrô ---------------- */
  for (const s of [-1, 1]) for (const cz of [-28, -10, 10, 28])
    addBox(0.9, 5.4, 0.9, lam({ color: 0xd8a800 }), s * 13, 1.1, cz);

  /* ---------------- bancos, ads e placas ---------------- */
  for (const s of [-1, 1]) for (const bz of [-18, 0, 18]) {
    addBox(3.4, 0.5, 0.8, lam({ color: 0x2a4a6a }), s * 22, 1.1, bz);
    addBox(0.2, 0.5, 0.7, lam({ color: 0x1a1a1a }), s * 22 - 1.5, 1.1, bz, { collide: false });
    addBox(0.2, 0.5, 0.7, lam({ color: 0x1a1a1a }), s * 22 + 1.5, 1.1, bz, { collide: false });
  }
  for (const s of [-1, 1]) {
    addPlane(10, 2, lam({ map: signStation }), s * 25.9, 4.2, 0, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    addPlane(4.5, 1.1, lam({ map: signExit }), s * 25.9, 3.4, s * 40, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    addPlane(9, 0.85, lam({ map: signYellow }), s * 8.2, 2.6, s * 20, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    addPlane(3.4, 1.7, lam({ map: ads[(s + 1) / 2] }), s * 25.9, 3.4, s * 14, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    addPlane(3.4, 1.7, lam({ map: ads[2] }), s * 25.9, 3.4, s * 30, s < 0 ? Math.PI / 2 : -Math.PI / 2);
  }

  /* ---------------- mezanino + escadas rolantes ---------------- */
  const MEZ = 3.4, PLAT = 1.1, BED = -0.8;
  addBox(24, 0.3, 6.4, lam({ map: floorTex }), 0, MEZ - 0.15, 0, { collide: false });
  // guarda-corpos do mezanino
  addBox(24, 1.0, 0.15, lam({ color: 0x8a8a8a }), 0, MEZ, -3.1, { collide: false });
  addBox(24, 1.0, 0.15, lam({ color: 0x8a8a8a }), 0, MEZ, 3.1, { collide: false });
  // escadas rolantes (visuais) nas duas pontas do mezanino
  for (const s of [-1, 1]) {
    const ramp = addBox(4.6, 0.22, 7.4, lam({ color: 0x6a6a6a }), s * 14, 2.1, 0, { collide: false });
    ramp.rotation.z = s * 0.42;
    for (let i = 0; i < 6; i++)
      addBox(4.4, 0.1, 0.9, lam({ color: 0x8a8a8a }), s * (11.2 + i * 0.95), 1.35 + i * 0.38, 0, { collide: false });
    // corrimão
    addBox(4.8, 0.9, 0.1, lam({ color: 0x1a1a1a }), s * 14, 2.7, -3.4, { collide: false, rz: s * 0.42 });
    addBox(4.8, 0.9, 0.1, lam({ color: 0x1a1a1a }), s * 14, 2.7, 3.4, { collide: false, rz: s * 0.42 });
  }

  /* ---------------- alturas ---------------- */
  function groundHeightAt(x, z) {
    const ax = Math.abs(x);
    if (z >= -3.2 && z <= 3.2 && ax <= 12) return MEZ;                 // mezanino
    if (z >= -3.2 && z <= 3.2 && ax > 12 && ax <= 16)                  // escadas (rampas)
      return MEZ - (MEZ - PLAT) * ((ax - 12) / 4);
    if (ax >= 8) return PLAT;                                          // plataformas laterais
    return BED;                                                        // trincheira
  }

  /* ---------------- o TREM (Linha Azul) ---------------- */
  const train = {
    state: 'away', t: 0, z: -70, speed: 0,
    STOP_Z: 0, DOOR_TIME: 7, AWAY_TIME: 13, V: 9,
    cars: [],
  };
  function buildCar(idx) {
    const g = new THREE.Group();
    // corpo inox
    addBoxGroup(g, 3.4, 2.6, 10.6, lam({ color: STEEL }), 0, -0.5, 0);
    // faixa azul
    addBoxGroup(g, 3.5, 0.6, 10.7, lam({ color: BLUE }), 0, 0.6, 0);
    // janelas
    addBoxGroup(g, 3.5, 0.7, 9.6, lam({ color: 0x1a2a3a }), 0, 1.0, 0);
    // portas amarelas (2 por lado por carro)
    g.userData.doors = [];
    for (const side of [-1, 1]) for (const dz of [-2.6, 2.6]) {
      const dL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.8), lam({ color: YELLOW }));
      dL.position.set(side * 1.72, 0.05, dz - 0.4); g.add(dL);
      const dR = dL.clone(); dR.position.z = dz + 0.4; g.add(dR);
      g.userData.doors.push({ dL, dR, dz, side });
    }
    // bancos internos + postes
    for (const side of [-1, 1]) addBoxGroup(g, 0.5, 0.45, 8.4, lam({ color: 0x2a4a6a }), side * 1.1, -0.55, 0);
    for (const pz of [-3.5, 0, 3.5]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), lam({ color: 0xd8d8d8 }));
      pole.position.set(0, 0.3, pz); g.add(pole);
    }
    g.userData.idx = idx;
    root.add(g);
    train.cars.push(g);
    return g;
  }
  function addBoxGroup(g, w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m;
  }
  buildCar(0); buildCar(1);
  // cabine dianteira
  const cab = new THREE.Group();
  addBoxGroup(cab, 3.4, 2.2, 1.6, lam({ color: 0x8a9094 }), 0, -0.4, 0);
  addBoxGroup(cab, 3.0, 0.8, 0.1, lam({ color: 0x1a2a3a }), 0, 0.75, 0.83);
  addPlaneGroup(cab, 2.6, 0.7, lam({ map: signDest }), 0, 1.5, 0.86);
  root.add(cab);
  function addPlaneGroup(g, w, h, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); g.add(m); return m;
  }

  // colisores estáticos da cabine? não — tudo do trem vai por movers.
  function trainAABBs() {
    const out = [];
    const z0 = train.z, z1 = train.z - 21.5;
    out.push({ minX: -2, maxX: 2, minY: BED, maxY: 2.4, minZ: z1 - 1.5, maxZ: z0 + 1.5, dz: train.speed * (1 / 60), lethal: Math.abs(train.speed) > 1.2, state: train.state });
    return out;
  }

  /* ---------------- luz de estação ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0x2a2d33, 40, 160);
  const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x3a3a3a, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xf0f4ff, 0.9);
  sun.position.set(10, 40, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
  sun.shadow.camera.far = 120; sun.shadow.bias = -0.0004;
  scene.add(sun);

  /* ---------------- waypoints (sem trincheira; cruzam pelo mezanino) ---------------- */
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
  for (let gx = -24; gx <= 24; gx += STEP)
    for (let gz = -46; gz <= 46; gz += STEP) {
      const g = groundHeightAt(gx, gz);
      if (g > BED + 0.2 && !blocked(gx, gz, 0.5)) nodes.push({ x: gx, z: gz });   // nada na trincheira
    }
  const segClear = (a, b) => {
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (blocked(x, z, 0.25)) return false;
      const ga = groundHeightAt(a.x, a.z), gb = groundHeightAt(x, z);
      if (Math.abs(gb - ga) > 0.65) return false;
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

  /* ---------------- spawns (plataformas das pontas) ---------------- */
  const mk = s => [-10, -4, 4, 10].map(x => ({ x, z: 42 * s, yaw: s < 0 ? 0 : Math.PI }));
  const spawns = { P: mk(-1), B: mk(1) };

  /* ---------------- tick do trem ---------------- */
  function tick(game, dt) {
    train.t += dt;
    switch (train.state) {
      case 'away':
        if (train.t >= train.AWAY_TIME) { train.state = 'approach'; train.t = 0; train.speed = train.V; }
        break;
      case 'approach': {
        const target = train.STOP_Z + 11.5;
        train.z += train.speed * dt;
        if (train.z > target - 14) train.speed = Math.max(2.2, train.speed - dt * 4);
        if (train.z >= target) { train.z = target; train.speed = 0; train.state = 'stopped'; train.t = 0; }
        break;
      }
      case 'stopped':
        if (train.t >= train.DOOR_TIME) { train.state = 'depart'; train.t = 0; train.speed = train.V; }
        break;
      case 'depart':
        train.z += train.speed * dt;
        if (train.z > 70) { train.z = -70; train.state = 'away'; train.t = 0; }
        break;
    }
    // posição dos carros + cabine
    train.cars[0].position.set(0, 0, train.z - 5.5);
    train.cars[1].position.set(0, 0, train.z - 16.5);
    cab.position.set(0, 0, train.z + 0.8);
    // portas: abrem parado, fecham andando
    const open = train.state === 'stopped' ? Math.min(1, train.t * 2.5) : train.state === 'depart' ? Math.max(0, 1 - train.t * 2.5) : 0;
    for (const car of train.cars)
      for (const d of car.userData.doors) {
        d.dL.position.z = d.dz - 0.4 - open * 0.75;
        d.dR.position.z = d.dz + 0.4 + open * 0.75;
      }
    // movers (AABB do trem inteiro): atropelo letal só na CHEGADA em velocidade;
    // na SAÍDA o trem carrega quem embarcou
    const m = trainAABBs()[0];
    movers.length = 0;
    movers.push({ ...m, lethal: train.state === 'approach' && Math.abs(train.speed) > 1.2, carry: train.state === 'depart' && train.z < 60 ? train.speed : 0 });
    // atualiza colisores "estáticos" do trem pros tiros (occluders dinâmicos usa meshes dos carros direto)
  }

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -25.5, maxX: 25.5, minZ: -47.5, maxZ: 47.5 },
    movers, tick,
  };
}
