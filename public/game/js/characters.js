// 8 fictional satirical archetypes — procedural low-poly meshes.
import * as THREE from 'three';

export const CHARACTERS = [
  { id: 'esquerdomacho', team: 'P', name: 'Esquerdomacho',
    blurb: 'Barba, tote bag e 47 bottons. Mira acadêmica: analisa a treta antes de atirar.',
    pal: { skin: 0xe8b98a, shirt: 0xb03a2e, pants: 0x3a4a5a, hair: 0x4a3428, boots: 0x2a2a2a } },
  { id: 'sindicato', team: 'P', name: 'Líder do Sindicato',
    blurb: 'Boné vermelho, colete de assembleia e megafone. Convoca greve de fogo a cada round.',
    pal: { skin: 0xc98d5e, shirt: 0x777777, pants: 0x2e3d55, hair: 0x3a3a3a, boots: 0x4a3428 } },
  { id: 'mst', team: 'P', name: 'Líder do MST',
    blurb: 'Do campo pra arena. Bandeira na mochila, bota no barro e tiro certeiro de enxada.',
    pal: { skin: 0x8d5a3b, shirt: 0x7a6a45, pants: 0x4a4030, hair: 0x2a1e14, boots: 0x5a3d1e } },
  { id: 'doutora', team: 'P', name: 'Doutora do SUS',
    blurb: 'Jaleco, estetoscópio e plantão de 24h. Receita tiro certeiro, na veia.',
    pal: { skin: 0xd9a580, shirt: 0xf0f0f0, pants: 0x3a4a5a, hair: 0x3a2a1e, boots: 0x6b6b6b } },
  { id: 'caminhoneiro', team: 'B', name: 'Caminhoneiro',
    blurb: 'Camisa do Brasil, luva de estrada e 40h de BR na semana. Freia pra ninguém.',
    pal: { skin: 0xd9a066, shirt: 0xffd23f, pants: 0x2e3d55, hair: 0x3a2a1e, boots: 0x3a3a3a } },
  { id: 'influencer', team: 'B', name: 'Influencer de Dubai',
    blurb: 'Óculos dourado, stories em 3 fusos e mira patrocinada. Atira, posta, engaja.',
    pal: { skin: 0xf2c9a4, shirt: 0xf0f0f0, pants: 0xe8c25a, hair: 0xf5d76e, boots: 0xffffff } },
  { id: 'sertanejo', team: 'B', name: 'Cantor Sertanejo',
    blurb: 'Chapéu de cowboy, fivela de ouro e violão nas costas. Moda de viola em dose dupla.',
    pal: { skin: 0xc98d5e, shirt: 0x8a2f2f, pants: 0x2e3d55, hair: 0x2a1e14, boots: 0x5a3d1e } },
  { id: 'senhora', team: 'B', name: 'Tia Zilá',
    blurb: '60 anos, 300 grupos de mensagem e um quadro de pistas nas costas. Ela SABE de tudo.',
    pal: { skin: 0xeec39a, shirt: 0x1faa4d, pants: 0xffd23f, hair: 0xd8d8d8, boots: 0xf0f0f0 } },
];
export const byId = id => CHARACTERS.find(c => c.id === id);

const matCache = new Map();
function M(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
}
function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color));
  m.position.set(x, y, z); m.castShadow = true; return m;
}

// AWP-style rifle, pointing +Z. ~0.9m long.
export function buildRifle(color = 0x2e4a2e) {
  const g = new THREE.Group();
  g.add(box(0.06, 0.10, 0.42, color, 0, 0, 0.05));                    // receiver/body
  g.add(box(0.05, 0.07, 0.22, 0x2a2a2a, 0, -0.045, -0.20));           // stock
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), M(0x222222));
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.012, 0.48); barrel.castShadow = true; g.add(barrel);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 8), M(0x1a1a1a));
  scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.09, 0.06); g.add(scope);
  g.add(box(0.02, 0.05, 0.03, 0x222222, 0, 0.045, 0.0));              // scope mount
  g.add(box(0.04, 0.12, 0.06, 0x3a2a1e, 0, -0.10, 0.02));             // grip
  return g;
}

// Humanoid ~1.8m, origin at feet, faces +Z.
export function buildCharacter(def) {
  const p = def.pal, g = new THREE.Group();
  const parts = {};
  const bulky = def.id === 'caminhoneiro';

  // legs (pivot at hip)
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.15, 0.78, 0.17); geo.translate(0, -0.39, 0);
    const leg = new THREE.Mesh(geo, M(p.pants)); leg.castShadow = true;
    leg.position.set(0.11 * s, 0.78, 0);
    leg.add(box(0.16, 0.1, 0.26, p.boots, 0, -0.73, 0.04));           // boot
    g.add(leg); parts[s < 0 ? 'legL' : 'legR'] = leg;
  }
  // torso
  const torsoW = bulky ? 0.52 : 0.44;
  const torso = new THREE.Group(); torso.position.y = 0.78;
  const chest = box(torsoW, 0.6, 0.26, p.shirt, 0, 0.3, 0);
  torso.add(chest);
  g.add(torso); parts.torso = torso; parts.chest = chest;

  // head (pivot at neck)
  const head = new THREE.Group(); head.position.y = 1.38;
  head.add(box(0.26, 0.28, 0.26, p.skin, 0, 0.14, 0));
  g.add(head); parts.head = head;

  // arms holding rifle forward (pivot at shoulder)
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.11, 0.5, 0.13); geo.translate(0, -0.25, 0);
    const arm = new THREE.Mesh(geo, M(def.id === 'senhora' ? 0xffd23f : p.shirt));
    arm.castShadow = true;
    arm.position.set((torsoW / 2 + 0.06) * s, 0.52, 0);
    arm.rotation.x = -1.35;                                            // forward hold
    arm.rotation.z = -0.12 * s;
    torso.add(arm); parts[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // rifle in front of chest
  const gun = buildRifle();
  gun.position.set(0.10, 0.34, 0.30);
  torso.add(gun); parts.gun = gun;

  // team armband
  const band = def.team === 'P' ? 0xe03232 : 0x1faa4d;
  parts.armL.add(box(0.13, 0.08, 0.15, band, 0, -0.12, 0));

  addAccessories(def, parts, torsoW);
  return { group: g, parts, def };
}

function addAccessories(def, parts, torsoW) {
  const p = def.pal, head = parts.head, torso = parts.torso;
  const cap = (color) => {
    head.add(box(0.28, 0.09, 0.28, color, 0, 0.30, 0));
    head.add(box(0.26, 0.03, 0.16, color, 0, 0.27, 0.20));            // brim
  };
  const sunglasses = (w = 0.28, color = 0x111111) => {
    head.add(box(w, 0.07, 0.04, color, 0, 0.17, 0.14));
  };
  switch (def.id) {
    case 'esquerdomacho':
      head.add(box(0.24, 0.12, 0.06, 0x3a2a1e, 0, 0.02, 0.13));       // beard
      head.add(box(0.26, 0.10, 0.12, p.hair, 0, 0.30, -0.02));        // hair
      sunglasses(0.26, 0x222222);                                      // glasses
      torso.add(box(0.34, 0.08, 0.30, 0xd32f2f, 0, 0.56, 0));         // red scarf
      torso.add(box(0.20, 0.30, 0.06, 0xe8dcc0, torsoW / 2 + 0.1, -0.05, 0.05)); // tote bag
      torso.add(box(0.04, 0.04, 0.02, 0xffd23f, -0.12, 0.42, 0.14));  // button 1
      torso.add(box(0.04, 0.04, 0.02, 0xe03232, -0.05, 0.38, 0.14));  // button 2
      break;
    case 'sindicato':
      cap(0xc0392b);
      torso.add(box(torsoW + 0.04, 0.5, 0.30, 0x8e2f24, 0, 0.28, 0)); // vest
      torso.add(box(0.07, 0.05, 0.02, 0xffd23f, -0.13, 0.4, 0.16));   // patch
      torso.add(box(0.07, 0.05, 0.02, 0xffd23f, 0.13, 0.32, 0.16));   // patch
      { const mega = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), M(0xf0f0f0));
        mega.rotation.x = 2.4; mega.position.set(-torsoW / 2 - 0.1, 0.02, 0.08);
        mega.castShadow = true; torso.add(mega); }                     // megaphone at hip
      break;
    case 'mst':
      cap(0xc0392b);
      torso.add(box(0.32, 0.07, 0.28, 0xd32f2f, 0, 0.55, 0));         // scarf
      torso.add(box(0.34, 0.42, 0.16, 0x3f5a34, 0, 0.28, -0.22));     // backpack
      { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), M(0x8a6b48));
        pole.position.set(0.14, 0.75, -0.24); torso.add(pole);
        torso.add(box(0.02, 0.16, 0.24, 0xe03232, 0.14, 0.9, -0.36)); } // little red flag
      break;
    case 'doutora':
      head.add(box(0.28, 0.08, 0.28, p.hair, 0, 0.29, 0));              // hair top
      head.add(box(0.08, 0.22, 0.08, p.hair, 0, 0.14, -0.18));          // ponytail
      torso.add(box(torsoW + 0.04, 0.56, 0.30, 0xf0f0f0, 0, 0.28, 0));  // lab coat
      torso.add(box(torsoW + 0.02, 0.16, 0.28, 0xf0f0f0, 0, -0.04, 0)); // coat skirt
      { const stet = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 14), M(0x2a2a2a));
        stet.position.set(0, 0.55, 0.05); stet.rotation.x = 1.25; torso.add(stet);   // stethoscope
        const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 8), M(0x888888));
        chest.rotation.x = Math.PI / 2; chest.position.set(0.07, 0.38, 0.16); torso.add(chest); }
      torso.add(box(0.06, 0.06, 0.02, 0x2b4d8f, -0.13, 0.44, 0.16));    // ID badge
      torso.add(box(0.16, 0.22, 0.02, 0xd8cfc0, -torsoW / 2 - 0.1, 0.12, 0.08)); // clipboard
      break;
    case 'caminhoneiro':
      cap(0x2456a6);
      sunglasses();
      torso.add(box(0.46, 0.08, 0.28, 0x1faa4d, 0, 0.56, 0));         // green collar stripe
      parts.armR.add(box(0.13, 0.1, 0.15, 0x8a6b48, 0, -0.44, 0));    // trucker glove
      break;
    case 'influencer':
      head.add(box(0.29, 0.12, 0.29, p.hair, 0, 0.31, -0.02));        // blonde
      head.add(box(0.29, 0.26, 0.08, p.hair, 0, 0.16, -0.15));        // long back hair
      sunglasses(0.30, 0xc9a227);                                      // gold shades
      parts.armL.rotation.x = -2.4;                                    // phone up pose
      parts.armL.add(box(0.09, 0.02, 0.14, 0xffffff, 0, -0.5, 0.04)); // phone
      torso.add(box(0.4, 0.06, 0.28, 0xc9a227, 0, 0.06, 0));          // gold belt
      break;
    case 'sertanejo':
      { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 10), M(0x7a5230));
        brim.position.y = 0.27; brim.castShadow = true; head.add(brim);
        head.add(box(0.24, 0.14, 0.24, 0x7a5230, 0, 0.35, 0)); }      // cowboy hat
      torso.add(box(0.14, 0.1, 0.03, 0xffd23f, 0, 0.02, 0.14));       // big buckle
      { const gc = box(0.22, 0.72, 0.1, 0x2a2a2a, 0.05, 0.3, -0.24);  // guitar case
        gc.rotation.z = 0.18; torso.add(gc); }
      break;
    case 'senhora':
      { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(0xd8d8d8));
        bun.position.set(0, 0.34, -0.1); head.add(bun); }
      head.add(box(0.28, 0.06, 0.26, 0xd8d8d8, 0, 0.28, 0.02));       // gray hair
      sunglasses(0.32, 0x1a1a1a);                                      // oversized shades
      torso.add(box(0.36, 0.4, 0.05, 0xa97f4e, -0.04, 0.32, -0.19));  // corkboard on back
      torso.add(box(0.08, 0.06, 0.02, 0xf2ecd8, -0.12, 0.4, -0.215)); // note
      torso.add(box(0.08, 0.06, 0.02, 0xf2ecd8, 0.04, 0.26, -0.215)); // note
      torso.add(box(0.02, 0.2, 0.02, 0xd33, -0.04, 0.33, -0.215));    // red string
      parts.armR.add(box(0.1, 0.02, 0.15, 0x2b4d8f, 0, -0.44, 0.02)); // stickered phone
      break;
  }
}

// Procedural walk/idle. `phase` advances with movement, `moving` 0..1.
export function poseCharacter(parts, phase, moving, t) {
  const s = Math.sin(phase), c = Math.cos(phase);
  parts.legL.rotation.x = s * 0.6 * moving;
  parts.legR.rotation.x = -s * 0.6 * moving;
  const breathe = Math.sin(t * 2.2) * 0.012;
  parts.torso.position.y = 0.78 + Math.abs(c) * 0.045 * moving + breathe;
  parts.torso.rotation.y = s * 0.05 * moving;
  parts.head.rotation.z = Math.sin(t * 1.7) * 0.02;
  parts.head.rotation.x = Math.sin(t * 1.3) * 0.02;
}

