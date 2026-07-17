// GET /api/badge/<id|nick>.png — badge com stats.
// Render: resvg-wasm (binário único servido de /wasm/) + fonte DejaVu embutida.
// Avatar: foto → unavatar(X) → personagem do jogo (SVG) → inicial.
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

// lado do jogador: P > B = PETISTA, B > P = BOLSONARISTA, empate = NEUTRO
export function sideOf(mp: number, mb: number): [string, string] {
  if (mp > mb) return ['PETISTA', '#e03232'];
  if (mb > mp) return ['BOLSONARISTA', '#1faa4d'];
  return ['NEUTRO', '#ffd23f'];
}

/* ---------- personagens (mini-portrait SVG no círculo) ---------- */
const CHARS: Record<string, { name: string; skin: string; shirt: string; hair: string; feat: string }> = {
  esquerdomacho: { name: 'Esquerdomacho', skin: '#e8b98a', shirt: '#b03a2e', hair: '#4a3428', feat: 'beard-glasses' },
  sindicato: { name: 'Líder do Sindicato', skin: '#c98d5e', shirt: '#777777', hair: '#3a3a3a', feat: 'cap-vest' },
  mst: { name: 'Líder do MST', skin: '#8d5a3b', shirt: '#7a6a45', hair: '#2a1e14', feat: 'cap' },
  doutora: { name: 'Doutora do SUS', skin: '#d9a580', shirt: '#f0f0f0', hair: '#3a2a1e', feat: 'ponytail-coat' },
  caminhoneiro: { name: 'Caminhoneiro', skin: '#d9a066', shirt: '#ffd23f', hair: '#3a2a1e', feat: 'capblue-shades' },
  influencer: { name: 'Influencer de Dubai', skin: '#f2c9a4', shirt: '#f0f0f0', hair: '#f5d76e', feat: 'blonde-shades' },
  sertanejo: { name: 'Cantor Sertanejo', skin: '#c98d5e', shirt: '#8a2f2f', hair: '#2a1e14', feat: 'cowboy-stache' },
  senhora: { name: 'Tia Zilá', skin: '#eec39a', shirt: '#1faa4d', hair: '#d8d8d8', feat: 'bun-shades' },
};
export const charName = (id?: string | null) => (id && CHARS[id] ? CHARS[id].name : null);

function charSvg(id: string, sideColor: string): string {
  const c = CHARS[id];
  if (!c) return '';
  const eyes = `<rect x="734" y="60" width="8" height="8" fill="#1a1a1a"/><rect x="754" y="60" width="8" height="8" fill="#1a1a1a"/>`;
  let feat = eyes;
  switch (c.feat) {
    case 'beard-glasses':
      feat = `<rect x="728" y="76" width="40" height="14" fill="#3a2a1e"/><rect x="730" y="58" width="14" height="8" fill="#222"/><rect x="752" y="58" width="14" height="8" fill="#222"/><rect x="744" y="60" width="8" height="3" fill="#222"/>`; break;
    case 'cap-vest':
      feat = `<rect x="724" y="40" width="48" height="14" fill="#c0392b"/><rect x="720" y="52" width="56" height="6" fill="#c0392b"/>` + eyes +
        `<rect x="716" y="96" width="64" height="40" fill="#8e2f24"/>`; break;
    case 'cap':
      feat = `<rect x="724" y="40" width="48" height="14" fill="#c0392b"/><rect x="720" y="52" width="56" height="6" fill="#c0392b"/>` + eyes; break;
    case 'ponytail-coat':
      feat = `<rect x="724" y="36" width="48" height="12" fill="${c.hair}"/><rect x="772" y="44" width="9" height="30" fill="${c.hair}"/>` + eyes; break;
    case 'capblue-shades':
      feat = `<rect x="724" y="40" width="48" height="14" fill="#2456a6"/><rect x="720" y="52" width="56" height="6" fill="#2456a6"/><rect x="726" y="60" width="44" height="10" fill="#111"/>`; break;
    case 'blonde-shades':
      feat = `<rect x="720" y="34" width="56" height="16" fill="${c.hair}"/><rect x="716" y="42" width="9" height="42" fill="${c.hair}"/><rect x="771" y="42" width="9" height="42" fill="${c.hair}"/><rect x="726" y="60" width="44" height="10" fill="#c9a227"/>`; break;
    case 'cowboy-stache':
      feat = `<rect x="712" y="52" width="72" height="8" fill="#7a5230"/><rect x="728" y="30" width="40" height="24" fill="#7a5230"/><rect x="734" y="78" width="28" height="6" fill="#3a2a1e"/>` + eyes; break;
    case 'bun-shades':
      feat = `<circle cx="748" cy="34" r="9" fill="${c.hair}"/><rect x="724" y="40" width="48" height="10" fill="${c.hair}"/><rect x="724" y="58" width="48" height="12" fill="#1a1a1a"/>`; break;
  }
  return `<defs><clipPath id="cav"><circle cx="748" cy="96" r="56"/></clipPath></defs>
  <g clip-path="url(#cav)">
    <rect x="680" y="28" width="136" height="136" fill="${sideColor}" opacity="0.22"/>
    <rect x="716" y="96" width="64" height="68" fill="${c.shirt}"/>
    <rect x="724" y="44" width="48" height="52" rx="8" fill="${c.skin}"/>
    ${feat}
  </g>
  <circle cx="748" cy="96" r="56" fill="none" stroke="${sideColor}" stroke-width="4"/>`;
}

function badgeSvg(p: any, avatarUri: string | null, charId: string | null): string {
  const kd = p.deaths ? (p.kills / p.deaths).toFixed(2) : String(p.kills);
  const [sideLabel, sideColor] = sideOf(p.matches_p, p.matches_b);
  const cName = charName(charId);

  const cells: [string, string][] = [
    ['PARTIDAS', String(p.matches)], ['VITÓRIAS', String(p.wins)], ['K/D', kd], ['TEMPO', displayTime(p)],
    ['KILLS', String(p.kills)], ['HEADSHOTS', String(p.headshots)], ['SEQUÊNCIA', `${p.best_streak}×`], ['ROUNDS', String(p.rounds)],
  ];
  const grid = cells.map(([label, v], i) => {
    const x = 46 + (i % 4) * 194, y = 255 + Math.floor(i / 4) * 90;
    return `<rect x="${x}" y="${y}" width="182" height="76" rx="10" fill="#12160e" stroke="#2a2e20"/>
    <text x="${x + 16}" y="${y + 44}" font-size="32" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans">${v}</text>
    <text x="${x + 16}" y="${y + 64}" font-size="13" fill="#8a8064" font-family="DejaVu Sans" letter-spacing="1">${label}</text>`;
  }).join('');

  // skyline fictional Brasília no rodapé
  const skyline = `<g fill="#161a20">
    <rect x="0" y="418" width="840" height="22"/>
    <rect x="596" y="398" width="10" height="24"/><rect x="612" y="398" width="10" height="24"/>
    <path d="M 560 418 a 16 16 0 0 1 32 0 z"/>
    <path d="M 632 402 a 16 16 0 0 0 32 0 z"/>
    <rect x="180" y="404" width="34" height="18"/><rect x="230" y="396" width="26" height="26"/><rect x="90" y="408" width="40" height="14"/>
  </g>`;

  const avatar = avatarUri
    ? `<defs><clipPath id="cav"><circle cx="748" cy="96" r="56"/></clipPath></defs>
       <image href="${avatarUri}" x="692" y="40" width="112" height="112" clip-path="url(#cav)"/>
       <circle cx="748" cy="96" r="56" fill="none" stroke="${sideColor}" stroke-width="4"/>`
    : (charId && CHARS[charId] ? charSvg(charId, sideColor)
    : `<circle cx="748" cy="96" r="56" fill="${sideColor}" opacity="0.25"/>
       <circle cx="748" cy="96" r="56" fill="none" stroke="${sideColor}" stroke-width="4"/>
       <text x="748" y="118" font-size="64" font-weight="bold" fill="${sideColor}" font-family="DejaVu Sans" text-anchor="middle">${esc((p.nick[0] || '?').toUpperCase())}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="440" viewBox="0 0 840 440">
  <rect width="840" height="440" fill="#0c0e11"/>
  <circle cx="748" cy="96" r="210" fill="${sideColor}" opacity="0.07"/>
  <rect width="840" height="6" fill="#e03232"/><rect y="434" width="840" height="6" fill="#1faa4d"/>
  ${skyline}
  <text x="56" y="66" font-size="24" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans" letter-spacing="5">CS BRASIL</text>
  <text x="660" y="66" font-size="17" fill="${sideColor}" font-family="DejaVu Sans" text-anchor="end" font-weight="bold">${sideLabel} · ${p.matches_p}P × ${p.matches_b}B</text>
  <text x="56" y="148" font-size="56" font-weight="bold" fill="#f2ead8" font-family="DejaVu Sans">${esc(p.nick)}</text>
  ${p.social ? `<text x="56" y="184" font-size="19" fill="#b8d94a" font-family="DejaVu Sans">${esc(p.social)}</text>` : ''}
  ${cName ? `<text x="56" y="212" font-size="17" fill="#8a8064" font-family="DejaVu Sans">joga de ${esc(cName)}</text>` : ''}
  <rect x="46" y="234" width="748" height="1.5" fill="#3a3325"/>
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
  const first = parts[0] || '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(first);
  const { data } = await (isUuid
    ? query.eq('players.id', first).maybeSingle()
    : query.eq('nick', first.replace(/\.png$/, '').slice(0, 14)).maybeSingle());
  if (!data) return new Response('not found', { status: 404 });
  const p = { ...data, social: (data as any).players?.social_link };
  const avatarUri = await avatarDataUri((data as any).players?.avatar_url || socialAvatar(p.social));
  await init(request);
  const resvg = new Resvg(badgeSvg(p, avatarUri, data.last_character), {
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans' },
    background: '#0c0e11',
  });
  return new Response(new Uint8Array(resvg.render().asPng()), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300' },
  });
};
