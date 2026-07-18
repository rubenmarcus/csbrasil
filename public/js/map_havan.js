// fy_havan — "Estacionamento do Havão": galpão laranja gigante de atacarejo
// fictício, com estátua da Liberdade de loja (paródia tosca e carinhosa),
// mar de vagas com carros como cover, corrais de carrinhos e bandeiras do BR.
// 100% fictício e satírico — nenhuma marca real usada.
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

export function buildHavan(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);
  const lam = o => new THREE.MeshLambertMaterial(o);

  /* ---------------- texturas ---------------- */
  // asfalto com vagas pintadas
  const asphaltTex = texOf(mkCanvas(512, 512, x => {
    x.fillStyle = '#3f3d3b'; x.fillRect(0, 0, 512, 512);
    noiseOver(x, 512, 512, 0.2, ['#35332f', '#4a4844', '#2e2c2a']);
    // vagas: 2 fileiras de 6 por tile
    x.strokeStyle = '#d8d4c8'; x.lineWidth = 3; x.globalAlpha = 0.85;
    for (const y0 of [40, 300]) {
      for (let i = 0; i <= 6; i++) {
        x.beginPath(); x.moveTo(20 + i * 78, y0); x.lineTo(20 + i * 78, y0 + 170); x.stroke();
      }
    }
    x.globalAlpha = 1;
  }), 8, 8);
  const havaoSign = (text, sub) => texOf(mkCanvas(512, 128, x => {
    x.fillStyle = '#1a3a8a'; x.fillRect(0, 0, 512, 128);
    x.fillStyle = '#e8701a'; x.fillRect(0, 108, 512, 20);
    x.fillStyle = '#fff'; x.font = 'bold 72px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText(text, 256, 78);
    if (sub) { x.font = 'bold 22px Arial,sans-serif'; x.fillStyle = '#ffd23f'; x.fillText(sub, 256, 104); }
  }), 1, 1);
  const brFlag = () => texOf(mkCanvas(128, 90, x => {
    x.fillStyle = '#1a9e4b'; x.fillRect(0, 0, 128, 90);
    x.fillStyle = '#ffd23f';
    x.beginPath(); x.moveTo(64, 8); x.lineTo(118, 45); x.lineTo(64, 82); x.lineTo(10, 45); x.closePath(); x.fill();
    x.fillStyle = '#1a3a8a'; x.beginPath(); x.arc(64, 45, 15, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 3;
    x.beginPath(); x.arc(64, 62, 18, -2.4, -0.7); x.stroke();
  }), 1, 1);
  const promoBanner = (l1, l2) => texOf(mkCanvas(256, 128, x => {
    x.fillStyle = '#e8701a'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#fff'; x.font = 'bold 30px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText(l1, 128, 56);
    x.fillStyle = '#1a3a8a'; x.font = 'bold 24px Arial Black,sans-serif';
    x.fillText(l2, 128, 94);
  }), 1, 1);

  function addBox(w, h, d, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.ry) m.rotation.y = opts.ry;
    root.add(m);
    if (opts.collide !== false) {
      const ex = opts.ry ? Math.max(w, d) / 2 : w / 2;
      const ez = opts.ry ? Math.max(w, d) / 2 : d / 2;
      colliders.push({ minX: x - ex, maxX: x + ex, minY: y, maxY: y + h, minZ: z - ez, maxZ: z + ez });
      occluders.push(m);
    }
    return m;
  }
  function addPlane(w, h, mat, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.receiveShadow = true; root.add(m); return m;
  }

  /* ---------------- o estacionamento ---------------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 120), lam({ map: asphaltTex }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  // gramado nas bordas leste/oeste (spawns)
  for (const s of [-1, 1]) {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(14, 120), lam({ color: 0x4a7a3a }));
    grass.rotation.x = -Math.PI / 2; grass.position.set(s * 74, 0.01, 0); grass.receiveShadow = true; root.add(grass);
  }

  /* ---------------- O GALPÃO (norte) ---------------- */
  const ORANGE = lam({ color: 0xe8701a }), WHITE = lam({ color: 0xf2f0ea }), BLUE = lam({ color: 0x1a3a8a });
  addBox(76, 11, 18, ORANGE, 0, 0, -52);                       // corpo do galpão
  addBox(76, 2.2, 19, WHITE, 0, 9.6, -52, { collide: false }); // friso branco no topo
  addBox(78, 0.8, 20, BLUE, 0, 11.4, -52, { collide: false }); // cumeeira azul
  // letreiro gigante
  addPlane(34, 8.5, lam({ map: havaoSign('HAVÃO', 'O GIGANTE DAS OFERTAS') }), 0, 8.2, -42.9, 0);
  // colunas brancas da fachada + portas de vidro (fake)
  for (let i = -3; i <= 3; i++) addBox(1.2, 9.6, 0.6, WHITE, i * 11, 0, -42.8, { collide: false });
  for (const gx of [-6, -2, 2, 6])
    addPlane(3.4, 4.2, lam({ color: 0x9ec8e0, transparent: true, opacity: 0.55 }), gx, 2.1, -42.7, 0);
  // marquise de entrada
  addBox(22, 0.5, 4, BLUE, 0, 4.6, -41, { collide: false });
  addBox(0.5, 4.6, 0.5, WHITE, -10.5, 0, -39.6); addBox(0.5, 4.6, 0.5, WHITE, 10.5, 0, -39.6);
  // banners promocionais na fachada
  addPlane(7, 3.5, lam({ map: promoBanner('FESTA DOS', 'PREÇOS BAIXOS') }), -20, 6.2, -42.85, 0);
  addPlane(7, 3.5, lam({ map: promoBanner('ATÉ O TALO', 'DE OFERTA') }), 20, 6.2, -42.85, 0);

  /* ---------------- A ESTÁTUA (ícone da loja, paródia) ---------------- */
  {
    const zx = 0, zz = -30;
    addBox(5, 3.2, 5, lam({ map: T.concrete }), zx, 0, zz);      // pedestal
    addBox(5.8, 0.5, 5.8, lam({ map: T.concreteDark }), zx, 3.2, zz, { collide: false });
    const patina = lam({ color: 0x63a58c }), patinaD = lam({ color: 0x4a7a68 });
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 3.6, 10), patina);
    robe.position.set(zx, 3.7 + 1.8, zz); robe.castShadow = true; root.add(robe); occluders.push(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), patina);
    head.position.set(zx, 7.6, zz); head.castShadow = true; root.add(head);
    // coroa com 7 pontas
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 5), patinaD);
      spike.position.set(zx + Math.cos(a) * 0.48, 8.05, zz + Math.sin(a) * 0.48);
      spike.rotation.z = -Math.cos(a) * 0.5; spike.rotation.x = Math.sin(a) * 0.5;
      root.add(spike);
    }
    // braço da tocha (direito, erguido)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 8), patina);
    arm.position.set(zx + 0.9, 7.3, zz); arm.rotation.z = -0.5; arm.castShadow = true; root.add(arm);
    const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8), patinaD);
    torch.position.set(zx + 1.45, 8.6, zz); root.add(torch);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffb23f }));
    flame.position.set(zx + 1.45, 9.15, zz); root.add(flame);
    // braço da tábua (esquerdo) — a tábua das OFERTAS
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.6, 8), patina);
    arm2.position.set(zx - 0.85, 6.4, zz + 0.3); arm2.rotation.z = 0.9; root.add(arm2);
    addBox(0.9, 1.2, 0.15, patinaD, zx - 1.5, 6.2, zz + 0.6, { collide: false });
  }

  /* ---------------- CARROS (cover do estacionamento) ---------------- */
  const CAR_COLORS = [0xd8d8d8, 0x8a8f96, 0x1c1c20, 0xa82020, 0x1a4a8a, 0xc8a020, 0x5a8a4a];
  let carSeed = 7;
  const rnd = () => (carSeed = (carSeed * 16807) % 2147483647) / 2147483647;
  function mkCar(x, z, ry) {
    const g = new THREE.Group();
    const color = CAR_COLORS[(rnd() * CAR_COLORS.length) | 0];
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.75, 1.9), lam({ color }));
    body.position.y = 0.65; g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.58, 1.6),
      lam({ color: 0x46586a }));
    cabin.position.set(-0.2, 1.32, 0); g.add(cabin);
    for (const [wx, wz] of [[-1.4, 0.95], [1.4, 0.95], [-1.4, -0.95], [1.4, -0.95]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10), lam({ color: 0x16161a }));
      w.rotation.x = Math.PI / 2; w.position.set(wx, 0.34, wz); g.add(w);
    }
    g.position.set(x, 0, z); g.rotation.y = ry;
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    root.add(g); occluders.push(g.children[0]);
    colliders.push({ minX: x - 2.2, maxX: x + 2.2, minY: 0, maxY: 1.62, minZ: z - 2.2, maxZ: z + 2.2 });
  }
  // fileiras de vagas (espelhadas em x): carros em z fixos, vagas de 3m
  for (const rz of [-14, 2, 18]) {
    for (let i = 0; i < 10; i++) {
      const x = -36 + i * 8;
      if (rnd() < 0.22) continue;           // vaga vazia
      mkCar(x + (rnd() - 0.5), rz + (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.08);
    }
  }
  // carros "mal estacionados" perto da entrada (todo estacionamento de atacarejo tem)
  mkCar(-14, -36, 0.5); mkCar(16, -34, -0.4); mkCar(24, -38, 0.15);

  /* ---------------- corrais de carrinhos ---------------- */
  for (const [cx, cz] of [[-26, -36], [26, -36], [0, 30]]) {
    addBox(0.15, 1.1, 6, BLUE, cx - 1.1, 0, cz);
    addBox(0.15, 1.1, 6, BLUE, cx + 1.1, 0, cz);
    colliders.push({ minX: cx - 1.2, maxX: cx + 1.2, minY: 0, maxY: 1.1, minZ: cz - 3, maxZ: cz + 3 });
    for (let i = 0; i < 4; i++) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.1),
        new THREE.MeshLambertMaterial({ color: 0xb0b6bc, wireframe: true }));
      cart.position.set(cx, 0.55, cz - 2.2 + i * 1.4); root.add(cart);
      const basket = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 1.05), lam({ color: 0xd8dade }));
      basket.position.set(cx, 0.62, cz - 2.2 + i * 1.4); basket.castShadow = true; root.add(basket);
    }
  }

  /* ---------------- postes de luz + bandeiras ---------------- */
  for (const [px, pz] of [[-30, -8], [30, -8], [-30, 12], [30, 12], [-12, 34], [12, 34]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 9.5, 8), lam({ map: T.metal }));
    pole.position.set(px, 4.75, pz); pole.castShadow = true; root.add(pole);
    colliders.push({ minX: px - 0.25, maxX: px + 0.25, minY: 0, maxY: 9.5, minZ: pz - 0.25, maxZ: pz + 0.25 });
    addBox(3.2, 0.15, 0.5, lam({ map: T.metal }), px, 9.3, pz, { collide: false });
    for (const s of [-1, 1])
      addBox(0.7, 0.2, 0.55, lam({ color: 0xfff2cc, emissive: 0x443a1a }), px + s * 1.3, 9.15, pz, { collide: false });
  }
  // 3 mastros de bandeira do BR na entrada
  const flagTex = brFlag();
  for (const fx of [-12, 0, 12]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 13, 8), lam({ color: 0xd8d8d8 }));
    mast.position.set(fx, 6.5, -40); root.add(mast);
    colliders.push({ minX: fx - 0.2, maxX: fx + 0.2, minY: 0, maxY: 13, minZ: -40.2, maxZ: -39.8 });
    const flag = addPlane(2.6, 1.8, lam({ map: flagTex, side: THREE.DoubleSide }), fx + 1.3, 11.6, -40, 0);
    flag.rotation.y = 0.25;   // quase de frente pra quem vem do estacionamento
  }

  /* ---------------- placa de rua (sul) ---------------- */
  addBox(0.6, 7, 0.6, lam({ map: T.metal }), -6, 0, 44);
  addBox(0.6, 7, 0.6, lam({ map: T.metal }), 6, 0, 44);
  addPlane(14, 4.5, lam({ map: havaoSign('HAVÃO', 'VAGAS DE SOBRA • OFERTAS DE FALTA') }), 0, 8.2, 43.7, Math.PI);

  /* ---------------- armas espalhadas (fy_) ---------------- */
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
  const place = (kind, x, z, yaw) => { const mesh = buildGun(kind, x, z, yaw); pickups.push({ x, z, kind, weapon: kind, readyAt: 0, mesh }); };
  // arsenal na frente da loja
  place('awp', -8, -38, 0); place('ak', -4, -38, 0); place('m4', 4, -38, 0); place('shotgun', 8, -38, 0);
  // pistolas e smg pelo estacionamento
  place('mp5', -20, 10, Math.PI / 2); place('deagle', 20, 10, -Math.PI / 2);
  place('pistol', -10, 26, 0); place('pistol', 10, 26, 0);
  place('awp', 0, 36, 0);

  /* ---------------- céu e luz de sábado de manhã ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xcfe0f0, 60, 210);
  const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x6b6b5a, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.55);
  sun.position.set(30, 55, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 200; sun.shadow.bias = -0.0004;
  scene.add(sun);

  /* ---------------- waypoints / spawns ---------------- */
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
  for (let gx = -58; gx <= 58; gx += STEP)
    for (let gz = -40; gz <= 42; gz += STEP)
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
    P: [-9, -3, 3, 9].map(z => ({ x: -55, z, yaw: Math.PI / 2 })),
    B: [-9, -3, 3, 9].map(z => ({ x: 55, z, yaw: -Math.PI / 2 })),
  };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -66, maxX: 66, minZ: -44, maxZ: 46 },
  };
}
