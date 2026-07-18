// fy_osasco — "Calçadão da Treta": calçadão de Osasco com lojinhas, bancos,
// chafariz, e POMBOS que saem voando quando alguém atira por perto.
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

export function buildOsasco(scene, T) {
  const colliders = [];
  const occluders = [];
  const pickups = [];
  const root = new THREE.Group();
  scene.add(root);
  const lam = o => new THREE.MeshLambertMaterial(o);

  const caladaTex = texOf(mkCanvas(256, 256, x => {
    x.fillStyle = '#b0a89a'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#8a8274'; x.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
    noiseOver(x, 256, 256, 0.15, ['#a0988a', '#c0b8aa']);
  }), 10, 10);
  const shopSign = (text, bg, fg) => texOf(mkCanvas(256, 64, x => {
    x.fillStyle = bg; x.fillRect(0, 0, 256, 64);
    x.fillStyle = fg; x.font = 'bold 24px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText(text, 128, 42);
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

  /* ---------------- o calçadão ---------------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 200), lam({ map: caladaTex }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);

  // lojinhas dos dois lados (paredes com portas e toldos)
  const lojas = [
    ['PADARIA DO SEU ZÉ', '#8f4a2a', '#ffe9c4'], ['SALÃO DA DONA CREUZA', '#e08a9a', '#3a1a2a'],
    ['ELETRÔNICOS ZAM', '#1a4a8a', '#fff'], ['ESFIRRA 24H', '#e8b400', '#3a2a1a'],
    ['BARBEARIA DO TONHÃO', '#2a6b3a', '#f0f0f0'], ['LAN HOUSE TRETA', '#3b1b4a', '#ff7ad9'],
  ];
  for (const s of [-1, 1]) {
    lojas.forEach((l, i) => {
      const bz = -40 + i * 16, bx = s * 24;
      addBox(6, 4.5, 12, lam({ map: T.concrete }), bx, 0, bz);
      // toldo listrado
      const awn = addPlane(6.2, 1.6, lam({ map: T.awning, side: THREE.DoubleSide }), bx - s * 3.6, 2.6, bz, s < 0 ? Math.PI / 2 : -Math.PI / 2);
      awn.rotation.x = s * 0.4;
      if (i % 2 === 0) addPlane(4.5, 1.1, lam({ map: shopSign(l[0], l[1], l[2]) }), bx - s * 3.05, 3.3, bz, s < 0 ? Math.PI / 2 : -Math.PI / 2);
    });
  }
  // fundos: igreja com torre + prédios
  addBox(10, 8, 12, lam({ map: T.concrete }), 0, 0, -66);
  addBox(3, 14, 3, lam({ map: T.concreteDark }), -6.5, 0, -66);
  addPlane(2.4, 1.4, lam({ map: shopSign('IGREJA DA TRETA', '#4a3a6a', '#ffd23f') }), 0, 6.5, -59.9, 0);
  addBox(14, 12, 10, lam({ map: T.concrete }), -16, 0, 68);
  addBox(14, 10, 10, lam({ map: T.concreteDark }), 14, 0, 70);

  // chafariz central (cover redondo)
  {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.8, 16), lam({ map: T.concreteDark }));
    rim.position.set(0, 0.4, 0); rim.castShadow = rim.receiveShadow = true; root.add(rim); occluders.push(rim);
    const waterC = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 16), lam({ color: 0x2a6b7a, transparent: true, opacity: 0.8 }));
    waterC.position.set(0, 0.75, 0); root.add(waterC);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.4, 8), lam({ map: T.concreteDark }));
    spout.position.set(0, 1.4, 0); root.add(spout);
    colliders.push({ minX: -3.4, maxX: 3.4, minY: 0, maxY: 1.2, minZ: -3.4, maxZ: 3.4 });
  }
  // bancos de praça (cover baixo)
  for (const [bx, bz] of [[-10, -18], [10, 18], [-10, 14], [10, -14], [-6, 30], [6, -30]]) {
    addBox(3, 0.45, 0.8, lam({ color: 0x6b4f2c }), bx, 0, bz);
    addBox(0.15, 0.5, 0.7, lam({ color: 0x2a2a2a }), bx - 1.3, 0, bz, { collide: false });
    addBox(0.15, 0.5, 0.7, lam({ color: 0x2a2a2a }), bx + 1.3, 0, bz, { collide: false });
  }
  // mesas de bar com cadeiras plásticas (cover pequeno)
  for (const [mx, mz, cc] of [[14, -8, 0xe03232], [-14, 8, 0x2b4d8f], [14, 4, 0xffd23f]]) {
    addBox(1.2, 0.06, 1.2, lam({ color: 0xf0f0f0 }), mx, 0.75, mz, { collide: false });
    addBox(0.08, 0.75, 0.08, lam({ color: 0x888888 }), mx, 0, mz, { collide: false });
    addBox(0.45, 0.45, 0.45, lam({ color: cc }), mx + 1, 0, mz, { collide: false });
    addBox(0.45, 0.5, 0.1, lam({ color: cc }), mx + 1, 0.45, mz - 0.2, { collide: false });
  }

  /* ---------------- OS POMBOS (voam quando atiram perto) ---------------- */
  const pombos = [];
  function mkPombo(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), lam({ color: 0x8a8a92 }));
    body.scale.set(1.3, 1, 1); g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lam({ color: 0x5a5a62 }));
    head.position.set(0.14, 0.08, 0); g.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.08), lam({ color: 0x4a4a52 }));
    tail.position.set(-0.18, 0.02, 0); g.add(tail);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.1), lam({ color: 0x7a7a82 }));
    wingL.position.set(0, 0.06, 0.09); g.add(wingL);
    const wingR = wingL.clone(); wingR.position.z = -0.09; g.add(wingR);
    g.userData = { home: { x, z }, state: 'idle', t: Math.random() * 4, wingL, wingR, phase: Math.random() * 6 };
    g.position.set(x, 0, z);
    root.add(g);
    pombos.push(g);
    return g;
  }
  for (const [px, pz] of [[-4, 6], [2, 8], [6, -4], [-2, -8], [8, 12], [-8, -14], [4, 20], [-6, 24], [10, -20], [-10, 2], [3, -16], [-3, 30]])
    mkPombo(px, pz);

  function pigeonsTick(game, dt) {
    // dispara voos quando alguém atira perto (tracers vivem só 0.09s — checar todo frame)
    for (const p of pombos) {
      if (p.userData.state !== 'idle') continue;
      for (const t of game.tracers) {
        const hx = t.m.position.x - p.position.x, hz = t.m.position.z - p.position.z;
        if (hx * hx + hz * hz < 30 * 30) { p.userData.state = 'flying'; p.userData.t = 0; break; }
      }
    }
    for (const p of pombos) {
      const u = p.userData;
      u.t += dt;
      if (u.state === 'idle') {
        // bicando o chão
        p.position.y = Math.abs(Math.sin(u.t * 2 + u.phase)) * 0.02;
        p.rotation.y += Math.sin(u.t * 0.7 + u.phase) * 0.01;
      } else if (u.state === 'flying') {
        // sobe esvoaçante e sai de cena por uns segundos
        p.position.y += dt * (6 - u.t * 2);
        p.position.x += dt * 3 * Math.sin(u.phase);
        p.position.z += dt * 3 * Math.cos(u.phase);
        const flap = Math.sin(u.t * 24) * 0.9;
        u.wingL.rotation.x = flap; u.wingR.rotation.x = -flap;
        if (u.t > 4) { u.state = 'returning'; u.t = 0; }
      } else if (u.state === 'returning') {
        // volta pra casa planar
        const dx = u.home.x - p.position.x, dz = u.home.z - p.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.3) {
          p.position.set(u.home.x, 0, u.home.z);
          u.state = 'idle'; u.wingL.rotation.x = u.wingR.rotation.x = 0;
        } else {
          p.position.x += dx / d * dt * 5;
          p.position.z += dz / d * dt * 5;
          p.position.y = Math.max(0, p.position.y - dt * 2.5);
          const flap = Math.sin(u.t * 18) * 0.6;
          u.wingL.rotation.x = flap; u.wingR.rotation.x = -flap;
        }
      }
    }
  }

  /* ---------------- luz de fim de tarde ---------------- */
  scene.background = T.sky;
  scene.fog = new THREE.Fog(0xffd0a0, 55, 190);
  const hemi = new THREE.HemisphereLight(0xffe8c8, 0x8a6b48, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc890, 1.5);
  sun.position.set(-35, 40, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
  sun.shadow.camera.far = 150; sun.shadow.bias = -0.0004;
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
  for (let gx = -26; gx <= 26; gx += STEP)
    for (let gz = -62; gz <= 62; gz += STEP)
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
    P: [-8, -3, 3, 8].map(x => ({ x, z: -52, yaw: 0 })),
    B: [-8, -3, 3, 8].map(x => ({ x, z: 52, yaw: Math.PI })),
  };

  return {
    root, colliders, occluders, groundHeightAt, spawns, sun, hemi, pickups,
    waypoints: { nodes, adj }, nearestWaypoint, findPath,
    bounds: { minX: -24, maxX: 24, minZ: -64, maxZ: 64 },
    tick: pigeonsTick,
  };
}
