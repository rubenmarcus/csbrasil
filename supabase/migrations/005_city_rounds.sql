-- Migration 005: rounds por cidade (rode se o schema antigo já foi aplicado)
alter table public.city_daily add column if not exists rounds int not null default 0;
