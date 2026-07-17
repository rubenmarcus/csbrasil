// GET /api/leaderboard — ranking global (top 100) via service key no servidor.
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });
  const { data, error } = await supabaseAdmin.from('leaderboard').select('*');
  if (error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ players: data }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' },
  });
};
