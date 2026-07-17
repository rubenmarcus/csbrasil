// GET /api/badge/[nick].png — badge compartilhável com stats (og:image).
// Render: resvg-js + fonte embutida (serverless da Vercel não tem fontes de sistema).
import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import { supabaseAdmin, NOT_CONFIGURED } from '../../../lib/supabase';
import { FONT_BOLD_B64 } from '../../../lib/font-data';
import { fmtTime } from '../../../lib/fmt';

export const prerender = false;

const fontBuffers = [Buffer.from(FONT_BOLD_B64, 'base64')];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function badgeSvg(p: any): string {
  const kd = p.deaths ? (p.kills / p.deaths).toFixed(2) : String(p.kills);
  const cells: [string, string][] = [
    ['PARTIDAS', String(p.matches)], ['VITÓRIAS', String(p.wins)], ['K/D', kd], ['TEMPO', fmtTime(p.play_seconds)],
    ['ABATES', String(p.kills)], ['HEADSHOTS', String(p.headshots)], ['SEQUÊNCIA', `${p.best_streak}×`], ['ROUNDS', String(p.rounds)],
  ];
  const grid = cells.map(([label, v], i) => {
    const x = 60 + (i % 4) * 190, y = 285 + Math.floor(i / 4) * 105;
    return `<text x="${x}" y="${y}" font-size="40" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans">${v}</text>
    <text x="${x}" y="${y + 30}" font-size="15" fill="#8a8064" font-family="DejaVu Sans" letter-spacing="1">${label}</text>`;
  }).join('');
  const side = p.matches_p >= p.matches_b ? ['PETISTA', '#e03232'] : ['BOLSONARISTA', '#1faa4d'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="440" viewBox="0 0 840 440">
  <rect width="840" height="440" fill="#0c0e11"/>
  <rect width="840" height="6" fill="#e03232"/><rect y="434" width="840" height="6" fill="#1faa4d"/>
  <text x="60" y="70" font-size="26" font-weight="bold" fill="#ffd23f" font-family="DejaVu Sans" letter-spacing="4">CS BRASIL</text>
  <text x="780" y="70" font-size="18" fill="${side[1]}" font-family="DejaVu Sans" text-anchor="end" font-weight="bold">${side[0]} · ${p.matches_p}P × ${p.matches_b}B</text>
  <text x="60" y="150" font-size="58" font-weight="bold" fill="#f2ead8" font-family="DejaVu Sans">${esc(p.nick)}</text>
  <text x="60" y="195" font-size="20" fill="#b8d94a" font-family="DejaVu Sans">${esc(p.social || 'arena Treta Suprema')}</text>
  <rect x="40" y="240" width="760" height="1.5" fill="#3a3325"/>
  ${grid}
</svg>`;
}

export function renderBadge(p: any): Buffer {
  const resvg = new Resvg(badgeSvg(p), {
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans' },
    background: '#0c0e11',
  });
  return resvg.render().asPng();
}

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });
  const nick = (params.nick || '').slice(0, 14);
  const { data } = await supabaseAdmin
    .from('stats').select('*, players!inner(nick, social_link)').eq('nick', nick).maybeSingle();
  if (!data) return new Response('not found', { status: 404 });
  const p = { ...data, social: (data as any).players?.social_link };
  const png = renderBadge(p);
  return new Response(new Uint8Array(png), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=300' },
  });
};
