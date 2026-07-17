// POST /api/submit-match — valida + rate-limita (por IP) e grava via RPC no DB.
// A validação do token do jogador acontece dentro do RPC (schema.sql).
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';

export const prerender = false;

// rate limit por IP (best-effort: memória da instância serverless;
// o limite durável por nick fica no RPC — 1 submit/90s)
const hits = new Map<string, number>();
const WINDOW_MS = 30_000;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  const now = Date.now();
  if (hits.get(ip) && now - hits.get(ip)! < WINDOW_MS)
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { 'content-type': 'application/json' } });

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const { nick, token, won, kills, deaths, headshots, bestStreak } = body ?? {};
  if (typeof nick !== 'string' || typeof token !== 'string')
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const { error } = await supabaseAdmin.rpc('submit_match', {
    p_nick: nick.slice(0, 14), p_token: token,
    p_won: !!won, p_kills: kills | 0, p_deaths: deaths | 0,
    p_headshots: headshots | 0, p_best_streak: bestStreak | 0,
  });
  if (error)
    return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: { 'content-type': 'application/json' } });

  hits.set(ip, now);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
