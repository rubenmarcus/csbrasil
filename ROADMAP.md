# CS BRASIL — Roadmap

> Jogo satírico brasileiro estilo CS 1.6, **web-first**, open source e **desenvolvido com ajuda de IA**.
> Produção: https://www.csbrasil.online

Este documento define a direção do projeto, a arquitetura de dois clientes (web + desktop) e as fases de trabalho. Serve tanto de plano quanto de guia pra contribuidores.

---

## Princípios (o que nunca muda)

1. **Fricção zero é o superpoder.** O jogo abre num link e está jogando em segundos (~1,5MB). Essa é a razão da tração até aqui e a mecânica que viraliza no WhatsApp/Telegram. Nenhuma decisão pode custar isso no cliente web.
2. **Web é o cliente canônico.** É onde a gameplay e o conteúdo são tunados. O desktop segue.
3. **Conteúdo é dado, não código.** Mapas, armas, personagens e balanceamento vivem como JSON neutro — assim escalam contribuições e mantêm os dois clientes consistentes.
4. **Sátira 100% ficcional.** Personagens estereotipados e marcas parodiadas (ex. "Havão"), sem pessoas/partidos/marcas reais, sem gore. É linha editorial e proteção contra takedown.
5. **Feito com IA, aberto a todos.** A barreira de contribuição é baixa de propósito.

---

## Alvo de qualidade

CS 1.3 (2001) como referência de "profissional o suficiente pra um indie" — **não** CS 2. Isso é totalmente alcançável no navegador: o Three.js r160 já supera essa era em capacidade. O gap atual é **craft** (materiais, animação, game feel, level design), não engine.

---

## Arquitetura de dois clientes

```
                 ┌─────────────────────────────┐
                 │   /shared  (fonte da verdade) │
                 │  mapas.json · armas.json      │
                 │  personagens.json · áudio      │
                 │  balance.json · baseline.json  │
                 └───────────────┬───────────────┘
            carrega em runtime   │   importa no build
         ┌───────────────────────┴───────────────────────┐
         ▼                                                 ▼
┌──────────────────┐                          ┌──────────────────────┐
│  web/ (Three.js)  │                          │  godot/ (desktop)     │
│  CANÔNICO         │                          │  SEGUIDOR             │
│  abre no link     │                          │  build Steam/desktop  │
└────────┬─────────┘                          └──────────┬───────────┘
         │              mesmo protocolo                    │
         └───────────────────┬────────────────────────────┘
                             ▼
              ┌─────────────────────────────┐
              │  Backend (Supabase + game    │
              │  server de multiplayer)      │
              └─────────────────────────────┘
```

**O que É compartilhado:** dados de conteúdo (JSON), assets (glTF/texturas/áudio), o backend e o protocolo de rede, e o **contrato de baseline** (constantes de gameplay validadas por teste em cada engine — detector de drift).

**O que NÃO é compartilhado:** código de render/input/loop. É inerentemente por-engine, e a estratégia é mantê-lo fino.

O William (woliveiras) já construiu o mecanismo certo no PR do Godot: `legacy_baseline.json` + teste de contrato e armas data-driven. Essa abordagem é o blueprint desta arquitetura.

### Como o Godot entra sem quebrar a produção

- O cliente Godot vive em `godot/` (ou package separado). O `public/` + Astro seguem canônicos e intocados.
- Merge com `git merge --no-ff` (**nunca squash**) preserva a autoria dos commits do William.
- `CODEOWNERS` dá a pasta `godot/` a ele; o convite é rebasear o branch dele **pra dentro de `godot/`** em vez de renomear a raiz.
- O `vercel.json` continua apontando pro build do Astro. O Godot é distribuído como build desktop, não deployado na Vercel.

---

## Fase 1 — Gráficos e jogabilidade (nível CS 1.3)

Objetivo: matar o "parece infantil" e o "trava no reload". Tudo no Three.js, sem bundler.

**Game feel (o que mais muda a percepção)**
- View model de arma com animação: idle sway, bob de caminhada, kick de recuo, e **reload animado com estados claros** (resolve o feedback do Elcio: munição acabando → click de vazio → animação → pronto).
- Fix do bug de reload que reabastece todas as armas de uma vez (`game.js:832-835`).
- Hitmarker + som de acerto, recoil pattern + spread por arma.
- Fix do loop de "token inválido" no login (provável no register/upload de badge).

**Gráficos (3-4 dias, ver RELATORIO-ANALISE.md §7)**
- `MeshStandardMaterial` em armas/personagens/metais + `scene.environment` via PMREM/RoomEnvironment.
- Anisotropy nas texturas (`textures.js:9`), `sun.shadow.normalBias` (`map.js:284`).
- Blob shadows sob personagens (ancoram no chão), AO assado nas texturas procedurais.
- Bloom opcional no preset "high" (muzzle flash/neon).

**Mapas jogáveis**
- Corrigir os mapas dos PRs abertos antes/durante o merge (spawns presos, waypoints quebrados, colliders quadrados) — detalhes por PR no RELATORIO-ANALISE.md §2-3.

---

## Fase 2 — Extensibilidade (mapas/personagens como dado, open source)

Objetivo: transformar "cada contribuição é um PR de código hand-coded arriscado" em "abre um JSON e cria conteúdo".

- **Formato de mapa em dados**: migrar de arrays JS hand-coded → JSON (geometria, colliders, occluders, spawns, pickups, waypoints). Loader único no web.
- **Mesmo formato consumível pelo Godot** → base concreta do compartilhamento entre clientes.
- **Waypoints validados/gerados por teste** (evita os grafos desconexos e arestas unidirecionais que quebraram os PRs #4 e #5).
- Armas e personagens como JSON (o modelo `weapon_definition` do William é a referência).
- `CONTRIBUTING.md` claro, template de PR, `CODEOWNERS`, e um gate de qualidade automático (ver Fase 3, testes).
- Ferramenta simples de autoria de mapa (mesmo que um editor web mínimo) pra baixar a barreira.

---

## Fase 3 — Infra, sustentabilidade e viralidade

**Escala (desfazendo o medo do Vercel)**
- Hoje o jogo é single-player contra bots: é estático servido por CDN. **Aguenta dezenas de milhares** de visitantes sem esforço. Pode cair na massa amanhã que o `/jogo` segura.
- Multiplayer real é problema de **servidor de jogo**, não de Vercel. Vercel serverless não roda loop de tick com estado. Começar com salas pequenas (1v1 / 5v5) via WebRTC (ex. geckos.io) num servidor autoritativo leve fora da Vercel (Fly.io/Railway/VPS), escalando **por sala** (horizontal).
- "Manda o link pro amigo" (1v1 por deep link) é a mecânica viral mais forte — priorizar antes de salas grandes.

**Anti-cheat honesto** (essencial no multiplayer; hoje o placar é forjável — RELATORIO-ANALISE.md §2)
- HMAC do payload com segredo por sessão + telemetria mínima validada no servidor.

**Viralização**
- Card de resultado pós-partida (imagem pronta pra WhatsApp/X com placar, personagem, mapa, link).
- Clipe de 10s do último kill via `MediaRecorder` do canvas (vídeo > screenshot no WhatsApp).
- Desafio por link (`?map=fy_masp&mode=knife`), ranking semanal com reset, conquistas absurdas compartilháveis.
- Motto "feito com IA": post técnico "como foi construído" como conteúdo viral na bolha dev, e como convite de contribuição.

---

## Fase 4 — Analytics e página /mapa

- **Fix do Vercel Analytics não registrar `/`**: a rota do jogo é client-rendered; provável que o `@vercel/analytics` não dispare page view lá. Verificar inclusão no layout e disparo manual na rota do jogo.
- **/mapa com tabela**: filtros por lugar/país + ranking (Astro + query no Supabase). Aproveita a presença/geo que já existe.

---

## Sequência recomendada

1. **Já**: rodar `supabase/schema.sql` em produção (migrations 008-010 podem estar quebrando o submit/ranking — RELATORIO-ANALISE.md §3, risco nº1) e corrigir o loop de login.
2. **Fase 1** primeiro e por inteiro — é o que muda a primeira impressão, que é o que viraliza, e o que sustenta o motto "feito com IA".
3. **Fase 2** — destrava contribuições open source e a consistência com o Godot.
4. **Fase 4** (analytics + /mapa) pode entrar em paralelo, é barata.
5. **Fase 3** (multiplayer + infra) por último e faseada: 1v1 por link → salas → escala.

O cliente Godot desktop entra como trilha paralela do William assim que o formato de dado da Fase 2 existir — antes disso, não há o que consumir de forma consistente.

---

*Análise detalhada que embasa este roadmap: `RELATORIO-ANALISE.md`.*
