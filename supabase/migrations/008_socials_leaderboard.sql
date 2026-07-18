-- Migration 008: multi-redes + personagem no leaderboard
alter table public.players add column if not exists socials jsonb not null default '[]'::jsonb;

drop view if exists public.leaderboard;
create view public.leaderboard as
select p.id, s.nick, p.social_link, p.socials, p.avatar_url, s.matches, s.wins, s.rounds,
       s.matches_p, s.matches_b, s.kills, s.deaths,
       s.headshots, s.best_streak, s.play_seconds, s.last_character,
       round(s.kills::numeric / greatest(s.deaths, 1), 2) as kd
from stats s join players p on p.nick = s.nick
where not p.hidden
order by s.kills desc, s.wins desc
limit 100;
