#!/usr/bin/env bash
# Instala o AppImage em ~/Applications/postura-trabalho.AppImage e registra no menu.
# Se o app estiver aberto, sobrescrever o mesmo caminho com "cp" quebra (ETXTBSY) — copiamos para .new e fazemos "mv".

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/release/Postura Trabalho-1.0.0.AppImage}"
DEST_DIR="${HOME}/Applications"
DEST="${DEST_DIR}/postura-trabalho.AppImage"
ICON_DIR="${HOME}/.local/share/icons"
APP_DIR="${HOME}/.local/share/applications"
ICON="${ICON_DIR}/postura-trabalho.png"
DESKTOP="${APP_DIR}/postura-trabalho.desktop"

if [[ ! -f "$SRC" ]]; then
  echo "Arquivo não encontrado: $SRC" >&2
  echo "Gere antes: npm run build && npx electron-builder --linux AppImage" >&2
  exit 1
fi

mkdir -p "$DEST_DIR" "$ICON_DIR" "$APP_DIR"

if [[ -f "$ROOT/public/app-logo.png" ]]; then
  cp "$ROOT/public/app-logo.png" "$ICON"
fi

TMP="${DEST}.new.$$"
cp "$SRC" "$TMP"
chmod +x "$TMP"

# Substituir destino: se o AppImage estiver em execução, "mv novo → destino" pode falhar (ETXTBSY).
if [[ ! -e "$DEST" ]]; then
  mv "$TMP" "$DEST"
elif mv "$TMP" "$DEST" 2>/dev/null; then
  :
else
  STALE="${DEST}.was-running.$$"
  mv "$DEST" "$STALE"
  mv "$TMP" "$DEST"
  echo "Instalado. Versão em uso foi renomeada para $STALE — feche o app e apague esse arquivo depois." >&2
fi

cat > "$DESKTOP" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Postura Trabalho
GenericName=Postura
Comment=Monitore sua postura ao trabalhar
Keywords=postura;postura trabalho;ergonomia;webcam;saude;trabalho;
Exec=${DEST} --no-sandbox
Icon=${ICON}
Terminal=false
Categories=Utility;Health;
StartupWMClass=Postura Trabalho
EOF

chmod 644 "$DESKTOP"
update-desktop-database "$APP_DIR" 2>/dev/null || true
echo "OK: $DEST — busque por \"postura\" no menu."
