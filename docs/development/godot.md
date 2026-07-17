# Desenvolvimento do cliente Godot

O port Godot é desenvolvido em `godot/` sem substituir o cliente Three.js. A
versão fixada é Godot 4.7.1 Standard, com export templates 4.7.1, renderer
Compatibility, GDScript e GUT 9.7.1.

## Pré-requisitos

- Godot 4.7.1 Standard e export templates 4.7.1.
- VS Code com a extensão recomendada `geequlim.godot-tools`.
- Node.js 24 e `npm install` para os smoke tests Playwright.
- Chromium e Firefox do Playwright: `npx playwright install chromium firefox`.

O launcher `scripts/godot.sh` procura o binário nesta ordem:

1. variável `GODOT_BIN`;
2. comando `godot` disponível no `PATH`;
3. `/Applications/Godot.app/Contents/MacOS/Godot` no macOS.

## VS Code

Execute `Tasks: Run Task` e escolha:

- `Godot: Editor`: abre o editor no projeto `godot/` e disponibiliza LSP/DAP;
- `Godot: Run`: executa a main scene nativa;
- `Godot: Test`: executa toda a suíte GUT em modo headless;
- `Godot: Export Web`: gera `build/web/index.html`;
- `Godot: Serve Web`: serve a exportação em `http://127.0.0.1:8177`.

O editor Godot precisa permanecer aberto para completion e debugging no VS
Code. O LSP usa a porta padrão 6005 e o DAP usa 6006; a configuração de debug
do VS Code conecta ao DAP pelo arquivo `.vscode/launch.json`.

## Slice jogável atual

O cliente Godot inicia em uma arena procedural mínima. Clique na área do jogo
para iniciar a sessão de input e use:

- `W`, `A`, `S`, `D`: caminhar e strafe;
- `Shift`: correr;
- `Ctrl`: agachar;
- `Espaço`: saltar;
- mouse: controlar a câmera;
- clique esquerdo: disparar a AWP depois de capturar o mouse;
- clique direito: ativar/desativar a mira telescópica;
- `R`: recarregar;
- `1`, `2`, `3`: alternar entre AWP, pistola e faca;
- `Esc`: liberar o mouse com segurança.

O movimento é dividido entre `MovementConfig` (contratos numéricos),
`MovementMotor` (regras puras) e a scene `Player`, baseada em
`CharacterBody3D`. A scene `MinimalArena` cria piso, limites, obstáculo e
degrau em runtime, sem assets gráficos importados.

O slice de combate adiciona um bot procedural, componentes de saúde, AWP
configurada por `WeaponDefinition`, estado independente de munição/recarga e
hitscan com oclusão e hitbox de cabeça. Jogador e bot morrem e reaparecem após
2,5 segundos.

O inventário mantém instâncias e munição independentes para AWP e pistola,
aplica 0,35 s de draw delay e usa uma scene dedicada de ataque corpo a corpo
para a faca. Armas sem suporte a scope rejeitam essa ação.

## Linha de comando

```bash
scripts/godot.sh --version
scripts/godot.sh --headless --path godot -s addons/gut/gut_cmdln.gd -gdir=res://tests -ginclude_subdirs -gexit -gdisable_colors
scripts/export-godot-web.sh
npm run test:web:smoke
npm run test:web:movement
npm run test:web:combat
```

Os smoke tests sobem o cliente Godot em `8177` e o cliente legado em `8176`,
validando ambos em Chromium e Firefox. A porta histórica `8123` não é ocupada
por essa automação.

## Saídas locais

- `godot/.godot/`: cache/imports locais da engine, ignorados pelo Git.
- `build/web/`: exportação Web, ignorada pelo Git.
- `test-results/`: evidências de falha do Playwright, ignoradas pelo Git.
