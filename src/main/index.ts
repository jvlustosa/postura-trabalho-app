import { app, BrowserWindow, ipcMain, screen, session } from 'electron';
import electronUpdater from 'electron-updater';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readJsonFile, writeJsonFile } from './persistentStore';
import { type AlertLevel, hidePostureAlert, showPostureAlert } from './postureAlertWindow';

const { autoUpdater } = electronUpdater;

autoUpdater.logger = null;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const VALID_LEVELS: AlertLevel[] = ['warning', 'bad'];

const SETTINGS_FILE = 'settings.json';
const TIMELINE_FILE = 'timeline.json';

const writeQueue = new Map<string, Promise<void>>();

const MINI_WIDTH = 320;
const MINI_HEIGHT = 240;
const MINI_MARGIN = 16;

interface MiniSnapshot {
  bounds: Electron.Rectangle;
  alwaysOnTop: boolean;
  resizable: boolean;
  minSize: [number, number];
  hadFrame: boolean;
}

let mainWindow: BrowserWindow | null = null;
let miniSnapshot: MiniSnapshot | null = null;
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

  const display = screen.getDisplayMatching(window.getBounds());
  const { workArea } = display;
  const x = workArea.x + workArea.width - MINI_WIDTH - MINI_MARGIN;
  const y = workArea.y + workArea.height - MINI_HEIGHT - MINI_MARGIN;

  window.setMinimumSize(220, 160);
  window.setResizable(true);
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setBounds({ x, y, width: MINI_WIDTH, height: MINI_HEIGHT }, true);
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
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = window;

  window.on('closed', () => {
    hidePostureAlert();
    if (mainWindow === window) {
      mainWindow = null;
      miniSnapshot = null;
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  attachHardReloadShortcut(window);
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
  });

  ipcMain.on('posture-alert:hide', () => {
    hidePostureAlert();
  });

  ipcMain.on('posture-mini:enter', () => {
    enterMiniMode();
  });

  ipcMain.on('posture-mini:exit', () => {
    exitMiniMode();
  });

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:toggle-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
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
    }
  });
});

app.on('window-all-closed', () => {
  hidePostureAlert();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
