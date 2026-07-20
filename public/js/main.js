// Boot, menus, settings, logo, main loop.
import * as THREE from 'three';
import { initTextures } from './textures.js';
import { CHARACTERS, buildCharacter } from './characters.js';
import { preloadCharacterAssets, buildCharacterModel, hasModel, GLB_CHARS } from './glbchars.js';
import { preloadMapProps } from './mapprops.js';
import { MAPS, MAP_IDS, DEFAULT_MAP, resolveMapId } from './maps.js';
import { Sfx } from './audio.js';
import { Game } from './game.js';
import { VERSION } from './version.js';

/* ---------------- settings & nickname ---------------- */
const SETTINGS_KEY = 'awpbr_settings';
const settings = Object.assign({ sens: 1, vol: 0.7, quality: 'med', speech: true, map: DEFAULT_MAP, wpnMode: 'all', bots: 4, difficulty: 'normal' },
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
sfx.speechEnabled = settings.speech !== false;
const sfxReady = sfx.loadManifest();

/* ---------------- selected map ---------------- */
const urlMap = new URLSearchParams(location.search).get('map');
let currentMap = resolveMapId(urlMap || settings.map);
settings.map = currentMap;

/* ---------------- menu backdrop (orbiting map) ---------------- */
// Mint building/statue GLBs used by the Brasília map (loaded once, cloned per placement).
const MAP_PROPS = ['congresso', 'catedral', 'ministerio', 'palacio', 'justica', 'tires', 'stall', 'tent', 'bus', 'drinkstand'];
let menuScene = new THREE.Scene();
MAPS[currentMap].build(menuScene, textures);
const menuCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
function rebuildMenuBackdrop() {
  menuScene = new THREE.Scene();
  MAPS[currentMap].build(menuScene, textures);
}
// The first backdrop is built before props load; rebuild once they're ready so the
// menu shows the real Brasília landmarks too.
preloadMapProps(MAP_PROPS).then(rebuildMenuBackdrop).catch(() => {});

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
// Each character shows off a weapon that fits their vibe (not everyone with an AK).
const CHAR_WEAPON = {
  esquerdomacho: 'pistol', sindicato: 'shotgun', mst: 'ak', doutora: 'm4', mistico: 'mp5',
  caminhoneiro: 'md97', influencer: 'deagle', sertanejo: 'revolver38', senhora: 'uzi',
  coach: 'scar', gotinha: 'mp5', farialimer: 'm4', bombado: 'lmg', hipster: 'uzi',
  dollynho: 'p90', et: 'awp', ancap: 'mosin',
};
const charWeapon = (id) => CHAR_WEAPON[id] || 'ak';
let pvToken = 0;
function pvSetChar(def) {
  const p = ensurePreview();
  // Swap to the real rigged GLB (idle) once loaded, if this is still the selection.
  const my = ++pvToken;
  const showBox = () => {   // procedural fallback (only when there's no GLB at all)
    if (p.model) p.scene.remove(p.model);
    p.mixer = null;
    p.model = buildCharacter(def).group;
    p.model.rotation.y = 0.4;
    p.scene.add(p.model);
  };
  if (GLB_CHARS.has(def.id)) {
    // Keep the PREVIOUS model visible while the real GLB streams in — never flash the
    // blocky placeholder for a character that has a real model (the pop-in bug).
    preloadCharacterAssets([def.id]).then(() => {
      if (my !== pvToken) return;
      const m = hasModel(def.id) ? buildCharacterModel(def, { weaponId: charWeapon(def.id) }) : null;
      if (!m) { showBox(); return; }
      if (p.model) p.scene.remove(p.model);
      m.group.rotation.y = 0.4;
      p.model = m.group; p.mixer = m.mixer;
      p.scene.add(m.group);
    }).catch(() => { if (my === pvToken) showBox(); });
  } else {
    showBox();
  }
}
function pvThumb(def) {
  // Box-only thumbnail (tiny icon) — never triggers a GLB load.
  const p = ensurePreview();
  if (p.model) { p.scene.remove(p.model); p.model = null; }
  p.mixer = null;
  const box = buildCharacter(def).group; box.rotation.y = 0.55;
  p.scene.add(box);
  p.r.render(p.scene, p.cam);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d').drawImage(p.r.domElement, 0, 0, 96, 96);
  p.scene.remove(box);
  return c.toDataURL();
}

/* ---------------- game lifecycle ---------------- */
let game = null, currentTeam = 'P', currentChar = CHARACTERS[0].id, selChar = null;
let submitted = true;   // stats da partida atual já enviados?
let registeredNick = ''; // nick usado no registro da sessão (token está atrelado a ele)
let heartbeatOff = false;
const params = new URLSearchParams(location.search);
const testMode = params.get('debug') === '1';

async function startGame(team, charId) {
  if (isMobile && !testMode) { show('mobile-warning'); return; }
  currentTeam = team; currentChar = charId;
  if (game) game.dispose();
  show(null);
  await sfxReady;   // make sure voice/CS samples are registered before round 1 sounds
  // Preload real GLB character models + shared animation clips (bots). Falls back to
  // procedural box meshes for any archetype that isn't modeled yet. Map props (statues)
  // load in parallel and are optional — the map renders fine if they're missing.
  await Promise.all([
    preloadCharacterAssets([...GLB_CHARS]),
    preloadMapProps(MAP_PROPS),
  ]);
  game = new Game({
    renderer, textures, sfx, settings,
    playerCharId: charId, playerTeam: team, mapId: currentMap,
    nickname: $('nick-input').value, testMode,
    onMatchEnd: recordMatchStats,
  });
  window.__game = game;
  submitted = false;
  retryPending();
  armSwitchHook();
  game.onOpenSettings = () => { game.setPaused(true); settingsReturn = 'pause-menu'; show('settings-panel'); };
  game.onToggleSpeech = () => {
    settings.speech = !settings.speech;
    sfx.speechEnabled = settings.speech;
    saveSettings();
    $('set-speech').checked = settings.speech;
    return settings.speech;
  };
  game.start();
  // registra nick no ranking global (silencioso se a API não estiver no ar)
  const nick = $('nick-input').value.trim();
  registeredNick = nick; heartbeatOff = false;
  if (nick && !testMode) {
    api('/api/register', {
      nick, token: getToken(),
      socials: socials.filter(s => s.handle),
    });
  }
  try { window.va?.('event', { name: 'game_start', data: { team, character: charId, map: currentMap } }); } catch {}
  if (!testMode) { try { renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {} }
}
function quitToMenu() {
  switchMode = false;   // never carry an in-match team-switch into the menu
  if (game) { game.dispose(); game = null; }
  if (document.pointerLockElement) document.exitPointerLock();
  show('main-menu');
}

/* ---------------- heartbeat (presença/mapa) ---------------- */
setInterval(async () => {
  if (!game || !registeredNick || testMode || heartbeatOff) return;
  const res = await api('/api/heartbeat', { nick: registeredNick, token: getToken() });
  if (res && res.error) heartbeatOff = true;   // token inválido etc. — para de martelar
}, 30_000);

/* ---------------- avatar upload (sem login — validado por nick+token) ---------------- */
$('avatar-btn').onclick = () => $('avatar-file').click();
$('avatar-file').onchange = async e => {
  const f = e.target.files[0];
  const nick = registeredNick || (nickEl.value || '').trim();
  if (!f || !nick) return;
  $('avatar-note').textContent = 'enviando…';
  try {
    const bmp = await createImageBitmap(f);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const s = Math.min(bmp.width, bmp.height);
    x.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 128, 128);
    const dataUrl = c.toDataURL('image/png');
    const res = await api('/api/avatar', { nick, token: getToken(), image: dataUrl });
    $('avatar-note').textContent = res && res.ok ? 'foto atualizada! ✓' : 'falhou: ' + (res?.error || 'sem conexão');
  } catch { $('avatar-note').textContent = 'falhou — tente outra imagem'; }
  e.target.value = '';
};

/* ---------------- menu wiring ---------------- */
$('btn-jogar').onclick = () => {
  if (!(nickEl.value || '').trim()) {
    nickEl.classList.add('invalid');
    nickEl.placeholder = 'DIGITE UM NICK PRIMEIRO!';
    nickEl.focus();
    setTimeout(() => nickEl.classList.remove('invalid'), 1500);
    return;   // sem nick, sem treta
  }
  sfx.uiClick();
  const firstEmpty = socials.find(s => !s.handle);
  if (firstEmpty) {
    document.querySelector('.social-item input')?.classList.add('invalid');
    setTimeout(() => document.querySelector('.social-item input')?.classList.remove('invalid'), 1200);
  }
  show('team-select');
};
$('btn-ranking').onclick = () => { sfx.uiClick(); showRanking(); };
$('ranking-back').onclick = () => { sfx.uiClick(); show('main-menu'); };
// carrossel de mapas: setas ‹ › trocam o mapa E o fundo 3D do menu
const mapNameEl = $('map-name');
let mapIdx = Math.max(0, MAP_IDS.indexOf(currentMap));
function stepMap(dir) {
  sfx.uiClick();
  mapIdx = (mapIdx + dir + MAP_IDS.length) % MAP_IDS.length;
  currentMap = resolveMapId(MAP_IDS[mapIdx]);
  settings.map = currentMap; saveSettings();
  mapNameEl.textContent = MAPS[currentMap].name;
  rebuildMenuBackdrop();
}
mapNameEl.textContent = MAPS[currentMap].name;
$('map-prev').onclick = () => stepMap(-1);
$('map-next').onclick = () => stepMap(1);
const wpnSel = { value: settings.wpnMode || 'all' };
// dropdown custom de modo de armas (com ícones SVG originais)
const WPN_ICONS = {
  all: `<svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M1 9l8-6 1 1-8 6-1-1zm20-2L13 1l-1 1 8 6 1-1z" fill="currentColor"/><rect x="9" y="6" width="4" height="7" fill="currentColor"/></svg>`,
  pistols: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 2h12v4H9v6H5V6H1V2z" fill="currentColor"/><rect x="9" y="1" width="4" height="3" fill="currentColor"/></svg>`,
  knife: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 12L14 1l4 1-3 11-8 2-6-3z" fill="currentColor"/><rect x="1" y="10" width="5" height="3" fill="currentColor"/></svg>`,
  awp: `<svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0" y="4" width="26" height="3" fill="currentColor"/><rect x="7" y="0" width="8" height="4" fill="currentColor"/><rect x="2" y="7" width="6" height="4" fill="currentColor"/></svg>`,
};
const WPN_MODES = [
  { id: 'all', label: 'TODAS' },
  { id: 'pistols', label: 'SÓ PISTOLAS' },
  { id: 'knife', label: 'SÓ FACA' },
  { id: 'awp', label: 'SÓ AWP' },
];
const wpnDdBtn = $('wpn-dd-btn'), wpnDdList = $('wpn-dd-list'), wpnDdLabel = $('wpn-dd-label');
function wpnLabel(id) {
  const m = WPN_MODES.find(m => m.id === id);
  wpnDdLabel.innerHTML = `<span class="dd-cur">${WPN_ICONS[id]}<span>${m ? m.label : id}</span></span>`;
}
wpnDdList.innerHTML = WPN_MODES.map(m =>
  `<button class="dd-item" data-id="${m.id}" type="button">${WPN_ICONS[m.id]}<span>${m.label}</span></button>`).join('');
wpnLabel(wpnSel.value);
wpnDdBtn.onclick = e => { e.stopPropagation(); wpnDdList.classList.toggle('hidden'); wpnDdBtn.classList.toggle('open'); };
document.addEventListener('click', () => { wpnDdList.classList.add('hidden'); wpnDdBtn.classList.remove('open'); });
wpnDdList.querySelectorAll('.dd-item').forEach(b => b.onclick = () => {
  settings.wpnMode = b.dataset.id; saveSettings();
  wpnLabel(settings.wpnMode); sfx.uiClick();
});
// bots-per-side + difficulty selectors (custom match)
const botsSel = $('bots-select');
if (botsSel) {
  [2, 3, 4, 5, 6, 7, 8].forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = `${n} vs ${n}`; botsSel.appendChild(o); });
  botsSel.value = settings.bots || 4;
  botsSel.onchange = () => { settings.bots = +botsSel.value; saveSettings(); sfx.uiClick(); };
}
const diffSel = $('diff-select');
if (diffSel) {
  [['easy', 'FÁCIL'], ['normal', 'NORMAL'], ['hard', 'DIFÍCIL'], ['insane', 'INSANO']].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; diffSel.appendChild(o); });
  diffSel.value = settings.difficulty || 'normal';
  diffSel.onchange = () => { settings.difficulty = diffSel.value; saveSettings(); sfx.uiClick(); };
}
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
$('btn-quit').onclick = () => {
  sfx.uiClick();
  const pl = partialPayload();
  if (pl) { submitted = true; submitGlobal(pl); }
  quitToMenu();
};
$('btn-again').onclick = () => { sfx.uiClick(); startGame(currentTeam, currentChar); };
$('btn-menu').onclick = () => { sfx.uiClick(); quitToMenu(); };
// M in-game: escolhe o personagem do novo time antes de trocar
let switchMode = false;
function armSwitchHook() {
  game.onRequestSwitch = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    switchMode = true;
    pickTeam(game.enemyTeam);
  };
}
$('char-confirm').onclick = () => {
  sfx.uiClick();
  if (!selChar) return;
  // Only take the in-match "switch team" path when there's a live game to switch;
  // a stale switchMode flag (e.g. backed out of M) must NOT hit game._switchTeam on a
  // disposed game — that used to throw and leave the next match unable to load.
  if (switchMode && game) {
    switchMode = false;
    currentChar = selChar.id;
    show(null);
    try { game._switchTeam(selChar.id); } catch (e) { console.error('switch team failed', e); }
    game.resume();   // unpause + re-request pointer lock (fixes "M opens but game won't resume")
  } else {
    switchMode = false;
    startGame(currentTeam, selChar.id);
  }
};

const nickEl = $('nick-input');
nickEl.value = localStorage.getItem(NICK_KEY) || '';
nickEl.oninput = () => localStorage.setItem(NICK_KEY, nickEl.value);
const SOCIAL_NET_KEY = 'awpbr_social_net'; // legado (migração pro multi-redes)
function sanitizeHandle(v) { return v.replace(/^@+/, '').replace(/[^a-zA-Z0-9._-]/g, ''); }
function extractFromUrl(v) {
  const m = v.match(/(?:x\.com|twitter\.com|github\.com|instagram\.com|tiktok\.com\/@|youtube\.com\/@|linkedin\.com\/in)\/?@?([A-Za-z0-9._-]+)/i);
  return m ? m[1] : null;
}

/* ---------------- multi-redes sociais (até 3, sem login) ---------------- */
const SOCIALS_KEY = 'awpbr_socials';
const NETS = [['x', 'X / Twitter'], ['github', 'GitHub'], ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['site', 'Site próprio']];
let socials = [];
try { socials = JSON.parse(localStorage.getItem(SOCIALS_KEY) || '[]'); } catch {}
// migração do campo único antigo
if (!socials.length) {
  const oldNet = localStorage.getItem(SOCIAL_NET_KEY), oldHandle = localStorage.getItem(SOCIAL_KEY);
  if (oldNet && oldHandle) socials = [{ net: oldNet, handle: oldHandle }];
}
function saveSocials() {
  localStorage.setItem(SOCIALS_KEY, JSON.stringify(socials));
  updateAvatarVisibility();
}
function updateAvatarVisibility() {
  const hasAuto = socials.some(s => ['x', 'github'].includes(s.net) && s.handle);
  $('avatar-row').classList.toggle('hidden', hasAuto || !(nickEl.value || '').trim());
}
function renderSocials() {
  const list = $('social-list');
  list.innerHTML = '';
  socials.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'pc-row social-item';
    row.innerHTML =
      `<select>${NETS.map(([v, l]) => `<option value="${v}"${v === s.net ? ' selected' : ''}>${l}</option>`).join('')}</select>` +
      `<input maxlength="40" placeholder="usuário" value="${String(s.handle).replace(/"/g, '&quot;')}">` +
      `<button class="social-del" title="remover" type="button">✕</button>`;
    const sel = row.querySelector('select'), inp = row.querySelector('input'), del = row.querySelector('.social-del');
    sel.onchange = () => { s.net = sel.value; saveSocials(); };
    inp.oninput = () => {
      let v = extractFromUrl(inp.value) || inp.value;
      v = sanitizeHandle(v);
      if (v !== inp.value) inp.value = v;
      s.handle = v; saveSocials();
    };
    del.onclick = () => { socials.splice(i, 1); saveSocials(); renderSocials(); };
    list.appendChild(row);
  });
  $('social-add').classList.toggle('hidden', socials.length >= 3);
}
$('social-add').onclick = () => { socials.push({ net: 'x', handle: '' }); saveSocials(); renderSocials(); };
nickEl.addEventListener('input', updateAvatarVisibility);
renderSocials();

/* ---------------- global ranking API (via /api/* do site) ---------------- */
const TOKEN_KEY = 'awpbr_token';
function getToken() {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) { t = crypto.randomUUID(); localStorage.setItem(TOKEN_KEY, t); }
  return t;
}
async function api(path, body) {
  try {
    const r = await fetch(path, body
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
      : undefined);
    const j = await r.json().catch(() => ({}));
    return r.ok ? j : { error: j.error || `http_${r.status}` };
  } catch { return null; }
}
function submitNote(msg) {
  console.warn('[ranking]', msg);
  const el = document.getElementById('match-stats');
  if (el && !document.getElementById('match-end').classList.contains('hidden')) {
    const d = document.createElement('div');
    d.style.cssText = 'color:#ff8080;font-size:12px;width:100%';
    d.textContent = '⚠ stats não enviados: ' + msg;
    el.appendChild(d);
  }
}

// stats parciais quando o jogador abandona a partida (sair pro menu / fechar aba)
function partialPayload() {
  if (!game || submitted || testMode) return null;
  if (!['live', 'roundEnd', 'countdown'].includes(game.state)) return null;
  const g = game, p = g.player;
  const rounds = g.roundsWon.P + g.roundsWon.B;
  if (!p.kills && !p.deaths && !rounds && g.time < 30) return null;
  const nick = registeredNick || (nickEl.value || '').trim();
  if (!nick) return null;
  return {
    nick, token: getToken(), won: false, kills: p.kills, deaths: p.deaths,
    headshots: p.headshots || 0, bestStreak: g.mk.best || 0, rounds, team: g.playerTeam,
    seconds: Math.round(g.time), character: currentChar,
  };
}
addEventListener('beforeunload', () => {
  const pl = partialPayload();
  if (pl) navigator.sendBeacon('/api/submit-match', new Blob([JSON.stringify(pl)], { type: 'application/json' }));
});

/* ---------------- fila de reenvio (rate limit do servidor) ---------------- */
const PENDING_KEY = 'awpbr_pending_submit';
async function submitGlobal(pl) {
  const res = await api('/api/submit-match', pl);
  if (res?.error && /aguarde/i.test(res.error)) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pl));
    setTimeout(retryPending, 95_000);   // reenvia sozinho quando a janela abrir
  }
  return res;
}
async function retryPending() {
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return;
  const res = await api('/api/submit-match', JSON.parse(raw));
  if (res && !res.error) localStorage.removeItem(PENDING_KEY);
  else if (res?.error && /aguarde/i.test(res.error)) setTimeout(retryPending, 95_000);
}

/* ---------------- local stats (espelhados pro ranking global) ---------------- */
const STATS_KEY = 'awpbr_stats';
function loadStats() {
  return Object.assign({ matches: 0, wins: 0, kills: 0, deaths: 0, headshots: 0, bestStreak: 0 },
    JSON.parse(localStorage.getItem(STATS_KEY) || '{}'));
}
async function recordMatchStats(s) {
  submitted = true;
  const st = loadStats();
  st.matches++; if (s.won) st.wins++;
  st.kills += s.kills; st.deaths += s.deaths; st.headshots += s.headshots;
  st.playSeconds = (st.playSeconds || 0) + (s.seconds || 0);
  st.rounds = (st.rounds || 0) + s.roundsP + s.roundsB;
  st.bestStreak = Math.max(st.bestStreak, s.bestStreak);
  localStorage.setItem(STATS_KEY, JSON.stringify(st));
  // espelha pro ranking global (avisa na tela se falhar)
  const nick = registeredNick || (nickEl.value || '').trim();
  if (nick && !testMode) {
    const res = await submitGlobal({
      nick, token: getToken(), won: s.won, kills: s.kills, deaths: s.deaths,
      headshots: s.headshots, bestStreak: s.bestStreak,
      rounds: s.roundsP + s.roundsB, team: s.team, seconds: s.seconds || 0,
      character: s.character,
    });
    if (!res) submitNote('ranking global indisponível');
    else if (res.error) submitNote(res.error);
  }
}
function showRanking() {
  const st = loadStats();
  const kd = st.deaths ? (st.kills / st.deaths).toFixed(2) : st.kills.toFixed(2);
  const fmt = (s) => { const m = Math.round(s / 60); return m < 60 ? `${m}min` : m < 1440 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`; };
  const secs = st.playSeconds || 0;
  const tempo = secs > 0 ? fmt(secs)
    : (st.rounds || 0) > 0 ? `~${fmt(st.rounds * 99)}`
    : st.matches > 0 ? `~${fmt(st.matches * 297)}` : '0min';
  const nick = (nickEl.value || 'VOCÊ').trim();
  const social = socials.find(s => s.handle);
  $('rank-local').innerHTML =
    `<div style="grid-column:1/-1;text-align:center;color:var(--cs);font-size:18px">${nick}` +
    (social ? ` · <span style="color:#8a8064;font-size:12px">${social.net}/${social.handle.replace(/</g, '&lt;')}</span>` : '') + `</div>` +
    `<div><b>${st.matches}</b>partidas</div><div><b>${st.wins > 0 ? st.wins : "—"}</b>vitórias</div><div><b>${kd}</b>K/D</div><div><b>${tempo}</b>arena</div>` +
    `<div><b>${st.kills}</b>kills</div><div><b>${st.deaths}</b>mortes</div><div><b>${st.headshots}</b>headshots</div><div><b>${st.rounds || 0}</b>rounds</div>`;
  show('ranking-panel');
  renderGlobal(nick);
}
async function renderGlobal(nick) {
  const box = $('rank-global');
  box.innerHTML = '<h3>🌐 RANKING GLOBAL</h3><div class="rg-off">carregando…</div>';
  const data = await api('/api/leaderboard');
  if (!data || !data.players) {
    box.innerHTML = '<h3>🌐 RANKING GLOBAL</h3><div class="rg-off">indisponível no momento</div>';
    return;
  }
  const rows = data.players.slice(0, 10).map((p, i) =>
    `<tr class="${p.nick === nick ? 'me' : ''}"><td>${i + 1}</td><td>${p.nick}</td><td>${p.kd}</td><td>${p.kills}</td><td>${p.wins > 0 ? p.wins : "—"}</td></tr>`).join('');
  box.innerHTML = '<h3>🌐 RANKING GLOBAL (top 10)</h3>' +
    (rows
      ? `<table><tr><th>#</th><th>JOGADOR</th><th>K/D</th><th>KILLS</th><th>VIT.</th></tr>${rows}</table>`
      : '<div class="rg-off">ainda vazio — seja o primeiro!</div>') +
    `<div class="rg-links"><a href="/ranking" target="_blank" style="color:var(--cs)">RANKING COMPLETO ↗</a>` +
    (nick ? `<a href="/u/${encodeURIComponent(nick)}" target="_blank" style="color:var(--cs)">MEU PERFIL ↗</a>` : '') +
    `<a href="/mapa" target="_blank" style="color:var(--cs)">MAPA AO VIVO ↗</a></div>`;
}

// GLB idle thumbnail (no weapon), rendered off the shared preview renderer.
function glbThumb(def) {
  const p = ensurePreview();
  if (!hasModel(def.id)) return null;
  const m = buildCharacterModel(def, { weapon: false });
  if (!m) return null;
  m.group.rotation.y = 0.5;
  for (let i = 0; i < 42; i++) m.mixer.update(1 / 60); // settle into the idle pose
  const prevVis = p.model ? p.model.visible : false;
  if (p.model) p.model.visible = false;
  p.scene.add(m.group);
  p.r.render(p.scene, p.cam);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d').drawImage(p.r.domElement, 0, 0, 96, 96);
  p.scene.remove(m.group);
  if (p.model) p.model.visible = prevVis;
  return c.toDataURL();
}
function pickTeam(team) {
  currentTeam = team;
  const list = $('char-list');
  list.innerHTML = '';
  const chars = CHARACTERS.filter(c => c.team === team);
  let firstRow = null;
  const imgs = [];
  chars.forEach((c, i) => {
    const row = document.createElement('button');
    row.className = 'char-row';
    row.innerHTML = `<img src="${pvThumb(c)}" alt="${c.name}"><span>${c.name}</span>`;
    imgs.push(row.querySelector('img'));
    row.onclick = () => { sfx.uiClick(); selectChar(c, row); };
    list.appendChild(row);
    if (i === 0) firstRow = row;
  });
  // seleciona DEPOIS de gerar todos os thumbs — senão o preview fica com o último
  if (firstRow) selectChar(chars[0], firstRow);
  show('char-select');
  // Upgrade the box placeholders to real GLB: preload all team models once, then swap
  // each thumbnail and refresh the main preview (so the first load isn't stuck on box).
  preloadCharacterAssets(chars.map(c => c.id)).then(() => {
    chars.forEach((c, i) => { const url = glbThumb(c); if (url && imgs[i]) imgs[i].src = url; });
    if (selChar) pvSetChar(selChar);
  }).catch(() => {});
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
const speechEl = $('set-speech');
speechEl.checked = settings.speech !== false;
speechEl.onchange = () => {
  settings.speech = speechEl.checked;
  sfx.speechEnabled = settings.speech;
  saveSettings();
  if (game?.el?.hudSpeech) game.el.hudSpeech.textContent = settings.speech ? '🔊' : '🔇';
};
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
  const csOpen = !$('char-select').classList.contains('hidden');
  // While the char-select is open mid-match (pressing M to switch teams), the game
  // auto-pauses — so we must NOT keep rendering it here, and we MUST still spin the
  // preview. Rendering the preview only lived in the menu branch before, which is
  // why M froze the selector.
  if (game && !csOpen) {
    game.update(dt);
  } else if (!game) {
    menuAngle += dt * 0.07;
    menuCam.position.set(Math.sin(menuAngle) * 34, 17 + Math.sin(menuAngle * 0.6) * 4, Math.cos(menuAngle) * 34);
    menuCam.lookAt(0, 1, 0);
    renderer.render(menuScene, menuCam);
  }
  if (csOpen && pv && pv.model) {
    pv.model.rotation.y += dt * 0.9;
    if (pv.mixer) pv.mixer.update(dt);
    pv.r.render(pv.scene, pv.cam);
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
