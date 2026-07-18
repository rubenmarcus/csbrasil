// Parser mínimo de OBJ+MTL (Kd colors, sem UV) — zero dependência externa.
// Usado pros modelos de arma (Quaternius Ultimate Guns Pack, CC0).
import * as THREE from 'three';

function parseMtl(text) {
  const m = {}; let cur = null;
  for (const line of text.split('\n')) {
    const t = line.trim().split(/\s+/);
    if (t[0] === 'newmtl') { cur = t[1]; m[cur] = { kd: [0.5, 0.5, 0.5] }; }
    else if (t[0] === 'Kd' && cur) { m[cur].kd = [+t[1], +t[2], +t[3]]; }
  }
  return m;
}

function matFor(name, kd) {
  const l = (name || '').toLowerCase();
  let rough = 0.55, metal = 0.4;
  if (l.includes('metal')) { rough = 0.4; metal = 0.85; }
  else if (l.includes('wood')) { rough = 0.72; metal = 0.05; }
  else if (l.includes('black')) { rough = 0.5; metal = 0.55; }
  // Kd do Quaternius é bem escuro; dá um leve boost pra ler melhor sob luz
  const c = new THREE.Color(Math.min(1, kd[0] * 2.2 + 0.02), Math.min(1, kd[1] * 2.2 + 0.02), Math.min(1, kd[2] * 2.2 + 0.02));
  return new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal, flatShading: true });
}

function buildGun(objText, mtlText) {
  const mats = parseMtl(mtlText);
  const verts = [];
  const groups = {};
  let cur = 'default';
  for (const line of objText.split('\n')) {
    const t = line.trim().split(/\s+/);
    if (t[0] === 'v') verts.push([+t[1], +t[2], +t[3]]);
    else if (t[0] === 'usemtl') { cur = t[1]; if (!groups[cur]) groups[cur] = []; }
    else if (t[0] === 'f') {
      const idx = t.slice(1).map(tok => { const vi = parseInt(tok.split('/')[0], 10); return vi < 0 ? verts.length + vi : vi - 1; });
      if (!groups[cur]) groups[cur] = [];
      for (let i = 1; i < idx.length - 1; i++) {           // fan-triangula quads/ngons
        [idx[0], idx[i], idx[i + 1]].forEach(vi => { const v = verts[vi]; if (v) groups[cur].push(v[0], v[1], v[2]); });
      }
    }
  }
  const root = new THREE.Group();
  for (const name in groups) {
    const arr = groups[name]; if (!arr.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    geo.computeVertexNormals();
    root.add(new THREE.Mesh(geo, matFor(name, (mats[name] || {}).kd || [0.5, 0.5, 0.5])));
  }
  // centraliza e normaliza pro maior lado = 1 (o caller escala pro tamanho de viewmodel)
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  root.children.forEach(m => m.geometry.translate(-c.x, -c.y, -c.z));
  const maxd = Math.max(sz.x, sz.y, sz.z) || 1;
  root.scale.setScalar(1 / maxd);
  return root;
}

export async function loadObjGun(objUrl, mtlUrl) {
  const [o, m] = await Promise.all([fetch(objUrl).then(r => r.text()), fetch(mtlUrl).then(r => r.text())]);
  return buildGun(o, m);
}
