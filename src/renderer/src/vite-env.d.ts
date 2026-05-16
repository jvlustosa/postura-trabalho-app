/// <reference types="vite/client" />

interface PostureStorageBridge {
  readSettings: () => Promise<unknown>;
  writeSettings: (data: unknown) => Promise<void>;
  readTimeline: () => Promise<unknown>;
  writeTimeline: (data: unknown) => Promise<void>;
}

interface Window {
  postureApp?: {
    platform: NodeJS.Platform;
    versions?: {
      electron: string;
      chrome: string;
    };
    showAlert: (level: 'warning' | 'bad', message: string) => void;
    hideAlert: () => void;
    enterMini?: () => void;
    exitMini?: () => void;
    window?: {
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
    };
    storage?: PostureStorageBridge;
  };
}
