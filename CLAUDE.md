<!-- chatjuridico-devkit:central -->
> **Central standards:** `/home/fontenele/Code/ChatJurídicoCodeBase/chatjuridico-devkit/CLAUDE.md` (also `~/.claude/CLAUDE.md`).
> Load the central file first; this file adds **PosturaCerta**-specific context.

---

# PosturaCerta

## Tech Stack

- **Runtime:** Electron 42 + electron-vite
- **UI:** React 19, TypeScript (strict), CSS custom properties
- **Pose detection:** MediaPipe Pose Landmarker (local WASM + `.task` model)
- **Build:** electron-builder (AppImage/deb, NSIS/portable, DMG/zip)
- **Tests:** Vitest + Testing Library (jsdom)
- **Lint:** ESLint 10 + typescript-eslint

## Commands

```bash
npm install
npm run dev              # Electron dev
npm test                 # Vitest
npm run lint
npm run typecheck
npm run build            # out/
npm run postura:dist     # Linux AppImage
npm run dist:win         # Windows (needs wine on Linux)
npm run dist:mac         # macOS only
```

## Project Structure

```
src/
├── main/                # Electron main process (windows, IPC, storage, updater)
├── preload/             # contextBridge API (postureApp)
└── renderer/src/
    ├── components/      # React UI
    └── lib/             # posture, pose, alerts, settings, timeline, media
public/
├── models/              # pose_landmarker_lite.task
└── mediapipe/wasm/      # copied from @mediapipe/tasks-vision on build
landing-next/            # Marketing site (Next.js, separate deploy)
```

## Patterns

- **IPC:** preload exposes `window.postureApp`; main validates payloads; no `nodeIntegration`
- **Settings:** parsed in `storage.ts`, persisted via main `persistentStore` + localStorage fallback
- **Posture:** `analyzePosture` → smoother → watcher → alerts; thresholds from calibration
- **Security:** CSP in renderer; camera permission handlers in main; processing 100% local

## Release

```bash
git tag v1.0.0 && git push origin v1.0.0
```

GitHub Actions builds Linux/Windows/macOS and publishes draft releases.
