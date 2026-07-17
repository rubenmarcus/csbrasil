#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
OUTPUT_DIR="$REPO_ROOT/build/web"

mkdir -p "$OUTPUT_DIR"
exec "$SCRIPT_DIR/godot.sh" \
  --headless \
  --path "$REPO_ROOT/godot" \
  --export-release Web "$OUTPUT_DIR/index.html"

