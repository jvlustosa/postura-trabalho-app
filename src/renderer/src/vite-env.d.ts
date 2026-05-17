/// <reference types="vite/client" />

interface PostureStorageBridge {
  readSettings: () => Promise<unknown>;
  writeSettings: (data: unknown) => Promise<void>;
  readTimeline: () => Promise<unknown>;
  writeTimeline: (data: unknown) => Promise<void>;
}

interface PostureFloatingPayload {
  state: string;
  label: string;
  score: number;
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
    notify?: (level: 'warning' | 'bad', message: string) => void;
    enterMini?: () => void;
    exitMini?: () => void;
    updateFloating?: (payload: PostureFloatingPayload) => void;
    setAnalysisActive?: (active: boolean) => void;
    restoreFromFloating?: () => void;
    showFloating?: () => void;
    openFloatingMenu?: () => void;
    quit?: () => void;
    window?: {
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
    };
    storage?: PostureStorageBridge;
  };
}
