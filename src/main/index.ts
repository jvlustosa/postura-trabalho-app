import { app, BrowserWindow, ipcMain, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'node:path';

import { readJsonFile, writeJsonFile } from './persistentStore';
import { type AlertLevel, hidePostureAlert, showPostureAlert } from './postureAlertWindow';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const VALID_LEVELS: AlertLevel[] = ['warning', 'bad'];

const SETTINGS_FILE = 'settings.json';
const TIMELINE_FILE = 'timeline.json';

const writeQueue = new Map<string, Promise<void>>();

const queueWrite = (fileName: string, data: unknown): Promise<void> => {
  const previous = writeQueue.get(fileName) ?? Promise.resolve();
  const next = previous.then(() => writeJsonFile(fileName, data)).catch(() => undefined);
  writeQueue.set(fileName, next);
  return next;
};

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 620,
    title: 'Postura Trabalho',
    backgroundColor: '#07080d',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.on('closed', () => {
    hidePostureAlert();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
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
  });

  ipcMain.on('posture-alert:hide', () => {
    hidePostureAlert();
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
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === 'media';
  });

  registerIpcHandlers();
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
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
