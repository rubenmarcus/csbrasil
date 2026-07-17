# Changelog

## [1.6.0] — 2026-07-17
### Adicionado
- **Stats de abandono**: quem sai da partida no meio (botão sair ou fechar a
  aba) também entra no ranking — submit parcial ao sair + sendBeacon no unload
- **Mapa com histórico total** por cidade (partidas + rounds), não só 7 dias
- **Social link clicável** no perfil e no /ranking
- **Avatar automático do X/Twitter** via unavatar.io quando o social link é um
  handle do X (badge, perfil e ranking; fallback: inicial)
- city_daily agora soma rounds também (migration 005)

## [1.5.3] — 2026-07-17
### Corrigido
- Badge sem texto em produção: o binding nativo Linux do `resvg-js` ignorava
  fontes em buffer — render migrado pra `@resvg/resvg-wasm` (binário único
  embutido, determinístico em qualquer serverless)

## [1.5.2] — 2026-07-17
### Corrigido
- Links de perfil com `undefined` quando a view não tem `id` (fallback /u/nick)

## [1.5.1] — 2026-07-17
### Corrigido
- Falhas de envio pro ranking (função desatualizada, rate limit, token) eram
  engolidas em silêncio — agora aparecem na tela de fim de partida e no console

## [1.5.0] — 2026-07-17
### Mudado
- URL de perfil agora é canônica `/u/<id>/<nick>` (estável mesmo com troca de
  nick e pronta pra nicks duplicados no futuro); `/u/<nick>` redireciona (301)
- Badge aceita id ou nick (`/api/badge/<id>.png`)
- Leaderboard expõe `players.id` (migration 004)

## [1.4.3] — 2026-07-17
### Corrigido
- Tempo "0min" em partidas anteriores ao tracking: agora estima pelos rounds
  (`~Xh Ymin` = estimado, ~99s/round) na badge, perfil, /ranking e painel local

## [1.4.2] — 2026-07-17
### Corrigido
- Página `/mapa` quebrada: o Layout não tinha `<slot name="head"/>` — o CSS do
  Leaflet (e o JSON-LD da landing e as meta do perfil) eram descartados
- Tiles do mapa agora escuros (CARTO dark), combinando com o tema do site

## [1.4.1] — 2026-07-17
### Adicionado
- Avatar do usuário na badge compartilhável (círculo com anel na cor do time;
  fallback: inicial do nick) e no topo do perfil `/u/[nick]`

## [1.4.0] — 2026-07-17
### Adicionado
- **Tempo de jogo** por usuário (min/horas/dias): contado por partida no client
  e somado no ranking — aparece na badge compartilhável, no perfil `/u/[nick]`,
  na página `/ranking` e no painel local do jogo
- Badge agora tem 8 stats (entra TEMPO e ROUNDS)

## [1.3.1] — 2026-07-17
### Corrigido
- Badge de perfil renderizava texto como caixas (□□□): serverless da Vercel
  não tem fontes de sistema — render agora via `@resvg/resvg-js` com
  DejaVu Sans Bold embutida no bundle
- og:image do perfil era sobrescrita pela padrão do Layout (crawler pegava a
  imagem errada) — `ogImage` agora é prop do Layout e `/u/[nick]` usa a badge

## [1.3.0] — 2026-07-17
Fase 3: login social, avatar e mapa ao vivo.

### Adicionado
- Login com **Google, GitHub, LinkedIn e X** (Supabase Auth) — botões no menu
  principal; avatar do provedor entra no perfil automaticamente
- **Upload de foto de perfil** (tela RANKING): redimensiona pra 128×128 no
  client e sobe pro bucket `avatars` com policy por dono
- **Mapa da treta** (`/mapa`): jogadores online agora + partidas por cidade
  nos últimos 7 dias, via Leaflet/OpenStreetMap. Geo aproximado (cidade) dos
  headers da Vercel — IP nunca é armazenado
- Heartbeat de presença a cada 30s durante o jogo (`/api/heartbeat`)
- `city_daily`: histórico agregado de partidas por cidade
- `GET /api/config`: entrega URL + anon key (públicas) pro client ligar OAuth

## [1.2.0] — 2026-07-17
Ranking global (Fase 2) — código completo, ativa ao configurar o Supabase.

### Adicionado
- Stats novos por jogador: rounds jogados e partidas como Petista × Bolsonarista
- Página pública de perfil `/u/[nick]` com badge de stats compartilhável
  (PNG dinâmica em `/api/badge/[nick].png`, aparece no card ao postar o link)
- Página `/ranking` com o leaderboard global (top 100)
- Tela RANKING do jogo mostra o top 10 global sem sair do canvas, com links
  pro ranking completo e pro perfil
- Registro automático de nick no primeiro jogo (token UUID no navegador) e
  envio automático de stats ao fim de cada partida via `/api/*` (SSR, sem
  chave no client)

## [1.1.0] — 2026-07-17
O jogo agora é a rota principal (`/`), menu redesenhado e troca de time livre.

### Adicionado
- Troca de time a qualquer momento com **M** (respawn no outro lado + um bot
  deserta pro time oposto, mantendo o 4×4)
- Landing Astro com FAQ e SEO movida para `/sobre`

### Mudado
- Jogo movido de `/game/` para `/` — URL principal é o jogo
- Menu com botões menores em grid (nick e link social lado a lado)

## [1.0.2] — 2026-07-17
### Corrigido
- Pointer lock: sem ele, tiros/mouse/ESC eram ignorados em silêncio. Agora o
  jogo mostra "clique para ativar a mira" e qualquer clique re-tenta o lock.

## [1.0.1] — 2026-07-17
### Corrigido
- Arma travava inclinada ao trocar de arma no meio da recarga (reload dip
  resetado + decaimento de segurança).

## [1.0.0] — 2026-07-17
Primeira release pública.

### Incluído
- Jogo completo: FPS estilo CS 1.6 com AWP/pistola/faca, bots com IA, rounds,
  placar, radar, rádio de voz, multikills estilo UT e headshots
- 8 personagens satíricos originais (Petistas × Bolsonaristas), mapa
  awp_map brasileiro procedural, 100% vanilla JS + Three.js, zero build
- Site Astro (landing, personagens, como-jogar) + API routes SSR pro ranking
- Ranking local com nick + link social; schema Supabase pronto (Fase 2)
- SEO/AEO: JSON-LD, sitemap, robots, llms.txt, og-image
