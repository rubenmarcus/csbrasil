# Plano: Port do jogo para Godot Web

## Princípios de execução

- Preservar o cliente legado até o gate explícito de corte.
- Entregar fatias verticais executáveis no navegador, não camadas isoladas.
- Capturar os números do cliente legado antes de reimplementar cada sistema.
- Usar GDScript tipado, Resources, composição de scenes e sinais.
- Manter o renderer Compatibility e medir sempre a exportação Web real.
- Marcar a tarefa corrente como `[~]` em `tasks.md` e concluí-la apenas com
  evidência fresca de teste.

## Sequenciamento

### 1. Baseline e toolchain Web

Status: concluído e verificado em 2026-07-17.

Documentar contratos numéricos do cliente legado, instalar/fixar Godot 4.7.1,
criar o projeto paralelo, configurar renderer/export e disponibilizar tasks do
VS Code. A primeira entrega é um shell Web que abre uma scene mínima em
Chrome/Edge e Firefox sem afetar o cliente atual.

### 2. Slice jogável de movimento

Status: concluído e verificado em 2026-07-17.

Gerar uma arena mínima com colisão e um jogador `CharacterBody3D`. Portar
pointer lock, câmera, caminhada, strafe, corrida, agachamento e salto. Validar
os contratos de movimento por testes headless e smoke test Web.

### 3. Slice de combate completo

Status: concluído e verificado em 2026-07-17.

Adicionar um bot, saúde, AWP, hitscan, oclusão, scope, munição, recarga, morte e
respawn. Separar dados de armas em Resources. Este slice estabelece os limites
entre ator, arma, dano, efeitos e UI.

O marco inclui também o inventário completo com AWP, pistola e faca, mantendo
estado independente, draw delay e controllers separados para hitscan e melee.

### 4. Partida 4×4

Status: concluído e verificado em 2026-07-18.

Expandir para os sete bots, portar grafo de waypoints/IA, round de 99 segundos,
pontuação, respawn e vitória por três rounds. O grafo atual será preservado no
primeiro port; `NavigationMesh` só poderá substituí-lo com evidência equivalente.

O marco entregue usa a composição `Match/Arena`, `Actors`, `Effects`,
`MatchController` e `RoundController`, com rosters 4×4, seleção de alvo, rotas
ao redor de bloqueios, killfeed, scoreboard e estado de partida exposto ao
smoke test Web.

### 5. Conteúdo procedural e apresentação

Status: concluído e verificado em 2026-07-18.

Portar arena completa, props, skyline, oito personagens, armas visuais,
texturas, animações e efeitos. Implementar seed determinística, factories e
caches compartilhados. Completar menus, seleção, HUD, radar e scoreboard.

A arena completa e os oito arquétipos foram entregues exclusivamente com
primitivas, imagens geradas em runtime e caches de materiais/meshes. A seed
2026 produz uma assinatura verificável; spawns, bloqueios e waypoints derivam
da geometria procedural, e screenshots Web são exercitados nos dois browsers.

Menus, seleção de time e personagem, preview 3D, settings persistentes, pause,
HUD, radar, banners e fim de partida completam o fluxo publicado. A navegação
por teclado e a persistência foram verificadas em Chromium e Firefox.

### 6. Áudio, persistência e integração Web

Status: áudio, rádio e fallbacks em andamento; persistência concluída no marco
anterior.

Portar pacotes de áudio e fallbacks, rádio, anúncios, settings e nick. Integrar
o shell HTML, SEO/AEO, analytics e eventos Web. Escolher fallback de áudio que
funcione sem depender de geração procedural incompatível com playback Web.

### 7. Paridade, desempenho e corte

Executar matriz completa de testes nos dois engines e navegadores suportados,
corrigir divergências, medir uma partida roteirizada de cinco minutos e produzir
o relatório de paridade. O deploy principal só será alterado após aprovação
explícita no gate de corte.

## Dependências

- Godot 4.7.1 Standard e export templates 4.7.1.
- Extensão oficial Godot Tools para VS Code.
- Node.js apenas como ferramenta de desenvolvimento para smoke tests
  Playwright, sem dependência no runtime do jogo.
- Servidor local HTTP para servir `build/web/`.
- Pacote de áudio opcional seguindo o manifest existente.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Regressão de sensação do movimento | Capturar constantes, criar testes e comparar gravações |
| Sobrecarga da geração procedural | Seeds, cache, compartilhamento e geração fora do frame crítico |
| Build Web maior ou mais lenta | Medir desde o primeiro slice e remover recursos não usados |
| Áudio procedural incompatível no Web | Usar samples/fallbacks pré-gerados e testar latência cedo |
| IA atravessar geometria | Preservar grafo atual e testar rotas/colisões |
| UI Godot divergir do CSS atual | Portar por fluxo e validar screenshots nos dois navegadores |
| Perda de SEO/AEO | Manter metadados no shell HTML fora do WebAssembly |
| Corte prematuro | Cliente legado permanece intacto até aprovação explícita |

## Gate de aprovação

Este plano não autoriza scaffolding, testes de feature ou código Godot. A
implementação começa somente depois que `spec.md`, este plano e `tasks.md`
forem apresentados e aprovados explicitamente pelo usuário.
