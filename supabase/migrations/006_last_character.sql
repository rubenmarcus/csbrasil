-- Migration 006: personagem do jogador (rode se o schema antigo já foi aplicado)
alter table public.stats add column if not exists last_character text;
-- recrie o submit_match do schema.sql atual (create or replace, 11 parâmetros)
