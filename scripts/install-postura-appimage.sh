#!/usr/bin/env bash
# Instala o AppImage em ~/Applications/postura-trabalho.AppImage e registra no menu.
# Se o app estiver aberto, sobrescrever o mesmo caminho com "cp" quebra (ETXTBSY); copiamos para .new e fazemos "mv".

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/release/Postura Trabalho-1.0.0.AppImage}"
DEST_DIR="${HOME}/Applications"
DEST="${DEST_DIR}/postura-trabalho.AppImage"
ICON_DIR="${HOME}/.local/share/icons"
APP_DIR="${HOME}/.local/share/applications"
DESKTOP="${APP_DIR}/postura-trabalho.desktop"
ICON_PNG="${ICON_DIR}/postura-trabalho.png"

mkdir -p "$DEST_DIR" "$ICON_DIR" "$APP_DIR"

# Ícone do menu: PNG gerado em build/icon-desktop.png (512²); fallback app-logo.
rm -f "${ICON_DIR}/postura-trabalho.svg"
if [[ -f "$ROOT/build/icon-desktop.png" ]]; then
  cp "$ROOT/build/icon-desktop.png" "$ICON_PNG"
elif [[ -f "$ROOT/public/app-logo.png" ]]; then
  cp "$ROOT/public/app-logo.png" "$ICON_PNG"
fi

if [[ -f "$ICON_PNG" ]]; then
  ICON_FOR_DESKTOP="$ICON_PNG"
else
  ICON_FOR_DESKTOP="preferences-desktop-accessibility"
fi

if [[ -f "$SRC" ]]; then
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
    echo "Instalado. Versão em uso foi renomeada para $STALE. Feche o app e apague esse arquivo depois." >&2
  fi
else
  echo "Aviso: AppImage não encontrado em $SRC; só ícone e atalho foram atualizados." >&2
  echo "Gere com: npm run postura:dist" >&2
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
Icon=${ICON_FOR_DESKTOP}
Terminal=false
Categories=Utility;Health;
StartupWMClass=Postura Trabalho
EOF

chmod 644 "$DESKTOP"
update-desktop-database "$APP_DIR" 2>/dev/null || true
echo "OK: $DEST. Busque por \"postura\" no menu."
