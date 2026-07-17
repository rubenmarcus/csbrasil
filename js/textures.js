// Procedural canvas textures — zero external assets.
import * as THREE from 'three';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, repeat = 1, ry = null) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;           // retro CS 1.6 pixel look
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, ry === null ? repeat : ry);
  return t;
}
function noiseOver(ctx, w, h, alpha, colors) {
  for (let i = 0; i < w * h / 14; i++) {
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    ctx.globalAlpha = Math.random() * alpha;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  ctx.globalAlpha = 1;
}
function stains(ctx, w, h, n, col) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 12 + Math.random() * 42;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export const GRAFFITI = [
  'É TRETA!', 'PASTEL > TUDO', 'CAPIVARA LIVRE', 'ABAXO O IMPOSTO DO PASTEL',
  'ZÉ CAPIVARA 99', 'FEIJOADA SUPREMA', 'TRETA 4 EVER', 'VOTE NINGUÉM',
  'SNIPER SEM CAUSA', 'O MURO É FAKE NEWS', 'BORA PRO CLÁSSICO', 'MIOJO 3 ESTRELAS'
];
const GCOLORS = ['#ff3b3b', '#ffd23f', '#3bd1ff', '#ff7ad9', '#7dff9a', '#ff8a3b'];

function concreteBase(w = 256, h = 256, base = '#9a938a', dark = '#7d766d') {
  const c = canvas(w, h), x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  noiseOver(x, w, h, 0.25, [dark, '#aaa398', '#8a847c']);
  stains(x, w, h, 5, 'rgba(60,50,40,0.20)');
  // cracks
  x.strokeStyle = 'rgba(50,45,40,0.5)'; x.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py);
    for (let s = 0; s < 5; s++) { px += (Math.random() - .5) * 46; py += Math.random() * 26; x.lineTo(px, py); }
    x.stroke();
  }
  return c;
}

export function initTextures() {
  const T = {};

  // --- ground / structure ---
  const gc = concreteBase(1024, 1024, '#a89e90', '#8d8375');
  { const x = gc.getContext('2d');
    stains(x, 1024, 1024, 22, 'rgba(120,80,40,0.16)');            // dust
    stains(x, 1024, 1024, 8, 'rgba(35,33,30,0.22)');              // oil stains
    x.strokeStyle = 'rgba(60,55,48,0.5)'; x.lineWidth = 3;        // expansion joints
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(i * 256, 0); x.lineTo(i * 256, 1024); x.stroke();
      x.beginPath(); x.moveTo(0, i * 256); x.lineTo(1024, i * 256); x.stroke();
    }
    x.strokeStyle = 'rgba(40,38,36,0.13)'; x.lineWidth = 24;      // tire tracks
    x.beginPath(); x.moveTo(120, -20); x.bezierCurveTo(340, 300, 180, 700, 520, 1050); x.stroke();
    x.beginPath(); x.moveTo(760, -20); x.bezierCurveTo(620, 380, 880, 640, 700, 1050); x.stroke();
  }
  T.ground = tex(gc, 10, 10);

  T.concrete = tex(concreteBase(), 1, 1);
  T.concreteDark = tex(concreteBase(256, 256, '#6f6a62', '#57534c'), 1, 1);

  { // asphalt for central lane
    const c = canvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#5c5a58'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.3, ['#4c4a48', '#6b6967', '#413f3d']);
    stains(x, 256, 256, 4, 'rgba(30,28,26,0.3)');
    T.asphalt = tex(c, 4, 4);
  }
  { // dirt (MST camp)
    const c = canvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#8a6b48'; x.fillRect(0, 0, 256, 256);
    noiseOver(x, 256, 256, 0.35, ['#75583a', '#9c7d56', '#63482e']);
    T.dirt = tex(c, 3, 3);
  }
  { // grass patches
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#5f7d3a'; x.fillRect(0, 0, 128, 128);
    noiseOver(x, 128, 128, 0.4, ['#4c682e', '#73924a', '#87a355']);
    T.grass = tex(c, 2, 2);
  }
  { // crate wood + stencil
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#a97f4e'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#9c7343' : '#b08657'; x.fillRect(0, i * 32, 128, 30); }
    x.strokeStyle = '#6b4f2c'; x.lineWidth = 4; x.strokeRect(3, 3, 122, 122);
    x.beginPath(); x.moveTo(4, 4); x.lineTo(124, 124); x.moveTo(124, 4); x.lineTo(4, 124); x.stroke();
    x.fillStyle = 'rgba(40,25,10,0.8)'; x.font = 'bold 17px Arial Black,sans-serif';
    x.textAlign = 'center'; x.fillText('FRÁGIL', 64, 60); x.fillText('TRETA®', 64, 82);
    T.crate = tex(c);
  }

  // --- graffiti walls (3 variants) ---
  T.graffiti = [0, 1, 2].map(v => {
    const c = concreteBase(512, 256, '#8f8880', '#76706a'), x = c.getContext('2d');
    // grime at the base
    const gr = x.createLinearGradient(0, 170, 0, 256);
    gr.addColorStop(0, 'rgba(40,32,22,0)'); gr.addColorStop(1, 'rgba(40,32,22,0.45)');
    x.fillStyle = gr; x.fillRect(0, 170, 512, 86);
    // faded old posters
    for (let i = 0; i < 3; i++) {
      x.fillStyle = ['#c8bfae', '#b8c0c8', '#cfc4b8'][i]; x.globalAlpha = 0.7;
      x.fillRect(30 + i * 160 + Math.random() * 20, 30 + Math.random() * 30, 90, 120); x.globalAlpha = 1;
    }
    const used = [...GRAFFITI].sort(() => Math.random() - .5).slice(0, 4);
    used.forEach((s, i) => {
      x.save();
      x.translate(60 + i * 120, 60 + (i % 2) * 90 + Math.random() * 20);
      x.rotate((Math.random() - .5) * .3);
      x.font = `bold ${26 + (i % 2) * 10}px Arial Black,Impact,sans-serif`;
      x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,0.85)';
      x.strokeText(s, 0, 0);
      x.fillStyle = GCOLORS[(v * 3 + i) % GCOLORS.length];
      x.fillText(s, 0, 0);
      x.restore();
    });
    // spray tags
    for (let i = 0; i < 5; i++) {
      x.strokeStyle = GCOLORS[(Math.random() * GCOLORS.length) | 0]; x.lineWidth = 3; x.globalAlpha = .8;
      x.beginPath(); const px = Math.random() * 480, py = 170 + Math.random() * 70;
      x.moveTo(px, py); x.bezierCurveTo(px + 30, py - 25, px + 50, py + 25, px + 80, py - 10); x.stroke();
    }
    x.globalAlpha = 1;
    return tex(c);
  });

  // --- fictional campaign posters ---
  const poster = (bg, fg, lines, big) => {
    const c = canvas(128, 192), x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 128, 192);
    x.fillStyle = 'rgba(255,255,255,0.92)'; x.fillRect(10, 10, 108, 92);
    x.fillStyle = fg; x.beginPath(); x.arc(64, 52, 26, 0, 7); x.fill(); // fictional candidate "face" circle
    x.fillStyle = '#222'; x.fillRect(48, 84, 32, 6);
    x.textAlign = 'center'; x.fillStyle = fg;
    x.font = `bold ${big ? 22 : 16}px Arial Black,sans-serif`;
    lines.forEach((l, i) => x.fillText(l, 64, 128 + i * 22));
    stains(x, 128, 192, 2, 'rgba(0,0,0,0.15)');
    return tex(c);
  };
  T.posters = [
    poster('#c62f2f', '#fff', ['ZÉ', 'CAPIVARA', '99'], true),
    poster('#1faa4d', '#ffd23f', ['DONA', 'MARIA', '77'], true),
    poster('#2b4d8f', '#fff', ['CANDIDATO', 'FICTÍCIO', 'PROMETO NADA']),
  ];

  // --- billboard: fictional social network ---
  {
    const c = canvas(512, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 512, 256);
    g.addColorStop(0, '#1b2a4a'); g.addColorStop(1, '#3b1b4a');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = '#ffd23f'; x.lineWidth = 8; x.strokeRect(6, 6, 500, 244);
    x.textAlign = 'center';
    x.font = 'bold 64px Arial Black,sans-serif'; x.fillStyle = '#fff';
    x.fillText('TretaTok', 256, 110);
    x.font = 'bold 22px Arial,sans-serif'; x.fillStyle = '#ffd23f';
    x.fillText('a rede social da treta™ — 40 milhões de tretas/dia', 256, 155);
    x.font = '18px Arial,sans-serif'; x.fillStyle = '#9adcff';
    x.fillText('@zecapivara segue você', 256, 200);
    for (let i = 0; i < 3; i++) { x.fillStyle = ['#ff3b3b', '#7dff9a', '#ff7ad9'][i]; x.beginPath(); x.arc(70 + i * 30, 200, 9, 0, 7); x.fill(); }
    T.billboard = tex(c);
  }

  // --- urna eletrônica front (fictional, generic) ---
  {
    const c = canvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#3a3f45'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#2b2f34'; x.fillRect(0, 0, 256, 30);
    x.fillStyle = '#bfe8c8'; x.fillRect(18, 44, 220, 90);            // screen
    x.fillStyle = '#22331f'; x.font = 'bold 20px monospace'; x.textAlign = 'center';
    x.fillText('VOTAÇÃO', 128, 82); x.fillText('ENCERRADA', 128, 108);
    x.fillText('FIM ⏻', 128, 128);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) {          // keypad
      x.fillStyle = '#d8d8d8'; x.fillRect(30 + k * 70, 150 + r * 24, 56, 18);
      x.fillStyle = '#333'; x.fillRect(30 + k * 70 + 22, 150 + r * 24 + 5, 12, 8);
    }
    x.fillStyle = '#57e05a'; x.fillRect(196, 150, 44, 18); x.fillStyle = '#e03232'; x.fillRect(196, 174, 44, 18);
    x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 2;          // cracks (broken prop)
    x.beginPath(); x.moveTo(10, 10); x.lineTo(90, 120); x.lineTo(60, 250); x.stroke();
    x.beginPath(); x.moveTo(250, 30); x.lineTo(170, 130); x.lineTo(210, 246); x.stroke();
    T.urna = tex(c);
  }

  // --- Brazil flag (simplified) ---
  {
    const c = canvas(180, 126), x = c.getContext('2d');
    x.fillStyle = '#159a3f'; x.fillRect(0, 0, 180, 126);
    x.fillStyle = '#ffd23f'; x.beginPath();
    x.moveTo(90, 12); x.lineTo(166, 63); x.lineTo(90, 114); x.lineTo(14, 63); x.closePath(); x.fill();
    x.fillStyle = '#2b4d8f'; x.beginPath(); x.arc(90, 63, 24, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(90, 95, 42, -2.2, -0.9); x.stroke();
    T.flagBR = tex(c);
  }

  // --- truck side ---
  {
    const c = canvas(512, 128), x = c.getContext('2d');
    x.fillStyle = '#1faa4d'; x.fillRect(0, 0, 512, 128);
    x.fillStyle = '#ffd23f'; x.fillRect(0, 88, 512, 40);
    x.font = 'bold 44px Arial Black,sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center';
    x.strokeStyle = '#0d5c28'; x.lineWidth = 8;
    x.strokeText('FRETE SUPREMO', 256, 58); x.fillText('FRETE SUPREMO', 256, 58);
    x.font = 'bold 17px Arial,sans-serif'; x.fillStyle = '#0d5c28';
    x.fillText('ENTREGA RÁPIDA · SÓ NÃO ENTREGA O JOGO', 256, 112);
    T.truckSide = tex(c);
  }

  // --- signs ---
  const sign = (bg, fg, text, sub) => {
    const c = canvas(256, 64), x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 256, 64);
    x.strokeStyle = fg; x.lineWidth = 4; x.strokeRect(3, 3, 250, 58);
    x.font = 'bold 26px Arial Black,sans-serif'; x.fillStyle = fg; x.textAlign = 'center';
    x.fillText(text, 128, sub ? 30 : 42);
    if (sub) { x.font = 'bold 13px Arial,sans-serif'; x.fillText(sub, 128, 52); }
    return tex(c);
  };
  T.signSindicato = sign('#8f1d1d', '#ffd23f', 'SINDICATO DOS SNIPERS', 'CATEGORIA T-1337 · FUNDADO EM PIXELÂNDIA');
  T.signBoteco = sign('#22331f', '#ffe9c4', 'BOTECO DO ZÉ', 'PASTEL · CALDO · TRETA NO FIADO');
  T.signPastel = sign('#e8bd25', '#8f1d1d', 'PASTEL DA TRETA', 'DE QUEIJO · DE CARNE · DE CLÍMAX');

  // striped awning
  {
    const c = canvas(128, 64), x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#e03232' : '#f2ead8'; x.fillRect(i * 16, 0, 16, 64); }
    T.awning = tex(c, 2, 1);
  }
  // tent fabric
  {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#b03030'; x.fillRect(0, 0, 128, 128);
    noiseOver(x, 128, 128, 0.25, ['#992626', '#c24343']);
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.font = 'bold 20px Arial Black,sans-serif'; x.textAlign = 'center';
    x.fillText('ACAMP.', 64, 58); x.fillText('TRETA LIVRE', 64, 84);
    T.tent = tex(c);
  }
  // conspiracy corkboard
  {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#a97f4e'; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#5c3d1e'; x.lineWidth = 6; x.strokeRect(3, 3, 122, 122);
    const notes = ['XÊROX', 'ZAP', '51??', 'PRINT', 'ÁUDIO'];
    notes.forEach((n, i) => {
      const px = 12 + (i % 3) * 40, py = 14 + ((i / 3) | 0) * 52;
      x.save(); x.translate(px, py); x.rotate((Math.random() - .5) * .4);
      x.fillStyle = '#f2ecd8'; x.fillRect(0, 0, 34, 26);
      x.fillStyle = '#333'; x.font = 'bold 8px Arial'; x.textAlign = 'center'; x.fillText(n, 17, 15);
      x.restore();
    });
    x.strokeStyle = '#d33'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(28, 26); x.lineTo(70, 70); x.lineTo(30, 78); x.lineTo(106, 30); x.lineTo(28, 26); x.stroke();
    T.corkboard = tex(c);
  }
  // metal
  T.metal = tex(concreteBase(128, 128, '#5a5f66', '#464b52'));

  // --- soft sprites (sun / cloud / muzzle flash) ---
  const clampTex = t => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = THREE.LinearFilter; return t; };
  {
    const c = canvas(128, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,244,214,1)'); g.addColorStop(0.35, 'rgba(255,214,140,0.55)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    T.sunSprite = clampTex(tex(c));
  }
  {
    const c = canvas(256, 128), x = c.getContext('2d');
    for (let i = 0; i < 15; i++) {
      const px = 30 + Math.random() * 196, py = 42 + Math.random() * 44, r = 18 + Math.random() * 26;
      const g = x.createRadialGradient(px, py, 2, px, py, r);
      g.addColorStop(0, 'rgba(255,252,246,0.55)'); g.addColorStop(1, 'rgba(255,252,246,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    }
    T.cloud = clampTex(tex(c));
  }
  {
    const c = canvas(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 1, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.3, 'rgba(255,210,110,0.9)'); g.addColorStop(1, 'rgba(255,160,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    // star spikes
    x.strokeStyle = 'rgba(255,230,150,0.9)'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(32, 2); x.lineTo(32, 62); x.moveTo(2, 32); x.lineTo(62, 32); x.stroke();
    T.flash = clampTex(tex(c));
  }

  // --- warm sky gradient ---
  {
    const c = canvas(16, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#6fa8e0'); g.addColorStop(0.45, '#a8c8e8');
    g.addColorStop(0.72, '#ffd9a0'); g.addColorStop(1, '#ffb877');
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    T.sky = tex(c);
    T.sky.wrapS = T.sky.wrapT = THREE.ClampToEdgeWrapping;
  }
  return T;
}
