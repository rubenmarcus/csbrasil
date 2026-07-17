-- CS BRASIL — schema do ranking global (Fase 2, futuro)
-- Rode no SQL Editor do Supabase. Depois configure URL + anon key no client
-- (js/ranking.js, a criar) — a anon key é pública por design; a segurança
-- vem das policies abaixo, não de esconder a chave.

-- Tabela de jogadores: nick único + token secreto gerado no client
-- (UUID salvo no localStorage; funciona como "senha invisível" até a Fase 3,
-- quando Supabase Auth com email/OAuth substitui o token).
create table if not exists public.players (
  nick        text primary key check (char_length(nick) between 2 and 14),
  token       uuid not null,
  social_link text check (char_length(social_link) <= 60),
  created_at  timestamptz not null default now()
);

-- Stats agregadas por jogador (1:1 com players).
create table if not exists public.stats (
  nick        text primary key references public.players(nick) on delete cascade,
  matches     int not null default 0,
  wins        int not null default 0,
  kills       int not null default 0,
  deaths      int not null default 0,
  headshots   int not null default 0,
  best_streak int not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.stats   enable row level security;

-- Leitura pública (o ranking é público).
create policy "players: leitura pública" on public.players
  for select using (true);
create policy "stats: leitura pública" on public.stats
  for select using (true);

-- NADA de insert/update/delete direto: só via RPC abaixo (security definer),
-- que valida o token antes de gravar.

-- Registrar nick novo (falha se o nick já existir) ou validar token existente.
create or replace function public.register_player(p_nick text, p_token uuid, p_social text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into players (nick, token, social_link) values (p_nick, p_token, p_social)
  on conflict (nick) do nothing;
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'nick já está em uso';
  end if;
  if p_social is not null then
    update players set social_link = p_social where nick = p_nick and token = p_token;
  end if;
end $$;

-- Submeter stats de uma partida (só grava se o token bater).
create or replace function public.submit_match(
  p_nick text, p_token uuid,
  p_won boolean, p_kills int, p_deaths int, p_headshots int, p_best_streak int
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'token inválido';
  end if;
  -- sanity check anti-cheat básico (valores absurdos são descartados)
  if p_kills < 0 or p_kills > 200 or p_deaths < 0 or p_deaths > 200
     or p_headshots < 0 or p_headshots > p_kills or p_best_streak < 0 or p_best_streak > 30 then
    raise exception 'stats implausíveis';
  end if;
  insert into stats (nick, matches, wins, kills, deaths, headshots, best_streak)
  values (p_nick, 1, p_won::int, p_kills, p_deaths, p_headshots, p_best_streak)
  on conflict (nick) do update set
    matches     = stats.matches + 1,
    wins        = stats.wins + p_won::int,
    kills       = stats.kills + p_kills,
    deaths      = stats.deaths + p_deaths,
    headshots   = stats.headshots + p_headshots,
    best_streak = greatest(stats.best_streak, p_best_streak),
    updated_at  = now();
end $$;

-- Leaderboard: top por kills (o client pode ordenar por outras colunas).
create or replace view public.leaderboard as
select s.nick, p.social_link, s.matches, s.wins, s.kills, s.deaths,
       s.headshots, s.best_streak,
       round(s.kills::numeric / greatest(s.deaths, 1), 2) as kd
from stats s join players p on p.nick = s.nick
order by s.kills desc, s.wins desc
limit 100;
