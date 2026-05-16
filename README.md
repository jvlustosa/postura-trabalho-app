# Postura Trabalho

MVP desktop local para Linux e Windows com Electron, React e detecção de postura via MediaPipe Pose Landmarker.

## Download

Baixe a versão mais recente na página de [Releases](../../releases):

| Plataforma | Arquivo | Tipo |
|------------|---------|------|
| **Windows** | `Postura-Trabalho-Setup-x.x.x.exe` | Instalador (NSIS) |
| **Windows** | `Postura-Trabalho-x.x.x.exe` | Portable (sem instalação) |
| **Linux** | `Postura-Trabalho-x.x.x.AppImage` | AppImage |
| **Linux** | `postura-trabalho_x.x.x_amd64.deb` | Debian/Ubuntu |

> **Nota Windows:** como o app não possui assinatura digital (code signing), o SmartScreen pode exibir um aviso. Clique em "Mais informações" → "Executar assim mesmo".

## Scripts

- `npm run dev` — abre o app em desenvolvimento
- `npm test` — roda testes unitários
- `npm run lint` — roda ESLint
- `npm run build` — copia assets locais da MediaPipe, valida TypeScript e gera `out`
- `npm run dist:linux` — gera AppImage e `.deb`
- `npm run dist:win` — gera NSIS e portable para Windows

## Releasing

Tags com prefixo `v` disparam o workflow de release automaticamente:

```bash
git tag v1.0.0
git push origin v1.0.0
```

O GitHub Actions builda para Linux e Windows e publica os artefatos na Release.

## Build Notes

- O modelo `public/models/pose_landmarker_lite.task` roda localmente.
- Os arquivos WASM são copiados de `@mediapipe/tasks-vision` para `public/mediapipe/wasm`.
- Em Linux, o target `.deb` do `electron-builder` depende de `libcrypt.so.1` no host.
- Em Linux, builds Windows com NSIS/portable dependem de `wine`.
- O app verifica atualizações automaticamente ao iniciar (via `electron-updater`).
