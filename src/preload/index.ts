import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('postureApp', {
  platform: process.platform,
  showAlert: (level: string, message: string): void => {
    ipcRenderer.send('posture-alert:show', { level, message });
  },
  hideAlert: (): void => {
    ipcRenderer.send('posture-alert:hide');
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
