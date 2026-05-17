import { app, BrowserWindow, ipcMain, Notification, screen, session } from 'electron';
import electronUpdater from 'electron-updater';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readJsonFile, writeJsonFile } from './persistentStore';
import { type AlertLevel, hidePostureAlert, showPostureAlert } from './postureAlertWindow';
import {
  type FloatingState,
  hidePostureFloating,
  isPostureFloatingVisible,
  openFloatingMenu,
  setPostureFloatingOpacity,
  showPostureFloating,
  updatePostureFloating,
} from './postureFloatingWindow';

const { autoUpdater } = electronUpdater;

autoUpdater.logger = null;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const VALID_LEVELS: AlertLevel[] = ['warning', 'bad'];
const NOTIFICATION_TITLES: Record<AlertLevel, string> = {
  warning: 'Atenção à postura',
  bad: 'Hora de ajustar a postura',
};

const SETTINGS_FILE = 'settings.json';
const TIMELINE_FILE = 'timeline.json';

const writeQueue = new Map<string, Promise<void>>();

const MINI_WIDTH = 320;
const MINI_HEIGHT = 240;
const MINI_MARGIN = 16;

const PRELOAD_PATH = join(__dirname, '../preload/index.js');

interface MiniSnapshot {
  bounds: Electron.Rectangle;
  alwaysOnTop: boolean;
  resizable: boolean;
  minSize: [number, number];
  hadFrame: boolean;
}

let mainWindow: BrowserWindow | null = null;
let miniSnapshot: MiniSnapshot | null = null;
let isQuitting = false;
let analysisActive = false;
let floatingEnabled = true;
let floatingOpacity = 0.85;
let lastFloatingState: FloatingState = { state: 'inactive', label: 'Inativo', score: 0 };
/** True after electron-updater fetched a build; Ctrl/Cmd+Shift+R then restarts into the new version. */
let updateDownloaded = false;

const attachHardReloadShortcut = (window: BrowserWindow): void => {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const hardReload = (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'r';
    if (!hardReload) return;

    event.preventDefault();

    if (app.isPackaged && updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
      return;
    }

    void window.webContents.reloadIgnoringCache();
  });
};

const applyMiniLayout = (window: BrowserWindow): void => {
  if (window.isDestroyed() || !miniSnapshot) return;

  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { workArea } = display;
  const x = Math.round(workArea.x + workArea.width - MINI_WIDTH - MINI_MARGIN);
  const y = Math.round(workArea.y + workArea.height - MINI_HEIGHT - MINI_MARGIN);

  window.setMinimumSize(220, 160);
  window.setResizable(true);
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setBounds({ x, y, width: MINI_WIDTH, height: MINI_HEIGHT }, true);
};

const enterMiniMode = (): void => {
  const window = mainWindow;
  if (!window || window.isDestroyed() || miniSnapshot) return;

  miniSnapshot = {
    bounds: window.getBounds(),
    alwaysOnTop: window.isAlwaysOnTop(),
    resizable: window.isResizable(),
    minSize: window.getMinimumSize() as [number, number],
    hadFrame: true,
  };

  const needDeferredLayout = window.isMaximized() || window.isFullScreen();
  if (window.isMaximized()) {
    window.unmaximize();
  }
  if (window.isFullScreen()) {
    window.setFullScreen(false);
  }

  if (needDeferredLayout) {
    setTimeout(() => applyMiniLayout(window), 120);
  } else {
    applyMiniLayout(window);
  }
};

const exitMiniMode = (): void => {
  const window = mainWindow;
  if (!window || window.isDestroyed() || !miniSnapshot) return;

  const snap = miniSnapshot;
  miniSnapshot = null;

  window.setAlwaysOnTop(snap.alwaysOnTop);
  window.setVisibleOnAllWorkspaces(false);
  window.setMinimumSize(snap.minSize[0], snap.minSize[1]);
  window.setResizable(snap.resizable);
  window.setBounds(snap.bounds, true);
};

const restoreMainWindow = (): void => {
  const window = mainWindow;
  if (!window || window.isDestroyed()) return;
  if (!window.isVisible()) window.show();
  if (window.isMinimized()) window.restore();
  window.focus();
  hidePostureFloating();
};

const sendToBackground = (): void => {
  const window = mainWindow;
  if (!window || window.isDestroyed()) return;
  if (miniSnapshot) exitMiniMode();
  hidePostureAlert();
  if (window.isVisible()) window.hide();
  showPostureFloating(PRELOAD_PATH, floatingOpacity);
  updatePostureFloating(lastFloatingState);
};

const quitApp = (): void => {
  isQuitting = true;
  hidePostureFloating();
  hidePostureAlert();
  app.quit();
};

const queueWrite = (fileName: string, data: unknown): Promise<void> => {
  const previous = writeQueue.get(fileName) ?? Promise.resolve();
  const next = previous.then(() => writeJsonFile(fileName, data)).catch(() => undefined);
  writeQueue.set(fileName, next);
  return next;
};

const isAppRendererUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('file:')) return true;
  const dev = process.env.ELECTRON_RENDERER_URL;
  return typeof dev === 'string' && dev.length > 0 && url.startsWith(dev);
};

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 620,
    title: 'Postura Trabalho',
    backgroundColor: '#07080d',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  mainWindow = window;

  window.on('close', (event) => {
    if (isQuitting) return;
    if (!floatingEnabled) {
      quitApp();
      return;
    }
    event.preventDefault();
    sendToBackground();
  });

  window.on('closed', () => {
    hidePostureAlert();
    hidePostureFloating();
    if (mainWindow === window) {
      mainWindow = null;
      miniSnapshot = null;
    }
  });

  window.on('show', () => {
    hidePostureFloating();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  attachHardReloadShortcut(window);
};

const showNativeNotification = (level: AlertLevel, message: string): void => {
  if (!Notification.isSupported()) return;
  try {
    const notification = new Notification({
      title: NOTIFICATION_TITLES[level],
      body: message,
      silent: false,
      urgency: level === 'bad' ? 'critical' : 'normal',
    });
    notification.on('click', () => restoreMainWindow());
    notification.show();
  } catch {
    // older Linux desktops may throw; fail silently
  }
};

const registerIpcHandlers = (): void => {
  ipcMain.on('posture-alert:show', (_event, payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) return;

    const { level, message } = payload as { level?: unknown; message?: unknown };
    const alertLevel: AlertLevel =
      typeof level === 'string' && VALID_LEVELS.includes(level as AlertLevel)
        ? (level as AlertLevel)
        : 'bad';
    const alertMessage =
      typeof message === 'string' ? message : 'Reajuste sua postura.';

    showPostureAlert(alertLevel, alertMessage);

    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      showNativeNotification(alertLevel, alertMessage);
    }
  });

  ipcMain.on('posture-alert:hide', () => {
    hidePostureAlert();
  });

  ipcMain.on('posture-notify', (_event, payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) return;
    const { level, message } = payload as { level?: unknown; message?: unknown };
    const lvl: AlertLevel =
      typeof level === 'string' && VALID_LEVELS.includes(level as AlertLevel)
        ? (level as AlertLevel)
        : 'bad';
    const msg = typeof message === 'string' ? message : 'Reajuste sua postura.';
    showNativeNotification(lvl, msg);
  });

  ipcMain.on('posture-floating:update', (_event, payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) return;
    const { state, label, score } = payload as {
      state?: unknown;
      label?: unknown;
      score?: unknown;
    };
    lastFloatingState = {
      state: typeof state === 'string' ? state : lastFloatingState.state,
      label: typeof label === 'string' ? label : lastFloatingState.label,
      score: typeof score === 'number' && Number.isFinite(score) ? score : lastFloatingState.score,
    };
    if (isPostureFloatingVisible()) {
      updatePostureFloating(lastFloatingState);
    }
  });

  ipcMain.on('posture-floating:set-active', (_event, active: unknown) => {
    analysisActive = Boolean(active);
    if (!analysisActive && isPostureFloatingVisible()) {
      hidePostureFloating();
    }
  });

  ipcMain.on('posture-floating:set-config', (_event, payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) return;
    const { enabled, opacity } = payload as { enabled?: unknown; opacity?: unknown };
    if (typeof enabled === 'boolean') {
      floatingEnabled = enabled;
    }
    if (typeof opacity === 'number' && Number.isFinite(opacity)) {
      floatingOpacity = Math.min(1, Math.max(0.3, opacity));
      setPostureFloatingOpacity(floatingOpacity);
    }
  });

  ipcMain.on('posture-floating:restore', () => {
    restoreMainWindow();
  });

  ipcMain.on('posture-floating:show', () => {
    sendToBackground();
  });

  ipcMain.on('posture-floating:menu', () => {
    openFloatingMenu({
      onRestore: () => restoreMainWindow(),
      onQuit: () => quitApp(),
    });
  });

  ipcMain.on('posture-mini:enter', () => {
    enterMiniMode();
  });

  ipcMain.on('posture-mini:exit', () => {
    exitMiniMode();
  });

  const senderWindow = (event: Electron.IpcMainEvent): BrowserWindow | null => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      return win;
    }
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  };

  ipcMain.on('window:minimize', (event) => {
    senderWindow(event)?.minimize();
  });

  ipcMain.on('window:toggle-maximize', (event) => {
    const win = senderWindow(event);
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('window:close', (event) => {
    const win = senderWindow(event);
    if (!win) return;
    if (win === mainWindow && analysisActive) {
      sendToBackground();
      return;
    }
    win.close();
  });

  ipcMain.on('app:quit', () => {
    quitApp();
  });

  ipcMain.handle('storage:read-settings', async () => {
    return readJsonFile(SETTINGS_FILE);
  });

  ipcMain.handle('storage:write-settings', async (_event, payload: unknown) => {
    await queueWrite(SETTINGS_FILE, payload);
  });

  ipcMain.handle('storage:read-timeline', async () => {
    return readJsonFile(TIMELINE_FILE);
  });

  ipcMain.handle('storage:write-timeline', async (_event, payload: unknown) => {
    await queueWrite(TIMELINE_FILE, payload);
  });
};

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const pageUrl = webContents.getURL();
    // Chromium may emit a follow-up request as `unknown`; denying it breaks getUserMedia
    // when a handler is registered (see electron#36629).
    const granted =
      permission === 'media' || (permission === 'unknown' && isAppRendererUrl(pageUrl));
    console.log('[main] permission request', { permission, pageUrl, details, granted });
    callback(granted);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const url = webContents?.getURL() ?? '';
    const granted =
      permission === 'media' ||
      ((details.mediaType === 'video' || details.mediaType === 'audio') && isAppRendererUrl(url));
    console.log('[main] permission check', { permission, requestingOrigin, details, granted });
    return granted;
  });

  registerIpcHandlers();
  createWindow();

  if (app.isPackaged && existsSync(join(process.resourcesPath, 'app-update.yml'))) {
    autoUpdater.on('update-downloaded', () => {
      updateDownloaded = true;
    });
    void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow && !mainWindow.isVisible()) {
      restoreMainWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  hidePostureAlert();
  hidePostureFloating();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
