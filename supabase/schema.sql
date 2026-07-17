-- CS BRASIL — schema do ranking global (Fase 2, futuro)
-- Rode no SQL Editor do Supabase. Depois configure URL + anon key no client
-- (js/ranking.js, a criar) — a anon key é pública por design; a segurança
-- vem das policies abaixo, não de esconder a chave.

-- Tabela de jogadores: id UUID estável (PK, futuro link com auth.users na
-- Fase 3) + nick único (identidade anti-impersonação, estilo CS 1.6).
-- Se um dia quiser nicks duplicados (modelo BattleTag), basta dropar o
-- unique do nick — o id continua distinguindo cada jogador.
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  nick        text not null unique check (char_length(nick) between 2 and 14),
  token       uuid not null,
  social_link text check (char_length(social_link) <= 60),
  hidden      boolean not null default false,  -- moderação: esconde do ranking
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

-- Submeter stats de uma partida (só grava se o token bater + rate limit).
create or replace function public.submit_match(
  p_nick text, p_token uuid,
  p_won boolean, p_kills int, p_deaths int, p_headshots int, p_best_streak int
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_last timestamptz;
begin
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'token inválido';
  end if;
  -- rate limit: 1 partida a cada 90s por nick (uma partida real dura ~2-8 min)
  select updated_at into v_last from stats where nick = p_nick;
  if v_last is not null and now() - v_last < interval '90 seconds' then
    raise exception 'aguarde antes de submeter outra partida';
  end if;
  -- sanity check anti-cheat básico (valores absurdos são descartados)
  if p_kills < 0 or p_kills > 60 or p_deaths < 0 or p_deaths > 60
     or p_headshots < 0 or p_headshots > p_kills or p_best_streak < 0 or p_best_streak > 15 then
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

-- Leaderboard: top por kills (o client pode ordenar por outras colunas),
-- sem jogadores escondidos pela moderação.
create or replace view public.leaderboard as
select s.nick, p.social_link, s.matches, s.wins, s.kills, s.deaths,
       s.headshots, s.best_streak,
       round(s.kills::numeric / greatest(s.deaths, 1), 2) as kd
from stats s join players p on p.nick = s.nick
where not p.hidden
order by s.kills desc, s.wins desc
limit 100;

-- ---------------------------------------------------------------------------
-- PRESENÇA & MAPA ("mapa da treta ao vivo")
-- Preenchida por uma Edge Function (Deno) — RPC do PostgREST NÃO tem acesso
-- ao IP do client. A function lê x-forwarded-for, resolve GeoIP (cidade) e
-- faz upsert aqui. LGPD: NÃO guardar IP bruto — só geo aproximado (cidade),
-- com consentimento na tela de registro.
-- ---------------------------------------------------------------------------
create table if not exists public.presence (
  nick      text primary key references public.players(nick) on delete cascade,
  last_seen timestamptz not null default now(),
  city      text,
  country   text,
  lat       float8,
  lon       float8
);

alter table public.presence enable row level security;
create policy "presence: leitura pública" on public.presence
  for select using (true);

-- "online agora" = heartbeat nos últimos 2 minutos
create or replace view public.online_now as
select nick, city, country, lat, lon, last_seen
from presence
where last_seen > now() - interval '2 minutes';

-- Histórico AGREGADO por cidade (não por pessoa) — privacidade primeiro.
create table if not exists public.city_daily (
  day     date not null,
  city    text not null,
  country text,
  matches int not null default 0,
  primary key (day, city)
);

alter table public.city_daily enable row level security;
create policy "city_daily: leitura pública" on public.city_daily
  for select using (true);
