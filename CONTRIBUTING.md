# Contribuindo com o CS BRASIL: Treta Suprema

Valeu por querer contribuir! 🎮 Este é um projeto de fãs, open source, feito
para celebrar a **cultura brasileira** com humor — a zoeira é universal e
distribuída igualmente para todos os lados.

## Nossa posição (leia antes de contribuir)

- **O jogo NÃO tem lado político.** Petistas e Bolsonaristas são times com a
  mesma mecânica, mesmos personagens exagerados, mesma zoeira.
- **O jogo NÃO incita ódio** contra nenhuma pessoa ou grupo. É sátira leve,
  cartunesca e fictícia — sem gore, sem violência realista.
- **Sem pessoas reais.** Nada de políticos, celebridades ou pessoas privadas
  identificáveis (nome, rosto, voz imitada). Só arquétipos originais.
- Contribuições que violem esses princípios serão recusadas.

## Feito com Kimi K3

Este projeto foi criado com o auxílio do **Kimi K3** (Kimi Code CLI) — do
código ao design dos personagens. Contribuições humanas e/ou assistidas por IA
são bem-vindas, desde que revisadas e testadas por você.

## Rodando localmente

```bash
git clone https://github.com/rubenmarcus/csbrasil.git
cd csbrasil
bash scripts/fetch-audio.sh   # baixa o pacote de áudio (não versionado)
python3 -m http.server 8123   # ou: npx serve .
# abra http://localhost:8123
```

Sem o pacote de áudio o jogo funciona com sons sintetizados (fallback).

## Regras de contribuição

**Conteúdo**
- Nada de assets com copyright: sprites, sons ou modelos de jogos comerciais,
  logos, marcas, fotos — só material original ou livre com licença compatível.
- Novos personagens/times seguem o padrão: arquétipo fictício, nome fictício,
  humor sem crueldade, sem mirar grupos protegidos.
- Arquivos de áudio/imagens grandes **não vão pro git** — o diretório `audio/`
  é ignorado; novos sons entram no pacote via `audio/manifest.example.json`.

**Código**
- Vanilla JS com ES modules, **sem framework e sem build** — decisão de
  projeto (o jogo deve rodar arrastando a pasta pra qualquer host estático).
- Three.js é vendored em `vendor/` — não adicione CDNs nem `npm install` de
  runtime sem antes abrir uma issue e discutir.
- Mantenha o estilo do código ao redor (nomes, comentários em pt-BR, padrões).
- PRs pequenos e focados: uma feature ou um fix por PR.

**Processo**
1. Para features grandes, abra uma **issue** antes (veja `IDEAS.md`).
2. Fork + branch (`feat/minha-ideia`), PR com descrição clara e screenshots.
3. Teste antes de enviar: jogo abre, console sem erros, partida completa
   roda (round termina, placar abre com Tab).
4. Ao contribuir, você concorda em licenciar sua contribuição sob a **MIT**
   (ver `LICENSE`).

## Reportando bugs

Abra uma issue com: o que aconteceu, o que esperava, passos pra reproduzir,
navegador/SO e, se possível, print do console (F12).
