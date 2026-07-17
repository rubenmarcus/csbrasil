// Procedural WebAudio SFX + user sample packs (audio/manifest.json).
// Real CS 1.6 samples are NOT bundled (Valve copyright) — drop your own legally-owned
// files in audio/cs/ and register them under "cs" in audio/manifest.json.
export class Sfx {
  constructor() {
    this.ctx = null; this.master = null; this.vol = 0.7;
    this.pack = null;            // parsed manifest
    this._lastVoice = 0;
    this._radioAudio = null;
  }
  async loadManifest() {
    try {
      const r = await fetch('audio/manifest.json?v=3', { cache: 'no-cache' });
      this.pack = await r.json();
    } catch { this.pack = null; }
  }
  _sample(url, vol = 1) {
    try {
      const a = new Audio(encodeURI(url));
      a.volume = Math.min(1, this.vol * vol);
      a.play().catch(() => {});
      return a;
    } catch { return null; }
  }
  _pick(arr) { return arr && arr.length ? arr[(Math.random() * arr.length) | 0] : null; }

  // team voice line (kill celebration / random), throttled
  voice(team, minGap = 3.5) {
    const now = performance.now();
    if (now - this._lastVoice < minGap * 1000) return;
    const f = this._pick(this.pack?.voice?.[team]);
    if (f) { this._lastVoice = now; this._sample(f); }
  }
  // player-triggered radio line (CS-style) — always plays, stops previous
  radioVoice(team) {
    const f = this._pick(this.pack?.voice?.[team]);
    if (!f) return false;
    if (this._radioAudio) this._radioAudio.pause();
    this._radioAudio = this._sample(f);
    this._lastVoice = performance.now();
    return true;
  }
  roundSound(team) { const f = this._pick(this.pack?.round?.[team]); if (f) { this._sample(f); return true; } return false; }
  csSound(key) { const f = this._cs(key); if (f) { this._sample(f); return true; } return false; }
  general(kind) { const f = this._pick(this.pack?.general?.[kind]); if (f) { this._sample(f); return true; } return false; }
  _cs(key) { const v = this.pack?.cs?.[key]; return v && v.length ? this._pick(v) : null; }

  ensure() {
    if (this.disabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.vol;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch { this.disabled = true; }
  }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }

  _env(node, t0, a, peak, d, end = 0.0001) {
    node.gain.setValueAtTime(0.0001, t0);
    node.gain.exponentialRampToValueAtTime(peak, t0 + a);
    node.gain.exponentialRampToValueAtTime(end, t0 + a + d);
  }
  _noise(dur) {
    const n = this.ctx.sampleRate * dur, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf; return src;
  }
  _osc(type, freq) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; }
  _burst(dur, peak, filterFreq, q = 1, type = 'lowpass') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, src = this._noise(dur);
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq; f.Q.value = q;
    const g = this.ctx.createGain(); this._env(g, t, 0.004, peak, dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(); src.stop(t + dur + 0.05);
  }
  _beep(type, f0, f1, dur, peak, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay, o = this._osc(type, f0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = this.ctx.createGain(); this._env(g, t, 0.005, peak, dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  uiClick()   { this.ensure(); this._beep('square', 880, 660, .06, .12); }
  scopeIn()   { const s = this._cs('scope'); if (s) { this._sample(s); return; }
    this.ensure(); this._beep('sine', 500, 900, .09, .15); }
  scopeOut()  { this.ensure(); this._beep('sine', 900, 500, .09, .12); }
  shotAwp() {
    const s = this._cs('awp');
    if (s) { this._sample(s, 0.3); return; }
    this.ensure();
    this._burst(.32, .9, 900);            // crack
    this._burst(.5, .5, 220);             // body boom
    this._beep('sine', 120, 40, .4, .5);  // low thump
  }
  shotPistol(){ const s = this._cs('pistol'); if (s) { this._sample(s); return; }
    this.ensure(); this._burst(.14, .55, 1400); this._beep('sine', 200, 70, .15, .3); }
  knife()     { const s = this._cs('knife'); if (s) { this._sample(s); return; }
    this.ensure(); this._burst(.1, .3, 3000, 2, 'bandpass'); }
  knifeHit()  { const s = this._cs('knifehit'); if (s) { this._sample(s); return; }
    this.ensure(); this._burst(.08, .3, 1200); }
  knifeDeploy(){ const s = this._cs('knifedeploy'); if (s) { this._sample(s, .7); } }
  dryFire()   { this.ensure(); this._beep('square', 1200, 900, .03, .1); }
  bolt()      { this.ensure(); this._beep('square', 300, 180, .05, .14); this._beep('square', 200, 320, .05, .12, .09); }
  reloadStart(){ const s = this._cs('reload'); if (s) { this._sample(s); return; }
    this.ensure(); this._beep('square', 240, 160, .07, .16); this._burst(.08, .2, 2000); }
  reloadEnd() { const s = this._cs('reloadend'); if (s) { this._sample(s); return; }
    this.ensure(); this._beep('square', 180, 420, .09, .2); this._burst(.06, .25, 2600); }
  hitmark()   { this.ensure(); this._beep('sine', 1400, 1100, .05, .22); }
  killConfirm(){ this.ensure(); this._beep('sine', 660, 660, .07, .25); this._beep('sine', 990, 990, .1, .25, .08); }
  hurt()      { this.ensure(); this._beep('sawtooth', 180, 90, .18, .3); this._burst(.1, .2, 500); }
  death()     { this.ensure(); this._beep('sawtooth', 220, 40, .6, .35); }
  jump()      { this.ensure(); this._beep('sine', 220, 330, .08, .1); }
  land()      { this.ensure(); this._burst(.08, .18, 400); }
  step()      { const s = this._cs('footsteps'); if (s) { this._sample(s, 0.5); return; }
    this.ensure(); this._burst(.045, .09, 700 + Math.random() * 300); }
  respawn()   { this.ensure(); this._beep('sine', 440, 880, .18, .18); }
  ricochet()  { this.ensure(); this._beep('sine', 2400, 700, .12, .08); }

  vuvuzela(dur = 1.2) { // round start — Brazilian stadium energy
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [233, 234.5, 232].forEach(f => {
      const o = this._osc('sawtooth', f), g = this.ctx.createGain();
      const fl = this.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1200;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + .1);
      g.gain.setValueAtTime(0.12, t + dur - .15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + .05);
    });
  }
  roundWin()  { this.ensure(); [523, 659, 784, 1047].forEach((f, i) => this._beep('square', f, f, .16, .2, i * .13)); }
  roundLose() { this.ensure(); [392, 330, 262].forEach((f, i) => this._beep('square', f, f * .9, .22, .2, i * .16)); }
  matchWin()  { this.ensure(); [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this._beep('square', f, f, .18, .22, i * .14)); this.vuvuzela(1.8); }
}
