# Postura Trabalho

MVP desktop local para Linux, Windows e macOS com Electron, React e detecção de postura via MediaPipe Pose Landmarker.

## Download

Baixe a versão mais recente na página de [Releases](../../releases):

| Plataforma | Arquivo | Tipo |
|------------|---------|------|
| **Windows** | `Postura-Trabalho-Setup-x.x.x.exe` | Instalador (NSIS) |
| **Windows** | `Postura-Trabalho-x.x.x.exe` | Portable (sem instalação) |
| **macOS (Apple Silicon)** | `Postura-Trabalho-x.x.x-arm64.dmg` | Imagem de disco |
| **macOS (Intel)** | `Postura-Trabalho-x.x.x.dmg` | Imagem de disco |
| **macOS (zip)** | `Postura-Trabalho-x.x.x-mac.zip` | Para auto-update |
| **Linux** | `Postura-Trabalho-x.x.x.AppImage` | AppImage |
| **Linux** | `postura-trabalho_x.x.x_amd64.deb` | Debian/Ubuntu |

> **Nota Windows:** como o app não possui assinatura digital (code signing), o SmartScreen pode exibir um aviso. Clique em "Mais informações" → "Executar assim mesmo".
>
> **Nota macOS:** o app não é assinado nem notarizado pela Apple. Ao abrir pela primeira vez, o Gatekeeper bloqueia. Solução: clique com o botão direito no `.app` → "Abrir" → confirme "Abrir". Em macOS Sonoma/Sequoia, abra **Ajustes do Sistema → Privacidade e Segurança** e clique em "Abrir mesmo assim". Se persistir, no Terminal: `xattr -dr com.apple.quarantine "/Applications/Postura Trabalho.app"`.

## Scripts

- `npm run dev`: abre o app em desenvolvimento
- `npm test`: roda testes unitários
- `npm run lint`: roda ESLint
- `npm run build`: copia assets locais da MediaPipe, valida TypeScript e gera `out`
- `npm run postura:dist`: gera AppImage (Linux)
- `npm run postura:dist:deb`: gera AppImage e `.deb` (Linux)
- `npm run postura:install`: copia o AppImage para `~/Applications` e registra no menu
- `npm run postura:reinstall`: build + instalação local (atalho: `npm run reinstall`)
- `npm run dist:win`: gera NSIS e portable para Windows
- `npm run dist:mac`: gera DMG e zip para macOS (Intel + Apple Silicon)

## Releasing

Tags com prefixo `v` disparam o workflow de release automaticamente:

```bash
git tag v1.0.0
git push origin v1.0.0
```

O GitHub Actions builda para Linux, Windows e macOS (Intel + Apple Silicon) e publica os artefatos na Release.

## Build Notes

- O modelo `public/models/pose_landmarker_lite.task` roda localmente.
- Os arquivos WASM são copiados de `@mediapipe/tasks-vision` para `public/mediapipe/wasm`.
- Em Linux, o target `.deb` do `electron-builder` depende de `libcrypt.so.1` no host.
- Em Linux, builds Windows com NSIS/portable dependem de `wine`.
- Builds macOS (`dist:mac`) **só funcionam no próprio macOS**; o CI usa `macos-latest`. Não tente cross-compilar do Linux.
- O ícone `build/icon.png` (1024×1024) é convertido em `.icns` automaticamente no host macOS pelo electron-builder.
- O app verifica atualizações automaticamente ao iniciar (via `electron-updater`).
