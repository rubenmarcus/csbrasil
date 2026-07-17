// Boot, menus, settings, logo, main loop.
import * as THREE from 'three';
import { initTextures } from './textures.js';
import { CHARACTERS, buildCharacter } from './characters.js';
import { buildWorld } from './map.js';
import { Sfx } from './audio.js';
import { Game } from './game.js';
import { VERSION } from './version.js';

/* ---------------- settings & nickname ---------------- */
const SETTINGS_KEY = 'awpbr_settings';
const settings = Object.assign({ sens: 1, vol: 0.7, quality: 'med' },
  JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
const saveSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
const NICK_KEY = 'awpbr_nick';
const SOCIAL_KEY = 'awpbr_social';

/* ---------------- renderer ---------------- */
const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
container.appendChild(renderer.domElement);

const textures = initTextures();
const sfx = new Sfx(); sfx.vol = settings.vol;
const sfxReady = sfx.loadManifest();

/* ---------------- menu backdrop (orbiting map) ---------------- */
const menuScene = new THREE.Scene();
buildWorld(menuScene, textures);
const menuCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);

/* ---------------- screens ---------------- */
const screens = ['mobile-warning', 'main-menu', 'team-select', 'char-select', 'settings-panel', 'howto-panel', 'ranking-panel', 'pause-menu', 'match-end'];
function show(id) {
  for (const s of screens) document.getElementById(s).classList.toggle('hidden', s !== id);
  if (!id) for (const s of screens) document.getElementById(s).classList.add('hidden');
}
const $ = id => document.getElementById(id);
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
let settingsReturn = 'main-menu';

/* ---------------- 3D character preview ---------------- */
let pv = null;
function ensurePreview() {
  if (pv) return pv;
  const canvas = $('char-preview');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setSize(340, 340, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffe6c0, 0x5a4a38, 1.1));
  const key = new THREE.DirectionalLight(0xffe0b3, 1.8); key.position.set(2, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.55); rim.position.set(-3, 2, -2); scene.add(rim);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 26), new THREE.MeshLambertMaterial({ color: 0x2e331f }));
  disc.position.y = -0.03; disc.receiveShadow = true; scene.add(disc);
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
  cam.position.set(0, 1.3, 3.2); cam.lookAt(0, 0.92, 0);
  pv = { r, scene, cam, model: null };
  return pv;
}
function pvSetChar(def) {
  const p = ensurePreview();
  if (p.model) p.scene.remove(p.model);
  p.model = buildCharacter(def).group;
  p.model.rotation.y = 0.4;
  p.scene.add(p.model);
}
function pvThumb(def) {
  pvSetChar(def);
  const p = ensurePreview();
  p.model.rotation.y = 0.55;
  p.r.render(p.scene, p.cam);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d').drawImage(p.r.domElement, 0, 0, 96, 96);
  return c.toDataURL();
}

/* ---------------- game lifecycle ---------------- */
let game = null, currentTeam = 'P', currentChar = CHARACTERS[0].id, selChar = null;
const params = new URLSearchParams(location.search);
const testMode = params.get('debug') === '1';

async function startGame(team, charId) {
  if (isMobile && !testMode) { show('mobile-warning'); return; }
  currentTeam = team; currentChar = charId;
  if (game) game.dispose();
  show(null);
  await sfxReady;   // make sure voice/CS samples are registered before round 1 sounds
  game = new Game({
    renderer, textures, sfx, settings,
    playerCharId: charId, playerTeam: team,
    nickname: $('nick-input').value, testMode,
    onMatchEnd: recordMatchStats,
  });
  window.__game = game;
  game.start();
  try { window.va?.('event', { name: 'game_start', data: { team, character: charId } }); } catch {}
  if (!testMode) { try { renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {} }
}
function quitToMenu() {
  if (game) { game.dispose(); game = null; }
  if (document.pointerLockElement) document.exitPointerLock();
  show('main-menu');
}

/* ---------------- menu wiring ---------------- */
$('btn-jogar').onclick = () => { sfx.uiClick(); show('team-select'); };
$('btn-ranking').onclick = () => { sfx.uiClick(); showRanking(); };
$('ranking-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('btn-howto').onclick = () => { sfx.uiClick(); show('howto-panel'); };
$('howto-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('btn-settings').onclick = () => { sfx.uiClick(); settingsReturn = 'main-menu'; show('settings-panel'); };
$('settings-back').onclick = () => {
  sfx.uiClick(); saveSettings();
  if (game) game.applySettings();
  show(settingsReturn);
};
$('mobile-ok').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('team-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
$('char-back').onclick = () => { sfx.uiClick(); show('team-select'); };
$('btn-team-p').onclick = () => { sfx.uiClick(); pickTeam('P'); };
$('btn-team-b').onclick = () => { sfx.uiClick(); pickTeam('B'); };
$('btn-resume').onclick = () => { sfx.uiClick(); game?.resume(); };
$('btn-pause-settings').onclick = () => { sfx.uiClick(); settingsReturn = 'pause-menu'; show('settings-panel'); };
$('btn-quit').onclick = () => { sfx.uiClick(); quitToMenu(); };
$('btn-again').onclick = () => { sfx.uiClick(); startGame(currentTeam, currentChar); };
$('btn-menu').onclick = () => { sfx.uiClick(); quitToMenu(); };
$('char-confirm').onclick = () => { sfx.uiClick(); if (selChar) startGame(currentTeam, selChar.id); };

const nickEl = $('nick-input');
nickEl.value = localStorage.getItem(NICK_KEY) || '';
nickEl.oninput = () => localStorage.setItem(NICK_KEY, nickEl.value);
const socialEl = $('social-input');
socialEl.value = localStorage.getItem(SOCIAL_KEY) || '';
socialEl.oninput = () => localStorage.setItem(SOCIAL_KEY, socialEl.value);

/* ---------------- local stats (futuro ranking global via Supabase) ---------------- */
const STATS_KEY = 'awpbr_stats';
function loadStats() {
  return Object.assign({ matches: 0, wins: 0, kills: 0, deaths: 0, headshots: 0, bestStreak: 0 },
    JSON.parse(localStorage.getItem(STATS_KEY) || '{}'));
}
function recordMatchStats(s) {
  const st = loadStats();
  st.matches++; if (s.won) st.wins++;
  st.kills += s.kills; st.deaths += s.deaths; st.headshots += s.headshots;
  st.bestStreak = Math.max(st.bestStreak, s.bestStreak);
  localStorage.setItem(STATS_KEY, JSON.stringify(st));
}
function showRanking() {
  const st = loadStats();
  const kd = st.deaths ? (st.kills / st.deaths).toFixed(2) : st.kills.toFixed(2);
  const nick = (nickEl.value || 'VOCÊ').trim();
  const social = socialEl.value.trim();
  $('rank-local').innerHTML =
    `<div style="grid-column:1/-1;text-align:center;color:var(--cs);font-size:18px">${nick}` +
    (social ? ` · <span style="color:#8a8064;font-size:12px">${social.replace(/</g, '&lt;')}</span>` : '') + `</div>` +
    `<div><b>${st.matches}</b>partidas</div><div><b>${st.wins}</b>vitórias</div><div><b>${kd}</b>K/D</div>` +
    `<div><b>${st.kills}</b>abates</div><div><b>${st.headshots}</b>headshots</div><div><b>${st.bestStreak}×</b>melhor sequência</div>`;
  show('ranking-panel');
}

function pickTeam(team) {
  currentTeam = team;
  const list = $('char-list');
  list.innerHTML = '';
  CHARACTERS.filter(c => c.team === team).forEach((c, i) => {
    const row = document.createElement('button');
    row.className = 'char-row';
    row.innerHTML = `<img src="${pvThumb(c)}" alt="${c.name}"><span>${c.name}</span>`;
    row.onclick = () => { sfx.uiClick(); selectChar(c, row); };
    list.appendChild(row);
    if (i === 0) selectChar(c, row);
  });
  show('char-select');
}
function selectChar(c, row) {
  selChar = c;
  document.querySelectorAll('.char-row').forEach(r => r.classList.remove('sel'));
  row.classList.add('sel');
  pvSetChar(c);
  $('char-info-name').textContent = c.name;
  $('char-info-blurb').textContent = c.blurb;
}

/* ---------------- settings wiring ---------------- */
const sensEl = $('set-sens'), volEl = $('set-vol'), qualEl = $('set-quality');
sensEl.value = settings.sens; volEl.value = settings.vol; qualEl.value = settings.quality;
const updLabels = () => {
  $('set-sens-val').textContent = Number(settings.sens).toFixed(1);
  $('set-vol-val').textContent = Math.round(settings.vol * 100) + '%';
};
sensEl.oninput = () => { settings.sens = +sensEl.value; updLabels(); saveSettings(); };
volEl.oninput = () => { settings.vol = +volEl.value; sfx.setVolume(settings.vol); updLabels(); saveSettings(); };
qualEl.onchange = () => { settings.quality = qualEl.value; saveSettings(); if (game) game.applySettings(); };
updLabels();

/* ---------------- logo ---------------- */
(function drawLogo() {
  const c = $('logo-canvas'), x = c.getContext('2d');
  const W = 900, H = 360;
  const g = x.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 420);
  g.addColorStop(0, 'rgba(255,180,80,0.30)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // skyline silhouette
  x.fillStyle = 'rgba(18,16,20,0.9)';
  x.fillRect(120, 250, 660, 110);
  x.fillRect(398, 170, 14, 90); x.fillRect(428, 170, 14, 90);   // congress towers
  x.beginPath(); x.arc(360, 252, 34, Math.PI, 0); x.fill();      // dome
  x.beginPath(); x.arc(486, 216, 34, 0, Math.PI); x.fill();      // bowl
  for (let i = 0; i < 7; i++) {                                  // cathedral spikes
    x.save(); x.translate(210 + i * 16, 260); x.rotate((i - 3) * 0.12);
    x.fillRect(-2, -46, 4, 46); x.restore();
  }
  // crossed rifles
  const rifle = (color) => {
    x.fillStyle = '#1c1c1c';
    x.fillRect(-130, -7, 150, 14);
    x.fillRect(20, -3.5, 110, 7);
    x.fillRect(-40, -20, 55, 11);
    x.beginPath(); x.moveTo(-130, -7); x.lineTo(-165, 14); x.lineTo(-130, 14); x.closePath(); x.fill();
    x.fillStyle = color; x.fillRect(-128, 5, 145, 4);
  };
  x.save(); x.translate(W / 2, 190); x.rotate(-0.42); rifle('#e03232'); x.restore();
  x.save(); x.translate(W / 2, 190); x.scale(-1, 1); x.rotate(-0.42); rifle('#1faa4d'); x.restore();
  // Brazil silhouette, split colors + crack
  const BR = [[.32, .05], [.45, .02], [.58, .07], [.62, .14], [.75, .13], [.85, .20], [.97, .27],
    [.90, .33], [.86, .40], [.80, .50], [.74, .58], [.70, .68], [.62, .75], [.58, .86], [.52, .97],
    [.46, .90], [.44, .78], [.38, .72], [.32, .68], [.28, .60], [.30, .50], [.24, .44], [.18, .38], [.16, .28], [.22, .22], [.24, .13]];
  const bw = 190, bh = 190, bx = W / 2 - bw / 2, by = 92;
  const path = () => {
    x.beginPath();
    BR.forEach((p, i) => i ? x.lineTo(bx + p[0] * bw, by + p[1] * bh) : x.moveTo(bx + p[0] * bw, by + p[1] * bh));
    x.closePath();
  };
  x.save(); path(); x.clip();
  let hg = x.createLinearGradient(bx, 0, bx + bw, 0);
  hg.addColorStop(0, '#8f1d1d'); hg.addColorStop(1, '#e03232');
  x.fillStyle = hg; x.fillRect(bx, by, bw / 2, bh);
  hg = x.createLinearGradient(bx + bw / 2, 0, bx + bw, 0);
  hg.addColorStop(0, '#1faa4d'); hg.addColorStop(1, '#e8bd25');
  x.fillStyle = hg; x.fillRect(bx + bw / 2, by, bw / 2, bh);
  x.strokeStyle = '#f2ead8'; x.lineWidth = 4; x.beginPath();
  let cx = bx + bw * 0.52, cy = by;
  x.moveTo(cx, cy);
  while (cy < by + bh) { cx += (Math.random() - .5) * 26; cy += 14 + Math.random() * 10; x.lineTo(cx, cy); }
  x.stroke(); x.restore();
  path(); x.strokeStyle = '#0c0e11'; x.lineWidth = 5; x.stroke();
  // title
  x.textAlign = 'center';
  x.font = '900 96px "Arial Black",Impact,sans-serif';
  x.lineWidth = 14; x.strokeStyle = '#0c0e11'; x.lineJoin = 'round';
  x.strokeText('CS BRASIL', W / 2, 96);
  const tg = x.createLinearGradient(0, 30, 0, 100);
  tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#ffd9a0');
  x.fillStyle = tg; x.fillText('CS BRASIL', W / 2, 96);
  x.font = '900 52px "Arial Black",Impact,sans-serif';
  x.lineWidth = 10;
  x.strokeText('TRETA SUPREMA', W / 2, 338);
  const sg = x.createLinearGradient(200, 0, 700, 0);
  sg.addColorStop(0, '#ff6b6b'); sg.addColorStop(0.5, '#ffd23f'); sg.addColorStop(1, '#7dff9a');
  x.fillStyle = sg; x.fillText('TRETA SUPREMA', W / 2, 338);
})();

/* ---------------- loop ---------------- */
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  menuCam.aspect = innerWidth / innerHeight; menuCam.updateProjectionMatrix();
  if (game) game.onResize();
});
const clock = new THREE.Clock();
let menuAngle = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  if (game) {
    game.update(dt);
  } else {
    menuAngle += dt * 0.07;
    menuCam.position.set(Math.sin(menuAngle) * 34, 17 + Math.sin(menuAngle * 0.6) * 4, Math.cos(menuAngle) * 34);
    menuCam.lookAt(0, 1, 0);
    renderer.render(menuScene, menuCam);
    if (pv && pv.model && !$('char-select').classList.contains('hidden')) {
      pv.model.rotation.y += dt * 0.9;
      pv.r.render(pv.scene, pv.cam);
    }
  }
}
loop();

/* ---------------- boot ---------------- */
document.querySelector('.footnote').textContent =
  `v${VERSION} · Sátira política fictícia. Nenhum político real foi consultado (ou poupado).`;
show(isMobile && !testMode ? 'mobile-warning' : 'main-menu');
if (testMode && params.get('auto')) {
  const [team, char] = params.get('auto').split(',');
  startGame(team || 'P', char || CHARACTERS[0].id);
}
