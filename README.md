# CS BRASIL: Treta Suprema

FPS de navegador em Three.js: arena de sniper estilo CS 1.6 (`awp_map`) em uma Brasília
fictícia e satírica. Personagens 100% fictícios, sem gore — só arquétipos exagerados.

## Rodar localmente

Precisa de um servidor estático (módulos ES não abrem via `file://`):

```bash
cd game
python3 -m http.server 8123
# ou: npx serve .
```

Abra `http://localhost:8123` no Chrome/Edge/Firefox **de desktop**.

## Publicar (Vercel)

O `vercel.json` já está configurado: no build ele roda `scripts/fetch-audio.sh`,
que baixa o pacote de áudio da Release `audio-pack-v1` do GitHub.

1. Em vercel.com → **Add New → Project → Import** `rubenmarcus/csbrasil`.
2. Framework Preset: **Other** (não há framework; o `vercel.json` cuida do resto).
3. Deploy. A cada push na `main` a Vercel rebuilda e publica.
4. **Domínio** (quando comprar csbrasil.online): Settings → Domains → adicionar
   e apontar o DNS (CNAME para `cname.vercel-dns.com`). Depois ajuste a URL
   canônica em `index.html`, `robots.txt`, `sitemap.xml` e `llms.txt`.

Sem variáveis de ambiente obrigatórias (o `AUDIO_PACK_URL` tem default público;
se um dia o pacote ficar privado, cadastre a env no projeto).

## Publicar no kimi.page

O kimi.page é o domínio de publicação do recurso **Kimi Websites** (kimi.com/websites):

1. Abra **kimi.com/websites** (ou o modo Websites no app Kimi) e faça login.
2. Compacte esta pasta inteira (`index.html`, `style.css`, `js/`, `vendor/`, `audio/`)
   num `.zip` e anexe na conversa — ou cole o conteúdo dos arquivos.
3. Diga: *"Publique este site exatamente como está, sem modificar o código."*
4. Clique em **publicar/compartilhar** para gerar o link público `*.kimi.page`.

Alternativa: qualquer hospedagem estática (GitHub Pages, Netlify, Vercel…) — sem build.

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
vence quem levar 3 rounds. AWP mata com 1 tiro. Multikills disparam anúncios estilo
Unreal Tournament. Defina seu **nick** no menu principal (fica salvo).

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

### Pacote de áudio (open source)

A pasta `audio/` **não é versionada** (`.gitignore`) porque as vozes/menes têm
direitos incertos — o repositório público leva só o código (MIT). Para obter
o pacote:

```bash
# com a env AUDIO_PACK_URL apontando pro zip (GitHub Release, R2/S3…)
bash scripts/fetch-audio.sh
```

- **Contribuidores**: rodam o script (ou montam a própria pasta seguindo
  `audio/manifest.example.json`). Sem os arquivos, o jogo usa sons sintetizados.
- **Deploy (Cloudflare Pages/Vercel)**: build command
  `bash scripts/fetch-audio.sh && echo ok` com `AUDIO_PACK_URL` nas envs do projeto
  (para pacote privado, use R2/S3 com URL assinada).
- **Criar/atualizar o pacote**: `cd audio && zip -r ../audio-pack.zip . -x '.*'`

## SEO / AEO

O site já sai pronto para indexação (não usa biblioteca — AEO em site estático
é feito com dados estruturados, não com JS):

- `index.html`: title/description, canonical, Open Graph + Twitter card
  (`og-image.png` 1200×630), `theme-color`, `h1` oculto para crawlers.
- **JSON-LD**: `VideoGame` + `FAQPage` (é o que alimenta answer engines).
- `robots.txt` (libera tudo, bloqueia `/audio/` e `/vendor/`), `sitemap.xml`,
  `llms.txt` (resumo do jogo para crawlers de LLM).
- FAQ visível no menu principal (espelha a FAQPage do JSON-LD).
- Depois do deploy com domínio próprio: ajuste `https://csbrasil.online/`
  em `index.html`, `robots.txt`, `sitemap.xml` e `llms.txt` se o domínio for
  outro, e cadastre o site no Google Search Console + Bing Webmaster Tools.



- **Kill/death:** ao matar, toca fala aleatória do time do matador (throttle de 3,5s).
- **Rádio (Z/X/C + 1-3):** toca fala aleatória do seu time e mostra a linha no HUD.
- **Fim de round:** toca a faixa `round/` do time vencedor.
- **Multikill do jogador:** `doublekill` (2), `triplekill` (3), `multikill` (4),
  `megakill` (5), `godlike` (6+); 5 kills sem morrer = `killingspree`.
- **Adicionar faixas:** copie o arquivo para a pasta e registre o caminho em
  `audio/manifest.json` (mesmas chaves). Sem manifest, o jogo usa sons sintetizados.

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
audio/              falas e anúncios (conteúdo do usuário)
vendor/three.module.js   Three.js r160 (MIT) — vendored, sem CDN
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
