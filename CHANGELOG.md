# Changelog

## [1.12.3] — 2026-07-18
### Corrigido
- **Modo de armas também filtra o mapa**: em SÓ PISTOLAS/FACA/AWP os pickups
  incompatíveis somem do chão (não só da mão do jogador)
- Home: RANKING/COMO JOGAR/CONFIG viraram botões laterais menores; dropdown
  de armas agora é custom com **ícones SVG das armas** (mesmo CSS do dropdown
  de mapa)

## [1.12.2] — 2026-07-18
### Mudado
- **Nick obrigatório** pra jogar: sem nome, o JOGAR não deixa passar (campo
  treme, fica vermelho e pede "DIGITE UM NICK PRIMEIRO!")

## [1.12.1] — 2026-07-18
### Adicionado
- **Modo de armas** (dropdown ao lado do mapa): TODAS / SÓ PISTOLAS (pistola +
  deagle nos pickups) / SÓ FACA (sem armas nem pickups) / SÓ AWP (sem pistola,
  pickups só de AWP) — afeta loadout inicial e quais pickups o jogador pode
  pegar com E (bots seguem no padrão AWP)

## [1.12.0] — 2026-07-18
### Adicionado
- **Arsenal completo**: AK-47, M4A1, MP5, Escopeta M3 e Deagle jogáveis
  (auto-fire com bloom, 8 pellets na M3, viewmodels próprios, sons reais da
  pasta `audio/weapons/`) além da AWP, pistola e faca
- **Captura com E** + hint `[E] PEGAR <ARMA>` (bots continuam pegando andando)
- **M mostra a seleção de personagem** do novo time antes de trocar de lado
- **Dropdown de mapas** na home (depois dos campos, antes do JOGAR)
- Mais obstáculos no Piscinão (pilares, bancos, boxes de chuveiro, lixeiras)
  e no Sítio (fardos de feno, trator, poço, bebedouro, cercas extras)

## [1.11.0] — 2026-07-18
### Adicionado
- **Mapa fy_pool_day "Piscinão da Treta"** (cherry-pick do PR #3 de
  [@daltonfontes](https://github.com/daltonfontes) 🎉) + registro de mapas
  (`js/maps.js`) e seletor MAPA no menu — estilo "full weapons" com 22
  pickups de arma no chão
- **Weapon drop**: morto larga a arma no chão (CS clássico); passar por cima
  pega + munição cheia — drops somem ao ser pegos, pickups do mapa respawnam
- **Dificuldade 1.5x**: precisão ×1.5 (c/ bônus de posição parada), reação e
  cadência dos bots 1.5× mais rápidas, dano 42→63; jogador com troca de arma
  e scope mais responsivos
- **Bots mais espertos**: caçam quem atirou neles mesmo sem ver o atacante
- **+2 personagens**: Jovem Místico (P — faixa, cristal, aura calibrada) e
  Coach Quântico (B — blazer, headset, "DESPROGRAME-SE"); roster 5×5, 4×4
  mantido em campo

## [1.10.0] — 2026-07-18
### Adicionado
- **Anti-trainer (servidor)**: consistência física no RPC — kills ≤ 45/round
  e ≥ 80s/round (impossível pra trainer de speed/autoshot), rate limit por IP
  via `submit_log` (60s + 200/dia), flags automáticas (3 = sai do ranking)
  — migration 009
- **Paginação no /ranking** (25/página) e view com limite de 500 jogadores
- **Ícones de marca reais** (simple-icons CC0) nos chips sociais
- URLs sociais auto-normalizadas (conserta links quebrados de dados antigos)
- `SECURITY.md`: modelo de segurança honesto + SQL de moderação

## [1.9.0] — 2026-07-18
### Adicionado
- **Tema terminal Y2K/Half-Life** no site: âmbar em fundo escuro, monospace,
  cantos retos, scanlines, tabelas e cards terminal (Layout + páginas)
- **Multi-redes sociais** (até 3) no card de perfil do menu, com extração
  automática de handle ao colar URL e validação — `players.socials` (jsonb,
  migration 008)
- **Chips de rede** (ícones X/GH/IG/in/TT/YT) no ranking e perfil em vez da URL crua
- **Personagem como fallback de ícone** no ranking e no perfil (charSvg
  compartilhado via `src/lib/charsvg.ts`)
- **Botões no HUD durante o jogo**: ⚙ configurações e 🔊/🔇 liga-desliga falas
  (só memes — vitória/UT/arma continuam), também nas configurações

## [1.8.1] — 2026-07-18
### Mudado
- Botões de login social removidos do menu (OAuth fica pra era multiplayer)
- Upload de foto agora fica **na tela principal**, visível quando a rede não é
  X/GitHub (esses puxam avatar sozinhos)
- Logo menor e mais pra cima no menu

## [1.8.0] — 2026-07-18
### Adicionado
- **Seletor de rede social** no menu (X, GitHub, Instagram, LinkedIn, TikTok,
  YouTube, site próprio) + handle — sem precisar de login; campo de usuário
  fica desabilitado até escolher a rede
- **Avatar do GitHub automático** (oficial, `github.com/handle.png`) além do X
- **Upload de foto sem login** (`POST /api/avatar`, validado por nick+token,
  resize 128×128 no servidor) — cobre Instagram/LinkedIn/TikTok, que não têm
  fetch público de avatar

### Mudado
- OAuth social passa a ser opcional/dormant (volta na era multiplayer)

## [1.7.6] — 2026-07-18
### Adicionado
- Mapa: nome da cidade sempre visível (tooltip amarelo permanente) e popup com
  **lista de jogadores + total por cidade** (via presence, cidades com 0
  partidas mas com jogadores também aparecem)

## [1.7.5] — 2026-07-18
### Corrigido
- Proporções do card de badge: cabeçalho compacto, grade 3×3 com margem real,
  skyline removida (colidia com a última linha de stats)

## [1.7.4] — 2026-07-18
### Adicionado
- **Mortes (deaths)** no ranking, perfil, painel local e badge (agora em grade
  3×3 com MORTES entre KILLS e HEADSHOTS)

## [1.7.3] — 2026-07-18
### Mudado
- Vitórias zeradas aparecem como "—" (não parece mais bug) no ranking, perfil,
  badge e painel local

## [1.7.2] — 2026-07-18
### Corrigido
- Submits rejeitados pelo rate limit de 90s (abandono + partida em seguida)
  agora entram numa fila local e são reenviados automaticamente — nenhuma
  partida se perde mais por janela de rate limit

## [1.7.1] — 2026-07-18
### Adicionado
- Placar geral no `/mapa`: total de jogadores, partidas e kills + barra de
  proporção % petistas × % bolsonaristas

## [1.7.0] — 2026-07-18
### Adicionado
- **Personagem como avatar**: sem foto/X, a badge usa o personagem escolhido no
  jogo (SVG por id) e mostra "joga de &lt;personagem&gt;" — `last_character`
  gravado por partida (rode o schema.sql pra criar a coluna)
- **NEUTRO**: empate de lados (1P × 1B) vira terceiro estado no card
- **Site imersivo**: páginas do Astro agora têm o fundo 3D do jogo (o mundo
  real orbitando, mesmo código do menu) com overlay escuro
- **Botões de canto** no menu do jogo: RANKING ↗ MAPA ↗ SOBRE ↗

### Mudado
- Redesign do card de badge: stat-cards arredondados, glow na cor do lado,
  skyline de Brasília no rodapé

## [1.6.3] — 2026-07-18
### Mudado
- "Abates" vira "kills" em toda a UI (placar, ranking, perfil, badge, docs)

## [1.6.2] — 2026-07-18
### Corrigido
- Heartbeat/submit usam o nick **registrado** na sessão (editar o nick no menu
  não quebra mais o token) e param de tentar após 403

## [1.6.1] — 2026-07-17
### Corrigido
- `submit-match` auto-recuperável: se a função do banco está desatualizada
  (sem p_seconds/p_rounds/p_team), grava o núcleo dos stats mesmo assim e
  responde com aviso pra rodar o schema.sql atual

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
