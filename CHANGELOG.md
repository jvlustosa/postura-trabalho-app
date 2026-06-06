# Changelog

All notable changes to PosturaCerta are documented in this file.

## [1.0.0] - 2026-06-06

### Added

- Desktop app for Linux, Windows and macOS with local MediaPipe pose detection
- Onboarding with calibration, sensitivity and screen height setup
- Posture alerts, floating window, mini PiP mode and timeline history
- CSV export of posture history
- Scheduled and on-launch auto-start of analysis
- Shared camera mode for coexistence with videoconference apps
- Camera device picker with virtual camera support (OBS, v4l2loopback)
- Auto-update via electron-updater with in-app restart prompt
- Privacy note and version info in settings

### Fixed

- ESLint CI failures (BOM in CSV export, build artifact ignores)
- Preload path for production builds (`.cjs`)
- PipeWire camera portal on Linux for shared webcam access
