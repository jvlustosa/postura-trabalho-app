import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('postureApp', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  showAlert: (level: string, message: string): void => {
    ipcRenderer.send('posture-alert:show', { level, message });
  },
  hideAlert: (): void => {
    ipcRenderer.send('posture-alert:hide');
  },
  enterMini: (): void => {
    ipcRenderer.send('posture-mini:enter');
  },
  exitMini: (): void => {
    ipcRenderer.send('posture-mini:exit');
  },
  window: {
    minimize: (): void => {
      ipcRenderer.send('window:minimize');
    },
    toggleMaximize: (): void => {
      ipcRenderer.send('window:toggle-maximize');
    },
    close: (): void => {
      ipcRenderer.send('window:close');
    },
  },
  storage: {
    readSettings: (): Promise<unknown> => ipcRenderer.invoke('storage:read-settings'),
    writeSettings: (data: unknown): Promise<void> =>
      ipcRenderer.invoke('storage:write-settings', data),
    readTimeline: (): Promise<unknown> => ipcRenderer.invoke('storage:read-timeline'),
    writeTimeline: (data: unknown): Promise<void> =>
      ipcRenderer.invoke('storage:write-timeline', data),
  },
});
