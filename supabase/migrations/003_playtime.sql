-- Migration 003: tempo de jogo (rode se o schema antigo já foi aplicado)
alter table public.stats add column if not exists play_seconds bigint not null default 0;
-- recrie o submit_match e a view leaderboard do schema.sql atual (create or replace)
