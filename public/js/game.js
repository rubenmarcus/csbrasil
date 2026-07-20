// Core game: FPS controller, weapons, bots, rounds, HUD.
import * as THREE from 'three';
import { MAPS, resolveMapId } from './maps.js';
import { buildCharacter, poseCharacter, byId, CHARACTERS, buildRifle } from './characters.js';
import { buildCharacterModel } from './glbchars.js';
import { weaponModel, weaponCFG, ONE_HANDED, WEAPON_IDS } from './weapons.js';

export const WEAPONS = {
  awp:    { name: 'AWP "DELIBERADOR"', short: 'AWP', dmg: 400, mag: 5, reserve: 25, rate: 1.7, reload: 3.1, spreadHip: 0.075, spreadScope: 0.0008, recoil: 0.055, scope: true },
  ak:     { name: 'AK-47 "BATE-ESTACA"', short: 'AK', dmg: 33, mag: 30, reserve: 90, rate: 0.1, reload: 2.5, spreadHip: 0.024, recoil: 0.008, auto: true },
  m4:     { name: 'M4A1 "REQUINTE"', short: 'M4', dmg: 31, mag: 30, reserve: 90, rate: 0.09, reload: 2.4, spreadHip: 0.02, recoil: 0.007, auto: true },
  mp5:    { name: 'MP5 "VASSOURA"', short: 'MP5', dmg: 26, mag: 30, reserve: 120, rate: 0.075, reload: 2.2, spreadHip: 0.03, recoil: 0.005, auto: true },
  shotgun:{ name: 'M3 "CONVERSA FIADA"', short: 'M3', dmg: 12, pellets: 8, mag: 7, reserve: 32, rate: 0.9, reload: 3.0, spreadHip: 0.06, recoil: 0.045 },
  deagle: { name: 'DEAGLE "MARTELO"', short: 'DE', dmg: 53, mag: 7, reserve: 35, rate: 0.28, reload: 2.0, spreadHip: 0.012, recoil: 0.03 },
  pistol: { name: 'PT-38 "APITO"', short: 'PT-38', dmg: 34, mag: 12, reserve: 48, rate: 0.24, reload: 1.6, spreadHip: 0.02, recoil: 0.014, scope: false },
  knife:  { name: 'FACA "CONVERSA FIADA"', short: 'FACA', dmg: 55, rate: 0.55, range: 2.4, reload: 0, recoil: 0.02, scope: false },
  // arsenal 2 (BR)
  m92:       { name: 'ZASTAVA M92 "IOGUSLAVO"', short: 'M92', dmg: 32, mag: 30, reserve: 90, rate: 0.1, reload: 2.5, spreadHip: 0.026, recoil: 0.009, auto: true },
  akm:       { name: 'AKM "KALASH DA VÉIA"', short: 'AKM', dmg: 35, mag: 30, reserve: 90, rate: 0.105, reload: 2.5, spreadHip: 0.025, recoil: 0.009, auto: true },
  g3:        { name: 'HK G3 "FRITZ"', short: 'G3', dmg: 37, mag: 20, reserve: 80, rate: 0.11, reload: 2.6, spreadHip: 0.022, recoil: 0.013, auto: true },
  revolver38:{ name: 'REVÓLVER .38 "TROVÃO"', short: '.38', dmg: 46, mag: 6, reserve: 24, rate: 0.36, reload: 2.4, spreadHip: 0.016, recoil: 0.03 },
  md97:      { name: 'MD97 "FUZIL DA PÁTRIA"', short: 'MD97', dmg: 38, mag: 20, reserve: 80, rate: 0.12, reload: 2.6, spreadHip: 0.022, recoil: 0.012, auto: true },
  carbine:   { name: 'CARABINA "PAPO DE PEÃO"', short: 'CARB', dmg: 42, mag: 10, reserve: 40, rate: 0.5, reload: 2.8, spreadHip: 0.02, recoil: 0.02 },
  m400:      { name: 'M400 "MIRA FINA"', short: 'M400', dmg: 40, mag: 20, reserve: 80, rate: 0.11, reload: 2.4, spreadHip: 0.018, spreadScope: 0.004, recoil: 0.011, auto: true, scope: true },
  mosin:     { name: 'MOSIN "VOVÓ RUSSA"', short: 'MOSIN', dmg: 120, mag: 5, reserve: 25, rate: 1.5, reload: 3.4, spreadHip: 0.08, spreadScope: 0.001, recoil: 0.05, scope: true },
  rem700:    { name: 'REM 700 "CAÇADOR"', short: 'REM', dmg: 130, mag: 5, reserve: 25, rate: 1.5, reload: 3.2, spreadHip: 0.08, spreadScope: 0.0009, recoil: 0.05, scope: true },
  // arsenal 3 (militar)
  lmg:       { name: 'METRALHA "TRETA PESADA"', short: 'LMG', dmg: 31, mag: 100, reserve: 200, rate: 0.085, reload: 5.0, spreadHip: 0.04, recoil: 0.011, auto: true },
  scar:      { name: 'SCAR "PAGA-PAU"', short: 'SCAR', dmg: 37, mag: 20, reserve: 80, rate: 0.11, reload: 2.5, spreadHip: 0.02, recoil: 0.01, auto: true },
  tavor:     { name: 'TAVOR "CURTINHO"', short: 'TAVOR', dmg: 32, mag: 30, reserve: 90, rate: 0.09, reload: 2.3, spreadHip: 0.024, recoil: 0.008, auto: true },
  famas:     { name: 'FAMAS "BAGUETE"', short: 'FAMAS', dmg: 29, mag: 25, reserve: 90, rate: 0.06, reload: 2.4, spreadHip: 0.028, recoil: 0.006, auto: true },
  uzi:       { name: 'UZI "RÁ-TÁ-TÁ"', short: 'UZI', dmg: 25, mag: 25, reserve: 100, rate: 0.07, reload: 2.1, spreadHip: 0.032, recoil: 0.006, auto: true },
  p90:       { name: 'P90 "CHINELÃO"', short: 'P90', dmg: 23, mag: 50, reserve: 100, rate: 0.065, reload: 2.3, spreadHip: 0.03, recoil: 0.005, auto: true },
};
const ROUND_TIME = 99, ROUNDS_TO_WIN = 3, RESPAWN_DELAY = 2.5, PICKUP_RESPAWN = 8;
const BOT_SPEED = 3.3, BOT_EYE = 1.5;
const TEAM_LABEL = { P: 'PETISTAS', B: 'BOLSONARISTAS' };
const RADIO = {
  z: { title: 'COMANDOS', items: ['Bora, bora, bora!', 'Cobre eu!', 'Recua, recua!'] },
  x: { title: 'RESPOSTAS', items: ['Recebido!', 'Negativo!', 'Bonito tiro!'] },
  c: { title: 'ZOAÇÃO', items: ['Chora na live!', 'É fake news!', 'Vem pra treta!'] },
};
const MK_TIERS = { 2: 'doublekill', 3: 'triplekill', 4: 'multikill', 5: 'megakill' };
const MK_LABELS = { doublekill: 'DOUBLE KILL', triplekill: 'TRIPLE KILL', multikill: 'MULTI KILL', megakill: 'MEGA KILL', killingspree: 'KILLING SPREE', godlike: 'GODLIKE' };

export class Game {
  constructor({ renderer, textures, sfx, settings, playerCharId, playerTeam, nickname, mapId, testMode = false, onQuit, onMatchEnd }) {
    this.renderer = renderer;
    this.sfx = sfx;
    this.settings = settings;
    this.testMode = testMode;
    this.onQuit = onQuit;
    this.onMatchEnd = onMatchEnd;
    this.state = 'boot';
    this.paused = false;
    this.time = 0;
    this.mk = { count: 0, until: 0, life: 0 };
    this.radioOpen = null;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.08, 400);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.world = MAPS[resolveMapId(mapId)].build(this.scene, textures);
    this.flashTex = textures.flash;
    // modo de armas também muda o mapa: pickups fora do modo somem (e suas meshes)
    if (this.world.pickups) {
      const keep = [];
      for (const pk of this.world.pickups) {
        if (this._pickupAllowed(pk.weapon)) {
          const rw = weaponModel(pk.weapon);            // swap the map's box gun for the real GLB
          if (rw && pk.mesh) {
            rw.position.copy(pk.mesh.position); rw.position.y = Math.max(0.16, rw.position.y);
            rw.rotation.set(0, pk.mesh.rotation.y || Math.random() * 6.28, 0.12);
            rw.traverse(o => { if (o.isMesh) o.castShadow = true; });
            this.scene.remove(pk.mesh); this.scene.add(rw); pk.mesh = rw;
          }
          keep.push(pk);
        } else if (pk.mesh) this.scene.remove(pk.mesh);
      }
      this.world.pickups = keep;
    }

    // teams & rosters
    this.playerTeam = playerTeam;
    this.enemyTeam = playerTeam === 'P' ? 'B' : 'P';
    this.playerDef = byId(playerCharId);
    this.combatants = [];   // scoreboard entries

    // ---- player ----
    this.player = {
      isPlayer: true, name: (nickname || '').trim().slice(0, 14) || 'VOCÊ', def: this.playerDef, team: playerTeam,
      pos: new THREE.Vector3(), vel: new THREE.Vector3(),
      yaw: 0, pitch: 0, hp: 100, alive: true, respawnAt: 0, crouchF: 0,
      weapon: 'awp', scoped: false, reloadUntil: 0, nextShotAt: 0, drawUntil: 0,
      ammo: Object.fromEntries(Object.keys(WEAPONS).filter(w => w !== 'knife').map(w => [w, { mag: WEAPONS[w].mag, res: WEAPONS[w].reserve }])),
      kills: 0, deaths: 0, headshots: 0, grounded: true, stepPhase: 0, revealedAt: -99,
    };
    this.combatants.push(this.player);

    // ---- bots ----
    this.bots = [];
    // Custom match: team size (total per side, player fills one ally slot) + difficulty.
    const DIFF = { easy: 0.55, normal: 1, hard: 1.3, insane: 1.7 };
    const diffMul = DIFF[this.settings.difficulty] || 1;
    const teamSize = Math.max(1, Math.min(8, this.settings.bots || 4));
    const cycle = (pool, n) => Array.from({ length: Math.max(0, n) }, (_, i) => pool[i % pool.length]).filter(Boolean);
    const allyDefs = cycle(CHARACTERS.filter(c => c.team === playerTeam && c.id !== playerCharId), teamSize - 1);
    const enemyDefs = cycle(CHARACTERS.filter(c => c.team === this.enemyTeam), teamSize);
    const mkBot = (def, team, i) => {
      const wpn = this._botWeapon();
      const c = buildCharacterModel(def, { weaponId: wpn }) || buildCharacter(def);
      c.group.traverse(o => { o.userData.botOwner = null; });
      const bot = {
        isPlayer: false, name: def.name, def, team,
        mesh: c, pos: new THREE.Vector3(), yaw: 0, hp: 100, alive: true,
        respawnAt: 0, kills: 0, deaths: 0,
        target: null, reactAt: 0, nextShotAt: 0, skill: (0.85 + Math.random() * 0.35) * diffMul, weapon: wpn,
        path: null, pathIdx: 0, repathAt: 0, roamIdx: 0, phase: 0, think: Math.random() * 0.2,
        deadT: 0, strafeT: Math.random() * 10, revealedAt: -99,
        crouchBias: Math.random() < 0.45, // ~half the bots hold angles crouched (AWPer style)
      };
      c.group.traverse(o => { o.userData.botOwner = bot; });
      this.scene.add(c.group);
      this.bots.push(bot); this.combatants.push(bot);
      return bot;
    };
    allyDefs.forEach((d, i) => mkBot(d, playerTeam, i));
    enemyDefs.forEach((d, i) => mkBot(d, this.enemyTeam, i));

    // ---- view model ----
    this.vm = this._buildViewModels();
    this.camera.add(this.vm.root);

    // ---- fx pools ----
    this.tracers = [];
    this.puffs = [];
    this.flashes = [];
    this.drops = [];
    this.puffTex = this._makePuffTexture();
    this.ray = new THREE.Raycaster();

    // ---- round state ----
    this.roundNum = 0;
    this.roundsWon = { P: 0, B: 0 };
    this.roundKills = { P: 0, B: 0 };
    this.timeLeft = ROUND_TIME;
    this.stateUntil = 0;

    this._dom();
    this._input();
    this._applyQuality();
    this.radarCtx = this.el.radar ? this.el.radar.getContext('2d') : null;
    // botões do HUD: configurações + liga/desliga falas (memes)
    this.el.hudSettings.onclick = () => this.onOpenSettings?.();
    this.el.hudSpeech.textContent = this.settings.speech === false ? '🔇' : '🔊';
    this.el.hudSpeech.onclick = () => {
      const on = this.onToggleSpeech?.();
      this.el.hudSpeech.textContent = on ? '🔊' : '🔇';
    };
  }

  /* ================= setup ================= */
  _dom() {
    const $ = id => document.getElementById(id);
    this.el = {
      hud: $('hud'), crosshair: $('crosshair'), hitmarker: $('hitmarker'),
      scope: $('scope-overlay'), vignette: $('damage-vignette'),
      hpFill: $('hp-fill'), hpNum: $('hp-num'), weaponName: $('weapon-name'),
      ammoMag: $('ammo-mag'), ammoRes: $('ammo-reserve'), reloadNote: $('reload-note'),
      roundTime: $('round-time'), roundsP: $('rounds-p'), roundsB: $('rounds-b'),
      scoreP: $('score-p'), scoreB: $('score-b'), killfeed: $('killfeed'),
      banner: $('round-banner'), bannerTitle: $('banner-title'), bannerSub: $('banner-sub'),
      respawn: $('respawn-overlay'), respawnCount: $('respawn-count'),
      scoreboard: $('scoreboard'), sbBody: $('sb-body'),
      matchEnd: $('match-end'), matchTitle: $('match-title'), matchSub: $('match-sub'), matchStats: $('match-stats'),
      pause: $('pause-menu'), radar: $('radar'),
      radioMenu: $('radio-menu'), radioLog: $('radio-log'), mkBanner: $('mk-banner'),
      lockHint: $('lock-hint'), hudSpeech: $('hud-speech'), hudSettings: $('hud-settings'),
      pickupHint: $('pickup-hint'),
    };
  }

  _buildViewModels() {
    const root = new THREE.Group();
    const dark = c => new THREE.MeshLambertMaterial({ color: c });
    // First-person arms inherit the selected character's skin + sleeve colors.
    const pdef = byId(this.playerCharId);
    const pal = (pdef && pdef.pal) || { skin: 0xd9a066, shirt: 0x3a4a5a };
    const skinMat = dark(pal.skin);
    const sleeveMat = dark(pal.shirt);
    const skin = skinMat; // legacy alias
    // A curled gripping hand built from two-segment fingers (proximal + distal phalanx),
    // a slimmer palm and an angled thumb — reads as an actual gripping hand, not a brick.
    const fpArm = (w = 0.08) => {
      const g = new THREE.Group();
      const sc = w / 0.08; // callers pass a smaller w for pistols/knife → scale the whole hand
      const knuckle = new THREE.Group(); g.add(knuckle);
      // palm — flattened capsule laid across the grip (X axis), slimmer than before
      const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.052, 4, 8), skinMat);
      palm.rotation.z = Math.PI / 2; palm.scale.set(1, 1, 0.62);
      palm.castShadow = false; knuckle.add(palm);
      // four two-segment fingers wrapping over the grip, spaced along Z
      const proxGeo = new THREE.CapsuleGeometry(0.0085, 0.026, 3, 6);
      const distGeo = new THREE.CapsuleGeometry(0.0075, 0.022, 3, 6);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Group();
        const prox = new THREE.Mesh(proxGeo, skinMat);
        prox.rotation.set(0.5, 0, Math.PI / 2); prox.position.set(0, 0.012, 0);
        const dist = new THREE.Mesh(distGeo, skinMat);
        dist.rotation.set(1.15, 0, Math.PI / 2); dist.position.set(-0.017, -0.006, 0);
        f.add(prox, dist);
        f.position.set(0.004, 0.026, -0.028 + i * 0.019);
        knuckle.add(f);
      }
      // thumb on the near side, angled up along the grip
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.034, 3, 6), skinMat);
      thumb.rotation.set(0.35, 0, 0.55); thumb.position.set(-0.03, 0.004, 0.026);
      thumb.castShadow = false; knuckle.add(thumb);
      knuckle.scale.setScalar(sc);
      // Forearm angled toward the screen's bottom corner, carrying the sleeve colour;
      // a rounded cuff at the wrist. Capsule/cylinder → no hard box edges.
      const fore = new THREE.Group();
      fore.rotation.set(0.78, 0.62, 0);
      const L = 0.42 * sc;
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(w * 0.55, L, 4, 10), sleeveMat);
      sleeve.rotation.x = Math.PI / 2; sleeve.position.set(0, 0, L * 0.5 + 0.04);
      sleeve.castShadow = false; fore.add(sleeve);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.66, w * 0.6, 0.05, 12), skinMat);
      cuff.rotation.x = Math.PI / 2; cuff.position.set(0, 0, 0.05);
      cuff.castShadow = false; fore.add(cuff);
      g.add(fore);
      return g;
    };
    // Support (front) hand: palm + two-segment curled fingers only, no receding sleeve.
    const frontHand = (sc = 1) => {
      const g = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.048, 4, 8), skinMat);
      palm.rotation.z = Math.PI / 2; palm.scale.set(1, 1, 0.62); palm.castShadow = false; g.add(palm);
      const proxGeo = new THREE.CapsuleGeometry(0.008, 0.024, 3, 6);
      const distGeo = new THREE.CapsuleGeometry(0.007, 0.02, 3, 6);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Group();
        const prox = new THREE.Mesh(proxGeo, skinMat);
        prox.rotation.set(0.55, 0, Math.PI / 2); prox.position.set(0, 0.011, 0);
        const dist = new THREE.Mesh(distGeo, skinMat);
        dist.rotation.set(1.2, 0, Math.PI / 2); dist.position.set(-0.015, -0.006, 0);
        f.add(prox, dist);
        f.position.set(0.004, 0.024, -0.026 + i * 0.018);
        g.add(f);
      }
      g.scale.setScalar(sc);
      return g;
    };
    // AWP (right-handed)
    const awp = new THREE.Group();
    awp.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.5), dark(0x2e4a2e)));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.55, 6), dark(0x1a1a1a));
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.01, -0.5); awp.add(barrel);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.17, 8), dark(0x111111));
    scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.085, -0.05); awp.add(scope);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.2), dark(0x3a2a1e)); stock.position.set(0, -0.05, 0.28); awp.add(stock);
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03), dark(0x888888)); bolt.position.set(0.05, 0.03, 0.05); awp.add(bolt);
    const handR = fpArm(); handR.name = 'handR'; handR.position.set(0, -0.085, 0.02); awp.add(handR);
    const handL = frontHand(0.95); handL.name = 'handL'; handL.position.set(0.005, -0.04, -0.3); awp.add(handL);
    awp.position.set(0.26, -0.23, -0.5); awp.rotation.y = 0.03;
    // rifles genéricos (ak / m4 / mp5 / shotgun / deagle)
    const mkRifle = (bodyC, woodC, len, magH) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, len), bodyC));
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), dark(0x1a1a1a));
      b.rotation.x = Math.PI / 2; b.position.set(0, 0.01, -len / 2 - 0.18); g.add(b);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.18), woodC); stock.position.set(0, -0.04, len / 2 - 0.05); g.add(stock);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, magH, 0.07), dark(0x2a2a2a));
      mag.position.set(0, -0.06 - magH / 2, -0.05); g.add(mag);
      const hR = fpArm(); hR.name = 'handR'; hR.position.set(0, -0.085, 0.1); g.add(hR);
      const hL = frontHand(0.95); hL.name = 'handL'; hL.position.set(0.005, -0.04, -len / 3); g.add(hL);
      g.position.set(0.26, -0.23, -0.5); g.rotation.y = 0.03;
      return g;
    };
    const ak = mkRifle(dark(0x2a2a2a), dark(0x6b4f2c), 0.55, 0.16);
    const m4 = mkRifle(dark(0x333333), dark(0x2a2a2a), 0.52, 0.13);
    const mp5 = mkRifle(dark(0x2e2e2e), dark(0x2e2e2e), 0.4, 0.14);
    const shotgun = mkRifle(dark(0x1a1a1a), dark(0x7a5230), 0.5, 0.08);
    const deagle = new THREE.Group();
    deagle.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.26), dark(0x8a8a8a)));
    const dgrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.07), dark(0xc9a227));
    dgrip.position.set(0, -0.1, 0.09); dgrip.rotation.x = 0.25; deagle.add(dgrip);
    const handD = fpArm(0.075, 0.1, 0.08); handD.name = 'handR'; handD.position.set(0, -0.1, 0.09); deagle.add(handD);
    deagle.position.set(0.24, -0.2, -0.42);
    // pistol
    const pistol = new THREE.Group();
    pistol.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.22), dark(0x333333)));
    const pgrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.06), dark(0x3a2a1e));
    pgrip.position.set(0, -0.09, 0.08); pgrip.rotation.x = 0.25; pistol.add(pgrip);
    const handP = fpArm(0.075, 0.1, 0.08); handP.name = 'handR'; handP.position.set(0, -0.1, 0.08); pistol.add(handP);
    pistol.position.set(0.24, -0.2, -0.42);
    // knife
    const knife = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.3), dark(0xb8c0c8)); blade.position.z = -0.2; knife.add(blade);
    knife.add(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.12), dark(0x2a1e14)));
    const handK = fpArm(0.07, 0.08, 0.08); handK.name = 'handR'; handK.position.set(0, -0.02, 0.03); knife.add(handK);
    knife.position.set(0.28, -0.22, -0.4); knife.rotation.set(-0.2, 0.25, -0.15);
    root.add(awp, ak, m4, mp5, shotgun, deagle, pistol, knife);
    const models = { awp, ak, m4, mp5, shotgun, deagle, pistol, knife };
    // Swap the procedural box guns for the real weapon GLBs where available: add the
    // real model (barrel rotated to point into the screen) and hide the box meshes,
    // keeping the first-person hand. Falls back to the box gun if a model is missing.
    // Align the hands to the REAL weapon: the GLB's grip point sits at the model-group
    // origin (weapons.js), pulled GRIP_Z back toward the camera. The trigger hand wraps
    // the grip; the support hand wraps the handguard ~55% of the way from grip to muzzle
    // (two-handed weapons only). Derived from each weapon's CFG (len/gripZ), not guesses.
    const alignHands = (g, id) => {
      const cfg = weaponCFG(id);
      const GRIP_Z = id === 'knife' ? 0 : 0.12;
      const hR = g.getObjectByName('handR'), hL = g.getObjectByName('handL');
      if (hR) hR.position.set(0, -0.03, GRIP_Z);
      if (hL) {
        if (ONE_HANDED.has(id)) hL.visible = false;
        else hL.position.set(0.005, -0.045, GRIP_Z - 0.82 * cfg.len * (1 - cfg.gripZ) * 0.72);
      }
    };
    for (const id in models) {
      const rw = weaponModel(id);
      if (!rw) continue;
      rw.rotation.y = Math.PI;             // weapon barrel +Z -> -Z (into the screen)
      rw.scale.multiplyScalar(0.82);       // slightly tucked for first-person framing
      rw.position.z += id === 'knife' ? 0.0 : 0.12; // pull the grip back toward the hand
      models[id].children.forEach((ch) => { if (ch.isMesh) ch.visible = false; });
      models[id].add(rw);
      alignHands(models[id], id);
    }
    // Build first-person viewmodels for the extended arsenal (weapons without a box
    // group): real GLB + a hand, positioned like the AWP viewmodel.
    for (const id of WEAPON_IDS) {
      if (models[id]) continue;
      const g = new THREE.Group();
      const rw = weaponModel(id);
      if (rw) { rw.rotation.y = Math.PI; rw.scale.multiplyScalar(0.82); rw.position.z += id === 'knife' ? 0 : 0.12; g.add(rw); }
      const hR = fpArm(); hR.name = 'handR'; g.add(hR);
      if (!ONE_HANDED.has(id)) { const hL = frontHand(0.95); hL.name = 'handL'; g.add(hL); }
      alignHands(g, id);
      g.position.copy(awp.position); g.rotation.copy(awp.rotation);
      root.add(g); models[id] = g;
    }
    for (const k in models) models[k].visible = k === 'awp';
    return { root, models, awp, pistol, knife, kick: 0, bobPhase: 0, reloadDip: 0 };
  }

  _makePuffTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(230,210,180,0.9)'); g.addColorStop(1, 'rgba(230,210,180,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* ================= input ================= */
  _input() {
    this.keys = {};
    this._kd = e => {
      if (e.code === 'Tab') { e.preventDefault(); this._showScoreboard(true); }
      // em pointer lock, engole atalhos do navegador (Ctrl+S/D/A/R…) — Ctrl+W o Chrome não deixa prevenir, use C pra agachar
      if ((e.ctrlKey || e.metaKey) && document.pointerLockElement) e.preventDefault();
      this.keys[e.code] = true;
      if (this.radioOpen) {
        const n = { Digit1: 1, Digit2: 2, Digit3: 3 }[e.code];
        if (n) this._radioPick(n);
        this.radioOpen = null; this._radioUi();
        return;
      }
      if (!this._acceptInput()) return;
      if (e.code === 'KeyZ') { this._radioShow('z'); return; }
      if (e.code === 'KeyX') { this._radioShow('x'); return; }
      if (e.code === 'KeyV') { this._radioShow('c'); return; }
      if (e.code === 'Digit1') this._switchWeapon('awp');
      if (e.code === 'Digit2') this._switchWeapon('pistol');
      if (e.code === 'Digit3') this._switchWeapon('knife');
      if (e.code === 'KeyE' && this.nearPickup) {
        const { pk, dropIdx } = this.nearPickup;
        this._grabPickup(pk, this.player, true);
        if (dropIdx >= 0) { this.scene.remove(pk.mesh); this.drops.splice(dropIdx, 1); }
        this.nearPickup = null;
      }
      if (e.code === 'KeyM') { if (this.onRequestSwitch) this.onRequestSwitch(); else this._switchTeam(); }
      if (e.code === 'KeyR') this._startReload();
      if (e.code === 'Space') e.preventDefault();
    };
    this._ku = e => {
      if (e.code === 'Tab') this._showScoreboard(false);
      this.keys[e.code] = false;
    };
    this._md = e => {
      if (this.radioOpen) { this.radioOpen = null; this._radioUi(); }
      if (!this._acceptInput()) {
        // pointer lock não engatou (ou caiu)? qualquer clique retoma e tenta de novo.
        // Inclui o caso pausado-por-perda-de-lock (ex.: depois do M): antes, clicar
        // com o jogo pausado não fazia nada e travava até dar refresh.
        if (!this.testMode && (this.state === 'live' || this.state === 'countdown') && !document.pointerLockElement) {
          if (this.paused) this.setPaused(false);
          this._requestLock();
        }
        return;
      }
      if (e.button === 0) { this.mouseDown0 = true; this._tryShoot(); }
      if (e.button === 2) this._scope(true);
    };
    this._mu = e => {
      if (e.button === 0) this.mouseDown0 = false;
      if (e.button === 2) this._scope(false);
    };
    this._mm = e => {
      if (!this._acceptInput()) return;
      const s = this.settings.sens * 0.0021 * (this.player.scoped ? 0.45 : 1);
      this.player.yaw -= e.movementX * s;
      this.player.pitch -= e.movementY * s;
      this.player.pitch = Math.max(-1.45, Math.min(1.45, this.player.pitch));
    };
    this._cc = e => e.preventDefault();
    this._blur = () => { this.keys = {}; };   // alt-tab com tecla pressionada não deixa tecla presa
    this._plc = () => {
      if (!document.pointerLockElement && !this.testMode && (this.state === 'live' || this.state === 'countdown') && !this.paused)
        this.setPaused(true);
    };
    document.addEventListener('keydown', this._kd);
    document.addEventListener('keyup', this._ku);
    document.addEventListener('mousedown', this._md);
    document.addEventListener('mouseup', this._mu);
    document.addEventListener('mousemove', this._mm);
    document.addEventListener('contextmenu', this._cc);
    document.addEventListener('pointerlockchange', this._plc);
    window.addEventListener('blur', this._blur);
  }

  _requestLock() {
    try { this.renderer.domElement.requestPointerLock()?.catch?.(() => {}); } catch {}
  }
  _acceptInput() {
    if (this.paused || this.state !== 'live' && this.state !== 'countdown') return false;
    return this.testMode || !!document.pointerLockElement;
  }

  /* ================= radio (CS-style voice commands) ================= */
  _radioShow(cat) {
    if (!this.player.alive || this.state !== 'live') return;
    this.radioOpen = cat;
    this._radioUi();
    this.sfx.uiClick();
  }
  _radioUi() {
    const m = this.el.radioMenu;
    if (!this.radioOpen) { m.classList.add('hidden'); return; }
    const c = RADIO[this.radioOpen];
    m.innerHTML = `<div class="radio-title">${c.title}</div>` +
      c.items.map((it, i) => `<div class="radio-item">${i + 1}. ${it}</div>`).join('');
    m.classList.remove('hidden');
  }
  _radioPick(n) {
    const cat = RADIO[this.radioOpen];
    const item = cat.items[n - 1];
    if (!item) return;
    this.sfx.radioVoice(this.playerTeam);
    const log = document.createElement('div');
    log.className = 'radio-line';
    log.textContent = `${this.player.name} (RÁDIO): ${item}`;
    this.el.radioLog.appendChild(log);
    setTimeout(() => log.remove(), 4200);
    while (this.el.radioLog.children.length > 3) this.el.radioLog.firstChild.remove();
  }

  /* ================= flow ================= */
  start() {
    this.el.hud.classList.remove('hidden');
    this._startRound();
  }
  _startRound() {
    this.roundNum++;
    this.roundKills = { P: 0, B: 0 };
    this.timeLeft = ROUND_TIME;
    this.mk.life = 0; this.mk.count = 0;
    this._resetPositions();
    this.state = 'countdown';
    this.stateUntil = this.time + 3;
    this._showScoreboard(false);
    this._banner(`ROUND ${this.roundNum}`, this.roundNum === 1 ? 'Que comece a treta!' : 'De volta pra treta!');
    if (!this.sfx.csSound('roundstart')) this.sfx.vuvuzela(1.4);
  }
  _resetPositions() {
    const place = (ent, team, slot) => {
      const s = this.world.spawns[team][slot % 4];
      ent.pos.set(s.x + (Math.random() - .5), 0, s.z + (Math.random() - .5));
      ent.hp = 100; ent.alive = true; ent.respawnAt = 0;
      return s;
    };
    place(this.player, this.playerTeam, 0);
    this.player.yaw = this.playerTeam === 'P' ? Math.PI : 0;
    this.player.pitch = 0; this.player.vel.set(0, 0, 0); this.player.crouchF = 0;
    this.player.ammo.awp = { mag: WEAPONS.awp.mag, res: WEAPONS.awp.reserve };
    this.player.ammo.pistol = { mag: WEAPONS.pistol.mag, res: WEAPONS.pistol.reserve };
    // modo de armas: aplica o loadout inicial
    const mode = this.settings.wpnMode || 'all';
    if (mode === 'pistols') {
      this.player.weapon = 'pistol';
      this.player.ammo.awp = { mag: 0, res: 0 };
    } else if (mode === 'knife') {
      this.player.weapon = 'knife';
      this.player.ammo.awp = { mag: 0, res: 0 };
      this.player.ammo.pistol = { mag: 0, res: 0 };
    } else if (mode === 'awp') {
      this.player.weapon = 'awp';
      this.player.ammo.pistol = { mag: 0, res: 0 };
    } else {
      this.player.weapon = 'awp';
    }
    this.player.scoped = false; this.player.reloadUntil = 0;
    for (const d of this.drops) this.scene.remove(d.mesh);
    this.drops = [];
    // scatter a few real weapons on the ground each round so the player finds variety
    // (map pickups are often AWP-only; bot drops only appear after kills)
    const wp = this.world.waypoints && this.world.waypoints.nodes;
    if (wp && wp.length) {
      const scatterPool = ['ak', 'm4', 'mp5', 'shotgun', 'deagle', 'm92', 'akm', 'md97', 'scar',
        'g3', 'tavor', 'famas', 'uzi', 'p90', 'mosin', 'rem700', 'm400', 'carbine', 'revolver38']
        .filter(w => this._pickupAllowed(w));
      // Lots of weapons of every type on the ground, clustered near waypoints (not flung
      // far). Guarantee one of each allowed type first, then top up to a healthy count.
      if (scatterPool.length) {
        const near = () => wp[(Math.random() * wp.length) | 0];
        const put = (w) => { const n = near(); if (n) this._dropWeapon(n.x + (Math.random() - 0.5) * 1.4, n.z + (Math.random() - 0.5) * 1.4, w); };
        for (const w of scatterPool) put(w);                       // at least one of each type
        const extra = Math.max(0, 30 - scatterPool.length);        // ~30 guns on the map total
        for (let i = 0; i < extra; i++) put(scatterPool[(Math.random() * scatterPool.length) | 0]);
      }
      // Weapons RIGHT AT each spawn so players arm up on respawn (not just scattered on
      // the map). Snipers first (the user wants plenty, especially snipers).
      const rack = ['awp', 'mosin', 'rem700', 'm400', 'ak', 'm4', 'scar', 'shotgun', 'mp5', 'deagle', 'lmg', 'famas']
        .filter(w => this._pickupAllowed(w));
      if (rack.length) {
        for (const team of ['P', 'B']) {
          const spawns = this.world.spawns[team] || [];
          const sz = spawns.length ? spawns[0].z : 0;
          const inward = sz > 0 ? -1 : 1;              // just in front of the spawn line
          let i = 0;
          for (const gx of [-12, -8, -4, 4, 8, 12])
            this._dropWeapon(gx, sz + inward * (1.8 + (i % 2) * 0.9), rack[i++ % rack.length], true);
        }
      }
    }
    for (const k in this.vm.models) this.vm.models[k].visible = k === this.player.weapon;
    this.el.weaponName.textContent = WEAPONS[this.player.weapon].name;
    const slots = { P: 1, B: 0 };
    for (const b of this.bots) {
      place(b, b.team, slots[b.team]++);
      b.yaw = b.team === 'P' ? 0 : Math.PI;   // mesh forward is +Z
      b.target = null; b.path = null; b.repathAt = 0;
      b.mesh.group.rotation.set(0, b.yaw, 0);
      b.mesh.group.position.copy(b.pos);
      b.mesh.group.visible = true;
      if (b.mesh.isGLB) b.mesh.ctrl.revive();
    }
  }

  _endRound() {
    const p = this.roundKills.P, b = this.roundKills.B;
    let winner = null;
    if (p > b) winner = 'P'; else if (b > p) winner = 'B';
    if (winner) this.roundsWon[winner]++;
    this.state = 'roundEnd';
    this.stateUntil = this.time + 4;
    this.player.scoped = false; this.el.scope.classList.remove('on');
    this.radioOpen = null; this._radioUi();
    this._showScoreboard(true);   // CS-style: scoreboard pops at round end
    if (!winner) {
      this._banner('EMPATE NA TRETA', `${p} × ${b} — ninguém convenceu ninguém`);
      this.sfx.roundLose();
    } else {
      const mine = winner === this.playerTeam;
      this._banner(`${TEAM_LABEL[winner]} LEVARAM O ROUND`, `${p} × ${b} ` + (mine ? '— o povo (você) agradece' : '— a oposição (você) pede revanche'));
      if (!this.sfx.roundSound(winner)) mine ? this.sfx.roundWin() : this.sfx.roundLose();
    }
    if (this.roundsWon.P >= ROUNDS_TO_WIN || this.roundsWon.B >= ROUNDS_TO_WIN)
      this.stateUntil = this.time + 4.5; // then match end
  }

  _endMatch() {
    this.state = 'matchEnd';
    const winner = this.roundsWon.P > this.roundsWon.B ? 'P' : 'B';
    const mine = winner === this.playerTeam;
    this.el.matchTitle.textContent = `${TEAM_LABEL[winner]} VENCERAM A TRETA!`;
    this.el.matchTitle.style.color = winner === 'P' ? '#ff8080' : '#9dff9d';
    this.el.matchSub.textContent = mine
      ? 'A praça é sua. O pastel da vitória está pago. 🥟'
      : 'Derrota na arena. Já pediram CPI da partida.';
    this.el.matchStats.innerHTML =
      `<div><b>${this.roundsWon.P} × ${this.roundsWon.B}</b>rounds</div>` +
      `<div><b>${this.player.kills}</b>kills de ${this.player.name}</div>` +
      `<div><b>${this.player.deaths}</b>suas mortes</div>`;
    this.el.matchEnd.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    try { window.va?.('event', { name: 'match_end', data: { winner, roundsP: this.roundsWon.P, roundsB: this.roundsWon.B } }); } catch {}
    try {
      this.onMatchEnd?.({
        won: mine, team: this.playerTeam, character: this.playerDef.id,
        kills: this.player.kills, deaths: this.player.deaths,
        headshots: this.player.headshots || 0, bestStreak: this.mk.best || 0,
        roundsP: this.roundsWon.P, roundsB: this.roundsWon.B,
        seconds: Math.round(this.time),
      });
    } catch {}
    mine ? this.sfx.matchWin() : this.sfx.roundLose();
  }

  setPaused(v) {
    if (this.state !== 'live' && this.state !== 'countdown') v = false;
    this.paused = v;
    if (v) this.keys = {};
    this.el.pause.classList.toggle('hidden', !v);
    if (v && document.pointerLockElement) document.exitPointerLock();
  }
  resume() {
    this.setPaused(false);
    if (!this.testMode) this._requestLock();
  }
  applySettings() {
    this.sfx.setVolume(this.settings.vol);
    this.sfx.speechEnabled = this.settings.speech !== false;
    if (this.el?.hudSpeech) this.el.hudSpeech.textContent = this.settings.speech === false ? '🔇' : '🔊';
    this._applyQuality();
  }
  _applyQuality() {
    const q = this.settings.quality;
    this.renderer.setPixelRatio(q === 'high' ? Math.min(devicePixelRatio, 2) : q === 'med' ? 1 : 0.75);
    const shadows = q !== 'low';
    this.renderer.shadowMap.enabled = shadows;
    this.world.sun.castShadow = shadows;
    this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  }
  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  /* ================= team switch (M) ================= */
  _switchTeam(charId) {
    if (!this.player.alive || (this.state !== 'live' && this.state !== 'countdown')) return;
    const p = this.player;
    if (charId) { this.playerDef = byId(charId); p.def = this.playerDef; }   // personagem do novo lado
    const oldTeam = this.playerTeam;
    const newTeam = oldTeam === 'P' ? 'B' : 'P';
    this.playerTeam = newTeam; this.enemyTeam = oldTeam;
    p.team = newTeam;
    // rebalanceia 4×4: um bot do time novo deserta pro time velho
    const candidates = this.bots.filter(b => b.team === newTeam);
    const swapBot = candidates[(Math.random() * candidates.length) | 0];
    if (swapBot) {
      swapBot.team = oldTeam;
      const defs = CHARACTERS.filter(c => c.team === oldTeam && c.id !== p.def.id);
      const newDef = defs[(Math.random() * defs.length) | 0];
      swapBot.def = newDef; swapBot.name = newDef.name;
      this.scene.remove(swapBot.mesh.group);
      // GLB clones share geometry with the cached template — never dispose it here.
      if (!swapBot.mesh.isGLB) swapBot.mesh.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      swapBot.mesh = buildCharacterModel(newDef) || buildCharacter(newDef);
      swapBot.mesh.group.traverse(o => { o.userData.botOwner = swapBot; });
      this.scene.add(swapBot.mesh.group);
      swapBot.target = null; swapBot.path = null; swapBot.hp = 100; swapBot.alive = true;
      const s = this.world.spawns[oldTeam][(Math.random() * 4) | 0];
      swapBot.pos.set(s.x, 0, s.z);
      swapBot.yaw = oldTeam === 'P' ? 0 : Math.PI;
      swapBot.mesh.group.rotation.set(0, swapBot.yaw, 0);
      swapBot.mesh.group.position.copy(swapBot.pos);
      swapBot.mesh.group.visible = true;
    }
    // respawn do jogador no lado novo
    const s = this.world.spawns[newTeam][(Math.random() * 4) | 0];
    p.pos.set(s.x, 0, s.z); p.vel.set(0, 0, 0);
    p.yaw = newTeam === 'P' ? Math.PI : 0; p.pitch = 0; p.hp = 100;
    this._scope(false, true);
    this._banner(`VOCÊ AGORA É ${TEAM_LABEL[newTeam]}`, 'trocou de lado na treta — sem penalty, só julgamento');
    this.sfx.uiClick();
  }

  /* ================= weapons ================= */
  _switchWeapon(w) {
    const p = this.player;
    if (p.weapon === w || !p.alive || !WEAPONS[w]) return;
    if (w !== 'knife' && !p.ammo[w]) p.ammo[w] = { mag: WEAPONS[w].mag, res: WEAPONS[w].reserve };
    p.weapon = w; p.reloadUntil = 0; p.drawUntil = this.time + 0.28;
    this.vm.reloadDip = 0;   // evita arma travada inclinada ao trocar no meio da recarga
    this.bloom = 0;
    this._scope(false, true);
    for (const k in this.vm.models) this.vm.models[k].visible = k === w;
    this.el.weaponName.textContent = WEAPONS[w].name;
    this.el.reloadNote.classList.add('hidden');
    if (w === 'knife') this.sfx.knifeDeploy(); else this.sfx.uiClick();
  }
  _scope(on, silent = false) {
    const p = this.player, w = p.weapon;
    // any weapon (except knife/shotgun) can aim-zoom; only real scopes show the circle
    if (on && (w === 'knife' || w === 'shotgun' || !p.alive || this._reloading())) on = false;
    if (p.scoped === on) return;
    p.scoped = on;
    this.el.scope.classList.toggle('on', on && !!(WEAPONS[w] && WEAPONS[w].scope));
    if (!silent) on ? this.sfx.scopeIn() : this.sfx.scopeOut();
  }
  // Target FOV while aiming: strong for scoped snipers, light ADS for the rest.
  _zoomFov(w) {
    const Z = { awp: 22, mosin: 20, rem700: 22, m400: 38, m400scope: 38, md97: 44, carbine: 42,
      ak: 52, m92: 52, akm: 52, g3: 52, m4: 52, mp5: 55, deagle: 50, pistol: 54, revolver38: 54 };
    return Z[w] || 55;
  }
  _reloading() { return this.time < this.player.reloadUntil; }
  _startReload() {
    const p = this.player, w = p.weapon;
    if (w === 'knife' || !p.alive || this._reloading()) return;
    const a = p.ammo[w];
    if (a.mag >= WEAPONS[w].mag || a.res <= 0) return;
    this._scope(false, true);
    p.reloadUntil = this.time + WEAPONS[w].reload;
    this.el.reloadNote.classList.remove('hidden');
    this.sfx.reloadStart();
  }
  _tryShoot() {
    const p = this.player, w = WEAPONS[p.weapon];
    if (!p.alive || this.state !== 'live') return;
    if (this.time < p.nextShotAt || this._reloading() || this.time < p.drawUntil) return;
    if (p.weapon === 'knife') {
      p.nextShotAt = this.time + w.rate;
      this.vm.kick = 1; this.sfx.knife();
      this._meleeHit();
      return;
    }
    const a = p.ammo[p.weapon];
    if (a.mag <= 0) { this.sfx.dryFire(); this._startReload(); return; }
    a.mag--;
    p.nextShotAt = this.time + w.rate;
    p.revealedAt = this.time;
    if (p.weapon === 'awp') setTimeout(() => this.sfx.bolt(), 420);
    this.sfx.shotWeapon(p.weapon);
    // spread & direction — crouching tightens it up; autos dão bloom
    const crouchMul = 1 - 0.5 * p.crouchF;
    this.bloom = Math.min(1.6, (this.bloom || 0) + (w.auto ? 0.22 : 0));
    const spreadBase = (p.weapon === 'awp' ? (p.scoped ? w.spreadScope : w.spreadHip) : w.spreadHip) * crouchMul;
    const from = this.camera.getWorldPosition(new THREE.Vector3());
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const sp = spreadBase * (1 + this.bloom) * (pellets > 1 ? 1 : 1);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      dir.x += (Math.random() - .5) * sp; dir.y += (Math.random() - .5) * sp; dir.z += (Math.random() - .5) * sp;
      dir.normalize();
      this._fireHitscan(this.player, from, dir, w.dmg, true, w.short);
    }
    // recoil + muzzle flash
    p.pitch += w.recoil * (1 - 0.25 * p.crouchF); this.vm.kick = 1;
    this._flash(this.camera.localToWorld(new THREE.Vector3(0.26, -0.2, -1.1)));
    // bolt-action snipers drop the scope after each shot (CS-style); autos stay aimed
    if (p.scoped && (p.weapon === 'awp' || p.weapon === 'mosin' || p.weapon === 'rem700')) this._scope(false, true);
  }
  _meleeHit() {
    const from = this.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    let best = null, bd = WEAPONS.knife.range;
    for (const b of this.bots) {
      if (!b.alive || b.team === this.playerTeam) continue;
      const to = b.pos.clone().setY(b.pos.y + 1.2).sub(from);
      const d = to.length();
      if (d < bd && to.normalize().dot(dir) > 0.6) { best = b; bd = d; }
    }
    if (best) { this.sfx.knifeHit(); this._damage(best, WEAPONS.knife.dmg, this.player, 'FACA'); }
  }
  _fireHitscan(shooter, from, dir, dmg, byPlayer = false, weap = 'AWP') {
    this.ray.set(from, dir); this.ray.far = 200;
    const enemyGroups = this.bots.filter(b => b.alive && (byPlayer ? b.team !== this.playerTeam : true)).map(b => b.mesh.group);
    const hitsChar = enemyGroups.length ? this.ray.intersectObjects(enemyGroups, true) : [];
    const hitsWorld = this.ray.intersectObjects(this.world.occluders, false);
    const hC = hitsChar[0], hW = hitsWorld[0];
    let end;
    if (hC && (!hW || hC.distance < hW.distance)) {
      let o = hC.object, bot = null, head = false;
      while (o) {
        if (o.userData.botOwner && !bot) bot = o.userData.botOwner;
        if (bot && o === bot.mesh.parts.head) head = true;
        o = o.parent;
      }
      end = hC.point;
      if (bot) {
        if (bot.team === shooter.team) { /* friendly fire off */ }
        else this._damage(bot, head && dmg < 100 ? 100 : dmg, shooter, weap, head); // headshot: dano mínimo 100
      }
    } else if (hW) {
      end = hW.point;
      this._puff(hW.point, hW.face ? hW.face.normal : null);
      if (Math.random() < 0.3) this.sfx.ricochet();
    } else {
      end = from.clone().add(dir.clone().multiplyScalar(120));
    }
    if (byPlayer) {
      const muzzle = this.camera.localToWorld(new THREE.Vector3(0.24, -0.18, -0.9));
      this._tracer(muzzle, end);
    }
    return end;
  }
  _damage(ent, dmg, attacker, weap = 'AWP', head = false) {
    if (!ent.alive || this.state !== 'live') return;
    ent.hp -= dmg;
    if (ent.isPlayer) {
      this.el.vignette.style.opacity = 0.9;
      setTimeout(() => this.el.vignette.style.opacity = 0, 130);
      this.sfx.hurt();
    } else if (attacker === this.player) {
      this._hitmarker(ent.hp <= 0);
    }
    if (!ent.isPlayer && attacker && attacker.team !== ent.team && !ent.target && attacker.alive)
      ent.target = attacker;   // bot caça quem o atingiu
    if (ent.hp <= 0) this._kill(ent, attacker, weap, head);
  }
  _kill(ent, attacker, weap = 'AWP', head = false) {
    ent.alive = false; ent.hp = 0; ent.deaths++;
    ent.respawnAt = this.time + RESPAWN_DELAY;
    // CS: larga a arma no chão onde morreu
    this._dropWeapon(ent.pos.x, ent.pos.z, ent.weapon === 'knife' ? 'awp' : ent.weapon);
    if (attacker) {
      attacker.kills++; this.roundKills[attacker.team]++;
      this.sfx.voice(attacker.team);   // killer's side celebrates (meme audio)
      if (attacker.isPlayer) {
        this.sfx.killConfirm();
        if (head) { this.sfx.general('headshot'); attacker.headshots++; }
        const mk = this.mk;
        if (this.time < mk.until) mk.count++; else mk.count = 1;
        mk.until = this.time + 4.5; mk.life++;
        mk.best = Math.max(mk.best || 0, mk.count);
        const kind = mk.count >= 6 ? 'godlike' : (MK_TIERS[mk.count] || (mk.life === 5 ? 'killingspree' : null));
        if (kind) { this._mkBanner(MK_LABELS[kind]); this.sfx.general(kind); }
      }
    }
    if (ent.isPlayer) {
      this._scope(false, true);
      this.mk.life = 0;
      this.el.respawn.classList.remove('hidden');
      this.sfx.death();
    } else {
      ent.target = null; ent.deadT = 0;
      this.sfx.death();
    }
    this._feed(attacker, ent, weap, head);
  }
  _mkBanner(text) {
    this.el.mkBanner.textContent = text;
    this.el.mkBanner.classList.add('show');
    clearTimeout(this._mkT);
    this._mkT = setTimeout(() => this.el.mkBanner.classList.remove('show'), 1900);
  }
  _hitmarker(kill) {
    const h = this.el.hitmarker;
    h.classList.toggle('kill', kill);
    h.classList.add('show');
    clearTimeout(this._hmT);
    this._hmT = setTimeout(() => h.classList.remove('show'), 90);
    this.sfx.hitmark();
  }
  _feed(attacker, victim, weap, head = false) {
    const row = document.createElement('div');
    row.className = 'kf-row';
    const cn = e => `<span class="${e.team === 'P' ? 'kp' : 'kb'}">${e.name}</span>`;
    row.innerHTML = attacker && attacker !== victim
      ? `${cn(attacker)} <span class="kx">[${weap}${head ? ' 💀' : ''}]</span> ${cn(victim)}`
      : `${cn(victim)} <span class="kx">tropeçou na treta</span>`;
    this.el.killfeed.prepend(row);
    setTimeout(() => row.remove(), 4600);
    while (this.el.killfeed.children.length > 6) this.el.killfeed.lastChild.remove();
  }

  /* ================= fx ================= */
  _tracer(a, b) {
    const len = a.distanceTo(b);
    if (len < 0.5) return;
    const geo = new THREE.CylinderGeometry(0.014, 0.014, len, 5, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(a).lerp(b, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    this.scene.add(m);
    this.tracers.push({ m, ttl: 0.09 });
  }
  _puff(pos, normal) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.puffTex, transparent: true, opacity: 0.9, depthWrite: false }));
    s.position.copy(pos);
    if (normal) s.position.add(normal.clone().multiplyScalar(0.12));
    s.scale.setScalar(0.4);
    this.scene.add(s);
    this.puffs.push({ s, ttl: 0.4, t: 0 });
  }
  _flash(pos) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.flashTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.copy(pos); s.scale.setScalar(0.55);
    this.scene.add(s);
    this.flashes.push({ s, ttl: 0.05 });
  }
  _updateFx(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.ttl -= dt; t.m.material.opacity = Math.max(0, t.ttl / 0.09);
      if (t.ttl <= 0) { this.scene.remove(t.m); t.m.geometry.dispose(); t.m.material.dispose(); this.tracers.splice(i, 1); }
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i]; p.t += dt;
      p.s.scale.setScalar(0.4 + p.t * 2.2);
      p.s.material.opacity = Math.max(0, 0.9 - p.t * 2.4);
      if (p.t > 0.4) { this.scene.remove(p.s); p.s.material.dispose(); this.puffs.splice(i, 1); }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]; f.ttl -= dt;
      if (f.ttl <= 0) { this.scene.remove(f.s); f.s.material.dispose(); this.flashes.splice(i, 1); }
    }
  }

  /* ================= player physics ================= */
  _collide(pos, r) {
    for (const c of this.world.colliders) {
      const nx = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      const dx = pos.x - nx, dz = pos.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r && pos.y + 1.5 > c.minY && pos.y + 0.3 < c.maxY) {
        if (d2 < 1e-8) { pos.x += r; continue; }
        const d = Math.sqrt(d2), push = (r - d) / d;
        pos.x += dx * push; pos.z += dz * push;
      }
    }
    const B = this.world.bounds;
    pos.x = Math.max(B.minX + r, Math.min(B.maxX - r, pos.x));
    pos.z = Math.max(B.minZ + r, Math.min(B.maxZ - r, pos.z));
  }
  _updatePlayer(dt) {
    const p = this.player;
    if (!p.alive) {
      const left = p.respawnAt - this.time;
      this.el.respawnCount.textContent = Math.max(0, left).toFixed(1);
      if (left <= 0) this._respawnPlayer();
      this.camera.position.y = Math.max(0.5, this.camera.position.y - dt * 2);
      this.camera.rotation.z = Math.min(0.5, (this.camera.rotation.z || 0) + dt * 0.8);
      return;
    }
    // crouch (CTRL ou C) — slower, steadier aim
    const wantCrouch = (this.keys.ControlLeft || this.keys.ControlRight || this.keys.KeyC) && p.grounded;
    p.crouchF = Math.max(0, Math.min(1, p.crouchF + (wantCrouch ? dt * 7 : -dt * 7)));
    const sprint = (this.keys.ShiftLeft || this.keys.ShiftRight) && p.crouchF < 0.3;
    const slowMul = this.world.slowAt && this.world.slowAt(p.pos.x, p.pos.z) ? 0.45 : 1;  // água/lago
    const maxSp = (sprint && slowMul === 1 ? 6.6 : 4.7) * (p.scoped ? 0.5 : 1) * (1 - 0.5 * p.crouchF) * slowMul;
    let ix = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0);
    let iz = (this.keys.KeyS ? 1 : 0) - (this.keys.KeyW ? 1 : 0);
    const il = Math.hypot(ix, iz) || 1; ix /= il; iz /= il;
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    // camera: forward = (-sin, -cos), right = (cos, -sin)  →  wish = right*ix + forward*(-iz)
    const wx = ix * cos + iz * sin, wz = -ix * sin + iz * cos;
    const accel = p.grounded ? 42 : 8;
    p.vel.x += wx * accel * dt; p.vel.z += wz * accel * dt;
    if (p.grounded) {
      const f = Math.max(0, 1 - 9 * dt);
      if (!ix && !iz) { p.vel.x *= f; p.vel.z *= f; }
    }
    const sp = Math.hypot(p.vel.x, p.vel.z);
    if (sp > maxSp) { p.vel.x *= maxSp / sp; p.vel.z *= maxSp / sp; }
    // jump
    if (this.keys.Space && p.grounded && this._acceptInput()) {
      p.vel.y = 5.4; p.grounded = false; this.sfx.jump();
    }
    p.vel.y -= 14.5 * dt;
    // integrate with step-limit so platform fronts block
    const oldG = this.world.groundHeightAt(p.pos.x, p.pos.z);
    const tryAxis = (dx, dz) => {
      const nx = p.pos.x + dx, nz = p.pos.z + dz;
      const g = this.world.groundHeightAt(nx, nz);
      if (g - oldG > 0.55 && p.pos.y < g - 0.2) return; // wall-like step
      p.pos.x = nx; p.pos.z = nz;
    };
    tryAxis(p.vel.x * dt, 0); tryAxis(0, p.vel.z * dt);
    this._collide(p.pos, 0.38);
    p.pos.y += p.vel.y * dt;
    const g2 = this.world.groundHeightAt(p.pos.x, p.pos.z);
    if (p.pos.y <= g2) {
      if (!p.grounded && p.vel.y < -6) this.sfx.land();
      p.pos.y = g2; p.vel.y = 0; p.grounded = true;
    } else if (p.pos.y > g2 + 0.05) p.grounded = false;
    // auto-fire (ak/m4/mp5) enquanto o botão está segurado
    if (WEAPONS[p.weapon].auto && this.mouseDown0 && p.alive) this._tryShoot();
    this.bloom = Math.max(0, (this.bloom || 0) - dt * 1.8);
    // camera (eye drops when crouched)
    const eye = 1.62 - 0.52 * p.crouchF;
    this.camera.position.set(p.pos.x, p.pos.y + eye, p.pos.z);
    this.camera.rotation.set(p.pitch, p.yaw, 0);
    // footsteps + view bob
    const moving = sp > 0.6 && p.grounded;
    if (moving) {
      p.stepPhase += dt * sp * 1.6;
      const prev = Math.sin(p.stepPhase - dt * sp * 1.6), now = Math.sin(p.stepPhase);
      if (prev >= 0 && now < 0) this.sfx.step();
    }
    // Aim: real scopes (AWP / Mosin / Rem700) hide the gun and show the scope overlay.
    // Every other weapon does light iron-sight ADS — the gun stays on screen and the
    // crosshair stays visible so you can see exactly where you're aiming.
    const realScope = p.scoped && !!WEAPONS[p.weapon].scope;
    const tFov = p.scoped ? this._zoomFov(p.weapon) : (sprint && moving ? 76 : 70);
    if (Math.abs(this.camera.fov - tFov) > 0.05) {
      this.camera.fov += (tFov - this.camera.fov) * Math.min(1, dt * 16);
      this.camera.updateProjectionMatrix();
    }
    this.el.crosshair.style.display = realScope ? 'none' : 'block';
    // dynamic crosshair gap (movement/spray opens it, crouch + ADS tighten it)
    const gap = Math.max(3, Math.min(26, 5 + sp * 1.15 + this.vm.kick * 20 - p.crouchF * 2.5 - (p.scoped ? 4 : 0)));
    this.el.crosshair.style.setProperty('--ch', gap.toFixed(1) + 'px');
    this.vm.root.visible = !realScope;
    // reload completion
    if (this._reloading()) {
      this.vm.reloadDip = Math.min(1, this.vm.reloadDip + dt * 4);
    } else {
      this.vm.reloadDip = Math.max(0, this.vm.reloadDip - dt * 6); // safety: nunca trava inclinado
      if (p.reloadUntil > 0) {
        p.reloadUntil = 0;
        for (const k of Object.keys(p.ammo)) {
          const am = p.ammo[k], wm = WEAPONS[k].mag;
          if (am.mag < wm && am.res > 0) { const need = wm - am.mag, take = Math.min(need, am.res); am.mag += take; am.res -= take; }
        }
        this.el.reloadNote.classList.add('hidden');
        this.sfx.reloadEnd();
        this.vm.reloadDip = 0;
      }
    }
    // view model animation
    this.vm.kick = Math.max(0, this.vm.kick - dt * 6);
    const bobY = moving ? Math.sin(p.stepPhase * 2) * 0.012 : 0;
    // iron-sight ADS: ease the gun toward screen center so you sight down it
    const adsWant = p.scoped && !realScope ? 1 : 0;
    this.vm.adsF = (this.vm.adsF || 0) + (adsWant - (this.vm.adsF || 0)) * Math.min(1, dt * 12);
    const a = this.vm.adsF;
    this.vm.root.position.set(-0.17 * a, bobY - this.vm.reloadDip * 0.18 - p.crouchF * 0.02 + 0.05 * a, this.vm.kick * 0.09 - 0.1 * a);
    this.vm.root.rotation.x = this.vm.kick * 0.12 + this.vm.reloadDip * 0.9;
  }
  // fy_pool_day ground weapons: anyone who runs over one grabs it (CS-1.6 style).
  // The gun vanishes and respawns after PICKUP_RESPAWN. No-op on maps without
  // pickups (e.g. awp_map). Called once per frame from update().
  _updatePickups() {
    const list = this.world.pickups || [];
    // jogador: captura manual com E (bots pegam andando mesmo)
    let near = null, nearDrop = -1, nearDist = 1.9 * 1.9;
    const consider = (pk, isDrop, idx) => {
      if (this.time < pk.readyAt) return;
      const dx = pk.x - this.player.pos.x, dz = pk.z - this.player.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < nearDist) { nearDist = d2; near = pk; nearDrop = isDrop ? idx : -1; }
    };
    list.forEach((pk, i) => consider(pk, false, i));
    this.drops.forEach((pk, i) => consider(pk, true, i));
    this.nearPickup = near && this.player.alive && this._pickupAllowed(near.weapon) ? { pk: near, dropIdx: nearDrop } : null;
    if (this.el.pickupHint) {
      if (this.nearPickup && this.state === 'live') {
        this.el.pickupHint.textContent = `[E] PEGAR ${WEAPONS[this.nearPickup.pk.weapon].short}`;
        this.el.pickupHint.classList.remove('hidden');
      } else this.el.pickupHint.classList.add('hidden');
    }
    for (const pk of list) {
      // respawn a taken weapon
      if (pk.mesh && !pk.mesh.visible && this.time >= pk.readyAt) pk.mesh.visible = true;
      if (this.time < pk.readyAt) continue;        // still taken
      // bot grab (andando por cima)
      for (const b of this.bots) {
        if (!b.alive) continue;
        const dx = pk.x - b.pos.x, dz = pk.z - b.pos.z;
        if (dx * dx + dz * dz <= 1.7 * 1.7) { this._grabPickup(pk, b, false); break; }
      }
    }
    // drops: bots pegam andando (jogador só com E, acima). Spawn-rack drops are for the
    // PLAYER — bots leave them alone (otherwise they hoover the spawn line on round 1).
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const pk = this.drops[i];
      if (pk.rack) continue;
      for (const b of this.bots) {
        if (!b.alive) continue;
        const dx = pk.x - b.pos.x, dz = pk.z - b.pos.z;
        if (dx * dx + dz * dz <= 1.7 * 1.7) { this._grabPickup(pk, b, false); this.scene.remove(pk.mesh); this.drops.splice(i, 1); break; }
      }
    }
  }
  _botWeapon() {
    // Give bots varied weapons that match the weapon mode, so ground drops aren't all AWP.
    const mode = this.settings.wpnMode || 'all';
    if (mode === 'awp') return 'awp';
    if (mode === 'knife') return 'knife';
    if (mode === 'pistols') return Math.random() < 0.5 ? 'pistol' : 'deagle';
    const pool = ['awp', 'ak', 'm4', 'mp5', 'shotgun', 'deagle', 'm92', 'akm', 'md97',
      'carbine', 'm400', 'mosin', 'rem700', 'lmg', 'scar', 'g3', 'tavor', 'famas', 'uzi', 'p90', 'revolver38'];
    return pool[(Math.random() * pool.length) | 0];
  }
  _pickupAllowed(w) {
    const mode = this.settings.wpnMode || 'all';
    if (mode === 'pistols') return w === 'pistol' || w === 'deagle';
    if (mode === 'knife') return false;
    if (mode === 'awp') return w === 'awp';
    return true; // all
  }
  _grabPickup(pk, who, isPlayer) {
    const w = pk.weapon;                           // qualquer arma de WEAPONS
    if (!WEAPONS[w]) return false;
    if (isPlayer) {
      if (!who.ammo[w]) who.ammo[w] = { mag: 0, res: 0 };
      who.ammo[w].mag = WEAPONS[w].mag;
      who.ammo[w].res = WEAPONS[w].reserve;
      if (who.weapon !== w) { this._switchWeapon(w); this.sfx.reloadEnd(); }
      else this.sfx.uiClick();                     // mesma arma = só munição
    } else {
      who.weapon = w === 'knife' ? 'awp' : w;      // bot grabs it
    }
    if (pk.mesh) pk.mesh.visible = false;           // taken off the ground
    pk.readyAt = this.time + PICKUP_RESPAWN;        // respawns later (map pickups)
    return true;
  }
  // CS: morto larga a arma no chão
  _dropWeapon(x, z, weapon, rack = false) {
    const mesh = weaponModel(weapon) || buildRifle();  // real GLB on the ground
    // lay it FLAT on its side (roll 90° about the barrel) so it rests on the ground
    // instead of standing on its belly. Rack drops (spawn weapon rows) get an aligned
    // yaw so they read as a tidy line; death drops/scatter get a random yaw.
    mesh.position.set(x, 0.09, z);
    mesh.rotation.set(0, rack ? (Math.random() - 0.5) * 0.18 : Math.random() * Math.PI * 2, Math.PI / 2);
    mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(mesh);
    this.drops.push({ x, z, weapon, readyAt: 0, mesh, rack });
  }
  _respawnPlayer() {
    const p = this.player;
    const s = this.world.spawns[p.team][(Math.random() * 4) | 0];
    p.pos.set(s.x, 0, s.z); p.vel.set(0, 0, 0);
    p.hp = 100; p.alive = true; p.crouchF = 0;
    p.yaw = p.team === 'P' ? Math.PI : 0; p.pitch = 0;
    p.ammo.awp.mag = WEAPONS.awp.mag; p.ammo.pistol.mag = WEAPONS.pistol.mag;
    this.camera.rotation.z = 0;
    this.el.respawn.classList.add('hidden');
    this.sfx.respawn();
  }

  /* ================= bots ================= */
  _losClear(from, to) {
    const dir = to.clone().sub(from), dist = dir.length();
    if (dist < 0.5) return true;
    this.ray.set(from, dir.normalize()); this.ray.far = dist - 0.3;
    return this.ray.intersectObjects(this.world.occluders, false).length === 0;
  }
  _botEye(b) { return new THREE.Vector3(b.pos.x, b.pos.y + BOT_EYE, b.pos.z); }
  _enemyOf(bot) { return this.combatants.filter(c => c.team !== bot.team && c.alive); }
  _updateBot(b, dt) {
    const g = b.mesh.group;
    if (!b.alive) {
      b.deadT += dt;
      if (b.mesh.isGLB) {
        b.mesh.ctrl.die();
        b.mesh.ctrl.update(dt, 0, false);
        if (b.deadT > 1.0) g.visible = false; // fall fast, then vanish (no lingering ragdoll)
      } else {
        g.rotation.x = Math.max(-Math.PI / 2, g.rotation.x - dt * 5);
        g.position.y = b.pos.y + Math.max(-0.6, 0 - b.deadT * 0.3);
      }
      if (this.time >= b.respawnAt && (this.state === 'live')) {
        const s = this.world.spawns[b.team][(Math.random() * 4) | 0];
        b.pos.set(s.x, 0, s.z); b.hp = 100; b.alive = true;
        b.target = null; b.path = null; b.yaw = b.team === 'P' ? 0 : Math.PI;
        g.rotation.set(0, b.yaw, 0); g.position.copy(b.pos); g.visible = true;
        if (b.mesh.isGLB) b.mesh.ctrl.revive();
      }
      return;
    }
    if (this.state !== 'live') {
      if (b.mesh.isGLB) b.mesh.ctrl.update(dt, 0, false);
      else poseCharacter(b.mesh.parts, 0, 0, this.time);
      return;
    }

    // --- think: target acquisition
    b.think -= dt;
    if (b.think <= 0) {
      b.think = 0.16;
      let best = null, bd = 1e9;
      for (const e of this._enemyOf(b)) {
        const d = b.pos.distanceTo(e.pos);
        if (d < bd && d < 70) {
          const eye = this._botEye(b);
          const teye = e.isPlayer ? this.camera.position.clone() : this._botEye(e);
          if (this._losClear(eye, teye)) { best = e; bd = d; }
        }
      }
      if (best && b.target !== best) { b.target = best; b.reactAt = this.time + (0.3 + Math.random() * 0.5) / (b.skill * 1.5); }
      else if (!best) b.target = null;
    }

    let moving = 0;
    if (b.target) {
      // --- combat
      const e = b.target;
      const dx = e.pos.x - b.pos.x, dz = e.pos.z - b.pos.z;
      const wantYaw = Math.atan2(dx, dz);
      let dy = wantYaw - b.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      b.yaw += dy * Math.min(1, dt * 7);
      b.strafeT += dt;
      // Hold a comfortable range: advance if far, back off if close, plus a small
      // lateral juke. Moving mostly ALONG the facing (forward/back) makes the forward
      // walk clip read as walking, instead of the old pure sideways strafe that looked
      // like the bot was sliding/moonwalking across the map.
      const dist = Math.hypot(dx, dz);
      const approach = dist > 18 ? 1 : dist < 9 ? -1 : 0;
      const strafe = Math.sin(b.strafeT * 1.1) * 0.22;   // small lateral juke — approach dominant, so the forward clip matches the motion (no sideways slide)
      const fdx = Math.sin(b.yaw), fdz = Math.cos(b.yaw);   // forward (mesh facing)
      const rdx = Math.cos(b.yaw), rdz = -Math.sin(b.yaw);  // right
      const spd = BOT_SPEED * 0.55;
      b.pos.x += (fdx * approach + rdx * strafe) * spd * dt;
      b.pos.z += (fdz * approach + rdz * strafe) * spd * dt;
      this._collide(b.pos, 0.38);
      moving = Math.min(1, Math.abs(approach) + Math.abs(strafe));
      // fire
      if (this.time > b.reactAt && this.time > b.nextShotAt && Math.abs(dy) < 0.3) {
        b.nextShotAt = this.time + (2.1 + Math.random() * 1.4) / (b.skill * 1.5);
        b.revealedAt = this.time;
        const dist = Math.hypot(dx, dz);
        const eSpeed = e.isPlayer ? Math.hypot(e.vel.x, e.vel.z) : BOT_SPEED;
        const crouchBonus = dist > 25 ? 1.18 : 1;   // bot parado em posição = mais preciso
        let chance = (0.72 * b.skill - dist * 0.006 - eSpeed * 0.035) * 1.5 * crouchBonus;
        chance = Math.max(0.07, Math.min(0.92, chance));
        const hit = Math.random() < chance;
        const from = this._botEye(b);
        const teye = (e.isPlayer ? this.camera.position.clone() : this._botEye(e));
        const aim = teye.clone();
        if (!hit) {
          aim.x += (Math.random() - .5) * 2.2; aim.y += (Math.random() - .5) * 1.6; aim.z += (Math.random() - .5) * 2.2;
        }
        const dir = aim.sub(from).normalize();
        // tracer & world impact
        this.ray.set(from, dir); this.ray.far = 200;
        const hitsW = this.ray.intersectObjects(this.world.occluders, false)[0];
        let end = hitsW ? hitsW.point : from.clone().add(dir.clone().multiplyScalar(120));
        if (hit) {
          end = teye;
          const dmg = e.isPlayer ? 63 : 100;   // 1.5x dano
          this._damage(e, dmg, b, 'AWP');
        } else if (hitsW && Math.random() < 0.5) this._puff(hitsW.point, hitsW.face ? hitsW.face.normal : null);
        this._tracer(from.clone().add(dir.clone().multiplyScalar(0.7)), end);
        this._flash(from.clone().add(dir.clone().multiplyScalar(0.85)));
        this.sfx.shotAwp();
        if (b.mesh.isGLB) b.mesh.ctrl.shoot();
      }
    } else {
      // --- roam toward enemy half
      if (!b.path || this.time > b.repathAt) {
        b.repathAt = this.time + 2.5;
        const W = this.world;
        const from = W.nearestWaypoint(b.pos.x, b.pos.z);
        if (this.time > (b.roamUntil || 0) || b.roamIdx === undefined) {
          const sign = b.team === 'P' ? 1 : -1;
          // Per-bot lane preference: the team spreads across left/center/right instead of
          // every bot funnelling down the same corridor (persistent per bot).
          if (b.lanePref === undefined) b.lanePref = [-12, -5, 5, 12][(Math.random() * 4) | 0] + (Math.random() * 4 - 2);
          const candidates = W.waypoints.nodes
            .map((n, i) => ({ n, i }))
            .filter(o => o.n.z * sign > 6 * sign && Math.abs(o.n.x) < 20);
          // rank by closeness to the bot's lane (plus jitter) and pick among the best few
          const ranked = candidates
            .map(o => ({ o, d: Math.abs(o.n.x - b.lanePref) + Math.random() * 7 }))
            .sort((a, b2) => a.d - b2.d);
          const pick = ranked.length ? ranked[(Math.random() * Math.min(3, ranked.length)) | 0].o : { i: from };
          b.roamIdx = pick.i; b.roamUntil = this.time + 9;
        }
        b.path = W.findPath(from, b.roamIdx); b.pathIdx = 1;
      }
      const node = this.world.waypoints.nodes[b.path[Math.min(b.pathIdx, b.path.length - 1)]];
      if (node) {
        const dx = node.x - b.pos.x, dz = node.z - b.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.7) b.pathIdx++;
        else {
          const wantYaw = Math.atan2(dx, dz);
          let dy = wantYaw - b.yaw;
          while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
          b.yaw += dy * Math.min(1, dt * 8);
          const bSlow = this.world.slowAt && this.world.slowAt(b.pos.x, b.pos.z) ? 0.5 : 1;  // bots também vadear
          const px = b.pos.x, pz = b.pos.z;
          b.pos.x += Math.sin(b.yaw) * BOT_SPEED * bSlow * dt;
          b.pos.z += Math.cos(b.yaw) * BOT_SPEED * bSlow * dt;
          this._collide(b.pos, 0.38);
          moving = 1;
          // stuck detection: barely moved (blocked by geometry) -> sidestep + pick a new
          // target so bots don't grind against a box or all funnel to the same spot.
          const moved = Math.hypot(b.pos.x - px, b.pos.z - pz);
          if (moved < BOT_SPEED * bSlow * dt * 0.35) {
            b._stuckT = (b._stuckT || 0) + dt;
            if (b._stuckT > 0.5) {
              b.yaw += (Math.random() < 0.5 ? 1 : -1) * (0.8 + Math.random());
              b.roamUntil = 0; b.repathAt = 0; b.path = null; b._stuckT = 0;
            }
          } else b._stuckT = 0;
        }
      }
    }
    b.pos.y = this.world.groundHeightAt(b.pos.x, b.pos.z);
    g.position.copy(b.pos);
    g.rotation.set(0, b.yaw, 0);
    if (b.mesh.isGLB) {
      b.mesh.ctrl.setCrouch(!!b.target && b.crouchBias);
      // occasional hop while roaming (bots can jump)
      if (!b.target && moving > 0.5 && this.time > (b._nextJump || 0)) {
        if (Math.random() < 0.2) b.mesh.ctrl.jump();
        b._nextJump = this.time + 5 + Math.random() * 8;
      }
      // true ground speed (accounts for collisions / wading / being stuck) drives the
      // leg-cycle rate so the feet plant instead of sliding. The FORWARD-signed component
      // tells the controller when the bot is retreating, so it plays the walk clip in
      // reverse (backpedal) instead of moonwalking forward while moving backward.
      if (b._lp) {
        const dtSafe = Math.max(dt, 1e-3);
        const mx = b.pos.x - b._lp.x, mz = b.pos.z - b._lp.z;
        const spd = Math.hypot(mx, mz) / dtSafe;
        const fwd = (mx * Math.sin(b.yaw) + mz * Math.cos(b.yaw)) / dtSafe;
        b._lp = { x: b.pos.x, z: b.pos.z };
        // nearly stationary → idle instead of walking in place (strafe-oscillation
        // otherwise plays the walk clip at min rate while the bot goes nowhere)
        const mv = spd < 0.35 ? 0 : moving;
        b.mesh.ctrl.update(dt, mv, !!b.target, spd, fwd < -0.25);
      } else {
        b._lp = { x: b.pos.x, z: b.pos.z };
        b.mesh.ctrl.update(dt, moving, !!b.target, 0, false);
      }
    } else {
      b.phase += dt * (moving ? 9 : 0);
      poseCharacter(b.mesh.parts, b.phase, moving, this.time);
    }
  }

  /* ================= radar (CS-style) ================= */
  _updateRadar() {
    const x = this.radarCtx;
    if (!x) return;
    const S = 150, H = S / 2, sc = 1.42;
    x.clearRect(0, 0, S, S);
    x.fillStyle = 'rgba(8,12,8,0.55)';
    x.beginPath(); x.arc(H, H, H - 2, 0, 7); x.fill();
    x.strokeStyle = 'rgba(190,220,120,0.5)'; x.lineWidth = 1.5;
    x.strokeRect(H - 26 * sc, H - 46 * sc, 52 * sc, 92 * sc);
    x.strokeStyle = 'rgba(190,220,120,0.22)';
    x.beginPath(); x.moveTo(H - 26 * sc, H); x.lineTo(H + 26 * sc, H); x.stroke();
    for (const c of this.combatants) {
      if (!c.alive || c.isPlayer) continue;
      const ally = c.team === this.playerTeam;
      if (!ally && this.time - c.revealedAt > 1.6) continue;
      x.fillStyle = ally ? (c.team === 'P' ? '#ff8080' : '#9dff9d') : '#ffd23f';
      x.fillRect(H + c.pos.x * sc - 2, H + c.pos.z * sc - 2, 4, 4);
    }
    // player arrow (rotates with view)
    x.save();
    x.translate(H + this.player.pos.x * sc, H + this.player.pos.z * sc);
    x.rotate(-this.player.yaw);
    x.fillStyle = '#fff';
    x.beginPath(); x.moveTo(0, -5); x.lineTo(4, 4); x.lineTo(-4, 4); x.closePath(); x.fill();
    x.restore();
  }

  /* ================= HUD ================= */
  _banner(title, sub) {
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub;
    this.el.banner.classList.remove('hidden');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => this.el.banner.classList.add('hidden'), 3000);
  }
  _showScoreboard(v) {
    if (v) {
      document.querySelector('#scoreboard h3').textContent =
        `PLACAR — PET ${this.roundsWon.P} × ${this.roundsWon.B} BOL · ROUND ${this.roundNum}`;
      const rows = [...this.combatants].sort((a, b) => b.kills - a.kills).map(c =>
        `<tr class="${c.team === 'P' ? 'tp' : 'tb'}${c.isPlayer ? ' me' : ''}">
          <td>${c.name}${c.isPlayer ? ' ★' : ''}</td><td>${c.def.name}</td>
          <td>${c.kills}</td><td>${c.deaths}</td></tr>`).join('');
      this.el.sbBody.innerHTML = rows;
    }
    this.el.scoreboard.classList.toggle('hidden', !v);
  }
  _updateHud() {
    const p = this.player;
    this.el.hpNum.textContent = Math.max(0, Math.ceil(p.hp));
    this.el.hpFill.style.width = Math.max(0, p.hp) + '%';
    this.el.hpFill.classList.toggle('low', p.hp <= 35);
    this.el.hpNum.classList.toggle('low', p.hp <= 35);
    if (p.weapon === 'knife') {
      this.el.ammoMag.textContent = '—'; this.el.ammoRes.textContent = '';
    } else {
      const a = p.ammo[p.weapon];
      this.el.ammoMag.textContent = a.mag;
      this.el.ammoRes.textContent = a.res;
      this.el.ammoMag.classList.toggle('empty', a.mag === 0);
    }
    const total = Math.max(0, Math.ceil(this.timeLeft));
    this.el.roundTime.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    this.el.roundsP.textContent = this.roundsWon.P;
    this.el.roundsB.textContent = this.roundsWon.B;
    this.el.scoreP.innerHTML = `PET <b>${this.roundKills.P}</b>`;
    this.el.scoreB.innerHTML = `BOL <b>${this.roundKills.B}</b>`;
  }

  /* ================= main update ================= */
  update(dt) {
    if (this.paused) return;
    this.time += dt;
    if (this.state === 'countdown' && this.time >= this.stateUntil) {
      this.state = 'live';
      this._banner('VALENDO!', 'A treta está liberada');
    } else if (this.state === 'live') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) this._endRound();
    } else if (this.state === 'roundEnd' && this.time >= this.stateUntil) {
      if (this.roundsWon.P >= ROUNDS_TO_WIN || this.roundsWon.B >= ROUNDS_TO_WIN) this._endMatch();
      else this._startRound();
    }
    this._updatePlayer(dt);
    for (const b of this.bots) this._updateBot(b, dt);
    this._updatePickups();
    this._updateFx(dt);
    this._updateHud();
    this._updateRadar();
    // hint de pointer lock: visível só quando o jogo está ativo mas sem lock
    if (this.el.lockHint)
      this.el.lockHint.classList.toggle('hidden',
        this.testMode || this.paused || !!document.pointerLockElement ||
        (this.state !== 'live' && this.state !== 'countdown'));
    this.renderer.render(this.scene, this.camera);
  }

  /* ================= teardown ================= */
  dispose() {
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup', this._ku);
    document.removeEventListener('mousedown', this._md);
    document.removeEventListener('mouseup', this._mu);
    document.removeEventListener('mousemove', this._mm);
    document.removeEventListener('contextmenu', this._cc);
    document.removeEventListener('pointerlockchange', this._plc);
    window.removeEventListener('blur', this._blur);
    this.el.hud.classList.add('hidden');
    this.el.pause.classList.add('hidden');
    this.el.matchEnd.classList.add('hidden');
    this.el.killfeed.innerHTML = '';
    this.el.radioLog.innerHTML = '';
    this.el.radioMenu.classList.add('hidden');
    this.el.mkBanner.classList.remove('show');
    this.el.scope.classList.remove('on');
    this.el.respawn.classList.add('hidden');
    this.el.reloadNote.classList.add('hidden');
    this.el.banner.classList.add('hidden');
    this.el.lockHint.classList.add('hidden');
    this.el.scoreboard.classList.add('hidden');
    this.el.vignette.style.opacity = 0;
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.scene.clear();
  }
}
