import { BrowserWindow, Menu, screen } from 'electron';

export interface FloatingState {
  state: string;
  label: string;
  score: number;
}

const FLOATING_WIDTH = 172;
const FLOATING_HEIGHT = 44;
const FLOATING_MARGIN = 16;

let floatingWindow: BrowserWindow | null = null;

const buildHtml = (): string => `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" />
    <title>Postura</title>
    <style>
      :root { color-scheme: dark; }
      html, body {
        margin: 0;
        height: 100%;
        font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
        background: transparent;
        color: #f7fafa;
        -webkit-user-select: none;
        user-select: none;
        cursor: pointer;
        overflow: hidden;
      }
      body {
        display: flex;
        align-items: center;
        padding: 6px;
      }
      .pill {
        flex: 1;
        height: 100%;
        display: grid;
        grid-template-columns: 14px 1fr auto auto;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        border-radius: 9999px;
        background: rgba(10, 12, 16, 0.82);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.38);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        transition: background 220ms ease, transform 160ms ease, opacity 160ms ease;
        opacity: 0.85;
      }
      .pill:hover { opacity: 1; transform: translateY(-1px); }
      .pill:active { transform: translateY(0); }
      .expand {
        font-size: 12px;
        font-weight: 700;
        opacity: 0;
        transform: translateX(-4px);
        transition: opacity 160ms ease, transform 160ms ease;
        line-height: 1;
      }
      .pill:hover .expand { opacity: 0.7; transform: translateX(0); }
      .drag {
        position: absolute;
        inset: 0;
        -webkit-app-region: drag;
        pointer-events: none;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #8a8f95;
        box-shadow: 0 0 8px currentColor;
      }
      .label {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .score {
        font-size: 13px;
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        opacity: 0.92;
      }
      .pill[data-state="good"] { background: rgba(20, 58, 36, 0.86); }
      .pill[data-state="good"] .dot { background: #5ee27a; color: #5ee27a; }
      .pill[data-state="warning"] { background: rgba(80, 55, 12, 0.88); }
      .pill[data-state="warning"] .dot { background: #ffc857; color: #ffc857; }
      .pill[data-state="bad"] { background: rgba(96, 12, 18, 0.92); }
      .pill[data-state="bad"] .dot { background: #ff6b78; color: #ff6b78; }
      .pill[data-state="calibrating"] .dot,
      .pill[data-state="inactive"] .dot,
      .pill[data-state="camera-error"] .dot,
      .pill[data-state="model-error"] .dot {
        background: #9aa0a6;
        color: #9aa0a6;
      }
      .pill[data-state="calibrating"] .dot { animation: pulse 1.2s ease-in-out infinite; }
      @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    </style>
  </head>
  <body>
    <div class="pill" id="pill" data-state="calibrating" title="Clique para abrir o app • Botão direito para mais opções">
      <span class="dot" aria-hidden="true"></span>
      <span class="label" id="label">Calibrando</span>
      <span class="score" id="score">—</span>
      <span class="expand" aria-hidden="true">⤢</span>
    </div>
    <div class="drag" aria-hidden="true"></div>
    <script>
      window.__setFloating = function (payload) {
        try {
          var pill = document.getElementById('pill');
          var label = document.getElementById('label');
          var score = document.getElementById('score');
          if (!pill || !label || !score) return;
          if (payload && typeof payload === 'object') {
            if (typeof payload.state === 'string') pill.setAttribute('data-state', payload.state);
            if (typeof payload.label === 'string') label.textContent = payload.label;
            if (typeof payload.score === 'number' && isFinite(payload.score)) {
              score.textContent = Math.round(payload.score) + '';
            } else {
              score.textContent = '—';
            }
          }
        } catch (error) {
          // ignore
        }
      };
      var pill = document.getElementById('pill');
      if (pill) {
        pill.addEventListener('click', function () {
          if (window.postureApp && window.postureApp.restoreFromFloating) {
            window.postureApp.restoreFromFloating();
          }
        });
        pill.addEventListener('contextmenu', function (event) {
          event.preventDefault();
          if (window.postureApp && window.postureApp.openFloatingMenu) {
            window.postureApp.openFloatingMenu();
          }
        });
      }
    </script>
  </body>
</html>`;

const positionBottomRight = (window: BrowserWindow): void => {
  const display = screen.getPrimaryDisplay();
  const { workArea } = display;
  const x = workArea.x + workArea.width - FLOATING_WIDTH - FLOATING_MARGIN;
  const y = workArea.y + workArea.height - FLOATING_HEIGHT - FLOATING_MARGIN;
  window.setPosition(x, y);
};

export const showPostureFloating = (preloadPath: string): void => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.showInactive();
    return;
  }

  const window = new BrowserWindow({
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
    frame: false,
    resizable: false,
    movable: true,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    focusable: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setIgnoreMouseEvents(false);
  positionBottomRight(window);

  window.on('closed', () => {
    if (floatingWindow === window) {
      floatingWindow = null;
    }
  });

  void window
    .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildHtml())}`)
    .then(() => {
      if (!window.isDestroyed()) {
        window.showInactive();
      }
    })
    .catch(() => undefined);

  floatingWindow = window;
};

export const hidePostureFloating = (): void => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.destroy();
  }
  floatingWindow = null;
};

export const updatePostureFloating = (payload: FloatingState): void => {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    return;
  }

  const safePayload = JSON.stringify(payload);

  floatingWindow.webContents
    .executeJavaScript(`window.__setFloating && window.__setFloating(${safePayload})`)
    .catch(() => undefined);
};

export const isPostureFloatingVisible = (): boolean =>
  Boolean(floatingWindow && !floatingWindow.isDestroyed() && floatingWindow.isVisible());

export const openFloatingMenu = (
  options: { onRestore: () => void; onQuit: () => void },
): void => {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;

  const menu = Menu.buildFromTemplate([
    {
      label: 'Abrir Postura Trabalho',
      click: () => options.onRestore(),
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => options.onQuit(),
    },
  ]);

  menu.popup({ window: floatingWindow });
};
