#!/usr/bin/env bash
# Baixa o pacote de áudio (vozes meme + sons de arma) para audio/.
# O pacote NÃO fica no git por licenciamento — ver README, seção "Pacote de áudio".
set -e
cd "$(dirname "$0")/.."

# URL do zip do pacote. Configure pela env AUDIO_PACK_URL ou edite aqui
# (ex.: asset de GitHub Release, ou URL privada de R2/S3 para deploys).
URL="${AUDIO_PACK_URL:-https://github.com/rubenmarcus/csbrasil/releases/download/audio-pack-v1/audio-pack.zip}"

if [ -f audio/manifest.json ]; then
  echo "audio/ já configurado — nada a fazer."
  exit 0
fi
echo "Baixando pacote de áudio de: $URL"
curl -fsSL "$URL" -o /tmp/csbrasil-audio.zip
unzip -o -q /tmp/csbrasil-audio.zip -d audio/
[ -f audio/manifest.json ] || cp audio/manifest.example.json audio/manifest.json
echo "Pronto. Áudio instalado em audio/."
