// First-person viewmodel capture: cycles the player's weapon in a live (debug) match
// and screenshots each viewmodel, so hand/grip alignment can be judged per weapon.
// Usage: node tools/eval/vm-capture.mjs [outDir] [weapon1,weapon2,...]
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = process.argv[2] || '/tmp/vmframes';
const LIST = (process.argv[3] || 'awp,ak,m4,mp5,shotgun,deagle,pistol,knife,mosin,lmg').split(',');
const BASE = process.env.BASE || 'http://localhost:8123';
const gRoot = execSync('npm root -g').toString().trim();
const _pw = await import(pathToFileURL(`${gRoot}/playwright/index.js`).href);
const chromium = _pw.chromium || _pw.default?.chromium;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--headless=new', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`${BASE}/?debug=1&auto=P,mst`, { waitUntil: 'load' });
await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
await page.waitForFunction(() => window.__game && window.__game.state === 'live', null, { timeout: 60000 });

for (const id of LIST) {
  const ok = await page.evaluate((wid) => {
    const g = window.__game;
    if (!g.player.ammo[wid] && g.player.ammo) { /* ensure ammo object has it */ }
    if (g._switchWeapon) { g._switchWeapon(wid); return true; }
    if (g.vm.models[wid]) { g.player.weapon = wid; return true; }
    return false;
  }, id);
  await page.waitForTimeout(350);
  // crop the bottom-right quadrant (viewmodel region)
  await page.screenshot({ path: `${OUT}/${id}.png`, clip: { x: 500, y: 300, width: 780, height: 500 } });
  console.log(ok ? 'shot' : 'NO MODEL', id);
}
await browser.close();
console.log('DONE ->', OUT);
