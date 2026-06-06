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
  notify: (level: string, message: string): void => {
    ipcRenderer.send('posture-notify', { level, message });
  },
  enterMini: (): void => {
    ipcRenderer.send('posture-mini:enter');
  },
  exitMini: (): void => {
    ipcRenderer.send('posture-mini:exit');
  },
  onMiniActive: (cb: (active: boolean) => void): (() => void) => {
    const listener = (_event: unknown, active: unknown): void => cb(Boolean(active));
    ipcRenderer.on('posture-mini:active', listener);
    return (): void => {
      ipcRenderer.off('posture-mini:active', listener);
    };
  },
  updateFloating: (payload: { state: string; label: string; score: number }): void => {
    ipcRenderer.send('posture-floating:update', payload);
  },
  setAnalysisActive: (active: boolean): void => {
    ipcRenderer.send('posture-floating:set-active', active);
  },
  setFocusConfig: (config: { enabled: boolean; opacity: number }): void => {
    ipcRenderer.send('posture-floating:set-config', config);
  },
  restoreFromFloating: (): void => {
    ipcRenderer.send('posture-floating:restore');
  },
  showFloating: (): void => {
    ipcRenderer.send('posture-floating:show');
  },
  openFloatingMenu: (): void => {
    ipcRenderer.send('posture-floating:menu');
  },
  quit: (): void => {
    ipcRenderer.send('app:quit');
  },
  getAppInfo: (): Promise<{ name: string; version: string; platform: string }> =>
    ipcRenderer.invoke('app:get-info'),
  installUpdate: (): Promise<boolean> => ipcRenderer.invoke('app:install-update'),
  onUpdateStatus: (
    cb: (payload: { status: string; version: string | null }) => void,
  ): (() => void) => {
    const listener = (_event: unknown, payload: unknown): void => {
      if (typeof payload !== 'object' || payload === null) return;
      const { status, version } = payload as { status?: unknown; version?: unknown };
      cb({
        status: typeof status === 'string' ? status : 'idle',
        version: typeof version === 'string' ? version : null,
      });
    };
    ipcRenderer.on('app:update-status', listener);
    return (): void => {
      ipcRenderer.off('app:update-status', listener);
    };
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
