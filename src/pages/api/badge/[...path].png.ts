// GET /api/badge/<id|nick>.png — badge com stats.
// Render: resvg-wasm (binário único servido de /wasm/, funciona em qualquer
// serverless) + fonte DejaVu embutida.
import type { APIRoute } from 'astro';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import sharp from 'sharp';
import { supabaseAdmin, NOT_CONFIGURED } from '../../../lib/supabase';
import { FONT_BOLD_B64 } from '../../../lib/font-data';
import { displayTime } from '../../../lib/fmt';
import { socialAvatar } from '../../../lib/social';

export const prerender = false;

const fontBuffers = [Buffer.from(FONT_BOLD_B64, 'base64')];
let wasmReady: Promise<unknown> | null = null;
function init(req: Request) {
  return wasmReady ??= (async () => {
    const r = await fetch(new URL('/wasm/resvg.wasm', req.url));
    if (!r.ok) throw new Error('wasm fetch failed: ' + r.status);
    return initWasm(await r.arrayBuffer());
  })();
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function avatarDataUri(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const png = await sharp(buf).resize(120, 120, { fit: 'cover' }).png().toBuffer();
    return 'data:image/png;base64,' + png.toString('base64');
  } catch { return null; }
}

export function badgeSvg(p: any, avatarUri: string | null): string {
  const kd = p.deaths ? (p.kills / p.deaths).toFixed(2) : String(p.kills);
  const cells: [string, string][] = [
    ['PARTIDAS', String(p.matches)], ['VITÓRIAS', String(p.wins)], ['K/D', kd], ['TEMPO', displayTime(p)],
    ['KILLS', String(p.kills)], ['HEADSHOTS', String(p.headshots)], ['SEQUÊNCIA', `${p.best_streak}×`], ['ROUNDS', String(p.rounds)],
  ];
  const grid = cells.map(([label, v], i) => {
    const x = 60 + (i % 4) * 190, y = 285 + Math.floor(i / 4) * 105;
    return `<text x="${x}" y="${y}" font-size="40" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans">${v}</text>
    <text x="${x}" y="${y + 30}" font-size="15" fill="#8a8064" font-family="DejaVu Sans" letter-spacing="1">${label}</text>`;
  }).join('');
  const side = p.matches_p >= p.matches_b ? ['PETISTA', '#e03232'] : ['BOLSONARISTA', '#1faa4d'];
  const avatar = avatarUri
    ? `<defs><clipPath id="cav"><circle cx="748" cy="96" r="56"/></clipPath></defs>
       <image href="${avatarUri}" x="692" y="40" width="112" height="112" clip-path="url(#cav)"/>
       <circle cx="748" cy="96" r="56" fill="none" stroke="${side[1]}" stroke-width="4"/>`
    : `<circle cx="748" cy="96" r="56" fill="${side[1]}" opacity="0.25"/>
       <circle cx="748" cy="96" r="56" fill="none" stroke="${side[1]}" stroke-width="4"/>
       <text x="748" y="118" font-size="64" font-weight="bold" fill="${side[1]}" font-family="DejaVu Sans" text-anchor="middle">${esc((p.nick[0] || '?').toUpperCase())}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="440" viewBox="0 0 840 440">
  <rect width="840" height="440" fill="#0c0e11"/>
  <rect width="840" height="6" fill="#e03232"/><rect y="434" width="840" height="6" fill="#1faa4d"/>
  <text x="60" y="70" font-size="26" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans" letter-spacing="4">CS BRASIL</text>
  <text x="670" y="70" font-size="18" fill="${side[1]}" font-family="DejaVu Sans" text-anchor="end" font-weight="bold">${side[0]} · ${p.matches_p}P × ${p.matches_b}B</text>
  <text x="60" y="150" font-size="58" font-weight="bold" fill="#f2ead8" font-family="DejaVu Sans">${esc(p.nick)}</text>
  <text x="60" y="195" font-size="20" fill="#b8d94a" font-family="DejaVu Sans">${esc(p.social || 'arena Treta Suprema')}</text>
  <rect x="40" y="240" width="760" height="1.5" fill="#3a3325"/>
  ${avatar}
  ${grid}
</svg>`;
}

export const GET: APIRoute = async (ctx) => {
  try {
    return await handle(ctx);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e), stack: String(e?.stack || '').slice(0, 600) }),
      { status: 500, headers: { 'content-type': 'application/json' } });
  }
};

const handle: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });
  const parts = (params.path || '').split('/').filter(Boolean);
  let query = supabaseAdmin.from('stats').select('*, players!inner(id, nick, social_link, avatar_url)');
  // /api/badge/<id>.png | /api/badge/<id>/<nick>.png | /api/badge/<nick>.png (legado)
  const first = parts[0] || '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(first);
  const { data } = await (isUuid
    ? query.eq('players.id', first).maybeSingle()
    : query.eq('nick', first.replace(/\.png$/, '').slice(0, 14)).maybeSingle());
  if (!data) return new Response('not found', { status: 404 });
  const p = { ...data, social: (data as any).players?.social_link };
  const avatarUri = await avatarDataUri((data as any).players?.avatar_url || socialAvatar(p.social));
  await init(request);
  const resvg = new Resvg(badgeSvg(p, avatarUri), {
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans' },
    background: '#0c0e11',
  });
  return new Response(new Uint8Array(resvg.render().asPng()), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300' },
  });
};
