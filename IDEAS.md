# IDEAS.md — Roadmap comunitário

Ideias válidas pra onde o CS BRASIL pode ir. Quer pegar alguma? Abra uma
issue com a tag da ideia antes de codar (ver `CONTRIBUTING.md`).
Níveis: 🟢 fácil · 🟡 médio · 🔴 grande.

## Gameplay

- 🟢 **Modo CS clássico** — sem respawn dentro do round (eliminação), com
  timer e vitória por eliminação ou tempo.
- 🟢 **Customizar partida** — tempo de round, nº de bots (1×1 até 5×5),
  friendly fire on/off, só faca, só AWP.
- 🟢 **Novos personagens fictícios** — novos arquétipos nos dois times
  (seguindo as regras de conteúdo do CONTRIBUTING).
- 🟡 **Novas armas** — escopeta (spread em cone), rifle automático, granada
  de confete (efeito visual, sem gore).
- 🟡 **Bots mais espertos** — usar cobertura, recuar com HP baixo, rush
  coordenado em grupo.
- 🟡 **Killcam / replay** — ver a kill do ângulo do matador por 3s.
- 🟡 **Conquistas locais** — primeiro headshot, 10 kills de faca, etc.
  (localStorage).

## Mapas

- 🟢 **Variações do mapa atual** — o `js/map.js` é declarativo; dá pra gerar
  "noite", "chuva", "carnaval" mudando luz/props.
- 🟡 **Novos mapas temáticos** — estádio de futebol, praia com calçadão,
  festa junina, terminal de ônibus. Mesmo esquema simétrico de arena.
- 🟡 **Editor de mapa** — exportar/importar layout em JSON.

## Gráficos & tecnologia

- 🟡 **Modelos de maior qualidade via Blender + MCP** — gerar personagens e
  props em GLB com o Blender MCP (pipeline assistida por IA) e carregar no
  lugar dos bonecos de caixas, mantendo a mesma API (`buildCharacter`).
- 🟡 **PWA offline** — service worker cacheando o jogo inteiro.
- 🟡 **Site Astro ao redor do jogo** — páginas indexáveis (/personagens,
  /como-jogar, /patch-notes) com o jogo embutido em `/jogar` (SEO real).
- 🔴 **Port Unity/Godot** — cliente separado pra builds mobile/desktop,
  compartilhando assets e conceitos (o web continua sendo o principal).
- 🔴 **Mobile** — controles touch (joysticks virtuais, aim assist).
  Depende de decisão de engine (ver port acima).

## Online & backend (repo privado futuro)

- 🟡 **Ranking online** — leaderboard global e por semana (Supabase: auth +
  Postgres). Validação anti-cheat no servidor.
- 🟡 **Perfis de jogador** — nick único, stats, personagem favorito.
- 🔴 **Multiplayer real** — salas 4×4 via WebSocket/WebRTC com servidor
  autoritativo.
- 🔴 **Clans e torneios** — tabela de confrontos, temporadas.

## Áudio & conteúdo

- 🟢 **Novos packs de voz** — mais falas fictícias por time (sempre originais
  ou licenciadas, ver regras de conteúdo).
- 🟢 **Novos grafites/pôsteres** — slogans fictícios em `js/textures.js`.
- 🟡 **Trilha sonora procedural** — música de menu gerada em WebAudio
  (funkão 8-bit?).

## Governança

- 🟢 **Traduções** — EN/ES do UI (o jogo é pt-BR first).
- 🟢 **Acessibilidade** — modo daltônico, remapear teclas, escala de HUD.
- 🟡 **CI** — GitHub Actions: syntax check + smoke test headless a cada PR.
