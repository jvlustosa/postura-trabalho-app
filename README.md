# Postura Trabalho

MVP desktop local para Linux e Windows com Electron, React e detecção de postura via MediaPipe Pose Landmarker.

## Scripts

- `npm run dev`: abre o app em desenvolvimento.
- `npm test`: roda testes unitários.
- `npm run lint`: roda ESLint.
- `npm run build`: copia assets locais da MediaPipe, valida TypeScript e gera `out`.
- `npm run dist:linux`: gera AppImage e `.deb`.
- `npm run dist:win`: gera NSIS e portable para Windows.

## Build Notes

- O modelo `public/models/pose_landmarker_lite.task` roda localmente.
- Os arquivos WASM são copiados de `@mediapipe/tasks-vision` para `public/mediapipe/wasm`.
- Em Linux, o target `.deb` do `electron-builder` depende de `libcrypt.so.1` no host.
- Em Linux, builds Windows com NSIS/portable dependem de `wine`.
