# CS BRASIL: Treta Suprema

[![built with Kimi K3](https://img.shields.io/badge/built%20with-Kimi%20K3-6b5bff?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiNmZmYiLz48L3N2Zz4=)](https://www.kimi.com/)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://vercel.com)

![CS BRASIL: Treta Suprema — arena de sniper estilo CS 1.6 numa Brasília fictícia](og-image.png)

FPS de navegador em Three.js: arena de sniper estilo CS 1.6 (`awp_map`) em uma Brasília
fictícia e satírica. Personagens 100% fictícios, sem gore — só arquétipos exagerados.

> 📝 Este jogo foi gerado do zero por IA (Kimi K3) a partir de um único prompt —
> [leia o prompt original em PROMPT.md](PROMPT.md).

## Rodar localmente

Precisa de um servidor estático (módulos ES não abrem via `file://`):

```bash
git clone https://github.com/rubenmarcus/csbrasil.git
cd csbrasil
bash scripts/fetch-audio.sh   # pacote de áudio (opcional — sem ele roda com sons sintetizados)
python3 -m http.server 8123   # ou: npx serve .
```

Abra `http://localhost:8123` no Chrome/Edge/Firefox **de desktop**.

## Port Godot em desenvolvimento

O novo cliente Godot 4.7.1 é desenvolvido em paralelo em `godot/`; ele ainda
não substitui a versão Three.js publicada. Consulte o
[guia de desenvolvimento Godot](docs/development/godot.md) para configurar o
VS Code, executar testes e gerar a exportação Web.
Quem estiver preparando o ambiente pela primeira vez pode seguir o
[runbook para testar o cliente Godot](docs/runbooks/testar-cliente-godot.md).

A exportação paralela já inclui shell SEO/AEO, analytics, áudio opcional e uma
configuração Vercel própria. O preview pode ser preparado localmente com
`scripts/build-vercel.sh`; `vercel.json` continua servindo o cliente legado até
o gate explícito de corte. Quando autorizado, a configuração de preview pode
ser usada pela CLI com `--local-config vercel.godot-preview.json`.
Os resultados da matriz funcional e das partidas de cinco minutos estão no
[relatório de paridade Godot Web](docs/reports/2026-07-18-godot-web-parity.md).

## Controles

| Tecla | Ação |
| --- | --- |
| W A S D | Mover |
| Mouse | Mirar |
| Shift | Correr |
| **Ctrl** | **Agachar — mira mais estável** |
| Espaço | Pular |
| Clique esq. | Atirar |
| Clique dir. | Luneta da AWP |
| R | Recarregar |
| 1 / 2 / 3 | AWP / Pistola / Faca |
| **Z / X / C** | **Rádio estilo CS (comandos de voz)** |
| Tab | Placar |
| Esc | Pausar |

**Regras:** 4×4 com respawn (2,5s). Round de 1:39; o time com mais abates leva o round;
vence quem levar 3 rounds. AWP mata com 1 tiro; headshot tem som próprio. Multikills
disparam anúncios estilo Unreal Tournament. Defina seu **nick** no menu principal
(fica salvo).

## Áudios (pasta `audio/`)

O jogo carrega `audio/manifest.json`:

```
audio/
  manifest.json        # mapa de faixas (edite ao adicionar arquivos)
  petista/ingame/      # falas do time P (rádio + celebração de kill)
  petista/round/       # toca quando o time P vence o round
  bolsonaro/ingame/    # falas do time B
  bolsonaro/round/     # toca quando o time B vence o round
  game/                # anúncios UT + sons de arma (awp, usp, faca, clipes)
  cs/                  # OPCIONAL: drop-in de sons próprios (ver LEIA-ME.txt)
  manifest.example.json  # manifest de referência (versionado no git)
```

- **Kill/death:** ao matar, toca fala aleatória do time do matador (throttle de 3,5s).
- **Rádio (Z/X/C + 1-3):** toca fala aleatória do seu time e mostra a linha no HUD.
- **Fim de round:** toca a faixa `round/` do time vencedor.
- **Multikill do jogador:** `doublekill` (2), `triplekill` (3), `multikill` (4),
  `megakill` (5), `godlike` (6+); 5 kills sem morrer = `killingspree`;
  headshot = `headshot`.
- **Adicionar faixas:** copie o arquivo para a pasta e registre o caminho em
  `audio/manifest.json` (mesmas chaves). Sem manifest, o jogo usa sons sintetizados.

### Pacote de áudio (open source)

A pasta `audio/` **não é versionada** (`.gitignore`) porque as vozes/memes têm
direitos incertos — o repositório público leva só o código (MIT). Para obter
o pacote:

```bash
# com a env AUDIO_PACK_URL apontando pro zip (default: Release audio-pack-v1 deste repo)
bash scripts/fetch-audio.sh
```

- **Contribuidores**: rodam o script (ou montam a própria pasta seguindo
  `audio/manifest.example.json`). Sem os arquivos, o jogo usa sons sintetizados.
- **Criar/atualizar o pacote**: `cd audio && zip -r ../audio-pack.zip . -x '*.DS_Store'`

### Sobre sons "reais" do CS 1.6

Um som de AWP estilo CS 1.6 já está configurado (`audio/game/awp-cs-1-6.mp3`,
registrado na chave `"cs"."awp"` do manifest — usado por jogador e bots).
Os samples originais do CS 1.6 são **propriedade da Valve** e não são distribuídos com
este jogo. Se você possui o jogo legalmente, pode usar seus próprios arquivos: copie de
`cstrike/sound/` para `audio/cs/` e registre no manifest, chave `"cs"`:

```json
"cs": {
  "awp": ["audio/cs/awp1.wav"],
  "pistol": ["audio/cs/usp1.wav"],
  "reload": ["audio/cs/awp_zoom.wav"],
  "roundstart": ["audio/cs/item_pickup.wav"],
  "footsteps": ["audio/cs/pl_step1.wav", "audio/cs/pl_step2.wav"]
}
```

## SEO / AEO

O site já sai pronto para indexação (não usa biblioteca — AEO em site estático
é feito com dados estruturados, não com JS):

- `index.html` (legado) e `godot/web/shell.html` (Godot): title/description,
  canonical, Open Graph + Twitter card
  (`og-image.png` 1200×630), `theme-color`, `h1` oculto para crawlers.
- **JSON-LD**: `VideoGame` + `FAQPage` (é o que alimenta answer engines).
- `robots.txt` (libera tudo, bloqueia `/audio/` e `/vendor/`), `sitemap.xml`,
  `llms.txt` (resumo do jogo para crawlers de LLM).
- Se o domínio final for outro: ajuste `https://csbrasil.online/` em
  `index.html`, `robots.txt`, `sitemap.xml` e `llms.txt`, e cadastre o site
  no Google Search Console + Bing Webmaster Tools.

## Estrutura

```
index.html          telas (menu, times, personagens 3D, HUD, pausa, fim de jogo)
style.css           identidade visual retro CS 1.6
js/main.js          boot, telas, logo (canvas), settings, nick, preview 3D, loop
js/game.js          FPS controller, armas, bots, rounds, radar, rádio, multikill
js/map.js           arena, props brasileiros, colisores, waypoints, skyline
js/characters.js    8 arquétipos: meshes low-poly procedurais
js/textures.js      texturas procedurais em canvas (concreto, pichações, pôsteres…)
js/audio.js         SFX sintetizados + player de samples (manifest)
audio/              falas e anúncios (não versionado — ver Pacote de áudio)
vendor/three.module.js   Three.js r160 (MIT) — vendored, sem CDN
scripts/fetch-audio.sh   baixa o pacote de áudio
vercel.json         build estático + cache
```

## Trocar placeholders por assets reais

- **Modelos:** personagens são montados em `js/characters.js` (`buildCharacter`).
  Para GLTF, carregue o modelo em `mkBot` (`js/game.js`) no lugar de
  `buildCharacter(def)` e adapte `poseCharacter` (ou use seu AnimationMixer).
- **Texturas:** tudo sai de `initTextures()` em `js/textures.js` — troque qualquer
  chave por `new THREE.TextureLoader().load(url)` mantendo o nome.
- **Sons:** veja a seção Áudios acima.
- **Mapa:** colisores são AABBs declarados junto de cada mesh em `js/map.js`.

## Licenças / créditos

- Three.js r160 — licença MIT (© Three.js authors), arquivo em `vendor/`.
- Código, texturas, personagens e logo: originais, gerados proceduralmente.
- Áudios em `audio/`: conteúdo fornecido pelo usuário (memes); verifique direitos
  antes de publicar comercialmente. Sons de CS 1.6 **não inclusos** (Valve).

*Sátira política fictícia. Feito para rir, não para brigar.*
